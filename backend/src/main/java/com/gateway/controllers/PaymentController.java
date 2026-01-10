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

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;
    private final ValidationService validationService;

    @PostMapping
    public ResponseEntity<?> createPayment(@RequestBody CreatePaymentRequest request, HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        return handlePaymentCreation(request, merchant);
    }
    
    @PostMapping("/public")
    public ResponseEntity<?> createPublicPayment(@RequestBody CreatePaymentRequest request) {
        return handlePaymentCreation(request, null);
    }

    private ResponseEntity<?> handlePaymentCreation(CreatePaymentRequest request, Merchant authenticatedMerchant) {
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

        Payment payment = paymentService.initPayment(order, request);
        paymentService.processPaymentAsync(payment);

        return ResponseEntity.status(HttpStatus.CREATED).body(payment);
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