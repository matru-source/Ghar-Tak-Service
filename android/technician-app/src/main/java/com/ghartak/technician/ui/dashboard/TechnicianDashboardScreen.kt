package com.ghartak.technician.ui.dashboard

import com.ghartak.technician.ui.nav.launchTurnByTurnNavigation

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
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
    var showSosDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.connectRealtimeBus(context)
    }

    Scaffold(
        bottomBar = {
            TechnicianBottomNavBar(
                currentTab = state.currentTab,
                onTabSelected = { tab ->
                    if (tab == "SOS") {
                        showSosDialog = true
                    } else {
                        viewModel.selectTab(tab)
                    }
                }
            )
        },
        containerColor = ScreenBackgroundLight
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (state.currentTab) {
                "HOME" -> {
                    TechnicianHomeScreenContent(
                        state = state,
                        onToggleDuty = { viewModel.toggleDutyStatus(context) },
                        onAcceptNotification = { viewModel.acceptNotificationJob(it) },
                        onRejectNotification = { viewModel.rejectNotificationJob(it) },
                        onSelectJob = { viewModel.viewJobDetails(it) },
                        onSimulateDispatch = { onNavigateToDispatchAlert("job_1001") }
                    )
                }
                "JOB_DETAILS" -> {
                    val job = state.selectedJob ?: state.assignedJobs.firstOrNull()
                    if (job != null) {
                        TechnicianJobDetailsContent(
                            job = job,
                            onBack = { viewModel.closeJobDetails() },
                            onNavigate = { onNavigateToNav(job.id) },
                            onCall = {
                                val callIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${job.customerPhone}"))
                                context.startActivity(callIntent)
                            },
                            onStartJob = { onNavigateToSafety(job.id) },
                            onCompleteJob = { onNavigateToComplete(job.id) }
                        )
                    } else {
                        viewModel.selectTab("HOME")
                    }
                }
                "EARNINGS" -> {
                    TechnicianEarningsContent(
                        state = state,
                        onBack = { viewModel.selectTab("HOME") },
                        onFilterSelected = { viewModel.setEarningsFilter(it) },
                        onWithdraw = { viewModel.withdrawEarnings() }
                    )
                }
                "JOBS" -> {
                    TechnicianAllJobsContent(
                        state = state,
                        onSelectJob = { viewModel.viewJobDetails(it) }
                    )
                }
                "PROFILE" -> {
                    TechnicianProfileContent(
                        state = state,
                        onToggleDuty = { viewModel.toggleDutyStatus(context) },
                        onLogout = {
                            viewModel.logout()
                            onLogout()
                        }
                    )
                }
            }
        }

        // Emergency SOS Dialog
        if (showSosDialog) {
            AlertDialog(
                onDismissRequest = { showSosDialog = false },
                icon = {
                    Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = SafetyRed, modifier = Modifier.size(36.dp))
                },
                title = {
                    Text(text = "EMERGENCY SAFETY SOS", fontWeight = FontWeight.Black, color = SafetyRed)
                },
                text = {
                    Text(
                        text = "High-voltage flash, live arc hazard, or site accident detected?\n\nTriggering SOS alerts Ghar Tak 24x7 Safety Command Center with your exact GPS telemetry and VDE 1000V crew credentials.",
                        fontSize = 13.sp,
                        color = TextDarkSecondary
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            showSosDialog = false
                            val emergencyIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:112"))
                            context.startActivity(emergencyIntent)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SafetyRed)
                    ) {
                        Text("CALL 112 / DISPATCH HELPLINE", fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showSosDialog = false }) {
                        Text("Cancel", color = TextDarkMuted)
                    }
                }
            )
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

// =========================================================================
// SCREEN 1: TECHNICIAN HOME SCREEN (Matches Client Asset Screen 1)
// =========================================================================

@Composable
fun TechnicianHomeScreenContent(
    state: DashboardUiState,
    onToggleDuty: () -> Unit,
    onAcceptNotification: (id: String) -> Unit,
    onRejectNotification: (id: String) -> Unit,
    onSelectJob: (TechnicianJob) -> Unit,
    onSimulateDispatch: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // 1. Top Header Banner (Primary Theme: Deep Electric Orange)
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(ElectricOrangeHeader)
                    .padding(horizontal = 16.dp, vertical = 14.dp)
            ) {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            val firstName = state.profile?.fullName?.split(" ")?.firstOrNull() ?: "Rajesh"
                            Text(
                                text = "Good Morning, $firstName!",
                                color = Color.White,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Black
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "ID: ${state.profile?.badgeNumber ?: "TECH-1024"} | Pincodes: ${state.profile?.assignedPincode ?: "400001"}, 400002",
                                color = Color.White.copy(alpha = 0.9f),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        // Online / Offline Pill Button
                        Surface(
                            onClick = onToggleDuty,
                            color = if (state.isOnline) Color(0xFF2E7D32) else Color(0xFFD32F2F),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.6f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(7.dp)
                                        .clip(CircleShape)
                                        .background(Color.White)
                                )
                                Spacer(modifier = Modifier.width(5.dp))
                                Text(
                                    text = if (state.isOnline) "Online" else "Offline",
                                    color = Color.White,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Earnings Banner Inside Header
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp, horizontal = 12.dp),
                            horizontalArrangement = Arrangement.SpaceEvenly,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Today: ₹${"%,.0f".format(state.todayEarningsInr)}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricOrangeDark
                            )
                            Text(text = "|", color = Color(0xFFE0E0E0))
                            Text(
                                text = "This Week: ₹${"%,.0f".format(state.weekEarningsInr)}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricOrangeDark
                            )
                            Text(text = "|", color = Color(0xFFE0E0E0))
                            Text(
                                text = "This Month: ₹${"%,.0f".format(state.monthEarningsInr)}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = ElectricOrangeDark
                            )
                        }
                    }
                }
            }
        }

        // 2. Quick Stat Boxes Row (3 Cards: Today's Jobs, Completed, Pending)
        item {
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Card 1: Today's Jobs
                Surface(
                    color = Color(0xFFFFF3E0),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFCC80)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 12.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = "Today's Jobs", fontSize = 11.sp, color = TextDarkSecondary, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = "${state.jobsTodayCount}", fontSize = 22.sp, color = ElectricOrangeDark, fontWeight = FontWeight.Black)
                    }
                }

                // Card 2: Completed
                Surface(
                    color = Color(0xFFE8F5E9),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA5D6A7)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 12.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = "Completed", fontSize = 11.sp, color = TextDarkSecondary, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = "${state.jobsCompletedCount}", fontSize = 22.sp, color = Color(0xFF2E7D32), fontWeight = FontWeight.Black)
                    }
                }

                // Card 3: Pending
                Surface(
                    color = Color(0xFFFFF8E1),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFE082)),
                    modifier = Modifier.weight(1f)
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 12.dp, horizontal = 6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(text = "Pending", fontSize = 11.sp, color = TextDarkSecondary, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = "${state.jobsPendingCount}", fontSize = 22.sp, color = Color(0xFFE65100), fontWeight = FontWeight.Black)
                    }
                }
            }
        }

        // 3. New Job Notifications (Cards with Accept / Reject)
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Text(
                    text = "New Job Notifications (${state.newJobNotifications.size} new)",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary
                )

                Spacer(modifier = Modifier.height(10.dp))

                state.newJobNotifications.forEach { notif ->
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFCC80)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 10.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Icon Box
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFFFF3E0)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (notif.iconType == "FAN") Icons.Default.Bolt else Icons.Default.Power,
                                    contentDescription = null,
                                    tint = ElectricOrangeHeader,
                                    modifier = Modifier.size(22.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "New Job ${notif.jobTicketNumber}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "${notif.serviceTitle} | ${notif.scheduledTime}",
                                    fontSize = 11.sp,
                                    color = TextDarkSecondary
                                )
                                Text(
                                    text = "Pincode: ${notif.pincode} | Customer: ${notif.customerName}",
                                    fontSize = 10.sp,
                                    color = TextDarkMuted
                                )
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            // Accept & Reject Buttons
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Button(
                                    onClick = { onAcceptNotification(notif.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                                    shape = RoundedCornerShape(6.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                                    modifier = Modifier.height(26.dp)
                                ) {
                                    Text("Accept", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                                Button(
                                    onClick = { onRejectNotification(notif.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD32F2F)),
                                    shape = RoundedCornerShape(6.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 2.dp),
                                    modifier = Modifier.height(26.dp)
                                ) {
                                    Text("Reject", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // 4. My Active Jobs
        item {
            Spacer(modifier = Modifier.height(8.dp))
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Text(
                    text = "My Active Jobs",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary
                )

                Spacer(modifier = Modifier.height(10.dp))

                state.assignedJobs.forEach { job ->
                    Surface(
                        onClick = { onSelectJob(job) },
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 10.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE8F5E9)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (job.serviceTitle.contains("Light", ignoreCase = true)) Icons.Default.Lightbulb else Icons.Default.Build,
                                    contentDescription = null,
                                    tint = Color(0xFF2E7D32),
                                    modifier = Modifier.size(20.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${job.jobTicketNumber} - ${job.serviceTitle}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "${state.profile?.fullName?.split(" ")?.firstOrNull() ?: "Rajesh"} - ${if (job.status == "STARTED") "In Progress | 45 mins left" else "En Route | 10 mins away"}",
                                    fontSize = 11.sp,
                                    color = TextDarkSecondary
                                )
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(imageVector = Icons.Default.LocationOn, contentDescription = null, tint = Color(0xFFE65100), modifier = Modifier.size(11.dp))
                                    Spacer(modifier = Modifier.width(2.dp))
                                    Text(text = job.customerAddressText, fontSize = 10.sp, color = TextDarkMuted, maxLines = 1)
                                }
                            }

                            Spacer(modifier = Modifier.width(8.dp))

                            // Status Pill
                            Surface(
                                color = if (job.status == "STARTED") Color(0xFFFB8C00) else Color(0xFF2E7D32),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = if (job.status == "STARTED") "Started" else "En Route",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Fast Staging Dispatch Simulator Button
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Surface(
                onClick = onSimulateDispatch,
                color = ElectricOrangeHeader.copy(alpha = 0.08f),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, ElectricOrangeHeader.copy(alpha = 0.3f)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Emergency, contentDescription = null, tint = ElectricOrangeHeader, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Test Inbound 60s Dispatch Siren",
                            color = ElectricOrangeHeader,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = ElectricOrangeHeader, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

// =========================================================================
// SCREEN 2: TECHNICIAN JOB DETAILS SCREEN (Matches Client Asset Screen 2)
// =========================================================================

@Composable
fun TechnicianJobDetailsContent(
    job: TechnicianJob,
    onBack: () -> Unit,
    onNavigate: () -> Unit,
    onCall: () -> Unit,
    onStartJob: () -> Unit,
    onCompleteJob: () -> Unit
) {
    val context = LocalContext.current
    var showNavigationDialog by remember { mutableStateOf(false) }

    if (showNavigationDialog) {
        AlertDialog(
            onDismissRequest = { showNavigationDialog = false },
            icon = {
                Icon(imageVector = Icons.Default.Navigation, contentDescription = null, tint = ActionNavigateBlue, modifier = Modifier.size(32.dp))
            },
            title = {
                Text("Select Navigation Mode", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = TextDarkPrimary)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Destination: ${job.customerName}\n${job.customerAddressText}",
                        fontSize = 12.sp,
                        color = TextDarkSecondary
                    )
                    Spacer(modifier = Modifier.height(4.dp))

                    Button(
                        onClick = {
                            showNavigationDialog = false
                            onNavigate()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = ActionNavigateBlue),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(imageVector = Icons.Default.DirectionsRun, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("In-App Doorstep Transit & Geofence", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            showNavigationDialog = false
                            launchTurnByTurnNavigation(
                                context = context,
                                lat = job.customerLatitude ?: 18.9067,
                                lng = job.customerLongitude ?: 72.8147,
                                customerName = job.customerName,
                                address = job.customerAddressText
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(imageVector = Icons.Default.Directions, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Google Maps Turn-by-Turn (Driving)", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showNavigationDialog = false }) {
                    Text("Cancel", color = TextDarkMuted)
                }
            }
        )
    }

    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Orange Header Bar
        Surface(
            color = ElectricOrangeHeader,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Job Details",
                    color = Color.White,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Status Bar (Green Pill)
            item {
                Surface(
                    color = Color(0xFF2E7D32),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Status: ${if (job.status == "STARTED") "In Progress at Customer Site" else "En Route to Customer"}",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            }

            // 1. Job Info Card
            item {
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFCC80)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Job ID: ${job.jobTicketNumber}",
                            fontWeight = FontWeight.Black,
                            fontSize = 13.sp,
                            color = ElectricOrangeDark
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Service: ${job.serviceTitle}",
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 13.sp,
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Date & Time: ${job.scheduledAt ?: "Today, 10:30 AM"}",
                            fontSize = 12.sp,
                            color = TextDarkSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Pincode: ${job.pincode}",
                            fontSize = 12.sp,
                            color = TextDarkSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Amount: ₹${"%,.0f".format(job.totalAmountInr)} (Including GST)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = TextDarkPrimary
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        // Commission Highlight Pill
                        Surface(
                            color = Color(0xFFE8F5E9),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Your Commission: ₹${"%,.0f".format(job.totalAmountInr * 0.6)}",
                                color = Color(0xFF2E7D32),
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                            )
                        }
                    }
                }
            }

            // 2. Customer Details Card
            item {
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFCC80)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Customer Details",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = ElectricOrangeDark
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Name: ${job.customerName}",
                            fontSize = 12.sp,
                            color = TextDarkPrimary,
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Phone: ${job.customerPhone}",
                            fontSize = 12.sp,
                            color = TextDarkSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Address: ${job.customerAddressText}",
                            fontSize = 12.sp,
                            color = TextDarkSecondary
                        )
                    }
                }
            }

            // 3. Job Actions Section (4 Buttons)
            item {
                Text(
                    text = "Job Actions",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = TextDarkPrimary
                )
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Navigate (Blue)
                    Button(
                        onClick = { showNavigationDialog = true },
                        colors = ButtonDefaults.buttonColors(containerColor = ActionNavigateBlue),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(imageVector = Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(14.dp), tint = Color.White)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Navigate", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    // Call Customer (Green)
                    Button(
                        onClick = onCall,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Call Customer", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Start Job (Orange) -> Safety Interlock
                    Button(
                        onClick = onStartJob,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFB8C00)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Start Job", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    // Complete Job (Green)
                    Button(
                        onClick = onCompleteJob,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Complete", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// =========================================================================
// SCREEN 3: TECHNICIAN EARNINGS SCREEN (Matches Client Asset Screen 3)
// =========================================================================

@Composable
fun TechnicianEarningsContent(
    state: DashboardUiState,
    onBack: () -> Unit,
    onFilterSelected: (String) -> Unit,
    onWithdraw: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Orange Header Bar
        Surface(
            color = ElectricOrangeHeader,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "My Earnings",
                    color = Color.White,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Total Earnings Card
            item {
                Surface(
                    color = Color(0xFFFFF8E1),
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFCC80)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Total Earnings (This Month)",
                            color = ElectricOrangeDark,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "₹${"%,.0f".format(state.monthEarningsInr)}",
                                color = ElectricOrangeDark,
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Black
                            )

                            Surface(
                                color = Color(0xFFE8F5E9),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = "↑ 15% from last month",
                                    color = Color(0xFF2E7D32),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Filter Tabs: Today | This Week | This Month | All Time
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            val filters = listOf(
                                "TODAY" to "Today",
                                "THIS_WEEK" to "This Week",
                                "THIS_MONTH" to "This Month",
                                "ALL_TIME" to "All Time"
                            )
                            filters.forEach { (key, label) ->
                                val isSelected = state.selectedEarningsFilter == key
                                Surface(
                                    onClick = { onFilterSelected(key) },
                                    color = if (isSelected) ElectricOrangeHeader else Color.Transparent,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        text = label,
                                        color = if (isSelected) Color.White else TextDarkSecondary,
                                        fontSize = 11.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Recent Transactions Section
            item {
                Text(
                    text = "Recent Transactions",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = TextDarkPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))

                state.recentTransactions.forEach { tx ->
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(if (tx.isPending) Color(0xFFFFF3E0) else Color(0xFFE8F5E9)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = if (tx.isPending) Icons.Default.HourglassEmpty else Icons.Default.Check,
                                    contentDescription = null,
                                    tint = if (tx.isPending) Color(0xFFFB8C00) else Color(0xFF2E7D32),
                                    modifier = Modifier.size(18.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "${tx.jobTicketNumber} - ${tx.serviceTitle}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = tx.completedTime,
                                    fontSize = 10.sp,
                                    color = TextDarkMuted
                                )
                            }

                            Text(
                                text = if (tx.isPending) "+₹${"%,.0f".format(tx.amountInr)} (Pending)" else "+₹${"%,.0f".format(tx.amountInr)}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = if (tx.isPending) Color(0xFFFB8C00) else Color(0xFF2E7D32)
                            )
                        }
                    }
                }
            }

            // Withdraw Earnings Button
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Button(
                    onClick = onWithdraw,
                    enabled = !state.isWithdrawing,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    if (state.isWithdrawing) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Text(
                            text = "Withdraw Earnings (₹${"%,.0f".format(state.availableWithdrawalInr)} Available)",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                }

                if (state.withdrawSuccessMessage != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = state.withdrawSuccessMessage ?: "",
                        color = Color(0xFF2E7D32),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // Secured Payment Withdrawal Card (Zex Security Module)
            item {
                Surface(
                    color = ZexSecurityYellow,
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, ZexSecurityBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = Color(0xFFFB8C00),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Secured Payment Withdrawal",
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                color = Color(0xFFB45309)
                            )
                            Text(
                                text = "Your Payment is secured with Zex Security Module",
                                fontSize = 10.sp,
                                color = Color(0xFF78350F)
                            )
                        }
                    }
                }
            }
        }
    }
}

// =========================================================================
// TAB 4: ALL JOBS CONTENT
// =========================================================================

@Composable
fun TechnicianAllJobsContent(
    state: DashboardUiState,
    onSelectJob: (TechnicianJob) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Surface(color = ElectricOrangeHeader, modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "Assigned Field Tickets (${state.assignedJobs.size})",
                color = Color.White,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(16.dp)
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(state.assignedJobs) { job ->
                Surface(
                    onClick = { onSelectJob(job) },
                    color = Color.White,
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorderLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = job.jobTicketNumber, fontWeight = FontWeight.Black, fontSize = 13.sp, color = ElectricOrangeDark)
                            Surface(
                                color = if (job.status == "STARTED") Color(0xFFFFF3E0) else Color(0xFFE8F5E9),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = job.status,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (job.status == "STARTED") Color(0xFFE65100) else Color(0xFF2E7D32),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = job.serviceTitle, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = TextDarkPrimary)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(text = "Customer: ${job.customerName} • Pincode: ${job.pincode}", fontSize = 11.sp, color = TextDarkSecondary)
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(text = "Address: ${job.customerAddressText}", fontSize = 10.sp, color = TextDarkMuted)
                    }
                }
            }
        }
    }
}

// =========================================================================
// TAB 5: PROFILE CONTENT
// =========================================================================

@Composable
fun TechnicianProfileContent(
    state: DashboardUiState,
    onToggleDuty: () -> Unit,
    onLogout: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Surface(color = ElectricOrangeHeader, modifier = Modifier.fillMaxWidth()) {
            Text(
                text = "Technician Profile",
                color = Color.White,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(16.dp)
            )
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            item {
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorderLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(CircleShape)
                                    .background(ElectricOrangeHeader.copy(alpha = 0.15f))
                                    .border(1.5.dp, ElectricOrangeHeader, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(text = "RK", color = ElectricOrangeDark, fontWeight = FontWeight.Black, fontSize = 18.sp)
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(text = state.profile?.fullName ?: "Rajesh Kumar", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = TextDarkPrimary)
                                Text(text = "Badge: ${state.profile?.badgeNumber ?: "GTS-TECH-4091"}", fontSize = 12.sp, color = TextDarkSecondary)
                                Text(text = "Rating: ${state.customerRating} ★ (48 Completed Jobs)", fontSize = 11.sp, color = Color(0xFF2E7D32), fontWeight = FontWeight.SemiBold)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        Divider(color = Color(0xFFF1F5F9))
                        Spacer(modifier = Modifier.height(14.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "Registered Mobile:", fontSize = 12.sp, color = TextDarkMuted)
                            Text(text = state.profile?.phone ?: "+91 98112 23344", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextDarkPrimary)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "Assigned Hub / Pincode:", fontSize = 12.sp, color = TextDarkMuted)
                            Text(text = "MH-01 Hub (${state.profile?.assignedPincode ?: "400001"})", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = TextDarkPrimary)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "Safety Kit Status:", fontSize = 12.sp, color = TextDarkMuted)
                            Text(text = "VDE 1000V Insulated (Verified)", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                        }
                    }
                }
            }

            item {
                Button(
                    onClick = onToggleDuty,
                    colors = ButtonDefaults.buttonColors(containerColor = if (state.isOnline) Color(0xFFD32F2F) else Color(0xFF2E7D32)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = if (state.isOnline) "PAUSE SHIFT (GO OFFLINE)" else "RESUME SHIFT (GO ONLINE)", fontWeight = FontWeight.Bold)
                }
            }

            item {
                OutlinedButton(
                    onClick = onLogout,
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFD32F2F)),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFD32F2F)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(imageVector = Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("SIGN OUT FROM CONSOLE", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// =========================================================================
// BOTTOM NAVIGATION BAR (Matches Client Asset Footer: Home | Jobs | Earnings | Profile | SOS Help)
// =========================================================================

@Composable
fun TechnicianBottomNavBar(
    currentTab: String,
    onTabSelected: (String) -> Unit
) {
    Surface(
        color = Color.White,
        shadowElevation = 8.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val navItems = listOf(
                Triple("HOME", "Home", Icons.Default.Home),
                Triple("JOBS", "Jobs", Icons.Default.ListAlt),
                Triple("EARNINGS", "Earnings", Icons.Default.AttachMoney),
                Triple("PROFILE", "Profile", Icons.Default.Person),
                Triple("SOS", "SOS Help", Icons.Default.Warning)
            )

            navItems.forEach { (key, label, icon) ->
                val isSelected = currentTab == key || (key == "HOME" && currentTab == "JOB_DETAILS")
                val isSos = key == "SOS"

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .clickable { onTabSelected(key) }
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = label,
                        tint = when {
                            isSos -> Color(0xFFD32F2F)
                            isSelected -> ElectricOrangeHeader
                            else -> Color(0xFF94A3B8)
                        },
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = label,
                        fontSize = 10.sp,
                        fontWeight = if (isSelected || isSos) FontWeight.Bold else FontWeight.Medium,
                        color = when {
                            isSos -> Color(0xFFD32F2F)
                            isSelected -> ElectricOrangeHeader
                            else -> Color(0xFF64748B)
                        }
                    )
                }
            }
        }
    }
}
