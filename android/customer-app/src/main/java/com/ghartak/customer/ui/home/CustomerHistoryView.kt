package com.ghartak.customer.ui.home

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.customer.data.model.PastOrderItem
import com.ghartak.customer.ui.theme.*
import com.ghartak.customer.util.PdfInvoiceGenerator

@Composable
fun CustomerHistoryView(
    onBookServiceAgain: () -> Unit = {}
) {
    val context = LocalContext.current
    val sessionManager = remember { com.ghartak.customer.data.session.SessionManager(context) }
    var pastOrders by remember { mutableStateOf(sessionManager.getPastOrders()) }
    var isLoading by remember { mutableStateOf(false) }
    var selectedFilterTab by remember { mutableStateOf(0) } // 0 = All, 1 = Completed, 2 = Cancelled

    val completedOrders = remember(pastOrders) {
        pastOrders.filter {
            it.status.equals("COMPLETED", ignoreCase = true) ||
            it.status.equals("WORK_COMPLETED", ignoreCase = true) ||
            it.status.equals("SETTLED", ignoreCase = true)
        }
    }
    val cancelledOrders = remember(pastOrders) {
        pastOrders.filter { it.status.equals("CANCELLED", ignoreCase = true) }
    }
    val filteredOrders = remember(pastOrders, selectedFilterTab) {
        when (selectedFilterTab) {
            1 -> completedOrders
            2 -> cancelledOrders
            else -> pastOrders
        }
    }

    LaunchedEffect(Unit) {
        pastOrders = sessionManager.getPastOrders()
        val customerId = sessionManager.getUserId().ifEmpty { sessionManager.getUserPhone() }
        if (customerId.isNotBlank()) {
            isLoading = true
            try {
                val api = com.ghartak.customer.data.api.ApiClient.getService(context)
                val response = api.getMyJobs(customerId)
                if (response.isSuccessful && response.body()?.data != null) {
                    val serverJobs = response.body()!!.data!!.jobs
                    val mappedOrders = serverJobs.map { job ->
                        val isCancelled = job.status.equals("CANCELLED", ignoreCase = true)
                        val total = if (isCancelled) 0.0 else if (job.totalAmountInr > 0.0) job.totalAmountInr else 299.0
                        val taxable = if (isCancelled) 0.0 else Math.round((total / 1.18) * 100.0) / 100.0
                        val gst = if (isCancelled) 0.0 else Math.round((total - taxable) * 100.0) / 100.0
                        val cgst = if (isCancelled) 0.0 else Math.round((gst / 2.0) * 100.0) / 100.0
                        val sgst = if (isCancelled) 0.0 else Math.round((gst - cgst) * 100.0) / 100.0

                        val dateFormatted = try {
                            val raw = job.createdAt ?: job.scheduledAt ?: ""
                            if (raw.length >= 10) {
                                val sdfIn = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.ENGLISH)
                                val parsed = sdfIn.parse(raw.take(10))
                                val sdfOut = java.text.SimpleDateFormat("d MMM, yyyy", java.util.Locale.ENGLISH)
                                parsed?.let { sdfOut.format(it) } ?: raw.take(10)
                            } else {
                                java.text.SimpleDateFormat("d MMM, yyyy", java.util.Locale.ENGLISH).format(java.util.Date())
                            }
                        } catch (e: Exception) {
                            java.text.SimpleDateFormat("d MMM, yyyy", java.util.Locale.ENGLISH).format(java.util.Date())
                        }

                        val invNum = if (job.jobTicketNumber.startsWith("GTS")) {
                            job.jobTicketNumber.replace("GTS", "INV-2026")
                        } else {
                            "INV-2026-${job.jobTicketNumber.removePrefix("#")}"
                        }

                        PastOrderItem(
                            ticketNumber = job.jobTicketNumber,
                            invoiceNumber = invNum,
                            serviceTitle = job.serviceTitle,
                            dateText = dateFormatted,
                            technicianName = job.technicianName ?: "Certified Field Specialist",
                            amountInr = total,
                            taxableAmount = taxable,
                            cgstAmount = cgst,
                            sgstAmount = sgst,
                            status = job.status
                        )
                    }

                    if (mappedOrders.isNotEmpty()) {
                        val serverTicketSet = mappedOrders.map { it.ticketNumber.removePrefix("#").trim().lowercase() }.toSet()
                        val nonOverlappingLocal = sessionManager.getPastOrders().filterNot {
                            serverTicketSet.contains(it.ticketNumber.removePrefix("#").trim().lowercase())
                        }
                        val merged = mappedOrders + nonOverlappingLocal
                        pastOrders = merged
                        sessionManager.savePastOrders(merged)
                    }
                }
            } catch (e: Exception) {
                // Keep local cache on network error
            } finally {
                isLoading = false
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(4.dp)) }

        if (isLoading && pastOrders.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = SapphireBlue600)
                }
            }
        } else if (pastOrders.isEmpty()) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 24.dp),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(68.dp)
                                .background(Color(0xFFEFF6FF), RoundedCornerShape(34.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.ReceiptLong,
                                contentDescription = null,
                                tint = SapphireBlue600,
                                modifier = Modifier.size(34.dp)
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "No Past Bookings Yet",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF0F172A)
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = "Your completed household services and downloadable GST tax invoices will appear here in real time after service completion.",
                            fontSize = 13.sp,
                            color = Color(0xFF64748B),
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                            lineHeight = 18.sp
                        )

                        Spacer(modifier = Modifier.height(20.dp))

                        Button(
                            onClick = onBookServiceAgain,
                            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue600),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(48.dp)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Book Your First Service", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                    }
                }
            }
        } else {
            // Header Summary Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = SapphireBlue800)
                ) {
                    Column(modifier = Modifier.padding(18.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "ORDER & INVOICE HISTORY",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFBBDEFB),
                                    letterSpacing = 1.sp
                                )
                                Text(
                                    text = "${completedOrders.size} Completed Service Record${if (completedOrders.size != 1) "s" else ""}",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                            }
                            Icon(
                                imageVector = Icons.Default.ReceiptLong,
                                contentDescription = null,
                                tint = Color(0xFFFFD54F),
                                modifier = Modifier.size(28.dp)
                            )
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = if (cancelledOrders.isNotEmpty()) {
                                "${completedOrders.size} Completed • ${cancelledOrders.size} Cancelled (₹0 Charged)"
                            } else {
                                "Download official GST tax invoices with 12-month service warranty protection anytime."
                            },
                            fontSize = 11.sp,
                            color = Color(0xFFE3F2FD)
                        )
                    }
                }
            }

            // Industry Grade Category Filter Pills: All | Completed | Cancelled
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 2.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    HistoryFilterChip(
                        title = "All",
                        count = pastOrders.size,
                        isSelected = selectedFilterTab == 0,
                        activeColor = SapphireBlue800,
                        onClick = { selectedFilterTab = 0 }
                    )
                    HistoryFilterChip(
                        title = "Completed",
                        count = completedOrders.size,
                        isSelected = selectedFilterTab == 1,
                        activeColor = SuccessGreen,
                        onClick = { selectedFilterTab = 1 }
                    )
                    HistoryFilterChip(
                        title = "Cancelled",
                        count = cancelledOrders.size,
                        isSelected = selectedFilterTab == 2,
                        activeColor = Color(0xFFDC2626),
                        onClick = { selectedFilterTab = 2 }
                    )
                }
            }
        }

        // Empty state when specific filter has no records
        if (pastOrders.isNotEmpty() && filteredOrders.isEmpty()) {
            item {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 16.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = if (selectedFilterTab == 2) Icons.Default.CheckCircle else Icons.Default.Info,
                            contentDescription = null,
                            tint = if (selectedFilterTab == 2) SuccessGreen else SapphireBlue600,
                            modifier = Modifier.size(36.dp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = if (selectedFilterTab == 2) "No Cancelled Bookings" else "No Orders Found",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (selectedFilterTab == 2)
                                "All your requested services were fulfilled or are in progress."
                            else
                                "No bookings match this category filter.",
                            fontSize = 12.sp,
                            color = TextDarkMuted,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )
                    }
                }
            }
        }

        // List of Orders
        items(filteredOrders) { order ->
            val isCancelled = order.status.equals("CANCELLED", ignoreCase = true)
            val isCompleted = order.status.equals("COMPLETED", ignoreCase = true) ||
                              order.status.equals("WORK_COMPLETED", ignoreCase = true) ||
                              order.status.equals("SETTLED", ignoreCase = true)

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    val displayTicket = order.ticketNumber.ifBlank { "GTS-1001" }
                    val displayTech = if (order.technicianName.isNotBlank() && order.technicianName != " ()") order.technicianName else "Certified Professional (GTS-TECH-101)"
                    val displayService = order.serviceTitle.ifBlank { "Doorstep Service" }
                    val displayTaxable = if (isCancelled) 0.0 else if (order.taxableAmount > 0.0) order.taxableAmount else 299.0
                    val displayCgst = if (isCancelled) 0.0 else if (order.cgstAmount > 0.0) order.cgstAmount else (displayTaxable * 0.09)
                    val displaySgst = if (isCancelled) 0.0 else if (order.sgstAmount > 0.0) order.sgstAmount else (displayTaxable * 0.09)
                    val displayTotal = if (isCancelled) 0.0 else if (order.amountInr > 0.0) order.amountInr else (displayTaxable + displayCgst + displaySgst)

                    // Top row: Ticket & Dynamic Status Badge
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Ticket: $displayTicket",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SapphireBlue800
                        )

                        if (isCancelled) {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Color(0xFFFEE2E2)
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .background(Color(0xFFEF4444), CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "CANCELLED",
                                        color = Color(0xFFDC2626),
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        } else {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = SuccessGreenLight
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .background(SuccessGreen, CircleShape)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = if (isCompleted) "COMPLETED" else order.status.ifBlank { "CONFIRMED" },
                                        color = SuccessGreen,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = displayService,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = if (isCancelled) "Assigned to $displayTech (Cancelled)" else "Executed by $displayTech",
                        fontSize = 11.sp,
                        color = TextDarkMuted
                    )
                    Text(
                        text = order.dateText.ifBlank { "Oct 20, 2026" },
                        fontSize = 11.sp,
                        color = TextDarkMuted
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Divider(color = SurfaceBorder)
                    Spacer(modifier = Modifier.height(10.dp))

                    // Amount & Action Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (isCancelled) {
                            Column {
                                Text(
                                    text = "Status & Billing:",
                                    fontSize = 10.sp,
                                    color = TextDarkMuted,
                                    fontWeight = FontWeight.Medium
                                )
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "₹0.00",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Black,
                                        color = Color(0xFF64748B)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = Color(0xFFF1F5F9)
                                    ) {
                                        Text(
                                            text = "No Charge",
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = Color(0xFF64748B),
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                                        )
                                    }
                                }
                            }

                            // Rebook Service Button (Urban Company / Uber standard)
                            Button(
                                onClick = onBookServiceAgain,
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(15.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Rebook Service", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        } else {
                            Column {
                                Text(
                                    text = "Total Paid (18% GST):",
                                    fontSize = 10.sp,
                                    color = TextDarkMuted,
                                    fontWeight = FontWeight.Medium
                                )
                                Text(
                                    text = "₹%,.2f".format(displayTotal),
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Black,
                                    color = SapphireBlue900
                                )
                            }

                            // Download PDF Button
                            Button(
                                onClick = {
                                    val invoiceNumber = order.invoiceNumber.ifBlank { displayTicket.replace("GTS", "INV-2026") }
                                    val data = PdfInvoiceGenerator.InvoiceData(
                                        invoiceNumber = invoiceNumber,
                                        ticketNumber = displayTicket,
                                        serviceTitle = displayService,
                                        technicianName = displayTech,
                                        dateOfSupply = order.dateText.split("•").firstOrNull()?.trim() ?: "Oct 20, 2026",
                                        taxableCharges = displayTaxable,
                                        cgstAmount = displayCgst,
                                        sgstAmount = displaySgst,
                                        totalAmount = displayTotal
                                    )
                                    PdfInvoiceGenerator.generateAndSaveGstInvoice(context, data)
                                },
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                            ) {
                                Icon(Icons.Default.FileDownload, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Download Invoice PDF", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        item { Spacer(modifier = Modifier.height(20.dp)) }
    }
}

@Composable
private fun HistoryFilterChip(
    title: String,
    count: Int,
    isSelected: Boolean,
    activeColor: Color,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = if (isSelected) activeColor else Color.White,
        border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
        modifier = Modifier.clickable { onClick() }
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = title,
                fontSize = 12.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) Color.White else TextDarkPrimary
            )
            Surface(
                shape = CircleShape,
                color = if (isSelected) Color.White.copy(alpha = 0.25f) else Color(0xFFF1F5F9)
            ) {
                Text(
                    text = "$count",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isSelected) Color.White else Color(0xFF64748B),
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 1.dp)
                )
            }
        }
    }
}
