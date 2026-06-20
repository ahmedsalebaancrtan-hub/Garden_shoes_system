import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Edit, Trash2, Search, X, Truck } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import type { Supplier, SupplierInput } from '../types/supplier';
import useAuthStore from '../context/authStore';

const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SupplierInput>({
    sup_name: '',
    sup_address: '',
    contact: '',
  });

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user } = useAuthStore();

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/suppliers/');
      setSuppliers(res.data.data || []);
    } catch (err: any) {
      showToast('error', 'Khaalad ayaa dhacay marka xogta la soo shubayay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.sup_id);
      setFormData({
        sup_name: supplier.sup_name,
        sup_address: supplier.sup_address,
        contact: supplier.contact,
      });
    } else {
      setEditingId(null);
      setFormData({ sup_name: '', sup_address: '', contact: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axiosClient.put(`/suppliers/update/${editingId}`, formData);
        showToast('success', 'Xogta supplier-ka waa la cusbooneysiiyey');
      } else {
        await axiosClient.post('/suppliers/create', formData);
        showToast('success', 'Supplier cusub baa nidaamka lagu daray');
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Cilad baa dhacday. Hubi xogta.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto supplier-kan?')) return;
    try {
      await axiosClient.delete(`/suppliers/delete/${id}`);
      showToast('success', 'Waa la tirtiray supplier-ka');
      fetchSuppliers();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Waxbaa khaldamay, lama tirtirin.');
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    (s.sup_name && s.sup_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (s.contact && s.contact.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <Truck className="w-7 h-7 text-garden-dark" />
            Maamulka Suppliers-ka
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Diiwaangeli, cusbooneysii oo maamul shirkadaha alaabta keena</p>
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
            className="flex items-center gap-2 bg-garden-lime text-garden-dark font-extrabold px-5 py-2.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-garden-lime/20"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Kudar Cusub</span>
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
                <th className="px-6 py-4">Magaca Shirkadda</th>
                <th className="px-6 py-4">Cinwaanka</th>
                <th className="px-6 py-4">Xiriirka (Contact)</th>
                <th className="px-6 py-4 text-right">Ficilada (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-500 font-bold">Xogta baa soo socota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">
                    Wax xog ah lagama helin nidaamka.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.sup_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-400">#{sup.sup_id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">{sup.sup_name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{sup.sup_address}</td>
                    <td className="px-6 py-4 font-bold text-slate-600">{sup.contact}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(sup)}
                        className="p-2 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Wax Ka Bedel"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button 
                          onClick={() => handleDelete(sup.sup_id)}
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5 text-garden-lime" /> : <Plus className="w-5 h-5 text-garden-lime" />}
                {editingId ? 'Wax Ka Bedel Supplier' : 'Diiwaangeli Supplier Cusub'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 p-1.5 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Magaca Shirkadda</label>
                <input 
                  type="text" 
                  required
                  value={formData.sup_name}
                  onChange={(e) => setFormData({...formData, sup_name: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400"
                  placeholder="Tusaale: Omaar Company"
                />
              </div>
              
              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Cinwaanka</label>
                <input 
                  type="text" 
                  required
                  value={formData.sup_address}
                  onChange={(e) => setFormData({...formData, sup_address: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400"
                  placeholder="Tusaale: Maka Al Mukarama, Muqdisho"
                />
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Xiriirka (Contact)</label>
                <input 
                  type="text" 
                  required
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400"
                  placeholder="Tusaale: +252 61..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Kansal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 px-4 py-3.5 bg-garden-lime text-garden-dark font-black rounded-xl shadow-lg shadow-garden-lime/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
                >
                  {editingId ? 'Cusbooneysii Xogta' : 'Kaydi Xogta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
