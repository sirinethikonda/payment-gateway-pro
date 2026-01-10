package com.gateway.dto;

import lombok.Data;

@Data
public class CreatePaymentRequest {
    private String order_id;
    private String method; // "upi" or "card"
    
    // UPI
    private String vpa;
    
    // Card
    private CardDetails card;
    
    @Data
    public static class CardDetails {
        private String number;
        private String expiry_month;
        private String expiry_year;
        private String cvv;
        private String holder_name;
    }
}
