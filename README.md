# NexusShare — Institutional & Community Resource Sharing Platform

> **A trusted, auditable platform that helps institutions and communities safely share underused spaces, equipment, and technical resources with automated eligibility verification, fair-access allocation, and AI-assisted condition documentation.**

---

## 1. Project Overview

Colleges, laboratories, makerspaces, and research centers own high-value technical assets (CNC mills, electron microscopes, autoclaves, cleanrooms, media studios) that remain underutilized. Standard booking systems fail because they ignore qualification prerequisites, condition tracking, anti-monopoly fairness caps, and tamper-evident audit trails.

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

## 2. Supported Equipment Categories

NexusShare natively categorizes institutional equipment across 6 standardized disciplines:
1. `MAKERSPACE_TOOL` (CNC Routers, 3D Printers, Laser Cutters)
2. `LABORATORY` (Autoclaves, Spectrometers, Centrifuges)
3. `TESTING_DEVICE` (Oscilloscopes, RF Chambers, Load Cells)
4. `COMPUTE_WORKSTATION` (GPU Clusters, High-Performance Workstations)
5. `MICROSCOPY_SUITE` (Cryo-TEM, Confocal Laser Scanning Microscopes)
6. `CLEANROOM_EQUIPMENT` (Laminar Flow Benches, Photolithography Hoods)

---

## 3. Tech Stack & Clean Architecture

- **Pure React SPA (`react-frontend/`)**: React 19, TypeScript 5.8+, Vite 8, React Router v7 (`react-router-dom`)
- **Next.js Frontend (`frontend/`)**: Next.js 16 (Webpack mode), TypeScript, Tailwind CSS
- **Styling**: Tailwind CSS v4, Modern Laboratory Design System (Stitch MCP design tokens)
- **State Management**: Zustand 5 reactive in-memory lifecycle engine
- **Icons**: Lucide React
- **AI Integration**: Google Gemini 2.5 Flash condition discrepancy analysis & fairness reasoning
- **Testing**: TestSprit testing framework

### Ponytail Clean-Code Principles
- **Zero Dead Code**: Unused assets, template SVGs, and boilerplate CSS (`App.css`) removed.
- **Strict Component APIs**: Button component strictly supports `primary | secondary | danger | ghost`.
- **Pure React Idioms**: Dynamic date initializers run in lazy state callbacks without impure render-time evaluations.
- **Robust Route Guards**: Unauthenticated sessions are automatically redirected to `/login`.

---

## 4. Directory Structure

```
backend project/
├── react-frontend/          # Primary Pure React 19 SPA (Vite + React Router v7)
│   ├── src/
│   │   ├── components/      # Stitch UI primitives (Button, Modal, Card, ToastContainer, etc.)
│   │   ├── pages/           # All 10 custody lifecycle screens (Dashboard, AIAudit, Admin, etc.)
│   │   ├── lib/             # Zustand store & deterministic mock data fixtures
│   │   └── types/           # Strict TypeScript schemas and enums
│   ├── vite.config.ts       # Vite 8 configuration with path aliases (@/)
│   └── package.json
├── frontend/                # Next.js 16 App Router implementation
├── README.md                # Project documentation and lifecycle reference
└── *.md                     # Architecture, PRD, and TRD specifications
```

---

## 5. Getting Started

### Prerequisites
- **Node.js**: >= 20.x
- **npm**: >= 10.x

### Run Pure React SPA (Recommended)
```bash
# Navigate to the React frontend
cd react-frontend

# Install dependencies (if not already installed)
npm install

# Start development server (instant hot reload)
npm run dev

# Run production build
npm run build

# Run linting (oxlint — zero errors/warnings)
npm run lint
```

### Run Next.js Frontend
```bash
cd frontend
npm install
npm run dev
npm run build
```

---

## 6. User Roles & Credentials (Demo Mode)

The interface features an interactive instant role-switcher in the navigation sidebar:

- **Borrower / Student**: `demo@yourapp.com` / `HackDemo@Hack`
  - Name: **Maya Lin**
  - Department: Robotics & Mechanical Engineering
  - Credentials: `LASER_SAFETY_L1`, `CNC_CERT`, `RAPID_PROTO_L2`
  - Trust Score: **98 / 100**

- **Lab Director / Admin**: `admin@yourapp.com` / `HackAdmin@Hack`
  - Name: **Dr. Aris Thorne**
  - Role: **ADMIN**
  - Capabilities: Approve/reject requests, arbitrate waitlists, grant safety certifications
