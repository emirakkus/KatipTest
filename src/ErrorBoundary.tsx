import React from 'react';

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('KatipTest ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#fff',
          padding: '24px',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ maxWidth: 520, textAlign: 'center', background: '#1e293b', border: '1px solid #334155', borderRadius: 20, padding: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>⚠️</div>
            <h1 style={{ fontSize: 28, marginBottom: 12 }}>Bir hata oluştu</h1>
            <p style={{ color: '#94a3b8', marginBottom: 20 }}>
              Sayfa beklenmeyen bir durumla karşılaştı. Uygulamayı güvenli şekilde yeniden başlatabilirsiniz.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '12px 20px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
