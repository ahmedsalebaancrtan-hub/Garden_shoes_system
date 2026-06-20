import React, { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, Plus, Search, Receipt, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../context/authStore';

export interface Customer { 
  cus_id: number; 
  cus_name: string; 
  cus_phone?: string; 
}

export interface Shoe { 
  shoe_id: number; 
  shoe_name: string; 
  shoe_brand: string; 
  price?: number; 
  qty?: number; 
}

export interface Employee { 
  emp_id: number; 
  emp_name: string; 
  emp_email?: string; 
  job_title?: string;
}

export interface Order {
  o_id: number;
  qty: number;
  order_date: string;
  total_price?: number;
  status?: string;
  customer?: Customer;
  shoe?: Shoe;
  employee?: Employee;
}

const PAYMENT_METHODS = ['CASH', 'ZAAD', 'EVC', 'DEYN (DEBT)'];

const statusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>PAID
        </span>
      );
    case 'DEBT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>DEBT
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>PARTIAL
        </span>
      );
    default:
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{status || '—'}</span>;
  }
};

const Orders: React.FC = () => {
  const currentUser = useAuthStore(state => state.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // POS Modal
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // POS Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedShoeId, setSelectedShoeId] = useState<number | ''>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderSearch, setOrderSearch] = useState('');

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, customersRes, shoesRes, employeesRes] = await Promise.all([
        axiosClient.get('/orders/'),
        axiosClient.get('/customers/'),
        axiosClient.get('/shoes/'),
        axiosClient.get('/employees/'),
      ]);
      
      setOrders(ordersRes.data.data || []);
      setCustomers(customersRes.data.data || []);
      setShoes(shoesRes.data.data || []);

      const empList: Employee[] = employeesRes.data.data || [];
      setEmployees(empList);
      if (currentUser) {
        const match = empList.find(
          e =>
            e.emp_name?.toLowerCase() === currentUser.username?.toLowerCase() ||
            e.emp_email?.toLowerCase().includes(currentUser.username?.toLowerCase() || '')
        );

        if (match) {
          setSelectedEmployeeId(match.emp_id);
        } else if (currentUser.role === 'ADMIN' && empList.length > 0) {
          setSelectedEmployeeId(empList[0].emp_id);
        } else {
          setSelectedEmployeeId('');
        }
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Cilad baa dhacday marka xogta la soo shubayay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [currentUser]); // Added currentUser to dependency array safely

  const resetPOS = () => {
    setSelectedCustomerId('');
    setSelectedShoeId('');
    setQuantity(1);
    setAmountPaid('');
    setPaymentMethod('CASH');
  };

  // Helper to get selected shoe price and calculate total
  const selectedShoe = useMemo(() => shoes.find(s => s.shoe_id === Number(selectedShoeId)), [selectedShoeId, shoes]);
  const estimatedTotal = useMemo(() => (selectedShoe?.price || 0) * quantity, [selectedShoe, quantity]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) { showToast('error', 'Fadlan dooro macaamiil'); return; }
    if (!selectedShoeId) { showToast('error', 'Fadlan dooro kabo'); return; }
    if (!selectedEmployeeId) { showToast('error', 'Fadlan dooro shaqaale (Employee)'); return; }
    if (quantity < 1) { showToast('error', 'Tirada kabaha waa inay noqotaa ugu yaraan 1'); return; }
    if (selectedShoe && selectedShoe.qty !== undefined && quantity > selectedShoe.qty) {
      showToast('error', `Tirada aad rabto (${quantity}) way ka badan tahay stock-ga (${selectedShoe.qty})`); return;
    }

    const effectiveAmountPaid = paymentMethod === 'DEYN (DEBT)' ? 0 : (amountPaid === '' ? estimatedTotal : Number(amountPaid));

    setSubmitting(true);
    try {
      const payload = {
        cus_id: Number(selectedCustomerId),
        shoe_id: Number(selectedShoeId),
        emp_id: Number(selectedEmployeeId),
        qty: Number(quantity),
        amount_paid: Number(effectiveAmountPaid),
        payment_method: paymentMethod === 'DEYN (DEBT)' ? 'DEYN' : paymentMethod,
      };

      const response = await axiosClient.post('/orders/create', payload);
      const createdOrder = response.data.data as Order;

      showToast('success', 'Iibka si guul leh ayaa loo diwaangeliyey! ✅');
      setOrders(prev => [createdOrder, ...prev]);
      
      // Update local shoe qty
      setShoes(prev => prev.map(shoe => 
        shoe.shoe_id === Number(selectedShoeId) 
          ? { ...shoe, qty: (shoe.qty || 0) - quantity } 
          : shoe
      ));

      resetPOS();
      setIsPosOpen(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string, error?: string } } };
      showToast('error', error.response?.data?.message || error.response?.data?.error || 'Cilad baa dhacday intii la iibinayay');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(o =>
    (o.customer?.cus_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.shoe?.shoe_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.employee?.emp_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    String(o.o_id).includes(orderSearch)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-2xl font-bold z-[100] border max-w-sm ${toastMsg.type === 'success' ? 'bg-garden-lime text-garden-dark border-garden-lime/50' : 'bg-red-500 text-white border-red-600'}`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-garden-dark" />
            Iibka & Dalabaadka (Orders)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {orders.length} dalab guud
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi dalab, macaamiil..."
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition-all"
            />
          </div>
          <button
            onClick={() => { resetPOS(); setIsPosOpen(true); }}
            className="flex items-center gap-2 bg-garden-lime text-garden-dark font-extrabold px-5 py-2.5 rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-garden-lime/20 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Iib Cusub</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Wadarta Dalabaadka', value: orders.length, color: 'bg-garden-dark text-white', sub: 'Iib guud' },
          { label: 'PAID', value: orders.filter(o => o.status === 'PAID').length, color: 'bg-green-50 text-green-800', sub: 'Lacag bixiyey' },
          { label: 'PARTIAL', value: orders.filter(o => o.status === 'PARTIAL').length, color: 'bg-amber-50 text-amber-800', sub: 'Qayb bixiyey' },
          { label: 'DEBT', value: orders.filter(o => o.status === 'DEBT').length, color: 'bg-red-50 text-red-800', sub: 'Deyn' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4 border border-slate-100`}>
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs font-bold opacity-70 mt-1">{s.label}</p>
            <p className="text-xs opacity-50">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Macaamiilka</th>
                <th className="px-6 py-4">Kabo</th>
                <th className="px-6 py-4">Shaqaalaha</th>
                <th className="px-6 py-4">Qty</th>
                <th className="px-6 py-4">Qiimaha Guud</th>
                <th className="px-6 py-4">Xaalada</th>
                <th className="px-6 py-4">Taariikhda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-500 font-bold">Xogta baa soo socota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">
                    Wax dalab ah lagama helin nidaamka.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(row => (
                  <tr key={row.o_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-garden-dark">#{row.o_id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">
                      {row.customer ? (
                        <Link to="/customers" className="hover:text-garden-lime hover:underline transition-colors">
                          {row.customer.cus_name || '—'}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {row.shoe ? (
                        <Link to="/shoes" className="block hover:opacity-80 transition-opacity">
                          <p className="font-bold text-slate-800 hover:text-garden-lime hover:underline">{row.shoe.shoe_name || '—'}</p>
                          <p className="text-xs text-slate-400">{row.shoe.shoe_brand}</p>
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {row.employee ? (
                        <Link to="/employees" className="hover:text-garden-lime hover:underline transition-colors">
                          {row.employee.emp_name || '—'}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">{row.qty}</td>
                    <td className="px-6 py-4 font-extrabold text-garden-dark">${(row.total_price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4">{statusBadge(row.status || 'PAID')}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                      {row.order_date ? new Date(row.order_date).toLocaleString('en-GB') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POS Modal */}
      {isPosOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 bg-garden-dark text-white">
              <h2 className="text-xl font-black flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-garden-lime" />
                Abuur Iib Cusub
              </h2>
              <button 
                type="button"
                onClick={() => setIsPosOpen(false)} 
                disabled={submitting} 
                className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              {/* Customer Dropdown */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Macaamiilka (Customer) *</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                >
                  <option value="" disabled>-- Dooro Macaamiil --</option>
                  {customers.map(c => (
                    <option key={c.cus_id} value={c.cus_id}>{c.cus_name} {c.cus_phone ? `- ${c.cus_phone}` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Shoe Dropdown */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Kabo (Shoe) *</label>
                <select
                  value={selectedShoeId}
                  onChange={e => setSelectedShoeId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                >
                  <option value="" disabled>-- Dooro Kabo --</option>
                  {shoes.filter(s => (s.qty || 0) > 0).map(s => (
                    <option key={s.shoe_id} value={s.shoe_id}>
                      {s.shoe_name} ({s.shoe_brand}) - ${s.price?.toFixed(2)} - Stock: {s.qty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Dropdown */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Shaqaalaha (Employee) *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                >
                  <option value="" disabled>-- Dooro Shaqaale --</option>
                  {employees.map(e => (
                    <option key={e.emp_id} value={e.emp_id}>{e.emp_name} - {e.job_title || 'Cashier'}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Tirada (Qty) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedShoe?.qty || 999}
                  value={quantity}
                  onChange={e => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Qaabka Lacag-bixinta *</label>
                <select
                  value={paymentMethod}
                  onChange={e => {
                    const val = e.target.value;
                    setPaymentMethod(val);
                    if (val === 'DEYN (DEBT)') setAmountPaid(0);
                    else setAmountPaid('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                >
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* Amount Paid */}
              {paymentMethod !== 'DEYN (DEBT)' && (
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                    Lacagta La Bixiyey ($)
                    {selectedShoe && <span className="ml-2 text-garden-dark font-black">(Qiimaha Guud: ${estimatedTotal.toFixed(2)})</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={estimatedTotal > 0 ? estimatedTotal.toFixed(2) : '0.00'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !selectedCustomerId || !selectedShoeId || !selectedEmployeeId}
                className="w-full py-3.5 mt-2 bg-garden-lime text-garden-dark font-black rounded-xl shadow-lg shadow-garden-lime/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                    <span>Waa La Kaydinayaa...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-5 h-5" />
                    <span>Abuur Iib {estimatedTotal > 0 ? `— $${estimatedTotal.toFixed(2)}` : ''}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;