import { useState } from 'react';

export default function AgentBuilder() {
  const [name, setName] = useState('');

  const createAgent = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setName('');
    alert('Agent created');
  };

  return (
    <div>
      <h2>Agent Builder</h2>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" />
      <button onClick={createAgent}>Create</button>
    </div>
  );
}
