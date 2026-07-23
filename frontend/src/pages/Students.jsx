import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Search,
  KeyRound,
  Lock,
  Unlock,
  Trash2,
  Edit,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Students = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    class_name: '',
    email: '',
    username: '',
    password: '',
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ['students', search],
    queryFn: async () => {
      const res = await api.get(`/students/?search=${search}`);
      return res.data.results || res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/students/', data),
    onSuccess: () => {
      toast.success('Thêm học sinh thành công!');
      queryClient.invalidateQueries(['students']);
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.student_id?.[0] || err.response?.data?.username?.[0] || 'Lỗi khi thêm học sinh.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/students/${id}/`, data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin học sinh thành công!');
      queryClient.invalidateQueries(['students']);
      closeModal();
    },
    onError: () => toast.error('Cập nhật thất bại.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/students/${id}/`),
    onSuccess: () => {
      toast.success('Đã xóa học sinh.');
      queryClient.invalidateQueries(['students']);
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (id) => api.post(`/students/${id}/reset_password/`),
    onSuccess: (res) => {
      toast.success(res.data.message);
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => api.post(`/students/${id}/toggle_active/`),
    onSuccess: (res) => {
      toast.success(res.data.message);
      queryClient.invalidateQueries(['students']);
    }
  });

  const openModal = (student = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        student_id: student.student_id,
        full_name: student.full_name,
        class_name: student.class_name,
        email: student.email || '',
        username: student.user?.username || '',
        password: '',
      });
    } else {
      setEditingStudent(null);
      setFormData({
        student_id: '',
        full_name: '',
        class_name: '',
        email: '',
        username: '',
        password: '123',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            <span>Quản Lý Học Sinh</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Quản lý tài khoản, thêm mới, sửa, xóa, khóa và reset mật khẩu sinh viên
          </p>
        </div>

        <button onClick={() => openModal()} className="btn-primary">
          <UserPlus className="w-5 h-5" />
          <span>Thêm Học Sinh Mới</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo MSSV, Họ tên, Lớp hoặc Username..."
          className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white"
        />
      </div>

      {/* Table Card */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">MSSV</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Lớp</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : students && students.length > 0 ? (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {st.student_id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {st.full_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
                        {st.class_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {st.email || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {st.user?.username}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        st.is_active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        {st.is_active ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        <span>{st.is_active ? 'Hoạt động' : 'Đã khóa'}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => resetPasswordMutation.mutate(st.id)}
                          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-950/50 hover:text-amber-600 rounded-lg transition-colors"
                          title="Reset Password (thành 123456)"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActiveMutation.mutate(st.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            st.is_active
                              ? 'text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600'
                              : 'text-emerald-600 hover:bg-emerald-100'
                          }`}
                          title={st.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {st.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openModal(st)}
                          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Xóa học sinh ${st.full_name}?`)) {
                              deleteMutation.mutate(st.id);
                            }
                          }}
                          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    Không tìm thấy học sinh nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingStudent ? 'Chỉnh Sửa Học Sinh' : 'Thêm Học Sinh Mới'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">MSSV</label>
                  <input
                    type="text"
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Lớp</label>
                  <input
                    type="text"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Email (không bắt buộc)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="input-field"
                    placeholder="Mặc định là MSSV"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Mật khẩu</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder={editingStudent ? 'Bỏ trống nếu giữ nguyên' : 'Mặc định: 123'}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Hủy</button>
                <button type="submit" className="btn-primary flex-1">
                  {editingStudent ? 'Cập Nhật' : 'Tạo Học Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
