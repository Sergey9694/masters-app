# Скрипт для запуска Claude Code с настройками из .claude/settings.json

# 1. Определяем пути
$repoRoot = Resolve-Path "$PSScriptRoot\..\..\.."
$settingsPath = Join-Path $repoRoot ".claude\settings.json"
$nativePath = "C:\Users\drobi\.local\bin"

# 2. Делаем Claude локальным для проекта
# Это заставит Claude хранить историю и настройки в папке проекта, а не в профиле пользователя
$env:CLAUDE_CONFIG_DIR = Join-Path $repoRoot ".claude"

# 3. Добавляем путь к исполняемому файлу claude в PATH
if ($env:PATH -notlike "*$nativePath*") {
    $env:PATH = "$nativePath;$env:PATH"
}

# 4. Загружаем настройки из JSON, если файл существует
if (Test-Path $settingsPath) {
    Write-Host "Loading local settings from $settingsPath..." -ForegroundColor Green
    $settings = Get-Content $settingsPath | ConvertFrom-Json
    
    if ($settings.env) {
        # Применяем переменные окружения из JSON
        foreach ($prop in $settings.env.PSObject.Properties) {
            Set-Item "Env:$($prop.Name)" $prop.Value
            Write-Host "Set $($prop.Name)" -ForegroundColor Gray
        }
        
        # Специальная обработка для OpenRouter: 
        # Если ANTHROPIC_API_KEY пустой, используем ANTHROPIC_AUTH_TOKEN
        if ([string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY) -and $env:ANTHROPIC_AUTH_TOKEN) {
            $env:ANTHROPIC_API_KEY = $env:ANTHROPIC_AUTH_TOKEN
            Write-Host "Using ANTHROPIC_AUTH_TOKEN as API Key" -ForegroundColor Yellow
        }

        # Исправляем URL для OpenRouter v1
        if ($env:ANTHROPIC_BASE_URL -eq "https://openrouter.ai/api") {
            $env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api/v1"
            Write-Host "Updated Base URL to v1" -ForegroundColor Yellow
        }
    }
} else {
    Write-Warning "Local settings file not found at $settingsPath"
}

# 5. Проверка доступности команды
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Error "Command 'claude' not found. Please check installation in $nativePath"
    exit 1
}

Write-Host "Launching Claude Code (Local Project Mode)..." -ForegroundColor Cyan

# 6. Запуск
# --bare отключает OAuth и использует API Key
claude --bare $args

