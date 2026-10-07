package com.ghartak.customer.data.model

import com.google.gson.annotations.SerializedName

/**
 * Standard API Response envelope matching backend apiSuccess / apiError
 */
data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: T?,
    @SerializedName("error") val error: String? = null,
    @SerializedName("timestamp") val timestamp: String? = null
)

/**
 * User & Authentication Session
 */
data class UserProfile(
    @SerializedName("id") val id: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("role") val role: String
)

data class LoginResponse(
    @SerializedName("token") val token: String,
    @SerializedName("tokenType") val tokenType: String = "Bearer",
    @SerializedName("user") val user: UserProfile
)

data class OtpSendRequest(
    @SerializedName("phone") val phone: String,
    @SerializedName("role") val role: String = "CUSTOMER"
)

data class OtpVerifyRequest(
    @SerializedName("phone") val phone: String,
    @SerializedName("otp") val otp: String,
    @SerializedName("fullName") val fullName: String? = null,
    @SerializedName("role") val role: String = "CUSTOMER"
)

/**
 * Work Order / Job Entity
 */
data class Job(
    @SerializedName("id") val id: String,
    @SerializedName("jobTicketNumber") val jobTicketNumber: String,
    @SerializedName("serviceTitle") val serviceTitle: String,
    @SerializedName("pincode") val pincode: String,
    @SerializedName("customerAddressText") val customerAddressText: String,
    @SerializedName("status") val status: String,
    @SerializedName("priority") val priority: String = "NORMAL",
    @SerializedName("totalAmountInr") val totalAmountInr: Double,
    @SerializedName("scheduledAt") val scheduledAt: String? = null,
    @SerializedName("technicianId") val technicianId: String? = null,
    @SerializedName("technicianName") val technicianName: String? = null,
    @SerializedName("handoverOtp") val handoverOtp: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class CreateJobRequest(
    @SerializedName("serviceId") val serviceId: String,
    @SerializedName("pincode") val pincode: String,
    @SerializedName("customerAddressText") val customerAddressText: String,
    @SerializedName("customerLatitude") val customerLatitude: Double? = null,
    @SerializedName("customerLongitude") val customerLongitude: Double? = null,
    @SerializedName("priority") val priority: String = "NORMAL"
)

/**
 * Live GPS Tracking Telemetry for Customer Map
 */
data class LiveTrackingResponse(
    @SerializedName("jobTicketNumber") val jobTicketNumber: String,
    @SerializedName("status") val status: String,
    @SerializedName("technician") val technician: TechnicianTrackingInfo
)

data class TechnicianTrackingInfo(
    @SerializedName("id") val id: String,
    @SerializedName("name") val name: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("rating") val rating: Double,
    @SerializedName("coordinates") val coordinates: Coordinates,
    @SerializedName("distanceKm") val distanceKm: Double,
    @SerializedName("etaMinutes") val etaMinutes: Int,
    @SerializedName("isOnline") val isOnline: Boolean
)

data class Coordinates(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double
)

/**
 * Service Catalog Offering
 */
data class ServiceItem(
    @SerializedName("id") val id: String,
    @SerializedName("code") val code: String,
    @SerializedName("title") val title: String,
    @SerializedName("description") val description: String,
    @SerializedName("category") val category: String,
    @SerializedName("priceInr") val priceInr: Double,
    @SerializedName("durationMinutes") val durationMinutes: Int,
    @SerializedName("rating") val rating: Double = 4.9,
    @SerializedName("isHighVoltageProtocol") val isHighVoltageProtocol: Boolean = false,
    @SerializedName("warrantyMonths") val warrantyMonths: Int = 12
)
