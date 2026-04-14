'use client';

//import { Button } from "../ui/button";
//import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuGroup, DropdownMenuItem  } from "../ui/dropdown-menu";
import { Quiz, mockQuizzes } from '../dashboardComp/quizmockup';
import GridItems from './griditems';

interface SearchQuery {
  query?: string;
}

export default function SearchPage({ query = '' }: SearchQuery) {
  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = mockQuizzes.filter((quiz) => {
    const lowerCaseQuery = query.toLowerCase();
    const matchesSearch =
      query === '' ||
      quiz.title.toLowerCase().includes(lowerCaseQuery) ||
      quiz.description.toLowerCase().includes(lowerCaseQuery) ||
      quiz.category.toLowerCase().includes(lowerCaseQuery);
    return matchesSearch;
  });

  const emptySearch = normalizedQuery !== '' && filteredItems.length === 0;

  return (
    <div className="mt-4 items-stretch rounded-2xl bg-white p-4 shadow">
      <div className="grid grid-cols-5 gap-4">
        {filteredItems.map((quiz: Quiz) => (
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
