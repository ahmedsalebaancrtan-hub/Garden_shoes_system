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
    discount?: number;   // discount applied on the original order
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

  // Order total_price is stored by the backend after the point-of-sale discount
  // has already been applied. Treat it as the final net amount due here.
  const finalNetAmountDue = (order: Order): number => toNumber(order.total_price);

  const calculateRemainingDebt = (order: Order): number => {
    const totalPaidForOrder = payments
      .filter((p) => p.order_id === order.o_id)
      .reduce((sum, p) => sum + toNumber(p.amount_paid), 0);
    return finalNetAmountDue(order) - totalPaidForOrder;
  };

  // Net debt due after point-of-sale discount (used for modal cap + display)
  const netDebtDue = (order: Order): number => {
    return finalNetAmountDue(order);
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
  //
  // VALIDATION RULES (strict — no shorthand):
  //   1. An order must be selected.
  //   2. The entered amount must be a positive number.
  //   3. OVERPAYMENT GUARD:
  //      netDue = order.final_net_amount_due - order.total_amount_paid_so_far
  //      where `total_amount_paid_so_far` is the sum of every previous payment
  //      recorded in the local `payments` array for this order.
  //      If amount_paid > netDue  →  BLOCK immediately with the required message.
  //   4. STATUS RULE (enforced by backend, mirrored here for clarity):
  //      Only set to 'PAID' when amount_paid >= netDue (i.e. debt is fully settled).
  //      Any partial payment leaves the order in 'PARTIAL' / 'DEBT' status.
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Guard 1: Order must be selected ─────────────────────────────────────
    if (!selectedOrderId) {
      showToast('error', 'Fadlan dooro dalabka deynta (Order)');
      return;
    }

    // ── Guard 2: Amount must be a positive number ────────────────────────────
    const enteredAmount: number = Number(amountPaid);
    if (!amountPaid || enteredAmount <= 0) {
      showToast('error', 'Fadlan geli qadar lacageed oo sax ah');
      return;
    }

    // ── Guard 3: Strict Overpayment Check ───────────────────────────────────
    //
    //   Step A — Derive each component explicitly (no shorthand):
    if (selectedOrderDetails) {
      const orderFinalNetAmountDue: number = finalNetAmountDue(selectedOrderDetails);

      //   Step B — Compute total_amount_paid_so_far by summing every payment
      //             that has already been recorded for this specific order.
      const totalAmountPaidSoFar: number = payments
        .filter((p) => p.order_id === selectedOrderDetails.o_id)
        .reduce((runningSum, p) => runningSum + toNumber(p.amount_paid), 0);

      //   Step C — Calculate the strict net amount still due for this order.
      //             Formula (from requirements):
      //             netDue = final_net_amount_due - total_amount_paid_so_far
      const netDue: number = orderFinalNetAmountDue - totalAmountPaidSoFar;

      //   Step D — BLOCK if the entered amount EXCEEDS the net due.
      //             Using a tiny epsilon (0.001) to guard against IEEE-754
      //             floating-point rounding noise (e.g. 50.000000001 vs 50.00).
      const FLOAT_EPSILON: number = 0.001;
      if (enteredAmount > netDue + FLOAT_EPSILON) {
        // ── Exact required error message (Somali) ──────────────────────────
        showToast(
          'error',
          `Cilad: Ma bixin kartid lacag ka badan deynta dhabta ah ee u sarraysa dalabkan ($${netDue.toFixed(2)})!`,
        );
        return;
      }
    }

    // ── Submit: all guards passed ────────────────────────────────────────────
    setSubmitting(true);
    try {
      const payload = {
        order_id: Number(selectedOrderId),
        amount_paid: enteredAmount,
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
                <th className="px-6 py-4">Qiimo Dhimis</th>
                <th className="px-6 py-4">Habka Bixinta</th>
                <th className="px-6 py-4">Taariikhda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-garden-dark border-t-transparent rounded-full animate-spin" />
                      <span className="text-slate-500 font-bold">Xogta baa soo socota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">
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
                      {/* Discount column — sourced from the nested order object */}
                      <td className="px-6 py-4">
                        {toNumber(payment.order?.discount) > 0 ? (
                          <span className="font-bold text-amber-600">
                            -${toNumber(payment.order?.discount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-medium">—</span>
                        )}
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

              {/* Order Summary Card — 3-row discount breakdown */}
              {selectedOrderDetails && (() => {
                const orderDiscount = toNumber(selectedOrderDetails.discount);
                const net = netDebtDue(selectedOrderDetails);
                const remaining = calculateRemainingDebt(selectedOrderDetails);
                return (
                  <div className="rounded-xl border border-slate-200 overflow-hidden text-sm">
                    {/* Row 1 — Original total */}
                    <div className="flex justify-between items-center px-4 py-3 bg-slate-50">
                      <span className="text-slate-500 font-bold">Wadarta Asaliga ah (Original Total)</span>
                      <span className="font-black text-slate-800">
                        ${toNumber(selectedOrderDetails.total_price).toFixed(2)}
                      </span>
                    </div>
                    {/* Row 2 — Discount (only shown when > 0) */}
                    {orderDiscount > 0 && (
                      <div className="flex justify-between items-center px-4 py-3 bg-amber-50 border-t border-amber-100">
                        <span className="text-amber-700 font-bold">Qiimo Dhimis (Discount Made)</span>
                        <span className="font-black text-amber-600">- ${orderDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {/* Row 3 — Net debt due */}
                    <div className="flex justify-between items-center px-4 py-3 bg-white border-t border-slate-200">
                      <span className="text-slate-600 font-bold">Deynta Dhabta Ah (Net Debt Due)</span>
                      <span className="font-black text-slate-700">${net.toFixed(2)}</span>
                    </div>
                    {/* Row 4 — Remaining after existing payments */}
                    <div className="flex justify-between items-center px-4 py-3 bg-red-50 border-t border-red-100">
                      <span className="text-red-700 font-bold">Wali La Bixin Waayey (Still Owed)</span>
                      <span className="font-black text-red-600">${remaining.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                  Lacagta La Bixinayo ($) *
                </label>
                {/* The `max` attribute below is capped at netDue (final net due - totalPaidSoFar)
                    so the browser's native number-spinner also prevents exceeding the remaining amount.
                    This mirrors the exact formula enforced in handleProcessPayment Guard 3. */}
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
                {/* Inline cap hint — shown only when an order is selected */}
                {selectedOrderDetails && (() => {
                  const orderFinalNetAmountDue: number = finalNetAmountDue(selectedOrderDetails);
                  const totalAmountPaidSoFar: number = payments
                    .filter((p) => p.order_id === selectedOrderDetails.o_id)
                    .reduce((runningSum, p) => runningSum + toNumber(p.amount_paid), 0);
                  const netDue: number = orderFinalNetAmountDue - totalAmountPaidSoFar;
                  return (
                    <p className="text-xs text-slate-500 mt-1.5 font-semibold">
                      Xadka ugu sareeya:{' '}
                      <span className="font-black text-red-600">${netDue.toFixed(2)}</span>
                      {' '}(final net total − horey la bixiyey)
                    </p>
                  );
                })()}
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
