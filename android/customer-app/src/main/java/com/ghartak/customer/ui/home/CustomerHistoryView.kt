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
import com.ghartak.customer.ui.theme.*
import com.ghartak.customer.util.PdfInvoiceGenerator

data class PastOrderItem(
    val ticketNumber: String,
    val invoiceNumber: String,
    val serviceTitle: String,
    val dateText: String,
    val technicianName: String,
    val amountInr: Double,
    val taxableAmount: Double,
    val cgstAmount: Double,
    val sgstAmount: Double,
    val status: String = "COMPLETED"
)

@Composable
fun CustomerHistoryView(
    onBookServiceAgain: () -> Unit = {}
) {
    val context = LocalContext.current

    val pastOrders = remember {
        listOf(
            PastOrderItem(
                ticketNumber = "GTS-MH-6430",
                invoiceNumber = "INV-2026-MH-1720",
                serviceTitle = "Full Home MCB Panel Replacement & Earth Leakage Fix",
                dateText = "Oct 07, 2026 • 01:19 PM",
                technicianName = "Rajesh Kumar (GTS-TECH-4091)",
                amountInr = 2948.82,
                taxableAmount = 2499.00,
                cgstAmount = 224.91,
                sgstAmount = 224.91
            ),
            PastOrderItem(
                ticketNumber = "GTS-MH-1001",
                invoiceNumber = "INV-2026-MH-1689",
                serviceTitle = "Inverter Backup Bypass & Heavy Load Rewiring",
                dateText = "Oct 08, 2026 • 01:18 PM",
                technicianName = "Rajesh Kumar (GTS-TECH-4091)",
                amountInr = 2183.00,
                taxableAmount = 1850.00,
                cgstAmount = 166.50,
                sgstAmount = 166.50
            ),
            PastOrderItem(
                ticketNumber = "GTS-MH-0922",
                invoiceNumber = "INV-2026-MH-1420",
                serviceTitle = "Ceiling Fan / Chandelier Safe Anchor Mount",
                dateText = "Sep 28, 2026 • 11:30 AM",
                technicianName = "Suresh Patil (GTS-TECH-3012)",
                amountInr = 349.00,
                taxableAmount = 295.76,
                cgstAmount = 26.62,
                sgstAmount = 26.62
            )
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(4.dp)) }

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
                                text = "3 Completed Service Records",
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

        // List of Orders
        items(pastOrders) { order ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    // Top row: Ticket & Status Badge
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Ticket: ${order.ticketNumber}",
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
                        text = order.serviceTitle,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Executed by ${order.technicianName}",
                        fontSize = 11.sp,
                        color = TextDarkMuted
                    )
                    Text(
                        text = order.dateText,
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
                                text = "₹%,.2f".format(order.amountInr),
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Black,
                                color = SapphireBlue900
                            )
                        }

                        // Download PDF Button
                        Button(
                            onClick = {
                                val data = PdfInvoiceGenerator.InvoiceData(
                                    invoiceNumber = order.invoiceNumber,
                                    ticketNumber = order.ticketNumber,
                                    serviceTitle = order.serviceTitle,
                                    technicianName = order.technicianName,
                                    dateOfSupply = order.dateText.split("•").firstOrNull()?.trim() ?: "Oct 07, 2026",
                                    taxableCharges = order.taxableAmount,
                                    cgstAmount = order.cgstAmount,
                                    sgstAmount = order.sgstAmount,
                                    totalAmount = order.amountInr
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
