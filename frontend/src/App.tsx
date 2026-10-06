import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Farms from './pages/Farms';
import CropHealth from './pages/CropHealth';
import Scanner from './pages/Scanner';
import Pests from './pages/Pests';
import Soil from './pages/Soil';
import Recommend from './pages/Recommend';
import Irrigation from './pages/Irrigation';
import Weather from './pages/Weather';
import Risk from './pages/Risk';
import Disasters from './pages/Disasters';
import Markets from './pages/Markets';
import Profit from './pages/Profit';
import Calendar from './pages/Calendar';
import Assistant from './pages/Assistant';
import Schemes from './pages/Schemes';
import Satellite from './pages/Satellite';
import FarmMap from './pages/FarmMap';
import Notifications from './pages/Notifications';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import SearchPage from './pages/SearchPage';
import About from './pages/About';

function Guard({ children }: any) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-gray-400">Loading…</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Guard><MainLayout /></Guard>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/farms" element={<Farms />} />
            <Route path="/crop-health" element={<CropHealth />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/pests" element={<Pests />} />
            <Route path="/soil" element={<Soil />} />
            <Route path="/recommend" element={<Recommend />} />
            <Route path="/irrigation" element={<Irrigation />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/risk" element={<Risk />} />
            <Route path="/disasters" element={<Disasters />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/profit" element={<Profit />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/satellite" element={<Satellite />} />
            <Route path="/map" element={<FarmMap />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/about" element={<About />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}
