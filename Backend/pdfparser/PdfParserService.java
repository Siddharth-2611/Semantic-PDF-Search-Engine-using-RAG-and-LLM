package com.rag.pdfparser;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
public class PdfParserService {

    public String extractText(MultipartFile file) throws IOException {
        return extractTextFromBytes(file.getBytes());
    }

    public String extractTextFromBytes(byte[] bytes) throws IOException {
        log.info("Extracting text from {} bytes", bytes.length);
        try (InputStream is = new ByteArrayInputStream(bytes);
             PDDocument document = PDDocument.load(is)) {

            if (document.isEncrypted()) {
                throw new IllegalArgumentException("Encrypted PDFs are not supported. Please decrypt first.");
            }

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            String text = stripper.getText(document);
            log.info("Extracted {} characters from {} pages",
                    text.length(), document.getNumberOfPages());

            return cleanText(text);
        }
    }

    /**
     * Cleans extracted text: normalises whitespace, removes junk characters.
     */
    private String cleanText(String raw) {
        return raw
                // Normalise line endings
                .replaceAll("\r\n", "\n")
                // Collapse multiple blank lines to one
                .replaceAll("\n{3,}", "\n\n")
                // Remove non-printable characters (keep newline/tab)
                .replaceAll("[^\\x09\\x0A\\x0D\\x20-\\x7E\\u00A0-\\uFFFF]", " ")
                // Collapse multiple spaces
                .replaceAll("[ \\t]{2,}", " ")
                .trim();
    }
}
