package com.ghartak.customer.ui.util

import com.ghartak.customer.R

object ServiceDrawableHelper {
    fun getServiceDrawable(title: String, category: String = ""): Int {
        val t = title.lowercase()
        val c = category.lowercase()
        return when {
            // Plumbing & Water Tank (Matches Water Tank Cleaning & Float Valve Fix, tap, pipe, leak)
            t.contains("tank") || t.contains("valve") || t.contains("water") || t.contains("plumb") ||
                    t.contains("tap") || t.contains("shower") || t.contains("leak") || t.contains("drain") ||
                    t.contains("pipe") || t.contains("toilet") || t.contains("sink") || c.contains("plumb") -> R.drawable.service_plumber

            // Carpentry, Door Locks, Woodwork & Shelving
            t.contains("lock") || t.contains("door") || t.contains("furn") || t.contains("carp") ||
                    t.contains("shelf") || t.contains("wood") || t.contains("hinge") || t.contains("drill") ||
                    c.contains("carp") -> R.drawable.service_carpenter

            // Cleaning, Sanitation & Housekeeping
            t.contains("clean") || t.contains("wash") || t.contains("sofa") || t.contains("pest") ||
                    t.contains("sanit") || t.contains("deep clean") || c.contains("clean") || c.contains("pest") -> R.drawable.service_cleaning

            // Rajmistri, Masonry, Tile & Cement
            t.contains("rajmistri") || t.contains("mason") || t.contains("brick") || t.contains("plaster") ||
                    t.contains("cement") || t.contains("tile") || t.contains("marble") || c.contains("rajmistri") -> R.drawable.service_masonry

            // Painter, Whitewash & Wall Decor
            t.contains("paint") || t.contains("wall") || t.contains("wallpaper") || t.contains("color") ||
                    c.contains("paint") || c.contains("wallpaper") -> R.drawable.service_painter

            // Appliance & AC
            t.contains("ac") || t.contains("air condition") || t.contains("cooler") || t.contains("refrig") ||
                    t.contains("washing") || c.contains("appliance") || c.contains("cool") -> R.drawable.service_appliance

            // Electrical Specific
            t.contains("fan") -> R.drawable.service_fan
            t.contains("light") || t.contains("tube") || t.contains("lamp") -> R.drawable.service_light
            t.contains("switch") || t.contains("board") || t.contains("modular") -> R.drawable.service_switchboard
            t.contains("geyser") || t.contains("heater") -> R.drawable.service_geyser
            t.contains("wire") || t.contains("wiring") || t.contains("checkup") || t.contains("audit") -> R.drawable.service_wiring
            t.contains("mcb") || t.contains("panel") || t.contains("breaker") -> R.drawable.service_switchboard

            // Category fallbacks
            c.contains("wiring") -> R.drawable.service_wiring
            c.contains("electr") -> R.drawable.service_switchboard
            c.contains("repair") -> R.drawable.service_switchboard

            // Default
            else -> R.drawable.service_plumber
        }
    }
}
