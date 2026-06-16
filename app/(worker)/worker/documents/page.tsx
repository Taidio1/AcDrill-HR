'use client';

import { useQuery } from '@tanstack/react-query';
import { Download, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Card, Heading, Screen, ScreenState } from '@/src/components/ui';
import { services } from '@/src/services';
import { useAuthStore } from '@/src/store/appStore';

export default function DocumentsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const query = useQuery({
    queryKey: ['documents', user?.id],
    queryFn: () => services.documents.list(user?.id),
    enabled: Boolean(user),
  });
  return (
    <Screen>
      <div className="mx-auto max-w-xl">
        <Heading title="Dokumenty" />
        <ScreenState
          loading={query.isLoading}
          error={query.isError}
          empty={!query.data?.length}
        />
        <div className="space-y-2.5">
          {query.data?.map((document) => (
            <Card
              key={document.id}
              onClick={() => router.push(`/worker/documents/${document.id}`)}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[11px] bg-[#FCEAE8] text-[#D9483B]">
                  <FileText size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold">
                      {document.name}
                    </span>
                    {document.isNew ? (
                      <span className="rounded-round bg-orange px-2 py-0.5 text-[9px] font-semibold text-white">
                        NOWY
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-subtle">
                    {document.category} · {document.size} · {document.date}
                  </p>
                </div>
                <Download size={20} className="text-subtle" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Screen>
  );
}
