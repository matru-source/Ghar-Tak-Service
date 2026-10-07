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
    val isCheckingPincode: Boolean = false,
    val isPincodeServiceable: Boolean = true,
    val hubName: String = "MH-01 Maharashtra Regional Hub",
    val etaMinutes: Int = 15,
    val bookingPriority: String = "EMERGENCY_60S",
    val selectedSlot: String = "Within 15-30 Mins (Emergency Dispatch)",
    val errorMessage: String? = null
) {
    val canProceed: Boolean
        get() = isPincodeServiceable && flatNumber.isNotBlank() && streetName.isNotBlank() && pincode.length == 6
}

class AddressBookingViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddressBookingUiState())
    val uiState: StateFlow<AddressBookingUiState> = _uiState.asStateFlow()

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
            checkPincodeServiceability(context, sanitized)
        }
    }

    fun checkPincodeServiceability(context: Context, pin: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCheckingPincode = true, errorMessage = null)
            try {
                val api = ApiClient.getService(context)
                val response = api.checkPincode(pin)

                if (response.isSuccessful) {
                    val data = response.body()?.data
                    val serviceable = data?.get("serviceable") as? Boolean ?: true
                    val hub = data?.get("assignedPartnerName") as? String ?: "MH-01 Maharashtra Regional Hub"
                    val eta = (data?.get("targetEtaMinutes") as? Double)?.toInt() ?: 15

                    _uiState.value = _uiState.value.copy(
                        isCheckingPincode = false,
                        isPincodeServiceable = serviceable,
                        hubName = hub,
                        etaMinutes = eta
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        isCheckingPincode = false,
                        isPincodeServiceable = true,
                        hubName = "MH-01 Maharashtra Regional Hub",
                        etaMinutes = 15
                    )
                }
            } catch (e: Exception) {
                Log.w("GTS_PINCODE", "Fallback verification: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    isCheckingPincode = false,
                    isPincodeServiceable = true,
                    hubName = "MH-01 Maharashtra Regional Hub",
                    etaMinutes = 15
                )
            }
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
