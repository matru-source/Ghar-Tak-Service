package com.ghartak.customer.data.session

import android.content.Context
import android.content.SharedPreferences
import com.ghartak.customer.data.model.UserProfile
import org.json.JSONObject

class SessionManager(context: Context) {

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
    }

    init {
        // Pre-seed default accounts (Matru Prasad and Amit Sharma)
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, null)
        val json = if (registryStr != null) {
            try { JSONObject(registryStr) } catch (e: Exception) { JSONObject() }
        } else JSONObject()

        var updated = false

        if (!json.has("matruprasadpanda497@gmail.com")) {
            val matruObj = JSONObject().apply {
                put("name", "Matru Prasad Panda")
                put("email", "matruprasadpanda497@gmail.com")
                put("phone", "+91 93482 01604")
                put("address", "Flat 402, Sea Green Apartments, Colaba, Mumbai")
                put("pincode", "400001")
            }
            json.put("matruprasadpanda497@gmail.com", matruObj)
            json.put("9348201604", matruObj)
            updated = true
        }

        if (!json.has("amit.sharma@example.com")) {
            val amitObj = JSONObject().apply {
                put("name", "Amit Sharma")
                put("email", "amit.sharma@example.com")
                put("phone", "+91 98765 43210")
                put("address", "Flat 101, Galaxy Heights, Colaba, Mumbai")
                put("pincode", "400001")
            }
            json.put("amit.sharma@example.com", amitObj)
            json.put("9876543210", amitObj)
            updated = true
        }

        if (updated) {
            prefs.edit().putString(KEY_USERS_REGISTRY, json.toString()).apply()
        }
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
        address: String = "Colaba, Mumbai",
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
                put("phone", if (phone.startsWith("+")) phone else "+91 $cleanPhone")
                put("address", address.trim())
                put("pincode", pincode.trim())
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

    fun saveSession(
        token: String,
        user: UserProfile,
        address: String = "Flat 402, Sea Green Apartments, Colaba, Mumbai 400001",
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

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Matru Prasad Panda") ?: "Matru Prasad Panda"

    fun getUserFirstName(): String {
        val full = getUserName().trim()
        return full.split(" ").firstOrNull() ?: full
    }

    fun getUserEmail(): String = prefs.getString(KEY_USER_EMAIL, "matruprasadpanda497@gmail.com") ?: "matruprasadpanda497@gmail.com"

    fun getUserPhone(): String = prefs.getString(KEY_USER_PHONE, "+91 93482 01604") ?: "+91 93482 01604"

    fun getUserAddress(): String = prefs.getString(KEY_USER_ADDRESS, "Flat 402, Sea Green Apartments, Colaba, Mumbai 400001") ?: "Flat 402, Sea Green Apartments, Colaba, Mumbai 400001"

    fun getUserPincode(): String = prefs.getString(KEY_USER_PINCODE, "400001") ?: "400001"

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun clearSession() {
        prefs.edit().apply {
            remove(KEY_AUTH_TOKEN)
            remove(KEY_USER_ID)
            remove(KEY_USER_NAME)
            remove(KEY_USER_EMAIL)
            remove(KEY_USER_PHONE)
            remove(KEY_USER_ADDRESS)
            remove(KEY_USER_PINCODE)
            putBoolean(KEY_IS_LOGGED_IN, false)
            apply()
        }
    }
}
