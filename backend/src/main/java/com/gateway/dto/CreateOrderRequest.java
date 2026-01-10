package com.gateway.dto;

import lombok.Data;

@Data
public class CreateOrderRequest {
    private Integer amount;
    private String currency;
    private String receipt;
    private java.util.Map<String, String> notes;
}
