package com.ghartak.technician.data.api

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object BrevoEmailService {

    // Decoded at runtime
    private val BREVO_API_KEY: String by lazy {
        val bytes = intArrayOf(
            82, 65, 79, 83, 89, 67, 72, 7, 78, 78, 25, 25, 79, 75, 76, 19, 29, 27, 72, 18, 29, 76, 79, 19,
            73, 30, 29, 24, 26, 29, 76, 76, 72, 78, 30, 26, 27, 28, 24, 75, 72, 28, 24, 72, 75, 26, 31,
            27, 75, 79, 76, 29, 72, 19, 73, 30, 29, 26, 75, 18, 28, 18, 76, 24, 78, 18, 26, 75, 75, 27,
            78, 79, 7, 80, 28, 24, 126, 123, 93, 91, 70, 110, 99, 83, 121, 19, 82, 71, 125
        )
        bytes.map { (it xor 42).toChar() }.joinToString("")
    }

    // Runtime decoded fallback for verified sender
    private val FALLBACK_SENDER_EMAIL: String by lazy {
        val bytes = intArrayOf(71, 75, 94, 88, 95, 90, 88, 75, 89, 75, 78, 90, 75, 68, 78, 75, 30, 19, 29, 106, 77, 71, 75, 67, 70, 4, 73, 69, 71)
        bytes.map { (it xor 42).toChar() }.joinToString("")
    }

    private const val SENDER_NAME = "Ghar Tak Services (GTS)"

    @Volatile
    private var cachedSenderEmail: String? = null

    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private fun getActiveSenderEmail(): String {
        cachedSenderEmail?.let { return it }

        return try {
            val request = Request.Builder()
                .url("https://api.brevo.com/v3/senders")
                .addHeader("accept", "application/json")
                .addHeader("api-key", BREVO_API_KEY)
                .get()
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val json = JSONObject(response.body?.string() ?: "{}")
                val senders = json.optJSONArray("senders")
                if (senders != null && senders.length() > 0) {
                    val verifiedEmail = senders.getJSONObject(0).optString("email")
                    if (verifiedEmail.isNotBlank()) {
                        cachedSenderEmail = verifiedEmail
                        Log.d("BREVO_EMAIL", "Retrieved active verified sender from Brevo API")
                        return verifiedEmail
                    }
                }
            }
            FALLBACK_SENDER_EMAIL
        } catch (e: Exception) {
            Log.e("BREVO_EMAIL", "Error querying active sender: ${e.message}")
            FALLBACK_SENDER_EMAIL
        }
    }

    suspend fun sendOtpEmail(toEmail: String, toName: String, otpCode: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val verifiedSender = getActiveSenderEmail()

            val json = JSONObject().apply {
                put("sender", JSONObject().apply {
                    put("name", SENDER_NAME)
                    put("email", verifiedSender)
                })
                put("to", JSONArray().apply {
                    put(JSONObject().apply {
                        put("email", toEmail.trim())
                        put("name", toName.ifBlank { "GTS Customer" })
                    })
                })
                put("subject", "⚡ Your Ghar Tak Services (GTS) Verification Code: $otpCode")
                put("htmlContent", buildHtmlEmail(toName.ifBlank { "GTS Customer" }, otpCode))
            }

            val body = json.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
            val request = Request.Builder()
                .url("https://api.brevo.com/v3/smtp/email")
                .addHeader("accept", "application/json")
                .addHeader("api-key", BREVO_API_KEY)
                .addHeader("content-type", "application/json")
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""

            if (response.isSuccessful) {
                Log.d("BREVO_EMAIL", "Email sent successfully: $responseBody")
                Result.success(otpCode)
            } else {
                Log.e("BREVO_EMAIL", "Failed to send email: ${response.code} $responseBody")
                Result.failure(Exception("Brevo API error ${response.code}: $responseBody"))
            }
        } catch (e: Exception) {
            Log.e("BREVO_EMAIL", "Exception sending email: ${e.message}", e)
            Result.failure(e)
        }
    }

    private fun buildHtmlEmail(userName: String, otpCode: String): String {
        return """
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
                .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
                .header { background: #00288E; padding: 28px 24px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
                .header p { margin: 6px 0 0; font-size: 12px; color: #bbdefb; font-weight: 500; }
                .content { padding: 32px 24px; text-align: center; }
                .greeting { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #0f172a; }
                .desc { font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
                .otp-box { display: inline-block; background: #f0fdf4; border: 2px dashed #00c853; border-radius: 12px; padding: 16px 36px; margin: 0 auto 24px; }
                .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #00288E; }
                .badge { display: inline-block; background: #e3f2fd; color: #1565c0; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; margin-bottom: 20px; }
                .notice { font-size: 12px; color: #94a3b8; line-height: 1.4; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px; }
                .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>GHAR TAK SERVICES (GTS)</h1>
                  <p>MISSION-CRITICAL ELECTRICAL ENGINEERING • 1000V CERTIFIED</p>
                </div>
                <div class="content">
                  <div class="badge">🛡️ OFFICIAL SECURITY VERIFICATION</div>
                  <div class="greeting">Hello, $userName</div>
                  <div class="desc">Please use the one-time security verification code below for your Ghar Tak Services account:</div>
                  <div class="otp-box">
                    <div class="otp-code">$otpCode</div>
                  </div>
                  <div class="desc">This code expires in <strong>10 minutes</strong>. Never share this code with anyone.</div>
                  <div class="notice">
                    If you did not request this verification code, please ignore this email or contact our Security Desk at <strong>1800-GTS-HELP</strong>.
                  </div>
                </div>
                <div class="footer">
                  © 2026 Ghar Tak Services (GTS) • 100% Tax Compliant Electrical Platform
                </div>
              </div>
            </body>
            </html>
        """.trimIndent()
    }
}
