package com.gateway.jobs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPaymentJob implements Serializable {
    private String paymentId;
    private String idempotencyKey; // Optional, for context if needed
}
