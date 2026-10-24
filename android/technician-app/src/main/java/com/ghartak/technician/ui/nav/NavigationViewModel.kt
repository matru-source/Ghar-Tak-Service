package com.ghartak.technician.ui.nav

import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.model.TelemetryPingRequest
import com.ghartak.technician.data.session.SessionManager
import com.ghartak.technician.service.TechnicianLocationService
import com.ghartak.technician.util.IndianPincodeResolver
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
    val distanceRemainingKm: Double = 0.0,
    val etaMinutes: Int = 0,
    val speedKmh: Double = 0.0,
    val heading: Double = 0.0,
    val currentManeuver: String = "Head towards customer doorstep",
    val nextManeuver: String = "Follow navigation route to destination",
    val hasArrivedDoorstep: Boolean = false,
    val isPinging: Boolean = false,
    val currentAreaName: String = "",
    val customerAreaName: String = ""
)

class NavigationViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    // [TESTING FLAG] Toggle for instant doorstep arrival bypass
    var isTestingBypassEnabled: Boolean = true

    private val _uiState = MutableStateFlow(NavigationUiState())
    val uiState: StateFlow<NavigationUiState> = _uiState.asStateFlow()

    private var activeLocationListener: LocationListener? = null
    private var lastLocationTimeMs: Long = 0L
    private var lastLocationLat: Double = 0.0
    private var lastLocationLng: Double = 0.0

    private fun getBatteryLevel(context: Context): Int {
        return try {
            val bm = context.getSystemService(Context.BATTERY_SERVICE) as? android.os.BatteryManager
            val level = bm?.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: -1
            if (level in 0..100) level else 85
        } catch (e: Exception) {
            85
        }
    }

    fun initJob(job: TechnicianJob) {
        val (resolvedLat, resolvedLng) = IndianPincodeResolver.getCoordinatesForPincode(job.pincode)
        val targetLat = if (job.customerLatitude != null && job.customerLatitude > 0.0) job.customerLatitude else resolvedLat
        val targetLng = if (job.customerLongitude != null && job.customerLongitude > 0.0) job.customerLongitude else resolvedLng

        val context = sessionManager.context
        val hasFine = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        val (techHubLat, techHubLng) = IndianPincodeResolver.getCoordinatesForPincode(sessionManager.getPincode().ifEmpty { "760001" })
        var currentLat = techHubLat
        var currentLng = techHubLng
        var hasRealGpsFix = false
        var initialSpeed = 0.0

        if (hasFine && lm != null) {
            try {
                val loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                    ?: lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                if (loc != null && loc.latitude != 0.0 && loc.longitude != 0.0) {
                    currentLat = loc.latitude
                    currentLng = loc.longitude
                    hasRealGpsFix = true
                    if (loc.hasSpeed() && loc.speed > 0.3f) {
                        initialSpeed = Math.round(loc.speed * 3.6 * 10.0) / 10.0
                    }
                }
            } catch (e: Exception) {
                // Keep tech hub coordinate fallback
            }
        }

        val realDist = IndianPincodeResolver.calculateHaversineDistanceKm(currentLat, currentLng, targetLat, targetLng)
        val roundedDist = Math.max(0.0, Math.round(realDist * 100.0) / 100.0)
        // Doorstep arrival can ONLY be confirmed if genuine GPS hardware fix exists and is within 50m
        val isCoLocated = hasRealGpsFix && (roundedDist <= 0.05 || (Math.abs(currentLat - targetLat) < 0.0002 && Math.abs(currentLng - targetLng) < 0.0002))
        val calcEta = if (isCoLocated) 0 else IndianPincodeResolver.calculateEtaMinutes(roundedDist)

        val customerArea = IndianPincodeResolver.resolveAreaFromCoordinates(targetLat, targetLng)
        val techArea = IndianPincodeResolver.resolveAreaFromCoordinates(currentLat, currentLng)

        val initManeuver = if (isCoLocated) {
            "Arrived at $customerArea (Doorstep Geofence)"
        } else {
            "Head towards $customerArea"
        }
        val initNext = if (isCoLocated) {
            "50m Geofence Verified • Customer Doorstep Reached"
        } else {
            "Follow live arterial route to doorstep ($roundedDist km)"
        }

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
            distanceRemainingKm = if (isCoLocated) 0.0 else roundedDist,
            etaMinutes = calcEta,
            speedKmh = if (isCoLocated) 0.0 else initialSpeed,
            hasArrivedDoorstep = isCoLocated,
            currentAreaName = techArea,
            customerAreaName = customerArea,
            currentManeuver = initManeuver,
            nextManeuver = initNext
        )

        lastLocationLat = currentLat
        lastLocationLng = currentLng
        lastLocationTimeMs = System.currentTimeMillis()
    }

    /**
     * Start continuous live GPS location listener for dynamic coordinates, speed & arrival
     */
    fun startLocationUpdates(context: Context) {
        val hasFine = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (!hasFine && !hasCoarse) return

        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return

        stopLocationUpdates(context)

        val listener = object : LocationListener {
            override fun onLocationChanged(loc: Location) {
                handleNewLocation(context, loc)
            }
            @Deprecated("Deprecated in Java")
            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }
        activeLocationListener = listener

        try {
            if (lm.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
                lm.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    2000L,
                    1.0f,
                    listener,
                    Looper.getMainLooper()
                )
            }
            if (lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
                lm.requestLocationUpdates(
                    LocationManager.NETWORK_PROVIDER,
                    3000L,
                    2.0f,
                    listener,
                    Looper.getMainLooper()
                )
            }
        } catch (e: SecurityException) {
            Log.w("GTS_NAV", "SecurityException requesting location updates: ${e.message}")
        }
    }

    fun stopLocationUpdates(context: Context? = null) {
        val ctx = context ?: sessionManager.context
        val lm = ctx.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        activeLocationListener?.let {
            try {
                lm?.removeUpdates(it)
            } catch (e: Exception) {
                // Ignore removal exception
            }
            activeLocationListener = null
        }
    }

    private fun handleNewLocation(context: Context, loc: Location) {
        val isMock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            loc.isMock
        } else {
            @Suppress("DEPRECATION")
            loc.isFromMockProvider
        }
        if (isMock) {
            Log.w("GTS_NAV", "Security Violation: Simulated mock GPS location rejected by navigation engine")
            return
        }

        val now = System.currentTimeMillis()
        val lat = loc.latitude
        val lng = loc.longitude

        // 1. Calculate dynamic speed in km/h
        var calculatedSpeedKmh = 0.0
        if (loc.hasSpeed() && loc.speed > 0.3f) {
            calculatedSpeedKmh = Math.round(loc.speed * 3.6 * 10.0) / 10.0
        } else if (lastLocationTimeMs > 0L) {
            val dtSec = (now - lastLocationTimeMs) / 1000.0
            if (dtSec in 1.0..10.0) {
                val dKm = IndianPincodeResolver.calculateHaversineDistanceKm(lastLocationLat, lastLocationLng, lat, lng)
                val speed = dKm / (dtSec / 3600.0)
                if (speed in 1.5..120.0) {
                    calculatedSpeedKmh = Math.round(speed * 10.0) / 10.0
                }
            }
        }

        // 2. Calculate remaining distance to customer doorstep
        val targetLat = _uiState.value.customerLat
        val targetLng = _uiState.value.customerLng
        val realDist = IndianPincodeResolver.calculateHaversineDistanceKm(lat, lng, targetLat, targetLng)
        val roundedDist = Math.max(0.0, Math.round(realDist * 100.0) / 100.0)

        val isArrived = roundedDist <= 0.05 || (Math.abs(lat - targetLat) < 0.0002 && Math.abs(lng - targetLng) < 0.0002) || _uiState.value.hasArrivedDoorstep
        val finalDist = if (isArrived) 0.0 else roundedDist
        val finalSpeed = if (isArrived || roundedDist <= 0.05) 0.0 else calculatedSpeedKmh
        val eta = if (isArrived) 0 else IndianPincodeResolver.calculateEtaMinutes(roundedDist)

        val customerArea = _uiState.value.customerAreaName.ifEmpty {
            IndianPincodeResolver.resolveAreaFromCoordinates(targetLat, targetLng)
        }
        val techArea = IndianPincodeResolver.resolveAreaFromCoordinates(lat, lng)

        val maneuver = when {
            isArrived -> "Arrived at $customerArea (Doorstep Geofence)"
            roundedDist < 0.25 -> "Approaching doorstep in $customerArea (${(roundedDist * 1000).toInt()}m away)"
            else -> "Head towards $customerArea"
        }
        val nextMan = when {
            isArrived -> "50m Geofence Verified • Customer Doorstep Reached"
            else -> "Follow live route to destination (${(roundedDist * 1000).toInt()}m away)"
        }

        _uiState.value = _uiState.value.copy(
            currentLat = lat,
            currentLng = lng,
            distanceRemainingKm = finalDist,
            etaMinutes = eta,
            speedKmh = finalSpeed,
            heading = if (loc.hasBearing()) loc.bearing.toDouble() else _uiState.value.heading,
            currentManeuver = maneuver,
            nextManeuver = nextMan,
            hasArrivedDoorstep = isArrived,
            currentAreaName = techArea,
            customerAreaName = customerArea
        )

        lastLocationLat = lat
        lastLocationLng = lng
        lastLocationTimeMs = now

        // Broadcast telemetry ping to backend
        pingBackendTelemetry(context, lat, lng, finalSpeed)
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
                            batteryLevelPct = getBatteryLevel(context),
                            isOnline = true
                        )
                    )

                    if (response.isSuccessful && response.body()?.data?.isDoorstepNearby == true) {
                        _uiState.value = _uiState.value.copy(
                            hasArrivedDoorstep = true,
                            distanceRemainingKm = 0.0,
                            etaMinutes = 0,
                            speedKmh = 0.0,
                            currentManeuver = "Arrived at Destination (50m Geofence Confirmed)",
                            nextManeuver = "Doorstep reached • Customer Notified"
                        )
                    }
                }
            } catch (e: Throwable) {
                Log.w("GTS_NAV", "Telemetry ping sync warning: ${e.message}")
            } finally {
                _uiState.value = _uiState.value.copy(isPinging = false)
            }
        }
    }

    /* =========================================================================
     * [TESTING FEATURE] One-Click Doorstep Arrival
     * Directly adopts user's lat & lng for technician, bypasses the 5s scan,
     * immediately updates UI to Arrived at Doorstep, and broadcasts instant
     * ARRIVED status & telemetry to backend.
     * Can be easily removed when testing is complete.
     * ========================================================================= */
    fun triggerOneClickDoorstepArrival(context: Context) {
        if (!isTestingBypassEnabled) {
            Log.d("GTS_NAV", "Testing bypass disabled; physical geofence required")
            return
        }

        val custLat = _uiState.value.customerLat
        val custLng = _uiState.value.customerLng
        val custArea = _uiState.value.customerAreaName.ifEmpty { "Customer Doorstep" }

        _uiState.value = _uiState.value.copy(
            currentLat = custLat,
            currentLng = custLng,
            distanceRemainingKm = 0.0,
            etaMinutes = 0,
            speedKmh = 0.0,
            hasArrivedDoorstep = true,
            currentAreaName = custArea,
            currentManeuver = "ARRIVED AT USER'S DOORSTEP",
            nextManeuver = "Doorstep Reached (0.0 km) • Ready for Customer Verification"
        )

        viewModelScope.launch {
            try {
                val api = ApiClient.getService(context)
                val targetJob = _uiState.value.jobId

                // 1. Send immediate telemetry with user coordinates & 0.0 km distance
                api.sendTelemetry(
                    TelemetryPingRequest(
                        technicianId = sessionManager.getTechnicianId(),
                        jobId = targetJob,
                        latitude = custLat,
                        longitude = custLng,
                        heading = _uiState.value.heading,
                        speedKmh = 0.0,
                        batteryLevelPct = getBatteryLevel(context),
                        isOnline = true
                    )
                )

                // 2. Explicitly update job status to ARRIVED
                if (targetJob.isNotBlank()) {
                    api.updateJobStatus(targetJob, mapOf("status" to "ARRIVED"))
                }
            } catch (e: Throwable) {
                Log.w("GTS_NAV", "One-click doorstep bypass warning: ${e.message}")
            }
        }
    }

    fun manualConfirmDoorstep(context: Context) {
        triggerOneClickDoorstepArrival(context)
    }

    fun startForegroundService(context: Context) {
        TechnicianLocationService.startService(context, _uiState.value.jobId)
    }

    fun stopForegroundService(context: Context) {
        TechnicianLocationService.stopService(context)
    }

    override fun onCleared() {
        super.onCleared()
        stopLocationUpdates()
    }
}