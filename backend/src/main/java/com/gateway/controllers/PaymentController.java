package com.gateway.controllers;

import com.gateway.dto.CreatePaymentRequest;
import com.gateway.dto.ErrorResponse;
import com.gateway.models.Merchant;
import com.gateway.models.Order;
import com.gateway.models.Payment;
import com.gateway.services.OrderService;
import com.gateway.services.PaymentService;
import com.gateway.services.ValidationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional; 
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;
    private final ValidationService validationService;

    private final com.gateway.services.IdempotencyService idempotencyService;

    @PostMapping
    public ResponseEntity<?> createPayment(
            @RequestBody CreatePaymentRequest request, 
            HttpServletRequest httpRequest,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        
        // Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            java.util.Optional<Map<String, Object>> cachedResponse = idempotencyService.getResponse(idempotencyKey, merchant.getId());
            if (cachedResponse.isPresent()) {
                return ResponseEntity.status(HttpStatus.CREATED).body(cachedResponse.get());
            }
        }

        // Validation & Creation
        ResponseEntity<?> validationResponse = validateRequest(request, merchant);
        if (validationResponse != null) return validationResponse;

        Payment payment = paymentService.createPayment(orderService.getOrder(request.getOrder_id()), request, idempotencyKey);
        
        // Save Idempotency response
        if (idempotencyKey != null && !idempotencyKey.isEmpty()) {
            idempotencyService.saveResponse(idempotencyKey, merchant.getId(), payment);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
    }
    
    @PostMapping("/{id}/capture")
    public ResponseEntity<?> capturePayment(@PathVariable String id, @RequestBody Map<String, Object> body, HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        // Validate amount presence if needed, though Requirements say "Request Body: { amount: 50000 }"
        
        try {
            Payment payment = paymentService.capturePayment(id, merchant.getId());
            return ResponseEntity.ok(payment);
        } catch (IllegalArgumentException e) {
             return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("NOT_FOUND_ERROR", e.getMessage()));
        } catch (IllegalStateException e) {
             return ResponseEntity.badRequest().body(new ErrorResponse("BAD_REQUEST_ERROR", e.getMessage()));
        }
    }

    private ResponseEntity<?> validateRequest(CreatePaymentRequest request, Merchant authenticatedMerchant) {
        if (request.getOrder_id() == null) {
             return ResponseEntity.badRequest().body(new ErrorResponse("BAD_REQUEST_ERROR", "order_id is required"));
        }
        
        Order order = orderService.getOrder(request.getOrder_id());
        if (order == null) {
             return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("NOT_FOUND_ERROR", "Order not found"));
        }

        if (authenticatedMerchant != null && !order.getMerchantId().equals(authenticatedMerchant.getId())) {
             return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("NOT_FOUND_ERROR", "Order not found"));
        }

        if ("upi".equalsIgnoreCase(request.getMethod())) {
            if (!validationService.validateVPA(request.getVpa())) {
                return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_VPA", "VPA format invalid"));
            }
        } else if ("card".equalsIgnoreCase(request.getMethod())) {
            if (request.getCard() == null || !validationService.validateLuhn(request.getCard().getNumber())) {
                return ResponseEntity.badRequest().body(new ErrorResponse("INVALID_CARD", "Card validation failed"));
            }
        }
        return null; // Valid
    }

    // Legacy method signature handling
    private ResponseEntity<?> handlePaymentCreation(CreatePaymentRequest request, Merchant authenticatedMerchant) {
         // Re-routing to new logic if called internally, but likely simpler to just inline logic as above.
         // This is removed/replaced by createPayment above.
         return null;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPayment(@PathVariable String id, HttpServletRequest httpRequest) {
        Payment payment = paymentService.getPayment(id);
        if (payment == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        if (merchant != null && !payment.getMerchantId().equals(merchant.getId())) {
             return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<?> getPublicPayment(@PathVariable String id) {
        Payment payment = paymentService.getPayment(id);
        if (payment == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(payment);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        if (merchant == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        
        Map<String, Object> stats = paymentService.getMerchantStats(merchant.getId());
        return ResponseEntity.ok(stats);
    }

    @GetMapping
    public ResponseEntity<?> getAllPayments(HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        if (merchant == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(paymentService.getPaymentsByMerchant(merchant.getId()));
    }
}