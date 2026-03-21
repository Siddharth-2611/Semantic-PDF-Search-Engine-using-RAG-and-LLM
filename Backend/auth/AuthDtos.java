package com.rag.auth;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

public class AuthDtos {

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }

    // Step 2 of login — submit OTP
    @Data @NoArgsConstructor @AllArgsConstructor
    public static class VerifyOtpRequest {
        private String email;
        private String otp;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AuthResponse {
        private String token;
        private String name;
        private String email;
        private String message;
    }

    // Returned after password login — tells frontend to show OTP screen
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OtpSentResponse {
        private String message;
        private String email;
        private boolean otpSent;
    }
}