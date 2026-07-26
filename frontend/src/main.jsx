import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

window.addEventListener('error', (e) => {
  console.error('GLOBAL ERROR:', e.error || e.message);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="color:red;padding:20px;font-family:sans-serif;"><h1>Runtime Error</h1><pre>' + (e.error?.stack || e.message) + '</pre></div>';
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </BrowserRouter>
  </React.StrictMode>
);

