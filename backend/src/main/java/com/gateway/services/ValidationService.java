package com.gateway.services;

import org.springframework.stereotype.Service;
import java.time.YearMonth;
import java.util.regex.Pattern;

@Service
public class ValidationService {

    private static final Pattern VPA_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$");

    public boolean validateVPA(String vpa) {
        if (vpa == null || vpa.isEmpty()) return false;
        return VPA_PATTERN.matcher(vpa).matches();
    }

    public boolean validateLuhn(String cardNumber) {
        if (cardNumber == null) return false;
        String sanitized = cardNumber.replaceAll("[\\s-]", "");
        if (!sanitized.matches("\\d{13,19}")) return false;

        int sum = 0;
        boolean alternate = false;
        for (int i = sanitized.length() - 1; i >= 0; i--) {
            int n = Integer.parseInt(sanitized.substring(i, i + 1));
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n -= 9;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 == 0);
    }

    public String detectCardNetwork(String cardNumber) {
        if (cardNumber == null) return "unknown";
        String n = cardNumber.replaceAll("[\\s-]", "");
        
        if (n.startsWith("4")) return "visa";
        
        // Mastercard: 51-55
        if (n.matches("^5[1-5].*")) return "mastercard";
        
        // Amex: 34, 37
        if (n.startsWith("34") || n.startsWith("37")) return "amex";
        
        // RuPay: 60, 65, 81-89
        if (n.startsWith("60") || n.startsWith("65") || n.matches("^8[1-9].*")) return "rupay";
        
        return "unknown";
    }

    public boolean validateExpiry(String monthStr, String yearStr) {
        try {
            int month = Integer.parseInt(monthStr);
            if (month < 1 || month > 12) return false;

            int year = Integer.parseInt(yearStr);
            // Handle 2 digit year
            if (year < 100) {
                year += 2000;
            }

            YearMonth expiry = YearMonth.of(year, month);
            YearMonth current = YearMonth.now();

            return !expiry.isBefore(current);
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
