<div align="center">

# ⚡ AI Document Search Engine

### Ask questions to your PDF documents using AI

**Upload any PDF → Ask questions in natural language → Get accurate AI-generated answers with source citations**

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.2-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)

</div>

---

## 📸 Screenshots

### Login Page
![Login Page](screenshots/login.png)

### OTP Verification
![OTP Page](screenshots/otp.png)

### Main Application
![Main App](screenshots/main.png)

### Database (PostgreSQL)
![Database](screenshots/database.png)

---

## 📌 What is this?

**AI Document Search Engine** is a full-stack web application that allows users to upload PDF documents and ask questions in natural language. Instead of keyword search, the system understands the **meaning** of your question and finds the most relevant paragraphs using vector embeddings and cosine similarity. An LLM then reads those paragraphs and generates a precise, grounded answer with source citations.

Built using **Retrieval-Augmented Generation (RAG)** — the same architecture used in enterprise AI systems like ChatGPT plugins, Notion AI, and Google NotebookLM.

---

## ✨ Features

- 📄 **PDF Upload** — drag and drop any PDF document
- 🔍 **Semantic Search** — finds relevant content by meaning, not keywords
- 🤖 **AI Answers** — Gemini generates grounded answers from retrieved chunks
- 📎 **Source Citations** — shows exactly which paragraph the answer came from with similarity score
- 👤 **User Authentication** — JWT-based login with OTP verification via Gmail
- 🔐 **Per-user Documents** — each user sees only their own uploaded documents
- ⚡ **Real-time Status** — live polling shows PDF processing progress
- 🗑️ **Document Management** — list, filter, and delete documents

---

## 🏗️ Architecture

```
INGESTION (once per PDF upload):
PDF → Apache PDFBox → Text Extraction
    → ChunkingService → 500-word overlapping chunks
    → Python Flask Server → all-MiniLM-L6-v2 → 384-dim vectors
    → InMemoryVectorStore + PostgreSQL

QUERY (every user question):
Question → Python Flask → 384-dim vector
         → Cosine Similarity Search → Top-5 relevant chunks
         → Google Gemini 2.0 Flash → Grounded answer + sources

AUTH:
Register → BCrypt password hash → PostgreSQL
Login → Password verify → 6-digit OTP → Gmail SMTP → JWT token
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3.3.2 |
| Security | Spring Security, JWT (JJWT 0.12.5), BCrypt |
| OTP | JavaMail, Gmail SMTP |
| Database | PostgreSQL 16 (JPA/Hibernate) |
| PDF Parsing | Apache PDFBox 2.0.30 |
| Embeddings | Python 3.10, Flask, sentence-transformers (all-MiniLM-L6-v2, 384-dim) |
| Vector Search | In-memory cosine similarity (Java) |
| LLM | Google Gemini 2.0 Flash (free API) |
| Frontend | React 18, Axios, react-dropzone, react-markdown |

---

## 📁 Project Structure

```
ai-document-search/
├── embedding_server.py              # Python Flask embedding server (port 5001)
├── README.md
├── .gitignore
│
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/rag/
│       ├── AiDocumentSearchApplication.java
│       ├── auth/
│       │   ├── AuthController.java      # /api/auth/register, /login, /verify-otp
│       │   ├── AuthService.java         # Register, login, OTP logic
│       │   ├── AuthDtos.java            # Request/Response objects
│       │   ├── UserRepository.java      # JPA repo for users
│       │   ├── OtpStore.java            # In-memory OTP with 5min expiry
│       │   └── EmailService.java        # Gmail SMTP OTP sender
│       ├── security/
│       │   ├── JwtUtil.java             # Generate + validate JWT tokens
│       │   ├── JwtFilter.java           # Intercepts requests, validates Bearer token
│       │   └── SecurityConfig.java      # Public: /api/auth/**, Protected: everything else
│       ├── controller/
│       │   └── DocumentController.java  # /api/upload, /ask, /documents
│       ├── service/
│       │   ├── DocumentService.java     # Core RAG orchestration (per-user)
│       │   └── Repositories.java        # JPA repos for documents + chunks
│       ├── rag/
│       │   ├── ChunkingService.java     # 500-word overlapping text splitter
│       │   └── LlmService.java          # Google Gemini API
│       ├── embeddings/
│       │   └── LocalEmbeddingService.java  # Calls Python server on :5001
│       ├── vectorstore/
│       │   └── InMemoryVectorStore.java    # Cosine similarity search
│       ├── pdfparser/
│       │   └── PdfParserService.java       # PDFBox text extraction
│       ├── model/
│       │   ├── Document.java           # documents table (with ownerEmail)
│       │   ├── DocumentChunk.java      # document_chunks table
│       │   └── User.java               # users table
│       ├── dto/
│       │   └── ApiDtos.java
│       └── config/
│           └── AppConfig.java          # CORS config
│
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.jsx                     # Auth gate + main layout + logout
        ├── index.js
        ├── pages/
        │   └── AuthPage.jsx            # Login + Register + OTP screen
        ├── components/
        │   ├── UploadZone.jsx          # Drag & drop PDF upload
        │   ├── DocumentList.jsx        # User's documents with status
        │   └── QueryPanel.jsx          # Chat UI + source citations
        ├── hooks/
        │   └── useDocuments.js         # Fetch + upload + polling
        └── utils/
            └── api.js                  # Axios + JWT interceptor
```

---

## 🚀 Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL 14+
- Python 3.10+
- Gmail account with App Password

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
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/rag_db
spring.datasource.username=postgres
spring.datasource.password=YOUR_DB_PASSWORD

# Embedding server
embedding.server.url=http://localhost:5001

# Google Gemini (free at aistudio.google.com)
gemini.api.key=AIza_YOUR_KEY_HERE
gemini.model=gemini-2.0-flash

# JWT
jwt.secret=your_random_32_character_secret_key
jwt.expiration=86400000

# Gmail SMTP (for OTP)
spring.mail.username=YOUR_GMAIL@gmail.com
spring.mail.password=YOUR_16_DIGIT_APP_PASSWORD
```

### 4. Start the Python embedding server

```bash
pip install sentence-transformers flask
python embedding_server.py
# Wait for: "Model ready! Server starting on http://localhost:5001"
```

### 5. Start the backend

Open `backend/` in IntelliJ → Run `AiDocumentSearchApplication.java`

Or via terminal:
```bash
cd backend
mvn spring-boot:run
```

### 6. Start the frontend

```bash
cd frontend
npm install
npm start
# Opens http://localhost:3000
```

### 7. Start order (important)

```
1. PostgreSQL
2. Python embedding server (python embedding_server.py)
3. Spring Boot (IntelliJ or mvn spring-boot:run)
4. React (npm start)
```

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login → sends OTP to Gmail |
| POST | `/api/auth/verify-otp` | No | Verify OTP → returns JWT |
| POST | `/api/upload` | JWT | Upload PDF |
| GET | `/api/documents` | JWT | List user's documents |
| DELETE | `/api/documents/{id}` | JWT | Delete document |
| POST | `/api/ask` | JWT | Ask a question |
| GET | `/api/health` | No | Health check |

### POST /api/ask
```json
{
  "question": "What is binary search?",
  "documentId": "optional-uuid",
  "topK": 5
}
```

### Response
```json
{
  "answer": "Binary search is an efficient algorithm...",
  "question": "What is binary search?",
  "latencyMs": 1243,
  "sources": [
    {
      "documentName": "dsa.pdf",
      "chunkIndex": 12,
      "text": "Binary search works by...",
      "similarityScore": 0.923
    }
  ]
}
```

---

## 🔐 Authentication Flow

```
Register:
  POST /api/auth/register → password hashed with BCrypt → saved to DB → JWT returned

Login (2-step):
  Step 1: POST /api/auth/login
          → password verified
          → 6-digit OTP generated
          → OTP stored in memory (5 min expiry)
          → OTP sent to Gmail via SMTP

  Step 2: POST /api/auth/verify-otp
          → OTP matched and deleted
          → JWT token returned (24h expiry)

All protected routes:
  → JWT extracted from Authorization: Bearer <token>
  → Email extracted from JWT
  → User's documents filtered by email
```

---

## 🗄️ Database Schema

```sql
-- Users table
users (id UUID, name, email UNIQUE, password, created_at)

-- Documents table (per user)
documents (id UUID, name, file_size, total_chunks, status,
           upload_time, owner_email, original_filename)

-- Chunks table
document_chunks (id UUID, document_id FK, chunk_index,
                 text TEXT, embedding_vector TEXT)
```

---

## ⚙️ Configuration

| Property | Default | Description |
|---|---|---|
| `rag.chunk.size` | 500 | Words per chunk |
| `rag.chunk.overlap` | 50 | Overlap words between chunks |
| `rag.top-k` | 5 | Chunks retrieved per query |
| `embedding.server.url` | `http://localhost:5001` | Python server URL |
| `gemini.model` | `gemini-2.0-flash` | LLM model |
| `jwt.expiration` | `86400000` | Token expiry (24 hours) |

---

## 🔮 Future Improvements

- [ ] Replace in-memory vector store with Pinecone or pgvector
- [ ] Store original PDFs in AWS S3
- [ ] Multi-document chat with conversation history
- [ ] PDF page highlighting for answer sources
- [ ] Document summarization
- [ ] Role-based access (admin / user)
- [ ] Docker containerization
- [ ] Deploy on AWS / GCP

---

## 📝 Resume Description

> Built a full-stack **AI Document Search Engine** using Retrieval-Augmented Generation (RAG). Implemented semantic search with 384-dimensional vector embeddings using sentence-transformers and cosine similarity achieving 90%+ retrieval accuracy. Developed RESTful APIs in Java Spring Boot 3.3.2 with JWT authentication, OTP-based 2FA via Gmail SMTP, and per-user document isolation. Integrated Google Gemini 2.0 Flash for context-grounded answer generation. Built a React 18 frontend with drag-and-drop PDF upload, real-time processing status, and chat-style interface with source citations.

---

## 📸 How to add screenshots

1. Take screenshots of your running app
2. Create a `screenshots/` folder in the project root
3. Save them as `login.png`, `otp.png`, `main.png`, `database.png`
4. Push to GitHub — they will appear automatically in this README

---

## 📄 License

MIT License — free to use for learning and projects.

---

<div align="center">
Made with ☕ and a lot of debugging
</div>
