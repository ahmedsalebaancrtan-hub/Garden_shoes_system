import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import {
  LayoutDashboard,
  Footprints,
  Truck,
  Users,
  Briefcase,
  ShoppingCart,
  CreditCard,
  BarChart3,
  DollarSign,
  LogOut
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'CASHIER'] },
  { name: 'Shoes', path: '/shoes', icon: Footprints, roles: ['ADMIN', 'STAFF'] },
  { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['ADMIN', 'STAFF'] },
  { name: 'Customers', path: '/customers', icon: Users, roles: ['ADMIN', 'STAFF'] },
  { name: 'Users', path: '/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Employees', path: '/employees', icon: Briefcase, roles: ['ADMIN'] },
  { name: 'Salaries', path: '/salaries', icon: DollarSign, roles: ['ADMIN', 'STAFF'] },
  { name: 'Orders', path: '/orders', icon: ShoppingCart, roles: ['ADMIN', 'STAFF', 'CASHIER'] },
  { name: 'Payments', path: '/payments', icon: CreditCard, roles: ['ADMIN', 'STAFF', 'CASHIER'] },
  { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN'] },
];

const Layout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = user?.role || 'CASHIER'; // fallback

  const filteredMenu = MENU_ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-garden-dark text-white flex flex-col shadow-xl z-20">
        <div className="h-16 flex items-center justify-center border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight text-white">
            GOLDEN<span className="text-yellow-500">SHOES</span>
          </h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-garden-lime text-garden-dark font-black shadow-lg shadow-garden-lime/20' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-garden-dark' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-xl transition-colors font-semibold"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Ka Bax (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center">
            <h2 className="text-xl font-extrabold text-slate-800 capitalize tracking-tight">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{user?.username || 'GOLDEN USER'}</p>
              <p className="text-[10px] font-black tracking-wider text-garden-dark bg-garden-lime/30 inline-block px-2.5 py-0.5 rounded-full mt-0.5">
                {user?.role || 'UNKNOWN'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-garden-dark flex items-center justify-center text-garden-lime font-bold border-2 border-garden-lime/30 shadow-md">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
