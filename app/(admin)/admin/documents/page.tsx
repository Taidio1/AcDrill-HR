'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Upload } from 'lucide-react';

import { AdminScreen } from '@/src/components/AdminScreen';
import { Card, ScreenState } from '@/src/components/ui';
import { services } from '@/src/services';
import { useToastStore } from '@/src/store/appStore';

export default function AdminDocumentsPage() {
  const client = useQueryClient();
  const showToast = useToastStore((state) => state.show);
  const query = useQuery({
    queryKey: ['documents-admin'],
    queryFn: () => services.documents.list(),
  });
  const mutation = useMutation({
    mutationFn: (file: File) =>
      services.documents.create({
        userId: 'all',
        name: file.name,
        category: 'PDF',
        date: new Date().toISOString().slice(0, 10),
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        isNew: true,
        uri: URL.createObjectURL(file),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['documents'] });
      await client.invalidateQueries({ queryKey: ['documents-admin'] });
      showToast('Dokument wgrany i przypisany');
    },
  });
  return (
    <AdminScreen title="Dokumenty">
      <div className="mx-auto max-w-2xl lg:max-w-none">
        <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-control bg-orange px-4 font-semibold text-white">
          <Upload size={18} />
          {mutation.isPending ? 'Wgrywanie…' : 'Wgraj dokument PDF'}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            disabled={mutation.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) mutation.mutate(file);
            }}
          />
        </label>
        <div className="mt-4 space-y-2.5">
          <ScreenState
            loading={query.isLoading}
            error={query.isError}
            empty={!query.data?.length}
          />
          {query.data?.map((document) => (
            <Card key={document.id}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FCEAE8] text-[#D9483B]">
                  <FileText size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{document.name}</p>
                  <p className="text-[12px] text-subtle">
                    {document.userId === 'all'
                      ? 'Cała ekipa'
                      : 'Mariusz Kowalczyk'}{' '}
                    · {document.date}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminScreen>
  );
}
