---
name: self-evolution
description: 鑷垜杩涘寲锛氬紩瀵煎垱寤烘柊鐨?skill 鎴?Python tool锛屾墿灞?Slime 鐨勮兘鍔涜竟鐣屻€?
invocable: both
argument-hint: "<'skill' 鎴?'tool'> <绠€瑕佹弿杩版兂瑕佺殑鍔熻兘>"
max-turns: 30
---

# 鑷垜杩涘寲锛圫elf Evolution锛?

浣犳槸 Slime 鐨勮嚜鎴戣繘鍖栧紩鎿庛€傜敤鎴凤紙鎴栫郴缁燂級瑙﹀彂姝?skill 鏃讹紝浣犵殑浠诲姟鏄紩瀵煎畬鎴愪竴涓柊 skill 鎴?Python tool 鐨勮璁′笌鍒涘缓銆?

## 纭鍒?

- Skill 浜у嚭浣嶇疆锛歚skills/<name>/SKILL.md`
- Tool 浜у嚭浣嶇疆锛氭斁鍦ㄥ搴?skill 鐩綍涓?`skills/<skill-name>/<name>_tool.py`锛屼繚鎸?skill 鑷寘鍚?
- 閫氳繃宸叉湁宸ュ叿鍒涘缓鐩綍鍜屽啓鍏ユ枃浠?
- 鍛藉悕瑙勮寖锛氬彧鍏佽灏忓啓瀛楁瘝銆佹暟瀛椼€佷笅鍒掔嚎銆佽繛瀛楃锛坄^[a-zA-Z0-9_-]+$`锛?
- 涓嶈鍒涘缓涓庡凡鏈?skill/tool 鍚屽悕鐨勫唴瀹?

## 鎵ц娴佺▼

### Step 1锛氭槑纭渶姹?

鏍规嵁鐢ㄦ埛杈撳叆锛岀‘璁や互涓嬩俊鎭細

- **绫诲瀷**锛氬垱寤?skill 杩樻槸 tool锛?
  - Skill = 楂樺眰宸ヤ綔娴?鎻愮ず璇嶆ā鏉匡紙Markdown锛夛紝瀹氫箟"鎬庝箞鍋氫竴浠朵簨"
  - Tool = 搴曞眰鍙墽琛屽嚱鏁帮紙Python锛夛紝鎻愪緵鍏蜂綋鑳藉姏
- **鍚嶇О**锛氱畝娲併€佽涔夋竻鏅?
- **鏍稿績鍔熻兘**锛氫竴鍙ヨ瘽鎻忚堪瀹冨仛浠€涔?

濡傛灉鐢ㄦ埛鎻忚堪妯＄硦锛屽悜鐢ㄦ埛杩介棶銆備笉瑕佺寽娴嬨€?

### Step 2锛氳璁℃柟妗?

#### 濡傛灉鏄?Skill

璁捐浠ヤ笅鍐呭锛?

- `description`锛氫竴鍙ヨ瘽鎻忚堪
- `invocable`锛歚user`锛堢敤鎴锋墜鍔ㄨ皟鐢級/ `auto`锛堣嚜鍔ㄥ尮閰嶈Е鍙戯級/ `both`
- `argument-hint`锛氬弬鏁版彁绀猴紙鍙€夛級
- `max-turns`锛氭渶澶у璇濊疆鏁帮紙鏍规嵁澶嶆潅搴︿及绠楋級
- prompt 鍐呭锛氬畬鏁寸殑 skill 鎻愮ず璇嶏紝鍖呮嫭锛?
  - 鏍稿績鐞嗗康 / 瑙掕壊瀹氫綅
  - 纭鍒欙紙Non-Negotiables锛?
  - 鍒嗘鎵ц娴佺▼
  - 杈撳嚭鏍煎紡瑕佹眰

#### 濡傛灉鏄?Tool

璁捐浠ヤ笅鍐呭锛?

- 鑴氭湰鍚嶇О锛坰nake_case锛?
- 鑴氭湰鍔熻兘鎻忚堪
- 杈撳叆鍙傛暟
- Python 鑴氭湰锛氱嫭绔嬪彲鎵ц锛岄€氳繃 `execute_shell` 璋冪敤

Tool 鏍囧噯妯℃澘锛?

```python
#!/usr/bin/env python3
"""<宸ュ叿鎻忚堪>"""
import sys
import json

def main():
    # 浠?stdin 璇诲彇鍙傛暟锛堝鏋滈渶瑕侊級
    # params = json.loads(sys.stdin.read())

    # 瀹炵幇閫昏緫
    result = {"status": "success", "message": "瀹屾垚"}

    # 杈撳嚭缁撴灉鍒?stdout
    print(json.dumps(result, ensure_ascii=False))

if __name__ == "__main__":
    main()
```

璋冪敤鏂瑰紡锛氶€氳繃 `execute_shell` 鎵ц鑴氭湰锛屼緥濡傦細
```bash
python skills/<skill-name>/<script_name>.py
```

### Step 3锛氬悜鐢ㄦ埛纭鏂规

灏嗚璁℃柟妗堢畝瑕佸睍绀虹粰鐢ㄦ埛锛岀瓑寰呯‘璁ゃ€傚鏋滅敤鎴疯姹備慨鏀癸紝鍥炲埌 Step 2 璋冩暣銆?

### Step 4锛氭墽琛屽垱寤?

鍒涘缓鐩綍銆佸啓鍏ユ枃浠讹細

- **鍒涘缓 Skill**锛氬垱寤?`skills/<name>/` 鐩綍锛屽啓鍏?`SKILL.md`锛堝惈 YAML frontmatter + prompt 鍐呭锛夈€?
- **鍒涘缓 Tool**锛氬皢瀹屾暣 Python 浠ｇ爜鍐欏叆 `skills/<skill-name>/<tool_name>_tool.py`銆?

### Step 5锛氶獙璇?

鍒涘缓瀹屾垚鍚庯細

1. 纭鏂囦欢宸茬敓鎴愬湪姝ｇ‘浣嶇疆
2. 濡傛灉鏄?tool锛岃繍琛屼竴娆＄‘璁ゆ棤璇硶閿欒
3. 鍚戠敤鎴锋姤鍛婄粨鏋滐紝璇存槑濡備綍浣跨敤鏂板垱寤虹殑 skill/tool

## 娉ㄦ剰浜嬮」

- 鐢熸垚鐨?Python tool 浠ｇ爜蹇呴』鑳界嫭绔嬭繍琛岋紙stdin JSON 鈫?stdout JSON锛?
- Skill 鐨?prompt 瑕佽冻澶熻缁嗭紝璁?Slime 鑳界嫭绔嬫墽琛岋紝涓嶄緷璧栧垱寤鸿€呯殑闅愬惈鐭ヨ瘑
- 濡傛灉鏂?tool 闇€瑕佺涓夋柟搴擄紝鎻愰啋鐢ㄦ埛鍏?`pip install`

