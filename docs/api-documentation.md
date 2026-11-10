# JanSahayak AI - API Documentation

## Base URLs
- Backend Core API: `http://localhost:5000/api`
- AI Microservice API: `http://localhost:8000/api/ai`

---

## 1. Authentication & Profile Endpoints
All authenticated endpoints require standard Supabase bearer token:
`Authorization: Bearer <supabase_access_token>`

- **GET `/api/profile`**  
  Returns the active profile along with verified role and department affiliation.
- **PATCH `/api/profile`**  
  Updates user metadata (e.g. phone number, full name, avatar).

---

## 2. Complaint Endpoints
- **POST `/api/complaints`**  
  Creates a new citizen complaint. Runs synchronous AI categorization preview and asynchronous duplicate scan.  
  *Payload:*
  ```json
  {
    "title": "Severe road cave-in on MG Road",
    "description": "A deep crater formed near Metro Pillar 42, posing fatal hazard for two-wheelers.",
    "category_id": "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04",
    "department_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
    "address": "Opposite Metro Pillar 42, MG Road",
    "city": "New Delhi",
    "pincode": "110001",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "preferred_language": "en"
  }
  ```
- **GET `/api/complaints`**  
  Returns paginated list of complaints filtered by user jurisdiction, status, priority, or search term.
- **GET `/api/complaints/:id`**  
  Returns detailed complaint info including assignments, AI prediction, history, and attachments.
- **PATCH `/api/complaints/:id/status`**  
  Allows authorized officers to update complaint status, append resolution notes, or upload proof.
- **POST `/api/complaints/:id/assign`**  
  Allows department admins to delegate complaints to specific field officers.
- **GET `/api/complaints/:id/history`**  
  Returns chronological timeline of all activities on the grievance.

---

## 3. Department & Category Endpoints
- **GET `/api/departments`** - List active departments and their default SLAs.
- **GET `/api/categories`** - List categories optionally filtered by `?department_id=...`.

---

## 4. AI Microservice Endpoints
- **POST `/api/ai/classify`**  
  Classifies grievance text into predicted category and department with confidence score.
- **POST `/api/ai/priority`**  
  Calculates recommended priority level (critical, high, medium, low) using impact & hazard assessment.
- **POST `/api/ai/duplicates`**  
  Scans recent complaints in the geographical vicinity and semantic embedding space.
- **POST `/api/ai/summarize`**  
  Generates executive grievance summary and suggested next actionable step.
- **GET `/api/ai/health`**  
  Health check returning active ML models, device type, and operational status.
