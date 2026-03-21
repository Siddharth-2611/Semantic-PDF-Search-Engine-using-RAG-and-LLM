package com.rag.auth;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory OTP store.
 * Stores OTP per email with expiry (5 minutes).
 */
@Component
public class OtpStore {

    private record OtpEntry(String otp, LocalDateTime expiresAt) {}

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();

    public void save(String email, String otp) {
        store.put(email, new OtpEntry(otp, LocalDateTime.now().plusMinutes(5)));
    }

    public boolean verify(String email, String otp) {
        OtpEntry entry = store.get(email);
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiresAt())) {
            store.remove(email);
            return false;
        }
        if (!entry.otp().equals(otp)) return false;
        store.remove(email); // OTP used — delete it
        return true;
    }

    public boolean hasOtp(String email) {
        OtpEntry entry = store.get(email);
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiresAt())) {
            store.remove(email);
            return false;
        }
        return true;
    }
}
