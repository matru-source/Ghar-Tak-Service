'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminError Boundary Caught]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl">
        🛡️
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Admin Session Required</h2>
        <p className="text-slate-500 text-xs max-w-md">
          Your administrative session is unauthenticated or has expired. Please authenticate via the Super Admin Terminal.
        </p>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Link
          href="/admin/login"
          className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-md"
        >
          Go to Admin Login →
        </Link>
        <button
          onClick={() => reset()}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
