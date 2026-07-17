'use client';

import { useState } from 'react';

export interface ApprovalRequest {
  id: string;
  executionId: string;
  toolCallId: string;
  toolName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  requestedAt: string;
}

export function ApprovalInbox({ requests, onDecision }: {
  requests: readonly ApprovalRequest[];
  onDecision: (id: string, decision: 'approved' | 'denied', reason: string) => Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0) return <p role="status">No approvals are waiting.</p>;

  return (
    <section aria-labelledby="approval-inbox-heading">
      <h2 id="approval-inbox-heading">Approval inbox</h2>
      {error ? <p role="alert">{error}</p> : null}
      {requests.map((request) => {
        const pending = pendingId === request.id;
        return (
          <form
            key={request.id}
            onSubmit={async (event) => {
              event.preventDefault();
              if (pendingId) return;
              const form = new FormData(event.currentTarget);
              const rawDecision = String(form.get('decision'));
              if (rawDecision !== 'approved' && rawDecision !== 'denied') {
                setError('Choose a valid approval decision.');
                return;
              }
              const reason = String(form.get('reason') ?? '').trim();
              if (reason.length < 3) {
                setError('Decision reason must be at least 3 characters.');
                return;
              }
              setPendingId(request.id);
              setError(null);
              try {
                await onDecision(request.id, rawDecision, reason);
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : 'Unable to record approval decision.');
              } finally {
                setPendingId(null);
              }
            }}
          >
            <fieldset disabled={Boolean(pendingId)} aria-busy={pending}>
              <legend>{request.toolName} — {request.riskLevel} risk</legend>
              <p>{request.reason}</p>
              <p>Execution: <code>{request.executionId}</code></p>
              <p>Tool call: <code>{request.toolCallId}</code></p>
              <label>Decision
                <select name="decision" defaultValue="denied">
                  <option value="denied">Deny</option>
                  <option value="approved">Approve</option>
                </select>
              </label>
              <label>Reason
                <textarea name="reason" required minLength={3} maxLength={500} />
              </label>
              <button type="submit">{pending ? 'Recording…' : 'Record decision'}</button>
            </fieldset>
          </form>
        );
      })}
    </section>
  );
}
