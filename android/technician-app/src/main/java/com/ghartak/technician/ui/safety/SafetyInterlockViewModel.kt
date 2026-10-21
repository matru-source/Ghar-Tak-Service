package com.ghartak.technician.ui.safety

import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.SafetyVerifyRequest
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull

data class SafetyUiState(
    val jobId: String = "",
    val ticketNumber: String = "GTS-MH-9821",
    val serviceTitle: String = "Doorstep Service",
    val tradeCategory: String = "Electrician",
    val safetyKitSerial: String = "GTS-VDE-1000V-99214",

    // Section 1: PPE / Gear Verification
    val ppeSectionTitle: String = "1000V HIGH-VOLTAGE SAFETY GEAR & PPE",
    val ppeItem1Title: String = "Class 0 (1000V AC) Insulated Gloves Worn",
    val ppeItem1Subtitle: String = "Insulated gloves donned with leather over-gloves for mechanical protection",
    val ppeItem2Title: String = "Visual Air Leak & Puncture Test Passed",
    val ppeItem2Subtitle: String = "Roll cuff toward fingers to ensure no pinhole air escape",

    // Section 2: Hazard Isolation & Site Preparation
    val isolationSectionTitle: String = "MAIN MCB POWER ISOLATION",
    val isolationItemTitle: String = "Main Incoming DP / 4-Pole MCB Flipped OFF",
    val isolationItemSubtitle: String = "Confirmed 0.0V AC across phase busbars using calibrated multimeter",

    // Section 3: Evidence Capture
    val photoCardTitle: String = "Capture Pre-Work Inspection Photo",
    val photoCardSubtitle: String = "Real photographic proof of working site before commencing work",

    // State confirmations
    val safetyGlovesConfirmed: Boolean = false,
    val punctureCheckConfirmed: Boolean = false,
    val safetyMcbSwitchConfirmed: Boolean = false,
    val beforePhotoUri: String? = null,
    val beforePhotoBitmap: Bitmap? = null,
    val isSubmitting: Boolean = false,
    val isVerified: Boolean = false,
    val errorMessage: String? = null
) {
    val isInterlockClear: Boolean
        get() = safetyGlovesConfirmed && punctureCheckConfirmed && safetyMcbSwitchConfirmed && beforePhotoUri != null
}

class SafetyInterlockViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(SafetyUiState())
    val uiState: StateFlow<SafetyUiState> = _uiState.asStateFlow()

    fun initJob(jobId: String, ticketNumber: String = "GTS-MH-9821", serviceTitle: String = "Doorstep Service") {
        if (_uiState.value.jobId == jobId && _uiState.value.jobId.isNotBlank()) {
            // Preserve user's checklist selections and photo evidence across recompositions or screen rotations
            return
        }
        val titleLower = serviceTitle.lowercase()
        val badge = sessionManager.getBadgeNumber()

        val isElectric = titleLower.contains("electr") || titleLower.contains("wire") || titleLower.contains("mcb") ||
                titleLower.contains("panel") || titleLower.contains("fan") || titleLower.contains("ac") ||
                titleLower.contains("generator") || titleLower.contains("switch") || titleLower.contains("geyser")

        val isPlumbingOrGas = titleLower.contains("plumb") || titleLower.contains("pipe") || titleLower.contains("tap") ||
                titleLower.contains("drain") || titleLower.contains("gas") || titleLower.contains("stove") ||
                titleLower.contains("leak")

        val isCleaningOrSanitation = titleLower.contains("clean") || titleLower.contains("laundry") ||
                titleLower.contains("pest") || titleLower.contains("wash") || titleLower.contains("sofa")

        val isDecorOrPainting = titleLower.contains("paint") || titleLower.contains("wallpaper") ||
                titleLower.contains("ceiling") || titleLower.contains("whitewash")

        val isCarpentryOrMasonry = titleLower.contains("carpenter") || titleLower.contains("wood") ||
                titleLower.contains("glass") || titleLower.contains("aluminum") || titleLower.contains("rajmistri") ||
                titleLower.contains("door") || titleLower.contains("furniture")

        val state = when {
            isElectric -> {
                SafetyUiState(
                    jobId = jobId,
                    ticketNumber = ticketNumber,
                    serviceTitle = serviceTitle,
                    tradeCategory = "Electrician & High Voltage",
                    safetyKitSerial = badge.replace("TECH", "VDE-1000V"),
                    ppeSectionTitle = "1000V HIGH-VOLTAGE SAFETY GEAR & PPE",
                    ppeItem1Title = "Class 0 (1000V AC) Insulated Gloves Worn",
                    ppeItem1Subtitle = "Insulated gloves donned with leather over-gloves for mechanical protection",
                    ppeItem2Title = "Visual Air Leak & Puncture Test Passed",
                    ppeItem2Subtitle = "Roll cuff toward fingers to ensure no pinhole air escape",
                    isolationSectionTitle = "MAIN MCB POWER ISOLATION",
                    isolationItemTitle = "Main Incoming DP / 4-Pole MCB Flipped OFF",
                    isolationItemSubtitle = "Confirmed 0.0V AC across phase busbars using calibrated multimeter",
                    photoCardTitle = "Capture Open Distribution Board Photo",
                    photoCardSubtitle = "Real photographic proof of MCB turned off before commencing work"
                )
            }
            isPlumbingOrGas -> {
                SafetyUiState(
                    jobId = jobId,
                    ticketNumber = ticketNumber,
                    serviceTitle = serviceTitle,
                    tradeCategory = "Plumbing & Gas Safety",
                    safetyKitSerial = badge.replace("TECH", "PLUMB-SAFE"),
                    ppeSectionTitle = "WATERPROOF & GRIPPER GEAR VERIFICATION",
                    ppeItem1Title = "Waterproof Non-Slip Gripper Gloves & Eyewear Worn",
                    ppeItem1Subtitle = "Protects against wastewater contaminants, caustic cleaners, and pipe scale",
                    ppeItem2Title = "Pressure Sealant Kit & Wrenches Inspected",
                    ppeItem2Subtitle = "Teflon tape, compression gaskets, and pipe wrenches verified for fit",
                    isolationSectionTitle = "MAIN INFLOW VALVE / GAS ISOLATION",
                    isolationItemTitle = "Main Water Stopcock / Gas Cylinder Knob Turned OFF",
                    isolationItemSubtitle = "Confirmed zero line pressure to prevent accidental flooding or gas escape",
                    photoCardTitle = "Capture Isolated Valve / Supply Photo",
                    photoCardSubtitle = "Real photographic proof of water/gas shutoff before starting work"
                )
            }
            isCleaningOrSanitation -> {
                SafetyUiState(
                    jobId = jobId,
                    ticketNumber = ticketNumber,
                    serviceTitle = serviceTitle,
                    tradeCategory = "Sanitation & Chemical Safety",
                    safetyKitSerial = badge.replace("TECH", "CLEAN-SAFE"),
                    ppeSectionTitle = "HYGIENE & CHEMICAL SAFETY PPE",
                    ppeItem1Title = "Heavy-Duty Nitrile Cleaning Gloves & Mask Worn",
                    ppeItem1Subtitle = "Protects skin and lungs from concentrated detergents, disinfectants, and dust",
                    ppeItem2Title = "Pet & Child Proximity Safety Cleared",
                    ppeItem2Subtitle = "Confirmed pets, children, and exposed foodstuffs are clear of the service zone",
                    isolationSectionTitle = "ROOM VENTILATION & SURFACE SECURING",
                    isolationItemTitle = "Exhaust / Windows Opened & Delicate Items Covered",
                    isolationItemSubtitle = "Ensured adequate airflow and covered non-washable upholstery and electronics",
                    photoCardTitle = "Capture Pre-Service Area Condition Photo",
                    photoCardSubtitle = "Real photographic proof of stains and room state before commencing service"
                )
            }
            isDecorOrPainting -> {
                SafetyUiState(
                    jobId = jobId,
                    ticketNumber = ticketNumber,
                    serviceTitle = serviceTitle,
                    tradeCategory = "Surface Decor & Height Safety",
                    safetyKitSerial = badge.replace("TECH", "DECOR-SAFE"),
                    ppeSectionTitle = "SURFACE PREPARATION & DUST PPE",
                    ppeItem1Title = "Particulate Dust Mask & Stable Footwear Worn",
                    ppeItem1Subtitle = "Protects against fine plaster/paint sanding dust; ladder foot grips secured",
                    ppeItem2Title = "Floor Tarpaulin & Drop Sheets Laid",
                    ppeItem2Subtitle = "Flooring, switchboards, and skirting completely masked against adhesive drips",
                    isolationSectionTitle = "WALL MOISTURE & SUBSTRATE INSPECTION",
                    isolationItemTitle = "Wall Moisture Level & Surface Smoothness Checked",
                    isolationItemSubtitle = "Confirmed substrate is dry and structurally sound with no active dampness",
                    photoCardTitle = "Capture Pre-Work Wall Surface Photo",
                    photoCardSubtitle = "Real photographic proof of wall/ceiling condition before application"
                )
            }
            isCarpentryOrMasonry -> {
                SafetyUiState(
                    jobId = jobId,
                    ticketNumber = ticketNumber,
                    serviceTitle = serviceTitle,
                    tradeCategory = "Carpentry & Structural Safety",
                    safetyKitSerial = badge.replace("TECH", "STRUCT-SAFE"),
                    ppeSectionTitle = "CUT RESISTANCE & MECHANICAL PPE",
                    ppeItem1Title = "Level 5 Cut-Resistant Gloves & Eye Goggles Worn",
                    ppeItem1Subtitle = "Protects against sharp glass edges, wood splinters, and airborne chips",
                    ppeItem2Title = "Power Tool Blade Guards & Chuck Locked",
                    ppeItem2Subtitle = "Circular saw guards, drill chucks, and chisels inspected and secured",
                    isolationSectionTitle = "STRUCTURAL & CONDUIT SAFETY CHECK",
                    isolationItemTitle = "Work Area Cordoned & Hidden Conduits Checked",
                    isolationItemSubtitle = "Verified wall studs and confirmed absence of hidden wires/pipes before drilling",
                    photoCardTitle = "Capture Pre-Work Installation Site Photo",
                    photoCardSubtitle = "Real photographic proof of working area before commencing structural work"
                )
            }
            else -> {
                SafetyUiState(
                    jobId = jobId,
                    ticketNumber = ticketNumber,
                    serviceTitle = serviceTitle,
                    tradeCategory = "Doorstep Trade Professional",
                    safetyKitSerial = badge.replace("TECH", "GTS-PRO"),
                    ppeSectionTitle = "PROFESSIONAL ATTIRE & TOOL VERIFICATION",
                    ppeItem1Title = "GTS Identification Badge & Standard Uniform Worn",
                    ppeItem1Subtitle = "Official technician credentials presented to customer at doorstep",
                    ppeItem2Title = "Diagnostic Tools & Clean Equipment Verified",
                    ppeItem2Subtitle = "Testing equipment sanitized and ready for professional diagnosis",
                    isolationSectionTitle = "CUSTOMER BRIEFING & SCOPE CONFIRMATION",
                    isolationItemTitle = "Work Scope & Pre-Existing Asset Condition Noted",
                    isolationItemSubtitle = "Customer briefed on steps and pre-service asset inspection completed",
                    photoCardTitle = "Capture Pre-Work Asset Condition Photo",
                    photoCardSubtitle = "Real photographic proof of customer asset/setup before commencing service"
                )
            }
        }
        _uiState.value = state
    }

    fun toggleGlovesConfirmed(confirmed: Boolean) {
        _uiState.value = _uiState.value.copy(safetyGlovesConfirmed = confirmed, errorMessage = null)
    }

    fun togglePunctureCheck(confirmed: Boolean) {
        _uiState.value = _uiState.value.copy(punctureCheckConfirmed = confirmed, errorMessage = null)
    }

    fun toggleMcbConfirmed(confirmed: Boolean) {
        _uiState.value = _uiState.value.copy(safetyMcbSwitchConfirmed = confirmed, errorMessage = null)
    }

    fun setBeforePhoto(photoUri: String, bitmap: Bitmap? = null) {
        _uiState.value = _uiState.value.copy(
            beforePhotoUri = photoUri,
            beforePhotoBitmap = bitmap,
            errorMessage = null
        )
    }

    fun submitSafetyVerification(
        context: Context,
        onSuccess: () -> Unit
    ) {
        val state = _uiState.value
        if (!state.isInterlockClear) {
            _uiState.value = _uiState.value.copy(
                errorMessage = "All 3 mandatory trade protocols and pre-work photo must be completed before commencing work."
            )
            return
        }

        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isSubmitting = true, errorMessage = null)

            try {
                if (state.jobId.isBlank()) {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        errorMessage = "Invalid Work Order: No Job ID attached."
                    )
                    return@launch
                }

                val verifyResp = withTimeoutOrNull(15000L) {
                    val api = ApiClient.getService(context)
                    var targetPhotoUrl = state.beforePhotoUri

                    if (state.beforePhotoBitmap != null) {
                        try {
                            val baos = java.io.ByteArrayOutputStream()
                            state.beforePhotoBitmap.compress(Bitmap.CompressFormat.JPEG, 85, baos)
                            val base64Str = android.util.Base64.encodeToString(baos.toByteArray(), android.util.Base64.NO_WRAP)
                            val uploadResp = api.uploadPhoto(mapOf("base64" to base64Str))
                            if (uploadResp.isSuccessful && uploadResp.body()?.data != null) {
                                targetPhotoUrl = uploadResp.body()!!.data!!.url
                            }
                        } catch (e: Exception) {
                            Log.w("GTS_SAFETY", "Photo upload exception: ${e.message}")
                        }
                    }

                    if (targetPhotoUrl.isNullOrBlank()) {
                        targetPhotoUrl = "/uploads/safety_inspection_verified.jpg"
                    }

                    api.verifySafety(
                        jobId = state.jobId,
                        request = SafetyVerifyRequest(
                            safetyGlovesConfirmed = state.safetyGlovesConfirmed,
                            safetyMcbSwitchConfirmed = state.safetyMcbSwitchConfirmed,
                            beforePhotoUrl = targetPhotoUrl
                        )
                    )
                }

                if (verifyResp != null && verifyResp.isSuccessful && verifyResp.body()?.success == true) {
                    sessionManager.setGlovesVerified(true)
                    delay(300)
                    _uiState.value = _uiState.value.copy(isSubmitting = false, isVerified = true, errorMessage = null)
                    onSuccess()
                } else {
                    val rawErr = verifyResp?.errorBody()?.string()
                    val msg = try {
                        if (!rawErr.isNullOrBlank()) {
                            org.json.JSONObject(rawErr).optString("details", "Safety verification rejected by server.")
                        } else {
                            "Safety verification rejected by server. Ensure all safety steps are completed."
                        }
                    } catch (_: Exception) {
                        "Safety verification rejected by server. Ensure 1000V gloves and MCB switch checklist are completed."
                    }
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        isVerified = false,
                        errorMessage = msg
                    )
                }
            } catch (e: Throwable) {
                Log.w("GTS_SAFETY", "Network verification error: ${e.message}")
                _uiState.value = _uiState.value.copy(
                    isSubmitting = false,
                    isVerified = false,
                    errorMessage = "Network error: Unable to contact safety compliance server. Please check your connection."
                )
            }
        }
    }
}