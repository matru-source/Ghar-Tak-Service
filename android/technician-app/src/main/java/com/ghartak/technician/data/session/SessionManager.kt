package com.ghartak.technician.data.session

import android.content.Context
import android.content.SharedPreferences
import com.ghartak.technician.data.model.TechnicianProfile
import org.json.JSONObject

class SessionManager(val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREF_NAME = "gts_technician_session"
        private const val KEY_AUTH_TOKEN = "key_auth_token"
        private const val KEY_TECH_ID = "key_tech_id"
        private const val KEY_BADGE_NUMBER = "key_badge_number"
        private const val KEY_FULL_NAME = "key_full_name"
        private const val KEY_PHONE = "key_phone"
        private const val KEY_PARTNER_ID = "key_partner_id"
        private const val KEY_PINCODE = "key_pincode"
        private const val KEY_IS_ONLINE = "key_is_online"
        private const val KEY_RATING = "key_rating"
        private const val KEY_GLOVES_VERIFIED = "key_gloves_verified"
        private const val KEY_TOTAL_JOBS = "key_total_jobs"
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
        private const val KEY_TECHNICIANS_REGISTRY = "key_technicians_registry"
        private const val KEY_EMAIL = "key_email"
        private const val KEY_LOCATION = "key_location"
        private const val KEY_LANGUAGES = "key_languages"
        private const val KEY_SPECIALIZATION = "key_specialization"
        private const val KEY_EXPERIENCE = "key_experience"
        private const val KEY_LICENSE = "key_license"
        private const val KEY_SERVICE_AREA = "key_service_area"
        private const val KEY_SCHEMA_VERSION = "key_schema_version"
        private const val KEY_CUSTOM_BASE_URL = "key_custom_base_url"
        const val DEFAULT_BASE_URL = "https://ghartak-api.onrender.com/api/"
    }

    init {
        val savedBaseUrl = prefs.getString(KEY_CUSTOM_BASE_URL, null)
        if (!savedBaseUrl.isNullOrBlank()) {
            com.ghartak.technician.data.api.ApiClient.updateBaseUrl(savedBaseUrl)
        }

        // Pre-seed default electrician if registry is fresh
        val registryStr = prefs.getString(KEY_TECHNICIANS_REGISTRY, "")
        if (registryStr.isNullOrBlank()) {
            val json = JSONObject()
            val defaultTech = JSONObject().apply {
                put("id", "tech_rajesh_01")
                put("badgeNumber", "GTS-TECH-4091")
                put("fullName", "Rajesh Kumar")
                put("email", "technician@ghartak.com")
                put("phone", "+91 9811223344")
                put("password", "admin123")
                put("trade", "1000V Certified Senior Electrician")
                put("pincode", "400001")
            }
            json.put("technician@ghartak.com", defaultTech)
            json.put("9811223344", defaultTech)
            prefs.edit().putString(KEY_TECHNICIANS_REGISTRY, json.toString()).apply()
        }
    }

    fun getCustomBaseUrl(): String {
        return prefs.getString(KEY_CUSTOM_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }

    fun setCustomBaseUrl(url: String) {
        val sanitized = if (url.trim().endsWith("/")) url.trim() else "${url.trim()}/"
        prefs.edit().putString(KEY_CUSTOM_BASE_URL, sanitized).apply()
        com.ghartak.technician.data.api.ApiClient.updateBaseUrl(sanitized)
    }

    fun isEmailRegistered(rawEmail: String): Boolean {
        val cleanEmail = rawEmail.trim().lowercase()
        val registryStr = prefs.getString(KEY_TECHNICIANS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            json.has(cleanEmail)
        } catch (e: Exception) {
            false
        }
    }

    fun isPhoneRegistered(rawPhone: String): Boolean {
        val cleanPhone = rawPhone.filter { it.isDigit() }.takeLast(10)
        val registryStr = prefs.getString(KEY_TECHNICIANS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            json.has(cleanPhone)
        } catch (e: Exception) {
            false
        }
    }

    fun registerTechnician(
        fullName: String,
        email: String,
        phone: String,
        password: String,
        trade: String = "1000V Certified Electrician",
        pincode: String = "400001"
    ): TechnicianProfile {
        val cleanEmail = email.trim().lowercase()
        val cleanPhone = phone.filter { it.isDigit() }.takeLast(10)
        val techId = "tech_" + (1000..9999).random()
        val badgeNumber = "GTS-TECH-" + (3000..9999).random()

        val registryStr = prefs.getString(KEY_TECHNICIANS_REGISTRY, "{}") ?: "{}"
        try {
            val json = JSONObject(registryStr)
            val techObj = JSONObject().apply {
                put("id", techId)
                put("badgeNumber", badgeNumber)
                put("fullName", fullName.trim())
                put("email", cleanEmail)
                put("phone", if (phone.startsWith("+")) phone.trim() else if (cleanPhone.isNotEmpty()) "+91 $cleanPhone" else "+91 9876543210")
                put("password", password.trim())
                put("trade", trade.trim())
                put("pincode", pincode.trim().ifEmpty { "400001" })
            }
            json.put(cleanEmail, techObj)
            if (cleanPhone.isNotEmpty()) {
                json.put(cleanPhone, techObj)
            }
            prefs.edit().putString(KEY_TECHNICIANS_REGISTRY, json.toString()).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        val registeredTrade = trade.trim().ifEmpty { "Electrician" }
        prefs.edit().putString(KEY_SPECIALIZATION, registeredTrade).apply()

        val profile = TechnicianProfile(
            id = techId,
            badgeNumber = badgeNumber,
            fullName = fullName.trim(),
            phone = if (phone.startsWith("+")) phone.trim() else "+91 $cleanPhone",
            partnerId = "partner_mh_01",
            assignedPincode = pincode.trim().ifEmpty { "400001" },
            isOnline = true,
            rating = 4.9,
            safetyKitSerial = "GTS-SAFETY-KIT-99214",
            insulatedGlovesVerified = false,
            totalJobsCompleted = 0,
            specialization = registeredTrade
        )
        saveSession("token_${System.currentTimeMillis()}", profile)
        return profile
    }

    fun validatePassword(rawEmailOrPhone: String, rawPassword: String): Boolean {
        val cleanKey = rawEmailOrPhone.trim().lowercase()
        val phoneKey = rawEmailOrPhone.filter { it.isDigit() }.takeLast(10)
        val registryStr = prefs.getString(KEY_TECHNICIANS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            val techObj = when {
                json.has(cleanKey) -> json.getJSONObject(cleanKey)
                phoneKey.isNotEmpty() && json.has(phoneKey) -> json.getJSONObject(phoneKey)
                else -> return false
            }
            val savedPassword = techObj.optString("password", "")
            savedPassword == rawPassword.trim()
        } catch (e: Exception) {
            false
        }
    }

    fun updatePassword(rawEmail: String, newPassword: String): Boolean {
        val cleanEmail = rawEmail.trim().lowercase()
        val registryStr = prefs.getString(KEY_TECHNICIANS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            if (!json.has(cleanEmail)) return false
            val userObj = json.getJSONObject(cleanEmail)
            userObj.put("password", newPassword.trim())
            json.put(cleanEmail, userObj)
            val phone = userObj.optString("phone", "").filter { it.isDigit() }.takeLast(10)
            if (phone.isNotEmpty() && json.has(phone)) {
                json.put(phone, userObj)
            }
            prefs.edit().putString(KEY_TECHNICIANS_REGISTRY, json.toString()).apply()
            true
        } catch (e: Exception) {
            false
        }
    }

    fun getTechnicianProfile(emailOrPhone: String): TechnicianProfile? {
        val cleanKey = emailOrPhone.trim().lowercase()
        val phoneKey = emailOrPhone.filter { it.isDigit() }.takeLast(10)
        val registryStr = prefs.getString(KEY_TECHNICIANS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            val techObj = when {
                json.has(cleanKey) -> json.getJSONObject(cleanKey)
                phoneKey.isNotEmpty() && json.has(phoneKey) -> json.getJSONObject(phoneKey)
                else -> return null
            }

            val savedJobs = techObj.optInt("totalJobsCompleted", 0)
            val techPin = techObj.optString("pincode", "400001")
            val defaultLoc = if (techPin.startsWith("75") || techPin.startsWith("76") || techPin.startsWith("77")) "Odisha, India" else "Mumbai, Maharashtra"

            TechnicianProfile(
                id = techObj.optString("id", "tech_rajesh_01"),
                badgeNumber = techObj.optString("badgeNumber", "GTS-TECH-4091"),
                fullName = techObj.optString("fullName", "Rajesh Kumar"),
                phone = techObj.optString("phone", "+91 9811223344"),
                partnerId = if (techPin.startsWith("75") || techPin.startsWith("76") || techPin.startsWith("77")) "partner_od_01" else "partner_mh_01",
                assignedPincode = techPin,
                isOnline = true,
                rating = 5.0,
                safetyKitSerial = "VDE-1000V-99214",
                insulatedGlovesVerified = false,
                totalJobsCompleted = savedJobs,
                location = defaultLoc,
                specialization = techObj.optString("trade", "Certified Professional")
            )
        } catch (e: Exception) {
            null
        }
    }

    fun saveSession(token: String, profile: TechnicianProfile) {
        val techPin = profile.assignedPincode
        val defaultLoc = if (techPin.startsWith("75") || techPin.startsWith("76") || techPin.startsWith("77")) "Odisha, India" else "Mumbai, Maharashtra"
        val defaultLang = if (techPin.startsWith("75") || techPin.startsWith("76") || techPin.startsWith("77")) "Odia, English, Hindi" else "English, Hindi, Marathi"
        prefs.edit().apply {
            putString(KEY_AUTH_TOKEN, token)
            putString(KEY_TECH_ID, profile.id)
            putString(KEY_BADGE_NUMBER, profile.badgeNumber)
            putString(KEY_FULL_NAME, profile.fullName)
            putString(KEY_PHONE, profile.phone)
            putString(KEY_PARTNER_ID, profile.partnerId)
            putString(KEY_PINCODE, profile.assignedPincode)
            putBoolean(KEY_IS_ONLINE, profile.isOnline)
            putFloat(KEY_RATING, profile.rating.toFloat())
            putBoolean(KEY_GLOVES_VERIFIED, profile.insulatedGlovesVerified)
            putInt(KEY_TOTAL_JOBS, profile.totalJobsCompleted)
            putString(KEY_LOCATION, profile.location ?: defaultLoc)
            putString(KEY_LANGUAGES, profile.languages ?: defaultLang)
            putString(KEY_EMAIL, profile.email ?: "technician@ghartak.com")
            putString(KEY_SPECIALIZATION, profile.specialization)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun getTotalJobsCompleted(): Int = prefs.getInt(KEY_TOTAL_JOBS, 0)

    fun incrementJobsCompleted() {
        prefs.edit().putInt(KEY_TOTAL_JOBS, getTotalJobsCompleted() + 1).apply()
    }

    fun getTodayEarnings(): Double = prefs.getFloat("key_today_earnings", 0.0f).toDouble()
    fun getWeekEarnings(): Double = prefs.getFloat("key_week_earnings", 0.0f).toDouble()
    fun getMonthEarnings(): Double = prefs.getFloat("key_month_earnings", 0.0f).toDouble()

    fun addEarnings(amount: Double) {
        val today = getTodayEarnings() + amount
        val week = getWeekEarnings() + amount
        val month = getMonthEarnings() + amount
        prefs.edit().apply {
            putFloat("key_today_earnings", today.toFloat())
            putFloat("key_week_earnings", week.toFloat())
            putFloat("key_month_earnings", month.toFloat())
            apply()
        }
        incrementJobsCompleted()
    }

    fun getAuthToken(): String? = prefs.getString(KEY_AUTH_TOKEN, null)

    fun getTechnicianId(): String = prefs.getString(KEY_TECH_ID, "tech_rajesh_01") ?: "tech_rajesh_01"

    fun getBadgeNumber(): String = prefs.getString(KEY_BADGE_NUMBER, "GTS-TECH-4091") ?: "GTS-TECH-4091"

    fun getFullName(): String = prefs.getString(KEY_FULL_NAME, "Rajesh Kumar") ?: "Rajesh Kumar"

    fun getPhone(): String = prefs.getString(KEY_PHONE, "+919811223344") ?: "+919811223344"

    fun getPartnerId(): String = prefs.getString(KEY_PARTNER_ID, "partner_mh_01") ?: "partner_mh_01"

    fun getPincode(): String = prefs.getString(KEY_PINCODE, "400001") ?: "400001"

    fun isOnline(): Boolean = prefs.getBoolean(KEY_IS_ONLINE, true)

    fun setOnline(online: Boolean) {
        prefs.edit().putBoolean(KEY_IS_ONLINE, online).apply()
    }

    fun getRating(): Float = prefs.getFloat(KEY_RATING, 5.0f)

    fun isGlovesVerified(): Boolean = prefs.getBoolean(KEY_GLOVES_VERIFIED, false)

    fun setGlovesVerified(verified: Boolean) {
        prefs.edit().putBoolean(KEY_GLOVES_VERIFIED, verified).apply()
    }

    fun getEmail(): String = prefs.getString(KEY_EMAIL, "technician@ghartak.com") ?: "technician@ghartak.com"
    fun getLocation(): String {
        val pin = getPincode()
        val defaultLoc = if (pin.startsWith("75") || pin.startsWith("76") || pin.startsWith("77")) "Odisha, India" else "Mumbai, Maharashtra"
        return prefs.getString(KEY_LOCATION, defaultLoc) ?: defaultLoc
    }
    fun getLanguages(): String {
        val pin = getPincode()
        val defaultLang = if (pin.startsWith("75") || pin.startsWith("76") || pin.startsWith("77")) "Odia, English, Hindi" else "English, Hindi, Marathi"
        return prefs.getString(KEY_LANGUAGES, defaultLang) ?: defaultLang
    }
    fun getSpecialization(): String = prefs.getString(KEY_SPECIALIZATION, "Electrician") ?: "Electrician"
    fun getExperience(): String = prefs.getString(KEY_EXPERIENCE, "5+ Years") ?: "5+ Years"
    fun getLicense(): String = prefs.getString(KEY_LICENSE, "Trade Certified Professional") ?: "Trade Certified Professional"
    fun getServiceArea(): String = prefs.getString(KEY_SERVICE_AREA, "Doorstep Territory") ?: "Doorstep Territory"

    fun updatePersonalInfo(name: String, phone: String, email: String, location: String, languages: String) {
        prefs.edit().apply {
            putString(KEY_FULL_NAME, name.trim())
            putString(KEY_PHONE, phone.trim())
            putString(KEY_EMAIL, email.trim())
            putString(KEY_LOCATION, location.trim())
            putString(KEY_LANGUAGES, languages.trim())
            apply()
        }
    }

    fun updateServiceDetails(specialization: String, experience: String, license: String, serviceArea: String) {
        prefs.edit().apply {
            putString(KEY_SPECIALIZATION, specialization.trim())
            putString(KEY_EXPERIENCE, experience.trim())
            putString(KEY_LICENSE, license.trim())
            putString(KEY_SERVICE_AREA, serviceArea.trim())
            apply()
        }
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun clearSession() {
        prefs.edit().apply {
            remove(KEY_AUTH_TOKEN)
            remove(KEY_TECH_ID)
            remove(KEY_BADGE_NUMBER)
            remove(KEY_FULL_NAME)
            remove(KEY_PHONE)
            remove(KEY_PARTNER_ID)
            remove(KEY_PINCODE)
            remove(KEY_IS_ONLINE)
            remove(KEY_RATING)
            remove(KEY_GLOVES_VERIFIED)
            putBoolean(KEY_IS_LOGGED_IN, false)
            apply()
        }
    }
}