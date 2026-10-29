package com.ghartak.technician

import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.PowerManager
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.WindowManager
import androidx.annotation.NonNull
import androidx.core.content.ContextCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.ghartak.technician/hardware"

    private var wakeLock: PowerManager.WakeLock? = null
    private var sirenRingtone: Ringtone? = null
    private var vibrator: Vibrator? = null
    private var isSirenActive = false

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "playSiren" -> {
                    startSirenAndWakeScreen()
                    result.success(true)
                }
                "stopSiren" -> {
                    stopSirenAndReleaseWake()
                    result.success(true)
                }
                "acquireWakeLock" -> {
                    acquireScreenWakeLock()
                    result.success(true)
                }
                "releaseWakeLock" -> {
                    releaseScreenWakeLock()
                    result.success(true)
                }
                "getLocation" -> {
                    val locMap = getHardwareLocation()
                    result.success(locMap)
                }
                else -> result.notImplemented()
            }
        }
    }

    private fun acquireScreenWakeLock() {
        try {
            if (wakeLock == null) {
                val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
                wakeLock = powerManager.newWakeLock(
                    PowerManager.SCREEN_BRIGHT_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "GTS:TechnicianEmergencyWakeLock"
                )
            }
            if (wakeLock?.isHeld == false) {
                wakeLock?.acquire(60000L) // 60s timeout
            }

            runOnUiThread {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                    setShowWhenLocked(true)
                    setTurnScreenOn(true)
                }
                window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun releaseScreenWakeLock() {
        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
            runOnUiThread {
                window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun startSirenAndWakeScreen() {
        if (isSirenActive) return
        isSirenActive = true

        acquireScreenWakeLock()

        // 1. Play Alarm Audio Siren
        try {
            val alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            sirenRingtone = RingtoneManager.getRingtone(applicationContext, alarmUri)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                sirenRingtone?.audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            }
            sirenRingtone?.play()
        } catch (e: Exception) {
            e.printStackTrace()
        }

        // 2. Emergency Vibration Pulses
        try {
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vm.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            }

            val pattern = longArrayOf(0, 800, 300, 800, 300)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator?.vibrate(VibrationEffect.createWaveform(pattern, 0))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun stopSirenAndReleaseWake() {
        isSirenActive = false
        try {
            sirenRingtone?.stop()
            sirenRingtone = null
        } catch (e: Exception) {
            e.printStackTrace()
        }

        try {
            vibrator?.cancel()
            vibrator = null
        } catch (e: Exception) {
            e.printStackTrace()
        }

        releaseScreenWakeLock()
    }

    private fun getHardwareLocation(): Map<String, Any?> {
        val res = mutableMapOf<String, Any?>()
        try {
            val lm = getSystemService(Context.LOCATION_SERVICE) as LocationManager
            var bestLoc: Location? = null

            if (ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
                ContextCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
            ) {
                val gpsLoc = lm.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                val netLoc = lm.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)

                bestLoc = when {
                    gpsLoc != null && netLoc != null -> if (gpsLoc.time > netLoc.time) gpsLoc else netLoc
                    gpsLoc != null -> gpsLoc
                    else -> netLoc
                }
            }

            if (bestLoc != null) {
                res["latitude"] = bestLoc.latitude
                res["longitude"] = bestLoc.longitude
                res["speed"] = bestLoc.speed.toDouble()
                res["heading"] = bestLoc.bearing.toDouble()
                res["accuracy"] = bestLoc.accuracy.toDouble()
                res["isMock"] = false
            } else {
                // Fallback realistic central location if permission or GPS warm-up pending
                res["latitude"] = 18.9220
                res["longitude"] = 72.8347
                res["speed"] = 0.0
                res["heading"] = 0.0
                res["accuracy"] = 15.0
                res["isMock"] = true
            }
        } catch (e: Exception) {
            res["latitude"] = 18.9220
            res["longitude"] = 72.8347
            res["speed"] = 0.0
            res["heading"] = 0.0
            res["isMock"] = true
        }
        return res
    }

    override fun onDestroy() {
        stopSirenAndReleaseWake()
        super.onDestroy()
    }
}
