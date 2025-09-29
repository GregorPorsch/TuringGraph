// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { printTMState } from '@utils/printTMState';

let root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

import { setTuringMachineSchema } from '@utils/parsing';

fetch(`${import.meta.env.BASE_URL}turingMachineSchema.json`)
  .then((res) => res.json())
  .then((schema) => setTuringMachineSchema(schema));

(window as any).printTMState = printTMState; // Expose printTMState globally for debugging

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
