package com.ghartak.technician.ui.auth

import android.util.Patterns
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.RegisterTechnicianRequest
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
    val tradeSpecialty: String = "Electrician",
    val pincode: String = "760001",
    val experience: String = "3+ Years",
    val locationCity: String = "",
    val licenseNumber: String = "",
    val languages: String = "",

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

    fun onExperienceChanged(exp: String) {
        _uiState.value = _uiState.value.copy(experience = exp, errorMessage = null)
    }

    fun onLocationCityChanged(city: String) {
        _uiState.value = _uiState.value.copy(locationCity = city, errorMessage = null)
    }

    fun onLicenseChanged(lic: String) {
        _uiState.value = _uiState.value.copy(licenseNumber = lic, errorMessage = null)
    }

    fun onLanguagesChanged(lang: String) {
        _uiState.value = _uiState.value.copy(languages = lang, errorMessage = null)
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
            _uiState.value = state.copy(errorMessage = "Please enter your registered email or badge ID.")
            return
        }

        if (password.isBlank()) {
            _uiState.value = state.copy(errorMessage = "Please enter your password.")
            return
        }

        _uiState.value = state.copy(isLoading = true, errorMessage = null, successMessage = null)

        viewModelScope.launch {
            val api = ApiClient.getService(sessionManager.context)
            try {
                val response = api.login(
                    mapOf(
                        "identifier" to emailOrPhone,
                        "password" to password
                    )
                )

                if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                    val data = response.body()!!.data!!
                    val token = data["token"]?.toString()
                    if (token.isNullOrBlank()) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = "Server authentication error: Access token was not issued."
                        )
                        return@launch
                    }
                    val userMap = data["user"] as? Map<*, *>

                    val userId = userMap?.get("id")?.toString() ?: ""
                    val techId = userMap?.get("technicianId")?.toString() ?: (if (userId.isNotBlank()) "tech_$userId" else "tech_${System.currentTimeMillis()}")
                    val badgeNumber = userMap?.get("badgeNumber")?.toString() ?: "GTS-TECH-${techId.takeLast(4)}"
                    val fullName = userMap?.get("fullName")?.toString() ?: "Verified Professional"
                    val phone = userMap?.get("phone")?.toString() ?: sessionManager.getPhone()
                    val email = userMap?.get("email")?.toString() ?: if (emailOrPhone.contains("@")) emailOrPhone else ""
                    val partnerId = userMap?.get("partnerId")?.toString() ?: "partner_default"
                    val pincode = userMap?.get("pincode")?.toString() ?: sessionManager.getPincode().ifEmpty { "760001" }

                    val profile = sessionManager.getTechnicianProfile(emailOrPhone)?.copy(
                        id = techId,
                        badgeNumber = badgeNumber,
                        fullName = fullName,
                        phone = phone,
                        email = email
                    ) ?: TechnicianProfile(
                        id = techId,
                        badgeNumber = badgeNumber,
                        fullName = fullName,
                        phone = phone,
                        partnerId = partnerId,
                        assignedPincode = pincode,
                        isOnline = true,
                        rating = 4.9,
                        safetyKitSerial = "VDE-1000V-${techId.takeLast(4)}",
                        insulatedGlovesVerified = true,
                        totalJobsCompleted = 0,
                        email = email
                    )

                    // Cache locally in SessionManager for persistence across app restarts
                    sessionManager.saveSession(token, profile)
                    com.ghartak.technician.service.TechnicianLocationService.startService(sessionManager.context, null)

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Shift Activated. Welcome back, ${profile.fullName}!"
                    )
                    return@launch
                } else {
                    val errMsg = extractErrorMessage(response, "Invalid credentials. Please verify your email / badge ID and password.")
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

    private fun getBestKnownLocation(pincode: String): Pair<Double, Double> {
        val (fallbackLat, fallbackLng) = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(pincode)
        try {
            val lm = sessionManager.context.getSystemService(android.content.Context.LOCATION_SERVICE) as? android.location.LocationManager
                ?: return Pair(fallbackLat, fallbackLng)
            val providers = listOf(
                android.location.LocationManager.GPS_PROVIDER,
                android.location.LocationManager.NETWORK_PROVIDER,
                android.location.LocationManager.PASSIVE_PROVIDER
            )
            for (p in providers) {
                try {
                    val loc = lm.getLastKnownLocation(p)
                    if (loc != null) {
                        return Pair(loc.latitude, loc.longitude)
                    }
                } catch (_: SecurityException) {}
            }
        } catch (_: Throwable) {}
        return Pair(fallbackLat, fallbackLng)
    }

    // ================= GOOGLE SIGN IN =================
    fun loginWithGoogle(
        selectedEmail: String,
        selectedName: String
    ) {
        if (selectedEmail.isBlank()) {
            _uiState.value = _uiState.value.copy(
                isLoading = false,
                errorMessage = "Google sign-in requires a valid email address."
            )
            return
        }

        _uiState.value = _uiState.value.copy(
            isLoading = false,
            errorMessage = "Google Play Services cryptographic ID token is required for secure authentication. Please sign in with email and password."
        )
    }

    fun loginWithGoogleIdToken(idToken: String) {
        _uiState.value = _uiState.value.copy(isLoading = true, errorMessage = null, successMessage = null)
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val response = api.googleSignIn(
                    mapOf(
                        "idToken" to idToken,
                        "role" to "TECHNICIAN"
                    )
                )

                if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                    val data = response.body()!!.data!!
                    val token = data["token"]?.toString()
                    if (token.isNullOrBlank()) {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            errorMessage = "Google authentication failed: Access token was not issued by server."
                        )
                        return@launch
                    }
                    val userMap = data["user"] as? Map<*, *>

                    val techId = userMap?.get("technicianId")?.toString() ?: userMap?.get("id")?.toString() ?: "tech_${System.currentTimeMillis()}"
                    val badgeNumber = userMap?.get("badgeNumber")?.toString() ?: "GTS-TECH-${(1000..9999).random()}"
                    val fullName = userMap?.get("fullName")?.toString() ?: "Certified Professional"
                    val email = userMap?.get("email")?.toString() ?: ""
                    val phone = userMap?.get("phone")?.toString() ?: sessionManager.getPhone().ifEmpty { "" }
                    val pincode = userMap?.get("pincode")?.toString() ?: sessionManager.getPincode().ifEmpty { "760001" }

                    val profile = sessionManager.registerTechnician(
                        fullName = fullName,
                        email = email,
                        phone = phone,
                        trade = "Certified Professional",
                        pincode = pincode
                    )

                    sessionManager.saveSession(token, profile)

                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        isLoggedIn = true,
                        successMessage = "Signed in successfully with Google! Welcome back, $fullName."
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
                    errorMessage = "Network error during Google authentication. Please try again."
                )
            }
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
            try {
                val api = ApiClient.getService(sessionManager.context)
                val response = api.sendOtp(
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
                        successMessage = "Verification OTP sent to $email. Please check your inbox."
                    )
                } else {
                    val errMsg = extractErrorMessage(response, "Failed to dispatch verification code.")
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
        val entered = state.otpCode.trim()

        if (entered.length != 6) {
            _uiState.value = state.copy(errorMessage = "Please enter the complete 6-digit verification code.")
            return
        }

        _uiState.value = state.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val response = api.verifyOtp(
                    mapOf(
                        "identifier" to state.email,
                        "otp" to entered,
                        "purpose" to "REGISTER",
                        "verifyOnly" to "true"
                    )
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.value = state.copy(
                        isLoading = false,
                        signUpStep = 2,
                        isEmailVerified = true,
                        errorMessage = null,
                        successMessage = "Email verified successfully! Now complete your technician credentials."
                    )
                } else {
                    val errMsg = extractErrorMessage(response, "Incorrect or expired verification code.")
                    _uiState.value = state.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                }
            } catch (e: Exception) {
                _uiState.value = state.copy(
                    isLoading = false,
                    errorMessage = "Network error: Unable to verify code with server."
                )
            }
        }
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
        val trade = state.tradeSpecialty.trim().ifEmpty { "Certified Electrician" }
        val pincode = state.pincode.trim().ifEmpty { "760001" }

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
                pincode = pincode,
                experience = state.experience,
                location = state.locationCity,
                license = state.licenseNumber,
                languages = state.languages,
                serviceArea = "$pincode Doorstep Territory"
            )

            // Register with backend database so customer app and dispatch board can assign work
            try {
                val (liveLat, liveLng) = getBestKnownLocation(profile.assignedPincode)
                val api = ApiClient.getService(sessionManager.context)
                api.registerTechnician(
                    RegisterTechnicianRequest(
                        id = profile.id,
                        badgeNumber = profile.badgeNumber,
                        fullName = profile.fullName,
                        phone = profile.phone,
                        email = profile.email,
                        trade = profile.specialization,
                        pincode = profile.assignedPincode,
                        latitude = liveLat,
                        longitude = liveLng,
                        password = password
                    )
                )
                com.ghartak.technician.service.TechnicianLocationService.startService(sessionManager.context, null)
            } catch (e: Exception) {
                e.printStackTrace()
            }

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

        _uiState.value = state.copy(isLoading = true, errorMessage = null)

        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val response = api.sendOtp(
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
                        successMessage = "Password reset code sent to $email. Please check your inbox."
                    )
                } else {
                    val errMsg = extractErrorMessage(response, "No technician account found with this email.")
                    _uiState.value = state.copy(
                        isLoading = false,
                        errorMessage = errMsg
                    )
                }
            } catch (netErr: Exception) {
                _uiState.value = state.copy(
                    isLoading = false,
                    errorMessage = "Network error: Unable to contact server. Please check your internet connection."
                )
            }
        }
    }

    fun resetPasswordWithOtp() {
        val state = _uiState.value
        val enteredOtp = state.otpCode.trim()
        val newPassword = state.password.trim()
        val confirmPass = state.confirmPassword.trim()

        if (enteredOtp.length != 6) {
            _uiState.value = state.copy(errorMessage = "Please enter the complete 6-digit verification code.")
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
            val api = ApiClient.getService(sessionManager.context)
            try {
                // Call backend API to verify OTP and update password hash in PostgreSQL/Prisma
                val response = api.resetPassword(
                    mapOf(
                        "identifier" to state.email,
                        "otp" to enteredOtp,
                        "newPassword" to newPassword
                    )
                )

                if (response.isSuccessful && response.body()?.success == true) {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        mode = "LOGIN",
                        password = "",
                        confirmPassword = "",
                        otpCode = "",
                        successMessage = "Password reset successfully! Please sign in with your new password."
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
                    errorMessage = "Network error: Unable to connect to authentication server. Please check your connection."
                )
            }
        }
    }

    fun logout() {
        val techId = sessionManager.getTechnicianId()
        val badge = sessionManager.getBadgeNumber()
        val context = sessionManager.context
        viewModelScope.launch {
            try {
                val api = com.ghartak.technician.data.api.ApiClient.getService(context)
                if (techId.isNotEmpty()) {
                    api.updateAvailability(techId, mapOf("isOnline" to false))
                }
                if (badge.isNotEmpty()) {
                    api.updateAvailability(badge, mapOf("isOnline" to false))
                }
            } catch (e: Exception) {
                // ignore
            }
        }
        sessionManager.setOnline(false)
        sessionManager.clearSession()
        _uiState.value = TechnicianAuthUiState(
            mode = "LOGIN",
            isLoggedIn = false,
            email = "",
            password = "",
            confirmPassword = "",
            otpCode = "",
            errorMessage = null,
            successMessage = null
        )
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
        } catch (_: Exception) {
            defaultMsg
        }
    }
}