package com.ghartak.customer

import android.app.Application
import android.util.Log
import com.ghartak.customer.data.session.SessionManager

class CustomerApplication : Application() {

    lateinit var sessionManager: SessionManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        sessionManager = SessionManager(applicationContext)
        Log.i("GTS_CUST", "GharTak Customer Application Initialized")
    }

    companion object {
        lateinit var instance: CustomerApplication
            private set
    }
}
