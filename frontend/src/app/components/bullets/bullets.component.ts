import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { BulletsService } from '../../services/bullets.service';
import { AuthService } from '../../services/auth.service';
import { Bullet } from '../../models/bullet.model';

@Component({
  selector: 'app-bullets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bullets.component.html',
  styleUrl: './bullets.component.css'
})
export class BulletsComponent implements OnInit, OnDestroy {
  bullets: Bullet[] = [];
  bulletForm!: FormGroup;
  editingBullet: Bullet | null = null;
  editForm!: FormGroup;

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private bulletsService: BulletsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadBullets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.bulletForm = this.formBuilder.group({
      text: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]]
    });

    this.editForm = this.formBuilder.group({
      text: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]]
    });
  }

  loadBullets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.bulletsService.getBullets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.bullets = response.bullets;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load bullets. Please try again.';
          this.isLoading = false;
          console.error('Error loading bullets:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.bulletForm.invalid) {
      this.bulletForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const bulletData = {
      text: this.bulletForm.value.text.trim()
    };

    this.bulletsService.createBullet(bulletData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newBullet) => {
          this.bullets.unshift(newBullet); // Add to beginning since it's the newest
          this.bulletForm.reset();
          this.isSubmitting = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to create bullet. Please try again.';
          this.isSubmitting = false;
          console.error('Error creating bullet:', error);
        }
      });
  }

  startEdit(bullet: Bullet): void {
    this.editingBullet = bullet;
    this.editForm.patchValue({ text: bullet.text });
  }

  cancelEdit(): void {
    this.editingBullet = null;
    this.editForm.reset();
  }

  saveEdit(): void {
    if (this.editForm.invalid || !this.editingBullet) {
      this.editForm.markAllAsTouched();
      return;
    }

    const bulletData = {
      text: this.editForm.value.text.trim()
    };

    this.bulletsService.updateBullet(this.editingBullet.id, bulletData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedBullet) => {
          const index = this.bullets.findIndex(b => b.id === updatedBullet.id);
          if (index !== -1) {
            this.bullets[index] = updatedBullet;
            // Re-sort by updated_at since this bullet was just updated
            this.bullets.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          }
          this.cancelEdit();
        },
        error: (error) => {
          this.errorMessage = 'Failed to update bullet. Please try again.';
          console.error('Error updating bullet:', error);
        }
      });
  }

  deleteBullet(bullet: Bullet): void {
    if (!confirm('Are you sure you want to delete this bullet?')) {
      return;
    }

    this.bulletsService.deleteBullet(bullet.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.bullets = this.bullets.filter(b => b.id !== bullet.id);
        },
        error: (error) => {
          this.errorMessage = 'Failed to delete bullet. Please try again.';
          console.error('Error deleting bullet:', error);
        }
      });
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

  trackByBulletId(index: number, bullet: Bullet): number {
    return bullet.id;
  }
}