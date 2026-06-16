'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { Button, Card, Heading, Screen, ScreenState } from '@/src/components/ui';
import { services } from '@/src/services';

export default function DocumentDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const client = useQueryClient();
  const markedRead = useRef(false);
  const query = useQuery({
    queryKey: ['document', id],
    queryFn: () => services.documents.get(id),
  });
  const markRead = useMutation({
    mutationFn: () => services.documents.markRead(id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  useEffect(() => {
    if (query.data?.isNew && !markedRead.current) {
      markedRead.current = true;
      markRead.mutate();
    }
  }, [query.data?.isNew, markRead]);

  const document = query.data;
  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading
          title="Dokument"
          action={
            <button
              aria-label="Wróć"
              className="flex h-11 w-11 items-center justify-center rounded-control bg-white text-muted"
              onClick={() => router.back()}
            >
              <ArrowLeft size={20} />
            </button>
          }
        />
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!document}
        />
        {document ? (
          <div className="space-y-3">
            <Card className="text-center">
              <FileText size={52} className="mx-auto text-danger" />
              <h2 className="mt-4 font-display text-xl font-bold">
                {document.name}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {document.category} · {document.size}
              </p>
              <p className="text-sm text-subtle">{document.date}</p>
            </Card>
            <Button
              title="Pobierz dokument"
              icon={<Download size={18} />}
              onPress={() => {
                if (document.uri) window.open(document.uri, '_blank');
              }}
              disabled={!document.uri}
            />
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
