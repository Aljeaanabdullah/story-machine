# One-time setup for the free local AI video server (Windows PowerShell, NVIDIA GPU).
# Creates a private Python environment with CUDA PyTorch and downloads Wan2.2 TI2V-5B:
# the text encoder and VAE from Wan-AI, and a Q6_K GGUF transformer from QuantStack (~17 GB total).
#   powershell -ExecutionPolicy Bypass -File tools/video-server/setup.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

if (-not (Test-Path .venv)) { py -3.13 -m venv .venv }
& .venv\Scripts\python -m pip install --upgrade pip
& .venv\Scripts\python -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
& .venv\Scripts\python -m pip install diffusers transformers accelerate gguf bitsandbytes imageio imageio-ffmpeg sentencepiece ftfy

$base = 'https://huggingface.co/Wan-AI/Wan2.2-TI2V-5B-Diffusers/resolve/main'
$files = @(
  'model_index.json', 'scheduler/scheduler_config.json',
  'text_encoder/config.json', 'text_encoder/model.safetensors.index.json',
  'text_encoder/model-00001-of-00003.safetensors', 'text_encoder/model-00002-of-00003.safetensors', 'text_encoder/model-00003-of-00003.safetensors',
  'tokenizer/special_tokens_map.json', 'tokenizer/spiece.model', 'tokenizer/tokenizer.json', 'tokenizer/tokenizer_config.json',
  'transformer/config.json', 'vae/config.json', 'vae/diffusion_pytorch_model.safetensors'
)
foreach ($f in $files) {
  $out = "models\wan22\$f"
  New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
  curl.exe -L --retry 5 -C - -o $out "$base/$f"  # -C - resumes a partial download
}
$gguf = 'models\Wan2.2-TI2V-5B-Q6_K.gguf'
curl.exe -L --retry 5 -C - -o $gguf 'https://huggingface.co/QuantStack/Wan2.2-TI2V-5B-GGUF/resolve/main/Wan2.2-TI2V-5B-Q6_K.gguf'
Write-Host 'Done. Start the server with: npm run video'
