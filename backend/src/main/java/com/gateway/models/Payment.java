package com.gateway.models;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "payments", indexes = {
    @Index(name = "idx_payments_order_id", columnList = "order_id"),
    @Index(name = "idx_payments_status", columnList = "status")
})
public class Payment {

    @Id
    @Column(length = 64)
    private String id; // Format: "pay_" + 16 alphanumeric characters

    @Column(name = "order_id", nullable = false, length = 64)
    private String orderId;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "merchant_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID merchantId;

    @Column(nullable = false)
    private Integer amount;

    @Column(length = 3)
    private String currency = "INR";

    @Column(nullable = false, length = 20)
    private String method; // "upi" or "card"

    @Column(length = 20)
    private String status = "processing"; // Defaults to processing

    // UPI specific
    @Column(length = 255)
    private String vpa;

    // Card specific
    @Column(name = "card_network", length = 20)
    private String cardNetwork;

    @Column(name = "card_last4", length = 4)
    private String cardLast4;

    // Error details
    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "error_description", columnDefinition = "TEXT")
    private String errorDescription;

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean captured = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
