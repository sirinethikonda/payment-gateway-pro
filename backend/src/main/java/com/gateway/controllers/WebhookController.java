package com.gateway.controllers;

import com.gateway.jobs.DeliverWebhookJob;
import com.gateway.models.Merchant;
import com.gateway.models.WebhookLog;
import com.gateway.repositories.WebhookLogRepository;
import com.gateway.services.JobService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID; // Added import for UUID

@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final WebhookLogRepository webhookLogRepository;
    private final JobService jobService;

    @GetMapping
    public ResponseEntity<?> getWebhookLogs(
            HttpServletRequest httpRequest,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(defaultValue = "10") int limit) {
        
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        if (merchant == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (limit > 100) limit = 100;

        // Ensure findByMerchantId in Repository supports Pageable
        Page<WebhookLog> page = webhookLogRepository.findByMerchantId(
                merchant.getId(),
                PageRequest.of(offset / limit, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        Map<String, Object> response = new HashMap<>();
        response.put("data", page.getContent());
        response.put("total", page.getTotalElements());
        response.put("limit", limit);
        response.put("offset", offset);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/retry")
    public ResponseEntity<?> retryWebhook(@PathVariable String id, HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        if (merchant == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // FIX: Convert String ID to UUID.fromString(id)
        WebhookLog log = webhookLogRepository.findById(UUID.fromString(id)).orElse(null);
        if (log == null) {
            return ResponseEntity.notFound().build();
        }

        if (!log.getMerchantId().equals(merchant.getId())) {
            return ResponseEntity.notFound().build();
        }

        log.setAttempts(0);
        log.setStatus("pending");
        webhookLogRepository.save(log);

        DeliverWebhookJob job = new DeliverWebhookJob();
        job.setMerchantId(log.getMerchantId());
        job.setEventType(log.getEvent());
        job.setPayload(log.getPayload()); 
        job.setExistingLogId(log.getId());

        jobService.enqueueWebhookJob(job);

        Map<String, Object> response = new HashMap<>();
        response.put("id", log.getId());
        response.put("status", "pending");
        response.put("message", "Webhook retry scheduled");

        return ResponseEntity.ok(response);
    }
}