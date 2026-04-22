'use client';

export default function QuizInterface() {
  return (
    <div className="relative top-20 left-1/2 h-full w-full max-w-4xl -translate-x-1/2 px-4">
      <div className="rounded-2xl border border-white/30 bg-white/30 p-16 text-black shadow-xl backdrop-blur-md">
        <h2 className="text-center text-xl font-bold">Question 1</h2>
        <p className="mt-2 text-center">How do you center a div in Next.js?</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <button className="mt-4 rounded bg-red-500 px-4 py-6 text-white shadow-xl transition-colors hover:bg-red-600">
          Option A
        </button>
        <button className="mt-4 rounded bg-blue-500 px-4 py-6 text-white shadow-xl transition-colors hover:bg-blue-600">
          Option B
        </button>
        <button className="mt-4 rounded bg-green-500 px-4 py-6 text-white shadow-xl transition-colors hover:bg-green-600">
          Option C
        </button>
        <button className="mt-4 rounded border-black/50 bg-yellow-500 px-4 py-6 text-white shadow-xl transition-colors hover:bg-yellow-600">
          Option D
        </button>
      </div>
    </div>
  );
}
