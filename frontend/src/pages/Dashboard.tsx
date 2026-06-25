import React, { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, ShoppingBag, DollarSign, Layers, AlertCircle, ArrowRight, User } from 'lucide-react';
import useAuthStore from '../context/authStore';
import axiosClient from '../api/axiosClient';
import { type Order, type Shoe } from './Orders';
import { type Payment } from './Payments';
import { Link } from 'react-router-dom';

const toNumber = (value: number | string | undefined | null): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [ordersRes, paymentsRes, shoesRes] = await Promise.allSettled([
          axiosClient.get('/orders/'),
          axiosClient.get('/payments/'),
          axiosClient.get('/shoes/')
        ]);

        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data?.data)) {
          setOrders(ordersRes.value.data.data);
        }
        
        if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value.data?.data)) {
          setPayments(paymentsRes.value.data.data);
        }

        if (shoesRes.status === 'fulfilled' && Array.isArray(shoesRes.value.data?.data)) {
          setShoes(shoesRes.value.data.data);
        }

      } catch (error) {
        console.error('[Dashboard] Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // ── Computations ──────────────────────────────────────────────────────────
  const totalRevenue = useMemo(() => {
    return payments.reduce((sum, p) => sum + toNumber(p.amount_paid), 0);
  }, [payments]);

  const debtOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'DEBT' || o.status === 'PARTIAL').length;
  }, [orders]);

  const recentOrders = useMemo(() => {
    // Sort descending by order ID and take top 5
    return [...orders].sort((a, b) => b.o_id - a.o_id).slice(0, 5);
  }, [orders]);

  const paymentMethodStats = useMemo(() => {
    const stats: Record<string, number> = { ZAAD: 0, CASH: 0, EVC: 0, BANK: 0 };
    let total = 0;
    
    payments.forEach(p => {
      const method = (p.payment_method || 'CASH').toUpperCase();
      if (stats[method] !== undefined) {
        stats[method] += toNumber(p.amount_paid);
      } else {
        stats['CASH'] += toNumber(p.amount_paid); // fallback
      }
      total += toNumber(p.amount_paid);
    });

    return { stats, total };
  }, [payments]);

  const renderStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          PAID
        </span>
      );
    }
    if (s === 'DEBT' || s === 'PARTIAL') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
        {s || 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ── 1. Hero Welcome Banner ────────────────────────────────────────────── */}
      <div className="relative bg-garden-dark rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden border border-garden-lime/20">
        {/* Abstract background graphics */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 pointer-events-none">
          <LayoutDashboard className="w-64 h-64 text-garden-lime" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              Kusoo Dhawaada GardenShoes Hub, {user?.username || 'Maamule'}
            </h1>
            <p className="text-garden-lime/80 font-medium text-sm sm:text-base max-w-2xl">
              Halkan waa xudunta maamulka alaabta, macaamiisha, iyo falanqaynta iibka dukaanka ee maanta. Sida wax u socdaan toos ula soco.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-inner">
            <div className="p-2 bg-garden-lime rounded-lg">
              <User className="w-5 h-5 text-garden-dark" />
            </div>
            <div>
              <p className="text-xs font-bold text-white/70 tracking-widest uppercase">ID: #{user?.user_id || 1}</p>
              <p className="text-sm font-black text-white">{user?.role || 'ADMIN'}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-garden-lime border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold">Xogta Dashboard-ka ayaa la isku keenayaa...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── 2. Core Statistical Counters ──────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:scale-[1.02] transition-transform group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wadarta Iibka</p>
                  <p className="text-3xl font-black text-slate-800">{orders.length}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:scale-[1.02] transition-transform group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dakhliga Guud</p>
                  <p className="text-3xl font-black text-garden-dark">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-garden-lime/20 text-garden-dark rounded-xl group-hover:bg-garden-lime transition-colors">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:scale-[1.02] transition-transform group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Kabaha Kaydka</p>
                  <p className="text-3xl font-black text-slate-800">{shoes.length}</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:scale-[1.02] transition-transform group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Deymaha Sugi Taal</p>
                  <p className="text-3xl font-black text-red-600">{debtOrdersCount}</p>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* ── 3. Recent Orders Ledger ─────────────────────────────────────── */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-garden-dark" />
                  <h3 className="font-extrabold text-slate-800 text-lg">Dhaqdhaqaaqa Ugu Dambeeyay</h3>
                </div>
                <Link to="/orders" className="text-xs font-bold text-garden-dark hover:underline flex items-center gap-1">
                  Arag Dhamaantood <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white text-slate-400 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Macaamiilka</th>
                      <th className="px-6 py-4">Alaabta</th>
                      <th className="px-6 py-4 text-right">Wadarta</th>
                      <th className="px-6 py-4">Xaaladda</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-bold">
                          Xogta iibka majirto.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr key={order.o_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-black text-slate-800">#{order.o_id}</td>
                          <td className="px-6 py-4 font-bold text-slate-600">{order.customer?.cus_name || '-'}</td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{order.shoe?.shoe_name || 'Kabo'}</p>
                            <p className="text-xs text-slate-400">{order.shoe?.shoe_brand}</p>
                          </td>
                          <td className="px-6 py-4 font-black text-garden-dark text-right">
                            ${toNumber(order.total_price).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            {renderStatusBadge(order.status)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 4. Visual Revenue Metric Trends ─────────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-garden-dark" />
                <h3 className="font-extrabold text-slate-800 text-lg">Hababka Bixinta Dakhliga</h3>
              </div>
              
              <div className="flex-1 flex flex-col justify-center space-y-6">
                {paymentMethodStats.total === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-bold">
                    Weli lacag lama qaban.
                  </div>
                ) : (
                  <>
                    {/* ZAAD */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-black text-sm text-slate-800">E-Dahab / ZAAD</span>
                        <span className="font-bold text-xs text-slate-500">
                          ${paymentMethodStats.stats['ZAAD'].toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(5, (paymentMethodStats.stats['ZAAD'] / paymentMethodStats.total) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* EVC */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-black text-sm text-slate-800">EVC Plus</span>
                        <span className="font-bold text-xs text-slate-500">
                          ${paymentMethodStats.stats['EVC'].toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(5, (paymentMethodStats.stats['EVC'] / paymentMethodStats.total) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* CASH */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-black text-sm text-slate-800">Kaash (Cash)</span>
                        <span className="font-bold text-xs text-slate-500">
                          ${paymentMethodStats.stats['CASH'].toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-amber-500 h-2.5 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(5, (paymentMethodStats.stats['CASH'] / paymentMethodStats.total) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* BANK */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-black text-sm text-slate-800">Bank / Transfer</span>
                        <span className="font-bold text-xs text-slate-500">
                          ${paymentMethodStats.stats['BANK'].toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-purple-500 h-2.5 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.max(5, (paymentMethodStats.stats['BANK'] / paymentMethodStats.total) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;