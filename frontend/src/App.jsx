import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppRouter from './AppRouter';
import { useSensorStream } from './hooks/useSensorStream';

function App() {
  const { sensors, history, aiStatus, aiPrediction } = useSensorStream();

  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter
          sensors={sensors}
          history={history}
          aiStatus={aiStatus}
          prediction={aiPrediction}
        />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
