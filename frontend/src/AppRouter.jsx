import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import Dashboard from './views/Dashboard';
import Archives from './views/Archives';
import Terminal from './views/Terminal';
import MainLayout from './layouts/mainLayout';

const AppRouter = ({
    isAuthenticated,
    onLogin,
    onLogout,
    sensors,
    actuators,
    toggleActuator,
    aiStatus,
    history
}) => {
    return (
        <Routes>
            <Route path="/login" element={<Login onLogin={onLogin} />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
                <MainLayout isAuthenticated={isAuthenticated} aiStatus={aiStatus} onLogout={onLogout}>
                    <Dashboard
                        sensors={sensors}
                        actuators={actuators}
                        toggleActuator={toggleActuator}
                        aiStatus={aiStatus}
                    />
                </MainLayout>
            } />

            <Route path="/archives" element={
                <MainLayout isAuthenticated={isAuthenticated} aiStatus={aiStatus} onLogout={onLogout}>
                    <Archives history={history} />
                </MainLayout>
            } />

            <Route path="/terminal" element={
                <MainLayout isAuthenticated={isAuthenticated} aiStatus={aiStatus} onLogout={onLogout}>
                    <Terminal />
                </MainLayout>
            } />
        </Routes>
    );
};

export default AppRouter;
