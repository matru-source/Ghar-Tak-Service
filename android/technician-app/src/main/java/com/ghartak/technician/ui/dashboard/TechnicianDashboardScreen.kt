package com.ghartak.technician.ui.dashboard

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import android.location.LocationManager
import android.provider.Settings
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.ghartak.technician.R
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.data.session.SessionManager
import com.ghartak.technician.ui.components.EnvironmentSwitcherDialog
import com.ghartak.technician.ui.theme.*

// Curated UI Colors matching Client Attached References
private val TechFlameOrange = Color(0xFFE65100)
private val TechAmberLight = Color(0xFFFFF3E0)
private val TechGreen = Color(0xFF2E7D32)
private val TechGreenLight = Color(0xFFE8F5E9)
private val TechPurpleLight = Color(0xFFEDE7F6)
private val TechPurple = Color(0xFF673AB7)
private val TechBlueLight = Color(0xFFE3F2FD)
private val TechBlue = Color(0xFF1976D2)
private val TechEmergencyRed = Color(0xFFD32F2F)
private val TechEmergencyRedDark = Color(0xFFB71C1C)
private val TechEmergencyPink = Color(0xFFFEE2E2)
private val TechSurfaceBorder = Color(0xFFE2E8F0)

val TECH_DOORSTEP_CATEGORIES = listOf(
    "Aluminum And Glass Fitting services",
    "Carpenter",
    "CCTV Service",
    "Cleaner",
    "Digital Marketer",
    "Electrician",
    "False Ceiling Service",
    "Gas Stove Service",
    "Generator Technician",
    "Hot And Cool",
    "House Painting Service",
    "IT Service",
    "Laundry Service",
    "Packers & Movers",
    "Pest Control Service",
    "Plumber",
    "Rajmistri",
    "Wallpaper"
)

// Helper: resolves realistic repair object image for jobs and notifications
fun getServiceDrawableRes(serviceTitle: String, iconType: String = ""): Int {
    return when {
        iconType.equals("AC", ignoreCase = true) || serviceTitle.contains("AC", ignoreCase = true) || serviceTitle.contains("Air Condition", ignoreCase = true) -> R.drawable.service_ac
        iconType.equals("FAN", ignoreCase = true) || serviceTitle.contains("Fan", ignoreCase = true) -> R.drawable.service_fan
        serviceTitle.contains("Light", ignoreCase = true) || serviceTitle.contains("Bulb", ignoreCase = true) -> R.drawable.service_light
        serviceTitle.contains("Wiring", ignoreCase = true) || serviceTitle.contains("Wire", ignoreCase = true) || serviceTitle.contains("Inverter", ignoreCase = true) -> R.drawable.service_wiring
        serviceTitle.contains("Switch", ignoreCase = true) || serviceTitle.contains("Board", ignoreCase = true) || serviceTitle.contains("Socket", ignoreCase = true) -> R.drawable.service_switchboard
        serviceTitle.contains("Geyser", ignoreCase = true) || serviceTitle.contains("Heater", ignoreCase = true) -> R.drawable.service_geyser
        else -> R.drawable.service_wiring
    }
}

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

    val alertJob = state.incomingDispatchAlert
    LaunchedEffect(alertJob) {
        if (alertJob != null) {
            onNavigateToDispatchAlert(alertJob.id)
        }
    }

    LaunchedEffect(Unit) {
        viewModel.connectRealtimeBus(context)
        viewModel.pollBackendAssignedJobs(context)
        viewModel.startDispatchPolling(context)
    }

    var isLocationEnabled by remember {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true
        val net = lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        mutableStateOf((gps || net) && hasFine)
    }

    val locationPermLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { perms ->
        val granted = perms[Manifest.permission.ACCESS_FINE_LOCATION] == true || perms[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
        isLocationEnabled = granted && gps
    }

    Scaffold(
        bottomBar = {
            TechnicianBottomNavBar(
                currentTab = state.currentTab,
                badgeCount = state.newJobNotifications.size,
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
                        onViewJobsTab = { viewModel.selectTab("JOBS") },
                        onViewEarningsTab = { viewModel.selectTab("EARNINGS") },
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
                        onWithdraw = { viewModel.openWithdrawDialog() }
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
                        onUpdatePersonalInfo = { name, phone, email, location, languages ->
                            viewModel.updatePersonalInfo(name, phone, email, location, languages)
                        },
                        onUpdateServiceDetails = { specialization, experience, license, serviceArea ->
                            viewModel.updateServiceDetails(specialization, experience, license, serviceArea)
                        },
                        onLogout = {
                            viewModel.logout()
                            onLogout()
                        }
                    )
                }
            }
        }

        // Dedicated High-Impact Emergency Safety SOS Popup Dialog
        if (showSosDialog) {
            EmergencySafetySosDialog(
                trade = state.profile?.specialization ?: "Multi-Trade Specialist",
                onDismiss = { showSosDialog = false },
                onCallEmergency = {
                    showSosDialog = false
                    val emergencyIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:112"))
                    context.startActivity(emergencyIntent)
                }
            )
        }

        // Dedicated Technician Withdrawal Request Dialog
        if (state.showWithdrawDialog) {
            WithdrawalRequestDialog(
                availableInr = state.availableWithdrawalInr,
                isWithdrawing = state.isWithdrawing,
                initialUpi = viewModel.getSavedUpiId(),
                initialAccountName = viewModel.getSavedAccountName(),
                initialAccountNumber = viewModel.getSavedAccountNumber(),
                initialIfsc = viewModel.getSavedIfsc(),
                errorMessage = state.errorMessage,
                onDismiss = { viewModel.closeWithdrawDialog() },
                onSubmit = { amount, method, upi, holder, acc, ifsc, bankName ->
                    viewModel.submitWithdrawal(amount, method, upi, holder, acc, ifsc, bankName)
                }
            )
        }

        // Inbound Dispatch 60-Second Alert Navigation
        LaunchedEffect(state.incomingDispatchAlert) {
            state.incomingDispatchAlert?.let { alertJob ->
                onNavigateToDispatchAlert(alertJob.id)
            }
        }

        // Mandatory GPS Location Dialog (blocks dashboard when GPS is disabled)
        if (!isLocationEnabled) {
            AlertDialog(
                onDismissRequest = { /* Mandatory - blocking until location enabled */ },
                icon = {
                    Icon(
                        imageVector = Icons.Default.LocationOff,
                        contentDescription = null,
                        tint = Color(0xFFDC2626),
                        modifier = Modifier.size(36.dp)
                    )
                },
                title = {
                    Text(
                        text = "GPS Location Required",
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        textAlign = TextAlign.Center
                    )
                },
                text = {
                    Text(
                        text = "Ghar Tak Technician Console requires device GPS to be enabled to connect to your service territory, receive incoming dispatches, and calculate real-time transit distance.\n\nPlease enable Location Services to proceed.",
                        fontSize = 13.sp,
                        color = TextDarkSecondary,
                        textAlign = TextAlign.Center
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                            val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
                            if (!gps) {
                                context.startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                            } else {
                                locationPermLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = TechFlameOrange)
                    ) {
                        Text("Enable Location", fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(
                        onClick = {
                            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                            val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
                            val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                            isLocationEnabled = gps && hasFine
                        }
                    ) {
                        Text("Check Again", fontWeight = FontWeight.Bold, color = TextDarkSecondary)
                    }
                }
            )
        }
    }
}

// =========================================================================
// SCREEN 1: TECHNICIAN HOME SCREEN (Matches Client Reference Image 1)
// =========================================================================

@Composable
fun TechnicianHomeScreenContent(
    state: DashboardUiState,
    onToggleDuty: () -> Unit,
    onAcceptNotification: (id: String) -> Unit,
    onRejectNotification: (id: String) -> Unit,
    onSelectJob: (TechnicianJob) -> Unit,
    onViewJobsTab: () -> Unit,
    onViewEarningsTab: () -> Unit,
    onSimulateDispatch: () -> Unit
) {
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        // 1. Top Header Banner with Villa & GTS Electrician
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(210.dp)
            ) {
                // Background Image
                Image(
                    painter = painterResource(id = R.drawable.bg_tech_home_header),
                    contentDescription = "GTS Home Header",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // Top Bar: GTS Logo, Status Capsule, Notification Bell
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.logo_gts_nobg),
                            contentDescription = "GTS Logo",
                            modifier = Modifier.height(32.dp)
                        )

                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            // Online/Offline Pill Button
                            Surface(
                                onClick = onToggleDuty,
                                color = if (state.isOnline) Color(0xFF007A3D) else Color(0xFFD32F2F),
                                shape = RoundedCornerShape(20.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.7f))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(7.dp)
                                            .clip(CircleShape)
                                            .background(Color.White)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = if (state.isOnline) "Online" else "Offline",
                                        color = Color.White,
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        imageVector = Icons.Default.ArrowDropDown,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }

                            // Notification Bell with Badge
                            Box(modifier = Modifier.size(36.dp), contentAlignment = Alignment.Center) {
                                IconButton(
                                    onClick = onViewJobsTab,
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(Color.White.copy(alpha = 0.2f), CircleShape)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Notifications,
                                        contentDescription = "Notifications",
                                        tint = Color.White,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                if (state.newJobNotifications.isNotEmpty()) {
                                    Box(
                                        modifier = Modifier
                                            .size(17.dp)
                                            .align(Alignment.TopEnd)
                                            .clip(CircleShape)
                                            .background(Color(0xFFE53935)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "${state.newJobNotifications.size}",
                                            color = Color.White,
                                            fontSize = 9.5.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }

                    // Greeting & Pincodes
                    Column(modifier = Modifier.padding(bottom = 12.dp)) {
                        val technicianName = state.profile?.fullName?.split(" ")?.firstOrNull() ?: "Raja"
                        Text(
                            text = "Good Morning, $technicianName! 👋",
                            color = Color.White,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = "ID: ${state.profile?.badgeNumber ?: "GTS-TECH-4815"}  |  Pincode: ${state.profile?.assignedPincode ?: "759001"}",
                            color = Color.White.copy(alpha = 0.92f),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }

        // 2. Floating 3 Mini Metric Cards (Today, This Week, This Month)
        item {
            Surface(
                color = Color.White,
                shape = RoundedCornerShape(16.dp),
                shadowElevation = 6.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .offset(y = (-14).dp)
                    .clickable { onViewEarningsTab() }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp, horizontal = 10.dp),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Today
                    MiniMetricItem(
                        icon = Icons.Default.AccountBalanceWallet,
                        iconBg = TechAmberLight,
                        iconTint = TechFlameOrange,
                        label = "Today",
                        amount = "₹${"%,.0f".format(state.todayEarningsInr)}"
                    )

                    Divider(
                        modifier = Modifier
                            .height(32.dp)
                            .width(1.dp),
                        color = Color(0xFFE2E8F0)
                    )

                    // This Week
                    MiniMetricItem(
                        icon = Icons.Default.TrendingUp,
                        iconBg = TechGreenLight,
                        iconTint = TechGreen,
                        label = "This Week",
                        amount = "₹${"%,.0f".format(state.weekEarningsInr)}"
                    )

                    Divider(
                        modifier = Modifier
                            .height(32.dp)
                            .width(1.dp),
                        color = Color(0xFFE2E8F0)
                    )

                    // This Month
                    MiniMetricItem(
                        icon = Icons.Default.Work,
                        iconBg = TechPurpleLight,
                        iconTint = TechPurple,
                        label = "This Month",
                        amount = "₹${"%,.0f".format(state.monthEarningsInr)}"
                    )
                }
            }
        }

        // 3. Three Summary Status Cards Row (Today's Jobs, Completed, Pending)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Card 1: Today's Jobs
                SummaryActionCard(
                    modifier = Modifier.weight(1f),
                    bgColor = Color(0xFFFFF8F1),
                    borderColor = Color(0xFFFFE0B2),
                    icon = Icons.Default.CalendarToday,
                    iconTint = TechFlameOrange,
                    label = "Today's Jobs",
                    count = "${state.jobsTodayCount}",
                    actionText = "View all →",
                    onClick = onViewJobsTab
                )

                // Card 2: Completed
                SummaryActionCard(
                    modifier = Modifier.weight(1f),
                    bgColor = Color(0xFFF1FBF4),
                    borderColor = Color(0xFFC8E6C9),
                    icon = Icons.Default.CheckCircle,
                    iconTint = TechGreen,
                    label = "Completed",
                    count = "${state.jobsCompletedCount}",
                    actionText = "View history →",
                    onClick = onViewJobsTab
                )

                // Card 3: Pending
                SummaryActionCard(
                    modifier = Modifier.weight(1f),
                    bgColor = Color(0xFFFFFDF0),
                    borderColor = Color(0xFFFFECB3),
                    icon = Icons.Default.Schedule,
                    iconTint = Color(0xFFF57C00),
                    label = "Pending",
                    count = "${state.jobsPendingCount}",
                    actionText = "View details →",
                    onClick = onViewJobsTab
                )
            }
        }

        // 4. New Job Notifications (with realistic product images)
        item {
            Spacer(modifier = Modifier.height(18.dp))
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.NotificationsActive,
                            contentDescription = null,
                            tint = Color(0xFFE53935),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "New Job Notifications (${state.newJobNotifications.size} new)",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                    }

                    Text(
                        text = "See All →",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechBlue,
                        modifier = Modifier.clickable { onViewJobsTab() }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (state.newJobNotifications.isEmpty()) {
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE8F5E9)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = TechGreen,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "All Clear • Online for Dispatch",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "Live bookings dispatched from territory ${state.profile?.assignedPincode ?: "service area"} will alert here instantly.",
                                    fontSize = 11.sp,
                                    color = TextDarkMuted
                                )
                            }
                        }
                    }
                }

                state.newJobNotifications.forEach { notif ->
                    val serviceDrawable = getServiceDrawableRes(notif.serviceTitle, notif.iconType)

                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        shadowElevation = 2.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Realistic Catalog Product Thumbnail
                            Image(
                                painter = painterResource(id = serviceDrawable),
                                contentDescription = notif.serviceTitle,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier
                                    .size(68.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                            )

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "New Job ${notif.jobTicketNumber}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = TextDarkPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f, fill = false)
                                    )
                                    if (notif.id == "J-1005") {
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Surface(
                                            color = Color(0xFFFEE2E2),
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = "🚨 Urgent",
                                                color = Color(0xFFDC2626),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1,
                                                softWrap = false,
                                                modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                            )
                                        }
                                    }
                                }

                                Spacer(modifier = Modifier.height(2.dp))

                                Text(
                                    text = "${notif.serviceTitle}  |  ${notif.scheduledTime}",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextDarkSecondary
                                )

                                Spacer(modifier = Modifier.height(2.dp))

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = TechFlameOrange, modifier = Modifier.size(11.dp))
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = "Pincode: ${notif.pincode}  |  Customer: ${notif.customerName}",
                                        fontSize = 10.5.sp,
                                        color = TextDarkMuted,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Spacer(modifier = Modifier.height(3.dp))

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = if (notif.iconType == "AC") Icons.Default.Apartment else Icons.Default.Home,
                                        contentDescription = null,
                                        tint = TextDarkMuted,
                                        modifier = Modifier.size(11.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = if (notif.iconType == "AC") "Apartment" else "Home Service",
                                        fontSize = 10.sp,
                                        color = TextDarkMuted
                                    )
                                    Text(text = " • ", fontSize = 10.sp, color = TextDarkMuted)
                                    Icon(imageVector = Icons.Default.Schedule, contentDescription = null, tint = TextDarkMuted, modifier = Modifier.size(11.dp))
                                    Spacer(modifier = Modifier.width(2.dp))
                                    Text(
                                        text = if (notif.iconType == "AC") "~ 1 hr" else "~ 45 mins",
                                        fontSize = 10.sp,
                                        color = TextDarkMuted
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            // Accept & Reject Buttons
                            Column(
                                verticalArrangement = Arrangement.spacedBy(6.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Button(
                                    onClick = { onAcceptNotification(notif.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 2.dp),
                                    modifier = Modifier.height(30.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(imageVector = Icons.Default.Check, contentDescription = null, modifier = Modifier.size(13.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Accept", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                Button(
                                    onClick = { onRejectNotification(notif.id) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD32F2F)),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 2.dp),
                                    modifier = Modifier.height(30.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(imageVector = Icons.Default.Close, contentDescription = null, modifier = Modifier.size(13.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Reject", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 5. My Active Jobs (FIXED: Status pill is cleanly fitted and NEVER wrapped vertically!)
        item {
            Spacer(modifier = Modifier.height(10.dp))
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Build, contentDescription = null, tint = TechFlameOrange, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "My Active Jobs",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                    }

                    Text(
                        text = "View All →",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TechBlue,
                        modifier = Modifier.clickable { onViewJobsTab() }
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                state.assignedJobs.forEach { job ->
                    val serviceDrawable = getServiceDrawableRes(job.serviceTitle)
                    val isStarted = job.status == "STARTED" || job.status == "IN_PROGRESS"
                    val technicianFirstName = state.profile?.fullName?.split(" ")?.firstOrNull() ?: "Raja"

                    Surface(
                        onClick = { onSelectJob(job) },
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        shadowElevation = 2.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 12.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Circular Service Icon / Thumbnail
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(if (isStarted) Color(0xFFE8F5E9) else Color(0xFFE0F2F1)),
                                contentAlignment = Alignment.Center
                            ) {
                                Image(
                                    painter = painterResource(id = serviceDrawable),
                                    contentDescription = job.serviceTitle,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(34.dp)
                                        .clip(CircleShape)
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                // Title and clean horizontal status chip with NO vertical squishing
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "${job.jobTicketNumber} – ${job.serviceTitle}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.5.sp,
                                        color = TextDarkPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                        modifier = Modifier.weight(1f, fill = false)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Surface(
                                        color = if (isStarted) Color(0xFFE3F2FD) else Color(0xFFE0F7FA),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = if (isStarted) "● In Progress" else "● En Route",
                                            color = if (isStarted) Color(0xFF1976D2) else Color(0xFF00838F),
                                            fontSize = 9.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            maxLines = 1,
                                            softWrap = false,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(3.dp))

                                Text(
                                    text = "$technicianFirstName – ${if (isStarted) "In Progress  |  45 mins left" else "En Route  |  10 mins away"}",
                                    fontSize = 11.sp,
                                    color = TextDarkSecondary
                                )

                                Spacer(modifier = Modifier.height(2.dp))

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(imageVector = Icons.Default.Place, contentDescription = null, tint = TechFlameOrange, modifier = Modifier.size(11.dp))
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = job.customerAddressText,
                                        fontSize = 10.5.sp,
                                        color = TextDarkMuted,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            // Action Button: Continue (Orange) or View on Map (Green)
                            if (isStarted) {
                                Button(
                                    onClick = { onSelectJob(job) },
                                    colors = ButtonDefaults.buttonColors(containerColor = TechFlameOrange),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                    modifier = Modifier.height(34.dp)
                                ) {
                                    Text("Continue >", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }
                            } else {
                                Button(
                                    onClick = { onSelectJob(job) },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                    modifier = Modifier.height(34.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(imageVector = Icons.Default.LocationOn, contentDescription = null, modifier = Modifier.size(13.dp))
                                        Spacer(modifier = Modifier.width(3.dp))
                                        Text("View on Map >", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------------------
// Component: Mini Metric Item for Header Floating Bar
// -------------------------------------------------------------------------
@Composable
private fun MiniMetricItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconBg: Color,
    iconTint: Color,
    label: String,
    amount: String
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(CircleShape)
                .background(iconBg),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(text = label, fontSize = 10.5.sp, color = TextDarkSecondary, fontWeight = FontWeight.Medium)
            Text(text = amount, fontSize = 14.sp, color = TechFlameOrange, fontWeight = FontWeight.Black)
        }
    }
}

// -------------------------------------------------------------------------
// Component: Summary Action Card (Today's Jobs, Completed, Pending)
// -------------------------------------------------------------------------
@Composable
private fun SummaryActionCard(
    modifier: Modifier = Modifier,
    bgColor: Color,
    borderColor: Color,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    label: String,
    count: String,
    actionText: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = bgColor,
        shape = RoundedCornerShape(14.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(vertical = 12.dp, horizontal = 10.dp),
            horizontalAlignment = Alignment.Start
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(18.dp))
                Text(text = count, fontSize = 22.sp, color = iconTint, fontWeight = FontWeight.Black)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = label, fontSize = 11.sp, color = TextDarkSecondary, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = actionText, fontSize = 10.5.sp, color = iconTint, fontWeight = FontWeight.Bold)
        }
    }
}

// =========================================================================
// SCREEN 2: TECHNICIAN EARNINGS SCREEN (Dynamic Real-Time Filters)
// =========================================================================

@Composable
fun TechnicianEarningsContent(
    state: DashboardUiState,
    onBack: () -> Unit,
    onFilterSelected: (String) -> Unit,
    onWithdraw: () -> Unit
) {
    val context = LocalContext.current

    // Dynamically calculate values matching the selected time filter
    val currentFilter = state.selectedEarningsFilter
    val totalEarningsDisplay = when (currentFilter) {
        "TODAY" -> state.todayEarningsInr
        "THIS_WEEK" -> state.weekEarningsInr
        "THIS_MONTH" -> state.monthEarningsInr
        "ALL_TIME" -> state.allTimeEarningsInr
        else -> state.monthEarningsInr
    }

    val trendDisplay = if (state.jobsCompletedCount == 0 && totalEarningsDisplay == 0.0) {
        "New Professional • Ready for jobs"
    } else {
        when (currentFilter) {
            "TODAY" -> "↑ ${if (state.todayEarningsInr > 0) "Active" else "0"} jobs today"
            "THIS_WEEK" -> "↑ Verified payouts"
            "THIS_MONTH" -> "↑ ${state.jobsCompletedCount} jobs completed"
            "ALL_TIME" -> "↑ ${state.jobsCompletedCount} lifetime jobs settled"
            else -> "↑ Verified payouts"
        }
    }

    val totalJobsCount = when (currentFilter) {
        "TODAY" -> if (state.todayEarningsInr > 0) 1 else 0
        "THIS_WEEK" -> state.jobsCompletedCount
        "THIS_MONTH" -> state.jobsCompletedCount
        "ALL_TIME" -> state.jobsCompletedCount + state.assignedJobs.size
        else -> state.jobsCompletedCount
    }

    val totalJobsSub = when (currentFilter) {
        "TODAY" -> "today"
        "THIS_WEEK" -> "this week"
        "THIS_MONTH" -> "in this month"
        "ALL_TIME" -> "all time"
        else -> "in this month"
    }

    val completedJobsCount = when (currentFilter) {
        "TODAY" -> if (state.todayEarningsInr > 0) 1 else 0
        "THIS_WEEK" -> state.jobsCompletedCount
        "THIS_MONTH" -> state.jobsCompletedCount
        "ALL_TIME" -> state.jobsCompletedCount
        else -> state.jobsCompletedCount
    }

    val completedAmountDisplay = "₹${"%,.0f".format(totalEarningsDisplay)} earned"

    val pendingJobsCount = state.assignedJobs.count { it.status != "COMPLETED" && it.status != "CANCELLED" }

    val pendingAmountDisplay = if (pendingJobsCount > 0) {
        val expected = state.assignedJobs.filter { it.status != "COMPLETED" && it.status != "CANCELLED" }.sumOf { it.totalAmountInr }
        "₹${"%,.0f".format(expected)} expected"
    } else {
        "₹0 expected"
    }

    val sectionHeaderTitle = when (currentFilter) {
        "TODAY" -> "Today's Transactions"
        "THIS_WEEK" -> "This Week's Transactions"
        "THIS_MONTH" -> "This Month's Transactions"
        "ALL_TIME" -> "All Time Transactions"
        else -> "This Month's Transactions"
    }

    val dropdownPillLabel = when (currentFilter) {
        "TODAY" -> "Today, 14 Oct"
        "THIS_WEEK" -> "This Week"
        "THIS_MONTH" -> "October 2026"
        "ALL_TIME" -> "All Time"
        else -> "October 2026"
    }

    // Dynamic Filter of Transactions
    val filteredTransactions = state.recentTransactions.filter { tx ->
        tx.periodScope.contains(currentFilter)
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // 1. Top Header Banner with Motivational Asset
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp)
        ) {
            Image(
                painter = painterResource(id = R.drawable.bg_tech_earnings_header),
                contentDescription = "Earnings Header",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )

            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                verticalAlignment = Alignment.Top
            ) {
                IconButton(onClick = onBack) {
                    Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                }
                Spacer(modifier = Modifier.width(4.dp))
                Column(modifier = Modifier.padding(top = 8.dp)) {
                    Text(
                        text = "My Earnings",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        text = "Track your earnings and transactions",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 11.5.sp
                    )
                }
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 2. Total Earnings Card with Dynamic Real-Time Bar Chart
            item {
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(16.dp),
                    shadowElevation = 3.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.AccountBalanceWallet,
                                        contentDescription = null,
                                        tint = TechFlameOrange,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Total Earnings",
                                        fontSize = 12.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextDarkSecondary
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                Text(
                                    text = "₹${"%,.0f".format(totalEarningsDisplay)}",
                                    fontSize = 32.sp,
                                    fontWeight = FontWeight.Black,
                                    color = TechFlameOrange
                                )

                                Spacer(modifier = Modifier.height(6.dp))

                                Surface(
                                    color = Color(0xFFE8F5E9),
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(
                                            text = trendDisplay,
                                            color = Color(0xFF2E7D32),
                                            fontSize = 10.5.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Icon(
                                            imageVector = Icons.Default.Info,
                                            contentDescription = null,
                                            tint = Color(0xFF2E7D32),
                                            modifier = Modifier.size(12.dp)
                                        )
                                    }
                                }
                            }

                            // Dynamic Chart changing based on active filter
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.Bottom,
                                modifier = Modifier
                                    .height(80.dp)
                                    .padding(end = 4.dp)
                            ) {
                                val hasEarnings = totalEarningsDisplay > 0
                                when (currentFilter) {
                                    "TODAY" -> {
                                        MonthlyChartBar(label = "09:00", heightRatio = if (hasEarnings) 0.35f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "12:00", heightRatio = if (hasEarnings) 0.55f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "15:00", heightRatio = if (hasEarnings) 0.80f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "18:00", heightRatio = if (hasEarnings) 1.00f else 0.08f, isHighlighted = hasEarnings)
                                    }
                                    "THIS_WEEK" -> {
                                        MonthlyChartBar(label = "Mon", heightRatio = if (hasEarnings) 0.40f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "Tue", heightRatio = if (hasEarnings) 0.60f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "Wed", heightRatio = if (hasEarnings) 0.75f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "Thu", heightRatio = if (hasEarnings) 0.50f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "Fri", heightRatio = if (hasEarnings) 1.00f else 0.08f, isHighlighted = hasEarnings)
                                    }
                                    "ALL_TIME" -> {
                                        MonthlyChartBar(label = "'22", heightRatio = if (hasEarnings) 0.30f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "'23", heightRatio = if (hasEarnings) 0.50f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "'24", heightRatio = if (hasEarnings) 0.70f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "'25", heightRatio = if (hasEarnings) 0.85f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "'26", heightRatio = if (hasEarnings) 1.00f else 0.08f, isHighlighted = hasEarnings)
                                    }
                                    else -> {
                                        // THIS_MONTH
                                        MonthlyChartBar(label = "Jun", heightRatio = if (hasEarnings) 0.22f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "Jul", heightRatio = if (hasEarnings) 0.35f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "Aug", heightRatio = if (hasEarnings) 0.52f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "Sep", heightRatio = if (hasEarnings) 0.70f else 0.08f, isHighlighted = false)
                                        MonthlyChartBar(label = "Oct", heightRatio = if (hasEarnings) 1.00f else 0.08f, isHighlighted = hasEarnings)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 3. Time Filter Pill Row (Today, This Week, This Month, All Time)
            item {
                Surface(
                    color = Color(0xFFF8FAFC),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        val filterOptions = listOf(
                            "TODAY" to "Today",
                            "THIS_WEEK" to "This Week",
                            "THIS_MONTH" to "This Month",
                            "ALL_TIME" to "All Time"
                        )

                        filterOptions.forEach { (key, title) ->
                            val isSelected = currentFilter == key
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (isSelected) TechFlameOrange else Color.Transparent)
                                    .clickable { onFilterSelected(key) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = title,
                                    fontSize = 11.5.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) Color.White else TextDarkSecondary
                                )
                            }
                        }
                    }
                }
            }

            // 4. Three Stat Cards Row (Dynamically calculated based on active filter)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Total Jobs
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        shadowElevation = 2.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFCC80)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(30.dp)
                                    .clip(CircleShape)
                                    .background(TechAmberLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.Work, contentDescription = null, tint = TechFlameOrange, modifier = Modifier.size(16.dp))
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = "Total Jobs", fontSize = 10.sp, color = TextDarkSecondary, fontWeight = FontWeight.Medium)
                            Row(verticalAlignment = Alignment.Bottom) {
                                Text(text = "$totalJobsCount", fontSize = 18.sp, fontWeight = FontWeight.Black, color = TextDarkPrimary)
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(text = "↑ 20%", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32))
                            }
                            Text(text = totalJobsSub, fontSize = 9.5.sp, color = TextDarkMuted)
                        }
                    }

                    // Completed Jobs
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        shadowElevation = 2.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA5D6A7)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(30.dp)
                                    .clip(CircleShape)
                                    .background(TechGreenLight),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.CurrencyRupee, contentDescription = null, tint = TechGreen, modifier = Modifier.size(16.dp))
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = "Completed Jobs", fontSize = 10.sp, color = TextDarkSecondary, fontWeight = FontWeight.Medium)
                            Text(text = "$completedJobsCount", fontSize = 18.sp, fontWeight = FontWeight.Black, color = TextDarkPrimary)
                            Text(text = completedAmountDisplay, fontSize = 9.5.sp, color = TechGreen, fontWeight = FontWeight.Bold)
                        }
                    }

                    // Pending Jobs
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        shadowElevation = 2.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFE082)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Box(
                                modifier = Modifier
                                    .size(30.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFFFF8E1)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.Schedule, contentDescription = null, tint = Color(0xFFF57C00), modifier = Modifier.size(16.dp))
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = "Pending Jobs", fontSize = 10.sp, color = TextDarkSecondary, fontWeight = FontWeight.Medium)
                            Text(text = "$pendingJobsCount", fontSize = 18.sp, fontWeight = FontWeight.Black, color = TextDarkPrimary)
                            Text(text = pendingAmountDisplay, fontSize = 9.5.sp, color = Color(0xFFF57C00), fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // 5. Transactions Section (Filtered by active filter)
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = sectionHeaderTitle,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )

                    Surface(
                        color = Color(0xFFF1F5F9),
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.CalendarToday, contentDescription = null, tint = TextDarkSecondary, modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(text = dropdownPillLabel, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(imageVector = Icons.Default.KeyboardArrowDown, contentDescription = null, tint = TextDarkSecondary, modifier = Modifier.size(14.dp))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                if (filteredTransactions.isEmpty()) {
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp)
                    ) {
                        Text(
                            text = "No transactions found for this time period",
                            fontSize = 12.sp,
                            color = TextDarkMuted,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                } else {
                    filteredTransactions.forEach { tx ->
                        Surface(
                            color = Color.White,
                            shape = RoundedCornerShape(12.dp),
                            shadowElevation = 1.dp,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
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
                                        .size(34.dp)
                                        .clip(CircleShape)
                                        .background(if (tx.isPending) Color(0xFFFFF3E0) else Color(0xFFE8F5E9)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (tx.isPending) Icons.Default.HourglassEmpty else Icons.Default.CheckCircle,
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
                                        fontSize = 12.5.sp,
                                        color = TextDarkPrimary
                                    )
                                    Text(
                                        text = tx.completedTime,
                                        fontSize = 10.5.sp,
                                        color = TextDarkMuted
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Surface(
                                        color = if (tx.isPending) Color(0xFFFFF8E1) else Color(0xFFE8F5E9),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            text = if (tx.isPending) "Pending" else "Completed",
                                            color = if (tx.isPending) Color(0xFFE65100) else Color(0xFF2E7D32),
                                            fontSize = 9.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = if (tx.isPending) "+₹${"%,.0f".format(tx.amountInr)}" else "+₹${"%,.0f".format(tx.amountInr)}",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Black,
                                        color = if (tx.isPending) Color(0xFFE65100) else Color(0xFF2E7D32)
                                    )
                                }

                                Spacer(modifier = Modifier.width(6.dp))
                                Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(16.dp))
                            }
                        }
                    }
                }
            }

            // 6. Withdraw Earnings Button
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Button(
                    onClick = onWithdraw,
                    enabled = !state.isWithdrawing,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF1B873F),
                        disabledContainerColor = Color(0xFF94A3B8)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (state.isWithdrawing) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                    } else {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(imageVector = Icons.Default.AccountBalanceWallet, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Withdraw Earnings (₹${"%,.0f".format(state.availableWithdrawalInr)} Available)",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.5.sp
                                )
                            }
                            Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                        }
                    }
                }

                if (state.withdrawSuccessMessage != null) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Surface(
                        color = Color(0xFFDCFCE7),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = state.withdrawSuccessMessage ?: "",
                            color = Color(0xFF15803D),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }
            }

            // 6b. Withdrawal Requests & Settlement History
            item {
                Spacer(modifier = Modifier.height(14.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Withdrawal Requests & Payouts",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = TextDarkPrimary
                    )
                    if (state.withdrawalHistory.isNotEmpty()) {
                        Surface(
                            color = TechAmberLight,
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = "${state.withdrawalHistory.size} records",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = TechFlameOrange,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))

                if (state.withdrawalHistory.isEmpty()) {
                    Surface(
                        color = Color(0xFFF8FAFC),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.AccountBalanceWallet,
                                contentDescription = null,
                                tint = Color(0xFF94A3B8),
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "No withdrawal requests yet",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextDarkSecondary
                            )
                            Text(
                                text = "Tap 'Withdraw Earnings' above to request payout to your UPI ID or Bank Account.",
                                fontSize = 11.sp,
                                color = TextDarkMuted,
                                textAlign = TextAlign.Center,
                                modifier = Modifier.padding(horizontal = 8.dp)
                            )
                        }
                    }
                } else {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        state.withdrawalHistory.forEach { withdrawalItem ->
                            WithdrawalRecordCard(item = withdrawalItem)
                        }
                    }
                }
            }

            // 7. Security Footnote Card
            item {
                Surface(
                    color = Color(0xFFFFFBEB),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(34.dp)
                                .clip(CircleShape)
                                .background(Color(0xFFFEF3C7)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(imageVector = Icons.Default.Shield, contentDescription = null, tint = Color(0xFFD97706), modifier = Modifier.size(18.dp))
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "Secure Payment Withdrawal",
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.5.sp,
                                color = Color(0xFFB45309)
                            )
                            Text(
                                text = "Your payment is secured with Zex Security Module. Withdraw directly to your bank account.",
                                fontSize = 10.sp,
                                color = Color(0xFF92400E)
                            )
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------------------
// Component: Single Bar in the Monthly Chart
// -------------------------------------------------------------------------
@Composable
private fun MonthlyChartBar(
    label: String,
    heightRatio: Float,
    isHighlighted: Boolean
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Bottom,
        modifier = Modifier.fillMaxHeight()
    ) {
        Box(
            modifier = Modifier
                .width(18.dp)
                .height((50 * heightRatio).dp)
                .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                .background(if (isHighlighted) TechFlameOrange else Color(0xFFFFCC80))
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = if (isHighlighted) FontWeight.Bold else FontWeight.Medium,
            color = if (isHighlighted) TechFlameOrange else TextDarkMuted
        )
    }
}

// =========================================================================
// SCREEN 3: TECHNICIAN PROFILE SCREEN (Cleaned: No Settings/Legal, Working Edits)
// =========================================================================

@Composable
fun TechnicianProfileContent(
    state: DashboardUiState,
    onToggleDuty: () -> Unit,
    onUpdatePersonalInfo: (name: String, phone: String, email: String, location: String, languages: String) -> Unit,
    onUpdateServiceDetails: (specialization: String, experience: String, license: String, serviceArea: String) -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showEditPersonalDialog by remember { mutableStateOf(false) }
    var showEditServiceDialog by remember { mutableStateOf(false) }

    // Logout Confirmation Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            icon = {
                Icon(
                    imageVector = Icons.Default.Logout,
                    contentDescription = null,
                    tint = Color(0xFFD32F2F),
                    modifier = Modifier.size(32.dp)
                )
            },
            title = {
                Text(text = "Sign Out", fontWeight = FontWeight.Bold)
            },
            text = {
                Text(text = "Are you sure you want to sign out from the technician console? You will need to sign in again to receive live job dispatches.")
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD32F2F))
                ) {
                    Text("Sign Out", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // 1. Working Edit Personal Info Dialog
    if (showEditPersonalDialog) {
        var editName by remember { mutableStateOf(state.profile?.fullName ?: "") }
        var editPhone by remember { mutableStateOf(state.profile?.phone ?: "") }
        var editEmail by remember { mutableStateOf(state.profile?.email ?: "") }
        var editLocation by remember { mutableStateOf(state.profile?.location ?: "") }
        var editLanguages by remember { mutableStateOf(state.profile?.languages ?: "") }

        AlertDialog(
            onDismissRequest = { showEditPersonalDialog = false },
            title = {
                Text(text = "Edit Personal Information", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = { Text("Full Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editPhone,
                        onValueChange = { editPhone = it },
                        label = { Text("Phone Number") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editEmail,
                        onValueChange = { editEmail = it },
                        label = { Text("Email Address") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editLocation,
                        onValueChange = { editLocation = it },
                        label = { Text("Location") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editLanguages,
                        onValueChange = { editLanguages = it },
                        label = { Text("Languages") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onUpdatePersonalInfo(editName, editPhone, editEmail, editLocation, editLanguages)
                        showEditPersonalDialog = false
                        Toast.makeText(context, "Personal information updated!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TechFlameOrange)
                ) {
                    Text("Save Changes")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditPersonalDialog = false }) {
                    Text("Cancel", color = TextDarkSecondary)
                }
            }
        )
    }

    // 2. Working Edit Service Details Dialog
    if (showEditServiceDialog) {
        var editSpecialization by remember { mutableStateOf(state.profile?.specialization ?: "Certified Electrician") }
        var editSpecializationExpanded by remember { mutableStateOf(false) }
        var editExperience by remember { mutableStateOf(state.profile?.experience ?: "") }
        var editLicense by remember { mutableStateOf(state.profile?.license ?: "") }
        var editServiceArea by remember { mutableStateOf(state.profile?.serviceArea ?: "") }

        AlertDialog(
            onDismissRequest = { showEditServiceDialog = false },
            title = {
                Text(text = "Edit Service Details", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Box(modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = editSpecialization,
                            onValueChange = { editSpecialization = it },
                            label = { Text("Trade Specialization (18 Categories)") },
                            trailingIcon = {
                                IconButton(onClick = { editSpecializationExpanded = !editSpecializationExpanded }) {
                                    Icon(Icons.Default.ArrowDropDown, contentDescription = "Select Trade")
                                }
                            },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                        DropdownMenu(
                            expanded = editSpecializationExpanded,
                            onDismissRequest = { editSpecializationExpanded = false },
                            modifier = Modifier
                                .fillMaxWidth(0.75f)
                                .heightIn(max = 280.dp)
                        ) {
                            TECH_DOORSTEP_CATEGORIES.forEach { category ->
                                DropdownMenuItem(
                                    text = {
                                        Text(
                                            text = category,
                                            fontSize = 13.sp,
                                            fontWeight = if (editSpecialization == category) FontWeight.Bold else FontWeight.Normal
                                        )
                                    },
                                    onClick = {
                                        editSpecialization = category
                                        editSpecializationExpanded = false
                                    }
                                )
                            }
                        }
                    }
                    OutlinedTextField(
                        value = editExperience,
                        onValueChange = { editExperience = it },
                        label = { Text("Experience") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editLicense,
                        onValueChange = { editLicense = it },
                        label = { Text("License / Certification") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editServiceArea,
                        onValueChange = { editServiceArea = it },
                        label = { Text("Service Area") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onUpdateServiceDetails(editSpecialization, editExperience, editLicense, editServiceArea)
                        showEditServiceDialog = false
                        Toast.makeText(context, "Service details updated!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = TechFlameOrange)
                ) {
                    Text("Save Changes")
                }
            },
            dismissButton = {
                TextButton(onClick = { showEditServiceDialog = false }) {
                    Text("Cancel", color = TextDarkSecondary)
                }
            }
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // 1. Top Orange Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.verticalGradient(listOf(Color(0xFFE65100), Color(0xFFF57C00))))
                .padding(horizontal = 16.dp, vertical = 14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "My Profile",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        text = "Manage your account and preferences",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 11.5.sp
                    )
                }

                // Bell Icon with dynamic real notifications badge
                Box(modifier = Modifier.size(36.dp), contentAlignment = Alignment.Center) {
                    IconButton(
                        onClick = { },
                        modifier = Modifier
                            .size(36.dp)
                            .background(Color.White.copy(alpha = 0.2f), CircleShape)
                    ) {
                        Icon(imageVector = Icons.Default.Notifications, contentDescription = "Notifications", tint = Color.White, modifier = Modifier.size(20.dp))
                    }
                    if (state.newJobNotifications.isNotEmpty()) {
                        Box(
                            modifier = Modifier
                                .size(17.dp)
                                .align(Alignment.TopEnd)
                                .clip(CircleShape)
                                .background(Color(0xFFE53935)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(text = "${state.newJobNotifications.size}", color = Color.White, fontSize = 9.5.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 2. Main Profile Floating Card (NO top edit button, reflects updated name immediately!)
            item {
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(20.dp),
                    shadowElevation = 3.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            // Technician Avatar with Online Indicator
                            Box(modifier = Modifier.size(72.dp)) {
                                Image(
                                    painter = painterResource(id = R.drawable.img_technician_rajesh),
                                    contentDescription = "Technician Photo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(72.dp)
                                        .clip(CircleShape)
                                        .border(2.dp, Color(0xFFE2E8F0), CircleShape)
                                )
                                Box(
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF2E7D32))
                                        .border(2.dp, Color.White, CircleShape)
                                        .align(Alignment.BottomEnd)
                                )
                            }

                            Spacer(modifier = Modifier.width(14.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                // Full Name directly reflecting from Personal Info
                                Text(
                                    text = state.profile?.fullName?.takeIf { it.isNotBlank() } ?: "Technician",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Black,
                                    color = TextDarkPrimary
                                )

                                Spacer(modifier = Modifier.height(2.dp))

                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "ID: ${state.profile?.badgeNumber?.takeIf { it.isNotBlank() } ?: "GTS-TECH-VERIFIED"}",
                                        fontSize = 11.5.sp,
                                        color = TextDarkSecondary
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Icon(
                                        imageVector = Icons.Default.ContentCopy,
                                        contentDescription = "Copy ID",
                                        tint = TechFlameOrange,
                                        modifier = Modifier
                                            .size(13.dp)
                                            .clickable {
                                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                                val clip = ClipData.newPlainText("Badge ID", state.profile?.badgeNumber ?: "GTS-TECH-4815")
                                                clipboard.setPrimaryClip(clip)
                                                Toast.makeText(context, "Badge ID copied to clipboard", Toast.LENGTH_SHORT).show()
                                            }
                                    )
                                }

                                Spacer(modifier = Modifier.height(4.dp))

                                // Star Rating
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    repeat(5) {
                                        Icon(
                                            imageVector = Icons.Default.Star,
                                            contentDescription = null,
                                            tint = Color(0xFFFFB300),
                                            modifier = Modifier.size(13.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(4.dp))
                                    val jobsCount = state.jobsCompletedCount
                                    val ratingHeader = if (jobsCount == 0) "5.0 (New Professional)" else "${"%.1f".format(state.customerRating)} ($jobsCount jobs)"
                                    Text(
                                        text = ratingHeader,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextDarkSecondary
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        // Verified Technician Chip
                        Surface(
                            color = Color(0xFFE8F5E9),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(12.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Verified Technician", color = Color(0xFF2E7D32), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        Divider(color = Color(0xFFF1F5F9))
                        Spacer(modifier = Modifier.height(12.dp))

                        // 4 Metrics Row (Dynamic: Total Jobs, Completed, Pending, Rating)
                        val totalJobs = state.jobsCompletedCount + state.jobsPendingCount
                        val ratingVal = if (state.jobsCompletedCount == 0) "5.0" else "%.1f".format(state.customerRating)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceAround,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            ProfileStatColumn(icon = Icons.Default.Work, iconTint = TechFlameOrange, value = "$totalJobs", label = "Total Jobs")
                            Divider(modifier = Modifier.height(26.dp).width(1.dp), color = Color(0xFFE2E8F0))
                            ProfileStatColumn(icon = Icons.Default.CheckCircle, iconTint = TechGreen, value = "${state.jobsCompletedCount}", label = "Completed")
                            Divider(modifier = Modifier.height(26.dp).width(1.dp), color = Color(0xFFE2E8F0))
                            ProfileStatColumn(icon = Icons.Default.Schedule, iconTint = Color(0xFFF57C00), value = "${state.jobsPendingCount}", label = "Pending")
                            Divider(modifier = Modifier.height(26.dp).width(1.dp), color = Color(0xFFE2E8F0))
                            ProfileStatColumn(icon = Icons.Default.Star, iconTint = Color(0xFF1976D2), value = ratingVal, label = "Rating")
                        }
                    }
                }
            }

            // 3. Document Verification Banner
            item {
                Surface(
                    color = Color(0xFFF1FBF4),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFC8E6C9)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(34.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE8F5E9)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF2E7D32), modifier = Modifier.size(20.dp))
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(text = "Profile Verified", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1B5E20))
                                Text(text = "Your documents are verified by GTS", fontSize = 10.5.sp, color = TextDarkSecondary)
                            }
                        }

                        Surface(
                            onClick = { Toast.makeText(context, "Documents verified with 1000V VDE Registry", Toast.LENGTH_SHORT).show() },
                            color = Color(0xFFE8F5E9),
                            shape = RoundedCornerShape(6.dp)
                        ) {
                            Text("View Documents >", fontSize = 10.5.sp, fontWeight = FontWeight.Bold, color = Color(0xFF2E7D32), modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                        }
                    }
                }
            }

            // 4. Personal Information Group (WORKING EDIT BUTTON)
            item {
                GroupedProfileSection(
                    title = "Personal Information",
                    icon = Icons.Default.Person,
                    onEdit = { showEditPersonalDialog = true }
                ) {
                    ProfileInfoRow(icon = Icons.Default.Phone, label = "Phone", value = state.profile?.phone?.takeIf { it.isNotBlank() } ?: "Not Provided")
                    ProfileInfoRow(icon = Icons.Default.Email, label = "Email", value = state.profile?.email?.takeIf { it.isNotBlank() } ?: "Not Provided")
                    ProfileInfoRow(icon = Icons.Default.Place, label = "Location", value = state.profile?.location?.takeIf { it.isNotBlank() } ?: "Not Set (Tap Edit)")
                    ProfileInfoRow(icon = Icons.Default.Language, label = "Languages", value = state.profile?.languages?.takeIf { it.isNotBlank() } ?: "Not Set (Tap Edit)")
                }
            }

            // 5. Service Details Group (WORKING EDIT BUTTON)
            item {
                GroupedProfileSection(
                    title = "Service Details",
                    icon = Icons.Default.Build,
                    onEdit = { showEditServiceDialog = true }
                ) {
                    ProfileInfoRow(icon = Icons.Default.Build, label = "Specialization", value = state.profile?.specialization?.takeIf { it.isNotBlank() } ?: "Not Set")
                    ProfileInfoRow(icon = Icons.Default.WorkHistory, label = "Experience", value = state.profile?.experience?.takeIf { it.isNotBlank() } ?: "Not Set (Tap Edit)")
                    ProfileInfoRow(icon = Icons.Default.VerifiedUser, label = "License / Certification", value = state.profile?.license?.takeIf { it.isNotBlank() } ?: "Not Set (Tap Edit)")
                    ProfileInfoRow(icon = Icons.Default.LocationCity, label = "Service Area", value = state.profile?.serviceArea?.takeIf { it.isNotBlank() } ?: "Not Set (Tap Edit)")
                }
            }

            // 6. Sign Out Button (Clean, no App Settings or Support & Legal sections!)
            item {
                Spacer(modifier = Modifier.height(10.dp))
                Button(
                    onClick = { showLogoutDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEE2E2)),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFCA5A5)),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                ) {
                    Icon(imageVector = Icons.Default.Logout, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Sign Out from Console", color = Color(0xFFB91C1C), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

// -------------------------------------------------------------------------
// Component: Stat column inside Profile card
// -------------------------------------------------------------------------
@Composable
private fun ProfileStatColumn(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    value: String,
    label: String
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(16.dp))
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = value, fontSize = 14.sp, fontWeight = FontWeight.Black, color = TextDarkPrimary)
        Text(text = label, fontSize = 10.sp, color = TextDarkMuted)
    }
}

// -------------------------------------------------------------------------
// Component: Grouped Profile Section Container
// -------------------------------------------------------------------------
@Composable
private fun GroupedProfileSection(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onEdit: () -> Unit,
    content: @Composable ColumnScope.() -> Unit
) {
    Surface(
        color = Color.White,
        shape = RoundedCornerShape(14.dp),
        shadowElevation = 1.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(imageVector = icon, contentDescription = null, tint = TechFlameOrange, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                }

                Text(
                    text = "Edit",
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = TechBlue,
                    modifier = Modifier.clickable { onEdit() }
                )
            }

            Spacer(modifier = Modifier.height(10.dp))
            content()
        }
    }
}

// -------------------------------------------------------------------------
// Component: Single Row inside Profile Info Sections
// -------------------------------------------------------------------------
@Composable
private fun ProfileInfoRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 5.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = TextDarkMuted, modifier = Modifier.size(14.dp))
        Spacer(modifier = Modifier.width(8.dp))
        Text(text = value, fontSize = 11.5.sp, color = TextDarkSecondary, modifier = Modifier.weight(1f))
        Icon(imageVector = Icons.Default.ChevronRight, contentDescription = null, tint = Color(0xFFCBD5E1), modifier = Modifier.size(14.dp))
    }
}

// =========================================================================
// SCREEN 4: EMERGENCY SAFETY SOS POPUP DIALOG (Matches Client Reference Image 4)
// =========================================================================

@Composable
fun EmergencySafetySosDialog(
    trade: String = "Multi-Trade Specialist",
    onDismiss: () -> Unit,
    onCallEmergency: () -> Unit
) {
    val tradeLower = trade.lowercase()
    val (hazardTitle, hazardDesc, credPill) = when {
        tradeLower.contains("electr") -> {
            Triple(
                "High-voltage flash, live arc hazard, or site accident detected?",
                "Triggering SOS alerts Ghar Tak 24×7 Safety Command Center with your exact GPS telemetry and VDE 1000V crew credentials.",
                "Your VDE 1000V\nCrew Credentials"
            )
        }
        tradeLower.contains("plumb") || tradeLower.contains("water") || tradeLower.contains("pipe") -> {
            Triple(
                "High-pressure burst, severe flooding, toxic drain fumes, or site injury?",
                "Triggering SOS alerts Ghar Tak 24×7 Safety Command Center with your exact GPS telemetry and Certified Plumbing Specialist credentials.",
                "Certified Plumber\nCrew Credentials"
            )
        }
        tradeLower.contains("carpent") || tradeLower.contains("wood") -> {
            Triple(
                "Power tool kickback, structural timber collapse, or sharp laceration hazard?",
                "Triggering SOS alerts Ghar Tak 24×7 Safety Command Center with your exact GPS telemetry and Certified Carpentry Specialist credentials.",
                "Certified Carpenter\nCrew Credentials"
            )
        }
        tradeLower.contains("clean") -> {
            Triple(
                "Chemical splash, toxic fume inhalation, slip & fall, or workplace accident?",
                "Triggering SOS alerts Ghar Tak 24×7 Safety Command Center with your exact GPS telemetry and Certified Hygiene Specialist credentials.",
                "Certified Hygiene\nCrew Credentials"
            )
        }
        tradeLower.contains("paint") -> {
            Triple(
                "Scaffolding/ladder fall, chemical toxicity, eye injury, or site accident?",
                "Triggering SOS alerts Ghar Tak 24×7 Safety Command Center with your exact GPS telemetry and Certified Painting Specialist credentials.",
                "Certified Painting\nCrew Credentials"
            )
        }
        tradeLower.contains("mason") || tradeLower.contains("rajmistri") -> {
            Triple(
                "Wall collapse, falling heavy masonry debris, or severe site accident?",
                "Triggering SOS alerts Ghar Tak 24×7 Safety Command Center with your exact GPS telemetry and Certified Masonry Specialist credentials.",
                "Certified Masonry\nCrew Credentials"
            )
        }
        else -> {
            val tradeLabel = trade.ifBlank { "Multi-Trade" }
            Triple(
                "Severe workplace hazard, physical trauma, or acute site accident detected?",
                "Triggering SOS alerts Ghar Tak 24×7 Safety Command Center with your exact GPS telemetry and Certified $tradeLabel credentials.",
                "Certified $tradeLabel\nCrew Credentials"
            )
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Top Red Glowing Header with Emergency Rotating Beacon Graphic
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(TechEmergencyRed, TechEmergencyRedDark)))
                        .padding(horizontal = 16.dp, vertical = 14.dp)
                ) {
                    // Close Button (Top Right)
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(28.dp)
                            .background(Color.White.copy(alpha = 0.25f), CircleShape)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = Color.White,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        // Siren Beacon Image Asset
                        Image(
                            painter = painterResource(id = R.drawable.img_tech_sos_beacon),
                            contentDescription = "Emergency Beacon",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.height(90.dp)
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "EMERGENCY SAFETY",
                            color = Color.White,
                            fontSize = 19.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.8.sp
                        )

                        Spacer(modifier = Modifier.height(6.dp))

                        // Heartbeat Line with SOS Pill
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            // ECG pulse line left
                            Canvas(modifier = Modifier.size(width = 38.dp, height = 16.dp)) {
                                val stroke = 2.dp.toPx()
                                drawLine(Color.White.copy(alpha = 0.8f), Offset(0f, size.height / 2), Offset(size.width * 0.4f, size.height / 2), strokeWidth = stroke, cap = StrokeCap.Round)
                                drawLine(Color.White.copy(alpha = 0.8f), Offset(size.width * 0.4f, size.height / 2), Offset(size.width * 0.6f, 0f), strokeWidth = stroke, cap = StrokeCap.Round)
                                drawLine(Color.White.copy(alpha = 0.8f), Offset(size.width * 0.6f, 0f), Offset(size.width * 0.8f, size.height), strokeWidth = stroke, cap = StrokeCap.Round)
                                drawLine(Color.White.copy(alpha = 0.8f), Offset(size.width * 0.8f, size.height), Offset(size.width, size.height / 2), strokeWidth = stroke, cap = StrokeCap.Round)
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            // Glowing White SOS Pill
                            Surface(
                                color = Color.White,
                                shape = RoundedCornerShape(50.dp),
                                shadowElevation = 4.dp
                            ) {
                                Text(
                                    text = "SOS",
                                    color = TechEmergencyRed,
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Black,
                                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 2.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(6.dp))

                            // ECG pulse line right
                            Canvas(modifier = Modifier.size(width = 38.dp, height = 16.dp)) {
                                val stroke = 2.dp.toPx()
                                drawLine(Color.White.copy(alpha = 0.8f), Offset(0f, size.height / 2), Offset(size.width * 0.2f, 0f), strokeWidth = stroke, cap = StrokeCap.Round)
                                drawLine(Color.White.copy(alpha = 0.8f), Offset(size.width * 0.2f, 0f), Offset(size.width * 0.4f, size.height), strokeWidth = stroke, cap = StrokeCap.Round)
                                drawLine(Color.White.copy(alpha = 0.8f), Offset(size.width * 0.4f, size.height), Offset(size.width * 0.6f, size.height / 2), strokeWidth = stroke, cap = StrokeCap.Round)
                                drawLine(Color.White.copy(alpha = 0.8f), Offset(size.width * 0.6f, size.height / 2), Offset(size.width, size.height / 2), strokeWidth = stroke, cap = StrokeCap.Round)
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        Text(
                            text = "Your safety is our priority",
                            color = Color.White.copy(alpha = 0.9f),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // White Body Section
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Pink Warning Box
                    Surface(
                        color = Color(0xFFFFF1F2),
                        shape = RoundedCornerShape(14.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECDD3)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.Top
                        ) {
                            // Red Warning Icon in glowing circle
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFFEE2E2)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = TechEmergencyRed,
                                    modifier = Modifier.size(24.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column {
                                Text(
                                    text = hazardTitle,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 12.5.sp,
                                    color = Color(0xFF881337)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = hazardDesc,
                                    fontSize = 11.sp,
                                    color = Color(0xFF9F1239),
                                    lineHeight = 15.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 3 Telemetry Columns (GPS, 24x7 Center, Dynamic Crew Credentials)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        SosTelemetryPill(icon = Icons.Default.Place, iconTint = TechEmergencyRed, label = "Your Live\nGPS Location")
                        SosTelemetryPill(icon = Icons.Default.HeadsetMic, iconTint = Color(0xFFF57C00), label = "24×7 Safety\nCommand Center")
                        SosTelemetryPill(icon = Icons.Default.Shield, iconTint = TechBlue, label = credPill)
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    // Primary Button: Big Red Call 112 / Helpline
                    Button(
                        onClick = onCallEmergency,
                        colors = ButtonDefaults.buttonColors(containerColor = TechEmergencyRed),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Call, contentDescription = null, modifier = Modifier.size(20.dp))
                            Text(
                                text = "CALL 112 / DISPATCH HELPLINE",
                                fontSize = 13.5.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                            Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(18.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Secondary Action: Cancel
                    Surface(
                        onClick = onDismiss,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        color = Color.White,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(44.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(text = "Cancel", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDarkSecondary)
                        }
                    }
                }
            }
        }
    }
}

// -------------------------------------------------------------------------
// Component: Single Telemetry Pill in SOS Dialog
// -------------------------------------------------------------------------
@Composable
private fun SosTelemetryPill(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    label: String
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(34.dp)
                .clip(CircleShape)
                .background(iconTint.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(18.dp))
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 9.5.sp,
            fontWeight = FontWeight.Bold,
            color = TextDarkSecondary,
            textAlign = TextAlign.Center,
            lineHeight = 12.sp
        )
    }
}

// =========================================================================
// SCREEN 5: ALL JOBS CONTENT
// =========================================================================

@Composable
fun TechnicianAllJobsContent(
    state: DashboardUiState,
    onSelectJob: (TechnicianJob) -> Unit
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Surface(color = TechFlameOrange, modifier = Modifier.fillMaxWidth()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Technician Job Dispatch Queue",
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
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            if (state.assignedJobs.isEmpty()) {
                item {
                    Surface(
                        color = Color.White,
                        shape = RoundedCornerShape(14.dp),
                        shadowElevation = 1.dp,
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(28.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.WorkOutline,
                                contentDescription = null,
                                tint = TechFlameOrange,
                                modifier = Modifier.size(48.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No Jobs in Queue",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "New bookings from your service territory (${state.profile?.location ?: "Odisha, India"}) will appear here automatically upon customer assignment.",
                                fontSize = 12.sp,
                                color = TextDarkMuted,
                                textAlign = TextAlign.Center
                            )
                        }
                    }
                }
            }

            items(state.assignedJobs) { job ->
                val serviceDrawable = getServiceDrawableRes(job.serviceTitle)

                Surface(
                    onClick = { onSelectJob(job) },
                    color = Color.White,
                    shape = RoundedCornerShape(14.dp),
                    shadowElevation = 2.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Image(
                            painter = painterResource(id = serviceDrawable),
                            contentDescription = job.serviceTitle,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(50.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(10.dp))
                        )

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = job.jobTicketNumber,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = TechFlameOrange
                                )
                                Surface(
                                    color = if (job.status == "STARTED") Color(0xFFFFF3E0) else Color(0xFFE8F5E9),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = job.status,
                                        fontSize = 9.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (job.status == "STARTED") TechFlameOrange else Color(0xFF2E7D32),
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(text = job.serviceTitle, fontWeight = FontWeight.Bold, fontSize = 12.5.sp, color = TextDarkPrimary)
                            Text(text = "Customer: ${job.customerName} • Pincode: ${job.pincode}", fontSize = 11.sp, color = TextDarkSecondary)
                            Text(text = job.customerAddressText, fontSize = 10.sp, color = TextDarkMuted, maxLines = 1)
                        }
                    }
                }
            }
        }
    }
}

// =========================================================================
// SCREEN 6: JOB DETAILS CONTENT
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
    val serviceDrawable = getServiceDrawableRes(job.serviceTitle)

    Column(modifier = Modifier.fillMaxSize()) {
        Surface(color = TechFlameOrange, modifier = Modifier.fillMaxWidth()) {
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
                Column {
                    Text(text = "Job Order ${job.jobTicketNumber}", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    Text(text = job.serviceTitle, color = Color.White.copy(alpha = 0.9f), fontSize = 11.sp)
                }
            }
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
                    shadowElevation = 2.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Image(
                            painter = painterResource(id = serviceDrawable),
                            contentDescription = job.serviceTitle,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(60.dp)
                                .clip(RoundedCornerShape(10.dp))
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(text = job.serviceTitle, fontWeight = FontWeight.Black, fontSize = 14.sp, color = TextDarkPrimary)
                            Text(text = "Scheduled: ${job.scheduledAt}", fontSize = 11.5.sp, color = TextDarkSecondary)
                            Text(text = "Estimated Payout: ₹${"%,.0f".format(job.totalAmountInr)}", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TechGreen)
                        }
                    }
                }
            }

            item {
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(14.dp),
                    shadowElevation = 2.dp,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(text = "Customer Details", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = "Name: ${job.customerName}", fontSize = 12.sp, color = TextDarkSecondary)
                        Text(text = "Phone: ${job.customerPhone}", fontSize = 12.sp, color = TextDarkSecondary)
                        Text(text = "Address: ${job.customerAddressText}", fontSize = 12.sp, color = TextDarkSecondary)
                    }
                }
            }

            item {
                val isCompleted = job.status == "COMPLETED"
                val isStarted = job.status == "STARTED" || job.status == "IN_PROGRESS"

                if (isCompleted) {
                    Button(
                        onClick = onBack,
                        colors = ButtonDefaults.buttonColors(containerColor = TechGreen),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Text("Return to Dispatch Queue", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Color.White)
                    }
                } else if (isStarted) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = onCall,
                            colors = ButtonDefaults.buttonColors(containerColor = TechGreen),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(imageVector = Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Call Customer", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }

                        Button(
                            onClick = onCompleteJob,
                            colors = ButtonDefaults.buttonColors(containerColor = TechFlameOrange),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1.3f)
                        ) {
                            Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Complete & Handover", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Button(
                            onClick = onNavigate,
                            colors = ButtonDefaults.buttonColors(containerColor = TechBlue),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(imageVector = Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Navigate", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }

                        Button(
                            onClick = onCall,
                            colors = ButtonDefaults.buttonColors(containerColor = TechGreen),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Icon(imageVector = Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Call", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    val isElectrical = job.serviceTitle.lowercase().let {
                        it.contains("electr") || it.contains("wire") || it.contains("mcb") || it.contains("panel") || it.contains("fan") || it.contains("ac") || it.contains("generator")
                    }
                    val startJobButtonText = if (isElectrical) {
                        "Start Job (1000V Safety Interlock)"
                    } else {
                        "Start Job (Pre-Work Safety Check)"
                    }

                    Button(
                        onClick = onStartJob,
                        colors = ButtonDefaults.buttonColors(containerColor = TechFlameOrange),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp)
                    ) {
                        Icon(imageVector = Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(startJobButtonText, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

// =========================================================================
// BOTTOM NAVIGATION BAR (Home | Jobs | Earnings | Profile | SOS Help)
// =========================================================================

@Composable
fun TechnicianBottomNavBar(
    currentTab: String,
    badgeCount: Int = 2,
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
                Triple("EARNINGS", "Earnings", Icons.Default.BarChart),
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
                    Box {
                        Icon(
                            imageVector = icon,
                            contentDescription = label,
                            tint = when {
                                isSos -> TechEmergencyRed
                                isSelected -> TechFlameOrange
                                else -> Color(0xFF64748B)
                            },
                            modifier = Modifier.size(22.dp)
                        )

                        // Notification Badge on "Jobs"
                        if (key == "JOBS" && badgeCount > 0) {
                            Box(
                                modifier = Modifier
                                    .size(15.dp)
                                    .align(Alignment.TopEnd)
                                    .offset(x = 6.dp, y = (-4).dp)
                                    .clip(CircleShape)
                                    .background(TechEmergencyRed),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "$badgeCount",
                                    color = Color.White,
                                    fontSize = 8.5.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(2.dp))

                    Text(
                        text = label,
                        fontSize = 10.sp,
                        fontWeight = if (isSelected || isSos) FontWeight.Bold else FontWeight.Medium,
                        color = when {
                            isSos -> TechEmergencyRed
                            isSelected -> TechFlameOrange
                            else -> Color(0xFF64748B)
                        }
                    )
                }
            }
        }
    }
}

// =========================================================================
// Component: Withdrawal Record Card
// =========================================================================

@Composable
private fun WithdrawalRecordCard(item: com.ghartak.technician.data.model.WithdrawalItem) {
    val isPaid = item.status == "PAID"
    val isRejected = item.status == "REJECTED"
    val isPending = !isPaid && !isRejected

    val statusBg = when {
        isPaid -> Color(0xFFECFDF5)
        isRejected -> Color(0xFFFEF2F2)
        else -> Color(0xFFFFFBEB)
    }
    val statusBorder = when {
        isPaid -> Color(0xFFA7F3D0)
        isRejected -> Color(0xFFFECACA)
        else -> Color(0xFFFDE68A)
    }
    val statusText = when {
        isPaid -> "PAID • SETTLED"
        isRejected -> "DECLINED / REJECTED"
        else -> "PENDING REVIEW"
    }
    val statusColor = when {
        isPaid -> Color(0xFF047857)
        isRejected -> Color(0xFFB91C1C)
        else -> Color(0xFFB45309)
    }
    val statusIcon = when {
        isPaid -> Icons.Default.CheckCircle
        isRejected -> Icons.Default.Cancel
        else -> Icons.Default.Schedule
    }

    Surface(
        color = Color.White,
        shape = RoundedCornerShape(14.dp),
        shadowElevation = 2.dp,
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Header Row: Amount + Status Pill
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "₹${"%,.0f".format(item.amountInr)}",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 17.sp,
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        color = Color(0xFFF1F5F9),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = if (item.payoutMethod == "UPI") "UPI" else "BANK TRANSFER",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF475569),
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                Surface(
                    color = statusBg,
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, statusBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = statusIcon, contentDescription = null, tint = statusColor, modifier = Modifier.size(13.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = statusText,
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.Bold,
                            color = statusColor
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Destination details
            if (item.payoutMethod == "UPI") {
                Text(
                    text = "UPI ID: ${item.upiId ?: "Not specified"}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = TextDarkSecondary
                )
            } else {
                val accDisplay = if (!item.accountNumber.isNullOrBlank()) {
                    if (item.accountNumber.length > 4) "••••" + item.accountNumber.takeLast(4) else item.accountNumber
                } else "—"
                Text(
                    text = "A/C: $accDisplay (${item.accountHolderName ?: ""}) • IFSC: ${item.ifscCode ?: "—"}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    color = TextDarkSecondary
                )
            }

            // UTR & Confirmation message if PAID
            if (isPaid) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = Color(0xFFECFDF5),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA7F3D0)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Color(0xFF047857), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Settlement UTR: ${item.utrNumber ?: "Bank Transfer Verified"}",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF047857)
                            )
                        }
                        if (!item.partnerMessage.isNullOrBlank()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Partner Note: ${item.partnerMessage}",
                                fontSize = 11.sp,
                                color = Color(0xFF065F46)
                            )
                        }
                    }
                }
            }

            // Rejection reason if REJECTED
            if (isRejected) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = Color(0xFFFEF2F2),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.ErrorOutline, contentDescription = null, tint = Color(0xFFB91C1C), modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Declined by Partner",
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFB91C1C)
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = item.rejectionReason?.ifBlank { null } ?: item.partnerMessage?.ifBlank { null } ?: "Unable to process payout. Please check your bank/UPI details.",
                            fontSize = 11.sp,
                            color = Color(0xFF991B1B)
                        )
                    }
                }
            }

            // If PENDING
            if (isPending) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    color = Color(0xFFFFFBEB),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = Color(0xFFB45309), modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Sent to franchise partner console. Partner will transfer funds manually and confirm UTR.",
                            fontSize = 10.5.sp,
                            color = Color(0xFF92400E)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(6.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Ref: ${item.id}",
                    fontSize = 10.sp,
                    color = TextDarkMuted
                )
                if (!item.requestedAt.isNullOrBlank()) {
                    Text(
                        text = item.requestedAt,
                        fontSize = 10.sp,
                        color = TextDarkMuted
                    )
                }
            }
        }
    }
}

// =========================================================================
// Dialog: Interactive Withdrawal Request Dialog
// =========================================================================

@Composable
fun WithdrawalRequestDialog(
    availableInr: Double,
    isWithdrawing: Boolean,
    initialUpi: String,
    initialAccountName: String,
    initialAccountNumber: String,
    initialIfsc: String,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onSubmit: (amount: Double, method: String, upi: String?, holder: String?, acc: String?, ifsc: String?, bankName: String?) -> Unit
) {
    var amountText by remember { mutableStateOf(if (availableInr > 0) "%.0f".format(minOf(availableInr, 500.0)) else "0") }
    var selectedMethod by remember { mutableStateOf("UPI") }

    var upiId by remember { mutableStateOf(initialUpi) }
    var accountHolderName by remember { mutableStateOf(initialAccountName) }
    var accountNumber by remember { mutableStateOf(initialAccountNumber) }
    var confirmAccountNumber by remember { mutableStateOf(initialAccountNumber) }
    var ifscCode by remember { mutableStateOf(initialIfsc) }
    var bankName by remember { mutableStateOf("") }

    var validationError by remember { mutableStateOf<String?>(null) }
    val amountDouble = amountText.toDoubleOrNull() ?: 0.0

    Dialog(onDismissRequest = { if (!isWithdrawing) onDismiss() }) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color.White,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    // Header
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE8F5E9)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AccountBalanceWallet,
                                    contentDescription = null,
                                    tint = Color(0xFF1B873F),
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = "Withdraw Earnings",
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "Available: ₹${"%,.0f".format(availableInr)}",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color(0xFF1B873F)
                                )
                            }
                        }
                        IconButton(onClick = onDismiss, enabled = !isWithdrawing) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Close", tint = TextDarkSecondary)
                        }
                    }
                }

                item {
                    Box(modifier = Modifier.fillMaxWidth().height(1.dp).background(Color(0xFFF1F5F9)))
                }

                // Amount input
                item {
                    Column {
                        Text(
                            text = "Enter Amount to Withdraw",
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = amountText,
                            onValueChange = { input ->
                                if (input.all { it.isDigit() }) {
                                    amountText = input
                                    validationError = null
                                }
                            },
                            prefix = {
                                Text("₹ ", fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )

                        // Quick amount chips
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            val chipAmounts = listOf(500.0, 1000.0, 2000.0)
                            chipAmounts.forEach { chipVal ->
                                if (chipVal <= availableInr) {
                                    Surface(
                                        onClick = {
                                            amountText = "%.0f".format(chipVal)
                                            validationError = null
                                        },
                                        shape = RoundedCornerShape(8.dp),
                                        color = if (amountText == "%.0f".format(chipVal)) Color(0xFFE8F5E9) else Color(0xFFF1F5F9),
                                        border = androidx.compose.foundation.BorderStroke(
                                            1.dp,
                                            if (amountText == "%.0f".format(chipVal)) Color(0xFF1B873F) else Color(0xFFE2E8F0)
                                        )
                                    ) {
                                        Text(
                                            text = "₹${"%,.0f".format(chipVal)}",
                                            fontSize = 11.5.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = if (amountText == "%.0f".format(chipVal)) Color(0xFF1B873F) else TextDarkSecondary,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp)
                                        )
                                    }
                                }
                            }
                            if (availableInr > 0) {
                                Surface(
                                    onClick = {
                                        amountText = "%.0f".format(availableInr)
                                        validationError = null
                                    },
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (amountText == "%.0f".format(availableInr)) Color(0xFFE8F5E9) else Color(0xFFF1F5F9),
                                    border = androidx.compose.foundation.BorderStroke(
                                        1.dp,
                                        if (amountText == "%.0f".format(availableInr)) Color(0xFF1B873F) else Color(0xFFE2E8F0)
                                    )
                                ) {
                                    Text(
                                        text = "All (₹${"%,.0f".format(availableInr)})",
                                        fontSize = 11.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = if (amountText == "%.0f".format(availableInr)) Color(0xFF1B873F) else TextDarkSecondary,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Payout Method Selector
                item {
                    Text(
                        text = "Select Payout Destination",
                        fontSize = 12.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Surface(
                            onClick = { selectedMethod = "UPI" },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            color = if (selectedMethod == "UPI") Color(0xFFF0FDF4) else Color(0xFFF8FAFC),
                            border = androidx.compose.foundation.BorderStroke(
                                1.5.dp,
                                if (selectedMethod == "UPI") Color(0xFF16A34A) else Color(0xFFE2E8F0)
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.QrCode,
                                    contentDescription = null,
                                    tint = if (selectedMethod == "UPI") Color(0xFF16A34A) else Color(0xFF64748B),
                                    modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "UPI ID / VPA",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = if (selectedMethod == "UPI") Color(0xFF16A34A) else TextDarkPrimary
                                )
                                Text(
                                    text = "GPay, PhonePe, Paytm",
                                    fontSize = 9.5.sp,
                                    color = TextDarkMuted
                                )
                            }
                        }

                        Surface(
                            onClick = { selectedMethod = "BANK_ACCOUNT" },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            color = if (selectedMethod == "BANK_ACCOUNT") Color(0xFFF0FDF4) else Color(0xFFF8FAFC),
                            border = androidx.compose.foundation.BorderStroke(
                                1.5.dp,
                                if (selectedMethod == "BANK_ACCOUNT") Color(0xFF16A34A) else Color(0xFFE2E8F0)
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.AccountBalance,
                                    contentDescription = null,
                                    tint = if (selectedMethod == "BANK_ACCOUNT") Color(0xFF16A34A) else Color(0xFF64748B),
                                    modifier = Modifier.size(24.dp)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Bank Account",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = if (selectedMethod == "BANK_ACCOUNT") Color(0xFF16A34A) else TextDarkPrimary
                                )
                                Text(
                                    text = "IMPS / NEFT Transfer",
                                    fontSize = 9.5.sp,
                                    color = TextDarkMuted
                                )
                            }
                        }
                    }
                }

                // Dynamic Method Input Fields
                if (selectedMethod == "UPI") {
                    item {
                        Column {
                            Text(
                                text = "UPI ID (VPA)",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            OutlinedTextField(
                                value = upiId,
                                onValueChange = { upiId = it.trim(); validationError = null },
                                placeholder = { Text("e.g. mobile@paytm or user@okaxis", fontSize = 12.sp) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            )
                        }
                    }
                } else {
                    item {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Column {
                                Text(
                                    text = "Account Holder Name",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextDarkPrimary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = accountHolderName,
                                    onValueChange = { accountHolderName = it; validationError = null },
                                    placeholder = { Text("As per bank passbook", fontSize = 12.sp) },
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp)
                                )
                            }

                            Column {
                                Text(
                                    text = "Bank Account Number",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextDarkPrimary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = accountNumber,
                                    onValueChange = { if (it.all { ch -> ch.isDigit() }) accountNumber = it; validationError = null },
                                    placeholder = { Text("Enter 9-18 digit account number", fontSize = 12.sp) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp)
                                )
                            }

                            Column {
                                Text(
                                    text = "Confirm Account Number",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextDarkPrimary
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                OutlinedTextField(
                                    value = confirmAccountNumber,
                                    onValueChange = { if (it.all { ch -> ch.isDigit() }) confirmAccountNumber = it; validationError = null },
                                    placeholder = { Text("Re-enter bank account number", fontSize = 12.sp) },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(10.dp)
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "IFSC Code",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextDarkPrimary
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    OutlinedTextField(
                                        value = ifscCode,
                                        onValueChange = { ifscCode = it.uppercase().trim(); validationError = null },
                                        placeholder = { Text("SBIN0001234", fontSize = 12.sp) },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(10.dp)
                                    )
                                }
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Bank Name (Optional)",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextDarkPrimary
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    OutlinedTextField(
                                        value = bankName,
                                        onValueChange = { bankName = it },
                                        placeholder = { Text("SBI, HDFC...", fontSize = 12.sp) },
                                        singleLine = true,
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(10.dp)
                                    )
                                }
                            }
                        }
                    }
                }

                // Error alert
                val displayErr = validationError ?: errorMessage
                if (displayErr != null) {
                    item {
                        Surface(
                            color = Color(0xFFFEF2F2),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFECACA)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = displayErr,
                                color = Color(0xFFDC2626),
                                fontSize = 11.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                    }
                }

                // Partner settlement disclaimer note
                item {
                    Surface(
                        color = Color(0xFFF8FAFC),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Info, contentDescription = null, tint = Color(0xFF64748B), modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Payout requests are routed directly to your franchise partner console. The partner verifies details, sends payment, and supplies UTR proof.",
                                fontSize = 10.5.sp,
                                color = Color(0xFF475569),
                                lineHeight = 14.sp
                            )
                        }
                    }
                }

                // Buttons
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedButton(
                            onClick = onDismiss,
                            enabled = !isWithdrawing,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f).height(46.dp)
                        ) {
                            Text("Cancel", color = TextDarkSecondary)
                        }

                        Button(
                            onClick = {
                                if (amountDouble <= 0.0) {
                                    validationError = "Please enter an amount greater than ₹0."
                                    return@Button
                                }
                                if (amountDouble > availableInr) {
                                    validationError = "Amount exceeds available balance of ₹${"%,.0f".format(availableInr)}."
                                    return@Button
                                }
                                if (selectedMethod == "UPI") {
                                    if (upiId.isBlank() || !upiId.contains("@")) {
                                        validationError = "Please enter a valid UPI ID (e.g. mobile@paytm)."
                                        return@Button
                                    }
                                    onSubmit(amountDouble, "UPI", upiId, null, null, null, null)
                                } else {
                                    if (accountHolderName.isBlank()) {
                                        validationError = "Please enter Account Holder Name."
                                        return@Button
                                    }
                                    if (accountNumber.isBlank() || accountNumber.length < 8) {
                                        validationError = "Please enter a valid Account Number (min 8 digits)."
                                        return@Button
                                    }
                                    if (accountNumber != confirmAccountNumber) {
                                        validationError = "Account numbers do not match."
                                        return@Button
                                    }
                                    if (ifscCode.isBlank() || ifscCode.length < 4) {
                                        validationError = "Please enter a valid IFSC code."
                                        return@Button
                                    }
                                    onSubmit(
                                        amountDouble,
                                        "BANK_ACCOUNT",
                                        null,
                                        accountHolderName,
                                        accountNumber,
                                        ifscCode,
                                        bankName.ifBlank { null }
                                    )
                                }
                            },
                            enabled = !isWithdrawing && availableInr > 0,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1B873F)),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f).height(46.dp)
                        ) {
                            if (isWithdrawing) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                            } else {
                                Text("Submit Request", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
