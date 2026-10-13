package com.ghartak.technician.ui.components

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Dns
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.technician.data.session.SessionManager
import com.ghartak.technician.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnvironmentSwitcherDialog(
    currentUrl: String,
    onDismiss: () -> Unit,
    onApply: (String) -> Unit
) {
    val context = LocalContext.current
    var inputUrl by remember { mutableStateOf(currentUrl) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(ElectricOrangeHeader.copy(alpha = 0.12f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Dns,
                        contentDescription = "Environment Switcher",
                        tint = ElectricOrangeHeader,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "Environment Switcher",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextDarkPrimary
                    )
                    Text(
                        text = "DEVELOPER MODE (6-TAP)",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = ElectricOrangeDark,
                        letterSpacing = 0.5.sp
                    )
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Switch API backend between Render cloud demo and your local testing server without reinstalling the APK.",
                    fontSize = 12.sp,
                    color = TextDarkSecondary
                )

                // Currently Active Badge
                Surface(
                    color = Color(0xFFF1F5F9),
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorderLight),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Text(
                            text = "CURRENT ACTIVE BASE URL",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = TextDarkMuted
                        )
                        Spacer(modifier = Modifier.height(3.dp))
                        Text(
                            text = currentUrl,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = ElectricOrangeDark
                        )
                    }
                }

                Text(
                    text = "Quick Presets:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextDarkPrimary
                )

                // Preset 1: Render Production (Client Demo)
                OutlinedCard(
                    onClick = {
                        inputUrl = SessionManager.DEFAULT_BASE_URL
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.outlinedCardColors(
                        containerColor = if (inputUrl == SessionManager.DEFAULT_BASE_URL)
                            ElectricOrangeHeader.copy(alpha = 0.08f)
                        else Color.White
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (inputUrl == SessionManager.DEFAULT_BASE_URL) ElectricOrangeHeader else SurfaceBorderLight
                    )
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "☁️ Production (Client Demo)",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = TextDarkPrimary
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = SessionManager.DEFAULT_BASE_URL,
                            fontSize = 11.sp,
                            color = TextDarkSecondary
                        )
                    }
                }

                // Preset 2: Local Emulator
                val emulatorUrl = "http://10.0.2.2:3000/api/"
                OutlinedCard(
                    onClick = {
                        inputUrl = emulatorUrl
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.outlinedCardColors(
                        containerColor = if (inputUrl == emulatorUrl)
                            ElectricOrangeHeader.copy(alpha = 0.08f)
                        else Color.White
                    ),
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (inputUrl == emulatorUrl) ElectricOrangeHeader else SurfaceBorderLight
                    )
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "⚡ Local Emulator (10.0.2.2)",
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp,
                                color = TextDarkPrimary
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = emulatorUrl,
                            fontSize = 11.sp,
                            color = TextDarkSecondary
                        )
                    }
                }

                // Custom URL Input
                OutlinedTextField(
                    value = inputUrl,
                    onValueChange = { inputUrl = it },
                    label = { Text("Custom API Base URL") },
                    placeholder = { Text("http://192.168.1.X:3000/api/") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                    trailingIcon = {
                        if (inputUrl.isNotBlank()) {
                            IconButton(onClick = { inputUrl = "" }) {
                                Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    }
                )

                Text(
                    text = "💡 For real Android phone on Wi-Fi: use your PC's LAN IP (e.g. http://192.168.1.5:3000/api/). Always include /api/ at the end.",
                    fontSize = 11.sp,
                    color = TextDarkMuted,
                    lineHeight = 15.sp
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val raw = inputUrl.trim()
                    if (raw.isBlank()) {
                        Toast.makeText(context, "URL cannot be blank", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
                        Toast.makeText(context, "URL must start with http:// or https://", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    val sanitized = if (raw.endsWith("/")) raw else "$raw/"
                    onApply(sanitized)
                    Toast.makeText(context, "Backend switched to: $sanitized", Toast.LENGTH_LONG).show()
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = ElectricOrangeHeader),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Save & Apply", color = Color.White, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel", color = TextDarkSecondary)
            }
        }
    )
}
