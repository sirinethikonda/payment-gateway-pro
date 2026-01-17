package com.gateway.models;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "refunds", indexes = {
    @Index(name = "idx_refunds_payment_id", columnList = "payment_id")
})
public class Refund {

    @Id
    @Column(length = 64)
    private String id; // Format: "rfnd_" + 16 alphanumeric

    @Column(name = "payment_id", nullable = false, length = 64)
    private String paymentId;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "merchant_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID merchantId;

    @Column(nullable = false)
    private Integer amount;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 20)
    private String status = "pending";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
