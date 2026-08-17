// Frontend-facing subset of gig-app-data-schema.md, trimmed to what the
// UI needs. Field names match the schema doc so wiring a real API later
// is a rename, not a redesign.

export type VerificationTier = 'none' | 'level_1' | 'level_2' | 'level_3';

export type JobCategory =
  | 'Care'
  | 'Tutoring/Skills'
  | 'Manual Help'
  | 'Errands'
  | 'Events'
  | 'Tech Help';

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
  verificationTier: VerificationTier;
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
  minVerificationTierRequired: VerificationTier;
  status: JobStatus;
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

export interface WorkerOffering {
  id: string;
  worker: WorkerSummary;
  title: string;
  description: string;
  categoryTags: JobCategory[];
  pricingType: 'platform_suggested' | 'custom';
  rate: number;
  moderationStatus: 'not_required' | 'pending_review' | 'approved' | 'rejected';
  status: 'active' | 'inactive';
}

export const verificationTierLabel: Record<VerificationTier, string> = {
  none: 'Unverified',
  level_1: 'ID Verified',
  level_2: 'Face Matched',
  level_3: 'Background Checked',
};

export const categoryColor: Record<JobCategory, string> = {
  Care: '#C1432A',
  'Tutoring/Skills': '#0E5C56',
  'Manual Help': '#A56C03',
  Errands: '#7A6A9C',
  Events: '#B0518C',
  'Tech Help': '#2E6DA4',
};
