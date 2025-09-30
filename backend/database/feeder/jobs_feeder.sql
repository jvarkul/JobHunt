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
        company_name,
        description,
        application_link
    FROM (
        VALUES
            -- Software Engineering Roles
            ('TechCorp', 'Senior Full Stack Engineer - Build scalable web applications using React, Node.js, and PostgreSQL. 5+ years experience required.', 'https://techcorp.careers/senior-fullstack-eng'),
            ('StartupXYZ', 'Frontend Developer - Create beautiful, responsive UIs with modern frameworks. Remote position available.', 'https://startupxyz.com/careers/frontend-dev'),
            ('CloudSolutions', 'Backend Engineer - Design and maintain RESTful APIs serving millions of users. Python/Go experience preferred.', 'https://cloudsolutions.io/jobs/backend-engineer'),
            ('DataCorp', 'DevOps Engineer - Manage AWS infrastructure, CI/CD pipelines, and containerized applications.', 'https://datacorp.com/careers/devops'),
            ('AppStudio', 'Mobile Developer - Build cross-platform mobile apps using React Native. Published apps portfolio required.', 'https://appstudio.careers/mobile-dev'),

            -- Data & Analytics Roles
            ('AI Innovations', 'Data Scientist - Develop machine learning models for predictive analytics. PhD preferred.', 'https://aiinnovations.com/jobs/data-scientist'),
            ('BigData Inc', 'Data Engineer - Build data pipelines and warehouses. Spark and Kafka experience required.', 'https://bigdatainc.io/careers/data-engineer'),
            ('FinTech Solutions', 'Business Intelligence Analyst - Create dashboards and reports for executive team.', 'https://fintechsolutions.com/careers/bi-analyst'),

            -- Specialized Roles
            ('CyberSafe', 'Security Engineer - Implement security best practices and conduct vulnerability assessments.', 'https://cybersafe.io/jobs/security-engineer'),
            ('DeepTech', 'Machine Learning Engineer - Build and deploy ML models at scale. TensorFlow/PyTorch required.', 'https://deeptech.ai/careers/ml-engineer'),
            ('Enterprise Systems', 'Solutions Architect - Design cloud-native architectures for Fortune 500 clients.', 'https://enterprisesystems.com/jobs/solutions-architect'),
            ('TestFirst', 'QA Automation Engineer - Develop automated test suites and maintain CI/CD quality gates.', 'https://testfirst.io/careers/qa-automation'),

            -- Additional Opportunities
            ('ScaleUp', 'Site Reliability Engineer - Ensure 99.99% uptime for high-traffic applications. On-call rotation.', 'https://scaleup.com/jobs/sre'),
            ('CryptoStartup', 'Blockchain Developer - Build smart contracts and decentralized applications. Solidity required.', 'https://cryptostartup.io/careers/blockchain-dev'),
            ('GameStudio', 'Game Developer - Create immersive gaming experiences using Unity/Unreal Engine.', 'https://gamestudio.careers/game-dev'),
            ('Infrastructure Co', 'Systems Engineer - Manage Linux servers and network infrastructure. 24/7 support.', 'https://infrastructureco.com/jobs/systems-eng'),

            -- Entry Level Opportunities
            ('WebAgency', 'Junior Software Developer - Learn modern web development in a supportive team environment.', 'https://webagency.io/careers/junior-dev'),
            ('Marketing Tech', 'Associate Data Analyst - Analyze campaign performance and customer behavior data.', 'https://marketingtech.com/jobs/associate-analyst'),
            ('SaaS Company', 'Technical Support Engineer - Help customers troubleshoot issues and onboard successfully.', 'https://saascompany.io/careers/tech-support'),
            ('BigTech', 'Software Engineering Intern - Summer internship program for CS students. Housing provided.', 'https://bigtech.com/internships/swe')
    ) AS jobs(company_name, description, application_link)
    CROSS JOIN user_ids
)
INSERT INTO jobs (user_id, company_name, description, application_link)
SELECT
    user_id,
    company_name,
    description,
    application_link
FROM sample_jobs
ORDER BY RANDOM()
LIMIT 40;

-- Add some jobs without application links (direct applications or referrals)
WITH user_ids AS (
    SELECT id FROM users LIMIT 6
)
INSERT INTO jobs (user_id, company_name, description, application_link)
SELECT
    id,
    company_name,
    description,
    NULL
FROM user_ids, (VALUES
    ('Local Startup', 'Software Engineer - Referred by colleague, no public posting. Working on innovative solutions.'),
    ('Freelance Client', 'Frontend Developer - 3 month contract engagement, direct client contact.'),
    ('Tech Consulting Group', 'Full-time Engineer - Recruiter outreach, NDA signed. Enterprise projects.'),
    ('Stealth Startup', 'Senior Developer - Equity heavy compensation package. Early stage opportunity.'),
    ('Remote Tech Co', 'Engineering Position - Networking connection, informal application process.')
) AS jobs(company_name, description)
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
