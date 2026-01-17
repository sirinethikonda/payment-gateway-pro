package com.gateway.dto;

import lombok.Data;

@Data
public class CreateRefundRequest {
    private Integer amount;
    private String reason;
}
