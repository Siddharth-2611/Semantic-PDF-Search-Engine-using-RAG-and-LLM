package com.rag.vectorstore;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory vector store with cosine similarity search.
 *
 * For production, replace with:
 *   - Pinecone (managed, scalable)
 *   - Weaviate (self-hosted, feature-rich)
 *   - pgvector (PostgreSQL extension)
 *   - Actual FAISS via JNI (faiss-java)
 *
 * This implementation is sufficient for thousands of chunks.
 */
@Slf4j
@Component
public class InMemoryVectorStore {

    // chunkId → float[] embedding
    private final Map<String, float[]> index = new ConcurrentHashMap<>();

    // chunkId → document_id (for filtering by document)
    private final Map<String, String> chunkToDoc = new ConcurrentHashMap<>();

    public void add(String chunkId, String documentId, float[] vector) {
        index.put(chunkId, normalize(vector));
        chunkToDoc.put(chunkId, documentId);
        log.debug("Indexed chunk {} (doc={}, dim={})", chunkId, documentId, vector.length);
    }

    public void removeByDocument(String documentId) {
        Set<String> toRemove = new HashSet<>();
        chunkToDoc.forEach((chunkId, docId) -> {
            if (docId.equals(documentId)) toRemove.add(chunkId);
        });
        toRemove.forEach(id -> {
            index.remove(id);
            chunkToDoc.remove(id);
        });
        log.info("Removed {} vectors for document {}", toRemove.size(), documentId);
    }

    /**
     * Find top-K most similar chunks using cosine similarity.
     * Optionally filter by documentId.
     */
    public List<SearchResult> search(float[] queryVector, int topK, String documentIdFilter) {
        float[] normQuery = normalize(queryVector);

        List<SearchResult> results = new ArrayList<>();

        index.forEach((chunkId, vector) -> {
            String docId = chunkToDoc.get(chunkId);

            // Apply document filter if specified
            if (documentIdFilter != null && !documentIdFilter.equals(docId)) return;

            double score = cosineSimilarity(normQuery, vector);
            results.add(new SearchResult(chunkId, docId, score));
        });

        // Sort descending by score, return top-K
        return results.stream()
                .sorted(Comparator.comparingDouble(SearchResult::score).reversed())
                .limit(topK)
                .toList();
    }

    public int size() {
        return index.size();
    }

    // ── Math Utilities ────────────────────────────────────────────────────────

    private float[] normalize(float[] vector) {
        double magnitude = 0;
        for (float v : vector) magnitude += v * v;
        magnitude = Math.sqrt(magnitude);
        if (magnitude == 0) return vector;
        float[] normalized = new float[vector.length];
        for (int i = 0; i < vector.length; i++) {
            normalized[i] = (float) (vector[i] / magnitude);
        }
        return normalized;
    }

    private double cosineSimilarity(float[] a, float[] b) {
        if (a.length != b.length) return 0;
        double dot = 0;
        for (int i = 0; i < a.length; i++) dot += a[i] * b[i];
        // Vectors are already normalized, so dot product IS cosine similarity
        return dot;
    }

    public record SearchResult(String chunkId, String documentId, double score) {}
}
