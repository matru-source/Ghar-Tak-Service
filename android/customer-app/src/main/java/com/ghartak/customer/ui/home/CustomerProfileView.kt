package com.ghartak.customer.ui.home

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.customer.ui.theme.*

@Composable
fun CustomerProfileView(
    userName: String = "Amit Sharma",
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    var showLogoutDialog by remember { mutableStateOf(false) }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = {
                Text("Log Out of ElectriCare?", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            },
            text = {
                Text(
                    "You will need to verify your mobile number via OTP next time you sign in.",
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

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { Spacer(modifier = Modifier.height(4.dp)) }

        // User Avatar & Primary Dossier Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(72.dp)
                            .clip(CircleShape)
                            .background(SapphireBlue800),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "AS",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = userName,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Verified,
                            contentDescription = null,
                            tint = SuccessGreen,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Verified Customer Account",
                            fontSize = 12.sp,
                            color = SuccessGreen,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Colaba, Mumbai 400001 • +91 98765 43210",
                        fontSize = 12.sp,
                        color = TextDarkMuted
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Quick Stats Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFFF1F5F9))
                            .padding(vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "3", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = SapphireBlue800)
                            Text(text = "Orders", fontSize = 11.sp, color = TextDarkMuted)
                        }
                        Divider(modifier = Modifier.height(24.dp).width(1.dp), color = Color(0xFFCBD5E1))
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "Active", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = SuccessGreen)
                            Text(text = "AMC Shield", fontSize = 11.sp, color = TextDarkMuted)
                        }
                        Divider(modifier = Modifier.height(24.dp).width(1.dp), color = Color(0xFFCBD5E1))
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(text = "5.0 ★", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = AmberAlert)
                            Text(text = "Rating", fontSize = 11.sp, color = TextDarkMuted)
                        }
                    }
                }
            }
        }

        // ZEX-Shield AMC Card
        item {
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
                            Icon(Icons.Default.Shield, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("ZEX-SHIELD AMC MEMBERSHIP", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = SapphireBlue800)
                        }
                        Surface(
                            shape = RoundedCornerShape(20.dp),
                            color = SuccessGreenLight
                        ) {
                            Text("ACTIVE", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), color = SuccessGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Residential Premium Electrical Protection Plan", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextDarkPrimary)
                    Text("Includes 24/7 priority emergency dispatch and 12-month post-work warranty across all home installations.", fontSize = 11.sp, color = TextDarkMuted)
                }
            }
        }

        // Saved Addresses Card
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("SAVED ADDRESSES", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Home, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text("Home (Primary)", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = TextDarkPrimary)
                                Text("Flat 402, Sea Green Apartments, Colaba, Mumbai 400001", fontSize = 11.sp, color = TextDarkMuted)
                            }
                        }
                    }

                    Divider(color = SurfaceBorder)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Place, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Column {
                                Text("Office / Commercial", fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = TextDarkPrimary)
                                Text("Suite 12, Nariman Point, Mumbai 400021", fontSize = 11.sp, color = TextDarkMuted)
                            }
                        }
                    }
                }
            }
        }

        // App & Support Actions
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("HELP & SUPPORT", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Phone, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("24/7 Emergency Helpline (1800-GTS-HELP)", fontSize = 13.sp, color = TextDarkPrimary)
                        }
                    }

                    Divider(color = SurfaceBorder)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Security, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Terms of Service & Electrical Safety Norms", fontSize = 13.sp, color = TextDarkPrimary)
                        }
                    }
                }
            }
        }

        // Sign Out Button
        item {
            Button(
                onClick = { showLogoutDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFEE2E2)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Icon(Icons.Default.ExitToApp, contentDescription = null, tint = Color(0xFFDC2626), modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(8.dp))
                Text("Log Out from Device", color = Color(0xFFDC2626), fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }

        item { Spacer(modifier = Modifier.height(20.dp)) }
    }
}
