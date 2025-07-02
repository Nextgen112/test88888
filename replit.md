# VIP-Hosting File Management System

## Overview

VIP-Hosting is a secure file sharing and management system built with a modern TypeScript full-stack architecture. The application provides IP-based access control, file upload/download functionality, and comprehensive logging capabilities. It's designed specifically for sharing VIP JavaScript files with strict access controls.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with React plugin and runtime error overlay

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL
- **File Storage**: Local filesystem with organized uploads directory
- **Session Management**: Express sessions with PostgreSQL storage

### Key Components

#### Database Schema
- **Users**: Authentication and user management with username/password
- **Files**: File metadata including original names, sizes, MIME types, and upload tracking
- **IP Whitelist**: IP-based access control with expiration dates and descriptions
- **Access Logs**: Comprehensive activity logging for security auditing

#### File Management
- **Upload Restrictions**: Only accepts `.vip.js` files up to 50MB
- **Unique Naming**: Generates unique filenames while preserving original extensions
- **Metadata Tracking**: Stores file size, MIME type, and upload timestamps
- **Access Control**: IP verification middleware for all file operations

#### Security Features
- **IP Whitelisting**: Mandatory IP verification for file access
- **Access Logging**: Tracks all file access attempts and uploads
- **File Type Validation**: Strict filtering for VIP JavaScript files only
- **Session Management**: Secure session handling with database persistence

## Data Flow

1. **File Upload Process**:
   - Client uploads file through drag-and-drop or file picker
   - Server validates file type (must be .vip.js)
   - Generates unique filename and stores in uploads directory
   - Creates database record with metadata
   - Logs upload activity

2. **File Access Process**:
   - Client requests file download
   - IP verification middleware checks whitelist
   - If authorized, serves file from filesystem
   - Logs access attempt (successful or denied)

3. **IP Management**:
   - Admins can add/remove IP addresses from whitelist
   - Supports temporary access with expiration dates
   - All IP changes are logged for audit trail

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for Neon
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management and caching
- **express**: Web framework for Node.js
- **multer**: File upload handling middleware

### UI Dependencies
- **@radix-ui/react-***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **next-themes**: Theme switching functionality

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution with auto-reload
- **Database**: Neon serverless PostgreSQL with connection pooling

### Production Build
- **Frontend**: Vite build generates optimized static assets
- **Backend**: esbuild bundles server code for Node.js execution
- **Database Migration**: Drizzle Kit handles schema migrations
- **Environment**: Requires DATABASE_URL environment variable

### File System Structure
```
├── client/          # React frontend application
├── server/          # Express backend application
├── shared/          # Shared TypeScript schemas and types
├── uploads/         # File storage directory
└── migrations/      # Database migration files
```

## Changelog

```
Changelog:
- July 02, 2025. Initial setup
- July 02, 2025. Added user management system with authentication
  * Implemented login system with admin/password default credentials
  * Added user management interface for creating/editing/deleting admin users
  * Protected all admin routes with authentication middleware
  * Separated public file browsing from admin functions
- July 02, 2025. Implemented role-based access system
  * Removed file upload functionality completely as requested
  * Added maximum 3 admin users limitation
  * Regular users can only login to add their own IP to whitelist
  * Only admin users can download VIP.js files
  * Created /VIP.js endpoint that serves file content directly (no download)
  * VIP.js files are viewable/accessible at /VIP.js URL with IP verification
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```