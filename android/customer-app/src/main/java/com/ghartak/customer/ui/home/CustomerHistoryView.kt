package com.ghartak.customer.ui.home

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
                        val total = if (job.totalAmountInr > 0.0) job.totalAmountInr else 299.0
                        val taxable = Math.round((total / 1.18) * 100.0) / 100.0
                        val gst = Math.round((total - taxable) * 100.0) / 100.0
                        val cgst = Math.round((gst / 2.0) * 100.0) / 100.0
                        val sgst = Math.round((gst - cgst) * 100.0) / 100.0

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
                        val merged = (mappedOrders + sessionManager.getPastOrders())
                            .distinctBy { it.ticketNumber.ifEmpty { it.invoiceNumber } }
                        pastOrders = merged
                        merged.forEach { sessionManager.addCompletedOrder(it) }
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
                                    text = "${pastOrders.size} Completed Service Record${if (pastOrders.size > 1) "s" else ""}",
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
                            text = "Download official GST tax invoices with 12-month service warranty protection anytime.",
                            fontSize = 11.sp,
                            color = Color(0xFFE3F2FD)
                        )
                    }
                }
            }
        }

        // List of Orders
        items(pastOrders) { order ->
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
                    val displayTaxable = if (order.taxableAmount > 0.0) order.taxableAmount else 299.0
                    val displayCgst = if (order.cgstAmount > 0.0) order.cgstAmount else (displayTaxable * 0.09)
                    val displaySgst = if (order.sgstAmount > 0.0) order.sgstAmount else (displayTaxable * 0.09)
                    val displayTotal = if (order.amountInr > 0.0) order.amountInr else (displayTaxable + displayCgst + displaySgst)

                    // Top row: Ticket & Status Badge
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

                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = SuccessGreenLight
                        ) {
                            Text(
                                text = "COMPLETED",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                                color = SuccessGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
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
                        text = "Executed by $displayTech",
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

        item { Spacer(modifier = Modifier.height(20.dp)) }
    }
}
