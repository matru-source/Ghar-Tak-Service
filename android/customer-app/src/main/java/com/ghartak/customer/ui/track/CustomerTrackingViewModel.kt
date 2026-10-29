package com.ghartak.customer.ui.track

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.api.ApiClient
import com.ghartak.customer.data.realtime.RealtimeStreamManager
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject

data class CustomerTrackingUiState(
    val jobId: String = "",
    val ticketNumber: String = "",
    val serviceTitle: String = "Doorstep Service",
    val status: String = "ASSIGNED",
    val technicianName: String = "Assigned Technician",
    val technicianPhone: String = "",
    val technicianBadge: String = "",
    val technicianRating: Double = 5.0,
    val technicianCompletedJobs: String = "Certified Professional",
    val handoverOtp: String = "",
    val distanceKm: Double = 0.0,
    val etaMinutes: Int = 0,
    val isDoorstepArrived: Boolean = false,
    val isSafetyInterlockVerified: Boolean = false,
    val isJobCompleted: Boolean = false,
    val transitStep: Int = 0,
    val techLatitude: Double = 0.0,
    val techLongitude: Double = 0.0,
    val animatedTechLat: Double = 0.0,
    val animatedTechLng: Double = 0.0,
    val headingDegrees: Float = 0f,
    val destLatitude: Double = 0.0,
    val destLongitude: Double = 0.0,
    val techAreaName: String = "",
    val destAreaName: String = ""
)

class CustomerTrackingViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(CustomerTrackingUiState())
    val uiState: StateFlow<CustomerTrackingUiState> = _uiState.asStateFlow()

    private val realtimeStreamManager = RealtimeStreamManager()
    private var telemetryPollingJob: Job? = null
    private var interpolationJob: Job? = null

    fun initTracking(jobId: String) {
        val activeTitle = sessionManager.getActiveJobTitle()
        val activeTicket = sessionManager.getActiveJobTicketNumber()
        val activeTech = sessionManager.getActiveJobTechnicianName()
        val activeBadge = sessionManager.getActiveJobTechnicianBadge()
        val activePhone = sessionManager.getActiveJobTechnicianPhone()
        val activeOtp = sessionManager.getActiveJobOtp()

        // Issue 23: Dynamic pincode resolution via GPS/Geocoder fallback instead of hardcoded 760001
        val userPin = sessionManager.getUserPincode().ifEmpty { "400001" }
        val (initDestLat, initDestLng) = com.ghartak.customer.util.IndianPincodeResolver.getCoordinatesForPincode(userPin)

        // Dynamically query actual customer phone GPS
        val context = sessionManager.context
        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

        var activeDestLat = initDestLat
        var activeDestLng = initDestLng
        if ((hasFine || hasCoarse) && lm != null) {
            try {
                val loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                    ?: lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                if (loc != null && loc.latitude != 0.0 && loc.longitude != 0.0) {
                    val isMock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        loc.isMock
                    } else {
                        @Suppress("DEPRECATION")
                        loc.isFromMockProvider
                    }
                    if (!isMock) {
                        activeDestLat = loc.latitude
                        activeDestLng = loc.longitude
                    } else {
                        Log.w("GTS_CUST_TRACK", "Security: Rejected simulated mock location from customer device")
                    }
                }
            } catch (e: SecurityException) {}
        }
        val activeDestArea = com.ghartak.customer.util.IndianPincodeResolver.resolveAreaFromCoordinates(activeDestLat, activeDestLng)

        val initialTechLat = if (_uiState.value.techLatitude != 0.0) _uiState.value.techLatitude else (activeDestLat + 0.012)
        val initialTechLng = if (_uiState.value.techLongitude != 0.0) _uiState.value.techLongitude else (activeDestLng + 0.012)
        val initialDist = if (_uiState.value.distanceKm > 0.0) _uiState.value.distanceKm else 1.5
        val initialEta = if (_uiState.value.etaMinutes > 0) _uiState.value.etaMinutes else 15
        val initialTechArea = com.ghartak.customer.util.IndianPincodeResolver.resolveAreaFromCoordinates(initialTechLat, initialTechLng)

        _uiState.value = _uiState.value.copy(
            jobId = jobId,
            serviceTitle = activeTitle,
            ticketNumber = activeTicket,
            technicianName = activeTech,
            technicianBadge = activeBadge,
            technicianPhone = activePhone,
            handoverOtp = activeOtp,
            destLatitude = activeDestLat,
            destLongitude = activeDestLng,
            destAreaName = activeDestArea,
            techLatitude = initialTechLat,
            techLongitude = initialTechLng,
            animatedTechLat = initialTechLat,
            animatedTechLng = initialTechLng,
            headingDegrees = 45f,
            techAreaName = initialTechArea,
            distanceKm = initialDist,
            etaMinutes = initialEta
        )

        // Pure Real-Time SSE Stream with Disconnect Fallback (Urban Company / Uber standard)
        lastSseEventTimestamp = System.currentTimeMillis()
        val customerId = sessionManager.getUserId().ifEmpty { sessionManager.getUserPhone() }
        realtimeStreamManager.connect(customerId, jobId) { eventType, data ->
            lastSseEventTimestamp = System.currentTimeMillis()
            handleRealtimeEvent(eventType, data)
        }

        // Heartbeat fallback: queries HTTP snapshot with 3-second fallback polling
        startDisconnectFallbackMonitor(sessionManager.context, jobId)
    }

    private var lastSseEventTimestamp: Long = 0L

    private fun startDisconnectFallbackMonitor(context: Context, jobId: String) {
        telemetryPollingJob?.cancel()
        telemetryPollingJob = viewModelScope.launch {
            val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

            while (isActive && !_uiState.value.isJobCompleted) {
                // Issue 20: Fallback heartbeat polling interval reduced from 15s to 3s (Urban Company / Uber standard)
                delay(3000L)

                // Only execute HTTP polling fallback if SSE has been disconnected / silent for > 3 seconds
                val elapsedSinceSse = System.currentTimeMillis() - lastSseEventTimestamp
                if (elapsedSinceSse >= 3000L) {
                    try {
                        val api = ApiClient.getService(context)

                        // 1. Send live customer device GPS to backend so technician distance is accurate
                        if ((hasFine || hasCoarse) && lm != null) {
                            try {
                                val loc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                                    ?: lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                                if (loc != null && loc.latitude != 0.0 && loc.longitude != 0.0) {
                                    val isMock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                        loc.isMock
                                    } else {
                                        @Suppress("DEPRECATION")
                                        loc.isFromMockProvider
                                    }
                                    if (!isMock) {
                                        _uiState.value = _uiState.value.copy(
                                            destLatitude = loc.latitude,
                                            destLongitude = loc.longitude,
                                            destAreaName = com.ghartak.customer.util.IndianPincodeResolver.resolveAreaFromCoordinates(loc.latitude, loc.longitude)
                                        )
                                        api.sendCustomerTelemetry(jobId, mapOf("latitude" to loc.latitude, "longitude" to loc.longitude))
                                    } else {
                                        Log.w("GTS_CUST_TRACK", "Security: Ignored mock location in fallback loop")
                                    }
                                }
                            } catch (e: SecurityException) {}
                        }

                        // 2. Fetch live technician telemetry fallback snapshot from backend
                        val response = api.getLiveTracking(jobId)
                        if (response.isSuccessful && response.body()?.data != null) {
                            val data = response.body()!!.data!!
                            val tech = data.technician
                            val dest = data.destination
                            val status = data.status ?: _uiState.value.status

                            val rawTLat = tech.coordinates.latitude
                            val rawTLng = tech.coordinates.longitude
                            val dLat = if (dest != null && dest.latitude != 0.0) dest.latitude else _uiState.value.destLatitude
                            val dLng = if (dest != null && dest.longitude != 0.0) dest.longitude else _uiState.value.destLongitude

                            val hasRealTechGps = rawTLat != 0.0 && rawTLng != 0.0
                            val (fallbackHubLat, fallbackHubLng) = if (!hasRealTechGps) {
                                com.ghartak.customer.util.IndianPincodeResolver.getCoordinatesForPincode(sessionManager.getUserPincode().ifEmpty { "400001" })
                            } else {
                                rawTLat to rawTLng
                            }
                            val tLat = if (hasRealTechGps) rawTLat else fallbackHubLat
                            val tLng = if (hasRealTechGps) rawTLng else fallbackHubLng

                            val calcDist = if (hasRealTechGps && dLat != 0.0) {
                                com.ghartak.customer.util.IndianPincodeResolver.calculateHaversineDistanceKm(tLat, tLng, dLat, dLng)
                            } else if (tech.distanceKm > 0.0) {
                                tech.distanceKm
                            } else {
                                _uiState.value.distanceKm.takeIf { it > 0.0 } ?: 1.5
                            }
                            val rawDist = Math.max(0.0, Math.round(calcDist * 100.0) / 100.0)
                            val isServerArrivedOrBeyond = status == "ARRIVED" || status == "SAFETY_CHECKED" || status == "IN_PROGRESS" || status == "COMPLETED" || status == "WORK_COMPLETED"
                            val isArrived = isServerArrivedOrBeyond || (status == "EN_ROUTE" && hasRealTechGps && (rawDist <= 0.05 || (Math.abs(tLat - dLat) < 0.0002 && Math.abs(tLng - dLng) < 0.0002)))
                            val roundedDist = if (isArrived) 0.0 else rawDist
                            val calcEta = if (isArrived) 0 else com.ghartak.customer.util.IndianPincodeResolver.calculateEtaMinutes(roundedDist)
                            val resolvedStatus = when {
                                status == "COMPLETED" || status == "WORK_COMPLETED" || status == "SETTLED" -> "COMPLETED"
                                status == "CANCELLED" -> "CANCELLED"
                                status == "SAFETY_CHECKED" || status == "IN_PROGRESS" -> "IN_PROGRESS"
                                status == "ARRIVED" || (status == "EN_ROUTE" && isArrived) -> "ARRIVED"
                                status == "EN_ROUTE" -> "EN_ROUTE"
                                else -> status
                            }

                            val resolvedTechArea = com.ghartak.customer.util.IndianPincodeResolver.resolveAreaFromCoordinates(tLat, tLng)
                            val resolvedDestArea = com.ghartak.customer.util.IndianPincodeResolver.resolveAreaFromCoordinates(dLat, dLng)

                            if (resolvedStatus == "CANCELLED") {
                                sessionManager.clearActiveJob()
                            } else if (resolvedStatus == "COMPLETED" || resolvedStatus == "EN_ROUTE" || resolvedStatus == "ARRIVED" || resolvedStatus == "IN_PROGRESS") {
                                sessionManager.setActiveJobStatus(resolvedStatus)
                            }

                            // Ensure session manager has valid job details for signoff & invoice history
                            sessionManager.updateActiveJobIfMissing(
                                ticketNumber = data.jobTicketNumber,
                                title = data.serviceTitle,
                                basePrice = data.basePriceInr,
                                total = data.totalAmountInr,
                                techName = tech.name,
                                techBadge = tech.badgeNumber,
                                techPhone = tech.phone,
                                otp = data.handoverOtp
                            )

                            // Dead-reckoning client interpolation
                            animateTechnicianPosition(tLat, tLng)

                            _uiState.value = _uiState.value.copy(
                                status = resolvedStatus,
                                distanceKm = roundedDist,
                                etaMinutes = calcEta,
                                techLatitude = tLat,
                                techLongitude = tLng,
                                destLatitude = dLat,
                                destLongitude = dLng,
                                techAreaName = resolvedTechArea,
                                destAreaName = resolvedDestArea,
                                ticketNumber = if (data.jobTicketNumber.isNotBlank()) data.jobTicketNumber else _uiState.value.ticketNumber,
                                serviceTitle = if (!data.serviceTitle.isNullOrBlank()) data.serviceTitle else _uiState.value.serviceTitle,
                                technicianName = tech.name ?: _uiState.value.technicianName,
                                technicianBadge = tech.badgeNumber ?: _uiState.value.technicianBadge,
                                technicianPhone = tech.phone ?: _uiState.value.technicianPhone,
                                technicianRating = tech.rating,
                                handoverOtp = if (!data.handoverOtp.isNullOrBlank()) data.handoverOtp else _uiState.value.handoverOtp,
                                isDoorstepArrived = isArrived || _uiState.value.isDoorstepArrived,
                                isJobCompleted = resolvedStatus == "COMPLETED"
                            )
                        }
                    } catch (e: Exception) {
                        // Fallback retry on next heartbeat cycle
                    }
                }
            }
        }
    }

    fun setServiceDetails(title: String, ticketNumber: String? = null) {
        _uiState.value = _uiState.value.copy(
            serviceTitle = title,
            ticketNumber = ticketNumber ?: _uiState.value.ticketNumber
        )
    }

    fun setAssignedTechnician(
        name: String,
        badge: String,
        phone: String,
        rating: Double,
        distanceKm: Double,
        etaMinutes: Int,
        completedJobs: String = "180+ jobs",
        ticketNumber: String? = null
    ) {
        _uiState.value = _uiState.value.copy(
            technicianName = name,
            technicianBadge = badge,
            technicianPhone = phone,
            technicianRating = rating,
            technicianCompletedJobs = completedJobs,
            distanceKm = distanceKm,
            etaMinutes = etaMinutes,
            ticketNumber = ticketNumber ?: _uiState.value.ticketNumber
        )
    }

    private fun handleRealtimeEvent(eventType: String, data: JSONObject) {
        Log.d("GTS_CUST_TRACK", "Received SSE event: $eventType with $data")

        when (eventType) {
            "TECH_ACCEPTED" -> {
                sessionManager.setActiveJobStatus("EN_ROUTE")
                _uiState.value = _uiState.value.copy(
                    status = "EN_ROUTE"
                )
            }

            "TECH_REJECTED" -> {
                sessionManager.clearActiveJob()
                _uiState.value = _uiState.value.copy(
                    status = "CANCELLED"
                )
            }

            "TECH_LOCATION_UPDATE" -> {
                val loc = data.optJSONObject("location")
                val details = data.optJSONObject("details")
                val lat = loc?.optDouble("latitude", _uiState.value.techLatitude) ?: _uiState.value.techLatitude
                val lng = loc?.optDouble("longitude", _uiState.value.techLongitude) ?: _uiState.value.techLongitude
                val dLat = _uiState.value.destLatitude
                val dLng = _uiState.value.destLongitude

                val realDist = if (lat != 0.0 && dLat != 0.0) {
                    com.ghartak.customer.util.IndianPincodeResolver.calculateHaversineDistanceKm(lat, lng, dLat, dLng)
                } else {
                    details?.optDouble("distanceRemainingKm", _uiState.value.distanceKm) ?: _uiState.value.distanceKm
                }
                val rawDist = Math.max(0.0, Math.round(realDist * 100.0) / 100.0)
                val arrived = (details?.optBoolean("isDoorstepNearby", false) ?: false) || rawDist <= 0.05
                val roundedDist = if (arrived) 0.0 else rawDist
                val calcEta = if (arrived) 0 else com.ghartak.customer.util.IndianPincodeResolver.calculateEtaMinutes(roundedDist)

                val techArea = com.ghartak.customer.util.IndianPincodeResolver.resolveAreaFromCoordinates(lat, lng)
                val destArea = _uiState.value.destAreaName.ifEmpty {
                    com.ghartak.customer.util.IndianPincodeResolver.resolveAreaFromCoordinates(dLat, dLng)
                }

                // Issue 20: Dead-reckoning client interpolation: smooth bearing and position animation
                animateTechnicianPosition(lat, lng)

                _uiState.value = _uiState.value.copy(
                    distanceKm = roundedDist,
                    etaMinutes = calcEta,
                    techLatitude = lat,
                    techLongitude = lng,
                    techAreaName = techArea,
                    destAreaName = destArea,
                    isDoorstepArrived = arrived || _uiState.value.isDoorstepArrived,
                    status = if (arrived) "ARRIVED" else "EN_ROUTE"
                )
            }

            "TECH_ARRIVED" -> {
                sessionManager.setActiveJobStatus("ARRIVED")
                _uiState.value = _uiState.value.copy(
                    status = "ARRIVED",
                    distanceKm = 0.0,
                    etaMinutes = 0,
                    isDoorstepArrived = true
                )
            }

            "SAFETY_INTERLOCK_VERIFIED" -> {
                sessionManager.setActiveJobStatus("IN_PROGRESS")
                _uiState.value = _uiState.value.copy(
                    status = "IN_PROGRESS",
                    isSafetyInterlockVerified = true
                )
            }

            "JOB_COMPLETED" -> {
                sessionManager.setActiveJobStatus("COMPLETED")
                _uiState.value = _uiState.value.copy(
                    status = "COMPLETED",
                    isJobCompleted = true
                )
            }
        }
    }

    /**
     * Issue 20: Dead-Reckoning Client Interpolation (Urban Company / Uber standard)
     * Smoothly interpolates coordinates and calculates heading bearing over 1080ms
     * to eliminate marker jumps and freezing when GPS packets arrive or during fallback polling.
     */
    private fun animateTechnicianPosition(targetLat: Double, targetLng: Double) {
        if (targetLat == 0.0 || targetLng == 0.0) return

        val startLat = if (_uiState.value.animatedTechLat != 0.0) _uiState.value.animatedTechLat else targetLat
        val startLng = if (_uiState.value.animatedTechLng != 0.0) _uiState.value.animatedTechLng else targetLng

        val bearing = calculateSphericalBearing(startLat, startLng, targetLat, targetLng)

        interpolationJob?.cancel()
        interpolationJob = viewModelScope.launch {
            val totalSteps = 24
            val stepDelayMs = 45L // ~1080ms total animation duration

            for (step in 1..totalSteps) {
                val t = step.toDouble() / totalSteps
                // Smooth easeOutQuad
                val easeT = t * (2 - t)
                val lerpLat = startLat + (targetLat - startLat) * easeT
                val lerpLng = startLng + (targetLng - startLng) * easeT

                _uiState.value = _uiState.value.copy(
                    animatedTechLat = lerpLat,
                    animatedTechLng = lerpLng,
                    headingDegrees = bearing.toFloat()
                )
                delay(stepDelayMs)
            }

            _uiState.value = _uiState.value.copy(
                animatedTechLat = targetLat,
                animatedTechLng = targetLng,
                techLatitude = targetLat,
                techLongitude = targetLng,
                headingDegrees = bearing.toFloat()
            )
        }
    }

    private fun calculateSphericalBearing(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        if (lat1 == lat2 && lon1 == lon2) return _uiState.value.headingDegrees.toDouble()
        val phi1 = Math.toRadians(lat1)
        val phi2 = Math.toRadians(lat2)
        val deltaLambda = Math.toRadians(lon2 - lon1)
        val y = Math.sin(deltaLambda) * Math.cos(phi2)
        val x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)
        val theta = Math.atan2(y, x)
        return (Math.toDegrees(theta) + 360.0) % 360.0
    }

    fun dismissCancelledBooking() {
        sessionManager.clearActiveJob()
        _uiState.value = _uiState.value.copy(status = "CANCELLED")
    }

    fun cancelBooking(context: Context, onCompleted: () -> Unit = {}) {
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(context)
                api.cancelJob(_uiState.value.jobId)
            } catch (e: Exception) {
                Log.w("GTS_CUST_TRACK", "Cancel error: ${e.message}")
            } finally {
                sessionManager.clearActiveJob()
                _uiState.value = _uiState.value.copy(status = "CANCELLED")
                onCompleted()
            }
        }
    }

    fun triggerEmergencySos(context: Context, reason: String = "CUSTOMER_EMERGENCY_SOS_TRIGGERED") {
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(context)
                val currentState = _uiState.value
                val customerPhone = sessionManager.getPhone()
                val customerName = sessionManager.getFullName().ifBlank { "Ghar Tak Customer" }
                val payload: Map<String, Any> = mapOf(
                    "role" to "CUSTOMER",
                    "customerId" to sessionManager.getCustomerId(),
                    "customerName" to customerName,
                    "phone" to customerPhone,
                    "jobId" to currentState.jobId,
                    "ticketNumber" to currentState.ticketNumber,
                    "technicianName" to currentState.technicianName,
                    "latitude" to currentState.destLatitude,
                    "longitude" to currentState.destLongitude,
                    "reason" to reason
                )
                api.broadcastEmergencySos(payload)
                Log.d("GTS_CUST_TRACK", "Customer Emergency SOS successfully dispatched to Safety Command Center")
            } catch (e: Exception) {
                Log.w("GTS_CUST_TRACK", "Customer Emergency SOS broadcast warning: ${e.message}")
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        interpolationJob?.cancel()
        telemetryPollingJob?.cancel()
        realtimeStreamManager.disconnect()
    }
}

private data class Tuple4<A, B, C, D>(val a: A, val b: B, val c: C, val d: D)
