import React, { useState } from 'react';
import AuthPage from './pages/AuthPage';
import UploadZone from './components/UploadZone';
import DocumentList from './components/DocumentList';
import QueryPanel from './components/QueryPanel';
import { useDocuments } from './hooks/useDocuments';

const getInitialUser = () => {
  try {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (!token || !saved) return null;
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState(getInitialUser);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const { documents, loading, upload, remove } = useDocuments();

  const handleLogin = (data) => {
    setUser({ name: data.name, email: data.email });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) return <AuthPage onLogin={handleLogin} />;

  const handleUpload = async (file, onProgress) => {
    await upload(file, onProgress);
    setSelectedDoc(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    if (selectedDoc?.id === id) setSelectedDoc(null);
    await remove(id);
  };

  const readyCount = documents.filter(d => d.status === 'READY').length;

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0',
      fontFamily: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(50, 50, 50, 0.8)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700,
          }}>⚡</div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              AI Document Search Engine
            </h1>
            <p style={{ fontSize: 11, color: '#708095', margin: 0 }}>
              Semantic Search using RAG and LLM
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#f9f9f9' }}>
            <span>📄 {documents.length} docs</span>
            <span style={{ color: '#22c55e' }}>✓ {readyCount} ready</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(99,102,241,0.2)',
              border: '1px solid rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#a5b4fc',
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{user.name}</span>
            <button onClick={handleLogout} style={{
              background: '#6366f1', border: '1px solid #6366f1',
              color: '#ffffff', fontSize: 12, padding: '4px 10px',
              borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }}>Logout</button>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '340px 1fr',
        height: 'calc(100vh - 69px)', overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <aside style={{
          borderRight: '1px solid rgba(59, 56, 56, 0.93)',
          overflowY: 'auto', padding: 24,
          display: 'flex', flexDirection: 'column', gap: 24,
          background: 'rgba(28, 27, 27, 0.98)',
        }}>
          <section>
            <h2 style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#ffffff', marginBottom: 12,
            }}>Upload</h2>
            <UploadZone onUpload={handleUpload} />
          </section>

          <section style={{ flex: 1 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 12,
            }}>
              <h2 style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#ffffff', margin: 0,
              }}>Documents</h2>
              {loading && <span style={{ fontSize: 11, color: '#475569' }}>Refreshing…</span>}
            </div>
            <DocumentList
              documents={documents} selected={selectedDoc}
              onSelect={setSelectedDoc} onDelete={handleDelete}
            />
          </section>

        
        </aside>

        {/* Query area */}
        <main style={{ padding: 28, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <QueryPanel selectedDoc={selectedDoc} documents={documents} />
        </main>
      </div>
    </div>
  );
}
