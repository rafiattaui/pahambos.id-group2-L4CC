import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import React from 'react';

interface GlobalWithText {
  TextEncoder: typeof TextEncoder;
  TextDecoder: typeof TextDecoder;
}

if (typeof globalThis.TextEncoder === 'undefined') {
  (globalThis as unknown as GlobalWithText).TextEncoder = TextEncoder;
}

// Global Mock for Lucide Icons
// This prevents Jest from trying to parse SVG components during tests
jest.mock('lucide-react', () => ({
  CircleUserRound: (props: Record<string, unknown>) =>
    React.createElement('div', { ...props, 'data-testid': 'user-icon' }),
  Plus: (props: Record<string, unknown>) =>
    React.createElement('div', { ...props, 'data-testid': 'plus-icon' }),
  ArrowRight: (props: Record<string, unknown>) =>
    React.createElement('div', { ...props, 'data-testid': 'arrow-right-icon' }),
}));
