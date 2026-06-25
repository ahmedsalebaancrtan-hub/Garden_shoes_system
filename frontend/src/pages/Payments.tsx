import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Plus, Search, X, Receipt, DollarSign, Wallet } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { type Order } from './Orders';

// ── Interfaces ──────────────────────────────────────────────────────────────
export interface Payment {
  pay_id: number;
  order_id: number;
  cus_id?: number;
  shoe_id?: number;
  qty?: number;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  order?: {
    o_id: number;
    total_price: number;
    status: string;
    customer?: {
      cus_id?: number;
      cus_name: string;
    };
  };
  customer?: {
    cus_id?: number;
    cus_name: string;
  };
}

const PAYMENT_METHODS = ['CASH', 'ZAAD', 'EVC', 'BANK'];

const toNumber = (value: number | string | undefined | null): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// ── Component ───────────────────────────────────────────────────────────────
const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedOrderId, setSelectedOrderId] = useState<number | ''>('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Search & Toast
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    window.setTimeout(() => setToastMsg(null), 5000);
  };

  // ── ROBUST INDEPENDENT FETCH ──────────────────────────────────────────────
  // Each endpoint is fetched independently so one failure does NOT block the other.
  // Every response is deeply inspected before committing to state.
  const fetchAll = async () => {
    setLoading(true);

    // ── 1. Fetch Payments independently ─────────────────────────────────
    try {
      const paymentsRes = await axiosClient.get('/payments/');
      console.log('[Payments] GET /payments/ raw response:', paymentsRes.data);

      const paymentsData = paymentsRes.data?.data;
      if (Array.isArray(paymentsData)) {
        setPayments(paymentsData);
        console.log(`[Payments] Successfully loaded ${paymentsData.length} payment records`);
      } else {
        console.warn('[Payments] /payments/ returned non-array .data:', paymentsData);
        setPayments([]);
      }
    } catch (payErr: unknown) {
      console.error('[Payments] Failed to fetch /payments/:', payErr);
      setPayments([]);
      // Do NOT show a toast here — we still want orders to load fine
    }

    // ── 2. Fetch Orders independently ───────────────────────────────────
    try {
      const ordersRes = await axiosClient.get('/orders/');
      console.log('[Payments] GET /orders/ raw response:', ordersRes.data);

      const ordersData = ordersRes.data?.data;
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
        console.log(`[Payments] Successfully loaded ${ordersData.length} order records`);
      } else {
        console.warn('[Payments] /orders/ returned non-array .data:', ordersData);
        setOrders([]);
      }
    } catch (ordErr: unknown) {
      console.error('[Payments] Failed to fetch /orders/:', ordErr);
      setOrders([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ── Derived Data ──────────────────────────────────────────────────────────
  const debtOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'DEBT' || o.status === 'PARTIAL'
    );
  }, [orders]);

  const selectedOrderDetails = useMemo(() => {
    if (!selectedOrderId) return null;
    return debtOrders.find((o) => o.o_id === Number(selectedOrderId)) || null;
  }, [selectedOrderId, debtOrders]);

  const calculateRemainingDebt = (order: Order): number => {
    const totalPaidForOrder = payments
      .filter((p) => p.order_id === order.o_id)
      .reduce((sum, p) => sum + toNumber(p.amount_paid), 0);
    return toNumber(order.total_price) - totalPaidForOrder;
  };

  const totalCollected = useMemo(
    () => payments.reduce((sum, p) => sum + toNumber(p.amount_paid), 0),
    [payments],
  );

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const s = search.toLowerCase();
    return payments.filter((p) => {
      const customerName = p.order?.customer?.cus_name || p.customer?.cus_name || '';
      return (
        customerName.toLowerCase().includes(s) ||
        String(p.order_id).includes(s) ||
        String(p.pay_id).includes(s) ||
        (p.payment_method || '').toLowerCase().includes(s)
      );
    });
  }, [payments, search]);

  // ── Resolve customer name from payment (nested or flat) ───────────────
  const resolveCustomerName = (p: Payment): string => {
    return p.order?.customer?.cus_name || p.customer?.cus_name || '';
  };

  // ── Process Debt Payment ──────────────────────────────────────────────────
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrderId) {
      showToast('error', 'Fadlan dooro dalabka deynta (Order)');
      return;
    }
    if (!amountPaid || Number(amountPaid) <= 0) {
      showToast('error', 'Fadlan geli qadar lacageed oo sax ah');
      return;
    }
    if (selectedOrderDetails) {
      const remaining = calculateRemainingDebt(selectedOrderDetails);
      if (Number(amountPaid) > remaining) {
        showToast('error', `Lacagta aad keentay way ka badantahay deynta hartay ($${remaining.toFixed(2)})`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        order_id: Number(selectedOrderId),
        amount_paid: Number(amountPaid),
        payment_method: paymentMethod,
      };

      console.log('[Payments] POST /payments/create payload:', payload);
      const response = await axiosClient.post('/payments/create', payload);
      console.log('[Payments] POST /payments/create response:', response.data);

      if (response.data?.is_success === true) {
        showToast('success', 'Lacag bixinta si guul leh ayaa loo diwaangeliyey!');
        setIsModalOpen(false);
        setSelectedOrderId('');
        setAmountPaid('');
        setPaymentMethod('CASH');
        await fetchAll();
      } else {
        showToast('error', response.data?.message || 'Waa la diiday lacag-bixinta');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Cilad baa dhacday intii lacagta la bixinayay';
      showToast('error', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
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

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-garden-dark" />
            Lacag Bixinta (Payments)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {payments.length} lacag-bixin la diiwaan geliyey
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi macmiil, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedOrderId('');
              setAmountPaid('');
              setPaymentMethod('CASH');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-garden-lime text-garden-dark font-extrabold px-5 py-2.5 rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-garden-lime/20 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Bixi Deyn</span>
          </button>
        </div>
      </div>

      {/* ── Stats Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-garden-dark text-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold opacity-70 mb-1">Wadarta Lacagta La Qabtay</p>
              <p className="text-3xl font-black">${totalCollected.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-white/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-garden-lime" />
            </div>
          </div>
        </div>

        <div className="bg-white text-slate-800 rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Tirada Lacag-Bixinta</p>
              <p className="text-3xl font-black">{payments.length}</p>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg">
              <Receipt className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white text-slate-800 rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">Deymaha Sugi Yaal</p>
              <p className="text-3xl font-black">{debtOrders.length}</p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg">
              <Wallet className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Payments Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Pay ID</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Macaamiilka</th>
                <th className="px-6 py-4">Lacagta (Amount)</th>
                <th className="px-6 py-4">Habka Bixinta</th>
                <th className="px-6 py-4">Taariikhda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-garden-dark border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-500 font-bold">Xogta baa soo socota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">
                    Wax lacag-bixin ah lagama helin nidaamka.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => {
                  const cusName = resolveCustomerName(payment);
                  return (
                    <tr key={payment.pay_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-garden-dark">#{payment.pay_id}</td>
                      <td className="px-6 py-4 font-bold text-slate-700">Order #{payment.order_id}</td>
                      <td className="px-6 py-4 font-extrabold text-slate-800">
                        {cusName || <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 font-black text-garden-dark text-base">
                        ${toNumber(payment.amount_paid).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {payment.payment_method || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-medium">
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleString('en-GB')
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

      {/* ── Debt Payment Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 bg-garden-dark text-white">
              <h2 className="text-xl font-black flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-garden-lime" />
                Diiwaangeli Deyn Bixin
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all disabled:opacity-50"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleProcessPayment} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              {/* Order Select */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Dooro Dalabka (Order) *
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value ? Number(e.target.value) : '');
                    setAmountPaid('');
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                >
                  <option value="" disabled>
                    -- Dooro Dalab --
                  </option>
                  {debtOrders.map((order) => {
                    const remaining = calculateRemainingDebt(order);
                    const cusName = order.customer?.cus_name || 'Macmiil';
                    return (
                      <option key={order.o_id} value={order.o_id}>
                        Order #{order.o_id} — {cusName} — Deyn: ${remaining.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
                {debtOrders.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 font-bold">
                    Ma jiraan dalabaad deyn ah xilligan.
                  </p>
                )}
              </div>

              {/* Order Summary Card */}
              {selectedOrderDetails && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold">Wadarta Dalabka</p>
                    <p className="text-sm font-black text-slate-800">
                      ${toNumber(selectedOrderDetails.total_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold">Deynta Hartay</p>
                    <p className="text-sm font-black text-red-600">
                      ${calculateRemainingDebt(selectedOrderDetails).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Lacagta La Bixinayo ($) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={
                    selectedOrderDetails
                      ? calculateRemainingDebt(selectedOrderDetails)
                      : undefined
                  }
                  value={amountPaid}
                  onChange={(e) =>
                    setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  placeholder="Tusaale: 50.00"
                  required
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Habka Bixinta *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  !selectedOrderId ||
                  !amountPaid ||
                  debtOrders.length === 0
                }
                className="w-full py-3.5 mt-2 bg-garden-lime text-garden-dark font-black rounded-xl shadow-lg shadow-garden-lime/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-garden-dark border-t-transparent rounded-full animate-spin" />
                    <span>Waa La Kaydinayaa...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    <span>Kaydi Lacag Bixinta</span>
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

export default Payments;
