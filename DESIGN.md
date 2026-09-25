# Dental Hospital Management System — System Design

Status: Design phase (no implementation yet). Stack: React + Bootstrap 5 (frontend), Node.js/Express (backend), MongoDB (database), JWT + bcrypt (auth), AI Assistant with voice + multilingual support.

---

## 1. Complete System Architecture

### 1.1 High-level view

```
                        ┌───────────────────────────────────────────┐
                        │              CLIENT (Browser)              │
                        │   React SPA + React Router + Bootstrap 5   │
                        │  ┌───────────┐ ┌───────────┐ ┌───────────┐ │
                        │  │  Admin    │ │  Doctor   │ │  Patient  │ │
                        │  │  Portal   │ │  Portal   │ │  Portal / │ │
                        │  │           │ │           │ │AI Assistant│ │
                        │  └───────────┘ └───────────┘ └───────────┘ │
                        └───────────────────┬───────────────────────┘
                                            │ Axios (HTTPS, JWT in header)
                                            ▼
                        ┌───────────────────────────────────────────┐
                        │           EXPRESS.JS API GATEWAY           │
                        │  ┌─────────────────────────────────────┐  │
                        │  │  Middleware: helmet, cors, rate-limit,│  │
                        │  │  JWT verify, role guard, validator    │  │
                        │  └─────────────────────────────────────┘  │
                        │  ┌───────────┐ ┌───────────┐ ┌───────────┐ │
                        │  │  Auth     │ │  Core      │ │  AI Proxy │ │
                        │  │  Module   │ │  Domain    │ │  Module   │ │
                        │  │           │ │  Modules   │ │ (function-│ │
                        │  │           │ │ (patients, │ │  calling  │ │
                        │  │           │ │  doctors,  │ │  gateway) │ │
                        │  │           │ │  appts,    │ │           │ │
                        │  │           │ │  records)  │ │           │ │
                        │  └───────────┘ └───────────┘ └─────┬─────┘ │
                        └────────────────────┬─────────────────┼─────┘
                                             │                 │
                        ┌────────────────────▼───┐   ┌─────────▼─────────┐
                        │       MongoDB           │   │  LLM Provider API  │
                        │  (Mongoose ODM)         │   │  (text generation) │
                        │  Users, Patients,       │   │  + STT/TTS provider│
                        │  Doctors, Appointments, │   │  (or browser Web   │
                        │  DentalRecords,         │   │   Speech API)      │
                        │  Prescriptions,         │   └────────────────────┘
                        │  KnowledgeBase, ChatLogs│
                        └─────────────────────────┘
```

### 1.2 Key architectural principles

- **Layered backend**: routes → controllers → services → models. Controllers never touch Mongoose directly; services encapsulate business logic so the AI module and REST routes reuse the same service layer.
- **AI never touches the database.** The AI module only calls internal *service functions* (the same ones controllers call) through a constrained "tool" interface. This is enforced structurally, not just by convention (see §7).
- **Stateless API**: JWT-based auth, no server sessions. Horizontally scalable.
- **Single MongoDB, multiple logical collections**, not microservices — appropriate for a college-scale project, but modularized so it could be split later.
- **Voice and multilingual concerns live entirely at the edges** (browser + a thin backend text-processing layer), not baked into core domain logic.

---

## 2. Module List

**Backend modules (each = routes + controller + service + model, where applicable):**

1. `auth` — login, token issue/refresh, password hashing, role management
2. `users` — shared user identity for Admin/Doctor accounts
3. `doctors` — doctor CRUD, specialization, availability/schedule
4. `patients` — patient records CRUD, demographics, medical history
5. `appointments` — booking, status lifecycle, slot availability
6. `dentalRecords` — diagnoses, treatments, clinical notes, attachments (X-ray refs)
7. `prescriptions` — medicines, dosage, linked to a dental record/appointment
8. `reports` — aggregated statistics for admin dashboard
9. `aiAssistant` — chat orchestration, context/session memory, tool-calling gateway
10. `knowledgeBase` — curated dental Q&A / facts used to ground AI answers
11. `voice` — speech-to-text ingestion endpoint, text-to-speech response endpoint (or pass-through config for client-side Web Speech API)
12. `i18n` — language detection & translation utilities used by AI module
13. `notifications` (optional/stretch) — appointment reminders
14. `audit` — login attempts, AI safety-flag logs, admin action logs

**Frontend modules (feature folders):**

1. `auth` (Login, role-based redirect)
2. `admin` (Dashboard, Doctors, Patients, Appointments, Records, Reports, Search)
3. `doctor` (Dashboard, Appointments, Patients, Patient History, Diagnosis/Notes, Prescriptions)
4. `patient` (public-facing landing, Appointment self-service, AI Assistant widget)
5. `assistant` (Chat UI, voice controls, language selector — shared component embeddable in patient area)
6. `shared` (Navbar, Sidebar, ProtectedRoute, Toast/Alerts, Loader, Pagination, Table)
7. `core` (Axios instance/interceptors, auth context, i18n context)

---

## 3. User Permissions

| Capability | Admin | Doctor | Patient (via AI/self-service, JWT-optional) |
|---|---|---|---|
| Login to portal | ✅ | ✅ | N/A (no portal login required; optional lightweight patient auth for booking) |
| View/manage doctors | ✅ Full CRUD | ❌ (view own profile only) | ❌ |
| View/manage patients | ✅ Full CRUD | ✅ View + view history (read-only demographic edit not allowed) | ✅ View/edit own profile only (if patient accounts exist) |
| Manage appointments (all) | ✅ Full CRUD | ✅ View own, update status | ✅ Create/view/cancel own only |
| Dental records | ✅ View all | ✅ Create/edit for own patients, view all history of own patients | ✅ View own only (read-only) |
| Prescriptions | ✅ View all | ✅ Create/edit for own patients | ✅ View own only |
| Reports/statistics | ✅ Full | ❌ | ❌ |
| Search/filter data | ✅ All entities | ✅ Scoped to own patients/appointments | ❌ |
| AI Assistant | ✅ (as admin, optional internal use) | ❌ (not a target use case) | ✅ Primary user |
| AI booking action | N/A | N/A | ✅ Only for authenticated patient, only via approved API calls |

**Role model**: `role ∈ {admin, doctor, patient}` stored on the `User` document. Patient portal accounts are optional/minimal — a patient can interact with the AI assistant anonymously for general questions, but must be authenticated (lightweight patient login/OTP) to book/view real appointments.

---

## 4. Complete Frontend Page List

**Public / Patient-facing**
- `/` — Landing page (hospital info, CTA to chat with AI / book appointment)
- `/assistant` — Full-page AI Assistant (chat + voice + language switch)
- `/patient/login` — Patient login/register (phone/email + OTP or password)
- `/patient/appointments` — Patient's own appointments (book/view/cancel)
- `/patient/appointments/new` — New appointment request form

**Auth (shared)**
- `/login` — Admin/Doctor login
- `/unauthorized` — 403 page
- `/404` — Not found

**Admin**
- `/admin/dashboard` — Stats overview (KPIs, charts)
- `/admin/doctors` — Doctor list (search/filter)
- `/admin/doctors/:id` — Doctor profile/edit
- `/admin/doctors/new` — Add doctor
- `/admin/patients` — Patient list (search/filter)
- `/admin/patients/:id` — Patient profile + full history
- `/admin/appointments` — Appointment list (filter by date/doctor/status)
- `/admin/appointments/:id` — Appointment detail
- `/admin/dental-records` — Records browser (search/filter)
- `/admin/reports` — Reports (appointments over time, revenue if tracked, doctor load, etc.)

**Doctor**
- `/doctor/dashboard` — Today's appointments, quick stats
- `/doctor/appointments` — Doctor's appointment list (filter by date/status)
- `/doctor/appointments/:id` — Appointment detail → update status
- `/doctor/patients` — List of patients doctor has treated
- `/doctor/patients/:id` — Patient history (records, prescriptions, past visits)
- `/doctor/patients/:id/new-record` — Add diagnosis/clinical note + treatment
- `/doctor/patients/:id/new-prescription` — Add prescription

---

## 5. Complete Backend API List

Base path: `/api/v1`. All non-public routes require `Authorization: Bearer <JWT>`.

**Auth**
- `POST /auth/login` — admin/doctor login → `{ token, user }`
- `POST /auth/patient/request-otp` — patient login step 1
- `POST /auth/patient/verify-otp` — patient login step 2 → `{ token, patient }`
- `POST /auth/refresh` — refresh access token
- `POST /auth/logout` — invalidate refresh token
- `GET /auth/me` — current user profile

**Doctors** (admin only unless noted)
- `GET /doctors` — list (query: search, specialization, page, limit)
- `GET /doctors/:id`
- `POST /doctors`
- `PUT /doctors/:id`
- `DELETE /doctors/:id`
- `GET /doctors/:id/schedule` — availability slots (doctor or admin)
- `PUT /doctors/me/schedule` — doctor updates own availability

**Patients**
- `GET /patients` — admin: all; doctor: own-treated only (query params for search/filter)
- `GET /patients/:id`
- `POST /patients` — admin/doctor create (walk-in) or patient self-register
- `PUT /patients/:id` — admin full edit; patient self-edit limited fields
- `DELETE /patients/:id` — admin only

**Appointments**
- `GET /appointments` — role-scoped list (filters: date range, status, doctorId, patientId)
- `GET /appointments/:id`
- `POST /appointments` — patient/admin creates
- `PUT /appointments/:id/status` — doctor/admin updates (scheduled → confirmed → in-progress → completed/cancelled/no-show)
- `PUT /appointments/:id` — reschedule (admin/patient own)
- `DELETE /appointments/:id` — cancel
- `GET /appointments/available-slots` — query doctorId + date → free slots

**Dental Records**
- `GET /dental-records` — filters: patientId, doctorId, date range
- `GET /dental-records/:id`
- `POST /dental-records` — doctor only, linked to appointment + patient
- `PUT /dental-records/:id` — doctor (own) / admin

**Prescriptions**
- `GET /prescriptions` — filters: patientId, dentalRecordId
- `GET /prescriptions/:id`
- `POST /prescriptions` — doctor only
- `PUT /prescriptions/:id`

**Reports** (admin only)
- `GET /reports/overview` — counts: patients, doctors, appointments today/week/month
- `GET /reports/appointments-trend`
- `GET /reports/doctor-load`
- `GET /reports/patient-growth`

**AI Assistant**
- `POST /ai/chat` — body: `{ sessionId, message, language }` → `{ reply, detectedLanguage, actions? }`
- `GET /ai/chat/:sessionId/history`
- `DELETE /ai/chat/:sessionId` — clear conversation context
- `POST /ai/voice/transcribe` — audio blob → text (if not done client-side)
- `POST /ai/voice/synthesize` — text → audio (if not done client-side)
- Internal-only (not exposed to client, called by AI proxy module): `getMyAppointments(patientId)`, `getAvailableSlots(doctorId, date)`, `requestAppointment(patientId, payload)`, `getAppointmentStatus(appointmentId)` — these map 1:1 to functions in the `appointments` service layer.

**Knowledge Base** (admin curates content)
- `GET /knowledge-base` — list entries (admin)
- `POST /knowledge-base` — add entry (admin)
- `PUT /knowledge-base/:id`
- `DELETE /knowledge-base/:id`

---

## 6. Database Collections and Fields

MongoDB, Mongoose schemas.

**users** (admin & doctor login identity)
```
_id, name, email (unique), passwordHash, role: 'admin'|'doctor',
phone, isActive, createdAt, updatedAt
```

**doctors** (linked 1:1 to a users doc with role=doctor)
```
_id, userId (ref users), name, specialization, qualifications[],
experienceYears, phone, email, availability: [{ dayOfWeek, startTime, endTime, slotDurationMins }],
isActive, createdAt, updatedAt
```

**patients**
```
_id, name, dob, gender, phone (unique), email, address,
medicalHistory: { allergies[], conditions[], notes },
authAccountId (ref users/patientAuth, optional if self-registered),
createdAt, updatedAt
```

**appointments**
```
_id, patientId (ref patients), doctorId (ref doctors),
date, startTime, endTime,
status: 'requested'|'scheduled'|'confirmed'|'in-progress'|'completed'|'cancelled'|'no-show',
reasonForVisit, createdBy: 'patient'|'admin'|'ai',
notes, createdAt, updatedAt
```

**dentalRecords**
```
_id, patientId (ref patients), doctorId (ref doctors), appointmentId (ref appointments),
visitDate, chiefComplaint, diagnosis, clinicalNotes,
treatmentPerformed, toothChart: [{ toothNumber, condition, procedure }],
attachments: [{ fileUrl, type, uploadedAt }],
createdAt, updatedAt
```

**prescriptions**
```
_id, dentalRecordId (ref dentalRecords), patientId (ref patients), doctorId (ref doctors),
medicines: [{ name, dosage, frequency, durationDays, instructions }],
issuedDate, createdAt, updatedAt
```

**knowledgeBaseEntries** (controlled AI grounding source)
```
_id, topic, question, answer, category: 'general'|'procedure'|'hygiene'|'emergency'|'faq',
language, tags[], isUrgentTopic: boolean, sourceVerifiedBy, createdAt, updatedAt
```

**chatSessions**
```
_id, patientId (ref patients, nullable for anonymous), startedAt, lastActiveAt,
language, messages: [{ role: 'user'|'assistant', content, timestamp, flagged: boolean }],
status: 'active'|'closed'
```

**auditLogs**
```
_id, actorType: 'user'|'ai'|'system', actorId, action, targetType, targetId,
metadata, timestamp
```

**refreshTokens** (or use rotating JWT with short expiry + this collection)
```
_id, userId/patientId, tokenHash, expiresAt, revoked, createdAt
```

Indexes: `patients.phone` unique, `appointments (doctorId, date, startTime)` compound for slot lookups, `dentalRecords.patientId`, `chatSessions.patientId`, text index on `knowledgeBaseEntries.question/answer` for retrieval.

---

## 7. AI Architecture

### 7.1 Goals
- Answer general dental questions safely and helpfully.
- Never claim to diagnose or autonomously prescribe.
- Ground answers in a controlled knowledge base rather than open-ended model knowledge alone.
- Take real actions (check/book appointments) only through backend service functions, never direct DB access.

### 7.2 Request flow

```
Client → POST /ai/chat { sessionId, message, language }
   │
   ▼
AI Controller
   │  1. Load/create ChatSession (context memory)
   │  2. Language detect/normalize (if not provided)
   │  3. Retrieval step: query knowledgeBaseEntries (text search / embedding
   │     similarity) for top-k relevant entries in that language
   │  4. Build prompt: [system safety prompt] + [retrieved KB context] +
   │     [conversation history, trimmed to token budget] + [user message]
   │  5. Send to LLM provider
   │  6. If LLM response requests an action (function-calling / tool-call
   │     format, e.g. "check_appointment_status"), the AI module validates
   │     the caller is authenticated & authorized for that patientId, then
   │     invokes the corresponding SERVICE FUNCTION (not a raw DB query) and
   │     feeds the result back to the LLM for a final natural-language reply
   │  7. Safety filter pass on the reply (urgent-symptom keyword/intent
   │     check, disclaimer injection)
   │  8. Persist turn to ChatSession.messages
   │  9. Return { reply, detectedLanguage }
```

### 7.3 "AI cannot touch the database" — enforcement

- The AI module is a Node module (`aiAssistant/tools.js`) whose only exports are a **fixed whitelist of wrapper functions**: `getMyAppointments`, `getAvailableSlots`, `requestAppointment`, `getAppointmentStatus`.
- Each wrapper internally calls the exact same service function (`appointmentService.*`) used by the REST controllers — it imports the service layer, never a Mongoose model directly.
- The LLM never receives DB credentials, schema details, or query capability — it only receives a JSON tool-call schema describing these 4 functions with primitive-typed arguments.
- Every wrapper re-checks `req.user`/session identity server-side before executing — the LLM cannot impersonate another patient by asking for a different `patientId`; the patientId is always injected from the authenticated session, never taken from the LLM's output.

### 7.4 Controlled knowledge base (RAG-lite)

- `knowledgeBaseEntries` collection is admin-curated (dentists/admin review content before publishing).
- Retrieval: start simple — MongoDB text index search on question/answer/tags; can upgrade later to vector embeddings + a vector index (e.g., Atlas Vector Search) without changing the API contract.
- System prompt instructs the LLM: *"Answer using the provided context. If context is insufficient, give general safe educational info and recommend professional consultation. Never state a definitive diagnosis. Never say you are prescribing medication."*

### 7.5 Safety layer

- **Urgent-symptom detector**: keyword/pattern list (severe pain, swelling, trauma, bleeding, "knocked out tooth", fever) plus LLM-based intent classification → if triggered, response is forced to include an urgent-care recommendation regardless of what the LLM generated.
- **Disclaimer injection**: every assistant response in a clinical-topic category appends "This is general information, not a diagnosis — please consult a dentist for personalized care."
- **Output moderation**: reject/regenerate if response contains a definitive diagnosis phrase pattern or a specific drug+dosage recommendation not sourced from the knowledge base.
- All flagged interactions logged to `auditLogs` for admin review.

### 7.6 Conversation memory

- Session-scoped only (`chatSessions.messages`), trimmed/summarized when exceeding a token budget (simple rolling window + optional summarization of older turns).
- No cross-session long-term memory in v1 (keeps privacy scope simple for a college project); flagged as a future extension point.

---

## 8. Voice Architecture

```
Patient presses mic button (React)
   → Browser captures audio (MediaRecorder API or Web Speech API SpeechRecognition)
   → OPTION A (simpler, recommended for college project):
       Browser's built-in Web Speech API does STT in-browser → text sent to
       /ai/chat as normal text message with detected language tag
   → OPTION B (more "real" pipeline, if time allows):
       Audio blob → POST /ai/voice/transcribe → backend calls a cloud
       STT provider → returns transcript + detected language
   → Transcript → AI processing (§7 flow) → text reply
   → OPTION A: Browser's SpeechSynthesis API speaks the reply directly (TTS
       fully client-side, zero backend cost)
   → OPTION B: POST /ai/voice/synthesize → backend calls cloud TTS provider
       → audio stream returned → played by <audio> element
```

- **Recommended default**: client-side Web Speech API for both STT and TTS (free, no extra backend infra, works well for a demo). Backend endpoints (`/ai/voice/transcribe`, `/ai/voice/synthesize`) are designed as an optional swap-in for languages/browsers where Web Speech API support is weak (notably some Indian languages on certain browsers) — architecture supports either without changing the chat contract, since both paths converge on plain text in/out of `/ai/chat`.
- Voice UI states: idle → listening (waveform/pulse indicator) → processing → speaking, all handled in a single `VoiceButton` component with clear visual feedback.

---

## 9. Multilingual Architecture

- **Language list (v1)**: English, Hindi, Marathi, Gujarati, Tamil, Telugu, Bengali, Kannada, Malayalam, Punjabi.
- **Two independent multilingual layers**, kept separate so each can evolve independently:
  1. **UI chrome i18n** (static labels/buttons/menus) — `react-i18next` with per-language JSON resource files under `frontend/src/locales/<lang>/translation.json`. Adding a language later = adding one JSON file + one entry in a language config array.
  2. **AI conversation language** — handled dynamically per message:
     - Client sends the selected language (from a language switcher) or omits it and the backend auto-detects from the message text.
     - `knowledgeBaseEntries` are stored per-language (or in English + machine/human-translated on demand) — retrieval prefers same-language entries, falls back to English + LLM translation of the final answer.
     - System prompt instructs the LLM to reply in the requested/detected language.
- **Adding a new language later** requires: (a) a new locale JSON for UI strings, (b) adding the language code to a central `SUPPORTED_LANGUAGES` config used by both frontend selector and backend validation, (c) optionally seeding knowledge-base translations — no code architecture changes needed.

---

## 10. Security Architecture

- **Password storage**: bcrypt (cost factor ≥ 10) for admin/doctor passwords; patient auth uses OTP (no password) to reduce attack surface, or bcrypt if password-based patient accounts are added later.
- **JWT**: short-lived access token (e.g., 15 min) + longer-lived refresh token stored hashed in `refreshTokens` collection, rotated on use. Access token carries `{ userId/patientId, role }` only — no sensitive data.
- **Role-based access control (RBAC)**: Express middleware `requireRole('admin'|'doctor'|'patient')` guards every route; ownership checks (e.g., doctor can only edit their own patients' records) enforced in the service layer, not just the route.
- **Input validation**: `express-validator` / `zod` schemas on every POST/PUT body; Mongoose schema-level validation as second layer.
- **Transport**: HTTPS enforced in production; `helmet` for security headers; `cors` restricted to known frontend origin(s).
- **Rate limiting**: `express-rate-limit` on `/auth/*` and `/ai/chat` to prevent brute force and AI cost abuse.
- **Secrets**: all credentials (Mongo URI, JWT secret, LLM API key, STT/TTS keys) in `.env`, never committed; `.env.example` checked in instead.
- **AI-specific security**: prompt-injection resistance (system prompt is not user-overridable; user input is always treated as data, never as new instructions to the tool-calling layer); the 4-function whitelist (§7.3) is the primary defense against the AI reaching arbitrary data.
- **NoSQL injection**: Mongoose parameterized queries only; never build queries from raw string concatenation of user input.
- **Audit logging**: every admin action, every AI tool-call invocation, and every failed login attempt logged with timestamp/actor.
- **File uploads** (X-ray attachments, if implemented): type/size validation, stored outside web-root or in cloud storage (e.g., S3-compatible), never executed.

---

## 11. Folder Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── config/            # db.js, env.js, constants.js
│   │   ├── middleware/        # auth.js, roleGuard.js, errorHandler.js, rateLimiter.js
│   │   ├── models/            # User.js, Doctor.js, Patient.js, Appointment.js,
│   │   │                      # DentalRecord.js, Prescription.js, KnowledgeBaseEntry.js,
│   │   │                      # ChatSession.js, AuditLog.js, RefreshToken.js
│   │   ├── modules/
│   │   │   ├── auth/          # auth.routes.js, auth.controller.js, auth.service.js
│   │   │   ├── doctors/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── dentalRecords/
│   │   │   ├── prescriptions/
│   │   │   ├── reports/
│   │   │   ├── knowledgeBase/
│   │   │   └── aiAssistant/
│   │   │       ├── ai.routes.js
│   │   │       ├── ai.controller.js
│   │   │       ├── ai.service.js        # prompt building, LLM call, safety filters
│   │   │       ├── ai.tools.js          # the whitelisted function-calling wrappers
│   │   │       ├── voice.routes.js
│   │   │       └── i18n.service.js
│   │   ├── utils/              # logger.js, tokenUtils.js, responseFormatter.js
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                # axios instance + one file per resource (doctors.api.js, ...)
│   │   ├── context/             # AuthContext.jsx, LanguageContext.jsx
│   │   ├── components/
│   │   │   ├── shared/          # Navbar, Sidebar, ProtectedRoute, Loader, DataTable
│   │   │   └── assistant/       # ChatWindow, MessageBubble, VoiceButton, LanguageSelector
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── doctor/
│   │   │   └── patient/
│   │   ├── locales/             # en/, hi/, mr/, gu/, ta/, te/, bn/, kn/, ml/, pa/
│   │   ├── routes/               # AppRoutes.jsx (React Router config)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── docs/                        # this design doc, API docs
└── README.md
```

---

## 12. Development Phases

**Phase 0 — Setup**: repo, folder scaffolding, env config, MongoDB connection, base Express app, base React app with routing.

**Phase 1 — Core auth & RBAC**: User/Doctor/Patient models, `/auth` endpoints, JWT middleware, role guards, Login pages, ProtectedRoute, AuthContext.

**Phase 2 — Admin & Doctor core CRUD**: Doctors, Patients, Appointments modules (backend + frontend pages), dashboard shells.

**Phase 3 — Clinical workflow**: Dental Records, Prescriptions modules, appointment status lifecycle, doctor patient-history views.

**Phase 4 — Reports & search/filter**: aggregation endpoints, admin reports page, global search/filter UI across entities.

**Phase 5 — AI Assistant (text only)**: KnowledgeBaseEntry model + admin CMS for it, `/ai/chat` with retrieval + safety layer, ChatWindow UI, session memory.

**Phase 6 — AI action integration**: the 4 whitelisted tool functions, authenticated patient appointment check/booking via chat.

**Phase 7 — Voice**: mic button, Web Speech API STT/TTS integration, voice UI states.

**Phase 8 — Multilingual**: i18next setup + locale files, language selector, AI language detection/response-language handling, KB translations.

**Phase 9 — Security hardening & polish**: rate limiting, helmet, audit logging, input validation sweep, responsive/Bootstrap polish, loading/error states.

**Phase 10 — Testing, deployment, documentation.**

---

## 13. Testing Strategy

- **Backend unit tests** (Jest/Mocha + Supertest): service-layer functions (business logic, especially the AI tool wrappers and RBAC ownership checks), auth token generation/validation, password hashing.
- **Backend integration tests**: hit real routes against a test MongoDB (in-memory Mongo via `mongodb-memory-server`) — auth flow, CRUD flows per role, appointment slot conflict logic, AI safety-filter triggering on urgent keywords.
- **Frontend unit tests** (Vitest/Jest + React Testing Library): components (LoginForm, ChatWindow, VoiceButton state transitions), context providers.
- **Frontend integration/E2E** (Cypress or Playwright): critical user journeys — admin login → add doctor → book appointment → doctor completes visit → admin sees it in reports; patient chats with AI → asks urgent symptom → gets urgent-care disclaimer; patient books appointment via AI chat end-to-end.
- **AI-specific testing**: a fixed test-prompt suite asserting (a) no diagnosis-claim phrases appear, (b) urgent keywords always trigger the disclaimer, (c) tool-calls never leak another patient's data, (d) responses in each supported language are non-empty and use the requested language.
- **Manual QA checklist**: cross-browser Web Speech API behavior (Chrome primary target — Safari/Firefox support is inconsistent), mobile responsiveness, role-based route protection (attempt to access admin routes as doctor/patient).

---

## 14. Deployment Architecture

```
┌────────────────┐      ┌─────────────────────┐      ┌───────────────────┐
│   Frontend      │      │      Backend         │      │   MongoDB Atlas    │
│  (Vercel/       │─────▶│  (Render/Railway/    │─────▶│  (managed cluster) │
│   Netlify)      │ HTTPS│   Fly.io/EC2)        │      │                    │
│  React build    │      │  Node/Express API    │      └────────────────────┘
│  (static)       │      │  + PM2/containerized  │
└────────────────┘      │  Env vars via host    │      ┌────────────────────┐
                          │  secret manager       │─────▶│  LLM Provider API  │
                          └─────────────────────┘      │  + STT/TTS (if     │
                                                        │   server-side)     │
                                                        └────────────────────┘
```

- **Frontend**: static build (`vite build`) deployed to Vercel/Netlify; environment-specific API base URL via `.env`.
- **Backend**: containerized (Dockerfile) or directly deployed to Render/Railway; `.env` holds `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `LLM_API_KEY`, `CORS_ORIGIN`, `NODE_ENV`.
- **Database**: MongoDB Atlas free/shared tier is sufficient for a college project; IP allowlist + database user with least-privilege access.
- **CI**: GitHub Actions — run backend/frontend test suites on PR; optional auto-deploy on merge to `main`.
- **Environments**: `development` (local), `staging` (optional), `production`. Separate `.env` per environment, separate Atlas database/cluster or at least separate DB name.
- **Monitoring/logging**: basic request logging (`morgan`) + centralized error logging; audit log collection doubles as a lightweight security monitor for the AI module.

---

## Open decisions to confirm before implementation

1. **Patient authentication**: OTP-based (needs SMS/email provider) vs. simple password-based patient accounts — affects Phase 1/6 scope and adds a third auth flow.
2. **LLM provider**: which API (affects `ai.service.js` implementation and cost/key setup) — to be decided in Phase 5, not blocking earlier phases.
3. **STT/TTS**: client-side Web Speech API only (recommended, zero extra cost/infra) vs. adding server-side cloud STT/TTS for broader language/browser coverage.
4. **File/X-ray attachment storage**: local disk (fine for a college demo) vs. cloud object storage.

These don't block starting Phase 0–4; they need answers before Phase 5–7.
