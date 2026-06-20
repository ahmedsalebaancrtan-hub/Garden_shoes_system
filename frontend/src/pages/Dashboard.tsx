// src/pages/Dashboard.tsx
import React from 'react';
import useAuthStore from '../context/authStore';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-garden-dark text-white px-6 py-4 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-black tracking-tight">
          GARDEN<span className="text-garden-lime">SHOES</span> <span className="text-xs px-2 py-1 bg-garden-lime/20 text-garden-lime rounded-md ml-2">DASHBOARD</span>
        </h1>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-bold text-white">{user?.username || 'Ahmed Ali'}</p>
            <p className="text-xs text-garden-lime font-semibold tracking-wider">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition duration-200"
          >
            LOGOUT
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800">Kusoo Dhawaada Nidaamka Garden Shoes</h2>
          <p className="text-slate-500 text-sm mt-1">Halkan waa halka ay ka bilaaban doonto maamulka alaabta, macamiisha, iyo warbixinada dukaanka.</p>
          
          {/* Box-yada Xogta Kumeel-gaarka ah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="p-6 bg-garden-dark text-white rounded-xl shadow-sm">
              <h3 className="text-sm font-semibold tracking-wide text-garden-lime">Role-kaaga System-ka</h3>
              <p className="text-3xl font-black mt-2">{user?.role || 'MA AHAN ADMIN'}</p>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-semibold tracking-wide text-slate-400">User ID-gaaga</h3>
              <p className="text-3xl font-black mt-2 text-slate-800">#{user?.user_id || 1}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;