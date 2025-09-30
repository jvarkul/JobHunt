export interface Job {
  id: number;
  user_id: number;
  company_name: string;
  description: string;
  application_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobRequest {
  company_name: string;
  description: string;
  application_link?: string;
}

export interface UpdateJobRequest {
  company_name: string;
  description: string;
  application_link?: string;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
}
