import { getApiDocs } from '@/lib/docs/swagger';
import ReactSwagger from '@/components/swagger/react-swagger';

export default async function IndexPage() {
  const spec = await getApiDocs();
  return (
    <section className="container py-10">
      <ReactSwagger spec={spec} />
    </section>
  );
}
