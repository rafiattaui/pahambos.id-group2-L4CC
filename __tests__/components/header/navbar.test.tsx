import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '@/components/header/navbar';
import '@testing-library/jest-dom';

// This MUST match the import string inside your Navbar component file
jest.mock('@/components/header/logo', () => {
  return function MockLogo() {
    return <div data-testid="logo">Logo Mock</div>;
  };
});

describe('Navbar Component', () => {
  test('renders the logo and all navigation buttons', () => {
    render(<Navbar />);
    expect(screen.getByTestId('logo')).toBeInTheDocument();

    expect(screen.getByText(/discover/i)).toBeInTheDocument();
    expect(screen.getByText(/learn/i)).toBeInTheDocument();
    expect(screen.getByText(/create/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
  });

  test('button clicks do not crash the component', () => {
    render(<Navbar />);
    const discoverButton = screen.getByText(/discover/i);

    // Verifying that the handleClick function executes without throwing
    expect(() => fireEvent.click(discoverButton)).not.toThrow();
  });

  test('has correct responsive classes for desktop/mobile toggle', () => {
    const { container } = render(<Navbar />);

    // We escape the colon in 'md:flex' so querySelector doesn't get confused
    const navLinksWrapper = container.querySelector('.hidden.md\\:flex');
    expect(navLinksWrapper).toBeInTheDocument();
  });
});
