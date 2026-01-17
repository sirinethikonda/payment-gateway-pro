package com.gateway.controllers;

import com.gateway.dto.CreateRefundRequest;
import com.gateway.dto.ErrorResponse;
import com.gateway.models.Merchant;
import com.gateway.models.Refund;
import com.gateway.services.RefundService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RefundController {

    private final RefundService refundService;

    @PostMapping("/payments/{paymentId}/refunds")
    public ResponseEntity<?> createRefund(
            @PathVariable String paymentId,
            @RequestBody CreateRefundRequest request,
            HttpServletRequest httpRequest) {

        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        
        if (request.getAmount() == null || request.getAmount() <= 0) {
            return ResponseEntity.badRequest().body(new ErrorResponse("BAD_REQUEST_ERROR", "Invalid amount"));
        }

        try {
            Refund refund = refundService.createRefund(paymentId, merchant.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(refund);
        } catch (IllegalArgumentException e) {
             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage()));
        } catch (IllegalStateException e) {
             return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage()));
        }
    }

    @GetMapping("/refunds/{refundId}")
    public ResponseEntity<?> getRefund(@PathVariable String refundId, HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        
        Refund refund = refundService.getRefund(refundId, merchant.getId());
        if (refund == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(refund);
    }

    @GetMapping("/refunds")
    public ResponseEntity<?> getRefunds(HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        return ResponseEntity.ok(refundService.getRefundsByMerchant(merchant.getId()));
    }
}
