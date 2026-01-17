package com.gateway.controllers;

import com.gateway.dto.ErrorResponse;
import com.gateway.models.Merchant;
import com.gateway.services.JobService;
import com.gateway.services.MerchantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/test")
@RequiredArgsConstructor
public class TestController {

    private final MerchantService merchantService;
    private final JobService jobService;

    @GetMapping("/merchant")
    public ResponseEntity<?> getTestMerchant() {
        Optional<Merchant> merchant = merchantService.getMerchantByApiKey("key_test_abc123");
        
        if (merchant.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            Merchant m = merchant.get();
            response.put("id", m.getId());
            response.put("email", m.getEmail());
            response.put("api_key", m.getApiKey());
            
            // "seeded": true
            response.put("seeded", true);
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse("NOT_FOUND_ERROR", "Test merchant not found"));
        }
    }

    @GetMapping("/jobs/status")
    public Map<String, Object> getJobQueueStatus() {
        Map<String, Object> status = jobService.getQueueStatus();
        status.put("worker_status", "running");
        return status;
    }
}
