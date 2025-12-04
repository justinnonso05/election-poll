**full structured project flow + description** that captures:

- **Voter experience** (login → vote → preview → cast).
- **Association (tenant) dashboard** (upload candidates/voters, manage election).
- **Super Association (platform owner) dashboard** (can also rent out election setups).
- **RBAC rules** (who sees what).
- **Public pages** (results + manifesto summaries).
- **AI (LangChain + Gemini)** as _future implementation_.
- **Tech stack choices** (Next.js, SSR, API routes, Prisma, Shadcn/ui, Tailwind, vector DB, etc).

I’ll write this in a structured format so it becomes your **blueprint / master project doc**.

---

# 📘 Project Flow & Description – E-Voting Platform

## 1. **Tech Stack**

- **Framework**: Next.js (App Router) + TypeScript
  - **SSR (Server-Side Rendering)**: For public pages like election results and manifesto summaries.
  - **API Routes**: For handling vote casting, file uploads, candidate/voter imports, election management.

- **UI Library**: Shadcn/ui (Zinc/Slate theme) + TailwindCSS.
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: NextAuth.js (JWT, email login, optional OTP).
- **AI Layer (Future)**: LangChain + Gemini + Vector DB (for manifesto search/Q\&A).
- **File Support**: CSV/XLSX uploads for voters, candidates.

---

## 2. **User Roles (RBAC)**

1. **Super Association (Super Admin / Platform Owner)**
   - Can **create and run its own election**.
   - Can **rent out the app** to associations.
   - Manages app-wide state (only **one election can run at a time**).
   - Extra dashboard controls:
     - Check if election is ongoing.
     - End/clear ongoing election.
     - Rent flow (set up association + account).

2. **Association Admin (Tenant Admin)**
   - Logs in to manage their election.
   - Can:
     - Upload voters (CSV/XLSX).
     - Upload candidates (name, image, position, manifesto, citation/achievements).
     - send out mails with votind details and instructions
     - Set election start/end date & time.
     - Manually start/stop election.
     - Export results and analytics after election.

3. **Voter**
   - Logs in using credentials provided by the association.
   - Can:
     - View candidate list (details + manifesto).
     - Select a candidate per position.
     - Preview selections.
     - Cast final vote (only once).

   - Only active when election is in progress.

---

## 3. **Flows**

### 3.1 **Super Association Flow**

1. Log in.
2. Dashboard shows:
   - Election status: ongoing or not.
   - If ongoing → option to end & clear.
   - If no election → two choices:
     1. **Run election for self**: Create directly.
     2. **Rent app to association**:
        - Upload association name, logo, short name.
        - System creates a new tenant account (non-super role).
        - Credentials are sent (email or manual handover).
        - That association continues setup.

---

### 3.2 **Association Admin Flow**

1. Log in.
2. Dashboard actions:
   - Download voter import spreadsheet template.
   - Upload voter list (CSV/XLSX).
   - Upload candidates:
     - Name
     - Position (mapped to election)
     - Image
     - Manifesto document
     - Citation (brief background/achievement).

   - Configure election:
     - Start date/time
     - End date/time
     - Manual override: start/end election.

   - During election: Monitor activity.
   - After election: Export results (CSV/PDF) and view analytics dashboard.

---

### 3.3 **Voter Flow**

1. Log in with provided credentials.
2. Election must be “in progress” to proceed.
3. Screens available:
   - **Candidate List Page**: show candidates with name, position, photo, manifesto, citation.
   - **Vote Selection Page**: choose candidate per position.
   - **Preview Page**: review selections.
   - **Cast Vote Page**: confirm and submit vote.
   - Lock vote after submission.

---

### 3.4 **Public Pages**

1. **Results Page (visible only after election ends)**
   - Candidate comparison with votes % + bar/pie charts.
   - Accessible without login.

2. **Manifesto Insights Page (future AI integration)**
   - Summaries of each candidate’s manifesto.
   - Comparison of promises.
   - AI Q\&A: voters ask questions about candidates.
   - Powered by LangChain + Gemini + Vector DB (for cost efficiency).

---

## 4. **Election Results & Analytics**

- **Admin-only dashboard** after election:
  - Votes per candidate (tables + charts).
  - Voter turnout percentage.
  - Candidate comparisons.
  - Optional **AI-generated summaries** (future).

---

## 5. **Security & Integrity**

- **Vote Casting**:
  - Each vote tied to voter ID (but anonymized).
  - One vote per eligible voter.

- **RBAC enforcement**: Super vs Association Admin vs Voter.
- **Data Protection**: Encrypted vote storage, audit logs.
- **Election Lock**: Once ended, cannot be altered.

---

## 6. **Future Enhancements (LangChain + Gemini)**

_(last implementation phase to save cost)_

- Vector DB for manifesto embedding.
- AI Q\&A for voters.
- AI-generated election insights (popular topics, comparison summaries).

---

## 7. **Project Structure (Next.js)**

```
/app
  /auth        → login, registration (SSR)
  /dashboard   → admin dashboards (API + SSR)
  /election    → voter-facing election pages (CSR + API calls)
  /results     → public results page (SSR)
  /api
    /elections → create, update, start/end elections
    /voters    → upload, list, validate
    /candidates→ upload, list
    /votes     → cast & validate votes
    /analytics → results & charts
/prisma        → schema definitions
/components    → shadcn/ui components
/lib           → utils (RBAC, validation, encryption)
```

---

✅ This structured plan captures **all roles, flows, RBAC rules, features, AI as future**, plus **where SSR vs API is used**.

Would you like me to now **convert this into a polished PDF master document** (with tables, role/flow diagrams, and feature breakdowns), so you can always reference it formally?

nacos-poll/
├── .env.local # Environment variables
├── .env.example # Example environment file
├── .gitignore
├── package.json
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
├── README.md
├── features.md # Your blueprint document
├── middleware.ts # Next.js middleware for auth/routing
│
├── prisma/
│ ├── schema.prisma # Database schema
│ ├── seed.ts # Database seeding
│ └── migrations/ # Auto-generated migrations
│
├── app/ # Next.js App Router (NO src folder)
│ ├── globals.css
│ ├── layout.tsx # Root layout
│ ├── page.tsx # Landing page
│ ├── loading.tsx # Global loading UI
│ ├── not-found.tsx # 404 page
│ │
│ ├── auth/ # Authentication pages
│ │ ├── login/
│ │ │ └── page.tsx # Login page (SSR)
│ │ ├── register/
│ │ │ └── page.tsx # Registration (if needed)
│ │ └── error/
│ │ └── page.tsx # Auth error page
│ │
│ ├── dashboard/ # Admin dashboards
│ │ ├── layout.tsx # Dashboard layout with nav
│ │ ├── page.tsx # Dashboard home
│ │ │
│ │ ├── super-admin/ # Super Association dashboard
│ │ │ ├── page.tsx # Super admin overview
│ │ │ ├── rent-setup/
│ │ │ │ └── page.tsx # Set up tenant association
│ │ │ └── election-control/
│ │ │ └── page.tsx # Global election controls
│ │ │
│ │ ├── association/ # Association Admin dashboard
│ │ │ ├── page.tsx # Association overview
│ │ │ ├── voters/
│ │ │ │ ├── page.tsx # Voter management
│ │ │ │ └── upload/
│ │ │ │ └── page.tsx # Upload voter CSV/XLSX
│ │ │ ├── candidates/
│ │ │ │ ├── page.tsx # Candidate management
│ │ │ │ ├── add/
│ │ │ │ │ └── page.tsx # Add new candidate
│ │ │ │ └── [id]/
│ │ │ │ └── page.tsx # Edit candidate
│ │ │ ├── election-setup/
│ │ │ │ └── page.tsx # Configure election settings
│ │ │ ├── send-credentials/
│ │ │ │ └── page.tsx # Send voter credentials
│ │ │ └── analytics/
│ │ │ └── page.tsx # Results & analytics
│ │ │
│ │ └── components/ # Dashboard-specific components
│ │ ├── sidebar.tsx
│ │ ├── voter-upload-form.tsx
│ │ ├── candidate-form.tsx
│ │ ├── election-controls.tsx
│ │ └── analytics-charts.tsx
│ │
│ ├── election/ # Voter-facing election pages
│ │ ├── layout.tsx # Election layout with header
│ │ ├── page.tsx # Election home/status
│ │ ├── candidates/
│ │ │ ├── page.tsx # Browse all candidates
│ │ │ └── [id]/
│ │ │ └── page.tsx # Individual candidate details
│ │ ├── vote/
│ │ │ ├── page.tsx # Vote selection interface
│ │ │ ├── preview/
│ │ │ │ └── page.tsx # Preview selections
│ │ │ └── cast/
│ │ │ └── page.tsx # Cast final vote
│ │ ├── manifesto/
│ │ │ └── [candidateId]/
│ │ │ └── page.tsx # View manifesto details
│ │ └── components/ # Election-specific components
│ │ ├── candidate-card.tsx
│ │ ├── vote-form.tsx
│ │ ├── preview-ballot.tsx
│ │ └── manifesto-viewer.tsx
│ │
│ ├── results/ # Public results pages (SSR)
│ │ ├── page.tsx # Main results page
│ │ ├── [electionId]/
│ │ │ └── page.tsx # Specific election results
│ │ └── components/
│ │ ├── results-chart.tsx
│ │ ├── candidate-comparison.tsx
│ │ └── turnout-stats.tsx
│ │
│ ├── manifesto-insights/ # Future AI features
│ │ ├── page.tsx # AI-powered manifesto Q&A
│ │ ├── compare/
│ │ │ └── page.tsx # AI candidate comparison
│ │ └── components/
│ │ ├── ai-chat.tsx
│ │ └── manifesto-summary.tsx
│ │
│ └── api/ # API Routes
│ ├── auth/
│ │ └── [...nextauth]/
│ │ └── route.ts # NextAuth configuration
│ │
│ ├── elections/
│ │ ├── route.ts # GET/POST elections
│ │ ├── [id]/
│ │ │ ├── route.ts # GET/PUT/DELETE specific election
│ │ │ ├── start/
│ │ │ │ └── route.ts # Start election
│ │ │ ├── end/
│ │ │ │ └── route.ts # End election
│ │ │ └── results/
│ │ │ └── route.ts # Get election results
│ │ └── current/
│ │ └── route.ts # Get current active election
│ │
│ ├── voters/
│ │ ├── route.ts # GET/POST voters
│ │ ├── upload/
│ │ │ └── route.ts # Upload CSV/XLSX
│ │ ├── template/
│ │ │ └── route.ts # Download import template
│ │ └── send-credentials/
│ │ └── route.ts # Email voter credentials
│ │
│ ├── candidates/
│ │ ├── route.ts # GET/POST candidates
│ │ ├── [id]/
│ │ │ └── route.ts # GET/PUT/DELETE candidate
│ │ └── upload-image/
│ │ └── route.ts # Upload candidate photos
│ │
│ ├── votes/
│ │ ├── route.ts # POST vote
│ │ ├── validate/
│ │ │ └── route.ts # Validate voter eligibility
│ │ └── status/
│ │ └── route.ts # Check if user has voted
│ │
│ ├── associations/
│ │ ├── route.ts # GET/POST associations (super admin)
│ │ └── [id]/
│ │ └── route.ts # GET/PUT association details
│ │
│ ├── analytics/
│ │ ├── route.ts # Election analytics data
│ │ ├── turnout/
│ │ │ └── route.ts # Voter turnout stats
│ │ └── export/
│ │ └── route.ts # Export results (CSV/PDF)
│ │
│ └── ai/ # Future AI endpoints
│ ├── manifesto-qa/
│ │ └── route.ts # AI Q&A about manifestos
│ └── summarize/
│ └── route.ts # AI manifesto summaries
│
├── components/ # Shared components (root level)
│ ├── ui/ # Shadcn/ui components
│ │ ├── button.tsx
│ │ ├── card.tsx
│ │ ├── form.tsx
│ │ ├── input.tsx
│ │ ├── select.tsx
│ │ ├── table.tsx
│ │ ├── dialog.tsx
│ │ ├── toast.tsx
│ │ └── ...other shadcn components
│ │
│ ├── auth/
│ │ ├── login-form.tsx
│ │ ├── protected-route.tsx
│ │ └── role-guard.tsx
│ │
│ ├── layout/
│ │ ├── header.tsx
│ │ ├── footer.tsx
│ │ ├── navigation.tsx
│ │ └── breadcrumbs.tsx
│ │
│ ├── charts/
│ │ ├── pie-chart.tsx
│ │ ├── bar-chart.tsx
│ │ └── line-chart.tsx
│ │
│ ├── file-upload/
│ │ ├── csv-uploader.tsx
│ │ ├── image-uploader.tsx
│ │ └── file-validator.tsx
│ │
│ └── common/
│ ├── loading-spinner.tsx
│ ├── error-boundary.tsx
│ ├── confirm-dialog.tsx
│ └── data-table.tsx
│
├── lib/ # Utility functions (root level)
│ ├── auth.ts # Authentication helpers
│ ├── db.ts # Prisma client instance
│ ├── validations.ts # Zod validation schemas
│ ├── permissions.ts # RBAC permission checks
│ ├── utils.ts # General utilities
│ ├── file-processing.ts # CSV/XLSX processing
│ ├── email.ts # Email sending utilities
│ ├── encryption.ts # Vote encryption/security
│ ├── charts.ts # Chart data formatting
│ └── ai/ # Future AI utilities
│ ├── langchain.ts
│ ├── embeddings.ts
│ └── vector-db.ts
│
├── types/ # TypeScript type definitions (root level)
│ ├── auth.ts # User, session types
│ ├── election.ts # Election, vote types
│ ├── database.ts # Prisma model types
│ ├── api.ts # API request/response types
│ └── charts.ts # Chart data types
│
├── hooks/ # Custom React hooks (root level)
│ ├── use-auth.ts # Authentication state
│ ├── use-election.ts # Election data management
│ ├── use-voter.ts # Voter state management
│ ├── use-file-upload.ts # File upload handling
│ └── use-charts.ts # Chart data hooks
│
├── stores/ # State management (root level)
│ ├── auth-store.ts # Global auth state
│ ├── election-store.ts # Election state
│ └── vote-store.ts # Vote draft state
│
├── public/
│ ├── images/
│ │ ├── logo.png
│ │ ├── default-avatar.png
│ │ └── association-logos/ # Uploaded association logos
│ ├── templates/
│ │ ├── voter-import-template.xlsx
│ │ └── candidate-import-template.xlsx
│ ├── icons/
│ │ └── favicon.ico
│ └── docs/
│ ├── user-guide.pdf
│ └── api-documentation.pdf
│
├── docs/ # Project documentation
│ ├── setup.md
│ ├── deployment.md
│ ├── api-reference.md
│ └── user-guide.md
│
├── scripts/ # Utility scripts
│ ├── seed-database.ts
│ ├── migrate-data.ts
│ └── generate-reports.ts
│
└── tests/ # Test files
├── **tests**/
│ ├── api/
│ ├── components/
│ └── pages/
├── fixtures/
└── setup.ts
