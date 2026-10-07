package com.ghartak.technician.ui.nav

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
import com.ghartak.technician.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NavigationScreen(
    jobId: String,
    viewModel: NavigationViewModel,
    onBack: () -> Unit,
    onProceedToSafety: (jobId: String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(jobId) {
        viewModel.startForegroundService(context)
    }

    DisposableEffect(Unit) {
        onDispose {
            viewModel.stopForegroundService(context)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "DOORSTEP GPS TRANSIT",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Ticket: ${state.ticketNumber} • 50m Geofence Active",
                            fontSize = 11.sp,
                            color = FlameOrange
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = TextPrimary
                        )
                    }
                },
                actions = {
                    Surface(
                        color = if (state.hasArrivedDoorstep) SafetyGreenMuted else SlateDark700,
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
                                    .background(if (state.hasArrivedDoorstep) SafetyGreen else FlameOrange)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = if (state.hasArrivedDoorstep) "ARRIVED" else "EN ROUTE",
                                color = if (state.hasArrivedDoorstep) SafetyGreen else FlameOrangeLight,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SlateDark900)
            )
        },
        containerColor = SlateDark900
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Turn-by-Turn Maneuver Header Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = androidx.compose.foundation.BorderStroke(1.5.dp, FlameOrange.copy(alpha = 0.5f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(FlameOrange.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (state.hasArrivedDoorstep) Icons.Default.CheckCircle else Icons.Default.Navigation,
                                contentDescription = null,
                                tint = if (state.hasArrivedDoorstep) SafetyGreen else FlameOrange,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(14.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = state.currentManeuver,
                                color = TextPrimary,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = state.nextManeuver,
                                color = TextSecondary,
                                fontSize = 12.sp
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    Divider(color = SurfaceBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(14.dp))

                    // Transit Metrics Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        MetricBlock(
                            label = "DISTANCE",
                            value = if (state.distanceRemainingKm < 0.1) "${(state.distanceRemainingKm * 1000).toInt()} m" else "${state.distanceRemainingKm} km",
                            color = FlameOrangeLight
                        )
                        MetricBlock(
                            label = "ESTIMATED ETA",
                            value = "${state.etaMinutes} mins",
                            color = SafetyGreen
                        )
                        MetricBlock(
                            label = "SPEED",
                            value = "${state.speedKmh.toInt()} km/h",
                            color = TextPrimary
                        )
                        MetricBlock(
                            label = "GEOFENCE",
                            value = "50m Active",
                            color = SafetyBlue
                        )
                    }
                }
            }

            // Stylized Transit Route Vector Canvas
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SlateDark800),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    // Vector Route Line Canvas
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val canvasWidth = size.width
                        val canvasHeight = size.height

                        // Draw Grid Lines (Map illusion)
                        val gridPaint = Color(0xFF21262D)
                        for (x in 0..canvasWidth.toInt() step 60) {
                            drawLine(gridPaint, Offset(x.toFloat(), 0f), Offset(x.toFloat(), canvasHeight), strokeWidth = 1f)
                        }
                        for (y in 0..canvasHeight.toInt() step 60) {
                            drawLine(gridPaint, Offset(0f, y.toFloat()), Offset(canvasWidth, y.toFloat()), strokeWidth = 1f)
                        }

                        // Path from Technician to Customer
                        val startX = 60f + (canvasWidth - 140f) * (state.transitStep / 3f)
                        val startY = canvasHeight - 50f - (canvasHeight - 100f) * (state.transitStep / 3f)
                        val endX = canvasWidth - 70f
                        val endY = 50f

                        // Dotted remaining route
                        drawLine(
                            color = FlameOrange.copy(alpha = 0.5f),
                            start = Offset(startX, startY),
                            end = Offset(endX, endY),
                            strokeWidth = 6f,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(15f, 15f), 0f)
                        )

                        // 50m Geofence Radius Circle around Customer Destination
                        drawCircle(
                            color = SafetyGreen.copy(alpha = 0.15f),
                            radius = 45f,
                            center = Offset(endX, endY)
                        )
                        drawCircle(
                            color = SafetyGreen,
                            radius = 45f,
                            center = Offset(endX, endY),
                            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 8f), 0f))
                        )

                        // Customer Marker Pin
                        drawCircle(color = SafetyGreen, radius = 12f, center = Offset(endX, endY))

                        // Moving Technician Marker Pin
                        drawCircle(color = FlameOrange, radius = 14f, center = Offset(startX, startY))
                        drawCircle(color = Color.White, radius = 6f, center = Offset(startX, startY))
                    }

                    // Canvas Legend Overlays
                    Row(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(FlameOrange)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Rajesh (Scooter)", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(16.dp))
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(SafetyGreen)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Customer Destination (50m)", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Customer Contact & Action Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardBackground),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "CUSTOMER DOORSTEP DETAILS",
                        color = FlameOrange,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = state.customerName,
                        color = TextPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = state.customerAddress,
                        color = TextMuted,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // Call Customer
                        Button(
                            onClick = {
                                val callIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${state.customerPhone}"))
                                context.startActivity(callIntent)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SlateDark700)
                        ) {
                            Icon(imageVector = Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp), tint = SafetyGreen)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("CALL", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        }

                        // Open External Google Maps
                        Button(
                            onClick = {
                                val mapUri = Uri.parse("geo:${state.customerLat},${state.customerLng}?q=${state.customerLat},${state.customerLng}(${state.customerName})")
                                val mapIntent = Intent(Intent.ACTION_VIEW, mapUri)
                                context.startActivity(mapIntent)
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SlateDark700)
                        ) {
                            Icon(imageVector = Icons.Default.Map, contentDescription = null, modifier = Modifier.size(16.dp), tint = FlameOrange)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("MAPS APP", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        }
                    }
                }
            }

            // Staging Demo: Simulated Transit Movement
            Surface(
                color = SlateDark800,
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "TRANSIT SIMULATOR (STAGING / DEMO)",
                                color = FlameOrange,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Moves GPS closer & sends real telemetry pings to backend",
                                color = TextMuted,
                                fontSize = 10.sp
                            )
                        }

                        if (state.isPinging) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = FlameOrange, strokeWidth = 2.dp)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = { viewModel.advanceTransitStep(context) },
                            enabled = !state.hasArrivedDoorstep,
                            modifier = Modifier.weight(1.5f),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, FlameOrange),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = FlameOrange)
                        ) {
                            Icon(imageVector = Icons.Default.DirectionsRun, contentDescription = null, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("ADVANCE STEP (${state.transitStep}/3)", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }

                        OutlinedButton(
                            onClick = { viewModel.manualConfirmDoorstep(context) },
                            enabled = !state.hasArrivedDoorstep,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SafetyGreen),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = SafetyGreen)
                        ) {
                            Text("1-TAP ARRIVED", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Doorstep 50m Geofence Arrival Banner
            AnimatedVisibility(visible = state.hasArrivedDoorstep) {
                Surface(
                    color = SafetyGreenMuted.copy(alpha = 0.25f),
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, SafetyGreen),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = SafetyGreen,
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "DOORSTEP REACHED (WITHIN 50m GEOFENCE)",
                                color = SafetyGreen,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = "Customer and Regional Hub MH-01 have been notified of your arrival. Next: verify 1000V high-voltage safety interlock before opening consumer unit.",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            textAlign = TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = { onProceedToSafety(state.jobId) },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SafetyGreen),
                            modifier = Modifier.fillMaxWidth().height(48.dp)
                        ) {
                            Icon(imageVector = Icons.Default.Shield, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("PROCEED TO 1000V SAFETY INTERLOCK", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 12.sp)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

@Composable
fun MetricBlock(label: String, value: String, color: Color) {
    Column {
        Text(text = label, color = TextMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = value, color = color, fontSize = 13.sp, fontWeight = FontWeight.Black)
    }
}
