import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ExperienceService } from '../../services/experience.service';
import { BulletsService } from '../../services/bullets.service';
import { Experience, ExperienceWithBullets, CreateExperienceRequest, UpdateExperienceRequest } from '../../models/experience.model';
import { Bullet } from '../../models/bullet.model';

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './experience.component.html',
  styleUrl: './experience.component.css'
})
export class ExperienceComponent implements OnInit, OnDestroy {
  experiences: ExperienceWithBullets[] = [];
  availableBullets: Bullet[] = [];
  experienceForm!: FormGroup;
  editingExperience: Experience | null = null;
  editForm!: FormGroup;

  // UI State
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  showForm = false;

  // Bullet association state
  showBulletSelector: { [experienceId: number]: boolean } = {};
  bulletAssociationLoading: { [experienceId: number]: boolean } = {};

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private experienceService: ExperienceService,
    private bulletsService: BulletsService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.experienceForm = this.formBuilder.group({
      company_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      job_title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      start_date: ['', [Validators.required]],
      end_date: [''],
      isCurrentlyWorkingHere: [false]
    });

    this.editForm = this.formBuilder.group({
      company_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      job_title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      start_date: ['', [Validators.required]],
      end_date: [''],
      isCurrentlyWorkingHere: [false]
    });

    // Watch for changes in "currently working" checkbox
    this.experienceForm.get('isCurrentlyWorkingHere')?.valueChanges.subscribe(isCurrently => {
      const endDateControl = this.experienceForm.get('end_date');
      if (isCurrently) {
        endDateControl?.setValue('');
        endDateControl?.clearValidators();
      } else {
        endDateControl?.setValidators([Validators.required]);
      }
      endDateControl?.updateValueAndValidity();
    });

    this.editForm.get('isCurrentlyWorkingHere')?.valueChanges.subscribe(isCurrently => {
      const endDateControl = this.editForm.get('end_date');
      if (isCurrently) {
        endDateControl?.setValue('');
        endDateControl?.clearValidators();
      } else {
        endDateControl?.setValidators([Validators.required]);
      }
      endDateControl?.updateValueAndValidity();
    });
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Load both experiences and bullets in parallel
    forkJoin({
      experiences: this.experienceService.getExperiences({ includeBullets: true, orderBy: 'start_date', orderDirection: 'DESC' }),
      bullets: this.bulletsService.getBullets()
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ experiences, bullets }) => {
          this.experiences = (experiences as any).experiences;
          this.availableBullets = bullets.bullets;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load data. Please try again.';
          this.isLoading = false;
          console.error('Error loading data:', error);
        }
      });
  }

  loadExperiences(): void {
    this.experienceService.getExperiences({ includeBullets: true, orderBy: 'start_date', orderDirection: 'DESC' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.experiences = (response as any).experiences;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load experiences. Please try again.';
          console.error('Error loading experiences:', error);
        }
      });
  }

  showCreateForm(): void {
    this.showForm = true;
    this.experienceForm.reset();
    this.experienceForm.patchValue({ isCurrentlyWorkingHere: false });
  }

  hideForm(): void {
    this.showForm = false;
    this.experienceForm.reset();
  }

  onSubmit(): void {
    if (this.experienceForm.invalid) {
      this.experienceForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const formValue = this.experienceForm.value;
    const experienceData: CreateExperienceRequest = {
      company_name: formValue.company_name.trim(),
      job_title: formValue.job_title.trim(),
      start_date: formValue.start_date,
      end_date: formValue.isCurrentlyWorkingHere ? null : formValue.end_date,
      isCurrentlyWorkingHere: formValue.isCurrentlyWorkingHere
    };

    // Validate dates
    const dateError = this.experienceService.validateExperienceDates(
      experienceData.start_date,
      experienceData.end_date || null,
      experienceData.isCurrentlyWorkingHere
    );

    if (dateError) {
      this.errorMessage = dateError;
      this.isSubmitting = false;
      return;
    }

    this.experienceService.createExperience(experienceData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newExperience) => {
          // Add the new experience to the list with empty bullets array
          const experienceWithBullets: ExperienceWithBullets = {
            ...newExperience,
            bullets: []
          };
          this.experiences.unshift(experienceWithBullets);
          this.hideForm();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to create experience. Please try again.';
          this.isSubmitting = false;
          console.error('Error creating experience:', error);
        }
      });
  }

  startEdit(experience: Experience): void {
    this.editingExperience = experience;
    this.editForm.patchValue({
      company_name: experience.company_name,
      job_title: experience.job_title,
      start_date: experience.start_date,
      end_date: experience.end_date || '',
      isCurrentlyWorkingHere: experience.isCurrentlyWorkingHere
    });
  }

  cancelEdit(): void {
    this.editingExperience = null;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingExperience) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formValue = this.editForm.value;
    const experienceData: UpdateExperienceRequest = {
      company_name: formValue.company_name.trim(),
      job_title: formValue.job_title.trim(),
      start_date: formValue.start_date,
      end_date: formValue.isCurrentlyWorkingHere ? null : formValue.end_date,
      isCurrentlyWorkingHere: formValue.isCurrentlyWorkingHere
    };

    // Validate dates
    const dateError = this.experienceService.validateExperienceDates(
      experienceData.start_date,
      experienceData.end_date || null,
      experienceData.isCurrentlyWorkingHere
    );

    if (dateError) {
      this.errorMessage = dateError;
      return;
    }

    this.experienceService.updateExperience(this.editingExperience.id, experienceData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedExperience) => {
          const index = this.experiences.findIndex(exp => exp.id === updatedExperience.id);
          if (index !== -1) {
            // Preserve the bullets array when updating
            this.experiences[index] = {
              ...updatedExperience,
              bullets: this.experiences[index].bullets
            };
          }
          this.cancelEdit();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to update experience. Please try again.';
          console.error('Error updating experience:', error);
        }
      });
  }

  deleteExperience(experience: Experience): void {
    if (!confirm(`Are you sure you want to delete the experience at ${experience.company_name}? This will also remove all associated bullet points.`)) {
      return;
    }

    this.experienceService.deleteExperience(experience.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.experiences = this.experiences.filter(exp => exp.id !== experience.id);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to delete experience. Please try again.';
          console.error('Error deleting experience:', error);
        }
      });
  }

  // Bullet association methods
  toggleBulletSelector(experienceId: number): void {
    this.showBulletSelector[experienceId] = !this.showBulletSelector[experienceId];
  }

  getUnassociatedBullets(experienceId: number): Bullet[] {
    const experience = this.experiences.find(exp => exp.id === experienceId);
    if (!experience) return [];

    const associatedBulletIds = experience.bullets.map(bullet => bullet.id);
    return this.availableBullets.filter(bullet => !associatedBulletIds.includes(bullet.id));
  }

  addBulletToExperience(experienceId: number, bulletId: number): void {
    this.bulletAssociationLoading[experienceId] = true;

    this.experienceService.addBulletToExperience(experienceId, bulletId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Find the bullet and add it to the experience
          const bullet = this.availableBullets.find(b => b.id === bulletId);
          const experienceIndex = this.experiences.findIndex(exp => exp.id === experienceId);

          if (bullet && experienceIndex !== -1) {
            this.experiences[experienceIndex].bullets.push(bullet);
          }

          this.bulletAssociationLoading[experienceId] = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to add bullet to experience.';
          this.bulletAssociationLoading[experienceId] = false;
          console.error('Error adding bullet to experience:', error);
        }
      });
  }

  removeBulletFromExperience(experienceId: number, bulletId: number): void {
    this.bulletAssociationLoading[experienceId] = true;

    this.experienceService.removeBulletFromExperience(experienceId, bulletId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Remove the bullet from the experience
          const experienceIndex = this.experiences.findIndex(exp => exp.id === experienceId);
          if (experienceIndex !== -1) {
            this.experiences[experienceIndex].bullets =
              this.experiences[experienceIndex].bullets.filter(bullet => bullet.id !== bulletId);
          }

          this.bulletAssociationLoading[experienceId] = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to remove bullet from experience.';
          this.bulletAssociationLoading[experienceId] = false;
          console.error('Error removing bullet from experience:', error);
        }
      });
  }

  // Utility methods
  formatDateRange(experience: Experience): string {
    return this.experienceService.formatDateRange(experience.start_date, experience.end_date);
  }

  calculateDuration(experience: Experience): string {
    return this.experienceService.calculateDuration(experience.start_date, experience.end_date);
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
    }
    return '';
  }

  trackByExperienceId(_: number, experience: ExperienceWithBullets): number {
    return experience.id;
  }

  trackByBulletId(_: number, bullet: Bullet): number {
    return bullet.id;
  }

  // Additional utility methods for enhanced UX
  getTotalBullets(): number {
    return this.experiences.reduce((total, exp) => total + exp.bullets.length, 0);
  }

  getExperienceStats(): { total: number; current: number; past: number } {
    const total = this.experiences.length;
    const current = this.experiences.filter(exp => exp.isCurrentlyWorkingHere).length;
    const past = total - current;
    return { total, current, past };
  }

  clearAllErrors(): void {
    this.errorMessage = '';
  }

  refreshData(): void {
    this.clearAllErrors();
    this.loadData();
  }

  // Keyboard shortcuts for better accessibility
  onKeyDown(event: KeyboardEvent, action: string, data?: any): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      switch (action) {
        case 'add':
          this.showCreateForm();
          break;
        case 'edit':
          this.startEdit(data);
          break;
        case 'delete':
          this.deleteExperience(data);
          break;
        case 'toggleBullets':
          this.toggleBulletSelector(data);
          break;
      }
    }
  }

  // Date validation helper
  isStartDateValid(startDate: string): boolean {
    if (!startDate) return false;
    const start = new Date(startDate);
    const today = new Date();
    return start <= today;
  }

  isEndDateValid(startDate: string, endDate: string, isCurrently: boolean): boolean {
    if (isCurrently) return true;
    if (!endDate || !startDate) return false;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    return end > start && end <= today;
  }

  // Bulk operations for future enhancement
  deleteMultipleExperiences(experienceIds: number[]): void {
    // This could be implemented for bulk operations
    console.log('Bulk delete not implemented yet', experienceIds);
  }

  exportExperiences(): void {
    // This could export experiences as JSON/CSV for backup
    const dataStr = JSON.stringify(this.experiences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `experiences_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Sort experiences by different criteria
  sortExperiences(criteria: 'date' | 'company' | 'duration'): void {
    switch (criteria) {
      case 'date':
        this.experiences.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        break;
      case 'company':
        this.experiences.sort((a, b) => a.company_name.localeCompare(b.company_name));
        break;
      case 'duration':
        this.experiences.sort((a, b) => {
          const durationA = this.calculateDurationInDays(a);
          const durationB = this.calculateDurationInDays(b);
          return durationB - durationA;
        });
        break;
    }
  }

  private calculateDurationInDays(experience: Experience): number {
    const start = new Date(experience.start_date);
    const end = experience.end_date ? new Date(experience.end_date) : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Search functionality
  searchExperiences(searchTerm: string): ExperienceWithBullets[] {
    if (!searchTerm.trim()) return this.experiences;

    const term = searchTerm.toLowerCase().trim();
    return this.experiences.filter(exp =>
      exp.company_name.toLowerCase().includes(term) ||
      exp.job_title.toLowerCase().includes(term) ||
      exp.bullets.some(bullet => bullet.text.toLowerCase().includes(term))
    );
  }
}