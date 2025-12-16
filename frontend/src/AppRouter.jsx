import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import Dashboard from './views/Dashboard';
import Archives from './views/Archives';
import Terminal from './views/Terminal';
import MainLayout from './layouts/mainLayout';

const AppRouter = ({
    sensors,
    history,
    aiStatus,
    prediction
}) => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
                <MainLayout>
                    <Dashboard
                        sensors={sensors}
                        aiStatus={aiStatus}
                        prediction={prediction}
                    />
                </MainLayout>
            } />

            <Route path="/archives" element={
                <MainLayout>
                    <Archives history={history} />
                </MainLayout>
            } />

            <Route path="/terminal" element={
                <MainLayout>
                    <Terminal />
                </MainLayout>
            } />
        </Routes>
    );
};

export default AppRouter;
