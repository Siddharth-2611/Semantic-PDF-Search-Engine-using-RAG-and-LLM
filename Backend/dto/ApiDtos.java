package com.rag.dto;

import com.rag.model.Document;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class ApiDtos {

    // ── Upload Response ──────────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DocumentUploadResponse {
        private String id;
        private String name;
        private String status;
        private String message;
        private Long fileSize;
        private LocalDateTime uploadTime;
    }

    // ── Document List Item ───────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DocumentSummary {
        private String id;
        private String name;
        private String status;
        private Integer totalChunks;
        private Long fileSize;
        private LocalDateTime uploadTime;
    }

    // ── Query Request ────────────────────────────────────────────────────────
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class QueryRequest {
        private String question;
        private String documentId;  // optional: scope to one document
        private Integer topK;       // optional: default 5
    }

    // ── Query Response ───────────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class QueryResponse {
        private String answer;
        private String question;
        private List<SourceChunk> sources;
        private long latencyMs;
    }

    // ── Source Chunk ─────────────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SourceChunk {
        private String documentId;
        private String documentName;
        private Integer chunkIndex;
        private String text;
        private double similarityScore;
    }

    // ── Error Response ───────────────────────────────────────────────────────
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ErrorResponse {
        private String error;
        private String message;
        private int status;
    }

    // ── Conversion Helper ─────────────────────────────────────────────────────
    public static DocumentSummary toSummary(Document doc) {
        return DocumentSummary.builder()
                .id(doc.getId())
                .name(doc.getName())
                .status(doc.getStatus().name())
                .totalChunks(doc.getTotalChunks())
                .fileSize(doc.getFileSize())
                .uploadTime(doc.getUploadTime())
                .build();
    }
}
