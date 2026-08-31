'use client';

import { useState } from 'react';
import AdminStudio from '@/components/admin-studio';

const DRAFT_KEY = 'squad25-content-v1';
const PUBLISHED_KEY = 'squad25-published-v1';
const EMPTY_PUBLISHED_MARKER = '__no_published_snapshot__';

function protectUnpublishedDraft() {
  try {
    const draft = localStorage.getItem(DRAFT_KEY);
    const published = localStorage.getItem(PUBLISHED_KEY);
    if (draft && !published) localStorage.setItem(PUBLISHED_KEY, EMPTY_PUBLISHED_MARKER);
  } catch {
    // AdminStudio already has its own browser-storage fallback.
  }
}

export default function AdminStudioSafe() {
  useState(() => {
    protectUnpublishedDraft();
    return true;
  });

  return <AdminStudio />;
}
