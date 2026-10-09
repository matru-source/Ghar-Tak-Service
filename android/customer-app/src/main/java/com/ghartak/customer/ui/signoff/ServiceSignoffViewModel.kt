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
    val jobId: String = "job_mh_live_01",
    val ticketNumber: String = "GTS-MH-9821",
    val serviceTitle: String = "Full Home MCB Panel Replacement & Earth Leakage Fix",
    val technicianName: String = "Rajesh Kumar",
    val technicianBadge: String = "GTS-TECH-4091",
    val stateCode: String = "MH",
    val invoiceNumber: String = "INV-2026-MH-4091",
    val invoiceDate: String = "Oct 07, 2026",
    val hsnSacCode: String = "998713",
    val gstin: String = "27AAACG1234F1Z5 (27-MH)",
    val basePriceInr: Double = 2499.0,
    val cgstInr: Double = 224.91,
    val sgstInr: Double = 224.91,
    val totalAmountInr: Double = 2948.82,
    val rating: Int = 5,
    val reviewText: String = "Rajesh arrived in 15 minutes, used insulated gloves, and restored our MCB panel cleanly. Earth leakage test passed at 0.0V.",
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
        technicianName: String = "Rajesh Kumar",
        technicianBadge: String = "GTS-TECH-4091",
        stateCode: String = "MH",
        gstin: String = "27AAACG1234F1Z5 (27-MH)",
        serviceTitle: String = "Full Home MCB Panel Replacement & Earth Leakage Fix",
        basePrice: Double = 2499.0,
        cgst: Double = 224.91,
        sgst: Double = 224.91,
        total: Double = 2948.82,
        ticketNumber: String? = null
    ) {
        val techFirstName = technicianName.trim().split(" ").firstOrNull() ?: "Technician"
        val cleanState = stateCode.ifEmpty { "MH" }
        val randomNum = (1000..9999).random()
        val defaultReview = "$techFirstName arrived in 15 minutes, used insulated gloves, and restored our MCB panel cleanly. Earth leakage test passed at 0.0V."

        _uiState.value = _uiState.value.copy(
            jobId = jobId,
            technicianName = technicianName,
            technicianBadge = technicianBadge,
            stateCode = cleanState,
            gstin = gstin,
            serviceTitle = serviceTitle,
            basePriceInr = basePrice,
            cgstInr = cgst,
            sgstInr = sgst,
            totalAmountInr = total,
            ticketNumber = ticketNumber ?: "GTS-$cleanState-$randomNum",
            invoiceNumber = "INV-2026-$cleanState-$randomNum",
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
            delay(600)
            _uiState.value = _uiState.value.copy(isSubmitted = true)
            onSuccess()
        }
    }
}
