# Slime Skill Hub

Slime 瀹樻柟 Skill 鍟嗗簵绱㈠紩浠撳簱銆?

## 浠€涔堟槸 Skill Hub锛?

Skill Hub 鏄?Slime 鐨勮兘鍔涙墿灞曞競鍦恒€傚紑鍙戣€呭彲浠ュ皢鑷繁寮€鍙戠殑 Skill 鍙戝竷鍒拌繖閲岋紝璁╂墍鏈?Slime 鐢ㄦ埛閮借兘閫氳繃 Dashboard 涓€閿畨瑁呫€?

## 鏋舵瀯璁捐

- **鍘讳腑蹇冨寲**锛歋kill 浠ｇ爜鎵樼鍦ㄥ紑鍙戣€呰嚜宸辩殑 GitHub 浠撳簱
- **杞婚噺绾х储寮?*锛氭湰浠撳簱鍙淮鎶?`registry.json` 绱㈠紩鏂囦欢
- **绀惧尯椹卞姩**锛氫换浣曚汉閮藉彲浠ラ€氳繃 PR 璐＄尞鏂?Skill

## 濡備綍鍙戝竷 Skill锛?

### 鏂规硶 1锛氫娇鐢?skill-publish锛堟帹鑽愶級

Slime 鍐呯疆浜?`skill-publish` skill锛屽彲浠ヨ嚜鍔ㄥ畬鎴愭暣涓彂甯冩祦绋嬶細

```bash
# 鍦?Slime 涓墽琛?
/skill-publish <浣犵殑skill鍚嶇О>
```

瀹冧細鑷姩锛?
1. 鍦ㄤ綘鐨?GitHub 鍒涘缓 `slime-skill-<name>` 浠撳簱
2. 鎺ㄩ€?skill 浠ｇ爜
3. Fork 鏈粨搴?
4. 鏇存柊 registry.json
5. 鎻愪氦 PR

### 鏂规硶 2锛氭墜鍔ㄥ彂甯?

1. **鍒涘缓 Skill 浠撳簱**
   - 鍦?GitHub 鍒涘缓鍏紑浠撳簱锛堝缓璁懡鍚嶏細`slime-skill-<name>`锛?
   - 鎺ㄩ€佷綘鐨?skill 浠ｇ爜锛堝繀椤诲寘鍚?`SKILL.md`锛?

2. **Fork 鏈粨搴?*

3. **缂栬緫 registry.json**

   娣诲姞浣犵殑 skill 鏉＄洰锛?
   ```json
   {
     "name": "your-skill-name",
     "description": "绠€鐭弿杩颁綘鐨?skill 鍔熻兘",
     "category": "宸ュ叿",
     "recommended": false,
     "repo": "https://github.com/your-username/slime-skill-your-skill-name"
   }
   ```

4. **鎻愪氦 PR**

   PR 鏍囬锛歚Add skill: <skill-name>`

## Registry 瀛楁璇存槑

| 瀛楁 | 绫诲瀷 | 璇存槑 |
|------|------|------|
| `name` | string | Skill 鍚嶇О锛堝繀椤讳笌 SKILL.md 涓殑 name 涓€鑷达級 |
| `description` | string | 绠€鐭弿杩帮紙寤鸿 50 瀛椾互鍐咃級 |
| `category` | string | 鍒嗙被锛氭牳蹇冦€佸伐鍏枫€佹晥鐜囥€佺鐮斻€佽繍缁淬€佸叾浠?|
| `recommended` | boolean | 鏄惁鎺ㄨ崘锛堢敱缁存姢鑰呭喅瀹氾級 |
| `repo` | string | GitHub 浠撳簱鍦板潃锛堝畬鏁?URL锛?|

## Skill 寮€鍙戣鑼?

### 蹇呴渶鏂囦欢

- `SKILL.md`锛歋kill 鍏冩暟鎹拰浣跨敤璇存槑

### 鍙€夋枃浠?

- `requirements.txt`锛歅ython 渚濊禆
- `*.py`锛歅ython 宸ュ叿鑴氭湰
- `*.ts` / `*.js`锛歍ypeScript/JavaScript 宸ュ叿

### SKILL.md 鏍煎紡

```markdown
---
name: your-skill-name
description: "绠€鐭弿杩?
invocable: user
autoInvocable: false
argument-hint: "<鍙傛暟鎻愮ず>"
max-turns: 20
---

# Skill 鍚嶇О

璇︾粏璇存槑...
```

## 瀹℃牳鏍囧噯

PR 浼氭牴鎹互涓嬫爣鍑嗗鏍革細

- 鉁?SKILL.md 鏍煎紡姝ｇ‘
- 鉁?鍔熻兘鎻忚堪娓呮櫚
- 鉁?浠ｇ爜璐ㄩ噺鑹ソ
- 鉁?鏃犳伓鎰忎唬鐮?
- 鉁?鏃犻噸澶嶅姛鑳?

## 绀惧尯

- 闂鍙嶉锛歔Issues](https://github.com/buildsense-ai/Slime-Skill-Hub/issues)
- 璁ㄨ浜ゆ祦锛歔Discussions](https://github.com/buildsense-ai/Slime-Skill-Hub/discussions)

## License

MIT

