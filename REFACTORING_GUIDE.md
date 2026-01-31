# Faculty Management System - Refactored with Next.js App Router

## Overview

This project has been successfully migrated from Vite + React to **Next.js with App Router**. The new structure implements proper file-based routing with role-based route groups and middleware-protected routes.

## Architecture Changes

### Previous Structure (Vite + State-based)

- Single AppLayout component managing all navigation via state
- Manual role switching logic in components
- No file-based routing
- Auth state managed within a component

### New Structure (Next.js App Router)

- File-based routing with route groups
- Proper layout nesting per role
- React Context for auth state with localStorage persistence
- Middleware for protecting role-based routes
- Clear separation of concerns

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with AuthProvider
│   ├── page.tsx                   # Root page (redirects to login or dashboard)
│   ├── (auth)/                    # Auth route group
│   │   ├── layout.tsx
│   │   └── login/
│   │       └── page.tsx
│   └── (dashboard)/               # Dashboard route group (protected)
│       ├── layout.tsx             # Shared header/footer for all roles
│       ├── faculty/
│       │   ├── layout.tsx         # Faculty-specific layout with role switcher
│       │   └── dashboard/
│       │       └── page.tsx
│       ├── auditor/
│       │   ├── layout.tsx         # Auditor-specific layout with role switcher
│       │   └── dashboard/
│       │       └── page.tsx
│       └── staff-advisor/
│           ├── layout.tsx         # Staff Advisor-specific layout with role switcher
│           └── dashboard/
│               └── page.tsx
├── components/
│   ├── AuthPage/
│   ├── App/                       # Header, Footer, RoleSwitcher
│   ├── FacultyDashboard/
│   ├── AuditorDashboard/
│   ├── StaffAdvisorDashboard/
│   ├── CourseFileManager/
│   ├── EventReportManager/
│   ├── ui/                        # Shadcn UI components
│   └── shared/
├── context/
│   └── AuthContext.tsx            # Global auth state with localStorage
├── types/
│   └── faculty.ts
└── styles/
    └── *.css

middleware.ts                       # Next.js middleware for route protection
```

## Key Features

### 1. **Auth Context with localStorage Persistence**

Located in `src/context/AuthContext.tsx`:

- Provides `useAuth()` hook for accessing auth state
- Persists user role and auth status to localStorage
- Syncs with middleware for route protection

```tsx
const { isAuthenticated, userRole, login, logout, switchRole } = useAuth();
```

### 2. **Route Groups & Nesting**

- `(auth)` - Public auth routes (login)
- `(dashboard)` - Protected dashboard routes
  - `faculty/` - Faculty role routes
  - `auditor/` - Auditor role routes
  - `staff-advisor/` - Staff Advisor role routes

### 3. **Middleware Protection**

Location: `middleware.ts`

- Redirects unauthenticated users to `/login`
- Prevents unauthorized role access (e.g., faculty can't access auditor routes)
- Automatically redirects to correct role dashboard

### 4. **Shared Layouts**

- **Root Layout** (`src/app/layout.tsx`): Wraps entire app with AuthProvider
- **Dashboard Layout** (`src/app/(dashboard)/layout.tsx`): Provides header/footer to all authenticated routes
- **Role Layouts** (`faculty/`, `auditor/`, `staff-advisor/`): Role-specific layout with RoleSwitcher

## Navigation Flow

```
/                                    [Root - redirects]
├── /login                          [Public - Auth page]
└── /(dashboard)/
    ├── /faculty/dashboard          [Faculty role]
    │   ├── /files                  [Tab content]
    │   └── /events                 [Tab content]
    ├── /auditor/dashboard          [Auditor role]
    └── /staff-advisor/dashboard    [Staff Advisor role]
```

## Component Organization

### UI Components

All Shadcn UI components are in `src/components/ui/`

### Feature Components

- `FacultyDashboard/` - Faculty-specific dashboard with tabs
- `AuditorDashboard/` - Quality auditor dashboard
- `StaffAdvisorDashboard/` - Staff advisor dashboard
- `CourseFileManager/` - File management interface
- `EventReportManager/` - Event report handling

### Shared Components

- `App/AppHeader.tsx` - Navigation header (role-aware)
- `App/AppFooter.tsx` - Footer
- `App/RoleSwitcher.tsx` - Role switcher buttons
- `AuthPage/` - Login/signup forms

## Authentication Flow

1. **Initial Load**: App checks `localStorage` for saved auth state
2. **Login**:
   - User submits credentials on `/login`
   - `useAuth().login(role)` is called
   - Auth state updates and persists to localStorage
   - Cookies are set for middleware
   - User is redirected to `/{role}/dashboard`
3. **Route Access**:
   - Middleware checks auth and role on every navigation
   - Protected routes redirect unauthenticated users to `/login`
   - Cross-role access is prevented
4. **Role Switch**:
   - User clicks role button in RoleSwitcher
   - `useAuth().switchRole(newRole)` updates state
   - User is redirected to `/{newRole}/dashboard`

## Key Differences from Original

| Aspect           | Before            | After                      |
| ---------------- | ----------------- | -------------------------- |
| Build Tool       | Vite              | Next.js                    |
| Routing          | Client-side state | File-based App Router      |
| Layout           | Single component  | Nested layouts             |
| Auth State       | Component state   | React Context              |
| Persistence      | None              | localStorage + middleware  |
| Protected Routes | Manual checks     | Middleware + layout checks |
| Role Switching   | State update      | Context + redirect         |

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run start
```

## Environment Setup

No env variables required for basic setup. If you add backend API calls:

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Import Paths

The project uses path alias `@/` for absolute imports:

```tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { FacultyDashboard } from "@/components/FacultyDashboard";
```

## Notes for Future Development

1. **Add Role-Based Features**: Create separate feature folders per role if needed

   ```
   src/components/
   ├── features/
   │   ├── faculty/
   │   ├── auditor/
   │   └── staff-advisor/
   ```

2. **API Integration**: Replace mock data in components with real API calls
   - Consider using React Query or SWR
   - Middleware can validate tokens with backend

3. **Database Schema**: Use Prisma (already in project) to define schema for:
   - Users (role, email, department)
   - Course files, event reports, audit logs

4. **Extend Middleware**: Add token validation, session management, audit logging

## UI Preservation

✅ **All existing UI components remain unchanged**

- Same visual design
- Same functionality
- Same props (except where routing changed from tabs to pages)
- Same styling with Tailwind CSS

The refactoring focused purely on **routing and state management structure**.
