'use client';

type GetQuizzesParams = {
  //query?: string;
  category?: string;
  limit?: number;
  sortBy?: string;
};

export default async function getQuizzes(params: GetQuizzesParams = {}) {
  const url = new URL('/api/quiz', window.location.origin);
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params.category && params.category !== 'All') {
    url.searchParams.set('category', params.category);
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  console.log(url.toString());

  if (!response.ok) {
    throw new Error(`Error fetching quizzes: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('Fetched quizzes:', data);
  return data;
}
