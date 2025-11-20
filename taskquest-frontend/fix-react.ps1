Write-Host "🔄 Corrigindo react-scripts..." -ForegroundColor Yellow

# Para processos node
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Remove tudo
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Atualiza o package.json com versões corretas
$packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
$packageJson.devDependencies."react-scripts" = "5.0.1"
$packageJson | ConvertTo-Json -Depth 20 | Out-File -FilePath "package.json" -Encoding UTF8

Write-Host "📦 Instalando dependências..." -ForegroundColor Green
npm install

Write-Hile-Host "🚀 Iniciando aplicação..." -ForegroundColor Cyan
npm start