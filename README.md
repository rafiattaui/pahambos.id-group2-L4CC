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

| Endpoint              | Method | Description                                           | Auth Required |
| --------------------- | ------ | ----------------------------------------------------- | ------------- |
| /user/                | GET    | Retrieve user details using the session token cookie. | Yes           |
| /user/                | PATCH  | Update user details.                                  | Yes           |
| /user/                | PUT    | Update user's profile image.                          | Yes           |
| /user/change-password | PATCH  | Update user's password.                               | Yes           |
| /auth/sign-in/email   | POST   | Log-in                                                | No            |

### Endpoints for Quiz CRUD

| Endpoint                   | Method | Description                                                            | Auth Required |
| -------------------------- | ------ | ---------------------------------------------------------------------- | ------------- |
| /quiz/                     | GET    | Retrieve a list of quizzes.                                            | No            |
| /quiz/                     | POST   | Create a new quiz.                                                     | Yes           |
| /quiz/ai                   | POST   | Request AI assistance in generating a quiz.                            | Yes           |
| /quiz/user/{userId}        | GET    | Retrieve quizzes made by a specific user.                              | No            |
| /quiz/user/performance/    | GET    | Retrieve all quiz performances of the user.                            | Yes           |
| /quiz/{quizId}             | GET    | Retrieve a quiz's details and its questions and answers.               | No            |
| /quiz/{quizId}             | DELETE | Deletes a quiz if user is creator of the quiz.                         | Yes           |
| /quiz/{quizId}/performance | GET    | Retrieve all performance records of the user for the specific quiz.    | Yes           |
| /quiz/{quizId}/metrics     | GET    | Retrieve all aggregate metrics of a quiz, only the creator may see it. | Yes           |
| /quiz/{quizId}/session/    | POST   | Start a new quiz session.                                              | Yes           |

### Endpoints for Quiz Sessions

| Endpoint                 | Method | Description                                                                                   | Auth Required |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------- | ------------- |
| /session/                | GET    | Retrieves user's currently active session details                                             | Yes           |
| /session/                | DELETE | Deletes the user's currently active session                                                   | Yes           |
| /session/question/       | GET    | Retrieve the currently active questions, and its possible answers                             | Yes           |
| /session/question/       | POST   | Answer the currently active questions, and returns the score.                                 | Yes           |
| /session/next/           | POST   | Advances the session to the next question, only if the user has answered the current question | Yes           |
| /session/hint/           | GET    | Receive a hint for the current question, using AI                                             | Yes           |
| /session/finish/         | POST   | Finish and upload the score to the database, and delete the session.                          | Yes           |
| /session/{assignmentId}/ | POST   | Start a quiz session and link the current session to an assignment.                           | Yes           |

### Endpoints for Classroom Functionality

| Endpoint                         | Method | Description                                                                                                                                                    | Auth Required |
| -------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| /class/                          | GET    | Retrieves user's joined classrooms.                                                                                                                            | Yes           |
| /class/                          | POST   | Create a new classroom.                                                                                                                                        | Yes           |
| /class/                          | PATCH  | Edit a classroom's name.                                                                                                                                       | Yes           |
| /class/                          | DELETE | Delete an existing classroom that the user is an educator in.                                                                                                  | Yes           |
| /class/assignment/{classroomId}/ | GET    | Retrieve details regarding assignments, educators receive a richer response consisting of submissions and scores, learners only see their personal submission. | Yes           |
| /class/assignment/{classroomId}/ | POST   | Assign a quiz to the classroom, educator only.                                                                                                                 | Yes           |
| /class/assignment/{classroomId}/ | DELETE | Delete an assignment from the classroom, educator only.                                                                                                        | Yes           |

### Endpoint for QuizQuestion CRUD

| Endpoint               | Method | Description                                      | Auth Required |
| ---------------------- | ------ | ------------------------------------------------ | ------------- |
| /question/             | POST   | Add a new question to an already existing quiz.  | Yes           |
| /question/{questionId} | GET    | Retrieve a specific question.                    | No            |
| /question/{questionId} | DELETE | Delete a specific question.                      | Yes           |
| /question/{questionId} | PATCH  | Edit a specific question.                        | Yes           |
| /question/{questionId} | PUT    | Add or remove the image for a specific question. | Yes           |

### Miscellaneous Endpoints

| Endpoint               | Method | Description                                | Auth Required |
| ---------------------- | ------ | ------------------------------------------ | ------------- |
| /leaderboard/{quizId}/ | GET    | Retrieve leaderboards for a specific quiz. | No            |
| /ai-quiz-editor/       | POST   | AI Chatbot for quiz creation assistance.   | Yes           |

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

### 7.1 Database Choice

We chose **PostgreSQL**, managed via **Prisma ORM**, as our primary database for the following reasons:

- **Relational Structure:** PahamBos.id requires well-defined relationships between entities — a User owns many Quizzes, a Quiz has many Questions, a Classroom has many members and assignments, and so on. PostgreSQL's relational model and foreign key enforcement handles these constraints robustly and predictably.

- **Data Integrity & Security:** Prisma provides compile-time type safety and automatically sanitizes all inputs passed to its query methods, effectively mitigating SQL injection risks without requiring manual escaping. It also enforces schema-level constraints (unique fields, cascading deletes, required relations) that keep data consistent across all operations.

### 7.2 Schema / Data Structure

![ERD](public/erd.png)

The database consists of the following tables:

**User**
Represents a registered user of the platform.

| Field                     | Type            | Description                                    |
| ------------------------- | --------------- | ---------------------------------------------- |
| `id`                      | UUID (PK)       | Unique identifier for the user                 |
| `name`                    | String          | Display name                                   |
| `email`                   | String (unique) | Login email address                            |
| `emailVerified`           | Boolean         | Whether the email has been verified            |
| `image` / `imageKey`      | String?         | Profile picture URL and Cloudinary storage key |
| `createdAt` / `updatedAt` | DateTime        | Record timestamps                              |

---

**Account**
Stores authentication credentials for a User, managed by BetterAuth.

| Field                                            | Type             | Description                                                         |
| ------------------------------------------------ | ---------------- | ------------------------------------------------------------------- |
| `id`                                             | UUID (PK)        | Unique identifier                                                   |
| `userId`                                         | UUID (FK → User) | The owning user                                                     |
| `providerId`                                     | String           | The auth provider identifier (e.g. `credential`)                    |
| `accountId`                                      | String           | The user's ID as recognized by the auth provider                    |
| `password`                                       | String?          | Hashed password for the account                                     |
| `accessToken` / `refreshToken`                   | String?          | Provider-issued tokens, populated if supported by the auth provider |
| `accessTokenExpiresAt` / `refreshTokenExpiresAt` | DateTime?        | Expiry timestamps for the respective tokens                         |
| `idToken`                                        | String?          | Identity token issued by the auth provider                          |
| `scope`                                          | String?          | Permission scopes granted to the account                            |
| `createdAt` / `updatedAt`                        | DateTime         | Record timestamps                                                   |

---

**Session**
Tracks active authentication sessions issued by BetterAuth.

| Field                     | Type             | Description                                    |
| ------------------------- | ---------------- | ---------------------------------------------- |
| `id`                      | UUID (PK)        | Unique session identifier                      |
| `userId`                  | UUID (FK → User) | The authenticated user                         |
| `token`                   | String (unique)  | Opaque session token stored in the HTTP cookie |
| `expiresAt`               | DateTime         | Expiry timestamp for the session               |
| `ipAddress` / `userAgent` | String?          | Client metadata for security auditing          |
| `createdAt` / `updatedAt` | DateTime         | Record timestamps                              |

---

**Quiz**
Represents a quiz created by a user, containing metadata such as category, description, and cover image.

| Field                   | Type             | Description                                   |
| ----------------------- | ---------------- | --------------------------------------------- |
| `id`                    | UUID (PK)        | Unique identifier                             |
| `createdBy`             | UUID (FK → User) | The quiz creator                              |
| `title`                 | String           | Quiz title (max 255 chars)                    |
| `description`           | String?          | Optional description                          |
| `category`              | Enum (Category)  | Subject category (e.g., Mathematics, Science) |
| `numQuestions`          | Int              | Total number of questions in the quiz         |
| `imageKey` / `imageUrl` | String?          | Cover image stored in Cloudinary              |
| `createdAt`             | DateTime         | Creation timestamp                            |

---

**QuizQuestion**
Represents an individual question within a quiz, including its answer choices and correct answer indices.

| Field                   | Type                | Description                                   |
| ----------------------- | ------------------- | --------------------------------------------- |
| `id`                    | UUID (PK)           | Unique identifier                             |
| `quizId`                | UUID (FK → Quiz)    | The parent quiz                               |
| `order`                 | Int                 | Position of the question in the quiz sequence |
| `question`              | String              | The question text                             |
| `type`                  | Enum (QuestionType) | `SingleSelect` or `MultiSelect`               |
| `answers`               | String[]            | Array of answer option strings                |
| `correctAnswers`        | Int[]               | Indices of the correct answer(s)              |
| `time`                  | Int                 | Time limit in seconds (default: 30)           |
| `imageKey` / `imageUrl` | String?             | Optional question image via Cloudinary        |

---

**UserPerformance**
Records the result of a completed quiz session for a user. Optionally linked to a classroom assignment.

| Field             | Type                       | Description                                |
| ----------------- | -------------------------- | ------------------------------------------ |
| `id`              | UUID (PK)                  | Unique identifier                          |
| `userId`          | UUID (FK → User)           | The player                                 |
| `quizId`          | UUID (FK → Quiz)           | The quiz attempted                         |
| `classroomQuizId` | UUID? (FK → ClassroomQuiz) | Linked assignment, if applicable           |
| `finalScore`      | Int                        | Total points earned                        |
| `accuracyRate`    | Decimal                    | Percentage of correct answers              |
| `timeTaken`       | Int                        | Total time taken in seconds                |
| `longestStreak`   | Int                        | Longest consecutive correct answer streak  |
| `hintsUsed`       | Int                        | Number of AI hints used during the session |
| `completedAt`     | DateTime                   | Timestamp of quiz completion               |

---

**QuizMetrics**
Stores aggregate statistics for a quiz, updated each time a user completes it. One-to-one with Quiz.

| Field          | Type                    | Description                               |
| -------------- | ----------------------- | ----------------------------------------- |
| `id`           | UUID (PK)               | Unique identifier                         |
| `quizId`       | UUID (unique FK → Quiz) | The associated quiz                       |
| `attempts`     | Int                     | Total number of attempts                  |
| `uniqueUsers`  | Int                     | Number of distinct users who attempted it |
| `avgAccuracy`  | Decimal                 | Average accuracy rate across all attempts |
| `avgScore`     | Decimal                 | Average final score across all attempts   |
| `avgTimeTaken` | Int                     | Average time taken in seconds             |
| `updatedAt`    | DateTime                | Last updated timestamp                    |

---

**Classroom**
Represents a classroom created and owned by an Educator. A classroom groups users together and can have quizzes assigned to it as homework.

| Field                     | Type             | Description                         |
| ------------------------- | ---------------- | ----------------------------------- |
| `id`                      | UUID (PK)        | Unique identifier                   |
| `ownerId`                 | UUID (FK → User) | The Educator who owns the classroom |
| `name`                    | String           | Classroom name (max 100 chars)      |
| `createdAt` / `updatedAt` | DateTime         | Record timestamps                   |

---

**UserClassroom**
Junction table representing the many-to-many relationship between Users and Classrooms, with a role distinguishing Educators from Learners.

| Field         | Type                  | Description             |
| ------------- | --------------------- | ----------------------- |
| `userId`      | UUID (FK → User)      | The user                |
| `classroomId` | UUID (FK → Classroom) | The classroom           |
| `role`        | Enum (Role)           | `Educator` or `Learner` |

---

**ClassroomQuiz**
Represents a quiz assigned to a classroom as an assignment, with a due date. Acts as a junction between Classroom and Quiz, and is referenced by UserPerformance when a submission is tied to an assignment.

| Field          | Type                  | Description                       |
| -------------- | --------------------- | --------------------------------- |
| `id`           | UUID (PK)             | Unique identifier                 |
| `classroomId`  | UUID (FK → Classroom) | The classroom this is assigned to |
| `quizId`       | UUID (FK → Quiz)      | The quiz being assigned           |
| `assignedDate` | DateTime              | When the assignment was created   |
| `dueDate`      | DateTime              | Submission deadline               |

## 8. AI Features (MANDATORY)

### 8.1 AI Features List

- **AI Dependencies:**
  - Groq (AI Provider)
  - Vercel AI SDK

| AI Feature                 | Purpose                                                                                                                                                                                                                                  | AI Type |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Mid-Quiz Session Hints     | If the player is struggling with question, they can request for a hint generated with AI, however if they answer the question successfully after, it will reward them with less points than if they were to answer without AI.           | NLP     |
| End of Quiz Feedback       | At the end of the quiz, the player will receive feedback generated with AI and tailored with their results during the quiz. The feedback will consist of ways for the player to improve and recommend material to study for improvement. | NLP     |
| AI Quiz Creation Assistant | When a user is creating a quiz, they can ask for help from an AI assistant in the form of a chatbot or instant generation using the title and description of the quiz.                                                                   | NLP     |

### 8.2 AI Integration Flow

- End of Quiz Feedback
  - Input is automatically provided by the metrics stored in the Redis cache, so no user input is directly injected in the prompt. This input is then processed along with details of the questions of the quiz, its title, genre and etc. Feedback is then generated and passed back to the user.

- Mid-Quiz Session Hints
  - The current question and possible answers are sent to the backend route resposible for hints. These are then sent along with a prompt to the AI, and a response is sent back to the user of the AI's response.

- AI Quiz Creation Assistant
  - The AI is provided tools that, **do not interact with the database**, but rather the front-end quiz form maintaing data security should prompt injection attempts occur. As the user chats with the AI, the AI can decide whether to use the tools provided that allows the AI to add, edit, remove, re-order questions on the form.

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

### 10.1 Frontend Testing

### 10.2 Backend Testing

Because our data is highly intertwined and consists of many complex relations, tests must be executed in order and thoroughly to prevent data inconsistencies.

We use Postman for our API testing pipeline. All relevant collection and environment scripts are available in the [postman](/postman/) directory of this repository.

#### In Postman:

1. Click Import (top left).
2. Select Folder.
3. Navigate to and select the postman root folder in the repo.
4. **Postman** will scan and import everything — collections, environments, globals, mocks, etc.

Isolated test cases may also be ran, but collections may be ran using the Postman Runner by **right-clicking the parent folders and clicking** `run`.

Don't forget to register on our frontend, and then insert your credentials in the Log-in route on the body section for testing to work.

| Test Case     | Endpoint       | Input                                        | Expected Output                                   | Status |
| ------------- | -------------- | -------------------------------------------- | ------------------------------------------------- | ------ |
| Quiz Gameplay | /api/session/~ | User's answers, ID of quiz they want to play | User is able to play a quiz from start to finish. | PASS   |

💡 Note: Because the application features an extensive number of API routes, a full endpoint reference is not listed directly in this README. Please refer to the Postman collection for a complete interactive documentation of all routes and their parameters.

### 10.3 Security Testing

Security tests were run using Postman modifying JSON and HTML Form-Data to purposely test scenarios.

| Test Case | Attack Type        | Expected Behaviour                                                                                                                                | Result                                                       |
| --------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| SEC-01    | XSS                | Inserting `<script>alert(1)</script>` into the title when creating a quiz, an alert should pop up in the user's browser everytime the quiz loads. | Sanitised by Zod, no alert pop up.                           |
| SEC-02    | IDOR / Auth Bypass | Grabbing another user's session data by inserting id to `GET /api/session`                                                                        | Only shows results for the current user, the id is not used. |

### 10.4 AI Functionality Testing

Tests AI-01 and AI-02 were done by using Postman to send faulty JSON's to the AI quiz editor API route.

Tests AI-03 was done by creating a random quiz with faulty, illogical answers and questions then playing said quiz.

Screenshots for additional proof can be found in [/docs/ai/](/docs/ai/)

| Test Case | Input                                              | Expected Output                            | Actual Result                     | Status |
| --------- | -------------------------------------------------- | ------------------------------------------ | --------------------------------- | ------ |
| AI-01     | Invalid Input (empty messages)                     | Generic error message                      | Handled by `handleError` function | PASS   |
| AI-02     | Valid Input (messages, quizzes)                    | Returns a JSON with a list of questions    | <-------                          | PASS   |
| AI-03     | Playing a faulty quiz to trigger a faulty feedback | AI generates a generic feedback or timeout | Returns generic feedback          | PASS   |
| AI-04     | Playing a faulty quiz to trigger a faulty hint     | AI generates a generic hint or timeout     | Returns generic feedback          | PASS   |

Failure Handling:

- If AI is unavailable, `handleError` will convert the error to a generic error we can show our users, rather than the error message from `vercel-ai-sdk`
- Timeout is handled by `vercel-ai-sdk` by setting `maxTimeout` when calling `generateText` function.

## 11. Deployment & Production Setup

### 11.1 Docker Setup

dockerfile:

```docker
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

```yaml
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
      - '3017:3017'
    restart: unless-stopped

  db-schema-sync:
    profiles: ['migrate']
    build:
      context: .
      dockerfile: Dockerfile
      target: migrator
    env_file:
      - .env.production
    restart: 'no'
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

- Features Implemented: Landing page, home page, search page, create page, create quiz form including edit page, user performance visualization inisde profile
- Tests written: quiz creation related pages, dashboard components, landing components
- Security Work: -
- AI-Related Work: UI improvement, API calls and helper functions

**Student Name: Christian Salomo Tasmaan**

- Features Implemented: Quiz interface, classroom page, profile card, quiz results page, leaderboard page, quiz metrics on quiz creation page, quiz preview card on dashboard
- Tests Written: quiz gameplay component, profile card component, classroom component
- Security Work: -
- AI-Related Work: AI hints in gameplay, AI feedback in results page

## 13. AI Usage Disclosure (MANDATORY)

**All usage of AI code was tested and reviewed prior to being commited to the repository.**

- AI Tool Used: Claude, Gemini
  - Purpose: Used for refactoring code, and applying industry and best practices to code that we made, and consultation regarding structure of API.
  - Specific usage:
    - Quiz Session Flow and API Design
    - Classroom Implementation
    - Used to write automatic tests in Jest, Postman, and Playwright.

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
