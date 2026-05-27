import SearchPage from '@/components/dashboardComp/searchpage';

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Search({ searchParams }: Props) {
  const params = await searchParams;
  const q = params.q ?? '';

  return (
    <div>
      <SearchPage key={q} query={q} />
    </div>
  );
}
