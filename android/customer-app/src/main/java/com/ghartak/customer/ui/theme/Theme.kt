package com.ghartak.customer.ui.theme

import android.app.Activity
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat

// GTS 2.0 Modern Shape Tokens
val ShapeSearchPill = RoundedCornerShape(24.dp)
val ShapeCardLarge = RoundedCornerShape(20.dp)
val ShapeCard = RoundedCornerShape(16.dp)
val ShapeCardSmall = RoundedCornerShape(12.dp)
val ShapeBadge = RoundedCornerShape(8.dp)
val ShapeOtpBox = RoundedCornerShape(10.dp)

// GTS 2.0 Gradient Brushes
fun gtsHeaderGradient(): Brush = Brush.verticalGradient(
    colors = listOf(GtsHeaderGradientStart, GtsHeaderGradientMid, GtsHeaderGradientEnd)
)

fun amcMembershipGradient(): Brush = Brush.horizontalGradient(
    colors = listOf(AmcGradientStart, AmcGradientEnd)
)

private val LightColorScheme = lightColorScheme(
    primary = GtsHeaderGradientMid,
    onPrimary = SurfaceCard,
    primaryContainer = GtsHeaderGradientStart,
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
                it.statusBarColor = GtsHeaderGradientStart.toArgb()
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
