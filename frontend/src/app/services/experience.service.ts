import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Experience,
  ExperienceWithBullets,
  CreateExperienceRequest,
  UpdateExperienceRequest,
  ExperienceResponse,
  ExperiencesResponse,
  ExperienceWithBulletsResponse,
  ExperiencesWithBulletsResponse,
  BulletAssociationRequest,
  BulletAssociationResponse,
  ExperienceStatsResponse
} from '../models/experience.model';

@Injectable({
  providedIn: 'root'
})
export class ExperienceService {
  private readonly API_BASE = `${environment.apiUrl}/experience`;

  constructor(private http: HttpClient) {}

  /**
   * Get all experiences for the current user
   */
  getExperiences(options?: {
    limit?: number;
    offset?: number;
    includeBullets?: boolean;
    orderBy?: 'start_date' | 'end_date' | 'company_name' | 'job_title' | 'created_at';
    orderDirection?: 'ASC' | 'DESC';
  }): Observable<ExperiencesResponse | ExperiencesWithBulletsResponse> {
    let params = new HttpParams();

    if (options?.limit) {
      params = params.set('limit', options.limit.toString());
    }
    if (options?.offset) {
      params = params.set('offset', options.offset.toString());
    }
    if (options?.includeBullets) {
      params = params.set('includeBullets', options.includeBullets.toString());
    }
    if (options?.orderBy) {
      params = params.set('orderBy', options.orderBy);
    }
    if (options?.orderDirection) {
      params = params.set('orderDirection', options.orderDirection);
    }

    return this.http.get<any>(this.API_BASE, { params }).pipe(
      map(response => {
        if (options?.includeBullets) {
          return {
            success: response.success,
            experiences: response.experiences as ExperienceWithBullets[],
            total: response.total
          } as ExperiencesWithBulletsResponse;
        } else {
          return {
            success: response.success,
            experiences: response.experiences as Experience[],
            total: response.total
          } as ExperiencesResponse;
        }
      })
    );
  }

  /**
   * Get a single experience by ID
   */
  getExperience(id: number, includeBullets: boolean = false): Observable<ExperienceResponse | ExperienceWithBulletsResponse> {
    let params = new HttpParams();
    if (includeBullets) {
      params = params.set('includeBullets', 'true');
    }

    return this.http.get<any>(`${this.API_BASE}/${id}`, { params }).pipe(
      map(response => {
        if (includeBullets) {
          return {
            success: response.success,
            experience: response.experience as ExperienceWithBullets
          } as ExperienceWithBulletsResponse;
        } else {
          return {
            success: response.success,
            experience: response.experience as Experience
          } as ExperienceResponse;
        }
      })
    );
  }

  /**
   * Create a new experience
   */
  createExperience(experienceData: CreateExperienceRequest): Observable<Experience> {
    return this.http.post<any>(this.API_BASE, experienceData).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to create experience');
        }
        return response.experience as Experience;
      })
    );
  }

  /**
   * Update an existing experience
   */
  updateExperience(id: number, experienceData: UpdateExperienceRequest): Observable<Experience> {
    return this.http.put<any>(`${this.API_BASE}/${id}`, experienceData).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to update experience');
        }
        return response.experience as Experience;
      })
    );
  }

  /**
   * Delete an experience
   */
  deleteExperience(id: number): Observable<void> {
    return this.http.delete<any>(`${this.API_BASE}/${id}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to delete experience');
        }
        return;
      })
    );
  }

  /**
   * Associate a bullet with an experience
   */
  addBulletToExperience(experienceId: number, bulletId: number): Observable<any> {
    const requestData: BulletAssociationRequest = { bullet_id: bulletId };
    return this.http.post<any>(`${this.API_BASE}/${experienceId}/bullets`, requestData).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to associate bullet with experience');
        }
        return response.association;
      })
    );
  }

  /**
   * Remove a bullet association from an experience
   */
  removeBulletFromExperience(experienceId: number, bulletId: number): Observable<void> {
    return this.http.delete<any>(`${this.API_BASE}/${experienceId}/bullets/${bulletId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to remove bullet from experience');
        }
        return;
      })
    );
  }

  /**
   * Get user's experience statistics
   */
  getExperienceStats(): Observable<any> {
    return this.http.get<any>(`${this.API_BASE}/stats`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.error || 'Failed to get experience statistics');
        }
        return response.stats;
      })
    );
  }

  /**
   * Helper method to format date for display
   */
  formatDateForDisplay(dateString: string | null): string {
    if (!dateString) {
      return 'Present';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  }

  /**
   * Helper method to format date range
   */
  formatDateRange(startDate: string, endDate: string | null): string {
    if (!startDate) return 'Unknown dates';

    const start = this.formatDateForDisplay(startDate);
    const end = this.formatDateForDisplay(endDate);
    return `${start} - ${end}`;
  }

  /**
   * Helper method to calculate duration
   */
  calculateDuration(startDate: string, endDate: string | null): string {
    if (!startDate) return 'Unknown duration';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);

    if (diffYears >= 1) {
      const remainingMonths = diffMonths % 12;
      if (remainingMonths === 0) {
        return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
      }
      return `${diffYears} year${diffYears > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    } else if (diffMonths >= 1) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      return 'Less than a month';
    }
  }

  /**
   * Helper method to validate experience dates
   */
  validateExperienceDates(startDate: string, endDate: string | null, isCurrentlyWorking: boolean): string | null {
    if (!startDate) {
      return 'Start date is required';
    }

    const start = new Date(startDate);
    const today = new Date();

    if (start > today) {
      return 'Start date cannot be in the future';
    }

    if (!isCurrentlyWorking) {
      if (!endDate) {
        return 'End date is required when not currently working';
      }

      const end = new Date(endDate);
      if (end <= start) {
        return 'End date must be after start date';
      }

      if (end > today) {
        return 'End date cannot be in the future';
      }
    } else {
      if (endDate) {
        return 'End date should not be provided when currently working';
      }
    }

    return null;
  }
}