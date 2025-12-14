import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppRouter from './AppRouter';
import { useSensorStream } from './hooks/useSensorStream';
import { useSimulation } from './mock/simulation';

function App() {
  // Data Source Selection (Real API vs Simulation)
  const useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';
  const { sensors, history, aiStatus, aiPrediction } = useRealApi ? useSensorStream() : useSimulation();

  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter
          sensors={sensors}
          history={history}
          aiStatus={aiStatus}
          prediction={aiPrediction}
          useRealApi={useRealApi}
        />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
