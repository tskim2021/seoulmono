import { cn } from "@/lib/utils";
import { AlertTriangle, Home, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
          <div className="flex flex-col items-center w-full max-w-lg text-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl font-bold text-foreground mb-2">
              문제가 발생했습니다
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              예기치 않은 오류가 발생했습니다.<br />
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={this.handleRetry}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 transition-opacity cursor-pointer"
                )}
              >
                <RotateCcw className="w-4 h-4" />
                다시 시도
              </button>
              <button
                onClick={this.handleGoHome}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm",
                  "border border-border bg-background text-foreground",
                  "hover:bg-secondary transition-colors cursor-pointer"
                )}
              >
                <Home className="w-4 h-4" />
                홈으로
              </button>
            </div>

            {/* Error Details (collapsible) */}
            {this.state.error && (
              <div className="w-full">
                <button
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1.5 mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  오류 상세 정보
                </button>
                {this.state.showDetails && (
                  <div className="mt-3 p-4 rounded-lg bg-muted overflow-auto max-h-48 text-left">
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {this.state.error.message}
                      {"\n\n"}
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
