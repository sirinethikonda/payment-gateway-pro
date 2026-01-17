package com.gateway.services;

import com.gateway.models.Merchant;
import com.gateway.repositories.MerchantRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MerchantService {

    private final MerchantRepository merchantRepository;

    @Value("${TEST_MERCHANT_EMAIL:test@example.com}")
    private String testEmail;

    @Value("${TEST_API_KEY:key_test_abc123}")
    private String testApiKey;

    @Value("${TEST_API_SECRET:secret_test_xyz789}")
    private String testApiSecret;

    @PostConstruct
    public void seedTestMerchant() {
        Optional<Merchant> existing = merchantRepository.findByEmail(testEmail);
        if (existing.isEmpty()) {
            Merchant merchant = new Merchant();
            // ID must be explicit for the test merchant requirement? 
            // "id : 550e8400-e29b-41d4-a716-446655440000"
            // JPA @GeneratedValue usually handles it, but we can try to set it manually if permitted.
            // Since it's UUID, we can set it.
            merchant.setId(UUID.fromString("550e8400-e29b-41d4-a716-446655440000"));
            merchant.setName("Test Merchant");
            merchant.setEmail(testEmail);
            merchant.setApiKey(testApiKey);
            merchant.setApiSecret(testApiSecret);
            merchant.setActive(true);
            merchantRepository.save(merchant);
            log.info("Seeded Test Merchant: {}", merchant.getId());
        } else {
            log.info("Test Merchant already exists.");
        }
    }

    public Optional<Merchant> getMerchantByApiKey(String apiKey) {
        return merchantRepository.findByApiKey(apiKey);
    }

    public Merchant updateWebhookConfig(java.util.UUID merchantId, String url, String secret) {
        Merchant merchant = merchantRepository.findById(merchantId).orElseThrow(() -> new RuntimeException("Merchant not found"));
        merchant.setWebhookUrl(url);
        if (secret != null && !secret.isEmpty()) {
            merchant.setWebhookSecret(secret);
        }
        return merchantRepository.save(merchant);
    }
}
