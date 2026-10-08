package com.ghartak.customer.ui.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ghartak.customer.R
import com.ghartak.customer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerAuthScreen(
    viewModel: CustomerAuthViewModel,
    onLoginSuccess: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.isLoggedIn) {
        if (state.isLoggedIn) {
            onLoginSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SurfaceLight)
            .padding(horizontal = 20.dp, vertical = 24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(Color.White)
                .border(1.dp, SurfaceBorder, RoundedCornerShape(24.dp))
                .padding(24.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Official GTS Logo
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(SapphireBlue900.copy(alpha = 0.08f))
                    .border(1.5.dp, SapphireBlue800.copy(alpha = 0.2f), RoundedCornerShape(20.dp)),
                contentAlignment = Alignment.Center
            ) {
                Image(
                    painter = painterResource(id = R.drawable.logo_gts_nobg),
                    contentDescription = "Ghar Tak Services Logo",
                    modifier = Modifier.size(64.dp)
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = "GHAR TAK SERVICES",
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                color = SapphireBlue900,
                letterSpacing = 0.8.sp
            )

            Text(
                text = "ON-DEMAND ELECTRICAL & SAFETY",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = ElectricCyan,
                letterSpacing = 0.6.sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            Surface(
                color = SapphireBlue800.copy(alpha = 0.07f),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Verified,
                        contentDescription = null,
                        tint = SapphireBlue800,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Brevo Email Verification • 1000V Certified",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = SapphireBlue800
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Mode Selector: SIGN IN vs SIGN UP / REGISTER
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color(0xFFF1F5F9))
                    .padding(4.dp)
            ) {
                Surface(
                    onClick = { viewModel.setMode("LOGIN") },
                    modifier = Modifier.weight(1f),
                    color = if (state.mode == "LOGIN") Color.White else Color.Transparent,
                    shape = RoundedCornerShape(10.dp),
                    shadowElevation = if (state.mode == "LOGIN") 2.dp else 0.dp
                ) {
                    Box(
                        modifier = Modifier.padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Sign In",
                            fontWeight = if (state.mode == "LOGIN") FontWeight.Bold else FontWeight.Medium,
                            fontSize = 13.sp,
                            color = if (state.mode == "LOGIN") SapphireBlue800 else TextDarkMuted
                        )
                    }
                }

                Surface(
                    onClick = { viewModel.setMode("SIGN_UP") },
                    modifier = Modifier.weight(1f),
                    color = if (state.mode == "SIGN_UP") Color.White else Color.Transparent,
                    shape = RoundedCornerShape(10.dp),
                    shadowElevation = if (state.mode == "SIGN_UP") 2.dp else 0.dp
                ) {
                    Box(
                        modifier = Modifier.padding(vertical = 10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Register / Sign Up",
                            fontWeight = if (state.mode == "SIGN_UP") FontWeight.Bold else FontWeight.Medium,
                            fontSize = 13.sp,
                            color = if (state.mode == "SIGN_UP") SapphireBlue800 else TextDarkMuted
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(18.dp))

            // SIGN UP Fields
            if (state.mode == "SIGN_UP" && !state.isOtpSent) {
                OutlinedTextField(
                    value = state.fullName,
                    onValueChange = { viewModel.onFullNameChanged(it) },
                    label = { Text("Full Name") },
                    placeholder = { Text("e.g. Matru Prasad Panda") },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = SapphireBlue800)
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state.phoneNumber,
                    onValueChange = { viewModel.onPhoneChanged(it) },
                    label = { Text("Mobile Number (For Technician)") },
                    placeholder = { Text("9348201604") },
                    prefix = { Text("+91 ", fontWeight = FontWeight.Bold, color = TextDarkPrimary) },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.Phone, contentDescription = null, tint = SapphireBlue800)
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state.address,
                    onValueChange = { viewModel.onAddressChanged(it) },
                    label = { Text("Service Address / Flat No") },
                    placeholder = { Text("Flat 402, Sea Green Apts, Colaba") },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.Home, contentDescription = null, tint = SapphireBlue800)
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state.pincode,
                    onValueChange = { viewModel.onPincodeChanged(it) },
                    label = { Text("Pincode (6-Digits)") },
                    placeholder = { Text("400001") },
                    leadingIcon = {
                        Icon(imageVector = Icons.Default.PinDrop, contentDescription = null, tint = SapphireBlue800)
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))
            }

            // Email Address Input (Primary Authentication Identifier)
            OutlinedTextField(
                value = state.email,
                onValueChange = { viewModel.onEmailChanged(it) },
                label = { Text("Email Address") },
                placeholder = { Text("matruprasadpanda497@gmail.com") },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = SapphireBlue800)
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.EmailAddress),
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                enabled = !state.isOtpSent
            )

            // OTP Input (Shown when Email code has been dispatched)
            AnimatedVisibility(visible = state.isOtpSent) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Spacer(modifier = Modifier.height(14.dp))

                    OutlinedTextField(
                        value = state.otpCode,
                        onValueChange = { viewModel.onOtpChanged(it) },
                        label = { Text("6-Digit Email Code") },
                        placeholder = { Text("e.g. 582914") },
                        leadingIcon = {
                            Icon(imageVector = Icons.Default.Security, contentDescription = null, tint = SapphireBlue800)
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Code sent to ${state.email}",
                            fontSize = 11.sp,
                            color = TextDarkMuted
                        )
                        TextButton(
                            onClick = { viewModel.sendEmailOtp() },
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text("Resend Code", fontSize = 11.sp, color = SapphireBlue800, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Success Message Banner
            if (!state.successMessage.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = SuccessGreenLight,
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SuccessGreen.copy(alpha = 0.5f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(imageVector = Icons.Default.CheckCircle, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = state.successMessage!!,
                            color = Color(0xFF14532D),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }

            // Error Alert Banner
            if (!state.errorMessage.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Surface(
                    color = Color(0xFFFFEBEE),
                    shape = RoundedCornerShape(10.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, DangerRed.copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(imageVector = Icons.Default.Warning, contentDescription = null, tint = DangerRed, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = state.errorMessage!!,
                                color = DangerRed,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        if (state.errorMessage!!.contains("switch to Sign Up", ignoreCase = true)) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Button(
                                onClick = { viewModel.setMode("SIGN_UP") },
                                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.fillMaxWidth().height(36.dp)
                            ) {
                                Text("Switch to Register / Sign Up Now", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Primary Action Button
            Button(
                onClick = {
                    if (state.isOtpSent) {
                        viewModel.verifyOtp()
                    } else {
                        viewModel.sendEmailOtp()
                    }
                },
                enabled = !state.isLoading,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
            ) {
                if (state.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                } else {
                    val label = when {
                        state.isOtpSent -> "VERIFY CODE & PROCEED"
                        state.mode == "SIGN_UP" -> "SEND VERIFICATION CODE TO EMAIL"
                        else -> "SEND LOGIN CODE TO EMAIL"
                    }
                    Text(
                        text = label,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        letterSpacing = 0.5.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 1-Click Demo Shortcut for Matru Prasad Panda
            OutlinedButton(
                onClick = { viewModel.quickDemoLogin("matruprasadpanda497@gmail.com") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(44.dp),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SapphireBlue800.copy(alpha = 0.4f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = SapphireBlue800)
            ) {
                Icon(
                    imageVector = Icons.Default.Bolt,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp),
                    tint = SapphireBlue800
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "⚡ 1-Click Demo (Matru Prasad Panda)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Shield,
                    contentDescription = null,
                    tint = SuccessGreen,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Brevo Verified • 1000V Certified Safety",
                    color = TextDarkMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
