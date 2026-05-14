'use client';

import React from 'react';

export default function ClassroomDetails() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-violet-900/10 ring-black/5">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <h1>Hello from the classroom details page!</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
