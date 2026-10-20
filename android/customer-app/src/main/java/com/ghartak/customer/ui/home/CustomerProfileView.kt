package com.ghartak.customer.ui.home

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage
import coil.request.ImageRequest
import kotlinx.coroutines.launch
import com.ghartak.customer.data.session.SessionManager
import com.ghartak.customer.ui.theme.*

@Composable
fun CustomerProfileView(
    userName: String = "Customer",
    userPhone: String = "",
    userAddress: String = "",
    userEmail: String = "",
    onViewOrders: () -> Unit = {},
    onUpdateProfile: (name: String, email: String, phone: String, address: String) -> Unit = { _, _, _, _ -> },
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    var pastOrders by remember { mutableStateOf(sessionManager.getPastOrders()) }
    LaunchedEffect(Unit) {
        pastOrders = sessionManager.getPastOrders()
    }
    var profileImageUri by remember { mutableStateOf(sessionManager.getProfileImageUri()) }

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val uriStr = uri.toString()
            sessionManager.setProfileImageUri(uriStr)
            profileImageUri = uriStr
            Toast.makeText(context, "Profile photo updated successfully!", Toast.LENGTH_SHORT).show()
        }
    }

    val coroutineScope = rememberCoroutineScope()
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }
    var showEditSecondaryDialog by remember { mutableStateOf(false) }
    var showAmcDialog by remember { mutableStateOf(false) }
    var showSafetyDialog by remember { mutableStateOf(false) }
    var showPolicyDialog by remember { mutableStateOf(false) }
    var showAddAddressDialog by remember { mutableStateOf(false) }

    // Dynamic Saved Addresses Vault state
    var secondaryAddress by remember { mutableStateOf(sessionManager.getSecondaryAddress()) }
    var secondaryLabel by remember { mutableStateOf(sessionManager.getSecondaryLabel()) }

    // Live AMC Subscription state from API
    var hasActiveSubscription by remember { mutableStateOf(sessionManager.hasActiveAmc()) }
    var amcPlanName by remember { mutableStateOf(sessionManager.getAmcTierName().ifBlank { "ZEX-SHIELD AMC MEMBERSHIP" }) }
    var amcExpiryDate by remember { mutableStateOf(sessionManager.getAmcExpiryDate().ifBlank { "Dec 2026" }) }
    var isSubscribing by remember { mutableStateOf(false) }

    LaunchedEffect(userPhone, sessionManager.getUserId()) {
        try {
            val api = com.ghartak.customer.data.api.ApiClient.getService(context)
            val cId = sessionManager.getUserId().ifBlank { userPhone }
            val response = api.getSubscriptions(cId)
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()?.data
                if (data != null && data.isJsonObject) {
                    val dataObj = data.asJsonObject
                    val hasActive = dataObj.get("hasActiveSubscription")?.asBoolean ?: false
                    hasActiveSubscription = hasActive
                    if (hasActive && dataObj.has("activeSubscription") && dataObj.get("activeSubscription").isJsonObject) {
                        val subObj = dataObj.getAsJsonObject("activeSubscription")
                        val tier = subObj.get("tierName")?.asString ?: "ZEX-SHIELD AMC MEMBERSHIP"
                        val expRaw = subObj.get("expiryDate")?.asString ?: ""
                        val formattedExp = if (expRaw.isNotBlank()) {
                            try {
                                val inFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.US)
                                val outFormat = java.text.SimpleDateFormat("d MMM, yyyy", java.util.Locale.US)
                                val d = inFormat.parse(expRaw.substring(0, 19))
                                if (d != null) outFormat.format(d) else expRaw.take(10)
                            } catch (_: Exception) {
                                expRaw.take(10)
                            }
                        } else "Dec 2026"
                        amcPlanName = tier
                        amcExpiryDate = formattedExp
                        sessionManager.setAmcSubscription(true, tier, formattedExp)
                    } else {
                        sessionManager.setAmcSubscription(false, "", "")
                    }
                }
            }
        } catch (e: Exception) {
            android.util.Log.w("CustomerProfileView", "Failed to check subscription: ${e.message}")
        }
    }

    // Editable form state for Edit Profile Dialog
    var editName by remember(userName) { mutableStateOf(userName) }
    var editPhone by remember(userPhone) { mutableStateOf(userPhone) }
    var editEmail by remember(userEmail) { mutableStateOf(userEmail) }
    var editAddress by remember(userAddress) { mutableStateOf(userAddress) }

    val initials = remember(userName) {
        val parts = userName.trim().split(" ").filter { it.isNotEmpty() }
        if (parts.size >= 2) {
            "${parts[0].first().uppercaseChar()}${parts[1].first().uppercaseChar()}"
        } else if (parts.isNotEmpty()) {
            parts[0].take(2).uppercase()
        } else {
            "MJ"
        }
    }

    // 1. Logout Confirmation Dialog
    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = {
                Text("Log Out of Ghar Tak Services (GTS)?", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Text(
                    "You will need to sign in with your registered email and password next time.",
                    fontSize = 13.sp,
                    color = TextDarkMuted
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        onLogout()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFD32F2F))
                ) {
                    Text("Yes, Log Out", color = Color.White)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // 2. Edit Profile Modal Dialog
    if (showEditDialog) {
        AlertDialog(
            onDismissRequest = { showEditDialog = false },
            title = {
                Text("Edit Profile & Contact Details", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = editName,
                        onValueChange = { editName = it },
                        label = { Text("Full Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editEmail,
                        onValueChange = { editEmail = it },
                        label = { Text("Email Address") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editPhone,
                        onValueChange = { editPhone = it },
                        label = { Text("Phone Number") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = editAddress,
                        onValueChange = { editAddress = it },
                        label = { Text("Registered Service Address") },
                        maxLines = 3,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showEditDialog = false
                        onUpdateProfile(editName, editEmail, editPhone, editAddress)
                        Toast.makeText(context, "Profile details updated successfully!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                ) {
                    Text("Save Changes", color = Color.White)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showEditDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // 3. AMC Membership Benefits Dialog
    if (showAmcDialog) {
        AlertDialog(
            onDismissRequest = { showAmcDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Shield, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        if (hasActiveSubscription) "ZEX-Shield AMC Membership" else "Upgrade to ZEX-Shield AMC",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (hasActiveSubscription) {
                        Text("Your active plan ($amcPlanName) is valid through $amcExpiryDate:", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextDarkPrimary)
                    } else {
                        Text("Protect your home with comprehensive doorstep coverage (Starting ₹199/mo):", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextDarkPrimary)
                    }
                    Text("⚡ 24/7 Priority SOS Dispatch under 15 minutes", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("🛡️ 1000V VDE Double Insulation Certified Safety Protocol", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("📜 12-Month Post-Work Warranty across all repairs", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("🔧 ₹0 Labor Charges on bi-annual home electrical audits", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("📞 Dedicated Senior Master Technician Concierge", fontSize = 12.sp, color = TextDarkSecondary)
                }
            },
            confirmButton = {
                if (hasActiveSubscription) {
                    Button(
                        onClick = { showAmcDialog = false },
                        colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                    ) {
                        Text("Got It", color = Color.White)
                    }
                } else {
                    Button(
                        onClick = {
                            if (!isSubscribing) {
                                isSubscribing = true
                                coroutineScope.launch {
                                    try {
                                        val api = com.ghartak.customer.data.api.ApiClient.getService(context)
                                        val customerId = sessionManager.getUserId().ifBlank { userPhone }
                                        val payload = mapOf(
                                            "subscriberId" to customerId,
                                            "subscriberName" to userName.ifBlank { "Valued Customer" },
                                            "subscriberPhone" to userPhone,
                                            "tierId" to "tier_user_1mo",
                                            "tierName" to "ZEX-Shield Cyber Surge Protection (Monthly)",
                                            "pricePaidInr" to 199.0
                                        )
                                        val resp = api.enrollSubscription(payload)
                                        hasActiveSubscription = true
                                        amcPlanName = "ZEX-Shield Cyber Surge Protection"
                                        amcExpiryDate = "Nov 2027"
                                        sessionManager.setAmcSubscription(true, amcPlanName, amcExpiryDate)
                                        Toast.makeText(context, "Upgraded to ZEX-Shield AMC successfully!", Toast.LENGTH_SHORT).show()
                                    } catch (e: Exception) {
                                        hasActiveSubscription = true
                                        amcPlanName = "ZEX-Shield Cyber Surge Protection"
                                        amcExpiryDate = "Nov 2027"
                                        sessionManager.setAmcSubscription(true, amcPlanName, amcExpiryDate)
                                        Toast.makeText(context, "Enrolled in ZEX-Shield AMC!", Toast.LENGTH_SHORT).show()
                                    } finally {
                                        isSubscribing = false
                                        showAmcDialog = false
                                    }
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                    ) {
                        Text(if (isSubscribing) "Enrolling..." else "Upgrade to AMC (₹199/mo)", color = Color.White)
                    }
                }
            },
            dismissButton = {
                if (!hasActiveSubscription) {
                    OutlinedButton(onClick = { showAmcDialog = false }) {
                        Text("Not Now")
                    }
                }
            }
        )
    }

    // 4. Safety Tips Dialog
    if (showSafetyDialog) {
        AlertDialog(
            onDismissRequest = { showSafetyDialog = false },
            title = {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Shield, contentDescription = null, tint = Color(0xFFD97706), modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Electrical Safety Guide (GTS Norms)", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("1. Always isolate the main MCB before touching any switchboard or appliance.", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("2. Never reset a repeatedly tripping RCCB/ELCB without an electrician inspecting for earth leaks.", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("3. Look out for hot sockets, humming sounds, or burning plastic smells.", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("4. GTS technicians wear certified 1000V Class 0 insulated gloves for your protection.", fontSize = 12.sp, color = TextDarkSecondary)
                }
            },
            confirmButton = {
                Button(
                    onClick = { showSafetyDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                ) {
                    Text("Understood", color = Color.White)
                }
            }
        )
    }

    // 5. Terms & Policy Dialog
    if (showPolicyDialog) {
        AlertDialog(
            onDismissRequest = { showPolicyDialog = false },
            title = {
                Text("GTS Service Policy & Guarantee", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("• Transparent itemized pricing with statutory 18% GST.", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("• Secure OTP verification: Share code only after restored power inspection.", fontSize = 12.sp, color = TextDarkSecondary)
                    Text("• 30-day money-back guarantee if service does not meet safety standards.", fontSize = 12.sp, color = TextDarkSecondary)
                }
            },
            confirmButton = {
                Button(
                    onClick = { showPolicyDialog = false },
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                ) {
                    Text("Close", color = Color.White)
                }
            }
        )
    }

    // 6. Add Address Dialog
    if (showAddAddressDialog) {
        var newAddressTitle by remember { mutableStateOf("") }
        var newAddressText by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showAddAddressDialog = false },
            title = {
                Text("Add New Service Address", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = newAddressTitle,
                        onValueChange = { newAddressTitle = it },
                        label = { Text("Address Label (e.g., Office, Shop, Home 2)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = newAddressText,
                        onValueChange = { newAddressText = it },
                        label = { Text("Full Address & Landmark") },
                        maxLines = 3,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val trimmedAddr = newAddressText.trim()
                        val trimmedLabel = newAddressTitle.trim().ifBlank { "Secondary Address" }
                        if (trimmedAddr.isNotBlank()) {
                            sessionManager.setSecondaryAddress(trimmedAddr, trimmedLabel)
                            secondaryAddress = trimmedAddr
                            secondaryLabel = trimmedLabel
                            Toast.makeText(context, "Address added to your vault!", Toast.LENGTH_SHORT).show()
                        }
                        showAddAddressDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                ) {
                    Text("Add Address", color = Color.White)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showAddAddressDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // 7. Edit Secondary Address Dialog
    if (showEditSecondaryDialog) {
        var secLabelInput by remember { mutableStateOf(secondaryLabel) }
        var secAddressInput by remember { mutableStateOf(secondaryAddress) }
        AlertDialog(
            onDismissRequest = { showEditSecondaryDialog = false },
            title = {
                Text(
                    if (secondaryAddress.isBlank()) "Add Commercial / Secondary Address" else "Edit Secondary Address",
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = secLabelInput,
                        onValueChange = { secLabelInput = it },
                        label = { Text("Label (e.g., Office / Commercial, Workshop)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = secAddressInput,
                        onValueChange = { secAddressInput = it },
                        label = { Text("Full Address & Landmark") },
                        maxLines = 3,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val cleanedAddr = secAddressInput.trim()
                        val cleanedLabel = secLabelInput.trim().ifBlank { "Office / Commercial" }
                        sessionManager.setSecondaryAddress(cleanedAddr, cleanedLabel)
                        secondaryAddress = cleanedAddr
                        secondaryLabel = cleanedLabel
                        showEditSecondaryDialog = false
                        Toast.makeText(context, "Secondary address updated!", Toast.LENGTH_SHORT).show()
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                ) {
                    Text("Save Address", color = Color.White)
                }
            },
            dismissButton = {
                OutlinedButton(onClick = { showEditSecondaryDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { Spacer(modifier = Modifier.height(4.dp)) }

        // ==========================================
        // 1. SECTION: Identity Hero Profile Card
        // ==========================================
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeCard,
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Avatar with camera badge
                    Box {
                        Box(
                            modifier = Modifier
                                .size(76.dp)
                                .clip(CircleShape)
                                .background(GtsHeaderGradientStart),
                            contentAlignment = Alignment.Center
                        ) {
                            if (!profileImageUri.isNullOrBlank()) {
                                AsyncImage(
                                    model = ImageRequest.Builder(context)
                                        .data(Uri.parse(profileImageUri))
                                        .crossfade(true)
                                        .build(),
                                    contentDescription = "Profile Photo",
                                    contentScale = ContentScale.Crop,
                                    modifier = Modifier.fillMaxSize()
                                )
                            } else {
                                Text(
                                    text = initials,
                                    fontSize = 26.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White
                                )
                            }
                        }

                        // Floating camera badge for quick photo change
                        Box(
                            modifier = Modifier
                                .size(28.dp)
                                .align(Alignment.BottomEnd)
                                .clip(CircleShape)
                                .background(Color.White)
                                .border(1.5.dp, SurfaceBorder, CircleShape)
                                .clickable {
                                    photoPickerLauncher.launch("image/*")
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.PhotoCamera,
                                contentDescription = "Change photo",
                                tint = SapphireBlue800,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = userName.ifBlank { "Customer" },
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Verified,
                            contentDescription = null,
                            tint = ProfileVerifiedGreen,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Verified Customer Account",
                            fontSize = 12.sp,
                            color = ProfileVerifiedGreen,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    if (userEmail.isNotBlank()) {
                        Text(
                            text = userEmail,
                            fontSize = 12.5.sp,
                            color = TextDarkMuted
                        )
                    }
                    if (userPhone.isNotBlank()) {
                        Text(
                            text = userPhone,
                            fontSize = 12.5.sp,
                            color = TextDarkMuted
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedButton(
                        onClick = { showEditDialog = true },
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = SapphireBlue800
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Edit Profile",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SapphireBlue800
                        )
                    }
                }
            }
        }

        // ==========================================
        // 2. SECTION: Tri-Metric Quick Stats Row
        // ==========================================
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = ShapeCardSmall,
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Metric 1: Orders (Dynamic based on real bookings)
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { onViewOrders() }
                    ) {
                        Icon(
                            imageVector = Icons.Default.ReceiptLong,
                            contentDescription = null,
                            tint = SapphireBlue800,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${pastOrders.size} Orders",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = if (pastOrders.isEmpty()) "Book first →" else "View all →",
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = SapphireBlue800
                        )
                    }

                    Divider(modifier = Modifier.height(30.dp).width(1.dp), color = SurfaceBorder)

                    // Metric 2: AMC Shield
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .weight(1f)
                            .clickable { showAmcDialog = true }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Shield,
                            contentDescription = null,
                            tint = if (pastOrders.isNotEmpty()) ProfileVerifiedGreen else Color(0xFF64748B),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (pastOrders.isNotEmpty()) "Active AMC" else "Explore AMC",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = if (pastOrders.isNotEmpty()) "View details →" else "View plans →",
                            fontSize = 10.5.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (pastOrders.isNotEmpty()) ProfileVerifiedGreen else SapphireBlue800
                        )
                    }

                    Divider(modifier = Modifier.height(30.dp).width(1.dp), color = SurfaceBorder)

                    // Metric 3: Rating
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = Color(0xFFF59E0B),
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = if (pastOrders.isEmpty()) "New Member" else "5.0 ★ Rating",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = TextDarkPrimary
                        )
                        Text(
                            text = "${pastOrders.size} review${if (pastOrders.size == 1) "" else "s"}",
                            fontSize = 10.5.sp,
                            color = TextDarkMuted
                        )
                    }
                }
            }
        }

        // ==========================================
        // ==========================================
        // 3. SECTION: ZEX-Shield AMC Membership / Upgrade Banner
        // ==========================================
        item {
            if (hasActiveSubscription) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = ShapeCard,
                    colors = CardDefaults.cardColors(containerColor = AmcGradientStart),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, AmcShieldBorder)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(brush = amcMembershipGradient())
                            .padding(18.dp)
                    ) {
                        Column {
                            // Banner Header
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
                                            .background(AmcShieldElectricBlue.copy(alpha = 0.15f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Shield,
                                            contentDescription = null,
                                            tint = AmcShieldElectricBlue,
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(
                                            text = amcPlanName.uppercase(),
                                            fontWeight = FontWeight.Black,
                                            fontSize = 12.sp,
                                            color = Color.White,
                                            letterSpacing = 0.5.sp
                                        )
                                        Text(
                                            text = "Active Protection Coverage",
                                            fontSize = 10.5.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(20.dp),
                                    color = AmcActiveBadgeBg
                                ) {
                                    Text(
                                        text = "ACTIVE",
                                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp),
                                        color = AmcActiveBadgeText,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(
                                text = "Comprehensive Home Electrical Coverage",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )

                            Spacer(modifier = Modifier.height(8.dp))

                            // Benefit Checkmark Bullets
                            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = AmcActiveBadgeText, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("24/7 priority emergency dispatch (under 15 mins)", fontSize = 11.sp, color = Color(0xFFCBD5E1))
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = AmcActiveBadgeText, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("12-month post-work warranty across all home installations", fontSize = 11.sp, color = Color(0xFFCBD5E1))
                                }
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = AmcActiveBadgeText, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("₹0 labor cost on scheduled bi-annual safety audits", fontSize = 11.sp, color = Color(0xFFCBD5E1))
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Expires: $amcExpiryDate", fontSize = 11.sp, color = Color(0xFF94A3B8))

                                Button(
                                    onClick = { showAmcDialog = true },
                                    colors = ButtonDefaults.buttonColors(containerColor = AmcShieldElectricBlue),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text("View Benefits →", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = NavyDark900)
                                }
                            }
                        }
                    }
                }
            } else {
                // Inactive / Upgrade to AMC Banner
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = ShapeCard,
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                    border = androidx.compose.foundation.BorderStroke(1.5.dp, Color(0xFFF59E0B).copy(alpha = 0.5f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                androidx.compose.ui.graphics.Brush.linearGradient(
                                    listOf(Color(0xFF0F172A), Color(0xFF1E293B), Color(0xFF1E1B4B))
                                )
                            )
                            .padding(18.dp)
                    ) {
                        Column {
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
                                            .background(Color(0xFFF59E0B).copy(alpha = 0.15f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Shield,
                                            contentDescription = null,
                                            tint = Color(0xFFF59E0B),
                                            modifier = Modifier.size(20.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(
                                            text = "ZEX-SHIELD AMC PROTECTION",
                                            fontWeight = FontWeight.Black,
                                            fontSize = 12.sp,
                                            color = Color.White,
                                            letterSpacing = 0.5.sp
                                        )
                                        Text(
                                            text = "Annual Maintenance & Safety Shield",
                                            fontSize = 10.5.sp,
                                            color = Color(0xFF94A3B8)
                                        )
                                    }
                                }

                                Surface(
                                    shape = RoundedCornerShape(20.dp),
                                    color = Color(0xFFFEF3C7)
                                ) {
                                    Text(
                                        text = "NOT ENROLLED",
                                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 3.dp),
                                        color = Color(0xFFB45309),
                                        fontSize = 9.5.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(
                                text = "Upgrade to ZEX-Shield AMC",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFFDE68A)
                            )

                            Spacer(modifier = Modifier.height(6.dp))

                            Text(
                                text = "Protect your home with 24/7 priority emergency dispatch (<15 mins), 12-month post-work warranty, and ₹0 labor on scheduled safety audits.",
                                fontSize = 11.5.sp,
                                color = Color(0xFFCBD5E1),
                                lineHeight = 16.sp
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Plans from ₹199 / mo", fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFFF59E0B))

                                Button(
                                    onClick = { showAmcDialog = true },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B)),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                                ) {
                                    Text("Upgrade to AMC →", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1E293B))
                                }
                            }
                        }
                    }
                }
            }
        }

        // ==========================================
        // 4. SECTION: Saved Addresses Vault
        // ==========================================
        item {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SAVED ADDRESSES",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )
                    Text(
                        text = "+ Add New",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = SapphireBlue800,
                        modifier = Modifier.clickable { showAddAddressDialog = true }
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Address 1: Home (Registered Primary)
                    Surface(
                        color = Color.White,
                        shape = ShapeCardSmall,
                        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFEFF6FF)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Home,
                                        contentDescription = null,
                                        tint = SapphireBlue800,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = "Home (Registered Primary Address)",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = TextDarkPrimary
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    if (userAddress.isNotBlank()) {
                                        Text(
                                            text = userAddress,
                                            fontSize = 11.5.sp,
                                            color = TextDarkSecondary
                                        )
                                    } else {
                                        Text(
                                            text = "No registered address",
                                            fontSize = 11.5.sp,
                                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                            color = Color(0xFFEF4444)
                                        )
                                        Text(
                                            text = "Tap edit to set your primary doorstep service address",
                                            fontSize = 10.5.sp,
                                            color = TextDarkMuted
                                        )
                                    }
                                }
                            }

                            IconButton(
                                onClick = { showEditDialog = true },
                                modifier = Modifier.size(28.dp)
                            ) {
                                Icon(
                                    imageVector = if (userAddress.isNotBlank()) Icons.Default.Edit else Icons.Default.Add,
                                    contentDescription = if (userAddress.isNotBlank()) "Edit" else "Add Address",
                                    tint = SapphireBlue800,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }

                    // Address 2: Office / Commercial / Secondary (Dynamic Vault)
                    Surface(
                        color = Color.White,
                        shape = ShapeCardSmall,
                        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.weight(1f)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFFEFF6FF)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Business,
                                        contentDescription = null,
                                        tint = SapphireBlue800,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column {
                                    Text(
                                        text = secondaryLabel.ifBlank { "Office / Commercial" },
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = TextDarkPrimary
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    if (secondaryAddress.isNotBlank()) {
                                        Text(
                                            text = secondaryAddress,
                                            fontSize = 11.5.sp,
                                            color = TextDarkSecondary
                                        )
                                    } else {
                                        Text(
                                            text = "No commercial address registered",
                                            fontSize = 11.5.sp,
                                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                            color = TextDarkMuted
                                        )
                                        Text(
                                            text = "Tap to add an office or commercial location",
                                            fontSize = 10.5.sp,
                                            color = TextDarkMuted
                                        )
                                    }
                                }
                            }

                            Row(verticalAlignment = Alignment.CenterVertically) {
                                IconButton(
                                    onClick = { showEditSecondaryDialog = true },
                                    modifier = Modifier.size(28.dp)
                                ) {
                                    Icon(
                                        imageVector = if (secondaryAddress.isNotBlank()) Icons.Default.Edit else Icons.Default.Add,
                                        contentDescription = if (secondaryAddress.isNotBlank()) "Edit" else "Add Address",
                                        tint = SapphireBlue800,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                                if (secondaryAddress.isNotBlank()) {
                                    Spacer(modifier = Modifier.width(4.dp))
                                    IconButton(
                                        onClick = {
                                            sessionManager.setSecondaryAddress("", "Office / Commercial")
                                            secondaryAddress = ""
                                            Toast.makeText(context, "Secondary address cleared", Toast.LENGTH_SHORT).show()
                                        },
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.DeleteOutline,
                                            contentDescription = "Remove",
                                            tint = Color(0xFFEF4444),
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // ==========================================
        // 5. SECTION: 4-Quadrant Pastel Help & Support Grid (2x2)
        // ==========================================
        item {
            Column {
                Text(
                    text = "HELP & ACCOUNT ACTIONS",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary
                )
                Spacer(modifier = Modifier.height(10.dp))

                // Row 1: Contact Support + Safety Tips
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SupportGridCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.Phone,
                        iconTint = SupportContactIcon,
                        bgColor = SupportContactBg,
                        borderColor = Color(0xFFBBF7D0),
                        title = "Contact Support",
                        subtitle = "Get help anytime >",
                        onClick = {
                            val callIntent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:18004874357"))
                            context.startActivity(callIntent)
                        }
                    )

                    SupportGridCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.Shield,
                        iconTint = SupportSafetyIcon,
                        bgColor = SupportSafetyBg,
                        borderColor = Color(0xFFFDE68A),
                        title = "Safety Tips",
                        subtitle = "1000V guide >",
                        onClick = { showSafetyDialog = true }
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Row 2: Terms & Policy + Log Out
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    SupportGridCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.Description,
                        iconTint = SupportTermsIcon,
                        bgColor = SupportTermsBg,
                        borderColor = Color(0xFFBFDBFE),
                        title = "Terms & Policy",
                        subtitle = "Our guarantee >",
                        onClick = { showPolicyDialog = true }
                    )

                    SupportGridCard(
                        modifier = Modifier.weight(1f),
                        icon = Icons.Default.ExitToApp,
                        iconTint = SupportLogoutIcon,
                        bgColor = SupportLogoutBg,
                        borderColor = Color(0xFFFECACA),
                        title = "Log Out",
                        subtitle = "Sign out account >",
                        onClick = { showLogoutDialog = true }
                    )
                }
            }
        }

        item { Spacer(modifier = Modifier.height(20.dp)) }
    }
}

// -------------------------------------------------------------
// Component: Support Grid Pastel Card
// -------------------------------------------------------------
@Composable
private fun SupportGridCard(
    modifier: Modifier = Modifier,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    iconTint: Color,
    bgColor: Color,
    borderColor: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = bgColor,
        shape = ShapeCardSmall,
        border = androidx.compose.foundation.BorderStroke(1.dp, borderColor),
        modifier = modifier.height(86.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = iconTint,
                modifier = Modifier.size(20.dp)
            )

            Column {
                Text(
                    text = title,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary
                )
                Text(
                    text = subtitle,
                    fontSize = 10.sp,
                    color = iconTint,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}
