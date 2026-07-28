import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, Clock, Award } from 'lucide-react';

const ExamReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: examData, isLoading, error } = useQuery({
    queryKey: ['exam-review', id],
    queryFn: async () => {
      const res = await api.get(`/student-exams/${id}/`);
      return res.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500" />
        <p className="text-slate-600 dark:text-slate-400">Không tìm thấy thông tin bài thi.</p>
        <button onClick={() => navigate('/student-exams')} className="btn-secondary">Quay lại</button>
      </div>
    );
  }

  const { exam_info, score, correct_count, incorrect_count, total_questions, time_spent, exam_questions, student_answers } = examData;

  // Map answers for easy lookup
  const answerMap = {};
  student_answers?.forEach(ans => {
    answerMap[ans.question] = ans;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/student-exams')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Xem Lại Bài Làm
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {exam_info?.name}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-center px-4 border-r border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Điểm số</span>
            <span className="text-2xl font-black text-blue-600">{score}</span>
          </div>
          <div className="text-center px-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Kết quả</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              <span className="text-emerald-500">{correct_count}</span> / {total_questions}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 flex items-center gap-4 border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Câu đúng</p>
            <p className="text-xl font-black text-emerald-600">{correct_count}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Câu sai</p>
            <p className="text-xl font-black text-rose-600">{incorrect_count}</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Thời gian</p>
            <p className="text-xl font-black text-blue-600">{Math.floor(time_spent / 60)}p {time_spent % 60}s</p>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {exam_questions?.map((eq, index) => {
          const userAns = answerMap[eq.question_id];
          const isCorrect = userAns?.is_correct;
          const selected = userAns?.selected_answer;
          const correct = eq.correct_display_option;

          return (
            <div key={eq.question_id} className={`glass-card overflow-hidden border-l-4 ${
              !selected ? 'border-l-slate-400' : isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'
            }`}>
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-sm">
                      {index + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug pt-0.5">
                      {eq.content}
                    </h3>
                  </div>
                  {selected && (
                    isCorrect ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-4 h-4" /> Đúng
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-600 font-bold text-sm bg-rose-50 dark:bg-rose-500/10 px-3 py-1.5 rounded-full">
                        <XCircle className="w-4 h-4" /> Sai
                      </span>
                    )
                  )}
                  {!selected && (
                    <span className="flex items-center gap-1.5 text-slate-500 font-bold text-sm bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                      <AlertCircle className="w-4 h-4" /> Bỏ trống
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-11">
                  {[
                    { key: 'A', text: eq.display_option_a },
                    { key: 'B', text: eq.display_option_b },
                    { key: 'C', text: eq.display_option_c },
                    { key: 'D', text: eq.display_option_d },
                  ].map((opt) => {
                    const isUserChoice = selected === opt.key;
                    const isCorrectChoice = correct === opt.key;
                    
                    let bgClass = "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800";
                    let textClass = "text-slate-700 dark:text-slate-300";
                    
                    if (isCorrectChoice) {
                      bgClass = "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50";
                      textClass = "text-emerald-700 dark:text-emerald-400 font-bold";
                    } else if (isUserChoice && !isCorrect) {
                      bgClass = "bg-rose-50 dark:bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/50";
                      textClass = "text-rose-700 dark:text-rose-400 font-bold";
                    }

                    return (
                      <div key={opt.key} className={`p-4 rounded-xl border transition-all ${bgClass}`}>
                        <div className="flex items-start gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            isCorrectChoice ? 'bg-emerald-500 text-white' : 
                            isUserChoice ? 'bg-rose-500 text-white' : 
                            'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}>
                            {opt.key}
                          </span>
                          <span className={`text-sm leading-relaxed ${textClass}`}>{opt.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={() => navigate('/student-exams')}
          className="btn-primary px-12 py-3 shadow-xl shadow-blue-600/20"
        >
          Xong, quay lại danh sách
        </button>
      </div>
    </div>
  );
};

export default ExamReview;
