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

    LaunchedEffect(serviceId) {
        viewModel.initService(serviceId)
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
                        onClick = { onProceedToPayment(state.serviceId) },
                        enabled = state.canProceed,
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SapphireBlue800,
                            disabledContainerColor = SurfaceBorder
                        )
                    ) {
                        Text(text = "CONTINUE TO PAYMENT", fontWeight = FontWeight.Bold, color = Color.White)
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                    }
                }
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
                    Text(
                        text = "SERVICE ADDRESS",
                        color = TextDarkPrimary,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )

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
                            if (state.isCheckingPincode) {
                                CircularProgressIndicator(modifier = Modifier.size(18.dp), color = SapphireBlue800, strokeWidth = 2.dp)
                            } else if (state.isPincodeServiceable) {
                                Icon(imageVector = Icons.Default.CheckCircle, contentDescription = "Serviceable", tint = SuccessGreen)
                            }
                        },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = SapphireBlue800,
                            unfocusedBorderColor = SurfaceBorder
                        )
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // Serviceability Result Pill
                    if (state.isPincodeServiceable) {
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
                                    text = "FULLY SERVICEABLE • ${state.hubName} (~${state.etaMinutes} min dispatch)",
                                    color = SuccessGreen,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

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

                    // Street / Area
                    OutlinedTextField(
                        value = state.streetName,
                        onValueChange = { viewModel.onStreetChanged(it) },
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
                        onValueChange = { viewModel.onLandmarkChanged(it) },
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
                                text = "AVAILABLE ELECTRICIANS NEAR YOU",
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
                                text = "3 Online in ${state.pincode}",
                                color = SuccessGreen,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    state.nearbyTechnicians.forEach { tech ->
                        TechnicianRapidoCard(
                            technician = tech,
                            isSelected = state.selectedTechnicianId == tech.id,
                            isShortestDistance = tech.id == "GTS-TECH-4091",
                            onSelect = { viewModel.selectTechnician(tech.id) }
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }

                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = SapphireBlue800,
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Selected: ${state.selectedTechnician.name} (${state.selectedTechnician.eta} • ${state.selectedTechnician.distance}) reserved upon payment.",
                            fontSize = 11.sp,
                            color = TextDarkPrimary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
private fun TechnicianRapidoCard(
    technician: NearbyTechnician,
    isSelected: Boolean,
    isShortestDistance: Boolean,
    onSelect: () -> Unit
) {
    Surface(
        onClick = onSelect,
        shape = RoundedCornerShape(12.dp),
        color = if (isSelected) Color(0xFFEFF6FF) else Color(0xFFFAFAFA),
        border = androidx.compose.foundation.BorderStroke(
            if (isSelected) 1.5.dp else 1.dp,
            if (isSelected) SapphireBlue800 else SurfaceBorder
        ),
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
                        .background(if (isSelected) SapphireBlue800 else Color(0xFF334155)),
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
                    if (isShortestDistance) {
                        Surface(
                            color = Color(0xFFDCFCE7),
                            shape = RoundedCornerShape(3.dp),
                            modifier = Modifier.padding(end = 6.dp)
                        ) {
                            Text(
                                text = "FASTEST",
                                color = Color(0xFF15803D),
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

            // Right column: ETA pill & Distance + Selection Indicator
            Column(
                horizontalAlignment = Alignment.End,
                modifier = Modifier.widthIn(min = 72.dp)
            ) {
                Surface(
                    color = if (isSelected) SapphireBlue800 else Color.White,
                    shape = RoundedCornerShape(6.dp),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isSelected) SapphireBlue800 else SurfaceBorder
                    )
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
                            color = if (isSelected) Color.White else SapphireBlue800,
                            maxLines = 1
                        )
                    }
                }

                Spacer(modifier = Modifier.height(3.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (isSelected) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = "Selected",
                            tint = SapphireBlue800,
                            modifier = Modifier.size(11.dp)
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                    }
                    Text(
                        text = technician.distance,
                        fontSize = 10.sp,
                        color = if (isSelected) SapphireBlue800 else TextDarkMuted,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        maxLines = 1
                    )
                }
            }
        }
    }
}


