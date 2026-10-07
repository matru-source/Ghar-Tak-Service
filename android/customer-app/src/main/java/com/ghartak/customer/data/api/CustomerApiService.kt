package com.ghartak.customer.data.api

import com.ghartak.customer.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface CustomerApiService {

    // Auth & OTP
    @POST("auth/otp/send")
    suspend fun sendOtp(@Body request: OtpSendRequest): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/otp/verify")
    suspend fun verifyOtp(@Body request: OtpVerifyRequest): Response<ApiResponse<LoginResponse>>

    // Services Catalog
    @GET("services")
    suspend fun getServices(): Response<ApiResponse<List<Map<String, Any>>>>

    // Bookings & Work Orders
    @GET("jobs")
    suspend fun getMyJobs(@Query("customerId") customerId: String): Response<ApiResponse<Map<String, Any>>>

    @POST("jobs")
    suspend fun createJob(@Body request: CreateJobRequest): Response<ApiResponse<Job>>

    @GET("jobs/{id}")
    suspend fun getJobDetails(@Path("id") jobId: String): Response<ApiResponse<Job>>

    // Live GPS Technician Tracking
    @GET("technicians/telemetry")
    suspend fun getLiveTracking(@Query("jobId") jobId: String): Response<ApiResponse<LiveTrackingResponse>>

    // Pincode Serviceability Check
    @GET("pincodes/check-serviceable")
    suspend fun checkPincode(@Query("pincode") pincode: String): Response<ApiResponse<Map<String, Any>>>
}
