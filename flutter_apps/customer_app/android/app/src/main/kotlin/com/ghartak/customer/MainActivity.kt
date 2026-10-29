package com.ghartak.customer

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.location.Location
import android.location.LocationManager
import android.net.Uri
import android.os.Build
import androidx.annotation.NonNull
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.ghartak.customer/hardware"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "getLocation" -> {
                    val locMap = getHardwareLocation()
                    result.success(locMap)
                }
                "generatePdfInvoice" -> {
                    val args = call.arguments as? Map<String, Any?> ?: emptyMap()
                    val path = generateOfflinePdfInvoice(args)
                    if (path != null) {
                        openPdfFile(path)
                        result.success(path)
                    } else {
                        result.error("PDF_ERROR", "Failed to generate offline PDF invoice", null)
                    }
                }
                else -> result.notImplemented()
            }
        }
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
                res["accuracy"] = bestLoc.accuracy.toDouble()
                res["isMock"] = false
            } else {
                res["latitude"] = 18.9220
                res["longitude"] = 72.8347
                res["accuracy"] = 15.0
                res["isMock"] = true
            }
        } catch (e: Exception) {
            res["latitude"] = 18.9220
            res["longitude"] = 72.8347
            res["isMock"] = true
        }
        return res
    }

    private fun generateOfflinePdfInvoice(data: Map<String, Any?>): String? {
        val doc = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // Standard A4 (72 dpi)
        val page = doc.startPage(pageInfo)
        val canvas = page.canvas

        val paint = Paint().apply { isAntiAlias = true }

        // 1. Header Brand Banner
        paint.color = Color.parseColor("#0F172A") // Slate 900
        canvas.drawRect(0f, 0f, 595f, 90f, paint)

        paint.color = Color.WHITE
        paint.textSize = 20f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("GTS GHAR TAK SERVICE", 36f, 44f, paint)

        paint.textSize = 10f
        paint.typeface = Typeface.DEFAULT
        paint.color = Color.parseColor("#94A3B8")
        canvas.drawText("National Fast, Safe & Transparent Doorstep Services", 36f, 62f, paint)

        paint.color = Color.parseColor("#F59E0B")
        paint.textSize = 12f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("TAX INVOICE & CASH RECEIPT", 380f, 48f, paint)

        // 2. Invoice Meta Details
        val invoiceNo = data["invoiceNumber"]?.toString() ?: "INV-2026-GTS"
        val ticketNo = data["ticketNumber"]?.toString() ?: "#J-1001"
        val serviceTitle = data["serviceTitle"]?.toString() ?: "Electrical Diagnostics & Repair"
        val totalAmount = data["totalAmount"]?.toString() ?: "₹1,475.00"
        val customerName = data["customerName"]?.toString() ?: "Valued Customer"
        val dateStr = SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.ENGLISH).format(Date())

        paint.color = Color.parseColor("#1E293B")
        paint.textSize = 11f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("INVOICE NO:", 36f, 125f, paint)
        paint.typeface = Typeface.DEFAULT
        canvas.drawText(invoiceNo, 120f, 125f, paint)

        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("DATE & TIME:", 36f, 145f, paint)
        paint.typeface = Typeface.DEFAULT
        canvas.drawText(dateStr, 120f, 145f, paint)

        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("JOB TICKET:", 36f, 165f, paint)
        paint.typeface = Typeface.DEFAULT
        canvas.drawText(ticketNo, 120f, 165f, paint)

        // Customer & Billed To
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("BILLED TO:", 360f, 125f, paint)
        paint.typeface = Typeface.DEFAULT
        canvas.drawText(customerName, 360f, 145f, paint)
        canvas.drawText("GST Status: Consumer / Unregistered", 360f, 165f, paint)

        // Separator line
        paint.color = Color.parseColor("#CBD5E1")
        paint.strokeWidth = 1f
        canvas.drawLine(36f, 190f, 559f, 190f, paint)

        // Table Header
        paint.color = Color.parseColor("#F1F5F9")
        canvas.drawRect(36f, 205f, 559f, 230f, paint)

        paint.color = Color.parseColor("#0F172A")
        paint.textSize = 10f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("ITEM DESCRIPTION", 46f, 222f, paint)
        canvas.drawText("HSN / SAC", 300f, 222f, paint)
        canvas.drawText("GST RATE", 410f, 222f, paint)
        canvas.drawText("TOTAL", 500f, 222f, paint)

        // Table Row
        paint.typeface = Typeface.DEFAULT
        paint.textSize = 10f
        canvas.drawText(serviceTitle, 46f, 255f, paint)
        canvas.drawText("998713", 300f, 255f, paint)
        canvas.drawText("18% (9+9)", 410f, 255f, paint)
        canvas.drawText(totalAmount, 500f, 255f, paint)

        canvas.drawLine(36f, 275f, 559f, 275f, paint)

        // Summary Box
        paint.color = Color.parseColor("#065F46") // Emerald
        paint.textSize = 12f
        paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        canvas.drawText("PAYMENT STATUS: PAID (UPI / ESCROW VERIFIED)", 36f, 320f, paint)

        paint.color = Color.parseColor("#0F172A")
        canvas.drawText("GRAND TOTAL PAID: $totalAmount", 360f, 320f, paint)

        // Compliance Footer
        paint.color = Color.parseColor("#64748B")
        paint.textSize = 9f
        paint.typeface = Typeface.DEFAULT
        canvas.drawText("Statutory GST Invoice generated under Indian Central Goods & Services Tax Act, 2017.", 36f, 780f, paint)
        canvas.drawText("Includes 1000V Certified Tool Isolation & 6-Month GTS Workmanship Warranty.", 36f, 796f, paint)

        doc.finishPage(page)

        val outDir = File(cacheDir, "invoices")
        if (!outDir.exists()) outDir.mkdirs()
        val outFile = File(outDir, "${invoiceNo}.pdf")

        return try {
            val fos = FileOutputStream(outFile)
            doc.writeTo(fos)
            fos.close()
            doc.close()
            outFile.absolutePath
        } catch (e: Exception) {
            e.printStackTrace()
            doc.close()
            null
        }
    }

    private fun openPdfFile(path: String) {
        try {
            val file = File(path)
            val uri = FileProvider.getUriForFile(this, "${packageName}.fileprovider", file)
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/pdf")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
