package com.gateway.repositories;

import com.gateway.models.WebhookLog;
import org.springframework.data.domain.Page; // Added Import
import org.springframework.data.domain.Pageable; // Added Import
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WebhookLogRepository extends JpaRepository<WebhookLog, UUID> {
    
    // Fixed: Now correctly uses Page and Pageable imports
    Page<WebhookLog> findByMerchantId(UUID merchantId, Pageable pageable);    
    
    // Find logs pending retry before a certain time (used by background workers)
    List<WebhookLog> findByStatusAndNextRetryAtBefore(String status, LocalDateTime timestamp);
}