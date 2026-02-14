# CareCommand

Production-grade, HIPAA-ready multi-tenant SaaS for home care agencies to manage caregiver recruitment, onboarding, compliance, and AxisCare sync.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, React Router, TanStack Query, Tailwind, Radix UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: S3-compatible (MinIO for local)
- **Queue**: BullMQ + Redis

## Local Development

### 1. Start infrastructure

```bash
docker compose up -d
```

This starts Postgres (5432), Redis (6379), and MinIO (9000, 9001). Ensure Docker is running before this step.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if needed
```

### 4. Database setup

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Run the app

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

### Demo credentials

- Email: `admin@demo.carecommand.com`
- Password: `demo1234`

## Deployment

See [HIPAA_READINESS_CHECKLIST.md](./HIPAA_READINESS_CHECKLIST.md) for production considerations.

### AWS (ECS/Fargate)

- Use RDS for Postgres, ElastiCache for Redis, S3 for storage
- Store secrets in Secrets Manager
- Run migrations before deploying: `prisma migrate deploy`

### Render / Fly

- Add Postgres and Redis add-ons
- Set environment variables from dashboard
- Build: `npm run build`

## Project Structure

```
carecommand/
├── apps/
│   ├── web/        # React frontend
│   ├── api/        # Express backend
│   └── worker/     # BullMQ background jobs
├── packages/shared/ # Shared types and Zod schemas
├── docker-compose.yml
└── .env.example
```

## Documentation

- [HIPAA Readiness Checklist](./HIPAA_READINESS_CHECKLIST.md)
- [AxisCare Setup](./AXISCARE_SETUP.md)
