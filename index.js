import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Add global error handler for WebAssembly errors
window.addEventListener('error', (event) => {
  // Check if the error is a WebAssembly error
  if (event.message.includes('WebAssembly') || 
      (event.error && event.error.toString().includes('WebAssembly'))) {
    console.warn('WebAssembly error intercepted:', event.message);
    // Prevent the error from showing in the console
    event.preventDefault();
  }
});

// Initialize the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Using StrictMode can cause PGlite to initialize twice in development
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);