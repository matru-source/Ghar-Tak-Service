package com.ghartak.customer.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.ghartak.customer.MainActivity
import com.ghartak.customer.R
import com.ghartak.customer.data.session.SessionManager
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Customer App Firebase Cloud Messaging (FCM) Service (Issue 50).
 * Handles instant doorstep arrival alerts, emergency notifications, and booking updates.
 */
class MyFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        const val CHANNEL_ID_CUSTOMER = "ghartak_customer_channel"
        const val CHANNEL_NAME_CUSTOMER = "Doorstep Service & Arrival Alerts"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d("GTS_CUST_FCM", "Customer FCM message received: ${remoteMessage.data}")

        val type = remoteMessage.data["type"] ?: "UPDATE"
        val ticketNumber = remoteMessage.data["ticketNumber"] ?: "#J-BOOKING"
        val techName = remoteMessage.data["technicianName"] ?: "Technician"

        wakeUpDevice()

        when (type) {
            "TECH_ARRIVED", "ARRIVED" -> {
                showNotification(
                    title = "🔔 Technician At Your Doorstep!",
                    message = "$techName has arrived for ticket $ticketNumber. Verify identity before sharing OTP.",
                    isHighPriority = true
                )
            }
            "CUSTOMER_EMERGENCY_SOS_TRIGGERED" -> {
                showNotification(
                    title = "🚨 Safety Command Center Dispatched",
                    message = "Safety emergency response has been dispatched to your location.",
                    isHighPriority = true
                )
            }
            else -> {
                showNotification(
                    title = remoteMessage.notification?.title ?: "Ghar Tak Update",
                    message = remoteMessage.notification?.body ?: "Service status updated for $ticketNumber."
                )
            }
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d("GTS_CUST_FCM", "New Customer FCM token: $token")
        val sessionManager = SessionManager(applicationContext)
        sessionManager.setFcmToken(token)
    }

    private fun wakeUpDevice() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            val wakeLock = pm?.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "ghartak:cust_fcm_wakelock"
            )
            wakeLock?.acquire(10000L)
        } catch (e: Exception) {
            Log.w("GTS_CUST_FCM", "WakeLock error: ${e.message}")
        }
    }

    private fun showNotification(title: String, message: String, isHighPriority: Boolean = false) {
        createNotificationChannel()

        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        )

        val soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        val notification = NotificationCompat.Builder(this, CHANNEL_ID_CUSTOMER)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(if (isHighPriority) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setSound(soundUri)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(System.currentTimeMillis().toInt(), notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID_CUSTOMER,
                CHANNEL_NAME_CUSTOMER,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Doorstep arrival alerts and live service notifications"
                enableLights(true)
                enableVibration(true)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }
}
