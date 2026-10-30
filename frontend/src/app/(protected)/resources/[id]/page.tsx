import { notFound } from 'next/navigation';
import { INITIAL_RESOURCES } from '@/lib/mockData';
import { ResourceDetailClient } from './ResourceDetailClient';

export function generateStaticParams() {
  return INITIAL_RESOURCES.map((r) => ({
    id: r.id,
  }));
}

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = INITIAL_RESOURCES.find((r) => r.id === id);

  if (!resource) {
    notFound();
  }

  return <ResourceDetailClient resource={resource} />;
}
