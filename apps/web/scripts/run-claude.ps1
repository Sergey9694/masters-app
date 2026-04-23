# Скрипт для запуска Claude Code с настройками из .claude/settings.json

# 1. Определяем пути
$repoRoot = Resolve-Path "$PSScriptRoot\..\..\.."
$settingsPath = Join-Path $repoRoot ".claude\settings.json"
$nativePath = "C:\Users\drobi\.local\bin"

# 2. Добавляем путь к исполняемому файлу claude в PATH
if ($env:PATH -notlike "*$nativePath*") {
    $env:PATH = "$nativePath;$env:PATH"
}

# 3. Загружаем настройки из JSON, если файл существует
if (Test-Path $settingsPath) {
    Write-Host "Loading settings from $settingsPath..." -ForegroundColor Green
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    
    if ($settings.env) {
        # Применяем переменные окружения из JSON
        foreach ($prop in $settings.env.PSObject.Properties) {
            if ($prop.Value) {
                Set-Item "Env:$($prop.Name)" $prop.Value
                Write-Host "Set $($prop.Name) from settings.json" -ForegroundColor Gray
            }
        }
        
        # Специальная обработка для OpenRouter: 
        # Если ANTHROPIC_API_KEY пустой, но есть ANTHROPIC_AUTH_TOKEN, используем его
        if (-not $env:ANTHROPIC_API_KEY -and $env:ANTHROPIC_AUTH_TOKEN) {
            $env:ANTHROPIC_API_KEY = $env:ANTHROPIC_AUTH_TOKEN
            Write-Host "Using ANTHROPIC_AUTH_TOKEN as ANTHROPIC_API_KEY for OpenRouter compatibility" -ForegroundColor Yellow
        }

        # Исправляем URL для OpenRouter, если он не полный
        if ($env:ANTHROPIC_BASE_URL -eq "https://openrouter.ai/api") {
            $env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api/v1"
            Write-Host "Updated ANTHROPIC_BASE_URL to https://openrouter.ai/api/v1" -ForegroundColor Yellow
        }
    }
} else {
    Write-Warning "Settings file not found at $settingsPath"
}

# 4. Проверка доступности команды
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Error "Command 'claude' not found in $nativePath or PATH. Please check installation."
    exit 1
}

Write-Host "Launching Claude Code..." -ForegroundColor Cyan

# 5. Запуск
# --bare отключает OAuth и использует API Key
claude --bare $args
