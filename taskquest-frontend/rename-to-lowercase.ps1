Write-Host "🔧 Renomeando arquivos para minúsculas..." -ForegroundColor Green

# Função para renomear recursivamente
function Rename-ToLowercase {
    param([string]$Path)
    
    Get-ChildItem -Path $Path -Recurse | ForEach-Object {
        if ($_.Name -cmatch '[A-Z]') {
            $newName = $_.Name.ToLower()
            $newPath = Join-Path $_.Directory.FullName $newName
            if (-not (Test-Path $newPath)) {
                Rename-Item -Path $_.FullName -NewName $newName
                Write-Host "Renamed: $($_.Name) -> $newName" -ForegroundColor Yellow
            } else {
                Write-Host "Conflict: $newName already exists, skipping $($_.Name)" -ForegroundColor Red
            }
        }
    }
}

# Renomear arquivos na pasta src
Rename-ToLowercase -Path "src"

Write-Host "Concluido!" -ForegroundColor Green