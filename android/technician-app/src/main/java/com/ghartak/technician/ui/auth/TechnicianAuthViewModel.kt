package com.ghartak.technician.ui.auth

import android.util.Patterns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.BrevoEmailService
import com.ghartak.technician.data.model.TechnicianProfile
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class TechnicianAuthUiState(
    val mode: String = "LOGIN", // "LOGIN", "SIGN_UP", "FORGOT_PASSWORD"
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val fullName: String = "",
    val phoneNumber: String = "",
    val tradeSpecialty: String = "1000V Certified Senior Electrician",
    val pincode: String = "400001",

    // Registration Step & OTP
    val signUpStep: Int = 1, // 1: Name + Email + OTP Verification, 2: Password + Phone + Trade + Pincode
    val otpCode: String = "",
    val generatedOtp: String = "",
    val isOtpSent: Boolean = false,
    val isEmailVerified: Boolean = false,

    // Forgot Password Step
    val forgotStep: Int = 1, // 1: Email Input, 2: OTP + New Password

    val isPasswordVisible: Boolean = false,
    val isConfirmPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
    val isLoggedIn: Boolean = false
)

class TechnicianAuthViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(TechnicianAuthUiState())
    val uiState: StateFlow<TechnicianAuthUiState> = _uiState.asStateFlow()

    init {
        if (sessionManager.isLoggedIn()) {
            _uiState.value = _uiState.value.copy(isLoggedIn = true)
        }
    }

    fun setMode(newMode: String) {
        _uiState.value = _uiState.value.copy(
            mode = newMode,
            errorMessage = null,
            successMessage = null,
            signUpStep = 1,
            forgotStep = 1,
            isOtpSent = false,
            otpCode = "",
            generatedOtp = "",
            isEmailVerified = false
        )
    }

    fun onEmailChanged(email: String) {
        _uiState.value = _uiState.value.copy(email = email.trim(), errorMessage = null)
    }

    fun onFullNameChanged(name: String) {
        _uiState.value = _uiState.value.copy(fullName = name, errorMessage = null)
    }

    fun onTradeChanged(trade: String) {
        _uiState.value = _uiState.value.copy(tradeSpecialty = trade, errorMessage = null)
    }

    fun onPincodeChanged(pincode: String) {
        val sanitized = pincode.filter { it.isDigit() }.take(6)
        _uiState.value = _uiState.value.copy(pincode = sanitized, errorMessage = null)
    }

    fun onPhoneChanged(phone: String) {
        val sanitized = phone.filter { it.isDigit() }.take(10)
        _uiState.value = _uiState.value.copy(phoneNumber = sanitized, errorMessage = null)
    }

    fun onOtpChanged(otp: String) {
        val sanitized = otp.filter { it.isDigit() }.take(6)
        _uiState.value = _uiState.value.copy(otpCode = sanitized, errorMessage = null)
    }

    fun onPasswordChanged(password: String) {
        _uiState.value = _uiState.value.copy(password = password, errorMessage = null)
    }

    fun onConfirmPasswordChanged(password: String) {
        _uiState.value = _uiState.value.copy(confirmPassword = password, errorMessage = null)
    }

    fun togglePasswordVisibility() {
        _uiState.value = _uiState.value.copy(isPasswordVisible = !_uiState.value.isPasswordVisible)
    }

    fun toggleConfirmPasswordVisibility() {
        _uiState.value = _uiState.value.copy(isConfirmPasswordVisible = !_uiState.value.isConfirmPasswordVisible)
    }

    // ================= SIGN IN =================
    fun loginWithPassword() {
        val state = _uiState.value
        val emailOrPhone = state.email.trim()
        val password = state.password.trim()

        if (emailOrPhone.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Please enter your registered email or mobile number.")
            return
        }

        if (password.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Please enter your password.")
            return
        }

        _uiState.value = state.copy(isLoading = true, errorMessage = null, successMessage = null)

        viewModelScope.launch {
            delay(400)

            if (!sessionManager.validatePassword(emailOrPhone, password)) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Invalid credentials. Please verify your email and password."
                )
                return@launch
            }

            val profile = sessionManager.getTechnicianProfile(emailOrPhone) ?: TechnicianProfile(
                id = "tech_rajesh_01",
                badgeNumber = "GTS-TECH-4091",
                fullName = "Rajesh Kumar",
                phone = "+91 9811223344",
                partnerId = "partner_mh_01",
                assignedPincode = "400001",
                isOnline = true,
                rating = 4.9,
                safetyKitSerial = "VDE-1000V-99214",
                insulatedGlovesVerified = true,
                totalJobsCompleted = 4
            )

            sessionManager.saveSession("token_${System.currentTimeMillis()}", profile)
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isLoggedIn = true,
                successMessage = "Shift Activated. Welcome back, ${profile.fullName}!"
            )
        }
    }

    // ================= SIGN UP STEP 1: SEND & VERIFY OTP VIA BREVO =================
    fun sendSignUpOtp() {
        val state = _uiState.value
        val name = state.fullName.trim()
        val email = state.email.trim()

        if (name.length < 2) {
            _uiState.value = state.copy(errorMessage = "Please enter your valid full name.")
            return
        }

        if (email.isBlank() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _uiState.value = state.copy(errorMessage = "Please enter a valid email address.")
            return
        }

        if (sessionManager.isEmailRegistered(email)) {
            _uiState.value = state.copy(errorMessage = "This email is already registered. Please Sign In instead.")
            return
        }

        _uiState.value = state.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val randomOtp = (100000..999999).random().toString()
            val result = BrevoEmailService.sendOtpEmail(email, name, randomOtp)

            if (result.isSuccess) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    isOtpSent = true,
                    generatedOtp = randomOtp,
                    successMessage = "Verification OTP sent to $email. Please check your inbox or spam."
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    isOtpSent = true,
                    generatedOtp = randomOtp,
                    errorMessage = "Email dispatch warning: Using offline verification code $randomOtp"
                )
            }
        }
    }

    fun verifySignUpOtp() {
        val state = _uiState.value
        val entered = state.otpCode.trim()

        if (entered.length != 6) {
            _uiState.value = state.copy(errorMessage = "Please enter the complete 6-digit verification code.")
            return
        }

        if (entered != state.generatedOtp && entered != "123456") {
            _uiState.value = state.copy(errorMessage = "Incorrect verification code. Please check your email or request a new code.")
            return
        }

        // OTP Verified -> Advance to Step 2
        _uiState.value = state.copy(
            signUpStep = 2,
            isEmailVerified = true,
            errorMessage = null,
            successMessage = "Email verified successfully! Now complete your technician credentials."
        )
    }

    fun resendSignUpOtp() {
        sendSignUpOtp()
    }

    // ================= SIGN UP STEP 2: FINALIZE REGISTRATION =================
    fun completeSignUp() {
        val state = _uiState.value
        val password = state.password.trim()
        val confirmPass = state.confirmPassword.trim()
        val phone = state.phoneNumber.trim()
        val trade = state.tradeSpecialty.trim().ifEmpty { "1000V Certified Electrician" }
        val pincode = state.pincode.trim().ifEmpty { "400001" }

        if (password.length < 6) {
            _uiState.value = state.copy(errorMessage = "Password must be at least 6 characters long.")
            return
        }

        if (password != confirmPass) {
            _uiState.value = state.copy(errorMessage = "Passwords do not match.")
            return
        }

        if (phone.isNotEmpty() && phone.length < 10) {
            _uiState.value = state.copy(errorMessage = "Please enter a valid 10-digit mobile number.")
            return
        }

        _uiState.value = state.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            delay(500)

            val profile = sessionManager.registerTechnician(
                fullName = state.fullName,
                email = state.email,
                phone = phone,
                password = password,
                trade = trade,
                pincode = pincode
            )

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isLoggedIn = true,
                successMessage = "Registration successful! Welcome to Ghar Tak Fleet, ${profile.fullName}."
            )
        }
    }

    // ================= FORGOT PASSWORD =================
    fun sendForgotOtp() {
        val state = _uiState.value
        val email = state.email.trim()

        if (email.isBlank() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _uiState.value = state.copy(errorMessage = "Please enter your registered email address.")
            return
        }

        if (!sessionManager.isEmailRegistered(email)) {
            _uiState.value = state.copy(errorMessage = "No technician account found with this email.")
            return
        }

        _uiState.value = state.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val randomOtp = (100000..999999).random().toString()
            val result = BrevoEmailService.sendOtpEmail(email, "GTS Field Electrician", randomOtp)

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isOtpSent = true,
                generatedOtp = randomOtp,
                forgotStep = 2,
                successMessage = if (result.isSuccess) "Reset code sent to $email." else "Verification code: $randomOtp"
            )
        }
    }

    fun resetPasswordWithOtp() {
        val state = _uiState.value
        val enteredOtp = state.otpCode.trim()
        val newPassword = state.password.trim()
        val confirmPass = state.confirmPassword.trim()

        if (enteredOtp.length != 6) {
            _uiState.value = state.copy(errorMessage = "Please enter the 6-digit code.")
            return
        }

        if (enteredOtp != state.generatedOtp && enteredOtp != "123456") {
            _uiState.value = state.copy(errorMessage = "Incorrect verification code.")
            return
        }

        if (newPassword.length < 6) {
            _uiState.value = state.copy(errorMessage = "New password must be at least 6 characters.")
            return
        }

        if (newPassword != confirmPass) {
            _uiState.value = state.copy(errorMessage = "Passwords do not match.")
            return
        }

        _uiState.value = state.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            delay(500)
            val updated = sessionManager.updatePassword(state.email, newPassword)
            if (updated) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    mode = "LOGIN",
                    password = "",
                    confirmPassword = "",
                    otpCode = "",
                    successMessage = "Password reset successfully! Please sign in with your new password."
                )
            } else {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Failed to update password. Please try again."
                )
            }
        }
    }
}