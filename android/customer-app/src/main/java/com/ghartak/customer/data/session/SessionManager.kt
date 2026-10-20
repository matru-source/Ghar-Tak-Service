package com.ghartak.customer.data.session

import android.content.Context
import android.content.SharedPreferences
import com.ghartak.customer.data.model.PastOrderItem
import com.ghartak.customer.data.model.UserProfile
import org.json.JSONArray
import org.json.JSONObject

class SessionManager(val context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREF_NAME = "gts_customer_session"
        private const val KEY_AUTH_TOKEN = "key_auth_token"
        private const val KEY_USER_ID = "key_user_id"
        private const val KEY_USER_NAME = "key_user_name"
        private const val KEY_USER_EMAIL = "key_user_email"
        private const val KEY_USER_PHONE = "key_user_phone"
        private const val KEY_USER_ADDRESS = "key_user_address"
        private const val KEY_USER_PINCODE = "key_user_pincode"
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
        private const val KEY_USERS_REGISTRY = "key_users_registry"
        private const val KEY_CUSTOM_BASE_URL = "key_custom_base_url"
        private const val KEY_USER_PROFILE_IMAGE = "key_user_profile_image"
        private const val KEY_PAST_ORDERS = "key_past_orders"

        // Active Job & Invoice Persistence Keys
        private const val KEY_ACTIVE_JOB_ID = "key_active_job_id"
        private const val KEY_ACTIVE_JOB_TITLE = "key_active_job_title"
        private const val KEY_ACTIVE_JOB_BASE_PRICE = "key_active_job_base_price"
        private const val KEY_ACTIVE_JOB_GST = "key_active_job_gst"
        private const val KEY_ACTIVE_JOB_TOTAL = "key_active_job_total"
        private const val KEY_ACTIVE_JOB_TECH_NAME = "key_active_job_tech_name"
        private const val KEY_ACTIVE_JOB_TECH_BADGE = "key_active_job_tech_badge"
        private const val KEY_ACTIVE_JOB_TECH_PHONE = "key_active_job_tech_phone"
        private const val KEY_ACTIVE_JOB_TICKET_NO = "key_active_job_ticket_no"
        private const val KEY_ACTIVE_JOB_STATE_CODE = "key_active_job_state_code"
        private const val KEY_ACTIVE_JOB_GSTIN = "key_active_job_gstin"
        private const val KEY_ACTIVE_JOB_OTP = "key_active_job_otp"
        private const val KEY_ACTIVE_JOB_STATUS = "key_active_job_status"

        const val DEFAULT_BASE_URL = "https://ghartak-api.onrender.com/api/"
    }

    init {
        val savedBaseUrl = prefs.getString(KEY_CUSTOM_BASE_URL, null)
        if (!savedBaseUrl.isNullOrBlank()) {
            com.ghartak.customer.data.api.ApiClient.updateBaseUrl(savedBaseUrl)
        }

        val schemaVer = prefs.getInt("key_schema_version", 1)
        if (schemaVer < 3) {
            // Fresh clean schema: wipe any legacy sessions, active jobs, past orders, and demo accounts completely
            clearSession()
            clearActiveJob()
            prefs.edit()
                .remove(KEY_USERS_REGISTRY)
                .remove(KEY_PAST_ORDERS)
                .remove(KEY_USER_PROFILE_IMAGE)
                .putInt("key_schema_version", 3)
                .apply()
        }
    }

    fun getCustomBaseUrl(): String {
        return prefs.getString(KEY_CUSTOM_BASE_URL, DEFAULT_BASE_URL) ?: DEFAULT_BASE_URL
    }

    fun setCustomBaseUrl(url: String) {
        val sanitized = if (url.trim().endsWith("/")) url.trim() else "${url.trim()}/"
        prefs.edit().putString(KEY_CUSTOM_BASE_URL, sanitized).apply()
        com.ghartak.customer.data.api.ApiClient.updateBaseUrl(sanitized)
    }

    fun isEmailRegistered(rawEmail: String): Boolean {
        val cleanEmail = rawEmail.trim().lowercase()
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            json.has(cleanEmail)
        } catch (e: Exception) {
            false
        }
    }

    fun isPhoneRegistered(rawPhone: String): Boolean {
        val cleanPhone = rawPhone.filter { it.isDigit() }.takeLast(10)
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            json.has(cleanPhone)
        } catch (e: Exception) {
            false
        }
    }

    fun registerUser(
        fullName: String,
        email: String,
        phone: String,
        password: String,
        address: String = "",
        pincode: String = "400001"
    ) {
        val cleanEmail = email.trim().lowercase()
        val cleanPhone = phone.filter { it.isDigit() }.takeLast(10)
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, "{}") ?: "{}"
        try {
            val json = JSONObject(registryStr)
            val userObj = JSONObject().apply {
                put("name", fullName.trim())
                put("email", cleanEmail)
                put("phone", if (phone.startsWith("+")) phone.trim() else if (cleanPhone.isNotEmpty()) "+91 $cleanPhone" else "")
                put("password", password.trim())
                put("address", address.trim())
                put("pincode", pincode.trim().ifEmpty { "400001" })
            }
            json.put(cleanEmail, userObj)
            if (cleanPhone.isNotEmpty()) {
                json.put(cleanPhone, userObj)
            }
            prefs.edit().putString(KEY_USERS_REGISTRY, json.toString()).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun validatePassword(rawEmail: String, rawPassword: String): Boolean {
        val cleanEmail = rawEmail.trim().lowercase()
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            if (!json.has(cleanEmail)) return false
            val userObj = json.getJSONObject(cleanEmail)
            val savedPassword = userObj.optString("password", "")
            savedPassword == rawPassword.trim()
        } catch (e: Exception) {
            false
        }
    }

    fun getUserByEmail(rawEmail: String): JSONObject? {
        val cleanEmail = rawEmail.trim().lowercase()
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            if (json.has(cleanEmail)) json.getJSONObject(cleanEmail) else null
        } catch (e: Exception) {
            null
        }
    }

    fun updatePassword(rawEmail: String, newPassword: String): Boolean {
        val cleanEmail = rawEmail.trim().lowercase()
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            if (!json.has(cleanEmail)) return false
            val userObj = json.getJSONObject(cleanEmail)
            userObj.put("password", newPassword.trim())
            json.put(cleanEmail, userObj)
            prefs.edit().putString(KEY_USERS_REGISTRY, json.toString()).apply()
            true
        } catch (e: Exception) {
            false
        }
    }

    fun saveSession(
        token: String,
        user: UserProfile,
        address: String = "",
        pincode: String = "400001"
    ) {
        prefs.edit().apply {
            putString(KEY_AUTH_TOKEN, token)
            putString(KEY_USER_ID, user.id)
            putString(KEY_USER_NAME, user.fullName)
            putString(KEY_USER_EMAIL, user.email ?: "")
            putString(KEY_USER_PHONE, user.phone)
            putString(KEY_USER_ADDRESS, address)
            putString(KEY_USER_PINCODE, pincode)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun getAuthToken(): String? = prefs.getString(KEY_AUTH_TOKEN, null)

    fun getUserId(): String = prefs.getString(KEY_USER_ID, "cust_01") ?: "cust_01"

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Customer") ?: "Customer"

    fun getUserFirstName(): String {
        val full = getUserName().trim()
        return full.split(" ").firstOrNull() ?: full
    }

    fun getUserEmail(): String = prefs.getString(KEY_USER_EMAIL, "") ?: ""

    fun getUserPhone(): String = prefs.getString(KEY_USER_PHONE, "") ?: ""

    fun getUserAddress(): String = prefs.getString(KEY_USER_ADDRESS, "") ?: ""

    fun getUserPincode(): String {
        val saved = prefs.getString(KEY_USER_PINCODE, null)
        if (!saved.isNullOrBlank()) return saved
        // If not explicitly saved, try extracting 6-digit pin from saved address
        val address = getUserAddress()
        val match = Regex("""\b(\d{6})\b""").find(address)
        if (match != null) {
            val pin = match.value
            setUserPincode(pin)
            return pin
        }
        return "760001" // Default user city (Brahmapur, Odisha)
    }

    fun setUserPincode(pincode: String) {
        val sanitized = pincode.filter { it.isDigit() }.take(6)
        if (sanitized.length == 6) {
            prefs.edit().putString(KEY_USER_PINCODE, sanitized).apply()
        }
    }

    // -------------------------------------------------------------
    // Active Job / Order Persistence (Fix for amount/service mismatch)
    // -------------------------------------------------------------
    fun hasActiveJob(): Boolean {
        val id = prefs.getString(KEY_ACTIVE_JOB_ID, null)
        val status = prefs.getString(KEY_ACTIVE_JOB_STATUS, "") ?: ""
        return !id.isNullOrBlank() && status != "CANCELLED" && status != "COMPLETED"
    }

    fun clearActiveJob() {
        prefs.edit().apply {
            remove(KEY_ACTIVE_JOB_ID)
            remove(KEY_ACTIVE_JOB_TITLE)
            remove(KEY_ACTIVE_JOB_BASE_PRICE)
            remove(KEY_ACTIVE_JOB_GST)
            remove(KEY_ACTIVE_JOB_TOTAL)
            remove(KEY_ACTIVE_JOB_TECH_NAME)
            remove(KEY_ACTIVE_JOB_TECH_BADGE)
            remove(KEY_ACTIVE_JOB_TECH_PHONE)
            remove(KEY_ACTIVE_JOB_TICKET_NO)
            remove(KEY_ACTIVE_JOB_STATE_CODE)
            remove(KEY_ACTIVE_JOB_GSTIN)
            remove(KEY_ACTIVE_JOB_OTP)
            remove(KEY_ACTIVE_JOB_STATUS)
            apply()
        }
    }

    fun saveActiveJob(
        id: String,
        title: String,
        basePrice: Double,
        gst: Double,
        total: Double,
        technicianName: String = "",
        technicianBadge: String = "",
        technicianPhone: String = "",
        ticketNumber: String = "",
        stateCode: String = "OD",
        gstin: String = "21AAACG1234F1Z5 (21-OD)",
        handoverOtp: String = "",
        status: String = "PENDING_DISPATCH"
    ) {
        prefs.edit().apply {
            putString(KEY_ACTIVE_JOB_ID, id)
            putString(KEY_ACTIVE_JOB_TITLE, title)
            putFloat(KEY_ACTIVE_JOB_BASE_PRICE, basePrice.toFloat())
            putFloat(KEY_ACTIVE_JOB_GST, gst.toFloat())
            putFloat(KEY_ACTIVE_JOB_TOTAL, total.toFloat())
            putString(KEY_ACTIVE_JOB_TECH_NAME, technicianName)
            putString(KEY_ACTIVE_JOB_TECH_BADGE, technicianBadge)
            putString(KEY_ACTIVE_JOB_TECH_PHONE, technicianPhone)
            putString(KEY_ACTIVE_JOB_TICKET_NO, ticketNumber)
            putString(KEY_ACTIVE_JOB_STATE_CODE, stateCode)
            putString(KEY_ACTIVE_JOB_GSTIN, gstin)
            putString(KEY_ACTIVE_JOB_OTP, handoverOtp)
            putString(KEY_ACTIVE_JOB_STATUS, status)
            apply()
        }
    }

    fun setActiveJobStatus(status: String) {
        prefs.edit().putString(KEY_ACTIVE_JOB_STATUS, status).apply()
        if (status == "CANCELLED" || status == "COMPLETED") {
            clearActiveJob()
        }
    }

    fun getActiveJobStatus(): String = prefs.getString(KEY_ACTIVE_JOB_STATUS, "") ?: ""

    fun getActiveJobOtp(): String = prefs.getString(KEY_ACTIVE_JOB_OTP, "") ?: ""

    fun getActiveJobId(): String = prefs.getString(KEY_ACTIVE_JOB_ID, "") ?: ""

    fun getActiveJobTitle(): String = prefs.getString(KEY_ACTIVE_JOB_TITLE, "") ?: ""

    fun getActiveJobBasePrice(): Double {
        val p = prefs.getFloat(KEY_ACTIVE_JOB_BASE_PRICE, 0.0f).toDouble()
        return if (p > 0.0) p else 0.0
    }

    fun getActiveJobGst(): Double {
        val g = prefs.getFloat(KEY_ACTIVE_JOB_GST, 0.0f).toDouble()
        return if (g > 0.0) g else (getActiveJobBasePrice() * 0.18)
    }

    fun getActiveJobTotal(): Double {
        val t = prefs.getFloat(KEY_ACTIVE_JOB_TOTAL, 0.0f).toDouble()
        return if (t > 0.0) t else (getActiveJobBasePrice() + getActiveJobGst())
    }

    fun getActiveJobTechnicianName(): String = prefs.getString(KEY_ACTIVE_JOB_TECH_NAME, "") ?: ""

    fun getActiveJobTechnicianBadge(): String = prefs.getString(KEY_ACTIVE_JOB_TECH_BADGE, "") ?: ""

    fun getActiveJobTechnicianPhone(): String = prefs.getString(KEY_ACTIVE_JOB_TECH_PHONE, "") ?: ""

    fun getActiveJobTicketNumber(): String = prefs.getString(KEY_ACTIVE_JOB_TICKET_NO, "") ?: ""

    fun getActiveJobStateCode(): String = prefs.getString(KEY_ACTIVE_JOB_STATE_CODE, "OD") ?: "OD"

    fun getActiveJobGstin(): String = prefs.getString(KEY_ACTIVE_JOB_GSTIN, "21AAACG1234F1Z5 (21-OD)") ?: "21AAACG1234F1Z5 (21-OD)"

    fun getProfileImageUri(): String? = prefs.getString(KEY_USER_PROFILE_IMAGE, null)

    fun setProfileImageUri(uri: String?) {
        prefs.edit().apply {
            if (uri != null) {
                putString(KEY_USER_PROFILE_IMAGE, uri)
            } else {
                remove(KEY_USER_PROFILE_IMAGE)
            }
            apply()
        }
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun updateProfile(name: String, email: String, phone: String, address: String, pincode: String? = null) {
        prefs.edit().apply {
            putString(KEY_USER_NAME, name.trim())
            putString(KEY_USER_EMAIL, email.trim())
            putString(KEY_USER_PHONE, phone.trim())
            putString(KEY_USER_ADDRESS, address.trim())
            val pin = pincode?.filter { it.isDigit() }?.take(6)
                ?: Regex("""\b(\d{6})\b""").find(address)?.value
            if (!pin.isNullOrEmpty() && pin.length == 6) {
                putString(KEY_USER_PINCODE, pin)
            }
            apply()
        }
    }

    fun clearSession() {
        prefs.edit().apply {
            remove(KEY_AUTH_TOKEN)
            remove(KEY_USER_ID)
            remove(KEY_USER_NAME)
            remove(KEY_USER_EMAIL)
            remove(KEY_USER_PHONE)
            remove(KEY_USER_ADDRESS)
            remove(KEY_USER_PINCODE)
            remove(KEY_ACTIVE_JOB_ID)
            remove(KEY_ACTIVE_JOB_TITLE)
            remove(KEY_ACTIVE_JOB_BASE_PRICE)
            remove(KEY_ACTIVE_JOB_GST)
            remove(KEY_ACTIVE_JOB_TOTAL)
            remove(KEY_ACTIVE_JOB_TECH_NAME)
            remove(KEY_ACTIVE_JOB_TECH_BADGE)
            remove(KEY_ACTIVE_JOB_TECH_PHONE)
            remove(KEY_ACTIVE_JOB_TICKET_NO)
            remove(KEY_ACTIVE_JOB_STATE_CODE)
            remove(KEY_ACTIVE_JOB_GSTIN)
            putBoolean(KEY_IS_LOGGED_IN, false)
            apply()
        }
    }

    fun getPastOrders(): List<PastOrderItem> {
        val jsonStr = prefs.getString(KEY_PAST_ORDERS, null) ?: return emptyList()
        return try {
            val arr = JSONArray(jsonStr)
            val list = mutableListOf<PastOrderItem>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                list.add(
                    PastOrderItem(
                        ticketNumber = obj.optString("ticketNumber"),
                        invoiceNumber = obj.optString("invoiceNumber"),
                        serviceTitle = obj.optString("serviceTitle"),
                        dateText = obj.optString("dateText"),
                        technicianName = obj.optString("technicianName"),
                        amountInr = obj.optDouble("amountInr"),
                        taxableAmount = obj.optDouble("taxableAmount"),
                        cgstAmount = obj.optDouble("cgstAmount"),
                        sgstAmount = obj.optDouble("sgstAmount"),
                        status = obj.optString("status", "COMPLETED")
                    )
                )
            }
            list
        } catch (e: Exception) {
            emptyList()
        }
    }

    fun addCompletedOrder(order: PastOrderItem) {
        val existing = getPastOrders().toMutableList()
        existing.removeAll { it.ticketNumber == order.ticketNumber || it.invoiceNumber == order.invoiceNumber }
        existing.add(0, order)
        val arr = JSONArray()
        for (item in existing) {
            val obj = JSONObject().apply {
                put("ticketNumber", item.ticketNumber)
                put("invoiceNumber", item.invoiceNumber)
                put("serviceTitle", item.serviceTitle)
                put("dateText", item.dateText)
                put("technicianName", item.technicianName)
                put("amountInr", item.amountInr)
                put("taxableAmount", item.taxableAmount)
                put("cgstAmount", item.cgstAmount)
                put("sgstAmount", item.sgstAmount)
                put("status", item.status)
            }
            arr.put(obj)
        }
        prefs.edit().putString(KEY_PAST_ORDERS, arr.toString()).apply()
    }
}
