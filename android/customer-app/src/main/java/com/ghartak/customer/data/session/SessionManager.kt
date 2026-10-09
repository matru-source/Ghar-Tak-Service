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
        val schemaVer = prefs.getInt("key_schema_version", 1)
        if (schemaVer < 2) {
            // Fresh clean schema: wipe any legacy demo sessions and accounts completely
            clearSession()
            prefs.edit()
                .remove(KEY_USERS_REGISTRY)
                .putInt("key_schema_version", 2)
                .apply()
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
