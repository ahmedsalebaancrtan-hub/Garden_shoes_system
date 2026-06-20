// src/App.tsx
import React, { useEffect } from 'react';
import useAuthStore from './context/authStore';
import AppRoutes from './routes/AppRoutes';

const App: React.FC = () => {
  const { isAuthenticated, checkWhoAmI, loading } = useAuthStore();

  // Marka uu nidaamku kaco, hubi haddii LocalStorage uu token ku jiro mar hore
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      checkWhoAmI();
    }
  }, [checkWhoAmI]);

  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-garden-dark flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-garden-lime border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wide">Fadlan sug, nidaamka baa la xaqiijinayaa...</p>
        </div>
      </div>
    );
  }

  return <AppRoutes />;
};

export default App;