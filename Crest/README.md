# ✚ Prompt Archive : Crest

병참 지급대로 위장한 제복 프롬프트 생성기입니다.

**Prompt Archive**는 NovelAI 등 이미지 생성 도구에서 활용할 수 있는 의상 프롬프트를 무작위로 조합해 주는 브라우저 기반 프로젝트입니다. 이번 에디션인 **Prompt Archive : Crest**는 밤의 피복 창고, 올리브색 강판 카운터, 스텐실 찍힌 나무 상자, 붉은 고무 도장, 그리고 먹지 지급 전표에서 영감을 받았습니다.

AI API나 별도의 서버는 필요하지 않습니다. 모든 결과는 미리 정의된 의상 데이터와 직역별 조합 규칙을 바탕으로 브라우저 안에서 생성됩니다.

---

## 다섯을 한 세트로 묶은 이유

교복 · 사관생도복 · 군복 · 비행복 · 기사단 제복은 겉보기에 따로지만, 관통하는 축이 하나 있습니다. **지급되는 옷, 그리고 소속과 계급이 겉에 표시되는 옷.** 교표 · 부대 마크 · 비행대 패치 · 기사단 문장은 전부 같은 일을 합니다. 에디션 이름이 **Crest**(문장)인 이유가 이것입니다.

그래서 이 다섯을 쪼개지 않고 한 지급대 안에 넣었습니다. 로드맵에 있던 **Flight Log**(군복 · 비행복 · 디젤펑크)는 여기에 흡수되어 따로 만들지 않습니다.

**기사단은 전투 판금이 아닙니다.** 여기서 다루는 것은 예장으로서의 기사단복 — 서코트 · 태버드 · 단(團) 망토 · 의장 갑주입니다. 실전 역사 갑주와 시대 고증은 **Rosette** 의 몫이고, 마도공학 장갑은 **Chrome** 의 몫입니다. 전례복 · 수도복은 **Nocturne** 에 남겨 두었으므로 종교색은 문장(紋章) 수준에서 멈춥니다.

## 컬렉션

세 개의 컬렉션에 24개 직역이 들어 있습니다.

| 컬렉션 | 범위 | 직역 | 실루엣을 만드는 축 |
|---|---|---|---|
| **Academy** | 학원 | 8 | 규정된 재단과 교표 |
| **Service** | 군 · 항공 | 8 | 장구 레이어와 계급 표시 |
| **Order** | 기사단 | 8 | 서코트 · 망토 · 예장 갑주 |
| **Cross Index** | 교차 | 24 조합 | 위 셋을 섞은 뷰 |

- **Academy** — 세라복 · 가쿠란 · 블레이저 · 브리티시 하우스 · 스목 · 바시티 · 학생회 · 부활동
- **Service** — 사관생도 · 야전 근무복 · 정복/예장 · 초기 비행복 · 제트 파일럿 · 해군 근무복 · 정비/기갑 · 야전 위생
- **Order** — 성당기사단 · 구호기사단 · 문장관 · 편력기사 · 근위대 · 원수 · 종자 · 서약기사
- **Cross Index** — 24개 직역 중 원하는 것을 체크해 섞습니다. `🧩 어울리는 것끼리 맞추기`를 켜면 체크한 직역 중 하나를 앵커로 잡아 실루엣의 핵심(주 제복 · 장구 · 넥 · 속옷)은 그 직역으로 맞추고, 외투 · 모자 · 신발 · 표장 · 패용품 · 휴대품 · 배경만 직역을 넘나듭니다

현재 24개 직역에 72개의 레시피와 947개의 항목이 들어 있습니다.

## 주요 기능

### 의상 랜덤 생성

의상은 열한 개의 슬롯을 조합해 만들어집니다. Chrome 과 같은 자리이지만 **개념이 다릅니다.**

| 슬롯 | 무엇을 담는가 |
|---|---|
| 속옷 · 셔츠 | 제복 안에 받쳐 입어 깃과 소매로 보이는 것 |
| 장구 · 갑주 | 실루엣을 만드는 축. 웨빙 · 멜빵 · 견장 · 흉갑 · 반신 갑주 |
| 주 제복 | 세트 단위의 지급복 |
| 넥 · 깃 | 넥타이 · 세라 플랩 · 고짓 · 입깃 |
| 외투 | 코트 · 망토 · 케이프 |
| 신발 | 구두 · 부츠 · 실내화 · 사바톤 |
| 모자 · 투구 | 학생모 · 정모 · 철모 · 투구 · 면갑 |
| 표장 · 부속 | 계급장 · 교표 · 완장 · 약장 · 장갑 (여러 개 체크 가능) |
| 패용품 | 예도 · 할버드 · 죽도 · 소총 · 지휘봉 |
| 휴대품 | 책가방 · 배낭 · 악기 케이스 · 방패 · 서류 케이스 |
| 배경 · 상태 | 교실 · 연병장 · 격납고 · 집회당 · 진흙과 비 |

뒤의 세 슬롯은 옷이 아니므로 프롬프트에서 표장 뒤에 붙습니다. 셋 다 비워도 됩니다.

### 직역별 조합 규칙

각 직역에는 **레시피**가 정의되어 있습니다. 레시피는 주 제복을 골격으로 삼아 그 직역에서 실제로 함께 입을 항목만 후보로 남깁니다. 체육복에 넥타이가 붙거나, 세라복에 할버드가 들리거나, 야전 작업복에 금장 견장이 얹히는 일은 일어나지 않습니다.

작업복 계열 레시피는 **갑주 항목을 아예 후보에서 뺍니다.** 반대로 계급장과 문장은 작업복에도 붙습니다. 지급복은 아무리 더러워도 소속을 표시하기 때문입니다.

### 예장 등급

Chrome 의 리얼리티 척도에 해당하는 축입니다. 이 에디션에서는 **얼마나 갖춰 입었는가**를 정합니다. 교복부터 기사단까지 다섯 주제에 모두 같은 눈금이 적용됩니다.

- **Fatigue** — 실제로 일할 때 입는 것. 얼룩, 걷은 소매, 닳은 밑단, 진흙, 기름.
- **Service** — 규정대로 갖춘 평상 근무. 이름표, 계급장, 다림질.
- **Dress** — 정복. 견장, 금줄, 약장, 광낸 부츠.
- **Ceremonial** — 의장. 깃털, 망토, 의장검, 불리온 자수, 흰 장갑.

같은 직역이라도 등급을 내리면 완전히 다른 옷이 나옵니다. 사관생도의 Fatigue 는 무릎이 닳은 훈련복이고, Ceremonial 은 깃털 꽂은 샤코모에 수술띠입니다.

### 가면과 얼굴

검도 호면, 실험용 보안경, 산소 마스크, 거즈 마스크, 철모처럼 얼굴을 가리는 물건이 들어 있습니다. 이들은 **예장 등급과 관계없이 Dress 이상에서만** 나오고, 랜덤에서는 모자 · 표장의 2순위로만 낮은 확률로 뽑힙니다. 캐릭터의 얼굴을 가리면 곤란하기 때문입니다.

### 안 보이는 것은 쓰지 않습니다

교칙이나 복제 규정은 그림에 그려지지 않습니다. Crest 는 규정 대신 그것이 옷에 만드는 형태를 씁니다.

```text
✗ regulation permitting a knitted vest between May and June
✓ knit vest showing under the blazer, contrast edge piping
```

프롬프트는 산문이 아니라 **단부루 태그 우선, 짧은 수식은 뒤에, 쉼표 구분**으로 씁니다. 몸이 주어가 되는 표현(포즈), `at the back`처럼 카메라를 돌리는 표현, `enormous` 같은 과장 수식은 쓰지 않습니다.

### 머리에 관하여

이 생성기는 **모자 · 투구 · 머리띠 · 머리 리본만** 다룹니다. 헤어스타일이나 가발 태그는 넣지 않으므로 캐릭터의 머리 모양과 색은 직접 지정하면 됩니다.

### 특정 국가의 표장은 쓰지 않습니다

군복 데이터는 20세기 전반~중반의 지급복 형태를 다루되, 실존 국가나 정권의 구체적 표장은 넣지 않았습니다. 계급과 소속을 나타내는 **일반적인 형태** — 견장 · 수장 · 완장 · 부대 패치 · 문장 — 까지만 다룹니다.

### 색상

기본 색은 `outfit color:` 접두어와 함께 프롬프트 맨 앞에 한 번만 기록됩니다. 주 제복 · 외투 · 신발 자체에는 색을 박지 않습니다(흰 셔츠, 검정 로퍼, 백십자처럼 그 색이 정체성인 것만 예외).

```text
outfit color: camel, sailor school uniform, plain camisole under the blouse, sailor collar blouse, box pleated skirt, white toed indoor school shoes, striped bands at the cuffs, embroidered name tag on the chest, detailed clothing
```

```text
outfit color: white, knightly order surcoat uniform, polished plate over the chest and arms only, short riding coat over a padded tunic, split riding skirt, plain linen collar above the surcoat, plain turned leather shoes, surcoat hem frayed and dusty, articulated plate gauntlets, the order device repeated down the sleeve, a chain of office over both shoulders, detailed clothing
```

```text
outfit color: maroon, stand collar school uniform, stand collar tunic with a row of gold buttons, straight trousers, dark knit vest over the shirt, polished black loafers, cloth headband tied at the brow, row of embossed gold buttons, cloth armband on the left sleeve, worn school bag on a long strap, the crest repeated in gold thread, white ceremonial gloves, detailed clothing
```

### 디테일

- **간단** — 기본 구조만 사용합니다.
- **보통** — `detailed clothing` 태그를 추가하고 표장을 하나 더 뽑습니다.
- **최대** — `highly detailed clothing` 태그를 추가하고 표장을 하나 더 뽑습니다.
- **랜덤** — 섞거나 출력할 때마다 위 셋 중 하나를 고릅니다.

프롬프트에 나오는 항목은 전부 화면에 보입니다. 화면에 없는 태그가 조용히 붙는 일은 없습니다.

### 표장 · 검색 · 필터 · 프리셋

표장은 여러 개를 체크할 수 있습니다. `＋ 함께 사용`은 체크한 것을 전부 반영하고, `🎲 랜덤 1개`는 출력할 때마다 하나만 고릅니다. 같은 부위를 쓰는 항목은 둘째로 뽑히지 않습니다.

검색창에는 한글 · 영어 아무거나 넣을 수 있고, 결과를 누르면 바로 선택됩니다. 필터 칩으로 **표장 · 문장 · 갑주 · 패용 무기 · 면갑**을 통째로 끌 수 있습니다. `⊘` 로는 랜덤에서만 뺄 항목을 고를 수 있고, `★` 로는 현재 조합을 프리셋으로 저장합니다.

### 프롬프트 출력

`ISSUE SLIP`을 누르면 결과가 **먹지 지급 전표**로 찍혀 나옵니다. 글자가 찍히는 중에 다시 누르면 즉시 완성됩니다.

- `COPY` — 클립보드에 복사
- `SAVE .TXT` — 텍스트 파일로 저장
- `REISSUE` — 전표를 연 채 새 조합
- `✕ FILE` — 전표 치우기 (Esc 도 동작)

## 사용 방법

설치 과정은 없습니다.

1. 저장소를 내려받습니다.
2. `index.html`을 웹 브라우저에서 엽니다.
3. 원하는 조건을 선택하고 `ISSUE SLIP`을 누릅니다.

별도의 빌드 과정이 없는 정적 웹 프로젝트이므로 GitHub Pages에도 바로 게시할 수 있습니다.

```text
Crest/
├── index.html   # 화면 구조
├── styles.css   # 지급대 스킨
├── data.js      # 의상 데이터와 직역별 레시피
└── app.js       # 생성 엔진과 화면 동작
```

## 데이터를 고칠 때 신경쓸 것

- 새 항목은 **반드시 어떤 레시피에 넣어야** 셔플에 나옵니다. 넣지 않으면 드롭다운에만 있고 랜덤에서는 영영 안 나옵니다.
- 시작할 때 `validateRecipes()` 가 존재하지 않는 id 를 콘솔에 경고합니다. 열어 보고 경고가 없어야 정상입니다.
- 주 제복 외 모든 슬롯에는 `None` 항목을 하나씩 둡니다.
- 얼굴을 가리는 항목에는 `f: 2` 이상 · `secondary: true` · `cat: 'mask'` 를 함께 답니다.
- 작업복에만 어울리는 항목에는 `f: 0`, 의장에만 어울리는 항목에는 `f: 3` 을 답니다. 등급이 그 항목의 등장 시점을 정합니다.
- 갑주 항목에는 `cat: 'armor'` 를 답니다. 엔진이 이 값을 보고 작업복 레시피에서 갑주를 빼 줍니다.
- 장식 풀(`pools.romantic` / `fantasy` / `otherworldly`)과 항목의 `p` 에 같은 문구를 쓰면 한 프롬프트에 두 번 나옵니다. 문구를 겹치지 마세요.
- 컬렉션 id 를 바꾸면 `app.js` 의 `EDITIONS` · `buildKoMaps` · `buildCrossEdition` · `validateRecipes` 호출 · `selectI18n.staticOptions.collection` · `index.html` 의 `<option>` 을 모두 맞춰야 합니다.

## 기술 구성

- HTML
- CSS
- Vanilla JavaScript

백엔드, 데이터베이스, AI API, 계정 시스템 없이 브라우저에서만 동작합니다.

## 폰트

웹폰트를 쓰지 않습니다. 인터페이스는 좁은 대문자가 스텐실처럼 보이도록 콘덴스드 산세리프를, 전표 본문은 타자기 느낌의 고정폭 폰트를 순서대로 찾아 씁니다.

```text
UI   "Arial Narrow", "Liberation Sans Narrow", "Roboto Condensed", sans-serif
전표  "Courier New", "Lucida Console", monospace
```

어떤 환경에서도 폰트 다운로드 없이 같은 인상으로 열립니다.

## 앞으로의 에디션

- **Prompt Archive 2004** — Y2K / cyber / street / alternative fashion
- **Prompt Archive : Rosette** — 서양 복식사 700 BC–1965 / 역사 판타지
- **Prompt Archive : Chrome** — 사이버펑크 / 마도공학 / 근미래 도시
- **Prompt Archive : Bestiary** — 인외 / 이종족 / 수인 / 요괴
- **Prompt Archive : Empyrean** — 우주적 존재 / 천체 / 승화
- **Prompt Archive : Crest** — 교복 / 생도복 / 군복 / 비행복 / 기사단 제복
- **Prompt Archive : Nocturne** — gothic / Visual Kei / dark fantasy / cathedral
- **Prompt Archive : Sugarbox** — kawaii / doll / pastel / plush

각 에디션은 Prompt Archive라는 기본 콘셉트를 공유하면서 서로 다른 의상 데이터와 인터페이스를 사용합니다. 레이아웃만 같고 디자인은 에디션마다 전부 다릅니다.

## 프로젝트 방향

이 프로젝트의 목표는 특정 학교나 군대의 복제를 정확히 재현하는 것이 아닙니다. 캐릭터 의상 디자인, 과장된 실루엣, 믹스 앤 매치, 아바타 스타일링과 빠른 프롬프트 실험을 위한 창작 도구를 지향합니다. 다만 "안 어울리는 조합이 안 나오는 것"은 끝까지 지킵니다.

## 라이선스

이 프로젝트의 애플리케이션 코드는 [MIT License](LICENSE)에 따라 사용할 수 있습니다.

---

✚ 직역을 청구하고, 등급을 정하고, 전표에 서명하세요.
