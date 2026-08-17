import { Job, JobApplication, WorkerOffering, WorkerSummary } from '@/types/models';

export const currentCustomer = {
  id: 'cust_1',
  fullName: 'Adithya R.',
};

export const currentWorker: WorkerSummary = {
  id: 'work_1',
  fullName: 'Adithya R.',
  avatarColor: '#D98E04',
  verificationTier: 'level_2',
  avgRating: 4.8,
  totalJobsCompleted: 14,
  skills: ['Tutoring', 'Chess', 'Conversational Japanese'],
  bio: 'Engineering student, tutors chess and Japanese on weekends.',
};

const workers: WorkerSummary[] = [
  {
    id: 'work_2',
    fullName: 'Priya Venkatesan',
    avatarColor: '#0E5C56',
    verificationTier: 'level_3',
    avgRating: 4.9,
    totalJobsCompleted: 62,
    skills: ['Elder Care', 'First Aid', 'Cooking'],
    bio: 'Retired nurse, 12 years in geriatric care. Level 3 verified.',
  },
  {
    id: 'work_3',
    fullName: 'Karthik Subramaniam',
    avatarColor: '#A56C03',
    verificationTier: 'level_1',
    avgRating: 4.6,
    totalJobsCompleted: 8,
    skills: ['Furniture Moving', 'Manual Labor'],
    bio: 'Available weekends for heavy lifting and moving jobs.',
  },
  {
    id: 'work_4',
    fullName: 'Meera Iyer',
    avatarColor: '#B0518C',
    verificationTier: 'level_2',
    avgRating: 5.0,
    totalJobsCompleted: 31,
    skills: ['Crochet', 'Hobby Teaching', 'Craft'],
    bio: 'Crochet hobbyist teaching beginner lessons at home.',
  },
  {
    id: 'work_5',
    fullName: 'Suresh Babu',
    avatarColor: '#2E6DA4',
    verificationTier: 'level_1',
    avgRating: 4.4,
    totalJobsCompleted: 19,
    skills: ['Tech Setup', 'Wifi Troubleshooting'],
    bio: 'Freelance IT support, home network and device setup.',
  },
];

export const jobs: Job[] = [
  {
    id: 'job_1',
    description:
      'Need someone to sit with my grandmother (78) for the afternoon while I attend a hospital appointment. She just needs company and help with lunch — no medical tasks.',
    categoryTags: ['Care'],
    budgetMin: 500,
    budgetMax: 800,
    urgency: 'scheduled',
    scheduledDatetime: '2026-08-17T13:00:00+05:30',
    locationLabel: 'Adyar, Chennai',
    minVerificationTierRequired: 'level_3',
    status: 'applications_received',
    origin: 'customer_posted',
    createdAt: '2026-08-14T09:12:00+05:30',
    applicantCount: 3,
  },
  {
    id: 'job_2',
    description:
      'Looking for someone to help carry a 2-seater sofa and a study table up to the 3rd floor (no lift). About 2 hours of work.',
    categoryTags: ['Manual Help'],
    budgetMin: 600,
    budgetMax: 900,
    urgency: 'asap',
    locationLabel: 'Velachery, Chennai',
    minVerificationTierRequired: 'level_1',
    status: 'open',
    origin: 'customer_posted',
    createdAt: '2026-08-15T07:40:00+05:30',
    applicantCount: 1,
  },
  {
    id: 'job_3',
    description:
      'My 9-year-old wants to learn chess basics. Looking for someone patient for a weekly 1-hour session, at least for a month.',
    categoryTags: ['Tutoring/Skills'],
    budgetMin: 300,
    budgetMax: 500,
    urgency: 'scheduled',
    scheduledDatetime: '2026-08-18T17:00:00+05:30',
    locationLabel: 'Anna Nagar, Chennai',
    minVerificationTierRequired: 'level_2',
    status: 'open',
    origin: 'customer_posted',
    createdAt: '2026-08-14T18:05:00+05:30',
    applicantCount: 0,
  },
  {
    id: 'job_4',
    description:
      'Need a laptop set up with printer + wifi, and an old hard drive backed up to a new one. Should take under 2 hours.',
    categoryTags: ['Tech Help'],
    budgetMin: 400,
    budgetMax: 600,
    urgency: 'asap',
    locationLabel: 'T. Nagar, Chennai',
    minVerificationTierRequired: 'level_1',
    status: 'open',
    origin: 'customer_posted',
    createdAt: '2026-08-15T06:00:00+05:30',
    applicantCount: 2,
  },
];

export const applicationsByJob: Record<string, JobApplication[]> = {
  job_1: [
    {
      id: 'app_1',
      jobId: 'job_1',
      worker: workers[0],
      quotedRate: 700,
      note: 'I have 12 years of elder-care experience, happy to bring my own first-aid kit.',
      status: 'applied',
      appliedAt: '2026-08-14T10:00:00+05:30',
    },
    {
      id: 'app_2',
      jobId: 'job_1',
      worker: workers[3],
      quotedRate: 650,
      status: 'applied',
      appliedAt: '2026-08-14T11:30:00+05:30',
    },
    {
      id: 'app_3',
      jobId: 'job_1',
      worker: workers[1],
      quotedRate: 800,
      note: 'Available all afternoon, can extend if needed.',
      status: 'shortlisted',
      appliedAt: '2026-08-14T12:15:00+05:30',
    },
  ],
  job_2: [
    {
      id: 'app_4',
      jobId: 'job_2',
      worker: workers[1],
      quotedRate: 800,
      status: 'applied',
      appliedAt: '2026-08-15T08:00:00+05:30',
    },
  ],
  job_4: [
    {
      id: 'app_5',
      jobId: 'job_4',
      worker: workers[3],
      quotedRate: 500,
      status: 'applied',
      appliedAt: '2026-08-15T06:30:00+05:30',
    },
    {
      id: 'app_6',
      jobId: 'job_4',
      worker: workers[0],
      quotedRate: 600,
      status: 'applied',
      appliedAt: '2026-08-15T07:00:00+05:30',
    },
  ],
};

export const offerings: WorkerOffering[] = [
  {
    id: 'off_1',
    worker: workers[2],
    title: 'Beginner Crochet Lessons at Your Home',
    description:
      'Learn the basics — chain stitch, single crochet, and a simple coaster project. All materials included.',
    categoryTags: ['Tutoring/Skills', 'Events'],
    pricingType: 'platform_suggested',
    rate: 450,
    moderationStatus: 'not_required',
    status: 'active',
  },
  {
    id: 'off_2',
    worker: workers[0],
    title: 'Companion Care & Light Housekeeping',
    description:
      'Retired nurse offering companion visits — meal prep, light housekeeping, medication reminders (non-medical).',
    categoryTags: ['Care'],
    pricingType: 'custom',
    rate: 900,
    moderationStatus: 'approved',
    status: 'active',
  },
  {
    id: 'off_3',
    worker: workers[3],
    title: 'Home Network & Smart Device Setup',
    description: 'Router setup, wifi optimization, smart TV / speaker pairing.',
    categoryTags: ['Tech Help'],
    pricingType: 'platform_suggested',
    rate: 500,
    moderationStatus: 'not_required',
    status: 'active',
  },
];
