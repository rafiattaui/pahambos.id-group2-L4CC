'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { Quiz, mockQuizzes } from '../dashboardComp/quizmockup';
import GridItems, { QuizSkeleton } from './griditems';
import getQuizzes from '@/components/dashboardComp/quizzes';

interface SearchQuery {
  query?: string;
}

type PageItem = number | 'ellipsis';

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

type SortOption = 'a-z' | 'z-a' | 'most-questions' | 'least-questions';

export default function SearchPage({ query: initialQuery = '' }: SearchQuery) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? initialQuery);
  const normalizedQuery = query.trim().toLowerCase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(query);
  const categories = [
    'All',
    ...new Set(mockQuizzes.map((quiz) => quiz.category)),
  ];
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('a-z');

  const trimmedQuery = query.trim();
  const queryTooShort = trimmedQuery.length > 0 && trimmedQuery.length < 3;

  const displayQuizzes = queryTooShort ? [] : quizzes;
  const displayLoading = queryTooShort ? false : isLoading;
  const errorMessage = queryTooShort
    ? 'Search query must be at least 3 characters long.'
    : error;

  const toggleCategory = (category: string) => {
    if (category === 'All') {
      setSelectedCategory([]);
      return;
    }

    setSelectedCategory((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
    setCurrentPage(1);
  };
  useEffect(() => {
    getQuizzes({
      query,
      tags: selectedCategory.length > 0 ? selectedCategory : undefined,
      sortBy: sortOption === 'a-z' ? 'asc' : 'desc',
      limit: 10,
    })
      .then((res) => setQuizzes(res.data ?? res))
      .catch(() => {
        setQuizzes([]);
        setError('Failed to fetch quizzes.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [query, selectedCategory, sortOption, queryTooShort]);

  const sortedItems = useMemo(() => {
    const items = [...displayQuizzes];

    switch (sortOption) {
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
  }, [displayQuizzes, sortOption]);

  const emptySearch = normalizedQuery !== '' && sortedItems.length === 0;

  const ITEMS_PER_PAGE = 12;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedItems.length / ITEMS_PER_PAGE)
  );

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage, ITEMS_PER_PAGE]);

  const pageItems = useMemo(
    () => getPageItems(currentPage, totalPages, 1),
    [currentPage, totalPages]
  );

  return (
    <div className="mt-4 items-stretch rounded-2xl bg-white p-4 shadow">
      <InputGroup className="mb-4 md:hidden">
        <InputGroupAddon align={'inline-start'}>
          <Search className="h-4 w-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search... "
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setQuery(inputValue);
              setCurrentPage(1);
            }
          }}
        />
      </InputGroup>
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isActive =
              category === 'All'
                ? selectedCategory.length === 0
                : selectedCategory.includes(category);
            return (
              <button
                key={category}
                className={`font-body rounded-xl px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => {
                  toggleCategory(category);
                }}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="flex flex-wrap">
            <Button
              variant="outline"
              className="font-body rounded-xl px-4 py-2 text-sm hover:border-0 hover:bg-gray-300"
            >
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
              onValueChange={(value) => {
                setSortOption(value as SortOption);
                setCurrentPage(1);
              }}
            >
              <DropdownMenuRadioItem value="a-z">A to Z</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="z-a">Z to A</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="most-questions">
                Most Questions
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="least-questions">
                Least Questions
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {query.trim() !== '' && !emptySearch && (
        <div className="col-span-5 text-left">
          <h2 className="font-body-bold mb-4 text-2xl">
            Results found for &quot;{query}&quot;
          </h2>
        </div>
      )}
      <div className="mx-auto grid max-w-md grid-cols-2 gap-3 sm:max-w-none sm:grid-cols-3 md:grid-cols-4">
        {displayLoading
          ? Array.from({ length: ITEMS_PER_PAGE }, (_, i) => (
              <QuizSkeleton key={i} />
            ))
          : paginatedItems.map((quiz: Quiz) => (
              <GridItems key={quiz.id} quiz={quiz} />
            ))}

        {!error && !isLoading && emptySearch && (
          <div className="col-span-5 py-10 text-center">
            <h2 className="font-body-bold mb-4 text-2xl">
              No results found for &quot;{query}&quot;
            </h2>
          </div>
        )}

        {errorMessage && (
          <div className="col-span-5 mb-4 justify-center rounded-xl p-3 text-center text-2xl text-red-700">
            {errorMessage}
          </div>
        )}
      </div>
      <div className="flex w-full">
        <Pagination className="mt-6 justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                className={`font-body ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
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
                    isActive={currentPage === item}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(item);
                    }}
                    className={`font-body ${currentPage === item ? 'bg-blue-500 text-white' : 'hover:bg-gray-300'}`}
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
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                className={`font-body ${
                  currentPage === totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
