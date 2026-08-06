import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** 自定义兜底渲染 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * 全局错误边界：捕获子树渲染异常，提供重置入口，避免整页白屏。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 真实交付可在此上报到监控平台
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="min-h-[60vh] grid place-items-center px-6 text-center">
          <div className="max-w-md">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 grid place-items-center mb-4">
              <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-bold">页面渲染异常</h2>
            <p className="mt-2 text-sm text-bone-400 break-all">
              {this.state.error.message || "发生未知错误"}
            </p>
            <button
              onClick={this.reset}
              className="mt-5 h-9 px-5 rounded-xl btn-gold text-sm"
            >
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
