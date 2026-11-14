/** Updated from the supplied resume; earlier research retained from the prior resume. */
export const experience = [
  {
    company: 'Capital One',
    logo: 'capital-one.jpg',
    role: 'Software Engineering Intern',
    period: 'June – August 2026',
    location: 'Plano, TX',
    highlights: [
      'Engineered a Python/Flask network-automation platform on ECS Fargate to schedule Ansible playbooks across 3,400+ devices at 50+ sites, spanning 90+ hardware models and seven vendors. Deployed to two AWS regions with CDK, SQS and DynamoDB.',
      'Built a distributed scheduler using DynamoDB conditional writes to prevent duplicate runs across workers in both regions, with runtime versioning for 127 playbooks served from Artifactory.',
      'Led the multi-region production launch with KMS encryption, DynamoDB global tables, cross-region replication and least-privilege IAM. Hardened endpoints against SSRF, path traversal and log injection.',
      'Added CloudWatch logging with per-run correlation IDs, an immutable audit trail, point-in-time recovery and an SQS dead-letter queue; contributed to a suite of more than 280 tests.',
    ],
  },
  {
    company: 'HackUTD · ACM',
    logo: 'hackutd.png',
    role: 'President',
    period: 'January 2024 – present',
    location: 'Richardson, TX',
    highlights: [
      'Led a 45-member team organizing HackUTD, the largest 24-hour collegiate hackathon in North America, with 1,200+ participants, 15+ sponsors and more than $50,000 in prizes.',
      'Directed engineering for Jury, an open-source judging platform adopted by more than four hackathons nationwide, and HARP, a hackathon operations platform.',
      'Competed in more than 12 hackathons, with wins at HackTX, PennApps, TAMUhack, HackSMU, HackUTA, HackFin and HackUPC.',
    ],
  },
  {
    company: 'Fidelity Investments',
    logo: 'fidelity.jpg',
    role: 'Full Stack Software Engineering Intern',
    period: 'June – December 2025',
    location: 'Westlake, TX',
    highlights: [
      'Built hybrid semantic and lexical search with OpenSearch Serverless, GPT-4o, FAISS, HNSW and a Hugging Face reranker, improving design speed for more than 500 internal developers by 60%.',
      'Developed three Python Lambda functions for RDS-to-S3 ETL, PostgreSQL queries, OpenAI embeddings and hybrid search scoring, reducing manual search time by 80%.',
      'Created a React frontend on S3 and API Gateway for more than 1,000 architects to test searches, with response and feedback logging.',
      'Automated IAM, Lambda, S3, OpenSearch and EventBridge infrastructure with CloudFormation and Jenkins, cutting deployment time from days to under an hour.',
    ],
  },
  {
    company: 'University of Texas at Dallas',
    logo: 'ut-dallas.jpg',
    role: 'Undergraduate Research Intern',
    period: 'June 2023 – January 2024',
    location: 'Richardson, TX',
    highlights: ['Wrote scripts to set up and run ROS2 simulations for anomaly detection in autonomous vehicles, and tested autonomous drones with high-frequency noise on Linux systems.'],
  },
];
