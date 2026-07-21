import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import NewScan from './pages/NewScan';
import QualityAnalysis from './pages/QualityAnalysis';
import ScreeningResult from './pages/ScreeningResult';
import ScanHistory from './pages/ScanHistory';
import HealthAssistant from './pages/HealthAssistant';

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />

        {/* Private App Routes (wrapped in Layout) */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new-scan" element={<NewScan />} />
        <Route path="/quality" element={<QualityAnalysis />} />
        <Route path="/result" element={<ScreeningResult />} />
        <Route path="/history" element={<ScanHistory />} />
        <Route path="/assistant" element={<HealthAssistant />} />

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
