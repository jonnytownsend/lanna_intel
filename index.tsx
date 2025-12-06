
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { logger } from './services/logger';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Global Error Handlers for centralized logging
window.onerror = (message, source, lineno, colno, error) => {
    logger.error(message.toString(), 'GlobalError', { source, lineno, stack: error?.stack });
};

window.onunhandledrejection = (event) => {
    logger.error('Unhandled Promise Rejection', 'GlobalError', { reason: event.reason });
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
