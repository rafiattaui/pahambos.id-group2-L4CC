'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Quiz } from '../dashboardComp/quizmockup';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Spinner } from '../ui/spinner';
import Image from 'next/image';

type CategoryTextColor = {
  category: string;
  textColor: string;
  bgColor: string;
};

async function getCurrentUserId() {
  const response = await fetch('/api/user', { credentials: 'include' });
  if (!response.ok) return null;
  const data = await response.json();
  return (data.id as string) ?? null;
}
async function getCreatorQuizzes(userId: string): Promise<Quiz[]> {
  // This function should ideally fetch quizzes created by the logged-in user.
  const response = await fetch(`/api/quiz/user/${userId}`, {
    credentials: 'include',
  });

  const data = await response.json();

  if (!data.success) return [];

  return data.quizzes as Quiz[];
}

function CreatePageItem({
  quiz,
  onDeleteClick,
}: {
  quiz: Quiz;
  onDeleteClick: (quiz: Quiz) => void;
}) {
  const router = useRouter();

  const categoriesText: CategoryTextColor[] = [
    {
      category: 'Mathematics',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-100',
    },
    {
      category: 'Science',
      textColor: 'text-green-500',
      bgColor: 'bg-green-100',
    },
    {
      category: 'History',
      textColor: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
    },
    {
      category: 'Geography',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-100',
    },
    {
      category: 'Language',
      textColor: 'text-pink-500',
      bgColor: 'bg-pink-100',
    },
    {
      category: 'Technology',
      textColor: 'text-cyan-500',
      bgColor: 'bg-cyan-100',
    },
    { category: 'General', textColor: 'text-gray-500', bgColor: 'bg-gray-100' },
  ];

  return (
    <div className="w-full">
      <Card className="relative flex aspect-6/7 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
        <div className="absolute top-2 right-2 z-10 flex flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/create-quiz/${quiz.id}/edit`)}
            aria-label="Edit Quiz"
            className="hover:bg-white hover:text-blue-500"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => onDeleteClick(quiz)}
            aria-label="Delete Quiz"
            className="hover:bg-white hover:text-orange-500"
          >
            <Trash2 className="h-4 w-4" />{' '}
          </Button>
        </div>
        <CardHeader className="relative p-0">
          <Image
            src={quiz.imageUrl || '/placeholderquiz.png'}
            alt={quiz.title}
            width={300}
            height={200}
            className="h-28 w-full object-cover sm:h-40"
          />
          <div className="absolute inset-x-1 bottom-3 flex items-center justify-between sm:inset-x-4">
            <div className="rounded-md bg-white p-1 sm:p-1.5">
              <span
                className={`font-body text-xs sm:text-sm ${categoriesText.find((c) => c.category === quiz.category)?.textColor || 'text-gray-500'} ${categoriesText.find((c) => c.category === quiz.category)?.bgColor || 'bg-gray-100'} rounded-md p-1 font-bold`}
              >
                {quiz.category}
              </span>
            </div>
            <div className="rounded-md bg-white p-1 sm:p-1.5">
              <span className="font-body text-xs font-bold text-slate-700 sm:text-sm">
                {quiz.numQuestions} Qs
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-3">
          <CardTitle className="font-body mt-1 line-clamp-4 text-sm font-bold sm:text-base">
            {quiz.title}
          </CardTitle>
          <CardDescription className="font-body mt-1 line-clamp-3 text-sm text-gray-500">
            {quiz.description}
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}

function CreatePageItemSkeleton() {
  return (
    <div className="w-full">
      <Card className="relative flex aspect-6/9 flex-col overflow-hidden rounded-2xl border-2 border-gray-300 shadow-xl sm:aspect-3/4">
        <div className="absolute top-2 right-2 z-10 flex flex-row gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
        <CardHeader className="relative p-0">
          <Skeleton className="h-28 w-full rounded-none sm:h-40" />
          <div className="absolute inset-x-1 bottom-3 flex items-center justify-between sm:inset-x-4">
            <Skeleton className="h-6 w-20 rounded-md bg-white/70" />
            <Skeleton className="h-6 w-12 rounded-md bg-white/70" />
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-3">
          <Skeleton className="mb-2 h-4 w-3/4" />
          <div className="hidden md:block">
            <Skeleton className="mb-2 h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteConfirmDialog({
  quiz,
  onConfirm,
  onCancel,
  deleting,
}: {
  quiz: Quiz;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        {/* Icon + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Trash2 className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h3 className="font-body text-base font-bold text-slate-800">
              Delete quiz?
            </h3>
            <p className="font-body mt-1 text-sm text-gray-400">
              <span className="font-body font-semibold text-gray-700">
                &ldquo;{quiz.title}&rdquo;
              </span>{' '}
              will be permanently deleted. This cannot be undone.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="font-body flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="font-body flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-bold font-semibold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-[0.98] disabled:opacity-60"
          >
            {deleting ? (
              <>
                <Spinner className="h-4 w-4" /> Deleting…
              </>
            ) : (
              'Yes, delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

type FetchStatus = 'idle' | 'loading' | 'error' | 'success';

export default function CreatePage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [pendingDelete, setPendingDelete] = useState<Quiz | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/quiz/${pendingDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to delete quiz: ${res.statusText}`);
      setQuizzes((prev) => prev.filter((q) => q.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus('loading');

      const userId = await getCurrentUserId();
      if (cancelled) return;

      if (!userId) {
        setStatus('error');
        return;
      }

      const data = await getCreatorQuizzes(userId);
      if (cancelled) return;

      setQuizzes(data);
      setStatus('success');
    }

    load().catch(() => {
      if (!cancelled) setStatus('error');
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const SKELETON_COUNT = 4; // Number of skeleton items to show while loading

  return (
    <>
      <div className="mt-6 rounded-2xl bg-linear-to-b from-white to-orange-50 p-4">
        <div className="m-4 flex flex-col items-center sm:flex-row sm:justify-between">
          <h1 className="font-body text-5xl font-bold">
            <span className="text-black/90 text-shadow-lg text-shadow-slate-300">
              Your Quizzes
            </span>
          </h1>
          <Button
            className="font-body mt-4 bg-blue-600 font-bold transition-transform hover:bg-blue-700 active:translate-y-0.5 sm:mt-0"
            onClick={() => router.push('/create-quiz')}
          >
            Create Quiz <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-2x mt-4 grid h-full w-full grid-cols-1 sm:grid-cols-3 md:grid-cols-4">
          {status === 'loading' &&
            Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <div key={i} className="m-4">
                <CreatePageItemSkeleton />
              </div>
            ))}

          {status === 'error' && (
            <div className="col-span-full py-16 text-center text-sm text-red-500">
              Something went wrong loading your quizzes. Please refresh.
            </div>
          )}

          {status === 'success' && quizzes.length === 0 && (
            <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center">
              <p className="font-body font-medium text-slate-700">
                No quizzes yet — your creations will appear here.
              </p>
              <p className="font-body text-sm text-slate-400">
                Hit the <span className="font-body text-blue-500">+</span> above
                to make your first one.
              </p>
            </div>
          )}
          {status === 'success' &&
            quizzes.map((quiz) => (
              <div key={quiz.id} className="m-4">
                <CreatePageItem quiz={quiz} onDeleteClick={setPendingDelete} />
              </div>
            ))}
        </div>
      </div>
      {pendingDelete && (
        <DeleteConfirmDialog
          quiz={pendingDelete}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setPendingDelete(null)}
        />
      )}
    </>
  );
}
