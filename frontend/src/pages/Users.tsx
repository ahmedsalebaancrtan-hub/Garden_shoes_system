import React, { useEffect, useMemo, useState } from 'react';
import { Edit, ShieldAlert, Trash2, UserPlus, Users as UsersIcon, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';
import useAuthStore from '../context/authStore';

type UserRole = 'ADMIN' | 'STAFF' | 'CASHIER';
type UserStatus = 'ACTIVE' | 'INACTIVE';

interface SystemUser {
  id: number;
  username?: string;
  fullname?: string;
  phone?: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  created_at?: string;
  updated_at?: string;
}

interface UserFormState {
  username: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
}

const emptyForm: UserFormState = {
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'CASHIER',
  status: 'ACTIVE',
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Admin',
  STAFF: 'Manager',
  CASHIER: 'Cashier',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

const roleBadgeClass = (role: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'STAFF':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'CASHIER':
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const statusBadgeClass = (status: UserStatus) => {
  return status === 'ACTIVE'
    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-red-100 text-red-800 border-red-200';
};

const getDisplayName = (user: SystemUser) => user.username || user.fullname || '-';

const Users: React.FC = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<UserFormState>(emptyForm);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    window.setTimeout(() => setToastMsg(null), 5000);
  };

  const fetchUsers = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const response = await axiosClient.get('/users');
      setUsers(response.data?.data || []);
    } catch (error) {
      console.error(error);
      showToast('error', 'Waa ku guuldareystay in isticmaalayaasha la soo shubo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return users;

    return users.filter((user) => {
      const name = getDisplayName(user).toLowerCase();
      return (
        name.includes(query) ||
        user.email.toLowerCase().includes(query) ||
        ROLE_LABELS[user.role].toLowerCase().includes(query) ||
        (user.status || 'ACTIVE').toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (user: SystemUser) => {
    setEditingUser(user);
    setFormData({
      username: getDisplayName(user) === '-' ? '' : getDisplayName(user),
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role: user.role,
      status: user.status || 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    resetForm();
    setIsModalOpen(false);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.username.trim() || !formData.email.trim()) {
      showToast('error', 'Fadlan buuxi username iyo email');
      return;
    }

    if (!editingUser && formData.password.length < 6) {
      showToast('error', 'Password-ku waa inuu ahaadaa ugu yaraan 6 xaraf');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        username: formData.username.trim(),
        fullname: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        status: formData.status,
        ...(formData.password ? { password: formData.password } : {}),
      };

      const response = editingUser
        ? await axiosClient.put(`/users/${editingUser.id}`, payload)
        : await axiosClient.post('/users', payload);

      if (response.data?.is_success) {
        showToast('success', editingUser ? 'Isticmaalaha waa la cusboonaysiiyey' : 'Isticmaale cusub waa la abuuray');
        closeModal();
        await fetchUsers();
      } else {
        showToast('error', response.data?.message || 'Codsiga lama dhammaystirin');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      showToast('error', error.response?.data?.message || error.response?.data?.error || 'Cilad baa dhacday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: SystemUser) => {
    const nextStatus: UserStatus = (user.status || 'ACTIVE') === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setSubmitting(true);
    try {
      const response = await axiosClient.put(`/users/${user.id}`, {
        username: getDisplayName(user),
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: nextStatus,
      });

      if (response.data?.is_success) {
        showToast('success', `Status-ka waxaa loo beddelay ${STATUS_LABELS[nextStatus]}`);
        await fetchUsers();
      } else {
        showToast('error', response.data?.message || 'Status-ka lama beddelin');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      showToast('error', error.response?.data?.message || error.response?.data?.error || 'Cilad baa dhacday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: SystemUser) => {
    if (currentUser?.user_id === user.id) {
      showToast('error', 'Ma tirtiri kartid akoonka aad hadda ku jirto');
      return;
    }

    const confirmed = window.confirm(`Ma hubtaa inaad tirtirayso ${getDisplayName(user)}?`);
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const response = await axiosClient.delete(`/users/${user.id}`);
      if (response.data?.is_success) {
        showToast('success', 'Isticmaalaha waa la tirtiray');
        await fetchUsers();
      } else {
        showToast('error', response.data?.message || 'Isticmaalaha lama tirtirin');
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; error?: string } } };
      showToast('error', error.response?.data?.message || error.response?.data?.error || 'Cilad baa dhacday');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="max-w-xl w-full bg-white border border-red-100 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Cilad: Gelitaan xaddidan</h1>
          <p className="text-red-600 font-extrabold">
            Cilad: Boggan waxaa u oggolaaday oo kaliya Maamulaha Guud (Admin)!
          </p>
        </div>
      </div>
    );
  }

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
            <UsersIcon className="w-7 h-7 text-garden-dark" />
            User Management
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{users.length} isticmaalayaal nidaamka ku jira</p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <input
            type="text"
            placeholder="Raadi username, email, role..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full sm:w-72 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-garden-lime focus:ring-2 focus:ring-garden-lime/20"
          />
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-garden-lime text-garden-dark font-extrabold px-5 py-2.5 rounded-xl hover:scale-[1.01] transition-transform shadow-lg shadow-garden-lime/20 whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Ku dar Isticmaale</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Doorka (Role)</th>
                <th className="px-6 py-4">Xaaladda (Status)</th>
                <th className="px-6 py-4 text-right">Abaabulka (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold">
                    Isticmaalayaasha ayaa la soo shubayaa...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold bg-slate-50/50">
                    Wax isticmaalayaal ah lama helin.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const status = user.status || 'ACTIVE';
                  const isCurrentUser = currentUser?.user_id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-extrabold text-slate-800">{getDisplayName(user)}</td>
                      <td className="px-6 py-4 font-medium text-slate-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black border ${roleBadgeClass(user.role)}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-black border disabled:opacity-50 ${statusBadgeClass(status)}`}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={submitting || isCurrentUser}
                            onClick={() => handleDelete(user)}
                            className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={isCurrentUser ? 'Cannot delete current user' : 'Delete user'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 bg-garden-dark text-white">
              <h2 className="text-xl font-black flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-garden-lime" />
                {editingUser ? 'Cusboonaysii Isticmaale' : 'Ku dar Isticmaale'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="text-white/60 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all disabled:opacity-50"
                aria-label="Close user modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                    placeholder="+252..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">
                    Password {editingUser ? '(optional)' : '*'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={editingUser ? undefined : 6}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Doorka (Role) *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                    required
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="STAFF">Manager</option>
                    <option value="CASHIER">Cashier</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-extrabold text-slate-700 mb-1.5">Xaaladda (Status) *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-garden-lime focus:ring-4 focus:ring-garden-lime/20"
                    required
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 mt-2 bg-garden-lime text-garden-dark font-black rounded-xl shadow-lg shadow-garden-lime/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-garden-dark border-t-transparent rounded-full animate-spin" />
                    <span>Waa La Kaydinayaa...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    <span>{editingUser ? 'Kaydi Isbeddelka' : 'Ku dar Isticmaale'}</span>
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

export default Users;
