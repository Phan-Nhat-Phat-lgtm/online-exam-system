import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FileSpreadsheet, Plus, Clock, Calendar, BookOpen, Trash2, Edit, X } from 'lucide-react';

const Exams = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    total_questions: 50,
    duration_minutes: 60,
    start_time: '',
    end_time: '',
    question_bank_ids: []
  });

  const { data: banks } = useQuery({
    queryKey: ['banks-list'],
    queryFn: async () => {
      const res = await api.get('/banks/');
      return res.data.results || res.data;
    }
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const res = await api.get('/exams/');
      return res.data.results || res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/exams/', data),
    onSuccess: () => {
      toast.success('Tạo kỳ thi thành công!');
      queryClient.invalidateQueries(['exams']);
      closeModal();
    },
    onError: (err) => {
      toast.error('Lỗi khi tạo kỳ thi. Vui lòng kiểm tra lại thông tin.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/exams/${id}/`),
    onSuccess: () => {
      toast.success('Đã xóa kỳ thi.');
      queryClient.invalidateQueries(['exams']);
    }
  });

  const openModal = (exam = null) => {
    if (exam) {
      setEditingExam(exam);
      setFormData({
        name: exam.name,
        total_questions: exam.total_questions,
        duration_minutes: exam.duration_minutes,
        start_time: exam.start_time ? exam.start_time.slice(0, 16) : '',
        end_time: exam.end_time ? exam.end_time.slice(0, 16) : '',
        question_bank_ids: exam.question_banks_info?.map(b => b.id) || []
      });
    } else {
      setEditingExam(null);
      const now = new Date();
      const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setFormData({
        name: '',
        total_questions: 50,
        duration_minutes: 60,
        start_time: now.toISOString().slice(0, 16),
        end_time: future.toISOString().slice(0, 16),
        question_bank_ids: banks?.[0] ? [banks[0].id] : []
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleBankCheck = (bankId) => {
    setFormData(prev => {
      const exists = prev.question_bank_ids.includes(bankId);
      if (exists) {
        return { ...prev, question_bank_ids: prev.question_bank_ids.filter(id => id !== bankId) };
      } else {
        return { ...prev, question_bank_ids: [...prev.question_bank_ids, bankId] };
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.question_bank_ids.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 ngân hàng câu hỏi');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            <span>Quản Lý Kỳ Thi</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Thiết lập các ca thi, thời gian mở/đóng và ngân hàng câu hỏi sử dụng
          </p>
        </div>

        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-5 h-5" />
          <span>TẠO KỲ THI</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : exams && exams.length > 0 ? (
          exams.map((exam) => (
            <div key={exam.id} className="glass-card p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-200">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight">
                    {exam.name}
                  </h3>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                    exam.status_text === 'Đang diễn ra' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    exam.status_text === 'Chưa đến thời gian làm bài' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                    'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {exam.status_text}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>Thời gian làm bài: <strong>{exam.duration_minutes} phút</strong> ({exam.total_questions} câu)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div className="text-xs">
                      <p>Mở: {format(new Date(exam.start_time), 'HH:mm dd/MM/yyyy')}</p>
                      <p>Đóng: {format(new Date(exam.end_time), 'HH:mm dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    <BookOpen className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {exam.question_banks_info?.map(b => (
                        <span key={b.id} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                          {b.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-5 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    if (window.confirm(`Xóa kỳ thi '${exam.name}'?`)) {
                      deleteMutation.mutate(exam.id);
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
            Chưa có kỳ thi nào được tạo.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">TẠO KỲ THI MỚI</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Tên Kỳ Thi</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Ví dụ: Thi Giữa Kỳ Ứng Dụng CNTT 2026"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Số Câu Hỏi</label>
                  <input
                    type="number"
                    value={formData.total_questions}
                    onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) || 10 })}
                    className="input-field"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Thời Gian (Phút)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 15 })}
                    className="input-field"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Thời Gian Mở</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Thời Gian Đóng</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  Ngân Hàng Sử Dụng (Chọn nhiều)
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  {banks?.map((bank) => (
                    <label key={bank.id} className="flex items-center gap-3 text-sm cursor-pointer hover:text-emerald-600">
                      <input
                        type="checkbox"
                        checked={formData.question_bank_ids.includes(bank.id)}
                        onChange={() => handleBankCheck(bank.id)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span>{bank.name} ({bank.question_count} câu hỏi)</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Hủy</button>
                <button type="submit" className="btn-primary flex-1">Lưu Kỳ Thi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
