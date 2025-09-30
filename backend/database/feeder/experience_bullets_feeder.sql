-- Experience-Bullets junction table sample data
-- Insert test associations between experiences and bullets
-- Note: This script dynamically finds existing experience and bullet IDs

-- First, verify we have both experiences and bullets to work with
DO $$
DECLARE
    experience_count INTEGER;
    bullet_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO experience_count FROM experience;
    SELECT COUNT(*) INTO bullet_count FROM bullets;

    IF experience_count = 0 THEN
        RAISE EXCEPTION 'No experiences found in database. Please run experience_feeder.sql first.';
    END IF;

    IF bullet_count = 0 THEN
        RAISE EXCEPTION 'No bullets found in database. Please run bullets_feeder.sql first.';
    END IF;

    RAISE NOTICE 'Found % experiences and % bullets in database. Creating associations...', experience_count, bullet_count;
END $$;

-- Create realistic associations between experiences and bullets
-- Each experience will get 2-5 bullet associations
WITH user_data AS (
    -- Get users with both experiences and bullets
    SELECT DISTINCT u.id as user_id
    FROM users u
    WHERE EXISTS (SELECT 1 FROM experience e WHERE e.user_id = u.id)
      AND EXISTS (SELECT 1 FROM bullets b WHERE b.user_id = u.id)
),
experience_bullet_pairs AS (
    -- For each user, associate their experiences with their bullets
    SELECT
        e.id as experience_id,
        b.id as bullet_id,
        ROW_NUMBER() OVER (PARTITION BY e.id ORDER BY RANDOM()) as rn
    FROM experience e
    JOIN user_data ud ON e.user_id = ud.user_id
    JOIN bullets b ON b.user_id = ud.user_id
),
limited_associations AS (
    -- Limit to 2-5 bullets per experience
    SELECT
        experience_id,
        bullet_id
    FROM experience_bullet_pairs
    WHERE rn <= (2 + FLOOR(RANDOM() * 4)) -- Random number between 2 and 5
)
INSERT INTO experience_bullets (experience_id, bullet_id)
SELECT DISTINCT experience_id, bullet_id
FROM limited_associations
ON CONFLICT (experience_id, bullet_id) DO NOTHING;

-- Create some additional random associations to ensure good coverage
WITH random_associations AS (
    SELECT
        e.id as experience_id,
        b.id as bullet_id
    FROM experience e
    JOIN bullets b ON e.user_id = b.user_id
    ORDER BY RANDOM()
    LIMIT 100
)
INSERT INTO experience_bullets (experience_id, bullet_id)
SELECT experience_id, bullet_id
FROM random_associations
ON CONFLICT (experience_id, bullet_id) DO NOTHING;

-- Report on what was created
DO $$
DECLARE
    association_count INTEGER;
    experiences_with_bullets INTEGER;
    bullets_used INTEGER;
    avg_bullets_per_experience NUMERIC;
    max_bullets_per_experience INTEGER;
    min_bullets_per_experience INTEGER;
BEGIN
    SELECT COUNT(*) INTO association_count FROM experience_bullets;

    SELECT COUNT(DISTINCT experience_id) INTO experiences_with_bullets FROM experience_bullets;

    SELECT COUNT(DISTINCT bullet_id) INTO bullets_used FROM experience_bullets;

    SELECT
        AVG(bullet_count)::NUMERIC(5,2),
        MAX(bullet_count),
        MIN(bullet_count)
    INTO avg_bullets_per_experience, max_bullets_per_experience, min_bullets_per_experience
    FROM (
        SELECT experience_id, COUNT(*) as bullet_count
        FROM experience_bullets
        GROUP BY experience_id
    ) counts;

    RAISE NOTICE 'Experience-Bullets association data insertion completed!';
    RAISE NOTICE 'Total associations created: %', association_count;
    RAISE NOTICE 'Experiences with bullets: %', experiences_with_bullets;
    RAISE NOTICE 'Unique bullets used: %', bullets_used;
    RAISE NOTICE 'Average bullets per experience: %', COALESCE(avg_bullets_per_experience, 0);
    RAISE NOTICE 'Max bullets per experience: %', COALESCE(max_bullets_per_experience, 0);
    RAISE NOTICE 'Min bullets per experience: %', COALESCE(min_bullets_per_experience, 0);
END $$;

-- Display some sample associations for verification
DO $$
DECLARE
    sample_record RECORD;
BEGIN
    RAISE NOTICE '--- Sample Experience-Bullet Associations ---';

    FOR sample_record IN
        SELECT
            e.company_name,
            e.job_title,
            b.text,
            eb.created_at
        FROM experience_bullets eb
        JOIN experience e ON eb.experience_id = e.id
        JOIN bullets b ON eb.bullet_id = b.id
        ORDER BY eb.created_at DESC
        LIMIT 6
    LOOP
        RAISE NOTICE '% at %: "%"', sample_record.job_title, sample_record.company_name, LEFT(sample_record.text, 50) || CASE WHEN LENGTH(sample_record.text) > 50 THEN '...' ELSE '' END;
    END LOOP;
END $$;