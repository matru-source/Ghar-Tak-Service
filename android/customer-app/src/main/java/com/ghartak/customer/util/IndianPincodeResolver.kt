package com.ghartak.customer.util

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import java.util.concurrent.TimeUnit

data class PincodeDetails(
    val pincode: String,
    val state: String,
    val district: String,
    val hubName: String,
    val gstinStateCode: String,
    val stateCode: String = "MH",
    val isServiceable: Boolean = true,
    val etaMinutes: Int = 15
)

object IndianPincodeResolver {

    private val client = OkHttpClient.Builder()
        .connectTimeout(3, TimeUnit.SECONDS)
        .readTimeout(3, TimeUnit.SECONDS)
        .build()

    suspend fun resolvePincode(pincode: String): PincodeDetails = withContext(Dispatchers.IO) {
        val cleanPin = pincode.filter { it.isDigit() }.take(6)
        if (cleanPin.length != 6) {
            return@withContext getOfflineFallback(cleanPin)
        }

        try {
            val request = Request.Builder()
                .url("https://api.postalpincode.in/pincode/$cleanPin")
                .addHeader("User-Agent", "Mozilla/5.0")
                .addHeader("accept", "application/json")
                .get()
                .build()

            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val bodyStr = response.body?.string() ?: ""
                val jsonArr = JSONArray(bodyStr)
                if (jsonArr.length() > 0) {
                    val root = jsonArr.getJSONObject(0)
                    if (root.optString("Status") == "Success") {
                        val postOffices = root.optJSONArray("PostOffice")
                        if (postOffices != null && postOffices.length() > 0) {
                            val po = postOffices.getJSONObject(0)
                            val district = po.optString("District", "").trim()
                            val state = po.optString("State", "").trim()

                            val prefix = cleanPin.take(2).toIntOrNull() ?: 40
                            val code = getHubCode(prefix, state)
                            val hub = if (district.isNotEmpty()) "$code $state Regional Hub ($district)" else "$code $state Regional Hub"
                            val gstCode = getGstCode(state)
                            val shortCode = code.substringBefore("-").ifEmpty { "MH" }

                            Log.d("GTS_PINCODE", "Resolved online: $cleanPin -> $hub, State: $state")
                            return@withContext PincodeDetails(
                                pincode = cleanPin,
                                state = state,
                                district = district,
                                hubName = hub,
                                gstinStateCode = gstCode,
                                stateCode = shortCode,
                                isServiceable = true,
                                etaMinutes = 15
                            )
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.w("GTS_PINCODE", "Online pincode lookup failed, using offline mapping: ${e.message}")
        }

        return@withContext getOfflineFallback(cleanPin)
    }

    fun getOfflineFallback(pincode: String): PincodeDetails {
        val prefix2 = pincode.take(2).toIntOrNull() ?: 40
        val (state, code) = when (prefix2) {
            11 -> "Delhi" to "DL-01"
            12, 13 -> "Haryana" to "HR-01"
            14, 15, 16 -> "Punjab" to "PB-01"
            17 -> "Himachal Pradesh" to "HP-01"
            18, 19 -> "Jammu & Kashmir" to "JK-01"
            in 20..28 -> "Uttar Pradesh" to "UP-01"
            in 30..34 -> "Rajasthan" to "RJ-01"
            in 36..39 -> "Gujarat" to "GJ-01"
            in 40..44 -> "Maharashtra" to "MH-01"
            in 45..48 -> "Madhya Pradesh" to "MP-01"
            49 -> "Chhattisgarh" to "CG-01"
            in 50..53 -> "Telangana / AP" to "TS-01"
            in 56..59 -> "Karnataka" to "KA-01"
            in 60..64 -> "Tamil Nadu" to "TN-01"
            in 67..69 -> "Kerala" to "KL-01"
            in 70..74 -> "West Bengal" to "WB-01"
            in 75..77 -> "Odisha" to "OD-01"
            78 -> "Assam" to "AS-01"
            79 -> "North East" to "NE-01"
            in 80..85 -> "Bihar" to "BR-01"
            else -> "National Hub" to "IN-01"
        }

        val hub = "$code $state Regional Hub"
        val gstCode = getGstCode(state)
        val shortCode = code.substringBefore("-").ifEmpty { "MH" }

        return PincodeDetails(
            pincode = pincode,
            state = state,
            district = state,
            hubName = hub,
            gstinStateCode = gstCode,
            stateCode = shortCode,
            isServiceable = true,
            etaMinutes = 15
        )
    }

    private fun getHubCode(prefix2: Int, state: String): String {
        return when {
            state.contains("Odisha", ignoreCase = true) || prefix2 in 75..77 -> "OD-01"
            state.contains("Maharashtra", ignoreCase = true) || prefix2 in 40..44 -> "MH-01"
            state.contains("Delhi", ignoreCase = true) || prefix2 == 11 -> "DL-01"
            state.contains("Karnataka", ignoreCase = true) || prefix2 in 56..59 -> "KA-01"
            state.contains("Tamil", ignoreCase = true) || prefix2 in 60..64 -> "TN-01"
            state.contains("Bengal", ignoreCase = true) || prefix2 in 70..74 -> "WB-01"
            state.contains("Gujarat", ignoreCase = true) || prefix2 in 36..39 -> "GJ-01"
            state.contains("Telangana", ignoreCase = true) || prefix2 in 50..53 -> "TS-01"
            state.contains("Uttar Pradesh", ignoreCase = true) || prefix2 in 20..28 -> "UP-01"
            state.contains("Rajasthan", ignoreCase = true) || prefix2 in 30..34 -> "RJ-01"
            state.contains("Punjab", ignoreCase = true) || prefix2 in 14..16 -> "PB-01"
            state.contains("Kerala", ignoreCase = true) || prefix2 in 67..69 -> "KL-01"
            else -> "GTS-01"
        }
    }

    private fun getGstCode(state: String): String {
        return when {
            state.contains("Odisha", ignoreCase = true) -> "21AAACG1234F1Z5 (21-OD)"
            state.contains("Maharashtra", ignoreCase = true) -> "27AAACG1234F1Z5 (27-MH)"
            state.contains("Delhi", ignoreCase = true) -> "07AAACG1234F1Z5 (07-DL)"
            state.contains("Karnataka", ignoreCase = true) -> "29AAACG1234F1Z5 (29-KA)"
            state.contains("Tamil", ignoreCase = true) -> "33AAACG1234F1Z5 (33-TN)"
            state.contains("Bengal", ignoreCase = true) -> "19AAACG1234F1Z5 (19-WB)"
            state.contains("Gujarat", ignoreCase = true) -> "24AAACG1234F1Z5 (24-GJ)"
            state.contains("Telangana", ignoreCase = true) -> "36AAACG1234F1Z5 (36-TS)"
            state.contains("Andhra", ignoreCase = true) -> "37AAACG1234F1Z5 (37-AP)"
            state.contains("Uttar Pradesh", ignoreCase = true) -> "09AAACG1234F1Z5 (09-UP)"
            state.contains("Rajasthan", ignoreCase = true) -> "08AAACG1234F1Z5 (08-RJ)"
            state.contains("Kerala", ignoreCase = true) -> "32AAACG1234F1Z5 (32-KL)"
            state.contains("Madhya Pradesh", ignoreCase = true) -> "23AAACG1234F1Z5 (23-MP)"
            state.contains("Punjab", ignoreCase = true) -> "03AAACG1234F1Z5 (03-PB)"
            state.contains("Haryana", ignoreCase = true) -> "06AAACG1234F1Z5 (06-HR)"
            state.contains("Bihar", ignoreCase = true) -> "10AAACG1234F1Z5 (10-BR)"
            else -> "27AAACG1234F1Z5"
        }
    }
}
