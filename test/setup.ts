// test/setup.ts
/// <reference types="vite/client" />
import '@testing-library/jest-dom';

(globalThis as any).DEBUGGING =
  import.meta.env.MODE === 'development' || import.meta.env.MODE === 'test';
