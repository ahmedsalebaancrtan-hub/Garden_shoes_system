import React, { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Shield, UserCheck, Edit, Trash2, Search, X, Plus } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import type { Employee, EmployeeInput } from '../types/employee';
import useAuthStore from '../context/authStore';

const SHIFTS = ['Subax (Morning)', 'Galab (Afternoon)', 'Habeyn (Evening)'];
const JOB_TITLES = ['Manager', 'Sales Associate', 'Cashier', 'Store Keeper', 'Security', 'Cleaner'];

const Employees: React.FC = () => {
  const { user } = useAuthStore();

  // Guard: Only ADMIN can access this page
  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Xaq Uma Lihid</h2>
        <p className="text-slate-500 font-medium text-center max-w-sm">
          Boggan waxaa laga heli karaa ADMIN kaliya. Xiriir maamulaha nidaamka haddaad u baahantahay gal.
        </p>
      </div>
    );
  }

  return <EmployeesAdmin />;
};

const EmployeesAdmin: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<EmployeeInput>({
    emp_name: '',
    emp_phone: '',
    emp_email: '',
    emp_address: '',
    emp_shift: SHIFTS[0],
    hire_date: new Date().toISOString().split('T')[0],
    job_title: JOB_TITLES[0],
    base_salary: 0,
  });

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/employees/');
      setEmployees(res.data.data || []);
    } catch (err: any) {
      showToast('error', 'Cilad baa dhacday marka xogta shaqaalaha la soo shubayay');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingId(emp.emp_id);
      setFormData({
        emp_name: emp.emp_name,
        emp_phone: emp.emp_phone,
        emp_email: emp.emp_email,
        emp_address: emp.emp_address,
        emp_shift: emp.emp_shift,
        hire_date: emp.hire_date ? emp.hire_date.split('T')[0] : '',
        job_title: emp.job_title,
        base_salary: Number(emp.base_salary) || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        emp_name: '',
        emp_phone: '',
        emp_email: '',
        emp_address: '',
        emp_shift: SHIFTS[0],
        hire_date: new Date().toISOString().split('T')[0],
        job_title: JOB_TITLES[0],
        base_salary: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await axiosClient.put(`/employees/update/${editingId}`, formData);
        showToast('success', 'Xogta shaqaalaha si guul leh ayaa loo casriyeeyey');
      } else {
        await axiosClient.post('/employees/create', formData);
        showToast('success', 'Shaqaale cusub baa nidaamka lagu daray');
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Cilad baa dhacday. Hubi xogta.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Ma hubtaa inaad tirtirto shaqaaluhu nidaamka? Tallaabadaan looma celin karo.')) return;
    try {
      await axiosClient.delete(`/employees/delete/${id}`);
      showToast('success', 'Shaqaalaha si guul leh ayaa looga tirtiray');
      fetchEmployees();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Waxbaa khaldamay, lama tirtirin.');
    }
  };

  const getShiftBadge = (shift: string) => {
    const s = shift.toLowerCase();
    if (s.includes('subax') || s.includes('morning')) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">🌅 {shift}</span>;
    }
    if (s.includes('habeyn') || s.includes('evening')) {
      return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">🌙 {shift}</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">☀️ {shift}</span>;
  };

  const filteredEmployees = employees.filter(
    (e) =>
      (e.emp_name && e.emp_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.job_title && e.job_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.emp_email && e.emp_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-2xl font-bold z-50 border ${
            toastMsg.type === 'success'
              ? 'bg-garden-lime text-garden-dark border-garden-lime/50'
              : 'bg-red-500 text-white border-red-600'
          }`}
        >
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-garden-dark" />
            Maamulka Shaqaalaha
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Diiwaanso oo xakamee shaqaalaha dukaanka</p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi magac, xirfad, ama email..."
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
            <span className="hidden sm:inline">Kudar Shaqaale</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Wadarta Shaqaalaha', value: employees.length, color: 'bg-garden-dark', text: 'text-white' },
          { label: 'Xirfadaha', value: new Set(employees.map((e) => e.job_title)).size, color: 'bg-garden-lime/20', text: 'text-garden-dark' },
          { label: 'Morning Shift', value: employees.filter((e) => e.emp_shift?.toLowerCase().includes('subax') || e.emp_shift?.toLowerCase().includes('morning')).length, color: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Evening Shift', value: employees.filter((e) => e.emp_shift?.toLowerCase().includes('habeyn') || e.emp_shift?.toLowerCase().includes('evening')).length, color: 'bg-indigo-50', text: 'text-indigo-700' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-4 border border-slate-100`}>
            <p className={`text-3xl font-black ${stat.text}`}>{stat.value}</p>
            <p className={`text-xs font-bold ${stat.text} opacity-70 mt-1`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Magaca</th>
                <th className="px-6 py-4">Xirfadda (Job Title)</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Taleefan</th>
                <th className="px-6 py-4">Shiftka</th>
                <th className="px-6 py-4 text-right">Base Salary</th>
                <th className="px-6 py-4">Taariikhda Shaqada</th>
                <th className="px-6 py-4 text-right">Ficilada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-6 h-6 border-2 border-garden-dark border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-slate-500 font-bold">Xogta baa soo socota...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">
                    Wax shaqaale ah lagama helin nidaamka.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.emp_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-400">#{emp.emp_id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-garden-dark flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                          {emp.emp_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-extrabold text-slate-800">{emp.emp_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-garden-lime/20 text-garden-dark border border-garden-lime/30">
                        {emp.job_title}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">{emp.emp_email}</td>
                    <td className="px-6 py-4 font-bold text-slate-600">{emp.emp_phone}</td>
                    <td className="px-6 py-4">{getShiftBadge(emp.emp_shift || '')}</td>
                    <td className="px-6 py-4 text-right font-black text-garden-dark">
                      ${Number(emp.base_salary || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                      {emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(emp)}
                        className="p-2 text-blue-500 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Wax Ka Bedel"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(emp.emp_id)}
                        className="p-2 text-red-400 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors inline-flex items-center justify-center"
                        title="Tirtir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50 sticky top-0">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                {editingId ? <Edit className="w-5 h-5 text-garden-lime" /> : <Plus className="w-5 h-5 text-garden-lime" />}
                {editingId ? 'Wax Ka Bedel Shaqaale' : 'Diiwaangeli Shaqaale Cusub'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-800 hover:bg-slate-200 p-1.5 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Magaca oo Buuxa</label>
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    value={formData.emp_name}
                    onChange={(e) => setFormData({ ...formData, emp_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="Tusaale: Mohamed Farah"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Taleefan</label>
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    value={formData.emp_phone}
                    onChange={(e) => setFormData({ ...formData, emp_phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="+252 61..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    disabled={submitting}
                    value={formData.emp_email}
                    onChange={(e) => setFormData({ ...formData, emp_email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="shaqaale@golden.so"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Cinwaanka (Address)</label>
                  <input
                    type="text"
                    required
                    disabled={submitting}
                    value={formData.emp_address}
                    onChange={(e) => setFormData({ ...formData, emp_address: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all placeholder-slate-400 disabled:opacity-50"
                    placeholder="Tusaale: Hodan, Muqdisho"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Xirfadda (Job Title)</label>
                  <select
                    required
                    disabled={submitting}
                    value={formData.job_title}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all appearance-none disabled:opacity-50"
                  >
                    {JOB_TITLES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Shiftka</label>
                  <select
                    required
                    disabled={submitting}
                    value={formData.emp_shift}
                    onChange={(e) => setFormData({ ...formData, emp_shift: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all appearance-none disabled:opacity-50"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Base Salary ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    disabled={submitting}
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all disabled:opacity-50"
                    placeholder="Tusaale: 500.00"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Taariikhda Bilawga Shaqada (Hire Date)</label>
                  <input
                    type="date"
                    required
                    disabled={submitting}
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 transition-all disabled:opacity-50"
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
                  ) : editingId ? (
                    'Cusbooneysii Xogta'
                  ) : (
                    'Kaydi Shaqaalaha'
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

export default Employees;
