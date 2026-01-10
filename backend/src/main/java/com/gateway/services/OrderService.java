package com.gateway.services;

import com.gateway.models.Merchant;
import com.gateway.models.Order;
import com.gateway.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.lang3.RandomStringUtils;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;

    public Order createOrder(Merchant merchant, Integer amount, String currency, String receipt, Map<String, String> notes) {
        Order order = new Order();
        order.setId(generateOrderId());
        order.setMerchantId(merchant.getId());
        order.setAmount(amount);
        order.setCurrency(currency != null ? currency : "INR");
        order.setReceipt(receipt);
        order.setNotes(notes);
        order.setStatus("created");
        
        return orderRepository.save(order);
    }

    public Order getOrder(String id) {
        return orderRepository.findById(id).orElse(null);
    }

    private String generateOrderId() {
        // "order_" + 16 alphanumeric
        // We need a loop to ensure uniqueness, though collision is rare.
        String id;
        do {
            id = "order_" + RandomStringUtils.randomAlphanumeric(16);
        } while (orderRepository.existsById(id));
        return id;
    }
}
