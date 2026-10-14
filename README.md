<div align="center">

# 🌐 Voymate Core Engine (`Server`)

### High-Performance, Distributed Backend for Real-Time Solo Traveler Discovery, AI Travel Assistance & Verified Community Expeditions

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS%20%7C%20pgvector-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-Cache%20%7C%20PubSub%20%7C%20BullMQ-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-WebRTC%20Signaling-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![Prometheus](https://img.shields.io/badge/Prometheus-Telemetry%20%26%20Metrics-E6522C?logo=prometheus&logoColor=white)](https://prometheus.io/)

<p align="center">
  <b>Built with Clean Architecture, Domain-Driven Design (DDD), PostGIS Geospatial Indexing, Local HuggingFace In-Process Vector Embeddings, LangGraph Stateful Agentic Graphs, and BullMQ Distributed Queue Processing.</b>
</p>

---

</div>

## 📌 Executive Architectural Summary

The **Voymate Core Server** is an enterprise-grade backend engineered to solve the complex distributed systems and real-time synchronization challenges of a modern social travel ecosystem.

Rather than relying on monolithic, ad-hoc MVC patterns, this system is architected around **Domain-Driven Design (DDD)** and **Clean / Hexagonal Architecture (Ports and Adapters)** using strict dependency inversion, typed dependency injection via `TSyringe`, and immutable domain boundaries.

### Key Engineering Highlights:

- **Zero Business Logic Leaks**: Domain entities and use cases remain strictly isolated from external libraries, Express HTTP abstractions, and Prisma database models.
- **Geospatial Proximity Matchmaking**: Custom PostGIS spatial queries (`geography(Point, 4326)`) using `ST_DWithin` and `ST_Distance` with spatial indexing to discover active solo travelers on the road within sub-kilometer precision.
- **Edge AI & Vector Semantic Retrieval (RAG)**: In-process vector embedding generation via `@huggingface/transformers` (`all-MiniLM-L6-v2`) on CPU coupled with PostgreSQL `pgvector` cosine distance queries (`<=>`), eliminating external embedding API costs and latency.
- **Stateful Agentic Workflows**: Multi-node state machine orchestration via `@langchain/langgraph` integrating user profile context, active itineraries, and vector conversation history.
- **Asynchronous Document AI & Verification Pipeline**: Distributed task processing via BullMQ and Redis to execute OCR extraction with Google Cloud Document AI and rule-based fraud risk scoring without blocking event loops.
- **Full-Duplex Real-Time Fabric**: WebRTC audio/video signaling state machine and Socket.io chat with multi-socket presence tracking and distributed room authorization.
- **Production-Grade Telemetry**: Prometheus metrics middleware exporting active request gauges, latency histograms, and error counters to `/metrics`.

---

## 🏛️ System Architecture & Layer Boundaries

The codebase enforces strict unidirectional dependency flow from presentation to domain:

```
[Presentation Layer]  -->  [Application Layer]  -->  [Domain Layer]
  (Controllers, Routes,      (Use Cases, DTOs,         (Entities, Value Objects,
   Socket Handlers, Zod)      Ports / Interfaces)       Domain Errors, Enums)
         |                           ^                          ^
         |                           |                          |
         +------------------- [Infrastructure Layer] -----------+
                              (Prisma Repositories, Redis Cache,
                               BullMQ Queues, AWS S3, LangGraph)
```

```mermaid
graph TD
    subgraph Presentation_Layer ["Presentation Layer (Ports & Transport)"]
        HTTP[Express 5 REST API]
        SOCK[Socket.io Signaling & Chat]
        VAL[Zod Request Validation]
        ERR[Centralized Global Error Mapper]
        METRIC[Prometheus Metrics Middleware]
    end

    subgraph Application_Layer ["Application Layer (Use Cases & Orchestration)"]
        UC_AUTH[Auth & Session Use Cases]
        UC_GEO[Geospatial Matchmaking Use Cases]
        UC_AI[LangGraph Travel Agent Use Cases]
        UC_VERIF[Async Verification Use Cases]
        UC_COMM[Community Trip Booking Use Cases]
        PORTS[Service & Repository Interface Contracts]
    end

    subgraph Domain_Layer ["Domain Layer (Core Business Rules)"]
        ENT_USER[User & Profile Aggregates]
        ENT_TRIP[Trip & Community Aggregates]
        VAL_OBJ[Domain Enums & Value Objects]
        DOM_ERR[Domain Business Errors]
    end

    subgraph Infrastructure_Layer ["Infrastructure Layer (Adapters & External Systems)"]
        REPO_PG[Prisma / PostgreSQL Adapter]
        VEC_PG[pgvector Cosine Search]
        GEO_PG[PostGIS Spatial Engine]
        CACHE_REDIS[Redis Caching & Presence Engine]
        QUEUE_BULL[BullMQ Asynchronous Job Queues]
        AI_HF[HuggingFace Local Embeddings]
        AI_DOC[Google Cloud Document AI]
        S3_STORAGE[AWS S3 Presigned Storage Adapter]
        PAY_GATEWAY[Razorpay Cryptographic Verification]
    end

    HTTP --> VAL
    VAL --> UC_AUTH
    VAL --> UC_GEO
    VAL --> UC_COMM
    SOCK --> UC_AI
    HTTP --> METRIC

    UC_AUTH --> PORTS
    UC_GEO --> PORTS
    UC_AI --> PORTS
    UC_VERIF --> PORTS
    UC_COMM --> PORTS

    PORTS --> ENT_USER
    PORTS --> ENT_TRIP
    PORTS --> DOM_ERR

    REPO_PG -.->|Implements| PORTS
    GEO_PG -.->|Implements| PORTS
    VEC_PG -.->|Implements| PORTS
    CACHE_REDIS -.->|Implements| PORTS
    QUEUE_BULL -.->|Implements| PORTS
    AI_HF -.->|Implements| PORTS
    AI_DOC -.->|Implements| PORTS
    S3_STORAGE -.->|Implements| PORTS
    PAY_GATEWAY -.->|Implements| PORTS
```

---

## ⚡ Core Engineering Subsystems

### 1. Geospatial Traveler Discovery Engine (PostGIS)

Finding fellow solo travelers within an adjustable radius requires sub-second execution on high-density coordinate tables without table scans.

- **Spatial Modeling**: Columns utilize `geography(Point, 4326)` for ellipsoidal calculations on Earth's curved surface.
- **Index Optimization**: Built with spatial GiST indexes over coordinates.
- **Raw Query Execution**:
  ```sql
  SELECT u.id, u.full_name, l.current_city,
         ST_Distance(l.coordinates, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000 AS distance_km
  FROM users u
  JOIN user_locations l ON u.id = l.user_id
  WHERE u.account_status = 'ACTIVE'
    AND u.id != $3
    AND ST_DWithin(l.coordinates, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $4)
  ORDER BY distance_km ASC;
  ```

---

### 2. Hybrid RAG & Stateful AI Travel Agent (LangGraph + pgvector)

Rather than passing an entire unbounded chat transcript to an LLM, the AI subsystem combines semantic vector retrieval with localized memory and itinerary metadata:

```mermaid
sequenceDiagram
    autonumber
    actor Traveler as Client App
    participant Controller as AiAssistantController
    participant ContextBuilder as AssistantContextBuilder
    participant HF as HuggingFace Local Model
    participant pgvector as PostgreSQL (pgvector)
    participant LangGraph as LangGraph Agent Graph
    participant LLM as OpenRouter / Gemini

    Traveler->>Controller: POST /api/v1/ai-assistant/chat { message }
    Controller->>ContextBuilder: build(userId, message)

    par In-Process Embedding & History
        ContextBuilder->>HF: embed(message) [MiniLM-L6-v2 CPU]
        HF-->>ContextBuilder: 384-dimensional vector
        ContextBuilder->>ContextBuilder: Fetch recent 10 messages (buffer)
    end

    ContextBuilder->>pgvector: SELECT <=> cosine distance similarity (top 5)
    pgvector-->>ContextBuilder: Semantic contextual past messages
    ContextBuilder->>ContextBuilder: Inject active itinerary & budget preferences
    ContextBuilder-->>Controller: Fully hydrated AssistantContext

    Controller->>LangGraph: execute(AssistantState)
    LangGraph->>LLM: Stream prompt with context & grounding
    LLM-->>LangGraph: Generated domain response
    LangGraph-->>Controller: State updated with reply

    par Async Vector Storage
        Controller->>HF: embed(reply)
        HF-->>Controller: vector
        Controller->>pgvector: INSERT raw vector into assistant_message_embeddings
    end

    Controller-->>Traveler: 200 OK { response, contextId }
```

- **Local Feature Extraction**: Utilizes `@huggingface/transformers` to run `Xenova/all-MiniLM-L6-v2` locally inside Node.js, yielding 384-dimensional normalized embeddings with zero external HTTP latency.
- **Vector Indexing**: Native SQL queries using `<=>` (cosine distance operator) partitioned by `conversation_id`.
- **Stateful Graph**: Defined via `StateGraph(AssistantState)` with dedicated prompt formatting, contextual injection, and validation nodes.

---

### 3. Distributed Document AI & Verification Pipeline (BullMQ + Redis)

Government-issued ID verification (passports, Aadhaar, driving licenses) is CPU- and I/O-intensive. Blocking the HTTP thread during OCR leads to timeout cascades under load.

```mermaid
flowchart TD
    A[Traveler Submits ID Documents] -->|POST multipart| B[Verification Controller]
    B -->|Upload to S3| C[Private AWS S3 Bucket]
    B -->|Record Pending Status| D[(PostgreSQL)]
    B -->|Enqueue Job| E[BullMQ 'verification' Queue]
    B -- Immediate 202 Accepted --> A

    subgraph Asynchronous_Worker ["Background Worker (Isolated Process)"]
        E -->|Consume Job| F[Verification Worker]
        F -->|Fetch Document Buffers| C
        F -->|Send to OCR| G[Google Cloud Document AI]
        G -->|Structured Entities| H[Document Extraction Service]
        H -->|Extracted Fields| I[Rule-Based Fraud Risk Engine]
        I -->|Calculate Risk Score 0-100| J{Risk Assessment}
        J -->|Passed Checks| K[Mark Pending Admin Review / Auto-Approve]
        J -->|Critical Field Missing / Mismatch| L[Flag High Risk Warning]
        K --> M[(Update PostgreSQL Verification Record)]
        L --> M
    end
```

- **BullMQ Queue Management**: Configured with automatic retries, exponential backoff, and dead-letter queue (DLQ) support.
- **Fraud Risk Engine**: Evaluates full name fuzzy matching, document validity dates, required side codes (front/back), and applies calibrated penalties against the 100-point trust score.

---

### 4. Real-Time WebRTC Video & Audio Signaling Fabric

P2P WebRTC calls require a fault-tolerant signaling backplane to exchange Session Description Protocol (SDP) offers, answers, and ICE candidates.

```mermaid
sequenceDiagram
    autonumber
    participant Alice as Caller (Client A)
    participant Socket as Socket.io Server
    participant Redis as Redis Session & Presence
    participant Bob as Callee (Client B)

    Alice->>Socket: call:initiate { targetUserId, callType }
    Socket->>Redis: Check target user presence
    alt Bob is Offline / Busy
        Socket-->>Alice: call:unavailable { reason: 'OFFLINE' | 'BUSY' }
    else Bob is Available
        Socket->>Socket: Generate Call Session ID
        Socket->>Bob: call:incoming { callId, callerInfo }
        Bob->>Socket: call:accept { callId }
        Socket-->>Alice: call:accepted { callId }

        par WebRTC SDP Handshake
            Alice->>Socket: call:offer { callId, sdpOffer }
            Socket->>Socket: Authorize signaling room access
            Socket->>Bob: call:offer { callId, sdpOffer }
            Bob->>Socket: call:answer { callId, sdpAnswer }
            Socket->>Alice: call:answer { callId, sdpAnswer }
        end

        par ICE Candidate Trickle
            Alice->>Socket: call:ice-candidate { candidate }
            Socket->>Bob: call:ice-candidate { candidate }
            Bob->>Socket: call:ice-candidate { candidate }
            Socket->>Alice: call:ice-candidate { candidate }
        end

        Note over Alice,Bob: Direct P2P Media Streams Established (SRTP)
    end
```

- **Distributed Presence**: Multi-socket mapping in Redis allows users to connect from multiple tabs/devices without false "offline" states (`isFirstSocket` detection).
- **Signaling Security**: `IAuthorizeSignalingUseCase` verifies both participants belong to an active, authorized call before relaying SDP payloads.

---

### 5. Community Expedition Booking & Payment Concurrency Engine

Paid community adventures experience sudden booking spikes when slots are released.

- **Race Condition Prevention**: Prevents overbooking beyond `maxCapacity` through strict pre-condition checks, database constraint guards, and atomic joined count increments.
- **Razorpay Integration**: Two-phase checkout flow:
  1. `create-razorpay-order.usecase`: Generates an official payment order with amounts locked in paise.
  2. `verify-razorpay-booking.usecase`: Cryptographically validates the HMAC-SHA256 signature using `crypto.createHmac('sha256', secret).update(orderId + "|" + paymentId)`.
- **Digital Pass Generation**: Generates deterministic alphanumeric booking codes (`VM-<SLUG>-<RANDOM>`) for check-in verification.

---

## 📂 Project Directory Structure

```
Server/
├── src/
│   ├── application/               # Application Layer (Use Cases & Orchestration)
│   │   ├── dtos/                  # Request / Response Data Transfer Objects
│   │   ├── interfaces/            # Dependency Inversion Ports (Contracts)
│   │   │   ├── repositories/      # Repository Interfaces
│   │   │   ├── services/          # External Service Interfaces
│   │   │   └── use-cases/         # Use Case Interfaces
│   │   └── use-cases/             # Application Use Case Implementations
│   │
│   ├── config/                    # Environment & Process Configuration
│   │   └── env.config.ts          # Validated Environment Config
│   │
│   ├── domain/                    # Domain Layer (Pure Enterprise Rules)
│   │   ├── entities/              # Domain Aggregates & Models
│   │   ├── enums/                 # Domain Enums (Status, Types, Roles)
│   │   └── errors/                # Typed Domain Business Exceptions
│   │
│   ├── infrastructure/            # Infrastructure Layer (Secondary Adapters)
│   │   ├── ai/                    # LangGraph State Machine & AI Builders
│   │   ├── database/              # Persistence Engine
│   │   │   ├── repositories/      # Concrete Prisma Repositories
│   │   │   └── schema/models/     # Modular Multi-File Prisma Schemas
│   │   ├── di/                    # Dependency Injection (TSyringe Container & Tokens)
│   │   ├── jobs/                  # BullMQ Queues, Processors & Background Workers
│   │   ├── logging/               # Winston Daily Rotate Logger & Prometheus Metrics
│   │   ├── services/              # Concrete Third-Party Adapters (S3, Redis, Twilio, Razorpay)
│   │   └── socket/                # Socket.io Transport & WebRTC Signaling Handlers
│   │
│   ├── presentation/              # Presentation Layer (Primary Adapters)
│   │   ├── controllers/           # Express REST Controllers
│   │   ├── express/               # Express Application Bootstrap
│   │   ├── middleware/            # Auth, Error, Rate Limiting, Metrics Middlewares
│   │   ├── routes/                # Versioned Route Definitions (/api/v1)
│   │   └── validators/            # Zod Input Validation Schemas
│   │
│   ├── shared/                    # Cross-cutting Utilities, Constants & Error Codes
│   └── server.ts                  # Server Entry Point & Lifecycle Supervisor
│
├── package.json                   # Dependencies, Scripts & Tooling
├── tsconfig.json                  # Strict TypeScript Compiler Options
└── eslint.config.mjs              # Code Quality & Standards
```

---

## 🛡️ Multi-Tenant Authentication & Security Architecture

The server implements a multi-tenant authentication system serving three distinct actor domains:

1. **Traveler (User)**: Cookie-based refresh tokens with short-lived access tokens, Google OAuth2.0, multi-channel OTP (Email via Nodemailer, SMS via Twilio).
2. **Community Organizer**: Dedicated onboarding portal, commercial host verification, KYC identity validation, and host-scoped token claims.
3. **Administrator**: Role-based access control (RBAC), multi-factor admin sessions, platform governance, and audit logging.

### Security Invariants:

- **Token Rotation & Blacklisting**: Refresh tokens are rotated on every refresh request. Compromised sessions can be revoked immediately via Redis key invalidation.
- **S3 Pre-Signed Direct Uploads**: Sensitive identity documents and high-resolution trip galleries are uploaded directly from client to AWS S3 using presigned PUT URLs, preventing buffer bloat and memory leaks on the API server.
- **Private Document Access**: Verification documents in S3 remain in private buckets accessible only via time-bounded presigned GET URLs generated on-demand for authorized admins.
- **Hardened HTTP Surface**: Protected by `helmet`, strict CORS whitelisting, JSON payload size boundaries, and cookie `SameSite=lax` / `HttpOnly` flags.

---

## 📊 Telemetry, Observability & Health

The server incorporates production-ready metrics and logging infrastructure:

| Component              | Technology                              | Description                                                                                                                    |
| :--------------------- | :-------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Metrics Scrape**     | `prom-client`                           | Standard `/metrics` endpoint for Prometheus / Grafana scraping                                                                 |
| **HTTP Metrics**       | Custom Middleware                       | Tracks `http_requests_total`, `http_request_duration_seconds` (p50, p95, p99), `active_requests`                               |
| **Error Tracking**     | Custom Counter                          | `http_errors_total` categorized by method, route, and status code (4xx / 5xx)                                                  |
| **Structured Logging** | `winston` + `winston-daily-rotate-file` | JSON-formatted structured logs rotated daily into `/logs`                                                                      |
| **HTTP Access Log**    | `morgan`                                | Colorized development logging and structured production request trails                                                         |
| **Process Resilience** | Node.js Process                         | Intercepts `SIGINT` and `SIGTERM` for graceful teardown (closing Prisma pools, flushing Redis buffers, draining BullMQ queues) |

---

## 🛠️ Technology Stack & Tooling

| Domain               | Technology / Library              | Purpose                                               |
| :------------------- | :-------------------------------- | :---------------------------------------------------- |
| **Runtime**          | Node.js (v20+ LTS)                | Asynchronous non-blocking runtime                     |
| **Language**         | TypeScript (v5.x Strict)          | Type safety, zero `any` policy                        |
| **Framework**        | Express 5                         | High-throughput HTTP routing                          |
| **IoC / DI**         | TSyringe (`reflect-metadata`)     | Loose coupling and dependency inversion               |
| **Database**         | PostgreSQL 16+                    | Relational persistence                                |
| **Extensions**       | `PostGIS` & `pgvector`            | Spatial indexing and vector embeddings                |
| **ORM**              | Prisma 7.x (Multi-schema)         | Type-safe query building and migrations               |
| **Caching & Queues** | Redis 7 & BullMQ                  | Fast key-value storage, session locks & worker queues |
| **Real-Time**        | Socket.io 4.x                     | WebRTC signaling, presence and instant chat           |
| **AI / Embeddings**  | `@huggingface/transformers`       | Local CPU MiniLM-L6-v2 vector embeddings              |
| **Agent Graph**      | `@langchain/langgraph`            | Stateful multi-node conversational RAG workflow       |
| **Document AI**      | Google Cloud Document AI          | OCR identity verification and entity parsing          |
| **Cloud Storage**    | AWS SDK v3 (`@aws-sdk/client-s3`) | Presigned URL asset management                        |
| **Payments**         | Razorpay SDK & HMAC-SHA256        | Cryptographically verified payments                   |
| **Validation**       | Zod                               | Schema parsing and runtime assertion                  |

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites

- **Node.js**: `v20.x` or higher
- **PostgreSQL**: `v16+` with `postgis` and `pgvector` extensions enabled
- **Redis**: `v7.x+`
- **AWS S3 Bucket**: With CORS configured for direct client uploads
- **Google Cloud Console**: Document AI Processor enabled

### 2. Environment Configuration

Create a `.env` file in `Server/` based on the configuration matrix below:

```env
# Application & Network
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
APP_URL=http://localhost:3000
APP_NAME=Voymate

# PostgreSQL & Prisma
DATABASE_URL=postgresql://user:password@localhost:5432/voymate?schema=public
DB_USER=user
DB_PASSWORD=password
DB_NAME=voymate

# Redis Cache & BullMQ
REDIS_URL=redis://localhost:6379

# JWT Dual-Token Authentication
JWT_ACCESS_SECRET=your_super_secret_access_key_32_chars_min
JWT_REFRESH_SECRET=your_super_secret_refresh_key_32_chars_min
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# OTP Verification
OTP_EXPIRY_MINUTES=5
OTP_MAX_ATTEMPTS=5

# SMTP Email Dispatch
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Voymate Team <no-reply@voymate.com>

# AWS S3 Storage
S3_ACCESS_KEY=your_aws_s3_access_key
S3_SECRET_KEY=your_aws_s3_secret_key
S3_REGION=ap-south-1
S3_BUCKET_NAME=voymate-storage-bucket

# Google Geocoding & Places
GEOCODING_API_KEY=your_google_maps_geocoding_api_key

# Google Cloud Document AI (OCR)
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id
GOOGLE_DOCUMENT_AI_LOCATION=us
GOOGLE_DOCUMENT_AI_PROCESSOR_ID=your_processor_id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-credentials.json

# OpenRouter / Gemini LLM
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# Twilio SMS Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_yourKeyId
RAZORPAY_KEY_SECRET=yourSecretKey
```

### 3. Database Migration & Vector Extension Setup

Ensure PostgreSQL has the required extensions before running Prisma migrations:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
```

Then execute:

```bash
# Generate Prisma Client models
npm run db:generate

# Run schema migrations
npm run db:migrate

# Seed lookup tables, travel styles, and baseline data
npm run db:seed
```

### 4. Running the Server

```bash
# Development mode with hot-reloading (via tsx watch)
npm run dev

# Debug mode with Chrome DevTools inspector on port 9229
npm run debug

# Production build & start
npm run build
npm run start
```

### 5. Telemetry & Code Quality

```bash
# Verify TypeScript strict typing across the entire codebase
npm run build

# Run ESLint validation
npm run lint

# Format code with Prettier
npm run format

# Inspect live Prometheus metrics
curl http://localhost:3000/metrics
```

---

## 👨‍💻 Engineering Philosophy & Takeaways

> _"In an era where AI can generate standard boilerplate code in seconds, true engineering excellence lies in architectural discipline, data modeling, concurrency control, system observability, and boundary enforcement."_

This server is constructed as a demonstration of production-grade software craftsmanship:

- **Maintainability over Convenience**: Inverting dependencies via TSyringe ensures that any database, cache, or external provider can be swapped with zero impact on domain use cases.
- **Resource Efficiency**: Moving vector embeddings in-process via `@huggingface/transformers` saves thousands in third-party API costs while slashing latency.
- **Asynchronous Reliability**: Heavy AI document extraction is completely isolated from user-facing HTTP transactions using robust Redis BullMQ queues.

---

<div align="center">
  <sub>Engineered with precision for Voymate. Designed for scale, resilience, and real-time human connection.</sub>
</div>
