-- Experience table sample data
-- Insert test experiences for development and testing
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

    RAISE NOTICE 'Found % users in database. Creating sample experiences...', user_count;
END $$;

-- Create sample experiences for existing users
WITH user_ids AS (
    SELECT id FROM users LIMIT 6
),
sample_experiences AS (
    SELECT
        user_ids.id as user_id,
        company_name,
        job_title,
        start_date,
        end_date,
        isCurrentlyWorkingHere
    FROM (
        VALUES
            -- Current positions (no end_date)
            ('TechCorp Inc.', 'Senior Software Developer', '2023-01-15', NULL, TRUE),
            ('StartupXYZ', 'Full Stack Engineer', '2022-06-01', NULL, TRUE),
            ('DataSolutions Ltd', 'Senior Data Analyst', '2023-03-01', NULL, TRUE),
            ('CloudTech Systems', 'DevOps Engineer', '2022-09-15', NULL, TRUE),
            ('AI Innovations', 'Machine Learning Engineer', '2023-02-01', NULL, TRUE),

            -- Previous positions (with end_date)
            ('WebDev Agency', 'Frontend Developer', '2021-03-01', '2022-12-31', FALSE),
            ('Mobile Apps Co', 'React Native Developer', '2020-08-15', '2022-05-30', FALSE),
            ('Enterprise Solutions', 'Junior Developer', '2019-06-01', '2021-02-28', FALSE),
            ('Consulting Group', 'Software Consultant', '2020-01-15', '2022-08-31', FALSE),
            ('FinTech Startup', 'Backend Developer', '2021-01-01', '2022-02-28', FALSE),

            -- More diverse experiences
            ('Global Tech Corp', 'Lead Developer', '2018-09-01', '2020-12-31', FALSE),
            ('Innovation Labs', 'Research Engineer', '2020-03-01', '2021-12-31', FALSE),
            ('Digital Marketing Inc', 'Technical Lead', '2019-01-15', '2020-02-29', FALSE),
            ('E-commerce Platform', 'Software Architect', '2017-05-01', '2019-08-31', FALSE),
            ('Gaming Studio', 'Game Developer', '2018-02-01', '2019-04-30', FALSE),

            -- Additional experiences for variety
            ('Healthcare Tech', 'Software Engineer', '2016-08-01', '2018-01-31', FALSE),
            ('Education Platform', 'Frontend Specialist', '2017-11-01', '2019-03-15', FALSE),
            ('Logistics Solutions', 'Systems Developer', '2019-04-01', '2020-07-31', FALSE),
            ('Social Media App', 'Mobile Developer', '2020-09-01', '2021-11-30', FALSE),
            ('Blockchain Startup', 'Smart Contract Developer', '2021-06-01', '2022-10-15', FALSE)
    ) AS experiences(company_name, job_title, start_date, end_date, isCurrentlyWorkingHere)
    CROSS JOIN user_ids
)
INSERT INTO experience (user_id, company_name, job_title, start_date, end_date, isCurrentlyWorkingHere)
SELECT
    user_id,
    company_name,
    job_title,
    start_date::DATE,
    end_date::DATE,
    isCurrentlyWorkingHere
FROM sample_experiences
ORDER BY RANDOM()
LIMIT 50;

-- Report on what was created
DO $$
DECLARE
    experience_count INTEGER;
    user_count INTEGER;
    current_positions INTEGER;
    past_positions INTEGER;
BEGIN
    SELECT COUNT(*) INTO experience_count FROM experience;
    SELECT COUNT(DISTINCT user_id) INTO user_count FROM experience;
    SELECT COUNT(*) INTO current_positions FROM experience WHERE isCurrentlyWorkingHere = TRUE;
    SELECT COUNT(*) INTO past_positions FROM experience WHERE isCurrentlyWorkingHere = FALSE;

    RAISE NOTICE 'Experience data insertion completed!';
    RAISE NOTICE 'Total experiences created: %', experience_count;
    RAISE NOTICE 'Users with experiences: %', user_count;
    RAISE NOTICE 'Current positions: %', current_positions;
    RAISE NOTICE 'Past positions: %', past_positions;
END $$;