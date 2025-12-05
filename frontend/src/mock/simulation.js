import { useState, useEffect } from 'react';

export const useSimulation = (actuators) => {
    const [sensors, setSensors] = useState({ temp: 24.0, humidity: 60, co: 10 });
    const [history, setHistory] = useState([]);
    const [aiStatus, setAiStatus] = useState({ isAnomaly: false, message: 'SYSTEM NORMAL', detail: 'No significant deviations detected.' });

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

    return { sensors, history, aiStatus };
};
