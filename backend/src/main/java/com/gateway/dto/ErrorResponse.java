package com.gateway.dto;

import lombok.Data;

@Data
public class ErrorResponse {
    private ErrorDetail error;

    public ErrorResponse(String code, String description) {
        this.error = new ErrorDetail(code, description);
    }

    @Data
    public static class ErrorDetail {
        private String code;
        private String description;
        
        public ErrorDetail(String code, String description) {
            this.code = code;
            this.description = description;
        }
    }
}
