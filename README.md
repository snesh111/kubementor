# 🚀 KubeMentor: AI-Assisted DevOps Troubleshooting & Deployment Simulation Platform

KubeMentor is an enterprise-grade, clean architecture web application designed to help DevOps engineers and learners master Kubernetes manifest optimization, deployment quality scoring, interactive sandbox deployments, controlled failure scenario troubleshooting, telemetry-grounded AI mentoring, and deterministic solution validation.

---

## 🌟 Architecture & Workflow Overview

```text
                                 KUBEMENTOR ARCHITECTURE
                                            │
                                            ▼
                                     User Authentication
                                     (JWT + Bcrypt Hashing)
                                            │
                                            ▼
                                  Project Management & Files
                                 (.yaml, .yml, Dockerfile Validation)
                                            │
                                            ▼
                                 ┌─────────────────────────┐
                                 │   Deployment Analyzer   │
                                 └────────────┬────────────┘
                                              ▼
                                   Rule & Scoring Engine
                        (30% Sec, 30% Rel, 20% Perf, 20% BestPractices)
                                              │
                                              ▼
                                   Explainable Score Report
                                 (Deduction Audit + Before/After)
                                              │
                                              ▼
                                   Kubernetes Sandbox Engine
                            (@kubernetes/client-node Isolation)
                                              │
                                              ▼
                                    Failure Scenario Engine
                              (6 Controlled Failure Injectors)
                                              │
                                              ▼
                                    Real K8s Failure State
                                              │
                                              ▼
                                      Context Collector
                               (Sanitized Runtime Telemetry v1.0)
                                              │
                                              ▼
                                   Context-Aware AI Mentor
                           (Gemini 1.5 Flash + Grounded Fallback)
                                              │
                                              ▼
                                 Progressive Hint System (L1-L4)
                                              │
                                              ▼
                                      User Fixes Manifest
                                              │
                                              ▼
                                     Redeploy & Validate
                                              │
                                              ▼
                                  Real K8s Stabilization Check
                                              │
                                              ▼
                                      Solution Validator
                                  (PASS / FAIL / PARTIAL State)
```

---

## 📦 Implemented Modules Summary

1. **Module 1 - Authentication**: JWT authentication, bcrypt password hashing, user registration, profile management, and multi-tenant scoping.
2. **Module 2 - Project Management**: Multi-tenant project workspace CRUD with status tracking (`draft`, `analyzed`, `deployed`, `archived`).
3. **Module 3 - Project File Management**: File uploads, multi-document YAML parsing, Dockerfile `FROM` instruction check, 5 MB limits, code viewer, and replace/delete operations.
4. **Module 4 - Kubernetes Readiness Analyzer**: Deterministic rule engine evaluating security, reliability, performance, and best practices.
5. **Module 5 - Kubernetes Sandbox**: `@kubernetes/client-node` integration, isolated project namespaces (`kubementor-u<user>-p<project>`), ResourceQuota enforcement, kind whitelist validation, and live status inspection.
6. **Module 6 - Failure Scenario Engine**: Controlled failure injection engine supporting 6 real-world DevOps failure scenarios (`crash-loop-backoff`, `image-pull-backoff`, `oom-killed`, `missing-configmap`, `service-connectivity`, `ingress-tls-failure`).
7. **Module 7 - Context Collector**: Automated collection and sanitization of K8s pod state, container logs, cluster events, service endpoints, ingress TLS metadata, and manifest diffs into versioned `ContextSnapshot` (v1.0) documents. Sensitive credentials are redacted as `"[REDACTED_SENSITIVE_VALUE]"`.
8. **Module 8 - Context-Aware AI Mentor**: Integration with Gemini 1.5 Flash using `ContextSnapshot` telemetry. Features grounded diagnosis, cited evidence, next steps, progressive hints (L1-L4), interactive chat, and deterministic fallback when AI is unavailable.
9. **Module 9 - Solution Validation**: Real K8s runtime stabilization polling (`VALIDATION_TIMEOUT_SECONDS=15`), NEW `ContextSnapshot` generation, state comparison diffing, and deterministic rule evaluation returning `PASS`, `FAIL`, or `PARTIAL` results.
10. **Module 10 - Intelligent Deployment Scoring & Explainability**: Weighted scoring model (Security 30%, Reliability 30%, Performance 20%, Best Practices 20%), explainable score deduction audit with "why it matters" impact statements, and before/after score improvement deltas (`+24 Points`, `✅ Fixed`, `❌ Still Present`).
11. **Module 11 - End-to-End System Hardening & Integration**: Complete end-to-end integration, multi-tenant IDOR protection, cascading database cleanup, sandbox isolation, and system hardening.

---

## 🌐 API Reference

All protected endpoints require `Authorization: Bearer <JWT_TOKEN>`.

### Authentication
- `POST /api/v1/auth/register`: Register new user
- `POST /api/v1/auth/login`: Authenticate and obtain JWT
- `GET /api/v1/auth/me`: Get current authenticated user profile

### Projects
- `POST /api/v1/projects`: Create project workspace
- `GET /api/v1/projects`: List user's projects
- `GET /api/v1/projects/:id`: Get project details
- `PUT /api/v1/projects/:id`: Update project details
- `DELETE /api/v1/projects/:id`: Delete project with cascading cleanup

### File Management
- `POST /api/v1/projects/:projectId/files`: Upload manifest / Dockerfile
- `GET /api/v1/projects/:projectId/files`: List project files
- `GET /api/v1/projects/:projectId/files/:fileId`: View file content
- `PUT /api/v1/projects/:projectId/files/:fileId`: Replace file
- `DELETE /api/v1/projects/:projectId/files/:fileId`: Delete file

### Deployment Analyzer & Scoring
- `POST /api/v1/projects/:projectId/analyze`: Analyze selected manifests and generate explainable score report
- `GET /api/v1/projects/:projectId/analyses`: List project analysis history
- `GET /api/v1/projects/:projectId/analyses/:analysisId`: Get analysis report with before/after comparison

### Kubernetes Sandbox
- `POST /api/v1/projects/:projectId/sandbox/deploy`: Deploy manifests to isolated K8s sandbox namespace
- `GET /api/v1/projects/:projectId/sandbox/status`: Get live pod readiness, service endpoints, and events
- `POST /api/v1/projects/:projectId/sandbox/stop`: Stop sandbox and delete K8s namespace

### Failure Scenario Engine
- `GET /api/v1/scenarios`: List available failure scenarios
- `POST /api/v1/projects/:projectId/scenarios/:scenarioId/start`: Inject failure into active sandbox
- `POST /api/v1/projects/:projectId/scenarios/cancel`: Cancel scenario and restore deployment

### Context Collector
- `GET /api/v1/projects/:projectId/scenario-attempts/:attemptId/context`: Get latest ContextSnapshot
- `POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/context/refresh`: Refresh telemetry snapshot

### Context-Aware AI Mentor
- `GET /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/diagnosis`: Get AI diagnosis
- `GET /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/hint`: Request progressive hint (level 1-4)
- `POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/ai/chat`: Send chat message to AI Mentor

### Solution Validation
- `POST /api/v1/projects/:projectId/scenario-attempts/:attemptId/validate`: Redeploy files, poll K8s, evaluate rules, and save ValidationResult
- `GET /api/v1/projects/:projectId/scenario-attempts/:attemptId/validation`: Get latest validation result

---

## 🔒 Security & Multi-Tenant Scoping

- **JWT Authentication**: Enforced on all non-public routes using standard Express middleware.
- **Server-Side Ownership Verification**: Every service method validates `owner: req.user._id` or `user: req.user._id`. Frontend IDs are never trusted blindly.
- **IDOR Protection**: Requests targeting another user's project, files, deployments, or validation records return `404 Not Found`.
- **Sandbox Security**: Users cannot supply custom namespaces or deploy cluster-scoped resources (`ClusterRole`, `ClusterRoleBinding`, `Namespace`, `Node`, `PersistentVolume`, `StorageClass`).
- **Telemetry Sanitization**: Passwords, bearer tokens, API keys, and authorization headers are redacted before storing in `ContextSnapshot`.

---

## 🛠️ Getting Started

### Environment Setup

Create `.env` inside `backend/`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kubementor
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_optional_gemini_api_key
NODE_ENV=development
```

Create `.env` inside `frontend/`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### Installation & Local Development

```bash
# Install backend and frontend dependencies
npm run install:all

# Start backend server (Port 5000)
npm run dev:backend

# Start frontend development server (Port 5173)
npm run dev:frontend
```

---

## 📜 License

Distributed under the MIT License. Built with Clean Architecture for KubeMentor.
