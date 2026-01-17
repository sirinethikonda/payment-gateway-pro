package com.gateway.workers;

import com.gateway.jobs.DeliverWebhookJob;
import com.gateway.models.WebhookLog;
import com.gateway.repositories.WebhookLogRepository;
import com.gateway.services.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Profile("worker") // Only run scheduler in worker service
@RequiredArgsConstructor
@Slf4j
public class WebhookRetryScheduler {

    private final WebhookLogRepository webhookLogRepository;
    private final JobService jobService;

    // Check every 10 seconds
    @Scheduled(fixedDelay = 10000)
    public void scheduleRetries() {
        LocalDateTime now = LocalDateTime.now();
        List<WebhookLog> pendingLogs = webhookLogRepository.findByStatusAndNextRetryAtBefore("pending", now);

        if (!pendingLogs.isEmpty()) {
            log.info("Found {} webhooks pending retry", pendingLogs.size());
        }

        for (WebhookLog logEntry : pendingLogs) {
            try {
                // Update status to prevent double picking? 
                // Better pattern: set next_retry_at to future or null temporary?
                // Or "processing"? 
                // The requirements say "status defaults to 'pending'".
                // If we enqueue it, it might take time to pick up.
                // If we don't update DB, next poll (10s later) might pick it again if queue is slow.
                // Best to update "next_retry_at" to something future or NULL to lock it?
                // OR check if query excludes currently processing?
                // Let's just update `next_retry_at` to null or future to indicate it's been scheduled.
                // But `WebhookWorker` will re-set it if it fails.
                // So let's update `next_retry_at` to null to avoid re-scheduling immediately.
                
                logEntry.setNextRetryAt(null); // Mark as picked up (or use a "queued" status?)
                // If worker fails immediately, it sets a NEW next_retry_at.
                // If worker is slow, this prevents double queuing.
                webhookLogRepository.save(logEntry);

                DeliverWebhookJob job = new DeliverWebhookJob();
                job.setMerchantId(logEntry.getMerchantId());
                job.setEventType(logEntry.getEvent());
                job.setPayload(logEntry.getPayload());
                job.setExistingLogId(logEntry.getId());
                // attemptNumber is in DB, worker will read it.

                jobService.enqueueWebhookJob(job);
            } catch (Exception e) {
                log.error("Failed to schedule retry for webhook {}", logEntry.getId(), e);
            }
        }
    }
}
