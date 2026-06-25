import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Receipt, Printer, ArrowLeft, Download } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import { type Order } from './Orders';

const InvoiceReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axiosClient.get(`/orders/${id}`);
        if (response.data?.is_success && response.data?.data) {
          setOrderData(response.data.data);
        } else {
          setError('Failed to load invoice data.');
        }
      } catch (err: unknown) {
        console.error(err);
        setError('Error retrieving invoice from server.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-garden-lime border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold">Waa la soo shubayaa...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-red-500 mb-4">
          <Receipt className="w-16 h-16 mx-auto opacity-50" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Invoice Lama Helin</h2>
        <p className="text-slate-500 font-medium mt-2">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 flex items-center gap-2 bg-slate-100 text-slate-600 font-bold px-5 py-2.5 rounded-xl hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dib u noqo
        </button>
      </div>
    );
  }

  const renderBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-800 border border-green-200">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
          PAID
        </span>
      );
    }
    if (s === 'DEBT') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-800 border border-red-200">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />
          DEBT
        </span>
      );
    }
    if (s === 'PARTIAL') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          PARTIAL
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
        {s || 'UNKNOWN'}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:m-0 print:space-y-0 print-container">
      {/* GLOBAL PRINT OVERRIDES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Hide EVERY dashboard component like sidebar, headers, navigation tabs, and action bars */
          div[class*="sidebar"], aside, nav, header, button, .print\\:hidden {
            display: none !important;
          }
          /* Expand the core invoice element canvas to occupy full printable bounds */
          body, main, #root, .print-container {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            width: 100% !important;
          }
          .invoice-card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />

      {/* Action Toolbar (Hidden when printing) */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-4 py-2 rounded-xl transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-garden-lime text-garden-dark font-extrabold px-6 py-2.5 rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-garden-lime/20"
        >
          <Printer className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Invoice Document Wrapper */}
      <div className="invoice-card bg-white p-10 sm:p-12 rounded-3xl shadow-xl border border-slate-100 print:block">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-8 border-b-2 border-slate-100 print:border-slate-200">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-garden-dark">
              GARDEN<span className="text-garden-lime">SHOES</span>
            </h1>
            <p className="text-sm font-bold text-slate-400 mt-1">Rasmi & Tayo Sare</p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center justify-start sm:justify-end gap-2">
              <Receipt className="w-6 h-6 text-slate-300" />
              INVOICE
            </h2>
            <p className="text-sm font-bold text-slate-500">
              #ORD-{orderData?.o_id}
            </p>
            <p className="text-sm font-medium text-slate-500 mt-0.5">
              {orderData?.order_date ? new Date(orderData.order_date).toLocaleString('en-GB') : '-'}
            </p>
            <div className="mt-3 inline-block">
              {renderBadge(orderData?.status)}
            </div>
          </div>
        </div>

        {/* Customer & Employee Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Macaamiilka (Billed To)
            </h3>
            <p className="text-lg font-extrabold text-slate-800">
              {orderData?.customer?.cus_name || '-'}
            </p>
            {orderData?.customer?.cus_phone && (
              <p className="text-sm font-medium text-slate-500 mt-1">
                Tel: {orderData.customer.cus_phone}
              </p>
            )}
            {orderData?.customer?.cus_address && (
              <p className="text-sm font-medium text-slate-500 mt-1">
                {orderData.customer.cus_address}
                {orderData?.customer?.cus_city ? `, ${orderData.customer.cus_city}` : ''}
              </p>
            )}
          </div>
          
          <div className="sm:text-right">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
              Shaqaalaha (Cashier)
            </h3>
            <p className="text-lg font-extrabold text-slate-800">
              {orderData?.employee?.emp_name || 'Admin'}
            </p>
            {orderData?.employee?.emp_phone && (
              <p className="text-sm font-medium text-slate-500 mt-1">
                Tel: {orderData.employee.emp_phone}
              </p>
            )}
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="mt-4 mb-8">
          <div className="overflow-x-auto rounded-xl border border-slate-100 print:border-slate-300">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100 print:bg-slate-100 print:border-slate-300">
                <tr>
                  <th className="px-6 py-4">Sharaxaad (Description)</th>
                  <th className="px-6 py-4 text-center">Tirada (Qty)</th>
                  <th className="px-6 py-4 text-right">Qiimaha (Price)</th>
                  <th className="px-6 py-4 text-right">Wadarta (Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                <tr className="bg-white">
                  <td className="px-6 py-5">
                    <p className="font-extrabold text-slate-800 text-base">
                      {orderData?.shoe?.shoe_name || 'Kabo'}
                    </p>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                      Brand: {orderData?.shoe?.shoe_brand || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-slate-600 text-base">
                    {orderData?.qty || 0}
                  </td>
                  <td className="px-6 py-5 text-right font-bold text-slate-600 text-base">
                    ${Number(orderData?.shoe?.price || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-5 text-right font-black text-garden-dark text-base">
                    ${Number(orderData?.total_price || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="flex flex-col items-end pt-4 space-y-3 print:pt-6">
          <div className="w-full sm:w-1/2 flex justify-between items-center px-4">
            <span className="font-bold text-slate-500">Subtotal:</span>
            <span className="font-bold text-slate-800">${Number(orderData?.total_price || 0).toFixed(2)}</span>
          </div>
          <div className="w-full sm:w-1/2 flex justify-between items-center px-4">
            <span className="font-bold text-slate-500">Tax / Discount:</span>
            <span className="font-bold text-slate-800">$0.00</span>
          </div>
          <div className="w-full sm:w-1/2 flex justify-between items-center px-4 py-4 bg-slate-50 rounded-xl border border-slate-100 print:border-slate-300 print:bg-slate-100">
            <span className="text-lg font-black text-slate-800">Total Due:</span>
            <span className="text-2xl font-black text-garden-dark">
              ${Number(orderData?.total_price || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Print Footer / Terms */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center print:mt-24 print:border-slate-200">
          <p className="text-xs font-bold text-slate-400">
            Waad ku mahadsan tahay inaad naga adeegatay. Soo dhawoow marwalba!
          </p>
          <p className="text-xs font-medium text-slate-300 mt-1">
            Garden Shoes &copy; {new Date().getFullYear()}
          </p>
        </div>

      </div>
    </div>
  );
};

export default InvoiceReport;
