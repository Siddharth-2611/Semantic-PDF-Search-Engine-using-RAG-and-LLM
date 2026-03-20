import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export default function UploadZone({ onUpload }) {
  const [progress, setProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragMsg, setDragMsg] = useState('');

  const onDrop = useCallback(async (accepted) => {
    if (!accepted.length) return;
    const file = accepted[0];
    if (!file.name.endsWith('.pdf')) {
      alert('Only PDF files are supported.');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      await onUpload(file, (pct) => setProgress(pct));
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: `2px dashed ${isDragActive ? '#6366f1' : '#334155'}`,
        borderRadius: 16,
        padding: '40px 24px',
        textAlign: 'center',
        cursor: uploading ? 'not-allowed' : 'pointer',
        background: isDragActive ? 'rgba(63, 63, 67, 0.06)' : 'rgba(63, 68, 81, 0.5)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <input {...getInputProps()} />

      {/* Animated grid background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
      }} />

      {/* Upload icon */}
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'rgba(61, 62, 100, 0.15)',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        fontSize: 24,
      }}>
        {uploading ? '⏳' : '📄'}
      </div>

      {uploading ? (
        <>
          <p style={{ color: '#a5b4fc', fontFamily: 'monospace', marginBottom: 12 }}>
            Processing... {progress}%
          </p>
          <div style={{
            height: 4, borderRadius: 4, background: '#1e293b',
            overflow: 'hidden', maxWidth: 240, margin: '0 auto',
          }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              transition: 'width 0.3s ease', borderRadius: 4,
            }} />
          </div>
        </>
      ) : (
        <>
          <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 16, marginBottom: 4 }}>
            {isDragActive ? 'Drop your PDF here' : 'Drop a PDF or click to browse'}
          </p>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            Up to 50 MB · Text will be extracted, chunked & embedded
          </p>
        </>
      )}
    </div>
  );
}
