# macOS 鏋勫缓鎸囧崡

## 鍓嶇疆鍑嗗

鍦?macOS 鏈哄櫒涓婃墽琛屼互涓嬫楠わ細

### 1. 娣诲姞 macOS Node 浜岃繘鍒?

```bash
cp $(which node) build-resources/node/node
chmod +x build-resources/node/node
```

### 2. 瀹夎渚濊禆

```bash
npm install
```

### 3. 鏋勫缓搴旂敤

```bash
npm run electron:build:mac
```

### 4. 杈撳嚭鏂囦欢

鏋勫缓瀹屾垚鍚庯紝DMG 瀹夎鍖呬細鐢熸垚鍦?`release` 鐩綍锛?
- `Slime-{version}-arm64.dmg` (Apple Silicon)
- `Slime-{version}-x64.dmg` (Intel)

## 娉ㄦ剰浜嬮」

- 纭繚 `build-resources/node/` 鐩綍鍚屾椂鍖呭惈 `node.exe` (Windows) 鍜?`node` (macOS)
- macOS 鏋勫缓蹇呴』鍦?macOS 绯荤粺涓婅繘琛?
- 浠ｇ爜宸叉敮鎸佽法骞冲彴锛屼細鑷姩鏍规嵁绯荤粺閫夋嫨姝ｇ‘鐨?node 浜岃繘鍒舵枃浠?

