package com.ghartak.customer.ui.track

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
                        shape = RoundedCornerShape(6.dp),
                        modifier = Modifier.padding(end = 12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(6.dp)
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
                                    else -> WarningAmber
                                },
                                fontSize = 10.sp,
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
            // Lifecycle Progress Stepper
            TrackingLifecycleStepper(state)

            // Realistic Live Route Map Canvas with City Road Network, GPS Navigation & Animated Pulse
            LiveElectricianTrackingMap(state = state)

            // Assigned Electrician Profile Card
            val techInitials = remember(state.technicianName) {
                val parts = state.technicianName.trim().split(" ").filter { it.isNotEmpty() }
                when {
                    parts.size >= 2 -> "${parts[0].first().uppercaseChar()}${parts[1].first().uppercaseChar()}"
                    parts.isNotEmpty() -> parts[0].take(2).uppercase()
                    else -> "GT"
                }
            }

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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFE65100).copy(alpha = 0.15f))
                                    .border(1.5.dp, Color(0xFFE65100), CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = techInitials,
                                    color = Color(0xFFE65100),
                                    fontWeight = FontWeight.Black,
                                    fontSize = 16.sp
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = state.technicianName,
                                        color = TextDarkPrimary,
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Icon(imageVector = Icons.Default.Verified, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(16.dp))
                                }
                                Text(
                                    text = "${state.technicianBadge} • ${state.technicianRating} ★ (${state.technicianCompletedJobs})",
                                    color = TextDarkMuted,
                                    fontSize = 12.sp
                                )
                            }
                        }

                        Button(
                            onClick = {
                                val callIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${state.technicianPhone}"))
                                context.startActivity(callIntent)
                            },
                            shape = RoundedCornerShape(8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("CALL", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Secure Customer Handover OTP Box
            Surface(
                color = WarningAmber.copy(alpha = 0.1f),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, WarningAmber),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = Icons.Default.Lock, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "SECURE HANDOVER VERIFICATION OTP",
                            color = Color(0xFFB78103),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    // Giant 4-Digit Display
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        state.handoverOtp.forEach { digit ->
                            Box(
                                modifier = Modifier
                                    .size(54.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.White)
                                    .border(1.5.dp, WarningAmber, RoundedCornerShape(12.dp)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = digit.toString(),
                                    color = TextDarkPrimary,
                                    fontSize = 28.sp,
                                    fontWeight = FontWeight.Black
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "🔒 DO NOT SHARE THIS OTP NOW.\nShare with ${state.technicianName} ONLY after inspecting your panel and verifying restored power.",
                        color = TextDarkSecondary,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 15.sp
                    )
                }
            }

            // 1000V Safety Interlock Verified Card
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

            // Staging Demo Action Buttons
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

            // Bottom Sign-off CTA Button
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

@Composable
fun TrackingLifecycleStepper(state: CustomerTrackingUiState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            StepPill(label = "Dispatched", isDone = true, isActive = false)
            Divider(modifier = Modifier.width(20.dp), color = SapphireBlue800)
            StepPill(label = "Transit", isDone = state.isDoorstepArrived, isActive = !state.isDoorstepArrived)
            Divider(modifier = Modifier.width(20.dp), color = if (state.isDoorstepArrived) SapphireBlue800 else SurfaceBorder)
            StepPill(label = "Safety", isDone = state.isSafetyInterlockVerified, isActive = state.isDoorstepArrived && !state.isSafetyInterlockVerified)
            Divider(modifier = Modifier.width(20.dp), color = if (state.isSafetyInterlockVerified) SapphireBlue800 else SurfaceBorder)
            StepPill(label = "Done", isDone = state.isJobCompleted, isActive = state.isSafetyInterlockVerified && !state.isJobCompleted)
        }
    }
}

@Composable
fun StepPill(label: String, isDone: Boolean, isActive: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(24.dp)
                .clip(CircleShape)
                .background(
                    when {
                        isDone -> SuccessGreen
                        isActive -> SapphireBlue800
                        else -> SurfaceBorder
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isDone) {
                Icon(imageVector = Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
            } else {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                )
            }
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = if (isActive || isDone) FontWeight.Bold else FontWeight.Normal,
            color = if (isActive || isDone) TextDarkPrimary else TextDarkMuted
        )
    }
}

@Composable
fun LiveElectricianTrackingMap(state: CustomerTrackingUiState) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseRadius by infiniteTransition.animateFloat(
        initialValue = 10f,
        targetValue = 38f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseRadius"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.7f,
        targetValue = 0.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = LinearEasing),
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

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(235.dp),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val canvasWidth = size.width
                val canvasHeight = size.height

                // 1. Draw Realistic City Map Background Elements
                // Park 1 (Top Left)
                drawRoundRect(
                    color = Color(0xFF064E3B).copy(alpha = 0.4f),
                    topLeft = Offset(24f, 18f),
                    size = Size(100f, 60f),
                    cornerRadius = CornerRadius(10f, 10f)
                )
                // Commercial Block (Bottom Left)
                drawRoundRect(
                    color = Color(0xFF1E293B),
                    topLeft = Offset(24f, canvasHeight - 75f),
                    size = Size(80f, 50f),
                    cornerRadius = CornerRadius(8f, 8f)
                )
                // Park 2 (Bottom Center)
                drawRoundRect(
                    color = Color(0xFF064E3B).copy(alpha = 0.35f),
                    topLeft = Offset(canvasWidth * 0.44f, canvasHeight - 70f),
                    size = Size(110f, 48f),
                    cornerRadius = CornerRadius(8f, 8f)
                )
                // Residential Block (Top Center)
                drawRoundRect(
                    color = Color(0xFF1E293B),
                    topLeft = Offset(canvasWidth * 0.44f, 18f),
                    size = Size(canvasWidth * 0.28f, 55f),
                    cornerRadius = CornerRadius(8f, 8f)
                )

                // 2. City Road Network
                val roadColor = Color(0xFF1E293B)
                val roadEdgeColor = Color(0xFF334155).copy(alpha = 0.6f)

                // Major Avenue 1 (Colaba Causeway - Upper Horizontal)
                val road1Y = canvasHeight * 0.30f
                drawRect(
                    color = roadColor,
                    topLeft = Offset(0f, road1Y - 14f),
                    size = Size(canvasWidth, 28f)
                )
                drawLine(roadEdgeColor, Offset(0f, road1Y - 14f), Offset(canvasWidth, road1Y - 14f), 1f)
                drawLine(roadEdgeColor, Offset(0f, road1Y + 14f), Offset(canvasWidth, road1Y + 14f), 1f)

                // Major Avenue 2 (Lower Horizontal)
                val road2Y = canvasHeight * 0.74f
                drawRect(
                    color = roadColor,
                    topLeft = Offset(0f, road2Y - 14f),
                    size = Size(canvasWidth, 28f)
                )
                drawLine(roadEdgeColor, Offset(0f, road2Y - 14f), Offset(canvasWidth, road2Y - 14f), 1f)
                drawLine(roadEdgeColor, Offset(0f, road2Y + 14f), Offset(canvasWidth, road2Y + 14f), 1f)

                // Vertical Avenue 1 (MG Road)
                val road1X = canvasWidth * 0.36f
                drawRect(
                    color = roadColor,
                    topLeft = Offset(road1X - 14f, 0f),
                    size = Size(28f, canvasHeight)
                )
                drawLine(roadEdgeColor, Offset(road1X - 14f, 0f), Offset(road1X - 14f, canvasHeight), 1f)
                drawLine(roadEdgeColor, Offset(road1X + 14f, 0f), Offset(road1X + 14f, canvasHeight), 1f)

                // Vertical Cross Street 2 (Near Destination)
                val road2X = canvasWidth * 0.82f
                drawRect(
                    color = roadColor,
                    topLeft = Offset(road2X - 12f, 0f),
                    size = Size(24f, canvasHeight)
                )
                drawLine(roadEdgeColor, Offset(road2X - 12f, 0f), Offset(road2X - 12f, canvasHeight), 1f)
                drawLine(roadEdgeColor, Offset(road2X + 12f, 0f), Offset(road2X + 12f, canvasHeight), 1f)

                // Dashed Road Dividers
                val dashEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 10f), 0f)
                drawLine(Color(0xFF475569), Offset(0f, road1Y), Offset(canvasWidth, road1Y), 1.5f, pathEffect = dashEffect)
                drawLine(Color(0xFF475569), Offset(0f, road2Y), Offset(canvasWidth, road2Y), 1.5f, pathEffect = dashEffect)
                drawLine(Color(0xFF475569), Offset(road1X, 0f), Offset(road1X, canvasHeight), 1.5f, pathEffect = dashEffect)
                drawLine(Color(0xFF475569), Offset(road2X, 0f), Offset(road2X, canvasHeight), 1.5f, pathEffect = dashEffect)

                // 3. Multi-Segment Realistic Navigation Polyline
                val p0 = Offset(canvasWidth * 0.12f, road2Y) // Origin Dispatch Hub
                val p1 = Offset(road1X, road2Y)               // Turn at MG Road
                val p2 = Offset(road1X, road1Y)               // Turn at Colaba Causeway
                val p3 = Offset(road2X, road1Y)               // Turn towards Residence
                val p4 = Offset(road2X, canvasHeight * 0.22f) // Customer Doorstep

                val fullPath = Path().apply {
                    moveTo(p0.x, p0.y)
                    lineTo(p1.x, p1.y)
                    lineTo(p2.x, p2.y)
                    lineTo(p3.x, p3.y)
                    lineTo(p4.x, p4.y)
                }

                // Route Outer Glow
                drawPath(
                    path = fullPath,
                    color = Color(0xFF0284C7).copy(alpha = 0.35f),
                    style = Stroke(width = 10f, cap = StrokeCap.Round, join = StrokeJoin.Round)
                )

                val isArrived = state.transitStep >= 3 || state.status == "ARRIVED" || state.status == "COMPLETED"
                val progressFrac = when (state.transitStep) {
                    0 -> 0.05f
                    1 -> 0.40f
                    2 -> 0.75f
                    else -> 1.0f
                }

                // Vibrant Route Path
                drawPath(
                    path = fullPath,
                    color = if (isArrived) SuccessGreen else ElectricCyan,
                    style = Stroke(
                        width = 4.5f,
                        cap = StrokeCap.Round,
                        join = StrokeJoin.Round,
                        pathEffect = if (!isArrived) PathEffect.dashPathEffect(floatArrayOf(16f, 10f), 0f) else null
                    )
                )

                // 4. Customer Doorstep Home Destination Pin at p4
                // 50m Geofence circle
                drawCircle(
                    color = SuccessGreen.copy(alpha = 0.18f),
                    radius = 36f,
                    center = p4
                )
                drawCircle(
                    color = SuccessGreen.copy(alpha = 0.8f),
                    radius = 36f,
                    center = p4,
                    style = Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f), 0f))
                )
                drawCircle(color = SuccessGreen, radius = 11f, center = p4)
                drawCircle(color = Color.White, radius = 5f, center = p4)

                // 5. Technician Live Marker
                val techPos = when {
                    progressFrac <= 0.25f -> {
                        val t = progressFrac / 0.25f
                        Offset(p0.x + (p1.x - p0.x) * t, p0.y)
                    }
                    progressFrac <= 0.65f -> {
                        val t = (progressFrac - 0.25f) / 0.40f
                        Offset(p1.x, p1.y + (p2.y - p1.y) * t)
                    }
                    progressFrac < 1.0f -> {
                        val t = (progressFrac - 0.65f) / 0.35f
                        Offset(p2.x + (p3.x - p2.x) * t, p2.y)
                    }
                    else -> p4
                }

                // Pulsing Radar Waves
                drawCircle(
                    color = (if (isArrived) SuccessGreen else Color(0xFFF97316)).copy(alpha = pulseAlpha),
                    radius = pulseRadius,
                    center = techPos
                )
                drawCircle(
                    color = if (isArrived) SuccessGreen else Color(0xFFF97316),
                    radius = 13f,
                    center = techPos
                )
                drawCircle(
                    color = Color.White,
                    radius = 5f,
                    center = techPos
                )
            }

            // Floating Top-Left: Live GPS Status Pill
            Surface(
                color = Color(0xFF0F172A).copy(alpha = 0.88f),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155)),
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
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 0.5.sp
                    )
                }
            }

            // Floating Top-Right: Re-center target button
            Surface(
                color = Color(0xFF0F172A).copy(alpha = 0.88f),
                shape = CircleShape,
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155)),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(10.dp)
                    .size(32.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.MyLocation,
                        contentDescription = "My Location",
                        tint = ElectricCyan,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            // Floating Bottom Overlay: Live Status & Route ETA Banner
            Surface(
                color = Color(0xFF0F172A).copy(alpha = 0.92f),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155)),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(10.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = if (state.transitStep >= 3 || state.status == "ARRIVED") Icons.Default.CheckCircle else Icons.Default.Navigation,
                            contentDescription = null,
                            tint = if (state.transitStep >= 3 || state.status == "ARRIVED") SuccessGreen else ElectricCyan,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = if (state.transitStep >= 3 || state.status == "ARRIVED")
                                    "Electrician at Doorstep"
                                else
                                    "${state.technicianName} En Route",
                                color = Color.White,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = if (state.transitStep >= 3 || state.status == "ARRIVED")
                                    "Safety interlock check in progress"
                                else
                                    "Traveling via Main Road • ${"%.1f".format(state.distanceKm)} km away",
                                color = Color(0xFF94A3B8),
                                fontSize = 10.sp
                            )
                        }
                    }

                    Surface(
                        color = if (state.transitStep >= 3 || state.status == "ARRIVED") SuccessGreen.copy(alpha = 0.2f) else SapphireBlue800,
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text(
                            text = if (state.transitStep >= 3 || state.status == "ARRIVED") "0 MINS" else "${state.etaMinutes} MINS",
                            color = if (state.transitStep >= 3 || state.status == "ARRIVED") SuccessGreen else Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Black,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }
            }
        }
    }
}
