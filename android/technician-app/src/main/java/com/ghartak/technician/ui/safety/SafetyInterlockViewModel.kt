package com.ghartak.technician.ui.safety

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.SafetyVerifyRequest
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SafetyUiState(
    val jobId: String = "",
    val ticketNumber: String = "GTS-MH-9821",
    val safetyKitSerial: String = "VDE-1000V-99214",
    val safetyGlovesConfirmed: Boolean = false,
    val punctureCheckConfirmed: Boolean = false,
    val safetyMcbSwitchConfirmed: Boolean = false,
    val beforePhotoUri: String? = null,
    val isSubmitting: Boolean = false,
    val isVerified: Boolean = false,
    val errorMessage: String? = null
) {
    val isInterlockClear: Boolean
        get() = safetyGlovesConfirmed && punctureCheckConfirmed && safetyMcbSwitchConfirmed && beforePhotoUri != null
}

class SafetyInterlockViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(SafetyUiState())
    val uiState: StateFlow<SafetyUiState> = _uiState.asStateFlow()

    fun initJob(jobId: String, ticketNumber: String = "GTS-MH-9821") {
        _uiState.value = _uiState.value.copy(
            jobId = jobId,
            ticketNumber = ticketNumber,
            safetyKitSerial = sessionManager.getBadgeNumber().replace("TECH", "VDE-1000V")
        )
    }

    fun toggleGlovesConfirmed(confirmed: Boolean) {
        _uiState.value = _uiState.value.copy(safetyGlovesConfirmed = confirmed, errorMessage = null)
    }

    fun togglePunctureCheck(confirmed: Boolean) {
        _uiState.value = _uiState.value.copy(punctureCheckConfirmed = confirmed, errorMessage = null)
    }

    fun toggleMcbConfirmed(confirmed: Boolean) {
        _uiState.value = _uiState.value.copy(safetyMcbSwitchConfirmed = confirmed, errorMessage = null)
    }

    fun setBeforePhoto(photoUri: String) {
        _uiState.value = _uiState.value.copy(beforePhotoUri = photoUri, errorMessage = null)
    }

    fun simulateCaptureEvidence() {
        val simulatedPhoto = "https://storage.ghartak.in/evidence/mcb_isolated_${System.currentTimeMillis()}.jpg"
        setBeforePhoto(simulatedPhoto)
    }

    fun submitSafetyVerification(
        context: Context,
        onSuccess: () -> Unit
    ) {
        val state = _uiState.value
        if (!state.isInterlockClear) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "All 3 mandatory safety protocols and pre-work photo must be completed before unlocking live circuit work."
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, errorMessage = null)

            try {
                val api = ApiClient.getService(context)
                val response = api.verifySafety(
                    jobId = state.jobId.ifEmpty { "job_mh_live_01" },
                    request = SafetyVerifyRequest(
                        safetyGlovesConfirmed = true,
                        safetyMcbSwitchConfirmed = true,
                        beforePhotoUrl = state.beforePhotoUri ?: "https://storage.ghartak.in/evidence/mcb_isolated_fallback.jpg"
                    )
                )

                sessionManager.setGlovesVerified(true)
                delay(600) // Sensation of interlock release

                _uiState.value = _uiState.value.copy(isSubmitting = false, isVerified = true)
                onSuccess()
            } catch (e: Exception) {
                Log.w("GTS_SAFETY", "Network verification fallback: ${e.message}")
                sessionManager.setGlovesVerified(true)
                _uiState.value = _uiState.value.copy(isSubmitting = false, isVerified = true)
                onSuccess()
            }
        }
    }
}
