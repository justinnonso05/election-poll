# 📘 Project Flow & Description – E-Voting Platform

## 1. **Tech Stack**

- **Framework**: Next.js (App Router) + TypeScript
  - **SSR (Server-Side Rendering)**: For public pages like election results and manifesto summaries.
  - **API Routes**: For vote casting, file uploads, candidate/voter imports, election management.
- **UI Library**: Shadcn/ui + TailwindCSS (using global CSS variables for theming).
- **Database**: PostgreSQL with Prisma ORM.
- **Authentication**: NextAuth.js (JWT, email login, optional OTP).
- **AI Layer (Future)**: LangChain + Gemini + Vector DB (for manifesto Q&A/search).
- **File Support**: CSV/XLSX uploads for voters, candidates.

---

## 2. **User Roles (RBAC)**

1. **Superadmin (Platform Owner)**
   - Manages the association info (name, logo, etc).
   - Can clear all election data to “reset” for a new association/election.
   - Can create and manage elections, voters, and candidates.
   - Only one superadmin exists.

2. **Admin**
   - (Optional) Can help manage voters/candidates, but always belongs to the current association.
   - Permissions are set by superadmin.

3. **Voter**
   - Belongs to the current association.
   - Can vote only when an election is in progress.

---

## 3. **Flows**

### 3.1 **Superadmin Flow**

- Log in.
- View current association info and election status.
- If an election is ongoing: can end and clear all election data.
- If no election: can update association info (to “rent” to another group), set up new election, upload voters/candidates.

### 3.2 **Admin Flow**

- Log in.
- Manage voters and candidates for the current association/election.

### 3.3 **Voter Flow**

- Log in with provided credentials.
- Can only vote if an election is in progress.
- Can view candidates, preview, and cast vote (once).

---

## 4. **Public Pages**

- **Results page** (after election ends): shows candidate comparison, charts, etc.
- **Manifesto insights** (future): AI Q&A and summaries.

---

## 5. **Security & Integrity**

- One vote per voter per election.
- Superadmin can clear all election data to “reset” for a new association/election.
- All data is tied to the single current association.
- RBAC enforcement: Superadmin, Admin, Voter.
- Data protection: encrypted vote storage, audit logs.
- Election lock: Once ended, cannot be altered.

---

## 6. **Future Enhancements (LangChain + Gemini)**

- Vector DB for manifesto embedding.
- AI Q&A for voters.
- AI-generated election insights (popular topics, comparison summaries).

---

## 7. **Project Structure (Next.js)**

```
/app
  /auth        → login, registration
  /admin       → admin dashboard
  /election    → voter-facing election pages
  /results     → public results page
  /api         → API routes for elections, voters, candidates, votes, analytics
/prisma        → schema definitions
/components    → shared and UI components
/lib           → utils (RBAC, validation, encryption)
/types         → TypeScript types
/hooks         → custom React hooks
/stores        → state management
/public        → images, templates, docs
/docs          → documentation
/scripts       → utility scripts
/tests         → test files
```

---

✅ This blueprint reflects a **single-association, single-election-at-a-time** platform, with “renting” as simply updating association info and clearing election data. All features, roles, flows, and future AI plans are included.
