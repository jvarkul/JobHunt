export interface Bullet {
  id: number;
  user_id: number;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBulletRequest {
  text: string;
}

export interface UpdateBulletRequest {
  text: string;
}

export interface BulletsResponse {
  bullets: Bullet[];
  total: number;
}