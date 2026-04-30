import { useState, useEffect, useRef } from 'react';
import * as ImageJSNamespace from 'image-js';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// Handle different import behaviors of image-js
const ImageJS = (ImageJSNamespace as any).Image || ImageJSNamespace.Image || ImageJSNamespace;

interface MedicalImageViewerProps {
  url: string;
  title?: string;
}

export default function MedicalImageViewer({ url }: MedicalImageViewerProps) {
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoomMode, setZoomMode] = useState<'fit' | 'actual'>('fit');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset when URL changes
    setProcessedUrl(null);
    setIsEnhanced(false);
  }, [url]);

  const enhanceImage = async () => {
    if (processedUrl) {
      setIsEnhanced(!isEnhanced);
      return;
    }

    setLoading(true);
    try {
      // DO NOT add query params like cache-busters to a signed URL, 
      // as it invalidates the signature and causes 403 Forbidden.
      const response = await fetch(url, {
        mode: 'cors',
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      
      const image = await ImageJS.load(buffer);
      // Grayscale + Leveling is best for medical images
      let processed = image.grey().level();
      
      setProcessedUrl(processed.toDataURL());
      setIsEnhanced(true);
    } catch (err) {
      console.error('Enhancement failed:', err);
      alert('Could not enhance image. This is usually due to CORS restrictions on the storage bucket. Ensure "Share everything with every origin" is active and wait a minute for changes to propagate.');
    } finally {
      setLoading(false);
    }
  };

  const toggleZoom = () => {
    setZoomMode(prev => prev === 'fit' ? 'actual' : 'fit');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#000' }}>
      {/* Mini Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'var(--space-4)', padding: '12px',
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: 10
      }}>
        <button 
          onClick={enhanceImage} 
          disabled={loading}
          style={{
            ...btnStyle,
            color: isEnhanced ? 'var(--success)' : '#fff',
            borderColor: isEnhanced ? 'var(--success)' : 'rgba(255,255,255,0.2)'
          }}
        >
          {loading ? (
            <div className="loader" style={{ width: 14, height: 14, borderTopColor: '#fff' }} />
          ) : (
            <Sparkles size={16} />
          )}
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            {isEnhanced ? 'Enhanced' : 'Enhance Details'}
          </span>
        </button>

        <button onClick={toggleZoom} style={btnStyle}>
          {zoomMode === 'fit' ? <ZoomIn size={16} /> : <ZoomOut size={16} />}
          <span style={{ fontSize: 12, fontWeight: 600 }}>
            {zoomMode === 'fit' ? 'Actual Size' : 'Fit to Screen'}
          </span>
        </button>

        {isEnhanced && (
            <button onClick={() => setIsEnhanced(false)} style={btnStyle} title="Reset">
                <RotateCcw size={16} />
            </button>
        )}
      </div>

      {/* Image Area */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflow: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: zoomMode === 'fit' ? 'zoom-in' : 'zoom-out'
        }}
        onClick={toggleZoom}
      >
        <img
          src={isEnhanced && processedUrl ? processedUrl : url}
          crossOrigin="anonymous"
          alt="Preview"
          style={{ 
            width: zoomMode === 'fit' ? '100%' : 'auto',
            height: zoomMode === 'fit' ? '100%' : 'auto',
            maxWidth: zoomMode === 'fit' ? '100%' : 'none',
            maxHeight: zoomMode === 'fit' ? '100%' : 'none',
            objectFit: 'contain',
            display: 'block',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '20px',
  padding: '6px 16px',
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};
