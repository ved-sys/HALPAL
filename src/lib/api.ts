/**
 * The only module that talks to Supabase besides auth (src/lib/supabase.ts
 * and src/state/AuthContext.tsx). The store and the screens go through here.
 *
 * ── RPC-ONLY OPERATIONS ──────────────────────────────────────────────────
 * Row Level Security blocks direct client UPDATE on `jobs`,
 * `job_applications` and `booking_requests`. Every state transition on
 * those tables therefore runs server-side, through a function that derives
 * the caller from auth.uid():
 *
 *   accept_application   start_job          mark_job_complete
 *   confirm_job_completion                  raise_dispute
 *   cancel_job           request_offering_booking
 *   confirm_booking      decline_booking    cancel_booking
 *   submit_review        send_message       mark_chat_read
 *   verify_self          dev_peek_job_otp
 *
 * Two consequences worth remembering:
 *  - Never pass a user id to an RPC. The function reads auth.uid() itself,
 *    so an id argument would only be an impersonation hole.
 *  - `job_otps` is readable by no client. The completion code comes back
 *    only from dev_peek_job_otp, which is customer-only and temporary.
 *
 * Direct INSERT is allowed, subject to RLS, on: jobs, job_applications,
 * worker_offerings, booking_requests, reviews.
 *
 * Every function here returns { data, error } and never throws. Callers
 * must check `error` — nothing is logged or swallowed on the way out.
 */
import { supabase } from '@/lib/supabase';
import {
  ApplicationStatus,
  BookingRequest,
  Chat,
  Job,
  JobApplication,
  JobCategory,
  Message,
  Review,
  WorkerOffering,
  WorkerSummary,
} from '@/types/models';

export interface Result<T> {
  data: T | null;
  error: string | null;
}

const ok = <T,>(data: T): Result<T> => ({ data, error: null });
const fail = <T,>(error: string): Result<T> => ({ data: null, error });

/** Normalises anything thrown or returned by postgrest-js into a message. */
function message(e: unknown): string {
  if (!e) return 'Unknown error.';
  if (typeof e === 'string') return e;
  const m = (e as { message?: unknown }).message;
  return typeof m === 'string' && m.length > 0 ? m : 'Unknown error.';
}

/** Reads the signed-in user id from the locally cached session. */
async function currentUserId(): Promise<Result<string>> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return fail(message(error));
    const id = data.session?.user.id;
    if (!id) return fail('Not signed in.');
    return ok(id);
  } catch (e) {
    return fail(message(e));
  }
}

// ── Row types (snake_case, mirroring the tables) ────────────────────────

export interface ProfileRow {
  id: string;
  full_name: string | null;
  avatar_color: string | null;
  is_verified: boolean | null;
  avg_rating: number | null;
  total_jobs_completed: number | null;
  skills: string[] | null;
  bio: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface JobRow {
  id: string;
  customer_id: string;
  description: string;
  category_tags: string[] | null;
  budget_min: number;
  budget_max: number;
  urgency: 'asap' | 'scheduled';
  scheduled_datetime: string | null;
  location_label: string;
  status: Job['status'];
  moderation_status: Job['moderationStatus'];
  origin: Job['origin'];
  created_at: string;
  applicant_count: number | null;
}

export interface JobApplicationRow {
  id: string;
  job_id: string;
  worker_id: string;
  quoted_rate: number;
  note: string | null;
  status: ApplicationStatus;
  applied_at: string;
  worker?: ProfileRow | null;
  job?: JobRow | null;
}

export interface WorkerOfferingRow {
  id: string;
  worker_id: string;
  title: string;
  description: string;
  category_tags: string[] | null;
  pricing_type: WorkerOffering['pricingType'];
  rate: number;
  moderation_status: WorkerOffering['moderationStatus'];
  status: WorkerOffering['status'];
  created_at: string;
  worker?: ProfileRow | null;
}

export interface BookingRequestRow {
  id: string;
  offering_id: string;
  customer_id: string;
  status: BookingRequest['status'];
  created_at: string;
  offering?: WorkerOfferingRow | null;
}

export interface ChatRow {
  id: string;
  job_id: string | null;
  booking_request_id: string | null;
  customer_id: string;
  worker_id: string;
  created_at: string;
  last_message_at: string;
  customer?: ProfileRow | null;
  worker?: ProfileRow | null;
  job?: JobRow | null;
  booking_request?: BookingRequestRow | null;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  sent_at: string;
  read: boolean | null;
}

export interface ReviewRow {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  stars: number;
  tags: string[] | null;
  review_text: string | null;
  created_at: string;
}

// ── Mappers (snake_case row -> camelCase app type) ──────────────────────

export function rowToProfile(r: ProfileRow): WorkerSummary {
  return {
    id: r.id,
    fullName: r.full_name ?? 'Unnamed',
    avatarColor: r.avatar_color ?? '#A8A492',
    isVerified: r.is_verified ?? false,
    avgRating: r.avg_rating ?? 0,
    totalJobsCompleted: r.total_jobs_completed ?? 0,
    skills: r.skills ?? [],
    bio: r.bio ?? '',
  };
}

export function rowToJob(r: JobRow): Job {
  return {
    id: r.id,
    customerId: r.customer_id,
    description: r.description,
    categoryTags: (r.category_tags ?? []) as JobCategory[],
    budgetMin: r.budget_min,
    budgetMax: r.budget_max,
    urgency: r.urgency,
    scheduledDatetime: r.scheduled_datetime ?? undefined,
    locationLabel: r.location_label,
    status: r.status,
    moderationStatus: r.moderation_status,
    origin: r.origin,
    createdAt: r.created_at,
    applicantCount: r.applicant_count ?? 0,
  };
}

export function rowToApplication(r: JobApplicationRow): JobApplication {
  return {
    id: r.id,
    jobId: r.job_id,
    // `worker` is only populated when the query embedded profiles. Falling
    // back to a bare id keeps the type honest without inventing a name.
    worker: r.worker
      ? rowToProfile(r.worker)
      : {
          id: r.worker_id,
          fullName: 'Unnamed',
          avatarColor: '#A8A492',
          isVerified: false,
          avgRating: 0,
          totalJobsCompleted: 0,
          skills: [],
          bio: '',
        },
    quotedRate: r.quoted_rate,
    note: r.note ?? undefined,
    status: r.status,
    appliedAt: r.applied_at,
    job: r.job ? rowToJob(r.job) : undefined,
  };
}

export function rowToOffering(r: WorkerOfferingRow): WorkerOffering {
  return {
    id: r.id,
    workerId: r.worker_id,
    worker: r.worker
      ? rowToProfile(r.worker)
      : {
          id: r.worker_id,
          fullName: 'Unnamed',
          avatarColor: '#A8A492',
          isVerified: false,
          avgRating: 0,
          totalJobsCompleted: 0,
          skills: [],
          bio: '',
        },
    title: r.title,
    description: r.description,
    categoryTags: (r.category_tags ?? []) as JobCategory[],
    pricingType: r.pricing_type,
    rate: r.rate,
    moderationStatus: r.moderation_status,
    status: r.status,
  };
}

export function rowToBookingRequest(r: BookingRequestRow): BookingRequest {
  return {
    id: r.id,
    offeringId: r.offering_id,
    customerId: r.customer_id,
    status: r.status,
    createdAt: r.created_at,
    offeringTitle: r.offering?.title,
  };
}

export function rowToChat(r: ChatRow): Chat {
  return {
    id: r.id,
    jobId: r.job_id ?? undefined,
    bookingRequestId: r.booking_request_id ?? undefined,
    customerId: r.customer_id,
    workerId: r.worker_id,
    createdAt: r.created_at,
    lastMessageAt: r.last_message_at,
    customer: r.customer ? rowToProfile(r.customer) : undefined,
    worker: r.worker ? rowToProfile(r.worker) : undefined,
    jobDescription: r.job?.description,
    offeringTitle: r.booking_request?.offering?.title,
    bookingStatus: r.booking_request?.status,
  };
}

export function rowToMessage(r: MessageRow): Message {
  return {
    id: r.id,
    chatId: r.chat_id,
    senderId: r.sender_id,
    text: r.text,
    sentAt: r.sent_at,
    read: r.read ?? false,
  };
}

export function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    jobId: r.job_id,
    reviewerId: r.reviewer_id,
    revieweeId: r.reviewee_id,
    stars: r.stars,
    tags: r.tags ?? [],
    reviewText: r.review_text ?? undefined,
    createdAt: r.created_at,
  };
}

// Select fragments. `chats` has two foreign keys into profiles, so the
// embeds there must name the column (`profiles!customer_id`) or PostgREST
// rejects the query as ambiguous (PGRST201).
const PROFILE_COLS = 'id,full_name,avatar_color,is_verified,avg_rating,total_jobs_completed,skills,bio';
const APPLICATION_SELECT = `*,worker:profiles(${PROFILE_COLS})`;
const OFFERING_SELECT = `*,worker:profiles(${PROFILE_COLS})`;
const CHAT_SELECT =
  `*,customer:profiles!customer_id(${PROFILE_COLS}),worker:profiles!worker_id(${PROFILE_COLS})` +
  ',job:jobs(id,description),booking_request:booking_requests(id,status,offering:worker_offerings(id,title))';

// ── Reads ───────────────────────────────────────────────────────────────

/** The public job board: open jobs that are not held for moderation. */
export async function fetchOpenJobs(): Promise<Result<Job[]>> {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .in('status', ['open', 'applications_received'])
      .in('moderation_status', ['not_required', 'approved'])
      .order('created_at', { ascending: false });
    if (error) return fail(message(error));
    return ok((data as JobRow[]).map(rowToJob));
  } catch (e) {
    return fail(message(e));
  }
}

export async function fetchJobById(jobId: string): Promise<Result<Job>> {
  try {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
    if (error) return fail(message(error));
    if (!data) return fail('Job not found.');
    return ok(rowToJob(data as JobRow));
  } catch (e) {
    return fail(message(e));
  }
}

export async function fetchApplicationsForJob(jobId: string): Promise<Result<JobApplication[]>> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select(APPLICATION_SELECT)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: true });
    if (error) return fail(message(error));
    return ok((data as unknown as JobApplicationRow[]).map(rowToApplication));
  } catch (e) {
    return fail(message(e));
  }
}

/** Jobs the signed-in user posted as a customer. */
export async function fetchMyJobs(): Promise<Result<Job[]>> {
  const uid = await currentUserId();
  if (uid.error || !uid.data) return fail(uid.error ?? 'Not signed in.');
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('customer_id', uid.data)
      .order('created_at', { ascending: false });
    if (error) return fail(message(error));
    return ok((data as JobRow[]).map(rowToJob));
  } catch (e) {
    return fail(message(e));
  }
}

/** Applications the signed-in user filed as a worker, with their jobs. */
export async function fetchMyApplications(): Promise<Result<JobApplication[]>> {
  const uid = await currentUserId();
  if (uid.error || !uid.data) return fail(uid.error ?? 'Not signed in.');
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select(`${APPLICATION_SELECT},job:jobs(*)`)
      .eq('worker_id', uid.data)
      .order('applied_at', { ascending: false });
    if (error) return fail(message(error));
    return ok((data as unknown as JobApplicationRow[]).map(rowToApplication));
  } catch (e) {
    return fail(message(e));
  }
}

export async function fetchOfferings(): Promise<Result<WorkerOffering[]>> {
  try {
    const { data, error } = await supabase
      .from('worker_offerings')
      .select(OFFERING_SELECT)
      .eq('status', 'active')
      .in('moderation_status', ['not_required', 'approved', 'pending_review'])
      .order('created_at', { ascending: false });
    if (error) return fail(message(error));
    return ok((data as unknown as WorkerOfferingRow[]).map(rowToOffering));
  } catch (e) {
    return fail(message(e));
  }
}

export async function fetchOfferingById(offeringId: string): Promise<Result<WorkerOffering>> {
  try {
    const { data, error } = await supabase
      .from('worker_offerings')
      .select(OFFERING_SELECT)
      .eq('id', offeringId)
      .maybeSingle();
    if (error) return fail(message(error));
    if (!data) return fail('Offering not found.');
    return ok(rowToOffering(data as unknown as WorkerOfferingRow));
  } catch (e) {
    return fail(message(e));
  }
}

/** Offerings the signed-in user owns, whatever their status. */
export async function fetchMyOfferings(): Promise<Result<WorkerOffering[]>> {
  const uid = await currentUserId();
  if (uid.error || !uid.data) return fail(uid.error ?? 'Not signed in.');
  try {
    const { data, error } = await supabase
      .from('worker_offerings')
      .select(OFFERING_SELECT)
      .eq('worker_id', uid.data)
      .order('created_at', { ascending: false });
    if (error) return fail(message(error));
    return ok((data as unknown as WorkerOfferingRow[]).map(rowToOffering));
  } catch (e) {
    return fail(message(e));
  }
}

/** RLS already restricts chats to their two participants. */
export async function fetchMyChats(): Promise<Result<Chat[]>> {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select(CHAT_SELECT)
      .order('last_message_at', { ascending: false });
    if (error) return fail(message(error));
    return ok((data as unknown as ChatRow[]).map(rowToChat));
  } catch (e) {
    return fail(message(e));
  }
}

export async function fetchMessages(chatId: string): Promise<Result<Message[]>> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('sent_at', { ascending: true });
    if (error) return fail(message(error));
    return ok((data as MessageRow[]).map(rowToMessage));
  } catch (e) {
    return fail(message(e));
  }
}

/** RLS restricts booking_requests to the customer and the offering's owner. */
export async function fetchMyBookingRequests(): Promise<Result<BookingRequest[]>> {
  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select('*,offering:worker_offerings(id,title)')
      .order('created_at', { ascending: false });
    if (error) return fail(message(error));
    return ok((data as unknown as BookingRequestRow[]).map(rowToBookingRequest));
  } catch (e) {
    return fail(message(e));
  }
}

/**
 * Unread message count per chat, in one query. Fetching only the unread
 * rows' chat_id keeps this cheap enough to run alongside the chat list,
 * which is what the tab-bar dot needs. RLS limits `messages` to chats the
 * caller participates in.
 */
export async function fetchUnreadCounts(): Promise<Result<Record<string, number>>> {
  const uid = await currentUserId();
  if (uid.error || !uid.data) return fail(uid.error ?? 'Not signed in.');
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('chat_id')
      .eq('read', false)
      .neq('sender_id', uid.data);
    if (error) return fail(message(error));
    const counts: Record<string, number> = {};
    for (const row of data as { chat_id: string }[]) {
      counts[row.chat_id] = (counts[row.chat_id] ?? 0) + 1;
    }
    return ok(counts);
  } catch (e) {
    return fail(message(e));
  }
}

export async function fetchMyProfile(): Promise<Result<WorkerSummary>> {
  const uid = await currentUserId();
  if (uid.error || !uid.data) return fail(uid.error ?? 'Not signed in.');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLS)
      .eq('id', uid.data)
      .maybeSingle();
    if (error) return fail(message(error));
    if (!data) return fail('Your profile row is missing.');
    return ok(rowToProfile(data as unknown as ProfileRow));
  } catch (e) {
    return fail(message(e));
  }
}

export async function fetchReviewsForJob(jobId: string): Promise<Result<Review[]>> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (error) return fail(message(error));
    return ok((data as ReviewRow[]).map(rowToReview));
  } catch (e) {
    return fail(message(e));
  }
}

// ── Writes: direct inserts (RLS-checked) ────────────────────────────────

export interface NewJobInput {
  description: string;
  categoryTags: JobCategory[];
  budgetMin: number;
  budgetMax: number;
  urgency: 'asap' | 'scheduled';
  scheduledDatetime?: string;
  locationLabel: string;
}

/**
 * Jobs tagged 'Other' match no known category, so they are held for review
 * before reaching the feed. Everything else needs no moderation.
 */
export async function createJob(input: NewJobInput): Promise<Result<Job>> {
  const uid = await currentUserId();
  if (uid.error || !uid.data) return fail(uid.error ?? 'Not signed in.');
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        customer_id: uid.data,
        description: input.description,
        category_tags: input.categoryTags,
        budget_min: input.budgetMin,
        budget_max: input.budgetMax,
        urgency: input.urgency,
        scheduled_datetime: input.scheduledDatetime ?? null,
        location_label: input.locationLabel,
        status: 'open',
        moderation_status: input.categoryTags.includes('Other') ? 'pending_review' : 'not_required',
        origin: 'customer_posted',
      })
      .select('*')
      .single();
    if (error) return fail(message(error));
    return ok(rowToJob(data as JobRow));
  } catch (e) {
    return fail(message(e));
  }
}

export async function createApplication(
  jobId: string,
  quotedRate: number,
  note?: string
): Promise<Result<JobApplication>> {
  const uid = await currentUserId();
  if (uid.error || !uid.data) return fail(uid.error ?? 'Not signed in.');
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        worker_id: uid.data,
        quoted_rate: quotedRate,
        note: note ?? null,
        status: 'applied',
      })
      .select(APPLICATION_SELECT)
      .single();
    if (error) return fail(message(error));
    return ok(rowToApplication(data as unknown as JobApplicationRow));
  } catch (e) {
    return fail(message(e));
  }
}

export interface NewOfferingInput {
  title: string;
  description: string;
  categoryTags: JobCategory[];
  pricingType: WorkerOffering['pricingType'];
  rate: number;
}

export async function createOffering(input: NewOfferingInput): Promise<Result<WorkerOffering>> {
  const uid = await currentUserId();
  if (uid.error || !uid.data) return fail(uid.error ?? 'Not signed in.');
  try {
    const { data, error } = await supabase
      .from('worker_offerings')
      .insert({
        worker_id: uid.data,
        title: input.title,
        description: input.description,
        category_tags: input.categoryTags,
        pricing_type: input.pricingType,
        rate: input.rate,
        // Custom pricing is the case the product wants a human to look at.
        moderation_status: input.pricingType === 'custom' ? 'pending_review' : 'not_required',
        status: 'active',
      })
      .select(OFFERING_SELECT)
      .single();
    if (error) return fail(message(error));
    return ok(rowToOffering(data as unknown as WorkerOfferingRow));
  } catch (e) {
    return fail(message(e));
  }
}

// ── Writes: RPCs (RLS blocks the equivalent direct UPDATE) ──────────────

/** Shared shape for RPCs that report success or failure but return no row. */
async function callVoidRpc(fn: string, args: Record<string, unknown>): Promise<Result<null>> {
  try {
    const { error } = await supabase.rpc(fn, args);
    if (error) return fail(message(error));
    return ok(null);
  } catch (e) {
    return fail(message(e));
  }
}

/** Accepting one application auto-rejects the rest, server-side. */
export function acceptApplication(jobId: string, applicationId: string): Promise<Result<null>> {
  return callVoidRpc('accept_application', { p_job_id: jobId, p_application_id: applicationId });
}

export function startJob(jobId: string): Promise<Result<null>> {
  return callVoidRpc('start_job', { p_job_id: jobId });
}

export function markJobComplete(jobId: string): Promise<Result<null>> {
  return callVoidRpc('mark_job_complete', { p_job_id: jobId });
}

export function raiseDispute(jobId: string): Promise<Result<null>> {
  return callVoidRpc('raise_dispute', { p_job_id: jobId });
}

export function cancelJob(jobId: string): Promise<Result<null>> {
  return callVoidRpc('cancel_job', { p_job_id: jobId });
}

export function declineBooking(bookingId: string): Promise<Result<null>> {
  return callVoidRpc('decline_booking', { p_booking_id: bookingId });
}

export function cancelBooking(bookingId: string): Promise<Result<null>> {
  return callVoidRpc('cancel_booking', { p_booking_id: bookingId });
}

export function markChatRead(chatId: string): Promise<Result<null>> {
  return callVoidRpc('mark_chat_read', { p_chat_id: chatId });
}

export function verifySelf(): Promise<Result<null>> {
  return callVoidRpc('verify_self', {});
}

/**
 * Returns false when the code is wrong, so a false result is a normal
 * outcome to show the user — not an error.
 */
export async function confirmJobCompletion(jobId: string, enteredOtp: string): Promise<Result<boolean>> {
  try {
    const { data, error } = await supabase.rpc('confirm_job_completion', {
      p_job_id: jobId,
      p_entered_otp: enteredOtp,
    });
    if (error) return fail(message(error));
    return ok(Boolean(data));
  } catch (e) {
    return fail(message(e));
  }
}

/** Returns the id of the chat opened alongside the booking request. */
export async function requestOfferingBooking(offeringId: string): Promise<Result<string>> {
  try {
    const { data, error } = await supabase.rpc('request_offering_booking', { p_offering_id: offeringId });
    if (error) return fail(message(error));
    if (typeof data !== 'string') return fail('Booking request did not return a chat.');
    return ok(data);
  } catch (e) {
    return fail(message(e));
  }
}

/** Confirming a booking spawns the job; returns its id. */
export async function confirmBooking(bookingId: string): Promise<Result<string>> {
  try {
    const { data, error } = await supabase.rpc('confirm_booking', { p_booking_id: bookingId });
    if (error) return fail(message(error));
    if (typeof data !== 'string') return fail('Confirming the booking did not return a job.');
    return ok(data);
  } catch (e) {
    return fail(message(e));
  }
}

export async function sendMessage(chatId: string, text: string): Promise<Result<string>> {
  try {
    const { data, error } = await supabase.rpc('send_message', { p_chat_id: chatId, p_text: text });
    if (error) return fail(message(error));
    return ok(typeof data === 'string' ? data : '');
  } catch (e) {
    return fail(message(e));
  }
}

export function submitReview(
  jobId: string,
  revieweeId: string,
  stars: number,
  tags: string[],
  reviewText: string
): Promise<Result<null>> {
  return callVoidRpc('submit_review', {
    p_job_id: jobId,
    p_reviewee_id: revieweeId,
    p_stars: stars,
    p_tags: tags,
    p_review_text: reviewText,
  });
}

// ── Realtime ────────────────────────────────────────────────────────────

export interface RealtimeHandlers {
  /** Chats the user is in; the messages subscription is scoped to these. */
  chatIds: string[];
  onMessage: (message: Message) => void;
  onChatUpdate: (chat: Partial<Chat> & { id: string }) => void;
  /** A new chat arrives without its embeds, so the caller refetches. */
  onNewChat: () => void;
  onJobUpdate: (job: Job) => void;
}

/**
 * One channel covering the three tables whose changes the UI must notice:
 * messages, chats and jobs. Nothing else is subscribed.
 *
 * Realtime applies the same RLS policies as a read, so a row the user
 * cannot select is never delivered. The messages subscription additionally
 * narrows to the user's own chat ids server-side, and every handler is
 * guarded again on the client — a channel outlives a sign-out by a few
 * milliseconds.
 *
 * Returns the unsubscribe function.
 */
export function subscribeToChanges(handlers: RealtimeHandlers): () => void {
  const channel = supabase.channel('halpal-sync');
  const allowed = new Set(handlers.chatIds);

  if (handlers.chatIds.length > 0) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=in.(${handlers.chatIds.join(',')})`,
      },
      (payload) => {
        const row = payload.new as MessageRow | null;
        if (!row?.id || !allowed.has(row.chat_id)) return;
        handlers.onMessage(rowToMessage(row));
      }
    );
  }

  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, () => {
    handlers.onNewChat();
  });

  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chats' }, (payload) => {
    const row = payload.new as ChatRow | null;
    if (!row?.id) return;
    // Scalars only: a change feed carries no embedded profiles, and
    // overwriting the hydrated ones with undefined would blank the UI.
    handlers.onChatUpdate({
      id: row.id,
      jobId: row.job_id ?? undefined,
      bookingRequestId: row.booking_request_id ?? undefined,
      lastMessageAt: row.last_message_at,
    });
  });

  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, (payload) => {
    const row = payload.new as JobRow | null;
    if (!row?.id) return;
    handlers.onJobUpdate(rowToJob(row));
  });

  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Temporary development affordance: shows the customer the completion code
 * that production would deliver by SMS. Customer-only, enforced server-side.
 * Returns null when the caller is not entitled to see it.
 */
export async function devPeekJobOtp(jobId: string): Promise<Result<string | null>> {
  try {
    const { data, error } = await supabase.rpc('dev_peek_job_otp', { p_job_id: jobId });
    if (error) return fail(message(error));
    return ok(typeof data === 'string' ? data : null);
  } catch (e) {
    return fail(message(e));
  }
}
