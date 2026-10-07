package com.ghartak.technician.ui.auth

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.model.TechnicianProfile
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthUiState(
    val phoneNumber: String = "",
    val otpCode: String = "",
    val isOtpSent: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isLoggedIn: Boolean = false
)

class TechnicianAuthViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        if (sessionManager.isLoggedIn()) {
            _uiState.value = _uiState.value.copy(isLoggedIn = true)
        }
    }

    fun onPhoneChanged(phone: String) {
        val sanitized = phone.filter { it.isDigit() }.take(10)
        _uiState.value = _uiState.value.copy(phoneNumber = sanitized, errorMessage = null)
    }

    fun onOtpChanged(otp: String) {
        val sanitized = otp.filter { it.isDigit() }.take(6)
        _uiState.value = _uiState.value.copy(otpCode = sanitized, errorMessage = null)
    }

    fun sendOtp() {
        val phone = _uiState.value.phoneNumber
        if (phone.length < 10) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid 10-digit mobile number")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            delay(600) // Realistic network sensation
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isOtpSent = true,
                otpCode = "123456" // Default test OTP populated
            )
        }
    }

    fun verifyOtp() {
        val otp = _uiState.value.otpCode
        if (otp.length != 6) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter the complete 6-digit OTP")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            delay(800)

            // Save authenticated technician profile
            val verifiedProfile = TechnicianProfile(
                id = "tech_rajesh_01",
                badgeNumber = "GTS-TECH-4091",
                fullName = "Rajesh Kumar",
                phone = "+91" + _uiState.value.phoneNumber.ifEmpty { "9811223344" },
                partnerId = "partner_mh_01",
                assignedPincode = "400001",
                isOnline = true,
                rating = 4.9,
                safetyKitSerial = "VDE-1000V-99214",
                insulatedGlovesVerified = true,
                totalJobsCompleted = 48
            )

            sessionManager.saveSession(
                token = "gts_tech_jwt_token_${System.currentTimeMillis()}",
                profile = verifiedProfile
            )

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isLoggedIn = true
            )
        }
    }

    fun quickStagingFill() {
        _uiState.value = _uiState.value.copy(
            phoneNumber = "9811223344",
            isOtpSent = true,
            otpCode = "123456",
            errorMessage = null
        )
        verifyOtp()
    }
}
