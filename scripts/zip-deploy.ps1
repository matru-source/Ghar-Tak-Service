$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$dest = 'D:\ZEX\Ghar tak\GTS_UPDATE.zip'
if (Test-Path $dest) { Remove-Item $dest -Force }
$src = 'D:\ZEX\Ghar tak\web'

Write-Host "Creating $dest from $src..."
$zip = [System.IO.Compression.ZipFile]::Open($dest, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $src -Recurse | Where-Object { 
    $_.FullName -notmatch '\\node_modules(\\|$)' -and 
    $_.FullName -notmatch '\\\.next\\cache(\\|$)' -and
    $_.FullName -notmatch '\\\.next\\dev(\\|$)' -and
    $_.FullName -notmatch '\\\.next\\diagnostics(\\|$)' -and
    $_.FullName -notmatch '\\\.git(\\|$)'
} | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $rel = $_.FullName.Substring($src.Length + 1).Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, [System.IO.Compression.CompressionLevel]::Fastest) | Out-Null
    }
}
$zip.Dispose()

Copy-Item $dest 'D:\ZEX\Ghar tak\plesk_deploy.zip' -Force
$mb = [math]::Round(((Get-Item $dest).Length / 1MB), 2)
Write-Host "SUCCESS: GTS_UPDATE.zip and plesk_deploy.zip created ($mb MB)"
