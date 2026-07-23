import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import {
  Award,
  Download,
  Filter,
  Search,
  Clock,
  TrendingUp,
  BarChart2
} from 'lucide-react';

const Results = () => {
  const { isAdmin } = useAuth();
  const [selectedExam, setSelectedExam] = useState('');
  const [search, setSearch] = useState('');

  const { data: exams } = useQuery({
    queryKey: ['exams-list'],
    queryFn: async () => {
      const res = await api.get('/exams/');
      return res.data.results || res.data;
    }
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ['results', selectedExam, search],
    queryFn: async () => {
      let url = `/results/?search=${search}`;
      if (selectedExam) url += `&student_exam__exam=${selectedExam}`;
      const res = await api.get(url);
      return res.data.results || res.data;
    }
  });

  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/results/export_excel/?exam_id=${selectedExam}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ket_Qua_Thi_${new Date().getTime()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert('Không thể tải xuống file Excel.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Award className="w-7 h-7 text-indigo-600" />
            <span>Kết Quả & Báo Cáo Thi</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Xem lịch sử điểm số, thống kê chi tiết và xuất báo cáo danh sách kết quả ra file Excel
          </p>
        </div>

        {isAdmin && (
          <button onClick={handleExportExcel} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-5 h-5" />
            <span>Xuất Excel Kết Quả</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-slate-400 shrink-0" />
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="input-field py-2"
          >
            <option value="">-- Tất cả kỳ thi --</option>
            {exams?.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex items-center gap-3 w-full">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo Tên sinh viên, MSSV hoặc Lớp..."
            className="w-full bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 px-4">Học sinh</th>
                <th className="py-3.5 px-4">MSSV</th>
                <th className="py-3.5 px-4">Lớp</th>
                <th className="py-3.5 px-4">Tên Kỳ Thi</th>
                <th className="py-3.5 px-4 text-center">Đúng / Tổng</th>
                <th className="py-3.5 px-4 text-center">Thời gian</th>
                <th className="py-3.5 px-4">Ngày nộp</th>
                <th className="py-3.5 px-4 text-right">Điểm số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : results && results.length > 0 ? (
                results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {res.student_name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                      {res.student_id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {res.class_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {res.exam_name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {res.correct_count}
                      </span>
                      <span className="text-slate-400"> / {res.total_questions}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                      {Math.floor(res.time_spent / 60)} phút {res.time_spent % 60} giây
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {format(new Date(res.submitted_at), 'HH:mm dd/MM/yyyy')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-xl text-sm font-black ${
                        res.score >= 8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                        res.score >= 5 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}>
                        {res.score} điểm
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Không tìm thấy kết quả nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Results;
