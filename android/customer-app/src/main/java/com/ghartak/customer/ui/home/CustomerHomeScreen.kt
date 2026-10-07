package com.ghartak.customer.ui.home

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.customer.data.model.ServiceItem
import com.ghartak.customer.ui.catalog.CustomerCatalogViewModel
import com.ghartak.customer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerHomeScreen(
    viewModel: CustomerCatalogViewModel,
    onServiceSelected: (serviceId: String) -> Unit,
    onLogout: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    val categories = listOf(
        "All Services",
        "Emergency Tripping",
        "MCB & Panels",
        "Wiring & Rewiring",
        "Safety Audit",
        "Appliance Fix"
    )

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Hello, ${state.userName}",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = "👋", fontSize = 16.sp)
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        // Active Location Chip
                        Surface(
                            color = SurfaceLight,
                            shape = RoundedCornerShape(8.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    tint = SapphireBlue800,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = "${state.activePincodeCity} (${state.activePincode})",
                                    color = TextDarkSecondary,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        // Cart Indicator
                        if (state.cartItems.isNotEmpty()) {
                            BadgedBox(
                                badge = {
                                    Badge(containerColor = DangerRed) {
                                        Text(state.cartItems.size.toString(), color = Color.White)
                                    }
                                }
                            ) {
                                IconButton(onClick = { /* View cart */ }) {
                                    Icon(imageVector = Icons.Default.ShoppingCart, contentDescription = "Cart", tint = SapphireBlue800)
                                }
                            }
                        }

                        IconButton(onClick = {
                            viewModel.logout()
                            onLogout()
                        }) {
                            Icon(imageVector = Icons.Default.Logout, contentDescription = "Sign Out", tint = TextDarkMuted)
                        }
                    }
                }
            }
        },
        bottomBar = {
            // Sticky Cart / Booking Trigger Bar
            AnimatedVisibility(visible = state.cartItems.isNotEmpty()) {
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
                            Text(
                                text = "${state.cartItems.size} SERVICE SELECTED",
                                color = TextDarkMuted,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "₹${"%,.2f".format(state.cartTotalInr)}",
                                color = SapphireBlue900,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Black
                            )
                        }

                        Button(
                            onClick = {
                                val primaryService = state.cartItems.firstOrNull()?.id ?: "srv_mcb_replace"
                                onServiceSelected(primaryService)
                            },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                        ) {
                            Text(text = "PROCEED TO BOOKING", fontWeight = FontWeight.Bold, color = Color.White)
                            Spacer(modifier = Modifier.width(6.dp))
                            Icon(imageVector = Icons.Default.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        },
        containerColor = SurfaceLight
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Emergency Power Cut Hero Banner
            item {
                EmergencyHeroCard(
                    onEmergencyBook = {
                        onServiceSelected("srv_emergency_short")
                    }
                )
            }

            // Categories Selector Row
            item {
                Column {
                    Text(
                        text = "ELECTRICAL SERVICE CATEGORIES",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkMuted,
                        letterSpacing = 1.sp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(categories) { category ->
                            val isSelected = category == state.selectedCategory
                            Surface(
                                onClick = { viewModel.selectCategory(category) },
                                color = if (isSelected) SapphireBlue800 else Color.White,
                                shape = RoundedCornerShape(20.dp),
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (isSelected) SapphireBlue800 else SurfaceBorder
                                )
                            ) {
                                Text(
                                    text = category,
                                    color = if (isSelected) Color.White else TextDarkSecondary,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
                                )
                            }
                        }
                    }
                }
            }

            // Services List
            items(state.filteredServices) { service ->
                val isInCart = state.cartItems.any { it.id == service.id }
                ServiceOfferingCard(
                    service = service,
                    isInCart = isInCart,
                    onToggleCart = {
                        if (isInCart) viewModel.removeFromCart(service) else viewModel.addToCart(service)
                    },
                    onInstantBook = {
                        onServiceSelected(service.id)
                    }
                )
            }

            item {
                Spacer(modifier = Modifier.height(80.dp)) // Space for bottom bar
            }
        }
    }
}

@Composable
fun EmergencyHeroCard(onEmergencyBook: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = NavyDark900)
    ) {
        Column(modifier = Modifier.padding(18.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Surface(
                    color = DangerRed.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(6.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, DangerRed.copy(alpha = 0.4f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(DangerRed)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "60-SECOND EMERGENCY DISPATCH",
                            color = Color(0xFFFF8A80),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Text(
                    text = "~15 MIN ARRIVAL",
                    color = ElectricCyan,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Sparking, MCB Tripping or Total Power Cut?",
                color = Color.White,
                fontSize = 17.sp,
                fontWeight = FontWeight.Black
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Class 0 (1000V) Insulated Electrician dispatched immediately to your address with calibrated diagnostic gear.",
                color = TextLightSecondary,
                fontSize = 12.sp,
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = onEmergencyBook,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue600),
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(imageVector = Icons.Default.Bolt, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("BOOK EMERGENCY REPAIR (₹699)", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 12.sp)
            }
        }
    }
}

@Composable
fun ServiceOfferingCard(
    service: ServiceItem,
    isInCart: Boolean,
    onToggleCart: () -> Unit,
    onInstantBook: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isInCart) SapphireBlue800 else SurfaceBorder
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = service.title,
                        color = TextDarkPrimary,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = service.description,
                        color = TextDarkSecondary,
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Badges row
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (service.isHighVoltageProtocol) {
                    Surface(
                        color = SapphireBlue800.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "⚡ 1000V SAFETY",
                            color = SapphireBlue800,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                }

                Surface(
                    color = SuccessGreen.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(4.dp)
                ) {
                    Text(
                        text = "${service.warrantyMonths}M WARRANTY",
                        color = SuccessGreen,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Text(
                    text = "⏱️ ${service.durationMinutes} mins",
                    color = TextDarkMuted,
                    fontSize = 11.sp
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            Divider(color = SurfaceBorder, thickness = 1.dp)
            Spacer(modifier = Modifier.height(12.dp))

            // Price & Actions
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = "STANDARDIZED RATE", color = TextDarkMuted, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    Text(
                        text = "₹${"%,.2f".format(service.priceInr)}",
                        color = SapphireBlue900,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = onToggleCart,
                        shape = RoundedCornerShape(8.dp),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (isInCart) DangerRed else SapphireBlue800
                        ),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = if (isInCart) DangerRed else SapphireBlue800
                        )
                    ) {
                        Text(text = if (isInCart) "REMOVE" else "ADD", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }

                    Button(
                        onClick = onInstantBook,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                    ) {
                        Text(text = "BOOK NOW", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    }
                }
            }
        }
    }
}
