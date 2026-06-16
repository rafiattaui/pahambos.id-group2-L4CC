/**
 * Landing Page – Jest + React Testing Library
 *
 * Coverage:
 *  1. HeroSect   – CTA href, text content, decorative SVGs
 *  2. Navbar     – scroll-to-section, auth states, mobile burger menu
 *  3. Create     – feature list, video, "Create Now!" button routing
 *  4. Learn      – feature list, video, "Start Learning!" button routing
 *  5. Discover   – category carousel renders all 7 categories
 *  6. Category   – image + name rendering
 *  7. BottomPage – stats, "How It Works" steps, CTA buttons (auth-aware)
 *  8. FadeInSection – IntersectionObserver reveal behaviour
 *  9. Logo       – image attributes
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Module mocks (must come before component imports) ───────────────────────

// next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// next/image – renders a plain <img> so assertions work
jest.mock(
  'next/image',
  () =>
    function MockImage({
      src,
      alt,
      fill,
      ...rest
    }: {
      src: string;
      alt: string;
      fill?: boolean;
      [key: string]: unknown;
    }) {
      // eslint-disable-next-line @next/next/no-img-element
      return (
        <img
          src={src}
          alt={alt}
          data-fill={fill ? 'true' : undefined}
          {...rest}
        />
      );
    }
);

// next/link – renders a plain <a>
jest.mock(
  'next/link',
  () =>
    function MockLink({
      href,
      children,
    }: {
      href: string;
      children: React.ReactNode;
    }) {
      return <a href={href}>{children}</a>;
    }
);

// auth-client – default: unauthenticated
// Typed as jest.Mock so mockReturnValue accepts both `{ data: null }` and
// `{ data: { user: … } }` without a TS overlap error.
const mockUseSession: jest.Mock = jest.fn(() => ({ data: null }));
jest.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => mockUseSession(),
    signOut: jest.fn().mockResolvedValue({}),
  },
}));

// dashboardHref helper
jest.mock('@/components/dashboardComp/dashboardHref', () => ({
  dashboardHref: (path: string) => `/dashboard/${path}`,
}));

// shadcn/ui stubs
jest.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    variant,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    variant?: string;
    'aria-label'?: string;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-variant={variant}
      aria-label={ariaLabel}
    >
      {children}
    </button>
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
  AvatarImage: ({ src, className }: { src: string; className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="avatar" className={className} />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({
    children,
    asChild,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <div data-testid="dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
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
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr />,
}));

// Carousel stub – renders all children directly so category cards are visible
jest.mock('@/components/ui/carousel', () => ({
  Carousel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="carousel">{children}</div>
  ),
  CarouselContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CarouselItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  CarouselNext: () => <button aria-label="Next slide">›</button>,
  CarouselPrevious: () => <button aria-label="Previous slide">‹</button>,
}));

jest.mock('embla-carousel-autoplay', () => jest.fn(() => ({})));

// lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowRight: () => <svg data-testid="arrow-right-icon" />,
  UserCircleIcon: () => <svg data-testid="user-circle-icon" />,
  DoorOpen: () => <svg data-testid="door-open-icon" />,
}));

// FadeInSection – renders children transparently for unit tests
jest.mock(
  '@/components/animation/fade-in-section',
  () =>
    function FadeInSection({ children }: { children: React.ReactNode }) {
      return <div data-testid="fade-in-section">{children}</div>;
    }
);

// ─── Component imports ────────────────────────────────────────────────────────
import HeroSect from '@/components/Hero/herosect';
import Navbar from '@/components/header/navbar';
import Create from '@/components/landing/create';
import Learn from '@/components/landing/learn';
import Discover from '@/components/landing/discover';
import Category, { categories } from '@/components/category_carousel/category';
import BottomPage from '@/components/landing/bottompage';
import FadeInSectionReal from '@/components/animation/fade-in-section';
import Logo from '@/components/header/logo';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SESSION_USER = {
  user: { name: 'Alice', image: '/alice.jpg' },
};

// ─── 1. HeroSect ─────────────────────────────────────────────────────────────
describe('HeroSect', () => {
  afterEach(() => mockUseSession.mockReturnValue({ data: null }));

  it('renders the brand name "PahamBos.id" headline', () => {
    render(<HeroSect />);
    // h1 contains "Paham", "Bos", ".id" as separate spans
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('PahamBos.id');
  });

  it('renders the platform description paragraph', () => {
    render(<HeroSect />);
    expect(
      screen.getByText(/The Learning platform for everyone/i)
    ).toBeInTheDocument();
  });

  it('CTA button links to /register when unauthenticated', () => {
    render(<HeroSect />);
    const link = screen.getByRole('link', { name: /get started/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('CTA button links to /dashboard when authenticated', () => {
    mockUseSession.mockReturnValue({ data: SESSION_USER });
    render(<HeroSect />);
    const link = screen.getByRole('link', { name: /get started/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('renders the ArrowRight icon inside the CTA', () => {
    render(<HeroSect />);
    expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
  });

  it('renders the "Join us today" call-to-action copy', () => {
    render(<HeroSect />);
    expect(
      screen.getByText(/Join us today and unlock your full potential/i)
    ).toBeInTheDocument();
  });
});

// ─── 2. Navbar ───────────────────────────────────────────────────────────────
describe('Navbar', () => {
  const sections = ['Discover', 'Learn', 'Create'];

  beforeEach(() => mockUseSession.mockReturnValue({ data: null }));
  afterEach(() => {
    mockUseSession.mockReturnValue({ data: null });
    jest.clearAllMocks();
  });

  it('renders all section nav buttons on desktop', () => {
    render(<Navbar sections={sections} />);
    sections.forEach((s) =>
      // Each section appears twice (desktop + mobile drawer)
      expect(screen.getAllByText(s).length).toBeGreaterThanOrEqual(1)
    );
  });

  it('shows Register and Log In buttons when unauthenticated', () => {
    render(<Navbar sections={sections} />);
    // Both desktop and mobile drawer render these buttons — assert at least one exists
    expect(
      screen.getAllByRole('button', { name: /^register$/i }).length
    ).toBeGreaterThanOrEqual(1);
    expect(
      screen.getAllByRole('button', { name: /^log in$/i }).length
    ).toBeGreaterThanOrEqual(1);
  });

  it('hides Register / Log In buttons when authenticated', () => {
    mockUseSession.mockReturnValue({ data: SESSION_USER });
    render(<Navbar sections={sections} />);
    expect(
      screen.queryAllByRole('button', { name: /^register$/i })
    ).toHaveLength(0);
    expect(screen.queryAllByRole('button', { name: /^log in$/i })).toHaveLength(
      0
    );
  });

  it('Register button navigates to /register', () => {
    render(<Navbar sections={sections} />);
    // The desktop Register button sits inside ml-auto flex div (last nav child).
    // Grab all matches and click the last one — that's always the desktop button.
    const registerBtns = screen.getAllByRole('button', { name: /^register$/i });
    fireEvent.click(registerBtns[registerBtns.length - 1]);
    expect(mockPush).toHaveBeenCalledWith('/register');
  });

  it('Log In button navigates to /login', () => {
    render(<Navbar sections={sections} />);
    const logInBtns = screen.getAllByRole('button', { name: /^log in$/i });
    fireEvent.click(logInBtns[logInBtns.length - 1]);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('mobile burger button toggles the drawer', () => {
    const { container } = render(<Navbar sections={sections} />);
    // The burger button is the only button with class "relative z-50" in the mobile wrapper
    const burgerBtn = container.querySelector(
      'button.relative.z-50'
    ) as HTMLElement;
    expect(burgerBtn).not.toBeNull();
    // Before click: drawer has -translate-y-full (hidden)
    const drawer = container.querySelector(
      '.fixed.top-0.right-0.left-0'
    ) as HTMLElement;
    expect(drawer.className).toContain('-translate-y-full');
    fireEvent.click(burgerBtn);
    // After click: drawer loses -translate-y-full and gains translate-y-0
    expect(drawer.className).toContain('translate-y-0');
  });

  it('scrolls to a section when a nav button is clicked', () => {
    // Create a mock DOM element with getBoundingClientRect
    const mockElement = document.createElement('div');
    jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
    jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
      top: 500,
      bottom: 600,
      left: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    const scrollToSpy = jest
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => {});

    render(<Navbar sections={['Discover']} />);
    fireEvent.click(screen.getAllByText('Discover')[0]);

    expect(document.getElementById).toHaveBeenCalledWith('discover');
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );

    scrollToSpy.mockRestore();
    (document.getElementById as jest.Mock).mockRestore();
  });

  it('shows guest fallback "G" in avatar when not logged in', () => {
    render(<Navbar sections={sections} />);
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('shows first letter of user name in avatar when logged in', () => {
    mockUseSession.mockReturnValue({ data: SESSION_USER });
    render(<Navbar sections={sections} />);
    expect(screen.getByText('A')).toBeInTheDocument(); // "Alice"[0]
  });

  it('shows Profile and Logout menu items when authenticated', () => {
    mockUseSession.mockReturnValue({ data: SESSION_USER });
    render(<Navbar sections={sections} />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });
});

// ─── 3. Create ───────────────────────────────────────────────────────────────
describe('Create section', () => {
  it('renders the heading "Create Your Own Quiz"', () => {
    render(<Create />);
    expect(
      screen.getByRole('heading', { name: /create your own quiz/i })
    ).toBeInTheDocument();
  });

  it('renders the introductory paragraph about quiz creation', () => {
    render(<Create />);
    expect(screen.getByText(/easy to use for new users/i)).toBeInTheDocument();
  });

  it('renders all four feature list items', () => {
    render(<Create />);
    expect(screen.getByText(/multiple question types/i)).toBeInTheDocument();
    expect(screen.getByText(/customizable quiz settings/i)).toBeInTheDocument();
    expect(screen.getByText(/crop preview/i)).toBeInTheDocument();
    expect(screen.getByText(/draft save/i)).toBeInTheDocument();
  });

  it('"Create Now!" button navigates to /dashboard/create', () => {
    render(<Create />);
    fireEvent.click(screen.getByRole('button', { name: /create now/i }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/create');
  });

  it('renders the demo video element with correct source', () => {
    render(<Create />);
    const source = document.querySelector('source[src="/create_demo.mp4"]');
    expect(source).toBeInTheDocument();
  });

  it('video has autoPlay, muted, and loop attributes', () => {
    render(<Create />);
    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video).toHaveAttribute('autoplay');
    // React does not reflect the `muted` prop as a DOM attribute (known React behaviour);
    // check the JS property directly instead.
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('loop');
  });
});

// ─── 4. Learn ────────────────────────────────────────────────────────────────
describe('Learn section', () => {
  it('renders the heading "Start To Learn"', () => {
    render(<Learn />);
    expect(
      screen.getByRole('heading', { name: /start to learn/i })
    ).toBeInTheDocument();
  });

  it('renders the introductory paragraph', () => {
    render(<Learn />);
    expect(
      screen.getByText(/having fun while learning by playing quizzes/i)
    ).toBeInTheDocument();
  });

  it('renders all four feature list items', () => {
    render(<Learn />);
    expect(screen.getByText(/right or wrong/i)).toBeInTheDocument();
    expect(screen.getByText(/hint system/i)).toBeInTheDocument();
    expect(screen.getByText(/time limit/i)).toBeInTheDocument();
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
  });

  it('"Start Learning!" button navigates to /dashboard/search', () => {
    render(<Learn />);
    fireEvent.click(screen.getByRole('button', { name: /start learning/i }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard/search');
  });

  it('renders the demo video element with correct source', () => {
    render(<Learn />);
    const source = document.querySelector('source[src="/learning_demo.mp4"]');
    expect(source).toBeInTheDocument();
  });

  it('video has autoPlay, muted, and loop attributes', () => {
    render(<Learn />);
    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video).toHaveAttribute('autoplay');
    // React does not reflect the `muted` prop as a DOM attribute (known React behaviour);
    // check the JS property directly instead.
    expect(video.muted).toBe(true);
    expect(video).toHaveAttribute('loop');
  });
});

// ─── 5. Discover ─────────────────────────────────────────────────────────────
describe('Discover section', () => {
  it('renders the section heading', () => {
    render(<Discover />);
    expect(screen.getByText(/discover quizzes/i)).toBeInTheDocument();
  });

  it('renders the sub-copy paragraph', () => {
    render(<Discover />);
    expect(
      screen.getByText(
        /explore many quizzes based on your preferred categories/i
      )
    ).toBeInTheDocument();
  });

  it('renders a CarouselItem for every category (7 total)', () => {
    render(<Discover />);
    categories.forEach((cat) => {
      expect(screen.getByText(cat.name)).toBeInTheDocument();
    });
    expect(categories).toHaveLength(7);
  });

  it('renders Previous and Next carousel navigation buttons', () => {
    render(<Discover />);
    expect(
      screen.getByRole('button', { name: /previous slide/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /next slide/i })
    ).toBeInTheDocument();
  });
});

// ─── 6. Category ─────────────────────────────────────────────────────────────
describe('Category component', () => {
  it('renders the category name', () => {
    render(<Category name="Science" image="/Science.png" />);
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('renders the category image with correct src and alt', () => {
    render(<Category name="History" image="/History.png" />);
    const img = screen.getByAltText('History');
    expect(img).toHaveAttribute('src', '/History.png');
  });

  it('renders every category in the exported categories array', () => {
    const expectedNames = [
      'General',
      'Geography',
      'History',
      'Language',
      'Mathematic',
      'Science',
      'Technology',
    ];
    expect(categories.map((c) => c.name)).toEqual(expectedNames);
  });
});

// ─── 7. BottomPage ───────────────────────────────────────────────────────────
describe('BottomPage', () => {
  beforeEach(() => mockUseSession.mockReturnValue({ data: null }));
  afterEach(() => mockUseSession.mockReturnValue({ data: null }));

  // Stats section
  it('renders "The Numbers Speak for Themselves" heading', () => {
    render(<BottomPage />);
    expect(
      screen.getByText(/the numbers speak for themselves/i)
    ).toBeInTheDocument();
  });

  it('renders the active users stat "10000+"', () => {
    render(<BottomPage />);
    expect(screen.getByText('10000+')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
  });

  it('renders the quizzes stat "500+"', () => {
    render(<BottomPage />);
    expect(screen.getByText('500+')).toBeInTheDocument();
    expect(screen.getByText('Quizzes')).toBeInTheDocument();
  });

  it('renders the categories stat "7"', () => {
    render(<BottomPage />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  // "How It Works" steps
  it('renders "How It Works" section heading', () => {
    render(<BottomPage />);
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
  });

  it('renders all three step numbers (01, 02, 03)', () => {
    render(<BottomPage />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
  });

  it('renders all three step titles', () => {
    render(<BottomPage />);
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Pick a Quiz')).toBeInTheDocument();
    expect(screen.getByText('Start Learning')).toBeInTheDocument();
  });

  it('renders all three step descriptions', () => {
    render(<BottomPage />);
    expect(
      screen.getByText('Create your free account in seconds.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Browse 7 categories and choose your topic.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Answer questions and track your progress.')
    ).toBeInTheDocument();
  });

  it('renders step images with correct alt text', () => {
    render(<BottomPage />);
    expect(screen.getByAltText('Sign Up')).toBeInTheDocument();
    expect(screen.getByAltText('Pick a Quiz')).toBeInTheDocument();
    expect(screen.getByAltText('Start Learning')).toBeInTheDocument();
  });

  // CTA section
  it('renders "Ready to Start Learning?" CTA heading', () => {
    render(<BottomPage />);
    expect(screen.getByText(/ready to start learning/i)).toBeInTheDocument();
  });

  it('renders "Join thousands of students" copy', () => {
    render(<BottomPage />);
    expect(
      screen.getByText(/join thousands of students already learning/i)
    ).toBeInTheDocument();
  });

  it('"Get Started Free" links to /register when unauthenticated', () => {
    render(<BottomPage />);
    const link = screen.getByRole('link', { name: /get started free/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('"Get Started Free" links to /dashboard when authenticated', () => {
    mockUseSession.mockReturnValue({ data: SESSION_USER });
    render(<BottomPage />);
    const link = screen.getByRole('link', { name: /get started free/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('"Browse Quizzes" button links to /dashboard/search', () => {
    render(<BottomPage />);
    const link = screen.getByRole('link', { name: /browse quizzes/i });
    expect(link).toHaveAttribute('href', '/dashboard/search');
  });

  it('renders three FadeInSection wrappers', () => {
    render(<BottomPage />);
    expect(screen.getAllByTestId('fade-in-section')).toHaveLength(3);
  });
});

// ─── 8. FadeInSection (real component) ───────────────────────────────────────
// We load the real module via requireActual (bypassing the mock above which
// returns a <div> stub) so we can test actual IntersectionObserver behaviour.
describe('FadeInSection (real implementation)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let RealFadeIn: React.ComponentType<any>;
  let observerCallback: IntersectionObserverCallback;
  let mockObserve: jest.Mock;
  let mockUnobserve: jest.Mock;
  let mockDisconnect: jest.Mock;

  beforeAll(() => {
    // requireActual resolves the same path as the jest.mock alias so we get
    // the un-mocked export.
    RealFadeIn = (
      jest.requireActual('@/components/animation/fade-in-section') as {
        default: React.ComponentType<
          React.ComponentProps<'section'> & {
            threshold?: number;
            rootMargin?: string;
            once?: boolean;
            direction?: 'up' | 'left' | 'right';
          }
        >;
      }
    ).default;
  });

  beforeEach(() => {
    mockObserve = jest.fn();
    mockUnobserve = jest.fn();
    mockDisconnect = jest.fn();

    // Capture the IntersectionObserver callback so tests can fire it manually.
    global.IntersectionObserver = jest.fn(
      (cb: IntersectionObserverCallback) => {
        observerCallback = cb;
        return {
          observe: mockObserve,
          unobserve: mockUnobserve,
          disconnect: mockDisconnect,
        };
      }
    ) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => jest.restoreAllMocks());

  // Helper: returns the rendered <section> element
  function renderSection(props = {}, children = <p>Content</p>) {
    const result = render(<RealFadeIn {...props}>{children}</RealFadeIn>);
    // The real component renders a <section> as its root element
    const section = result.container.firstElementChild as HTMLElement;
    return { ...result, section };
  }

  it('renders children inside a <section> element', () => {
    const { section } = renderSection({}, <p>Hello</p>);
    expect(section.tagName.toLowerCase()).toBe('section');
    expect(section).toHaveTextContent('Hello');
  });

  it('starts without the reveal-visible class', () => {
    const { section } = renderSection();
    expect(section).not.toHaveClass('reveal-visible');
  });

  it('adds reveal-visible class when element enters viewport', async () => {
    const { section } = renderSection();

    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: section,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as unknown as IntersectionObserver
      );
    });

    await waitFor(() => expect(section).toHaveClass('reveal-visible'));
  });

  it('calls unobserve after becoming visible (once=true default)', async () => {
    const { section } = renderSection();

    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: section,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as unknown as IntersectionObserver
      );
    });

    await waitFor(() => expect(mockUnobserve).toHaveBeenCalledWith(section));
  });

  it('applies reveal-left class when direction="left"', () => {
    const { section } = renderSection({ direction: 'left' });
    expect(section).toHaveClass('reveal-left');
  });

  it('applies reveal-right class when direction="right"', () => {
    const { section } = renderSection({ direction: 'right' });
    expect(section).toHaveClass('reveal-right');
  });

  it('does NOT apply directional class when direction="up" (default)', () => {
    const { section } = renderSection({ direction: 'up' });
    expect(section).not.toHaveClass('reveal-left');
    expect(section).not.toHaveClass('reveal-right');
  });

  it('removes reveal-visible again when element leaves viewport and once=false', async () => {
    const { section } = renderSection({ once: false });

    // Enter viewport
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: section,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as unknown as IntersectionObserver
      );
    });
    await waitFor(() => expect(section).toHaveClass('reveal-visible'));

    // Leave viewport
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: false,
            target: section,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as unknown as IntersectionObserver
      );
    });
    await waitFor(() => expect(section).not.toHaveClass('reveal-visible'));
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = renderSection();
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('forwards className prop to the section element', () => {
    const { section } = renderSection({ className: 'my-custom-class' });
    expect(section).toHaveClass('my-custom-class');
  });
});

// ─── 9. Logo ─────────────────────────────────────────────────────────────────
describe('Logo', () => {
  it('renders the logo image', () => {
    render(<Logo />);
    const img = screen.getByRole('img', { name: /logo/i });
    expect(img).toBeInTheDocument();
  });

  it('uses the correct logo src "/logo.svg"', () => {
    render(<Logo />);
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', '/logo.svg');
  });

  it('has width and height of 100', () => {
    render(<Logo />);
    const img = screen.getByAltText('Logo');
    expect(img).toHaveAttribute('width', '100');
    expect(img).toHaveAttribute('height', '100');
  });
});
