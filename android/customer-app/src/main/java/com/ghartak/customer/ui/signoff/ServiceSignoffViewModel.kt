package com.ghartak.customer.ui.signoff

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ghartak.customer.data.session.SessionManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class ServiceSignoffUiState(
    val jobId: String = "job_od_live_01",
    val ticketNumber: String = "GTS-OD-5638",
    val serviceTitle: String = "Fan Installation",
    val technicianName: String = "Rajesh Kumar",
    val technicianBadge: String = "GTS-TECH-4091",
    val stateCode: String = "OD",
    val invoiceNumber: String = "INV-2026-OD-5638",
    val invoiceDate: String = "Oct 15, 2026",
    val hsnSacCode: String = "998713",
    val gstin: String = "21AAACG1234F1Z5 (21-OD)",
    val basePriceInr: Double = 299.0,
    val cgstInr: Double = 26.91,
    val sgstInr: Double = 26.91,
    val totalAmountInr: Double = 352.82,
    val rating: Int = 5,
    val reviewText: String = "Rajesh arrived in 15 minutes, used insulated gloves, and completed the Fan Installation cleanly. Safety inspection passed at 100%.",
    val selectedTags: Set<String> = setOf("1000V Safe", "Punctual", "Spotless Cleanup"),
    val isWorkRestoredConfirmed: Boolean = true,
    val isSafetyChecklistConfirmed: Boolean = true,
    val isDownloadingInvoice: Boolean = false,
    val downloadSuccessMessage: String? = null,
    val isSubmitted: Boolean = false
)

class ServiceSignoffViewModel(
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(ServiceSignoffUiState())
    val uiState: StateFlow<ServiceSignoffUiState> = _uiState.asStateFlow()

    fun initSignoff(
        jobId: String,
        technicianName: String? = null,
        technicianBadge: String? = null,
        stateCode: String? = null,
        gstin: String? = null,
        serviceTitle: String? = null,
        basePrice: Double? = null,
        cgst: Double? = null,
        sgst: Double? = null,
        total: Double? = null,
        ticketNumber: String? = null
    ) {
        val resolvedTitle = if (!serviceTitle.isNullOrBlank()) serviceTitle else sessionManager.getActiveJobTitle()
        val resolvedBase = if (basePrice != null && basePrice > 0.0) basePrice else sessionManager.getActiveJobBasePrice()
        val resolvedCgst = cgst ?: (resolvedBase * 0.09)
        val resolvedSgst = sgst ?: (resolvedBase * 0.09)
        val resolvedTotal = total ?: (resolvedBase + resolvedCgst + resolvedSgst)
        val resolvedTech = if (!technicianName.isNullOrBlank()) technicianName else sessionManager.getActiveJobTechnicianName()
        val resolvedBadge = if (!technicianBadge.isNullOrBlank()) technicianBadge else sessionManager.getActiveJobTechnicianBadge()
        val resolvedState = if (!stateCode.isNullOrBlank()) stateCode else sessionManager.getActiveJobStateCode()
        val resolvedGstin = if (!gstin.isNullOrBlank()) gstin else sessionManager.getActiveJobGstin()
        val resolvedTicket = if (!ticketNumber.isNullOrBlank()) ticketNumber else sessionManager.getActiveJobTicketNumber()

        val techFirstName = resolvedTech.trim().split(" ").firstOrNull() ?: "Technician"
        val invoiceNum = resolvedTicket.replace("GTS", "INV-2026")
        val defaultReview = "$techFirstName arrived on time, used insulated gloves, and completed the $resolvedTitle cleanly. Safety inspection passed at 100%."

        _uiState.value = _uiState.value.copy(
            jobId = jobId,
            technicianName = resolvedTech,
            technicianBadge = resolvedBadge,
            stateCode = resolvedState,
            gstin = resolvedGstin,
            serviceTitle = resolvedTitle,
            basePriceInr = resolvedBase,
            cgstInr = resolvedCgst,
            sgstInr = resolvedSgst,
            totalAmountInr = resolvedTotal,
            ticketNumber = resolvedTicket,
            invoiceNumber = invoiceNum,
            reviewText = defaultReview
        )
    }

    fun onRatingChanged(stars: Int) {
        _uiState.value = _uiState.value.copy(rating = stars)
    }

    fun onReviewTextChanged(text: String) {
        _uiState.value = _uiState.value.copy(reviewText = text)
    }

    fun toggleTag(tag: String) {
        val current = _uiState.value.selectedTags.toMutableSet()
        if (current.contains(tag)) {
            current.remove(tag)
        } else {
            current.add(tag)
        }
        _uiState.value = _uiState.value.copy(selectedTags = current)
    }

    fun toggleWorkRestored(confirmed: Boolean) {
        _uiState.value = _uiState.value.copy(isWorkRestoredConfirmed = confirmed)
    }

    fun toggleSafetyChecklist(confirmed: Boolean) {
        _uiState.value = _uiState.value.copy(isSafetyChecklistConfirmed = confirmed)
    }

    fun downloadGstInvoicePdf(context: Context) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isDownloadingInvoice = true, downloadSuccessMessage = null)
            val state = _uiState.value
            val data = com.ghartak.customer.util.PdfInvoiceGenerator.InvoiceData(
                invoiceNumber = state.invoiceNumber,
                ticketNumber = state.ticketNumber,
                serviceTitle = state.serviceTitle,
                customerName = sessionManager.getUserName(),
                customerPhone = sessionManager.getUserPhone(),
                customerAddress = sessionManager.getUserAddress(),
                technicianName = "${state.technicianName} (${state.technicianBadge})",
                gstin = state.gstin,
                taxableCharges = state.basePriceInr,
                cgstAmount = state.cgstInr,
                sgstAmount = state.sgstInr,
                totalAmount = state.totalAmountInr
            )
            com.ghartak.customer.util.PdfInvoiceGenerator.generateAndSaveGstInvoice(context, data)
            _uiState.value = _uiState.value.copy(
                isDownloadingInvoice = false,
                downloadSuccessMessage = "Tax Invoice ${state.invoiceNumber}.pdf saved to Downloads folder."
            )
        }
    }

    fun submitFeedbackAndSignoff(onSuccess: () -> Unit) {
        viewModelScope.launch {
            val state = _uiState.value
            try {
                sessionManager.addCompletedOrder(
                    com.ghartak.customer.data.model.PastOrderItem(
                        ticketNumber = state.ticketNumber,
                        invoiceNumber = state.invoiceNumber,
                        serviceTitle = state.serviceTitle,
                        dateText = java.text.SimpleDateFormat("MMM dd, yyyy • hh:mm a", java.util.Locale.ENGLISH).format(java.util.Date()),
                        technicianName = "${state.technicianName} (${state.technicianBadge})",
                        amountInr = state.totalAmountInr,
                        taxableAmount = state.basePriceInr,
                        cgstAmount = state.cgstInr,
                        sgstAmount = state.sgstInr,
                        status = "COMPLETED"
                    )
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
            delay(600)
            _uiState.value = _uiState.value.copy(isSubmitted = true)
            onSuccess()
        }
    }
}
