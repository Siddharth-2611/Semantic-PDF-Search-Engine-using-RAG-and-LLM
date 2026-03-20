package com.rag.rag;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Groq API - free, fast, no GPU needed.
 * Get free key at: https://console.groq.com
 * Free tier: 14,400 requests/day
 */
@Slf4j
@Service
public class LlmService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model:llama3-8b-8192}")
    private String model;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    public String generateAnswer(String question, List<String> contextChunks) {
        String context = String.join("\n\n---\n\n", contextChunks);

        String systemPrompt = "You are a helpful assistant. Answer questions based ONLY on the provided document context. " +
                "If the answer is not in the context, say: 'I could not find this information in the document.'";

        String userPrompt = "CONTEXT:\n" + context + "\n\nQUESTION: " + question + "\n\nAnswer concisely and accurately.";

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                    "model", model,
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user",   "content", userPrompt)
                    ),
                    "max_tokens", 512,
                    "temperature", 0.3
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(GROQ_URL, entity, Map.class);

            if (response == null) return "No response from Groq API.";

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) return "Empty response from Groq.";

            @SuppressWarnings("unchecked")
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            return ((String) message.get("content")).trim();

        } catch (Exception e) {
            log.error("Groq API error: {}", e.getMessage());
            return "Answer generation failed: " + e.getMessage();
        }
    }
}