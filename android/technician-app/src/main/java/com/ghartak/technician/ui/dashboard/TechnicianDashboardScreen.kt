package com.ghartak.technician.ui.dashboard

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TechnicianDashboardScreen(
    viewModel: TechnicianDashboardViewModel,
    onNavigateToSafety: (jobId: String) -> Unit,
    onNavigateToComplete: (jobId: String) -> Unit,
    onNavigateToNav: (jobId: String) -> Unit,
    onNavigateToDispatchAlert: (jobId: String) -> Unit,
    onLogout: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        viewModel.connectRealtimeBus(context)
    }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SlateDark900)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Technician Initials Avatar
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(FlameOrange.copy(alpha = 0.2f))
                                .border(1.5.dp, FlameOrange, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "RK",
                                color = FlameOrange,
                                fontWeight = FontWeight.Black,
                                fontSize = 16.sp
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = state.profile?.fullName ?: "Rajesh Kumar",
                                    color = TextPrimary,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                // Verified Safety Shield
                                Icon(
                                    imageVector = Icons.Default.Verified,
                                    contentDescription = "Verified 1000V",
                                    tint = SafetyGreen,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            Text(
                                text = "${state.profile?.badgeNumber ?: "GTS-TECH-4091"} • Pincode ${state.profile?.assignedPincode ?: "400001"}",
                                color = TextMuted,
                                fontSize = 12.sp
                            )
                        }
                    }

                    // Logout Action
                    IconButton(
                        onClick = {
                            viewModel.logout()
                            onLogout()
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Logout,
                            contentDescription = "Sign Out",
                            tint = TextMuted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Shift Duty Status Bar & Toggle
                Surface(
                    color = if (state.isOnline) SafetyGreenMuted.copy(alpha = 0.25f) else SlateDark700,
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (state.isOnline) SafetyGreen.copy(alpha = 0.5f) else SurfaceBorder
                    ),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(if (state.isOnline) SafetyGreen else SafetyAmber)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = if (state.isOnline) "ON DUTY • ACCEPTING DISPATCHES" else "OFF DUTY • SHIFT PAUSED",
                                    color = if (state.isOnline) SafetyGreen else TextSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = if (state.isOnline) "Live GPS telemetry active (50m geofence)" else "Switch online to receive inbound jobs",
                                    color = TextMuted,
                                    fontSize = 10.sp
                                )
                            }
                        }

                        Switch(
                            checked = state.isOnline,
                            onCheckedChange = { viewModel.toggleDutyStatus(context) },
                            enabled = !state.isUpdatingStatus,
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = Color.White,
                                checkedTrackColor = SafetyGreen,
                                uncheckedThumbColor = TextMuted,
                                uncheckedTrackColor = SlateDark800
                            )
                        )
                    }
                }
            }
        },
        containerColor = SlateDark900
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Daily Earnings Card
            item {
                EarningsSummaryCard(state)
            }

            // Test 60-Second Dispatch Siren Simulator
            item {
                Surface(
                    onClick = { onNavigateToDispatchAlert("job_mh_live_01") },
                    color = FlameOrange.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, FlameOrange.copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Emergency,
                                contentDescription = null,
                                tint = FlameOrange,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "SIMULATE INBOUND 60s DISPATCH SIREN",
                                    color = FlameOrange,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black
                                )
                                Text(
                                    text = "Test 60s emergency circular countdown & accept/reject API",
                                    color = TextSecondary,
                                    fontSize = 11.sp
                                )
                            }
                        }
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = FlameOrange,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Real-Time Bus Connected Pill
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ACTIVE FIELD TICKETS (${state.assignedJobs.size})",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )

                    Surface(
                        color = SlateDark800,
                        shape = RoundedCornerShape(6.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(SafetyGreen)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "REAL-TIME SSE BUS ACTIVE",
                                color = SafetyGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Assigned Jobs List
            items(state.assignedJobs) { job ->
                TechnicianJobCard(
                    job = job,
                    onNavigateToSafety = { onNavigateToSafety(job.id) },
                    onNavigateToComplete = { onNavigateToComplete(job.id) },
                    onNavigateToNav = { onNavigateToNav(job.id) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }

        // Inbound Dispatch 60-Second Alert Navigation
        LaunchedEffect(state.incomingDispatchAlert) {
            state.incomingDispatchAlert?.let { alertJob ->
                onNavigateToDispatchAlert(alertJob.id)
                viewModel.dismissIncomingDispatch()
            }
        }
    }
}

@Composable
fun EarningsSummaryCard(state: DashboardUiState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "TODAY'S FIELD EARNINGS",
                    color = FlameOrange,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )

                Surface(
                    color = FlameOrange.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(6.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, FlameOrange.copy(alpha = 0.3f))
                ) {
                    Text(
                        text = "70% DIRECT SPLIT",
                        color = FlameOrangeLight,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = "₹${"%,.2f".format(state.todayEarningsInr)}",
                color = TextPrimary,
                fontSize = 32.sp,
                fontWeight = FontWeight.Black
            )

            Spacer(modifier = Modifier.height(14.dp))
            Divider(color = SurfaceBorder, thickness = 1.dp)
            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                MetricItem(
                    label = "JOBS DONE",
                    value = "${state.jobsCompletedCount} Completed",
                    icon = Icons.Default.CheckCircle,
                    iconTint = SafetyGreen
                )
                MetricItem(
                    label = "SERVICE RATING",
                    value = "${state.customerRating} ★ Excellent",
                    icon = Icons.Default.Star,
                    iconTint = SafetyAmber
                )
                MetricItem(
                    label = "HUB ASSIGNMENT",
                    value = "MH-01 Mumbai",
                    icon = Icons.Default.LocationOn,
                    iconTint = SafetyBlue
                )
            }
        }
    }
}

@Composable
fun MetricItem(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, iconTint: Color) {
    Column {
        Text(text = label, color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(4.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(14.dp))
            Spacer(modifier = Modifier.width(4.dp))
            Text(text = value, color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun TechnicianJobCard(
    job: TechnicianJob,
    onNavigateToSafety: () -> Unit,
    onNavigateToComplete: () -> Unit,
    onNavigateToNav: () -> Unit
) {
    val techShare = job.totalAmountInr * 0.70

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardBackground),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header: Ticket + Status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = job.jobTicketNumber,
                        color = FlameOrange,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    if (job.priority == "HIGH_VOLTAGE" || job.priority == "CRITICAL_SAFETY") {
                        Surface(
                            color = SafetyRed.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(4.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SafetyRed.copy(alpha = 0.4f))
                        ) {
                            Text(
                                text = "⚡ 1000V SAFETY",
                                color = SafetyRed,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }

                Surface(
                    color = if (job.status == "IN_PROGRESS") SafetyGreenMuted.copy(alpha = 0.3f) else SlateDark700,
                    shape = RoundedCornerShape(6.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (job.status == "IN_PROGRESS") SafetyGreen.copy(alpha = 0.4f) else SurfaceBorder
                    )
                ) {
                    Text(
                        text = job.status,
                        color = if (job.status == "IN_PROGRESS") SafetyGreen else TextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Service Title
            Text(
                text = job.serviceTitle,
                color = TextPrimary,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Customer & Address
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "${job.customerName} (${job.customerPhone})",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Row(verticalAlignment = Alignment.Top) {
                Icon(
                    imageVector = Icons.Default.LocationOn,
                    contentDescription = null,
                    tint = FlameOrange,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "${job.customerAddressText} (Pincode ${job.pincode})",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            Divider(color = SurfaceBorder, thickness = 1.dp)
            Spacer(modifier = Modifier.height(12.dp))

            // Payout Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "YOUR 70% EARNING", color = TextMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Text(
                        text = "₹${"%,.2f".format(techShare)}",
                        color = SafetyGreen,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                // Action CTA
                when (job.status) {
                    "ASSIGNED" -> {
                        Row {
                            OutlinedButton(
                                onClick = onNavigateToNav,
                                shape = RoundedCornerShape(8.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, FlameOrange),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = FlameOrange)
                            ) {
                                Icon(imageVector = Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = "NAVIGATE", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                            Spacer(modifier = Modifier.width(8.dp))
                            Button(
                                onClick = onNavigateToSafety,
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = FlameOrange)
                            ) {
                                Text(text = "SAFETY CHECK", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                    "IN_PROGRESS" -> {
                        Button(
                            onClick = onNavigateToComplete,
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SafetyGreen)
                        ) {
                            Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "COMPLETE & OTP", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                    else -> {
                        Surface(
                            color = SlateDark700,
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "TICKET ARCHIVED",
                                color = TextMuted,
                                fontSize = 11.sp,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun InboundDispatchAlertModal(
    job: TechnicianJob,
    onAccept: () -> Unit,
    onReject: () -> Unit
) {
    var countdownSeconds by remember { mutableStateOf(60) }

    LaunchedEffect(Unit) {
        while (countdownSeconds > 0) {
            kotlinx.coroutines.delay(1000)
            countdownSeconds--
        }
        if (countdownSeconds == 0) {
            onReject()
        }
    }

    AlertDialog(
        onDismissRequest = { /* Modal must be explicitly responded to */ },
        confirmButton = {
            Button(
                onClick = onAccept,
                colors = ButtonDefaults.buttonColors(containerColor = SafetyGreen),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("ACCEPT WORK ORDER (${countdownSeconds}s)", fontWeight = FontWeight.Bold, color = Color.White)
            }
        },
        dismissButton = {
            OutlinedButton(
                onClick = onReject,
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SafetyRed),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = SafetyRed),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("DECLINE (PASS TO NEXT TECH)", fontWeight = FontWeight.SemiBold)
            }
        },
        containerColor = CardBackground,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = Icons.Default.Emergency, contentDescription = null, tint = FlameOrange)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "NEW DISPATCH ALERT",
                    color = FlameOrange,
                    fontWeight = FontWeight.Black,
                    fontSize = 16.sp
                )
            }
        },
        text = {
            Column {
                Text(
                    text = job.serviceTitle,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(text = "Customer: ${job.customerName}", color = TextSecondary, fontSize = 13.sp)
                Text(text = "Location: ${job.customerAddressText}", color = TextMuted, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SlateDark800, RoundedCornerShape(8.dp))
                        .padding(10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Your 70% Share:", color = TextSecondary, fontSize = 12.sp)
                    Text(
                        text = "₹${"%,.2f".format(job.totalAmountInr * 0.70)}",
                        color = SafetyGreen,
                        fontWeight = FontWeight.Black,
                        fontSize = 14.sp
                    )
                }
            }
        }
    )
}
