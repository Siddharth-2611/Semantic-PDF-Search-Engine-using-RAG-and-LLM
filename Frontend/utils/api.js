import axios from 'axios';

const BASE = '/api';

export const api = {
  // Upload a PDF
  upload: (file, onProgress) => {
    const form = new FormData();
    form.append('file', file);
    return axios.post(`${BASE}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: e => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
    });
  },

  // Ask a question
  ask: (question, documentId = null, topK = 5) =>
    axios.post(`${BASE}/ask`, { question, documentId, topK }),

  // List all documents
  listDocuments: () => axios.get(`${BASE}/documents`),

  // Get single document
  getDocument: (id) => axios.get(`${BASE}/documents/${id}`),

  // Delete document
  deleteDocument: (id) => axios.delete(`${BASE}/documents/${id}`),

  // Health check
  health: () => axios.get(`${BASE}/health`),
};

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const statusColor = (status) => ({
  READY: '#22c55e',
  PROCESSING: '#f59e0b',
  UPLOADING: '#3b82f6',
  FAILED: '#ef4444',
}[status] || '#6b7280');
