import { Job, JobApplication, WorkerOffering, WorkerSummary } from '@/types/models';

export const currentCustomer = {
  id: 'cust_1',
  fullName: 'Adithya R.',
};

export const currentWorker: WorkerSummary = {
  id: 'work_1',
  fullName: 'Adithya R.',
  avatarColor: '#D98E04',
  isVerified: false,
  avgRating: 4.8,
  totalJobsCompleted: 14,
  skills: ['Delivery', 'Moving Help', 'Errands'],
  bio: 'Engineering student, picks up delivery and moving jobs on weekends.',
};

const workers: WorkerSummary[] = [
  {
    id: 'work_2',
    fullName: 'Priya Venkatesan',
    avatarColor: '#0E5C56',
    isVerified: true,
    avgRating: 4.9,
    totalJobsCompleted: 62,
    skills: ['Cleaning', 'Household Help', 'Moving Help'],
    bio: 'Experienced with house cleaning, tidying, and moving-day help. Reliable and punctual.',
  },
  {
    id: 'work_3',
    fullName: 'Karthik Subramaniam',
    avatarColor: '#A56C03',
    isVerified: true,
    avgRating: 4.6,
    totalJobsCompleted: 8,
    skills: ['Furniture Moving', 'Manual Labor'],
    bio: 'Available weekends for heavy lifting and moving jobs.',
  },
  {
    id: 'work_4',
    fullName: 'Meera Iyer',
    avatarColor: '#B0518C',
    isVerified: true,
    avgRating: 5.0,
    totalJobsCompleted: 31,
    skills: ['Bike Delivery', 'Queueing', 'Errands'],
    bio: 'Has her own two-wheeler, does bike deliveries and stands in line for errands across the city.',
  },
  {
    id: 'work_5',
    fullName: 'Suresh Babu',
    avatarColor: '#2E6DA4',
    isVerified: true,
    avgRating: 4.4,
    totalJobsCompleted: 19,
    skills: ['General Labor', 'Packing & Loading', 'Errands'],
    bio: 'Available for packing, loading, and general labor — flexible with timing.',
  },
];

export const jobs: Job[] = [
  {
    id: 'job_1',
    description:
      'Moving out of a 2BHK this weekend — need help carrying boxes and furniture down two floors and loading them into a mini-truck outside. About 3 hours of work.',
    categoryTags: ['Loading & Moving Help'],
    budgetMin: 600,
    budgetMax: 900,
    urgency: 'scheduled',
    scheduledDatetime: '2026-08-17T13:00:00+05:30',
    locationLabel: 'Adyar, Chennai',
    status: 'applications_received',
    moderationStatus: 'not_required',
    origin: 'customer_posted',
    createdAt: '2026-08-14T09:12:00+05:30',
    applicantCount: 3,
  },
  {
    id: 'job_2',
    description:
      'Looking for someone to help carry a 2-seater sofa and a study table up to the 3rd floor (no lift). About 2 hours of work.',
    categoryTags: ['Loading & Moving Help'],
    budgetMin: 600,
    budgetMax: 900,
    urgency: 'asap',
    locationLabel: 'Velachery, Chennai',
    status: 'open',
    moderationStatus: 'not_required',
    origin: 'customer_posted',
    createdAt: '2026-08-15T07:40:00+05:30',
    applicantCount: 1,
  },
  {
    id: 'job_3',
    description:
      'Need groceries picked up from the supermarket and dropped at my apartment — full list will be shared once accepted. Should take under an hour.',
    categoryTags: ['Delivery & Pickup'],
    budgetMin: 200,
    budgetMax: 350,
    urgency: 'asap',
    locationLabel: 'Anna Nagar, Chennai',
    status: 'open',
    moderationStatus: 'not_required',
    origin: 'customer_posted',
    createdAt: '2026-08-14T18:05:00+05:30',
    applicantCount: 0,
  },
  {
    id: 'job_4',
    description:
      'Need someone to stand in line at the RTO to submit a document and collect a receipt. Should take about 1.5–2 hours depending on the queue.',
    categoryTags: ['Errands & Queueing'],
    budgetMin: 400,
    budgetMax: 600,
    urgency: 'asap',
    locationLabel: 'T. Nagar, Chennai',
    status: 'open',
    moderationStatus: 'not_required',
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
      note: 'Done plenty of moving jobs, can bring packing tape and furniture blankets.',
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
    title: 'Bike Courier — Parcels, Documents & Food Pickup',
    description:
      'Own two-wheeler, can pick up and drop off parcels, documents, or food orders across the city. Quick turnaround.',
    categoryTags: ['Delivery & Pickup'],
    pricingType: 'platform_suggested',
    rate: 450,
    moderationStatus: 'not_required',
    status: 'active',
  },
  {
    id: 'off_2',
    worker: workers[0],
    title: 'Home Cleaning & Tidying',
    description:
      'General house cleaning — sweeping, mopping, dishes, and tidying up. Brings own basic supplies.',
    categoryTags: ['Cleaning & Household Help'],
    pricingType: 'custom',
    rate: 900,
    moderationStatus: 'approved',
    status: 'active',
  },
  {
    id: 'off_3',
    worker: workers[3],
    title: 'Packing & Loading Help',
    description: 'Help with packing boxes, loading/unloading a vehicle, or general labor around the house.',
    categoryTags: ['General Labor'],
    pricingType: 'platform_suggested',
    rate: 500,
    moderationStatus: 'not_required',
    status: 'active',
  },
];
