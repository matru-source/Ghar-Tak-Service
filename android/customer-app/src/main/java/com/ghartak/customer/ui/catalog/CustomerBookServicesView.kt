package com.ghartak.customer.ui.catalog

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.ghartak.customer.ui.theme.*

@Composable
fun CustomerBookServicesView(
    viewModel: CustomerCatalogViewModel,
    onServiceSelected: (serviceId: String) -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    var selectedFilter by remember { mutableStateOf("All") } // "All", "Electrical Repair", "Installation"
    var searchQuery by remember { mutableStateOf("") }

    val filteredServices = remember(state.services, selectedFilter, searchQuery) {
        state.services.filter { item ->
            val matchesFilter = when (selectedFilter) {
                "Electrical Repair" -> item.category in listOf("MCB & Panels", "Emergency Tripping", "Wiring & Rewiring", "Safety Audit") ||
                        item.title.contains("Repair", ignoreCase = true) ||
                        item.title.contains("Fix", ignoreCase = true) ||
                        item.title.contains("Replacement", ignoreCase = true)
                "Installation" -> item.category in listOf("Appliance Fix", "Wiring & Rewiring") ||
                        item.title.contains("Install", ignoreCase = true) ||
                        item.title.contains("Mount", ignoreCase = true) ||
                        item.title.contains("Setup", ignoreCase = true)
                else -> true
            }

            val query = searchQuery.trim().lowercase()
            val matchesQuery = query.isEmpty() ||
                    item.title.lowercase().contains(query) ||
                    item.description.lowercase().contains(query) ||
                    item.category.lowercase().contains(query)

            matchesFilter && matchesQuery
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item { Spacer(modifier = Modifier.height(4.dp)) }

        // Top Category Header Banner
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = SapphireBlue900)
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "BOOK ELECTRICAL SERVICES",
                            color = Color.White,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 0.5.sp
                        )
                        Surface(
                            color = ElectricCyan.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                text = "1000V Certified",
                                color = Color.White,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Select any service below to enter your address & view nearby certified technicians ready for dispatch.",
                        color = Color(0xFFBBDEFB),
                        fontSize = 12.sp,
                        lineHeight = 16.sp
                    )
                }
            }
        }

        // Two Main Filter Tabs (Electrical Repair / Installation) + All
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFE2E8F0))
                    .padding(4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf("All", "Electrical Repair", "Installation").forEach { filter ->
                    val isSelected = selectedFilter == filter
                    Surface(
                        onClick = { selectedFilter = filter },
                        modifier = Modifier.weight(1f),
                        color = if (isSelected) Color.White else Color.Transparent,
                        shape = RoundedCornerShape(10.dp),
                        shadowElevation = if (isSelected) 2.dp else 0.dp
                    ) {
                        Box(
                            modifier = Modifier.padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = filter,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 12.sp,
                                color = if (isSelected) SapphireBlue800 else TextDarkMuted
                            )
                        }
                    }
                }
            }
        }

        // Search Bar
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                placeholder = { Text("Search services (e.g. MCB, Fan, Rewiring)...", fontSize = 13.sp) },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = null, tint = SapphireBlue800)
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear", tint = TextDarkMuted)
                        }
                    }
                },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = SapphireBlue800,
                    unfocusedBorderColor = SurfaceBorder
                )
            )
        }

        // Count indicator
        item {
            Text(
                text = "AVAILABLE SERVICES (${filteredServices.size})",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextDarkMuted,
                letterSpacing = 0.5.sp
            )
        }

        // List of all services matching the filter
        items(filteredServices) { service ->
            ServiceBookingCard(
                service = service,
                onBook = { onServiceSelected(service.id) }
            )
        }

        item { Spacer(modifier = Modifier.height(24.dp)) }
    }
}

@Composable
private fun ServiceBookingCard(
    service: ServiceItem,
    onBook: () -> Unit
) {
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
                Surface(
                    color = SapphireBlue800.copy(alpha = 0.08f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = service.category.uppercase(),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        color = SapphireBlue800,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Star,
                        contentDescription = null,
                        tint = WarningAmber,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${service.rating}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "• ${service.durationMinutes} mins",
                        fontSize = 11.sp,
                        color = TextDarkMuted
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = service.title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = TextDarkPrimary
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = service.description,
                fontSize = 12.sp,
                color = TextDarkSecondary,
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Safety & Warranty badge row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    color = Color(0xFFF1F5F9),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.Verified, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(11.dp))
                        Spacer(modifier = Modifier.width(3.dp))
                        Text("${service.warrantyMonths}-Month Warranty", fontSize = 10.sp, color = TextDarkSecondary)
                    }
                }

                if (service.isHighVoltageProtocol) {
                    Surface(
                        color = DangerRed.copy(alpha = 0.08f),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(imageVector = Icons.Default.ElectricBolt, contentDescription = null, tint = DangerRed, modifier = Modifier.size(11.dp))
                            Spacer(modifier = Modifier.width(3.dp))
                            Text("1000V Certified Only", fontSize = 10.sp, color = DangerRed, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            Divider(color = SurfaceBorder)
            Spacer(modifier = Modifier.height(12.dp))

            // Pricing and Book Now Button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "₹${"%,.0f".format(service.priceInr)}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = SapphireBlue900
                    )
                    Text(
                        text = "+ 18% GST Applicable",
                        fontSize = 10.sp,
                        color = TextDarkMuted
                    )
                }

                Button(
                    onClick = onBook,
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Build,
                        contentDescription = "Book",
                        modifier = Modifier.size(15.dp),
                        tint = Color.White
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "BOOK NOW",
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = Color.White
                    )
                }
            }
        }
    }
}
