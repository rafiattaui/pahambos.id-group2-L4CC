'use client';

import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../ui/dropdown-menu';
import { SlidersVertical } from 'lucide-react';
import { Quiz, mockQuizzes } from '../dashboardComp/quizmockup';
import GridItems from './griditems';

interface SearchQuery {
  query?: string;
}

type SortOption = 'a-z' | 'z-a' | 'most-questions' | 'least-questions';

export default function SearchPage({ query = '' }: SearchQuery) {
  const normalizedQuery = query.trim().toLowerCase();
  const categories = [
    'All',
    ...new Set(mockQuizzes.map((quiz) => quiz.category)),
  ];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<SortOption>('a-z');

  const filteredItems = mockQuizzes.filter((quiz) => {
    const lowerCaseQuery = query.toLowerCase();
    const matchesCategory =
      selectedCategory === 'All' || quiz.category === selectedCategory;
    const matchesSearch =
      query === '' ||
      quiz.title.toLowerCase().includes(lowerCaseQuery) ||
      quiz.description.toLowerCase().includes(lowerCaseQuery) ||
      quiz.category.toLowerCase().includes(lowerCaseQuery);
    return matchesSearch && matchesCategory;
  });

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];

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
  }, [filteredItems, sortOption]);

  const emptySearch = normalizedQuery !== '' && filteredItems.length === 0;

  return (
    <div className="mt-4 items-stretch rounded-2xl bg-white p-4 shadow">
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`font-body rounded-xl px-4 py-2 text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex flex-wrap">
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
              onValueChange={(value) => setSortOption(value as SortOption)}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {sortedItems.map((quiz: Quiz) => (
          <GridItems key={quiz.id} quiz={quiz} />
        ))}

        {emptySearch && (
          <div className="col-span-5 py-10 text-center">
            <h2 className="font-body-bold mb-4 text-2xl">
              No results found for &quot;{query}&quot;
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
