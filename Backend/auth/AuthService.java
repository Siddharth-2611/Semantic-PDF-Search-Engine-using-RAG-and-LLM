package com.rag.auth;

import com.rag.model.User;
import com.rag.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final OtpStore otpStore;
    private final EmailService emailService;

    // ── Register ──────────────────────────────────────────────────────────────
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        // Auto-login after register (no OTP for registration)
        String token = jwtUtil.generateToken(user.getEmail());
        log.info("New user registered: {}", user.getEmail());

        return AuthDtos.AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .message("Registration successful")
                .build();
    }

    // ── Login Step 1: verify password → send OTP ─────────────────────────────
    public AuthDtos.OtpSentResponse login(AuthDtos.LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new SecureRandom().nextInt(999999));
        otpStore.save(request.getEmail(), otp);

        // Send OTP to Gmail
        emailService.sendOtp(request.getEmail(), otp);

        log.info("OTP sent to {}", request.getEmail());

        return AuthDtos.OtpSentResponse.builder()
                .message("OTP sent to your email")
                .email(request.getEmail())
                .otpSent(true)
                .build();
    }

    // ── Login Step 2: verify OTP → return JWT ────────────────────────────────
    public AuthDtos.AuthResponse verifyOtp(AuthDtos.VerifyOtpRequest request) {
        if (!otpStore.verify(request.getEmail(), request.getOtp())) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = jwtUtil.generateToken(user.getEmail());
        log.info("User logged in via OTP: {}", user.getEmail());

        return AuthDtos.AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .message("Login successful")
                .build();
    }
}