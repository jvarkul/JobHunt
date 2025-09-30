import { Bullet } from './bullet.model';

export interface Experience {
  id: number;
  user_id: number;
  company_name: string;
  job_title: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string | null; // ISO date string or null for current positions
  isCurrentlyWorkingHere: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExperienceWithBullets extends Experience {
  bullets: Bullet[];
}

export interface CreateExperienceRequest {
  company_name: string;
  job_title: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date?: string | null; // ISO date string or null for current positions
  isCurrentlyWorkingHere: boolean;
}

export interface UpdateExperienceRequest {
  company_name: string;
  job_title: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date?: string | null; // ISO date string or null for current positions
  isCurrentlyWorkingHere: boolean;
}

export interface ExperienceResponse {
  success: boolean;
  experience: Experience;
}

export interface ExperiencesResponse {
  success: boolean;
  experiences: Experience[];
  total: number;
}

export interface ExperienceWithBulletsResponse {
  success: boolean;
  experience: ExperienceWithBullets;
}

export interface ExperiencesWithBulletsResponse {
  success: boolean;
  experiences: ExperienceWithBullets[];
  total: number;
}

export interface BulletAssociationRequest {
  bullet_id: number;
}

export interface BulletAssociationResponse {
  success: boolean;
  association: {
    id: number;
    experience_id: number;
    bullet_id: number;
    created_at: string;
  };
}

export interface ExperienceStatsResponse {
  success: boolean;
  stats: {
    total_experiences: number;
    total_bullets_used: number;
    total_associations: number;
    avg_bullets_per_experience: number;
  };
}