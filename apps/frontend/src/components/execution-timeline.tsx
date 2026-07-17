'use client';

export interface TimelineEvent {
  sequence: number;
  type: string;
  at: string;
  data: Record<string, unknown>;
}

export function ExecutionTimeline({ events }: { events: readonly TimelineEvent[] }) {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  if (ordered.length === 0) {
    return <p role="status">No execution events yet.</p>;
  }

  return (
    <section aria-labelledby="execution-timeline-heading">
      <h2 id="execution-timeline-heading">Execution timeline</h2>
      <ol>
        {ordered.map((event) => (
          <li key={`${event.sequence}-${event.type}`}>
            <article>
              <header>
                <strong>{event.sequence}. {event.type.replaceAll('_', ' ')}</strong>
                <time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time>
              </header>
              <pre aria-label={`${event.type} details`}>{JSON.stringify(event.data, null, 2)}</pre>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
