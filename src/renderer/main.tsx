import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('main.tsx is executing');
console.log('Looking for root element');

const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root element found, rendering React app');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found! Cannot mount React app');
} 