package com.ghartak.customer.ui.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.ghartak.customer.R
import com.ghartak.customer.data.session.SessionManager
import com.ghartak.customer.ui.components.EnvironmentSwitcherDialog
import com.ghartak.customer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerAuthScreen(
    viewModel: CustomerAuthViewModel,
    onLoginSuccess: () -> Unit
) {
    val state by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val sessionManager = remember { SessionManager(context) }
    var logoClickCount by remember { mutableStateOf(0) }
    var lastClickTime by remember { mutableStateOf(0L) }
    var showEnvSwitcher by remember { mutableStateOf(false) }

    val googleSignInOptions = remember {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken("909074400529-iocqa69oa75ta26v3u3cmpnctgn05iq6.apps.googleusercontent.com")
            .requestEmail()
            .build()
    }
    val googleSignInClient = remember(context) {
        GoogleSignIn.getClient(context, googleSignInOptions)
    }
    val googleLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            val idToken = account?.idToken
            if (!idToken.isNullOrBlank()) {
                viewModel.loginWithGoogleIdToken(idToken)
            } else {
                val email = account?.email ?: ""
                val name = account?.displayName ?: "Google User"
                if (email.isNotBlank()) {
                    viewModel.loginWithGoogle(email, name)
                }
            }
        } catch (_: Exception) {
            // Dismissed or cancelled by user
        }
    }

    LaunchedEffect(state.isLoggedIn) {
        if (state.isLoggedIn) {
            onLoginSuccess()
        }
    }

    if (showEnvSwitcher) {
        EnvironmentSwitcherDialog(
            currentUrl = sessionManager.getCustomBaseUrl(),
            onDismiss = { showEnvSwitcher = false },
            onApply = { newUrl ->
                sessionManager.setCustomBaseUrl(newUrl)
            }
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Full bleed background: Luxury villa, blue sky with sunburst, and curved waves
        Image(
            painter = painterResource(id = R.drawable.bg_auth_villa),
            contentDescription = null,
            contentScale = ContentScale.Crop,
            modifier = Modifier.fillMaxSize()
        )

        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // ==========================================
            // TOP HERO SECTION: Logo, Slogan, Badges & Electrician Cutout (170.dp)
            // ==========================================
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(170.dp)
            ) {
                // Electrician transparent cutout standing on the right overlooking the villa
                Image(
                    painter = painterResource(id = R.drawable.img_auth_electrician),
                    contentDescription = "GTS Electrician",
                    contentScale = ContentScale.Fit,
                    alignment = Alignment.BottomEnd,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .width(155.dp)
                        .fillMaxHeight()
                )

                // Left Content: GTS Logo + Brand Slogan + 3 Trust Pills
                Column(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(start = 16.dp, top = 20.dp)
                        .fillMaxWidth(0.62f)
                ) {
                    // Logo with secret 6-tap developer environment switcher
                    Box(
                        modifier = Modifier
                            .clickable {
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
                        Image(
                            painter = painterResource(id = R.drawable.logo_gts_nobg),
                            contentDescription = "GTS Logo",
                            modifier = Modifier.height(38.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "ON-DEMAND ELECTRICAL & SAFETY",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        color = SapphireBlue900,
                        letterSpacing = 0.5.sp
                    )

                    Spacer(modifier = Modifier.height(10.dp))

                    // 3 Translucent Trust Chips Row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        HeroTrustChip(
                            icon = Icons.Default.Shield,
                            text = "Verified\nTechnicians"
                        )
                        HeroTrustChip(
                            icon = Icons.Default.Bolt,
                            text = "Safe &\nReliable"
                        )
                        HeroTrustChip(
                            icon = Icons.Default.Home,
                            text = "Homes &\nBusiness"
                        )
                    }
                }
            }

            // ==========================================
            // MAIN FLOATING CARD (Fills 100% to bottom, no awkward cutoff)
            // ==========================================
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
                color = Color.White,
                shadowElevation = 16.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 22.dp, vertical = 14.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    // 1. Dual Capsule Pill Mode Switcher (Sign In vs Register / Sign Up)
                    if (state.mode != "FORGOT_PASSWORD") {
                        Surface(
                            color = Color(0xFFF1F5F9),
                            shape = RoundedCornerShape(50.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(42.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(3.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Sign In Pill
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight()
                                        .clip(RoundedCornerShape(50.dp))
                                        .background(
                                            if (state.mode == "LOGIN") {
                                                Brush.horizontalGradient(
                                                    listOf(GtsHeaderGradientStart, GtsHeaderGradientMid)
                                                )
                                            } else {
                                                Brush.linearGradient(
                                                    listOf(Color.Transparent, Color.Transparent)
                                                )
                                            }
                                        )
                                        .clickable { viewModel.setMode("LOGIN") },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Person,
                                            contentDescription = null,
                                            tint = if (state.mode == "LOGIN") Color.White else Color(0xFF64748B),
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Sign In",
                                            fontSize = 13.sp,
                                            fontWeight = if (state.mode == "LOGIN") FontWeight.Bold else FontWeight.SemiBold,
                                            color = if (state.mode == "LOGIN") Color.White else Color(0xFF64748B)
                                        )
                                    }
                                }

                                // Register / Sign Up Pill
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight()
                                        .clip(RoundedCornerShape(50.dp))
                                        .background(
                                            if (state.mode == "SIGN_UP") {
                                                Brush.horizontalGradient(
                                                    listOf(GtsHeaderGradientStart, GtsHeaderGradientMid)
                                                )
                                            } else {
                                                Brush.linearGradient(
                                                    listOf(Color.Transparent, Color.Transparent)
                                                )
                                            }
                                        )
                                        .clickable { viewModel.setMode("SIGN_UP") },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.PersonAdd,
                                            contentDescription = null,
                                            tint = if (state.mode == "SIGN_UP") Color.White else Color(0xFF64748B),
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Register / Sign Up",
                                            fontSize = 13.sp,
                                            fontWeight = if (state.mode == "SIGN_UP") FontWeight.Bold else FontWeight.SemiBold,
                                            color = if (state.mode == "SIGN_UP") Color.White else Color(0xFF64748B)
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(18.dp))
                    }

                    // 2. Headline & Subtitle
                    val headlineText = when (state.mode) {
                        "SIGN_UP" -> if (state.signUpStep == 1) "Create Your Account" else "Set Password & Location"
                        "FORGOT_PASSWORD" -> "Reset Your Password"
                        else -> "Welcome Back!"
                    }
                    val subtitleText = when (state.mode) {
                        "SIGN_UP" -> "Register for on-demand electrical services in 60 seconds"
                        "FORGOT_PASSWORD" -> "We'll send a 6-digit security code to your email"
                        else -> "Sign in to continue with Ghar Tak Services"
                    }

                    Text(
                        text = headlineText,
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = TextDarkPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = subtitleText,
                        fontSize = 13.sp,
                        color = Color(0xFF64748B)
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    // 3. Error and Success Alert Banners
                    if (!state.errorMessage.isNullOrBlank()) {
                        Surface(
                            color = Color(0xFFFEE2E2),
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFCA5A5)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 14.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = Color(0xFFDC2626),
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = state.errorMessage ?: "",
                                    color = Color(0xFFB91C1C),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    if (!state.successMessage.isNullOrBlank()) {
                        Surface(
                            color = Color(0xFFDCFCE7),
                            shape = RoundedCornerShape(10.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF86EFAC)),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 14.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.CheckCircle,
                                    contentDescription = null,
                                    tint = SuccessGreen,
                                    modifier = Modifier.size(18.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = state.successMessage ?: "",
                                    color = Color(0xFF15803D),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }

                    // ==========================================
                    // 4. SCREEN FORMS (LOGIN / SIGN UP / FORGOT)
                    // ==========================================
                    if (state.mode == "LOGIN") {
                        // Email Field
                        Text(
                            text = "Email Address",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = state.email,
                            onValueChange = { viewModel.onEmailChanged(it) },
                            placeholder = { Text("Enter your registered email", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                            leadingIcon = {
                                Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                            },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SapphireBlue800,
                                unfocusedBorderColor = Color(0xFFE2E8F0)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        // Password Field
                        Text(
                            text = "Password",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextDarkPrimary
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = state.password,
                            onValueChange = { viewModel.onPasswordChanged(it) },
                            placeholder = { Text("Enter your password", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                            leadingIcon = {
                                Icon(imageVector = Icons.Default.Lock, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                            },
                            trailingIcon = {
                                IconButton(onClick = { viewModel.togglePasswordVisibility() }) {
                                    Icon(
                                        imageVector = if (state.isPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                        contentDescription = if (state.isPasswordVisible) "Hide password" else "Show password",
                                        tint = Color(0xFF94A3B8),
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            },
                            visualTransformation = if (state.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = SapphireBlue800,
                                unfocusedBorderColor = Color(0xFFE2E8F0)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        )

                        // Forgot Password Link
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End
                        ) {
                            TextButton(
                                onClick = { viewModel.setMode("FORGOT_PASSWORD") },
                                contentPadding = PaddingValues(0.dp)
                            ) {
                                Text(
                                    text = "Forgot Password?",
                                    fontSize = 12.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SapphireBlue800
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Primary Action Button (Sign In with Circular Forward Arrow)
                        Button(
                            onClick = { viewModel.loginWithPassword() },
                            enabled = !state.isLoading,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800),
                            contentPadding = PaddingValues(horizontal = 16.dp)
                        ) {
                            if (state.isLoading) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(22.dp),
                                    color = Color.White,
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Spacer(modifier = Modifier.width(32.dp))
                                    Text(
                                        text = "Sign In",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 15.sp,
                                        color = Color.White
                                    )
                                    Box(
                                        modifier = Modifier
                                            .size(32.dp)
                                            .clip(CircleShape)
                                            .background(Color.White.copy(alpha = 0.22f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.ArrowForward,
                                            contentDescription = null,
                                            tint = Color.White,
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(18.dp))

                        // "OR" Divider
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Divider(modifier = Modifier.weight(1f), color = Color(0xFFE2E8F0))
                            Text(
                                text = "OR",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF94A3B8),
                                modifier = Modifier.padding(horizontal = 12.dp)
                            )
                            Divider(modifier = Modifier.weight(1f), color = Color(0xFFE2E8F0))
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // "Continue with Google" Button
                        Surface(
                            onClick = {
                                try {
                                    googleSignInClient.signOut().addOnCompleteListener {
                                        googleLauncher.launch(googleSignInClient.signInIntent)
                                    }
                                } catch (_: Exception) {
                                    googleLauncher.launch(googleSignInClient.signInIntent)
                                }
                            },
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0)),
                            color = Color.White,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(46.dp),
                            shadowElevation = 0.5.dp
                        ) {
                            Row(
                                modifier = Modifier.fillMaxSize(),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.ic_google_logo),
                                    contentDescription = "Google Logo",
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Continue with Google",
                                    fontSize = 13.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = TextDarkPrimary
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        // Switch to Register Prompt
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Don't have an account? ",
                                fontSize = 12.5.sp,
                                color = Color(0xFF64748B)
                            )
                            Text(
                                text = "Register / Sign Up",
                                fontSize = 12.5.sp,
                                fontWeight = FontWeight.Bold,
                                color = SapphireBlue800,
                                modifier = Modifier.clickable { viewModel.setMode("SIGN_UP") }
                            )
                        }

                    } else if (state.mode == "SIGN_UP") {
                        // SIGN UP MODE
                        if (state.signUpStep == 1) {
                            // Step 1: Name + Email + OTP
                            Text(
                                text = "Full Name",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = state.fullName,
                                onValueChange = { viewModel.onFullNameChanged(it) },
                                placeholder = { Text("Enter your full name", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                                leadingIcon = {
                                    Icon(imageVector = Icons.Default.Person, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                                },
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = SapphireBlue800,
                                    unfocusedBorderColor = Color(0xFFE2E8F0)
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )

                            Spacer(modifier = Modifier.height(14.dp))

                            Text(
                                text = "Email Address",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = TextDarkPrimary
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            OutlinedTextField(
                                value = state.email,
                                onValueChange = { viewModel.onEmailChanged(it) },
                                placeholder = { Text("name@example.com", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                                leadingIcon = {
                                    Icon(imageVector = Icons.Default.Email, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                                },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = SapphireBlue800,
                                    unfocusedBorderColor = Color(0xFFE2E8F0)
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )

                            AnimatedVisibility(visible = state.isOtpSent) {
                                Column(modifier = Modifier.fillMaxWidth()) {
                                    Spacer(modifier = Modifier.height(14.dp))
                                    Text(
                                        text = "6-Digit Email Verification Code",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = TextDarkPrimary
                                    )
                                    Spacer(modifier = Modifier.height(6.dp))
                                    OutlinedTextField(
                                        value = state.otpCode,
                                        onValueChange = { viewModel.onOtpChanged(it) },
                                        placeholder = { Text("Enter 6-digit code", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                                        leadingIcon = {
                                            Icon(imageVector = Icons.Default.Security, contentDescription = null, tint = SapphireBlue800, modifier = Modifier.size(18.dp))
                                        },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                        singleLine = true,
                                        shape = RoundedCornerShape(12.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = SapphireBlue800,
                                            unfocusedBorderColor = Color(0xFFE2E8F0)
                                        ),
                                        modifier = Modifier.fillMaxWidth()
                                    )
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
                                        TextButton(onClick = { viewModel.sendSignUpOtp() }) {
                                            Text("Resend OTP", fontSize = 11.5.sp, fontWeight = FontWeight.Bold, color = SapphireBlue800)
                                        }
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Button(
                                onClick = {
                                    if (state.isOtpSent) {
                                        viewModel.verifySignUpOtp()
                                    } else {
                                        viewModel.sendSignUpOtp()
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
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                                } else {
                                    val label = if (state.isOtpSent) "VERIFY OTP & PROCEED" else "SEND VERIFICATION CODE"
                                    Text(label, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }

                        } else {
                            // Step 2: Password, Confirm, Phone, Pincode
                            OutlinedTextField(
                                value = state.password,
                                onValueChange = { viewModel.onPasswordChanged(it) },
                                label = { Text("Create Password *") },
                                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = SapphireBlue800) },
                                visualTransformation = if (state.isPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedTextField(
                                value = state.confirmPassword,
                                onValueChange = { viewModel.onConfirmPasswordChanged(it) },
                                label = { Text("Confirm Password *") },
                                leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = SapphireBlue800) },
                                visualTransformation = if (state.isConfirmPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedTextField(
                                value = state.phoneNumber,
                                onValueChange = { viewModel.onPhoneChanged(it) },
                                label = { Text("Mobile Phone Number") },
                                placeholder = { Text("10-digit number") },
                                leadingIcon = { Icon(Icons.Default.Phone, contentDescription = null, tint = SapphireBlue800) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedTextField(
                                value = state.pincode,
                                onValueChange = { viewModel.onPincodeChanged(it) },
                                label = { Text("Pincode * (6-digits)") },
                                leadingIcon = { Icon(Icons.Default.Place, contentDescription = null, tint = SapphireBlue800) },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(14.dp))
                            Button(
                                onClick = { viewModel.completeRegistration() },
                                enabled = !state.isLoading,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = SapphireBlue800)
                            ) {
                                if (state.isLoading) {
                                    CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                                } else {
                                    Text("COMPLETE REGISTRATION & SIGN IN", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text("Already have an account? ", fontSize = 12.5.sp, color = Color(0xFF64748B))
                            Text("Sign In", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = SapphireBlue800, modifier = Modifier.clickable { viewModel.setMode("LOGIN") })
                        }

                    } else {
                        // FORGOT PASSWORD MODE
                        Text("Registered Email Address", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = state.email,
                            onValueChange = { viewModel.onEmailChanged(it) },
                            placeholder = { Text("name@example.com", fontSize = 13.sp, color = Color(0xFF94A3B8)) },
                            leadingIcon = { Icon(Icons.Default.Email, contentDescription = null, tint = SapphireBlue800) },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth()
                        )

                        if (state.forgotStep == 2) {
                            Spacer(modifier = Modifier.height(12.dp))
                            OutlinedTextField(
                                value = state.otpCode,
                                onValueChange = { viewModel.onOtpChanged(it) },
                                label = { Text("6-Digit Email Code *") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedTextField(
                                value = state.password,
                                onValueChange = { viewModel.onPasswordChanged(it) },
                                label = { Text("New Password *") },
                                visualTransformation = PasswordVisualTransformation(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            OutlinedTextField(
                                value = state.confirmPassword,
                                onValueChange = { viewModel.onConfirmPasswordChanged(it) },
                                label = { Text("Confirm New Password *") },
                                visualTransformation = PasswordVisualTransformation(),
                                singleLine = true,
                                shape = RoundedCornerShape(12.dp),
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = {
                                if (state.forgotStep == 1) {
                                    viewModel.sendForgotPasswordOtp()
                                } else {
                                    viewModel.resetPasswordWithOtp()
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
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                val label = if (state.forgotStep == 1) "SEND PASSWORD RESET CODE" else "RESET PASSWORD & SIGN IN"
                                Text(label, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Text("Remembered your password? ", fontSize = 12.5.sp, color = Color(0xFF64748B))
                            Text("Sign In", fontSize = 12.5.sp, fontWeight = FontWeight.Bold, color = SapphireBlue800, modifier = Modifier.clickable { viewModel.setMode("LOGIN") })
                        }
                    }

                    // ==========================================
                    // 5. BOTTOM TRUST TELEMETRY BAR
                    // ==========================================
                    Spacer(modifier = Modifier.height(22.dp))
                    Divider(color = Color(0xFFF1F5F9), thickness = 1.dp)
                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Trust 1: 1000+ Verified Experts
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = SuccessGreen,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Column {
                                Text("1000+", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                                Text("Verified Experts", fontSize = 9.sp, color = TextDarkMuted)
                            }
                        }

                        Divider(modifier = Modifier.height(24.dp).width(1.dp), color = Color(0xFFE2E8F0))

                        // Trust 2: 24/7 Emergency Support
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Phone,
                                contentDescription = null,
                                tint = SapphireBlue800,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Column {
                                Text("24/7", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                                Text("Emergency Support", fontSize = 9.sp, color = TextDarkMuted)
                            }
                        }

                        Divider(modifier = Modifier.height(24.dp).width(1.dp), color = Color(0xFFE2E8F0))

                        // Trust 3: Safe Homes
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = null,
                                tint = SapphireBlue800,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(5.dp))
                            Column {
                                Text("Safe Homes", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextDarkPrimary)
                                Text("Brighter Tomorrows", fontSize = 9.sp, color = TextDarkMuted)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

// -------------------------------------------------------------
// Component: Top Hero Translucent Trust Chip
// -------------------------------------------------------------
@Composable
private fun HeroTrustChip(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    text: String
) {
    Surface(
        color = Color.White.copy(alpha = 0.88f),
        shape = RoundedCornerShape(8.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.95f))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 6.dp, vertical = 5.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = SapphireBlue800,
                modifier = Modifier.size(14.dp)
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = text,
                fontSize = 8.5.sp,
                fontWeight = FontWeight.Bold,
                color = TextDarkPrimary,
                textAlign = TextAlign.Center,
                lineHeight = 10.sp
            )
        }
    }
}

// -------------------------------------------------------------
// Component: Official 4-Color Google "G" Vector Icon
// -------------------------------------------------------------
@Composable
fun GoogleLogoIcon(modifier: Modifier = Modifier) {
    Image(
        painter = painterResource(id = R.drawable.ic_google_logo),
        contentDescription = "Google Logo",
        modifier = modifier
    )
}

