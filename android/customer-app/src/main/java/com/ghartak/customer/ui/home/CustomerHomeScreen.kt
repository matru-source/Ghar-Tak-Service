package com.ghartak.customer.ui.home

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import com.ghartak.customer.R
import com.ghartak.customer.ui.catalog.CustomerBookServicesView
import com.ghartak.customer.data.model.ServiceItem
import com.ghartak.customer.ui.catalog.CustomerCatalogViewModel
import com.ghartak.customer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerHomeScreen(
    viewModel: CustomerCatalogViewModel,
    onServiceSelected: (serviceId: String) -> Unit,
    onTrackSelected: (jobId: String) -> Unit = {},
    onLogout: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    var currentBottomTab by remember { mutableStateOf(0) }

    Scaffold(
        topBar = {
            // Top Sapphire Blue Header conforming strictly to gts.drawio.pdf
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SapphireBlue800)
                    .padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 18.dp)
            ) {
                // Greeting Row with Yellow Notification Bell
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(46.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.White)
                                .padding(4.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.logo_gts_nobg),
                                contentDescription = "GTS Logo",
                                modifier = Modifier.size(38.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            val firstName = state.userName.trim().split(" ").firstOrNull() ?: state.userName
                            Text(
                                text = "Hello, $firstName!",
                                fontSize = 19.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Welcome to Ghar Tak Services (GTS)",
                                fontSize = 12.sp,
                                color = Color(0xFFBBDEFB),
                                fontWeight = FontWeight.Normal
                            )
                        }
                    }

                    // Notification Bell (Golden Yellow as in diagram)
                    IconButton(
                        onClick = {
                            Toast.makeText(context, "⚡ 1 Dispatch Alert: Rajesh Kumar is En Route", Toast.LENGTH_SHORT).show()
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications",
                            tint = Color(0xFFFFD54F),
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Search Bar ("🔍 Search for electrical services...")
                Surface(
                    color = Color.White,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    shadowElevation = 2.dp
                ) {
                    TextField(
                        value = state.searchQuery,
                        onValueChange = { viewModel.setSearchQuery(it) },
                        placeholder = {
                            Text(
                                text = "Search for electrical services...",
                                fontSize = 13.sp,
                                color = Color(0xFF9E9E9E)
                            )
                        },
                        leadingIcon = {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "Search",
                                tint = SapphireBlue800,
                                modifier = Modifier.size(20.dp)
                            )
                        },
                        trailingIcon = {
                            if (state.searchQuery.isNotEmpty()) {
                                IconButton(onClick = { viewModel.setSearchQuery("") }) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Clear",
                                        tint = Color.Gray,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        },
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.White,
                            unfocusedContainerColor = Color.White,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                            focusedTextColor = TextDarkPrimary,
                            unfocusedTextColor = TextDarkPrimary
                        ),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(onSearch = { focusManager.clearFocus() }),
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        },
        bottomBar = {
            // Fixed 5-Tab Navigation Bar conforming to diagram: Home, Book, Track, History, Profile
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp,
                modifier = Modifier.border(0.5.dp, SurfaceBorder)
            ) {
                NavigationBarItem(
                    selected = currentBottomTab == 0,
                    onClick = { currentBottomTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home", fontSize = 11.sp, fontWeight = if (currentBottomTab == 0) FontWeight.Bold else FontWeight.Normal) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SapphireBlue800,
                        selectedTextColor = SapphireBlue800,
                        indicatorColor = Color(0xFFE3F2FD)
                    )
                )

                NavigationBarItem(
                    selected = currentBottomTab == 1,
                    onClick = { currentBottomTab = 1 },
                    icon = { Icon(Icons.Default.Build, contentDescription = "Book") },
                    label = { Text("Book", fontSize = 11.sp, fontWeight = if (currentBottomTab == 1) FontWeight.Bold else FontWeight.Normal) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SapphireBlue800,
                        selectedTextColor = SapphireBlue800,
                        indicatorColor = Color(0xFFE3F2FD)
                    )
                )

                NavigationBarItem(
                    selected = currentBottomTab == 2,
                    onClick = {
                        currentBottomTab = 2
                        onTrackSelected(state.activeJobId)
                    },
                    icon = { Icon(Icons.Default.LocationOn, contentDescription = "Track") },
                    label = { Text("Track", fontSize = 11.sp) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SapphireBlue800,
                        selectedTextColor = SapphireBlue800,
                        indicatorColor = Color(0xFFE3F2FD)
                    )
                )

                NavigationBarItem(
                    selected = currentBottomTab == 3,
                    onClick = { currentBottomTab = 3 },
                    icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "History") },
                    label = { Text("History", fontSize = 11.sp, fontWeight = if (currentBottomTab == 3) FontWeight.Bold else FontWeight.Normal) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SapphireBlue800,
                        selectedTextColor = SapphireBlue800,
                        indicatorColor = Color(0xFFE3F2FD)
                    )
                )

                NavigationBarItem(
                    selected = currentBottomTab == 4,
                    onClick = { currentBottomTab = 4 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile", fontSize = 11.sp, fontWeight = if (currentBottomTab == 4) FontWeight.Bold else FontWeight.Normal) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = SapphireBlue800,
                        selectedTextColor = SapphireBlue800,
                        indicatorColor = Color(0xFFE3F2FD)
                    )
                )
            }
        },
        containerColor = Color(0xFFF8FAFC)
    ) { innerPadding ->
        when (currentBottomTab) {
            1 -> {
                Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
                    CustomerBookServicesView(
                        viewModel = viewModel,
                        onServiceSelected = onServiceSelected
                    )
                }
            }
            3 -> {
                Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
                    CustomerHistoryView(
                        onBookServiceAgain = {
                            currentBottomTab = 1
                        }
                    )
                }
            }
            4 -> {
                Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
                    CustomerProfileView(
                        userName = state.userName,
                        onLogout = {
                            viewModel.logout()
                            onLogout()
                        }
                    )
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    item { Spacer(modifier = Modifier.height(4.dp)) }

            // ==========================================
            // 1. SECTION: Quick Actions (3 Cards)
            // ==========================================
            item {
                Column {
                    Text(
                        text = "Quick Actions",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        // 1. Book Service Card
                        QuickActionCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.Build,
                            iconTint = SapphireBlue800,
                            label = "Book Service",
                            onClick = {
                                currentBottomTab = 1
                            }
                        )

                        // 2. Track Service Card
                        QuickActionCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.LocationOn,
                            iconTint = Color(0xFFE53935), // Red location pin as in diagram
                            label = "Track Service",
                            onClick = {
                                onTrackSelected(state.activeJobId)
                            }
                        )

                        // 3. History Card
                        QuickActionCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.Assignment,
                            iconTint = Color(0xFFD97706),
                            label = "History",
                            onClick = {
                                currentBottomTab = 3
                            }
                        )
                    }
                }
            }

            // ==========================================
            // 2. SECTION: Service Categories (4 Cards)
            // ==========================================
            item {
                Column {
                    Text(
                        text = "Service Categories",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // 1. Repair (Lightbulb)
                        CategoryCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.Lightbulb,
                            iconTint = Color(0xFFFBC02D),
                            label = "Repair",
                            isSelected = state.selectedCategory == "Repair",
                            onClick = { viewModel.selectCategory("Repair") }
                        )

                        // 2. Installation (Power Plug)
                        CategoryCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.Power,
                            iconTint = SapphireBlue800,
                            label = "Installation",
                            isSelected = state.selectedCategory == "Installation",
                            onClick = { viewModel.selectCategory("Installation") }
                        )

                        // 3. Maintenance (Battery / Meter)
                        CategoryCard(
                            modifier = Modifier.weight(1f),
                            icon = Icons.Default.BatteryChargingFull,
                            iconTint = SuccessGreen,
                            label = "Maintenance",
                            isSelected = state.selectedCategory == "Maintenance",
                            onClick = { viewModel.selectCategory("Maintenance") }
                        )

                        // 4. Emergency (Red Highlighted Lightning Bolt as in diagram)
                        EmergencyCategoryCard(
                            modifier = Modifier.weight(1f),
                            isSelected = state.selectedCategory == "Emergency",
                            onClick = { viewModel.selectCategory("Emergency") }
                        )
                    }
                }
            }

            // ==========================================
            // 3. SECTION: Active Service Card (Green Card)
            // ==========================================
            item {
                Column {
                    Text(
                        text = "Active Service",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(10.dp))

                    if (state.hasActiveJob) {
                        Surface(
                            color = Color(0xFFE8F5E9), // Soft green background as in diagram
                            shape = RoundedCornerShape(14.dp),
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF81C784)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onTrackSelected(state.activeJobId) }
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Wrench Icon circle
                                Box(
                                    modifier = Modifier
                                        .size(44.dp)
                                        .background(Color(0xFFC8E6C9), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Build,
                                        contentDescription = null,
                                        tint = Color(0xFF2E7D32),
                                        modifier = Modifier.size(22.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                // Service Details
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = state.activeJobTitle,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextDarkPrimary
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = "Technician: ${state.activeJobTechnician}",
                                        fontSize = 12.sp,
                                        color = TextDarkSecondary
                                    )
                                    Text(
                                        text = "Est. Arrival: ${state.activeJobEta}",
                                        fontSize = 12.sp,
                                        color = TextDarkSecondary
                                    )
                                }

                                // Status Badge ("⏳ In Progress")
                                Surface(
                                    color = Color(0xFFFFF8E1),
                                    shape = RoundedCornerShape(6.dp),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFFB300))
                                ) {
                                    Text(
                                        text = "⏳ In Progress",
                                        color = Color(0xFFF57F17),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    } else {
                        Surface(
                            color = Color.White,
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SuccessGreen)
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "No active jobs. Book an electrician above!",
                                    fontSize = 13.sp,
                                    color = TextDarkSecondary
                                )
                            }
                        }
                    }
                }
            }

            // ==========================================
            // 4. SECTION: Available Electrical Services Catalog
            // ==========================================
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (state.selectedCategory == "All") "Popular Services" else "${state.selectedCategory} Offerings",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )
                    if (state.selectedCategory != "All") {
                        Text(
                            text = "Reset All",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SapphireBlue800,
                            modifier = Modifier.clickable { viewModel.selectCategory("All") }
                        )
                    }
                }
            }

            items(state.filteredServices) { service ->
                ServiceItemRow(
                    service = service,
                    onBook = { onServiceSelected(service.id) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(20.dp))
            }
        }
        }
    }
    }
}

// -------------------------------------------------------------
// Component: Quick Action Card (Wrench, Pin, History)
// -------------------------------------------------------------
@Composable
fun QuickActionCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    iconTint: Color,
    label: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = Color(0xFFE3F2FD), // Light blue background as in diagram
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF90CAF9)),
        modifier = modifier.height(84.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = iconTint,
                modifier = Modifier.size(26.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = TextDarkPrimary,
                textAlign = TextAlign.Center
            )
        }
    }
}

// -------------------------------------------------------------
// Component: Standard Category Card (Repair, Installation, Maintenance)
// -------------------------------------------------------------
@Composable
fun CategoryCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    iconTint: Color,
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = if (isSelected) Color(0xFFE3F2FD) else Color.White,
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(
            if (isSelected) 1.5.dp else 1.dp,
            if (isSelected) SapphireBlue800 else Color(0xFFE0E0E0)
        ),
        modifier = modifier.height(84.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = iconTint,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = label,
                fontSize = 10.5.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = if (isSelected) SapphireBlue900 else TextDarkPrimary,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
        }
    }
}

// -------------------------------------------------------------
// Component: Emergency Category Card (Red border & highlight as in diagram)
// -------------------------------------------------------------
@Composable
fun EmergencyCategoryCard(
    modifier: Modifier = Modifier,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = Color(0xFFFFEBEE), // Pinkish red background as in diagram
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(
            1.5.dp,
            if (isSelected) Color(0xFFC62828) else Color(0xFFEF5350)
        ),
        modifier = modifier.height(84.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(6.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = Icons.Default.Bolt,
                contentDescription = "Emergency",
                tint = Color(0xFFD32F2F),
                modifier = Modifier.size(26.dp)
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Emergency",
                fontSize = 10.5.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFFD32F2F),
                textAlign = TextAlign.Center,
                maxLines = 1
            )
        }
    }
}

// -------------------------------------------------------------
// Component: Service Item Row Card in Catalog
// -------------------------------------------------------------
@Composable
fun ServiceItemRow(
    service: ServiceItem,
    onBook: () -> Unit
) {
    Surface(
        color = Color.White,
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = service.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary
                )
                Spacer(modifier = Modifier.height(3.dp))
                Text(
                    text = "${service.durationMinutes} mins • 18% GST itemized",
                    fontSize = 11.sp,
                    color = TextDarkMuted
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "₹${"%,.0f".format(service.priceInr)}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                    color = SapphireBlue900
                )
            }

            Button(
                onClick = onBook,
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
            ) {
                Text("BOOK", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }
        }
    }
}
