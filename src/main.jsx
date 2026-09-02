import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerAllModules } from './modules';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Register pluggable EduKatalyst modules into central ModuleRegistry
registerAllModules();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '119791404749-o4a3g19ps1sjvkgmcf9qj62ih9l5mcpp.apps.googleusercontent.com';

if (typeof window !== 'undefined') {
  console.info(`[GoogleOAuth] Runtime Origin: ${window.location.origin}`);
  console.info(`[GoogleOAuth] Client ID: ${GOOGLE_CLIENT_ID}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
