package com.ghartak.technician.ui.nav

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.model.TelemetryPingRequest
import com.ghartak.technician.data.session.SessionManager
import com.ghartak.technician.service.TechnicianLocationService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class NavigationUiState(
    val jobId: String = "job_mh_live_01",
    val ticketNumber: String = "GTS-MH-9821",
    val customerName: String = "Vikram Deshmukh",
    val customerPhone: String = "+919822334455",
    val customerAddress: String = "Flat 402, Sea Crest Towers, Colaba, Mumbai",
    val customerLat: Double = 18.9067,
    val customerLng: Double = 72.8147,
    val currentLat: Double = 18.9220,
    val currentLng: Double = 72.8347,
    val distanceRemainingKm: Double = 1.4,
    val etaMinutes: Int = 6,
    val speedKmh: Double = 24.0,
    val heading: Double = 195.0,
    val currentManeuver: String = "Head South on Shahid Bhagat Singh Rd",
    val nextManeuver: String = "In 400m, turn left toward Sea Crest Lane",
    val transitStep: Int = 0,
    val hasArrivedDoorstep: Boolean = false,
    val isPinging: Boolean = false
)

class NavigationViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(NavigationUiState())
    val uiState: StateFlow<NavigationUiState> = _uiState.asStateFlow()

    fun initJob(job: TechnicianJob) {
        _uiState.value = _uiState.value.copy(
            jobId = job.id,
            ticketNumber = job.jobTicketNumber,
            customerName = job.customerName,
            customerPhone = job.customerPhone,
            customerAddress = job.customerAddressText,
            customerLat = job.customerLatitude ?: 18.9067,
            customerLng = job.customerLongitude ?: 72.8147,
            distanceRemainingKm = 1.4,
            etaMinutes = 6,
            transitStep = 0,
            hasArrivedDoorstep = false
        )
    }

    /**
     * Advance transit simulation step (1.4 km -> 0.8 km -> 0.3 km -> 0.03 km Doorstep Arrival)
     * Pings the live backend API each step to broadcast real-time GPS coordinates!
     */
    fun advanceTransitStep(context: Context) {
        val nextStep = (_uiState.value.transitStep + 1).coerceAtMost(3)

        val (dist, eta, speed, maneuver, arrived) = when (nextStep) {
            1 -> Tuple5(0.85, 3, 28.0, "Continue on Colaba Causeway for 600m", false)
            2 -> Tuple5(0.28, 1, 15.0, "Turn Left into Sea Crest Lane (200m to destination)", false)
            3 -> Tuple5(0.03, 0, 0.0, "Arrived at Sea Crest Towers (Doorstep Geofence)", true)
            else -> Tuple5(1.4, 6, 24.0, "Head South on Shahid Bhagat Singh Rd", false)
        }

        // Interpolate moving GPS coordinates towards customer location
        val fraction = nextStep.toDouble() / 3.0
        val newLat = 18.9220 + (18.9067 - 18.9220) * fraction
        val newLng = 72.8347 + (72.8147 - 72.8347) * fraction

        _uiState.value = _uiState.value.copy(
            transitStep = nextStep,
            distanceRemainingKm = dist,
            etaMinutes = eta,
            speedKmh = speed,
            currentManeuver = maneuver,
            hasArrivedDoorstep = arrived,
            currentLat = newLat,
            currentLng = newLng
        )

        // Ping backend telemetry endpoint with fast timeout
        pingBackendTelemetry(context, newLat, newLng, speed)
    }

    private fun pingBackendTelemetry(context: Context, lat: Double, lng: Double, speed: Double) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isPinging = true)
            try {
                withTimeoutOrNull(2000L) {
                    val api = ApiClient.getService(context)
                    val response = api.sendTelemetry(
                        TelemetryPingRequest(
                            technicianId = sessionManager.getTechnicianId(),
                            jobId = _uiState.value.jobId,
                            latitude = lat,
                            longitude = lng,
                            heading = _uiState.value.heading,
                            speedKmh = speed,
                            batteryLevelPct = 85,
                            isOnline = true
                        )
                    )

                    if (response.isSuccessful && response.body()?.data?.isDoorstepNearby == true) {
                        _uiState.value = _uiState.value.copy(hasArrivedDoorstep = true)
                    }
                }
            } catch (e: Throwable) {
                Log.w("GTS_NAV", "Telemetry ping sync warning: ${e.message}")
            } finally {
                _uiState.value = _uiState.value.copy(isPinging = false)
            }
        }
    }

    fun manualConfirmDoorstep(context: Context) {
        _uiState.value = _uiState.value.copy(
            distanceRemainingKm = 0.02,
            etaMinutes = 0,
            hasArrivedDoorstep = true,
            currentManeuver = "Arrived at Destination (Manual Doorstep Check-in)"
        )
        pingBackendTelemetry(context, _uiState.value.customerLat, _uiState.value.customerLng, 0.0)
    }

    fun startForegroundService(context: Context) {
        try {
            // Check location permission before attempting foreground service on Android 14
            val hasLocation = ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED || ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED

            if (!hasLocation) {
                Log.i("GTS_NAV", "Location permission not yet granted; skipping foreground service to prevent OS crash")
                return
            }

            val intent = Intent(context, TechnicianLocationService::class.java).apply {
                action = TechnicianLocationService.ACTION_START
                putExtra(TechnicianLocationService.EXTRA_JOB_ID, _uiState.value.jobId)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        } catch (e: Throwable) {
            Log.w("GTS_NAV", "Foreground service start prevented error: ${e.message}")
        }
    }

    fun stopForegroundService(context: Context) {
        try {
            val intent = Intent(context, TechnicianLocationService::class.java).apply {
                action = TechnicianLocationService.ACTION_STOP
            }
            context.startService(intent)
        } catch (e: Throwable) {
            // Ignore
        }
    }
}

private data class Tuple5<A, B, C, D, E>(
    val a: A, val b: B, val c: C, val d: D, val e: E
)