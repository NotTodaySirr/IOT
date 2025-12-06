import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import AppRouter from './AppRouter';
import { useSensorStream } from './hooks/useSensorStream';
import { useSimulation } from './mock/simulation';

function App() {
  // Sensor & Actuator State
  const [actuators, setActuators] = useState({ fan: false, heater: false, buzzer: false });

  // Data Source Selection (Real API vs Simulation)
  const useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';
  const { sensors, history, aiStatus } = useRealApi ? useSensorStream(actuators) : useSimulation(actuators);

  const toggleActuator = (key) => {
    setActuators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter
          sensors={sensors}
          actuators={actuators}
          toggleActuator={toggleActuator}
          aiStatus={aiStatus}
          history={history}
        />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
