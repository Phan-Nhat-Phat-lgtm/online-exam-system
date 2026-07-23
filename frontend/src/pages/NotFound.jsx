import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-extrabold text-blue-600 mb-2">404</h1>
      <p className="text-xl font-bold text-slate-900 dark:text-white mb-4">Trang không tồn tại</p>
      <Link to="/" className="btn-primary">
        Quay lại trang chủ
      </Link>
    </div>
  );
};

export default NotFound;
