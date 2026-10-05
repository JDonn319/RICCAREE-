import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

// Жесткая блокировка жестов масштабирования Safari
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('gesturechange', (e) => e.preventDefault());
document.addEventListener('gestureend', (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
