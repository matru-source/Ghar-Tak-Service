package com.ghartak.customer.ui.booking

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import com.ghartak.customer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddressBookingScreen(
    serviceId: String,
    viewModel: AddressBookingViewModel,
    onBack: () -> Unit,
    onProceedToPayment: (serviceId: String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val sessionManager = remember { com.ghartak.customer.data.session.SessionManager(context) }
    val hasActiveJob = remember { sessionManager.hasActiveJob() }
    var showActiveJobPrompt by remember { mutableStateOf(false) }
    val activeJobTicket = remember { sessionManager.getActiveJobTicketNumber().ifBlank { sessionManager.getActiveJobId().takeLast(6).uppercase() }.ifBlank { "J-1001" } }
    val formattedTicket = if (activeJobTicket.startsWith("#")) activeJobTicket else "#$activeJobTicket"

    var isUserLocationEnabled by remember {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
        mutableStateOf((hasFine || hasCoarse) && gps)
    }

    val customerPermLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { perms ->
        val granted = perms[Manifest.permission.ACCESS_FINE_LOCATION] == true || perms[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
        isUserLocationEnabled = granted && gps
        viewModel.updateLocationStatus(granted, gps)
        if (isUserLocationEnabled) {
            viewModel.detectCurrentLocation(context, isInitial = false)
        }
    }

    LaunchedEffect(Unit) {
        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
        val hasPerm = hasFine || hasCoarse
        isUserLocationEnabled = hasPerm && gps
        viewModel.updateLocationStatus(hasPerm, gps)
        if (hasPerm && gps) {
            viewModel.detectCurrentLocation(context, isInitial = true)
        } else if (!hasPerm) {
            // Automatically prompt for mandatory location permission on screen open
            customerPermLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                )
            )
        }
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
                val hasPerm = hasFine || hasCoarse
                isUserLocationEnabled = hasPerm && gps
                viewModel.updateLocationStatus(hasPerm, gps)
                if (hasPerm && gps && !state.isGpsActive) {
                    viewModel.detectCurrentLocation(context, isInitial = true)
                }
                viewModel.startLiveTelemetryPolling(context)
            } else if (event == Lifecycle.Event.ON_PAUSE) {
                viewModel.stopLiveTelemetryPolling()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
            viewModel.stopLiveTelemetryPolling()
        }
    }

    LaunchedEffect(serviceId) {
        viewModel.initService(serviceId)
    }

    // Auto-poll live technicians every 5s so when a technician toggles online, they appear automatically
    LaunchedEffect(state.pincode) {
        while (isActive) {
            delay(5000L)
            if (state.pincode.length == 6 && state.nearbyTechnicians.isEmpty()) {
                viewModel.loadLiveTechnicians(context, state.pincode, state.userLat, state.userLng)
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "ADDRESS & TIME SLOT",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = "Pincode Verification • Auto-Allocation",
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
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            Surface(
                color = Color.White,
                shadowElevation = 8.dp,
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = "TOTAL WITH 18% GST", color = TextDarkMuted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(
                            text = "₹${"%,.2f".format(state.totalPayableInr)}",
                            color = SapphireBlue900,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Black
                        )
                    }

                    Button(
                        onClick = {
                            if (hasActiveJob) {
                                showActiveJobPrompt = true
                            } else {
                                onProceedToPayment(state.serviceId)
                            }
                        },
                        enabled = state.canProceed && !hasActiveJob,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SapphireBlue800,
                            disabledContainerColor = SurfaceBorder
                        )
                    ) {
                        if (hasActiveJob) {
                            Text(text = "ACTIVE JOB IN PROGRESS ($formattedTicket)", fontWeight = FontWeight.Bold, color = TextDarkMuted, fontSize = 12.sp)
                        } else if (!state.isPincodeServiceable || (state.pincode.length == 6 && state.nearbyTechnicians.isEmpty() && !state.isLoadingTechnicians)) {
                            Text(text = "OUT OF SERVICE AREA (${state.pincode})", fontWeight = FontWeight.Bold, color = TextDarkMuted, fontSize = 12.sp)
                        } else {
                            Text(text = "CONTINUE TO PAYMENT", fontWeight = FontWeight.Bold, color = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        },
        containerColor = SurfaceLight
    ) { innerPadding ->
        if (showActiveJobPrompt) {
            AlertDialog(
                onDismissRequest = { showActiveJobPrompt = false },
                icon = {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = SapphireBlue800,
                        modifier = Modifier.size(36.dp)
                    )
                },
                title = {
                    Text(
                        text = "Active Job in Progress",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = TextDarkPrimary
                    )
                },
                text = {
                    Column {
                        Text(
                            text = "You have an active job in progress ($formattedTicket).",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Please wait for your current service to complete before booking a new one so your active live tracking and OTP are preserved.",
                            fontSize = 13.sp,
                            color = TextDarkMuted,
                            lineHeight = 18.sp
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            showActiveJobPrompt = false
                            onBack()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("WAIT FOR COMPLETION", fontWeight = FontWeight.Bold, color = Color.White)
                    }
                },
                dismissButton = {
                    OutlinedButton(
                        onClick = { showActiveJobPrompt = false },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("CLOSE", fontWeight = FontWeight.SemiBold, color = TextDarkSecondary)
                    }
                }
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            if (!isUserLocationEnabled) {
                Surface(
                    color = Color(0xFFFEF2F2),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, DangerRed.copy(alpha = 0.6f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.LocationOff,
                                contentDescription = null,
                                tint = DangerRed,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "GPS Location Access Required",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = DangerRed
                            )
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Active GPS is mandatory. Ghar Tak requires your real-time location to automatically detect your City and District, and assign the nearest certified technician.",
                            fontSize = 12.sp,
                            color = TextDarkSecondary,
                            lineHeight = 16.sp
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Button(
                            onClick = {
                                val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                                val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
                                if (!gps) {
                                    context.startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                                } else {
                                    customerPermLauncher.launch(
                                        arrayOf(
                                            Manifest.permission.ACCESS_FINE_LOCATION,
                                            Manifest.permission.ACCESS_COARSE_LOCATION
                                        )
                                    )
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = DangerRed),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                        ) {
                            Icon(imageVector = Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.size(16.dp), tint = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("ENABLE GPS & PERMIT LOCATION", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }
            }

            if (hasActiveJob) {
                Surface(
                    color = Color(0xFFFEF3C7),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = null,
                            tint = Color(0xFFD97706),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Active Job in Progress ($formattedTicket)",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.5.sp,
                                color = Color(0xFF92400E)
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "You have an active job in progress ($formattedTicket). Please wait for completion before placing another booking.",
                                fontSize = 12.sp,
                                color = Color(0xFFB45309),
                                lineHeight = 16.sp
                            )
                        }
                    }
                }
            }
            // Service Summary Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "SELECTED ELECTRICAL SERVICE",
                        color = SapphireBlue800,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = state.serviceTitle,
                        color = TextDarkPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = SurfaceBorder, thickness = 1.dp)
                    Spacer(modifier = Modifier.height(12.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Standard Service Quote:", color = TextDarkSecondary, fontSize = 12.sp)
                        Text(text = "₹${"%,.2f".format(state.basePriceInr)}", color = TextDarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "18% GST (CGST 9% + SGST 9%):", color = TextDarkSecondary, fontSize = 12.sp)
                        Text(text = "₹${"%,.2f".format(state.gst18PctInr)}", color = TextDarkPrimary, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Total Payable Amount:", color = SapphireBlue900, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Text(text = "₹${"%,.2f".format(state.totalPayableInr)}", color = SapphireBlue900, fontSize = 15.sp, fontWeight = FontWeight.Black)
                    }
                }
            }

            // Dispatch Urgency & Time Slot
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "DISPATCH TIME SLOT",
                        color = TextDarkPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Option 1: Emergency 15-Min Dispatch
                    Surface(
                        onClick = { viewModel.setBookingPriority("EMERGENCY_60S") },
                        color = if (state.bookingPriority == "EMERGENCY_60S") SapphireBlue800.copy(alpha = 0.08f) else SurfaceLight,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            1.5.dp,
                            if (state.bookingPriority == "EMERGENCY_60S") SapphireBlue800 else SurfaceBorder
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = state.bookingPriority == "EMERGENCY_60S",
                                onClick = { viewModel.setBookingPriority("EMERGENCY_60S") },
                                colors = RadioButtonDefaults.colors(selectedColor = SapphireBlue800)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(imageVector = Icons.Default.Bolt, contentDescription = null, tint = DangerRed, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Emergency Dispatch (15-30 Mins)",
                                        color = TextDarkPrimary,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Text(
                                    text = "Automated siren dispatch to nearest available certified technician",
                                    color = TextDarkMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Option 2: Scheduled
                    Surface(
                        onClick = { viewModel.setBookingPriority("NORMAL") },
                        color = if (state.bookingPriority == "NORMAL") SapphireBlue800.copy(alpha = 0.08f) else SurfaceLight,
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            1.5.dp,
                            if (state.bookingPriority == "NORMAL") SapphireBlue800 else SurfaceBorder
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = state.bookingPriority == "NORMAL",
                                onClick = { viewModel.setBookingPriority("NORMAL") },
                                colors = RadioButtonDefaults.colors(selectedColor = SapphireBlue800)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text(
                                    text = "Schedule For Later Today / Tomorrow",
                                    color = TextDarkPrimary,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "Select a convenient 2-hour window",
                                    color = TextDarkMuted,
                                    fontSize = 11.sp
                                )
                            }
                        }
                    }
                }
            }

            // Address & Pincode Verification Card
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
                        Column {
                            Text(
                                text = "SERVICE ADDRESS",
                                color = TextDarkPrimary,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            if (state.isGpsActive) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(CircleShape)
                                            .background(SuccessGreen)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "GPS Auto-Detected",
                                        fontSize = 10.sp,
                                        color = SuccessGreen,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }

                        Surface(
                            onClick = { viewModel.resetToGpsLocation(context) },
                            color = SapphireBlue800.copy(alpha = 0.08f),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SapphireBlue800.copy(alpha = 0.25f))
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                if (state.isDetectingLocation) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(12.dp),
                                        strokeWidth = 1.5.dp,
                                        color = SapphireBlue800
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "Detecting...",
                                        color = SapphireBlue800,
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.MyLocation,
                                        contentDescription = "Detect Location",
                                        tint = SapphireBlue800,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = "Use Current GPS",
                                        color = SapphireBlue800,
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Pincode Input & Live Verification
                    OutlinedTextField(
                        value = state.pincode,
                        onValueChange = { viewModel.onPincodeChanged(context, it) },
                        label = { Text("Delivery Pincode (6-Digits)") },
                        placeholder = { Text("400001") },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        trailingIcon = {
                            if (state.isCheckingPincode || state.isLoadingTechnicians) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = SapphireBlue800, strokeWidth = 2.dp)
                            } else if (state.isPincodeServiceable && state.nearbyTechnicians.isNotEmpty()) {
                                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = "Serviceable", tint = SuccessGreen)
                            } else if (state.pincode.length == 6) {
                                Icon(imageVector = Icons.Default.Cancel, contentDescription = "Unserviceable", tint = DangerRed)
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SapphireBlue800,
                            unfocusedBorderColor = if (!state.isPincodeServiceable && state.pincode.length == 6) DangerRed else SurfaceBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Serviceability Result Pill / Real-Time Out-of-Service Red Banner (Issue 7)
                    if (state.isPincodeServiceable && (state.nearbyTechnicians.isNotEmpty() || state.isLoadingTechnicians)) {
                        Surface(
                            color = SuccessGreen.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(imageVector = Icons.Default.Verified, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "SERVICEABLE • ${state.hubName} (~${state.etaMinutes} min dispatch)",
                                    color = SuccessGreen,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    } else if (!state.isCheckingPincode && !state.isLoadingTechnicians && state.pincode.length == 6) {
                        Surface(
                            color = Color(0xFFFEF2F2),
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, DangerRed.copy(alpha = 0.5f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(imageVector = Icons.Default.Cancel, contentDescription = "Out of Service", tint = DangerRed, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "OUT OF SERVICE AREA • 0 active online technicians in pincode ${state.pincode}. Bookings are temporarily paused.",
                                    color = DangerRed,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Dynamic City & District (Auto-filled by GPS / Pincode, fully customer-editable)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        OutlinedTextField(
                            value = state.city,
                            onValueChange = { viewModel.onCityChanged(it) },
                            label = { Text("City / Town") },
                            placeholder = { Text("Mumbai") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SapphireBlue800,
                                unfocusedBorderColor = SurfaceBorder
                            )
                        )

                        OutlinedTextField(
                            value = state.district,
                            onValueChange = { viewModel.onDistrictChanged(it) },
                            label = { Text("District") },
                            placeholder = { Text("Mumbai City") },
                            singleLine = true,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SapphireBlue800,
                                unfocusedBorderColor = SurfaceBorder
                            )
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Flat / House No
                    OutlinedTextField(
                        value = state.flatNumber,
                        onValueChange = { viewModel.onFlatChanged(it) },
                        label = { Text("Flat / House No / Tower") },
                        placeholder = { Text("Flat 402, Sea Crest Towers") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SapphireBlue800,
                            unfocusedBorderColor = SurfaceBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Street / Area (Dynamically auto-filled by GPS, customer editable)
                    OutlinedTextField(
                        value = state.streetName,
                        onValueChange = { viewModel.onStreetChanged(context, it) },
                        label = { Text("Street / Road / Colony") },
                        placeholder = { Text("Colaba Causeway, Mumbai") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SapphireBlue800,
                            unfocusedBorderColor = SurfaceBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // Landmark
                    OutlinedTextField(
                        value = state.landmark,
                        onValueChange = { viewModel.onLandmarkChanged(context, it) },
                        label = { Text("Landmark (Optional)") },
                        placeholder = { Text("Near Radio Club") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SapphireBlue800,
                            unfocusedBorderColor = SurfaceBorder
                        )
                    )
                }
            }

            // Nearby Certified Technicians (Rapido-Style Live Allocation Preview)
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
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(SuccessGreen)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "AVAILABLE PROFESSIONALS NEAR YOU",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = SapphireBlue800,
                                letterSpacing = 0.5.sp
                            )
                        }
                        Surface(
                            color = SuccessGreen.copy(alpha = 0.12f),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                text = "${state.nearbyTechnicians.size} Online in ${state.pincode}",
                                color = SuccessGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // ==========================================
                    // ORDER BY / SORT CONTROLS (Min Distance, Ratings, Number of Jobs)
                    // ==========================================
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(10.dp))
                            .background(Color(0xFFF1F5F9))
                            .padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(start = 4.dp, end = 2.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.FilterList,
                                contentDescription = "Order By",
                                tint = TextDarkSecondary,
                                modifier = Modifier.size(13.dp)
                            )
                            Spacer(modifier = Modifier.width(3.dp))
                            Text(
                                text = "Sort:",
                                fontSize = 10.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextDarkSecondary
                            )
                        }

                        TechnicianSortOption.values().forEach { option ->
                            val isSelected = state.sortOption == option
                            Surface(
                                onClick = { viewModel.setSortOption(option) },
                                modifier = Modifier.weight(1f),
                                color = if (isSelected) SapphireBlue800 else Color.White,
                                shape = RoundedCornerShape(8.dp),
                                shadowElevation = if (isSelected) 1.5.dp else 0.dp,
                                border = androidx.compose.foundation.BorderStroke(
                                    width = 1.dp,
                                    color = if (isSelected) SapphireBlue800 else Color(0xFFE2E8F0)
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(vertical = 6.dp),
                                    horizontalArrangement = Arrangement.Center,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    val icon = when (option) {
                                        TechnicianSortOption.MIN_DISTANCE -> Icons.Default.NearMe
                                        TechnicianSortOption.RATINGS -> Icons.Default.Star
                                        TechnicianSortOption.NUMBER_OF_JOBS -> Icons.Default.Work
                                    }
                                    Icon(
                                        imageVector = icon,
                                        contentDescription = null,
                                        tint = if (isSelected) Color.White else if (option == TechnicianSortOption.RATINGS) Color(0xFFF59E0B) else TextDarkMuted,
                                        modifier = Modifier.size(11.dp)
                                    )
                                    Spacer(modifier = Modifier.width(3.dp))
                                    Text(
                                        text = option.shortLabel,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        fontSize = 10.sp,
                                        color = if (isSelected) Color.White else TextDarkPrimary,
                                        maxLines = 1
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (!isUserLocationEnabled) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFFEF2F2),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFCA5A5))
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LocationOff,
                                    contentDescription = null,
                                    tint = Color(0xFFDC2626),
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Location Access Required",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF991B1B)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Please turn on device location to see certified service professionals available near you in real time.",
                                    fontSize = 11.5.sp,
                                    color = Color(0xFF7F1D1D),
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                                Button(
                                    onClick = {
                                        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                                        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                                        val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
                                        if (!hasFine) {
                                            customerPermLauncher.launch(
                                                arrayOf(
                                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                                    Manifest.permission.ACCESS_COARSE_LOCATION
                                                )
                                            )
                                        } else if (!gps) {
                                            context.startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626)),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.MyLocation, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Turn On Location to View Technicians", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }
                    } else if (state.nearbyTechnicians.isEmpty()) {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFFF8FAFC),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Icon(
                                    imageVector = Icons.Default.PersonSearch,
                                    contentDescription = null,
                                    tint = TextDarkMuted,
                                    modifier = Modifier.size(36.dp)
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                val tradeLabel = state.serviceTitle.ifBlank { "Service" }
                                Text(
                                    text = "No $tradeLabel Professionals Currently Online in Pincode ${state.pincode}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextDarkPrimary,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "Technicians registered in this pincode will appear here automatically when they toggle online in the Technician App.",
                                    fontSize = 11.sp,
                                    color = TextDarkMuted,
                                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                                )
                                Spacer(modifier = Modifier.height(14.dp))
                                Button(
                                    onClick = { viewModel.loadLiveTechnicians(context, state.pincode) },
                                    shape = RoundedCornerShape(10.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                                    modifier = Modifier.height(40.dp)
                                ) {
                                    if (state.isLoadingTechnicians) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(16.dp),
                                            color = Color.White,
                                            strokeWidth = 2.dp
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Checking Online Status...", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    } else {
                                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", modifier = Modifier.size(16.dp), tint = Color.White)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("Refresh Available Technicians", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    }
                                }
                            }
                        }
                    } else {
                        state.sortedTechnicians.forEach { tech ->
                            val isBestForSort = when (state.sortOption) {
                                TechnicianSortOption.MIN_DISTANCE -> tech.id == state.sortedTechnicians.minByOrNull { it.distanceKm }?.id
                                TechnicianSortOption.RATINGS -> tech.id == state.sortedTechnicians.maxByOrNull { it.ratingValue }?.id
                                TechnicianSortOption.NUMBER_OF_JOBS -> tech.id == state.sortedTechnicians.maxByOrNull { it.completedJobsCount }?.id
                            }
                            val highlightBadgeText = when {
                                isBestForSort && state.sortOption == TechnicianSortOption.MIN_DISTANCE -> "FASTEST"
                                isBestForSort && state.sortOption == TechnicianSortOption.RATINGS -> "TOP RATED"
                                isBestForSort && state.sortOption == TechnicianSortOption.NUMBER_OF_JOBS -> "MOST JOBS"
                                else -> null
                            }

                            TechnicianRadarCard(
                                technician = tech,
                                highlightBadge = highlightBadgeText
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0xFFEFF6FF),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBFDBFE)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.VerifiedUser,
                                    contentDescription = null,
                                    tint = SapphireBlue800,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = "Automated Blind Dispatch: The closest vetted professional from our certified fleet will be auto-dispatched to your doorstep upon confirmation.",
                                    fontSize = 11.sp,
                                    color = Color(0xFF1E40AF),
                                    fontWeight = FontWeight.Medium,
                                    lineHeight = 15.sp
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
private fun TechnicianRadarCard(
    technician: NearbyTechnician,
    highlightBadge: String? = null
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Color(0xFFFAFAFA),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar with initials and green online indicator dot
            Box(
                modifier = Modifier.size(42.dp),
                contentAlignment = Alignment.BottomEnd
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(Color(0xFF334155)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = technician.name.split(" ").mapNotNull { it.firstOrNull()?.toString() }.take(2).joinToString(""),
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Box(
                    modifier = Modifier
                        .size(11.dp)
                        .clip(CircleShape)
                        .background(SuccessGreen)
                        .border(1.5.dp, Color.White, CircleShape)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            // Center details (Name, Badges, Rating, Specialty)
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = technician.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        color = Color(0xFFFEF3C7),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "${technician.rating} (${technician.completedJobs})",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF92400E),
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(2.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (highlightBadge != null) {
                        val (bgColor, textColor) = when (highlightBadge) {
                            "FASTEST" -> Color(0xFFDCFCE7) to Color(0xFF15803D)
                            "TOP RATED" -> Color(0xFFFEF3C7) to Color(0xFFB45309)
                            "MOST JOBS" -> Color(0xFFEFF6FF) to Color(0xFF1D4ED8)
                            else -> Color(0xFFF1F5F9) to Color(0xFF334155)
                        }
                        Surface(
                            color = bgColor,
                            shape = RoundedCornerShape(3.dp),
                            modifier = Modifier.padding(end = 6.dp)
                        ) {
                            Text(
                                text = highlightBadge,
                                color = textColor,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 1.dp)
                            )
                        }
                    }
                    Text(
                        text = "${technician.badge} • ${technician.specialty}",
                        fontSize = 11.sp,
                        color = TextDarkMuted,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Right column: ETA pill & Distance
            Column(
                horizontalAlignment = Alignment.End,
                modifier = Modifier.widthIn(min = 72.dp)
            ) {
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(6.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "⚡",
                            fontSize = 10.sp
                        )
                        Spacer(modifier = Modifier.width(2.dp))
                        Text(
                            text = technician.eta,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            color = SapphireBlue800,
                            maxLines = 1
                        )
                    }
                }

                Spacer(modifier = Modifier.height(3.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = technician.distance,
                        fontSize = 10.sp,
                        color = TextDarkMuted,
                        fontWeight = FontWeight.Medium,
                        maxLines = 1
                    )
                }
            }
        }
    }
}


