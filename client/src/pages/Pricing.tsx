import { useSessionContext } from '@supabase/auth-helpers-react';

export default function Pricing() {
  const { session } = useSessionContext();

  const subscribe = async (priceId: string) => {
    if (!session) {
      alert('Please log in first');
      return;
    }

    const res = await fetch(`${import.meta.env.VITE_API_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: session.user.id, priceId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <div>
      <h2>Pricing</h2>
      <button onClick={() => subscribe(import.meta.env.VITE_BASIC_PRICE_ID)}>
        Subscribe Basic
      </button>
      <button onClick={() => subscribe(import.meta.env.VITE_PRO_PRICE_ID)}>
        Subscribe Pro
      </button>
    </div>
  );
}
