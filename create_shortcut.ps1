$WshShell = New-Object -ComObject WScript.Shell
# Dynamically get the project root directory
$ProjectRoot = Get-Location
$IconPath = Join-Path $ProjectRoot "public\favicon.ico"

# Find standard Windows Desktop and OneDrive Desktop folders
$DesktopPaths = @(
    [System.IO.Path]::Combine($env:USERPROFILE, "Desktop"),
    [System.IO.Path]::Combine($env:USERPROFILE, "OneDrive", "Desktop")
)

foreach ($Desktop in $DesktopPaths) {
    if (Test-Path $Desktop) {
        $ShortcutPath = [System.IO.Path]::Combine($Desktop, "TrustCare Workshop ERP.lnk")
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        
        # Point the shortcut to cmd.exe running the batch file
        $Shortcut.TargetPath = "%SystemRoot%\System32\cmd.exe"
        $Shortcut.Arguments = "/c start_servers.bat"
        $Shortcut.WorkingDirectory = $ProjectRoot
        $Shortcut.IconLocation = $IconPath
        $Shortcut.Description = "Launch TrustCare Workshop Management System"
        $Shortcut.Save()
        
        Write-Host "Created shortcut on Desktop at: $ShortcutPath"
    }
}
