package com.ghartak.customer.ui.track

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.realtime.RealtimeStreamManager
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject

data class CustomerTrackingUiState(
    val jobId: String = "job_mh_live_01",
    val ticketNumber: String = "GTS-MH-9821",
    val serviceTitle: String = "Full Home MCB Panel Replacement & Earth Leakage Fix",
    val status: String = "EN_ROUTE",
    val technicianName: String = "Rajesh Kumar",
    val technicianPhone: String = "+91 98201 44091",
    val technicianBadge: String = "GTS-TECH-4091",
    val technicianRating: Double = 4.9,
    val technicianCompletedJobs: String = "240+ jobs",
    val handoverOtp: String = "4819",
    val distanceKm: Double = 1.3,
    val etaMinutes: Int = 8,
    val isDoorstepArrived: Boolean = false,
    val isSafetyInterlockVerified: Boolean = false,
    val isJobCompleted: Boolean = false,
    val transitStep: Int = 0,
    val techLatitude: Double = 18.9220,
    val techLongitude: Double = 72.8347,
    val destLatitude: Double = 18.9067,
    val destLongitude: Double = 72.8147
)

class CustomerTrackingViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(CustomerTrackingUiState())
    val uiState: StateFlow<CustomerTrackingUiState> = _uiState.asStateFlow()

    private val realtimeStreamManager = RealtimeStreamManager()

    fun initTracking(jobId: String) {
        _uiState.value = _uiState.value.copy(jobId = jobId)

        // Connect to Central Real-Time SSE Bus
        val customerId = sessionManager.getUserId()
        realtimeStreamManager.connect(customerId, jobId) { eventType, data ->
            handleRealtimeEvent(eventType, data)
        }
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
            "TECH_LOCATION_UPDATE" -> {
                val loc = data.optJSONObject("location")
                val details = data.optJSONObject("details")
                val dist = details?.optDouble("distanceRemainingKm", _uiState.value.distanceKm) ?: _uiState.value.distanceKm
                val eta = loc?.optInt("etaMinutes", _uiState.value.etaMinutes) ?: _uiState.value.etaMinutes
                val lat = loc?.optDouble("latitude", _uiState.value.techLatitude) ?: _uiState.value.techLatitude
                val lng = loc?.optDouble("longitude", _uiState.value.techLongitude) ?: _uiState.value.techLongitude
                val arrived = details?.optBoolean("isDoorstepNearby", false) ?: false

                _uiState.value = _uiState.value.copy(
                    distanceKm = dist,
                    etaMinutes = eta,
                    techLatitude = lat,
                    techLongitude = lng,
                    isDoorstepArrived = arrived || _uiState.value.isDoorstepArrived,
                    status = if (arrived) "ARRIVED" else "EN_ROUTE"
                )
            }

            "TECH_ARRIVED" -> {
                _uiState.value = _uiState.value.copy(
                    status = "ARRIVED",
                    distanceKm = 0.03,
                    etaMinutes = 0,
                    isDoorstepArrived = true
                )
            }

            "SAFETY_INTERLOCK_VERIFIED" -> {
                _uiState.value = _uiState.value.copy(
                    status = "IN_PROGRESS",
                    isSafetyInterlockVerified = true
                )
            }

            "JOB_COMPLETED" -> {
                _uiState.value = _uiState.value.copy(
                    status = "COMPLETED",
                    isJobCompleted = true
                )
            }
        }
    }

    /**
     * Staging Demo Transit Simulation:
     * Step 0: 1.4 km (6 mins) -> Step 1: 0.85 km (3 mins) -> Step 2: 0.28 km (1 min) -> Step 3: 30m Doorstep Arrived
     */
    fun simulateStepCloser() {
        val nextStep = (_uiState.value.transitStep + 1).coerceAtMost(3)

        val (dist, eta, status, arrived) = when (nextStep) {
            1 -> Tuple4(0.85, 3, "EN_ROUTE", false)
            2 -> Tuple4(0.28, 1, "EN_ROUTE", false)
            3 -> Tuple4(0.03, 0, "ARRIVED", true)
            else -> Tuple4(1.4, 6, "EN_ROUTE", false)
        }

        _uiState.value = _uiState.value.copy(
            transitStep = nextStep,
            distanceKm = dist,
            etaMinutes = eta,
            status = status,
            isDoorstepArrived = arrived
        )
    }

    fun simulateSafetyVerified() {
        _uiState.value = _uiState.value.copy(
            status = "IN_PROGRESS",
            isSafetyInterlockVerified = true
        )
    }

    override fun onCleared() {
        super.onCleared()
        realtimeStreamManager.disconnect()
    }
}

private data class Tuple4<A, B, C, D>(val a: A, val b: B, val c: C, val d: D)
