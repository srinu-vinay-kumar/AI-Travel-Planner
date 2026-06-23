# ✈️ Trao AI Travel Planner

A secure, multi-user AI-powered travel itinerary generator. Tell the AI your destination, trip length, budget, and interests — it hands you a structured day-by-day itinerary, hotel recommendations, a cost breakdown, and a smart packing checklist.

---

## 📑 Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack & Justification](#tech-stack--justification)
- [Setup Instructions](#setup-instructions)
- [High-Level Architecture](#high-level-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [AI Agent Design & Purpose](#ai-agent-design--purpose)
- [Creative Feature: Weather-Aware Packing Assistant](#creative-feature-weather-aware-packing-assistant)
- [Key Design Decisions & Trade-offs](#key-design-decisions--trade-offs)
- [Known Limitations](#known-limitations)

---

## Project Overview

Trao is a full-stack web application where authenticated users can:

- Register and log in to a personal dashboard
- Submit travel preferences (destination, days, budget, interests)
- Receive a complete AI-generated itinerary with per-day activities
- View hotel suggestions and a full estimated cost breakdown
- Modify itineraries in real time — add activities, remove activities, or regenerate a specific day with custom feedback
- Use an AI-generated, interactive packing checklist tailored to their destination and planned activities

All data is strictly user-isolated — no user can view or modify another user's trips.

---

## Tech Stack & Justification

### Frontend

| Tool                      | Version      | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vite + React**          | React 19     | Chosen over Next.js because of strong existing familiarity with the Vite/React workflow. Next.js was listed as preferred in the spec, but the assessment explicitly states stack changes are acceptable with justification. Shipping a working, well-structured app in a known toolchain outweighs the marginal benefit of using an unfamiliar one under time pressure.                                                                                                               |
| **TypeScript**            | ~6.0         | Chosen over JavaScript for type safety across the frontend. TypeScript catches interface mismatches at compile time — particularly valuable when the shape of AI-generated JSON responses must match your database schema and React component props.                                                                                                                                                                                                                                  |
| **React Hook Form + Zod** | RHF 7, Zod 4 | Declarative, schema-driven form validation. Zod schemas act as the single source of truth for both input shape and validation messages, keeping form logic lean and readable.                                                                                                                                                                                                                                                                                                         |
| **Axios**                 | 1.18         | Centralized HTTP client with a pre-configured base URL and `withCredentials: true` — ensures auth cookies are automatically attached to every request without repeating configuration at each call site.                                                                                                                                                                                                                                                                              |
| **React Hot Toast**       | 2.6          | Lightweight toast notification library for non-blocking user feedback on async operations.                                                                                                                                                                                                                                                                                                                                                                                            |
| **SASS**                  | 1.101        | Chosen over Tailwind CSS because of existing comfort with component-scoped stylesheets and the BEM naming convention. SASS allows writing structured, maintainable CSS with variables, nesting, and mixins — without coupling style decisions to markup via utility classes. For a project where the UI is built from scratch rather than assembled from pre-built components, SASS gives full visual control without the learning curve of memorising Tailwind's utility vocabulary. |

### Backend

| Tool                   | Version    | Reason                                                                                                                                                                                                         |
| ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Node.js + Express**  | Express 5  | Lightweight, minimal REST API layer. Express 5 ships with native async error handling, reducing the boilerplate needed around each route.                                                                      |
| **MongoDB + Mongoose** | Mongoose 9 | Document-oriented storage maps naturally to the nested JSON structure returned by the AI (itinerary days → activities arrays). Mongoose schemas add a validation layer between raw AI output and the database. |
| **bcrypt**             | 6.0        | Industry-standard password hashing with configurable salt rounds.                                                                                                                                              |
| **jsonwebtoken**       | 9.0        | Stateless session tokens — no server-side session store required.                                                                                                                                              |
| **cookie-parser**      | 1.4        | Parses incoming cookies from request headers, enabling the auth middleware to read the JWT from `req.cookies`.                                                                                                 |

### AI

| Tool                             | Reason                                                                                                                                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Gemini 2.5 Flash Lite** | Fast, cost-efficient LLM with reliable structured JSON output when paired with `responseMimeType: "application/json"`. Used for itinerary generation, day regeneration, and packing list creation. |

---

## Setup Instructions

### Prerequisites

- Node.js 18.x or 20.x (LTS)
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
- A free [Google AI Studio](https://aistudio.google.com/) API key

---

### Local Development

#### 1. Clone the repository

```bash
git clone https://github.com/your-username/trao-ai-travel-planner.git  # replace with your repo URL
cd trao-ai-travel-planner
```

#### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
PORT=3000
MONGO_URL=mongodb+srv://<username>:<password>@cluster.mongodb.net/trao
JWT_TOKEN=your_super_secure_random_secret
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

Start the development server:

```bash
npm run dev
```

The API will be running at `http://localhost:3000`.

#### 3. Set up the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file in `/frontend`:

```env
VITE_API_URL=http://localhost:3000
```

Start the Vite dev server:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

---

### Deployed Version

| Layer    | Platform | URL                                                                                                |
| -------- | -------- | -------------------------------------------------------------------------------------------------- |
| Frontend | Vercel   | [https://ai-travel-planner-pi-brown.vercel.app](https://ai-travel-planner-pi-brown.vercel.app)     |
| Backend  | Render   | [https://ai-travel-planner-api-ytcy.onrender.com](https://ai-travel-planner-api-ytcy.onrender.com) |

#### Deploying the Backend (Render or Railway)

1. Push your code to GitHub (confirm `.env` is in `.gitignore`)
2. Create a new Web Service on [Render](https://render.com) and connect the repository
3. Set the root directory to `backend`
4. Set the start command to `node server.js`
5. Add the following environment variables in the Render dashboard:

```
PORT=3000
MONGO_URL=mongodb+srv://...
JWT_TOKEN=your_secret
GEMINI_API_KEY=your_key
NODE_ENV=production
```

#### Deploying the Frontend (Vercel)

1. Import the repository on [Vercel](https://vercel.com)
2. Set the root directory to `frontend`
3. Add the environment variable:

```
VITE_API_URL=https://ai-travel-planner-api-ytcy.onrender.com
```

4. Deploy. Vercel auto-detects Vite and configures the build.

> **Important:** After deploying, update your backend CORS config to allow your Vercel domain:
> ```javascript
> app.use(cors({ origin: "https://ai-travel-planner-pi-brown.vercel.app", credentials: true }));
> ```

---

## High-Level Architecture

```
┌──────────────────────────────────────────┐
│           React Client (Vite)            │
│  Auth Forms · Dashboard · Trip Editor   │
└───────────────┬──────────────▲───────────┘
                │              │
         Axios (cookies)   JSON response
                │              │
┌───────────────▼──────────────┴───────────┐
│           Express REST API               │
│  ┌───────────────────────────────────┐   │
│  │       Auth Middleware             │   │
│  │  Reads JWT from httpOnly cookie   │   │
│  │  Attaches req.user.id to request  │   │
│  └──────────────┬────────────────────┘   │
│                 │                        │
│       ┌─────────┴──────────┐             │
│       ▼                    ▼             │
│  /trips routes        /user routes       │
└───┬───────────┬────────────────────────┬─┘
    │           │                        │
    ▼           ▼                        ▼
Gemini AI    MongoDB Trips         MongoDB Users
(LLM gen)  (user-isolated)       (hashed passwords)
```

### Request Lifecycle

1. User submits a form on the React client
2. Axios sends the request with `withCredentials: true` (cookie included automatically)
3. The Express auth middleware reads the JWT from the `token` cookie, verifies it, and attaches `req.user` to the request object
4. The route handler performs a database query **always scoped to `userId: req.user.id`** — ensuring strict user isolation
5. For generation routes, the handler constructs a structured prompt, calls Gemini with exponential backoff retry logic, sanitizes the response, and saves it to MongoDB
6. The saved MongoDB document (with `_id` fields) is returned to the client

---

## Authentication & Authorization

### Approach

Authentication uses **JWT stored in an httpOnly cookie** rather than localStorage.

| Concern          | Decision                                                                              |
| ---------------- | ------------------------------------------------------------------------------------- |
| Token storage    | `httpOnly` cookie — inaccessible to JavaScript, preventing XSS token theft            |
| Token expiry     | 5 hours (`expiresIn: "5h"`)                                                           |
| Cookie flags     | `secure: true`, `sameSite: "none"` for cross-origin support between Vercel and Render |
| Password storage | `bcrypt.hash()` with 10 salt rounds — plaintext passwords never reach the database    |

### Auth Middleware

Every protected route passes through `protectedRoute` middleware, which:

1. Reads `req.cookies.token`
2. Returns `401` immediately if the cookie is absent or malformed
3. Verifies the JWT signature against `process.env.JWT_TOKEN`
4. Attaches the decoded payload (`{ id }`) to `req.user`

### User Isolation

Every MongoDB query on trip data includes both the document ID **and** the authenticated user's ID:

```javascript
Trip.findOne({ _id: tripId, userId: req.user.id })
```

This means even if a user guesses another trip's `_id`, the query returns nothing because the `userId` won't match.

---

## AI Agent Design & Purpose

### Purpose

The AI agent replaces the tedious manual work of travel research. Instead of spending hours assembling day plans, hotel comparisons, and budget estimates across multiple websites, the user provides four inputs and receives a complete, structured travel plan in seconds.

### Implementation

The agent is powered by **Google Gemini 2.5 Flash Lite** via direct REST API calls. Three distinct prompt operations exist:

| Operation           | Endpoint                        | What the AI does                                                                      |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| Generate trip       | `POST /trips/new-trip`          | Produces the full itinerary, hotel list, cost breakdown, and packing list in one call |
| Regenerate day      | `PUT /trips/:id/regenerate-day` | Replaces only the activities for a specific day based on user feedback                |
| (Packing assistant) | Included in trip generation     | Produces a categorized packing checklist based on destination and planned activities  |

### Prompt Engineering

- The prompt enforces a **strict JSON schema** in the instruction text
- `responseMimeType: "application/json"` is set in `generationConfig` to prevent the model from wrapping output in markdown code blocks
- A `sanitizeItinerary()` guard runs on every AI response before the data touches the database — it maps non-standard `timeOfDay` values (e.g. "Full Day", "Late Night") to valid schema enum values (`Morning`, `Afternoon`, `Evening`)

### Resilience

All Gemini calls use an **exponential backoff retry** helper (up to 5 retries: 1s → 2s → 4s → 8s → 16s) that specifically handles `429 Too Many Requests` responses. This shields the app from transient rate-limit failures without crashing the request.

---

## Creative Feature: Weather-Aware Packing Assistant

### What it is

Every generated trip includes an AI-produced **packing checklist** — not a generic list, but one tailored to the specific destination, the activities in the itinerary, and the likely regional climate for the travel period.

### What problem it solves

Travelers frequently pack wrong. A standard packing list doesn't know you're hiking in Hokkaido in November or attending a business conference in Singapore in July. This feature instructs the AI to act as a packing specialist with full context of the trip it just planned, producing a checklist divided into four categories:

| Category    | Examples                                 |
| ----------- | ---------------------------------------- |
| `Documents` | Passport, travel insurance, visa         |
| `Clothing`  | Waterproof jacket, formal wear, swimwear |
| `Gear`      | Hiking boots, power adapter, sunscreen   |
| `Other`     | Medication, local currency, transit card |

### How it works

The packing list is generated as part of the main trip generation prompt — no extra API call is made. The AI receives the full destination, duration, budget tier, and interests and uses that context to produce relevant suggestions.

### Interactivity

Each checklist item renders as a checkbox in the dashboard. Checking/unchecking an item sends a targeted `PATCH /trips/:id/toggle-packing` request that flips only `isPacked` on the specific subdocument — no regeneration, no data loss. The UI updates optimistically and reverts on failure.

---

## Key Design Decisions & Trade-offs

### 1. httpOnly Cookie vs. localStorage for JWT

**Decision:** httpOnly cookie.

**Trade-off:** Requires `credentials: true` on both the Axios client and the Express CORS config, and the `sameSite`/`secure` cookie flags must be identical between login and logout — a bug here causes silent logout failures. However, the security benefit (tokens are completely invisible to JavaScript and immune to XSS) justifies the configuration overhead.

### 2. Surgical PATCH endpoints instead of full PUT for edits

**Decision:** Dedicated `PATCH /:id/add-activity`, `PATCH /:id/remove-activity`, and `PATCH /:id/toggle-packing` endpoints.

**Trade-off:** More routes to maintain. The alternative — sending the full trip object to a single `PUT` endpoint — seems simpler but in this app `PUT /:id` calls Gemini, meaning toggling a checkbox would fire an AI generation request. Surgical endpoints keep mutations fast, cheap, and predictable.

### 3. Vite over Next.js

**Decision:** Vite + React SPA.

**Trade-off:** No server-side rendering or file-based routing. For an authenticated dashboard application where SEO is not a concern, these omissions are acceptable. The trade-off was made in favour of shipping a reliable, well-understood codebase within the assessment window.

### 4. AI response sanitization before DB write

**Decision:** Every AI-generated `timeOfDay` value is run through `sanitizeItinerary()` before reaching Mongoose.

**Trade-off:** Extra processing step per request. The alternative — trusting the AI to always follow the prompt — causes Mongoose `ValidationError` failures in production when the model returns values like `"Full Day"` or `"Late Morning"`. The guard costs almost nothing and eliminates an entire class of runtime errors.

### 5. Optimistic UI updates

**Decision:** Packing list and trip list update in local state immediately, before the API call resolves.

**Trade-off:** If the API call fails, a rollback to the server state is needed. This is handled by calling `fetchTrips()` in the `catch` block. The benefit is that the UI feels instant rather than waiting for a round-trip on every checkbox interaction.

---

## Known Limitations

- **No registration flow from the landing page.** Registration is only accessible via a modal on the Login page. A dedicated `/register` route would improve the UX.
- **Gemini response time varies.** Trip generation can take 5–15 seconds depending on the model's load. A streaming response or a progress indicator would improve the perceived performance.
- **Packing list is static after generation.** Users can check/uncheck items but cannot add or remove packing items manually — only regenerating the full trip produces a new list.
- **Cookie `sameSite: "none"` requires HTTPS in all environments.** Local development works because Vite and Express run on localhost, but any non-HTTPS staging environment will silently drop the cookie.
- **Single AI provider.** The app has no fallback if the Gemini API is unavailable beyond the exponential backoff retry. A secondary provider would improve resilience in production.