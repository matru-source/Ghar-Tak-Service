package com.ghartak.customer

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
import com.ghartak.customer.ui.auth.CustomerAuthScreen
import com.ghartak.customer.ui.auth.CustomerAuthViewModel
import com.ghartak.customer.ui.booking.AddressBookingScreen
import com.ghartak.customer.ui.booking.AddressBookingViewModel
import com.ghartak.customer.ui.catalog.CustomerCatalogViewModel
import com.ghartak.customer.ui.home.CustomerHomeScreen
import com.ghartak.customer.ui.payment.PaymentScreen
import com.ghartak.customer.ui.payment.PaymentViewModel
import com.ghartak.customer.ui.signoff.ServiceSignoffScreen
import com.ghartak.customer.ui.signoff.ServiceSignoffViewModel
import com.ghartak.customer.ui.track.CustomerTrackingScreen
import com.ghartak.customer.ui.track.CustomerTrackingViewModel
import com.ghartak.customer.ui.theme.GharTakCustomerTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sessionManager = (application as CustomerApplication).sessionManager
        val authViewModel = CustomerAuthViewModel(sessionManager)
        val catalogViewModel = CustomerCatalogViewModel(sessionManager)
        val bookingViewModel = AddressBookingViewModel(sessionManager)
        val paymentViewModel = PaymentViewModel(sessionManager)
        val trackingViewModel = CustomerTrackingViewModel(sessionManager)
        val signoffViewModel = ServiceSignoffViewModel(sessionManager)

        setContent {
            GharTakCustomerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    val startDestination = if (sessionManager.isLoggedIn()) "home" else "auth"

                    NavHost(navController = navController, startDestination = startDestination) {
                        composable("auth") {
                            CustomerAuthScreen(
                                viewModel = authViewModel,
                                onLoginSuccess = {
                                    catalogViewModel.loadCatalog()
                                    navController.navigate("home") {
                                        popUpTo("auth") { inclusive = true }
                                    }
                                }
                            )
                        }

                        composable("home") {
                            CustomerHomeScreen(
                                viewModel = catalogViewModel,
                                onServiceSelected = { serviceId ->
                                    navController.navigate("booking/$serviceId")
                                },
                                onTrackSelected = { jobId ->
                                    navController.navigate("track/$jobId")
                                },
                                onLogout = {
                                    authViewModel.logout()
                                    catalogViewModel.logout()
                                    sessionManager.clearSession()
                                    navController.navigate("auth") {
                                        popUpTo("home") { inclusive = true }
                                    }
                                }
                            )
                        }

                        // Placeholder routes for Steps 15, 16, 17, 18
                        composable("booking/{serviceId}") { backStackEntry ->
                            val serviceId = backStackEntry.arguments?.getString("serviceId") ?: "srv_fan_install"
                            val allServices = catalogViewModel.uiState.collectAsState().value.services
                            val service = allServices.find { it.id == serviceId }
                                ?: com.ghartak.customer.data.model.ServiceCatalogRegistry.findService(serviceId)
                            if (service != null) {
                                bookingViewModel.initService(service.id, service.title, service.priceInr)
                            }

                            AddressBookingScreen(
                                serviceId = serviceId,
                                viewModel = bookingViewModel,
                                onBack = { navController.popBackStack() },
                                onProceedToPayment = { targetServiceId ->
                                    navController.navigate("payment/$targetServiceId")
                                }
                            )
                        }

                        composable("payment/{serviceId}") { backStackEntry ->
                            val serviceId = backStackEntry.arguments?.getString("serviceId") ?: "srv_fan_install"
                            val bookingState = bookingViewModel.uiState.collectAsState().value
                            val selectedTech = bookingState.selectedTechnician

                            paymentViewModel.initPaymentDetails(
                                serviceId = serviceId,
                                serviceTitle = bookingState.serviceTitle,
                                basePrice = bookingState.basePriceInr,
                                pincode = bookingState.pincode,
                                addressText = "${bookingState.flatNumber}, ${bookingState.streetName}, ${bookingState.landmark}",
                                priority = bookingState.bookingPriority,
                                technicianId = selectedTech.id,
                                technicianName = selectedTech.name,
                                technicianBadge = selectedTech.badge,
                                technicianPhone = selectedTech.phone,
                                stateCode = bookingState.stateCode
                            )

                            PaymentScreen(
                                serviceId = serviceId,
                                viewModel = paymentViewModel,
                                onBack = { navController.popBackStack() },
                                onBookingSuccess = { jobId ->
                                    val currentSelectedTech = bookingViewModel.uiState.value.selectedTechnician
                                    val currentState = bookingViewModel.uiState.value
                                    val cleanState = currentState.stateCode.ifEmpty { sessionManager.getActiveJobStateCode() }
                                    val ticketNo = sessionManager.getActiveJobTicketNumber()

                                    sessionManager.saveActiveJob(
                                        id = jobId,
                                        title = currentState.serviceTitle,
                                        basePrice = currentState.basePriceInr,
                                        gst = currentState.gst18PctInr,
                                        total = currentState.totalPayableInr,
                                        technicianName = currentSelectedTech.name,
                                        technicianBadge = currentSelectedTech.badge,
                                        technicianPhone = currentSelectedTech.phone,
                                        ticketNumber = ticketNo,
                                        stateCode = cleanState,
                                        gstin = currentState.gstinStateCode,
                                        handoverOtp = sessionManager.getActiveJobOtp()
                                    )
                                    sessionManager.setUserPincode(currentState.pincode)

                                    catalogViewModel.updateActiveJob(
                                        id = jobId,
                                        title = currentState.serviceTitle,
                                        technician = currentSelectedTech.name
                                    )

                                    trackingViewModel.setAssignedTechnician(
                                        name = currentSelectedTech.name,
                                        badge = currentSelectedTech.badge,
                                        phone = currentSelectedTech.phone,
                                        rating = currentSelectedTech.ratingValue,
                                        distanceKm = currentSelectedTech.distanceKm,
                                        etaMinutes = currentSelectedTech.etaMinutes,
                                        completedJobs = currentSelectedTech.completedJobs,
                                        ticketNumber = ticketNo
                                    )
                                    trackingViewModel.setServiceDetails(currentState.serviceTitle, ticketNo)

                                    Toast.makeText(this@MainActivity, "⚡ Work Order Dispatched to ${currentSelectedTech.name}!", Toast.LENGTH_LONG).show()
                                    navController.navigate("track/$jobId") {
                                        popUpTo("home")
                                    }
                                }
                            )
                        }

                        composable("track/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: sessionManager.getActiveJobId()
                            val bookingState = bookingViewModel.uiState.collectAsState().value
                            val selectedTech = bookingState.selectedTechnician

                            LaunchedEffect(jobId) {
                                trackingViewModel.initTracking(jobId)
                                val activeTitle = if (bookingState.basePriceInr > 0) bookingState.serviceTitle else sessionManager.getActiveJobTitle()
                                val activeTicket = sessionManager.getActiveJobTicketNumber()
                                trackingViewModel.setServiceDetails(activeTitle, activeTicket)
                                if (selectedTech.name != "Rajesh Kumar") {
                                    trackingViewModel.setAssignedTechnician(
                                        name = selectedTech.name,
                                        badge = selectedTech.badge,
                                        phone = selectedTech.phone,
                                        rating = selectedTech.ratingValue,
                                        distanceKm = selectedTech.distanceKm,
                                        etaMinutes = selectedTech.etaMinutes,
                                        completedJobs = selectedTech.completedJobs,
                                        ticketNumber = activeTicket
                                    )
                                }
                            }

                            CustomerTrackingScreen(
                                jobId = jobId,
                                viewModel = trackingViewModel,
                                onBack = { navController.popBackStack() },
                                onProceedToSignoff = { targetJobId ->
                                    navController.navigate("signoff/$targetJobId")
                                }
                            )
                        }

                        composable("signoff/{jobId}") { backStackEntry ->
                            val jobId = backStackEntry.arguments?.getString("jobId") ?: sessionManager.getActiveJobId()
                            val trackState = trackingViewModel.uiState.collectAsState().value
                            val bookingState = bookingViewModel.uiState.collectAsState().value

                            val resolvedTitle = if (bookingState.basePriceInr > 0) bookingState.serviceTitle else sessionManager.getActiveJobTitle()
                            val resolvedBase = if (bookingState.basePriceInr > 0) bookingState.basePriceInr else sessionManager.getActiveJobBasePrice()
                            val resolvedCgst = resolvedBase * 0.09
                            val resolvedSgst = resolvedBase * 0.09
                            val resolvedTotal = resolvedBase + resolvedCgst + resolvedSgst
                            val resolvedState = if (bookingState.stateCode.isNotBlank()) bookingState.stateCode else sessionManager.getActiveJobStateCode()
                            val resolvedGstin = if (bookingState.gstinStateCode.isNotBlank()) bookingState.gstinStateCode else sessionManager.getActiveJobGstin()
                            val resolvedTicket = if (trackState.ticketNumber.isNotBlank()) trackState.ticketNumber else sessionManager.getActiveJobTicketNumber()

                            LaunchedEffect(jobId, trackState.technicianName) {
                                signoffViewModel.initSignoff(
                                    jobId = jobId,
                                    technicianName = trackState.technicianName,
                                    technicianBadge = trackState.technicianBadge,
                                    stateCode = resolvedState,
                                    gstin = resolvedGstin,
                                    serviceTitle = resolvedTitle,
                                    basePrice = resolvedBase,
                                    cgst = resolvedCgst,
                                    sgst = resolvedSgst,
                                    total = resolvedTotal,
                                    ticketNumber = resolvedTicket
                                )
                            }

                            ServiceSignoffScreen(
                                jobId = jobId,
                                viewModel = signoffViewModel,
                                onBack = { navController.popBackStack() },
                                onReturnHome = {
                                    navController.navigate("home") {
                                        popUpTo("home") { inclusive = true }
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
