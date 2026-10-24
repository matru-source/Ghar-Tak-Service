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
import com.ghartak.technician.service.TechnicianLocationService
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

    fun startCountdown(context: Context, dispatchedAt: String? = null, onTimeout: () -> Unit) {
        countdownJob?.cancel()
        val initialSeconds = if (!dispatchedAt.isNullOrBlank()) {
            try {
                val epochMs = if (dispatchedAt.toLongOrNull() != null) {
                    dispatchedAt.toLong()
                } else {
                    java.time.Instant.parse(dispatchedAt).toEpochMilli()
                }
                val elapsedSec = ((System.currentTimeMillis() - epochMs) / 1000L).toInt()
                (60 - elapsedSec).coerceIn(0, 60)
            } catch (e: Exception) {
                60
            }
        } else {
            60
        }

        _uiState.value = DispatchAlertUiState(
            remainingSeconds = initialSeconds,
            totalSeconds = 60,
            progress = initialSeconds.toFloat() / 60.0f
        )

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
        job: TechnicianJob,
        onSuccess: (TechnicianJob) -> Unit
    ) {
        countdownJob?.cancel()
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isAccepting = true, errorMessage = null)
            val techId = sessionManager.getTechnicianId()

            try {
                val response = withTimeoutOrNull(15000L) {
                    val api = ApiClient.getService(context)
                    api.respondToDispatch(
                        jobId = job.id,
                        request = DispatchActionRequest(
                            technicianId = techId,
                            action = "ACCEPT",
                            version = job.version
                        )
                    )
                }

                if (response?.isSuccessful == true && response.body()?.data != null) {
                    _uiState.value = _uiState.value.copy(isAccepting = false, errorMessage = null)
                    val acceptedJob = response.body()!!.data!!
                    TechnicianLocationService.startService(context, acceptedJob.id)
                    onSuccess(acceptedJob)
                } else {
                    val rawErr = response?.errorBody()?.string()
                    val msg = try {
                        if (!rawErr.isNullOrBlank()) {
                            org.json.JSONObject(rawErr).optString("details", org.json.JSONObject(rawErr).optString("error", "Dispatch acceptance rejected by server."))
                        } else {
                            "Dispatch acceptance rejected. The work order may have been reassigned or expired."
                        }
                    } catch (e: Exception) {
                        "Dispatch acceptance failed on server. Please refresh your job queue."
                    }
                    _uiState.value = _uiState.value.copy(isAccepting = false, errorMessage = msg)
                }
            } catch (e: Throwable) {
                Log.w("GTS_DISPATCH", "Network dispatch accept error: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    isAccepting = false,
                    errorMessage = "Network error: Unable to contact dispatch server. Please check connection."
                )
            }
        }
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
                withTimeoutOrNull(15000L) {
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