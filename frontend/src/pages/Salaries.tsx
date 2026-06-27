import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, UserPlus, Search, Briefcase, Calendar, X, FileText } from 'lucide-react';
import axiosClient from '../api/axiosClient';

interface Employee {
  emp_id: number;
  emp_name: string;
  job_title?: string;
  base_salary?: number;
}

interface Salary {
  sal_id: number;
  employee_id: number;
  employee?: Employee;
  base_salary: number;
  bonus: number;
  deductions: number;
  net_salary: number;
  salary_month: string;
  payment_method: string;
}

const Salaries: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  
  const [baseSalary, setBaseSalary] = useState<number | ''>('');
  const [bonus, setBonus] = useState<number | ''>('');
  const [deductions, setDeductions] = useState<number | ''>('');
  const [salaryMonth, setSalaryMonth] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK TRANSFER');

  const PAYMENT_METHODS = ['BANK TRANSFER', 'CASH', 'ZAAD', 'EVC'];

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    window.setTimeout(() => setToastMsg(null), 5000);
  };

  const fetchAll = async () => {
    setLoading(true);
    setToastMsg(null); // Clear any lingering error banners before trying again
    try {
      const [salariesRes, empRes] = await Promise.all([
        axiosClient.get('/salaries'),
        axiosClient.get('/employees')
      ]);
      setSalaries(salariesRes.data?.data || []);
      setEmployees(empRes.data?.data || []);
    } catch (err: unknown) {
      console.error(err);
      showToast('error', 'Waa ku guuldareystay in xogta la soo shubo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setSelectedEmployeeId('');
    setSelectedEmployee(null);
    setEmployeeQuery('');
    setShowEmployeeDropdown(false);
    setBaseSalary('');
    setBonus('');
    setDeductions('');
    setSalaryMonth('');
    setPaymentMethod('BANK TRANSFER');
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.emp_name.toLowerCase().includes(employeeQuery.toLowerCase()) || 
      (e.job_title && e.job_title.toLowerCase().includes(employeeQuery.toLowerCase()))
    );
  }, [employees, employeeQuery]);

  const filteredSalaries = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return salaries.filter(s => 
      s.employee?.emp_name.toLowerCase().includes(q) ||
      s.salary_month.toLowerCase().includes(q)
    );
  }, [salaries, searchQuery]);

  const netSalaryPreview = useMemo(() => {
    const base = Number(baseSalary) || 0;
    const b = Number(bonus) || 0;
    const d = Number(deductions) || 0;
    return base + b - d;
  }, [baseSalary, bonus, deductions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMsg(null); // Clear errors before submitting
    
    if (!selectedEmployeeId || baseSalary === '' || !salaryMonth) {
      showToast('error', 'Fadlan buuxi dhammaan xogta muhiimka ah');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_id: Number(selectedEmployeeId),
        base_salary: Number(baseSalary),
        bonus: Number(bonus) || 0,
        deductions: Number(deductions) || 0,
        salary_month: salaryMonth,
        payment_method: paymentMethod
      };

      const res = await axiosClient.post('/salaries', payload);
      if (res.data?.is_success) {
        showToast('success', 'Mushaarka si guul leh ayaa loo diwaangeliyey');
        resetForm();
        setIsModalOpen(false);
        fetchAll();
      } else {
        showToast('error', res.data?.message || 'Cilad baa dhacday');
      }
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Cilad baa dhacday intii la diwaangalinayay');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toastMsg && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-xl shadow-2xl font-bold z-[100] border max-w-sm ${toastMsg.type === 'success' ? 'bg-garden-lime text-garden-dark border-garden-lime/50' : 'bg-red-500 text-white border-red-600'}`}>
          {toastMsg.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-garden-dark" />
            Mushahaaraadka (Salaries)
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{salaries.length} diiwaan</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi shaqaale ama bil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20 transition-all"
            />
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-garden-lime text-garden-dark font-extrabold px-5 py-2.5 rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-garden-lime/20 whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Bixi Mushahar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Shaqaalaha (Employee)</th>
                <th className="px-6 py-4">Bisha (Month)</th>
                <th className="px-6 py-4 text-right">Mushaharka Asaliga (Base)</th>
                <th className="px-6 py-4 text-right">Gunnada (Bonus)</th>
                <th className="px-6 py-4 text-right text-red-600">Gooni-u-jarid (Deductions)</th>
                <th className="px-6 py-4 text-right">Wadarta la Siiyey (Net)</th>
                <th className="px-6 py-4">Habka Bixinta (Method)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold">Xogta baa la soo shubayaa...</td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">Wax mushahar ah lama helin</td>
                </tr>
              ) : (
                filteredSalaries.map(salary => (
                  <tr key={salary.sal_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        {salary.employee?.emp_name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {salary.salary_month}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">${Number(salary.base_salary).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">+ ${Number(salary.bonus).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-bold text-red-600">- ${Number(salary.deductions).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-black text-garden-dark text-base">${Number(salary.net_salary).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        {salary.payment_method}
                      </span>
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
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 bg-garden-dark text-white">
              <h2 className="text-xl font-black flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-garden-lime" />
                Diiwaangeli Mushahar
              </h2>
              <button onClick={() => setIsModalOpen(false)} disabled={submitting} className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="relative">
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Shaqaalaha (Employee) *</label>
                {selectedEmployeeId ? (
                  <div className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                    <span>
                      {selectedEmployee?.emp_name || employees.find(e => e.emp_id === selectedEmployeeId)?.emp_name}
                    </span>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setSelectedEmployeeId('');
                        setSelectedEmployee(null);
                        setBaseSalary('');
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Raadi shaqaale..."
                      value={employeeQuery}
                      onChange={(e) => {
                        setEmployeeQuery(e.target.value);
                        setShowEmployeeDropdown(true);
                      }}
                      onFocus={() => setShowEmployeeDropdown(true)}
                      onBlur={() => setShowEmployeeDropdown(false)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                      required={!selectedEmployeeId}
                    />
                    {showEmployeeDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map((e) => (
                            <div
                              key={e.emp_id}
                              onMouseDown={() => {
                                setSelectedEmployeeId(e.emp_id);
                                setSelectedEmployee(e);
                                setBaseSalary(Number(e.base_salary) || 0);
                                setEmployeeQuery('');
                                setShowEmployeeDropdown(false);
                              }}
                              className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-sm font-bold text-slate-700"
                            >
                              {e.emp_name} {e.job_title ? `- ${e.job_title}` : ''}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">Lama helin shaqaale</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Bisha (Month) *</label>
                <input
                  type="month"
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Base Salary ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={baseSalary}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 cursor-not-allowed"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Bonus ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 text-green-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Deductions ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20 text-red-600"
                  />
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex justify-between items-center">
                <span className="font-extrabold text-slate-700">Net Salary:</span>
                <span className="text-2xl font-black text-garden-dark">${netSalaryPreview.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Habka Bixinta (Payment Method) *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 mt-2 bg-garden-lime text-garden-dark font-black rounded-xl shadow-lg shadow-garden-lime/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-garden-dark border-t-transparent rounded-full animate-spin" />
                    <span>Waa La Kaydinayaa...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Bixi Mushaharka
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

export default Salaries;
