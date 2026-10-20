package com.ghartak.technician.ui.dispatch

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.session.SessionManager
import com.ghartak.technician.ui.theme.*
import com.ghartak.technician.util.IndianPincodeResolver

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DispatchAlertScreen(
    job: TechnicianJob,
    viewModel: DispatchAlertViewModel,
    onAccepted: (TechnicianJob) -> Unit,
    onDeclined: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    var showDeclineDialog by remember { mutableStateOf(false) }

    val sessionManager = remember { SessionManager(context) }

    // Dynamic regional hub derived from job destination pincode
    val regionalHubName = remember(job.pincode) {
        IndianPincodeResolver.getRegionalHubCodeName(job.pincode)
    }

    // Dynamic technician live location (reading LocationManager or fallback to technician's assigned base hub)
    val (techLat, techLng) = remember(job.id) {
        var lat = 0.0
        var lng = 0.0
        try {
            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? android.location.LocationManager
            val hasFine = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
            val hasCoarse = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
            if (lm != null && (hasFine || hasCoarse)) {
                val lastGps = if (hasFine) lm.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER) else null
                val lastNet = if (hasCoarse) lm.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER) else null
                val best = lastGps ?: lastNet
                if (best != null && (best.latitude != 0.0 || best.longitude != 0.0)) {
                    lat = best.latitude
                    lng = best.longitude
                }
            }
        } catch (e: SecurityException) {
            // Ignored if permissions not granted yet
        }
        if (lat == 0.0 && lng == 0.0) {
            val techPin = sessionManager.getPincode().ifEmpty { "760001" }
            val pinCoords = IndianPincodeResolver.getCoordinatesForPincode(techPin)
            lat = pinCoords.first
            lng = pinCoords.second
        }
        lat to lng
    }

    // Dynamic customer coordinates & Haversine distance and transit ETA calculation
    val (transitDistanceKm, transitEtaMinutes) = remember(techLat, techLng, job.customerLatitude, job.customerLongitude, job.pincode) {
        val (destFallbackLat, destFallbackLng) = IndianPincodeResolver.getCoordinatesForPincode(job.pincode)
        val destLat = if (job.customerLatitude != null && job.customerLatitude != 0.0) job.customerLatitude else destFallbackLat
        val destLng = if (job.customerLongitude != null && job.customerLongitude != 0.0) job.customerLongitude else destFallbackLng

        val dist = IndianPincodeResolver.calculateHaversineDistanceKm(techLat, techLng, destLat, destLng)
        val roundedDist = Math.max(0.1, (Math.round(dist * 10.0) / 10.0))
        val eta = IndianPincodeResolver.calculateEtaMinutes(roundedDist, 22.0)
        roundedDist to eta
    }

    LaunchedEffect(job.id) {
        viewModel.startCountdown(context) {
            // Auto timeout triggers rejection
            viewModel.rejectDispatch(context, job.id, "TIMEOUT_EXPIRED_60S", onDeclined)
        }
    }

    // Dynamic color transition based on countdown urgency
    val timerColor by animateColorAsState(
        targetValue = when {
            state.remainingSeconds > 30 -> SafetyGreen
            state.remainingSeconds > 10 -> SafetyAmber
            else -> SafetyRed
        },
        label = "timerColor"
    )

    val animatedProgress by animateFloatAsState(
        targetValue = state.progress,
        label = "timerProgress"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateDark900)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Emergency Header Banner
            Surface(
                color = FlameOrange.copy(alpha = 0.15f),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, FlameOrange),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Emergency,
                        contentDescription = "Urgent Dispatch",
                        tint = FlameOrange,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "INBOUND WORK ORDER DISPATCH",
                            color = FlameOrange,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.5.sp
                        )
                        Text(
                            text = "$regionalHubName • Auto-Allocation Siren Active",
                            color = TextSecondary,
                            fontSize = 11.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // 60-Second Circular Countdown Widget
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(160.dp)
            ) {
                // Background Track
                CircularProgressIndicator(
                    progress = { 1.0f },
                    modifier = Modifier.size(160.dp),
                    color = SlateDark700,
                    strokeWidth = 10.dp,
                )

                // Animated Progress Ring
                CircularProgressIndicator(
                    progress = { animatedProgress },
                    modifier = Modifier.size(160.dp),
                    color = timerColor,
                    strokeWidth = 10.dp,
                )

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "${state.remainingSeconds}s",
                        color = timerColor,
                        fontSize = 42.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        text = "DEADLINE",
                        color = TextMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = if (state.remainingSeconds > 10)
                    "Review order details and respond before timer expires"
                else
                    "⚠️ EXPIRING SOON! System will reassign to another technician",
                color = if (state.remainingSeconds > 10) TextSecondary else SafetyRed,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Work Order Details Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    // Ticket & Priority
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = job.jobTicketNumber,
                            color = FlameOrange,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )

                        val isElectrical = job.serviceTitle.lowercase().let {
                            it.contains("electr") || it.contains("wire") || it.contains("mcb") || it.contains("panel") || it.contains("fan") || it.contains("ac") || it.contains("generator")
                        }
                        val protocolBadgeText = if (isElectrical) "⚡ 1000V PROTOCOL" else "🛡️ VERIFIED TRADE PROTOCOL"
                        val badgeColor = if (isElectrical) SafetyRed else FlameOrange

                        Surface(
                            color = badgeColor.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(6.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, badgeColor.copy(alpha = 0.4f))
                        ) {
                            Text(
                                text = protocolBadgeText,
                                color = badgeColor,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = job.serviceTitle,
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(14.dp))
                    Divider(color = SurfaceBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(14.dp))

                    // Location & Distance
                    Row(verticalAlignment = Alignment.Top) {
                        Icon(
                            imageVector = Icons.Default.LocationOn,
                            contentDescription = null,
                            tint = FlameOrange,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = job.customerAddressText,
                                color = TextPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "$transitDistanceKm km from your live GPS • ~$transitEtaMinutes min transit",
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Customer Details
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Person,
                            contentDescription = null,
                            tint = TextMuted,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "${job.customerName} (Verified Customer)",
                            color = TextSecondary,
                            fontSize = 13.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Payout Split Highlight Box
                    Surface(
                        color = SlateDark800,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    text = "YOUR 70% EARNING",
                                    color = TextMuted,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    letterSpacing = 0.5.sp
                                )
                                Text(
                                    text = "₹${"%,.2f".format(job.totalAmountInr * 0.70)}",
                                    color = SafetyGreen,
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = "TOTAL QUOTE",
                                    color = TextMuted,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "₹${"%,.2f".format(job.totalAmountInr)}",
                                    color = TextSecondary,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Primary Action: ACCEPT DISPATCH
            Button(
                onClick = {
                    viewModel.acceptDispatch(context, job, onAccepted)
                },
                enabled = !state.isAccepting && !state.isRejecting && state.remainingSeconds > 0,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SafetyGreen)
            ) {
                if (state.isAccepting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "ACCEPT WORK ORDER NOW",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Secondary Action: DECLINE DISPATCH
            OutlinedButton(
                onClick = { showDeclineDialog = true },
                enabled = !state.isAccepting && !state.isRejecting,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = SafetyRed),
                border = androidx.compose.foundation.BorderStroke(1.dp, SafetyRed.copy(alpha = 0.6f))
            ) {
                Text(
                    text = "DECLINE (PASS TO NEXT SPECIALIST)",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Decline Reason Dialog
        if (showDeclineDialog) {
            val declineReasons = listOf(
                "Excessive distance / Heavy traffic",
                "Specialized tool kit missing or occupied",
                "Shift ending soon",
                "Personal emergency"
            )
            var selectedReason by remember { mutableStateOf(declineReasons[0]) }

            AlertDialog(
                onDismissRequest = { showDeclineDialog = false },
                containerColor = CardBackground,
                title = {
                    Text(
                        text = "Reason for Declining Dispatch",
                        color = TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                text = {
                    Column {
                        Text(
                            text = "This will immediately route the work order to the next available specialist in Pincode ${job.pincode}.",
                            color = TextSecondary,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        declineReasons.forEach { reason ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RadioButton(
                                    selected = (reason == selectedReason),
                                    onClick = { selectedReason = reason },
                                    colors = RadioButtonDefaults.colors(selectedColor = FlameOrange)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = reason,
                                    color = TextPrimary,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            showDeclineDialog = false
                            viewModel.rejectDispatch(context, job.id, selectedReason, onDeclined)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SafetyRed)
                    ) {
                        Text("CONFIRM DECLINE", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeclineDialog = false }) {
                        Text("CANCEL", color = TextSecondary)
                    }
                }
            )
        }
    }
}
