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
    @SerializedName("totalJobsCompleted") val totalJobsCompleted: Int = 0,
    @SerializedName("email") val email: String = "",
    @SerializedName("location") val location: String = "Odisha, India",
    @SerializedName("languages") val languages: String = "Odia, Hindi, English",
    @SerializedName("specialization") val specialization: String = "Electrician",
    @SerializedName("experience") val experience: String = "5+ Years",
    @SerializedName("license") val license: String = "Trade Certified Professional",
    @SerializedName("serviceArea") val serviceArea: String = "Doorstep Territory",
    @SerializedName("avatarUrl") val avatarUrl: String? = null
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
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("invoiceNumber") val invoiceNumber: String? = null,
    @SerializedName("dispatchedAt") val dispatchedAt: String? = null,
    @SerializedName("version") val version: Int? = 1
)

data class DispatchActionRequest(
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("action") val action: String, // "ACCEPT" or "REJECT"
    @SerializedName("rejectionReason") val rejectionReason: String? = null,
    @SerializedName("version") val version: Int? = null
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
    @SerializedName("isOnline") val isOnline: Boolean = true,
    @SerializedName("isGpsActive") val isGpsActive: Boolean = true
)

data class TelemetryPingResponse(
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("jobId") val jobId: String?,
    @SerializedName("distanceRemainingKm") val distanceRemainingKm: Double?,
    @SerializedName("etaMinutes") val etaMinutes: Int?,
    @SerializedName("isDoorstepNearby") val isDoorstepNearby: Boolean,
    @SerializedName("updatedStatus") val updatedStatus: String?
)

data class RegisterTechnicianRequest(
    @SerializedName("id") val id: String? = null,
    @SerializedName("badgeNumber") val badgeNumber: String? = null,
    @SerializedName("fullName") val fullName: String,
    @SerializedName("phone") val phone: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("trade") val trade: String? = null,
    @SerializedName("specialization") val specialization: String? = null,
    @SerializedName("experience") val experience: String? = null,
    @SerializedName("license") val license: String? = null,
    @SerializedName("serviceArea") val serviceArea: String? = null,
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("pincode") val pincode: String,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("password") val password: String? = null
)

data class CreateWithdrawalRequest(
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("amountInr") val amountInr: Double,
    @SerializedName("payoutMethod") val payoutMethod: String, // "UPI" or "BANK_ACCOUNT"
    @SerializedName("upiId") val upiId: String? = null,
    @SerializedName("accountHolderName") val accountHolderName: String? = null,
    @SerializedName("accountNumber") val accountNumber: String? = null,
    @SerializedName("ifscCode") val ifscCode: String? = null,
    @SerializedName("bankName") val bankName: String? = null
)

data class WithdrawalItem(
    @SerializedName("id") val id: String,
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("technicianName") val technicianName: String,
    @SerializedName("technicianBadge") val technicianBadge: String,
    @SerializedName("technicianPhone") val technicianPhone: String,
    @SerializedName("amountInr") val amountInr: Double,
    @SerializedName("payoutMethod") val payoutMethod: String,
    @SerializedName("upiId") val upiId: String? = null,
    @SerializedName("accountHolderName") val accountHolderName: String? = null,
    @SerializedName("accountNumber") val accountNumber: String? = null,
    @SerializedName("ifscCode") val ifscCode: String? = null,
    @SerializedName("bankName") val bankName: String? = null,
    @SerializedName("status") val status: String, // "PENDING", "PAID", "REJECTED"
    @SerializedName("utrNumber") val utrNumber: String? = null,
    @SerializedName("partnerMessage") val partnerMessage: String? = null,
    @SerializedName("rejectionReason") val rejectionReason: String? = null,
    @SerializedName("requestedAt") val requestedAt: String? = null
)

data class WithdrawalListResponse(
    @SerializedName("withdrawals") val withdrawals: List<WithdrawalItem>,
    @SerializedName("count") val count: Int
)

data class WithdrawalRequestPayload(
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("amountInr") val amountInr: Double,
    @SerializedName("payoutMethod") val payoutMethod: String = "UPI",
    @SerializedName("upiId") val upiId: String? = null
) {
    val isValid: Boolean get() = amountInr >= MIN_WITHDRAWAL_THRESHOLD_INR && technicianId.isNotBlank()
    companion object {
        const val MIN_WITHDRAWAL_THRESHOLD_INR: Double = 500.0
    }
}

data class EmergencySosRequest(
    @SerializedName("technicianId") val technicianId: String,
    @SerializedName("technicianName") val technicianName: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("latitude") val latitude: Double? = null,
    @SerializedName("longitude") val longitude: Double? = null,
    @SerializedName("trade") val trade: String? = null,
    @SerializedName("reason") val reason: String? = null
)

data class FileUploadResponse(
    @SerializedName("url") val url: String,
    @SerializedName("fileName") val fileName: String? = null,
    @SerializedName("sizeBytes") val sizeBytes: Long? = null,
    @SerializedName("cdnUrl") val cdnUrl: String? = null,
    @SerializedName("relativeUrl") val relativeUrl: String? = null
)


