import React, { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api';
import ReactMarkdown from 'react-markdown';

const EXAMPLE_QUESTIONS = [
  'Summarise the main topics in this document',
  'What are the key conclusions?',
  'Explain the most important concept',
  'What methodology was used?',
];

export default function QueryPanel({ selectedDoc, documents }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const bottomRef = useRef(null);

  const hasDocuments = documents.length > 0;
  const readyDocs = documents.filter(d => d.status === 'READY');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  const submit = async (q) => {
    const query = q || question;
    if (!query.trim() || loading || !readyDocs.length) return;

    setLoading(true);
    setError(null);
    const userMsg = { role: 'user', text: query, time: new Date() };
    setHistory(h => [...h, userMsg]);
    setQuestion('');

    try {
      const res = await api.ask(query, selectedDoc?.id || null);
      const data = res.data;
      setHistory(h => [...h, { role: 'assistant', ...data, time: new Date() }]);
    } catch (e) {
      const msg = e.response?.data?.message || e.message;
      setError(msg);
      setHistory(h => [...h, { role: 'error', text: msg, time: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Scope indicator */}
      {selectedDoc && (
        <div style={{
          padding: '8px 16px', marginBottom: 12,
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 8, fontSize: 12, color: '#a5b4fc',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>🎯</span>
          Searching within: <strong>{selectedDoc.name}</strong>
          <span style={{ color: '#475569', marginLeft: 4 }}>(click document again to search all)</span>
        </div>
      )}

      {/* Message history */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        {history.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
            <p style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>
              {readyDocs.length === 0
                ? 'Upload and process a PDF to start asking questions'
                : 'Ask anything about your documents'}
            </p>
            {readyDocs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {EXAMPLE_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => submit(q)}
                    style={{
                      padding: '8px 14px', borderRadius: 20,
                      border: '1px solid rgba(99,102,241,0.3)',
                      background: 'rgba(99,102,241,0.08)',
                      color: '#a5b4fc', fontSize: 12, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >{q}</button>
                ))}
              </div>
            )}
          </div>
        )}

        {history.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#6366f1',
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
            <span style={{ color: '#64748b', fontSize: 13 }}>Searching & generating answer…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 10, padding: '12px 0 0',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()}
          placeholder={readyDocs.length ? 'Ask a question about your documents…' : 'Upload a PDF first…'}
          disabled={!readyDocs.length || loading}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e2e8f0', fontSize: 14, outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={() => submit()}
          disabled={!question.trim() || loading || !readyDocs.length}
          style={{
            padding: '12px 20px', borderRadius: 12,
            background: !question.trim() || loading || !readyDocs.length
              ? 'rgba(99,102,241,0.2)' : '#6366f1',
            border: 'none', color: '#fff', fontWeight: 600,
            fontSize: 14, cursor: !question.trim() || loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          Ask →
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)}
        }
      `}</style>
    </div>
  );
}

function MessageBubble({ msg }) {
  const [showSources, setShowSources] = useState(false);

  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{
          maxWidth: '75%', padding: '10px 16px', borderRadius: '16px 16px 4px 16px',
          background: 'rgba(99,102,241,0.2)',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#e2e8f0', fontSize: 14, lineHeight: 1.6,
        }}>{msg.text}</div>
      </div>
    );
  }

  if (msg.role === 'error') {
    return (
      <div style={{
        marginBottom: 16, padding: '12px 16px', borderRadius: 12,
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.2)',
        color: '#fca5a5', fontSize: 14,
      }}>⚠ {msg.text}</div>
    );
  }

  // assistant
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        padding: '14px 16px', borderRadius: '4px 16px 16px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        color: '#cbd5e1', fontSize: 14, lineHeight: 1.7,
      }}>
        <ReactMarkdown>{msg.answer}</ReactMarkdown>

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 10, paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 11, color: '#475569' }}>
            ⚡ {msg.latencyMs}ms · {msg.sources?.length || 0} sources
          </span>
          {msg.sources?.length > 0 && (
            <button
              onClick={() => setShowSources(s => !s)}
              style={{
                background: 'none', border: 'none', color: '#6366f1',
                fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {showSources ? 'Hide sources ▲' : 'Show sources ▼'}
            </button>
          )}
        </div>

        {showSources && msg.sources?.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msg.sources.map((src, i) => (
              <div key={i} style={{
                padding: '10px 12px', borderRadius: 8,
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: 6, fontSize: 11,
                }}>
                  <span style={{ color: '#a5b4fc', fontWeight: 600 }}>
                    📄 {src.documentName} · chunk #{src.chunkIndex + 1}
                  </span>
                  <span style={{ color: '#475569' }}>
                    {(src.similarityScore * 100).toFixed(1)}% match
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                  {src.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
