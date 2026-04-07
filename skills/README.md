# Skills 鐩綍璇存槑

## 缁熶竴鐨?Skill 绠＄悊

鎵€鏈?Skills 缁熶竴瀛樻斁鍦ㄩ」鐩牴鐩綍鐨?`skills/` 鏂囦欢澶逛腑銆?

## 鐩綍缁撴瀯

```
skills/
鈹溾攢鈹€ paper-analysis/
鈹?  鈹斺攢鈹€ SKILL.md
鈹溾攢鈹€ sci-paper-writing/
鈹?  鈹斺攢鈹€ SKILL.md
鈹溾攢鈹€ xhs-vibe-write/
鈹?  鈹斺攢鈹€ SKILL.md
鈹斺攢鈹€ your-custom-skill/
    鈹斺攢鈹€ SKILL.md
```

## Skill 鍛戒护

### 鏌ョ湅鎵€鏈夊彲鐢ㄧ殑 Skills

```bash
slime skill list
```

### 浠?GitHub 瀹夎 Skill

```bash
slime skill install-github owner/repo
```

绀轰緥锛?
```bash
slime skill install-github obra/superpowers
```

Skill 浼氳鍏嬮殕鍒?`skills/` 鐩綍銆?

### 鏌ョ湅 Skill 璇︽儏

```bash
slime skill info <skill-name>
```

### 鍒犻櫎 Skill

```bash
slime skill remove <skill-name>
```

寮哄埗鍒犻櫎锛堜笉璇㈤棶锛夛細
```bash
slime skill remove <skill-name> -f
```

## 鎵嬪姩娣诲姞 Skill

鐩存帴鍦?`skills/` 鐩綍涓嬪垱寤烘枃浠跺す锛屾瘡涓?Skill 鍖呭惈涓€涓?`SKILL.md` 鏂囦欢锛?

```
skills/
鈹斺攢鈹€ my-custom-skill/
    鈹斺攢鈹€ SKILL.md
```

### SKILL.md 鏍煎紡

```markdown
---
name: my-custom-skill
description: 鎴戠殑鑷畾涔?Skill
invocable: user
---

# Skill 鍐呭

鍦ㄨ繖閲岀紪鍐?Skill 鐨勫叿浣撴寚浠?..
```

## 娉ㄦ剰浜嬮」

- 鉁?鎵€鏈?Skills 缁熶竴鍦?`skills/` 鐩綍
- 鉁?姣忎釜 Skill 涓€涓嫭绔嬫枃浠跺す
- 鉁?蹇呴』鍖呭惈 `SKILL.md` 鏂囦欢
- 鉁?鏀寔浠?GitHub 鐩存帴瀹夎
- 鉂?涓嶅啀鏀寔澶氱骇鐩綍锛坣pm銆佺敤鎴风骇銆侀」鐩骇绛夊鏉傜粨鏋勶級

## 杩佺Щ鐜版湁 Skills

濡傛灉浣犱箣鍓嶇殑 Skills 鍦ㄥ叾浠栦綅缃紙濡?`.slime/skills/` 鎴?`~/.slime/skills/`锛夛紝璇锋墜鍔ㄧЩ鍔ㄥ埌 `skills/` 鐩綍锛?

```bash
# 绀轰緥锛氳縼绉?.slime/skills/ 涓殑 Skills
mv .slime/skills/* skills/
```

