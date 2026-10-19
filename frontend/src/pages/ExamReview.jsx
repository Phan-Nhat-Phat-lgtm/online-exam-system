import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { ChevronLeft, CheckCircle2, XCircle, AlertCircle, Clock, Award, Sparkles, Lightbulb, TrendingUp, Heart } from 'lucide-react';

const ExamReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [aiFeedback, setAiFeedback] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  const requestAIFeedback = async () => {
    if (!id) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await api.post(`/student-exams/${id}/ai_feedback/`);
      if (res.data.success) {
        setAiFeedback(res.data.feedback);
      } else {
        setAiError(res.data.error || 'Không lấy được phản hồi AI.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Lỗi kết nối.';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  };

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

      {/* AI Feedback Section */}
      <div className="glass-card p-6 border-violet-500/30 bg-gradient-to-br from-violet-50/60 to-indigo-50/40 dark:from-violet-950/20 dark:to-indigo-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Cố Vấn AI Phân Tích Bài Làm</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">AI đọc lối sai của riêng em và gợi ý cách ôn lại phù hợp nhất</p>
            </div>
          </div>
          {!aiFeedback && (
            <button onClick={requestAIFeedback} disabled={aiLoading} className="btn-primary !bg-gradient-to-r !from-violet-600 !to-indigo-600 !border-0 whitespace-nowrap">
              {aiLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  AI đang phân tích... (15-40 giây)
                </span>
              ) : (
                <span className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Nhận Phản Hồi AI</span>
              )}
            </button>
          )}
        </div>

        {aiError && (
          <div className="mt-4 p-3 rounded-xl text-sm bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {aiFeedback && (
          <div className="mt-5 space-y-5">
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 border-l-4 border-violet-500 pl-4 italic">
              {aiFeedback.summary}
            </p>

            {aiFeedback.strengths?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                  <TrendingUp className="w-4 h-4" /> Điểm mạnh của em
                </h3>
                <ul className="space-y-1.5">
                  {aiFeedback.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiFeedback.weak_topics?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-rose-700 dark:text-rose-400 mb-2">
                  <AlertCircle className="w-4 h-4" /> Chủ điểm cần củng cố
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiFeedback.weak_topics.map((w, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{w.topic}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{w.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiFeedback.advice?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-400 mb-2">
                  <Lightbulb className="w-4 h-4" /> Lộ trình ôn tập dành cho em
                </h3>
                <ol className="space-y-2">
                  {aiFeedback.advice.map((a, i) => (
                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-violet-500/15 text-violet-600 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {aiFeedback.encouragement && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-100/70 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900">
                <Heart className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">{aiFeedback.encouragement}</p>
              </div>
            )}
          </div>
        )}
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
