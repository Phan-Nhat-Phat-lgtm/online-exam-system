import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { UserCheck, Calendar, AlertCircle, Check, X, Search } from 'lucide-react';

const Attendance = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [note, setNote] = useState('');

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const res = await api.get('/students/');
      return res.data;
    }
  });

  const { data: attendances, isLoading: attendancesLoading } = useQuery({
    queryKey: ['attendances', selectedDate],
    queryFn: async () => {
      const res = await api.get(`/attendances/?date=${selectedDate}`);
      return res.data;
    }
  });

  const markAbsentMutation = useMutation({
    mutationFn: (data) => api.post('/attendances/mark_absent/', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['attendances']);
      toast.success('Đã điểm danh vắng!');
      setSelectedStudents([]);
      setNote('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Không thể điểm danh');
    }
  });

  const handleMarkAbsent = () => {
    if (selectedStudents.length === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh');
      return;
    }

    markAbsentMutation.mutate({
      date: selectedDate,
      student_ids: selectedStudents,
      note: note
    });
  };

  const toggleStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const isStudentAbsent = (studentId) => {
    return Array.isArray(attendances) && attendances.some(a => a?.student === studentId && a?.is_absent);
  };

  // Guard: nếu API trả về null/undefined hoặc phần tử thiếu trường, không văng lỗi
  const safeStudents = Array.isArray(students) ? students : [];
  const q = searchQuery.toLowerCase();
  const filteredStudents = q === ''
    ? safeStudents
    : safeStudents.filter((student) => {
        const name = (student?.full_name || '').toLowerCase();
        const sid = (student?.student_id || '').toLowerCase();
        const cls = (student?.class_name || '').toLowerCase();
        return name.includes(q) || sid.includes(q) || cls.includes(q);
      });

  if (studentsLoading || attendancesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <UserCheck className="w-8 h-8 text-blue-600" />
          Điểm danh vắng
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Đánh dấu học sinh vắng mặt trong buổi học
        </p>
      </div>

      {/* Date Selection & Actions */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Ngày điểm danh
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Ghi chú (tùy chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input-field"
              placeholder="Lý do vắng mặt..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleMarkAbsent}
            disabled={selectedStudents.length === 0 || markAbsentMutation.isLoading}
            className="btn-primary"
          >
            <Check className="w-4 h-4" />
            <span>Điểm danh vắng ({selectedStudents.length})</span>
          </button>
          <button
            onClick={() => setSelectedStudents([])}
            className="btn-secondary"
            disabled={selectedStudents.length === 0}
          >
            <X className="w-4 h-4" />
            <span>Bỏ chọn</span>
          </button>
        </div>

        {attendances && attendances.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>
                Đã điểm danh vắng <strong>{attendances.filter(a => a.is_absent).length}</strong> học sinh trong ngày {new Date(selectedDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm học sinh (MSSV, tên, lớp)..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Danh sách học sinh ({filteredStudents?.length || 0})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents && filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const isAbsent = isStudentAbsent(student.id);
              const isSelected = selectedStudents.includes(student.id);

              return (
                <button
                  key={student.id}
                  onClick={() => !isAbsent && toggleStudent(student.id)}
                  disabled={isAbsent}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isAbsent
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 dark:border-blue-600 shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {student.full_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        MSSV: {student.student_id}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Lớp: {student.class_name}
                      </p>
                    </div>
                    <div>
                      {isAbsent ? (
                        <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </div>
                      ) : isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-slate-400">
              <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Không tìm thấy học sinh nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
