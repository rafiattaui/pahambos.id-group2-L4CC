<h1>Final Project – Web Application Development and Security</h1>
Course Code: COMP6703001<br>
Course Name: Web Application Development and Security<br>
Institution: BINUS University International<br>

# ----- PahamBos.id -----

## 1. Project Information

Project Title: PahamBos.id <br>
Project Domain: Educational Games & Quiz Platform <br>
Class: L4CC <br>
Group Members:
| Name | ID | Role | GitHub Username |
|------|----|------|-----------------|
|Muhammad Rafi Athallah | 2802505891 | Backend Programmer | rafiattaui|
|Christian Salomo Tasmaan | 2802546065 | Frontend Programmer | salmon11062006 |
|Athallah Raja Mustafa | 2802537552 | Fullstack Programmer | talahanakrajin |

## 2. Instructor & Repository Access

This repository must be shared with:

- Instructor: Ida Bagus Kerthyayana Manuaba ->
  Email: imanuaba@binus.edu, GitHub: bagzcode
- Instructor Assistant: Juwono ->
  Email: juwono@binus.edu, GitHub: Juwono136

## 3. Project Overview

PahamBos.id is a web application that takes traditional learning and transforms it to a quiz-based game. This web app is aimed at students and teachers who are eager to learn and teach through games and quizzes. <br>
<br>
Problem Statement: <br>
Learning can become boring and repetitive when all you do is read books and do question sets that may seem endless. Turning it into a score-based quiz will make the process much more fun and engaging for students. Our target users are students that can range from primary school up to university students and teachers who want a fun method of teaching. <br>

Main features:

- Quiz/game creation interface
- Question bank with multiple categories
- Timed quizzes and scoring system via server validation preventing cheating
- Leaderboard and user ranking using Redis
- Student performance analytics
- Classrooms system allowing teachers to give assignments, and track student's submissions

## 4. Technology Stack (MANDATORY)

| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Frontend         | Next.js                                |
| Backend          | Next.js                                |
| API              | REST API                               |
| Database         | Prisma PostgreSQL                      |
| Cache            | Redis                                  |
| AI               | Groq                                   |
| Containerization | Docker                                 |
| Deployment       | Private Server provided by Instructors |
| Version Control  | GitHub                                 |

## 5. System Architecture

### 5.1 Architecture Diagram

![](./docs/1.png)
![](./docs/2.png)
![](./docs/3.png)
![](./docs/4.png)
![](./docs/5.png)
![](./docs/6.png)

### 5.2 Architecture Explanation

Our application is built on a **client-server architecture** utilizing the Next.js framework. The platform provides a dual-interface experience: Students can join real-time quizzes, compete, and track their rankings on live leaderboards, while Educators leverage the quiz gameplay system to assign coursework and monitor student submissions.

**Authoritative Server Model**
To ensure absolute data integrity and prevent exploitation during gameplay, the system implements an authoritative server model. Under this paradigm, the server remains the single source of truth regarding game states, validating and authorizing all incoming client actions before state transitions occur.

A primary example of this architecture is the session timer mechanic:

1. **Trigger**: When a client requests a new question, the server initiates an internal countdown specific to that question's parameters.

2. **Validation**: Rather than relying on client-side timestamps—which are vulnerable to manipulation—the server independently logs the arrival time of the user's submission.

3. **Enforcement**: If a response is received after the designated window has elapsed, the server automatically invalidates the submission, mitigating **client-side tampering** and ensuring a fair competitive environment.

### 5.3 System Component Breakdown

- **Frontend**
  - Framework Ecosystem: Built on Next.js and React, utilizing industry-standard design patterns to deliver a highly responsive and interactive user interface.

  - Dynamic Rendering: Utilizes dynamically rendered components to handle real-time state updates, such as live leaderboard shifts and active quiz countdowns.

  - Isolation of Concerns: The frontend operates with strict isolation from the data layer. It holds zero direct access to the database, communicating exclusively with the backend via structured API endpoints.

- **Backend & API Layer**
  - API Architecture: Implemented via `Next.js` API Routes (Route Handlers), serving as the central orchestration layer for business logic.

  - State Management: Manages the authoritative state for active quiz sessions, continuously tracking and caching session metadata to enforce runtime validation rules.

  - Secure AI Integration: Orchestrates AI-driven features by constructing tested prompts and acting as a secure proxy to the external AI provider. Security is maintained by strictly decoupling the AI service from sensitive application infrastructure; the AI engine has no exposure to environment secrets, API keys, connection strings, or direct database access.

- **Database & Infrastructure Layer**
  - Persistence & Object-Relational Mapping: Employs a `PostgreSQL` relational database managed through the `Prisma ORM`. Prisma enforces type safety, streamlines migrations, and mitigates SQL injection risks.

  - In-Memory Caching & Session Management: Integrates `Redis` to facilitate low-latency read and write operations. `Redis` handles high-throughput quiz session states, buffers real-time leaderboard computations, and enforces global API rate limiting to protect against Denial-of-Service (DoS) vectors.

  - Identity & Access Management: Built on top of `BetterAuth`, providing a flexible, secure authentication layer that supports diverse multi-provider sign-in options while safeguarding user credentials.

- **Security & Validation Architecture**
  - Schema Validation: Implements strict runtime type-checking and payload sanitization utilizing `Zod` schemas. Every incoming request payload undergoes rigid JSON parsing to prevent malformed data injection and ensure backend type integrity.

  - Middleware & Contextual Authentication:
    All protected endpoints are intercepted by a higher-order handler, `WithAuth`. This middleware automatically verifies the session token, decodes the authentication context, and injects user credentials directly into the route context. This eliminates reliance on client-supplied identifiers (e.g., passing a vulnerable userId in the request body), strictly isolating data scope between users.

## 6. API Design (MANDATORY)

**All API's begin with /api/.**

### Endpoints for User CRUD

| Endpoint              | Method | Description                                           |
| --------------------- | ------ | ----------------------------------------------------- |
| /user/                | GET    | Retrieve user details using the session token cookie. |
| /user/                | PATCH  | Update user details.                                  |
| /user/                | PUT    | Update user's profile image.                          |
| /user/change-password | PATCH  | Update user's password.                               |

### Endpoints for Quiz CRUD

| Endpoint                   | Method | Description                                                            |
| -------------------------- | ------ | ---------------------------------------------------------------------- |
| /quiz/                     | GET    | Retrieve a list of quizzes.                                            |
| /quiz/                     | POST   | Create a new quiz.                                                     |
| /quiz/ai                   | POST   | Request AI assistance in generating a quiz.                            |
| /quiz/user/{userId}        | GET    | Retrieve quizzes made by a specific user.                              |
| /quiz/user/performance/    | GET    | Retrieve all quiz performances of the user.                            |
| /quiz/{quizId}             | GET    | Retrieve a quiz's details and its questions and answers.               |
| /quiz/{quizId}             | DELETE | Deletes a quiz if user is creator of the quiz.                         |
| /quiz/{quizId}/performance | GET    | Retrieve all performance records of the user for the specific quiz.    |
| /quiz/{quizId}/metrics     | GET    | Retrieve all aggregate metrics of a quiz, only the creator may see it. |
| /quiz/{quizId}/session/    | POST   | Start a new quiz session.                                              |

### Endpoints for Quiz Sessions

| Endpoint                 | Method | Description                                                                                   |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------- |
| /session/                | GET    | Retrieves user's currently active session details                                             |
| /session/                | DELETE | Deletes the user's currently active session                                                   |
| /session/question/       | GET    | Retrieve the currently active questions, and its possible answers                             |
| /session/question/       | POST   | Answer the currently active questions, and returns the score.                                 |
| /session/next/           | POST   | Advances the session to the next question, only if the user has answered the current question |
| /session/hint/           | GET    | Receive a hint for the current question, using AI                                             |
| /session/finish/         | POST   | Finish and upload the score to the database, and delete the session.                          |
| /session/{assignmentId}/ | POST   | Start a quiz session and link the current session to an assignment.                           |

### Endpoints for Classroom Functionality

| Endpoint                         | Method | Description                                                                                                                                                    |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /class/                          | GET    | Retrieves user's joined classrooms.                                                                                                                            |
| /class/                          | POST   | Create a new classroom.                                                                                                                                        |
| /class/                          | PATCH  | Edit a classroom's name.                                                                                                                                       |
| /class/                          | DELETE | Delete an existing classroom that the user is an educator in.                                                                                                  |
| /class/assignment/{classroomId}/ | GET    | Retrieve details regarding assignments, educators receive a richer response consisting of submissions and scores, learners only see their personal submission. |
| /class/assignment/{classroomId}/ | POST   | Assign a quiz to the classroom, educator only.                                                                                                                 |
| /class/assignment/{classroomId}/ | DELETE | Delete an assignment from the classroom, educator only.                                                                                                        |

### Endpoint for QuizQuestion CRUD

| Endpoint               | Method | Description                                      |
| ---------------------- | ------ | ------------------------------------------------ |
| /question/             | POST   | Add a new question to an already existing quiz.  |
| /question/{questionId} | GET    | Retrieve a specific question.                    |
| /question/{questionId} | DELETE | Delete a specific question.                      |
| /question/{questionId} | PATCH  | Edit a specific question.                        |
| /question/{questionId} | PUT    | Add or remove the image for a specific question. |

### Miscellaneous Endpoints

| Endpoint               | Method | Description                                |
| ---------------------- | ------ | ------------------------------------------ |
| /leaderboard/{quizId}/ | GET    | Retrieve leaderboards for a specific quiz. |
| /ai-quiz-editor/       | POST   | AI Chatbot for quiz creation assistance.   |

Example:
**POST /api/session/question**

- Request JSON

```json
{
  "answer": [0, 1]
}
```

- Response JSON

```json
{
  "success": true,
  "isCorrect": true,
  "isTimedOut": false,
  "points": 250
}
```

## 7. Database Design

## 8. AI Features (MANDATORY)

- **AI Dependencies:**
  - Groq (AI Provider)
  - Vercel AI SDK
- AI Usage:
  - Mid-Quiz Session Hints:
    - If the player is struggling with question, they can request for a hint generated with AI, however if they answer the question successfully after, it will reward them with less points than if they were to answer without AI.
  - End of Quiz Feedback:
    - At the end of the quiz, the player will receive feedback generated with AI and tailored with their results during the quiz. The feedback will consist of ways for the player to improve and recommend material to study for improvement.
  - AI Quiz Creation Assistant:
    - When a user is creating a quiz, they can ask for help from an AI assistant in the form of a chatbot or instant generation using the title and description of the quiz.

## 9. Security Implementation (MANDATORY)

- **Input Sanitization: Prisma**
  Prisma automatically sanitizes all inputs to its methods, and scrubs it of possible SQL injection attempts.
- **Input Validation: Zod**
  To ensure user input stays in-line with our expectations and database schema, we validate all body data with Zod before any code is allowed to operate on them.
  Schemas are defined in `/lib/schemas`.

```ts
// base schema shared between public and creation
export const QuizQuestionSchema = z.object({
  id: z.uuid(),
  quizId: z.uuid(),
  order: z.int().nonnegative(),
  question: z.string().min(5).max(100),
  type: z.enum(['MultiSelect', 'SingleSelect']),
  time: z.int().nonnegative().default(30), // time limit in seconds
  imageUrl: z.url().optional().nullable(),
  imageKey: z.string().optional().nullable(),
  answers: z.array(z.string()).min(2).max(4),
  correctAnswers: z.array(z.int().nonnegative()).min(1).max(4), // allow multiple correct answers for flexibility
});
// Example schema used for QuizQuestion object.
```

- **AI: Vercel AI SDK & Groq**
  In mid-question hints and end-of-session feedbacks, both do not take input from the user, and only take input from tested pre-defined prompts by developers therefore preventing prompt injection from ever happening.

  For our AI Chatbot and Instant Quiz Generation using AI, prompt injection cannot be fully prevented. What's important is limiting its damage were it to happen. To do so, our chatbot does not have any direct access to our database or any private keys, it only has access to the form-data in the quiz creation page.

  We tested our AI using several cases below:

- **Authentcation & Authorization: Better Auth**
  All routes requiring auth uses a wrapper function `WithAuth`. This function ensures that when user credentials are needed in an operation, the server has already validated them before functions are allowed to operate with them, forming a layer of security.

```ts
export function WithAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ) => {
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session?.user) {
        throw new APIError('Unauthorized', 401);
      } else {
        return await handler(request, {
          ...context,
          user: session.user as User,
        });
      }
    } catch (error) {
      return handleError(error);
    }
  };
}

// Example usage of WithAuth used in /api/performance/{id}
export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const { id } = await params;
    const performance = await prisma.userPerformance.findMany({
      where: {
        quizId: id,
        userId: user.id,
      },
    });

    if (performance.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Performance not found' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify({ success: true, data: performance }), {
      status: 200,
    });
  } catch (error) {
    return handleError(error);
  }
});
```

Here the `id` in the `GET` function represents the Quiz ID, rather than asking the user for their `userId`, we automatically retrieve it using the `WithAuth` function which ensures that no other user's data is ever within the function.

For user-sensitive operations such as Quiz gameplay via Sessions, we do the same thing as above which is that we never ask the user for their `id`, only the `BetterAuth` cookie that they provide in the HTTP request.

```ts
// GET /api/session
export const GET = WithAuth(async (req, { user, params }) => {
  try {
    const sessionId = await redis.get(`player_session:${user.id}`); // check for an active session

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'No active session found for user.' },
        { status: 404 }
      );
    }

    const sessionData = await redis.hgetall(`session:${sessionId}`);

    if (!sessionData) {
      return NextResponse.json(
        { success: false, message: 'Session data not found.' },
        { status: 404 }
      );
    }

    const session = r_SessionSchema.parse(sessionData); // example of output sanitization

    return NextResponse.json({
      success: true,
      sessionId,
      session,
    });
  } catch (error) {
    return handleError(error);
  }
});
```

## 10. Testing Documentation (VERY IMPORTANT)

## 11. Deployment & Production Setup

### 11.1 Docker Setup

dockerfile:

```
FROM node:22-bookworm-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# prisma generate does not open a DB connection; fixed placeholder satisfies prisma.config.ts only.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build?sslmode=disable
RUN pnpm dlx prisma generate

# Values come from compose `build.args` — single source: .env.production + compose defaults.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_DOCS_ENABLED
ARG NEXT_PUBLIC_BETTER_AUTH_URL

ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_API_DOCS_ENABLED=${NEXT_PUBLIC_API_DOCS_ENABLED}
ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL}

RUN pnpm build

# One-off migrations against Neon (or any Postgres). Run on the VPS with:
#   docker compose --profile migrate run --rm db-schema-sync
# Uses DATABASE_URL from `.env.production` (or compose environment).
FROM base AS migrator
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV DATABASE_URL=postgresql://migrate:migrate@127.0.0.1:5432/migrate?sslmode=disable
RUN pnpm dlx prisma generate
CMD ["pnpm", "dlx", "prisma", "migrate", "deploy"]

FROM base AS runner

LABEL org.opencontainers.image.title="pahambos-id"
LABEL org.opencontainers.image.url="e2526-wads-b4cc-03.csbihub.id"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/generated ./generated

USER nextjs

EXPOSE 3017
ENV NODE_ENV=production
ENV PORT=3017
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

docker-compose.yml:

```
name: pahambos.id

services:
  app:
    image: ${DOCKER_USERNAME:-local}/pahambos.id:latest
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-https://e2526-wads-b4cc-03.csbihub.id}
        NEXT_PUBLIC_API_DOCS_ENABLED: ${NEXT_PUBLIC_API_DOCS_ENABLED:-true}
        NEXT_PUBLIC_BETTER_AUTH_URL: ${NEXT_PUBLIC_BETTER_AUTH_URL:-https://e2526-wads-b4cc-03.csbihub.id}
    env_file:
      - .env.production
    ports:
      - "3017:3017"
    restart: unless-stopped

  db-schema-sync:
    profiles: ["migrate"]
    build:
      context: .
      dockerfile: Dockerfile
      target: migrator
    env_file:
      - .env.production
    restart: "no"
```

### 11.2 Production Environment

.env.example:

```ts
// used for cookie and token validation by betterauth.
BETTER_AUTH_SECRET=
// points to the betterauth api. since it's on the same server, we set it to the same domain the webapp is hosted on.
BETTER_AUTH_URL=
// database connection string.
DATABASE_URL=
// cloudinary credentials for quick image delivery and upload.
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
// next.js app setup.
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_DOCS_ENABLED=
// redis server connection and credentials.
REDIS_HOST=
REDIS_PORT=
REDIS_USERNAME=
REDIS_PASSWORD=
// groq api key for ai features.
GROQ_API_KEY=
```

- Production secrets are handed using Github Secrets and is deployed within a Docker container which is automatically updated via Github Actions.

### 11.3 Live Application URL

[e2526-wads-b4cc-03.csbihub.id](e2526-wads-b4cc-03.csbihub.id)

## 12. GitHub Contribution Summary (INDIVIDUAL)

**Student Name: Muhammad Rafi Athallah**

- Features Implemented:
  - Backend API Routes for Quiz, QuizQuestion, User, Session
  - Backend Logic for Quiz Gameplay
  - Redis Cache (Rate Limiting, QuizQuestion Cache, Session Data Storage, Leaderboards)
  - Database Schema and ORM
  - Zod Schemas
  - BetterAuth
  - Linting Configuration for Development
  - AI Chatbot, Quiz Creation Assistance, Mid-Quiz Hint, and End-of-Quiz Feedback
- Tests written:
  - Postman manual testing scripts for Quiz, QuizQuestion, User, Session, Classroom
- Security Work:
  - Backend Testing using Postman
  - AI Testing
- AI-Related Work:
  - Implemented AI Chatbot, End-of-Quiz feedback, and mid-hint within the backend.

**Student Name: Athallah Raja Mustafa**

- Features Implemented:
- Tests written:
- Security Work:
- AI-Related Work:

**Student Name: Christian Salomo Tasmaan**

- Features Implemented:
- Tests Written:
- Security Work:
- AI-Related Work:

## 13. AI Usage Disclosure (MANDATORY)

**All usage of AI code was tested and reviewed prior to being commited to the repository.**

- AI Tool Used: Claude, Gemini
  - Purpose: Used for refactoring code, and applying industry and best practices to code that we made, and consultation regarding structure of API.
  - Specific usage:
    - Quiz Session Flow and API Design
    - Classroom Implementation

## 14. Known Limitations & Future Improvements

- Known Technical Limitations:
  - Search options are quite limited. (Only limited to category and quiz name.)
    - Possible improvement using vector search by generating embeddings using AI allowing users to search by quiz contents, image and etc.
  - Quiz questions are restricted to two-types: Single-Choice and Multiple-Choice.
    - Improve by adding more types such as answer via text additionally supporting TTS.
  - Quiz gameplay is limited to one player.
    - Possible improvement in the future by implementing a secondary server using WebSockets for live multiplayer quiz gameplay with full synchronization between clients.
  - Limited Sign-in / Sign-up Options:
    - Should be easy to implement using BetterAuth.

- AI Limitations:
  - Limited tools for AI Chatbot during quiz creation
    - Currently, the AI is limited on how they can help the user in creating a quiz, more tools could be implemented such as fact-checking, or difficulty adjustment however more testing would need to be done.

## 15. Final Declaration

We declare that:

- This project is our own work
- AI usage is disclosed honestly
- All group members understand the system <br>
  <br>
  Signed by Group Members:<br>
  Muhammad Rafi Athallah - 2802505891<br>
  Christian Salomo Tasmaan - 2802546065<br>
  Athallah Raja Mustafa - 2802537552<br>

## 16. SETUP

1. Clone and install modules.

```bash
git clone https://github.com/rafiattaui/pahambos.id-group2-L4CC
cd pahambos.id-group2-L4CC
pnpm install
```

2. Setup .env by copying .env.example and renaming it .env.production then insert the needed keys.

3. Initialize database

```bash
pnpx prisma migrate dev
```

4. Run via Docker (Recommended)

```bash
docker-compose up --build
```

Webapp accessible at http://localhost:3017
