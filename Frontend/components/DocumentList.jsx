import React from 'react';
import { formatBytes, formatDate, statusColor } from '../utils/api';

export default function DocumentList({ documents, selected, onSelect, onDelete }) {
  if (!documents.length) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center', color: '#475569' }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
        <p style={{ fontSize: 13 }}>No documents yet. Upload a PDF to get started.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {documents.map(doc => {
        const isSelected = selected?.id === doc.id;
        const isReady = doc.status === 'READY';
        const color = statusColor(doc.status);

        return (
          <div
            key={doc.id}
            onClick={() => isReady && onSelect(isSelected ? null : doc)}
            style={{
              padding: '12px 14px',
              borderRadius: 10,
              border: `1px solid ${isSelected ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.06)'}`,
              background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
              cursor: isReady ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
              display: 'flex', alignItems: 'center', gap: 12,
            }}
          >
            {/* File icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: 'rgba(99,102,241,0.12)',
              border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>📄</div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: '#e2e8f0',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                marginBottom: 2,
              }}>{doc.name}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Status badge */}
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                  color, textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: color, display: 'inline-block',
                    animation: doc.status === 'PROCESSING' ? 'pulse 1s infinite' : 'none',
                  }} />
                  {doc.status}
                </span>
                {doc.totalChunks && (
                  <span style={{ fontSize: 11, color: '#475569' }}>
                    {doc.totalChunks} chunks
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#475569' }}>
                  {formatBytes(doc.fileSize)}
                </span>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(doc.id); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#475569', fontSize: 16, padding: '4px 6px',
                borderRadius: 6, flexShrink: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.target.style.color = '#ef4444'}
              onMouseLeave={e => e.target.style.color = '#475569'}
              title="Delete document"
            >✕</button>
          </div>
        );
      })}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
