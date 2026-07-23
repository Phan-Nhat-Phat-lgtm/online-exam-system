import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { format } from 'date-fns';
import { BookMarked, Clock, Calendar, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';

const StudentExams = () => {
  const navigate = useNavigate();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['student-exams-list'],
    queryFn: async () => {
      const res = await api.get('/exams/student_exams_list/');
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <BookMarked className="w-7 h-7 text-blue-600" />
          <span>Danh Sách Kỳ Thi Trực Tuyến</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Chọn ca thi để bắt đầu làm bài trắc nghiệm
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : exams && exams.length > 0 ? (
          exams.map((exam) => {
            const isFinished = exam.student_exam_status === 'SUBMITTED';
            const canStart = exam.status_text === 'Đang diễn ra' && !isFinished;

            return (
              <div key={exam.id} className="glass-card p-6 flex flex-col justify-between hover:border-blue-500/50 transition-all duration-200">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                      {exam.name}
                    </h3>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                      isFinished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      exam.status_text === 'Đang diễn ra' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' :
                      exam.status_text === 'Chưa đến thời gian làm bài' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                      'bg-slate-200 text-slate-700 dark:bg-slate-800'
                    }`}>
                      {isFinished ? 'Đã hoàn thành' : exam.status_text}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span>Số câu: <strong>{exam.total_questions} câu</strong> - Thời gian: <strong>{exam.duration_minutes} phút</strong></span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                      <div className="text-xs">
                        <p>Thời gian mở: {format(new Date(exam.start_time), 'HH:mm dd/MM/yyyy')}</p>
                        <p>Thời gian đóng: {format(new Date(exam.end_time), 'HH:mm dd/MM/yyyy')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                  {isFinished ? (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-between font-bold text-sm">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Điểm số:
                      </span>
                      <span className="text-lg">{exam.score} / 10</span>
                    </div>
                  ) : canStart ? (
                    <button
                      onClick={() => navigate(`/exam/${exam.id}`)}
                      className="btn-primary w-full shadow-lg shadow-blue-600/25"
                    >
                      <PlayCircle className="w-5 h-5" />
                      <span>Bắt Đầu Làm Bài</span>
                    </button>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-center font-semibold text-sm flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{exam.status_text}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 glass-card text-slate-400">
            Hiện chưa có kỳ thi nào.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentExams;
