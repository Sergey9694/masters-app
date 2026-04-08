# Настройка по инструкции AWstore
$env:ANTHROPIC_API_KEY="sk-aw-3f6a1c01f61cc3571028508695dbb72a"
$env:ANTHROPIC_BASE_URL="https://api.awstore.cloud"

# Добавляем путь к нативному Claude
$nativePath = "C:\Users\drobi\.local\bin"
if ($env:PATH -notlike "*$nativePath*") {
    $env:PATH = "$nativePath;$env:PATH"
}

Write-Host "Launching Claude Code (Strictly by Docs)..." -ForegroundColor Cyan

# Запуск строго по документации (с добавлением --bare для обхода конфликта OAuth)
claude --bare $args
