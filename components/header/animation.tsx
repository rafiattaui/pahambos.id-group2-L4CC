'use client';

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="h-full w-full">
      <div
        className="via-white-600 animate-gradient-slow fixed inset-0 z-[-1] bg-linear-to-br from-blue-600 to-orange-500 bg-size-[200%_200%]"
        aria-hidden="true"
      />
    </div>
  );
}
