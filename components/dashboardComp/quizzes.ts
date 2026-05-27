'use client';

type GetQuizzesParams = {
  query?: string;
  tags?: string[];
  //createdBy?: string;
  limit?: number;
  sortBy?: string;
};

export default async function getQuizzes(params: GetQuizzesParams = {}) {
  const url = new URL('/api/quiz', window.location.origin);
  const query = params.query?.trim();
  if (query && query.length >= 3) {
    url.searchParams.set('name', query);
  }
  if (params.limit) url.searchParams.set('limit', String(params.limit));
  //if (params.createdBy) url.searchParams.set('createdBy', params.createdBy);
  if (params.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params.tags && params.tags.length > 0) {
    for (const tag of params.tags) {
      url.searchParams.append('tags', tag);
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching quizzes: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
