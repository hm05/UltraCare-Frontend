import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Point to the worker bundled with pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  url: string;
  title?: string;
}

export default function PdfViewer({ url }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load PDF document — fetch as binary first to avoid CORS with signed URLs
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        // Fetch the PDF as binary data via the browser's fetch API (handles CORS)
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        if (cancelled) return;

        const doc = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;
        setPdf(doc);
        setNumPages(doc.numPages);
        setPage(1);
      } catch (err: any) {
        if (!cancelled) {
          console.error('PDF load error:', err);
          setError('Failed to load PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPdf();
    return () => { cancelled = true; };
  }, [url]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current) return;

    try {
      const pageObj = await pdf.getPage(page);
      
      // Handle high-DPI screens
      const dpr = window.devicePixelRatio || 1;
      const viewport = pageObj.getViewport({ scale: scale * dpr, rotation });
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;

      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      await pageObj.render({ 
        canvasContext: ctx, 
        viewport,
        canvas: canvas // Fixed TS error: required property
      } as any).promise;
    } catch (err) {
      console.error('Page render error:', err);
    }
  }, [pdf, page, scale, rotation]);

  useEffect(() => { renderPage(); }, [renderPage]);

  // Initial fit-to-width
  useEffect(() => {
    if (pdf && containerRef.current && scale === 1.5) {
      const fitToWidth = async () => {
        try {
          const pageObj = await pdf.getPage(1);
          const viewport = pageObj.getViewport({ scale: 1, rotation });
          const containerWidth = containerRef.current!.clientWidth - 64; // More padding
          const newScale = containerWidth / viewport.width;
          setScale(newScale);
        } catch (err) {
          console.error('Fit to width error:', err);
        }
      };
      // Short delay to ensure container dimensions are settled
      const timer = setTimeout(fitToWidth, 100);
      return () => clearTimeout(timer);
    }
  }, [pdf]);

  const prevPage = () => setPage(p => Math.max(1, p - 1));
  const nextPage = () => setPage(p => Math.min(numPages, p + 1));
  const zoomIn = () => setScale(s => Math.min(5, s * 1.2));
  const zoomOut = () => setScale(s => Math.max(0.1, s / 1.2));
  const rotate = () => setRotation(r => (r + 90) % 360);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prevPage(); }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); nextPage(); }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn(); }
      if (e.key === '-') { e.preventDefault(); zoomOut(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [numPages]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--text-secondary)', background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="loader" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 'var(--font-size-sm)' }}>Loading PDF…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: 'var(--danger)', background: 'var(--bg-primary)'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      width: '100%', 
      background: 'var(--bg-primary)',
      transition: 'background var(--transition-base)'
    }}>
      {/* Toolbar (Bezels) */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-4)',
        background: 'var(--bg-secondary)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        boxShadow: 'var(--shadow-sm)',
        zIndex: 10,
      }}>
        {/* Page nav */}
        <button onClick={prevPage} disabled={page <= 1} style={toolBtnStyle} title="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span style={{
          fontSize: 13, color: 'var(--text-primary)', fontWeight: 600,
          minWidth: 80, textAlign: 'center', userSelect: 'none',
        }}>
          {page} / {numPages}
        </span>
        <button onClick={nextPage} disabled={page >= numPages} style={toolBtnStyle} title="Next page">
          <ChevronRight size={16} />
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 var(--space-2)' }} />

        {/* Zoom */}
        <button onClick={zoomOut} style={toolBtnStyle} title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <span style={{
          fontSize: 12, color: 'var(--text-secondary)', minWidth: 50, textAlign: 'center', userSelect: 'none', fontWeight: 500
        }}>
          {Math.round(scale * 100)}%
        </span>
        <button onClick={zoomIn} style={toolBtnStyle} title="Zoom in">
          <ZoomIn size={16} />
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 var(--space-2)' }} />

        {/* Rotate */}
        <button onClick={rotate} style={toolBtnStyle} title="Rotate">
          <RotateCw size={16} />
        </button>

        {/* Download */}
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...toolBtnStyle, textDecoration: 'none' }} title="Download">
          <Download size={16} />
        </a>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        style={{
          flex: 1, overflow: 'auto', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 24px',
          background: 'var(--bg-tertiary)', // Contrast background for the paper
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 4,
            background: '#fff', // Always white for the actual paper
          }}
        />
      </div>
    </div>
  );
}

const toolBtnStyle: React.CSSProperties = {
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  width: 34,
  height: 34,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
  padding: 0,
  boxShadow: 'var(--shadow-sm)',
};
