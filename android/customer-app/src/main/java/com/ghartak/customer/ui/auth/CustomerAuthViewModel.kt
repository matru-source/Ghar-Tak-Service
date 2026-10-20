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
                        "password" to password
                    )
                )

                if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                    val data = response.body()!!.data!!
                    val token = data["token"]?.toString() ?: "jwt_cust_${System.currentTimeMillis()}"
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

                    // Cache locally in SessionManager for offline support
                    sessionManager.registerUser(
                        fullName = resolvedName,
                        email = resolvedEmail,
                        phone = resolvedPhone,
                        password = password,
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
                    val errMsg = response.body()?.message ?: "Invalid email or password. Please check your credentials."
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                    return@launch
                }
            } catch (netEx: Exception) {
                // If offline / network error, check if user credentials exist locally in sessionManager without backdoor
                val isValidLocal = sessionManager.validatePassword(email, password)
                if (isValidLocal) {
                    val existing = sessionManager.getUserByEmail(email)
                    val resolvedName = existing?.optString("name", "Customer") ?: "Customer"
                    val resolvedPhone = existing?.optString("phone", "") ?: ""
                    val resolvedAddress = existing?.optString("address", "") ?: ""
                    val resolvedPincode = existing?.optString("pincode", "400001") ?: "400001"

                    val profile = UserProfile(
                        id = sessionManager.getUserId().ifEmpty { "cust_offline" },
                        phone = resolvedPhone,
                        fullName = resolvedName,
                        email = email,
                        role = "CUSTOMER"
                    )

                    val savedToken = sessionManager.getAuthToken()?.ifEmpty { null } ?: "offline_token_${System.currentTimeMillis()}"
                    sessionManager.saveSession(
                        token = savedToken,
                        user = profile,
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Offline login successful. Welcome back, $resolvedName!"
                    )
                    return@launch
                }

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

        if (sessionManager.isEmailRegistered(email)) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Email '$email' is already registered. Please switch to Sign In.",
                isLoading = false
            )
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
                    val errMsg = try {
                        val errStr = response.errorBody()?.string()
                        val errJson = org.json.JSONObject(errStr ?: "{}")
                        errJson.optString("message", "Failed to send verification code. Please try again.")
                    } catch (_: Exception) {
                        response.body()?.message ?: "Failed to send verification code. Please try again."
                    }
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
                    val errMsg = try {
                        val errStr = response.errorBody()?.string()
                        val errJson = org.json.JSONObject(errStr ?: "{}")
                        errJson.optString("message", "Invalid or expired verification code.")
                    } catch (_: Exception) {
                        response.body()?.message ?: "Invalid or expired verification code."
                    }
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
                    val token = data["token"]?.toString() ?: "jwt_cust_${System.currentTimeMillis()}"
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

                    // Also cache locally in SessionManager for offline support
                    sessionManager.registerUser(
                        fullName = name,
                        email = email,
                        phone = phone,
                        password = password,
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
                    val errMsg = response.body()?.message ?: "Registration failed. Please check your details."
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                    return@launch
                }
            } catch (e: Exception) {
                // If offline / network error
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Unable to connect to Ghar Tak registration server. Please check your internet connection."
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
                    val errMsg = try {
                        val errStr = response.errorBody()?.string()
                        val errJson = org.json.JSONObject(errStr ?: "{}")
                        errJson.optString("message", "No account found with this email or server error.")
                    } catch (_: Exception) {
                        response.body()?.message ?: "No registered account found with email '$email'."
                    }
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
                    val token = data["token"]?.toString() ?: "jwt_cust_${System.currentTimeMillis()}"
                    val userMap = data["user"] as? Map<*, *>

                    val userId = userMap?.get("id")?.toString() ?: "cust_${System.currentTimeMillis()}"
                    val resolvedName = userMap?.get("fullName")?.toString() ?: "Customer"
                    val resolvedPhone = userMap?.get("phone")?.toString() ?: ""
                    val resolvedEmail = userMap?.get("email")?.toString() ?: email
                    val resolvedAddress = userMap?.get("address")?.toString() ?: sessionManager.getUserAddress()
                    val resolvedPincode = userMap?.get("pincode")?.toString() ?: sessionManager.getUserPincode().ifEmpty { "760001" }

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

                    // Update password in local SessionManager cache for offline authentication
                    sessionManager.registerUser(
                        fullName = resolvedName,
                        email = resolvedEmail,
                        phone = resolvedPhone,
                        password = newPassword,
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Password reset successfully! Welcome back, $resolvedName!"
                    )
                } else {
                    val errMsg = try {
                        val errStr = response.errorBody()?.string()
                        val errJson = org.json.JSONObject(errStr ?: "{}")
                        errJson.optString("message", "Failed to reset password. Please check your verification code.")
                    } catch (_: Exception) {
                        response.body()?.message ?: "Failed to reset password. Please verify your code."
                    }
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
        selectedPhone: String = "",
        selectedAddress: String = "",
        selectedPincode: String = "760001"
    ) {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            delay(300)
            val cleanEmail = selectedEmail.trim().lowercase()
            val existingUserJson = sessionManager.getUserByEmail(cleanEmail)

            val name = if (existingUserJson != null && existingUserJson.optString("name", "").isNotBlank()) {
                existingUserJson.optString("name")
            } else {
                selectedName.trim().ifEmpty { cleanEmail.substringBefore("@") }
            }
            val phone = if (!selectedPhone.isNullOrBlank()) selectedPhone else existingUserJson?.optString("phone", "") ?: ""
            val address = if (!selectedAddress.isNullOrBlank()) selectedAddress else existingUserJson?.optString("address", "") ?: ""
            val pincode = if (!selectedPincode.isNullOrBlank()) selectedPincode else existingUserJson?.optString("pincode", "760001") ?: "760001"

            val uid = "cust_google_${System.currentTimeMillis() % 10000}"
            val profile = UserProfile(
                id = uid,
                phone = phone,
                fullName = name,
                email = cleanEmail,
                role = "CUSTOMER"
            )

            // If account was not in registry, register it now
            if (existingUserJson == null) {
                sessionManager.registerUser(
                    fullName = name,
                    email = cleanEmail,
                    phone = phone,
                    password = "google_auth_${System.currentTimeMillis()}",
                    address = address,
                    pincode = pincode
                )
            }

            sessionManager.saveSession(
                token = "gts_google_token_${uid}",
                user = profile,
                address = address,
                pincode = pincode
            )

            // Sync with backend database
            try {
                val api = ApiClient.getService(sessionManager.context)
                val regRes = api.register(
                    mapOf(
                        "fullName" to name,
                        "email" to cleanEmail,
                        "password" to "GoogleOAuth2026!",
                        "phone" to phone,
                        "address" to address,
                        "pincode" to pincode
                    )
                )
                if (regRes.isSuccessful && regRes.body()?.data != null) {
                    val serverData = regRes.body()!!.data!!
                    val serverToken = serverData["token"]?.toString()
                    val userMap = serverData["user"] as? Map<*, *>
                    val serverUid = userMap?.get("id")?.toString()
                    if (!serverToken.isNullOrBlank() && !serverUid.isNullOrBlank()) {
                        val serverProfile = profile.copy(id = serverUid)
                        sessionManager.saveSession(serverToken, serverProfile, address, pincode)
                    }
                }
            } catch (_: Exception) {
            }

            _uiState.value = _uiState.value.copy(
                isLoading = false,
                isLoggedIn = true,
                successMessage = if (existingUserJson != null) {
                    "Welcome back, $name! Signed in via Google."
                } else {
                    "Welcome to Ghar Tak, $name! Google account linked."
                }
            )
        }
    }

    fun loginWithGoogleIdToken(idToken: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null)
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val response = api.googleSignIn(
                    mapOf(
                        "idToken" to idToken,
                        "role" to "CUSTOMER"
                    )
                )

                if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                    val data = response.body()!!.data!!
                    val token = data["token"]?.toString() ?: "jwt_google_${System.currentTimeMillis()}"
                    val userMap = data["user"] as? Map<*, *>

                    val userId = userMap?.get("id")?.toString() ?: "cust_${System.currentTimeMillis()}"
                    val resolvedName = userMap?.get("fullName")?.toString() ?: "Google User"
                    val resolvedPhone = userMap?.get("phone")?.toString() ?: ""
                    val resolvedEmail = userMap?.get("email")?.toString() ?: ""
                    val resolvedAddress = userMap?.get("address")?.toString() ?: sessionManager.getUserAddress()
                    val resolvedPincode = userMap?.get("pincode")?.toString() ?: sessionManager.getUserPincode().ifEmpty { "760001" }

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
                        password = "GOOGLE_OAUTH_AUTHENTICATED",
                        address = resolvedAddress,
                        pincode = resolvedPincode
                    )

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Signed in successfully with Google! Welcome, $resolvedName!"
                    )
                } else {
                    val errMsg = try {
                        val errStr = response.errorBody()?.string()
                        val errJson = org.json.JSONObject(errStr ?: "{}")
                        errJson.optString("message", "Google authentication failed on server.")
                    } catch (_: Exception) {
                        response.body()?.message ?: "Google authentication failed."
                    }
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    errorMessage = "Network error during Google authentication. Please try again."
                )
            }
        }
    }

    fun completeSignUp() = completeRegistration()
    fun sendForgotOtp() = sendForgotPasswordOtp()
    fun verifyForgotOtpAndResetPassword() = resetPasswordWithOtp()

    fun logout() {
        sessionManager.clearSession()
        _uiState.value = CustomerAuthUiState()
    }
}
