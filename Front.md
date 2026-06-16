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

| Test Case | Scenario                                               | Expected Result                                                        | Status      |
| --------- | ------------------------------------------------------ | ---------------------------------------------------------------------- | ----------- |
| FE-001    | Hero section is rendered on the landing page           | The brand name "PahamBos.id" headline is displayed                     | Pass / Fail |
| FE-002    | Hero section is rendered                               | The platform's descriptive paragraph is displayed beneath the headline | Pass / Fail |
| FE-003    | An unauthenticated (guest) user views the hero section | The call-to-action button links to `/register`                         | Pass / Fail |
| FE-004    | An authenticated user views the hero section           | The call-to-action button links to `/dashboard`                        | Pass / Fail |
| FE-005    | Hero section is rendered                               | The ArrowRight icon is displayed inside the CTA button                 | Pass / Fail |
| FE-006    | Hero section is rendered                               | The "Join us today" call-to-action copy is displayed                   | Pass / Fail |

#### Navbar

| Test Case | Scenario                                          | Expected Result                                                  | Status      |
| --------- | ------------------------------------------------- | ---------------------------------------------------------------- | ----------- |
| FE-007    | Navbar renders on a desktop viewport              | All section navigation buttons are displayed                     | Pass / Fail |
| FE-008    | Guest (unauthenticated) user views the navbar     | Register and Log In buttons are visible                          | Pass / Fail |
| FE-009    | Authenticated user views the navbar               | Register and Log In buttons are hidden                           | Pass / Fail |
| FE-010    | User clicks the Register button in the navbar     | App navigates to `/register`                                     | Pass / Fail |
| FE-011    | User clicks the Log In button in the navbar       | App navigates to `/login`                                        | Pass / Fail |
| FE-012    | User clicks the mobile burger menu icon           | The mobile navigation drawer opens, and clicking again closes it | Pass / Fail |
| FE-013    | User clicks one of the section nav buttons        | The page smooth-scrolls to the corresponding section             | Pass / Fail |
| FE-014    | Guest user views the navbar avatar                | Avatar displays the fallback letter "G"                          | Pass / Fail |
| FE-015    | Authenticated user views the navbar avatar        | Avatar displays the first letter of the user's name              | Pass / Fail |
| FE-016    | Authenticated user opens the avatar dropdown menu | Profile and Logout menu items are shown                          | Pass / Fail |

#### Create Section

| Test Case | Scenario                                 | Expected Result                                                  | Status      |
| --------- | ---------------------------------------- | ---------------------------------------------------------------- | ----------- |
| FE-017    | Create section renders                   | Heading "Create Your Own Quiz" is displayed                      | Pass / Fail |
| FE-018    | Create section renders                   | Introductory paragraph describing quiz creation is displayed     | Pass / Fail |
| FE-019    | Create section renders                   | All four feature bullet items are displayed                      | Pass / Fail |
| FE-020    | User clicks the "Create Now!" button     | App navigates to `/dashboard/create`                             | Pass / Fail |
| FE-021    | Create section renders                   | Demo video element is present with the correct video source      | Pass / Fail |
| FE-022    | Create section's demo video is inspected | Video element has `autoPlay`, `muted`, and `loop` attributes set | Pass / Fail |

#### Learn Section

| Test Case | Scenario                                 | Expected Result                                                  | Status      |
| --------- | ---------------------------------------- | ---------------------------------------------------------------- | ----------- |
| FE-023    | Learn section renders                    | Heading "Start To Learn" is displayed                            | Pass / Fail |
| FE-024    | Learn section renders                    | Introductory paragraph is displayed                              | Pass / Fail |
| FE-025    | Learn section renders                    | All four feature bullet items are displayed                      | Pass / Fail |
| FE-026    | User clicks the "Start Learning!" button | App navigates to `/dashboard/search`                             | Pass / Fail |
| FE-027    | Learn section renders                    | Demo video element is present with the correct video source      | Pass / Fail |
| FE-028    | Learn section's demo video is inspected  | Video element has `autoPlay`, `muted`, and `loop` attributes set | Pass / Fail |

#### Discover Section

| Test Case | Scenario                                        | Expected Result                                             | Status      |
| --------- | ----------------------------------------------- | ----------------------------------------------------------- | ----------- |
| FE-029    | Discover section renders                        | Section heading is displayed                                | Pass / Fail |
| FE-030    | Discover section renders                        | Sub-copy paragraph is displayed                             | Pass / Fail |
| FE-031    | Discover section renders with the category list | A CarouselItem is rendered for each of the 7 categories     | Pass / Fail |
| FE-032    | Discover section renders                        | Previous and Next carousel navigation buttons are displayed | Pass / Fail |

#### Category Component

| Test Case | Scenario                                                     | Expected Result                                                    | Status      |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------------ | ----------- |
| FE-033    | Category component renders with a category prop              | The category's name is displayed                                   | Pass / Fail |
| FE-034    | Category component renders                                   | Category image renders with the correct `src` and `alt` attributes | Pass / Fail |
| FE-035    | Discover section iterates over the exported categories array | Every category in the array is rendered                            | Pass / Fail |

#### BottomPage

| Test Case | Scenario                                 | Expected Result                                         | Status      |
| --------- | ---------------------------------------- | ------------------------------------------------------- | ----------- |
| FE-036    | BottomPage stats section renders         | Heading "The Numbers Speak for Themselves" is displayed | Pass / Fail |
| FE-037    | Stats section renders                    | "10000+" active users stat is displayed                 | Pass / Fail |
| FE-038    | Stats section renders                    | "500+" quizzes stat is displayed                        | Pass / Fail |
| FE-039    | Stats section renders                    | "7" categories stat is displayed                        | Pass / Fail |
| FE-040    | How It Works section renders             | Heading "How It Works" is displayed                     | Pass / Fail |
| FE-041    | How It Works section renders             | All three step numbers (01, 02, 03) are displayed       | Pass / Fail |
| FE-042    | How It Works section renders             | All three step titles are displayed                     | Pass / Fail |
| FE-043    | How It Works section renders             | All three step descriptions are displayed               | Pass / Fail |
| FE-044    | How It Works section renders             | Step images render with correct `alt` text              | Pass / Fail |
| FE-045    | Closing CTA section renders              | Heading "Ready to Start Learning?" is displayed         | Pass / Fail |
| FE-046    | Closing CTA section renders              | "Join thousands of students" copy is displayed          | Pass / Fail |
| FE-047    | Guest user views the closing CTA         | "Get Started Free" button links to `/register`          | Pass / Fail |
| FE-048    | Authenticated user views the closing CTA | "Get Started Free" button links to `/dashboard`         | Pass / Fail |
| FE-049    | User views the closing CTA               | "Browse Quizzes" button links to `/dashboard/search`    | Pass / Fail |
| FE-050    | BottomPage renders                       | Three FadeInSection scroll-reveal wrappers are present  | Pass / Fail |

#### FadeInSection (Real Implementation)

| Test Case | Scenario                                                              | Expected Result                                                     | Status      |
| --------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------- |
| FE-051    | FadeInSection wraps child content                                     | Children render inside a `<section>` HTML element                   | Pass / Fail |
| FE-052    | FadeInSection mounts before entering the viewport                     | The section does not yet have the `reveal-visible` class            | Pass / Fail |
| FE-053    | IntersectionObserver reports the element entering the viewport        | `reveal-visible` class is added to the section                      | Pass / Fail |
| FE-054    | Element becomes visible with the default `once=true` behaviour        | `observer.unobserve` is called so the element only animates once    | Pass / Fail |
| FE-055    | FadeInSection is given a `direction="left"` prop and becomes visible  | `reveal-left` class is applied                                      | Pass / Fail |
| FE-056    | FadeInSection is given a `direction="right"` prop and becomes visible | `reveal-right` class is applied                                     | Pass / Fail |
| FE-057    | FadeInSection uses the default direction ("up")                       | No left/right directional class is applied                          | Pass / Fail |
| FE-058    | `once=false` and the element leaves the viewport after being visible  | `reveal-visible` class is removed                                   | Pass / Fail |
| FE-059    | FadeInSection component unmounts                                      | `IntersectionObserver.disconnect` is called to prevent memory leaks | Pass / Fail |
| FE-060    | A custom `className` prop is passed to FadeInSection                  | The class name is forwarded to the underlying `<section>` element   | Pass / Fail |

#### Logo

| Test Case | Scenario               | Expected Result                                  | Status      |
| --------- | ---------------------- | ------------------------------------------------ | ----------- |
| FE-061    | Logo component renders | Logo `<img>` element is displayed                | Pass / Fail |
| FE-062    | Logo component renders | Image `src` points to `/logo.svg`                | Pass / Fail |
| FE-063    | Logo component renders | Image width and height attributes both equal 100 | Pass / Fail |

### 10.1.3 Create Quiz Page — `createquiz_test.tsx`

#### Form Validation — `validateForm`: Title

| Test Case | Scenario                                       | Expected Result                            | Status      |
| --------- | ---------------------------------------------- | ------------------------------------------ | ----------- |
| FE-064    | Form is validated with a non-empty title       | No title error is returned                 | Pass / Fail |
| FE-065    | Form is validated with an empty title          | "Quiz title is required" error is returned | Pass / Fail |
| FE-066    | Form is validated with a whitespace-only title | "Quiz title is required" error is returned | Pass / Fail |

#### Form Validation — `validateForm`: Category

| Test Case | Scenario                                    | Expected Result                              | Status      |
| --------- | ------------------------------------------- | -------------------------------------------- | ----------- |
| FE-067    | Form is validated with a category selected  | No category error is returned                | Pass / Fail |
| FE-068    | Form is validated with no category selected | "Please select a category" error is returned | Pass / Fail |

#### Form Validation — `validateForm`: Minimum Questions

| Test Case | Scenario                                     | Expected Result                                                 | Status      |
| --------- | -------------------------------------------- | --------------------------------------------------------------- | ----------- |
| FE-069    | Form is validated with exactly two questions | No `questionsError` is returned                                 | Pass / Fail |
| FE-070    | Form is validated with zero questions        | `questionsError` requiring "at least two" questions is returned | Pass / Fail |
| FE-071    | Form is validated with only one question     | `questionsError` requiring "at least two" questions is returned | Pass / Fail |
| FE-072    | Form is validated with three questions       | No `questionsError` is returned                                 | Pass / Fail |

#### Form Validation — `validateForm`: Question Prompt

| Test Case | Scenario                                   | Expected Result                                                   | Status      |
| --------- | ------------------------------------------ | ----------------------------------------------------------------- | ----------- |
| FE-073    | A question has an empty prompt             | "Question prompt is required" error is returned for that question | Pass / Fail |
| FE-074    | A question prompt contains only whitespace | A "required" error is returned for that question                  | Pass / Fail |
| FE-075    | A question has a valid, non-empty prompt   | No prompt error is returned                                       | Pass / Fail |

#### Form Validation — `validateForm`: Answer Options

| Test Case | Scenario                                          | Expected Result                                                                  | Status      |
| --------- | ------------------------------------------------- | -------------------------------------------------------------------------------- | ----------- |
| FE-076    | A question has fewer than 2 filled answer options | "At least 2" answers error is returned                                           | Pass / Fail |
| FE-077    | A question has an empty answers array             | "At least 2" answers error is returned                                           | Pass / Fail |
| FE-078    | A question has exactly 2 valid filled answers     | No answer error is returned                                                      | Pass / Fail |
| FE-079    | Some answer options contain only whitespace       | Whitespace-only answers aren't counted, so the "at least 2" error still triggers | Pass / Fail |

#### Form Validation — `validateForm`: Correct Answers (Single-Select)

| Test Case | Scenario                                                       | Expected Result                                | Status      |
| --------- | -------------------------------------------------------------- | ---------------------------------------------- | ----------- |
| FE-080    | A single-select question has exactly one correct answer marked | No `correctAnswers` error is returned          | Pass / Fail |
| FE-081    | A single-select question has zero correct answers marked       | "Exactly one" correct answer error is returned | Pass / Fail |
| FE-082    | A single-select question has two correct answers marked        | "Exactly one" correct answer error is returned | Pass / Fail |

#### Form Validation — `validateForm`: Correct Answers (Multi-Select)

| Test Case | Scenario                                                       | Expected Result                                 | Status      |
| --------- | -------------------------------------------------------------- | ----------------------------------------------- | ----------- |
| FE-083    | A multi-select question has at least one correct answer marked | No `correctAnswers` error is returned           | Pass / Fail |
| FE-084    | A multi-select question has zero correct answers marked        | "At least one" correct answer error is returned | Pass / Fail |
| FE-085    | A multi-select question has several correct answers marked     | No `correctAnswers` error is returned           | Pass / Fail |

#### Form Validation — `validateForm`: Multiple Errors

| Test Case | Scenario                                                        | Expected Result                                                                      | Status      |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----------- |
| FE-086    | Title, category, and questions are all invalid at the same time | All three top-level errors (title, category, `questionsError`) are returned together | Pass / Fail |
| FE-087    | Multiple questions each have a different validation issue       | Errors are returned keyed by each question's `order` index                           | Pass / Fail |

#### Draft System — `formFingerprint`

| Test Case | Scenario                                                           | Expected Result                                      | Status      |
| --------- | ------------------------------------------------------------------ | ---------------------------------------------------- | ----------- |
| FE-088    | Two forms with identical content are fingerprinted                 | Both produce the same fingerprint                    | Pass / Fail |
| FE-089    | Two forms differ only by letter casing in title/description        | Fingerprints match (case-insensitive)                | Pass / Fail |
| FE-090    | Two forms differ only by leading/trailing whitespace               | Fingerprints match (whitespace trimmed)              | Pass / Fail |
| FE-091    | Two forms have different titles                                    | Fingerprints differ                                  | Pass / Fail |
| FE-092    | A question's prompt text differs between two forms                 | Fingerprints differ                                  | Pass / Fail |
| FE-093    | Two forms have the same correct answers in a different array order | Fingerprints match (`[0,1]` === `[1,0]`)             | Pass / Fail |
| FE-094    | Legacy data stores `correctAnswers` as a boolean                   | Fingerprint generation does not throw an error       | Pass / Fail |
| FE-095    | Legacy data stores `correctAnswers` as a string                    | Fingerprint generation does not throw an error       | Pass / Fail |
| FE-096    | Two otherwise-identical forms are fingerprinted at different times | Fingerprints differ because a time field is included | Pass / Fail |

#### Draft System — `saveDraftToSlot`

| Test Case | Scenario                                                    | Expected Result                                     | Status      |
| --------- | ----------------------------------------------------------- | --------------------------------------------------- | ----------- |
| FE-097    | A new draft is saved to an empty slot                       | Function returns status `"saved"`                   | Pass / Fail |
| FE-098    | A draft is saved                                            | Draft data is persisted in `localStorage`           | Pass / Fail |
| FE-099    | A draft is saved to a slot that already contains a draft    | The existing draft in that slot is overwritten      | Pass / Fail |
| FE-100    | An identical draft already exists in a different slot       | Function returns status `"duplicate"`               | Pass / Fail |
| FE-101    | All 3 slots are full and a new, non-matching draft is saved | Function returns status `"error"`                   | Pass / Fail |
| FE-102    | Multiple drafts are saved                                   | Each draft is assigned a unique `draftId`           | Pass / Fail |
| FE-103    | A draft is saved                                            | A `savedAt` field with an ISO timestamp is recorded | Pass / Fail |

#### Draft System — `deleteDraftBySlot`

| Test Case | Scenario                                        | Expected Result                      | Status      |
| --------- | ----------------------------------------------- | ------------------------------------ | ----------- |
| FE-104    | A specific slot's draft is deleted              | Only that slot's draft is removed    | Pass / Fail |
| FE-105    | One slot's draft is deleted while others remain | Drafts in other slots are unaffected | Pass / Fail |

#### Draft System — `getDrafts`

| Test Case | Scenario                                         | Expected Result                                        | Status      |
| --------- | ------------------------------------------------ | ------------------------------------------------------ | ----------- |
| FE-106    | `localStorage` contains no draft data            | `getDrafts` returns an empty array                     | Pass / Fail |
| FE-107    | `localStorage` contains corrupted/malformed JSON | `getDrafts` returns an empty array instead of throwing | Pass / Fail |
| FE-108    | `localStorage` contains valid draft JSON         | `getDrafts` returns the correctly parsed drafts        | Pass / Fail |

#### AI Tool Calls — `applyToolCalls`: `add_question`

| Test Case | Scenario                                                 | Expected Result                                               | Status      |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------- | ----------- |
| FE-109    | An `add_question` tool call is applied                   | New question is appended to the end of the question list      | Pass / Fail |
| FE-110    | A new question is added with fewer than 4 answer options | Answers array is padded with empty strings to exactly 4 items | Pass / Fail |
| FE-111    | A new question is added to an existing list              | New question's `order` equals the prior list length           | Pass / Fail |

#### AI Tool Calls — `applyToolCalls`: `edit_question`

| Test Case | Scenario                                                       | Expected Result                                        | Status      |
| --------- | -------------------------------------------------------------- | ------------------------------------------------------ | ----------- |
| FE-112    | An `edit_question` call targets one specific question by order | Only that question is patched; others remain unchanged | Pass / Fail |
| FE-113    | An existing question is edited                                 | Total question count remains the same                  | Pass / Fail |
| FE-114    | `edit_question` targets a non-existent order index             | No question is modified (no-op)                        | Pass / Fail |

#### AI Tool Calls — `applyToolCalls`: `remove_question`

| Test Case | Scenario                                                | Expected Result                                            | Status      |
| --------- | ------------------------------------------------------- | ---------------------------------------------------------- | ----------- |
| FE-115    | A `remove_question` call targets a specific question    | That question is removed from the list                     | Pass / Fail |
| FE-116    | A question is removed from the middle/start of the list | Remaining questions are re-indexed starting from `order` 0 | Pass / Fail |
| FE-117    | `remove_question` targets a non-existent order index    | List remains unchanged (no-op)                             | Pass / Fail |

#### AI Tool Calls — `applyToolCalls`: `reorder_questions`

| Test Case | Scenario                                              | Expected Result                                                         | Status      |
| --------- | ----------------------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| FE-118    | A `reorder_questions` call provides a new order array | Questions are rearranged to match the new order                         | Pass / Fail |
| FE-119    | Questions are reordered                               | Each question's `order` property is updated to reflect its new position | Pass / Fail |
| FE-120    | Questions are reordered                               | Total question count remains unchanged                                  | Pass / Fail |

#### AI Tool Calls — `applyToolCalls`: Sequential Calls

| Test Case | Scenario                                                              | Expected Result                                                         | Status      |
| --------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| FE-121    | Several AI tool calls (e.g. add, then remove) are applied in sequence | Each call is applied in order, producing the cumulative expected result | Pass / Fail |

#### DraftPopup — UI Behaviour

| Test Case | Scenario                                                        | Expected Result                                                    | Status      |
| --------- | --------------------------------------------------------------- | ------------------------------------------------------------------ | ----------- |
| FE-122    | DraftPopup is opened                                            | All three draft slot labels ("Slot 1 — empty", etc.) are rendered  | Pass / Fail |
| FE-123    | DraftPopup opens with no saved drafts                           | "0 of 3 slots used" counter is displayed                           | Pass / Fail |
| FE-124    | User presses the Escape key while the popup is open             | `onClose` callback is triggered                                    | Pass / Fail |
| FE-125    | User clicks the × close button                                  | `onClose` callback is triggered                                    | Pass / Fail |
| FE-126    | User clicks the dialog's backdrop overlay (not a child element) | `onClose` callback is triggered                                    | Pass / Fail |
| FE-127    | User clicks an empty slot to save the current form              | Draft is saved and the slot counter updates to "1 of 3 slots used" | Pass / Fail |
| FE-128    | An identical form is saved to a second slot                     | A "duplicate draft detected" warning is shown                      | Pass / Fail |
| FE-129    | User clicks the × on the duplicate warning                      | The warning is dismissed and removed from view                     | Pass / Fail |
| FE-130    | User clicks a filled draft slot                                 | `onLoad` and `onClose` callbacks are both triggered                | Pass / Fail |
| FE-131    | User clicks the Delete button on a filled slot                  | Draft is removed and the slot count updates accordingly            | Pass / Fail |
| FE-132    | A slot contains a saved draft                                   | The slot displays the draft's title and number of questions        | Pass / Fail |

#### CreatePage — API States

| Test Case | Scenario                                            | Expected Result                                                    | Status      |
| --------- | --------------------------------------------------- | ------------------------------------------------------------------ | ----------- |
| FE-133    | The user-info API call fails                        | "Something went wrong loading your quizzes" error message is shown | Pass / Fail |
| FE-134    | User has zero saved quizzes                         | "No quizzes yet" empty state is shown                              | Pass / Fail |
| FE-135    | The quiz data request is still in flight            | Loading skeleton placeholders are displayed                        | Pass / Fail |
| FE-136    | User clicks the "Create Quiz" button                | App navigates to `/create-quiz`                                    | Pass / Fail |
| FE-137    | Quiz data loads successfully with at least one quiz | Quiz cards are rendered with the correct data                      | Pass / Fail |

#### DeleteConfirmDialog — UI Behaviour

| Test Case | Scenario                                                  | Expected Result                                             | Status      |
| --------- | --------------------------------------------------------- | ----------------------------------------------------------- | ----------- |
| FE-138    | User clicks "Delete Quiz" on a quiz card                  | A confirmation dialog appears showing the quiz name         | Pass / Fail |
| FE-139    | User clicks Cancel in the delete confirmation dialog      | Dialog closes without deleting                              | Pass / Fail |
| FE-140    | User confirms deletion and the delete API call is pending | A loading spinner appears and the Cancel button is disabled | Pass / Fail |
| FE-141    | Delete API call succeeds                                  | Quiz is removed from the list and the dialog closes         | Pass / Fail |

### 10.1.4 Dashboard Components — `dashboardComp_test.tsx`

#### `dashboardHref` Utility

| Test Case | Scenario                                                                  | Expected Result                                     | Status      |
| --------- | ------------------------------------------------------------------------- | --------------------------------------------------- | ----------- |
| FE-142    | `dashboardHref` is called with an empty path string                       | Returns `/dashboard`                                | Pass / Fail |
| FE-143    | `dashboardHref` is called with `/`                                        | Returns `/dashboard`                                | Pass / Fail |
| FE-144    | `dashboardHref` is called with a sub-path (e.g. `/search`)                | Returns the correctly prefixed dashboard sub-path   | Pass / Fail |
| FE-145    | `dashboardHref` is called with a path containing multiple leading slashes | Extra leading slashes are stripped before prefixing | Pass / Fail |
| FE-146    | `dashboardHref` is called with a path that includes a query string        | The query string is preserved in the returned URL   | Pass / Fail |

#### DashNavbar — Search Form Validation

| Test Case | Scenario                                                               | Expected Result                                                         | Status      |
| --------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------- |
| FE-147    | User types a search query and submits the dashboard navbar search form | App navigates to the search page with the query in the URL              | Pass / Fail |
| FE-148    | User submits a query with leading/trailing whitespace                  | Whitespace is trimmed before building the search URL                    | Pass / Fail |
| FE-149    | User submits the search form with an empty query                       | App navigates to the search page with an empty `q` parameter            | Pass / Fail |
| FE-150    | User submits a query consisting only of whitespace                     | Query is treated as empty, same as submitting nothing                   | Pass / Fail |
| FE-151    | User submits a query containing special characters                     | Special characters are properly URL-encoded in the resulting search URL | Pass / Fail |

#### `usePerformance` Hook — Error Handling

| Test Case | Scenario                                               | Expected Result                                  | Status      |
| --------- | ------------------------------------------------------ | ------------------------------------------------ | ----------- |
| FE-152    | `usePerformance` hook is first invoked                 | Hook reports a loading state before data arrives | Pass / Fail |
| FE-153    | The performance API responds with `success: false`     | Hook sets an error state                         | Pass / Fail |
| FE-154    | The performance API request fails at the network level | Hook sets a generic error message                | Pass / Fail |
| FE-155    | The performance API responds successfully with data    | Hook populates the performance data state        | Pass / Fail |

#### DashboardMain — Performance Card UI

| Test Case | Scenario                                       | Expected Result                                          | Status      |
| --------- | ---------------------------------------------- | -------------------------------------------------------- | ----------- |
| FE-156    | DashboardMain performance card renders         | "Performance Summary" heading is displayed               | Pass / Fail |
| FE-157    | The `/api/performance` request is in flight    | Skeleton loading placeholders are shown                  | Pass / Fail |
| FE-158    | Performance data finishes loading              | All four stat labels are displayed                       | Pass / Fail |
| FE-159    | Performance data loads successfully            | Stat values displayed match the data returned by the API | Pass / Fail |
| FE-160    | Performance data fails to load (null)          | "—" placeholder dashes are shown in place of stat values | Pass / Fail |
| FE-161    | User clicks the "View Your Performance" button | App navigates to `/dashboard/profile?tab=performance`    | Pass / Fail |
| FE-162    | Performance card renders with a user avatar    | Avatar image renders with correct `alt` text             | Pass / Fail |

#### DashCarousel — Section Rendering

| Test Case | Scenario                                        | Expected Result                                                                  | Status      |
| --------- | ----------------------------------------------- | -------------------------------------------------------------------------------- | ----------- |
| FE-163    | DashCarousel renders                            | "Featured" section heading is displayed                                          | Pass / Fail |
| FE-164    | DashCarousel renders multiple category rows     | Mathematics, Technology, and Science category headings are all displayed         | Pass / Fail |
| FE-165    | User views a category's "See More" link         | Link points to the search page pre-filtered by that category                     | Pass / Fail |
| FE-166    | A category's quiz fetch request fails           | "Failed to load quizzes." error message is shown for that category               | Pass / Fail |
| FE-167    | A category's quiz fetch returns an empty result | "No quizzes here yet." empty-state message is shown                              | Pass / Fail |
| FE-168    | A category's quizzes load successfully          | Quiz cards render as buttons, each with a title attribute matching the quiz name | Pass / Fail |

#### DashCarousel — QuizDetailModal

| Test Case | Scenario                                                       | Expected Result                                                        | Status      |
| --------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------- |
| FE-169    | User clicks a quiz card in the carousel                        | QuizDetailModal opens                                                  | Pass / Fail |
| FE-170    | QuizDetailModal opens for a quiz                               | Modal displays the quiz's title, creator, category, and question count | Pass / Fail |
| FE-171    | QuizDetailModal opens                                          | Modal displays the quiz's description                                  | Pass / Fail |
| FE-172    | User clicks the modal's close button                           | Modal closes                                                           | Pass / Fail |
| FE-173    | User clicks the modal's backdrop overlay                       | Modal closes                                                           | Pass / Fail |
| FE-174    | User clicks "Start Quiz" inside the modal                      | App navigates to the play route for that quiz's ID                     | Pass / Fail |
| FE-175    | Modal's Questions tab is loading question data                 | Skeleton loading placeholders are shown                                | Pass / Fail |
| FE-176    | Quiz has no questions                                          | "No questions yet." message is shown on the Questions tab              | Pass / Fail |
| FE-177    | Question data loads successfully                               | Question text is listed on the Questions tab                           | Pass / Fail |
| FE-178    | Quiz has no leaderboard entries                                | "No one has played this quiz yet." message is shown                    | Pass / Fail |
| FE-179    | Leaderboard data exists for the quiz                           | Leaderboard entries with scores are listed                             | Pass / Fail |
| FE-180    | User switches between the modal's tabs (Questions/Leaderboard) | Each tab displays its own correct content                              | Pass / Fail |

#### DashNavbar — UI Behaviour

| Test Case | Scenario                                  | Expected Result                                    | Status      |
| --------- | ----------------------------------------- | -------------------------------------------------- | ----------- |
| FE-181    | DashNavbar renders                        | Logo component is displayed                        | Pass / Fail |
| FE-182    | Guest (no user) opens the navbar dropdown | A "Login" option is shown                          | Pass / Fail |
| FE-183    | Logged-in user opens the navbar dropdown  | Profile and Logout options are shown               | Pass / Fail |
| FE-184    | Guest opens the navbar dropdown           | Profile and Logout options are not shown           | Pass / Fail |
| FE-185    | User clicks the Profile option            | App navigates to `/dashboard/profile`              | Pass / Fail |
| FE-186    | User clicks the Logout option             | `authClient.signOut` is called                     | Pass / Fail |
| FE-187    | Logged-in user has no profile image       | Avatar falls back to displaying the user's initial | Pass / Fail |
| FE-188    | Guest user (no account) views the navbar  | Avatar shows a "G" fallback                        | Pass / Fail |

#### MobileBottomNav — UI Behaviour

| Test Case | Scenario                             | Expected Result                                                       | Status      |
| --------- | ------------------------------------ | --------------------------------------------------------------------- | ----------- |
| FE-189    | MobileBottomNav renders              | All four navigation items are displayed                               | Pass / Fail |
| FE-190    | MobileBottomNav renders              | Home nav item links to `/dashboard`                                   | Pass / Fail |
| FE-191    | MobileBottomNav renders              | Search nav item links to `/dashboard/search`                          | Pass / Fail |
| FE-192    | Current route is `/dashboard/search` | The Search nav item receives the active `text-blue-600` styling class | Pass / Fail |
| FE-193    | Current route matches one nav item   | All other (inactive) nav items do not have the `text-blue-600` class  | Pass / Fail |

#### GridItems — Card Rendering

| Test Case | Scenario                          | Expected Result                       | Status      |
| --------- | --------------------------------- | ------------------------------------- | ----------- |
| FE-194    | A GridItems quiz card renders     | Quiz title is displayed               | Pass / Fail |
| FE-195    | A quiz card renders               | Quiz description is displayed         | Pass / Fail |
| FE-196    | A quiz card renders               | Category badge is displayed           | Pass / Fail |
| FE-197    | A quiz card renders               | Question count badge is displayed     | Pass / Fail |
| FE-198    | A quiz card renders with an image | Image renders with correct `alt` text | Pass / Fail |
| FE-199    | A quiz has no `imageUrl` set      | A placeholder image is used instead   | Pass / Fail |

#### GridItems — QuizDetailModal

| Test Case | Scenario                                  | Expected Result                                     | Status      |
| --------- | ----------------------------------------- | --------------------------------------------------- | ----------- |
| FE-200    | User clicks a quiz card button            | QuizDetailModal opens showing the quiz's title      | Pass / Fail |
| FE-201    | Modal opens for a quiz                    | Creator's name is displayed                         | Pass / Fail |
| FE-202    | Quiz has no `creatorName` set             | Modal displays "Anonymous" as a fallback            | Pass / Fail |
| FE-203    | User clicks the modal's close button      | Modal closes                                        | Pass / Fail |
| FE-204    | User clicks "Start Quiz" inside the modal | App navigates to `/play/<quizId>`                   | Pass / Fail |
| FE-205    | Question data finishes loading            | Question text is displayed on the Questions tab     | Pass / Fail |
| FE-206    | Question data fetch fails                 | "Failed to load questions." error message is shown  | Pass / Fail |
| FE-207    | No leaderboard data exists                | "No one has played this quiz yet." message is shown | Pass / Fail |
| FE-208    | Leaderboard data exists                   | Leaderboard entry is displayed                      | Pass / Fail |

#### QuizSkeleton

| Test Case | Scenario                                 | Expected Result                          | Status      |
| --------- | ---------------------------------------- | ---------------------------------------- | ----------- |
| FE-209    | QuizSkeleton loading placeholder renders | Multiple Skeleton elements are displayed | Pass / Fail |

### 10.1.5 Search Page — `searchpage_test.tsx`

#### Search Input & Filter Validation

| Test Case | Scenario                                                                    | Expected Result                                           | Status      |
| --------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | ----------- |
| FE-210    | User types fewer than 3 characters into the search box                      | "At least 3 characters" validation error is shown         | Pass / Fail |
| FE-211    | User types exactly 3 characters                                             | No validation error is shown                              | Pass / Fail |
| FE-212    | User presses Enter while focused on the search input                        | App navigates to the search results for that query        | Pass / Fail |
| FE-213    | User presses a key other than Enter                                         | No navigation occurs                                      | Pass / Fail |
| FE-214    | User clicks the "All" category pill                                         | Category tag filters are cleared from the URL             | Pass / Fail |
| FE-215    | User clicks a specific category pill                                        | That category is added to the URL's filter parameters     | Pass / Fail |
| FE-216    | User clicks a category pill that is already active                          | That category is removed from the URL's filter parameters | Pass / Fail |
| FE-217    | User changes any filter (category, sort, etc.) while on a page other than 1 | The page parameter resets to 1                            | Pass / Fail |
| FE-218    | URL contains an invalid/unrecognized sort parameter                         | Sort selector falls back to displaying "Newest"           | Pass / Fail |
| FE-219    | A search query is active and returns results                                | A "Results for [query]" heading is displayed              | Pass / Fail |
| FE-220    | No search query is active                                                   | The "Results for" heading is not displayed                | Pass / Fail |

#### Fetch Error Handling

| Test Case | Scenario                                    | Expected Result                                     | Status      |
| --------- | ------------------------------------------- | --------------------------------------------------- | ----------- |
| FE-221    | The `getQuizzes` API call rejects/fails     | An error message is displayed                       | Pass / Fail |
| FE-222    | The quiz fetch request fails                | No quiz cards are rendered                          | Pass / Fail |
| FE-223    | The fetch succeeds but returns zero results | "No results found" empty-state message is displayed | Pass / Fail |
| FE-224    | The quiz fetch request is still pending     | QuizSkeleton loading placeholders are shown         | Pass / Fail |

#### Pagination Boundary Guards

| Test Case | Scenario                                                                | Expected Result                                        | Status      |
| --------- | ----------------------------------------------------------------------- | ------------------------------------------------------ | ----------- |
| FE-225    | User is on page 1 of search results                                     | The Previous pagination link has disabled styling      | Pass / Fail |
| FE-226    | User is on the last page of results                                     | The Next pagination link has disabled styling          | Pass / Fail |
| FE-227    | User is on page 2 (not the first page)                                  | The Previous pagination link is enabled (not disabled) | Pass / Fail |
| FE-228    | User clicks the Next pagination link                                    | App navigates to the next page of results              | Pass / Fail |
| FE-229    | User clicks the Previous pagination link                                | App navigates to the previous page of results          | Pass / Fail |
| FE-230    | URL contains a page parameter outside the valid range (e.g. `page=999`) | Component renders gracefully without crashing          | Pass / Fail |

---

**Total test cases documented:** 230 (FE-001 – FE-230)
**Frameworks used:** Jest, React Testing Library, `@testing-library/user-event`, `jest-dom`
**Last updated:** June 16, 2026
