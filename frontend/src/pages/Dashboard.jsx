import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import {
  Users,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  Award,
  TrendingUp,
  Clock,
  UserCheck
} from 'lucide-react';

const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/');
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-200 dark:border-rose-800">
        Không thể tải dữ liệu Dashboard. Vui lòng kiểm tra lại backend.
      </div>
    );
  }

  const statCards = [
    { label: 'Tổng số học sinh', value: stats?.total_students || 0, icon: Users, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
    { label: 'Ngân hàng câu hỏi', value: stats?.total_banks || 0, icon: BookOpen, color: 'from-indigo-500 to-purple-500', shadow: 'shadow-indigo-500/20' },
    { label: 'Tổng số kỳ thi', value: stats?.total_exams || 0, icon: FileSpreadsheet, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20' },
    { label: 'Tổng số lượt thi', value: stats?.total_exams_taken || 0, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Dashboard Tổng Quan
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Hệ thống thi trắc nghiệm trực tuyến môn Ứng dụng CNTT Cơ bản
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card p-6 flex items-center justify-between group hover:scale-[1.02] transition-all duration-200">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-lg ${card.shadow}`}>
                <Icon className="w-7 h-7" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Score Summary Metrics */}
      <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
        <div className="flex items-center gap-4 pt-4 md:pt-0">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm Trung Bình</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats?.avg_score} / 10</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm Cao Nhất</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats?.max_score} / 10</p>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 md:pt-0 md:pl-6">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm Thấp Nhất</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats?.min_score} / 10</p>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Exam Submissions Table */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Danh sách bài thi vừa nộp</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-400 tracking-wider">
                  <th className="pb-3 px-2">Học sinh</th>
                  <th className="pb-3 px-2">MSSV / Lớp</th>
                  <th className="pb-3 px-2">Kỳ thi</th>
                  <th className="pb-3 px-2 text-right">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {stats?.recent_exams?.length > 0 ? (
                  stats.recent_exams.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-2 font-semibold text-slate-900 dark:text-white">
                        {row.student_name}
                      </td>
                      <td className="py-3 px-2 text-slate-500 dark:text-slate-400 text-xs">
                        {row.student_id} - {row.class_name}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                        {row.exam_name}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                          row.score >= 8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' :
                          row.score >= 5 ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                        }`}>
                          {row.score} điểm
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-slate-400 text-sm">
                      Chưa có lượt nộp bài thi nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Students Card */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>Top Sinh Viên Xuất Sắc</span>
          </h2>

          <div className="space-y-3">
            {stats?.top_students?.length > 0 ? (
              stats.top_students.map((top, idx) => (
                <div key={top.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between border border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center ${
                      idx === 0 ? 'bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30' :
                      idx === 1 ? 'bg-slate-300 text-slate-800' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {top.student_name}
                      </p>
                      <p className="text-xs text-slate-400">MSSV: {top.student_id}</p>
                    </div>
                  </div>
                  <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    {top.score} đ
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-6 text-slate-400 text-sm">Chưa có bảng xếp hạng.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
