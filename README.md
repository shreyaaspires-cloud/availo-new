# NexusShare — Institutional & Community Resource Sharing Platform

> **A trusted, auditable platform that helps institutions and communities safely share underused spaces, equipment, and technical resources with automated eligibility verification, fair-access allocation, and AI-assisted condition documentation.**

---

## 1. Project Overview

Colleges, laboratories, makerspaces, and research centers own high-value technical assets (CNC mills, electron microscopes, autoclaves, media studios) that remain underutilized. Standard booking systems fail because they ignore qualification prerequisites, condition tracking, anti-monopoly fairness caps, and tamper-evident audit trails.

**NexusShare** governs the complete **10-Step Custody Lifecycle**:
1. **List Resource**: Owners configure specifications, weekly hourly caps, and required safety certifications.
2. **Discover & Eligibility Check**: Users browse assets with real-time eligibility evaluation based on credentials and quota.
3. **Submit Request**: Users propose booking windows and declare intended project use.
4. **Automated Verification**: Backend validates schedule conflicts, user certification status, and rolling 7-day usage limits.
5. **Admin Review**: Resource managers review pre-vetted requests with quota and conflict telemetry.
6. **Fair Allocation & Waitlist**: Contested slots are assigned via an explainable Fair-Access Priority Engine.
7. **Check-In & Initial Condition**: Borrowers log pre-use physical condition with ratings and photo proof.
8. **Check-Out & Return**: Borrowers log post-use condition and report any operational issues.
9. **Incident & AI Discrepancy Analysis**: Gemini 2.5 Flash inspects check-in vs. check-out delta logs to detect anomalies or damage.
10. **Immutable Audit History**: Every state mutation is permanently recorded in an append-only ledger.

---

## 2. Tech Stack

- **Pure React SPA**: React 19, TypeScript 5.8+, Vite 8, React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS v4, Modern Laboratory Design System (Stitch MCP tokens)
- **State Management**: Zustand 5 reactive in-memory lifecycle engine
- **Icons**: Lucide React
- **AI Integration**: Google Gemini 2.5 Flash for condition discrepancy and fairness priority reasoning
- **Testing**: TestSprit framework
- **Role-Based Access Control**: Strictly `USER` (Borrower) and `ADMIN` (Lab Director)

---

## 3. Getting Started

### Prerequisites
- Node.js >= 20.x
- npm

### Installation & Run (React SPA)
```bash
# Navigate to the React frontend
cd react-frontend

# Install dependencies (already completed)
npm install

# Start development server
npm run dev
```

---

## 4. User Roles & Credentials (Demo Mode)

- **Student / Researcher**: `demo@yourapp.com` / `HackDemo@Hack` (Role: `USER`, Maya Lin)
- **Lab Director / Owner**: `admin@yourapp.com` / `HackAdmin@Hack` (Role: `ADMIN`, Dr. Aris Thorne)
