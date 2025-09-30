import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Job, CreateJobRequest, UpdateJobRequest, JobsResponse } from '../models/job.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobsService {
  private readonly API_BASE = `${environment.apiUrl}/jobs`;

  constructor(private http: HttpClient) {}

  /**
   * Get all jobs for the current user, sorted by updated_at DESC
   */
  getJobs(): Observable<JobsResponse> {
    return this.http.get<any>(`${this.API_BASE}`).pipe(
      map(response => ({
        jobs: response.jobs,
        total: response.total
      } as JobsResponse))
    );
  }

  /**
   * Create a new job
   */
  createJob(jobData: CreateJobRequest): Observable<Job> {
    return this.http.post<any>(`${this.API_BASE}`, jobData).pipe(
      map(response => response.job as Job)
    );
  }

  /**
   * Update an existing job
   */
  updateJob(id: number, jobData: UpdateJobRequest): Observable<Job> {
    return this.http.put<any>(`${this.API_BASE}/${id}`, jobData).pipe(
      map(response => response.job as Job)
    );
  }

  /**
   * Delete a job
   */
  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/${id}`);
  }
}
