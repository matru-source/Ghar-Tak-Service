package com.ghartak.customer.ui.booking

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.api.ApiClient
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

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
    val completedJobs: String = "240+ jobs"
)

data class AddressBookingUiState(
    val serviceId: String = "srv_mcb_replace",
    val serviceTitle: String = "Full Home MCB Panel Replacement & Earth Leakage Fix",
    val basePriceInr: Double = 2499.0,
    val gst18PctInr: Double = 449.82,
    val totalPayableInr: Double = 2948.82,
    val flatNumber: String = "",
    val streetName: String = "",
    val landmark: String = "",
    val pincode: String = "400001",
    val stateName: String = "Maharashtra",
    val stateCode: String = "MH",
    val gstinStateCode: String = "27AAACG1234F1Z5 (27-MH)",
    val isCheckingPincode: Boolean = false,
    val isPincodeServiceable: Boolean = true,
    val hubName: String = "MH-01 Maharashtra Regional Hub",
    val etaMinutes: Int = 15,
    val bookingPriority: String = "EMERGENCY_60S",
    val selectedSlot: String = "Within 15-30 Mins (Emergency Dispatch)",
    val errorMessage: String? = null,
    val nearbyTechnicians: List<NearbyTechnician> = listOf(
        NearbyTechnician(
            id = "GTS-TECH-4091",
            name = "Rajesh Kumar",
            badge = "GTS-TECH-4091",
            rating = "4.9 ★ (240+ jobs)",
            ratingValue = 4.9,
            distance = "1.3 km away",
            distanceKm = 1.3,
            eta = "8 mins",
            etaMinutes = 8,
            specialty = "MCB Panel & Earthing Specialist",
            phone = "+91 98201 44091",
            completedJobs = "240+ jobs"
        ),
        NearbyTechnician(
            id = "GTS-TECH-1084",
            name = "Suresh Patil",
            badge = "GTS-TECH-1084",
            rating = "4.8 ★ (180+ jobs)",
            ratingValue = 4.8,
            distance = "2.4 km away",
            distanceKm = 2.4,
            eta = "14 mins",
            etaMinutes = 14,
            specialty = "Wiring & High Load Installations",
            phone = "+91 98201 11084",
            completedJobs = "180+ jobs"
        ),
        NearbyTechnician(
            id = "GTS-TECH-2241",
            name = "Vikram Singh",
            badge = "GTS-TECH-2241",
            rating = "4.9 ★ (310+ jobs)",
            ratingValue = 4.9,
            distance = "3.1 km away",
            distanceKm = 3.1,
            eta = "19 mins",
            etaMinutes = 19,
            specialty = "Appliance Anchor & Ceiling Fans",
            phone = "+91 98201 22241",
            completedJobs = "310+ jobs"
        )
    ),
    val selectedTechnicianId: String = "GTS-TECH-4091" // Default is shortest distance (Rajesh Kumar 1.3km)
) {
    val selectedTechnician: NearbyTechnician
        get() = nearbyTechnicians.find { it.id == selectedTechnicianId } ?: nearbyTechnicians.first()

    val canProceed: Boolean
        get() = isPincodeServiceable && flatNumber.isNotBlank() && streetName.isNotBlank() && pincode.length == 6
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
        }
    }

    fun selectTechnician(id: String) {
        _uiState.value = _uiState.value.copy(selectedTechnicianId = id)
    }

    fun initService(id: String, title: String = "Full Home MCB Panel Replacement & Earth Leakage Fix", price: Double = 2499.0) {
        val gst = price * 0.18
        val total = price + gst
        _uiState.value = _uiState.value.copy(
            serviceId = id,
            serviceTitle = title,
            basePriceInr = price,
            gst18PctInr = gst,
            totalPayableInr = total
        )
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
