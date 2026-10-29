$ErrorActionPreference = 'Stop'
$destZip = 'D:\ZEX\Ghar tak\GTS_UPDATE.zip'
$staging = 'D:\ZEX\Ghar tak\deploy_stage'

if (Test-Path $destZip) { Remove-Item $destZip -Force }
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }

New-Item -ItemType Directory -Path $staging | Out-Null

Write-Host "Staging files..."
# Copy app files
Copy-Item "web\package.json" "$staging\"
Copy-Item "web\app.js" "$staging\"
Copy-Item "web\next.config.ts" "$staging\"
Copy-Item "web\tsconfig.json" "$staging\"
if (Test-Path "web\.env") { Copy-Item "web\.env" "$staging\" }

Copy-Item "web\public" "$staging\public" -Recurse
Copy-Item "web\prisma" "$staging\prisma" -Recurse
Copy-Item "web\src" "$staging\src" -Recurse

# Copy .next excluding cache
Write-Host "Copying .next build..."
robocopy "web\.next" "$staging\.next" /E /XD "cache" /NFL /NDL /NJH /NJS | Out-Null

Write-Host "Compressing to $destZip..."
Compress-Archive -Path "$staging\*" -DestinationPath $destZip -CompressionLevel Optimal

Copy-Item $destZip "D:\ZEX\Ghar tak\plesk_deploy.zip" -Force
Remove-Item $staging -Recurse -Force

$sizeMb = [math]::Round(((Get-Item $destZip).Length / 1MB), 2)
Write-Host "SUCCESS: GTS_UPDATE.zip created ($sizeMb MB)"
