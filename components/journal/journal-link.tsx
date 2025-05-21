"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { preloadJournalData } from '@/lib/hooks/useJournalData';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface JournalLinkProps {
  href: string;
  journalId: string;
  children: React.ReactNode;
  className?: string;
}

export function JournalLink({ href, journalId, children, className }: JournalLinkProps) {
  const router = useRouter();
  const [isPreloading, setIsPreloading] = useState(false);

  const handleMouseEnter = () => {
    setIsPreloading(true);
    // Précharge des données au survol
    preloadJournalData(journalId).finally(() => {
      setIsPreloading(false);
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPreloading(true);
    // Précharge des données avant la navigation
    preloadJournalData(journalId).then(() => {
      router.push(href);
    }).finally(() => {
      setIsPreloading(false);
    });
  };

  return (
    <>
      <Link
        href={href}
        className={className}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
      >
        {children}
      </Link>
      <LoadingIndicator isLoading={isPreloading} />
    </>
  );
} 