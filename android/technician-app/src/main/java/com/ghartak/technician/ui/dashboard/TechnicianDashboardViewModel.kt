package com.ghartak.technician.ui.dashboard

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.DispatchActionRequest
import com.ghartak.technician.data.model.EmergencySosRequest
import com.ghartak.technician.data.model.RegisterTechnicianRequest
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.model.TechnicianProfile
import com.ghartak.technician.data.realtime.RealtimeStreamManager
import com.ghartak.technician.data.session.SessionManager
import com.ghartak.technician.service.TechnicianLocationService
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

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
    val periodScope: Set<String> = setOf("TODAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME"),
    val timestampMillis: Long = System.currentTimeMillis()
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
    val showWithdrawDialog: Boolean = false,
    val withdrawSuccessMessage: String? = null,
    val withdrawalHistory: List<com.ghartak.technician.data.model.WithdrawalItem> = emptyList(),
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

            // Immediately activate live GPS telemetry broadcast for the accepted work order
            TechnicianLocationService.startService(sessionManager.context, notif.id)

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

    fun openWithdrawDialog() {
        _uiState.value = _uiState.value.copy(showWithdrawDialog = true, withdrawSuccessMessage = null, errorMessage = null)
    }

    fun closeWithdrawDialog() {
        _uiState.value = _uiState.value.copy(showWithdrawDialog = false, errorMessage = null)
    }

    fun getSavedUpiId(): String = sessionManager.getSavedUpiId()
    fun getSavedAccountName(): String = sessionManager.getSavedAccountName().ifEmpty { sessionManager.getFullName() }
    fun getSavedAccountNumber(): String = sessionManager.getSavedAccountNumber()
    fun getSavedIfsc(): String = sessionManager.getSavedIfsc()

    fun submitWithdrawal(
        amount: Double,
        payoutMethod: String,
        upiId: String? = null,
        accountHolderName: String? = null,
        accountNumber: String? = null,
        ifscCode: String? = null,
        bankName: String? = null
    ) {
        if (_uiState.value.isWithdrawing) return
        if (amount <= 0.0 || amount > _uiState.value.availableWithdrawalInr) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "Amount must be between ₹1 and ₹${"%,.0f".format(_uiState.value.availableWithdrawalInr)}"
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isWithdrawing = true, errorMessage = null)
            val techId = sessionManager.getTechnicianId().ifEmpty { sessionManager.getBadgeNumber() }
            if (techId.isBlank()) {
                _uiState.value = _uiState.value.copy(
                    isWithdrawing = false,
                    errorMessage = "Active session not found. Please log in again."
                )
                return@launch
            }
            val techName = sessionManager.getFullName()
            val techBadge = sessionManager.getBadgeNumber()
            val techPhone = sessionManager.getPhone()

            // Save details locally for easy re-use
            if (payoutMethod == "UPI" && !upiId.isNullOrBlank()) {
                sessionManager.setSavedUpiId(upiId)
            } else if (payoutMethod == "BANK_ACCOUNT" && !accountNumber.isNullOrBlank()) {
                sessionManager.setSavedBankDetails(
                    accountHolderName ?: techName,
                    accountNumber,
                    ifscCode ?: ""
                )
            }

            val tempId = "wth_${System.currentTimeMillis()}"
            val localItem = com.ghartak.technician.data.model.WithdrawalItem(
                id = tempId,
                technicianId = techId,
                technicianName = techName,
                technicianBadge = techBadge,
                technicianPhone = techPhone,
                amountInr = amount,
                payoutMethod = payoutMethod,
                upiId = upiId,
                accountHolderName = accountHolderName,
                accountNumber = accountNumber,
                ifscCode = ifscCode,
                bankName = bankName,
                status = "PENDING",
                requestedAt = "Just now"
            )

            var savedWithServer = false
            try {
                val api = ApiClient.getService(sessionManager.context)
                val res = api.requestWithdrawal(
                    com.ghartak.technician.data.model.CreateWithdrawalRequest(
                        technicianId = techId,
                        amountInr = amount,
                        payoutMethod = payoutMethod,
                        upiId = upiId,
                        accountHolderName = accountHolderName,
                        accountNumber = accountNumber,
                        ifscCode = ifscCode,
                        bankName = bankName
                    )
                )
                if (res.isSuccessful && res.body()?.data != null) {
                    val serverItem = res.body()!!.data!!
                    sessionManager.replaceOrAddWithdrawal(tempId, serverItem)
                    savedWithServer = true
                }
            } catch (e: Exception) {
                Log.w("GTS_TECH", "Withdrawal remote sync info: ${e.message}")
            }

            if (!savedWithServer) {
                // If offline or network issue, persist the optimistic item once
                sessionManager.saveLocalWithdrawal(localItem)
            }

            val updatedHistory = sessionManager.getLocalWithdrawals()
            val pendingOrPaid = updatedHistory.filter { it.status == "PENDING" || it.status == "PAID" }.sumOf { it.amountInr }
            val newAvailable = maxOf(0.0, _uiState.value.allTimeEarningsInr - pendingOrPaid)

            _uiState.value = _uiState.value.copy(
                isWithdrawing = false,
                showWithdrawDialog = false,
                availableWithdrawalInr = newAvailable,
                withdrawalHistory = updatedHistory,
                withdrawSuccessMessage = "₹${"%,.0f".format(amount)} payout request submitted to franchise partner. Status: PENDING"
            )
        }
    }

    fun fetchWithdrawalHistory() {
        val techId = sessionManager.getTechnicianId()
        val local = sessionManager.getLocalWithdrawals()
        _uiState.value = _uiState.value.copy(withdrawalHistory = local)

        if (techId.isEmpty()) return

        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val res = api.getWithdrawals(techId)
                if (res.isSuccessful && res.body()?.data != null) {
                    val serverList = res.body()!!.data!!.withdrawals
                    if (serverList.isNotEmpty()) {
                        serverList.forEach { sessionManager.saveLocalWithdrawal(it) }
                        val merged = sessionManager.getLocalWithdrawals()
                        val pendingOrPaid = merged.filter { it.status == "PENDING" || it.status == "PAID" }.sumOf { it.amountInr }
                        val newAvailable = maxOf(0.0, _uiState.value.allTimeEarningsInr - pendingOrPaid)
                        _uiState.value = _uiState.value.copy(
                            withdrawalHistory = merged,
                            availableWithdrawalInr = newAvailable
                        )
                    }
                }
            } catch (e: Exception) {
                Log.d("GTS_TECH", "Withdrawal fetch: ${e.message}")
            }
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

        val cachedTransactions = loadTransactionsFromSession()
        val completed = maxOf(sessionManager.getTotalJobsCompleted(), cachedTransactions.size)
        val todayE = if (completed == 0) 0.0 else sessionManager.getTodayEarnings()
        val weekE = if (completed == 0) 0.0 else sessionManager.getWeekEarnings()
        val monthE = if (completed == 0) 0.0 else sessionManager.getMonthEarnings()
        val withdrawals = sessionManager.getLocalWithdrawals()
        val pendingOrPaid = withdrawals.filter { it.status == "PENDING" || it.status == "PAID" }.sumOf { it.amountInr }
        val available = maxOf(0.0, monthE - pendingOrPaid)

        _uiState.value = _uiState.value.copy(
            profile = profile,
            isOnline = isOnline,
            customerRating = rating.toFloat(),
            jobsCompletedCount = completed,
            todayEarningsInr = todayE,
            weekEarningsInr = weekE,
            monthEarningsInr = monthE,
            allTimeEarningsInr = if (monthE > 0) monthE else cachedTransactions.sumOf { it.amountInr },
            availableWithdrawalInr = available,
            withdrawalHistory = withdrawals,
            recentTransactions = cachedTransactions,
            assignedJobs = _uiState.value.assignedJobs
        )
        syncProfileToServer()
        fetchWithdrawalHistory()
        fetchCompletedJobTransactions()

        if (isOnline) {
            val activeJobId = _uiState.value.assignedJobs.firstOrNull { it.status == "EN_ROUTE" || it.status == "ASSIGNED" || it.status == "IN_PROGRESS" }?.id
            TechnicianLocationService.startService(sessionManager.context, activeJobId)
        }
    }

    fun syncProfileToServer() {
        viewModelScope.launch {
            try {
                val pin = sessionManager.getPincode().ifEmpty {
                    Regex("\\b\\d{6}\\b").find(sessionManager.getServiceArea())?.value ?: "759001"
                }
                val (hubLat, hubLng) = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(pin)
                var liveLat = hubLat
                var liveLng = hubLng
                try {
                    val lm = sessionManager.context.getSystemService(android.content.Context.LOCATION_SERVICE) as? android.location.LocationManager
                    if (lm != null) {
                        val providers = listOf(
                            android.location.LocationManager.GPS_PROVIDER,
                            android.location.LocationManager.NETWORK_PROVIDER,
                            android.location.LocationManager.PASSIVE_PROVIDER
                        )
                        for (p in providers) {
                            try {
                                val loc = lm.getLastKnownLocation(p)
                                if (loc != null) {
                                    liveLat = loc.latitude
                                    liveLng = loc.longitude
                                    break
                                }
                            } catch (_: SecurityException) {}
                        }
                    }
                } catch (_: Throwable) {}

                val techId = sessionManager.getTechnicianId()
                val api = ApiClient.getService(sessionManager.context)
                val req = RegisterTechnicianRequest(
                    id = techId.ifEmpty { null },
                    badgeNumber = sessionManager.getBadgeNumber().ifEmpty { null },
                    fullName = sessionManager.getFullName(),
                    phone = sessionManager.getPhone().ifEmpty { "+91 9876543210" },
                    email = sessionManager.getEmail().ifEmpty { null },
                    trade = sessionManager.getSpecialization(),
                    pincode = pin,
                    latitude = liveLat,
                    longitude = liveLng
                )
                val res = api.registerTechnician(req)
                if (res.isSuccessful && techId.isNotEmpty()) {
                    api.updateAvailability(techId, mapOf("isOnline" to sessionManager.isOnline()))
                }
                Log.d("TechnicianSync", "Synced profile for $techId ($pin - ${sessionManager.getSpecialization()} at $liveLat,$liveLng) to server: ${res.isSuccessful}")
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

    fun markJobCompleted(jobId: String, payoutInr: Double = 0.0, creditEarnings: Boolean = false) {
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

        val finalPayout = if (completedJob != null && completedJob.totalAmountInr > 0.0) {
            completedJob.totalAmountInr * 0.70
        } else if (payoutInr > 0.0) {
            payoutInr * 0.70
        } else {
            0.0
        }
        val ticket = completedJob?.jobTicketNumber?.ifBlank { "#J-${jobId.takeLast(4)}" } ?: "#J-${jobId.takeLast(4)}"
        val service = completedJob?.serviceTitle?.ifBlank { "Doorstep Service" } ?: "Doorstep Service"

        // Avoid duplicate credit: JobCompleteViewModel already credited earnings to sessionManager
        if (creditEarnings && finalPayout > 0.0) {
            sessionManager.addEarnings(finalPayout)
        }

        val nowTimeFormatted = java.text.SimpleDateFormat("d MMM, hh:mm a", java.util.Locale.ENGLISH).format(java.util.Date())
        val newTx = EarningsTransaction(
            id = "tx_${System.currentTimeMillis()}",
            jobTicketNumber = ticket,
            serviceTitle = service,
            completedTime = nowTimeFormatted,
            amountInr = finalPayout,
            isPending = false,
            periodScope = setOf("TODAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME"),
            timestampMillis = System.currentTimeMillis()
        )

        val updatedTransactions = (listOf(newTx) + _uiState.value.recentTransactions).distinctBy { it.jobTicketNumber }
        saveTransactionsToSession(updatedTransactions)

        val sessionTotalEarned = sessionManager.getMonthEarnings().takeIf { it > 0.0 } ?: updatedTransactions.sumOf { it.amountInr }

        _uiState.value = _uiState.value.copy(
            assignedJobs = updatedJobs,
            selectedJob = completedJob?.copy(status = "COMPLETED"),
            todayEarningsInr = sessionManager.getTodayEarnings().takeIf { it > 0.0 } ?: (_uiState.value.todayEarningsInr + (if (creditEarnings) finalPayout else 0.0)),
            weekEarningsInr = sessionManager.getWeekEarnings().takeIf { it > 0.0 } ?: (_uiState.value.weekEarningsInr + (if (creditEarnings) finalPayout else 0.0)),
            monthEarningsInr = sessionTotalEarned,
            allTimeEarningsInr = sessionTotalEarned,
            availableWithdrawalInr = maxOf(0.0, sessionTotalEarned - _uiState.value.withdrawalHistory.filter { it.status == "PENDING" || it.status == "PAID" }.sumOf { it.amountInr }),
            jobsCompletedCount = sessionManager.getTotalJobsCompleted().takeIf { it > 0 } ?: updatedTransactions.size,
            jobsPendingCount = maxOf(0, _uiState.value.jobsPendingCount - 1),
            recentTransactions = updatedTransactions,
            currentTab = "HOME"
        )
    }

    private fun loadTransactionsFromSession(): List<EarningsTransaction> {
        val raw = sessionManager.getSavedEarningsTransactionsJson()
        if (raw.isBlank() || raw == "[]") return emptyList()
        return try {
            val arr = JSONArray(raw)
            val list = mutableListOf<EarningsTransaction>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val periodsArr = obj.optJSONArray("periodScope")
                val periods = mutableSetOf<String>()
                if (periodsArr != null) {
                    for (p in 0 until periodsArr.length()) {
                        periods.add(periodsArr.getString(p))
                    }
                } else {
                    periods.addAll(listOf("TODAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME"))
                }
                val ts = obj.optLong("timestampMillis", System.currentTimeMillis())
                list.add(
                    EarningsTransaction(
                        id = obj.optString("id"),
                        jobTicketNumber = obj.optString("jobTicketNumber"),
                        serviceTitle = obj.optString("serviceTitle"),
                        completedTime = obj.optString("completedTime"),
                        amountInr = obj.optDouble("amountInr"),
                        isPending = obj.optBoolean("isPending", false),
                        periodScope = periods,
                        timestampMillis = ts
                    )
                )
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun saveTransactionsToSession(list: List<EarningsTransaction>) {
        try {
            val arr = JSONArray()
            for (tx in list) {
                val obj = JSONObject().apply {
                    put("id", tx.id)
                    put("jobTicketNumber", tx.jobTicketNumber)
                    put("serviceTitle", tx.serviceTitle)
                    put("completedTime", tx.completedTime)
                    put("amountInr", tx.amountInr)
                    put("isPending", tx.isPending)
                    put("timestampMillis", tx.timestampMillis)
                    val pArr = JSONArray()
                    tx.periodScope.forEach { pArr.put(it) }
                    put("periodScope", pArr)
                }
                arr.put(obj)
            }
            sessionManager.saveEarningsTransactionsJson(arr.toString())
        } catch (_: Exception) {
        }
    }

    fun fetchCompletedJobTransactions() {
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(sessionManager.context)
                val techId = sessionManager.getTechnicianId().ifEmpty { sessionManager.getBadgeNumber() }
                if (techId.isBlank()) return@launch

                val response = api.getAssignedJobs(technicianId = techId, status = "WORK_COMPLETED")
                if (response.isSuccessful && response.body()?.data != null) {
                    val dataMap = response.body()!!.data!!
                    val rawJobs = (dataMap["jobs"] as? List<*>) ?: emptyList<Any>()

                    val fetchedTransactions = rawJobs.mapNotNull { raw ->
                        val m = raw as? Map<*, *> ?: return@mapNotNull null
                        val id = m["id"]?.toString() ?: return@mapNotNull null
                        val ticket = m["jobTicketNumber"]?.toString() ?: "#J-${id.takeLast(4)}"
                        val service = m["serviceTitle"]?.toString() ?: "Doorstep Service"
                        val totalAmount = (m["totalAmountInr"] as? Number)?.toDouble() ?: 0.0
                        val payout = totalAmount * 0.70
                        val completedAt = m["updatedAt"]?.toString() ?: m["createdAt"]?.toString() ?: ""

                        val (timeFormatted, parsedTs) = if (completedAt.isNotBlank()) {
                            try {
                                val inFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.ENGLISH)
                                val outFormat = java.text.SimpleDateFormat("d MMM, hh:mm a", java.util.Locale.ENGLISH)
                                val d = inFormat.parse(completedAt.substring(0, 19))
                                if (d != null) Pair(outFormat.format(d), d.time) else Pair("Completed", System.currentTimeMillis())
                            } catch (_: Exception) {
                                Pair("Completed", System.currentTimeMillis())
                            }
                        } else {
                            Pair("Completed", System.currentTimeMillis())
                        }

                        EarningsTransaction(
                            id = "tx_$id",
                            jobTicketNumber = ticket,
                            serviceTitle = service,
                            completedTime = timeFormatted,
                            amountInr = payout,
                            isPending = false,
                            periodScope = setOf("TODAY", "THIS_WEEK", "THIS_MONTH", "ALL_TIME"),
                            timestampMillis = parsedTs
                        )
                    }

                    val mergedTx = (fetchedTransactions + _uiState.value.recentTransactions).distinctBy { it.jobTicketNumber }
                    saveTransactionsToSession(mergedTx)

                    val totalEarnedFromTx = mergedTx.sumOf { it.amountInr }

                    _uiState.value = _uiState.value.copy(
                        recentTransactions = mergedTx,
                        jobsCompletedCount = maxOf(_uiState.value.jobsCompletedCount, mergedTx.size),
                        allTimeEarningsInr = maxOf(_uiState.value.allTimeEarningsInr, totalEarnedFromTx),
                        monthEarningsInr = if (_uiState.value.monthEarningsInr <= 0.0) totalEarnedFromTx else _uiState.value.monthEarningsInr,
                        availableWithdrawalInr = if (_uiState.value.availableWithdrawalInr <= 0.0) totalEarnedFromTx else _uiState.value.availableWithdrawalInr
                    )
                    Log.d("GTS_TECH", "Fetched ${fetchedTransactions.size} completed job transactions from server")
                }
            } catch (e: Exception) {
                Log.w("GTS_TECH", "Failed to fetch past job transactions: ${e.message}")
            }
        }
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

                if (newStatus) {
                    val activeJobId = _uiState.value.assignedJobs.firstOrNull { it.status == "EN_ROUTE" || it.status == "ASSIGNED" || it.status == "IN_PROGRESS" }?.id
                    TechnicianLocationService.startService(context, activeJobId)
                } else {
                    TechnicianLocationService.stopService(context)
                }

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
                    val activeJobId = _uiState.value.assignedJobs.firstOrNull { it.status == "EN_ROUTE" || it.status == "ASSIGNED" || it.status == "IN_PROGRESS" }?.id
                    TechnicianLocationService.startService(context, activeJobId)
                    syncProfileToServer()
                } else {
                    TechnicianLocationService.stopService(context)
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
                            totalAmountInr = (m["totalAmountInr"] as? Number)?.toDouble() ?: (Math.round(299.0 * 1.18 * 100.0) / 100.0),
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
                        val amount = (m["totalAmountInr"] as? Number)?.toDouble() ?: (Math.round(299.0 * 1.18 * 100.0) / 100.0)

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
                val fallbackAmount = Math.round(299.0 * 1.18 * 100.0) / 100.0
                val totalAmount = if (details != null && details.has("totalAmountInr")) {
                    details.optDouble("totalAmountInr", fallbackAmount)
                } else if (data.has("totalAmountInr")) {
                    data.optDouble("totalAmountInr", fallbackAmount)
                } else fallbackAmount

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
            } else if (eventType == "JOB_CANCELLED") {
                val cancelledJobId = data.optString("jobId")
                if (cancelledJobId.isNotEmpty()) {
                    val updatedJobs = _uiState.value.assignedJobs.filterNot { it.id == cancelledJobId }
                    val isCurrentJobCancelled = _uiState.value.selectedJob?.id == cancelledJobId
                    if (isCurrentJobCancelled) {
                        TechnicianLocationService.stopService(sessionManager.context)
                    }
                    _uiState.value = _uiState.value.copy(
                        assignedJobs = updatedJobs,
                        selectedJob = if (isCurrentJobCancelled) null else _uiState.value.selectedJob,
                        incomingDispatchAlert = if (_uiState.value.incomingDispatchAlert?.id == cancelledJobId) null else _uiState.value.incomingDispatchAlert,
                        errorMessage = if (isCurrentJobCancelled) "Customer cancelled order $cancelledJobId." else _uiState.value.errorMessage
                    )
                }
            }
        }
    }

    fun triggerEmergencySos(context: Context, reason: String = "EMERGENCY_FIELD_SOS_TRIGGERED") {
        viewModelScope.launch {
            try {
                val api = ApiClient.getService(context)
                val profile = _uiState.value.profile
                val techId = sessionManager.getTechnicianId().ifEmpty { sessionManager.getBadgeNumber() }
                val pin = sessionManager.getPincode()
                val (hubLat, hubLng) = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(pin)

                api.broadcastEmergencySos(
                    EmergencySosRequest(
                        technicianId = techId,
                        technicianName = profile?.fullName ?: sessionManager.getFullName(),
                        phone = profile?.phone ?: sessionManager.getPhone(),
                        latitude = hubLat,
                        longitude = hubLng,
                        trade = profile?.specialization ?: "Electrician",
                        reason = reason
                    )
                )
                Log.d("GTS_TECH", "Emergency SOS broadcast successfully sent to operations center")
            } catch (e: Exception) {
                Log.w("GTS_TECH", "Emergency SOS broadcast warning: ${e.message}")
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
        // Immediately start live telemetry for the accepted work order
        TechnicianLocationService.startService(sessionManager.context, job.id)
    }

    fun logout() {
        val techId = sessionManager.getTechnicianId()
        val badge = sessionManager.getBadgeNumber()
        val context = sessionManager.context

        TechnicianLocationService.stopService(context)

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
