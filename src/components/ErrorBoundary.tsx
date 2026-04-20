'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8" style={{ background: '#0A0A0F' }}>
          <div
            className="text-center p-6 rounded-xl max-w-md"
            style={{ background: '#111118', border: '1px solid #1A1A1A' }}
          >
            <p className="text-sm text-white mb-2">⚠️ 페이지 로딩 중 오류가 발생했습니다</p>
            <p className="text-xs mb-4" style={{ color: '#555' }}>
              {this.state.error?.message || '알 수 없는 오류'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-lg text-xs font-bold cursor-pointer"
              style={{ background: 'rgba(0,255,65,0.1)', color: '#00FF41', border: '1px solid rgba(0,255,65,0.2)' }}
            >
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
