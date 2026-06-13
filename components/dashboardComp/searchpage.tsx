'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '../ui/pagination';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '../ui/input-group';
import { SlidersVertical, Search } from 'lucide-react';
import { Quiz } from '../dashboardComp/quizmockup';
import GridItems, { QuizSkeleton } from './griditems';
import getQuizzes from '@/components/dashboardComp/quizzes';

// ── Static categories (matches CategoryEnum in quizschemas.ts) ───────────────
// These never change at runtime — no need to fetch them from the API.
const ALL_CATEGORIES = [
  'All',
  'Mathematics',
  'Science',
  'History',
  'Language',
  'Geography',
  'Technology',
  'General',
] as const;

const PARAM_QUERY = 'q';
const PARAM_TAGS = 'tags';
const PARAM_SORT = 'sort';
const PARAM_PAGE = 'page';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchQuery {
  query?: string;
}

type PageItem = number | 'ellipsis';
type SortOption =
  | 'a-z'
  | 'z-a'
  | 'most-questions'
  | 'least-questions'
  | 'newest'
  | 'oldest';
type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

const ITEMS_PER_PAGE = 8;
const VALID_SORTS: SortOption[] = [
  'newest',
  'oldest',
  'a-z',
  'z-a',
  'most-questions',
  'least-questions',
];

// ── Pagination helper ─────────────────────────────────────────────────────────

function getPageItems(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): PageItem[] {
  const totalPagesToShow = siblingCount * 2 + 5;

  if (totalPages <= totalPagesToShow) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  const items: PageItem[] = [1];

  if (showLeftEllipsis) {
    items.push('ellipsis');
  } else {
    for (let p = 2; p < leftSibling; p++) items.push(p);
  }
  for (let p = leftSibling; p <= rightSibling; p++) {
    if (p !== 1 && p !== totalPages) items.push(p);
  }
  if (showRightEllipsis) {
    items.push('ellipsis');
  } else {
    for (let p = rightSibling + 1; p < totalPages; p++) items.push(p);
  }
  if (totalPages > 1) items.push(totalPages);

  return items;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SearchPage({ query: initialQuery = '' }: SearchQuery) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Read state from URL ───────────────────────────────────────────────────
  const query = searchParams.get(PARAM_QUERY) ?? initialQuery;
  const selectedCategories = searchParams.getAll(PARAM_TAGS); // multi-value
  const sortOption = (
    VALID_SORTS.includes(searchParams.get(PARAM_SORT) as SortOption)
      ? searchParams.get(PARAM_SORT)
      : 'newest'
  ) as SortOption;
  const currentPage = Math.max(1, Number(searchParams.get(PARAM_PAGE) ?? '1'));

  // ── Local UI state (not in URL) ───────────────────────────────────────────
  const [inputValue, setInputValue] = useState(query);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [status, setStatus] = useState<FetchStatus>('idle');

  // ── URL mutation helper ───────────────────────────────────────────────────
  // Merges new params onto the current URL without losing existing ones.
  const buildUrl = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }

      // Reset page to 1 whenever anything other than page itself changes
      if (!('page' in updates)) params.set(PARAM_PAGE, '1');

      return `${pathname}?${params.toString()}`;
    },
    [searchParams, pathname]
  );

  // ── Category toggle ───────────────────────────────────────────────────────
  function toggleCategory(category: string) {
    if (category === 'All') {
      router.push(buildUrl({ [PARAM_TAGS]: null }));
      return;
    }
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    router.push(buildUrl({ [PARAM_TAGS]: next }));
  }

  // ── Search submit ─────────────────────────────────────────────────────────
  function submitSearch() {
    const trimmed = inputValue.trim();
    router.push(
      buildUrl({ [PARAM_QUERY]: trimmed.length > 0 ? trimmed : null })
    );
  }

  // ── Sync inputValue when URL query changes (e.g. back/forward nav) ────────
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // ── Fetch quizzes when URL params change ──────────────────────────────────
  const trimmedQuery = query.trim();
  const queryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < 3;

  // Stable string key — prevents the effect re-running when the array
  // reference changes but the values are identical on every render
  const selectedCategoriesKey = selectedCategories.slice().sort().join(',');

  useEffect(() => {
    if (queryTooShort) return;

    let cancelled = false;

    async function load() {
      setStatus('loading');
      const res = await getQuizzes({
        query: trimmedQuery || undefined,
        tags: selectedCategories.length > 0 ? selectedCategories : undefined,
        sortBy:
          sortOption === 'a-z' ||
          sortOption === 'most-questions' ||
          sortOption === 'newest'
            ? 'asc'
            : 'desc',
        limit: 20,
      });
      if (cancelled) return;
      setQuizzes(res.data ?? res);
      setStatus('success');
    }

    load().catch(() => {
      if (!cancelled) setStatus('error');
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery, selectedCategoriesKey, sortOption, queryTooShort]);

  // ── Client-side sort ──────────────────────────────────────────────────────
  const sortedItems = useMemo(() => {
    const items = queryTooShort ? [] : [...quizzes];
    switch (sortOption) {
      case 'newest':
        return items.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
        );
      case 'oldest':
        return items.sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() -
            new Date(b.createdAt ?? 0).getTime()
        );
      case 'a-z':
        return items.sort((a, b) => a.title.localeCompare(b.title));
      case 'z-a':
        return items.sort((a, b) => b.title.localeCompare(a.title));
      case 'most-questions':
        return items.sort((a, b) => b.numQuestions - a.numQuestions);
      case 'least-questions':
        return items.sort((a, b) => a.numQuestions - b.numQuestions);
      default:
        return items;
    }
  }, [quizzes, sortOption, queryTooShort]);

  // ── Pagination ────────────────────────────────────────────────────────────
  const totalPages = Math.max(
    1,
    Math.ceil(sortedItems.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, safePage]);

  const pageItems = useMemo(
    () => getPageItems(safePage, totalPages, 1),
    [safePage, totalPages]
  );

  // ── Derived display states ────────────────────────────────────────────────
  const isLoading = status === 'loading';
  const errorMessage = queryTooShort
    ? 'Search query must be at least 3 characters long.'
    : status === 'error'
      ? 'Failed to fetch quizzes. Sorry about the inconvenience!'
      : null;
  const emptySearch =
    !isLoading &&
    status === 'success' &&
    sortedItems.length === 0 &&
    trimmedQuery !== '';

  return (
    <div className="mt-4 items-stretch rounded-2xl bg-linear-to-b from-white to-orange-50 p-4 shadow">
      {/* Search input (mobile) */}
      <InputGroup className="font-body mb-4 font-bold md:hidden">
        <InputGroupAddon align="inline-start">
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitSearch();
          }}
        />
      </InputGroup>

      {/* Category filter pills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {ALL_CATEGORIES.map((category) => {
            const active =
              category === 'All'
                ? selectedCategories.length === 0
                : selectedCategories.includes(category);
            return (
              <button
                key={category}
                className={`font-body rounded-xl px-4 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => toggleCategory(category)}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sort dropdown */}
      <div className="mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="font-body rounded-xl px-4 py-2 text-sm hover:border-0 hover:bg-gray-300"
            >
              {sortOption === 'newest' && 'Newest'}
              {sortOption === 'oldest' && 'Oldest'}
              {sortOption === 'a-z' && 'A to Z'}
              {sortOption === 'z-a' && 'Z to A'}
              {sortOption === 'most-questions' && 'Most Questions'}
              {sortOption === 'least-questions' && 'Least Questions'}
              <SlidersVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={sortOption}
              onValueChange={(value) =>
                router.push(buildUrl({ [PARAM_SORT]: value }))
              }
            >
              <DropdownMenuRadioItem value="newest" className="font-body">
                Newest
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="oldest" className="font-body">
                Oldest
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="a-z" className="font-body">
                A to Z
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="z-a" className="font-body">
                Z to A
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="most-questions"
                className="font-body"
              >
                Most Questions
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="least-questions"
                className="font-body"
              >
                Least Questions
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results heading */}
      {trimmedQuery !== '' && !emptySearch && (
        <div className="col-span-5 text-left">
          <h2 className="font-body mb-4 text-2xl font-bold">
            Results for &quot;{query}&quot;
          </h2>
        </div>
      )}

      {/* Quiz grid */}
      <div className="mx-auto grid max-w-md grid-cols-1 gap-3 p-6 sm:max-w-none sm:grid-cols-3 md:grid-cols-4">
        {isLoading
          ? Array.from({ length: ITEMS_PER_PAGE }, (_, i) => (
              <QuizSkeleton key={i} />
            ))
          : paginatedItems.map((quiz: Quiz) => (
              <GridItems key={quiz.id} quiz={quiz} />
            ))}

        {emptySearch && (
          <div className="col-span-5 py-10 text-center">
            <h2 className="font-body mb-4 text-2xl font-bold">
              No results found for &quot;{query}&quot;
            </h2>
          </div>
        )}

        {errorMessage && (
          <div className="font-body col-span-5 mb-4 justify-center rounded-xl p-3 text-center text-2xl font-bold text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex w-full">
        <Pagination className="mt-6 justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(
                    buildUrl({
                      [PARAM_PAGE]: String(Math.max(1, safePage - 1)),
                    })
                  );
                }}
                className={`font-body ${safePage === 1 ? 'pointer-events-none opacity-50' : ''}`}
              />
            </PaginationItem>
            {pageItems.map((item, index) => (
              <PaginationItem
                key={typeof item === 'number' ? item : `ellipsis-${index}`}
              >
                {item === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href="#"
                    isActive={safePage === item}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(buildUrl({ [PARAM_PAGE]: String(item) }));
                    }}
                    className={`font-body ${safePage === item ? 'rounded-full bg-blue-500 text-white' : 'rounded-full hover:bg-gray-300'}`}
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  router.push(
                    buildUrl({
                      [PARAM_PAGE]: String(Math.min(totalPages, safePage + 1)),
                    })
                  );
                }}
                className={`font-body ${safePage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
