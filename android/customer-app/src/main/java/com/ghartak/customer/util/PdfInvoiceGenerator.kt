package com.ghartak.customer.util

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.pdf.PdfDocument
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import android.widget.Toast
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object PdfInvoiceGenerator {

    data class InvoiceData(
        val invoiceNumber: String = "INV-2026-MH-1720",
        val ticketNumber: String = "GTS-MH-6430",
        val serviceTitle: String = "Full Home MCB Panel Replacement & Earth Leakage Fix",
        val customerName: String = "Amit Sharma",
        val customerPhone: String = "+91 98765 43210",
        val customerAddress: String = "Flat 402, Sea Green Apts, Colaba, Mumbai 400001",
        val technicianName: String = "Rajesh Kumar (GTS-TECH-4091)",
        val dateOfSupply: String = "Oct 07, 2026",
        val gstin: String = "27AAACG1234F1Z5 (27-MH)",
        val hsnSac: String = "998713 (Electrical installation and maintenance)",
        val taxableCharges: Double = 2499.00,
        val cgstAmount: Double = 224.91,
        val sgstAmount: Double = 224.91,
        val totalAmount: Double = 2948.82,
        val paymentMethod: String = "PAID (ONLINE • UPI)",
        val warrantyDetails: String = "12-Month Official Service Warranty Active"
    )

    fun generateAndSaveGstInvoice(
        context: Context,
        data: InvoiceData = InvoiceData(),
        openImmediately: Boolean = true
    ): Uri? {
        val document = PdfDocument()

        try {
            // Standard A4 Size: 595 x 842 points
            val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
            val page = document.startPage(pageInfo)
            val canvas = page.canvas

            val paint = Paint().apply { isAntiAlias = true }

            // 1. Top Header Banner (Sapphire Blue: #00288E)
            paint.color = Color.parseColor("#00288E")
            canvas.drawRect(0f, 0f, 595f, 100f, paint)

            // Header Logo & Company Text
            paint.color = Color.WHITE
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 22f
            canvas.drawText("GHAR TAK SERVICES (GTS)", 36f, 44f, paint)

            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            paint.textSize = 10f
            paint.color = Color.parseColor("#BBDEFB")
            canvas.drawText("ElectriCare Enterprise Platform • Mission-Critical Electrical Engineering", 36f, 62f, paint)
            canvas.drawText("GSTIN: ${data.gstin} | SAC Code: 998713 | 100% Tax Compliant", 36f, 78f, paint)

            // Header Right - TAX INVOICE Badge
            paint.color = Color.parseColor("#FFD54F")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 13f
            canvas.drawText("TAX INVOICE", 480f, 44f, paint)

            paint.color = Color.WHITE
            paint.textSize = 9f
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            canvas.drawText("ORIGINAL FOR RECIPIENT", 432f, 62f, paint)

            // 2. Invoice Meta Details Bar
            paint.color = Color.parseColor("#F1F5F9")
            canvas.drawRect(36f, 115f, 559f, 160f, paint)

            paint.color = Color.parseColor("#0F172A")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 11f
            canvas.drawText("Invoice No: ${data.invoiceNumber}", 48f, 134f, paint)
            canvas.drawText("Date: ${data.dateOfSupply}", 48f, 150f, paint)

            canvas.drawText("Work Order: ${data.ticketNumber}", 340f, 134f, paint)
            paint.color = Color.parseColor("#059669")
            canvas.drawText("Status: ${data.paymentMethod}", 340f, 150f, paint)

            // 3. Bill To & Service Details Cards
            // Bill To Box
            paint.color = Color.parseColor("#FAFAFA")
            canvas.drawRect(36f, 175f, 290f, 265f, paint)
            paint.color = Color.parseColor("#E2E8F0")
            paint.style = Paint.Style.STROKE
            paint.strokeWidth = 1f
            canvas.drawRect(36f, 175f, 290f, 265f, paint)
            paint.style = Paint.Style.FILL

            paint.color = Color.parseColor("#00288E")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 10f
            canvas.drawText("CUSTOMER / BILLED TO:", 46f, 195f, paint)

            paint.color = Color.parseColor("#0F172A")
            paint.textSize = 11f
            canvas.drawText(data.customerName, 46f, 212f, paint)
            paint.color = Color.parseColor("#64748B")
            paint.textSize = 9f
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            canvas.drawText(data.customerPhone, 46f, 227f, paint)
            canvas.drawText(data.customerAddress, 46f, 242f, paint)

            // Service Executed Box
            paint.color = Color.parseColor("#FAFAFA")
            canvas.drawRect(305f, 175f, 559f, 265f, paint)
            paint.color = Color.parseColor("#E2E8F0")
            paint.style = Paint.Style.STROKE
            canvas.drawRect(305f, 175f, 559f, 265f, paint)
            paint.style = Paint.Style.FILL

            paint.color = Color.parseColor("#00288E")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 10f
            canvas.drawText("SERVICE EXECUTION & CREW:", 315f, 195f, paint)

            paint.color = Color.parseColor("#0F172A")
            paint.textSize = 10f
            canvas.drawText("Electrician: ${data.technicianName}", 315f, 212f, paint)
            paint.color = Color.parseColor("#64748B")
            paint.textSize = 9f
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            canvas.drawText("Certification: VDE 1000V Insulated Safety Standard", 315f, 227f, paint)
            paint.color = Color.parseColor("#059669")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            canvas.drawText("Warranty: ${data.warrantyDetails}", 315f, 242f, paint)

            // 4. Line Items Table Header
            paint.color = Color.parseColor("#00288E")
            canvas.drawRect(36f, 280f, 559f, 305f, paint)

            paint.color = Color.WHITE
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 9f
            canvas.drawText("ITEM DESCRIPTION", 46f, 296f, paint)
            canvas.drawText("SAC CODE", 300f, 296f, paint)
            canvas.drawText("RATE (INR)", 380f, 296f, paint)
            canvas.drawText("TAXABLE AMOUNT", 465f, 296f, paint)

            // Line Item Row
            paint.color = Color.parseColor("#0F172A")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            paint.textSize = 9.5f
            canvas.drawText(data.serviceTitle, 46f, 325f, paint)
            canvas.drawText("998713", 300f, 325f, paint)
            canvas.drawText("₹%,.2f".format(data.taxableCharges), 380f, 325f, paint)
            canvas.drawText("₹%,.2f".format(data.taxableCharges), 465f, 325f, paint)

            // Table Border Line
            paint.color = Color.parseColor("#CBD5E1")
            canvas.drawLine(36f, 345f, 559f, 345f, paint)

            // 5. Tax Breakdown & Totals Box
            val startY = 365f
            paint.color = Color.parseColor("#475569")
            paint.textSize = 10f
            canvas.drawText("Taxable Electrical Charges:", 320f, startY, paint)
            canvas.drawText("₹%,.2f".format(data.taxableCharges), 485f, startY, paint)

            canvas.drawText("Central GST (CGST @ 9.0%):", 320f, startY + 20f, paint)
            canvas.drawText("₹%,.2f".format(data.cgstAmount), 485f, startY + 20f, paint)

            canvas.drawText("State GST (SGST @ 9.0%):", 320f, startY + 40f, paint)
            canvas.drawText("₹%,.2f".format(data.sgstAmount), 485f, startY + 40f, paint)

            // Total Amount Banner
            paint.color = Color.parseColor("#F1F5F9")
            canvas.drawRect(310f, startY + 55f, 559f, startY + 95f, paint)

            paint.color = Color.parseColor("#00288E")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 13f
            canvas.drawText("TOTAL INVOICE AMOUNT:", 320f, startY + 80f, paint)
            canvas.drawText("₹%,.2f".format(data.totalAmount), 470f, startY + 80f, paint)

            // 6. Security & Legal Footer
            paint.color = Color.parseColor("#F8FAFC")
            canvas.drawRect(36f, 720f, 559f, 790f, paint)
            paint.color = Color.parseColor("#CBD5E1")
            paint.style = Paint.Style.STROKE
            canvas.drawRect(36f, 720f, 559f, 790f, paint)
            paint.style = Paint.Style.FILL

            paint.color = Color.parseColor("#059669")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            paint.textSize = 10f
            canvas.drawText("✔ 100% QUALITY & RESTORATION WARRANTY SIGN-OFF VERIFIED", 48f, 740f, paint)

            paint.color = Color.parseColor("#64748B")
            paint.typeface = Typeface.create(Typeface.DEFAULT, Typeface.NORMAL)
            paint.textSize = 8.5f
            canvas.drawText("This is an electronically generated and certified tax invoice conforming to Section 31 of CGST Act, 2017.", 48f, 758f, paint)
            canvas.drawText("Issued by Ghar Tak Services Pvt. Ltd. • Registered Office: Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051.", 48f, 772f, paint)

            document.finishPage(page)

            // Save to device storage
            val fileName = "Tax_Invoice_${data.invoiceNumber}.pdf"
            var savedUri: Uri? = null

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }

                val resolver = context.contentResolver
                val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                if (uri != null) {
                    resolver.openOutputStream(uri)?.use { outputStream ->
                        document.writeTo(outputStream)
                    }
                    savedUri = uri
                }
            } else {
                val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                if (!downloadsDir.exists()) downloadsDir.mkdirs()
                val file = File(downloadsDir, fileName)
                FileOutputStream(file).use { out ->
                    document.writeTo(out)
                }
                savedUri = Uri.fromFile(file)
            }

            // Also keep an internal cache copy for immediate Intent viewing
            val cacheFile = File(context.cacheDir, fileName)
            FileOutputStream(cacheFile).use { out ->
                document.writeTo(out)
            }

            Toast.makeText(context, "✅ Downloaded: $fileName", Toast.LENGTH_LONG).show()

            if (openImmediately) {
                try {
                    val viewIntent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(savedUri, "application/pdf")
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    if (viewIntent.resolveActivity(context.packageManager) != null) {
                        context.startActivity(viewIntent)
                    }
                } catch (e: Exception) {
                    Log.d("PDF_VIEW", "Could not launch PDF viewer automatically: ${e.message}")
                }
            }

            return savedUri
        } catch (e: Exception) {
            Log.e("PDF_GEN", "Failed to generate PDF: ${e.message}", e)
            Toast.makeText(context, "PDF generated to cache: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
            return null
        } finally {
            document.close()
        }
    }
}
