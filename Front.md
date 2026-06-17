## 10.1 Frontend Testing

This document records the frontend test suite for the PahamBos.id quiz and learning platform, built with Next.js and React. All tests were written and executed with Jest, together with React Testing Library and `@testing-library/user-event`, which render each component into a simulated DOM and exercise it the same way a real user would — clicking buttons, typing into inputs, pressing keys, and waiting for asynchronous state updates to resolve. Network requests, Next.js navigation hooks, and third-party UI primitives (Radix/shadcn components and Lucide icons) are mocked in every suite so that each test verifies the behaviour of the component or function under test rather than its external dependencies.

The suite is split across four test files, each covering a distinct area of the application: the public Landing Page, the Create Quiz workflow (form validation, the draft-saving system, and AI-assisted question editing), the Dashboard components (navigation, performance summary, featured quiz carousel, and grid views), and the Search page (filtering, pagination, and error states). In total, 230 individual test cases were defined. Each case below is identified with an ID in the format FE-XXX, grouped by the component or feature it exercises, and documented using the Scenario / Expected Result / Status format. The Status column should be marked Pass or Fail based on the actual outcome of running the suite against the current codebase — run `npx jest` to execute all four files together, or `npx jest <filename>` to run one suite at a time.

### 10.1.1 Test Suite Summary

| File                     | Focus Area                                                          | Test Case Range | Total Cases |
| ------------------------ | ------------------------------------------------------------------- | --------------- | ----------- |
| `landing_test.tsx`       | Hero, navbar, marketing sections, scroll-reveal animation, logo     | FE-001 – FE-063 | 63          |
| `createquiz_test.tsx`    | Form validation, draft persistence, AI tool calls, create/delete UI | FE-064 – FE-141 | 78          |
| `dashboardComp_test.tsx` | Navigation, performance summary, quiz carousel, grid items          | FE-142 – FE-209 | 68          |
| `searchpage_test.tsx`    | Search/filter validation, fetch error handling, pagination          | FE-210 – FE-230 | 21          |
| **Total**                |                                                                     |                 | **230**     |

### 10.1.2 Landing Page — `landing_test.tsx`

#### Hero Section

| Test Case | Scenario                                               | Expected Result                                                        | Status |
| --------- | ------------------------------------------------------ | ---------------------------------------------------------------------- | ------ |
| FE-001    | Hero section is rendered on the landing page           | The brand name "PahamBos.id" headline is displayed                     | Pass   |
| FE-002    | Hero section is rendered                               | The platform's descriptive paragraph is displayed beneath the headline | Pass   |
| FE-003    | An unauthenticated (guest) user views the hero section | The call-to-action button links to `/register`                         | Pass   |
| FE-004    | An authenticated user views the hero section           | The call-to-action button links to `/dashboard`                        | Pass   |
| FE-005    | Hero section is rendered                               | The ArrowRight icon is displayed inside the CTA button                 | Pass   |
| FE-006    | Hero section is rendered                               | The "Join us today" call-to-action copy is displayed                   | Pass   |

#### Navbar

| Test Case | Scenario                                          | Expected Result                                                  | Status |
| --------- | ------------------------------------------------- | ---------------------------------------------------------------- | ------ |
| FE-007    | Navbar renders on a desktop viewport              | All section navigation buttons are displayed                     | Pass   |
| FE-008    | Guest (unauthenticated) user views the navbar     | Register and Log In buttons are visible                          | Pass   |
| FE-009    | Authenticated user views the navbar               | Register and Log In buttons are hidden                           | Pass   |
| FE-010    | User clicks the Register button in the navbar     | App navigates to `/register`                                     | Pass   |
| FE-011    | User clicks the Log In button in the navbar       | App navigates to `/login`                                        | Pass   |
| FE-012    | User clicks the mobile burger menu icon           | The mobile navigation drawer opens, and clicking again closes it | Pass   |
| FE-013    | User clicks one of the section nav buttons        | The page smooth-scrolls to the corresponding section             | Pass   |
| FE-014    | Guest user views the navbar avatar                | Avatar displays the fallback letter "G"                          | Pass   |
| FE-015    | Authenticated user views the navbar avatar        | Avatar displays the first letter of the user's name              | Pass   |
| FE-016    | Authenticated user opens the avatar dropdown menu | Profile and Logout menu items are shown                          | Pass   |

#### Create Section

| Test Case | Scenario                                 | Expected Result                                                  | Status |
| --------- | ---------------------------------------- | ---------------------------------------------------------------- | ------ |
| FE-017    | Create section renders                   | Heading "Create Your Own Quiz" is displayed                      | Pass   |
| FE-018    | Create section renders                   | Introductory paragraph describing quiz creation is displayed     | Pass   |
| FE-019    | Create section renders                   | All four feature bullet items are displayed                      | Pass   |
| FE-020    | User clicks the "Create Now!" button     | App navigates to `/dashboard/create`                             | Pass   |
| FE-021    | Create section renders                   | Demo video element is present with the correct video source      | Pass   |
| FE-022    | Create section's demo video is inspected | Video element has `autoPlay`, `muted`, and `loop` attributes set | Pass   |

#### Learn Section

| Test Case | Scenario                                 | Expected Result                                                  | Status |
| --------- | ---------------------------------------- | ---------------------------------------------------------------- | ------ |
| FE-023    | Learn section renders                    | Heading "Start To Learn" is displayed                            | Pass   |
| FE-024    | Learn section renders                    | Introductory paragraph is displayed                              | Pass   |
| FE-025    | Learn section renders                    | All four feature bullet items are displayed                      | Pass   |
| FE-026    | User clicks the "Start Learning!" button | App navigates to `/dashboard/search`                             | Pass   |
| FE-027    | Learn section renders                    | Demo video element is present with the correct video source      | Pass   |
| FE-028    | Learn section's demo video is inspected  | Video element has `autoPlay`, `muted`, and `loop` attributes set | Pass   |

#### Discover Section

| Test Case | Scenario                                        | Expected Result                                             | Status |
| --------- | ----------------------------------------------- | ----------------------------------------------------------- | ------ |
| FE-029    | Discover section renders                        | Section heading is displayed                                | Pass   |
| FE-030    | Discover section renders                        | Sub-copy paragraph is displayed                             | Pass   |
| FE-031    | Discover section renders with the category list | A CarouselItem is rendered for each of the 7 categories     | Pass   |
| FE-032    | Discover section renders                        | Previous and Next carousel navigation buttons are displayed | Pass   |

#### Category Component

| Test Case | Scenario                                                     | Expected Result                                                    | Status |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------------ | ------ |
| FE-033    | Category component renders with a category prop              | The category's name is displayed                                   | Pass   |
| FE-034    | Category component renders                                   | Category image renders with the correct `src` and `alt` attributes | Pass   |
| FE-035    | Discover section iterates over the exported categories array | Every category in the array is rendered                            | Pass   |

#### BottomPage

| Test Case | Scenario                                 | Expected Result                                         | Status |
| --------- | ---------------------------------------- | ------------------------------------------------------- | ------ |
| FE-036    | BottomPage stats section renders         | Heading "The Numbers Speak for Themselves" is displayed | Pass   |
| FE-037    | Stats section renders                    | "10000+" active users stat is displayed                 | Pass   |
| FE-038    | Stats section renders                    | "500+" quizzes stat is displayed                        | Pass   |
| FE-039    | Stats section renders                    | "7" categories stat is displayed                        | Pass   |
| FE-040    | How It Works section renders             | Heading "How It Works" is displayed                     | Pass   |
| FE-041    | How It Works section renders             | All three step numbers (01, 02, 03) are displayed       | Pass   |
| FE-042    | How It Works section renders             | All three step titles are displayed                     | Pass   |
| FE-043    | How It Works section renders             | All three step descriptions are displayed               | Pass   |
| FE-044    | How It Works section renders             | Step images render with correct `alt` text              | Pass   |
| FE-045    | Closing CTA section renders              | Heading "Ready to Start Learning?" is displayed         | Pass   |
| FE-046    | Closing CTA section renders              | "Join thousands of students" copy is displayed          | Pass   |
| FE-047    | Guest user views the closing CTA         | "Get Started Free" button links to `/register`          | Pass   |
| FE-048    | Authenticated user views the closing CTA | "Get Started Free" button links to `/dashboard`         | Pass   |
| FE-049    | User views the closing CTA               | "Browse Quizzes" button links to `/dashboard/search`    | Pass   |
| FE-050    | BottomPage renders                       | Three FadeInSection scroll-reveal wrappers are present  | Pass   |

#### FadeInSection (Real Implementation)

| Test Case | Scenario                                                              | Expected Result                                                     | Status |
| --------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- | ------ |
| FE-051    | FadeInSection wraps child content                                     | Children render inside a `<section>` HTML element                   | Pass   |
| FE-052    | FadeInSection mounts before entering the viewport                     | The section does not yet have the `reveal-visible` class            | Pass   |
| FE-053    | IntersectionObserver reports the element entering the viewport        | `reveal-visible` class is added to the section                      | Pass   |
| FE-054    | Element becomes visible with the default `once=true` behaviour        | `observer.unobserve` is called so the element only animates once    | Pass   |
| FE-055    | FadeInSection is given a `direction="left"` prop and becomes visible  | `reveal-left` class is applied                                      | Pass   |
| FE-056    | FadeInSection is given a `direction="right"` prop and becomes visible | `reveal-right` class is applied                                     | Pass   |
| FE-057    | FadeInSection uses the default direction ("up")                       | No left/right directional class is applied                          | Pass   |
| FE-058    | `once=false` and the element leaves the viewport after being visible  | `reveal-visible` class is removed                                   | Pass   |
| FE-059    | FadeInSection component unmounts                                      | `IntersectionObserver.disconnect` is called to prevent memory leaks | Pass   |
| FE-060    | A custom `className` prop is passed to FadeInSection                  | The class name is forwarded to the underlying `<section>` element   | Pass   |

#### Logo

| Test Case | Scenario               | Expected Result                                  | Status |
| --------- | ---------------------- | ------------------------------------------------ | ------ |
| FE-061    | Logo component renders | Logo `<img>` element is displayed                | Pass   |
| FE-062    | Logo component renders | Image `src` points to `/logo.svg`                | Pass   |
| FE-063    | Logo component renders | Image width and height attributes both equal 100 | Pass   |

### 10.1.3 Create Quiz Page — `createquiz_test.tsx`

#### Form Validation — `validateForm`: Title

| Test Case | Scenario                                       | Expected Result                            | Status |
| --------- | ---------------------------------------------- | ------------------------------------------ | ------ |
| FE-064    | Form is validated with a non-empty title       | No title error is returned                 | Pass   |
| FE-065    | Form is validated with an empty title          | "Quiz title is required" error is returned | Pass   |
| FE-066    | Form is validated with a whitespace-only title | "Quiz title is required" error is returned | Pass   |

#### Form Validation — `validateForm`: Category

| Test Case | Scenario                                    | Expected Result                              | Status |
| --------- | ------------------------------------------- | -------------------------------------------- | ------ |
| FE-067    | Form is validated with a category selected  | No category error is returned                | Pass   |
| FE-068    | Form is validated with no category selected | "Please select a category" error is returned | Pass   |

#### Form Validation — `validateForm`: Minimum Questions

| Test Case | Scenario                                     | Expected Result                                                 | Status |
| --------- | -------------------------------------------- | --------------------------------------------------------------- | ------ |
| FE-069    | Form is validated with exactly two questions | No `questionsError` is returned                                 | Pass   |
| FE-070    | Form is validated with zero questions        | `questionsError` requiring "at least two" questions is returned | Pass   |
| FE-071    | Form is validated with only one question     | `questionsError` requiring "at least two" questions is returned | Pass   |
| FE-072    | Form is validated with three questions       | No `questionsError` is returned                                 | Pass   |

#### Form Validation — `validateForm`: Question Prompt

| Test Case | Scenario                                   | Expected Result                                                   | Status |
| --------- | ------------------------------------------ | ----------------------------------------------------------------- | ------ |
| FE-073    | A question has an empty prompt             | "Question prompt is required" error is returned for that question | Pass   |
| FE-074    | A question prompt contains only whitespace | A "required" error is returned for that question                  | Pass   |
| FE-075    | A question has a valid, non-empty prompt   | No prompt error is returned                                       | Pass   |

#### Form Validation — `validateForm`: Answer Options

| Test Case | Scenario                                          | Expected Result                                                                  | Status |
| --------- | ------------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| FE-076    | A question has fewer than 2 filled answer options | "At least 2" answers error is returned                                           | Pass   |
| FE-077    | A question has an empty answers array             | "At least 2" answers error is returned                                           | Pass   |
| FE-078    | A question has exactly 2 valid filled answers     | No answer error is returned                                                      | Pass   |
| FE-079    | Some answer options contain only whitespace       | Whitespace-only answers aren't counted, so the "at least 2" error still triggers | Pass   |

#### Form Validation — `validateForm`: Correct Answers (Single-Select)

| Test Case | Scenario                                                       | Expected Result                                | Status |
| --------- | -------------------------------------------------------------- | ---------------------------------------------- | ------ |
| FE-080    | A single-select question has exactly one correct answer marked | No `correctAnswers` error is returned          | Pass   |
| FE-081    | A single-select question has zero correct answers marked       | "Exactly one" correct answer error is returned | Pass   |
| FE-082    | A single-select question has two correct answers marked        | "Exactly one" correct answer error is returned | Pass   |

#### Form Validation — `validateForm`: Correct Answers (Multi-Select)

| Test Case | Scenario                                                       | Expected Result                                 | Status |
| --------- | -------------------------------------------------------------- | ----------------------------------------------- | ------ |
| FE-083    | A multi-select question has at least one correct answer marked | No `correctAnswers` error is returned           | Pass   |
| FE-084    | A multi-select question has zero correct answers marked        | "At least one" correct answer error is returned | Pass   |
| FE-085    | A multi-select question has several correct answers marked     | No `correctAnswers` error is returned           | Pass   |

#### Form Validation — `validateForm`: Multiple Errors

| Test Case | Scenario                                                        | Expected Result                                                                      | Status |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------ |
| FE-086    | Title, category, and questions are all invalid at the same time | All three top-level errors (title, category, `questionsError`) are returned together | Pass   |
| FE-087    | Multiple questions each have a different validation issue       | Errors are returned keyed by each question's `order` index                           | Pass   |

#### Draft System — `formFingerprint`

| Test Case | Scenario                                                           | Expected Result                                      | Status |
| --------- | ------------------------------------------------------------------ | ---------------------------------------------------- | ------ |
| FE-088    | Two forms with identical content are fingerprinted                 | Both produce the same fingerprint                    | Pass   |
| FE-089    | Two forms differ only by letter casing in title/description        | Fingerprints match (case-insensitive)                | Pass   |
| FE-090    | Two forms differ only by leading/trailing whitespace               | Fingerprints match (whitespace trimmed)              | Pass   |
| FE-091    | Two forms have different titles                                    | Fingerprints differ                                  | Pass   |
| FE-092    | A question's prompt text differs between two forms                 | Fingerprints differ                                  | Pass   |
| FE-093    | Two forms have the same correct answers in a different array order | Fingerprints match (`[0,1]` === `[1,0]`)             | Pass   |
| FE-094    | Legacy data stores `correctAnswers` as a boolean                   | Fingerprint generation does not throw an error       | Pass   |
| FE-095    | Legacy data stores `correctAnswers` as a string                    | Fingerprint generation does not throw an error       | Pass   |
| FE-096    | Two otherwise-identical forms are fingerprinted at different times | Fingerprints differ because a time field is included | Pass   |

#### Draft System — `saveDraftToSlot`

| Test Case | Scenario                                                    | Expected Result                                     | Status |
| --------- | ----------------------------------------------------------- | --------------------------------------------------- | ------ |
| FE-097    | A new draft is saved to an empty slot                       | Function returns status `"saved"`                   | Pass   |
| FE-098    | A draft is saved                                            | Draft data is persisted in `localStorage`           | Pass   |
| FE-099    | A draft is saved to a slot that already contains a draft    | The existing draft in that slot is overwritten      | Pass   |
| FE-100    | An identical draft already exists in a different slot       | Function returns status `"duplicate"`               | Pass   |
| FE-101    | All 3 slots are full and a new, non-matching draft is saved | Function returns status `"error"`                   | Pass   |
| FE-102    | Multiple drafts are saved                                   | Each draft is assigned a unique `draftId`           | Pass   |
| FE-103    | A draft is saved                                            | A `savedAt` field with an ISO timestamp is recorded | Pass   |

#### Draft System — `deleteDraftBySlot`

| Test Case | Scenario                                        | Expected Result                      | Status |
| --------- | ----------------------------------------------- | ------------------------------------ | ------ |
| FE-104    | A specific slot's draft is deleted              | Only that slot's draft is removed    | Pass   |
| FE-105    | One slot's draft is deleted while others remain | Drafts in other slots are unaffected | Pass   |

#### Draft System — `getDrafts`

| Test Case | Scenario                                         | Expected Result                                        | Status |
| --------- | ------------------------------------------------ | ------------------------------------------------------ | ------ |
| FE-106    | `localStorage` contains no draft data            | `getDrafts` returns an empty array                     | Pass   |
| FE-107    | `localStorage` contains corrupted/malformed JSON | `getDrafts` returns an empty array instead of throwing | Pass   |
| FE-108    | `localStorage` contains valid draft JSON         | `getDrafts` returns the correctly parsed drafts        | Pass   |

#### AI Tool Calls — `applyToolCalls`: `add_question`

| Test Case | Scenario                                                 | Expected Result                                               | Status |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------- | ------ |
| FE-109    | An `add_question` tool call is applied                   | New question is appended to the end of the question list      | Pass   |
| FE-110    | A new question is added with fewer than 4 answer options | Answers array is padded with empty strings to exactly 4 items | Pass   |
| FE-111    | A new question is added to an existing list              | New question's `order` equals the prior list length           | Pass   |

#### AI Tool Calls — `applyToolCalls`: `edit_question`

| Test Case | Scenario                                                       | Expected Result                                        | Status |
| --------- | -------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| FE-112    | An `edit_question` call targets one specific question by order | Only that question is patched; others remain unchanged | Pass   |
| FE-113    | An existing question is edited                                 | Total question count remains the same                  | Pass   |
| FE-114    | `edit_question` targets a non-existent order index             | No question is modified (no-op)                        | Pass   |

#### AI Tool Calls — `applyToolCalls`: `remove_question`

| Test Case | Scenario                                                | Expected Result                                            | Status |
| --------- | ------------------------------------------------------- | ---------------------------------------------------------- | ------ |
| FE-115    | A `remove_question` call targets a specific question    | That question is removed from the list                     | Pass   |
| FE-116    | A question is removed from the middle/start of the list | Remaining questions are re-indexed starting from `order` 0 | Pass   |
| FE-117    | `remove_question` targets a non-existent order index    | List remains unchanged (no-op)                             | Pass   |

#### AI Tool Calls — `applyToolCalls`: `reorder_questions`

| Test Case | Scenario                                              | Expected Result                                                         | Status |
| --------- | ----------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| FE-118    | A `reorder_questions` call provides a new order array | Questions are rearranged to match the new order                         | Pass   |
| FE-119    | Questions are reordered                               | Each question's `order` property is updated to reflect its new position | Pass   |
| FE-120    | Questions are reordered                               | Total question count remains unchanged                                  | Pass   |

#### AI Tool Calls — `applyToolCalls`: Sequential Calls

| Test Case | Scenario                                                              | Expected Result                                                         | Status |
| --------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| FE-121    | Several AI tool calls (e.g. add, then remove) are applied in sequence | Each call is applied in order, producing the cumulative expected result | Pass   |

#### DraftPopup — UI Behaviour

| Test Case | Scenario                                                        | Expected Result                                                    | Status |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| FE-122    | DraftPopup is opened                                            | All three draft slot labels ("Slot 1 — empty", etc.) are rendered  | Pass   |
| FE-123    | DraftPopup opens with no saved drafts                           | "0 of 3 slots used" counter is displayed                           | Pass   |
| FE-124    | User presses the Escape key while the popup is open             | `onClose` callback is triggered                                    | Pass   |
| FE-125    | User clicks the × close button                                  | `onClose` callback is triggered                                    | Pass   |
| FE-126    | User clicks the dialog's backdrop overlay (not a child element) | `onClose` callback is triggered                                    | Pass   |
| FE-127    | User clicks an empty slot to save the current form              | Draft is saved and the slot counter updates to "1 of 3 slots used" | Pass   |
| FE-128    | An identical form is saved to a second slot                     | A "duplicate draft detected" warning is shown                      | Pass   |
| FE-129    | User clicks the × on the duplicate warning                      | The warning is dismissed and removed from view                     | Pass   |
| FE-130    | User clicks a filled draft slot                                 | `onLoad` and `onClose` callbacks are both triggered                | Pass   |
| FE-131    | User clicks the Delete button on a filled slot                  | Draft is removed and the slot count updates accordingly            | Pass   |
| FE-132    | A slot contains a saved draft                                   | The slot displays the draft's title and number of questions        | Pass   |

#### CreatePage — API States

| Test Case | Scenario                                            | Expected Result                                                    | Status |
| --------- | --------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| FE-133    | The user-info API call fails                        | "Something went wrong loading your quizzes" error message is shown | Pass   |
| FE-134    | User has zero saved quizzes                         | "No quizzes yet" empty state is shown                              | Pass   |
| FE-135    | The quiz data request is still in flight            | Loading skeleton placeholders are displayed                        | Pass   |
| FE-136    | User clicks the "Create Quiz" button                | App navigates to `/create-quiz`                                    | Pass   |
| FE-137    | Quiz data loads successfully with at least one quiz | Quiz cards are rendered with the correct data                      | Pass   |

#### DeleteConfirmDialog — UI Behaviour

| Test Case | Scenario                                                  | Expected Result                                             | Status |
| --------- | --------------------------------------------------------- | ----------------------------------------------------------- | ------ |
| FE-138    | User clicks "Delete Quiz" on a quiz card                  | A confirmation dialog appears showing the quiz name         | Pass   |
| FE-139    | User clicks Cancel in the delete confirmation dialog      | Dialog closes without deleting                              | Pass   |
| FE-140    | User confirms deletion and the delete API call is pending | A loading spinner appears and the Cancel button is disabled | Pass   |
| FE-141    | Delete API call succeeds                                  | Quiz is removed from the list and the dialog closes         | Pass   |

### 10.1.4 Dashboard Components — `dashboardComp_test.tsx`

#### `dashboardHref` Utility

| Test Case | Scenario                                                                  | Expected Result                                     | Status |
| --------- | ------------------------------------------------------------------------- | --------------------------------------------------- | ------ |
| FE-142    | `dashboardHref` is called with an empty path string                       | Returns `/dashboard`                                | Pass   |
| FE-143    | `dashboardHref` is called with `/`                                        | Returns `/dashboard`                                | Pass   |
| FE-144    | `dashboardHref` is called with a sub-path (e.g. `/search`)                | Returns the correctly prefixed dashboard sub-path   | Pass   |
| FE-145    | `dashboardHref` is called with a path containing multiple leading slashes | Extra leading slashes are stripped before prefixing | Pass   |
| FE-146    | `dashboardHref` is called with a path that includes a query string        | The query string is preserved in the returned URL   | Pass   |

#### DashNavbar — Search Form Validation

| Test Case | Scenario                                                               | Expected Result                                                         | Status |
| --------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| FE-147    | User types a search query and submits the dashboard navbar search form | App navigates to the search page with the query in the URL              | Pass   |
| FE-148    | User submits a query with leading/trailing whitespace                  | Whitespace is trimmed before building the search URL                    | Pass   |
| FE-149    | User submits the search form with an empty query                       | App navigates to the search page with an empty `q` parameter            | Pass   |
| FE-150    | User submits a query consisting only of whitespace                     | Query is treated as empty, same as submitting nothing                   | Pass   |
| FE-151    | User submits a query containing special characters                     | Special characters are properly URL-encoded in the resulting search URL | Pass   |

#### `usePerformance` Hook — Error Handling

| Test Case | Scenario                                               | Expected Result                                  | Status |
| --------- | ------------------------------------------------------ | ------------------------------------------------ | ------ |
| FE-152    | `usePerformance` hook is first invoked                 | Hook reports a loading state before data arrives | Pass   |
| FE-153    | The performance API responds with `success: false`     | Hook sets an error state                         | Pass   |
| FE-154    | The performance API request fails at the network level | Hook sets a generic error message                | Pass   |
| FE-155    | The performance API responds successfully with data    | Hook populates the performance data state        | Pass   |

#### DashboardMain — Performance Card UI

| Test Case | Scenario                                       | Expected Result                                          | Status |
| --------- | ---------------------------------------------- | -------------------------------------------------------- | ------ |
| FE-156    | DashboardMain performance card renders         | "Performance Summary" heading is displayed               | Pass   |
| FE-157    | The `/api/performance` request is in flight    | Skeleton loading placeholders are shown                  | Pass   |
| FE-158    | Performance data finishes loading              | All four stat labels are displayed                       | Pass   |
| FE-159    | Performance data loads successfully            | Stat values displayed match the data returned by the API | Pass   |
| FE-160    | Performance data fails to load (null)          | "—" placeholder dashes are shown in place of stat values | Pass   |
| FE-161    | User clicks the "View Your Performance" button | App navigates to `/dashboard/profile?tab=performance`    | Pass   |
| FE-162    | Performance card renders with a user avatar    | Avatar image renders with correct `alt` text             | Pass   |

#### DashCarousel — Section Rendering

| Test Case | Scenario                                        | Expected Result                                                                  | Status |
| --------- | ----------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| FE-163    | DashCarousel renders                            | "Featured" section heading is displayed                                          | Pass   |
| FE-164    | DashCarousel renders multiple category rows     | Mathematics, Technology, and Science category headings are all displayed         | Pass   |
| FE-165    | User views a category's "See More" link         | Link points to the search page pre-filtered by that category                     | Pass   |
| FE-166    | A category's quiz fetch request fails           | "Failed to load quizzes." error message is shown for that category               | Pass   |
| FE-167    | A category's quiz fetch returns an empty result | "No quizzes here yet." empty-state message is shown                              | Pass   |
| FE-168    | A category's quizzes load successfully          | Quiz cards render as buttons, each with a title attribute matching the quiz name | Pass   |

#### DashCarousel — QuizDetailModal

| Test Case | Scenario                                                       | Expected Result                                                        | Status |
| --------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | ------ |
| FE-169    | User clicks a quiz card in the carousel                        | QuizDetailModal opens                                                  | Pass   |
| FE-170    | QuizDetailModal opens for a quiz                               | Modal displays the quiz's title, creator, category, and question count | Pass   |
| FE-171    | QuizDetailModal opens                                          | Modal displays the quiz's description                                  | Pass   |
| FE-172    | User clicks the modal's close button                           | Modal closes                                                           | Pass   |
| FE-173    | User clicks the modal's backdrop overlay                       | Modal closes                                                           | Pass   |
| FE-174    | User clicks "Start Quiz" inside the modal                      | App navigates to the play route for that quiz's ID                     | Pass   |
| FE-175    | Modal's Questions tab is loading question data                 | Skeleton loading placeholders are shown                                | Pass   |
| FE-176    | Quiz has no questions                                          | "No questions yet." message is shown on the Questions tab              | Pass   |
| FE-177    | Question data loads successfully                               | Question text is listed on the Questions tab                           | Pass   |
| FE-178    | Quiz has no leaderboard entries                                | "No one has played this quiz yet." message is shown                    | Pass   |
| FE-179    | Leaderboard data exists for the quiz                           | Leaderboard entries with scores are listed                             | Pass   |
| FE-180    | User switches between the modal's tabs (Questions/Leaderboard) | Each tab displays its own correct content                              | Pass   |

#### DashNavbar — UI Behaviour

| Test Case | Scenario                                  | Expected Result                                    | Status |
| --------- | ----------------------------------------- | -------------------------------------------------- | ------ |
| FE-181    | DashNavbar renders                        | Logo component is displayed                        | Pass   |
| FE-182    | Guest (no user) opens the navbar dropdown | A "Login" option is shown                          | Pass   |
| FE-183    | Logged-in user opens the navbar dropdown  | Profile and Logout options are shown               | Pass   |
| FE-184    | Guest opens the navbar dropdown           | Profile and Logout options are not shown           | Pass   |
| FE-185    | User clicks the Profile option            | App navigates to `/dashboard/profile`              | Pass   |
| FE-186    | User clicks the Logout option             | `authClient.signOut` is called                     | Pass   |
| FE-187    | Logged-in user has no profile image       | Avatar falls back to displaying the user's initial | Pass   |
| FE-188    | Guest user (no account) views the navbar  | Avatar shows a "G" fallback                        | Pass   |

#### MobileBottomNav — UI Behaviour

| Test Case | Scenario                             | Expected Result                                                       | Status |
| --------- | ------------------------------------ | --------------------------------------------------------------------- | ------ |
| FE-189    | MobileBottomNav renders              | All four navigation items are displayed                               | Pass   |
| FE-190    | MobileBottomNav renders              | Home nav item links to `/dashboard`                                   | Pass   |
| FE-191    | MobileBottomNav renders              | Search nav item links to `/dashboard/search`                          | Pass   |
| FE-192    | Current route is `/dashboard/search` | The Search nav item receives the active `text-blue-600` styling class | Pass   |
| FE-193    | Current route matches one nav item   | All other (inactive) nav items do not have the `text-blue-600` class  | Pass   |

#### GridItems — Card Rendering

| Test Case | Scenario                          | Expected Result                       | Status |
| --------- | --------------------------------- | ------------------------------------- | ------ |
| FE-194    | A GridItems quiz card renders     | Quiz title is displayed               | Pass   |
| FE-195    | A quiz card renders               | Quiz description is displayed         | Pass   |
| FE-196    | A quiz card renders               | Category badge is displayed           | Pass   |
| FE-197    | A quiz card renders               | Question count badge is displayed     | Pass   |
| FE-198    | A quiz card renders with an image | Image renders with correct `alt` text | Pass   |
| FE-199    | A quiz has no `imageUrl` set      | A placeholder image is used instead   | Pass   |

#### GridItems — QuizDetailModal

| Test Case | Scenario                                  | Expected Result                                     | Status |
| --------- | ----------------------------------------- | --------------------------------------------------- | ------ |
| FE-200    | User clicks a quiz card button            | QuizDetailModal opens showing the quiz's title      | Pass   |
| FE-201    | Modal opens for a quiz                    | Creator's name is displayed                         | Pass   |
| FE-202    | Quiz has no `creatorName` set             | Modal displays "Anonymous" as a fallback            | Pass   |
| FE-203    | User clicks the modal's close button      | Modal closes                                        | Pass   |
| FE-204    | User clicks "Start Quiz" inside the modal | App navigates to `/play/<quizId>`                   | Pass   |
| FE-205    | Question data finishes loading            | Question text is displayed on the Questions tab     | Pass   |
| FE-206    | Question data fetch fails                 | "Failed to load questions." error message is shown  | Pass   |
| FE-207    | No leaderboard data exists                | "No one has played this quiz yet." message is shown | Pass   |
| FE-208    | Leaderboard data exists                   | Leaderboard entry is displayed                      | Pass   |

#### QuizSkeleton

| Test Case | Scenario                                 | Expected Result                          | Status |
| --------- | ---------------------------------------- | ---------------------------------------- | ------ |
| FE-209    | QuizSkeleton loading placeholder renders | Multiple Skeleton elements are displayed | Pass   |

### 10.1.5 Search Page — `searchpage_test.tsx`

#### Search Input & Filter Validation

| Test Case | Scenario                                                                    | Expected Result                                           | Status |
| --------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| FE-210    | User types fewer than 3 characters into the search box                      | "At least 3 characters" validation error is shown         | Pass   |
| FE-211    | User types exactly 3 characters                                             | No validation error is shown                              | Pass   |
| FE-212    | User presses Enter while focused on the search input                        | App navigates to the search results for that query        | Pass   |
| FE-213    | User presses a key other than Enter                                         | No navigation occurs                                      | Pass   |
| FE-214    | User clicks the "All" category pill                                         | Category tag filters are cleared from the URL             | Pass   |
| FE-215    | User clicks a specific category pill                                        | That category is added to the URL's filter parameters     | Pass   |
| FE-216    | User clicks a category pill that is already active                          | That category is removed from the URL's filter parameters | Pass   |
| FE-217    | User changes any filter (category, sort, etc.) while on a page other than 1 | The page parameter resets to 1                            | Pass   |
| FE-218    | URL contains an invalid/unrecognized sort parameter                         | Sort selector falls back to displaying "Newest"           | Pass   |
| FE-219    | A search query is active and returns results                                | A "Results for [query]" heading is displayed              | Pass   |
| FE-220    | No search query is active                                                   | The "Results for" heading is not displayed                | Pass   |

#### Fetch Error Handling

| Test Case | Scenario                                    | Expected Result                                     | Status |
| --------- | ------------------------------------------- | --------------------------------------------------- | ------ |
| FE-221    | The `getQuizzes` API call rejects/fails     | An error message is displayed                       | Pass   |
| FE-222    | The quiz fetch request fails                | No quiz cards are rendered                          | Pass   |
| FE-223    | The fetch succeeds but returns zero results | "No results found" empty-state message is displayed | Pass   |
| FE-224    | The quiz fetch request is still pending     | QuizSkeleton loading placeholders are shown         | Pass   |

#### Pagination Boundary Guards

| Test Case | Scenario                                                                | Expected Result                                        | Status |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| FE-225    | User is on page 1 of search results                                     | The Previous pagination link has disabled styling      | Pass   |
| FE-226    | User is on the last page of results                                     | The Next pagination link has disabled styling          | Pass   |
| FE-227    | User is on page 2 (not the first page)                                  | The Previous pagination link is enabled (not disabled) | Pass   |
| FE-228    | User clicks the Next pagination link                                    | App navigates to the next page of results              | Pass   |
| FE-229    | User clicks the Previous pagination link                                | App navigates to the previous page of results          | Pass   |
| FE-230    | URL contains a page parameter outside the valid range (e.g. `page=999`) | Component renders gracefully without crashing          | Pass   |

---

**Total test cases documented:** 230 (FE-001 – FE-230)
**Frameworks used:** Jest, React Testing Library, `@testing-library/user-event`, `jest-dom`
**Last updated:** June 16, 2026
