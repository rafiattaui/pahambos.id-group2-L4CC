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

| Endpoint   | Method | Description                                              |
| ---------- | ------ | -------------------------------------------------------- |
| /user/     | GET    | Retrieve user details using the session token cookie.    |
| /user/     | PATCH  | Update user details.                                     |
| /quiz/     | GET    | Retrieve a list of quizzes.                              |
| /quiz/     | POST   | Create a new quiz.                                       |
| /quiz/{id} | GET    | Retrieve a quiz's details and its questions and answers. |
| /quiz/{id} | DELETE | Deletes a quiz if user is creator of the quiz.           |

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

## Testing Approach

### Create Page and Create Quiz Form Testing

| Method                   | Coverage                                                                              | Test Cases     |
| ------------------------ | ------------------------------------------------------------------------------------- | -------------- |
| **Automated (Jest)**     | Pure logic functions — form validation, draft system, AI tool calls, API error states | FE-01 to FE-57 |
| **Exploratory (Manual)** | UI rendering and interaction behaviour verified in a live browser                     | FE-58 to FE-76 |

> **Why exploratory testing for UI?**
> Jest uses `jsdom` — a simulated DOM that does not support CSS layout rendering, focus management, keyboard events across component boundaries, or third-party UI library animations (Radix UI, Sonner toasts, react-easy-crop). These test cases were verified manually by interacting with the running application at `localhost:3000` and confirming expected behaviour against the defined acceptance criteria. Exploratory testing is a recognised software testing methodology (James Bach, 1996; ISTQB) where the tester simultaneously designs and executes tests — particularly suited for UI behaviour validation where visual and interactive feedback is essential.

---

#### Test Case Table

| Test Case | Scenario                                                                | Expected Result                                                | Actual Result                                     | Status    |
| --------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------- | --------- |
| **FE-01** | No title error when title is present                                    | `errors.title` is undefined                                    | `errors.title` is undefined                       | ✅ Pass   |
| **FE-02** | Title error when title is empty string                                  | `errors.title = "Quiz title is required"`                      | `errors.title = "Quiz title is required"`         | ✅ Pass   |
| **FE-03** | Title error when title is whitespace only                               | `errors.title = "Quiz title is required"`                      | `errors.title = "Quiz title is required"`         | ✅ Pass   |
| **FE-04** | No category error when category is selected                             | `errors.category` is undefined                                 | `errors.category` is undefined                    | ✅ Pass   |
| **FE-05** | Category error when category is empty                                   | `errors.category = "Please select a category"`                 | `errors.category = "Please select a category"`    | ✅ Pass   |
| **FE-06** | Passes with exactly two questions                                       | `errors.questionsError` is undefined                           | `errors.questionsError` is undefined              | ✅ Pass   |
| **FE-07** | Fails with zero questions                                               | `errors.questionsError` matches `/at least two/i`              | Matches `/at least two/i`                         | ✅ Pass   |
| **FE-08** | Fails with only one question                                            | `errors.questionsError` matches `/at least two/i`              | Matches `/at least two/i`                         | ✅ Pass   |
| **FE-09** | Passes with three or more questions                                     | `errors.questionsError` is undefined                           | `errors.questionsError` is undefined              | ✅ Pass   |
| **FE-10** | Flags empty question prompt                                             | `errors.questions[0].question = "Question prompt is required"` | Field error set correctly                         | ✅ Pass   |
| **FE-11** | Flags whitespace-only prompt                                            | `errors.questions[0].question` matches `/required/i`           | Matches `/required/i`                             | ✅ Pass   |
| **FE-12** | Does not flag a valid prompt                                            | `errors.questions[0].question` is undefined                    | `errors.questions[0].question` is undefined       | ✅ Pass   |
| **FE-13** | Flags fewer than 2 filled answers                                       | `errors.questions[0].answer` matches `/at least 2/i`           | Matches `/at least 2/i`                           | ✅ Pass   |
| **FE-14** | Flags empty answers array                                               | `errors.questions[0].answer` matches `/at least 2/i`           | Matches `/at least 2/i`                           | ✅ Pass   |
| **FE-15** | Passes with 2 valid answers                                             | `errors.questions[0].answer` is undefined                      | `errors.questions[0].answer` is undefined         | ✅ Pass   |
| **FE-16** | Ignores whitespace-only answers when counting filled ones               | `errors.questions[0].answer` matches `/at least 2/i`           | Matches `/at least 2/i`                           | ✅ Pass   |
| **FE-17** | Passes with exactly one correct answer (SingleSelect)                   | `errors.questions[0].correctAnswers` is undefined              | `errors.questions[0].correctAnswers` is undefined | ✅ Pass   |
| **FE-18** | Fails with no correct answer (SingleSelect)                             | `errors.questions[0].correctAnswers` matches `/exactly one/i`  | Matches `/exactly one/i`                          | ✅ Pass   |
| **FE-19** | Fails with more than one correct answer (SingleSelect)                  | `errors.questions[0].correctAnswers` matches `/exactly one/i`  | Matches `/exactly one/i`                          | ✅ Pass   |
| **FE-20** | Passes with at least one correct answer (MultiSelect)                   | `errors.questions[0].correctAnswers` is undefined              | `errors.questions[0].correctAnswers` is undefined | ✅ Pass   |
| **FE-21** | Fails with zero correct answers (MultiSelect)                           | `errors.questions[0].correctAnswers` matches `/at least one/i` | Matches `/at least one/i`                         | ✅ Pass   |
| **FE-22** | Allows multiple correct answers (MultiSelect)                           | `errors.questions[0].correctAnswers` is undefined              | `errors.questions[0].correctAnswers` is undefined | ✅ Pass   |
| **FE-23** | Returns all top-level errors simultaneously                             | `title`, `category`, `questionsError` all defined              | All three errors present                          | ✅ Pass   |
| **FE-24** | Per-question errors keyed by `question.order`                           | `errors.questions[0]` and `errors.questions[1]` both present   | Errors keyed by order correctly                   | ✅ Pass   |
| **FE-25** | Identical fingerprints for equivalent forms                             | `fingerprint(a) === fingerprint(b)`                            | Fingerprints match                                | ✅ Pass   |
| **FE-26** | Fingerprint is case-insensitive for title                               | `fingerprint("MY QUIZ") === fingerprint("my quiz")`            | Fingerprints match                                | ✅ Pass   |
| **FE-27** | Fingerprint trims whitespace before comparing                           | `fingerprint("  Quiz  ") === fingerprint("Quiz")`              | Fingerprints match                                | ✅ Pass   |
| **FE-28** | Different fingerprint when title differs                                | `fingerprint("Quiz A") !== fingerprint("Quiz B")`              | Fingerprints differ                               | ✅ Pass   |
| **FE-29** | Different fingerprint when question prompt changes                      | `fingerprint(formA) !== fingerprint(formB)`                    | Fingerprints differ                               | ✅ Pass   |
| **FE-30** | Saves draft and returns status `"saved"`                                | `result.status === "saved"`                                    | `result.status === "saved"`                       | ✅ Pass   |
| **FE-31** | Persists draft in localStorage                                          | `getDrafts().length === 1`, `slotIndex === 0`                  | Draft found in localStorage                       | ✅ Pass   |
| **FE-32** | Overwrites existing draft in the same slot                              | `getDrafts().length === 1`, `title === "Updated Title"`        | Slot overwritten correctly                        | ✅ Pass   |
| **FE-33** | Detects duplicates in other slots                                       | `result.status === "duplicate"`                                | `result.status === "duplicate"`                   | ✅ Pass   |
| **FE-34** | Returns error when all 3 slots are full                                 | `result.status === "error"`                                    | `result.status === "error"`                       | ✅ Pass   |
| **FE-35** | Assigns unique `draftId` each time                                      | `r1.draft.draftId !== r2.draft.draftId`                        | IDs are unique                                    | ✅ Pass   |
| **FE-36** | Records a `savedAt` ISO timestamp                                       | `new Date(result.draft.savedAt)` is valid                      | Valid date returned                               | ✅ Pass   |
| **FE-37** | `deleteDraftBySlot` removes correct draft                               | `getDrafts().length === 1`, remaining `slotIndex === 1`        | Correct draft removed                             | ✅ Pass   |
| **FE-38** | `deleteDraftBySlot` is no-op on empty slot                              | `getDrafts().length === 1` (slot 0 still present)              | No change to other slots                          | ✅ Pass   |
| **FE-39** | `getDrafts` returns `[]` when storage is empty                          | `getDrafts() === []`                                           | Returns `[]`                                      | ✅ Pass   |
| **FE-40** | `getDrafts` handles corrupted localStorage gracefully                   | Does not throw, returns `[]`                                   | Returns `[]` without throwing                     | ✅ Pass   |
| **FE-41** | `add_question` appends question at end                                  | `result.length === 3`, `result[2].question === "Q3?"`          | Question appended correctly                       | ✅ Pass   |
| **FE-42** | `add_question` pads answers to exactly 4 items                          | `result[2].answer.length === 4`, slots 2 and 3 are `""`        | Answers padded correctly                          | ✅ Pass   |
| **FE-43** | `add_question` assigns `order` equal to list length                     | `result[2].order === 2`                                        | Order assigned correctly                          | ✅ Pass   |
| **FE-44** | `edit_question` patches only targeted question                          | `result[0].question` updated, `result[1]` unchanged            | Patch applied correctly                           | ✅ Pass   |
| **FE-45** | `edit_question` does not change question count                          | `result.length === 2`                                          | Count unchanged                                   | ✅ Pass   |
| **FE-46** | `edit_question` is no-op when order does not exist                      | Both questions unchanged                                       | No change applied                                 | ✅ Pass   |
| **FE-47** | `remove_question` removes targeted question                             | `result.length === 1`, `result[0].question === "Q2?"`          | Question removed                                  | ✅ Pass   |
| **FE-48** | `remove_question` re-indexes remaining questions from 0                 | `result[0].order === 0`                                        | Re-indexed correctly                              | ✅ Pass   |
| **FE-49** | `remove_question` is no-op when order does not exist                    | `result.length === 2`                                          | No change applied                                 | ✅ Pass   |
| **FE-50** | `reorder_questions` reorders according to `newOrder`                    | `result[0].question === "Q2?"`, `result[1].question === "Q1?"` | Reordered correctly                               | ✅ Pass   |
| **FE-51** | `reorder_questions` updates `order` property                            | `result[0].order === 0`, `result[1].order === 1`               | Order properties updated                          | ✅ Pass   |
| **FE-52** | `reorder_questions` preserves question count                            | `result.length === 2`                                          | Count preserved                                   | ✅ Pass   |
| **FE-53** | Multiple tool calls applied in sequence                                 | `result.length === 2`, `result[0].question === "Q2?"`          | Calls applied in order                            | ✅ Pass   |
| **FE-54** | Shows error message when user API call fails                            | Error message rendered in DOM                                  | Error message shown                               | ✅ Pass   |
| **FE-55** | Shows empty state when user has no quizzes                              | `"No quizzes yet"` text rendered                               | `"No quizzes yet"` visible                        | ✅ Pass   |
| **FE-56** | Shows loading skeletons while fetching                                  | `animate-pulse` elements present in DOM                        | Skeleton elements found                           | ✅ Pass   |
| **FE-57** | Navigates to `/create-quiz` on button click                             | `mockPush` called with `"/create-quiz"`                        | `mockPush("/create-quiz")` called                 | ✅ Pass   |
| **FE-58** | DraftPopup renders all 3 draft slots                                    | Slot 1, Slot 2, Slot 3 labels visible                          | Verified in browser                               | 🔍 Manual |
| **FE-59** | DraftPopup shows `"0 of 3 slots used"` with no drafts                   | Counter text visible                                           | Verified in browser                               | 🔍 Manual |
| **FE-60** | DraftPopup closes on Escape key press                                   | Modal dismissed                                                | Verified in browser                               | 🔍 Manual |
| **FE-61** | DraftPopup closes on × button click                                     | Modal dismissed                                                | Verified in browser                               | 🔍 Manual |
| **FE-62** | DraftPopup closes on overlay backdrop click                             | Modal dismissed                                                | Verified in browser                               | 🔍 Manual |
| **FE-63** | DraftPopup saves to empty slot and updates slot count                   | `"1 of 3 slots used"` rendered after save                      | Verified in browser                               | 🔍 Manual |
| **FE-64** | DraftPopup shows duplicate warning when same content saved to two slots | `"Duplicate draft detected"` banner visible                    | Verified in browser                               | 🔍 Manual |
| **FE-65** | DraftPopup dismisses duplicate warning on × click                       | Warning banner disappears                                      | Verified in browser                               | 🔍 Manual |
| **FE-66** | DraftPopup loads draft and calls `onLoad` + `onClose`                   | Both callbacks fired once                                      | Verified in browser                               | 🔍 Manual |
| **FE-67** | DraftPopup deletes draft on Delete button click                         | `"0 of 3 slots used"` after delete                             | Verified in browser                               | 🔍 Manual |
| **FE-68** | DraftPopup shows draft title and question count in filled slot          | Title and `"2 questions"` visible in slot                      | Verified in browser                               | 🔍 Manual |
| **FE-69** | CreatePage renders quiz cards when quizzes load successfully            | Quiz card with title renders in grid                           | Verified in browser                               | 🔍 Manual |
| **FE-70** | MetricsModal shows `"Failed to load metrics"` on API failure            | Error text visible in modal                                    | Verified in browser                               | 🔍 Manual |
| **FE-71** | MetricsModal shows `"No attempts yet"` on no data                       | Empty state text visible in modal                              | Verified in browser                               | 🔍 Manual |
| **FE-72** | MetricsModal closes on × button click                                   | Modal disappears from page                                     | Verified in browser                               | 🔍 Manual |
| **FE-73** | DeleteConfirmDialog appears on Delete Quiz button click                 | Dialog with quiz title and confirm button visible              | Verified in browser                               | 🔍 Manual |
| **FE-74** | DeleteConfirmDialog dismisses on Cancel click                           | Dialog disappears                                              | Verified in browser                               | 🔍 Manual |
| **FE-75** | DeleteConfirmDialog shows spinner and disables Cancel during delete     | Cancel disabled, `"Deleting…"` text visible                    | Verified in browser                               | 🔍 Manual |
| **FE-76** | DeleteConfirmDialog removes quiz from list after successful delete      | Quiz card absent from grid, dialog closed                      | Verified in browser                               | 🔍 Manual |

---

#### Summary

| Category                                                                              | Test Cases    | Count  | Result          |
| ------------------------------------------------------------------------------------- | ------------- | ------ | --------------- |
| Form Validation (`validateForm`)                                                      | FE-01 – FE-24 | 24     | ✅ All Pass     |
| Draft System (`formFingerprint`, `saveDraftToSlot`, `deleteDraftBySlot`, `getDrafts`) | FE-25 – FE-40 | 16     | ✅ All Pass     |
| AI Tool Calls (`applyToolCalls`)                                                      | FE-41 – FE-53 | 13     | ✅ All Pass     |
| CreatePage API Error Handling                                                         | FE-54 – FE-57 | 4      | ✅ All Pass     |
| UI Interaction — Exploratory (Manual)                                                 | FE-58 – FE-76 | 19     | 🔍 All Verified |
| **Total**                                                                             |               | **76** | **76 / 76**     |

> **Note on FE-58 to FE-76:** These tests were executed as exploratory tests in a live browser (`localhost:3000`) rather than in Jest. Jest's `jsdom` environment does not simulate CSS layout, Radix UI component behaviour, Sonner toast animations, or native keyboard event propagation — all of which are required for these test cases to execute correctly. The behaviour described in each scenario was confirmed by direct interaction with the running application.

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
