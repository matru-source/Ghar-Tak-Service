package com.ghartak.customer.ui.home

import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.customer.R
import com.ghartak.customer.data.model.ServiceItem
import com.ghartak.customer.data.session.SessionManager
import com.ghartak.customer.ui.catalog.CustomerBookServicesView
import com.ghartak.customer.ui.catalog.CustomerCatalogViewModel
import com.ghartak.customer.ui.components.EnvironmentSwitcherDialog
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
    val sessionManager = remember { SessionManager(context) }
    val focusManager = LocalFocusManager.current
    var currentBottomTab by remember { mutableStateOf(0) }
    var logoClickCount by remember { mutableStateOf(0) }
    var lastClickTime by remember { mutableStateOf(0L) }
    var showEnvSwitcher by remember { mutableStateOf(false) }

    if (showEnvSwitcher) {
        EnvironmentSwitcherDialog(
            currentUrl = sessionManager.getCustomBaseUrl(),
            onDismiss = { showEnvSwitcher = false },
            onApply = { newUrl ->
                sessionManager.setCustomBaseUrl(newUrl)
            }
        )
    }

    Scaffold(
        topBar = {
            if (currentBottomTab == 0) {
                // GTS 2.0 Header Banner with Gradient, Greeting, and Voice Search Pill
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(brush = gtsHeaderGradient())
                        .padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 18.dp)
                ) {
                    // 1. Logo, Brand & Notification Bell
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable {
                                val now = System.currentTimeMillis()
                                if (now - lastClickTime < 1500) {
                                    logoClickCount++
                                } else {
                                    logoClickCount = 1
                                }
                                lastClickTime = now

                                if (logoClickCount >= 6) {
                                    logoClickCount = 0
                                    showEnvSwitcher = true
                                }
                            }
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(ShapeCardSmall)
                                    .background(Color.White)
                                    .padding(4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.logo_gts_nobg),
                                    contentDescription = "GTS Logo",
                                    modifier = Modifier.size(36.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column {
                                Text(
                                    text = "Ghar Tak Services",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = "24/7 Verified Electricians",
                                    fontSize = 11.sp,
                                    color = Color(0xFFBBDEFB),
                                    fontWeight = FontWeight.Normal
                                )
                            }
                        }

                        // Notification Bell with Red Badge Dot
                        Box {
                            IconButton(
                                onClick = {
                                    Toast.makeText(context, "⚡ 1 Dispatch Alert: Rajesh Kumar is En Route", Toast.LENGTH_SHORT).show()
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Notifications,
                                    contentDescription = "Notifications",
                                    tint = Color(0xFFFFD54F),
                                    modifier = Modifier.size(26.dp)
                                )
                            }
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .align(Alignment.TopEnd)
                                    .offset(x = (-6).dp, y = 6.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF4444))
                                    .border(1.5.dp, Color.White, CircleShape)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 2. Greeting Headline & Subtitle
                    val firstName = remember(state.userName) {
                        state.userName.trim().split(" ").firstOrNull() ?: state.userName
                    }
                    Text(
                        text = "Hello, $firstName!",
                        style = GreetingHeadlineStyle
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Professional Electrical Services at Your Doorstep",
                        style = SubGreetingStyle
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // 3. Floating Rounded Search Pill with Mic Icon
                    Surface(
                        color = Color.White,
                        shape = ShapeSearchPill,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shadowElevation = 3.dp
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(horizontal = 14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Search,
                                contentDescription = "Search",
                                tint = GtsHeaderGradientStart,
                                modifier = Modifier.size(20.dp)
                            )

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
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = Color.Transparent,
                                    unfocusedContainerColor = Color.Transparent,
                                    focusedIndicatorColor = Color.Transparent,
                                    unfocusedIndicatorColor = Color.Transparent,
                                    focusedTextColor = TextDarkPrimary,
                                    unfocusedTextColor = TextDarkPrimary
                                ),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                                keyboardActions = KeyboardActions(onSearch = { focusManager.clearFocus() }),
                                modifier = Modifier
                                    .weight(1f)
                                    .padding(horizontal = 4.dp)
                            )

                            if (state.searchQuery.isNotEmpty()) {
                                IconButton(
                                    onClick = { viewModel.setSearchQuery("") },
                                    modifier = Modifier.size(24.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Close,
                                        contentDescription = "Clear",
                                        tint = Color.Gray,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(4.dp))
                            }

                            // Voice Search Mic Icon
                            IconButton(
                                onClick = {
                                    Toast.makeText(context, "🎤 Voice Search: Listening for electrical query...", Toast.LENGTH_SHORT).show()
                                },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Mic,
                                    contentDescription = "Voice Search",
                                    tint = GtsHeaderGradientStart,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            } else {
                TopAppBar(
                    title = {
                        Text(
                            text = when (currentBottomTab) {
                                1 -> "Book Electrical Services"
                                3 -> "Order History & Invoices"
                                4 -> "Customer Profile"
                                else -> "Ghar Tak Services"
                            },
                            fontSize = 17.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { currentBottomTab = 0 }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Home", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = SapphireBlue800
                    )
                )
            }
        },
        bottomBar = {
            // Fixed 5-Tab Navigation Bar: Home, Book, Track, History, Profile (Phase 5 Token Aligned)
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp,
                modifier = Modifier.border(0.5.dp, BottomNavBorder)
            ) {
                val navColors = NavigationBarItemDefaults.colors(
                    selectedIconColor = BottomNavActiveBlue,
                    selectedTextColor = BottomNavActiveBlue,
                    indicatorColor = BottomNavActivePillBg,
                    unselectedIconColor = BottomNavInactiveSlate,
                    unselectedTextColor = BottomNavInactiveSlate
                )

                NavigationBarItem(
                    selected = currentBottomTab == 0,
                    onClick = { currentBottomTab = 0 },
                    icon = { Icon(Icons.Default.Home, contentDescription = "Home") },
                    label = { Text("Home", fontSize = 11.sp, fontWeight = if (currentBottomTab == 0) FontWeight.Bold else FontWeight.Normal) },
                    colors = navColors
                )

                NavigationBarItem(
                    selected = currentBottomTab == 1,
                    onClick = { currentBottomTab = 1 },
                    icon = { Icon(Icons.Default.Build, contentDescription = "Book") },
                    label = { Text("Book", fontSize = 11.sp, fontWeight = if (currentBottomTab == 1) FontWeight.Bold else FontWeight.Normal) },
                    colors = navColors
                )

                NavigationBarItem(
                    selected = currentBottomTab == 2,
                    onClick = {
                        currentBottomTab = 2
                        onTrackSelected(state.activeJobId)
                    },
                    icon = { Icon(Icons.Default.LocationOn, contentDescription = "Track") },
                    label = { Text("Track", fontSize = 11.sp) },
                    colors = navColors
                )

                NavigationBarItem(
                    selected = currentBottomTab == 3,
                    onClick = { currentBottomTab = 3 },
                    icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "History") },
                    label = { Text("History", fontSize = 11.sp, fontWeight = if (currentBottomTab == 3) FontWeight.Bold else FontWeight.Normal) },
                    colors = navColors
                )

                NavigationBarItem(
                    selected = currentBottomTab == 4,
                    onClick = { currentBottomTab = 4 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile", fontSize = 11.sp, fontWeight = if (currentBottomTab == 4) FontWeight.Bold else FontWeight.Normal) },
                    colors = navColors
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
                        userPhone = state.userPhone,
                        userEmail = state.userEmail,
                        userAddress = state.userAddress,
                        onViewOrders = {
                            currentBottomTab = 3
                        },
                        onUpdateProfile = { name, email, phone, addr ->
                            viewModel.updateProfile(name, email, phone, addr)
                        },
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
                    // 1. SECTION: Quick Actions (3 Cards with Chevrons)
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
                                    iconBg = Color(0xFFEFF6FF),
                                    title = "Book Service",
                                    subtitle = "Instant Booking",
                                    onClick = {
                                        currentBottomTab = 1
                                    }
                                )

                                // 2. Track Service Card
                                QuickActionCard(
                                    modifier = Modifier.weight(1f),
                                    icon = Icons.Default.LocationOn,
                                    iconTint = Color(0xFFDC2626),
                                    iconBg = Color(0xFFFEF2F2),
                                    title = "Track Service",
                                    subtitle = "Live GPS ETA",
                                    onClick = {
                                        onTrackSelected(state.activeJobId)
                                    }
                                )

                                // 3. History Card
                                QuickActionCard(
                                    modifier = Modifier.weight(1f),
                                    icon = Icons.Default.ReceiptLong,
                                    iconTint = Color(0xFFD97706),
                                    iconBg = Color(0xFFFFFBEB),
                                    title = "History",
                                    subtitle = "Past Invoices",
                                    onClick = {
                                        currentBottomTab = 3
                                    }
                                )
                            }
                        }
                    }

                    // ==========================================
                    // 2. SECTION: Service Categories (4 Pastel Cards)
                    // ==========================================
                    item {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Service Categories",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextDarkPrimary
                                )
                                Text(
                                    text = "View All >",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SapphireBlue800,
                                    modifier = Modifier.clickable { currentBottomTab = 1 }
                                )
                            }
                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // 1. Repair (Pastel Yellow)
                                CategoryCard(
                                    modifier = Modifier.weight(1f),
                                    icon = Icons.Default.Build,
                                    iconTint = Color(0xFFD97706),
                                    bgColor = CategoryRepairBg,
                                    borderColor = Color(0xFFFDE68A),
                                    label = "Repair",
                                    subtitle = "Fix issues",
                                    isSelected = state.selectedCategory == "Repair",
                                    onClick = {
                                        if (state.selectedCategory == "Repair") {
                                            viewModel.selectCategory("All")
                                        } else {
                                            viewModel.selectCategory("Repair")
                                        }
                                    }
                                )

                                // 2. Installation (Pastel Blue)
                                CategoryCard(
                                    modifier = Modifier.weight(1f),
                                    icon = Icons.Default.Power,
                                    iconTint = Color(0xFF2563EB),
                                    bgColor = CategoryInstallBg,
                                    borderColor = Color(0xFFBFDBFE),
                                    label = "Installation",
                                    subtitle = "New setups",
                                    isSelected = state.selectedCategory == "Installation",
                                    onClick = {
                                        if (state.selectedCategory == "Installation") {
                                            viewModel.selectCategory("All")
                                        } else {
                                            viewModel.selectCategory("Installation")
                                        }
                                    }
                                )

                                // 3. Maintenance (Pastel Green)
                                CategoryCard(
                                    modifier = Modifier.weight(1f),
                                    icon = Icons.Default.BatteryChargingFull,
                                    iconTint = Color(0xFF16A34A),
                                    bgColor = CategoryMaintBg,
                                    borderColor = Color(0xFFBBF7D0),
                                    label = "Maintenance",
                                    subtitle = "Inspection",
                                    isSelected = state.selectedCategory == "Maintenance",
                                    onClick = {
                                        if (state.selectedCategory == "Maintenance") {
                                            viewModel.selectCategory("All")
                                        } else {
                                            viewModel.selectCategory("Maintenance")
                                        }
                                    }
                                )

                                // 4. Emergency (Pastel Red SOS)
                                CategoryCard(
                                    modifier = Modifier.weight(1f),
                                    icon = Icons.Default.Bolt,
                                    iconTint = Color(0xFFDC2626),
                                    bgColor = CategoryEmergencyBg,
                                    borderColor = Color(0xFFFECACA),
                                    label = "Emergency",
                                    subtitle = "24/7 SOS",
                                    isSelected = state.selectedCategory == "Emergency",
                                    onClick = {
                                        if (state.selectedCategory == "Emergency") {
                                            viewModel.selectCategory("All")
                                        } else {
                                            viewModel.selectCategory("Emergency")
                                        }
                                    }
                                )
                            }
                        }
                    }

                    // ==========================================
                    // 3. SECTION: Active Service Card (With Live Stepper & ETA)
                    // ==========================================
                    item {
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = "Active Service",
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextDarkPrimary
                                )
                                if (state.hasActiveJob) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(SuccessGreen)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(10.dp))

                            if (state.hasActiveJob) {
                                Surface(
                                    color = ActiveServiceCardBg,
                                    shape = ShapeCard,
                                    border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFF86EFAC)),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { onTrackSelected(state.activeJobId) }
                                ) {
                                    Column(modifier = Modifier.padding(16.dp)) {
                                        // Header Row: Status Chip & ETA Pill
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Surface(
                                                color = EnRoutePillBg,
                                                shape = RoundedCornerShape(20.dp)
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(6.dp)
                                                            .clip(CircleShape)
                                                            .background(EnRoutePillText)
                                                    )
                                                    Spacer(modifier = Modifier.width(5.dp))
                                                    Text(
                                                        text = "TECHNICIAN EN ROUTE",
                                                        color = EnRoutePillText,
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }

                                            Surface(
                                                color = EtaPillBg,
                                                shape = RoundedCornerShape(20.dp)
                                            ) {
                                                Text(
                                                    text = "ETA ${state.activeJobEta}",
                                                    color = EtaPillText,
                                                    fontSize = 11.sp,
                                                    fontWeight = FontWeight.Black,
                                                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(12.dp))

                                        // Service Details & Location
                                        Text(
                                            text = state.activeJobTitle,
                                            fontSize = 15.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = TextDarkPrimary
                                        )
                                        Spacer(modifier = Modifier.height(3.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                imageVector = Icons.Default.LocationOn,
                                                contentDescription = null,
                                                tint = TextDarkMuted,
                                                modifier = Modifier.size(13.dp)
                                            )
                                            Spacer(modifier = Modifier.width(3.dp))
                                            Text(
                                                text = "Home • ${state.activePincodeCity} (${state.activePincode})",
                                                fontSize = 11.5.sp,
                                                color = TextDarkSecondary
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(12.dp))
                                        Divider(color = Color(0xFFDCFCE7), thickness = 1.dp)
                                        Spacer(modifier = Modifier.height(10.dp))

                                        // Technician Info Row
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(36.dp)
                                                        .clip(CircleShape)
                                                        .background(Color(0xFFDCFCE7)),
                                                    contentAlignment = Alignment.Center
                                                ) {
                                                    Text(
                                                        text = "RK",
                                                        color = SuccessGreen,
                                                        fontWeight = FontWeight.Black,
                                                        fontSize = 13.sp
                                                    )
                                                }
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Column {
                                                    Text(
                                                        text = state.activeJobTechnician,
                                                        fontSize = 12.5.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = TextDarkPrimary
                                                    )
                                                    Text(
                                                        text = "★ 4.8 • Verified Master Electrician",
                                                        fontSize = 11.sp,
                                                        color = TextDarkMuted
                                                    )
                                                }
                                            }

                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text(
                                                    text = "Live Map",
                                                    fontSize = 11.5.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = SapphireBlue800
                                                )
                                                Icon(
                                                    imageVector = Icons.Default.ChevronRight,
                                                    contentDescription = null,
                                                    tint = SapphireBlue800,
                                                    modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(14.dp))

                                        // Live Horizontal Stepper (4 Milestones)
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            MiniStepItem(label = "Confirmed", isDone = true, isActive = false)
                                            MiniStepDivider(isDone = true)
                                            MiniStepItem(label = "En Route", isDone = false, isActive = true)
                                            MiniStepDivider(isDone = false)
                                            MiniStepItem(label = "At Location", isDone = false, isActive = false)
                                            MiniStepDivider(isDone = false)
                                            MiniStepItem(label = "Done", isDone = false, isActive = false)
                                        }
                                    }
                                }
                            } else {
                                Surface(
                                    color = Color.White,
                                    shape = ShapeCardSmall,
                                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Row(
                                        modifier = Modifier.padding(16.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            modifier = Modifier.weight(1f)
                                        ) {
                                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = SuccessGreen)
                                            Spacer(modifier = Modifier.width(10.dp))
                                            Text(
                                                text = "No active bookings. Need electrical help?",
                                                fontSize = 13.sp,
                                                color = TextDarkSecondary
                                            )
                                        }
                                        Button(
                                            onClick = { currentBottomTab = 1 },
                                            shape = RoundedCornerShape(8.dp),
                                            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                        ) {
                                            Text("BOOK", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                        }
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
// Component: Mini Step Item for Active Service Card
// -------------------------------------------------------------
@Composable
private fun RowScope.MiniStepItem(label: String, isDone: Boolean, isActive: Boolean) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.weight(1f)
    ) {
        Box(
            modifier = Modifier
                .size(16.dp)
                .clip(CircleShape)
                .background(
                    when {
                        isDone -> SuccessGreen
                        isActive -> SapphireBlue800
                        else -> Color(0xFFCBD5E1)
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            if (isDone) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(10.dp)
                )
            } else if (isActive) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(Color.White)
                )
            }
        }
        Spacer(modifier = Modifier.height(3.dp))
        Text(
            text = label,
            fontSize = 9.sp,
            fontWeight = if (isActive || isDone) FontWeight.Bold else FontWeight.Normal,
            color = if (isActive || isDone) TextDarkPrimary else TextDarkMuted,
            textAlign = TextAlign.Center,
            maxLines = 1
        )
    }
}

@Composable
private fun MiniStepDivider(isDone: Boolean) {
    Box(
        modifier = Modifier
            .width(16.dp)
            .height(2.dp)
            .background(if (isDone) SuccessGreen else Color(0xFFCBD5E1))
            .offset(y = (-7).dp)
    )
}

// -------------------------------------------------------------
// Component: Quick Action Card (Book, Track, History with Chevron)
// -------------------------------------------------------------
@Composable
fun QuickActionCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    iconTint: Color,
    iconBg: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = Color.White,
        shape = ShapeCardSmall,
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
        shadowElevation = 1.dp,
        modifier = modifier.height(96.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(iconBg),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = title,
                        tint = iconTint,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = Color(0xFF94A3B8),
                    modifier = Modifier.size(16.dp)
                )
            }

            Column {
                Text(
                    text = title,
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = subtitle,
                    fontSize = 9.5.sp,
                    color = TextDarkMuted,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}

// -------------------------------------------------------------
// Component: Pastel Category Card (Repair, Installation, Maintenance, Emergency)
// -------------------------------------------------------------
@Composable
fun CategoryCard(
    modifier: Modifier = Modifier,
    icon: ImageVector,
    iconTint: Color,
    bgColor: Color,
    borderColor: Color,
    label: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = bgColor,
        shape = ShapeCardSmall,
        border = androidx.compose.foundation.BorderStroke(
            width = if (isSelected) 2.dp else 1.dp,
            color = if (isSelected) iconTint else borderColor
        ),
        shadowElevation = if (isSelected) 2.dp else 0.dp,
        modifier = modifier.height(92.dp)
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
            Spacer(modifier = Modifier.height(5.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
                color = TextDarkPrimary,
                textAlign = TextAlign.Center,
                maxLines = 1
            )
            Spacer(modifier = Modifier.height(1.dp))
            Text(
                text = subtitle,
                fontSize = 9.sp,
                color = TextDarkMuted,
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
        shape = ShapeCardSmall,
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
        shadowElevation = 1.dp,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Category Visual Icon Thumbnail
            Box(
                modifier = Modifier
                    .size(50.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF1F5F9)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when {
                        service.category.contains("MCB", ignoreCase = true) -> Icons.Default.Bolt
                        service.category.contains("Emergency", ignoreCase = true) -> Icons.Default.FlashOn
                        service.category.contains("Wiring", ignoreCase = true) -> Icons.Default.Power
                        else -> Icons.Default.Build
                    },
                    contentDescription = null,
                    tint = SapphireBlue800,
                    modifier = Modifier.size(24.dp)
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = service.title,
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = TextDarkMuted,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${service.durationMinutes} mins",
                        fontSize = 11.sp,
                        color = TextDarkMuted
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = "•", color = TextDarkMuted, fontSize = 10.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        color = Color(0xFFF1F5F9),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            text = "18% GST itemized",
                            fontSize = 9.5.sp,
                            color = TextDarkMuted,
                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(5.dp))
                Text(
                    text = "₹${"%,.0f".format(service.priceInr)}",
                    style = ServicePriceStyle
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

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
