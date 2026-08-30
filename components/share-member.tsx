'use client';

import { useState } from 'react';

export default function ShareMember({ nickname }: { nickname: string }) {
  const [label, setLabel] = useState('Share player');

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${nickname} — SQUAD.25`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setLabel('Link copied');
      window.setTimeout(() => setLabel('Share player'), 1800);
    } catch {
      // User cancelled native share; no error state is needed.
    }
  }

  return (
    <button type="button" onClick={share} className="ui-button ui-button-secondary" aria-label={`Share ${nickname} player profile`}>
      {label} ↗
    </button>
  );
}
