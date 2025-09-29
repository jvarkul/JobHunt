import { Routes } from '@angular/router';
import { HomepageComponent } from './components/homepage/homepage.component';
import { ExperienceComponent } from './components/experience/experience.component';
import { BulletsComponent } from './components/bullets/bullets.component';
import { JobsComponent } from './components/jobs/jobs.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard, loginGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard]
  },

  // Protected dashboard routes
  {
    path: 'dashboard',
    component: HomepageComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/dashboard/experience', pathMatch: 'full' },
      { path: 'experience', component: ExperienceComponent },
      { path: 'bullets', component: BulletsComponent },
      { path: 'jobs', component: JobsComponent }
    ]
  },

  // Default redirects
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },

  // Catch-all route - redirect to login if not authenticated
  {
    path: '**',
    redirectTo: '/login'
  }
];
