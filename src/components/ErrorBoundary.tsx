import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      errorMessage: '',
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Erro inesperado na aplicação.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught Error in App:', error, errorInfo);
  }

  private handleRetry = () => {
    (this as any).setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  public render() {
    const state = (this as any).state as State;
    const props = (this as any).props as Props;

    if (state?.hasError) {
      return (
        <div className="min-h-screen bg-[#0B1220] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">
                Não foi possível conectar ao banco de dados.
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Verifique sua conexão ou tente novamente em alguns instantes.
              </p>
            </div>

            {state.errorMessage && (
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400 overflow-x-auto text-left">
                {state.errorMessage}
              </div>
            )}

            <button
              onClick={this.handleRetry}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tentar Novamente</span>
            </button>
          </div>
        </div>
      );
    }

    return props.children;
  }
}
