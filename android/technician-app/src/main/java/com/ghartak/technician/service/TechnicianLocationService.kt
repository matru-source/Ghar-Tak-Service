package com.ghartak.technician.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.ghartak.technician.data.api.ApiClient
import com.ghartak.technician.data.model.TelemetryPingRequest
import com.ghartak.technician.data.session.SessionManager
import kotlinx.coroutines.*

class TechnicianLocationService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var isRunning = false
    private var activeJobId: String? = null

    companion object {
        const val ACTION_START = "ACTION_START_TELEMETRY"
        const val ACTION_STOP = "ACTION_STOP_TELEMETRY"
        const val EXTRA_JOB_ID = "EXTRA_JOB_ID"
        private const val CHANNEL_ID = "channel_gts_telemetry"
        private const val NOTIFICATION_ID = 4091
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                activeJobId = intent.getStringExtra(EXTRA_JOB_ID)
                startForegroundServiceInternal()
            }
            ACTION_STOP -> {
                stopForegroundServiceInternal()
            }
        }
        return START_STICKY
    }

    private fun startForegroundServiceInternal() {
        if (isRunning) return
        isRunning = true

        val notification = buildForegroundNotification("Active Doorstep Navigation", "Streaming live GPS telemetry to customer & partner hub")
        startForeground(NOTIFICATION_ID, notification)

        serviceScope.launch {
            val sessionManager = SessionManager(applicationContext)
            val techId = sessionManager.getTechnicianId()

            // Simulated base transit trajectory in Colaba, Mumbai (18.9220 -> 18.9067)
            var currentLat = 18.9220
            var currentLng = 72.8347
            val destLat = 18.9067
            val destLng = 72.8147

            while (isRunning) {
                try {
                    val api = ApiClient.getService(applicationContext)
                    val response = api.sendTelemetry(
                        TelemetryPingRequest(
                            technicianId = techId,
                            jobId = activeJobId ?: "job_mh_live_01",
                            latitude = currentLat,
                            longitude = currentLng,
                            heading = 195.0,
                            speedKmh = 22.5,
                            batteryLevelPct = 88,
                            isOnline = true
                        )
                    )

                    if (response.isSuccessful) {
                        val data = response.body()?.data
                        val dist = data?.distanceRemainingKm ?: 1.2
                        val eta = data?.etaMinutes ?: 4
                        updateNotification("Doorstep Transit • ${dist} km away", "ETA: ${eta} mins • Live GPS Synced")
                    }
                } catch (e: Exception) {
                    Log.w("GTS_LOC_SVC", "Telemetry ping exception: ${e.message}")
                }

                delay(8000) // 8-second periodic GPS heartbeat
            }
        }
    }

    private fun stopForegroundServiceInternal() {
        isRunning = false
        serviceScope.cancel()
        stopForeground(STOP_FOREGROUND_REMOVE)
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
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(title: String, message: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, buildForegroundNotification(title, message))
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}
