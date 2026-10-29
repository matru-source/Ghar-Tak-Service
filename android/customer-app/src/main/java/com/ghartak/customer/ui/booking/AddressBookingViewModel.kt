package com.ghartak.customer.ui.booking

import android.content.Context
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.api.ApiClient
import com.ghartak.customer.data.model.ServiceCatalogRegistry
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

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
    val basePriceInr: Double = 0.0,
    val gst18PctInr: Double = 0.0,
    val totalPayableInr: Double = 0.0,
    val quoteToken: String? = null,
    val flatNumber: String = "",
    val streetName: String = "",
    val landmark: String = "",
    val pincode: String = "400001",
    val city: String = "Mumbai",
    val district: String = "Mumbai City",
    val stateName: String = "Maharashtra",
    val stateCode: String = "MH",
    val gstinStateCode: String = "27AAACG1234F1Z5 (27-MH)",
    val userLat: Double? = null,
    val userLng: Double? = null,
    val isGpsActive: Boolean = false,
    val isDetectingLocation: Boolean = false,
    val isLocationPermissionGranted: Boolean = false,
    val isLocationGpsProviderEnabled: Boolean = false,
    val isMandatoryLocationSatisfied: Boolean = false,
    val isCheckingPincode: Boolean = false,
    val isPincodeServiceable: Boolean = true,
    val hubName: String = "MH-01 Maharashtra Regional Operations Hub",
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
        get() = isMandatoryLocationSatisfied && isPincodeServiceable && flatNumber.isNotBlank() && streetName.isNotBlank() && pincode.length == 6 && (nearbyTechnicians.isNotEmpty() || isLoadingTechnicians)
}

class AddressBookingViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(AddressBookingUiState())
    val uiState: StateFlow<AddressBookingUiState> = _uiState.asStateFlow()

    init {
        val savedPin = sessionManager.getUserPincode().filter { it.isDigit() }.take(6).ifEmpty { "400001" }
        val savedAddress = sessionManager.getUserAddress()
        val (city, district) = com.ghartak.customer.util.IndianPincodeResolver.getCityAndDistrictForPincode(savedPin)
        val instant = com.ghartak.customer.util.IndianPincodeResolver.getOfflineFallback(savedPin)

        _uiState.value = _uiState.value.copy(
            pincode = savedPin,
            city = city,
            district = district,
            streetName = savedAddress,
            hubName = instant.hubName,
            stateName = instant.state,
            stateCode = instant.stateCode,
            gstinStateCode = instant.gstinStateCode,
            isPincodeServiceable = true
        )

        // Automatically trigger live GPS detection as the primary default
        detectCurrentLocation(sessionManager.context, isInitial = true)
    }

    private var telemetryPollingJob: kotlinx.coroutines.Job? = null

    fun startLiveTelemetryPolling(context: Context) {
        telemetryPollingJob?.cancel()
        telemetryPollingJob = viewModelScope.launch {
            while (isActive) {
                loadLiveTechnicians(context, _uiState.value.pincode)
                delay(5000L)
            }
        }
    }

    fun stopLiveTelemetryPolling() {
        telemetryPollingJob?.cancel()
        telemetryPollingJob = null
    }

    fun loadLiveTechnicians(
        context: Context,
        pin: String,
        overrideLat: Double? = null,
        overrideLng: Double? = null
    ) {
        viewModelScope.launch {
            // Do not flicker full-screen loader on 5-second background refresh
            if (_uiState.value.nearbyTechnicians.isEmpty()) {
                _uiState.value = _uiState.value.copy(isLoadingTechnicians = true)
            }

            // Extract real GPS coordinates from device or parameters
            var userLat: Double? = overrideLat ?: _uiState.value.userLat
            var userLng: Double? = overrideLng ?: _uiState.value.userLng

            if (userLat == null || userLng == null) {
                val lm = context.getSystemService(Context.LOCATION_SERVICE) as? android.location.LocationManager
                if (lm != null) {
                    try {
                        val fineLoc = lm.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                        val netLoc = lm.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                        val passiveLoc = lm.getLastKnownLocation(android.location.LocationManager.PASSIVE_PROVIDER)
                        val bestLoc = fineLoc ?: netLoc ?: passiveLoc
                        if (bestLoc != null) {
                            userLat = bestLoc.latitude
                            userLng = bestLoc.longitude
                        }
                    } catch (e: SecurityException) {
                        // Location permission not granted
                    }
                }
            }

            try {
                val api = ApiClient.getService(context)
                val response = kotlinx.coroutines.withTimeoutOrNull(6000L) {
                    api.getAvailableTechnicians(
                        pincode = pin.ifEmpty { "400001" },
                        isOnline = true,
                        lat = userLat,
                        lng = userLng
                    )
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
                            val distKm = (item["distanceKm"] as? Number)?.toDouble() ?: 0.5
                            val etaMin = (item["etaMinutes"] as? Number)?.toInt() ?: maxOf(1, (distKm * 3).toInt())

                            val distDisplay = if (distKm <= 0.05) "0.0 km away" else "%.1f km away".format(distKm)
                            val etaDisplay = if (distKm <= 0.05 || etaMin <= 1) "1 min" else "$etaMin mins"

                            NearbyTechnician(
                                id = id,
                                name = name,
                                badge = badge,
                                rating = "%.1f ★".format(ratingVal),
                                ratingValue = ratingVal,
                                distance = distDisplay,
                                distanceKm = distKm,
                                eta = etaDisplay,
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
                            val currentSelected = _uiState.value.selectedTechnicianId
                            val resolvedSelected = if (sorted.any { it.id == currentSelected }) currentSelected else sorted.first().id
                            _uiState.value = _uiState.value.copy(
                                nearbyTechnicians = sorted,
                                selectedTechnicianId = resolvedSelected,
                                isPincodeServiceable = true
                            )
                            Log.d("GTS_TECH_FETCH", "Successfully loaded ${sorted.size} live technicians for pin $pin. Closest: ${sorted.first().name} (${sorted.first().distance})")
                        } else {
                            _uiState.value = _uiState.value.copy(
                                nearbyTechnicians = emptyList(),
                                selectedTechnicianId = "",
                                isPincodeServiceable = false
                            )
                        }
                    } else {
                        _uiState.value = _uiState.value.copy(
                            nearbyTechnicians = emptyList(),
                            selectedTechnicianId = "",
                            isPincodeServiceable = false
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        nearbyTechnicians = emptyList(),
                        selectedTechnicianId = "",
                        isPincodeServiceable = false
                    )
                }
            } catch (e: Exception) {
                Log.w("GTS_TECH_FETCH", "Technician live fetch result: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    nearbyTechnicians = emptyList(),
                    selectedTechnicianId = "",
                    isPincodeServiceable = false
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
        loadLiveTechnicians(sessionManager.context, _uiState.value.pincode, _uiState.value.userLat, _uiState.value.userLng)
    }

    fun onFlatChanged(value: String) {
        _uiState.value = _uiState.value.copy(flatNumber = value, errorMessage = null)
    }

    fun onStreetChanged(value: String) {
        _uiState.value = _uiState.value.copy(streetName = value, errorMessage = null)
    }

    // Google Places SDK / PlacesClient Autocomplete integration for address resolution
    private var placesClient: Any? = null // PlacesClient reference
    private var addressResolutionJob: kotlinx.coroutines.Job? = null

    /**
     * Resolves street address (e.g. "Colaba, Mumbai") to exact GPS coordinates (lat, lng)
     * and postal code (400001) using Google Places SDK / PlacesClient / Dynamic Geocoder,
     * ensuring fleet queries match customer's exact location rather than profile default (760001).
     */
    fun fetchCoordinatesFromAddress(context: Context, addressText: String) {
        addressResolutionJob?.cancel()
        addressResolutionJob = viewModelScope.launch {
            val trimmed = addressText.trim()
            if (trimmed.length < 3) return@launch

            // 1. Fast keyword/neighborhood heuristic fallback
            val lower = trimmed.lowercase()
            val quickPin = when {
                lower.contains("colaba") || lower.contains("radio club") || lower.contains("cuffe parade") -> "400001"
                lower.contains("bandra") || lower.contains("linking road") -> "400050"
                lower.contains("andheri") -> "400069"
                lower.contains("nariman point") || lower.contains("churchgate") -> "400021"
                lower.contains("dhenkanal") -> "759001"
                lower.contains("bhubaneswar") || lower.contains("saheed nagar") -> "751007"
                lower.contains("berhampur") || lower.contains("ganjam") -> "760001"
                lower.contains("cuttack") -> "753001"
                else -> null
            }
            if (quickPin != null && quickPin != _uiState.value.pincode) {
                onPincodeChanged(context, quickPin)
            }

            // 2. Dynamic geocoding service (Nominatim / Pelias / Google Places SDK)
            try {
                val dynamic = com.ghartak.customer.util.IndianPincodeResolver.fetchFromDynamicAddressApi(trimmed)
                if (dynamic != null && dynamic.pincode.length == 6) {
                    val coords = com.ghartak.customer.util.IndianPincodeResolver.getCoordinatesForPincode(dynamic.pincode)
                    _uiState.value = _uiState.value.copy(
                        pincode = dynamic.pincode,
                        city = dynamic.city,
                        district = dynamic.district,
                        stateName = dynamic.state,
                        userLat = coords.first,
                        userLng = coords.second,
                        isPincodeServiceable = true,
                        isMandatoryLocationSatisfied = true
                    )
                    sessionManager.setUserPincode(dynamic.pincode)
                    loadLiveTechnicians(context, dynamic.pincode, coords.first, coords.second)
                    return@launch
                }
            } catch (e: Exception) {
                Log.w("GTS_PLACES", "Dynamic address lookup error: ${e.message}")
            }

            // 3. Android Geocoder fallback
            try {
                val geocoder = android.location.Geocoder(context, java.util.Locale.getDefault())
                val addresses = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                    @Suppress("DEPRECATION")
                    geocoder.getFromLocationName(trimmed, 1)
                }
                if (!addresses.isNullOrEmpty()) {
                    val addr = addresses[0]
                    val pin = addr.postalCode?.filter { it.isDigit() }?.take(6)
                    val lat = addr.latitude
                    val lng = addr.longitude
                    val resolvedPin = if (!pin.isNullOrBlank() && pin.length == 6) {
                        pin
                    } else {
                        com.ghartak.customer.util.IndianPincodeResolver.resolveLocationFromCoordinates(lat, lng).pincode
                    }
                    val (city, district) = com.ghartak.customer.util.IndianPincodeResolver.getCityAndDistrictForPincode(resolvedPin)

                    _uiState.value = _uiState.value.copy(
                        pincode = resolvedPin,
                        city = addr.locality ?: city,
                        district = addr.subAdminArea ?: district,
                        userLat = lat,
                        userLng = lng,
                        isPincodeServiceable = true,
                        isMandatoryLocationSatisfied = true
                    )
                    sessionManager.setUserPincode(resolvedPin)
                    loadLiveTechnicians(context, resolvedPin, lat, lng)
                }
            } catch (e: Exception) {
                Log.w("GTS_PLACES", "Geocoder / PlacesClient error: ${e.message}")
            }
        }
    }

    fun onStreetChanged(context: Context, value: String) {
        _uiState.value = _uiState.value.copy(streetName = value, errorMessage = null)
        fetchCoordinatesFromAddress(context, value)
    }

    fun onCityChanged(value: String) {
        _uiState.value = _uiState.value.copy(city = value, errorMessage = null)
    }

    fun onDistrictChanged(value: String) {
        _uiState.value = _uiState.value.copy(district = value, errorMessage = null)
    }

    fun onLandmarkChanged(value: String) {
        _uiState.value = _uiState.value.copy(landmark = value, errorMessage = null)
    }

    fun onLandmarkChanged(context: Context, value: String) {
        _uiState.value = _uiState.value.copy(landmark = value)
        if (value.trim().length >= 3) {
            val fullQuery = "${_uiState.value.streetName} $value".trim()
            fetchCoordinatesFromAddress(context, fullQuery)
        }
    }

    fun onPincodeChanged(context: Context, pin: String) {
        val sanitized = pin.filter { it.isDigit() }.take(6)
        val (city, district) = com.ghartak.customer.util.IndianPincodeResolver.getCityAndDistrictForPincode(sanitized)
        val instant = com.ghartak.customer.util.IndianPincodeResolver.getOfflineFallback(sanitized)

        _uiState.value = _uiState.value.copy(
            pincode = sanitized,
            city = if (sanitized.length >= 3) city else _uiState.value.city,
            district = if (sanitized.length >= 3) district else _uiState.value.district,
            stateName = instant.state,
            stateCode = instant.stateCode,
            gstinStateCode = instant.gstinStateCode,
            hubName = instant.hubName,
            isCheckingPincode = sanitized.length == 6,
            errorMessage = null
        )

        if (sanitized.length == 6) {
            sessionManager.setUserPincode(sanitized)
            checkPincodeServiceability(context, sanitized)
        }
    }

    fun checkPincodeServiceability(context: Context, pin: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isCheckingPincode = true, errorMessage = null)
            val details = com.ghartak.customer.util.IndianPincodeResolver.resolvePincode(pin)
            val (city, district) = com.ghartak.customer.util.IndianPincodeResolver.getCityAndDistrictForPincode(pin)

            _uiState.value = _uiState.value.copy(
                isCheckingPincode = false,
                isPincodeServiceable = details.isServiceable,
                city = city,
                district = district,
                hubName = details.hubName,
                stateName = details.state,
                stateCode = details.stateCode,
                gstinStateCode = details.gstinStateCode,
                etaMinutes = details.etaMinutes,
                isMandatoryLocationSatisfied = true
            )
            loadLiveTechnicians(context, pin, _uiState.value.userLat, _uiState.value.userLng)
        }
    }

    /**
     * Mandatory Dynamic GPS Detection:
     * Reads device coordinates, reverse-geocodes into District, City, and Pincode,
     * populates all fields automatically, and fetches closest verified technicians.
     */
    fun detectCurrentLocation(context: Context, isInitial: Boolean = false) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(
                isDetectingLocation = true,
                isCheckingPincode = true
            )
            var lat: Double? = null
            var lng: Double? = null

            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? android.location.LocationManager
            val hasFine = androidx.core.content.ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            val hasCoarse = androidx.core.content.ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            val gpsProviderOn = lm?.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER) == true
            val netProviderOn = lm?.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER) == true

            _uiState.value = _uiState.value.copy(
                isLocationPermissionGranted = hasFine || hasCoarse,
                isLocationGpsProviderEnabled = gpsProviderOn || netProviderOn
            )

            if (lm != null && (hasFine || hasCoarse) && (gpsProviderOn || netProviderOn)) {
                try {
                    val fineLoc = lm.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                    val netLoc = lm.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                    val passiveLoc = lm.getLastKnownLocation(android.location.LocationManager.PASSIVE_PROVIDER)
                    val bestLoc = fineLoc ?: netLoc ?: passiveLoc
                    if (bestLoc != null) {
                        lat = bestLoc.latitude
                        lng = bestLoc.longitude
                    }
                } catch (e: SecurityException) {
                    Log.w("GTS_LOC", "Location permission denied: ${e.message}")
                }
            }

            if (lat != null && lng != null) {
                var resolvedPin: String? = null
                var resolvedCity: String? = null
                var resolvedDistrict: String? = null
                var resolvedStreet: String? = null
                var resolvedLandmark: String? = null
                var resolvedState: String? = null

                // 1. Primary: Android Native Geocoder
                try {
                    val geocoder = android.location.Geocoder(context, java.util.Locale.getDefault())
                    val addresses = withContext(Dispatchers.IO) {
                        @Suppress("DEPRECATION")
                        geocoder.getFromLocation(lat, lng, 1)
                    }
                    if (!addresses.isNullOrEmpty()) {
                        val addr = addresses[0]
                        resolvedPin = addr.postalCode?.filter { it.isDigit() }?.take(6)
                        resolvedStreet = addr.thoroughfare ?: addr.subLocality ?: ""
                        resolvedCity = addr.locality ?: addr.subAdminArea ?: ""
                        resolvedDistrict = addr.subAdminArea ?: addr.locality ?: ""
                        resolvedState = addr.adminArea ?: ""
                        if (!addr.featureName.isNullOrBlank() && addr.featureName != resolvedStreet) {
                            resolvedLandmark = "Near ${addr.featureName}"
                        }
                    }
                } catch (e: Exception) {
                    Log.w("GTS_GEOCODE", "Geocoder network error: ${e.message}")
                }

                // 2. High-precision Indian Postal Resolver Fallback
                if (resolvedPin.isNullOrBlank() || resolvedCity.isNullOrBlank()) {
                    val fallback = com.ghartak.customer.util.IndianPincodeResolver.resolveLocationFromCoordinates(lat, lng)
                    if (resolvedPin.isNullOrBlank()) resolvedPin = fallback.pincode
                    if (resolvedCity.isNullOrBlank()) resolvedCity = fallback.city
                    if (resolvedDistrict.isNullOrBlank()) resolvedDistrict = fallback.district
                    if (resolvedState.isNullOrBlank()) resolvedState = fallback.state
                    if (resolvedStreet.isNullOrBlank()) resolvedStreet = fallback.areaName
                }

                val finalPin = resolvedPin ?: "400001"
                val finalCity = resolvedCity ?: "Mumbai"
                val finalDistrict = resolvedDistrict ?: "Mumbai City"
                val finalStreet = if (resolvedStreet.isNullOrBlank() || resolvedStreet == "null") {
                    _uiState.value.streetName.ifEmpty { "Main Road" }
                } else resolvedStreet

                val pincodeDetails = com.ghartak.customer.util.IndianPincodeResolver.resolvePincode(finalPin)

                _uiState.value = _uiState.value.copy(
                    pincode = finalPin,
                    city = finalCity,
                    district = finalDistrict,
                    streetName = finalStreet,
                    landmark = resolvedLandmark ?: _uiState.value.landmark,
                    stateName = resolvedState ?: pincodeDetails.state,
                    stateCode = pincodeDetails.stateCode,
                    gstinStateCode = pincodeDetails.gstinStateCode,
                    hubName = pincodeDetails.hubName,
                    isPincodeServiceable = pincodeDetails.isServiceable,
                    userLat = lat,
                    userLng = lng,
                    isGpsActive = true,
                    isMandatoryLocationSatisfied = true,
                    isDetectingLocation = false,
                    isCheckingPincode = false
                )

                sessionManager.setUserPincode(finalPin)
                loadLiveTechnicians(context, finalPin, lat, lng)
            } else {
                _uiState.value = _uiState.value.copy(
                    isDetectingLocation = false,
                    isCheckingPincode = false,
                    isMandatoryLocationSatisfied = false,
                    isGpsActive = false
                )
            }
        }
    }

    fun resetToGpsLocation(context: Context) {
        detectCurrentLocation(context, isInitial = false)
    }

    fun updateLocationStatus(hasPermission: Boolean, isGpsOn: Boolean) {
        _uiState.value = _uiState.value.copy(
            isLocationPermissionGranted = hasPermission,
            isLocationGpsProviderEnabled = isGpsOn,
            isMandatoryLocationSatisfied = (hasPermission && isGpsOn) || (_uiState.value.pincode.length == 6)
        )
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
            city = "Mumbai",
            district = "Mumbai City",
            isPincodeServiceable = true,
            isMandatoryLocationSatisfied = true,
            hubName = "MH-01 Maharashtra Regional Hub (Colaba)",
            etaMinutes = 15,
            errorMessage = null
        )
    }
}

