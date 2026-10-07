package com.ghartak.customer.ui.signoff

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.customer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceSignoffScreen(
    jobId: String,
    viewModel: ServiceSignoffViewModel,
    onBack: () -> Unit,
    onReturnHome: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val feedbackTags = listOf(
        "1000V Safe",
        "Punctual",
        "Neat Wiring",
        "Spotless Cleanup",
        "Calibrated Tester",
        "Polite"
    )

    LaunchedEffect(jobId) {
        viewModel.initSignoff(jobId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "SERVICE SIGN-OFF & INVOICE",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = "Ticket: ${state.ticketNumber} • 18% GST Compliant",
                            fontSize = 11.sp,
                            color = SapphireBlue800
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = TextDarkPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            Surface(
                color = Color.White,
                shadowElevation = 8.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Button(
                    onClick = {
                        viewModel.submitFeedbackAndSignoff {
                            onReturnHome()
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .height(50.dp)
                ) {
                    Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "SUBMIT SIGN-OFF & RETURN TO HOME", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        },
        containerColor = SurfaceLight
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Work Completion Certificate Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, SuccessGreen.copy(alpha = 0.5f))
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(54.dp)
                            .clip(CircleShape)
                            .background(SuccessGreen.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = Icons.Default.Verified, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(32.dp))
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "ELECTRICAL WORK RESTORED & CERTIFIED",
                        color = SuccessGreen,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Black,
                        letterSpacing = 0.5.sp
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = state.serviceTitle,
                        color = TextDarkPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Executed by ${state.technicianName} (${state.technicianBadge})",
                        color = TextDarkSecondary,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Surface(
                        color = SurfaceLight,
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Shield, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "12-MONTH OFFICIAL SERVICE WARRANTY ACTIVE",
                                color = SapphireBlue900,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // 18% GST Tax Invoice Display Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "GST TAX INVOICE",
                                color = SapphireBlue800,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = state.invoiceNumber,
                                color = TextDarkPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Black
                            )
                        }

                        Surface(
                            color = SuccessGreen.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text(
                                text = "PAID (ONLINE)",
                                color = SuccessGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = SurfaceBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Date of Supply:", color = TextDarkMuted, fontSize = 11.sp)
                        Text(text = state.invoiceDate, color = TextDarkSecondary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "GSTIN / State:", color = TextDarkMuted, fontSize = 11.sp)
                        Text(text = "${state.gstin} (27-MH)", color = TextDarkSecondary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "SAC / HSN Code:", color = TextDarkMuted, fontSize = 11.sp)
                        Text(text = state.hsnSacCode, color = TextDarkSecondary, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    Divider(color = SurfaceBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(10.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Taxable Electrical Charges:", color = TextDarkSecondary, fontSize = 12.sp)
                        Text(text = "₹${"%,.2f".format(state.basePriceInr)}", color = TextDarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "CGST (9.0%):", color = TextDarkSecondary, fontSize = 12.sp)
                        Text(text = "₹${"%,.2f".format(state.cgstInr)}", color = TextDarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "SGST (9.0%):", color = TextDarkSecondary, fontSize = 12.sp)
                        Text(text = "₹${"%,.2f".format(state.sgstInr)}", color = TextDarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Total Invoice Amount:", color = SapphireBlue900, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text(text = "₹${"%,.2f".format(state.totalAmountInr)}", color = SapphireBlue900, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Download PDF Button
                    OutlinedButton(
                        onClick = { viewModel.downloadGstInvoicePdf(context) },
                        enabled = !state.isDownloadingInvoice,
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SapphireBlue800),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = SapphireBlue800),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        if (state.isDownloadingInvoice) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = SapphireBlue800, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("GENERATING PDF...", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        } else {
                            Icon(imageVector = Icons.Default.FileDownload, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("DOWNLOAD GST TAX INVOICE (PDF)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    if (state.downloadSuccessMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = state.downloadSuccessMessage ?: "",
                            color = SuccessGreen,
                            fontSize = 11.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            // Craftsmanship Review Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "RATE YOUR EXPERIENCE",
                        color = TextDarkPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Star Rating Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        for (star in 1..5) {
                            Icon(
                                imageVector = if (star <= state.rating) Icons.Default.Star else Icons.Default.StarBorder,
                                contentDescription = "$star Stars",
                                tint = WarningAmber,
                                modifier = Modifier
                                    .size(38.dp)
                                    .clickable { viewModel.onRatingChanged(star) }
                                    .padding(4.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Feedback Tag Chips
                    Text(text = "What went well?", color = TextDarkMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        feedbackTags.take(3).forEach { tag ->
                            val isSelected = state.selectedTags.contains(tag)
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.toggleTag(tag) },
                                label = { Text(tag, fontSize = 10.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = SapphireBlue800.copy(alpha = 0.12f),
                                    selectedLabelColor = SapphireBlue800
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    OutlinedTextField(
                        value = state.reviewText,
                        onValueChange = { viewModel.onReviewTextChanged(it) },
                        label = { Text("Share feedback for Rajesh Kumar") },
                        modifier = Modifier.fillMaxWidth(),
                        maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SapphireBlue800,
                            unfocusedBorderColor = SurfaceBorder
                        ),
                        shape = RoundedCornerShape(10.dp)
                    )
                }
            }

            // Handover Verification Checkboxes
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(text = "PHYSICAL HANDOVER VERIFICATION", color = TextDarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = state.isWorkRestoredConfirmed,
                            onCheckedChange = { viewModel.toggleWorkRestored(it) },
                            colors = CheckboxDefaults.colors(checkedColor = SapphireBlue800)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Power & all circuit breakers inspected and functioning normally.", fontSize = 12.sp, color = TextDarkSecondary)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(
                            checked = state.isSafetyChecklistConfirmed,
                            onCheckedChange = { viewModel.toggleSafetyChecklist(it) },
                            colors = CheckboxDefaults.colors(checkedColor = SapphireBlue800)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Insulation debris cleared and distribution box panel lid securely fastened.", fontSize = 12.sp, color = TextDarkSecondary)
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}
