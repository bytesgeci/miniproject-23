## Course and Event Management System

Full-stack project for course/event management, user onboarding, file handling, and admin workflows.

## Tech Stack

- Frontend: Next.js 16, React, TypeScript, Tailwind CSS
- Backend API: Express.js, Mongoose
- Databases/Services: MongoDB, Firebase (Auth/Storage), Prisma (available in root)

## Project Structure

- `src/` - Next.js frontend application code
- `backend/` - Express backend API
- `scripts/` - migration and maintenance scripts
- `prisma/` - Prisma schema and migrations
- `public/uploads/` - uploaded files storage

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- Firebase project/service credentials

## Quick Start

### 1. Install dependencies

```bash
npm install
cd backend && npm install
```

### 2. Configure environment variables

Use a single root env file for local development:

- Copy `.env.local.example` to `.env.local`
- Set local backend URL in `.env.local`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:5010
BACKEND_URL=http://localhost:5010
```

For Vercel deployment, configure these in Vercel Project Settings -> Environment Variables:

- `NEXT_PUBLIC_BACKEND_URL=https://<your-backend-domain>`
- `BACKEND_URL=https://<your-backend-domain>`
- Other required Firebase/MongoDB secrets from `.env.local.example`

### 3. Run frontend (root)

```bash
npm run dev
```

### 4. Run backend API

```bash
cd backend
npm run dev
```

## Useful Commands

From project root:

- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run migrate:users:mongodb` - migrate users JSON to MongoDB
- `npm run cleanup:firebase` - dry-run Firebase orphan cleanup
- `npm run cleanup:firebase:delete` - delete orphaned Firebase accounts

From `backend/`:

- `npm run dev` - run API server with nodemon
- `npm start` - run API server
- `npm run seed-admin` - seed admin user

## Documentation

- Active quick-start docs: `START_HERE.md`, `START_HERE_BACKEND.md`
- Archived project documentation is in `docs_archive/`.

## Notes

- Ensure MongoDB and Firebase credentials are valid before running migrations.
- Frontend and backend can be run in parallel using separate terminals.
