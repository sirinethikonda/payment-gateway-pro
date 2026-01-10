package com.gateway.services;

import com.gateway.dto.CreatePaymentRequest;
import com.gateway.models.Order;
import com.gateway.models.Payment;
import com.gateway.repositories.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ValidationService validationService;

    @Value("${TEST_MODE:false}")
    private boolean testMode;

    @Value("${TEST_PAYMENT_SUCCESS:true}")
    private boolean testPaymentSuccess;

    @Value("${TEST_PROCESSING_DELAY:1000}")
    private int testProcessingDelay;

    @Value("${UPI_SUCCESS_RATE:0.90}")
    private double upiSuccessRate;

    @Value("${CARD_SUCCESS_RATE:0.95}")
    private double cardSuccessRate;

    @Transactional
    public Payment initPayment(Order order, CreatePaymentRequest request) {
        Payment payment = new Payment();
        payment.setId(generatePaymentId());
        payment.setOrderId(order.getId());
        payment.setMerchantId(order.getMerchantId());
        payment.setAmount(order.getAmount());
        payment.setCurrency(order.getCurrency());
        payment.setMethod(request.getMethod());
        payment.setStatus("processing"); // Always start as processing

        if ("upi".equalsIgnoreCase(request.getMethod())) {
            payment.setVpa(request.getVpa());
        } else if ("card".equalsIgnoreCase(request.getMethod()) && request.getCard() != null) {
            String network = validationService.detectCardNetwork(request.getCard().getNumber());
            payment.setCardNetwork(network);
            String num = request.getCard().getNumber().replaceAll("[\\s-]", "");
            if (num.length() >= 4) {
                payment.setCardLast4(num.substring(num.length() - 4));
            }
        }

        return paymentRepository.save(payment);
    }

    @Async
    public void processPaymentAsync(Payment payment) {
        try {
            // Delay
            long delay;
            if (testMode) {
                delay = testProcessingDelay;
            } else {
                // 5-10 seconds
                delay = 5000 + new Random().nextInt(5001);
            }
            Thread.sleep(delay);

            // Determine Success
            boolean success;
            if (testMode) {
                success = testPaymentSuccess;
            } else {
                double rand = Math.random();
                if ("upi".equalsIgnoreCase(payment.getMethod())) {
                    success = rand < upiSuccessRate;
                } else {
                    success = rand < cardSuccessRate;
                }
            }

            if (success) {
                payment.setStatus("success");
            } else {
                payment.setStatus("failed");
                payment.setErrorCode("PAYMENT_FAILED");
                payment.setErrorDescription("Payment processing failed randomly.");
            }
            
            paymentRepository.save(payment);
            log.info("Processed Payment {}: {}", payment.getId(), payment.getStatus());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Payment processing interrupted", e);
        }
    }

    public Payment getPayment(String id) {
        return paymentRepository.findById(id).orElse(null);
    }

    public java.util.List<Payment> getPaymentsByMerchant(java.util.UUID merchantId) {
        return paymentRepository.findByMerchantId(merchantId);
    }

    private String generatePaymentId() {
        String id;
        do {
            id = "pay_" + RandomStringUtils.randomAlphanumeric(16);
        } while (paymentRepository.existsById(id));
        return id;
    }
 // Add this method to your existing PaymentService class
    public java.util.Map<String, Object> getMerchantStats(java.util.UUID merchantId) {
        java.util.List<Payment> payments = paymentRepository.findByMerchantId(merchantId);
        
        long totalTransactions = payments.size();
        
        // Calculate total volume: Sum only 'success' (case-insensitive) payments
        long totalAmount = payments.stream()
                .filter(p -> "success".equalsIgnoreCase(p.getStatus()))
                .mapToLong(Payment::getAmount)
                .sum();

        // Calculate success rate: (successful / total) * 100
        long successCount = payments.stream()
                .filter(p -> "success".equalsIgnoreCase(p.getStatus()))
                .count();
        
        double successRate = totalTransactions > 0 
                ? ((double) successCount / totalTransactions) * 100 
                : 0.0;

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalTransactions", totalTransactions);
        stats.put("totalAmount", totalAmount);
        stats.put("successRate", successRate);
        
        return stats;
    }
}

