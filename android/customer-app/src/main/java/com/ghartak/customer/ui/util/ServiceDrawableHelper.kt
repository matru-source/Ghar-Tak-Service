package com.ghartak.customer.ui.util

import com.ghartak.customer.R

object ServiceDrawableHelper {
    fun getServiceDrawable(title: String, category: String = ""): Int {
        val t = title.lowercase()
        val c = category.lowercase()
        return when {
            t.contains("fan") -> R.drawable.service_fan
            t.contains("light") || t.contains("tube") || t.contains("lamp") -> R.drawable.service_light
            t.contains("switch") || t.contains("board") || t.contains("modular") -> R.drawable.service_switchboard
            t.contains("geyser") || t.contains("heater") -> R.drawable.service_geyser
            t.contains("wire") || t.contains("wiring") || t.contains("checkup") || t.contains("audit") -> R.drawable.service_wiring
            t.contains("mcb") || t.contains("panel") -> R.drawable.service_switchboard
            c.contains("wiring") -> R.drawable.service_wiring
            c.contains("install") -> R.drawable.service_fan
            c.contains("repair") -> R.drawable.service_switchboard
            else -> R.drawable.service_fan
        }
    }
}
