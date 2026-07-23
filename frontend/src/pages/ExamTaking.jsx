import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  Send,
  WifiOff,
  UserCheck
} from 'lucide-react';

const ExamTaking = () => {
  const { id: examId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [studentExam, setStudentExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const timerRef = useRef(null);

  // Monitor network connection status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Exam Session
  useEffect(() => {
    const startSession = async () => {
      try {
        const res = await api.post('/student-exams/start_exam/', { exam_id: examId });
        const data = res.data;
        setStudentExam(data);

        const qList = data.exam_questions || [];
        setQuestions(qList);

        // Load local storage cache if available
        const cacheKey = `exam_${data.id}_answers`;
        const cached = localStorage.getItem(cacheKey);
        let initialAnswers = {};
        let initialFlagged = {};

        if (data.saved_answers) {
          Object.keys(data.saved_answers).forEach(qId => {
            initialAnswers[qId] = data.saved_answers[qId].selected_answer;
            if (data.saved_answers[qId].is_flagged) {
              initialFlagged[qId] = true;
            }
          });
        }

        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            initialAnswers = { ...initialAnswers, ...parsedCache.answers };
            initialFlagged = { ...initialFlagged, ...parsedCache.flagged };
          } catch (e) {}
        }

        setAnswers(initialAnswers);
        setFlagged(initialFlagged);

        // Calculate Timer
        const startedAt = new Date(data.started_at).getTime();
        const durationMs = data.exam_info.duration_minutes * 60 * 1000;
        const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
        const totalDurationSec = data.exam_info.duration_minutes * 60;
        const remainingSec = Math.max(0, totalDurationSec - elapsedSec);

        setTimeLeft(remainingSec);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Không thể bắt đầu bài thi.');
        navigate('/student-exams');
      } finally {
        setLoading(false);
      }
    };

    startSession();
  }, [examId, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (!studentExam || submittedResult) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [studentExam, submittedResult]);

  // Sync answer to local cache & backend
  const handleSelectAnswer = (qId, optionLetter) => {
    const newAnswers = { ...answers, [qId]: optionLetter };
    setAnswers(newAnswers);

    // Save to local storage
    if (studentExam) {
      localStorage.setItem(`exam_${studentExam.id}_answers`, JSON.stringify({
        answers: newAnswers,
        flagged
      }));

      // Async send to API
      if (navigator.onLine) {
        api.post(`/student-exams/${studentExam.id}/save_answer/`, {
          question_id: qId,
          selected_answer: optionLetter,
          is_flagged: flagged[qId] || False,
          time_spent: studentExam.exam_info.duration_minutes * 60 - timeLeft
        }).catch(() => {});
      }
    }
  };

  const toggleFlag = (qId) => {
    const newFlagged = { ...flagged, [qId]: !flagged[qId] };
    setFlagged(newFlagged);
    if (studentExam) {
      localStorage.setItem(`exam_${studentExam.id}_answers`, JSON.stringify({
        answers,
        flagged: newFlagged
      }));
    }
  };

  const handleAutoSubmit = () => {
    toast.error('Hết giờ làm bài! Hệ thống đang tự động nộp bài...');
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    if (submitting || !studentExam) return;
    setSubmitting(true);

    try {
      const res = await api.post(`/student-exams/${studentExam.id}/submit_exam/`, {
        answers,
        time_spent: studentExam.exam_info.duration_minutes * 60 - timeLeft
      });
      setSubmittedResult(res.data);
      localStorage.removeItem(`exam_${studentExam.id}_answers`);
      toast.success('Nộp bài thi thành công!');
    } catch (err) {
      toast.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold">Đang chuẩn bị đề thi & trộn đáp án...</p>
        </div>
      </div>
    );
  }

  // Result screen after submit
  if (submittedResult) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 flex items-center justify-center">
        <div className="glass-card max-w-lg w-full p-8 text-center space-y-6 bg-slate-800/90 border-slate-700">
          <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Đã Nộp Bài Thi Thành Công!</h2>
            <p className="text-slate-400 text-sm mt-1">{studentExam?.exam_info?.name}</p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-700/60 space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Điểm số đạt được</span>
              <p className="text-5xl font-black text-emerald-400 mt-1">{submittedResult.score} / 10</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-sm">
              <div>
                <span className="text-slate-400 text-xs block">Số câu đúng</span>
                <span className="font-bold text-emerald-400">{submittedResult.correct_count} / {submittedResult.total_questions} câu</span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block">Số câu sai</span>
                <span className="font-bold text-rose-400">{submittedResult.incorrect_count} câu</span>
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/student-exams')} className="btn-primary w-full py-3">
            Quay lại danh sách kỳ thi
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentQId = currentQ?.question_id;
  const selectedChoice = answers[currentQId];
  const isFlagged = flagged[currentQId];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Floating Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white leading-tight">{studentExam?.student_name}</h2>
              <p className="text-xs text-slate-400">MSSV: {studentExam?.student_id} - Lớp: {studentExam?.class_name}</p>
            </div>
          </div>
        </div>

        {/* Offline indicator */}
        {isOffline && (
          <div className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <WifiOff className="w-4 h-4" />
            <span>Đang mất kết nối - Đáp án được tự lưu trên máy</span>
          </div>
        )}

        {/* Timer & Submit button */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-base border shadow-inner ${
            timeLeft <= 300 ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-bounce' : 'bg-slate-800 text-blue-400 border-slate-700'
          }`}>
            <Clock className="w-5 h-5" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button onClick={() => setShowSubmitConfirm(true)} className="btn-primary py-2 bg-emerald-600 hover:bg-emerald-700">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Nộp bài</span>
          </button>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Question Box */}
        <div className="lg:col-span-3 flex flex-col justify-between glass-card p-6 lg:p-8 bg-slate-900/80 border-slate-800 min-h-[500px]">
          {currentQ ? (
            <div className="space-y-6">
              {/* Question Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="font-extrabold text-blue-400 text-lg">
                  Câu hỏi {currentIndex + 1} / {questions.length}
                </span>

                <button
                  onClick={() => toggleFlag(currentQId)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                    isFlagged ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isFlagged ? 'fill-amber-400' : ''}`} />
                  <span>{isFlagged ? 'Đã đánh dấu' : 'Đánh dấu câu hỏi'}</span>
                </button>
              </div>

              {/* Question Content */}
              <p className="text-lg lg:text-xl font-medium text-white leading-relaxed">
                {currentQ.content}
              </p>

              {/* Shuffled Options Radio List */}
              <div className="space-y-3 pt-2">
                {[
                  { letter: 'A', text: currentQ.display_option_a },
                  { letter: 'B', text: currentQ.display_option_b },
                  { letter: 'C', text: currentQ.display_option_c },
                  { letter: 'D', text: currentQ.display_option_d },
                ].map((opt) => {
                  const isSelected = selectedChoice === opt.letter;
                  return (
                    <label
                      key={opt.letter}
                      onClick={() => handleSelectAnswer(currentQId, opt.letter)}
                      className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {opt.letter}
                      </div>
                      <span className="text-base font-normal">{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500">Chưa có câu hỏi.</p>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-800">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="btn-secondary py-2.5 px-4 bg-slate-800 border-slate-700 text-slate-300 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Câu trước</span>
            </button>

            <button
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIndex === questions.length - 1}
              className="btn-primary py-2.5 px-4 disabled:opacity-30"
            >
              <span>Câu sau</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Side: Question Grid Navigator */}
        <div className="glass-card p-6 bg-slate-900/80 border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-200 text-base">Danh Sách Câu Hỏi</h3>

          {/* Grid 1..N */}
          <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const qId = q.question_id;
              const hasAns = !!answers[qId];
              const isFlag = !!flagged[qId];
              const isCurrent = idx === currentIndex;

              let btnClass = 'bg-slate-800 text-slate-400 border-slate-700';
              if (hasAns) btnClass = 'bg-emerald-600 text-white font-bold border-emerald-500';
              if (isFlag) btnClass = 'bg-amber-500 text-slate-950 font-bold border-amber-400';
              if (isCurrent) btnClass += ' ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900';

              return (
                <button
                  key={qId}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-10 rounded-xl font-mono text-sm border flex items-center justify-center transition-all ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600"></span>
              <span>Đã trả lời</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
              <span>Đã đánh dấu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></span>
              <span>Chưa trả lời</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800 space-y-5 text-center">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Xác Nhận Nộp Bài?</h3>
              <p className="text-slate-400 text-sm mt-1">
                Bạn đã làm <strong>{Object.keys(answers).length} / {questions.length}</strong> câu hỏi.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)} className="btn-secondary flex-1 py-2.5 bg-slate-800 border-slate-700 text-slate-300">
                Tiếp tục làm bài
              </button>
              <button onClick={handleSubmitExam} disabled={submitting} className="btn-primary flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700">
                {submitting ? 'Đang nộp...' : 'Nộp bài ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTaking;
