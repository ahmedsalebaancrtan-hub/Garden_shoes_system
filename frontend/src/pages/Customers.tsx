import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Edit, Trash2, Search, X, Users } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import type { Customer, CustomerInput } from '../types/customer';
import useAuthStore from '../context/authStore';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CustomerInput>({
    cus_name: '',
    cus_phone: '',
    cus_city: '',
    cus_address: '',
    cus_age: '',
  });

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user } = useAuthStore();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/customers/');
      setCustomers(res.data.data || []);
    } catch (err: any) {
      showToast('error', 'Cilad baa dhacday marka xogta macaamiisha la soo shubayay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.cus_id);
      setFormData({
        cus_name: customer.cus_name,
        cus_phone: customer.cus_phone,
        cus_city: customer.cus_city,
        cus_address: customer.cus_address,
        cus_age: customer.cus_age || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        cus_name: '',
        cus_phone: '',
        cus_city: '',
        cus_address: '',
        cus_age: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        cus_age: formData.cus_age ? Number(formData.cus_age) : 0,
      };

      if (editingId) {
        await axiosClient.put(`/customers/update/${editingId}`, payload);
        showToast('success', 'Xogta macaamiilka si guul leh ayaa loo casriyeeyey');
      } else {
        await axiosClient.post('/customers/create', payload);
        showToast('success', 'Macaamiil cusub baa nidaamka lagu daray');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Cilad baa dhacday. Hubi xogta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto macaamiilkan?')) return;
    try {
      await axiosClient.delete(`/customers/delete/${id}`);
      showToast('success', 'Macaamiilka si guul leh ayaa looga tirtiray');
      fetchCustomers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Waxbaa khaldamay, lama tirtirin.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.cus_name && c.cus_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (c.cus_phone && c.cus_phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-2xl font-bold z-50 transition-all border ${toastMsg.type === 'success' ? 'bg-garden-lime text-garden-dark border-garden-lime/50' : 'bg-red-500 text-white border-red-600'}`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-garden-dark" />
            Maamulka Macaamiisha
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Diiwaangeli oo maamul xogta dadka dukaanka wax ka iibsada</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Raadi magac ama taleefan..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition-all"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-garden-lime text-garden-dark font-extrabold px-5 py-2.5 rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-garden-lime/20"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Kudar Macaamiil</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Magaca oo Buuxa</th>
                <th className="px-6 py-4">Taleefan</th>
                <th className="px-6 py-4">Magaalada</th>
                <th className="px-6 py-4">Cinwaanka</th>
                <th className="px-6 py-4 text-right">Ficilada (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-500 font-bold">Xogta baa soo socota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">
                    Wax macaamiil ah lagama helin nidaamka.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cus) => (
                  <tr key={cus.cus_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-400">#{cus.cus_id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">{cus.cus_name}</td>
                    <td className="px-6 py-4 font-bold text-slate-600">{cus.cus_phone}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{cus.cus_city}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{cus.cus_address}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(cus)}
                        className="p-2 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Wax Ka Bedel"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button 
                          onClick={() => handleDelete(cus.cus_id)}
                          className="p-2 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Tirtir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Drawer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5 text-garden-lime" /> : <Plus className="w-5 h-5 text-garden-lime" />}
                {editingId ? 'Wax Ka Bedel Macaamiil' : 'Diiwaangeli Macaamiil Cusub'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 p-1.5 rounded-lg transition-all" disabled={submitting}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Magaca oo Buuxa</label>
                  <input 
                    type="text" 
                    required
                    disabled={submitting}
                    value={formData.cus_name}
                    onChange={(e) => setFormData({...formData, cus_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="Tusaale: Ahmed Ali"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Taleefan</label>
                  <input 
                    type="text" 
                    required
                    disabled={submitting}
                    value={formData.cus_phone}
                    onChange={(e) => setFormData({...formData, cus_phone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="Tusaale: +252 61..."
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Magaalada (City)</label>
                  <input 
                    type="text" 
                    required
                    disabled={submitting}
                    value={formData.cus_city}
                    onChange={(e) => setFormData({...formData, cus_city: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="Tusaale: Muqdisho"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Cinwaanka (Address)</label>
                  <input 
                    type="text" 
                    required
                    disabled={submitting}
                    value={formData.cus_address}
                    onChange={(e) => setFormData({...formData, cus_address: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="Tusaale: Hodan, Muqdisho"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Da'da (Age - Ixtiyaari)</label>
                  <input 
                    type="number" 
                    disabled={submitting}
                    min="0"
                    value={formData.cus_age}
                    onChange={(e) => setFormData({...formData, cus_age: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Kansal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 px-4 py-3.5 bg-garden-lime text-garden-dark font-black rounded-xl shadow-lg shadow-garden-lime/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                      <span>Waa La Kaydinayaa...</span>
                    </>
                  ) : (
                    editingId ? 'Cusbooneysii Xogta' : 'Kaydi Macaamiilka'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
