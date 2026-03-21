package com.rag.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "total_chunks")
    private Integer totalChunks;

    @Column(name = "upload_time")
    private LocalDateTime uploadTime;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private ProcessingStatus status;

    // Owner of this document
    @Column(name = "owner_email", nullable = false)
    private String ownerEmail;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentChunk> chunks;

    public enum ProcessingStatus {
        UPLOADING, PROCESSING, READY, FAILED
    }

    @PrePersist
    protected void onCreate() {
        uploadTime = LocalDateTime.now();
        if (status == null) status = ProcessingStatus.UPLOADING;
    }
}
