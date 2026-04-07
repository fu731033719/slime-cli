# ============================================
#  Slime 涓€閿畨瑁呰剼鏈?(Windows PowerShell)
#  鐢ㄦ硶: 鍙抽敭浠ョ鐞嗗憳韬唤杩愯锛屾垨鍦?PowerShell 涓墽琛?
#  irm https://raw.githubusercontent.com/fu731033719/slime-cli/main/install.ps1 | iex
# ============================================

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/fu731033719/slime-cli.git"
$InstallDir = "$env:USERPROFILE\slime"
$DashboardPort = 3800

function Write-Banner {
    Write-Host ""
    Write-Host "  鈻堚枅鈺? 鈻堚枅鈺椻枅鈻堚晽 鈻堚枅鈻堚枅鈻堚晽  鈻堚枅鈻堚枅鈻堚枅鈺?鈻堚枅鈻堚枅鈻堚枅鈺? 鈻堚枅鈻堚枅鈻堚晽" -ForegroundColor Cyan
    Write-Host "  鈺氣枅鈻堚晽鈻堚枅鈺斺暆鈻堚枅鈺戔枅鈻堚晹鈺愨晲鈻堚枅鈺椻枅鈻堚晹鈺愨晲鈺愨枅鈻堚晽鈻堚枅鈺斺晲鈺愨枅鈻堚晽鈻堚枅鈺斺晲鈺愨枅鈻堚晽" -ForegroundColor Cyan
    Write-Host "   鈺氣枅鈻堚枅鈺斺暆 鈻堚枅鈺戔枅鈻堚枅鈻堚枅鈻堚枅鈺戔枅鈻堚晳   鈻堚枅鈺戔枅鈻堚枅鈻堚枅鈻堚晹鈺濃枅鈻堚枅鈻堚枅鈻堚枅鈺? -ForegroundColor Cyan
    Write-Host "   鈻堚枅鈺斺枅鈻堚晽 鈻堚枅鈺戔枅鈻堚晹鈺愨晲鈻堚枅鈺戔枅鈻堚晳   鈻堚枅鈺戔枅鈻堚晹鈺愨晲鈻堚枅鈺椻枅鈻堚晹鈺愨晲鈻堚枅鈺? -ForegroundColor Cyan
    Write-Host "  鈻堚枅鈺斺暆 鈻堚枅鈺椻枅鈻堚晳鈻堚枅鈺? 鈻堚枅鈺戔暁鈻堚枅鈻堚枅鈻堚枅鈺斺暆鈻堚枅鈻堚枅鈻堚枅鈺斺暆鈻堚枅鈺? 鈻堚枅鈺? -ForegroundColor Cyan
    Write-Host "  鈺氣晲鈺? 鈺氣晲鈺濃暁鈺愨暆鈺氣晲鈺? 鈺氣晲鈺?鈺氣晲鈺愨晲鈺愨晲鈺?鈺氣晲鈺愨晲鈺愨晲鈺?鈺氣晲鈺? 鈺氣晲鈺? -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  涓€閿畨瑁呯▼搴?(Windows)" -ForegroundColor White
    Write-Host ""
}

function Log($msg) { Write-Host "[鉁揮 $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "[!] $msg" -ForegroundColor Yellow }
function Err($msg) { Write-Host "[鉁梋 $msg" -ForegroundColor Red; exit 1 }

function Test-Command($cmd) {
    try { Get-Command $cmd -ErrorAction Stop | Out-Null; return $true }
    catch { return $false }
}

# ---- 妫€鏌?Git ----
function Check-Git {
    if (Test-Command "git") {
        Log "Git 宸插畨瑁? $(git --version)"
    } else {
        Warn "鏈娴嬪埌 Git锛屾鍦ㄤ笅杞藉畨瑁?.."
        $gitInstaller = "$env:TEMP\git-installer.exe"
        Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe" -OutFile $gitInstaller
        Start-Process -FilePath $gitInstaller -Args "/VERYSILENT /NORESTART" -Wait
        $env:PATH = "$env:PATH;C:\Program Files\Git\bin"
        Log "Git 瀹夎瀹屾垚"
    }
}

# ---- 妫€鏌?Node.js ----
function Check-Node {
    if (Test-Command "node") {
        $ver = (node -v) -replace 'v','' -split '\.' | Select-Object -First 1
        if ([int]$ver -ge 18) {
            Log "Node.js 宸插畨瑁? $(node -v)"
            return
        }
        Warn "Node.js 鐗堟湰杩囦綆 ($(node -v))锛岄渶瑕?>= 18"
    } else {
        Warn "鏈娴嬪埌 Node.js"
    }

    Write-Host "姝ｅ湪涓嬭浇 Node.js 20..."
    $nodeInstaller = "$env:TEMP\node-installer.msi"
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi" -OutFile $nodeInstaller
    Start-Process msiexec.exe -Args "/i `"$nodeInstaller`" /quiet /norestart" -Wait
    $env:PATH = "$env:PATH;C:\Program Files\nodejs"
    Log "Node.js 瀹夎瀹屾垚: $(node -v)"
}

# ---- 鍏嬮殕/鏇存柊浠撳簱 ----
function Setup-Repo {
    if (Test-Path "$InstallDir\.git") {
        Log "妫€娴嬪埌宸叉湁瀹夎锛屾鍦ㄦ洿鏂?.."
        Set-Location $InstallDir
        git pull --ff-only 2>$null
        if ($LASTEXITCODE -ne 0) { Warn "鏇存柊澶辫触锛屼娇鐢ㄧ幇鏈夌増鏈户缁? }
    } else {
        Log "姝ｅ湪涓嬭浇 Slime..."
        git clone $RepoUrl $InstallDir
        Set-Location $InstallDir
    }
}

# ---- 瀹夎渚濊禆 ----
function Install-Deps {
    Log "姝ｅ湪瀹夎渚濊禆..."
    npm install --no-audit --no-fund 2>$null
    Log "渚濊禆瀹夎瀹屾垚"
}

# ---- 鏋勫缓 ----
function Build-Project {
    Log "姝ｅ湪鏋勫缓..."
    npm run build 2>$null
    Log "鏋勫缓瀹屾垚"
}

# ---- 鍒濆鍖栭厤缃?----
function Init-Config {
    if (-not (Test-Path "$InstallDir\.env")) {
        Copy-Item "$InstallDir\.env.example" "$InstallDir\.env"
        Log "宸插垱寤?.env 閰嶇疆鏂囦欢锛堣鍦?Dashboard 涓厤缃?API Key锛?
    } else {
        Log ".env 閰嶇疆鏂囦欢宸插瓨鍦?
    }
}

# ---- 鍒涘缓鍚姩鑴氭湰 ----
function Create-Launcher {
    $launcher = "$InstallDir\start.bat"
    @"
@echo off
cd /d "%~dp0"
echo 姝ｅ湪鍚姩 Slime Dashboard...
start http://localhost:$DashboardPort
npx tsx src/index.ts dashboard
"@ | Out-File -FilePath $launcher -Encoding ASCII
    Log "鍚姩鑴氭湰宸插垱寤? $launcher"

    # 鍒涘缓妗岄潰蹇嵎鏂瑰紡
    try {
        $desktop = [Environment]::GetFolderPath("Desktop")
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut("$desktop\Slime Dashboard.lnk")
        $shortcut.TargetPath = $launcher
        $shortcut.WorkingDirectory = $InstallDir
        $shortcut.IconLocation = "shell32.dll,21"
        $shortcut.Save()
        Log "妗岄潰蹇嵎鏂瑰紡宸插垱寤?
    } catch {
        Warn "妗岄潰蹇嵎鏂瑰紡鍒涘缓澶辫触锛堜笉褰卞搷浣跨敤锛?
    }
}

# ---- 涓绘祦绋?----
Write-Banner
Check-Git
Check-Node
Write-Host ""
Setup-Repo
Install-Deps
Build-Project
Init-Config
Create-Launcher

Write-Host ""
Write-Host "鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲" -ForegroundColor Green
Write-Host "  Slime 瀹夎瀹屾垚锛? -ForegroundColor Green
Write-Host "鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲" -ForegroundColor Green
Write-Host ""
Write-Host "  瀹夎鐩綍: $InstallDir"
Write-Host "  鍚姩鏂瑰紡: 鍙屽嚮妗岄潰 'Slime Dashboard' 蹇嵎鏂瑰紡"
Write-Host "  鎴栬繍琛?   $InstallDir\start.bat"
Write-Host "  Dashboard: http://localhost:$DashboardPort"
Write-Host ""

$reply = Read-Host "鏄惁鐜板湪鍚姩 Dashboard锛焄Y/n]"
if ($reply -ne "n" -and $reply -ne "N") {
    Set-Location $InstallDir
    & "$InstallDir\start.bat"
}

