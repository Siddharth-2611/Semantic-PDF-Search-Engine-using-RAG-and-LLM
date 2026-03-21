package com.rag.service;

import com.rag.dto.ApiDtos;
import com.rag.embeddings.LocalEmbeddingService;
import com.rag.model.Document;
import com.rag.model.DocumentChunk;
import com.rag.pdfparser.PdfParserService;
import com.rag.rag.ChunkingService;
import com.rag.rag.LlmService;
import com.rag.vectorstore.InMemoryVectorStore;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final PdfParserService pdfParser;
    private final ChunkingService chunker;
    private final LocalEmbeddingService embeddingService;
    private final InMemoryVectorStore vectorStore;
    private final LlmService llmService;

    @Value("${rag.top-k:5}")
    private int defaultTopK;

    // Get currently logged in user's email from JWT
    private String currentUserEmail() {
        return SecurityContextHolder.getContext()
                .getAuthentication().getName();
    }

    // ── Reload vectors on startup ─────────────────────────────────────────────
    @PostConstruct
    @Transactional(readOnly = true)
    public void reloadVectorIndex() {
        log.info("Reloading vector index from database...");
        List<DocumentChunk> allChunks = chunkRepository.findAll();
        int loaded = 0;
        for (DocumentChunk chunk : allChunks) {
            if (chunk.getEmbeddingVector() != null) {
                float[] vector = LocalEmbeddingService.deserializeVector(chunk.getEmbeddingVector());
                vectorStore.add(chunk.getId(), chunk.getDocument().getId(), vector);
                loaded++;
            }
        }
        log.info("Loaded {} vectors into memory", loaded);
    }

    // ── Upload ────────────────────────────────────────────────────────────────
    @Transactional
    public ApiDtos.DocumentUploadResponse uploadDocument(MultipartFile file) throws Exception {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        if (!file.getOriginalFilename().toLowerCase().endsWith(".pdf"))
            throw new IllegalArgumentException("Only PDF files are supported");

        String email = currentUserEmail();

        Document doc = Document.builder()
                .name(file.getOriginalFilename())
                .originalFilename(file.getOriginalFilename())
                .fileSize(file.getSize())
                .status(Document.ProcessingStatus.UPLOADING)
                .ownerEmail(email)   // tag document to this user
                .build();
        doc = documentRepository.save(doc);

        processDocumentAsync(doc.getId(), file.getBytes());

        return ApiDtos.DocumentUploadResponse.builder()
                .id(doc.getId())
                .name(doc.getName())
                .status(doc.getStatus().name())
                .message("Upload received. Processing started.")
                .fileSize(doc.getFileSize())
                .uploadTime(doc.getUploadTime())
                .build();
    }

    @Async
    @Transactional
    public void processDocumentAsync(String docId, byte[] fileBytes) {
        Document doc = documentRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        try {
            doc.setStatus(Document.ProcessingStatus.PROCESSING);
            documentRepository.save(doc);

            String text = pdfParser.extractTextFromBytes(fileBytes);
            List<String> chunks = chunker.chunk(text);
            log.info("[{}] {} chunks created", docId, chunks.size());

            List<DocumentChunk> savedChunks = new ArrayList<>();
            for (int i = 0; i < chunks.size(); i++) {
                String chunkText = chunks.get(i);
                float[] vector = embeddingService.embed(chunkText);

                DocumentChunk chunk = DocumentChunk.builder()
                        .document(doc)
                        .chunkIndex(i)
                        .text(chunkText)
                        .embeddingVector(LocalEmbeddingService.serializeVector(vector))
                        .build();
                chunk = chunkRepository.save(chunk);
                savedChunks.add(chunk);
                vectorStore.add(chunk.getId(), docId, vector);
            }

            doc.setTotalChunks(savedChunks.size());
            doc.setStatus(Document.ProcessingStatus.READY);
            documentRepository.save(doc);
            log.info("[{}] Processing complete", docId);

        } catch (Exception e) {
            log.error("[{}] Processing failed: {}", docId, e.getMessage(), e);
            doc.setStatus(Document.ProcessingStatus.FAILED);
            documentRepository.save(doc);
        }
    }

    // ── Query ─────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ApiDtos.QueryResponse query(ApiDtos.QueryRequest request) {
        long start = System.currentTimeMillis();
        String email = currentUserEmail();

        if (request.getQuestion() == null || request.getQuestion().isBlank())
            throw new IllegalArgumentException("Question cannot be empty");

        // Validate the document belongs to this user
        if (request.getDocumentId() != null) {
            documentRepository.findByIdAndOwnerEmail(request.getDocumentId(), email)
                    .orElseThrow(() -> new RuntimeException("Document not found"));
        }

        int topK = request.getTopK() != null ? request.getTopK() : defaultTopK;
        float[] queryVector = embeddingService.embed(request.getQuestion());

        List<InMemoryVectorStore.SearchResult> hits =
                vectorStore.search(queryVector, topK, request.getDocumentId());

        // Filter hits to only this user's documents
        List<String> userDocIds = documentRepository
                .findByOwnerEmailOrderByUploadTimeDesc(email)
                .stream().map(Document::getId).toList();

        hits = hits.stream()
                .filter(h -> userDocIds.contains(h.documentId()))
                .toList();

        if (hits.isEmpty()) {
            return ApiDtos.QueryResponse.builder()
                    .question(request.getQuestion())
                    .answer("No relevant documents found. Please upload a document first.")
                    .sources(List.of())
                    .latencyMs(System.currentTimeMillis() - start)
                    .build();
        }

        List<String> chunkIds = hits.stream().map(InMemoryVectorStore.SearchResult::chunkId).toList();
        List<DocumentChunk> chunks = chunkRepository.findAllByIds(chunkIds);

        List<DocumentChunk> ordered = new ArrayList<>();
        for (String id : chunkIds) {
            chunks.stream().filter(c -> c.getId().equals(id)).findFirst().ifPresent(ordered::add);
        }

        String answer = llmService.generateAnswer(request.getQuestion(),
                ordered.stream().map(DocumentChunk::getText).toList());

        List<ApiDtos.SourceChunk> sources = new ArrayList<>();
        for (DocumentChunk chunk : ordered) {
            double score = hits.stream()
                    .filter(h -> h.chunkId().equals(chunk.getId()))
                    .mapToDouble(InMemoryVectorStore.SearchResult::score).findFirst().orElse(0);
            sources.add(ApiDtos.SourceChunk.builder()
                    .documentId(chunk.getDocument().getId())
                    .documentName(chunk.getDocument().getName())
                    .chunkIndex(chunk.getChunkIndex())
                    .text(chunk.getText().length() > 300
                            ? chunk.getText().substring(0, 300) + "..."
                            : chunk.getText())
                    .similarityScore(score)
                    .build());
        }

        return ApiDtos.QueryResponse.builder()
                .question(request.getQuestion())
                .answer(answer)
                .sources(sources)
                .latencyMs(System.currentTimeMillis() - start)
                .build();
    }

    // ── List — only this user's docs ──────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<ApiDtos.DocumentSummary> listDocuments() {
        return documentRepository
                .findByOwnerEmailOrderByUploadTimeDesc(currentUserEmail())
                .stream().map(ApiDtos::toSummary).toList();
    }

    // ── Delete — only if owner ────────────────────────────────────────────────
    @Transactional
    public void deleteDocument(String docId) {
        String email = currentUserEmail();
        Document doc = documentRepository.findByIdAndOwnerEmail(docId, email)
                .orElseThrow(() -> new RuntimeException("Document not found or access denied"));
        vectorStore.removeByDocument(docId);
        chunkRepository.deleteByDocumentId(docId);
        documentRepository.delete(doc);
        log.info("Deleted document {} by user {}", docId, email);
    }

    @Transactional(readOnly = true)
    public ApiDtos.DocumentSummary getDocument(String docId) {
        return documentRepository.findByIdAndOwnerEmail(docId, currentUserEmail())
                .map(ApiDtos::toSummary)
                .orElseThrow(() -> new RuntimeException("Document not found or access denied"));
    }
}
