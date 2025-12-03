import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './views/Dashboard';
import Archives from './views/Archives';
import Terminal from './views/Terminal';
import Login from './views/Login';
import Register from './views/Register';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Sensor & Actuator State
  const [sensors, setSensors] = useState({ temp: 24.0, humidity: 60, co: 10 });
  const [actuators, setActuators] = useState({ fan: false, heater: false, buzzer: false });
  const [history, setHistory] = useState([]);
  const [aiStatus, setAiStatus] = useState({ isAnomaly: false, message: 'SYSTEM NORMAL', detail: 'No significant deviations detected.' });

  // Simulation Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => {
        // 1. Simulate Physics
        let tChange = (Math.random() - 0.5); // Random drift
        if (actuators.heater) tChange += 0.8; // Heater raises temp rapidly
        if (actuators.fan) tChange -= 0.3; // Fan cools slightly

        let coChange = (Math.random() - 0.5) * 2;
        // Occasional random CO spike simulation
        if (Math.random() > 0.95) coChange += 15;

        const newTemp = parseFloat((prev.temp + tChange).toFixed(1));
        const newCo = Math.max(0, Math.round(prev.co + coChange));
        const newHumid = Math.max(0, Math.min(100, Math.round(prev.humidity + (Math.random() - 0.5))));

        // 2. AI Anomaly Logic
        let status = "OK";
        let aiMsg = "SYSTEM NORMAL";
        let aiDet = "Optimal conditions maintained.";
        let isBad = false;

        if (newCo > 50) {
          isBad = true;
          aiMsg = "WARNING: TOXIC AIR";
          aiDet = `High CO levels(${newCo} PPM) detected.Suggest activating Fan immediately.`;
          status = "DANGER";
        } else if (newTemp > 35) {
          isBad = true;
          aiMsg = "WARNING: OVERHEAT";
          aiDet = `Temperature(${newTemp}°C) exceeds safety threshold.Check Heater status.`;
          status = "WARN";
        }

        setAiStatus({ isAnomaly: isBad, message: aiMsg, detail: aiDet });

        // 3. Save to History (Cloud Mock)
        const newEntry = {
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temp: newTemp,
          humidity: newHumid,
          co: newCo,
          status: status
        };

        setHistory(prevHist => {
          const updated = [...prevHist, newEntry];
          if (updated.length > 20) updated.shift(); // Keep last 20
          return updated;
        });

        return { temp: newTemp, humidity: newHumid, co: newCo };
      });
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, [actuators]);

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

  // Protected Layout Component
  const ProtectedLayout = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return (
      <div className="min-h-screen bg-vintage-beige p-8 flex flex-col items-center justify-center font-mono text-vintage-coffee selection:bg-vintage-coffee selection:text-vintage-beige">
        <div className="w-full max-w-5xl border-4 border-vintage-coffee bg-vintage-tan p-3 shadow-hard rounded-lg">
          {/* Header / Mode Switcher */}
          <div className="bg-vintage-cream p-3 mb-4 flex justify-between items-center border-2 border-vintage-coffee rounded-sm shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border border-vintage-coffee shadow-inner ${aiStatus.isAnomaly ? 'bg-vintage-red animate-pulse' : 'bg-vintage-green'}`}></div>
              <h1 className="text-vintage-coffee font-bold text-xl tracking-widest uppercase">
                Environmental control system <span className="text-xs opacity-60"></span>
              </h1>
            </div>

            <div className="flex gap-2 bg-vintage-tan p-1 rounded border border-vintage-coffee shadow-inner">
              {['dashboard', 'archives', 'terminal'].map((view) => (
                <button
                  key={view}
                  onClick={() => navigate(`/${view}`)}
                  className={`
                    px-4 py-1 text-xs font-bold uppercase transition-all rounded-sm
                    ${location.pathname === `/${view}`
                      ? 'bg-vintage-coffee text-vintage-beige shadow-none'
                      : 'bg-vintage-cream text-vintage-coffee hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'}
                  `}
                >
                  {view}
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="px-4 py-1 text-xs font-bold uppercase transition-all rounded-sm bg-vintage-red text-vintage-beige hover:bg-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ml-2"
              >
                EXIT
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-vintage-beige p-6 min-h-[600px] border-2 border-vintage-coffee shadow-inset relative rounded-sm">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-3 flex justify-between text-xs text-vintage-coffee font-bold px-2 opacity-70">
            <span>MEM: 64KB OK</span>
            <span>CONNECTED: LOCALHOST</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <ProtectedLayout>
            <Dashboard
              sensors={sensors}
              actuators={actuators}
              toggleActuator={toggleActuator}
              aiStatus={aiStatus}
            />
          </ProtectedLayout>
        } />

        <Route path="/archives" element={
          <ProtectedLayout>
            <Archives history={history} />
          </ProtectedLayout>
        } />

        <Route path="/terminal" element={
          <ProtectedLayout>
            <Terminal />
          </ProtectedLayout>
        } />
      </Routes>
    </ToastProvider>
  );
}

export default App;
