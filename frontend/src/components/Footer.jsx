import React from 'react';

const Footer = ({ className = '' }) => (
  <footer className={`text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed ${className}`}>
    <p>© 2026 Phan Nhật Phát. All Rights Reserved.</p>
    <p>Designed &amp; Developed by Phan Nhật Phát.</p>
  </footer>
);

export default Footer;
