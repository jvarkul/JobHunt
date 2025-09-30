-- Experience table initialization
-- This table stores work experience information for users

CREATE TABLE experience (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    isCurrentlyWorkingHere BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_experience_user_id
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    -- Check constraint to ensure logical date ordering
    CONSTRAINT chk_experience_dates
        CHECK (start_date <= end_date OR end_date IS NULL),

    -- Check constraint for current position logic
    CONSTRAINT chk_current_position
        CHECK (
            (isCurrentlyWorkingHere = TRUE AND end_date IS NULL) OR
            (isCurrentlyWorkingHere = FALSE AND end_date IS NOT NULL)
        )
);

-- Create indexes for better performance
CREATE INDEX idx_experience_user_id ON experience(user_id);
CREATE INDEX idx_experience_start_date ON experience(start_date);
CREATE INDEX idx_experience_company ON experience(company_name);

-- Add trigger to automatically update updated_at timestamp
CREATE TRIGGER update_experience_updated_at
    BEFORE UPDATE ON experience
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();