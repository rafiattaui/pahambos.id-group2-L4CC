/**
 * SearchPage Frontend Tests
 * Covers: Search Input Validation, Fetch Error Handling, and Pagination Boundary Guards
 *
 * Setup:
 *   npm install --save-dev jest @testing-library/react @testing-library/user-event @testing-library/jest-dom jest-environment-jsdom ts-jest
 *
 * jest.config.ts:
 *   testEnvironment: 'jsdom'
 *   setupFilesAfterFramework: ['@testing-library/jest-dom']
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ─── Module-scope mock handles ────────────────────────────────────────────────

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

// ─── App-level stubs ──────────────────────────────────────────────────────────

jest.mock('@/components/dashboardComp/quizzes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import SearchPage from '@/components/dashboardComp/searchpage';
import getQuizzes from '@/components/dashboardComp/quizzes';

const mockGetQuizzes = getQuizzes as jest.MockedFunction<typeof getQuizzes>;

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

function makeSearchParams(entries: Record<string, string | string[]>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(entries)) {
    if (Array.isArray(v)) v.forEach((val) => params.append(k, val));
    else params.set(k, v);
  }
  return params;
}

function renderSearch(params?: URLSearchParams) {
  mockUseSearchParams.mockReturnValue(params ?? new URLSearchParams());
  return render(<SearchPage />);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FORM VALIDATION — SearchPage input & category pills
// ─────────────────────────────────────────────────────────────────────────────

describe('SearchPage — search input validation', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    mockPush.mockClear();
    mockGetQuizzes.mockResolvedValue({ data: [] });
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  test('shows "at least 3 characters" error when query is < 3 chars', async () => {
    // The validation error is only triggered by submitSearch() (Enter key press),
    // NOT by reading the URL. Rendering with q='ab' in the URL sets queryTooShort
    // but never calls setValidationError, so no <p> error element is rendered.
    // Fix: type a short query into the input and press Enter to trigger it.
    renderSearch();
    const input = screen.getByPlaceholderText('Search...');
    await user.clear(input);
    await user.type(input, 'ab');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(
      await screen.findByText(/at least 3 characters/i)
    ).toBeInTheDocument();
  });

  test('does NOT show validation error when query is exactly 3 characters', async () => {
    renderSearch(makeSearchParams({ q: 'abc' }));
    await waitFor(() => {
      expect(
        screen.queryByText(/at least 3 characters/i)
      ).not.toBeInTheDocument();
    });
  });

  test('Enter key triggers search navigation', async () => {
    renderSearch();
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'science');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('q=science'));
  });

  test('non-Enter keydown does not trigger navigation', async () => {
    renderSearch();
    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'test');
    fireEvent.keyDown(input, { key: 'a', code: 'KeyA' });
    expect(mockPush).not.toHaveBeenCalled();
  });

  test('category pill "All" clears tags from URL', () => {
    renderSearch(makeSearchParams({ tags: 'Science' }));
    fireEvent.click(screen.getByRole('button', { name: /^All$/ }));
    expect(mockPush).toHaveBeenCalledWith(expect.not.stringContaining('tags='));
  });

  test('clicking a category pill adds it to URL params', () => {
    renderSearch();
    fireEvent.click(screen.getByRole('button', { name: /^Mathematics$/ }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('tags=Mathematics')
    );
  });

  test('clicking an already-active category pill removes it from URL', () => {
    renderSearch(makeSearchParams({ tags: 'Mathematics' }));
    fireEvent.click(screen.getByRole('button', { name: /^Mathematics$/ }));
    expect(mockPush).toHaveBeenCalledWith(
      expect.not.stringContaining('tags=Mathematics')
    );
  });

  test('any filter change resets page param to 1', () => {
    renderSearch(makeSearchParams({ page: '3' }));
    fireEvent.click(screen.getByRole('button', { name: /^Science$/ }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('invalid sort param in URL falls back to displaying "Newest"', () => {
    renderSearch(makeSearchParams({ sort: 'random-garbage' }));
    // The DropdownMenu stub always renders its content open, so both the trigger
    // button label ("Newest") and the radio item inside the dropdown ("Newest")
    // are in the DOM simultaneously. Use getAllByText and assert the button
    // specifically to avoid the 'multiple elements found' error.
    const matches = screen.getAllByText(/^Newest$/i);
    // At minimum the trigger button must show 'Newest'
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // The trigger button itself should be one of the matches
    const triggerButton = matches.find(
      (el) => el.tagName.toLowerCase() === 'button'
    );
    expect(triggerButton).toBeInTheDocument();
  });

  test('"Results for" heading appears when query is active and results exist', async () => {
    mockGetQuizzes.mockResolvedValue({ data: MOCK_QUIZZES });
    renderSearch(makeSearchParams({ q: 'algebra' }));
    expect(await screen.findByText(/Results for/i)).toBeInTheDocument();
  });

  test('"Results for" heading does NOT appear with no query', async () => {
    mockGetQuizzes.mockResolvedValue({ data: MOCK_QUIZZES });
    renderSearch();
    await waitFor(() => expect(mockGetQuizzes).toHaveBeenCalled());
    expect(screen.queryByText(/Results for/i)).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. ERROR HANDLING — SearchPage fetch failures
// ─────────────────────────────────────────────────────────────────────────────

describe('SearchPage — fetch error handling', () => {
  beforeEach(() => {
    mockPush.mockClear();
    // Non-empty query so the fetch effect fires
    mockUseSearchParams.mockReturnValue(new URLSearchParams('q=physics'));
  });

  test('displays error message when getQuizzes rejects', async () => {
    mockGetQuizzes.mockRejectedValueOnce(new Error('500'));
    render(<SearchPage />);
    expect(
      await screen.findByText(/Failed to fetch quizzes/i)
    ).toBeInTheDocument();
  });

  test('does not render quiz cards on fetch error', async () => {
    mockGetQuizzes.mockRejectedValueOnce(new Error('timeout'));
    render(<SearchPage />);
    await screen.findByText(/Failed to fetch quizzes/i);
    // GridItems renders a button wrapping a Card — none should exist
    expect(
      screen.queryByRole('button', { name: /open quiz/i })
    ).not.toBeInTheDocument();
  });

  test('shows "No results found" empty-state when fetch returns empty array', async () => {
    mockGetQuizzes.mockResolvedValueOnce({ data: [] });
    render(<SearchPage />);
    expect(await screen.findByText(/No results found/i)).toBeInTheDocument();
  });

  test('shows QuizSkeleton placeholders while fetch is in-flight', () => {
    mockGetQuizzes.mockReturnValueOnce(new Promise(() => {}));
    render(<SearchPage />);
    // QuizSkeleton renders multiple <Skeleton> components
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. ERROR HANDLING — Pagination boundary guards
// ─────────────────────────────────────────────────────────────────────────────

describe('SearchPage — pagination boundary guards', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockGetQuizzes.mockResolvedValue({ data: MOCK_QUIZZES });
  });

  test('Previous link has disabled classes on page 1', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('page=1'));
    render(<SearchPage />);
    await waitFor(() => expect(mockGetQuizzes).toHaveBeenCalled());
    const prev = screen.getByRole('link', { name: /previous/i });
    expect(prev.className).toContain('opacity-50');
    expect(prev.className).toContain('pointer-events-none');
  });

  test('Next link has disabled classes on the last page', async () => {
    // 10 items at 8 per page = 2 pages; page 2 is the last
    mockUseSearchParams.mockReturnValue(new URLSearchParams('page=2'));
    render(<SearchPage />);
    await waitFor(() => expect(mockGetQuizzes).toHaveBeenCalled());
    const next = screen.getByRole('link', { name: /next/i });
    expect(next.className).toContain('opacity-50');
    expect(next.className).toContain('pointer-events-none');
  });

  test('Previous link is NOT disabled on page 2', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('page=2'));
    render(<SearchPage />);
    await waitFor(() => expect(mockGetQuizzes).toHaveBeenCalled());
    const prev = screen.getByRole('link', { name: /previous/i });
    expect(prev.className).not.toContain('pointer-events-none');
  });

  test('clicking Next navigates to the next page', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('page=1'));
    render(<SearchPage />);
    await waitFor(() => expect(mockGetQuizzes).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('link', { name: /next/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });

  test('clicking Previous navigates to the previous page', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('page=2'));
    render(<SearchPage />);
    await waitFor(() => expect(mockGetQuizzes).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('link', { name: /previous/i }));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=1'));
  });

  test('out-of-range page param does not crash the component', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('page=999'));
    render(<SearchPage />);
    await waitFor(() => expect(mockGetQuizzes).toHaveBeenCalled());
    expect(
      screen.queryByText(/Failed to fetch quizzes/i)
    ).not.toBeInTheDocument();
  });
});
