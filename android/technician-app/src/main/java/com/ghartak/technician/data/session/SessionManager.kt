package com.ghartak.technician.data.session

import android.content.Context
import android.content.SharedPreferences
import com.ghartak.technician.data.model.TechnicianProfile

class SessionManager(context: Context) {

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
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
    }

    fun saveSession(token: String, profile: TechnicianProfile) {
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
            putBoolean(KEY_IS_LOGGED_IN, true)
            apply()
        }
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

    fun getRating(): Float = prefs.getFloat(KEY_RATING, 4.9f)

    fun isGlovesVerified(): Boolean = prefs.getBoolean(KEY_GLOVES_VERIFIED, false)

    fun setGlovesVerified(verified: Boolean) {
        prefs.edit().putBoolean(KEY_GLOVES_VERIFIED, verified).apply()
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
