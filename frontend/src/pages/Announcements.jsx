import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Megaphone, Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';

const Announcements = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', is_active: true });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await api.get('/announcements/');
      // API dùng PageNumberPagination → trả {count, next, results: [...]}
      return res.data.results || res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/announcements/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Đã tạo thông báo mới!');
      resetForm();
    },
    onError: () => toast.error('Không thể tạo thông báo')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/announcements/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Đã cập nhật thông báo!');
      resetForm();
    },
    onError: () => toast.error('Không thể cập nhật thông báo')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/announcements/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['announcements']);
      toast.success('Đã xóa thông báo!');
    },
    onError: () => toast.error('Không thể xóa thông báo')
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', is_active: true });
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      is_active: announcement.is_active
    });
    setEditingId(announcement.id);
    setIsFormOpen(true);
  };

  const toggleActive = (announcement) => {
    updateMutation.mutate({
      id: announcement.id,
      data: { ...announcement, is_active: !announcement.is_active }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-blue-600" />
            Quản lý Thông báo
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tạo và quản lý thông báo gửi đến học sinh
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-primary"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm thông báo mới</span>
        </button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            {editingId ? 'Chỉnh sửa thông báo' : 'Tạo thông báo mới'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Tiêu đề <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                placeholder="Nhập tiêu đề thông báo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Nội dung <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="input-field min-h-[120px]"
                placeholder="Nhập nội dung thông báo"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Hiển thị thông báo này cho học sinh
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" className="btn-primary">
                <Save className="w-4 h-4" />
                <span>{editingId ? 'Cập nhật' : 'Tạo mới'}</span>
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                <X className="w-4 h-4" />
                <span>Hủy</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div className="glass-card p-6">
        <div className="space-y-4">
          {announcements && announcements.length > 0 ? (
            announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {announcement.title}
                      </h3>
                      {announcement.is_active ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Đang hiển thị
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Đã ẩn
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <div className="mt-3 text-xs text-slate-400">
                      Tạo bởi: {announcement.created_by_name} • {new Date(announcement.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(announcement)}
                      className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                      title={announcement.is_active ? 'Ẩn thông báo' : 'Hiển thị thông báo'}
                    >
                      {announcement.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa thông báo này?')) {
                          deleteMutation.mutate(announcement.id);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Megaphone className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Chưa có thông báo nào. Tạo thông báo đầu tiên!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
