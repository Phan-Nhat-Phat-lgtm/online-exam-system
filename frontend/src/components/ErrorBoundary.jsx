import React from 'react';

/**
 * ErrorBoundary — Bắt mọi lỗi runtime trong cây React.
 *
 * Tại sao cần file này:
 * Trước đây main.jsx không có ErrorBoundary, nên bất kỳ lỗi runtime nào
 * (API ném exception, đọc thuộc tính của undefined, v.v.) đều làm cả cây
 * React sập → màn hình trắng hoàn toàn (triệu chứng "vào 1 giây rồi trắng").
 *
 * Có ErrorBoundary thì khi lỗi, app hiển thị một màn hình báo lỗi cụ thể
 * (kèm stack trace + nút copy / reload) thay vì trang trắng chết ngắt.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Lưu errorInfo để hiển thị stack trace
    this.setState({ errorInfo });
    // Log ra console cho dễ debug
    console.error('[ErrorBoundary] Lỗi runtime:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const text = `${error?.toString() || 'Unknown error'}\n\nComponent stack:\n${errorInfo?.componentStack || 'N/A'}`;
    navigator.clipboard?.writeText(text);
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const isDev = import.meta.env?.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center">
              <svg className="w-8 h-8 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
              </svg>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
              Ứng dụng gặp lỗi
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Đã có lỗi runtime xảy ra khi tải trang. Thử tải lại trang, nếu vẫn lỗi hãy báo kèm nội dung lỗi bên dưới.
            </p>

            {isDev && error && (
              <div className="mb-6 text-left">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chi tiết lỗi</div>
                <pre className="text-xs bg-slate-100 dark:bg-slate-950 text-rose-600 dark:text-rose-400 p-3 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap break-all border border-slate-200 dark:border-slate-800">
                  {error.toString()}
                </pre>
                {errorInfo?.componentStack && (
                  <details className="mt-2">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                      Xem component stack
                    </summary>
                    <pre className="text-[11px] bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 p-3 rounded-lg overflow-auto max-h-32 mt-2 whitespace-pre-wrap break-all border border-slate-200 dark:border-slate-800">
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary px-6 py-2.5"
              >
                Tải lại trang
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn-secondary px-6 py-2.5"
              >
                Về trang chủ
              </button>
              {isDev && (
                <button
                  onClick={this.handleCopyError}
                  className="btn-secondary px-6 py-2.5"
                >
                  Copy lỗi
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
