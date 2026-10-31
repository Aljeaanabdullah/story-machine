# One-time setup for the free local neural TTS server (Windows PowerShell).
# Creates a private Python environment, installs Piper, and downloads the voices.
#   powershell -ExecutionPolicy Bypass -File tools/tts-server/setup.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

if (-not (Test-Path .venv)) { python -m venv .venv }
& .venv\Scripts\python -m pip install --upgrade pip
& .venv\Scripts\python -m pip install piper-tts==1.8.0

$base = 'https://huggingface.co/rhasspy/piper-voices/resolve/main'
$voices = @(
  'ar/ar_JO/kareem/medium/ar_JO-kareem-medium',
  'en/en_US/ryan/high/en_US-ryan-high',
  'en/en_US/lessac/medium/en_US-lessac-medium',
  'en/en_GB/alan/medium/en_GB-alan-medium',
  'en/en_US/amy/medium/en_US-amy-medium'
)
New-Item -ItemType Directory -Force voices | Out-Null
foreach ($v in $voices) {
  $name = Split-Path $v -Leaf
  foreach ($ext in @('.onnx', '.onnx.json')) {
    $out = "voices\$name$ext"
    if (-not (Test-Path $out)) { Invoke-WebRequest "$base/$v$ext" -OutFile $out }
  }
}
Write-Host 'Done. Start the server with: npm run tts'
