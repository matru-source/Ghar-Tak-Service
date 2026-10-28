package com.ghartak.technician

import android.app.Application
import android.util.Log
import com.ghartak.technician.data.session.SessionManager

class TechnicianApplication : Application() {

    lateinit var sessionManager: SessionManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        sessionManager = SessionManager(applicationContext)
        Log.i("GTS_TECH", "GharTak Field Technician Application Initialized")
    }

    companion object {
        lateinit var instance: TechnicianApplication
            private set
    }
}
