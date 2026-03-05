import { render, screen } from '@testing-library/react';
import HeroSect from '@/components/Hero/herosect';
import '@testing-library/jest-dom';

describe('HeroSect Component', () => {
  it('renders the heading text correctly', () => {
    render(<HeroSect />);
    const heading = screen.getByRole('heading', { name: /PahamBos\.id/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the body text correctly', () => {
    render(<HeroSect />);
    const bodyText = screen.getByText(/The Learning platform for everyone/i);
    expect(bodyText).toBeInTheDocument();
  });

  it('renders the Get Started button with correct link', () => {
    render(<HeroSect />);
    const getStartedButton = screen.getByRole('button', {
      name: /Get Started/i,
    });
    expect(getStartedButton).toBeInTheDocument();

    // Check if the link wraps the button correctly
    const link = getStartedButton.closest('a');
    expect(link).toHaveAttribute('href', '/register');
  });

  it('renders the Learn More button', () => {
    render(<HeroSect />);
    const learnMoreButton = screen.getByRole('button', { name: /Learn More/i });
    expect(learnMoreButton).toBeInTheDocument();
  });

  it('renders both buttons in the hero section', () => {
    render(<HeroSect />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });
});
