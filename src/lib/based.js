import { createClient } from '@weirdscience/based-client';

export const based = createClient({
  url: import.meta.env.VITE_BASED_URL,
  anonKey: import.meta.env.VITE_BASED_ANON_KEY,
});
