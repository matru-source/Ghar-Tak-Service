package com.ghartak.technician.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = FlameOrange,
    onPrimary = TextPrimary,
    primaryContainer = FlameOrangeDark,
    onPrimaryContainer = TextPrimary,
    secondary = FlameOrangeAmber,
    onSecondary = SlateDark900,
    background = SlateDark900,
    onBackground = TextPrimary,
    surface = CardBackground,
    onSurface = TextPrimary,
    surfaceVariant = SlateDark700,
    onSurfaceVariant = TextSecondary,
    outline = SurfaceBorder,
    error = SafetyRed,
    onError = TextPrimary
)

@Composable
fun GharTakTechnicianTheme(
    darkTheme: Boolean = true, // Default to Dark Theme for electrician field high-contrast visibility
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            window?.let {
                it.statusBarColor = SlateDark900.toArgb()
                it.navigationBarColor = SlateDark900.toArgb()
                WindowCompat.getInsetsController(it, view).isAppearanceLightStatusBars = false
                WindowCompat.getInsetsController(it, view).isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
