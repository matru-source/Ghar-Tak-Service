package com.ghartak.technician.ui.nav

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
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
import androidx.core.content.ContextCompat
import com.ghartak.technician.ui.theme.*

fun launchTurnByTurnNavigation(context: Context, lat: Double, lng: Double, customerName: String, address: String) {
    try {
        // 1. Direct Turn-by-Turn Driving Navigation in Google Maps
        val navUri = Uri.parse("google.navigation:q=$lat,$lng&mode=d")
        val navIntent = Intent(Intent.ACTION_VIEW, navUri).apply {
            setPackage("com.google.android.apps.maps")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(navIntent)
    } catch (e: Exception) {
        try {
            // 2. Generic Geo intent
            val geoUri = Uri.parse("geo:$lat,$lng?q=$lat,$lng(${Uri.encode(customerName)})")
            val geoIntent = Intent(Intent.ACTION_VIEW, geoUri).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(geoIntent)
        } catch (e2: Exception) {
            try {
                // 3. Fallback Web Google Maps
                val webUri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=$lat,$lng")
                val webIntent = Intent(Intent.ACTION_VIEW, webUri).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(webIntent)
            } catch (e3: Exception) {
                Toast.makeText(context, "No map navigation app installed.", Toast.LENGTH_SHORT).show()
            }
        }
    }
}

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

    // Safe permission launcher to prevent Android 14 SecurityException crash
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            viewModel.startForegroundService(context)
        }
    }

    LaunchedEffect(jobId) {
        val hasFine = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        if (hasFine) {
            viewModel.startForegroundService(context)
        } else {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
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
                            text = "Ticket: ${state.ticketNumber} â€¢ 50m Geofence Active",
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
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(44.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(FlameOrange.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = if (state.hasArrivedDoorstep) Icons.Default.CheckCircle else Icons.Default.Navigation,
                                contentDescription = null,
                                tint = if (state.hasArrivedDoorstep) SafetyGreen else FlameOrange,
                                modifier = Modifier.size(24.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (state.hasArrivedDoorstep) "ARRIVED AT DOORSTEP" else state.currentManeuver,
                                color = TextPrimary,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            if (!state.hasArrivedDoorstep) {
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = state.nextManeuver,
                                    color = TextMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    // Transit Metrics HUD
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(SlateDark800)
                            .padding(horizontal = 14.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        MetricBlock(
                            label = "DISTANCE",
                            value = "${"%.2f".format(state.distanceRemainingKm)} km",
                            color = if (state.hasArrivedDoorstep) SafetyGreen else TextPrimary
                        )

                        Divider(
                            color = SurfaceBorder,
                            modifier = Modifier
                                .height(26.dp)
                                .width(1.dp)
                        )

                        MetricBlock(
                            label = "EST. TIME",
                            value = if (state.hasArrivedDoorstep) "Now" else "${state.etaMinutes} mins",
                            color = FlameOrange
                        )

                        Divider(
                            color = SurfaceBorder,
                            modifier = Modifier
                                .height(26.dp)
                                .width(1.dp)
                        )

                        MetricBlock(
                            label = "SPEED",
                            value = "${"%.0f".format(state.speedKmh)} km/h",
                            color = TextPrimary
                        )
                    }
                }
            }

            // High-Tech Transit Radar Canvas
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SlateDark950),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val canvasWidth = size.width
                        val canvasHeight = size.height

                        // Grid lines
                        for (i in 1..4) {
                            drawLine(
                                color = SlateDark700.copy(alpha = 0.35f),
                                start = Offset(0f, canvasHeight * (i / 5f)),
                                end = Offset(canvasWidth, canvasHeight * (i / 5f)),
                                strokeWidth = 1f
                            )
                            drawLine(
                                color = SlateDark700.copy(alpha = 0.35f),
                                start = Offset(canvasWidth * (i / 5f), 0f),
                                end = Offset(canvasWidth * (i / 5f), canvasHeight),
                                strokeWidth = 1f
                            )
                        }

                        // Transit Route Curve
                        val startX = canvasWidth * 0.18f + (canvasWidth * 0.60f * (state.transitStep / 3f))
                        val startY = canvasHeight * 0.78f - (canvasHeight * 0.55f * (state.transitStep / 3f))

                        val endX = canvasWidth * 0.82f
                        val endY = canvasHeight * 0.22f

                        // Route Vector Line
                        drawLine(
                            color = FlameOrange,
                            start = Offset(startX, startY),
                            end = Offset(endX, endY),
                            strokeWidth = 4f,
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(14f, 10f), 0f)
                        )

                        // Customer Geofence Circle (50m pulse)
                        drawCircle(
                            color = SafetyGreen.copy(alpha = 0.18f),
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
                        Text(text = "Electrician", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(16.dp))
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(SafetyGreen)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(text = "Customer Doorstep (50m)", color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Customer Contact & Navigation Card
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
                                try {
                                    val callIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${state.customerPhone}")).apply {
                                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    }
                                    context.startActivity(callIntent)
                                } catch (e: Exception) {
                                    Toast.makeText(context, "Could not open dialer", Toast.LENGTH_SHORT).show()
                                }
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SlateDark700)
                        ) {
                            Icon(imageVector = Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp), tint = SafetyGreen)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("CALL", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                        }

                        // Open Google Maps Turn-by-Turn Navigation
                        Button(
                            onClick = {
                                launchTurnByTurnNavigation(
                                    context = context,
                                    lat = state.customerLat,
                                    lng = state.customerLng,
                                    customerName = state.customerName,
                                    address = state.customerAddress
                                )
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ActionNavigateBlue)
                        ) {
                            Icon(imageVector = Icons.Default.Directions, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("MAPS TURN-BY-TURN", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }

            // Transit Movement Simulator (Safe step progression)
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
                                text = "DOORSTEP GPS TRANSIT SIMULATOR",
                                color = FlameOrange,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Updates GPS coordinates & broadcasts telemetry to customer",
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
                            text = "Customer has been notified of your arrival. Next: confirm 1000V high-voltage safety interlock before opening consumer unit.",
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