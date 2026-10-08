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
        private const val KEY_USER_PHONE = "key_user_phone"
        private const val KEY_USER_ADDRESS = "key_user_address"
        private const val KEY_USER_PINCODE = "key_user_pincode"
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
        private const val KEY_USERS_REGISTRY = "key_users_registry"
    }

    init {
        // Pre-seed default demo account (Amit Sharma) if registry is empty
        if (!prefs.contains(KEY_USERS_REGISTRY)) {
            val defaultRegistry = JSONObject()
            val amitObj = JSONObject().apply {
                put("name", "Amit Sharma")
                put("address", "Flat 402, Sea Green Apartments, Colaba, Mumbai")
                put("pincode", "400001")
            }
            defaultRegistry.put("9876543210", amitObj)
            prefs.edit().putString(KEY_USERS_REGISTRY, defaultRegistry.toString()).apply()
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
        phone: String,
        address: String = "Colaba, Mumbai",
        pincode: String = "400001"
    ) {
        val cleanPhone = phone.filter { it.isDigit() }.takeLast(10)
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, "{}") ?: "{}"
        try {
            val json = JSONObject(registryStr)
            val userObj = JSONObject().apply {
                put("name", fullName)
                put("address", address)
                put("pincode", pincode)
            }
            json.put(cleanPhone, userObj)
            prefs.edit().putString(KEY_USERS_REGISTRY, json.toString()).apply()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun getRegisteredUserData(rawPhone: String): Pair<String, String>? {
        val cleanPhone = rawPhone.filter { it.isDigit() }.takeLast(10)
        val registryStr = prefs.getString(KEY_USERS_REGISTRY, "{}") ?: "{}"
        return try {
            val json = JSONObject(registryStr)
            if (json.has(cleanPhone)) {
                val obj = json.getJSONObject(cleanPhone)
                Pair(obj.optString("name", "GTS Customer"), obj.optString("address", "Mumbai 400001"))
            } else null
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
            putString(KEY_USER_PHONE, user.phone)
            putString(KEY_USER_ADDRESS, address)
            putString(KEY_USER_PINCODE, pincode)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun getAuthToken(): String? = prefs.getString(KEY_AUTH_TOKEN, null)

    fun getUserId(): String = prefs.getString(KEY_USER_ID, "cust_01") ?: "cust_01"

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Amit Sharma") ?: "Amit Sharma"

    fun getUserFirstName(): String {
        val full = getUserName().trim()
        return full.split(" ").firstOrNull() ?: full
    }

    fun getUserPhone(): String = prefs.getString(KEY_USER_PHONE, "+91 98765 43210") ?: "+91 98765 43210"

    fun getUserAddress(): String = prefs.getString(KEY_USER_ADDRESS, "Flat 402, Sea Green Apartments, Colaba, Mumbai 400001") ?: "Flat 402, Sea Green Apartments, Colaba, Mumbai 400001"

    fun getUserPincode(): String = prefs.getString(KEY_USER_PINCODE, "400001") ?: "400001"

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun clearSession() {
        prefs.edit().apply {
            remove(KEY_AUTH_TOKEN)
            remove(KEY_USER_ID)
            remove(KEY_USER_NAME)
            remove(KEY_USER_PHONE)
            remove(KEY_USER_ADDRESS)
            remove(KEY_USER_PINCODE)
            putBoolean(KEY_IS_LOGGED_IN, false)
            apply()
        }
    }
}
