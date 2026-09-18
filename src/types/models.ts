// Frontend-facing subset of gig-app-data-schema.md, trimmed to what the
// UI needs. Field names match the schema doc so wiring a real API later
// is a rename, not a redesign.

export type JobCategory =
  | 'Delivery & Pickup'
  | 'Loading & Moving Help'
  | 'Errands & Queueing'
  | 'Cleaning & Household Help'
  | 'Event & Setup Help'
  | 'General Labor'
  | 'Other';

export type JobStatus =
  | 'open'
  | 'applications_received'
  | 'worker_selected'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'confirmed_completed'
  | 'disputed'
  | 'cancelled';

export type ApplicationStatus = 'applied' | 'shortlisted' | 'accepted' | 'rejected';

export interface WorkerSummary {
  id: string;
  fullName: string;
  avatarColor: string; // placeholder instead of a photo asset
  isVerified: boolean;
  avgRating: number;
  totalJobsCompleted: number;
  skills: string[];
  bio: string;
}

export interface Job {
  id: string;
  description: string;
  categoryTags: JobCategory[];
  budgetMin: number;
  budgetMax: number;
  urgency: 'asap' | 'scheduled';
  scheduledDatetime?: string;
  locationLabel: string;
  status: JobStatus;
  moderationStatus: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  origin: 'customer_posted' | 'worker_offered';
  createdAt: string;
  applicantCount: number;
}

export interface JobApplication {
  id: string;
  jobId: string;
  worker: WorkerSummary;
  quotedRate: number;
  note?: string;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface Chat {
  id: string;
  // A chat starts from exactly one of these: a job (customer accepted a
  // worker's application) or a booking request (customer requested an
  // offering). When a booking is confirmed, jobId is backfilled onto the
  // same chat so it carries on as an ordinary job chat.
  jobId?: string;
  bookingRequestId?: string;
  customerId: string;
  workerId: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  sentAt: string;
  read: boolean;
}

export interface BookingRequest {
  id: string;
  offeringId: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled';
  createdAt: string;
}

export interface WorkerOffering {
  id: string;
  worker: WorkerSummary;
  title: string;
  description: string;
  categoryTags: JobCategory[];
  pricingType: 'platform_suggested' | 'custom';
  rate: number;
  // 'pending_review'/'rejected' are declared for the future review flow on
  // custom-priced offerings but have no code path setting them yet — every
  // offering today defaults to 'not_required' or 'approved'. Known gap, not
  // forgotten.
  moderationStatus: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  status: 'active' | 'inactive';
}

export const categoryDescription: Record<JobCategory, string> = {
  'Delivery & Pickup': 'Groceries, parcels, food, documents, medicine — pickup, drop-off, or courier runs.',
  'Loading & Moving Help': 'Lifting and carrying. Moving house, loading/unloading vehicles, shop stocking, hauling furniture, clearing junk.',
  'Errands & Queueing': 'Running a task or standing in for someone. Waiting in line, small purchases, holding a spot.',
  'Cleaning & Household Help': 'Tidying and upkeep, indoors or out. Sweeping, mopping, dishes, laundry, yard work, washing a car or bike.',
  'Event & Setup Help': 'Extra hands for an occasion. Setting up or breaking down chairs, tents, decorations; festival prep; guiding guests; running a stall.',
  'General Labor': "Simple physical work that doesn't fit the rest — packing, sorting, basic assembly, an extra pair of hands.",
  'Other': "Doesn't fit any category above. Describe the job and it'll be reviewed before going live.",
};

// Hex values below are copied from theme/tokens.ts (colors.primary,
// primaryDark, teal, success, ink, inkSoft, muted) rather than imported —
// this file mirrors a backend schema doc and shouldn't depend on the UI
// theme layer. colors.danger is deliberately not reused here; tokens.ts
// reserves it for SOS/urgent and dispute states.
export const categoryColor: Record<JobCategory, string> = {
  'Delivery & Pickup': '#EC5B38',
  'Loading & Moving Help': '#B23F1F',
  'Errands & Queueing': '#0E5C56',
  'Cleaning & Household Help': '#7a8a5e',
  'Event & Setup Help': '#7a6a67',
  'General Labor': '#524646',
  'Other': '#A8A492',
};
