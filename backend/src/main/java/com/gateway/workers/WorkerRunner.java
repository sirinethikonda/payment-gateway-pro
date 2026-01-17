package com.gateway.workers;

import com.gateway.config.RedisConfig;
import com.gateway.services.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
@Profile("worker")
@RequiredArgsConstructor
@Slf4j
public class WorkerRunner implements CommandLineRunner {

    private final ApplicationContext context;
    private final ExecutorService executor = Executors.newFixedThreadPool(10); // Check thread pool size

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting Worker Service...");

        // Start Payment Worker
        PaymentWorker paymentWorker = context.getBean(PaymentWorker.class);
        executor.submit(paymentWorker);
        log.info("Payment Worker started.");

        // Start Webhook Worker
        WebhookWorker webhookWorker = context.getBean(WebhookWorker.class);
        executor.submit(webhookWorker);
        log.info("Webhook Worker started.");

        // Start Refund Worker
        RefundWorker refundWorker = context.getBean(RefundWorker.class);
        executor.submit(refundWorker);
        log.info("Refund Worker started.");
    }
}
