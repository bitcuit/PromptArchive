# ❋ Prompt Archive : Bestiary

박물관 표본 진열장으로 위장한 인외 종족 의상 프롬프트 생성기입니다.

**Prompt Archive**는 NovelAI 등 이미지 생성 도구에서 활용할 수 있는 의상 프롬프트를 무작위로 조합해 주는 브라우저 기반 프로젝트입니다. 이번 에디션인 **Prompt Archive : Bestiary**는 19세기 자연사 박물관의 참나무 표본장, 황동 서랍 손잡이, 유리 표본병, 핀으로 꽂은 동정 라벨에서 영감을 받았습니다.

AI API나 별도의 서버는 필요하지 않습니다. 모든 결과는 미리 정의된 의상 데이터와 조합 규칙을 바탕으로 브라우저 안에서 생성됩니다.

Bestiary가 다루는 것은 **종족**입니다. 2004 에디션의 Animal Street는 사람이 입는 옷에 동물 모티프를 얹는 축이었지만, Bestiary는 사람이 아닌 몸이 옷을 어떻게 다르게 입는가를 축으로 삼았습니다. 꼬리가 나갈 자리, 뿔에 감는 끈, 지느러미를 피해 재단한 소매 같은 것들입니다.

---

## Prompt Archive : Bestiary

다음 종족을 바탕으로 의상 조합을 만들 수 있습니다.

| 종족 | 실루엣을 만드는 것 |
|---|---|
| Beastfolk | 가죽과 모피, 허리에 낸 꼬리 구멍 |
| Fox Spirit | 넓은 소매와 겹쳐 두른 신사(神事) 예복 |
| Dragon-blooded | 겹쳐 붙인 비늘판과 등줄기 융기 |
| Demon | 각이 선 비대칭과 쇠고리 |
| Oni | 한쪽 어깨만 덮는 두꺼운 천과 굵은 밧줄 |
| Celestial | 늘어져 흐르는 드레이프와 금박 띠 |
| Undead | 찢긴 수의와 감긴 붕대 |
| Spirit | 무게가 없는 사(紗)와 떠 있는 자락 |
| Sea Folk | 젖어 붙는 천과 지느러미 가장자리 |
| Bird Folk | 겹친 깃털과 바람을 받는 망토 |
| Tree Spirit | 감아 오른 덩굴과 겹친 잎 |
| Stone Folk | 각진 석판과 박힌 결정 |
| Moth Folk | 보송한 기모와 가루가 앉은 표면 |
| Slime Folk | 몸에 붙는 반투명과 흘러내리는 밑단 |
| Elf | 길고 가는 재단과 정교한 자수 |

실루엣, 상의, 하의, 신발, 부속, 머리 특징, 부속지와 선택적 서식지 재료를 하나의 영어 프롬프트로 조합합니다.

## 주요 기능

### 의상 랜덤 생성

각 의상은 다음 항목을 조합해 만들어집니다.

- 필수 베이스 색상과 선택적 포인트 색상
- 형태(완전 인외 / 특징만 덧붙이기)
- 주 종족과 함께 섞일 법한 보조 종족
- 실루엣
- 상의와 하의
- 하의 타입(치마 / 바지)
- 신발
- 머리 특징
- 부속지(날개 / 꼬리 / 등지느러미)
- 부속
- 서식지 재료
- 직접 입력한 추가 태그
- 복잡도

### 형태 — 인외를 어디까지 쓸 것인가

`FORM` 은 이 에디션에서 가장 중요한 스위치입니다.

- **Full Creature** — 종족의 몸까지 씁니다. 비늘 피부, 갈라진 동공, 물갈퀴, 나무껍질 살갗, 반투명한 몸 같은 것이 옷보다 **먼저** 프롬프트에 들어갑니다. 사람이 아닌 것을 처음부터 그리고 싶을 때 씁니다.
- **Traits Only** — 옷과 귀 · 뿔 · 부속지만 씁니다. 몸에 관한 태그는 하나도 붙지 않습니다. 이미 정해 둔 캐릭터 원형 위에 인외의 옷과 부위만 얹고 싶을 때 씁니다.
- **Random** — 출력할 때마다 둘 중 하나를 고릅니다.

같은 종족, 같은 설정에서 두 모드가 어떻게 갈리는지 보면 분명합니다.

```text
Full Creature
outfit color: gray with white accents, dragon-blooded, scaled skin, clawed hands, ridged brow,
dragon-blooded clothing, heavy scaled silhouette, hooked clasp breastplate, plated scale skirt, …

Traits Only
outfit color: blue with brown accents, dragon-blooded clothing, heavy scaled silhouette,
banded scale vest, strapped scale shorts, curved horns, bat wings, …
```

**발이 사람의 것이 아니면 신발을 신기지 않습니다.** Full Creature 에서 `taloned feet` 같은 발 특징이 뽑히면 그 출력에서는 신발 슬롯을 통째로 비웁니다. 맹금류의 발톱 위에 부츠를 덧신기는 결과가 나오지 않게 하기 위해서입니다.

### 조합 규칙 — 같은 땅에 사는 종족끼리만

보조 종족은 아무 두 개나 섞이지 않습니다. 서식지를 공유하거나, 같은 공예 전통을 쓰거나, 사람 아닌 몸을 같은 방식으로 감싸는 종족끼리만 짝이 됩니다. 수인은 오니·여우 요괴·수목 정령·언데드·조인과 붙지만 점체족과는 붙지 않습니다. 점체족은 정령·인어·수목 정령·암석족과 붙습니다.

이 관계는 `secondaryCompat`에 양방향으로 적어 두었습니다. 한쪽에만 적으면 조합이 한 방향으로만 나오므로 반드시 양쪽을 함께 고쳐야 합니다.

### 머리에는 자리가 있습니다

머리 특징에는 자리(zone)가 있습니다. 정수리(굽은 뿔·가지 뿔·깃털 볏·더듬이), 옆(짐승 귀·긴 귀·지느러미 귀), 얼굴(뼈 가면)입니다.

한 자리에는 하나만 올라갑니다. 그래서 굽은 뿔과 가지 뿔이 한 머리에 같이 나오지 않고, 뿔과 귀는 자리가 다르므로 함께 나옵니다. 뿔 달린 수인은 유효한 결과입니다.

`HEAD FEATURE`만 여러 항목을 체크할 수 있습니다. `🎲 랜덤 1개`는 체크한 후보 중 하나를 출력마다 고르고, 기본값인 `＋ 함께 사용`은 체크한 특징을 자리 규칙에 맞게 함께 반영합니다. `None`은 단독 상태입니다.

### 없는 몸에는 장식을 달지 않습니다

`OTHER`가 자동으로 넣는 후보 중 일부는 몸의 특정 부위를 지목합니다. 그런 항목은 그 부위가 실제로 있을 때만 나옵니다.

- 날개 관절 밴드 → 날개를 골랐을 때만
- 꼬리에 낀 고리 → 꼬리를 골랐을 때만
- 뿔에 감은 끈 → 뿔이나 가지 뿔을 골랐을 때만

데이터에서는 `needsBack`과 `needsHero`로 적습니다.

### 부속지

`APPENDAGE`에서는 깃털 날개, 박쥐 날개, 곤충 날개, 나방 날개, 복슬 꼬리, 여러 갈래 꼬리, 비늘 꼬리, 등지느러미 중 하나를 고르거나 무작위로 정할 수 있습니다.

**무작위로 뽑을 때만** 종족을 봅니다. 랜덤은 엘프에게 등지느러미를 주지 않고, 여우 요괴에게 여러 갈래 꼬리를 줍니다. 직접 고르는 것은 제한하지 않습니다. 혼혈이나 변형체는 충분히 만들고 싶어 할 만한 것이기 때문입니다.

### 얼굴을 가리는 것에 관하여

뼈 가면은 얼굴을 가립니다. 목록에는 항상 있지만 자동 셔플에서는 아주 낮은 확률로만 뽑히도록 걸러 둡니다. 그냥 돌렸을 때 캐릭터의 얼굴이 보이는 편이 기본값이어야 하기 때문입니다. 직접 체크하면 언제든 나옵니다.

### 안 보이는 것은 쓰지 않습니다

종족의 생물학적 설정은 그림에 그려지지 않습니다. Bestiary는 설정 대신 그것이 옷에 만드는 형태를 씁니다.

```text
✗ digitigrade legs requiring a modified trouser gusset
✓ fringed hide trousers, side fringe strips, soft suede legs
```

### 머리 모양에 관하여

머리 모양과 가발 태그는 데이터에 넣지 않았습니다. 귀·뿔·볏·더듬이 같은 신체 특징과 머리 장식만 다룹니다. 캐릭터의 머리 모양은 쓰는 사람이 직접 정하는 편이 낫기 때문입니다.

### 서식지

`HABITAT`은 옷의 재료를 정합니다. 장식을 더하는 것이 아니라 그 땅이 무엇을 내주는지를 씁니다.

- Deep Forest → 잎과 나무껍질로 짠 재료, 자연스러운 겹 드레이프
- Snowfield → 두꺼운 모피와 가죽, 부피 있는 단열 비례
- Deep Sea → 조개와 산호 재료, 매끄럽게 흐르는 비례
- Ember Land → 그을린 가죽과 재, 날카롭게 갈라진 실루엣
- Ruins → 주워 모은 천과 뼈, 고르지 않은 누더기 실루엣

메뉴의 `Other`를 고르면 드롭다운 자리가 입력칸으로 바뀌어 원하는 지형을 직접 쓸 수 있습니다. 줄 옆의 `🎲`를 누르면 Cavern, Canopy, Marsh, Reef 같은 후보가 채워지고, 입력칸 오른쪽 화살표 영역을 누르면 목록으로 돌아갑니다.

### 프리뷰

`02 / VITRINE` 패널에는 현재 선택한 머리 특징과 베이스·포인트 색상 칩이 표시됩니다. 여러 개를 체크하면 각 특징이 아이콘과 이름이 있는 칸으로 격자 정렬됩니다.

### 추가 태그

`OTHER` 입력란에는 기본 생성기에 없는 요소를 쉼표로 구분해 추가할 수 있습니다.

```text
charms, bells, vines
```

입력한 태그는 프롬프트 끝에 덧붙습니다. `🎲` 또는 `RESHUFFLE TRAITS`로 기존 생성 요소와 겹치지 않는 전용 후보를 자동 입력할 수 있고, `◇`로 현재 값을 잠글 수 있습니다.

### 복잡도

- **Simple** — 기본 의상 구조와 적은 수의 부속을 사용합니다.
- **Medium** — 부속과 `detailed clothing` 태그를 추가합니다.
- **Max** — 더 많은 부속과 특수 요소에 더해, 뽑힌 상의·하의·신발마다 그 아이템 전용 디테일 태그(예: `woven vine bodice` → `interlaced vine weave, open lattice gaps`)를 함께 출력합니다. 같은 아이템에는 항상 같은 디테일이 따라오므로 결과가 더 구체적이고 일정해집니다.
- **Random** — 출력할 때마다 위 세 단계 중 하나를 선택합니다.

### 색상

베이스 색상은 필수이며, 포인트 색상은 선택 사항입니다. 선택한 색상은 `outfit color:` 접두어와 함께 프롬프트 맨 앞에 한 번만 기록되어, 의상 색이라는 의미가 고정됩니다. 색 목록은 천연 염료와 광물 안료에서 나올 법한 흰색·검정·갈색·초록·파랑·빨강·보라·금색·회색·청록입니다.

```text
outfit color: black with brown accents, beastfolk clothing, fur trimmed layered silhouette, wrapped hide tunic, short pelt skirt, curved horns, claw bead necklace, fur shoulder trim, cord wound horn base, laced hunter sandals
```

```text
outfit color: gold with blue accents, elven clothing, tapered layered silhouette, celestial clothing, mire dwelling attire, materials from its home, pleated ceremonial top, tapered woven trousers, long pointed ears, branching antlers, fine leaf embroidery, gilded belt disc, narrow woven belt, gilt band trim, carved wood buttons, long trailing sash, carved ear ornament, hanging antler charms, weathered patina on the metal, pointed slim shoes, layered accessories, highly detailed clothing
```

주 의복과 겉옷과 신발 자체에는 색을 박지 않았습니다. 그래야 `outfit color:`가 정한 색이 옷 전체에 한 번만 적용됩니다.

### 진열장 마감

`FINISH` 버튼에서 Oak, Brass, Verdigris, Ivory, Slate 다섯 가지 마감을 고를 수 있습니다. 유리 안쪽은 어느 마감에서도 옅은 카드 색으로 남아 인쇄된 라벨이 항상 읽힙니다. 마감은 인터페이스 색상만 바꾸며 생성되는 의상의 색상에는 영향을 주지 않습니다.

### 프롬프트 출력

`PRINT LABEL`을 누르면 새 프롬프트가 핀으로 꽂는 동정 라벨에 찍혀 나옵니다.

- `COPY` — 결과를 클립보드에 복사합니다.
- `SAVE .TXT` — 결과를 텍스트 파일로 저장합니다.
- `REPRINT` — 현재 설정을 유지한 채 새 조합을 출력합니다.
- `✂ DRAG TO TEAR` — 출력된 라벨을 뜯어 냅니다.

### 설정 잠금

각 설정의 `🎲` 버튼은 그 줄만 다시 뽑습니다. 옆의 `◇` 버튼을 누르면 `◆`로 바뀌며 해당 값을 잠급니다. 잠긴 값은 `RESHUFFLE TRAITS`를 눌러도 유지되므로, 원하는 종족이나 색상만 고정한 채 나머지를 다시 조합할 수 있습니다.

### 설정 언어

화면 상단 상태 표시 옆의 `한글 보기` 버튼을 누르면 설정 이름, 선택지, 프리뷰, 자동 생성된 OTHER 값이 한글로 바뀝니다. 화면의 설정 언어만 바뀌며 내부 값과 생성·복사·저장되는 프롬프트는 계속 영어로 유지됩니다.

## 사용 방법

설치 과정은 없습니다.

1. 저장소를 내려받습니다.
2. `index.html`을 웹 브라우저에서 엽니다.
3. 원하는 조건을 선택하고 `PRINT LABEL`을 누릅니다.

별도의 빌드 과정이 없는 정적 웹 프로젝트이므로 GitHub Pages에도 바로 게시할 수 있습니다.

```text
Bestiary/
├── index.html   # 화면 구조
├── styles.css   # 진열장 마감과 인터페이스 스타일
├── data.js      # 의상 데이터와 조합 규칙
└── app.js       # 프롬프트 생성 및 화면 동작
```

## 데이터를 고칠 때 신경쓸 것

- `styles`의 키를 바꾸면 `secondaryCompat`, `heroMap`의 `styles` 목록, `backPieces`의 `styles` 목록, `index.html`의 `<option>`, `app.js`의 `settingTranslations.values.mainStyle` 다섯 곳을 모두 맞춰야 합니다.
- 종족을 추가하면 `sp`(종족 태그)와 `body`(비인간 신체 태그 2~4개)도 함께 넣습니다. 없으면 Full Creature 에서 그 종족만 사람처럼 나옵니다.
- 발에 관한 `body` 태그에는 `feet` 라는 단어를 넣습니다. 엔진이 그 단어를 보고 신발을 비웁니다.
- `secondaryCompat`은 양방향입니다. A에 B를 넣었으면 B에도 A를 넣습니다.
- 상의·하의·신발 항목을 추가하면 `itemDetails`에도 같은 문자열로 항목을 추가합니다. 빠지면 브라우저 콘솔에 `[data] itemDetails missing:` 경고가 뜹니다.
- 하의에는 종족마다 `skirt`가 들어간 항목을 하나 이상 남겨 둡니다. `BOTTOM`의 치마 필터가 빈손이 되면 필터가 무시됩니다.
- 몸의 부위를 지목하는 `OTHER` 후보에는 `needsBack` 또는 `needsHero`를 답니다.
- 얼굴을 가리는 머리 특징에는 `rare: true`와 `zone: "face"`를 함께 답니다.
- 같은 부위를 두 슬롯이 그리지 않게 합니다. 부속은 자기 물건만 서술하고 `over the skirt` 같은 옷 기준 표현은 쓰지 않습니다. `over the shoulders`처럼 몸 부위 기준은 괜찮습니다.

## 기술 구성

- HTML
- CSS
- Vanilla JavaScript

백엔드, 데이터베이스, AI API, 계정 시스템 없이 브라우저에서만 동작합니다.

## 폰트

웹폰트를 쓰지 않습니다. 인터페이스는 시스템에 있는 세리프 폰트를 순서대로 찾아 씁니다.

```text
"Iowan Old Style", "Palatino Linotype", Georgia, serif
```

박물관 동정 라벨의 활자처럼 보이게 하려는 선택이며, 어떤 환경에서도 폰트 다운로드 없이 같은 인상으로 열립니다.

## 앞으로의 에디션

Prompt Archive는 하나의 생성기에 그치지 않고 서로 다른 분위기의 시리즈로 확장할 수 있도록 구상했습니다.

- **Prompt Archive 2004** — Y2K / cyber / street / alternative fashion
- **Prompt Archive : Rosette** — 서양 복식사 700 BC–1965 / 역사 판타지
- **Prompt Archive : Chrome** — 사이버펑크 / 마도공학 / 근미래 도시
- **Prompt Archive : Empyrean** — 우주적 존재 / 천체 / 승화
- **Prompt Archive : Bestiary** — 인외 / 이종족 / 수인 / 요괴
- **Prompt Archive : Crest** — 교복 / 생도복 / 군복 / 비행복 / 기사단 제복
- **Prompt Archive : Nocturne** — gothic / Visual Kei / dark fantasy / cathedral
- **Prompt Archive : Sugarbox** — kawaii / doll / pastel / plush

각 에디션은 Prompt Archive라는 기본 콘셉트를 공유하면서 서로 다른 의상 데이터와 인터페이스를 사용합니다.

## 프로젝트 방향

이 프로젝트의 목표는 신화와 민속을 정확히 고증하는 것이 아닙니다. 캐릭터 의상 디자인, 과장된 실루엣, 믹스 앤 매치, 아바타 스타일링과 빠른 프롬프트 실험을 위한 창작 도구를 지향합니다. 다만 "안 어울리는 조합이 안 나오는 것"은 끝까지 지킵니다.

## 라이선스

이 프로젝트의 애플리케이션 코드는 [MIT License](LICENSE)에 따라 사용할 수 있습니다.

---

❋ 종족을 고르고, 서식지를 정하고, 마음에 드는 표본을 아카이브하세요.
