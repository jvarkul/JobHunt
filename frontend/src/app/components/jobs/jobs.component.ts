import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { JobsService } from '../../services/jobs.service';
import { Job } from '../../models/job.model';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './jobs.component.html',
  styleUrl: './jobs.component.css'
})
export class JobsComponent implements OnInit, OnDestroy {
  jobs: Job[] = [];
  jobForm!: FormGroup;
  editingJob: Job | null = null;
  editForm!: FormGroup;

  expandedJobIds = new Set<number>();

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private jobsService: JobsService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.jobForm = this.formBuilder.group({
      company_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(2000)]],
      application_link: ['', [Validators.pattern(/^https?:\/\/.+/)]]
    });

    this.editForm = this.formBuilder.group({
      company_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(2000)]],
      application_link: ['', [Validators.pattern(/^https?:\/\/.+/)]]
    });
  }

  loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.jobsService.getJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.jobs = response.jobs;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load jobs. Please try again.';
          this.isLoading = false;
          console.error('Error loading jobs:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.jobForm.invalid) {
      this.jobForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const jobData = {
      company_name: this.jobForm.value.company_name.trim(),
      description: this.jobForm.value.description.trim(),
      application_link: this.jobForm.value.application_link?.trim() || undefined
    };

    this.jobsService.createJob(jobData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newJob) => {
          this.jobs.unshift(newJob); // Add to beginning since it's the newest
          this.jobForm.reset();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to create job. Please try again.';
          this.isSubmitting = false;
          console.error('Error creating job:', error);
        }
      });
  }

  startEdit(job: Job): void {
    this.editingJob = job;
    this.editForm.patchValue({
      company_name: job.company_name,
      description: job.description,
      application_link: job.application_link || ''
    });
  }

  cancelEdit(): void {
    this.editingJob = null;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingJob) {
      this.editForm.markAllAsTouched();
      return;
    }

    const jobData = {
      company_name: this.editForm.value.company_name.trim(),
      description: this.editForm.value.description.trim(),
      application_link: this.editForm.value.application_link?.trim() || undefined
    };

    this.jobsService.updateJob(this.editingJob.id, jobData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedJob) => {
          const index = this.jobs.findIndex(j => j.id === updatedJob.id);
          if (index !== -1) {
            this.jobs[index] = updatedJob;
            // Re-sort by updated_at since this job was just updated
            this.jobs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          }
          this.cancelEdit();
        },
        error: (error) => {
          this.errorMessage = 'Failed to update job. Please try again.';
          console.error('Error updating job:', error);
        }
      });
  }

  deleteJob(job: Job): void {
    if (!confirm('Are you sure you want to delete this job application?')) {
      return;
    }

    this.jobsService.deleteJob(job.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.jobs = this.jobs.filter(j => j.id !== job.id);
          this.expandedJobIds.delete(job.id);
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete job. Please try again.';
          console.error('Error deleting job:', error);
        }
      });
  }

  toggleDescription(jobId: number): void {
    if (this.expandedJobIds.has(jobId)) {
      this.expandedJobIds.delete(jobId);
    } else {
      this.expandedJobIds.add(jobId);
    }
  }

  isDescriptionExpanded(jobId: number): boolean {
    return this.expandedJobIds.has(jobId);
  }

  shouldShowReadMore(description: string): boolean {
    return description.length > 150;
  }

  getPreviewText(description: string): string {
    if (description.length <= 150) {
      return description;
    }
    return description.substring(0, 150) + '...';
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'This field is required';
      }
      if (field.errors['minlength']) {
        return `Minimum length is ${field.errors['minlength'].requiredLength} characters`;
      }
      if (field.errors['maxlength']) {
        return `Maximum length is ${field.errors['maxlength'].requiredLength} characters`;
      }
      if (field.errors['pattern']) {
        return 'Please enter a valid URL (starting with http:// or https://)';
      }
    }
    return '';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  }

  trackByJobId(index: number, job: Job): number {
    return job.id;
  }
}