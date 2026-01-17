package com.gateway.jobs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliverWebhookJob implements Serializable {
    private UUID webhookLogId; // Or pass details directly? Requirements say: merchantID, event type, payload
    // "Job receives merchant ID, event type, and payload data as input parameters"
    // Better to pass WebhookLog ID if we persist it first? 
    // Requirements say: "1. Fetch merchant details... 2. Generate HMAC... 4. Log webhook attempt in webhook_logs table".
    // Wait, "4. Log webhook attempt". So the log doesn't exist yet?
    // OR "Enqueue a webhook delivery job... Include payment data in webhook payload".
    // "Deliver Webhook Job... 4. Log webhook attempt".
    // So usually we enqueue the data.
    
    // However, for robust retry, usually we persist the "Task" or "Log" first.
    // The "Retry Logic" says "Update webhook_logs table".
    // So let's pass the payload details.
    
    private UUID merchantId;
    private String eventType;
    private Map<String, Object> payload;
    private UUID existingLogId; // If this is a retry
    private int attemptNumber; // To track attempts passed in or calculated
}
