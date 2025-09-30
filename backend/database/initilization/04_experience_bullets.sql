-- Experience-Bullets junction table initialization
-- This table creates many-to-many relationship between experience and bullets

CREATE TABLE experience_bullets (
    id BIGSERIAL PRIMARY KEY,
    experience_id BIGINT NOT NULL,
    bullet_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints with cascade delete
    CONSTRAINT fk_experience_bullets_experience_id
        FOREIGN KEY (experience_id)
        REFERENCES experience(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_experience_bullets_bullet_id
        FOREIGN KEY (bullet_id)
        REFERENCES bullets(id)
        ON DELETE CASCADE,

    -- Unique constraint to prevent duplicate associations
    CONSTRAINT uk_experience_bullets_pair
        UNIQUE (experience_id, bullet_id)
);

-- Create indexes for better performance
CREATE INDEX idx_experience_bullets_experience_id ON experience_bullets(experience_id);
CREATE INDEX idx_experience_bullets_bullet_id ON experience_bullets(bullet_id);

-- Optional: Create composite index for faster lookups
CREATE INDEX idx_experience_bullets_composite ON experience_bullets(experience_id, bullet_id);