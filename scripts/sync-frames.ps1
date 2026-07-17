# ===============================================================
# sync-frames.ps1 - takes control of D:\Mokshify\frames\*
#
# Run this after adding, replacing, or removing frame sequences:
#   powershell -ExecutionPolicy Bypass -File scripts\sync-frames.ps1
#
# For every frames\<n>\ folder it:
#   1. validates the frame_%06d.png numbering is contiguous from 1
#   2. checks the first/last frames share one resolution
#   3. writes manifest.json  →  the site engine (FrameLoader.ts) reads it
#      and skips network probing entirely
#   4. reports totals so payload growth never goes unnoticed
# ===============================================================

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$framesRoot = Join-Path $PSScriptRoot "..\frames" | Resolve-Path
Write-Host "-- sync-frames · $framesRoot" -ForegroundColor DarkCyan

$ok = $true
foreach ($dir in Get-ChildItem $framesRoot -Directory | Sort-Object Name) {
    $pngs = Get-ChildItem $dir.FullName -Filter "frame_*.png" | Sort-Object Name
    if (-not $pngs) {
        Write-Host ("scene {0}: no frames - skipped (engine treats it as dead)" -f $dir.Name) -ForegroundColor Yellow
        $stale = Join-Path $dir.FullName "manifest.json"
        if (Test-Path $stale) { Remove-Item $stale -Force -Confirm:$false }
        continue
    }

    # numbering must be 1..N with no gaps
    $nums = $pngs | ForEach-Object { [int]($_.BaseName -replace "frame_", "") }
    $gaps = @()
    for ($i = 0; $i -lt $nums.Count; $i++) {
        if ($nums[$i] -ne $i + 1) { $gaps += ($i + 1); if ($gaps.Count -ge 5) { break } }
    }
    if ($gaps) {
        Write-Host ("scene {0}: BROKEN numbering near frame(s) {1} - fix before shipping" -f $dir.Name, ($gaps -join ", ")) -ForegroundColor Red
        $ok = $false
        continue
    }

    # resolution sanity: first vs last
    $a = [System.Drawing.Image]::FromFile($pngs[0].FullName)
    $b = [System.Drawing.Image]::FromFile($pngs[-1].FullName)
    $dims = "$($a.Width)x$($a.Height)"
    if ($a.Width -ne $b.Width -or $a.Height -ne $b.Height) {
        Write-Host ("scene {0}: MIXED resolutions ({1} vs {2}x{3})" -f $dir.Name, $dims, $b.Width, $b.Height) -ForegroundColor Red
        $ok = $false
    }
    $w = $a.Width; $h = $a.Height
    $a.Dispose(); $b.Dispose()

    # manifest → FrameLoader skips HEAD probing
    $manifest = [ordered]@{
        count     = $pngs.Count
        pad       = 6
        width     = $w
        height    = $h
        generated = (Get-Date).ToString("s")
    } | ConvertTo-Json
    $manifestPath = Join-Path $dir.FullName "manifest.json"
    [System.IO.File]::WriteAllText($manifestPath, $manifest)

    $gb = [Math]::Round(($pngs | Measure-Object Length -Sum).Sum / 1GB, 2)
    Write-Host ("scene {0}: {1} frames · {2} · {3} GB · manifest written" -f $dir.Name, $pngs.Count, $dims, $gb) -ForegroundColor Green
}

if ($ok) { Write-Host "-- all sequences valid" -ForegroundColor DarkCyan }
else { Write-Host "-- problems found - see above" -ForegroundColor Red; exit 1 }
