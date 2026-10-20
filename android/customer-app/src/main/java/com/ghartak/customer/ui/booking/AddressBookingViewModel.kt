package com.ghartak.customer.ui.booking

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.api.ApiClient
import com.ghartak.customer.data.model.ServiceCatalogRegistry
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class TechnicianSortOption(val displayName: String, val shortLabel: String) {
    MIN_DISTANCE("Minimum Distance", "Min Distance"),
    RATINGS("Rating", "Ratings"),
    NUMBER_OF_JOBS("Number of Jobs", "Jobs Done")
}

data class NearbyTechnician(
    val id: String,
    val name: String,
    val badge: String,
    val rating: String,
    val ratingValue: Double,
    val distance: String,
    val distanceKm: Double,
    val eta: String,
    val etaMinutes: Int,
    val specialty: String,
    val phone: String = "+91 98201 44091",
    val completedJobs: String = "240+ jobs",
    val completedJobsCount: Int = 240
)

data class AddressBookingUiState(
    val serviceId: String = "srv_fan_install",
    val serviceTitle: String = "Fan Installation",
    val basePriceInr: Double = 299.0,
    val gst18PctInr: Double = 53.82,
    val totalPayableInr: Double = 352.82,
    val flatNumber: String = "",
    val streetName: String = "",
    val landmark: String = "",
    val pincode: String = "760001",
    val stateName: String = "Odisha",
    val stateCode: String = "MH",
    val gstinStateCode: String = "27AAACG1234F1Z5 (27-MH)",
    val isCheckingPincode: Boolean = false,
    val isPincodeServiceable: Boolean = true,
    val hubName: String = "MH-01 Maharashtra Regional Hub",
    val etaMinutes: Int = 15,
    val bookingPriority: String = "EMERGENCY_60S",
    val selectedSlot: String = "Within 15-30 Mins (Emergency Dispatch)",
    val errorMessage: String? = null,
    val sortOption: TechnicianSortOption = TechnicianSortOption.MIN_DISTANCE,
    val nearbyTechnicians: List<NearbyTechnician> = emptyList(),
    val selectedTechnicianId: String = "",
    val isLoadingTechnicians: Boolean = false
) {
    val sortedTechnicians: List<NearbyTechnician>
        get() = when (sortOption) {
            TechnicianSortOption.MIN_DISTANCE -> nearbyTechnicians.sortedBy { it.distanceKm }
            TechnicianSortOption.RATINGS -> nearbyTechnicians.sortedWith(
                compareByDescending<NearbyTechnician> { it.ratingValue }
                    .thenByDescending { it.completedJobsCount }
            )
            TechnicianSortOption.NUMBER_OF_JOBS -> nearbyTechnicians.sortedByDescending { it.completedJobsCount }
        }

    val selectedTechnician: NearbyTechnician?
        get() = sortedTechnicians.find { it.id == selectedTechnicianId } ?: sortedTechnicians.firstOrNull()

    val canProceed: Boolean
        get() = isPincodeServiceable && flatNumber.isNotBlank() && streetName.isNotBlank() && pincode.length == 6 && selectedTechnician != null
}

class AddressBookingViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddressBookingUiState())
    val uiState: StateFlow<AddressBookingUiState> = _uiState.asStateFlow()

    init {
        val savedPin = sessionManager.getUserPincode().filter { it.isDigit() }.take(6).ifEmpty { "400001" }
        val savedAddress = sessionManager.getUserAddress()
        val instant = com.ghartak.customer.util.IndianPincodeResolver.getOfflineFallback(savedPin)
        _uiState.value = _uiState.value.copy(
            pincode = savedPin,
            streetName = savedAddress,
            hubName = instant.hubName,
            stateName = instant.state,
            stateCode = instant.stateCode,
            gstinStateCode = instant.gstinStateCode,
            isPincodeServiceable = true
        )
        viewModelScope.launch {
            val details = com.ghartak.customer.util.IndianPincodeResolver.resolvePincode(savedPin)
            _uiState.value = _uiState.value.copy(
                isCheckingPincode = false,
                isPincodeServiceable = details.isServiceable,
                hubName = details.hubName,
                stateName = details.state,
                stateCode = details.stateCode,
                gstinStateCode = details.gstinStateCode,
                etaMinutes = details.etaMinutes
            )
            loadLiveTechnicians(sessionManager.context, savedPin)
        }
    }

    fun loadLiveTechnicians(context: Context, pin: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingTechnicians = true)
            try {
                val api = ApiClient.getService(context)
                val response = kotlinx.coroutines.withTimeoutOrNull(8000L) {
                    api.getAvailableTechnicians(pincode = pin.ifEmpty { "400001" }, isOnline = true)
                }
                if (response != null && response.isSuccessful && response.body()?.data != null) {
                    val dataMap = response.body()!!.data!!
                    val rawList = (dataMap["technicians"] as? List<*>) ?: emptyList<Any>()
                    if (rawList.isNotEmpty()) {
                        val parsed = rawList.mapNotNull { raw ->
                            val item = raw as? Map<*, *> ?: return@mapNotNull null
                            val id = item["id"]?.toString() ?: item["badgeNumber"]?.toString() ?: "tech_${(1000..9999).random()}"
                            val name = item["fullName"]?.toString() ?: item["name"]?.toString() ?: "Certified Professional"
                            val badge = item["badgeNumber"]?.toString() ?: "GTS-TECH-${id.takeLast(4)}"
                            val ratingVal = (item["rating"] as? Number)?.toDouble() ?: 5.0
                            val completedCount = (item["totalJobsCompleted"] as? Number)?.toInt() ?: 0
                            val phone = item["phone"]?.toString() ?: "+91 98201 44091"
                            val trade = item["trade"]?.toString() ?: item["specialization"]?.toString() ?: "Certified Professional"
                            val distKm = (item["distanceKm"] as? Number)?.toDouble() ?: 1.4
                            val etaMin = (item["etaMinutes"] as? Number)?.toInt() ?: maxOf(8, (distKm * 6).toInt())

                            NearbyTechnician(
                                id = id,
                                name = name,
                                badge = badge,
                                rating = "%.1f ★".format(ratingVal),
                                ratingValue = ratingVal,
                                distance = "%.1f km away".format(distKm),
                                distanceKm = distKm,
                                eta = "$etaMin mins",
                                etaMinutes = etaMin,
                                specialty = trade,
                                phone = phone,
                                completedJobs = "$completedCount+ jobs",
                                completedJobsCount = completedCount
                            )
                        }

                        if (parsed.isNotEmpty()) {
                            val sorted = when (_uiState.value.sortOption) {
                                TechnicianSortOption.MIN_DISTANCE -> parsed.sortedBy { it.distanceKm }
                                TechnicianSortOption.RATINGS -> parsed.sortedWith(
                                    compareByDescending<NearbyTechnician> { it.ratingValue }
                                        .thenByDescending { it.completedJobsCount }
                                )
                                TechnicianSortOption.NUMBER_OF_JOBS -> parsed.sortedByDescending { it.completedJobsCount }
                            }
                            _uiState.value = _uiState.value.copy(
                                nearbyTechnicians = sorted,
                                selectedTechnicianId = sorted.first().id
                            )
                            Log.d("GTS_TECH_FETCH", "Successfully loaded ${sorted.size} live technicians for pin $pin. Selected: ${sorted.first().name}")
                        } else {
                            _uiState.value = _uiState.value.copy(
                                nearbyTechnicians = emptyList(),
                                selectedTechnicianId = ""
                            )
                        }
                    } else {
                        _uiState.value = _uiState.value.copy(
                            nearbyTechnicians = emptyList(),
                            selectedTechnicianId = ""
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        nearbyTechnicians = emptyList(),
                        selectedTechnicianId = ""
                    )
                }
            } catch (e: Exception) {
                Log.w("GTS_TECH_FETCH", "Technician live fetch result: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    nearbyTechnicians = emptyList(),
                    selectedTechnicianId = ""
                )
            } finally {
                _uiState.value = _uiState.value.copy(isLoadingTechnicians = false)
            }
        }
    }

    fun selectTechnician(id: String) {
        _uiState.value = _uiState.value.copy(selectedTechnicianId = id)
    }

    fun setSortOption(option: TechnicianSortOption) {
        val sorted = when (option) {
            TechnicianSortOption.MIN_DISTANCE -> _uiState.value.nearbyTechnicians.sortedBy { it.distanceKm }
            TechnicianSortOption.RATINGS -> _uiState.value.nearbyTechnicians.sortedWith(
                compareByDescending<NearbyTechnician> { it.ratingValue }.thenByDescending { it.completedJobsCount }
            )
            TechnicianSortOption.NUMBER_OF_JOBS -> _uiState.value.nearbyTechnicians.sortedByDescending { it.completedJobsCount }
        }
        _uiState.value = _uiState.value.copy(
            sortOption = option,
            selectedTechnicianId = sorted.firstOrNull()?.id ?: _uiState.value.selectedTechnicianId
        )
    }

    fun initService(id: String, title: String? = null, price: Double? = null) {
        val registered = ServiceCatalogRegistry.findService(id)
        val resolvedTitle = title ?: registered?.title ?: "Fan Installation"
        val resolvedPrice = price ?: registered?.priceInr ?: 299.0
        val gst = resolvedPrice * 0.18
        val total = resolvedPrice + gst
        _uiState.value = _uiState.value.copy(
            serviceId = id,
            serviceTitle = resolvedTitle,
            basePriceInr = resolvedPrice,
            gst18PctInr = gst,
            totalPayableInr = total
        )
        loadLiveTechnicians(sessionManager.context, _uiState.value.pincode)
    }

    fun onFlatChanged(value: String) {
        _uiState.value = _uiState.value.copy(flatNumber = value, errorMessage = null)
    }

    fun onStreetChanged(value: String) {
        _uiState.value = _uiState.value.copy(streetName = value, errorMessage = null)
    }

    fun onLandmarkChanged(value: String) {
        _uiState.value = _uiState.value.copy(landmark = value)
    }

    fun onPincodeChanged(context: Context, pin: String) {
        val sanitized = pin.filter { it.isDigit() }.take(6)
        _uiState.value = _uiState.value.copy(pincode = sanitized)

        if (sanitized.length == 6) {
            sessionManager.setUserPincode(sanitized)
            val instant = com.ghartak.customer.util.IndianPincodeResolver.getOfflineFallback(sanitized)
            _uiState.value = _uiState.value.copy(
                hubName = instant.hubName,
                stateName = instant.state,
                stateCode = instant.stateCode,
                gstinStateCode = instant.gstinStateCode,
                isPincodeServiceable = true
            )
            checkPincodeServiceability(context, sanitized)
        }
    }

    fun checkPincodeServiceability(context: Context, pin: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCheckingPincode = true, errorMessage = null)
            val details = com.ghartak.customer.util.IndianPincodeResolver.resolvePincode(pin)
            _uiState.value = _uiState.value.copy(
                isCheckingPincode = false,
                isPincodeServiceable = details.isServiceable,
                hubName = details.hubName,
                stateName = details.state,
                stateCode = details.stateCode,
                gstinStateCode = details.gstinStateCode,
                etaMinutes = details.etaMinutes
            )
            loadLiveTechnicians(context, pin)
        }
    }

    fun setBookingPriority(priority: String) {
        val slot = if (priority == "EMERGENCY_60S") "Within 15-30 Mins (Emergency Dispatch)" else "Today, 02:00 PM - 04:00 PM"
        _uiState.value = _uiState.value.copy(bookingPriority = priority, selectedSlot = slot)
    }

    fun setSelectedSlot(slot: String) {
        _uiState.value = _uiState.value.copy(selectedSlot = slot)
    }

    fun quickFillDemoAddress(context: Context) {
        _uiState.value = _uiState.value.copy(
            flatNumber = "Flat 402, Sea Crest Towers",
            streetName = "Colaba Causeway, Mumbai",
            landmark = "Near Radio Club",
            pincode = "400001",
            isPincodeServiceable = true,
            hubName = "MH-01 Maharashtra Regional Hub (Colaba)",
            etaMinutes = 15,
            errorMessage = null
        )
    }
}
