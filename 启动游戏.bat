@echo off
chcp 65001 >nul
title 高考志愿 · 命运执笔人

echo.
echo  ========================================
echo   高考志愿 · 命运执笔人  启动器
echo  ========================================
echo.

REM 检查端口 8000 是否已被占用（server 是否在跑）
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if %errorlevel% neq 0 (
  echo  [1/2] 启动本地服务器...
  start "高考志愿-服务器" /min cmd /c "cd /d %~dp0 && node serve.mjs 8000"
  timeout /t 2 /nobreak >nul
) else (
  echo  [1/2] 本地服务器已在运行
)

echo  [2/2] 用全新窗口打开游戏（无缓存）...
echo.
echo  🌐 访问地址: http://localhost:8000/
echo  💡 关闭弹出的浏览器窗口即可停止
echo.

REM 用全新临时配置打开 Chrome（零缓存，不影响你平时的浏览器）
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --new-window --user-data-dir="%TEMP%\gk-chrome-clean" --disable-extensions "http://localhost:8000/"
) else if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
  start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --new-window --user-data-dir="%TEMP%\gk-chrome-clean" --disable-extensions "http://localhost:8000/"
) else (
  echo  ⚠ 未找到 Chrome，请手动打开浏览器访问 http://localhost:8000/
  start "" "http://localhost:8000/"
)

exit
