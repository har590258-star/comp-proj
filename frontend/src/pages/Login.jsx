import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  AlertCircle,
  ShieldCheck,
  Wrench,
  Radio,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  LockKeyhole,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

const Login = () => {
  const [username, setUsername] = useState('EMP001');
  const [password, setPassword] = useState('adani123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your Mobile Number or User ID');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res?.success) {
        showToast(`Welcome back, ${res.user.name}!`);
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res?.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Unable to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotIdentifier) return;
    showToast('Password reset link sent to your registered mobile number.', 'info');
    setForgotModalOpen(false);
    setForgotIdentifier('');
  };

  const selectDemoAccount = (userType) => {
    if (userType === 'technician') {
      setUsername('EMP001');
      setPassword('adani123');
      setError('');
    } else {
      setUsername('ADMIN01');
      setPassword('adani123');
      setError('');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col lg:flex-row">
      {/* ==================================================================== */}
      {/* LEFT COLUMN: Enterprise Brand & Infrastructure Showcase (Website Layout) */}
      {/* ==================================================================== */}
      <div className="relative hidden lg:flex lg:w-7/12 xl:w-3/5 bg-slate-950 text-white flex-col justify-between p-12 xl:p-16 overflow-hidden">
        {/* Background Transmission Tower Image from PDF with rich corporate gradient */}
        <div className="absolute inset-0">
          <img
            src="/assets/login_banner.jpg"
            alt="Adani Energy Infrastructure"
            className="w-full h-full object-cover object-center opacity-45 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-900/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        </div>

        {/* Top Header on Brand Panel */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg">
            <img
              src="/assets/adani_logo.png"
              alt="Adani Energy Solutions"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2 bg-brand-500/20 border border-brand-400/30 text-brand-300 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Adani Smart Meter Enterprise Grid</span>
          </div>
        </div>

        {/* Center Hero Information */}
        <div className="relative z-10 max-w-2xl my-auto py-12">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mb-4">
            Next-Gen Workforce & Field Operations
          </span>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
            GPS Based Attendance & Real-Time Tracking
          </h1>
          <p className="text-lg text-slate-300 font-medium mt-3">
            Adani Smart Meter Project — Centralized Operations Portal
          </p>
          <p className="text-sm text-slate-400 mt-4 leading-relaxed max-w-xl">
            Streamlining field technician check-ins, automated geofence radius verification, shift logs, and instant Excel reporting across active transmission zones.
          </p>

          {/* 3 Core System Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-2.5">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Live GPS Ping</h3>
              <p className="text-xs text-slate-400 mt-1">Satellite telemetry with accurate distance estimation.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Site Geofence</h3>
              <p className="text-xs text-slate-400 mt-1">Verified check-in within designated substation radius.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-white">Audit Reports</h3>
              <p className="text-xs text-slate-400 mt-1">Instant shift exports & compliant attendance trails.</p>
            </div>
          </div>
        </div>

        {/* Bottom Banner Stats */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-lg font-bold text-white">2.4M+</p>
              <p className="text-[11px] text-slate-400">Smart Meters Deployed</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-lg font-bold text-emerald-400">99.8%</p>
              <p className="text-[11px] text-slate-400">Geofence Accuracy</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-lg font-bold text-brand-400">Phase 1 & 2</p>
              <p className="text-[11px] text-slate-400">Active Operational Hubs</p>
            </div>
          </div>
          <span className="font-mono text-slate-500">v1.0.0 Enterprise</span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* RIGHT COLUMN: Enterprise Login Form Portal */}
      {/* ==================================================================== */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 xl:p-20 bg-white">
        {/* Mobile Header (Only visible on small viewports) */}
        <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-100">
          <img src="/assets/adani_logo.png" alt="Adani Energy Solutions" className="h-8 w-auto" />
          <span className="text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
            Smart Meter Project
          </span>
        </div>

        {/* Form Container */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Sign In
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Enter your credentials to access the Adani Smart Meter Tracking & Attendance Portal.
            </p>
          </div>

          {/* Quick Role Sign-In Selector */}
          <div className="mb-6 p-2 bg-slate-100/90 rounded-2xl border border-slate-200">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider text-center mb-2">
              Select Role Account to Sign In
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectDemoAccount('technician')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  username === 'EMP001'
                    ? 'bg-white text-brand-600 shadow-sm border border-slate-200 ring-2 ring-brand-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-sm">
                  <Wrench className="w-4 h-4 text-brand-600" />
                  <span>User / Field Tech</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">EMP001 (Opens User Side)</span>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('admin')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  username === 'ADMIN01'
                    ? 'bg-white text-purple-600 shadow-sm border border-slate-200 ring-2 ring-purple-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-sm">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin Portal</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">ADMIN01 (Opens Admin Side)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Mobile / User ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mobile Number / Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. EMP001 or 9876543210"
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Password with visibility toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-600">Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                loading={loading}
                className="bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-md py-3 text-sm"
              >
                Sign In to Portal
              </Button>
            </div>
          </form>

          {/* Security & Support Guarantee */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <LockKeyhole className="w-3.5 h-3.5 text-emerald-500" />
              <span>TLS 256-bit Encrypted</span>
            </div>
            <span>Support: ops@adani.com</span>
          </div>
        </div>

        {/* Corporate Footer */}
        <div className="pt-6 text-center text-xs text-slate-400 border-t border-slate-100 lg:border-none">
          <p>© {new Date().getFullYear()} Adani Energy Solutions Limited. All rights reserved.</p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Password Recovery</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your registered Employee ID or mobile number to receive a secure password reset link.
            </p>
            <Input
              placeholder="e.g. EMP001 or 9876543210"
              value={forgotIdentifier}
              onChange={(e) => setForgotIdentifier(e.target.value)}
            />
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" fullWidth size="sm" onClick={() => setForgotModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" fullWidth size="sm" onClick={handleForgotSubmit}>
                Send Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
