'use client';

import { FormEvent, useMemo, useState } from 'react';
import { ExecutionTimeline, type TimelineEvent } from '../../components/execution-timeline';

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

export default function PlaygroundPage() {
  const [agentVersionId, setAgentVersionId] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'failed'>('idle');
  const canRun = useMemo(() => agentVersionId.trim().length > 0 && input.trim().length > 0 && status !== 'running', [agentVersionId, input, status]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!canRun) return;
    const prompt = input.trim();
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: prompt }]);
    setInput('');
    setStatus('running');
    try {
      const response = await fetch('/api/executions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ agentVersionId: agentVersionId.trim(), input: prompt }),
      });
      if (!response.ok) throw new Error(`Execution failed with ${response.status}`);
      const result = await response.json() as { output: string; events: TimelineEvent[] };
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: result.output }]);
      setEvents(result.events);
      setStatus('idle');
    } catch (error) {
      setStatus('failed');
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: error instanceof Error ? error.message : 'Execution failed' }]);
    }
  }

  return (
    <main>
      <h1>AgentForge Playground</h1>
      <p>Test an immutable agent version and inspect every execution step.</p>
      <form onSubmit={submit}>
        <label>Agent version ID<input value={agentVersionId} onChange={(event) => setAgentVersionId(event.target.value)} required /></label>
        <label>Test input<textarea value={input} onChange={(event) => setInput(event.target.value)} required /></label>
        <button disabled={!canRun}>{status === 'running' ? 'Running…' : 'Run agent'}</button>
      </form>
      <p role="status" aria-live="polite">{status === 'failed' ? 'The last execution failed.' : status === 'running' ? 'Execution running.' : 'Ready.'}</p>
      <section aria-labelledby="conversation-heading">
        <h2 id="conversation-heading">Conversation</h2>
        {messages.length === 0 ? <p>No messages yet.</p> : messages.map((message) => <article key={message.id}><strong>{message.role}</strong><p>{message.content}</p></article>)}
      </section>
      <ExecutionTimeline events={events} />
    </main>
  );
}
