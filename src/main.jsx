import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './firebase/firebase'; // Ensure Firebase is initialized before the app

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);