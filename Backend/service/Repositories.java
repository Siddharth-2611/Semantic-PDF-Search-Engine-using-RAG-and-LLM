package com.rag.service;

import com.rag.model.Document;
import com.rag.model.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
interface DocumentRepository extends JpaRepository<Document, String> {
    List<Document> findAllByOrderByUploadTimeDesc();
}

@Repository
interface DocumentChunkRepository extends JpaRepository<DocumentChunk, String> {
    List<DocumentChunk> findByDocumentId(String documentId);

    @Query("SELECT c FROM DocumentChunk c WHERE c.id IN :ids")
    List<DocumentChunk> findAllByIds(List<String> ids);

    void deleteByDocumentId(String documentId);
}
