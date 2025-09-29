import { Routes } from '@angular/router';
import { HomepageComponent } from './components/homepage/homepage.component';
import { ExperienceComponent } from './components/experience/experience.component';
import { BulletsComponent } from './components/bullets/bullets.component';
import { JobsComponent } from './components/jobs/jobs.component';

export const routes: Routes = [
  {
    path: '',
    component: HomepageComponent,
    children: [
      { path: '', redirectTo: '/experience', pathMatch: 'full' },
      { path: 'experience', component: ExperienceComponent },
      { path: 'bullets', component: BulletsComponent },
      { path: 'jobs', component: JobsComponent }
    ]
  }
];
