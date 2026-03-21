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

@Slf4j
@Service
public class LlmService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    public String generateAnswer(String question, List<String> contextChunks) {
        String context = String.join("\n\n---\n\n", contextChunks);

        String prompt = "You are a helpful assistant. Answer the question based ONLY on the context below.\n\n"
                + "CONTEXT:\n" + context + "\n\n"
                + "QUESTION: " + question + "\n\n"
                + "If the answer is not in the context, say: "
                + "'I could not find this information in the document.' "
                + "Be concise and accurate.";

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + model + ":generateContent?key=" + apiKey;

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "temperature", 0.3,
                            "maxOutputTokens", 512
                    )
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);

            if (response == null) return "No response from Gemini.";

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> candidates =
                    (List<Map<String, Object>>) response.get("candidates");

            if (candidates == null || candidates.isEmpty())
                return "Empty response from Gemini.";

            @SuppressWarnings("unchecked")
            Map<String, Object> content =
                    (Map<String, Object>) candidates.get(0).get("content");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parts =
                    (List<Map<String, Object>>) content.get("parts");

            return ((String) parts.get(0).get("text")).trim();

        } catch (Exception e) {
            log.error("Gemini API error: {}", e.getMessage());
            return "Answer generation failed: " + e.getMessage();
        }
    }
}
