import { useSessionContext } from '@supabase/auth-helpers-react';
import { Link, useNavigate } from 'react-router-dom';

export default function App() {
  const { session, supabaseClient } = useSessionContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    navigate('/login');
  };

  return (
    <div>
      <h1>AgentForge Client</h1>
      {session ? (
        <>
          <button onClick={handleLogout}>Logout</button>
          <ul>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/agent">Agent Builder</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
          </ul>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </div>
  );
}
