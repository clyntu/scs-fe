# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build production application
- `npm start` - Start production server  
- `npm run lint` - Run ESLint for code quality

### Package Manager
This project uses npm. Always use `npm install` for dependencies.

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 14 with TypeScript
- **UI**: Material-UI (@mui/joy, @mui/material) + Tailwind CSS
- **Authentication**: Supabase Auth with multi-company support
- **API**: Axios with custom interceptors for authentication
- **PDF Generation**: jsPDF with autotable
- **Notifications**: React Toastify

### Multi-Company Architecture
The application supports multiple companies through:
- **Company IDs**: `"company-a"` and `"company-b"` defined in `CompanyId` type
- **Supabase Clients**: Separate Supabase instances per company with cached clients
- **Authentication**: Company-specific auth tokens and sessions
- **API Headers**: `X-Company-ID` header sent with all requests

### Project Structure

#### Key Directories
- `/src/components/` - Business logic components organized by feature
- `/src/pages/` - Next.js pages with route-based organization
- `/src/supabase/` - Supabase configuration and multi-company client management  
- `/src/utils/` - Axios configuration with auth interceptors
- `/src/interface.ts` - Comprehensive TypeScript interfaces for all entities

#### Business Modules
Each business module follows a consistent pattern with:
- Form components for create/edit operations
- View components for data display
- Modal components for confirmations and selections
- Interface definitions specific to the module

**Core Business Entities:**
- **Inventory**: Items, Warehouses, Stock Management
- **Purchasing**: Purchase Orders (PO), Delivery Receipts (SDR), Receiving Reports (RR)
- **Sales**: Customer Purchase Orders (CPO), Allocations, Delivery Planning (CDP), Customer Delivery Receipts (CDR), Customer Returns (CR), AR Receipts
- **Master Data**: Suppliers, Customers, Currencies

### Authentication Flow
1. Multi-company Supabase client selection based on company ID
2. JWT token management with automatic refresh
3. Axios interceptors handle token attachment and 401 responses
4. Company ID stored in localStorage and cookies
5. Automatic redirect to login on auth failures

### Component Patterns
- **Form Components**: Follow `[Entity]Form` naming with props for create/edit modes
- **View Components**: Follow `View[Entity]` naming with data tables and actions
- **Modal Components**: Consistent props pattern with `open`, `setOpen`, `onSave`/`onDelete`
- **Interface Props**: Strongly typed with specific props interfaces for each component

### API Integration
- Base URL configured via `NEXT_PUBLIC_API_URL` environment variable
- Automatic auth token injection via Axios interceptors
- Company ID header (`X-Company-ID`) sent with all requests
- Retry logic for token refresh and network failures
- Error handling for 401, 403, and network issues

### Styling Approach
- Tailwind CSS for utility classes
- Material-UI components for complex UI elements
- Consistent spacing and responsive design patterns
- Custom font (Inter) configured globally

### State Management
- React state for local component state
- Supabase for authentication state
- localStorage for company ID and session persistence
- No global state management library (Redux/Zustand)

## Development Notes

### Adding New Business Modules
1. Create component directory under `/src/components/[ModuleName]/`
2. Add interfaces to `/src/interface.ts` or create module-specific interface file
3. Follow existing patterns for Form, View, and Modal components
4. Add navigation routes in Sidebar component
5. Create corresponding page in `/src/pages/`

### Working with Multi-Company Setup
- Always use `getSupabase(companyId)` to get the correct client
- Ensure `X-Company-ID` header is included in API calls
- Test functionality across both company contexts
- Handle company switching scenarios gracefully

### TypeScript Usage
- All components are strongly typed
- Interfaces are centralized in `/src/interface.ts`
- Generic types used for pagination and CRUD operations
- Proper typing for Supabase responses and API calls