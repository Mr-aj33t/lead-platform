import { createContext, useContext, useEffect } from 'react';
import useAuthStore from '../store/authStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const store = useAuthStore();

  useEffect(() => {
    store.loadUser();
  }, []);

  return <AuthContext.Provider value={store}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
