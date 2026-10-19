package com.ghartak.customer.ui.catalog

import androidx.lifecycle.ViewModel
import com.ghartak.customer.data.model.ServiceItem
import com.ghartak.customer.data.model.ServiceCatalogRegistry
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class CatalogUiState(
    val userName: String = "Customer",
    val userPhone: String = "",
    val userEmail: String = "",
    val userAddress: String = "",
    val selectedCategory: String = "All",
    val activePincode: String = "400001",
    val activePincodeCity: String = "Colaba, Mumbai",
    val searchQuery: String = "",
    val hasActiveJob: Boolean = false,
    val activeJobId: String = "",
    val activeJobTitle: String = "",
    val activeJobTechnician: String = "",
    val activeJobEta: String = "15 mins",
    val services: List<ServiceItem> = emptyList(),
    val filteredServices: List<ServiceItem> = emptyList(),
    val cartItems: List<ServiceItem> = emptyList(),
    val cartTotalInr: Double = 0.0
)

class CustomerCatalogViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(CatalogUiState())
    val uiState: StateFlow<CatalogUiState> = _uiState.asStateFlow()

    init {
        loadCatalog()
    }

    fun loadCatalog() {
        val currentName = sessionManager.getUserName()
        val currentPhone = sessionManager.getUserPhone()
        val currentEmail = sessionManager.getUserEmail()
        val currentAddress = sessionManager.getUserAddress()
        val currentPincode = sessionManager.getUserPincode()

        val allServices = ServiceCatalogRegistry.allServices
        val hasJob = sessionManager.hasActiveJob()

        _uiState.value = _uiState.value.copy(
            userName = currentName,
            userPhone = currentPhone,
            userEmail = currentEmail,
            userAddress = currentAddress,
            activePincode = currentPincode.ifEmpty { "760001" },
            hasActiveJob = hasJob,
            activeJobId = if (hasJob) sessionManager.getActiveJobId() else "",
            activeJobTitle = if (hasJob) sessionManager.getActiveJobTitle().ifEmpty { "Doorstep Service" } else "",
            activeJobTechnician = if (hasJob) "${sessionManager.getActiveJobTechnicianName().ifEmpty { "Electrician" }} (En Route)" else "",
            services = allServices,
            filteredServices = allServices
        )
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
    }

    fun logout() {
        sessionManager.clearSession()
    }
}
