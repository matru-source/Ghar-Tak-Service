package com.ghartak.technician.ui.dashboard

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.model.TechnicianProfile
import com.ghartak.technician.data.realtime.RealtimeStreamManager
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardUiState(
    val profile: TechnicianProfile? = null,
    val isOnline: Boolean = true,
    val isUpdatingStatus: Boolean = false,
    val todayEarningsInr: Double = 2450.0,
    val commissionSharePct: Int = 70,
    val jobsCompletedCount: Int = 4,
    val customerRating: Float = 4.9f,
    val assignedJobs: List<TechnicianJob> = emptyList(),
    val incomingDispatchAlert: TechnicianJob? = null,
    val isLoadingJobs: Boolean = false,
    val serverConnectionStatus: String = "CONNECTED TO HOST (3000)",
    val errorMessage: String? = null
)

class TechnicianDashboardViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val realtimeStreamManager = RealtimeStreamManager()

    init {
        loadProfileFromSession()
    }

    fun loadProfileFromSession() {
        val techId = sessionManager.getTechnicianId()
        val badge = sessionManager.getBadgeNumber()
        val name = sessionManager.getFullName()
        val phone = sessionManager.getPhone()
        val partnerId = sessionManager.getPartnerId()
        val pincode = sessionManager.getPincode()
        val isOnline = sessionManager.isOnline()
        val rating = sessionManager.getRating().toDouble()
        val glovesVerified = sessionManager.isGlovesVerified()

        val profile = TechnicianProfile(
            id = techId,
            badgeNumber = badge,
            fullName = name,
            phone = phone,
            partnerId = partnerId,
            assignedPincode = pincode,
            isOnline = isOnline,
            rating = rating,
            safetyKitSerial = "VDE-1000V-99214",
            insulatedGlovesVerified = glovesVerified,
            totalJobsCompleted = 48
        )

        _uiState.value = _uiState.value.copy(
            profile = profile,
            isOnline = isOnline,
            customerRating = rating.toFloat(),
            assignedJobs = getInitialMockJobs()
        )
    }

    private fun getInitialMockJobs(): List<TechnicianJob> {
        return listOf(
            TechnicianJob(
                id = "job_mh_live_01",
                jobTicketNumber = "GTS-MH-9821",
                serviceTitle = "Full Home MCB Panel Replacement & Earth Leakage Fix",
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
                handoverOtp = "4819",
                scheduledAt = "Today, 11:30 AM",
                createdAt = "10 mins ago"
            ),
            TechnicianJob(
                id = "job_mh_live_02",
                jobTicketNumber = "GTS-MH-9818",
                serviceTitle = "Inverter Backup Bypass & Heavy Load Rewiring",
                pincode = "400001",
                customerName = "Pooja Mehta",
                customerPhone = "+919833445566",
                customerAddressText = "Bungalow 7, Cuffe Parade, Mumbai",
                customerLatitude = 18.9145,
                customerLongitude = 72.8211,
                status = "IN_PROGRESS",
                priority = "NORMAL",
                totalAmountInr = 1850.0,
                safetyGlovesConfirmed = true,
                safetyMcbSwitchConfirmed = true,
                handoverOtp = "9201",
                scheduledAt = "Today, 02:00 PM",
                createdAt = "1 hour ago"
            )
        )
    }

    fun toggleDutyStatus(context: Context) {
        val currentStatus = _uiState.value.isOnline
        val newStatus = !currentStatus

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUpdatingStatus = true)

            try {
                val api = ApiClient.getService(context)
                val techId = sessionManager.getTechnicianId()
                val response = api.updateAvailability(techId, mapOf("isOnline" to newStatus))

                sessionManager.setOnline(newStatus)
                _uiState.value = _uiState.value.copy(
                    isOnline = newStatus,
                    isUpdatingStatus = false
                )
            } catch (e: Exception) {
                // If offline or emulator without backend running yet, update local state smoothly
                sessionManager.setOnline(newStatus)
                _uiState.value = _uiState.value.copy(
                    isOnline = newStatus,
                    isUpdatingStatus = false
                )
                Log.w("GTS_TECH", "Local duty state toggled to $newStatus: ${e.message}")
            }
        }
    }

    fun connectRealtimeBus(context: Context) {
        val techId = sessionManager.getTechnicianId()
        realtimeStreamManager.connect(techId) { eventType, data ->
            Log.d("GTS_TECH_EVENT", "Received: $eventType - $data")
            if (eventType == "TECH_DISPATCHED" || eventType == "JOB_CREATED") {
                val jobId = data.optString("jobId", "job_mh_${System.currentTimeMillis() % 1000}")
                val inboundJob = TechnicianJob(
                    id = jobId,
                    jobTicketNumber = "GTS-MH-" + (1000..9999).random(),
                    serviceTitle = data.optString("serviceTitle", "Emergency Electrical Panel Diagnostic"),
                    pincode = sessionManager.getPincode(),
                    customerName = data.optString("customerName", "Customer"),
                    customerPhone = data.optString("customerPhone", "+919876543210"),
                    customerAddressText = data.optString("customerAddress", "Service Location"),
                    customerLatitude = 19.0607,
                    customerLongitude = 72.8267,
                    status = "DISPATCHED",
                    priority = "CRITICAL_SAFETY",
                    totalAmountInr = 1499.0,
                    safetyGlovesConfirmed = false,
                    safetyMcbSwitchConfirmed = false,
                    handoverOtp = "3829"
                )
                _uiState.value = _uiState.value.copy(incomingDispatchAlert = inboundJob)
            }
        }
    }

    fun dismissIncomingDispatch() {
        _uiState.value = _uiState.value.copy(incomingDispatchAlert = null)
    }

    fun acceptIncomingDispatch(job: TechnicianJob) {
        val updatedList = _uiState.value.assignedJobs.toMutableList()
        val accepted = job.copy(status = "ASSIGNED")
        updatedList.add(0, accepted)
        _uiState.value = _uiState.value.copy(
            assignedJobs = updatedList,
            incomingDispatchAlert = null
        )
    }

    fun logout() {
        sessionManager.clearSession()
        realtimeStreamManager.disconnect()
    }

    override fun onCleared() {
        super.onCleared()
        realtimeStreamManager.disconnect()
    }
}
