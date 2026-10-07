package com.ghartak.technician.data.api

import com.ghartak.technician.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface TechnicianApiService {

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
}
