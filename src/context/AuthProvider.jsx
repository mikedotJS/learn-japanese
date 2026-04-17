import { useUser } from '@weirdscience/based-client';
import { AuthContext } from './AuthContext';
import { based } from '../lib/based';

export function AuthProvider({ children }) {
  const { user, isLoading } = useUser();

  const signIn = (email, password) => based.auth.signIn(email, password);
  const signUp = (email, password) => based.auth.signUp(email, password);
  const signOut = () => based.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading: isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
