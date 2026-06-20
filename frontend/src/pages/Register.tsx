import React, { useState } from 'react';
import type { FormEvent } from 'react';
import useAuthStore from '../context/authStore';
import { useNavigate, Link } from 'react-router-dom';
import type { RegisterRequest } from '../types/user';
import { User, Mail, Phone, Lock, Eye, EyeOff, Shield } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterRequest>({
    fullname: '',
    email: '',
    phone: '',
    password: '',
    role: 'STAFF',
  });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { registerUser, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    const result = await registerUser(formData);
    if (result.success) {
      setSuccessMsg(result.message || 'Waa lagu diiwaangeliyey!');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-garden-dark px-4 py-12 font-sans">
      <div className="max-w-md w-full bg-slate-900/40 border border-garden-lime/20 rounded-2xl shadow-2xl p-8 backdrop-blur-sm space-y-6">
        <div className="text-center">
          <h2 className="text-4xl font-black text-white tracking-tight">
            GARDEN<span className="text-garden-lime">SHOES</span>
          </h2>
          <p className="text-slate-300 text-sm mt-2 font-medium">
            Is Diiwaangeli Si Aad Uga Mid Noqoto Nidaamka
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl text-center font-semibold animate-pulse">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="bg-garden-lime/10 border border-garden-lime/30 text-garden-lime text-sm p-3 rounded-xl text-center font-semibold">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-1 tracking-wide">Magaca oo Buuxa</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="fullname"
                required
                value={formData.fullname}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-garden-dark/50 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition duration-200"
                placeholder="Geli magacaaga oo saddexan"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-white mb-1 tracking-wide">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-garden-dark/50 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition duration-200"
                placeholder="admin@garden.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1 tracking-wide">Taleefan Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-garden-dark/50 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition duration-200"
                placeholder="+252..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-1 tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2.5 bg-garden-dark/50 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition duration-200"
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

          <div>
            <label className="block text-sm font-semibold text-white mb-1 tracking-wide">Doorka (Role)</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-garden-dark/50 border border-slate-700 rounded-xl text-white font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition duration-200 appearance-none"
              >
                <option value="STAFF">STAFF</option>
                <option value="CASHIER">CASHIER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-garden-lime text-garden-dark font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-garden-lime/10 hover:bg-white hover:scale-[1.01] active:scale-[0.99] transition duration-200 disabled:bg-slate-700 disabled:text-slate-400 disabled:scale-100 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                <span>Waa La Diiwaangelinayaa...</span>
              </div>
            ) : (
              'IS DIIWAANGELI'
            )}
          </button>
          
          <div className="text-center mt-6">
            <p className="text-slate-400 text-sm font-medium">
              Akoon ma leedahay horey?{' '}
              <Link
                to="/login"
                className="text-garden-lime hover:text-white transition-colors font-bold"
              >
                Ku Noqo Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
