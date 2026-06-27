import React, { useState } from 'react';
import type { FormEvent } from 'react';
import useAuthStore from '../context/authStore';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // Ka soo saar Zustand waxyaalaha aan u baahan nahay
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-garden-dark px-4 font-sans">
      <div className="max-w-md w-full bg-slate-900/40 border border-garden-lime/20 rounded-2xl shadow-2xl p-8 backdrop-blur-sm space-y-6">
        
        {/* Header-ka Brand-ka */}
        <div className="text-center">
          <h2 className="text-4xl font-black text-white tracking-tight">
            GOLDEN<span className="text-yellow-500">SHOES</span>
          </h2>
          <p className="text-slate-300 text-sm mt-2 font-medium">
            Geli xogtaada si aad u maamusho nidaamka dukaanka
          </p>
        </div>

        {/* Meesha Ciladaha (Errors-ka) laga muujiyo */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl text-center font-semibold animate-pulse">
            {error}
          </div>
        )}

        {/* Form-ka Login-ka */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Input-ka Email-ka */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2 tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-garden-dark/50 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition duration-200 placeholder-slate-500"
                placeholder="admin@golden.com"
              />
            </div>
          </div>

          {/* Input-ka Password-ka */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2 tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-garden-dark/50 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition duration-200 placeholder-slate-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Badanka Submit-ka (Button) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-garden-lime text-garden-dark font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-garden-lime/10 hover:bg-white hover:scale-[1.01] active:scale-[0.99] transition duration-200 disabled:bg-slate-700 disabled:text-slate-400 disabled:scale-100 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                <span>Hada Baa La Xaqiijinayaa...</span>
              </div>
            ) : (
              'SOO GAL NIDAAMKA'
            )}
          </button>

          <div className="text-center mt-6">
            <p className="text-slate-400 text-sm font-medium">
              Akon ma lihid?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-garden-lime hover:text-white transition-colors font-bold"
              >
                Is Diiwaangeli Halkan
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
