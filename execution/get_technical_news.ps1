# get_technical_news.ps1  —  Wrapper atualizado para chamada do pipeline em Python
$env:PATH = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('PATH', 'User')

$TmpPath = Join-Path $PSScriptRoot "..\\.tmp"
if (-Not (Test-Path $TmpPath)) { New-Item -ItemType Directory -Force -Path $TmpPath | Out-Null }

# Locate Python
$pythonExe = ""
$candidates = @(
    "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
    "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
    "$env:ProgramFiles\Python312\python.exe",
    "C:\Python312\python.exe"
)
foreach ($c in $candidates) { if (Test-Path $c) { $pythonExe = $c; break } }
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if ($pythonCmd) { $pythonExe = $pythonCmd.Source }
if (-not $pythonExe) { Write-Error "Python nao encontrado."; exit 1 }

$script = Join-Path $PSScriptRoot "fetch_all.py"
Write-Host "Executando: $pythonExe $script"
& $pythonExe $script
Write-Host "Done."
