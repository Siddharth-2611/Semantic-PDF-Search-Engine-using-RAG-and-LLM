# AI Document Search Engine (RAG)

An AI-powered document search engine built with **Retrieval-Augmented Generation (RAG)**. Upload PDF documents and ask questions in natural language — the system finds relevant sections using semantic search and generates accurate answers using an LLM.

![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.2-brightgreen?style=flat-square)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square)
![Python](https://img.shields.io/badge/Python-3.10+-yellow?style=flat-square)

---

## What it does

- Upload any PDF document
- Ask questions in natural language
- System retrieves the most relevant paragraphs using vector similarity search
- LLM generates a grounded answer with source citations
- Supports multiple documents with per-document filtering

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.3.2 |
| REST API | Spring Web MVC |
| Database | PostgreSQL (metadata + chunks) |
| PDF Parsing | Apache PDFBox 2.0.30 |
| Embeddings | Python Flask + sentence-transformers (all-MiniLM-L6-v2, 384-dim) |
| Vector Search | In-memory cosine similarity (Java) |
| LLM | Groq API — Llama 3.3 70B / Google Gemini 1.5 Flash |
| Frontend | React 18, Axios, react-dropzone, react-markdown |

---

## Architecture

```
INGESTION PIPELINE (once per PDF):
PDF → PDFBox (extract text) → ChunkingService (500 words, 50 overlap)
    → embedding_server.py (all-MiniLM-L6-v2) → 384-dim float[]
    → InMemoryVectorStore + PostgreSQL

QUERY PIPELINE (every question):
Question → embedding_server.py → cosine similarity search → top-5 chunks
         → Groq/Gemini LLM (context + question) → answer + sources
```

---

## Project Structure

```
ai-document-search/
├── embedding_server.py
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/rag/
│       ├── AiDocumentSearchApplication.java
│       ├── controller/DocumentController.java
│       ├── service/DocumentService.java
│       ├── rag/ChunkingService.java
│       ├── rag/LlmService.java
│       ├── embeddings/LocalEmbeddingService.java
│       ├── vectorstore/InMemoryVectorStore.java
│       ├── pdfparser/PdfParserService.java
│       ├── model/Document.java
│       ├── model/DocumentChunk.java
│       ├── dto/ApiDtos.java
│       └── config/AppConfig.java
└── frontend/
    ├── src/App.jsx
    ├── src/components/UploadZone.jsx
    ├── src/components/DocumentList.jsx
    ├── src/components/QueryPanel.jsx
    ├── src/hooks/useDocuments.js
    └── src/utils/api.js
```

---

## Getting Started

### Prerequisites
- Java 21+
- Node.js 18+
- PostgreSQL 14+
- Python 3.10+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/ai-document-search.git
cd ai-document-search
```

### 2. Setup PostgreSQL
```sql
CREATE DATABASE rag_db;
```

### 3. Configure backend
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.password=your_password
groq.api.key=gsk_your_key_here
groq.model=llama-3.3-70b-versatile
```

### 4. Start Python embedding server
```bash
pip install sentence-transformers flask
python embedding_server.py
```

### 5. Start backend
Open in IntelliJ → Run `AiDocumentSearchApplication.java`

### 6. Start frontend
```bash
cd frontend
npm install
npm start
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload PDF |
| GET | `/api/documents` | List documents |
| DELETE | `/api/documents/{id}` | Delete document |
| POST | `/api/ask` | Ask a question |

---

## How RAG Works

1. PDF text extracted using Apache PDFBox
2. Text split into 500-word overlapping chunks
3. Each chunk converted to 384-dimensional vector by all-MiniLM-L6-v2
4. Vectors stored in memory; text stored in PostgreSQL
5. User question embedded with same model
6. Cosine similarity finds top-5 most relevant chunks
7. LLM receives chunks as context and generates grounded answer

---

## Future Improvements

- [ ] Replace in-memory store with Pinecone or pgvector
- [ ] User authentication and role-based document access
- [ ] Multi-document chat with conversation history
- [ ] PDF page highlighting for answer sources
- [ ] Deploy on AWS with Docker

---

## License

MIT
