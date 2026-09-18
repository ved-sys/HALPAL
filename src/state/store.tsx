import React, { createContext, useContext, useRef, useState } from 'react';
import { applicationsByJob, currentCustomer, currentWorker, jobs as seedJobs, offerings as seedOfferings } from '@/data/mockData';
import { ApplicationStatus, BookingRequest, Chat, Job, JobApplication, Message, WorkerOffering } from '@/types/models';

interface StoreShape {
  jobs: Job[];
  applications: Record<string, JobApplication[]>;
  offerings: WorkerOffering[];
  currentWorkerVerified: boolean;
  chats: Chat[];
  messagesByChat: Record<string, Message[]>;
  bookingRequests: BookingRequest[];
  otpByJob: Record<string, string>;
  addJob: (job: Omit<Job, 'moderationStatus'>) => void;
  setApplicationStatus: (jobId: string, appId: string, status: ApplicationStatus) => void;
  addOffering: (offering: WorkerOffering) => void;
  addApplication: (jobId: string, application: JobApplication) => void;
  verifyCurrentWorker: () => void;
  ensureChatForJob: (jobId: string) => Chat | null;
  sendMessage: (chatId: string, senderId: string, text: string) => void;
  markChatRead: (chatId: string, userId: string) => void;
  requestOfferingBooking: (offeringId: string, customerId: string) => Chat | null;
  confirmBooking: (bookingRequestId: string) => void;
  declineBooking: (bookingRequestId: string) => void;
  cancelBooking: (bookingRequestId: string) => void;
  startJob: (jobId: string) => void;
  markJobComplete: (jobId: string) => void;
  confirmJobCompletion: (jobId: string, enteredOtp: string) => boolean;
  raiseDispute: (jobId: string) => void;
  cancelJob: (jobId: string) => void;
}

const StoreContext = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(seedJobs);
  const [applications, setApplications] = useState(applicationsByJob);
  const [offerings, setOfferings] = useState<WorkerOffering[]>(seedOfferings);
  const [currentWorkerVerified, setCurrentWorkerVerified] = useState(currentWorker.isVerified);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [otpByJob, setOtpByJob] = useState<Record<string, string>>({});
  const autoRepliedChats = useRef<Set<string>>(new Set());

  function addJob(job: Omit<Job, 'moderationStatus'>) {
    // Jobs tagged 'Other' don't match a known category, so they're held
    // for review before appearing in the feed — same idea as an offering's
    // moderationStatus.
    const moderationStatus: Job['moderationStatus'] = job.categoryTags.includes('Other')
      ? 'pending_review'
      : 'not_required';
    setJobs((prev) => [{ ...job, moderationStatus }, ...prev]);
  }

  function setApplicationStatus(jobId: string, appId: string, status: ApplicationStatus) {
    // Captured before the state update below runs, since setApplications
    // is async — by the time it lands, `applications` here would still be
    // stale for this same synchronous call.
    const acceptedWorkerId = applications[jobId]?.find((a) => a.id === appId)?.worker.id;

    setApplications((prev) => {
      const list = prev[jobId] ?? [];
      const updated = list.map((a) => {
        if (a.id === appId) return { ...a, status };
        // accepting one application auto-rejects the rest, per schema rule
        if (status === 'accepted' && a.status !== 'rejected') return { ...a, status: 'rejected' as ApplicationStatus };
        return a;
      });
      return { ...prev, [jobId]: updated };
    });
    if (status === 'accepted') {
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'worker_selected' } : j)));
      if (acceptedWorkerId) createChatIfMissing(jobId, acceptedWorkerId);
    }
  }

  function createChatIfMissing(jobId: string, workerId: string): Chat {
    const existing = chats.find((c) => c.jobId === jobId);
    if (existing) return existing;
    const now = new Date().toISOString();
    const chat: Chat = {
      id: `chat_${jobId}`,
      jobId,
      customerId: currentCustomer.id,
      workerId,
      createdAt: now,
      lastMessageAt: now,
    };
    setChats((prev) => (prev.some((c) => c.jobId === jobId) ? prev : [...prev, chat]));
    return chat;
  }

  function ensureChatForJob(jobId: string): Chat | null {
    const existing = chats.find((c) => c.jobId === jobId);
    if (existing) return existing;
    const acceptedApplication = (applications[jobId] ?? []).find((a) => a.status === 'accepted');
    if (!acceptedApplication) return null;
    return createChatIfMissing(jobId, acceptedApplication.worker.id);
  }

  function sendMessage(chatId: string, senderId: string, text: string) {
    const message: Message = {
      id: `msg_${Date.now()}`,
      chatId,
      senderId,
      text,
      sentAt: new Date().toISOString(),
      read: false,
    };
    setMessagesByChat((prev) => ({ ...prev, [chatId]: [...(prev[chatId] ?? []), message] }));
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, lastMessageAt: message.sentAt } : c)));

    // One canned auto-reply per chat, for demo purposes only.
    if (autoRepliedChats.current.has(chatId)) return;
    autoRepliedChats.current.add(chatId);
    const chat = chats.find((c) => c.id === chatId);
    if (!chat) return;
    const otherId = senderId === chat.customerId ? chat.workerId : chat.customerId;
    setTimeout(() => {
      const reply: Message = {
        id: `msg_${Date.now()}_auto`,
        chatId,
        senderId: otherId,
        text: 'Sounds good, thanks for the update!',
        sentAt: new Date().toISOString(),
        read: false,
      };
      setMessagesByChat((prev) => ({ ...prev, [chatId]: [...(prev[chatId] ?? []), reply] }));
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, lastMessageAt: reply.sentAt } : c)));
    }, 2500);
  }

  function markChatRead(chatId: string, userId: string) {
    setMessagesByChat((prev) => {
      const list = prev[chatId];
      if (!list) return prev;
      return { ...prev, [chatId]: list.map((m) => (m.senderId !== userId ? { ...m, read: true } : m)) };
    });
  }

  function requestOfferingBooking(offeringId: string, customerId: string): Chat | null {
    const offering = offerings.find((o) => o.id === offeringId);
    if (!offering) return null;

    const now = new Date().toISOString();
    const bookingRequest: BookingRequest = {
      id: `book_${Date.now()}`,
      offeringId,
      customerId,
      status: 'pending',
      createdAt: now,
    };
    setBookingRequests((prev) => [bookingRequest, ...prev]);

    const chat: Chat = {
      id: `chat_${bookingRequest.id}`,
      bookingRequestId: bookingRequest.id,
      customerId,
      workerId: offering.worker.id,
      createdAt: now,
      lastMessageAt: now,
    };
    setChats((prev) => [...prev, chat]);
    return chat;
  }

  function confirmBooking(bookingRequestId: string) {
    const bookingRequest = bookingRequests.find((b) => b.id === bookingRequestId);
    if (!bookingRequest || bookingRequest.status !== 'pending') return;

    setBookingRequests((prev) =>
      prev.map((b) => (b.id === bookingRequestId ? { ...b, status: 'confirmed' } : b))
    );

    const offering = offerings.find((o) => o.id === bookingRequest.offeringId);
    if (!offering) return;

    const newJob: Job = {
      id: `job_${Date.now()}`,
      description: offering.description,
      categoryTags: offering.categoryTags,
      budgetMin: offering.rate,
      budgetMax: offering.rate,
      urgency: 'scheduled',
      locationLabel: 'To be confirmed in chat',
      status: 'worker_selected',
      moderationStatus: 'not_required',
      origin: 'worker_offered',
      createdAt: new Date().toISOString(),
      applicantCount: 0,
    };
    setJobs((prev) => [newJob, ...prev]);

    // Backfill jobId onto the same chat rather than creating a new one, so
    // JobDetailScreen's existing ensureChatForJob(job.id) lookup finds it
    // immediately and the thread carries on uninterrupted.
    setChats((prev) =>
      prev.map((c) => (c.bookingRequestId === bookingRequestId ? { ...c, jobId: newJob.id } : c))
    );
  }

  function declineBooking(bookingRequestId: string) {
    setBookingRequests((prev) =>
      prev.map((b) => (b.id === bookingRequestId ? { ...b, status: 'declined' } : b))
    );
  }

  function cancelBooking(bookingRequestId: string) {
    setBookingRequests((prev) =>
      prev.map((b) => (b.id === bookingRequestId ? { ...b, status: 'cancelled' } : b))
    );
  }

  function startJob(jobId: string) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId && j.status === 'worker_selected' ? { ...j, status: 'in_progress' } : j))
    );
  }

  function markJobComplete(jobId: string) {
    // A real build would text this OTP to the customer and auto-confirm
    // the job 6-12hrs after this call if the customer never enters it —
    // skipped here since there's no real timer or SMS to back it, and a
    // separate "force confirm" button would just be a second, redundant
    // way to reach the same state the customer's OTP flow already reaches.
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setOtpByJob((prev) => ({ ...prev, [jobId]: otp }));
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId && j.status === 'in_progress' ? { ...j, status: 'awaiting_confirmation' } : j))
    );
  }

  function confirmJobCompletion(jobId: string, enteredOtp: string): boolean {
    const job = jobs.find((j) => j.id === jobId);
    if (!job || job.status !== 'awaiting_confirmation') return false;

    // Job carries no customerId of its own (see mockData's "all posted
    // jobs belong to the current customer" note) — its chat is the one
    // place that records who the posting customer actually is.
    const chat = chats.find((c) => c.jobId === jobId);
    if (!chat || chat.customerId !== currentCustomer.id) return false;

    const expectedOtp = otpByJob[jobId];
    if (!expectedOtp || expectedOtp !== enteredOtp) return false;

    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'confirmed_completed' } : j)));
    return true;
  }

  function raiseDispute(jobId: string) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId && j.status === 'awaiting_confirmation' ? { ...j, status: 'disputed' } : j))
    );
  }

  function cancelJob(jobId: string) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && (j.status === 'open' || j.status === 'applications_received' || j.status === 'worker_selected')
          ? { ...j, status: 'cancelled' }
          : j
      )
    );
  }

  function addOffering(offering: WorkerOffering) {
    setOfferings((prev) => [offering, ...prev]);
  }

  function verifyCurrentWorker() {
    setCurrentWorkerVerified(true);
  }

  function addApplication(jobId: string, application: JobApplication) {
    setApplications((prev) => ({ ...prev, [jobId]: [...(prev[jobId] ?? []), application] }));
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, applicantCount: j.applicantCount + 1, status: 'applications_received' }
          : j
      )
    );
  }

  return (
    <StoreContext.Provider
      value={{
        jobs,
        applications,
        offerings,
        currentWorkerVerified,
        chats,
        messagesByChat,
        bookingRequests,
        otpByJob,
        addJob,
        setApplicationStatus,
        addOffering,
        addApplication,
        verifyCurrentWorker,
        ensureChatForJob,
        sendMessage,
        markChatRead,
        requestOfferingBooking,
        confirmBooking,
        declineBooking,
        cancelBooking,
        startJob,
        markJobComplete,
        confirmJobCompletion,
        raiseDispute,
        cancelJob,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
