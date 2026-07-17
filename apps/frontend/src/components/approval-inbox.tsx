'use client';

export interface ApprovalRequest {
  id: string;
  executionId: string;
  toolCallId: string;
  toolName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  requestedAt: string;
}

export function ApprovalInbox({
  requests,
  onDecision,
}: {
  requests: readonly ApprovalRequest[];
  onDecision: (id: string, decision: 'approved' | 'denied', reason: string) => Promise<void>;
}) {
  if (requests.length === 0) return <p role="status">No approvals are waiting.</p>;

  return (
    <section aria-labelledby="approval-inbox-heading">
      <h2 id="approval-inbox-heading">Approval inbox</h2>
      {requests.map((request) => (
        <form
          key={request.id}
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const decision = String(form.get('decision')) as 'approved' | 'denied';
            const reason = String(form.get('reason') ?? '').trim();
            if (!reason) return;
            await onDecision(request.id, decision, reason);
          }}
        >
          <fieldset>
            <legend>{request.toolName} — {request.riskLevel} risk</legend>
            <p>{request.reason}</p>
            <p>Execution: <code>{request.executionId}</code></p>
            <label>
              Decision
              <select name="decision" defaultValue="denied">
                <option value="denied">Deny</option>
                <option value="approved">Approve</option>
              </select>
            </label>
            <label>
              Reason
              <textarea name="reason" required minLength={3} maxLength={500} />
            </label>
            <button type="submit">Record decision</button>
          </fieldset>
        </form>
      ))}
    </section>
  );
}
