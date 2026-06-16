# Frontend Testing

This document records all automated frontend test cases covering the **Profile Card (Account Settings)**, **Classroom Page**, and **Quiz Interface** components, based on `profileCard_test.tsx`, `ClassPage_test.tsx`, and `QuizInterface_test.tsx`. All test cases below executed successfully on the latest test run.

---

## 10.1 Frontend Testing — Profile Card (Account Settings)

_Source: `profileCard_test.tsx` — Component: `AccountCard`_

| Test Case | Scenario                                                            | Expected Result                                                                     | Status |
| --------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------ |
| PC-01     | User views the account page tab bar                                 | Profile, Security, and Performance tabs are all visible in the tab bar              | Pass   |
| PC-02     | User opens the account page without a tab query parameter           | Profile tab is shown by default, displaying Username and Email fields               | Pass   |
| PC-03     | User's profile has no avatar image set                              | Initials ("JD") are displayed in place of an avatar image                           | Pass   |
| PC-04     | User's profile includes an avatar image URL                         | Avatar `<img>` renders with the original image URL encoded in its src               | Pass   |
| PC-05     | User views the Email address field                                  | Email field has the readonly attribute and cannot be edited                         | Pass   |
| PC-06     | User opens the Profile tab                                          | Username and Email fields are pre-filled with the user's existing name and email    | Pass   |
| PC-07     | User clicks the Security tab                                        | Router is called with a URL containing `tab=security`                               | Pass   |
| PC-08     | User clicks the Performance tab                                     | Router is called with a URL containing `tab=performance`                            | Pass   |
| PC-09     | User navigates directly to `?tab=security`                          | Current password, New password, and Confirm new password fields are displayed       | Pass   |
| PC-10     | User on the Security tab clicks the Profile tab                     | Router is called with a URL containing `tab=profile`                                | Pass   |
| PC-11     | User clicks the edit-username button                                | Username input becomes editable (readonly attribute removed)                        | Pass   |
| PC-12     | User edits the username then clicks Cancel                          | Username field reverts to the original value ("Jane Doe")                           | Pass   |
| PC-13     | User edits and saves a new username                                 | PATCH `/api/user` is called and a "username updated" success message is shown       | Pass   |
| PC-14     | Username save request fails on the server                           | A browser alert notifies the user of the failure                                    | Pass   |
| PC-15     | User enters a new password and confirmation that don't match        | Error message indicating the passwords "do not match" is shown                      | Pass   |
| PC-16     | User enters a new password shorter than 8 characters                | Error message indicating the password must be "at least 8 characters" is shown      | Pass   |
| PC-17     | User submits a valid current/new/confirm password combination       | PATCH `/api/user/change-password` is called                                         | Pass   |
| PC-18     | Password change API returns an error (e.g., wrong current password) | Server's error message ("Incorrect current password.") is displayed                 | Pass   |
| PC-19     | User clicks the eye icon on the current password field              | Field input type toggles between "password" and "text" on each click                | Pass   |
| PC-20     | New password field is empty                                         | No strength label (Weak/Fair/Good/Strong) is shown                                  | Pass   |
| PC-21     | User enters a short, simple new password ("abcdefgh")               | Strength bar displays "Weak"                                                        | Pass   |
| PC-22     | User enters a complex new password ("Abcdef1!")                     | Strength bar displays "Strong"                                                      | Pass   |
| PC-23     | User selects an image file for their avatar                         | "Adjust profile photo" crop modal opens                                             | Pass   |
| PC-24     | User opens the crop modal then clicks Cancel                        | Crop modal closes without saving an image                                           | Pass   |
| PC-25     | User crops and applies a new avatar image                           | PUT `/api/user` is called to save the new avatar                                    | Pass   |
| PC-26     | Performance tab loads with quiz history records                     | Table shows score, accuracy %, longest streak, and formatted time per record        | Pass   |
| PC-27     | Performance tab loads with no quiz records                          | "No quiz history yet — go take a quiz!" message is displayed                        | Pass   |
| PC-28     | Performance records API call fails                                  | "Failed to load performance records" error message is shown                         | Pass   |
| PC-29     | Performance data spans more than one page                           | Prev/Next pagination controls render, with Prev disabled on page 1 and Next enabled | Pass   |
| PC-30     | User clicks "Next →" on the performance table                       | Router is called with a URL containing `page=2`                                     | Pass   |
| PC-31     | A quiz record has a decimal accuracyRate (e.g., 0.75)               | Accuracy is displayed as a whole percentage ("75%")                                 | Pass   |
| PC-32     | A quiz record has timeTaken of 0 ms                                 | Time column displays "0s"                                                           | Pass   |
| PC-33     | A quiz record has timeTaken under one minute (45000 ms)             | Time column displays "45s"                                                          | Pass   |

---

## 10.2 Frontend Testing — Classroom Page

_Source: `ClassPage_test.tsx` — Component: `ClassroomPage`_

| Test Case | Scenario                                                              | Expected Result                                                                            | Status |
| --------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------ |
| CP-01     | User opens the Classroom page                                         | "My Classes" and "Joined Classes" section headers are displayed                            | Pass   |
| CP-02     | Class data is still being fetched                                     | Skeleton loader placeholders are visible on screen                                         | Pass   |
| CP-03     | Owned and joined classes finish loading                               | Both "Mathematics 101" (owned) and "Science 202" (joined) cards are displayed              | Pass   |
| CP-04     | User views an owned class card                                        | An "Educator" badge is shown on the card                                                   | Pass   |
| CP-05     | User views a joined class card                                        | A "Learner" badge is shown on the card                                                     | Pass   |
| CP-06     | The classes API call fails (server error)                             | "Server unavailable" error banner is displayed                                             | Pass   |
| CP-07     | User has no owned or joined classes                                   | "No classes yet" empty-state message is displayed                                          | Pass   |
| CP-08     | User clicks "New Class"                                               | "New Class" overlay opens with a heading and name input                                    | Pass   |
| CP-09     | User opens Create Class overlay without typing a name                 | "Create Class" button is disabled                                                          | Pass   |
| CP-10     | User types a class name into the Create Class overlay                 | "Create Class" button becomes enabled                                                      | Pass   |
| CP-11     | User submits a valid new class name                                   | POST `/api/class` is called and the new class card ("Physics 303") appears; overlay closes | Pass   |
| CP-12     | Class creation request fails (e.g., duplicate name)                   | "Name already taken" error banner is displayed                                             | Pass   |
| CP-13     | User clicks outside the Create Class overlay                          | Overlay closes without creating a class                                                    | Pass   |
| CP-14     | User clicks "Join Class"                                              | Join overlay opens with a "paste the classroom ID" input                                   | Pass   |
| CP-15     | User opens Join Class overlay without entering an ID                  | "Join Class" submit button is disabled                                                     | Pass   |
| CP-16     | User enters a valid class ID and submits                              | "Joined successfully" message appears and the joined class card is added to the list       | Pass   |
| CP-17     | User enters an invalid/unknown class ID                               | "Classroom not found" error banner is displayed                                            | Pass   |
| CP-18     | User dismisses a join error banner via the ✕ button                   | Error banner is removed from view                                                          | Pass   |
| CP-19     | Educator clicks on their owned class card                             | Overlay opens showing the class name and full member list                                  | Pass   |
| CP-20     | Educator views the class overlay                                      | Class ID ("class-1") is displayed alongside a "Copy Class ID" button                       | Pass   |
| CP-21     | Educator clicks "Copy Class ID"                                       | `navigator.clipboard.writeText` is called with the class ID                                | Pass   |
| CP-22     | Educator clicks "Remove" next to a member                             | That member ("Bob Jones") is removed from the visible member list                          | Pass   |
| CP-23     | Educator clicks "Delete" on their class                               | Class overlay and card are removed from the page                                           | Pass   |
| CP-24     | Learner clicks on a joined class card                                 | Overlay opens showing the educator's name ("Dr. Chan")                                     | Pass   |
| CP-25     | Learner views the class overlay                                       | Classmates' names and emails are listed (e.g., "Dave Black", "dave@example.com")           | Pass   |
| CP-26     | A learner's class has an active assignment                            | Assignment quiz title is shown with a working "Play" link to the quiz                      | Pass   |
| CP-27     | Learner clicks the × button in the overlay header                     | Overlay closes and its content is no longer visible                                        | Pass   |
| CP-28     | A class member has no profile image                                   | Member's initials ("DB") are shown in place of an avatar                                   | Pass   |
| CP-29     | A class member has a profile image URL                                | An `<img>` renders with a Cloudinary-resized URL (`w_80,h_80`)                             | Pass   |
| CP-30     | User copies the class ID                                              | A checkmark icon appears briefly, then reverts to the copy icon after 2 seconds            | Pass   |
| CP-31     | Educator clicks "Assign" on a class                                   | Assign Quiz modal opens and lists available quizzes                                        | Pass   |
| CP-32     | Educator searches for a non-existent quiz                             | "No quizzes match your search" message is displayed                                        | Pass   |
| CP-33     | Educator opens the Assign Quiz modal without selecting a quiz or date | "Assign Quiz" submit button is disabled                                                    | Pass   |
| CP-34     | Educator selects a quiz and a due date, then submits                  | "Assign Quiz" button becomes enabled and the modal closes after submission                 | Pass   |
| CP-35     | User dismisses a create-class error banner via ✕                      | Error banner is removed from view                                                          | Pass   |
| CP-36     | User views class cards with members                                   | Correct singular/plural learner count is shown ("2 learners", "1 learner")                 | Pass   |

---

## 10.3 Frontend Testing — Quiz Interface

_Source: `QuizInterface_test.tsx` — Component: `QuizInterface`_

| Test Case | Scenario                                                     | Expected Result                                                                       | Status |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------ |
| QI-01     | Quiz session is being created                                | "Preparing your quiz..." loading message is shown                                     | Pass   |
| QI-02     | Session creation API call fails                              | "Something went wrong" and the server's error message are displayed                   | Pass   |
| QI-03     | User views the error screen                                  | "Back to Dashboard" button is visible                                                 | Pass   |
| QI-04     | User clicks "Back to Dashboard" from the error screen        | DELETE `/api/session` is called and the user is navigated to `/dashboard`             | Pass   |
| QI-05     | Quiz is launched with a `classroomQuizId`                    | Session is created via POST `/api/session/{classroomQuizId}`                          | Pass   |
| QI-06     | Quiz is launched without a `classroomQuizId`                 | Session is created via POST `/api/quiz/{quizId}/session`                              | Pass   |
| QI-07     | Session creation succeeds                                    | "Ready?" splash screen appears with question count and a "Start Quiz" button          | Pass   |
| QI-08     | Session has a specific number of questions (e.g., 7)         | Splash screen shows "7 questions"                                                     | Pass   |
| QI-09     | User clicks "Back to Dashboard" from the splash screen       | User is navigated to `/dashboard`                                                     | Pass   |
| QI-10     | User clicks "Start Quiz"                                     | Countdown displays 3 → 2 → 1, then the first question loads and displays              | Pass   |
| QI-11     | Countdown reaches zero                                       | GET `/api/session/question` is called to load the first question                      | Pass   |
| QI-12     | User clicks an answer choice                                 | POST `/api/session/question` is called with the selected answer index                 | Pass   |
| QI-13     | User selects the correct answer                              | "✅ Correct!" banner and points earned ("+100") are displayed                         | Pass   |
| QI-14     | User selects a wrong answer                                  | "❌ Incorrect" banner is displayed                                                    | Pass   |
| QI-15     | User has just submitted an answer                            | All answer choice buttons become disabled during the feedback phase                   | Pass   |
| QI-16     | User rapidly clicks two different answers                    | Only one POST `/api/session/question` request is sent                                 | Pass   |
| QI-17     | User is viewing the first of several questions               | Counter pill shows "1 / 3"                                                            | Pass   |
| QI-18     | A question includes an `imageUrl`                            | The question image renders on screen                                                  | Pass   |
| QI-19     | Current question type is True/False                          | "✓ True" and "✗ False" buttons are displayed                                          | Pass   |
| QI-20     | User clicks "✓ True"                                         | Answer is submitted with the index corresponding to True (0)                          | Pass   |
| QI-21     | Current question allows multiple answers                     | "Select all that apply" label is displayed                                            | Pass   |
| QI-22     | Current question is multi-select                             | A "Confirm Selection" button is displayed                                             | Pass   |
| QI-23     | No answers have been toggled on a multi-select question      | "Confirm Selection" button is disabled                                                | Pass   |
| QI-24     | User toggles at least one answer choice                      | "Confirm Selection" button becomes enabled                                            | Pass   |
| QI-25     | User selects multiple answers and clicks "Confirm Selection" | Answer is submitted with all selected indices (e.g., `[1, 3]`)                        | Pass   |
| QI-26     | User clicks the same multi-select answer twice               | Answer is deselected and "Confirm Selection" becomes disabled again                   | Pass   |
| QI-27     | User is answering a timed question                           | Countdown timer is visible in MM:SS format                                            | Pass   |
| QI-28     | Question timer reaches zero before the user answers          | Answer is auto-submitted with a timed-out flag                                        | Pass   |
| QI-29     | Question timer expires                                       | "⏱️ Time's up!" feedback banner is displayed                                          | Pass   |
| QI-30     | User is on the answering screen                              | "Get a Hint" button is displayed                                                      | Pass   |
| QI-31     | User clicks "Get a Hint"                                     | Hint text from the API is displayed (e.g., "Bos said: Think about basic arithmetic.") | Pass   |
| QI-32     | User has already requested a hint                            | "Get a Hint" button is no longer shown                                                | Pass   |
| QI-33     | Hint request fails                                           | "Hint unavailable." error message is displayed                                        | Pass   |
| QI-34     | User attempts to request a hint while one is already loading | A second hint request cannot be triggered (button hidden once used)                   | Pass   |
| QI-35     | User answers a question with more questions remaining        | After the feedback delay, the next question loads and displays                        | Pass   |
| QI-36     | User advances from question 1 to question 2                  | Counter pill updates from "1 / 2" to "2 / 2"                                          | Pass   |
| QI-37     | The advance-question API call fails                          | Quiz transitions to the error phase ("Something went wrong")                          | Pass   |
| QI-38     | User answers the final question                              | "Quiz Complete!" results screen is displayed                                          | Pass   |
| QI-39     | User answers all questions correctly                         | Results screen shows "100%"                                                           | Pass   |
| QI-40     | User answers all questions incorrectly                       | Results screen shows "0%"                                                             | Pass   |
| QI-41     | finishSession API returns AI-generated feedback              | Feedback text (e.g., "Well done!") is displayed on the results screen                 | Pass   |
| QI-42     | User views the results screen                                | "Continue 🏆" button is displayed                                                     | Pass   |
| QI-43     | User finishes a quiz with a given point total                | Results screen displays the total score (e.g., "150 pts")                             | Pass   |
| QI-44     | User views the results screen                                | Answered question text appears in the review section                                  | Pass   |
| QI-45     | User clicks "Continue 🏆" from the results screen            | "Leaderboard" heading is displayed                                                    | Pass   |
| QI-46     | Leaderboard data is returned from the API                    | Top players' names are displayed (e.g., "Alice", "Bob")                               | Pass   |
| QI-47     | Current user appears in the leaderboard                      | A "You" badge highlights the current user's entry                                     | Pass   |
| QI-48     | Leaderboard API returns no entries                           | "No scores yet" message is displayed                                                  | Pass   |
| QI-49     | User views the leaderboard screen                            | "Back to Dashboard" button is displayed                                               | Pass   |
| QI-50     | User clicks "Back to Dashboard" from the leaderboard         | User navigates to `/dashboard` without triggering a DELETE `/api/session` call        | Pass   |
| QI-51     | User is on the answering screen                              | Mute button (🔊) is displayed                                                         | Pass   |
| QI-52     | User clicks the mute button                                  | Button label/title changes to "Unmute"                                                | Pass   |
| QI-53     | User clicks mute then unmute                                 | Button label/title reverts to "Mute"                                                  | Pass   |

---

## Summary

| Component                       | Source File              | Total Test Cases | Passed  | Failed |
| ------------------------------- | ------------------------ | ---------------- | ------- | ------ |
| Profile Card (Account Settings) | `profileCard_test.tsx`   | 33               | 33      | 0      |
| Classroom Page                  | `ClassPage_test.tsx`     | 36               | 36      | 0      |
| Quiz Interface                  | `QuizInterface_test.tsx` | 53               | 53      | 0      |
| **Total**                       | —                        | **122**          | **122** | **0**  |

All 122 frontend test cases passed with no failures.
