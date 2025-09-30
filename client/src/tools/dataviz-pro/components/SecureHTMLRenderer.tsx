import React, { useState, useRef, useEffect } from 'react';

interface SecureHTMLRendererProps {
  htmlContent: string;
  isLoading?: boolean;
  error?: string;
  onError?: (error: string) => void;
}

/**
 * Secure HTML Renderer Component
 * Renders LLM-generated HTML content in a sandboxed iframe
 */
export const SecureHTMLRenderer: React.FC<SecureHTMLRendererProps> = ({ 
  htmlContent, 
  isLoading = false, 
  error,
  onError 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  useEffect(() => {
    if (!htmlContent || error) {
      setIsContentLoaded(false);
      return;
    }

    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Reset state
      setRenderError(null);
      setIsContentLoaded(false);

      // Create a blob URL for the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);

      // Set up iframe load handler
      const handleLoad = () => {
        setIsContentLoaded(true);
        URL.revokeObjectURL(blobUrl);
      };

      const handleError = () => {
        const errorMsg = 'Failed to render dashboard content';
        setRenderError(errorMsg);
        onError?.(errorMsg);
        URL.revokeObjectURL(blobUrl);
      };

      iframe.addEventListener('load', handleLoad);
      iframe.addEventListener('error', handleError);

      // Set the iframe source
      iframe.src = blobUrl;

      // Cleanup function
      return () => {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        URL.revokeObjectURL(blobUrl);
      };
    } catch (err) {
      const errorMsg = 'Error preparing dashboard content';
      setRenderError(errorMsg);
      onError?.(errorMsg);
    }
  }, [htmlContent, error, onError]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-96 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Generating your dashboard...</p>
          <p className="text-slate-500 text-sm mt-1">AI is analyzing your data and creating visualizations</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || renderError) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-red-900 font-medium mb-2">Dashboard Generation Failed</h3>
          <p className="text-red-700 text-sm">{error || renderError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No content state
  if (!htmlContent) {
    return (
      <div className="w-full h-96 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-600">No dashboard content to display</p>
        </div>
      </div>
    );
  }

  // Main render with iframe
  return (
    <div className="relative w-full">
      {/* Loading overlay while content loads */}
      {!isContentLoaded && (
        <div className="absolute inset-0 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-pulse w-8 h-8 bg-slate-300 rounded-full mx-auto mb-2"></div>
            <p className="text-slate-500 text-sm">Loading dashboard...</p>
          </div>
        </div>
      )}
      
      {/* Sandboxed iframe for HTML content */}
      <iframe
        ref={iframeRef}
        className="w-full h-screen rounded-lg border border-slate-200 shadow-sm"
        title="Generated Dashboard"
        sandbox="allow-scripts allow-same-origin"
        style={{ 
          minHeight: '600px',
          transition: 'opacity 0.3s ease',
          opacity: isContentLoaded ? 1 : 0
        }}
        frameBorder="0"
      />
      
      {/* Dashboard controls */}
      {isContentLoaded && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-slate-500">
            AI-generated dashboard • Secure sandbox mode
          </div>
          <div className="space-x-2">
            <button 
              onClick={() => {
                const iframe = iframeRef.current;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.print();
                }
              }}
              className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
            >
              Print
            </button>
            <button 
              onClick={() => {
                // Create download link for HTML content
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dashboard.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};