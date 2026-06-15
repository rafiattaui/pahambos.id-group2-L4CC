import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ─── Mock next/navigation ────────────────────────────────────────────────────
const mockPush = jest.fn();
const mockPathname = '/profile';
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// ─── Mock react-easy-crop ────────────────────────────────────────────────────
jest.mock('react-easy-crop', () => ({
  __esModule: true,
  default: function MockCropper({
    onCropComplete,
  }: {
    onCropComplete: (a: unknown, b: unknown) => void;
  }) {
    // Immediately fire onCropComplete so AvatarCropModal has croppedAreaPixels
    React.useEffect(() => {
      onCropComplete({}, { x: 0, y: 0, width: 100, height: 100 });
    }, [onCropComplete]);

    return <div data-testid="cropper" />;
  },
}));

// ─── Mock recharts ───────────────────────────────────────────────────────────
jest.mock('recharts', () => ({
  LineChart: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

// ─── Mock sonner toast ───────────────────────────────────────────────────────
jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

// ─── Mock URL helpers ────────────────────────────────────────────────────────
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// ─── Mock global fetch ───────────────────────────────────────────────────────
global.fetch = jest.fn();

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

// ─── Mock canvas / getCroppedCircleBlob ─────────────────────────────────────
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  translate: jest.fn(),
  rotate: jest.fn(),
  drawImage: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  clip: jest.fn(),
})) as jest.Mock;

HTMLCanvasElement.prototype.toBlob = jest.fn((cb) =>
  cb(new Blob(['mock'], { type: 'image/jpeg' }))
);

// ─── Import component AFTER mocks ───────────────────────────────────────────
import AccountCard from '@/components/profileCard'; // adjust path as needed

// ─── Helpers ────────────────────────────────────────────────────────────────
type TestUser = {
  name: string;
  email: string;
  image: string | null | undefined;
};

const defaultUser: TestUser = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  image: null,
};

function renderCard(user: TestUser = defaultUser, params = '') {
  mockSearchParams = new URLSearchParams(params);
  return render(<AccountCard user={user} />);
}

// ─── Shared fetch mock factory ───────────────────────────────────────────────
function mockFetch(response: object, ok = true) {
  return (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    json: async () => response,
  } as Response);
}

// ════════════════════════════════════════════════════════════════════════════
// 1. RENDERING
// ════════════════════════════════════════════════════════════════════════════
describe('AccountCard – rendering', () => {
  it('renders the tab bar with all three tabs', () => {
    renderCard();
    // Scope to the tablist to avoid matching other buttons that contain "profile"
    // (e.g. aria-label="Change profile photo" on the camera button)
    const tabBar = screen.getByRole('tablist');
    expect(
      within(tabBar).getByRole('button', { name: /profile/i })
    ).toBeInTheDocument();
    expect(
      within(tabBar).getByRole('button', { name: /security/i })
    ).toBeInTheDocument();
    expect(
      within(tabBar).getByRole('button', { name: /performance/i })
    ).toBeInTheDocument();
  });

  it('defaults to the profile tab', () => {
    renderCard();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('shows initials when no avatar image is provided', () => {
    renderCard({
      name: 'Jane Doe',
      email: 'jane@example.com',
      image: null,
    } satisfies TestUser);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders avatar <img> when user.image is provided', async () => {
    renderCard({
      name: 'Jane Doe',
      email: 'jane@example.com',
      image: 'https://example.com/avatar.jpg',
    } satisfies TestUser);
    const img = await screen.findByRole('img', { name: /avatar/i });
    // next/image rewrites src to /_next/image?url=<encoded-url>&w=...&q=...
    // so assert the original URL is encoded within the rewritten src instead.
    expect(img.getAttribute('src')).toContain(
      encodeURIComponent('https://example.com/avatar.jpg')
    );
  });

  it('email field is read-only', () => {
    renderCard();
    expect(screen.getByLabelText('Email address')).toHaveAttribute('readonly');
  });

  it('pre-fills username and email from user prop', () => {
    renderCard();
    expect(screen.getByLabelText('Email address')).toHaveValue(
      'jane@example.com'
    );
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. TAB NAVIGATION
// ════════════════════════════════════════════════════════════════════════════
describe('AccountCard – tab navigation', () => {
  beforeEach(() => mockPush.mockClear());

  it('clicking Security tab pushes ?tab=security to router', async () => {
    renderCard();
    const tabBar = screen.getByRole('tablist');
    await userEvent.click(
      within(tabBar).getByRole('button', { name: /security/i })
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('tab=security')
    );
  });

  it('clicking Performance tab pushes ?tab=performance to router', async () => {
    renderCard();
    const tabBar = screen.getByRole('tablist');
    await userEvent.click(
      within(tabBar).getByRole('button', { name: /performance/i })
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('tab=performance')
    );
  });

  it('renders security tab content when ?tab=security is in URL', () => {
    renderCard(defaultUser, 'tab=security');
    expect(screen.getByLabelText('Current password')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
  });

  it('clicking Profile tab pushes ?tab=profile to router', async () => {
    renderCard(defaultUser, 'tab=security');
    const tabBar = screen.getByRole('tablist');
    await userEvent.click(
      within(tabBar).getByRole('button', { name: /profile/i })
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('tab=profile')
    );
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. USERNAME INLINE EDIT
// ════════════════════════════════════════════════════════════════════════════
describe('AccountCard – username editing', () => {
  it('edit button enables the username input', async () => {
    renderCard();
    const input = screen.getByLabelText('Username') as HTMLInputElement;
    expect(input).toHaveAttribute('readonly');
    await userEvent.click(
      screen.getByRole('button', { name: /edit username/i })
    );
    expect(input).not.toHaveAttribute('readonly');
  });

  it('cancel restores the original username', async () => {
    renderCard();
    await userEvent.click(
      screen.getByRole('button', { name: /edit username/i })
    );
    const input = screen.getByLabelText('Username');
    await userEvent.clear(input);
    await userEvent.type(input, 'New Name');
    // aria-label="Cancel" is unique here (crop modal is not open), but be explicit
    await userEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
  });

  it('save button calls PATCH /api/user and shows success message', async () => {
    mockFetch({ ok: true });
    renderCard();

    await userEvent.click(
      screen.getByRole('button', { name: /edit username/i })
    );
    const input = screen.getByLabelText('Username');
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated Name');
    await userEvent.click(
      screen.getByRole('button', { name: /save username/i })
    );

    await waitFor(() => {
      expect(global.fetch as jest.Mock).toHaveBeenCalledWith(
        '/api/user',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    await waitFor(() =>
      expect(screen.getByText(/username updated/i)).toBeInTheDocument()
    );
  });

  it('shows alert when profile save fails', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    mockFetch({ message: 'Server error' }, false);

    renderCard();
    await userEvent.click(
      screen.getByRole('button', { name: /edit username/i })
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save username/i })
    );

    await waitFor(() => expect(alertMock).toHaveBeenCalled());

    alertMock.mockRestore();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. PASSWORD (SECURITY TAB)
// ════════════════════════════════════════════════════════════════════════════
describe('AccountCard – security tab', () => {
  function renderSecurity() {
    return renderCard(defaultUser, 'tab=security');
  }

  it('shows error when passwords do not match', async () => {
    renderSecurity();
    await userEvent.type(
      screen.getByLabelText('Current password'),
      'currentPass1'
    );
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass123!');
    await userEvent.type(
      screen.getByLabelText('Confirm new password'),
      'WrongPass123!'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /update password/i })
    );
    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
  });

  it('shows error when new password is shorter than 8 chars', async () => {
    renderSecurity();
    await userEvent.type(
      screen.getByLabelText('Current password'),
      'currentPass1'
    );
    await userEvent.type(screen.getByLabelText('New password'), 'abc');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'abc');
    await userEvent.click(
      screen.getByRole('button', { name: /update password/i })
    );
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('calls PATCH /api/user/change-password on valid input', async () => {
    mockFetch({ success: true });
    renderSecurity();

    await userEvent.type(
      screen.getByLabelText('Current password'),
      'OldPass123!'
    );
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass123!');
    await userEvent.type(
      screen.getByLabelText('Confirm new password'),
      'NewPass123!'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /update password/i })
    );

    await waitFor(() =>
      expect(global.fetch as jest.Mock).toHaveBeenCalledWith(
        '/api/user/change-password',
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });

  it('shows server error message when password change API fails', async () => {
    mockFetch({ message: 'Incorrect current password.' }, false);
    renderSecurity();

    await userEvent.type(
      screen.getByLabelText('Current password'),
      'wrongPass1!'
    );
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass123!');
    await userEvent.type(
      screen.getByLabelText('Confirm new password'),
      'NewPass123!'
    );
    await userEvent.click(
      screen.getByRole('button', { name: /update password/i })
    );

    await waitFor(() =>
      expect(
        screen.getByText(/incorrect current password/i)
      ).toBeInTheDocument()
    );
  });

  it('toggles password visibility when eye button is clicked', async () => {
    renderSecurity();
    const input = screen.getByLabelText('Current password');
    expect(input).toHaveAttribute('type', 'password');

    // The toggle button is the one inside the Current password field container
    const toggles = screen.getAllByTitle('butt');
    await userEvent.click(toggles[0]);
    expect(input).toHaveAttribute('type', 'text');

    await userEvent.click(toggles[0]);
    expect(input).toHaveAttribute('type', 'password');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. STRENGTH BAR
// ════════════════════════════════════════════════════════════════════════════
describe('StrengthBar', () => {
  function renderSecurity() {
    return renderCard(defaultUser, 'tab=security');
  }

  it('is hidden when new password field is empty', () => {
    renderSecurity();
    expect(
      screen.queryByText(/weak|fair|good|strong/i)
    ).not.toBeInTheDocument();
  });

  it('shows "Weak" for a short simple password', async () => {
    renderSecurity();
    await userEvent.type(screen.getByLabelText('New password'), 'abcdefgh');
    expect(screen.getByText('Weak')).toBeInTheDocument();
  });

  it('shows "Strong" for a complex password', async () => {
    renderSecurity();
    await userEvent.type(screen.getByLabelText('New password'), 'Abcdef1!');
    expect(screen.getByText('Strong')).toBeInTheDocument();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 6. AVATAR UPLOAD FLOW
// ════════════════════════════════════════════════════════════════════════════
describe('AccountCard – avatar upload', () => {
  it('opens crop modal when a file is selected', async () => {
    renderCard();
    const fileInput = screen.getByLabelText('input');
    const file = new File(['(⌐□_□)'], 'avatar.png', { type: 'image/png' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() =>
      expect(screen.getByText(/adjust profile photo/i)).toBeInTheDocument()
    );
  });

  it('closes crop modal when Cancel is clicked', async () => {
    renderCard();
    const fileInput = screen.getByLabelText('input');
    const file = new File(['(⌐□_□)'], 'avatar.png', { type: 'image/png' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => screen.getByText(/adjust profile photo/i));

    // The modal has two Cancel triggers: the X icon (aria-label="Cancel") in the
    // header and the text "Cancel" button in the footer. Both share the accessible
    // name "Cancel", so use getAllByRole and click the last one (the footer button).
    const modal = screen.getByRole('dialog');
    const cancelButtons = within(modal).getAllByRole('button', {
      name: /^cancel$/i,
    });
    await userEvent.click(cancelButtons[cancelButtons.length - 1]);

    await waitFor(() =>
      expect(
        screen.queryByText(/adjust profile photo/i)
      ).not.toBeInTheDocument()
    );
  });

  it('calls PUT /api/user after applying crop', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    // Mock createImage used inside getCroppedCircleBlob
    jest.spyOn(global, 'Image').mockImplementation(() => {
      const handlers: Record<string, EventListener> = {};
      const img = {
        width: 200,
        height: 200,
        setAttribute: jest.fn(),
        addEventListener: jest.fn((event: string, cb: EventListener) => {
          handlers[event] = cb;
        }),
        set src(_url: string) {
          // Fire 'load' asynchronously, matching real browser behaviour
          setTimeout(() => handlers['load']?.({} as Event), 0);
        },
      };
      return img as unknown as HTMLImageElement;
    });

    renderCard();
    const fileInput = screen.getByLabelText('input');
    const file = new File(['(⌐□_□)'], 'avatar.png', { type: 'image/png' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => screen.getByText(/adjust profile photo/i));

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /apply/i }));
    });

    await waitFor(() =>
      expect(global.fetch as jest.Mock).toHaveBeenCalledWith(
        '/api/user',
        expect.objectContaining({ method: 'PUT' })
      )
    );

    jest.restoreAllMocks();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 7. PERFORMANCE TAB
// ════════════════════════════════════════════════════════════════════════════
describe('AccountCard – performance tab', () => {
  const mockRecord = {
    id: 'r1',
    quizId: 'q1',
    finalScore: 95,
    accuracyRate: '0.95',
    longestStreak: 7,
    timeTaken: 62000,
    completedAt: new Date().toISOString(),
  };

  it('shows quiz history table when data is returned', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockRecord],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      }),
    } as Response);

    renderCard(defaultUser, 'tab=performance');

    await waitFor(() => expect(screen.getByText('95')).toBeInTheDocument());
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('1m 2s')).toBeInTheDocument();
  });

  it('shows empty state when no quiz records exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [], pagination: null }),
    } as Response);

    renderCard(defaultUser, 'tab=performance');

    // The chart section also renders "No quiz history yet" when chartPoints is empty,
    // so there can be two matches. Assert on the table-section paragraph specifically
    // by waiting for the one that includes the call-to-action suffix.
    await waitFor(() =>
      expect(
        screen.getByText(/no quiz history yet — go take a quiz!/i)
      ).toBeInTheDocument()
    );
  });

  it('shows error message when fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderCard(defaultUser, 'tab=performance');

    await waitFor(() =>
      expect(
        screen.getByText(/failed to load performance records/i)
      ).toBeInTheDocument()
    );
  });

  it('renders pagination controls when totalPages > 1', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockRecord],
        pagination: {
          total: 20,
          page: 1,
          limit: 10,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      }),
    } as Response);

    renderCard(defaultUser, 'tab=performance');

    await waitFor(() => expect(screen.getByText(/next/i)).toBeInTheDocument());
    expect(screen.getByText(/← prev/i)).toBeDisabled();
    expect(screen.getByText(/next →/i)).not.toBeDisabled();
  });

  it('navigates to next page when Next is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockRecord],
        pagination: {
          total: 20,
          page: 1,
          limit: 10,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      }),
    } as Response);

    renderCard(defaultUser, 'tab=performance');

    await waitFor(() => screen.getByText(/next →/i));
    await userEvent.click(screen.getByText(/next →/i));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 8. UTILITY FUNCTIONS (tested indirectly via rendered output)
// ════════════════════════════════════════════════════════════════════════════
describe('toPercent helper (via performance table)', () => {
  it('converts decimal accuracyRate (0–1) to percent string', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            ...{
              id: 'r2',
              quizId: 'q2',
              finalScore: 80,
              accuracyRate: '0.75',
              longestStreak: 3,
              timeTaken: 30000,
              completedAt: new Date().toISOString(),
            },
          },
        ],
        pagination: null,
      }),
    } as Response);

    renderCard(defaultUser, 'tab=performance');
    await waitFor(() => expect(screen.getByText('75%')).toBeInTheDocument());
  });
});

describe('formatMs helper (via performance table)', () => {
  it('formats zero ms as 0s', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'r3',
            quizId: 'q3',
            finalScore: 50,
            accuracyRate: '0.5',
            longestStreak: 1,
            timeTaken: 0,
            completedAt: new Date().toISOString(),
          },
        ],
        pagination: null,
      }),
    } as Response);

    renderCard(defaultUser, 'tab=performance');
    await waitFor(() => expect(screen.getByText('0s')).toBeInTheDocument());
  });

  it('formats seconds-only duration', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: 'r4',
            quizId: 'q4',
            finalScore: 60,
            accuracyRate: '0.6',
            longestStreak: 2,
            timeTaken: 45000,
            completedAt: new Date().toISOString(),
          },
        ],
        pagination: null,
      }),
    } as Response);

    renderCard(defaultUser, 'tab=performance');
    await waitFor(() => expect(screen.getByText('45s')).toBeInTheDocument());
  });
});
