package com.gateway.workers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.jobs.DeliverWebhookJob;
import com.gateway.models.Merchant;
import com.gateway.models.WebhookLog;
import com.gateway.repositories.MerchantRepository;
import com.gateway.repositories.WebhookLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@Slf4j
public class WebhookWorker extends BaseWorker {

    private final WebhookLogRepository webhookLogRepository;
    private final MerchantRepository merchantRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.test.webhook.retry:false}")
    private boolean testRetryMode;

    public WebhookWorker(RedisTemplate<String, Object> redisTemplate,
                         WebhookLogRepository webhookLogRepository,
                         MerchantRepository merchantRepository,
                         ObjectMapper objectMapper) {
        super(redisTemplate, "webhook_queue");
        this.webhookLogRepository = webhookLogRepository;
        this.merchantRepository = merchantRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void process(Object jobObj) {
        DeliverWebhookJob job = objectMapper.convertValue(jobObj, DeliverWebhookJob.class);

        // 1. Fetch Merchant
        Merchant merchant = merchantRepository.findById(job.getMerchantId()).orElse(null);
        if (merchant == null || merchant.getWebhookUrl() == null || merchant.getWebhookUrl().isEmpty()) {
            log.warn("Merchant {} has no webhook URL. Skipping.", job.getMerchantId());
            return; // Or mark as Skipped
        }

        // 4. Log Webhook Attempt (Create/Update Log)
        WebhookLog logEntry;
        if (job.getExistingLogId() != null) {
            logEntry = webhookLogRepository.findById(job.getExistingLogId()).orElse(new WebhookLog());
        } else {
            logEntry = new WebhookLog();
            logEntry.setMerchantId(job.getMerchantId());
            logEntry.setEvent(job.getEventType());
            logEntry.setPayload(job.getPayload());
            logEntry.setAttempts(0);
            logEntry.setStatus("pending");
            logEntry = webhookLogRepository.save(logEntry); // Save initially to get ID
        }

        // 2. Generate HMAC Signature
        // "Use the JSON string representation of the payload (no whitespace changes)"
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(job.getPayload());
        } catch (Exception e) {
            log.error("Failed to serialize payload", e);
            return;
        }

        String signature = "";
        if (merchant.getWebhookSecret() != null) {
            // HmacUtils from Apache Commons Codec
            signature = new HmacUtils("HmacSHA256", merchant.getWebhookSecret()).hmacHex(payloadJson);
        }

        // 3. Send HTTP Request
        int attempt = logEntry.getAttempts() + 1;
        logEntry.setAttempts(attempt);
        logEntry.setLastAttemptAt(LocalDateTime.now());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Webhook-Signature", signature);

            HttpEntity<String> entity = new HttpEntity<>(payloadJson, headers);
            
            // Timeout handling usually via RestTemplate customization or CompletableFuture
            // Use simple postForEntity for now.
            ResponseEntity<String> response = restTemplate.postForEntity(merchant.getWebhookUrl(), entity, String.class);
            
            logEntry.setResponseCode(response.getStatusCode().value());
            logEntry.setResponseBody(response.getBody());

            if (response.getStatusCode().is2xxSuccessful()) {
                logEntry.setStatus("success");
            } else {
                logEntry.setStatus("pending"); // Will retry
            }

        } catch (Exception e) {
            log.error("Webhook delivery failed: {}", e.getMessage());
            logEntry.setStatus("pending");
            logEntry.setResponseBody(e.getMessage());
            // responseCode might be 0 or extracted from exception if it's HttpStatusCodeException
        }

        // 5/6. Retry Logic
        if ("pending".equals(logEntry.getStatus())) {
            if (attempt >= 5) {
                logEntry.setStatus("failed");
            } else {
                logEntry.setNextRetryAt(calculateNextRetry(attempt));
            }
        } else {
             logEntry.setNextRetryAt(null);
        }

        webhookLogRepository.save(logEntry);
    }

    private LocalDateTime calculateNextRetry(int attempt) {
        // Attempt is just finished. So next one is attempt+1.
        // Logic says: "Attempt 2: After 1 minute". Attempt 1 already done.
        // So if we just finished attempt 1, next is attempt 2.
        
        long delaySeconds;
        if (testRetryMode) {
             // Test Intervals: 2->5s, 3->10s, 4->15s, 5->20s
             switch (attempt) {
                 case 1: delaySeconds = 5; break;
                 case 2: delaySeconds = 10; break;
                 case 3: delaySeconds = 15; break;
                 case 4: delaySeconds = 20; break;
                 default: delaySeconds = 0; // Should trigger immediate or fail
             }
        } else {
            // Production Intervals: 2->1m, 3->5m, 4->30m, 5->2h
            switch (attempt) {
                case 1: delaySeconds = 60; break;
                case 2: delaySeconds = 5 * 60; break;
                case 3: delaySeconds = 30 * 60; break;
                case 4: delaySeconds = 2 * 60 * 60; break;
                default: delaySeconds = 24 * 60 * 60; 
            }
        }
        return LocalDateTime.now().plusSeconds(delaySeconds);
    }
}
