import React, { useState } from 'react';
import UploadZone from './components/UploadZone';
import DocumentList from './components/DocumentList';
import QueryPanel from './components/QueryPanel';
import { useDocuments } from './hooks/useDocuments';

export default function App() {
  const { documents, loading, upload, remove } = useDocuments();
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleUpload = async (file, onProgress) => {
    await upload(file, onProgress);
    setSelectedDoc(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document and all its data?')) return;
    if (selectedDoc?.id === id) setSelectedDoc(null);
    await remove(id);
  };

  const readyCount = documents.filter(d => d.status === 'READY').length;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#262627',
      color: '#e2e8f0',
      fontFamily: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── Header ── */}
      <header style={{
        padding: '16px 32px',
        borderBottom: '1px solid rgb(1, 211, 54)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(2, 219, 27, 0.89)',
        backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #101010, #ff0090)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700,
          }}>⚡</div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              RAG Document Search
            </h1>
            <p style={{ fontSize: 11, color: '#d2d2d2', margin: 0 }}>
              Spring Boot · HuggingFace · Semantic Search
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#475569' }}>
          <span>📄 {documents.length} docs</span>
          <span style={{ color: '#0d0d0d' }}>✓ {readyCount} ready</span>
        </div>
      </header>

      {/* ── Main layout ── */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        height: 'calc(100vh - 69px)',
        overflow: 'hidden',
      }}>

        {/* ── Left sidebar ── */}
        <aside style={{
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          background: 'rgba(255,255,255,0.01)',
        }}>
          {/* Upload */}
          <section>
            <h2 style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#edf1f5', marginBottom: 12,
            }}>Upload</h2>
            <UploadZone onUpload={handleUpload} />
          </section>

          {/* Documents */}
          <section style={{ flex: 1 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 12,
            }}>
              <h2 style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#edf1f5', margin: 0,
              }}>Documents</h2>
              {loading && <span style={{ fontSize: 11, color: '#edf1f5' }}>Refreshing…</span>}
            </div>

            {selectedDoc && (
              <div style={{
                fontSize: 11, color: '#6366f1', marginBottom: 8,
                padding: '4px 8px', background: 'rgba(99,102,241,0.08)',
                borderRadius: 6,
              }}>
                🎯 Filtering by: {selectedDoc.name}
              </div>
            )}

            <DocumentList
              documents={documents}
              selected={selectedDoc}
              onSelect={setSelectedDoc}
              onDelete={handleDelete}
            />
          </section>

          {/* Pipeline diagram hint */}
          {/* <div style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.1)',
            fontSize: 11, color: '#475569', lineHeight: 1.7,
          }}>
            <p style={{ margin: '0 0 6px', color: '#6366f1', fontWeight: 600 }}>RAG Pipeline</p>
            PDF → Extract → Chunk → Embed → FAISS → Cosine Search → LLM → Answer
          </div> */}
        </aside>

        {/* ── Right: Query area ── */}
        <main style={{ padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <QueryPanel selectedDoc={selectedDoc} documents={documents} />
        </main>
      </div>
    </div>
  );
}
