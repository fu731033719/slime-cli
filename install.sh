#!/bin/bash
set -e

# ============================================
#  Slime 涓€閿畨瑁呰剼鏈?(macOS / Linux)
# ============================================

REPO_URL="https://github.com/fu731033719/slime-cli.git"
INSTALL_DIR="$HOME/slime"
DASHBOARD_PORT=3800

# 棰滆壊
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_banner() {
  echo ""
  echo -e "${CYAN}"
  echo "  鈻堚枅鈺? 鈻堚枅鈺椻枅鈻堚晽 鈻堚枅鈻堚枅鈻堚晽  鈻堚枅鈻堚枅鈻堚枅鈺?鈻堚枅鈻堚枅鈻堚枅鈺? 鈻堚枅鈻堚枅鈻堚晽"
  echo "  鈺氣枅鈻堚晽鈻堚枅鈺斺暆鈻堚枅鈺戔枅鈻堚晹鈺愨晲鈻堚枅鈺椻枅鈻堚晹鈺愨晲鈺愨枅鈻堚晽鈻堚枅鈺斺晲鈺愨枅鈻堚晽鈻堚枅鈺斺晲鈺愨枅鈻堚晽"
  echo "   鈺氣枅鈻堚枅鈺斺暆 鈻堚枅鈺戔枅鈻堚枅鈻堚枅鈻堚枅鈺戔枅鈻堚晳   鈻堚枅鈺戔枅鈻堚枅鈻堚枅鈻堚晹鈺濃枅鈻堚枅鈻堚枅鈻堚枅鈺?
  echo "   鈻堚枅鈺斺枅鈻堚晽 鈻堚枅鈺戔枅鈻堚晹鈺愨晲鈻堚枅鈺戔枅鈻堚晳   鈻堚枅鈺戔枅鈻堚晹鈺愨晲鈻堚枅鈺椻枅鈻堚晹鈺愨晲鈻堚枅鈺?
  echo "  鈻堚枅鈺斺暆 鈻堚枅鈺椻枅鈻堚晳鈻堚枅鈺? 鈻堚枅鈺戔暁鈻堚枅鈻堚枅鈻堚枅鈺斺暆鈻堚枅鈻堚枅鈻堚枅鈺斺暆鈻堚枅鈺? 鈻堚枅鈺?
  echo "  鈺氣晲鈺? 鈺氣晲鈺濃暁鈺愨暆鈺氣晲鈺? 鈺氣晲鈺?鈺氣晲鈺愨晲鈺愨晲鈺?鈺氣晲鈺愨晲鈺愨晲鈺?鈺氣晲鈺? 鈺氣晲鈺?
  echo -e "${NC}"
  echo "  涓€閿畨瑁呯▼搴?
  echo ""
}

log() { echo -e "${GREEN}[鉁揮${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[鉁梋${NC} $1"; exit 1; }

# 妫€鏌ュ懡浠ゆ槸鍚﹀瓨鍦?
has() { command -v "$1" &>/dev/null; }

# ---- 妫€鏌?Git ----
check_git() {
  if has git; then
    log "Git 宸插畨瑁? $(git --version)"
  else
    warn "鏈娴嬪埌 Git锛屾鍦ㄥ畨瑁?.."
    if has brew; then
      brew install git
    elif has apt-get; then
      sudo apt-get update && sudo apt-get install -y git
    elif has yum; then
      sudo yum install -y git
    else
      err "鏃犳硶鑷姩瀹夎 Git锛岃鎵嬪姩瀹夎鍚庨噸璇?
    fi
    log "Git 瀹夎瀹屾垚"
  fi
}

# ---- 妫€鏌?Node.js ----
check_node() {
  if has node; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VER" -ge 18 ]; then
      log "Node.js 宸插畨瑁? $(node -v)"
      return
    else
      warn "Node.js 鐗堟湰杩囦綆 ($(node -v))锛岄渶瑕?>= 18"
    fi
  else
    warn "鏈娴嬪埌 Node.js"
  fi

  echo ""
  echo "姝ｅ湪瀹夎 Node.js 20..."

  if has brew; then
    brew install node@20
    brew link --overwrite node@20 2>/dev/null || true
  elif has apt-get; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    # 浣跨敤 nvm
    if ! has nvm; then
      curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
      export NVM_DIR="$HOME/.nvm"
      [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    fi
    nvm install 20
    nvm use 20
  fi

  log "Node.js 瀹夎瀹屾垚: $(node -v)"
}

# ---- 妫€鏌?Python3 (鍙€夛紝鐢ㄤ簬 skill 鐨?python 渚濊禆) ----
check_python() {
  if has python3; then
    log "Python3 宸插畨瑁? $(python3 --version)"
  else
    warn "鏈娴嬪埌 Python3锛堥儴鍒?skill 闇€瑕侊級锛屽缓璁◢鍚庡畨瑁?
  fi
}

# ---- 鍏嬮殕/鏇存柊浠撳簱 ----
setup_repo() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    log "妫€娴嬪埌宸叉湁瀹夎锛屾鍦ㄦ洿鏂?.."
    cd "$INSTALL_DIR"
    git pull --ff-only || warn "鏇存柊澶辫触锛屼娇鐢ㄧ幇鏈夌増鏈户缁?
  else
    log "姝ｅ湪涓嬭浇 Slime..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi
}

# ---- 瀹夎渚濊禆 ----
install_deps() {
  log "姝ｅ湪瀹夎渚濊禆..."
  npm install --no-audit --no-fund 2>&1 | tail -1
  log "渚濊禆瀹夎瀹屾垚"
}

# ---- 鏋勫缓 ----
build_project() {
  log "姝ｅ湪鏋勫缓..."
  npm run build 2>&1 | tail -1
  log "鏋勫缓瀹屾垚"
}

# ---- 鍒濆鍖栭厤缃?----
init_config() {
  if [ ! -f "$INSTALL_DIR/.env" ]; then
    cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
    log "宸插垱寤?.env 閰嶇疆鏂囦欢锛堣鍦?Dashboard 涓厤缃?API Key锛?
  else
    log ".env 閰嶇疆鏂囦欢宸插瓨鍦?
  fi
}

# ---- 鍒涘缓鍚姩鑴氭湰 ----
create_launcher() {
  LAUNCHER="$INSTALL_DIR/start.sh"
  cat > "$LAUNCHER" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "姝ｅ湪鍚姩 Slime Dashboard..."
npx tsx src/index.ts dashboard &
sleep 2
open "http://localhost:3800" 2>/dev/null || xdg-open "http://localhost:3800" 2>/dev/null || echo "璇锋墦寮€娴忚鍣ㄨ闂?http://localhost:3800"
wait
EOF
  chmod +x "$LAUNCHER"
  log "鍚姩鑴氭湰宸插垱寤? $LAUNCHER"
}

# ---- 涓绘祦绋?----
main() {
  print_banner

  check_git
  check_node
  check_python
  echo ""

  setup_repo
  install_deps
  build_project
  init_config
  create_launcher

  echo ""
  echo -e "${GREEN}鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲${NC}"
  echo -e "${GREEN}  Slime 瀹夎瀹屾垚锛?{NC}"
  echo -e "${GREEN}鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲${NC}"
  echo ""
  echo "  瀹夎鐩綍: $INSTALL_DIR"
  echo "  鍚姩鍛戒护: $INSTALL_DIR/start.sh"
  echo "  Dashboard: http://localhost:$DASHBOARD_PORT"
  echo ""

  read -p "鏄惁鐜板湪鍚姩 Dashboard锛焄Y/n] " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    cd "$INSTALL_DIR"
    bash start.sh
  fi
}

main

