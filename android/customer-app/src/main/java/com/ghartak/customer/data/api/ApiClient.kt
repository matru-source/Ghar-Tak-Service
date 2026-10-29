package com.ghartak.customer.data.api

import android.content.Context
import com.ghartak.customer.data.session.SessionManager
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    var baseUrl: String = com.ghartak.customer.BuildConfig.BASE_URL

    private var retrofit: Retrofit? = null
    private var customerApiService: CustomerApiService? = null

    fun getService(context: Context): CustomerApiService {
        if (customerApiService == null) {
            val sessionManager = SessionManager(context)
            val customUrl = sessionManager.getCustomBaseUrl()
            baseUrl = if (customUrl.isNotBlank()) {
                if (customUrl.endsWith("/")) customUrl else "$customUrl/"
            } else {
                com.ghartak.customer.BuildConfig.BASE_URL
            }

            val authInterceptor = Interceptor { chain ->
                val requestBuilder = chain.request().newBuilder()
                sessionManager.getAuthToken()?.let { token ->
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }
                requestBuilder.addHeader("X-Platform-Client", "ANDROID_CUSTOMER_APP")
                chain.proceed(requestBuilder.build())
            }

            val unauthorizedInterceptor = Interceptor { chain ->
                val request = chain.request()
                val response = chain.proceed(request)
                if (response.code == 401 && !request.url.encodedPath.contains("/auth/")) {
                    sessionManager.clearSession()
                }
                response
            }

            val isDebuggable = (context.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = if (isDebuggable) {
                    HttpLoggingInterceptor.Level.BASIC
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
            }

            val okHttpClient = OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(unauthorizedInterceptor)
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

            customerApiService = retrofit!!.create(CustomerApiService::class.java)
        }
        return customerApiService!!
    }

    /**
     * Switch endpoint dynamically (e.g. from local 10.0.2.2 to LAN IP 192.168.x.x for real phone)
     */
    fun updateBaseUrl(newUrl: String) {
        baseUrl = if (newUrl.endsWith("/")) newUrl else "$newUrl/"
        retrofit = null
        customerApiService = null
    }
}
