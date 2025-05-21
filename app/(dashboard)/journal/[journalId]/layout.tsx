import { PreloadJournalData } from '@/components/journal/preload-journal-data';

export default function JournalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { journalId: string };
}) {
  return (
    <>
      <PreloadJournalData journalId={params.journalId} />
      {children}
    </>
  );
} 