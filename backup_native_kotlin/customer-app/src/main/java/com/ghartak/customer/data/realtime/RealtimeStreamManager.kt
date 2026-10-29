package com.ghartak.customer.data.realtime

import android.util.Log
import com.ghartak.customer.data.api.ApiClient
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
        customerId: String,
        jobId: String? = null,
        onEventReceived: (eventType: String, data: JSONObject) -> Unit
    ) {
        disconnect()

        val streamUrl = "${ApiClient.baseUrl}realtime/events?role=CUSTOMER&customerId=$customerId" +
                if (jobId != null) "&jobId=$jobId" else ""

        val request = Request.Builder()
            .url(streamUrl)
            .header("Accept", "text/event-stream")
            .build()

        val listener = object : EventSourceListener() {
            override fun onOpen(eventSource: EventSource, response: Response) {
                Log.d("GTS_SSE", "Customer real-time stream established")
            }

            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                try {
                    val json = JSONObject(data)
                    val eventType = json.optString("type", "UNKNOWN")
                    onEventReceived(eventType, json)
                } catch (e: Exception) {
                    Log.e("GTS_SSE", "Error parsing event payload: ${e.message}")
                }
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                Log.w("GTS_SSE", "Stream connection failure, will retry: ${t?.message}")
            }
        }

        eventSource = EventSources.createFactory(client).newEventSource(request, listener)
    }

    fun disconnect() {
        eventSource?.cancel()
        eventSource = null
    }
}
