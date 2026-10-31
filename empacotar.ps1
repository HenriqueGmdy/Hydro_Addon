# Gera HydroAddon.mcaddon com o BP e o RP desta pasta.
# Uso: clique com o botão direito > "Executar com o PowerShell", ou rode .\empacotar.ps1 no terminal do VS Code.
$raiz = $PSScriptRoot
$zip = Join-Path $raiz "HydroAddon.zip"
$saida = Join-Path $raiz "HydroAddon.mcaddon"
if (Test-Path $zip) { Remove-Item $zip }
if (Test-Path $saida) { Remove-Item $saida }
Compress-Archive -Path (Join-Path $raiz "Hydro_BP"), (Join-Path $raiz "Hydro_RP") -DestinationPath $zip
Rename-Item $zip "HydroAddon.mcaddon"
Write-Host "Pronto: $saida"
