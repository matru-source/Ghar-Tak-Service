package com.ghartak.technician.data.api

import android.content.Context
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

            val okHttpClient = OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(loggingInterceptor)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
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
