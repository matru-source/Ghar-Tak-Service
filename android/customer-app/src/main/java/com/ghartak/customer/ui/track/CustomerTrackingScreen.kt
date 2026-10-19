package com.ghartak.customer.ui.track

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
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

    LaunchedEffect(jobId) {
        viewModel.initTracking(jobId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "LIVE ELECTRICIAN TRACKING",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = "Ticket: ${state.ticketNumber} • Real-Time SSE",
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
                    Surface(
                        color = when (state.status) {
                            "ARRIVED" -> SuccessGreen.copy(alpha = 0.15f)
                            "IN_PROGRESS" -> SapphireBlue800.copy(alpha = 0.15f)
                            "COMPLETED" -> SuccessGreen.copy(alpha = 0.2f)
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
                                            else -> WarningAmber
                                        }
                                    )
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = when (state.status) {
                                    "ARRIVED" -> "AT DOORSTEP"
                                    "IN_PROGRESS" -> "REPAIRING"
                                    "COMPLETED" -> "COMPLETED"
                                    else -> "EN ROUTE"
                                },
                                color = when (state.status) {
                                    "ARRIVED", "COMPLETED" -> SuccessGreen
                                    "IN_PROGRESS" -> SapphireBlue800
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
            // 1. Lifecycle Progress Stepper (4-Stage with Timestamps)
            TrackingLifecycleStepper(state = state)

            // 2. Tactical Midnight Live Map Visualizer with City Grid & SSE Beacon
            LiveElectricianTrackingMap(state = state)

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
                                if (state.technicianName.contains("Rajesh", ignoreCase = true)) {
                                    Image(
                                        painter = painterResource(id = R.drawable.img_technician_rajesh),
                                        contentDescription = state.technicianName,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier
                                            .size(54.dp)
                                            .clip(CircleShape)
                                            .border(1.5.dp, SapphireBlue800.copy(alpha = 0.25f), CircleShape)
                                    )
                                } else {
                                    val initial = state.technicianName.trim().firstOrNull()?.toString()?.uppercase() ?: "T"
                                    Box(
                                        modifier = Modifier
                                            .size(54.dp)
                                            .clip(CircleShape)
                                            .background(
                                                androidx.compose.ui.graphics.Brush.linearGradient(
                                                    listOf(SapphireBlue800, Color(0xFF1D4ED8))
                                                )
                                            )
                                            .border(1.5.dp, Color.White, CircleShape),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = initial,
                                            color = Color.White,
                                            fontSize = 22.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
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
                        text = "Show this 4-digit code to your electrician only upon arrival and safety check.",
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

                    Surface(
                        color = Color(0xFFFEF3C7),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = "🔒 DO NOT SHARE THIS OTP NOW.\nShare with ${state.technicianName} ONLY after inspecting your panel and verifying restored power.",
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
                                text = "1000V VDE SAFETY INTERLOCK VERIFIED",
                                color = SuccessGreen,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Electrician has donned Class 0 insulated gloves and verified 0.0V busbar isolation before opening your circuit.",
                                color = TextDarkSecondary,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
            }

            // 6. Staging Demo Action Buttons
            Surface(
                color = SurfaceLight,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(text = "STAGING DEMO CONTROLS", color = TextDarkMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { viewModel.simulateStepCloser() },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("SIMULATE TRANSIT (${state.transitStep}/3)", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(
                            onClick = { viewModel.simulateSafetyVerified() },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("SIMULATE SAFETY PASS", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // 7. Bottom Sign-off CTA Button
            Button(
                onClick = { onProceedToSignoff(state.jobId) },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp)
            ) {
                Icon(imageVector = Icons.Default.ReceiptLong, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("WORK COMPLETE? VIEW TAX INVOICE & SIGNOFF", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 12.sp)
            }

            Spacer(modifier = Modifier.height(16.dp))
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
// Component: Tactical Midnight Live Map Visualizer with Glowing Cyan Route (Image 2 Match)
// -------------------------------------------------------------
@Composable
fun LiveElectricianTrackingMap(state: CustomerTrackingUiState) {
    val context = LocalContext.current
    val density = LocalDensity.current
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")

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

                val isArrived = state.transitStep >= 3 || state.status == "ARRIVED" || state.status == "COMPLETED" || state.status == "WORK_COMPLETED"

                // Sharp Core Line with Animated Flowing Dashes
                drawPath(
                    path = fullRoutePath,
                    color = if (isArrived) SuccessGreen else Color(0xFFE0F7FA),
                    style = Stroke(
                        width = 3.5f,
                        cap = StrokeCap.Round,
                        join = StrokeJoin.Round,
                        pathEffect = if (!isArrived) PathEffect.dashPathEffect(floatArrayOf(14f, 8f), dashPhase) else null
                    )
                )

                // 7. Dynamic Technician Position
                val progressFrac = when (state.transitStep) {
                    0 -> 0.35f
                    1 -> 0.60f
                    2 -> 0.85f
                    else -> 1.0f
                }

                val currentTechPos = when {
                    progressFrac <= 0.40f -> {
                        val t = progressFrac / 0.40f
                        Offset(p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t)
                    }
                    progressFrac <= 0.70f -> {
                        val t = (progressFrac - 0.40f) / 0.30f
                        Offset(p1.x + (p3.x - p1.x) * t, p1.y + (p3.y - p1.y) * t)
                    }
                    progressFrac < 1.0f -> {
                        val t = (progressFrac - 0.70f) / 0.30f
                        Offset(p3.x + (pDest.x - p3.x) * t, p3.y + (pDest.y - p3.y) * t)
                    }
                    else -> pDest
                }

                techScreenPos = currentTechPos

                // Concentric Animated Radar Wave
                drawCircle(
                    color = Color(0xFF00E5FF).copy(alpha = pulseAlpha),
                    radius = pulseRadius,
                    center = currentTechPos
                )
                drawCircle(
                    color = Color(0xFF00E5FF).copy(alpha = 0.35f),
                    radius = 24f,
                    center = currentTechPos
                )
                // Dark vehicle circular marker with cyan border
                drawCircle(
                    color = Color(0xFF0A192F),
                    radius = 12f,
                    center = currentTechPos
                )
                drawCircle(
                    color = Color(0xFF00E5FF),
                    radius = 12f,
                    center = currentTechPos,
                    style = Stroke(width = 2.5f)
                )
                // Inner blue/white core dot
                drawCircle(
                    color = Color(0xFF00E5FF),
                    radius = 4.5f,
                    center = currentTechPos
                )
            }

            // Floating Tooltip above Technician: Rajesh Kumar / 8 mins away
            if (techScreenPos.x > 0f) {
                val calloutX = with(density) { (techScreenPos.x.toDp() - 48.dp).coerceIn(12.dp, 200.dp) }
                val calloutY = with(density) { (techScreenPos.y.toDp() - 52.dp).coerceAtLeast(10.dp) }

                Surface(
                    color = Color(0xFF0A192F).copy(alpha = 0.94f),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF00E5FF).copy(alpha = 0.8f)),
                    shadowElevation = 6.dp,
                    modifier = Modifier.offset(x = calloutX, y = calloutY)
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = state.technicianName,
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
                            text = if (state.transitStep >= 3 || state.status == "ARRIVED") "At Doorstep" else "${state.etaMinutes} mins away",
                            color = Color(0xFF00E5FF),
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
