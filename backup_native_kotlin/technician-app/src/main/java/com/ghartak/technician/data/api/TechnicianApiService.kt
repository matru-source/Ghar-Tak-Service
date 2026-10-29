package com.ghartak.technician.data.api

import com.ghartak.technician.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface TechnicianApiService {

    // Auth & Login
    @POST("auth/login")
    suspend fun login(@Body body: Map<String, String>): Response<ApiResponse<Map<String, Any>>>

    @GET("auth/reset-password")
    suspend fun checkAccountExists(@Query("identifier") identifier: String): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body body: Map<String, String>): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/otp/send")
    suspend fun sendOtp(@Body body: Map<String, String>): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/otp/verify")
    suspend fun verifyOtp(@Body body: Map<String, String>): Response<ApiResponse<Map<String, Any>>>

    @POST("auth/google")
    suspend fun googleSignIn(@Body body: Map<String, String>): Response<ApiResponse<Map<String, Any>>>

    // Registration & Onboarding
    @POST("technicians")
    suspend fun registerTechnician(
        @Body request: RegisterTechnicianRequest
    ): Response<ApiResponse<TechnicianProfile>>

    // Profile & Availability
    @GET("technicians/{id}")
    suspend fun getProfile(@Path("id") technicianId: String): Response<ApiResponse<TechnicianProfile>>

    @POST("technicians/{id}/availability")
    suspend fun updateAvailability(
        @Path("id") technicianId: String,
        @Body body: Map<String, Boolean>
    ): Response<ApiResponse<TechnicianProfile>>

    // Jobs Assigned to Technician
    @GET("jobs")
    suspend fun getAssignedJobs(
        @Query("technicianId") technicianId: String,
        @Query("status") status: String? = null
    ): Response<ApiResponse<Map<String, Any>>>

    @GET("jobs/{id}")
    suspend fun getJobDetails(@Path("id") jobId: String): Response<ApiResponse<TechnicianJob>>

    @PATCH("jobs/{id}")
    suspend fun updateJobStatus(
        @Path("id") jobId: String,
        @Body body: Map<String, String>
    ): Response<ApiResponse<TechnicianJob>>

    // 60-Second Dispatch Acceptance Siren Action
    @POST("jobs/{id}/dispatch-response")
    suspend fun respondToDispatch(
        @Path("id") jobId: String,
        @Body request: DispatchActionRequest
    ): Response<ApiResponse<TechnicianJob>>

    // 1000V High Voltage Safety Interlock Verification
    @POST("jobs/{id}/verify-safety")
    suspend fun verifySafety(
        @Path("id") jobId: String,
        @Body request: SafetyVerifyRequest
    ): Response<ApiResponse<TechnicianJob>>

    // Job Completion & Handover OTP Verification
    @POST("jobs/{id}/complete")
    suspend fun completeJob(
        @Path("id") jobId: String,
        @Body request: JobCompleteRequest
    ): Response<ApiResponse<TechnicianJob>>

    // Live GPS Telemetry Stream Ping (Every 5-10s)
    @POST("technicians/telemetry")
    suspend fun sendTelemetry(
        @Body request: TelemetryPingRequest
    ): Response<ApiResponse<TelemetryPingResponse>>

    // Technician Withdrawals & Payouts
    @POST("finance/withdrawals")
    suspend fun requestWithdrawal(
        @Body request: CreateWithdrawalRequest
    ): Response<ApiResponse<WithdrawalItem>>

    @GET("finance/withdrawals")
    suspend fun getWithdrawals(
        @Query("technicianId") technicianId: String
    ): Response<ApiResponse<WithdrawalListResponse>>

    // Emergency SOS Broadcast
    @POST("emergency-sos")
    suspend fun broadcastEmergencySos(
        @Body request: EmergencySosRequest
    ): Response<ApiResponse<Map<String, Any>>>

    // Evidence & Photo Upload
    @POST("upload")
    suspend fun uploadPhoto(
        @Body body: Map<String, String>
    ): Response<ApiResponse<FileUploadResponse>>

    // In-Job Spare Parts & Material Addition
    @POST("jobs/{id}/parts")
    suspend fun addSparePart(
        @Path("id") jobId: String,
        @Body body: Map<String, Any>
    ): Response<ApiResponse<Map<String, Any>>>

    @GET("jobs/{id}/parts")
    suspend fun getJobSpareParts(
        @Path("id") jobId: String
    ): Response<ApiResponse<Map<String, Any>>>
}
