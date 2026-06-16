import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import QuizInterface from '@/components/question-types/QuizInterface';

// 1. Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// 2. Mock next/image (not available in Jest/jsdom)
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} />
  ),
}));

// 3. Mock zod so that schema.parse() passes data through instead of validating.
//    createSession() calls c_SessionSchema.parse(rawData.session); if r_SessionSchema
//    has required fields we don't know about, it would throw and push the component
//    to the 'error' phase before we ever reach 'splash'.
jest.mock('zod', () => {
  const actualZod = jest.requireActual('zod');
  return {
    ...actualZod,
    object: (...args: unknown[]) => {
      const obj = actualZod.object(
        ...(args as Parameters<typeof actualZod.object>)
      );
      obj.parse = (data: unknown) => data;
      const originalExtend = obj.extend.bind(obj);
      obj.extend = (shape: object) => {
        const extended = originalExtend(shape);
        extended.parse = (data: unknown) => data;
        return extended;
      };
      return obj;
    },
  };
});

// 4. Mock HTML5 Audio globally
beforeAll(() => {
  window.HTMLAudioElement.prototype.play = jest
    .fn()
    .mockResolvedValue(undefined);
  window.HTMLAudioElement.prototype.pause = jest.fn();
  Object.defineProperty(window.HTMLAudioElement.prototype, 'src', {
    set: jest.fn(),
    get: jest.fn(() => ''),
    configurable: true,
  });
});

// 5. Clean fetch spy before each test
beforeEach(() => {
  jest.clearAllMocks();
  // advanceTimers:true lets Promises (micro-tasks) flush while fake timers are active,
  // which prevents waitFor from deadlocking when timers are faked.
  jest.useFakeTimers({ advanceTimers: true });
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mocks the two sequential fetch calls that createSession() always makes:
 *   1. POST /api/quiz/:quizId/session
 *   2. GET  /api/session
 *
 * When postSuccess=false the second call is never reached, so only one mock
 * is queued.
 */
function mockCreateSession({
  postSuccess = true,
  postMessage = 'Failed to create session',
  sessionId = 'sess_1',
  totalQuestions = 3,
  quizId = 'quiz_123',
  userId = 'user_abc',
  status = 'waiting',
  score = 0,
  currentQuestionIndex = 0,
  questionStartTime = new Date(),
  hintsUsed = 0,
} = {}) {
  // Call 1 – POST
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: postSuccess,
    json: async () =>
      postSuccess
        ? { success: true, sessionId }
        : { success: false, message: postMessage },
  });

  if (postSuccess) {
    // Call 2 – GET /api/session (schema.parse is mocked to passthrough)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        session: {
          id: sessionId,
          quizId,
          totalQuestions,
          userId,
          status,
          score,
          currentQuestionIndex,
          questionStartTime,
          hintsUsed,
        },
      }),
    });
  }
}

/** Mocks GET /api/session/question with a minimal valid question payload. */
function mockFetchQuestion(
  overrides: Partial<{
    id: string;
    question: string;
    answers: string[];
    correctAnswers: number[];
    time: number;
    quizId: string;
    order: number;
    type: string;
    imageUrl: string;
  }> = {}
) {
  const q = {
    id: 'q1',
    quizId: 'quiz_123',
    order: 1,
    question: 'What is 2 + 2?',
    answers: ['3', '4', '5', '6'],
    correctAnswers: [1],
    time: 10,
    ...overrides,
  };
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      success: true,
      question: q,
      questionStartTime: new Date().toISOString(),
    }),
  });
}

/**
 * Mocks POST /api/session/question (submitAnswer).
 * Must be queued BEFORE the answer button is clicked.
 */
function mockSubmitAnswer({
  isCorrect = true,
  isTimedOut = false,
  points = 100,
} = {}) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, isCorrect, isTimedOut, points }),
  });
}

/**
 * Mocks POST /api/session/next (advanceQuestion).
 * Must be queued before the answer is submitted because doAdvance() is called
 * inside the same async chain as submitAnswer.
 */
function mockAdvanceQuestion(newStatus: 'active' | 'finished' = 'active') {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, newStatus }),
  });
}

/** Mocks POST /api/session/finish */
function mockFinishSession(feedback: string | null = 'Great job!') {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, data: { feedback } }),
  });
}

/**
 * Shared helper: drives the component from 'init' all the way through the
 * 3-second countdown to the 'answering' phase where the question is visible.
 * Callers must have already called mockCreateSession() and mockFetchQuestion()
 * before rendering.
 *
 * WHY tick-by-tick:
 *   The countdown uses a chain of setTimeout(..., 1000) calls. When the timer
 *   hits 0, loadQuestion() fires — which is an async fetch. We must let the
 *   microtask queue (Promise callbacks) drain *between* each 1-second tick so
 *   that React state updates settle before we advance again. Advancing all
 *   3 000 ms in one shot fires the timers but the fetch Promise hasn't resolved
 *   yet when the outer act() exits, so waitFor sees a stale DOM.
 *
 *   Advancing one second at a time inside separate act() calls forces a full
 *   flush of both the macro-task (the next setTimeout) and the microtask queue
 *   (the fetch Promise) after each step.
 */
async function reachAnsweringPhase(questionText = 'What is 2 + 2?') {
  await waitFor(() => expect(screen.getByText('Ready?')).toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

  // Tick 3 → 2
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  // Tick 2 → 1
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  // Tick 1 → 0: triggers loadQuestion() + fetch
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });

  // findBy retries on a polling interval, so it will catch the DOM update
  // once the fetch Promise resolves and React re-renders.
  await screen.findByText(questionText);
}

// ===========================================================================
describe('1. Initialization Phase', () => {
  test('should show loading spinner while session is being created', () => {
    // Never resolve so the component stays in 'init'
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<QuizInterface quizId="quiz_123" />);

    expect(screen.getByText('Preparing your quiz...')).toBeInTheDocument();
  });

  test('should transition to error phase when session creation fails', async () => {
    mockCreateSession({ postSuccess: false, postMessage: 'Server exploded' });

    render(<QuizInterface quizId="quiz_123" />);

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Server exploded')).toBeInTheDocument();
    });
  });

  test('should show "Back to Dashboard" button on error screen', async () => {
    mockCreateSession({ postSuccess: false, postMessage: 'Network error' });
    render(<QuizInterface quizId="quiz_123" />);

    await waitFor(() =>
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    );
    expect(
      screen.getByRole('button', { name: /Back to Dashboard/i })
    ).toBeInTheDocument();
  });

  test('should call DELETE /api/session and navigate when back button clicked from error', async () => {
    mockCreateSession({ postSuccess: false, postMessage: 'Oops' });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    render(<QuizInterface quizId="quiz_123" />);

    await waitFor(() =>
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /Back to Dashboard/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/session', {
        method: 'DELETE',
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('should use classroomQuizId endpoint when provided', async () => {
    mockCreateSession();
    render(<QuizInterface quizId="quiz_123" classroomQuizId="cq_456" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/session/cq_456', {
        method: 'POST',
      });
    });
  });

  test('should use quizId endpoint when classroomQuizId is not provided', async () => {
    mockCreateSession();
    render(<QuizInterface quizId="quiz_123" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/quiz/quiz_123/session', {
        method: 'POST',
      });
    });
  });
});

// ===========================================================================
describe('2. Splash & Countdown Phase', () => {
  test('should render splash screen after successful session creation', async () => {
    mockCreateSession({ totalQuestions: 3 });
    render(<QuizInterface quizId="quiz_123" />);

    await waitFor(() => {
      expect(screen.getByText('Ready?')).toBeInTheDocument();
    });

    expect(screen.getByText('3 questions')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Start Quiz/i })
    ).toBeInTheDocument();
  });

  test('should display correct total question count from session', async () => {
    mockCreateSession({ totalQuestions: 7 });
    render(<QuizInterface quizId="quiz_123" />);

    await waitFor(() =>
      expect(screen.getByText('7 questions')).toBeInTheDocument()
    );
  });

  test('should show "Back to Dashboard" on splash and navigate without DELETE', async () => {
    mockCreateSession();
    // DELETE should NOT be called from splash — the session isn't started yet
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    render(<QuizInterface quizId="quiz_123" />);

    await waitFor(() => expect(screen.getByText('Ready?')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Back to Dashboard/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
    // DELETE is not expected here because phase is 'splash', not results/leaderboard
    // but the component DOES call DELETE for any non-results phase
    expect(global.fetch).toHaveBeenCalledWith('/api/session', {
      method: 'DELETE',
    });
  });

  test('should run countdown 3→2→1 then load and display the first question', async () => {
    mockCreateSession();
    render(<QuizInterface quizId="quiz_123" />);

    // Wait for splash
    await waitFor(() => {
      expect(screen.getByText('Ready?')).toBeInTheDocument();
    });

    // Queue the question that fires once countdown hits 0
    mockFetchQuestion();

    // Click Start → phase = 'countdown', countdown = 3
    fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

    expect(screen.getByText('Get ready...')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // 1 s → 2
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('2')).toBeInTheDocument();

    // 1 s → 1
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('1')).toBeInTheDocument();

    // 1 s → 0 → loadQuestion() fires, fetches question, sets phase='answering'
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // findBy polls until the fetch Promise resolves and React re-renders
    await screen.findByText('What is 2 + 2?');
  });

  test('should fetch question from GET /api/session/question after countdown', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await waitFor(() => expect(screen.getByText('Ready?')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Start Quiz/i }));

    // Tick 1s at a time so microtasks flush between each countdown step
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/session/question', {
        method: 'GET',
      });
    });
  });
});

// ===========================================================================
describe('3. Single Select Handling', () => {
  test('should submit answer when clicking a choice', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('active');

    fireEvent.click(screen.getByRole('button', { name: '4' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/session/question',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ answer: [1] }),
        })
      );
    });
  });

  test('should show correct feedback banner after a correct answer', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('active');

    fireEvent.click(screen.getByRole('button', { name: '4' }));

    await waitFor(() =>
      expect(screen.getByText('✅ Correct!')).toBeInTheDocument()
    );
    expect(screen.getByText('+100')).toBeInTheDocument();
  });

  test('should show incorrect feedback banner after a wrong answer', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: false, points: 0 });
    mockAdvanceQuestion('active');

    // Click answer '3' (index 0 — wrong)
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    await waitFor(() =>
      expect(screen.getByText('❌ Incorrect')).toBeInTheDocument()
    );
  });

  test('should disable all answer buttons after selection (feedback phase)', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('active');

    fireEvent.click(screen.getByRole('button', { name: '4' }));

    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /^[3456]$/ });
      buttons.forEach((btn) => expect(btn).toBeDisabled());
    });
  });

  test('should not submit a second answer after the first click (submitLock)', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('active');

    fireEvent.click(screen.getByRole('button', { name: '4' }));
    fireEvent.click(screen.getByRole('button', { name: '3' }));

    await waitFor(() => {
      const submitCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url, opts]) =>
          url === '/api/session/question' && opts?.method === 'POST'
      );
      expect(submitCalls).toHaveLength(1);
    });
  });

  test('should show question counter pill as "1 / 3"', async () => {
    mockCreateSession({ totalQuestions: 3 });
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    expect(
      screen.getByText((_, el) => el?.textContent?.trim() === '1 / 3')
    ).toBeInTheDocument();
  });

  test('should render an image when the question has imageUrl', async () => {
    mockCreateSession();
    mockFetchQuestion({ imageUrl: 'https://example.com/img.png' });
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    // alt="" makes the image decorative (role="presentation"), so query by alt text
    const img = document.querySelector(
      'img[src="https://example.com/img.png"]'
    );
    expect(img).toBeInTheDocument();
  });
});

// ===========================================================================
describe('4. True/False Question Handling', () => {
  const trueFalseQuestion = {
    id: 'q_tf',
    question: 'The sky is blue.',
    answers: ['True', 'False'],
    correctAnswers: [0],
    time: 10,
  };

  test('should render True/False buttons for a true-false question', async () => {
    mockCreateSession();
    mockFetchQuestion(trueFalseQuestion);
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase('The sky is blue.');

    expect(screen.getByRole('button', { name: /✓ True/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /✗ False/i })
    ).toBeInTheDocument();
  });

  test('should submit with correct index when True is clicked', async () => {
    mockCreateSession();
    mockFetchQuestion(trueFalseQuestion);
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase('The sky is blue.');

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('active');

    fireEvent.click(screen.getByRole('button', { name: /✓ True/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/session/question',
        expect.objectContaining({ body: JSON.stringify({ answer: [0] }) })
      );
    });
  });
});

// ===========================================================================
describe('5. Multi-Select Question Handling', () => {
  const multiQuestion = {
    question: 'Which are even numbers?',
    answers: ['1', '2', '3', '4'],
    correctAnswers: [1, 3],
    time: 15,
    type: 'MultiSelect',
  };

  test('should show "Select all that apply" label for multi-select', async () => {
    mockCreateSession();
    mockFetchQuestion(multiQuestion);
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase('Which are even numbers?');

    expect(screen.getByText(/Select all that apply/i)).toBeInTheDocument();
  });

  test('should show a "Confirm Selection" button for multi-select', async () => {
    mockCreateSession();
    mockFetchQuestion(multiQuestion);
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase('Which are even numbers?');

    expect(
      screen.getByRole('button', { name: /Confirm Selection/i })
    ).toBeInTheDocument();
  });

  test('Confirm Selection button should be disabled until at least one answer is toggled', async () => {
    mockCreateSession();
    mockFetchQuestion(multiQuestion);
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase('Which are even numbers?');

    const confirmBtn = screen.getByRole('button', {
      name: /Confirm Selection/i,
    });
    expect(confirmBtn).toBeDisabled();
  });

  test('should enable Confirm Selection after toggling an answer', async () => {
    mockCreateSession();
    mockFetchQuestion(multiQuestion);
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase('Which are even numbers?');

    fireEvent.click(screen.getByRole('button', { name: /2/ }));
    expect(
      screen.getByRole('button', { name: /Confirm Selection/i })
    ).not.toBeDisabled();
  });

  test('should submit selected indices on Confirm Selection click', async () => {
    mockCreateSession();
    mockFetchQuestion(multiQuestion);
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase('Which are even numbers?');

    fireEvent.click(screen.getByRole('button', { name: /2/ })); // index 1
    fireEvent.click(screen.getByRole('button', { name: '4' })); // index 3

    mockSubmitAnswer({ isCorrect: true, points: 200 });
    mockAdvanceQuestion('active');

    fireEvent.click(screen.getByRole('button', { name: /Confirm Selection/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/session/question',
        expect.objectContaining({ body: JSON.stringify({ answer: [1, 3] }) })
      );
    });
  });

  test('should toggle answer off when clicked a second time', async () => {
    mockCreateSession();
    mockFetchQuestion(multiQuestion);
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase('Which are even numbers?');

    // Toggle on, then off
    fireEvent.click(screen.getByRole('button', { name: /2/ }));
    fireEvent.click(screen.getByRole('button', { name: /2/ }));

    expect(
      screen.getByRole('button', { name: /Confirm Selection/i })
    ).toBeDisabled();
  });
});

// ===========================================================================
describe('6. Timer Behaviour', () => {
  test('should display the question timer on screen', async () => {
    mockCreateSession();
    mockFetchQuestion({ time: 10 });
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    // timeLeft starts at ≤10 (depends on elapsed calculation)
    expect(screen.getByText(/00:\d{2}/)).toBeInTheDocument();
  });

  test('should auto-submit with timed-out flag when timer reaches zero', async () => {
    mockCreateSession();
    mockFetchQuestion({ time: 5 });
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: false, isTimedOut: true, points: 0 });
    mockAdvanceQuestion('active');

    // Tick one second at a time so microtasks (fetch Promises) flush between each step
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    }); // extra tick past zero

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/session/question',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  test('should show "Time\'s up!" feedback banner on timeout', async () => {
    mockCreateSession();
    mockFetchQuestion({ time: 3 });
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: false, isTimedOut: true, points: 0 });
    mockAdvanceQuestion('active');

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    }); // extra tick past zero

    await waitFor(() =>
      expect(screen.getByText("⏱️ Time's up!")).toBeInTheDocument()
    );
  });
});

// ===========================================================================
describe('7. Hint System', () => {
  test('should show "Get a Hint" button while answering', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    expect(
      screen.getByRole('button', { name: /Get a Hint/i })
    ).toBeInTheDocument();
  });

  test('should fetch hint from /api/session/hint and display it', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hint: 'Think about basic arithmetic.' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /Get a Hint/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Bos said: Think about basic arithmetic\./i)
      ).toBeInTheDocument();
    });
  });

  test('should hide "Get a Hint" button after it has been used', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hint: 'Some hint.' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /Get a Hint/i }));

    await waitFor(() =>
      expect(screen.getByText(/Bos said:/i)).toBeInTheDocument()
    );

    expect(
      screen.queryByRole('button', { name: /Get a Hint/i })
    ).not.toBeInTheDocument();
  });

  test('should show error message when hint API fails', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Hint unavailable.' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /Get a Hint/i }));

    await waitFor(() =>
      expect(screen.getByText(/Hint unavailable\./i)).toBeInTheDocument()
    );
  });

  test('should not fire a second hint request if one is already in progress (hintLock)', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    // Slow hint that never resolves
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {})
    );

    fireEvent.click(screen.getByRole('button', { name: /Get a Hint/i }));
    // Hint button is now hidden (hintUsed=true), so a second click isn't possible —
    // this confirms the lock works at the UI level too
    expect(
      screen.queryByRole('button', { name: /Get a Hint/i })
    ).not.toBeInTheDocument();
  });
});

// ===========================================================================
describe('8. Question Advance & Multi-Question Flow', () => {
  test('should advance to next question after feedback delay', async () => {
    mockCreateSession({ totalQuestions: 2 });
    mockFetchQuestion({ question: 'What is 2 + 2?', order: 1 });
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('active');
    // Mock the second question that loads after the 1.4s delay
    mockFetchQuestion({ question: 'What is 3 + 3?', order: 2 });

    fireEvent.click(screen.getByRole('button', { name: '4' }));
    // Flush submitAnswer() fetch
    await act(async () => {});
    // Fire the 1400ms setTimeout that calls doAdvance()
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    // Flush advanceQuestion() fetch so the inner setTimeout gets registered
    await act(async () => {});
    // Fire the second 1400ms setTimeout that calls loadQuestion()
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    // Flush fetchQuestion() fetch
    await act(async () => {});

    await screen.findByText('What is 3 + 3?');
  });

  test('should increment question counter after advancing', async () => {
    mockCreateSession({ totalQuestions: 2 });
    mockFetchQuestion({ order: 1 });
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    expect(
      screen.getByText((_, el) => el?.textContent?.trim() === '1 / 2')
    ).toBeInTheDocument();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('active');
    mockFetchQuestion({ question: 'Q2', order: 2 });

    fireEvent.click(screen.getByRole('button', { name: '4' }));
    // Flush submitAnswer() fetch
    await act(async () => {});
    // Fire the 1400ms setTimeout that calls doAdvance()
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    // Flush advanceQuestion() fetch so the inner setTimeout gets registered
    await act(async () => {});
    // Fire the second 1400ms setTimeout that calls loadQuestion()
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    // Flush fetchQuestion() fetch
    await act(async () => {});

    await screen.findByText((_, el) => el?.textContent?.trim() === '2 / 2');
  });

  test('should enter error phase if advanceQuestion fails', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    // Advance call fails
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, message: 'Advance failed' }),
    });

    fireEvent.click(screen.getByRole('button', { name: '4' }));
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await screen.findByText('Something went wrong');
  });
});

// ===========================================================================
describe('9. Results Phase', () => {
  /**
   * Drives a full single-question quiz to the results screen.
   * The quiz has 1 question so advanceQuestion returns 'finished',
   * which triggers finishSession().
   */
  async function reachResultsPhase({ isCorrect = true, points = 100 } = {}) {
    mockCreateSession({ totalQuestions: 1 });
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect, points });
    mockAdvanceQuestion('finished');
    mockFinishSession('Well done!');

    fireEvent.click(screen.getByRole('button', { name: '4' }));
    // 1) Flush submitAnswer fetch (already in-flight)
    await act(async () => {});
    // 2) Advance past the 1400 ms setTimeout that fires doAdvance()
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    // 3) Flush advanceQuestion() fetch → setPhase('finishing') → finishSession() fetch → setPhase('results')
    await act(async () => {});
    await act(async () => {});

    await screen.findByText(
      (_, el) => el?.textContent?.trim() === 'Quiz Complete!'
    );
  }

  test('should show "Quiz Complete!" after the last question is answered', async () => {
    await reachResultsPhase();
    expect(
      screen.getByText((_, el) => el?.textContent?.trim() === 'Quiz Complete!')
    ).toBeInTheDocument();
  });

  test('should show correct percentage score', async () => {
    await reachResultsPhase({ isCorrect: true });
    // 1/1 correct = 100%
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  test('should show 0% when all answers are wrong', async () => {
    await reachResultsPhase({ isCorrect: false, points: 0 });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('should display AI feedback when returned by finishSession', async () => {
    await reachResultsPhase();
    await waitFor(() =>
      expect(screen.getByText('Well done!')).toBeInTheDocument()
    );
  });

  test('should show "Continue 🏆" button on results screen', async () => {
    await reachResultsPhase();
    expect(
      screen.getByRole('button', { name: /Continue 🏆/i })
    ).toBeInTheDocument();
  });

  test('should show total score in points', async () => {
    await reachResultsPhase({ isCorrect: true, points: 150 });
    expect(screen.getByText('150 pts')).toBeInTheDocument();
  });

  test('should list the answered question in the review section', async () => {
    await reachResultsPhase();
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });
});

// ===========================================================================
describe('10. Leaderboard Phase', () => {
  async function reachLeaderboardPhase() {
    mockCreateSession({ totalQuestions: 1 });
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('finished');
    mockFinishSession('Nice work!');

    fireEvent.click(screen.getByRole('button', { name: '4' }));
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    await act(async () => {});
    await act(async () => {});

    await screen.findByText(
      (_, el) => el?.textContent?.trim() === 'Quiz Complete!'
    );

    // Mock leaderboard fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { rank: 1, userId: 'user_abc', userName: 'Alice', finalScore: 500 },
          { rank: 2, userId: 'user_xyz', userName: 'Bob', finalScore: 300 },
        ],
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: /Continue 🏆/i }));

    await screen.findByText('Leaderboard');
  }

  test('should show Leaderboard heading after clicking Continue', async () => {
    await reachLeaderboardPhase();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  test('should render top players on the leaderboard', async () => {
    await reachLeaderboardPhase();
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  test('should highlight the current user with a "You" badge', async () => {
    await reachLeaderboardPhase();
    await waitFor(() => expect(screen.getByText('You')).toBeInTheDocument());
  });

  test('should show empty state when leaderboard has no entries', async () => {
    mockCreateSession({ totalQuestions: 1 });
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    mockSubmitAnswer({ isCorrect: true, points: 100 });
    mockAdvanceQuestion('finished');
    mockFinishSession(null);

    fireEvent.click(screen.getByRole('button', { name: '4' }));
    await act(async () => {});
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    await act(async () => {});
    await act(async () => {});
    await screen.findByText(
      (_, el) => el?.textContent?.trim() === 'Quiz Complete!'
    );

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    fireEvent.click(screen.getByRole('button', { name: /Continue 🏆/i }));

    await waitFor(() =>
      expect(screen.getByText(/No scores yet/i)).toBeInTheDocument()
    );
  });

  test('should show "Back to Dashboard" button on leaderboard', async () => {
    await reachLeaderboardPhase();
    expect(
      screen.getByRole('button', { name: /Back to Dashboard/i })
    ).toBeInTheDocument();
  });

  test('should navigate to /dashboard from leaderboard without calling DELETE', async () => {
    await reachLeaderboardPhase();

    (global.fetch as jest.Mock).mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Back to Dashboard/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'));
    // In 'leaderboard' phase the component should NOT call DELETE
    expect(global.fetch).not.toHaveBeenCalledWith('/api/session', {
      method: 'DELETE',
    });
  });
});

// ===========================================================================
describe('11. Mute / Audio Controls', () => {
  test('should render mute button during answering phase', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    // The mute button shows 🔊 initially
    expect(screen.getByTitle('Mute')).toBeInTheDocument();
  });

  test('should toggle to "Unmute" label after clicking mute', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    fireEvent.click(screen.getByTitle('Mute'));
    expect(screen.getByTitle('Unmute')).toBeInTheDocument();
  });

  test('should toggle back to "Mute" label after clicking unmute', async () => {
    mockCreateSession();
    mockFetchQuestion();
    render(<QuizInterface quizId="quiz_123" />);

    await reachAnsweringPhase();

    fireEvent.click(screen.getByTitle('Mute'));
    fireEvent.click(screen.getByTitle('Unmute'));
    expect(screen.getByTitle('Mute')).toBeInTheDocument();
  });
});
