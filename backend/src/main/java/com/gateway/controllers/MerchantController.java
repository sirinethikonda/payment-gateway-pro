package com.gateway.controllers;

import com.gateway.models.Merchant;
import com.gateway.services.MerchantService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/merchants")
@RequiredArgsConstructor
public class MerchantController {

    private final MerchantService merchantService;

    @PutMapping("/webhook-config") // Or just /webhook
    public ResponseEntity<?> updateWebhookConfig(HttpServletRequest httpRequest, @RequestBody Map<String, String> body) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        if (merchant == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String url = body.get("url");
        String secret = body.get("secret");

        Merchant updated = merchantService.updateWebhookConfig(merchant.getId(), url, secret);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/webhook-secret/regenerate")
    public ResponseEntity<?> regenerateWebhookSecret(HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        if (merchant == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String newSecret = "whsec_" + RandomStringUtils.randomAlphanumeric(24);
        Merchant updated = merchantService.updateWebhookConfig(merchant.getId(), merchant.getWebhookUrl(), newSecret);
        
        return ResponseEntity.ok(Map.of("secret", newSecret));
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getMe(HttpServletRequest httpRequest) {
        Merchant merchant = (Merchant) httpRequest.getAttribute("merchant");
        if (merchant == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(merchant);
    }
}
