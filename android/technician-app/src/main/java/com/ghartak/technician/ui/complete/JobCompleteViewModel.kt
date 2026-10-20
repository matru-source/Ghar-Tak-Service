package com.ghartak.technician.ui.complete

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.JobCompleteRequest
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class JobCompleteUiState(
    val jobId: String = "job_live_01",
    val ticketNumber: String = "GTS-OD-1001",
    val serviceTitle: String = "Doorstep Service Order",
    val customerName: String = "Valued Customer",
    val totalAmountInr: Double = 0.0,
    val technicianPayoutInr: Double = 0.0,
    val enteredOtp: String = "",
    val afterPhotoUri: String? = null,
    val afterPhotoBitmap: Bitmap? = null,
    val rating: Int = 5,
    val feedback: String = "Service completed cleanly with professional workmanship and verified safety inspection.",
    val isSubmitting: Boolean = false,
    val isCompleted: Boolean = false,
    val invoiceNumber: String = "INV-2026-MH-4091",
    val errorMessage: String? = null
) {
    val canSubmit: Boolean
        get() = enteredOtp.length == 4 && afterPhotoUri != null
}

class JobCompleteViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(JobCompleteUiState())
    val uiState: StateFlow<JobCompleteUiState> = _uiState.asStateFlow()

    fun initJob(job: TechnicianJob) {
        val payout = job.totalAmountInr * 0.70
        val defaultFeedback = "Completed ${job.serviceTitle.ifBlank { "doorstep service" }} cleanly with verified quality and safety inspection."
        _uiState.value = _uiState.value.copy(
            jobId = job.id,
            ticketNumber = job.jobTicketNumber,
            serviceTitle = job.serviceTitle,
            customerName = job.customerName,
            totalAmountInr = job.totalAmountInr,
            technicianPayoutInr = payout,
            enteredOtp = "",
            afterPhotoUri = null,
            afterPhotoBitmap = null,
            feedback = defaultFeedback,
            isCompleted = false,
            errorMessage = null
        )
    }

    fun onOtpChanged(otp: String) {
        val sanitized = otp.filter { it.isDigit() }.take(4)
        _uiState.value = _uiState.value.copy(enteredOtp = sanitized, errorMessage = null)
    }

    fun setAfterPhoto(photoUri: String, bitmap: Bitmap? = null) {
        _uiState.value = _uiState.value.copy(
            afterPhotoUri = photoUri,
            afterPhotoBitmap = bitmap,
            errorMessage = null
        )
    }

    fun simulateCaptureAfterPhoto() {
        val simulatedPhoto = "https://storage.ghartak.in/evidence/after_work_completed_${System.currentTimeMillis()}.jpg"
        setAfterPhoto(simulatedPhoto, null)
    }

    fun onRatingChanged(stars: Int) {
        _uiState.value = _uiState.value.copy(rating = stars)
    }

    fun onFeedbackChanged(text: String) {
        _uiState.value = _uiState.value.copy(feedback = text)
    }

    fun submitJobComplete(
        context: Context,
        onSuccess: () -> Unit
    ) {
        val state = _uiState.value
        if (!state.canSubmit) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Please enter the complete 4-digit handover OTP and attach post-repair photo evidence."
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, errorMessage = null)

            try {
                val targetJobId = state.jobId
                if (targetJobId.isBlank()) {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        errorMessage = "Invalid Work Order: No Job ID attached."
                    )
                    return@launch
                }

                val api = ApiClient.getService(context)
                var targetPhotoUrl = state.afterPhotoUri ?: "/uploads/after_work_completed.jpg"

                if (state.afterPhotoBitmap != null) {
                    try {
                        val baos = java.io.ByteArrayOutputStream()
                        state.afterPhotoBitmap.compress(Bitmap.CompressFormat.JPEG, 85, baos)
                        val base64Str = android.util.Base64.encodeToString(baos.toByteArray(), android.util.Base64.NO_WRAP)
                        val uploadResp = api.uploadPhoto(mapOf("base64" to base64Str))
                        if (uploadResp.isSuccessful && uploadResp.body()?.data != null) {
                            targetPhotoUrl = uploadResp.body()!!.data!!.url
                        }
                    } catch (e: Exception) {
                        Log.w("GTS_COMPLETE", "Photo upload exception: ${e.message}")
                    }
                }

                val res = withTimeoutOrNull(15000L) {
                    api.completeJob(
                        jobId = targetJobId,
                        request = JobCompleteRequest(
                            handoverOtp = state.enteredOtp,
                            afterPhotoUrl = targetPhotoUrl,
                            customerRating = state.rating,
                            customerFeedback = state.feedback
                        )
                    )
                }

                if (res != null && res.isSuccessful && res.body()?.data != null) {
                    // OTP Verification PASSED
                    val realInvoiceNumber = res.body()!!.data!!.invoiceNumber
                    val sm = SessionManager(context)
                    try {
                        sm.addEarnings(state.technicianPayoutInr)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                    val pin = sm.getPincode()
                    val statePrefix = if (pin.startsWith("75") || pin.startsWith("76") || pin.startsWith("77")) "OD" else "MH"
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        isCompleted = true,
                        invoiceNumber = realInvoiceNumber ?: ("INV-2026-$statePrefix-" + (1000..9999).random()),
                        errorMessage = null
                    )
                    onSuccess()
                } else {
                    // OTP Verification FAILED or backend rejected
                    val errorRaw = res?.errorBody()?.string()
                    val errorMsg = try {
                        if (!errorRaw.isNullOrBlank()) {
                            val json = org.json.JSONObject(errorRaw)
                            json.optString("details", json.optString("error", "Verification failed. Invalid handover OTP."))
                        } else {
                            "Invalid handover OTP. The 4-digit code does not match customer's verification code."
                        }
                    } catch (e: Exception) {
                        "Invalid handover OTP (${state.enteredOtp}). Please request correct OTP from customer."
                    }
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        isCompleted = false,
                        errorMessage = errorMsg
                    )
                }
            } catch (e: Throwable) {
                Log.w("GTS_COMPLETE", "Network completion error: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    isCompleted = false,
                    errorMessage = "Verification error: ${e.message ?: "Unable to contact verification server. Please retry."}"
                )
            }
        }
    }
}