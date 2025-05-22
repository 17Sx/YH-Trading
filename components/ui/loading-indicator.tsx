"use client";

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  isLoading: boolean;
  className?: string;
}

export function LoadingIndicator({ isLoading, className = '' }: LoadingIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isLoading) {
      timeout = setTimeout(() => setShow(true), 300);
    } else {
      setShow(false);
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-purple-500/30">
        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
        <span className="text-sm">Chargement...</span>
      </div>
    </div>
  );
} 