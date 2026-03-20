package com.rag.controller;

import com.rag.dto.ApiDtos;
import com.rag.service.DocumentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins}")
public class DocumentController {

    private final DocumentService documentService;

    // ── Health ────────────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "AI Document Search"));
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    @PostMapping("/upload")
    public ResponseEntity<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            log.info("Received upload: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
            ApiDtos.DocumentUploadResponse response = documentService.uploadDocument(file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiDtos.ErrorResponse.builder()
                            .error("INVALID_INPUT").message(e.getMessage()).status(400).build());
        } catch (Exception e) {
            log.error("Upload failed", e);
            return ResponseEntity.internalServerError().body(
                    ApiDtos.ErrorResponse.builder()
                            .error("UPLOAD_FAILED").message(e.getMessage()).status(500).build());
        }
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    @PostMapping("/ask")
    public ResponseEntity<?> ask(@RequestBody ApiDtos.QueryRequest request) {
        try {
            log.info("Query: '{}'", request.getQuestion());
            ApiDtos.QueryResponse response = documentService.query(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiDtos.ErrorResponse.builder()
                            .error("INVALID_INPUT").message(e.getMessage()).status(400).build());
        } catch (Exception e) {
            log.error("Query failed", e);
            return ResponseEntity.internalServerError().body(
                    ApiDtos.ErrorResponse.builder()
                            .error("QUERY_FAILED").message(e.getMessage()).status(500).build());
        }
    }

    // ── Documents CRUD ────────────────────────────────────────────────────────

    @GetMapping("/documents")
    public ResponseEntity<List<ApiDtos.DocumentSummary>> list() {
        return ResponseEntity.ok(documentService.listDocuments());
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<?> getDocument(@PathVariable String id) {
        try {
            return ResponseEntity.ok(documentService.getDocument(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            documentService.deleteDocument(id);
            return ResponseEntity.ok(Map.of("message", "Document deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
