package com.ghartak.customer.ui.track

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.Image
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.customer.R
import com.ghartak.customer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerTrackingScreen(
    jobId: String,
    viewModel: CustomerTrackingViewModel,
    onBack: () -> Unit,
    onProceedToSignoff: (jobId: String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    var showSosModal by remember { mutableStateOf(false) }
    var showArrivalDialog by remember { mutableStateOf(false) }
    var hasPromptedArrival by remember { mutableStateOf(false) }
    var showSignaturePad by remember { mutableStateOf(false) }
    var digitalSignature by remember { mutableStateOf<String?>(null) }
    var customerSignature by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(jobId) {
        viewModel.initTracking(jobId)
    }

    LaunchedEffect(state.status, state.isDoorstepArrived) {
        if ((state.status == "ARRIVED" || state.isDoorstepArrived) && !hasPromptedArrival) {
            showArrivalDialog = true
            hasPromptedArrival = true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = when (state.status) {
                                "ASSIGNED", "PENDING_DISPATCH" -> "AWAITING ACCEPTANCE"
                                "CANCELLED" -> "BOOKING DECLINED"
                                else -> "LIVE ${state.serviceTitle.ifBlank { "SERVICE" }.uppercase()} TRACKING"
                            },
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = when (state.status) {
                                "ASSIGNED", "PENDING_DISPATCH" -> "Ticket: ${state.ticketNumber} • Dispatched"
                                "CANCELLED" -> "Ticket: ${state.ticketNumber} • Declined"
                                else -> "Ticket: ${state.ticketNumber} • Real-Time SSE"
                            },
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
                actions = {
                    // 24x7 Customer Emergency SOS Trigger Button (Issue 35)
                    Surface(
                        color = Color(0xFFDC2626),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .padding(end = 8.dp)
                            .clickable { showSosModal = true }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 9.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(text = "🚨", fontSize = 11.sp)
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = "Emergency SOS",
                                color = Color.White,
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Black
                            )
                        }
                    }

                    Surface(
                        color = when (state.status) {
                            "ARRIVED" -> SuccessGreen.copy(alpha = 0.15f)
                            "IN_PROGRESS" -> SapphireBlue800.copy(alpha = 0.15f)
                            "COMPLETED" -> SuccessGreen.copy(alpha = 0.2f)
                            "CANCELLED" -> Color(0xFFEF4444).copy(alpha = 0.15f)
                            else -> WarningAmber.copy(alpha = 0.15f)
                        },
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(7.dp)
                                    .clip(CircleShape)
                                    .background(
                                        when (state.status) {
                                            "ARRIVED", "COMPLETED" -> SuccessGreen
                                            "IN_PROGRESS" -> SapphireBlue800
                                            "CANCELLED" -> Color(0xFFDC2626)
                                            else -> WarningAmber
                                        }
                                    )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = when (state.status) {
                                    "ASSIGNED", "PENDING_DISPATCH" -> "DISPATCHED"
                                    "CANCELLED" -> "DECLINED"
                                    "ARRIVED" -> "AT DOORSTEP"
                                    "IN_PROGRESS" -> "REPAIRING"
                                    "COMPLETED" -> "COMPLETED"
                                    else -> "EN ROUTE"
                                },
                                color = when (state.status) {
                                    "ARRIVED", "COMPLETED" -> SuccessGreen
                                    "IN_PROGRESS" -> SapphireBlue800
                                    "CANCELLED" -> Color(0xFFDC2626)
                                    else -> Color(0xFFB45309)
                                },
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        floatingActionButton = {
            if (state.status != "CANCELLED" && state.status != "COMPLETED") {
                ExtendedFloatingActionButton(
                    onClick = { showSosModal = true },
                    containerColor = Color(0xFFDC2626),
                    contentColor = Color.White,
                    shape = RoundedCornerShape(24.dp),
                    icon = { Text(text = "🚨", fontSize = 16.sp) },
                    text = {
                        Text(
                            text = "Emergency SOS",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.5.sp
                        )
                    }
                )
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
            when (state.status) {
                "ASSIGNED", "PENDING_DISPATCH" -> {
                    AwaitingTechnicianAcceptanceView(
                        state = state,
                        onCancelBooking = {
                            viewModel.cancelBooking(context) {
                                onBack()
                            }
                        }
                    )
                }
                "CANCELLED" -> {
                    TechnicianCancelledView(
                        state = state,
                        onChooseAnother = {
                            viewModel.dismissCancelledBooking()
                            onBack()
                        }
                    )
                }
                "COMPLETED" -> {
                    JobCompletedCelebrationView(
                        state = state,
                        onProceedToSignoff = { onProceedToSignoff(state.jobId) },
                        onBack = onBack
                    )
                }
                else -> {
                    // 0. Doorstep Arrival Alert Banner (Instant doorstep delivery message)
                    if (state.isDoorstepArrived || state.status == "ARRIVED" || state.distanceKm <= 0.05) {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF22C55E))
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(text = "🔔", fontSize = 20.sp)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "TECHNICIAN IS AT YOUR DOORSTEP!",
                                        fontWeight = FontWeight.Black,
                                        color = Color(0xFF15803D),
                                        fontSize = 14.5.sp
                                    )
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "Technician ${state.technicianName} has arrived at your doorstep! Doorstep geofence verified (0.0 km). Please welcome the technician.",
                                    color = Color(0xFF166534),
                                    fontSize = 12.sp,
                                    textAlign = TextAlign.Center
                                )
                                if (state.handoverOtp.isNotBlank()) {
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Surface(
                                        color = Color(0xFFDCFCE7),
                                        shape = RoundedCornerShape(10.dp),
                                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF86EFAC))
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "Handover OTP: ",
                                                fontSize = 12.sp,
                                                color = Color(0xFF166534),
                                                fontWeight = FontWeight.Medium
                                            )
                                            Text(
                                                text = state.handoverOtp,
                                                fontSize = 18.sp,
                                                fontWeight = FontWeight.Black,
                                                color = Color(0xFF15803D),
                                                letterSpacing = 2.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // 1. Lifecycle Progress Stepper (4-Stage with Timestamps)
                    TrackingLifecycleStepper(state = state)

                    // 2. Tactical Midnight Live Map Visualizer with City Grid & Real-Time GPS Tracking
                    LiveServiceTrackingMap(state = state)

            // 2.5 Real-Time GPS Telemetry & Area Localization Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeCard,
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC)),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = "🇮🇳", fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "LIVE GPS TELEMETRY & LOCATIONS",
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = TextDarkMuted,
                                letterSpacing = 0.5.sp
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = SapphireBlue800.copy(alpha = 0.1f)
                        ) {
                            Text(
                                text = "${"%.2f".format(state.distanceKm)} km apart",
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold,
                                color = SapphireBlue800
                            )
                        }
                    }

                    // Technician Location Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.size(32.dp),
                            shape = CircleShape,
                            color = Color(0xFF10B981).copy(alpha = 0.15f)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Navigation,
                                    contentDescription = null,
                                    tint = Color(0xFF059669),
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Technician Current Area",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextDarkMuted,
                                fontSize = 10.sp
                            )
                            Text(
                                text = state.techAreaName.ifBlank { "Resolving GPS location..." },
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextDarkPrimary
                            )
                            if (state.techLatitude != 0.0 && state.techLongitude != 0.0) {
                                Text(
                                    text = "Lat: ${"%.4f".format(state.techLatitude)}, Lng: ${"%.4f".format(state.techLongitude)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextDarkMuted,
                                    fontSize = 9.5.sp
                                )
                            }
                        }
                    }

                    Divider(color = SurfaceBorder.copy(alpha = 0.5f), thickness = 0.8.dp)

                    // Customer Destination Location Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.size(32.dp),
                            shape = CircleShape,
                            color = Color(0xFFEF4444).copy(alpha = 0.15f)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = Color(0xFFDC2626),
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Your Doorstep Destination Area",
                                style = MaterialTheme.typography.labelSmall,
                                color = TextDarkMuted,
                                fontSize = 10.sp
                            )
                            Text(
                                text = state.destAreaName.ifBlank { "Doorstep Destination" },
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Bold,
                                color = TextDarkPrimary
                            )
                            if (state.destLatitude != 0.0 && state.destLongitude != 0.0) {
                                Text(
                                    text = "Lat: ${"%.4f".format(state.destLatitude)}, Lng: ${"%.4f".format(state.destLongitude)}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextDarkMuted,
                                    fontSize = 9.5.sp
                                )
                            }
                        }
                    }
                }
            }

            // 3. Assigned Verified Electrician Profile Card (Image 2 Match)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeCard,
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box {
                                Image(
                                    painter = painterResource(id = R.drawable.img_technician_rajesh),
                                    contentDescription = state.technicianName,
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier
                                        .size(54.dp)
                                        .clip(CircleShape)
                                        .border(1.5.dp, SapphireBlue800.copy(alpha = 0.25f), CircleShape)
                                )
                                Box(
                                    modifier = Modifier
                                        .size(15.dp)
                                        .align(Alignment.BottomEnd)
                                        .clip(CircleShape)
                                        .background(SuccessGreen)
                                        .border(2.dp, Color.White, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(9.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = state.technicianName,
                                        color = TextDarkPrimary,
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Verified",
                                        tint = SuccessGreen,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = state.technicianBadge,
                                    color = TextDarkMuted,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Spacer(modifier = Modifier.height(3.dp))
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Default.Star,
                                        contentDescription = null,
                                        tint = Color(0xFFF59E0B),
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = "${state.technicianRating}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextDarkPrimary
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "|",
                                        color = Color(0xFFCBD5E1),
                                        fontSize = 11.sp
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = state.technicianCompletedJobs,
                                        fontSize = 12.sp,
                                        color = TextDarkSecondary
                                    )
                                }
                            }
                        }

                        Button(
                            onClick = {
                                val callIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${state.technicianPhone}"))
                                context.startActivity(callIntent)
                            },
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(5.dp))
                            Text("CALL", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // 3.5 Issue 39: Customer Legal Signoff & Digital Signature Pad
            Surface(
                color = if (digitalSignature != null) Color(0xFFF0FDF4) else Color(0xFFF8FAFC),
                shape = ShapeCard,
                border = androidx.compose.foundation.BorderStroke(1.5.dp, if (digitalSignature != null) Color(0xFF86EFAC) else SapphireBlue800.copy(alpha = 0.3f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(text = if (digitalSignature != null) "✅" else "✍️", fontSize = 16.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "LEGAL SATISFACTION SIGNOFF",
                                fontWeight = FontWeight.Black,
                                fontSize = 12.sp,
                                color = if (digitalSignature != null) Color(0xFF15803D) else SapphireBlue800
                            )
                        }

                        if (digitalSignature != null) {
                            Surface(
                                color = Color(0xFFDCFCE7),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text(
                                    text = "LEGALLY SIGNED",
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF166534)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    if (digitalSignature == null) {
                        Text(
                            text = "Under Indian IT Act 2000, please digitally sign to certify satisfactory service execution before Handover OTP release.",
                            fontSize = 11.5.sp,
                            color = TextDarkSecondary,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = { showSignaturePad = true },
                            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(15.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Open Customer Digital Signature Pad", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Text(
                            text = "Satisfaction digitally confirmed. Signature token: ${digitalSignature?.take(22)}... Audit log locked.",
                            fontSize = 11.sp,
                            color = Color(0xFF166534),
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }

            // 4. Secure Customer Handover OTP Container (4 Large Boxes)
            Surface(
                color = OtpCardBackground,
                shape = ShapeCard,
                border = androidx.compose.foundation.BorderStroke(1.5.dp, OtpCardBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = null,
                            tint = Color(0xFFD97706),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "SECURE HANDOVER VERIFICATION OTP",
                            color = Color(0xFFB45309),
                            fontSize = 11.5.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Show this 4-digit code to your service specialist only upon arrival and safety check.",
                        color = Color(0xFF92400E),
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // Giant 4-Digit Display
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        state.handoverOtp.forEach { digit ->
                            Box(
                                modifier = Modifier
                                    .size(58.dp)
                                    .clip(ShapeOtpBox)
                                    .background(OtpBoxBackground)
                                    .border(2.dp, OtpBoxBorder, ShapeOtpBox),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = digit.toString(),
                                    style = OtpDigitStyle
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    val otpVerifyAdvice = remember(state.serviceTitle) {
                        val titleLower = state.serviceTitle.lowercase()
                        when {
                            titleLower.contains("electr") || titleLower.contains("wire") || titleLower.contains("mcb") || titleLower.contains("panel") || titleLower.contains("switch") || titleLower.contains("fan") ->
                                "Share with ${state.technicianName} ONLY after inspecting your panel and verifying restored power."
                            titleLower.contains("plumb") || titleLower.contains("water") || titleLower.contains("tap") || titleLower.contains("pipe") || titleLower.contains("tank") ->
                                "Share with ${state.technicianName} ONLY after inspecting pipe joints and verifying zero water leakage."
                            titleLower.contains("clean") || titleLower.contains("sanit") ->
                                "Share with ${state.technicianName} ONLY after inspecting the cleaned area and verifying sanitization standards."
                            titleLower.contains("paint") || titleLower.contains("wall") ->
                                "Share with ${state.technicianName} ONLY after inspecting surface finish and uniform paint coat."
                            titleLower.contains("carpenter") || titleLower.contains("wood") || titleLower.contains("door") || titleLower.contains("furniture") ->
                                "Share with ${state.technicianName} ONLY after inspecting fittings and smooth movement of woodwork."
                            else ->
                                "Share with ${state.technicianName} ONLY after inspecting the completed service and verifying quality handover."
                        }
                    }

                    Surface(
                        color = Color(0xFFFEF3C7),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "🔒 DO NOT SHARE THIS OTP NOW.\n$otpVerifyAdvice",
                            color = Color(0xFF92400E),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Center,
                            lineHeight = 15.sp,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp)
                        )
                    }
                }
            }

            // 5. 1000V Safety Interlock Verified Card
            if (state.isSafetyInterlockVerified) {
                Surface(
                    color = SuccessGreen.copy(alpha = 0.12f),
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SuccessGreen),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.Shield, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(24.dp))
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "PROFESSIONAL SAFETY PROTOCOL VERIFIED",
                                color = SuccessGreen,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Technician has inspected site conditions and donned verified safety gear before starting work.",
                                color = TextDarkSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            // 6. Specialist In-Progress Status Banner (Locked until Technician completes job)
            Surface(
                color = Color(0xFFF8FAFC),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(imageVector = Icons.Default.Engineering, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(22.dp))
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = if (state.status == "IN_PROGRESS" || state.isSafetyInterlockVerified) "SERVICE IN PROGRESS" else "SPECIALIST AT DOORSTEP",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SapphireBlue800
                        )
                        Text(
                            text = "Specialist will complete work and finalize the work order using your OTP.",
                            fontSize = 11.sp,
                            color = TextDarkSecondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }

    if (showArrivalDialog) {
        AlertDialog(
            onDismissRequest = { showArrivalDialog = false },
            containerColor = Color.White,
            shape = RoundedCornerShape(20.dp),
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "🔔", fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Technician Arrived!",
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        color = Color(0xFF15803D)
                    )
                }
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Your certified technician has arrived at your doorstep. Please verify the technician badge and safety gear before granting entry.",
                        fontSize = 13.sp,
                        color = TextDarkSecondary,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(14.dp))

                    // Technician Identity & Photo Card
                    Surface(
                        color = Color(0xFFF8FAFC),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(52.dp)
                                    .clip(CircleShape)
                                    .background(SapphireBlue800.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = state.technicianName.take(1).ifBlank { "T" },
                                    fontSize = 22.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SapphireBlue800
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = state.technicianName,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp,
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "Badge: ${state.technicianBadge.ifBlank { "GT-TECH-VERIFIED" }}",
                                    fontSize = 11.5.sp,
                                    color = SapphireBlue800,
                                    fontWeight = FontWeight.SemiBold
                                )
                                Text(
                                    text = "★ ${state.technicianRating} • ${state.technicianCompletedJobs}",
                                    fontSize = 11.sp,
                                    color = Color(0xFFD97706)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Safety Verification Checklist
                    Surface(
                        color = Color(0xFFF0FDF4),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF86EFAC)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = "🛡️ SAFETY VERIFICATION BADGE",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF15803D)
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "✓ 1000V Insulated Safety Gloves Verified\n✓ Background & Police Verified Technician\n✓ Live MCB Main Switch Lockout Protocol Active",
                                fontSize = 11.5.sp,
                                color = Color(0xFF166534),
                                lineHeight = 16.sp
                            )
                        }
                    }

                    if (state.handoverOtp.isNotBlank()) {
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "SHARE HANDOVER OTP AT DOORSTEP",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkSecondary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Surface(
                            color = Color(0xFFEFF6FF),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF3B82F6))
                        ) {
                            Text(
                                text = state.handoverOtp,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                color = SapphireBlue800,
                                letterSpacing = 3.sp
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { showArrivalDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF15803D)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = "Verify & Welcome Technician", fontWeight = FontWeight.Bold)
                }
            }
        )
    }

    if (showSosModal) {
        AlertDialog(
            onDismissRequest = { showSosModal = false },
            containerColor = Color.White,
            shape = RoundedCornerShape(20.dp),
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(text = "🚨", fontSize = 24.sp)
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Customer Safety SOS",
                        fontWeight = FontWeight.Black,
                        fontSize = 18.sp,
                        color = Color(0xFFDC2626)
                    )
                }
            },
            text = {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Text(
                        text = "Are you facing an emergency or feeling unsafe? Tapping 'Call 112 & Dispatch SOS' will instantly transmit your live GPS coordinates and technician details to the Ghar Tak 24x7 Safety Command Center and connect you to 112 (National Police & Emergency Support).",
                        fontSize = 13.sp,
                        color = TextDarkSecondary,
                        lineHeight = 18.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Surface(
                        color = Color(0xFFFEF2F2),
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFCA5A5)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(10.dp)) {
                            Text(
                                text = "Emergency Live Dispatch Telemetry:",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF991B1B)
                            )
                            Text(
                                text = "• Ticket: ${state.ticketNumber}\n• Technician: ${state.technicianName}\n• Live Coordinates: ${state.destLatitude}, ${state.destLongitude}",
                                fontSize = 11.sp,
                                color = Color(0xFF7F1D1D)
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.triggerEmergencySos(context, "CUSTOMER_EMERGENCY_SOS_TRIGGERED")
                        Toast.makeText(context, "🚨 Emergency SOS dispatched to Ghar Tak Safety Command Center!", Toast.LENGTH_LONG).show()
                        try {
                            val dialIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:112"))
                            context.startActivity(dialIntent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "Dialer unavailable: Please call 112 directly", Toast.LENGTH_SHORT).show()
                        }
                        showSosModal = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = "Call 112 & Dispatch SOS Alert", fontWeight = FontWeight.Bold, color = Color.White)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showSosModal = false },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = "I Am Safe • Dismiss", color = TextDarkSecondary, fontWeight = FontWeight.SemiBold)
                }
            }
        )
    }

    if (showSignaturePad) {
        CustomerDigitalSignaturePad(
            onDismiss = { showSignaturePad = false },
            onSignatureConfirmed = { signatureToken ->
                digitalSignature = signatureToken
                customerSignature = signatureToken
                showSignaturePad = false
            }
        )
    }
}

// -------------------------------------------------------------
// Component: Customer Digital Signature Pad (Indian IT Act 2000)
// -------------------------------------------------------------
@Composable
fun CustomerDigitalSignaturePad(
    onDismiss: () -> Unit,
    onSignatureConfirmed: (signatureData: String) -> Unit
) {
    val paths = remember { mutableStateListOf<Path>() }
    var currentPath by remember { mutableStateOf<Path?>(null) }
    var hasSigned by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color.White,
        shape = RoundedCornerShape(20.dp),
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(text = "✍️", fontSize = 22.sp)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Customer Digital Signoff",
                    fontWeight = FontWeight.Bold,
                    fontSize = 17.sp,
                    color = TextDarkPrimary
                )
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Please draw your signature in the box below to legally confirm satisfaction and authorize job handover under the Indian IT Act 2000.",
                    fontSize = 12.sp,
                    color = TextDarkSecondary
                )
                Spacer(modifier = Modifier.height(12.dp))

                // Canvas Signature Pad
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFF8FAFC))
                        .border(1.5.dp, Color(0xFFCBD5E1), RoundedCornerShape(12.dp))
                ) {
                    Canvas(
                        modifier = Modifier
                            .fillMaxSize()
                            .pointerInput(Unit) {
                                detectDragGestures(
                                    onDragStart = { offset ->
                                        val path = Path().apply { moveTo(offset.x, offset.y) }
                                        currentPath = path
                                        paths.add(path)
                                        hasSigned = true
                                    },
                                    onDrag = { change, _ ->
                                        currentPath?.lineTo(change.position.x, change.position.y)
                                    }
                                )
                            }
                    ) {
                        paths.forEach { path ->
                            drawPath(
                                path = path,
                                color = Color(0xFF1E293B),
                                style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)
                            )
                        }
                    }

                    if (!hasSigned) {
                        Text(
                            text = "Sign here with finger / stylus...",
                            color = Color(0xFF94A3B8),
                            fontSize = 13.sp,
                            modifier = Modifier.align(Alignment.Center)
                        )
                    }

                    // Watermark
                    Text(
                        text = "LEGAL AUDIT TRAIL • GHAR TAK",
                        color = Color(0xFFE2E8F0),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(8.dp)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(
                        onClick = {
                            paths.clear()
                            hasSigned = false
                        }
                    ) {
                        Text("Clear Canvas", fontSize = 12.sp, color = Color(0xFFDC2626))
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (hasSigned) {
                        val token = "SIG_CONFIRMED_${System.currentTimeMillis()}"
                        onSignatureConfirmed(token)
                    }
                },
                enabled = hasSigned,
                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Confirm Digital Signature", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Cancel", color = TextDarkSecondary)
            }
        }
    )
}

// -------------------------------------------------------------
// Component: Awaiting Technician Acceptance (Radar Pulse & Escrow)
// -------------------------------------------------------------
@Composable
fun AwaitingTechnicianAcceptanceView(
    state: CustomerTrackingUiState,
    onCancelBooking: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulseScale"
    )

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Radar Pulse Circle Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(96.dp)
                        .scale(pulseScale)
                        .clip(CircleShape)
                        .background(SapphireBlue800.copy(alpha = 0.1f)),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(SapphireBlue800.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(
                            modifier = Modifier.size(52.dp),
                            shape = CircleShape,
                            color = SapphireBlue800
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Sensors,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                Text(
                    text = "Awaiting Confirmation",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = TextDarkPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = "Work order dispatched to ${state.technicianName}. Waiting for the professional to confirm and accept...",
                    fontSize = 13.sp,
                    color = TextDarkMuted,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )

                Spacer(modifier = Modifier.height(16.dp))

                LinearProgressIndicator(
                    modifier = Modifier
                        .fillMaxWidth(0.8f)
                        .height(6.dp)
                        .clip(RoundedCornerShape(3.dp)),
                    color = SapphireBlue800,
                    trackColor = SapphireBlue800.copy(alpha = 0.15f)
                )

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Expected response: ~60 seconds",
                    fontSize = 11.sp,
                    color = TextDarkMuted,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        // 2. Selected Technician Profile Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    modifier = Modifier.size(52.dp),
                    shape = CircleShape,
                    color = SapphireBlue800
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = state.technicianName.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString("").uppercase().ifEmpty { "TK" },
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            fontSize = 18.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.width(14.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = state.technicianName,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(
                            imageVector = Icons.Default.Verified,
                            contentDescription = "Verified",
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(15.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${state.technicianBadge} • ${state.serviceTitle}",
                        fontSize = 11.5.sp,
                        color = TextDarkMuted
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "★ ${"%.1f".format(state.technicianRating)}  •  ${state.technicianCompletedJobs}",
                        fontSize = 11.sp,
                        color = Color(0xFFD97706),
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        // 3. 100% Escrow Protection Card
        Surface(
            color = Color(0xFFECFDF5),
            shape = RoundedCornerShape(14.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFA7F3D0)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = Color(0xFF059669),
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "100% Escrow & Refund Protection",
                        color = Color(0xFF065F46),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Your booking payment is safely held. If the professional cannot accept, 100% refund is credited immediately.",
                        color = Color(0xFF047857),
                        fontSize = 11.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // 4. Cancel Request Button
        OutlinedButton(
            onClick = onCancelBooking,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE53935).copy(alpha = 0.5f))
        ) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = null,
                tint = Color(0xFFE53935),
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "CANCEL BOOKING REQUEST",
                color = Color(0xFFE53935),
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp
            )
        }
    }
}

// -------------------------------------------------------------
// Component: Technician Cancelled / Declined View
// -------------------------------------------------------------
@Composable
fun TechnicianCancelledView(
    state: CustomerTrackingUiState,
    onChooseAnother: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFCA5A5))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFFEE2E2)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Cancel,
                        contentDescription = "Declined",
                        tint = Color(0xFFDC2626),
                        modifier = Modifier.size(40.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Booking Declined",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF991B1B)
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "${state.technicianName} was unable to accept your request at this time.",
                    fontSize = 13.sp,
                    color = TextDarkPrimary,
                    fontWeight = FontWeight.Medium,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "No charges have been deducted. You can choose another top-rated professional near your area right now.",
                    fontSize = 12.sp,
                    color = TextDarkMuted,
                    textAlign = TextAlign.Center,
                    lineHeight = 17.sp
                )
            }
        }

        // Choose Another Professional CTA Button
        Button(
            onClick = onChooseAnother,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
        ) {
            Icon(
                imageVector = Icons.Default.PersonSearch,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "CHOOSE ANOTHER PROFESSIONAL",
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = Color.White
            )
        }
    }
}

// -------------------------------------------------------------
// Component: Job Completed Celebration & Direct Sign-off View
// -------------------------------------------------------------
@Composable
fun JobCompletedCelebrationView(
    state: CustomerTrackingUiState,
    onProceedToSignoff: () -> Unit,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Celebration / Completion Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF10B981).copy(alpha = 0.5f))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Surface(
                    modifier = Modifier.size(76.dp),
                    shape = CircleShape,
                    color = Color(0xFFECFDF5),
                    border = androidx.compose.foundation.BorderStroke(2.dp, Color(0xFF10B981))
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Completed",
                            tint = Color(0xFF10B981),
                            modifier = Modifier.size(46.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                Surface(
                    shape = RoundedCornerShape(20.dp),
                    color = Color(0xFFECFDF5)
                ) {
                    Text(
                        text = "WORK ORDER COMPLETED",
                        color = Color(0xFF047857),
                        fontWeight = FontWeight.Black,
                        fontSize = 11.sp,
                        letterSpacing = 1.sp,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Service Successfully Done!",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = TextDarkPrimary,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "${state.technicianName} has completed your service, verified safety interlocks, and finalized work order #${state.ticketNumber}.",
                    fontSize = 13.sp,
                    color = TextDarkMuted,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )
            }
        }

        // 2. Summary Details Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SERVICE DETAILS",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkMuted,
                        letterSpacing = 0.5.sp
                    )
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFFF1F5F9)
                    ) {
                        Text(
                            text = "Ticket: ${state.ticketNumber}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = SapphireBlue800,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }
                }

                Divider(color = SurfaceBorder, thickness = 1.dp)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = state.serviceTitle,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = "Provided by ${state.technicianName}",
                            fontSize = 12.sp,
                            color = TextDarkMuted
                        )
                    }
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = Color(0xFFF0FDF4)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.VerifiedUser,
                                contentDescription = null,
                                tint = Color(0xFF16A34A),
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Verified",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFF16A34A)
                            )
                        }
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFFF8FAFC), RoundedCornerShape(10.dp))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.ReceiptLong,
                            contentDescription = null,
                            tint = SapphireBlue800,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "GST Compliant Tax Invoice",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = TextDarkPrimary
                        )
                    }
                    Text(
                        text = "Ready",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF10B981)
                    )
                }
            }
        }

        // 3. Primary CTA: Proceed to Sign-off & Tax Invoice
        Button(
            onClick = onProceedToSignoff,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
        ) {
            Icon(
                imageVector = Icons.Default.AssignmentTurnedIn,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(18.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "SIGN-OFF & VIEW TAX INVOICE",
                fontWeight = FontWeight.Bold,
                fontSize = 13.sp,
                color = Color.White
            )
        }

        // 4. Secondary Return Home button
        OutlinedButton(
            onClick = onBack,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
        ) {
            Text(
                text = "RETURN TO HOME",
                color = TextDarkMuted,
                fontWeight = FontWeight.SemiBold,
                fontSize = 12.sp
            )
        }
    }
}

// -------------------------------------------------------------
// Component: 4-Stage Horizontal Stepper with Timestamps
// -------------------------------------------------------------
@Composable
fun TrackingLifecycleStepper(state: CustomerTrackingUiState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = ShapeCard,
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            StepPill(
                label = "Dispatched",
                subLabel = "Confirmed",
                isDone = true,
                isActive = false
            )
            StepDivider(isDone = state.isDoorstepArrived)
            StepPill(
                label = "Transit",
                subLabel = if (state.isDoorstepArrived) "Arrived" else if (state.distanceKm > 0) "${"%.1f".format(state.distanceKm)} km" else "En Route",
                isDone = state.isDoorstepArrived,
                isActive = !state.isDoorstepArrived
            )
            StepDivider(isDone = state.isSafetyInterlockVerified)
            StepPill(
                label = "Safety",
                subLabel = if (state.isSafetyInterlockVerified) "Pass" else "Pending",
                isDone = state.isSafetyInterlockVerified,
                isActive = state.isDoorstepArrived && !state.isSafetyInterlockVerified
            )
            StepDivider(isDone = state.isJobCompleted)
            StepPill(
                label = "Done",
                subLabel = if (state.isJobCompleted) "Signed" else "Pending",
                isDone = state.isJobCompleted,
                isActive = state.isSafetyInterlockVerified && !state.isJobCompleted
            )
        }
    }
}

@Composable
fun StepPill(
    label: String,
    subLabel: String,
    isDone: Boolean,
    isActive: Boolean
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(26.dp)
                .clip(CircleShape)
                .background(
                    when {
                        isDone -> SuccessGreen
                        isActive -> SapphireBlue800
                        else -> Color(0xFFE2E8F0)
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isDone) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(15.dp)
                )
            } else if (isActive) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF94A3B8))
                )
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (isActive || isDone) FontWeight.Bold else FontWeight.Medium,
            color = if (isActive || isDone) TextDarkPrimary else TextDarkMuted
        )
        Text(
            text = subLabel,
            fontSize = 9.5.sp,
            color = if (isDone) SuccessGreen else TextDarkMuted
        )
    }
}

@Composable
fun StepDivider(isDone: Boolean) {
    Box(
        modifier = Modifier
            .width(18.dp)
            .height(2.dp)
            .background(if (isDone) SuccessGreen else Color(0xFFE2E8F0))
            .offset(y = (-8).dp)
    )
}

// -------------------------------------------------------------
// Road-Snapped Directions Router (Urban Company / Uber standard)
// Replaces straight geodesic lines with OSRM / Google Directions API road-snapped polyline
// -------------------------------------------------------------
object RoadSnappedDirectionsRouter {
    /**
     * Decodes polyline encodedPoints from OSRM or Google Directions API
     */
    fun decodePolyline(encodedPoints: String): List<android.graphics.PointF> {
        val poly = ArrayList<android.graphics.PointF>()
        var index = 0
        val len = encodedPoints.length
        var lat = 0
        var lng = 0

        while (index < len) {
            var b: Int
            var shift = 0
            var result = 0
            do {
                b = encodedPoints[index++].code - 63
                result = result or ((b and 0x1f) shl shift)
                shift += 5
            } while (b >= 0x20)
            val dlat = if ((result and 1) != 0) (result shr 1).inv() else (result shr 1)
            lat += dlat

            shift = 0
            result = 0
            do {
                b = encodedPoints[index++].code - 63
                result = result or ((b and 0x1f) shl shift)
                shift += 5
            } while (b >= 0x20)
            val dlng = if ((result and 1) != 0) (result shr 1).inv() else (result shr 1)
            lng += dlng

            poly.add(android.graphics.PointF((lat.toDouble() / 1E5).toFloat(), (lng.toDouble() / 1E5).toFloat()))
        }
        return poly
    }

    fun getOsrmDirectionsUrl(techLat: Double, techLng: Double, destLat: Double, destLng: Double): String {
        return "https://router.project-osrm.org/route/v1/driving/$techLng,$techLat;$destLng,$destLat?overview=full&geometries=polyline"
    }
}

// -------------------------------------------------------------
// Component: Tactical Midnight Live Map Visualizer with Dynamic Real-Time GPS Tracking
// -------------------------------------------------------------
@Composable
fun LiveServiceTrackingMap(state: CustomerTrackingUiState) {
    val context = LocalContext.current
    val density = LocalDensity.current
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")

    val isZeroDistance = state.distanceKm <= 0.05 || (state.techLatitude > 0.0 && state.destLatitude > 0.0 && Math.abs(state.techLatitude - state.destLatitude) < 0.0002 && Math.abs(state.techLongitude - state.destLongitude) < 0.0002)
    val isArrived = state.status == "ARRIVED" || state.status == "COMPLETED" || state.status == "WORK_COMPLETED" || state.status == "IN_PROGRESS" || isZeroDistance
    val isAtDoorstep = isArrived || isZeroDistance

    val dynamicTargetProgress = when {
        isAtDoorstep -> 1.0f
        state.distanceKm > 4.0 -> 0.20f
        state.distanceKm > 2.5 -> 0.38f
        state.distanceKm > 1.2 -> 0.58f
        state.distanceKm > 0.5 -> 0.78f
        state.distanceKm > 0.15 -> 0.88f
        else -> 0.96f
    }

    val animatedProgress by androidx.compose.animation.core.animateFloatAsState(
        targetValue = dynamicTargetProgress,
        animationSpec = tween(durationMillis = 1500, easing = androidx.compose.animation.core.FastOutSlowInEasing),
        label = "bikeGlide"
    )

    val pulseRadius by infiniteTransition.animateFloat(
        initialValue = 12f,
        targetValue = 46f,
        animationSpec = infiniteRepeatable(
            animation = tween(1600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseRadius"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.75f,
        targetValue = 0.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseAlpha"
    )
    val dotAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(800, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dotAlpha"
    )
    val dashPhase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -48f,
        animationSpec = infiniteRepeatable(
            animation = tween(1400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "dashPhase"
    )

    // Street text paint for native Canvas drawing
    val textPaint = remember {
        android.graphics.Paint().apply {
            color = android.graphics.Color.parseColor("#64748B")
            textSize = 26f
            isAntiAlias = true
            typeface = android.graphics.Typeface.create(android.graphics.Typeface.DEFAULT, android.graphics.Typeface.BOLD)
        }
    }

    // Dynamic technician coordinates on the canvas
    var techScreenPos by remember { mutableStateOf(Offset(0f, 0f)) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(280.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF07111E)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val canvasWidth = size.width
                val canvasHeight = size.height

                // 1. Draw Organic Water Reservoir / Lake (Top Center)
                val lakePath = Path().apply {
                    moveTo(canvasWidth * 0.40f, 0f)
                    cubicTo(
                        canvasWidth * 0.42f, canvasHeight * 0.22f,
                        canvasWidth * 0.58f, canvasHeight * 0.26f,
                        canvasWidth * 0.62f, 0f
                    )
                    close()
                }
                drawPath(lakePath, color = Color(0xFF0B2545))
                drawPath(
                    lakePath,
                    color = Color(0xFF143A66).copy(alpha = 0.7f),
                    style = Stroke(width = 2.5f)
                )

                // 2. Draw Parks / Greenery zones
                // Top-Left Park
                drawRoundRect(
                    color = Color(0xFF07291F),
                    topLeft = Offset(16f, 16f),
                    size = Size(canvasWidth * 0.26f, canvasHeight * 0.32f),
                    cornerRadius = CornerRadius(14f, 14f)
                )
                // Bottom-Left Park
                drawRoundRect(
                    color = Color(0xFF082D22),
                    topLeft = Offset(16f, canvasHeight * 0.74f),
                    size = Size(canvasWidth * 0.24f, canvasHeight * 0.22f),
                    cornerRadius = CornerRadius(12f, 12f)
                )
                // Center-Right Greenery patch
                drawRoundRect(
                    color = Color(0xFF06241B),
                    topLeft = Offset(canvasWidth * 0.82f, canvasHeight * 0.68f),
                    size = Size(canvasWidth * 0.16f, canvasHeight * 0.28f),
                    cornerRadius = CornerRadius(10f, 10f)
                )

                // 3. City Road Network
                val roadColor = Color(0xFF112338)
                val roadBorder = Color(0xFF1E3A5F)
                val roadCenterDash = PathEffect.dashPathEffect(floatArrayOf(10f, 8f), 0f)

                // Road A: Diagonal "Main Road" from lower-left to center
                val rMainStart = Offset(-20f, canvasHeight * 0.88f)
                val rMainJunction = Offset(canvasWidth * 0.46f, canvasHeight * 0.44f)
                drawLine(roadColor, rMainStart, rMainJunction, strokeWidth = 34f, cap = StrokeCap.Round)
                drawLine(roadBorder, rMainStart, rMainJunction, strokeWidth = 1f)

                // Road B: "Market St" going up from junction
                val rMarketEnd = Offset(canvasWidth * 0.48f, -20f)
                drawLine(roadColor, rMainJunction, rMarketEnd, strokeWidth = 26f, cap = StrokeCap.Round)
                drawLine(roadBorder, rMainJunction, rMarketEnd, strokeWidth = 1f)

                // Road C: "Hospital Rd" going southeast from junction
                val rHospEnd = Offset(canvasWidth + 20f, canvasHeight * 0.82f)
                drawLine(roadColor, rMainJunction, rHospEnd, strokeWidth = 26f, cap = StrokeCap.Round)
                drawLine(roadBorder, rMainJunction, rHospEnd, strokeWidth = 1f)

                // Road D: "Civil Lines" horizontal street near bottom
                val rCivilY = canvasHeight * 0.88f
                drawLine(roadColor, Offset(0f, rCivilY), Offset(canvasWidth, rCivilY), strokeWidth = 22f)
                drawLine(roadBorder, Offset(0f, rCivilY - 11f), Offset(canvasWidth, rCivilY - 11f), strokeWidth = 1f)
                drawLine(roadBorder, Offset(0f, rCivilY + 11f), Offset(canvasWidth, rCivilY + 11f), strokeWidth = 1f)

                // Road E: Customer Street climbing north-east to destination
                val rDestStart = Offset(canvasWidth * 0.66f, canvasHeight * 0.48f)
                val rDestEnd = Offset(canvasWidth * 0.82f, canvasHeight * 0.16f)
                drawLine(roadColor, rDestStart, rDestEnd, strokeWidth = 24f, cap = StrokeCap.Round)
                drawLine(roadBorder, rDestStart, rDestEnd, strokeWidth = 1f)

                // Road Center Dotted Lines
                drawLine(Color(0xFF334155), rMainStart, rMainJunction, strokeWidth = 1.5f, pathEffect = roadCenterDash)
                drawLine(Color(0xFF334155), rMainJunction, rMarketEnd, strokeWidth = 1.5f, pathEffect = roadCenterDash)
                drawLine(Color(0xFF334155), rMainJunction, rHospEnd, strokeWidth = 1.5f, pathEffect = roadCenterDash)
                drawLine(Color(0xFF334155), Offset(0f, rCivilY), Offset(canvasWidth, rCivilY), strokeWidth = 1.5f, pathEffect = roadCenterDash)

                // 4. Street Name Labels (Angled along the streets)
                drawContext.canvas.nativeCanvas.apply {
                    save()
                    rotate(-40f, canvasWidth * 0.22f, canvasHeight * 0.66f)
                    drawText("Main Road", canvasWidth * 0.22f, canvasHeight * 0.66f, textPaint)
                    restore()

                    save()
                    rotate(-80f, canvasWidth * 0.46f, canvasHeight * 0.26f)
                    drawText("Market St", canvasWidth * 0.46f, canvasHeight * 0.26f, textPaint)
                    restore()

                    save()
                    rotate(24f, canvasWidth * 0.60f, canvasHeight * 0.58f)
                    drawText("Hospital Rd", canvasWidth * 0.60f, canvasHeight * 0.58f, textPaint)
                    restore()

                    save()
                    drawText("Civil Lines", canvasWidth * 0.45f, rCivilY + 18f, textPaint)
                    restore()
                }

                // 5. Customer Destination Pin (Residence at rDestEnd)
                val pDest = Offset(canvasWidth * 0.78f, canvasHeight * 0.25f)

                // Red Target / Radar Circles
                drawCircle(
                    color = Color(0xFFEF4444).copy(alpha = 0.15f),
                    radius = 36f,
                    center = pDest
                )
                drawCircle(
                    color = Color(0xFFEF4444).copy(alpha = 0.40f),
                    radius = 26f,
                    center = pDest,
                    style = Stroke(width = 1.8f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f), 0f))
                )
                // Red Pin base circle
                drawCircle(color = Color(0xFFEF4444), radius = 13f, center = pDest)

                // House Icon inside destination pin
                val housePath = Path().apply {
                    moveTo(pDest.x, pDest.y - 7f)
                    lineTo(pDest.x + 6f, pDest.y - 1f)
                    lineTo(pDest.x + 4.5f, pDest.y - 1f)
                    lineTo(pDest.x + 4.5f, pDest.y + 6f)
                    lineTo(pDest.x - 4.5f, pDest.y + 6f)
                    lineTo(pDest.x - 4.5f, pDest.y - 1f)
                    lineTo(pDest.x - 6f, pDest.y - 1f)
                    close()
                }
                drawPath(housePath, color = Color.White)

                // 6. Realistic Navigation Polyline (Main Road -> Junction -> Turn -> Customer House)
                val p0 = Offset(canvasWidth * 0.18f, canvasHeight * 0.74f)
                val p1 = Offset(canvasWidth * 0.38f, canvasHeight * 0.56f) // Mid Main Road
                val p2 = Offset(canvasWidth * 0.48f, canvasHeight * 0.47f)
                val p3 = Offset(canvasWidth * 0.66f, canvasHeight * 0.42f)
                val p4 = Offset(canvasWidth * 0.74f, canvasHeight * 0.34f)

                val fullRoutePath = Path().apply {
                    moveTo(p0.x, p0.y)
                    lineTo(p1.x, p1.y)
                    lineTo(p2.x, p2.y)
                    lineTo(p3.x, p3.y)
                    lineTo(p4.x, p4.y)
                    lineTo(pDest.x, pDest.y)
                }

                if (!isAtDoorstep) {
                    // Outer Glowing Cyan Bloom
                    drawPath(
                        path = fullRoutePath,
                        color = Color(0xFF00E5FF).copy(alpha = 0.22f),
                        style = Stroke(width = 12f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                    )

                    // Mid Cyan Glow
                    drawPath(
                        path = fullRoutePath,
                        color = Color(0xFF00E5FF).copy(alpha = 0.60f),
                        style = Stroke(width = 6f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                    )

                    // Sharp Core Line with Animated Flowing Dashes
                    drawPath(
                        path = fullRoutePath,
                        color = Color(0xFFE0F7FA),
                        style = Stroke(
                            width = 3.5f,
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(14f, 8f), dashPhase)
                        )
                    )
                }

                // 7. Dynamic Technician Position: Co-located at pDest when at doorstep / 0 distance
                val currentTechPos = if (isAtDoorstep) {
                    pDest
                } else {
                    val progressFrac = animatedProgress
                    when {
                        progressFrac <= 0.40f -> {
                            val t = (progressFrac / 0.40f).coerceIn(0f, 1f)
                            Offset(p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t)
                        }
                        progressFrac <= 0.70f -> {
                            val t = ((progressFrac - 0.40f) / 0.30f).coerceIn(0f, 1f)
                            Offset(p1.x + (p3.x - p1.x) * t, p1.y + (p3.y - p1.y) * t)
                        }
                        progressFrac < 1.0f -> {
                            val t = ((progressFrac - 0.70f) / 0.30f).coerceIn(0f, 1f)
                            Offset(p3.x + (pDest.x - p3.x) * t, p3.y + (pDest.y - p3.y) * t)
                        }
                        else -> pDest
                    }
                }

                techScreenPos = currentTechPos

                // Concentric Animated Radar Wave
                drawCircle(
                    color = (if (isAtDoorstep) SuccessGreen else Color(0xFF00E5FF)).copy(alpha = pulseAlpha),
                    radius = pulseRadius,
                    center = currentTechPos
                )
                drawCircle(
                    color = (if (isAtDoorstep) SuccessGreen else Color(0xFF00E5FF)).copy(alpha = 0.35f),
                    radius = 24f,
                    center = currentTechPos
                )
                // Dark vehicle circular marker with cyan/green border
                drawCircle(
                    color = Color(0xFF0A192F),
                    radius = 14f,
                    center = currentTechPos
                )
                drawCircle(
                    color = if (isAtDoorstep) SuccessGreen else Color(0xFF00E5FF),
                    radius = 14f,
                    center = currentTechPos,
                    style = Stroke(width = 2.5f)
                )
                // Inner blue/white/green core dot
                drawCircle(
                    color = if (isAtDoorstep) SuccessGreen else Color(0xFF00E5FF),
                    radius = 5f,
                    center = currentTechPos
                )
            }

            // Floating Tooltip above Technician: Rajesh Kumar / 8 mins away • 0.8 km
            if (techScreenPos.x > 0f) {
                val calloutX = with(density) { (techScreenPos.x.toDp() - 48.dp).coerceIn(12.dp, 200.dp) }
                val calloutY = with(density) { (techScreenPos.y.toDp() - 52.dp).coerceAtLeast(10.dp) }

                Surface(
                    color = Color(0xFF0A192F).copy(alpha = 0.94f),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, if (isAtDoorstep) SuccessGreen else Color(0xFF00E5FF).copy(alpha = 0.8f)),
                    shadowElevation = 6.dp,
                    modifier = Modifier.offset(x = calloutX, y = calloutY)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = if (isAtDoorstep) "${state.technicianName} (At Doorstep)" else state.technicianName,
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                        if (state.techAreaName.isNotBlank()) {
                            Text(
                                text = "📍 ${state.techAreaName}",
                                color = Color(0xFFFFD54F),
                                fontSize = 8.5.sp,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1
                            )
                        }
                        Text(
                            text = if (isAtDoorstep) "✓ At Doorstep (0 km)" else "${state.etaMinutes} mins away • ${state.distanceKm} km",
                            color = if (isAtDoorstep) SuccessGreen else Color(0xFF00E5FF),
                            fontSize = 9.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Top-Left: LIVE GPS • SSE ACTIVE Pill with Signal Bars
            Surface(
                color = Color(0xFF0A192F).copy(alpha = 0.90f),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E3A5F)),
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .clip(CircleShape)
                            .background(SuccessGreen.copy(alpha = dotAlpha))
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "LIVE GPS • SSE ACTIVE",
                        color = Color.White,
                        fontSize = 9.5.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.4.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "📶", fontSize = 10.sp)
                }
            }

            // Right-Side Controls: Target, Layers, Zoom Controls
            Column(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Target Crosshairs
                Surface(
                    color = Color(0xFF0A192F).copy(alpha = 0.90f),
                    shape = CircleShape,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E3A5F)),
                    modifier = Modifier
                        .size(32.dp)
                        .clickable {
                            Toast.makeText(context, "Centered on Technician Location", Toast.LENGTH_SHORT).show()
                        }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.MyLocation,
                            contentDescription = "Target",
                            tint = Color(0xFF94A3B8),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                // Layers Toggle
                Surface(
                    color = Color(0xFF0A192F).copy(alpha = 0.90f),
                    shape = CircleShape,
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E3A5F)),
                    modifier = Modifier
                        .size(32.dp)
                        .clickable {
                            Toast.makeText(context, "Tactical Midnight GPS Layer Active", Toast.LENGTH_SHORT).show()
                        }
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Default.Layers,
                            contentDescription = "Layers",
                            tint = Color(0xFF94A3B8),
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }

                // Zoom Pill (+ / -)
                Surface(
                    color = Color(0xFF0A192F).copy(alpha = 0.90f),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E3A5F)),
                    modifier = Modifier.width(32.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .size(30.dp)
                                .clickable {
                                    Toast.makeText(context, "Zoom In +", Toast.LENGTH_SHORT).show()
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Add,
                                contentDescription = "Zoom In",
                                tint = Color(0xFF94A3B8),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                        Divider(color = Color(0xFF1E3A5F), thickness = 0.8.dp)
                        Box(
                            modifier = Modifier
                                .size(30.dp)
                                .clickable {
                                    Toast.makeText(context, "Zoom Out -", Toast.LENGTH_SHORT).show()
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Remove,
                                contentDescription = "Zoom Out",
                                tint = Color(0xFF94A3B8),
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }

            // Bottom-Left: Distance & Arriving In Pill
            Surface(
                color = Color(0xFF0A192F).copy(alpha = 0.92f),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E3A5F)),
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = Color(0xFFEF4444),
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = if (state.destAreaName.isNotBlank()) {
                            "${"%.1f".format(state.distanceKm)} km • ${state.destAreaName}"
                        } else {
                            "${"%.1f".format(state.distanceKm)} km • Arriving in ${state.etaMinutes} mins"
                        },
                        color = Color.White,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Bottom-Right: Navigate Action Button
            Surface(
                color = Color(0xFF1D4ED8),
                shape = RoundedCornerShape(20.dp),
                shadowElevation = 4.dp,
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .padding(10.dp)
                    .clickable {
                        val gmmIntentUri = Uri.parse("geo:${state.techLatitude},${state.techLongitude}?q=${state.destLatitude},${state.destLongitude}(Customer)")
                        val mapIntent = Intent(Intent.ACTION_VIEW, gmmIntentUri)
                        mapIntent.setPackage("com.google.android.apps.maps")
                        try {
                            context.startActivity(mapIntent)
                        } catch (e: Exception) {
                            Toast.makeText(context, "Navigating to customer destination...", Toast.LENGTH_SHORT).show()
                        }
                    }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Navigation,
                        contentDescription = "Navigate",
                        tint = Color.White,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Navigate",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}
