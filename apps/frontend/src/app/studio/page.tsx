'use client';

import { useMemo, useState } from 'react';

type AgentDraft = {
  name: string;
  slug: string;
  description: string;
  instructions: string;
  skills: string[];
  tools: string[];
};

const initialDraft: AgentDraft = {
  name: 'Repository Delivery Agent',
  slug: 'repository-delivery-agent',
  description: 'Inspects repositories and prepares evidence-backed delivery plans.',
  instructions: 'Inspect before modifying. Never claim success without verification.',
  skills: ['repository-inspection', 'make-it-run', 'production-readiness'],
  tools: ['github-read', 'repository-files'],
};

export default function StudioPage() {
  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState(false);
  const preview = useMemo(() => JSON.stringify({ schema_version: '1.0', identity: {
    name: draft.name,
    description: draft.description,
    type: 'workflow',
  }, instructions: { system: draft.instructions.split('\n').filter(Boolean) }, skills: draft.skills, tools: { allowed: draft.tools } }, null, 2), [draft]);

  const update = (field: keyof AgentDraft, value: string) => {
    setSaved(false);
    setDraft((current) => ({ ...current, [field]: field === 'skills' || field === 'tools'
      ? value.split(',').map((item) => item.trim()).filter(Boolean)
      : value }));
  };

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
      <header style={{ marginBottom: 24 }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: 1.5 }}>AgentForgeHQ</p>
        <h1>AgentForge Studio</h1>
        <p>Create a versioned agent specification before testing or publishing.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 0.8fr)', gap: 24 }}>
        <section aria-label="Agent editor">
          <label>Name<input value={draft.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label>Slug<input value={draft.slug} onChange={(event) => update('slug', event.target.value)} /></label>
          <label>Description<textarea value={draft.description} onChange={(event) => update('description', event.target.value)} /></label>
          <label>System instructions<textarea rows={7} value={draft.instructions} onChange={(event) => update('instructions', event.target.value)} /></label>
          <label>Skills, comma separated<input value={draft.skills.join(', ')} onChange={(event) => update('skills', event.target.value)} /></label>
          <label>Tools, comma separated<input value={draft.tools.join(', ')} onChange={(event) => update('tools', event.target.value)} /></label>
          <button type="button" onClick={() => setSaved(true)}>Save draft</button>
          <p role="status">{saved ? 'Draft saved locally. API persistence is the next integration step.' : 'Unsaved changes'}</p>
        </section>

        <aside aria-label="Agent specification preview">
          <h2>Specification preview</h2>
          <pre style={{ overflow: 'auto', padding: 16, background: '#111', color: '#fff', borderRadius: 8 }}>{preview}</pre>
        </aside>
      </div>
    </main>
  );
}
