package com.ghartak.customer.data.model

object ServiceCatalogRegistry {

    val CATEGORIES = listOf(
        "Aluminum And Glass Fitting services",
        "Carpenter",
        "CCTV Service",
        "Cleaner",
        "Digital Marketer",
        "Electrician",
        "False Ceiling Service",
        "Gas Stove Service",
        "Generator Technician",
        "Hot And Cool",
        "House Painting Service",
        "IT Service",
        "Laundry Service",
        "Packers & Movers",
        "Pest Control Service",
        "Plumber",
        "Rajmistri",
        "Wallpaper"
    )

    val allServices = listOf(
        // 1. Electrician
        ServiceItem(
            id = "srv_fan_install",
            code = "FAN-INSTALL-01",
            title = "Fan Installation",
            description = "Installation of ceiling or wall fan with safety balancing",
            category = "Electrician",
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
            description = "LED / Tubelight installation & concealed wiring test",
            category = "Electrician",
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
            description = "Fix or replace switchboard, socket, and indicator",
            category = "Electrician",
            priceInr = 349.0,
            durationMinutes = 35,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_safety_audit",
            code = "WIRING-CHECK-01",
            title = "House Wiring Checkup",
            description = "Complete electrical safety check, earthing & leakage diagnosis",
            category = "Electrician",
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
            description = "Immediate dispatch electrician for sparking sockets, burnt insulation or phase drop.",
            category = "Electrician",
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
            description = "Replacement of faulty distribution board with ELCB/RCCB earth leakage protection.",
            category = "Electrician",
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
            description = "Dedicated circuit isolation for heavy loads to prevent inverter battery overload.",
            category = "Electrician",
            priceInr = 1850.0,
            durationMinutes = 45,
            rating = 4.8,
            isHighVoltageProtocol = true,
            warrantyMonths = 12
        ),

        // 2. Plumber
        ServiceItem(
            id = "srv_pipe_leakage",
            code = "PLUMB-LEAK-01",
            title = "Pipe Leakage & Burst Repair",
            description = "Concealed pipeline leakage detection, PVC/CPVC pipe patching and pressure sealing.",
            category = "Plumber",
            priceInr = 349.0,
            durationMinutes = 40,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_tap_fitting",
            code = "PLUMB-TAP-01",
            title = "Tap & Shower Mixer Fitting",
            description = "Installation and servicing of kitchen sinks, bathroom taps, mixer valves & shower heads.",
            category = "Plumber",
            priceInr = 249.0,
            durationMinutes = 30,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_water_tank_clean",
            code = "PLUMB-TANK-01",
            title = "Water Tank Cleaning & Float Valve Fix",
            description = "High-pressure tank sludge clean, antibacterial wash & automatic ball valve replacement.",
            category = "Plumber",
            priceInr = 699.0,
            durationMinutes = 60,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),

        // 3. Carpenter
        ServiceItem(
            id = "srv_door_lock",
            code = "CARP-LOCK-01",
            title = "Door Lock & Handle Fitting",
            description = "Mortise lock, deadbolt, latch repair & digital lock alignment on wooden doors.",
            category = "Carpenter",
            priceInr = 399.0,
            durationMinutes = 45,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_furniture_repair",
            code = "CARP-FURN-01",
            title = "Furniture Repair & Hinge Fix",
            description = "Wardrobe hinge alignment, drawer channel replacement and dining chair/bed tightening.",
            category = "Carpenter",
            priceInr = 499.0,
            durationMinutes = 50,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_custom_shelving",
            code = "CARP-SHELF-01",
            title = "Custom Wood Shelving & Drill Setup",
            description = "Precision wall drilling, floating shelves mounting and modular cabinet adjustment.",
            category = "Carpenter",
            priceInr = 599.0,
            durationMinutes = 45,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),

        // 4. Cleaner
        ServiceItem(
            id = "srv_home_deep_clean",
            code = "CLEAN-DEEP-01",
            title = "Full Home Deep Cleaning",
            description = "Intensive room-by-room scrub, dust removal, floor buffing & sanitization treatment.",
            category = "Cleaner",
            priceInr = 1499.0,
            durationMinutes = 180,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),
        ServiceItem(
            id = "srv_kitchen_clean",
            code = "CLEAN-KITCH-01",
            title = "Kitchen & Bathroom Sanitization",
            description = "Degreasing chimney tiles, stovetop stains, hard water limescale & deep toilet sanitization.",
            category = "Cleaner",
            priceInr = 799.0,
            durationMinutes = 90,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),
        ServiceItem(
            id = "srv_sofa_clean",
            code = "CLEAN-SOFA-01",
            title = "Sofa & Upholstery Shampooing",
            description = "Deep fabric vacuuming, enzyme foam shampooing & stain extraction for couches and chairs.",
            category = "Cleaner",
            priceInr = 599.0,
            durationMinutes = 60,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),

        // 5. Digital Marketer
        ServiceItem(
            id = "srv_gmb_seo",
            code = "MKT-GMB-01",
            title = "Google Business Profile & Local SEO",
            description = "Setup, verification, local ranking optimization & 5-star customer review workflow.",
            category = "Digital Marketer",
            priceInr = 999.0,
            durationMinutes = 120,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 3
        ),
        ServiceItem(
            id = "srv_social_ads",
            code = "MKT-ADS-01",
            title = "Social Media Marketing Campaign",
            description = "Targeted Meta & Instagram ad creatives, audience filtering & lead funnel setup.",
            category = "Digital Marketer",
            priceInr = 1499.0,
            durationMinutes = 180,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),
        ServiceItem(
            id = "srv_lead_gen",
            code = "MKT-LEAD-01",
            title = "Local Lead Generation & Ads Setup",
            description = "High-converting WhatsApp click-to-chat ads & local neighborhood geo-fenced promotion.",
            category = "Digital Marketer",
            priceInr = 1999.0,
            durationMinutes = 240,
            rating = 5.0,
            isHighVoltageProtocol = false,
            warrantyMonths = 3
        ),

        // 6. False Ceiling Service
        ServiceItem(
            id = "srv_gypsum_ceiling",
            code = "CEIL-GYP-01",
            title = "Gypsum False Ceiling Installation",
            description = "Moisture-resistant gypsum board fitting, framing channels and level laser alignment.",
            category = "False Ceiling Service",
            priceInr = 1299.0,
            durationMinutes = 120,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_grid_ceiling_repair",
            code = "CEIL-REPAIR-01",
            title = "Ceiling Crack & Grid Repair",
            description = "Patching sagging false ceiling tiles, re-anchoring suspension rods & seamless putty fix.",
            category = "False Ceiling Service",
            priceInr = 649.0,
            durationMinutes = 60,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_cove_led",
            code = "CEIL-COVE-01",
            title = "LED Cove Lighting Concealment",
            description = "Precision cutting for warm LED strip lights, profile diffuser and hidden adapter wiring.",
            category = "False Ceiling Service",
            priceInr = 499.0,
            durationMinutes = 45,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),

        // 7. Gas Stove Service
        ServiceItem(
            id = "srv_stove_burner_clean",
            code = "GAS-CLEAN-01",
            title = "Gas Stove Burner Deep Cleaning",
            description = "Brass burner carbon removal, nozzle pin descaling, and yellow flame to blue flame tune-up.",
            category = "Gas Stove Service",
            priceInr = 299.0,
            durationMinutes = 35,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 3
        ),
        ServiceItem(
            id = "srv_gas_leak_check",
            code = "GAS-LEAK-01",
            title = "Pipeline Gas Leakage Diagnostic",
            description = "Suraksha rubber hose safety check, regulator pressure test & leak soap bubbler diagnostic.",
            category = "Gas Stove Service",
            priceInr = 399.0,
            durationMinutes = 30,
            rating = 5.0,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_auto_ignition_hob",
            code = "GAS-HOB-01",
            title = "Auto-Ignition Hob Repair",
            description = "Spark plug ignition wiring, generator replacement & knob valve greasing for glass hobs.",
            category = "Gas Stove Service",
            priceInr = 549.0,
            durationMinutes = 45,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),

        // 8. Generator Technician
        ServiceItem(
            id = "srv_dg_routine_service",
            code = "GEN-ROUTINE-01",
            title = "Diesel Generator Servicing & Oil Change",
            description = "Engine oil change, air/fuel filter replacement, fan belt tension check & trial run.",
            category = "Generator Technician",
            priceInr = 1299.0,
            durationMinutes = 90,
            rating = 4.9,
            isHighVoltageProtocol = true,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_amf_panel",
            code = "GEN-AMF-01",
            title = "AMF Panel Auto Changeover Setup",
            description = "Auto mains failure relay calibration, contactor check & automatic start/stop sync.",
            category = "Generator Technician",
            priceInr = 1899.0,
            durationMinutes = 90,
            rating = 4.9,
            isHighVoltageProtocol = true,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_dg_battery_repair",
            code = "GEN-BATT-01",
            title = "DG Battery & Alternator Repair",
            description = "Starter motor carbon brush check, dynamo output charging test & terminal de-corrosion.",
            category = "Generator Technician",
            priceInr = 899.0,
            durationMinutes = 60,
            rating = 4.8,
            isHighVoltageProtocol = true,
            warrantyMonths = 6
        ),

        // 9. Hot And Cool
        ServiceItem(
            id = "srv_geyser_install",
            code = "GEYSER-INSTALL-01",
            title = "Geyser Installation & Heating Repair",
            description = "Instant or storage water heater mounting, safety valve fitting & thermostat test.",
            category = "Hot And Cool",
            priceInr = 499.0,
            durationMinutes = 50,
            rating = 4.9,
            isHighVoltageProtocol = true,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_ac_jet_service",
            code = "AC-JET-01",
            title = "AC Jet Servicing & Gas Top-up",
            description = "High pressure jet pump wash for indoor/outdoor coils, drain cleaning & refrigerant refill.",
            category = "Hot And Cool",
            priceInr = 899.0,
            durationMinutes = 60,
            rating = 4.9,
            isHighVoltageProtocol = true,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_fridge_cooling",
            code = "FRIDGE-DIAG-01",
            title = "Refrigerator Cooling Diagnostic",
            description = "Compressor relay fix, cooling coil defrost timer replacement & thermostat repair.",
            category = "Hot And Cool",
            priceInr = 549.0,
            durationMinutes = 45,
            rating = 4.8,
            isHighVoltageProtocol = true,
            warrantyMonths = 6
        ),

        // 10. House Painting Service
        ServiceItem(
            id = "srv_interior_painting",
            code = "PAINT-INT-01",
            title = "Full Home Interior Painting",
            description = "Two coats of premium emulsion, wall sanding, primer application & masking protection.",
            category = "House Painting Service",
            priceInr = 3499.0,
            durationMinutes = 300,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 24
        ),
        ServiceItem(
            id = "srv_waterproofing_crack",
            code = "PAINT-WATER-01",
            title = "Waterproofing & Wall Crack Treatment",
            description = "Dampness chemical barrier, crack seal putty and elastomeric waterproof coating.",
            category = "House Painting Service",
            priceInr = 1199.0,
            durationMinutes = 120,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_texture_accent_wall",
            code = "PAINT-TEX-01",
            title = "Texture & Accent Wall Painting",
            description = "Metallic, spatula or stencil texture finish on feature living room or bedroom walls.",
            category = "House Painting Service",
            priceInr = 1599.0,
            durationMinutes = 150,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),

        // 11. IT Service
        ServiceItem(
            id = "srv_wifi_router_setup",
            code = "IT-WIFI-01",
            title = "Wi-Fi Router Setup & Network Expansion",
            description = "Mesh Wi-Fi router configuration, range extender setup & speed latency optimization.",
            category = "IT Service",
            priceInr = 399.0,
            durationMinutes = 40,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_laptop_pc_os",
            code = "IT-OS-01",
            title = "Laptop / PC Formatting & OS Setup",
            description = "Genuine Windows/macOS reinstallation, driver updates, antivirus install & data backup.",
            category = "IT Service",
            priceInr = 699.0,
            durationMinutes = 60,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 3
        ),
        ServiceItem(
            id = "srv_printer_troubleshoot",
            code = "IT-PRINT-01",
            title = "Printer & Peripheral Troubleshooting",
            description = "Inkjet/laser printer paper jam fix, wireless print spooler setup & scanner drivers.",
            category = "IT Service",
            priceInr = 349.0,
            durationMinutes = 35,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 3
        ),

        // 12. Laundry Service
        ServiceItem(
            id = "srv_steam_ironing",
            code = "LAUND-IRON-01",
            title = "Steam Ironing & Wash Care",
            description = "Wrinkle-free high pressure steam iron for formal shirts, trousers & ethnic wear.",
            category = "Laundry Service",
            priceInr = 199.0,
            durationMinutes = 30,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),
        ServiceItem(
            id = "srv_dry_cleaning",
            code = "LAUND-DRY-01",
            title = "Premium Dry Cleaning Pickup & Delivery",
            description = "Eco-friendly solvent dry cleaning for blazers, silk sarees, suits and lehengas.",
            category = "Laundry Service",
            priceInr = 499.0,
            durationMinutes = 45,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),
        ServiceItem(
            id = "srv_blanket_laundry",
            code = "LAUND-BLANK-01",
            title = "Curtain & Heavy Blanket Laundry",
            description = "Antibacterial hot water wash, fabric softener treatment & dust mite sanitization.",
            category = "Laundry Service",
            priceInr = 399.0,
            durationMinutes = 40,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),

        // 13. Packers & Movers
        ServiceItem(
            id = "srv_local_shifting",
            code = "MOVE-LOCAL-01",
            title = "Local Home Shifting & Relocation",
            description = "3-layer bubble wrap, cardboard box packing, heavy loading & doorstep transit.",
            category = "Packers & Movers",
            priceInr = 3999.0,
            durationMinutes = 240,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),
        ServiceItem(
            id = "srv_intercity_moving",
            code = "MOVE-INTER-01",
            title = "Intercity Moving & Transport",
            description = "Dedicated container vehicle, real-time GPS tracking, toll transit & damage insurance.",
            category = "Packers & Movers",
            priceInr = 8999.0,
            durationMinutes = 480,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),
        ServiceItem(
            id = "srv_furniture_transit",
            code = "MOVE-FURN-01",
            title = "Furniture & Appliance Safe Transit",
            description = "Single item sofa, bed or refrigerator dismantling, corner protectors & safe mini-truck transit.",
            category = "Packers & Movers",
            priceInr = 1299.0,
            durationMinutes = 90,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 1
        ),

        // 14. Pest Control Service
        ServiceItem(
            id = "srv_pest_cockroach",
            code = "PEST-ROACH-01",
            title = "General Pest & Cockroach Control",
            description = "Odorless herbal gel baiting & spray in kitchen cabinets, drains, sinks and corners.",
            category = "Pest Control Service",
            priceInr = 699.0,
            durationMinutes = 45,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 3
        ),
        ServiceItem(
            id = "srv_termite_treatment",
            code = "PEST-TERM-01",
            title = "Anti-Termite Treatment & Protection",
            description = "Drill-fill-seal chemical injection barrier into wooden door frames and baseboards.",
            category = "Pest Control Service",
            priceInr = 1499.0,
            durationMinutes = 90,
            rating = 5.0,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_bedbug_eradication",
            code = "PEST-BUG-01",
            title = "Bed Bug Eradication Service",
            description = "Two-round contact chemical fumigation & mattress seam heat treatment.",
            category = "Pest Control Service",
            priceInr = 1099.0,
            durationMinutes = 60,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 3
        ),

        // 15. Rajmistri
        ServiceItem(
            id = "srv_masonry_plaster",
            code = "RAJ-MASON-01",
            title = "Brick Masonry & Wall Plastering",
            description = "Cement mortar plastering, hollow block repair, wall levelling & joint strengthening.",
            category = "Rajmistri",
            priceInr = 899.0,
            durationMinutes = 120,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_tile_marble_laying",
            code = "RAJ-TILE-01",
            title = "Floor Tile & Marble Laying / Repair",
            description = "Precision cutting, cement adhesive bonding, epoxy grouting & broken tile replacement.",
            category = "Rajmistri",
            priceInr = 1299.0,
            durationMinutes = 150,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_concrete_patch",
            code = "RAJ-CONC-01",
            title = "Concrete Patch & Crack Repair",
            description = "Structural beam/column surface chipping, polymer concrete patching & waterproof bonding.",
            category = "Rajmistri",
            priceInr = 599.0,
            durationMinutes = 60,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),

        // 16. Wallpaper
        ServiceItem(
            id = "srv_wallpaper_pasting",
            code = "WALL-PASTE-01",
            title = "Designer Wallpaper Pasting & Roll Installation",
            description = "Standard 57 sq.ft roll installation with seamless pattern matching and heavy glue bond.",
            category = "Wallpaper",
            priceInr = 699.0,
            durationMinutes = 60,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_3d_mural_fitting",
            code = "WALL-3D-01",
            title = "Custom 3D Wall Mural Fitting",
            description = "Large scale custom panoramic mural pasting with bubble-free squeegee finish.",
            category = "Wallpaper",
            priceInr = 999.0,
            durationMinutes = 90,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_wallpaper_removal",
            code = "WALL-REM-01",
            title = "Wallpaper Removal & Wall Preparation",
            description = "Old wallpaper stripping, adhesive residue scrubbing and smooth putty surface primer.",
            category = "Wallpaper",
            priceInr = 449.0,
            durationMinutes = 45,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),

        // 17. Aluminum And Glass Fitting services
        ServiceItem(
            id = "srv_sliding_window_track",
            code = "ALUM-TRACK-01",
            title = "Sliding Window Roller & Track Repair",
            description = "Bearing wheel replacement, aluminum channel cleaning, realignment & smooth gliding fix.",
            category = "Aluminum And Glass Fitting services",
            priceInr = 499.0,
            durationMinutes = 45,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_glass_partition",
            code = "ALUM-PART-01",
            title = "Toughened Glass Partition Installation",
            description = "10mm/12mm tempered glass fitting with stainless steel patch fittings & clear silicone sealant.",
            category = "Aluminum And Glass Fitting services",
            priceInr = 1899.0,
            durationMinutes = 120,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_aluminum_door_frame",
            code = "ALUM-DOOR-01",
            title = "Aluminum Door Frame Fitting",
            description = "Heavy duty powder-coated aluminum section cutting, rubber beading & floor spring lock fix.",
            category = "Aluminum And Glass Fitting services",
            priceInr = 899.0,
            durationMinutes = 60,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),

        // 18. CCTV Service
        ServiceItem(
            id = "srv_cctv_4ch_install",
            code = "CCTV-INSTALL-01",
            title = "HD CCTV Camera Setup (4-Channel)",
            description = "Dome/bullet camera mounting, 3+1 coaxial cable routing, power supply & BNC connector crimp.",
            category = "CCTV Service",
            priceInr = 1999.0,
            durationMinutes = 150,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 12
        ),
        ServiceItem(
            id = "srv_dvr_hdd_repair",
            code = "CCTV-DVR-01",
            title = "DVR/NVR Recording & Hard Disk Fix",
            description = "Surveillance surveillance hard drive installation, recording loop configuration & video loss diagnostic.",
            category = "CCTV Service",
            priceInr = 649.0,
            durationMinutes = 45,
            rating = 4.8,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        ),
        ServiceItem(
            id = "srv_ip_camera_remote",
            code = "CCTV-IP-01",
            title = "IP Camera Mobile Remote View Setup",
            description = "Port forwarding, P2P cloud app pairing, Wi-Fi pairing & motion alert notifications on phone.",
            category = "CCTV Service",
            priceInr = 499.0,
            durationMinutes = 40,
            rating = 4.9,
            isHighVoltageProtocol = false,
            warrantyMonths = 6
        )
    )

    fun findService(id: String?): ServiceItem? {
        if (id.isNullOrBlank()) return null
        return allServices.find { it.id.equals(id, ignoreCase = true) }
    }
}
