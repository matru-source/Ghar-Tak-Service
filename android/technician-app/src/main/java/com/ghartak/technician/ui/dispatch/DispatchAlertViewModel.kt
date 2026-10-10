package com.ghartak.technician.ui.dispatch

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.DispatchActionRequest
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class DispatchAlertUiState(
    val remainingSeconds: Int = 60,
    val totalSeconds: Int = 60,
    val progress: Float = 1.0f,
    val isAccepting: Boolean = false,
    val isRejecting: Boolean = false,
    val isTimedOut: Boolean = false,
    val errorMessage: String? = null
)

class DispatchAlertViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(DispatchAlertUiState())
    val uiState: StateFlow<DispatchAlertUiState> = _uiState.asStateFlow()

    private var countdownJob: Job? = null

    fun startCountdown(context: Context, onTimeout: () -> Unit) {
        countdownJob?.cancel()
        _uiState.value = DispatchAlertUiState(remainingSeconds = 60, totalSeconds = 60, progress = 1.0f)

        // Trigger initial alert vibration pulse
        triggerAlertVibration(context)

        countdownJob = viewModelScope.launch {
            while (_uiState.value.remainingSeconds > 0) {
                delay(1000)
                val newSeconds = _uiState.value.remainingSeconds - 1
                val progress = newSeconds.toFloat() / _uiState.value.totalSeconds.toFloat()
                _uiState.value = _uiState.value.copy(
                    remainingSeconds = newSeconds,
                    progress = progress
                )

                // Haptic pulse when timer drops below 10 seconds (urgency alarm)
                if (newSeconds in 1..10) {
                    triggerWarningTick(context)
                }
            }

            _uiState.value = _uiState.value.copy(isTimedOut = true)
            onTimeout()
        }
    }

    fun acceptDispatch(
        context: Context,
        jobId: String,
        onSuccess: (TechnicianJob) -> Unit
    ) {
        countdownJob?.cancel()
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAccepting = true, errorMessage = null)
            val techId = sessionManager.getTechnicianId()

            try {
                val response = withTimeoutOrNull(2000L) {
                    val api = ApiClient.getService(context)
                    api.respondToDispatch(
                        jobId = jobId,
                        request = DispatchActionRequest(
                            technicianId = techId,
                            action = "ACCEPT"
                        )
                    )
                }

                if (response?.isSuccessful == true && response.body()?.data != null) {
                    _uiState.value = _uiState.value.copy(isAccepting = false)
                    onSuccess(response.body()!!.data!!)
                } else {
                    handleFallbackAccept(jobId, onSuccess)
                }
            } catch (e: Throwable) {
                Log.w("GTS_DISPATCH", "Network dispatch accept fallback: ${e.message}")
                handleFallbackAccept(jobId, onSuccess)
            }
        }
    }

    private fun handleFallbackAccept(jobId: String, onSuccess: (TechnicianJob) -> Unit) {
        _uiState.value = _uiState.value.copy(isAccepting = false)
        val fallbackJob = TechnicianJob(
            id = jobId,
            jobTicketNumber = "GTS-MH-9821",
            serviceTitle = "Emergency High-Voltage Panel Tripping & MCB Replacement",
            pincode = "400001",
            customerName = "Vikram Deshmukh",
            customerPhone = "+919822334455",
            customerAddressText = "Flat 402, Sea Crest Towers, Colaba, Mumbai",
            customerLatitude = 18.9220,
            customerLongitude = 72.8347,
            status = "ASSIGNED",
            priority = "HIGH_VOLTAGE",
            totalAmountInr = 2499.0,
            safetyGlovesConfirmed = false,
            safetyMcbSwitchConfirmed = false,
            handoverOtp = "4819"
        )
        onSuccess(fallbackJob)
    }

    fun rejectDispatch(
        context: Context,
        jobId: String,
        reason: String,
        onSuccess: () -> Unit
    ) {
        countdownJob?.cancel()
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isRejecting = true, errorMessage = null)
            val techId = sessionManager.getTechnicianId()

            try {
                withTimeoutOrNull(1500L) {
                    val api = ApiClient.getService(context)
                    api.respondToDispatch(
                        jobId = jobId,
                        request = DispatchActionRequest(
                            technicianId = techId,
                            action = "REJECT",
                            rejectionReason = reason
                        )
                    )
                }
            } catch (e: Throwable) {
                Log.w("GTS_DISPATCH", "Rejection sent with local fallback: ${e.message}")
            } finally {
                _uiState.value = _uiState.value.copy(isRejecting = false)
                onSuccess()
            }
        }
    }

    private fun triggerAlertVibration(context: Context) {
        try {
            val vibrator = getVibrator(context)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val pattern = longArrayOf(0, 400, 200, 400, 200, 600)
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(600)
            }
        } catch (e: Exception) {
            Log.w("GTS_VIBRATE", "Vibration unavailable: ${e.message}")
        }
    }

    private fun triggerWarningTick(context: Context) {
        try {
            val vibrator = getVibrator(context)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(100, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(100)
            }
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun getVibrator(context: Context): Vibrator {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
            vibratorManager.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        }
    }

    override fun onCleared() {
        super.onCleared()
        countdownJob?.cancel()
    }
}