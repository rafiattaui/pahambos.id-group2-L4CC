"use client";

import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="w-full h-full">
      <div 
        className="fixed inset-0 z-[-1] bg-gradient-to-br from-blue-600 via-white-600 to-orange-500 bg-[length:200%_200%] animate-gradient-slow"
        aria-hidden="true"
      />
    </div>
  );
}