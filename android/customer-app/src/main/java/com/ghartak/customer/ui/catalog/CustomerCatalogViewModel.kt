package com.ghartak.customer.ui.catalog

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.model.ServiceItem
import com.ghartak.customer.data.model.ServiceCatalogRegistry
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class CatalogUiState(
    val userName: String = "Customer",
    val userPhone: String = "",
    val userEmail: String = "",
    val userAddress: String = "",
    val selectedCategory: String = "All",
    val categories: List<String> = listOf("All") + ServiceCatalogRegistry.CATEGORIES,
    val activePincode: String = "760001",
    val activePincodeCity: String = "Berhampur, Odisha",
    val searchQuery: String = "",
    val hasActiveJob: Boolean = false,
    val activeJobId: String = "",
    val activeJobTitle: String = "",
    val activeJobTechnician: String = "",
    val activeJobStatus: String = "",
    val activeJobEta: String = "15 mins",
    val services: List<ServiceItem> = emptyList(),
    val filteredServices: List<ServiceItem> = emptyList(),
    val cartItems: List<ServiceItem> = emptyList(),
    val cartTotalInr: Double = 0.0,
    val isLoadingServices: Boolean = false,
    val isServerSynced: Boolean = false
)

class CustomerCatalogViewModel(
    private val sessionManager: SessionManager,
    private val context: android.content.Context? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow(CatalogUiState())
    val uiState: StateFlow<CatalogUiState> = _uiState.asStateFlow()

    init {
        loadCatalog()
        syncCatalogFromServer()
    }

    fun loadCatalog() {
        val currentName = sessionManager.getUserName()
        val currentPhone = sessionManager.getUserPhone()
        val currentEmail = sessionManager.getUserEmail()
        val currentAddress = sessionManager.getUserAddress()
        val currentPincode = sessionManager.getUserPincode()

        val allServices = ServiceCatalogRegistry.allServices
        val hasJob = sessionManager.hasActiveJob()
        val jobStatus = sessionManager.getActiveJobStatus()
        val rawTechName = sessionManager.getActiveJobTechnicianName().ifEmpty { "Service Specialist" }
        val techLabel = if (jobStatus == "ASSIGNED" || jobStatus == "PENDING_DISPATCH") {
            "$rawTechName (Awaiting Confirmation)"
        } else {
            "$rawTechName (En Route)"
        }

        _uiState.value = _uiState.value.copy(
            userName = currentName,
            userPhone = currentPhone,
            userEmail = currentEmail,
            userAddress = currentAddress,
            activePincode = currentPincode.ifEmpty { "760001" },
            activePincodeCity = com.ghartak.customer.util.IndianPincodeResolver.getAreaForPincode(currentPincode.ifEmpty { "760001" }),
            hasActiveJob = hasJob,
            activeJobId = if (hasJob) sessionManager.getActiveJobId() else "",
            activeJobTitle = if (hasJob) sessionManager.getActiveJobTitle().ifEmpty { "Doorstep Service" } else "",
            activeJobTechnician = if (hasJob) techLabel else "",
            activeJobStatus = if (hasJob) jobStatus else "",
            services = allServices,
            filteredServices = allServices.filterNot { it.isPaused }
        )
    }

    fun syncCatalogFromServer(contextOverride: android.content.Context? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingServices = true)

            val ctx = contextOverride ?: context ?: try {
                com.ghartak.customer.CustomerApplication.instance.applicationContext
            } catch (e: Exception) {
                null
            }

            if (ctx == null) {
                _uiState.value = _uiState.value.copy(isLoadingServices = false)
                return@launch
            }

            try {
                val api = com.ghartak.customer.data.api.ApiClient.getService(ctx)

                // 1. Fetch Categories dynamically from /api/services/categories
                val fetchedCategoryNames = mutableListOf<String>()
                try {
                    val catRes = kotlinx.coroutines.withTimeoutOrNull(7000L) {
                        api.getCategories()
                    }
                    if (catRes != null && catRes.isSuccessful) {
                        val body = catRes.body()?.data
                        val catArray = when {
                            body == null -> null
                            body.isJsonArray -> body.asJsonArray
                            body.isJsonObject && body.asJsonObject.has("categories") && body.asJsonObject.get("categories").isJsonArray -> {
                                body.asJsonObject.getAsJsonArray("categories")
                            }
                            else -> null
                        }
                        catArray?.forEach { elem ->
                            if (elem.isJsonObject) {
                                val name = elem.asJsonObject.get("name")?.asString
                                if (!name.isNullOrBlank()) {
                                    fetchedCategoryNames.add(name.trim())
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    android.util.Log.d("GTS_CATALOG", "Category sync notice: ${e.message}")
                }

                // 2. Fetch Services dynamically from /api/services
                val svcRes = kotlinx.coroutines.withTimeoutOrNull(9000L) {
                    api.getServices()
                }

                if (svcRes != null && svcRes.isSuccessful) {
                    val body = svcRes.body()?.data
                    val svcArray = when {
                        body == null -> null
                        body.isJsonArray -> body.asJsonArray
                        body.isJsonObject && body.asJsonObject.has("services") && body.asJsonObject.get("services").isJsonArray -> {
                            body.asJsonObject.getAsJsonArray("services")
                        }
                        else -> null
                    }

                    if (svcArray != null && svcArray.size() > 0) {
                        // Index local services for merging
                        val localServices = ServiceCatalogRegistry.allServices
                        val localMapById = localServices.associateBy { it.id.lowercase() }.toMutableMap()
                        val localMapByCode = localServices.associateBy { it.code.lowercase() }
                        val localMapByTitle = localServices.associateBy { it.title.trim().lowercase() }

                        val serverProcessed = mutableListOf<ServiceItem>()
                        val serverProcessedIds = mutableSetOf<String>()

                        svcArray.forEach { elem ->
                            if (elem.isJsonObject) {
                                val obj = elem.asJsonObject
                                val id = obj.get("id")?.asString ?: ""
                                val code = obj.get("code")?.asString ?: ""
                                val title = obj.get("title")?.asString ?: ""
                                val catName = obj.get("categoryName")?.asString
                                    ?: obj.get("category")?.asString
                                    ?: "General"
                                val price = obj.get("basePriceInr")?.asDouble
                                    ?: obj.get("pricing")?.asJsonObject?.get("baseAmount")?.asDouble
                                    ?: 299.0
                                val duration = obj.get("estimatedDurationMinutes")?.asInt ?: 30
                                val isPaused = obj.get("isPaused")?.asBoolean ?: false
                                val isEmergency = obj.get("isEmergencySosEligible")?.asBoolean ?: false
                                val desc = obj.get("description")?.asString ?: ""

                                if (catName.isNotBlank() && !fetchedCategoryNames.contains(catName)) {
                                    fetchedCategoryNames.add(catName.trim())
                                }

                                // Find matching local item by ID, code, or title
                                val matched = localMapById[id.lowercase()]
                                    ?: (if (code.isNotBlank()) localMapByCode[code.lowercase()] else null)
                                    ?: (if (title.isNotBlank()) localMapByTitle[title.trim().lowercase()] else null)

                                if (matched != null) {
                                    val updated = matched.copy(
                                        priceInr = price,
                                        durationMinutes = if (duration > 0) duration else matched.durationMinutes,
                                        category = if (catName != "General") catName else matched.category,
                                        title = if (title.isNotBlank()) title else matched.title,
                                        isHighVoltageProtocol = isEmergency || matched.isHighVoltageProtocol,
                                        isPaused = isPaused
                                    )
                                    serverProcessed.add(updated)
                                    serverProcessedIds.add(matched.id.lowercase())
                                    localMapById.remove(matched.id.lowercase())
                                } else if (title.isNotBlank()) {
                                    // New service added from /partner/services
                                    val newItem = ServiceItem(
                                        id = id.ifBlank { "srv_${System.currentTimeMillis()}" },
                                        code = code.ifBlank { "GTS-SRV-${id}" },
                                        title = title,
                                        description = desc.ifBlank { "Professional $title by verified $catName specialists" },
                                        category = catName,
                                        priceInr = price,
                                        durationMinutes = duration,
                                        rating = 4.9,
                                        isHighVoltageProtocol = isEmergency,
                                        warrantyMonths = 6,
                                        isPaused = isPaused
                                    )
                                    serverProcessed.add(newItem)
                                    serverProcessedIds.add(newItem.id.lowercase())
                                }
                            }
                        }

                        // Add remaining local services that weren't overridden by server
                        val remainingLocal = localMapById.values.filterNot { item ->
                            serverProcessedIds.contains(item.id.lowercase())
                        }

                        val mergedServices = (serverProcessed + remainingLocal).distinctBy { it.id }

                        val combinedCategories = (listOf("All") + fetchedCategoryNames + ServiceCatalogRegistry.CATEGORIES + mergedServices.map { it.category })
                            .map { it.trim() }
                            .filter { it.isNotBlank() }
                            .distinct()

                        _uiState.value = _uiState.value.copy(
                            services = mergedServices,
                            categories = combinedCategories,
                            isLoadingServices = false,
                            isServerSynced = true
                        )
                        applyFilters()
                        return@launch
                    }
                }

                // If services fetch failed or returned empty, apply any fetched categories
                if (fetchedCategoryNames.isNotEmpty()) {
                    val combinedCategories = (listOf("All") + fetchedCategoryNames + ServiceCatalogRegistry.CATEGORIES)
                        .map { it.trim() }
                        .filter { it.isNotBlank() }
                        .distinct()
                    _uiState.value = _uiState.value.copy(
                        categories = combinedCategories,
                        isLoadingServices = false
                    )
                } else {
                    _uiState.value = _uiState.value.copy(isLoadingServices = false)
                }
            } catch (e: Exception) {
                android.util.Log.e("GTS_CATALOG", "Catalog server sync exception: ${e.message}", e)
                _uiState.value = _uiState.value.copy(isLoadingServices = false)
            }
        }
    }

    fun updateActiveJob(id: String, title: String, technician: String, eta: String = "15 mins") {
        _uiState.value = _uiState.value.copy(
            hasActiveJob = true,
            activeJobId = id,
            activeJobTitle = title,
            activeJobTechnician = "$technician (En Route)",
            activeJobEta = eta
        )
    }

    fun setSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        applyFilters()
    }

    fun selectCategory(category: String) {
        val newCategory = if (_uiState.value.selectedCategory == category) "All" else category
        _uiState.value = _uiState.value.copy(selectedCategory = newCategory)
        applyFilters()
    }

    private fun applyFilters() {
        val cat = _uiState.value.selectedCategory
        val query = _uiState.value.searchQuery.trim().lowercase()
        val all = _uiState.value.services

        val filtered = all.filter { item ->
            // Exclude paused services if franchise partner paused them
            if (item.isPaused) return@filter false

            val matchesCategory = if (cat.equals("All", ignoreCase = true)) {
                true
            } else {
                item.category.equals(cat, ignoreCase = true)
            }

            val matchesQuery = query.isEmpty() ||
                item.title.lowercase().contains(query) ||
                item.description.lowercase().contains(query) ||
                item.category.lowercase().contains(query)

            matchesCategory && matchesQuery
        }

        _uiState.value = _uiState.value.copy(filteredServices = filtered)
    }

    fun addToCart(service: ServiceItem) {
        if (!_uiState.value.cartItems.any { it.id == service.id }) {
            val updated = _uiState.value.cartItems + service
            val total = updated.sumOf { it.priceInr }
            _uiState.value = _uiState.value.copy(
                cartItems = updated,
                cartTotalInr = total
            )
        }
    }

    fun removeFromCart(service: ServiceItem) {
        val updated = _uiState.value.cartItems.filterNot { it.id == service.id }
        val total = updated.sumOf { it.priceInr }
        _uiState.value = _uiState.value.copy(
            cartItems = updated,
            cartTotalInr = total
        )
    }

    fun clearCart() {
        _uiState.value = _uiState.value.copy(cartItems = emptyList(), cartTotalInr = 0.0)
    }

    fun updateProfile(name: String, email: String, phone: String, address: String) {
        sessionManager.updateProfile(name, email, phone, address)
        _uiState.value = _uiState.value.copy(
            userName = name,
            userEmail = email,
            userPhone = phone,
            userAddress = address
        )

        viewModelScope.launch {
            try {
                val api = com.ghartak.customer.data.api.ApiClient.getService(sessionManager.context)
                val customerId = sessionManager.getUserId().ifEmpty { phone }
                val payload = mapOf(
                    "customerId" to customerId,
                    "fullName" to name,
                    "email" to email,
                    "phone" to phone,
                    "address" to address,
                    "defaultAddressLine" to address,
                    "defaultPincode" to sessionManager.getUserPincode()
                )
                val response = api.updateCustomerProfile(payload)
                if (response.isSuccessful) {
                    android.util.Log.d("CustomerCatalogVM", "Customer profile synced to server successfully")
                } else {
                    android.util.Log.w("CustomerCatalogVM", "Customer profile sync returned code ${response.code()}")
                }
            } catch (e: Exception) {
                android.util.Log.w("CustomerCatalogVM", "Failed to sync customer profile to server: ${e.message}")
            }
        }
    }

    fun logout() {
        sessionManager.clearSession()
    }
}
