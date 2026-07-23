import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import QuestionBanks from './pages/QuestionBanks';
import Questions from './pages/Questions';
import Exams from './pages/Exams';
import StudentExams from './pages/StudentExams';
import ExamTaking from './pages/ExamTaking';
import Results from './pages/Results';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Authenticated Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/results" element={<Results />} />
              <Route path="/student-exams" element={<StudentExams />} />
            </Route>

            {/* Admin Only Routes */}
            <Route element={<PrivateRoute adminOnly={true} />}>
              <Route path="/students" element={<Students />} />
              <Route path="/banks" element={<QuestionBanks />} />
              <Route path="/questions" element={<Questions />} />
              <Route path="/exams" element={<Exams />} />
            </Route>

            {/* Fullscreen Exam Taking route */}
            <Route
              path="/exam/:id"
              element={
                <PrivateRoute>
                  <ExamTaking />
                </PrivateRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
