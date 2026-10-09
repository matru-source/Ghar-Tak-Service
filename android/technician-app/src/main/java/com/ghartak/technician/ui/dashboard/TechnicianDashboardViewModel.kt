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

data class InboundJobNotification(
    val id: String,
    val jobTicketNumber: String,
    val serviceTitle: String,
    val scheduledTime: String,
    val pincode: String,
    val customerName: String,
    val customerPhone: String,
    val customerAddress: String,
    val amountInr: Double,
    val commissionInr: Double,
    val iconType: String = "FAN"
)

data class EarningsTransaction(
    val id: String,
    val jobTicketNumber: String,
    val serviceTitle: String,
    val completedTime: String,
    val amountInr: Double,
    val isPending: Boolean = false
)

data class DashboardUiState(
    val currentTab: String = "HOME", // "HOME", "JOBS", "EARNINGS", "PROFILE", "JOB_DETAILS"
    val profile: TechnicianProfile? = null,
    val isOnline: Boolean = true,
    val isUpdatingStatus: Boolean = false,
    val todayEarningsInr: Double = 1250.0,
    val weekEarningsInr: Double = 8400.0,
    val monthEarningsInr: Double = 32500.0,
    val availableWithdrawalInr: Double = 12000.0,
    val jobsTodayCount: Int = 4,
    val jobsCompletedCount: Int = 2,
    val jobsPendingCount: Int = 2,
    val customerRating: Float = 4.9f,
    val selectedEarningsFilter: String = "THIS_MONTH", // "TODAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME"
    val newJobNotifications: List<InboundJobNotification> = listOf(
        InboundJobNotification(
            id = "J-1005",
            jobTicketNumber = "#J-1005",
            serviceTitle = "Fan Installation",
            scheduledTime = "10:30 AM",
            pincode = "400001",
            customerName = "Amit Sharma",
            customerPhone = "+91 98765 43210",
            customerAddress = "123, Main Street, Mumbai",
            amountInr = 1250.0,
            commissionInr = 750.0,
            iconType = "FAN"
        ),
        InboundJobNotification(
            id = "J-1006",
            jobTicketNumber = "#J-1006",
            serviceTitle = "AC Installation",
            scheduledTime = "2:00 PM",
            pincode = "400002",
            customerName = "Pooja Mehta",
            customerPhone = "+91 98765 54321",
            customerAddress = "88, Marine Drive, Mumbai",
            amountInr = 2000.0,
            commissionInr = 1200.0,
            iconType = "AC"
        )
    ),
    val assignedJobs: List<TechnicianJob> = emptyList(),
    val selectedJob: TechnicianJob? = null,
    val recentTransactions: List<EarningsTransaction> = listOf(
        EarningsTransaction(
            id = "tx_1",
            jobTicketNumber = "#J-1003",
            serviceTitle = "Light Repair",
            completedTime = "Completed Today at 09:30 AM",
            amountInr = 750.0,
            isPending = false
        ),
        EarningsTransaction(
            id = "tx_2",
            jobTicketNumber = "#J-1005",
            serviceTitle = "Fan Installation",
            completedTime = "Pending Completion",
            amountInr = 500.0,
            isPending = true
        ),
        EarningsTransaction(
            id = "tx_3",
            jobTicketNumber = "#J-1000",
            serviceTitle = "AC Repair",
            completedTime = "Completed Yesterday at 04:00 PM",
            amountInr = 1200.0,
            isPending = false
        ),
        EarningsTransaction(
            id = "tx_4",
            jobTicketNumber = "#J-0998",
            serviceTitle = "Wiring Fix",
            completedTime = "Completed 2 days ago at 11:00 AM",
            amountInr = 900.0,
            isPending = false
        )
    ),
    val incomingDispatchAlert: TechnicianJob? = null,
    val isWithdrawing: Boolean = false,
    val withdrawSuccessMessage: String? = null,
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

    fun selectTab(tab: String) {
        _uiState.value = _uiState.value.copy(currentTab = tab, withdrawSuccessMessage = null)
    }

    fun viewJobDetails(job: TechnicianJob) {
        _uiState.value = _uiState.value.copy(selectedJob = job, currentTab = "JOB_DETAILS")
    }

    fun closeJobDetails() {
        _uiState.value = _uiState.value.copy(currentTab = "HOME")
    }

    fun acceptNotificationJob(notificationId: String) {
        val notif = _uiState.value.newJobNotifications.find { it.id == notificationId }
        if (notif != null) {
            val newActiveJob = TechnicianJob(
                id = "job_${notif.id.lowercase()}",
                jobTicketNumber = notif.jobTicketNumber,
                serviceTitle = notif.serviceTitle,
                pincode = notif.pincode,
                customerName = notif.customerName,
                customerPhone = notif.customerPhone,
                customerAddressText = notif.customerAddress,
                customerLatitude = 18.9220,
                customerLongitude = 72.8347,
                status = "EN_ROUTE",
                priority = "NORMAL",
                totalAmountInr = notif.amountInr,
                safetyGlovesConfirmed = false,
                safetyMcbSwitchConfirmed = false,
                handoverOtp = "4819",
                scheduledAt = "${notif.serviceTitle} | ${notif.scheduledTime}",
                createdAt = "Just now"
            )

            val updatedNotifs = _uiState.value.newJobNotifications.filter { it.id != notificationId }
            val updatedJobs = _uiState.value.assignedJobs.toMutableList().apply { add(0, newActiveJob) }

            _uiState.value = _uiState.value.copy(
                newJobNotifications = updatedNotifs,
                assignedJobs = updatedJobs,
                selectedJob = newActiveJob,
                currentTab = "JOB_DETAILS"
            )
        }
    }

    fun rejectNotificationJob(notificationId: String) {
        val updatedNotifs = _uiState.value.newJobNotifications.filter { it.id != notificationId }
        _uiState.value = _uiState.value.copy(newJobNotifications = updatedNotifs)
    }

    fun setEarningsFilter(filter: String) {
        _uiState.value = _uiState.value.copy(selectedEarningsFilter = filter)
    }

    fun withdrawEarnings() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isWithdrawing = true)
            kotlinx.coroutines.delay(800)
            _uiState.value = _uiState.value.copy(
                isWithdrawing = false,
                withdrawSuccessMessage = "₹${"%,.0f".format(_uiState.value.availableWithdrawalInr)} payout initiated via UPI to verified bank account."
            )
        }
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
                id = "job_1003",
                jobTicketNumber = "#J-1003",
                serviceTitle = "Light Repair",
                pincode = "400001",
                customerName = "Suresh Patel",
                customerPhone = "+91 98765 43210",
                customerAddressText = "123, Main Street, Mumbai",
                customerLatitude = 18.9220,
                customerLongitude = 72.8347,
                status = "STARTED",
                priority = "NORMAL",
                totalAmountInr = 1250.0,
                safetyGlovesConfirmed = true,
                safetyMcbSwitchConfirmed = true,
                handoverOtp = "4819",
                scheduledAt = "In Progress | 45 mins left",
                createdAt = "15 mins ago"
            ),
            TechnicianJob(
                id = "job_1001",
                jobTicketNumber = "#J-1001",
                serviceTitle = "Fan Installation",
                pincode = "400001",
                customerName = "Amit Sharma",
                customerPhone = "+91 98765 43210",
                customerAddressText = "45, Park Avenue, Mumbai",
                customerLatitude = 18.9145,
                customerLongitude = 72.8211,
                status = "EN_ROUTE",
                priority = "NORMAL",
                totalAmountInr = 1250.0,
                safetyGlovesConfirmed = false,
                safetyMcbSwitchConfirmed = false,
                handoverOtp = "4819",
                scheduledAt = "En Route | 10 mins away",
                createdAt = "5 mins ago"
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
                api.updateAvailability(techId, mapOf("isOnline" to newStatus))

                sessionManager.setOnline(newStatus)
                _uiState.value = _uiState.value.copy(
                    isOnline = newStatus,
                    isUpdatingStatus = false
                )
            } catch (e: Exception) {
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
            selectedJob = accepted,
            incomingDispatchAlert = null,
            currentTab = "JOB_DETAILS"
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
