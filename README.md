# SahYog — Societal Innovation Collaboration Platform

<p align="center">
  <img src="./public/logo-mark.png" alt="SahYog" width="100">
</p>

<p align="center"><strong>From Community Challenges to Collaborative Solutions</strong></p>

<p align="center">
  Government of Jharkhand · Smart India Hackathon 2026 · PS ID: SIH26043 · Team Hackaholics
</p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white" alt="Supabase"></a>
</p>

---

## Overview

SahYog is a societal innovation collaboration platform designed around the Government of Jharkhand problem statement **SIH26043**.

The platform connects:

**Citizens / Communities → Government of Jharkhand → HEIs → Industry / Startups / MSMEs → NGOs / CSR / Research Partners**

The goal is not only to collect complaints. SahYog turns a verified societal challenge into a structured innovation opportunity that can be categorized, prioritized, matched to relevant institutions, developed collaboratively, piloted, deployed and verified by the community.

### Core lifecycle

**Report → Validate → Classify → Prioritize → Match → Collaborate → Build → Pilot → Deploy → Verify → Measure**

---

## Problem Statement Alignment

**Organization:** Government of Jharkhand  
**Problem Statement:** SIH26043

| Problem Statement Requirement | SahYog Capability |
|---|---|
| Citizen/community challenge submission | Evidence-based societal challenge reporting |
| Photos, videos and documents | Evidence and supporting information workflow |
| Geographical location | EXIF GPS, device GPS and map/manual fallback |
| AI-enabled categorization | Prototype classification/domain engine |
| Prioritization | Impact-based severity and priority assessment |
| Deduplication | Duplicate-detection workflow |
| HEI routing | Domain, expertise, jurisdiction and capacity matching |
| University collaboration | Institutional assignment and solution workflow |
| Industry/startup/MSME/CSR | Partner matching and collaboration records |
| Project monitoring | Lifecycle states, milestones and updates |
| Government analytics | Government Control Center |
| Community outcomes | Citizen verification and impact tracking |
| Notifications | Stakeholder notification workflow |

---

## Platform Ecosystem

~~~mermaid
flowchart LR
    C[Citizen / Community] --> S[Submit Societal Challenge]
    S --> V[Government of Jharkhand<br/>Validate & Review]
    V --> A[Problem Analysis]
    A --> M[Smart Matching]

    M --> H[University / HEI]
    M --> I[Industry / Startup / MSME]
    M --> N[NGO / CSR / Research]

    H --> T[Collaborative Solution Team]
    I --> T
    N --> T

    T --> P[Solution Proposal]
    P --> R[Research / Prototype]
    R --> Q[Testing / Field Pilot]
    Q --> D[Deployment]
    D --> F[Citizen Feedback]
    F --> G[Government Impact Dashboard]
~~~

---

## Technical Architecture

~~~mermaid
flowchart TB
    subgraph USERS[Stakeholders]
        C[Citizen]
        GOV[Government]
        HEI[University / HEI]
        IND[Industry / Startup / MSME]
        NGO[NGO / CSR / Research]
    end

    subgraph UI[SahYog Next.js Application]
        HOME[Home / Explore]
        REPORT[Report Workflow]
        TRACK[Track Challenge]
        DETAIL[Challenge Details]
        AUTH[Login / Signup]
        ADMIN[Government Control Center]
    end

    subgraph LOGIC[Application Logic]
        API[Next.js Route Handlers]
        CLASS[Classification & Domain Engine]
        IMPACT[Impact / Severity Engine]
        MATCH[Organization Matching]
        NOTIF[Notifications]
    end

    subgraph DATA[Persistence]
        DB[(Supabase PostgreSQL)]
        STORAGE[(Supabase Storage)]
        CACHE[(Local JSON Prototype Cache)]
    end

    C --> REPORT
    C --> TRACK
    GOV --> ADMIN
    HEI --> DETAIL
    IND --> DETAIL
    NGO --> DETAIL

    REPORT --> API
    TRACK --> API
    DETAIL --> API
    AUTH --> API
    ADMIN --> API

    API --> CLASS
    API --> IMPACT
    API --> MATCH
    API --> NOTIF

    API --> DB
    API --> STORAGE
    API -. prototype fallback .-> CACHE
~~~

### Architecture principle

> **Structured logic decides; the interface explains.**

The current prototype is intentionally transparent about its intelligence layer. Classification and matching are represented as prototype/deterministic logic where applicable; the application does not claim production computer-vision accuracy that is not implemented.

---

## Reporting Workflow

The reporting workflow is evidence-first and domain-aware.

~~~mermaid
flowchart LR
    A[Evidence] --> B[Validation]
    B --> C[Location]
    C --> D[Duplicate Check]
    D --> E[Classification]
    E --> F[Impact Questions]
    F --> G[Suggested Severity / Priority]
    G --> H[Prefilled Challenge]
    H --> I[User Review]
    I --> J[Submit]
~~~

### Evidence validation states

The prototype handles:

- valid evidence
- selfie/personal image
- non-civic/random image
- low-quality/invalid image
- uncertain evidence

Without a genuine vision model, the prototype does not pretend that arbitrary pixels were classified by computer vision. Filename/evidence metadata heuristics and manual category selection are used where applicable.

---

## Domain-Aware Impact Assessment

Impact questions are centrally configured in:

<code>src/lib/impactQuestions.ts</code>

The system supports domains including:

- Education
- Healthcare
- Agriculture
- Water Resources
- Sanitation & Solid Waste
- Environment
- Energy
- Urban / Road Infrastructure
- Accessibility
- Public Administration
- Rural Livelihoods
- Rural Development / Connectivity
- Other Societal Challenges

~~~mermaid
flowchart TD
    E[Evidence] --> D[Selected / Suggested Domain]
    D --> Q[Domain-Specific Questions]
    Q --> F[Impact Factors]
    F --> S[Suggested Severity]
    F --> P[Suggested Priority]
    S --> R[User Review]
    P --> R
    R --> SUB[Final Submission]
~~~

Severity is a **suggestion** that the user can review and override.

---

## Required Expertise & Smart Matching

The domain engine can extract prototype expertise requirements such as:

- IoT & Embedded Systems
- Solar PV & Power Electronics
- Web / Mobile Software Development
- Applied Data Science & Machine Learning
- Materials Science
- Water Treatment & Chemical Engineering
- Community / Rural Management
- GIS & Spatial Mapping

The prototype matching model uses:

**Domain + Jurisdiction + Expertise + Capacity**

~~~mermaid
flowchart TD
    P[Validated Challenge] --> D[Domain]
    P --> J[Jurisdiction]
    P --> E[Required Expertise]
    P --> C[Capacity Requirement]

    D --> S[Prototype Weighted Match]
    J --> S
    E --> S
    C --> S

    S --> H[HEI Candidates]
    S --> I[Industry / Startup Candidates]
    S --> N[NGO / CSR / Research Candidates]

    H --> G[Government Review / Assignment]
    I --> G
    N --> G
~~~

The matching score is explicitly a **prototype weighted score**, not a claim of a production-trained recommendation model.

---

## Government of Jharkhand Control Center

The Government Control Center provides a central administrative view of the innovation ecosystem.

### Current areas

- **Overview**
- **Challenges**
- **Institutions**
- **Industry & Partners**
- **Users**

### Dashboard information

- Total challenges
- Pending review
- Active projects
- Resolved challenges
- Universities
- Industry partners
- Solution proposals
- Challenge status distribution
- Domain distribution
- District distribution

The protected admin API also supports challenge status/severity updates.

### Admin authorization

Administrative access requires:

1. authenticated Supabase session
2. matching <code>profiles</code> record
3. <code>profiles.role = 'admin'</code>
4. server-side service-role access for administrative operations

The Supabase service-role key must never be exposed to the browser.

---

## Collaboration & Solution Lifecycle

~~~mermaid
flowchart TD
    A[Validated Challenge] --> B[Government / System Matching]
    B --> C[Institutional Assignment]
    C --> D[Multidisciplinary Team]
    D --> E[Solution Proposal]
    E --> F[Research / Prototype]
    F --> G[Testing]
    G --> H[Field Pilot]
    H --> I[Deployment]
    I --> J[Impact Measurement]
    J --> K[Citizen Verification]
~~~

The data model supports concepts including:

- faculty mentors
- student teams
- external advisors
- milestones
- industry partnerships
- mentoring/funding/prototyping/testing/pilot support
- impact metrics
- lifecycle updates
- citizen verification

---

## Citizen Verification

SahYog does not treat deployment as the end of the process.

After deployment:

**Resolved → Citizen Verified**

If the community reports that the issue is not actually resolved, the challenge can be reopened.

~~~text
Challenge
   ↓
Government / HEI / Industry Action
   ↓
Deployment
   ↓
Community Feedback
   ↓
Verified Impact OR Reopened Challenge
~~~

---

## Database Architecture

SahYog uses a general-purpose relational model rather than creating a separate table for every problem domain.

~~~mermaid
erDiagram
    PROFILES ||--o{ PROBLEMS : reports
    ORGANIZATIONS ||--o{ PROFILES : contains
    PROBLEMS ||--o{ PROBLEM_EVIDENCE : has
    PROBLEMS ||--o{ PROBLEM_CLASSIFICATIONS : classified_as
    PROBLEMS ||--o{ SEVERITY_ASSESSMENTS : assessed_by
    PROBLEMS ||--o{ SOLVER_MATCHES : matched_to
    PROBLEMS ||--o{ COLLABORATIONS : enables
    PROBLEMS ||--o{ SOLUTIONS : produces
    PROBLEMS ||--o{ PROBLEM_UPDATES : tracks
    PROBLEMS ||--o{ VERIFICATIONS : verified_by
    ORGANIZATIONS ||--o{ SOLVER_MATCHES : receives
    ORGANIZATIONS ||--o{ COLLABORATIONS : joins
~~~

Core entities include:

- <code>profiles</code>
- <code>organizations</code>
- <code>problems</code>
- <code>problem_evidence</code>
- <code>problem_classifications</code>
- <code>severity_assessments</code>
- <code>solver_matches</code>
- <code>collaborations</code>
- <code>solutions</code>
- <code>problem_updates</code>
- <code>verifications</code>
- <code>notifications</code>

---

## Technology Stack

### Frontend

- Next.js 16
- React 19
- TypeScript 5
- Responsive web UI
- CSS / component-level styling

### Backend

- Next.js Route Handlers
- TypeScript server logic
- Supabase client/server integration
- Server-side admin authorization

### Database & Storage

- Supabase PostgreSQL
- Supabase Authentication
- Supabase Storage
- Existing local JSON prototype fallback/cache

### Intelligence / Domain Logic

- Prototype rule-based classification
- Domain-aware impact assessment
- Severity and priority heuristics
- Required-expertise extraction
- Prototype weighted organization matching
- Duplicate-detection workflow

### Utilities

- <code>exifr</code> for EXIF metadata extraction
- Browser Geolocation API
- Next.js App Router

---

## Repository Structure

~~~text
SIH-SahYog/
├── public/
│   ├── logo.png
│   ├── logo-mark.png
│   └── demo/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   ├── classify/
│   │   │   ├── collaborations/
│   │   │   ├── dashboard/
│   │   │   ├── government/
│   │   │   ├── notifications/
│   │   │   ├── problems/
│   │   │   ├── solutions/
│   │   │   ├── upload/
│   │   │   └── verifications/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── report/
│   │   └── page.tsx
│   ├── components/
│   │   ├── modals/
│   │   └── views/
│   ├── lib/
│   │   ├── auth/
│   │   ├── server/
│   │   ├── supabase/
│   │   ├── classifier.ts
│   │   ├── constants.ts
│   │   ├── impactQuestions.ts
│   │   └── types.ts
│   └── store/
├── supabase/
│   ├── migrations/
│   └── storage_setup.sql
├── data/
├── .env.example
├── package.json
└── README.md
~~~

---

## Local Development

### Prerequisites

- Node.js
- npm
- Supabase project for persistent authentication/database functionality

### Clone

~~~bash
git clone https://github.com/Talha-212/SIH-SahYog.git
cd SIH-SahYog
~~~

### Install

~~~bash
npm install
~~~

### Environment

Create <code>.env.local</code> using <code>.env.example</code>:

~~~env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=sahyog-evidence

# Server-only — never expose or commit this value
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
~~~

**Important:** the current browser client expects <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Do not rename it to <code>SUPABASE_ANON_KEY</code> without changing the application code.

### Run

~~~bash
npm run dev
~~~

Open <code>http://localhost:3000</code>.

### Build

~~~bash
npm run build
npm run start
~~~

### Lint

~~~bash
npm run lint
~~~

---

## Supabase Setup

Database migrations are located in:

<code>supabase/migrations/</code>

The repository currently contains migrations covering project lifecycle, admin access and location verification.

Storage configuration:

<code>supabase/storage_setup.sql</code>

For deployment:

1. Configure the Supabase project.
2. Apply the repository migrations.
3. Configure Storage buckets and policies.
4. Configure authentication.
5. Ensure authenticated users have matching <code>profiles</code> rows.
6. Set the application role in <code>profiles</code>.
7. Use <code>role = 'admin'</code> for the Government Control Center.
8. Configure <code>SUPABASE_SERVICE_ROLE_KEY</code> only on the server/deployment environment.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---:|---|
| <code>NEXT_PUBLIC_SUPABASE_URL</code> | Yes | Supabase project URL |
| <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> | Yes | Browser Supabase client |
| <code>NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET</code> | Yes | Evidence storage bucket |
| <code>SUPABASE_SERVICE_ROLE_KEY</code> | Admin/server | Administrative server operations |

Never commit <code>.env.local</code> or the service-role key.

---

## Prototype Transparency

SahYog is an SIH 2026 prototype.

The current implementation deliberately distinguishes prototype logic from production AI:

- Classification method: <code>RULE_BASED_PROTOTYPE</code>
- Matching method: <code>PROTOTYPE_WEIGHTED_SCORE</code>

The project therefore does not claim production computer-vision accuracy or model confidence that is not actually implemented.

The architecture leaves room for future ML/NLP models without replacing the overall workflow.

---

## Example Journey

### Community water challenge

~~~text
Citizen identifies recurring drinking-water problem
                    ↓
Uploads field evidence + description
                    ↓
Confirms Jharkhand location
                    ↓
SahYog categorizes:
Water Resources & Quality
                    ↓
Impact assessment
                    ↓
Required expertise:
Water Treatment + Chemical Engineering
                    ↓
HEI / Industry / NGO matching
                    ↓
Government review and assignment
                    ↓
University multidisciplinary team
                    ↓
Industry / CSR support
                    ↓
Solution proposal
                    ↓
Prototype → Pilot → Deployment
                    ↓
Citizen verification
                    ↓
Government impact monitoring
~~~

---

## Current Implementation Highlights

- Evidence-first societal challenge reporting
- Domain-aware impact questions
- Jharkhand location verification
- EXIF/device/map/manual location hierarchy
- Duplicate-detection workflow
- Prototype classification
- Required-expertise extraction
- Prototype weighted organization matching
- Government of Jharkhand Control Center
- Role-aware authentication
- Challenge lifecycle tracking
- University / industry / NGO collaboration model
- Solution proposal and lifecycle records
- Citizen verification and reopening
- Supabase PostgreSQL + Storage
- Notifications
- Responsive web interface

---

## Team

**Team:** Hackaholics  
**Institute:** Lord's Institute of Engineering and Technology  
**Event:** Smart India Hackathon 2026  
**Problem Statement:** SIH26043  
**Organization:** Government of Jharkhand

## Repository

https://github.com/Talha-212/SIH-SahYog

## Status

**SIH 2026 prototype / active development**

The repository contains production-oriented Supabase integration together with prototype/demo infrastructure. Production deployment would require further hardening of RLS/storage policies, organization onboarding, operational governance and production ML components.

---

## License

Developed as a Smart India Hackathon 2026 prototype by Team Hackaholics.
