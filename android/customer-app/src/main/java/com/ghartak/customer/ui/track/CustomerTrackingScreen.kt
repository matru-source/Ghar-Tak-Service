package com.ghartak.customer.ui.track

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
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

            // Vector Live Route Map Canvas
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(210.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = NavyDark900),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val canvasWidth = size.width
                        val canvasHeight = size.height

                        // Grid map pattern
                        val gridPaint = Color(0xFF1B2A4A)
                        for (x in 0..canvasWidth.toInt() step 50) {
                            drawLine(gridPaint, Offset(x.toFloat(), 0f), Offset(x.toFloat(), canvasHeight), strokeWidth = 1f)
                        }
                        for (y in 0..canvasHeight.toInt() step 50) {
                            drawLine(gridPaint, Offset(0f, y.toFloat()), Offset(canvasWidth, y.toFloat()), strokeWidth = 1f)
                        }

                        // Path from Technician to Customer
                        val startX = 60f + (canvasWidth - 140f) * (state.transitStep / 3f)
                        val startY = canvasHeight - 50f - (canvasHeight - 100f) * (state.transitStep / 3f)
                        val endX = canvasWidth - 70f
                        val endY = 50f

                        // Polyline route
                        drawLine(
                            color = ElectricCyan,
                            start = Offset(startX, startY),
                            end = Offset(endX, endY),
                            strokeWidth = 6f,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(15f, 15f), 0f)
                        )

                        // 50m Geofence around customer house
                        drawCircle(
                            color = SuccessGreen.copy(alpha = 0.2f),
                            radius = 45f,
                            center = Offset(endX, endY)
                        )
                        drawCircle(
                            color = SuccessGreen,
                            radius = 45f,
                            center = Offset(endX, endY),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f), 0f))
                        )

                        // Customer Pin
                        drawCircle(color = SuccessGreen, radius = 12f, center = Offset(endX, endY))

                        // Moving Technician Pin
                        drawCircle(color = Color(0xFFE65100), radius = 14f, center = Offset(startX, startY))
                        drawCircle(color = Color.White, radius = 6f, center = Offset(startX, startY))
                    }

                    // Floating Distance & ETA Overlay Pill
                    Surface(
                        color = Color.Black.copy(alpha = 0.75f),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.Navigation, contentDescription = null, tint = ElectricCyan, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (state.distanceKm < 0.1) "30m AWAY • AT DOORSTEP" else "${state.distanceKm} km away • ETA ${state.etaMinutes} mins",
                                color = Color.White,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Assigned Electrician Profile Card
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
                                    text = "RK",
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
                                    text = "${state.technicianBadge} • ${state.technicianRating} ★ (48 Completed)",
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
                        text = "🔒 DO NOT SHARE THIS OTP NOW.\nShare with Rajesh Kumar ONLY after inspecting your panel and verifying restored power.",
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
