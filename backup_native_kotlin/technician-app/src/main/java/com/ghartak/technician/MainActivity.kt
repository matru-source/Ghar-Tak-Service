package com.ghartak.technician

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ghartak.technician.data.model.TechnicianJob
import com.ghartak.technician.ui.auth.TechnicianAuthScreen
import com.ghartak.technician.ui.auth.TechnicianAuthViewModel
import com.ghartak.technician.ui.dashboard.TechnicianDashboardScreen
import com.ghartak.technician.ui.dashboard.TechnicianDashboardViewModel
import com.ghartak.technician.ui.complete.JobCompleteScreen
import com.ghartak.technician.ui.complete.JobCompleteViewModel
import com.ghartak.technician.ui.dispatch.DispatchAlertScreen
import com.ghartak.technician.ui.dispatch.DispatchAlertViewModel
import com.ghartak.technician.ui.nav.NavigationScreen
import com.ghartak.technician.ui.nav.NavigationViewModel
import com.ghartak.technician.ui.safety.SafetyInterlockScreen
import com.ghartak.technician.ui.safety.SafetyInterlockViewModel
import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOff
import androidx.compose.material3.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.ghartak.technician.ui.theme.GharTakTechnicianTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sessionManager = (application as TechnicianApplication).sessionManager
        val authViewModel = TechnicianAuthViewModel(sessionManager)
        val dashboardViewModel = TechnicianDashboardViewModel(sessionManager)
        val dispatchAlertViewModel = DispatchAlertViewModel(sessionManager)
        val safetyViewModel = SafetyInterlockViewModel(sessionManager)
        val navigationViewModel = NavigationViewModel(sessionManager)
        val jobCompleteViewModel = JobCompleteViewModel(sessionManager)

        setContent {
            val context = this@MainActivity
            var isGpsReady by remember {
                val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val gpsOn = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
                mutableStateOf((hasFine || hasCoarse) && gpsOn)
            }

            val permLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestMultiplePermissions()
            ) { perms ->
                val granted = perms[Manifest.permission.ACCESS_FINE_LOCATION] == true || perms[Manifest.permission.ACCESS_COARSE_LOCATION] == true
                val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
                isGpsReady = granted && gps
            }

            DisposableEffect(Unit) {
                val observer = LifecycleEventObserver { _, event ->
                    if (event == Lifecycle.Event.ON_RESUME) {
                        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                        val hasCoarse = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                        val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
                        isGpsReady = (hasFine || hasCoarse) && gps
                    }
                }
                lifecycle.addObserver(observer)
                onDispose { lifecycle.removeObserver(observer) }
            }

            GharTakTechnicianTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    if (!isGpsReady) {
                        AlertDialog(
                            onDismissRequest = { /* Mandatory - blocking access */ },
                            icon = {
                                Icon(
                                    imageVector = Icons.Default.LocationOff,
                                    contentDescription = null,
                                    tint = Color(0xFFD32F2F),
                                    modifier = Modifier.size(36.dp)
                                )
                            },
                            title = {
                                Text(
                                    text = "Device GPS Location Required",
                                    fontWeight = FontWeight.Bold
                                )
                            },
                            text = {
                                Text(
                                    text = "Ghar Tak requires high-accuracy GPS to broadcast your real-time doorstep arrival ETA to customers and dispatch work orders in your area. Access to the app is restricted until location is active."
                                )
                            },
                            confirmButton = {
                                Button(
                                    onClick = {
                                        val hasFine = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                                        val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
                                        val gps = lm?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true || lm?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true

                                        if (!hasFine) {
                                            permLauncher.launch(
                                                arrayOf(
                                                    Manifest.permission.ACCESS_FINE_LOCATION,
                                                    Manifest.permission.ACCESS_COARSE_LOCATION
                                                )
                                            )
                                        } else if (!gps) {
                                            context.startActivity(Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1D4ED8))
                                ) {
                                    Text("Turn On GPS / Enable Location", fontWeight = FontWeight.Bold)
                                }
                            }
                        )
                    } else {
                        val navController = rememberNavController()
                        val startDestination = if (sessionManager.isLoggedIn()) "dashboard" else "auth"

                        NavHost(navController = navController, startDestination = startDestination) {
                        composable("auth") {
                            TechnicianAuthScreen(
                                viewModel = authViewModel,
                                onLoginSuccess = {
                                    dashboardViewModel.loadProfileFromSession()
                                    navController.navigate("dashboard") {
                                        popUpTo("auth") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("dashboard") {
                            TechnicianDashboardScreen(
                                viewModel = dashboardViewModel,
                                onNavigateToSafety = { jobId ->
                                    navController.navigate("safety/$jobId")
                                },
                                onNavigateToComplete = { jobId ->
                                    navController.navigate("complete/$jobId")
                                },
                                onNavigateToNav = { jobId ->
                                    navController.navigate("nav/$jobId")
                                },
                                onNavigateToDispatchAlert = { jobId ->
                                    navController.navigate("dispatch_alert/$jobId")
                                },
                                onLogout = {
                                    authViewModel.logout()
                                    dashboardViewModel.logout()
                                    Toast.makeText(this@MainActivity, "Signed out from technician console", Toast.LENGTH_SHORT).show()
                                    navController.navigate("auth") {
                                        popUpTo("dashboard") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("dispatch_alert/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
                            val currentJob = dashboardViewModel.getJobById(jobId)
                                ?: dashboardViewModel.uiState.collectAsState().value.assignedJobs.find { it.id == jobId }

                            if (currentJob == null) {
                                LaunchedEffect(jobId) {
                                    Toast.makeText(this@MainActivity, "Dispatch order not found or already assigned", Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                                return@composable
                            }

                            DispatchAlertScreen(
                                job = currentJob,
                                viewModel = dispatchAlertViewModel,
                                onAccepted = { acceptedJob ->
                                    Toast.makeText(this@MainActivity, "⚡ Work Order Accepted! Starting Navigation to Customer", Toast.LENGTH_LONG).show()
                                    dashboardViewModel.acceptIncomingDispatch(acceptedJob)
                                    navController.navigate("nav/${acceptedJob.id}") {
                                        popUpTo("dashboard")
                                    }
                                },
                                onDeclined = {
                                    Toast.makeText(this@MainActivity, "Dispatch Passed to Next Available Partner", Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                            )
                        }

                        composable("safety/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
                            val currentJob = dashboardViewModel.getJobById(jobId)
                                ?: dashboardViewModel.uiState.value.assignedJobs.find { it.id == jobId }
                                ?: dashboardViewModel.uiState.value.selectedJob
                            val jobTitle = currentJob?.serviceTitle ?: "Doorstep Service"
                            val ticket = currentJob?.jobTicketNumber ?: ("#J-" + jobId.takeLast(4).ifEmpty { "1001" })

                            LaunchedEffect(jobId) {
                                safetyViewModel.initJob(jobId, ticket, jobTitle)
                            }

                            val isElectric = jobTitle.lowercase().let {
                                it.contains("electr") || it.contains("wire") || it.contains("mcb") || it.contains("panel") || it.contains("fan") || it.contains("ac") || it.contains("generator")
                            }

                            SafetyInterlockScreen(
                                jobId = jobId,
                                viewModel = safetyViewModel,
                                onBack = { navController.popBackStack() },
                                onSafetyPassed = {
                                    val toastMsg = if (isElectric) {
                                        "⚡ 1000V Safety Interlock Disengaged! Circuit Work Unlocked"
                                    } else {
                                        "✓ Pre-Service Inspection Verified! Service Work Unlocked"
                                    }
                                    Toast.makeText(this@MainActivity, toastMsg, Toast.LENGTH_LONG).show()
                                    dashboardViewModel.markJobStarted(jobId)
                                    navController.navigate("dashboard") {
                                        popUpTo("dashboard") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("nav/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
                            val dashState = dashboardViewModel.uiState.collectAsState().value
                            val currentJob = dashboardViewModel.getJobById(jobId)
                                ?: dashState.assignedJobs.find {
                                    it.id.equals(jobId, ignoreCase = true) || it.jobTicketNumber.equals(jobId, ignoreCase = true)
                                } ?: dashState.selectedJob

                            if (currentJob == null) {
                                LaunchedEffect(jobId) {
                                    Toast.makeText(this@MainActivity, "Job details not found", Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                                return@composable
                            }

                            navigationViewModel.initJob(currentJob)

                            NavigationScreen(
                                jobId = jobId,
                                viewModel = navigationViewModel,
                                onBack = { navController.popBackStack() },
                                onProceedToSafety = { targetJobId ->
                                    navController.navigate("safety/$targetJobId") {
                                        popUpTo("nav/$targetJobId") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("complete/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: ""
                            val dashState = dashboardViewModel.uiState.collectAsState().value
                            val currentJob = dashboardViewModel.getJobById(jobId)
                                ?: dashState.assignedJobs.find {
                                    it.id.equals(jobId, ignoreCase = true) || it.jobTicketNumber.equals(jobId, ignoreCase = true)
                                } ?: dashState.selectedJob

                            if (currentJob == null) {
                                LaunchedEffect(jobId) {
                                    Toast.makeText(this@MainActivity, "Job details not found", Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                                return@composable
                            }

                            jobCompleteViewModel.initJob(currentJob)

                            JobCompleteScreen(
                                jobId = jobId,
                                viewModel = jobCompleteViewModel,
                                onBack = { navController.popBackStack() },
                                onReturnToDashboard = {
                                    dashboardViewModel.markJobCompleted(jobId)
                                    navController.navigate("dashboard") {
                                        popUpTo("dashboard") { inclusive = true }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
}

