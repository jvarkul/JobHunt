export interface Job {
  id: number;
  user_id: number;
  description: string;
  application_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobRequest {
  description: string;
  application_link?: string;
}

export interface UpdateJobRequest {
  description: string;
  application_link?: string;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
}
