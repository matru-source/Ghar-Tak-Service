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
            GharTakTechnicianTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
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
                                    navController.navigate("auth") {
                                        popUpTo("dashboard") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("dispatch_alert/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: "job_mh_live_01"
                            val currentJob = dashboardViewModel.uiState.collectAsState().value.assignedJobs.find { it.id == jobId }
                                ?: TechnicianJob(
                                    id = jobId,
                                    jobTicketNumber = "GTS-MH-9821",
                                    serviceTitle = "Emergency High-Voltage Panel Tripping & MCB Replacement",
                                    pincode = "400001",
                                    customerName = "Vikram Deshmukh",
                                    customerPhone = "+919822334455",
                                    customerAddressText = "Flat 402, Sea Crest Towers, Colaba, Mumbai",
                                    customerLatitude = 18.9220,
                                    customerLongitude = 72.8347,
                                    status = "DISPATCHED",
                                    priority = "HIGH_VOLTAGE",
                                    totalAmountInr = 2499.0,
                                    safetyGlovesConfirmed = false,
                                    safetyMcbSwitchConfirmed = false,
                                    handoverOtp = "4819"
                                )

                            DispatchAlertScreen(
                                job = currentJob,
                                viewModel = dispatchAlertViewModel,
                                onAccepted = { acceptedJob ->
                                    Toast.makeText(this@MainActivity, "⚡ Work Order Accepted! Safety Interlock Next", Toast.LENGTH_LONG).show()
                                    dashboardViewModel.acceptIncomingDispatch(acceptedJob)
                                    navController.navigate("safety/${acceptedJob.id}") {
                                        popUpTo("dashboard")
                                    }
                                },
                                onDeclined = {
                                    Toast.makeText(this@MainActivity, "Dispatch Passed to Next Electrician", Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                            )
                        }

                        composable("safety/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: "job_mh_live_01"
                            SafetyInterlockScreen(
                                jobId = jobId,
                                viewModel = safetyViewModel,
                                onBack = { navController.popBackStack() },
                                onSafetyPassed = {
                                    Toast.makeText(this@MainActivity, "⚡ 1000V Safety Interlock Disengaged! Circuit Work Unlocked", Toast.LENGTH_LONG).show()
                                    dashboardViewModel.loadProfileFromSession()
                                    navController.navigate("dashboard") {
                                        popUpTo("dashboard") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("nav/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: "job_mh_live_01"
                            val dashState = dashboardViewModel.uiState.collectAsState().value
                            val currentJob = dashState.assignedJobs.find {
                                it.id.equals(jobId, ignoreCase = true) || it.jobTicketNumber.equals(jobId, ignoreCase = true)
                            } ?: dashState.selectedJob ?: TechnicianJob(
                                id = jobId,
                                jobTicketNumber = "#J-1005",
                                serviceTitle = "Fan Installation",
                                pincode = "400001",
                                customerName = "Amit Sharma",
                                customerPhone = "+91 98765 43210",
                                customerAddressText = "123, Main Street, Mumbai",
                                customerLatitude = 18.9067,
                                customerLongitude = 72.8147,
                                status = "EN_ROUTE",
                                totalAmountInr = 1250.0
                            )
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
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: "job_mh_live_01"
                            val dashState = dashboardViewModel.uiState.collectAsState().value
                            val currentJob = dashState.assignedJobs.find {
                                it.id.equals(jobId, ignoreCase = true) || it.jobTicketNumber.equals(jobId, ignoreCase = true)
                            } ?: dashState.selectedJob ?: TechnicianJob(
                                id = jobId,
                                jobTicketNumber = "#J-1005",
                                serviceTitle = "Fan Installation",
                                pincode = "400001",
                                customerName = "Amit Sharma",
                                customerPhone = "+91 98765 43210",
                                customerAddressText = "123, Main Street, Mumbai",
                                customerLatitude = 18.9067,
                                customerLongitude = 72.8147,
                                status = "COMPLETED",
                                totalAmountInr = 1250.0
                            )
                            jobCompleteViewModel.initJob(currentJob)

                            JobCompleteScreen(
                                jobId = jobId,
                                viewModel = jobCompleteViewModel,
                                onBack = { navController.popBackStack() },
                                onReturnToDashboard = {
                                    dashboardViewModel.loadProfileFromSession()
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
