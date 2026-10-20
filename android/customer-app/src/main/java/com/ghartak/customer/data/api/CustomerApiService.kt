package com.ghartak.customer.data.api

import com.ghartak.customer.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface CustomerApiService {

    // Auth & OTP
    @POST("auth/login")
    suspend fun login(@Body body: Map<String, String>): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/register")
    suspend fun register(@Body body: Map<String, Any>): Response<ApiResponse<Map<String, Any>>>

    @GET("auth/reset-password")
    suspend fun checkAccountExists(@Query("identifier") identifier: String): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body body: Map<String, String>): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/otp/send")
    suspend fun sendOtp(@Body request: OtpSendRequest): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/otp/verify")
    suspend fun verifyOtp(@Body request: OtpVerifyRequest): Response<ApiResponse<LoginResponse>>

    // Services Catalog
    @GET("services")
    suspend fun getServices(): Response<ApiResponse<com.google.gson.JsonElement>>

    @GET("services/categories")
    suspend fun getCategories(): Response<ApiResponse<com.google.gson.JsonElement>>

    // Bookings & Work Orders
    @GET("jobs")
    suspend fun getMyJobs(@Query("customerId") customerId: String): Response<ApiResponse<JobsListResponse>>

    @PATCH("customer/profile")
    suspend fun updateCustomerProfile(@Body body: Map<String, Any>): Response<ApiResponse<Map<String, Any>>>

    @POST("jobs")
    suspend fun createJob(@Body request: CreateJobRequest): Response<ApiResponse<Job>>

    @GET("jobs/{id}")
    suspend fun getJobDetails(@Path("id") jobId: String): Response<ApiResponse<Job>>

    // Live GPS Technician Tracking
    @GET("technicians/telemetry")
    suspend fun getLiveTracking(@Query("jobId") jobId: String): Response<ApiResponse<LiveTrackingResponse>>

    // Live Technicians Fleet
    @GET("technicians")
    suspend fun getAvailableTechnicians(
        @Query("pincode") pincode: String? = null,
        @Query("isOnline") isOnline: Boolean? = true,
        @Query("sortBy") sortBy: String? = null,
        @Query("lat") lat: Double? = null,
        @Query("lng") lng: Double? = null
    ): Response<ApiResponse<Map<String, Any>>>

    // Pincode Serviceability Check
    @GET("pincodes/check-serviceable")
    suspend fun checkPincode(@Query("pincode") pincode: String): Response<ApiResponse<Map<String, Any>>>

    // Cancel Job
    @POST("jobs/{id}/cancel")
    suspend fun cancelJob(@Path("id") jobId: String): Response<ApiResponse<Map<String, Any>>>

    // Subscriptions & AMC
    @GET("subscriptions")
    suspend fun getSubscriptions(
        @Query("customerId") customerId: String
    ): Response<ApiResponse<com.google.gson.JsonElement>>

    @POST("subscriptions")
    suspend fun enrollSubscription(
        @Body body: Map<String, Any>
    ): Response<ApiResponse<com.google.gson.JsonElement>>
}
