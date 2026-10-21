package com.ghartak.customer.ui.payment

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.net.Uri
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.api.ApiClient
import com.ghartak.customer.data.model.CreateJobRequest
import com.ghartak.customer.data.model.Job
import com.ghartak.customer.data.model.ServiceCatalogRegistry
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class PaymentUiState(
    val serviceId: String = "",
    val serviceTitle: String = "",
    val basePriceInr: Double = 0.0,
    val gst18PctInr: Double = 0.0,
    val totalAmountInr: Double = 0.0,
    val pincode: String = "",
    val addressText: String = "",
    val priority: String = "STANDARD",
    val selectedPaymentMethod: String = "UPI_GPAY",
    val technicianId: String = "",
    val technicianName: String = "",
    val technicianBadge: String = "",
    val technicianPhone: String = "",
    val stateCode: String = "",
    val isProcessing: Boolean = false,
    val createdJob: Job? = null,
    val createdJobId: String? = null,
    val errorMessage: String? = null
)

class PaymentViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(PaymentUiState())
    val uiState: StateFlow<PaymentUiState> = _uiState.asStateFlow()

    fun initPaymentDetails(
        serviceId: String,
        serviceTitle: String,
        basePrice: Double,
        pincode: String,
        addressText: String,
        priority: String,
        technicianId: String = "",
        technicianName: String = "Certified Professional",
        technicianBadge: String = "",
        technicianPhone: String = "",
        stateCode: String = "OD"
    ) {
        val registered = ServiceCatalogRegistry.findService(serviceId)
        val resolvedTitle = serviceTitle.ifBlank { registered?.title ?: "Fan Installation" }
        val resolvedBase = if (basePrice > 0.0) basePrice else (registered?.priceInr ?: 299.0)
        val gst = resolvedBase * 0.18
        val total = resolvedBase + gst
        val resolvedPin = pincode.ifEmpty { sessionManager.getUserPincode() }
        val resolvedAddress = addressText.ifEmpty { sessionManager.getUserAddress().ifEmpty { "Brahmapur, Ganjam, Odisha" } }

        _uiState.value = _uiState.value.copy(
            serviceId = serviceId,
            serviceTitle = resolvedTitle,
            basePriceInr = resolvedBase,
            gst18PctInr = gst,
            totalAmountInr = total,
            pincode = resolvedPin,
            addressText = resolvedAddress,
            priority = priority,
            technicianId = technicianId,
            technicianName = technicianName,
            technicianBadge = technicianBadge,
            technicianPhone = technicianPhone,
            stateCode = stateCode.ifEmpty { "OD" }
        )
    }

    fun selectPaymentMethod(method: String) {
        _uiState.value = _uiState.value.copy(selectedPaymentMethod = method)
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(errorMessage = null)
    }

    fun confirmAndCreateJob(
        context: Context,
        onSuccess: (jobId: String) -> Unit
    ) {
        viewModelScope.launch {
            if (sessionManager.hasActiveJob()) {
                val rawTicket = sessionManager.getActiveJobTicketNumber().ifBlank { sessionManager.getActiveJobId().takeLast(6).uppercase() }.ifBlank { "J-1001" }
                val formattedTicket = if (rawTicket.startsWith("#")) rawTicket else "#$rawTicket"
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    errorMessage = "You have an active job in progress ($formattedTicket). Please wait for completion before placing a new booking."
                )
                return@launch
            }

            _uiState.value = _uiState.value.copy(isProcessing = true, errorMessage = null)

            // If UPI Intent chosen, simulate/trigger NPCI deep link
            if (_uiState.value.selectedPaymentMethod.startsWith("UPI")) {
                try {
                    val serviceTag = _uiState.value.serviceId.ifBlank { "SERVICE" }.uppercase().replace(" ", "-")
                    val upiUri = "upi://pay?pa=ghartak@icici&pn=GharTak%20Services&am=${_uiState.value.totalAmountInr}&cu=INR&tn=GTS-$serviceTag-BOOKING"
                    val upiIntent = Intent(Intent.ACTION_VIEW, Uri.parse(upiUri))
                    // Try launching if installed, or proceed smoothly
                    if (upiIntent.resolveActivity(context.packageManager) != null) {
                        context.startActivity(upiIntent)
                    }
                } catch (e: Exception) {
                    Log.d("GTS_UPI", "UPI intent launch info: ${e.message}")
                }
            }

            try {
                val api = ApiClient.getService(context)
                val (fallbackLat, fallbackLng) = com.ghartak.customer.util.IndianPincodeResolver.getCoordinatesForPincode(_uiState.value.pincode)

                var finalLat = fallbackLat
                var finalLng = fallbackLng

                // Read real GPS coordinates from device if available
                val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager

                if ((hasFine || hasCoarse) && lm != null) {
                    try {
                        val gpsLoc = if (hasFine) lm.getLastKnownLocation(LocationManager.GPS_PROVIDER) else null
                        val netLoc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
                        val bestLoc = gpsLoc ?: netLoc
                        if (bestLoc != null && bestLoc.latitude != 0.0 && bestLoc.longitude != 0.0) {
                            finalLat = bestLoc.latitude
                            finalLng = bestLoc.longitude
                            Log.d("GTS_JOB_CREATE", "Using actual device GPS coordinates for booking: ($finalLat, $finalLng)")
                        }
                    } catch (e: SecurityException) {
                        Log.w("GTS_JOB_CREATE", "Location permission check warning: ${e.message}")
                    }
                }

                Log.d("GTS_JOB_CREATE", "Creating real job on backend: service=${_uiState.value.serviceId}, tech=${_uiState.value.technicianId}, pin=${_uiState.value.pincode}, coords=($finalLat, $finalLng)")

                val response = kotlinx.coroutines.withTimeoutOrNull(25000L) {
                    api.createJob(
                        CreateJobRequest(
                            customerId = sessionManager.getUserId(),
                            customerName = sessionManager.getUserName(),
                            customerPhone = sessionManager.getUserPhone(),
                            serviceId = _uiState.value.serviceId,
                            technicianId = _uiState.value.technicianId.ifEmpty { null },
                            pincode = _uiState.value.pincode,
                            customerAddressText = _uiState.value.addressText,
                            customerLatitude = finalLat,
                            customerLongitude = finalLng,
                            priority = _uiState.value.priority,
                            paymentMethod = _uiState.value.selectedPaymentMethod
                        )
                    )
                }

                if (response != null && response.isSuccessful && response.body()?.data != null) {
                    val job = response.body()!!.data!!
                    Log.d("GTS_JOB_CREATE", "Real job created successfully on backend! Ticket: ${job.jobTicketNumber}, ID: ${job.id}")
                    val resolvedTechName = job.technicianName?.takeIf { it.isNotBlank() } ?: _uiState.value.technicianName
                    val isReassigned = !job.technicianName.isNullOrBlank() && job.technicianName != _uiState.value.technicianName
                    val resolvedBadge = if (isReassigned && !job.technicianId.isNullOrBlank()) {
                        "GTS-TECH-${job.technicianId.takeLast(4).uppercase()}"
                    } else {
                        _uiState.value.technicianBadge.ifBlank { "GTS-TECH-VERIFIED" }
                    }
                    val resolvedPhone = if (isReassigned) {
                        "+91 98201 44091"
                    } else {
                        _uiState.value.technicianPhone.ifBlank { "+91 98201 44091" }
                    }

                    sessionManager.saveActiveJob(
                        id = job.id,
                        title = _uiState.value.serviceTitle,
                        basePrice = _uiState.value.basePriceInr,
                        gst = _uiState.value.gst18PctInr,
                        total = _uiState.value.totalAmountInr,
                        technicianName = resolvedTechName,
                        technicianBadge = resolvedBadge,
                        technicianPhone = resolvedPhone,
                        ticketNumber = job.jobTicketNumber,
                        stateCode = _uiState.value.stateCode,
                        gstin = com.ghartak.customer.util.IndianPincodeResolver.getOfflineFallback(_uiState.value.pincode).gstinStateCode,
                        handoverOtp = job.handoverOtp ?: ((1000..9999).random().toString())
                    )
                    sessionManager.setUserPincode(_uiState.value.pincode)
                    _uiState.value = _uiState.value.copy(
                        isProcessing = false,
                        createdJob = job,
                        createdJobId = job.id
                    )
                    onSuccess(job.id)
                } else {
                    val code = response?.code()
                    val errorBody = response?.errorBody()?.string()
                    val msg = try {
                        if (!errorBody.isNullOrBlank()) {
                            org.json.JSONObject(errorBody).optString("details", org.json.JSONObject(errorBody).optString("error", "Failed to book service ($code)."))
                        } else {
                            "Failed to book service on server ($code). Please retry."
                        }
                    } catch (_: Exception) {
                        "Failed to create booking on central server. Please check connection and retry."
                    }
                    _uiState.value = _uiState.value.copy(
                        isProcessing = false,
                        errorMessage = msg
                    )
                }
            } catch (e: Exception) {
                Log.w("GTS_JOB_CREATE", "Network job create error: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    isProcessing = false,
                    errorMessage = "Unable to connect to Ghar Tak booking service: ${e.message ?: "Network timeout. Please retry."}"
                )
            }
        }
    }

    fun cancelDispatch() {
        _uiState.value = _uiState.value.copy(isProcessing = false, errorMessage = null)
    }
}
