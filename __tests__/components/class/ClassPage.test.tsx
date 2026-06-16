import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClassroomPage from '@/components/class/ClassPage';

// ─── userEvent instance with no keystroke delay ───────────────────────────────
// Default userEvent fires a setTimeout per character — "Physics 303" alone
// becomes ~110 timer ticks. Setting delay:null makes typing synchronous and is
// the single biggest speed win in this file.
const user = userEvent.setup({ delay: null });

// ─── Mock fetch ───────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Mock clipboard ───────────────────────────────────────────────────────────
// navigator.clipboard is a read-only getter in jsdom — Object.assign throws.
// Object.defineProperty bypasses the getter restriction.

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  writable: true,
  configurable: true,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockApiOk(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockApiError(message: string, status = 400) {
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ message }),
    status,
  } as Response);
}

const EDUCATOR_CLASS = {
  id: 'class-1',
  name: 'Mathematics 101',
  owner: { id: 'owner-1', name: 'Alice Smith', email: 'alice@example.com' },
  members: [
    { id: 'member-1', name: 'Bob Jones', email: 'bob@example.com' },
    { id: 'member-2', name: 'Carol White', email: 'carol@example.com' },
  ],
};

const LEARNER_CLASS = {
  id: 'class-2',
  name: 'Science 202',
  owner: { id: 'owner-2', name: 'Dr. Chan', email: 'chan@example.com' },
  members: [{ id: 'member-3', name: 'Dave Black', email: 'dave@example.com' }],
};

const QUIZ = {
  id: 'quiz-1',
  title: 'Algebra Basics',
  description: 'Intro quiz',
};

const ASSIGNMENT = {
  id: 'assign-1',
  quiz: QUIZ,
  dueDate: new Date(Date.now() + 86_400_000 * 7).toISOString(),
  isOverdue: false,
  isAssigner: false,
  userHasCompleted: false,
};

/** Default fetch setup: owned + joined classes, no assignments */
function setupDefaultFetch() {
  mockFetch.mockImplementation((url: string) => {
    if (url === '/api/class?type=educator')
      return mockApiOk({ educatorClasses: [EDUCATOR_CLASS] });
    if (url === '/api/class?type=learner')
      return mockApiOk({ learnerClasses: [LEARNER_CLASS] });
    if (url.startsWith('/api/class/assignment/'))
      return mockApiOk({ data: [] });
    return mockApiOk({});
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  mockFetch.mockReset();
  jest.clearAllMocks();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ─── 1. Initial render & data loading ─────────────────────────────────────────

describe('ClassroomPage — initial render', () => {
  it('renders section headers for My Classes and Joined Classes', () => {
    // Headers are static markup — no fetch needed, no async required
    setupDefaultFetch();
    render(<ClassroomPage />);
    expect(screen.getByText('My Classes')).toBeInTheDocument();
    expect(screen.getByText('Joined Classes')).toBeInTheDocument();
  });

  it('renders skeleton loaders while data is loading', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<ClassroomPage />);
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(
      0
    );
  });

  it('renders owned and joined class cards after loading', async () => {
    setupDefaultFetch();
    render(<ClassroomPage />);
    // findBy* is cleaner than waitFor+getBy — same polling, one call
    expect(await screen.findByText('Mathematics 101')).toBeInTheDocument();
    expect(screen.getByText('Science 202')).toBeInTheDocument();
  });

  it('shows an Educator badge on owned class cards', async () => {
    setupDefaultFetch();
    render(<ClassroomPage />);
    expect(await screen.findAllByText(/educator/i)).not.toHaveLength(0);
  });

  it('shows a Learner badge on joined class cards', async () => {
    setupDefaultFetch();
    render(<ClassroomPage />);
    expect(await screen.findAllByText(/learner/i)).not.toHaveLength(0);
  });

  it('shows fetch error banner when the API fails', async () => {
    mockFetch.mockReturnValue(mockApiError('Server unavailable', 500));
    render(<ClassroomPage />);
    expect(await screen.findByText(/server unavailable/i)).toBeInTheDocument();
  });

  it('shows empty-state message when there are no owned classes', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      return mockApiOk({ data: [] });
    });
    render(<ClassroomPage />);
    expect(await screen.findByText(/no classes yet/i)).toBeInTheDocument();
  });
});

// ─── 2. Create class flow ──────────────────────────────────────────────────────

describe('ClassroomPage — create class', () => {
  /** Renders the page and opens the create overlay, returns when input is visible */
  async function openCreateOverlay() {
    render(<ClassroomPage />);
    await user.click(await screen.findByRole('button', { name: /new class/i }));
    await screen.findByPlaceholderText(/e\.g\. mathematics 101/i);
  }

  it('opens the Create class overlay when "New Class" is clicked', async () => {
    setupDefaultFetch();
    await openCreateOverlay();
    expect(
      screen.getByRole('heading', { name: /new class/i })
    ).toBeInTheDocument();
  });

  it('disables the Create button when the class name input is empty', async () => {
    setupDefaultFetch();
    await openCreateOverlay();
    expect(
      screen.getByRole('button', { name: /create class/i })
    ).toBeDisabled();
  });

  it('enables the Create button once a name is typed', async () => {
    setupDefaultFetch();
    await openCreateOverlay();
    await user.type(
      screen.getByPlaceholderText(/e\.g\. mathematics 101/i),
      'Physics 303'
    );
    expect(screen.getByRole('button', { name: /create class/i })).toBeEnabled();
  });

  it('calls POST /api/class and adds the new class on success', async () => {
    const newClass = {
      id: 'class-99',
      name: 'Physics 303',
      owner: { id: 'owner-1', name: 'Alice Smith', email: 'alice@example.com' },
      members: [],
    };
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [EDUCATOR_CLASS] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url === '/api/class' && opts?.method === 'POST')
        return mockApiOk(newClass);
      return mockApiOk({ data: [] });
    });

    await openCreateOverlay();
    await user.type(
      screen.getByPlaceholderText(/e\.g\. mathematics 101/i),
      'Physics 303'
    );
    await user.click(screen.getByRole('button', { name: /create class/i }));

    expect(await screen.findByText('Physics 303')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/e\.g\. mathematics 101/i)
    ).not.toBeInTheDocument();
  });

  it('shows an error banner when create API fails', async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url === '/api/class' && opts?.method === 'POST')
        return mockApiError('Name already taken');
      return mockApiOk({ data: [] });
    });

    await openCreateOverlay();
    await user.type(
      screen.getByPlaceholderText(/e\.g\. mathematics 101/i),
      'Duplicate'
    );
    await user.click(screen.getByRole('button', { name: /create class/i }));

    expect(await screen.findByText(/name already taken/i)).toBeInTheDocument();
  });

  it('closes the overlay when the backdrop is clicked', async () => {
    setupDefaultFetch();
    await openCreateOverlay();
    await user.click(
      document.querySelector('.absolute.inset-0') as HTMLElement
    );
    expect(
      screen.queryByPlaceholderText(/e\.g\. mathematics 101/i)
    ).not.toBeInTheDocument();
  });
});

// ─── 3. Join class flow ───────────────────────────────────────────────────────

describe('ClassroomPage — join class', () => {
  /** Renders the page and opens the join overlay, returns when input is visible */
  async function openJoinOverlay() {
    render(<ClassroomPage />);
    await user.click(
      await screen.findByRole('button', { name: /join class/i })
    );
    await screen.findByPlaceholderText(/paste the classroom id/i);
  }

  it('opens the Join class overlay when "Join Class" is clicked', async () => {
    setupDefaultFetch();
    await openJoinOverlay();
    expect(
      screen.getByPlaceholderText(/paste the classroom id/i)
    ).toBeInTheDocument();
  });

  it('disables the Join button when the ID field is empty', async () => {
    setupDefaultFetch();
    await openJoinOverlay();
    // Two 'Join Class' buttons exist once the overlay is open: the page-header
    // button and the overlay submit button. getAllByRole + last gives the submit.
    const joinBtns = screen.getAllByRole('button', { name: /join class/i });
    expect(joinBtns[joinBtns.length - 1]).toBeDisabled();
  });

  it('shows success message and adds class on successful join', async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url.startsWith('/api/class/') && opts?.method === 'POST')
        return mockApiOk({ classroom: LEARNER_CLASS });
      return mockApiOk({ data: [] });
    });

    await openJoinOverlay();
    await user.type(
      screen.getByPlaceholderText(/paste the classroom id/i),
      'class-2'
    );
    const joinBtns = screen.getAllByRole('button', { name: /join class/i });
    await user.click(joinBtns[joinBtns.length - 1]);

    expect(await screen.findByText(/joined successfully/i)).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1300));
    expect(
      screen.queryByPlaceholderText(/paste the classroom id/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText('Science 202')).toBeInTheDocument();
  });

  it('shows error banner when join fails', async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url.startsWith('/api/class/') && opts?.method === 'POST')
        return mockApiError('Classroom not found');
      return mockApiOk({ data: [] });
    });

    await openJoinOverlay();
    await user.type(
      screen.getByPlaceholderText(/paste the classroom id/i),
      'bad-id'
    );
    const joinBtns = screen.getAllByRole('button', { name: /join class/i });
    await user.click(joinBtns[joinBtns.length - 1]);

    expect(await screen.findByText(/classroom not found/i)).toBeInTheDocument();
  });

  it('dismisses join error banner when ✕ is clicked', async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url.startsWith('/api/class/') && opts?.method === 'POST')
        return mockApiError('Not found');
      return mockApiOk({ data: [] });
    });

    await openJoinOverlay();
    await user.type(
      screen.getByPlaceholderText(/paste the classroom id/i),
      'bad-id'
    );
    const joinBtns = screen.getAllByRole('button', { name: /join class/i });
    await user.click(joinBtns[joinBtns.length - 1]);
    await screen.findByText(/not found/i);

    await user.click(screen.getByText('✕'));
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument();
  });
});

// ─── 4. Educator class overlay ────────────────────────────────────────────────

describe('ClassroomPage — educator class overlay', () => {
  async function openEducatorOverlay() {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [EDUCATOR_CLASS] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url.startsWith('/api/class/assignment/'))
        return mockApiOk({ data: [] });
      return mockApiOk({});
    });
    render(<ClassroomPage />);
    await user.click(await screen.findByText('Mathematics 101'));
  }

  it('opens educator overlay showing class name and member list', async () => {
    await openEducatorOverlay();
    expect(
      screen.getByRole('heading', { name: /mathematics 101/i })
    ).toBeInTheDocument();
    expect(await screen.findByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Carol White')).toBeInTheDocument();
  });

  it('displays Class ID with copy button', async () => {
    await openEducatorOverlay();
    expect(screen.getByText('class-1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /copy class id/i })
    ).toBeInTheDocument();
  });

  it('copies the class ID to clipboard on button click', async () => {
    await openEducatorOverlay();
    await user.click(screen.getByRole('button', { name: /copy class id/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('class-1');
  });

  it('removes a member when the remove button is clicked', async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [EDUCATOR_CLASS] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url.startsWith('/api/class/assignment/'))
        return mockApiOk({ data: [] });
      if (url === '/api/class' && opts?.method === 'DELETE')
        return mockApiOk({});
      return mockApiOk({});
    });

    render(<ClassroomPage />);
    await user.click(await screen.findByText('Mathematics 101'));
    await user.click((await screen.findAllByTitle(/remove/i))[0]);

    await waitFor(() =>
      expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument()
    );
  });

  it('deletes the class and closes the overlay', async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [EDUCATOR_CLASS] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url.startsWith('/api/class/assignment/'))
        return mockApiOk({ data: [] });
      if (url === '/api/class' && opts?.method === 'DELETE')
        return mockApiOk({});
      return mockApiOk({});
    });

    render(<ClassroomPage />);
    await user.click(await screen.findByText('Mathematics 101'));
    await user.click(await screen.findByRole('button', { name: /delete/i }));

    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: /mathematics 101/i })
      ).not.toBeInTheDocument()
    );
    expect(screen.queryByText('Mathematics 101')).not.toBeInTheDocument();
  });
});

// ─── 5. Learner class overlay ─────────────────────────────────────────────────

describe('ClassroomPage — learner class overlay', () => {
  async function openLearnerOverlay() {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [LEARNER_CLASS] });
      if (url.startsWith('/api/class/assignment/'))
        return mockApiOk({ data: [] });
      return mockApiOk({});
    });
    render(<ClassroomPage />);
    await user.click(await screen.findByText('Science 202'));
  }

  it('opens learner overlay showing educator name', async () => {
    await openLearnerOverlay();
    // Dr. Chan appears twice: once in the ClassCard body and once in the overlay.
    // Use findAllByText and assert at least one match exists.
    expect((await screen.findAllByText('Dr. Chan')).length).toBeGreaterThan(0);
  });

  it('shows classmates list', async () => {
    await openLearnerOverlay();
    expect(screen.getByText('Dave Black')).toBeInTheDocument();
    expect(screen.getByText('dave@example.com')).toBeInTheDocument();
  });

  it('shows assignments when they exist', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [LEARNER_CLASS] });
      if (url.startsWith('/api/class/assignment/'))
        return mockApiOk({ data: [ASSIGNMENT] });
      return mockApiOk({});
    });

    render(<ClassroomPage />);
    await user.click(await screen.findByText('Science 202'));

    expect(await screen.findByText('Algebra Basics')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /play/i })).toHaveAttribute(
      'href',
      `/play/${QUIZ.id}?assignmentId=${ASSIGNMENT.id}`
    );
  });

  it('closes overlay when the × header button is clicked', async () => {
    await openLearnerOverlay();
    // document.querySelector('[class*="bg-linear-to-br"]') matches the ClassCard
    // gradient divs in the background DOM before it reaches the OverlayHeader,
    // so querySelector('button') on it returns null and the click is a no-op.
    // Instead: find the overlay heading by its text, walk to its parent (the
    // OverlayHeader div), and click the close button sibling inside it.
    const heading = await screen.findByRole('heading', {
      name: /science 202/i,
    });
    await user.click(
      heading.parentElement!.querySelector('button') as HTMLElement
    );
    await waitFor(() =>
      expect(screen.queryByText('Dave Black')).not.toBeInTheDocument()
    );
  });
});

// ─── 6. Avatar component ──────────────────────────────────────────────────────

describe('Avatar', () => {
  it('renders initials when no image is provided', async () => {
    setupDefaultFetch();
    render(<ClassroomPage />);
    await user.click(await screen.findByText('Science 202'));
    expect(await screen.findByText('DB')).toBeInTheDocument();
  });

  it('renders an <img> when an image URL is provided', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({
          learnerClasses: [
            {
              ...LEARNER_CLASS,
              members: [
                {
                  id: 'member-3',
                  name: 'Dave Black',
                  email: 'dave@example.com',
                  image:
                    'https://res.cloudinary.com/demo/image/upload/sample.jpg',
                },
              ],
            },
          ],
        });
      return mockApiOk({ data: [] });
    });

    render(<ClassroomPage />);
    await user.click(await screen.findByText('Science 202'));

    const img = await screen.findByAltText('Dave Black');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toContain('/upload/w_80,h_80');
  });
});

// ─── 7. ClassIdDisplay — copy-to-clipboard ───────────────────────────────────

describe('ClassIdDisplay', () => {
  it('shows a checkmark icon after copying and reverts after 2 s', async () => {
    setupDefaultFetch();
    render(<ClassroomPage />);
    await user.click(await screen.findByText('Mathematics 101'));
    await user.click(
      await screen.findByRole('button', { name: /copy class id/i })
    );

    expect(
      document.querySelector('path[d="M5 13l4 4L19 7"]')
    ).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(2100));

    await waitFor(() =>
      expect(
        document.querySelector('path[d="M5 13l4 4L19 7"]')
      ).not.toBeInTheDocument()
    );
  });
});

// ─── 8. Assign Quiz flow (EducatorQuizPanel) ──────────────────────────────────

describe('EducatorQuizPanel — assign quiz', () => {
  async function openAssignModal() {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [EDUCATOR_CLASS] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url === '/api/quiz') return mockApiOk({ data: [QUIZ] });
      if (url.startsWith('/api/class/assignment/') && !opts?.method)
        return mockApiOk({ data: [ASSIGNMENT] });
      if (url.startsWith('/api/class/assignment/') && opts?.method === 'POST')
        return mockApiOk({});
      return mockApiOk({});
    });

    render(<ClassroomPage />);
    await user.click(await screen.findByText('Mathematics 101'));
    await user.click(await screen.findByRole('button', { name: /^assign$/i }));
  }

  it('opens Assign Quiz modal and shows quiz list', async () => {
    await openAssignModal();
    expect(await screen.findByText('Algebra Basics')).toBeInTheDocument();
  });

  it('filters quizzes by search input', async () => {
    await openAssignModal();
    await user.type(
      await screen.findByPlaceholderText(/search quizzes/i),
      'nonexistent'
    );
    expect(
      await screen.findByText(/no quizzes match your search/i)
    ).toBeInTheDocument();
  });

  it('disables Assign Quiz submit button until quiz + date are selected', async () => {
    await openAssignModal();
    expect(
      await screen.findByRole('button', { name: /assign quiz/i })
    ).toBeDisabled();
  });

  it('enables and submits when quiz and date are both chosen', async () => {
    await openAssignModal();

    // findByText('Algebra Basics') resolves to the <p> inside QuizPickerItem,
    // not the <button>, so onClick never fires and selectedQuizId stays ''.
    // The button's accessible name is "Algebra Basics Intro quiz" (title + desc).
    // Take the last match to avoid any same-named elements in the background DOM.
    const quizBtns = await screen.findAllByRole('button', {
      name: /algebra basics/i,
    });
    await user.click(quizBtns[quizBtns.length - 1]);

    // jsdom has no real date-picker. React's onChange reads e.target.value from
    // the live DOM node, so we write via the native setter first. Then we must
    // await act(async () => ...) so React flushes the state update before the
    // toBeEnabled() assertion — a synchronous act() leaves the update pending.
    const dateInput = document.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    )!.set!;
    nativeSetter.call(dateInput, '2099-12-31');
    await act(async () => {
      fireEvent.change(dateInput);
    });

    const submitBtn = screen.getByRole('button', { name: /assign quiz/i });
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /assign quiz/i })
      ).not.toBeInTheDocument()
    );
  });
});

// ─── 9. ErrorBanner ───────────────────────────────────────────────────────────

describe('ErrorBanner', () => {
  it('dismisses create error banner via ✕ button', async () => {
    mockFetch.mockImplementation((url: string, opts?: RequestInit) => {
      if (url === '/api/class?type=educator')
        return mockApiOk({ educatorClasses: [] });
      if (url === '/api/class?type=learner')
        return mockApiOk({ learnerClasses: [] });
      if (url === '/api/class' && opts?.method === 'POST')
        return mockApiError('Something went wrong');
      return mockApiOk({ data: [] });
    });

    render(<ClassroomPage />);
    await user.click(await screen.findByRole('button', { name: /new class/i }));
    await user.type(
      await screen.findByPlaceholderText(/e\.g\. mathematics 101/i),
      'Test'
    );
    await user.click(screen.getByRole('button', { name: /create class/i }));

    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();

    await user.click(screen.getByText('✕'));
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });
});

// ─── 10. Member count display ─────────────────────────────────────────────────

describe('ClassCard — member count', () => {
  it('renders correct learner count label', async () => {
    setupDefaultFetch();
    render(<ClassroomPage />);
    expect(await screen.findByText('2 learners')).toBeInTheDocument();
    expect(screen.getByText('1 learner')).toBeInTheDocument();
  });
});
