/**
 * Server-backed store. Every read and write goes through src/lib/api.ts;
 * nothing here holds invented data. Mutating actions are async, return
 * { ok, error } so the calling screen can show its own failure, and
 * refetch whatever they changed afterwards. No optimistic updates — the
 * server is the only thing that decides whether a transition happened.
 *
 * AppMode is deliberately not consulted here. It decides which queries a
 * screen asks for, never who the user is; identity comes from AuthContext.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '@/lib/api';
import { useAuth } from '@/state/AuthContext';
import {
  BookingRequest,
  Chat,
  Job,
  JobApplication,
  Message,
  Review,
  WorkerOffering,
  WorkerSummary,
} from '@/types/models';

export type Collection = 'jobs' | 'applications' | 'chats' | 'messages' | 'offerings' | 'bookingRequests';

const COLLECTIONS: Collection[] = ['jobs', 'applications', 'chats', 'messages', 'offerings', 'bookingRequests'];

export interface ActionResult {
  ok: boolean;
  error: string | null;
}

const succeeded: ActionResult = { ok: true, error: null };
const failed = (error: string): ActionResult => ({ ok: false, error });

type Flags = Record<Collection, boolean>;
type Errors = Record<Collection, string | null>;

const noFlags = (): Flags => ({
  jobs: false,
  applications: false,
  chats: false,
  messages: false,
  offerings: false,
  bookingRequests: false,
});

const noErrors = (): Errors => ({
  jobs: null,
  applications: null,
  chats: null,
  messages: null,
  offerings: null,
  bookingRequests: null,
});

interface StoreShape {
  /** The public job board. */
  jobs: Job[];
  /** Jobs the signed-in user posted. */
  myJobs: Job[];
  /** Every job seen this session, including ones off the board. */
  jobsById: Record<string, Job>;
  /** Applications the signed-in user filed, each carrying its job. */
  myApplications: JobApplication[];
  /** Applications on a given job, loaded on demand by its customer. */
  applications: Record<string, JobApplication[]>;
  offerings: WorkerOffering[];
  myOfferings: WorkerOffering[];
  chats: Chat[];
  messagesByChat: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  bookingRequests: BookingRequest[];
  reviewsByJob: Record<string, Review[]>;
  profile: WorkerSummary | null;
  profileError: string | null;

  loading: Flags;
  errors: Errors;

  refreshJobs: () => Promise<void>;
  refreshOfferings: () => Promise<void>;
  refreshChats: () => Promise<void>;
  refreshBookingRequests: () => Promise<void>;
  refreshMyApplications: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loadJob: (jobId: string) => Promise<void>;
  loadApplicationsForJob: (jobId: string) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  loadReviews: (jobId: string) => Promise<void>;

  addJob: (input: api.NewJobInput) => Promise<ActionResult>;
  addApplication: (jobId: string, quotedRate: number, note?: string) => Promise<ActionResult>;
  addOffering: (input: api.NewOfferingInput) => Promise<ActionResult>;
  acceptApplication: (jobId: string, applicationId: string) => Promise<ActionResult>;
  startJob: (jobId: string) => Promise<ActionResult>;
  markJobComplete: (jobId: string) => Promise<ActionResult>;
  /** `matched` is false for a wrong code, which is not an error. */
  confirmJobCompletion: (jobId: string, enteredOtp: string) => Promise<ActionResult & { matched: boolean }>;
  raiseDispute: (jobId: string) => Promise<ActionResult>;
  cancelJob: (jobId: string) => Promise<ActionResult>;
  requestOfferingBooking: (offeringId: string) => Promise<ActionResult & { chatId: string | null }>;
  confirmBooking: (bookingId: string) => Promise<ActionResult>;
  declineBooking: (bookingId: string) => Promise<ActionResult>;
  cancelBooking: (bookingId: string) => Promise<ActionResult>;
  sendMessage: (chatId: string, text: string) => Promise<ActionResult>;
  markChatRead: (chatId: string) => Promise<ActionResult>;
  verifyCurrentWorker: () => Promise<ActionResult>;
  submitReview: (
    jobId: string,
    revieweeId: string,
    stars: number,
    tags: string[],
    reviewText: string
  ) => Promise<ActionResult>;
  /** Temporary development affordance; server-side it is customer-only. */
  peekJobOtp: (jobId: string) => Promise<{ otp: string | null; error: string | null }>;

  /** Applied to local state by the realtime subscriptions (Stage D). */
  applyMessageChange: (message: Message) => void;
  applyChatChange: (chat: Partial<Chat> & { id: string }) => void;
  applyJobChange: (job: Job) => void;
}

const StoreContext = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [jobsById, setJobsById] = useState<Record<string, Job>>({});
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [applications, setApplications] = useState<Record<string, JobApplication[]>>({});
  const [offerings, setOfferings] = useState<WorkerOffering[]>([]);
  const [myOfferings, setMyOfferings] = useState<WorkerOffering[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [reviewsByJob, setReviewsByJob] = useState<Record<string, Review[]>>({});
  const [profile, setProfile] = useState<WorkerSummary | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState<Flags>(noFlags);
  const [errors, setErrors] = useState<Errors>(noErrors);

  // Guards every setState in an async callback: a sign-out (or unmount) can
  // land while a fetch is still in flight, and writing then would resurrect
  // the previous user's rows.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const begin = useCallback((c: Collection) => {
    setLoading((prev) => ({ ...prev, [c]: true }));
    setErrors((prev) => ({ ...prev, [c]: null }));
  }, []);

  const end = useCallback((c: Collection, error: string | null) => {
    if (!alive.current) return;
    setLoading((prev) => ({ ...prev, [c]: false }));
    setErrors((prev) => ({ ...prev, [c]: error }));
  }, []);

  const indexJobs = useCallback((list: Job[]) => {
    setJobsById((prev) => {
      const next = { ...prev };
      for (const j of list) next[j.id] = j;
      return next;
    });
  }, []);

  // ── Reads ─────────────────────────────────────────────────────────────

  const refreshJobs = useCallback(async () => {
    if (!userId) return;
    begin('jobs');
    const [board, mine] = await Promise.all([api.fetchOpenJobs(), api.fetchMyJobs()]);
    if (!alive.current) return;
    if (board.data) {
      setJobs(board.data);
      indexJobs(board.data);
    }
    if (mine.data) {
      setMyJobs(mine.data);
      indexJobs(mine.data);
    }
    end('jobs', board.error ?? mine.error);
  }, [userId, begin, end, indexJobs]);

  const loadJob = useCallback(
    async (jobId: string) => {
      if (!userId) return;
      begin('jobs');
      const res = await api.fetchJobById(jobId);
      if (!alive.current) return;
      if (res.data) indexJobs([res.data]);
      end('jobs', res.error);
    },
    [userId, begin, end, indexJobs]
  );

  const refreshMyApplications = useCallback(async () => {
    if (!userId) return;
    begin('applications');
    const res = await api.fetchMyApplications();
    if (!alive.current) return;
    if (res.data) {
      setMyApplications(res.data);
      indexJobs(res.data.map((a) => a.job).filter((j): j is Job => Boolean(j)));
    }
    end('applications', res.error);
  }, [userId, begin, end, indexJobs]);

  const loadApplicationsForJob = useCallback(
    async (jobId: string) => {
      if (!userId) return;
      begin('applications');
      const res = await api.fetchApplicationsForJob(jobId);
      if (!alive.current) return;
      if (res.data) setApplications((prev) => ({ ...prev, [jobId]: res.data as JobApplication[] }));
      end('applications', res.error);
    },
    [userId, begin, end]
  );

  const refreshOfferings = useCallback(async () => {
    if (!userId) return;
    begin('offerings');
    const [all, mine] = await Promise.all([api.fetchOfferings(), api.fetchMyOfferings()]);
    if (!alive.current) return;
    if (all.data) setOfferings(all.data);
    if (mine.data) setMyOfferings(mine.data);
    end('offerings', all.error ?? mine.error);
  }, [userId, begin, end]);

  const refreshChats = useCallback(async () => {
    if (!userId) return;
    begin('chats');
    const [list, unread] = await Promise.all([api.fetchMyChats(), api.fetchUnreadCounts()]);
    if (!alive.current) return;
    if (list.data) setChats(list.data);
    if (unread.data) setUnreadCounts(unread.data);
    end('chats', list.error ?? unread.error);
  }, [userId, begin, end]);

  const loadMessages = useCallback(
    async (chatId: string) => {
      if (!userId) return;
      begin('messages');
      const res = await api.fetchMessages(chatId);
      if (!alive.current) return;
      if (res.data) setMessagesByChat((prev) => ({ ...prev, [chatId]: res.data as Message[] }));
      end('messages', res.error);
    },
    [userId, begin, end]
  );

  const refreshBookingRequests = useCallback(async () => {
    if (!userId) return;
    begin('bookingRequests');
    const res = await api.fetchMyBookingRequests();
    if (!alive.current) return;
    if (res.data) setBookingRequests(res.data);
    end('bookingRequests', res.error);
  }, [userId, begin, end]);

  const loadReviews = useCallback(
    async (jobId: string) => {
      if (!userId) return;
      const res = await api.fetchReviewsForJob(jobId);
      if (!alive.current || !res.data) return;
      setReviewsByJob((prev) => ({ ...prev, [jobId]: res.data as Review[] }));
    },
    [userId]
  );

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    const res = await api.fetchMyProfile();
    if (!alive.current) return;
    setProfile(res.data);
    setProfileError(res.error);
  }, [userId]);

  // Initial load, and a full reset when the user changes or signs out.
  useEffect(() => {
    if (!userId) {
      setJobs([]);
      setMyJobs([]);
      setJobsById({});
      setMyApplications([]);
      setApplications({});
      setOfferings([]);
      setMyOfferings([]);
      setChats([]);
      setMessagesByChat({});
      setUnreadCounts({});
      setBookingRequests([]);
      setReviewsByJob({});
      setProfile(null);
      setProfileError(null);
      setLoading(noFlags());
      setErrors(noErrors());
      return;
    }
    void refreshProfile();
    void refreshJobs();
    void refreshMyApplications();
    void refreshOfferings();
    void refreshChats();
    void refreshBookingRequests();
  }, [userId, refreshProfile, refreshJobs, refreshMyApplications, refreshOfferings, refreshChats, refreshBookingRequests]);

  // ── Mutations ─────────────────────────────────────────────────────────

  const addJob = useCallback(
    async (input: api.NewJobInput) => {
      const res = await api.createJob(input);
      if (res.error) return failed(res.error);
      await refreshJobs();
      return succeeded;
    },
    [refreshJobs]
  );

  const addApplication = useCallback(
    async (jobId: string, quotedRate: number, note?: string) => {
      const res = await api.createApplication(jobId, quotedRate, note);
      if (res.error) return failed(res.error);
      await Promise.all([refreshMyApplications(), loadJob(jobId)]);
      return succeeded;
    },
    [refreshMyApplications, loadJob]
  );

  const addOffering = useCallback(
    async (input: api.NewOfferingInput) => {
      const res = await api.createOffering(input);
      if (res.error) return failed(res.error);
      await refreshOfferings();
      return succeeded;
    },
    [refreshOfferings]
  );

  const acceptApplication = useCallback(
    async (jobId: string, applicationId: string) => {
      const res = await api.acceptApplication(jobId, applicationId);
      if (res.error) return failed(res.error);
      // Accepting rejects the other applications and opens the chat, both
      // server-side, so the applications list and the chat list both move.
      await Promise.all([loadApplicationsForJob(jobId), loadJob(jobId), refreshChats()]);
      return succeeded;
    },
    [loadApplicationsForJob, loadJob, refreshChats]
  );

  const runJobRpc = useCallback(
    async (jobId: string, call: () => Promise<api.Result<null>>) => {
      const res = await call();
      if (res.error) return failed(res.error);
      await Promise.all([loadJob(jobId), refreshJobs()]);
      return succeeded;
    },
    [loadJob, refreshJobs]
  );

  const startJob = useCallback(
    (jobId: string) => runJobRpc(jobId, () => api.startJob(jobId)),
    [runJobRpc]
  );

  const markJobComplete = useCallback(
    (jobId: string) => runJobRpc(jobId, () => api.markJobComplete(jobId)),
    [runJobRpc]
  );

  const raiseDispute = useCallback(
    (jobId: string) => runJobRpc(jobId, () => api.raiseDispute(jobId)),
    [runJobRpc]
  );

  const cancelJob = useCallback(
    (jobId: string) => runJobRpc(jobId, () => api.cancelJob(jobId)),
    [runJobRpc]
  );

  const confirmJobCompletion = useCallback(
    async (jobId: string, enteredOtp: string) => {
      const res = await api.confirmJobCompletion(jobId, enteredOtp);
      if (res.error) return { ...failed(res.error), matched: false };
      const matched = res.data === true;
      if (matched) await Promise.all([loadJob(jobId), refreshJobs()]);
      return { ...succeeded, matched };
    },
    [loadJob, refreshJobs]
  );

  const requestOfferingBooking = useCallback(
    async (offeringId: string) => {
      const res = await api.requestOfferingBooking(offeringId);
      if (res.error || !res.data) return { ...failed(res.error ?? 'Could not open the booking chat.'), chatId: null };
      await Promise.all([refreshChats(), refreshBookingRequests()]);
      return { ...succeeded, chatId: res.data };
    },
    [refreshChats, refreshBookingRequests]
  );

  const confirmBooking = useCallback(
    async (bookingId: string) => {
      const res = await api.confirmBooking(bookingId);
      if (res.error) return failed(res.error);
      // Spawns a job and backfills it onto the existing chat.
      await Promise.all([refreshBookingRequests(), refreshChats(), refreshJobs()]);
      return succeeded;
    },
    [refreshBookingRequests, refreshChats, refreshJobs]
  );

  const declineBooking = useCallback(
    async (bookingId: string) => {
      const res = await api.declineBooking(bookingId);
      if (res.error) return failed(res.error);
      await Promise.all([refreshBookingRequests(), refreshChats()]);
      return succeeded;
    },
    [refreshBookingRequests, refreshChats]
  );

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      const res = await api.cancelBooking(bookingId);
      if (res.error) return failed(res.error);
      await Promise.all([refreshBookingRequests(), refreshChats()]);
      return succeeded;
    },
    [refreshBookingRequests, refreshChats]
  );

  const sendMessage = useCallback(
    async (chatId: string, text: string) => {
      const res = await api.sendMessage(chatId, text);
      if (res.error) return failed(res.error);
      await loadMessages(chatId);
      return succeeded;
    },
    [loadMessages]
  );

  const markChatRead = useCallback(
    async (chatId: string) => {
      const res = await api.markChatRead(chatId);
      if (res.error) return failed(res.error);
      if (alive.current) setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }));
      return succeeded;
    },
    []
  );

  const verifyCurrentWorker = useCallback(async () => {
    const res = await api.verifySelf();
    if (res.error) return failed(res.error);
    await refreshProfile();
    return succeeded;
  }, [refreshProfile]);

  const submitReview = useCallback(
    async (jobId: string, revieweeId: string, stars: number, tags: string[], reviewText: string) => {
      const res = await api.submitReview(jobId, revieweeId, stars, tags, reviewText);
      if (res.error) return failed(res.error);
      await loadReviews(jobId);
      return succeeded;
    },
    [loadReviews]
  );

  const peekJobOtp = useCallback(async (jobId: string) => {
    const res = await api.devPeekJobOtp(jobId);
    return { otp: res.data ?? null, error: res.error };
  }, []);

  // ── Realtime appliers (Stage D) ───────────────────────────────────────

  const applyMessageChange = useCallback((incoming: Message) => {
    setMessagesByChat((prev) => {
      const list = prev[incoming.chatId];
      // Only patch threads already open; an unopened one is fetched whole
      // when the user navigates in, so there is nothing to merge into.
      if (!list) return prev;
      const at = list.findIndex((m) => m.id === incoming.id);
      if (at === -1) return { ...prev, [incoming.chatId]: [...list, incoming] };
      const next = list.slice();
      next[at] = incoming;
      return { ...prev, [incoming.chatId]: next };
    });
  }, []);

  const applyChatChange = useCallback((incoming: Partial<Chat> & { id: string }) => {
    setChats((prev) => {
      const at = prev.findIndex((c) => c.id === incoming.id);
      // A brand-new chat arrives without its embedded profiles, so leave it
      // to refreshChats rather than rendering a nameless row.
      if (at === -1) return prev;
      const next = prev.slice();
      next[at] = { ...next[at], ...incoming };
      return next;
    });
  }, []);

  const applyJobChange = useCallback((incoming: Job) => {
    setJobsById((prev) => ({ ...prev, [incoming.id]: incoming }));
    setJobs((prev) => prev.map((j) => (j.id === incoming.id ? incoming : j)));
    setMyJobs((prev) => prev.map((j) => (j.id === incoming.id ? incoming : j)));
  }, []);

  // ── Realtime (Stage D) ────────────────────────────────────────────────

  // Keyed on the chat-id set, since the messages subscription is filtered
  // server-side by it: joining a new chat has to re-open the channel.
  const chatIdKey = chats.map((c) => c.id).sort().join(',');

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = api.subscribeToChanges({
      chatIds: chatIdKey ? chatIdKey.split(',') : [],
      onMessage: (m) => {
        applyMessageChange(m);
        // An incoming message from the other side relights the dot; the
        // open thread clears it again via markChatRead.
        if (m.senderId !== userId) {
          setUnreadCounts((prev) => ({ ...prev, [m.chatId]: (prev[m.chatId] ?? 0) + 1 }));
        }
      },
      onChatUpdate: applyChatChange,
      onNewChat: () => void refreshChats(),
      onJobUpdate: applyJobChange,
    });
    return unsubscribe;
  }, [userId, chatIdKey, applyMessageChange, applyChatChange, applyJobChange, refreshChats]);

  const value = useMemo<StoreShape>(
    () => ({
      jobs,
      myJobs,
      jobsById,
      myApplications,
      applications,
      offerings,
      myOfferings,
      chats,
      messagesByChat,
      unreadCounts,
      bookingRequests,
      reviewsByJob,
      profile,
      profileError,
      loading,
      errors,
      refreshJobs,
      refreshOfferings,
      refreshChats,
      refreshBookingRequests,
      refreshMyApplications,
      refreshProfile,
      loadJob,
      loadApplicationsForJob,
      loadMessages,
      loadReviews,
      addJob,
      addApplication,
      addOffering,
      acceptApplication,
      startJob,
      markJobComplete,
      confirmJobCompletion,
      raiseDispute,
      cancelJob,
      requestOfferingBooking,
      confirmBooking,
      declineBooking,
      cancelBooking,
      sendMessage,
      markChatRead,
      verifyCurrentWorker,
      submitReview,
      peekJobOtp,
      applyMessageChange,
      applyChatChange,
      applyJobChange,
    }),
    [
      jobs,
      myJobs,
      jobsById,
      myApplications,
      applications,
      offerings,
      myOfferings,
      chats,
      messagesByChat,
      unreadCounts,
      bookingRequests,
      reviewsByJob,
      profile,
      profileError,
      loading,
      errors,
      refreshJobs,
      refreshOfferings,
      refreshChats,
      refreshBookingRequests,
      refreshMyApplications,
      refreshProfile,
      loadJob,
      loadApplicationsForJob,
      loadMessages,
      loadReviews,
      addJob,
      addApplication,
      addOffering,
      acceptApplication,
      startJob,
      markJobComplete,
      confirmJobCompletion,
      raiseDispute,
      cancelJob,
      requestOfferingBooking,
      confirmBooking,
      declineBooking,
      cancelBooking,
      sendMessage,
      markChatRead,
      verifyCurrentWorker,
      submitReview,
      peekJobOtp,
      applyMessageChange,
      applyChatChange,
      applyJobChange,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export { COLLECTIONS };
