import React, { useState, useEffect } from 'react';
import { User } from './types';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Employees } from './pages/Employees';
import { Storage } from './pages/Storage';
import { Backups } from './pages/Backups';
import { DisasterRecovery } from './pages/DisasterRecovery';
import { Monitoring } from './pages/Monitoring';
import { Security } from './pages/Security';
import { ActivityLogs } from './pages/ActivityLogs';
import { Settings } from './pages/Settings';
import { monitoringService, settingsService } from './services';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [serverMode, setServerMode] = useState<'live' | 'simulated'>('simulated');
  const [cpuUsage, setCpuUsage] = useState<number>(24);
  const [memUsage, setMemUsage] = useState<number>(43);

  // Initialize auth from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('whx_user');
    const token = localStorage.getItem('whx_auth_token');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('whx_user');
      }
    }

    // Listen for session expiry
    const handleSessionExpired = () => {
      setUser(null);
    };
    window.addEventListener('whx-session-expired', handleSessionExpired);
    return () => window.removeEventListener('whx-session-expired', handleSessionExpired);
  }, []);

  // Sync mode and live mini telemetry
  useEffect(() => {
    if (!user) return;

    const checkServer = async () => {
      try {
        const metrics = await monitoringService.getMetrics();
        if (metrics) {
          setServerMode(metrics.mode === 'live' ? 'live' : 'simulated');
          setCpuUsage(metrics.cpu.percent);
          setMemUsage(metrics.memory.percent);
        }
      } catch (err) {
        // Fallback
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('whx_auth_token');
    localStorage.removeItem('whx_user');
    setUser(null);
  };

  const handleModeToggle = async () => {
    const nextMode = serverMode === 'live' ? 'demo' : 'live';
    try {
      const res = await settingsService.toggleMode(nextMode);
      setServerMode(res.current_mode === 'live' ? 'live' : 'simulated');
    } catch (err) {
      alert('Mode toggle: unable to contact Linux service adapter');
    }
  };

  // If not authenticated, render Login Page
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F8EF] text-[#101410]">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        userRole={user.role}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Sticky Top Header */}
        <Header
          user={user}
          serverMode={serverMode}
          onModeToggle={handleModeToggle}
          onLogout={handleLogout}
          cpuPercent={cpuUsage}
          memPercent={memUsage}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && <Dashboard onNavigateTab={setCurrentTab} />}
            {currentTab === 'inventory' && <Inventory userRole={user.role} />}
            {currentTab === 'employees' && <Employees currentUserRole={user.role} />}
            {currentTab === 'storage' && <Storage userRole={user.role} />}
            {currentTab === 'backups' && <Backups userRole={user.role} />}
            {currentTab === 'recovery' && <DisasterRecovery userRole={user.role} />}
            {currentTab === 'monitoring' && <Monitoring userRole={user.role} />}
            {currentTab === 'security' && <Security userRole={user.role} />}
            {currentTab === 'logs' && <ActivityLogs userRole={user.role} />}
            {currentTab === 'settings' && (
              <Settings
                currentUser={user}
                onLogout={handleLogout}
                onModeChanged={setServerMode}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
