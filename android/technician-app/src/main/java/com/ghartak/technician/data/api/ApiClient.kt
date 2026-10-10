package com.ghartak.technician.data.api

import android.content.Context
import android.os.Build
import com.ghartak.technician.data.session.SessionManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    // Default to Android Emulator loopback to host port 3000; can be overridden for physical WiFi testing
    var baseUrl: String = "http://10.0.2.2:3000/api/"

    private var retrofit: Retrofit? = null
    private var technicianApiService: TechnicianApiService? = null

    val isEmulator: Boolean by lazy {
        Build.FINGERPRINT.startsWith("generic") ||
                Build.FINGERPRINT.startsWith("unknown") ||
                Build.MODEL.contains("google_sdk") ||
                Build.MODEL.contains("Emulator") ||
                Build.MODEL.contains("Android SDK built for x86") ||
                Build.MANUFACTURER.contains("Genymotion") ||
                (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic")) ||
                "google_sdk" == Build.PRODUCT
    }

    fun getService(context: Context): TechnicianApiService {
        if (technicianApiService == null) {
            val sessionManager = SessionManager(context)

            val authInterceptor = Interceptor { chain ->
                val requestBuilder = chain.request().newBuilder()
                sessionManager.getAuthToken()?.let { token ->
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }
                requestBuilder.addHeader("X-Platform-Client", "ANDROID_TECHNICIAN_APP")
                requestBuilder.addHeader("X-Technician-Id", sessionManager.getTechnicianId())
                chain.proceed(requestBuilder.build())
            }

            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            // Quick responsive timeout (3s) to prevent hanging physical devices on unreachable localhost
            val timeoutSec = if (isEmulator) 5L else 2L

            val okHttpClient = OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(loggingInterceptor)
                .connectTimeout(timeoutSec, TimeUnit.SECONDS)
                .readTimeout(timeoutSec, TimeUnit.SECONDS)
                .writeTimeout(timeoutSec, TimeUnit.SECONDS)
                .retryOnConnectionFailure(false)
                .build()

            retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(okHttpClient)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            technicianApiService = retrofit!!.create(TechnicianApiService::class.java)
        }
        return technicianApiService!!
    }

    /**
     * Switch endpoint dynamically (e.g. from local 10.0.2.2 to LAN IP 192.168.x.x for real phone)
     */
    fun updateBaseUrl(newUrl: String) {
        baseUrl = if (newUrl.endsWith("/")) newUrl else "$newUrl/"
        retrofit = null
        technicianApiService = null
    }
}