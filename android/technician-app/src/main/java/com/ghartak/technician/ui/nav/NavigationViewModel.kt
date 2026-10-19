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
    val jobId: String = "job_live_01",
    val ticketNumber: String = "GTS-OD-1001",
    val serviceTitle: String = "Doorstep Service Order",
    val customerName: String = "Valued Customer",
    val customerPhone: String = "+91 98765 43210",
    val customerAddress: String = "Customer Doorstep Address",
    val customerLat: Double = 20.6600,
    val customerLng: Double = 85.5900,
    val currentLat: Double = 20.6680,
    val currentLng: Double = 85.5980,
    val distanceRemainingKm: Double = 1.2,
    val etaMinutes: Int = 5,
    val speedKmh: Double = 24.0,
    val heading: Double = 195.0,
    val currentManeuver: String = "Head towards customer doorstep",
    val nextManeuver: String = "Follow navigation route to destination",
    val transitStep: Int = 0,
    val hasArrivedDoorstep: Boolean = false,
    val isPinging: Boolean = false,
    val currentAreaName: String = "",
    val customerAreaName: String = ""
)

class NavigationViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(NavigationUiState())
    val uiState: StateFlow<NavigationUiState> = _uiState.asStateFlow()

    fun initJob(job: TechnicianJob) {
        val (resolvedLat, resolvedLng) = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(job.pincode)
        val targetLat = if (job.customerLatitude != null && job.customerLatitude > 0.0) job.customerLatitude else resolvedLat
        val targetLng = if (job.customerLongitude != null && job.customerLongitude > 0.0) job.customerLongitude else resolvedLng

        val context = sessionManager.context
        val hasFine = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? android.location.LocationManager
        var currentLat = targetLat + 0.010
        var currentLng = targetLng + 0.010

        if (hasFine && lm != null) {
            try {
                val loc = lm.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                    ?: lm.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                if (loc != null && loc.latitude != 0.0 && loc.longitude != 0.0) {
                    currentLat = loc.latitude
                    currentLng = loc.longitude
                }
            } catch (e: Exception) {
                // Keep coordinate fallback
            }
        }

        val realDist = com.ghartak.technician.util.IndianPincodeResolver.calculateHaversineDistanceKm(currentLat, currentLng, targetLat, targetLng)
        val roundedDist = Math.max(0.05, (Math.round(realDist * 100.0) / 100.0))
        val calcEta = com.ghartak.technician.util.IndianPincodeResolver.calculateEtaMinutes(roundedDist)

        val customerArea = com.ghartak.technician.util.IndianPincodeResolver.resolveAreaFromCoordinates(targetLat, targetLng)
        val techArea = com.ghartak.technician.util.IndianPincodeResolver.resolveAreaFromCoordinates(currentLat, currentLng)

        _uiState.value = _uiState.value.copy(
            jobId = job.id,
            ticketNumber = job.jobTicketNumber,
            serviceTitle = job.serviceTitle,
            customerName = job.customerName,
            customerPhone = job.customerPhone,
            customerAddress = job.customerAddressText,
            customerLat = targetLat,
            customerLng = targetLng,
            currentLat = currentLat,
            currentLng = currentLng,
            distanceRemainingKm = roundedDist,
            etaMinutes = calcEta,
            transitStep = 0,
            hasArrivedDoorstep = false,
            currentAreaName = techArea,
            customerAreaName = customerArea,
            currentManeuver = "Head towards $customerArea",
            nextManeuver = "Follow live arterial route to doorstep ($roundedDist km)"
        )
    }

    /**
     * Advance transit simulation step (Realistic interpolated approach -> Doorstep Arrival)
     * Pings the live backend API each step to broadcast real-time GPS coordinates!
     */
    fun advanceTransitStep(context: Context) {
        val nextStep = (_uiState.value.transitStep + 1).coerceAtMost(3)
        val targetLat = _uiState.value.customerLat
        val targetLng = _uiState.value.customerLng
        val customerArea = _uiState.value.customerAreaName.ifEmpty {
            com.ghartak.technician.util.IndianPincodeResolver.resolveAreaFromCoordinates(targetLat, targetLng)
        }

        val fraction = nextStep.toDouble() / 3.0
        val startLat = targetLat + 0.012
        val startLng = targetLng + 0.012
        val newLat = startLat + (targetLat - startLat) * fraction
        val newLng = startLng + (targetLng - startLng) * fraction

        val remainingDist = if (nextStep == 3) 0.03 else com.ghartak.technician.util.IndianPincodeResolver.calculateHaversineDistanceKm(newLat, newLng, targetLat, targetLng)
        val roundedDist = Math.max(0.03, (Math.round(remainingDist * 100.0) / 100.0))
        val eta = com.ghartak.technician.util.IndianPincodeResolver.calculateEtaMinutes(roundedDist)
        val newTechArea = com.ghartak.technician.util.IndianPincodeResolver.resolveAreaFromCoordinates(newLat, newLng)

        val (dist, calcEta, speed, maneuver, arrived) = when (nextStep) {
            1 -> Tuple5(roundedDist, eta, 28.0, "Continue towards $customerArea for ${(roundedDist * 1000).toInt()}m", false)
            2 -> Tuple5(roundedDist, eta, 16.0, "Approaching doorstep in $customerArea (${(roundedDist * 1000).toInt()}m away)", false)
            3 -> Tuple5(0.03, 0, 0.0, "Arrived at $customerArea (Doorstep Geofence)", true)
            else -> Tuple5(roundedDist, eta, 24.0, "Head towards $customerArea", false)
        }

        _uiState.value = _uiState.value.copy(
            transitStep = nextStep,
            distanceRemainingKm = dist,
            etaMinutes = calcEta,
            speedKmh = speed,
            currentManeuver = maneuver,
            hasArrivedDoorstep = arrived,
            currentLat = newLat,
            currentLng = newLng,
            currentAreaName = newTechArea,
            customerAreaName = customerArea
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