package com.rag.rag;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class ChunkingService {

    @Value("${rag.chunk.size:500}")
    private int chunkSize;          // target tokens/words per chunk

    @Value("${rag.chunk.overlap:50}")
    private int chunkOverlap;       // overlap words between chunks

    /**
     * Splits a long text into overlapping chunks.
     * Strategy: split by words, preserve sentence boundaries where possible.
     */
    public List<String> chunk(String text) {
        if (text == null || text.isBlank()) return List.of();

        // Split into sentences first, then group into chunks
        String[] sentences = text.split("(?<=[.!?])\\s+");
        List<String> chunks = new ArrayList<>();

        StringBuilder current = new StringBuilder();
        int currentWordCount = 0;

        for (String sentence : sentences) {
            int sentenceWords = countWords(sentence);

            // If adding this sentence would exceed chunkSize, save current chunk
            if (currentWordCount + sentenceWords > chunkSize && currentWordCount > 0) {
                chunks.add(current.toString().trim());

                // Add overlap from end of current chunk
                String overlap = extractLastWords(current.toString(), chunkOverlap);
                current = new StringBuilder(overlap).append(" ");
                currentWordCount = countWords(overlap);
            }

            current.append(sentence).append(" ");
            currentWordCount += sentenceWords;
        }

        // Don't forget the last chunk
        if (!current.toString().isBlank()) {
            chunks.add(current.toString().trim());
        }

        log.info("Split text into {} chunks (size={}, overlap={})",
                chunks.size(), chunkSize, chunkOverlap);
        return chunks;
    }

    private int countWords(String text) {
        if (text == null || text.isBlank()) return 0;
        return text.trim().split("\\s+").length;
    }

    private String extractLastWords(String text, int n) {
        String[] words = text.trim().split("\\s+");
        if (words.length <= n) return text.trim();
        StringBuilder sb = new StringBuilder();
        for (int i = words.length - n; i < words.length; i++) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(words[i]);
        }
        return sb.toString();
    }
}
