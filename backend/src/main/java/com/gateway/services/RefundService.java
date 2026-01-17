package com.gateway.services;

import com.gateway.dto.CreateRefundRequest;
import com.gateway.jobs.ProcessRefundJob;
import com.gateway.models.Payment;
import com.gateway.models.Refund;
import com.gateway.repositories.PaymentRepository;
import com.gateway.repositories.RefundRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final JobService jobService;

    @Transactional
    public Refund createRefund(String paymentId, UUID merchantId, CreateRefundRequest request) {
        // 1. Verify Payment
        Payment payment = paymentRepository.findById(paymentId)
                .filter(p -> p.getMerchantId().equals(merchantId))
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));

        if (!"success".equalsIgnoreCase(payment.getStatus())) {
            throw new IllegalStateException("Payment not in refundable state");
        }

        // 2. Calc Total Refunded
        List<Refund> existingRefunds = refundRepository.findByPaymentId(paymentId);
        int totalRefunded = existingRefunds.stream()
                .filter(r -> "processed".equals(r.getStatus()) || "pending".equals(r.getStatus()))
                .mapToInt(Refund::getAmount)
                .sum();

        if (request.getAmount() + totalRefunded > payment.getAmount()) {
            throw new IllegalStateException("Refund amount exceeds available amount");
        }

        // 3. Create Refund Record
        Refund refund = new Refund();
        refund.setId("rfnd_" + RandomStringUtils.randomAlphanumeric(16));
        refund.setPaymentId(paymentId);
        refund.setMerchantId(merchantId);
        refund.setAmount(request.getAmount());
        refund.setReason(request.getReason());
        refund.setStatus("pending");
        
        Refund savedRefund = refundRepository.save(refund);

        // 4. Enqueue Job
        jobService.enqueueRefundJob(new ProcessRefundJob(savedRefund.getId()));

        return savedRefund;
    }

    public Refund getRefund(String refundId, UUID merchantId) {
        return refundRepository.findById(refundId)
                .filter(r -> r.getMerchantId().equals(merchantId))
                .orElse(null);
    }

    public List<Refund> getRefundsByMerchant(UUID merchantId) {
        return refundRepository.findByMerchantId(merchantId);
    }
}
