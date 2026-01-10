package com.gateway.models;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_merchant_id", columnList = "merchant_id")
})
public class Order {

    @Id
    @Column(length = 64)
    private String id; // Format: "order_" + 16 alphanumeric characters

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "merchant_id", nullable = false, columnDefinition = "VARCHAR(36)")
    private UUID merchantId;

    @Column(nullable = false)
    private Integer amount; // In paise

    @Column(length = 3, nullable = false)
    private String currency = "INR";

    @Column(length = 255)
    private String receipt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "notes", columnDefinition = "json")
    private Map<String, String> notes;

    @Column(length = 20)
    private String status = "created";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
