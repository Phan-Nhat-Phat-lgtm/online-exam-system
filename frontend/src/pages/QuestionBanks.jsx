import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { BookOpen, Plus, Search, Edit, Trash2, HelpCircle, X } from 'lucide-react';

const QuestionBanks = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data: banks, isLoading } = useQuery({
    queryKey: ['banks', search],
    queryFn: async () => {
      const res = await api.get(`/banks/?search=${search}`);
      return res.data.results || res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/banks/', data),
    onSuccess: () => {
      toast.success('Thêm Ngân hàng câu hỏi thành công!');
      queryClient.invalidateQueries(['banks']);
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/banks/${id}/`, data),
    onSuccess: () => {
      toast.success('Cập nhật thành công!');
      queryClient.invalidateQueries(['banks']);
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/banks/${id}/`),
    onSuccess: () => {
      toast.success('Đã xóa ngân hàng câu hỏi.');
      queryClient.invalidateQueries(['banks']);
    }
  });

  const openModal = (bank = null) => {
    if (bank) {
      setEditingBank(bank);
      setFormData({ name: bank.name, description: bank.description || '' });
    } else {
      setEditingBank(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBank(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBank) {
      updateMutation.mutate({ id: editingBank.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            <span>Ngân Hàng Câu Hỏi</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Quản lý các danh mục và kho lưu trữ chứa hàng nghìn câu hỏi trắc nghiệm
          </p>
        </div>

        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-5 h-5" />
          <span>Tạo Ngân Hàng Mới</span>
        </button>
      </div>

      <div className="glass-card p-4 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm ngân hàng câu hỏi..."
          className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : banks && banks.length > 0 ? (
          banks.map((bank) => (
            <div key={bank.id} className="glass-card p-6 flex flex-col justify-between group hover:border-indigo-500/50 transition-all duration-200">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 transition-colors">
                    {bank.name}
                  </h3>
                  <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{bank.question_count} câu hỏi</span>
                  </span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {bank.description || 'Chưa có mô tả chi tiết.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => openModal(bank)}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Xóa ngân hàng câu hỏi '${bank.name}'? Tất cả câu hỏi bên trong cũng sẽ bị xóa.`)) {
                      deleteMutation.mutate(bank.id);
                    }
                  }}
                  className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 glass-card text-slate-400">
            Chưa có ngân hàng câu hỏi nào.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingBank ? 'Sửa Ngân Hàng' : 'Tạo Ngân Hàng Mới'}
              </h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Tên Ngân Hàng Câu Hỏi
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Ứng dụng CNTT cơ bản, MOS, IC3..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[100px]"
                  placeholder="Mô tả phạm vi kiến thức..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Hủy</button>
                <button type="submit" className="btn-primary flex-1">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBanks;
