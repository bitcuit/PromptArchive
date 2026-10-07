# ✹ Prompt Archive : Halation

은색 필름 카메라로 위장한, 일상의 한 조각을 뽑는 프롬프트 생성기입니다.

**Prompt Archive**는 NovelAI 등 이미지 생성 도구에서 활용할 수 있는 프롬프트를 무작위로 조합해 주는 브라우저 기반 프로젝트입니다. 이번 에디션인 **Prompt Archive : Halation**은 2000년대 초의 은색 컴팩트 카메라, 그 밑에 장전된 필름 한 롤, 구석에 날짜가 찍힌 인화지에서 영감을 받았습니다. 화면은 옅은 회색 한 가지 위에 면이 부드럽게 솟거나 눌려 있는 모양으로, 밝고 조용하게 잡았습니다.

AI API나 별도의 서버는 필요하지 않습니다. 모든 결과는 미리 정의된 장면 데이터와 조합 규칙을 바탕으로 브라우저 안에서 생성됩니다.

Halation이 다루는 것은 **일상의 한 조각**입니다. 장 보러 가는 길, 선풍기 앞에서 졸던 오후, 소나기에 옷을 뒤집어쓰고 뛰던 하굣길, 천둥에 불이 나간 방 같은 것들입니다. 일본 생활 만화처럼 풋풋하고, 맑은 날에는 청량하게. 그래서 주인공은 옷이 아니라 **장면**입니다. 어디에 있는지, 어떤 빛이 드는지, 몸이 무엇을 하고 있는지, 손에 무엇을 들었는지를 먼저 쓰고 옷은 그다음에 옵니다. 옷도 꾸민 옷이 아닙니다. 흰 티셔츠에 청바지, 가디건, 교복처럼 그날 그냥 입고 나온 것들입니다.

할레이션은 필름에서 밝은 빛의 가장자리가 붉게 번지는 현상입니다. 역광, 나뭇잎 사이로 드는 볕, 창으로 들어오는 오후의 빛이 이 에디션의 중심이라 이름으로 삼았습니다.

---

## Prompt Archive : Halation

스물여섯 장면이 있습니다. 학교와 동네의 계절 장면 열여덟 개, 그리고 계절을 가리지 않는 생활 장면 여덟 개입니다.

| 계절 | 장면 | 그 자리에 있는 것 |
|---|---|---|
| 봄 | Cherry Blossom Road | 가로수 길, 낮은 돌담, 바닥에 쌓인 꽃잎 |
| 봄 | Classroom Window | 책걸상, 부푸는 커튼, 빛 속의 먼지 |
| 봄 | Riverbank | 풀 비탈, 유채꽃, 멀리 보이는 다리 |
| 봄 | Country Station | 나무 역사, 승강장 벤치, 선로 사이의 풀 |
| 여름 | Breakwater | 방파제, 해안 도로, 적란운 |
| 여름 | Country Bus Stop | 양철 지붕 대합소, 논, 뭉게구름 |
| 여름 | Mountain Stream | 얕은 물, 이끼 낀 바위, 물에 비친 빛 |
| 여름 | Summer Festival | 노점, 종이 등롱, 밤하늘의 불꽃 |
| 가을 | School Rooftop | 철망 울타리, 물탱크, 길게 누운 그림자 |
| 가을 | Ginkgo Avenue | 가로수 길, 깔린 낙엽, 공원 벤치 |
| 가을 | Library | 서가, 열람 책상, 책장에 드는 창빛 |
| 가을 | Railroad Crossing | 차단기, 전깃줄, 지나가는 열차 |
| 겨울 | Snowy Lane | 눈 쌓인 지붕, 가로등, 눈 위의 발자국 |
| 겨울 | Convenience Store Night | 가게 앞, 자판기, 유리로 새는 불빛 |
| 겨울 | Kotatsu Room | 다다미, 낮은 상, 김 서린 창 |
| 겨울 | Hilltop at Dawn | 내려다보이는 동네, 난간의 서리, 샛별 |
| 봄 | Blossom Picnic | 벚나무 아래 돗자리, 도시락, 가지에 단 등롱 |
| 여름 | Fireworks Night | 강둑, 다리, 강물에 비친 불꽃 |
| 여름 | Summer Tatami Room | 다다미, 선풍기, 마당으로 열린 미닫이, 모기향 |
| 여름 | Corner Shop | 오래된 구멍가게, 아이스크림 냉동고, 가게 앞 나무 의자 |
| 사계절 | Neighborhood Market | 마트 진열대, 장바구니, 냉장 진열대 |
| 사계절 | Shopping Street | 상점가, 차양, 세워 둔 자전거, 횡단보도 |
| 사계절 | Home Kitchen | 조리대, 개수대, 개수대 위 창 |
| 봄 · 여름 · 가을 | Laundry Balcony | 빨래 장대, 바람에 날리는 흰 시트, 빨래집게 |
| 사계절 | My Room | 침대, 책상, 쿠션, 인형 |
| 사계절 | Bus Ride | 버스 좌석, 창, 손잡이, 지나가는 바깥 풍경 |

구도와 몸짓, 손에 든 것, 표정, 장소, 날씨와 빛, 공기, 렌즈 효과, 옷을 영어 프롬프트로 조합합니다. 한 사람이 아니라 **두 사람**도 뽑을 수 있습니다.

사계절 장면은 출력할 때마다 계절 하나가 정해지고, 옷 · 소품 · 공기가 그 계절을 따릅니다. `SCENE`에서 `Random · Summer`처럼 계절을 고르면 그 계절에 일어날 수 있는 장면만 나옵니다.

## 주요 기능

### 장면 랜덤 생성

각 장면은 다음 항목을 조합해 만들어집니다.

- 장면(장소와 계절)
- 구도와 몸짓
- 빛과 시간대
- 손에 든 것
- 머리에 쓴 것
- 표정
- 그 자리의 공기(날리는 꽃잎, 입김, 아지랑이 같은 것)
- 렌즈와 필름이 더하는 것(보케, 렌즈 플레어, 필름 그레인)
- 옷차림(사복 / 교복 / 장면만)
- 하의 타입(치마 / 바지 / 원피스)
- 베이스 색상과 선택적 포인트 색상
- 직접 입력한 추가 태그
- 복잡도

### 다른 에디션과 다른 점 — 자세를 씁니다

의상 에디션에서는 자세와 카메라 방향을 쓰지 않습니다. 옷을 서술하는 데 방해가 되기 때문입니다. Halation은 반대입니다. 장면이 주인공이라 `upper body, from side, looking up`처럼 구도와 몸짓이 프롬프트 맨 앞에 옵니다.

구도와 몸짓은 따로 뽑지 않고 **한 묶음**으로 뽑습니다. 상반신 구도에 "물에 발을 담그고" 같은 몸짓이 붙는 일을 막기 위해서입니다. 구도를 고르는 설정은 없고, 장면마다 여섯 가지가 준비되어 있습니다.

### 옷차림 — 옷을 쓸 것인가

`OUTFIT`은 옷을 어디까지 쓸지 정합니다.

- **Casual** — 사복입니다. 티셔츠, 후드, 가디건, 청바지, 면바지, 주름치마 같은 것입니다.
- **School Uniform** — 교복입니다. 블레이저, 세일러복, 가쿠란, 셔츠의 기본형입니다.
- **Scene Only** — 옷을 하나도 쓰지 않습니다. 옷이 이미 정해진 캐릭터를 장면에만 세우고 싶을 때 씁니다. 손에 든 것과 머리에 쓴 것은 남습니다.
- **Random** — 그 장면에 어울리는 쪽으로 기웁니다. 교실과 옥상은 교복, 계곡과 축제는 사복입니다.

같은 장면에서 두 모드가 어떻게 갈리는지 보면 분명합니다.

```text
School Uniform
upper body, from side, leaning on the desk, holding book, paperback, light smile, classroom,
school desk, school chair, blackboard, sunset, orange light through the window, long shadows,
billowing curtains, dust motes in the light, bokeh, film grain, outfit color: white,
school uniform, collared shirt, long sleeves, slacks, necktie, …

Scene Only
cowboy shot, from behind, turning the head, closed eyes, smile, snow, snow covered roofs,
streetlight, snowy street, morning, pale blue sky, soft morning light, visible breath,
quiet street, film grain, lens flare
```

### 옷장은 계절을 따릅니다

옷은 장면이 아니라 **계절**에 달려 있습니다. 봄·여름·가을·겨울마다 사복 옷장과 교복 옷장이 따로 있어서, 눈 오는 골목에 반팔이 나오거나 방파제에 더플코트가 나오지 않습니다.

예외는 바닥이 정하는 곳입니다. 교실과 도서실에서는 실내화를 신고, 계곡에서는 맨발이거나 샌들이며, 코타츠 방에서는 외투를 벗고 한텐이나 스웨터만 입습니다. 여름 축제에서는 원피스 자리에 유카타가 나올 수 있고, 그때는 신발이 게다로 바뀝니다.

### 조합 규칙 — 랜덤은 장면을 따릅니다

`IN HAND`, `LIGHT`, `HEADWEAR`를 Random으로 두면 **그 장면에 있을 법한 것만** 나옵니다. 코타츠 방에서는 귤과 머그컵이 나오고 밀짚모자는 나오지 않습니다. 밤 편의점의 빛은 밤이거나 땅거미입니다.

반대 방향도 됩니다. 장면을 Random으로 두고 손에 든 것을 직접 고르면, **장면이 그 물건이 있을 법한 곳으로 좁혀집니다.** 군고구마를 고르면 은행나무길·건널목·눈 오는 골목·밤 편의점 중 하나가 나옵니다. 빛과 머리에 쓴 것도 같은 식으로 장면을 좁힙니다.

직접 고른 것은 제한하지 않습니다. 장면과 소품을 둘 다 손으로 고르면 고른 대로 나옵니다. 다만 장면을 다른 곳으로 바꾸면, 새 장면에 맞지 않는 소품·빛·모자는 Random으로 풀립니다. `◇`로 잠근 것은 풀리지 않습니다.

### 목에는 하나만, 손에도 하나만

교복의 넥타이와 리본은 같은 자리에 매는 물건이라 하나만 나옵니다. 세일러복과 가쿠란, 목도리를 두른 교복처럼 깃이 이미 닫힌 옷에는 아예 나오지 않습니다.

세일러복은 치마와만, 가쿠란은 바지와만 짝이 됩니다. 하의를 먼저 뽑고, 그 하의와 맞지 않는 상의는 후보에서 뺍니다.

### 손과 소품 — 한 장면 안에서 말이 되게

판타지가 아니라 실제로 있을 법한 장면이라, 자세와 소품과 옷이 서로 맞아야 합니다. 랜덤으로 뽑을 때는 다음이 나오지 않습니다.

- **손이 바쁜 자세에 소품을 쥐여 주지 않습니다.** 두 팔을 벌리거나, 쪼그려 앉아 눈을 만지거나, 철망을 잡고 있거나, 책상에 엎드린 자세에는 손에 든 것이 붙지 않습니다.
- **소품이 있어야 말이 되는 자세는 그 소품과만 나옵니다.** 책을 읽는 자세는 책이나 공책과, 음식을 후후 부는 자세는 군고구마 · 찐빵 · 캔커피 · 머그컵과만 나옵니다.
- **자전거는 걷거나 서 있는 자세에만** 붙습니다. 누워 있거나 앉아 있는 자세에는 붙지 않습니다.
- **우산은 비 갠 뒤 · 흐림 · 땅거미 · 밤에만** 나옵니다. 맑은 한낮에는 나오지 않습니다.
- **가방은 하나만.** 책가방을 들었으면 토트백 · 배낭은 빠집니다.
- **이어폰과 헤드폰은 같이 나오지 않습니다.**
- **이어폰은 조금 옛날 기기에 꽂혀 있습니다.** 폴더폰 · 카세트 플레이어 · 워크맨 · CD 플레이어 · MP3 플레이어 · 아이팟 중 하나가 나오고, 스마트폰은 나오지 않습니다.
- **유카타에는 유카타의 소지품**(끈 주머니, 오비 매듭, 오비에 꽂은 부채)이 붙고, 손목시계 · 토트백은 붙지 않습니다.

손에 든 것을 **직접 고르면** 그 소품은 그대로 두고 자세가 맞춰 바뀝니다. 장면이 Random이면 장면도 그 소품이 있을 법한 곳으로 좁혀지고, 빛이 Random이면 우산에 맞는 날씨로 좁혀집니다.

### 머리에는 자리가 있습니다

머리에 쓴 것에는 자리(zone)가 있습니다. 정수리(밀짚모자·야구 모자·화관·비니), 귀(헤드폰·귀마개), 옆(머리핀), 뒤(머리 리본)입니다.

한 자리에는 하나만 올라갑니다. 그래서 밀짚모자와 비니가 한 머리에 같이 나오지 않고, 비니와 귀마개는 자리가 다르므로 함께 나옵니다.

`HEADWEAR`만 여러 항목을 체크할 수 있습니다. `🎲 랜덤 1개`는 체크한 후보 중 하나를 출력마다 고르고, 기본값인 `＋ 함께 사용`은 체크한 것을 자리 규칙에 맞게 함께 반영합니다. `None`은 단독 상태입니다.

### 안 보이는 것은 쓰지 않습니다

구도가 상반신이면 신발과 양말은 프롬프트에 넣지 않습니다. 화면 밖에 있는 것을 쓰면 구도가 흔들리기 때문입니다. 등을 돌린 구도에서는 표정을 쓰지 않습니다.

```text
✗ upper body, leaning on the window, …, plaid skirt, kneehighs, loafers
✓ upper body, leaning on the window, …, plaid skirt
```

### 머리 모양과 얼굴에 관하여

머리 모양과 가발 태그는 데이터에 넣지 않았습니다. 모자와 머리 장식만 다룹니다. 캐릭터의 머리 모양은 쓰는 사람이 직접 정하는 편이 낫기 때문입니다. 같은 이유로 인물 수(`1girl`, `solo`)도 쓰지 않습니다.

얼굴을 가리는 물건은 이 에디션에 없습니다.

### 날씨와 빛

`WEATHER`는 시간대와 날씨입니다. Morning, Midday Sun, Leaf Shade, Sunset, Twilight, Overcast, After Rain, Night, Sunrise에 더해, **Sudden Shower(소나기), Thunderstorm(천둥번개), Power Cut at Night(정전된 밤), Heavy Snow(함박눈), Sun Shower(여우비)**가 있습니다.

날씨는 장면마다, 계절마다 일어날 수 있는 것만 나옵니다. 함박눈은 겨울에만, 정전은 실내에서만 납니다.

비나 천둥이 오면 **자세가 날씨를 따릅니다.** 바깥에서는 겉옷을 머리에 뒤집어쓰고 뛰거나, 처마 밑에서 비를 피하거나, 얼굴의 빗물을 닦습니다. 맑은 날의 공기(아지랑이 · 잠자리 · 비행운)는 빠지고, 손에 드는 것도 비 오는 날 들 만한 것(우산 · 가방 · 장바구니)만 나옵니다. 정전된 밤에는 촛불을 켜거나 어둠 속에서 촛불에 얼굴이 비칩니다.

같은 빛도 실내에서는 창으로 들어옵니다. 교실·도서실·코타츠 방에서 Sunset을 고르면 하늘 대신 `orange light through the window`가 나옵니다.

메뉴의 `Other`를 고르면 드롭다운 자리가 입력칸으로 바뀌어 원하는 날씨를 직접 쓸 수 있습니다. 칸 옆의 `🎲`를 누르면 Drizzle, Sun Shower, Morning Mist 같은 후보가 채워지고, 입력칸 오른쪽 화살표 영역을 누르면 목록으로 돌아갑니다.

### 여름은 맑게

여름 장면은 덥고 끈적한 쪽이 아니라 **맑고 시원한 쪽**으로 잡았습니다. 새파란 하늘과 흰 구름, 반짝이는 물, 바람, 또렷한 그늘입니다. 땀과 아지랑이는 데이터에 넣지 않았습니다.

빛이 Morning · Midday Sun · Leaf Shade일 때는 `vivid blue sky`, `clear air`, `crisp shadows`, `wind` 같은 태그가 한두 개 더 붙고, 화면을 뿌옇게 만드는 렌즈 효과(`soft focus`, `overexposure`, `light leaks`)는 빠집니다. 비 갠 뒤, 해 질 녘, 땅거미, 밤에는 붙지 않습니다. 여름이라고 전부 맑은 것은 아니기 때문입니다.

```text
full body, sitting on the breakwater, legs dangling, shaved ice, holding spoon, parted lips, ocean, seaside road, guardrail, breakwater, day, blue sky, bright sunlight, sea breeze, seagull, white clouds, crisp shadows, lens flare, blurry background, outfit color: white, polo shirt, flared skirt, ankle socks, wristwatch, hair tie on the wrist, sneakers
```

### 렌즈

카메라 앞면의 렌즈에는 지금 향하고 있는 장면이 비칩니다. 장면을 Random으로 두면 필름 아이콘이 보이고, 셔터를 누르면 실제로 찍힌 장면으로 바뀝니다. 머리에 쓴 것과 옷 색은 렌즈 옆에 작은 라벨로 붙습니다.

### 추가 태그

`OTHER` 입력란에는 기본 생성기에 없는 요소를 쉼표로 구분해 추가할 수 있습니다.

```text
contrail, stray cat, wind
```

`🎲` 또는 `RELEASE SHUTTER`(잠그지 않았을 때)로 전용 후보를 자동 입력할 수 있고, `◇`로 현재 값을 잠글 수 있습니다. 자동 후보에도 계절이 있습니다. 하얀 입김은 겨울에만, 땀방울은 여름에만, 비행운은 야외에서만 나옵니다.

### 복잡도

- **Simple** — 장소 2개, 공기 1개, 렌즈 효과 1개. 옷은 기본 구조와 부속 하나.
- **Medium** — 장소 3개, 공기 2개, 렌즈 효과 2개. 양말과 모자의 작은 디테일이 붙습니다.
- **Max** — 장소 5개, 공기 3개, 렌즈 효과 3개에 더해, 뽑힌 상의·하의·신발마다 그 아이템 전용 디테일 태그(예: `denim jacket, t-shirt` → `faded denim, metal buttons`)와 `detailed background`를 함께 출력합니다.
- **Random** — 출력할 때마다 위 세 단계 중 하나를 선택합니다.

### 색상

베이스 색상은 필수이며, 포인트 색상은 선택 사항입니다. 선택한 색상은 `outfit color:` 접두어와 함께 옷 묶음 맨 앞에 한 번만 기록됩니다. 색 목록은 흰색·남색·검정·회색·베이지·크림·하늘색·카키·갈색·연분홍입니다. 눈에 띄는 색은 넣지 않았습니다.

```text
full body, sitting on the floor, legs out, holding book, paperback, light smile, school rooftop, concrete floor, chain-link fence, day, blue sky, bright sunlight, drifting clouds, blurry background, outfit color: white, pinafore dress, long sleeve shirt, tote bag, ankle boots
```

```text
cowboy shot, walking along the path, looking afar, earphones, holding flip phone, laughing, open mouth, riverbank, grassy slope, distant bridge, rapeseed blossoms, river, dirt path, morning, pale blue sky, soft morning light, dandelion fluff, yellow blur in the foreground, soft breeze, bokeh, lens flare, film grain, outfit color: white, hoodie, blue jeans, simple belt, wristwatch, shirt tucked in, drawstrings, kangaroo pocket, straight leg, faded knees, folded handkerchief in the pocket, detailed background
```

옷 자체에는 색을 박지 않았습니다. `blue jeans`처럼 색이 곧 그 옷인 경우만 예외입니다. `Scene Only`에서는 색도 쓰지 않습니다.

### 카메라 몸통 색

`BODY` 버튼에서 Silver, Ice, Rose, Champagne, Mint 다섯 가지 몸통 빛깔을 고를 수 있습니다. 전부 은색에 옅게 색이 도는 정도입니다. 몸통 빛깔은 인터페이스만 바꾸며 생성되는 옷의 색에는 영향을 주지 않습니다.

### 두 사람

페이지를 열면 먼저 **몇 명을 찍을지** 묻습니다(혼자 · 여자 둘 · 남자와 여자 · 남자 둘). 고른 값은 `PEOPLE` · `PAIR` 칸에 들어가 잠기고(◆), 섞어도 바뀌지 않습니다. × · Esc · 바깥을 누르면 고르지 않고 닫히며, 이때는 잠그지 않습니다. 바꾸려면 잠금을 풀거나 칸에서 직접 고릅니다. 맨 위 `PEOPLE`에서 둘(Two)을 고르면 두 사람이 한 장면에 들어갑니다. 바로 옆 `PAIR`에서 여자 둘 · 남자와 여자 · 남자 둘 중 조합을 고릅니다. 한 사람일 때 `PAIR`는 흐리게 꺼져 있습니다.

두 사람은 **한 순간을 나눠 가집니다.** 우산을 같이 쓰고 걷거나, 소나기에 겉옷 하나를 같이 뒤집어쓰고 뛰거나, 이어폰을 한쪽씩 끼고 나란히 앉거나 누워 있거나(누운 장면은 위에서 내려다보는 구도 `from above`), 헤드폰을 쓰고 등을 맞대고 앉거나, 버스에서 한 사람이 다른 사람 어깨에 기대 졸거나, 정전된 방에서 촛불을 사이에 두고 앉습니다. 이어폰 · 헤드폰을 쓰는 순간에는 머리 장식의 헤드폰 · 귀마개와 손에 든 이어폰을 빼서 귀 위에 두 개가 겹치지 않게 합니다. 그 장면에 맞는 순간이 먼저 나옵니다(마트에서는 카트 밀기와 장바구니, 다다미방에서는 둘이 선풍기 앞에).

관계는 친구 · 남매에서 **풋풋한 썸**까지입니다. 손잡기 · 포옹 · 입맞춤 같은 진한 스킨십은 넣지 않았습니다.

옷은 사람마다 따로 뽑힙니다. 옷차림(사복 · 교복)은 둘이 같고, 색은 첫 번째 사람이 `BASE COLOR`를, 두 번째 사람이 다른 색 하나를 씁니다. 남자에게는 치마 · 원피스 · 세일러복이 나오지 않습니다. `IN HAND`의 소품은 손이 빈 사람이 듭니다.

출력은 NovelAI의 **여러 캐릭터 프롬프트** 방식을 따릅니다. 기본 프롬프트에는 인원 태그(`2girls` · `1boy, 1girl` · `2boys`)와 장면이, 캐릭터 프롬프트에는 `girl` · `boy`로 시작하는 각자의 몸짓과 옷이 들어갑니다. 함께 하는 동작에는 `mutual#` 접두어를 붙입니다(NovelAI 문서에 따르면 늘 먹지는 않습니다).

```text
BASE         1boy, 1girl, cowboy shot, sheltering under the eaves, standing, side-by-side, looking up at the rain, shopping street, hanging shop signs, power lines, sudden rain, heavy rain, wet ground, wet clothes, film grain, overexposure
CHARACTER 1  boy, wet clothes, holding grocery bag, green onion sticking out of the bag, faint blush, outfit color: white, school uniform, sweater vest, short sleeves, slacks, shirt untucked, name tag
CHARACTER 2  girl, wet clothes, looking at another, parted lips, outfit color: black, school uniform, short sleeve shirt, untucked, pleated skirt, neck ribbon, wristwatch
```

### 나눠서 보기

두 사람일 때는 인화지에 **기본 프롬프트 · 캐릭터 1 · 캐릭터 2**가 칸으로 나뉘어 나오고, 칸마다 `COPY` 버튼이 있습니다. NovelAI의 프롬프트 칸과 캐릭터 칸에 하나씩 붙여 넣으면 됩니다.

한 사람일 때는 `SPLIT` 버튼으로 고릅니다. 끄면 지금까지처럼 한 줄로, 켜면 기본 프롬프트와 캐릭터 프롬프트로 나뉘어 나옵니다. 고른 것은 이 브라우저에 기억됩니다.

인화지 아래의 `COPY`와 `SAVE .TXT`는 언제나 한 줄을 가져갑니다. 두 사람이면 NovelAI가 읽는 `기본 | 캐릭터 1 | 캐릭터 2` 형식의 한 줄입니다.

### 프롬프트 출력

`RELEASE SHUTTER`를 누르면 잠그지 않은 칸을 전부 섞은 뒤 플래시가 터지고, 카메라 밑에 물린 필름이 한 칸 감겨 올라가고, 새 프롬프트가 인화지 한 장이 되어 옆의 사진 더미 위에 툭 떨어집니다. 떨어질 때마다 조금씩 다르게 기울어지고, 먼저 찍은 사진은 그 밑에 가장자리만 보입니다. 인화지에 그림은 없습니다. 위쪽 가장자리에는 필름처럼 컷 번호와 장면 이름이, 구석에는 오늘 날짜가 주황색으로 찍힙니다. 27컷을 다 쓰면 새 롤로 넘어갑니다.

사진이 떨어지는 자리 아래쪽에는 아직 쓰지 않은 즉석사진 두 장이 흩어져 있습니다. 흰 테두리에 화면은 아직 상이 올라오지 않아 검고, 글자도 날짜도 없습니다. 더미의 배경 노릇을 해서, 프롬프트 인화지가 떨어지면 윗부분은 덮이고 아랫부분이 그 밑으로 보입니다. 장식이라 눌러지지 않고, 좁은 화면에서는 나오지 않습니다.

- `SPLIT` — 한 사람일 때 기본 프롬프트와 캐릭터 프롬프트를 나눠서 볼지 고릅니다.
- `COPY` — 결과를 한 줄로 클립보드에 복사합니다.
- `SAVE .TXT` — 결과를 텍스트 파일로 저장합니다.
- `RESHOOT` — 현재 설정을 유지한 채 새 조합을 출력합니다.
- `✂ DRAG TO TEAR` — 절취선 줄을 아래로 끌거나 그 줄을 한 번 누르면 사진 더미를 치웁니다.

버튼 이름은 카메라답게 영어로 두었고, 마우스를 올리면 하는 일이 **한글 툴팁**으로 나옵니다. `한글 보기`를 켜든 끄든 툴팁은 늘 한글입니다.

### 설정 잠금

각 설정의 `🎲` 버튼은 그 칸만 다시 뽑습니다. 옆의 `◇` 버튼을 누르면 `◆`로 바뀌며 해당 값을 잠급니다. `RELEASE SHUTTER`는 잠그지 않은 칸을 모두 섞으므로, 값을 지키려면 잠그고 한 칸만 바꾸려면 그 칸의 `🎲`를 누릅니다. 원하는 장면이나 옷차림만 고정한 채 나머지를 다시 조합할 수 있습니다.

### 설정 언어

카메라 앞면의 `한글 보기` 버튼을 누르면 설정 이름, 선택지, 렌즈의 장면 이름, 자동 생성된 OTHER 값이 한글로 바뀝니다. 화면의 설정 언어만 바뀌며 내부 값과 생성·복사·저장되는 프롬프트는 계속 영어로 유지됩니다.

## 사용 방법

설치 과정은 없습니다.

1. 저장소를 내려받습니다.
2. `index.html`을 웹 브라우저에서 엽니다.
3. 원하는 조건을 선택하고 `RELEASE SHUTTER`를 누릅니다.

별도의 빌드 과정이 없는 정적 웹 프로젝트이므로 GitHub Pages에도 바로 게시할 수 있습니다.

```text
Halation/
├── index.html   # 화면 구조
├── styles.css   # 카메라 몸통과 인터페이스 스타일
├── data.js      # 장면 데이터와 조합 규칙
└── app.js       # 프롬프트 생성 및 화면 동작
```

## 데이터를 고칠 때 신경쓸 것

- `styles`(장면)의 키를 바꾸면 `heroMap`의 `styles` 목록, `backPieces`의 `styles` 목록, `index.html`의 `<option>`, `app.js`의 `settingTranslations.values.mainStyle` 네 곳을 모두 맞춰야 합니다.
- 장면을 추가하면 `season`(여러 계절이면 `seasons` 목록), `icon`, `label`, `name`, `place` 8개, `moments` 6개, `air` 6개, `light`, `dress`를 함께 넣습니다. 집 안 장면에는 `home: true`를 답니다(겨울에 외투를 벗깁니다). 실내 장면에는 `indoor: true`를 답니다. 없으면 하늘 태그가 방 안에 나옵니다.
- `moments`는 구도와 몸짓을 한 문자열에 같이 씁니다. 엔진은 `upper body`나 `cowboy shot`이라는 글자를 보고 신발을 비우고, `from behind`나 `silhouette`을 보고 표정을 비웁니다. `looking back`이나 `turning`이 같이 있으면 표정을 남깁니다.
- `moments`에는 손이 하는 일을 되도록 쓰지 않습니다. 손에는 `IN HAND`의 물건이 들리기 때문입니다. 표정도 쓰지 않습니다.
- 손에 든 것을 추가하면 `styles` 목록으로 있을 법한 장면을 적습니다. 목록이 없으면 어디서든 나옵니다. 장면마다 후보가 셋 이상 남는지 확인합니다.
- 상의·하의·원피스·신발 항목을 추가하면 `itemDetails`에도 같은 문자열로 항목을 추가합니다. 빠지면 브라우저 콘솔에 `[data] itemDetails missing:` 경고가 뜹니다.
- 하의에는 옷장마다 `skirt`가 들어간 항목과 들어가지 않은 항목을 하나 이상씩 남겨 둡니다. `BOTTOM` 필터가 빈손이 되면 필터가 무시됩니다.
- 한쪽 하의와만 맞는 상의는 `topFits`에 적습니다.
- 교복 옷장의 목 장식은 `extras`가 아니라 `neck`에 넣습니다. `extras`에 넣으면 넥타이와 리본이 같이 나올 수 있습니다. 같은 자리의 물건(가방 두 개, 장갑 두 켤레)은 한 목록에 같이 두지 않습니다.
- 계절이나 야외에 매인 `OTHER` 후보에는 `seasons` 또는 `outdoor`를, 비 오는 날에 안 어울리면 `dry`를 답니다.
- 날씨(`lights`)에는 일어나는 계절 `seasons`, 실내 전용 `indoorOnly`, 비 `wet`, 날씨가 가져오는 자세 `moments`를 답니다. 비 오는 날 들 만한 소품에는 `wet: true`를 답니다.
- 두 사람의 순간은 `duoMoments`에 적습니다. `base`는 기본 프롬프트에, `a` · `b`는 각자의 캐릭터 프롬프트에 들어갑니다. 손을 쓰는 낱말은 `duoBusy`에도 있어야 그 사람에게 소품이 가지 않습니다.
- 손에 든 것에는 필요하면 `lights`(랜덤일 때 허용하는 빛), `avoid`(같이 못 나오는 자세), `drops`(빼는 소지품), `clash`(같이 못 쓰는 머리 장식)를 답니다.
- 두 손을 다 쓰는 자세를 새로 넣으면 `busyHands`에 그 낱말을 더합니다. 특정 소품이 있어야 하는 자세는 `momentNeeds`에 적습니다. 빠뜨리면 손이 바쁜데 무언가를 쥐고 있는 프롬프트가 나옵니다.
- 계절 전체에 걸리는 분위기는 `tones`에 적습니다. `lights`는 그 분위기가 붙는 빛, `tags`는 더해지는 태그, `dropLens`는 그때 빼는 렌즈 효과입니다. 여름에 땀·아지랑이 같은 더운 쪽 낱말을 다시 넣지 않습니다.
- 옷 색을 추가하면 `colorSwatch`에 미리보기 색을 함께 넣습니다.

## 기술 구성

- HTML
- CSS
- Vanilla JavaScript

백엔드, 데이터베이스, AI API, 계정 시스템 없이 브라우저에서만 동작합니다.

## 폰트

웹폰트를 쓰지 않습니다. 인터페이스는 시스템에 있는 폰트를 순서대로 찾아 씁니다.

```text
글자      "Pretendard Variable", "Pretendard", -apple-system, "Segoe UI", "Malgun Gothic", system-ui, sans-serif
프롬프트    Consolas, "Courier New", monospace
```

Pretendard가 설치돼 있으면 그것을, 없으면 시스템 글꼴을 씁니다. 어떤 환경에서도 폰트 다운로드 없이 열립니다.

## 앞으로의 에디션

Prompt Archive는 하나의 생성기에 그치지 않고 서로 다른 분위기의 시리즈로 확장할 수 있도록 구상했습니다.

- **Prompt Archive 2004** — Y2K / cyber / street / alternative fashion
- **Prompt Archive : Rosette** — 서양 복식사 700 BC–1965 / 역사 판타지
- **Prompt Archive : Chrome** — 사이버펑크 / 마도공학 / 근미래 도시
- **Prompt Archive : Empyrean** — 우주적 존재 / 천체 / 승화
- **Prompt Archive : Bestiary** — 인외 / 이종족 / 수인 / 요괴
- **Prompt Archive : Crest** — 교복 / 생도복 / 군복 / 비행복 / 기사단 제복
- **Prompt Archive : Afterimage** — 영화의 한 장면 같은 화보 / 장면 · 빛 · 구도
- **Prompt Archive : Halation** — 일상의 한 조각 / 학교 · 동네 · 집의 사계절과 날씨 / 수수한 옷 / 두 사람
- **Prompt Archive : Nocturne** — gothic / Visual Kei / dark fantasy / cathedral
- **Prompt Archive : Sugarbox** — kawaii / doll / pastel / plush

각 에디션은 Prompt Archive라는 기본 콘셉트를 공유하면서 서로 다른 데이터와 인터페이스를 사용합니다.

## 프로젝트 방향

이 프로젝트의 목표는 특정 지역이나 시대의 생활을 정확히 고증하는 것이 아닙니다. 캐릭터를 어느 하루의 한 장면에 세워 보기 위한, 빠른 프롬프트 실험용 창작 도구를 지향합니다. 다만 "안 어울리는 조합이 안 나오는 것"은 끝까지 지킵니다.

## 라이선스

이 프로젝트의 애플리케이션 코드는 [MIT License](LICENSE)에 따라 사용할 수 있습니다.

---

✹ 장면을 고르고, 필름을 감고, 마음에 드는 한 장을 아카이브하세요.
