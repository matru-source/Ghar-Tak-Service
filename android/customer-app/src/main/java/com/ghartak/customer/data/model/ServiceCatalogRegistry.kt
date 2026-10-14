package com.ghartak.customer.data.model

object ServiceCatalogRegistry {

    val allServices = listOf(
        ServiceItem(
            id = "srv_fan_install",
            code = "FAN-INSTALL-01",
            title = "Fan Installation",
            description = "Installation of ceiling or wall fan",
            category = "Installation",
            priceInr = 299.0,
            durationMinutes = 35,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_light_install",
            code = "LIGHT-INSTALL-01",
            title = "Light Installation",
            description = "LED / Tubelight installation",
            category = "Installation",
            priceInr = 199.0,
            durationMinutes = 25,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_modular_switch",
            code = "SWITCH-REPAIR-01",
            title = "Switchboard Repair",
            description = "Fix or replace switchboard",
            category = "Repair",
            priceInr = 349.0,
            durationMinutes = 35,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_geyser_install",
            code = "GEYSER-INSTALL-01",
            title = "Geyser Installation",
            description = "Water heater installation",
            category = "Installation",
            priceInr = 499.0,
            durationMinutes = 50,
            rating = 4.9,
            isHighVoltageProtocol = true,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_safety_audit",
            code = "WIRING-CHECK-01",
            title = "House Wiring Checkup",
            description = "Complete electrical safety check",
            category = "Maintenance",
            priceInr = 599.0,
            durationMinutes = 60,
            rating = 5.0,
            isHighVoltageProtocol = true,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_emergency_short",
            code = "EMERGENCY-SHORT-01",
            title = "Emergency Short Circuit & Burnt Wire Repair",
            description = "Immediate 60-second dispatch electrician for sparking sockets, burnt insulation, burning smell, or sudden phase drop.",
            category = "Emergency",
            priceInr = 699.0,
            durationMinutes = 30,
            rating = 4.9,
            isHighVoltageProtocol = true,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_mcb_replace",
            code = "MCB-REPLACE-01",
            title = "Full Home MCB Panel Replacement & Earth Leakage Fix",
            description = "Replacement of faulty main distribution board, installation of ELCB/RCCB earth leakage protection with 1000V insulated safety protocol.",
            category = "Repair",
            priceInr = 2499.0,
            durationMinutes = 60,
            rating = 4.9,
            isHighVoltageProtocol = true,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_inverter_bypass",
            code = "INVERTER-BYPASS-01",
            title = "Inverter Backup Bypass & Heavy Load Rewiring",
            description = "Dedicated circuit isolation for AC, geyser, and heavy loads to prevent inverter battery overload with neat routing.",
            category = "Repair",
            priceInr = 1850.0,
            durationMinutes = 45,
            rating = 4.8,
            isHighVoltageProtocol = true,
            warrantyMonths = 12
        )
    )

    fun findService(id: String?): ServiceItem? {
        if (id.isNullOrBlank()) return null
        return allServices.find { it.id.equals(id, ignoreCase = true) }
    }
}
