import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import React from "react";

// Polyfill for TextEncoder/Decoder (needed for some MSW or Jose-based auth setups)
if (typeof globalThis.TextEncoder === "undefined") {
  (globalThis as any).TextEncoder = TextEncoder;
}

if (typeof globalThis.TextDecoder === "undefined") {
  (globalThis as any).TextDecoder = TextDecoder;
}

// Global Mock for Lucide Icons
// This prevents Jest from trying to parse SVG components during tests
jest.mock('lucide-react', () => ({
  CircleUserRound: (props: any) => React.createElement('div', { ...props, 'data-testid': 'user-icon' }),
  Plus: (props: any) => React.createElement('div', { ...props, 'data-testid': 'plus-icon' }),
}));