package com.ghartak.technician.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.ghartak.technician.MainActivity
import com.ghartak.technician.R
import com.ghartak.technician.data.session.SessionManager
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * High-Priority Firebase Cloud Messaging (FCM) Background Service (Issue 50).
 * Wakes up technician phone when in pocket / screen off via WakeLock and triggers
 * the 60-second dispatch siren audio alert with fullscreen heads-up notification.
 */
class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        const val CHANNEL_ID_SIREN = "ghartak_dispatch_siren_channel"
        const val CHANNEL_NAME_SIREN = "Dispatch Siren & Emergency Alerts"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d("GTS_FCM", "Background FCM message received: ${remoteMessage.data}")

        // 1. Wake phone from sleep/pocket using PowerManager WakeLock
        wakeUpDevice()

        // 2. Parse payload type
        val eventType = remoteMessage.data["type"] ?: "DISPATCH_BROADCAST"
        val ticketNumber = remoteMessage.data["ticketNumber"] ?: remoteMessage.data["jobTicketNumber"] ?: "#J-NEW"
        val serviceTitle = remoteMessage.data["serviceTitle"] ?: "Emergency Work Order"
        val payoutInr = remoteMessage.data["payoutInr"] ?: "450"

        when (eventType) {
            "DISPATCH_BROADCAST", "TECH_DISPATCHED", "NEW_JOB" -> {
                showDispatchSirenNotification(ticketNumber, serviceTitle, payoutInr)
            }
            "EMERGENCY_SOS", "EMERGENCY_SOS_TRIGGERED" -> {
                showEmergencySosNotification(ticketNumber)
            }
            else -> {
                showStandardNotification(
                    title = remoteMessage.notification?.title ?: "Ghar Tak Service Update",
                    message = remoteMessage.notification?.body ?: "Work order $ticketNumber has an update."
                )
            }
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("GTS_FCM", "New FCM Push Registration Token: $token")
        val sessionManager = SessionManager(applicationContext)
        sessionManager.setFcmToken(token)
    }

    private fun wakeUpDevice() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            val wakeLock = pm?.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "ghartak:fcm_dispatch_wakelock"
            )
            wakeLock?.acquire(15000L) // 15 seconds wake lock
        } catch (e: Exception) {
            Log.w("GTS_FCM", "WakeLock acquire error: ${e.message}")
        }
    }

    private fun showDispatchSirenNotification(ticketNumber: String, service: String, payout: String) {
        createNotificationChannel()

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("notification_type", "DISPATCH_SIREN")
            putExtra("ticketNumber", ticketNumber)
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        val vibrationPattern = longArrayOf(0, 1000, 500, 1000, 500, 1000)

        val notification = NotificationCompat.Builder(this, CHANNEL_ID_SIREN)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("🚨 NEW JOB BROADCAST • ₹$payout")
            .setContentText("$service • $ticketNumber. Tap to accept within 60s!")
            .setStyle(NotificationCompat.BigTextStyle().bigText("60-SECOND SIREN: $service at ticket $ticketNumber. Estimated technician payout: ₹$payout. Tap to open radar and claim job!"))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setSound(soundUri)
            .setVibrate(vibrationPattern)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setFullScreenIntent(pendingIntent, true)
            .build()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(ticketNumber.hashCode(), notification)
    }

    private fun showEmergencySosNotification(ticketNumber: String) {
        createNotificationChannel()

        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            1,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID_SIREN)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("🚨 EMERGENCY SOS BROADCAST")
            .setContentText("Emergency alert triggered for Ticket $ticketNumber. Operations Command Center notified.")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(ticketNumber.hashCode() + 1, notification)
    }

    private fun showStandardNotification(title: String, message: String) {
        createNotificationChannel()

        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            2,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID_SIREN)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()

            val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)

            val channel = NotificationChannel(
                CHANNEL_ID_SIREN,
                CHANNEL_NAME_SIREN,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High-priority siren notifications waking device for 60s automated dispatch siren"
                enableLights(true)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 500, 1000, 500, 1000)
                setSound(soundUri, audioAttributes)
            }

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}
