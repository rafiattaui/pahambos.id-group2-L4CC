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
- Timed quizzes and scoring system
- Leaderboard and user ranking
- Student performance analytics
- Teacher/admin dashboard

## 4. Technology Stack (MANDATORY)

| Layer            | Technology        |
| ---------------- | ----------------- |
| Frontend         | Next.js           |
| Backend          | Next.js           |
| API              | REST API          |
| Database         | Prisma PostgreSQL |
| Containerization | Docker            |
| Deployment       | Vercel            |
| Version Control  | GitHub            |

## 5. System Architecture

![](./docs/1.png)
![](./docs/2.png)
![](./docs/3.png)
![](./docs/4.png)
![](./docs/5.png)
![](./docs/6.png)

## 6. API Design (MANDATORY)

All API's begin with /api/.

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
| /session/[assignmentId]/ | POST   | Start a quiz session and link the current session to an assignment.                           |

### Endpoints for Classroom Functionality

| Endpoint                         | Method | Description                                                                                                                                                      |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /class/                          | GET    | Retrieves user's joined classrooms.                                                                                                                              |
| /class/                          | POST   | Create a new classroom.                                                                                                                                          |
| /class/                          | PATCH  | Edit a classroom's name.                                                                                                                                         |
| /class/                          | DELETE | Delete an existing classroom that the user is an educator in.                                                                                                    |
| /class/assignment/[classroomId]/ | GET    | Retrieve details regarding an assignment, educators receive a richer response consisting of submissions and scores, learners only see their personal submission. |
| /class/assignment/[classroomId]/ | POST   | Assign a quiz to the classroom, educator only.                                                                                                                   |
| /class/assignment/[classroomId]/ | DELETE | Delete an assignment from the classroom, educator only.                                                                                                          |

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
  Our two use cases of AI are mid-question hints and end-of-session feedbacks, both do not take input from the user, and only take input from tested pre-defined prompts by developers therefore preventing prompt injection from ever happening.
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

## 12. GitHub Contribution Summary (INDIVIDUAL)

## 13. AI Usage Disclosure (MANDATORY)

## 14. Known Limitations & Future Improvements

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

## 17. DEPLOYMENT INSTRUCTIONS
