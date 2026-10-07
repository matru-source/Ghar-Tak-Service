package com.ghartak.customer.data.session

import android.content.Context
import android.content.SharedPreferences
import com.ghartak.customer.data.model.UserProfile

class SessionManager(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    companion object {
        private const val PREF_NAME = "gts_customer_session"
        private const val KEY_AUTH_TOKEN = "key_auth_token"
        private const val KEY_USER_ID = "key_user_id"
        private const val KEY_USER_NAME = "key_user_name"
        private const val KEY_USER_PHONE = "key_user_phone"
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
    }

    fun saveSession(token: String, user: UserProfile) {
        prefs.edit().apply {
            putString(KEY_AUTH_TOKEN, token)
            putString(KEY_USER_ID, user.id)
            putString(KEY_USER_NAME, user.fullName)
            putString(KEY_USER_PHONE, user.phone)
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
    }

    fun getAuthToken(): String? = prefs.getString(KEY_AUTH_TOKEN, null)

    fun getUserId(): String = prefs.getString(KEY_USER_ID, "cust_amit_01") ?: "cust_amit_01"

    fun getUserName(): String = prefs.getString(KEY_USER_NAME, "Amit Sharma") ?: "Amit Sharma"

    fun getUserPhone(): String = prefs.getString(KEY_USER_PHONE, "+919876543210") ?: "+919876543210"

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
