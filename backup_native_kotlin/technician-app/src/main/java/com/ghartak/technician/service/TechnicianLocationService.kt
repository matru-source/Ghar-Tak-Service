package com.ghartak.technician.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.TelemetryPingRequest
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.*

class TechnicianLocationService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var telemetryJob: Job? = null
    private var isRunning = false
    private var activeJobId: String? = null
    private var wakeLock: android.os.PowerManager.WakeLock? = null

    private var activeLocationManager: android.location.LocationManager? = null
    private var activeLocationListener: android.location.LocationListener? = null

    private var sensorManager: android.hardware.SensorManager? = null
    private var compassSensor: android.hardware.Sensor? = null
    private var lastCompassHeadingDeg: Double = 0.0

    private val sensorListener = object : android.hardware.SensorEventListener {
        override fun onSensorChanged(event: android.hardware.SensorEvent?) {
            if (event == null) return
            try {
                if (event.sensor.type == android.hardware.Sensor.TYPE_ROTATION_VECTOR) {
                    val rotationMatrix = FloatArray(9)
                    android.hardware.SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values)
                    val orientation = FloatArray(3)
                    android.hardware.SensorManager.getOrientation(rotationMatrix, orientation)
                    val azimuthDeg = Math.toDegrees(orientation[0].toDouble())
                    lastCompassHeadingDeg = (azimuthDeg + 360.0) % 360.0
                } else if (event.sensor.type == android.hardware.Sensor.TYPE_ORIENTATION) {
                    lastCompassHeadingDeg = (event.values[0].toDouble() + 360.0) % 360.0
                }
            } catch (e: Throwable) {
                // Ignore sensor calculation exceptions
            }
        }

        override fun onAccuracyChanged(sensor: android.hardware.Sensor?, accuracy: Int) {}
    }

    companion object {
        const val ACTION_START = "ACTION_START_TELEMETRY"
        const val ACTION_STOP = "ACTION_STOP_TELEMETRY"
        const val EXTRA_JOB_ID = "EXTRA_JOB_ID"
        private const val CHANNEL_ID = "channel_gts_telemetry"
        private const val NOTIFICATION_ID = 4091

        fun requestBatteryOptimizationWhitelist(context: Context) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    val powerManager = context.getSystemService(Context.POWER_SERVICE) as? android.os.PowerManager
                    val packageName = context.packageName
                    if (powerManager != null && !powerManager.isIgnoringBatteryOptimizations(packageName)) {
                        val intent = Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                            data = android.net.Uri.parse("package:$packageName")
                            flags = Intent.FLAG_ACTIVITY_NEW_TASK
                        }
                        context.startActivity(intent)
                    }
                }
            } catch (e: Throwable) {
                Log.w("GTS_LOC_SVC", "Battery whitelist intent failed safely: ${e.message}")
            }
        }

        fun startService(context: Context, jobId: String? = null) {
            try {
                requestBatteryOptimizationWhitelist(context)

                val hasFine = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val hasCoarse = ContextCompat.checkSelfPermission(context, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
                if (!hasFine && !hasCoarse) {
                    Log.i("GTS_LOC_SVC", "Location permission not yet granted; skipping service start")
                    return
                }

                val intent = Intent(context, TechnicianLocationService::class.java).apply {
                    action = ACTION_START
                    if (!jobId.isNullOrBlank()) {
                        putExtra(EXTRA_JOB_ID, jobId)
                    }
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Throwable) {
                Log.w("GTS_LOC_SVC", "startService safe catch: ${e.message}")
            }
        }

        fun stopService(context: Context) {
            try {
                val intent = Intent(context, TechnicianLocationService::class.java).apply {
                    action = ACTION_STOP
                }
                context.startService(intent)
            } catch (e: Throwable) {
                Log.w("GTS_LOC_SVC", "stopService safe catch: ${e.message}")
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        initCompassSensor()
    }

    private fun initCompassSensor() {
        try {
            sensorManager = getSystemService(Context.SENSOR_SERVICE) as? android.hardware.SensorManager
            compassSensor = sensorManager?.getDefaultSensor(android.hardware.Sensor.TYPE_ROTATION_VECTOR)
                ?: sensorManager?.getDefaultSensor(android.hardware.Sensor.TYPE_ORIENTATION)
            compassSensor?.let {
                sensorManager?.registerListener(sensorListener, it, android.hardware.SensorManager.SENSOR_DELAY_NORMAL)
            }
        } catch (e: Throwable) {
            Log.w("GTS_LOC_SVC", "Compass sensor registration failed: ${e.message}")
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        try {
            when (intent?.action) {
                ACTION_START -> {
                    val incomingJob = intent.getStringExtra(EXTRA_JOB_ID)
                    if (!incomingJob.isNullOrBlank()) {
                        activeJobId = incomingJob
                    }
                    startForegroundServiceInternal()
                }
                ACTION_STOP -> {
                    stopForegroundServiceInternal()
                }
            }
        } catch (e: Throwable) {
            Log.e("GTS_LOC_SVC", "Unhandled exception in onStartCommand: ${e.message}", e)
        }
        return Service.START_STICKY
    }

    private fun startForegroundServiceInternal() {
        if (isRunning) return

        // Safety check for Android 14 location foreground service permissions
        val hasFine = ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED

        val notification = buildForegroundNotification(
            "Active Doorstep Operations",
            "On-duty GPS telemetry broadcast active"
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && (hasFine || hasCoarse)) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION)
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
            isRunning = true

            // Issue 21: Acquire PARTIAL_WAKE_LOCK to prevent Android 14 / OEM Doze mode from killing GPS telemetry
            try {
                val pm = getSystemService(Context.POWER_SERVICE) as? android.os.PowerManager
                wakeLock = pm?.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "ghartak:tech_gps_tracking_wakelock")
                wakeLock?.acquire()
                Log.i("GTS_LOC_SVC", "PARTIAL_WAKE_LOCK acquired for continuous Android 14 background transit")
            } catch (e: Throwable) {
                Log.w("GTS_LOC_SVC", "Failed to acquire PARTIAL_WAKE_LOCK: ${e.message}")
            }
        } catch (e: Throwable) {
            Log.w("GTS_LOC_SVC", "startForeground failed safely without crash: ${e.message}")
            stopSelf()
            return
        }

        telemetryJob?.cancel()
        telemetryJob = serviceScope.launch {
            val sessionManager = SessionManager(applicationContext)
            val techId = sessionManager.getTechnicianId()
            val pin = sessionManager.getPincode().ifEmpty { "759001" }
            val (hubLat, hubLng) = com.ghartak.technician.util.IndianPincodeResolver.getCoordinatesForPincode(pin)

            val lm = applicationContext.getSystemService(Context.LOCATION_SERVICE) as? android.location.LocationManager
            var currentLat = hubLat
            var currentLng = hubLng
            var dynamicSpeedKmh = 0.0
            var dynamicHeadingDeg = lastCompassHeadingDeg
            var isGpsActive = false

            // LocationListener for continuous live updates from Android LocationManager
            val locationListener = object : android.location.LocationListener {
                override fun onLocationChanged(loc: android.location.Location) {
                    val isMock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        loc.isMock
                    } else {
                        @Suppress("DEPRECATION")
                        loc.isFromMockProvider
                    }
                    if (isMock) {
                        Log.w("GTS_LOC_SVC", "Security Alert: Simulated mock GPS location rejected (provider=${loc.provider})")
                        return
                    }
                    isGpsActive = true
                    currentLat = loc.latitude
                    currentLng = loc.longitude
                    if (loc.hasSpeed()) {
                        dynamicSpeedKmh = Math.round(loc.speed * 3.6 * 10.0) / 10.0
                    }
                    if (loc.hasBearing() && loc.speed > 0.5f) {
                        dynamicHeadingDeg = Math.round(loc.bearing * 10.0) / 10.0
                    }
                }
                override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) {}
                override fun onProviderEnabled(provider: String) {
                    if (provider == android.location.LocationManager.GPS_PROVIDER) {
                        isGpsActive = true
                    }
                }
                override fun onProviderDisabled(provider: String) {
                    if (provider == android.location.LocationManager.GPS_PROVIDER) {
                        isGpsActive = false
                    }
                }
            }

            activeLocationManager = lm
            activeLocationListener = locationListener

            try {
                if (lm != null && (hasFine || hasCoarse)) {
                    val mainHandler = android.os.Handler(android.os.Looper.getMainLooper())
                    mainHandler.post {
                        try {
                            if (hasFine && lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER)) {
                                lm.requestLocationUpdates(android.location.LocationManager.GPS_PROVIDER, 3000L, 0f, locationListener)
                            }
                            if (lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)) {
                                lm.requestLocationUpdates(android.location.LocationManager.NETWORK_PROVIDER, 3000L, 0f, locationListener)
                            }
                        } catch (se: SecurityException) {
                            Log.w("GTS_LOC_SVC", "Location update registration security exception: ${se.message}")
                        }
                    }
                }
            } catch (e: Throwable) {
                Log.w("GTS_LOC_SVC", "Location listener setup error: ${e.message}")
            }

            while (isRunning && isActive) {
                try {
                    val isOnline = sessionManager.isOnline()
                    if (!isOnline && activeJobId.isNullOrBlank()) {
                        Log.i("GTS_LOC_SVC", "Technician off-duty and no active job assigned; terminating telemetry service")
                        stopForegroundServiceInternal()
                        break
                    }

                    val isGpsProviderOn = lm?.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER) == true
                    val isNetworkProviderOn = lm?.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER) == true
                    val hasLocationPermission = hasFine || hasCoarse

                    if (!hasLocationPermission || (!isGpsProviderOn && !isNetworkProviderOn)) {
                        isGpsActive = false
                    }

                    // Best effort check across all location providers
                    if (lm != null && hasLocationPermission) {
                        try {
                            var best: android.location.Location? = null
                            val providers = listOf(
                                android.location.LocationManager.GPS_PROVIDER,
                                android.location.LocationManager.NETWORK_PROVIDER,
                                android.location.LocationManager.PASSIVE_PROVIDER
                            )
                            for (p in providers) {
                                try {
                                    val loc = lm.getLastKnownLocation(p)
                                    if (loc != null) {
                                        val isMock = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                            loc.isMock
                                        } else {
                                            @Suppress("DEPRECATION")
                                            loc.isFromMockProvider
                                        }
                                        if (isMock) {
                                            Log.w("GTS_LOC_SVC", "Security Alert: Skipping mock location from provider $p")
                                            continue
                                        }
                                        if (best == null || loc.time > best.time) {
                                            best = loc
                                        }
                                    }
                                } catch (e: SecurityException) {}
                            }
                            if (best != null && (System.currentTimeMillis() - best.time) < 120_000) {
                                isGpsActive = true
                                currentLat = best.latitude
                                currentLng = best.longitude
                                if (best.hasSpeed()) {
                                    dynamicSpeedKmh = Math.round(best.speed * 3.6 * 10.0) / 10.0
                                }
                                if (best.hasBearing() && best.speed > 0.5f) {
                                    dynamicHeadingDeg = Math.round(best.bearing * 10.0) / 10.0
                                }
                            } else if (!isGpsActive) {
                                dynamicSpeedKmh = 0.0
                            }
                        } catch (e: SecurityException) {
                            Log.w("GTS_LOC_SVC", "Location read error: ${e.message}")
                        }
                    }

                    val bm = applicationContext.getSystemService(Context.BATTERY_SERVICE) as? android.os.BatteryManager
                    val dynamicBatteryPct = bm?.getIntProperty(android.os.BatteryManager.BATTERY_PROPERTY_CAPACITY)?.takeIf { it in 0..100 } ?: 88

                    val api = ApiClient.getService(applicationContext)
                    val targetJob = activeJobId ?: "duty_idle"
                    val response = api.sendTelemetry(
                        TelemetryPingRequest(
                            technicianId = techId,
                            jobId = targetJob,
                            latitude = currentLat,
                            longitude = currentLng,
                            heading = dynamicHeadingDeg,
                            speedKmh = dynamicSpeedKmh,
                            batteryLevelPct = dynamicBatteryPct,
                            isOnline = isOnline,
                            isGpsActive = isGpsActive
                        )
                    )

                    if (response.isSuccessful) {
                        val data = response.body()?.data
                        if (!isGpsActive) {
                            updateNotification("GPS Inactive • Centroid Mode", "Please enable GPS for live dispatch tracking • Battery: ${dynamicBatteryPct}%")
                        } else if (activeJobId != null && data != null && data.distanceRemainingKm != null) {
                            val dist = data.distanceRemainingKm
                            val eta = data.etaMinutes ?: 4
                            updateNotification("Doorstep Transit • ${dist} km away", "ETA: ${eta} mins • Speed: ${dynamicSpeedKmh} km/h • Battery: ${dynamicBatteryPct}%")
                        } else {
                            updateNotification("Ghar Tak On-Duty Active", "GPS Synced • Speed: ${dynamicSpeedKmh} km/h • Battery: ${dynamicBatteryPct}%")
                        }
                    }
                } catch (e: Throwable) {
                    Log.w("GTS_LOC_SVC", "Telemetry ping exception: ${e.message}")
                }

                // Foreground ping rate: every 5000ms (5 seconds)
                delay(5000L)
            }
        }
    }

    private fun stopForegroundServiceInternal() {
        isRunning = false
        activeJobId = null
        try {
            sensorManager?.unregisterListener(sensorListener)
        } catch (e: Throwable) {
            // Ignore
        }
        try {
            activeLocationListener?.let { activeLocationManager?.removeUpdates(it) }
            activeLocationListener = null
        } catch (e: Throwable) {
            Log.w("GTS_LOC_SVC", "removeUpdates error: ${e.message}")
        }
        telemetryJob?.cancel()
        telemetryJob = null

        // Issue 3: Explicitly notify backend that technician has gone off-duty
        try {
            val sessionManager = SessionManager(applicationContext)
            val techId = sessionManager.getTechnicianId().ifBlank { sessionManager.getBadgeNumber() }
            if (techId.isNotBlank()) {
                val api = ApiClient.getService(applicationContext)
                serviceScope.launch {
                    try {
                        api.sendTelemetry(
                            TelemetryPingRequest(
                                technicianId = techId,
                                jobId = "duty_idle",
                                latitude = 0.0,
                                longitude = 0.0,
                                isOnline = false,
                                isGpsActive = false
                            )
                        )
                    } catch (e: Throwable) {
                        Log.w("GTS_LOC_SVC", "Offline ping exception: ${e.message}")
                    }
                }
            }
        } catch (e: Throwable) {
            Log.w("GTS_LOC_SVC", "Could not dispatch offline status: ${e.message}")
        }

        try {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } catch (e: Throwable) {
            Log.w("GTS_LOC_SVC", "stopForeground error: ${e.message}")
        }
        stopSelf()
    }


    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Ghar Tak Field Operations Telemetry",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Continuous foreground GPS telemetry broadcast for doorstep transit"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun buildForegroundNotification(title: String, message: String): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    private fun updateNotification(title: String, message: String) {
        try {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(NOTIFICATION_ID, buildForegroundNotification(title, message))
        } catch (e: Throwable) {
            Log.w("GTS_LOC_SVC", "updateNotification error: ${e.message}")
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        try {
            activeLocationListener?.let { activeLocationManager?.removeUpdates(it) }
            activeLocationListener = null
        } catch (e: Throwable) {}

        // Release WakeLock safely when service stops
        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.i("GTS_LOC_SVC", "PARTIAL_WAKE_LOCK released cleanly")
                }
            }
            wakeLock = null
        } catch (e: Throwable) {
            Log.w("GTS_LOC_SVC", "Failed to release wakeLock: ${e.message}")
        }

        telemetryJob?.cancel()
        serviceScope.cancel()
    }
}