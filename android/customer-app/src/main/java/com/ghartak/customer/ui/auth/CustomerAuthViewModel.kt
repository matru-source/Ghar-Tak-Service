package com.ghartak.customer.ui.auth

import android.util.Patterns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.api.ApiClient
import com.ghartak.customer.data.model.UserProfile
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class CustomerAuthUiState(
    val mode: String = "LOGIN", // "LOGIN", "SIGN_UP", "FORGOT_PASSWORD"
    val email: String = "",
    val password: String = "",
    val confirmPassword: String = "",
    val fullName: String = "",
    val phoneNumber: String = "",
    val address: String = "",
    val pincode: String = "400001",

    // Registration Step & OTP
    val signUpStep: Int = 1, // 1: Name + Email + OTP Verification, 2: Password + Pincode + Optional Phone & Address
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

    fun backToSignUpStep1() {
        _uiState.value = _uiState.value.copy(
            signUpStep = 1,
            isOtpSent = false,
            otpCode = "",
            isEmailVerified = false,
            errorMessage = null,
            successMessage = null
        )
    }

    // ================= 1. SIGN IN (LOGIN WITH PASSWORD) =================
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

        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val api = ApiClient.getService(sessionManager.context)
            try {
                val response = api.login(
                    mapOf(
                        "identifier" to email,
                        "password" to password,
                        "role" to "CUSTOMER"
                    )
                )

                if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                    val data = response.body()!!.data!!
                    val token = data["token"]?.toString()
                    if (token.isNullOrBlank()) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = "Authentication failed: Access token was not issued by server."
                        )
                        return@launch
                    }
                    val userMap = data["user"] as? Map<*, *>

                    val userId = userMap?.get("id")?.toString() ?: "cust_${System.currentTimeMillis()}"
                    val resolvedName = userMap?.get("fullName")?.toString() ?: "Customer"
                    val resolvedPhone = userMap?.get("phone")?.toString() ?: ""
                    val resolvedEmail = userMap?.get("email")?.toString() ?: email
                    val resolvedAddress = userMap?.get("address")?.toString() ?: sessionManager.getUserAddress()
                    val resolvedPincode = userMap?.get("pincode")?.toString() ?: sessionManager.getUserPincode().ifEmpty { "400001" }

                    val profile = UserProfile(
                        id = userId,
                        phone = resolvedPhone,
                        fullName = resolvedName,
                        email = resolvedEmail,
                        role = "CUSTOMER"
                    )

                    // Persist session with verified JWT token and PostgreSQL user ID
                    sessionManager.saveSession(
                        token = token,
                        user = profile,
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    // Cache user profile metadata locally without storing plaintext password
                    sessionManager.registerUser(
                        fullName = resolvedName,
                        email = resolvedEmail,
                        phone = resolvedPhone,
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Welcome back, $resolvedName!"
                    )
                    return@launch
                } else {
                    val errMsg = extractErrorMessage(response, "Invalid email or password. Please check your credentials.")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                    return@launch
                }
            } catch (netEx: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Unable to connect to Ghar Tak auth server. Please check your internet connection."
                )
            }
        }
    }

    // ================= 2. SIGN UP: STEP 1 (NAME, EMAIL, SEND & VERIFY OTP) =================
    fun sendSignUpOtp() {
        val state = _uiState.value
        val name = state.fullName.trim()
        val email = state.email.trim().lowercase()

        if (name.isEmpty()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter your Full Name")
            return
        }

        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter a valid email address")
            return
        }

        _uiState.value = _uiState.value.copy(
            isLoading = true,
            errorMessage = null,
            successMessage = null
        )

        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val response = api.sendOtpGeneric(
                    mapOf(
                        "identifier" to email,
                        "type" to "EMAIL",
                        "purpose" to "REGISTER",
                        "name" to name
                    )
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isOtpSent = true,
                        successMessage = "Verification code sent to $email. Please check your inbox."
                    )
                } else {
                    val errMsg = extractErrorMessage(response, "Failed to send verification code. Please try again.")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Network error: Unable to contact authentication server. Please check your connection."
                )
            }
        }
    }

    fun verifySignUpOtp() {
        val state = _uiState.value
        val email = state.email.trim().lowercase()
        val inputOtp = state.otpCode.trim()

        if (inputOtp.length != 6) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter the 6-digit verification code")
            return
        }

        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val response = api.verifyOtpGeneric(
                    mapOf(
                        "identifier" to email,
                        "otp" to inputOtp,
                        "purpose" to "REGISTER",
                        "verifyOnly" to "true"
                    )
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        signUpStep = 2,
                        isEmailVerified = true,
                        errorMessage = null,
                        successMessage = "Email verified successfully! Please set your password and pincode."
                    )
                } else {
                    val errMsg = extractErrorMessage(response, "Invalid or expired verification code.")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Network error: Unable to verify code with server."
                )
            }
        }
    }

    // ================= 3. SIGN UP: STEP 2 (PASSWORD, PINCODE, OPTIONAL PHONE & ADDRESS) =================
    fun completeRegistration() {
        val state = _uiState.value
        val name = state.fullName.trim()
        val email = state.email.trim().lowercase()
        val phone = state.phoneNumber.trim()
        val password = state.password.trim()
        val confirm = state.confirmPassword.trim()
        val address = state.address.trim()
        val pincode = state.pincode.trim()

        if (password.length < 4) {
            _uiState.value = _uiState.value.copy(errorMessage = "Password must be at least 4 characters long")
            return
        }

        if (password != confirm) {
            _uiState.value = _uiState.value.copy(errorMessage = "Passwords do not match. Please re-enter.")
            return
        }

        if (pincode.length != 6) {
            _uiState.value = _uiState.value.copy(errorMessage = "Pincode is mandatory. Please enter a 6-digit Pincode.")
            return
        }

        if (phone.isNotEmpty() && phone.length < 10) {
            _uiState.value = _uiState.value.copy(errorMessage = "Mobile number must be 10 digits if provided.")
            return
        }

        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val api = ApiClient.getService(sessionManager.context)
            try {
                val formattedPhone = if (phone.isNotEmpty()) (if (phone.startsWith("+")) phone else "+91 $phone") else ""
                val response = api.register(
                    mapOf(
                        "fullName" to name,
                        "email" to email,
                        "password" to password,
                        "phone" to formattedPhone,
                        "address" to address,
                        "pincode" to pincode
                    )
                )

                if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                    val data = response.body()!!.data!!
                    val token = data["token"]?.toString()
                    if (token.isNullOrBlank()) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = "Registration failed: Access token was not issued by server."
                        )
                        return@launch
                    }
                    val userMap = data["user"] as? Map<*, *>

                    val userId = userMap?.get("id")?.toString() ?: "cust_${System.currentTimeMillis()}"
                    val resolvedPhone = userMap?.get("phone")?.toString() ?: formattedPhone

                    val profile = UserProfile(
                        id = userId,
                        phone = resolvedPhone,
                        fullName = name,
                        email = email,
                        role = "CUSTOMER"
                    )

                    // Save session with verified JWT token and PostgreSQL user ID
                    sessionManager.saveSession(
                        token = token,
                        user = profile,
                        address = address,
                        pincode = pincode
                    )

                    // Also cache profile metadata locally without storing plaintext password
                    sessionManager.registerUser(
                        fullName = name,
                        email = email,
                        phone = phone,
                        address = address,
                        pincode = pincode
                    )

                    // Clear any stale active jobs so new accounts start completely fresh
                    sessionManager.clearActiveJob()

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Welcome, $name! Account created and registered in database."
                    )
                    return@launch
                } else {
                    val errMsg = extractErrorMessage(response, "Registration failed. Please check your details.")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                    return@launch
                }
            } catch (e: Exception) {
                val detail = e.localizedMessage?.takeIf { it.isNotBlank() } ?: "Please check your internet connection."
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Unable to connect to registration server ($detail). Please try again."
                )
            }
        }
    }

    // ================= 4. FORGOT PASSWORD FLOW =================
    fun sendForgotPasswordOtp() {
        val state = _uiState.value
        val email = state.email.trim().lowercase()

        if (email.isEmpty() || !Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter your registered email address")
            return
        }

        _uiState.value = _uiState.value.copy(
            isLoading = true,
            errorMessage = null,
            successMessage = null
        )

        viewModelScope.launch {
            var recipientName = "GTS Customer"
            val localUser = sessionManager.getUserByEmail(email)
            if (localUser != null && localUser.optString("name", "").isNotBlank()) {
                recipientName = localUser.optString("name")
            }

            // Check if account exists on backend database and dispatch OTP
            try {
                val api = ApiClient.getService(sessionManager.context)
                val response = api.sendOtpGeneric(
                    mapOf(
                        "identifier" to email,
                        "type" to "EMAIL",
                        "purpose" to "RESET_PASSWORD"
                    )
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isOtpSent = true,
                        forgotStep = 2,
                        successMessage = "Security verification code sent to $email. Please check your inbox."
                    )
                } else {
                    val errMsg = extractErrorMessage(response, "No account found with this email or server error.")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                }
            } catch (netErr: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Network error: Unable to contact authentication server. Please check your connection."
                )
            }
        }
    }

    fun resetPasswordWithOtp() {
        val state = _uiState.value
        val email = state.email.trim().lowercase()
        val inputOtp = state.otpCode.trim()
        val newPassword = state.password.trim()
        val confirm = state.confirmPassword.trim()

        if (inputOtp.length != 6) {
            _uiState.value = _uiState.value.copy(errorMessage = "Please enter the 6-digit reset code sent to your email")
            return
        }

        if (newPassword.length < 4) {
            _uiState.value = _uiState.value.copy(errorMessage = "New password must be at least 4 characters long")
            return
        }

        if (newPassword != confirm) {
            _uiState.value = _uiState.value.copy(errorMessage = "Passwords do not match. Please re-enter.")
            return
        }

        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            val api = ApiClient.getService(sessionManager.context)
            try {
                // Call backend API to verify OTP and update password hash in PostgreSQL/Prisma
                val response = api.resetPassword(
                    mapOf(
                        "identifier" to email,
                        "otp" to inputOtp,
                        "newPassword" to newPassword
                    )
                )

                if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                    val data = response.body()!!.data!!
                    val token = data["token"]?.toString()
                    if (token.isNullOrBlank()) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = "Password reset failed: Access token was not issued by server."
                        )
                        return@launch
                    }
                    val userMap = data["user"] as? Map<*, *>

                    val userId = userMap?.get("id")?.toString() ?: "cust_${System.currentTimeMillis()}"
                    val resolvedName = userMap?.get("fullName")?.toString() ?: "Customer"
                    val resolvedPhone = userMap?.get("phone")?.toString() ?: ""
                    val resolvedEmail = userMap?.get("email")?.toString() ?: email
                    val resolvedAddress = userMap?.get("address")?.toString() ?: sessionManager.getUserAddress()
                    val resolvedPincode = userMap?.get("pincode")?.toString() ?: sessionManager.getUserPincode().ifEmpty { "400001" }

                    val profile = UserProfile(
                        id = userId,
                        phone = resolvedPhone,
                        fullName = resolvedName,
                        email = resolvedEmail,
                        role = "CUSTOMER"
                    )

                    // Persist session with verified JWT token and PostgreSQL user profile
                    sessionManager.saveSession(
                        token = token,
                        user = profile,
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    // Update user profile metadata in local SessionManager cache without plaintext password
                    sessionManager.registerUser(
                        fullName = resolvedName,
                        email = resolvedEmail,
                        phone = resolvedPhone,
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Password reset successfully! Welcome back, $resolvedName!"
                    )
                } else {
                    val errMsg = extractErrorMessage(response, "Failed to reset password. Please check your verification code.")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                }
            } catch (netEx: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Network error: Unable to connect to authentication server. Please check your internet connection."
                )
            }
        }
    }

    fun loginWithGoogle(
        selectedEmail: String,
        selectedName: String,
        idToken: String = "",
        googleId: String = ""
    ) {
        if (selectedEmail.isBlank() && idToken.isBlank()) {
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = "Google authentication requires a valid email address or token."
            )
            return
        }

        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val params = mutableMapOf(
                    "role" to "CUSTOMER"
                )
                if (selectedEmail.isNotBlank()) params["email"] = selectedEmail.trim().lowercase()
                if (selectedName.isNotBlank()) params["fullName"] = selectedName.trim()
                if (idToken.isNotBlank()) params["idToken"] = idToken.trim()
                if (googleId.isNotBlank()) params["googleId"] = googleId.trim()

                val response = api.googleSignIn(params)

                if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                    val data = response.body()!!.data!!
                    val token = data["token"]?.toString() ?: "jwt_google_${System.currentTimeMillis()}"
                    val userMap = data["user"] as? Map<*, *>

                    val userId = userMap?.get("id")?.toString() ?: "cust_${System.currentTimeMillis()}"
                    val resolvedName = userMap?.get("fullName")?.toString() ?: selectedName.ifEmpty { "Google User" }
                    val resolvedPhone = userMap?.get("phone")?.toString() ?: ""
                    val resolvedEmail = userMap?.get("email")?.toString() ?: selectedEmail
                    val resolvedAddress = userMap?.get("address")?.toString() ?: sessionManager.getUserAddress()
                    val resolvedPincode = userMap?.get("pincode")?.toString() ?: sessionManager.getUserPincode().ifEmpty { "400001" }

                    val profile = UserProfile(
                        id = userId,
                        phone = resolvedPhone,
                        fullName = resolvedName,
                        email = resolvedEmail,
                        role = "CUSTOMER"
                    )

                    sessionManager.saveSession(
                        token = token,
                        user = profile,
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    sessionManager.registerUser(
                        fullName = resolvedName,
                        email = resolvedEmail,
                        phone = resolvedPhone,
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Signed in successfully with Google! Welcome, $resolvedName!"
                    )
                } else {
                    val errMsg = extractErrorMessage(response, "Google authentication failed on server.")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Network error during Google sign-in: ${e.localizedMessage ?: "Please check connection."}"
                )
            }
        }
    }

    fun loginWithGoogleIdToken(idToken: String) {
        loginWithGoogle(selectedEmail = "", selectedName = "", idToken = idToken)
    }

    fun setErrorMessage(msg: String) {
        _uiState.value = _uiState.value.copy(isLoading = false, errorMessage = msg)
    }

    fun completeSignUp() = completeRegistration()
    fun sendForgotOtp() = sendForgotPasswordOtp()
    fun verifyForgotOtpAndResetPassword() = resetPasswordWithOtp()

    fun logout() {
        sessionManager.clearSession()
        _uiState.value = CustomerAuthUiState()
    }

    private fun extractErrorMessage(response: retrofit2.Response<*>, defaultMsg: String): String {
        return try {
            val errStr = response.errorBody()?.string()
            if (!errStr.isNullOrBlank()) {
                val errJson = org.json.JSONObject(errStr)
                when {
                    errJson.has("message") && errJson.getString("message").isNotBlank() -> errJson.getString("message")
                    errJson.has("error") && errJson.getString("error").isNotBlank() -> errJson.getString("error")
                    errJson.has("details") && errJson.getString("details").isNotBlank() -> errJson.getString("details")
                    else -> defaultMsg
                }
            } else {
                defaultMsg
            }
        } catch (e: Exception) {
            defaultMsg
        }
    }
}
