import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calendar, Award, ShoppingBag, Wallet } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { type Order } from './Orders';
import { type Payment } from './Payments';

const toNumber = (value: number | string | undefined | null): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const Reports: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  // Date Range Filter State
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchAll = async () => {
    setLoading(true);

    try {
      const ordersRes = await axiosClient.get('/orders/');
      console.log('[Reports] GET /orders/ raw response:', ordersRes.data);
      const ordersData = ordersRes.data?.data;
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        console.log(`[Reports] Successfully loaded ${ordersData.length} order records`);
      } else {
        console.warn('[Reports] /orders/ returned non-array .data:', ordersData);
        setOrders([]);
      }
    } catch (ordErr: unknown) {
      console.error('[Reports] Failed to fetch /orders/:', ordErr);
      setOrders([]);
    }

    try {
      const paymentsRes = await axiosClient.get('/payments/');
      console.log('[Reports] GET /payments/ raw response:', paymentsRes.data);
      const paymentsData = paymentsRes.data?.data;
      if (Array.isArray(paymentsData)) {
        setPayments(paymentsData);
        console.log(`[Reports] Successfully loaded ${paymentsData.length} payment records`);
      } else {
        console.warn('[Reports] /payments/ returned non-array .data:', paymentsData);
        setPayments([]);
      }
    } catch (payErr: unknown) {
      console.error('[Reports] Failed to fetch /payments/:', payErr);
      setPayments([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Filter Data by Date Range
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!startDate && !endDate) return true;
      const orderDate = new Date(order.order_date).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      return orderDate >= start && orderDate <= end;
    });
  }, [orders, startDate, endDate]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (!startDate && !endDate) return true;
      const paymentDate = new Date(payment.payment_date).getTime();
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      return paymentDate >= start && paymentDate <= end;
    });
  }, [payments, startDate, endDate]);

  // Core Financial Analytics
  const totalGrossRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + toNumber(order.total_price), 0);
  }, [filteredOrders]);

  const totalCashCollected = useMemo(() => {
    return filteredPayments.reduce((sum, payment) => sum + toNumber(payment.amount_paid), 0);
  }, [filteredPayments]);

  const outstandingDebt = useMemo(() => {
    // Alternatively, this can be calculated as totalGrossRevenue - totalCashCollected
    return filteredOrders
      .filter((o) => o.status === 'DEBT' || o.status === 'PARTIAL')
      .reduce((sum, order) => {
        const paidForOrder = filteredPayments
          .filter((p) => p.order_id === order.o_id)
          .reduce((pSum, p) => pSum + toNumber(p.amount_paid), 0);
        return sum + (toNumber(order.total_price) - paidForOrder);
      }, 0);
  }, [filteredOrders, filteredPayments]);

  const averageOrderValue = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    return totalGrossRevenue / filteredOrders.length;
  }, [totalGrossRevenue, filteredOrders]);

  // Table A: Top Selling Shoes
  const topSellingShoes = useMemo(() => {
    const shoeStats: Record<string, { name: string; qty: number; revenue: number }> = {};

    filteredOrders.forEach((order) => {
      const shoeName = order.shoe?.shoe_name || `Shoe #${order.shoe_id}`;
      if (!shoeStats[shoeName]) {
        shoeStats[shoeName] = { name: shoeName, qty: 0, revenue: 0 };
      }
      shoeStats[shoeName].qty += toNumber(order.qty);
      shoeStats[shoeName].revenue += toNumber(order.total_price);
    });

    return Object.values(shoeStats).sort((a, b) => b.qty - a.qty);
  }, [filteredOrders]);

  // Table B: Employee Performance
  const employeePerformance = useMemo(() => {
    const empStats: Record<string, { name: string; salesCount: number; revenue: number }> = {};

    filteredOrders.forEach((order) => {
      const empName = order.employee?.emp_name || `Employee #${order.emp_id}`;
      if (!empStats[empName]) {
        empStats[empName] = { name: empName, salesCount: 0, revenue: 0 };
      }
      empStats[empName].salesCount += 1;
      empStats[empName].revenue += toNumber(order.total_price);
    });

    return Object.values(empStats).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-garden-dark" />
            Warbixinaha & Falanqaynta (Analytics)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Korjoogtee waxqabadka dukaanka iyo iibka shaqaalaha
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 w-full sm:w-auto">
            <Calendar className="w-5 h-5 text-slate-400 ml-2" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:outline-none focus:ring-0"
            />
            <span className="text-slate-400 font-bold px-1"> - </span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 focus:outline-none focus:ring-0"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-bold text-slate-500 hover:text-red-500 transition-colors whitespace-nowrap"
            >
              Nadiifi Taariikhda
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-garden-lime border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold">Xogta warbixinta baa la diyaarinayaa...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-garden-dark text-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <TrendingUp className="w-24 h-24" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-bold opacity-70 mb-1">Wadarta Iibka (Gross Sales)</p>
                <p className="text-3xl font-black">${totalGrossRevenue.toFixed(2)}</p>
                <p className="text-xs font-medium opacity-60 mt-2">{filteredOrders.length} dalabaad ah</p>
              </div>
            </div>

            <div className="bg-white text-slate-800 rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Lacagta Soo Gashay</p>
                  <p className="text-3xl font-black text-green-600">${totalCashCollected.toFixed(2)}</p>
                  <p className="text-xs font-medium text-slate-400 mt-2">{filteredPayments.length} lacag bixin</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-800 rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Deynta Sugi Taal (Unpaid)</p>
                  <p className="text-3xl font-black text-amber-600">${outstandingDebt.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Wallet className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white text-slate-800 rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-500 mb-1">Celceliska Dalabka (AOV)</p>
                  <p className="text-3xl font-black">${averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table A: Top Selling Shoes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <ShoppingBag className="w-5 h-5 text-garden-dark" />
                <h3 className="font-extrabold text-slate-800">Alaabta Ugu Iibka Badan</h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Kabo (Shoe Name)</th>
                      <th className="px-5 py-3 text-center">Xabo Iibsamay</th>
                      <th className="px-5 py-3 text-right">Wadarta Dakhliga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topSellingShoes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-slate-400 font-bold">
                          Xogta iibka majirto mudadan.
                        </td>
                      </tr>
                    ) : (
                      topSellingShoes.map((shoe, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-700">{shoe.name}</td>
                          <td className="px-5 py-3 font-black text-center text-slate-600">
                            <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">{shoe.qty}</span>
                          </td>
                          <td className="px-5 py-3 font-black text-right text-garden-dark">
                            ${shoe.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table B: Employee Sales Leaderboard */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                <Award className="w-5 h-5 text-garden-dark" />
                <h3 className="font-extrabold text-slate-800">Dhaqdhaqaaqa Shaqaalaha</h3>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Shaqaalaha</th>
                      <th className="px-5 py-3 text-center">Tirada Iibka</th>
                      <th className="px-5 py-3 text-right">Wadarta Lacagta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employeePerformance.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-slate-400 font-bold">
                          Xogta iibka majirto mudadan.
                        </td>
                      </tr>
                    ) : (
                      employeePerformance.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3 font-bold text-slate-700 flex items-center gap-2">
                            {idx === 0 && <Award className="w-4 h-4 text-amber-500" />}
                            {emp.name}
                          </td>
                          <td className="px-5 py-3 font-black text-center text-slate-600">
                            <span className="bg-slate-100 px-2.5 py-0.5 rounded-md">{emp.salesCount}</span>
                          </td>
                          <td className="px-5 py-3 font-black text-right text-garden-dark">
                            ${emp.revenue.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
