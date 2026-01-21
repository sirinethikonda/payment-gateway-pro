package com.gateway.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gateway.dto.ErrorResponse;
import com.gateway.models.Merchant;
import com.gateway.services.MerchantService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuthenticationFilter extends HttpFilter {

    private final MerchantService merchantService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilter(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws IOException, ServletException {
        String path = request.getRequestURI();
        
        // Allowed paths
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            chain.doFilter(request, response);
            return;
        }

        // Allowed paths
        if (path.equals("/health") || 
            path.startsWith("/api/v1/test/") || 
            path.startsWith("/api/v1/payments/public") || 
            path.startsWith("/api/v1/orders/public") ||
            (path.equals("/api/v1/payments") && "POST".equalsIgnoreCase(request.getMethod()))) { 
            chain.doFilter(request, response);
            return;
        }

        // Check Headers
        String apiKey = request.getHeader("X-Api-Key");
        String apiSecret = request.getHeader("X-Api-Secret");

        if (apiKey == null || apiSecret == null) {
            sendAuthError(response);
            return;
        }

        Optional<Merchant> merchantOpt = merchantService.getMerchantByApiKey(apiKey);
        if (merchantOpt.isEmpty() || !merchantOpt.get().getApiSecret().equals(apiSecret)) {
            sendAuthError(response);
            return;
        }

        // Store merchant in request attribute
        request.setAttribute("merchant", merchantOpt.get());
        chain.doFilter(request, response);
    }

    private void sendAuthError(HttpServletResponse response) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        ErrorResponse error = new ErrorResponse("AUTHENTICATION_ERROR", "Invalid API credentials");
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
