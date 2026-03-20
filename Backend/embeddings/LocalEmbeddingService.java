package com.rag.embeddings;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class LocalEmbeddingService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${embedding.server.url:http://localhost:5001}")
    private String serverUrl;

    public float[] embed(String text) {
        String input = text.length() > 2000 ? text.substring(0, 2000) : text;
        try {
            Map<String, String> request = Map.of("text", input);
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(
                    serverUrl + "/embed", request, Map.class
            );
            if (response == null || !response.containsKey("embedding")) {
                throw new RuntimeException("No embedding in response");
            }
            @SuppressWarnings("unchecked")
            List<Double> vector = (List<Double>) response.get("embedding");
            float[] result = new float[vector.size()];
            for (int i = 0; i < vector.size(); i++) {
                result[i] = vector.get(i).floatValue();
            }
            return result;
        } catch (Exception e) {
            log.error("Embedding server error: {}", e.getMessage());
            throw new RuntimeException(
                    "Embedding failed. Make sure embedding_server.py is running: python embedding_server.py", e
            );
        }
    }

    public List<float[]> embedBatch(List<String> texts) {
        return texts.stream().map(this::embed).toList();
    }

    public static String serializeVector(float[] vector) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(vector[i]);
        }
        return sb.toString();
    }

    public static float[] deserializeVector(String serialized) {
        if (serialized == null || serialized.isBlank()) return new float[0];
        String[] parts = serialized.split(",");
        float[] vector = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            vector[i] = Float.parseFloat(parts[i].trim());
        }
        return vector;
    }
}