import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './pages/App';
import Login from './pages/Login';
import Chat from './pages/Chat';
import AgentBuilder from './pages/AgentBuilder';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './supabaseClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionContextProvider supabaseClient={supabase}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}/>
          <Route path="/login" element={<Login />}/>
          <Route path="/chat" element={<Chat />}/>
          <Route path="/agent" element={<AgentBuilder />}/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionContextProvider>
  </React.StrictMode>
);
