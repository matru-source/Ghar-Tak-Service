package com.ghartak.technician.ui.dashboard

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.DispatchActionRequest
import com.ghartak.technician.data.model.RegisterTechnicianRequest
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.model.TechnicianProfile
import com.ghartak.technician.data.realtime.RealtimeStreamManager
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
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
    val isPending: Boolean = false,
    val periodScope: Set<String> = setOf("TODAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME")
)

data class DashboardUiState(
    val currentTab: String = "HOME", // "HOME", "JOBS", "EARNINGS", "PROFILE", "JOB_DETAILS"
    val profile: TechnicianProfile? = null,
    val isOnline: Boolean = true,
    val isUpdatingStatus: Boolean = false,
    val todayEarningsInr: Double = 0.0,
    val weekEarningsInr: Double = 0.0,
    val monthEarningsInr: Double = 0.0,
    val allTimeEarningsInr: Double = 0.0,
    val availableWithdrawalInr: Double = 0.0,
    val jobsTodayCount: Int = 0,
    val jobsCompletedCount: Int = 0,
    val jobsPendingCount: Int = 0,
    val customerRating: Float = 5.0f,
    val selectedEarningsFilter: String = "TODAY", // "TODAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME"
    val newJobNotifications: List<InboundJobNotification> = emptyList(),
    val assignedJobs: List<TechnicianJob> = emptyList(),
    val selectedJob: TechnicianJob? = null,
    val recentTransactions: List<EarningsTransaction> = emptyList(),
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

    private fun matchesJob(id1: String, ticket1: String, id2: String, ticket2: String): Boolean {
        val cleanId1 = id1.trim().lowercase().removePrefix("job_")
        val cleanId2 = id2.trim().lowercase().removePrefix("job_")
        val cleanTicket1 = ticket1.trim().lowercase().removePrefix("#")
        val cleanTicket2 = ticket2.trim().lowercase().removePrefix("#")
        return cleanId1 == cleanId2 || cleanTicket1 == cleanTicket2 || cleanId1 == cleanTicket2 || cleanTicket1 == cleanId2
    }

    fun acceptNotificationJob(notificationId: String) {
        val notif = _uiState.value.newJobNotifications.find { it.id == notificationId }
        if (notif != null) {
            val newActiveJob = TechnicianJob(
                id = notif.id,
                jobTicketNumber = notif.jobTicketNumber,
                serviceTitle = notif.serviceTitle,
                pincode = notif.pincode,
                customerName = notif.customerName,
                customerPhone = notif.customerPhone,
                customerAddressText = notif.customerAddress,
                customerLatitude = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(notif.pincode).first,
                customerLongitude = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(notif.pincode).second,
                status = "EN_ROUTE",
                priority = "NORMAL",
                totalAmountInr = notif.amountInr,
                safetyGlovesConfirmed = false,
                safetyMcbSwitchConfirmed = false,
                handoverOtp = "",
                scheduledAt = "${notif.serviceTitle} | ${notif.scheduledTime}",
                createdAt = "Just now"
            )

            val updatedNotifs = _uiState.value.newJobNotifications.filter { it.id != notificationId && !matchesJob(it.id, it.jobTicketNumber, notif.id, notif.jobTicketNumber) }
            val updatedJobs = _uiState.value.assignedJobs
                .filter { !matchesJob(it.id, it.jobTicketNumber, notif.id, notif.jobTicketNumber) }
                .toMutableList().apply { add(0, newActiveJob) }

            _uiState.value = _uiState.value.copy(
                newJobNotifications = updatedNotifs,
                assignedJobs = updatedJobs,
                selectedJob = newActiveJob,
                currentTab = "JOB_DETAILS"
            )

            // Broadcast real ACCEPT response to backend
            viewModelScope.launch {
                try {
                    val api = ApiClient.getService(sessionManager.context)
                    val techId = sessionManager.getTechnicianId()
                    api.respondToDispatch(
                        jobId = notif.id,
                        request = DispatchActionRequest(
                            technicianId = techId,
                            action = "ACCEPT"
                        )
                    )
                    Log.d("GTS_TECH", "Dispatched ACCEPT event for job ${notif.id} successfully")
                } catch (e: Exception) {
                    Log.w("GTS_TECH", "Error broadcasting dispatch acceptance: ${e.message}")
                }
            }
        }
    }

    fun rejectNotificationJob(notificationId: String) {
        val notif = _uiState.value.newJobNotifications.find { it.id == notificationId }
        val updatedNotifs = _uiState.value.newJobNotifications.filter {
            it.id != notificationId && (notif == null || !matchesJob(it.id, it.jobTicketNumber, notif.id, notif.jobTicketNumber))
        }
        val updatedJobs = _uiState.value.assignedJobs.filter {
            if (notif != null) !matchesJob(it.id, it.jobTicketNumber, notif.id, notif.jobTicketNumber) else it.id != notificationId
        }
        _uiState.value = _uiState.value.copy(
            newJobNotifications = updatedNotifs,
            assignedJobs = updatedJobs
        )

        // Broadcast real REJECT response to backend
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val techId = sessionManager.getTechnicianId()
                api.respondToDispatch(
                    jobId = notificationId,
                    request = DispatchActionRequest(
                        technicianId = techId,
                        action = "REJECT",
                        rejectionReason = "Technician unavailable / declined"
                    )
                )
                Log.d("GTS_TECH", "Dispatched REJECT event for job $notificationId successfully")
            } catch (e: Exception) {
                Log.w("GTS_TECH", "Error broadcasting dispatch rejection: ${e.message}")
            }
        }
    }

    fun setEarningsFilter(filter: String) {
        _uiState.value = _uiState.value.copy(selectedEarningsFilter = filter)
    }

    fun withdrawEarnings() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isWithdrawing = true)
            kotlinx.coroutines.delay(800)
            val withdrawnAmount = _uiState.value.availableWithdrawalInr
            _uiState.value = _uiState.value.copy(
                isWithdrawing = false,
                availableWithdrawalInr = 0.0,
                withdrawSuccessMessage = "₹${"%,.0f".format(withdrawnAmount)} payout initiated via UPI to verified bank account."
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
        val email = sessionManager.getEmail()
        val location = sessionManager.getLocation()
        val languages = sessionManager.getLanguages()
        val specialization = sessionManager.getSpecialization()
        val experience = sessionManager.getExperience()
        val license = sessionManager.getLicense()
        val serviceArea = sessionManager.getServiceArea()

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
            totalJobsCompleted = sessionManager.getTotalJobsCompleted(),
            email = email,
            location = location,
            languages = languages,
            specialization = specialization,
            experience = experience,
            license = license,
            serviceArea = serviceArea
        )

        val completed = sessionManager.getTotalJobsCompleted()
        val todayE = sessionManager.getTodayEarnings()
        val weekE = sessionManager.getWeekEarnings()
        val monthE = sessionManager.getMonthEarnings()

        _uiState.value = _uiState.value.copy(
            profile = profile,
            isOnline = isOnline,
            customerRating = rating.toFloat(),
            jobsCompletedCount = completed,
            todayEarningsInr = todayE,
            weekEarningsInr = weekE,
            monthEarningsInr = monthE,
            allTimeEarningsInr = monthE,
            availableWithdrawalInr = monthE,
            assignedJobs = _uiState.value.assignedJobs
        )
        syncProfileToServer()
    }

    fun syncProfileToServer() {
        viewModelScope.launch {
            try {
                val pin = sessionManager.getPincode().ifEmpty {
                    Regex("\\b\\d{6}\\b").find(sessionManager.getServiceArea())?.value ?: "760001"
                }
                val techId = sessionManager.getTechnicianId()
                val api = ApiClient.getService(sessionManager.context)
                val req = RegisterTechnicianRequest(
                    id = techId.ifEmpty { null },
                    badgeNumber = sessionManager.getBadgeNumber().ifEmpty { null },
                    fullName = sessionManager.getFullName(),
                    phone = sessionManager.getPhone().ifEmpty { "+91 9876543210" },
                    email = sessionManager.getEmail().ifEmpty { null },
                    trade = sessionManager.getSpecialization(),
                    pincode = pin
                )
                val res = api.registerTechnician(req)
                if (res.isSuccessful && techId.isNotEmpty()) {
                    api.updateAvailability(techId, mapOf("isOnline" to sessionManager.isOnline()))
                }
                Log.d("TechnicianSync", "Synced profile for $techId ($pin - ${sessionManager.getSpecialization()}) to server: ${res.isSuccessful}")
            } catch (e: Exception) {
                Log.w("TechnicianSync", "Failed to sync technician profile to server: ${e.message}")
            }
        }
    }

    fun updatePersonalInfo(name: String, phone: String, email: String, location: String, languages: String) {
        sessionManager.updatePersonalInfo(name, phone, email, location, languages)
        val current = _uiState.value.profile
        if (current != null) {
            _uiState.value = _uiState.value.copy(
                profile = current.copy(
                    fullName = name,
                    phone = phone,
                    email = email,
                    location = location,
                    languages = languages,
                    assignedPincode = sessionManager.getPincode()
                )
            )
        }
        syncProfileToServer()
    }

    fun updateServiceDetails(specialization: String, experience: String, license: String, serviceArea: String) {
        sessionManager.updateServiceDetails(specialization, experience, license, serviceArea)
        val current = _uiState.value.profile
        if (current != null) {
            _uiState.value = _uiState.value.copy(
                profile = current.copy(
                    specialization = specialization,
                    experience = experience,
                    license = license,
                    serviceArea = serviceArea,
                    assignedPincode = sessionManager.getPincode()
                )
            )
        }
        syncProfileToServer()
    }

    fun markJobStarted(jobId: String) {
        val updatedJobs = _uiState.value.assignedJobs.map { job ->
            if (job.id.equals(jobId, ignoreCase = true) || job.jobTicketNumber.equals(jobId, ignoreCase = true) || jobId.contains(job.id, ignoreCase = true)) {
                job.copy(
                    status = "STARTED",
                    safetyGlovesConfirmed = true,
                    safetyMcbSwitchConfirmed = true
                )
            } else {
                job
            }
        }
        val currentSelected = _uiState.value.selectedJob
        val updatedSelected = updatedJobs.find {
            it.id.equals(jobId, ignoreCase = true) || it.jobTicketNumber.equals(jobId, ignoreCase = true) || jobId.contains(it.id, ignoreCase = true)
        } ?: currentSelected?.copy(
            status = "STARTED",
            safetyGlovesConfirmed = true,
            safetyMcbSwitchConfirmed = true
        )
        _uiState.value = _uiState.value.copy(
            assignedJobs = updatedJobs,
            selectedJob = updatedSelected,
            currentTab = "JOB_DETAILS"
        )
    }

    fun markJobCompleted(jobId: String, payoutInr: Double = 1400.0) {
        val updatedJobs = _uiState.value.assignedJobs.map { job ->
            if (job.id.equals(jobId, ignoreCase = true) || job.jobTicketNumber.equals(jobId, ignoreCase = true) || jobId.contains(job.id, ignoreCase = true)) {
                job.copy(status = "COMPLETED")
            } else {
                job
            }
        }
        val completedJob = updatedJobs.find {
            it.id.equals(jobId, ignoreCase = true) || it.jobTicketNumber.equals(jobId, ignoreCase = true) || jobId.contains(it.id, ignoreCase = true)
        } ?: _uiState.value.selectedJob

        val finalPayout = if (completedJob != null && completedJob.totalAmountInr > 0) completedJob.totalAmountInr * 0.7 else payoutInr
        val ticket = completedJob?.jobTicketNumber ?: "#J-1006"
        val service = completedJob?.serviceTitle ?: "AC Installation"

        sessionManager.addEarnings(finalPayout)

        val newTx = EarningsTransaction(
            id = "tx_${System.currentTimeMillis()}",
            jobTicketNumber = ticket,
            serviceTitle = service,
            completedTime = "Completed just now",
            amountInr = finalPayout,
            isPending = false,
            periodScope = setOf("TODAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME")
        )

        _uiState.value = _uiState.value.copy(
            assignedJobs = updatedJobs,
            selectedJob = completedJob?.copy(status = "COMPLETED"),
            todayEarningsInr = _uiState.value.todayEarningsInr + finalPayout,
            weekEarningsInr = _uiState.value.weekEarningsInr + finalPayout,
            monthEarningsInr = _uiState.value.monthEarningsInr + finalPayout,
            allTimeEarningsInr = _uiState.value.allTimeEarningsInr + finalPayout,
            availableWithdrawalInr = _uiState.value.availableWithdrawalInr + finalPayout,
            jobsCompletedCount = _uiState.value.jobsCompletedCount + 1,
            jobsPendingCount = maxOf(0, _uiState.value.jobsPendingCount - 1),
            recentTransactions = listOf(newTx) + _uiState.value.recentTransactions,
            currentTab = "HOME"
        )
    }

    private fun getInitialMockJobs(): List<TechnicianJob> {
        return emptyList()
    }

    fun toggleDutyStatus(context: Context) {
        val currentStatus = _uiState.value.isOnline
        val newStatus = !currentStatus

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isUpdatingStatus = true)

            try {
                val api = ApiClient.getService(context)
                val techId = sessionManager.getTechnicianId()
                val resp = api.updateAvailability(techId, mapOf("isOnline" to newStatus))

                sessionManager.setOnline(newStatus)
                _uiState.value = _uiState.value.copy(
                    isOnline = newStatus,
                    isUpdatingStatus = false
                )

                if (newStatus || !resp.isSuccessful) {
                    syncProfileToServer()
                }
            } catch (e: Exception) {
                sessionManager.setOnline(newStatus)
                _uiState.value = _uiState.value.copy(
                    isOnline = newStatus,
                    isUpdatingStatus = false
                )
                if (newStatus) {
                    syncProfileToServer()
                }
                Log.w("GTS_TECH", "Local duty state toggled to $newStatus: ${e.message}")
            }
        }
    }

    private val incomingJobsCache = java.util.concurrent.ConcurrentHashMap<String, TechnicianJob>()

    fun getJobById(jobId: String): TechnicianJob? {
        return _uiState.value.assignedJobs.find { it.id == jobId || it.jobTicketNumber == jobId }
            ?: _uiState.value.incomingDispatchAlert?.takeIf { it.id == jobId || it.jobTicketNumber == jobId }
            ?: incomingJobsCache[jobId]
            ?: incomingJobsCache.values.firstOrNull { it.id == jobId || it.jobTicketNumber == jobId }
    }

    fun cacheIncomingJob(job: TechnicianJob) {
        incomingJobsCache[job.id] = job
        incomingJobsCache[job.jobTicketNumber] = job
    }

    fun pollBackendAssignedJobs(context: Context) {
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(context)
                val techId = sessionManager.getTechnicianId()
                val response = kotlinx.coroutines.withTimeoutOrNull(8000L) {
                    api.getAssignedJobs(technicianId = techId)
                }
                if (response != null && response.isSuccessful && response.body()?.data != null) {
                    val dataMap = response.body()!!.data!!
                    val rawJobs = (dataMap["jobs"] as? List<*>) ?: emptyList<Any>()

                    // 1. Extract real server active jobs (En Route, Arrived, In Progress)
                    val serverActiveJobs = rawJobs.mapNotNull { raw ->
                        val m = raw as? Map<*, *> ?: return@mapNotNull null
                        val status = m["status"]?.toString() ?: ""
                        if (status != "EN_ROUTE" && status != "ARRIVED" && status != "SAFETY_CHECKED" && status != "IN_PROGRESS" && status != "STARTED") return@mapNotNull null
                        val id = m["id"]?.toString() ?: return@mapNotNull null
                        val ticket = m["jobTicketNumber"]?.toString() ?: "#J-${id.takeLast(4)}"
                        val pin = m["pincode"]?.toString() ?: sessionManager.getPincode()
                        val (defaultLat, defaultLng) = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(pin)

                        TechnicianJob(
                            id = id,
                            jobTicketNumber = ticket,
                            serviceTitle = m["serviceTitle"]?.toString() ?: "Doorstep Service",
                            pincode = pin,
                            customerName = m["customerName"]?.toString() ?: "Customer",
                            customerPhone = m["customerPhone"]?.toString() ?: "+91 98765 43210",
                            customerAddressText = m["customerAddressText"]?.toString() ?: "Customer Address",
                            customerLatitude = (m["customerLatitude"] as? Number)?.toDouble() ?: defaultLat,
                            customerLongitude = (m["customerLongitude"] as? Number)?.toDouble() ?: defaultLng,
                            status = status,
                            priority = m["priority"]?.toString() ?: "NORMAL",
                            totalAmountInr = (m["totalAmountInr"] as? Number)?.toDouble() ?: 352.82,
                            safetyGlovesConfirmed = (m["safetyGlovesConfirmed"] as? Boolean) ?: false,
                            safetyMcbSwitchConfirmed = (m["safetyMcbSwitchConfirmed"] as? Boolean) ?: false,
                            handoverOtp = m["handoverOtp"]?.toString() ?: ""
                        )
                    }

                    // Merge active jobs, keeping local status changes if more advanced
                    val mergedActiveJobs = (serverActiveJobs + _uiState.value.assignedJobs)
                        .distinctBy { it.id.trim().lowercase().removePrefix("job_") }
                        .filter { it.status != "COMPLETED" && it.status != "CANCELLED" }

                    // 2. Extract inbound dispatch jobs awaiting acceptance/rejection
                    val activeInbound = rawJobs.mapNotNull { raw ->
                        val m = raw as? Map<*, *> ?: return@mapNotNull null
                        val status = m["status"]?.toString() ?: ""
                        if (status != "PENDING_DISPATCH" && status != "ASSIGNED" && status != "DISPATCHED") return@mapNotNull null
                        val id = m["id"]?.toString() ?: return@mapNotNull null
                        val ticket = m["jobTicketNumber"]?.toString() ?: "#J-${id.takeLast(4)}"
                        val pin = m["pincode"]?.toString() ?: sessionManager.getPincode()

                        // Strictly exclude jobs already accepted or active
                        if (mergedActiveJobs.any { matchesJob(it.id, it.jobTicketNumber, id, ticket) }) {
                            return@mapNotNull null
                        }

                        val service = m["serviceTitle"]?.toString() ?: "Doorstep Service"
                        val cName = m["customerName"]?.toString() ?: "Customer"
                        val cPhone = m["customerPhone"]?.toString() ?: "+91 98765 43210"
                        val cAddr = m["customerAddressText"]?.toString() ?: "Customer Address"
                        val amount = (m["totalAmountInr"] as? Number)?.toDouble() ?: 352.82

                        InboundJobNotification(
                            id = id,
                            jobTicketNumber = ticket,
                            serviceTitle = service,
                            scheduledTime = "Immediate Dispatch",
                            pincode = pin,
                            customerName = cName,
                            customerPhone = cPhone,
                            customerAddress = cAddr,
                            amountInr = amount,
                            commissionInr = amount * 0.7
                        )
                    }

                    val firstAlert = activeInbound.firstOrNull { inbound ->
                        !mergedActiveJobs.any { matchesJob(it.id, it.jobTicketNumber, inbound.id, inbound.jobTicketNumber) }
                    }

                    val alertJob = if (firstAlert != null && _uiState.value.incomingDispatchAlert == null) {
                        val (defaultLat, defaultLng) = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(firstAlert.pincode)
                        val alert = TechnicianJob(
                            id = firstAlert.id,
                            jobTicketNumber = firstAlert.jobTicketNumber,
                            serviceTitle = firstAlert.serviceTitle,
                            pincode = firstAlert.pincode,
                            customerName = firstAlert.customerName,
                            customerPhone = firstAlert.customerPhone,
                            customerAddressText = firstAlert.customerAddress,
                            customerLatitude = defaultLat,
                            customerLongitude = defaultLng,
                            status = "DISPATCHED",
                            priority = "EMERGENCY_60S",
                            totalAmountInr = firstAlert.amountInr,
                            safetyGlovesConfirmed = false,
                            handoverOtp = ""
                        )
                        cacheIncomingJob(alert)
                        alert
                    } else {
                        if (activeInbound.isEmpty()) null else _uiState.value.incomingDispatchAlert
                    }

                    _uiState.value = _uiState.value.copy(
                        assignedJobs = mergedActiveJobs,
                        newJobNotifications = activeInbound,
                        jobsTodayCount = activeInbound.size + mergedActiveJobs.size + _uiState.value.jobsCompletedCount,
                        jobsPendingCount = activeInbound.size + mergedActiveJobs.size,
                        incomingDispatchAlert = alertJob
                    )
                    Log.d("GTS_TECH", "Polled ${activeInbound.size} inbound, ${mergedActiveJobs.size} active jobs for tech $techId")
                }
            } catch (e: Exception) {
                Log.w("GTS_TECH", "Polling backend jobs: ${e.message}")
            }
        }
    }

    private var dispatchPollingJob: Job? = null

    fun startDispatchPolling(context: Context) {
        dispatchPollingJob?.cancel()
        dispatchPollingJob = viewModelScope.launch {
            while (isActive) {
                if (_uiState.value.isOnline) {
                    pollBackendAssignedJobs(context)
                }
                delay(3000L)
            }
        }
    }

    fun connectRealtimeBus(context: Context) {
        val techId = sessionManager.getTechnicianId()
        realtimeStreamManager.connect(techId) { eventType, data ->
            Log.d("GTS_TECH_EVENT", "Received: $eventType - $data")
            if (eventType == "TECH_DISPATCHED" || eventType == "JOB_CREATED") {
                val jobId = data.optString("jobId").ifEmpty { "job_${System.currentTimeMillis() % 10000}" }
                val details = data.optJSONObject("details")

                val serviceTitle = details?.optString("serviceTitle")
                    ?: data.optString("serviceTitle", "Doorstep Service Order")
                val customerName = details?.optString("customerName")
                    ?: data.optString("customerName", "Valued Customer")
                val customerPhone = details?.optString("customerPhone")
                    ?: data.optString("customerPhone", "+91 98765 43210")
                val customerAddress = details?.optString("customerAddress")
                    ?: data.optString("customerAddress", "Customer Doorstep Address")
                val pin = details?.optString("pincode")
                    ?: data.optString("pincode", sessionManager.getPincode())
                val ticket = data.optString("ticketNumber").ifEmpty {
                    val statePrefix = if (pin.startsWith("75") || pin.startsWith("76") || pin.startsWith("77")) "OD" else "MH"
                    "GTS-$statePrefix-${(1000..9999).random()}"
                }
                val totalAmount = if (details != null && details.has("totalAmountInr")) {
                    details.optDouble("totalAmountInr", 352.82)
                } else if (data.has("totalAmountInr")) {
                    data.optDouble("totalAmountInr", 352.82)
                } else 352.82

                val lat = details?.optDouble("customerLatitude")
                    ?: if (pin.startsWith("75") || pin.startsWith("76") || pin.startsWith("77")) 19.3150 else 18.9220
                val lng = details?.optDouble("customerLongitude")
                    ?: if (pin.startsWith("75") || pin.startsWith("76") || pin.startsWith("77")) 84.7941 else 72.8347

                val inboundJob = TechnicianJob(
                    id = jobId,
                    jobTicketNumber = ticket,
                    serviceTitle = serviceTitle,
                    pincode = pin,
                    customerName = customerName,
                    customerPhone = customerPhone,
                    customerAddressText = customerAddress,
                    customerLatitude = lat,
                    customerLongitude = lng,
                    status = "DISPATCHED",
                    priority = details?.optString("priority", "STANDARD") ?: "STANDARD",
                    totalAmountInr = totalAmount,
                    safetyGlovesConfirmed = false,
                    handoverOtp = details?.optString("handoverOtp")?.takeIf { it.isNotEmpty() }
                        ?: data.optString("handoverOtp").takeIf { it.isNotEmpty() }
                        ?: ""
                )

                cacheIncomingJob(inboundJob)
                _uiState.value = _uiState.value.copy(incomingDispatchAlert = inboundJob)
            }
        }
    }

    fun dismissIncomingDispatch() {
        _uiState.value = _uiState.value.copy(incomingDispatchAlert = null)
    }

    fun acceptIncomingDispatch(job: TechnicianJob) {
        val updatedList = _uiState.value.assignedJobs.toMutableList()
        val accepted = job.copy(status = "EN_ROUTE")
        updatedList.add(0, accepted)
        _uiState.value = _uiState.value.copy(
            assignedJobs = updatedList,
            selectedJob = accepted,
            incomingDispatchAlert = null,
            currentTab = "JOB_DETAILS"
        )
    }

    fun logout() {
        val techId = sessionManager.getTechnicianId()
        val badge = sessionManager.getBadgeNumber()
        val context = sessionManager.context

        viewModelScope.launch {
            try {
                val api = ApiClient.getService(context)
                if (techId.isNotEmpty()) {
                    api.updateAvailability(techId, mapOf("isOnline" to false))
                }
                if (badge.isNotEmpty()) {
                    api.updateAvailability(badge, mapOf("isOnline" to false))
                }
                Log.d("GTS_TECH", "Successfully synced OFFLINE status to cloud on logout")
            } catch (e: Exception) {
                Log.w("GTS_TECH", "Error setting offline status on logout: ${e.message}")
            }
        }

        dispatchPollingJob?.cancel()
        sessionManager.setOnline(false)
        sessionManager.clearSession()
        realtimeStreamManager.disconnect()
    }

    override fun onCleared() {
        super.onCleared()
        dispatchPollingJob?.cancel()
        realtimeStreamManager.disconnect()
    }
}
