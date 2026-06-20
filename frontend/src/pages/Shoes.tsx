import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Edit, Trash2, Search, X, Package } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import type { Shoe, ShoeInput } from '../types/shoe';
import type { Supplier } from '../types/supplier';
import useAuthStore from '../context/authStore';

const Shoes: React.FC = () => {
  const [shoes, setShoes] = useState<Shoe[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ShoeInput>({
    shoe_name: '',
    shoe_type: '',
    shoe_brand: '',
    shoe_des: '',
    qty: 0,
    price: 0,
    sup_id: '',
  });

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user } = useAuthStore();

  const fetchShoes = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/shoes/');
      setShoes(res.data.data || []);
    } catch (err: any) {
      showToast('error', 'Cilad baa dhacday marka xogta kabaha la soo shubayay');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axiosClient.get('/suppliers/');
      setSuppliers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    }
  };

  useEffect(() => {
    fetchShoes();
    fetchSuppliers();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenModal = (shoe?: Shoe) => {
    if (shoe) {
      setEditingId(shoe.shoe_id);
      setFormData({
        shoe_name: shoe.shoe_name,
        shoe_type: shoe.shoe_type,
        shoe_brand: shoe.shoe_brand,
        shoe_des: shoe.shoe_des,
        qty: shoe.qty,
        price: shoe.price,
        sup_id: shoe.supplier?.sup_id || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        shoe_name: '',
        shoe_type: '',
        shoe_brand: '',
        shoe_des: '',
        qty: 0,
        price: 0,
        sup_id: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        qty: Number(formData.qty),
        price: Number(formData.price),
        sup_id: Number(formData.sup_id),
      };

      if (editingId) {
        await axiosClient.put(`/shoes/update/${editingId}`, payload);
        showToast('success', 'Xogta kabaha si guul leh ayaa loo casriyeeyey');
      } else {
        await axiosClient.post('/shoes/create', payload);
        showToast('success', 'Kabo cusub ayaa nidaamka lagu daray');
      }
      setIsModalOpen(false);
      fetchShoes();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Cilad baa dhacday. Hubi xogta.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto alaabtan kaydka?')) return;
    try {
      await axiosClient.delete(`/shoes/delete/${id}`);
      showToast('success', 'Kabaha si guul leh ayaa looga tirtiray');
      fetchShoes();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Waxbaa khaldamay, lama tirtirin.');
    }
  };

  const filteredShoes = shoes.filter(s => 
    (s.shoe_name && s.shoe_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (s.shoe_brand && s.shoe_brand.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <Package className="w-7 h-7 text-garden-dark" />
            Kaydka Kabaha (Inventory)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Maamul alaabta taal dukaanka iyo tiradooda</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Raadi magac ama sumad..." 
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
            <span className="hidden sm:inline">Kudar Alaab</span>
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
                <th className="px-6 py-4">Magaca</th>
                <th className="px-6 py-4">Sumad (Brand)</th>
                <th className="px-6 py-4">Nooca (Type)</th>
                <th className="px-6 py-4">Qiimo</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Ficilada (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-500 font-bold">Xogta baa soo socota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">
                    Wax alaab ah lagama helin kaydka.
                  </td>
                </tr>
              ) : (
                filteredShoes.map((shoe) => (
                  <tr key={shoe.shoe_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-400">#{shoe.shoe_id}</td>
                    <td className="px-6 py-4 font-extrabold text-slate-800">{shoe.shoe_name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{shoe.shoe_brand}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{shoe.shoe_type}</td>
                    <td className="px-6 py-4 font-extrabold text-garden-dark">${(shoe.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {shoe.qty < 5 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
                          Low Stock ({shoe.qty})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {shoe.qty} in stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleOpenModal(shoe)}
                        className="p-2 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Wax Ka Bedel"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button 
                          onClick={() => handleDelete(shoe.shoe_id)}
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
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5 text-garden-lime" /> : <Plus className="w-5 h-5 text-garden-lime" />}
                {editingId ? 'Wax Ka Bedel Kabo' : 'Kudar Alaab Cusub'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 p-1.5 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Magaca</label>
                  <input 
                    type="text" 
                    required
                    value={formData.shoe_name}
                    onChange={(e) => setFormData({...formData, shoe_name: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400"
                    placeholder="E.g. Air Max 90"
                  />
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Sumad (Brand)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.shoe_brand}
                    onChange={(e) => setFormData({...formData, shoe_brand: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400"
                    placeholder="E.g. Nike"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Nooca (Type / Size / Color)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.shoe_type}
                    onChange={(e) => setFormData({...formData, shoe_type: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400"
                    placeholder="E.g. Sneakers (Size 42, Black)"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Supplier (Keene)</label>
                  <select
                    required
                    value={formData.sup_id}
                    onChange={(e) => setFormData({...formData, sup_id: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all appearance-none"
                  >
                    <option value="" disabled>Dooro Supplier</option>
                    {suppliers.map(sup => (
                      <option key={sup.sup_id} value={sup.sup_id}>{sup.sup_name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Qiimo ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400"
                    placeholder="0.00"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Tirada (Stock Qty)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={formData.qty}
                    onChange={(e) => setFormData({...formData, qty: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400"
                    placeholder="0"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Faahfaahin (Description)</label>
                  <textarea 
                    value={formData.shoe_des}
                    onChange={(e) => setFormData({...formData, shoe_des: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 resize-none"
                    rows={2}
                    placeholder="Faahfaahin dheeri ah..."
                  ></textarea>
                </div>
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
                  {editingId ? 'Cusbooneysii Kaydka' : 'Kaydi Alaabta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shoes;
