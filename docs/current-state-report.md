# Halpal current-state report

Audited 2026-10-20. Read-only pass. This file is the only file created.
Project root: `C:\Users\LENOVO\Downloads\HALPAL-main\HALPAL-main` (the repo is one folder deeper than the opened workspace).

## 1. Repo and git state

- Branch `main`. Last commits (only 3 exist):
  - `4bc307e` Wire real Supabase phone-OTP authentication (2026-09-27)
  - `8a28c4d` Reposition Halpal to generalized gig work, add verification/chat/booking/lifecycle features (2026-09-18)
  - `d4b0a02` Initial commit: Kaam gig-app (2026-08-17)
- Uncommitted: `src/navigation/RootNavigator.tsx` modified. **`initialRouteName="Login"` was changed to `"Tabs"`** (`RootNavigator.tsx:26`). The app now opens past login, so login is bypassed.
- Untracked: `_dump_App.txt`, `_dump_AppMode.txt`, `_dump_Nav.txt`, `_fix_nav.py`. These are scratch files. `_fix_nav.py` is the script that made the edit above.
- `src/screens/MessagesScreen.tsx` is now tracked (committed in `8a28c4d`).
- `.env` is gitignored (`.gitignore:31`, confirmed with `git check-ignore`) and is not tracked.
- Hardcoded secrets/URLs/tokens in `src/`, `App.tsx` and `app.json`: none found (grep for `eyJ`, `supabase.co`, `https?://`, `sk_`, `apikey` returned nothing). `supabase.ts` reads `process.env.EXPO_PUBLIC_*`.
- Remaining Kaam / gig-app references:
  - `app.json:3` `"name": "Kaam"`
  - `app.json:4` `"slug": "gig-app"`
  - `app.json:13` `"package": "com.gigapp.kaam"`
  - `package.json:2` `"name": "gig-app"`
  - `src/screens/FeedScreen.tsx:45` visible text `KAAM`
  - `src/screens/LoginScreen.tsx:96` visible text `KAAM`
  - `src/screens/LoginScreen.tsx:16` comment mentioning kaam-design-reference.jsx
  - `src/components/atoms.tsx:83` comment
  - `src/theme/tokens.ts:1,2,8` comments
  - `src/types/models.ts:1` comment mentioning gig-app-data-schema.md
  - The name "Halpal" appears only in `docs/backend-migration-inventory.md`. It appears in no code or config.

## 2. Build health

- `npx tsc --noEmit`: **0 errors.** It printed nothing except an npm upgrade notice.
- Installed: Expo **51.0.39**, React Native **0.74.5**, React 18.2.0. `node_modules` is present.
- Dependencies (`package.json`):
  - @expo-google-fonts/fraunces ^0.4.1
  - @expo-google-fonts/manrope ^0.4.2
  - @expo/metro-runtime ~3.2.3
  - @expo/vector-icons ^14.0.0
  - @react-native-async-storage/async-storage 1.23.1
  - @react-navigation/bottom-tabs ^6.5.20
  - @react-navigation/native ^6.1.17
  - @react-navigation/native-stack ^6.9.26
  - @supabase/supabase-js ^2.116.0
  - expo ~51.0.0
  - expo-font ~12.0.10
  - expo-status-bar ~1.12.1
  - react 18.2.0
  - react-dom 18.2.0
  - react-native 0.74.5
  - react-native-safe-area-context 4.10.5
  - react-native-screens 3.31.1
  - react-native-url-polyfill ^4.0.0
  - react-native-web ~0.19.10
  - Dev: @babel/core ^7.24.0, @types/react ~18.2.79, typescript ~5.3.3
- Android API 36: **No, not on SDK 51.**
  - I did not build, so this comes from knowledge of Expo's SDK versions, not from a test. Expo SDK 51 targets Android API 34.
  - Google Play requires a higher target API for new apps and updates. I believe you need to upgrade to Expo SDK 54 or later (RN 0.81+), which targets API 36. Confirm this against Expo's current docs before planning.
  - Upgrading from 51 spans several SDKs and is a real task.
- There are no `scripts` for build or test, and no test files.

## 3. Supabase integration

- `src/lib/supabase.ts` exists (15 lines). Config:
  - `storage: AsyncStorage`
  - `autoRefreshToken: true`
  - `persistSession: true`
  - `detectSessionInUrl: false`
  - It imports `react-native-url-polyfill/auto`. The URL and key are read from env, with `!` non-null assertions and no check that they are set.
- `.env` (presence only): `EXPO_PUBLIC_SUPABASE_URL` is present, non-empty, and shaped like a `*.supabase.co` URL. `EXPO_PUBLIC_SUPABASE_ANON_KEY` is present, non-empty (208 chars), and is not a placeholder. I did not verify that either value works against the server.
- LoginScreen (`src/screens/LoginScreen.tsx`):
  - Calls `supabase.auth.signInWithOtp({ phone: e164Phone })` at line 43.
  - Calls `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` at line 60.
  - Phone format: `` `91${digits}` `` (line 35), which is 91 plus 10 digits with **no `+`**. The comment says this is to match Supabase test numbers. For real SMS providers, E.164 normally needs a `+`. **Check this before production.**
  - Errors are shown. `setError(otpError.message)` and `setError(verifyError.message)` render in `errorText` (line ~129). Length checks are shown too.
  - The old fake login is gone. I found no leftover.
  - Leftover mock coupling: after verify it runs `currentCustomer.id = userId; currentWorker.id = userId;` (lines 72-73). This mutates module-level mock objects.
- Session handling: **there is none.**
  - `getSession`, `onAuthStateChange` and `signOut` have **zero call sites** in `src/` or `App.tsx`.
  - The session is persisted to AsyncStorage, but nothing reads it on restart. Nothing auto-logs-in.
  - There is no sign-out button anywhere.
  - Tabs is **not** gated on a session. `RootNavigator.tsx:26` starts at `Tabs` (uncommitted). Even committed, it started at `Login` unconditionally and `Tabs` was reachable without a session.
- IDs: `mockData.ts:4` `id: 'cust_1'` and `:9` `id: 'work_1'` remain hardcoded.
  - They are overwritten in memory only at login time (`LoginScreen.tsx:72-73`).
  - If the app is restarted, or the login bypass is used, the IDs are `cust_1` / `work_1` again.
  - Name, rating and skills still come from the mock. Nothing is fetched from a profile table.
- SQL: **no `.sql` file or migration exists** in the repo (`halpal_schema.sql` is absent). The only backend doc is `docs/backend-migration-inventory.md`, which is a prose inventory.

## 4. Data layer: mock vs real

Only two Supabase calls exist in the whole app, both auth (LoginScreen.tsx:43, :60). `store.tsx` has zero `supabase.*` calls. Every row below is local, in-memory state that resets on app restart.

| Action (store.tsx) | Local or Supabase | Notes |
|---|---|---|
| addJob (:46) | Local | Prepends to `useState(seedJobs)`. 'Other' tag sets `pending_review` (:50-52). |
| setApplicationStatus (:56) | Local | Accept auto-rejects every other non-rejected application (:67). It also sets job to `worker_selected` and creates a chat. |
| createChatIfMissing (:78, internal) | Local | Chat id is `chat_${jobId}`. |
| ensureChatForJob (:94) | Local | Returns null unless an accepted application exists. |
| sendMessage (:102) | Local | Includes a **canned auto-reply** ("Sounds good, thanks for the update!") after 2.5s, once per chat (:114-131). |
| markChatRead (:134) | Local | |
| requestOfferingBooking (:142) | Local | Creates a pending booking and a chat immediately. |
| confirmBooking (:168) | Local | Creates a job (`worker_selected`, `locationLabel: 'To be confirmed in chat'`) and back-links the chat. |
| declineBooking (:203) / cancelBooking (:209) | Local | Status flag only. |
| startJob (:215) | Local | |
| markJobComplete (:221) | Local | OTP is `Math.random()`, stored in client state (:227). No SMS is sent. No 6-12h auto-confirm (stated in the comment, :222-226). |
| confirmJobCompletion (:234) | Local | Compares the entered OTP with the in-memory one. The customer check uses `currentCustomer.id` (mock). |
| raiseDispute (:251) | Local | Status change only, no record or notification. |
| cancelJob (:257) | Local | **No UI call site** (see section 5). |
| addOffering (:267) | Local | **No UI call site.** |
| verifyCurrentWorker (:271) | Local | `setCurrentWorkerVerified(true)`. Any user can self-verify with one tap (ProfileScreen.tsx:54). |
| addApplication (:275) | Local | |

- Screens that read mock data or store arrays instead of Supabase:
  - All of them. Initial state comes from `mockData.ts` via `store.tsx:2`.
  - Direct `mockData` imports:
    - TabNavigator.tsx:13
    - ChatScreen.tsx:8
    - JobDetailScreen.tsx:9
    - MessagesScreen.tsx:7
    - MyActivityScreen.tsx:7
    - OfferingDetailScreen.tsx:9
    - ProfileScreen.tsx:7
    - LoginScreen.tsx:10
  - Every screen except Login reads `useStore()` state.
  - `MyActivityScreen.tsx:36`: `const myJobs = jobs;`. Every job counts as the current customer's. There is no per-user ownership. `Job` has no customerId.
- Realtime: **none.** No `.channel(` or `.subscribe(` anywhere. The unread dot (`TabNavigator.tsx:47`) is computed from local state.

## 5. Feature status

| Feature | Status | Evidence |
|---|---|---|
| Category-first multi-select posting; Other goes to pending_review | **Implemented (local)** | `PostJobScreen.tsx` multi-select `toggleCategory`. `store.tsx:50` sets `pending_review`. The Feed hides it (`FeedScreen.tsx:37`). Nothing ever moves a pending job to approved, since there is no admin. |
| Application accept / reject / shortlist, auto-reject of rest | **Implemented (local)** | `store.tsx:56-76`, wired at `JobDetailScreen.tsx:318-320`. |
| Chat gating (after accept; immediately on booking) | **Implemented (local)** | Accept creates the chat (`store.tsx:74`). `requestOfferingBooking` creates it immediately (:156-165). `ensureChatForJob` returns null before accept (:98). |
| Worker offerings and booking confirmation spawning a job | **Partial** | The booking-to-job path is in `store.tsx:168-201`. Offerings are all seeded mock data. There is no way to create one. |
| Job lifecycle through OTP confirm, dispute, cancel | **Partial** | Start, mark complete, OTP confirm and dispute all have UI (`JobDetailScreen.tsx:122-192`). The OTP is client-generated, so it provides no real security. Cancel has no UI. |
| Reviews persisted | **Not persisted** | `JobDetailScreen.tsx:56-59` uses component state. Submit is `onPress={() => setReviewSubmitted(true)}` (:246). The stars, tags and text are discarded. Ratings on cards come from static mock values. |
| Binary verification (isVerified) and apply gate | **Implemented (fake)** | Gate: `JobDetailScreen.tsx:259` `!currentWorkerVerified`. But `ProfileScreen.tsx:54` `onPress={verifyCurrentWorker}` verifies instantly with no check. |
| UI to create a worker offering | **Not implemented** | `addOffering` is defined (`store.tsx:267`) with no caller. `OfferingsScreen.tsx:25` says "Post your own from your profile". `ProfileScreen` has no such control. |
| Cancel-job button | **Not implemented** | `cancelJob` (`store.tsx:257`) is never called. |
| SOS | **Demo only** | `JobDetailScreen.tsx:135` sets `sosActive` state. The banner says "demo only, nothing is actually dispatched" (:139). It does not call anyone, send an SMS, or use location. |
| Live location | Not built | No location code or library. |
| Push notifications | Not built | No notifications library. The apply text "You'll be notified" (:268) is untrue today. |
| Payments | Not built | No payment code. |

## 6. App config and store readiness

- `app.json`:
  - name `Kaam`
  - slug `gig-app`
  - version `1.0.0`
  - orientation portrait
  - userInterfaceStyle light
  - android.package `com.gigapp.kaam`
  - splash has only a backgroundColor
  - adaptiveIcon has only a backgroundColor
  - **Missing:** `icon`, a splash image, the adaptive-icon foreground image, `scheme`, `ios.bundleIdentifier`, `android.versionCode`, `permissions`, `plugins`, and an iOS `infoPlist`.
- `eas.json`: **does not exist**, so there are no build profiles.
- Privacy policy, terms of service, in-app account deletion: **none found.** Grep for `privacy`, `terms` and `delete account` returned nothing in `src` or `app.json`. Both stores require a privacy policy and, for apps with accounts, an account-deletion flow.
- iOS permission strings: none are configured, and none are needed today because no camera or location code exists. They will be needed if you add location or verification photos.
- There is no `assets/` folder, so no icon or splash files exist.

## 7. Code quality and risk

- No-op handlers: only `src/state/AppMode.tsx:8`, `setMode: () => {}`, the context default. It is harmless because the provider overrides it.
- TODO / FIXME: none. Placeholder-type comments:
  - `store.tsx:114` "demo purposes only"
  - `store.tsx:222-226` OTP shortcut
  - `JobDetailScreen.tsx:139` SOS demo
- `as any` casts: 2, both in `TabNavigator.tsx` (:67 `OfferingsScreen as any`, :69 `MessagesScreen as any`). They are used because these screens are typed with the root stack's `Props` (`NativeStackScreenProps<RootStackParamList, 'Tabs'>`), not the tab navigator's props. It is a type mismatch hidden by the cast.
- `console.*`: none in `src/` or `App.tsx`. No sensitive logging.
- Looks wired but isn't:
  - `verifyCurrentWorker` (one-tap self-verify)
  - the OTP "security" (client-side `Math.random`)
  - the Review submit
  - SOS
  - the auto-reply in chat
  - `addOffering` and `cancelJob` (no call sites)
- Mutation of mock objects at login (`LoginScreen.tsx:72-73`) is fragile. It does not trigger re-renders and is lost on restart.
- `AppMode` defaults to `'worker'` (`AppMode.tsx:11`) but login sets `'customer'`. With the login bypass, a user lands in worker mode.
- Supabase env vars use `!` with no runtime guard (`supabase.ts:5-6`). Missing vars give an obscure failure.

## 8. Summary

**Done and verified**
- `tsc` passes with 0 errors.
- Supabase client is configured correctly (`persistSession`, `autoRefreshToken`, AsyncStorage).
- `.env` is gitignored and holds non-empty Supabase values. No secrets are hardcoded in source.
- LoginScreen sends and verifies the phone OTP, with error display. I did not run it against the server.

**Partly done**
- Auth: login works, but there is no session restore, sign-out or route gating, and IDs are still mock.
- The whole marketplace flow (posting, applying, accepting, chat, booking, lifecycle) exists as UI plus local state.
- Worker offerings: viewable and bookable, but there is no way to create one.
- Rebrand: "Halpal" is not applied to code or config.

**Not started**
- Any database data layer, schema/migrations, RLS, realtime
- Review persistence
- Offering creation UI and cancel-job UI
- Real SOS, location, push, payments
- Admin moderation for pending_review
- Real verification
- Sign-out and account deletion
- Privacy policy and terms
- `eas.json`, icons and splash assets
- Tests

**Blocked or broken**
- Login is bypassed in the working tree (`initialRouteName="Tabs"`, uncommitted).
- Expo SDK 51 cannot meet the Android API 36 target.
- Phone is sent as `91XXXXXXXXXX` without `+`, which may fail with a real SMS provider.
- Everything resets on app restart.

**Top 3 blockers to production, ranked**
1. No backend data layer. Nothing besides auth touches Supabase, so no data is shared between users or persisted. There is no schema, RLS or realtime. Every feature in section 5 is local only.
2. Auth is not enforced. There is no session restore, gating or sign-out. The login screen is currently bypassed. User identity is mock (`cust_1` / `work_1`) and verification is self-service. Real security is impossible until this is fixed, and the OTP completion check must move server-side.
3. Store readiness. Expo SDK 51 targets API 34, so you need to upgrade to meet the API 36 requirement. The app is still named Kaam (`com.gigapp.kaam`), with no icons, no `eas.json`, no privacy policy and no account deletion.

**Recommended next 3 steps (each fits one prompt)**
1. Restore the commit's `initialRouteName` to `Login`, delete the scratch files, and add session handling. This means an auth context using `getSession` and `onAuthStateChange`, with the root navigator showing `Login` or `Tabs` from the session, plus a sign-out button on Profile. Also remove the `currentCustomer.id = ...` mutation and expose the real user id from that context.
2. Write `supabase/migrations/001_schema.sql` with profiles, jobs, applications, offerings, bookings, chats, messages and reviews, plus RLS policies. Put it in the repo and apply it to the project. Add no app code yet.
3. Move one vertical slice to Supabase end to end: job posting and the feed (`addJob` and the feed query), with ownership via the real user id. Use that as the pattern for the other actions.

Afterwards: the Expo SDK upgrade, the Halpal rename and config, and the store assets.
