package com.ghartak.customer.ui.payment

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.customer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    serviceId: String,
    viewModel: PaymentViewModel,
    onBack: () -> Unit,
    onBookingSuccess: (jobId: String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "PAYMENT & DISPATCH",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = "100% RBI & NPCI Compliant Gateway",
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
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "FINAL AMOUNT", color = TextDarkMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(
                            text = "₹${"%,.2f".format(state.totalAmountInr)}",
                            color = SapphireBlue900,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black
                        )
                    }

                    Button(
                        onClick = {
                            viewModel.confirmAndCreateJob(context, onBookingSuccess)
                        },
                        enabled = !state.isProcessing,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                    ) {
                        if (state.isProcessing) {
                            CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("DISPATCHING...", fontWeight = FontWeight.Bold, color = Color.White)
                        } else {
                            Icon(imageVector = Icons.Default.Bolt, contentDescription = null, modifier = Modifier.size(18.dp), tint = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "CONFIRM & DISPATCH", fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
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
            // Amount Due Overview Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "ORDER SUMMARY & CHARGES",
                        color = SapphireBlue800,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = state.serviceTitle,
                        color = TextDarkPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Destination: ${state.addressText}",
                        color = TextDarkSecondary,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = SurfaceBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Base Service Fee:", color = TextDarkSecondary, fontSize = 12.sp)
                        Text(text = "₹${"%,.2f".format(state.basePriceInr)}", color = TextDarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "18% GST (Includes Tax Invoice):", color = TextDarkSecondary, fontSize = 12.sp)
                        Text(text = "₹${"%,.2f".format(state.gst18PctInr)}", color = TextDarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Total Payable Amount:", color = SapphireBlue900, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text(text = "₹${"%,.2f".format(state.totalAmountInr)}", color = SapphireBlue900, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    }
                }
            }

            // Payment Options List
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "PAYMENT METHOD",
                        color = TextDarkPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    PaymentOptionRow(
                        title = "Google Pay (GPay UPI)",
                        subtitle = "Instant app switch • 0% convenience fee",
                        badge = "POPULAR",
                        badgeColor = SuccessGreen,
                        icon = Icons.Default.AccountBalanceWallet,
                        isSelected = state.selectedPaymentMethod == "UPI_GPAY",
                        onSelect = { viewModel.selectPaymentMethod("UPI_GPAY") }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    PaymentOptionRow(
                        title = "PhonePe / Paytm UPI",
                        subtitle = "Pay using your favorite UPI app",
                        badge = null,
                        badgeColor = Color.Transparent,
                        icon = Icons.Default.QrCode,
                        isSelected = state.selectedPaymentMethod == "UPI_PHONEPE",
                        onSelect = { viewModel.selectPaymentMethod("UPI_PHONEPE") }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    PaymentOptionRow(
                        title = "Pay on Service Completion",
                        subtitle = "Inspect restored power first, then pay via QR or cash",
                        badge = "ZERO ADVANCE",
                        badgeColor = SapphireBlue800,
                        icon = Icons.Default.Handshake,
                        isSelected = state.selectedPaymentMethod == "PAY_ON_SERVICE",
                        onSelect = { viewModel.selectPaymentMethod("PAY_ON_SERVICE") }
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    PaymentOptionRow(
                        title = "Credit / Debit Cards",
                        subtitle = "Visa, MasterCard, RuPay with 256-bit encryption",
                        badge = null,
                        badgeColor = Color.Transparent,
                        icon = Icons.Default.CreditCard,
                        isSelected = state.selectedPaymentMethod == "CARD",
                        onSelect = { viewModel.selectPaymentMethod("CARD") }
                    )
                }
            }

            // Trust Guarantee Card
            Surface(
                color = SapphireBlue800.copy(alpha = 0.08f),
                shape = RoundedCornerShape(14.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SapphireBlue800.copy(alpha = 0.2f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = null,
                        tint = SapphireBlue800,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = "Ghar Tak 100% Quality & Safety Guarantee",
                            color = SapphireBlue900,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "All technicians are VDE 1000V certified & background verified. Free rework or refund if not satisfied.",
                            color = TextDarkSecondary,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
fun PaymentOptionRow(
    title: String,
    subtitle: String,
    badge: String?,
    badgeColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Surface(
        onClick = onSelect,
        color = if (isSelected) SapphireBlue800.copy(alpha = 0.06f) else SurfaceLight,
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(
            1.5.dp,
            if (isSelected) SapphireBlue800 else SurfaceBorder
        ),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            RadioButton(
                selected = isSelected,
                onClick = onSelect,
                colors = RadioButtonDefaults.colors(selectedColor = SapphireBlue800)
            )

            Spacer(modifier = Modifier.width(8.dp))

            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = if (isSelected) SapphireBlue800 else TextDarkMuted,
                modifier = Modifier.size(22.dp)
            )

            Spacer(modifier = Modifier.width(10.dp))

            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = title,
                        color = TextDarkPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    if (badge != null) {
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            color = badgeColor.copy(alpha = 0.12f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = badge,
                                color = badgeColor,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                Text(
                    text = subtitle,
                    color = TextDarkMuted,
                    fontSize = 11.sp
                )
            }
        }
    }
}
