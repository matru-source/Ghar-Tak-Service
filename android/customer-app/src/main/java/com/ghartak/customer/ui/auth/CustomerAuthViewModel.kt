package com.ghartak.customer.ui.auth

import android.util.Patterns
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
    val mode: String = "LOGIN", // "LOGIN" or "SIGN_UP"
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val fullName: String = "",
    val phoneNumber: String = "",
    val address: String = "",
    val pincode: String = "400001",
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null,
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

    fun setMode(newMode: String) {
        _uiState.value = _uiState.value.copy(
            mode = newMode,
            errorMessage = null,
            successMessage = null
        )
    }

    fun onEmailChanged(email: String) {
        _uiState.value = _uiState.value.copy(email = email.trim(), errorMessage = null)
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

    fun onFullNameChanged(name: String) {
        _uiState.value = _uiState.value.copy(fullName = name, errorMessage = null)
    }

    fun onPhoneChanged(phone: String) {
        val sanitized = phone.filter { it.isDigit() }.take(10)
        _uiState.value = _uiState.value.copy(phoneNumber = sanitized, errorMessage = null)
    }

    fun onAddressChanged(address: String) {
        _uiState.value = _uiState.value.copy(address = address, errorMessage = null)
    }

    fun onPincodeChanged(pincode: String) {
        val sanitized = pincode.filter { it.isDigit() }.take(6)
        _uiState.value = _uiState.value.copy(pincode = sanitized, errorMessage = null)
    }

    fun loginWithPassword() {
        val state = _uiState.value
        val email = state.email.trim().lowercase()
        val password = state.password.trim()

        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid email address")
            return
        }

        if (password.isEmpty()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter your password")
            return
        }

        // Only registered users are able to login
        if (!sessionManager.isEmailRegistered(email)) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Account not found for '$email'. Please switch to Register / Sign Up to create your account.",
                isLoading = false
            )
            return
        }

        // Validate password
        if (!sessionManager.validatePassword(email, password)) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Incorrect password for '$email'. Please try again.",
                isLoading = false
            )
            return
        }

        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            delay(300)
            val existing = sessionManager.getUserByEmail(email)
            val resolvedName = existing?.optString("name", "Customer") ?: "Customer"
            val resolvedPhone = existing?.optString("phone", "") ?: ""
            val resolvedAddress = existing?.optString("address", "") ?: ""
            val resolvedPincode = existing?.optString("pincode", "400001") ?: "400001"

            val uid = "cust_${System.currentTimeMillis() % 10000}"
            val profile = UserProfile(
                id = uid,
                phone = resolvedPhone,
                fullName = resolvedName,
                email = email,
                role = "CUSTOMER"
            )

            sessionManager.saveSession(
                token = "gts_token_${uid}_${System.currentTimeMillis()}",
                user = profile,
                address = resolvedAddress,
                pincode = resolvedPincode
            )

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isLoggedIn = true,
                successMessage = "Welcome back, $resolvedName!"
            )
        }
    }

    fun registerWithPassword() {
        val state = _uiState.value
        val name = state.fullName.trim()
        val email = state.email.trim().lowercase()
        val phone = state.phoneNumber.trim()
        val password = state.password.trim()
        val confirm = state.confirmPassword.trim()
        val address = state.address.trim()
        val pincode = if (state.pincode.trim().isNotEmpty()) state.pincode.trim() else "400001"

        if (name.isEmpty()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter your Full Name to register")
            return
        }

        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid email address")
            return
        }

        if (phone.length < 10) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a 10-digit mobile number for technician dispatch")
            return
        }

        if (password.length < 4) {
            _uiState.value = _uiState.value.copy(errorMessage = "Password must be at least 4 characters long")
            return
        }

        if (password != confirm) {
            _uiState.value = _uiState.value.copy(errorMessage = "Passwords do not match. Please re-enter.")
            return
        }

        if (sessionManager.isEmailRegistered(email)) {
            _uiState.value = _uiState.value.copy(errorMessage = "Email '$email' is already registered. Please switch to Sign In.")
            return
        }

        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            delay(300)
            sessionManager.registerUser(
                fullName = name,
                email = email,
                phone = phone,
                password = password,
                address = address,
                pincode = pincode
            )

            val uid = "cust_${System.currentTimeMillis() % 10000}"
            val profile = UserProfile(
                id = uid,
                phone = phone,
                fullName = name,
                email = email,
                role = "CUSTOMER"
            )

            sessionManager.saveSession(
                token = "gts_token_${uid}_${System.currentTimeMillis()}",
                user = profile,
                address = address,
                pincode = pincode
            )

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isLoggedIn = true,
                successMessage = "Account created successfully! Welcome, $name!"
            )
        }
    }

    fun logout() {
        sessionManager.clearSession()
        _uiState.value = CustomerAuthUiState()
    }
}
