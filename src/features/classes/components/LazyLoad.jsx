import React, { Component } from "react";

class LazyLoadErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[LazyLoad] Chunk load failed:", error);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="flex items-center justify-center p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/30">
                    <div className="text-center">
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">Gagal memuat komponen</p>
                        <button
                            onClick={() => this.setState({ error: null })}
                            className="mt-2 text-xs text-red-500 underline hover:text-red-700"
                        >
                            Coba lagi
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function LazyLoad({ children, fallback = null }) {
    return (
        <LazyLoadErrorBoundary>
            <React.Suspense fallback={fallback}>
                {children}
            </React.Suspense>
        </LazyLoadErrorBoundary>
    );
}
