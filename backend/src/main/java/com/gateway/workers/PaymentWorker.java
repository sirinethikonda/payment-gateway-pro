package com.gateway.workers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.jobs.DeliverWebhookJob;
import com.gateway.jobs.ProcessPaymentJob;
import com.gateway.models.Merchant;
import com.gateway.models.Payment;
import com.gateway.repositories.MerchantRepository;
import com.gateway.repositories.PaymentRepository;
import com.gateway.services.JobService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Component
@Slf4j
public class PaymentWorker extends BaseWorker {

    private final PaymentRepository paymentRepository;
    private final MerchantRepository merchantRepository; // Needed? Maybe for webhook job payload enrichment if needed, but Payment has merchantId
    private final JobService jobService;
    private final ObjectMapper objectMapper;

    @Value("${app.test.mode:false}")
    private boolean testMode;
    
    @Value("${app.test.success:true}")
    private boolean testSuccess;
    
    @Value("${app.test.delay:1000}")
    private int testDelay;

    public PaymentWorker(RedisTemplate<String, Object> redisTemplate,
                         PaymentRepository paymentRepository,
                         MerchantRepository merchantRepository,
                         JobService jobService,
                         ObjectMapper objectMapper) {
        super(redisTemplate, JobService.PAYMENT_QUEUE);
        this.paymentRepository = paymentRepository;
        this.merchantRepository = merchantRepository;
        this.jobService = jobService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void process(Object jobObj) {
        try {
            // Handle potential type mismatch (LinkedHashMap vs POJO)
            ProcessPaymentJob job = objectMapper.convertValue(jobObj, ProcessPaymentJob.class);
            log.info("Processing Payment: {}", job.getPaymentId());

            Payment payment = paymentRepository.findById(job.getPaymentId()).orElse(null);
            if (payment == null) {
                log.error("Payment not found: {}", job.getPaymentId());
                return;
            }

            // 2. Simulate Delay
            long delay = testMode ? testDelay : (5000 + new Random().nextInt(5000));
            try { Thread.sleep(delay); } catch (InterruptedException e) {}

            // 3. Determine Outcome
            boolean isSuccess;
            if (testMode) {
                isSuccess = testSuccess;
            } else {
                // Random based on method
                double chance = "upi".equalsIgnoreCase(payment.getMethod()) ? 0.90 : 0.95;
                isSuccess = new Random().nextDouble() < chance;
            }

            // 4. Update Status
            if (isSuccess) {
                payment.setStatus("success");
            } else {
                payment.setStatus("failed");
                payment.setErrorCode("PAYMENT_FAILED");
                payment.setErrorDescription("Payment processing failed due to bank rejection."); // Simplified
            }
            paymentRepository.save(payment);
            log.info("Payment {} status updated to {}", payment.getId(), payment.getStatus());

            // 5. Enqueue Webhook
            enqueueWebhook(payment);

        } catch (Exception e) {
            log.error("Error processing payment job", e);
        }
    }

    private void enqueueWebhook(Payment payment) {
        try {
            // Construct Payload
            Map<String, Object> paymentData = new HashMap<>();
            paymentData.put("id", payment.getId());
            paymentData.put("order_id", payment.getOrderId());
            paymentData.put("amount", payment.getAmount());
            paymentData.put("currency", payment.getCurrency());
            paymentData.put("method", payment.getMethod());
            paymentData.put("status", payment.getStatus());
            paymentData.put("created_at", payment.getCreatedAt().toString());
            // Add vpa or card details if needed
            
            Map<String, Object> data = new HashMap<>();
            data.put("payment", paymentData);
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "payment." + payment.getStatus()); // payment.success or payment.failed
            payload.put("timestamp", System.currentTimeMillis() / 1000);
            payload.put("data", data);

            DeliverWebhookJob webhookJob = new DeliverWebhookJob();
            webhookJob.setMerchantId(payment.getMerchantId());
            webhookJob.setEventType("payment." + payment.getStatus());
            webhookJob.setPayload(payload);
            
            jobService.enqueueWebhookJob(webhookJob);
        } catch (Exception e) {
            log.error("Failed to enqueue webhook for payment {}", payment.getId(), e);
        }
    }
}
