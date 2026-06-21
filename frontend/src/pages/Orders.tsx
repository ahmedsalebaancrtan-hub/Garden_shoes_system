import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Receipt, Search, ShoppingCart, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../context/authStore';

// ── Interfaces: field names must match Go json:"" tags exactly ──────────────
export interface Customer {
  cus_id: number;      // json:"cus_id"
  cus_name: string;    // json:"cus_name"
  cus_phone?: string;  // json:"cus_phone"
  cus_address?: string;
  cus_city?: string;
  cus_age?: number;
}

export interface Shoe {
  shoe_id: number;     // json:"shoe_id"
  shoe_name: string;   // json:"shoe_name"
  shoe_brand: string;  // json:"shoe_brand"  ← NOT "brand"
  shoe_type?: string;  // json:"shoe_type"
  price?: number;      // json:"price"
  qty?: number;        // json:"qty"
}

export interface Employee {
  emp_id: number;      // json:"emp_id"
  emp_name: string;    // json:"emp_name"
  emp_email?: string;  // json:"emp_email"
  emp_phone?: string;  // json:"emp_phone"
  job_title?: string;  // json:"job_title"
}

export interface Order {
  o_id: number;                // json:"o_id"
  cus_id?: number;             // json:"cus_id"
  shoe_id?: number;            // json:"shoe_id"
  emp_id?: number;             // json:"emp_id"
  qty: number;                 // json:"qty"
  total_price?: number;        // json:"total_price"
  status?: string;             // json:"status"
  order_date: string;          // json:"order_date"
  // Preloaded relations — omitempty means these may be absent
  customer?: Customer;         // json:"customer,omitempty"
  shoe?: Shoe;                 // json:"shoe,omitempty"
  employee?: Employee;         // json:"employee,omitempty"
}

const PAYMENT_METHODS = ['CASH', 'ZAAD', 'EVC', 'DEYN (DEBT)'];

const toNumber = (value: number | string | undefined | null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const statusBadge = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          PAID
        </span>
      );
    case 'DEBT':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          DEBT
        </span>
      );
    case 'PARTIAL':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          PARTIAL
        </span>
      );
    default:
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">{status || '-'}</span>;
  }
};

const Orders: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const [isPosOpen, setIsPosOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    window.setTimeout(() => setToastMsg(null), 5000);
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
        const username = currentUser.username?.toLowerCase() || '';
        const match = empList.find((employee) => {
          const empName = employee.emp_name?.toLowerCase() || '';
          const empEmail = employee.emp_email?.toLowerCase() || '';
          return empName === username || empEmail.includes(username);
        });

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
  }, [currentUser]);

  const resetPOS = () => {
    setSelectedCustomerId('');
    setSelectedShoeId('');
    setQuantity(1);
    setAmountPaid('');
    setPaymentMethod('CASH');
  };

  const selectedShoe = useMemo(
    () => shoes.find((shoe) => shoe.shoe_id === Number(selectedShoeId)),
    [selectedShoeId, shoes],
  );

  const estimatedTotal = useMemo(
    () => toNumber(selectedShoe?.price) * quantity,
    [selectedShoe, quantity],
  );

  const handleCheckout = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedCustomerId) {
      showToast('error', 'Fadlan dooro macaamiil');
      return;
    }

    if (!selectedShoeId) {
      showToast('error', 'Fadlan dooro kabo');
      return;
    }

    if (!selectedEmployeeId) {
      showToast('error', 'Fadlan dooro shaqaale (Employee)');
      return;
    }

    if (quantity < 1) {
      showToast('error', 'Tirada kabaha waa inay noqotaa ugu yaraan 1');
      return;
    }

    if (selectedShoe && selectedShoe.qty !== undefined && quantity > selectedShoe.qty) {
      showToast('error', `Tirada aad rabto (${quantity}) way ka badan tahay stock-ga (${selectedShoe.qty})`);
      return;
    }

    const typedAmountPaid = amountPaid === '' ? estimatedTotal : Number(amountPaid);
    const effectiveAmountPaid =
      paymentMethod === 'DEYN (DEBT)'
        ? 0
        : Number.isFinite(typedAmountPaid) && typedAmountPaid > 0
          ? typedAmountPaid
          : estimatedTotal;

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

      if (response.data?.is_success === true) {
        showToast('success', 'Iibka si guul leh ayaa loo diwaangeliyey!');
        resetPOS();
        setIsPosOpen(false);
        await fetchAll();
        return;
      }

      showToast('error', response.data?.message || 'Iibka lama kaydin. Fadlan mar kale isku day.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      showToast('error', error.response?.data?.message || error.response?.data?.error || 'Cilad baa dhacday intii la iibinayay');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const search = orderSearch.toLowerCase();
    return (
      (order.customer?.cus_name || '').toLowerCase().includes(search) ||
      (order.shoe?.shoe_name  || '').toLowerCase().includes(search) ||
      (order.shoe?.shoe_brand || '').toLowerCase().includes(search) ||
      (order.employee?.emp_name || '').toLowerCase().includes(search) ||
      String(order.o_id).includes(search)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-2xl font-bold z-[100] border max-w-sm ${
            toastMsg.type === 'success'
              ? 'bg-garden-lime text-garden-dark border-garden-lime/50'
              : 'bg-red-500 text-white border-red-600'
          }`}
        >
          {toastMsg.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-garden-dark" />
            Iibka & Dalabaadka (Orders)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{orders.length} dalab guud</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi dalab, macaamiil..."
              value={orderSearch}
              onChange={(event) => setOrderSearch(event.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              resetPOS();
              setIsPosOpen(true);
            }}
            className="flex items-center gap-2 bg-garden-lime text-garden-dark font-extrabold px-5 py-2.5 rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-garden-lime/20 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Iib Cusub</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Wadarta Dalabaadka', value: orders.length, color: 'bg-garden-dark text-white', sub: 'Iib guud' },
          { label: 'PAID', value: orders.filter((order) => order.status === 'PAID').length, color: 'bg-green-50 text-green-800', sub: 'Lacag bixiyey' },
          { label: 'PARTIAL', value: orders.filter((order) => order.status === 'PARTIAL').length, color: 'bg-amber-50 text-amber-800', sub: 'Qayb bixiyey' },
          { label: 'DEBT', value: orders.filter((order) => order.status === 'DEBT').length, color: 'bg-red-50 text-red-800', sub: 'Deyn' },
        ].map((summary) => (
          <div key={summary.label} className={`${summary.color} rounded-2xl p-4 border border-slate-100`}>
            <p className="text-3xl font-black">{summary.value}</p>
            <p className="text-xs font-bold opacity-70 mt-1">{summary.label}</p>
            <p className="text-xs opacity-50">{summary.sub}</p>
          </div>
        ))}
      </div>

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
                      <div className="w-6 h-6 border-2 border-garden-dark border-t-transparent rounded-full animate-spin" />
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
                filteredOrders.map((order) => {
                  // ── Resolve related records by FK id from the already-fetched lists.
                  // This is guaranteed-correct: the frontend fetched /customers/, /shoes/,
                  // /employees/ independently, so we just match by id.
                  // The GORM preload is kept as a fallback for any edge-case gap.
                  const resolvedCustomer =
                    customers.find((c) => c.cus_id === order.cus_id) ?? order.customer;
                  const resolvedShoe =
                    shoes.find((s) => s.shoe_id === order.shoe_id) ?? order.shoe;
                  const resolvedEmployee =
                    employees.find((e) => e.emp_id === order.emp_id) ?? order.employee;

                  return (
                    <tr key={order.o_id} className="hover:bg-slate-50/50 transition-colors">

                      {/* Order ID */}
                      <td className="px-6 py-4 font-black text-garden-dark">#{order.o_id}</td>

                      {/* Macaamiilka */}
                      <td className="px-6 py-4 font-extrabold text-slate-800">
                        {resolvedCustomer?.cus_name ? (
                          <Link
                            to="/customers"
                            className="hover:text-garden-lime hover:underline transition-colors"
                          >
                            {resolvedCustomer.cus_name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Kabo */}
                      <td className="px-6 py-4">
                        {resolvedShoe?.shoe_name ? (
                          <Link to="/shoes" className="block hover:opacity-80 transition-opacity">
                            <p className="font-bold text-slate-800 hover:text-garden-lime hover:underline">
                              {resolvedShoe.shoe_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {resolvedShoe.shoe_brand || ''}
                            </p>
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Shaqaalaha */}
                      <td className="px-6 py-4 font-medium text-slate-600">
                        {resolvedEmployee?.emp_name ? (
                          <Link
                            to="/employees"
                            className="hover:text-garden-lime hover:underline transition-colors"
                          >
                            {resolvedEmployee.emp_name}
                          </Link>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Qty */}
                      <td className="px-6 py-4 font-bold text-slate-700">{order.qty}</td>

                      {/* Qiimaha Guud */}
                      <td className="px-6 py-4 font-extrabold text-garden-dark">
                        ${toNumber(order.total_price).toFixed(2)}
                      </td>

                      {/* Xaalada */}
                      <td className="px-6 py-4">{statusBadge(order.status || 'PAID')}</td>

                      {/* Taariikhda */}
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {order.order_date
                          ? new Date(order.order_date).toLocaleString('en-GB')
                          : '-'}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isPosOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 bg-garden-dark text-white">
              <h2 className="text-xl font-black flex items-center gap-2">
                <ShoppingCart className="w-6 h-6 text-garden-lime" />
                Abuur Iib Cusub
              </h2>
              <button
                type="button"
                onClick={() => setIsPosOpen(false)}
                disabled={submitting}
                className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all disabled:opacity-50"
                aria-label="Close POS modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Macaamiilka (Customer) *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(event) => setSelectedCustomerId(event.target.value === '' ? '' : Number(event.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                >
                  <option value="" disabled>
                    -- Dooro Macaamiil --
                  </option>
                  {customers.map((customer) => (
                    <option key={customer.cus_id} value={customer.cus_id}>
                      {customer.cus_name} {customer.cus_phone ? `- ${customer.cus_phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Shaqaalaha (Employee) *</label>
                <select
                  value={selectedEmployeeId}
                  onChange={(event) => setSelectedEmployeeId(event.target.value === '' ? '' : Number(event.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                >
                  <option value="" disabled>
                    -- Dooro Shaqaale --
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.emp_id} value={employee.emp_id}>
                      {employee.emp_name} - {employee.job_title || 'Cashier'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Kabo (Shoe) *</label>
                <select
                  value={selectedShoeId}
                  onChange={(event) => setSelectedShoeId(event.target.value === '' ? '' : Number(event.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                >
                  <option value="" disabled>
                    -- Dooro Kabo --
                  </option>
                  {shoes
                    .filter((shoe) => (shoe.qty || 0) > 0)
                    .map((shoe) => (
                      <option key={shoe.shoe_id} value={shoe.shoe_id}>
                        {shoe.shoe_name} ({shoe.shoe_brand}) - ${toNumber(shoe.price).toFixed(2)} - Stock: {shoe.qty}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Tirada (Qty) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedShoe?.qty || 999}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Qaabka Lacag-bixinta *</label>
                <select
                  value={paymentMethod}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPaymentMethod(value);
                    setAmountPaid(value === 'DEYN (DEBT)' ? 0 : '');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

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
                    onChange={(event) => setAmountPaid(event.target.value === '' ? '' : Number(event.target.value))}
                    placeholder={estimatedTotal > 0 ? estimatedTotal.toFixed(2) : '0.00'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedCustomerId || !selectedShoeId || !selectedEmployeeId}
                className="w-full py-3.5 mt-2 bg-garden-lime text-garden-dark font-black rounded-xl shadow-lg shadow-garden-lime/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-garden-dark border-t-transparent rounded-full animate-spin" />
                    <span>Waa La Kaydinayaa...</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-5 h-5" />
                    <span>Abuur Iib {estimatedTotal > 0 ? `- $${estimatedTotal.toFixed(2)}` : ''}</span>
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
