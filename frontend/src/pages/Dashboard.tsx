import React, { useEffect, useMemo, useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, DollarSign, Layers, AlertCircle, 
  ArrowRight, User, TrendingUp, Clock, AlertOctagon
} from 'lucide-react';
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

  // ── CORE COMPUTATIONS ──────────────────────────────────────────────────────
  const totalRevenue = useMemo(() => {
    return payments.reduce((sum, p) => sum + toNumber(p.amount_paid), 0);
  }, [payments]);

  const debtOrdersCount = useMemo(() => {
    return orders.filter(o => o.status === 'DEBT' || o.status === 'PARTIAL').length;
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders].sort((a, b) => b.o_id - a.o_id).slice(0, 5);
  }, [orders]);

  // ── ADVANCED INVENTORY ALERTS ──────────────────────────────────────────────
  const lowStockShoes = useMemo(() => {
    return shoes.filter(s => toNumber(s.qty) < 5).sort((a, b) => toNumber(a.qty) - toNumber(b.qty));
  }, [shoes]);

  // ── TODAY'S SALES & TIME-BASED TRENDS ────────────────────────────────────
  const { todaySalesTotal, averageBasketSize, hourlyData } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const todayOrders = orders.filter(o => o.order_date && o.order_date.startsWith(todayStr));
    const total = todayOrders.reduce((sum, o) => sum + toNumber(o.total_price), 0);
    const avg = todayOrders.length > 0 ? total / todayOrders.length : 0;

    // Build hourly map
    const hoursMap = new Array(24).fill(0);
    todayOrders.forEach(o => {
      const date = new Date(o.order_date);
      const hour = date.getHours();
      hoursMap[hour] += toNumber(o.total_price);
    });

    // Simplify to active retail hours (e.g., 6 AM to 10 PM)
    const activeHours = hoursMap.slice(6, 23); // 17 data points
    return { todaySalesTotal: total, averageBasketSize: avg, hourlyData: activeHours, todayCount: todayOrders.length };
  }, [orders]);

  // Generate Native SVG Path for Line Chart
  const svgLinePath = useMemo(() => {
    if (hourlyData.length === 0) return '';
    const maxVal = Math.max(...hourlyData, 1);
    const width = 1000;
    const height = 150;
    
    let d = `M 0,${height} `;
    
    hourlyData.forEach((val, idx) => {
      const x = (idx / (hourlyData.length - 1)) * width;
      const y = height - (val / maxVal) * (height - 20); // 20px padding top
      if (idx === 0) {
        d += `L ${x},${y} `;
      } else {
        // Smooth curve
        const prevX = ((idx - 1) / (hourlyData.length - 1)) * width;
        const prevY = height - (hourlyData[idx - 1] / maxVal) * (height - 20);
        const cp1x = prevX + (x - prevX) / 2;
        d += `C ${cp1x},${prevY} ${cp1x},${y} ${x},${y} `;
      }
    });
    
    d += `L ${width},${height} Z`;
    return d;
  }, [hourlyData]);

  // ── PAYMENT METHODS DONUT CHART ──────────────────────────────────────────
  const { paymentTotal, donutSegments } = useMemo(() => {
    const stats: Record<string, number> = { ZAAD: 0, CASH: 0, EVC: 0, BANK: 0 };
    let total = 0;
    
    payments.forEach(p => {
      const method = (p.payment_method || 'CASH').toUpperCase();
      if (stats[method] !== undefined) {
        stats[method] += toNumber(p.amount_paid);
      } else {
        stats['CASH'] += toNumber(p.amount_paid);
      }
      total += toNumber(p.amount_paid);
    });

    // Calculate native SVG donut slices
    const r = 40;
    const circumference = 2 * Math.PI * r;
    let currentOffset = 0;
    
    const colors: Record<string, string> = {
      ZAAD: '#3b82f6', // blue-500
      EVC: '#10b981',  // emerald-500
      CASH: '#f59e0b', // amber-500
      BANK: '#a855f7'  // purple-500
    };

    const segments = Object.keys(stats).map(key => {
      const value = stats[key];
      const percentage = total > 0 ? value / total : 0;
      const strokeDasharray = `${percentage * circumference} ${circumference}`;
      const strokeDashoffset = -currentOffset;
      currentOffset += percentage * circumference;
      
      return {
        key,
        value,
        color: colors[key],
        strokeDasharray,
        strokeDashoffset,
        percentage
      };
    }).filter(s => s.value > 0);

    return { paymentTotal: total, donutSegments: segments };
  }, [payments]);

  const renderStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
          PAID
        </span>
      );
    }
    if (s === 'DEBT' || s === 'PARTIAL') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
        {s || 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* ── 1. Hero Welcome Banner ────────────────────────────────────────────── */}
      <div className="relative bg-garden-dark rounded-3xl p-8 sm:p-10 shadow-xl overflow-hidden border border-garden-lime/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 pointer-events-none">
          <LayoutDashboard className="w-64 h-64 text-garden-lime" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-white space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              Kusoo Dhawaada Golden Shoes Hub, {user?.username || 'Maamule'}
            </h1>
            <p className="text-garden-lime/80 font-medium text-sm sm:text-base max-w-2xl">
              Halkan waa xudunta maamulka alaabta, macaamiisha, iyo falanqaynta iibka dukaanka ee maanta.
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Wadarta Iibka Guud</p>
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

          {/* ── 3. Today's Sales & Time-Based Trends ──────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-garden-dark" />
                  Dhaqdhaqaaqa Maanta (Today's Sales Tracker)
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Xogta iibka ee maanta oo toos uga imanaysa nidaamka.
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Iibka Maanta</p>
                  <p className="text-2xl font-black text-garden-dark">${todaySalesTotal.toFixed(2)}</p>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Celceliska Dalabka</p>
                  <p className="text-2xl font-black text-slate-700">${averageBasketSize.toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            {/* Native SVG Area Chart */}
            <div className="relative w-full h-48 bg-slate-50/50 pt-6 px-4">
              {todaySalesTotal === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold text-sm flex-col gap-2">
                  <Clock className="w-8 h-8 opacity-50" />
                  Weli wax iib ah ma dhicin maanta.
                </div>
              ) : (
                <>
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a3e635" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#a3e635" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="1000" y2="50" stroke="#e2e8f0" strokeDasharray="4 4" />
                    <line x1="0" y1="100" x2="1000" y2="100" stroke="#e2e8f0" strokeDasharray="4 4" />
                    
                    {/* Area path */}
                    <path d={svgLinePath} fill="url(#chartGradient)" />
                    {/* Stroke path (same as Area but without closing and filling) */}
                    <path 
                      d={svgLinePath.replace(/L 1000,150 Z$/, '')} 
                      fill="none" 
                      stroke="#4d7c0f" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="drop-shadow-sm"
                    />
                  </svg>
                  <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>6 AM</span>
                    <span>12 PM</span>
                    <span>6 PM</span>
                    <span>10 PM</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── 4. 3-Column Grid Layout ───────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Column 1: Recent Orders (60% ~ col-span-7) */}
            <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
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
                  <thead className="bg-white text-slate-400 font-bold border-b border-slate-100 text-[11px] uppercase tracking-wider">
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
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold">
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
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{order.shoe?.shoe_brand}</p>
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

            {/* Column 2: Payment Analytics & Inventory Alerts (40% ~ col-span-5) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Payment Donut & Bars */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <DollarSign className="w-5 h-5 text-garden-dark" />
                  <h3 className="font-extrabold text-slate-800 text-lg">Hababka Bixinta Dakhliga</h3>
                </div>
                
                {paymentTotal === 0 ? (
                  <div className="flex-1 flex items-center justify-center py-10 text-slate-400 font-bold">
                    Weli lacag lama qaban.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    {/* Native SVG Donut Chart */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90 transform">
                        {/* Background track */}
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                        {donutSegments.map((seg, idx) => (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="16"
                            strokeDasharray={seg.strokeDasharray}
                            strokeDashoffset={seg.strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                          />
                        ))}
                      </svg>
                      {/* Inner Donut Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                        <span className="text-sm font-black text-slate-800">${paymentTotal.toFixed(0)}</span>
                      </div>
                    </div>

                    {/* CSS Progress Bars */}
                    <div className="flex-1 w-full space-y-4">
                      {donutSegments.map(seg => (
                        <div key={seg.key} className="space-y-1.5">
                          <div className="flex justify-between items-end">
                            <span className="font-black text-xs text-slate-800">{seg.key === 'EVC' ? 'EVC Plus' : seg.key === 'ZAAD' ? 'E-Dahab / ZAAD' : seg.key}</span>
                            <span className="font-bold text-[10px] text-slate-500">
                              {(seg.percentage * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000"
                              style={{ width: `${Math.max(5, seg.percentage * 100)}%`, backgroundColor: seg.color }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Inventory Alerts */}
              <div className="bg-red-50/50 rounded-2xl shadow-sm border border-red-100 p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <AlertOctagon className="w-5 h-5 text-red-600" />
                  <h3 className="font-extrabold text-red-900 text-lg">Halaag Kayd (Low Stock)</h3>
                </div>
                {lowStockShoes.length === 0 ? (
                  <p className="text-sm font-bold text-red-400/80 bg-red-100/50 p-3 rounded-xl border border-red-100">
                    Dhammaan kabaha kaydkoodu wuu wacan yahay.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lowStockShoes.slice(0, 4).map(shoe => (
                      <div key={shoe.shoe_id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{shoe.shoe_name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{shoe.shoe_brand}</p>
                          </div>
                        </div>
                        <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-lg text-xs font-black border border-red-200">
                          {shoe.qty} xabo harsan
                        </span>
                      </div>
                    ))}
                    {lowStockShoes.length > 4 && (
                      <Link to="/shoes" className="block text-center text-xs font-bold text-red-600 hover:text-red-700 hover:underline pt-2">
                        Arag {lowStockShoes.length - 4} kaloo harsan...
                      </Link>
                    )}
                  </div>
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
