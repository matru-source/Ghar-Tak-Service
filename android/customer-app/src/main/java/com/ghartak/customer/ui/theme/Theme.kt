package com.ghartak.customer.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = SapphireBlue800,
    onPrimary = SurfaceCard,
    primaryContainer = SapphireBlue900,
    onPrimaryContainer = SurfaceCard,
    secondary = ElectricCyan,
    onSecondary = NavyDark900,
    background = SurfaceLight,
    onBackground = TextDarkPrimary,
    surface = SurfaceCard,
    onSurface = TextDarkPrimary,
    surfaceVariant = SurfaceLight,
    onSurfaceVariant = TextDarkSecondary,
    outline = SurfaceBorder,
    error = DangerRed,
    onError = SurfaceCard
)

@Composable
fun GharTakCustomerTheme(
    darkTheme: Boolean = false, // Clean, crisp sapphire white theme for customer consumer app
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            window?.let {
                it.statusBarColor = SapphireBlue900.toArgb()
                it.navigationBarColor = SurfaceLight.toArgb()
                WindowCompat.getInsetsController(it, view).isAppearanceLightStatusBars = false
                WindowCompat.getInsetsController(it, view).isAppearanceLightNavigationBars = true
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
