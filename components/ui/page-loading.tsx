"use client";

import { Loading } from "./loading";

export function PageLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loading size="lg" variant="primary" />
        <p className="text-gray-300 text-lg font-medium">Chargement...</p>
      </div>
    </div>
  );
} 