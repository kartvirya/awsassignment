# Youth Empowerment Hub

## Overview

This is a full-stack web application designed to support youth violence intervention through counseling resources, CBT-based self-help tools, and access to mentors. The platform connects students with counselors, provides educational resources, and facilitates communication between different user roles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API with JSON responses

### Database Architecture
- **Primary Database**: PostgreSQL (via Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Connection**: Connection pooling with @neondatabase/serverless
- **Session Storage**: PostgreSQL-backed session store for authentication

## Key Components

### User Management System
- **Role-based Access Control**: Three user roles (student, counselor, admin)
- **Authentication**: Integrated with Replit Auth for secure login
- **User Profiles**: Comprehensive user management with profile information
- **Session Management**: Server-side session handling with PostgreSQL storage

### Resource Management
- **Content Types**: Worksheets, videos, audio files, and interactive materials
- **File Storage**: Designed for external file storage integration
- **Resource Categories**: Organized by type and accessibility
- **Progress Tracking**: User progress monitoring for accessed resources

### Counseling Session System
- **Session Booking**: Students can book sessions with counselors
- **Session Types**: Individual and group session support
- **Status Management**: Pending, confirmed, completed, and cancelled states
- **Scheduling**: Date/time management with counselor availability

### Messaging System
- **Real-time Communication**: Direct messaging between students and counselors
- **Conversation Threading**: Organized conversation history
- **Message Status**: Sent and read status tracking
- **Role-based Messaging**: Different message interfaces for each user role

### Dashboard Systems
- **Student Dashboard**: Overview, resources, sessions, messages, and profile
- **Counselor Dashboard**: Session management, student overview, resources, and messaging
- **Admin Dashboard**: User management, analytics, session oversight, and system settings

## Data Flow

### Authentication Flow
1. User clicks "Sign In" → Redirects to Replit Auth
2. Replit Auth validates → Returns to application with user data
3. Server creates/updates user session in PostgreSQL
4. Client receives authenticated user data via `/api/auth/user`

### Resource Access Flow
1. User navigates to resources section
2. Frontend queries `/api/resources` with optional filters
3. Backend retrieves resources from database with user permissions
4. Resources displayed with progress tracking capabilities

### Session Booking Flow
1. Student selects counselor and preferred time
2. Frontend submits booking request to `/api/sessions`
3. Backend creates session with "pending" status
4. Counselor receives notification and can confirm/reject
5. Session status updates trigger notifications to both parties

### Messaging Flow
1. User composes message in frontend interface
2. Message sent to `/api/messages` with receiver ID
3. Backend stores message and updates conversation thread
4. Real-time updates refresh conversation views

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **express**: Web server framework
- **@tanstack/react-query**: Server state management
- **zod**: Schema validation
- **react-hook-form**: Form handling

### UI and Styling
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Authentication and Security
- **openid-client**: OpenID Connect client for Replit Auth
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js with tsx for TypeScript execution
- **Development Server**: Vite dev server with HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS

### Production Build
- **Frontend**: Vite build output to `dist/public`
- **Backend**: esbuild compilation to `dist/index.js`
- **Database**: Drizzle migrations with `db:push` command
- **Static Assets**: Served from built frontend directory

### Configuration Requirements
- **Database**: PostgreSQL connection string in DATABASE_URL
- **Sessions**: Secure session secret in SESSION_SECRET
- **Auth**: Replit domain configuration in REPLIT_DOMAINS
- **OIDC**: Issuer URL for OpenID Connect authentication

### File Structure
```
/client          # React frontend application
/server          # Express backend application
/shared          # Shared TypeScript definitions and schemas
/migrations      # Database migration files
/dist           # Production build output
```

The application uses a monorepo structure with shared type definitions, enabling full-stack type safety and streamlined development workflow.