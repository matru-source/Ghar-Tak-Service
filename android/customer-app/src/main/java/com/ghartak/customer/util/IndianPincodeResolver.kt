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

    /**
     * Resolves realistic GPS coordinates for accurate tracking based on Indian Pincode.
     * Prevents false distance calculations relative to Mumbai for Odisha (760001, 759013) or other states.
     */
    fun getCoordinatesForPincode(pincode: String): Pair<Double, Double> {
        val cleanPin = pincode.filter { it.isDigit() }.take(6)
        val prefix = cleanPin.take(2).toIntOrNull() ?: 40

        return when (cleanPin) {
            "760001" -> 19.3150 to 84.7941 // Brahmapur, Odisha
            "759001", "759013" -> 20.6600 to 85.5900 // Dhenkanal, Odisha
            "751001", "751024" -> 20.2961 to 85.8245 // Bhubaneswar, Odisha
            "753001" -> 20.4625 to 85.8830 // Cuttack, Odisha
            "769001" -> 22.2604 to 84.8536 // Rourkela, Odisha
            "400001" -> 18.9220 to 72.8347 // Fort Mumbai, Maharashtra
            "400050" -> 19.0596 to 72.8295 // Bandra, Mumbai
            "411001" -> 18.5204 to 73.8567 // Pune
            "110001" -> 28.6139 to 77.2090 // New Delhi
            "560001" -> 12.9716 to 77.5946 // Bengaluru
            "600001" -> 13.0827 to 80.2707 // Chennai
            "700001" -> 22.5726 to 88.3639 // Kolkata
            "500001" -> 17.3850 to 78.4867 // Hyderabad
            "380001" -> 23.0225 to 72.5714 // Ahmedabad
            "302001" -> 26.9124 to 75.7873 // Jaipur
            "226001" -> 26.8467 to 80.9462 // Lucknow
            "800001" -> 25.5941 to 85.1376 // Patna
            else -> {
                when (prefix) {
                    in 75..77 -> 19.3150 to 84.7941 // Odisha default
                    in 40..44 -> 18.9220 to 72.8347 // Maharashtra default
                    11 -> 28.6139 to 77.2090 // Delhi
                    in 12..13 -> 29.0588 to 76.0856 // Haryana
                    in 14..16 -> 31.1471 to 75.3412 // Punjab
                    in 20..28 -> 26.8467 to 80.9462 // UP
                    in 30..34 -> 26.9124 to 75.7873 // Rajasthan
                    in 36..39 -> 23.0225 to 72.5714 // Gujarat
                    in 45..48 -> 22.9734 to 78.6569 // MP
                    49 -> 21.2787 to 81.8661 // Chhattisgarh
                    in 50..53 -> 17.3850 to 78.4867 // Telangana/AP
                    in 56..59 -> 12.9716 to 77.5946 // Karnataka
                    in 60..64 -> 13.0827 to 80.2707 // Tamil Nadu
                    in 67..69 -> 10.8505 to 76.2711 // Kerala
                    in 70..74 -> 22.5726 to 88.3639 // West Bengal
                    78, 79 -> 26.1445 to 91.7362 // Assam / North East
                    in 80..85 -> 25.5941 to 85.1376 // Bihar
                    else -> 19.3150 to 84.7941 // Default to Odisha hub
                }
            }
        }
    }
}
