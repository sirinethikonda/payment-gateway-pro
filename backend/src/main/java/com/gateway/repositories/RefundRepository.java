package com.gateway.repositories;

import com.gateway.models.Refund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RefundRepository extends JpaRepository<Refund, String> {
    List<Refund> findByPaymentId(String paymentId);
    List<Refund> findByMerchantId(java.util.UUID merchantId);
}
