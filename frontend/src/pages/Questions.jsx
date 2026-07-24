import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  HelpCircle,
  Plus,
  Upload,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const PAGE_SIZE = 20;

const Questions = () => {
  const queryClient = useQueryClient();
  const [selectedBank, setSelectedBank] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [selectedBank, search]);

  // Modals
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importBankId, setImportBankId] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Form State
  const [qFormData, setQFormData] = useState({
    bank: '',
    content: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: 'A'
  });

  const { data: banks } = useQuery({
    queryKey: ['banks-list'],
    queryFn: async () => {
      const res = await api.get('/banks/');
      return res.data.results || res.data;
    }
  });

  const { data: questionsData, isLoading } = useQuery({
    queryKey: ['questions', selectedBank, search, page],
    queryFn: async () => {
      let url = `/questions/?page=${page}&search=${search}`;
      if (selectedBank) url += `&bank=${selectedBank}`;
      const res = await api.get(url);
      return res.data;
    },
    keepPreviousData: true
  });

  const questions = questionsData?.results || (Array.isArray(questionsData) ? questionsData : []);
  const totalCount = questionsData?.count ?? questions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (editingQuestion) {
        return api.patch(`/questions/${editingQuestion.id}/`, data);
      }
      return api.post('/questions/', data);
    },
    onSuccess: () => {
      toast.success(editingQuestion ? 'Cập nhật câu hỏi thành công!' : 'Tạo câu hỏi mới thành công!');
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['banks']);
      closeQuestionModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/questions/${id}/`),
    onSuccess: () => {
      toast.success('Đã xóa câu hỏi.');
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['banks']);
    }
  });

  const openQuestionModal = (q = null) => {
    if (q) {
      setEditingQuestion(q);
      setQFormData({
        bank: q.bank,
        content: q.content,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer
      });
    } else {
      setEditingQuestion(null);
      setQFormData({
        bank: banks?.[0]?.id || '',
        content: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_answer: 'A'
      });
    }
    setIsQuestionModalOpen(true);
  };

  const closeQuestionModal = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile || !importBankId) {
      toast.error('Vui lòng chọn ngân hàng và file DOCX/PDF');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('bank_id', importBankId);

    setImporting(true);
    setImportResult(null);

    try {
      const res = await api.post('/questions/import_questions/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data);
      toast.success(res.data.message);
      queryClient.invalidateQueries(['questions']);
      queryClient.invalidateQueries(['banks']);
    } catch (err) {
      const errData = err.response?.data;
      setImportResult(errData || { success: false, error: 'Import thất bại.' });
      toast.error('Có lỗi xảy ra khi import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <HelpCircle className="w-7 h-7 text-amber-500" />
            <span>Quản Lý Câu Hỏi</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Xem, thêm thủ công hoặc Import câu hỏi tự động từ file DOCX/PDF
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => { setImportResult(null); setImportFile(null); setImportBankId(banks?.[0]?.id || ''); setIsImportModalOpen(true); }} className="btn-secondary">
            <Upload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>IMPORT QUESTION</span>
          </button>
          <button onClick={() => openQuestionModal()} className="btn-primary">
            <Plus className="w-5 h-5" />
            <span>Thêm Câu Hỏi</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-slate-400 shrink-0" />
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="input-field py-2"
          >
            <option value="">-- Tất cả ngân hàng --</option>
            {banks?.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.question_count} câu)</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex items-center gap-3 w-full">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm nội dung câu hỏi..."
            className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : questions && questions.length > 0 ? (
          questions.map((q, idx) => (
            <div key={q.id} className="glass-card p-5 space-y-3 hover:border-amber-500/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold text-sm flex items-center justify-center">
                    #{(page - 1) * PAGE_SIZE + idx + 1}
                  </span>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      {q.bank_name}
                    </span>
                    <p className="font-semibold text-slate-900 dark:text-white text-base">
                      {q.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openQuestionModal(q)} className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => { if (window.confirm('Xóa câu hỏi này?')) deleteMutation.mutate(q.id); }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 pl-11">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const isCorrect = q.correct_answer === letter;
                  const optionText = q[`option_${letter.toLowerCase()}`];
                  return (
                    <div
                      key={letter}
                      className={`p-2.5 rounded-xl border text-sm flex items-center gap-3 ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-medium'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center ${
                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {letter}
                      </span>
                      <span>{optionText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 glass-card text-slate-400">
            Chưa có câu hỏi nào.
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Hiển thị <span className="font-semibold text-slate-700 dark:text-slate-200">{(page - 1) * PAGE_SIZE + 1}</span>
            {' '}–{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(page * PAGE_SIZE, totalCount)}</span>
            {' '}trong tổng số <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span> câu
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </button>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 px-2">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary py-2 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Question Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingQuestion ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
              </h2>
              <button onClick={closeQuestionModal} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(qFormData); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Ngân Hàng Câu Hỏi</label>
                <select
                  value={qFormData.bank}
                  onChange={(e) => setQFormData({ ...qFormData, bank: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {banks?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Nội dung câu hỏi</label>
                <textarea
                  value={qFormData.content}
                  onChange={(e) => setQFormData({ ...qFormData, content: e.target.value })}
                  className="input-field min-h-[90px]"
                  placeholder="Nhập nội dung câu hỏi..."
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['A', 'B', 'C', 'D'].map((lettr) => (
                  <div key={lettr}>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Đáp án {lettr}</label>
                    <input
                      type="text"
                      value={qFormData[`option_${lettr.toLowerCase()}`]}
                      onChange={(e) => setQFormData({ ...qFormData, [`option_${lettr.toLowerCase()}`]: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Đáp Án Đúng</label>
                <select
                  value={qFormData.correct_answer}
                  onChange={(e) => setQFormData({ ...qFormData, correct_answer: e.target.value })}
                  className="input-field font-bold text-emerald-600"
                >
                  <option value="A">Đáp án A</option>
                  <option value="B">Đáp án B</option>
                  <option value="C">Đáp án C</option>
                  <option value="D">Đáp án D</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeQuestionModal} className="btn-secondary flex-1">Hủy</button>
                <button type="submit" className="btn-primary flex-1">Lưu Câu Hỏi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                <span>Import Câu Hỏi từ DOCX / PDF</span>
              </h2>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Chọn Ngân Hàng Lưu Trữ</label>
                <select
                  value={importBankId}
                  onChange={(e) => setImportBankId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  {banks?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">File Đề Thi (.docx hoặc .pdf)</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
                  <FileText className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {importFile ? importFile.name : 'Nhấp hoặc kéo thả file DOCX / PDF vào đây'}
                  </p>
                  <input
                    type="file"
                    accept=".docx,.pdf"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="mt-3 text-xs text-slate-500"
                    required
                  />
                </div>
              </div>

              {/* Status / Error display */}
              {importResult && (
                <div className={`p-4 rounded-xl text-sm ${importResult.success ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200'}`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {importResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                    <span>{importResult.message || importResult.error}</span>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2 text-xs space-y-1 max-h-40 overflow-y-auto font-mono bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border">
                      <p className="font-bold text-rose-600 mb-1">Các dòng bị lỗi:</p>
                      {importResult.errors.map((errStr, idx) => (
                        <p key={idx}>{errStr}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setIsImportModalOpen(false)} className="btn-secondary flex-1">Đóng</button>
                <button type="submit" disabled={importing} className="btn-primary flex-1">
                  {importing ? 'Đang phân tích...' : 'Tải Lên & Bắt Đầu Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
