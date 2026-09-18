# Halpal client-side state inventory — backend migration target

Read-only audit of everything currently held in React state (`store.tsx`,
`AppMode.tsx`, screen-local `useState`) and static mock data
(`mockData.ts`), as of the current codebase. Intent: a precise map of what
a real backend has to reproduce — data shapes, the business logic that
currently guards mutations, and the shortcuts taken because this is a
single-user, single-role-pair demo. Nothing here is prescriptive about
Firebase vs. Supabase beyond the Realtime Requirements section; it's the
input to that decision, not the decision itself.

---

## Entities

### "User" — there is no unified User type

Halpal has no `User` interface. Identity is split across two untyped/lightly-typed constructs that are never connected to any auth mechanism:

#### `currentCustomer` (mockData.ts:3-6) — **not a typed interface at all**
```ts
export const currentCustomer = { id: 'cust_1', fullName: 'Adithya R.' };
```
| Field | Type | Set/mutated by |
|---|---|---|
| `id` | `string` | Hardcoded literal `'cust_1'` at module load. **Never mutated anywhere in the codebase.** |
| `fullName` | `string` | Hardcoded literal `'Adithya R.'`. Never mutated. |

**Hardcoded singleton, flagged prominently:** this is the single most load-bearing hardcoded value in the app. Every `Job`'s implicit ownership, every `Chat.customerId`, every `BookingRequest.customerId` resolves back to this one literal string, because it's the only customer identity that exists. `Job` itself has **no `customerId` field** — ownership is entirely implicit, via the comment in `MyActivityScreen.tsx:36`: `// in this mock, all posted jobs belong to the current customer`. A real backend needs an actual `customers`/`users` table and a real `customerId` FK on `Job`; today there's nothing to generalize *from* except this constant.

#### `currentWorker: WorkerSummary` (mockData.ts:8-17) — typed, but still a hardcoded singleton
Uses the `WorkerSummary` interface (models.ts:26-35), same shape as every NPC worker:

| Field | Type | Set/mutated by |
|---|---|---|
| `id` | `string` | Hardcoded `'work_1'` at module load. Never mutated. |
| `fullName` | `string` | Hardcoded `'Adithya R.'` (same string as `currentCustomer.fullName` — same human, two hats, by design). Never mutated. |
| `avatarColor` | `string` | Hardcoded hex string. Comment: "placeholder instead of a photo asset." Never mutated — no photo upload exists. |
| `isVerified` | `boolean` | **Not actually mutated on this object.** See below — a separate store boolean shadows it. |
| `avgRating` | `number` | Hardcoded seed value (`4.8`). **Never mutated by anything** — no rating-submission code path writes back to any worker's `avgRating`, including the review UI built in JobDetailScreen (see Known Gaps). |
| `totalJobsCompleted` | `number` | Hardcoded seed value (`14`). Never incremented, including when a job reaches `confirmed_completed`. |
| `skills` | `string[]` | Hardcoded seed array. No edit UI. |
| `bio` | `string` | Hardcoded seed string. No edit UI. |

**Hardcoded singleton:** there is exactly one interactive worker identity in the entire app (`work_1`), imported as a module constant, not selected via login. `LoginScreen`'s phone/password fields (local `useState`, LoginScreen.tsx:19-20) are captured but **never validated, never associated with any record, and never read by anything else** — "Continue" (`handleContinue`, LoginScreen.tsx:22-24) just calls `navigation.replace('Tabs')`. Auth is entirely decorative today.

**The `isVerified` indirection:** `currentWorker.isVerified` (the object field) is set once at import time and never touched again. The actual "am I verified" truth the app uses lives in a **separate** store boolean, `currentWorkerVerified` (store.tsx:39), seeded from `currentWorker.isVerified` and flipped only by `verifyCurrentWorker()` (store.tsx:271-273, one-way: `setCurrentWorkerVerified(true)`, no un-verify path). Every screen reads the store boolean, not the object field. A real schema should collapse this into one `users.is_verified` column — the current split is a client-side artifact of `currentWorker` being an immutable imported constant rather than real fetched/updatable state.

The four NPC `WorkerSummary` records (`work_2`–`work_5`, mockData.ts:19-60) are static seed data with **no path that ever creates a new one** — there's no "sign up as a worker" flow.

### Job (models.ts:37-51)

| Field | Type | Set/mutated by |
|---|---|---|
| `id` | `string` | Set at creation: `` `job_${Date.now()}` `` in both `PostJobScreen.submit()` (PostJobScreen.tsx:49) and `store.confirmBooking` (store.tsx:180). **Millisecond-timestamp ID — collision-prone** under rapid double-submission; a real backend must replace with a real ID generator/PK. |
| `description` | `string` | Set at creation only (free text from `PostJobScreen`, or copied verbatim from `WorkerOffering.description` in `confirmBooking`, store.tsx:181). No edit path exists after creation. |
| `categoryTags` | `JobCategory[]` | Set at creation (multi-select array from `PostJobScreen`, or copied from the offering's `categoryTags` in `confirmBooking`). Never mutated after creation. |
| `budgetMin` / `budgetMax` | `number` | Set at creation. `PostJobScreen` enforces `budgetMin < budgetMax` (client-side only). `confirmBooking` sets **both equal to `offering.rate`** (store.tsx:183-184) — a booking-derived job has no real range, just a fixed price duplicated into both fields. Never mutated after creation. |
| `urgency` | `'asap' \| 'scheduled'` | Set at creation. `confirmBooking` **always hardcodes `'scheduled'`** (store.tsx:185) regardless of what the offering actually represents — booking-derived jobs don't capture real urgency. |
| `scheduledDatetime?` | `string` | Optional. Only ever set via `PostJobScreen`'s free-text field (raw string, not a parsed/validated date) when `urgency === 'scheduled'`. `confirmBooking` never sets it — booking-derived jobs have no time at all; the actual time gets negotiated in chat, per `locationLabel` below. |
| `locationLabel` | `string` | Set at creation from free text (`PostJobScreen`), **or hardcoded literal `'To be confirmed in chat'`** for `confirmBooking`-spawned jobs (store.tsx:186) — `WorkerOffering` has no location field of its own, so this is a genuine data gap, not a placeholder pending future wiring. |
| `status` | `JobStatus` | The central state machine field. Mutated by 7 different store functions — see State Transitions below. |
| `moderationStatus` | `'not_required' \| 'pending_review' \| 'approved' \| 'rejected'` | Set **once**, at creation, by `addJob` (store.tsx:50-52): `'pending_review'` if `categoryTags.includes('Other')`, else `'not_required'`. `confirmBooking` always sets `'not_required'` directly (store.tsx:188). **Never mutated after creation by anything** — there is no moderation/admin UI anywhere that flips a `pending_review` job to `approved`/`rejected`. A job tagged `'Other'` is permanently stuck out of the feed unless something edits state out-of-band. |
| `origin` | `'customer_posted' \| 'worker_offered'` | Set once at creation (`PostJobScreen` always `'customer_posted'`; `confirmBooking` always `'worker_offered'`). Never mutated. |
| `createdAt` | `string` | ISO timestamp set at creation. Never mutated. |
| `applicantCount` | `number` | Incremented by `addApplication` (`+1` per new application, store.tsx:275-284). **Never decremented** — there's no application-removal path, so this is safe in practice, but it's a stored counter that duplicates what `applications[jobId].length` could compute live. See Derived Values. |

**Missing field, not flagged elsewhere:** `Job` has no `customerId`. See `currentCustomer` above.

### JobApplication (models.ts:53-61)

| Field | Type | Set/mutated by |
|---|---|---|
| `id` | `string` | `` `app_${Date.now()}` `` at creation (JobDetailScreen.tsx:76). Same timestamp-collision caveat as `Job.id`. |
| `jobId` | `string` | Set once at creation, references `Job.id`. Never mutated. |
| `worker` | `WorkerSummary` | **A full embedded snapshot**, not a `workerId` reference — see Relationships. Built once at submission time (JobDetailScreen.tsx:78: `{ ...currentWorker, isVerified: currentWorkerVerified }`) and never refreshed. |
| `quotedRate` | `number` | Set at creation from the applicant's typed input (or defaults to `job.budgetMin`). Never mutated. |
| `note?` | `string` | Optional, set at creation. Never mutated. |
| `status` | `ApplicationStatus` (`'applied'\|'shortlisted'\|'accepted'\|'rejected'`) | Mutated **exclusively** by `setApplicationStatus(jobId, appId, status)` — the only writer. |
| `appliedAt` | `string` | ISO timestamp, set once. Never mutated. |

### WorkerOffering (models.ts:94-108)

| Field | Type | Set/mutated by |
|---|---|---|
| `id` | `string` | Static seed IDs only (`off_1`/`off_2`/`off_3`, mockData.ts:186-221). `addOffering(offering)` exists in the store (store.tsx:267-269) and is exported through context, but **is never called from any screen** — there is no "create an offering" UI anywhere in the app. Confirmed by grep: the only occurrences of `addOffering` in `src/` are its own definition and its export. |
| `worker` | `WorkerSummary` | Embedded snapshot, same denormalization pattern as `JobApplication.worker` — see Relationships. Static, never refreshed. |
| `title` | `string` | Static seed data. |
| `description` | `string` | Static seed data. |
| `categoryTags` | `JobCategory[]` | Static seed data. |
| `pricingType` | `'platform_suggested' \| 'custom'` | Static. The only code that branches on it is a display condition in `OfferingCard` (WorkerCards.tsx:90): `pricingType === 'custom' && moderationStatus === 'pending_review'` shows an "IN REVIEW" tag — a condition that can currently never be true (see next row). |
| `rate` | `number` | Static. Consumed by `confirmBooking` to set the spawned `Job.budgetMin`/`budgetMax` (both equal to `rate`). |
| `moderationStatus` | same union as `Job.moderationStatus` | Static seed values only (`'not_required'` or `'approved'`). **No code path ever sets `'pending_review'` or `'rejected'`** — already documented in-repo via a comment at models.ts:102-105. |
| `status` | `'active' \| 'inactive'` | Static. No UI to deactivate/reactivate. |

### BookingRequest (models.ts:86-92)

| Field | Type | Set/mutated by |
|---|---|---|
| `id` | `string` | `` `book_${Date.now()}` `` at creation (store.tsx:148). Same timestamp-collision caveat. |
| `offeringId` | `string` | Real FK to `WorkerOffering.id`, set once. |
| `customerId` | `string` | Passed in by the caller — but the only call site (`OfferingDetailScreen.handleRequestBooking`, OfferingDetailScreen.tsx:24) always passes `currentCustomer.id`. Another instance of the hardcoded-singleton pattern, just threaded through a parameter instead of imported directly. |
| `status` | `'pending' \| 'confirmed' \| 'declined' \| 'cancelled'` | `'pending'` at creation. `confirmBooking` → `'confirmed'`. `declineBooking` → `'declined'` and `cancelBooking` → `'cancelled'` **both exist in the store and are exported, but neither has a UI call site anywhere** — confirmed by grep. Only the confirm path is actually reachable from the app today. |
| `createdAt` | `string` | Set once, never mutated. |

### Chat (models.ts:63-75)

| Field | Type | Set/mutated by |
|---|---|---|
| `id` | `string` | Deterministic: `` `chat_${jobId}` `` (job-accept path) or `` `chat_${bookingRequest.id}` `` (booking path). **Not timestamp-based** — collision-safe by construction, unlike every other entity's ID scheme here. Worth preserving this property in the real schema. |
| `jobId?` | `string` | Optional. Set at creation on the job-accept path (`createChatIfMissing`, store.tsx:78-92); **backfilled later** on the booking path when `confirmBooking` runs (store.tsx:198-200). See Relationships for the dual-path cardinality question this raises. |
| `bookingRequestId?` | `string` | Optional. Set only on the booking-request creation path (store.tsx:158). **Retained permanently** even after `confirmBooking` backfills `jobId` — a confirmed booking's chat ends up with *both* fields populated simultaneously. Deliberate (documented in a code comment), but worth flagging as a "dual-parent" shape a relational schema needs to represent explicitly (e.g. two nullable FK columns, not an either/or). |
| `customerId` / `workerId` | `string` | Set once at creation. Never mutated. |
| `createdAt` | `string` | Set once. |
| `lastMessageAt` | `string` | Mutated by `sendMessage` on every message — both the user's own message and the scheduled auto-reply (store.tsx:112, 130). A denormalized "last activity" field, used only for `MessagesScreen`'s sort order. |

### Message (models.ts:77-84)

| Field | Type | Set/mutated by |
|---|---|---|
| `id` | `string` | `` `msg_${Date.now()}` `` for user messages, `` `msg_${Date.now()}_auto` `` for the canned reply. Same timestamp-collision caveat as other entities (the `_auto` suffix only prevents colliding with a user message sent in the very same millisecond, nothing more general). |
| `chatId` | `string` | FK to `Chat.id`, set once. |
| `senderId` | `string` | Set once — either the chat's `customerId` or `workerId`. |
| `text` | `string` | Set once. No edit/delete path. |
| `sentAt` | `string` | Set once. |
| `read` | `boolean` | Mutated exclusively by `markChatRead(chatId, userId)` — flips `true` for every message **not** sent by `userId`. One-directional: nothing ever flips it back to `false`. |

### Ungoverned state with no dedicated type

**`otpByJob: Record<string, string>`** (store.tsx:43) — a jobId → 6-digit-OTP map, not part of the `Job` interface at all. Written unconditionally by `markJobComplete` (see the guard-precision note under State Transitions), read by `confirmJobCompletion`. **Security-shaped gap worth flagging now, before this gets naively ported:** the expected OTP is stored in ordinary client state and displayed directly to whichever role is in "worker mode" at that moment (JobDetailScreen.tsx:152-154). A real backend must **never** hand the expected OTP value to any client — it should generate it, deliver it out-of-band (SMS, push), and validate the guess server-side only. Copying this map onto a server table without changing that exposure model defeats the purpose of an OTP.

---

## Relationships

- **Job ↔ Chat: at most one, enforced by construction, not by a database constraint.** `Chat.id` is deterministic (`chat_${jobId}`), and every creation path (`createChatIfMissing`, `ensureChatForJob`, `confirmBooking`'s backfill) either finds-or-creates by searching `chats.find(c => c.jobId === jobId)` first. **Nothing in the type system enforces one-chat-per-job** — `Chat.jobId` is just a plain optional string field, not a unique key. If two code paths ever raced to create a chat for the same job before either write landed (a real risk once this moves off single-threaded client state and onto a server with concurrent requests), you'd get two `Chat` rows with the same `jobId` and no code anywhere handles that — `ensureChatForJob`'s `chats.find(...)` would just return whichever one appears first in the array, silently orphaning the other. **A real schema needs a unique constraint on `Chat.jobId` (nullable-unique) and `Chat.bookingRequestId` (nullable-unique)**, which the current code has never needed because it's single-threaded.
- **Job ↔ JobApplication: one-to-many**, keyed by `JobApplication.jobId`. Stored today as `Record<jobId, JobApplication[]>` (store.tsx:37) rather than a flat table — the backend equivalent is a normal FK, this is just how the client shapes its local cache.
- **JobApplication → WorkerSummary: embedded snapshot, not a foreign key.** `JobApplication.worker` is a full copy of the `WorkerSummary` object at submission time, not a `workerId` reference. Confirmed by `JobDetailScreen.tsx:78`, which spreads `currentWorker` inline. **This means an application's displayed rating/verification/skills never update** even if the underlying worker's record changes later. Same pattern exists for `WorkerOffering.worker`. This is the single biggest relational-modeling decision the migration has to make explicitly: keep the denormalized snapshot (if "what the worker looked like when they applied" is intentionally historical), or replace with a real `workerId` FK + join (if it should always reflect current worker state). The current code gives no signal that snapshotting was a deliberate product decision — it reads as an artifact of not having a normalized worker store to reference.
- **BookingRequest → WorkerOffering: many-to-one**, via `offeringId`, a real FK. **BookingRequest → Job: informal, one-to-at-most-one**, but only via the Chat that bridges them — there is no direct field on `BookingRequest` pointing to the `Job` that `confirmBooking` spawns; you have to go `BookingRequest → Chat.bookingRequestId → Chat.jobId → Job`. A real schema might want a direct `BookingRequest.resultingJobId` instead of forcing that hop through Chat.
- **Chat → BookingRequest: at most one**, via `bookingRequestId`, and — per the dual-parent note above — this reference **survives** the chat also acquiring a `jobId`. So post-confirmation, a single `Chat` legitimately has non-null values in both parent-reference fields simultaneously. Any relational schema must allow that (not an either/or check constraint).
- **Chat → Message: one-to-many**, keyed by `Message.chatId`. Stored as `Record<chatId, Message[]>` (store.tsx:41), same client-cache-shape-vs-real-FK distinction as Job/JobApplication above.
- **Job/Chat/BookingRequest → "customer": all resolve to the same hardcoded string**, not a real relationship today (see Entities). There is only one customer to reference, so the cardinality question ("can a job have exactly one customer, always?") is currently untestable — the code has never had to handle a second customer.

---

## State transitions / mutating actions

Every state-mutating function in `store.tsx`, grouped by the entity it primarily writes.

### Job

- **`addJob(job: Omit<Job, 'moderationStatus'>)`** (store.tsx:46-54) — Input: a full job minus `moderationStatus`. Guard: none on the input itself. Logic: computes `moderationStatus = categoryTags.includes('Other') ? 'pending_review' : 'not_required'`, then prepends to `jobs`. **This is the only place `moderationStatus` is ever set**, and it happens exactly once, at creation.
- **`setApplicationStatus(jobId, appId, status)`** (store.tsx:56-76) — see under JobApplication below; also mutates `Job.status → 'worker_selected'` and triggers chat creation when `status === 'accepted'`.
- **`startJob(jobId)`** (store.tsx:215-219) — Input: `jobId`. Guard: `j.status === 'worker_selected'` (transition is a no-op otherwise — silently ignored, not an error). Effect: `status → 'in_progress'`.
- **`markJobComplete(jobId)`** (store.tsx:221-232) — Input: `jobId`. **Guard precision matters here and is currently inconsistent**: the OTP write (`setOtpByJob`) runs **unconditionally**, with no status check at all; only the subsequent `status → 'awaiting_confirmation'` transition is guarded on `j.status === 'in_progress'`. So calling this on a job in any other status silently generates/overwrites an OTP for it with zero visible effect (no error, no status change) — the two effects are not atomic and can diverge. A real backend endpoint must guard the OTP generation itself, not just the status write.
- **`confirmJobCompletion(jobId, enteredOtp): boolean`** (store.tsx:234-249) — Input: `jobId`, the customer's typed code. Three sequential guards, **all must pass or it returns `false` and nothing is written**:
  1. `job.status === 'awaiting_confirmation'` (else `return false`)
  2. **Customer-match check**: looks up the job's `Chat` by `jobId`, then requires `chat.customerId === currentCustomer.id` (else `return false`) — this is the only place in the codebase that checks "is the caller actually the posting customer," and it does so indirectly via the chat record, because `Job` has no `customerId` of its own.
  3. `otpByJob[jobId] === enteredOtp` (exact string match; missing OTP or mismatch → `return false`)
  Effect on success only: `status → 'confirmed_completed'`, returns `true`. **The mismatch path is a real rejection, not a silent pass-through** — confirmed by JobDetailScreen surfacing the `false` as a visible "That code doesn't match" error.
- **`raiseDispute(jobId)`** (store.tsx:251-255) — Guard: `j.status === 'awaiting_confirmation'`. Effect: `status → 'disputed'`. No side effects beyond the status change (no dispute record, no notification).
- **`cancelJob(jobId)`** (store.tsx:257-265) — Guard: `j.status` is one of `'open' | 'applications_received' | 'worker_selected'`. Effect: `status → 'cancelled'`. **Exists, correctly guarded, but has no UI call site anywhere in `src/screens`** — confirmed by grep.

### JobApplication

- **`addApplication(jobId, application)`** (store.tsx:275-284) — Input: a full `JobApplication` object built by the caller (JobDetailScreen embeds the worker snapshot before calling this — the store does no validation of its own). Guard: none. Effect: appends to `applications[jobId]`, and **also** mutates the parent `Job`: `applicantCount + 1` and `status → 'applications_received'` unconditionally (even if the job was already past `'open'`/`'applications_received'` — there's no guard preventing a second application from resetting status backward from something further along, though in practice the UI only offers the apply form while the job is in an applicable status).
- **`setApplicationStatus(jobId, appId, status)`** (store.tsx:56-76) — Input: target application id and the new `ApplicationStatus`. Guard: none on the status value itself (any `ApplicationStatus` is accepted). Logic: updates the target application's `status`; **if the new status is `'accepted'`, every other non-rejected application for the same job is force-set to `'rejected'`** in the same update (store.tsx:67) — this is a real business rule ("accepting one auto-rejects the rest"), not incidental. If `status === 'accepted'`: also sets the parent `Job.status → 'worker_selected'` and calls `createChatIfMissing(jobId, acceptedWorkerId)` — note this calls the lower-level `createChatIfMissing` directly, **not** the public `ensureChatForJob`, specifically because `acceptedWorkerId` is captured from pre-mutation state (store.tsx:60) to avoid a stale-closure read of `applications` later in the same synchronous call.

### Chat / Message

- **`createChatIfMissing(jobId, workerId): Chat`** (store.tsx:78-92) — internal, not exposed on the store's public interface. Guard: `chats.find(c => c.jobId === jobId)` — returns the existing chat if found, else builds and inserts a new one (with a second idempotency check inside the `setChats` updater itself, `prev.some(...)`, for defense against duplicate calls in the same tick).
- **`ensureChatForJob(jobId): Chat | null`** (store.tsx:94-100) — public. Guard/logic: returns existing chat if one exists; else looks for an `'accepted'` application in **current** `applications` state and, if found, delegates to `createChatIfMissing`; else returns `null`. This is the function screens call directly (JobDetailScreen's "Open chat" button) — it is *not* what `setApplicationStatus` calls internally (see above).
- **`sendMessage(chatId, senderId, text)`** (store.tsx:102-132) — Input: chat, sender, text. Guard: none (any `senderId` string is accepted and trusted — no check that `senderId` is actually one of the chat's `customerId`/`workerId`). Effect: appends a `Message` with `read: false`, bumps `Chat.lastMessageAt`, and — **only once per chat, tracked in a `useRef<Set<string>>`, not in persisted state** — schedules a canned auto-reply 2.5s later from "the other participant" (`senderId === chat.customerId ? chat.workerId : chat.customerId`). The auto-reply tracking set is in-memory only; it resets on reload and has no server equivalent to reproduce (it's explicitly a demo affordance, not business logic to migrate).
- **`markChatRead(chatId, userId)`** (store.tsx:134-140) — Guard: none beyond the chat having any messages at all. Effect: sets `read: true` on every message in that chat **not** sent by `userId`. No guard that `userId` is actually a participant in the chat.

### BookingRequest

- **`requestOfferingBooking(offeringId, customerId): Chat | null`** (store.tsx:142-166) — Guard: the offering must exist (`offerings.find`), else `null`. Effect: creates a `BookingRequest` with `status: 'pending'`, **then unconditionally creates a brand-new `Chat`** (no existing-chat check here, unlike the job path) linked via `bookingRequestId`, and returns it. **Sequencing point explicitly worth restating**: this never calls `confirmBooking` — the chat is live and open while the booking is still `'pending'`, by construction.
- **`confirmBooking(bookingRequestId)`** (store.tsx:168-201) — Guard: booking request must exist and be `status === 'pending'` (else no-op, silent return). Effects, in order: (1) `status → 'confirmed'`; (2) looks up the offering, and if missing, **stops here** — the booking is left `'confirmed'` with no resulting job, a real inconsistency if the offering were ever deleted between request and confirm (no such deletion path exists today, so unreachable in practice, but worth noting for a backend where offerings could plausibly be removed concurrently); (3) builds a new `Job` (`origin: 'worker_offered'`, `status: 'worker_selected'` — deliberately skipping `open`/`applications_received`, per spec) and prepends it; (4) backfills `jobId` onto the chat matching this `bookingRequestId`.
- **`declineBooking(bookingRequestId)`** (store.tsx:203-207) — Guard: none (no status check — can be called on a booking in any state, including already `'confirmed'`). Effect: `status → 'declined'`. No UI call site.
- **`cancelBooking(bookingRequestId)`** (store.tsx:209-213) — Guard: none, same as above. Effect: `status → 'cancelled'`. No UI call site.

### WorkerOffering / verification / misc.

- **`addOffering(offering)`** (store.tsx:267-269) — Guard: none. Effect: prepends to `offerings`. No UI call site.
- **`verifyCurrentWorker()`** (store.tsx:271-273) — No input, no guard. Effect: `currentWorkerVerified → true`, unconditionally and irreversibly (see Entities note on the `isVerified` indirection).

---

## Derived / computed values

Values computed at render/call time from other state, rather than stored:

- **Feed visibility** (`FeedScreen.tsx:34-39`) — `openJobs` is filtered live on every render: `status` in `{'open','applications_received'}`, `moderationStatus !== 'pending_review'`, and category-chip match. Nothing about "which jobs are visible" is itself persisted — it's a pure filter over `jobs`. Cheap enough to stay a live query against a real backend (a WHERE clause), no need to cache.
- **Offerings visibility** (`OfferingsScreen.tsx:16`) — `status === 'active' && moderationStatus !== 'rejected'`, same pattern, same recommendation.
- **"My applications" (worker mode)** (`MyActivityScreen.tsx:70-72`) — `Object.values(applications).flat().filter(a => a.worker.id === currentWorker.id)` — a full flatten-and-filter over every job's application list, done fresh every render. Fine as a live query (`WHERE applications.worker_id = ?`) once applications are a real table; today it's O(all applications) client-side because there's no index, which doesn't matter at mock-data scale but would if this pattern were copied verbatim server-side without an actual index/query.
- **"My chats" per AppMode** (`MessagesScreen.tsx:24-31`, mirrored in `TabNavigator.tsx:40-46`) — filtered live by `customerId`/`workerId` match, plus the documented `pendingBooking` carve-out (a chat whose linked booking is still `'pending'` is shown to worker-mode regardless of `workerId`, because every seeded offering belongs to an NPC worker, not the interactive one). **This carve-out is a demo-data workaround, not intended production logic** — a real multi-worker backend wouldn't need it, since the actual worker on the offering *would* be the querying user.
- **Unread indicator (per-chat and tab-badge)** (`MessagesScreen.tsx:59`, `TabNavigator.tsx:47-49`) — `messages.some(m => m.senderId !== currentUserId && !m.read)`, recomputed from the full message list every render. This is exactly the kind of value a real backend would want either as a live subscription (see Realtime, below) or a maintained counter — recomputing over every message on every chat on every render doesn't scale past mock data.
- **`alreadyApplied`** (`JobDetailScreen.tsx:63`) — `applied || jobApplications.some(a => a.worker.id === currentWorker.id)` — combines a local optimistic flag with a live derived check against the applications list. Purely a display/gating convenience; the real source of truth is the applications list itself.
- **`applicantCount` vs. `applications[jobId].length`** — flagged under Job's fields above: `applicantCount` is a *stored* counter that duplicates what could be *derived* by counting the applications array. Currently kept in sync only because `addApplication` is the sole writer of both. A real backend should pick one: either derive it live (a `COUNT` query or a Postgres computed column) or maintain it via a trigger — don't keep two independent writers of the same fact.
- **`otherName` / chat subtitle in `MessagesScreen`** (`MessagesScreen.tsx:46-56`) — reconstructed per-row at render time by joining the chat back to its job's accepted application (for the worker's name) or its booking's offering (for a pending booking's worker name), with a final `?? 'Worker'` fallback. This is a real join happening client-side over three separate state slices (`chats`, `applications`, `offerings`/`bookingRequests`) — a real backend almost certainly wants this pre-joined server-side (a view or a single query), not reconstructed by the client on every render.
- **Review data (stars/tags/text)** (`JobDetailScreen.tsx:56-59`) — computed and held **entirely in local component `useState`**, never written to `store.tsx` or any typed entity at all. See Known Gaps — this isn't "derived from other state," it's data with no home yet.

---

## Known gaps / deliberately unfinished

Listed so this inventory doesn't imply more is wired up than actually is. Confirmed by direct grep against `src/`, not inferred:

- **`cancelJob`, `addOffering`, `declineBooking`, `cancelBooking`** — all four exist in `store.tsx`, are correctly implemented per their own guard logic, and are exported through `StoreShape` — but **none has a call site anywhere in `src/screens`**. They're reachable only by a future screen that doesn't exist yet.
- **`WorkerOffering.moderationStatus`'s `'pending_review'`/`'rejected'` states** — declared in the type, never produced by any code (already documented in-repo, models.ts:102-105).
- **`currentCustomer.id` / `currentWorker.id`** — hardcoded singletons throughout, as detailed under Entities. This is the biggest single structural gap for a multi-user backend, not a minor detail.
- **No `Review`/`Rating` entity exists at all.** The star-rating + tag + text UI at `confirmed_completed` (`JobDetailScreen.tsx:204-253`) is real, functional UI — but it writes to local component state only (`stars`, `selectedTags`, `reviewText`, `reviewSubmitted`) and nothing else. Submitting it flips a local flag to show "Thanks for your review!" and nothing is persisted anywhere, including to the `avgRating`/`totalJobsCompleted` fields on the relevant `WorkerSummary` that a real review would presumably update. A real backend needs an actual `Review` table (job id, reviewer id, reviewee id, stars, tags, text, createdAt) that doesn't exist in any form today.
- **SOS button** (`JobDetailScreen.tsx:135-142`) — explicitly documented in its own copy as "demo only, nothing is actually dispatched." Local `sosActive` boolean, no entity, no backend concept to migrate — flagging so it isn't mistaken for a stubbed-but-intended feature; it's intentionally decorative.
- **Auth is entirely absent.** `LoginScreen`'s phone/password fields are captured and discarded; "Continue" performs no check. There is no session, no token, nothing to port beyond "a login screen needs to exist and eventually call something real."
- **OTP exposure to the client** — see the `otpByJob` note under Entities. This is a security-model gap, not just a missing field.
- **`markJobComplete`'s unconditional OTP write** — see State Transitions. A guard inconsistency, not just an incompleteness.
- **Message/chat authorization is unchecked** — `sendMessage` and `markChatRead` trust whatever `senderId`/`userId` string they're given; there's no check that the caller is actually a participant in the chat. Harmless in a single-user client where the id always comes from `currentWorker`/`currentCustomer`, but a real backend must add this check at the API layer since a real client can't be trusted to only ever send its own id.
- **Job/Chat/BookingRequest ID collisions** — every timestamp-based ID (`job_${Date.now()}`, `app_${Date.now()}`, `book_${Date.now()}`, `msg_${Date.now()}`) is a real (if currently unlikely-to-trigger) collision risk under rapid repeated actions in the same millisecond. Chat IDs are the one exception, being derived deterministically from parent IDs instead.

---

## Realtime requirements

Stated plainly, since this is the input to the Firebase-vs-Supabase call:

**Needs live/realtime updates** (another party's action must become visible without the viewer manually refreshing/re-navigating):
- **Chat messages** — the core case. Today this "works" only because both roles are played by the same client in the same in-memory store; a real multi-device backend absolutely needs a subscription (or polling) on `messages` scoped to a chat, since a worker and customer will be on separate devices.
- **Unread counts / the Messages-tab badge dot** — derived from message `read` state, which changes the moment the other party sends something. Needs to update live for the badge to mean anything across two real devices; currently trivial because it recomputes on every render of a single shared store.
- **Job status changes visible to both parties** — `worker_selected → in_progress → awaiting_confirmation → confirmed_completed`/`disputed` all need to be visible to *both* the customer and worker essentially immediately (e.g. the customer needs to see "awaiting_confirmation" appear the moment the worker taps Mark Complete, without polling or re-navigating, to actually enter the OTP flow in a real two-device scenario). Same for a newly `'accepted'` application creating a chat the worker can now see.
- **Application list on a job** — a customer viewing "Applications (N)" wants new applications to appear as workers apply, in principle, though this one is more tolerable as a manual-refresh case than chat/status if realtime budget is limited.
- **Booking request status** — the customer waiting for a worker to confirm a booking is in the same category as job status: needs to surface the `'confirmed'` transition (and the resulting new Job) without a manual refresh for the "chat opens before confirmation, confirmation lands live" UX to hold up on two real devices.

**Fine as simple request/response reads** (no real-time expectation established by current behavior, and nothing about the interaction implies one is needed):
- Feed / Offerings browsing and category filtering — pure reads, refresh-on-navigate is the existing UX and nothing suggests otherwise.
- MyActivity lists — same; today it re-renders on every store change only because everything shares one client store, not because the product implies live updates while idly viewing the list.
- Profile / verification status — a one-way, rarely-changing flag; poll-or-refetch-on-focus is more than adequate.
- Posting a job, submitting an application, submitting a review — all one-shot writes with an immediate local confirmation; no reason for a subscription on the writer's own side.
- OTP entry/confirmation itself — a single request/response validate call, not a stream.

Net: the chat + job-status-visible-to-both-parties cluster is the real realtime surface area; everything else in the app is a normal CRUD read that happens to currently "feel" live only because it's one process with one shared store.
