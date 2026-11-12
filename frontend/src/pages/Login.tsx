import React, { useState } from 'react';
import { Server, Eye, EyeOff, Shield, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { authService } from '../services';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await authService.login({ username, password });
      localStorage.setItem('whx_auth_token', res.token);
      localStorage.setItem('whx_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F8EF] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background subtle mint radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(218,231,199,0.5)_0,transparent_75%)] pointer-events-none" />

      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#08482D]/15 rounded-3xl p-8 shadow-[0_12px_45px_rgba(8,72,45,0.08)] relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3.5 rounded-2xl bg-[#08482D] text-white shadow-md border border-[#08482D] mb-1">
            <Server className="w-8 h-8 text-[#DAE7C7]" />
          </div>
          <div className="flex items-center justify-center space-x-1 font-heading">
            <h1 className="text-2xl font-extrabold tracking-wider text-[#101410]">WAREHOUSE</h1>
            <h1 className="text-2xl font-black text-[#08482D]">X</h1>
          </div>
          <p className="text-xs font-mono-tech uppercase text-[#5E5E61] tracking-widest font-semibold">
            Linux Server Administration & E-Commerce Logistics
          </p>
          <div className="inline-block mt-1 px-3 py-1 rounded-full bg-[#DAE7C7] text-[#08482D] font-mono-tech text-[10.5px] font-bold tracking-wider">
            SECURE • AUTOMATE • MONITOR • RECOVER
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-start space-x-2 text-[#991B1B] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono-tech text-[#5E5E61] mb-1.5 uppercase tracking-wider font-bold">
              Username / Operator ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E5E61]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or manager"
                className="w-full pl-10 pr-4 py-2.5 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-sm text-[#101410] placeholder-[#A3A3A3] focus:outline-none focus:border-[#08482D] focus:ring-1 focus:ring-[#08482D] font-mono-tech transition-colors font-medium"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono-tech text-[#5E5E61] mb-1.5 uppercase tracking-wider font-bold">
              Server Access Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E5E61]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-[#FAFCF6] border border-[#08482D]/20 rounded-xl text-sm text-[#101410] placeholder-[#A3A3A3] focus:outline-none focus:border-[#08482D] focus:ring-1 focus:ring-[#08482D] font-mono-tech transition-colors font-medium"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#5E5E61] hover:text-[#101410] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-[#08482D] hover:bg-[#063722] text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-[0_4px_18px_rgba(8,72,45,0.22)] cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating Linux Session...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Sign In to WareHouseX</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins Bar */}
        <div className="mt-8 pt-6 border-t border-[#08482D]/12 text-center">
          <p className="text-[11px] font-mono-tech text-[#5E5E61] mb-3 uppercase tracking-wider font-bold">
            Quick-Fill Preconfigured Roles:
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono-tech">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'admin123')}
              className="px-2.5 py-2 rounded-xl bg-[#DAE7C7] border border-[#08482D]/25 text-[#08482D] font-bold hover:bg-[#CFDEC0] transition-colors cursor-pointer"
            >
              Administrator
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('manager', 'manager123')}
              className="px-2.5 py-2 rounded-xl bg-[#E0F2FE] border border-[#0284C7]/25 text-[#0369A1] font-bold hover:bg-[#BAE6FD] transition-colors cursor-pointer"
            >
              WH Manager
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('staff', 'staff123')}
              className="px-2.5 py-2 rounded-xl bg-[#F5F8EF] border border-[#08482D]/20 text-[#101410] font-bold hover:bg-[#EAEFE2] transition-colors cursor-pointer"
            >
              WH Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
