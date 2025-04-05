<<<<<<< HEAD
# Occupation Search Platform

A comprehensive platform for Australian skilled migration pathways, built with React, TypeScript, and Firebase.

## Project Overview

This application helps users explore migration pathways to Australia by providing:

- ANZSCO occupation search and details
- Visa eligibility assessment
- Points calculator
- State nomination requirements
- EOI (Expression of Interest) tracking
- Document checklists
- Visa fee calculator

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Functions**: Firebase Cloud Functions
- **PDF Generation**: pdfmake
- **UI Components**: Custom components (no external UI library)

## Key Features

### 1. Authentication & Authorization
- Email/Password and Google Sign-in
- Role-based access (User, Admin, SuperAdmin)
- Company/Tenant management
- Profile management

### 2. Core Features
- **Occupation Search**: Real-time ANZSCO code search
- **Visa Eligibility**: Comprehensive visa pathway assessment
- **Points Calculator**: Multiple calculators (GSM, Business, Canberra Matrix)
- **State Nomination**: Real-time state requirements and eligibility
- **EOI Dashboard**: Track Expression of Interest rounds
- **Document Checklist**: Dynamic document requirements

### 3. Admin Features
- User management
- Tenant management
- Support ticket system
- Analytics and reporting

## Project Structure

### Core Components

```
src/
├── components/           # React components
│   ├── Auth/            # Authentication components
│   ├── Dashboard/       # Dashboard-related components
│   ├── LandingPage/     # Landing page components
│   ├── sections/        # Feature-specific sections
│   └── ui/              # Reusable UI components
│
├── contexts/            # React contexts
│   ├── UserContext.tsx  # User authentication context
│   └── TenantContext.tsx# Multi-tenant context
│
├── hooks/               # Custom React hooks
│   ├── useToast.ts     # Toast notifications
│   └── useImageUpload.ts# Image upload handling
│
├── lib/                 # Core functionality
│   ├── firebase.ts     # Firebase configuration
│   ├── membership.ts   # Tenant membership logic
│   └── database.types.ts# Database type definitions
│
├── services/           # API services
│   └── anzscoService.ts# ANZSCO data fetching
│
├── types/              # TypeScript types
│   ├── calculator.ts   # Calculator types
│   ├── subscription.ts # Subscription types
│   └── tenant.ts      # Tenant types
│
└── utils/              # Utility functions
    └── pdfGenerator.ts # PDF generation utility
```

### Key Files

1. **Firebase Configuration** (`src/lib/firebase.ts`):
   - Firebase initialization
   - Authentication helpers
   - Admin checks

2. **Security Rules**:
   - `firestore.rules`: Firestore security rules
   - `storage.rules`: Storage security rules

3. **Cloud Functions** (`functions/src/index.ts`):
   - Tenant management
   - User management
   - Custom claims

## Features in Detail

### 1. Multi-tenancy
- Company/organization-based tenancy
- Role-based access control
- Tenant-specific settings and branding

### 2. User Management
- User roles (User, Admin, SuperAdmin)
- Profile management
- Company settings

### 3. Document Management
- Profile picture upload
- Company logo upload
- Document storage

### 4. Real-time Features
- EOI updates
- Support tickets
- Notifications

### 5. Integration Features
- Widget for external websites
- API access
- PDF generation

## Getting Started

1. **Installation**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create `.env` file with Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Development**:
   ```bash
   npm run dev
   ```

4. **Build**:
   ```bash
   npm run build
   ```

## Security

- Firebase Authentication
- Role-based access control
- Secure file uploads
- Data validation
- Rate limiting

## Deployment

The application can be deployed to:
- Firebase Hosting
- Netlify
- Vercel
- Any static hosting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
=======
# OccupationSearch
>>>>>>> b01c54084da1aa54c498f293f7429d555d9ae658
