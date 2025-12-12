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
    aiStatus,
    history
}) => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
                <MainLayout aiStatus={aiStatus}>
                    <Dashboard
                        sensors={sensors}
                        aiStatus={aiStatus}
                    />
                </MainLayout>
            } />

            <Route path="/archives" element={
                <MainLayout aiStatus={aiStatus}>
                    <Archives history={history} />
                </MainLayout>
            } />

            <Route path="/terminal" element={
                <MainLayout aiStatus={aiStatus}>
                    <Terminal />
                </MainLayout>
            } />
        </Routes>
    );
};

export default AppRouter;
