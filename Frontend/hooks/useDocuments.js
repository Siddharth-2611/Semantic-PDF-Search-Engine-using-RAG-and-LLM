import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    // Don't fetch if no token — prevents 401 on startup
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await api.listDocuments();
      setDocuments(res.data);
      setError(null);
    } catch (e) {
      // Don't set error on 401/403 — interceptor handles redirect
      if (e.response?.status !== 401 && e.response?.status !== 403) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetch();
  }, [fetch]);

  // Poll PROCESSING documents until READY/FAILED
  useEffect(() => {
    const processing = documents.filter(d =>
      d.status === 'PROCESSING' || d.status === 'UPLOADING'
    );
    if (processing.length === 0) return;
    const interval = setInterval(fetch, 3000);
    return () => clearInterval(interval);
  }, [documents, fetch]);

  const upload = useCallback(async (file, onProgress) => {
    const res = await api.upload(file, onProgress);
    await fetch();
    return res.data;
  }, [fetch]);

  const remove = useCallback(async (id) => {
    await api.deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  return { documents, loading, error, fetch, upload, remove };
}
