# EduMind - Educational Platform with Wellness Integration

## Overview

EduMind is a modern educational platform that combines learning management with wellness tracking and gamification. The application features a space/orbital-themed interface designed to engage learners through interactive content, mood tracking, progress monitoring, and educational games. Built as a full-stack TypeScript application, it provides a comprehensive learning environment with integrated wellness features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety
- **Component Library**: Radix UI primitives with shadcn/ui components for consistent design
- **Styling**: Tailwind CSS with custom CSS variables and glass morphism design patterns
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **Animations**: Framer Motion for smooth animations and transitions
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Database Integration**: Drizzle ORM configured for PostgreSQL with Neon Database
- **Schema Validation**: Zod schemas shared between frontend and backend
- **Session Management**: Express session handling with PostgreSQL storage
- **Development**: Hot module replacement and error overlays for development experience

### Database Design
- **Users**: Core user profiles with leveling system (XP, levels)
- **User Progress**: Subject-based progress tracking with completion percentages
- **Mood Entries**: Wellness tracking with timestamped mood records
- **Game Scores**: Gamification system tracking performance and XP rewards
- **Schema Management**: Drizzle migrations with PostgreSQL-specific features

### Data Storage Strategy
- **Production**: PostgreSQL database via Neon Database serverless connection
- **Development**: In-memory storage implementation for rapid prototyping
- **Abstractions**: Storage interface pattern allowing seamless switching between storage backends

### UI/UX Design Patterns
- **Glass Morphism**: Semi-transparent cards with backdrop blur effects
- **Space Theme**: Orbital interfaces, cosmic color schemes, and astronomical metaphors
- **Component System**: Modular component library with consistent theming
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Accessibility**: Radix UI primitives ensure ARIA compliance and keyboard navigation

### API Architecture
- **RESTful Endpoints**: Standard HTTP methods for resource management
- **Type Safety**: End-to-end TypeScript with shared schema definitions
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Request Logging**: Development-friendly request/response logging

### Build System
- **Vite**: Fast development server with hot module replacement
- **ESBuild**: Production build optimization for both client and server
- **Path Aliases**: Simplified imports with @ prefixes for cleaner code organization
- **Asset Handling**: Optimized static asset serving and bundling

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **@tanstack/react-query**: Server state management and caching
- **framer-motion**: Animation library for smooth interactions
- **@radix-ui/react-***: Headless UI component primitives
- **react-hook-form**: Form state management and validation
- **wouter**: Lightweight React router

### Development Tools
- **@replit/vite-plugin-***: Replit-specific development enhancements
- **drizzle-kit**: Database schema management and migrations
- **tsx**: TypeScript execution for development server

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Dynamic class name generation
- **clsx**: Conditional class name utility
- **cmdk**: Command palette implementation

### Utilities
- **date-fns**: Date manipulation and formatting
- **zod**: Runtime type validation and schema definition
- **nanoid**: Unique ID generation
- **connect-pg-simple**: PostgreSQL session store for Express