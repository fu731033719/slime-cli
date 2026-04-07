#!/bin/bash
cd "$(dirname "$0")"
echo "姝ｅ湪鍚姩 Slime Dashboard..."
npx tsx src/index.ts dashboard &
DASHBOARD_PID=$!
sleep 2

# 鎵撳紑娴忚鍣?
if command -v open &>/dev/null; then
  open "http://localhost:3800"
elif command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:3800"
else
  echo "璇锋墦寮€娴忚鍣ㄨ闂?http://localhost:3800"
fi

# 绛夊緟dashboard杩涚▼
wait $DASHBOARD_PID

