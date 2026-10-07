package com.ghartak.customer.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.model.UserProfile
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CustomerAuthUiState(
    val phoneNumber: String = "",
    val otpCode: String = "",
    val isOtpSent: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isLoggedIn: Boolean = false
)

class CustomerAuthViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(CustomerAuthUiState())
    val uiState: StateFlow<CustomerAuthUiState> = _uiState.asStateFlow()

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
            delay(500)
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isOtpSent = true,
                otpCode = "123456"
            )
        }
    }

    fun verifyOtp() {
        val otp = _uiState.value.otpCode
        if (otp.length != 6) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter the 6-digit OTP")
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
            delay(600)

            val profile = UserProfile(
                id = "cust_amit_01",
                phone = "+91" + _uiState.value.phoneNumber.ifEmpty { "9876543210" },
                fullName = "Amit Sharma",
                email = "amit.sharma@example.com",
                role = "CUSTOMER"
            )

            sessionManager.saveSession(
                token = "gts_customer_jwt_${System.currentTimeMillis()}",
                user = profile
            )

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isLoggedIn = true
            )
        }
    }

    fun quickStagingFill() {
        _uiState.value = _uiState.value.copy(
            phoneNumber = "9876543210",
            isOtpSent = true,
            otpCode = "123456",
            errorMessage = null
        )
        verifyOtp()
    }
}
