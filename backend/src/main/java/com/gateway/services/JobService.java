package com.gateway.services;

import com.gateway.jobs.DeliverWebhookJob;
import com.gateway.jobs.ProcessPaymentJob;
import com.gateway.jobs.ProcessRefundJob;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final RedisTemplate<String, Object> redisTemplate;

    public static final String PAYMENT_QUEUE = "payment_queue";
    public static final String WEBHOOK_QUEUE = "webhook_queue";
    public static final String REFUND_QUEUE = "refund_queue";

    public void enqueuePaymentJob(ProcessPaymentJob job) {
        log.info("Enqueuing payment job: {}", job.getPaymentId());
        redisTemplate.opsForList().rightPush(PAYMENT_QUEUE, job);
    }

    public void enqueueWebhookJob(DeliverWebhookJob job) {
        log.info("Enqueuing webhook job for event: {}", job.getEventType());
        redisTemplate.opsForList().rightPush(WEBHOOK_QUEUE, job);
    }

    public void enqueueRefundJob(ProcessRefundJob job) {
        log.info("Enqueuing refund job: {}", job.getRefundId());
        redisTemplate.opsForList().rightPush(REFUND_QUEUE, job);
    }

    public Map<String, Object> getQueueStatus() {
        Map<String, Object> status = new HashMap<>();
        
        long pendingPayments = getQueueSize(PAYMENT_QUEUE);
        long pendingWebhooks = getQueueSize(WEBHOOK_QUEUE);
        long pendingRefunds = getQueueSize(REFUND_QUEUE);
        
        status.put("pending", pendingPayments + pendingWebhooks + pendingRefunds);
        status.put("queues", Map.of(
            "payment", pendingPayments,
            "webhook", pendingWebhooks,
            "refund", pendingRefunds
        ));
        
        // Note: "processing", "completed", "failed" are harder to track with simple Redis Lists 
        // unless we move items to a "processing" list (RPOPLPUSH).
        // For this assignment, "pending" is the main one from Redis.
        // "processing"/"completed"/"failed" might need application-level stats or just return 0/mock for now if not tracking via DB states.
        // However, the requirements say "Query the job queue (Redis) to get statistics".
        // Use Mock or DB counts for others? 
        // "completed" and "failed" can be fetched from DB (e.g. payments with success/failed, webhooks with success/failed).
        
        return status;
    }
    
    private long getQueueSize(String queueName) {
        Long size = redisTemplate.opsForList().size(queueName);
        return size != null ? size : 0;
    }
}
