package com.ghartak.technician.data.model

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String?,
    @SerializedName("data") val data: T?,
    @SerializedName("error") val error: String? = null,
    @SerializedName("timestamp") val timestamp: String? = null
)

data class TechnicianProfile(
    @SerializedName("id") val id: String,
    @SerializedName("badgeNumber") val badgeNumber: String,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("partnerId") val partnerId: String,
    @SerializedName("assignedPincode") val assignedPincode: String,
    @SerializedName("isOnline") val isOnline: Boolean,
    @SerializedName("rating") val rating: Double,
    @SerializedName("safetyKitSerial") val safetyKitSerial: String? = null,
    @SerializedName("insulatedGlovesVerified") val insulatedGlovesVerified: Boolean = false,
    @SerializedName("totalJobsCompleted") val totalJobsCompleted: Int = 0
)

data class TechnicianJob(
    @SerializedName("id") val id: String,
    @SerializedName("jobTicketNumber") val jobTicketNumber: String,
    @SerializedName("serviceTitle") val serviceTitle: String,
    @SerializedName("pincode") val pincode: String,
    @SerializedName("customerName") val customerName: String,
    @SerializedName("customerPhone") val customerPhone: String,
    @SerializedName("customerAddressText") val customerAddressText: String,
    @SerializedName("customerLatitude") val customerLatitude: Double? = null,
    @SerializedName("customerLongitude") val customerLongitude: Double? = null,
    @SerializedName("status") val status: String,
    @SerializedName("priority") val priority: String = "NORMAL",
    @SerializedName("totalAmountInr") val totalAmountInr: Double,
    @SerializedName("safetyGlovesConfirmed") val safetyGlovesConfirmed: Boolean = false,
    @SerializedName("safetyMcbSwitchConfirmed") val safetyMcbSwitchConfirmed: Boolean = false,
    @SerializedName("handoverOtp") val handoverOtp: String? = null,
    @SerializedName("scheduledAt") val scheduledAt: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class DispatchActionRequest(
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("action") val action: String, // "ACCEPT" or "REJECT"
    @SerializedName("rejectionReason") val rejectionReason: String? = null
)

data class SafetyVerifyRequest(
    @SerializedName("safetyGlovesConfirmed") val safetyGlovesConfirmed: Boolean = true,
    @SerializedName("safetyMcbSwitchConfirmed") val safetyMcbSwitchConfirmed: Boolean = true,
    @SerializedName("beforePhotoUrl") val beforePhotoUrl: String
)

data class JobCompleteRequest(
    @SerializedName("handoverOtp") val handoverOtp: String,
    @SerializedName("afterPhotoUrl") val afterPhotoUrl: String,
    @SerializedName("customerRating") val customerRating: Int? = null,
    @SerializedName("customerFeedback") val customerFeedback: String? = null
)

data class TelemetryPingRequest(
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("jobId") val jobId: String? = null,
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("heading") val heading: Double? = null,
    @SerializedName("speedKmh") val speedKmh: Double? = null,
    @SerializedName("batteryLevelPct") val batteryLevelPct: Int? = null,
    @SerializedName("isOnline") val isOnline: Boolean = true
)

data class TelemetryPingResponse(
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("jobId") val jobId: String?,
    @SerializedName("distanceRemainingKm") val distanceRemainingKm: Double?,
    @SerializedName("etaMinutes") val etaMinutes: Int?,
    @SerializedName("isDoorstepNearby") val isDoorstepNearby: Boolean,
    @SerializedName("updatedStatus") val updatedStatus: String?
)
