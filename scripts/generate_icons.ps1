Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\android\customer-app\src\main\res\drawable\logo_gts_nobg.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
Write-Host "Source image size: $($srcImg.Width)x$($srcImg.Height)"

# Densities and sizes for standard launcher icons
$densities = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

# Adaptive foreground densities (108dp base)
$fgDensities = @{
    "mipmap-mdpi" = 108
    "mipmap-hdpi" = 162
    "mipmap-xhdpi" = 216
    "mipmap-xxhdpi" = 324
    "mipmap-xxxhdpi" = 432
}

$targetApps = @(
    (Join-Path $PSScriptRoot "..\android\customer-app\src\main\res"),
    (Join-Path $PSScriptRoot "..\android\technician-app\src\main\res")
)

function Create-PaddedIcon {
    param(
        [System.Drawing.Image]$source,
        [int]$size,
        [string]$outPath,
        [bool]$hasBackground,
        [System.Drawing.Color]$bgColor,
        [float]$scaleFactor
    )

    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    if ($hasBackground) {
        $brush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillRectangle($brush, 0, 0, $size, $size)
        $brush.Dispose()
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # Calculate centered bounding box preserving aspect ratio
    $targetWidth = $size * $scaleFactor
    $targetHeight = $size * $scaleFactor

    $aspect = $source.Width / $source.Height
    if ($aspect -gt 1.0) {
        $drawW = $targetWidth
        $drawH = $targetWidth / $aspect
    } else {
        $drawH = $targetHeight
        $drawW = $targetHeight * $aspect
    }

    $offsetX = ($size - $drawW) / 2.0
    $offsetY = ($size - $drawH) / 2.0

    $destRect = New-Object System.Drawing.RectangleF($offsetX, $offsetY, $drawW, $drawH)
    $srcRect = New-Object System.Drawing.RectangleF(0, 0, $source.Width, $source.Height)

    $g.DrawImage($source, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$whiteColor = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

foreach ($resDir in $targetApps) {
    Write-Host "Processing res dir: $resDir"
    
    # Generate legacy ic_launcher.png and ic_launcher_round.png (with white background and 72% logo size)
    foreach ($entry in $densities.GetEnumerator()) {
        $folder = Join-Path $resDir $entry.Key
        if (-not (Test-Path $folder)) {
            New-Item -ItemType Directory -Path $folder -Force | Out-Null
        }
        $icLauncher = Join-Path $folder "ic_launcher.png"
        $icRound = Join-Path $folder "ic_launcher_round.png"

        Create-PaddedIcon -source $srcImg -size $entry.Value -outPath $icLauncher -hasBackground $true -bgColor $whiteColor -scaleFactor 0.72
        Create-PaddedIcon -source $srcImg -size $entry.Value -outPath $icRound -hasBackground $true -bgColor $whiteColor -scaleFactor 0.72
        Write-Host "  Generated $($entry.Key) launcher ($($entry.Value)px)"
    }

    # Generate adaptive foreground ic_launcher_foreground.png (transparent background, 62% logo size inside 108dp canvas)
    foreach ($entry in $fgDensities.GetEnumerator()) {
        $folder = Join-Path $resDir $entry.Key
        $fgPath = Join-Path $folder "ic_launcher_foreground.png"

        # 0.62 factor guarantees logo sits safely inside the 66% (72dp) mask area
        Create-PaddedIcon -source $srcImg -size $entry.Value -outPath $fgPath -hasBackground $false -bgColor $whiteColor -scaleFactor 0.62
        Write-Host "  Generated $($entry.Key) foreground ($($entry.Value)px)"
    }
}

$srcImg.Dispose()
Write-Host "All icons generated successfully!"
