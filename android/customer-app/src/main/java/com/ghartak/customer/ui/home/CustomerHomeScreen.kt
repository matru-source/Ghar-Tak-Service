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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
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
import com.ghartak.customer.ui.util.ServiceDrawableHelper.getServiceDrawable

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
    var showNotificationCenter by remember { mutableStateOf(false) }
    var unreadNotificationCount by remember { mutableStateOf(3) }

    if (showEnvSwitcher) {
        EnvironmentSwitcherDialog(
            currentUrl = sessionManager.getCustomBaseUrl(),
            onDismiss = { showEnvSwitcher = false },
            onApply = { newUrl ->
                sessionManager.setCustomBaseUrl(newUrl)
            }
        )
    }

    if (showNotificationCenter) {
        val activeTechName = sessionManager.getActiveJobTechnicianName().ifBlank { "Certified Professional" }
        NotificationCenterDialog(
            unreadCount = unreadNotificationCount,
            technicianName = activeTechName,
            onDismiss = { showNotificationCenter = false },
            onClearAll = {
                unreadNotificationCount = 0
                showNotificationCenter = false
            },
            onTrackLive = {
                showNotificationCenter = false
                currentBottomTab = 2
                onTrackSelected("job_active_01")
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
                                    text = "24/7 Multi-Trade Specialists",
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
                                    showNotificationCenter = true
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Notifications,
                                    contentDescription = "Notifications",
                                    tint = Color(0xFFFFD54F),
                                    modifier = Modifier.size(26.dp)
                                )
                            }
                            if (unreadNotificationCount > 0) {
                                Box(
                                    modifier = Modifier
                                        .size(9.dp)
                                        .align(Alignment.TopEnd)
                                        .offset(x = (-6).dp, y = 6.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFEF4444))
                                        .border(1.5.dp, Color.White, CircleShape)
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // 2. Greeting Headline & Subtitle with Night Villa House Overlay (Image 1 Match)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            val firstName = remember(state.userName) {
                                state.userName.trim().split(" ").firstOrNull() ?: state.userName
                            }
                            val displayPincode = remember(state.activePincode) {
                                sessionManager.getUserPincode().ifEmpty { state.activePincode }.ifEmpty { "760001" }
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "Hello, $firstName!",
                                    style = GreetingHeadlineStyle
                                )
                                // Pincode badge right beside Hello, Matru! (User Request Match)
                                Surface(
                                    color = Color.White.copy(alpha = 0.22f),
                                    shape = RoundedCornerShape(12.dp),
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.45f))
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.5.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.LocationOn,
                                            contentDescription = "Pincode",
                                            tint = Color.White,
                                            modifier = Modifier.size(13.dp)
                                        )
                                        Spacer(modifier = Modifier.width(3.dp))
                                        Text(
                                            text = displayPincode,
                                            color = Color.White,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.ExtraBold
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "Professional Multi-Trade Services at Your Doorstep",
                                style = SubGreetingStyle
                            )
                        }

                        Spacer(modifier = Modifier.width(10.dp))

                        // Illuminated Night Villa House Graphic
                        Box(
                            modifier = Modifier
                                .size(width = 100.dp, height = 58.dp)
                                .clip(RoundedCornerShape(14.dp))
                                .border(1.dp, Color.White.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
                        ) {
                            Image(
                                painter = painterResource(id = R.drawable.bg_header_house),
                                contentDescription = "Illuminated Home",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }

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
                                        text = "Search for home services, plumbing, repairs...",
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
                                    Toast.makeText(context, "🎤 Voice Search: Listening for service query...", Toast.LENGTH_SHORT).show()
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
                                1 -> "Book Doorstep Services"
                                2 -> "Order History & Invoices"
                                3 -> "Customer Profile"
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
            // Clean 4-Tab Navigation Bar: Home, Book, History, Profile
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
                    onClick = { currentBottomTab = 2 },
                    icon = { Icon(Icons.Default.ReceiptLong, contentDescription = "History") },
                    label = { Text("History", fontSize = 11.sp, fontWeight = if (currentBottomTab == 2) FontWeight.Bold else FontWeight.Normal) },
                    colors = navColors
                )

                NavigationBarItem(
                    selected = currentBottomTab == 3,
                    onClick = { currentBottomTab = 3 },
                    icon = { Icon(Icons.Default.Person, contentDescription = "Profile") },
                    label = { Text("Profile", fontSize = 11.sp, fontWeight = if (currentBottomTab == 3) FontWeight.Bold else FontWeight.Normal) },
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
            2 -> {
                Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
                    CustomerHistoryView(
                        onBookServiceAgain = {
                            currentBottomTab = 1
                        }
                    )
                }
            }
            3 -> {
                Box(modifier = Modifier.fillMaxSize().padding(innerPadding)) {
                    CustomerProfileView(
                        userName = state.userName,
                        userPhone = state.userPhone,
                        userEmail = state.userEmail,
                        userAddress = state.userAddress,
                        onViewOrders = {
                            currentBottomTab = 2
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
                                    icon = Icons.Default.DateRange,
                                    iconTint = SapphireBlue800,
                                    iconBg = Color(0xFFEFF6FF),
                                    title = "Book Service",
                                    subtitle = "Schedule a service",
                                    onClick = {
                                        currentBottomTab = 1
                                    }
                                )

                                // 2. Track Service Card
                                QuickActionCard(
                                    modifier = Modifier.weight(1f),
                                    icon = Icons.Default.LocationOn,
                                    iconTint = SapphireBlue800,
                                    iconBg = Color(0xFFEFF6FF),
                                    title = "Track Service",
                                    subtitle = "Live updates",
                                    onClick = {
                                        onTrackSelected(state.activeJobId)
                                    }
                                )

                                // 3. History Card
                                QuickActionCard(
                                    modifier = Modifier.weight(1f),
                                    icon = Icons.Default.ReceiptLong,
                                    iconTint = SapphireBlue800,
                                    iconBg = Color(0xFFEFF6FF),
                                    title = "History",
                                    subtitle = "View past services",
                                    onClick = {
                                        currentBottomTab = 2
                                    }
                                )
                            }
                        }
                    }

                    // ==========================================
                    // 2. SECTION: Household service at your doorstep (18 Categories)
                    // ==========================================
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFFFDE68A)),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Household service at your doorstep",
                                        fontSize = 15.sp,
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

                                val allCategoryBadges = remember(state.categories) {
                                    val names = state.categories.filterNot { it.equals("All", ignoreCase = true) }
                                    names.map { resolveCategoryBadge(it) }
                                }
                                val half = (allCategoryBadges.size + 1) / 2
                                val topRowCategories = remember(allCategoryBadges) { allCategoryBadges.take(half) }
                                val bottomRowCategories = remember(allCategoryBadges) { allCategoryBadges.drop(half) }

                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .horizontalScroll(rememberScrollState()),
                                    verticalArrangement = Arrangement.spacedBy(14.dp)
                                ) {
                                    // Row 1 (9 categories)
                                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        topRowCategories.forEach { cat ->
                                            DoorstepCategoryBadge(
                                                item = cat,
                                                isSelected = state.selectedCategory.equals(cat.name, ignoreCase = true),
                                                onClick = {
                                                    viewModel.selectCategory(cat.name)
                                                    currentBottomTab = 1
                                                }
                                            )
                                        }
                                    }

                                    // Row 2 (9 categories)
                                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                        bottomRowCategories.forEach { cat ->
                                            DoorstepCategoryBadge(
                                                item = cat,
                                                isSelected = state.selectedCategory.equals(cat.name, ignoreCase = true),
                                                onClick = {
                                                    viewModel.selectCategory(cat.name)
                                                    currentBottomTab = 1
                                                }
                                            )
                                        }
                                    }
                                }
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
                                    color = Color.White,
                                    shape = ShapeCard,
                                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                                    shadowElevation = 2.dp,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { onTrackSelected(state.activeJobId) }
                                ) {
                                    Column(modifier = Modifier.padding(14.dp)) {
                                        // Top Row: Status Dot & Technician En Route Chip
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
                                                    text = "Active Service",
                                                    color = SapphireBlue800,
                                                    fontSize = 13.5.sp,
                                                    fontWeight = FontWeight.Bold
                                                )
                                            }

                                            val isAwaitingAcceptance = state.activeJobStatus == "ASSIGNED" || state.activeJobStatus == "PENDING_DISPATCH"
                                            Surface(
                                                color = if (isAwaitingAcceptance) Color(0xFFFEF3C7) else Color(0xFFDCFCE7),
                                                shape = RoundedCornerShape(20.dp),
                                                border = androidx.compose.foundation.BorderStroke(1.dp, if (isAwaitingAcceptance) Color(0xFFFDE68A) else Color(0xFFBBF7D0))
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Box(
                                                        modifier = Modifier
                                                            .size(6.dp)
                                                            .clip(CircleShape)
                                                            .background(if (isAwaitingAcceptance) Color(0xFFD97706) else Color(0xFF16A34A))
                                                    )
                                                    Spacer(modifier = Modifier.width(5.dp))
                                                    Text(
                                                        text = if (isAwaitingAcceptance) "Awaiting Confirmation" else "Technician En Route",
                                                        color = if (isAwaitingAcceptance) Color(0xFFB45309) else Color(0xFF15803D),
                                                        fontSize = 10.sp,
                                                        fontWeight = FontWeight.Bold
                                                    )
                                                }
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(12.dp))

                                        // Product Image + Service Info + Technician Info
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            // Service Product Image Thumbnail
                                            Box(
                                                modifier = Modifier
                                                    .size(54.dp)
                                                    .clip(RoundedCornerShape(12.dp))
                                                    .background(Color(0xFFF8FAFC))
                                                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                                                    .padding(3.dp),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Image(
                                                    painter = painterResource(id = getServiceDrawable(state.activeJobTitle)),
                                                    contentDescription = state.activeJobTitle,
                                                    contentScale = ContentScale.Fit,
                                                    modifier = Modifier.fillMaxSize()
                                                )
                                            }

                                            Spacer(modifier = Modifier.width(10.dp))

                                            // Service Name & Location
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(
                                                    text = state.activeJobTitle,
                                                    fontSize = 14.sp,
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
                                                    val activeLocation = remember(state.activePincode) {
                                                        val addr = sessionManager.getUserAddress()
                                                        val pin = sessionManager.getUserPincode().ifEmpty { "760001" }
                                                        if (addr.isNotBlank()) "$addr • $pin" else "Brahmapur, Ganjam, Odisha • $pin"
                                                    }
                                                    Text(
                                                        text = activeLocation,
                                                        fontSize = 11.sp,
                                                        color = TextDarkSecondary,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                }
                                            }

                                            Spacer(modifier = Modifier.width(8.dp))

                                            // Technician Avatar & Rating
                                            val activeTechName = remember(state.activeJobTechnician) {
                                                state.activeJobTechnician
                                                    .replace(" (En Route)", "")
                                                    .replace(" (Assigned)", "")
                                                    .trim()
                                                    .ifEmpty { "Service Specialist" }
                                            }
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Image(
                                                    painter = painterResource(id = R.drawable.img_technician_rajesh),
                                                    contentDescription = activeTechName,
                                                    contentScale = ContentScale.Crop,
                                                    modifier = Modifier
                                                        .size(38.dp)
                                                        .clip(CircleShape)
                                                        .border(1.dp, Color(0xFFCBD5E1), CircleShape)
                                                )
                                                Spacer(modifier = Modifier.width(8.dp))
                                                Column {
                                                    Text(
                                                        text = activeTechName,
                                                        fontSize = 12.sp,
                                                        fontWeight = FontWeight.Bold,
                                                        color = TextDarkPrimary
                                                    )
                                                    Text(
                                                        text = "Technician",
                                                        fontSize = 10.sp,
                                                        color = TextDarkMuted
                                                    )
                                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                                        Icon(
                                                            imageVector = Icons.Default.Star,
                                                            contentDescription = null,
                                                            tint = Color(0xFFF59E0B),
                                                            modifier = Modifier.size(11.dp)
                                                        )
                                                        Spacer(modifier = Modifier.width(2.dp))
                                                        Text(
                                                            text = "4.9",
                                                            fontSize = 10.5.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = TextDarkPrimary
                                                        )
                                                    }
                                                }
                                            }
                                        }

                                        Spacer(modifier = Modifier.height(14.dp))
                                        Divider(color = Color(0xFFF1F5F9), thickness = 1.dp)
                                        Spacer(modifier = Modifier.height(12.dp))

                                        // Stepper Row with ETA Pill on Right
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            // 4 Milestones
                                            Row(
                                                modifier = Modifier.weight(1f),
                                                verticalAlignment = Alignment.CenterVertically
                                            ) {
                                                MiniStepItem(label = "Confirmed", isDone = true, isActive = false)
                                                MiniStepDivider(isDone = true)
                                                MiniStepItem(label = "En Route", isDone = false, isActive = true)
                                                MiniStepDivider(isDone = false)
                                                MiniStepItem(label = "At Location", isDone = false, isActive = false)
                                                MiniStepDivider(isDone = false)
                                                MiniStepItem(label = "Completed", isDone = false, isActive = false)
                                            }

                                            Spacer(modifier = Modifier.width(8.dp))

                                            // ETA Pill with Truck Icon
                                            Surface(
                                                color = Color(0xFFEFF6FF),
                                                shape = RoundedCornerShape(10.dp),
                                                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFBFDBFE))
                                            ) {
                                                Row(
                                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                                    verticalAlignment = Alignment.CenterVertically
                                                ) {
                                                    Icon(
                                                        imageVector = Icons.Default.LocalShipping,
                                                        contentDescription = null,
                                                        tint = SapphireBlue800,
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Column {
                                                        Text(
                                                            text = "ETA",
                                                            fontSize = 8.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = TextDarkMuted
                                                        )
                                                        Text(
                                                            text = state.activeJobEta.ifEmpty { "15 mins" },
                                                            fontSize = 11.sp,
                                                            fontWeight = FontWeight.Black,
                                                            color = SapphireBlue800
                                                        )
                                                    }
                                                }
                                            }
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
                            } else {
                                Text(
                                    text = "View All >",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SapphireBlue800,
                                    modifier = Modifier.clickable { currentBottomTab = 1 }
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
// Component: Household Service Doorstep Category Badge (18 Categories)
// -------------------------------------------------------------
data class DoorstepCategory(
    val name: String,
    val icon: ImageVector,
    val iconTint: Color,
    val bgColor: Color
)

val DOORSTEP_CATEGORIES = listOf(
    // Row 1 (9 categories)
    DoorstepCategory("Electrician", Icons.Default.Bolt, Color(0xFFD97706), Color(0xFFFEF3C7)),
    DoorstepCategory("Carpenter", Icons.Default.Carpenter, Color(0xFFB45309), Color(0xFFFEF3C7)),
    DoorstepCategory("Plumber", Icons.Default.Plumbing, Color(0xFF0284C7), Color(0xFFE0F2FE)),
    DoorstepCategory("Cleaner", Icons.Default.CleaningServices, Color(0xFF0D9488), Color(0xFFCCFBF1)),
    DoorstepCategory("Gas Stove Service", Icons.Default.LocalFireDepartment, Color(0xFFEA580C), Color(0xFFFFEDD5)),
    DoorstepCategory("Rajmistri", Icons.Default.Foundation, Color(0xFFB45309), Color(0xFFFEF3C7)),
    DoorstepCategory("Laundry Service", Icons.Default.LocalLaundryService, Color(0xFF059669), Color(0xFFD1FAE5)),
    DoorstepCategory("Packers & Movers", Icons.Default.LocalShipping, Color(0xFFD97706), Color(0xFFFEF3C7)),
    DoorstepCategory("Pest Control Service", Icons.Default.BugReport, Color(0xFF16A34A), Color(0xFFDCFCE7)),

    // Row 2 (9 categories)
    DoorstepCategory("Hot And Cool", Icons.Default.AcUnit, Color(0xFF0284C7), Color(0xFFE0F2FE)),
    DoorstepCategory("House Painting Service", Icons.Default.FormatPaint, Color(0xFFE11D48), Color(0xFFFFE4E6)),
    DoorstepCategory("Wallpaper", Icons.Default.Wallpaper, Color(0xFFC026D3), Color(0xFFFAE8FF)),
    DoorstepCategory("Aluminum And Glass Fitting services", Icons.Default.Window, Color(0xFF0284C7), Color(0xFFE0F2FE)),
    DoorstepCategory("Generator Technician", Icons.Default.Engineering, Color(0xFF475569), Color(0xFFF1F5F9)),
    DoorstepCategory("False Ceiling Service", Icons.Default.Layers, Color(0xFF6366F1), Color(0xFFEEF2FF)),
    DoorstepCategory("IT Service", Icons.Default.Computer, Color(0xFF2563EB), Color(0xFFDBEAFE)),
    DoorstepCategory("Digital Marketer", Icons.Default.Campaign, Color(0xFF9333EA), Color(0xFFF3E8FF)),
    DoorstepCategory("CCTV Service", Icons.Default.Videocam, Color(0xFF4F46E5), Color(0xFFEEF2FF))
)

fun resolveCategoryBadge(name: String): DoorstepCategory {
    val existing = DOORSTEP_CATEGORIES.find { it.name.equals(name, ignoreCase = true) }
    if (existing != null) return existing
    return DoorstepCategory(
        name = name,
        icon = Icons.Default.Handyman,
        iconTint = Color(0xFF0284C7),
        bgColor = Color(0xFFE0F2FE)
    )
}

@Composable
fun DoorstepCategoryBadge(
    item: DoorstepCategory,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(76.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(60.dp)
                .clip(CircleShape)
                .background(item.bgColor)
                .border(
                    width = if (isSelected) 3.dp else 2.dp,
                    color = if (isSelected) SapphireBlue800 else Color(0xFFF59E0B),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = item.name,
                tint = if (isSelected) SapphireBlue800 else item.iconTint,
                modifier = Modifier.size(28.dp)
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = item.name,
            fontSize = 10.5.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.SemiBold,
            color = if (isSelected) SapphireBlue800 else TextDarkPrimary,
            textAlign = TextAlign.Center,
            lineHeight = 13.sp,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis
        )
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
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Service Product Image Thumbnail (Image 1 Match)
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF8FAFC))
                    .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp))
                    .padding(3.dp),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = getServiceDrawable(service.title, service.category)),
                    contentDescription = service.title,
                    contentScale = ContentScale.Fit,
                    modifier = Modifier.fillMaxSize()
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = service.title,
                    fontSize = 13.5.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = TextDarkMuted,
                        modifier = Modifier.size(11.dp)
                    )
                    Spacer(modifier = Modifier.width(3.dp))
                    Text(
                        text = "${service.durationMinutes} mins",
                        fontSize = 10.5.sp,
                        color = TextDarkMuted
                    )
                    Spacer(modifier = Modifier.width(5.dp))
                    Text(text = "|", color = Color(0xFFCBD5E1), fontSize = 10.sp)
                    Spacer(modifier = Modifier.width(5.dp))
                    Text(
                        text = "GST extra",
                        fontSize = 10.5.sp,
                        color = TextDarkMuted
                    )
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = service.description,
                    fontSize = 11.sp,
                    color = TextDarkSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(modifier = Modifier.width(10.dp))

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = "₹${"%,.0f".format(service.priceInr)}",
                    fontSize = 14.5.sp,
                    fontWeight = FontWeight.Black,
                    color = TextDarkPrimary
                )
                Spacer(modifier = Modifier.height(6.dp))
                Button(
                    onClick = onBook,
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                    modifier = Modifier.height(32.dp)
                ) {
                    Text("Book", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}

// -------------------------------------------------------------
// Component: Notification Center Dialog
// -------------------------------------------------------------
@Composable
fun NotificationCenterDialog(
    unreadCount: Int,
    technicianName: String = "Certified Professional",
    onDismiss: () -> Unit,
    onClearAll: () -> Unit,
    onTrackLive: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(GtsHeaderGradientStart.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = null,
                            tint = SapphireBlue800,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Notifications",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )
                }

                if (unreadCount > 0) {
                    TextButton(onClick = onClearAll) {
                        Text("Clear All", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = SapphireBlue800)
                    }
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                if (unreadCount == 0) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = SuccessGreen,
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "All caught up!",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextDarkPrimary
                            )
                            Text(
                                text = "No new service alerts right now.",
                                fontSize = 12.sp,
                                color = TextDarkMuted
                            )
                        }
                    }
                } else {
                    // Notification Item 1: Dispatch Alert
                    NotificationCard(
                        icon = Icons.Default.Bolt,
                        iconTint = SapphireBlue800,
                        iconBg = Color(0xFFEFF6FF),
                        title = "Technician En Route",
                        subtitle = "${technicianName.ifBlank { "Certified Professional" }} is on the way to your doorstep. ETA ~15 mins.",
                        time = "10 mins ago",
                        actionLabel = "Track Live >",
                        onAction = onTrackLive
                    )

                    // Notification Item 2: Security Interlock OTP
                    NotificationCard(
                        icon = Icons.Default.Shield,
                        iconTint = SuccessGreen,
                        iconBg = Color(0xFFDCFCE7),
                        title = "Safety Handover OTP: #8492",
                        subtitle = "Share this 4-digit security code with technician only upon arrival and equipment inspection.",
                        time = "22 mins ago"
                    )

                    // Notification Item 3: AMC Benefit
                    NotificationCard(
                        icon = Icons.Default.Star,
                        iconTint = Color(0xFFD97706),
                        iconBg = Color(0xFFFEF3C7),
                        title = "ZEX-Shield AMC Active",
                        subtitle = "Your comprehensive doorstep service protection is active. You have 2 free scheduled audits remaining.",
                        time = "2 hours ago"
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Close", fontWeight = FontWeight.Bold)
            }
        },
        shape = RoundedCornerShape(20.dp),
        containerColor = Color.White
    )
}

@Composable
private fun NotificationCard(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    iconBg: Color,
    title: String,
    subtitle: String,
    time: String,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null
) {
    Surface(
        color = Color(0xFFF8FAFC),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(30.dp)
                        .clip(CircleShape)
                        .background(iconBg),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(16.dp))
                }
                Spacer(modifier = Modifier.width(8.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                    Text(text = time, fontSize = 10.sp, color = TextDarkMuted)
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = subtitle, fontSize = 11.5.sp, color = Color(0xFF475569), lineHeight = 16.sp)

            if (actionLabel != null && onAction != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onAction,
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(28.dp),
                    shape = RoundedCornerShape(6.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                ) {
                    Text(text = actionLabel, fontSize = 10.5.sp, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}
