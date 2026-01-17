package com.gateway.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.models.IdempotencyKey;
import com.gateway.repositories.IdempotencyKeyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IdempotencyService {

    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ObjectMapper objectMapper;

    public Optional<Map<String, Object>> getResponse(String key, UUID merchantId) {
        Optional<IdempotencyKey> existing = idempotencyKeyRepository.findByKeyValueAndMerchantId(key, merchantId);
        
        if (existing.isPresent()) {
            IdempotencyKey record = existing.get();
            if (record.getExpiresAt().isBefore(LocalDateTime.now())) {
                idempotencyKeyRepository.delete(record);
                return Optional.empty();
            }
            return Optional.of(record.getResponse());
        }
        return Optional.empty();
    }

    public void saveResponse(String key, UUID merchantId, Object response) {
        try {
            IdempotencyKey record = new IdempotencyKey();
            record.setKeyValue(key);
            record.setMerchantId(merchantId);
            
            // Convert POJO to Map for JSON column storage
            Map<String, Object> responseMap = objectMapper.convertValue(response, Map.class);
            record.setResponse(responseMap);
            
            record.setExpiresAt(LocalDateTime.now().plusHours(24));
            
            idempotencyKeyRepository.save(record);
        } catch (Exception e) {
            // Log error but don't fail the request
            e.printStackTrace();
        }
    }
}
