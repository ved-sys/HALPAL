import React, { createContext, useContext, useState } from 'react';
import { applicationsByJob, jobs as seedJobs, offerings as seedOfferings } from '@/data/mockData';
import { ApplicationStatus, Job, JobApplication, WorkerOffering } from '@/types/models';

interface StoreShape {
  jobs: Job[];
  applications: Record<string, JobApplication[]>;
  offerings: WorkerOffering[];
  addJob: (job: Job) => void;
  setApplicationStatus: (jobId: string, appId: string, status: ApplicationStatus) => void;
  addOffering: (offering: WorkerOffering) => void;
  addApplication: (jobId: string, application: JobApplication) => void;
}

const StoreContext = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(seedJobs);
  const [applications, setApplications] = useState(applicationsByJob);
  const [offerings, setOfferings] = useState<WorkerOffering[]>(seedOfferings);

  function addJob(job: Job) {
    setJobs((prev) => [job, ...prev]);
  }

  function setApplicationStatus(jobId: string, appId: string, status: ApplicationStatus) {
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
    }
  }

  function addOffering(offering: WorkerOffering) {
    setOfferings((prev) => [offering, ...prev]);
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
      value={{ jobs, applications, offerings, addJob, setApplicationStatus, addOffering, addApplication }}
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
