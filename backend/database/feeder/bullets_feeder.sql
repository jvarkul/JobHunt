-- Bullets table sample data
-- Insert test bullets for development and testing
-- Note: This script dynamically finds user IDs to avoid foreign key constraint issues

-- First, let's verify we have users to work with
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;

    IF user_count = 0 THEN
        RAISE EXCEPTION 'No users found in database. Please run users_feeder.sql first.';
    END IF;

    RAISE NOTICE 'Found % users in database. Proceeding with bullets insertion.', user_count;
END $$;

-- Create a temporary table to map user emails to IDs for easier reference
CREATE TEMP TABLE user_mapping AS
SELECT
    id,
    email,
    ROW_NUMBER() OVER (ORDER BY id) as user_number
FROM users
ORDER BY id
LIMIT 5;

-- Insert bullets using dynamic user IDs based on email addresses
-- User 1 (john.doe@email.com or first user)
INSERT INTO bullets (user_id, text)
SELECT id, bullet_text FROM user_mapping, (VALUES
    ('Led cross-functional team of 8 developers to deliver major product feature ahead of schedule'),
    ('Increased system performance by 40% through database optimization and caching strategies'),
    ('Mentored 3 junior developers and conducted code reviews to maintain high code quality standards')
) AS bullets(bullet_text)
WHERE user_number = 1;

-- User 2 (jane.smith@email.com or second user)
INSERT INTO bullets (user_id, text)
SELECT id, bullet_text FROM user_mapping, (VALUES
    ('Designed and implemented RESTful APIs serving 100K+ daily active users'),
    ('Reduced deployment time by 75% by implementing CI/CD pipeline with automated testing'),
    ('Collaborated with product managers to define technical requirements and project timelines')
) AS bullets(bullet_text)
WHERE user_number = 2;

-- User 3 (mike.johnson@email.com or third user)
INSERT INTO bullets (user_id, text)
SELECT id, bullet_text FROM user_mapping, (VALUES
    ('Built responsive web applications using React, TypeScript, and modern CSS frameworks'),
    ('Integrated third-party payment systems and authentication services'),
    ('Implemented comprehensive unit and integration testing achieving 95% code coverage')
) AS bullets(bullet_text)
WHERE user_number = 3;

-- User 4 (sarah.wilson@email.com or fourth user)
INSERT INTO bullets (user_id, text)
SELECT id, bullet_text FROM user_mapping, (VALUES
    ('Managed cloud infrastructure on AWS serving millions of requests per month'),
    ('Automated deployment processes using Docker and Kubernetes orchestration'),
    ('Implemented monitoring and alerting systems reducing incident response time by 60%')
) AS bullets(bullet_text)
WHERE user_number = 4;

-- User 5 (david.brown@email.com or fifth user)
INSERT INTO bullets (user_id, text)
SELECT id, bullet_text FROM user_mapping, (VALUES
    ('Developed machine learning models for predictive analytics and data insights'),
    ('Created data pipelines processing terabytes of data daily'),
    ('Presented technical findings to stakeholders and executive leadership team')
) AS bullets(bullet_text)
WHERE user_number = 5;

-- Additional bullets that could be reused across different resumes/experiences
-- Distribute these across all available users
INSERT INTO bullets (user_id, text)
SELECT id, bullet_text FROM user_mapping, (VALUES
    ('Participated in agile development process with daily standups and sprint planning'),
    ('Maintained detailed technical documentation and architectural decision records'),
    ('Contributed to open source projects and participated in developer community events'),
    ('Implemented security best practices and conducted vulnerability assessments'),
    ('Optimized application performance through profiling and load testing')
) AS bullets(bullet_text)
WHERE user_number <= 5;

-- Show summary of what was inserted
DO $$
DECLARE
    bullet_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bullet_count FROM bullets;
    SELECT COUNT(DISTINCT user_id) INTO user_count FROM bullets;

    RAISE NOTICE 'Successfully inserted bullets. Total bullets: %, Users with bullets: %', bullet_count, user_count;
END $$;