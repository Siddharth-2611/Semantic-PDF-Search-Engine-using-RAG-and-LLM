package com.rag.auth;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtp(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("DocuQuery — Your Login OTP");
            message.setText(
                "Hello!\n\n" +
                "Your OTP for DocuQuery login is:\n\n" +
                "    " + otp + "\n\n" +
                "This OTP is valid for 5 minutes.\n" +
                "Do not share this with anyone.\n\n" +
                "If you did not request this, ignore this email.\n\n" +
                "— DocuQuery Team"
            );
            mailSender.send(message);
            log.info("OTP sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Please try again.");
        }
    }
}
