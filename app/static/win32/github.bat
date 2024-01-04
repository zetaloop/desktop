@echo off
setlocal

chcp 65001 >nul
set ELECTRON_RUN_AS_NODE=1
call "%~dp0..\..\..\GitHubDesktop.exe" "%~dp0..\cli.js" %*

endlocal
