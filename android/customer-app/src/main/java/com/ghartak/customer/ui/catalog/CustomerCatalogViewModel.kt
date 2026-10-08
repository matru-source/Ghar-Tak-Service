package com.ghartak.customer.ui.catalog

import androidx.lifecycle.ViewModel
import com.ghartak.customer.data.model.ServiceItem
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class CatalogUiState(
    val userName: String = "John",
    val selectedCategory: String = "All",
    val activePincode: String = "400001",
    val activePincodeCity: String = "Colaba, Mumbai",
    val searchQuery: String = "",
    val hasActiveJob: Boolean = true,
    val activeJobId: String = "job_mh_live_01",
    val activeJobTitle: String = "Fan Installation",
    val activeJobTechnician: String = "Rajesh (En Route)",
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
        val allServices = listOf(
            ServiceItem(
                id = "srv_mcb_replace",
                code = "MCB-REPLACE-01",
                title = "Full Home MCB Panel Replacement & Earth Leakage Fix",
                description = "Replacement of faulty main distribution board, installation of ELCB/RCCB earth leakage protection with 1000V insulated safety protocol.",
                category = "MCB & Panels",
                priceInr = 2499.0,
                durationMinutes = 60,
                rating = 4.9,
                isHighVoltageProtocol = true,
                warrantyMonths = 12
            ),
            ServiceItem(
                id = "srv_emergency_short",
                code = "EMERGENCY-SHORT-01",
                title = "Emergency Short Circuit & Burnt Wire Repair",
                description = "Immediate 60-second dispatch electrician for sparking sockets, burnt insulation, burning smell, or sudden phase drop.",
                category = "Emergency Tripping",
                priceInr = 699.0,
                durationMinutes = 30,
                rating = 4.9,
                isHighVoltageProtocol = true,
                warrantyMonths = 6
            ),
            ServiceItem(
                id = "srv_inverter_bypass",
                code = "INVERTER-BYPASS-01",
                title = "Inverter Backup Bypass & Heavy Load Rewiring",
                description = "Dedicated circuit isolation for AC, geyser, and heavy loads to prevent inverter battery overload with neat routing.",
                category = "Wiring & Rewiring",
                priceInr = 1850.0,
                durationMinutes = 45,
                rating = 4.8,
                isHighVoltageProtocol = true,
                warrantyMonths = 12
            ),
            ServiceItem(
                id = "srv_safety_audit",
                code = "SAFETY-AUDIT-01",
                title = "Complete Home Electrical Safety & Earthing Audit",
                description = "Comprehensive earthing resistance test (< 2 Ohms), phase load balancing, thermal hotspot check on all breakers.",
                category = "Safety Audit",
                priceInr = 1299.0,
                durationMinutes = 40,
                rating = 5.0,
                isHighVoltageProtocol = true,
                warrantyMonths = 12
            ),
            ServiceItem(
                id = "srv_modular_switch",
                code = "SWITCH-MODULAR-01",
                title = "Smart Modular Switchboard & Dimmer Upgrade",
                description = "Installation of high-durability polycarbonate modular switch plates, smart touch dimmers, and surge-protected sockets.",
                category = "MCB & Panels",
                priceInr = 899.0,
                durationMinutes = 35,
                rating = 4.8,
                isHighVoltageProtocol = false,
                warrantyMonths = 12
            ),
            ServiceItem(
                id = "srv_fan_install",
                code = "FAN-INSTALL-01",
                title = "Ceiling Fan / Chandelier Safe Anchor Mount",
                description = "Heavy duty ceiling anchor bolt drilling, vibration-free balancing, and concealed regulator wiring.",
                category = "Appliance Fix",
                priceInr = 349.0,
                durationMinutes = 25,
                rating = 4.9,
                isHighVoltageProtocol = false,
                warrantyMonths = 6
            )
        )

        _uiState.value = _uiState.value.copy(
            userName = sessionManager.getUserName(),
            services = allServices,
            filteredServices = allServices
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
            val matchesCategory = when (cat) {
                "All" -> true
                "Repair" -> item.category in listOf("MCB & Panels", "Emergency Tripping", "Wiring & Rewiring")
                "Installation" -> item.category in listOf("Appliance Fix", "Wiring & Rewiring") || item.title.contains("Install", ignoreCase = true)
                "Maintenance" -> item.category == "Safety Audit" || item.title.contains("Audit", ignoreCase = true)
                "Emergency" -> item.category == "Emergency Tripping" || item.isHighVoltageProtocol
                else -> item.category.equals(cat, ignoreCase = true)
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

    fun logout() {
        sessionManager.clearSession()
    }
}
