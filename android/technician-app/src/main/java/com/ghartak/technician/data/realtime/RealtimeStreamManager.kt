package com.ghartak.technician.data.realtime

import android.util.Log
import com.ghartak.technician.data.api.ApiClient
import okhttp3.*
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class RealtimeStreamManager {

    private var eventSource: EventSource? = null
    private val client = OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    fun connect(
        technicianId: String,
        onEventReceived: (eventType: String, data: JSONObject) -> Unit
    ) {
        disconnect()

        val streamUrl = "${ApiClient.baseUrl}realtime/events?role=TECHNICIAN&technicianId=$technicianId"

        val request = Request.Builder()
            .url(streamUrl)
            .header("Accept", "text/event-stream")
            .build()

        val listener = object : EventSourceListener() {
            override fun onOpen(eventSource: EventSource, response: Response) {
                Log.d("GTS_TECH_SSE", "Technician real-time stream established for tech: $technicianId")
            }

            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                try {
                    val json = JSONObject(data)
                    val eventType = json.optString("type", "UNKNOWN")
                    onEventReceived(eventType, json)
                } catch (e: Exception) {
                    Log.e("GTS_TECH_SSE", "Error parsing technician SSE event: ${e.message}")
                }
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                Log.w("GTS_TECH_SSE", "Technician stream connection interrupted, reconnecting...: ${t?.message}")
            }
        }

        eventSource = EventSources.createFactory(client).newEventSource(request, listener)
    }

    fun disconnect() {
        eventSource?.cancel()
        eventSource = null
    }
}
