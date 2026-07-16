import { useEffect, useState } from 'react';

interface Message {
  id: number;
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/chat`)
      .then((res) => res.json())
      .then(setMessages)
      .catch(() => setMessages([]));
  }, []);

  const sendMessage = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input }),
    });
    const data = await res.json();
    setMessages((msgs) => [...msgs, data]);
    setInput('');
  };

  const createAgent = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/create-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    alert('Agent created');
  };

  return (
    <div>
      <h2>Chat</h2>
      <div>
        {messages.map((m) => (
          <p key={m.id}>{m.content}</p>
        ))}
      </div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
      <button onClick={createAgent}>Create Agent</button>
    </div>
  );
}
