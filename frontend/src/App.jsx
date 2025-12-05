import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import AppRouter from './AppRouter';
import { useSimulation } from './mock/simulation';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Sensor & Actuator State
  const [actuators, setActuators] = useState({ fan: false, heater: false, buzzer: false });

  // Simulation Hook
  const { sensors, history, aiStatus } = useSimulation(actuators);

  const toggleActuator = (key) => {
    setActuators(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <ToastProvider>
      <AppRouter
        isAuthenticated={isAuthenticated}
        onLogin={handleLogin}
        onLogout={handleLogout}
        sensors={sensors}
        actuators={actuators}
        toggleActuator={toggleActuator}
        aiStatus={aiStatus}
        history={history}
      />
    </ToastProvider>
  );
}

export default App;
