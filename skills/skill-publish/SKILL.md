---
name: skill-publish
description: "鍙戝竷 Skill 鍒板畼鏂?Skill Hub锛氬皢鏈湴 skill 鎺ㄩ€佸埌 GitHub 骞跺悜 Slime-Skill-Hub 鎻愪氦 PR锛岃鎵€鏈?Slime 鐢ㄦ埛閮借兘瀹夎銆?
invocable: user
autoInvocable: false
argument-hint: "<skill鍚嶇О>"
max-turns: 25
---

# Skill Publish

灏嗘湰鍦板凡鏈夌殑 skill 鍙戝竷鍒?Slime 瀹樻柟 Skill Hub锛岃鎵€鏈夌敤鎴烽兘鑳介€氳繃鍟嗗簵瀹夎銆?

## 鍓嶇疆鏉′欢

鐢ㄦ埛鏈哄櫒涓婇渶瑕侊細
- `git` 鍛戒护鍙敤
- GitHub 璐﹀彿锛屼笖宸查厤缃?`git` 鐨勭敤鎴峰悕鍜岄偖绠?
- GitHub Personal Access Token锛堟湁 `repo` 鍜?`workflow` 鏉冮檺锛夛紝閫氳繃鐜鍙橀噺 `GITHUB_TOKEN` 鎻愪緵锛屾垨鑰呭湪鎵ц杩囩▼涓闂敤鎴?

## 鎵ц娴佺▼

### Step 1锛氱‘璁よ鍙戝竷鐨?skill

鐢ㄦ埛鎻愪緵 skill 鍚嶇О锛堝嵆 `$ARGUMENTS`锛夛紝浣犻渶瑕侊細

1. 妫€鏌?`skills/$ARGUMENTS/SKILL.md` 鏄惁瀛樺湪
2. 璇诲彇 SKILL.md 鐨?frontmatter锛屾彁鍙?name銆乨escription銆乧ategory 绛変俊鎭?
3. 濡傛灉缂哄皯 category锛岃闂敤鎴烽€夋嫨涓€涓細鏍稿績銆佸伐鍏枫€佹晥鐜囥€佺鐮斻€佽繍缁淬€佸叾浠?
4. 鍚戠敤鎴风‘璁ゅ彂甯冧俊鎭?

濡傛灉鐢ㄦ埛娌℃湁鎸囧畾 skill 鍚嶇О锛屽垪鍑烘墍鏈夊彲鐢ㄧ殑 skill 璁╃敤鎴烽€夋嫨銆?

### Step 2锛氬垱寤?GitHub 浠撳簱骞舵帹閫?skill

1. 纭鐢ㄦ埛鐨?GitHub 鐢ㄦ埛鍚嶏細
```json
{"command":"git config user.name","description":"鑾峰彇 GitHub 鐢ㄦ埛鍚?}
```

2. 妫€鏌ユ槸鍚︽湁 GITHUB_TOKEN锛?
```json
{"command":"echo $GITHUB_TOKEN | head -c 4","description":"妫€鏌?token 鏄惁瀛樺湪"}
```
濡傛灉娌℃湁 token锛屾彁绀虹敤鎴凤細
> 闇€瑕?GitHub Token 鎵嶈兘鑷姩鍒涘缓浠撳簱鍜屾彁浜?PR銆?
> 璇峰埌 https://github.com/settings/tokens 鍒涘缓 Personal Access Token锛堝嬀閫?repo 鏉冮檺锛夈€?
> 鐒跺悗璁剧疆鐜鍙橀噺锛歟xport GITHUB_TOKEN=浣犵殑token
>
> 鎴栬€呬綘鍙互鍛婅瘔鎴?token锛屾垜鐩存帴浣跨敤锛堜粎鏈浼氳瘽鏈夋晥锛夈€?

3. 鍦ㄧ敤鎴风殑 GitHub 璐﹀彿涓嬪垱寤轰粨搴?`slime-skill-<name>`锛?
```json
{"command":"curl -s -H 'Authorization: token <TOKEN>' https://api.github.com/user/repos -d '{\"name\":\"slime-skill-<name>\",\"description\":\"<skill description>\",\"public\":true}'","description":"鍒涘缓 GitHub 浠撳簱"}
```

4. 鍒濆鍖?git 骞舵帹閫?skill 鍐呭锛?
```json
{"command":"cd skills/<name> && git init && git add -A && git commit -m 'Initial commit: <name> skill' && git branch -M main && git remote add origin https://<TOKEN>@github.com/<user>/slime-skill-<name>.git && git push -u origin main","description":"鎺ㄩ€?skill 鍒?GitHub"}
```

### Step 3锛欶ork Skill Hub 骞舵彁浜?PR

1. Fork 瀹樻柟 Skill Hub锛?
```json
{"command":"curl -s -H 'Authorization: token <TOKEN>' -X POST https://api.github.com/repos/buildsense-ai/Slime-Skill-Hub/forks","description":"Fork Skill Hub"}
```

2. 鍏嬮殕 fork 鍒颁复鏃剁洰褰曪細
```json
{"command":"cd /tmp && git clone https://<TOKEN>@github.com/<user>/Slime-Skill-Hub.git slime-hub-pr && cd slime-hub-pr && git checkout -b add-skill-<name>","description":"鍏嬮殕 fork 骞跺垱寤哄垎鏀?}
```

3. 璇诲彇鐜版湁 registry.json锛岃拷鍔犳柊 skill 鏉＄洰锛屽啓鍥炴枃浠讹細

鏂版潯鐩牸寮忥細
```json
{
  "name": "<name>",
  "description": "<description>",
  "category": "<category>",
  "recommended": false,
  "repo": "https://github.com/<user>/slime-skill-<name>"
}
```

鐢?Python 鎴?Node 鑴氭湰鏉ヤ慨鏀?JSON锛堜笉瑕佹墜鍔ㄦ嫾鎺ュ瓧绗︿覆锛夛細
```json
{"command":"python -c \"import json; d=json.load(open('registry.json')); d.append({'name':'<name>','description':'<desc>','category':'<cat>','recommended':False,'repo':'https://github.com/<user>/slime-skill-<name>'}); json.dump(d,open('registry.json','w'),indent=2,ensure_ascii=False)\"","description":"鏇存柊 registry.json"}
```

4. 鎻愪氦骞舵帹閫侊細
```json
{"command":"cd /tmp/slime-hub-pr && git add registry.json && git commit -m 'Add skill: <name>' && git push origin add-skill-<name>","description":"鎺ㄩ€佹洿鏂板埌 fork"}
```

5. 鍒涘缓 Pull Request锛?
```json
{"command":"curl -s -H 'Authorization: token <TOKEN>' https://api.github.com/repos/buildsense-ai/Slime-Skill-Hub/pulls -d '{\"title\":\"Add skill: <name>\",\"head\":\"<user>:add-skill-<name>\",\"base\":\"main\",\"body\":\"## New Skill: <name>\\n\\n<description>\\n\\nCategory: <category>\\nRepo: https://github.com/<user>/slime-skill-<name>\"}'","description":"鍒涘缓 PR"}
```

6. 娓呯悊涓存椂鐩綍锛?
```json
{"command":"rm -rf /tmp/slime-hub-pr","description":"娓呯悊涓存椂鏂囦欢"}
```

### Step 4锛氭眹鎶ョ粨鏋?

鍚戠敤鎴锋眹鎶ワ細
- Skill 浠撳簱鍦板潃锛歚https://github.com/<user>/slime-skill-<name>`
- PR 鍦板潃锛氫粠鍒涘缓 PR 鐨?API 杩斿洖涓彁鍙?`html_url`
- 璇存槑 PR 琚悎骞跺悗锛屾墍鏈?Slime 鐢ㄦ埛鍦ㄥ晢搴楀埛鏂板氨鑳界湅鍒板苟瀹夎杩欎釜 skill

## 娉ㄦ剰浜嬮」

- **缁濆涓嶈**鎶?GITHUB_TOKEN 杈撳嚭鍒板洖澶嶄腑鎴栬褰曞埌鏃ュ織
- 濡傛灉浠讳綍姝ラ澶辫触锛岀粰鐢ㄦ埛娓呮櫚鐨勯敊璇俊鎭拰鎵嬪姩鎿嶄綔鎸囧紩
- Windows 涓?`/tmp` 涓嶅瓨鍦紝鏀圭敤绯荤粺涓存椂鐩綍锛堥€氳繃 `echo %TEMP%` 鎴?`python -c "import tempfile;print(tempfile.gettempdir())"` 鑾峰彇锛?
- 濡傛灉鐢ㄦ埛鐨?skill 鍖呭惈 Python 渚濊禆锛屾彁閱掔敤鎴峰湪浠撳簱閲屽寘鍚?`requirements.txt`

