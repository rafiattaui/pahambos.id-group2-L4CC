/**
 * Dashboard Frontend Tests
 * Covers: Form Validation (DashNavbar), Error Handling (usePerformance), and UI Behavior
 * Note: SearchPage tests have been moved to searchpage_test.tsx
 *
 * Setup:
 *   npm install --save-dev jest @testing-library/react @testing-library/user-event @testing-library/jest-dom jest-environment-jsdom ts-jest
 *
 * jest.config.ts:
 *   testEnvironment: 'jsdom'
 *   setupFilesAfterFramework: ['@testing-library/jest-dom']
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ─── Module-scope mock handles ────────────────────────────────────────────────
// Declared here so test bodies can call .mockReturnValue / .mockResolvedValue.
// jest.mock() factories are hoisted but run lazily, so these are in scope.

const mockPush = jest.fn();
const mockUseSearchParams = jest.fn(() => new URLSearchParams());

// ─── Next.js mocks ────────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/dashboard/search',
  useSearchParams: (...args: unknown[]) => mockUseSearchParams(...(args as [])),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    fill,
    ...rest
  }: {
    src: string;
    alt: string;
    fill?: boolean;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-fill={fill ? 'true' : undefined} {...rest} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// ─── Lucide icons ─────────────────────────────────────────────────────────────

jest.mock(
  'lucide-react',
  () =>
    new Proxy(
      {},
      { get: (_t, name) => () => <span data-testid={`icon-${String(name)}`} /> }
    )
);

// ─── Shadcn UI stubs ──────────────────────────────────────────────────────────

// buttonVariants must be exported — pagination.tsx imports and calls it at module scope
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    variant,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode;
    variant?: string;
  }) => (
    <button onClick={onClick} data-variant={variant} {...rest}>
      {children}
    </button>
  ),
  buttonVariants: (_opts?: Record<string, unknown>) => 'btn',
}));

// Stub pagination entirely — PaginationLink calls buttonVariants at render time
jest.mock('@/components/ui/pagination', () => ({
  Pagination: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <nav className={className}>{children}</nav>,
  PaginationContent: ({ children }: { children: React.ReactNode }) => (
    <ul>{children}</ul>
  ),
  PaginationItem: ({ children }: { children: React.ReactNode }) => (
    <li>{children}</li>
  ),
  PaginationLink: ({
    children,
    onClick,
    href,
    isActive,
    className,
  }: {
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    href?: string;
    isActive?: boolean;
    className?: string;
  }) => (
    <a
      href={href}
      onClick={onClick}
      className={className}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </a>
  ),
  PaginationPrevious: ({
    onClick,
    href,
    className,
  }: {
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    href?: string;
    className?: string;
  }) => (
    <a
      href={href}
      onClick={onClick}
      className={className}
      aria-label="Go to previous page"
    >
      Previous
    </a>
  ),
  PaginationNext: ({
    onClick,
    href,
    className,
  }: {
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
    href?: string;
    className?: string;
  }) => (
    <a
      href={href}
      onClick={onClick}
      className={className}
      aria-label="Go to next page"
    >
      Next
    </a>
  ),
  PaginationEllipsis: () => <span>…</span>,
}));

jest.mock('@/components/ui/input-group', () => ({
  InputGroup: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  InputGroupInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} />
  ),
  InputGroupAddon: ({
    children,
  }: {
    children: React.ReactNode;
    align?: string;
  }) => <span>{children}</span>,
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

jest.mock('@/components/ui/avatar', () => ({
  Avatar: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  AvatarImage: ({
    src,
    alt,
    className,
  }: {
    src?: string;
    alt?: string;
    className?: string;
  }) => <img src={src} alt={alt ?? ''} className={className} />,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <h3 className={className}>{children}</h3>,
  CardDescription: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <p className={className}>{children}</p>,
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  // No ARIA role — menuitem requires a menu parent which the stub doesn't have
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <div onClick={onClick}>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuRadioGroup: ({
    children,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    onValueChange?: (v: string) => void;
    value?: string;
  }) => (
    <div
      data-value={value}
      onChange={(e: React.ChangeEvent<HTMLElement>) =>
        onValueChange?.((e.target as HTMLInputElement).value)
      }
    >
      {children}
    </div>
  ),
  DropdownMenuRadioItem: ({
    children,
    value,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    value: string;
    onClick?: () => void;
  } & React.HTMLAttributes<HTMLDivElement>) => (
    <div data-value={value} onClick={onClick} {...rest}>
      {children}
    </div>
  ),
}));

jest.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="carousel">{children}</div>
  ),
  CarouselContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CarouselItem: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CarouselPrevious: () => <button aria-label="Previous slide">Prev</button>,
  CarouselNext: () => <button aria-label="Next slide">Next</button>,
}));

// ─── App-level stubs ──────────────────────────────────────────────────────────

jest.mock('@/components/dashboardComp/quizzes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/components/header/logo', () => ({
  __esModule: true,
  default: () => <span data-testid="logo">Logo</span>,
}));

jest.mock('@/lib/auth-client', () => ({
  authClient: { signOut: jest.fn() },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import DashNavbar, {
  MobileBottomNav,
} from '@/components/dashboardComp/dashnavbar';
import DashboardMain, {
  usePerformance,
} from '@/components/dashboardComp/dashboardMain';
import DashCarousel from '@/components/dashboardComp/dashcarousel';
import GridItems, { QuizSkeleton } from '@/components/dashboardComp/griditems';
import { dashboardHref } from '@/components/dashboardComp/dashboardHref';
import getQuizzes from '@/components/dashboardComp/quizzes';
import { authClient } from '@/lib/auth-client';

const mockGetQuizzes = getQuizzes as jest.MockedFunction<typeof getQuizzes>;
const mockSignOut = authClient.signOut as jest.Mock;

// ─── Shared test data ─────────────────────────────────────────────────────────

const MOCK_QUIZ = {
  id: 'quiz-1',
  createdBy: 'user-1',
  creatorName: 'Alice',
  title: 'Algebra Basics',
  description: 'An intro to algebra.',
  numQuestions: 10,
  category: 'Mathematics' as const,
  imageUrl: '/algebra.png',
  createdAt: new Date().toISOString(),
};

const MOCK_QUIZZES = Array.from({ length: 10 }, (_, i) => ({
  ...MOCK_QUIZ,
  id: `quiz-${i}`,
  title: `Quiz ${i}`,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 1. UTILITY — dashboardHref
// ─────────────────────────────────────────────────────────────────────────────

describe('dashboardHref', () => {
  test('returns /dashboard for empty string', () => {
    expect(dashboardHref('')).toBe('/dashboard');
  });

  test('returns /dashboard for root slash', () => {
    expect(dashboardHref('/')).toBe('/dashboard');
  });

  test('builds sub-path correctly', () => {
    expect(dashboardHref('search')).toBe('/dashboard/search');
  });

  test('strips multiple leading slashes from path', () => {
    expect(dashboardHref('/search')).toBe('/dashboard/search');
    expect(dashboardHref('///search')).toBe('/dashboard/search');
  });

  test('preserves query strings in path', () => {
    expect(dashboardHref('search?q=math')).toBe('/dashboard/search?q=math');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. FORM VALIDATION — DashNavbar search form
// ─────────────────────────────────────────────────────────────────────────────

describe('DashNavbar — search form validation', () => {
  const user = userEvent.setup();

  beforeEach(() => mockPush.mockClear());

  function renderNavbar(loggedIn = true) {
    return render(
      <DashNavbar user={loggedIn ? { name: 'King', image: null } : null} />
    );
  }

  test('submits non-empty query and navigates to correct search URL', async () => {
    renderNavbar();
    const input = screen.getByPlaceholderText('Search...');
    await user.clear(input);
    await user.type(input, 'algebra');
    fireEvent.submit(input.closest('form')!);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('search?q=algebra')
    );
  });

  test('trims whitespace from query before building URL', async () => {
    renderNavbar();
    const input = screen.getByPlaceholderText('Search...');
    await user.clear(input);
    await user.type(input, '   algebra   ');
    fireEvent.submit(input.closest('form')!);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=algebra'));
    expect(mockPush).not.toHaveBeenCalledWith(
      expect.stringContaining('q=+++algebra+++')
    );
  });

  test('submitting empty query navigates to search with empty q param', async () => {
    renderNavbar();
    const input = screen.getByPlaceholderText('Search...');
    await user.clear(input);
    fireEvent.submit(input.closest('form')!);
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('search?q='));
  });

  test('whitespace-only query is treated as empty', async () => {
    renderNavbar();
    const input = screen.getByPlaceholderText('Search...');
    await user.clear(input);
    await user.type(input, '   ');
    fireEvent.submit(input.closest('form')!);
    const calledWith: string = mockPush.mock.calls[0][0];
    expect(calledWith).not.toMatch(/q=[^&]+[a-zA-Z]/);
  });

  test('special characters are URL-encoded', async () => {
    renderNavbar();
    const input = screen.getByPlaceholderText('Search...');
    await user.clear(input);
    await user.type(input, 'C++ basics');
    fireEvent.submit(input.closest('form')!);
    const calledWith: string = mockPush.mock.calls[0][0];
    expect(calledWith).toContain(encodeURIComponent('C++ basics'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. ERROR HANDLING — usePerformance hook
// ─────────────────────────────────────────────────────────────────────────────

describe('usePerformance hook — error handling', () => {
  function HookHarness({ userId }: { userId: string }) {
    const { performance, loading, error } = usePerformance(userId);
    if (loading) return <span>loading</span>;
    if (error) return <span data-testid="error">{error}</span>;
    return <span data-testid="score">{performance?.finalScore}</span>;
  }

  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  test('shows loading state initially', () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
    render(<HookHarness userId="u1" />);
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  test('sets error when API returns success: false', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Unauthorized' }),
    });
    render(<HookHarness userId="u1" />);
    expect(await screen.findByTestId('error')).toHaveTextContent(
      'Unauthorized'
    );
  });

  test('sets generic error message on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network down')
    );
    render(<HookHarness userId="u1" />);
    expect(await screen.findByTestId('error')).toHaveTextContent(
      'Failed to fetch performance'
    );
  });

  test('populates performance data on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          totalQuizzes: 5,
          finalScore: 92,
          accuracyRate: '0.88',
          longestStreak: 3,
        },
      }),
    });
    render(<HookHarness userId="u1" />);
    expect(await screen.findByTestId('score')).toHaveTextContent('92');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. UI BEHAVIOR — DashboardMain (performance card)
// ─────────────────────────────────────────────────────────────────────────────

describe('DashboardMain — performance card UI', () => {
  const defaultProps = {
    userId: 'u1',
    userName: 'King',
    userAvatar: '/avatar.png',
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  test('renders "Performance Summary" heading', async () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
    render(<DashboardMain {...defaultProps} />);
    expect(screen.getByText('Performance Summary')).toBeInTheDocument();
  });

  test('renders skeleton placeholders while /api/performance is loading', () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
    render(<DashboardMain {...defaultProps} />);
    // 4 stat boxes × 2 Skeleton each = 8 skeletons
    expect(screen.getAllByTestId('skeleton').length).toBe(8);
  });

  test('renders all four stat labels after data loads', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          totalQuizzes: 5,
          finalScore: 92,
          accuracyRate: '0.88',
          longestStreak: 3,
        },
      }),
    });
    render(<DashboardMain {...defaultProps} />);
    expect(await screen.findByText('Highest Score')).toBeInTheDocument();
    expect(screen.getByText('Average Accuracy')).toBeInTheDocument();
    expect(screen.getByText('Longest Streak')).toBeInTheDocument();
    expect(screen.getByText('Quiz Attempts')).toBeInTheDocument();
  });

  test('displays correct stat values from API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          totalQuizzes: 7,
          finalScore: 88,
          accuracyRate: '0.75',
          longestStreak: 5,
        },
      }),
    });
    render(<DashboardMain {...defaultProps} />);
    // finalScore
    expect(await screen.findByText('88')).toBeInTheDocument();
    // accuracyRate 0.75 → 75%
    expect(screen.getByText('75%')).toBeInTheDocument();
    // longestStreak
    expect(screen.getByText('5')).toBeInTheDocument();
    // totalQuizzes
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('shows "—" placeholders when performance is null (API failure)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Unauthorized' }),
    });
    render(<DashboardMain {...defaultProps} />);
    // Wait for loading to clear — the stat grid renders with "—" values
    await waitFor(() =>
      expect(screen.queryAllByTestId('skeleton').length).toBe(0)
    );
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBe(4);
  });

  test('"View Your Performance" button navigates to /dashboard/profile?tab=performance', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: {
          totalQuizzes: 1,
          finalScore: 50,
          accuracyRate: '0.5',
          longestStreak: 1,
        },
      }),
    });
    render(<DashboardMain {...defaultProps} />);
    await screen.findByText('Highest Score');
    fireEvent.click(
      screen.getByRole('button', { name: /View Your Performance/i })
    );
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('profile'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('performance')
    );
  });

  test('renders user avatar with correct alt text', async () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(new Promise(() => {}));
    render(<DashboardMain {...defaultProps} />);
    expect(screen.getByAltText("King's avatar")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. UI BEHAVIOR — DashCarousel (sections & modal)
// ─────────────────────────────────────────────────────────────────────────────

describe('DashCarousel — section rendering', () => {
  beforeEach(() => {
    mockPush.mockClear();
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  function mockFetch(url: string, quizzes: (typeof MOCK_QUIZ)[]) {
    (global.fetch as jest.Mock).mockImplementation((fetchUrl: string) => {
      if (fetchUrl.includes(url)) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: quizzes }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });
  }

  test('renders "Featured" section heading', async () => {
    mockFetch('/api/quiz?limit=6', []);
    render(<DashCarousel />);
    expect(await screen.findByText('Featured')).toBeInTheDocument();
  });

  test('renders Mathematics, Technology, Science category headings', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    render(<DashCarousel />);
    expect(await screen.findByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  test('"See More" links point to search filtered by category', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    render(<DashCarousel />);
    await screen.findByText('Mathematics');
    const seeMoreLinks = screen.getAllByText(/See More/i);
    // One "See More" per category (3 total); Featured has no See More
    expect(seeMoreLinks.length).toBe(3);
    const mathLink = seeMoreLinks[0].closest('a')!;
    expect(mathLink.getAttribute('href')).toContain('tags=Mathematics');
  });

  test('shows "Failed to load quizzes." when a category fetch errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    render(<DashCarousel />);
    // At least one section should show the error message
    expect(
      await screen.findAllByText(/Failed to load quizzes/i)
    ).not.toHaveLength(0);
  });

  test('shows "No quizzes here yet." when a category returns empty', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    render(<DashCarousel />);
    expect(await screen.findAllByText(/No quizzes here yet/i)).not.toHaveLength(
      0
    );
  });

  test('renders quiz cards as buttons with correct title attribute when quizzes load', async () => {
    const quizzes = [MOCK_QUIZ];
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: quizzes }),
    });
    render(<DashCarousel />);
    expect(
      (await screen.findAllByTitle(`Open quiz ${MOCK_QUIZ.title}`))[0]
    ).toBeInTheDocument();
  });
});

describe('DashCarousel — QuizDetailModal', () => {
  beforeEach(() => {
    mockPush.mockClear();
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  function setupWithQuiz() {
    // All quiz fetches return MOCK_QUIZ; detail fetches return empty
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/quiz/') && !url.includes('?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ quiz: { questions: [] } }),
        });
      }
      if (url.includes('/api/leaderboard/')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [MOCK_QUIZ] }),
      });
    });
  }

  async function openModal() {
    setupWithQuiz();
    render(<DashCarousel />);
    const cardBtn = (
      await screen.findAllByTitle(`Open quiz ${MOCK_QUIZ.title}`)
    )[0];
    fireEvent.click(cardBtn);
    // Modal renders the quiz title in an h2
    await screen.findAllByRole('heading', { name: MOCK_QUIZ.title });
  }

  test('clicking a quiz card opens the QuizDetailModal', async () => {
    await openModal();
    expect(
      screen.getAllByRole('heading', { name: MOCK_QUIZ.title })[0]
    ).toBeInTheDocument();
  });

  test('modal shows quiz title, creator, category, and question count', async () => {
    await openModal();
    expect(screen.getAllByText(MOCK_QUIZ.title)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Alice/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText('Mathematics')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/10 Questions/i)[0]).toBeInTheDocument();
  });

  test('modal shows quiz description', async () => {
    await openModal();
    expect(screen.getAllByText(MOCK_QUIZ.description)[0]).toBeInTheDocument();
  });

  test('close button (aria-label="Close") dismisses the modal', async () => {
    await openModal();
    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: MOCK_QUIZ.title, level: 2 })
      ).not.toBeInTheDocument();
    });
  });

  test('clicking the backdrop dismisses the modal', async () => {
    await openModal();
    // The outer fixed div receives the onClick(onClose) — target it by its class
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: MOCK_QUIZ.title, level: 2 })
      ).not.toBeInTheDocument();
    });
  });

  test('"Start Quiz" button navigates to play/<quizId>', async () => {
    await openModal();
    fireEvent.click(screen.getAllByRole('button', { name: /Start Quiz/i })[0]);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining(MOCK_QUIZ.id)
    );
  });

  test('Questions tab shows skeleton loaders while fetching', async () => {
    // Make questions fetch never resolve
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/quiz/') && !url.includes('?')) {
        return new Promise(() => {});
      }
      if (url.includes('/api/leaderboard/')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [MOCK_QUIZ] }),
      });
    });
    render(<DashCarousel />);
    const cardBtn = (
      await screen.findAllByTitle(`Open quiz ${MOCK_QUIZ.title}`)
    )[0];
    fireEvent.click(cardBtn);
    fireEvent.click(screen.getByRole('button', { name: /^Questions$/i }));
    await waitFor(() => {
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
    });
  });

  test('Questions tab shows "No questions yet." when empty', async () => {
    setupWithQuiz(); // questions returns []
    render(<DashCarousel />);
    const cardBtn = (
      await screen.findAllByTitle(`Open quiz ${MOCK_QUIZ.title}`)
    )[0];
    fireEvent.click(cardBtn);
    fireEvent.click(screen.getByRole('button', { name: /^Questions$/i }));
    expect(
      (await screen.findAllByText(/No questions yet/i))[0]
    ).toBeInTheDocument();
  });

  test('Questions tab lists question text when questions load', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/quiz/') && !url.includes('?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            quiz: { questions: [{ id: 'q1', question: 'What is 2+2?' }] },
          }),
        });
      }
      if (url.includes('/api/leaderboard/')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [MOCK_QUIZ] }),
      });
    });
    render(<DashCarousel />);
    const cardBtn = (
      await screen.findAllByTitle(`Open quiz ${MOCK_QUIZ.title}`)
    )[0];
    fireEvent.click(cardBtn);
    fireEvent.click(screen.getByRole('button', { name: /^Questions$/i }));
    expect((await screen.findAllByText('What is 2+2?'))[0]).toBeInTheDocument();
  });

  test('Leaderboard tab shows "No one has played this quiz yet." when empty', async () => {
    setupWithQuiz();
    render(<DashCarousel />);
    const cardBtn = (
      await screen.findAllByTitle(`Open quiz ${MOCK_QUIZ.title}`)
    )[0];
    fireEvent.click(cardBtn);
    fireEvent.click(screen.getByRole('button', { name: /^Leaderboard$/i }));
    expect(
      (await screen.findAllByText(/No one has played this quiz yet/i))[0]
    ).toBeInTheDocument();
  });

  test('Leaderboard tab shows entries with scores when data exists', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/quiz/') && !url.includes('?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ quiz: { questions: [] } }),
        });
      }
      if (url.includes('/api/leaderboard/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ rank: 1, userId: 'u1', userName: 'Bob', finalScore: 950 }],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ data: [MOCK_QUIZ] }),
      });
    });
    render(<DashCarousel />);
    const cardBtn = (
      await screen.findAllByTitle(`Open quiz ${MOCK_QUIZ.title}`)
    )[0];
    fireEvent.click(cardBtn);
    fireEvent.click(screen.getByRole('button', { name: /^Leaderboard$/i }));
    expect((await screen.findAllByText('Bob'))[0]).toBeInTheDocument();
    expect(screen.getAllByText('950')[0]).toBeInTheDocument();
  });

  test('switching between tabs shows correct content', async () => {
    setupWithQuiz();
    render(<DashCarousel />);
    const cardBtn = (
      await screen.findAllByTitle(`Open quiz ${MOCK_QUIZ.title}`)
    )[0];
    fireEvent.click(cardBtn);

    // Default tab is Details — description is visible
    expect(
      (await screen.findAllByText(MOCK_QUIZ.description))[0]
    ).toBeInTheDocument();

    // Switch to Questions
    fireEvent.click(screen.getByRole('button', { name: /^Questions$/i }));
    expect(
      (await screen.findAllByText(/No questions yet/i))[0]
    ).toBeInTheDocument();

    // Switch to Leaderboard
    fireEvent.click(screen.getByRole('button', { name: /^Leaderboard$/i }));
    expect(
      (await screen.findAllByText(/No one has played this quiz yet/i))[0]
    ).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. UI BEHAVIOR — DashNavbar
// ─────────────────────────────────────────────────────────────────────────────

describe('DashNavbar — UI behavior', () => {
  beforeEach(() => mockPush.mockClear());

  test('renders Logo', () => {
    render(<DashNavbar user={null} />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();
  });

  test('shows Login option in dropdown when user is null (guest)', () => {
    render(<DashNavbar user={null} />);
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('shows Profile and Logout options when user is logged in', () => {
    render(<DashNavbar user={{ name: 'King', image: null }} />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('does NOT show Profile/Logout when user is null', () => {
    render(<DashNavbar user={null} />);
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  test('clicking Profile navigates to /dashboard/profile', () => {
    render(<DashNavbar user={{ name: 'King', image: null }} />);
    fireEvent.click(screen.getByText('Profile'));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('profile'));
  });

  test('clicking Logout calls authClient.signOut', async () => {
    mockSignOut.mockResolvedValueOnce(undefined);
    render(<DashNavbar user={{ name: 'King', image: null }} />);
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
  });

  test('avatar shows user initial as fallback when no image', () => {
    render(<DashNavbar user={{ name: 'King', image: null }} />);
    expect(screen.getByText('K')).toBeInTheDocument();
  });

  test('avatar shows "G" fallback for guests', () => {
    render(<DashNavbar user={null} />);
    expect(screen.getByText('G')).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. UI BEHAVIOR — MobileBottomNav
// ─────────────────────────────────────────────────────────────────────────────

describe('MobileBottomNav — UI behavior', () => {
  test('renders all four nav items', () => {
    render(<MobileBottomNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Class')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  test('Home link points to /dashboard', () => {
    render(<MobileBottomNav />);
    const homeLink = screen.getByText('Home').closest('a')!;
    expect(homeLink.getAttribute('href')).toBe('/dashboard');
  });

  test('Search link points to /dashboard/search', () => {
    render(<MobileBottomNav />);
    const searchLink = screen.getByText('Search').closest('a')!;
    expect(searchLink.getAttribute('href')).toBe('/dashboard/search');
  });

  test('active link gets text-blue-600 class (pathname=/dashboard/search → Search is active)', () => {
    // mockPathname is already /dashboard/search from the top-level navigation mock
    render(<MobileBottomNav />);
    const searchLink = screen.getByText('Search').closest('a')!;
    expect(searchLink.className).toContain('text-blue-600');
  });

  test('inactive links do NOT have text-blue-600 class', () => {
    render(<MobileBottomNav />);
    const homeLink = screen.getByText('Home').closest('a')!;
    expect(homeLink.className).not.toContain('text-blue-600');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. UI BEHAVIOR — GridItems card & modal
// ─────────────────────────────────────────────────────────────────────────────

describe('GridItems — card rendering', () => {
  test('renders quiz title', () => {
    render(<GridItems quiz={MOCK_QUIZ} />);
    expect(screen.getByText(MOCK_QUIZ.title)).toBeInTheDocument();
  });

  test('renders quiz description', () => {
    render(<GridItems quiz={MOCK_QUIZ} />);
    expect(screen.getAllByText(MOCK_QUIZ.description)[0]).toBeInTheDocument();
  });

  test('renders category badge', () => {
    render(<GridItems quiz={MOCK_QUIZ} />);
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
  });

  test('renders question count badge', () => {
    render(<GridItems quiz={MOCK_QUIZ} />);
    expect(screen.getByText('10 Qs')).toBeInTheDocument();
  });

  test('renders quiz image with correct alt text', () => {
    render(<GridItems quiz={MOCK_QUIZ} />);
    expect(screen.getByAltText(MOCK_QUIZ.title)).toBeInTheDocument();
  });

  test('uses placeholder image when imageUrl is undefined', () => {
    const quiz = { ...MOCK_QUIZ, imageUrl: undefined };
    render(<GridItems quiz={quiz} />);
    const img = screen.getByAltText(quiz.title) as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/placeholderquiz.png');
  });
});

describe('GridItems — QuizDetailModal', () => {
  beforeEach(() => {
    mockPush.mockClear();
    global.fetch = jest.fn();
  });
  afterEach(() => jest.restoreAllMocks());

  function setupModalFetch({
    questionsError = false,
    leaderboardEmpty = true,
  } = {}) {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/quiz/')) {
        if (questionsError)
          return Promise.resolve({ ok: false, json: async () => ({}) });
        return Promise.resolve({
          ok: true,
          json: async () => ({
            quiz: { questions: [{ id: 'q1', question: 'What is 1+1?' }] },
          }),
        });
      }
      if (url.includes('/api/leaderboard/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: leaderboardEmpty
              ? []
              : [{ rank: 1, userId: 'u1', userName: 'Alice', finalScore: 100 }],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });
  }

  test('clicking the card button opens the modal with quiz title', async () => {
    setupModalFetch();
    render(<GridItems quiz={MOCK_QUIZ} />);
    fireEvent.click(screen.getByRole('button'));
    expect(
      (await screen.findAllByRole('heading', { name: MOCK_QUIZ.title }))[0]
    ).toBeInTheDocument();
  });

  test('modal shows creator name', async () => {
    setupModalFetch();
    render(<GridItems quiz={MOCK_QUIZ} />);
    fireEvent.click(screen.getByRole('button'));
    expect((await screen.findAllByText(/Alice/i))[0]).toBeInTheDocument();
  });

  test('modal shows "Anonymous" when creatorName is undefined', async () => {
    setupModalFetch();
    const quiz = { ...MOCK_QUIZ, creatorName: undefined };
    render(<GridItems quiz={quiz} />);
    fireEvent.click(screen.getByRole('button'));
    expect((await screen.findAllByText(/Anonymous/i))[0]).toBeInTheDocument();
  });

  test('modal close button dismisses the modal', async () => {
    setupModalFetch();
    render(<GridItems quiz={MOCK_QUIZ} />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findAllByRole('heading', { name: MOCK_QUIZ.title });
    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: MOCK_QUIZ.title, level: 2 })
      ).not.toBeInTheDocument();
    });
  });

  test('"Start Quiz" navigates to /play/<quizId>', async () => {
    setupModalFetch();
    render(<GridItems quiz={MOCK_QUIZ} />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findAllByRole('heading', { name: MOCK_QUIZ.title });
    fireEvent.click(screen.getAllByRole('button', { name: /Start Quiz/i })[0]);
    expect(mockPush).toHaveBeenCalledWith(`/play/${MOCK_QUIZ.id}`);
  });

  test('Questions tab shows question text after loading', async () => {
    setupModalFetch();
    render(<GridItems quiz={MOCK_QUIZ} />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findAllByRole('heading', { name: MOCK_QUIZ.title });
    fireEvent.click(screen.getByRole('button', { name: /^Questions$/i }));
    expect((await screen.findAllByText('What is 1+1?'))[0]).toBeInTheDocument();
  });

  test('Questions tab shows "Failed to load questions." on fetch error', async () => {
    setupModalFetch({ questionsError: true });
    render(<GridItems quiz={MOCK_QUIZ} />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findAllByRole('heading', { name: MOCK_QUIZ.title });
    fireEvent.click(screen.getByRole('button', { name: /^Questions$/i }));
    expect(
      (await screen.findAllByText(/Failed to load questions/i))[0]
    ).toBeInTheDocument();
  });

  test('Leaderboard tab shows "No one has played this quiz yet." when empty', async () => {
    setupModalFetch({ leaderboardEmpty: true });
    render(<GridItems quiz={MOCK_QUIZ} />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findAllByRole('heading', { name: MOCK_QUIZ.title });
    fireEvent.click(screen.getByRole('button', { name: /^Leaderboard$/i }));
    expect(
      (await screen.findAllByText(/No one has played this quiz yet/i))[0]
    ).toBeInTheDocument();
  });

  test('Leaderboard tab shows entry when data exists', async () => {
    setupModalFetch({ leaderboardEmpty: false });
    render(<GridItems quiz={MOCK_QUIZ} />);
    fireEvent.click(screen.getByRole('button'));
    await screen.findAllByRole('heading', { name: MOCK_QUIZ.title });
    fireEvent.click(screen.getByRole('button', { name: /^Leaderboard$/i }));
    expect((await screen.findAllByText('Alice'))[0]).toBeInTheDocument();
    expect(screen.getAllByText('100')[0]).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. UI BEHAVIOR — QuizSkeleton
// ─────────────────────────────────────────────────────────────────────────────

describe('QuizSkeleton', () => {
  test('renders multiple Skeleton elements', () => {
    render(<QuizSkeleton />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});
