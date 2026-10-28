package com.ghartak.customer.data.api

import android.content.Context
import android.util.Log
import com.ghartak.customer.data.session.SessionManager
import okhttp3.Authenticator
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route
import org.json.JSONObject

/**
 * Dual-token OAuth2 AuthInterceptor & Authenticator (Issue 47).
 * Automatically injects the 15-minute Bearer access token on outgoing HTTP requests,
 * and intercepts HTTP 401 Unauthorized responses to perform a silent background
 * token refresh using the 30-day encrypted refresh token without kicking the user out.
 */
class AuthInterceptor(private val context: Context) : Interceptor, Authenticator {

    private val sessionManager = SessionManager(context)

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = sessionManager.getAuthToken()

        val newRequest = if (!token.isNullOrBlank() && originalRequest.header("Authorization") == null) {
            originalRequest.newBuilder()
                .addHeader("Authorization", "Bearer $token")
                .addHeader("x-client-app", "customer")
                .addHeader("x-user-role", "CUSTOMER")
                .build()
        } else {
            originalRequest
        }

        return chain.proceed(newRequest)
    }

    override fun authenticate(route: Route?, response: Response): Request? {
        // Prevent infinite loops if refresh endpoint itself failed
        if (response.request.url.encodedPath.contains("/auth/refresh")) {
            return null
        }

        synchronized(this) {
            val currentToken = sessionManager.getAuthToken()
            val headerToken = response.request.header("Authorization")?.removePrefix("Bearer ")?.trim()

            // If token was already refreshed by a concurrent request, retry with the updated token
            if (currentToken != headerToken && !currentToken.isNullOrBlank()) {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $currentToken")
                    .build()
            }

            val refreshToken = sessionManager.getRefreshToken()
            if (refreshToken.isNullOrBlank()) {
                Log.w("GTS_AUTH", "Silent refresh aborted: no refresh token available")
                return null
            }

            return try {
                val newAccessToken = performSilentTokenRefresh(refreshToken)
                if (newAccessToken != null) {
                    sessionManager.setAuthToken(newAccessToken)
                    Log.d("GTS_AUTH", "Silent OAuth2 token refresh successful")
                    response.request.newBuilder()
                        .header("Authorization", "Bearer $newAccessToken")
                        .build()
                } else {
                    null
                }
            } catch (e: Exception) {
                Log.e("GTS_AUTH", "Silent token refresh failed: ${e.message}")
                null
            }
        }
    }

    private fun performSilentTokenRefresh(refreshToken: String): String? {
        val baseUrl = ApiClient.baseUrl
        val refreshUrl = if (baseUrl.endsWith("/")) "${baseUrl}auth/refresh" else "$baseUrl/auth/refresh"
        val jsonBody = JSONObject().put("refreshToken", refreshToken).toString()
        val mediaType = "application/json; charset=utf-8".toMediaTypeOrNull()
        val body = jsonBody.toRequestBody(mediaType)

        val request = Request.Builder()
            .url(refreshUrl)
            .post(body)
            .build()

        val client = okhttp3.OkHttpClient.Builder()
            .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .readTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
            .build()

        val res = client.newCall(request).execute()
        if (res.isSuccessful) {
            val responseBody = res.body?.string() ?: return null
            val json = JSONObject(responseBody)
            val data = json.optJSONObject("data")
            return data?.optString("token") ?: data?.optString("accessToken")
        }
        return null
    }
}
