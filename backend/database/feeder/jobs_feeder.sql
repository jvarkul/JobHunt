-- Jobs table sample data
-- Insert test job applications for development and testing
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

    RAISE NOTICE 'Found % users in database. Creating sample job applications...', user_count;
END $$;

-- Create sample job applications for existing users
WITH user_ids AS (
    SELECT id FROM users LIMIT 6
),
sample_jobs AS (
    SELECT
        user_ids.id as user_id,
        description,
        application_link
    FROM (
        VALUES
            -- Software Engineering Roles
            ('Senior Full Stack Engineer at TechCorp - Build scalable web applications using React, Node.js, and PostgreSQL. 5+ years experience required.', 'https://techcorp.careers/senior-fullstack-eng'),
            ('Frontend Developer at StartupXYZ - Create beautiful, responsive UIs with modern frameworks. Remote position available.', 'https://startupxyz.com/careers/frontend-dev'),
            ('Backend Engineer at CloudSolutions - Design and maintain RESTful APIs serving millions of users. Python/Go experience preferred.', 'https://cloudsolutions.io/jobs/backend-engineer'),
            ('DevOps Engineer at DataCorp - Manage AWS infrastructure, CI/CD pipelines, and containerized applications.', 'https://datacorp.com/careers/devops'),
            ('Mobile Developer at AppStudio - Build cross-platform mobile apps using React Native. Published apps portfolio required.', 'https://appstudio.careers/mobile-dev'),

            -- Data & Analytics Roles
            ('Data Scientist at AI Innovations - Develop machine learning models for predictive analytics. PhD preferred.', 'https://aiinnovations.com/jobs/data-scientist'),
            ('Data Engineer at BigData Inc - Build data pipelines and warehouses. Spark and Kafka experience required.', 'https://bigdatainc.io/careers/data-engineer'),
            ('Business Intelligence Analyst at FinTech Solutions - Create dashboards and reports for executive team.', 'https://fintechsolutions.com/careers/bi-analyst'),

            -- Specialized Roles
            ('Security Engineer at CyberSafe - Implement security best practices and conduct vulnerability assessments.', 'https://cybersafe.io/jobs/security-engineer'),
            ('Machine Learning Engineer at DeepTech - Build and deploy ML models at scale. TensorFlow/PyTorch required.', 'https://deeptech.ai/careers/ml-engineer'),
            ('Solutions Architect at Enterprise Systems - Design cloud-native architectures for Fortune 500 clients.', 'https://enterprisesystems.com/jobs/solutions-architect'),
            ('QA Automation Engineer at TestFirst - Develop automated test suites and maintain CI/CD quality gates.', 'https://testfirst.io/careers/qa-automation'),

            -- Additional Opportunities
            ('Site Reliability Engineer at ScaleUp - Ensure 99.99% uptime for high-traffic applications. On-call rotation.', 'https://scaleup.com/jobs/sre'),
            ('Blockchain Developer at CryptoStartup - Build smart contracts and decentralized applications. Solidity required.', 'https://cryptostartup.io/careers/blockchain-dev'),
            ('Game Developer at GameStudio - Create immersive gaming experiences using Unity/Unreal Engine.', 'https://gamestudio.careers/game-dev'),
            ('Systems Engineer at Infrastructure Co - Manage Linux servers and network infrastructure. 24/7 support.', 'https://infrastructureco.com/jobs/systems-eng'),

            -- Entry Level Opportunities
            ('Junior Software Developer at WebAgency - Learn modern web development in a supportive team environment.', 'https://webagency.io/careers/junior-dev'),
            ('Associate Data Analyst at Marketing Tech - Analyze campaign performance and customer behavior data.', 'https://marketingtech.com/jobs/associate-analyst'),
            ('Technical Support Engineer at SaaS Company - Help customers troubleshoot issues and onboard successfully.', 'https://saascompany.io/careers/tech-support'),
            ('Intern - Software Engineering at BigTech - Summer internship program for CS students. Housing provided.', 'https://bigtech.com/internships/swe')
    ) AS jobs(description, application_link)
    CROSS JOIN user_ids
)
INSERT INTO jobs (user_id, description, application_link)
SELECT
    user_id,
    description,
    application_link
FROM sample_jobs
ORDER BY RANDOM()
LIMIT 40;

-- Add some jobs without application links (direct applications or referrals)
WITH user_ids AS (
    SELECT id FROM users LIMIT 6
)
INSERT INTO jobs (user_id, description, application_link)
SELECT
    id,
    description,
    NULL
FROM user_ids, (VALUES
    ('Software Engineer position at local startup - referred by colleague, no public posting'),
    ('Contract role for frontend development - 3 month engagement, direct client contact'),
    ('Full-time position at consulting firm - recruiter outreach, NDA signed'),
    ('Senior Developer role at stealth startup - equity heavy compensation package'),
    ('Remote engineering position - networking connection, informal application process')
) AS jobs(description)
ORDER BY RANDOM()
LIMIT 15;

-- Report on what was created
DO $$
DECLARE
    job_count INTEGER;
    user_count INTEGER;
    jobs_with_links INTEGER;
    jobs_without_links INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count FROM jobs;
    SELECT COUNT(DISTINCT user_id) INTO user_count FROM jobs;
    SELECT COUNT(*) INTO jobs_with_links FROM jobs WHERE application_link IS NOT NULL;
    SELECT COUNT(*) INTO jobs_without_links FROM jobs WHERE application_link IS NULL;

    RAISE NOTICE 'Job applications data insertion completed!';
    RAISE NOTICE 'Total jobs created: %', job_count;
    RAISE NOTICE 'Users with jobs: %', user_count;
    RAISE NOTICE 'Jobs with application links: %', jobs_with_links;
    RAISE NOTICE 'Jobs without links (referrals/direct): %', jobs_without_links;
END $$;
