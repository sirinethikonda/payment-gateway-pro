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

import com.gateway.repositories.IdempotencyKeyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final ValidationService validationService;

    @Transactional
    public Payment initPayment(Order order, CreatePaymentRequest request) {
        // Renamed to createPayment and modified below, but initPayment signature was different.
        // We replaced processPaymentAsync with createPayment logic.
        // We must also remove initPayment or update it.
        // The previous step replaced processPaymentAsync but left initPayment.
        // We should consolidate.
        // I will remove initPayment in a separate call or here.
        // Let's remove initPayment here and the old fields.
        return createPayment(order, request, null);
    }


    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final JobService jobService;

    @Transactional
    public Payment createPayment(Order order, CreatePaymentRequest request, String idempotencyKey) {
        Payment payment = new Payment();
        payment.setId(generatePaymentId());
        payment.setOrderId(order.getId());
        payment.setMerchantId(order.getMerchantId());
        payment.setAmount(order.getAmount());
        payment.setCurrency(order.getCurrency());
        payment.setMethod(request.getMethod());
        payment.setStatus("pending"); // Async processing start

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

        Payment savedPayment = paymentRepository.save(payment);
        
        // Enqueue Job
        jobService.enqueuePaymentJob(new com.gateway.jobs.ProcessPaymentJob(savedPayment.getId(), idempotencyKey));
        
        return savedPayment;
    }

    @Transactional
    public Payment capturePayment(String paymentId, java.util.UUID merchantId) {
        Payment payment = paymentRepository.findById(paymentId)
            .filter(p -> p.getMerchantId().equals(merchantId))
            .orElse(null);
            
        if (payment == null) {
            throw new IllegalArgumentException("Payment not found");
        }
        
        if (!"success".equalsIgnoreCase(payment.getStatus())) {
             throw new IllegalStateException("Payment not in capturable state");
        }
        
        if (Boolean.TRUE.equals(payment.getCaptured())) {
            // Already captured, return as is or error? Usually idempotent success.
            return payment;
        }

        payment.setCaptured(true);
        payment.setUpdatedAt(java.time.LocalDateTime.now());
        return paymentRepository.save(payment);
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

