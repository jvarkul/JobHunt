import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, map } from 'rxjs';
import { Bullet, CreateBulletRequest, UpdateBulletRequest, BulletsResponse } from '../models/bullet.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BulletsService {
  private readonly API_BASE = `${environment.apiUrl}/bullets`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Get all bullets for the current user, sorted by updated_at DESC
   */
  getBullets(): Observable<BulletsResponse> {
    return this.http.get<any>(`${this.API_BASE}`).pipe(
      map(response => ({
        bullets: response.bullets,
        total: response.total
      } as BulletsResponse))
    );
  }

  /**
   * Create a new bullet
   */
  createBullet(bulletData: CreateBulletRequest): Observable<Bullet> {
    return this.http.post<any>(`${this.API_BASE}`, bulletData).pipe(
      map(response => response.bullet as Bullet)
    );
  }

  /**
   * Update an existing bullet
   */
  updateBullet(id: number, bulletData: UpdateBulletRequest): Observable<Bullet> {
    return this.http.put<any>(`${this.API_BASE}/${id}`, bulletData).pipe(
      map(response => response.bullet as Bullet)
    );
  }

  /**
   * Delete a bullet
   */
  deleteBullet(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE}/${id}`);
  }

}