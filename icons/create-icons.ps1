# Create extension icons (Windows PowerShell)
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -AssemblyName System.Drawing

function Create-Icon($size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 124, 92, 255))
    $g.FillRectangle($brush, 0, 0, $size, $size)
    $g.FillEllipse([System.Drawing.Brushes]::White, $size*0.2, $size*0.15, $size*0.3, $size*0.3)
    $pts = @(
        [System.Drawing.Point]::new([int]($size*0.35), [int]($size*0.6)),
        [System.Drawing.Point]::new([int]($size*0.65), [int]($size*0.6)),
        [System.Drawing.Point]::new([int]($size*0.5), [int]($size*0.85))
    )
    $g.FillPolygon([System.Drawing.Brushes]::White, $pts)
    $path = Join-Path $dir "icon$size.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host "Created $path"
}

16, 48, 128 | ForEach-Object { Create-Icon $_ }
Write-Host "Done! Icons are ready in the icons folder."
