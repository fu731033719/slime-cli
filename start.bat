@echo off
cd /d "%~dp0"
echo 姝ｅ湪鍚姩 Slime Dashboard...
start http://localhost:3800
npx tsx src/index.ts dashboard

