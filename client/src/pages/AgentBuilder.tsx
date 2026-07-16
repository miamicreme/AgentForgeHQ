import { useEffect, useState } from 'react';

export default function AgentBuilder() {
  const [name, setName] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [deepResearch, setDeepResearch] = useState(false);
  const [spec, setSpec] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/templates`)
      .then((res) => res.json())
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  const createAgent = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/generate-ai-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, template: selectedTemplate, deepResearch }),
    });
    const data = await res.json();
    setSpec(data);
  };

  const saveAgent = async () => {
    if (!spec) return;
    await fetch(`${import.meta.env.VITE_API_URL}/save-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spec),
    });
    alert('Agent saved');
  };

  return (
    <div>
      <h2>Agent Builder</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" />
      <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
        <option value="">Select template</option>
        {templates.map((t) => (
          <option key={t.name} value={t.name}>{t.name}</option>
        ))}
      </select>
      <label>
        <input
          type="checkbox"
          checked={deepResearch}
          onChange={(e) => setDeepResearch(e.target.checked)}
        />
        Deep Research Mode
      </label>
      <button onClick={createAgent}>Generate</button>
      {spec && (
        <div>
          <h3>Generated Spec</h3>
          <pre>{JSON.stringify(spec, null, 2)}</pre>
          <button onClick={saveAgent}>Save Agent</button>
        </div>
      )}
    </div>
  );
}
