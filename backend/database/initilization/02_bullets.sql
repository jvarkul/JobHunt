-- Bullets table initialization
-- This table stores bullet points that can be associated with users

CREATE TABLE bullets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_bullets_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_bullets_user_id ON bullets(user_id);

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_bullets_updated_at
    BEFORE UPDATE ON bullets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();