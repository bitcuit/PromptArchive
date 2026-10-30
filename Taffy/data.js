// Prompt Archive : Taffy — Trick-or-Treat Porch
// 할로윈 분장 한 벌. 마녀 · 뱀파이어 · 천 유령부터 플래퍼 · 바니걸, 누구나 아는 캐릭터 코스프레까지.
// Korean names ride on the items themselves (`k`) and costumes (`labelKo`); app.js gathers them at start-up.
//
// 구조는 Gingham 과 같다: 컬렉션 → periods(분장) → slots → 항목 { id, t, k, p, g, f, fx, x, cat, … } + 분장별 레시피.
// 다만 손으로 다 풀어 쓰면 수천 줄이 되므로, 분장 하나를 짧은 표기로 적고 costume() 이 엔진이 읽는 모양으로 펼친다.
//
// 슬롯 11개의 개념:
//   garment 의상 · structure 허리(코르셋 · 벨트) · foundation 다리(스타킹 · 양말) · neckwear 목 · outer 망토 · 겉옷
//   footwear 신발 · headwear 머리(모자 · 귀 · 뿔 머리띠) · accessories 장신구 · weapon 손에 든 것 · device 얼굴 분장 · effect 장소
//
// 척도 f / fx — 0 Homemade(손수 만든 분장) · 1 Party(파티 코스튬) · 2 Editorial(화보) · 3 Real Night(진짜가 된 밤)
//   f 는 아래쪽 끝, fx 는 위쪽 끝. 'f2' 는 화보부터(진짜가 된 밤에도 나옴), 'f0 F0' 은 손수 만든 분장에만.
// 노출 x — 0 Covered(단정) · 1 Classic(보통) · 2 Daring(노출). 'x12' 는 보통과 노출에서만. 없으면 모든 단계.
//   분장에 그 노출 단계가 없으면 엔진이 가까운 단계로 내려간다(천 유령에는 노출이 없다).
//
// 짧은 표기
//   항목  [key, 영어 이름, 한국어 이름, 프롬프트, '옵션']
//   옵션  f0~f3 · F0~F3(fx) · x012 · gf / gm · c:mask(필터 칩) · sec(둘째 장신구로만, 낮은 확률)
//         n:low|high|own(의상의 목선) · an:low+own(그 목선의 의상엔 안 붙음) · nb(부츠 안 신김)
//         skip:footwear+foundation(이 의상이면 그 칸을 비움 — 인어 꼬리, 머리까지 덮는 천)
//         v:이름(같은 옷의 노출 단계별 재단 — 노출을 바꾸면 의상이 같은 이름의 다른 재단으로 바뀐다)
//         s:이름(서브컬처 조합의 의상 결 — 선택한 결의 항목만 후보가 된다)
//   분장  tag / tagReal(진짜가 된 밤) — 남성 차림이 다른 분장이면 tagM / tagRealM(카우걸 → 카우보이)
//         need: { 슬롯: '키 키' | '' } — 그 분장을 알아보게 하는 칸. 랜덤으로 뽑을 때 비우지 않는다('' 는 그 칸의 아무 항목)
//   레시피 [key, '옵션 w가중치 max장신구수', { 슬롯: 'key key', '-슬롯': '뺄 key' }]
//         슬롯을 적으면 그 key 만, '-슬롯' 은 그것만 빼고 전부, 안 적으면 그 분장의 전부. 'none' 은 그 칸 비움.
//
// 이 에디션의 선: 몸은 바꾸지 않는다. 뿔은 머리띠고 꼬리는 달아 놓은 천이다 — 진짜 몸은 Bestiary 의 것이다.
// 피는 슬래셔 악당의 옷 · 소품 · 뺨에 튄 가짜 피까지만 쓴다. 상처 · 신체 훼손은 넣지 않는다. 노출 단계도 옷의 형태(미니 · 코르셋 · 트임)까지만 쓴다.
// 망사 · 체인 · 그물(fishnet · mesh · chain · net)은 쓰지 않는다 — 어울리지 않는 차림에 끼어들고, 모델이 웃옷까지 번지게 그린다.

/* 색 이름 — 드롭다운 한글 표기. 프롬프트에는 영어가 들어간다. */
const COLOR_KO = {
  'black': '검정', 'white': '흰색', 'ivory': '아이보리', 'cream': '크림', 'grey': '회색', 'silver': '은색', 'gold': '금색',
  'deep purple': '진보라', 'plum': '자두색', 'lavender': '라벤더', 'violet': '바이올렛', 'lilac': '라일락',
  'midnight blue': '미드나이트 블루', 'navy': '네이비', 'royal blue': '로열 블루', 'sky blue': '하늘색', 'teal': '틸', 'turquoise': '터쿼이즈', 'aqua': '아쿠아',
  'forest green': '포레스트 그린', 'emerald': '에메랄드', 'moss green': '모스 그린', 'olive': '올리브', 'mint': '민트', 'lime green': '라임',
  'burnt orange': '번트 오렌지', 'pumpkin orange': '호박 주황', 'orange': '주황', 'amber': '호박색', 'mustard': '머스터드', 'yellow': '노랑', 'butter yellow': '버터 옐로',
  'crimson': '크림슨', 'blood red': '진홍', 'red': '빨강', 'burgundy': '버건디', 'wine': '와인', 'scarlet': '스칼렛', 'rust': '러스트',
  'pink': '분홍', 'hot pink': '핫핑크', 'blush pink': '블러시 핑크', 'pastel pink': '파스텔 핑크', 'rose': '로즈', 'magenta': '마젠타', 'coral': '코럴',
  'brown': '갈색', 'chocolate brown': '초콜릿 브라운', 'tan': '탠', 'khaki': '카키', 'beige': '베이지', 'sand': '샌드', 'charcoal': '차콜', 'bone white': '본 화이트', 'dusty grey': '먼지 회색',
  'faded linen': '바랜 리넨', 'sepia': '세피아', 'champagne': '샴페인', 'rose gold': '로즈 골드', 'copper': '구리색', 'brass': '황동색', 'pearl white': '펄 화이트',
  'iridescent': '무지갯빛', 'pastel rainbow': '파스텔 무지개', 'seafoam': '시폼', 'gingham blue': '깅엄 블루', 'denim blue': '데님 블루',
  'neon pink': '네온 핑크', 'neon green': '네온 그린', 'electric blue': '일렉트릭 블루', 'leopard print': '호피', 'polka dot red': '빨간 물방울', 'cherry red': '체리 레드',
  'off-white': '오프화이트', 'fog grey': '안개 회색', 'slate grey': '슬레이트 회색', 'antique silver': '앤티크 실버', 'gunmetal': '건메탈',
  'antique gold': '앤티크 골드', 'aubergine': '가지색', 'ink blue': '잉크 블루', 'dusty lavender': '더스티 라벤더',
  'dusty rose': '더스티 로즈', 'pale peach': '연복숭아색', 'oxblood': '흑적색', 'ice blue': '아이스 블루', 'powder blue': '파우더 블루',
  'steel blue': '스틸 블루', 'cobalt blue': '코발트 블루', 'bottle green': '보틀 그린', 'sage green': '세이지 그린',
  'taupe': '토프', 'chestnut': '밤색', 'terracotta': '테라코타',
};

/* 기존 원형의 색 계열 안에서 밝기와 채도를 넓힌다. 고정색 분장의 빈 팔레트는 유지한다. */
const TF_COLOR_VARIANTS = {
  white: ['off-white', 'pearl white'], ivory: ['off-white'], grey: ['fog grey', 'slate grey'],
  silver: ['antique silver', 'gunmetal'], gold: ['antique gold', 'champagne'],
  'deep purple': ['aubergine'], 'midnight blue': ['ink blue'], lavender: ['dusty lavender', 'lilac'],
  pink: ['dusty rose', 'pale peach'], red: ['oxblood'], burgundy: ['oxblood'], wine: ['oxblood'],
  'sky blue': ['ice blue', 'powder blue'], navy: ['steel blue', 'cobalt blue'],
  'forest green': ['bottle green', 'sage green'], brown: ['taupe', 'chestnut'], orange: ['terracotta', 'copper'],
};
const tfExpandColors = colors => [...new Set((colors || []).flatMap(c => [c, ...(TF_COLOR_VARIANTS[c] || [])]))];

/* 선택 규칙 — 슬롯 채택 확률과 장식 상한. 손에 든 것 · 얼굴 분장 · 장소는 할로윈의 절반이라 자주 뽑는다. */
const TF_RULES = {
  recipeFirst: true, primarySlot: 'garment',
  slotChance: { foundation: .6, structure: .55, neckwear: .45, outer: .5, footwear: .95, headwear: .85, accessories: .85, weapon: .8, device: .55, effect: .85 },
  maxDecorativeSlots: 3,
  maxFantasyGarnish: { 0: 1, 1: 1, 2: 2, 3: 2 },
  suppressDuplicateFeatures: true,
};

const TF_SLOT_LABELS = {
  ko: { foundation: '스타킹 · 양말', structure: '허리 장식', garment: '의상', neckwear: '목 장식', outer: '겉옷', footwear: '신발', headwear: '머리 장식', accessories: '장신구', weapon: '손 소품', device: '얼굴 분장', effect: '배경' },
  en: { foundation: 'LEGWEAR', structure: 'WAIST ACCESSORIES', garment: 'OUTFIT', neckwear: 'NECKWEAR', outer: 'OUTERWEAR', footwear: 'FOOTWEAR', headwear: 'HEADWEAR', accessories: 'ACCESSORIES', weapon: 'HAND PROPS', device: 'FACE MAKEUP', effect: 'BACKGROUND' },
};

const TF_COLLECTION_NAMES = {
  classic: { ko: '클래식 분장', en: 'Classic Costumes' },
  illust: { ko: '판타지 분장', en: 'Fantasy Costumes' },
  everyday: { ko: '일상 분장', en: 'Everyday Costumes' },
  cosplay: { ko: '캐릭터 분장', en: 'Character Costumes' },
  cross: { ko: '분장 조합', en: 'Costume Mix' },
};

const TF_SCHEMA = ['foundation', 'structure', 'garment', 'neckwear', 'outer', 'footwear', 'headwear', 'accessories', 'weapon', 'device', 'effect'];

/* 화면 연출 — 연출 칸에 보이게 채워진다. 척도마다 찍는 방식이 다르다. 장소 · 시간은 장소 칸의 몫이다. */
const TF_SHOTS = {
  plain: ['candid photo', 'flash photography', 'snapshot', 'phone camera photo', 'party photo'],
  romantic: ['warm string light bokeh', 'film grain', 'soft focus', 'polaroid photo', 'depth of field'],
  fantasy: ['fashion editorial', 'studio lighting', 'dramatic rim light', 'magazine cover shoot', 'shallow depth of field', 'colored gel lighting'],
  otherworldly: ['magical atmosphere', 'glowing particles', 'swirling mist', 'moonlit glow', 'floating embers'],
};

/* 모든 분장에 들어가는 장소 — 할로윈 밤의 자리. 분장마다 진짜가 된 밤의 장소를 따로 더한다. */
const TF_PLACES = [
  ['_porch', 'Front porch', '현관 앞 트릭 오어 트릿', 'trick-or-treating on a front porch, carved jack-o\'-lanterns on the steps', 'F2'],
  ['_street', 'Street at dusk', '해 질 녘 동네 골목', 'suburban street at dusk, trick-or-treaters, glowing porch lights', 'F2'],
  ['_patch', 'Pumpkin patch', '호박밭', 'pumpkin patch, hay bales, autumn afternoon', 'F2'],
  ['_party', 'House party', '집 파티', 'halloween house party, orange string lights, paper bats on the wall', 'F2'],
  ['_candy', 'Candy table', '사탕 테이블 앞', 'beside a table of candy bowls and caramel apples', 'F2'],
  ['_haunt', 'Haunted house attraction', '귀신의 집 입구', 'entrance of a haunted house attraction, fog machine haze', 'f1 F2'],
  ['_studio', 'Studio backdrop', '스튜디오 배경', 'studio backdrop, orange and purple gel lighting', 'f2'],
  ['_leaves', 'Autumn woods', '낙엽 진 숲길', 'autumn woods, falling leaves, golden hour', 'f2'],
  ['_candle', 'Candlelit hall', '촛불 켠 홀', 'candlelit hall, tall candelabras', 'f2'],
  ['_moon', 'Full moon rooftops', '보름달 지붕 위', 'rooftops under a full moon, bats flying overhead', 'f3'],
  ['_lanterns', 'Floating jack-o\'-lanterns', '떠다니는 호박 등불', 'jack-o\'-lanterns floating in the night air, glowing faces', 'f3'],
  ['_home', 'Living room decorated for halloween', '할로윈으로 꾸민 거실', 'living room decorated for halloween, fake cobwebs on the shelves, paper bats on the wall, carved pumpkins on the table', 'F2'],
  ['_downtown', 'Halloween night downtown', '할로윈 밤 번화가', 'crowded downtown street on halloween night, people in costumes, neon signs, orange string lights overhead', 'F2'],
  ['_shops', 'Decorated shop street', '할로윈 장식 상점가', 'shop street decorated for halloween, pumpkins and fake cobwebs in the windows, warm shop lights', 'F2'],
  ['_ruins', 'Moonlit ruins', '달빛 비친 폐허', 'crumbling stone ruins under the moon, ivy on broken walls, crows perched on the stones', 'f1'],
  ['_manor', 'Abandoned mansion hall', '버려진 저택 홀', 'abandoned mansion hall, thick cobwebs, dusty chandelier, torn curtains', 'f1'],
  ['_batsky', 'Bats across the full moon', '보름달을 가로지르는 박쥐 떼', 'swarm of bats flying across a huge full moon, night sky', 'f2'],
  ['_crows', 'Crows over a dead tree', '마른 나무 위 까마귀 떼', 'crows circling over a bare dead tree, grey dusk sky', 'f2'],
  ['_sheets', 'Little sheet ghosts floating', '떠다니는 작은 천 유령들', 'tiny white sheet ghosts floating in the air around', 'f2'],
  ['_mist', 'Misty graveyard', '안개 낀 묘지', 'misty graveyard at midnight, crooked headstones, crows perched on the stones', 'f3'],
];

/* 모든 분장이 손에 들 수 있는 것 — 트릭 오어 트릿의 물건. 파티 코스튬까지만. */
const TF_HELD = [
  ['_bucket', 'Pumpkin candy bucket', '호박 사탕 바구니', 'holding a plastic jack-o\'-lantern candy bucket', 'F1'],
  ['_bag', 'Trick-or-treat bag', '트릭 오어 트릿 봉투', 'holding a trick-or-treat bag full of candy', 'F1'],
  ['_apple', 'Caramel apple', '캐러멜 사과', 'holding a caramel apple on a stick', 'F1'],
  ['_lolly', 'Swirl lollipop', '소용돌이 롤리팝', 'holding a big swirl lollipop', 'F1'],
  ['_pumpkinpop', 'Pumpkin lollipop', '호박 롤리팝', 'holding a pumpkin-shaped lollipop', 'F1'],
  ['_wrapped', 'Wrapped candy', '포장 사탕', 'holding a wrapped candy between the fingers', 'F1'],
  ['_chocobox', 'Chocolate sticks', '초코 스틱 한 갑', 'holding a box of chocolate-dipped biscuit sticks', 'F1'],
  /* 입에 문 것 — 손에 든 것과 같은 줄이라 둘이 함께 나오지 않는다. */
  ['_m-lolly', 'Lollipop in the mouth', '입에 문 롤리팝', 'lollipop in mouth, mouth hold', 'F1 c:mouth'],
  ['_m-candy', 'Candy in the mouth', '입에 문 사탕', 'round candy in mouth, mouth hold, cheek bulge', 'F1 c:mouth'],
  ['_m-choco', 'Chocolate stick in the mouth', '입에 문 초코 스틱', 'chocolate-dipped biscuit stick in mouth, mouth hold', 'F1 c:mouth'],
];

/* 화관 · 엔젤링 — 어울리는 분장의 머리 장식에 더한다.
 * 뿔 · 후광 · 간호사 모자 · 면사포처럼 그 분장을 알아보게 하는 머리 장식은 빠지면 안 되므로 묶어서 쓴다.
 * 여섯째 칸 true: 분장의 need 가 머리 장식을 지정해 둔 경우 그 목록에도 더한다(이것도 알아볼 표시라서). */
const TF_ROSE = 'red rose flower crown', TF_BLACKROSE = 'black rose flower crown', TF_WHITEROSE = 'white rose flower crown';
const TF_THORN = 'crown of thorny vines', TF_BABY = 'baby\'s breath flower crown', TF_FLOWER = 'flower crown';
const TF_SLIP = 'halo tilted and slipping down to one side of the head';
const TF_CROWNS = {
  /* 천사 */
  angel: [
    ['slip', 'Slipping halo', '흘러내린 엔젤링', `gold ${TF_SLIP}`, '', true],
    ['halo-rose', 'Halo and white rose crown', '헤일로와 흰 장미 화관', `gold halo headband, ${TF_WHITEROSE}`, 'f1', true],
    ['halo-flower', 'Halo and flower crown', '헤일로와 화관', `gold halo headband, ${TF_FLOWER}`, '', true],
  ],
  'an-white': [
    ['slip', 'Slipping halo', '흘러내린 엔젤링', TF_SLIP],
    ['halo-baby', 'Halo and baby\'s breath crown', '후광과 안개꽃 화관', `halo, ${TF_BABY}`, 'f1'],
    ['halo-flower', 'Halo and flower crown', '후광과 화관', `halo, ${TF_FLOWER}`],
  ],
  'an-idol': [
    ['slip', 'Slipping heart halo', '흘러내린 하트 엔젤링', `heart-shaped ${TF_SLIP}`],
    ['halo-flower', 'Heart halo and flower crown', '하트 후광과 화관', `heart-shaped halo, ${TF_FLOWER}`],
  ],
  'an-fallen': [
    ['slip', 'Cracked slipping halo', '금 간 채 흘러내린 엔젤링', `cracked ${TF_SLIP}`],
    ['thorn', 'Thorn vine crown', '가시 덩굴 화관', TF_THORN],
    ['blackrose', 'Black rose crown', '흑장미 화관', TF_BLACKROSE],
  ],
  /* 악마 · 서큐버스 — 뿔과 함께 */
  devil: [
    ['horns-rose', 'Horns and rose crown', '뿔 머리띠와 장미 화관', `fake devil horns on a headband, ${TF_ROSE}`],
    ['horns-thorn', 'Horns and thorn vine crown', '뿔 머리띠와 가시 덩굴 화관', `fake devil horns on a headband, ${TF_THORN}`],
    ['horns-black', 'Horns and black rose crown', '뿔 머리띠와 흑장미 화관', `fake devil horns on a headband, ${TF_BLACKROSE}`, 'f1'],
  ],
  imp: [['horns-rose', 'Curled horns and rose crown', '말린 뿔과 장미 화관', `curled fake horns on a headband, ${TF_ROSE}`]],
  's-classic': [
    ['horns-rose', 'Horns and rose crown', '뿔 머리띠와 장미 화관', `curled fake horns on a headband, ${TF_ROSE}`],
    ['horns-black', 'Horns and black rose crown', '뿔 머리띠와 흑장미 화관', `curled fake horns on a headband, ${TF_BLACKROSE}`],
  ],
  's-pink': [['horns-rose', 'Pink horns and rose crown', '분홍 뿔과 분홍 장미 화관', 'pink fake horn clips, pink rose flower crown']],
  /* 신부 — 면사포와 함께 */
  bride: [
    ['veil-rose', 'Veil and white rose crown', '면사포와 흰 장미 화관', `white wedding veil, ${TF_WHITEROSE}`, '', true],
    ['veil-thorn', 'Veil and thorn vine crown', '면사포와 가시 덩굴 화관', `white wedding veil, ${TF_THORN}`, '', true],
    ['veil-flower', 'Veil and flower crown', '면사포와 화관', `white wedding veil, ${TF_FLOWER}`, '', true],
  ],
  ghostbride: [
    ['veil-rose', 'Tattered veil and white rose crown', '해진 면사포와 흰 장미 화관', `tattered wedding veil, ${TF_WHITEROSE}`, 'gf'],
    ['veil-thorn', 'Tattered veil and thorn vine crown', '해진 면사포와 가시 덩굴 화관', `tattered wedding veil, ${TF_THORN}`, 'gf'],
    ['veil-baby', 'Tattered veil and baby\'s breath crown', '해진 면사포와 안개꽃 화관', `tattered wedding veil, ${TF_BABY}`, 'gf'],
    ['veil-flower', 'Tattered veil and flower crown', '해진 면사포와 화관', `tattered wedding veil, ${TF_FLOWER}`, 'gf'],
  ],
  'f-bride': [
    ['veil-thorn', 'Tattered veil and thorn vine crown', '해진 베일과 가시 덩굴 화관', `tattered veil, ${TF_THORN}`, 'gf'],
    ['veil-flower', 'Tattered veil and flower crown', '해진 베일과 화관', `tattered veil, ${TF_FLOWER}`, 'gf'],
  ],
  /* 수녀 · 넋 — 베일과 함께 */
  hauntednun: [
    ['veil-thorn', 'Veil and thorn vine crown', '베일과 가시 덩굴 화관', `gothic nun veil, ${TF_THORN}`, 'gf'],
    ['veil-rose', 'Veil and white rose crown', '베일과 흰 장미 화관', `gothic nun veil, ${TF_WHITEROSE}`, 'gf'],
    ['veil-flower', 'Veil and flower crown', '베일과 화관', `gothic nun veil, ${TF_FLOWER}`, 'gf'],
  ],
  'my-banshee': [['veil-black', 'Veil and black rose crown', '베일과 흑장미 화관', `long trailing veil, ${TF_BLACKROSE}`]],
  /* 간호사 — 모자와 함께 */
  nurse: [
    ['cap-rose', 'Nurse cap and rose crown', '간호사 모자와 장미 화관', `nurse cap, ${TF_ROSE}`, 'gf'],
    ['cap-thorn', 'Nurse cap and thorn vine crown', '간호사 모자와 가시 덩굴 화관', `nurse cap, ${TF_THORN}`, 'gf'],
    ['cap-flower', 'Nurse cap and flower crown', '간호사 모자와 화관', `nurse cap, ${TF_FLOWER}`, 'gf'],
  ],
  zombienurse: [
    ['cap-thorn', 'Nurse cap and thorn vine crown', '간호사 모자와 가시 덩굴 화관', `nurse cap, ${TF_THORN}`, 'gf'],
    ['cap-black', 'Nurse cap and black rose crown', '간호사 모자와 흑장미 화관', `nurse cap, ${TF_BLACKROSE}`, 'gf'],
  ],
  /* 백조 · 흑조 */
  'sw-white': [
    ['whiterose', 'White rose crown', '흰 장미 화관', TF_WHITEROSE],
    ['baby', 'Baby\'s breath crown', '안개꽃 화관', TF_BABY],
    ['flower', 'Flower crown', '화관', TF_FLOWER],
  ],
  'sw-black': [
    ['blackrose', 'Black rose crown', '흑장미 화관', TF_BLACKROSE],
    ['thorn', 'Thorn vine crown', '가시 덩굴 화관', TF_THORN],
  ],
  /* 뱀파이어 · 마녀 · 그 밖 */
  vampire: [
    ['blackrose', 'Black rose crown', '흑장미 화관', TF_BLACKROSE],
    ['rosecrown', 'Rose crown', '장미 화관', TF_ROSE],
  ],
  frillvamp: [['blackrose', 'Black rose crown', '흑장미 화관', TF_BLACKROSE]],
  'v-white': [
    ['whiterose', 'White rose crown', '흰 장미 화관', TF_WHITEROSE],
    ['flower', 'Flower crown', '화관', TF_FLOWER],
  ],
  'w-rose': [['thorn', 'Thorn vine crown', '가시 덩굴 화관', TF_THORN]],
  'w-dark': [['blackrose', 'Black rose crown', '흑장미 화관', TF_BLACKROSE]],
  alice: [
    ['rose', 'Rose crown', '장미 화관', TF_ROSE],
    ['flower', 'Flower crown', '화관', TF_FLOWER],
  ],
  greek: [['flower', 'Flower crown', '화관', TF_FLOWER, 'gf']],
  'greek-hist': [['laurel', 'Laurel wreath', '월계관', 'green laurel wreath']],
  'fy-moon': [
    ['flower', 'Flower crown', '화관', TF_FLOWER],
    ['silverleaf', 'Silver leaf crown', '은빛 잎 관', 'delicate silver leaf crown'],
  ],
  'fy-pixie': [['flowercrown', 'Flower crown', '화관', TF_FLOWER]],
  'sr-siren': [['flower', 'Flower crown', '화관', TF_FLOWER]],
  fairy: [
    ['rose', 'Rose crown', '장미 화관', TF_ROSE],
    ['baby', 'Baby\'s breath crown', '안개꽃 화관', TF_BABY],
  ],
  'fy-forest': [
    ['thorn', 'Thorn vine crown', '가시 덩굴 화관', TF_THORN],
    ['ivy', 'Ivy leaf crown', '담쟁이 잎 관', 'ivy leaf crown'],
  ],
};

/* 옵션 문자열을 항목 필드로 */
function tfOpts(s) {
  const o = {};
  for (const tok of String(s || '').split(/\s+/).filter(Boolean)) {
    let m;
    if ((m = tok.match(/^f(\d)$/))) o.f = +m[1];
    else if ((m = tok.match(/^F(\d)$/))) o.fx = +m[1];
    else if ((m = tok.match(/^x([0-2]+)$/))) o.x = [...m[1]].map(Number);
    else if (tok === 'gf') o.g = 'f';
    else if (tok === 'gm') o.g = 'm';
    else if ((m = tok.match(/^c:(\w+)$/))) o.cat = m[1];
    else if (tok === 'sec') o.secondary = true;
    else if (tok === 'nb') o.noBoots = true;
    else if ((m = tok.match(/^v:([\w-]+)$/))) o.fam = m[1];
    else if ((m = tok.match(/^s:([\w-]+)$/))) o.style = m[1];
    else if ((m = tok.match(/^n:(\w+)$/))) o.neckline = m[1];
    else if ((m = tok.match(/^an:([\w+]+)$/))) o.avoidNeck = m[1].split('+');
    else if ((m = tok.match(/^skip:([\w+]+)$/))) o.skip = m[1].split('+');
    else if ((m = tok.match(/^w(\d+)$/))) o.weight = +m[1];
    else if ((m = tok.match(/^max(\d)$/))) o.maxAccessories = +m[1];
    else console.warn('[taffy] 모르는 옵션', tok);
  }
  return o;
}

/* 하트 · 심장 보석 — 어두운 분장들이 같이 쓰는 장신구. 둘째 장신구로만, 낮은 확률로 나온다. */
const TF_HEARTS = [
  ['heart-liquid', 'Heart gem with red liquid inside', '붉은 액체가 흐르는 하트 보석', 'heart-shaped glass pendant, dark red liquid swirling inside', 'f1 sec'],
  ['heart-anatomy', 'Anatomical heart gem', '심장 모양 보석', 'anatomical heart-shaped ruby pendant', 'f1 sec'],
  ['heart-brooch', 'Anatomical heart brooch', '심장 모양 브로치', 'anatomical heart-shaped garnet brooch', 'f1 sec'],
  ['heart-drip', 'Heart gem dripping red', '붉은 방울이 맺힌 하트 보석', 'heart-shaped ruby pendant, a glowing red drop dripping from it', 'f3 sec'],
];
const TF_HEART_IDS = new Set(['witch', 'w-dark', 'w-rose', 'vampire', 'frillvamp', 'v-punk', 'v-lounge', 'bride', 'ghostbride', 'f-bride', 'reaper', 'devil', 'redqueen', 'foggent', 'phantom', 'windup']);

/* 해골 소품 — 어두운 분장의 손 소품에 더한다. 분장 고유 소품과 겹치지 않게 키 앞에 _ */
const TF_SKULLS = [
  ['_skull', 'Skull in hand', '손에 든 해골', 'holding a prop skull in one hand', 'f1'],
  ['_skullcandle', 'Skull candleholder', '해골 촛대', 'holding a skull candleholder, candle dripping wax', 'f1'],
  ['_skullcup', 'Skull goblet', '해골 잔', 'holding a skull-shaped goblet', 'f2'],
];
const TF_SKULL_IDS = new Set(['witch', 'w-dark', 'vampire', 'v-punk', 'ghostbride', 'reaper', 'devil', 'pirate', 'foggent', 'phantom']);

/* 분장 하나를 엔진이 읽는 period 로 펼친다. */
function costume(id, label, labelKo, callNo, spec) {
  const slots = {};
  const keyed = {};
  const AB = { garment: 'g', structure: 'ws', foundation: 'lg', neckwear: 'nk', outer: 'ot', footwear: 'ft', headwear: 'hd', accessories: 'ac', weapon: 'hn', device: 'fc', effect: 'pl' };
  for (const slot of TF_SCHEMA) {
    const rows = (spec.items[slot] || []).slice();
    /* 고증판(plain)에는 할로윈 장소 · 사탕 소품을 붙이지 않는다. */
    if (slot === 'effect' && !spec.plain) rows.unshift(...TF_PLACES);
    if (slot === 'weapon' && !spec.plain) rows.push(...TF_HELD);
    if (slot === 'weapon' && TF_SKULL_IDS.has(id)) rows.push(...TF_SKULLS);
    if (slot === 'headwear' && TF_CROWNS[id]) rows.push(...TF_CROWNS[id].map(r => r.slice(0, 5)));
    if (slot === 'accessories' && TF_HEART_IDS.has(id)) rows.push(...TF_HEARTS);
    const list = [];
    if (slot !== 'garment' && slot !== 'accessories') list.push({ id: `${id}-none-${slot}`, t: 'None', k: '없음', p: '' });
    keyed[slot] = {};
    for (const [key, t, k, p, opt] of rows) {
      const it = { id: `${id}-${AB[slot]}-${key}`, t, k, p, ...tfOpts(opt) };
      list.push(it);
      keyed[slot][key] = it;
    }
    slots[slot] = list;
  }
  const ref = (slot, key) => {
    if (key === 'none') return `${id}-none-${slot}`;
    if (!keyed[slot][key]) console.warn(`[taffy] ${id}: ${slot} 에 '${key}' 없음`);
    return `${id}-${AB[slot]}-${key}`;
  };
  const looks = spec.looks && spec.looks.length ? spec.looks : [['any', '', {}]];
  const recipes = looks.map(([key, opt, sl]) => {
    const r = { id: `${id}-${key}`, weight: 1, maxAccessories: 2, ...tfOpts(opt) };
    for (const [name, val] of Object.entries(sl || {})) {
      const keys = String(val).split(/\s+/).filter(Boolean);
      if (name.startsWith('-')) {
        const slot = name.slice(1);
        const drop = new Set(keys.map(k => ref(slot, k)));
        r[slot] = slots[slot].filter(it => !drop.has(it.id)).map(it => it.id);
      } else {
        r[name] = keys.map(k => ref(name, k));
      }
    }
    return r;
  });
  const need = spec.need ? Object.fromEntries(Object.entries(spec.need).map(([sl, v]) => [sl, String(v).trim() ? String(v).trim().split(/\s+/).map(k => ref(sl, k)) : []])) : undefined;
  if (need?.headwear?.length) for (const r of TF_CROWNS[id] || []) if (r[5]) need.headwear.push(ref('headwear', r[0]));
  return { id, label, labelKo, years: '', callNo, need, plain: !!spec.plain, tag: spec.tag, tagReal: spec.tagReal, tagM: spec.tagM, tagRealM: spec.tagRealM, colors: tfExpandColors(spec.colors), recipes, slots };
}

function collection(id, label, volume, range, colors, periods) {
  return {
    id, label, volume, range,
    selectionRules: TF_RULES,
    slotLabels: TF_SLOT_LABELS,
    schemas: { feminine: TF_SCHEMA, masculine: TF_SCHEMA, neutral: TF_SCHEMA },
    pools: { colors: tfExpandColors(colors), ...TF_SHOTS },
    periods,
  };
}

/* ═══════════════════════════════════════════════════════════════════
 * MONSTER MASH — 고전 몬스터 분장 15
 * ═══════════════════════════════════════════════════════════════════ */
const monster = collection('monster', 'MONSTER MASH', 'PA·TFY·I', 'classic monsters',
  ['black', 'deep purple', 'midnight blue', 'crimson', 'bone white', 'forest green', 'burnt orange', 'charcoal'],
  [

  /* ─── M-01 마녀 ─── */
  costume('witch', 'Witch', '마녀', 'M-01', {
    tag: 'halloween costume, witch costume', tagReal: 'witch, halloween night',
    tagM: 'halloween costume, warlock costume', tagRealM: 'warlock, halloween night',
    colors: ['black', 'deep purple', 'midnight blue', 'forest green', 'burnt orange', 'plum'],
    need: { headwear: '', weapon: 'hm-broom broom wand book cauldron staff fly' },
    items: {
      garment: [
        ['hm-dress', 'Hand-sewn witch robe', '손수 만든 마녀 로브', 'hand-sewn witch robe, pointed sleeves, gathered skirt, felt stars on the hem', 'f0 F0 x01 gf'],
        ['hm-tulle', 'Layered witch dress', '겹치마 마녀 원피스', 'hand-sewn witch dress, fitted bodice, layered tulle skirt, pointed cuffs', 'f0 F0 gf'],
        ['hm-m', 'Hand-sewn warlock robe', '손수 만든 마법사 로브', 'hand-sewn warlock robe, wide pointed sleeves, belted waist, patched hem', 'f0 F0 gm'],
        ['pt-long', 'Long witch dress', '긴 마녀 원피스', 'witch dress, long sleeves, ankle length skirt, jagged hem', 'f1 F1 x0 gf v:witch-wd'],
        ['pt-knee', 'Knee-length witch dress', '무릎 길이 마녀 원피스', 'witch dress, knee length, handkerchief hem, lace-up bodice', 'f1 F1 x1 gf v:witch-wd'],
        ['pt-mini', 'Corset mini witch dress', '코르셋 미니 마녀 원피스', 'witch costume, corset mini dress, off-shoulder, short ruffled skirt', 'f1 F1 x2 gf n:low v:witch-wd'],
        ['pt-m', 'Warlock robe', '마법사 로브', 'warlock costume, long robe, high collar', 'f1 F1 x01 gm n:high'],
        ['pt-m2', 'Sleeveless warlock robe', '민소매 마법사 로브', 'warlock costume, sleeveless robe, deep v neckline', 'f1 F1 x2 gm n:low'],
        ['ed-velvet', 'Velvet witch gown', '벨벳 마녀 드레스', 'velvet witch gown, bell sleeves, fitted bodice, sweeping train', 'f2 x0 gf v:witch-wg'],
        ['ed-lace', 'Lace-sleeved witch dress', '레이스 소매 마녀 드레스', 'witch dress, sheer lace sleeves, layered chiffon skirt, corset bodice', 'f2 x1 gf v:witch-wg'],
        ['ed-slit', 'Slit witch gown', '슬릿 마녀 드레스', 'witch gown, plunging neckline, high slit skirt, corset bodice', 'f2 x2 gf n:low v:witch-wg'],
        ['ed-dark', 'High-collared dark robe', '높은 깃의 검은 로브', 'high collared black robe, long sleeves, flowing hem', 'f2 x01 gf n:high'],
        ['ed-m', 'Long coat with moon embroidery', '달 자수 롱코트', 'tailored long coat, high collar, embroidered moons', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open silk shirt and long coat', '풀어 헤친 실크 셔츠와 롱코트', 'unbuttoned silk shirt, high waisted trousers, long coat', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['rope', 'Rope belt', '밧줄 허리띠', 'rope belt', 'F1'],
        ['sash', 'Satin sash', '새틴 허리끈', 'satin sash tied at the waist'],
        ['corset', 'Lace-up corset belt', '끈 코르셋 벨트', 'lace-up corset belt', 'x12'],
        ['pouches', 'Belt with herb pouches', '약초 주머니 벨트', 'leather belt with herb pouches and small vials', 'f1'],
        ['underbust', 'Underbust corset', '언더버스트 코르셋', 'underbust corset, silver buckles', 'f2 x12 gf'],
      ],
      foundation: [
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'gf'],
        ['tights', 'Opaque tights', '불투명 타이츠', 'opaque black tights', 'x01 gf'],
        ['thigh', 'Thighhighs', '사이하이', 'thighhighs', 'x12 gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['choker', 'Crescent moon choker', '초승달 초커', 'velvet choker, crescent moon charm'],
        ['ruff', 'Ruffled collar', '러플 깃', 'ruffled collar', 'f1 x01 an:low+high'],
        ['pendant', 'Crystal pendant', '수정 펜던트', 'crystal pendant', 'f2'],
      ],
      outer: [
        ['hm-cape', 'Felt cape', '펠트 망토', 'felt cape tied at the neck', 'F0'],
        ['cape', 'Hooded cape', '후드 망토', 'hooded cape', 'f1'],
        ['capelet', 'Star print capelet', '별무늬 케이플릿', 'short capelet, star print', 'f1 x12'],
        ['cloak', 'Velvet cloak', '벨벳 망토', 'long velvet cloak, standing collar', 'f2'],
        ['smoke', 'Cloak trailing smoke', '연기처럼 흩어지는 망토', 'cloak edge drifting into smoke', 'f3'],
      ],
      footwear: [
        ['ankle', 'Ankle boots', '앵클 부츠', 'ankle boots'],
        ['buckle', 'Pointed buckle shoes', '뾰족한 버클 구두', 'pointed buckle shoes', 'f1'],
        ['lace', 'Lace-up heeled boots', '굽 있는 끈 부츠', 'lace-up heeled boots', 'f1'],
        ['platform', 'Platform knee boots', '플랫폼 니하이 부츠', 'platform knee boots', 'f2 x12 gf'],
      ],
      headwear: [
        ['hm-hat', 'Hand-sewn pointed witch hat', '손수 만든 뾰족 마녀 모자', 'pointed witch hat with a stitched brim', 'F0'],
        ['hat', 'Pointed witch hat', '뾰족한 마녀 모자', 'pointed witch hat', 'f1'],
        ['mini', 'Mini witch hat', '미니 마녀 모자', 'mini witch hat clipped on', 'f1 x12 gf'],
        ['bighat', 'Wide brim witch hat', '챙 넓은 마녀 모자', 'wide brim witch hat, crooked tip, ribbon band', 'f2'],
        ['horns', 'Horned headdress', '뿔 머리쓰개', 'black horned headdress', 'f2'],
      ],
      accessories: [
        ['spider', 'Spider ring', '거미 반지', 'spider ring'],
        ['moon', 'Crescent earrings', '초승달 귀걸이', 'crescent moon earrings', 'f1'],
        ['gloves', 'Lace fingerless gloves', '레이스 손가락 없는 장갑', 'lace fingerless gloves'],
        ['opera', 'Long satin gloves', '긴 새틴 장갑', 'long satin gloves', 'f2 x12'],
        ['cat', 'Black cat companion', '곁에 있는 검은 고양이', 'a real black cat sitting beside the witch', 'f1 c:animal'],
        ['crow', 'Crow on the shoulder', '어깨 위 까마귀', 'a black crow perched on the shoulder', 'f1 c:animal'],
        ['sigils', 'Floating sigils', '떠다니는 문양', 'glowing sigils floating around the hands', 'f3'],
      ],
      weapon: [
        ['hm-broom', 'Kitchen broom', '부엌 빗자루', 'holding a kitchen broom', 'F0'],
        ['broom', 'Broomstick', '빗자루', 'holding a broomstick', 'f1'],
        ['wand', 'Crooked wand', '구부러진 지팡이', 'holding a crooked wooden wand', 'f1'],
        ['book', 'Spell book', '주문서', 'holding a spell book', 'f1'],
        ['cauldron', 'Stirring a cauldron', '솥 젓기', 'stirring a small cauldron', 'f2'],
        ['staff', 'Staff with a glowing orb', '빛나는 구슬 지팡이', 'holding a tall staff topped with a glowing orb', 'f2'],
        ['fly', 'Riding a broom', '빗자루 타고 날기', 'riding a broomstick through the air', 'f3'],
      ],
      device: [
        ['stars', 'Star cheek paint', '볼의 별 분장', 'small stars painted on the cheek'],
        ['moon', 'Crescent cheek paint', '볼의 초승달 분장', 'small crescent moon painted on the cheek'],
        ['eyes', 'Glowing violet eyes', '보랏빛으로 빛나는 눈', 'glowing violet eyes', 'f3'],
      ],
      effect: [
        ['moon-sky', 'Across a full moon', '보름달을 가로질러', 'night sky, silhouette against a huge full moon', 'f3'],
        ['brew', 'Bubbling cauldron', '끓어오르는 솥', 'dark cottage, green smoke curling from a bubbling cauldron', 'f3'],
      ],
    },
    looks: [
      ['classic', 'w8', { '-garment': 'ed-dark', '-headwear': 'horns', '-weapon': 'staff' }],
      ['dark', 'f2 x01 gf w2', { garment: 'ed-dark', headwear: 'horns', outer: 'cloak smoke none', weapon: 'staff wand none', footwear: 'lace ankle' }],
    ],
  }),

  /* ─── M-02 뱀파이어 ─── */
  costume('vampire', 'Vampire', '뱀파이어', 'M-02', {
    tag: 'halloween costume, vampire costume', tagReal: 'vampire, halloween night',
    colors: ['black', 'crimson', 'burgundy', 'wine', 'midnight blue', 'ivory'],
    need: { outer: '' },
    items: {
      garment: [
        ['hm-f', 'Dress with a ribbon sash', '리본 허리 원피스', 'plain long dress, ribbon tied at the waist', 'f0 F0 gf'],
        ['hm-m', 'White shirt and dark trousers', '흰 셔츠와 검은 바지', 'white button shirt, dark trousers', 'f0 F0'],
        ['pt-long', 'Long gothic dress', '긴 고딕 원피스', 'vampire costume, long gothic dress, high neck, lace cuffs', 'f1 F1 x0 gf n:high v:vampire-vd'],
        ['pt-velvet', 'Velvet dress', '벨벳 원피스', 'vampire costume, velvet dress, square neckline, lace trim', 'f1 F1 x1 gf n:own v:vampire-vd'],
        ['pt-mini', 'Corset mini dress', '코르셋 미니 원피스', 'vampire costume, corset mini dress, sweetheart neckline, lace hem', 'f1 F1 x2 gf n:low v:vampire-vd'],
        ['pt-m', 'Jabot shirt and brocade vest', '자보 셔츠와 브로케이드 조끼', 'vampire costume, ruffled shirt, brocade vest, black trousers', 'f1 F1 x01 gm n:own'],
        ['pt-m2', 'Unbuttoned ruffled shirt', '풀어 헤친 러플 셔츠', 'vampire costume, unbuttoned ruffled shirt, fitted trousers', 'f1 F1 x2 gm n:low'],
        ['ed-mourn', 'Mourning gown', '상복풍 드레스', 'mourning gown, high lace collar, leg-of-mutton sleeves', 'f2 x0 gf n:high'],
        ['ed-off', 'Off-shoulder velvet gown', '오프숄더 벨벳 드레스', 'off-shoulder velvet gown, long train', 'f2 x1 gf n:low'],
        ['ed-slit', 'Plunging velvet gown', '깊게 파인 벨벳 드레스', 'velvet gown, plunging neckline, thigh slit', 'f2 x2 gf n:low'],
        ['ed-m', 'Tailcoat and brocade waistcoat', '연미복과 브로케이드 조끼', 'tailcoat, brocade waistcoat, high collar shirt', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open silk shirt and tailcoat', '풀어 헤친 실크 셔츠와 연미복', 'open-front silk shirt, long tailcoat', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['corset', 'Underbust corset', '언더버스트 코르셋', 'underbust corset', 'x12 gf'],
        ['sash', 'Satin sash', '새틴 허리끈', 'satin sash'],
        ['chain', 'Studded belt', '징 벨트', 'studded belt', 'f1'],
      ],
      foundation: [
        ['tights', 'Opaque tights', '불투명 타이츠', 'opaque black tights', 'x01 gf'],
        ['seam', 'Seamed stockings', '심 스타킹', 'seamed stockings', 'x12 gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['jabot', 'Lace jabot', '레이스 자보', 'lace jabot', 'an:low'],
        ['choker', 'Lace choker with a red stone', '붉은 보석 레이스 초커', 'black lace choker, red stone'],
        ['cameo', 'Cameo choker', '카메오 초커', 'cameo choker', 'f1'],
        ['cravat', 'Silk cravat', '실크 크라바트', 'silk cravat', 'f2 gm an:low'],
      ],
      outer: [
        ['hm-cape', 'Satin cape', '새틴 망토', 'satin cape, red lining', 'F0'],
        ['cape', 'High-collared cape', '높은 깃 망토', 'high collar cape, red lining', 'f1'],
        ['cloak', 'Velvet cloak', '벨벳 망토', 'floor length velvet cloak, standing collar', 'f2'],
        ['bats', 'Cape ending in bat wings', '박쥐 날개로 갈라지는 망토', 'cape edge splitting into bat wings', 'f3'],
      ],
      footwear: [
        ['dress', 'Dress shoes', '구두', 'black dress shoes'],
        ['buckle', 'Buckled heels', '버클 힐', 'buckled heels', 'f1 gf'],
        ['victorian', 'Victorian boots', '빅토리안 부츠', 'lace-up victorian boots', 'f1'],
        ['platform', 'Platform heels', '플랫폼 힐', 'platform heels', 'f1 x2 gf'],
        ['riding', 'Tall leather boots', '가죽 롱부츠', 'tall leather boots', 'f2 gm'],
      ],
      headwear: [
        ['headpiece', 'Lace headpiece', '레이스 머리 장식', 'small lace headpiece', 'f1 gf'],
        ['rose', 'Black rose hair clip', '검은 장미 머리핀', 'black rose hair clip', 'gf'],
        ['tophat', 'Top hat', '실크해트', 'top hat', 'f2 gm'],
        ['crown', 'Thorn crown', '가시 왕관', 'thin crown of silver thorns', 'f2'],
      ],
      accessories: [
        ['ring', 'Signet ring', '인장 반지', 'signet ring'],
        ['gloves', 'Lace gloves', '레이스 장갑', 'black lace gloves', 'gf'],
        ['watch', 'Pocket watch', '회중시계', 'pocket watch', 'f1 gm'],
        ['brooch', 'Rose brooch', '장미 브로치', 'red rose brooch'],
        ['flock', 'Bats circling', '맴도는 박쥐 떼', 'bats circling overhead', 'f3 c:animal'],
      ],
      weapon: [
        ['rose', 'Red rose', '붉은 장미', 'holding a red rose'],
        ['goblet', 'Wine goblet', '와인 잔', 'holding a wine goblet', 'f1'],
        ['fan', 'Lace fan', '레이스 부채', 'holding a black lace fan', 'f1 gf'],
        ['candelabra', 'Candelabra', '촛대', 'holding a candelabra', 'f2'],
      ],
      device: [
        ['hm-fangs', 'Plastic fangs', '플라스틱 송곳니', 'plastic vampire fangs', 'F0'],
        ['fangs', 'Fangs', '송곳니', 'fangs', 'f1'],
        ['lenses', 'Red contact lenses', '빨간 렌즈', 'red eyes', 'f1'],
        ['glow', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes, fangs', 'f3'],
      ],
      effect: [
        ['balcony', 'Castle balcony', '고성의 발코니', 'gothic castle balcony, red moon', 'f3'],
        ['ballroom', 'Abandoned ballroom', '버려진 무도회장', 'abandoned ballroom, dusty chandelier, candlelight', 'f3'],
      ],
    },
  }),

  /* ─── M-03 미라 ─── */
  costume('mummy', 'Mummy', '미라', 'M-03', {
    tag: 'halloween costume, mummy costume', tagReal: 'mummy, halloween night',
    colors: ['bone white', 'faded linen', 'sand', 'sepia', 'ivory'],
    items: {
      garment: [
        ['hm-sheet', 'Torn sheet strips', '찢은 이불 천 감기', 'old white sheets torn into strips and wrapped around the body', 'f0 F0'],
        ['hm-tp', 'Toilet paper wrap', '휴지로 감은 분장', 'toilet paper wrapped around the body, loose ends', 'f0 F0 x01'],
        ['pt-suit', 'Bandage jumpsuit', '붕대 점프슈트', 'mummy costume, bandage wrapped jumpsuit', 'f1 F1 x01'],
        ['pt-dress', 'Bandage dress', '붕대 원피스', 'mummy costume, bandage wrapped dress, knee length', 'f1 F1 x1 gf v:mummy-md'],
        ['pt-mini', 'Bandage bandeau and mini skirt', '붕대 반도와 미니스커트', 'mummy costume, bandage wrapped bandeau top, bandage mini skirt, midriff', 'f1 F1 x2 gf n:low v:mummy-md'],
        ['pt-m2', 'Bandage wrapped torso', '붕대 감은 상체', 'mummy costume, bandage wrapped torso, loose linen trousers', 'f1 F1 x2 gm'],
        ['ed-gown', 'Bandage-wrapped linen gown', '붕대 감은 리넨 드레스', 'linen gown wrapped in bandages, long draped skirt', 'f2 x0 gf'],
        ['ed-mermaid', 'Bandage mermaid gown', '붕대 머메이드 드레스', 'bandage wrapped mermaid gown, gold trim', 'f2 x1 gf'],
        ['ed-body', 'Bandage bodysuit', '붕대 보디수트', 'bandage bodysuit, sheer linen panels', 'f2 x2 gf c:bodysuit'],
        ['ed-m', 'Bandaged linen robe', '붕대 감은 리넨 로브', 'linen robe wrapped in bandages, sash', 'f2 x01 gm'],
        ['ed-m2', 'Pleated linen kilt', '주름 리넨 킬트', 'bandage wrapped torso, pleated linen kilt', 'f2 x2 gm'],
      ],
      structure: [
        ['trail', 'Trailing bandage', '허리에서 늘어진 붕대', 'loose trailing bandage at the waist'],
        ['scarab', 'Scarab belt', '스카라베 벨트', 'gold scarab belt', 'f2'],
      ],
      foundation: [
        ['legs', 'Bandaged legs', '붕대 감은 다리', 'bandage wrapped legs'],
        ['thigh', 'Bandage leg wraps to the thigh', '허벅지까지 감은 붕대', 'bandage leg wraps ending at the thigh', 'x2'],
      ],
      neckwear: [
        ['wrap', 'Bandaged neck', '붕대 감은 목', 'bandage wrapped neck', 'an:low'],
        ['collar', 'Beaded broad collar', '구슬 넓은 깃', 'wide beaded collar', 'f2'],
      ],
      outer: [
        ['shawl', 'Tattered linen shawl', '해진 리넨 숄', 'tattered linen shawl', 'f1'],
        ['veil', 'Sheer linen drape', '얇은 리넨 드레이프', 'sheer linen drape over the shoulders', 'f2'],
      ],
      footwear: [
        ['feet', 'Bandaged feet', '붕대 감은 발', 'bandage wrapped feet'],
        ['flats', 'Linen flats', '리넨 플랫슈즈', 'linen wrapped flat shoes'],
        ['sandals', 'Gold sandals', '금색 샌들', 'gold sandals', 'f2'],
      ],
      headwear: [
        ['wrap', 'Bandage head wrap', '붕대 머리 감기', 'bandage head wrap, face showing'],
        ['circlet', 'Scarab circlet', '스카라베 머리띠', 'gold scarab circlet', 'f2'],
        ['bow', 'Bandage bow', '붕대 리본', 'bandage tied in a bow on the head', 'f1 gf'],
      ],
      accessories: [
        ['ends', 'Loose bandage ends', '풀린 붕대 끝', 'loose bandage ends trailing'],
        ['amulet', 'Scarab amulet', '스카라베 부적', 'scarab amulet', 'f1'],
        ['cuffs', 'Gold arm cuffs', '금색 팔찌', 'gold arm cuffs', 'f2'],
        ['sand', 'Sand drifting from the wraps', '붕대에서 흩날리는 모래', 'sand drifting from the bandages', 'f3'],
        ['lift', 'Bandages lifting in the air', '허공에 떠오르는 붕대', 'bandages lifting in a phantom wind', 'f3'],
      ],
      weapon: [
        ['walk', 'Mummy walk', '미라 걸음', 'arms outstretched in a mummy walk', 'F1'],
        ['roll', 'Roll of bandage', '붕대 두루마리', 'holding a roll of bandage', 'F1'],
        ['ankh', 'Golden ankh', '금색 앙크', 'holding a golden ankh', 'f2'],
        ['jar', 'Canopic jar', '카노푸스 단지', 'holding a painted canopic jar', 'f2'],
      ],
      device: [
        ['smudge', 'Dark smudges around the eyes', '눈가의 어두운 분장', 'dark smudges around the eyes'],
        ['oneeye', 'Bandage over one eye', '한쪽 눈 붕대', 'bandage covering one eye', 'f1'],
        ['glow', 'Glowing eyes between the wraps', '붕대 사이로 빛나는 눈', 'glowing eyes between the bandages', 'f3'],
      ],
      effect: [
        ['tomb', 'Torchlit tomb', '횃불 켠 무덤 방', 'torchlit pyramid tomb, hieroglyph walls', 'f3'],
        ['dunes', 'Desert night', '사막의 밤', 'desert dunes at night, swirling sand', 'f3'],
      ],
    },
  }),

  /* ─── M-04 천 유령 ─── */
  costume('ghost', 'Sheet Ghost', '천 뒤집어쓴 유령', 'M-04', {
    tag: 'halloween costume, ghost costume', tagReal: 'ghost, halloween night',
    colors: ['white', 'ivory', 'pastel pink', 'lavender', 'mint', 'grey'],
    items: {
      garment: [
        ['hm-sheet', 'Bedsheet ghost', '이불 유령', 'white bedsheet ghost costume, cut out eye holes, covering the whole body', 'f0 F1 x01 c:mask skip:headwear+neckwear+structure+outer+foundation+device'],
        ['hm-hoodie', 'Ghost hoodie', '유령 후드티', 'white hooded sweatshirt, felt ghost eyes on the hood, white leggings', 'f0 F0'],
        ['pt-robe', 'Wavy-hem hooded robe', '물결 밑단 후드 로브', 'ghost costume, long white hooded robe, wavy hem, face showing', 'f1 F1 x0 v:ghost-gd'],
        ['pt-tunic', 'Ragged-sleeve tunic dress', '해진 소매 튜닉 원피스', 'ghost costume, white tunic dress, ragged sleeves', 'f1 F1 x1 gf v:ghost-gd'],
        ['pt-poncho', 'Jagged-hem hooded poncho', '삐죽한 밑단 후드 판초', 'ghost costume, white hooded poncho, jagged hem', 'f1 F1 x12 gm'],
        ['pt-slip', 'Sheer slip dress', '비치는 슬립 원피스', 'ghost costume, white slip dress, sheer ragged sleeves, short hem', 'f1 F1 x2 gf n:low v:ghost-gd'],
        ['ed-chiffon', 'Chiffon gown', '시폰 드레스', 'flowing white chiffon gown, trailing sleeves', 'f2 x0 gf v:ghost-ge'],
        ['ed-organza', 'Tattered organza dress', '해진 오간자 원피스', 'layered organza dress, tattered hem', 'f2 x1 gf v:ghost-ge'],
        ['ed-slip', 'Sheer chiffon slip', '얇은 시폰 슬립', 'sheer chiffon slip dress, ragged hem', 'f2 x2 gf n:low v:ghost-ge'],
        ['ed-m', 'Shroud coat', '수의 같은 코트', 'long white shroud coat, tattered hem', 'f2 gm'],
      ],
      structure: [
        ['ribbon', 'Ribbon at the waist', '허리 리본', 'ribbon tied at the waist', 'gf'],
        ['cord', 'Thin cord belt', '가는 끈 허리띠', 'thin cord belt'],
      ],
      foundation: [
        ['tights', 'White tights', '흰 타이츠', 'white tights', 'x01 gf'],
        ['thigh', 'White thighhighs', '흰 사이하이', 'white thighhighs', 'x12 gf'],
      ],
      neckwear: [
        ['lace', 'Old lace collar', '낡은 레이스 깃', 'old fashioned lace collar', 'f1 an:low+own'],
        ['chain', 'Faded neck ribbon', '목에 맨 바랜 리본', 'faded ribbon tied at the neck', 'f1'],
      ],
      outer: [
        ['veilcape', 'Sheer veil cape', '얇은 베일 망토', 'sheer white veil cape', 'f1'],
        ['shroud', 'Translucent shroud', '반투명 수의', 'translucent trailing shroud', 'f2'],
      ],
      footwear: [
        ['sneakers', 'White sneakers', '흰 운동화', 'white sneakers', 'F1'],
        ['flats', 'White ballet flats', '흰 발레 플랫', 'white ballet flats', 'gf'],
        ['bare', 'Barefoot', '맨발', 'barefoot', 'f2'],
      ],
      headwear: [
        ['hood', 'Hood with felt eyes', '펠트 눈이 달린 후드', 'ghost hood with felt eyes', 'F1'],
        ['bow', 'White bow', '흰 리본', 'white hair bow', 'gf'],
        ['clip', 'Little ghost hair clip', '작은 유령 머리핀', 'small ghost hair clip', 'f1 gf'],
        ['veil', 'Sheer veil over the head', '머리에 드리운 얇은 베일', 'sheer white veil draped over the head, face visible', 'f2'],
      ],
      accessories: [
        ['chains', 'Tattered ribbons on the shoulders', '어깨에 걸친 해진 리본', 'tattered ribbons draped over the shoulders', 'f1'],
        ['glow', 'Glow stick bracelets', '야광 팔찌', 'glow stick bracelets', 'F1'],
        ['gloves', 'Faded lace gloves', '바랜 레이스 장갑', 'faded lace gloves', 'f2'],
        ['mist', 'Hem dissolving into mist', '안개로 흩어지는 밑단', 'hem dissolving into mist', 'f3'],
      ],
      weapon: [
        ['boo', 'Boo sign', 'BOO 팻말', 'holding a painted wooden BOO sign', 'F1'],
        ['candle', 'Candle', '양초', 'holding a lit candle', 'f1'],
        ['lantern', 'Old lantern', '낡은 랜턴', 'holding an old lantern', 'f2'],
      ],
      device: [
        ['circles', 'Painted dark circles', '눈 밑에 그린 다크서클', 'painted dark circles under the eyes'],
        ['white', 'White face paint', '흰 얼굴 분장', 'white face paint'],
        ['glow', 'Pale glow on the face', '얼굴에 어린 희미한 빛', 'faint pale glow on the face', 'f3'],
      ],
      effect: [
        ['hall', 'Moonlit hallway', '달빛 든 복도', 'abandoned victorian hallway, moonlight through tall windows', 'f3'],
        ['lawn', 'Foggy lawn', '안개 낀 잔디밭', 'floating above a foggy lawn', 'f3'],
      ],
    },
    looks: [
      ['sheet', 'F1 x01 w2', { garment: 'hm-sheet', weapon: 'boo _bucket _bag none' }],
      ['robe', 'w6', { '-garment': 'hm-sheet' }],
    ],
  }),

  /* ─── M-05 늑대인간 ─── */
  costume('werewolf', 'Werewolf', '늑대인간', 'M-05', {
    tag: 'halloween costume, werewolf costume', tagReal: 'werewolf costume, halloween night',
    colors: ['brown', 'grey', 'charcoal', 'tan', 'red', 'chocolate brown'],
    need: { headwear: 'ears hood' },
    items: {
      garment: [
        ['hm-m', 'Torn flannel and ripped jeans', '찢은 플란넬과 찢은 청바지', 'torn flannel shirt, ripped jeans, faux fur patches sewn on', 'f0 F0'],
        ['hm-f', 'Hoodie with faux fur trim', '인조 털 트림 후드티', 'hoodie with faux fur trim, ripped leggings', 'f0 F0 gf'],
        ['pt-suit', 'Faux fur jumpsuit', '인조 털 점프슈트', 'werewolf costume, faux fur jumpsuit', 'f1 F1 x0'],
        ['pt-dress', 'Ripped flannel shirt dress', '찢은 플란넬 셔츠 원피스', 'werewolf costume, ripped flannel shirt dress, faux fur collar', 'f1 F1 x1 gf n:own'],
        ['pt-crop', 'Faux fur crop top and denim shorts', '인조 털 크롭 탑과 데님 반바지', 'werewolf costume, faux fur crop top, ripped denim shorts', 'f1 F1 x2 gf'],
        ['pt-m', 'Torn plaid shirt and jeans', '찢은 체크 셔츠와 청바지', 'werewolf costume, torn plaid shirt, ripped jeans, faux fur cuffs', 'f1 F1 x01 gm'],
        ['pt-m2', 'Ripped sleeveless shirt', '찢은 민소매 셔츠', 'werewolf costume, ripped sleeveless shirt, torn jeans', 'f1 F1 x2 gm'],
        ['ed-shag', 'Shaggy faux fur dress', '북슬북슬한 인조 털 원피스', 'shaggy faux fur dress, long sleeves, leather belt', 'f2 x0 gf'],
        ['ed-flannel', 'Shredded flannel dress', '찢어진 플란넬 원피스', 'shredded flannel dress, leather harness', 'f2 x1 gf'],
        ['ed-bralette', 'Faux fur bralette and shredded skirt', '인조 털 브라렛과 찢어진 스커트', 'faux fur bralette, shredded mini skirt', 'f2 x2 gf n:low'],
        ['ed-m', 'Torn shirt and leather trousers', '찢어진 셔츠와 가죽 바지', 'torn button shirt, leather trousers', 'f2 x01 gm'],
        ['ed-m2', 'Shredded tank and leather trousers', '찢어진 민소매와 가죽 바지', 'shredded tank top, leather trousers', 'f2 x2 gm'],
      ],
      structure: [
        ['belt', 'Leather belt', '가죽 벨트', 'leather belt, silver buckle'],
        ['flannel', 'Flannel around the waist', '허리에 묶은 플란넬', 'flannel shirt tied around the waist', 'F1'],
        ['harness', 'Leather harness', '가죽 하네스', 'leather harness', 'f2 x12'],
      ],
      foundation: [
        ['socks', 'Wool socks', '울 양말', 'wool socks', 'F1 x01'],
        ['ripped', 'Ripped tights', '찢어진 타이츠', 'ripped tights', 'x12 gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['spiked', 'Spiked collar', '징 박힌 목걸이', 'spiked leather collar', 'f1'],
        ['moon', 'Silver moon pendant', '은빛 달 펜던트', 'silver moon pendant'],
      ],
      outer: [
        ['overshirt', 'Flannel overshirt', '플란넬 덧셔츠', 'flannel overshirt', 'F1'],
        ['stole', 'Faux fur stole', '인조 털 스톨', 'faux fur stole', 'f1'],
        ['coat', 'Shaggy faux fur coat', '북슬북슬한 인조 털 코트', 'shaggy faux fur coat', 'f2'],
      ],
      footwear: [
        ['muddy', 'Muddy boots', '진흙 묻은 부츠', 'muddy boots', 'F1'],
        ['combat', 'Combat boots', '컴뱃 부츠', 'combat boots'],
        ['fur', 'Faux fur boots', '인조 털 부츠', 'faux fur boots', 'f1'],
      ],
      headwear: [
        ['ears', 'Wolf ear headband', '늑대 귀 머리띠', 'wolf ear headband'],
        ['hood', 'Faux fur hood with ears', '귀 달린 인조 털 후드', 'faux fur hood with wolf ears', 'f1'],
        ['mask', 'Rubber wolf mask', '고무 늑대 가면', 'rubber wolf mask', 'f1 F1 c:mask'],
      ],
      accessories: [
        ['tail', 'Faux fur tail', '인조 털 꼬리', 'faux fur tail clipped to the belt'],
        ['claws', 'Claw gloves', '발톱 장갑', 'claw gloves', 'f1'],
        ['cuffs', 'Faux fur wrist cuffs', '인조 털 손목 커프', 'faux fur wrist cuffs'],
        ['chain', 'Leather wrist cuff', '가죽 손목 띠', 'leather cuff on the wrist', 'f2'],
        ['moonlight', 'Moonlight on the shoulders', '어깨에 내린 달빛', 'cold moonlight catching the fur trim', 'f3'],
      ],
      weapon: [
        ['howl', 'Howling', '하울링', 'howling at the sky', 'F1'],
        ['claw', 'Clawed hand raised', '발톱 든 손', 'clawed hand raised', 'f1'],
        ['hood', 'Torn red hood', '찢긴 빨간 두건', 'holding a torn red hood', 'f2'],
      ],
      device: [
        ['nose', 'Painted wolf nose', '그린 늑대 코', 'painted wolf nose and whiskers', 'F1'],
        ['fangs', 'Drawn-on fangs', '그린 송곳니', 'drawn-on fangs', 'F1'],
        ['fur', 'Painted fur on the cheekbones', '광대에 그린 털', 'faint fur painted along the cheekbones', 'f2'],
        ['eyes', 'Glowing yellow eyes', '노랗게 빛나는 눈', 'glowing yellow eyes', 'f3'],
      ],
      effect: [
        ['forest', 'Pine forest under the moon', '보름달 아래 소나무 숲', 'dark pine forest under a full moon', 'f3'],
        ['cliff', 'Moonlit cliff', '달빛 절벽', 'moonlit cliff, howling wind', 'f3'],
      ],
    },
  }),

  /* ─── M-06 해골 ─── */
  costume('skeleton', 'Skeleton', '해골', 'M-06', {
    tag: 'halloween costume, skeleton costume', tagReal: 'skeleton costume, halloween night',
    colors: ['black', 'charcoal', 'bone white', 'midnight blue'],
    items: {
      garment: [
        ['hm-paint', 'Bones painted on black', '검은 옷에 그린 뼈', 'black long sleeve top and leggings with bones painted in white', 'f0 F0'],
        ['pt-suit', 'Bone print jumpsuit', '뼈 무늬 점프슈트', 'skeleton costume, black jumpsuit, printed bones', 'f1 F1 x0 v:skeleton-sk'],
        ['pt-dress', 'Ribcage print dress', '갈비뼈 무늬 원피스', 'skeleton costume, black bodycon dress, printed ribcage', 'f1 F1 x1 gf v:skeleton-sk'],
        ['pt-body', 'Cutout bone bodysuit', '옆이 트인 뼈 보디수트', 'skeleton costume, black bodysuit, printed bones, cutout sides', 'f1 F1 x2 gf v:skeleton-sk c:bodysuit'],
        ['pt-m', 'Bone print hoodie and trousers', '뼈 무늬 후드와 바지', 'skeleton costume, bone print hoodie, bone print trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless ribcage shirt', '갈비뼈 무늬 민소매', 'skeleton costume, sleeveless ribcage print shirt, bone print leggings', 'f1 F1 x2 gm'],
        ['ed-tulle', 'Tulle gown with bone beading', '뼈 구슬 장식 튤 드레스', 'black tulle gown, beaded bone embroidery', 'f2 x0 gf v:skeleton-ske'],
        ['ed-sheer', 'Sheer ribcage panel dress', '갈비뼈 시스루 원피스', 'black dress, sheer ribcage panel, bone beading', 'f2 x1 gf v:skeleton-ske'],
        ['ed-mesh', 'Sheer bodysuit with bone appliqué', '뼈 아플리케 시스루 보디수트', 'black sheer bodysuit, bone appliqué', 'f2 x2 gf v:skeleton-ske c:bodysuit'],
        ['ed-m', 'Bone-embroidered velvet suit', '뼈 자수 벨벳 수트', 'black velvet suit, bone embroidery', 'f2 gm'],
      ],
      structure: [
        ['belt', 'Bone print belt', '뼈 무늬 벨트', 'bone print belt'],
        ['spine', 'Spine-shaped belt', '척추 모양 벨트', 'spine shaped belt', 'f2'],
      ],
      foundation: [
        ['leggings', 'Bone print leggings', '뼈 무늬 레깅스', 'bone print leggings', 'F1'],
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
        ['stock', 'Leg bone stockings', '다리뼈 무늬 스타킹', 'leg bone print stockings', 'x12 gf'],
      ],
      neckwear: [
        ['skull', 'Skull pendant', '해골 펜던트', 'skull pendant'],
        ['ribbon', 'Ribbon choker', '리본 초커', 'black ribbon choker'],
      ],
      outer: [
        ['hoodie', 'Skull-hood hoodie', '해골 후드 집업', 'zip hoodie, skull print hood', 'F1'],
        ['tail', 'Black tailcoat', '검은 연미복', 'black tailcoat', 'f2 gm'],
        ['capelet', 'Sheer black capelet', '얇은 검은 케이플릿', 'sheer black capelet', 'f2 gf'],
      ],
      footwear: [
        ['sneakers', 'Black sneakers', '검은 운동화', 'black sneakers', 'F1'],
        ['boots', 'Black boots', '검은 부츠', 'black boots'],
        ['heels', 'Black heels', '검은 힐', 'black heels', 'f1 gf'],
      ],
      headwear: [
        ['hood', 'Skull hood', '해골 후드', 'skull print hood', 'F1'],
        ['bow', 'Tiny black bow', '작은 검은 리본', 'tiny black bow', 'gf'],
        ['tophat', 'Black top hat', '검은 실크해트', 'black top hat', 'f2'],
        ['roses', 'Black rose crown', '검은 장미 화관', 'flower crown of black roses', 'f2 gf'],
      ],
      accessories: [
        ['hands', 'Skeleton hand gloves', '해골 손 장갑', 'skeleton hand gloves'],
        ['glow', 'Glow-in-the-dark bones', '야광 뼈 무늬', 'glow in the dark bone print'],
        ['rings', 'Skull rings', '해골 반지', 'skull rings', 'f1'],
        ['bones', 'Bones glowing faintly', '희미하게 빛나는 뼈 무늬', 'bone pattern glowing faintly in the dark', 'f3'],
      ],
      weapon: [
        ['skull', 'Toy skull', '장난감 해골', 'holding a toy skull'],
        ['bone', 'Fake bone', '가짜 뼈', 'holding a fake bone'],
        ['tamb', 'Tambourine', '탬버린', 'rattling a tambourine', 'f1'],
      ],
      device: [
        ['half', 'Half skull face paint', '반쪽 해골 분장', 'half skull face paint'],
        ['full', 'Skull face paint', '해골 얼굴 분장', 'skull face paint', 'f1'],
        ['mask', 'Skull mask', '해골 가면', 'skull mask', 'f1 c:mask'],
        ['glow', 'Glowing skull face paint', '빛나는 해골 분장', 'glowing skull face paint', 'f3'],
      ],
      effect: [
        ['dance', 'Dancing among headstones', '묘비 사이의 춤', 'dancing among glowing headstones', 'f3'],
      ],
    },
  }),

  /* ─── M-07 좀비 ─── */
  costume('zombie', 'Zombie', '좀비', 'M-07', {
    tag: 'halloween costume, zombie costume', tagReal: 'zombie costume, halloween night',
    colors: ['grey', 'olive', 'dusty grey', 'faded linen', 'moss green', 'khaki', 'pastel pink'],
    need: { device: 'grey stitch' },
    items: {
      garment: [
        ['hm-old', 'Ripped old clothes', '찢은 헌 옷', 'old clothes, ripped and dirt smudged', 'f0 F0'],
        ['pt-plain', 'Tattered shirt and trousers', '해진 셔츠와 바지', 'zombie costume, tattered shirt, ripped trousers', 'f1 F1 x0'],
        ['pt-prom', 'Zombie prom dress', '좀비 프롬 드레스', 'zombie prom queen costume, torn tulle dress', 'f1 F1 x1 gf'],
        ['pt-mini', 'Ripped mini dress', '찢어진 미니 원피스', 'zombie costume, ripped mini dress, torn sleeves', 'f1 F1 x2 gf'],
        ['pt-suit', 'Torn suit', '찢어진 수트', 'zombie costume, torn suit, crooked tie', 'f1 F1 x01 gm'],
        ['pt-m2', 'Shredded tank top', '찢어진 민소매', 'zombie costume, shredded tank top, torn jeans', 'f1 F1 x2 gm'],
        ['ed-vintage', 'Ruined vintage gown', '망가진 빈티지 드레스', 'ruined vintage gown, faded lace, frayed hem', 'f2 x0 gf'],
        ['ed-prom', 'Tattered prom gown', '해진 프롬 드레스', 'tattered prom gown, ripped tulle, crooked sash', 'f2 x1 gf'],
        ['ed-slip', 'Torn slip dress', '찢어진 슬립 원피스', 'torn slip dress, frayed hem', 'f2 x2 gf n:low'],
        ['ed-m', 'Dusty three-piece suit', '먼지 쌓인 쓰리피스', 'tattered three-piece suit, dusty', 'f2 x01 gm'],
        ['ed-m2', 'Ripped open shirt', '찢겨 열린 셔츠', 'ripped shirt hanging open, torn trousers', 'f2 x2 gm'],
      ],
      structure: [
        ['sash', 'Torn sash', '찢어진 띠', 'torn sash', 'gf'],
        ['belt', 'Crooked belt', '비뚤어진 벨트', 'crooked belt'],
      ],
      foundation: [
        ['ladder', 'Laddered tights', '올 나간 타이츠', 'laddered tights', 'x12 gf'],
        ['socks', 'Torn knee socks', '찢어진 니삭스', 'torn knee socks', 'x01'],
      ],
      neckwear: [
        ['tie', 'Loosened tie', '풀어진 넥타이', 'loosened tie', 'gm an:low'],
        ['lace', 'Torn lace collar', '찢어진 레이스 깃', 'torn lace collar', 'gf an:low+own'],
      ],
      outer: [
        ['cardigan', 'Muddy cardigan', '흙 묻은 카디건', 'muddy cardigan', 'F1'],
        ['blazer', 'Tattered blazer', '해진 블레이저', 'tattered blazer', 'f1'],
      ],
      footwear: [
        ['sneakers', 'Scuffed sneakers', '닳은 운동화', 'scuffed sneakers', 'F1'],
        ['mismatch', 'Mismatched shoes', '짝짝이 신발', 'mismatched shoes'],
        ['heels', 'Muddy heels', '흙 묻은 힐', 'muddy heels', 'f1 gf'],
        ['work', 'Worn work boots', '낡은 작업화', 'worn work boots'],
      ],
      headwear: [
        ['beanie', 'Beanie', '비니', 'beanie', 'F1'],
        ['tiara', 'Crooked tiara', '삐뚤어진 티아라', 'crooked tiara', 'f1 gf'],
        ['wilted', 'Wilted flower crown', '시든 화관', 'wilted flower crown', 'f2 gf'],
      ],
      accessories: [
        ['corsage', 'Wilted corsage', '시든 코르사주', 'wilted wrist corsage', 'f1 gf'],
        ['dirt', 'Dirt smudges', '흙 자국', 'dirt smudges on the arms and clothes'],
        ['sash', 'Prom queen sash', '프롬 퀸 어깨띠', 'faded prom queen sash', 'f1 gf'],
        ['moths', 'Moths around the shoulders', '어깨 주위의 나방', 'moths fluttering around the shoulders', 'f3 c:animal'],
      ],
      weapon: [
        ['shamble', 'Shambling walk', '비틀거리는 걸음', 'arms outstretched, shambling walk'],
        ['bouquet', 'Wilted bouquet', '시든 꽃다발', 'holding a wilted bouquet', 'f1'],
        ['teddy', 'Teddy bear', '곰인형', 'dragging a worn teddy bear', 'F1'],
      ],
      device: [
        ['grey', 'Grey face paint', '회색 얼굴 분장', 'grey face paint, dark circles'],
        ['stitch', 'Painted stitches', '그린 꿰맨 자국', 'painted stitches on the cheek'],
        ['lens', 'Cloudy contact lenses', '흐린 렌즈', 'cloudy white eyes', 'f1'],
        ['glow', 'Glowing green eyes', '초록으로 빛나는 눈', 'glowing green eyes', 'f3'],
      ],
      effect: [
        ['gate', 'Cemetery gate', '묘지 정문', 'foggy cemetery gate, iron fence', 'f3'],
        ['carnival', 'Abandoned carnival', '버려진 놀이공원', 'abandoned carnival at night, flickering bulbs', 'f3'],
      ],
    },
  }),

  /* ─── M-08 되살아난 괴물 ─── */
  costume('frank', 'Reanimated Monster', '되살아난 괴물', 'M-08', {
    tag: 'halloween costume, frankenstein costume', tagReal: 'frankenstein\'s monster costume, halloween night',
    colors: ['forest green', 'olive', 'charcoal', 'black', 'grey'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-blazer', 'Short-sleeved old blazer', '소매 짧은 헌 블레이저', 'oversized black blazer with sleeves too short, dark trousers', 'f0 F0'],
        ['pt-m', 'Too-short jacket and patched trousers', '짧은 재킷과 기운 바지', 'frankenstein costume, too-short black jacket, patched trousers', 'f1 F1 x01 gm'],
        ['pt-pinafore', 'Stitched pinafore dress', '꿰맨 피너포어 원피스', 'frankenstein costume, pinafore dress, stitched patches', 'f1 F1 x0 gf v:frank-fd'],
        ['pt-dress', 'Patched dress', '기운 원피스', 'frankenstein costume, patched dress, stitch print', 'f1 F1 x1 gf v:frank-fd'],
        ['pt-mini', 'Stitched corset mini dress', '꿰맨 코르셋 미니 원피스', 'frankenstein costume, corset mini dress, stitch details', 'f1 F1 x2 gf n:low v:frank-fd'],
        ['pt-m2', 'Sleeveless patched vest', '기운 민소매 조끼', 'frankenstein costume, sleeveless patched vest, torn trousers', 'f1 F1 x2 gm'],
        ['ed-coat', 'Square-shouldered wool coat', '어깨 각진 울 코트', 'oversized wool coat, stitched seams, square shoulders', 'f2 x01 gm'],
        ['ed-wool', 'Patchwork wool dress', '패치워크 울 원피스', 'patchwork wool dress, visible stitches', 'f2 x0 gf v:frank-fe'],
        ['ed-knee', 'Contrast-stitched patchwork dress', '대비 스티치 패치워크 원피스', 'patchwork dress, contrast stitching, knee length', 'f2 x1 gf v:frank-fe'],
        ['ed-leather', 'Patchwork leather mini dress', '패치워크 가죽 미니 원피스', 'patchwork leather mini dress, stitched seams', 'f2 x2 gf v:frank-fe'],
        ['ed-m2', 'Open patchwork vest', '열린 패치워크 조끼', 'open patchwork vest, stitched trousers', 'f2 x2 gm'],
      ],
      structure: [
        ['belt', 'Wide leather belt', '넓은 가죽 벨트', 'wide leather belt'],
        ['cable', 'Cable tied at the waist', '허리에 감은 전선', 'coiled cable tied at the waist', 'f2'],
      ],
      foundation: [
        ['tights', 'Grey tights', '회색 타이츠', 'grey tights', 'gf'],
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'x12 gf'],
      ],
      neckwear: [
        ['bolts', 'Costume neck bolts', '목 볼트 소품', 'costume neck bolts'],
      ],
      outer: [
        ['jacket', 'Too-short black jacket', '짧은 검은 재킷', 'too-short black jacket', 'f1'],
        ['coat', 'Long patched coat', '긴 기운 코트', 'long patched coat', 'f2'],
      ],
      footwear: [
        ['platform', 'Big platform boots', '큼직한 플랫폼 부츠', 'big platform boots'],
        ['heavy', 'Heavy black boots', '무거운 검은 부츠', 'heavy black boots'],
      ],
      headwear: [
        ['flat', 'Flat-top headpiece', '평평한 머리 소품', 'flat-top foam headpiece with stitches', 'F1'],
        ['clips', 'Bolt hair clips', '볼트 머리핀', 'bolt hair clips', 'gf'],
      ],
      accessories: [
        ['patches', 'Stitched sleeve patches', '소매에 꿰맨 천 조각', 'stitched patches on the sleeves'],
        ['brooch', 'Lightning bolt brooch', '번개 브로치', 'lightning bolt brooch', 'f1'],
        ['sparks', 'Sparks at the bolts', '볼트에서 튀는 불꽃', 'electric sparks crackling around the neck bolts', 'f3'],
      ],
      weapon: [
        ['daisies', 'Wilted daisies', '시든 데이지', 'holding a bouquet of wilted daisies', 'f1'],
        ['jar', 'Jar of glowing liquid', '빛나는 액체 병', 'holding a mason jar of glowing green liquid', 'f2'],
        ['arms', 'Stiff arms forward', '앞으로 뻗은 뻣뻣한 팔', 'stiff arms stretched forward', 'F1'],
      ],
      device: [
        ['green', 'Green face paint with stitches', '꿰맨 자국 초록 분장', 'green face paint, painted stitches on the forehead'],
        ['scar', 'Painted stitches on the cheek', '뺨에 그린 꿰맨 자국', 'painted stitches on the cheek'],
        ['spark', 'Sparks in the eyes', '눈에 튀는 불꽃', 'electric sparks in the eyes', 'f3'],
      ],
      effect: [
        ['lab', 'Laboratory with tesla coils', '테슬라 코일 실험실', 'gothic laboratory, tesla coils arcing', 'f3'],
        ['storm', 'Tower in a thunderstorm', '번개 치는 탑', 'castle tower in a thunderstorm, lightning', 'f3'],
      ],
    },
  }),

  /* ─── M-09 괴물의 신부 ─── */
  costume('bride', 'Monster\'s Bride', '괴물의 신부', 'M-09', {
    tag: 'halloween costume, bride of frankenstein costume', tagReal: 'bride of frankenstein costume, halloween night',
    tagM: 'halloween costume, monster groom costume', tagRealM: 'frankenstein\'s monster groom, halloween night',
    colors: ['white', 'ivory', 'bone white', 'grey'],
    need: { headwear: 'veil' },
    items: {
      garment: [
        ['hm-f', 'Nightgown with safety pins', '옷핀 꽂은 잠옷 원피스', 'white nightgown pinned with safety pins', 'f0 F0 gf'],
        ['hm-m', 'Old tuxedo jacket over a tee', '티셔츠 위 헌 턱시도 재킷', 'old tuxedo jacket over a t-shirt', 'f0 F0 gm'],
        ['pt-long', 'Long-sleeved white gown', '긴소매 흰 드레스', 'bride of frankenstein costume, long white gown, long sleeves', 'f1 F1 x0 gf v:bride-bd'],
        ['pt-ruffle', 'Ruffle-sleeved white gown', '러플 소매 흰 드레스', 'bride of frankenstein costume, white gown, ruffled sleeves', 'f1 F1 x1 gf v:bride-bd'],
        ['pt-mini', 'Corset mini wedding dress', '코르셋 미니 웨딩드레스', 'bride of frankenstein costume, white mini wedding dress, corset bodice', 'f1 F1 x2 gf n:low v:bride-bd'],
        ['pt-m', 'Patched tuxedo', '기운 턱시도', 'monster groom costume, patched tuxedo', 'f1 F1 gm'],
        ['ed-gauze', 'Gauze gown with bandage sleeves', '붕대 소매 거즈 드레스', 'flowing white gauze gown, bandage wrapped sleeves', 'f2 x0 gf'],
        ['ed-crepe', 'Draped crepe gown', '드레이프 크레이프 드레스', 'white crepe gown, draped bodice', 'f2 x1 gf'],
        ['ed-corset', 'Bandage corset gown', '붕대 코르셋 드레스', 'white bandage corset gown, high slit', 'f2 x2 gf n:low'],
        ['ed-m', 'Stitched tailcoat', '꿰맨 연미복', 'black tailcoat, stitched seams', 'f2 gm'],
      ],
      structure: [
        ['sash', 'Bandage sash', '붕대 허리띠', 'bandage wrapped sash'],
      ],
      foundation: [
        ['tights', 'White tights', '흰 타이츠', 'white tights', 'x01 gf'],
        ['stock', 'White stockings with garters', '가터 달린 흰 스타킹', 'white stockings, garter straps', 'x2 gf'],
      ],
      neckwear: [
        ['choker', 'Stitch scar choker', '꿰맨 자국 초커', 'stitched scar choker'],
        ['bow', 'Crooked bow tie', '삐뚤어진 보타이', 'crooked bow tie', 'gm'],
        ['bolts', 'Neck bolts', '목 볼트 소품', 'costume neck bolts', 'f1'],
      ],
      outer: [
        ['shawl', 'Bandage shawl', '붕대 숄', 'bandage wrapped shawl', 'f1 gf'],
      ],
      footwear: [
        ['flats', 'White flats', '흰 플랫슈즈', 'white flats', 'gf'],
        ['heels', 'White heels', '흰 힐', 'white heels', 'f1 gf'],
        ['boots', 'Black boots', '검은 부츠', 'black boots'],
      ],
      headwear: [
        ['veil', 'White wedding veil', '흰 면사포', 'white wedding veil'],
        ['bandage', 'Bandage headband', '붕대 머리띠', 'bandage headband'],
      ],
      accessories: [
        ['wrists', 'Bandaged wrists', '붕대 감은 손목', 'bandage wrapped wrists'],
        ['gloves', 'Lace gloves', '레이스 장갑', 'white lace gloves', 'f1 gf'],
        ['sparks', 'Crackling static', '튀는 정전기', 'static sparks crackling in the air', 'f3'],
      ],
      weapon: [
        ['bouquet', 'Wilted bridal bouquet', '시든 부케', 'holding a wilted bridal bouquet'],
        ['candelabra', 'Candelabra', '촛대', 'holding a candelabra', 'f2'],
        ['hand', 'Hand in hand', '손 맞잡기', 'reaching out a hand', 'f1'],
      ],
      device: [
        ['stitch', 'Stitches across the cheek', '뺨을 가로지르는 꿰맨 자국', 'painted stitches across the cheek'],
        ['pale', 'Pale face paint', '창백한 얼굴 분장', 'pale face paint'],
        ['spark', 'Electric eyes', '번쩍이는 눈', 'electric glint in the eyes', 'f3'],
      ],
      effect: [
        ['lab', 'Laboratory with tesla coils', '테슬라 코일 실험실', 'gothic laboratory, tesla coils arcing', 'f3'],
        ['altar', 'Lightning-lit hall', '번개 빛이 드는 홀', 'stone hall lit by lightning flashes', 'f3'],
      ],
    },
  }),

  /* ─── M-10 유령 신부 ─── */
  costume('ghostbride', 'Ghost Bride', '유령 신부', 'M-10', {
    tag: 'halloween costume, ghost bride costume', tagReal: 'ghost bride, halloween night',
    tagM: 'halloween costume, ghost groom costume', tagRealM: 'ghost groom, halloween night',
    colors: ['ivory', 'white', 'pearl white', 'dusty grey', 'lavender', 'faded linen'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Old dress with a curtain veil', '커튼 베일을 쓴 헌 원피스', 'old white dress, lace curtain worn as a veil', 'f0 F0 gf'],
        ['hm-m', 'Thrifted grey suit', '헌 회색 양복', 'thrifted grey suit, dusty', 'f0 F0 gm'],
        ['pt-long', 'Tattered long-sleeved wedding gown', '해진 긴소매 웨딩드레스', 'ghost bride costume, tattered wedding gown, long sleeves', 'f1 F1 x0 gf v:ghostbride-gb'],
        ['pt-off', 'Tattered off-shoulder wedding dress', '해진 오프숄더 웨딩드레스', 'ghost bride costume, tattered wedding dress, off-shoulder', 'f1 F1 x1 gf n:low v:ghostbride-gb'],
        ['pt-mini', 'Tattered mini wedding dress', '해진 미니 웨딩드레스', 'ghost bride costume, tattered mini wedding dress, corset bodice', 'f1 F1 x2 gf n:low v:ghostbride-gb'],
        ['pt-m', 'Tattered tailcoat', '해진 연미복', 'ghost groom costume, tattered tailcoat', 'f1 F1 gm'],
        ['ed-lace', 'Faded lace wedding gown with a frayed hem', '밑단 해진 바랜 레이스 웨딩드레스', 'faded lace wedding gown, frayed layered hem', 'f2 x0 gf v:ghostbride-gbe'],
        ['ed-silk', 'Tattered sheer-sleeved silk wedding gown', '해진 시스루 소매 실크 웨딩드레스', 'tattered silk wedding gown, sheer sleeves', 'f2 x1 gf v:ghostbride-gbe'],
        ['ed-slip', 'Torn silk wedding slip', '찢어진 실크 웨딩 슬립', 'torn silk wedding slip dress, sheer lace', 'f2 x2 gf n:low v:ghostbride-gbe'],
        ['ed-m', 'Faded tailcoat and waistcoat', '바랜 연미복과 조끼', 'faded tailcoat, dusty waistcoat', 'f2 gm'],
      ],
      structure: [
        ['ribbon', 'Faded ribbon sash', '바랜 리본 허리띠', 'faded satin ribbon sash', 'gf'],
      ],
      foundation: [
        ['tights', 'Ivory tights', '아이보리 타이츠', 'ivory tights', 'x01 gf'],
        ['lace', 'Lace stockings', '레이스 스타킹', 'lace stockings', 'x12 gf'],
      ],
      neckwear: [
        ['pearls', 'Pearl necklace', '진주 목걸이', 'pearl necklace'],
        ['cravat', 'Dusty cravat', '먼지 앉은 크라바트', 'dusty cravat', 'gm an:low'],
      ],
      outer: [
        ['shawl', 'Tattered lace shawl', '해진 레이스 숄', 'tattered lace shawl', 'f1 gf'],
      ],
      footwear: [
        ['heels', 'Old satin heels', '낡은 새틴 힐', 'old satin heels', 'gf'],
        ['bare', 'Barefoot', '맨발', 'barefoot', 'f2 gf'],
        ['shoes', 'Dusty dress shoes', '먼지 앉은 구두', 'dusty dress shoes', 'gm'],
      ],
      headwear: [
        ['veil', 'Tattered veil', '해진 면사포', 'tattered wedding veil', 'gf'],
        ['crown', 'Wilted flower crown', '시든 화관', 'wilted flower crown', 'gf'],
        ['tiara', 'Veil with a cracked tiara', '금 간 티아라와 면사포', 'lace veil, cracked tiara', 'f1 gf'],
        ['drift', 'Veil drifting in the air', '허공에 떠오른 면사포', 'veil drifting in the air', 'f3 gf'],
        ['tophat', 'Battered top hat', '찌그러진 실크해트', 'battered top hat', 'gm'],
      ],
      accessories: [
        ['gloves', 'Long lace gloves', '긴 레이스 장갑', 'long lace gloves', 'gf'],
        ['ribbon', 'Faded ribbon on the wrist', '손목의 바랜 리본', 'faded ribbon tied at the wrist'],
        ['ring', 'Old wedding ring', '낡은 결혼반지', 'old wedding ring'],
        ['butterflies', 'Blue butterflies', '맴도는 푸른 나비', 'blue butterflies circling', 'f3 c:animal'],
      ],
      weapon: [
        ['roses', 'Dead rose bouquet', '말라 버린 장미 부케', 'holding a dried rose bouquet'],
        ['ringbox', 'Ring box', '반지 상자', 'holding an open ring box', 'f1'],
        ['candle', 'Candle', '양초', 'holding a candle'],
      ],
      device: [
        ['pale', 'Pale grey face paint', '창백한 회색 분장', 'pale grey face paint'],
        ['circles', 'Dark circles around the eyes', '눈가의 어두운 그늘', 'dark circles around the eyes'],
        ['glow', 'Ghostly glow on the skin', '피부에 어린 푸른빛', 'faint blue glow on the face', 'f3'],
      ],
      effect: [
        ['chapel', 'Abandoned chapel', '버려진 예배당', 'abandoned chapel, moonlight through broken windows', 'f3'],
        ['path', 'Misty forest path', '안개 낀 숲길', 'misty forest path, twisted trees', 'f3'],
      ],
    },
  }),

  /* ─── M-11 사신 ─── */
  costume('reaper', 'Grim Reaper', '사신', 'M-11', {
    tag: 'halloween costume, grim reaper costume', tagReal: 'grim reaper, halloween night',
    colors: ['black', 'charcoal', 'grey'],
    need: { weapon: 'toy scythe lantern hourglass' },
    items: {
      garment: [
        ['hm-robe', 'Hooded bathrobe', '후드 달린 목욕 가운', 'black hooded bathrobe, belted', 'f0 F0'],
        ['pt-robe', 'Hooded robe', '후드 로브', 'grim reaper costume, black hooded robe, long sleeves', 'f1 F1 x0 v:reaper-rd'],
        ['pt-dress', 'Hooded knee dress', '무릎 길이 후드 원피스', 'grim reaper costume, black hooded dress, knee length', 'f1 F1 x1 gf v:reaper-rd'],
        ['pt-mini', 'Hooded mini dress', '후드 미니 원피스', 'grim reaper costume, black hooded mini dress, sheer sleeves', 'f1 F1 x2 gf v:reaper-rd'],
        ['pt-m', 'Hooded tunic and trousers', '후드 튜닉과 바지', 'grim reaper costume, black hooded tunic, black trousers', 'f1 F1 x1 gm'],
        ['pt-m2', 'Sleeveless hooded robe', '민소매 후드 로브', 'grim reaper costume, sleeveless hooded robe', 'f1 F1 x2 gm'],
        ['ed-robe', 'Heavy tattered hooded robe', '무겁고 해진 후드 로브', 'heavy black hooded robe, sweeping hem, tattered edges', 'f2 x0 v:reaper-re'],
        ['ed-chiffon', 'Draped chiffon hooded gown', '드레이프 시폰 후드 드레스', 'black chiffon hooded gown, draped', 'f2 x1 gf v:reaper-re'],
        ['ed-slit', 'Hooded slit gown', '슬릿 후드 드레스', 'black hooded gown, high slit', 'f2 x2 gf v:reaper-re'],
        ['ed-m', 'Hooded long coat', '후드 롱코트', 'black hooded long coat, layered hem', 'f2 x1 gm'],
        ['ed-m2', 'Open hooded robe', '앞이 열린 후드 로브', 'open black hooded robe, black trousers', 'f2 x2 gm'],
      ],
      structure: [
        ['chain', 'Studded belt', '징 벨트', 'studded belt'],
        ['cord', 'Rope cord', '밧줄 끈', 'knotted rope cord at the waist'],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['skull', 'Skull pendant', '해골 펜던트', 'skull pendant'],
      ],
      outer: [
        ['cloak', 'Tattered cloak', '해진 망토', 'tattered black cloak', 'f1'],
      ],
      footwear: [
        ['boots', 'Black boots', '검은 부츠', 'black boots'],
        ['heels', 'Black heeled boots', '검은 굽 부츠', 'black heeled boots', 'f1 gf'],
        ['bare', 'Barefoot', '맨발', 'barefoot', 'f3'],
      ],
      headwear: [
        ['hood', 'Hood pulled low', '푹 눌러쓴 후드', 'hood pulled low over the eyes', 'f1'],
      ],
      accessories: [
        ['hourglass', 'Hourglass on the belt', '허리의 모래시계', 'small hourglass hanging from the belt', 'f1'],
        ['hands', 'Skeleton hand gloves', '해골 손 장갑', 'skeleton hand gloves'],
        ['ravens', 'Crows on the shoulder', '어깨 위 까마귀', 'crow perched on the shoulder', 'f2 c:animal'],
        ['shadow', 'Robe hem melting into shadow', '그림자로 녹아드는 밑단', 'robe hem melting into shadow', 'f3'],
      ],
      weapon: [
        ['toy', 'Toy scythe', '장난감 낫', 'holding a toy scythe', 'F1'],
        ['scythe', 'Large scythe', '큰 낫', 'holding a large scythe', 'f2'],
        ['lantern', 'Lantern', '랜턴', 'holding a lantern', 'f1'],
        ['hourglass', 'Hourglass', '모래시계', 'holding an hourglass', 'f1'],
      ],
      device: [
        ['skull', 'Skull face paint', '해골 얼굴 분장', 'skull face paint'],
        ['shadow', 'Shadow face paint', '그림자 얼굴 분장', 'dark shadow face paint around the eyes'],
        ['mask', 'Skull mask', '해골 가면', 'skull mask', 'f1 c:mask'],
        ['glow', 'Eyes glowing under the hood', '후드 밑에서 빛나는 눈', 'eyes glowing under the hood', 'f3'],
      ],
      effect: [
        ['bridge', 'Misty bridge with crows', '까마귀 앉은 안개 다리', 'misty stone bridge, crows on the railing', 'f3'],
      ],
    },
  }),

  /* ─── M-12 악마 ─── */
  costume('devil', 'Devil', '악마', 'M-12', {
    tag: 'halloween costume, devil costume', tagReal: 'devil costume, halloween night',
    colors: ['red', 'crimson', 'black', 'scarlet', 'cherry red', 'hot pink'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-hoodie', 'Hoodie with felt horns', '펠트 뿔 달린 후드티', 'hoodie with felt devil horns sewn on the hood, sweatpants', 'f0 F0'],
        ['hm-f', 'Dress with tinsel trim', '반짝이 트림 원피스', 'plain dress, tinsel trim at the hem', 'f0 F0 gf'],
        ['pt-midi', 'Long-sleeved devil dress', '긴소매 악마 원피스', 'devil costume, long sleeve dress, midi length', 'f1 F1 x0 gf v:devil-dd'],
        ['pt-satin', 'Satin devil dress', '새틴 악마 원피스', 'devil costume, satin dress, knee length', 'f1 F1 x1 gf v:devil-dd'],
        ['pt-mini', 'Corset mini devil dress', '코르셋 미니 악마 원피스', 'devil costume, corset mini dress', 'f1 F1 x2 gf n:low v:devil-dd'],
        ['pt-m', 'Devil suit', '악마 정장', 'devil costume, suit, black shirt', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open satin shirt', '풀어 헤친 새틴 셔츠', 'devil costume, open satin shirt, black trousers', 'f1 F1 x2 gm n:low'],
        ['ed-velvet', 'High-neck velvet gown', '하이넥 벨벳 드레스', 'velvet gown, high neck, long sleeves', 'f2 x0 gf n:high'],
        ['ed-satin', 'Square-neck satin gown', '스퀘어넥 새틴 드레스', 'satin gown, square neckline', 'f2 x1 gf n:own'],
        ['ed-vinyl', 'Plunging vinyl mini dress', '깊게 파인 비닐 미니 원피스', 'vinyl mini dress, plunging neckline', 'f2 x2 gf n:low'],
        ['ed-m', 'Velvet suit', '벨벳 수트', 'velvet suit, silk shirt', 'f2 x01 gm'],
        ['ed-m2', 'Open silk shirt and leather trousers', '풀어 헤친 실크 셔츠와 가죽 바지', 'open silk shirt, leather trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['corset', 'Corset belt', '코르셋 벨트', 'corset belt', 'x12 gf'],
        ['chain', 'Studded belt', '징 벨트', 'studded belt'],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
        ['thigh', 'Thighhighs', '사이하이', 'thighhighs', 'x12 gf'],
        ['fishnet', 'Sheer red tights', '비치는 빨간 타이츠', 'sheer red tights', 'x2 gf'],
      ],
      neckwear: [
        ['choker', 'Ribbon choker', '리본 초커', 'red ribbon choker'],
        ['bow', 'Black bow tie', '검은 보타이', 'black bow tie', 'gm'],
      ],
      outer: [
        ['cape', 'Black cape with red lining', '안이 빨간 검은 망토', 'black cape, red lining', 'f1'],
        ['coat', 'Long coat', '롱코트', 'long tailored coat', 'f2'],
      ],
      footwear: [
        ['sneakers', 'Red sneakers', '빨간 운동화', 'red sneakers', 'F1'],
        ['heels', 'Red heels', '빨간 힐', 'red heels', 'f1 gf'],
        ['boots', 'Black boots', '검은 부츠', 'black boots'],
        ['patent', 'Patent platform heels', '에나멜 플랫폼 힐', 'patent platform heels', 'f2 x12 gf'],
      ],
      headwear: [
        ['horns', 'Devil horn headband', '악마 뿔 머리띠', 'devil horn headband'],
        ['glitter', 'Glitter devil horns', '반짝이 악마 뿔', 'glitter devil horns', 'f1'],
        ['curled', 'Curled horn headpiece', '말린 뿔 머리 장식', 'curled horn headpiece', 'f2'],
        ['ember', 'Horns glowing like embers', '불씨처럼 빛나는 뿔', 'horn headpiece glowing like embers', 'f3'],
      ],
      accessories: [
        ['tail', 'Pointed devil tail', '뾰족한 악마 꼬리', 'pointed devil tail'],
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings', 'f1'],
        ['bat', 'Bat companion', '곁에 있는 박쥐', 'a real small bat perched beside the devil', 'f1 c:animal'],
        ['gloves', 'Long satin gloves', '긴 새틴 장갑', 'long satin gloves', 'f2 x12'],
        ['flames', 'Flames at the fingertips', '손끝의 작은 불꽃', 'tiny flames flickering at the fingertips', 'f3'],
      ],
      weapon: [
        ['toy', 'Toy pitchfork', '장난감 삼지창', 'holding a toy pitchfork', 'F1'],
        ['trident', 'Gold trident', '금색 삼지창', 'holding a gold trident', 'f2'],
        ['apple', 'Red apple', '빨간 사과', 'holding a red apple', 'f1'],
      ],
      device: [
        ['flame', 'Small flame cheek paint', '볼의 작은 불꽃 분장', 'small flame painted on the cheek'],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
      effect: [
        ['lounge', 'Red neon lounge', '붉은 네온 라운지', 'velvet lounge, red neon glow', 'f2'],
        ['embers', 'Red smoke and embers', '붉은 연기와 불씨', 'red smoke, drifting embers', 'f3'],
      ],
    },
  }),

  /* ─── M-13 호박머리 ─── */
  costume('pumpkin', 'Pumpkin Head', '호박머리', 'M-13', {
    tag: 'halloween costume, pumpkin costume', tagReal: 'jack-o\'-lantern costume, halloween night',
    colors: ['pumpkin orange', 'burnt orange', 'black', 'forest green', 'amber'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-marker', 'Sweatshirt with a drawn face', '얼굴을 그린 맨투맨', 'sweatshirt with a jack-o\'-lantern face drawn in black marker', 'f0 F0'],
        ['hm-bag', 'Stuffed bag pumpkin', '봉투를 부풀린 호박', 'round pumpkin costume made from a stuffed plastic bag', 'f0 F0 x01'],
        ['pt-tunic', 'Padded pumpkin tunic', '둥글게 부푼 호박 튜닉', 'pumpkin costume, round padded tunic, leggings', 'f1 F1 x0'],
        ['pt-tutu', 'Tulle tutu dress', '튤 튜튜 원피스', 'pumpkin costume, tulle tutu dress, jack-o\'-lantern face', 'f1 F1 x1 gf'],
        ['pt-mini', 'Corset mini pumpkin dress', '코르셋 미니 호박 원피스', 'pumpkin costume, corset mini dress, ruffled skirt', 'f1 F1 x2 gf'],
        ['pt-m', 'Pumpkin print suit', '호박 무늬 정장', 'pumpkin costume, pumpkin print suit', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless vest and green trousers', '민소매 조끼와 초록 바지', 'pumpkin costume, sleeveless vest, green trousers', 'f1 F1 x2 gm'],
        ['ed-ball', 'Ribbed pumpkin ball gown', '골 진 호박 볼가운', 'taffeta ball gown, ribbed pumpkin skirt', 'f2 x0 gf v:pumpkin-pe'],
        ['ed-balloon', 'Pleated balloon skirt dress', '주름 벌룬 스커트 원피스', 'organza dress, pleated balloon skirt', 'f2 x1 gf v:pumpkin-pe'],
        ['ed-bustier', 'Bustier with a puffed skirt', '부푼 치마 뷔스티에 원피스', 'satin bustier mini dress, puffed pumpkin skirt', 'f2 x2 gf n:low v:pumpkin-pe'],
        ['ed-m', 'Velvet suit with a green vest', '초록 조끼 벨벳 수트', 'velvet suit, green silk vest', 'f2 x01 gm'],
        ['ed-m2', 'Unbuttoned shirt and green trousers', '풀어 헤친 셔츠와 초록 바지', 'unbuttoned shirt, green trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['vine', 'Vine belt', '덩굴 벨트', 'twisted vine belt'],
        ['ribbon', 'Green ribbon sash', '초록 리본 허리띠', 'green ribbon sash', 'gf'],
      ],
      foundation: [
        ['striped', 'Orange and black striped stockings', '주황 검정 줄무늬 스타킹', 'orange and black striped stockings', 'gf'],
        ['green', 'Green tights', '초록 타이츠', 'green tights', 'x01'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['leaf', 'Leafy collar', '잎 모양 깃', 'green leafy collar', 'an:own'],
        ['bow', 'Green bow tie', '초록 보타이', 'green bow tie', 'gm'],
      ],
      outer: [
        ['capelet', 'Leaf capelet', '잎사귀 케이플릿', 'green leaf capelet', 'f1'],
        ['cardigan', 'Knit cardigan', '니트 카디건', 'chunky knit cardigan', 'F1'],
      ],
      footwear: [
        ['sneakers', 'Green sneakers', '초록 운동화', 'green sneakers', 'F1'],
        ['boots', 'Black boots', '검은 부츠', 'black boots'],
        ['heels', 'Green heels', '초록 힐', 'green heels', 'f2 gf'],
      ],
      headwear: [
        ['beanie', 'Pumpkin stem beanie', '꼭지 달린 비니', 'pumpkin stem beanie'],
        ['band', 'Pumpkin stem headband', '호박 꼭지 머리띠', 'pumpkin stem headband with leaves'],
        ['mask', 'Carved pumpkin head', '조각한 호박 머리', 'carved pumpkin worn over the head', 'f1 F2 c:mask'],
        ['glow', 'Pumpkin head glowing from inside', '속에서 빛나는 호박 머리', 'carved pumpkin head glowing from inside', 'f3 c:mask'],
      ],
      accessories: [
        ['tendrils', 'Vine tendrils on the wrists', '손목에 감긴 덩굴손', 'curly vine tendrils around the wrists'],
        ['brooch', 'Pumpkin leaf brooch', '호박잎 브로치', 'pumpkin leaf brooch', 'f1'],
        ['candle', 'Candlelight from inside', '속에서 새어 나오는 촛불빛', 'candlelight glowing through the costume seams', 'f3'],
      ],
      weapon: [
        ['lantern', 'Carved jack-o\'-lantern', '조각한 호박 등불', 'holding a carved jack-o\'-lantern'],
        ['pie', 'Pumpkin pie', '호박 파이', 'holding a pumpkin pie', 'f1'],
        ['knife', 'Carving a pumpkin', '호박 조각하기', 'carving a pumpkin with a scoop', 'F1'],
      ],
      device: [
        ['cheek', 'Jack-o\'-lantern on the cheek', '뺨에 그린 호박 얼굴', 'small jack-o\'-lantern face painted on the cheek'],
        ['freckles', 'Orange glitter freckles', '주황 반짝이 주근깨', 'orange glitter freckles', 'f1'],
        ['glow', 'Warm glow in the eyes', '눈 속 따뜻한 불빛', 'warm candle glow in the eyes', 'f3'],
      ],
      effect: [
        ['field', 'Field of glowing lanterns', '빛나는 호박 등불 밭', 'pumpkin field glowing with carved lanterns', 'f3'],
      ],
    },
    looks: [
      ['face', 'w7', { '-headwear': 'mask glow' }],
      ['head', 'f1 x01 w2', { headwear: 'mask glow', device: 'none', neckwear: 'leaf bow none' }],
    ],
  }),

  /* ─── M-14 역병의사 ─── */
  costume('plague', 'Plague Doctor', '역병의사', 'M-14', {
    tag: 'halloween costume, plague doctor costume', tagReal: 'plague doctor, halloween night',
    colors: ['black', 'charcoal', 'brown', 'burgundy'],
    need: { device: 'beak glow' },
    items: {
      garment: [
        ['hm-coat', 'Belted raincoat', '벨트 맨 비옷', 'long raincoat, belted, rubber gloves', 'f0 F0'],
        ['pt-coat', 'Waxed long coat', '왁스 코팅 롱코트', 'plague doctor costume, long waxed coat, high collar', 'f1 F1 x0 n:high v:plague-pl'],
        ['pt-dress', 'Hooded coat dress', '후드 코트 원피스', 'plague doctor costume, hooded coat dress, knee length', 'f1 F1 x1 gf v:plague-pl'],
        ['pt-corset', 'Corset dress with a hooded cape', '후드 케이프 코르셋 원피스', 'plague doctor costume, corset dress, short hooded cape', 'f1 F1 x2 gf v:plague-pl'],
        ['pt-m', 'Buttoned frock coat', '단추 잠근 프록코트', 'plague doctor costume, buttoned frock coat, trousers', 'f1 F1 x12 gm'],
        ['ed-leather', 'Buckled leather coat', '버클 가죽 롱코트', 'floor length leather coat, high collar, rows of buckles', 'f2 x0 n:high v:plague-ple'],
        ['ed-corset', 'Leather coat dress', '가죽 코트 원피스', 'leather coat dress, corset waist', 'f2 x1 gf v:plague-ple'],
        ['ed-bustier', 'Leather corset and slit skirt', '가죽 코르셋과 슬릿 스커트', 'leather corset, high slit skirt, cropped coat', 'f2 x2 gf v:plague-ple'],
        ['ed-m', 'Leather frock coat and waistcoat', '가죽 프록코트와 조끼', 'leather frock coat, buckled waistcoat', 'f2 x12 gm'],
      ],
      structure: [
        ['belt', 'Wide buckled belt', '넓은 버클 벨트', 'wide leather belt, buckles'],
        ['harness', 'Leather harness', '가죽 하네스', 'leather harness', 'f2 x12'],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['stock', 'Lace-top stockings', '레이스 밴드 스타킹', 'lace-top stockings', 'x2 gf'],
      ],
      neckwear: [
        ['scarf', 'Wrapped scarf', '둘러 감은 스카프', 'wrapped scarf', 'an:high'],
      ],
      outer: [
        ['cape', 'Shoulder cape', '어깨 케이프', 'short shoulder cape', 'f1'],
        ['cloak', 'Long cloak', '긴 망토', 'long hooded cloak', 'f2'],
      ],
      footwear: [
        ['boots', 'Tall leather boots', '가죽 롱부츠', 'tall leather boots'],
        ['buckle', 'Buckled boots', '버클 부츠', 'buckled boots', 'f1'],
      ],
      headwear: [
        ['hat', 'Wide brim hat', '챙 넓은 모자', 'wide brim black hat'],
        ['hood', 'Black hood', '검은 후드', 'black hood'],
      ],
      accessories: [
        ['gloves', 'Long leather gloves', '긴 가죽 장갑', 'long leather gloves'],
        ['pouch', 'Herb pouch', '약초 주머니', 'herb pouch at the belt'],
        ['vials', 'Vial bandolier', '약병 탄띠', 'small glass vials on a bandolier', 'f2'],
        ['smoke', 'Green smoke from the vials', '약병에서 피어오르는 초록 연기', 'green smoke seeping from the vials', 'f3'],
      ],
      weapon: [
        ['cane', 'Wooden cane', '나무 지팡이', 'holding a wooden cane'],
        ['lantern', 'Lantern', '랜턴', 'holding a lantern'],
        ['herbs', 'Bundle of dried herbs', '말린 약초 다발', 'holding a bundle of dried herbs', 'f1'],
      ],
      device: [
        ['beak', 'Beak mask', '새부리 가면', 'plague doctor beak mask', 'f1 c:mask'],
        ['glow', 'Glowing mask lenses', '빛나는 가면 렌즈', 'beak mask, lenses glowing green', 'f3 c:mask'],
      ],
      effect: [
        ['apothecary', 'Apothecary shop', '약재상', 'apothecary shop, shelves of jars', 'f2'],
        ['alley', 'Foggy cobblestone alley', '안개 낀 돌길 골목', 'cobblestone alley, lantern light, fog', 'f3'],
      ],
    },
  }),

  /* ─── M-15 뱀파이어 헌터 ─── */
  costume('hunter', 'Vampire Hunter', '뱀파이어 헌터', 'M-15', {
    tag: 'halloween costume, vampire hunter costume', tagReal: 'vampire hunter, halloween night',
    colors: ['black', 'brown', 'charcoal', 'burgundy', 'khaki'],
    need: { weapon: 'stake mallet crossbow lantern' },
    items: {
      garment: [
        ['hm-trench', 'Trench coat with cardboard stakes', '골판지 말뚝을 꽂은 트렌치코트', 'trench coat, cardboard stakes tucked in the belt', 'f0 F0'],
        ['pt-coat', 'Leather coat and button shirt', '가죽 코트와 셔츠', 'vampire hunter costume, long leather coat, button shirt, trousers', 'f1 F1 x0'],
        ['pt-vest', 'Corset vest and leather skirt', '코르셋 조끼와 가죽 스커트', 'vampire hunter costume, corset vest, leather skirt, knee length', 'f1 F1 x1 gf'],
        ['pt-corset', 'Leather corset and short skirt', '가죽 코르셋과 짧은 치마', 'vampire hunter costume, leather corset, short skirt', 'f1 F1 x2 gf'],
        ['pt-m', 'Waistcoat and riding trousers', '조끼와 승마 바지', 'vampire hunter costume, waistcoat, riding trousers', 'f1 F1 x1 gm'],
        ['pt-m2', 'Open shirt and leather vest', '풀어 헤친 셔츠와 가죽 조끼', 'vampire hunter costume, open shirt, leather vest', 'f1 F1 x2 gm n:low'],
        ['ed-coat', 'Victorian long coat', '빅토리안 롱코트', 'victorian long coat, waistcoat, high collar shirt', 'f2 x0 n:high'],
        ['ed-bodice', 'Corset bodice and riding trousers', '코르셋 보디스와 승마 바지', 'leather corset bodice, riding trousers', 'f2 x1 gf'],
        ['ed-bustier', 'Bustier and slit skirt', '뷔스티에와 슬릿 스커트', 'leather bustier, high slit skirt', 'f2 x2 gf n:low'],
        ['ed-m', 'Greatcoat and waistcoat', '그레이트코트와 조끼', 'caped greatcoat, leather waistcoat', 'f2 x1 gm'],
        ['ed-m2', 'Unbuttoned shirt and waistcoat', '풀어 헤친 셔츠와 조끼', 'unbuttoned shirt, leather waistcoat, long coat', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['stakes', 'Stake bandolier', '말뚝 탄띠', 'bandolier of wooden stakes'],
        ['flasks', 'Belt with small flasks', '작은 병을 단 벨트', 'belt with small glass flasks', 'f1'],
        ['harness', 'Leather harness', '가죽 하네스', 'leather harness', 'f2 x12'],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
        ['holster', 'Thigh holster with stakes', '말뚝 꽂은 허벅지 홀스터', 'thigh holster with stakes', 'x12'],
      ],
      neckwear: [
        ['cross', 'Silver cross pendant', '은 십자가 펜던트', 'silver cross pendant', 'f1'],
        ['garlic', 'Garlic garland', '마늘 목걸이', 'garlic garland around the neck', 'F1'],
        ['cravat', 'Cravat', '크라바트', 'cravat', 'f2 an:low'],
      ],
      outer: [
        ['coat', 'Long leather coat', '긴 가죽 코트', 'long leather coat', 'f1'],
        ['capecoat', 'Caped greatcoat', '케이프 그레이트코트', 'caped greatcoat', 'f2'],
      ],
      footwear: [
        ['boots', 'Tall boots', '롱부츠', 'tall leather boots'],
        ['buckle', 'Buckled boots', '버클 부츠', 'buckled boots', 'f1'],
      ],
      headwear: [
        ['hat', 'Wide brim hat', '챙 넓은 모자', 'wide brim hat'],
        ['tricorn', 'Tricorn hat', '삼각모', 'tricorn hat', 'f2'],
      ],
      accessories: [
        ['gloves', 'Leather gloves', '가죽 장갑', 'leather gloves'],
        ['bracers', 'Leather bracers', '가죽 팔 보호대', 'leather bracers', 'f1'],
        ['glint', 'Silver glinting in the dark', '어둠 속 은빛', 'silver buckles glinting in the dark', 'f3'],
      ],
      weapon: [
        ['stake', 'Wooden stake', '나무 말뚝', 'holding a wooden stake'],
        ['mallet', 'Mallet and stake', '망치와 말뚝', 'holding a mallet and stake', 'f1'],
        ['crossbow', 'Crossbow', '석궁', 'holding a crossbow', 'f1'],
        ['lantern', 'Silver lantern', '은 랜턴', 'holding a silver lantern', 'f2'],
      ],
      device: [
        ['soot', 'Soot smudge', '그을음 자국', 'soot smudge on the cheek'],
        ['specs', 'Round spectacles', '둥근 안경', 'round spectacles', 'f1'],
      ],
      effect: [
        ['street', 'Gas-lit street', '가스등 켠 거리', 'foggy cobblestone street, gas lamps', 'f2'],
        ['gates', 'Castle gates at night', '밤의 고성 정문', 'gothic castle gates, torches flickering', 'f3'],
      ],
    },
  }),

  /* ─── M-16 슬래셔 악당 — 특정 영화 인물이 아니라 그 갈래의 차림. 피는 옷 · 소품에 튄 가짜 피까지, 상처는 없음 ─── */
  costume('slasher', 'Slasher Villain', '슬래셔 악당', 'M-16', {
    tag: 'halloween costume, slasher villain costume', tagReal: 'slasher villain, halloween night',
    colors: ['grey', 'khaki', 'brown', 'olive', 'charcoal', 'dusty grey', 'faded linen'],
    need: { weapon: 'chainsaw cleaver machete hook' },
    items: {
      garment: [
        ['hm-coverall', 'Old work coveralls', '헌 작업복', 'old work coveralls, dirt smudged', 'f0 F0'],
        ['pt-coverall', 'Mechanic coveralls', '정비공 작업복', 'slasher costume, mechanic coveralls, rolled sleeves', 'f1 F1 x0 v:slasher-co'],
        ['pt-apron', 'Shirt dress and butcher apron', '셔츠 원피스와 정육점 앞치마', 'slasher costume, button shirt dress, long butcher apron', 'f1 F1 x1 gf v:slasher-co'],
        ['pt-short', 'Cropped coveralls', '짧은 작업복', 'slasher costume, short coveralls, rolled sleeves, unzipped collar', 'f1 F1 x2 gf v:slasher-co'],
        ['pt-m', 'Work shirt and butcher apron', '작업 셔츠와 정육점 앞치마', 'slasher costume, work shirt, long butcher apron, trousers', 'f1 F1 x1 gm'],
        ['pt-m2', 'Sleeveless work shirt and apron', '민소매 작업 셔츠와 앞치마', 'slasher costume, sleeveless work shirt, butcher apron, work trousers', 'f1 F1 x2 gm'],
        ['ed-jacket', 'Worn jumpsuit and field jacket', '낡은 점프수트와 야전 상의', 'worn utility jumpsuit, faded field jacket', 'f2 x0 v:slasher-coe'],
        ['ed-dress', 'Faded house dress and leather apron', '바랜 원피스와 가죽 앞치마', 'faded vintage house dress, heavy leather apron', 'f2 x1 gf v:slasher-coe'],
        ['ed-corset', 'Leather apron over a slip dress', '슬립 원피스 위 가죽 앞치마', 'heavy leather apron over a short slip dress', 'f2 x2 gf n:low v:slasher-coe'],
        ['ed-m', 'Heavy leather apron and work shirt', '두꺼운 가죽 앞치마와 작업 셔츠', 'heavy leather apron, stained work shirt, suspenders', 'f2 x12 gm'],
      ],
      structure: [
        ['belt', 'Tool belt', '공구 벨트', 'worn tool belt'],
        ['susp', 'Suspenders', '멜빵', 'suspenders', 'f1'],
      ],
      foundation: [
        ['socks', 'Work socks', '작업 양말', 'grey work socks', 'x01'],
        ['ladder', 'Laddered tights', '올 나간 타이츠', 'laddered tights', 'x12 gf'],
      ],
      neckwear: [
        ['rag', 'Knotted rag', '목에 묶은 천 조각', 'dirty rag knotted around the neck', 'an:low'],
      ],
      outer: [
        ['jacket', 'Faded work jacket', '바랜 작업 재킷', 'faded work jacket', 'f1'],
        ['raincoat', 'Yellow fisherman raincoat', '노란 어부 비옷', 'yellow fisherman raincoat', 'f1'],
      ],
      footwear: [
        ['work', 'Worn work boots', '낡은 작업화', 'worn work boots'],
        ['rubber', 'Rubber boots', '고무장화', 'muddy rubber boots'],
      ],
      headwear: [
        ['cap', 'Faded work cap', '바랜 작업모', 'faded work cap', 'F1'],
        ['hood', 'Dark hood', '어두운 후드', 'dark hood pulled low'],
      ],
      accessories: [
        ['gloves', 'Work gloves', '작업 장갑', 'dirty work gloves'],
        ['rubber', 'Long rubber gloves', '긴 고무장갑', 'long black rubber gloves', 'f1'],
        ['splat', 'Fake blood on the clothes', '옷에 튄 가짜 피', 'fake blood splatter on the clothes', 'f1'],
        ['chain', 'Keys on a ring', '열쇠 꾸러미', 'ring of old keys at the belt', 'f1'],
        ['fog', 'Fog curling at the ankles', '발목에 감기는 안개', 'low fog curling around the ankles', 'f3'],
      ],
      weapon: [
        ['chainsaw', 'Toy chainsaw', '장난감 전기톱', 'holding a prop chainsaw'],
        ['cleaver', 'Prop meat cleaver', '소품 고기 칼', 'holding a prop meat cleaver', 'f1'],
        ['machete', 'Prop machete', '소품 마체테', 'holding a prop machete', 'f1'],
        ['hook', 'Prop hook', '소품 갈고리', 'holding a prop iron hook', 'f1'],
        ['dragged', 'Chainsaw dragged along', '끌고 가는 전기톱', 'dragging a chainsaw along the ground', 'f3'],
      ],
      device: [
        ['hockey', 'Hockey mask', '하키 마스크', 'white hockey mask', 'f1 c:mask'],
        ['sack', 'Burlap sack mask', '자루 가면', 'burlap sack mask, stitched eye holes', 'f1 c:mask'],
        ['blank', 'Blank white mask', '무표정 흰 가면', 'blank white expressionless mask', 'f1 c:mask'],
        ['splat', 'Fake blood splatter on the cheek', '뺨에 튄 가짜 피', 'fake blood splatter on the cheek'],
        ['shadow', 'Dark eye smudge', '눈가의 어두운 번짐', 'smudged dark eye makeup'],
        ['glow', 'Eyes glinting behind the mask', '가면 뒤에서 번뜩이는 눈', 'white mask, eyes glinting in the dark', 'f3 c:mask'],
      ],
      effect: [
        ['barn', 'Old barn', '낡은 헛간', 'old barn at night, hanging lightbulb', 'f2'],
        ['camp', 'Summer camp cabin', '여름 캠프 오두막', 'empty summer camp cabin, misty lake', 'f3'],
        ['road', 'Dark country road', '어두운 시골길', 'dark country road, flickering streetlight', 'f3'],
      ],
    },
    looks: [
      ['mask', 'w3', { device: 'hockey sack blank glow' }],
      ['face', 'w1', { device: 'splat shadow none' }],
    ],
  }),

  /* ─── M-17 안개 속 신사 — 빅토리아풍 밤거리의 수수께끼 인물. 이름 있는 인물은 쓰지 않는다 ─── */
  costume('foggent', 'Fog Gentleman', '안개 속 신사', 'M-17', {
    tag: 'halloween costume, victorian mystery lady costume', tagReal: 'victorian mystery lady, halloween night, fog',
    tagM: 'halloween costume, victorian gentleman costume', tagRealM: 'victorian gentleman, halloween night, fog',
    colors: ['black', 'charcoal', 'burgundy', 'grey', 'wine'],
    need: { headwear: 'tophat mini veil', weapon: 'cane razor umbrella lamp' },
    items: {
      garment: [
        ['hm', 'Black coat and dark trousers', '검은 코트와 어두운 바지', 'black coat, dark trousers, white shirt', 'f0 F0'],
        ['pt-dress', 'Bustle dress, high collar', '하이넥 버슬 드레스', 'victorian costume, high collar bustle dress, long skirt', 'f1 F1 x0 gf n:high v:foggent-fg'],
        ['pt-vest', 'Waistcoat and bustle skirt', '조끼와 버슬 스커트', 'victorian costume, fitted waistcoat, ruffled blouse, bustle skirt', 'f1 F1 x1 gf v:foggent-fg'],
        ['pt-short', 'Tailcoat and short bustle skirt', '연미복과 짧은 버슬 스커트', 'victorian costume, cropped tailcoat, corset, short bustle skirt', 'f1 F1 x2 gf v:foggent-fg'],
        ['pt-m', 'Tailcoat and waistcoat', '연미복과 조끼', 'victorian gentleman costume, black tailcoat, waistcoat, high collar shirt', 'f1 F1 x01 gm n:high'],
        ['pt-m2', 'Waistcoat, shirt open', '풀어 헤친 셔츠와 조끼', 'victorian gentleman costume, waistcoat, shirt open at the collar', 'f1 F1 x2 gm n:low'],
        ['ed-gown', 'Velvet mourning gown', '벨벳 상복 드레스', 'velvet victorian mourning gown, high lace collar', 'f2 x0 gf n:high v:foggent-fge'],
        ['ed-coat', 'Coat dress with a corset waist', '코르셋 허리 코트 드레스', 'long victorian coat dress, corset waist, lace cuffs', 'f2 x1 gf v:foggent-fge'],
        ['ed-slit', 'Corset and slit bustle skirt', '코르셋과 트임 버슬 스커트', 'velvet corset, high slit bustle skirt, lace gloves', 'f2 x2 gf n:low v:foggent-fge'],
        ['ed-m', 'Velvet frock coat and cravat', '벨벳 프록코트와 크라바트', 'velvet frock coat, brocade waistcoat, cravat', 'f2 x01 gm'],
        ['ed-m2', 'Frock coat over an open shirt', '열린 셔츠 위 프록코트', 'long frock coat, ruffled shirt open at the collar', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['watch', 'Pocket watch chain', '회중시계 줄', 'pocket watch chain across the waistcoat'],
        ['corset', 'Velvet corset belt', '벨벳 코르셋 벨트', 'velvet corset belt', 'gf'],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['lace', 'Lace stockings', '레이스 스타킹', 'black lace stockings', 'x12 gf'],
      ],
      neckwear: [
        ['cravat', 'Silk cravat', '실크 크라바트', 'silk cravat', 'an:low'],
        ['cameo', 'Cameo choker', '카메오 초커', 'black ribbon choker, cameo', 'gf'],
      ],
      outer: [
        ['inverness', 'Caped overcoat', '케이프 달린 외투', 'long caped overcoat', 'f1'],
        ['cloak', 'Long black cloak', '긴 검은 망토', 'long black cloak', 'f2'],
      ],
      footwear: [
        ['oxford', 'Polished shoes', '광낸 구두', 'polished black shoes'],
        ['boots', 'Lace-up boots', '끈 부츠', 'victorian lace-up boots'],
      ],
      headwear: [
        ['tophat', 'Top hat', '실크해트', 'black top hat'],
        ['mini', 'Mini top hat with a veil', '베일 단 미니 실크해트', 'mini top hat with a veil', 'f1 gf'],
        ['veil', 'Veiled hat', '베일 모자', 'small hat with a black lace veil', 'f1 gf'],
      ],
      accessories: [
        ['gloves', 'Leather gloves', '가죽 장갑', 'black leather gloves'],
        ['monocle', 'Monocle', '외알 안경', 'monocle', 'f1'],
        ['rose', 'Red rose boutonniere', '빨간 장미 꽃장식', 'red rose boutonniere', 'f1'],
        ['fog', 'Fog at the hem', '옷자락의 안개', 'thick fog curling around the coat hem', 'f3'],
      ],
      weapon: [
        ['cane', 'Silver-topped cane', '은 손잡이 지팡이', 'holding a silver-topped cane'],
        ['razor', 'Prop straight razor', '소품 접이식 면도칼', 'holding a prop straight razor', 'f1'],
        ['umbrella', 'Black umbrella', '검은 우산', 'holding a closed black umbrella', 'f1'],
        ['lamp', 'Gas lamp', '가스 랜턴', 'holding a small gas lamp', 'f2'],
      ],
      device: [
        ['shadow', 'Shadowed eyes', '그늘진 눈가', 'smudged dark eye makeup'],
        ['mask', 'Half mask', '반가면', 'black half mask', 'f1'],
        ['glow', 'Eyes glowing in the fog', '안개 속 빛나는 눈', 'eyes glowing red in the fog', 'f3'],
      ],
      effect: [
        ['street', 'Foggy gas-lit street', '안개 낀 가스등 거리', 'foggy cobblestone street, gas lamps', 'f2'],
        ['bridge', 'River bridge at night', '밤의 강 다리', 'old stone bridge over a dark river, fog', 'f3'],
      ],
    },
  }),

  /* ─── M-18 오페라 하우스 유령 — 반가면 · 망토 · 극장. 작품 · 인물 이름은 쓰지 않는다 ─── */
  costume('phantom', 'Opera House Phantom', '오페라 하우스 유령', 'M-18', {
    tag: 'halloween costume, masked opera diva costume', tagReal: 'masked opera diva, halloween night, old opera house',
    tagM: 'halloween costume, masked opera phantom costume', tagRealM: 'masked opera phantom, halloween night, old opera house',
    colors: ['black', 'white', 'crimson', 'gold', 'wine'],
    need: { device: 'half half-gold half-lace', outer: 'cape cape-long' },
    items: {
      garment: [
        ['hm', 'Black suit and white shirt', '검은 정장과 흰 셔츠', 'black suit, white shirt', 'f0 F0'],
        ['pt-gown', 'Off-shoulder ball gown', '오프숄더 무도회 드레스', 'opera costume, off-shoulder ball gown, full skirt', 'f1 F1 x1 gf n:low v:phantom-pt'],
        ['pt-high', 'High-neck lace ball gown', '하이넥 레이스 무도회 드레스', 'opera costume, high-neck lace ball gown, full skirt', 'f1 F1 x0 gf n:high v:phantom-pt'],
        ['pt-short', 'Corset and short ruffled skirt', '코르셋과 짧은 프릴 스커트', 'opera costume, satin corset, short ruffled skirt', 'f1 F1 x2 gf n:low v:phantom-pt'],
        ['pt-m', 'Tailcoat and white tie', '연미복과 흰 나비넥타이', 'opera costume, black tailcoat, white waistcoat, white tie', 'f1 F1 x01 gm n:high'],
        ['pt-m2', 'Tailcoat over an open shirt', '열린 셔츠 위 연미복', 'opera costume, black tailcoat, white shirt open at the collar', 'f1 F1 x2 gm n:low'],
        ['ed-gown', 'Beaded masquerade gown', '구슬 장식 가면무도회 드레스', 'beaded masquerade ball gown, long train', 'f2 x0 gf n:high v:phantom-ed'],
        ['ed-slit', 'Velvet gown, high slit', '높은 트임 벨벳 드레스', 'velvet opera gown, high slit, sweetheart neckline', 'f2 x2 gf n:low v:phantom-ed'],
        ['ed-m', 'Velvet tailcoat and brocade waistcoat', '벨벳 연미복과 브로케이드 조끼', 'velvet tailcoat, brocade waistcoat, white cravat', 'f2 x01 gm'],
      ],
      structure: [
        ['corset', 'Satin corset belt', '새틴 코르셋 벨트', 'satin corset belt', 'gf'],
        ['sash', 'Red waist sash', '붉은 허리 띠', 'red satin waist sash', 'f1'],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['lace', 'Lace stockings', '레이스 스타킹', 'black lace stockings', 'x12 gf'],
      ],
      neckwear: [
        ['choker', 'Black ribbon choker', '검은 리본 초커', 'black ribbon choker', 'gf'],
        ['pearls', 'Pearl choker', '진주 초커', 'pearl choker', 'gf an:high'],
        ['cravat', 'White cravat', '흰 크라바트', 'white silk cravat', 'gm an:low'],
      ],
      outer: [
        ['cape', 'Black cape, red lining', '안이 붉은 검은 망토', 'black cape with red satin lining'],
        ['cape-long', 'Floor-length opera cape', '바닥까지 끌리는 오페라 망토', 'floor-length black opera cape, red lining', 'f1'],
      ],
      footwear: [
        ['pumps', 'Satin pumps', '새틴 펌프스', 'black satin pumps', 'gf'],
        ['patent', 'Patent leather shoes', '에나멜 구두', 'black patent leather shoes', 'gm'],
      ],
      headwear: [
        ['fedora', 'Black fedora', '검은 페도라', 'black fedora', 'f1 gm'],
        ['feather', 'Feather hair piece', '깃털 머리 장식', 'black feather hair piece', 'f1 gf'],
        ['tiara', 'Small jeweled tiara', '작은 보석 티아라', 'small jeweled tiara', 'f2 gf'],
      ],
      accessories: [
        ['gloves', 'White gloves', '흰 장갑', 'white gloves'],
        ['opera', 'Long satin gloves', '긴 새틴 장갑', 'long black satin gloves', 'gf'],
      ],
      weapon: [
        ['rose', 'Red rose', '빨간 장미 한 송이', 'holding a single red rose tied with a black ribbon'],
        ['candle', 'Candelabra', '촛대', 'holding a lit candelabra', 'f1'],
        ['music', 'Music box', '오르골', 'holding an old music box', 'f2'],
      ],
      device: [
        ['half', 'White half mask', '흰 반가면', 'white half-face mask covering one side of the face'],
        ['half-gold', 'Gold-trimmed half mask', '금테 반가면', 'white half-face mask with gold trim', 'f1'],
        ['half-lace', 'Black lace half mask', '검은 레이스 반가면', 'black lace half-face mask', 'f1'],
      ],
      effect: [
        ['box', 'Opera box seats', '오페라 극장 박스석', 'gilded opera house box seats, red velvet curtains', 'f2'],
        ['stage', 'Stage under the chandelier', '샹들리에 아래 무대', 'empty opera stage under a huge crystal chandelier', 'f2'],
        ['lake', 'Candlelit underground lake', '촛불 켠 지하 호수', 'underground lake lit by hundreds of candles, mist', 'f3'],
      ],
    },
  }),

]);

/* ═══════════════════════════════════════════════════════════════════
 * STORYBOOK — 동화 · 생물 · 환상 12
 * ═══════════════════════════════════════════════════════════════════ */
const storybook = collection('storybook', 'STORYBOOK', 'PA·TFY·II', 'tales and creatures',
  ['black', 'red', 'pastel pink', 'lavender', 'teal', 'gold', 'cream', 'brown'],
  [

  /* ─── S-01 검은 고양이 ─── */
  costume('cat', 'Black Cat', '검은 고양이', 'S-01', {
    tag: 'halloween costume, black cat costume', tagReal: 'black cat costume, halloween night',
    colors: ['black', 'charcoal', 'grey', 'white', 'cream'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Turtleneck with a pinned tail', '꼬리를 핀으로 단 터틀넥', 'turtleneck sweater, leggings, felt tail pinned on', 'f0 F0'],
        ['pt-long', 'Long-sleeved cat dress', '긴소매 고양이 원피스', 'cat costume, long sleeve dress', 'f1 F1 x0 gf v:cat-cd'],
        ['pt-skater', 'Skater dress with a collar', '깃 달린 스케이터 원피스', 'cat costume, skater dress, white collar', 'f1 F1 x1 gf n:own v:cat-cd'],
        ['pt-short', 'Short cat dress', '짧은 고양이 원피스', 'cat costume, short dress, sheer sleeves, white collar', 'f1 F1 x2 gf v:cat-cd'],
        ['pt-m', 'Turtleneck and trousers', '터틀넥과 바지', 'cat costume, turtleneck, slim trousers', 'f1 F1 x01 gm n:high'],
        ['pt-m2', 'Sleeveless top and trousers', '민소매와 바지', 'cat costume, sleeveless top, fitted trousers', 'f1 F1 x2 gm'],
        ['ed-velvet', 'Velvet dress with a Peter Pan collar', '피터팬 깃 벨벳 원피스', 'velvet dress, peter pan collar, long sleeves', 'f2 x0 gf n:own v:cat-ce'],
        ['ed-puff', 'Puff-sleeved velvet dress', '퍼프 소매 벨벳 원피스', 'velvet a-line dress, white collar, puff sleeves', 'f2 x1 gf n:own v:cat-ce'],
        ['ed-mini', 'Open-back velvet mini dress', '등 트인 벨벳 미니 원피스', 'velvet mini dress, white collar, open back', 'f2 x2 gf v:cat-ce'],
        ['ed-m', 'Velvet suit with a turtleneck', '터틀넥 벨벳 수트', 'velvet suit, silk turtleneck', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open-collar silk shirt', '깃을 연 실크 셔츠', 'silk shirt open at the collar, velvet trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Ribbon belt', '리본 허리띠', 'ribbon belt with a bow at the back', 'gf'],
        ['corset', 'Corset belt', '코르셋 벨트', 'corset belt', 'f1 x12 gf'],
      ],
      foundation: [
        ['tights', 'Opaque tights', '불투명 타이츠', 'opaque tights', 'x01 gf'],
        ['knee', 'Knee socks', '니삭스', 'knee socks', 'x01 gf'],
        ['paw', 'Paw print thighhighs', '발자국 무늬 사이하이', 'paw print thighhighs', 'x12 gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['bell', 'Bell collar', '방울 목걸이', 'bell collar'],
        ['ribbon', 'Ribbon bow with a bell', '방울 단 리본', 'ribbon bow with a small bell', 'gf'],
        ['collar', 'White Peter Pan collar', '흰 피터팬 깃', 'detachable white peter pan collar', 'gf an:own+low'],
      ],
      outer: [
        ['cardigan', 'Cropped cardigan', '짧은 카디건', 'cropped cardigan', 'F1 gf'],
        ['cape', 'Short cape', '짧은 망토', 'short cape', 'f1'],
      ],
      footwear: [
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['sneakers', 'Sneakers', '운동화', 'sneakers', 'F1'],
        ['boots', 'Ankle boots', '앵클 부츠', 'ankle boots'],
        ['heels', 'Platform heels', '플랫폼 힐', 'platform heels', 'f2 x12 gf'],
      ],
      headwear: [
        ['ears', 'Cat ear headband', '고양이 귀 머리띠', 'cat ear headband'],
        ['beanie', 'Cat ear beanie', '고양이 귀 비니', 'knit cat ear beanie', 'F1'],
        ['bow', 'Velvet cat ears with a bow', '리본 달린 벨벳 고양이 귀', 'velvet cat ears with a bow', 'f1'],
        ['hood', 'Cat ear hood', '고양이 귀 후드', 'cat ear hood', 'f1'],
      ],
      accessories: [
        ['tail', 'Cat tail', '고양이 꼬리', 'cat tail'],
        ['paws', 'Paw gloves', '고양이 발 장갑', 'paw gloves'],
        ['bellbracelet', 'Bell bracelet', '방울 팔찌', 'bell bracelet', 'f1'],
        ['prints', 'Glowing paw prints', '빛나는 발자국', 'trail of glowing paw prints', 'f3'],
      ],
      weapon: [
        ['yarn', 'Ball of yarn', '털실 뭉치', 'holding a ball of yarn'],
        ['mouse', 'Toy mouse', '장난감 쥐', 'holding a toy mouse'],
        ['kitten', 'Black kitten', '검은 아기 고양이', 'holding a black kitten', 'f1 c:animal'],
      ],
      device: [
        ['whiskers', 'Drawn-on whiskers', '그린 수염', 'drawn-on whiskers and cat nose'],
        ['glitter', 'Glitter whiskers', '반짝이 수염', 'glitter whiskers', 'f1'],
        ['eyes', 'Glowing cat eyes', '빛나는 고양이 눈', 'glowing green slit pupils', 'f3'],
      ],
      effect: [
        ['roof', 'Rooftop with a crescent moon', '초승달 뜬 지붕', 'tiled rooftop at night, crescent moon', 'f3'],
        ['wall', 'Moonlit wall with cats', '고양이들이 지켜보는 담장', 'stone wall under a full moon, black cats watching', 'f3'],
      ],
    },
  }),

  /* ─── S-02 박쥐 ─── */
  costume('bat', 'Bat', '박쥐', 'S-02', {
    tag: 'halloween costume, bat costume', tagReal: 'bat costume, halloween night',
    colors: ['black', 'deep purple', 'charcoal', 'plum'],
    need: { accessories: 'wings' },
    items: {
      garment: [
        ['hm', 'Hoodie with umbrella-fabric wings', '우산 천 날개 후드티', 'hoodie, umbrella fabric wings sewn to the sleeves', 'f0 F0'],
        ['pt-suit', 'Jumpsuit with a wing cape', '날개 망토 점프슈트', 'bat costume, jumpsuit, attached wing cape', 'f1 F1 x0 v:bat-bt'],
        ['pt-dress', 'Scalloped skater dress', '물결 밑단 스케이터 원피스', 'bat costume, skater dress, scalloped hem', 'f1 F1 x1 gf v:bat-bt'],
        ['pt-mini', 'Scalloped corset mini dress', '물결 밑단 코르셋 미니 원피스', 'bat costume, corset mini dress, scalloped hem', 'f1 F1 x2 gf n:low v:bat-bt'],
        ['pt-m', 'Hoodie with wing sleeves', '날개 소매 후드티', 'bat costume, hoodie, wing sleeves', 'f1 F1 x1 gm'],
        ['pt-m2', 'Sleeveless top with a wing cape', '날개 망토와 민소매', 'bat costume, sleeveless top, trousers, wing cape', 'f1 F1 x2 gm'],
        ['ed-chiffon', 'Wing-sleeved chiffon gown', '날개 소매 시폰 드레스', 'chiffon gown, scalloped wing sleeves', 'f2 x0 gf v:bat-bte'],
        ['ed-satin', 'Satin dress with wing cape sleeves', '날개 케이프 소매 새틴 원피스', 'satin dress, bat wing cape sleeves, knee length', 'f2 x1 gf v:bat-bte'],
        ['ed-mini', 'Satin mini with sheer wing panels', '시스루 날개 새틴 미니 원피스', 'satin mini dress, scalloped hem, sheer wing panels', 'f2 x2 gf v:bat-bte'],
        ['ed-m', 'Scalloped high-collar coat', '물결 밑단 하이칼라 코트', 'high collar coat, scalloped hem', 'f2 x1 gm n:high'],
        ['ed-m2', 'Open-collar shirt and wing cape', '깃을 연 셔츠와 날개 망토', 'open collar shirt, fitted trousers, wing cape', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Bat buckle belt', '박쥐 버클 벨트', 'belt with a bat buckle'],
        ['corset', 'Corset belt', '코르셋 벨트', 'corset belt', 'x12 gf'],
      ],
      foundation: [
        ['tights', 'Opaque tights', '불투명 타이츠', 'opaque tights', 'x01 gf'],
        ['print', 'Bat print tights', '박쥐 무늬 타이츠', 'bat print tights', 'x12 gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['choker', 'Bat choker', '박쥐 초커', 'bat charm choker'],
        ['collar', 'Scalloped collar', '물결 깃', 'scalloped collar', 'an:own+low'],
      ],
      outer: [
        ['cape', 'Bat wing cape', '박쥐 날개 망토', 'bat wing cape'],
        ['scallop', 'Scalloped wing cape', '물결 날개 망토', 'scalloped wing cape', 'f1'],
        ['shawl', 'Sheer wing shawl', '얇은 날개 숄', 'sheer wing shawl', 'f2'],
      ],
      footwear: [
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['sneakers', 'Sneakers', '운동화', 'black sneakers', 'F1'],
        ['ankle', 'Ankle boots', '앵클 부츠', 'ankle boots'],
        ['platform', 'Platform shoes', '플랫폼 슈즈', 'platform shoes', 'f2'],
      ],
      headwear: [
        ['ears', 'Bat ear headband', '박쥐 귀 머리띠', 'bat ear headband'],
        ['clips', 'Bat hair clips', '박쥐 머리핀', 'bat hair clips', 'gf'],
        ['wings', 'Bat wing headband', '박쥐 날개 머리띠', 'bat wing headband', 'f1'],
        ['hood', 'Hood with bat ears', '박쥐 귀 후드', 'small hood with bat ears', 'f1'],
      ],
      accessories: [
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings on the back'],
        ['earrings', 'Bat earrings', '박쥐 귀걸이', 'bat earrings', 'f1'],
        ['flock', 'Tiny bats fluttering', '파닥이는 작은 박쥐들', 'tiny bats fluttering around', 'f3 c:animal'],
      ],
      weapon: [
        ['plush', 'Bat plush', '박쥐 인형', 'holding a bat plush'],
        ['garland', 'Paper bat garland', '종이 박쥐 가랜드', 'holding a paper bat garland', 'F1'],
        ['umbrella', 'Black umbrella', '검은 우산', 'holding a black umbrella', 'f1'],
      ],
      device: [
        ['paint', 'Bat cheek paint', '볼의 박쥐 분장', 'small bat silhouette painted on the cheek', 'f1'],
        ['fangs', 'Tiny fangs', '작은 송곳니', 'tiny fangs'],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
      effect: [
        ['cave', 'Cave mouth at dusk', '해 질 녘 동굴 입구', 'cave mouth at dusk, bats pouring out', 'f3'],
        ['belfry', 'Belfry at night', '밤의 종탑', 'old belfry at night, moonlight', 'f3'],
      ],
    },
  }),

  /* ─── S-03 거미 ─── */
  costume('spider', 'Spider', '거미', 'S-03', {
    tag: 'halloween costume, spider costume', tagReal: 'spider queen costume, halloween night',
    tagM: 'halloween costume, spider costume', tagRealM: 'spider king costume, halloween night',
    colors: ['black', 'deep purple', 'red', 'charcoal'],
    items: {
      garment: [
        ['hm', 'Sweatshirt with stuffed legs', '솜 넣은 다리를 단 맨투맨', 'sweatshirt, stuffed stocking legs sewn to the sides', 'f0 F0'],
        ['pt-long', 'Web print long dress', '거미줄 무늬 긴 원피스', 'spider costume, long dress, web print', 'f1 F1 x0 gf v:spider-sp'],
        ['pt-lace', 'Web lace overlay dress', '거미줄 레이스 원피스', 'spider costume, dress, web lace overlay', 'f1 F1 x1 gf v:spider-sp'],
        ['pt-mini', 'Web lace corset mini dress', '거미줄 레이스 코르셋 미니 원피스', 'spider costume, corset mini dress, web lace', 'f1 F1 x2 gf n:low v:spider-sp'],
        ['pt-m', 'Hoodie with extra legs', '다리를 더 단 후드티', 'spider costume, hoodie, extra stuffed legs', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless web print top', '거미줄 무늬 민소매', 'spider costume, sleeveless web print top, trousers', 'f1 F1 x2 gm'],
        ['ed-gown', 'Gown with web lace sleeves', '거미줄 레이스 소매 드레스', 'gown, spiderweb lace sleeves', 'f2 x0 gf v:spider-spe'],
        ['ed-lace', 'Spiderweb lace dress', '거미줄 레이스 원피스', 'lace dress, spiderweb pattern, sheer sleeves', 'f2 x1 gf v:spider-spe'],
        ['ed-body', 'Web lace bodysuit and sheer skirt', '거미줄 레이스 보디수트와 시스루 스커트', 'spiderweb lace bodysuit, sheer skirt', 'f2 x2 gf v:spider-spe c:bodysuit'],
        ['ed-m', 'Web-embroidered velvet coat', '거미줄 자수 벨벳 코트', 'velvet coat, web embroidery', 'f2 x01 gm'],
        ['ed-m2', 'Sheer shirt with web embroidery', '거미줄 자수 시스루 셔츠', 'sheer shirt, web embroidery, trousers', 'f2 x2 gm'],
      ],
      structure: [
        ['corset', 'Lace-up corset', '끈 코르셋', 'lace-up corset', 'x12 gf'],
        ['belt', 'Web buckle belt', '거미줄 버클 벨트', 'belt with a spiderweb buckle'],
      ],
      foundation: [
        ['web', 'Spiderweb tights', '거미줄 타이츠', 'spiderweb tights', 'gf'],
        ['tights', 'Opaque tights', '불투명 타이츠', 'opaque tights', 'x01 gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['choker', 'Spider choker', '거미 초커', 'spider charm choker'],
        ['collar', 'Web collar', '거미줄 깃', 'spiderweb collar', 'an:own'],
      ],
      outer: [
        ['shawl', 'Spiderweb shawl', '거미줄 숄', 'spiderweb shawl', 'f1'],
        ['cape', 'Web cape', '거미줄 망토', 'long spiderweb lace cape', 'f2'],
      ],
      footwear: [
        ['boots', 'Black boots', '검은 부츠', 'black boots'],
        ['heels', 'Heels', '힐', 'heels', 'f1 gf'],
        ['pointed', 'Pointed heels', '뾰족한 힐', 'pointed stiletto heels', 'f2 x12 gf'],
      ],
      headwear: [
        ['bob', 'Bobbing spider headband', '흔들리는 거미 머리띠', 'spider headband with bobbing legs'],
        ['fascinator', 'Web fascinator', '거미줄 패시네이터', 'small spiderweb fascinator', 'f1'],
        ['crown', 'Spider crown', '거미 왕관', 'black crown topped with a spider', 'f2'],
      ],
      accessories: [
        ['legs', 'Extra legs on the back', '등에 단 다리', 'four stuffed spider legs on the back', 'F1'],
        ['brooch', 'Spider brooch', '거미 브로치', 'spider brooch'],
        ['gloves', 'Web gloves', '거미줄 장갑', 'spiderweb lace gloves', 'f1'],
        ['spin', 'Webs from the fingertips', '손끝에서 뻗는 거미줄', 'silk threads spinning from the fingertips', 'f3'],
      ],
      weapon: [
        ['toy', 'Toy spider', '장난감 거미', 'holding a toy spider'],
        ['parasol', 'Spiderweb parasol', '거미줄 양산', 'holding a spiderweb lace parasol', 'f1'],
        ['thread', 'Silk thread', '은빛 실', 'pulling a glistening silk thread', 'f3'],
      ],
      device: [
        ['web', 'Web face paint at the eye', '눈가 거미줄 분장', 'spiderweb face paint at the corner of the eye'],
        ['cheek', 'Spider on the cheek', '뺨에 그린 거미', 'small spider painted on the cheek'],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
      effect: [
        ['attic', 'Cobwebbed attic', '거미줄 쳐진 다락', 'dusty attic corner, cobwebs', 'f2'],
        ['dew', 'Giant dewy web', '이슬 맺힌 거대한 거미줄', 'giant spiderweb glittering with dew, moonlight', 'f3'],
      ],
    },
  }),

  /* ─── S-04 꿀벌과 무당벌레 ─── */
  costume('bug', 'Bee & Ladybug', '꿀벌과 무당벌레', 'S-04', {
    tag: 'halloween costume, insect costume', tagReal: 'insect costume, halloween night',
    colors: [],
    need: { headwear: 'beeant ladyant' },
    items: {
      garment: [
        ['hm-bee', 'Striped sweater', '줄무늬 스웨터', 'yellow and black striped sweater, black leggings', 'f0 F0'],
        ['hm-lady', 'Sweatshirt with felt dots', '펠트 점 맨투맨', 'red sweatshirt with black felt dots', 'f0 F0'],
        ['pt-bee', 'Striped bee tunic', '줄무늬 꿀벌 튜닉', 'bee costume, yellow and black striped tunic, black leggings', 'f1 F1 x0 v:bug-bee'],
        ['pt-bee1', 'Striped bee tulle dress', '줄무늬 꿀벌 튤 원피스', 'bee costume, yellow and black striped dress, tulle skirt', 'f1 F1 x1 gf v:bug-bee'],
        ['pt-bee2', 'Striped bee corset mini dress', '줄무늬 꿀벌 코르셋 미니 원피스', 'bee costume, yellow and black striped corset mini dress', 'f1 F1 x2 gf v:bug-bee'],
        ['pt-beem', 'Striped bee hoodie', '줄무늬 꿀벌 후드티', 'bee costume, yellow and black striped hoodie', 'f1 F1 x12 gm'],
        ['pt-lady', 'Polka dot ladybug tunic', '물방울 무당벌레 튜닉', 'ladybug costume, red polka dot tunic, black leggings', 'f1 F1 x0 v:bug-lady'],
        ['pt-lady1', 'Polka dot skater dress', '물방울 스케이터 원피스', 'ladybug costume, red polka dot skater dress', 'f1 F1 x1 gf v:bug-lady'],
        ['pt-lady2', 'Polka dot corset mini dress', '물방울 코르셋 미니 원피스', 'ladybug costume, red polka dot corset mini dress', 'f1 F1 x2 gf v:bug-lady'],
        ['pt-ladym', 'Polka dot shell vest', '물방울 등껍질 조끼', 'ladybug costume, red polka dot shell vest, black shirt', 'f1 F1 x12 gm'],
        ['ed-bee', 'Honey silk gown with velvet bands', '벨벳 띠를 두른 꿀색 실크 드레스', 'honey yellow silk gown, black velvet bands', 'f2 x0 gf v:bug-beee'],
        ['ed-bee1', 'Organza dress with a striped bodice', '줄무늬 보디스 오간자 원피스', 'yellow organza dress, black striped bodice', 'f2 x1 gf v:bug-beee'],
        ['ed-bee2', 'Striped corset and organza skirt', '줄무늬 코르셋과 오간자 스커트', 'yellow and black striped corset, short organza skirt', 'f2 x2 gf v:bug-beee'],
        ['ed-beem', 'Mustard velvet suit with stripes', '줄무늬 머스터드 벨벳 수트', 'mustard velvet suit, black stripes', 'f2 gm'],
        ['ed-lady', 'Dotted satin gown', '물방울 새틴 드레스', 'red satin gown, black dots', 'f2 x0 gf v:bug-ladye'],
        ['ed-lady1', 'Dotted taffeta dress', '물방울 태피터 원피스', 'red polka dot taffeta dress, puffed skirt', 'f2 x1 gf v:bug-ladye'],
        ['ed-lady2', 'Dotted satin mini dress', '물방울 새틴 미니 원피스', 'red polka dot satin mini dress', 'f2 x2 gf v:bug-ladye'],
        ['ed-ladym', 'Dotted velvet jacket', '물방울 벨벳 재킷', 'red polka dot velvet jacket, black trousers', 'f2 gm'],
      ],
      structure: [
        ['belt', 'Black belt', '검은 벨트', 'wide black belt'],
      ],
      foundation: [
        ['beetights', 'Striped tights', '줄무늬 타이츠', 'black and yellow striped tights', 'gf'],
        ['black', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['dots', 'Polka dot tights', '물방울 타이츠', 'polka dot tights', 'gf'],
      ],
      neckwear: [
        ['bow', 'Black bow', '검은 리본', 'black bow at the collar', 'an:low'],
      ],
      outer: [
        ['shell', 'Dotted shell cape', '물방울 등껍질 망토', 'red shell cape with black dots', 'f1'],
      ],
      footwear: [
        ['mary', 'Mary janes', '메리제인', 'black mary janes', 'gf'],
        ['rain', 'Yellow rain boots', '노란 장화', 'yellow rain boots', 'F1'],
        ['sneakers', 'Black sneakers', '검은 운동화', 'black sneakers'],
        ['red', 'Red shoes', '빨간 구두', 'red shoes', 'f1'],
      ],
      headwear: [
        ['beeant', 'Bee antenna headband', '꿀벌 더듬이 머리띠', 'bee antenna headband'],
        ['ladyant', 'Ladybug antenna headband', '무당벌레 더듬이 머리띠', 'ladybug antenna headband'],
        ['glitter', 'Glitter antennae', '반짝이 더듬이', 'glitter antenna headband', 'f1'],
        ['comb', 'Honeycomb hair clip', '벌집 머리핀', 'honeycomb hair clip', 'f2 gf'],
      ],
      accessories: [
        ['wings', 'Small sheer wings', '작고 얇은 날개', 'small sheer wings'],
        ['honeyear', 'Honeycomb earrings', '벌집 귀걸이', 'honeycomb earrings', 'f1'],
        ['shimmer', 'Wings shimmering', '반짝이는 날개', 'sheer wings shimmering with light', 'f3'],
      ],
      weapon: [
        ['dipper', 'Honey dipper', '꿀 뜨개', 'holding a honey dipper'],
        ['jar', 'Small honey jar', '작은 꿀단지', 'holding a small honey jar', 'f1'],
        ['daisy', 'Daisy', '데이지', 'holding a daisy'],
        ['leaf', 'Big leaf', '큰 잎사귀', 'holding a big green leaf'],
      ],
      device: [
        ['comb', 'Honeycomb on the cheek', '뺨에 그린 벌집', 'honeycomb painted on the cheek'],
        ['dots', 'Painted dots on the cheeks', '뺨에 그린 점', 'painted black dots on the cheeks'],
        ['pollen', 'Pollen glitter', '꽃가루 반짝이', 'gold pollen glitter dusting the face', 'f3'],
      ],
      effect: [
        ['bloom', 'Glowing flowers at night', '밤에 빛나는 꽃밭', 'giant glowing flowers at night, fireflies', 'f3'],
      ],
    },
    looks: [
      ['bee', 'w5', { garment: 'hm-bee pt-bee pt-bee1 pt-bee2 pt-beem ed-bee ed-bee1 ed-bee2 ed-beem', headwear: 'beeant glitter comb none', foundation: 'beetights black none', footwear: 'mary rain sneakers', weapon: 'dipper jar daisy _bucket _bag _apple none', device: 'comb pollen none', outer: 'none', accessories: 'wings honeyear shimmer' }],
      ['lady', 'w5', { garment: 'hm-lady pt-lady pt-lady1 pt-lady2 pt-ladym ed-lady ed-lady1 ed-lady2 ed-ladym', headwear: 'ladyant glitter none', foundation: 'dots black none', footwear: 'mary sneakers red', weapon: 'leaf daisy _bucket _bag _apple none', device: 'dots pollen none', outer: 'shell none', accessories: 'wings shimmer' }],
    ],
  }),

  /* ─── S-05 인어 ─── */
  costume('mermaid', 'Mermaid', '인어', 'S-05', {
    tag: 'halloween costume, mermaid costume', tagReal: 'mermaid costume, halloween night',
    tagM: 'halloween costume, merman costume', tagRealM: 'merman costume, halloween night',
    colors: ['teal', 'seafoam', 'turquoise', 'aqua', 'iridescent', 'lavender', 'coral'],
    items: {
      garment: [
        ['hm', 'Homemade sequin tail and shell top', '손수 꿰맨 스팽글 꼬리와 조개 상의', 'homemade mermaid tail sewn from sequin fabric over both legs, felt fin at the feet, shell print top', 'f0 F0 gf skip:footwear+foundation'],
        ['hm-m', 'Homemade sequin tail', '손수 꿰맨 스팽글 꼬리', 'homemade merman tail sewn from sequin fabric over both legs, felt fin at the feet, shell necklace', 'f0 F0 gm skip:footwear+foundation'],
        ['pt-long', 'Fishtail skirt and long-sleeved top', '피시테일 스커트와 긴소매 탑', 'mermaid costume, sequin fishtail skirt, long sleeve top', 'f1 F1 x0 gf skip:footwear+foundation v:mermaid-mm'],
        ['pt-mesh', 'Fishtail skirt and shell bralette', '피시테일 스커트와 조개 브라렛', 'mermaid costume, sequin fishtail skirt, seashell bralette under a sheer chiffon top', 'f1 F1 x1 gf skip:footwear+foundation v:mermaid-mm'],
        ['pt-shell', 'Shell bikini top and fishtail skirt', '조개 비키니 탑과 피시테일 스커트', 'mermaid costume, seashell bikini top, sequin fishtail skirt', 'f1 F1 x2 gf n:low skip:footwear+foundation v:mermaid-mm'],
        ['pt-m', 'Fishtail trousers and loose shirt', '피시테일 바지와 헐렁한 셔츠', 'merman costume, sequin fishtail trousers ending in a fin, loose shirt', 'f1 F1 x01 gm skip:footwear+foundation'],
        ['pt-m2', 'Fishtail trousers and shell harness', '피시테일 바지와 조개 하네스', 'merman costume, sequin fishtail trousers ending in a fin, seashell harness', 'f1 F1 x2 gm skip:footwear+foundation'],
        ['ed-long', 'Long-sleeved sequin mermaid gown', '긴소매 스팽글 머메이드 드레스', 'iridescent sequin mermaid gown, long sleeves, fishtail hem', 'f2 x0 gf v:mermaid-mme'],
        ['ed-off', 'Off-shoulder sequin mermaid gown', '오프숄더 스팽글 머메이드 드레스', 'off-shoulder sequin mermaid gown, fishtail train', 'f2 x1 gf n:low v:mermaid-mme'],
        ['ed-shell', 'Shell bodice and sheer fishtail skirt', '조개 보디스와 시스루 피시테일 스커트', 'iridescent seashell bodice, sheer fishtail skirt', 'f2 x2 gf n:low skip:footwear+foundation v:mermaid-mme'],
        ['ed-m', 'Sequin jacket and fishtail trousers', '스팽글 재킷과 피시테일 바지', 'iridescent sequin jacket, sequin fishtail trousers with a sheer fin train', 'f2 x01 gm skip:footwear+foundation'],
        ['ed-m2', 'Open iridescent shirt and fishtail', '풀어 헤친 무지갯빛 셔츠와 꼬리', 'open iridescent shirt, sequin fishtail trousers with a sheer fin train', 'f2 x2 gm n:low skip:footwear+foundation'],
      ],
      structure: [
        ['pearls', 'Pearl belt', '진주 벨트', 'strand of pearls draped at the hips'],
        ['net', 'Pearl strand at the hip', '허리에 늘어진 진주', 'pearl strand draped at the hip', 'f1'],
      ],
      foundation: [
        ['tights', 'Iridescent tights', '무지갯빛 타이츠', 'iridescent tights', 'x01 gf'],
      ],
      neckwear: [
        ['pearls', 'Pearl necklace', '진주 목걸이', 'pearl necklace'],
        ['shell', 'Shell choker', '조개 초커', 'seashell choker'],
      ],
      outer: [
        ['sheer', 'Sheer chiffon wrap', '얇은 시폰 숄', 'sheer chiffon wrap like sea foam', 'f2'],
      ],
      footwear: [
        ['sandals', 'Shell sandals', '조개 샌들', 'seashell sandals'],
        ['flats', 'Sparkly flats', '반짝이 플랫슈즈', 'sparkly flats', 'F1'],
        ['bare', 'Barefoot', '맨발', 'barefoot', 'f2'],
      ],
      headwear: [
        ['tiara', 'Seashell tiara', '조개 티아라', 'seashell tiara'],
        ['star', 'Starfish hair clip', '불가사리 머리핀', 'starfish hair clip', 'gf'],
        ['pearl', 'Pearl headband', '진주 머리띠', 'pearl headband'],
        ['coral', 'Coral crown', '산호 왕관', 'coral crown', 'f2'],
      ],
      accessories: [
        ['bracelets', 'Pearl bracelets', '진주 팔찌', 'pearl bracelets'],
        ['earrings', 'Shell earrings', '조개 귀걸이', 'seashell earrings'],
        ['bubbles', 'Floating bubbles', '떠오르는 물방울', 'bubbles floating upward', 'f3'],
        ['drops', 'Droplets hovering', '맴도는 물방울', 'water droplets hovering in the air', 'f3'],
      ],
      weapon: [
        ['shell', 'Seashell', '소라 껍데기', 'holding a seashell'],
        ['trident', 'Trident', '삼지창', 'holding a trident', 'f1'],
        ['clam', 'Pearl in a clam', '조개 속 진주', 'holding a pearl in an open clam shell', 'f2'],
      ],
      device: [
        ['glitter', 'Glitter freckles', '반짝이 주근깨', 'glitter freckles'],
        ['scales', 'Scale paint on the cheekbones', '광대에 그린 비늘', 'iridescent scale face paint on the cheekbones', 'f1'],
        ['gems', 'Pearl face gems', '진주 페이스 젬', 'pearl face gems', 'f2'],
      ],
      effect: [
        ['beach', 'Beach at dusk', '해 질 녘 바닷가', 'beach at dusk, waves', 'f2'],
        ['rocks', 'Moonlit sea rocks', '달빛 바다의 바위', 'sitting on rocks in a moonlit sea', 'f3'],
        ['ruins', 'Underwater ruins', '물속 폐허', 'underwater ruins, light rays from above', 'f3'],
      ],
    },
  }),

  /* ─── S-06 요정 ─── */
  costume('fairy', 'Fairy', '요정', 'S-06', {
    tag: 'halloween costume, fairy costume', tagReal: 'fairy costume, halloween night',
    colors: ['pastel pink', 'lavender', 'mint', 'sky blue', 'gold', 'lilac', 'forest green'],
    need: { accessories: 'glitter sheer large glowwings' },
    items: {
      garment: [
        ['hm', 'Tutu and leotard', '튜튜와 레오타드', 'tutu, leotard, fairy wings', 'f0 F0 gf'],
        ['hm-m', 'Tee with a leaf garland', '잎 가랜드를 두른 티셔츠', 't-shirt, leaf garland across the chest', 'f0 F0 gm'],
        ['pt-long', 'Long tulle petal dress', '꽃잎 소매 긴 튤 원피스', 'fairy costume, long tulle dress, petal sleeves', 'f1 F1 x0 gf v:fairy-fy'],
        ['pt-knee', 'Tulle petal dress', '꽃잎 튤 원피스', 'fairy costume, tulle petal dress, knee length', 'f1 F1 x1 gf v:fairy-fy'],
        ['pt-mini', 'Corset mini with a petal skirt', '꽃잎 치마 코르셋 미니 원피스', 'fairy costume, corset mini dress, petal tulle skirt', 'f1 F1 x2 gf v:fairy-fy'],
        ['pt-m', 'Leaf tunic and leggings', '잎 튜닉과 레깅스', 'fairy costume, leaf tunic, leggings', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless leaf vest', '민소매 잎 조끼', 'fairy costume, sleeveless leaf vest, leggings', 'f1 F1 x2 gm'],
        ['ed-chiffon', 'Layered chiffon gown with a petal hem', '꽃잎 밑단 겹 시폰 드레스', 'layered chiffon gown, petal hem, long sleeves', 'f2 x0 gf v:fairy-fye'],
        ['ed-petal', 'Sheer petal dress', '얇은 꽃잎 원피스', 'sheer petal dress, flower appliqué', 'f2 x1 gf v:fairy-fye'],
        ['ed-bodice', 'Petal bodice and chiffon mini skirt', '꽃잎 보디스와 시폰 미니스커트', 'petal bodice, sheer chiffon mini skirt', 'f2 x2 gf v:fairy-fye'],
        ['ed-m', 'Velvet coat with leaf embroidery', '잎 자수 벨벳 코트', 'velvet coat, leaf embroidery', 'f2 x01 gm'],
        ['ed-m2', 'Open embroidered vest', '열린 자수 조끼', 'open leaf embroidered vest, slim trousers', 'f2 x2 gm'],
      ],
      structure: [
        ['vine', 'Vine belt', '덩굴 벨트', 'vine belt with tiny flowers'],
        ['ribbon', 'Ribbon sash', '리본 허리띠', 'ribbon sash', 'gf'],
      ],
      foundation: [
        ['tights', 'White tights', '흰 타이츠', 'white tights', 'x01 gf'],
        ['glitter', 'Glitter tights', '반짝이 타이츠', 'glitter tights', 'x12 gf'],
      ],
      neckwear: [
        ['petal', 'Petal collar', '꽃잎 깃', 'petal collar', 'an:low'],
        ['dew', 'Dewdrop necklace', '이슬 목걸이', 'dewdrop crystal necklace', 'f1'],
      ],
      outer: [
        ['capelet', 'Petal capelet', '꽃잎 케이플릿', 'petal capelet', 'f1'],
        ['cape', 'Sheer chiffon cape', '얇은 시폰 망토', 'sheer chiffon cape', 'f2'],
      ],
      footwear: [
        ['flats', 'Ballet flats', '발레 플랫', 'ballet flats'],
        ['sandals', 'Lace-up sandals', '끈 샌들', 'lace-up sandals', 'f1'],
        ['bare', 'Barefoot', '맨발', 'barefoot', 'f2'],
      ],
      headwear: [
        ['crown', 'Flower crown', '화관', 'flower crown'],
        ['circlet', 'Leaf circlet', '잎 머리띠', 'leaf circlet', 'f1'],
        ['glow', 'Glowing flower crown', '빛나는 화관', 'glowing flower crown', 'f3'],
      ],
      accessories: [
        ['glitter', 'Glitter wings', '반짝이 날개', 'glitter wings', 'F1'],
        ['sheer', 'Sheer iridescent wings', '얇은 무지갯빛 날개', 'sheer iridescent wings', 'f1'],
        ['large', 'Large translucent wings', '커다란 투명 날개', 'large translucent wings', 'f2'],
        ['glowwings', 'Glowing wings with sparkles', '반짝임이 흩날리는 빛나는 날개', 'glowing wings, drifting sparkles', 'f3'],
        ['bracelet', 'Flower bracelets', '꽃 팔찌', 'flower bracelets'],
      ],
      weapon: [
        ['star', 'Star wand', '별 지팡이', 'holding a star wand'],
        ['flower', 'Flower wand', '꽃 지팡이', 'holding a flower wand', 'f1'],
        ['dust', 'Sprinkling glitter dust', '반짝이 가루 뿌리기', 'sprinkling glitter dust', 'f1'],
        ['jar', 'Jar of fireflies', '반딧불이 병', 'holding a glowing jar of fireflies', 'f2'],
      ],
      device: [
        ['glitter', 'Glitter on the cheekbones', '광대 위 반짝이', 'glitter on the cheekbones'],
        ['vines', 'Painted vines at the temple', '관자놀이의 덩굴 그림', 'painted flower vines at the temple', 'f1'],
        ['glow', 'Glowing freckles', '빛나는 주근깨', 'softly glowing freckles', 'f3'],
      ],
      effect: [
        ['mushrooms', 'Enchanted forest', '빛나는 버섯 숲', 'enchanted forest, glowing mushrooms', 'f3'],
        ['meadow', 'Moonlit meadow', '달빛 풀밭', 'moonlit meadow, fireflies', 'f3'],
      ],
    },
  }),

  /* ─── S-07 천사 ─── */
  costume('angel', 'Angel', '천사', 'S-07', {
    tag: 'halloween costume, angel costume', tagReal: 'angel costume, halloween night',
    colors: ['white', 'ivory', 'gold', 'pearl white', 'sky blue', 'champagne'],
    need: { accessories: 'small feather large glow', headwear: 'tinsel halo glow' },
    items: {
      garment: [
        ['hm', 'Nightgown with paper wings', '종이 날개 잠옷 원피스', 'white nightgown, paper wings', 'f0 F0 gf'],
        ['hm-m', 'Tee and trousers', '티셔츠와 바지', 'white t-shirt, white trousers', 'f0 F0'],
        ['pt-long', 'Long flowing-sleeved dress', '흐르는 소매 긴 원피스', 'angel costume, long dress, flowing sleeves', 'f1 F1 x0 gf v:angel-an'],
        ['pt-knee', 'Knee-length chiffon dress', '무릎 길이 시폰 원피스', 'angel costume, chiffon dress, knee length', 'f1 F1 x1 gf v:angel-an'],
        ['pt-mini', 'Feather-trimmed corset mini dress', '깃털 트림 코르셋 미니 원피스', 'angel costume, corset mini dress, feather trim', 'f1 F1 x2 gf n:low v:angel-an'],
        ['pt-m', 'Tunic and trousers', '튜닉과 바지', 'angel costume, tunic, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open robe', '열린 로브', 'angel costume, open robe, trousers', 'f1 F1 x2 gm n:low'],
        ['ed-silk', 'Draped silk gown with a gold belt', '금 벨트 드레이프 실크 드레스', 'silk gown, draped sleeves, gold belt', 'f2 x0 gf v:angel-ane'],
        ['ed-pleat', 'Pleated chiffon gown', '주름 시폰 드레스', 'pleated chiffon gown', 'f2 x1 gf v:angel-ane'],
        ['ed-slip', 'Low-back satin slip gown', '등 파인 새틴 슬립 드레스', 'satin slip gown, low back', 'f2 x2 gf v:angel-ane'],
        ['ed-m', 'Linen suit with gold embroidery', '금 자수 리넨 수트', 'linen suit, gold embroidery', 'f2 x01 gm'],
        ['ed-m2', 'Open linen shirt', '풀어 헤친 리넨 셔츠', 'linen shirt open at the chest, trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['cord', 'Gold cord belt', '금색 끈 허리띠', 'gold cord belt'],
      ],
      foundation: [
        ['tights', 'White tights', '흰 타이츠', 'white tights', 'x01 gf'],
        ['stock', 'White thighhighs', '흰 사이하이', 'white thighhighs', 'x12 gf'],
      ],
      neckwear: [
        ['cross', 'Small gold pendant', '작은 금 펜던트', 'small gold pendant'],
        ['pearl', 'Pearl choker', '진주 초커', 'pearl choker', 'f1'],
      ],
      outer: [
        ['shawl', 'Sheer shawl', '얇은 숄', 'sheer white shawl', 'f1'],
      ],
      footwear: [
        ['sandals', 'Gold sandals', '금색 샌들', 'gold sandals'],
        ['sneakers', 'White sneakers', '흰 운동화', 'white sneakers', 'F1'],
        ['heels', 'Strappy heels', '끈 힐', 'strappy heels', 'f1 gf'],
        ['bare', 'Barefoot', '맨발', 'barefoot', 'f2'],
      ],
      headwear: [
        ['tinsel', 'Tinsel halo', '반짝이 모루 헤일로', 'tinsel halo headband', 'F1'],
        ['halo', 'Gold halo headband', '금색 헤일로 머리띠', 'gold halo headband'],
        ['leaf', 'Gold leaf crown', '금잎 관', 'gold leaf crown', 'f2'],
        ['glow', 'Glowing halo', '빛나는 헤일로', 'glowing halo above the head', 'f3'],
      ],
      accessories: [
        ['small', 'Small white wings', '작은 흰 날개', 'small white wings', 'F1'],
        ['feather', 'Feather wings', '깃털 날개', 'feather wings'],
        ['large', 'Large feather wings', '커다란 깃털 날개', 'large white feather wings', 'f2'],
        ['glow', 'Softly glowing wings', '은은하게 빛나는 날개', 'wings glowing softly', 'f3'],
        ['cuff', 'Gold cuff', '금 팔찌', 'gold arm cuff', 'f1'],
      ],
      weapon: [
        ['bow', 'Toy bow and arrow', '장난감 활과 화살', 'holding a toy bow and heart arrow', 'F1'],
        ['harp', 'Small harp', '작은 하프', 'holding a small harp', 'f1'],
        ['candle', 'Candle', '양초', 'holding a candle'],
        ['dove', 'White dove', '흰 비둘기', 'holding a white dove', 'f2 c:animal'],
      ],
      device: [
        ['gold', 'Gold glitter on the cheekbones', '광대 위 금빛 반짝이', 'gold glitter on the cheekbones'],
        ['glow', 'Soft glow on the face', '얼굴의 은은한 빛', 'soft radiant glow on the face', 'f3'],
      ],
      effect: [
        ['stairs', 'Marble staircase', '대리석 계단', 'white marble staircase', 'f2'],
        ['clouds', 'Clouds at sunset', '노을 진 구름', 'clouds at sunset, light rays', 'f3'],
      ],
    },
  }),

  /* ─── S-08 유니콘 ─── */
  costume('unicorn', 'Unicorn', '유니콘', 'S-08', {
    tag: 'halloween costume, unicorn costume', tagReal: 'unicorn costume, halloween night',
    colors: ['pastel rainbow', 'pastel pink', 'lavender', 'mint', 'white', 'iridescent'],
    need: { headwear: 'horn gold glow' },
    items: {
      garment: [
        ['hm', 'Hoodie with a felt mane', '펠트 갈기 단 후드티', 'hoodie with a felt rainbow mane sewn on the hood', 'f0 F0'],
        ['pt-onesie', 'Hooded unicorn jumpsuit', '후드 유니콘 점프슈트', 'unicorn costume, hooded jumpsuit, rainbow mane on the hood', 'f1 F1 x0'],
        ['pt-tutu', 'Pastel tutu dress', '파스텔 튜튜 원피스', 'unicorn costume, pastel tutu dress, rainbow tulle', 'f1 F1 x1 gf v:unicorn-un'],
        ['pt-mini', 'Iridescent corset mini dress', '무지갯빛 코르셋 미니 원피스', 'unicorn costume, iridescent corset mini dress, rainbow tulle skirt', 'f1 F1 x2 gf v:unicorn-un'],
        ['pt-m', 'Hoodie with rainbow trim', '무지개 트림 후드티', 'unicorn costume, hoodie, rainbow trim', 'f1 F1 x12 gm'],
        ['ed-ball', 'Rainbow tulle ball gown', '무지개 튤 볼가운', 'iridescent ball gown, rainbow tulle layers', 'f2 x0 gf v:unicorn-une'],
        ['ed-holo', 'Holographic dress', '홀로그램 원피스', 'holographic dress, pastel tulle', 'f2 x1 gf v:unicorn-une'],
        ['ed-mini', 'Holographic mini dress', '홀로그램 미니 원피스', 'holographic mini dress, sheer rainbow tulle', 'f2 x2 gf v:unicorn-une'],
        ['ed-m', 'Velvet suit with holographic trim', '홀로그램 트림 벨벳 수트', 'velvet suit, holographic trim', 'f2 gm'],
      ],
      structure: [
        ['ribbon', 'Rainbow ribbon sash', '무지개 리본 허리띠', 'rainbow ribbon sash'],
      ],
      foundation: [
        ['rainbow', 'Rainbow striped tights', '무지개 줄무늬 타이츠', 'rainbow striped tights', 'gf'],
        ['white', 'White tights', '흰 타이츠', 'white tights', 'x01 gf'],
        ['knee', 'Rainbow knee socks', '무지개 니삭스', 'rainbow knee socks', 'x12'],
      ],
      neckwear: [
        ['star', 'Star necklace', '별 목걸이', 'star charm necklace'],
      ],
      outer: [
        ['cape', 'Iridescent cape', '무지갯빛 망토', 'iridescent cape', 'f1'],
      ],
      footwear: [
        ['sneakers', 'White sneakers', '흰 운동화', 'white sneakers', 'F1'],
        ['boots', 'Iridescent boots', '무지갯빛 부츠', 'iridescent boots', 'f1'],
        ['heels', 'Glitter heels', '반짝이 힐', 'glitter heels', 'f2 gf'],
      ],
      headwear: [
        ['horn', 'Unicorn horn headband', '유니콘 뿔 머리띠', 'unicorn horn headband'],
        ['flower', 'Glitter horn with flowers', '꽃 단 반짝이 뿔', 'glitter unicorn horn with flowers', 'f1'],
        ['gold', 'Gold spiral horn', '금색 나선 뿔', 'gold spiral horn headpiece', 'f2'],
        ['glow', 'Horn glowing with rainbow light', '무지갯빛으로 빛나는 뿔', 'horn headband glowing with rainbow light', 'f3'],
      ],
      accessories: [
        ['tail', 'Rainbow tulle tail', '무지개 튤 꼬리', 'rainbow tulle tail'],
        ['clips', 'Star bracelet', '별 팔찌', 'star charm bracelet', 'gf'],
        ['trail', 'Rainbow sparkles trailing', '흩날리는 무지개 반짝임', 'rainbow sparkles trailing behind', 'f3'],
      ],
      weapon: [
        ['lolly', 'Rainbow lollipop', '무지개 막대사탕', 'holding a rainbow swirl lollipop'],
        ['wand', 'Star wand', '별 지팡이', 'holding a star wand', 'f1'],
        ['cotton', 'Cotton candy', '솜사탕', 'holding cotton candy', 'f1'],
      ],
      device: [
        ['glitter', 'Rainbow glitter on the cheeks', '뺨의 무지개 반짝이', 'rainbow glitter on the cheeks'],
        ['gems', 'Star face gems', '별 페이스 젬', 'star face gems', 'f1'],
        ['glow', 'Pastel glow', '파스텔빛 광채', 'pastel shimmer glowing on the cheeks', 'f3'],
      ],
      effect: [
        ['carnival', 'Candy-colored carnival', '사탕 빛 놀이공원', 'candy-colored carnival at night', 'f2'],
        ['clouds', 'Pastel clouds and rainbow', '파스텔 구름과 무지개', 'pastel clouds, rainbow arching overhead', 'f3'],
      ],
    },
  }),

  /* ─── S-09 빨간 망토 ─── */
  costume('redhood', 'Red Riding Hood', '빨간 모자', 'S-09', {
    tag: 'halloween costume, little red riding hood costume', tagReal: 'red riding hood, halloween night',
    tagM: 'halloween costume, woodsman costume', tagRealM: 'woodsman, halloween night',
    colors: ['cream', 'white', 'gingham blue', 'brown', 'black'],
    need: { outer: '' },
    items: {
      garment: [
        ['hm', 'Plain dress', '수수한 원피스', 'plain dress, long sleeves', 'f0 F0 gf'],
        ['hm-m', 'Flannel shirt and jeans', '플란넬 셔츠와 청바지', 'flannel shirt, jeans, suspenders', 'f0 F0 gm'],
        ['pt-long', 'Peasant dress with an apron', '앞치마 두른 시골 원피스', 'red riding hood costume, peasant dress, long sleeves', 'f1 F1 x0 gf v:redhood-rh'],
        ['pt-bodice', 'Lace-up bodice dress', '끈 보디스 원피스', 'red riding hood costume, peasant dress, lace-up bodice, knee length', 'f1 F1 x1 gf v:redhood-rh'],
        ['pt-mini', 'Ruffled corset mini dress', '러플 코르셋 미니 원피스', 'red riding hood costume, corset mini dress, ruffled skirt', 'f1 F1 x2 gf n:low v:redhood-rh'],
        ['pt-m', 'Woodsman flannel and suspenders', '나무꾼 플란넬과 멜빵', 'woodsman costume, plaid flannel shirt, suspenders, work trousers', 'f1 F1 gm'],
        ['ed-linen', 'Smocked linen dress', '스모킹 리넨 원피스', 'linen dress, smocked bodice, long skirt', 'f2 x0 gf v:redhood-rhe'],
        ['ed-layer', 'Puff blouse and layered skirt', '퍼프 블라우스와 겹 스커트', 'puff sleeve blouse, lace-up bodice, layered skirt', 'f2 x1 gf v:redhood-rhe'],
        ['ed-off', 'Off-shoulder blouse and short skirt', '오프숄더 블라우스와 짧은 치마', 'off-shoulder blouse, corset bodice, short layered skirt', 'f2 x2 gf n:low v:redhood-rhe'],
        ['ed-m', 'Wool waistcoat and corduroy trousers', '울 조끼와 코듀로이 바지', 'woodsman, wool waistcoat, linen shirt, corduroy trousers', 'f2 gm'],
      ],
      structure: [
        ['apron', 'White apron', '흰 앞치마', 'white apron', 'gf'],
        ['bodice', 'Lace-up bodice belt', '끈 보디스 벨트', 'lace-up bodice belt', 'x12 gf'],
        ['belt', 'Leather belt', '가죽 벨트', 'leather belt', 'gm'],
      ],
      foundation: [
        ['socks', 'White knee socks', '흰 니삭스', 'white knee socks', 'gf'],
        ['stock', 'White stockings', '흰 스타킹', 'white stockings', 'x01 gf'],
        ['striped', 'Red and white striped stockings', '빨강 흰 줄무늬 스타킹', 'red and white striped stockings', 'x12 gf'],
      ],
      neckwear: [
        ['ribbon', 'Ribbon at the collar', '깃의 리본', 'ribbon bow at the collar', 'gf'],
        ['kerchief', 'Neckerchief', '네커치프', 'neckerchief', 'gm'],
      ],
      outer: [
        ['cape', 'Red hooded cape', '빨간 후드 망토', 'red hooded cape', 'gf'],
        ['capelet', 'Red hooded capelet', '빨간 후드 케이플릿', 'short red hooded capelet', 'f1 x12 gf'],
        ['cloak', 'Red velvet cloak', '빨간 벨벳 망토', 'red velvet hooded cloak', 'f2 gf'],
        ['mcoat', 'Wool coat', '울 코트', 'wool coat', 'gm'],
      ],
      footwear: [
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['boots', 'Lace-up boots', '끈 부츠', 'lace-up boots'],
        ['red', 'Red shoes', '빨간 구두', 'red shoes', 'f1 gf'],
      ],
      headwear: [
        ['up', 'Red hood up', '쓴 빨간 후드', 'red hood up over the head', 'gf'],
        ['bow', 'Red bow', '빨간 리본', 'red hair bow', 'gf'],
        ['cap', 'Wool cap', '울 모자', 'wool cap', 'gm'],
      ],
      accessories: [
        ['flowers', 'Flower bracelet', '꽃 팔찌', 'wildflower bracelet', 'gf'],
        ['gloves', 'Work gloves', '작업 장갑', 'leather work gloves', 'gm'],
        ['eyes', 'Wolf eyes in the dark', '어둠 속 늑대 눈', 'pair of wolf eyes glowing in the dark behind', 'f3'],
      ],
      weapon: [
        ['basket', 'Basket of bread and apples', '빵과 사과 바구니', 'holding a basket of bread and apples'],
        ['bouquet', 'Wildflowers', '들꽃 다발', 'holding a bouquet of wildflowers', 'gf'],
        ['axe', 'Axe', '도끼', 'holding an axe over the shoulder', 'f1'],
        ['lantern', 'Lantern', '랜턴', 'holding a lantern', 'f2'],
        ['candy', 'Basket of candy', '사탕 바구니', 'holding a wicker basket full of wrapped candy', ''],
        ['rifle', 'Prop hunting rifle', '소품 사냥총', 'holding a prop hunting rifle over the shoulder', 'f2'],
      ],
      device: [
        ['freckles', 'Painted freckles', '그린 주근깨', 'painted freckles'],
        ['heart', 'Heart on the cheek', '뺨의 하트', 'small heart painted on the cheek', 'gf'],
      ],
      effect: [
        ['path', 'Dark forest path', '어두운 숲길', 'dark forest path, twisted trees', 'f2'],
        ['cottage', 'Grandmother\'s cottage', '할머니의 오두막', 'cottage in the woods at night, warm window', 'f3'],
      ],
    },
  }),

  /* ─── S-10 공주 ─── */
  costume('princess', 'Princess', '공주', 'S-10', {
    tag: 'halloween costume, princess costume', tagReal: 'enchanted princess costume, halloween night',
    tagM: 'halloween costume, prince costume', tagRealM: 'enchanted prince costume, halloween night',
    colors: ['pink', 'sky blue', 'lavender', 'gold', 'mint', 'yellow', 'ivory', 'black', 'burgundy', 'deep purple', 'pumpkin orange'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Party dress', '파티 원피스', 'party dress, puffed sleeves', 'f0 F0 gf'],
        ['hm-m', 'Shirt with a felt sash', '펠트 띠를 맨 셔츠', 'button shirt, felt sash across the chest', 'f0 F0 gm'],
        ['pt-ball', 'Pumpkin-embroidered ball gown', '호박 자수 볼가운', 'princess costume, ball gown, puff sleeves, jack-o\'-lantern embroidery along the skirt hem, scalloped tulle edging', 'f1 F1 x0 gf v:princess-pr nb'],
        ['pt-satin', 'Bat-embroidered satin dress', '박쥐 자수 새틴 원피스', 'princess costume, satin dress, puffed skirt, knee length, small bat embroidery along the overskirt', 'f1 F1 x1 gf v:princess-pr'],
        ['pt-mini', 'Pumpkin corset mini dress', '호박 장식 코르셋 미니 원피스', 'princess costume, satin corset mini dress, layered tulle skirt, jack-o\'-lantern appliques at the waist', 'f1 F1 x2 gf n:low v:princess-pr'],
        ['pt-m', 'Bat-embroidered prince jacket', '박쥐 자수 왕자 재킷', 'prince costume, double-breasted jacket, bat-embroidered sash, fitted trousers, pumpkin-shaped jeweled buttons', 'f1 F1 gm'],
        ['ed-silk', 'Thorn-rose silk ball gown', '가시 장미 실크 볼가운', 'princess costume, silk ball gown, long sleeves, full skirt, thorn-vine embroidery, wilted rose appliques along the overskirt', 'f2 x0 gf v:princess-pre nb'],
        ['ed-off', 'Midnight rose ball gown', '한밤의 장미 볼가운', 'princess costume, off-shoulder ball gown, full tulle skirt, thorn-vine embroidery, small jack-o\'-lantern ornaments at the waist', 'f2 x1 gf n:low v:princess-pre nb'],
        ['ed-slit', 'Thorn-rose corset gown', '가시 장미 코르셋 가운', 'princess costume, corset ball gown bodice, high slit tulle skirt, thorn-vine embroidery, bat-shaped lace edging', 'f2 x2 gf n:low v:princess-pre nb'],
        ['ed-m', 'Thorn-rose velvet prince coat', '가시 장미 벨벳 왕자 코트', 'prince costume, velvet coat, thorn-vine embroidery, satin sash, pumpkin-shaped jeweled buttons, fitted trousers', 'f2 gm'],
      ],
      structure: [
        ['sash', 'Satin sash', '새틴 허리띠', 'satin sash with a bow', 'gf'],
        ['jewel', 'Jeweled belt', '보석 벨트', 'jeweled belt', 'f2'],
      ],
      foundation: [
        ['tights', 'White tights', '흰 타이츠', 'white tights', 'x01 gf'],
        ['sheer', 'Sheer stockings', '살색 스타킹', 'sheer stockings', 'x12 gf'],
      ],
      neckwear: [
        ['pearls', 'Pearl necklace', '진주 목걸이', 'pearl necklace'],
        ['jewel', 'Jeweled necklace', '보석 목걸이', 'jeweled necklace', 'f2 gf'],
        ['cravat', 'Cravat', '크라바트', 'cravat', 'gm an:low'],
      ],
      outer: [
        ['cape', 'Velvet cape', '벨벳 망토', 'velvet cape', 'f1'],
        ['ermine', 'Faux ermine cape', '인조 어민 망토', 'cape trimmed with faux ermine', 'f2'],
      ],
      footwear: [
        ['glitter', 'Glitter shoes', '반짝이 구두', 'glitter shoes', 'F1'],
        ['satin', 'Satin heels', '새틴 힐', 'satin heels', 'f1 gf'],
        ['glass', 'Glass slippers', '유리 구두', 'glass slippers', 'f2 gf'],
        ['boots', 'Polished boots', '광낸 부츠', 'polished riding boots', 'gm'],
      ],
      headwear: [
        ['plastic', 'Pumpkin tiara', '호박 장식 티아라', 'tiara with a small jeweled jack-o\'-lantern ornament', 'f1 F1 gf'],
        ['tiara', 'Thorn-rose tiara', '가시 장미 티아라', 'tiara shaped like thorny rose vines', 'gf'],
        ['crown', 'Bat-wing jeweled crown', '박쥐 날개 보석 왕관', 'jeweled crown with bat-wing-shaped points', 'f2'],
        ['gold', 'Pumpkin prince crown', '호박 장식 왕자 왕관', 'gold crown with a jeweled jack-o\'-lantern crest', 'gm'],
        ['star', 'Glowing thorn crown', '빛나는 가시 왕관', 'thorn-vine crown with softly glowing rose-shaped jewels', 'f3'],
      ],
      accessories: [
        ['gloves', 'Long satin gloves', '긴 새틴 장갑', 'long satin gloves', 'f1 gf'],
        ['earrings', 'Pearl earrings', '진주 귀걸이', 'pearl earrings', 'gf'],
        ['sparkle', 'Sparkles around the skirt', '치맛자락의 반짝임', 'sparkles swirling around the skirt', 'f3'],
        ['brooch', 'Pumpkin royal brooch', '호박 왕실 브로치', 'jeweled jack-o\'-lantern brooch pinned at the chest', 'f1'],
      ],
      weapon: [
        ['frog', 'Frog', '개구리', 'holding a little frog', 'F1 c:animal'],
        ['rose', 'Dark rose with thorns', '가시 돋친 검은 장미', 'holding a dark rose with a thorny stem'],
        ['scepter', 'Pumpkin scepter', '호박 홀', 'holding a royal scepter topped with a jeweled jack-o\'-lantern', 'f1'],
        ['fan', 'Bat-pattern lace fan', '박쥐 무늬 레이스 부채', 'holding a lace fan with bat-shaped cutouts', 'f1 gf'],
        ['candy', 'Pumpkin candy pouch', '호박 사탕 주머니', 'holding a pumpkin-shaped velvet pouch filled with wrapped candy', 'f1'],
        ['apple', 'Enchanted candy apple', '마법의 사탕 사과', 'holding a dark candy apple with a small skull-shaped sugar decoration', 'f1'],
      ],
      device: [
        ['rose', 'Small rose cheek paint', '볼의 작은 장미 분장', 'small rose painted on the cheek'],
      ],
      effect: [
        ['ballroom', 'Halloween castle ballroom', '성의 할로윈 무도회장', 'candlelit castle ballroom, autumn garlands, carved jack-o\'-lanterns beside the staircase', 'f2'],
        ['fireworks', 'Moonlit castle balcony', '달빛 아래 성의 발코니', 'castle balcony under a full moon, glowing jack-o\'-lanterns along the balustrade', 'f3'],
        ['rose', 'Enchanted rose under glass', '유리 덮개 속 마법의 장미', 'enchanted rose under a glass dome, petals glowing', 'f3'],
      ],
    },
  }),

  /* ─── S-11 해적 ─── */
  costume('pirate', 'Pirate', '해적', 'S-11', {
    tag: 'halloween costume, pirate costume', tagReal: 'pirate, halloween night',
    colors: ['black', 'burgundy', 'brown', 'navy', 'cream', 'red'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Striped shirt and cut-offs', '줄무늬 셔츠와 자른 바지', 'striped shirt, cut-off trousers', 'f0 F0'],
        ['pt-long', 'Puffy blouse and long skirt', '퍼프 블라우스와 긴 치마', 'pirate costume, puffy sleeve blouse, long skirt', 'f1 F1 x0 gf v:pirate-pi'],
        ['pt-vest', 'Blouse, corset vest and skirt', '블라우스와 코르셋 조끼, 치마', 'pirate costume, puff sleeve blouse, corset vest, knee length skirt', 'f1 F1 x1 gf v:pirate-pi'],
        ['pt-mini', 'Off-shoulder blouse and mini skirt', '오프숄더 블라우스와 미니스커트', 'pirate costume, off-shoulder blouse, corset, mini skirt', 'f1 F1 x2 gf n:low v:pirate-pi'],
        ['pt-m', 'Puffy shirt, vest and striped trousers', '퍼프 셔츠와 조끼, 줄무늬 바지', 'pirate costume, puffy shirt, vest, striped trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open puffy shirt', '풀어 헤친 퍼프 셔츠', 'pirate costume, open puffy shirt, leather trousers', 'f1 F1 x2 gm n:low'],
        ['ed-coat', 'Brocade frock coat and long skirt', '브로케이드 프록코트와 긴 치마', 'brocade frock coat, ruffled blouse, long skirt', 'f2 x0 gf v:pirate-pie'],
        ['ed-bodice', 'Ruffled blouse and corset bodice', '러플 블라우스와 코르셋 보디스', 'ruffled blouse, corset bodice, layered skirt', 'f2 x1 gf v:pirate-pie'],
        ['ed-leather', 'Ruffled blouse and leather corset', '러플 블라우스와 가죽 코르셋', 'off-shoulder ruffled blouse, leather corset, short skirt', 'f2 x2 gf n:low v:pirate-pie'],
        ['ed-m', 'Brocade coat and breeches', '브로케이드 코트와 반바지', 'brocade frock coat, ruffled shirt, breeches', 'f2 x01 gm'],
        ['ed-m2', 'Open ruffled shirt and sash', '풀어 헤친 러플 셔츠와 띠', 'open ruffled shirt, sash, breeches', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['sash', 'Sash belt', '띠 허리띠', 'sash tied at the hip'],
        ['corset', 'Leather corset vest', '가죽 코르셋 조끼', 'leather corset vest', 'x12 gf'],
        ['buckle', 'Big buckle belt', '큰 버클 벨트', 'wide belt with a big buckle'],
      ],
      foundation: [
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['kerchief', 'Neckerchief', '네커치프', 'neckerchief'],
        ['coin', 'Gold coin necklace', '금화 목걸이', 'gold coin necklace', 'f1'],
      ],
      outer: [
        ['coat', 'Long captain\'s coat', '긴 선장 코트', 'long captain\'s coat', 'f1'],
        ['tattered', 'Tattered coat', '해진 코트', 'tattered long coat', 'f2'],
      ],
      footwear: [
        ['boots', 'Tall boots', '롱부츠', 'tall boots'],
        ['buckle', 'Buckled shoes', '버클 구두', 'buckled shoes'],
        ['cuffed', 'Cuffed boots', '접은 부츠', 'cuffed boots', 'f2'],
      ],
      headwear: [
        ['bandana', 'Bandana', '반다나', 'bandana tied on the head'],
        ['tricorn', 'Tricorn hat', '삼각모', 'tricorn hat', 'f1'],
        ['feather', 'Feathered tricorn', '깃털 삼각모', 'feathered tricorn hat', 'f2'],
      ],
      accessories: [
        ['patch', 'Eye patch', '안대', 'eye patch'],
        ['hoops', 'Gold hoop earrings', '금 링 귀걸이', 'gold hoop earrings'],
        ['parrot', 'Parrot on the shoulder', '어깨 위 앵무새', 'parrot perched on the shoulder', 'f1 c:animal'],
        ['compass', 'Compass on a cord', '끈 달린 나침반', 'brass compass on a leather cord', 'f1'],
        ['hook', 'Prop hook hand', '소품 갈고리 손', 'prop pirate hook hand', 'f1'],
        ['coins', 'Ghostly glowing coins', '유령빛으로 빛나는 금화', 'cursed gold coins glowing faintly', 'f3'],
      ],
      weapon: [
        ['toy', 'Toy sword', '장난감 칼', 'holding a toy sword', 'F1'],
        ['cutlass', 'Cutlass', '커틀러스', 'holding a cutlass', 'f1'],
        ['spyglass', 'Spyglass', '망원경', 'holding a spyglass', 'f1'],
        ['map', 'Treasure map', '보물 지도', 'holding a treasure map'],
        ['lantern', 'Lantern', '랜턴', 'holding a ship\'s lantern', 'f2'],
      ],
      device: [
        ['mustache', 'Drawn-on mustache', '그린 콧수염', 'drawn-on curly mustache', 'F1'],
        ['soot', 'Soot smudges', '그을음 자국', 'soot smudges on the cheek'],
        ['ghost', 'Ghostly eyes', '유령빛 눈', 'pale ghostly glowing eyes', 'f3'],
      ],
      effect: [
        ['deck', 'Ship deck at night', '밤의 배 갑판', 'ship deck at night, lanterns', 'f2'],
        ['ghostship', 'Ghost ship in the fog', '안개 속 유령선', 'ghost ship in the fog, tattered sails', 'f3'],
      ],
    },
  }),

  /* ─── S-12 허수아비 ─── */
  costume('scarecrow', 'Scarecrow', '허수아비', 'S-12', {
    tag: 'halloween costume, scarecrow costume', tagReal: 'scarecrow costume, halloween night',
    colors: ['tan', 'brown', 'mustard', 'rust', 'olive', 'denim blue', 'burnt orange'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Flannel and overalls with straw cuffs', '지푸라기 꽂은 플란넬과 멜빵바지', 'plaid flannel shirt, overalls, straw stuffed at the cuffs', 'f0 F0'],
        ['pt-overalls', 'Patched overalls', '기운 멜빵바지', 'scarecrow costume, plaid shirt, patched overalls', 'f1 F1 x0'],
        ['pt-dress', 'Patched plaid dress', '기운 체크 원피스', 'scarecrow costume, plaid dress, patched skirt', 'f1 F1 x1 gf v:scarecrow-sc'],
        ['pt-crop', 'Plaid crop top and denim shorts', '체크 크롭 탑과 데님 반바지', 'scarecrow costume, plaid crop top, patched denim shorts', 'f1 F1 x2 gf v:scarecrow-sc'],
        ['pt-m', 'Patched flannel and burlap trousers', '기운 플란넬과 삼베 바지', 'scarecrow costume, patched flannel shirt, burlap trousers', 'f1 F1 x1 gm'],
        ['pt-m2', 'Unbuttoned flannel and overalls', '풀어 헤친 플란넬과 멜빵바지', 'scarecrow costume, unbuttoned flannel, patched overalls', 'f1 F1 x2 gm'],
        ['ed-burlap', 'Burlap patchwork dress', '삼베 패치워크 원피스', 'burlap patchwork dress', 'f2 x0 gf'],
        ['ed-plaid', 'Plaid patchwork dress with straw trim', '지푸라기 트림 체크 패치워크 원피스', 'plaid patchwork dress, straw trim', 'f2 x1 gf'],
        ['ed-corset', 'Plaid corset and patchwork mini', '체크 코르셋과 패치워크 미니스커트', 'plaid corset, patchwork mini skirt, straw trim', 'f2 x2 gf'],
        ['ed-m', 'Patchwork tweed coat', '패치워크 트위드 코트', 'patchwork tweed coat, burlap trousers', 'f2 gm'],
      ],
      structure: [
        ['rope', 'Rope belt', '밧줄 허리띠', 'rope belt'],
      ],
      foundation: [
        ['socks', 'Striped socks', '줄무늬 양말', 'striped socks'],
        ['tights', 'Patched tights', '기운 타이츠', 'patched tights', 'gf'],
      ],
      neckwear: [
        ['bandana', 'Neck bandana', '목 반다나', 'bandana tied at the neck'],
      ],
      outer: [
        ['vest', 'Patched vest', '기운 조끼', 'patched vest', 'f1'],
      ],
      footwear: [
        ['old', 'Old boots', '낡은 부츠', 'old boots'],
        ['work', 'Work boots', '작업화', 'work boots'],
      ],
      headwear: [
        ['straw', 'Straw hat', '밀짚모자', 'straw hat'],
        ['floppy', 'Floppy patched hat', '처진 기운 모자', 'floppy patched hat', 'f1'],
      ],
      accessories: [
        ['straw', 'Straw poking out', '삐져나온 지푸라기', 'straw poking out of the cuffs'],
        ['gloves', 'Patched gloves', '기운 장갑', 'patched gloves'],
        ['crow', 'Crow on the shoulder', '어깨 위 까마귀', 'crow perched on the shoulder', 'f2 c:animal'],
        ['drift', 'Straw drifting in the wind', '바람에 날리는 지푸라기', 'straw drifting in the wind', 'f3'],
      ],
      weapon: [
        ['fork', 'Hay fork', '건초 쇠스랑', 'holding a hay fork', 'f1'],
        ['corn', 'Corn stalk', '옥수숫대', 'holding a corn stalk'],
        ['pumpkin', 'Small pumpkin', '작은 호박', 'holding a small pumpkin'],
      ],
      device: [
        ['smile', 'Stitched smile face paint', '꿰맨 미소 분장', 'stitched smile face paint'],
        ['nose', 'Painted triangle nose', '그린 세모 코', 'painted triangle nose'],
        ['patches', 'Patches painted on the cheeks', '뺨에 그린 천 조각', 'patches painted on the cheeks', 'f1'],
      ],
      effect: [
        ['cornfield', 'Cornfield at dusk', '해 질 녘 옥수수밭', 'cornfield at dusk, crows overhead', 'f2'],
        ['harvest', 'Harvest moon over the field', '들판 위 수확의 달', 'cornfield under a huge harvest moon', 'f3'],
      ],
    },
  }),

  /* ─── S-13 앨리스 ─── */
  costume('alice', 'Alice', '앨리스', 'S-13', {
    tag: 'halloween costume, cosplay', tagReal: 'halloween night',
    colors: [],
    need: { weapon: 'patched stained blackrose redrose pumpkin chocolates' },
    items: {
      garment: [
        ['hm', 'Blue dress and kitchen apron', '파란 원피스와 앞치마', 'alice (alice in wonderland), blue dress, white kitchen apron', 'f0 F0'],
        ['pt-long', 'Long blue dress with a pinafore', '피너포어 두른 긴 파란 원피스', 'alice (alice in wonderland), long blue dress, white pinafore apron', 'f1 F1 x0 v:alice-al'],
        ['pt-knee', 'Blue dress with a pinafore', '피너포어 두른 파란 원피스', 'alice (alice in wonderland), blue dress, white pinafore apron, knee length, puff sleeves', 'f1 F1 x1 v:alice-al'],
        ['pt-short', 'Short blue dress with a pinafore', '피너포어 두른 짧은 파란 원피스', 'alice (alice in wonderland), short blue dress, white apron, puff sleeves', 'f1 F1 x2 v:alice-al'],
        ['ed-silk', 'Blue silk dress with a lace pinafore', '레이스 피너포어 파란 실크 원피스', 'alice (alice in wonderland), blue silk dress, lace pinafore', 'f2 x0 v:alice-ale'],
        ['ed-ruffle', 'Ruffled pinafore and petticoat', '러플 피너포어와 페티코트', 'alice (alice in wonderland), blue dress, ruffled pinafore, petticoat', 'f2 x1 v:alice-ale'],
        ['ed-corset', 'Blue corset dress', '파란 코르셋 원피스', 'alice (alice in wonderland), blue corset dress, short ruffled pinafore', 'f2 x2 v:alice-ale'],
      ],
      structure: [],
      foundation: [
        ['white', 'White tights', '흰 타이츠', 'white tights', 'x01'],
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'black and white striped stockings', 'x12'],
      ],
      neckwear: [],
      outer: [],
      footwear: [
        ['mary', 'Black mary janes', '검은 메리제인', 'black mary janes'],
        ['boots', 'Buckled boots', '버클 부츠', 'buckled boots'],
      ],
      headwear: [
        ['bow', 'Black hair bow', '검은 머리 리본', 'black hair bow'],
      ],
      accessories: [
        ['watch', 'Pocket watch', '회중시계', 'pocket watch'],
        ['cards', 'Playing card brooch', '카드 브로치', 'playing card brooch', 'f1'],
        ['blackrose', 'Black rose on the apron', '앞치마의 검은 장미', 'black rose pinned to the apron', ''],
        ['redrose', 'Red rose ribbon', '붉은 장미 리본', 'red rose ribbon at the apron waist', ''],
        ['web', 'Spiderweb apron lace', '거미줄 앞치마 레이스', 'spiderweb lace along the apron hem', ''],
        ['fall', 'Floating teacups', '떠다니는 찻잔', 'teacups and clocks floating around', 'f3'],
      ],
      weapon: [
        ['teacup', 'Teacup', '찻잔', 'holding a teacup'],
        ['bottle', 'Little potion bottle', '작은 물약병', 'holding a little potion bottle with a tag', 'f1'],
        ['rabbit', 'White rabbit plush', '흰 토끼 인형', 'holding a white rabbit plush', 'F1'],
        ['patched', 'Patchwork doll', '기운 인형', 'holding a patchwork doll with mismatched buttons', ''],
        ['stained', 'Stained patchwork doll', '피 얼룩 묻은 기운 인형', 'holding a patchwork doll with a small faux bloodstain on its dress', 'f1'],
        ['blackrose', 'Black rose', '검은 장미', 'holding a black rose', ''],
        ['redrose', 'Red rose', '붉은 장미', 'holding a red rose', ''],
        ['pumpkin', 'Pumpkin candy pouch', '호박 사탕 주머니', 'holding a small jack-o\'-lantern candy pouch', ''],
        ['chocolates', 'Wrapped chocolates', '포장 초콜릿', 'holding wrapped chocolates', ''],
      ],
      device: [],
      effect: [
        ['tea', 'Mad tea party', '이상한 다과회', 'long tea party table, mismatched teacups', 'f2'],
        ['hole', 'Falling down the rabbit hole', '토끼굴 속으로', 'falling down a rabbit hole, clocks and books floating', 'f3'],
      ],
    },
  }),

  /* ─── S-15 붉은 여왕 ─── */
  costume('redqueen', 'Red Queen', '붉은 여왕', 'S-15', {
    tag: 'halloween costume, red queen costume, playing card motif',
    tagM: 'halloween costume, red king costume, playing card motif',
    tagReal: 'red queen costume, halloween night', tagRealM: 'red king costume, halloween night',
    colors: ['crimson', 'black', 'burgundy', 'ivory'],
    need: { headwear: 'crown' },
    items: {
      garment: [
        ['pt-long', 'Red queen gown', '붉은 여왕 긴 드레스', 'red queen costume, structured bodice, heart-shaped panels, long bell skirt', 'f1 x0 gf'],
        ['pt-knee', 'Card suit queen dress', '카드 무늬 여왕 원피스', 'red queen costume, fitted bodice, playing card skirt panels, knee-length bell skirt', 'f1 x1 gf'],
        ['pt-short', 'Short red queen dress', '짧은 붉은 여왕 원피스', 'red queen costume, fitted bodice, heart-shaped overskirt, short layered skirt', 'f1 x2 gf'],
        ['pt-m', 'Red king tailcoat', '붉은 왕 연미복', 'red king costume, heart-patterned waistcoat, tailored tailcoat, trousers', 'f1 x01 gm'],
        ['pt-m2', 'Open red king jacket', '풀어 입은 붉은 왕 재킷', 'red king costume, open tailored jacket, heart-patterned vest, fitted trousers', 'f1 x2 gm'],
        ['ed-f', 'Velvet card queen gown', '벨벳 카드 여왕 드레스', 'red queen gown, velvet paneled bodice, layered card-suit appliques, sweeping bell skirt', 'f2 x01 gf'],
        ['ed-m', 'Velvet card king coat', '벨벳 카드 왕 코트', 'red king coat, velvet lapels, embroidered card suits, long coat tails', 'f2 gm'],
      ],
      structure: [['belt', 'Heart buckle belt', '하트 버클 허리띠', 'belt with a heart-shaped buckle', '']],
      foundation: [['stripe', 'Card-suit stockings', '카드 무늬 스타킹', 'playing card suit stockings', 'gf'], ['black', 'Black tights', '검은 타이츠', 'black tights', 'gf']],
      neckwear: [['ruff', 'Small pleated ruff', '작은 주름 깃', 'pleated ruff collar', 'an:high'], ['heart', 'Heart pendant', '하트 펜던트', 'heart pendant', '']],
      outer: [['cape', 'Short royal cape', '짧은 왕실 망토', 'short velvet cape', ''], ['mantle', 'Card-patterned mantle', '카드 무늬 망토', 'playing card patterned mantle', 'f2']],
      footwear: [['boots', 'Button boots', '단추 부츠', 'button boots', ''], ['heels', 'Buckled heels', '버클 힐', 'buckled heels', 'gf']],
      headwear: [['crown', 'Red queen crown', '붉은 여왕 왕관', 'small pointed crown with heart-shaped details', '']],
      accessories: [['rose', 'Black rose', '검은 장미', 'black rose pinned at the waist', ''], ['cards', 'Card brooch', '카드 브로치', 'playing card brooch', '']],
      weapon: [['rose', 'Red rose', '붉은 장미', 'holding a red rose', ''], ['cards', 'Playing cards', '카드', 'holding a fan of playing cards', ''], ['candy', 'Heart-shaped chocolates', '하트 초콜릿', 'holding heart-shaped chocolates', '']],
      device: [['heart', 'Heart cheek paint', '볼 하트 분장', 'small heart painted on one cheek', '']],
      effect: [['garden', 'Dark rose garden', '어두운 장미 정원', 'moonlit rose garden, dark hedges', 'f2']],
    },
  }),

  /* ─── S-16 시계토끼 ─── */
  costume('clockrabbit', 'Clock Rabbit', '시계토끼', 'S-16', {
    tag: 'halloween costume, clock rabbit costume', tagReal: 'clock rabbit costume, halloween night',
    colors: ['ivory', 'burgundy', 'navy', 'black', 'cream'],
    need: { headwear: 'ears', weapon: 'watch' },
    items: {
      garment: [
        ['pt-f', 'Rabbit waistcoat dress', '토끼 조끼 원피스', 'clock rabbit costume, fitted waistcoat, puff-sleeve blouse, layered skirt', 'f1 x01 gf'],
        ['pt-short', 'Short rabbit waistcoat dress', '짧은 토끼 조끼 원피스', 'clock rabbit costume, fitted waistcoat, ribbon-front blouse, short pleated skirt', 'f1 x2 gf'],
        ['pt-m', 'Rabbit waistcoat and coat', '토끼 조끼와 코트', 'clock rabbit costume, buttoned waistcoat, short tailcoat, tailored trousers', 'f1 x01 gm'],
        ['pt-m2', 'Open rabbit waistcoat', '풀어 입은 토끼 조끼', 'clock rabbit costume, open waistcoat, rolled sleeves, fitted trousers', 'f1 x2 gm'],
        ['ed-f', 'Velvet rabbit coat dress', '벨벳 토끼 코트 원피스', 'clock rabbit costume, velvet fitted coat dress, scalloped cuffs, layered skirt', 'f2 x01 gf'],
        ['ed-m', 'Velvet rabbit tailcoat', '벨벳 토끼 연미복', 'clock rabbit costume, velvet tailcoat, ornate waistcoat, long coat tails', 'f2 gm'],
      ],
      structure: [['belt', 'Watch-chain waist belt', '시계 장식 허리띠', 'waist belt with small clock charms', '']],
      foundation: [['tights', 'Opaque tights', '불투명 타이츠', 'opaque tights', 'gf'], ['stripe', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'gf']],
      neckwear: [['bow', 'Large bow tie', '큰 보타이', 'large bow tie', ''], ['ruff', 'Pleated collar', '주름 깃', 'pleated collar', 'an:high']],
      outer: [['cape', 'Short clock cape', '짧은 시계 망토', 'short cape with embroidered clock faces', '']],
      footwear: [['boots', 'Button boots', '단추 부츠', 'button boots', ''], ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf']],
      headwear: [['ears', 'Rabbit ears', '토끼 귀', 'rabbit ear headband', '']],
      accessories: [['tail', 'Rabbit tail prop', '토끼 꼬리 소품', 'small fabric rabbit tail attached to the costume', ''], ['rose', 'Black rose brooch', '검은 장미 브로치', 'black rose brooch', '']],
      weapon: [['watch', 'Large pocket watch', '큰 회중시계', 'holding an oversized pocket watch', ''], ['candy', 'Wrapped candy', '포장 사탕', 'holding wrapped candy', '']],
      device: [['whiskers', 'Soft whisker makeup', '수염 분장', 'soft whisker lines painted on the cheeks', '']],
      effect: [['tea', 'Twilight tea garden', '황혼의 다과 정원', 'twilight tea garden, scattered playing cards', 'f2']],
    },
  }),

  /* ─── S-14 모자 장수 ─── */
  costume('hatter', 'Mad Hatter', '모자 장수', 'S-14', {
    tag: 'halloween costume, cosplay', tagReal: 'halloween night',
    colors: [],
    items: {
      garment: [
        ['hm', 'Thrifted coat and patterned scarf', '헌 코트와 무늬 스카프', 'mad hatter, thrifted coat, patterned scarf', 'f0 F0'],
        ['pt-coat', 'Patterned coat and mismatched waistcoat', '무늬 코트와 짝짝이 조끼', 'mad hatter, patterned coat, mismatched waistcoat', 'f1 F1'],
        ['ed-velvet', 'Velvet tailcoat and patchwork waistcoat', '벨벳 연미복과 패치워크 조끼', 'mad hatter, velvet tailcoat, patchwork waistcoat', 'f2'],
      ],
      structure: [],
      foundation: [
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'striped stockings'],
      ],
      neckwear: [
        ['bow', 'Oversized bow tie', '큰 보타이', 'oversized bow tie'],
      ],
      outer: [],
      footwear: [
        ['boots', 'Buckled boots', '버클 부츠', 'buckled boots'],
        ['spats', 'Two-tone shoes', '투톤 구두', 'two-tone shoes'],
      ],
      headwear: [
        ['tophat', 'Oversized top hat', '커다란 실크해트', 'oversized top hat with a card in the band'],
      ],
      accessories: [
        ['watch', 'Pocket watch', '회중시계', 'pocket watch'],
        ['spools', 'Thread spools on the coat', '코트에 단 실패', 'thread spools pinned to the coat', 'f1'],
        ['fall', 'Floating teacups', '떠다니는 찻잔', 'teacups and clocks floating around', 'f3'],
      ],
      weapon: [
        ['teapot', 'Teapot', '찻주전자', 'holding a teapot'],
        ['teacup', 'Teacup', '찻잔', 'holding a teacup'],
        ['hat', 'Tipping the hat', '모자 들어 인사', 'tipping the top hat', 'f1'],
      ],
      device: [
        ['paint', 'Colored eye paint', '색 눈가 분장', 'bright colored paint around the eyes', 'f1'],
      ],
      effect: [
        ['tea', 'Mad tea party', '이상한 다과회', 'long tea party table, mismatched teacups', 'f2'],
        ['hole', 'Falling down the rabbit hole', '토끼굴 속으로', 'falling down a rabbit hole, clocks and books floating', 'f3'],
      ],
    },
  }),


  /* ─── S-17 태엽 무희 — 오르골 · 태엽 장난감. 남성 차림은 태엽 병정 ─── */
  costume('windup', 'Wind-up Dancer', '태엽 무희', 'S-17', {
    tag: 'halloween costume, wind-up doll costume, music box ballerina costume', tagReal: 'wind-up doll, halloween night',
    tagM: 'halloween costume, wind-up toy soldier costume', tagRealM: 'wind-up toy soldier, halloween night',
    colors: ['dusty rose', 'ivory', 'powder blue', 'red', 'navy', 'gold'],
    need: { accessories: 'key' },
    items: {
      garment: [
        ['hm', 'Leotard and tulle skirt', '레오타드와 튤 치마', 'leotard, tulle skirt, cardboard wind-up key', 'f0 F0 gf'],
        ['pt-long', 'Long-sleeved ballet dress', '긴소매 발레 원피스', 'music box ballerina costume, long-sleeved ballet dress, long tulle skirt', 'f1 F1 x0 gf v:windup-wd'],
        ['pt-tutu', 'Tutu dress', '튀튀 원피스', 'music box ballerina costume, tutu dress, puff sleeves', 'f1 F1 x1 gf v:windup-wd'],
        ['pt-short', 'Leotard and short tutu', '레오타드와 짧은 튀튀', 'music box ballerina costume, sleeveless leotard, short stiff tutu', 'f1 F1 x2 gf v:windup-wd'],
        ['pt-m', 'Toy soldier jacket', '장난감 병정 재킷', 'toy soldier costume, red double-breasted jacket, white trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open toy soldier jacket', '풀어 입은 병정 재킷', 'toy soldier costume, open military jacket, white trousers', 'f1 F1 x2 gm'],
        ['ed-dress', 'Porcelain-doll ballet gown', '도자기 인형 발레 드레스', 'porcelain doll ballet gown, layered tulle, satin bodice, cracked glaze pattern', 'f2 x0 gf v:windup-wde'],
        ['ed-tutu', 'Satin bodice and platter tutu', '새틴 보디스와 접시 튀튀', 'satin bodice, platter tutu, gold trim', 'f2 x1 gf v:windup-wde'],
        ['ed-short', 'Corset bodice and short tutu', '코르셋 보디스와 짧은 튀튀', 'satin corset bodice, short layered tutu, gold trim', 'f2 x2 gf v:windup-wde'],
        ['ed-m', 'Brass-button soldier coat', '황동 단추 병정 코트', 'toy soldier coat, brass buttons, gold braid, white breeches', 'f2 x012 gm'],
      ],
      structure: [
        ['sash', 'Satin sash', '새틴 띠', 'satin sash with a bow', 'gf'],
        ['belt', 'White crossbelt', '흰 십자 벨트', 'white crossbelt', 'gm'],
      ],
      foundation: [
        ['tights', 'Ballet tights', '발레 타이츠', 'pink ballet tights', 'gf'],
        ['white', 'White stockings', '흰 스타킹', 'white stockings', 'gf'],
      ],
      neckwear: [
        ['ribbon', 'Ribbon choker', '리본 초커', 'satin ribbon choker', 'gf'],
        ['collar', 'High gold collar', '금빛 깃', 'high gold-trimmed collar', 'gm'],
      ],
      outer: [
        ['shrug', 'Lace shrug', '레이스 볼레로', 'short lace shrug', 'f1 gf'],
      ],
      footwear: [
        ['pointe', 'Pointe shoes', '토슈즈', 'pointe shoes, ribbons laced up the ankle', 'gf'],
        ['boots', 'Black boots', '검은 부츠', 'shiny black boots', 'gm'],
      ],
      headwear: [
        ['tiara', 'Small tiara', '작은 티아라', 'small tiara', 'gf'],
        ['bun', 'Bun ribbon', '쪽머리 리본', 'satin ribbon tied around a bun', 'gf'],
        ['shako', 'Tall soldier hat', '높은 병정 모자', 'tall toy soldier shako hat', 'gm'],
      ],
      accessories: [
        ['key', 'Wind-up key on the back', '등에 단 태엽 열쇠', 'large wind-up key on the back'],
        ['joints', 'Painted doll joints', '그린 인형 관절', 'doll joint lines painted on the elbows and knees', 'f1 c:joint'],
        ['spin', 'Turning slowly on one toe', '한 발로 천천히 도는 몸', 'spinning slowly on one toe like a music box figure', 'f3 gf'],
      ],
      weapon: [
        ['box', 'Music box', '오르골', 'holding an open music box'],
        ['drum', 'Toy drum', '장난감 북', 'holding a toy drum', 'gm'],
        ['rifle', 'Toy wooden rifle', '장난감 나무 총', 'holding a toy wooden rifle', 'f1 gm'],
      ],
      device: [
        ['blush', 'Round blush circles', '동그란 볼 분장', 'round painted doll blush on the cheeks'],
        ['crack', 'Painted porcelain cracks', '그린 도자기 금', 'painted porcelain crack lines on the cheek', 'f1'],
        ['glass', 'Glassy doll eyes', '유리알 같은 눈', 'glassy doll eyes', 'f3'],
      ],
      effect: [
        ['box', 'Inside a giant music box', '커다란 오르골 안', 'standing on a giant music box stage, mirrored lid', 'f2'],
        ['shop', 'Toy shop after closing', '문 닫은 장난감 가게', 'old toy shop after closing, shelves of dolls, moonlight', 'f3'],
      ],
    },
  }),

  /* ─── S-18 구체관절 인형 — 얼굴은 손대지 않는다(얼굴 분장 없음). 관절은 팔 · 손에만, 'joint' 필터로 끌 수 있다 ─── */
  costume('bjd', 'Ball-jointed Doll', '구체관절 인형', 'S-18', {
    tag: 'halloween costume, antique doll costume', tagReal: 'living doll, halloween night',
    colors: ['ivory', 'black', 'dusty rose', 'powder blue', 'burgundy', 'cream', 'navy'],
    items: {
      garment: [
        ['hm', 'Frilled dress and big bow', '프릴 원피스와 큰 리본', 'frilled dress, big hair bow', 'f0 F0 gf'],
        ['hm-m', 'Shorts suit and knee socks', '반바지 정장과 무릎 양말', 'shorts suit, knee socks, bow tie', 'f0 F0 gm'],
        ['pt-lolita', 'Classic lolita dress', '클래식 롤리타 드레스', 'doll costume, classic lolita dress, puff sleeves, layered lace petticoat', 'f1 F1 x0 gf n:high v:bjd-pt'],
        ['pt-sailor', 'Sailor-collar dress', '세일러 칼라 원피스', 'doll costume, sailor collar dress, pleated skirt, ribbon tie', 'f1 F1 x1 gf v:bjd-pt'],
        ['pt-short', 'Short pinafore dress', '짧은 앞치마 원피스', 'doll costume, short pinafore dress, frilled blouse, petticoat', 'f1 F1 x2 gf v:bjd-pt'],
        ['pt-m', 'Shorts suit with a cape collar', '케이프 칼라 반바지 정장', 'doll costume, velvet shorts suit, cape collar, knee socks', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open waistcoat and shorts', '풀어 입은 조끼와 반바지', 'doll costume, open velvet waistcoat, frilled shirt, shorts', 'f1 F1 x2 gm'],
        ['ed-gown', 'Antique lace gown', '앤틱 레이스 드레스', 'antique doll gown, ivory lace, tiered skirt, high collar', 'f2 x0 gf n:high v:bjd-ed'],
        ['ed-velvet', 'Velvet doll dress', '벨벳 인형 드레스', 'velvet doll dress, square collar, lace cuffs, full petticoat', 'f2 x1 gf v:bjd-ed'],
        ['ed-corset', 'Corset doll dress', '코르셋 인형 드레스', 'satin corset doll dress, short layered skirt, lace trim', 'f2 x2 gf v:bjd-ed'],
        ['ed-m', 'Victorian doll suit', '빅토리아풍 인형 정장', 'victorian doll suit, lace jabot, velvet shorts, knee socks', 'f2 x01 gm'],
      ],
      structure: [
        ['sash', 'Wide satin sash', '넓은 새틴 띠', 'wide satin sash with a back bow', 'gf'],
        ['suspenders', 'Suspenders', '멜빵', 'thin suspenders', 'gm'],
      ],
      foundation: [
        ['socks', 'Lace knee socks', '레이스 무릎 양말', 'white lace knee socks', 'gf'],
        ['tights', 'White tights', '흰 타이츠', 'white tights', 'gf'],
      ],
      neckwear: [
        ['ribbon', 'Ribbon choker', '리본 초커', 'satin ribbon choker', 'gf'],
        ['jabot', 'Lace jabot', '레이스 자보', 'lace jabot', 'an:high'],
      ],
      outer: [
        ['cape', 'Short capelet', '짧은 케이프', 'short velvet capelet', 'f1'],
      ],
      footwear: [
        ['mary', 'Mary janes', '메리제인 구두', 'round-toe mary jane shoes'],
        ['boots', 'Button boots', '단추 부츠', 'antique button boots', 'f1'],
      ],
      headwear: [
        ['bow', 'Big hair bow', '큰 머리 리본', 'big satin hair bow', 'gf'],
        ['bonnet', 'Lace bonnet', '레이스 보닛', 'lace bonnet tied under the chin', 'f1 gf'],
        ['beret', 'Velvet beret', '벨벳 베레모', 'velvet beret', 'gm'],
      ],
      accessories: [
        ['arms', 'Ball joints at the elbows and wrists', '팔꿈치 · 손목 구체관절', 'visible ball joints at the elbows and wrists', 'c:joint'],
        ['hands', 'Jointed doll fingers', '마디 진 인형 손가락', 'ball-jointed doll hands, visible finger joints', 'f1 c:joint'],
        ['tag', 'Name tag on a ribbon', '리본에 단 이름표', 'small paper name tag tied on with a ribbon', ''],
        ['key', 'Wind-up key on the back', '등에 단 태엽 열쇠', 'small wind-up key on the back', 'f1'],
        ['strings', 'Thin puppet strings', '가는 인형 줄', 'thin strings rising from the wrists', 'f3'],
      ],
      weapon: [
        ['teddy', 'Small teddy bear', '작은 곰 인형', 'holding a small teddy bear'],
        ['parasol', 'Lace parasol', '레이스 양산', 'holding a lace parasol', 'f1'],
        ['teacup', 'Tiny teacup', '작은 찻잔', 'holding a tiny porcelain teacup', 'f1'],
      ],
      device: [],
      effect: [
        ['shelf', 'Doll shop shelf', '인형 가게 진열장', 'old doll shop, glass display shelves, rows of dolls', 'f2'],
        ['box', 'Inside a doll box', '인형 상자 안', 'standing inside an open vintage doll box, satin lining', 'f2'],
        ['attic', 'Dusty attic', '먼지 쌓인 다락', 'dusty attic, moonlight through a round window, old toys', 'f3'],
      ],
    },
  }),

  /* ─── S-19 체셔 고양이 — 그 고양이처럼 보이는 '의상'. 줄무늬 옷이 알아볼 표시라 얼굴 웃음 분장 · 사라지는 연출은 넣지 않는다 ─── */
  costume('cheshire', 'Cheshire Cat', '체셔 고양이', 'S-19', {
    tag: 'halloween costume, cheshire cat costume, purple and pink stripes', tagReal: 'cheshire cat costume, halloween night, purple and pink stripes',
    colors: ['violet', 'hot pink', 'lavender', 'magenta', 'deep purple'],
    need: { headwear: 'ears ears-hat ears-bow' },
    items: {
      garment: [
        ['hm', 'Striped sweater and skirt', '줄무늬 스웨터와 치마', 'purple and pink striped sweater, purple skirt', 'f0 F0 gf'],
        ['hm-m', 'Striped hoodie and jeans', '줄무늬 후드티와 청바지', 'purple and pink striped hoodie, jeans', 'f0 F0 gm'],
        ['pt-long', 'Striped dress, long sleeves', '긴소매 줄무늬 원피스', 'cheshire cat costume, purple and pink striped dress, long sleeves, knee length', 'f1 F1 x0 gf v:cheshire-pt'],
        ['pt-puff', 'Striped puff-sleeve dress', '줄무늬 퍼프 소매 원피스', 'cheshire cat costume, purple and pink striped dress, puff sleeves, flared skirt', 'f1 F1 x1 gf v:cheshire-pt'],
        ['pt-short', 'Striped crop top and skirt', '줄무늬 크롭 상의와 치마', 'cheshire cat costume, purple and pink striped crop top, short pleated skirt', 'f1 F1 x2 gf v:cheshire-pt'],
        ['pt-m', 'Striped jacket and trousers', '줄무늬 재킷과 바지', 'cheshire cat costume, purple and pink striped jacket, purple trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open striped vest', '풀어 입은 줄무늬 조끼', 'cheshire cat costume, open purple and pink striped vest, fitted trousers', 'f1 F1 x2 gm'],
        ['ed-gown', 'Striped velvet gown', '줄무늬 벨벳 드레스', 'purple and pink striped velvet gown, layered tulle underskirt', 'f2 x0 gf v:cheshire-ed'],
        ['ed-corset', 'Striped corset dress', '줄무늬 코르셋 원피스', 'purple and pink striped corset dress, short ruffled skirt', 'f2 x2 gf v:cheshire-ed'],
        ['ed-m', 'Striped tailcoat', '줄무늬 연미복', 'purple and pink striped tailcoat, lavender waistcoat, purple trousers', 'f2 x012 gm'],
      ],
      structure: [
        ['bow', 'Pink waist bow', '분홍 허리 리본', 'big pink bow at the waist', 'gf'],
        ['belt', 'Purple belt', '보라 벨트', 'purple belt', ''],
      ],
      foundation: [
        ['stripe', 'Striped thigh-highs', '줄무늬 니삭스', 'purple and pink striped thigh-high socks', 'gf'],
        ['tights', 'Purple tights', '보라 타이츠', 'purple tights', 'gf'],
      ],
      neckwear: [
        ['bell', 'Bell collar', '방울 목걸이', 'pink collar with a small bell', 'gf'],
        ['bowtie', 'Striped bow tie', '줄무늬 나비넥타이', 'purple and pink striped bow tie', ''],
      ],
      outer: [
        ['hoodie', 'Cat-ear striped hoodie', '고양이 귀 줄무늬 후드', 'purple and pink striped hoodie with cat ears, hood down', 'f1'],
      ],
      footwear: [
        ['mary', 'Purple mary janes', '보라 메리제인', 'purple mary jane shoes', 'gf'],
        ['boots', 'Striped boots', '줄무늬 부츠', 'purple and pink striped boots', 'f1'],
        ['shoes', 'Purple shoes', '보라 구두', 'purple shoes', 'gm'],
      ],
      headwear: [
        ['ears', 'Striped cat ears', '줄무늬 고양이 귀', 'purple and pink striped cat ear headband'],
        ['ears-hat', 'Cat ears and mini top hat', '고양이 귀와 미니 실크해트', 'striped cat ear headband, tilted mini top hat', 'f1'],
        ['ears-bow', 'Cat ears with a bow', '리본 단 고양이 귀', 'striped cat ear headband with a pink bow', 'gf'],
      ],
      accessories: [
        ['tail', 'Striped tail', '줄무늬 꼬리', 'long purple and pink striped tail'],
        ['paws', 'Striped paw gloves', '줄무늬 발 장갑', 'purple and pink striped paw gloves', 'f1'],
        ['sleeves', 'Striped arm warmers', '줄무늬 팔토시', 'purple and pink striped arm warmers', ''],
      ],
      weapon: [
        ['teacup', 'Teacup', '찻잔', 'holding a teacup'],
        ['card', 'Playing card', '트럼프 카드', 'holding a playing card', 'f1'],
        ['yarn', 'Ball of yarn', '털실 뭉치', 'holding a ball of purple yarn', ''],
      ],
      device: [],
      effect: [
        ['branch', 'On a tree branch', '나뭇가지 위', 'sitting on a crooked tree branch, twilight forest', 'f2'],
        ['party', 'Mad tea party table', '엉망진창 티 파티 식탁', 'long tea party table, mismatched teacups, lanterns', 'f2'],
      ],
    },
  }),
]);

/* ═══════════════════════════════════════════════════════════════════
 * RETRO PARTY — 시대 · 직업 고전 분장 11
 * 그 시대풍 분장이지 재현이 아니다. 연대 고증은 Rosette 의 것이다.
 * ═══════════════════════════════════════════════════════════════════ */
const retro = collection('retro', 'RETRO PARTY', 'PA·TFY·III', 'decades and legends',
  ['black', 'gold', 'champagne', 'red', 'hot pink', 'silver', 'turquoise', 'ivory'],
  [

  /* ─── R-01 플래퍼 ─── */
  costume('flapper', 'Flapper', '플래퍼', 'R-01', {
    tag: 'halloween costume, 1920s flapper costume', tagReal: '1920s flapper, halloween night',
    tagM: 'halloween costume, 1920s gentleman costume', tagRealM: '1920s gentleman, halloween night',
    colors: ['black', 'gold', 'champagne', 'silver', 'red', 'emerald'],
    items: {
      garment: [
        ['hm', 'Slip dress with sewn fringe', '술을 꿰매 단 슬립 원피스', 'slip dress with rows of fringe sewn on', 'f0 F0 gf'],
        ['hm-m', 'Vest, shirt and suspenders', '조끼와 셔츠, 멜빵', 'white shirt, vest, suspenders, trousers', 'f0 F0 gm'],
        ['pt-long', 'Long-sleeved fringe dress', '긴소매 술 장식 원피스', 'flapper costume, fringe dress, long sheer sleeves, drop waist', 'f1 F1 x0 gf v:flapper-fl'],
        ['pt-fringe', 'Sleeveless fringe dress', '민소매 술 장식 원피스', 'flapper costume, sleeveless fringe dress, drop waist, knee length', 'f1 F1 x1 gf v:flapper-fl'],
        ['pt-mini', 'Short sequin fringe dress', '짧은 스팽글 술 원피스', 'flapper costume, short sequin fringe dress, low back', 'f1 F1 x2 gf v:flapper-fl'],
        ['pt-m', 'Pinstripe suit', '핀스트라이프 수트', '1920s costume, pinstripe suit, vest', 'f1 F1 gm'],
        ['ed-beaded', 'Beaded silk gown', '구슬 장식 실크 드레스', 'beaded silk gown, art deco pattern, sheer sleeves', 'f2 x0 gf v:flapper-fle'],
        ['ed-deco', 'Art deco sequin dress', '아르데코 스팽글 원피스', 'art deco sequin dress, beaded fringe hem', 'f2 x1 gf v:flapper-fle'],
        ['ed-low', 'Low-back beaded mini dress', '등 파인 구슬 미니 원피스', 'beaded fringe mini dress, deep v back', 'f2 x2 gf v:flapper-fle'],
        ['ed-m', 'Three-piece suit', '쓰리피스 수트', 'three-piece suit, wide lapels, pocket square', 'f2 gm'],
      ],
      structure: [
        ['sash', 'Hip sash', '골반 띠', 'satin sash at the hips', 'gf'],
      ],
      foundation: [
        ['seam', 'Seamed stockings', '심 스타킹', 'seamed stockings', 'gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
        ['garter', 'Garter on one thigh', '한쪽 허벅지 가터', 'lace garter on one thigh', 'x2 gf'],
      ],
      neckwear: [
        ['pearls', 'Long pearl strand', '긴 진주 목걸이', 'long pearl necklace knotted at the chest'],
        ['bow', 'Bow tie', '보타이', 'bow tie', 'gm'],
      ],
      outer: [
        ['boa', 'Feather boa', '깃털 보아', 'feather boa', 'gf'],
        ['coat', 'Fur-collared coat', '털 깃 코트', 'coat with a faux fur collar', 'f2'],
      ],
      footwear: [
        ['tbar', 'T-strap heels', 'T스트랩 힐', 't-strap heels', 'gf'],
        ['mary', 'Mary jane heels', '메리제인 힐', 'mary jane heels', 'gf'],
        ['spats', 'Two-tone oxfords', '투톤 옥스퍼드', 'two-tone oxford shoes', 'gm'],
      ],
      headwear: [
        ['band', 'Feather headband', '깃털 머리띠', 'beaded headband with a feather'],
        ['cloche', 'Cloche hat', '클로슈 모자', 'cloche hat', 'f1 gf'],
        ['jewel', 'Jeweled headpiece', '보석 머리 장식', 'jeweled art deco headpiece', 'f2 gf'],
        ['fedora', 'Fedora', '페도라', 'fedora', 'gm'],
      ],
      accessories: [
        ['gloves', 'Long satin gloves', '긴 새틴 장갑', 'long satin gloves', 'gf'],
        ['bracelets', 'Stacked bangles', '겹친 팔찌', 'stacked bangles', 'gf'],
        ['watch', 'Pocket watch', '회중시계', 'pocket watch', 'gm'],
        ['confetti', 'Gold confetti in the air', '허공의 금빛 색종이', 'gold confetti drifting in the air', 'f3'],
      ],
      weapon: [
        ['holder', 'Long cigarette holder', '긴 담뱃대', 'holding a long cigarette holder', 'f1 gf'],
        ['fan', 'Feather fan', '깃털 부채', 'holding a feather fan', 'gf'],
        ['coupe', 'Champagne coupe', '샴페인 쿠프 잔', 'holding a champagne coupe', 'f1'],
        ['dance', 'Doing the charleston', '찰스턴 춤', 'dancing the charleston', 'f1'],
      ],
      device: [
        ['beauty', 'Beauty mark', '애교점', 'painted beauty mark'],
        ['gems', 'Gems at the temple', '관자놀이의 보석', 'tiny gems at the temple', 'f2'],
      ],
      effect: [
        ['speakeasy', 'Speakeasy', '스피크이지 바', 'speakeasy, jazz band, low amber light', 'f2'],
        ['ghostparty', 'Ghostly jazz party', '유령들의 재즈 파티', 'ghostly 1920s party, translucent dancers, art deco hall', 'f3'],
      ],
    },
  }),

  /* ─── R-02 갱스터와 연인 ─── */
  costume('gangster', 'Gangster & Moll', '갱스터와 연인', 'R-02', {
    tag: 'halloween costume, 1930s gangster costume', tagReal: '1930s gangster, halloween night',
    colors: ['black', 'charcoal', 'navy', 'red', 'burgundy', 'cream'],
    items: {
      garment: [
        ['hm', 'Dad\'s blazer and slacks', '아빠 블레이저와 슬랙스', 'oversized blazer, slacks, white shirt', 'f0 F0'],
        ['hm-f', 'Satin dress', '새틴 원피스', 'satin slip dress, long cardigan', 'f0 F0 gf'],
        ['pt-suit', 'Pinstripe suit', '핀스트라이프 수트', 'gangster costume, pinstripe suit, black shirt', 'f1 F1 x01'],
        ['pt-moll', 'Satin bias dress', '바이어스 새틴 원피스', 'gangster moll costume, satin bias cut dress, knee length', 'f1 F1 x1 gf'],
        ['pt-mini', 'Pinstripe vest and mini skirt', '핀스트라이프 조끼와 미니스커트', 'gangster costume, pinstripe vest, pinstripe mini skirt', 'f1 F1 x2 gf'],
        ['pt-m2', 'Shirt sleeves and suspenders', '셔츠 소매와 멜빵', 'gangster costume, rolled shirt sleeves, suspenders, pinstripe trousers', 'f1 F1 x2 gm'],
        ['ed-suit', 'Double-breasted chalk stripe suit', '더블 초크 스트라이프 수트', 'double-breasted chalk stripe suit', 'f2 x01'],
        ['ed-gown', 'Bias-cut satin gown', '바이어스 새틴 드레스', 'bias cut satin gown, cowl neck', 'f2 x0 gf n:own'],
        ['ed-slit', 'Satin gown with a slit', '슬릿 새틴 드레스', 'satin gown, thigh slit, open back', 'f2 x12 gf'],
        ['ed-m2', 'Waistcoat and loosened collar', '조끼와 풀어 놓은 깃', 'waistcoat, shirt with the collar loosened, pinstripe trousers', 'f2 x2 gm'],
      ],
      structure: [
        ['suspenders', 'Suspenders', '멜빵', 'suspenders'],
        ['belt', 'Thin belt', '가는 벨트', 'thin belt', 'gf'],
      ],
      foundation: [
        ['seam', 'Seamed stockings', '심 스타킹', 'seamed stockings', 'gf'],
      ],
      neckwear: [
        ['tie', 'Wide tie', '넓은 넥타이', 'wide silk tie', 'an:low+own'],
        ['pearls', 'Pearl choker', '진주 초커', 'pearl choker', 'gf'],
      ],
      outer: [
        ['trench', 'Trench coat', '트렌치코트', 'trench coat', 'f1'],
        ['fur', 'Faux fur stole', '인조 털 스톨', 'faux fur stole', 'f1 gf'],
        ['overcoat', 'Long overcoat', '롱 오버코트', 'long wool overcoat', 'f2'],
      ],
      footwear: [
        ['spats', 'Two-tone shoes', '투톤 구두', 'two-tone wingtip shoes'],
        ['heels', 'Peep-toe heels', '핍토 힐', 'peep-toe heels', 'gf'],
      ],
      headwear: [
        ['fedora', 'Fedora', '페도라', 'fedora'],
        ['tilt', 'Tilted hat with a veil', '베일 달린 기운 모자', 'small tilted hat with a short veil', 'f1 gf'],
      ],
      accessories: [
        ['square', 'Pocket square', '행커치프', 'pocket square'],
        ['gloves', 'Short gloves', '짧은 장갑', 'short satin gloves', 'gf'],
        ['spats', 'Spats', '각반', 'white spats over the shoes', 'f1 gm'],
        ['smoke', 'Drifting smoke', '흩어지는 연기', 'curling smoke drifting in the light', 'f3'],
      ],
      weapon: [
        ['violin', 'Violin case', '바이올린 케이스', 'holding a violin case'],
        ['tommy', 'Toy tommy gun', '장난감 기관단총', 'holding a toy tommy gun', 'F1'],
        ['cards', 'Playing cards', '카드 패', 'holding a fan of playing cards', 'f1'],
        ['money', 'Stack of play money', '장난감 지폐 뭉치', 'holding a stack of play money', 'f1'],
      ],
      device: [
        ['beauty', 'Beauty mark', '애교점', 'painted beauty mark', 'gf'],
        ['scar', 'Drawn-on scar line', '그린 흉터 선', 'thin drawn-on scar line on the cheek', 'gm'],
      ],
      effect: [
        ['alley', 'Rainy alley at night', '비 오는 밤의 골목', 'rainy alley at night, neon sign', 'f2'],
        ['club', 'Smoky nightclub', '연기 자욱한 나이트클럽', 'smoky nightclub, spotlight', 'f2'],
        ['noir', 'Black and white noir street', '흑백 누아르 거리', 'film noir street, venetian blind shadows', 'f3'],
      ],
    },
  }),

  /* ─── R-03 흑백 영화 유령 스타 — 옛 은막 스타가 흑백 화면에서 걸어 나온 차림. 회색조는 옷에 싣는다(피부색 분장은 필터로 꺼질 수 있다) ─── */
  costume('hollywood', 'Silver Screen Ghost', '흑백 영화 유령 스타', 'R-03', {
    tag: 'halloween costume, black and white film ghost star costume, entire outfit in shades of grey', tagReal: 'ghost of an old film star, halloween night, monochrome grey outfit',
    tagM: 'halloween costume, black and white film ghost leading man costume, entire outfit in shades of grey', tagRealM: 'ghost of an old film leading man, halloween night, monochrome grey outfit',
    colors: ['silver', 'grey', 'charcoal', 'ivory', 'black'],
    need: { accessories: 'web grain dust' },
    items: {
      garment: [
        ['hm', 'Grey satin nightgown as a gown', '드레스처럼 입은 회색 새틴 잠옷', 'long grey satin nightgown worn as an evening dress', 'f0 F0 gf'],
        ['hm-m', 'Grey thrifted tuxedo', '회색 헌 턱시도', 'thrifted grey tuxedo, bow tie', 'f0 F0 gm'],
        ['pt-gown', 'Long satin gown', '긴 새틴 드레스', 'silver screen ghost costume, long grey satin gown, long sleeves', 'f1 F1 x0 gf'],
        ['pt-halter', 'Halter gown', '홀터넥 드레스', 'silver screen ghost costume, pale grey halter dress, pleated skirt', 'f1 F1 x1 gf n:own'],
        ['pt-sheath', 'Sequin sheath gown', '스팽글 시스 드레스', 'silver screen ghost costume, silver sequin sheath gown, plunging neckline', 'f1 F1 x2 gf n:low'],
        ['pt-m', 'Dinner jacket', '디너 재킷', 'silver screen ghost costume, pale grey dinner jacket, charcoal trousers', 'f1 F1 gm'],
        ['ed-velvet', 'Velvet column gown', '벨벳 컬럼 드레스', 'charcoal velvet column gown, long sleeves, high neck, frayed hem', 'f2 x0 gf n:high'],
        ['ed-bias', 'Bias-cut satin gown', '바이어스 새틴 드레스', 'bias cut grey satin gown, cowl back, faded and torn train', 'f2 x1 gf'],
        ['ed-mermaid', 'Strapless mermaid gown', '스트랩리스 머메이드 드레스', 'strapless silver sequin mermaid gown, tattered hem', 'f2 x2 gf n:low'],
        ['ed-m', 'Faded tuxedo', '빛바랜 턱시도', 'faded grey tuxedo, satin lapels, frayed cuffs', 'f2 gm'],
      ],
      structure: [
        ['belt', 'Rhinestone belt', '라인스톤 벨트', 'tarnished rhinestone belt', 'f1 gf'],
        ['cummer', 'Cummerbund', '커머번드', 'grey cummerbund', 'gm'],
      ],
      foundation: [
        ['sheer', 'Grey stockings', '회색 스타킹', 'sheer grey stockings', 'gf'],
      ],
      neckwear: [
        ['pearls', 'Faded pearl strand', '빛바랜 진주 목걸이', 'faded pearl strand', 'gf an:high'],
        ['diamond', 'Dull diamond necklace', '빛 잃은 다이아몬드 목걸이', 'dull grey diamond necklace', 'f1 gf an:high'],
        ['bow', 'Black bow tie', '검은 보타이', 'black bow tie', 'gm'],
      ],
      outer: [
        ['stole', 'Grey fur stole', '회색 털 스톨', 'matted grey faux fur stole', 'gf'],
        ['coat', 'Long grey overcoat', '긴 회색 외투', 'long grey overcoat', 'gm'],
      ],
      footwear: [
        ['pumps', 'Grey satin pumps', '회색 새틴 펌프스', 'grey satin pumps', 'gf'],
        ['patent', 'Black patent shoes', '검은 에나멜 구두', 'black patent leather shoes', 'gm'],
      ],
      headwear: [
        ['waves', 'Finger-wave hair', '핑거 웨이브 머리', 'finger-wave hairstyle, silver hair clip', 'gf'],
        ['fedora', 'Grey fedora', '회색 페도라', 'grey fedora', 'gm'],
        ['veil', 'Cobweb veil', '거미줄 베일', 'small hat with a cobweb veil', 'f1 gf'],
      ],
      accessories: [
        ['web', 'Cobwebs on the costume', '옷에 걸린 거미줄', 'cobwebs clinging to the costume'],
        ['grain', 'Film grain and scratches', '필름 입자와 긁힘', 'film grain and scratch lines over the whole figure', 'f1'],
        ['dust', 'Dust on the shoulders', '어깨에 쌓인 먼지', 'grey dust settled on the shoulders', ''],
        ['gloves', 'Grey opera gloves', '회색 오페라 장갑', 'long grey opera gloves', 'gf'],
        ['flicker', 'Flickering like old film', '옛 필름처럼 깜빡임', 'figure flickering like an old film projection', 'f3'],
      ],
      weapon: [
        ['reel', 'Film reel', '필름 릴', 'holding an old film reel, film strip trailing', ''],
        ['clapper', 'Clapperboard', '슬레이트', 'holding a black and white clapperboard', 'f1'],
        ['award', 'Cobwebbed statuette', '거미줄 쳐진 트로피', 'holding a grey statuette covered in cobwebs', 'f2'],
        ['mic', 'Old ribbon microphone', '옛날 리본 마이크', 'holding an old ribbon microphone on a stand', 'f2'],
      ],
      device: [
        ['beauty', 'Beauty mark', '애교점', 'painted beauty mark', 'gf'],
        ['grey', 'Grey skin makeup', '회색 피부 분장', 'grey skin makeup, black lips, monochrome face', 'f1'],
      ],
      effect: [
        ['screen', 'Empty cinema, flickering screen', '빈 극장의 깜빡이는 스크린', 'empty old cinema, flickering projector light, dusty seats', 'f2'],
        ['set', 'Abandoned film set', '버려진 촬영장', 'abandoned film set, old spotlights, cobwebs', 'f3'],
      ],
    },
  }),

  /* ─── R-04 핀업과 그리저 ─── */
  costume('pinup', 'Pin-up & Greaser', '핀업과 그리저', 'R-04', {
    tag: 'halloween costume, 1950s pin-up costume', tagReal: '1950s pin-up, halloween night',
    tagM: 'halloween costume, 1950s greaser costume', tagRealM: '1950s greaser, halloween night',
    colors: ['cherry red', 'polka dot red', 'black', 'pastel pink', 'turquoise', 'gingham blue', 'white'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Polka dot dress and petticoat', '물방울 원피스와 페티코트', 'polka dot dress, tulle petticoat underneath', 'f0 F0 gf'],
        ['hm-m', 'White tee and rolled jeans', '흰 티셔츠와 접은 청바지', 'white t-shirt, cuffed jeans', 'f0 F0 gm'],
        ['pt-swing', 'Swing dress', '스윙 원피스', 'pin-up costume, swing dress, cap sleeves, full skirt', 'f1 F1 x0 gf'],
        ['pt-halter', 'Halter swing dress', '홀터넥 스윙 원피스', 'pin-up costume, halter swing dress, sweetheart neckline', 'f1 F1 x1 gf n:own'],
        ['pt-sailor', 'Sailor shorts set', '세일러 반바지 세트', 'pin-up costume, sailor crop top, high waisted shorts', 'f1 F1 x2 gf'],
        ['pt-m', 'Greaser leather jacket outfit', '그리저 가죽 재킷 차림', 'greaser costume, white t-shirt, cuffed jeans', 'f1 F1 gm'],
        ['ed-wiggle', 'Wiggle dress', '위글 원피스', 'wiggle dress, three quarter sleeves', 'f2 x0 gf'],
        ['ed-poodle', 'Circle skirt and twin set', '서클 스커트와 트윈 세트', 'felt circle skirt, cardigan twin set', 'f2 x0 gf'],
        ['ed-sweet', 'Sweetheart halter dress', '스위트하트 홀터 원피스', 'sweetheart halter dress, fitted waist, full skirt', 'f2 x1 gf n:own'],
        ['ed-swim', 'High-waisted two-piece', '하이웨이스트 투피스', 'high waisted two-piece swimsuit, polka dots', 'f2 x2 gf'],
        ['ed-m', 'Leather jacket and white tee', '가죽 재킷과 흰 티', 'black leather jacket, white t-shirt, dark jeans', 'f2 gm'],
      ],
      structure: [
        ['belt', 'Thin patent belt', '가는 에나멜 벨트', 'thin patent belt', 'gf'],
      ],
      foundation: [
        ['bobby', 'Bobby socks', '바비 삭스', 'bobby socks', 'x01 gf'],
        ['seam', 'Seamed stockings', '심 스타킹', 'seamed stockings', 'x12 gf'],
      ],
      neckwear: [
        ['scarf', 'Neck scarf', '목 스카프', 'small neck scarf tied at the side'],
        ['pearls', 'Pearl choker', '진주 초커', 'pearl choker', 'gf'],
      ],
      outer: [
        ['cardigan', 'Cropped cardigan', '짧은 카디건', 'cropped cardigan', 'gf'],
        ['letterman', 'Letterman jacket', '레터맨 재킷', 'letterman jacket', 'f1'],
        ['leather', 'Leather jacket', '가죽 재킷', 'black leather jacket', 'f1 gm'],
      ],
      footwear: [
        ['saddle', 'Saddle shoes', '새들 슈즈', 'saddle shoes'],
        ['peep', 'Peep-toe heels', '핍토 힐', 'peep-toe heels', 'gf'],
        ['boots', 'Engineer boots', '엔지니어 부츠', 'engineer boots', 'gm'],
      ],
      headwear: [
        ['bandana', 'Bandana headband', '반다나 머리띠', 'polka dot bandana headband', 'gf'],
        ['bow', 'Big hair bow', '큰 리본', 'big hair bow', 'gf'],
        ['sailor', 'Sailor cap', '세일러 모자', 'sailor cap', 'f1'],
        ['rolled', 'Rolled bandana', '말아 묶은 반다나', 'rolled red bandana tied around the head', 'gm'],
      ],
      accessories: [
        ['sunglasses', 'Cat-eye sunglasses', '캣아이 선글라스', 'cat-eye sunglasses', 'gf'],
        ['comb', 'Wallet in the back pocket', '뒷주머니 지갑', 'leather wallet in the back pocket', 'gm'],
        ['cherries', 'Cherry earrings', '체리 귀걸이', 'cherry earrings', 'gf'],
        ['stars', 'Neon stars twinkling', '반짝이는 네온 별', 'neon stars twinkling in the air', 'f3'],
      ],
      weapon: [
        ['milkshake', 'Milkshake', '밀크셰이크', 'holding a milkshake with two straws'],
        ['record', 'Vinyl record', 'LP 레코드', 'holding a vinyl record', 'f1'],
        ['phone', 'Retro telephone', '레트로 전화기', 'holding a retro telephone receiver', 'f1'],
      ],
      device: [
        ['beauty', 'Beauty mark', '애교점', 'painted beauty mark', 'gf'],
        ['red', 'Red lips and winged liner', '빨간 입술과 날개 아이라인', 'red lipstick, winged eyeliner', 'gf'],
      ],
      effect: [
        ['diner', '1950s diner', '50년대 다이너', '1950s diner, checkered floor, jukebox', 'f2'],
        ['drivein', 'Drive-in movie', '자동차 극장', 'drive-in theater at night, vintage car', 'f3'],
      ],
    },
  }),

  /* ─── R-05 고고걸 ─── */
  costume('gogo', 'Go-Go', '고고걸', 'R-05', {
    tag: 'halloween costume, 1960s go-go costume', tagReal: '1960s go-go dancer, halloween night',
    tagM: 'halloween costume, 1960s mod costume', tagRealM: '1960s mod, halloween night',
    colors: ['white', 'hot pink', 'orange', 'yellow', 'turquoise', 'silver'],
    items: {
      garment: [
        ['hm', 'Shift dress with taped stripes', '테이프 줄무늬 시프트 원피스', 'shift dress with tape stripes', 'f0 F0 gf'],
        ['hm-m', 'Turtleneck and slim trousers', '터틀넥과 슬림 바지', 'turtleneck, slim trousers', 'f0 F0 gm'],
        ['pt-shift', 'Mod shift dress', '모드 시프트 원피스', 'go-go costume, mod shift dress, long sleeves, color block', 'f1 F1 x0 gf'],
        ['pt-mini', 'Mod mini dress', '모드 미니 원피스', 'go-go costume, mod mini dress, geometric print', 'f1 F1 x1 gf'],
        ['pt-fringe', 'Fringe mini dress', '술 장식 미니 원피스', 'go-go costume, sleeveless fringe micro mini dress', 'f1 F1 x2 gf'],
        ['pt-m', 'Mod suit', '모드 수트', '1960s mod costume, slim suit, turtleneck', 'f1 F1 gm'],
        ['ed-vinyl', 'Vinyl A-line dress', '비닐 A라인 원피스', 'vinyl a-line dress, mock neck', 'f2 x0 gf n:high'],
        ['ed-paillette', 'Paillette mini dress', '파예트 미니 원피스', 'paillette mini dress, round cutouts', 'f2 x1 gf'],
        ['ed-cutout', 'Cutout vinyl mini', '컷아웃 비닐 미니 원피스', 'vinyl cutout mini dress', 'f2 x2 gf'],
        ['ed-m', 'Velvet mod suit', '벨벳 모드 수트', 'velvet mod suit, ruffled shirt', 'f2 gm'],
      ],
      structure: [
        ['chain', 'Studded belt', '징 벨트', 'wide belt at the hips', 'gf'],
      ],
      foundation: [
        ['tights', 'Opaque white tights', '흰 불투명 타이츠', 'opaque white tights', 'gf'],
        ['print', 'Patterned tights', '무늬 타이츠', 'geometric pattern tights', 'f1 gf'],
      ],
      neckwear: [
        ['scarf', 'Silk scarf', '실크 스카프', 'skinny silk scarf', 'an:high'],
      ],
      outer: [
        ['jacket', 'Cropped jacket', '짧은 재킷', 'cropped boxy jacket', 'f1'],
      ],
      footwear: [
        ['gogo', 'Go-go boots', '고고 부츠', 'white go-go boots', 'gf'],
        ['chelsea', 'Chelsea boots', '첼시 부츠', 'chelsea boots', 'gm'],
        ['mary', 'Patent mary janes', '에나멜 메리제인', 'patent mary janes', 'gf'],
      ],
      headwear: [
        ['band', 'Wide headband', '넓은 머리띠', 'wide headband', 'gf'],
        ['cap', 'Newsboy cap', '뉴스보이 캡', 'newsboy cap', 'f1'],
      ],
      accessories: [
        ['earrings', 'Big hoop earrings', '큰 링 귀걸이', 'big round earrings', 'gf'],
        ['glasses', 'Round sunglasses', '동그란 선글라스', 'round sunglasses'],
        ['bubbles', 'Psychedelic swirls', '사이키델릭 소용돌이', 'psychedelic color swirls in the air', 'f3'],
      ],
      weapon: [
        ['dance', 'Go-go dancing', '고고 춤', 'go-go dancing', 'f1'],
        ['mic', 'Retro microphone', '레트로 마이크', 'holding a retro microphone', 'f1'],
        ['flower', 'Daisy', '데이지', 'holding a daisy'],
      ],
      device: [
        ['flower', 'Flower painted on the cheek', '뺨에 그린 꽃', 'daisy painted on the cheek'],
        ['lashes', 'Painted lower lashes', '그린 아래 속눈썹', 'painted lower lashes', 'gf'],
      ],
      effect: [
        ['cage', 'Go-go cage on a stage', '무대의 고고 케이지', 'go-go cage on a dance stage, colored lights', 'f2'],
        ['swirl', 'Psychedelic dance hall', '사이키델릭 댄스홀', 'psychedelic dance hall, liquid light show', 'f3'],
      ],
    },
  }),

  /* ─── R-06 디스코 ─── */
  costume('disco', 'Disco', '디스코', 'R-06', {
    tag: 'halloween costume, 1970s disco costume', tagReal: '1970s disco dancer, halloween night',
    colors: ['gold', 'silver', 'hot pink', 'electric blue', 'orange', 'emerald'],
    items: {
      garment: [
        ['hm', 'Shiny top and flared trousers', '반짝이 상의와 나팔바지', 'shiny blouse, flared trousers', 'f0 F0'],
        ['pt-jump', 'Sequin jumpsuit', '스팽글 점프슈트', 'disco costume, sequin jumpsuit, flared legs', 'f1 F1 x0'],
        ['pt-wrap', 'Wrap dress', '랩 원피스', 'disco costume, wrap dress, flowing sleeves', 'f1 F1 x1 gf'],
        ['pt-halter', 'Halter sequin mini', '홀터 스팽글 미니 원피스', 'disco costume, halter sequin mini dress, open back', 'f1 F1 x2 gf n:own'],
        ['pt-m', 'Wide-collar shirt and flares', '넓은 깃 셔츠와 나팔바지', 'disco costume, wide collar shirt, flared trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Shirt unbuttoned to the waist', '허리까지 연 셔츠', 'disco costume, shirt unbuttoned to the waist, flared trousers', 'f1 F1 x2 gm'],
        ['ed-lame', 'Lamé halter jumpsuit', '라메 홀터 점프슈트', 'lamé halter jumpsuit, wide legs', 'f2 x0'],
        ['ed-slip', 'Sequin slip dress', '스팽글 슬립 원피스', 'sequin slip dress, flowing hem', 'f2 x1 gf'],
        ['ed-mini', 'Mirror sequin mini dress', '거울 스팽글 미니 원피스', 'mirror sequin mini dress, plunging neckline', 'f2 x2 gf n:low'],
        ['ed-m', 'White three-piece suit', '흰 쓰리피스 수트', 'white three-piece suit, wide lapels, flared trousers', 'f2 gm'],
      ],
      structure: [
        ['belt', 'Wide gold belt', '넓은 금색 벨트', 'wide gold belt'],
      ],
      foundation: [
        ['shimmer', 'Shimmer tights', '펄 타이츠', 'shimmer tights', 'gf'],
      ],
      neckwear: [
        ['chain', 'Gold pendant', '금 펜던트 목걸이', 'gold pendant necklace'],
        ['scarf', 'Silk neck scarf', '실크 목 스카프', 'silk neck scarf'],
      ],
      outer: [
        ['vest', 'Fringe vest', '술 장식 조끼', 'fringe vest', 'f1'],
        ['fauxfur', 'Faux fur jacket', '인조 털 재킷', 'faux fur jacket', 'f2'],
      ],
      footwear: [
        ['platform', 'Platform shoes', '플랫폼 슈즈', 'platform shoes'],
        ['roller', 'Roller skates', '롤러스케이트', 'roller skates', 'f1'],
      ],
      headwear: [
        ['band', 'Headband', '머리띠', 'thin headband across the forehead'],
        ['flower', 'Flower behind the ear', '귀 뒤에 꽂은 꽃', 'flower tucked behind the ear', 'gf'],
      ],
      accessories: [
        ['glasses', 'Tinted aviators', '색 렌즈 에비에이터', 'tinted aviator sunglasses'],
        ['hoops', 'Gold hoops', '금 링 귀걸이', 'big gold hoop earrings', 'gf'],
        ['bangles', 'Bangles', '팔찌', 'stacked bangles', 'gf'],
        ['sparkle', 'Mirror ball light spots', '미러볼 빛 조각', 'mirror ball light spots across the body', 'f3'],
      ],
      weapon: [
        ['point', 'Disco point', '디스코 포즈', 'pointing up in a disco pose', 'f1'],
        ['ball', 'Mini mirror ball', '작은 미러볼', 'holding a small mirror ball'],
        ['mic', 'Microphone', '마이크', 'holding a microphone', 'f1'],
      ],
      device: [
        ['glitter', 'Glitter on the cheekbones', '광대 위 반짝이', 'glitter on the cheekbones'],
        ['stars', 'Star face gems', '별 페이스 젬', 'star face gems', 'f1'],
      ],
      effect: [
        ['floor', 'Light-up dance floor', '빛나는 댄스 플로어', 'light-up dance floor, mirror ball', 'f2'],
        ['spin', 'Spinning lights everywhere', '사방에서 도는 빛', 'disco lights spinning, colored beams cutting through haze', 'f3'],
      ],
    },
  }),

  /* ─── R-07 에어로빅 ─── */
  costume('aerobics', '80s Aerobics', '80년대 에어로빅', 'R-07', {
    tag: 'halloween costume, 1980s workout costume', tagReal: '1980s aerobics instructor, halloween night',
    colors: ['neon pink', 'neon green', 'electric blue', 'hot pink', 'turquoise', 'yellow'],
    items: {
      garment: [
        ['hm', 'Leggings and an oversized sweatshirt', '레깅스와 큰 맨투맨', 'off-shoulder oversized sweatshirt, leggings', 'f0 F0'],
        ['pt-cover', 'Unitard with a cropped tee', '크롭 티와 유니타드', 'workout costume, unitard, cropped tee over it', 'f1 F1 x0 gf v:aerobics-ae c:bodysuit'],
        ['pt-leotard', 'Leotard and tights', '레오타드와 타이츠', 'workout costume, long sleeve leotard, shiny tights', 'f1 F1 x1 gf v:aerobics-ae'],
        ['pt-high', 'High-cut leotard', '하이컷 레오타드', 'workout costume, high cut leotard, shiny tights', 'f1 F1 x2 gf v:aerobics-ae'],
        ['pt-m', 'Track suit', '트랙 수트', 'workout costume, shiny track suit', 'f1 F1 x01 gm'],
        ['pt-m2', 'Tank top and short shorts', '민소매와 짧은 반바지', 'workout costume, tank top, short shorts', 'f1 F1 x2 gm'],
        ['ed-unitard', 'Metallic unitard', '메탈릭 유니타드', 'metallic unitard, long sleeves', 'f2 x0 gf c:bodysuit'],
        ['ed-thong', 'Color block leotard', '컬러 블록 레오타드', 'color block leotard, belted, shiny tights', 'f2 x1 gf'],
        ['ed-cut', 'Cutout high-cut leotard', '컷아웃 하이컷 레오타드', 'high cut leotard, cutout sides', 'f2 x2 gf'],
        ['ed-m', 'Windbreaker set', '바람막이 세트', 'color block windbreaker set', 'f2 gm'],
      ],
      structure: [
        ['belt', 'Elastic belt', '고무 벨트', 'wide elastic belt', 'gf'],
        ['fanny', 'Fanny pack', '힙색', 'fanny pack'],
      ],
      foundation: [
        ['warmers', 'Leg warmers', '레그워머', 'leg warmers'],
        ['socks', 'Slouch socks', '흘러내린 양말', 'slouch socks'],
      ],
      neckwear: [
        ['whistle', 'Whistle on a cord', '줄 달린 호루라기', 'whistle on a cord', 'f1'],
      ],
      outer: [
        ['jacket', 'Cropped track jacket', '짧은 트랙 재킷', 'cropped track jacket', 'f1'],
      ],
      footwear: [
        ['hightop', 'High-top sneakers', '하이탑 운동화', 'high-top sneakers'],
        ['aerobic', 'White aerobic shoes', '흰 에어로빅화', 'white aerobic shoes'],
      ],
      headwear: [
        ['sweat', 'Terry headband', '수건 머리띠', 'terry cloth headband'],
        ['scrunchie', 'Big scrunchie', '큰 곱창 머리끈', 'big scrunchie', 'gf'],
      ],
      accessories: [
        ['wrist', 'Wristbands', '손목 밴드', 'terry cloth wristbands'],
        ['walkman', 'Cassette player and headphones', '카세트 플레이어와 헤드폰', 'cassette player clipped to the waist, foam headphones around the neck', 'f1'],
        ['grid', 'Neon grid glow', '네온 격자 빛', 'neon grid glowing behind', 'f3'],
      ],
      weapon: [
        ['weights', 'Hand weights', '덤벨', 'holding small hand weights'],
        ['boombox', 'Boombox', '붐박스', 'holding a boombox', 'f1'],
        ['stretch', 'Stretching', '스트레칭', 'stretching one arm overhead', 'f1'],
      ],
      device: [
        ['blush', 'Bright blush stripes', '선명한 볼 터치 선', 'bright stripes of color across the cheekbones'],
      ],
      effect: [
        ['studio', 'Mirrored aerobics studio', '거울 벽 에어로빅 스튜디오', 'mirrored aerobics studio', 'f2'],
        ['vhs', 'VHS workout video', 'VHS 운동 비디오', 'retro workout video set, neon lights, VHS look', 'f3'],
      ],
    },
  }),

  /* ─── R-08 카우걸 ─── */
  costume('cowgirl', 'Cowgirl & Cowboy', '카우걸과 카우보이', 'R-08', {
    tag: 'halloween costume, cowgirl costume', tagReal: 'cowgirl, halloween night',
    tagM: 'halloween costume, cowboy costume', tagRealM: 'cowboy, halloween night',
    colors: ['tan', 'brown', 'denim blue', 'red', 'white', 'pink', 'black'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Plaid shirt and jeans', '체크 셔츠와 청바지', 'plaid shirt, jeans', 'f0 F0'],
        ['pt-prairie', 'Prairie dress', '프레리 원피스', 'cowgirl costume, prairie dress, long sleeves', 'f1 F1 x0 gf'],
        ['pt-fringe', 'Fringe skirt and western shirt', '술 스커트와 웨스턴 셔츠', 'cowgirl costume, western shirt, fringe skirt, knee length', 'f1 F1 x1 gf'],
        ['pt-short', 'Tied shirt and denim shorts', '묶은 셔츠와 데님 반바지', 'cowgirl costume, tied plaid shirt, denim shorts', 'f1 F1 x2 gf'],
        ['pt-m', 'Western shirt and jeans', '웨스턴 셔츠와 청바지', 'cowboy costume, western shirt, jeans', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open western shirt', '풀어 헤친 웨스턴 셔츠', 'cowboy costume, open western shirt, jeans', 'f1 F1 x2 gm'],
        ['ed-suede', 'Fringe suede dress', '술 장식 스웨이드 원피스', 'fringe suede dress, long sleeves', 'f2 x0 gf'],
        ['ed-embr', 'Embroidered western dress', '자수 웨스턴 원피스', 'embroidered western dress, pearl snaps', 'f2 x1 gf'],
        ['ed-rhine', 'Rhinestone fringe mini', '라인스톤 술 미니 원피스', 'rhinestone fringe mini dress', 'f2 x2 gf'],
        ['ed-m', 'Embroidered western suit', '자수 웨스턴 수트', 'embroidered western suit', 'f2 gm'],
      ],
      structure: [
        ['buckle', 'Big buckle belt', '큰 버클 벨트', 'belt with a big buckle'],
        ['holster', 'Holster belt', '홀스터 벨트', 'holster belt', 'f1'],
      ],
      foundation: [
        ['none-socks', 'Boot socks', '부츠 양말', 'boot socks peeking out'],
      ],
      neckwear: [
        ['bandana', 'Neck bandana', '목 반다나', 'bandana tied at the neck'],
        ['bolo', 'Bolo tie', '볼로 타이', 'bolo tie', 'an:low'],
      ],
      outer: [
        ['vest', 'Suede fringe vest', '술 장식 스웨이드 조끼', 'suede fringe vest'],
        ['jacket', 'Fringe jacket', '술 장식 재킷', 'fringe jacket', 'f1'],
        ['duster', 'Duster coat', '더스터 코트', 'long duster coat', 'f2'],
      ],
      footwear: [
        ['boots', 'Cowboy boots', '카우보이 부츠', 'cowboy boots'],
        ['white', 'White cowgirl boots', '흰 카우걸 부츠', 'white cowgirl boots', 'f1 gf'],
      ],
      headwear: [
        ['hat', 'Cowboy hat', '카우보이 모자', 'cowboy hat'],
        ['pink', 'Rhinestone cowboy hat', '라인스톤 카우보이 모자', 'rhinestone cowboy hat', 'f1'],
      ],
      accessories: [
        ['star', 'Sheriff star', '보안관 별', 'sheriff star badge'],
        ['chaps', 'Leather chaps', '가죽 챕스', 'leather chaps', 'f1'],
        ['spurs', 'Spurs', '박차', 'spurs on the boots', 'f1'],
        ['tumble', 'Ghostly tumbleweeds', '유령 같은 회전초', 'ghostly tumbleweeds rolling past', 'f3'],
      ],
      weapon: [
        ['lasso', 'Lasso', '올가미 밧줄', 'holding a lasso'],
        ['horse', 'Stick horse', '막대 말', 'riding a stick horse', 'F1'],
        ['revolver', 'Toy revolver', '장난감 리볼버', 'holding a toy revolver', 'f1'],
      ],
      device: [
        ['freckles', 'Painted freckles', '그린 주근깨', 'painted freckles'],
      ],
      effect: [
        ['barn', 'Barn dance', '헛간 댄스 파티', 'barn dance, string lights, hay bales', 'f2'],
        ['ghosttown', 'Ghost town at midnight', '자정의 유령 마을', 'abandoned western ghost town at midnight', 'f3'],
      ],
    },
  }),

  /* ─── R-09 이집트 여왕 ─── */
  costume('egypt', 'Egyptian Queen & Pharaoh', '이집트 여왕과 파라오', 'R-09', {
    tag: 'halloween costume, egyptian queen costume', tagReal: 'egyptian queen, halloween night',
    tagM: 'halloween costume, pharaoh costume', tagRealM: 'pharaoh, halloween night',
    colors: ['gold', 'white', 'turquoise', 'royal blue', 'black'],
    items: {
      garment: [
        ['hm', 'Bedsheet dress with a gold belt', '금색 벨트 맨 이불 천 원피스', 'white bedsheet draped into a dress, gold ribbon belt', 'f0 F0 gf'],
        ['hm-m', 'Bedsheet tunic', '이불 천 튜닉', 'white bedsheet tunic, gold ribbon belt', 'f0 F0 gm'],
        ['pt-long', 'Pleated linen gown', '주름 리넨 드레스', 'egyptian costume, pleated white gown, long sleeves', 'f1 F1 x0 gf v:egypt-eg'],
        ['pt-sheath', 'Sheath dress with a gold collar', '금 깃 시스 원피스', 'egyptian costume, white sheath dress, gold trim', 'f1 F1 x1 gf v:egypt-eg'],
        ['pt-mini', 'Gold-trimmed mini dress', '금 트림 미니 원피스', 'egyptian costume, gold trimmed mini dress, sheer side panels', 'f1 F1 x2 gf v:egypt-eg'],
        ['pt-m', 'Pharaoh tunic', '파라오 튜닉', 'pharaoh costume, pleated tunic, gold sash', 'f1 F1 x01 gm'],
        ['pt-m2', 'Pleated kilt', '주름 킬트', 'pharaoh costume, pleated kilt, gold arm cuffs', 'f1 F1 x2 gm'],
        ['ed-pleat', 'Pleated chiffon gown', '주름 시폰 드레스', 'pleated chiffon gown, gold beaded straps, cape sleeves', 'f2 x0 gf v:egypt-ege'],
        ['ed-beaded', 'Beaded dress over linen', '리넨 위 구슬 장식 원피스', 'beaded collar dress over a linen slip', 'f2 x1 gf v:egypt-ege'],
        ['ed-slit', 'Gold-belted slit gown', '금 벨트 슬릿 드레스', 'white gown, plunging neckline, high slit, gold belt', 'f2 x2 gf n:low v:egypt-ege'],
        ['ed-m', 'Pleated robe with gold', '금 장식 주름 로브', 'pleated linen robe, gold embroidery', 'f2 gm'],
      ],
      structure: [
        ['belt', 'Gold belt', '금 벨트', 'gold belt with a hanging panel'],
      ],
      foundation: [
      ],
      neckwear: [
        ['collar', 'Broad gold collar', '넓은 금 깃', 'broad gold collar, turquoise beads', 'an:high'],
        ['ankh', 'Ankh pendant', '앙크 펜던트', 'ankh pendant'],
      ],
      outer: [
        ['cape', 'Sheer gold cape', '얇은 금빛 망토', 'sheer cape, gold edges', 'f1'],
        ['wings', 'Pleated wing cape', '주름 날개 망토', 'pleated wing cape, gold', 'f2'],
      ],
      footwear: [
        ['sandals', 'Gold sandals', '금색 샌들', 'gold sandals'],
      ],
      headwear: [
        ['band', 'Gold headband', '금 머리띠', 'gold headband with a snake emblem'],
        ['headdress', 'Striped headdress', '줄무늬 머릿수건', 'striped nemes headdress', 'f1 gm'],
        ['vulture', 'Gold vulture crown', '금빛 독수리 관', 'gold vulture crown', 'f2 gf'],
        ['double', 'Double crown', '이중 관', 'tall double crown', 'f2 gm'],
      ],
      accessories: [
        ['cuffs', 'Gold arm cuffs', '금 팔찌', 'gold upper arm cuffs'],
        ['snake', 'Snake armlet', '뱀 팔찌', 'coiled snake armlet', 'f1'],
        ['scarab', 'Scarab ring', '스카라베 반지', 'scarab ring'],
        ['sand', 'Gold sand swirling', '소용돌이치는 금빛 모래', 'gold sand swirling around', 'f3'],
      ],
      weapon: [
        ['crook', 'Crook and flail', '홀과 도리깨', 'holding a crook and flail crossed', 'f1'],
        ['fan', 'Feather fan', '깃털 부채', 'holding a tall feather fan', 'f2'],
        ['ankh', 'Ankh', '앙크', 'holding a golden ankh'],
      ],
      device: [
        ['liner', 'Winged eye paint', '날개처럼 그린 눈매', 'bold winged eye paint'],
        ['gold', 'Gold leaf on the cheeks', '뺨의 금박', 'gold leaf on the cheekbones', 'f2'],
      ],
      effect: [
        ['temple', 'Torchlit temple', '횃불 켠 신전', 'torchlit temple, tall columns', 'f2'],
        ['nile', 'Moonlit river and pyramids', '달빛 강과 피라미드', 'pyramids under the moon, river reflecting stars', 'f3'],
      ],
    },
  }),

  /* ─── R-10 그리스 여신 ─── */
  costume('greek', 'Greek Goddess & God', '그리스 여신과 신', 'R-10', {
    tag: 'halloween costume, greek goddess costume', tagReal: 'greek goddess, halloween night',
    tagM: 'halloween costume, greek god costume', tagRealM: 'greek god, halloween night',
    colors: ['white', 'ivory', 'gold', 'sky blue', 'champagne', 'olive'],
    items: {
      garment: [
        ['hm', 'Bedsheet toga', '이불 천 토가', 'white bedsheet toga, safety pins at the shoulder', 'f0 F0'],
        ['pt-long', 'Draped long gown', '드레이프 긴 드레스', 'greek goddess costume, draped gown, cap sleeves', 'f1 F1 x0 gf v:greek-gr'],
        ['pt-one', 'One-shoulder gown', '원숄더 드레스', 'greek goddess costume, one shoulder gown, gold cord', 'f1 F1 x1 gf v:greek-gr'],
        ['pt-mini', 'One-shoulder mini dress', '원숄더 미니 원피스', 'greek goddess costume, draped one shoulder mini dress', 'f1 F1 x2 gf v:greek-gr'],
        ['pt-m', 'Toga', '토가', 'greek god costume, draped toga over a tunic', 'f1 F1 x01 gm'],
        ['pt-m2', 'One-shoulder toga', '원숄더 토가', 'greek god costume, one shoulder toga', 'f1 F1 x2 gm'],
        ['ed-chiffon', 'Pleated chiffon gown', '주름 시폰 드레스', 'pleated chiffon gown, draped bodice, long train', 'f2 x0 gf v:greek-gre'],
        ['ed-grecian', 'Grecian gown with a gold belt', '금 벨트 그리스풍 드레스', 'grecian gown, gold belt crisscrossed at the waist', 'f2 x1 gf v:greek-gre'],
        ['ed-cut', 'Cutout draped gown', '컷아웃 드레이프 드레스', 'draped gown, cutout waist, high slit', 'f2 x2 gf v:greek-gre'],
        ['ed-m', 'Draped himation', '드레이프 히마티온', 'draped linen himation, gold border', 'f2 gm'],
      ],
      structure: [],
      foundation: [],
      neckwear: [
        ['torc', 'Gold torque necklace', '금 토크 목걸이', 'gold torque necklace'],
      ],
      outer: [
        ['cape', 'Draped shoulder cape', '어깨 드레이프 망토', 'draped cape pinned at the shoulders', 'f1'],
      ],
      footwear: [
        ['sandals', 'Lace-up sandals', '끈 샌들', 'lace-up gladiator sandals'],
        ['gold', 'Gold sandals', '금색 샌들', 'gold sandals', 'f1'],
      ],
      headwear: [
        ['laurel', 'Laurel wreath', '월계관', 'gold laurel wreath'],
        ['leaves', 'Olive leaf crown', '올리브 잎 관', 'olive leaf crown'],
        ['diadem', 'Gold diadem', '금 다이어뎀', 'gold diadem', 'f2 gf'],
      ],
      accessories: [
        ['cuffs', 'Gold arm cuffs', '금 팔찌', 'gold upper arm cuffs'],
        ['brooch', 'Shoulder brooch', '어깨 브로치', 'gold shoulder brooch'],
        ['light', 'Light rays behind', '뒤로 퍼지는 빛줄기', 'light rays fanning out behind', 'f3'],
      ],
      weapon: [
        ['grapes', 'Bunch of grapes', '포도송이', 'holding a bunch of grapes'],
        ['lyre', 'Lyre', '리라', 'holding a lyre', 'f1'],
        ['torch', 'Torch', '횃불', 'holding a torch', 'f2'],
        ['bolt', 'Lightning bolt', '번개', 'holding a crackling lightning bolt', 'f3'],
      ],
      device: [
        ['gold', 'Gold shimmer', '금빛 광택', 'gold shimmer on the cheekbones'],
      ],
      effect: [
        ['columns', 'Marble columns', '대리석 기둥', 'white marble columns, olive trees', 'f2'],
        ['olympus', 'Mountaintop above the clouds', '구름 위 산꼭대기', 'temple above the clouds, golden light', 'f3'],
      ],
    },
  }),

  /* ─── R-12 고대 이집트 · 고증 — 할로윈 없이 신왕국 귀족 차림 그대로 ─── */
  costume('egypt-hist', 'Ancient Egypt · Historical', '고대 이집트 · 고증', 'R-12', {
    plain: true,
    tag: 'ancient egyptian noblewoman, new kingdom egypt, historically accurate', tagReal: 'ancient egyptian noblewoman, new kingdom egypt, historically accurate',
    tagM: 'ancient egyptian nobleman, new kingdom egypt, historically accurate', tagRealM: 'ancient egyptian nobleman, new kingdom egypt, historically accurate',
    colors: ['white', 'ivory', 'faded linen', 'gold', 'turquoise', 'terracotta'],
    need: { neckwear: '' },
    items: {
      garment: [
        ['robe', 'Pleated linen robe', '주름 리넨 로브', 'pleated fine linen robe, wide sleeves, tied under the bust, ankle length', 'x0 gf'],
        ['sheath', 'Linen sheath dress', '리넨 시스 드레스', 'white linen sheath dress, broad shoulder straps, ankle length', 'x1 gf'],
        ['sheer', 'Sheer pleated linen over a sheath', '시스 위 비치는 주름 리넨', 'sheer pleated linen robe over a linen sheath dress, ankle length', 'x2 gf'],
        ['bead', 'Beadwork overdress', '구슬 겉옷', 'faience beadwork overdress on a linen sheath dress, ankle length', 'f2 x12 gf'],
        ['robe-m', 'Pleated robe over a kilt', '긴 쉔디트 위 주름 로브', 'pleated linen robe with wide sleeves over a long linen kilt', 'x0 gm'],
        ['kilt', 'Shendyt kilt and tunic', '쉔디트와 리넨 윗옷', 'pleated linen shendyt kilt, sheer linen tunic', 'x1 gm'],
        ['bare', 'Shendyt kilt', '쉔디트', 'pleated linen shendyt kilt, bare chest', 'x2 gm'],
      ],
      structure: [
        ['sash', 'Linen sash', '리넨 허리띠', 'long linen sash tied at the waist, ends hanging in front'],
      ],
      foundation: [],
      neckwear: [
        ['wesekh', 'Wesekh broad collar', '우세크 넓은 목깃', 'wesekh broad collar of faience beads', 'an:high'],
        ['pectoral', 'Scarab pectoral', '스카라베 가슴 장식', 'gold scarab pectoral', 'f2'],
      ],
      outer: [],
      footwear: [
        ['papyrus', 'Papyrus sandals', '파피루스 샌들', 'woven papyrus sandals'],
        ['bare', 'Barefoot', '맨발', 'barefoot'],
      ],
      headwear: [
        ['fillet', 'Lotus fillet', '연꽃 머리띠', 'gold fillet with a lotus flower at the forehead', 'gf'],
        ['cone', 'Scented cone', '향 고깔', 'scented unguent cone on the head', 'f2'],
        ['nemes', 'Nemes headcloth', '네메스 두건', 'striped nemes headcloth', 'gm'],
        ['khepresh', 'Blue crown', '청색 관 케프레시', 'blue khepresh crown', 'f2 gm'],
      ],
      accessories: [
        ['armlets', 'Gold armlets', '금 팔찌', 'gold armlets'],
        ['earrings', 'Gold hoop earrings', '금 귀고리', 'large gold hoop earrings'],
        ['menat', 'Menat necklace', '메나트 목걸이', 'menat counterpoise necklace', 'gf'],
      ],
      weapon: [
        ['sistrum', 'Sistrum', '시스트럼', 'holding a bronze sistrum', 'gf'],
        ['lotus', 'Blue lotus', '푸른 연꽃', 'holding a blue lotus flower'],
        ['mirror', 'Bronze mirror', '청동 손거울', 'holding a bronze hand mirror', 'gf'],
        ['crook', 'Crook and flail', '홀과 도리깨', 'holding a crook and flail', 'gm'],
        ['staff', 'Long staff', '긴 지팡이', 'holding a long official staff', 'gm'],
      ],
      device: [
        ['kohl', 'Kohl-lined eyes', '콜로 그린 눈매', 'kohl-lined eyes, green malachite eyeshadow'],
      ],
      effect: [
        ['hall', 'Painted columned hall', '채색 열주 홀', 'columned hall, painted lotus columns'],
        ['garden', 'Garden pool', '정원 연못', 'garden with a lotus pool and date palms'],
        ['nile', 'Nile riverbank', '나일 강가', 'nile riverbank, papyrus reeds, daylight'],
      ],
    },
  }),

  /* ─── R-13 고대 그리스 · 고증 — 할로윈 없이 고전기 아테네 차림 그대로 ─── */
  costume('greek-hist', 'Ancient Greece · Historical', '고대 그리스 · 고증', 'R-13', {
    plain: true,
    tag: 'ancient greek woman, classical greece, historically accurate', tagReal: 'ancient greek woman, classical greece, historically accurate',
    tagM: 'ancient greek man, classical greece, historically accurate', tagRealM: 'ancient greek man, classical greece, historically accurate',
    colors: ['white', 'ivory', 'faded linen', 'terracotta', 'sky blue', 'olive', 'crimson'],
    items: {
      garment: [
        ['chiton-h', 'Ionic chiton with a himation', '히마티온 두른 이오니아식 키톤', 'linen ionic chiton, sleeves fastened with small buttons along the arms, wool himation wrapped over the body, ankle length', 'x0 gf'],
        ['chiton', 'Ionic chiton', '이오니아식 키톤', 'fine linen ionic chiton, buttoned sleeves, girdled at the waist, ankle length', 'x1 gf'],
        ['peplos', 'Doric peplos', '도리아식 페플로스', 'wool doric peplos, overfold, pinned at the shoulders, open side, belted, ankle length', 'x2 gf'],
        ['himation-m', 'Himation over a chiton', '키톤 위 히마티온', 'long linen chiton, wool himation draped over the left shoulder', 'x0 gm'],
        ['chlamys', 'Short chiton and chlamys', '짧은 키톤과 클라미스', 'knee-length wool chiton, chlamys cloak pinned at the right shoulder', 'x1 gm'],
        ['exomis', 'Exomis', '엑소미스', 'exomis tunic fastened on one shoulder, bare right shoulder, knee length', 'x2 gm'],
      ],
      structure: [
        ['zone', 'Girdle cord', '허리 끈', 'cord girdle tied under the bust', 'gf'],
        ['belt', 'Leather belt', '가죽 허리띠', 'plain leather belt', 'gm'],
      ],
      foundation: [],
      neckwear: [
        ['beads', 'Gold bead necklace', '금 구슬 목걸이', 'gold bead necklace', 'gf'],
      ],
      outer: [],
      footwear: [
        ['sandals', 'Leather sandals', '가죽 샌들', 'plain leather sandals'],
        ['krepides', 'Laced krepides', '끈 장화 크레피데스', 'laced leather krepides boots', 'gm'],
      ],
      headwear: [
        ['sakkos', 'Sakkos head wrap', '사코스 머리 싸개', 'patterned sakkos head wrap', 'gf'],
        ['stephane', 'Gold stephane', '금 스테파네', 'low gold stephane diadem', 'f2 gf'],
        ['petasos', 'Petasos hat', '페타소스 모자', 'wide-brimmed petasos hat', 'gm'],
        ['wreath', 'Olive wreath', '올리브 관', 'olive leaf wreath'],
      ],
      accessories: [
        ['fibulae', 'Gold dress pins', '금 옷핀', 'gold fibulae pins at the shoulders'],
        ['earrings', 'Gold disc earrings', '금 원반 귀걸이', 'gold disc earrings', 'gf'],
        ['ring', 'Signet ring', '인장 반지', 'gold signet ring', 'gm'],
      ],
      weapon: [
        ['hydria', 'Water jar', '물항아리 히드리아', 'carrying a painted hydria water jar', 'gf'],
        ['spindle', 'Distaff and spindle', '실톳대와 가락', 'holding a distaff and spindle', 'gf'],
        ['scroll', 'Papyrus scroll', '파피루스 두루마리', 'holding a papyrus scroll'],
        ['kylix', 'Wine cup', '포도주 잔 킬릭스', 'holding a painted kylix wine cup', 'gm'],
        ['staff', 'Walking staff', '지팡이', 'holding a plain walking staff', 'gm'],
      ],
      device: [],
      effect: [
        ['stoa', 'Stoa colonnade', '스토아 열주랑', 'stoa colonnade, agora, daylight'],
        ['court', 'House courtyard', '집 안뜰', 'whitewashed courtyard of a greek house, loom by the wall'],
        ['temple', 'Painted temple', '채색된 신전', 'marble temple with painted friezes', 'f2'],
      ],
    },
  }),

  /* ─── R-11 스팀펑크 ─── */
  costume('steampunk', 'Steampunk', '스팀펑크', 'R-11', {
    tag: 'halloween costume, steampunk costume', tagReal: 'steampunk adventurer, halloween night',
    tagM: 'halloween costume, steampunk gentleman costume', tagRealM: 'steampunk gentleman, halloween night',
    colors: ['brown', 'copper', 'brass', 'burgundy', 'black', 'cream'],
    items: {
      garment: [
        ['hm', 'Thrifted blouse, vest and skirt', '헌 블라우스와 조끼, 치마', 'thrifted blouse, vest, long skirt, glued-on gears', 'f0 F0 gf'],
        ['hm-m', 'Vest and rolled sleeves', '조끼와 걷은 소매', 'vest, shirt with rolled sleeves, glued-on gears', 'f0 F0 gm'],
        ['pt-bustle', 'Bustle skirt and blouse', '버슬 스커트와 블라우스', 'steampunk costume, ruffled blouse, bustle skirt', 'f1 F1 x0 gf v:steampunk-st'],
        ['pt-corset', 'Corset and high-low skirt', '코르셋과 앞이 짧은 치마', 'steampunk costume, corset, high-low skirt', 'f1 F1 x1 gf v:steampunk-st'],
        ['pt-mini', 'Corset and ruffled mini skirt', '코르셋과 러플 미니스커트', 'steampunk costume, corset, ruffled mini skirt', 'f1 F1 x2 gf v:steampunk-st'],
        ['pt-m', 'Waistcoat and pinstripe trousers', '조끼와 핀스트라이프 바지', 'steampunk costume, brocade waistcoat, pinstripe trousers', 'f1 F1 gm'],
        ['ed-gown', 'Brocade bustle gown', '브로케이드 버슬 드레스', 'brocade bustle gown, high collar', 'f2 x0 gf n:high'],
        ['ed-coat', 'Leather corset and coat', '가죽 코르셋과 코트', 'leather corset, ruffled skirt, tailcoat', 'f2 x1 gf'],
        ['ed-short', 'Corset and bloomers', '코르셋과 블루머', 'leather corset, ruffled bloomers', 'f2 x2 gf'],
        ['ed-m', 'Frock coat with brass fittings', '황동 장식 프록코트', 'frock coat, brass buttons, waistcoat', 'f2 gm'],
      ],
      structure: [
        ['belt', 'Utility belt with pouches', '주머니 벨트', 'leather utility belt, small pouches'],
        ['corset', 'Underbust corset', '언더버스트 코르셋', 'underbust corset', 'x12 gf'],
      ],
      foundation: [
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'gf'],
      ],
      neckwear: [
        ['cameo', 'Cameo', '카메오', 'cameo at the throat', 'an:low'],
        ['cravat', 'Cravat', '크라바트', 'cravat', 'gm'],
      ],
      outer: [
        ['tailcoat', 'Tailcoat', '연미복', 'tailcoat', 'f1'],
        ['duster', 'Leather duster', '가죽 더스터 코트', 'leather duster', 'f2'],
      ],
      footwear: [
        ['boots', 'Lace-up boots', '끈 부츠', 'lace-up boots'],
        ['buckle', 'Buckled boots', '버클 부츠', 'tall buckled boots', 'f1'],
      ],
      headwear: [
        ['mini', 'Mini top hat', '미니 실크해트', 'mini top hat with goggles', 'gf'],
        ['tophat', 'Top hat with goggles', '고글 단 실크해트', 'top hat, goggles on the brim'],
        ['goggles', 'Goggles on the head', '머리 위 고글', 'goggles pushed up on the head'],
      ],
      accessories: [
        ['watch', 'Pocket watch', '회중시계', 'pocket watch'],
        ['gears', 'Gear brooch', '톱니 브로치', 'gear brooch'],
        ['key', 'Brass wind-up key on the back', '등에 단 황동 태엽 열쇠', 'brass wind-up key on the back', 'f1'],
        ['gauntlet', 'Brass gauntlet', '황동 건틀릿', 'brass gauntlet on one arm', 'f2'],
        ['steam', 'Steam venting', '뿜어 나오는 증기', 'puffs of steam venting from the gauntlet', 'f3'],
      ],
      weapon: [
        ['parasol', 'Lace parasol', '레이스 양산', 'holding a lace parasol', 'gf'],
        ['spyglass', 'Spyglass', '망원경', 'holding a brass spyglass'],
        ['raygun', 'Ray gun', '광선총', 'holding a brass ray gun', 'f1'],
      ],
      device: [
        ['monocle', 'Monocle', '외알 안경', 'monocle', 'f1'],
        ['soot', 'Soot smudge', '그을음 자국', 'soot smudge on the cheek'],
      ],
      effect: [
        ['workshop', 'Clockwork workshop', '태엽 공방', 'workshop full of clockwork, warm lamplight', 'f2'],
        ['airship', 'Airship deck at night', '밤의 비행선 갑판', 'airship deck at night, city lights below', 'f3'],
      ],
    },
  }),

]);

/* ═══════════════════════════════════════════════════════════════════
 * UNIFORM PLAY — 직업 분장 6
 * 파티용 분장판이다. 실제 제복은 Crest 의 것이므로 모든 의상에 costume 이 붙는다.
 * ═══════════════════════════════════════════════════════════════════ */
const uniform = collection('uniform', 'UNIFORM PLAY', 'PA·TFY·IV', 'dress-up jobs',
  ['white', 'black', 'navy', 'red', 'pastel pink', 'silver'],
  [

  /* ─── U-01 간호사 ─── */
  costume('nurse', 'Nurse', '간호사', 'U-01', {
    tag: 'halloween costume, nurse costume', tagReal: 'vintage nurse, halloween night',
    tagM: 'halloween costume, doctor costume', tagRealM: 'vintage doctor, halloween night',
    colors: ['white', 'pastel pink', 'sky blue', 'mint'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Scrubs', '수술복', 'scrubs, name badge', 'f0 F0'],
        ['pt-long', 'Long nurse dress with an apron', '앞치마 두른 긴 간호사 원피스', 'nurse costume, long dress, white apron, long sleeves', 'f1 F1 x0 gf v:nurse-nu'],
        ['pt-button', 'Button-front nurse dress', '단추 간호사 원피스', 'nurse costume, button-front dress, knee length, short sleeves', 'f1 F1 x1 gf v:nurse-nu'],
        ['pt-mini', 'Zip-front mini nurse dress', '지퍼 미니 간호사 원피스', 'nurse costume, zip-front mini dress, fitted', 'f1 F1 x2 gf v:nurse-nu'],
        ['pt-m', 'Doctor\'s coat and scrubs', '의사 가운과 수술복', 'doctor costume, white coat over scrubs', 'f1 F1 gm'],
        ['ed-vintage', 'Vintage nurse uniform with a cape', '망토 달린 옛 간호사복', 'vintage nurse uniform dress, starched apron, short cape', 'f2 x0 gf v:nurse-nue'],
        ['ed-satin', 'Satin nurse dress', '새틴 간호사 원피스', 'satin nurse dress, puff sleeves, fitted waist', 'f2 x1 gf v:nurse-nue'],
        ['ed-mini', 'Satin mini nurse dress', '새틴 미니 간호사 원피스', 'satin nurse mini dress, sweetheart neckline', 'f2 x2 gf n:low v:nurse-nue'],
        ['ed-m', 'Vintage doctor\'s coat', '옛날 의사 가운', 'vintage doctor\'s coat, waistcoat, rolled sleeves', 'f2 gm'],
      ],
      structure: [
        ['belt', 'White belt', '흰 벨트', 'white belt', 'gf'],
      ],
      foundation: [
        ['white', 'White tights', '흰 타이츠', 'white tights', 'x01 gf'],
        ['thigh', 'White thighhighs', '흰 사이하이', 'white thighhighs', 'x12 gf'],
        ['seam', 'Seamed stockings', '심 스타킹', 'seamed stockings', 'x2 gf'],
      ],
      neckwear: [
        ['stetho', 'Stethoscope', '청진기', 'stethoscope around the neck'],
      ],
      outer: [
        ['cardigan', 'Cardigan', '카디건', 'cardigan', 'F1 gf'],
        ['cape', 'Nurse cape', '간호사 망토', 'navy nurse cape', 'f2 gf'],
      ],
      footwear: [
        ['clogs', 'Nursing clogs', '간호화', 'white nursing clogs'],
        ['heels', 'White heels', '흰 힐', 'white heels', 'f1 gf'],
      ],
      headwear: [
        ['cap', 'Nurse cap', '간호사 모자', 'nurse cap'],
        ['mirror', 'Head mirror', '이마 반사경', 'head mirror on a headband', 'gm'],
      ],
      accessories: [
        ['badge', 'Name badge', '이름표', 'name badge'],
        ['watch', 'Fob watch', '간호사 시계', 'fob watch pinned at the chest', 'f1'],
        ['gloves', 'Exam gloves', '진료용 장갑', 'exam gloves', 'F1'],
        ['flicker', 'Flickering hallway light', '깜빡이는 복도 불빛', 'flickering light catching the uniform', 'f3'],
      ],
      weapon: [
        ['syringe', 'Giant toy syringe', '커다란 장난감 주사기', 'holding a giant toy syringe'],
        ['clipboard', 'Clipboard', '클립보드', 'holding a clipboard'],
        ['bag', 'Doctor\'s bag', '왕진 가방', 'holding a leather doctor\'s bag', 'f2'],
      ],
      device: [
        ['bandage', 'Small bandage on the cheek', '뺨의 작은 반창고', 'small adhesive bandage on the cheek'],
        ['mask', 'Surgical mask', '수술용 마스크', 'surgical mask', 'f1 c:mask'],
      ],
      effect: [
        ['ward', 'Old hospital ward', '옛 병동', 'old hospital ward, iron beds', 'f2'],
        ['corridor', 'Flickering asylum corridor', '불이 깜빡이는 낡은 복도', 'empty hospital corridor, flickering lights', 'f3'],
      ],
    },
  }),

  /* ─── U-02 경찰 ─── */
  costume('police', 'Police', '경찰', 'U-02', {
    tag: 'halloween costume, police costume', tagReal: 'police officer costume, halloween night',
    colors: ['navy', 'black', 'midnight blue'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Navy shirt with a paper badge', '종이 배지를 단 남색 셔츠', 'navy button shirt, paper star badge, dark trousers', 'f0 F0'],
        ['pt-uni', 'Police shirt and trousers', '경찰 셔츠와 바지', 'police costume, uniform shirt, trousers, badge', 'f1 F1 x0 v:police-po'],
        ['pt-dress', 'Police uniform dress', '경찰 원피스', 'police costume, uniform shirt dress, badge, knee length', 'f1 F1 x1 gf v:police-po'],
        ['pt-mini', 'Police mini dress', '경찰 미니 원피스', 'police costume, fitted uniform mini dress, badge', 'f1 F1 x2 gf v:police-po'],
        ['pt-m2', 'Short-sleeved uniform shirt', '반소매 경찰 셔츠', 'police costume, short sleeve uniform shirt, fitted trousers', 'f1 F1 x2 gm'],
        ['ed-jacket', 'Tailored police jacket', '테일러드 경찰 재킷', 'tailored police style jacket, trousers, badge', 'f2 x0'],
        ['ed-skirt', 'Uniform shirt and pencil skirt', '유니폼 셔츠와 펜슬 스커트', 'uniform shirt, pencil skirt, badge', 'f2 x1 gf'],
        ['ed-vinyl', 'Vinyl uniform dress', '비닐 경찰 원피스', 'vinyl police style mini dress, badge', 'f2 x2 gf'],
        ['ed-m2', 'Rolled-sleeve uniform shirt', '소매 걷은 유니폼 셔츠', 'uniform shirt with rolled sleeves, open collar', 'f2 x12 gm'],
      ],
      structure: [
        ['duty', 'Duty belt', '근무 벨트', 'duty belt'],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['tie', 'Clip-on tie', '클립 넥타이', 'clip-on tie', 'an:low'],
      ],
      outer: [
        ['jacket', 'Uniform jacket', '경찰 재킷', 'uniform jacket', 'f1'],
      ],
      footwear: [
        ['boots', 'Black boots', '검은 부츠', 'black boots'],
        ['shoes', 'Black uniform shoes', '검은 구두', 'black uniform shoes'],
        ['heels', 'Black heels', '검은 힐', 'black heels', 'f1 x12 gf'],
      ],
      headwear: [
        ['cap', 'Police hat', '경찰 모자', 'police hat'],
      ],
      accessories: [
        ['cuffs', 'Handcuffs on the belt', '벨트의 수갑', 'toy handcuffs on the belt'],
        ['aviator', 'Aviator sunglasses', '에비에이터 선글라스', 'aviator sunglasses'],
        ['radio', 'Shoulder radio', '어깨 무전기', 'radio clipped at the shoulder', 'f1'],
        ['siren', 'Red and blue light', '빨강 파랑 경광', 'red and blue light washing over', 'f3'],
      ],
      weapon: [
        ['baton', 'Toy baton', '장난감 경찰봉', 'holding a toy baton'],
        ['whistle', 'Whistle', '호루라기', 'blowing a whistle', 'f1'],
        ['notebook', 'Notebook', '수첩', 'holding a notepad and pen'],
      ],
      device: [],
      effect: [
        ['street', 'Street at night with a squad car', '경찰차 선 밤거리', 'night street, parked squad car', 'f2'],
        ['tape', 'Caution tape in the fog', '안개 속 통제선', 'caution tape strung across a foggy street', 'f3'],
      ],
    },
  }),

  /* ─── U-03 프렌치 메이드 ─── */
  costume('maid', 'French Maid & Butler', '프렌치 메이드와 집사', 'U-03', {
    tag: 'halloween costume, maid costume', tagReal: 'maid, halloween night',
    tagM: 'halloween costume, butler costume', tagRealM: 'butler, halloween night',
    colors: ['black', 'navy', 'burgundy', 'pastel pink'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Black dress with a white apron', '흰 앞치마 두른 검은 원피스', 'black dress, white kitchen apron', 'f0 F0 gf'],
        ['hm-m', 'White shirt and black vest', '흰 셔츠와 검은 조끼', 'white shirt, black vest, black trousers', 'f0 F0 gm'],
        ['pt-long', 'Long maid dress', '긴 메이드 원피스', 'maid costume, long dress, white apron, long sleeves', 'f1 F1 x0 gf v:maid-ma'],
        ['pt-knee', 'Knee-length maid dress', '무릎 길이 메이드 원피스', 'maid costume, dress, frilled apron, knee length', 'f1 F1 x1 gf v:maid-ma'],
        ['pt-mini', 'French maid mini dress', '프렌치 메이드 미니 원피스', 'french maid costume, short dress, frilled apron, puffed sleeves', 'f1 F1 x2 gf v:maid-ma'],
        ['pt-m', 'Butler tailcoat', '집사 연미복', 'butler costume, tailcoat, waistcoat', 'f1 F1 gm'],
        ['ed-victorian', 'Victorian maid dress', '빅토리안 메이드 원피스', 'victorian maid dress, long apron, high collar', 'f2 x0 gf n:high v:maid-mae'],
        ['ed-frill', 'Frilled maid dress', '프릴 메이드 원피스', 'maid dress, layered frilled apron, puff sleeves', 'f2 x1 gf v:maid-mae'],
        ['ed-corset', 'Corset maid dress', '코르셋 메이드 원피스', 'maid dress, corset bodice, short frilled skirt, off-shoulder', 'f2 x2 gf n:low v:maid-mae'],
        ['ed-m', 'Butler with a pocket watch', '회중시계 집사', 'butler, tailcoat, striped waistcoat', 'f2 gm'],
      ],
      structure: [
        ['bow', 'Apron bow at the back', '뒤로 묶은 앞치마 리본', 'big apron bow at the back', 'gf'],
      ],
      foundation: [
        ['white', 'White stockings', '흰 스타킹', 'white stockings', 'x01 gf'],
        ['thigh', 'Lace-top thighhighs', '레이스 사이하이', 'lace-top thighhighs', 'x12 gf'],
      ],
      neckwear: [
        ['bow', 'Ribbon bow', '리본', 'ribbon bow at the collar', 'gf an:low'],
        ['tie', 'Bow tie', '보타이', 'black bow tie', 'gm'],
      ],
      outer: [
        ['cardigan', 'Cardigan', '카디건', 'cardigan', 'F1'],
      ],
      footwear: [
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['heels', 'Strap heels', '스트랩 힐', 'strap heels', 'f1 gf'],
        ['oxford', 'Oxfords', '옥스퍼드', 'polished oxfords', 'gm'],
      ],
      headwear: [
        ['headdress', 'Maid headdress', '메이드 머리 장식', 'maid headdress', 'gf'],
        ['bonnet', 'Frilled bonnet', '프릴 보닛', 'frilled cap', 'f2 gf'],
      ],
      accessories: [
        ['cuffs', 'Wrist cuffs', '소맷부리', 'white wrist cuffs', 'gf'],
        ['gloves', 'White gloves', '흰 장갑', 'white gloves'],
        ['watch', 'Pocket watch', '회중시계', 'pocket watch', 'gm'],
        ['candles', 'Floating candles', '떠 있는 촛불', 'candles floating in the air', 'f3'],
      ],
      weapon: [
        ['duster', 'Feather duster', '먼지떨이', 'holding a feather duster'],
        ['tray', 'Tea tray', '찻쟁반', 'holding a silver tea tray', 'f1'],
        ['candle', 'Candlestick', '촛대', 'holding a candlestick', 'f2'],
      ],
      device: [
        ['beauty', 'Beauty mark', '애교점', 'painted beauty mark', 'gf'],
      ],
      effect: [
        ['manor', 'Manor parlor', '저택 응접실', 'manor parlor, fireplace', 'f2'],
        ['haunted', 'Haunted manor hall', '유령 저택 복도', 'haunted manor hall, portraits watching', 'f3'],
      ],
    },
  }),

  /* ─── U-04 바니걸 ─── */
  costume('bunny', 'Bunny', '바니걸', 'U-04', {
    tag: 'halloween costume, bunny costume', tagReal: 'bunny costume, halloween night',
    tagM: 'halloween costume, bunny boy costume', tagRealM: 'bunny boy costume, halloween night',
    colors: ['black', 'white', 'red', 'pastel pink', 'navy'],
    need: { headwear: 'ears floppy satin' },
    items: {
      garment: [
        ['hm', 'Sweatsuit with a cotton tail', '솜 꼬리 단 운동복', 'sweatsuit, cotton ball tail sewn on', 'f0 F0'],
        ['pt-onesie', 'Fluffy bunny jumpsuit', '복슬복슬한 토끼 점프슈트', 'bunny costume, fluffy hooded jumpsuit', 'f1 F1 x0'],
        ['pt-velvet', 'Velvet bunny dress', '벨벳 토끼 원피스', 'bunny costume, velvet dress, white collar and cuffs', 'f1 F1 x1 gf'],
        ['pt-leotard', 'Bunny suit', '바니 수트', 'bunny girl, strapless leotard, wrist cuffs', 'f1 F1 x2 gf n:low'],
        ['pt-m', 'Bunny boy waistcoat', '바니 보이 조끼', 'bunny boy costume, waistcoat, dress shirt, trousers', 'f1 F1 x12 gm'],
        ['ed-velvet', 'Velvet bunny gown', '벨벳 토끼 드레스', 'velvet gown, white faux fur trim', 'f2 x0 gf'],
        ['ed-satin', 'Satin corset bunny dress', '새틴 코르셋 토끼 원피스', 'satin corset dress, tulle skirt', 'f2 x1 gf'],
        ['ed-suit', 'Satin bunny suit', '새틴 바니 수트', 'bunny girl, satin leotard, sheer pantyhose', 'f2 x2 gf n:low'],
        ['ed-m', 'Tailcoat bunny boy', '연미복 바니 보이', 'bunny boy, tailcoat, satin waistcoat', 'f2 gm'],
      ],
      structure: [],
      foundation: [
        ['tights', 'White tights', '흰 타이츠', 'white tights', 'x01 gf'],
        ['pantyhose', 'Pantyhose', '팬티스타킹', 'sheer black pantyhose', 'x12 gf'],
        ['fishnet', 'Black seamed pantyhose', '뒷선 검은 팬티스타킹', 'black back seam pantyhose', 'x2 gf'],
      ],
      neckwear: [
        ['collar', 'Detached collar and bow tie', '분리형 깃과 보타이', 'detached collar, bow tie'],
      ],
      outer: [
        ['jacket', 'Cropped jacket', '짧은 재킷', 'cropped jacket', 'f1 gf'],
        ['coat', 'Faux fur coat', '인조 털 코트', 'white faux fur coat', 'f2'],
      ],
      footwear: [
        ['sneakers', 'Sneakers', '운동화', 'white sneakers', 'F1'],
        ['heels', 'High heels', '하이힐', 'high heels', 'gf'],
        ['oxford', 'Dress shoes', '구두', 'dress shoes', 'gm'],
      ],
      headwear: [
        ['ears', 'Bunny ear headband', '토끼 귀 머리띠', 'bunny ear headband'],
        ['floppy', 'Floppy bunny ears', '늘어진 토끼 귀', 'floppy bunny ear headband'],
        ['satin', 'Satin bunny ears', '새틴 토끼 귀', 'satin bunny ears', 'f2'],
      ],
      accessories: [
        ['tail', 'Cotton tail', '솜 꼬리', 'cotton ball tail'],
        ['cuffs', 'Wrist cuffs', '소맷부리', 'wrist cuffs', 'f1'],
        ['earrings', 'Pearl earrings', '진주 귀걸이', 'pearl earrings', 'f1 gf'],
        ['cards', 'Playing cards floating', '떠 있는 카드', 'playing cards floating around', 'f3'],
      ],
      weapon: [
        ['carrot', 'Carrot', '당근', 'holding a carrot'],
        ['tray', 'Cocktail tray', '칵테일 쟁반', 'holding a cocktail tray', 'f1'],
        ['cards', 'Fan of cards', '부채꼴 카드', 'holding a fan of playing cards', 'f1'],
      ],
      device: [
        ['nose', 'Drawn bunny nose', '그린 토끼 코', 'drawn-on bunny nose and whiskers'],
        ['beauty', 'Beauty mark', '애교점', 'painted beauty mark', 'f1 gf'],
      ],
      effect: [
        ['casino', 'Casino floor', '카지노', 'casino floor, card tables, warm lights', 'f2'],
        ['wonder', 'Moonlit rabbit hole', '달빛 토끼굴', 'moonlit meadow, rabbit hole glowing', 'f3'],
      ],
    },
  }),

  /* ─── U-05 서커스 단장 ─── */
  costume('ringmaster', 'Ringmaster', '서커스 단장', 'U-05', {
    tag: 'halloween costume, ringmaster costume', tagReal: 'ringmaster, halloween night',
    colors: ['red', 'black', 'gold', 'royal blue', 'burgundy'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Blazer with gold ribbon trim', '금 리본 트림 블레이저', 'blazer trimmed with gold ribbon, white trousers', 'f0 F0'],
        ['pt-coat', 'Tailcoat and trousers', '연미복과 바지', 'ringmaster costume, tailcoat, white trousers', 'f1 F1 x0 v:ringmaster-ri'],
        ['pt-dress', 'Tailcoat dress', '연미복 원피스', 'ringmaster costume, tailcoat dress, knee length', 'f1 F1 x1 gf v:ringmaster-ri'],
        ['pt-leotard', 'Cropped tailcoat and leotard', '짧은 연미복과 레오타드', 'ringmaster costume, cropped tailcoat, sequin leotard', 'f1 F1 x2 gf v:ringmaster-ri'],
        ['pt-m2', 'Open waistcoat and tailcoat', '열린 조끼와 연미복', 'ringmaster costume, tailcoat, open waistcoat', 'f1 F1 x2 gm'],
        ['ed-coat', 'Velvet tailcoat with braid', '장식끈 벨벳 연미복', 'velvet tailcoat, gold cord trim, jodhpurs', 'f2 x0 v:ringmaster-rie'],
        ['ed-bodice', 'Tailcoat and corset bodice', '연미복과 코르셋 보디스', 'velvet tailcoat, corset bodice, ruffled skirt', 'f2 x1 gf v:ringmaster-rie'],
        ['ed-body', 'Sequin bodysuit and tailcoat', '스팽글 보디수트와 연미복', 'sequin bodysuit, velvet tailcoat', 'f2 x2 gf v:ringmaster-rie c:bodysuit'],
        ['ed-m2', 'Velvet tailcoat, shirt open', '벨벳 연미복과 열린 셔츠', 'velvet tailcoat, ruffled shirt open at the collar', 'f2 x2 gm'],
      ],
      structure: [
        ['vest', 'Brocade waistcoat', '브로케이드 조끼', 'brocade waistcoat'],
        ['belt', 'Wide belt', '넓은 벨트', 'wide black belt', 'gf'],
      ],
      foundation: [
        ['tights', 'Sheer tights', '얇은 타이츠', 'sheer tights', 'gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['bow', 'Bow tie', '보타이', 'bow tie'],
        ['jabot', 'Ruffled jabot', '러플 자보', 'ruffled jabot', 'f2 an:low'],
      ],
      outer: [],
      footwear: [
        ['boots', 'Riding boots', '승마 부츠', 'tall riding boots'],
        ['heeled', 'Heeled riding boots', '굽 있는 승마 부츠', 'heeled riding boots', 'gf'],
      ],
      headwear: [
        ['tophat', 'Top hat', '실크해트', 'top hat'],
        ['mini', 'Mini top hat', '미니 실크해트', 'mini top hat', 'f1 gf'],
      ],
      accessories: [
        ['gloves', 'White gloves', '흰 장갑', 'white gloves'],
        ['epaulettes', 'Gold epaulettes', '금 견장', 'gold epaulettes', 'f1'],
        ['sparks', 'Spotlight sparkles', '조명 속 반짝임', 'spotlight sparkles swirling', 'f3'],
      ],
      weapon: [
        ['whip', 'Show whip', '공연용 채찍', 'holding a show whip'],
        ['cane', 'Cane', '지팡이', 'holding a cane', 'f1'],
        ['mega', 'Megaphone', '메가폰', 'holding a megaphone', 'f1'],
      ],
      device: [
        ['mustache', 'Drawn-on mustache', '그린 콧수염', 'drawn-on curled mustache', 'F1'],
        ['stars', 'Star cheek paint', '볼의 별 분장', 'small stars painted on the cheek'],
      ],
      effect: [
        ['tent', 'Big top', '서커스 천막', 'circus big top, spotlights, sawdust ring', 'f2'],
        ['night', 'Abandoned circus at night', '밤의 버려진 서커스', 'abandoned circus tent at night, string lights flickering', 'f3'],
      ],
    },
  }),

  /* ─── U-06 섬뜩한 광대 — 이름 없는 공포 광대. 필터 칩 '광대'로 끈다 ─── */
  costume('creepyclown', 'Creepy Clown', '섬뜩한 광대', 'U-06', {
    tag: 'halloween costume, creepy clown costume', tagReal: 'creepy clown, halloween night',
    colors: ['red', 'white', 'black', 'mustard', 'teal', 'faded linen'],
    need: { device: '' },
    items: {
      garment: [
        ['hm', 'Baggy clown suit', '헐렁한 광대 옷', 'baggy clown suit, big pompom buttons', 'f0 F0'],
        ['pt-suit', 'Striped clown jumpsuit', '줄무늬 광대 점프수트', 'creepy clown costume, striped baggy jumpsuit, pompom buttons', 'f1 F1 x0'],
        ['pt-dress', 'Ruffled clown dress', '러플 광대 원피스', 'creepy clown costume, ruffled dress, pompom buttons, knee length', 'f1 F1 x1 gf'],
        ['pt-mini', 'Clown romper', '광대 롬퍼', 'creepy clown costume, short ruffled romper, pompom buttons', 'f1 F1 x2 gf'],
        ['pt-m', 'Patched clown suit', '덧댄 광대 정장', 'creepy clown costume, patched baggy suit, oversized bow tie', 'f1 F1 x12 gm'],
        ['ed-vintage', 'Faded vintage clown suit', '바랜 옛 광대 옷', 'faded vintage clown suit, layered ruffles, diamond patches', 'f2 x0'],
        ['ed-dress', 'Faded circus dress', '바랜 서커스 원피스', 'faded vintage circus dress, layered ruffles, diamond patches', 'f2 x1 gf'],
        ['ed-corset', 'Striped corset and tulle skirt', '줄무늬 코르셋과 튤 치마', 'striped corset, short ragged tulle skirt, ruffled cuffs', 'f2 x2 gf'],
        ['ed-m', 'Ragged clown tailcoat', '해진 광대 연미복', 'ragged striped clown tailcoat, baggy trousers', 'f2 x12 gm'],
      ],
      structure: [
        ['susp', 'Suspenders', '멜빵', 'suspenders'],
      ],
      foundation: [
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'gf'],
        ['socks', 'Mismatched socks', '짝짝이 양말', 'mismatched striped socks', 'x01'],
      ],
      neckwear: [
        ['ruff', 'Ruffled collar', '주름 깃', 'big ruffled clown collar'],
        ['bow', 'Oversized bow tie', '커다란 나비넥타이', 'oversized bow tie', 'an:low'],
      ],
      outer: [
        ['coat', 'Patched long coat', '덧댄 긴 코트', 'patched long coat', 'f1'],
      ],
      footwear: [
        ['big', 'Oversized clown shoes', '큰 광대 신발', 'oversized clown shoes'],
        ['boots', 'Scuffed boots', '닳은 부츠', 'scuffed boots', 'f1'],
      ],
      headwear: [
        ['hat', 'Tiny tilted hat', '작게 기울인 모자', 'tiny tilted top hat'],
        ['cone', 'Pompom cone hat', '방울 고깔모자', 'cone hat with pompoms'],
      ],
      accessories: [
        ['nose', 'Red nose', '빨간 코', 'red clown nose'],
        ['gloves', 'White gloves', '흰 장갑', 'white gloves'],
        ['flower', 'Squirting lapel flower', '물 뿜는 옷깃 꽃', 'squirting flower on the lapel', 'f1'],
        ['dust', 'Faded sequins', '바랜 스팽글', 'faded sequins on the costume'],
        ['glow', 'Balloon glowing in the dark', '어둠 속 빛나는 풍선', 'balloon glowing faintly in the dark', 'f3'],
      ],
      weapon: [
        ['balloon', 'Red balloon', '빨간 풍선', 'holding a single red balloon'],
        ['horn', 'Bicycle horn', '빵빵 나팔', 'holding a bicycle horn', 'f1'],
        ['box', 'Jack-in-the-box', '깜짝 상자', 'holding a jack-in-the-box', 'f1'],
        ['mallet', 'Giant toy mallet', '커다란 장난감 망치', 'holding a giant toy mallet', 'f1'],
      ],
      device: [
        ['paint', 'White clown face paint', '흰 광대 얼굴 분장', 'white clown face paint, painted red smile'],
        ['smear', 'Smeared clown paint', '번진 광대 분장', 'smeared clown face paint, dark eyes'],
        ['tear', 'Painted tears', '그린 눈물', 'clown face paint, painted black tears'],
        ['mask', 'Grinning clown mask', '웃는 광대 가면', 'grinning clown mask', 'f1 c:mask'],
      ],
      effect: [
        ['funhouse', 'Funhouse mirrors', '거울의 집', 'funhouse hall of mirrors', 'f2'],
        ['tent', 'Empty circus tent', '텅 빈 서커스 천막', 'empty circus tent at night, single spotlight', 'f3'],
      ],
    },
  }),

  /* ─── U-07 무대 마술사 ─── */
  costume('magician', 'Stage Magician', '무대 마술사', 'U-07', {
    tag: 'halloween costume, stage magician costume', tagReal: 'stage magician, halloween night',
    colors: ['black', 'burgundy', 'royal blue', 'gold', 'wine'],
    need: { weapon: 'wand cards rabbit dove hat' },
    items: {
      garment: [
        ['hm', 'Black suit and paper bow tie', '검은 정장과 종이 나비넥타이', 'black suit, paper bow tie', 'f0 F0'],
        ['pt-coat', 'Tailcoat and trousers', '연미복과 바지', 'stage magician costume, black tailcoat, white shirt, trousers', 'f1 F1 x0 v:magician-mg'],
        ['pt-dress', 'Tailcoat dress', '연미복 원피스', 'stage magician costume, tailcoat dress, knee length', 'f1 F1 x1 gf v:magician-mg'],
        ['pt-short', 'Tailcoat and sequin leotard', '연미복과 스팽글 레오타드', 'stage magician costume, cropped tailcoat, sequin leotard', 'f1 F1 x2 gf v:magician-mg'],
        ['pt-m2', 'Waistcoat and rolled sleeves', '조끼와 걷은 소매', 'stage magician costume, waistcoat, white shirt, rolled sleeves', 'f1 F1 x12 gm'],
        ['ed-coat', 'Velvet tailcoat with a starry lining', '별무늬 안감 벨벳 연미복', 'velvet tailcoat, starry lining, white shirt', 'f2 x0 v:magician-mge'],
        ['ed-dress', 'Sequin gown with a tailcoat', '연미복 걸친 스팽글 드레스', 'long sequin gown, cropped velvet tailcoat', 'f2 x1 gf v:magician-mge'],
        ['ed-short', 'Sequin corset and tailcoat', '스팽글 코르셋과 연미복', 'sequin corset, short skirt, velvet tailcoat', 'f2 x2 gf v:magician-mge'],
        ['ed-m2', 'Velvet tailcoat, shirt open', '벨벳 연미복과 열린 셔츠', 'velvet tailcoat, ruffled shirt open at the collar', 'f2 x12 gm'],
      ],
      structure: [
        ['vest', 'Satin waistcoat', '새틴 조끼', 'satin waistcoat'],
        ['cummer', 'Cummerbund', '커머번드', 'satin cummerbund', 'gm'],
      ],
      foundation: [
        ['tights', 'Sheer tights', '얇은 타이츠', 'sheer tights', 'gf'],
      ],
      neckwear: [
        ['bow', 'Bow tie', '보타이', 'black bow tie'],
        ['star', 'Star pendant', '별 펜던트', 'star pendant', 'f1'],
      ],
      outer: [
        ['cape', 'Satin-lined cape', '새틴 안감 망토', 'black cape, red satin lining', 'f1'],
      ],
      footwear: [
        ['shoes', 'Patent shoes', '에나멜 구두', 'patent leather shoes'],
        ['heels', 'Patent heels', '에나멜 힐', 'patent heels', 'gf'],
      ],
      headwear: [
        ['tophat', 'Top hat', '실크해트', 'top hat'],
        ['mini', 'Mini top hat', '미니 실크해트', 'tilted mini top hat', 'gf'],
      ],
      accessories: [
        ['gloves', 'White gloves', '흰 장갑', 'white gloves'],
        ['monocle', 'Monocle', '외알 안경', 'monocle', 'f1'],
        ['float', 'Cards floating around', '공중에 뜬 카드', 'playing cards floating in the air around', 'f3'],
      ],
      weapon: [
        ['wand', 'Magic wand', '마술봉', 'holding a black and white magic wand'],
        ['cards', 'Fanned playing cards', '부채처럼 편 카드', 'holding fanned playing cards'],
        ['rabbit', 'Rabbit from a top hat', '모자 속 토끼', 'holding a top hat with a white rabbit peeking out', 'f1 c:animal'],
        ['dove', 'White dove', '흰 비둘기', 'white dove perched on the hand', 'f1 c:animal'],
        ['hat', 'Upturned top hat', '뒤집어 든 실크해트', 'holding an upturned top hat', 'f1'],
      ],
      device: [
        ['mustache', 'Drawn-on mustache', '그린 콧수염', 'drawn-on curled mustache', 'F1'],
        ['star', 'Star under the eye', '눈 밑 별', 'small star painted under the eye'],
        ['mask', 'Domino mask', '눈가면', 'black domino mask', 'f1'],
      ],
      effect: [
        ['stage', 'Theater stage', '극장 무대', 'old theater stage, red curtains, footlights', 'f2'],
        ['smoke', 'Puff of purple smoke', '보랏빛 연기', 'stage with a puff of purple smoke', 'f3'],
      ],
    },
  }),


]);

/* ═══════════════════════════════════════════════════════════════════
 * COSPLAY — 할리퀸과 조커만, 판별로. 캐릭터 이름을 쓰는 이 에디션의 유일한 예외다.
 * 판의 옷은 그 판에서 확인된 차림만 쓴다. 망사는 쓰지 않는다(2016 할리퀸의 망사 → 올 나간 비치는 타이츠).
 * ═══════════════════════════════════════════════════════════════════ */
const cosplay = collection('cosplay', 'COSPLAY', 'PA·TFY·IV', 'harley quinn and joker, every version',
  ['red', 'black', 'purple', 'green', 'royal blue'],
  [

  /* ─── C-01 할리퀸 · 애니 광대 ─── */
  costume('hq-classic', 'Harley Quinn · Animated', '할리퀸 · 애니 광대', 'C-01', {
    tag: 'halloween costume, cosplay, harley quinn, harley quinn (classic)', tagReal: 'cosplay, harley quinn, harley quinn (classic), halloween night',
    colors: [],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Homemade diamond jester suit', '손수 만든 다이아 광대 옷', 'red and black top and leggings, felt diamond patches sewn on', 'f0 F0'],
        ['pt', 'Red and black jester bodysuit', '빨강 검정 광대 보디수트', 'red and black diamond jester bodysuit, split colors, white ruffled collar', 'f1 F1 c:bodysuit'],
        ['ed', 'Tailored jester suit', '정교한 광대 수트', 'red and black diamond jester suit, satin panels, white ruffled collar, pom-poms', 'f2'],
      ],
      structure: [['belt', 'Black belt', '검은 벨트', 'black belt with a diamond buckle']],
      foundation: [],
      neckwear: [['ruff', 'White ruffled collar', '흰 러플 깃', 'white ruffled collar']],
      outer: [],
      footwear: [['boots', 'Jester boots with pom-poms', '방울 달린 광대 부츠', 'red and black boots, pom-poms']],
      headwear: [
        ['hood', 'Jester hood with two bells', '방울 둘 달린 광대 두건', 'red and black jester hood, two bells'],
        ['hm-hood', 'Felt jester hood', '펠트 광대 두건', 'felt jester hood, two pom-poms', 'F0'],
      ],
      accessories: [['mask', 'Black domino mask', '검은 눈가면', 'black domino mask'], ['gloves', 'Black gloves', '검은 장갑', 'black gloves']],
      weapon: [['mallet', 'Giant mallet', '커다란 나무망치', 'holding a giant mallet'], ['popgun', 'Pop gun with a BANG flag', 'BANG 깃발 장난감 총', 'holding a toy pop gun with a bang flag', 'f1']],
      device: [['white', 'White face paint', '흰 얼굴 분장', 'white face paint']],
    },
  }),

  /* ─── C-02 할리퀸 · 2016 영화 ─── */
  costume('hq-2016', 'Harley Quinn · 2016 Film', '할리퀸 · 2016 영화', 'C-02', {
    tag: 'halloween costume, cosplay, harley quinn', tagReal: 'cosplay, harley quinn, halloween night',
    colors: [],
    items: {
      garment: [
        ['hm', 'Marker baseball tee and shorts', '매직으로 쓴 야구 티와 반바지', 'white baseball tee with daddy\'s lil monster written in marker, red and blue shorts', 'f0 F0'],
        ['pt', 'Lil monster tee and sequin hot pants', '릴 몬스터 티와 스팽글 반바지', 'torn baseball tee, daddy\'s lil monster print, red and blue sequin hot pants', 'f1 F1'],
        ['ed', 'Tee, sequin hot pants and bomber', '티 · 스팽글 반바지 · 항공 점퍼', 'cropped torn baseball tee, daddy\'s lil monster print, red and blue sequin hot pants, embroidered satin bomber jacket', 'f2'],
      ],
      structure: [['studs', 'Studded belt', '징 벨트', 'studded belt']],
      foundation: [['tights', 'Fishnet stockings', '망사 스타킹', 'black fishnet stockings']],
      neckwear: [['choker', 'Puddin choker', '퍼딩 초커', 'black choker with puddin lettering']],
      outer: [['bomber', 'Embroidered bomber jacket', '자수 항공 점퍼', 'embroidered satin bomber jacket, red and blue', 'f1']],
      footwear: [['boots', 'Black lace-up boots', '검은 끈 부츠', 'black lace-up heeled boots']],
      headwear: [],
      accessories: [['bracelets', 'Spiked bracelets', '가시 팔찌', 'spiked bracelets'], ['gloves', 'Fingerless gloves', '손가락 없는 장갑', 'black fingerless gloves']],
      weapon: [['bat', 'Baseball bat', '야구방망이', 'holding a baseball bat over the shoulder'], ['toybat', 'Toy bat', '장난감 방망이', 'holding a toy baseball bat', 'F0']],
      device: [['heart', 'Heart cheek paint', '볼의 하트 분장', 'small heart drawn under the eye'], ['cheek', 'Lettering on the cheek', '볼에 쓴 글씨', 'small heart under the eye, small lettering drawn on the cheek']],
    },
  }),

  /* ─── C-03 할리퀸 · 2020 영화 ─── */
  costume('hq-2020', 'Harley Quinn · 2020 Film', '할리퀸 · 2020 영화', 'C-03', {
    tag: 'halloween costume, cosplay, harley quinn', tagReal: 'cosplay, harley quinn, halloween night, confetti',
    colors: [],
    items: {
      garment: [
        ['hm', 'Jacket with caution tape sleeves', '경고 테이프 소매 재킷', 'jacket with yellow caution tape sewn on the sleeves, crop top, shorts', 'f0 F0'],
        ['pt', 'Caution tape jacket and clear vest', '경고 테이프 재킷과 투명 조끼', 'jacket with caution tape fringe sleeves, clear plastic vest, crop top, high-waisted shorts', 'f1 F1'],
        ['ed', 'Glam caution tape jacket', '화려한 경고 테이프 재킷', 'iridescent jacket with caution tape fringe sleeves, clear plastic vest, sparkly crop top, high-waisted shorts', 'f2'],
      ],
      structure: [['belt', 'Colorful belt', '알록달록한 벨트', 'colorful belt']],
      foundation: [['socks', 'Knee socks', '니삭스', 'colorful knee socks'], ['fishnet', 'Fishnet stockings', '망사 스타킹', 'black fishnet stockings', 'f1']],
      neckwear: [],
      outer: [],
      footwear: [['boots', 'Combat boots', '컴뱃 부츠', 'combat boots']],
      headwear: [],
      accessories: [['bracelets', 'Stacked bracelets', '겹친 팔찌', 'stacked colorful bracelets']],
      weapon: [['mallet', 'Mallet', '나무망치', 'holding a mallet'], ['confetti', 'Confetti gun', '꽃가루 총', 'holding a confetti cannon', 'f1']],
      device: [['heart', 'Heart cheek paint', '볼의 하트 분장', 'small heart drawn under the eye'], ['glitter', 'Glitter', '반짝이', 'glitter on the cheeks']],
    },
  }),

  /* ─── C-04 할리퀸 · 2021 영화 ─── */
  costume('hq-2021', 'Harley Quinn · 2021 Film', '할리퀸 · 2021 영화', 'C-04', {
    tag: 'halloween costume, cosplay, harley quinn', tagReal: 'cosplay, harley quinn, halloween night',
    colors: [],
    items: {
      garment: [
        ['hm', 'Red and black jacket and leggings', '빨강 검정 재킷과 레깅스', 'red and black jacket, black leggings, diamond patches', 'f0 F0'],
        ['pt-biker', 'Leather biker jester suit', '가죽 바이커 광대복', 'red and black leather biker jester suit, split colors, diamond detail', 'f1 F1'],
        ['ed-biker', 'Tailored leather jester suit', '정교한 가죽 광대복', 'red and black leather biker jester suit, quilted panels, diamond detail', 'f2'],
        ['ed-dress', 'Red dress with sheer tulle skirt', '튤 치마 빨간 드레스', 'red dress with a fluffy sheer tulle skirt, combat boots', 'f2'],
      ],
      structure: [['belt', 'Black utility belt', '검은 유틸리티 벨트', 'black utility belt']],
      foundation: [],
      neckwear: [],
      outer: [],
      footwear: [['boots', 'Combat boots', '컴뱃 부츠', 'black combat boots']],
      headwear: [],
      accessories: [['gloves', 'Leather gloves', '가죽 장갑', 'red and black leather gloves']],
      weapon: [['mallet', 'Giant mallet', '커다란 나무망치', 'holding a giant mallet'], ['javelin', 'Javelin', '창', 'holding a javelin', 'f2']],
      device: [['heart', 'Heart cheek paint', '볼의 하트 분장', 'small heart drawn under the eye']],
    },
  }),

  /* ─── C-05 할리퀸 · 2024 영화 (리 퀸젤) ─── */
  costume('hq-2024', 'Lee Quinzel · 2024 Film', '리 퀸젤 · 2024 영화', 'C-05', {
    tag: 'halloween costume, cosplay, harley quinn', tagReal: 'cosplay, harley quinn, halloween night',
    colors: [],
    items: {
      garment: [
        ['hm', 'Yellow cardigan over scrubs', '수술복 위 노란 가디건', 'oversized yellow cardigan over blue hospital scrubs', 'f0 F0'],
        ['pt', 'Marigold mohair cardigan over scrubs', '수술복 위 메리골드 모헤어 가디건', 'oversized marigold mohair cardigan over hospital scrubs', 'f1'],
      ],
      structure: [], foundation: [], neckwear: [], outer: [],
      footwear: [['sneakers', 'Worn sneakers', '낡은 운동화', 'worn white sneakers']],
      headwear: [],
      accessories: [],
      weapon: [['matchbook', 'Matchbook', '성냥갑', 'holding a matchbook']],
      device: [['heart', 'Heart drawn under the eye', '볼의 하트 분장', 'small heart drawn under the eye']],
    },
  }),

  /* ─── C-06 조커 · 코믹스 ─── */
  costume('jk-classic', 'Joker · Comics', '조커 · 코믹스', 'C-06', {
    tag: 'halloween costume, cosplay, joker (dc)', tagReal: 'cosplay, joker (dc), halloween night',
    colors: [],
    items: {
      garment: [
        ['hm', 'Thrifted purple blazer', '헌 보라색 블레이저', 'thrifted purple blazer, green shirt, dark trousers', 'f0 F0'],
        ['pt', 'Purple suit and green waistcoat', '보라 정장과 초록 조끼', 'purple suit, green waistcoat, orange shirt', 'f1 F1'],
        ['ed', 'Purple tailored suit', '맞춤 보라 정장', 'tailored purple suit, green waistcoat, orange shirt, flower on the lapel', 'f2'],
      ],
      structure: [], foundation: [],
      neckwear: [['tie', 'Paisley tie', '페이즐리 넥타이', 'paisley tie'], ['bow', 'Purple bow tie', '보라 보타이', 'purple bow tie']],
      outer: [],
      footwear: [['spats', 'Two-tone shoes', '투톤 구두', 'two-tone shoes']],
      headwear: [['fedora', 'Purple fedora', '보라 페도라', 'purple fedora', 'f1']],
      accessories: [['gloves', 'Purple gloves', '보라 장갑', 'purple gloves'], ['flower', 'Lapel flower', '옷깃의 꽃', 'flower on the lapel', 'f1'], ['cards', 'Cards swirling', '흩날리는 카드', 'playing cards swirling in the air', 'f3']],
      weapon: [['card', 'Joker card', '조커 카드', 'holding a joker playing card'], ['cane', 'Cane', '지팡이', 'holding a cane', 'f1']],
      device: [['paint', 'Clown face paint', '광대 얼굴 분장', 'white face paint, wide red smile painted on']],
    },
  }),

  /* ─── C-07 조커 · 1989 영화 ─── */
  costume('jk-1989', 'Joker · 1989 Film', '조커 · 1989 영화', 'C-07', {
    tag: 'halloween costume, cosplay, joker (dc)', tagReal: 'cosplay, joker (dc), halloween night',
    colors: [],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm', 'Purple blazer and orange shirt', '보라 블레이저와 주황 셔츠', 'purple blazer, orange shirt, dark trousers', 'f0 F0'],
        ['pt', 'Purple suit with blue waistcoat', '파란 조끼 보라 정장', 'purple suit, shiny orange shirt, blue waistcoat, green necktie', 'f1 F1'],
        ['ed', 'Tailored purple suit with blue waistcoat', '맞춤 보라 정장과 파란 조끼', 'tailored purple suit, shiny orange shirt, bright blue waistcoat, green necktie', 'f2'],
      ],
      structure: [], foundation: [], neckwear: [], outer: [],
      footwear: [['shoes', 'Two-tone shoes', '투톤 구두', 'two-tone shoes']],
      headwear: [['bowler', 'Purple bowler hat', '보라 중절모', 'purple bowler hat with a black band']],
      accessories: [['gloves', 'Purple gloves', '보라 장갑', 'purple gloves']],
      weapon: [['cane', 'Cane', '지팡이', 'holding a cane'], ['flower', 'Lapel flower', '옷깃 꽃', 'pointing at a flower on the lapel']],
      device: [['paint', 'White face, red grin', '흰 얼굴과 빨간 웃음', 'white face paint, wide red grin painted on']],
    },
  }),

  /* ─── C-08 조커 · 2008 영화 ─── */
  costume('jk-2008', 'Joker · 2008 Film', '조커 · 2008 영화', 'C-08', {
    tag: 'halloween costume, cosplay, joker (dc)', tagReal: 'cosplay, joker (dc), halloween night',
    colors: [],
    need: { device: '' },
    items: {
      garment: [
        ['hm', 'Purple coat and green vest', '보라 코트와 초록 조끼', 'long purple coat, green vest, patterned shirt', 'f0 F0'],
        ['pt', 'Purple trench coat and green waistcoat', '보라 트렌치코트와 초록 조끼', 'purple trench coat, green waistcoat, patterned dress shirt, striped trousers', 'f1 F1'],
        ['ed', 'Worn purple trench coat', '낡은 보라 트렌치코트', 'worn purple trench coat, green waistcoat, patterned dress shirt, striped trousers, loose tie', 'f2'],
      ],
      structure: [], foundation: [], neckwear: [], outer: [],
      footwear: [['shoes', 'Worn dress shoes', '낡은 구두', 'worn dress shoes']],
      headwear: [],
      accessories: [['gloves', 'Worn purple gloves', '낡은 보라 장갑', 'worn purple gloves']],
      weapon: [['card', 'Joker card', '조커 카드', 'holding a joker playing card'], ['clap', 'Slow clap', '느린 박수', 'clapping slowly']],
      device: [['smear', 'Smeared clown makeup', '번진 광대 분장', 'smeared white clown makeup, black around the eyes, smeared red smile'], ['hm', 'Rough clown makeup', '거친 광대 분장', 'rough white face paint, dark eyes', 'F0']],
    },
  }),

  /* ─── C-09 조커 · 2016 영화 ─── */
  costume('jk-2016', 'Joker · 2016 Film', '조커 · 2016 영화', 'C-09', {
    tag: 'halloween costume, cosplay, joker (dc)', tagReal: 'cosplay, joker (dc), halloween night, neon',
    colors: [],
    items: {
      garment: [
        ['hm', 'Purple jacket and track pants', '보라 재킷과 운동복 바지', 'purple jacket, printed shirt, black track pants', 'f0 F0'],
        ['pt', 'Purple coat and track pants', '보라 코트와 운동복 바지', 'purple coat, printed shirt, black track pants, gold rings', 'f1 F1'],
        ['ed', 'Shiny purple coat', '반짝이는 보라 코트', 'shiny purple coat, open printed shirt, black track pants, many gold rings', 'f2'],
      ],
      structure: [], foundation: [], neckwear: [], outer: [],
      footwear: [['boots', 'Black boots', '검은 부츠', 'black boots']],
      headwear: [],
      accessories: [['rings', 'Gold rings', '금반지', 'many gold rings'], ['watch', 'Gold watch', '금시계', 'gold watch']],
      weapon: [['cane', 'Cane', '지팡이', 'holding a cane'], ['laugh', 'Laughing', '웃음', 'laughing with a hand on the face']],
      device: [['pale', 'Pale makeup', '창백한 분장', 'very pale skin makeup'], ['grin', 'Silver grin', '은빛 웃음', 'silver tooth caps, wide grin', 'f1']],
    },
  }),

  /* ─── C-10 조커 · 2019 영화 ─── */
  costume('jk-2019', 'Joker · 2019 Film', '조커 · 2019 영화', 'C-10', {
    tag: 'halloween costume, cosplay, joker (2019)', tagReal: 'cosplay, joker (2019), halloween night',
    colors: [],
    need: { device: '' },
    items: {
      garment: [
        ['hm', 'Red blazer and yellow vest', '빨간 블레이저와 노란 조끼', 'red blazer, yellow vest, green shirt, red trousers', 'f0 F0'],
        ['pt', 'Red suit and mustard waistcoat', '빨간 정장과 머스터드 조끼', 'red suit, mustard waistcoat, green shirt with a popped collar', 'f1 F1'],
        ['ed', 'Tailored red suit', '맞춤 빨간 정장', 'tailored red suit, mustard waistcoat, green shirt with a popped collar, red trousers', 'f2'],
      ],
      structure: [], foundation: [], neckwear: [], outer: [],
      footwear: [['shoes', 'Brown dress shoes', '갈색 구두', 'brown dress shoes']],
      headwear: [],
      accessories: [['hanky', 'Pocket handkerchief', '주머니 손수건', 'handkerchief in the breast pocket']],
      weapon: [['dance', 'Dancing', '춤추기', 'dancing with arms spread'], ['card', 'Joker card', '조커 카드', 'holding a joker playing card']],
      device: [['paint', 'White face, blue diamonds, red smile', '흰 얼굴 · 파란 마름모 · 빨간 웃음', 'white clown face paint, blue diamond shapes over the eyes, red painted smile'], ['hm', 'Rough clown paint', '거친 광대 분장', 'rough white face paint, red smile', 'F0']],
    },
  }),

]);


/* ═══════════════════════════════════════════════════════════════════
 * EVENT NIGHT — 일러스트풍 할로윈 의상 13
 * 괴물 둘을 섞고(마녀 + 악마, 토끼 + 미라), 모자는 작게 기울이거나 아주 크게 키우고,
 * 소매는 떼거나 부풀리고, 위에는 짧은 망토, 다리에는 무늬, 작은 장식 하나로 주제를 알린다.
 * 얼굴은 덧니 · 한쪽 눈 가림 · 바느질 자국까지. 피는 쓰지 않는다.
 * ═══════════════════════════════════════════════════════════════════ */
const eventNight = collection('event', 'EVENT NIGHT', 'PA·TFY·VI', 'illustrated event outfits',
  ['black', 'deep purple', 'pumpkin orange', 'lavender', 'pastel pink', 'bone white', 'midnight blue', 'lilac', 'crimson', 'mint'],
  [

  /* ─── E-01 리본 마녀 ─── */
  costume('ribbonwitch', 'Ribbon Witch', '리본 마녀', 'E-01', {
    tag: 'halloween costume, witch costume, frills', tagReal: 'witch, halloween night, frills',
    tagM: 'halloween costume, warlock costume', tagRealM: 'warlock, halloween night',
    colors: ['black', 'deep purple', 'lavender', 'pumpkin orange', 'midnight blue', 'lilac'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black dress with paper stars', '종이 별 붙인 검은 원피스', 'black dress, paper star cutouts pinned on, tulle petticoat peeking out', 'f0 F0 gf'],
        ['hm-m', 'Hoodie with a felt cape', '펠트 망토 두른 후드티', 'black hoodie, felt cape pinned at the shoulders, star patches', 'f0 F0 gm'],
        ['pt-0', 'Frilled witch dress, long', '프릴 마녀 원피스 · 긴 기장', 'frilled witch dress, ribbon bow at the chest, long puffy sleeves, high collar, ankle-length skirt', 'f1 F1 x0 gf n:high v:ribbonwitch-pt'],
        ['pt-1', 'Frilled witch dress, knee', '프릴 마녀 원피스 · 무릎 기장', 'frilled witch dress, ribbon bow at the chest, detached sleeves, knee-length skirt', 'f1 F1 x1 gf v:ribbonwitch-pt'],
        ['pt-2', 'Frilled witch dress, short', '프릴 마녀 원피스 · 짧은 기장', 'frilled witch dress, ribbon bow at the chest, off-shoulder corset bodice, detached sleeves, layered miniskirt', 'f1 F1 x2 gf n:low v:ribbonwitch-pt'],
        ['pt-m', 'Short witch robe and shorts', '짧은 마법사 로브와 반바지', 'warlock costume, short hooded robe, shorts, star buttons', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open vest and ribbon tie', '풀어 헤친 조끼와 리본 넥타이', 'warlock costume, open vest, loose ribbon tie, rolled sleeves', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Vertical-striped witch dress, long', '세로 줄무늬 마녀 드레스 · 긴 기장', 'vertical-striped witch dress, layered frills, juliet sleeves, high collar, floor-length skirt', 'f2 x0 gf n:high v:ribbonwitch-ed'],
        ['ed-1', 'Vertical-striped witch dress, knee', '세로 줄무늬 마녀 드레스 · 무릎 기장', 'vertical-striped witch dress, layered frills, short sleeves over long sleeves, corset bodice, knee-length asymmetrical skirt', 'f2 x1 gf v:ribbonwitch-ed'],
        ['ed-2', 'Vertical-striped witch dress, short', '세로 줄무늬 마녀 드레스 · 짧은 기장', 'vertical-striped witch dress, layered frills, strapless corset bodice, detached sleeves, high-low miniskirt', 'f2 x2 gf n:low v:ribbonwitch-ed'],
        ['ed-m', 'Witch tailcoat with moon buttons', '달 단추 마법사 연미복', 'witch tailcoat, moon buttons, frilled cravat, short cape attached', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open shirt and witch tailcoat', '풀어 헤친 셔츠와 마법사 연미복', 'open shirt, cropped witch tailcoat, harness belt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Big back bow', '등 뒤 큰 리본', 'big bow at the back'],
        ['corset', 'Lace-up corset', '끈 코르셋', 'lace-up corset', 'x12 gf'],
        ['charms', 'Belt with hanging charms', '참 장식 벨트', 'belt with hanging star and moon charms', 'f1'],
      ],
      foundation: [
        ['striped', 'Striped thighhighs', '줄무늬 니삭스', 'striped thighhighs', 'gf'],
        ['mismatch', 'Mismatched legwear', '양쪽 다른 니삭스', 'mismatched legwear, one striped and one plain', 'f1 gf'],
        ['frill', 'Frilled socks', '프릴 양말', 'frilled socks', 'x01 gf'],
        ['garter', 'Thighhighs with garters', '가터 니삭스', 'thighhighs, garter straps', 'x2 gf'],
      ],
      neckwear: [
        ['ribbon', 'Ribbon choker', '리본 초커', 'ribbon choker'],
        ['jabot', 'Frilled jabot', '프릴 자보', 'frilled jabot', 'an:low'],
      ],
      outer: [
        ['capelet', 'Frilled capelet', '프릴 케이플릿', 'frilled capelet, bow at the neck', 'f1'],
        ['twoside', 'Two-sided cape', '겉과 안이 다른 망토', 'two-sided cape, purple lining', 'f2'],
        ['stars', 'Cape lined with a starry sky', '별하늘이 비치는 망토', 'cape lined with a moving starry night sky', 'f3'],
      ],
      footwear: [
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['ribbon', 'Ribbon-laced boots', '리본 끈 부츠', 'ankle boots, ribbon laces'],
        ['platform', 'Platform boots', '플랫폼 부츠', 'platform boots', 'f2 x12'],
      ],
      headwear: [
        ['hm-hat', 'Paper witch hat with a ribbon', '리본 단 종이 마녀 모자', 'paper witch hat, ribbon band', 'F0'],
        ['big', 'Witch hat with flowers', '꽃 단 마녀 모자', 'witch hat, hat flower, hat ribbon, small hanging charms', 'f1'],
        ['mini', 'Tilted mini witch hat', '기울여 쓴 미니 마녀 모자', 'mini witch hat, tilted headwear', 'f1'],
        ['pumpkin', 'Witch hat with a pumpkin', '호박 단 마녀 모자', 'witch hat, pumpkin ornament on the brim', 'f1'],
      ],
      accessories: [
        ['gloves', 'Elbow gloves', '팔꿈치 장갑', 'elbow gloves', 'x12'],
        ['bat', 'Bat brooch', '박쥐 브로치', 'bat brooch'],
        ['earrings', 'Pumpkin earrings', '호박 귀걸이', 'pumpkin earrings'],
        ['familiar', 'Tiny bat familiar', '작은 박쥐 사역마', 'tiny bat familiar fluttering nearby', 'f3 c:animal'],
      ],
      weapon: [
        ['lolli', 'Giant lollipop', '커다란 막대사탕', 'holding a giant swirl lollipop', 'f1'],
        ['broom', 'Ribbon-tied broom', '리본 묶은 빗자루', 'holding a broom tied with a ribbon', 'f1'],
        ['book', 'Spell book with a lock', '자물쇠 달린 주문서', 'holding a spell book with a lock', 'f1'],
        ['wand', 'Star wand', '별 지팡이', 'holding a star-tipped wand', 'f1'],
        ['float', 'Book floating open', '펼쳐진 채 떠 있는 책', 'spell book floating open beside, pages glowing', 'f3'],
      ],
      device: [
        ['star', 'Star sticker under the eye', '눈 밑 별 스티커', 'star sticker under the eye'],
        ['fang', 'Fang', '덧니', 'fang, smile'],
        ['eyes', 'Glowing eyes', '빛나는 눈', 'glowing purple eyes', 'f3'],
      ],
    },
  }),

  /* ─── E-02 프릴 뱀파이어 ─── */
  costume('frillvamp', 'Frilled Vampire', '프릴 뱀파이어', 'E-02', {
    tag: 'halloween costume, vampire costume, frills', tagReal: 'vampire costume, halloween night, frills',
    colors: ['black', 'crimson', 'burgundy', 'midnight blue', 'lavender', 'pastel pink'],
    need: { device: 'fang eyes' },
    items: {
      garment: [
        ['hm-f', 'Black skirt and frilled blouse', '검은 치마와 프릴 블라우스', 'black skirt, white frilled blouse, red ribbon', 'f0 F0 gf'],
        ['hm-m', 'White shirt and black vest', '흰 셔츠와 검은 조끼', 'white shirt, black vest, red ribbon tie', 'f0 F0 gm'],
        ['pt-0', 'Frilled vampire dress, long', '프릴 뱀파이어 원피스 · 긴 기장', 'vampire costume, frilled dress, bowtie, spider web print skirt, puffy long sleeves, high collar, long skirt', 'f1 F1 x0 gf n:high v:frillvamp-pt'],
        ['pt-1', 'Frilled vampire dress, knee', '프릴 뱀파이어 원피스 · 무릎 기장', 'vampire costume, frilled dress, bowtie, spider web print skirt, puffy short sleeves, knee-length skirt', 'f1 F1 x1 gf v:frillvamp-pt'],
        ['pt-2', 'Frilled vampire dress, short', '프릴 뱀파이어 원피스 · 짧은 기장', 'vampire costume, frilled dress, bowtie, spider web print skirt, off-shoulder corset bodice, short frilled skirt', 'f1 F1 x2 gf n:low v:frillvamp-pt'],
        ['pt-m', 'Vampire vest and ascot', '뱀파이어 조끼와 애스콧', 'vampire costume, brocade vest, ascot, dress shirt', 'f1 F1 x01 gm n:high'],
        ['pt-m2', 'Open frilled shirt', '풀어 헤친 프릴 셔츠', 'vampire costume, open frilled shirt, slim trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Velvet vampire gown, long', '벨벳 뱀파이어 드레스 · 긴 기장', 'vampire costume, velvet gown, lace trim, bat brooch, layered frills, high collar, long sleeves, floor length', 'f2 x0 gf n:high v:frillvamp-ed'],
        ['ed-1', 'Velvet vampire gown, knee', '벨벳 뱀파이어 드레스 · 무릎 기장', 'vampire costume, velvet gown, lace trim, bat brooch, square neckline, knee length', 'f2 x1 gf n:own v:frillvamp-ed'],
        ['ed-2', 'Velvet vampire gown, short', '벨벳 뱀파이어 드레스 · 짧은 기장', 'vampire costume, velvet gown, lace trim, bat brooch, strapless corset bodice, high slit', 'f2 x2 gf n:low v:frillvamp-ed'],
        ['ed-m', 'Vampire tailcoat', '뱀파이어 연미복', 'vampire costume, tailcoat, brocade waistcoat, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open shirt and velvet coat', '풀어 헤친 셔츠와 벨벳 코트', 'open dress shirt, velvet coat, loose ascot', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['corset', 'Black corset', '검은 코르셋', 'black corset', 'x12 gf'],
        ['bow', 'Big back bow', '등 뒤 큰 리본', 'big bow at the back', 'gf'],
      ],
      foundation: [
        ['frill', 'Frilled socks', '프릴 양말', 'frilled socks', 'x0 gf'],
        ['lace', 'Lace thighhighs', '레이스 니삭스', 'lace-trimmed thighhighs', 'x12 gf'],
        ['pantyhose', 'Black pantyhose', '검은 팬티스타킹', 'black pantyhose', 'x01 gf'],
      ],
      neckwear: [
        ['bow', 'Red bowtie', '빨간 보타이', 'red bowtie'],
        ['rose', 'Rose choker', '장미 초커', 'rose choker'],
        ['ascot', 'Ascot', '애스콧', 'ascot', 'an:low gm'],
      ],
      outer: [
        ['twoside', 'Two-sided cape', '겉과 안이 다른 망토', 'two-sided cape, red lining, high collar', 'f1'],
        ['capelet', 'Short capelet', '짧은 케이플릿', 'short capelet, bat clasp', 'f1'],
        ['bats', 'Cape breaking into bats', '박쥐 떼로 흩어지는 망토', 'cape edge dissolving into bats', 'f3 c:animal'],
      ],
      footwear: [
        ['mary', 'Platform mary janes', '플랫폼 메리제인', 'platform mary janes', 'gf'],
        ['boots', 'Lace-up boots', '끈 부츠', 'lace-up boots'],
        ['loafers', 'Buckled loafers', '버클 로퍼', 'buckled loafers', 'gm'],
      ],
      headwear: [
        ['rose', 'Rose hair ornament', '장미 머리 장식', 'hair flower, blue rose'],
        ['wings', 'Bat wing hair clips', '박쥐 날개 머리핀', 'bat wing hair ornament'],
        ['headdress', 'Lace headband with a bow', '리본 레이스 머리띠', 'lace headband with a red bow', 'gf'],
        ['minitop', 'Tilted mini top hat', '기울여 쓴 미니 실크해트', 'mini top hat, tilted headwear', 'f1'],
      ],
      accessories: [
        ['gloves', 'Lace-trimmed gloves', '레이스 장갑', 'lace-trimmed gloves'],
        ['fishnet', 'Lace gloves', '레이스 장갑', 'lace gloves', 'x2'],
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings costume on the back', 'f1'],
        ['brooch', 'Bat brooch', '박쥐 브로치', 'bat brooch'],
      ],
      weapon: [
        ['parasol', 'Lace parasol', '레이스 양산', 'holding a black lace parasol', 'f1'],
        ['glass', 'Wine glass of juice', '주스 담은 와인잔', 'holding a wine glass of red juice', 'f2'],
        ['rose', 'Single red rose', '빨간 장미 한 송이', 'holding a single red rose', 'f1'],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs'],
        ['pale', 'Pale makeup', '창백한 얼굴 분장', 'pale skin makeup', 'F2'],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
    },
  }),

  /* ─── E-03 꼬마 악마 ─── */
  costume('imp', 'Little Devil', '꼬마 악마', 'E-03', {
    tag: 'halloween costume, devil costume, frills', tagReal: 'devil costume, halloween night',
    colors: ['black', 'crimson', 'red', 'hot pink', 'deep purple', 'pastel pink'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Red hoodie dress', '빨간 후드 원피스', 'red hoodie dress, felt horns on the hood', 'f0 F0 gf'],
        ['hm-m', 'Red hoodie and black shorts', '빨간 후드티와 검은 반바지', 'red hoodie, felt horns on the hood, black shorts', 'f0 F0 gm'],
        ['pt-0', 'Little devil dress, long', '꼬마 악마 원피스 · 긴 기장', 'devil costume, little devil dress, red trim, frilled skirt, long sleeves, black corset over the dress, long high-waist skirt', 'f1 F1 x0 gf v:imp-pt'],
        ['pt-1', 'Little devil dress, knee', '꼬마 악마 원피스 · 무릎 기장', 'devil costume, little devil dress, red trim, frilled skirt, short sleeves over long sleeves, knee length', 'f1 F1 x1 gf v:imp-pt'],
        ['pt-2', 'Little devil dress, short', '꼬마 악마 원피스 · 짧은 기장', 'devil costume, little devil dress, red trim, frilled skirt, crop top cut, detached sleeves, frilled miniskirt', 'f1 F1 x2 gf n:low v:imp-pt'],
        ['pt-m', 'Little devil jacket', '꼬마 악마 재킷', 'devil costume, cropped jacket, shorts, suspenders', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless devil top', '민소매 악마 상의', 'devil costume, sleeveless top, shorts, studded belt', 'f1 F1 x2 gm'],
        ['ed-0', 'Corset devil dress, long', '코르셋 악마 원피스 · 긴 기장', 'devil costume, black corset dress, red ribbon, high collar, long sleeves, layered long skirt', 'f2 x0 gf n:high v:imp-ed'],
        ['ed-1', 'Corset devil dress, knee', '코르셋 악마 원피스 · 무릎 기장', 'devil costume, black corset dress, red ribbon, puffy sleeves, high-waist knee-length skirt', 'f2 x1 gf v:imp-ed'],
        ['ed-2', 'Corset devil dress, short', '코르셋 악마 원피스 · 짧은 기장', 'devil costume, black corset dress, red ribbon, leotard cut, detached sleeves, frilled overskirt', 'f2 x2 gf v:imp-ed'],
        ['ed-m', 'Devil prince coat', '악마 왕자 코트', 'devil prince, long coat with red lining, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open coat and harness', '풀어 헤친 코트와 하네스', 'open long coat, harness, black trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['corset', 'Black corset', '검은 코르셋', 'black corset', 'x12 gf'],
        ['chain', 'Studded belt', '징 벨트', 'studded belt'],
      ],
      foundation: [
        ['striped', 'Red and black striped thighhighs', '빨강 검정 줄무늬 니삭스', 'red and black striped thighhighs', 'gf'],
        ['single', 'Single thighhigh', '한쪽만 신은 니삭스', 'single thighhigh', 'x12 gf'],
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
      ],
      neckwear: [
        ['choker', 'Heart choker', '하트 초커', 'heart choker'],
        ['bell', 'Choker with a bell', '방울 초커', 'choker, jingle bell'],
      ],
      outer: [
        ['jacket', 'Cropped jacket', '크롭 재킷', 'cropped jacket, red lining', 'f1'],
        ['cape', 'Bat-collar cape', '박쥐 깃 망토', 'cape with a bat-wing collar', 'f2'],
      ],
      footwear: [
        ['platform', 'Platform boots', '플랫폼 부츠', 'platform boots'],
        ['mary', 'Red mary janes', '빨간 메리제인', 'red mary janes', 'gf'],
      ],
      headwear: [
        ['horns', 'Curled horn headband', '말린 뿔 머리띠', 'curled horns headband'],
        ['crown', 'Gold-tipped horn headband', '금 장식 뿔 머리띠', 'devil horn headband with gold tips', 'f1'],
        ['clips', 'Horn hair clips', '뿔 머리핀', 'small horn hair clips', 'f1'],
      ],
      accessories: [
        ['tail', 'Clip-on devil tail with a bow', '리본 단 달아 놓은 악마 꼬리', 'clip-on costume devil tail, tail bow'],
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings costume on the back', 'f1'],
        ['glasses', 'Red-framed glasses', '빨간 테 안경', 'red-framed eyewear', 'f1'],
        ['earrings', 'Pumpkin earrings', '호박 귀걸이', 'pumpkin earrings'],
      ],
      weapon: [
        ['toy', 'Toy trident', '장난감 삼지창', 'holding a toy trident', 'F1'],
        ['trident', 'Ribboned trident', '리본 삼지창', 'holding a trident with a ribbon', 'f2'],
        ['lolli', 'Heart lollipop', '하트 막대사탕', 'holding a heart lollipop', 'f1'],
      ],
      device: [
        ['fang', 'Fang', '덧니', 'fang, smug'],
        ['heart', 'Heart cheek paint', '볼의 하트 분장', 'small heart painted on the cheek'],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
    },
  }),

  /* ─── E-04 늑대 후드 ─── */
  costume('wolfhood', 'Wolf Hood', '늑대 후드', 'E-04', {
    tag: 'halloween costume, werewolf costume, fake animal ears', tagReal: 'werewolf costume, halloween night, full moon',
    colors: ['charcoal', 'brown', 'grey', 'black', 'crimson', 'beige'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Brown hoodie dress with felt ears', '펠트 귀 단 갈색 후드 원피스', 'brown hoodie dress, felt wolf ears on the hood', 'f0 F0 gf'],
        ['hm-m', 'Grey hoodie with felt ears', '펠트 귀 단 회색 후드티', 'grey hoodie, felt wolf ears on the hood, joggers', 'f0 F0 gm'],
        ['pt-0', 'Fur-trimmed wolf dress, long', '털 장식 늑대 원피스 · 긴 기장', 'werewolf costume, fur-trimmed dress, torn hem, long sleeves, coat dress cut, calf length', 'f1 F1 x0 gf v:wolfhood-pt'],
        ['pt-1', 'Fur-trimmed wolf dress, knee', '털 장식 늑대 원피스 · 무릎 기장', 'werewolf costume, fur-trimmed dress, torn hem, fur collar, knee length', 'f1 F1 x1 gf v:wolfhood-pt'],
        ['pt-2', 'Fur-trimmed wolf dress, short', '털 장식 늑대 원피스 · 짧은 기장', 'werewolf costume, fur-trimmed dress, torn hem, crop top cut, torn miniskirt', 'f1 F1 x2 gf n:low v:wolfhood-pt'],
        ['pt-m', 'Fur-collar jacket and jeans', '털 깃 재킷과 청바지', 'werewolf costume, fur collar jacket, torn jeans', 'f1 F1 x01 gm'],
        ['pt-m2', 'Torn sleeveless shirt', '찢긴 민소매 셔츠', 'werewolf costume, torn sleeveless shirt, cargo pants', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Red hood ensemble, long', '빨간 두건 차림 · 긴 기장', 'red hood, lace-up bodice, fur-trimmed skirt, long sleeves, long skirt', 'f2 x0 gf v:wolfhood-ed'],
        ['ed-1', 'Red hood ensemble, knee', '빨간 두건 차림 · 무릎 기장', 'red hood, lace-up bodice, fur-trimmed skirt, puff sleeves, knee-length skirt', 'f2 x1 gf v:wolfhood-ed'],
        ['ed-2', 'Red hood ensemble, short', '빨간 두건 차림 · 짧은 기장', 'red hood, lace-up bodice, fur-trimmed skirt, off-shoulder bodice, miniskirt', 'f2 x2 gf n:low v:wolfhood-ed'],
        ['ed-m', 'Long coat with fur collar', '털 깃 롱코트', 'long coat, wolf fur collar, fingerless gloves', 'f2 x01 gm'],
        ['ed-m2', 'Torn open shirt and fur scarf', '찢겨 풀린 셔츠와 털 목도리', 'torn open shirt, fur scarf, leather trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belts', 'Multiple belts', '여러 줄 벨트', 'multiple belts'],
        ['lace', 'Lace-up waist cincher', '끈 허리 조임', 'lace-up waist cincher', 'x12 gf'],
      ],
      foundation: [
        ['furSocks', 'Fur-trimmed socks', '털 장식 양말', 'fur-trimmed socks', 'gf'],
        ['torn', 'Torn pantyhose', '찢긴 팬티스타킹', 'torn pantyhose', 'x12 gf'],
        ['legwarmers', 'Fluffy leg warmers', '복슬한 레그워머', 'fluffy leg warmers', 'gf'],
      ],
      neckwear: [
        ['fur', 'Fur collar', '털 깃', 'fur collar'],
        ['collar', 'Studded collar', '징 박힌 목걸이', 'studded collar'],
      ],
      outer: [
        ['scarf', 'Fur scarf', '털 목도리', 'fur scarf', 'f1'],
        ['cape', 'Red hooded capelet', '빨간 두건 케이플릿', 'red hooded capelet', 'f1'],
      ],
      footwear: [
        ['paw', 'Paw boots', '발바닥 부츠', 'paw shoes, fluffy boots'],
        ['combat', 'Combat boots', '컴뱃 부츠', 'combat boots'],
      ],
      headwear: [
        ['ears', 'Fake wolf ears headband', '늑대 귀 머리띠', 'fake wolf ears, headband'],
        ['hood', 'Wolf-ear hood', '늑대 귀 후드', 'hood with wolf ears', 'f1'],
      ],
      accessories: [
        ['tail', 'Clip-on wolf tail', '달아 놓은 늑대 꼬리', 'clip-on costume wolf tail'],
        ['paws', 'Paw gloves', '발바닥 장갑', 'paw gloves'],
        ['furgloves', 'Fur-trimmed gloves', '털 장식 장갑', 'fur-trimmed gloves', 'f2'],
        ['moon', 'Full moon rising behind', '등 뒤로 뜨는 보름달', 'huge full moon rising behind', 'f3'],
      ],
      weapon: [
        ['bone', 'Bone-shaped cookie', '뼈다귀 쿠키', 'holding a bone-shaped cookie', 'f1'],
        ['basket', 'Basket of sweets', '과자 바구니', 'holding a basket of sweets', 'f1'],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs'],
        ['scratch', 'Painted claw marks', '그린 할퀸 자국', 'claw mark face paint, no blood', 'F2'],
        ['eyes', 'Glowing amber eyes', '호박색으로 빛나는 눈', 'glowing amber eyes', 'f3'],
      ],
    },
  }),

  /* ─── E-05 고양이 후드 ─── */
  costume('cathood', 'Cat Hood', '고양이 후드', 'E-05', {
    tag: 'halloween costume, black cat costume, fake animal ears', tagReal: 'black cat costume, halloween night',
    colors: ['black', 'pastel pink', 'lavender', 'pumpkin orange', 'white', 'grey'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black sweater dress', '검은 니트 원피스', 'black sweater dress, felt cat ears pinned on', 'f0 F0 gf'],
        ['hm-m', 'Black hoodie with drawn ears', '귀 그린 검은 후드티', 'black hoodie, cat ears drawn on the hood, black pants', 'f0 F0 gm'],
        ['pt-0', 'Black cat dress, long', '검은 고양이 원피스 · 긴 기장', 'cat costume, black cat dress, neck bell, tail bow, hood with cat ears, wide sleeves, sleeves past fingers, long skirt', 'f1 F1 x0 gf v:cathood-pt'],
        ['pt-1', 'Black cat dress, knee', '검은 고양이 원피스 · 무릎 기장', 'cat costume, black cat dress, neck bell, tail bow, puffy short sleeves, frilled knee-length skirt', 'f1 F1 x1 gf v:cathood-pt'],
        ['pt-2', 'Black cat dress, short', '검은 고양이 원피스 · 짧은 기장', 'cat costume, black cat dress, neck bell, tail bow, crop top cut, detached sleeves, short frilled skirt', 'f1 F1 x2 gf v:cathood-pt'],
        ['pt-m', 'Cat-ear hoodie and shorts', '고양이 귀 후드티와 반바지', 'cat costume, cat ear hoodie, shorts', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless cat hoodie', '민소매 고양이 후드티', 'cat costume, sleeveless hoodie, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Paw print dress, long', '발바닥 무늬 원피스 · 긴 기장', 'paw print dress, fur trim, frills, hooded capelet with cat ears, long sleeves, long skirt', 'f2 x0 gf v:cathood-ed'],
        ['ed-1', 'Paw print dress, knee', '발바닥 무늬 원피스 · 무릎 기장', 'paw print dress, fur trim, frills, puff sleeves, knee length', 'f2 x1 gf v:cathood-ed'],
        ['ed-2', 'Paw print dress, short', '발바닥 무늬 원피스 · 짧은 기장', 'paw print dress, fur trim, frills, leotard cut, short frilled skirt', 'f2 x2 gf v:cathood-ed'],
        ['ed-m', 'Cat-ear hooded coat', '고양이 귀 후드 코트', 'hooded coat with cat ears, fur trim, shorts', 'f2 x01 gm'],
        ['ed-m2', 'Open cat-ear jacket', '풀어 헤친 고양이 귀 재킷', 'open hooded jacket with cat ears, tank top', 'f2 x2 gm'],
      ],
      structure: [
        ['bow', 'Belt with a big bow', '큰 리본 벨트', 'belt with a big bow'],
      ],
      foundation: [
        ['striped', 'Striped socks', '줄무늬 양말', 'striped socks'],
        ['thigh', 'Cat-ear thighhighs', '고양이 귀 니삭스', 'thighhighs with cat ear trim', 'x12 gf'],
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
      ],
      neckwear: [
        ['bell', 'Neck bell', '목 방울', 'neck bell, ribbon'],
        ['collar', 'Cat collar', '고양이 목걸이', 'cat collar'],
      ],
      outer: [
        ['capelet', 'Cat-ear hooded capelet', '고양이 귀 후드 케이플릿', 'hooded capelet, cat ears on hood', 'f1'],
      ],
      footwear: [
        ['paw', 'Paw shoes', '발바닥 신발', 'paw shoes'],
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
      ],
      headwear: [
        ['ears', 'Cat ears headband', '고양이 귀 머리띠', 'fake cat ears, headband'],
        ['bow', 'Cat ears with a bow', '리본 단 고양이 귀', 'cat ear headband with a bow', 'f1'],
        ['witch', 'Mini witch hat with cat ears', '고양이 귀 미니 마녀 모자', 'mini witch hat with cat ears', 'f1'],
      ],
      accessories: [
        ['tail', 'Clip-on cat tail with a bow', '리본 단 달아 놓은 고양이 꼬리', 'clip-on costume cat tail, tail bow'],
        ['paws', 'Paw gloves', '발바닥 장갑', 'paw gloves'],
        ['cat', 'Black cat on the shoulder', '어깨 위 검은 고양이', 'black cat perched on the shoulder', 'f2 c:animal'],
      ],
      weapon: [
        ['fish', 'Fish-shaped cookie', '물고기 쿠키', 'holding a fish-shaped cookie', 'f1'],
        ['yarn', 'Ball of yarn', '털실 뭉치', 'holding a ball of yarn', 'f1'],
        ['lantern', 'Cat-face lantern', '고양이 얼굴 등불', 'holding a cat-face paper lantern', 'f2'],
      ],
      device: [
        ['whiskers', 'Painted whiskers', '그린 수염', 'whisker markings face paint'],
        ['nose', 'Painted cat nose', '그린 고양이 코', 'painted cat nose, :3'],
        ['eyes', 'Glowing cat eyes', '빛나는 고양이 눈', 'glowing yellow slit pupils', 'f3'],
      ],
    },
  }),

  /* ─── E-06 붕대 토끼 ─── */
  costume('bandagebunny', 'Bandage Bunny', '붕대 토끼', 'E-06', {
    tag: 'halloween costume, rabbit hood, bandages', tagReal: 'halloween costume, rabbit hood, bandages, halloween night',
    colors: ['pastel pink', 'white', 'lavender', 'black', 'mint', 'lilac'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Pink pajama dress with gauze', '거즈 감은 분홍 잠옷 원피스', 'pink pajama dress, gauze wrapped on the arms', 'f0 F0 gf'],
        ['hm-m', 'Rabbit hoodie with gauze', '거즈 감은 토끼 후드티', 'rabbit ear hoodie, gauze wrapped on the arms, sweatpants', 'f0 F0 gm'],
        ['pt-0', 'Pink frilled bunny dress, long', '분홍 프릴 토끼 원피스 · 긴 기장', 'pink frilled dress, bandage ribbons, stitched rabbit patch, long sleeves, long skirt, bandaged hand', 'f1 F1 x0 gf v:bandagebunny-pt'],
        ['pt-1', 'Pink frilled bunny dress, knee', '분홍 프릴 토끼 원피스 · 무릎 기장', 'pink frilled dress, bandage ribbons, stitched rabbit patch, pink capelet, knee length, bandaged arm', 'f1 F1 x1 gf v:bandagebunny-pt'],
        ['pt-2', 'Pink frilled bunny dress, short', '분홍 프릴 토끼 원피스 · 짧은 기장', 'pink frilled dress, bandage ribbons, stitched rabbit patch, bandages wrapped over the bodice, frilled miniskirt', 'f1 F1 x2 gf v:bandagebunny-pt'],
        ['pt-m', 'Rabbit hoodie and shorts', '토끼 후드티와 반바지', 'rabbit ear hoodie, shorts, bandaged leg', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless rabbit hoodie with bandages', '붕대 감은 민소매 토끼 후드티', 'sleeveless rabbit hoodie, bandaged arms, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Bandage-ribbon pinafore dress, long', '붕대 리본 앞치마 원피스 · 긴 기장', 'layered frilled pinafore dress, bandage ribbons, frilled blouse, long skirt, bandaged hand', 'f2 x0 gf v:bandagebunny-ed'],
        ['ed-1', 'Bandage-ribbon pinafore dress, knee', '붕대 리본 앞치마 원피스 · 무릎 기장', 'layered frilled pinafore dress, bandage ribbons, short capelet, knee length', 'f2 x1 gf v:bandagebunny-ed'],
        ['ed-2', 'Bandage-ribbon pinafore dress, short', '붕대 리본 앞치마 원피스 · 짧은 기장', 'layered frilled pinafore dress, bandage ribbons, corset bodice, bandages crossing, frilled miniskirt', 'f2 x2 gf v:bandagebunny-ed'],
        ['ed-m', 'Rabbit-hood coat', '토끼 후드 코트', 'hooded coat with rabbit ears, bandaged hand, shorts', 'f2 x01 gm'],
        ['ed-m2', 'Open rabbit jacket and bandaged torso', '풀어 헤친 토끼 재킷과 붕대', 'open hooded jacket with rabbit ears, bandaged torso, shorts', 'f2 x2 gm'],
      ],
      structure: [
        ['bandage', 'Bandage sash', '붕대 허리끈', 'bandage tied as a sash'],
        ['bow', 'Big back bow', '등 뒤 큰 리본', 'big bow at the back', 'gf'],
      ],
      foundation: [
        ['striped', 'Striped thighhighs', '줄무늬 니삭스', 'striped thighhighs', 'gf'],
        ['bandleg', 'Bandaged leg', '붕대 감은 다리', 'bandaged leg'],
        ['frill', 'Frilled socks', '프릴 양말', 'frilled socks', 'x0 gf'],
      ],
      neckwear: [
        ['bandage', 'Bandaged neck', '붕대 감은 목', 'bandage wrapped around the neck'],
        ['bow', 'Neck ribbon', '목 리본', 'neck ribbon'],
      ],
      outer: [
        ['capelet', 'Pink rabbit-hood capelet', '분홍 토끼 후드 케이플릿', 'pink capelet, rabbit hood', 'f1'],
      ],
      footwear: [
        ['slippers', 'Bunny slippers', '토끼 슬리퍼', 'bunny slippers', 'F1'],
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['boots', 'Platform boots', '플랫폼 부츠', 'platform boots', 'f2'],
      ],
      headwear: [
        ['hood', 'Rabbit hood', '토끼 후드', 'rabbit hood'],
        ['bandhead', 'Bandage on the head', '머리에 감은 붕대', 'bandaged head', 'f1'],
        ['ears', 'Floppy rabbit ears with a bandage', '붕대 감은 늘어진 토끼 귀', 'floppy fake rabbit ears, bandage on one ear', 'f1'],
      ],
      accessories: [
        ['plush', 'Stitched rabbit plush on the belt', '벨트에 단 꿰맨 토끼 인형', 'stitched rabbit plush hanging from the belt', 'f1'],
        ['bandarm', 'Bandaged arm', '붕대 감은 팔', 'bandaged arm'],
        ['plushreal', 'Plush rabbit floating beside', '옆에 떠 있는 토끼 인형', 'stitched rabbit plush floating beside, button eyes', 'f3'],
      ],
      weapon: [
        ['plush', 'Hugging a rabbit plush', '토끼 인형 안기', 'hugging a stitched rabbit plush', 'f1'],
        ['syringe', 'Toy syringe full of candy', '사탕 든 장난감 주사기', 'holding a toy syringe filled with candy', 'f1'],
      ],
      device: [
        ['eyeband', 'Bandage over one eye', '한쪽 눈 붕대', 'bandage over one eye', 'f1'],
        ['plaster', 'Bandaid on the cheek', '볼에 붙인 반창고', 'bandaid on cheek'],
        ['heart', 'Heart stickers on the cheeks', '볼 하트 스티커', 'heart stickers on the cheeks'],
      ],
    },
  }),

  /* ─── E-07 바느질 인형 ─── */
  costume('patchdoll', 'Patchwork Doll', '바느질 인형', 'E-07', {
    tag: 'halloween costume, patchwork clothes, stitches', tagReal: 'patchwork doll costume, halloween night',
    colors: ['mint', 'lavender', 'grey', 'black', 'pastel pink', 'olive'],
    items: {
      garment: [
        ['hm-f', 'Dress with felt patches', '펠트 조각 덧댄 원피스', 'dress with mismatched felt patches sewn on, visible stitches', 'f0 F0 gf'],
        ['hm-m', 'Patched overalls', '덧댄 멜빵바지', 'overalls with mismatched patches, striped shirt', 'f0 F0 gm'],
        ['pt-0', 'Patchwork dress, long', '패치워크 원피스 · 긴 기장', 'patchwork dress, stitched seams, cross-stitch trim, turtleneck underneath, pinafore cut, long skirt', 'f1 F1 x0 gf n:high v:patchdoll-pt'],
        ['pt-1', 'Patchwork dress, knee', '패치워크 원피스 · 무릎 기장', 'patchwork dress, stitched seams, cross-stitch trim, puffy short sleeves, knee length', 'f1 F1 x1 gf v:patchdoll-pt'],
        ['pt-2', 'Patchwork dress, short', '패치워크 원피스 · 짧은 기장', 'patchwork dress, stitched seams, cross-stitch trim, off-shoulder corset bodice, miniskirt', 'f1 F1 x2 gf n:low v:patchdoll-pt'],
        ['pt-m', 'Patchwork suit', '패치워크 정장', 'patchwork suit, mismatched sleeves, stitched seams', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open patchwork vest', '풀어 헤친 패치워크 조끼', 'open patchwork vest, rolled sleeves, stitched seams', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Two-tone patchwork dress, long', '두 색 패치워크 원피스 · 긴 기장', 'two-tone patchwork dress split down the middle, visible stitches, high collar, mismatched long sleeves, floor length', 'f2 x0 gf n:high v:patchdoll-ed'],
        ['ed-1', 'Two-tone patchwork dress, knee', '두 색 패치워크 원피스 · 무릎 기장', 'two-tone patchwork dress split down the middle, visible stitches, frilled knee-length hem', 'f2 x1 gf v:patchdoll-ed'],
        ['ed-2', 'Two-tone patchwork dress, short', '두 색 패치워크 원피스 · 짧은 기장', 'two-tone patchwork dress split down the middle, visible stitches, stitched corset bodice, short tulle skirt, mismatched detached sleeves', 'f2 x2 gf n:low v:patchdoll-ed'],
        ['ed-m', 'Two-tone patchwork coat', '두 색 패치워크 코트', 'two-tone patchwork coat, stitched seams, turtleneck', 'f2 x01 gm n:high'],
        ['ed-m2', 'Stitched open shirt', '풀어 헤친 꿰맨 셔츠', 'open shirt with stitched seams, patchwork trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['buttons', 'Big button belt', '큰 단추 벨트', 'belt with oversized buttons'],
        ['corset', 'Stitched corset', '꿰맨 코르셋', 'stitched corset', 'x12 gf'],
      ],
      foundation: [
        ['mismatch', 'Mismatched legwear', '양쪽 다른 니삭스', 'mismatched legwear', 'gf'],
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'gf'],
      ],
      neckwear: [
        ['choker', 'Stitched choker', '꿰맨 초커', 'stitched choker'],
        ['bow', 'Button bow tie', '단추 보타이', 'bow tie with a big button'],
      ],
      outer: [
        ['cardigan', 'Patched cardigan', '덧댄 가디건', 'oversized patched cardigan', 'f1'],
      ],
      footwear: [
        ['mismatch', 'Mismatched shoes', '짝짝이 신발', 'mismatched shoes'],
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['boots', 'Stitched boots', '꿰맨 부츠', 'stitched boots'],
      ],
      headwear: [
        ['bolts', 'Bolt hair clips', '나사 머리핀', 'bolt hair clips, costume screws on the head'],
        ['frillhat', 'Frilled bonnet', '프릴 보닛', 'frilled hat', 'f1'],
        ['buttons', 'Button hair ornaments', '단추 머리 장식', 'button hair ornaments'],
      ],
      accessories: [
        ['pins', 'Big safety pins', '큰 옷핀', 'oversized safety pins'],
        ['yarn', 'Yarn bows', '털실 리본', 'yarn bows'],
        ['key', 'Wind-up key on the back', '등에 단 태엽 열쇠', 'large wind-up key on the back', 'f1'],
        ['strings', 'Puppet strings from above', '위에서 내려온 인형 줄', 'puppet strings descending from above', 'f3'],
      ],
      weapon: [
        ['needle', 'Giant sewing needle', '커다란 바늘', 'holding a giant sewing needle prop', 'f1'],
        ['scissors', 'Giant scissors prop', '커다란 가위 소품', 'holding giant scissors prop', 'f2'],
        ['doll', 'Rag doll', '헝겊 인형', 'holding a rag doll', 'f1'],
      ],
      device: [
        ['stitch', 'Stitched face paint', '바느질 자국 얼굴 분장', 'stitches painted across the cheek'],
        ['button', 'Button over one eye', '한쪽 눈 단추', 'button over one eye', 'f2'],
        ['fingers', 'Stitched fingers', '꿰맨 손가락', 'stitched fingers'],
      ],
    },
  }),

  /* ─── E-08 등불 유령 ─── */
  costume('lanternghost', 'Lantern Ghost', '등불 유령', 'E-08', {
    tag: 'halloween costume, ghost costume, hooded robe', tagReal: 'ghost, halloween night, will-o-the-wisp',
    colors: ['white', 'lavender', 'mint', 'sky blue', 'lilac', 'grey'],
    items: {
      garment: [
        ['hm-f', 'White nightgown with a gauze hood', '거즈 후드 단 흰 잠옷', 'white nightgown, gauze hood', 'f0 F0 gf'],
        ['hm-m', 'Oversized white hoodie', '소매 긴 흰 후드티', 'oversized white hoodie, sleeves past fingers', 'f0 F0 gm'],
        ['pt-0', 'Hooded ghost robe, long', '후드 유령 로브 · 긴 기장', 'ghost costume, white hooded robe, ragged hem, sleeves past fingers, ankle length', 'f1 F1 x0 v:lanternghost-pt'],
        ['pt-1', 'Hooded ghost dress, knee', '후드 유령 원피스 · 무릎 기장', 'ghost costume, white hooded dress, ragged hem, wide sleeves, frills, knee length', 'f1 F1 x1 gf v:lanternghost-pt'],
        ['pt-2', 'Hooded ghost dress, short', '후드 유령 원피스 · 짧은 기장', 'ghost costume, white hooded dress, ragged hem, detached wide sleeves, short ragged hem', 'f1 F1 x2 gf v:lanternghost-pt'],
        ['pt-m2', 'Ghost hoodie and shorts', '유령 후드티와 반바지', 'ghost costume, white hoodie, shorts, sleeves past fingers', 'f1 F1 x12 gm'],
        ['ed-0', 'Layered chiffon ghost robe, long', '겹 시폰 유령 로브 · 긴 기장', 'layered chiffon ghost robe, translucent hem, hood, sleeves past fingers, floor length', 'f2 x0 v:lanternghost-ed'],
        ['ed-1', 'Layered chiffon ghost dress, knee', '겹 시폰 유령 원피스 · 무릎 기장', 'layered chiffon ghost dress, translucent hem, tiered skirt, wide sleeves, knee length', 'f2 x1 gf v:lanternghost-ed'],
        ['ed-2', 'Layered chiffon ghost dress, short', '겹 시폰 유령 원피스 · 짧은 기장', 'layered chiffon ghost dress, translucent hem, off-shoulder, detached sleeves, short ragged skirt', 'f2 x2 gf v:lanternghost-ed'],
        ['ed-m2', 'Ghost coat with wide sleeves', '넓은 소매 유령 코트', 'white hooded coat, wide sleeves, ragged hem', 'f2 x12 gm'],
      ],
      structure: [
        ['chain', 'Faded ribbon belt', '바랜 리본 허리띠', 'faded ribbon tied loosely at the waist'],
        ['sash', 'Ribbon sash', '리본 허리끈', 'ribbon sash'],
      ],
      foundation: [
        ['white', 'White thighhighs', '흰 니삭스', 'white thighhighs', 'gf'],
        ['frill', 'Frilled socks', '프릴 양말', 'frilled socks', 'gf'],
      ],
      neckwear: [
        ['chain', 'Bell on a ribbon', '리본 방울', 'pendant necklace'],
        ['bow', 'Neck ribbon', '목 리본', 'neck ribbon'],
      ],
      outer: [
        ['shroud', 'Sheer shroud', '얇은 덮개 천', 'sheer veil-like shroud over the shoulders', 'f2'],
      ],
      footwear: [
        ['float', 'Floating barefoot', '맨발로 떠 있음', 'barefoot, floating slightly above the ground', 'f3'],
        ['slippers', 'White slippers', '흰 슬리퍼', 'white slippers'],
        ['mary', 'White mary janes', '흰 메리제인', 'white mary janes', 'gf'],
      ],
      headwear: [
        ['minitop', 'Tilted mini top hat', '기울여 쓴 미니 실크해트', 'mini top hat, tilted headwear', 'f1'],
        ['ghostclip', 'Ghost hair clips', '유령 머리핀', 'ghost hair ornament'],
        ['pumpkinclip', 'Pumpkin hair clip', '호박 머리핀', 'pumpkin hair ornament'],
      ],
      accessories: [
        ['chain', 'Ribbons on the wrists', '손목 리본', 'faded ribbons trailing from the wrists'],
        ['ghosts', 'Little ghost friends', '작은 유령 친구들', 'tiny cartoon ghosts floating around', 'f2'],
        ['wisp', 'Wisps of ghost fire', '떠도는 도깨비불', 'small blue ghost fires floating around', 'f3'],
      ],
      weapon: [
        ['lantern', 'Lantern', '등불', 'holding a lantern'],
        ['candle', 'Candle holder', '촛대', 'holding a candle holder', 'f1'],
        ['bluelantern', 'Lantern with blue fire', '푸른 불 등불', 'holding a lantern with blue flame inside', 'f3'],
      ],
      device: [
        ['pale', 'Pale makeup', '창백한 분장', 'pale skin makeup'],
        ['sleepy', 'Dark circles', '눈 밑 그늘', 'dark circles under the eyes, sleepy'],
        ['eyes', 'Glowing white eyes', '희게 빛나는 눈', 'glowing white eyes', 'f3'],
      ],
    },
  }),

  /* ─── E-09 호박 드레스 ─── */
  costume('pumpkindress', 'Pumpkin Dress', '호박 드레스', 'E-09', {
    tag: 'halloween costume, pumpkin costume', tagReal: 'pumpkin costume, halloween night, glowing pumpkins',
    colors: ['pumpkin orange', 'black', 'deep purple', 'burnt orange', 'moss green'],
    items: {
      garment: [
        ['hm-f', 'Orange sweater and black tutu', '주황 스웨터와 검은 튀튀', 'orange sweater with a felt pumpkin face, black tutu skirt', 'f0 F0 gf'],
        ['hm-m', 'Orange hoodie with a pumpkin face', '호박 얼굴 주황 후드티', 'orange hoodie, felt pumpkin face sewn on', 'f0 F0 gm'],
        ['pt-0', 'Pumpkin balloon dress, long', '호박 풍선 원피스 · 긴 기장', 'pumpkin costume, pumpkin balloon dress, green ribbon, long juliet sleeves, ankle-length pumpkin skirt', 'f1 F1 x0 gf v:pumpkindress-pt'],
        ['pt-1', 'Pumpkin balloon dress, knee', '호박 풍선 원피스 · 무릎 기장', 'pumpkin costume, pumpkin balloon dress, green ribbon, puffy short sleeves, knee-length pumpkin skirt', 'f1 F1 x1 gf v:pumpkindress-pt'],
        ['pt-2', 'Pumpkin balloon dress, short', '호박 풍선 원피스 · 짧은 기장', 'pumpkin costume, pumpkin balloon dress, green ribbon, crop top cut, detached puffy sleeves, pumpkin bloomers', 'f1 F1 x2 gf v:pumpkindress-pt'],
        ['pt-m', 'Pumpkin print vest and shorts', '호박 무늬 조끼와 반바지', 'pumpkin print vest, shorts, green bow tie', 'f1 F1 x01 gm'],
        ['pt-m2', 'Orange sleeveless top and shorts', '주황 민소매와 반바지', 'pumpkin costume, orange sleeveless top, black shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Pumpkin ball dress, long', '호박 볼 드레스 · 긴 기장', 'pumpkin ball dress, ribbed puffy skirt, leaf trim, big back bow, high collar, long sleeves, floor length', 'f2 x0 gf n:high v:pumpkindress-ed'],
        ['ed-1', 'Pumpkin ball dress, knee', '호박 볼 드레스 · 무릎 기장', 'pumpkin ball dress, ribbed puffy skirt, leaf trim, big back bow, juliet sleeves, knee length', 'f2 x1 gf v:pumpkindress-ed'],
        ['ed-2', 'Pumpkin ball dress, short', '호박 볼 드레스 · 짧은 기장', 'pumpkin ball dress, ribbed puffy skirt, leaf trim, big back bow, off-shoulder pumpkin corset bodice, short bubble skirt', 'f2 x2 gf n:low v:pumpkindress-ed'],
        ['ed-m', 'Pumpkin prince jacket', '호박 왕자 재킷', 'pumpkin prince outfit, orange jacket with green leaf epaulettes, shorts', 'f2 x01 gm'],
        ['ed-m2', 'Open orange shirt and vine sash', '풀어 헤친 주황 셔츠와 덩굴 허리끈', 'open orange shirt, vine sash, black trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Big back bow', '등 뒤 큰 리본', 'big bow at the back'],
        ['vine', 'Vine sash', '덩굴 허리끈', 'curling vine sash'],
      ],
      foundation: [
        ['striped', 'Orange and black striped thighhighs', '주황 검정 줄무늬 니삭스', 'orange and black striped thighhighs', 'gf'],
        ['tights', 'Green tights', '초록 타이츠', 'green tights', 'x01 gf'],
      ],
      neckwear: [
        ['leaf', 'Leaf collar', '잎사귀 깃', 'leaf-shaped collar'],
        ['bow', 'Green bow', '초록 리본', 'green neck bow'],
      ],
      outer: [
        ['capelet', 'Leaf capelet', '잎사귀 케이플릿', 'capelet shaped like pumpkin leaves', 'f1'],
      ],
      footwear: [
        ['boots', 'Green boots', '초록 부츠', 'green ankle boots'],
        ['mary', 'Orange mary janes', '주황 메리제인', 'orange mary janes', 'gf'],
      ],
      headwear: [
        ['hat', 'Pumpkin hat', '호박 모자', 'pumpkin hat'],
        ['clip', 'Pumpkin hair ornament', '호박 머리 장식', 'pumpkin hair ornament'],
        ['stem', 'Stem beret', '꼭지 베레모', 'orange beret with a green stem', 'f1'],
      ],
      accessories: [
        ['earrings', 'Pumpkin earrings', '호박 귀걸이', 'pumpkin earrings'],
        ['brooch', 'Pumpkin brooch', '호박 브로치', 'pumpkin brooch'],
        ['glow', 'Pumpkins glowing around', '둘레에 빛나는 호박들', 'small glowing pumpkins floating around', 'f3'],
      ],
      weapon: [
        ['bucket', 'Pumpkin candy bucket', '호박 사탕 바구니', 'holding a pumpkin candy bucket', 'f1'],
        ['staff', 'Staff with a hanging lantern', '등불 매단 지팡이', 'holding a staff with a pumpkin lantern hanging', 'f2'],
        ['pie', 'Pumpkin pie', '호박 파이', 'holding a pumpkin pie', 'f1'],
      ],
      device: [
        ['cheek', 'Pumpkin sticker on the cheek', '볼 호박 스티커', 'pumpkin sticker on the cheek'],
        ['freckles', 'Painted freckles', '그린 주근깨', 'painted orange freckles'],
      ],
    },
  }),

  /* ─── E-10 묘지기 ─── */
  costume('gravekeeper', 'Grave Keeper', '묘지기', 'E-10', {
    tag: 'halloween costume, grim reaper costume, mini top hat', tagReal: 'grim reaper, halloween night',
    colors: ['black', 'charcoal', 'deep purple', 'bone white', 'midnight blue', 'crimson'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Skull-print black hoodie dress', '해골 무늬 검은 후드 원피스', 'black hoodie dress, skull print', 'f0 F0 gf'],
        ['hm-m', 'Skull-print hoodie and cargo shorts', '해골 무늬 후드티와 카고 반바지', 'black hoodie, skull print, cargo shorts', 'f0 F0 gm'],
        ['pt-0', 'Belted reaper dress, long', '벨트 감은 사신 원피스 · 긴 기장', 'reaper costume, black dress, multiple belts, skull buttons, hooded coat dress cut, long sleeves, ankle length', 'f1 F1 x0 gf v:gravekeeper-pt'],
        ['pt-1', 'Belted reaper dress, knee', '벨트 감은 사신 원피스 · 무릎 기장', 'reaper costume, black dress, multiple belts, skull buttons, worn over shorts, knee length, fingerless gloves', 'f1 F1 x1 gf v:gravekeeper-pt'],
        ['pt-2', 'Belted reaper dress, short', '벨트 감은 사신 원피스 · 짧은 기장', 'reaper costume, black dress, multiple belts, skull buttons, crop top cut, short shorts, torn cape', 'f1 F1 x2 gf n:low v:gravekeeper-pt'],
        ['pt-m', 'Reaper hooded coat', '사신 후드 코트', 'reaper costume, hooded coat, multiple belts, cargo pants', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless reaper hoodie', '민소매 사신 후드티', 'reaper costume, sleeveless hoodie, multiple belts', 'f1 F1 x2 gm'],
        ['ed-0', 'Asymmetrical reaper dress, long', '비대칭 사신 원피스 · 긴 기장', 'asymmetrical black dress, harness belts, tattered capelet, high collar, long sleeves, floor length', 'f2 x0 gf n:high v:gravekeeper-ed'],
        ['ed-1', 'Asymmetrical reaper dress, knee', '비대칭 사신 원피스 · 무릎 기장', 'asymmetrical black dress, harness belts, tattered capelet, knee length', 'f2 x1 gf v:gravekeeper-ed'],
        ['ed-2', 'Asymmetrical reaper dress, short', '비대칭 사신 원피스 · 짧은 기장', 'asymmetrical black dress, harness belts, tattered capelet, leather bustier bodice, tattered layered miniskirt', 'f2 x2 gf n:low v:gravekeeper-ed'],
        ['ed-m', 'Undertaker tailcoat', '장의사 연미복', 'undertaker tailcoat, skull pin, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open long coat and harness', '풀어 헤친 롱코트와 하네스', 'open long coat, harness, black trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belts', 'Multiple belts', '여러 줄 벨트', 'multiple belts'],
        ['pouches', 'Belt pouches', '벨트 주머니', 'belt pouches'],
      ],
      foundation: [
        ['single', 'Single thighhigh', '한쪽만 신은 니삭스', 'single thighhigh', 'gf'],
        ['striped', 'Black and white striped socks', '흑백 줄무늬 양말', 'black and white striped socks', 'gf'],
        ['tights', 'Torn black tights', '찢긴 검은 타이츠', 'torn black tights', 'x12 gf'],
      ],
      neckwear: [
        ['skull', 'Skull choker', '해골 초커', 'skull choker'],
        ['scarf', 'Long tattered scarf', '해진 긴 목도리', 'long tattered scarf'],
      ],
      outer: [
        ['cape', 'Tattered cape', '해진 망토', 'tattered cape', 'f1'],
        ['shadow', 'Cape of shadow', '그림자 망토', 'cape made of shadow', 'f3'],
      ],
      footwear: [
        ['boots', 'Buckled boots', '버클 부츠', 'buckled boots'],
        ['platform', 'Platform boots', '플랫폼 부츠', 'platform boots', 'f1'],
      ],
      headwear: [
        ['minitop', 'Tilted mini top hat', '기울여 쓴 미니 실크해트', 'mini top hat, tilted headwear'],
        ['skullclip', 'Skull hair clip', '해골 머리핀', 'skull hair ornament'],
        ['hood', 'Deep hood', '깊은 후드', 'hood up', 'f1'],
      ],
      accessories: [
        ['eyepatch', 'Eyepatch', '안대', 'eyepatch'],
        ['gloves', 'Fingerless gloves', '손가락 없는 장갑', 'fingerless gloves'],
        ['plush', 'Skull plush on the belt', '벨트에 단 해골 인형', 'skull plush hanging from the belt', 'f1'],
        ['crows', 'Crows on the shoulder', '어깨 위 까마귀', 'crows perched on the shoulder', 'f2 c:animal'],
      ],
      weapon: [
        ['scythe', 'Toy scythe', '장난감 낫', 'holding a toy scythe', 'F1'],
        ['bigscythe', 'Giant scythe', '커다란 낫', 'holding a giant scythe', 'f2'],
        ['shovel', 'Shovel over the shoulder', '어깨에 멘 삽', 'shovel over the shoulder', 'f1'],
        ['lantern', 'Skull lantern', '해골 등불', 'holding a skull lantern', 'f2'],
      ],
      device: [
        ['skullhalf', 'Half skull face paint', '반쪽 해골 분장', 'half-face skull face paint'],
        ['dark', 'Dark eye makeup', '짙은 눈 분장', 'dark eye makeup'],
        ['eyes', 'Glowing eyes under the hood', '후드 속 빛나는 눈', 'glowing eyes in the shadow of the hood', 'f3'],
      ],
    },
  }),

  /* ─── E-30 그림자 수녀 ─── */
  costume('hauntednun', 'Haunted Nun', '그림자 수녀', 'E-30', {
    tag: 'halloween costume, gothic nun costume', tagM: 'halloween costume, gothic monk costume',
    tagReal: 'haunted nun costume, halloween night', tagRealM: 'haunted monk costume, halloween night',
    colors: ['black', 'ivory', 'dusty grey', 'burgundy', 'deep purple'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Hand-sewn nun habit', '손수 만든 수녀 수도복', 'hand-sewn nun habit, long tunic, narrow apron panel, stitched cuffs', 'f0 F0 gf'],
        ['hm-m', 'Hand-sewn monk robe', '손수 만든 수도사 로브', 'hand-sewn monk robe, belted long tunic, stitched cuffs', 'f0 F0 gm'],
        ['pt-f', 'Gothic nun habit', '고딕 수녀 수도복', 'gothic nun habit, fitted bodice, long pleated skirt, layered collar', 'f1 F1 x01 gf'],
        ['pt-short', 'Short gothic nun dress', '짧은 고딕 수녀복', 'gothic nun costume, fitted bodice, layered short skirt, long sleeves', 'f1 F1 x2 gf n:high'],
        ['pt-m', 'Gothic monk robe', '고딕 수도사 로브', 'gothic monk robe, high collar, layered long panels, tied waist', 'f1 F1 gm n:high'],
        ['ed-f', 'Velvet mourning habit', '벨벳 애도 수도복', 'gothic nun habit, velvet bodice, sheer layered sleeves, trailing pleated skirt', 'f2 x01 gf'],
        ['ed-short', 'Lace-trimmed gothic habit', '레이스 고딕 수도복', 'gothic nun costume, fitted velvet bodice, lace-trimmed overskirt, split front panels', 'f2 x2 gf'],
        ['ed-m', 'Faded ceremonial monk robe', '바랜 의식용 수도사 로브', 'gothic monk robe, faded velvet panels, layered high collar, long draped sleeves', 'f2 gm n:high'],
      ],
      structure: [['cord', 'Braided waist cord', '땋은 허리끈', 'braided cord at the waist', ''], ['belt', 'Velvet waist belt', '벨벳 허리띠', 'velvet waist belt', 'f1']],
      foundation: [['tights', 'Opaque stockings', '불투명 스타킹', 'opaque stockings', 'gf'], ['lace', 'Lace stockings', '레이스 스타킹', 'lace stockings', 'f1 gf x2']],
      neckwear: [['collar', 'Pleated collar', '주름 깃', 'pleated fabric collar', 'an:high'], ['ribbon', 'Narrow throat ribbon', '목 리본', 'narrow ribbon at the throat', 'an:high']],
      outer: [['shawl', 'Faded shoulder shawl', '바랜 어깨 숄', 'faded shawl draped over the shoulders', ''], ['cape', 'Short velvet cape', '짧은 벨벳 망토', 'short velvet cape', 'f1']],
      footwear: [['shoes', 'Worn lace-up shoes', '낡은 끈 구두', 'worn lace-up shoes', ''], ['boots', 'Button boots', '단추 부츠', 'button boots', 'f1']],
      headwear: [['wimple', 'Wimple and veil', '윔플과 베일', 'nun wimple with a long fabric veil', 'gf'], ['veil', 'Gothic veil', '고딕 베일', 'narrow gothic nun veil', 'f1 gf'], ['hood', 'Monk hood', '수도사 후드', 'monk hood draped behind the head', 'gm']],
      accessories: [['beads', 'Dark bead strand', '어두운 구슬 줄', 'dark bead strand at the waist', ''], ['rose', 'Wilted rose brooch', '시든 장미 브로치', 'wilted rose brooch on the habit', ''], ['gloves', 'Long lace gloves', '긴 레이스 장갑', 'long lace gloves', 'gf']],
      weapon: [['candle', 'Candle lantern', '촛불 등불', 'holding a small candle lantern', ''], ['book', 'Old prayer book', '낡은 기도서', 'holding an old prayer book', '']],
      device: [['pale', 'Pale face makeup', '창백한 얼굴 분장', 'pale face makeup', ''], ['tear', 'Dark tear makeup', '검은 눈물 분장', 'dark tear makeup below the eyes', 'f1']],
      effect: [['chapel', 'Abandoned chapel', '버려진 예배당', 'abandoned chapel, candlelight and dusty pews', 'f2']],
    },
  }),

  /* ─── E-11 좀비 간호사 ─── */
  costume('zombienurse', 'Zombie Nurse', '좀비 간호사', 'E-11', {
    tag: 'halloween costume, nurse costume, bandages', tagReal: 'zombie nurse costume, halloween night',
    tagM: 'halloween costume, doctor costume, bandages', tagRealM: 'zombie doctor costume, halloween night',
    colors: ['pastel pink', 'white', 'mint', 'lavender', 'sky blue'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'White dress with a heart patch', '하트 장식 흰 원피스', 'white dress, small heart patch, gauze on the arms', 'f0 F0 gf'],
        ['hm-m', 'Lab coat over a T-shirt', '티셔츠 위 실험 가운', 'lab coat over a T-shirt, gauze on the arms', 'f0 F0 gm'],
        ['pt-0', 'Bandaged nurse dress, long', '붕대 간호사 원피스 · 긴 기장', 'nurse costume, nurse dress, frilled apron, wrist cuffs, bandages, long sleeves, ankle length', 'f1 F1 x0 gf v:zombienurse-pt'],
        ['pt-1', 'Bandaged nurse dress, knee', '붕대 간호사 원피스 · 무릎 기장', 'nurse costume, nurse dress, frilled apron, wrist cuffs, bandages, puffy short sleeves, knee length, bandaged arm', 'f1 F1 x1 gf v:zombienurse-pt'],
        ['pt-2', 'Bandaged nurse dress, short', '붕대 간호사 원피스 · 짧은 기장', 'nurse costume, nurse dress, frilled apron, wrist cuffs, bandages, mini length, garter straps', 'f1 F1 x2 gf v:zombienurse-pt'],
        ['pt-m', 'Doctor coat with bandages', '붕대 감은 의사 가운', 'doctor costume, lab coat, bandaged hand, scrubs', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open lab coat over scrubs top', '풀어 입은 실험 가운', 'doctor costume, open lab coat, sleeveless scrub top, bandaged arm', 'f1 F1 x2 gm'],
        ['ed-0', 'Pastel victorian nurse dress, long', '파스텔 빅토리안 간호사 원피스 · 긴 기장', 'pastel victorian nurse dress, bandage ribbons, high collar, puffy long sleeves, long apron, floor length', 'f2 x0 gf n:high v:zombienurse-ed'],
        ['ed-1', 'Pastel victorian nurse dress, knee', '파스텔 빅토리안 간호사 원피스 · 무릎 기장', 'pastel victorian nurse dress, bandage ribbons, frills, puffy sleeves, knee length', 'f2 x1 gf v:zombienurse-ed'],
        ['ed-2', 'Pastel victorian nurse dress, short', '파스텔 빅토리안 간호사 원피스 · 짧은 기장', 'pastel victorian nurse dress, bandage ribbons, corset bodice, bandages crossing, short skirt', 'f2 x2 gf v:zombienurse-ed'],
        ['ed-m', 'Long doctor coat and stitched gloves', '긴 의사 가운과 꿰맨 장갑', 'long white doctor coat, stitched gloves, bandaged neck', 'f2 x01 gm'],
        ['ed-m2', 'Open doctor coat and bandaged chest', '풀어 헤친 의사 가운과 붕대', 'open doctor coat, bandaged torso, slacks', 'f2 x2 gm'],
      ],
      structure: [
        ['apron', 'Frilled apron', '프릴 앞치마', 'frilled apron', 'gf'],
        ['belt', 'Bandage belt', '붕대 벨트', 'bandage wrapped as a belt'],
      ],
      foundation: [
        ['white', 'White thighhighs', '흰 니삭스', 'white thighhighs', 'gf'],
        ['bandleg', 'Bandaged leg', '붕대 감은 다리', 'bandaged leg'],
        ['garter', 'Thighhighs with garters', '가터 니삭스', 'white thighhighs, garter straps', 'x2 gf'],
      ],
      neckwear: [
        ['steth', 'Stethoscope', '청진기', 'stethoscope'],
        ['bandage', 'Bandaged neck', '붕대 감은 목', 'bandaged neck'],
      ],
      outer: [
        ['cardigan', 'Pastel cardigan', '파스텔 가디건', 'pastel cardigan', 'f1'],
      ],
      footwear: [
        ['nurse', 'White nurse shoes', '흰 간호사 신발', 'white nurse shoes'],
        ['platform', 'Platform mary janes', '플랫폼 메리제인', 'platform mary janes', 'f2 gf'],
      ],
      headwear: [
        ['cap', 'Nurse cap', '간호사 모자', 'nurse cap', 'gf'],
        ['bandhead', 'Bandaged head', '붕대 감은 머리', 'bandaged head'],
        ['mirror', 'Head mirror', '이마 반사경', 'head mirror', 'gm'],
      ],
      accessories: [
        ['cuffs', 'Wrist cuffs', '손목 커프스', 'wrist cuffs'],
        ['bandarm', 'Bandaged arm', '붕대 감은 팔', 'bandaged arm'],
        ['plaster', 'Bandaids on the knees', '무릎 반창고', 'bandaids on the knees'],
      ],
      weapon: [
        ['syringe', 'Giant toy syringe', '커다란 장난감 주사기', 'holding a giant toy syringe'],
        ['pills', 'Candy pill bottle', '사탕 약병', 'holding a pill bottle full of candy', 'f1'],
        ['clipboard', 'Clipboard', '클립보드', 'holding a clipboard', 'f1'],
      ],
      device: [
        ['pale', 'Pale zombie makeup', '창백한 좀비 분장', 'pale greenish skin makeup'],
        ['stitch', 'Stitches on the cheek', '볼의 바느질 자국', 'stitches painted on the cheek'],
        ['eyeband', 'Bandage over one eye', '한쪽 눈 붕대', 'bandage over one eye', 'f1'],
        ['gas', 'Weathered gas mask', '낡은 방독면', 'weathered gas mask covering the face', 'f2 c:mask'],
      ],
    },
  }),

  /* ─── E-12 할로윈 메이드 ─── */
  costume('halloweenmaid', 'Halloween Maid', '할로윈 메이드', 'E-12', {
    tag: 'halloween costume, maid', tagReal: 'maid, halloween night',
    tagM: 'halloween costume, butler', tagRealM: 'butler, halloween night',
    colors: ['black', 'pumpkin orange', 'deep purple', 'burgundy', 'lavender'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black dress and paper apron', '검은 원피스와 종이 앞치마', 'black dress, white paper apron with drawn bats', 'f0 F0 gf'],
        ['hm-m', 'White shirt and black vest', '흰 셔츠와 검은 조끼', 'white shirt, black vest, orange bow tie', 'f0 F0 gm'],
        ['pt-0', 'Halloween maid dress, long', '할로윈 메이드 원피스 · 긴 기장', 'maid, halloween maid dress, frilled apron with bat print, long sleeves, ankle length', 'f1 F1 x0 gf v:halloweenmaid-pt'],
        ['pt-1', 'Halloween maid dress, knee', '할로윈 메이드 원피스 · 무릎 기장', 'maid, halloween maid dress, frilled apron with bat print, puffy short sleeves, knee length', 'f1 F1 x1 gf v:halloweenmaid-pt'],
        ['pt-2', 'Halloween maid dress, short', '할로윈 메이드 원피스 · 짧은 기장', 'maid, halloween maid dress, frilled apron with bat print, orange frills, detached collar, mini length', 'f1 F1 x2 gf v:halloweenmaid-pt'],
        ['pt-m', 'Butler vest with a pumpkin pin', '호박 핀 단 집사 조끼', 'butler, black vest, pumpkin pin, orange bow tie', 'f1 F1 x01 gm'],
        ['pt-m2', 'Butler shirt with rolled sleeves', '소매 걷은 집사 셔츠', 'butler, unbuttoned collar, rolled sleeves, vest', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Purple maid dress, long', '보라 메이드 원피스 · 긴 기장', 'maid, purple maid dress, long frilled apron with spider web lace, big back bow, high collar, long sleeves, floor length', 'f2 x0 gf n:high v:halloweenmaid-ed'],
        ['ed-1', 'Purple maid dress, knee', '보라 메이드 원피스 · 무릎 기장', 'maid, purple maid dress, long frilled apron with spider web lace, big back bow, puffy sleeves, knee length', 'f2 x1 gf v:halloweenmaid-ed'],
        ['ed-2', 'Purple maid dress, short', '보라 메이드 원피스 · 짧은 기장', 'maid, purple maid dress, long frilled apron with spider web lace, big back bow, off-shoulder corset bodice, short frilled skirt', 'f2 x2 gf n:low v:halloweenmaid-ed'],
        ['ed-m', 'Butler tailcoat with orange lining', '안이 주황인 집사 연미복', 'butler, tailcoat with orange lining', 'f2 x01 gm'],
        ['ed-m2', 'Open-collar butler waistcoat', '깃 풀린 집사 조끼', 'butler, open collar, fitted waistcoat, loosened tie', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['apron', 'Frilled apron', '프릴 앞치마', 'frilled apron', 'gf'],
        ['bow', 'Big back bow', '등 뒤 큰 리본', 'big bow at the back', 'gf'],
      ],
      foundation: [
        ['frill', 'Frilled thighhighs', '프릴 니삭스', 'frilled thighhighs', 'gf'],
        ['striped', 'Orange and black striped stockings', '주황 검정 줄무늬 스타킹', 'orange and black striped stockings', 'gf'],
        ['pantyhose', 'Black pantyhose', '검은 팬티스타킹', 'black pantyhose', 'x01 gf'],
      ],
      neckwear: [
        ['collar', 'Detached collar', '떼어 낸 깃', 'detached collar'],
        ['bow', 'Orange bow tie', '주황 보타이', 'orange bow tie'],
      ],
      outer: [],
      footwear: [
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['oxford', 'Oxford shoes', '옥스퍼드 구두', 'oxford shoes', 'gm'],
      ],
      headwear: [
        ['headdress', 'Maid headdress with bat wings', '박쥐 날개 메이드 헤드드레스', 'maid headdress, bat wing ornament', 'gf'],
        ['minihat', 'Mini witch hat', '미니 마녀 모자', 'mini witch hat clipped on, tilted headwear', 'f1 gf'],
        ['cat', 'Cat ears', '고양이 귀', 'fake cat ears', 'f1'],
      ],
      accessories: [
        ['cuffs', 'Wrist cuffs', '손목 커프스', 'wrist cuffs'],
        ['gloves', 'White gloves', '흰 장갑', 'white gloves', 'gm'],
        ['earrings', 'Pumpkin earrings', '호박 귀걸이', 'pumpkin earrings', 'gf'],
      ],
      weapon: [
        ['tray', 'Tray of cookies', '쿠키 쟁반', 'holding a tray of halloween cookies'],
        ['teapot', 'Pumpkin teapot', '호박 찻주전자', 'holding a pumpkin teapot', 'f1'],
        ['cake', 'Halloween cake', '할로윈 케이크', 'holding a halloween cake', 'f2'],
      ],
      device: [
        ['fang', 'Fang', '덧니', 'fang, smile'],
        ['bat', 'Bat sticker under the eye', '눈 밑 박쥐 스티커', 'bat sticker under the eye'],
      ],
    },
  }),

  /* ─── E-13 동물 잠옷 ─── */
  costume('onesie', 'Animal Onesie', '동물 잠옷', 'E-13', {
    tag: 'halloween costume, animal costume, onesie', tagReal: 'animal costume, onesie, halloween night',
    colors: ['brown', 'grey', 'black', 'pastel pink', 'white', 'pumpkin orange'],
    items: {
      garment: [
        ['hm-bear', 'Bear hoodie and sweatpants', '곰 후드티와 운동복 바지', 'bear ear hoodie, sweatpants', 'f0 F0'],
        ['hm-dog', 'Dog-ear hoodie', '강아지 귀 후드티', 'hoodie with floppy dog ears, shorts', 'f0 F0'],
        ['pt-dog', 'Puppy onesie', '강아지 잠옷', 'dog kigurumi, hooded onesie, floppy ears on the hood', 'f1 F1 x0'],
        ['pt-cat', 'Black cat onesie', '검은 고양이 잠옷', 'black cat kigurumi, hooded onesie', 'f1 F1 x0'],
        ['pt-bat', 'Bat onesie with wing sleeves', '날개 소매 박쥐 잠옷', 'bat kigurumi, hooded onesie, wing-shaped sleeves', 'f1 F1 x01'],
        ['pt-short', 'Short animal romper', '짧은 동물 롬퍼', 'animal hood romper, shorts, fluffy trim', 'f1 F1 x12 gf'],
        ['pt-shortm', 'Animal hoodie and shorts', '동물 후드티와 반바지', 'animal hoodie with ears, shorts', 'f1 F1 x12 gm'],
        ['ed-fluffy', 'Fluffy fleece onesie', '복슬한 플리스 잠옷', 'fluffy fleece kigurumi, hood with ears, oversized sleeves', 'f2 x01'],
        ['ed-cape', 'Fluffy hood capelet and short dress', '복슬한 후드 케이플릿과 짧은 원피스', 'fluffy animal hood capelet, short dress, pompoms', 'f2 x12 gf'],
        ['ed-capem', 'Fluffy animal hood jacket', '복슬한 동물 후드 재킷', 'fluffy animal hood jacket, shorts', 'f2 x12 gm'],
      ],
      structure: [],
      foundation: [
        ['legwarmers', 'Leg warmers', '레그워머', 'leg warmers'],
        ['socks', 'Fluffy socks', '복슬한 양말', 'fluffy socks'],
      ],
      neckwear: [
        ['bell', 'Bell collar', '방울 목걸이', 'neck bell'],
        ['pompom', 'Pompom drawstrings', '방울 끈', 'pompom drawstrings'],
      ],
      outer: [],
      footwear: [
        ['paw', 'Paw slippers', '발바닥 슬리퍼', 'paw slippers'],
        ['sneakers', 'Sneakers', '운동화', 'sneakers', 'F1'],
      ],
      headwear: [
        ['hood', 'Animal hood up', '동물 후드 씀', 'animal hood, hood up'],
        ['ears', 'Animal ears headband', '동물 귀 머리띠', 'fake animal ears, headband'],
      ],
      accessories: [
        ['paws', 'Paw mittens', '발바닥 벙어리장갑', 'paw gloves'],
        ['tail', 'Tail sewn on', '꿰매 단 꼬리', 'tail sewn onto the onesie'],
        ['pillow', 'Pillow under the arm', '옆구리에 낀 베개', 'pillow under the arm', 'f1'],
      ],
      weapon: [
        ['plush', 'Matching plush', '같은 동물 인형', 'hugging a matching animal plush'],
        ['cocoa', 'Mug of hot cocoa', '코코아 머그', 'holding a mug of hot cocoa', 'f1'],
      ],
      device: [
        ['nose', 'Painted animal nose', '그린 동물 코', 'painted animal nose'],
        ['blush', 'Blush stickers', '볼 스티커', 'blush stickers'],
      ],
    },
  }),

]);

/* ═══════════════════════════════════════════════════════════════════
 * HALLOWEEN EVERYDAY — 평소 옷에 할로윈 장식만 8
 * 옷은 그대로 요즘 옷이고, 할로윈은 머리 장식 · 무늬 · 소품 · 작은 스티커로만 얹는다.
 * ═══════════════════════════════════════════════════════════════════ */
const everyday = collection('everyday', 'HALLOWEEN EVERYDAY', 'PA·TFY·VII', 'everyday clothes, halloween touch',
  ['black', 'pumpkin orange', 'cream', 'grey', 'deep purple', 'burgundy', 'navy', 'olive'],
  [

  /* ─── D-01 할로윈 데일리 — 평소 옷에 할로윈 장식만 ─── */
  costume('daily', 'Halloween Casual', '할로윈 데일리', 'D-01', {
    tag: 'casual, halloween', tagReal: 'casual, halloween night',
    colors: ['black', 'pumpkin orange', 'cream', 'grey', 'deep purple', 'olive'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black hoodie and paper bat pins', '검은 후드티와 종이 박쥐', 'black hoodie, paper bat cutouts pinned on, jeans', 'f0 F0 gf'],
        ['hm-m', 'Grey sweatshirt with a drawn pumpkin', '호박 그린 회색 맨투맨', 'grey sweatshirt with a pumpkin drawn in marker, jeans', 'f0 F0 gm'],
        ['pt-0', 'Bat-print hoodie dress, long', '박쥐 무늬 후드 원피스 · 긴 기장', 'oversized hoodie dress, small bat print, ankle-length, leggings', 'f1 F1 x0 gf v:dl-hood'],
        ['pt-1', 'Bat-print hoodie and pleated skirt', '박쥐 무늬 후드티와 주름치마', 'oversized hoodie, small bat print, pleated skirt, knee length', 'f1 F1 x1 gf v:dl-hood'],
        ['pt-2', 'Cropped bat-print hoodie and mini skirt', '박쥐 무늬 크롭 후드티와 미니스커트', 'cropped hoodie, small bat print, pleated miniskirt', 'f1 F1 x2 gf v:dl-hood'],
        ['pt-k0', 'Pumpkin knit and long skirt', '호박색 니트와 긴 치마', 'orange knit sweater, pumpkin embroidery, long corduroy skirt', 'f1 F1 x0 gf v:dl-knit'],
        ['pt-k1', 'Pumpkin knit and corduroy skirt', '호박색 니트와 코듀로이 치마', 'orange knit sweater, pumpkin embroidery, corduroy skirt, knee length', 'f1 F1 x1 gf v:dl-knit'],
        ['pt-k2', 'Off-shoulder pumpkin knit and mini skirt', '오프숄더 호박색 니트와 미니스커트', 'off-shoulder orange knit sweater, pumpkin embroidery, corduroy miniskirt', 'f1 F1 x2 gf v:dl-knit n:low'],
        ['pt-m', 'Bat-print hoodie and cargo pants', '박쥐 무늬 후드티와 카고 바지', 'oversized hoodie, small bat print, cargo pants', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless bat-print hoodie and shorts', '박쥐 무늬 민소매 후드와 반바지', 'sleeveless hoodie, small bat print, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Cardigan with spiderweb knit, long skirt', '거미줄 니트 가디건과 긴 치마', 'cardigan with spiderweb knit pattern, slip skirt, ankle length', 'f2 x0 gf v:dl-card'],
        ['ed-1', 'Cardigan with spiderweb knit, midi skirt', '거미줄 니트 가디건과 미디 치마', 'cardigan with spiderweb knit pattern, slip skirt, knee length', 'f2 x1 gf v:dl-card'],
        ['ed-2', 'Cropped spiderweb cardigan and mini skirt', '거미줄 크롭 가디건과 미니스커트', 'cropped cardigan with spiderweb knit pattern, slip miniskirt', 'f2 x2 gf v:dl-card'],
        ['ed-m', 'Spiderweb knit and wide trousers', '거미줄 니트와 와이드 바지', 'spiderweb knit sweater, wide trousers, long coat', 'f2 x01 gm'],
        ['ed-m2', 'Striped tee layered under a tee', '줄무늬 티 겹쳐 입기', 'long sleeve striped tee layered under a short sleeve tee, black jeans', 'f2 x2 gm'],
      ],
      structure: [
        ['chain', 'Canvas belt', '캔버스 벨트', 'canvas belt'],
        ['belt', 'Studded belt', '징 박힌 벨트', 'studded belt'],
      ],
      foundation: [
        ['pumpkin', 'Pumpkin print socks', '호박 무늬 양말', 'pumpkin print socks'],
        ['web', 'Spiderweb tights', '거미줄 타이츠', 'spiderweb tights', 'gf'],
        ['striped', 'Orange and black striped socks', '주황 검정 줄무늬 양말', 'orange and black striped socks'],
      ],
      neckwear: [
        ['bat', 'Bat pendant', '박쥐 펜던트', 'bat pendant necklace'],
        ['scarf', 'Plaid scarf', '체크 목도리', 'plaid scarf'],
      ],
      outer: [
        ['bomber', 'Bomber jacket with patches', '패치 단 항공 점퍼', 'bomber jacket with ghost and pumpkin patches', 'f1'],
        ['denim', 'Denim jacket with pins', '핀 꽂은 청재킷', 'denim jacket covered in halloween enamel pins', 'f1'],
        ['coat', 'Long wool coat', '긴 울 코트', 'long wool coat', 'f2'],
      ],
      footwear: [
        ['sneakers', 'Chunky sneakers', '두꺼운 운동화', 'chunky sneakers'],
        ['boots', 'Platform boots', '플랫폼 부츠', 'platform boots'],
        ['loafers', 'Loafers', '로퍼', 'loafers'],
      ],
      headwear: [
        ['beanie', 'Cat-ear beanie', '고양이 귀 비니', 'beanie with cat ears'],
        ['horns', 'Devil horn hair clips', '악마 뿔 머리핀', 'small devil horn hair clips'],
        ['witch', 'Mini witch hat clip', '미니 마녀 모자 핀', 'mini witch hat hair clip'],
        ['bats', 'Bat hair clips', '박쥐 머리핀', 'bat hair ornament'],
        ['pumpkin', 'Pumpkin hair clip', '호박 머리핀', 'small jack-o-lantern hair clip', ''],
        ['ghostclip', 'Ghost hair clip', '유령 머리핀', 'small ghost hair clip', ''],
      ],
      accessories: [
        ['tote', 'Pumpkin tote bag', '호박 에코백', 'tote bag with a pumpkin print'],
        ['earrings', 'Ghost earrings', '유령 귀걸이', 'ghost earrings'],
        ['ring', 'Spider ring', '거미 반지', 'spider ring'],
        ['bats', 'Paper bats fluttering for real', '진짜로 날아오르는 종이 박쥐', 'paper bats coming alive and fluttering around', 'f3'],
      ],
      weapon: [
        ['latte', 'Pumpkin spice latte', '펌킨 스파이스 라테', 'holding a pumpkin spice latte'],
        ['phone', 'Phone with a bat case', '박쥐 케이스 휴대폰', 'holding a phone with a bat phone case'],
        ['candy', 'Bag of candy', '사탕 봉지', 'holding a bag of halloween candy'],
      ],
      device: [
        ['bat', 'Bat sticker on the cheek', '볼 박쥐 스티커', 'bat sticker on the cheek'],
        ['web', 'Small spiderweb face paint', '작은 거미줄 분장', 'small spiderweb painted on the cheek'],
      ],
    },
  }),

  /* ─── D-02 할로윈 교복 — 블레이저 교복에 할로윈 장식만 ─── */
  costume('school', 'Halloween School Uniform', '할로윈 교복', 'D-02', {
    tag: 'school uniform, halloween', tagReal: 'school uniform, halloween night',
    colors: ['navy', 'black', 'charcoal', 'burgundy', 'cream', 'deep purple'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Uniform with a paper witch hat', '종이 마녀 모자 쓴 교복', 'school uniform, blazer, pleated skirt, paper bats taped on the blazer', 'f0 F0 gf'],
        ['hm-m', 'Uniform with paper fangs', '종이 송곳니 단 교복', 'school uniform, blazer, trousers, paper bats taped on the blazer', 'f0 F0 gm'],
        ['pt-0', 'Blazer uniform, long skirt', '블레이저 교복 · 긴 치마', 'school uniform, blazer, bat pin on the lapel, pleated skirt, ankle length', 'f1 F1 x0 gf v:sc-blazer'],
        ['pt-1', 'Blazer uniform, knee skirt', '블레이저 교복 · 무릎 치마', 'school uniform, blazer, bat pin on the lapel, pleated skirt, knee length', 'f1 F1 x1 gf v:sc-blazer'],
        ['pt-2', 'Blazer uniform, short skirt', '블레이저 교복 · 짧은 치마', 'school uniform, cropped blazer, bat pin on the lapel, pleated miniskirt', 'f1 F1 x2 gf v:sc-blazer'],
        ['pt-v0', 'Sweater vest uniform, long skirt', '스웨터 조끼 교복 · 긴 치마', 'school uniform, sweater vest with pumpkin embroidery, collared shirt, pleated skirt, ankle length', 'f1 F1 x0 gf v:sc-vest'],
        ['pt-v1', 'Sweater vest uniform, knee skirt', '스웨터 조끼 교복 · 무릎 치마', 'school uniform, sweater vest with pumpkin embroidery, collared shirt, pleated skirt, knee length', 'f1 F1 x1 gf v:sc-vest'],
        ['pt-v2', 'Sweater vest uniform, short skirt', '스웨터 조끼 교복 · 짧은 치마', 'school uniform, sweater vest with pumpkin embroidery, rolled sleeves, pleated miniskirt', 'f1 F1 x2 gf v:sc-vest'],
        ['pt-m', 'Blazer uniform with trousers', '바지 블레이저 교복', 'school uniform, blazer, bat pin on the lapel, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Loosened uniform shirt', '풀어 입은 교복 셔츠', 'school uniform, unbuttoned collar, loosened tie, rolled sleeves, trousers', 'f1 F1 x2 gm'],
        ['ed-0', 'Uniform under a witch capelet, long skirt', '마녀 케이플릿 겹친 교복 · 긴 치마', 'school uniform, witch capelet over the blazer, star pin, pleated skirt, ankle length', 'f2 x0 gf v:sc-cape'],
        ['ed-1', 'Uniform under a witch capelet, knee skirt', '마녀 케이플릿 겹친 교복 · 무릎 치마', 'school uniform, witch capelet over the blazer, star pin, pleated skirt, knee length', 'f2 x1 gf v:sc-cape'],
        ['ed-2', 'Uniform under a witch capelet, short skirt', '마녀 케이플릿 겹친 교복 · 짧은 치마', 'school uniform, witch capelet over a cropped blazer, star pin, pleated miniskirt', 'f2 x2 gf v:sc-cape'],
        ['ed-m', 'Uniform under a vampire cape', '뱀파이어 망토 겹친 교복', 'school uniform, vampire cape over the blazer, red lining, trousers', 'f2 x01 gm'],
        ['ed-m2', 'Open uniform shirt and cape', '풀어 입은 교복 셔츠와 망토', 'school uniform, open collar, loosened tie, short cape, trousers', 'f2 x2 gm'],
      ],
      structure: [
        ['belt', 'Plain belt', '벨트', 'belt'],
      ],
      foundation: [
        ['socks', 'Knee socks', '니삭스', 'kneehighs', 'gf'],
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
        ['striped', 'Orange and black striped kneehighs', '주황 검정 줄무늬 니삭스', 'orange and black striped kneehighs', 'gf'],
      ],
      neckwear: [
        ['ribbon', 'Uniform ribbon', '교복 리본', 'neck ribbon', 'gf'],
        ['tie', 'Uniform tie', '교복 넥타이', 'necktie'],
        ['battie', 'Bat-print tie', '박쥐 무늬 넥타이', 'necktie with bat print'],
      ],
      outer: [
        ['cardigan', 'Oversized cardigan', '큰 가디건', 'oversized cardigan', 'f1'],
        ['cape', 'Short vampire cape', '짧은 뱀파이어 망토', 'short vampire cape, red lining', 'f1'],
      ],
      footwear: [
        ['loafers', 'Loafers', '로퍼', 'loafers'],
        ['sneakers', 'Sneakers', '운동화', 'sneakers'],
      ],
      headwear: [
        ['witch', 'Tilted mini witch hat', '기울여 쓴 미니 마녀 모자', 'mini witch hat, tilted headwear'],
        ['ears', 'Cat ears headband', '고양이 귀 머리띠', 'fake cat ears, headband'],
        ['horns', 'Devil horn headband', '악마 뿔 머리띠', 'devil horn headband'],
        ['bats', 'Bat hair clips', '박쥐 머리핀', 'bat hair ornament'],
        ['pumpkin', 'Pumpkin hair clip', '호박 머리핀', 'small jack-o-lantern hair clip', ''],
        ['ghostclip', 'Ghost hair clip', '유령 머리핀', 'small ghost hair clip', ''],
        ['batribbon', 'Hair ribbon with a bat charm', '박쥐 장식 머리 리본', 'black hair ribbon with a small bat charm', ''],
      ],
      accessories: [
        ['bag', 'School bag with a ghost charm', '유령 키링 단 책가방', 'school bag with a ghost charm'],
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings costume on the back', 'f1'],
        ['tail', 'Clip-on devil tail', '달아 놓은 악마 꼬리', 'clip-on costume devil tail', 'f1'],
        ['float', 'Notebooks floating around', '떠다니는 공책', 'notebooks and pencils floating around', 'f3'],
      ],
      weapon: [
        ['candy', 'Lollipop', '막대사탕', 'holding a lollipop'],
        ['bucket', 'Pumpkin candy bucket', '호박 사탕 바구니', 'holding a pumpkin candy bucket'],
        ['book', 'Textbook', '교과서', 'holding a textbook', 'F1'],
        ['broom', 'Classroom broom', '교실 빗자루', 'holding a classroom broom like a witch', 'f1'],
      ],
      device: [
        ['fang', 'Fang', '덧니', 'fang, smile'],
        ['star', 'Star sticker under the eye', '눈 밑 별 스티커', 'star sticker under the eye'],
      ],
    },
  }),

  /* ─── D-03 할로윈 파티룩 — 외출복에 할로윈 장식만 ─── */
  costume('nightout', 'Halloween Night Out', '할로윈 파티룩', 'D-03', {
    tag: 'party outfit, halloween', tagReal: 'party outfit, halloween night',
    colors: ['black', 'burgundy', 'deep purple', 'midnight blue', 'crimson', 'silver'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black dress with a paper bat collar', '종이 박쥐 깃 단 검은 원피스', 'little black dress, paper bat collar pinned on', 'f0 F0 gf'],
        ['hm-m', 'Black shirt with paper fangs', '종이 송곳니 단 검은 셔츠', 'black shirt, black jeans, paper bat pinned on the pocket', 'f0 F0 gm'],
        ['pt-0', 'Little black dress, long', '리틀 블랙 드레스 · 긴 기장', 'little black dress, spider web lace trim, long sleeves, ankle length', 'f1 F1 x0 gf v:no-lbd'],
        ['pt-1', 'Little black dress, knee', '리틀 블랙 드레스 · 무릎 기장', 'little black dress, spider web lace trim, short sleeves, knee length', 'f1 F1 x1 gf v:no-lbd'],
        ['pt-2', 'Little black dress, mini', '리틀 블랙 드레스 · 짧은 기장', 'little black dress, spider web lace trim, off-shoulder, mini length', 'f1 F1 x2 gf v:no-lbd n:low'],
        ['pt-c0', 'Corset top and long skirt', '코르셋 톱과 긴 치마', 'corset top over a long sleeve blouse, bat embroidery, long satin skirt', 'f1 F1 x0 gf v:no-corset'],
        ['pt-c1', 'Corset top and midi skirt', '코르셋 톱과 미디 치마', 'corset top, bat embroidery, satin midi skirt', 'f1 F1 x1 gf v:no-corset'],
        ['pt-c2', 'Corset top and mini skirt', '코르셋 톱과 미니스커트', 'corset top, bat embroidery, satin miniskirt', 'f1 F1 x2 gf v:no-corset n:low'],
        ['pt-m', 'Black shirt and slacks', '검은 셔츠와 슬랙스', 'black dress shirt, bat collar pin, slacks', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open black shirt and leather pants', '풀어 헤친 검은 셔츠와 가죽 바지', 'open black shirt, leather pants', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Velvet slip dress over a turtleneck', '목폴라 위 벨벳 슬립 원피스', 'velvet slip dress layered over a sheer turtleneck, moon charm straps, ankle length', 'f2 x0 gf v:no-slip n:high'],
        ['ed-1', 'Velvet slip dress, midi', '벨벳 슬립 원피스 · 미디', 'velvet slip dress, moon charm straps, midi length', 'f2 x1 gf v:no-slip'],
        ['ed-2', 'Velvet slip dress, mini', '벨벳 슬립 원피스 · 미니', 'velvet slip dress, moon charm straps, low back, mini length', 'f2 x2 gf v:no-slip'],
        ['ed-m', 'Velvet blazer and turtleneck', '벨벳 블레이저와 목폴라', 'velvet blazer, black turtleneck, slacks, bat lapel pin', 'f2 x01 gm n:high'],
        ['ed-m2', 'Velvet blazer over a sheer shirt', '비치는 셔츠 위 벨벳 블레이저', 'open velvet blazer over a sheer black shirt, slacks', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['chain', 'Studded belt', '징 벨트', 'studded belt'],
        ['harness', 'Harness belt', '하네스 벨트', 'harness belt', 'x12'],
      ],
      foundation: [
        ['web', 'Spiderweb tights', '거미줄 타이츠', 'spiderweb tights', 'gf'],
        ['fishnet', 'Opaque black tights', '불투명 검은 타이츠', 'opaque black tights', 'x2 gf'],
        ['sheer', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black pantyhose', 'gf'],
      ],
      neckwear: [
        ['choker', 'Bat choker', '박쥐 초커', 'choker, bat charm'],
        ['chain', 'Layered pendants', '겹친 펜던트 목걸이', 'layered pendant necklaces'],
      ],
      outer: [
        ['leather', 'Leather jacket', '가죽 재킷', 'leather jacket', 'f1'],
        ['faux', 'Faux fur coat', '인조 털 코트', 'black faux fur coat', 'f2'],
        ['cape', 'Sheer cape', '비치는 망토', 'sheer black cape', 'f2'],
      ],
      footwear: [
        ['boots', 'Platform boots', '플랫폼 부츠', 'platform boots'],
        ['heels', 'Strappy heels', '끈 힐', 'strappy heels', 'gf'],
        ['chelsea', 'Chelsea boots', '첼시 부츠', 'chelsea boots', 'gm'],
      ],
      headwear: [
        ['horns', 'Glitter devil horns', '반짝이 악마 뿔', 'glitter devil horn headband'],
        ['ears', 'Cat ears', '고양이 귀', 'cat ear headband'],
        ['veil', 'Small black veil', '작은 검은 베일', 'small black birdcage veil', 'f1 gf'],
        ['witchclip', 'Mini witch hat clip', '미니 마녀 모자 핀', 'mini witch hat hair clip', ''],
        ['batwing', 'Bat wing headband', '박쥐 날개 머리띠', 'headband with small bat wings', ''],
        ['skull', 'Skull hair clip', '해골 머리핀', 'small skull hair clip', ''],
      ],
      accessories: [
        ['earrings', 'Bat earrings', '박쥐 귀걸이', 'bat earrings'],
        ['gloves', 'Lace gloves', '레이스 장갑', 'black lace gloves'],
        ['clutch', 'Coffin clutch bag', '관 모양 클러치', 'coffin-shaped clutch bag', 'f1'],
        ['bats', 'Bats circling overhead', '머리 위를 도는 박쥐들', 'bats circling overhead', 'f3 c:animal'],
      ],
      weapon: [
        ['drink', 'Glowing purple drink', '보랏빛 음료', 'holding a glass of glowing purple drink'],
        ['phone', 'Taking a selfie', '셀카 찍기', 'taking a selfie with a phone'],
      ],
      device: [
        ['web', 'Small spiderweb face paint', '작은 거미줄 분장', 'small spiderweb painted on the cheek'],
        ['fang', 'Fangs', '송곳니', 'fangs'],
      ],
    },
  }),

  /* ─── D-04 할로윈 오피스룩 ─── */
  costume('office', 'Halloween Office', '할로윈 오피스룩', 'D-04', {
    tag: 'business casual, halloween', tagReal: 'business casual, halloween night',
    colors: ['black', 'charcoal', 'cream', 'burgundy', 'navy', 'pumpkin orange'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Blouse and a paper bat lanyard', '블라우스와 종이 박쥐 사원증', 'blouse, pencil skirt, paper bat pinned on the lanyard', 'f0 F0 gf'],
        ['hm-m', 'Dress shirt and a paper bat lanyard', '셔츠와 종이 박쥐 사원증', 'dress shirt, slacks, paper bat pinned on the lanyard', 'f0 F0 gm'],
        ['pt-0', 'Bow blouse and skirt, long', '리본 블라우스와 치마 · 긴 기장', 'blouse with a pussy bow, pumpkin brooch, long pleated skirt', 'f1 F1 x0 gf v:office-pt'],
        ['pt-1', 'Bow blouse and skirt, knee', '리본 블라우스와 치마 · 무릎 기장', 'blouse with a pussy bow, pumpkin brooch, pencil skirt, knee length', 'f1 F1 x1 gf v:office-pt'],
        ['pt-2', 'Bow blouse and skirt, short', '리본 블라우스와 치마 · 짧은 기장', 'blouse with a pussy bow, pumpkin brooch, sleeveless blouse, fitted pencil miniskirt', 'f1 F1 x2 gf v:office-pt'],
        ['pt-m', 'Shirt and bat-print tie', '셔츠와 박쥐 무늬 넥타이', 'dress shirt, bat-print necktie, slacks', 'f1 F1 x01 gm'],
        ['pt-m2', 'Rolled sleeves and loosened tie', '소매 걷고 풀어 맨 넥타이', 'dress shirt with rolled sleeves, loosened bat-print necktie, unbuttoned collar, slacks', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Tailored blazer with a bat pin, long', '박쥐 핀 테일러드 블레이저 · 긴 기장', 'tailored blazer with a bat lapel pin, black blouse, wide trousers', 'f2 x0 gf v:office-ed'],
        ['ed-1', 'Tailored blazer with a bat pin, knee', '박쥐 핀 테일러드 블레이저 · 무릎 기장', 'tailored blazer with a bat lapel pin, black blouse, pencil skirt, knee length', 'f2 x1 gf v:office-ed'],
        ['ed-2', 'Tailored blazer with a bat pin, short', '박쥐 핀 테일러드 블레이저 · 짧은 기장', 'tailored blazer with a bat lapel pin, black blouse, blazer dress, mini length', 'f2 x2 gf v:office-ed'],
        ['ed-m', 'Three-piece suit with a bat pin', '박쥐 핀 쓰리피스 정장', 'tailored three-piece suit, bat lapel pin, black shirt', 'f2 x01 gm'],
        ['ed-m2', 'Suit with an open black shirt', '검은 셔츠 풀어 입은 정장', 'tailored suit, open black shirt, bat lapel pin', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Thin leather belt', '얇은 가죽 벨트', 'thin leather belt', ''],
      ],
      foundation: [
        ['sheer', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black pantyhose', 'gf'],
        ['web', 'Spiderweb tights', '거미줄 타이츠', 'spiderweb tights', 'x12 gf'],
      ],
      neckwear: [
        ['lanyard', 'Lanyard with a ghost charm', '유령 참 사원증', 'id card lanyard with a ghost charm', ''],
        ['bowtie', 'Orange bow tie', '주황 보타이', 'orange bow tie', 'gm'],
      ],
      outer: [
        ['cardigan', 'Black cardigan', '검은 가디건', 'black cardigan', 'f1'],
        ['trench', 'Trench coat', '트렌치코트', 'trench coat', 'f2'],
      ],
      footwear: [
        ['pumps', 'Black pumps', '검은 펌프스', 'black pumps', 'gf'],
        ['oxford', 'Oxford shoes', '옥스퍼드 구두', 'oxford shoes', ''],
      ],
      headwear: [
        ['horns', 'Small devil horn clips', '작은 악마 뿔 핀', 'small devil horn hair clips', ''],
        ['ears', 'Cat ears headband', '고양이 귀 머리띠', 'fake cat ears, headband', ''],
        ['witch', 'Mini witch hat clip', '미니 마녀 모자 핀', 'mini witch hat hair clip', ''],
        ['batclip', 'Bat hair clips', '박쥐 머리핀', 'bat hair ornament', ''],
        ['pumpkin', 'Pumpkin hair clip', '호박 머리핀', 'small jack-o-lantern hair clip', ''],
        ['ghostclip', 'Ghost hair clip', '유령 머리핀', 'small ghost hair clip', ''],
      ],
      accessories: [
        ['glasses', 'Glasses', '안경', 'glasses', ''],
        ['earrings', 'Bat earrings', '박쥐 귀걸이', 'bat earrings', ''],
        ['papers', 'Papers flying like bats', '박쥐처럼 날아가는 서류', 'papers flying around like bats', 'f3'],
      ],
      weapon: [
        ['coffee', 'Pumpkin coffee mug', '호박 머그 커피', 'holding a pumpkin-shaped coffee mug', ''],
        ['folder', 'Folder with a bat sticker', '박쥐 스티커 서류철', 'holding a folder with a bat sticker', ''],
        ['candy', 'Bowl of office candy', '사무실 사탕 그릇', 'holding a bowl of candy', ''],
      ],
      device: [
        ['fang', 'Fang', '덧니', 'fang, smile', ''],
        ['bat', 'Bat sticker on the cheek', '볼 박쥐 스티커', 'bat sticker on the cheek', ''],
      ],
    },
  }),

  /* ─── D-05 할로윈 트레이닝복 ─── */
  costume('athleisure', 'Halloween Athleisure', '할로윈 트레이닝복', 'D-05', {
    tag: 'sportswear, halloween', tagReal: 'sportswear, halloween night',
    colors: ['black', 'pumpkin orange', 'grey', 'deep purple', 'white'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Track jacket and leggings with a paper bat', '종이 박쥐 단 트레이닝복', 'track jacket, leggings, paper bat pinned on', 'f0 F0 gf'],
        ['hm-m', 'Track jacket with a paper bat', '종이 박쥐 단 트랙 재킷', 'track jacket, track pants, paper bat pinned on', 'f0 F0 gm'],
        ['pt-0', 'Bone-stripe tracksuit, long', '뼈 줄무늬 트레이닝복 · 긴 기장', 'tracksuit with a bone print stripe down the sides, track pants', 'f1 F1 x0 gf v:athleisure-pt'],
        ['pt-1', 'Bone-stripe tracksuit, knee', '뼈 줄무늬 트레이닝복 · 무릎 기장', 'tracksuit with a bone print stripe down the sides, track shorts over leggings', 'f1 F1 x1 gf v:athleisure-pt'],
        ['pt-2', 'Bone-stripe tracksuit, short', '뼈 줄무늬 트레이닝복 · 짧은 기장', 'tracksuit with a bone print stripe down the sides, cropped track jacket, bike shorts', 'f1 F1 x2 gf v:athleisure-pt'],
        ['pt-m', 'Bone-stripe tracksuit, pants', '뼈 줄무늬 트레이닝복 바지', 'tracksuit with a bone print stripe down the sides, track pants', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless training top and shorts', '민소매 운동복과 반바지', 'sleeveless training top, bone print shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Reflective skeleton athleisure set, long', '반사 해골 무늬 운동복 · 긴 기장', 'black athleisure set with a reflective skeleton print, long sleeve top, joggers', 'f2 x0 gf v:athleisure-ed'],
        ['ed-1', 'Reflective skeleton athleisure set, knee', '반사 해골 무늬 운동복 · 무릎 기장', 'black athleisure set with a reflective skeleton print, zip hoodie, bike shorts', 'f2 x1 gf v:athleisure-ed'],
        ['ed-2', 'Reflective skeleton athleisure set, short', '반사 해골 무늬 운동복 · 짧은 기장', 'black athleisure set with a reflective skeleton print, sports bra, leggings, open zip hoodie', 'f2 x2 gf v:athleisure-ed n:low'],
        ['ed-m', 'Skeleton athleisure set, joggers', '해골 무늬 운동복과 조거', 'black athleisure set with a reflective skeleton print, joggers', 'f2 x01 gm'],
        ['ed-m2', 'Sleeveless compression top', '민소매 기능성 상의', 'sleeveless compression top with a reflective skeleton print, joggers', 'f2 x2 gm'],
      ],
      structure: [],
      foundation: [
        ['socks', 'Pumpkin crew socks', '호박 무늬 양말', 'pumpkin print crew socks', ''],
      ],
      neckwear: [
        ['towel', 'Sports towel', '스포츠 타월', 'sports towel around the neck', ''],
      ],
      outer: [
        ['wind', 'Windbreaker', '바람막이', 'windbreaker jacket', 'f1'],
      ],
      footwear: [
        ['runners', 'Running shoes', '러닝화', 'running shoes', ''],
        ['slides', 'Slides with socks', '양말에 슬리퍼', 'slides with socks', 'F1'],
      ],
      headwear: [
        ['band', 'Devil horn sports headband', '악마 뿔 헤어밴드', 'sports headband with small devil horns', ''],
        ['cap', 'Cat-ear cap', '고양이 귀 캡', 'baseball cap with cat ears', ''],
        ['clip', 'Bat hair clip', '박쥐 집게핀', 'bat hair clip', ''],
        ['pbeanie', 'Jack-o-lantern patch beanie', '호박 패치 비니', 'orange knit beanie with a jack-o-lantern patch', ''],
        ['ghostclip', 'Ghost hair clip', '유령 머리핀', 'small ghost hair clip', ''],
        ['witchclip', 'Mini witch hat clip', '미니 마녀 모자 핀', 'mini witch hat hair clip', ''],
      ],
      accessories: [
        ['earbuds', 'Wireless earbuds', '무선 이어폰', 'wireless earbuds', ''],
        ['wrist', 'Pumpkin wristbands', '호박 손목밴드', 'pumpkin wristbands', ''],
        ['glow', 'Skeleton print glowing', '빛나는 해골 무늬', 'skeleton print glowing in the dark', 'f3'],
      ],
      weapon: [
        ['bottle', 'Pumpkin water bottle', '호박 물병', 'holding a pumpkin-shaped water bottle', ''],
        ['phone', 'Phone', '휴대폰', 'holding a phone', ''],
      ],
      device: [
        ['eyeblack', 'Orange eye black', '주황 아이블랙', 'orange eye black stripes under the eyes', ''],
        ['bat', 'Bat sticker on the cheek', '볼 박쥐 스티커', 'bat sticker on the cheek', ''],
      ],
    },
  }),

  /* ─── D-06 할로윈 카페 알바 ─── */
  costume('cafe', 'Halloween Cafe Shift', '할로윈 카페 알바', 'D-06', {
    tag: 'cafe uniform, waitress, halloween', tagReal: 'cafe uniform, waitress, halloween night',
    tagM: 'cafe uniform, waiter, halloween', tagRealM: 'cafe uniform, waiter, halloween night',
    colors: ['black', 'pumpkin orange', 'cream', 'brown', 'deep purple'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Striped shirt and an apron with a paper pumpkin', '줄무늬 셔츠와 종이 호박 앞치마', 'striped shirt, black skirt, apron with a paper pumpkin', 'f0 F0 gf'],
        ['hm-m', 'Striped shirt and an apron with a paper pumpkin, pants', '줄무늬 셔츠와 종이 호박 앞치마, 바지', 'striped shirt, black pants, apron with a paper pumpkin', 'f0 F0 gm'],
        ['pt-0', 'Pumpkin-embroidered cafe uniform, long', '호박 자수 카페 유니폼 · 긴 기장', 'cafe uniform, white shirt, black apron with pumpkin embroidery, long black skirt', 'f1 F1 x0 gf v:cafe-pt'],
        ['pt-1', 'Pumpkin-embroidered cafe uniform, knee', '호박 자수 카페 유니폼 · 무릎 기장', 'cafe uniform, white shirt, black apron with pumpkin embroidery, black skirt, knee length', 'f1 F1 x1 gf v:cafe-pt'],
        ['pt-2', 'Pumpkin-embroidered cafe uniform, short', '호박 자수 카페 유니폼 · 짧은 기장', 'cafe uniform, white shirt, black apron with pumpkin embroidery, short sleeves, black miniskirt', 'f1 F1 x2 gf v:cafe-pt'],
        ['pt-m', 'Pumpkin cafe uniform, trousers', '호박 카페 유니폼과 바지', 'cafe uniform, white shirt, black apron with pumpkin embroidery, black trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Rolled sleeves cafe uniform', '소매 걷은 카페 유니폼', 'cafe uniform, rolled sleeves, unbuttoned collar, black apron, trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Bat-print cafe dress, long', '박쥐 무늬 카페 원피스 · 긴 기장', 'cafe uniform dress, frilled black apron with bat print, orange trim, long sleeves, ankle length', 'f2 x0 gf v:cafe-ed'],
        ['ed-1', 'Bat-print cafe dress, knee', '박쥐 무늬 카페 원피스 · 무릎 기장', 'cafe uniform dress, frilled black apron with bat print, orange trim, puff sleeves, knee length', 'f2 x1 gf v:cafe-ed'],
        ['ed-2', 'Bat-print cafe dress, short', '박쥐 무늬 카페 원피스 · 짧은 기장', 'cafe uniform dress, frilled black apron with bat print, orange trim, short sleeves, mini length', 'f2 x2 gf v:cafe-ed'],
        ['ed-m', 'Cafe vest and bat bow tie', '카페 조끼와 박쥐 보타이', 'cafe uniform, black vest, bat-print bow tie, long apron', 'f2 x01 gm'],
        ['ed-m2', 'Cafe vest with rolled sleeves', '소매 걷은 카페 조끼', 'cafe uniform, black vest, open collar, rolled sleeves, long apron', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['apron', 'Long waist apron', '긴 허리 앞치마', 'long waist apron', ''],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['striped', 'Orange striped socks', '주황 줄무늬 양말', 'orange striped socks', ''],
      ],
      neckwear: [
        ['bowtie', 'Bat bow tie', '박쥐 보타이', 'bat-shaped bow tie', ''],
        ['ribbon', 'Orange neck ribbon', '주황 리본', 'orange neck ribbon', 'gf'],
      ],
      outer: [],
      footwear: [
        ['work', 'Black work shoes', '검은 작업화', 'black work shoes', ''],
        ['loafers', 'Loafers', '로퍼', 'loafers', ''],
      ],
      headwear: [
        ['cap', 'Cat-ear cafe cap', '고양이 귀 카페 모자', 'cafe cap with cat ears', ''],
        ['witch', 'Mini witch hat clip', '미니 마녀 모자 핀', 'mini witch hat hair clip', ''],
        ['horns', 'Devil horn headband', '악마 뿔 머리띠', 'devil horn headband', ''],
        ['batwing', 'Bat wing headband', '박쥐 날개 머리띠', 'headband with small bat wings', ''],
        ['pumpkin', 'Pumpkin hair clip', '호박 머리핀', 'small jack-o-lantern hair clip', ''],
        ['bandana', 'Bat print bandana', '박쥐 무늬 반다나', 'black bandana with a bat print', ''],
      ],
      accessories: [
        ['tag', 'Pumpkin name tag', '호박 명찰', 'pumpkin-shaped name tag', ''],
        ['pen', 'Pen behind the ear', '귀에 꽂은 펜', 'pen tucked behind the ear', ''],
        ['steam', 'Steam in ghost shapes', '유령 모양 김', 'steam rising in ghost shapes', 'f3'],
      ],
      weapon: [
        ['latte', 'Latte with ghost art', '유령 라테아트', 'holding a latte with ghost latte art', ''],
        ['tray', 'Tray of pumpkin muffins', '호박 머핀 쟁반', 'holding a tray of pumpkin muffins', ''],
        ['menu', 'Halloween menu board', '할로윈 메뉴판', 'holding a halloween menu board', ''],
      ],
      device: [
        ['star', 'Star sticker under the eye', '눈 밑 별 스티커', 'star sticker under the eye', ''],
        ['fang', 'Fang', '덧니', 'fang, smile', ''],
      ],
    },
  }),

  /* ─── D-07 할로윈 파자마 파티 ─── */
  costume('pajama', 'Halloween Pajama Party', '할로윈 파자마 파티', 'D-07', {
    tag: 'pajamas, halloween', tagReal: 'pajamas, halloween night',
    colors: ['black', 'pumpkin orange', 'lavender', 'pastel pink', 'grey'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Pumpkin tee and pajama shorts', '호박 티셔츠와 잠옷 반바지', 'oversized t-shirt with a pumpkin print, pajama shorts', 'f0 F0 gf'],
        ['hm-m', 'Pumpkin tee and pajama pants', '호박 티셔츠와 잠옷 바지', 'oversized t-shirt with a pumpkin print, pajama pants', 'f0 F0 gm'],
        ['pt-0', 'Ghost-print pajamas, long', '유령 무늬 잠옷 · 긴 기장', 'button-up pajamas with a ghost print, long sleeves, long pants', 'f1 F1 x0 gf v:pajama-pt'],
        ['pt-1', 'Ghost-print pajamas, knee', '유령 무늬 잠옷 · 무릎 기장', 'button-up pajamas with a ghost print, short sleeves, pajama shorts', 'f1 F1 x1 gf v:pajama-pt'],
        ['pt-2', 'Ghost-print pajamas, short', '유령 무늬 잠옷 · 짧은 기장', 'button-up pajamas with a ghost print, camisole top, pajama shorts', 'f1 F1 x2 gf v:pajama-pt'],
        ['pt-m', 'Ghost-print pajamas, long pants', '유령 무늬 잠옷과 긴 바지', 'button-up pajamas with a ghost print, long pants', 'f1 F1 x01 gm'],
        ['pt-m2', 'Ghost-print tank top and shorts', '유령 무늬 민소매와 반바지', 'ghost print pajama tank top, pajama shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Bat-print satin pajama set, long', '박쥐 무늬 새틴 잠옷 · 긴 기장', 'satin pajama set, bat print, piped trim, long sleeves, long pants', 'f2 x0 gf v:pajama-ed'],
        ['ed-1', 'Bat-print satin pajama set, knee', '박쥐 무늬 새틴 잠옷 · 무릎 기장', 'satin pajama set, bat print, piped trim, short sleeves, shorts', 'f2 x1 gf v:pajama-ed'],
        ['ed-2', 'Bat-print satin pajama set, short', '박쥐 무늬 새틴 잠옷 · 짧은 기장', 'satin pajama set, bat print, piped trim, satin camisole, lace trim, shorts', 'f2 x2 gf v:pajama-ed'],
        ['ed-m', 'Satin pajama set, long pants', '새틴 잠옷과 긴 바지', 'satin pajama set, bat print, piped trim, long pants', 'f2 x01 gm'],
        ['ed-m2', 'Open satin pajama shirt', '풀어 입은 새틴 잠옷 셔츠', 'open satin pajama shirt, bat print, pajama pants', 'f2 x2 gm n:low'],
      ],
      structure: [],
      foundation: [
        ['fluffy', 'Fluffy socks', '복슬한 양말', 'fluffy socks', ''],
        ['striped', 'Striped knee socks', '줄무늬 무릎양말', 'striped kneehighs', 'gf'],
      ],
      neckwear: [],
      outer: [
        ['robe', 'Fleece robe', '플리스 가운', 'fleece robe', 'f1'],
        ['blanket', 'Blanket over the shoulders', '어깨에 두른 담요', 'blanket over the shoulders', ''],
      ],
      footwear: [
        ['pumpkin', 'Pumpkin slippers', '호박 슬리퍼', 'pumpkin slippers', ''],
        ['bat', 'Bat slippers', '박쥐 슬리퍼', 'bat slippers', ''],
      ],
      headwear: [
        ['mask', 'Bat sleep mask on the forehead', '이마에 올린 박쥐 수면안대', 'bat sleep mask pushed up on the forehead', ''],
        ['ears', 'Cat ears headband', '고양이 귀 머리띠', 'fake cat ears, headband', ''],
        ['nightcap', 'Striped nightcap', '줄무늬 수면 모자', 'striped nightcap', ''],
        ['witchcap', 'Witch-hat nightcap', '마녀 모자 모양 수면 모자', 'pointed witch hat shaped nightcap', ''],
        ['pumpkin', 'Pumpkin hair clip', '호박 머리핀', 'small jack-o-lantern hair clip', ''],
        ['batwing', 'Bat wing headband', '박쥐 날개 머리띠', 'headband with small bat wings', ''],
      ],
      accessories: [
        ['plush', 'Ghost plush', '유령 인형', 'ghost plush under the arm', ''],
        ['alive', 'Ghost plush come alive', '살아난 유령 인형', 'ghost plush floating alive', 'f3'],
      ],
      weapon: [
        ['popcorn', 'Bowl of popcorn', '팝콘 그릇', 'holding a bowl of popcorn', ''],
        ['pillow', 'Pillow', '베개', 'holding a pillow', ''],
        ['cocoa', 'Cocoa with marshmallows', '마시멜로 코코아', 'holding a mug of cocoa with marshmallows', ''],
      ],
      device: [
        ['sleepy', 'Sleepy eyes', '졸린 눈', 'sleepy', ''],
        ['sticker', 'Ghost sticker on the cheek', '볼 유령 스티커', 'ghost sticker on the cheek', ''],
      ],
      effect: [
        ['lights', 'String lights in the room', '방 벽의 줄 전구', 'cozy pajama party room, warm orange string lights along the wall', 'f1'],
      ],
    },
  }),

  /* ─── D-08 할로윈 데이트룩 ─── */
  costume('date', 'Halloween Date', '할로윈 데이트룩', 'D-08', {
    tag: 'casual, date outfit, halloween', tagReal: 'date outfit, halloween night',
    colors: ['black', 'burgundy', 'cream', 'brown', 'pumpkin orange'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Knit dress with a paper bat', '종이 박쥐 꽂은 니트 원피스', 'black knit dress, cardigan with a paper bat pinned on', 'f0 F0 gf'],
        ['hm-m', 'Sweater with a paper bat', '종이 박쥐 꽂은 스웨터', 'knit sweater, chinos, paper bat pinned on', 'f0 F0 gm'],
        ['pt-0', 'Bat-embroidered knit dress, long', '박쥐 자수 니트 원피스 · 긴 기장', 'knit dress, small embroidered bats at the hem, long sleeves, ankle length', 'f1 F1 x0 gf v:date-pt'],
        ['pt-1', 'Bat-embroidered knit dress, knee', '박쥐 자수 니트 원피스 · 무릎 기장', 'knit dress, small embroidered bats at the hem, long sleeves, knee length', 'f1 F1 x1 gf v:date-pt'],
        ['pt-2', 'Bat-embroidered knit dress, short', '박쥐 자수 니트 원피스 · 짧은 기장', 'knit dress, small embroidered bats at the hem, off-shoulder, mini length', 'f1 F1 x2 gf v:date-pt n:low'],
        ['pt-m', 'Bat-embroidered sweater and chinos', '박쥐 자수 스웨터와 치노', 'knit sweater with small embroidered bats, chinos', 'f1 F1 x01 gm'],
        ['pt-m2', 'Bat-embroidered knit polo', '박쥐 자수 니트 폴로', 'short sleeve knit polo with small embroidered bats, chinos', 'f1 F1 x2 gm'],
        ['ed-0', 'Tweed jacket with a spider brooch, long', '거미 브로치 트위드 재킷 · 긴 기장', 'tweed jacket with a spider brooch, black blouse, long pleated skirt', 'f2 x0 gf v:date-ed'],
        ['ed-1', 'Tweed jacket with a spider brooch, knee', '거미 브로치 트위드 재킷 · 무릎 기장', 'tweed jacket with a spider brooch, black blouse, knee-length pleated skirt', 'f2 x1 gf v:date-ed'],
        ['ed-2', 'Tweed jacket with a spider brooch, short', '거미 브로치 트위드 재킷 · 짧은 기장', 'tweed jacket with a spider brooch, black blouse, tweed miniskirt', 'f2 x2 gf v:date-ed'],
        ['ed-m', 'Tweed jacket and turtleneck', '트위드 재킷과 목폴라', 'tweed jacket with a spider brooch, turtleneck, slacks', 'f2 x01 gm n:high'],
        ['ed-m2', 'Tweed jacket and open collar', '트위드 재킷과 풀어 입은 셔츠', 'tweed jacket with a spider brooch, open collar shirt, slacks', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Thin belt', '얇은 벨트', 'thin belt', ''],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['web', 'Spiderweb tights', '거미줄 타이츠', 'spiderweb tights', 'gf'],
      ],
      neckwear: [
        ['pendant', 'Moon pendant', '달 펜던트', 'small moon pendant', ''],
        ['scarf', 'Plaid scarf', '체크 목도리', 'plaid scarf', ''],
      ],
      outer: [
        ['coat', 'Camel coat', '캐멀 코트', 'camel coat', 'f1'],
        ['leather', 'Leather jacket', '가죽 재킷', 'leather jacket', 'f1'],
      ],
      footwear: [
        ['boots', 'Ankle boots', '앵클 부츠', 'ankle boots', ''],
        ['loafers', 'Loafers', '로퍼', 'loafers', ''],
      ],
      headwear: [
        ['beret', 'Beret with a bat pin', '박쥐 핀 베레모', 'black beret with a bat pin', ''],
        ['ears', 'Cat ears', '고양이 귀', 'cat ear headband', ''],
        ['witchclip', 'Mini witch hat clip', '미니 마녀 모자 핀', 'mini witch hat hair clip', ''],
        ['hornclip', 'Small devil horn clips', '작은 악마 뿔 핀', 'small devil horn hair clips', ''],
        ['ghostclip', 'Ghost hair clip', '유령 머리핀', 'small ghost hair clip', ''],
        ['pumpkin', 'Pumpkin hair clip', '호박 머리핀', 'small jack-o-lantern hair clip', ''],
      ],
      accessories: [
        ['bag', 'Pumpkin handbag', '호박 모양 가방', 'small pumpkin-shaped handbag', ''],
        ['earrings', 'Ghost earrings', '유령 귀걸이', 'ghost earrings', ''],
        ['leaves', 'Autumn leaves falling', '떨어지는 단풍', 'autumn leaves falling around', 'f3'],
      ],
      weapon: [
        ['lattes', 'Two pumpkin lattes', '펌킨 라테 두 잔', 'holding two pumpkin spice lattes', ''],
        ['apple', 'Caramel apple', '캐러멜 사과', 'holding a caramel apple', ''],
        ['tickets', 'Haunted house tickets', '귀신의 집 입장권', 'holding haunted house tickets', ''],
      ],
      device: [
        ['star', 'Star sticker under the eye', '눈 밑 별 스티커', 'star sticker under the eye', ''],
        ['blush', 'Blush', '발그레한 볼', 'blush', ''],
      ],
    },
  }),

]);

/* ═══════════════════════════════════════════════════════════════════
 * TYPE VARIANTS — 한 가지 분장의 여러 갈래. 이름 앞에 원형을 적는다(마녀 · 견습, 빨간 모자 · 사냥꾼).
 * 마녀 8 · 빨간 모자 5 · 메이드 5 · 뱀파이어 5 · 서큐버스 4 · 프랑켄슈타인 4 · 고양이 4 · 인어 4. 의상은 전부 같은 옷의 세 재단(v:)으로 짠다.
 * 고양이는 몸 전체를 덮는 수트(캣수트 · 바디수트 · 점프수트 · 레오타드)를 쓰지 않는다. 인어 꼬리는 치마이고 신발 · 다리 칸을 비운다.
 * ═══════════════════════════════════════════════════════════════════ */
const variant = collection('variant', 'TYPE VARIANTS', 'PA·TFY·VIII', 'one archetype, many takes',
  ['black', 'red', 'midnight blue', 'deep purple', 'moss green', 'teal', 'pastel pink', 'sky blue'],
  [

  /* ─── V-01 마녀 · 견습 ─── */
  costume('w-apprentice', 'Witch · Apprentice', '마녀 · 견습', 'V-01', {
    tag: 'halloween costume, witch costume, apprentice witch', tagReal: 'apprentice witch, halloween night',
    tagM: 'halloween costume, apprentice warlock', tagRealM: 'apprentice warlock, halloween night',
    colors: ['black', 'navy', 'brown', 'deep purple', 'mustard', 'moss green'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Big cardigan worn as a robe', '로브처럼 걸친 큰 가디건', 'oversized black cardigan worn as a robe, plaid skirt', 'f0 F0 gf'],
        ['hm-m', 'Big cardigan worn as a robe, shorts', '로브처럼 걸친 큰 가디건과 반바지', 'oversized black cardigan worn as a robe, shorts', 'f0 F0 gm'],
        ['pt-0', 'Apprentice witch outfit, long', '견습 마녀 차림 · 긴 기장', 'apprentice witch outfit, oversized robe with rolled-up sleeves, big ribbon at the collar, ankle-length dress underneath', 'f1 F1 x0 gf v:w-apprentice-pt'],
        ['pt-1', 'Apprentice witch outfit, knee', '견습 마녀 차림 · 무릎 기장', 'apprentice witch outfit, oversized robe with rolled-up sleeves, big ribbon at the collar, knee-length dress underneath', 'f1 F1 x1 gf v:w-apprentice-pt'],
        ['pt-2', 'Apprentice witch outfit, short', '견습 마녀 차림 · 짧은 기장', 'apprentice witch outfit, oversized robe with rolled-up sleeves, big ribbon at the collar, short dress underneath, robe slipping off the shoulders', 'f1 F1 x2 gf v:w-apprentice-pt'],
        ['pt-m', 'Apprentice warlock robe and shorts', '견습 마법사 로브와 반바지', 'apprentice warlock outfit, oversized robe with rolled-up sleeves, shorts, suspenders', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless tunic and tied robe', '민소매 튜닉과 허리에 묶은 로브', 'apprentice warlock outfit, sleeveless tunic, shorts, robe tied around the waist', 'f1 F1 x2 gm'],
        ['ed-0', 'Patched apprentice smock, long', '기운 견습 스목 원피스 · 긴 기장', 'apprentice witch outfit, layered smock dress, patched robe, sewn-on star patches, long sleeves, ankle length', 'f2 x0 gf v:w-apprentice-ed'],
        ['ed-1', 'Patched apprentice smock, knee', '기운 견습 스목 원피스 · 무릎 기장', 'apprentice witch outfit, layered smock dress, patched robe, sewn-on star patches, puff sleeves, knee length', 'f2 x1 gf v:w-apprentice-ed'],
        ['ed-2', 'Patched apprentice smock, short', '기운 견습 스목 원피스 · 짧은 기장', 'apprentice witch outfit, layered smock dress, patched robe, sewn-on star patches, off-shoulder, short ruffled hem', 'f2 x2 gf v:w-apprentice-ed n:low'],
        ['ed-m', 'Patched robe and knee breeches', '기운 로브와 반바지', 'apprentice warlock outfit, patched robe, waistcoat, knee breeches', 'f2 x01 gm'],
        ['ed-m2', 'Open patched robe and sleeveless shirt', '풀어 입은 기운 로브', 'apprentice warlock outfit, open patched robe, sleeveless shirt, shorts', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['vials', 'Belt with potion vials', '약병 단 벨트', 'belt with small dangling potion vials', ''],
        ['sash', 'Big ribbon sash', '큰 리본 허리끈', 'big ribbon sash', ''],
      ],
      foundation: [
        ['mismatch', 'Mismatched socks', '짝짝이 양말', 'mismatched socks', ''],
        ['striped', 'Striped thighhighs', '줄무늬 니삭스', 'striped thighhighs', 'gf'],
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
      ],
      neckwear: [
        ['ribbon', 'Big neck ribbon', '큰 목 리본', 'big neck ribbon', ''],
        ['scarf', 'Knitted scarf', '뜨개 목도리', 'knitted scarf', ''],
      ],
      outer: [
        ['robe', 'Hand-me-down robe', '물려받은 로브', 'oversized hand-me-down robe', 'f1'],
      ],
      footwear: [
        ['boots', 'Scuffed ankle boots', '닳은 앵클 부츠', 'scuffed ankle boots', ''],
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
      ],
      headwear: [
        ['hat', 'Floppy witch hat', '흐물한 마녀 모자', 'floppy witch hat, bent tip', ''],
        ['patch', 'Patched witch hat', '기운 마녀 모자', 'witch hat with sewn patches', 'f1'],
        ['beret', 'Beret with a star pin', '별 핀 베레모', 'beret with a star pin', 'f1'],
      ],
      accessories: [
        ['satchel', 'Satchel of books', '책 가방', 'satchel stuffed with books', ''],
        ['glasses', 'Round glasses', '동그란 안경', 'round eyewear', ''],
        ['owl', 'Small owl familiar', '작은 부엉이 사역마', 'small owl perched on the shoulder', 'f2 c:animal'],
        ['sparks', 'Sputtering sparks', '튀는 마법 불꽃', 'small sputtering magic sparks around the hands', 'f3'],
      ],
      weapon: [
        ['broom', 'Oversized broom', '키보다 큰 빗자루', 'holding an oversized broom', ''],
        ['book', 'Beginner spell book', '초급 주문서', 'holding a beginner spell book', ''],
        ['wand', 'Practice wand', '연습용 지팡이', 'holding a practice wand with a crooked tip', ''],
        ['fly', 'Wobbling on a broom', '흔들리며 나는 빗자루', 'riding a broom unsteadily in the air', 'f3'],
      ],
      device: [
        ['bandaid', 'Bandaid on the cheek', '볼 반창고', 'bandaid on cheek', ''],
        ['soot', 'Soot on the nose', '코에 묻은 그을음', 'soot smudge on the nose', ''],
      ],
    },
  }),

  /* ─── V-02 마녀 · 마법 학원 ─── */
  costume('w-academy', 'Witch · Magic Academy', '마녀 · 마법 학원', 'V-02', {
    tag: 'halloween costume, magic academy uniform, witch', tagReal: 'magic academy student, witch, halloween night',
    tagM: 'halloween costume, magic academy uniform, warlock', tagRealM: 'magic academy student, warlock, halloween night',
    colors: ['navy', 'burgundy', 'black', 'forest green', 'deep purple', 'mustard'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Cardigan and a blanket cape', '가디건과 담요 망토', 'school cardigan, pleated skirt, paper crest pinned on, blanket worn as a cape', 'f0 F0 gf'],
        ['hm-m', 'Cardigan, trousers and a blanket cape', '가디건과 바지, 담요 망토', 'school cardigan, trousers, paper crest pinned on, blanket worn as a cape', 'f0 F0 gm'],
        ['pt-0', 'Magic academy uniform, long', '마법 학원 교복 · 긴 기장', 'magic academy uniform, crest on the chest, striped necktie, pleated skirt, long sleeves, ankle-length skirt', 'f1 F1 x0 gf v:w-academy-pt'],
        ['pt-1', 'Magic academy uniform, knee', '마법 학원 교복 · 무릎 기장', 'magic academy uniform, crest on the chest, striped necktie, pleated skirt, short capelet, knee-length skirt', 'f1 F1 x1 gf v:w-academy-pt'],
        ['pt-2', 'Magic academy uniform, short', '마법 학원 교복 · 짧은 기장', 'magic academy uniform, crest on the chest, striped necktie, pleated skirt, cropped vest, pleated miniskirt', 'f1 F1 x2 gf v:w-academy-pt'],
        ['pt-m', 'Academy uniform with trousers', '학원 교복과 바지', 'magic academy uniform, crest on the chest, striped necktie, sweater vest, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Loosened academy uniform', '풀어 입은 학원 교복', 'magic academy uniform, loosened striped tie, rolled sleeves, unbuttoned collar, trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Academy robe uniform, long', '학원 로브 교복 · 긴 기장', 'magic academy uniform, long academy robe with gold trim, crest brooch, high collar, long pleated skirt', 'f2 x0 gf v:w-academy-ed n:high'],
        ['ed-1', 'Academy robe uniform, knee', '학원 로브 교복 · 무릎 기장', 'magic academy uniform, long academy robe with gold trim, crest brooch, corset vest, knee-length pleated skirt', 'f2 x1 gf v:w-academy-ed'],
        ['ed-2', 'Academy robe uniform, short', '학원 로브 교복 · 짧은 기장', 'magic academy uniform, long academy robe with gold trim, crest brooch, cropped robe, corset vest, pleated miniskirt', 'f2 x2 gf v:w-academy-ed'],
        ['ed-m', 'Academy robe and waistcoat', '학원 로브와 조끼', 'magic academy uniform, long academy robe with gold trim, crest brooch, waistcoat, high collar shirt, trousers', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open academy robe', '풀어 입은 학원 로브', 'magic academy uniform, open academy robe, loosened tie, unbuttoned shirt, trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Wand holster belt', '지팡이 꽂이 벨트', 'belt with a wand holster', ''],
      ],
      foundation: [
        ['knee', 'Kneehighs', '니삭스', 'kneehighs', 'gf'],
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x01 gf'],
        ['thigh', 'Thighhighs', '사이하이', 'thighhighs', 'x12 gf'],
      ],
      neckwear: [
        ['tie', 'Striped necktie', '줄무늬 넥타이', 'striped necktie', ''],
        ['ribbon', 'Striped neck ribbon', '줄무늬 리본', 'striped neck ribbon', 'gf'],
      ],
      outer: [
        ['robe', 'Hooded academy robe', '후드 학원 로브', 'academy robe with hood', 'f1'],
        ['cape', 'Short academy cape', '짧은 학원 망토', 'short cape with a crest clasp', 'f1'],
      ],
      footwear: [
        ['loafers', 'Loafers', '로퍼', 'loafers', ''],
        ['boots', 'Lace-up boots', '끈 부츠', 'lace-up boots', ''],
      ],
      headwear: [
        ['hat', 'Pointed academy hat', '뾰족한 학원 모자', 'pointed witch hat with a crest band', ''],
        ['mini', 'Tilted mini witch hat', '기울여 쓴 미니 마녀 모자', 'mini witch hat, tilted headwear', ''],
      ],
      accessories: [
        ['scarf', 'Striped scarf', '줄무늬 목도리', 'striped scarf', ''],
        ['badge', 'Prefect badge', '반장 배지', 'prefect badge', ''],
        ['books', 'Books under the arm', '옆구리에 낀 책', 'stack of textbooks under the arm', ''],
        ['quill', 'Quill writing by itself', '혼자 쓰는 깃펜', 'quill writing by itself in the air', 'f3'],
      ],
      weapon: [
        ['wand', 'Wand', '지팡이', 'holding a wand', ''],
        ['potion', 'Glowing potion flask', '빛나는 물약', 'holding a glowing potion flask', 'f1'],
        ['broom', 'Racing broom', '경주용 빗자루', 'holding a racing broom', 'f1'],
      ],
      device: [
        ['ink', 'Ink smudge on the cheek', '볼 잉크 자국', 'ink smudge on the cheek', ''],
        ['star', 'Star sticker under the eye', '눈 밑 별 스티커', 'star sticker under the eye', ''],
      ],
    },
  }),

  /* ─── V-03 마녀 · 숲의 약초 ─── */
  costume('w-forest', 'Witch · Forest Herbalist', '마녀 · 숲의 약초', 'V-03', {
    tag: 'halloween costume, forest witch', tagReal: 'forest witch, halloween night',
    tagM: 'halloween costume, forest warlock', tagRealM: 'forest warlock, halloween night',
    colors: ['moss green', 'olive', 'brown', 'rust', 'cream', 'mustard'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Brown dress with pinned leaves', '잎사귀 핀으로 꽂은 갈색 원피스', 'brown dress, apron with real leaves pinned on', 'f0 F0 gf'],
        ['hm-m', 'Vest with pinned leaves', '잎사귀 꽂은 조끼', 'brown shirt, vest with real leaves pinned on, trousers', 'f0 F0 gm'],
        ['pt-0', 'Forest witch dress, long', '숲의 마녀 원피스 · 긴 기장', 'forest witch dress, linen apron with herb pockets, leaf embroidery, long sleeves, ankle length', 'f1 F1 x0 gf v:w-forest-pt'],
        ['pt-1', 'Forest witch dress, knee', '숲의 마녀 원피스 · 무릎 기장', 'forest witch dress, linen apron with herb pockets, leaf embroidery, rolled sleeves, knee length', 'f1 F1 x1 gf v:w-forest-pt'],
        ['pt-2', 'Forest witch dress, short', '숲의 마녀 원피스 · 짧은 기장', 'forest witch dress, linen apron with herb pockets, leaf embroidery, off-shoulder blouse, short layered skirt', 'f1 F1 x2 gf v:w-forest-pt n:low'],
        ['pt-m', 'Forest warlock vest', '숲의 마법사 조끼', 'forest warlock outfit, linen shirt, leather vest with herb pockets, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless forest tunic', '민소매 숲의 튜닉', 'forest warlock outfit, sleeveless linen tunic, leather harness with herb pockets', 'f1 F1 x2 gm'],
        ['ed-0', 'Moss linen witch gown, long', '이끼빛 리넨 마녀 드레스 · 긴 기장', 'forest witch gown, layered moss green linen, embroidered vines, pressed flowers sewn on, long bell sleeves, floor length', 'f2 x0 gf v:w-forest-ed'],
        ['ed-1', 'Moss linen witch gown, knee', '이끼빛 리넨 마녀 드레스 · 무릎 기장', 'forest witch gown, layered moss green linen, embroidered vines, pressed flowers sewn on, short sleeves, lace-up bodice, knee length', 'f2 x1 gf v:w-forest-ed'],
        ['ed-2', 'Moss linen witch gown, short', '이끼빛 리넨 마녀 드레스 · 짧은 기장', 'forest witch gown, layered moss green linen, embroidered vines, pressed flowers sewn on, corset bodice, short tiered skirt', 'f2 x2 gf v:w-forest-ed'],
        ['ed-m', 'Vine-embroidered robe', '덩굴 자수 로브', 'forest warlock robe, embroidered vines, mushroom buttons', 'f2 x01 gm'],
        ['ed-m2', 'Open vine robe', '풀어 입은 덩굴 로브', 'open forest warlock robe, sleeveless tunic, vine sash', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['pouches', 'Herb pouch belt', '약초 주머니 벨트', 'belt with herb pouches', ''],
        ['corset', 'Lace-up corset', '끈 코르셋', 'lace-up corset', 'x12 gf'],
      ],
      foundation: [
        ['wool', 'Wool stockings', '양모 스타킹', 'wool stockings', 'gf'],
        ['striped', 'Green striped stockings', '초록 줄무늬 스타킹', 'green striped stockings', 'gf'],
      ],
      neckwear: [
        ['acorn', 'Acorn pendant', '도토리 펜던트', 'acorn pendant', ''],
        ['leaves', 'Dried leaf collar', '마른 잎 깃', 'collar of dried leaves', ''],
      ],
      outer: [
        ['shawl', 'Shawl over the shoulders', '어깨에 두른 숄', 'shawl draped over the shoulders', 'f1'],
        ['cloak', 'Moss green cloak', '이끼색 망토', 'moss green hooded cloak', 'f1'],
      ],
      footwear: [
        ['boots', 'Muddy boots', '진흙 묻은 부츠', 'muddy leather boots', ''],
        ['clogs', 'Wooden clogs', '나막신', 'wooden clogs', 'f1'],
      ],
      headwear: [
        ['hat', 'Witch hat with dried flowers', '말린 꽃 단 마녀 모자', 'witch hat with dried flowers and twigs in the band', ''],
        ['wreath', 'Dried flower crown', '마른 꽃관', 'dried flower crown', ''],
        ['kerchief', 'Head scarf', '머릿수건', 'head scarf tied at the back', 'f1'],
      ],
      accessories: [
        ['basket', 'Basket of herbs', '약초 바구니', 'basket of herbs on the arm', ''],
        ['mushroom', 'Mushroom charms', '버섯 장식', 'small mushroom charms', ''],
        ['frog', 'Frog on the shoulder', '어깨 위 개구리', 'small frog sitting on the shoulder', 'f2 c:animal'],
        ['bloom', 'Flowers blooming at the feet', '발밑에 피는 꽃', 'flowers blooming at the feet', 'f3'],
      ],
      weapon: [
        ['mortar', 'Mortar and pestle', '절구와 공이', 'holding a mortar and pestle', ''],
        ['staff', 'Sprouting wooden staff', '싹 난 나무 지팡이', 'holding a twisted wooden staff with leaves sprouting', 'f2'],
        ['tea', 'Herbal tea', '약초차', 'holding a cup of herbal tea', ''],
      ],
      device: [
        ['freckles', 'Freckles', '주근깨', 'freckles', ''],
        ['leaf', 'Leaf cheek paint', '볼의 잎사귀 분장', 'small leaf painted on the cheek', ''],
      ],
    },
  }),

  /* ─── V-04 마녀 · 별 ─── */
  costume('w-star', 'Witch · Star', '마녀 · 별', 'V-04', {
    tag: 'halloween costume, star witch', tagReal: 'star witch, halloween night, starry sky',
    tagM: 'halloween costume, star warlock', tagRealM: 'star warlock, halloween night, starry sky',
    colors: ['midnight blue', 'navy', 'deep purple', 'silver', 'gold', 'black'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Navy dress with foil stars', '은박 별 붙인 남색 원피스', 'navy dress with foil stars glued on', 'f0 F0 gf'],
        ['hm-m', 'Navy hoodie with foil stars', '은박 별 붙인 남색 후드티', 'navy hoodie with foil stars glued on, jeans', 'f0 F0 gm'],
        ['pt-0', 'Star witch dress, long', '별의 마녀 원피스 · 긴 기장', 'star witch dress, constellation embroidery, silver star buttons, long sleeves, ankle length', 'f1 F1 x0 gf v:w-star-pt'],
        ['pt-1', 'Star witch dress, knee', '별의 마녀 원피스 · 무릎 기장', 'star witch dress, constellation embroidery, silver star buttons, capelet sleeves, knee length', 'f1 F1 x1 gf v:w-star-pt'],
        ['pt-2', 'Star witch dress, short', '별의 마녀 원피스 · 짧은 기장', 'star witch dress, constellation embroidery, silver star buttons, off-shoulder, short layered skirt', 'f1 F1 x2 gf v:w-star-pt n:low'],
        ['pt-m', 'Star warlock robe', '별의 마법사 로브', 'star warlock robe, constellation embroidery, silver star buttons', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless star tunic', '민소매 별 튜닉', 'star warlock outfit, sleeveless tunic with constellation embroidery, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Midnight crystal gown, long', '한밤 수정 드레스 · 긴 기장', 'midnight blue gown, sheer overlay sewn with tiny crystals like stars, crescent moon belt, high collar, long sleeves, floor length', 'f2 x0 gf v:w-star-ed n:high'],
        ['ed-1', 'Midnight crystal gown, knee', '한밤 수정 드레스 · 무릎 기장', 'midnight blue gown, sheer overlay sewn with tiny crystals like stars, crescent moon belt, square neckline, knee length', 'f2 x1 gf v:w-star-ed'],
        ['ed-2', 'Midnight crystal gown, short', '한밤 수정 드레스 · 짧은 기장', 'midnight blue gown, sheer overlay sewn with tiny crystals like stars, crescent moon belt, strapless bodice, short tulle skirt', 'f2 x2 gf v:w-star-ed n:low'],
        ['ed-m', 'Constellation tailcoat', '별자리 연미복', 'midnight blue tailcoat, embroidered constellations, crescent moon pin, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open star robe', '풀어 입은 별 로브', 'open midnight blue robe, sheer star print shirt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['moon', 'Crescent moon belt', '초승달 벨트', 'crescent moon belt buckle', ''],
      ],
      foundation: [
        ['starry', 'Star print tights', '별무늬 타이츠', 'star print tights', 'gf'],
        ['sheer', 'Sheer navy tights', '비치는 남색 타이츠', 'sheer navy pantyhose', 'x12 gf'],
      ],
      neckwear: [
        ['moon', 'Moon pendant', '달 펜던트', 'crescent moon pendant', ''],
        ['choker', 'Star choker', '별 초커', 'star choker', ''],
      ],
      outer: [
        ['cape', 'Star-lined cape', '안이 별무늬인 망토', 'cape with a star print lining', 'f1'],
        ['galaxy', 'Cape of night sky', '밤하늘이 비치는 망토', 'cape showing a moving night sky inside', 'f3'],
      ],
      footwear: [
        ['boots', 'Silver ankle boots', '은색 앵클 부츠', 'silver ankle boots', ''],
        ['heels', 'Star-buckle heels', '별 버클 힐', 'heels with star buckles', 'f1 gf'],
      ],
      headwear: [
        ['hat', 'Witch hat with a crescent moon', '초승달 마녀 모자', 'witch hat with a crescent moon ornament', ''],
        ['tiara', 'Star tiara', '별 티아라', 'star tiara', 'f1'],
        ['clips', 'Star hair clips', '별 머리핀', 'star hair ornament', ''],
      ],
      accessories: [
        ['earrings', 'Moon and star earrings', '달과 별 귀걸이', 'mismatched moon and star earrings', ''],
        ['astrolabe', 'Astrolabe on the belt', '허리에 단 천체 관측기', 'small astrolabe hanging from the belt', 'f1'],
        ['orbit', 'Tiny planets orbiting', '도는 작은 행성들', 'tiny glowing planets orbiting around', 'f3'],
      ],
      weapon: [
        ['staff', 'Moon staff', '달 지팡이', 'holding a staff topped with a crescent moon', 'f1'],
        ['spyglass', 'Spyglass', '망원경', 'holding a brass spyglass', ''],
        ['chart', 'Star chart', '별자리 지도', 'holding a rolled star chart', ''],
      ],
      device: [
        ['stars', 'Star cheek paint', '볼의 별 분장', 'small stars painted on the cheek', ''],
        ['glitter', 'Silver glitter', '은색 반짝이', 'silver glitter on the cheekbones', ''],
        ['eyes', 'Star-shaped pupils', '별이 뜬 눈', 'star-shaped pupils', 'f3'],
      ],
    },
  }),

  /* ─── V-05 마녀 · 흑마녀 ─── */
  costume('w-dark', 'Witch · Dark', '마녀 · 흑마녀', 'V-05', {
    tag: 'halloween costume, dark witch', tagReal: 'dark witch, halloween night',
    tagM: 'halloween costume, dark warlock', tagRealM: 'dark warlock, halloween night',
    colors: ['black', 'crimson', 'deep purple', 'charcoal', 'burgundy'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black dress and feather boa', '검은 원피스와 깃털 목도리', 'black dress, black feather boa, paper skull pinned on', 'f0 F0 gf'],
        ['hm-m', 'Black shirt and feather boa', '검은 셔츠와 깃털 목도리', 'black shirt, black jeans, feather boa worn as a collar', 'f0 F0 gm'],
        ['pt-0', 'Raven lace witch dress, long', '까마귀 레이스 마녀 원피스 · 긴 기장', 'dark witch dress, black feather trim, crow motif lace, high neck, long sleeves, ankle length', 'f1 F1 x0 gf v:w-dark-pt n:high'],
        ['pt-1', 'Raven lace witch dress, knee', '까마귀 레이스 마녀 원피스 · 무릎 기장', 'dark witch dress, black feather trim, crow motif lace, square neckline, knee length', 'f1 F1 x1 gf v:w-dark-pt'],
        ['pt-2', 'Raven lace witch dress, short', '까마귀 레이스 마녀 원피스 · 짧은 기장', 'dark witch dress, black feather trim, crow motif lace, plunging corset bodice, short tattered skirt', 'f1 F1 x2 gf v:w-dark-pt n:low'],
        ['pt-m', 'Dark warlock robe', '흑마법사 로브', 'dark warlock robe, black feather collar, crow motif', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open black shirt and feather collar', '풀어 헤친 검은 셔츠와 깃털 깃', 'dark warlock outfit, open black shirt, feather collar', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Feathered black witch gown, long', '깃털 검은 마녀 드레스 · 긴 기장', 'black witch gown, layered feathers at the shoulders, embroidered runes, high collar, long sleeves, sweeping train', 'f2 x0 gf v:w-dark-ed n:high'],
        ['ed-1', 'Feathered black witch gown, knee', '깃털 검은 마녀 드레스 · 무릎 기장', 'black witch gown, layered feathers at the shoulders, embroidered runes, off-shoulder, knee length', 'f2 x1 gf v:w-dark-ed n:low'],
        ['ed-2', 'Feathered black witch gown, short', '깃털 검은 마녀 드레스 · 짧은 기장', 'black witch gown, layered feathers at the shoulders, embroidered runes, corset bodice, high slit', 'f2 x2 gf v:w-dark-ed'],
        ['ed-m', 'Feather-mantle warlock coat', '깃털 망토 흑마법사 코트', 'black warlock coat, feather mantle, embroidered runes', 'f2 x01 gm'],
        ['ed-m2', 'Open warlock coat and leather harness', '풀어 입은 코트와 가죽 하네스', 'open black warlock coat, feather mantle, leather harness', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['corset', 'Black underbust corset', '검은 언더버스트 코르셋', 'black underbust corset', 'x12 gf'],
        ['chain', 'Skull buckle belt', '해골 버클 벨트', 'belt with a small skull buckle', ''],
      ],
      foundation: [
        ['lace', 'Black lace stockings', '검은 레이스 스타킹', 'black lace stockings', 'gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x2 gf'],
      ],
      neckwear: [
        ['feather', 'Feather collar', '깃털 깃', 'black feather collar', ''],
        ['skull', 'Skull choker', '해골 초커', 'skull choker', ''],
      ],
      outer: [
        ['cloak', 'Black feather cloak', '검은 깃털 망토', 'cloak of black feathers', 'f1'],
        ['mist', 'Cloak dissolving into mist', '안개로 흩어지는 망토', 'cloak edge dissolving into dark mist', 'f3'],
      ],
      footwear: [
        ['boots', 'Pointed black boots', '뾰족한 검은 부츠', 'pointed black boots', ''],
        ['platform', 'Platform boots', '플랫폼 부츠', 'platform boots', 'x12'],
      ],
      headwear: [
        ['hat', 'Black witch hat with a veil', '베일 단 검은 마녀 모자', 'black witch hat with a lace veil', ''],
        ['horns', 'Black horned headdress', '검은 뿔 머리쓰개', 'black horned headdress', 'f2'],
        ['feathers', 'Black feather hair ornament', '검은 깃털 머리장식', 'black feather hair ornament', ''],
      ],
      accessories: [
        ['rings', 'Many silver rings', '은반지 여러 개', 'many silver rings', ''],
        ['claws', 'Black claw rings', '검은 손톱 반지', 'black claw rings', ''],
        ['raven', 'Raven on the shoulder', '어깨 위 까마귀', 'raven perched on the shoulder', 'f2 c:animal'],
        ['runes', 'Glowing runes', '빛나는 룬', 'glowing red runes floating around', 'f3'],
      ],
      weapon: [
        ['staff', 'Skull staff', '해골 지팡이', 'holding a staff topped with a skull ornament', 'f1'],
        ['grimoire', 'Black grimoire', '검은 마도서', 'holding a black grimoire', ''],
        ['candle', 'Black candle', '검은 초', 'holding a black candle', ''],
      ],
      device: [
        ['dark', 'Dark eye makeup', '짙은 눈 분장', 'dark eye makeup', ''],
        ['tears', 'Painted black tears', '그린 검은 눈물', 'painted black tear marks', ''],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-06 마녀 · 바다 ─── */
  costume('w-sea', 'Witch · Sea', '마녀 · 바다', 'V-06', {
    tag: 'halloween costume, sea witch', tagReal: 'sea witch, halloween night',
    tagM: 'halloween costume, sea warlock', tagRealM: 'sea warlock, halloween night',
    colors: ['teal', 'seafoam', 'deep purple', 'black', 'navy', 'pearl white'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Teal dress and kelp ribbons', '청록 원피스와 해초 리본', 'teal dress, kelp-green ribbons draped over the shoulders, paper shells', 'f0 F0 gf'],
        ['hm-m', 'Teal shirt and a kelp cape', '청록 셔츠와 해초빛 망토', 'teal shirt, kelp-green cloth draped as a cape, trousers', 'f0 F0 gm'],
        ['pt-0', 'Sea witch dress, long', '바다 마녀 원피스 · 긴 기장', 'sea witch dress, iridescent scale print, seashell trim, tattered hem, long sleeves, ankle length', 'f1 F1 x0 gf v:w-sea-pt'],
        ['pt-1', 'Sea witch dress, knee', '바다 마녀 원피스 · 무릎 기장', 'sea witch dress, iridescent scale print, seashell trim, tattered hem, knee length', 'f1 F1 x1 gf v:w-sea-pt'],
        ['pt-2', 'Sea witch dress, short', '바다 마녀 원피스 · 짧은 기장', 'sea witch dress, iridescent scale print, seashell trim, tattered hem, seashell bodice, short skirt', 'f1 F1 x2 gf v:w-sea-pt'],
        ['pt-m', 'Sea warlock coat', '바다 마법사 코트', 'sea warlock coat, iridescent scale print, seashell buttons', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open shirt and kelp shawl', '풀어 헤친 셔츠와 해초 숄', 'sea warlock outfit, open shirt, kelp-green shawl, scale print trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Kelp chiffon sea gown, long', '해초 시폰 바다 드레스 · 긴 기장', 'sea witch gown, layered chiffon like kelp, pearl strands, iridescent sheen, high neck, long sleeves, floor length', 'f2 x0 gf v:w-sea-ed n:high'],
        ['ed-1', 'Kelp chiffon sea gown, knee', '해초 시폰 바다 드레스 · 무릎 기장', 'sea witch gown, layered chiffon like kelp, pearl strands, iridescent sheen, cowl neck, knee length', 'f2 x1 gf v:w-sea-ed'],
        ['ed-2', 'Kelp chiffon sea gown, short', '해초 시폰 바다 드레스 · 짧은 기장', 'sea witch gown, layered chiffon like kelp, pearl strands, iridescent sheen, corset bodice with shells, short layered skirt', 'f2 x2 gf v:w-sea-ed'],
        ['ed-m', 'Pearl-strand sea robe', '진주 줄 바다 로브', 'sea warlock robe, pearl strands, layered chiffon like kelp', 'f2 x01 gm'],
        ['ed-m2', 'Open sea robe and pearl harness', '풀어 입은 바다 로브와 진주 하네스', 'open sea warlock robe, pearl harness', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['pearls', 'Pearl belt', '진주 벨트', 'belt of pearls', ''],
        ['net', 'Kelp sash', '해초 허리끈', 'dark green kelp-like sash', ''],
      ],
      foundation: [
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x12 gf'],
        ['scale', 'Scale print tights', '비늘 무늬 타이츠', 'scale print tights', 'gf'],
      ],
      neckwear: [
        ['pearls', 'Pearl choker', '진주 초커', 'pearl choker', ''],
        ['shell', 'Seashell necklace', '조개 목걸이', 'seashell necklace', ''],
      ],
      outer: [
        ['net', 'Sheer kelp shawl', '해초빛 숄', 'sheer kelp-green shawl', 'f1'],
        ['cape', 'Tattered kelp cape', '해진 해초빛 망토', 'dark green tattered cape', 'f1'],
      ],
      footwear: [
        ['sandals', 'Strappy sandals', '끈 샌들', 'strappy sandals', ''],
        ['barefoot', 'Barefoot with shell anklets', '조개 발찌 맨발', 'barefoot, shell anklets', 'f2'],
      ],
      headwear: [
        ['shells', 'Seashell hair clips', '조개 머리핀', 'seashell hair ornament', ''],
        ['coral', 'Coral crown', '산호 관', 'coral crown', 'f1'],
        ['hat', 'Witch hat with a starfish', '불가사리 단 마녀 모자', 'witch hat with a starfish on the brim', ''],
      ],
      accessories: [
        ['pearls', 'Pearl strands on the arms', '팔에 감은 진주', 'pearl strands wrapped around the arms', ''],
        ['bottle', 'Message bottle on the belt', '허리에 단 유리병 편지', 'small message bottle hanging from the belt', ''],
        ['bubbles', 'Floating bubbles', '떠다니는 물방울', 'water bubbles floating around', 'f3'],
      ],
      weapon: [
        ['staff', 'Coral staff', '산호 지팡이', 'holding a coral staff', 'f1'],
        ['conch', 'Conch shell', '소라 껍데기', 'holding a conch shell', ''],
        ['jar', 'Jar of glowing seawater', '빛나는 바닷물 단지', 'holding a jar of glowing seawater', 'f2'],
      ],
      device: [
        ['scales', 'Painted scales on the cheek', '볼 비늘 그림', 'painted scales on the cheekbones', ''],
        ['pearls', 'Pearl face gems', '진주 얼굴 장식', 'small pearls along the cheekbones', ''],
      ],
    },
  }),

  /* ─── V-07 마녀 · 사탕 ─── */
  costume('w-candy', 'Witch · Candy', '마녀 · 사탕', 'V-07', {
    tag: 'halloween costume, candy witch', tagReal: 'candy witch, halloween night',
    tagM: 'halloween costume, candy warlock', tagRealM: 'candy warlock, halloween night',
    colors: ['pastel pink', 'mint', 'lavender', 'butter yellow', 'white', 'pastel rainbow'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Pink dress with taped candies', '사탕 붙인 분홍 원피스', 'pink dress with wrapped candies taped on', 'f0 F0 gf'],
        ['hm-m', 'Mint hoodie with taped candies', '사탕 붙인 민트 후드티', 'mint hoodie with wrapped candies taped on, shorts', 'f0 F0 gm'],
        ['pt-0', 'Candy witch dress, long', '사탕 마녀 원피스 · 긴 기장', 'candy witch dress, candy stripe trim, lollipop buttons, long puff sleeves, ankle length', 'f1 F1 x0 gf v:w-candy-pt'],
        ['pt-1', 'Candy witch dress, knee', '사탕 마녀 원피스 · 무릎 기장', 'candy witch dress, candy stripe trim, lollipop buttons, puff short sleeves, petticoat, knee length', 'f1 F1 x1 gf v:w-candy-pt'],
        ['pt-2', 'Candy witch dress, short', '사탕 마녀 원피스 · 짧은 기장', 'candy witch dress, candy stripe trim, lollipop buttons, off-shoulder, petticoat, short frilled skirt', 'f1 F1 x2 gf v:w-candy-pt n:low'],
        ['pt-m', 'Candy warlock coat', '사탕 마법사 코트', 'candy warlock coat, candy stripe trim, lollipop buttons, shorts', 'f1 F1 x01 gm'],
        ['pt-m2', 'Candy warlock vest', '사탕 마법사 조끼', 'candy warlock vest, candy stripe trim, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Whipped cream witch dress, long', '휘핑크림 마녀 드레스 · 긴 기장', 'candy witch dress, layered pastel frills like whipped cream, macaron trim, high collar, long sleeves, ankle length', 'f2 x0 gf v:w-candy-ed n:high'],
        ['ed-1', 'Whipped cream witch dress, knee', '휘핑크림 마녀 드레스 · 무릎 기장', 'candy witch dress, layered pastel frills like whipped cream, macaron trim, puff sleeves, knee length', 'f2 x1 gf v:w-candy-ed'],
        ['ed-2', 'Whipped cream witch dress, short', '휘핑크림 마녀 드레스 · 짧은 기장', 'candy witch dress, layered pastel frills like whipped cream, macaron trim, strapless corset bodice, short layered skirt', 'f2 x2 gf v:w-candy-ed n:low'],
        ['ed-m', 'Macaron tailcoat', '마카롱 연미복', 'candy warlock tailcoat, pastel stripes, macaron buttons', 'f2 x01 gm'],
        ['ed-m2', 'Open macaron tailcoat', '풀어 입은 마카롱 연미복', 'open candy warlock tailcoat, striped shirt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Wrapped-candy bow', '사탕 포장 리본', 'big bow shaped like a wrapped candy', ''],
      ],
      foundation: [
        ['striped', 'Candy stripe thighhighs', '사탕 줄무늬 니삭스', 'pink and white striped thighhighs', 'gf'],
        ['frill', 'Frilled socks', '프릴 양말', 'frilled socks', 'gf'],
      ],
      neckwear: [
        ['candy', 'Candy necklace', '사탕 목걸이', 'candy necklace', ''],
        ['bow', 'Pastel bow', '파스텔 리본', 'pastel neck bow', ''],
      ],
      outer: [
        ['capelet', 'Whipped cream capelet', '휘핑크림 케이플릿', 'frilled capelet like whipped cream', 'f1'],
      ],
      footwear: [
        ['mary', 'Pastel platform mary janes', '파스텔 플랫폼 메리제인', 'pastel platform mary janes', 'gf'],
        ['boots', 'Candy stripe boots', '사탕 줄무늬 부츠', 'candy stripe ankle boots', ''],
      ],
      headwear: [
        ['hat', 'Pastel witch hat with a candy', '사탕 단 파스텔 마녀 모자', 'pastel witch hat with a wrapped candy ornament', ''],
        ['clips', 'Candy hair clips', '사탕 머리핀', 'candy hair ornament', ''],
        ['mini', 'Sprinkle mini witch hat', '스프링클 미니 마녀 모자', 'mini witch hat with sprinkles, tilted headwear', ''],
      ],
      accessories: [
        ['bag', 'Cookie-shaped bag', '쿠키 가방', 'cookie-shaped shoulder bag', ''],
        ['earrings', 'Macaron earrings', '마카롱 귀걸이', 'macaron earrings', ''],
        ['rain', 'Candy raining down', '쏟아지는 사탕', 'candies falling from the sky', 'f3'],
      ],
      weapon: [
        ['lolli', 'Swirl lollipop wand', '소용돌이 막대사탕 지팡이', 'holding a giant swirl lollipop like a wand', ''],
        ['cane', 'Candy cane staff', '지팡이 사탕', 'holding a candy cane staff', 'f1'],
        ['jar', 'Candy jar', '사탕 병', 'holding a jar of candy', ''],
      ],
      device: [
        ['sprinkles', 'Sprinkle stickers', '스프링클 스티커', 'sprinkle stickers on the cheeks', ''],
        ['heart', 'Heart on the cheek', '볼 하트', 'heart painted on the cheek', ''],
      ],
    },
  }),

  /* ─── V-08 마녀 · 눈 ─── */
  costume('w-snow', 'Witch · Snow', '마녀 · 눈', 'V-08', {
    tag: 'halloween costume, snow witch', tagReal: 'snow witch, halloween night, snowflakes',
    tagM: 'halloween costume, frost warlock', tagRealM: 'frost warlock, halloween night, snowflakes',
    colors: ['sky blue', 'white', 'silver', 'lavender', 'navy', 'pearl white'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'White sweater dress with cotton snow', '솜 눈 붙인 흰 니트 원피스', 'white sweater dress, cotton balls glued on like snow', 'f0 F0 gf'],
        ['hm-m', 'White sweater with cotton snow', '솜 눈 붙인 흰 스웨터', 'white sweater, cotton balls glued on like snow, jeans', 'f0 F0 gm'],
        ['pt-0', 'Snow witch dress, long', '눈의 마녀 원피스 · 긴 기장', 'snow witch dress, snowflake embroidery, white faux fur trim, long sleeves, ankle length', 'f1 F1 x0 gf v:w-snow-pt'],
        ['pt-1', 'Snow witch dress, knee', '눈의 마녀 원피스 · 무릎 기장', 'snow witch dress, snowflake embroidery, white faux fur trim, capelet, knee length', 'f1 F1 x1 gf v:w-snow-pt'],
        ['pt-2', 'Snow witch dress, short', '눈의 마녀 원피스 · 짧은 기장', 'snow witch dress, snowflake embroidery, white faux fur trim, off-shoulder, short layered skirt', 'f1 F1 x2 gf v:w-snow-pt n:low'],
        ['pt-m', 'Frost warlock coat', '서리 마법사 코트', 'frost warlock coat, snowflake embroidery, white faux fur collar', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless frost tunic', '민소매 서리 튜닉', 'frost warlock outfit, sleeveless tunic, fur collar, snowflake embroidery', 'f1 F1 x2 gm'],
        ['ed-0', 'Ice crystal gown, long', '얼음 수정 드레스 · 긴 기장', 'ice witch gown, sheer icy blue layers, crystal beading like frost, high collar, long sleeves, floor length', 'f2 x0 gf v:w-snow-ed n:high'],
        ['ed-1', 'Ice crystal gown, knee', '얼음 수정 드레스 · 무릎 기장', 'ice witch gown, sheer icy blue layers, crystal beading like frost, cap sleeves, knee length', 'f2 x1 gf v:w-snow-ed'],
        ['ed-2', 'Ice crystal gown, short', '얼음 수정 드레스 · 짧은 기장', 'ice witch gown, sheer icy blue layers, crystal beading like frost, strapless crystal bodice, high slit', 'f2 x2 gf v:w-snow-ed n:low'],
        ['ed-m', 'Frost-beaded long coat', '서리 장식 롱코트', 'frost warlock long coat, crystal beading like frost, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open frost coat and crystal harness', '풀어 입은 서리 코트와 수정 하네스', 'open frost warlock coat, sheer shirt, crystal harness', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['crystal', 'Crystal belt', '수정 벨트', 'crystal belt', ''],
      ],
      foundation: [
        ['white', 'White tights', '흰 타이츠', 'white tights', 'gf'],
        ['sheer', 'Sheer silver tights', '비치는 은색 타이츠', 'sheer silver pantyhose', 'x12 gf'],
      ],
      neckwear: [
        ['snow', 'Snowflake pendant', '눈송이 펜던트', 'snowflake pendant', ''],
        ['fur', 'White fur collar', '흰 털 깃', 'white faux fur collar', ''],
      ],
      outer: [
        ['cape', 'White fur-trimmed cape', '흰 털 망토', 'white cape with faux fur trim', 'f1'],
        ['frost', 'Cape trailing frost', '서리 흘리는 망토', 'cape trailing frost and snow', 'f3'],
      ],
      footwear: [
        ['boots', 'White fur boots', '흰 털 부츠', 'white fur boots', ''],
        ['heels', 'Clear crystal heels', '수정 힐', 'clear crystal heels', 'f2 gf'],
      ],
      headwear: [
        ['hat', 'White witch hat with snowflakes', '눈송이 흰 마녀 모자', 'white witch hat with snowflake ornaments', ''],
        ['crown', 'Ice crown', '얼음 관', 'ice crystal crown', 'f2'],
        ['earmuffs', 'Fluffy earmuffs', '복슬한 귀마개', 'fluffy earmuffs', 'F1'],
      ],
      accessories: [
        ['mittens', 'Knitted mittens', '뜨개 벙어리장갑', 'knitted mittens', ''],
        ['gloves', 'Long white gloves', '긴 흰 장갑', 'long white gloves', 'f2'],
        ['snow', 'Snow swirling around', '둘레에 휘도는 눈', 'snowflakes swirling around', 'f3'],
      ],
      weapon: [
        ['wand', 'Icicle wand', '고드름 지팡이', 'holding an icicle wand', ''],
        ['globe', 'Snow globe', '스노볼', 'holding a snow globe', ''],
        ['cocoa', 'Hot cocoa', '코코아', 'holding a mug of hot cocoa', 'F1'],
      ],
      device: [
        ['frost', 'Frost painted on the cheek', '볼 서리 그림', 'painted frost patterns on the cheek', ''],
        ['glitter', 'Silver glitter', '은 반짝이', 'silver glitter under the eyes', ''],
        ['eyes', 'Pale glowing eyes', '희게 빛나는 눈', 'pale blue glowing eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-09 빨간 모자 · 사냥꾼 ─── */
  costume('rh-hunter', 'Red Hood · Hunter', '빨간 모자 · 사냥꾼', 'V-09', {
    tag: 'halloween costume, red riding hood costume, hunter', tagReal: 'red riding hood, hunter, halloween night',
    tagM: 'halloween costume, red hood, hunter', tagRealM: 'red hood, hunter, halloween night',
    colors: ['red', 'crimson', 'brown', 'black', 'burgundy'],
    items: {
      garment: [
        ['hm-f', 'Red hoodie and brown skirt', '빨간 후드티와 갈색 치마', 'red hoodie, brown skirt, belt with cardboard pouches', 'f0 F0 gf'],
        ['hm-m', 'Red hoodie and cargo pants', '빨간 후드티와 카고 바지', 'red hoodie, cargo pants, belt with cardboard pouches', 'f0 F0 gm'],
        ['pt-0', 'Hunter red hood outfit, long', '사냥꾼 빨간 모자 차림 · 긴 기장', 'red riding hood costume, hooded red cloak, leather corset vest, belts, long sleeve blouse, ankle-length skirt', 'f1 F1 x0 gf v:rh-hunter-pt'],
        ['pt-1', 'Hunter red hood outfit, knee', '사냥꾼 빨간 모자 차림 · 무릎 기장', 'red riding hood costume, hooded red cloak, leather corset vest, belts, puff sleeve blouse, knee-length skirt', 'f1 F1 x1 gf v:rh-hunter-pt'],
        ['pt-2', 'Hunter red hood outfit, short', '사냥꾼 빨간 모자 차림 · 짧은 기장', 'red riding hood costume, hooded red cloak, leather corset vest, belts, off-shoulder blouse, short skirt', 'f1 F1 x2 gf v:rh-hunter-pt n:low'],
        ['pt-m', 'Red hood hunter vest', '빨간 망토 사냥꾼 조끼', 'red hood hunter outfit, hooded red cloak, leather vest, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless hunter shirt and harness', '민소매 사냥꾼 셔츠와 하네스', 'red hood hunter outfit, sleeveless shirt, leather harness, hooded red cloak', 'f1 F1 x2 gm'],
        ['ed-0', 'Hooded red hunting coat, long', '후드 빨간 사냥 코트 · 긴 기장', 'hunter outfit, hooded red coat, leather harness, buckled straps, high collar, long coat, trousers tucked into boots', 'f2 x0 gf v:rh-hunter-ed n:high'],
        ['ed-1', 'Hooded red hunting coat, knee', '후드 빨간 사냥 코트 · 무릎 기장', 'hunter outfit, hooded red coat, leather harness, buckled straps, corset, knee-length coat, shorts', 'f2 x1 gf v:rh-hunter-ed'],
        ['ed-2', 'Hooded red hunting coat, short', '후드 빨간 사냥 코트 · 짧은 기장', 'hunter outfit, hooded red coat, leather harness, buckled straps, cropped coat, leather bustier, shorts', 'f2 x2 gf v:rh-hunter-ed'],
        ['ed-m', 'Hooded red long coat', '후드 빨간 롱코트', 'hunter outfit, hooded red long coat, leather harness, trousers', 'f2 x01 gm'],
        ['ed-m2', 'Open red coat and harness', '풀어 입은 빨간 코트와 하네스', 'hunter outfit, open hooded red coat, sleeveless shirt, leather harness', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belts', 'Multiple pouch belts', '주머니 여러 줄 벨트', 'multiple belts with pouches', ''],
        ['corset', 'Leather corset', '가죽 코르셋', 'leather corset', 'x12 gf'],
      ],
      foundation: [
        ['thigh', 'Black thighhighs', '검은 사이하이', 'black thighhighs', 'x12 gf'],
        ['tights', 'Brown tights', '갈색 타이츠', 'brown tights', 'x01 gf'],
      ],
      neckwear: [
        ['scarf', 'Red scarf', '빨간 목도리', 'red scarf', ''],
      ],
      outer: [
        ['cloak', 'Tattered red cloak', '해진 빨간 망토', 'tattered hooded red cloak', 'f1'],
      ],
      footwear: [
        ['boots', 'Leather knee boots', '가죽 니하이 부츠', 'leather knee boots', ''],
        ['combat', 'Combat boots', '컴뱃 부츠', 'combat boots', ''],
      ],
      headwear: [
        ['hood', 'Hood up', '후드 씀', 'hood up', ''],
        ['cap', 'Feathered hunting cap', '깃털 사냥 모자', 'hunting cap with a red feather', 'f1'],
      ],
      accessories: [
        ['gloves', 'Fingerless gloves', '손가락 없는 장갑', 'fingerless gloves', ''],
        ['pelt', 'Faux wolf fur on the shoulder', '어깨에 걸친 인조 늑대 털', 'faux wolf fur draped over the shoulder', 'f1'],
        ['eyes', 'Wolf eyes in the dark', '어둠 속 늑대 눈', 'pair of wolf eyes glowing in the dark behind', 'f3'],
      ],
      weapon: [
        ['basket', 'Wicker basket', '바구니', 'holding a wicker basket', 'F1'],
        ['crossbow', 'Crossbow', '석궁', 'holding a crossbow', 'f1'],
        ['shotgun', 'Prop double-barrel shotgun', '소품 쌍열 엽총', 'holding a prop double-barrel shotgun', 'f1'],
        ['axe', 'Woodcutter axe over the shoulder', '어깨에 멘 도끼', 'woodcutter axe over the shoulder', 'f2'],
        ['lantern', 'Lantern', '등불', 'holding a lantern', ''],
      ],
      device: [
        ['scratch', 'Painted claw marks', '그린 할퀸 자국', 'painted claw marks on the cheek, no blood', ''],
        ['dirt', 'Dirt smudge', '흙 자국', 'dirt smudge on the cheek', ''],
      ],
    },
  }),

  /* ─── V-10 빨간 모자 · 한밤 ─── */
  costume('rh-midnight', 'Red Hood · Midnight', '빨간 모자 · 한밤', 'V-10', {
    tag: 'halloween costume, red riding hood costume, black and red', tagReal: 'red riding hood, halloween night, moonlight',
    tagM: 'halloween costume, red hood, black and red', tagRealM: 'red hood, halloween night, moonlight',
    colors: ['black', 'red', 'crimson', 'burgundy'],
    items: {
      garment: [
        ['hm-f', 'Black dress and a red towel hood', '검은 원피스와 빨간 수건 두건', 'black dress, red towel tied as a hood', 'f0 F0 gf'],
        ['hm-m', 'Black shirt and a red towel hood', '검은 셔츠와 빨간 수건 두건', 'black shirt, black jeans, red towel tied as a hood', 'f0 F0 gm'],
        ['pt-0', 'Black lace red hood dress, long', '검은 레이스 빨간 모자 원피스 · 긴 기장', 'red riding hood costume, black lace dress, red hooded capelet, long sleeves, ankle length', 'f1 F1 x0 gf v:rh-midnight-pt'],
        ['pt-1', 'Black lace red hood dress, knee', '검은 레이스 빨간 모자 원피스 · 무릎 기장', 'red riding hood costume, black lace dress, red hooded capelet, puff sleeves, knee length', 'f1 F1 x1 gf v:rh-midnight-pt'],
        ['pt-2', 'Black lace red hood dress, short', '검은 레이스 빨간 모자 원피스 · 짧은 기장', 'red riding hood costume, black lace dress, red hooded capelet, off-shoulder corset bodice, short lace skirt', 'f1 F1 x2 gf v:rh-midnight-pt n:low'],
        ['pt-m', 'Black shirt and red cape', '검은 셔츠와 빨간 망토', 'red hood costume, black shirt, red hooded cape, black trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open black shirt and red cape', '풀어 헤친 검은 셔츠와 빨간 망토', 'red hood costume, open black shirt, red hooded cape', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Velvet and red lace dress, long', '벨벳과 빨간 레이스 드레스 · 긴 기장', 'black velvet dress, layered red lace, long red hooded cloak, high collar, long sleeves, floor length', 'f2 x0 gf v:rh-midnight-ed n:high'],
        ['ed-1', 'Velvet and red lace dress, knee', '벨벳과 빨간 레이스 드레스 · 무릎 기장', 'black velvet dress, layered red lace, long red hooded cloak, square neckline, knee length', 'f2 x1 gf v:rh-midnight-ed'],
        ['ed-2', 'Velvet and red lace dress, short', '벨벳과 빨간 레이스 드레스 · 짧은 기장', 'black velvet dress, layered red lace, long red hooded cloak, corset bodice, high slit', 'f2 x2 gf v:rh-midnight-ed'],
        ['ed-m', 'Velvet coat and red cloak', '벨벳 코트와 빨간 망토', 'black velvet coat, long red hooded cloak, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open velvet coat and red cloak', '풀어 입은 벨벳 코트와 빨간 망토', 'open black velvet coat, red hooded cloak, lace cravat', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['corset', 'Black lace-up corset', '검은 끈 코르셋', 'black lace-up corset', 'x12 gf'],
        ['ribbon', 'Red ribbon belt', '빨간 리본 벨트', 'red ribbon belt', ''],
      ],
      foundation: [
        ['lace', 'Black lace stockings', '검은 레이스 스타킹', 'black lace stockings', 'gf'],
        ['red', 'Red tights', '빨간 타이츠', 'red tights', 'gf'],
      ],
      neckwear: [
        ['choker', 'Red ribbon choker', '빨간 리본 초커', 'red ribbon choker', ''],
        ['rose', 'Red rose brooch', '빨간 장미 브로치', 'red rose brooch', ''],
      ],
      outer: [
        ['cloak', 'Long red cloak', '긴 빨간 망토', 'long hooded red cloak', 'f1'],
        ['petals', 'Cloak scattering petals', '꽃잎 흩날리는 망토', 'cloak hem scattering red rose petals', 'f3'],
      ],
      footwear: [
        ['boots', 'Black lace-up boots', '검은 끈 부츠', 'black lace-up boots', ''],
        ['red', 'Red shoes', '빨간 구두', 'red shoes', 'gf'],
      ],
      headwear: [
        ['hood', 'Red hood up', '빨간 후드 씀', 'red hood up', ''],
        ['bow', 'Black hair bow', '검은 리본', 'black hair bow', 'gf'],
      ],
      accessories: [
        ['gloves', 'Black lace gloves', '검은 레이스 장갑', 'black lace gloves', ''],
        ['wolf', 'Black wolf beside', '곁의 검은 늑대', 'large black wolf standing beside', 'f2 c:animal'],
        ['moon', 'Red moon behind', '등 뒤 붉은 달', 'red full moon behind', 'f3'],
      ],
      weapon: [
        ['basket', 'Basket with a red cloth', '빨간 천 덮은 바구니', 'holding a wicker basket covered with a red cloth', ''],
        ['rose', 'Red rose', '빨간 장미', 'holding a red rose', ''],
        ['apple', 'Red apple', '빨간 사과', 'holding a red apple', ''],
        ['axe', 'Hand axe', '손도끼', 'holding a hand axe low at the side', 'f1'],
        ['candy', 'Red candy apple', '빨간 사탕 사과', 'holding a glossy red candy apple on a stick', ''],
      ],
      device: [
        ['dark', 'Dark eye makeup', '짙은 눈 분장', 'dark eye makeup', ''],
        ['rose', 'Rose cheek paint', '볼의 장미 분장', 'small rose painted on the cheek', ''],
      ],
    },
  }),

  /* ─── V-11 빨간 모자 · 늑대 귀 ─── */
  costume('rh-wolf', 'Red Hood · Wolf Ears', '빨간 모자 · 늑대 귀', 'V-11', {
    tag: 'halloween costume, red riding hood costume, fake wolf ears', tagReal: 'red riding hood, fake wolf ears, halloween night',
    tagM: 'halloween costume, red hood, fake wolf ears', tagRealM: 'red hood, fake wolf ears, halloween night',
    colors: ['red', 'crimson', 'grey', 'charcoal', 'brown'],
    items: {
      garment: [
        ['hm-f', 'Red hoodie with felt wolf ears', '펠트 늑대 귀 단 빨간 후드티', 'red hoodie with felt wolf ears, grey skirt', 'f0 F0 gf'],
        ['hm-m', 'Red hoodie with felt wolf ears, joggers', '펠트 늑대 귀 빨간 후드티와 조거', 'red hoodie with felt wolf ears, grey joggers', 'f0 F0 gm'],
        ['pt-0', 'Wolf-ear red hooded dress, long', '늑대 귀 빨간 후드 원피스 · 긴 기장', 'red hooded dress with wolf ears on the hood, fur trim, long sleeves, ankle length', 'f1 F1 x0 gf v:rh-wolf-pt'],
        ['pt-1', 'Wolf-ear red hooded dress, knee', '늑대 귀 빨간 후드 원피스 · 무릎 기장', 'red hooded dress with wolf ears on the hood, fur trim, puff sleeves, knee length', 'f1 F1 x1 gf v:rh-wolf-pt'],
        ['pt-2', 'Wolf-ear red hooded dress, short', '늑대 귀 빨간 후드 원피스 · 짧은 기장', 'red hooded dress with wolf ears on the hood, fur trim, crop top cut, short fur-trimmed skirt', 'f1 F1 x2 gf v:rh-wolf-pt'],
        ['pt-m', 'Wolf-ear red hooded jacket', '늑대 귀 빨간 후드 재킷', 'red hooded jacket with wolf ears on the hood, fur trim, shorts', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless wolf-ear red hoodie', '늑대 귀 민소매 빨간 후드', 'sleeveless red hoodie with wolf ears, fur trim, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Wolf-ear capelet and bodice dress, long', '늑대 귀 케이플릿과 끈 원피스 · 긴 기장', 'red hooded capelet with wolf ears, grey fur trim, lace-up bodice dress, long sleeves, long skirt', 'f2 x0 gf v:rh-wolf-ed'],
        ['ed-1', 'Wolf-ear capelet and bodice dress, knee', '늑대 귀 케이플릿과 끈 원피스 · 무릎 기장', 'red hooded capelet with wolf ears, grey fur trim, lace-up bodice dress, short sleeves, knee length', 'f2 x1 gf v:rh-wolf-ed'],
        ['ed-2', 'Wolf-ear capelet and bodice dress, short', '늑대 귀 케이플릿과 끈 원피스 · 짧은 기장', 'red hooded capelet with wolf ears, grey fur trim, lace-up bodice dress, off-shoulder, short torn skirt', 'f2 x2 gf v:rh-wolf-ed n:low'],
        ['ed-m', 'Wolf-ear red hooded coat', '늑대 귀 빨간 후드 코트', 'red hooded coat with wolf ears, grey fur collar, trousers', 'f2 x01 gm'],
        ['ed-m2', 'Open wolf-ear coat and tank top', '풀어 입은 늑대 귀 코트', 'open red hooded coat with wolf ears, fur collar, tank top', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Paw buckle belt', '발바닥 버클 벨트', 'belt with a paw print buckle', ''],
      ],
      foundation: [
        ['fur', 'Fur-trimmed socks', '털 장식 양말', 'fur-trimmed socks', ''],
        ['torn', 'Torn tights', '찢긴 타이츠', 'torn tights', 'x12 gf'],
      ],
      neckwear: [
        ['collar', 'Studded collar', '징 박힌 목걸이', 'studded collar', ''],
        ['bell', 'Bell choker', '방울 초커', 'choker with a bell', ''],
      ],
      outer: [
        ['scarf', 'Grey fur scarf', '회색 털 목도리', 'grey fur scarf', 'f1'],
      ],
      footwear: [
        ['paw', 'Fluffy paw boots', '복슬한 발바닥 부츠', 'fluffy paw boots', ''],
        ['boots', 'Lace-up boots', '끈 부츠', 'lace-up boots', ''],
      ],
      headwear: [
        ['hood', 'Wolf-ear red hood', '늑대 귀 빨간 후드', 'red hood with wolf ears', ''],
        ['ears', 'Wolf ears headband', '늑대 귀 머리띠', 'fake wolf ears, headband', ''],
      ],
      accessories: [
        ['tail', 'Clip-on wolf tail', '달아 놓은 늑대 꼬리', 'clip-on costume wolf tail', ''],
        ['paws', 'Paw gloves', '발바닥 장갑', 'paw gloves', ''],
        ['moon', 'Full moon behind', '등 뒤 보름달', 'huge full moon behind', 'f3'],
      ],
      weapon: [
        ['basket', 'Basket of cookies', '쿠키 바구니', 'holding a basket of cookies', ''],
        ['bone', 'Bone-shaped cookie', '뼈다귀 쿠키', 'holding a bone-shaped cookie', ''],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs', ''],
        ['whiskers', 'Painted whisker marks', '그린 수염', 'whisker markings face paint', ''],
      ],
    },
  }),

  /* ─── V-12 빨간 모자 · 기사 ─── */
  costume('rh-knight', 'Red Hood · Knight', '빨간 모자 · 기사', 'V-12', {
    tag: 'halloween costume, red riding hood costume, armor', tagReal: 'red hood knight, halloween night',
    tagM: 'halloween costume, red hood, armor', tagRealM: 'red hood knight, halloween night',
    colors: ['red', 'crimson', 'silver', 'black', 'burgundy'],
    items: {
      garment: [
        ['hm-f', 'Red hoodie and cardboard breastplate', '빨간 후드티와 골판지 가슴판', 'red hoodie, cardboard breastplate painted silver, skirt', 'f0 F0 gf'],
        ['hm-m', 'Red hoodie and cardboard breastplate, trousers', '빨간 후드티와 골판지 가슴판, 바지', 'red hoodie, cardboard breastplate painted silver, trousers', 'f0 F0 gm'],
        ['pt-0', 'Red hood knight tabard, long', '빨간 모자 기사 겉옷 · 긴 기장', 'red riding hood costume, hooded red tabard, plastic armor breastplate, long sleeves, ankle-length skirt', 'f1 F1 x0 gf v:rh-knight-pt'],
        ['pt-1', 'Red hood knight tabard, knee', '빨간 모자 기사 겉옷 · 무릎 기장', 'red riding hood costume, hooded red tabard, plastic armor breastplate, knee-length skirt', 'f1 F1 x1 gf v:rh-knight-pt'],
        ['pt-2', 'Red hood knight tabard, short', '빨간 모자 기사 겉옷 · 짧은 기장', 'red riding hood costume, hooded red tabard, plastic armor breastplate, short pleated skirt', 'f1 F1 x2 gf v:rh-knight-pt'],
        ['pt-m', 'Red hood knight tabard, trousers', '빨간 기사 겉옷과 바지', 'red hood knight costume, hooded red tabard, plastic armor breastplate, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless red tabard', '민소매 빨간 기사 겉옷', 'red hood knight costume, sleeveless red tabard, armored shoulder, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Armored dress and red cloak, long', '갑옷 드레스와 빨간 망토 · 긴 기장', 'armored dress, silver breastplate, gauntlets, long hooded red cloak, armored sleeves, long armored skirt', 'f2 x0 gf v:rh-knight-ed'],
        ['ed-1', 'Armored dress and red cloak, knee', '갑옷 드레스와 빨간 망토 · 무릎 기장', 'armored dress, silver breastplate, gauntlets, long hooded red cloak, armored greaves, knee-length skirt', 'f2 x1 gf v:rh-knight-ed'],
        ['ed-2', 'Armored dress and red cloak, short', '갑옷 드레스와 빨간 망토 · 짧은 기장', 'armored dress, silver breastplate, gauntlets, long hooded red cloak, armored corset, short armored skirt', 'f2 x2 gf v:rh-knight-ed'],
        ['ed-m', 'Knight armor and red cloak', '기사 갑옷과 빨간 망토', 'knight armor, silver breastplate, long hooded red cloak', 'f2 x01 gm'],
        ['ed-m2', 'Light armor and red cloak', '가벼운 갑옷과 빨간 망토', 'light knight armor, sleeveless padded tunic, hooded red cloak', 'f2 x2 gm'],
      ],
      structure: [
        ['swordbelt', 'Sword belt', '칼집 벨트', 'leather sword belt', ''],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['thigh', 'Thighhighs', '사이하이', 'thighhighs', 'x12 gf'],
      ],
      neckwear: [
        ['gorget', 'Armored collar', '갑옷 목가리개', 'armored gorget', 'f2'],
      ],
      outer: [
        ['cloak', 'Hooded red cloak', '후드 빨간 망토', 'long hooded red cloak', 'f1'],
      ],
      footwear: [
        ['greaves', 'Armored boots', '갑옷 부츠', 'armored boots', ''],
        ['boots', 'Leather knee boots', '가죽 니하이 부츠', 'leather knee boots', ''],
      ],
      headwear: [
        ['hood', 'Red hood up', '빨간 후드 씀', 'red hood up', ''],
        ['circlet', 'Silver circlet', '은 머리관', 'silver circlet', 'f1'],
      ],
      accessories: [
        ['gauntlets', 'Gauntlets', '건틀릿', 'armored gauntlets', 'f1'],
        ['crest', 'Wolf crest', '늑대 문장', 'wolf crest on the tabard', ''],
        ['spirit', 'Spectral wolf beside', '곁의 빛나는 늑대', 'spectral glowing wolf beside', 'f3 c:animal'],
      ],
      weapon: [
        ['toysword', 'Toy sword', '장난감 칼', 'holding a toy sword', 'F1'],
        ['sword', 'Longsword', '롱소드', 'holding a longsword', 'f2'],
        ['shield', 'Wolf crest shield', '늑대 문장 방패', 'holding a round shield with a wolf crest', 'f1'],
        ['lantern', 'Lantern', '등불', 'holding a lantern', ''],
      ],
      device: [
        ['scar', 'Painted scar line', '그린 흉터 선', 'thin painted scar line across the cheek, no blood', ''],
        ['stripe', 'Red paint stripe', '빨간 줄 분장', 'single red paint stripe across the eyes', ''],
      ],
    },
  }),

  /* ─── V-13 빨간 모자 · 스트리트 ─── */
  costume('rh-street', 'Red Hood · Street', '빨간 모자 · 스트리트', 'V-13', {
    tag: 'red riding hood, red hoodie, streetwear, halloween', tagReal: 'red riding hood, streetwear, halloween night',
    colors: ['red', 'black', 'grey', 'white', 'crimson'],
    need: { weapon: 'candy chocolate _bucket _bag _apple' },
    items: {
      garment: [
        ['hm-f', 'Red hoodie with a marker wolf', '매직 늑대 그린 빨간 후드티', 'red hoodie, denim skirt, wolf drawn on the back in marker', 'f0 F0 gf'],
        ['hm-m', 'Red hoodie with a marker wolf, jeans', '매직 늑대 빨간 후드티와 청바지', 'red hoodie, jeans, wolf drawn on the back in marker', 'f0 F0 gm'],
        ['pt-0', 'Oversized red hoodie, long', '오버사이즈 빨간 후드티 · 긴 기장', 'oversized red hoodie, wolf graphic on the back, long cargo skirt', 'f1 F1 x0 gf v:rh-street-pt'],
        ['pt-1', 'Oversized red hoodie, knee', '오버사이즈 빨간 후드티 · 무릎 기장', 'oversized red hoodie, wolf graphic on the back, pleated skirt, knee length', 'f1 F1 x1 gf v:rh-street-pt'],
        ['pt-2', 'Oversized red hoodie, short', '오버사이즈 빨간 후드티 · 짧은 기장', 'cropped red hoodie, wolf graphic on the back, pleated miniskirt', 'f1 F1 x2 gf v:rh-street-pt'],
        ['pt-m', 'Red hoodie and cargo pants', '빨간 후드티와 카고 바지', 'oversized red hoodie, wolf graphic, cargo pants', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless red hoodie and shorts', '민소매 빨간 후드와 반바지', 'sleeveless red hoodie, wolf graphic, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Red padded parka, long', '빨간 패딩 파카 · 긴 기장', 'red padded parka with fur-trimmed hood, wolf patch, long parka, wide trousers', 'f2 x0 gf v:rh-street-ed'],
        ['ed-1', 'Red padded parka, knee', '빨간 패딩 파카 · 무릎 기장', 'red padded parka with fur-trimmed hood, wolf patch, knee-length parka, shorts over tights', 'f2 x1 gf v:rh-street-ed'],
        ['ed-2', 'Red padded parka, short', '빨간 패딩 파카 · 짧은 기장', 'red padded parka with fur-trimmed hood, wolf patch, cropped parka, crop top, mini skirt', 'f2 x2 gf v:rh-street-ed'],
        ['ed-m', 'Red parka and cargo pants', '빨간 파카와 카고 바지', 'red padded parka with fur-trimmed hood, wolf patch, cargo pants', 'f2 x01 gm'],
        ['ed-m2', 'Open red parka and tank top', '풀어 입은 빨간 파카', 'open red padded parka, tank top, wolf patch, cargo pants', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['chain', 'Studded belt', '징 벨트', 'studded belt', ''],
        ['harness', 'Harness belt', '하네스 벨트', 'harness belt', ''],
      ],
      foundation: [
        ['socks', 'White crew socks', '흰 크루 양말', 'white crew socks', ''],
        ['torn', 'Torn tights', '찢긴 타이츠', 'torn tights', 'x12 gf'],
      ],
      neckwear: [
        ['headphones', 'Headphones around the neck', '목에 건 헤드폰', 'headphones around the neck', ''],
        ['chain', 'Pendant necklace', '펜던트 목걸이', 'pendant necklace', ''],
      ],
      outer: [
        ['bomber', 'Black bomber jacket', '검은 항공 점퍼', 'black bomber jacket', 'f1'],
      ],
      footwear: [
        ['hightop', 'Red high-top sneakers', '빨간 하이탑', 'red high-top sneakers', ''],
        ['boots', 'Chunky boots', '두꺼운 부츠', 'chunky boots', ''],
      ],
      headwear: [
        ['hood', 'Red hood up', '빨간 후드 씀', 'hood up', ''],
        ['cap', 'Red baseball cap', '빨간 야구모자', 'red baseball cap', ''],
        ['beanie', 'Wolf-ear beanie', '늑대 귀 비니', 'beanie with wolf ears', ''],
      ],
      accessories: [
        ['backpack', 'Wicker basket backpack', '바구니 백팩', 'wicker basket backpack', ''],
        ['phone', 'Phone with wolf stickers', '늑대 스티커 휴대폰', 'phone covered in wolf stickers', ''],
        ['graffiti', 'Neon wolf graffiti behind', '뒤의 네온 늑대 그래피티', 'glowing neon wolf graffiti behind', 'f3'],
      ],
      weapon: [
        ['candy', 'Pumpkin candy pouch', '호박 사탕 주머니', 'holding a pumpkin-shaped pouch of candy', ''],
        ['chocolate', 'Wrapped chocolates', '포장 초콜릿', 'holding a handful of wrapped chocolates', ''],
        ['skate', 'Pumpkin-sticker skateboard', '호박 스티커 스케이트보드', 'holding a skateboard with pumpkin stickers', ''],
      ],
      device: [
        ['bandaid', 'Bandaid on the nose', '코 반창고', 'bandaid on nose', ''],
        ['sticker', 'Wolf sticker on the cheek', '볼 늑대 스티커', 'wolf sticker on the cheek', ''],
      ],
    },
  }),

  /* ─── V-14 메이드 · 빅토리안 ─── */
  costume('m-victorian', 'Maid · Victorian', '메이드 · 빅토리안', 'V-14', {
    tag: 'halloween costume, maid, victorian maid', tagReal: 'victorian maid, halloween night, candlelight',
    tagM: 'halloween costume, butler, victorian', tagRealM: 'victorian butler, halloween night, candlelight',
    colors: ['black', 'navy', 'burgundy', 'charcoal', 'deep purple'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black dress and a white apron', '검은 원피스와 흰 앞치마', 'long black dress, white kitchen apron, paper lace cuffs', 'f0 F0 gf'],
        ['hm-m', 'White shirt and black vest', '흰 셔츠와 검은 조끼', 'white shirt, black vest, black trousers, paper bow tie', 'f0 F0 gm'],
        ['pt-0', 'Victorian maid dress, long', '빅토리안 메이드 원피스 · 긴 기장', 'maid, victorian maid dress, long white apron, high collar, cuffs, long sleeves, ankle length', 'f1 F1 x0 gf v:m-victorian-pt n:high'],
        ['pt-1', 'Victorian maid dress, knee', '빅토리안 메이드 원피스 · 무릎 기장', 'maid, victorian maid dress, long white apron, high collar, cuffs, long sleeves, mid-calf length', 'f1 F1 x1 gf v:m-victorian-pt n:high'],
        ['pt-2', 'Victorian maid dress, short', '빅토리안 메이드 원피스 · 짧은 기장', 'maid, victorian maid dress, long white apron, high collar, cuffs, short sleeves, knee length', 'f1 F1 x2 gf v:m-victorian-pt n:high'],
        ['pt-m', 'Victorian butler waistcoat', '빅토리안 집사 조끼', 'butler, waistcoat, high collar shirt, cravat, trousers', 'f1 F1 x01 gm n:high'],
        ['pt-m2', 'Butler shirtsleeves', '셔츠 차림 집사', 'butler, rolled shirtsleeves, open collar, waistcoat, trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Victorian maid gown, long', '빅토리안 메이드 드레스 · 긴 기장', 'victorian maid dress, layered lace apron, leg-of-mutton sleeves, cameo brooch, high collar, floor length', 'f2 x0 gf v:m-victorian-ed n:high'],
        ['ed-1', 'Victorian maid gown, knee', '빅토리안 메이드 드레스 · 무릎 기장', 'victorian maid dress, layered lace apron, leg-of-mutton sleeves, cameo brooch, square collar, ankle length', 'f2 x1 gf v:m-victorian-ed'],
        ['ed-2', 'Victorian maid gown, short', '빅토리안 메이드 드레스 · 짧은 기장', 'victorian maid dress, layered lace apron, leg-of-mutton sleeves, cameo brooch, off-shoulder, knee length', 'f2 x2 gf v:m-victorian-ed n:low'],
        ['ed-m', 'Tailcoat butler', '연미복 집사', 'butler, black tailcoat, high collar, white gloves, pocket watch', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open-collar tailcoat butler', '깃 풀린 연미복 집사', 'butler, black tailcoat, open collar shirt, loosened cravat', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['apronbow', 'Big apron bow', '앞치마 큰 리본', 'big apron bow at the back', 'gf'],
        ['keys', 'Ring of keys on the belt', '허리에 단 열쇠 꾸러미', 'ring of old keys hanging from the belt', ''],
      ],
      foundation: [
        ['black', 'Black stockings', '검은 스타킹', 'black stockings', 'gf'],
        ['white', 'White stockings', '흰 스타킹', 'white stockings', 'gf'],
      ],
      neckwear: [
        ['cameo', 'Cameo brooch', '카메오 브로치', 'cameo brooch at the collar', ''],
        ['cravat', 'Cravat', '크라바트', 'cravat', 'gm'],
      ],
      outer: [
        ['shawl', 'Black shawl over the shoulders', '어깨에 두른 검은 숄', 'black shawl draped over the shoulders', 'f1'],
      ],
      footwear: [
        ['boots', 'Button boots', '단추 부츠', 'button boots', ''],
        ['oxford', 'Oxford shoes', '옥스퍼드 구두', 'oxford shoes', ''],
      ],
      headwear: [
        ['cap', 'Mob cap', '프릴 보닛', 'frilled mob cap', 'gf'],
        ['headdress', 'Lace maid headdress', '레이스 메이드 헤드드레스', 'lace maid headdress', 'gf'],
        ['pin', 'Collar pin', '깃 핀', 'silver collar pin', 'gm'],
      ],
      accessories: [
        ['gloves', 'White gloves', '흰 장갑', 'white gloves', ''],
        ['watch', 'Pocket watch', '회중시계', 'pocket watch', ''],
        ['candles', 'Candles lighting themselves', '저절로 켜지는 촛불', 'candles lighting themselves around', 'f3'],
      ],
      weapon: [
        ['candle', 'Candlestick', '촛대', 'holding a brass candlestick', ''],
        ['tea', 'Silver tea tray', '은 찻쟁반', 'holding a silver tea tray', ''],
        ['duster', 'Feather duster', '깃털 먼지떨이', 'holding a feather duster', 'F2'],
      ],
      device: [
        ['pale', 'Pale makeup', '창백한 분장', 'pale skin makeup', ''],
        ['mole', 'Beauty mark', '애교점', 'beauty mark', ''],
      ],
    },
  }),

  /* ─── V-15 메이드 · 프렌치 ─── */
  costume('m-french', 'Maid · French', '메이드 · 프렌치', 'V-15', {
    tag: 'halloween costume, french maid', tagReal: 'french maid, halloween night',
    tagM: 'halloween costume, butler', tagRealM: 'butler, halloween night',
    colors: ['black', 'burgundy', 'navy', 'pastel pink', 'crimson'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black dress and a doily apron', '검은 원피스와 레이스 받침 앞치마', 'short black dress, paper doily pinned on as an apron', 'f0 F0 gf'],
        ['hm-m', 'Black vest and a paper bow tie', '검은 조끼와 종이 보타이', 'black vest, white shirt, paper bow tie, trousers', 'f0 F0 gm'],
        ['pt-0', 'French maid dress, long', '프렌치 메이드 원피스 · 긴 기장', 'french maid, black dress, frilled white apron, puff sleeves, white collar, long skirt with petticoat', 'f1 F1 x0 gf v:m-french-pt'],
        ['pt-1', 'French maid dress, knee', '프렌치 메이드 원피스 · 무릎 기장', 'french maid, black dress, frilled white apron, puff sleeves, white collar, knee-length skirt with petticoat', 'f1 F1 x1 gf v:m-french-pt'],
        ['pt-2', 'French maid dress, short', '프렌치 메이드 원피스 · 짧은 기장', 'french maid, black dress, frilled white apron, puff sleeves, white collar, short skirt with petticoat', 'f1 F1 x2 gf v:m-french-pt'],
        ['pt-m', 'Butler vest and bow tie', '집사 조끼와 보타이', 'butler, black vest, bow tie, white shirt, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Butler shirt and suspenders', '집사 셔츠와 멜빵', 'butler, rolled sleeves, open collar, suspenders, trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Satin French maid dress, long', '새틴 프렌치 메이드 원피스 · 긴 기장', 'french maid, satin dress, layered organza apron, lace trim, long sleeves, ankle length', 'f2 x0 gf v:m-french-ed'],
        ['ed-1', 'Satin French maid dress, knee', '새틴 프렌치 메이드 원피스 · 무릎 기장', 'french maid, satin dress, layered organza apron, lace trim, puff sleeves, knee length', 'f2 x1 gf v:m-french-ed'],
        ['ed-2', 'Satin French maid dress, short', '새틴 프렌치 메이드 원피스 · 짧은 기장', 'french maid, satin dress, layered organza apron, lace trim, off-shoulder corset bodice, short layered skirt', 'f2 x2 gf v:m-french-ed n:low'],
        ['ed-m', 'Satin-lapel butler coat', '새틴 깃 집사 코트', 'butler, satin lapel tailcoat, white gloves', 'f2 x01 gm'],
        ['ed-m2', 'Open satin-lapel butler coat', '풀어 입은 새틴 깃 집사 코트', 'butler, satin lapel tailcoat, open collar shirt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['apronbow', 'Big apron bow', '앞치마 큰 리본', 'big apron bow at the back', 'gf'],
        ['corset', 'Black corset', '검은 코르셋', 'black corset', 'x12 gf'],
      ],
      foundation: [
        ['white', 'White thighhighs', '흰 니삭스', 'white thighhighs', 'gf'],
        ['garter', 'Thighhighs with garters', '가터 니삭스', 'black thighhighs, garter straps', 'x2 gf'],
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x0 gf'],
      ],
      neckwear: [
        ['collar', 'Detached collar', '떼어 낸 깃', 'detached collar', ''],
        ['ribbon', 'Black neck ribbon', '검은 목 리본', 'black neck ribbon', ''],
      ],
      outer: [],
      footwear: [
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
        ['heels', 'Strap heels', '끈 힐', 'strap heels', 'x12 gf'],
        ['loafers', 'Loafers', '로퍼', 'loafers', 'gm'],
      ],
      headwear: [
        ['headdress', 'Frilled maid headdress', '프릴 메이드 헤드드레스', 'frilled maid headdress', 'gf'],
        ['bow', 'Black bow', '검은 리본', 'black hair bow', 'gf'],
        ['cat', 'Cat ears', '고양이 귀', 'fake cat ears', 'f1'],
      ],
      accessories: [
        ['cuffs', 'Wrist cuffs', '손목 커프스', 'wrist cuffs', ''],
        ['gloves', 'White gloves', '흰 장갑', 'white gloves', 'gm'],
        ['sparkle', 'Sparkling clean', '반짝이는 청소 자국', 'sparkles where she has cleaned', 'f3 gf'],
      ],
      weapon: [
        ['duster', 'Feather duster', '깃털 먼지떨이', 'holding a feather duster', ''],
        ['tray', 'Tray of macarons', '마카롱 쟁반', 'holding a tray of macarons', ''],
        ['teapot', 'Teapot', '찻주전자', 'holding a teapot', ''],
      ],
      device: [
        ['mole', 'Beauty mark', '애교점', 'beauty mark', ''],
        ['wink', 'Winking', '윙크', 'one eye closed, smile', ''],
      ],
    },
  }),

  /* ─── V-16 메이드 · 저지 ─── */
  costume('m-jersey', 'Maid · Jersey', '메이드 · 저지', 'V-16', {
    tag: 'jersey maid, track jacket, maid headdress, halloween', tagReal: 'jersey maid, halloween night',
    tagM: 'track jacket, butler, halloween', tagRealM: 'track jacket, butler, halloween night',
    colors: ['black', 'navy', 'red', 'forest green', 'royal blue'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'School tracksuit and a borrowed apron', '체육복과 빌린 앞치마', 'school tracksuit, white apron tied over it, paper maid headdress', 'f0 F0 gf'],
        ['hm-m', 'School tracksuit and a bow tie', '체육복과 보타이', 'school tracksuit, clip-on bow tie', 'f0 F0 gm'],
        ['pt-0', 'Jersey maid outfit, long', '저지 메이드 차림 · 긴 기장', 'jersey maid, zip-up track jacket with white stripes, frilled white apron, maid headdress, track pants', 'f1 F1 x0 gf v:m-jersey-pt'],
        ['pt-1', 'Jersey maid outfit, knee', '저지 메이드 차림 · 무릎 기장', 'jersey maid, zip-up track jacket with white stripes, frilled white apron, maid headdress, pleated skirt, knee length', 'f1 F1 x1 gf v:m-jersey-pt'],
        ['pt-2', 'Jersey maid outfit, short', '저지 메이드 차림 · 짧은 기장', 'jersey maid, zip-up track jacket with white stripes, frilled white apron, maid headdress, pleated miniskirt', 'f1 F1 x2 gf v:m-jersey-pt'],
        ['pt-m', 'Track jacket butler', '트랙 재킷 집사', 'zip-up track jacket with white stripes, bow tie, track pants', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open track jacket butler', '풀어 입은 트랙 재킷 집사', 'open track jacket, tank top, bow tie, track pants', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Jersey maid dress, long', '저지 메이드 원피스 · 긴 기장', 'jersey maid, track jacket dress with white stripes, layered frilled apron, lace trim, long sleeves, ankle length', 'f2 x0 gf v:m-jersey-ed'],
        ['ed-1', 'Jersey maid dress, knee', '저지 메이드 원피스 · 무릎 기장', 'jersey maid, track jacket dress with white stripes, layered frilled apron, lace trim, sleeves pushed up, knee length', 'f2 x1 gf v:m-jersey-ed'],
        ['ed-2', 'Jersey maid dress, short', '저지 메이드 원피스 · 짧은 기장', 'jersey maid, track jacket dress with white stripes, layered frilled apron, lace trim, cropped track jacket, frilled miniskirt', 'f2 x2 gf v:m-jersey-ed'],
        ['ed-m', 'Track jacket and waistcoat', '트랙 재킷과 조끼', 'track jacket over a waistcoat, bow tie, slacks', 'f2 x01 gm'],
        ['ed-m2', 'Open track jacket and waistcoat', '풀어 입은 트랙 재킷과 조끼', 'open track jacket, waistcoat, no tie, slacks', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['apron', 'Frilled apron', '프릴 앞치마', 'frilled white apron', 'gf'],
      ],
      foundation: [
        ['socks', 'White crew socks', '흰 크루 양말', 'white crew socks', ''],
        ['knee', 'Kneehighs', '니삭스', 'kneehighs', 'gf'],
      ],
      neckwear: [
        ['whistle', 'Whistle on a cord', '목에 건 호루라기', 'whistle on a cord', ''],
        ['bow', 'Bow tie', '보타이', 'bow tie', ''],
      ],
      outer: [],
      footwear: [
        ['sneakers', 'Sneakers', '운동화', 'sneakers', ''],
        ['slides', 'Slides with socks', '양말에 슬리퍼', 'slides with socks', 'F1'],
      ],
      headwear: [
        ['headdress', 'Maid headdress', '메이드 헤드드레스', 'maid headdress', 'gf'],
        ['band', 'Sports headband', '운동 머리띠', 'sports headband', ''],
        ['cap', 'Backwards cap', '거꾸로 쓴 모자', 'backwards cap', 'gm'],
      ],
      accessories: [
        ['cuffs', 'Wrist cuffs over sleeves', '소매 위 커프스', 'wrist cuffs over the track jacket sleeves', ''],
        ['mop', 'Mop over the shoulder', '어깨에 멘 대걸레', 'mop over the shoulder', 'f1'],
        ['speed', 'Speed lines', '속도선', 'cleaning at blurring speed, speed lines', 'f3'],
      ],
      weapon: [
        ['broom', 'Broom', '빗자루', 'holding a broom', ''],
        ['bucket', 'Bucket', '양동이', 'holding a bucket', ''],
        ['drink', 'Sports drink', '스포츠 음료', 'holding a sports drink', ''],
      ],
      device: [
        ['bandaid', 'Bandaid on the nose', '코 반창고', 'bandaid on nose', ''],
        ['grin', 'Toothy grin', '이 드러낸 웃음', 'toothy grin', ''],
      ],
    },
  }),

  /* ─── V-17 메이드 · 파스텔 카페 ─── */
  costume('m-pastel', 'Maid · Pastel Cafe', '메이드 · 파스텔 카페', 'V-17', {
    tag: 'halloween costume, maid, maid cafe, pastel', tagReal: 'maid, maid cafe, halloween night',
    tagM: 'halloween costume, butler, pastel', tagRealM: 'butler, pastel, halloween night',
    colors: ['pastel pink', 'lavender', 'mint', 'sky blue', 'butter yellow'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Pink dress and a heart apron', '분홍 원피스와 하트 앞치마', 'pink dress, white apron with a felt heart', 'f0 F0 gf'],
        ['hm-m', 'Pastel shirt and a heart bow tie', '파스텔 셔츠와 하트 보타이', 'pastel shirt, heart-shaped bow tie, trousers', 'f0 F0 gm'],
        ['pt-0', 'Pastel maid dress, long', '파스텔 메이드 원피스 · 긴 기장', 'maid, pastel maid dress, heart-shaped apron, puff sleeves, ribbon at the chest, long skirt with petticoat', 'f1 F1 x0 gf v:m-pastel-pt'],
        ['pt-1', 'Pastel maid dress, knee', '파스텔 메이드 원피스 · 무릎 기장', 'maid, pastel maid dress, heart-shaped apron, puff sleeves, ribbon at the chest, knee-length skirt with petticoat', 'f1 F1 x1 gf v:m-pastel-pt'],
        ['pt-2', 'Pastel maid dress, short', '파스텔 메이드 원피스 · 짧은 기장', 'maid, pastel maid dress, heart-shaped apron, puff sleeves, ribbon at the chest, short skirt with petticoat', 'f1 F1 x2 gf v:m-pastel-pt'],
        ['pt-m', 'Pastel butler vest', '파스텔 집사 조끼', 'butler, pastel vest, heart bow tie, white shirt, shorts', 'f1 F1 x01 gm'],
        ['pt-m2', 'Pastel butler shirt', '파스텔 집사 셔츠', 'butler, pastel shirt with rolled sleeves, suspenders, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Layered pastel maid dress, long', '겹프릴 파스텔 메이드 원피스 · 긴 기장', 'maid, pastel maid dress, tiered frills, heart buttons, lace apron, long sleeves, ankle length', 'f2 x0 gf v:m-pastel-ed'],
        ['ed-1', 'Layered pastel maid dress, knee', '겹프릴 파스텔 메이드 원피스 · 무릎 기장', 'maid, pastel maid dress, tiered frills, heart buttons, lace apron, puff sleeves, knee length', 'f2 x1 gf v:m-pastel-ed'],
        ['ed-2', 'Layered pastel maid dress, short', '겹프릴 파스텔 메이드 원피스 · 짧은 기장', 'maid, pastel maid dress, tiered frills, heart buttons, lace apron, off-shoulder, short tiered skirt', 'f2 x2 gf v:m-pastel-ed n:low'],
        ['ed-m', 'Pastel butler tailcoat', '파스텔 집사 연미복', 'butler, pastel tailcoat, heart buttons, white gloves', 'f2 x01 gm'],
        ['ed-m2', 'Open pastel tailcoat', '풀어 입은 파스텔 연미복', 'butler, open pastel tailcoat, open collar', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Big back bow', '등 뒤 큰 리본', 'big bow at the back', 'gf'],
      ],
      foundation: [
        ['frill', 'Frilled thighhighs', '프릴 니삭스', 'frilled thighhighs', 'gf'],
        ['heart', 'Heart-print socks', '하트 무늬 양말', 'heart print socks', 'gf'],
      ],
      neckwear: [
        ['heart', 'Heart choker', '하트 초커', 'heart choker', ''],
        ['bow', 'Heart bow tie', '하트 보타이', 'heart-shaped bow tie', 'gm'],
      ],
      outer: [],
      footwear: [
        ['mary', 'Pastel platform mary janes', '파스텔 플랫폼 메리제인', 'pastel platform mary janes', 'gf'],
        ['loafers', 'White loafers', '흰 로퍼', 'white loafers', ''],
      ],
      headwear: [
        ['headdress', 'Heart maid headdress', '하트 메이드 헤드드레스', 'maid headdress with a heart', 'gf'],
        ['ears', 'Bunny ears headband', '토끼 귀 머리띠', 'fake rabbit ears headband', ''],
        ['cat', 'Cat ears', '고양이 귀', 'fake cat ears', ''],
      ],
      accessories: [
        ['cuffs', 'Heart wrist cuffs', '하트 손목 커프스', 'wrist cuffs with hearts', ''],
        ['menu', 'Heart menu', '하트 메뉴판', 'heart-shaped menu tucked under the arm', ''],
        ['hearts', 'Floating hearts', '떠오르는 하트', 'floating pink hearts', 'f3'],
      ],
      weapon: [
        ['omurice', 'Omelette rice with a ketchup heart', '케첩 하트 오므라이스', 'holding a plate of omelette rice with a ketchup heart', ''],
        ['parfait', 'Pumpkin parfait', '호박 파르페', 'holding a pumpkin parfait', ''],
        ['hearthands', 'Heart hands', '손 하트', 'heart hands', ''],
      ],
      device: [
        ['heart', 'Heart sticker under the eye', '볼의 하트 분장 스티커', 'heart sticker under the eye', ''],
        ['blush', 'Blush', '발그레한 볼', 'blush', ''],
      ],
    },
  }),

  /* ─── V-18 메이드 · 전투 ─── */
  costume('m-battle', 'Maid · Battle', '메이드 · 전투', 'V-18', {
    tag: 'halloween costume, battle maid', tagReal: 'battle maid, halloween night',
    tagM: 'halloween costume, battle butler', tagRealM: 'battle butler, halloween night',
    colors: ['black', 'navy', 'charcoal', 'crimson', 'silver'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Maid dress with cardboard armor', '골판지 갑옷 단 메이드 원피스', 'black dress, white apron, cardboard shoulder armor', 'f0 F0 gf'],
        ['hm-m', 'Vest with cardboard armor', '골판지 갑옷 단 조끼', 'black vest, white shirt, cardboard shoulder armor', 'f0 F0 gm'],
        ['pt-0', 'Armored maid dress, long', '갑옷 메이드 원피스 · 긴 기장', 'battle maid, maid dress, frilled apron, armored shoulder plates, belts, long sleeves, ankle length', 'f1 F1 x0 gf v:m-battle-pt'],
        ['pt-1', 'Armored maid dress, knee', '갑옷 메이드 원피스 · 무릎 기장', 'battle maid, maid dress, frilled apron, armored shoulder plates, belts, long sleeves, knee length', 'f1 F1 x1 gf v:m-battle-pt'],
        ['pt-2', 'Armored maid dress, short', '갑옷 메이드 원피스 · 짧은 기장', 'battle maid, maid dress, frilled apron, armored shoulder plates, belts, short sleeves, short skirt', 'f1 F1 x2 gf v:m-battle-pt'],
        ['pt-m', 'Armored butler', '갑옷 집사', 'battle butler, waistcoat, armored shoulder plate, gloves, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless armored butler', '민소매 갑옷 집사', 'battle butler, sleeveless waistcoat, armored bracers, trousers', 'f1 F1 x2 gm'],
        ['ed-0', 'Plated battle maid dress, long', '판금 전투 메이드 원피스 · 긴 기장', 'battle maid, maid dress, steel breastplate over the apron, armored gauntlets, frilled trim, long sleeves, long skirt', 'f2 x0 gf v:m-battle-ed'],
        ['ed-1', 'Plated battle maid dress, knee', '판금 전투 메이드 원피스 · 무릎 기장', 'battle maid, maid dress, steel breastplate over the apron, armored gauntlets, frilled trim, puff sleeves, knee length', 'f2 x1 gf v:m-battle-ed'],
        ['ed-2', 'Plated battle maid dress, short', '판금 전투 메이드 원피스 · 짧은 기장', 'battle maid, maid dress, steel breastplate over the apron, armored gauntlets, frilled trim, armored corset, short frilled skirt', 'f2 x2 gf v:m-battle-ed'],
        ['ed-m', 'Battle butler tailcoat', '전투 집사 연미복', 'battle butler, tailcoat with armored shoulders, gauntlets', 'f2 x01 gm'],
        ['ed-m2', 'Open battle tailcoat', '풀어 입은 전투 연미복', 'battle butler, open tailcoat, harness, gauntlets', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belts', 'Holster belts', '홀스터 벨트', 'multiple holster belts', ''],
        ['apronbow', 'Big apron bow', '앞치마 큰 리본', 'big apron bow at the back', 'gf'],
      ],
      foundation: [
        ['black', 'Black thighhighs', '검은 니삭스', 'black thighhighs', 'gf'],
        ['greaves', 'Armored greaves', '갑옷 정강이받이', 'armored greaves', 'f2'],
      ],
      neckwear: [
        ['collar', 'Armored collar', '갑옷 깃', 'armored collar', 'f1'],
        ['ribbon', 'Black ribbon', '검은 리본', 'black neck ribbon', ''],
      ],
      outer: [
        ['cape', 'Tattered short cape', '해진 짧은 망토', 'tattered short cape', 'f1'],
      ],
      footwear: [
        ['boots', 'Armored boots', '갑옷 부츠', 'armored boots', ''],
        ['combat', 'Combat boots', '컴뱃 부츠', 'combat boots', ''],
      ],
      headwear: [
        ['headdress', 'Maid headdress', '메이드 헤드드레스', 'maid headdress', 'gf'],
        ['eyepatch', 'Eyepatch', '안대', 'eyepatch', ''],
      ],
      accessories: [
        ['gauntlets', 'Gauntlets', '건틀릿', 'armored gauntlets', 'f1'],
        ['gloves', 'White gloves', '흰 장갑', 'white gloves', ''],
        ['aura', 'Battle aura', '전투 기운', 'faint battle aura', 'f3'],
      ],
      weapon: [
        ['mop', 'Mop held like a spear', '창처럼 쥔 대걸레', 'holding a mop like a spear', ''],
        ['broom', 'Broom held like a sword', '칼처럼 쥔 빗자루', 'holding a broom like a sword', ''],
        ['halberd', 'Halberd', '할버드', 'holding a halberd', 'f2'],
      ],
      device: [
        ['scar', 'Painted scar line', '그린 흉터 선', 'thin painted scar line, no blood', ''],
        ['stern', 'Stern look', '냉정한 눈빛', 'expressionless', ''],
      ],
    },
  }),

  /* ─── V-19 뱀파이어 · 아이돌 ─── */
  costume('v-idol', 'Vampire · Idol', '뱀파이어 · 아이돌', 'V-19', {
    tag: 'halloween costume, vampire costume, idol', tagReal: 'vampire idol, halloween night, stage lights',
    colors: ['black', 'crimson', 'red', 'silver', 'pastel pink'],
    need: { device: 'fang' },
    items: {
      garment: [
        ['hm-f', 'Black dress and a red ribbon cape', '검은 원피스와 빨간 리본 망토', 'black dress, red satin ribbon tied as a cape', 'f0 F0 gf'],
        ['hm-m', 'Black shirt and a red cape', '검은 셔츠와 빨간 망토', 'black shirt, black jeans, red satin cape', 'f0 F0 gm'],
        ['pt-0', 'Vampire idol dress, long', '뱀파이어 아이돌 원피스 · 긴 기장', 'vampire costume, idol stage dress, bat-wing collar, red and black frills, sequin trim, long sleeves, ankle-length tiered skirt', 'f1 F1 x0 gf v:v-idol-pt'],
        ['pt-1', 'Vampire idol dress, knee', '뱀파이어 아이돌 원피스 · 무릎 기장', 'vampire costume, idol stage dress, bat-wing collar, red and black frills, sequin trim, puff sleeves, knee-length tiered skirt', 'f1 F1 x1 gf v:v-idol-pt'],
        ['pt-2', 'Vampire idol dress, short', '뱀파이어 아이돌 원피스 · 짧은 기장', 'vampire costume, idol stage dress, bat-wing collar, red and black frills, sequin trim, off-shoulder, short tiered skirt', 'f1 F1 x2 gf v:v-idol-pt n:low'],
        ['pt-m', 'Vampire idol jacket', '뱀파이어 아이돌 재킷', 'vampire costume, idol stage jacket, bat-wing collar, sequin trim, slim trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open idol jacket and black tank top', '풀어 입은 아이돌 재킷과 민소매', 'vampire costume, open stage jacket, black tank top, slim trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Velvet vampire idol dress, long', '벨벳 뱀파이어 아이돌 원피스 · 긴 기장', 'vampire idol dress, velvet bodice, red tulle layers, rhinestone bats, high collar, long sleeves, long skirt', 'f2 x0 gf v:v-idol-ed n:high'],
        ['ed-1', 'Velvet vampire idol dress, knee', '벨벳 뱀파이어 아이돌 원피스 · 무릎 기장', 'vampire idol dress, velvet bodice, red tulle layers, rhinestone bats, square neckline, knee length', 'f2 x1 gf v:v-idol-ed'],
        ['ed-2', 'Velvet vampire idol dress, short', '벨벳 뱀파이어 아이돌 원피스 · 짧은 기장', 'vampire idol dress, velvet bodice, red tulle layers, rhinestone bats, strapless, short tulle skirt', 'f2 x2 gf v:v-idol-ed n:low'],
        ['ed-m', 'Velvet idol tailcoat', '벨벳 아이돌 연미복', 'vampire idol, velvet tailcoat, rhinestone bats, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open velvet idol tailcoat', '풀어 입은 벨벳 아이돌 연미복', 'vampire idol, open velvet tailcoat, leather harness', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['chain', 'Studded belt', '징 벨트', 'studded belt', ''],
        ['corset', 'Red corset belt', '빨간 코르셋 벨트', 'red corset belt', 'gf'],
      ],
      foundation: [
        ['red', 'Red thighhighs', '빨간 니삭스', 'red thighhighs', 'gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black pantyhose', 'x2 gf'],
      ],
      neckwear: [
        ['choker', 'Bat choker', '박쥐 초커', 'choker, bat charm', ''],
        ['mic', 'Headset mic', '헤드셋 마이크', 'headset microphone', ''],
      ],
      outer: [
        ['cape', 'Short red-lined cape', '안이 빨간 짧은 망토', 'short cape, red lining', 'f1'],
      ],
      footwear: [
        ['boots', 'Platform boots', '플랫폼 부츠', 'platform boots', ''],
        ['heels', 'Red heels', '빨간 힐', 'red heels', 'gf'],
      ],
      headwear: [
        ['wings', 'Bat wing hair clips', '박쥐 날개 머리핀', 'bat wing hair ornament', ''],
        ['minitop', 'Tilted mini top hat', '기울여 쓴 미니 실크해트', 'mini top hat, tilted headwear', ''],
      ],
      accessories: [
        ['gloves', 'Lace fingerless gloves', '레이스 손가락 없는 장갑', 'lace fingerless gloves', ''],
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings costume on the back', 'f1'],
        ['bats', 'Bats in the spotlight', '조명 속 박쥐', 'bats flying through the spotlight', 'f3 c:animal'],
      ],
      weapon: [
        ['mic', 'Bat microphone', '박쥐 마이크', 'holding a microphone decorated with bat wings', ''],
        ['lightstick', 'Bat lightstick', '박쥐 응원봉', 'holding a bat-shaped lightstick', ''],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs, smile', ''],
        ['glitter', 'Red glitter', '빨간 반짝이', 'red glitter under the eyes', ''],
      ],
    },
  }),

  /* ─── V-20 뱀파이어 · 펑크 ─── */
  costume('v-punk', 'Vampire · Punk', '뱀파이어 · 펑크', 'V-20', {
    tag: 'halloween costume, vampire costume, punk', tagReal: 'punk vampire, halloween night',
    colors: ['black', 'crimson', 'charcoal', 'deep purple', 'red'],
    need: { device: 'fang' },
    items: {
      garment: [
        ['hm-f', 'Band tee and a red cape', '밴드 티셔츠와 빨간 망토', 'black band t-shirt, plaid skirt, red cape safety-pinned on', 'f0 F0 gf'],
        ['hm-m', 'Band tee and a red cape, jeans', '밴드 티셔츠와 빨간 망토, 청바지', 'black band t-shirt, ripped jeans, red cape safety-pinned on', 'f0 F0 gm'],
        ['pt-0', 'Punk vampire outfit, long', '펑크 뱀파이어 차림 · 긴 기장', 'vampire costume, studded leather jacket, plaid skirt, bat print tee, long plaid skirt', 'f1 F1 x0 gf v:v-punk-pt'],
        ['pt-1', 'Punk vampire outfit, knee', '펑크 뱀파이어 차림 · 무릎 기장', 'vampire costume, studded leather jacket, plaid skirt, bat print tee, knee-length plaid skirt', 'f1 F1 x1 gf v:v-punk-pt'],
        ['pt-2', 'Punk vampire outfit, short', '펑크 뱀파이어 차림 · 짧은 기장', 'vampire costume, studded leather jacket, plaid skirt, bat print tee, plaid miniskirt, cropped tee', 'f1 F1 x2 gf v:v-punk-pt'],
        ['pt-m', 'Punk vampire jacket and jeans', '펑크 뱀파이어 재킷과 청바지', 'vampire costume, studded leather jacket, bat print tee, ripped black jeans', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless punk vest', '민소매 펑크 조끼', 'vampire costume, sleeveless studded vest, black tank top, ripped black jeans', 'f1 F1 x2 gm'],
        ['ed-0', 'Punk vampire corset dress, long', '펑크 뱀파이어 코르셋 원피스 · 긴 기장', 'punk vampire dress, red plaid, black corset, safety pins, buckled straps, long sleeves, ankle length', 'f2 x0 gf v:v-punk-ed'],
        ['ed-1', 'Punk vampire corset dress, knee', '펑크 뱀파이어 코르셋 원피스 · 무릎 기장', 'punk vampire dress, red plaid, black corset, safety pins, buckled straps, short sleeves, knee length', 'f2 x1 gf v:v-punk-ed'],
        ['ed-2', 'Punk vampire corset dress, short', '펑크 뱀파이어 코르셋 원피스 · 짧은 기장', 'punk vampire dress, red plaid, black corset, safety pins, buckled straps, off-shoulder, short skirt', 'f2 x2 gf v:v-punk-ed n:low'],
        ['ed-m', 'Long leather coat, plaid', '긴 가죽 코트와 체크', 'punk vampire, long leather coat, red plaid trousers, buckled straps', 'f2 x01 gm'],
        ['ed-m2', 'Open leather coat and tank top', '풀어 입은 가죽 코트와 민소매', 'punk vampire, open leather coat, black tank top, red plaid trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['studs', 'Studded belt', '징 벨트', 'studded belt', ''],
        ['chain', 'Safety pins on the belt', '벨트 옷핀', 'safety pins along the belt', ''],
      ],
      foundation: [
        ['torn', 'Torn black tights', '찢긴 검은 타이츠', 'torn black tights', 'x12 gf'],
        ['striped', 'Red and black striped socks', '빨강 검정 줄무늬 양말', 'red and black striped socks', ''],
      ],
      neckwear: [
        ['spike', 'Spiked collar', '스파이크 목걸이', 'spiked collar', ''],
        ['padlock', 'Padlock choker', '자물쇠 초커', 'padlock choker', ''],
      ],
      outer: [
        ['cape', 'Torn red cape', '찢긴 빨간 망토', 'torn red cape', 'f1'],
      ],
      footwear: [
        ['boots', 'Combat boots', '컴뱃 부츠', 'combat boots', ''],
        ['creepers', 'Creeper shoes', '크리퍼 신발', 'creeper shoes', ''],
      ],
      headwear: [
        ['bat', 'Bat hair clips', '박쥐 머리핀', 'bat hair ornament', ''],
        ['safety', 'Safety pin earrings', '옷핀 귀걸이', 'safety pin earrings', ''],
      ],
      accessories: [
        ['gloves', 'Fingerless gloves', '손가락 없는 장갑', 'fingerless gloves', ''],
        ['patches', 'Bat patches', '박쥐 패치', 'bat patches sewn on the jacket', ''],
        ['bats', 'Bats bursting out', '튀어나오는 박쥐', 'bats bursting out from the jacket', 'f3 c:animal'],
      ],
      weapon: [
        ['guitar', 'Electric guitar', '일렉 기타', 'holding an electric guitar', 'f1'],
        ['juice', 'Blood bag of juice', '주스 든 수혈팩', 'holding a juice pouch shaped like a blood bag', ''],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs', ''],
        ['liner', 'Smudged eyeliner', '번진 눈 화장', 'smudged eye makeup', ''],
      ],
    },
  }),

  /* ─── V-21 뱀파이어 · 교복 ─── */
  costume('v-school', 'Vampire · School', '뱀파이어 · 교복', 'V-21', {
    tag: 'halloween costume, vampire costume, school uniform', tagReal: 'vampire, school uniform, halloween night',
    colors: ['black', 'navy', 'burgundy', 'charcoal', 'crimson'],
    need: { device: 'fang' },
    items: {
      garment: [
        ['hm-f', 'Uniform and a towel cape', '교복과 수건 망토', 'school uniform, black towel worn as a cape, plastic fangs', 'f0 F0 gf'],
        ['hm-m', 'Uniform with trousers and a towel cape', '바지 교복과 수건 망토', 'school uniform with trousers, black towel worn as a cape', 'f0 F0 gm'],
        ['pt-0', 'Vampire school uniform, long', '뱀파이어 교복 · 긴 기장', 'vampire costume, school uniform, blazer, red ribbon, bat pin, short cape, pleated skirt, ankle length', 'f1 F1 x0 gf v:v-school-pt'],
        ['pt-1', 'Vampire school uniform, knee', '뱀파이어 교복 · 무릎 기장', 'vampire costume, school uniform, blazer, red ribbon, bat pin, short cape, pleated skirt, knee length', 'f1 F1 x1 gf v:v-school-pt'],
        ['pt-2', 'Vampire school uniform, short', '뱀파이어 교복 · 짧은 기장', 'vampire costume, school uniform, blazer, red ribbon, bat pin, short cape, cropped blazer, pleated miniskirt', 'f1 F1 x2 gf v:v-school-pt'],
        ['pt-m', 'Vampire uniform with trousers', '바지 뱀파이어 교복', 'vampire costume, school uniform, blazer, red tie, bat pin, short cape, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Loosened vampire uniform', '풀어 입은 뱀파이어 교복', 'vampire costume, school uniform, loosened red tie, open collar, short cape', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Vampire uniform with a high-collar cape, long', '높은 깃 망토 뱀파이어 교복 · 긴 기장', 'school uniform, blazer, high-collared cape with red lining, rose brooch, pleated skirt, ankle length', 'f2 x0 gf v:v-school-ed'],
        ['ed-1', 'Vampire uniform with a high-collar cape, knee', '높은 깃 망토 뱀파이어 교복 · 무릎 기장', 'school uniform, blazer, high-collared cape with red lining, rose brooch, pleated skirt, knee length', 'f2 x1 gf v:v-school-ed'],
        ['ed-2', 'Vampire uniform with a high-collar cape, short', '높은 깃 망토 뱀파이어 교복 · 짧은 기장', 'school uniform, blazer, high-collared cape with red lining, rose brooch, corset vest, pleated miniskirt', 'f2 x2 gf v:v-school-ed'],
        ['ed-m', 'Uniform and high-collar cape', '교복과 높은 깃 망토', 'school uniform, blazer, high-collared cape with red lining, rose brooch, trousers', 'f2 x01 gm'],
        ['ed-m2', 'Open uniform and cape', '풀어 입은 교복과 망토', 'school uniform, open collar, loosened tie, high-collared cape', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Belt', '벨트', 'belt', ''],
      ],
      foundation: [
        ['black', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['knee', 'Kneehighs', '니삭스', 'kneehighs', 'gf'],
      ],
      neckwear: [
        ['ribbon', 'Red ribbon', '빨간 리본', 'red neck ribbon', 'gf'],
        ['tie', 'Red tie', '빨간 넥타이', 'red necktie', ''],
      ],
      outer: [
        ['cardigan', 'Black cardigan', '검은 가디건', 'black cardigan', 'f1'],
      ],
      footwear: [
        ['loafers', 'Loafers', '로퍼', 'loafers', ''],
      ],
      headwear: [
        ['wings', 'Bat wing hair clips', '박쥐 날개 머리핀', 'bat wing hair ornament', ''],
        ['bow', 'Black hair bow', '검은 리본', 'black hair bow', 'gf'],
      ],
      accessories: [
        ['bag', 'School bag with a bat charm', '박쥐 참 책가방', 'school bag with a bat charm', ''],
        ['parasol', 'Black umbrella', '검은 우산', 'black umbrella under the arm', ''],
        ['bats', 'Bats outside the window', '창밖 박쥐', 'bats flying past behind', 'f3 c:animal'],
      ],
      weapon: [
        ['juice', 'Tomato juice carton', '토마토 주스 팩', 'holding a tomato juice carton with a straw', ''],
        ['book', 'Textbook', '교과서', 'holding a textbook', ''],
      ],
      device: [
        ['fang', 'Fang', '덧니', 'fang, smile', ''],
        ['pale', 'Pale', '창백한 얼굴', 'pale skin', ''],
      ],
    },
  }),

  /* ─── V-22 뱀파이어 · 하얀 ─── */
  costume('v-white', 'Vampire · White', '뱀파이어 · 하얀', 'V-22', {
    tag: 'halloween costume, vampire costume, white', tagReal: 'white vampire, halloween night, moonlight',
    colors: ['white', 'ivory', 'silver', 'pearl white', 'crimson'],
    need: { device: 'fang' },
    items: {
      garment: [
        ['hm-f', 'White nightgown and a sheet cape', '흰 잠옷과 홑이불 망토', 'white nightgown, white sheet worn as a cape', 'f0 F0 gf'],
        ['hm-m', 'White shirt and a sheet cape', '흰 셔츠와 홑이불 망토', 'white shirt, white trousers, white sheet worn as a cape', 'f0 F0 gm'],
        ['pt-0', 'White vampire dress, long', '하얀 뱀파이어 원피스 · 긴 기장', 'vampire costume, white lace dress, red ribbon at the throat, silver bat brooch, long sleeves, ankle length', 'f1 F1 x0 gf v:v-white-pt'],
        ['pt-1', 'White vampire dress, knee', '하얀 뱀파이어 원피스 · 무릎 기장', 'vampire costume, white lace dress, red ribbon at the throat, silver bat brooch, short sleeves, knee length', 'f1 F1 x1 gf v:v-white-pt'],
        ['pt-2', 'White vampire dress, short', '하얀 뱀파이어 원피스 · 짧은 기장', 'vampire costume, white lace dress, red ribbon at the throat, silver bat brooch, off-shoulder, short layered skirt', 'f1 F1 x2 gf v:v-white-pt n:low'],
        ['pt-m', 'White vampire coat', '하얀 뱀파이어 코트', 'vampire costume, white coat, red cravat, silver bat brooch, white trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open white shirt and red cravat', '풀어 헤친 흰 셔츠와 빨간 크라바트', 'vampire costume, open white shirt, loose red cravat', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Ivory lace vampire gown, long', '아이보리 레이스 뱀파이어 드레스 · 긴 기장', 'ivory lace gown, silver embroidery, single red rose at the waist, high collar, long sleeves, floor length', 'f2 x0 gf v:v-white-ed n:high'],
        ['ed-1', 'Ivory lace vampire gown, knee', '아이보리 레이스 뱀파이어 드레스 · 무릎 기장', 'ivory lace gown, silver embroidery, single red rose at the waist, square neckline, knee length', 'f2 x1 gf v:v-white-ed'],
        ['ed-2', 'Ivory lace vampire gown, short', '아이보리 레이스 뱀파이어 드레스 · 짧은 기장', 'ivory lace gown, silver embroidery, single red rose at the waist, strapless, high slit', 'f2 x2 gf v:v-white-ed n:low'],
        ['ed-m', 'Ivory tailcoat', '아이보리 연미복', 'ivory tailcoat, silver embroidery, red rose boutonniere, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open ivory tailcoat', '풀어 입은 아이보리 연미복', 'open ivory tailcoat, sheer shirt, red rose boutonniere', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['silver', 'Silver ribbon sash', '은빛 리본 허리끈', 'silver satin ribbon sash', ''],
      ],
      foundation: [
        ['white', 'White lace stockings', '흰 레이스 스타킹', 'white lace stockings', 'gf'],
      ],
      neckwear: [
        ['ribbon', 'Red ribbon choker', '빨간 리본 초커', 'red ribbon choker', ''],
        ['pearls', 'Pearl necklace', '진주 목걸이', 'pearl necklace', ''],
      ],
      outer: [
        ['cape', 'White cape with red lining', '안이 빨간 흰 망토', 'white cape, red lining', 'f1'],
        ['moonlight', 'Cape of moonlight', '달빛 망토', 'cape glowing like moonlight', 'f3'],
      ],
      footwear: [
        ['boots', 'White lace-up boots', '흰 끈 부츠', 'white lace-up boots', ''],
        ['heels', 'Silver heels', '은색 힐', 'silver heels', 'gf'],
      ],
      headwear: [
        ['rose', 'White rose hair ornament', '흰 장미 머리 장식', 'white rose hair ornament', ''],
        ['veil', 'Short lace veil', '짧은 레이스 베일', 'short white lace veil', 'f1 gf'],
      ],
      accessories: [
        ['gloves', 'White lace gloves', '흰 레이스 장갑', 'white lace gloves', ''],
        ['bats', 'White bats', '흰 박쥐', 'white bats fluttering around', 'f3 c:animal'],
      ],
      weapon: [
        ['rose', 'Red rose', '빨간 장미', 'holding a single red rose', ''],
        ['glass', 'Glass of red juice', '빨간 주스 잔', 'holding a glass of red juice', ''],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs', ''],
        ['eyes', 'Red eyes', '붉은 눈', 'red eyes', 'f2'],
      ],
    },
  }),

  /* ─── V-23 뱀파이어 · 나이트 라운지 ─── */
  costume('v-lounge', 'Vampire · Night Lounge', '뱀파이어 · 나이트 라운지', 'V-23', {
    tag: 'halloween costume, vampire costume, nightlife', tagReal: 'vampire, halloween night, neon',
    colors: ['black', 'burgundy', 'crimson', 'midnight blue', 'deep purple'],
    need: { device: 'fang' },
    items: {
      garment: [
        ['hm-f', 'Little black dress and plastic fangs', '검은 원피스와 플라스틱 송곳니', 'little black dress, plastic fangs, red scarf as a cape', 'f0 F0 gf'],
        ['hm-m', 'Black shirt and plastic fangs', '검은 셔츠와 플라스틱 송곳니', 'black dress shirt, black slacks, red scarf as a cape', 'f0 F0 gm'],
        ['pt-0', 'Velvet slip dress with a cape, long', '망토 두른 벨벳 슬립 원피스 · 긴 기장', 'vampire costume, velvet slip dress, short cape, red lining, long sleeves, ankle length', 'f1 F1 x0 gf v:v-lounge-pt'],
        ['pt-1', 'Velvet slip dress with a cape, knee', '망토 두른 벨벳 슬립 원피스 · 무릎 기장', 'vampire costume, velvet slip dress, short cape, red lining, midi length', 'f1 F1 x1 gf v:v-lounge-pt'],
        ['pt-2', 'Velvet slip dress with a cape, short', '망토 두른 벨벳 슬립 원피스 · 짧은 기장', 'vampire costume, velvet slip dress, short cape, red lining, mini length, low back', 'f1 F1 x2 gf v:v-lounge-pt'],
        ['pt-m', 'Velvet blazer and cape', '벨벳 블레이저와 망토', 'vampire costume, velvet blazer, black shirt, short cape', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open shirt and velvet blazer', '풀어 헤친 셔츠와 벨벳 블레이저', 'vampire costume, open black shirt, velvet blazer', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Satin vampire gown, long', '새틴 뱀파이어 드레스 · 긴 기장', 'satin gown, red satin lining cape, bat-shaped clasp, high neck, long sleeves, floor length', 'f2 x0 gf v:v-lounge-ed n:high'],
        ['ed-1', 'Satin vampire gown, knee', '새틴 뱀파이어 드레스 · 무릎 기장', 'satin gown, red satin lining cape, bat-shaped clasp, cowl neck, midi length', 'f2 x1 gf v:v-lounge-ed'],
        ['ed-2', 'Satin vampire gown, short', '새틴 뱀파이어 드레스 · 짧은 기장', 'satin gown, red satin lining cape, bat-shaped clasp, plunging neckline, thigh slit', 'f2 x2 gf v:v-lounge-ed n:low'],
        ['ed-m', 'Satin-lapel tuxedo and cape', '새틴 깃 턱시도와 망토', 'satin lapel tuxedo, red-lined cape, bat-shaped clasp', 'f2 x01 gm'],
        ['ed-m2', 'Open tuxedo and cape', '풀어 입은 턱시도와 망토', 'open tuxedo shirt, loose bow tie, red-lined cape', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Thin gold belt', '얇은 금색 벨트', 'thin gold belt', ''],
      ],
      foundation: [
        ['sheer', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black pantyhose', 'gf'],
        ['seam', 'Back-seam stockings', '뒷선 스타킹', 'back seam stockings', 'x12 gf'],
      ],
      neckwear: [
        ['choker', 'Velvet choker', '벨벳 초커', 'velvet choker', ''],
        ['chain', 'Gold pendant', '금 펜던트', 'gold pendant necklace', ''],
      ],
      outer: [
        ['coat', 'Long black coat', '긴 검은 코트', 'long black coat', 'f1'],
      ],
      footwear: [
        ['heels', 'Stiletto heels', '스틸레토 힐', 'stiletto heels', 'gf'],
        ['chelsea', 'Chelsea boots', '첼시 부츠', 'chelsea boots', ''],
      ],
      headwear: [
        ['hat', 'Fedora with a bat pin', '박쥐 핀 페도라', 'black fedora with a bat pin', 'gm'],
        ['clip', 'Bat hair clip', '박쥐 핀', 'bat hair clip', 'gf'],
      ],
      accessories: [
        ['ring', 'Signet ring', '인장 반지', 'signet ring', ''],
        ['gloves', 'Long black gloves', '긴 검은 장갑', 'long black satin gloves', 'gf'],
        ['mist', 'Red mist', '붉은 안개', 'red mist curling around', 'f3'],
      ],
      weapon: [
        ['wine', 'Wine glass of red juice', '빨간 주스 와인잔', 'holding a wine glass of red juice', ''],
        ['key', 'Hotel key with a bat tag', '박쥐 태그 호텔 열쇠', 'holding a hotel key with a bat tag', ''],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs', ''],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-24 서큐버스 · 클래식 ─── */
  costume('s-classic', 'Succubus · Classic', '서큐버스 · 클래식', 'V-24', {
    tag: 'halloween costume, succubus costume', tagReal: 'succubus costume, halloween night',
    tagM: 'halloween costume, incubus costume', tagRealM: 'incubus costume, halloween night',
    colors: ['black', 'crimson', 'burgundy', 'deep purple', 'red'],
    need: { headwear: '', accessories: 'wings tail' },
    items: {
      garment: [
        ['hm-f', 'Black dress and felt horns', '검은 원피스와 펠트 뿔', 'black dress, felt horns headband, paper bat wings', 'f0 F0 gf'],
        ['hm-m', 'Black shirt and felt horns', '검은 셔츠와 펠트 뿔', 'black shirt, black jeans, felt horns headband', 'f0 F0 gm'],
        ['pt-0', 'Succubus dress, long', '서큐버스 원피스 · 긴 기장', 'succubus costume, black dress, heart-shaped cutout trim, red lining, long sleeves, ankle length', 'f1 F1 x0 gf v:s-classic-pt'],
        ['pt-1', 'Succubus dress, knee', '서큐버스 원피스 · 무릎 기장', 'succubus costume, black dress, heart-shaped cutout trim, red lining, long sleeves, knee length', 'f1 F1 x1 gf v:s-classic-pt'],
        ['pt-2', 'Succubus dress, short', '서큐버스 원피스 · 짧은 기장', 'succubus costume, black dress, heart-shaped cutout trim, red lining, corset bodice, short skirt', 'f1 F1 x2 gf v:s-classic-pt'],
        ['pt-m', 'Incubus vest and shirt', '인큐버스 조끼와 셔츠', 'incubus costume, black vest, red shirt, slacks', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open incubus shirt', '풀어 헤친 인큐버스 셔츠', 'incubus costume, open red shirt, black slacks, harness', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Leather succubus dress, long', '가죽 서큐버스 원피스 · 긴 기장', 'succubus costume, black leather dress, red heart buckles, lace-up sides, high collar, long sleeves, long skirt', 'f2 x0 gf v:s-classic-ed n:high'],
        ['ed-1', 'Leather succubus dress, knee', '가죽 서큐버스 원피스 · 무릎 기장', 'succubus costume, black leather dress, red heart buckles, lace-up sides, square neckline, knee length', 'f2 x1 gf v:s-classic-ed'],
        ['ed-2', 'Leather succubus dress, short', '가죽 서큐버스 원피스 · 짧은 기장', 'succubus costume, black leather dress, red heart buckles, lace-up sides, strapless corset bodice, thigh slit', 'f2 x2 gf v:s-classic-ed n:low'],
        ['ed-m', 'Leather incubus coat', '가죽 인큐버스 코트', 'incubus costume, black leather coat, red lining, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open leather coat and harness', '풀어 입은 가죽 코트와 하네스', 'incubus costume, open leather coat, harness', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['corset', 'Black corset', '검은 코르셋', 'black corset', 'x12 gf'],
        ['heart', 'Heart buckle belt', '하트 버클 벨트', 'belt with a heart buckle', ''],
      ],
      foundation: [
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black tights', 'x12 gf'],
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'x0 gf'],
      ],
      neckwear: [
        ['heart', 'Heart choker', '하트 초커', 'heart choker', ''],
        ['chain', 'Velvet choker', '벨벳 초커', 'black velvet choker', ''],
      ],
      outer: [
        ['cape', 'Red-lined cape', '안이 빨간 망토', 'black cape, red lining', 'f1'],
      ],
      footwear: [
        ['heels', 'Platform heels', '플랫폼 힐', 'platform heels', 'gf'],
        ['boots', 'Black boots', '검은 부츠', 'black boots', ''],
      ],
      headwear: [
        ['horns', 'Curled horn headband', '말린 뿔 머리띠', 'curled horns headband', ''],
        ['small', 'Small horn clips', '작은 뿔 핀', 'small horn hair clips', ''],
      ],
      accessories: [
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings costume on the back', ''],
        ['tail', 'Heart-tipped tail', '하트 끝 꼬리', 'clip-on costume tail with a heart tip', ''],
        ['hearts', 'Pink hearts floating', '떠다니는 분홍 하트', 'small pink hearts floating around', 'f3'],
      ],
      weapon: [
        ['trident', 'Toy trident', '장난감 삼지창', 'holding a toy trident', 'F1'],
        ['rose', 'Black rose', '검은 장미', 'holding a black rose', ''],
        ['apple', 'Red apple', '빨간 사과', 'holding a red apple', ''],
      ],
      device: [
        ['heart', 'Heart cheek paint', '볼의 하트 분장', 'small heart painted on the cheek', ''],
        ['wink', 'Wink', '윙크', 'one eye closed, smug', ''],
        ['eyes', 'Heart-shaped pupils', '하트 눈동자', 'heart-shaped pupils', 'f3'],
      ],
    },
  }),

  /* ─── V-25 서큐버스 · 핑크 ─── */
  costume('s-pink', 'Succubus · Pink', '서큐버스 · 핑크', 'V-25', {
    tag: 'halloween costume, succubus costume, pastel', tagReal: 'succubus costume, pastel, halloween night',
    tagM: 'halloween costume, incubus costume, pastel', tagRealM: 'incubus costume, pastel, halloween night',
    colors: ['pastel pink', 'hot pink', 'lavender', 'white', 'black'],
    need: { headwear: '', accessories: 'wings tail' },
    items: {
      garment: [
        ['hm-f', 'Pink dress and felt horns', '분홍 원피스와 펠트 뿔', 'pink dress, felt horns headband, heart stickers', 'f0 F0 gf'],
        ['hm-m', 'Pink hoodie and felt horns', '분홍 후드티와 펠트 뿔', 'pink hoodie, felt horns on the hood, shorts', 'f0 F0 gm'],
        ['pt-0', 'Pink succubus dress, long', '핑크 서큐버스 원피스 · 긴 기장', 'succubus costume, pink frilled dress, heart-shaped buttons, black ribbon trim, long puff sleeves, ankle length', 'f1 F1 x0 gf v:s-pink-pt'],
        ['pt-1', 'Pink succubus dress, knee', '핑크 서큐버스 원피스 · 무릎 기장', 'succubus costume, pink frilled dress, heart-shaped buttons, black ribbon trim, puff short sleeves, knee length', 'f1 F1 x1 gf v:s-pink-pt'],
        ['pt-2', 'Pink succubus dress, short', '핑크 서큐버스 원피스 · 짧은 기장', 'succubus costume, pink frilled dress, heart-shaped buttons, black ribbon trim, off-shoulder, short frilled skirt', 'f1 F1 x2 gf v:s-pink-pt n:low'],
        ['pt-m', 'Pink incubus hoodie', '핑크 인큐버스 후드', 'incubus costume, pink hoodie with horns on the hood, heart print, shorts', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless pink incubus hoodie', '민소매 핑크 인큐버스 후드', 'incubus costume, sleeveless pink hoodie, heart print, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Heart-print succubus dress, long', '하트 무늬 서큐버스 원피스 · 긴 기장', 'succubus costume, heart print chiffon dress, layered pink tulle, black lace, long sleeves, long skirt', 'f2 x0 gf v:s-pink-ed'],
        ['ed-1', 'Heart-print succubus dress, knee', '하트 무늬 서큐버스 원피스 · 무릎 기장', 'succubus costume, heart print chiffon dress, layered pink tulle, black lace, puff sleeves, knee length', 'f2 x1 gf v:s-pink-ed'],
        ['ed-2', 'Heart-print succubus dress, short', '하트 무늬 서큐버스 원피스 · 짧은 기장', 'succubus costume, heart print chiffon dress, layered pink tulle, black lace, corset bodice, short tulle skirt', 'f2 x2 gf v:s-pink-ed'],
        ['ed-m', 'Pink incubus jacket', '핑크 인큐버스 재킷', 'incubus costume, pink cropped jacket, heart buttons, slacks', 'f2 x01 gm'],
        ['ed-m2', 'Open pink incubus jacket', '풀어 입은 핑크 인큐버스 재킷', 'incubus costume, open pink jacket, black tank top', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Heart bow', '하트 리본', 'heart-shaped bow at the back', 'gf'],
      ],
      foundation: [
        ['heart', 'Heart-print thighhighs', '하트 무늬 니삭스', 'heart print thighhighs', 'gf'],
        ['frill', 'Frilled socks', '프릴 양말', 'frilled socks', 'gf'],
      ],
      neckwear: [
        ['heart', 'Heart lock choker', '하트 자물쇠 초커', 'heart padlock choker', ''],
      ],
      outer: [
        ['cardigan', 'Fluffy pink cardigan', '복슬한 분홍 가디건', 'fluffy pink cardigan', 'f1'],
      ],
      footwear: [
        ['mary', 'Pink platform mary janes', '분홍 플랫폼 메리제인', 'pink platform mary janes', 'gf'],
        ['sneakers', 'Pink sneakers', '분홍 운동화', 'pink sneakers', ''],
      ],
      headwear: [
        ['horns', 'Pink horn clips', '분홍 뿔 핀', 'small pink horn hair clips', ''],
        ['bow', 'Horns with bows', '리본 단 뿔', 'horns headband with bows', ''],
      ],
      accessories: [
        ['wings', 'Pink bat wings', '분홍 박쥐 날개', 'small pink bat wings costume on the back', ''],
        ['tail', 'Heart-tipped tail with a bow', '리본 단 하트 꼬리', 'clip-on costume tail with a heart tip and a bow', ''],
        ['hearts', 'Heart bubbles', '하트 비눗방울', 'heart-shaped bubbles floating around', 'f3'],
      ],
      weapon: [
        ['lolli', 'Heart lollipop', '하트 막대사탕', 'holding a heart lollipop', ''],
        ['letter', 'Love letter', '러브레터', 'holding a love letter with a heart seal', ''],
      ],
      device: [
        ['heart', 'Heart stickers', '하트 스티커', 'heart stickers on the cheeks', ''],
        ['fang', 'Fang', '덧니', 'fang, smile', ''],
      ],
    },
  }),

  /* ─── V-26 서큐버스 · 오피스 ─── */
  costume('s-office', 'Succubus · Office', '서큐버스 · 오피스', 'V-26', {
    tag: 'halloween costume, succubus costume, office', tagReal: 'succubus costume, office, halloween night',
    tagM: 'halloween costume, incubus costume, office', tagRealM: 'incubus costume, office, halloween night',
    colors: ['black', 'burgundy', 'charcoal', 'crimson', 'navy'],
    need: { headwear: '', accessories: 'wings tail' },
    items: {
      garment: [
        ['hm-f', 'Office blouse and felt horns', '오피스 블라우스와 펠트 뿔', 'blouse, pencil skirt, felt horns headband', 'f0 F0 gf'],
        ['hm-m', 'Office shirt and felt horns', '오피스 셔츠와 펠트 뿔', 'dress shirt, slacks, felt horns headband', 'f0 F0 gm'],
        ['pt-0', 'Succubus office set, long', '서큐버스 오피스 차림 · 긴 기장', 'succubus costume, black blouse, red heart brooch, pencil skirt, long sleeves, ankle-length skirt', 'f1 F1 x0 gf v:s-office-pt'],
        ['pt-1', 'Succubus office set, knee', '서큐버스 오피스 차림 · 무릎 기장', 'succubus costume, black blouse, red heart brooch, pencil skirt, long sleeves, knee-length skirt', 'f1 F1 x1 gf v:s-office-pt'],
        ['pt-2', 'Succubus office set, short', '서큐버스 오피스 차림 · 짧은 기장', 'succubus costume, black blouse, red heart brooch, pencil skirt, sleeveless blouse, pencil miniskirt', 'f1 F1 x2 gf v:s-office-pt'],
        ['pt-m', 'Incubus office shirt', '인큐버스 오피스 셔츠', 'incubus costume, black shirt, red tie, slacks', 'f1 F1 x01 gm'],
        ['pt-m2', 'Loosened incubus shirt', '풀어 입은 인큐버스 셔츠', 'incubus costume, unbuttoned black shirt, loosened red tie, slacks', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Red-lined succubus suit, long', '안이 빨간 서큐버스 정장 · 긴 기장', 'succubus costume, tailored black suit, red lining, heart cufflinks, trousers', 'f2 x0 gf v:s-office-ed'],
        ['ed-1', 'Red-lined succubus suit, knee', '안이 빨간 서큐버스 정장 · 무릎 기장', 'succubus costume, tailored black suit, red lining, heart cufflinks, pencil skirt, knee length', 'f2 x1 gf v:s-office-ed'],
        ['ed-2', 'Red-lined succubus suit, short', '안이 빨간 서큐버스 정장 · 짧은 기장', 'succubus costume, tailored black suit, red lining, heart cufflinks, blazer dress, mini length', 'f2 x2 gf v:s-office-ed'],
        ['ed-m', 'Red-lined incubus suit', '안이 빨간 인큐버스 정장', 'incubus costume, tailored black suit, red lining, heart cufflinks', 'f2 x01 gm'],
        ['ed-m2', 'Open incubus suit', '풀어 입은 인큐버스 정장', 'incubus costume, black suit, open shirt, no tie', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Heart buckle belt', '하트 버클 벨트', 'thin belt with a heart buckle', ''],
      ],
      foundation: [
        ['sheer', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black pantyhose', 'gf'],
        ['seam', 'Back-seam stockings', '뒷선 스타킹', 'back seam stockings', 'x12 gf'],
      ],
      neckwear: [
        ['lanyard', 'ID lanyard with a heart', '하트 사원증', 'id card lanyard with a heart charm', ''],
        ['tie', 'Red tie', '빨간 넥타이', 'red necktie', 'gm'],
      ],
      outer: [
        ['trench', 'Black trench coat', '검은 트렌치코트', 'black trench coat', 'f1'],
      ],
      footwear: [
        ['pumps', 'Red pumps', '빨간 펌프스', 'red pumps', 'gf'],
        ['oxford', 'Oxford shoes', '옥스퍼드 구두', 'oxford shoes', ''],
      ],
      headwear: [
        ['horns', 'Small horn clips', '작은 뿔 핀', 'small horn hair clips', ''],
        ['glasses', 'Red-framed glasses', '빨간 테 안경', 'red-framed eyewear', ''],
      ],
      accessories: [
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings costume on the back', ''],
        ['tail', 'Heart-tipped tail', '하트 끝 꼬리', 'clip-on costume tail with a heart tip', ''],
        ['contract', 'Contract glowing', '빛나는 계약서', 'glowing contract floating beside', 'f3'],
      ],
      weapon: [
        ['contract', 'Contract and pen', '계약서와 펜', 'holding a contract and a fountain pen', ''],
        ['coffee', 'Coffee', '커피', 'holding a coffee cup', ''],
      ],
      device: [
        ['heart', 'Heart cheek paint', '볼의 하트 분장', 'small heart painted on the cheek', ''],
        ['smirk', 'Smirk', '비웃는 미소', 'smirk', ''],
      ],
    },
  }),

  /* ─── V-27 서큐버스 · 꿈 ─── */
  costume('s-dream', 'Succubus · Dream', '서큐버스 · 꿈', 'V-27', {
    tag: 'halloween costume, succubus costume, dreamy', tagReal: 'succubus costume, dreamy, halloween night, starry',
    tagM: 'halloween costume, incubus costume, dreamy', tagRealM: 'incubus costume, dreamy, halloween night, starry',
    colors: ['lavender', 'lilac', 'midnight blue', 'pastel pink', 'silver'],
    need: { headwear: '', accessories: 'wings' },
    items: {
      garment: [
        ['hm-f', 'Lavender nightgown and felt horns', '라벤더 잠옷과 펠트 뿔', 'lavender nightgown, felt horns headband, star stickers', 'f0 F0 gf'],
        ['hm-m', 'Lavender pajamas and felt horns', '라벤더 잠옷과 펠트 뿔', 'lavender pajamas, felt horns headband', 'f0 F0 gm'],
        ['pt-0', 'Dream succubus dress, long', '꿈의 서큐버스 원피스 · 긴 기장', 'succubus costume, sheer lavender layers over a slip dress, moon and star embroidery, long sleeves, ankle length', 'f1 F1 x0 gf v:s-dream-pt'],
        ['pt-1', 'Dream succubus dress, knee', '꿈의 서큐버스 원피스 · 무릎 기장', 'succubus costume, sheer lavender layers over a slip dress, moon and star embroidery, short sleeves, knee length', 'f1 F1 x1 gf v:s-dream-pt'],
        ['pt-2', 'Dream succubus dress, short', '꿈의 서큐버스 원피스 · 짧은 기장', 'succubus costume, sheer lavender layers over a slip dress, moon and star embroidery, off-shoulder, short layered skirt', 'f1 F1 x2 gf v:s-dream-pt n:low'],
        ['pt-m', 'Dream incubus robe', '꿈의 인큐버스 로브', 'incubus costume, lavender robe, moon and star embroidery, slacks', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open dream robe', '풀어 입은 꿈의 로브', 'incubus costume, open lavender robe, sheer shirt', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Starry chiffon succubus gown, long', '별빛 시폰 서큐버스 드레스 · 긴 기장', 'succubus costume, starry chiffon gown, pillow-soft ruffles, crescent moon clasp, high neck, long sleeves, floor length', 'f2 x0 gf v:s-dream-ed n:high'],
        ['ed-1', 'Starry chiffon succubus gown, knee', '별빛 시폰 서큐버스 드레스 · 무릎 기장', 'succubus costume, starry chiffon gown, pillow-soft ruffles, crescent moon clasp, cap sleeves, knee length', 'f2 x1 gf v:s-dream-ed'],
        ['ed-2', 'Starry chiffon succubus gown, short', '별빛 시폰 서큐버스 드레스 · 짧은 기장', 'succubus costume, starry chiffon gown, pillow-soft ruffles, crescent moon clasp, strapless, short layered skirt', 'f2 x2 gf v:s-dream-ed n:low'],
        ['ed-m', 'Starry incubus coat', '별빛 인큐버스 코트', 'incubus costume, starry long coat, crescent moon clasp, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open starry coat', '풀어 입은 별빛 코트', 'incubus costume, open starry coat, sheer shirt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['sash', 'Ribbon sash', '리본 허리끈', 'satin ribbon sash', ''],
      ],
      foundation: [
        ['sheer', 'Sheer lilac tights', '비치는 라일락 타이츠', 'sheer lilac pantyhose', 'gf'],
        ['socks', 'Fluffy socks', '복슬한 양말', 'fluffy socks', ''],
      ],
      neckwear: [
        ['moon', 'Moon choker', '달 초커', 'crescent moon choker', ''],
      ],
      outer: [
        ['robe', 'Sheer robe', '비치는 가운', 'sheer lavender robe', 'f1'],
      ],
      footwear: [
        ['slippers', 'Fluffy slippers', '복슬한 슬리퍼', 'fluffy slippers', ''],
        ['barefoot', 'Floating barefoot', '맨발로 떠 있음', 'barefoot, floating', 'f3'],
      ],
      headwear: [
        ['horns', 'Pearl horns', '진주 뿔', 'pearl-white horns headband', ''],
        ['mask', 'Sleep mask on the forehead', '이마에 올린 수면안대', 'sleep mask pushed up on the forehead', ''],
      ],
      accessories: [
        ['wings', 'Sheer bat wings', '비치는 박쥐 날개', 'sheer bat wings costume on the back', ''],
        ['pillow', 'Heart pillow', '하트 베개', 'heart-shaped pillow', ''],
        ['sheep', 'Sheep floating by', '떠다니는 양', 'little dream sheep floating around', 'f3'],
      ],
      weapon: [
        ['pillow', 'Hugging a pillow', '베개 껴안기', 'hugging a pillow', ''],
        ['lantern', 'Dream lantern', '꿈 등불', 'holding a small lantern with a star inside', ''],
      ],
      device: [
        ['sleepy', 'Sleepy', '졸린 눈', 'sleepy', ''],
        ['stars', 'Star stickers', '별 스티커', 'star stickers under the eyes', ''],
      ],
    },
  }),

  /* ─── V-28 프랑켄슈타인 · 실험실 조수 ─── */
  costume('f-assistant', 'Frankenstein · Lab Assistant', '프랑켄슈타인 · 실험실 조수', 'V-28', {
    tag: 'halloween costume, lab coat, frankenstein costume', tagReal: 'mad lab assistant, halloween night',
    colors: ['white', 'mint', 'grey', 'black', 'lime green'],
    items: {
      garment: [
        ['hm-f', 'Big shirt worn as a lab coat', '실험 가운처럼 입은 큰 셔츠', 'oversized white shirt worn as a lab coat, skirt, paper bolts', 'f0 F0 gf'],
        ['hm-m', 'Big shirt worn as a lab coat, jeans', '실험 가운처럼 입은 큰 셔츠, 청바지', 'oversized white shirt worn as a lab coat, jeans, paper bolts', 'f0 F0 gm'],
        ['pt-0', 'Lab assistant outfit, long', '실험실 조수 차림 · 긴 기장', 'lab assistant, oversized lab coat, stitched patches, bolt pins, long dress underneath', 'f1 F1 x0 gf v:f-assistant-pt'],
        ['pt-1', 'Lab assistant outfit, knee', '실험실 조수 차림 · 무릎 기장', 'lab assistant, oversized lab coat, stitched patches, bolt pins, knee-length dress underneath', 'f1 F1 x1 gf v:f-assistant-pt'],
        ['pt-2', 'Lab assistant outfit, short', '실험실 조수 차림 · 짧은 기장', 'lab assistant, oversized lab coat, stitched patches, bolt pins, short dress underneath', 'f1 F1 x2 gf v:f-assistant-pt'],
        ['pt-m', 'Lab assistant coat and trousers', '조수 가운과 바지', 'lab assistant, oversized lab coat, stitched patches, bolt pins, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open lab coat and tank top', '풀어 입은 가운과 민소매', 'lab assistant, open lab coat, tank top, stitched patches', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Stitched lab dress, long', '꿰맨 실험실 원피스 · 긴 기장', 'lab assistant, mint dress with stitched seams, cropped lab coat, rubber apron, long sleeves, ankle length', 'f2 x0 gf v:f-assistant-ed'],
        ['ed-1', 'Stitched lab dress, knee', '꿰맨 실험실 원피스 · 무릎 기장', 'lab assistant, mint dress with stitched seams, cropped lab coat, rubber apron, short sleeves, knee length', 'f2 x1 gf v:f-assistant-ed'],
        ['ed-2', 'Stitched lab dress, short', '꿰맨 실험실 원피스 · 짧은 기장', 'lab assistant, mint dress with stitched seams, cropped lab coat, rubber apron, sleeveless, short skirt', 'f2 x2 gf v:f-assistant-ed'],
        ['ed-m', 'Lab coat and rubber apron', '실험 가운과 고무 앞치마', 'lab assistant, long lab coat, rubber apron, rubber gloves', 'f2 x01 gm'],
        ['ed-m2', 'Open lab coat and rubber apron', '풀어 입은 가운과 고무 앞치마', 'lab assistant, open lab coat, rubber apron, sleeveless shirt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['tools', 'Tool belt', '공구 벨트', 'tool belt with screwdrivers', ''],
      ],
      foundation: [
        ['striped', 'Striped socks', '줄무늬 양말', 'striped socks', ''],
        ['mismatch', 'Mismatched socks', '짝짝이 양말', 'mismatched socks', ''],
      ],
      neckwear: [
        ['bolt', 'Bolt necklace', '나사 목걸이', 'bolt pendant', ''],
      ],
      outer: [],
      footwear: [
        ['rubber', 'Rubber boots', '고무장화', 'rubber boots', ''],
        ['sneakers', 'Sneakers', '운동화', 'sneakers', ''],
      ],
      headwear: [
        ['goggles', 'Goggles on the head', '머리에 올린 고글', 'goggles on head', ''],
        ['bolts', 'Bolt hair clips', '나사 머리핀', 'bolt hair clips', ''],
      ],
      accessories: [
        ['gloves', 'Rubber gloves', '고무장갑', 'rubber gloves', ''],
        ['glasses', 'Thick glasses', '두꺼운 안경', 'thick round glasses', ''],
        ['spark', 'Sparks from the hair', '머리에서 튀는 불꽃', 'small electric sparks crackling in the hair', 'f3'],
      ],
      weapon: [
        ['flask', 'Bubbling flask', '끓는 플라스크', 'holding a bubbling green flask', ''],
        ['clipboard', 'Clipboard', '클립보드', 'holding a clipboard', ''],
        ['wrench', 'Wrench', '렌치', 'holding a wrench', ''],
      ],
      device: [
        ['stitch', 'Stitches on the cheek', '볼 바느질 자국', 'stitches painted on the cheek', ''],
        ['soot', 'Soot smudge', '그을음', 'soot smudge on the face', ''],
      ],
    },
  }),

  /* ─── V-29 프랑켄슈타인 · 미친 박사 ─── */
  costume('f-doctor', 'Frankenstein · Mad Doctor', '프랑켄슈타인 · 미친 박사', 'V-29', {
    tag: 'halloween costume, mad scientist', tagReal: 'mad scientist, halloween night, lightning',
    colors: ['white', 'black', 'charcoal', 'burgundy', 'brass'],
    items: {
      garment: [
        ['hm-f', 'Bathrobe as a lab coat', '실험 가운 대신 목욕 가운', 'white bathrobe worn as a lab coat, skirt', 'f0 F0 gf'],
        ['hm-m', 'Bathrobe as a lab coat, trousers', '실험 가운 대신 목욕 가운, 바지', 'white bathrobe worn as a lab coat, trousers', 'f0 F0 gm'],
        ['pt-0', 'Mad scientist coat dress, long', '미친 과학자 가운 원피스 · 긴 기장', 'mad scientist, long lab coat over a dress, bow tie, pocket protector, long dress, ankle length', 'f1 F1 x0 gf v:f-doctor-pt'],
        ['pt-1', 'Mad scientist coat dress, knee', '미친 과학자 가운 원피스 · 무릎 기장', 'mad scientist, long lab coat over a dress, bow tie, pocket protector, dress, knee length', 'f1 F1 x1 gf v:f-doctor-pt'],
        ['pt-2', 'Mad scientist coat dress, short', '미친 과학자 가운 원피스 · 짧은 기장', 'mad scientist, long lab coat over a dress, bow tie, pocket protector, short dress', 'f1 F1 x2 gf v:f-doctor-pt'],
        ['pt-m', 'Mad scientist coat and vest', '미친 과학자 가운과 조끼', 'mad scientist, long lab coat, waistcoat, bow tie, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open lab coat and suspenders', '풀어 입은 가운과 멜빵', 'mad scientist, open lab coat, rolled sleeves, suspenders', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Victorian lab coat dress, long', '빅토리안 실험복 원피스 · 긴 기장', 'mad scientist, victorian lab coat, high collar blouse, brass buttons, leather apron, long skirt', 'f2 x0 gf v:f-doctor-ed n:high'],
        ['ed-1', 'Victorian lab coat dress, knee', '빅토리안 실험복 원피스 · 무릎 기장', 'mad scientist, victorian lab coat, high collar blouse, brass buttons, leather apron, knee-length skirt', 'f2 x1 gf v:f-doctor-ed n:high'],
        ['ed-2', 'Victorian lab coat dress, short', '빅토리안 실험복 원피스 · 짧은 기장', 'mad scientist, victorian lab coat, high collar blouse, brass buttons, leather apron, corset, short skirt', 'f2 x2 gf v:f-doctor-ed n:high'],
        ['ed-m', 'Victorian lab coat', '빅토리안 실험 가운', 'mad scientist, victorian lab coat, high collar, brass buttons, leather apron', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open victorian lab coat', '풀어 입은 빅토리안 실험 가운', 'mad scientist, open victorian lab coat, leather apron, sleeveless shirt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['apron', 'Leather apron', '가죽 앞치마', 'leather apron', ''],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
      ],
      neckwear: [
        ['bow', 'Crooked bow tie', '삐뚤어진 보타이', 'crooked bow tie', ''],
      ],
      outer: [],
      footwear: [
        ['oxford', 'Scuffed oxfords', '닳은 옥스퍼드', 'scuffed oxford shoes', ''],
        ['boots', 'Lace-up boots', '끈 부츠', 'lace-up boots', ''],
      ],
      headwear: [
        ['goggles', 'Brass goggles', '황동 고글', 'brass goggles on head', ''],
        ['cap', 'Surgical cap', '수술 모자', 'surgical cap', 'f1'],
      ],
      accessories: [
        ['gloves', 'Long rubber gloves', '긴 고무장갑', 'long black rubber gloves', ''],
        ['monocle', 'Monocle', '외알 안경', 'monocle', 'f1'],
        ['lightning', 'Lightning behind', '등 뒤 번개', 'lightning striking behind', 'f3'],
      ],
      weapon: [
        ['lever', 'Pulling a lever', '레버 당기기', 'pulling a big lever', ''],
        ['jar', 'Jar of glowing liquid', '빛나는 액체 병', 'holding a jar of glowing liquid', ''],
        ['tesla', 'Small tesla coil', '작은 테슬라 코일', 'holding a small crackling tesla coil', 'f2'],
      ],
      device: [
        ['soot', 'Soot on the face', '얼굴 그을음', 'soot on the face', ''],
        ['grin', 'Wild grin', '광기 어린 웃음', 'crazy grin', ''],
      ],
    },
  }),

  /* ─── V-30 프랑켄슈타인 · 번개 ─── */
  costume('f-electric', 'Frankenstein · Electric', '프랑켄슈타인 · 번개', 'V-30', {
    tag: 'halloween costume, frankenstein costume, lightning', tagReal: 'reanimated, halloween night, electricity',
    colors: ['black', 'lime green', 'electric blue', 'grey', 'white'],
    items: {
      garment: [
        ['hm-f', 'Grey dress with foil lightning', '은박 번개 단 회색 원피스', 'grey dress, foil lightning bolts taped on, paper bolts', 'f0 F0 gf'],
        ['hm-m', 'Grey hoodie with foil lightning', '은박 번개 단 회색 후드티', 'grey hoodie, foil lightning bolts taped on', 'f0 F0 gm'],
        ['pt-0', 'Lightning-stitched dress, long', '번개 바느질 원피스 · 긴 기장', 'frankenstein costume, black dress with lightning-shaped stitching, bolt buttons, long sleeves, ankle length', 'f1 F1 x0 gf v:f-electric-pt'],
        ['pt-1', 'Lightning-stitched dress, knee', '번개 바느질 원피스 · 무릎 기장', 'frankenstein costume, black dress with lightning-shaped stitching, bolt buttons, short sleeves, knee length', 'f1 F1 x1 gf v:f-electric-pt'],
        ['pt-2', 'Lightning-stitched dress, short', '번개 바느질 원피스 · 짧은 기장', 'frankenstein costume, black dress with lightning-shaped stitching, bolt buttons, off-shoulder, short skirt', 'f1 F1 x2 gf v:f-electric-pt n:low'],
        ['pt-m', 'Lightning-stitched jacket', '번개 바느질 재킷', 'frankenstein costume, black jacket with lightning-shaped stitching, bolt buttons, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless lightning vest', '민소매 번개 조끼', 'frankenstein costume, sleeveless vest with lightning stitching, harness', 'f1 F1 x2 gm'],
        ['ed-0', 'Glowing seam dress, long', '빛나는 솔기 원피스 · 긴 기장', 'black dress, seams glowing green like electricity, metal bolts, wire trim, high collar, long sleeves, long skirt', 'f2 x0 gf v:f-electric-ed n:high'],
        ['ed-1', 'Glowing seam dress, knee', '빛나는 솔기 원피스 · 무릎 기장', 'black dress, seams glowing green like electricity, metal bolts, wire trim, square neckline, knee length', 'f2 x1 gf v:f-electric-ed'],
        ['ed-2', 'Glowing seam dress, short', '빛나는 솔기 원피스 · 짧은 기장', 'black dress, seams glowing green like electricity, metal bolts, wire trim, corset bodice, short skirt', 'f2 x2 gf v:f-electric-ed'],
        ['ed-m', 'Glowing seam coat', '빛나는 솔기 코트', 'black coat, seams glowing green like electricity, metal bolts, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open glowing seam coat', '풀어 입은 빛나는 솔기 코트', 'open black coat, seams glowing green, metal bolts, harness', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['wire', 'Wire belt', '전선 벨트', 'belt of coiled wire', ''],
      ],
      foundation: [
        ['striped', 'Black and green striped tights', '검정 초록 줄무늬 타이츠', 'black and green striped tights', 'gf'],
      ],
      neckwear: [
        ['bolt', 'Neck bolts', '목 나사', 'costume bolts on the neck', ''],
        ['collar', 'Metal collar', '금속 깃', 'metal collar', ''],
      ],
      outer: [],
      footwear: [
        ['platform', 'Platform boots', '플랫폼 부츠', 'heavy platform boots', ''],
      ],
      headwear: [
        ['bolts', 'Bolt headband', '나사 머리띠', 'headband with bolts on both sides', ''],
        ['streak', 'Lightning hair clips', '번개 머리핀', 'lightning bolt hair clips', ''],
      ],
      accessories: [
        ['cuffs', 'Metal cuffs', '금속 팔찌', 'metal cuffs', ''],
        ['arcs', 'Electric arcs', '전기 불꽃', 'electric arcs crackling around', 'f3'],
      ],
      weapon: [
        ['plug', 'Plug cord', '전원 플러그', 'holding a plug cord', ''],
        ['bulb', 'Glowing light bulb', '빛나는 전구', 'holding a glowing light bulb', 'f2'],
      ],
      device: [
        ['stitch', 'Stitch scar paint', '바느질 흉터 분장', 'stitch scars painted on the face', ''],
        ['green', 'Pale green makeup', '연두 분장', 'pale green face paint', ''],
        ['eyes', 'Glowing green eyes', '초록으로 빛나는 눈', 'glowing green eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-31 프랑켄슈타인 · 패치워크 스트리트 ─── */
  costume('f-street', 'Frankenstein · Patchwork Street', '프랑켄슈타인 · 패치워크 스트리트', 'V-31', {
    tag: 'frankenstein costume, patchwork, streetwear, halloween', tagReal: 'patchwork, streetwear, halloween night',
    colors: ['grey', 'olive', 'black', 'lime green', 'denim blue'],
    items: {
      garment: [
        ['hm-f', 'Patched denim and paper bolts', '덧댄 청바지와 종이 나사', 'patched denim jacket, skirt, paper bolts on a headband', 'f0 F0 gf'],
        ['hm-m', 'Patched denim and paper bolts, jeans', '덧댄 청재킷과 종이 나사', 'patched denim jacket, jeans, paper bolts on a headband', 'f0 F0 gm'],
        ['pt-0', 'Patchwork hoodie outfit, long', '패치워크 후드 차림 · 긴 기장', 'patchwork hoodie, mismatched fabric panels, visible stitching, long cargo skirt', 'f1 F1 x0 gf v:f-street-pt'],
        ['pt-1', 'Patchwork hoodie outfit, knee', '패치워크 후드 차림 · 무릎 기장', 'patchwork hoodie, mismatched fabric panels, visible stitching, knee-length skirt', 'f1 F1 x1 gf v:f-street-pt'],
        ['pt-2', 'Patchwork hoodie outfit, short', '패치워크 후드 차림 · 짧은 기장', 'patchwork hoodie, mismatched fabric panels, visible stitching, cropped hoodie, miniskirt', 'f1 F1 x2 gf v:f-street-pt'],
        ['pt-m', 'Patchwork hoodie and cargo pants', '패치워크 후드와 카고 바지', 'patchwork hoodie, mismatched fabric panels, visible stitching, cargo pants', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless patchwork hoodie', '민소매 패치워크 후드', 'sleeveless patchwork hoodie, visible stitching, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Patchwork denim dress, long', '패치워크 데님 원피스 · 긴 기장', 'patchwork denim dress, contrast stitching, bolt studs, long sleeves, ankle length', 'f2 x0 gf v:f-street-ed'],
        ['ed-1', 'Patchwork denim dress, knee', '패치워크 데님 원피스 · 무릎 기장', 'patchwork denim dress, contrast stitching, bolt studs, short sleeves, knee length', 'f2 x1 gf v:f-street-ed'],
        ['ed-2', 'Patchwork denim dress, short', '패치워크 데님 원피스 · 짧은 기장', 'patchwork denim dress, contrast stitching, bolt studs, off-shoulder, mini length', 'f2 x2 gf v:f-street-ed n:low'],
        ['ed-m', 'Patchwork denim jacket set', '패치워크 데님 재킷', 'patchwork denim jacket, contrast stitching, bolt studs, wide jeans', 'f2 x01 gm'],
        ['ed-m2', 'Open patchwork jacket', '풀어 입은 패치워크 재킷', 'open patchwork denim jacket, tank top, wide jeans', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['chain', 'Studded belt', '징 벨트', 'studded belt', ''],
      ],
      foundation: [
        ['mismatch', 'Mismatched socks', '짝짝이 양말', 'mismatched socks', ''],
        ['torn', 'Torn tights', '찢긴 타이츠', 'torn tights', 'x12 gf'],
      ],
      neckwear: [
        ['chain', 'Pendant necklace', '펜던트 목걸이', 'pendant necklace', ''],
      ],
      outer: [
        ['bomber', 'Patched bomber jacket', '덧댄 항공 점퍼', 'patched bomber jacket', 'f1'],
      ],
      footwear: [
        ['chunky', 'Chunky sneakers', '두꺼운 운동화', 'chunky sneakers', ''],
        ['boots', 'Combat boots', '컴뱃 부츠', 'combat boots', ''],
      ],
      headwear: [
        ['beanie', 'Beanie with bolts', '나사 단 비니', 'beanie with bolts on the sides', ''],
        ['bolts', 'Bolt hair clips', '나사 머리핀', 'bolt hair clips', ''],
      ],
      accessories: [
        ['pins', 'Safety pins', '옷핀', 'safety pins along the seams', ''],
        ['bag', 'Stitched crossbody bag', '꿰맨 크로스백', 'stitched crossbody bag', ''],
      ],
      weapon: [
        ['boba', 'Green bubble tea', '초록 버블티', 'holding a green bubble tea', ''],
        ['skate', 'Skateboard', '스케이트보드', 'holding a skateboard', ''],
      ],
      device: [
        ['stitch', 'Stitch stickers', '바느질 스티커', 'stitch stickers on the cheek', ''],
        ['bandaid', 'Bandaid', '반창고', 'bandaid on cheek', ''],
      ],
    },
  }),

  /* ─── V-32 고양이 · 마녀의 사역마 ─── */
  costume('c-familiar', 'Cat · Witch\'s Familiar', '고양이 · 마녀의 사역마', 'V-32', {
    tag: 'halloween costume, black cat costume, fake animal ears, witch', tagReal: 'black cat costume, witch familiar, halloween night',
    colors: ['black', 'deep purple', 'midnight blue', 'pumpkin orange', 'charcoal'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black skirt and cat ears', '검은 치마와 고양이 귀', 'black sweater, black skirt, felt cat ears, paper bell', 'f0 F0 gf'],
        ['hm-m', 'Black sweater and cat ears', '검은 스웨터와 고양이 귀', 'black sweater, black jeans, felt cat ears', 'f0 F0 gm'],
        ['pt-0', 'Familiar cat dress, long', '사역마 고양이 원피스 · 긴 기장', 'cat costume, black dress, purple neck bow with a bell, crescent moon embroidery, long sleeves, ankle length', 'f1 F1 x0 gf v:c-familiar-pt'],
        ['pt-1', 'Familiar cat dress, knee', '사역마 고양이 원피스 · 무릎 기장', 'cat costume, black dress, purple neck bow with a bell, crescent moon embroidery, puff sleeves, knee length', 'f1 F1 x1 gf v:c-familiar-pt'],
        ['pt-2', 'Familiar cat dress, short', '사역마 고양이 원피스 · 짧은 기장', 'cat costume, black dress, purple neck bow with a bell, crescent moon embroidery, off-shoulder, short frilled skirt', 'f1 F1 x2 gf v:c-familiar-pt n:low'],
        ['pt-m', 'Familiar cat jacket', '사역마 고양이 재킷', 'cat costume, black cropped jacket, purple bow with a bell, shorts', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless familiar vest', '민소매 사역마 조끼', 'cat costume, sleeveless black vest, purple bow with a bell, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Moon familiar dress, long', '달 사역마 원피스 · 긴 기장', 'black velvet dress, purple capelet, crescent moon tag on the collar, long sleeves, ankle length', 'f2 x0 gf v:c-familiar-ed'],
        ['ed-1', 'Moon familiar dress, knee', '달 사역마 원피스 · 무릎 기장', 'black velvet dress, purple capelet, crescent moon tag on the collar, short sleeves, knee length', 'f2 x1 gf v:c-familiar-ed'],
        ['ed-2', 'Moon familiar dress, short', '달 사역마 원피스 · 짧은 기장', 'black velvet dress, purple capelet, crescent moon tag on the collar, corset bodice, short skirt', 'f2 x2 gf v:c-familiar-ed'],
        ['ed-m', 'Velvet familiar coat', '벨벳 사역마 코트', 'black velvet coat, purple capelet, crescent moon tag on the collar', 'f2 x01 gm'],
        ['ed-m2', 'Open velvet familiar coat', '풀어 입은 벨벳 사역마 코트', 'open black velvet coat, purple capelet', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Tail bow belt', '꼬리 리본 벨트', 'belt with a purple bow', ''],
      ],
      foundation: [
        ['black', 'Black thighhighs', '검은 니삭스', 'black thighhighs', 'gf'],
        ['striped', 'Purple striped socks', '보라 줄무늬 양말', 'purple striped socks', ''],
      ],
      neckwear: [
        ['bell', 'Bell collar', '방울 목걸이', 'collar with a bell', ''],
        ['moon', 'Moon tag', '달 이름표', 'crescent moon name tag', ''],
      ],
      outer: [
        ['capelet', 'Purple capelet', '보라 케이플릿', 'purple capelet', 'f1'],
      ],
      footwear: [
        ['paw', 'Paw boots', '발바닥 부츠', 'paw boots', ''],
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
      ],
      headwear: [
        ['ears', 'Cat ears', '고양이 귀', 'fake cat ears, headband', ''],
        ['witch', 'Mini witch hat with ears', '귀 달린 미니 마녀 모자', 'mini witch hat with cat ears', ''],
      ],
      accessories: [
        ['tail', 'Clip-on cat tail', '달아 놓은 고양이 꼬리', 'clip-on costume cat tail', ''],
        ['paws', 'Paw gloves', '발바닥 장갑', 'paw gloves', ''],
        ['broom', 'Riding a broom', '빗자루 타기', 'sitting on a floating broom', 'f3'],
      ],
      weapon: [
        ['book', 'Spell book', '주문서', 'holding a small spell book', ''],
        ['yarn', 'Purple yarn', '보라 털실', 'holding a ball of purple yarn', ''],
      ],
      device: [
        ['whiskers', 'Whiskers', '수염', 'whisker markings face paint', ''],
        ['eyes', 'Glowing cat eyes', '빛나는 고양이 눈', 'glowing yellow slit pupils', 'f3'],
      ],
    },
  }),

  /* ─── V-33 고양이 · 고양이 카페 ─── */
  costume('c-cafe', 'Cat · Cat Cafe', '고양이 · 고양이 카페', 'V-33', {
    tag: 'halloween costume, cat costume, fake animal ears, cafe uniform', tagReal: 'cat cafe, halloween night',
    colors: ['cream', 'brown', 'pastel pink', 'white', 'grey'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Apron and cat ears', '앞치마와 고양이 귀', 'striped shirt, skirt, apron with a paw print, felt cat ears', 'f0 F0 gf'],
        ['hm-m', 'Apron and cat ears, trousers', '앞치마와 고양이 귀, 바지', 'striped shirt, trousers, apron with a paw print, felt cat ears', 'f0 F0 gm'],
        ['pt-0', 'Cat cafe uniform, long', '고양이 카페 유니폼 · 긴 기장', 'cat cafe uniform, blouse, paw print apron, bell on the collar, long skirt', 'f1 F1 x0 gf v:c-cafe-pt'],
        ['pt-1', 'Cat cafe uniform, knee', '고양이 카페 유니폼 · 무릎 기장', 'cat cafe uniform, blouse, paw print apron, bell on the collar, knee-length skirt', 'f1 F1 x1 gf v:c-cafe-pt'],
        ['pt-2', 'Cat cafe uniform, short', '고양이 카페 유니폼 · 짧은 기장', 'cat cafe uniform, blouse, paw print apron, bell on the collar, short skirt, short sleeves', 'f1 F1 x2 gf v:c-cafe-pt'],
        ['pt-m', 'Cat cafe uniform, trousers', '고양이 카페 유니폼과 바지', 'cat cafe uniform, shirt, paw print apron, bell on the collar, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Cat cafe shirt, rolled sleeves', '소매 걷은 고양이 카페 셔츠', 'cat cafe uniform, rolled sleeves, paw print apron, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Cat cafe dress, long', '고양이 카페 원피스 · 긴 기장', 'cat cafe dress, frilled apron with a cat face, puff sleeves, bell collar, long sleeves, ankle length', 'f2 x0 gf v:c-cafe-ed'],
        ['ed-1', 'Cat cafe dress, knee', '고양이 카페 원피스 · 무릎 기장', 'cat cafe dress, frilled apron with a cat face, puff sleeves, bell collar, puff sleeves, knee length', 'f2 x1 gf v:c-cafe-ed'],
        ['ed-2', 'Cat cafe dress, short', '고양이 카페 원피스 · 짧은 기장', 'cat cafe dress, frilled apron with a cat face, puff sleeves, bell collar, off-shoulder, short frilled skirt', 'f2 x2 gf v:c-cafe-ed n:low'],
        ['ed-m', 'Cat cafe vest and bow tie', '고양이 카페 조끼와 보타이', 'cat cafe uniform, vest, bow tie with a bell, long apron', 'f2 x01 gm'],
        ['ed-m2', 'Open-collar cat cafe vest', '깃 풀린 고양이 카페 조끼', 'cat cafe uniform, vest, open collar, long apron', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['apron', 'Paw apron', '발바닥 앞치마', 'apron with paw prints', ''],
      ],
      foundation: [
        ['socks', 'Cat face socks', '고양이 얼굴 양말', 'cat face socks', ''],
        ['knee', 'Kneehighs', '니삭스', 'kneehighs', 'gf'],
      ],
      neckwear: [
        ['bell', 'Bell ribbon', '방울 리본', 'ribbon with a bell', ''],
      ],
      outer: [
        ['cardigan', 'Cream cardigan', '크림 가디건', 'cream cardigan', 'f1'],
      ],
      footwear: [
        ['loafers', 'Loafers', '로퍼', 'loafers', ''],
        ['paw', 'Paw slippers', '발바닥 슬리퍼', 'paw slippers', ''],
      ],
      headwear: [
        ['ears', 'Cat ears', '고양이 귀', 'fake cat ears, headband', ''],
        ['cap', 'Cat-ear beret', '고양이 귀 베레모', 'beret with cat ears', ''],
      ],
      accessories: [
        ['tail', 'Clip-on cat tail', '달아 놓은 고양이 꼬리', 'clip-on costume cat tail', ''],
        ['kittens', 'Kittens around', '둘레의 아기 고양이', 'kittens playing around the feet', 'f2 c:animal'],
      ],
      weapon: [
        ['latte', 'Cat latte art', '고양이 라테아트', 'holding a latte with cat latte art', ''],
        ['toy', 'Cat teaser wand', '고양이 낚싯대', 'holding a cat teaser wand', ''],
        ['cake', 'Cat-shaped cake', '고양이 모양 케이크', 'holding a cat-shaped cake', ''],
      ],
      device: [
        ['nose', 'Painted cat nose', '그린 고양이 코', 'painted cat nose, :3', ''],
        ['blush', 'Blush', '발그레한 볼', 'blush', ''],
      ],
    },
  }),

  /* ─── V-34 고양이 · 고양이 도둑 ─── */
  costume('c-thief', 'Cat · Cat Burglar', '고양이 · 고양이 도둑', 'V-34', {
    tag: 'halloween costume, cat burglar, fake animal ears', tagReal: 'cat burglar, halloween night, rooftops',
    colors: ['black', 'charcoal', 'navy', 'deep purple', 'crimson'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black turtleneck and cat ears', '검은 목폴라와 고양이 귀', 'black turtleneck, black skirt, felt cat ears, paper mask', 'f0 F0 gf'],
        ['hm-m', 'Black turtleneck and cat ears, trousers', '검은 목폴라와 고양이 귀, 바지', 'black turtleneck, black trousers, felt cat ears', 'f0 F0 gm'],
        ['pt-0', 'Cat burglar outfit, long', '고양이 도둑 차림 · 긴 기장', 'cat burglar, black turtleneck, utility belt, cat ear hood, black cargo pants', 'f1 F1 x0 gf v:c-thief-pt n:high'],
        ['pt-1', 'Cat burglar outfit, knee', '고양이 도둑 차림 · 무릎 기장', 'cat burglar, black turtleneck, utility belt, cat ear hood, black skirt over leggings, knee length', 'f1 F1 x1 gf v:c-thief-pt n:high'],
        ['pt-2', 'Cat burglar outfit, short', '고양이 도둑 차림 · 짧은 기장', 'cat burglar, black turtleneck, utility belt, cat ear hood, cropped turtleneck, black shorts', 'f1 F1 x2 gf v:c-thief-pt n:high'],
        ['pt-m', 'Cat burglar outfit, cargo pants', '고양이 도둑 차림과 카고 바지', 'cat burglar, black turtleneck, utility belt, cat ear hood, cargo pants', 'f1 F1 x01 gm n:high'],
        ['pt-m2', 'Sleeveless cat burglar top', '민소매 고양이 도둑', 'cat burglar, sleeveless black top, utility belt, cat ear hood', 'f1 F1 x2 gm'],
        ['ed-0', 'Leather cat burglar jacket, long', '가죽 고양이 도둑 재킷 · 긴 기장', 'cat burglar, cropped leather jacket with cat ear hood, black turtleneck, buckled straps, long black trousers', 'f2 x0 gf v:c-thief-ed n:high'],
        ['ed-1', 'Leather cat burglar jacket, knee', '가죽 고양이 도둑 재킷 · 무릎 기장', 'cat burglar, cropped leather jacket with cat ear hood, black turtleneck, buckled straps, black shorts over tights', 'f2 x1 gf v:c-thief-ed n:high'],
        ['ed-2', 'Leather cat burglar jacket, short', '가죽 고양이 도둑 재킷 · 짧은 기장', 'cat burglar, cropped leather jacket with cat ear hood, black turtleneck, buckled straps, corset top, black shorts', 'f2 x2 gf v:c-thief-ed n:high'],
        ['ed-m', 'Leather cat burglar jacket, trousers', '가죽 고양이 도둑 재킷과 바지', 'cat burglar, leather jacket with cat ear hood, black turtleneck, trousers', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open leather jacket and harness', '풀어 입은 가죽 재킷과 하네스', 'cat burglar, open leather jacket, harness, black trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['utility', 'Utility belt', '유틸리티 벨트', 'utility belt with pouches', ''],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
        ['fishnet', 'Sheer black tights', '비치는 검은 타이츠', 'sheer black pantyhose', 'x2 gf'],
      ],
      neckwear: [
        ['bell', 'Silenced bell', '솜 넣은 방울', 'bell collar stuffed with cotton', ''],
      ],
      outer: [],
      footwear: [
        ['boots', 'Soft-soled boots', '바닥 부드러운 부츠', 'soft-soled black boots', ''],
      ],
      headwear: [
        ['hood', 'Cat-ear hood', '고양이 귀 후드', 'hood with cat ears, hood up', ''],
        ['mask', 'Domino mask', '눈가리개 가면', 'black domino mask', ''],
      ],
      accessories: [
        ['gloves', 'Black gloves', '검은 장갑', 'black gloves', ''],
        ['tail', 'Clip-on cat tail', '달아 놓은 고양이 꼬리', 'clip-on costume cat tail', ''],
        ['moon', 'Full moon rooftop', '보름달 지붕', 'perched on a rooftop under a full moon', 'f3'],
      ],
      weapon: [
        ['fish', 'Stolen fish', '훔친 생선', 'holding a stolen fish', ''],
        ['gem', 'Stolen jewel', '훔친 보석', 'holding a stolen jewel', ''],
        ['sack', 'Loot sack', '보따리', 'loot sack over the shoulder', ''],
      ],
      device: [
        ['whiskers', 'Whiskers', '수염', 'whisker markings face paint', ''],
        ['smirk', 'Smirk', '씩 웃음', 'smirk', ''],
      ],
    },
  }),

  /* ─── V-35 고양이 · 아이돌 ─── */
  costume('c-idol', 'Cat · Idol', '고양이 · 아이돌', 'V-35', {
    tag: 'halloween costume, cat costume, idol, fake animal ears', tagReal: 'cat idol, halloween night, stage lights',
    colors: ['black', 'pastel pink', 'white', 'lavender', 'pumpkin orange'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Skirt and cat ears with a mic', '치마와 고양이 귀, 장난감 마이크', 'black skirt, sparkly top, felt cat ears', 'f0 F0 gf'],
        ['hm-m', 'Sparkly top and cat ears', '반짝이 상의와 고양이 귀', 'sparkly top, black jeans, felt cat ears', 'f0 F0 gm'],
        ['pt-0', 'Cat idol stage outfit, long', '고양이 아이돌 무대 의상 · 긴 기장', 'cat idol stage outfit, paw print sequins, bell ribbon, tail bow, long tiered skirt', 'f1 F1 x0 gf v:c-idol-pt'],
        ['pt-1', 'Cat idol stage outfit, knee', '고양이 아이돌 무대 의상 · 무릎 기장', 'cat idol stage outfit, paw print sequins, bell ribbon, tail bow, knee-length tiered skirt', 'f1 F1 x1 gf v:c-idol-pt'],
        ['pt-2', 'Cat idol stage outfit, short', '고양이 아이돌 무대 의상 · 짧은 기장', 'cat idol stage outfit, paw print sequins, bell ribbon, tail bow, cropped top, short tiered skirt', 'f1 F1 x2 gf v:c-idol-pt'],
        ['pt-m', 'Cat idol stage jacket', '고양이 아이돌 무대 재킷', 'cat idol stage jacket, paw print sequins, bell ribbon, slim trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open cat idol jacket', '풀어 입은 고양이 아이돌 재킷', 'open cat idol stage jacket, black tank top, slim trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Cat idol tulle dress, long', '고양이 아이돌 튤 원피스 · 긴 기장', 'cat idol dress, layered tulle, rhinestone paw prints, satin bow, long sleeves, long skirt', 'f2 x0 gf v:c-idol-ed'],
        ['ed-1', 'Cat idol tulle dress, knee', '고양이 아이돌 튤 원피스 · 무릎 기장', 'cat idol dress, layered tulle, rhinestone paw prints, satin bow, puff sleeves, knee length', 'f2 x1 gf v:c-idol-ed'],
        ['ed-2', 'Cat idol tulle dress, short', '고양이 아이돌 튤 원피스 · 짧은 기장', 'cat idol dress, layered tulle, rhinestone paw prints, satin bow, off-shoulder, short tulle skirt', 'f2 x2 gf v:c-idol-ed n:low'],
        ['ed-m', 'Cat idol tailcoat', '고양이 아이돌 연미복', 'cat idol tailcoat, rhinestone paw prints, satin bow tie', 'f2 x01 gm'],
        ['ed-m2', 'Open cat idol tailcoat', '풀어 입은 고양이 아이돌 연미복', 'open cat idol tailcoat, black tank top', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Tail bow', '꼬리 리본', 'big bow at the back', 'gf'],
      ],
      foundation: [
        ['thigh', 'Paw-print thighhighs', '발바닥 무늬 니삭스', 'paw print thighhighs', 'gf'],
        ['socks', 'Frilled socks', '프릴 양말', 'frilled socks', 'gf'],
      ],
      neckwear: [
        ['bell', 'Bell choker', '방울 초커', 'choker with a bell', ''],
        ['mic', 'Headset mic', '헤드셋 마이크', 'headset microphone', ''],
      ],
      outer: [],
      footwear: [
        ['boots', 'Platform boots', '플랫폼 부츠', 'platform boots', ''],
        ['sneakers', 'Glitter sneakers', '반짝이 운동화', 'glitter sneakers', ''],
      ],
      headwear: [
        ['ears', 'Cat ears with bows', '리본 단 고양이 귀', 'cat ear headband with a bow', ''],
        ['crown', 'Mini crown', '작은 왕관', 'mini crown between cat ears', 'f2'],
      ],
      accessories: [
        ['tail', 'Clip-on cat tail with a bow', '리본 단 달아 놓은 꼬리', 'clip-on costume cat tail, tail bow', ''],
        ['paws', 'Paw gloves', '발바닥 장갑', 'paw gloves', ''],
        ['confetti', 'Paw confetti', '발바닥 종이 꽃가루', 'paw-shaped confetti falling', 'f3'],
      ],
      weapon: [
        ['mic', 'Cat-ear microphone', '고양이 귀 마이크', 'holding a microphone with cat ears', ''],
        ['pose', 'Cat paw pose', '고양이 손 포즈', 'paw pose', ''],
      ],
      device: [
        ['whiskers', 'Glitter whiskers', '반짝이 수염', 'glitter whisker markings', ''],
        ['wink', 'Wink', '윙크', 'one eye closed, smile', ''],
      ],
    },
  }),

  /* ─── V-36 인어 · 진주 ─── */
  costume('mm-pearl', 'Mermaid · Pearl', '인어 · 진주', 'V-36', {
    tag: 'halloween costume, mermaid costume, pearls', tagReal: 'mermaid costume, halloween night, underwater light',
    tagM: 'halloween costume, merman costume, pearls', tagRealM: 'merman costume, halloween night, underwater light',
    colors: ['pearl white', 'seafoam', 'pastel pink', 'lavender', 'sky blue'],
    items: {
      garment: [
        ['hm-f', 'Homemade tail with paper fins', '종이 지느러미 단 손수 꼬리', 'homemade mermaid tail sewn from sequin fabric over both legs, paper fins at the feet, pearl beads glued on, white top', 'f0 F0 gf skip:footwear+foundation'],
        ['hm-m', 'Homemade tail with paper fins', '종이 지느러미 단 손수 꼬리', 'homemade merman tail sewn from sequin fabric over both legs, paper fins at the feet, pearl beads glued on, white shirt', 'f0 F0 gm skip:footwear+foundation'],
        ['pt-0', 'Pearl mermaid tail outfit, long', '진주 인어 꼬리 차림 · 긴 기장', 'mermaid costume, iridescent sequin fishtail skirt, pearl strands, scalloped trim, long sleeve top with pearl trim', 'f1 F1 x0 gf v:mm-pearl-pt skip:footwear+foundation'],
        ['pt-1', 'Pearl mermaid tail outfit, knee', '진주 인어 꼬리 차림 · 무릎 기장', 'mermaid costume, iridescent sequin fishtail skirt, pearl strands, scalloped trim, off-shoulder top with pearl trim', 'f1 F1 x1 gf v:mm-pearl-pt n:low skip:footwear+foundation'],
        ['pt-2', 'Pearl mermaid tail outfit, short', '진주 인어 꼬리 차림 · 짧은 기장', 'mermaid costume, iridescent sequin fishtail skirt, pearl strands, scalloped trim, seashell bralette with pearl strands', 'f1 F1 x2 gf v:mm-pearl-pt skip:footwear+foundation'],
        ['pt-m', 'Pearl merman tail and shirt', '진주 인어 꼬리와 셔츠', 'merman costume, iridescent sequin fishtail trousers, pearl strands, loose shirt', 'f1 F1 x01 gm skip:footwear+foundation'],
        ['pt-m2', 'Pearl merman tail and open shirt', '진주 인어 꼬리와 풀어 헤친 셔츠', 'merman costume, iridescent sequin fishtail trousers, pearl harness, open shirt', 'f1 F1 x2 gm n:low skip:footwear+foundation'],
        ['ed-0', 'Pearl mermaid gown, long', '진주 인어 드레스 · 긴 기장', 'mermaid gown, pearl-beaded bodice, sheer fishtail train, iridescent sheen, high neck, long sleeves', 'f2 x0 gf v:mm-pearl-ed n:high skip:footwear+foundation'],
        ['ed-1', 'Pearl mermaid gown, knee', '진주 인어 드레스 · 무릎 기장', 'mermaid gown, pearl-beaded bodice, sheer fishtail train, iridescent sheen, off-shoulder, cap sleeves', 'f2 x1 gf v:mm-pearl-ed n:low skip:footwear+foundation'],
        ['ed-2', 'Pearl mermaid gown, short', '진주 인어 드레스 · 짧은 기장', 'mermaid gown, pearl-beaded bodice, sheer fishtail train, iridescent sheen, strapless shell bodice', 'f2 x2 gf v:mm-pearl-ed n:low skip:footwear+foundation'],
        ['ed-m', 'Pearl merman coat', '진주 인어 코트', 'merman costume, pearl-beaded coat, sheer fishtail train', 'f2 x01 gm skip:footwear+foundation'],
        ['ed-m2', 'Open pearl merman coat', '풀어 입은 진주 인어 코트', 'merman costume, open pearl-beaded coat, sheer fishtail train', 'f2 x2 gm n:low skip:footwear+foundation'],
      ],
      structure: [
        ['pearls', 'Pearl belt', '진주 벨트', 'belt of pearls', ''],
      ],
      foundation: [],
      neckwear: [
        ['pearls', 'Pearl choker', '진주 초커', 'pearl choker', ''],
        ['shell', 'Shell pendant', '조개 펜던트', 'seashell pendant', ''],
      ],
      outer: [
        ['veil', 'Sheer shawl like water', '물결 같은 숄', 'sheer shawl rippling like water', 'f1'],
      ],
      footwear: [],
      headwear: [
        ['shells', 'Seashell hair clips', '조개 머리핀', 'seashell hair ornament', ''],
        ['tiara', 'Pearl tiara', '진주 티아라', 'pearl tiara', 'f1'],
      ],
      accessories: [
        ['fin', 'Fin ear cuffs', '지느러미 귀 장식', 'fin-shaped ear cuffs', ''],
        ['pearls', 'Pearls on the wrists', '손목 진주', 'pearl strands on the wrists', ''],
        ['bubbles', 'Rising bubbles', '떠오르는 물방울', 'bubbles rising around', 'f3'],
      ],
      weapon: [
        ['shell', 'Pearl in a shell', '조개 속 진주', 'holding an open shell with a pearl', ''],
        ['comb', 'Shell hand mirror', '조개 손거울', 'holding a seashell hand mirror', ''],
      ],
      device: [
        ['scales', 'Painted scales', '그린 비늘', 'painted scales on the cheekbones', ''],
        ['glitter', 'Pearl glitter', '진주 반짝이', 'pearl glitter under the eyes', ''],
      ],
    },
  }),

  /* ─── V-37 인어 · 심해 ─── */
  costume('mm-deep', 'Mermaid · Deep Sea', '인어 · 심해', 'V-37', {
    tag: 'halloween costume, mermaid costume, deep sea', tagReal: 'deep sea mermaid costume, halloween night, bioluminescence',
    tagM: 'halloween costume, merman costume, deep sea', tagRealM: 'deep sea merman costume, halloween night, bioluminescence',
    colors: ['navy', 'black', 'midnight blue', 'teal', 'deep purple'],
    items: {
      garment: [
        ['hm-f', 'Homemade dark tail with glow sticks', '야광봉 붙인 어두운 손수 꼬리', 'homemade mermaid tail sewn from dark blue fabric over both legs, glow sticks taped along it, black top', 'f0 F0 gf skip:footwear+foundation'],
        ['hm-m', 'Homemade dark tail with glow sticks', '야광봉 붙인 어두운 손수 꼬리', 'homemade merman tail sewn from dark blue fabric over both legs, glow sticks taped along it, black shirt', 'f0 F0 gm skip:footwear+foundation'],
        ['pt-0', 'Deep sea mermaid tail outfit, long', '심해 인어 꼬리 차림 · 긴 기장', 'mermaid costume, dark navy sequin fishtail skirt, glowing dots along the seams, long sleeve sheer top', 'f1 F1 x0 gf v:mm-deep-pt skip:footwear+foundation'],
        ['pt-1', 'Deep sea mermaid tail outfit, knee', '심해 인어 꼬리 차림 · 무릎 기장', 'mermaid costume, dark navy sequin fishtail skirt, glowing dots along the seams, off-shoulder sheer top', 'f1 F1 x1 gf v:mm-deep-pt n:low skip:footwear+foundation'],
        ['pt-2', 'Deep sea mermaid tail outfit, short', '심해 인어 꼬리 차림 · 짧은 기장', 'mermaid costume, dark navy sequin fishtail skirt, glowing dots along the seams, shell bralette, sheer chiffon shrug', 'f1 F1 x2 gf v:mm-deep-pt skip:footwear+foundation'],
        ['pt-m', 'Deep sea merman tail', '심해 인어 꼬리', 'merman costume, dark navy sequin fishtail trousers, glowing dots, black tank top', 'f1 F1 x01 gm skip:footwear+foundation'],
        ['pt-m2', 'Deep sea merman, open sheer shirt', '심해 인어, 풀어 입은 시스루 셔츠', 'merman costume, dark navy sequin fishtail trousers, open sheer shirt', 'f1 F1 x2 gm n:low skip:footwear+foundation'],
        ['ed-0', 'Bioluminescent mermaid gown, long', '빛나는 심해 인어 드레스 · 긴 기장', 'deep sea mermaid gown, black layered chiffon fins, bioluminescent beading, high collar, long sleeves', 'f2 x0 gf v:mm-deep-ed n:high skip:footwear+foundation'],
        ['ed-1', 'Bioluminescent mermaid gown, knee', '빛나는 심해 인어 드레스 · 무릎 기장', 'deep sea mermaid gown, black layered chiffon fins, bioluminescent beading, cowl neck, sheer sleeves', 'f2 x1 gf v:mm-deep-ed skip:footwear+foundation'],
        ['ed-2', 'Bioluminescent mermaid gown, short', '빛나는 심해 인어 드레스 · 짧은 기장', 'deep sea mermaid gown, black layered chiffon fins, bioluminescent beading, corset bodice, sheer fins', 'f2 x2 gf v:mm-deep-ed skip:footwear+foundation'],
        ['ed-m', 'Bioluminescent merman coat', '빛나는 심해 인어 코트', 'deep sea merman, black coat with chiffon fins, bioluminescent beading', 'f2 x01 gm skip:footwear+foundation'],
        ['ed-m2', 'Open bioluminescent coat and tail', '풀어 입은 심해 코트와 꼬리', 'deep sea merman, open black coat, bioluminescent harness, black fishtail with chiffon fins', 'f2 x2 gm n:low skip:footwear+foundation'],
      ],
      structure: [
        ['net', 'Black kelp sash', '검은 해초 허리끈', 'black kelp-like sash', ''],
      ],
      foundation: [],
      neckwear: [
        ['lure', 'Glowing lure pendant', '빛나는 미끼 펜던트', 'glowing pendant like an anglerfish lure', ''],
      ],
      outer: [
        ['fins', 'Chiffon fin cape', '시폰 지느러미 망토', 'black chiffon cape shaped like fins', 'f1'],
      ],
      footwear: [],
      headwear: [
        ['lure', 'Anglerfish lure headband', '아귀 미끼 머리띠', 'headband with a glowing lure on a stalk', ''],
        ['fins', 'Fin hair clips', '지느러미 머리핀', 'fin-shaped hair clips', ''],
      ],
      accessories: [
        ['jellies', 'Tiny jellyfish', '작은 해파리', 'tiny glowing jellyfish floating around', 'f3'],
        ['fin', 'Fin ear cuffs', '지느러미 귀 장식', 'fin-shaped ear cuffs', ''],
      ],
      weapon: [
        ['lantern', 'Jellyfish lantern', '해파리 등불', 'holding a jellyfish-shaped lantern', ''],
        ['trident', 'Black trident', '검은 삼지창', 'holding a black trident', 'f2'],
      ],
      device: [
        ['dots', 'Glowing dots on the cheeks', '볼의 빛나는 점', 'glowing dots on the cheekbones', ''],
        ['eyes', 'Glowing pale eyes', '희게 빛나는 눈', 'glowing pale eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-38 인어 · 아이돌 ─── */
  costume('mm-idol', 'Mermaid · Idol', '인어 · 아이돌', 'V-38', {
    tag: 'halloween costume, mermaid costume, idol', tagReal: 'mermaid idol, halloween night, stage lights',
    tagM: 'halloween costume, merman costume, idol', tagRealM: 'merman idol, halloween night, stage lights',
    colors: ['seafoam', 'pastel pink', 'lavender', 'aqua', 'pastel rainbow'],
    items: {
      garment: [
        ['hm-f', 'Homemade glitter tail', '손수 꿰맨 반짝이 꼬리', 'homemade mermaid tail sewn from glitter fabric over both legs, tulle fin at the feet, glitter top', 'f0 F0 gf skip:footwear+foundation'],
        ['hm-m', 'Homemade glitter tail', '손수 꿰맨 반짝이 꼬리', 'homemade merman tail sewn from glitter fabric over both legs, tulle fin at the feet, glitter shirt', 'f0 F0 gm skip:footwear+foundation'],
        ['pt-0', 'Mermaid idol stage outfit, long', '인어 아이돌 무대 의상 · 긴 기장', 'mermaid idol, holographic fishtail skirt, ruffled tulle fins, star shell trim, long puff sleeve top', 'f1 F1 x0 gf v:mm-idol-pt skip:footwear+foundation'],
        ['pt-1', 'Mermaid idol stage outfit, knee', '인어 아이돌 무대 의상 · 무릎 기장', 'mermaid idol, holographic fishtail skirt, ruffled tulle fins, star shell trim, puff short sleeve top', 'f1 F1 x1 gf v:mm-idol-pt skip:footwear+foundation'],
        ['pt-2', 'Mermaid idol stage outfit, short', '인어 아이돌 무대 의상 · 짧은 기장', 'mermaid idol, holographic fishtail skirt, ruffled tulle fins, star shell trim, cropped top, shell bralette', 'f1 F1 x2 gf v:mm-idol-pt skip:footwear+foundation'],
        ['pt-m', 'Merman idol jacket', '인어 아이돌 재킷', 'merman idol, holographic fishtail trousers, cropped stage jacket', 'f1 F1 x01 gm skip:footwear+foundation'],
        ['pt-m2', 'Open merman idol jacket', '풀어 입은 인어 아이돌 재킷', 'merman idol, holographic fishtail trousers, open stage jacket, black tank top', 'f1 F1 x2 gm n:low skip:footwear+foundation'],
        ['ed-0', 'Holographic mermaid idol gown, long', '홀로그램 인어 아이돌 드레스 · 긴 기장', 'mermaid idol gown, holographic sequins, layered tulle fins, pearl trim, high neck, long sleeves', 'f2 x0 gf v:mm-idol-ed n:high skip:footwear+foundation'],
        ['ed-1', 'Holographic mermaid idol gown, knee', '홀로그램 인어 아이돌 드레스 · 무릎 기장', 'mermaid idol gown, holographic sequins, layered tulle fins, pearl trim, puff sleeves, sweetheart neckline', 'f2 x1 gf v:mm-idol-ed skip:footwear+foundation'],
        ['ed-2', 'Holographic mermaid idol gown, short', '홀로그램 인어 아이돌 드레스 · 짧은 기장', 'mermaid idol gown, holographic sequins, layered tulle fins, pearl trim, off-shoulder, shell bodice', 'f2 x2 gf v:mm-idol-ed n:low skip:footwear+foundation'],
        ['ed-m', 'Holographic merman tailcoat', '홀로그램 인어 연미복', 'merman idol, holographic tailcoat, tulle fin tails', 'f2 x01 gm skip:footwear+foundation'],
        ['ed-m2', 'Open holographic tailcoat', '풀어 입은 홀로그램 연미복', 'merman idol, open holographic tailcoat, black tank top', 'f2 x2 gm n:low skip:footwear+foundation'],
      ],
      structure: [
        ['bow', 'Shell bow', '조개 리본', 'bow with a seashell at the back', ''],
      ],
      foundation: [],
      neckwear: [
        ['mic', 'Headset mic', '헤드셋 마이크', 'headset microphone', ''],
        ['choker', 'Star shell choker', '별 조개 초커', 'starfish choker', ''],
      ],
      outer: [],
      footwear: [],
      headwear: [
        ['shells', 'Star and shell clips', '별 · 조개 머리핀', 'starfish and seashell hair ornament', ''],
        ['crown', 'Shell crown', '조개 관', 'small seashell crown', 'f1'],
      ],
      accessories: [
        ['gloves', 'Sheer gloves', '비치는 장갑', 'sheer iridescent gloves', ''],
        ['bubbles', 'Bubble machine bubbles', '비눗방울', 'bubbles floating across the stage', 'f2'],
      ],
      weapon: [
        ['mic', 'Shell microphone', '조개 마이크', 'holding a seashell microphone', ''],
        ['lightstick', 'Shell lightstick', '조개 응원봉', 'holding a seashell lightstick', ''],
      ],
      device: [
        ['glitter', 'Iridescent glitter', '무지갯빛 반짝이', 'iridescent glitter on the cheeks', ''],
        ['wink', 'Wink', '윙크', 'one eye closed, smile', ''],
      ],
    },
  }),

  /* ─── V-39 인어 · 스트리트 ─── */
  costume('mm-street', 'Mermaid · Street', '인어 · 스트리트', 'V-39', {
    tag: 'mermaid, sequin fishtail skirt, streetwear, halloween', tagReal: 'mermaid, streetwear, halloween night',
    tagM: 'merman, sequin trousers, streetwear, halloween', tagRealM: 'merman, streetwear, halloween night',
    colors: ['teal', 'seafoam', 'black', 'aqua', 'denim blue'],
    items: {
      garment: [
        ['hm-f', 'Sequin fishtail skirt and a hoodie', '스팽글 피시테일 치마와 후드티', 'long sequin skirt cut into a fishtail with a felt fin hem, oversized hoodie', 'f0 F0 gf'],
        ['hm-m', 'Fin-hem sequin trousers and a hoodie', '지느러미 밑단 스팽글 바지와 후드티', 'sequin trousers flaring into a felt fin hem at the ankles like a tail, oversized hoodie', 'f0 F0 gm'],
        ['pt-0', 'Fishtail skirt and hoodie, long', '피시테일 치마와 후드티 · 긴 기장', 'mermaid outfit, sequin fishtail midi skirt, oversized hoodie with a shell graphic, long skirt, sneakers', 'f1 F1 x0 gf v:mm-street-pt'],
        ['pt-1', 'Fishtail skirt and hoodie, knee', '피시테일 치마와 후드티 · 무릎 기장', 'mermaid outfit, sequin fishtail midi skirt, oversized hoodie with a shell graphic, knee-length skirt, sneakers', 'f1 F1 x1 gf v:mm-street-pt'],
        ['pt-2', 'Fishtail skirt and hoodie, short', '피시테일 치마와 후드티 · 짧은 기장', 'mermaid outfit, sequin fishtail midi skirt, oversized hoodie with a shell graphic, cropped hoodie, short sequin skirt', 'f1 F1 x2 gf v:mm-street-pt'],
        ['pt-m', 'Fin-hem trousers and shell hoodie', '지느러미 밑단 바지와 조개 후드', 'merman outfit, iridescent wide trousers flaring into a fin-shaped hem like a tail, oversized hoodie with a shell graphic', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless shell hoodie and fin-hem trousers', '민소매 조개 후드와 지느러미 밑단 바지', 'merman outfit, sleeveless hoodie with a shell graphic, iridescent trousers flaring into a fin-shaped hem', 'f1 F1 x2 gm'],
        ['ed-0', 'Iridescent puffer and fishtail skirt, long', '무지갯빛 패딩과 피시테일 치마 · 긴 기장', 'iridescent puffer jacket, sequin fishtail skirt, shell charms, long skirt', 'f2 x0 gf v:mm-street-ed'],
        ['ed-1', 'Iridescent puffer and fishtail skirt, knee', '무지갯빛 패딩과 피시테일 치마 · 무릎 기장', 'iridescent puffer jacket, sequin fishtail skirt, shell charms, knee-length skirt', 'f2 x1 gf v:mm-street-ed'],
        ['ed-2', 'Iridescent puffer and fishtail skirt, short', '무지갯빛 패딩과 피시테일 치마 · 짧은 기장', 'iridescent puffer jacket, sequin fishtail skirt, shell charms, cropped puffer, short sequin skirt', 'f2 x2 gf v:mm-street-ed'],
        ['ed-m', 'Iridescent puffer and fin-hem trousers', '무지갯빛 패딩과 지느러미 밑단 바지', 'iridescent puffer jacket, wide sequin trousers flaring into a fin-shaped hem like a tail, shell charms', 'f2 x01 gm'],
        ['ed-m2', 'Open iridescent puffer and fin-hem trousers', '풀어 입은 무지갯빛 패딩과 지느러미 밑단 바지', 'open iridescent puffer jacket, tank top, shell charms, wide sequin trousers flaring into a fin-shaped hem', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['chain', 'Shell charm belt', '조개 참 벨트', 'belt with shell charms', ''],
      ],
      foundation: [
        ['socks', 'Wave print socks', '물결 무늬 양말', 'wave print socks', ''],
      ],
      neckwear: [
        ['headphones', 'Headphones', '헤드폰', 'headphones around the neck', ''],
        ['shell', 'Shell necklace', '조개 목걸이', 'seashell necklace', ''],
      ],
      outer: [],
      footwear: [
        ['sneakers', 'Iridescent sneakers', '무지갯빛 운동화', 'iridescent sneakers', ''],
        ['sandals', 'Platform sandals', '플랫폼 샌들', 'platform sandals', ''],
      ],
      headwear: [
        ['cap', 'Cap with a fin', '지느러미 모자', 'baseball cap with a fin on top', ''],
        ['clips', 'Shell hair clips', '조개 머리핀', 'seashell hair clips', ''],
      ],
      accessories: [
        ['bag', 'Clear bag with water and fish', '물고기 든 투명 가방', 'clear bag shaped like a fishbowl', ''],
        ['waves', 'Waves splashing behind', '뒤에 부서지는 파도', 'waves splashing behind', 'f3'],
      ],
      weapon: [
        ['boba', 'Blue bubble tea', '파란 버블티', 'holding a blue bubble tea', ''],
        ['phone', 'Phone with a shell case', '조개 케이스 휴대폰', 'holding a phone with a seashell case', ''],
      ],
      device: [
        ['scales', 'Scale stickers', '비늘 스티커', 'scale stickers on the cheekbones', ''],
        ['glitter', 'Glitter', '반짝이', 'glitter on the cheeks', ''],
      ],
    },
  }),

  /* ─── V-40 마녀 · 장미 ─── */
  costume('w-rose', 'Witch · Rose', '마녀 · 장미', 'V-40', {
    tag: 'halloween costume, rose witch, roses, ivy', tagReal: 'rose witch, halloween night, blooming roses',
    tagM: 'halloween costume, rose warlock, roses, ivy', tagRealM: 'rose warlock, halloween night, blooming roses',
    colors: ['forest green', 'crimson', 'emerald', 'black', 'moss green', 'burgundy'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Green dress with paper roses', '종이 장미 단 초록 원피스', 'green dress, paper roses and fake ivy pinned on', 'f0 F0 gf'],
        ['hm-m', 'Green shirt with fake ivy', '가짜 덩굴 두른 초록 셔츠', 'green shirt, fake ivy wrapped over the shoulders, dark trousers', 'f0 F0 gm'],
        ['pt-0', 'Ivy and rose witch dress, long', '덩굴 장미 마녀 원피스 · 긴 기장', 'rose witch dress, leaf-shaped bodice, ivy vines, red roses along the hem, long sleeves, ankle length', 'f1 F1 x0 gf v:w-rose-pt'],
        ['pt-1', 'Ivy and rose witch dress, knee', '덩굴 장미 마녀 원피스 · 무릎 기장', 'rose witch dress, leaf-shaped bodice, ivy vines, red roses along the hem, short sleeves, knee length', 'f1 F1 x1 gf v:w-rose-pt'],
        ['pt-2', 'Ivy and rose witch dress, short', '덩굴 장미 마녀 원피스 · 짧은 기장', 'rose witch dress, leaf-shaped bodice, ivy vines, red roses along the hem, leaf corset bodice, short petal skirt', 'f1 F1 x2 gf v:w-rose-pt'],
        ['pt-m', 'Ivy warlock coat', '덩굴 마법사 코트', 'rose warlock coat, ivy vines climbing the sleeves, red rose boutonniere', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open ivy shirt', '덩굴 감긴 풀어 헤친 셔츠', 'rose warlock, open green shirt, ivy vines wrapped around the arms', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Rose gown with climbing ivy, long', '덩굴 오르는 장미 드레스 · 긴 기장', 'rose witch gown, climbing ivy, layered rose petals, leaf embroidery, high collar, long sleeves, floor length', 'f2 x0 gf v:w-rose-ed n:high'],
        ['ed-1', 'Rose gown with climbing ivy, knee', '덩굴 오르는 장미 드레스 · 무릎 기장', 'rose witch gown, climbing ivy, layered rose petals, leaf embroidery, off-shoulder, knee length', 'f2 x1 gf v:w-rose-ed n:low'],
        ['ed-2', 'Rose gown with climbing ivy, short', '덩굴 오르는 장미 드레스 · 짧은 기장', 'rose witch gown, climbing ivy, layered rose petals, leaf embroidery, leaf corset bodice, high slit', 'f2 x2 gf v:w-rose-ed'],
        ['ed-m', 'Leaf-embroidered long coat', '잎 자수 롱코트', 'rose warlock long coat, leaf embroidery, climbing ivy, red rose at the lapel', 'f2 x01 gm'],
        ['ed-m2', 'Open leaf coat and rose sash', '풀어 입은 잎 코트와 장미 허리끈', 'rose warlock, open leaf coat, sash of red roses', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['vine', 'Ivy vine belt', '덩굴 벨트', 'ivy vine belt', ''],
        ['corset', 'Leaf corset', '잎 코르셋', 'leaf corset', 'x12 gf'],
      ],
      foundation: [
        ['vine', 'Ivy-print tights', '덩굴 무늬 타이츠', 'ivy print tights', 'gf'],
        ['green', 'Green tights', '초록 타이츠', 'green tights', 'gf'],
      ],
      neckwear: [
        ['rose', 'Rose choker', '장미 초커', 'red rose choker', ''],
      ],
      outer: [
        ['cape', 'Cape of leaves', '잎사귀 망토', 'cape made of overlapping leaves', 'f1'],
        ['bloom', 'Cape blooming with roses', '장미가 피는 망토', 'cape with roses blooming along the hem', 'f3'],
      ],
      footwear: [
        ['boots', 'Vine-wrapped boots', '덩굴 감은 부츠', 'boots wrapped in ivy vines', ''],
        ['heels', 'Green heels', '초록 힐', 'green heels', 'gf'],
      ],
      headwear: [
        ['hat', 'Witch hat with roses', '장미 단 마녀 모자', 'witch hat wrapped in ivy, red roses on the brim', ''],
        ['crown', 'Rose crown', '장미 관', 'crown of red roses', ''],
        ['leaf', 'Ivy circlet', '덩굴 머리띠', 'ivy circlet', ''],
      ],
      accessories: [
        ['gloves', 'Leaf gloves', '잎 장갑', 'gloves covered in small leaves', ''],
        ['petals', 'Rose petals drifting', '흩날리는 장미 꽃잎', 'rose petals drifting around', 'f2'],
        ['vines', 'Living vines curling', '살아 움직이는 덩굴', 'living vines curling around the arms', 'f3'],
      ],
      weapon: [
        ['rose', 'Single red rose', '빨간 장미 한 송이', 'holding a single red rose', ''],
        ['pot', 'Potted rose', '화분 장미', 'holding a small potted rose', ''],
        ['staff', 'Thorned vine staff', '가시 덩굴 지팡이', 'holding a staff of twisted thorny vines', 'f2'],
      ],
      device: [
        ['leaf', 'Leaf cheek paint', '볼의 잎사귀 분장', 'small leaves painted on the cheek', ''],
        ['glow', 'Glowing green eyes', '초록으로 빛나는 눈', 'glowing green eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-41 히어로 · 망토 ─── */
  costume('h-cape', 'Hero · Caped', '히어로 · 망토', 'V-41', {
    tag: 'halloween costume, superhero costume, cape', tagReal: 'superhero, halloween night, flying',
    colors: ['red', 'royal blue', 'black', 'gold', 'emerald', 'silver'],
    need: { outer: '' },
    items: {
      garment: [
        ['hm-f', 'Leggings, tee and a towel cape', '레깅스와 티, 수건 망토', 'leggings, t-shirt with a felt star emblem, towel tied as a cape', 'f0 F0 gf'],
        ['hm-m', 'Tee and a towel cape', '티셔츠와 수건 망토', 't-shirt with a felt star emblem, sweatpants, towel tied as a cape', 'f0 F0 gm'],
        ['pt-0', 'Hero suit with emblem, long', '문장 단 히어로 수트 · 긴 기장', 'superhero costume, fitted hero suit, star emblem on the chest, belt, long sleeves, leggings', 'f1 F1 x0 gf v:h-cape-pt'],
        ['pt-1', 'Hero suit with emblem, knee', '문장 단 히어로 수트 · 무릎 기장', 'superhero costume, fitted hero suit, star emblem on the chest, belt, short sleeves, pleated skirt over leggings', 'f1 F1 x1 gf v:h-cape-pt'],
        ['pt-2', 'Hero suit with emblem, short', '문장 단 히어로 수트 · 짧은 기장', 'superhero costume, fitted hero suit, star emblem on the chest, belt, sleeveless, short pleated skirt', 'f1 F1 x2 gf v:h-cape-pt'],
        ['pt-m', 'Hero suit with emblem', '문장 단 히어로 수트', 'superhero costume, fitted hero suit, star emblem on the chest, belt', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless hero suit', '민소매 히어로 수트', 'superhero costume, sleeveless hero suit, star emblem, belt, gauntlets', 'f1 F1 x2 gm'],
        ['ed-0', 'Armored hero suit, long', '갑옷 히어로 수트 · 긴 기장', 'armored superhero suit, metallic emblem, segmented panels, high collar, long sleeves, full length', 'f2 x0 gf v:h-cape-ed n:high'],
        ['ed-1', 'Armored hero suit, knee', '갑옷 히어로 수트 · 무릎 기장', 'armored superhero suit, metallic emblem, segmented panels, cap sleeves, armored skirt', 'f2 x1 gf v:h-cape-ed'],
        ['ed-2', 'Armored hero suit, short', '갑옷 히어로 수트 · 짧은 기장', 'armored superhero suit, metallic emblem, segmented panels, sleeveless, armored short skirt', 'f2 x2 gf v:h-cape-ed'],
        ['ed-m', 'Armored hero suit', '갑옷 히어로 수트', 'armored superhero suit, metallic emblem, segmented panels, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Sleeveless armored hero suit', '민소매 갑옷 히어로 수트', 'armored superhero suit, sleeveless, metallic emblem', 'f2 x2 gm'],
      ],
      structure: [
        ['belt', 'Utility belt', '유틸리티 벨트', 'hero utility belt', ''],
      ],
      foundation: [
        ['tights', 'Hero tights', '히어로 타이츠', 'matching hero tights', 'gf'],
      ],
      neckwear: [
        ['clasp', 'Emblem cape clasp', '문장 망토 고리', 'cape clasp with an emblem', ''],
      ],
      outer: [
        ['cape', 'Short cape', '짧은 망토', 'short cape', ''],
        ['long', 'Long flowing cape', '길게 휘날리는 망토', 'long cape flowing in the wind', 'f1'],
        ['wind', 'Cape snapping in the wind', '바람에 펄럭이는 망토', 'cape billowing dramatically', 'f2'],
      ],
      footwear: [
        ['boots', 'Hero boots', '히어로 부츠', 'knee-high hero boots', ''],
      ],
      headwear: [
        ['mask', 'Domino mask', '눈가면', 'domino mask', ''],
        ['tiara', 'Star tiara', '별 티아라', 'star tiara', 'gf'],
      ],
      accessories: [
        ['gloves', 'Hero gloves', '히어로 장갑', 'hero gloves', ''],
        ['bracers', 'Bracers', '팔목 보호대', 'metal bracers', 'f1'],
        ['fly', 'Floating in the air', '공중에 떠 있음', 'floating in the air', 'f3'],
      ],
      weapon: [
        ['fist', 'Fist raised', '주먹 들기', 'fist raised in the air', ''],
        ['shield', 'Round shield', '둥근 방패', 'holding a round shield with a star', 'f1'],
      ],
      device: [
        ['star', 'Star painted on the cheek', '볼 별 그림', 'small star painted on the cheek', ''],
      ],
    },
  }),

  /* ─── V-42 히어로 · 전사 ─── */
  costume('h-warrior', 'Hero · Warrior', '히어로 · 전사', 'V-42', {
    tag: 'halloween costume, warrior princess costume, armor', tagReal: 'warrior princess, halloween night',
    tagM: 'halloween costume, warrior hero costume, armor', tagRealM: 'warrior hero, halloween night',
    colors: ['gold', 'red', 'royal blue', 'brass', 'silver'],
    need: { accessories: 'bracers' },
    items: {
      garment: [
        ['hm-f', 'Cardboard breastplate and pleated skirt', '골판지 가슴판과 주름치마', 'gold painted cardboard breastplate, red top, blue pleated skirt', 'f0 F0 gf'],
        ['hm-m', 'Cardboard breastplate and shorts', '골판지 가슴판과 반바지', 'gold painted cardboard breastplate, red top, shorts', 'f0 F0 gm'],
        ['pt-0', 'Warrior armor with strip skirt, long', '띠 치마 여전사 갑옷 · 긴 기장', 'warrior costume, gold breastplate, leather strip skirt, armored shoulders, long sleeves, long strip skirt', 'f1 F1 x0 gf v:h-warrior-pt'],
        ['pt-1', 'Warrior armor with strip skirt, knee', '띠 치마 여전사 갑옷 · 무릎 기장', 'warrior costume, gold breastplate, leather strip skirt, armored shoulders, short sleeves, knee-length strip skirt', 'f1 F1 x1 gf v:h-warrior-pt'],
        ['pt-2', 'Warrior armor with strip skirt, short', '띠 치마 여전사 갑옷 · 짧은 기장', 'warrior costume, gold breastplate, leather strip skirt, armored shoulders, sleeveless, short strip skirt', 'f1 F1 x2 gf v:h-warrior-pt'],
        ['pt-m', 'Warrior armor', '전사 갑옷', 'warrior costume, gold breastplate, leather strip kilt, armored shoulders', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless warrior armor', '민소매 전사 갑옷', 'warrior costume, sleeveless gold breastplate, leather strip kilt', 'f1 F1 x2 gm'],
        ['ed-0', 'Gold battle armor gown, long', '금빛 전투 갑옷 드레스 · 긴 기장', 'gold battle armor, eagle-shaped breastplate, flowing red cape lining, long armored skirt, long sleeves', 'f2 x0 gf v:h-warrior-ed'],
        ['ed-1', 'Gold battle armor gown, knee', '금빛 전투 갑옷 드레스 · 무릎 기장', 'gold battle armor, eagle-shaped breastplate, flowing red cape lining, armored skirt, knee length', 'f2 x1 gf v:h-warrior-ed'],
        ['ed-2', 'Gold battle armor gown, short', '금빛 전투 갑옷 드레스 · 짧은 기장', 'gold battle armor, eagle-shaped breastplate, flowing red cape lining, armored corset, short strip skirt', 'f2 x2 gf v:h-warrior-ed'],
        ['ed-m', 'Gold battle armor', '금빛 전투 갑옷', 'gold battle armor, eagle-shaped breastplate, long red cape', 'f2 x01 gm'],
        ['ed-m2', 'Light gold armor', '가벼운 금빛 갑옷', 'light gold armor, sleeveless, leather strip kilt', 'f2 x2 gm'],
      ],
      structure: [
        ['belt', 'Gold belt', '금 벨트', 'wide gold belt', ''],
      ],
      foundation: [
        ['sandal', 'Laced greaves', '끈 정강이받이', 'laced leather greaves', ''],
      ],
      neckwear: [
        ['torc', 'Gold collar', '금 목장식', 'gold collar', ''],
      ],
      outer: [
        ['cape', 'Red cape', '빨간 망토', 'red cape', 'f1'],
      ],
      footwear: [
        ['boots', 'Armored boots', '갑옷 부츠', 'armored knee boots', ''],
        ['sandals', 'Gladiator sandals', '글래디에이터 샌들', 'gladiator sandals', ''],
      ],
      headwear: [
        ['tiara', 'Star tiara', '별 티아라', 'gold tiara with a star', 'gf'],
        ['helm', 'Crested helmet', '깃 장식 투구', 'crested helmet', 'f1'],
      ],
      accessories: [
        ['bracers', 'Silver bracers', '은 팔목 보호대', 'silver bracers', ''],
        ['rope', 'Glowing rope at the hip', '허리의 빛나는 밧줄', 'glowing golden rope at the hip', 'f2'],
      ],
      weapon: [
        ['sword', 'Sword', '검', 'holding a sword', ''],
        ['shield', 'Round shield', '둥근 방패', 'holding a round shield', ''],
        ['toysword', 'Toy sword', '장난감 칼', 'holding a toy sword', 'F1'],
      ],
      device: [
        ['war', 'Gold war paint', '금빛 전투 분장', 'gold paint stripe on the cheek', ''],
      ],
    },
  }),

  /* ─── V-43 신화 · 듀라한 ─── */
  costume('my-dullahan', 'Myth · Dullahan', '신화 · 듀라한', 'V-43', {
    tag: 'halloween costume, dullahan costume, black knight', tagReal: 'dullahan, black knight, halloween night, ghost fire',
    colors: ['black', 'charcoal', 'midnight blue', 'deep purple', 'moss green'],
    need: { weapon: 'helm lantern skull' },
    items: {
      garment: [
        ['hm-f', 'Black dress and a cardboard helmet', '검은 원피스와 골판지 투구', 'black dress, cardboard breastplate painted silver, high collar', 'f0 F0 gf'],
        ['hm-m', 'Black hoodie and cardboard armor', '검은 후드와 골판지 갑옷', 'black hoodie, cardboard breastplate painted silver, black trousers', 'f0 F0 gm'],
        ['pt-0', 'Black knight dress, long', '검은 기사 원피스 · 긴 기장', 'dullahan costume, black armored bodice, very high collar, tattered dark cape, long sleeves, ankle length', 'f1 F1 x0 gf v:my-dullahan-pt n:high'],
        ['pt-1', 'Black knight dress, knee', '검은 기사 원피스 · 무릎 기장', 'dullahan costume, black armored bodice, very high collar, tattered dark cape, long sleeves, knee length', 'f1 F1 x1 gf v:my-dullahan-pt n:high'],
        ['pt-2', 'Black knight dress, short', '검은 기사 원피스 · 짧은 기장', 'dullahan costume, black armored bodice, very high collar, tattered dark cape, armored corset, short tattered skirt', 'f1 F1 x2 gf v:my-dullahan-pt n:high'],
        ['pt-m', 'Black knight armor', '검은 기사 갑옷', 'dullahan costume, black plate armor, very high collar, tattered dark cape', 'f1 F1 x01 gm n:high'],
        ['pt-m2', 'Light black armor', '가벼운 검은 갑옷', 'dullahan costume, sleeveless black armor vest, high collar, tattered cape', 'f1 F1 x2 gm n:high'],
        ['ed-0', 'Spectral black armor gown, long', '유령 같은 검은 갑옷 드레스 · 긴 기장', 'black plate armor gown, green ghost fire along the seams, tall collar, long armored skirt, gauntlets', 'f2 x0 gf v:my-dullahan-ed'],
        ['ed-1', 'Spectral black armor gown, knee', '유령 같은 검은 갑옷 드레스 · 무릎 기장', 'black plate armor gown, green ghost fire along the seams, tall collar, armored skirt, knee length', 'f2 x1 gf v:my-dullahan-ed'],
        ['ed-2', 'Spectral black armor gown, short', '유령 같은 검은 갑옷 드레스 · 짧은 기장', 'black plate armor gown, green ghost fire along the seams, tall collar, armored corset, tattered short skirt', 'f2 x2 gf v:my-dullahan-ed'],
        ['ed-m', 'Spectral black plate armor', '유령 같은 검은 판금 갑옷', 'black plate armor, green ghost fire along the seams, tall collar', 'f2 x01 gm'],
        ['ed-m2', 'Open spectral armor', '풀어 입은 유령 갑옷', 'open black armored coat, green ghost fire trim', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Sword belt', '칼집 벨트', 'black leather sword belt', ''],
      ],
      foundation: [
        ['greaves', 'Black greaves', '검은 정강이받이', 'black armored greaves', ''],
      ],
      neckwear: [
        ['collar', 'Tall armored collar', '높은 갑옷 깃', 'tall armored collar hiding the neck', ''],
      ],
      outer: [
        ['cape', 'Tattered black cape', '해진 검은 망토', 'tattered black cape', 'f1'],
        ['smoke', 'Cape trailing ghost fire', '도깨비불 흘리는 망토', 'cape trailing green ghost fire', 'f3'],
      ],
      footwear: [
        ['boots', 'Armored boots', '갑옷 부츠', 'black armored boots', ''],
      ],
      headwear: [
        ['veil', 'Black veil', '검은 베일', 'black lace veil', 'gf'],
        ['hood', 'Deep hood', '깊은 후드', 'deep black hood', 'f1'],
      ],
      accessories: [
        ['gauntlets', 'Black gauntlets', '검은 건틀릿', 'black gauntlets', ''],
        ['horse', 'Spectral black horse behind', '뒤의 유령 검은 말', 'spectral black horse behind', 'f3 c:animal'],
        ['wisp', 'Ghost fire wisps', '도깨비불', 'green ghost fire wisps floating around', 'f2'],
      ],
      weapon: [
        ['helm', 'Helmet under the arm', '옆구리에 낀 투구', 'black knight helmet tucked under the arm', ''],
        ['lantern', 'Skull lantern', '해골 등불', 'holding a lantern made from a skull, green flame inside', ''],
        ['skull', 'Carved skull', '조각한 해골', 'holding a carved skull ornament', ''],
        ['sword', 'Black sword', '검은 검', 'holding a black sword', 'f2'],
      ],
      device: [
        ['pale', 'Pale makeup', '창백한 분장', 'pale skin makeup', ''],
        ['eyes', 'Glowing green eyes', '초록으로 빛나는 눈', 'glowing green eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-44 신화 · 죽음의 신 ─── */
  costume('my-death', 'Myth · Death', '신화 · 죽음의 신', 'V-44', {
    tag: 'halloween costume, goddess of death costume, skulls', tagReal: 'goddess of death, halloween night',
    tagM: 'halloween costume, god of death costume, skulls', tagRealM: 'god of death, halloween night',
    colors: ['black', 'bone white', 'charcoal', 'deep purple', 'gold'],
    need: { headwear: 'crown horns veil' },
    items: {
      garment: [
        ['hm-f', 'Black dress and a paper skull crown', '검은 원피스와 종이 해골 관', 'long black dress, white bones painted on the sleeves', 'f0 F0 gf'],
        ['hm-m', 'Black robe and painted bones', '검은 로브와 그린 뼈', 'black robe, white bones painted on the sleeves', 'f0 F0 gm'],
        ['pt-0', 'Death goddess gown, long', '죽음의 여신 드레스 · 긴 기장', 'goddess of death costume, black gown, bone white trim, skull clasp, long sleeves, floor length', 'f1 F1 x0 gf v:my-death-pt'],
        ['pt-1', 'Death goddess gown, knee', '죽음의 여신 드레스 · 무릎 기장', 'goddess of death costume, black gown, bone white trim, skull clasp, cap sleeves, knee length', 'f1 F1 x1 gf v:my-death-pt'],
        ['pt-2', 'Death goddess gown, short', '죽음의 여신 드레스 · 짧은 기장', 'goddess of death costume, black gown, bone white trim, skull clasp, corset bodice, high slit', 'f1 F1 x2 gf v:my-death-pt'],
        ['pt-m', 'Death god robe', '죽음의 신 로브', 'god of death costume, black robe, bone white trim, skull clasp', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open death god robe', '풀어 입은 죽음의 신 로브', 'god of death costume, open black robe, bone white sash', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Bone-embellished death gown, long', '뼈 장식 죽음의 드레스 · 긴 기장', 'goddess of death, black gown, bone-shaped beading, layered sheer black veil skirt, gold trim, high collar, long sleeves, sweeping train', 'f2 x0 gf v:my-death-ed n:high'],
        ['ed-1', 'Bone-embellished death gown, knee', '뼈 장식 죽음의 드레스 · 무릎 기장', 'goddess of death, black gown, bone-shaped beading, layered sheer black veil skirt, gold trim, off-shoulder, knee length', 'f2 x1 gf v:my-death-ed n:low'],
        ['ed-2', 'Bone-embellished death gown, short', '뼈 장식 죽음의 드레스 · 짧은 기장', 'goddess of death, black gown, bone-shaped beading, layered sheer black veil skirt, gold trim, corset bodice with bone beading, high slit', 'f2 x2 gf v:my-death-ed'],
        ['ed-m', 'Bone-embellished robe', '뼈 장식 로브', 'god of death, black robe, bone-shaped beading, gold trim, high collar', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open bone-embellished robe', '풀어 입은 뼈 장식 로브', 'god of death, open black robe, bone beading, gold sash', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['skull', 'Skull belt', '해골 벨트', 'belt with small skull ornaments', ''],
        ['gold', 'Gold sash', '금 허리끈', 'gold sash', ''],
      ],
      foundation: [
        ['black', 'Black stockings', '검은 스타킹', 'black stockings', 'gf'],
      ],
      neckwear: [
        ['bones', 'Bone collar', '뼈 목장식', 'collar of small carved bones', ''],
        ['skull', 'Skull pendant', '해골 펜던트', 'skull pendant', ''],
      ],
      outer: [
        ['veil', 'Long black veil cape', '긴 검은 베일 망토', 'long sheer black veil draped as a cape', 'f1'],
        ['wings', 'Black feathered wings', '검은 깃털 날개', 'black feathered wings costume on the back', 'f2'],
      ],
      footwear: [
        ['boots', 'Black boots', '검은 부츠', 'black boots', ''],
        ['sandals', 'Black strappy sandals', '검은 끈 샌들', 'black strappy sandals', 'gf'],
      ],
      headwear: [
        ['crown', 'Skull crown', '해골 관', 'crown made of small skulls', ''],
        ['horns', 'Antler headdress', '사슴뿔 머리쓰개', 'black antler headdress', 'f2'],
        ['veil', 'Black veil', '검은 베일', 'black lace veil', 'gf'],
      ],
      accessories: [
        ['gloves', 'Skeleton hand gloves', '뼈 손 장갑', 'gloves printed with skeleton hands', ''],
        ['raven', 'Raven on the shoulder', '어깨 위 까마귀', 'raven perched on the shoulder', 'f2 c:animal'],
        ['souls', 'Floating spirit lights', '떠도는 넋불', 'small pale spirit lights floating around', 'f3'],
      ],
      weapon: [
        ['scythe', 'Scythe', '낫', 'holding a tall scythe', ''],
        ['skull', 'Skull in hand', '손에 든 해골', 'holding a skull', ''],
        ['hourglass', 'Hourglass', '모래시계', 'holding an hourglass', ''],
      ],
      device: [
        ['skull', 'Half skull face paint', '반쪽 해골 분장', 'half-face skull face paint', ''],
        ['dark', 'Dark eye makeup', '짙은 눈 분장', 'dark eye makeup', ''],
        ['eyes', 'Glowing white eyes', '희게 빛나는 눈', 'glowing white eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-45 신화 · 저승의 군주 ─── */
  costume('my-underworld', 'Myth · Underworld Ruler', '신화 · 저승의 군주', 'V-45', {
    tag: 'halloween costume, queen of the underworld, pomegranate', tagReal: 'queen of the underworld, halloween night',
    tagM: 'halloween costume, king of the underworld, pomegranate', tagRealM: 'king of the underworld, halloween night',
    colors: ['black', 'burgundy', 'crimson', 'gold', 'deep purple'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Red dress and a paper crown', '빨간 원피스와 종이 관', 'deep red dress, black shawl, paper crown painted gold', 'f0 F0 gf'],
        ['hm-m', 'Black shirt and a paper crown', '검은 셔츠와 종이 관', 'black shirt, deep red sash, paper crown painted gold', 'f0 F0 gm'],
        ['pt-0', 'Underworld queen gown, long', '저승의 여왕 드레스 · 긴 기장', 'queen of the underworld costume, black and deep red gown, pomegranate embroidery, gold trim, long sleeves, floor length', 'f1 F1 x0 gf v:my-underworld-pt'],
        ['pt-1', 'Underworld queen gown, knee', '저승의 여왕 드레스 · 무릎 기장', 'queen of the underworld costume, black and deep red gown, pomegranate embroidery, gold trim, cap sleeves, knee length', 'f1 F1 x1 gf v:my-underworld-pt'],
        ['pt-2', 'Underworld queen gown, short', '저승의 여왕 드레스 · 짧은 기장', 'queen of the underworld costume, black and deep red gown, pomegranate embroidery, gold trim, corset bodice, high slit', 'f1 F1 x2 gf v:my-underworld-pt'],
        ['pt-m', 'Underworld king robe', '저승의 왕 로브', 'king of the underworld costume, black and deep red robe, pomegranate embroidery, gold trim', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open underworld robe', '풀어 입은 저승 로브', 'king of the underworld costume, open black robe, deep red sash, gold trim', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Draped underworld gown, long', '드레이프 저승 드레스 · 긴 기장', 'queen of the underworld, draped black silk gown, deep red lining, gold pomegranate brooch, high neck, long sleeves, long train', 'f2 x0 gf v:my-underworld-ed n:high'],
        ['ed-1', 'Draped underworld gown, knee', '드레이프 저승 드레스 · 무릎 기장', 'queen of the underworld, draped black silk gown, deep red lining, gold pomegranate brooch, one shoulder, knee length', 'f2 x1 gf v:my-underworld-ed'],
        ['ed-2', 'Draped underworld gown, short', '드레이프 저승 드레스 · 짧은 기장', 'queen of the underworld, draped black silk gown, deep red lining, gold pomegranate brooch, plunging neckline, thigh slit', 'f2 x2 gf v:my-underworld-ed n:low'],
        ['ed-m', 'Draped underworld robe', '드레이프 저승 로브', 'king of the underworld, draped black robe, deep red lining, gold pomegranate brooch', 'f2 x01 gm'],
        ['ed-m2', 'Open draped robe', '풀어 입은 드레이프 로브', 'king of the underworld, open draped black robe, gold arm cuffs', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['gold', 'Gold cord belt', '금 끈 벨트', 'gold cord belt', ''],
      ],
      foundation: [
        ['black', 'Black stockings', '검은 스타킹', 'black stockings', 'gf'],
      ],
      neckwear: [
        ['pomegranate', 'Pomegranate pendant', '석류 펜던트', 'gold pomegranate pendant', ''],
      ],
      outer: [
        ['cloak', 'Black and red cloak', '검정 빨강 망토', 'black cloak, deep red lining', 'f1'],
      ],
      footwear: [
        ['sandals', 'Gold sandals', '금 샌들', 'gold sandals', ''],
        ['boots', 'Black boots', '검은 부츠', 'black boots', ''],
      ],
      headwear: [
        ['crown', 'Dark flower crown', '검은 꽃관', 'crown of dark red flowers', ''],
        ['gold', 'Gold spiked crown', '금 가시관', 'gold spiked crown', 'f1'],
        ['veil', 'Red veil', '붉은 베일', 'sheer deep red veil', 'gf'],
      ],
      accessories: [
        ['cuffs', 'Gold arm cuffs', '금 팔찌', 'gold arm cuffs', ''],
        ['flowers', 'Withered flowers blooming', '시든 꽃이 피어남', 'withered flowers blooming at the feet', 'f3'],
      ],
      weapon: [
        ['pomegranate', 'Pomegranate', '석류', 'holding a split pomegranate', ''],
        ['skull', 'Gold skull goblet', '금 해골 잔', 'holding a gold goblet shaped like a skull', ''],
        ['staff', 'Two-pronged staff', '두 갈래 지팡이', 'holding a two-pronged black staff', 'f2'],
      ],
      device: [
        ['gold', 'Gold eye paint', '금빛 눈 분장', 'gold paint around the eyes', ''],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-46 신화 · 발할라의 전사 ─── */
  costume('my-valkyrie', 'Myth · Valhalla Warrior', '신화 · 발할라의 전사', 'V-46', {
    tag: 'halloween costume, valkyrie costume', tagReal: 'valkyrie, halloween night, stormy sky',
    tagM: 'halloween costume, norse warrior costume, winged helmet', tagRealM: 'norse warrior, halloween night, stormy sky',
    colors: ['silver', 'white', 'sky blue', 'gold', 'navy'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'White dress and a foil winged helmet', '흰 원피스와 은박 날개 투구', 'white dress, cardboard breastplate wrapped in foil', 'f0 F0 gf'],
        ['hm-m', 'White tunic and foil armor', '흰 튜닉과 은박 갑옷', 'white tunic, cardboard breastplate wrapped in foil, trousers', 'f0 F0 gm'],
        ['pt-0', 'Valkyrie armor dress, long', '발키리 갑옷 원피스 · 긴 기장', 'valkyrie costume, silver breastplate, white dress, fur-trimmed cape, long sleeves, long skirt', 'f1 F1 x0 gf v:my-valkyrie-pt'],
        ['pt-1', 'Valkyrie armor dress, knee', '발키리 갑옷 원피스 · 무릎 기장', 'valkyrie costume, silver breastplate, white dress, fur-trimmed cape, short sleeves, knee length', 'f1 F1 x1 gf v:my-valkyrie-pt'],
        ['pt-2', 'Valkyrie armor dress, short', '발키리 갑옷 원피스 · 짧은 기장', 'valkyrie costume, silver breastplate, white dress, fur-trimmed cape, sleeveless, short skirt', 'f1 F1 x2 gf v:my-valkyrie-pt'],
        ['pt-m', 'Norse warrior armor', '북방 전사 갑옷', 'norse warrior costume, silver breastplate, white tunic, fur-trimmed cape', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless norse armor', '민소매 북방 전사 갑옷', 'norse warrior costume, sleeveless silver breastplate, leather trousers', 'f1 F1 x2 gm'],
        ['ed-0', 'Feathered silver armor gown, long', '깃털 은빛 갑옷 드레스 · 긴 기장', 'valkyrie, silver plate armor, white feathers at the shoulders, long white skirt, long sleeves, floor length', 'f2 x0 gf v:my-valkyrie-ed'],
        ['ed-1', 'Feathered silver armor gown, knee', '깃털 은빛 갑옷 드레스 · 무릎 기장', 'valkyrie, silver plate armor, white feathers at the shoulders, long white skirt, cap sleeves, knee length', 'f2 x1 gf v:my-valkyrie-ed'],
        ['ed-2', 'Feathered silver armor gown, short', '깃털 은빛 갑옷 드레스 · 짧은 기장', 'valkyrie, silver plate armor, white feathers at the shoulders, long white skirt, armored corset, short skirt', 'f2 x2 gf v:my-valkyrie-ed'],
        ['ed-m', 'Feathered silver armor', '깃털 은빛 갑옷', 'norse warrior, silver plate armor, white feathers at the shoulders, long white cape', 'f2 x01 gm'],
        ['ed-m2', 'Light feathered armor', '가벼운 깃털 갑옷', 'norse warrior, light silver armor, sleeveless, white feather mantle', 'f2 x2 gm'],
      ],
      structure: [
        ['belt', 'Braided leather belt', '땋은 가죽 벨트', 'braided leather belt', ''],
      ],
      foundation: [
        ['wraps', 'Leg wraps', '다리 감개', 'leather leg wraps', ''],
      ],
      neckwear: [
        ['torc', 'Silver torc', '은 목걸이', 'silver torc', ''],
      ],
      outer: [
        ['cape', 'Fur-trimmed cape', '털 장식 망토', 'white cape with fur trim', 'f1'],
        ['wings', 'White feathered wings', '흰 깃털 날개', 'large white feathered wings costume on the back', 'f2'],
      ],
      footwear: [
        ['boots', 'Fur boots', '털 부츠', 'fur-trimmed leather boots', ''],
      ],
      headwear: [
        ['helm', 'Winged helmet', '날개 투구', 'silver helmet with white wings', ''],
        ['circlet', 'Winged circlet', '날개 머리띠', 'silver circlet with small wings', 'gf'],
      ],
      accessories: [
        ['bracers', 'Silver bracers', '은 팔목 보호대', 'silver bracers', ''],
        ['ravens', 'Two ravens', '까마귀 두 마리', 'two ravens flying beside', 'f2 c:animal'],
        ['light', 'Light breaking through clouds', '구름 사이 빛', 'beams of light breaking through clouds behind', 'f3'],
      ],
      weapon: [
        ['spear', 'Spear', '창', 'holding a spear', ''],
        ['shield', 'Round shield', '둥근 방패', 'holding a round wooden shield', ''],
        ['toyspear', 'Toy spear', '장난감 창', 'holding a toy spear', 'F1'],
      ],
      device: [
        ['war', 'Blue war paint stripes', '파란 전투 분장', 'blue war paint stripes on the cheeks', ''],
      ],
    },
  }),

  /* ─── V-47 신화 · 통곡의 넋 ─── */
  costume('my-banshee', 'Myth · Wailing Spirit', '신화 · 통곡의 넋', 'V-47', {
    tag: 'halloween costume, banshee costume, ghost', tagReal: 'banshee, halloween night, misty moors',
    tagM: 'halloween costume, wailing ghost costume', tagRealM: 'wailing ghost, halloween night, misty moors',
    colors: ['bone white', 'grey', 'pearl white', 'lavender', 'sky blue'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Grey nightgown and a gauze veil', '회색 잠옷과 거즈 베일', 'long grey nightgown, gauze strips hanging from the sleeves', 'f0 F0 gf'],
        ['hm-m', 'Grey robe and gauze strips', '회색 로브와 거즈', 'long grey robe, gauze strips hanging from the sleeves', 'f0 F0 gm'],
        ['pt-0', 'Tattered banshee gown, long', '해진 밴시 드레스 · 긴 기장', 'banshee costume, tattered grey gown, long trailing sleeves, ragged hem, long sleeves, floor length', 'f1 F1 x0 gf v:my-banshee-pt'],
        ['pt-1', 'Tattered banshee gown, knee', '해진 밴시 드레스 · 무릎 기장', 'banshee costume, tattered grey gown, long trailing sleeves, ragged hem, long sleeves, knee length', 'f1 F1 x1 gf v:my-banshee-pt'],
        ['pt-2', 'Tattered banshee gown, short', '해진 밴시 드레스 · 짧은 기장', 'banshee costume, tattered grey gown, long trailing sleeves, ragged hem, off-shoulder, short ragged skirt', 'f1 F1 x2 gf v:my-banshee-pt n:low'],
        ['pt-m', 'Tattered spirit robe', '해진 넋 로브', 'wailing ghost costume, tattered grey robe, long trailing sleeves, ragged hem', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open tattered robe', '풀어 입은 해진 로브', 'wailing ghost costume, open tattered grey robe, ragged hem', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Layered mist gown, long', '안개 같은 겹 드레스 · 긴 기장', 'banshee, layered sheer grey chiffon gown, edges fading like mist, high collar, long sleeves, floor length', 'f2 x0 gf v:my-banshee-ed n:high'],
        ['ed-1', 'Layered mist gown, knee', '안개 같은 겹 드레스 · 무릎 기장', 'banshee, layered sheer grey chiffon gown, edges fading like mist, long sleeves, knee length', 'f2 x1 gf v:my-banshee-ed'],
        ['ed-2', 'Layered mist gown, short', '안개 같은 겹 드레스 · 짧은 기장', 'banshee, layered sheer grey chiffon gown, edges fading like mist, off-shoulder, short layered skirt', 'f2 x2 gf v:my-banshee-ed n:low'],
        ['ed-m', 'Layered mist robe', '안개 같은 겹 로브', 'wailing ghost, layered sheer grey robe, edges fading like mist', 'f2 x01 gm'],
        ['ed-m2', 'Open mist robe', '풀어 입은 안개 로브', 'wailing ghost, open sheer grey robe, edges fading like mist', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['sash', 'Tattered sash', '해진 허리끈', 'tattered grey sash', ''],
      ],
      foundation: [],
      neckwear: [
        ['locket', 'Old locket', '낡은 로켓 목걸이', 'old silver locket', ''],
      ],
      outer: [
        ['shawl', 'Long grey shawl', '긴 회색 숄', 'long tattered grey shawl', 'f1'],
      ],
      footwear: [
        ['bare', 'Barefoot', '맨발', 'barefoot', ''],
        ['float', 'Floating above the ground', '땅 위에 떠 있음', 'barefoot, floating above the ground', 'f3'],
      ],
      headwear: [
        ['veil', 'Long trailing veil', '길게 끌리는 베일', 'long trailing grey veil', ''],
        ['hood', 'Tattered hood', '해진 두건', 'tattered grey hood', ''],
      ],
      accessories: [
        ['mist', 'Mist swirling around', '휘감기는 안개', 'mist swirling around', 'f2'],
        ['wisps', 'Pale wisps', '창백한 넋불', 'pale wisps floating around', 'f3'],
      ],
      weapon: [
        ['mirror', 'Old hand mirror', '낡은 손거울', 'holding an old silver hand mirror', ''],
        ['lantern', 'Dim lantern', '흐린 등불', 'holding a dim lantern', ''],
        ['skull', 'Small skull', '작은 해골', 'holding a small skull', ''],
      ],
      device: [
        ['pale', 'Pale makeup', '창백한 분장', 'pale skin makeup', ''],
        ['tears', 'Painted grey tears', '그린 회색 눈물', 'painted grey tear streaks', ''],
        ['eyes', 'Glowing pale eyes', '희게 빛나는 눈', 'glowing pale eyes', 'f3'],
      ],
    },
  }),
  /* ─── V-48 천사 · 순백 ─── */
  costume('an-white', 'Angel · Pure White', '천사 · 순백', 'V-48', {
    tag: 'halloween costume, angel costume, halo, feathered wings', tagReal: 'angel, halloween night, glowing halo',
    colors: ['white', 'pearl white', 'gold', 'cream', 'sky blue'],
    need: { headwear: '', accessories: 'wings bigwings' },
    items: {
      garment: [
        ['hm-f', 'White dress with paper wings', '종이 날개 단 흰 원피스', 'white dress, tinsel halo on a headband, paper wings', 'f0 F0 gf'],
        ['hm-m', 'White shirt with paper wings', '종이 날개 단 흰 셔츠', 'white shirt, white trousers, paper wings', 'f0 F0 gm'],
        ['pt-0', 'White angel dress, long', '흰 천사 원피스 · 긴 기장', 'angel costume, white dress, gold trim, soft feathered collar, long sleeves, floor length', 'f1 F1 x0 gf v:an-white-pt'],
        ['pt-1', 'White angel dress, knee', '흰 천사 원피스 · 무릎 기장', 'angel costume, white dress, gold trim, soft feathered collar, puff sleeves, knee length', 'f1 F1 x1 gf v:an-white-pt'],
        ['pt-2', 'White angel dress, short', '흰 천사 원피스 · 짧은 기장', 'angel costume, white dress, gold trim, soft feathered collar, off-shoulder, short layered skirt', 'f1 F1 x2 gf v:an-white-pt n:low'],
        ['pt-m', 'White angel robe', '흰 천사 로브', 'angel costume, white robe, gold trim, gold sash', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless angel tunic', '민소매 천사 튜닉', 'angel costume, sleeveless white tunic, gold cord belt', 'f1 F1 x2 gm'],
        ['ed-0', 'Gold-trimmed angel gown, long', '금테 천사 드레스 · 긴 기장', 'angel, flowing white chiffon gown, gold embroidery, layered feathers at the shoulders, high collar, long sleeves, sweeping train', 'f2 x0 gf v:an-white-ed n:high'],
        ['ed-1', 'Gold-trimmed angel gown, knee', '금테 천사 드레스 · 무릎 기장', 'angel, flowing white chiffon gown, gold embroidery, layered feathers at the shoulders, cap sleeves, knee length', 'f2 x1 gf v:an-white-ed'],
        ['ed-2', 'Gold-trimmed angel gown, short', '금테 천사 드레스 · 짧은 기장', 'angel, flowing white chiffon gown, gold embroidery, layered feathers at the shoulders, corset bodice, high slit', 'f2 x2 gf v:an-white-ed'],
        ['ed-m', 'Gold-trimmed angel robe', '금테 천사 로브', 'angel, flowing white robe, gold embroidery, feather mantle', 'f2 x01 gm'],
        ['ed-m2', 'Open angel robe', '풀어 입은 천사 로브', 'angel, open white robe, gold arm cuffs, feather mantle', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['gold', 'Gold cord belt', '금 끈 벨트', 'gold cord belt', ''],
      ],
      foundation: [
        ['white', 'White stockings', '흰 스타킹', 'white stockings', 'gf'],
      ],
      neckwear: [
        ['star', 'Star pendant', '별 펜던트', 'small gold star pendant', ''],
      ],
      outer: [
        ['capelet', 'Feather capelet', '깃털 케이플릿', 'white feather capelet', 'f1'],
      ],
      footwear: [
        ['sandals', 'Gold sandals', '금 샌들', 'gold sandals', ''],
        ['boots', 'White boots', '흰 부츠', 'white boots', ''],
      ],
      headwear: [
        ['halo', 'Halo', '후광', 'golden halo', ''],
        ['hm-halo', 'Tinsel halo', '반짝이 후광', 'tinsel halo on a headband', 'F0'],
      ],
      accessories: [
        ['wings', 'Feathered wings', '깃털 날개', 'white feathered wings costume on the back', ''],
        ['bigwings', 'Large feathered wings', '커다란 깃털 날개', 'large white feathered wings costume on the back', 'f2'],
        ['light', 'Soft light from above', '위에서 내리는 빛', 'soft light falling from above', 'f3'],
      ],
      weapon: [
        ['harp', 'Small harp', '작은 하프', 'holding a small golden harp', ''],
        ['feather', 'White feather', '흰 깃털', 'holding a white feather', ''],
        ['bucket', 'Cloud candy bucket', '구름 사탕 바구니', 'holding a cloud-shaped candy bucket', ''],
        ['dove', 'White dove companion', '곁에 있는 흰 새', 'a real white dove perched beside the angel', 'f1 c:animal'],
      ],
      device: [
        ['gold', 'Gold glitter', '금 반짝이', 'gold glitter on the cheekbones', ''],
        ['eyes', 'Glowing gold eyes', '금빛 눈', 'glowing gold eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-49 천사 · 타락 ─── */
  costume('an-fallen', 'Angel · Fallen', '천사 · 타락', 'V-49', {
    tag: 'halloween costume, fallen angel costume, black wings', tagReal: 'fallen angel, halloween night, falling black feathers',
    colors: ['black', 'charcoal', 'crimson', 'deep purple', 'silver'],
    need: { accessories: 'wings bigwings' },
    items: {
      garment: [
        ['hm-f', 'Black dress with paper wings', '종이 날개 단 검은 원피스', 'black dress, black paper wings, bent tinsel halo', 'f0 F0 gf'],
        ['hm-m', 'Black shirt with paper wings', '종이 날개 단 검은 셔츠', 'black shirt, black trousers, black paper wings', 'f0 F0 gm'],
        ['pt-0', 'Fallen angel dress, long', '타락천사 원피스 · 긴 기장', 'fallen angel costume, black dress, torn feather trim, silver accents, long sleeves, floor length', 'f1 F1 x0 gf v:an-fallen-pt'],
        ['pt-1', 'Fallen angel dress, knee', '타락천사 원피스 · 무릎 기장', 'fallen angel costume, black dress, torn feather trim, silver accents, short sleeves, knee length', 'f1 F1 x1 gf v:an-fallen-pt'],
        ['pt-2', 'Fallen angel dress, short', '타락천사 원피스 · 짧은 기장', 'fallen angel costume, black dress, torn feather trim, silver accents, corset bodice, short tattered skirt', 'f1 F1 x2 gf v:an-fallen-pt'],
        ['pt-m', 'Fallen angel coat', '타락천사 코트', 'fallen angel costume, black coat, torn feather trim, silver accents', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open fallen angel shirt', '풀어 헤친 타락천사 셔츠', 'fallen angel costume, open black shirt, feather collar', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Black feather gown, long', '검은 깃털 드레스 · 긴 기장', 'fallen angel, black chiffon gown, layered black feathers, cracked silver trim, high collar, long sleeves, floor length', 'f2 x0 gf v:an-fallen-ed n:high'],
        ['ed-1', 'Black feather gown, knee', '검은 깃털 드레스 · 무릎 기장', 'fallen angel, black chiffon gown, layered black feathers, cracked silver trim, off-shoulder, knee length', 'f2 x1 gf v:an-fallen-ed n:low'],
        ['ed-2', 'Black feather gown, short', '검은 깃털 드레스 · 짧은 기장', 'fallen angel, black chiffon gown, layered black feathers, cracked silver trim, corset bodice, high slit', 'f2 x2 gf v:an-fallen-ed'],
        ['ed-m', 'Black feather coat', '검은 깃털 코트', 'fallen angel, long black coat, layered black feathers at the shoulders, cracked silver trim', 'f2 x01 gm'],
        ['ed-m2', 'Open black feather coat', '풀어 입은 검은 깃털 코트', 'fallen angel, open black coat, black feather mantle', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Silver buckle belt', '은 버클 벨트', 'silver buckle belt', ''],
      ],
      foundation: [
        ['black', 'Black stockings', '검은 스타킹', 'black stockings', 'gf'],
      ],
      neckwear: [
        ['choker', 'Black feather choker', '검은 깃털 초커', 'black feather choker', ''],
      ],
      outer: [
        ['cape', 'Torn black cape', '찢긴 검은 망토', 'torn black cape', 'f1'],
      ],
      footwear: [
        ['boots', 'Black boots', '검은 부츠', 'black knee boots', ''],
      ],
      headwear: [
        ['halo', 'Broken halo', '깨진 후광', 'cracked dark halo', ''],
        ['horns', 'Small black horns', '작은 검은 뿔', 'small black horn headband', 'f1'],
      ],
      accessories: [
        ['wings', 'Black feathered wings', '검은 깃털 날개', 'black feathered wings costume on the back', ''],
        ['bigwings', 'Large black wings', '커다란 검은 날개', 'large black feathered wings costume on the back', 'f2'],
        ['feathers', 'Falling black feathers', '떨어지는 검은 깃털', 'black feathers falling around', 'f3'],
      ],
      weapon: [
        ['sword', 'Black sword', '검은 검', 'holding a black sword', 'f2'],
        ['feather', 'Black feather', '검은 깃털', 'holding a black feather', ''],
        ['rose', 'Black rose', '검은 장미', 'holding a black rose', ''],
      ],
      device: [
        ['dark', 'Dark eye makeup', '짙은 눈 분장', 'dark eye makeup', ''],
        ['eyes', 'Glowing red eyes', '붉게 빛나는 눈', 'glowing red eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-50 천사 · 아이돌 ─── */
  costume('an-idol', 'Angel · Idol', '천사 · 아이돌', 'V-50', {
    tag: 'halloween costume, angel costume, idol, halo', tagReal: 'angel idol, halloween night, stage lights',
    colors: ['pastel pink', 'white', 'sky blue', 'lavender', 'butter yellow'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Pastel dress with a tinsel halo', '반짝이 후광과 파스텔 원피스', 'pastel dress, tinsel halo on a headband, small paper wings', 'f0 F0 gf'],
        ['hm-m', 'Pastel shirt with a tinsel halo', '반짝이 후광과 파스텔 셔츠', 'pastel shirt, white trousers, tinsel halo on a headband', 'f0 F0 gm'],
        ['pt-0', 'Angel idol stage dress, long', '천사 아이돌 무대 의상 · 긴 기장', 'angel idol, pastel stage dress, tiny wing patches, ribbon trim, heart buttons, long puff sleeves, long tiered skirt', 'f1 F1 x0 gf v:an-idol-pt'],
        ['pt-1', 'Angel idol stage dress, knee', '천사 아이돌 무대 의상 · 무릎 기장', 'angel idol, pastel stage dress, tiny wing patches, ribbon trim, heart buttons, puff sleeves, knee-length tiered skirt', 'f1 F1 x1 gf v:an-idol-pt'],
        ['pt-2', 'Angel idol stage dress, short', '천사 아이돌 무대 의상 · 짧은 기장', 'angel idol, pastel stage dress, tiny wing patches, ribbon trim, heart buttons, off-shoulder, short tiered skirt', 'f1 F1 x2 gf v:an-idol-pt n:low'],
        ['pt-m', 'Angel idol jacket', '천사 아이돌 재킷', 'angel idol, pastel stage jacket, tiny wing patches, slim trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open angel idol jacket', '풀어 입은 천사 아이돌 재킷', 'angel idol, open pastel jacket, white tank top, slim trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Feathered idol dress, long', '깃털 아이돌 원피스 · 긴 기장', 'angel idol dress, layered pastel tulle, feather trim, pearl beads, long sleeves, long skirt', 'f2 x0 gf v:an-idol-ed'],
        ['ed-1', 'Feathered idol dress, knee', '깃털 아이돌 원피스 · 무릎 기장', 'angel idol dress, layered pastel tulle, feather trim, pearl beads, puff sleeves, knee length', 'f2 x1 gf v:an-idol-ed'],
        ['ed-2', 'Feathered idol dress, short', '깃털 아이돌 원피스 · 짧은 기장', 'angel idol dress, layered pastel tulle, feather trim, pearl beads, strapless, short tulle skirt', 'f2 x2 gf v:an-idol-ed n:low'],
        ['ed-m', 'Feathered idol tailcoat', '깃털 아이돌 연미복', 'angel idol tailcoat, feather trim, pearl buttons', 'f2 x01 gm'],
        ['ed-m2', 'Open feathered tailcoat', '풀어 입은 깃털 연미복', 'angel idol, open tailcoat with feather trim, white tank top', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Big back bow', '등 뒤 큰 리본', 'big bow at the back', 'gf'],
      ],
      foundation: [
        ['frill', 'Frilled thighhighs', '프릴 니삭스', 'white frilled thighhighs', 'gf'],
      ],
      neckwear: [
        ['mic', 'Headset mic', '헤드셋 마이크', 'headset microphone', ''],
        ['heart', 'Heart choker', '하트 초커', 'heart choker', ''],
      ],
      outer: [],
      footwear: [
        ['boots', 'White platform boots', '흰 플랫폼 부츠', 'white platform boots', ''],
      ],
      headwear: [
        ['halo', 'Heart halo', '하트 후광', 'heart-shaped halo', ''],
        ['clips', 'Wing hair clips', '날개 머리핀', 'small wing hair clips', ''],
      ],
      accessories: [
        ['wings', 'Small feathered wings', '작은 깃털 날개', 'small white feathered wings costume on the back', ''],
        ['confetti', 'Feather confetti', '깃털 꽃가루', 'white feathers falling like confetti', 'f3'],
      ],
      weapon: [
        ['mic', 'Wing microphone', '날개 마이크', 'holding a microphone with small wings', ''],
        ['heart', 'Heart hands', '손 하트', 'heart hands', ''],
      ],
      device: [
        ['heart', 'Heart sticker under the eye', '볼의 하트 분장 스티커', 'heart sticker under the eye', ''],
        ['glitter', 'Pearl glitter', '진주 반짝이', 'pearl glitter under the eyes', ''],
      ],
    },
  }),

  /* ─── V-51 백조 · 흰 백조 ─── */
  costume('sw-white', 'Swan · White', '백조 · 흰 백조', 'V-51', {
    tag: 'halloween costume, white swan costume, ballet', tagReal: 'white swan, halloween night, moonlit lake',
    colors: ['white', 'pearl white', 'silver', 'sky blue', 'cream'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'White tutu and a feather boa', '흰 튀튀와 깃털 목도리', 'white leotard top, white tulle tutu, white feather boa', 'f0 F0 gf'],
        ['hm-m', 'White shirt and a feather collar', '흰 셔츠와 깃털 깃', 'white shirt, white trousers, white feather collar', 'f0 F0 gm'],
        ['pt-0', 'White swan dress, long', '백조 원피스 · 긴 기장', 'white swan costume, white feather bodice, layered tulle skirt, long sleeves, long romantic tutu', 'f1 F1 x0 gf v:sw-white-pt'],
        ['pt-1', 'White swan dress, knee', '백조 원피스 · 무릎 기장', 'white swan costume, white feather bodice, layered tulle skirt, cap sleeves, knee-length tutu', 'f1 F1 x1 gf v:sw-white-pt'],
        ['pt-2', 'White swan dress, short', '백조 원피스 · 짧은 기장', 'white swan costume, white feather bodice, layered tulle skirt, strapless bodice, short classical tutu', 'f1 F1 x2 gf v:sw-white-pt n:low'],
        ['pt-m', 'White swan prince jacket', '백조 왕자 재킷', 'white swan costume, white fitted jacket, feather epaulettes, white trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless swan top', '민소매 백조 상의', 'white swan costume, sleeveless white top, feather trim, white trousers', 'f1 F1 x2 gm'],
        ['ed-0', 'Feathered swan gown, long', '깃털 백조 드레스 · 긴 기장', 'white swan, feather-covered bodice, layered white tulle, pearl beading, long sheer sleeves, floor length', 'f2 x0 gf v:sw-white-ed'],
        ['ed-1', 'Feathered swan gown, knee', '깃털 백조 드레스 · 무릎 기장', 'white swan, feather-covered bodice, layered white tulle, pearl beading, cap sleeves, knee length', 'f2 x1 gf v:sw-white-ed'],
        ['ed-2', 'Feathered swan gown, short', '깃털 백조 드레스 · 짧은 기장', 'white swan, feather-covered bodice, layered white tulle, pearl beading, strapless feather bodice, short tutu', 'f2 x2 gf v:sw-white-ed n:low'],
        ['ed-m', 'Feathered swan prince coat', '깃털 백조 왕자 코트', 'white swan prince, white tailcoat, feather epaulettes, pearl buttons', 'f2 x01 gm'],
        ['ed-m2', 'Open swan coat', '풀어 입은 백조 코트', 'white swan prince, open white coat, feather mantle', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['ribbon', 'Satin ribbon belt', '새틴 리본 벨트', 'white satin ribbon belt', ''],
      ],
      foundation: [
        ['tights', 'Pink ballet tights', '분홍 발레 타이츠', 'pale pink ballet tights', 'gf'],
        ['white', 'White tights', '흰 타이츠', 'white tights', ''],
      ],
      neckwear: [
        ['pearls', 'Pearl choker', '진주 초커', 'pearl choker', ''],
      ],
      outer: [
        ['feather', 'Feather cape', '깃털 망토', 'white feather cape', 'f1'],
      ],
      footwear: [
        ['pointe', 'Ballet pointe shoes', '발레 토슈즈', 'ballet pointe shoes', 'gf'],
        ['flats', 'White ballet flats', '흰 발레 플랫', 'white ballet flats', ''],
      ],
      headwear: [
        ['feather', 'Feather headpiece', '깃털 머리 장식', 'white feather headpiece', ''],
        ['tiara', 'Pearl tiara', '진주 티아라', 'pearl tiara', 'gf'],
      ],
      accessories: [
        ['gloves', 'White gloves', '흰 장갑', 'white satin gloves', 'f1'],
        ['feathers', 'Drifting feathers', '흩날리는 깃털', 'white feathers drifting around', 'f2'],
        ['swans', 'Swans on the water behind', '뒤의 물 위 백조', 'swans gliding on the water behind', 'f3 c:animal'],
      ],
      weapon: [
        ['pose', 'Ballet pose', '발레 자세', 'ballet pose, arms raised', ''],
        ['rose', 'White rose', '흰 장미', 'holding a white rose', ''],
      ],
      device: [
        ['silver', 'Silver glitter', '은 반짝이', 'silver glitter at the corners of the eyes', ''],
      ],
    },
  }),

  /* ─── V-52 백조 · 흑조 ─── */
  costume('sw-black', 'Swan · Black', '백조 · 흑조', 'V-52', {
    tag: 'halloween costume, black swan costume, ballet', tagReal: 'black swan, halloween night, dark lake',
    colors: ['black', 'charcoal', 'silver', 'crimson', 'midnight blue'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black tutu and a feather boa', '검은 튀튀와 깃털 목도리', 'black leotard top, black tulle tutu, black feather boa', 'f0 F0 gf'],
        ['hm-m', 'Black shirt and a feather collar', '검은 셔츠와 깃털 깃', 'black shirt, black trousers, black feather collar', 'f0 F0 gm'],
        ['pt-0', 'Black swan dress, long', '흑조 원피스 · 긴 기장', 'black swan costume, black feather bodice, layered black tulle skirt, long sleeves, long romantic tutu', 'f1 F1 x0 gf v:sw-black-pt'],
        ['pt-1', 'Black swan dress, knee', '흑조 원피스 · 무릎 기장', 'black swan costume, black feather bodice, layered black tulle skirt, cap sleeves, knee-length tutu', 'f1 F1 x1 gf v:sw-black-pt'],
        ['pt-2', 'Black swan dress, short', '흑조 원피스 · 짧은 기장', 'black swan costume, black feather bodice, layered black tulle skirt, strapless bodice, short classical tutu', 'f1 F1 x2 gf v:sw-black-pt n:low'],
        ['pt-m', 'Black swan jacket', '흑조 재킷', 'black swan costume, black fitted jacket, feather epaulettes, black trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless black swan top', '민소매 흑조 상의', 'black swan costume, sleeveless black top, feather trim, black trousers', 'f1 F1 x2 gm'],
        ['ed-0', 'Feathered black swan gown, long', '깃털 흑조 드레스 · 긴 기장', 'black swan, black feather-covered bodice, layered black tulle, silver beading, long sheer sleeves, floor length', 'f2 x0 gf v:sw-black-ed'],
        ['ed-1', 'Feathered black swan gown, knee', '깃털 흑조 드레스 · 무릎 기장', 'black swan, black feather-covered bodice, layered black tulle, silver beading, cap sleeves, knee length', 'f2 x1 gf v:sw-black-ed'],
        ['ed-2', 'Feathered black swan gown, short', '깃털 흑조 드레스 · 짧은 기장', 'black swan, black feather-covered bodice, layered black tulle, silver beading, strapless feather bodice, short tutu', 'f2 x2 gf v:sw-black-ed n:low'],
        ['ed-m', 'Feathered black swan coat', '깃털 흑조 코트', 'black swan, black tailcoat, feather epaulettes, silver buttons', 'f2 x01 gm'],
        ['ed-m2', 'Open black swan coat', '풀어 입은 흑조 코트', 'black swan, open black coat, black feather mantle', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['ribbon', 'Black satin belt', '검은 새틴 벨트', 'black satin ribbon belt', ''],
      ],
      foundation: [
        ['tights', 'Black tights', '검은 타이츠', 'black tights', ''],
      ],
      neckwear: [
        ['choker', 'Silver choker', '은 초커', 'silver choker', ''],
      ],
      outer: [
        ['feather', 'Black feather cape', '검은 깃털 망토', 'black feather cape', 'f1'],
      ],
      footwear: [
        ['pointe', 'Black pointe shoes', '검은 토슈즈', 'black ballet pointe shoes', 'gf'],
        ['boots', 'Black boots', '검은 부츠', 'black boots', ''],
      ],
      headwear: [
        ['feather', 'Black feather headpiece', '검은 깃털 머리 장식', 'black feather headpiece', ''],
        ['crown', 'Silver crown', '은 관', 'small silver crown', 'f1'],
      ],
      accessories: [
        ['gloves', 'Black gloves', '검은 장갑', 'black satin gloves', 'f1'],
        ['feathers', 'Black feathers drifting', '흩날리는 검은 깃털', 'black feathers drifting around', 'f2'],
        ['swans', 'Black swans behind', '뒤의 흑조', 'black swans gliding on dark water behind', 'f3 c:animal'],
      ],
      weapon: [
        ['pose', 'Ballet pose', '발레 자세', 'ballet pose, arms raised like wings', ''],
        ['rose', 'Black rose', '검은 장미', 'holding a black rose', ''],
      ],
      device: [
        ['wing', 'Winged eye paint', '날개 모양 눈 분장', 'black winged paint around the eyes, silver accents', ''],
        ['eyes', 'Red eyes', '붉은 눈', 'red eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-53 바니걸 · 클래식 ─── */
  costume('bn-classic', 'Bunny Girl · Classic', '바니걸 · 클래식', 'V-53', {
    tag: 'halloween costume, bunny girl', tagReal: 'bunny girl, halloween night',
    tagM: 'halloween costume, bunny boy', tagRealM: 'bunny boy, halloween night',
    colors: ['black', 'red', 'white', 'navy', 'burgundy'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black dress and paper bunny ears', '검은 원피스와 종이 토끼 귀', 'black dress, cotton ball tail sewn on', 'f0 F0 gf'],
        ['hm-m', 'Black vest and paper bunny ears', '검은 조끼와 종이 토끼 귀', 'black vest, white shirt, cotton ball tail sewn on', 'f0 F0 gm'],
        ['pt-0', 'Bunny outfit with tuxedo collar, long', '턱시도 깃 바니 차림 · 긴 기장', 'bunny girl, black satin outfit, white detached collar, bow tie, cotton tail, long sleeve dress, long skirt', 'f1 F1 x0 gf v:bn-classic-pt'],
        ['pt-1', 'Bunny outfit with tuxedo collar, knee', '턱시도 깃 바니 차림 · 무릎 기장', 'bunny girl, black satin outfit, white detached collar, bow tie, cotton tail, satin dress, knee length', 'f1 F1 x1 gf v:bn-classic-pt'],
        ['pt-2', 'Bunny outfit with tuxedo collar, short', '턱시도 깃 바니 차림 · 짧은 기장', 'bunny girl, black satin outfit, white detached collar, bow tie, cotton tail, strapless leotard, sheer pantyhose', 'f1 F1 x2 gf v:bn-classic-pt n:low'],
        ['pt-m', 'Bunny boy tuxedo vest', '바니보이 턱시도 조끼', 'bunny boy, black vest, white detached collar, bow tie, black trousers, cotton tail', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless bunny boy vest', '민소매 바니보이 조끼', 'bunny boy, sleeveless black vest, wrist cuffs, bow tie, black trousers', 'f1 F1 x2 gm'],
        ['ed-0', 'Satin bunny dress, long', '새틴 바니 원피스 · 긴 기장', 'bunny girl, glossy black satin, white wrist cuffs, white collar, red bow tie, high collar, long sleeves, floor length', 'f2 x0 gf v:bn-classic-ed n:high'],
        ['ed-1', 'Satin bunny dress, knee', '새틴 바니 원피스 · 무릎 기장', 'bunny girl, glossy black satin, white wrist cuffs, white collar, red bow tie, cap sleeves, knee length', 'f2 x1 gf v:bn-classic-ed'],
        ['ed-2', 'Satin bunny dress, short', '새틴 바니 원피스 · 짧은 기장', 'bunny girl, glossy black satin, white wrist cuffs, white collar, red bow tie, strapless leotard, sheer pantyhose', 'f2 x2 gf v:bn-classic-ed n:low'],
        ['ed-m', 'Satin bunny tailcoat', '새틴 바니 연미복', 'bunny boy, black satin tailcoat, white collar, red bow tie', 'f2 x01 gm'],
        ['ed-m2', 'Open bunny tailcoat', '풀어 입은 바니 연미복', 'bunny boy, open black tailcoat, white cuffs, bow tie', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Satin belt', '새틴 벨트', 'black satin belt', ''],
      ],
      foundation: [
        ['sheer', 'Sheer pantyhose', '비치는 팬티스타킹', 'sheer black pantyhose', 'gf'],
      ],
      neckwear: [
        ['bow', 'Bow tie and collar', '보타이 깃', 'white detached collar, bow tie', ''],
      ],
      outer: [
        ['tail', 'Tailcoat', '연미복', 'black tailcoat', 'f2'],
      ],
      footwear: [
        ['heels', 'Black heels', '검은 힐', 'black heels', 'gf'],
        ['shoes', 'Patent shoes', '에나멜 구두', 'black patent shoes', ''],
      ],
      headwear: [
        ['ears', 'Bunny ears headband', '토끼 귀 머리띠', 'fake rabbit ears, headband', ''],
      ],
      accessories: [
        ['cuffs', 'White wrist cuffs', '흰 손목 커프스', 'white wrist cuffs', ''],
        ['tail', 'Cotton tail', '솜 꼬리', 'cotton ball bunny tail', ''],
      ],
      weapon: [
        ['tray', 'Tray of drinks', '음료 쟁반', 'holding a tray of drinks', ''],
        ['carrot', 'Carrot', '당근', 'holding a carrot', ''],
      ],
      device: [
        ['wink', 'Wink', '윙크', 'one eye closed, smile', ''],
      ],
    },
  }),

  /* ─── V-54 바니걸 · 파스텔 ─── */
  costume('bn-pastel', 'Bunny Girl · Pastel', '바니걸 · 파스텔', 'V-54', {
    tag: 'halloween costume, bunny costume, pastel', tagReal: 'bunny costume, pastel, halloween night',
    tagM: 'halloween costume, bunny boy, pastel', tagRealM: 'bunny boy, pastel, halloween night',
    colors: ['pastel pink', 'lavender', 'white', 'mint', 'sky blue'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Pink dress and paper ears', '분홍 원피스와 종이 귀', 'pink dress, cotton ball tail sewn on', 'f0 F0 gf'],
        ['hm-m', 'Pink hoodie with felt ears', '펠트 귀 분홍 후드티', 'pink hoodie, felt bunny ears on the hood, shorts', 'f0 F0 gm'],
        ['pt-0', 'Pastel bunny dress, long', '파스텔 토끼 원피스 · 긴 기장', 'bunny costume, pastel frilled dress, puff sleeves, carrot buttons, cotton tail, long sleeves, long skirt', 'f1 F1 x0 gf v:bn-pastel-pt'],
        ['pt-1', 'Pastel bunny dress, knee', '파스텔 토끼 원피스 · 무릎 기장', 'bunny costume, pastel frilled dress, puff sleeves, carrot buttons, cotton tail, puff sleeves, knee length', 'f1 F1 x1 gf v:bn-pastel-pt'],
        ['pt-2', 'Pastel bunny dress, short', '파스텔 토끼 원피스 · 짧은 기장', 'bunny costume, pastel frilled dress, puff sleeves, carrot buttons, cotton tail, off-shoulder, short frilled skirt', 'f1 F1 x2 gf v:bn-pastel-pt n:low'],
        ['pt-m', 'Pastel bunny jacket', '파스텔 토끼 재킷', 'bunny boy, pastel jacket, carrot buttons, shorts, cotton tail', 'f1 F1 x01 gm'],
        ['pt-m2', 'Pastel bunny hoodie vest', '파스텔 토끼 조끼', 'bunny boy, sleeveless pastel hoodie with ears, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Fluffy pastel bunny dress, long', '복슬한 파스텔 토끼 원피스 · 긴 기장', 'bunny costume, fluffy faux fur trim, layered pastel tulle, ribbon bows, long sleeves, long skirt', 'f2 x0 gf v:bn-pastel-ed'],
        ['ed-1', 'Fluffy pastel bunny dress, knee', '복슬한 파스텔 토끼 원피스 · 무릎 기장', 'bunny costume, fluffy faux fur trim, layered pastel tulle, ribbon bows, puff sleeves, knee length', 'f2 x1 gf v:bn-pastel-ed'],
        ['ed-2', 'Fluffy pastel bunny dress, short', '복슬한 파스텔 토끼 원피스 · 짧은 기장', 'bunny costume, fluffy faux fur trim, layered pastel tulle, ribbon bows, strapless, short tulle skirt', 'f2 x2 gf v:bn-pastel-ed n:low'],
        ['ed-m', 'Fluffy pastel bunny coat', '복슬한 파스텔 토끼 코트', 'bunny boy, fluffy pastel coat, faux fur trim, ribbon bow', 'f2 x01 gm'],
        ['ed-m2', 'Open pastel bunny coat', '풀어 입은 파스텔 토끼 코트', 'bunny boy, open fluffy pastel coat, white tank top', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Big back bow', '등 뒤 큰 리본', 'big bow at the back', 'gf'],
      ],
      foundation: [
        ['frill', 'Frilled socks', '프릴 양말', 'frilled socks', 'gf'],
        ['striped', 'Pastel striped socks', '파스텔 줄무늬 양말', 'pastel striped socks', ''],
      ],
      neckwear: [
        ['bow', 'Pastel ribbon', '파스텔 리본', 'pastel neck ribbon', ''],
      ],
      outer: [
        ['capelet', 'Fluffy capelet', '복슬한 케이플릿', 'fluffy faux fur capelet', 'f1'],
      ],
      footwear: [
        ['mary', 'Pastel mary janes', '파스텔 메리제인', 'pastel mary janes', 'gf'],
        ['slippers', 'Bunny slippers', '토끼 슬리퍼', 'bunny slippers', ''],
      ],
      headwear: [
        ['ears', 'Floppy bunny ears', '늘어진 토끼 귀', 'floppy fake rabbit ears, headband', ''],
        ['hood', 'Bunny ear hood', '토끼 귀 후드', 'hood with rabbit ears', ''],
      ],
      accessories: [
        ['tail', 'Cotton tail', '솜 꼬리', 'cotton ball bunny tail', ''],
        ['bag', 'Carrot bag', '당근 가방', 'carrot-shaped shoulder bag', ''],
        ['bunnies', 'Little bunnies hopping', '깡충거리는 아기 토끼', 'little bunnies hopping around', 'f3 c:animal'],
      ],
      weapon: [
        ['carrot', 'Carrot plush', '당근 인형', 'hugging a carrot plush', ''],
        ['bucket', 'Bunny candy bucket', '토끼 사탕 바구니', 'holding a bunny-shaped candy bucket', ''],
      ],
      device: [
        ['nose', 'Painted bunny nose', '그린 토끼 코', 'painted bunny nose', ''],
        ['blush', 'Blush stickers', '볼 스티커', 'blush stickers', ''],
      ],
    },
  }),

  /* ─── V-55 바니걸 · 할로윈 ─── */
  costume('bn-halloween', 'Bunny Girl · Halloween', '바니걸 · 할로윈', 'V-55', {
    tag: 'halloween costume, bunny girl, orange and black', tagReal: 'bunny girl, halloween night, pumpkins',
    tagM: 'halloween costume, bunny boy, orange and black', tagRealM: 'bunny boy, halloween night, pumpkins',
    colors: ['black', 'pumpkin orange', 'deep purple', 'burnt orange'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Black dress with orange ribbon', '주황 리본 검은 원피스', 'black dress, orange ribbon, cotton ball tail sewn on', 'f0 F0 gf'],
        ['hm-m', 'Black vest with an orange tie', '주황 넥타이 검은 조끼', 'black vest, orange necktie, cotton ball tail sewn on', 'f0 F0 gm'],
        ['pt-0', 'Halloween bunny outfit, long', '할로윈 바니 차림 · 긴 기장', 'bunny girl, black satin outfit, orange bow tie, pumpkin buttons, cotton tail, long sleeve dress, long skirt', 'f1 F1 x0 gf v:bn-halloween-pt'],
        ['pt-1', 'Halloween bunny outfit, knee', '할로윈 바니 차림 · 무릎 기장', 'bunny girl, black satin outfit, orange bow tie, pumpkin buttons, cotton tail, satin dress, knee length', 'f1 F1 x1 gf v:bn-halloween-pt'],
        ['pt-2', 'Halloween bunny outfit, short', '할로윈 바니 차림 · 짧은 기장', 'bunny girl, black satin outfit, orange bow tie, pumpkin buttons, cotton tail, strapless leotard, orange trim', 'f1 F1 x2 gf v:bn-halloween-pt n:low'],
        ['pt-m', 'Halloween bunny boy vest', '할로윈 바니보이 조끼', 'bunny boy, black vest, orange bow tie, pumpkin buttons, black trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless halloween bunny vest', '민소매 할로윈 바니 조끼', 'bunny boy, sleeveless black vest, orange cuffs, black trousers', 'f1 F1 x2 gm'],
        ['ed-0', 'Pumpkin bunny dress, long', '호박 바니 원피스 · 긴 기장', 'bunny girl, black satin, orange pumpkin skirt, bat-shaped bow tie, long sleeves, long skirt', 'f2 x0 gf v:bn-halloween-ed'],
        ['ed-1', 'Pumpkin bunny dress, knee', '호박 바니 원피스 · 무릎 기장', 'bunny girl, black satin, orange pumpkin skirt, bat-shaped bow tie, cap sleeves, knee length', 'f2 x1 gf v:bn-halloween-ed'],
        ['ed-2', 'Pumpkin bunny dress, short', '호박 바니 원피스 · 짧은 기장', 'bunny girl, black satin, orange pumpkin skirt, bat-shaped bow tie, strapless leotard, orange tulle overskirt', 'f2 x2 gf v:bn-halloween-ed n:low'],
        ['ed-m', 'Pumpkin bunny tailcoat', '호박 바니 연미복', 'bunny boy, black tailcoat with orange lining, bat-shaped bow tie', 'f2 x01 gm'],
        ['ed-m2', 'Open pumpkin bunny tailcoat', '풀어 입은 호박 바니 연미복', 'bunny boy, open black tailcoat with orange lining, orange cuffs', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Orange belt', '주황 벨트', 'orange satin belt', ''],
      ],
      foundation: [
        ['striped', 'Orange and black stockings', '주황 검정 줄무늬 스타킹', 'orange and black striped stockings', 'gf'],
        ['sheer', 'Sheer black pantyhose', '비치는 검은 팬티스타킹', 'sheer black pantyhose', 'x2 gf'],
      ],
      neckwear: [
        ['bat', 'Bat bow tie', '박쥐 보타이', 'bat-shaped bow tie', ''],
      ],
      outer: [],
      footwear: [
        ['heels', 'Orange heels', '주황 힐', 'orange heels', 'gf'],
        ['boots', 'Black boots', '검은 부츠', 'black boots', ''],
      ],
      headwear: [
        ['ears', 'Bunny ears with a pumpkin', '호박 단 토끼 귀', 'rabbit ears headband with a small pumpkin ornament', ''],
      ],
      accessories: [
        ['tail', 'Orange cotton tail', '주황 솜 꼬리', 'orange cotton ball tail', ''],
        ['cuffs', 'Orange wrist cuffs', '주황 손목 커프스', 'orange wrist cuffs', ''],
      ],
      weapon: [
        ['bucket', 'Pumpkin candy bucket', '호박 사탕 바구니', 'holding a pumpkin candy bucket', ''],
        ['tray', 'Tray of candy', '사탕 쟁반', 'holding a tray of candy', ''],
      ],
      device: [
        ['pumpkin', 'Pumpkin sticker', '호박 스티커', 'pumpkin sticker on the cheek', ''],
      ],
    },
  }),

  /* ─── V-56 세이렌 ─── */
  costume('sr-siren', 'Siren', '세이렌', 'V-56', {
    tag: 'halloween costume, siren costume, feathers', tagReal: 'siren, halloween night, sea cliffs',
    colors: ['teal', 'deep purple', 'navy', 'gold', 'seafoam'],
    need: { weapon: 'lyre' },
    items: {
      garment: [
        ['hm-f', 'Teal dress with feather trim', '깃털 단 청록 원피스', 'teal dress, feather boa at the hem', 'f0 F0 gf'],
        ['hm-m', 'Teal shirt with a feather collar', '깃털 깃 청록 셔츠', 'teal shirt, feather collar, dark trousers', 'f0 F0 gm'],
        ['pt-0', 'Feathered siren dress, long', '깃털 세이렌 원피스 · 긴 기장', 'siren costume, sea-colored gown, feather trim at the shoulders, gold shell accents, long sleeves, floor length', 'f1 F1 x0 gf v:sr-siren-pt'],
        ['pt-1', 'Feathered siren dress, knee', '깃털 세이렌 원피스 · 무릎 기장', 'siren costume, sea-colored gown, feather trim at the shoulders, gold shell accents, off-shoulder, knee length', 'f1 F1 x1 gf v:sr-siren-pt n:low'],
        ['pt-2', 'Feathered siren dress, short', '깃털 세이렌 원피스 · 짧은 기장', 'siren costume, sea-colored gown, feather trim at the shoulders, gold shell accents, corset bodice, high slit', 'f1 F1 x2 gf v:sr-siren-pt'],
        ['pt-m', 'Feathered siren robe', '깃털 세이렌 로브', 'siren costume, sea-colored robe, feather mantle, gold shell accents', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open siren robe', '풀어 입은 세이렌 로브', 'siren costume, open sea-colored robe, feather mantle', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Wet-look siren gown, long', '물에 젖은 듯한 세이렌 드레스 · 긴 기장', 'siren, iridescent draped gown that looks wet, feathered shoulders, pearls, high neck, long sleeves, floor length', 'f2 x0 gf v:sr-siren-ed n:high'],
        ['ed-1', 'Wet-look siren gown, knee', '물에 젖은 듯한 세이렌 드레스 · 무릎 기장', 'siren, iridescent draped gown that looks wet, feathered shoulders, pearls, one shoulder, knee length', 'f2 x1 gf v:sr-siren-ed'],
        ['ed-2', 'Wet-look siren gown, short', '물에 젖은 듯한 세이렌 드레스 · 짧은 기장', 'siren, iridescent draped gown that looks wet, feathered shoulders, pearls, plunging neckline, thigh slit', 'f2 x2 gf v:sr-siren-ed n:low'],
        ['ed-m', 'Iridescent siren robe', '무지갯빛 세이렌 로브', 'siren, iridescent draped robe, feathered shoulders, pearls', 'f2 x01 gm'],
        ['ed-m2', 'Open iridescent robe', '풀어 입은 무지갯빛 로브', 'siren, open iridescent robe, feather mantle, gold arm cuffs', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['pearls', 'Pearl belt', '진주 벨트', 'belt of pearls', ''],
      ],
      foundation: [],
      neckwear: [
        ['shell', 'Gold shell collar', '금 조개 목장식', 'gold shell collar', ''],
      ],
      outer: [
        ['feather', 'Feather mantle', '깃털 어깨걸이', 'sea-colored feather mantle', 'f1'],
      ],
      footwear: [
        ['sandals', 'Gold sandals', '금 샌들', 'gold sandals', ''],
        ['bare', 'Barefoot', '맨발', 'barefoot', 'f2'],
      ],
      headwear: [
        ['feather', 'Feather crown', '깃털 관', 'crown of sea-colored feathers', ''],
        ['pearl', 'Pearl circlet', '진주 머리띠', 'pearl circlet', ''],
      ],
      accessories: [
        ['cuffs', 'Gold arm cuffs', '금 팔찌', 'gold arm cuffs', ''],
        ['notes', 'Glowing music notes', '빛나는 음표', 'glowing music notes drifting in the air', 'f3'],
      ],
      weapon: [
        ['lyre', 'Lyre', '리라', 'holding a golden lyre', ''],
        ['shell', 'Conch shell', '소라 껍데기', 'holding a conch shell', ''],
      ],
      device: [
        ['scales', 'Painted scales', '그린 비늘', 'painted scales on the cheekbones', ''],
        ['eyes', 'Glowing sea-green eyes', '바닷빛으로 빛나는 눈', 'glowing sea-green eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-57 강시 · 전통풍 ─── */
  costume('js-classic', 'Jiangshi · Classic', '강시 · 전통풍', 'V-57', {
    tag: 'halloween costume, jiangshi costume, paper talisman', tagReal: 'jiangshi, halloween night, paper talismans',
    colors: ['navy', 'black', 'crimson', 'teal', 'charcoal'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Dark robe and a paper talisman', '어두운 로브와 종이 부적', 'dark long-sleeved dress, paper talismans pinned on', 'f0 F0 gf'],
        ['hm-m', 'Dark robe and a paper talisman', '어두운 로브와 종이 부적', 'dark long-sleeved robe, dark trousers, paper talismans pinned on', 'f0 F0 gm'],
        ['pt-0', 'Jiangshi robe, long', '강시 옷 · 긴 기장', 'jiangshi costume, high-collared long robe, sleeves past fingers, embroidered rank square, ankle length', 'f1 F1 x0 gf v:js-classic-pt'],
        ['pt-1', 'Jiangshi robe, knee', '강시 옷 · 무릎 기장', 'jiangshi costume, high-collared long robe, sleeves past fingers, embroidered rank square, knee length over trousers', 'f1 F1 x1 gf v:js-classic-pt'],
        ['pt-2', 'Jiangshi robe, short', '강시 옷 · 짧은 기장', 'jiangshi costume, high-collared long robe, sleeves past fingers, embroidered rank square, short robe, shorts', 'f1 F1 x2 gf v:js-classic-pt'],
        ['pt-m', 'Jiangshi robe', '강시 옷', 'jiangshi costume, high-collared long robe, sleeves past fingers, embroidered rank square, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Short jiangshi robe', '짧은 강시 옷', 'jiangshi costume, short high-collared robe, wide sleeves, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Embroidered jiangshi robe, long', '자수 강시 옷 · 긴 기장', 'jiangshi, embroidered silk robe, high collar, very long sleeves, gold trim, floor length', 'f2 x0 gf v:js-classic-ed n:high'],
        ['ed-1', 'Embroidered jiangshi robe, knee', '자수 강시 옷 · 무릎 기장', 'jiangshi, embroidered silk robe, high collar, very long sleeves, gold trim, knee length, side slits', 'f2 x1 gf v:js-classic-ed n:high'],
        ['ed-2', 'Embroidered jiangshi robe, short', '자수 강시 옷 · 짧은 기장', 'jiangshi, embroidered silk robe, high collar, very long sleeves, gold trim, short robe, side slits', 'f2 x2 gf v:js-classic-ed n:high'],
        ['ed-m', 'Embroidered jiangshi robe', '자수 강시 옷', 'jiangshi, embroidered silk robe, high collar, very long sleeves, gold trim, trousers', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open embroidered robe', '풀어 입은 자수 옷', 'jiangshi, open embroidered silk robe, wide trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['sash', 'Wide sash', '넓은 허리띠', 'wide embroidered sash', ''],
      ],
      foundation: [
        ['white', 'White socks', '흰 양말', 'white socks', ''],
      ],
      neckwear: [
        ['beads', 'Bead necklace', '구슬 목걸이', 'long bead necklace', ''],
      ],
      outer: [],
      footwear: [
        ['shoes', 'Black cloth shoes', '검은 천 신발', 'black cloth shoes', ''],
      ],
      headwear: [
        ['hat', 'Round hat with a talisman', '부적 붙은 둥근 모자', 'round official hat with a paper talisman hanging in front of the face', ''],
      ],
      accessories: [
        ['talismans', 'Paper talismans', '종이 부적', 'paper talismans on the sleeves', ''],
        ['float', 'Talismans floating', '떠다니는 부적', 'paper talismans floating around', 'f3'],
      ],
      weapon: [
        ['arms', 'Arms stretched forward', '앞으로 뻗은 팔', 'arms stretched forward', ''],
        ['bell', 'Small brass bell', '작은 방울', 'holding a small brass bell', ''],
      ],
      device: [
        ['pale', 'Pale makeup', '창백한 분장', 'pale skin makeup', ''],
        ['blush', 'Round blush', '동그란 볼터치 분장', 'round red cheek paint', ''],
      ],
    },
  }),

  /* ─── V-58 강시 · 파스텔 ─── */
  costume('js-pastel', 'Jiangshi · Pastel', '강시 · 파스텔', 'V-58', {
    tag: 'halloween costume, jiangshi costume, paper talisman, pastel', tagReal: 'jiangshi, pastel, halloween night',
    colors: ['pastel pink', 'lavender', 'mint', 'sky blue', 'white'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Pastel robe and a paper talisman', '파스텔 옷과 종이 부적', 'pastel long-sleeved dress, paper talismans pinned on', 'f0 F0 gf'],
        ['hm-m', 'Pastel robe and a paper talisman', '파스텔 옷과 종이 부적', 'pastel long-sleeved top, pastel trousers, paper talismans pinned on', 'f0 F0 gm'],
        ['pt-0', 'Pastel jiangshi dress, long', '파스텔 강시 원피스 · 긴 기장', 'jiangshi costume, pastel high-collared dress, sleeves past fingers, frog buttons, frills, long dress', 'f1 F1 x0 gf v:js-pastel-pt'],
        ['pt-1', 'Pastel jiangshi dress, knee', '파스텔 강시 원피스 · 무릎 기장', 'jiangshi costume, pastel high-collared dress, sleeves past fingers, frog buttons, frills, knee-length dress', 'f1 F1 x1 gf v:js-pastel-pt'],
        ['pt-2', 'Pastel jiangshi dress, short', '파스텔 강시 원피스 · 짧은 기장', 'jiangshi costume, pastel high-collared dress, sleeves past fingers, frog buttons, frills, short dress over frilled bloomers', 'f1 F1 x2 gf v:js-pastel-pt'],
        ['pt-m', 'Pastel jiangshi robe', '파스텔 강시 옷', 'jiangshi costume, pastel high-collared robe, sleeves past fingers, frog buttons, trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Short pastel jiangshi top', '짧은 파스텔 강시 상의', 'jiangshi costume, short pastel high-collared top, wide sleeves, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Frilled pastel jiangshi dress, long', '프릴 파스텔 강시 원피스 · 긴 기장', 'jiangshi, pastel satin dress, high collar, very long sleeves, layered frills, ribbon trim, floor length', 'f2 x0 gf v:js-pastel-ed n:high'],
        ['ed-1', 'Frilled pastel jiangshi dress, knee', '프릴 파스텔 강시 원피스 · 무릎 기장', 'jiangshi, pastel satin dress, high collar, very long sleeves, layered frills, ribbon trim, knee length', 'f2 x1 gf v:js-pastel-ed n:high'],
        ['ed-2', 'Frilled pastel jiangshi dress, short', '프릴 파스텔 강시 원피스 · 짧은 기장', 'jiangshi, pastel satin dress, high collar, very long sleeves, layered frills, ribbon trim, short skirt, detached long sleeves', 'f2 x2 gf v:js-pastel-ed n:high'],
        ['ed-m', 'Pastel satin jiangshi robe', '파스텔 새틴 강시 옷', 'jiangshi, pastel satin robe, high collar, very long sleeves, ribbon trim', 'f2 x01 gm n:high'],
        ['ed-m2', 'Open pastel robe', '풀어 입은 파스텔 옷', 'jiangshi, open pastel satin robe, wide trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bow', 'Big ribbon sash', '큰 리본 허리띠', 'big ribbon sash', ''],
      ],
      foundation: [
        ['frill', 'Frilled socks', '프릴 양말', 'frilled socks', 'gf'],
        ['white', 'White socks', '흰 양말', 'white socks', ''],
      ],
      neckwear: [
        ['bell', 'Bell on a ribbon', '리본 방울', 'small bell on a ribbon', ''],
      ],
      outer: [],
      footwear: [
        ['shoes', 'Pastel cloth shoes', '파스텔 천 신발', 'pastel cloth shoes', ''],
        ['mary', 'Mary janes', '메리제인', 'mary janes', 'gf'],
      ],
      headwear: [
        ['hat', 'Pastel hat with a talisman', '부적 붙은 파스텔 모자', 'round pastel hat with a paper talisman hanging in front of the face', ''],
      ],
      accessories: [
        ['talismans', 'Talismans on the sleeves', '소매의 부적', 'paper talismans on the long sleeves', ''],
        ['float', 'Talismans floating', '떠다니는 부적', 'paper talismans floating around', 'f3'],
      ],
      weapon: [
        ['arms', 'Arms stretched forward', '앞으로 뻗은 팔', 'arms stretched forward', ''],
        ['candy', 'Lollipop', '막대사탕', 'holding a lollipop', ''],
      ],
      device: [
        ['blush', 'Round blush', '동그란 볼터치 분장', 'round pink cheek paint', ''],
        ['fang', 'Fang', '덧니', 'fang, smile', ''],
      ],
    },
  }),

  /* ─── V-59 요정 · 숲 ─── */
  costume('fy-forest', 'Fairy · Forest', '요정 · 숲', 'V-59', {
    tag: 'halloween costume, fairy costume, leaves', tagReal: 'fairy, halloween night, glowing mushrooms',
    colors: ['moss green', 'forest green', 'cream', 'rust', 'mint'],
    need: { accessories: 'wings' },
    items: {
      garment: [
        ['hm-f', 'Green dress with leaves and paper wings', '잎과 종이 날개 단 초록 원피스', 'green dress, fake leaves pinned on, paper wings', 'f0 F0 gf'],
        ['hm-m', 'Green tunic with leaves', '잎 단 초록 튜닉', 'green tunic, fake leaves pinned on, brown trousers', 'f0 F0 gm'],
        ['pt-0', 'Leaf fairy dress, long', '잎사귀 요정 원피스 · 긴 기장', 'fairy costume, leaf petal dress, vine straps, long sleeves, ankle length', 'f1 F1 x0 gf v:fy-forest-pt'],
        ['pt-1', 'Leaf fairy dress, knee', '잎사귀 요정 원피스 · 무릎 기장', 'fairy costume, leaf petal dress, vine straps, short sleeves, knee length', 'f1 F1 x1 gf v:fy-forest-pt'],
        ['pt-2', 'Leaf fairy dress, short', '잎사귀 요정 원피스 · 짧은 기장', 'fairy costume, leaf petal dress, vine straps, petal bodice, short petal skirt', 'f1 F1 x2 gf v:fy-forest-pt'],
        ['pt-m', 'Leaf fairy tunic', '잎사귀 요정 튜닉', 'fairy costume, leaf tunic, vine belt, brown trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless leaf tunic', '민소매 잎사귀 튜닉', 'fairy costume, sleeveless leaf tunic, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Moss and petal gown, long', '이끼와 꽃잎 드레스 · 긴 기장', 'forest fairy, layered moss green chiffon, petal hem, tiny mushrooms embroidered, long sleeves, floor length', 'f2 x0 gf v:fy-forest-ed'],
        ['ed-1', 'Moss and petal gown, knee', '이끼와 꽃잎 드레스 · 무릎 기장', 'forest fairy, layered moss green chiffon, petal hem, tiny mushrooms embroidered, cap sleeves, knee length', 'f2 x1 gf v:fy-forest-ed'],
        ['ed-2', 'Moss and petal gown, short', '이끼와 꽃잎 드레스 · 짧은 기장', 'forest fairy, layered moss green chiffon, petal hem, tiny mushrooms embroidered, petal corset, short layered skirt', 'f2 x2 gf v:fy-forest-ed'],
        ['ed-m', 'Moss fairy coat', '이끼 요정 코트', 'forest fairy, moss green coat, leaf embroidery, vine belt', 'f2 x01 gm'],
        ['ed-m2', 'Open moss coat', '풀어 입은 이끼 코트', 'forest fairy, open moss coat, leaf sash', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['vine', 'Vine belt', '덩굴 벨트', 'vine belt', ''],
      ],
      foundation: [
        ['green', 'Green tights', '초록 타이츠', 'green tights', ''],
      ],
      neckwear: [
        ['acorn', 'Acorn pendant', '도토리 펜던트', 'acorn pendant', ''],
      ],
      outer: [],
      footwear: [
        ['bare', 'Barefoot with a leaf anklet', '잎 발찌 맨발', 'barefoot, leaf anklet', ''],
        ['boots', 'Soft leaf boots', '잎 장화', 'soft boots wrapped in leaves', ''],
      ],
      headwear: [
        ['wreath', 'Flower crown', '꽃관', 'wildflower crown', ''],
        ['acorn', 'Acorn cap hat', '도토리 모자', 'tiny acorn cap hat', 'f1'],
      ],
      accessories: [
        ['wings', 'Leaf wings', '잎 날개', 'leaf-shaped fairy wings costume on the back', ''],
        ['fireflies', 'Fireflies around', '둘레의 반딧불', 'fireflies glowing around', 'f3'],
      ],
      weapon: [
        ['wand', 'Twig wand', '나뭇가지 지팡이', 'holding a twig wand', ''],
        ['mushroom', 'Mushroom lantern', '버섯 등불', 'holding a glowing mushroom lantern', 'f2'],
      ],
      device: [
        ['freckles', 'Gold freckles', '금 주근깨', 'painted gold freckles', ''],
      ],
    },
  }),

  /* ─── V-60 요정 · 달빛 ─── */
  costume('fy-moon', 'Fairy · Moonlight', '요정 · 달빛', 'V-60', {
    tag: 'halloween costume, fairy costume, moonlight', tagReal: 'fairy, halloween night, moonlight',
    colors: ['lavender', 'silver', 'midnight blue', 'pearl white', 'lilac'],
    need: { accessories: 'wings' },
    items: {
      garment: [
        ['hm-f', 'Lavender dress with foil wings', '은박 날개 라벤더 원피스', 'lavender dress, foil wings, star stickers', 'f0 F0 gf'],
        ['hm-m', 'Lavender shirt with foil wings', '은박 날개 라벤더 셔츠', 'lavender shirt, foil wings, grey trousers', 'f0 F0 gm'],
        ['pt-0', 'Moonlight fairy dress, long', '달빛 요정 원피스 · 긴 기장', 'fairy costume, lavender tulle dress, crescent moon embroidery, long sleeves, ankle length', 'f1 F1 x0 gf v:fy-moon-pt'],
        ['pt-1', 'Moonlight fairy dress, knee', '달빛 요정 원피스 · 무릎 기장', 'fairy costume, lavender tulle dress, crescent moon embroidery, puff sleeves, knee length', 'f1 F1 x1 gf v:fy-moon-pt'],
        ['pt-2', 'Moonlight fairy dress, short', '달빛 요정 원피스 · 짧은 기장', 'fairy costume, lavender tulle dress, crescent moon embroidery, off-shoulder, short tulle skirt', 'f1 F1 x2 gf v:fy-moon-pt n:low'],
        ['pt-m', 'Moonlight fairy tunic', '달빛 요정 튜닉', 'fairy costume, lavender tunic, crescent moon embroidery, grey trousers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless moon tunic', '민소매 달빛 튜닉', 'fairy costume, sleeveless lavender tunic, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Starlit fairy gown, long', '별빛 요정 드레스 · 긴 기장', 'moonlight fairy, sheer silver tulle gown, sparkling like starlight, crescent moon clasp, long sheer sleeves, floor length', 'f2 x0 gf v:fy-moon-ed'],
        ['ed-1', 'Starlit fairy gown, knee', '별빛 요정 드레스 · 무릎 기장', 'moonlight fairy, sheer silver tulle gown, sparkling like starlight, crescent moon clasp, cap sleeves, knee length', 'f2 x1 gf v:fy-moon-ed'],
        ['ed-2', 'Starlit fairy gown, short', '별빛 요정 드레스 · 짧은 기장', 'moonlight fairy, sheer silver tulle gown, sparkling like starlight, crescent moon clasp, strapless, short layered tulle', 'f2 x2 gf v:fy-moon-ed n:low'],
        ['ed-m', 'Starlit fairy coat', '별빛 요정 코트', 'moonlight fairy, silver coat, sparkling like starlight, crescent moon clasp', 'f2 x01 gm'],
        ['ed-m2', 'Open starlit coat', '풀어 입은 별빛 코트', 'moonlight fairy, open silver coat, sheer shirt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['ribbon', 'Silver ribbon', '은빛 리본', 'silver ribbon sash', ''],
      ],
      foundation: [
        ['sheer', 'Sheer silver tights', '비치는 은색 타이츠', 'sheer silver pantyhose', 'gf'],
      ],
      neckwear: [
        ['moon', 'Moon pendant', '달 펜던트', 'crescent moon pendant', ''],
      ],
      outer: [],
      footwear: [
        ['flats', 'Silver ballet flats', '은색 플랫', 'silver ballet flats', ''],
      ],
      headwear: [
        ['tiara', 'Crescent tiara', '초승달 티아라', 'crescent moon tiara', ''],
        ['clips', 'Star clips', '별 머리핀', 'star hair clips', ''],
      ],
      accessories: [
        ['wings', 'Sheer moth wings', '비치는 나방 날개', 'sheer moth-like fairy wings costume on the back', ''],
        ['dust', 'Sparkling dust', '반짝이는 가루', 'sparkling dust trailing', 'f3'],
      ],
      weapon: [
        ['wand', 'Moon wand', '달 지팡이', 'holding a wand topped with a crescent moon', ''],
        ['jar', 'Jar of starlight', '별빛 병', 'holding a jar of glowing starlight', 'f2'],
      ],
      device: [
        ['glitter', 'Silver glitter', '은 반짝이', 'silver glitter on the cheekbones', ''],
      ],
    },
  }),

  /* ─── V-61 요정 · 장난꾸러기 ─── */
  costume('fy-pixie', 'Fairy · Pixie', '요정 · 장난꾸러기', 'V-61', {
    tag: 'halloween costume, pixie costume', tagReal: 'pixie, halloween night, flower meadow',
    colors: ['mint', 'pastel pink', 'butter yellow', 'lime green', 'sky blue'],
    need: { accessories: 'wings' },
    items: {
      garment: [
        ['hm-f', 'Petal tutu and paper wings', '꽃잎 튀튀와 종이 날개', 'green top, petal tutu made of paper, paper wings', 'f0 F0 gf'],
        ['hm-m', 'Green tee and paper wings', '초록 티와 종이 날개', 'green t-shirt, shorts, paper wings', 'f0 F0 gm'],
        ['pt-0', 'Pixie petal dress, long', '꽃잎 요정 원피스 · 긴 기장', 'pixie costume, petal dress, pointed petal hem, bell buttons, long sleeves, long petal skirt', 'f1 F1 x0 gf v:fy-pixie-pt'],
        ['pt-1', 'Pixie petal dress, knee', '꽃잎 요정 원피스 · 무릎 기장', 'pixie costume, petal dress, pointed petal hem, bell buttons, short sleeves, knee-length petal skirt', 'f1 F1 x1 gf v:fy-pixie-pt'],
        ['pt-2', 'Pixie petal dress, short', '꽃잎 요정 원피스 · 짧은 기장', 'pixie costume, petal dress, pointed petal hem, bell buttons, sleeveless, short pointed petal skirt', 'f1 F1 x2 gf v:fy-pixie-pt'],
        ['pt-m', 'Pixie tunic', '요정 튜닉', 'pixie costume, pointed leaf tunic, bell buttons, shorts', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless pixie tunic', '민소매 요정 튜닉', 'pixie costume, sleeveless pointed leaf tunic, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Layered petal pixie dress, long', '겹꽃잎 요정 원피스 · 긴 기장', 'pixie, layered petal skirt, flower bodice, tiny bells along the hem, long sleeves, long skirt', 'f2 x0 gf v:fy-pixie-ed'],
        ['ed-1', 'Layered petal pixie dress, knee', '겹꽃잎 요정 원피스 · 무릎 기장', 'pixie, layered petal skirt, flower bodice, tiny bells along the hem, puff sleeves, knee length', 'f2 x1 gf v:fy-pixie-ed'],
        ['ed-2', 'Layered petal pixie dress, short', '겹꽃잎 요정 원피스 · 짧은 기장', 'pixie, layered petal skirt, flower bodice, tiny bells along the hem, flower bodice, short petal skirt', 'f2 x2 gf v:fy-pixie-ed'],
        ['ed-m', 'Petal pixie jacket', '꽃잎 요정 재킷', 'pixie, petal-edged jacket, tiny bells, shorts', 'f2 x01 gm'],
        ['ed-m2', 'Open petal jacket', '풀어 입은 꽃잎 재킷', 'pixie, open petal-edged jacket, tank top, shorts', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['bells', 'Bell belt', '방울 벨트', 'belt with tiny bells', ''],
      ],
      foundation: [
        ['striped', 'Striped stockings', '줄무늬 스타킹', 'green and white striped stockings', 'gf'],
      ],
      neckwear: [
        ['bell', 'Bell choker', '방울 초커', 'choker with a tiny bell', ''],
      ],
      outer: [],
      footwear: [
        ['curly', 'Curled-toe shoes', '앞코 말린 신발', 'pointed curled-toe shoes', ''],
      ],
      headwear: [
        ['cap', 'Petal cap', '꽃잎 모자', 'upside-down flower petal cap', ''],
        ['flower', 'Big flower clip', '큰 꽃 머리핀', 'big flower hair clip', ''],
      ],
      accessories: [
        ['wings', 'Translucent wings', '투명한 날개', 'translucent pixie wings costume on the back', ''],
        ['dust', 'Pixie dust', '요정 가루', 'glittering pixie dust trailing', 'f2'],
      ],
      weapon: [
        ['wand', 'Flower wand', '꽃 지팡이', 'holding a flower wand', ''],
        ['acorn', 'Acorn full of candy', '사탕 든 도토리', 'holding a giant acorn full of candy', ''],
      ],
      device: [
        ['freckles', 'Freckles', '주근깨', 'freckles', ''],
        ['wink', 'Wink', '윙크', 'one eye closed, grin', ''],
      ],
    },
  }),

  /* ─── V-62 잭오랜턴 · 호박 마녀 ─── */
  costume('jl-witch', 'Jack-o\'-lantern · Witch', '잭오랜턴 · 호박 마녀', 'V-62', {
    tag: 'halloween costume, pumpkin witch', tagReal: 'pumpkin witch, halloween night, glowing jack-o\'-lanterns',
    tagM: 'halloween costume, pumpkin warlock', tagRealM: 'pumpkin warlock, halloween night, glowing jack-o\'-lanterns',
    colors: ['pumpkin orange', 'black', 'deep purple', 'moss green', 'burnt orange'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Orange dress and a paper witch hat', '주황 원피스와 종이 마녀 모자', 'orange dress, felt pumpkin face sewn on, black tutu underneath', 'f0 F0 gf'],
        ['hm-m', 'Orange shirt and a black cape', '주황 셔츠와 검은 망토', 'orange shirt with a felt pumpkin face, black cape, black trousers', 'f0 F0 gm'],
        ['pt-0', 'Pumpkin witch dress, long', '호박 마녀 원피스 · 긴 기장', 'pumpkin witch, orange and black witch dress, puffy balloon skirt shaped like a pumpkin, green leaf collar, long sleeves, ankle-length balloon skirt', 'f1 F1 x0 gf v:jl-witch-pt'],
        ['pt-1', 'Pumpkin witch dress, knee', '호박 마녀 원피스 · 무릎 기장', 'pumpkin witch, orange and black witch dress, puffy balloon skirt shaped like a pumpkin, green leaf collar, puff sleeves, knee-length balloon skirt', 'f1 F1 x1 gf v:jl-witch-pt'],
        ['pt-2', 'Pumpkin witch dress, short', '호박 마녀 원피스 · 짧은 기장', 'pumpkin witch, orange and black witch dress, puffy balloon skirt shaped like a pumpkin, green leaf collar, off-shoulder, pumpkin bloomers, short overskirt', 'f1 F1 x2 gf v:jl-witch-pt n:low'],
        ['pt-m', 'Pumpkin warlock coat', '호박 마법사 코트', 'pumpkin warlock, orange and black coat, leaf collar, puffy pumpkin breeches', 'f1 F1 x01 gm'],
        ['pt-m2', 'Pumpkin warlock vest', '호박 마법사 조끼', 'pumpkin warlock, orange vest, black shirt, puffy pumpkin shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Pumpkin ball witch gown, long', '호박 볼 마녀 드레스 · 긴 기장', 'pumpkin witch, black corset bodice, ribbed orange balloon skirt shaped like a pumpkin, vine trim, long sleeves, floor-length balloon skirt', 'f2 x0 gf v:jl-witch-ed'],
        ['ed-1', 'Pumpkin ball witch gown, knee', '호박 볼 마녀 드레스 · 무릎 기장', 'pumpkin witch, black corset bodice, ribbed orange balloon skirt shaped like a pumpkin, vine trim, puff sleeves, knee-length balloon skirt', 'f2 x1 gf v:jl-witch-ed'],
        ['ed-2', 'Pumpkin ball witch gown, short', '호박 볼 마녀 드레스 · 짧은 기장', 'pumpkin witch, black corset bodice, ribbed orange balloon skirt shaped like a pumpkin, vine trim, strapless, pumpkin bloomers, sheer black overskirt', 'f2 x2 gf v:jl-witch-ed n:low'],
        ['ed-m', 'Pumpkin warlock tailcoat', '호박 마법사 연미복', 'pumpkin warlock, black tailcoat with orange lining, vine trim, pumpkin breeches', 'f2 x01 gm'],
        ['ed-m2', 'Open pumpkin tailcoat', '풀어 입은 호박 연미복', 'pumpkin warlock, open black tailcoat with orange lining, pumpkin shorts', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['vine', 'Vine belt', '덩굴 벨트', 'curling vine belt', ''],
      ],
      foundation: [
        ['striped', 'Orange and black stockings', '주황 검정 줄무늬 스타킹', 'orange and black striped stockings', 'gf'],
        ['green', 'Green tights', '초록 타이츠', 'green tights', ''],
      ],
      neckwear: [
        ['leaf', 'Leaf collar', '잎사귀 깃', 'pumpkin leaf collar', ''],
      ],
      outer: [
        ['cape', 'Black cape with orange lining', '안이 주황인 검은 망토', 'black cape, orange lining', 'f1'],
      ],
      footwear: [
        ['boots', 'Black buckle boots', '검은 버클 부츠', 'black buckle boots', ''],
        ['mary', 'Orange mary janes', '주황 메리제인', 'orange mary janes', 'gf'],
      ],
      headwear: [
        ['hat', 'Witch hat with a pumpkin', '호박 단 마녀 모자', 'black witch hat with a small pumpkin on the brim', ''],
        ['clip', 'Pumpkin hair clip', '호박 머리핀', 'pumpkin hair clip', ''],
      ],
      accessories: [
        ['earrings', 'Pumpkin earrings', '호박 귀걸이', 'pumpkin earrings', ''],
        ['glow', 'Floating lanterns', '떠다니는 호박 등불', 'small glowing jack-o\'-lanterns floating around', 'f3'],
      ],
      weapon: [
        ['broom', 'Broom', '빗자루', 'holding a broom', ''],
        ['lantern', 'Pumpkin lantern', '호박 등불', 'holding a carved jack-o\'-lantern', ''],
        ['bucket', 'Pumpkin candy bucket', '호박 사탕 바구니', 'holding a pumpkin candy bucket', ''],
      ],
      device: [
        ['freckles', 'Orange freckles', '주황 주근깨', 'painted orange freckles', ''],
        ['pumpkin', 'Pumpkin sticker', '호박 스티커', 'pumpkin sticker on the cheek', ''],
      ],
    },
  }),

  /* ─── V-63 잭오랜턴 · 호박 악마 ─── */
  costume('jl-devil', 'Jack-o\'-lantern · Devil', '잭오랜턴 · 호박 악마', 'V-63', {
    tag: 'halloween costume, pumpkin devil costume', tagReal: 'pumpkin devil, halloween night, orange flames',
    colors: ['pumpkin orange', 'black', 'crimson', 'burnt orange'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Orange dress and felt horns', '주황 원피스와 펠트 뿔', 'orange dress, black felt devil tail sewn on', 'f0 F0 gf'],
        ['hm-m', 'Orange hoodie and felt horns', '주황 후드티와 펠트 뿔', 'orange hoodie with felt horns, black shorts', 'f0 F0 gm'],
        ['pt-0', 'Pumpkin devil dress, long', '호박 악마 원피스 · 긴 기장', 'pumpkin devil costume, orange and black dress, puffy pumpkin skirt, pointed hem, long sleeves, ankle-length pumpkin skirt', 'f1 F1 x0 gf v:jl-devil-pt'],
        ['pt-1', 'Pumpkin devil dress, knee', '호박 악마 원피스 · 무릎 기장', 'pumpkin devil costume, orange and black dress, puffy pumpkin skirt, pointed hem, short sleeves, knee-length pumpkin skirt', 'f1 F1 x1 gf v:jl-devil-pt'],
        ['pt-2', 'Pumpkin devil dress, short', '호박 악마 원피스 · 짧은 기장', 'pumpkin devil costume, orange and black dress, puffy pumpkin skirt, pointed hem, crop top, pumpkin bloomers', 'f1 F1 x2 gf v:jl-devil-pt'],
        ['pt-m', 'Pumpkin devil jacket', '호박 악마 재킷', 'pumpkin devil costume, orange and black cropped jacket, puffy pumpkin shorts', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless pumpkin devil top', '민소매 호박 악마 상의', 'pumpkin devil costume, sleeveless black top, orange pumpkin shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Pumpkin devil corset dress, long', '호박 악마 코르셋 원피스 · 긴 기장', 'pumpkin devil, black corset, ribbed orange pumpkin skirt, flame-shaped hem, long sleeves, long skirt', 'f2 x0 gf v:jl-devil-ed'],
        ['ed-1', 'Pumpkin devil corset dress, knee', '호박 악마 코르셋 원피스 · 무릎 기장', 'pumpkin devil, black corset, ribbed orange pumpkin skirt, flame-shaped hem, puff sleeves, knee length', 'f2 x1 gf v:jl-devil-ed'],
        ['ed-2', 'Pumpkin devil corset dress, short', '호박 악마 코르셋 원피스 · 짧은 기장', 'pumpkin devil, black corset, ribbed orange pumpkin skirt, flame-shaped hem, strapless corset, pumpkin bloomers', 'f2 x2 gf v:jl-devil-ed n:low'],
        ['ed-m', 'Pumpkin devil coat', '호박 악마 코트', 'pumpkin devil, black coat with orange flame lining, pumpkin breeches', 'f2 x01 gm'],
        ['ed-m2', 'Open pumpkin devil coat', '풀어 입은 호박 악마 코트', 'pumpkin devil, open black coat, orange flame lining', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Orange belt', '주황 벨트', 'orange belt', ''],
      ],
      foundation: [
        ['striped', 'Orange and black thighhighs', '주황 검정 니삭스', 'orange and black striped thighhighs', 'gf'],
      ],
      neckwear: [
        ['choker', 'Pumpkin choker', '호박 초커', 'choker with a tiny pumpkin charm', ''],
      ],
      outer: [],
      footwear: [
        ['boots', 'Black platform boots', '검은 플랫폼 부츠', 'black platform boots', ''],
      ],
      headwear: [
        ['horns', 'Horns with a pumpkin stem', '호박 꼭지 뿔', 'devil horn headband shaped like pumpkin stems', ''],
      ],
      accessories: [
        ['tail', 'Devil tail with a pumpkin tip', '호박 끝 악마 꼬리', 'clip-on costume devil tail with a pumpkin tip', ''],
        ['wings', 'Small bat wings', '작은 박쥐 날개', 'small bat wings costume on the back', 'f1'],
        ['flames', 'Orange flames', '주황 불꽃', 'small orange flames flickering around', 'f3'],
      ],
      weapon: [
        ['trident', 'Pumpkin trident', '호박 삼지창', 'holding a trident topped with a small pumpkin', ''],
        ['bucket', 'Pumpkin candy bucket', '호박 사탕 바구니', 'holding a pumpkin candy bucket', ''],
      ],
      device: [
        ['fang', 'Fang', '덧니', 'fang, smug', ''],
        ['eyes', 'Glowing orange eyes', '주황으로 빛나는 눈', 'glowing orange eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-64 잭오랜턴 · 호박머리 ─── */
  costume('jl-head', 'Jack-o\'-lantern · Pumpkin Head', '잭오랜턴 · 호박머리', 'V-64', {
    tag: 'halloween costume, jack-o\'-lantern costume', tagReal: 'jack-o\'-lantern, halloween night',
    colors: ['pumpkin orange', 'black', 'moss green', 'burnt orange', 'charcoal'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Orange sweater dress', '주황 니트 원피스', 'orange sweater dress, green leaf collar', 'f0 F0 gf'],
        ['hm-m', 'Orange sweater', '주황 스웨터', 'orange sweater, green leaf collar, dark trousers', 'f0 F0 gm'],
        ['pt-0', 'Pumpkin suit, long', '호박 차림 · 긴 기장', 'jack-o\'-lantern costume, orange and black suit, vine trim, puffy pumpkin bloomers, long coat over the bloomers', 'f1 F1 x0 gf v:jl-head-pt'],
        ['pt-1', 'Pumpkin suit, knee', '호박 차림 · 무릎 기장', 'jack-o\'-lantern costume, orange and black suit, vine trim, puffy pumpkin bloomers, knee-length coat', 'f1 F1 x1 gf v:jl-head-pt'],
        ['pt-2', 'Pumpkin suit, short', '호박 차림 · 짧은 기장', 'jack-o\'-lantern costume, orange and black suit, vine trim, puffy pumpkin bloomers, cropped jacket, pumpkin bloomers', 'f1 F1 x2 gf v:jl-head-pt'],
        ['pt-m', 'Pumpkin suit', '호박 차림', 'jack-o\'-lantern costume, orange and black suit, vine trim, puffy pumpkin breeches', 'f1 F1 x01 gm'],
        ['pt-m2', 'Pumpkin vest', '호박 조끼', 'jack-o\'-lantern costume, orange vest, vine trim, pumpkin shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Scarecrow-pumpkin coat, long', '허수아비풍 호박 코트 · 긴 기장', 'jack-o\'-lantern, tattered black coat, orange vest, straw trim, puffy pumpkin bloomers, long coat, long trousers', 'f2 x0 gf v:jl-head-ed'],
        ['ed-1', 'Scarecrow-pumpkin coat, knee', '허수아비풍 호박 코트 · 무릎 기장', 'jack-o\'-lantern, tattered black coat, orange vest, straw trim, puffy pumpkin bloomers, knee-length coat', 'f2 x1 gf v:jl-head-ed'],
        ['ed-2', 'Scarecrow-pumpkin coat, short', '허수아비풍 호박 코트 · 짧은 기장', 'jack-o\'-lantern, tattered black coat, orange vest, straw trim, puffy pumpkin bloomers, cropped coat, pumpkin bloomers', 'f2 x2 gf v:jl-head-ed'],
        ['ed-m', 'Scarecrow-pumpkin coat', '허수아비풍 호박 코트', 'jack-o\'-lantern, tattered black coat, orange vest, straw trim, breeches', 'f2 x01 gm'],
        ['ed-m2', 'Open pumpkin coat', '풀어 입은 호박 코트', 'jack-o\'-lantern, open tattered coat, orange shirt, straw trim', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['vine', 'Vine belt', '덩굴 벨트', 'vine belt', ''],
      ],
      foundation: [
        ['striped', 'Orange striped socks', '주황 줄무늬 양말', 'orange and black striped socks', ''],
      ],
      neckwear: [
        ['leaf', 'Leaf collar', '잎사귀 깃', 'leaf collar', ''],
      ],
      outer: [
        ['cape', 'Tattered cape', '해진 망토', 'tattered black cape', 'f1'],
      ],
      footwear: [
        ['boots', 'Worn boots', '낡은 부츠', 'worn brown boots', ''],
      ],
      headwear: [
        ['pumpkin', 'Carved pumpkin on the head', '머리에 쓴 호박', 'carved jack-o\'-lantern worn over the head', 'f1 c:mask'],
        ['hat', 'Pumpkin hat', '호박 모자', 'round pumpkin hat with a stem', ''],
      ],
      accessories: [
        ['gloves', 'Brown gloves', '갈색 장갑', 'worn brown gloves', ''],
        ['glow', 'Head glowing from inside', '안에서 빛나는 머리', 'jack-o\'-lantern glowing from inside', 'f3'],
      ],
      weapon: [
        ['lantern', 'Lantern', '등불', 'holding a lantern', ''],
        ['bucket', 'Pumpkin candy bucket', '호박 사탕 바구니', 'holding a pumpkin candy bucket', ''],
      ],
      device: [],
    },
  }),

  /* ─── V-65 유령 · 고양이 귀 ─── */
  costume('gh-cat', 'Ghost · Cat Ears', '유령 · 고양이 귀', 'V-65', {
    tag: 'halloween costume, ghost costume, cat ears', tagReal: 'ghost, halloween night, cat ears',
    colors: ['white', 'bone white', 'lavender', 'pastel pink', 'sky blue', 'grey'],
    need: { device: '' },
    items: {
      garment: [
        ['hm-f', 'Bedsheet poncho with felt Cat ears', '펠트 고양이 귀 단 홑이불 판초', 'white bedsheet poncho, felt cat ears sewn on the hood, face showing, leggings', 'f0 F0 gf'],
        ['hm-m', 'Bedsheet poncho with felt Cat ears', '펠트 고양이 귀 단 홑이불 판초', 'white bedsheet poncho, felt cat ears sewn on the hood, face showing, trousers', 'f0 F0 gm'],
        ['pt-0', 'Cat-eared sheet ghost, long', '고양이 귀 천 유령 · 긴 기장', 'ghost costume, white sheet poncho with cat ears on the hood, hood up, face showing, ragged wavy hem, ankle-length poncho', 'f1 F1 x0 gf v:gh-cat-pt'],
        ['pt-1', 'Cat-eared sheet ghost, knee', '고양이 귀 천 유령 · 무릎 기장', 'ghost costume, white sheet poncho with cat ears on the hood, hood up, face showing, ragged wavy hem, knee-length poncho', 'f1 F1 x1 gf v:gh-cat-pt'],
        ['pt-2', 'Cat-eared sheet ghost, short', '고양이 귀 천 유령 · 짧은 기장', 'ghost costume, white sheet poncho with cat ears on the hood, hood up, face showing, ragged wavy hem, short poncho over a frilled skirt', 'f1 F1 x2 gf v:gh-cat-pt'],
        ['pt-m', 'Cat-eared sheet ghost', '고양이 귀 천 유령', 'ghost costume, white sheet poncho with cat ears on the hood, hood up, face showing, ragged wavy hem, long', 'f1 F1 x01 gm'],
        ['pt-m2', 'Short Cat-eared ghost poncho', '짧은 고양이 귀 유령 판초', 'ghost costume, short white sheet poncho with cat ears on the hood, face showing, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Chiffon ghost dress with Cat ears, long', '고양이 귀 시폰 유령 원피스 · 긴 기장', 'layered white chiffon ghost dress, hood with cat ears, wavy translucent hem, long sleeves, floor length', 'f2 x0 gf v:gh-cat-ed'],
        ['ed-1', 'Chiffon ghost dress with Cat ears, knee', '고양이 귀 시폰 유령 원피스 · 무릎 기장', 'layered white chiffon ghost dress, hood with cat ears, wavy translucent hem, puff sleeves, knee length', 'f2 x1 gf v:gh-cat-ed'],
        ['ed-2', 'Chiffon ghost dress with Cat ears, short', '고양이 귀 시폰 유령 원피스 · 짧은 기장', 'layered white chiffon ghost dress, hood with cat ears, wavy translucent hem, off-shoulder, short layered skirt', 'f2 x2 gf v:gh-cat-ed n:low'],
        ['ed-m', 'Chiffon ghost robe with Cat ears', '고양이 귀 시폰 유령 로브', 'layered white chiffon ghost robe, hood with cat ears, wavy translucent hem', 'f2 x01 gm'],
        ['ed-m2', 'Short chiffon ghost robe', '짧은 시폰 유령 로브', 'short white chiffon ghost robe, hood with cat ears, shorts', 'f2 x2 gm'],
      ],
      structure: [
        ['ribbon', 'Ribbon belt', '리본 벨트', 'ribbon tied at the waist', ''],
      ],
      foundation: [
        ['socks', 'Frilled socks', '프릴 양말', 'white frilled socks', 'gf'],
        ['striped', 'Striped socks', '줄무늬 양말', 'white and grey striped socks', ''],
      ],
      neckwear: [
        ['bell', 'Bell on a ribbon', '리본 방울', 'small bell on a ribbon', ''],
      ],
      outer: [],
      footwear: [
        ['slippers', 'Cat slippers', '고양이 슬리퍼', 'fluffy cat slippers', ''],
        ['mary', 'White mary janes', '흰 메리제인', 'white mary janes', 'gf'],
      ],
      headwear: [],
      accessories: [
        ['tail', 'Clip-on cat tail', '달아 놓은 고양이 꼬리', 'clip-on costume cat tail', ''],
        ['paws', 'Paw mittens', '발바닥 벙어리장갑', 'paw mittens', 'f1'],
        ['ghosts', 'Tiny cat ghosts', '작은 고양이 유령들', 'tiny cat-shaped ghosts floating around', 'f3'],
      ],
      weapon: [
        ['bucket', 'Ghost candy bucket', '유령 사탕 바구니', 'holding a ghost-shaped candy bucket', ''],
        ['lantern', 'Paper lantern', '종이 등불', 'holding a small paper lantern', ''],
        ['plush', 'Cat plush', '고양이 인형', 'hugging a small cat plush', ''],
      ],
      device: [
        ['blush', 'Blush stickers', '볼 스티커', 'blush stickers', ''],
        ['nose', 'Painted cat nose', '그린 고양이 코', 'painted cat nose', ''],
        ['pale', 'Pale ghost makeup', '창백한 유령 분장', 'pale skin makeup', ''],
      ],
    },
  }),

  /* ─── V-66 유령 · 토끼 귀 ─── */
  costume('gh-bunny', 'Ghost · Bunny Ears', '유령 · 토끼 귀', 'V-66', {
    tag: 'halloween costume, ghost costume, rabbit ears', tagReal: 'ghost, halloween night, rabbit ears',
    colors: ['white', 'bone white', 'lavender', 'pastel pink', 'sky blue', 'grey'],
    need: { device: '' },
    items: {
      garment: [
        ['hm-f', 'Bedsheet poncho with felt Bunny ears', '펠트 토끼 귀 단 홑이불 판초', 'white bedsheet poncho, felt rabbit ears sewn on the hood, face showing, leggings', 'f0 F0 gf'],
        ['hm-m', 'Bedsheet poncho with felt Bunny ears', '펠트 토끼 귀 단 홑이불 판초', 'white bedsheet poncho, felt rabbit ears sewn on the hood, face showing, trousers', 'f0 F0 gm'],
        ['pt-0', 'Bunny-eared sheet ghost, long', '토끼 귀 천 유령 · 긴 기장', 'ghost costume, white sheet poncho with rabbit ears on the hood, hood up, face showing, ragged wavy hem, ankle-length poncho', 'f1 F1 x0 gf v:gh-bunny-pt'],
        ['pt-1', 'Bunny-eared sheet ghost, knee', '토끼 귀 천 유령 · 무릎 기장', 'ghost costume, white sheet poncho with rabbit ears on the hood, hood up, face showing, ragged wavy hem, knee-length poncho', 'f1 F1 x1 gf v:gh-bunny-pt'],
        ['pt-2', 'Bunny-eared sheet ghost, short', '토끼 귀 천 유령 · 짧은 기장', 'ghost costume, white sheet poncho with rabbit ears on the hood, hood up, face showing, ragged wavy hem, short poncho over a frilled skirt', 'f1 F1 x2 gf v:gh-bunny-pt'],
        ['pt-m', 'Bunny-eared sheet ghost', '토끼 귀 천 유령', 'ghost costume, white sheet poncho with rabbit ears on the hood, hood up, face showing, ragged wavy hem, long', 'f1 F1 x01 gm'],
        ['pt-m2', 'Short Bunny-eared ghost poncho', '짧은 토끼 귀 유령 판초', 'ghost costume, short white sheet poncho with rabbit ears on the hood, face showing, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Chiffon ghost dress with Bunny ears, long', '토끼 귀 시폰 유령 원피스 · 긴 기장', 'layered white chiffon ghost dress, hood with rabbit ears, wavy translucent hem, long sleeves, floor length', 'f2 x0 gf v:gh-bunny-ed'],
        ['ed-1', 'Chiffon ghost dress with Bunny ears, knee', '토끼 귀 시폰 유령 원피스 · 무릎 기장', 'layered white chiffon ghost dress, hood with rabbit ears, wavy translucent hem, puff sleeves, knee length', 'f2 x1 gf v:gh-bunny-ed'],
        ['ed-2', 'Chiffon ghost dress with Bunny ears, short', '토끼 귀 시폰 유령 원피스 · 짧은 기장', 'layered white chiffon ghost dress, hood with rabbit ears, wavy translucent hem, off-shoulder, short layered skirt', 'f2 x2 gf v:gh-bunny-ed n:low'],
        ['ed-m', 'Chiffon ghost robe with Bunny ears', '토끼 귀 시폰 유령 로브', 'layered white chiffon ghost robe, hood with rabbit ears, wavy translucent hem', 'f2 x01 gm'],
        ['ed-m2', 'Short chiffon ghost robe', '짧은 시폰 유령 로브', 'short white chiffon ghost robe, hood with rabbit ears, shorts', 'f2 x2 gm'],
      ],
      structure: [
        ['ribbon', 'Ribbon belt', '리본 벨트', 'ribbon tied at the waist', ''],
      ],
      foundation: [
        ['socks', 'Frilled socks', '프릴 양말', 'white frilled socks', 'gf'],
        ['striped', 'Striped socks', '줄무늬 양말', 'white and grey striped socks', ''],
      ],
      neckwear: [
        ['bell', 'Bell on a ribbon', '리본 방울', 'small bell on a ribbon', ''],
      ],
      outer: [],
      footwear: [
        ['slippers', 'Bunny slippers', '토끼 슬리퍼', 'fluffy bunny slippers', ''],
        ['mary', 'White mary janes', '흰 메리제인', 'white mary janes', 'gf'],
      ],
      headwear: [],
      accessories: [
        ['tail', 'Clip-on bunny tail', '달아 놓은 토끼 꼬리', 'clip-on costume bunny tail', ''],
        ['paws', 'Paw mittens', '발바닥 벙어리장갑', 'paw mittens', 'f1'],
        ['ghosts', 'Tiny bunny ghosts', '작은 토끼 유령들', 'tiny bunny-shaped ghosts floating around', 'f3'],
      ],
      weapon: [
        ['bucket', 'Ghost candy bucket', '유령 사탕 바구니', 'holding a ghost-shaped candy bucket', ''],
        ['lantern', 'Paper lantern', '종이 등불', 'holding a small paper lantern', ''],
        ['plush', 'Bunny plush', '토끼 인형', 'hugging a small bunny plush', ''],
      ],
      device: [
        ['blush', 'Blush stickers', '볼 스티커', 'blush stickers', ''],
        ['nose', 'Painted bunny nose', '그린 토끼 코', 'painted bunny nose', ''],
        ['pale', 'Pale ghost makeup', '창백한 유령 분장', 'pale skin makeup', ''],
      ],
    },
  }),

  /* ─── V-67 유령 · 강아지 귀 ─── */
  costume('gh-dog', 'Ghost · Puppy Ears', '유령 · 강아지 귀', 'V-67', {
    tag: 'halloween costume, ghost costume, floppy dog ears', tagReal: 'ghost, halloween night, floppy dog ears',
    colors: ['white', 'bone white', 'lavender', 'pastel pink', 'sky blue', 'grey'],
    need: { device: '' },
    items: {
      garment: [
        ['hm-f', 'Bedsheet poncho with felt Puppy ears', '펠트 강아지 귀 단 홑이불 판초', 'white bedsheet poncho, felt floppy dog ears sewn on the hood, face showing, leggings', 'f0 F0 gf'],
        ['hm-m', 'Bedsheet poncho with felt Puppy ears', '펠트 강아지 귀 단 홑이불 판초', 'white bedsheet poncho, felt floppy dog ears sewn on the hood, face showing, trousers', 'f0 F0 gm'],
        ['pt-0', 'Puppy-eared sheet ghost, long', '강아지 귀 천 유령 · 긴 기장', 'ghost costume, white sheet poncho with floppy dog ears on the hood, hood up, face showing, ragged wavy hem, ankle-length poncho', 'f1 F1 x0 gf v:gh-dog-pt'],
        ['pt-1', 'Puppy-eared sheet ghost, knee', '강아지 귀 천 유령 · 무릎 기장', 'ghost costume, white sheet poncho with floppy dog ears on the hood, hood up, face showing, ragged wavy hem, knee-length poncho', 'f1 F1 x1 gf v:gh-dog-pt'],
        ['pt-2', 'Puppy-eared sheet ghost, short', '강아지 귀 천 유령 · 짧은 기장', 'ghost costume, white sheet poncho with floppy dog ears on the hood, hood up, face showing, ragged wavy hem, short poncho over a frilled skirt', 'f1 F1 x2 gf v:gh-dog-pt'],
        ['pt-m', 'Puppy-eared sheet ghost', '강아지 귀 천 유령', 'ghost costume, white sheet poncho with floppy dog ears on the hood, hood up, face showing, ragged wavy hem, long', 'f1 F1 x01 gm'],
        ['pt-m2', 'Short Puppy-eared ghost poncho', '짧은 강아지 귀 유령 판초', 'ghost costume, short white sheet poncho with floppy dog ears on the hood, face showing, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Chiffon ghost dress with Puppy ears, long', '강아지 귀 시폰 유령 원피스 · 긴 기장', 'layered white chiffon ghost dress, hood with floppy dog ears, wavy translucent hem, long sleeves, floor length', 'f2 x0 gf v:gh-dog-ed'],
        ['ed-1', 'Chiffon ghost dress with Puppy ears, knee', '강아지 귀 시폰 유령 원피스 · 무릎 기장', 'layered white chiffon ghost dress, hood with floppy dog ears, wavy translucent hem, puff sleeves, knee length', 'f2 x1 gf v:gh-dog-ed'],
        ['ed-2', 'Chiffon ghost dress with Puppy ears, short', '강아지 귀 시폰 유령 원피스 · 짧은 기장', 'layered white chiffon ghost dress, hood with floppy dog ears, wavy translucent hem, off-shoulder, short layered skirt', 'f2 x2 gf v:gh-dog-ed n:low'],
        ['ed-m', 'Chiffon ghost robe with Puppy ears', '강아지 귀 시폰 유령 로브', 'layered white chiffon ghost robe, hood with floppy dog ears, wavy translucent hem', 'f2 x01 gm'],
        ['ed-m2', 'Short chiffon ghost robe', '짧은 시폰 유령 로브', 'short white chiffon ghost robe, hood with floppy dog ears, shorts', 'f2 x2 gm'],
      ],
      structure: [
        ['ribbon', 'Ribbon belt', '리본 벨트', 'ribbon tied at the waist', ''],
      ],
      foundation: [
        ['socks', 'Frilled socks', '프릴 양말', 'white frilled socks', 'gf'],
        ['striped', 'Striped socks', '줄무늬 양말', 'white and grey striped socks', ''],
      ],
      neckwear: [
        ['bell', 'Bell on a ribbon', '리본 방울', 'small bell on a ribbon', ''],
      ],
      outer: [],
      footwear: [
        ['slippers', 'Puppy slippers', '강아지 슬리퍼', 'fluffy puppy slippers', ''],
        ['mary', 'White mary janes', '흰 메리제인', 'white mary janes', 'gf'],
      ],
      headwear: [],
      accessories: [
        ['tail', 'Clip-on puppy tail', '달아 놓은 강아지 꼬리', 'clip-on costume puppy tail', ''],
        ['paws', 'Paw mittens', '발바닥 벙어리장갑', 'paw mittens', 'f1'],
        ['ghosts', 'Tiny puppy ghosts', '작은 강아지 유령들', 'tiny puppy-shaped ghosts floating around', 'f3'],
      ],
      weapon: [
        ['bucket', 'Ghost candy bucket', '유령 사탕 바구니', 'holding a ghost-shaped candy bucket', ''],
        ['lantern', 'Paper lantern', '종이 등불', 'holding a small paper lantern', ''],
        ['plush', 'Puppy plush', '강아지 인형', 'hugging a small puppy plush', ''],
      ],
      device: [
        ['blush', 'Blush stickers', '볼 스티커', 'blush stickers', ''],
        ['nose', 'Painted puppy nose', '그린 강아지 코', 'painted puppy nose', ''],
        ['pale', 'Pale ghost makeup', '창백한 유령 분장', 'pale skin makeup', ''],
      ],
    },
  }),

  /* ─── V-68 늑대인간 · 야성 ─── */
  costume('ww-wild', 'Werewolf · Wild', '늑대인간 · 야성', 'V-68', {
    tag: 'halloween costume, werewolf costume, fake animal ears', tagReal: 'werewolf costume, halloween night, full moon',
    colors: ['brown', 'charcoal', 'grey', 'rust', 'black'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Torn flannel and felt ears', '찢은 플란넬과 펠트 귀', 'torn flannel shirt dress, faux fur patches sewn on', 'f0 F0 gf'],
        ['hm-m', 'Torn flannel and felt ears', '찢은 플란넬과 펠트 귀', 'torn flannel shirt, ripped jeans, faux fur patches sewn on', 'f0 F0 gm'],
        ['pt-0', 'Torn fur-trimmed outfit, long', '찢긴 털 장식 차림 · 긴 기장', 'werewolf costume, torn flannel, faux fur trim, ragged hem, long torn skirt', 'f1 F1 x0 gf v:ww-wild-pt'],
        ['pt-1', 'Torn fur-trimmed outfit, knee', '찢긴 털 장식 차림 · 무릎 기장', 'werewolf costume, torn flannel, faux fur trim, ragged hem, knee-length torn skirt', 'f1 F1 x1 gf v:ww-wild-pt'],
        ['pt-2', 'Torn fur-trimmed outfit, short', '찢긴 털 장식 차림 · 짧은 기장', 'werewolf costume, torn flannel, faux fur trim, ragged hem, cropped torn top, torn shorts', 'f1 F1 x2 gf v:ww-wild-pt'],
        ['pt-m', 'Torn flannel and fur vest', '찢긴 플란넬과 털 조끼', 'werewolf costume, torn flannel shirt, faux fur vest, ripped jeans', 'f1 F1 x01 gm'],
        ['pt-m2', 'Torn sleeveless shirt', '찢긴 민소매 셔츠', 'werewolf costume, torn sleeveless shirt, faux fur collar, ripped jeans', 'f1 F1 x2 gm'],
        ['ed-0', 'Shaggy fur and leather outfit, long', '복슬한 털과 가죽 차림 · 긴 기장', 'werewolf, shaggy faux fur bodice, leather straps, shredded skirt, long sleeves, long shredded skirt', 'f2 x0 gf v:ww-wild-ed'],
        ['ed-1', 'Shaggy fur and leather outfit, knee', '복슬한 털과 가죽 차림 · 무릎 기장', 'werewolf, shaggy faux fur bodice, leather straps, shredded skirt, short sleeves, knee length', 'f2 x1 gf v:ww-wild-ed'],
        ['ed-2', 'Shaggy fur and leather outfit, short', '복슬한 털과 가죽 차림 · 짧은 기장', 'werewolf, shaggy faux fur bodice, leather straps, shredded skirt, fur bralette top, shredded mini skirt', 'f2 x2 gf v:ww-wild-ed'],
        ['ed-m', 'Shaggy fur coat', '복슬한 털 코트', 'werewolf, shaggy faux fur coat, leather straps, torn trousers', 'f2 x01 gm'],
        ['ed-m2', 'Open fur coat', '풀어 입은 털 코트', 'werewolf, open shaggy faux fur coat, torn trousers', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Leather straps', '가죽 끈', 'leather straps around the waist', ''],
      ],
      foundation: [
        ['torn', 'Torn tights', '찢긴 타이츠', 'torn tights', 'gf'],
        ['legwarmers', 'Shaggy fur leg warmers', '복슬한 털 레그워머', 'shaggy faux fur leg warmers', ''],
        ['thigh', 'Black thigh-high socks', '검은 니삭스', 'black thigh-high socks', 'gf'],
        ['straps', 'Leather straps around the thighs', '허벅지에 감은 가죽 끈', 'leather straps wrapped around the thighs', 'x12 gf'],
      ],
      neckwear: [
        ['collar', 'Studded collar', '징 목걸이', 'studded collar', ''],
      ],
      outer: [],
      footwear: [
        ['paw', 'Paw boots', '발바닥 부츠', 'fluffy paw boots', ''],
        ['boots', 'Worn boots', '낡은 부츠', 'worn boots', ''],
      ],
      headwear: [
        ['ears', 'Wolf ears', '늑대 귀', 'fake wolf ears, headband', ''],
      ],
      accessories: [
        ['tail', 'Wolf tail', '늑대 꼬리', 'clip-on costume wolf tail', ''],
        ['claws', 'Claw gloves', '발톱 장갑', 'costume claw gloves', ''],
        ['moon', 'Full moon behind', '등 뒤 보름달', 'huge full moon behind', 'f3'],
      ],
      weapon: [
        ['howl', 'Howling pose', '울부짖는 자세', 'howling at the sky', ''],
        ['bone', 'Bone cookie', '뼈다귀 쿠키', 'holding a bone-shaped cookie', ''],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs', ''],
        ['eyes', 'Glowing amber eyes', '호박색으로 빛나는 눈', 'glowing amber eyes', 'f3'],
      ],
    },
  }),

  /* ─── V-69 늑대인간 · 신사 ─── */
  costume('ww-gent', 'Werewolf · Gentleman', '늑대인간 · 신사', 'V-69', {
    tag: 'halloween costume, werewolf costume, fake animal ears, formal', tagReal: 'werewolf, formal, halloween night, moonlight',
    colors: ['charcoal', 'black', 'burgundy', 'brown', 'navy'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Blazer dress and felt ears', '블레이저 원피스와 펠트 귀', 'grey blazer dress, felt wolf ears pinned on', 'f0 F0 gf'],
        ['hm-m', 'Blazer and felt ears', '블레이저와 펠트 귀', 'grey blazer, white shirt, slacks, felt wolf ears pinned on', 'f0 F0 gm'],
        ['pt-0', 'Fur-collared formal dress, long', '털 깃 정장 원피스 · 긴 기장', 'werewolf costume, tailored dress, faux fur collar, waistcoat bodice, long sleeves, long skirt', 'f1 F1 x0 gf v:ww-gent-pt'],
        ['pt-1', 'Fur-collared formal dress, knee', '털 깃 정장 원피스 · 무릎 기장', 'werewolf costume, tailored dress, faux fur collar, waistcoat bodice, long sleeves, knee length', 'f1 F1 x1 gf v:ww-gent-pt'],
        ['pt-2', 'Fur-collared formal dress, short', '털 깃 정장 원피스 · 짧은 기장', 'werewolf costume, tailored dress, faux fur collar, waistcoat bodice, sleeveless, short skirt', 'f1 F1 x2 gf v:ww-gent-pt'],
        ['pt-m', 'Fur-collared suit', '털 깃 정장', 'werewolf costume, three-piece suit, faux fur collar', 'f1 F1 x01 gm'],
        ['pt-m2', 'Rolled-sleeve waistcoat', '소매 걷은 조끼 차림', 'werewolf costume, waistcoat, rolled sleeves, loosened tie, faux fur cuffs', 'f1 F1 x2 gm'],
        ['ed-0', 'Velvet coat with wolf fur, long', '늑대 털 벨벳 코트 · 긴 기장', 'werewolf, velvet tailcoat dress, grey wolf fur collar, silver buttons, high collar, floor length', 'f2 x0 gf v:ww-gent-ed n:high'],
        ['ed-1', 'Velvet coat with wolf fur, knee', '늑대 털 벨벳 코트 · 무릎 기장', 'werewolf, velvet tailcoat dress, grey wolf fur collar, silver buttons, knee length', 'f2 x1 gf v:ww-gent-ed'],
        ['ed-2', 'Velvet coat with wolf fur, short', '늑대 털 벨벳 코트 · 짧은 기장', 'werewolf, velvet tailcoat dress, grey wolf fur collar, silver buttons, corset waistcoat, short skirt', 'f2 x2 gf v:ww-gent-ed'],
        ['ed-m', 'Velvet tailcoat with wolf fur', '늑대 털 벨벳 연미복', 'werewolf, velvet tailcoat, grey wolf fur collar, silver buttons', 'f2 x01 gm'],
        ['ed-m2', 'Open velvet tailcoat', '풀어 입은 벨벳 연미복', 'werewolf, open velvet tailcoat, open collar shirt, fur cuffs', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['watch', 'Pocket watch', '회중시계', 'pocket watch', ''],
      ],
      foundation: [
        ['black', 'Black tights', '검은 타이츠', 'black tights', 'gf'],
      ],
      neckwear: [
        ['cravat', 'Silk cravat', '실크 크라바트', 'silk cravat', ''],
      ],
      outer: [
        ['coat', 'Long overcoat', '긴 외투', 'long overcoat', 'f1'],
      ],
      footwear: [
        ['oxford', 'Oxford shoes', '옥스퍼드 구두', 'polished oxford shoes', ''],
      ],
      headwear: [
        ['ears', 'Wolf ears', '늑대 귀', 'fake wolf ears, headband', ''],
        ['tophat', 'Top hat with ear holes', '귀 구멍 실크해트', 'top hat with wolf ears poking through', 'f1'],
      ],
      accessories: [
        ['gloves', 'White gloves', '흰 장갑', 'white gloves', ''],
        ['tail', 'Wolf tail', '늑대 꼬리', 'clip-on costume wolf tail', ''],
        ['moon', 'Full moon behind', '등 뒤 보름달', 'full moon behind', 'f3'],
      ],
      weapon: [
        ['cane', 'Silver-tipped cane', '은 손잡이 지팡이', 'holding a silver-tipped cane', ''],
        ['tea', 'Teacup', '찻잔', 'holding a teacup', ''],
      ],
      device: [
        ['fang', 'Fangs', '송곳니', 'fangs, smirk', ''],
      ],
    },
  }),

  /* ─── V-70 늑대인간 · 후드 ─── */
  costume('ww-hood', 'Werewolf · Hoodie', '늑대인간 · 후드', 'V-70', {
    tag: 'werewolf hoodie, wolf ears, streetwear, halloween', tagReal: 'werewolf, streetwear, halloween night, full moon',
    colors: ['grey', 'black', 'charcoal', 'brown', 'crimson'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'Grey hoodie with felt ears', '펠트 귀 회색 후드티', 'grey hoodie dress, felt wolf ears on the hood', 'f0 F0 gf'],
        ['hm-m', 'Grey hoodie with felt ears', '펠트 귀 회색 후드티', 'grey hoodie, felt wolf ears on the hood, joggers', 'f0 F0 gm'],
        ['pt-0', 'Wolf-ear oversized hoodie, long', '늑대 귀 오버사이즈 후드 · 긴 기장', 'oversized grey hoodie with wolf ears on the hood, fur-trimmed cuffs, long cargo skirt', 'f1 F1 x0 gf v:ww-hood-pt'],
        ['pt-1', 'Wolf-ear oversized hoodie, knee', '늑대 귀 오버사이즈 후드 · 무릎 기장', 'oversized grey hoodie with wolf ears on the hood, fur-trimmed cuffs, pleated skirt, knee length', 'f1 F1 x1 gf v:ww-hood-pt'],
        ['pt-2', 'Wolf-ear oversized hoodie, short', '늑대 귀 오버사이즈 후드 · 짧은 기장', 'oversized grey hoodie with wolf ears on the hood, fur-trimmed cuffs, cropped hoodie, shorts', 'f1 F1 x2 gf v:ww-hood-pt'],
        ['pt-m', 'Wolf-ear hoodie and joggers', '늑대 귀 후드와 조거', 'oversized grey hoodie with wolf ears on the hood, joggers', 'f1 F1 x01 gm'],
        ['pt-m2', 'Sleeveless wolf hoodie', '민소매 늑대 후드', 'sleeveless grey hoodie with wolf ears, shorts', 'f1 F1 x2 gm'],
        ['ed-0', 'Fur-hood parka, long', '털 후드 파카 · 긴 기장', 'grey parka with a fur-trimmed wolf-ear hood, claw-mark print, long parka, wide trousers', 'f2 x0 gf v:ww-hood-ed'],
        ['ed-1', 'Fur-hood parka, knee', '털 후드 파카 · 무릎 기장', 'grey parka with a fur-trimmed wolf-ear hood, claw-mark print, knee-length parka, shorts over tights', 'f2 x1 gf v:ww-hood-ed'],
        ['ed-2', 'Fur-hood parka, short', '털 후드 파카 · 짧은 기장', 'grey parka with a fur-trimmed wolf-ear hood, claw-mark print, cropped parka, crop top, mini skirt', 'f2 x2 gf v:ww-hood-ed'],
        ['ed-m', 'Fur-hood parka', '털 후드 파카', 'grey parka with a fur-trimmed wolf-ear hood, claw-mark print, cargo pants', 'f2 x01 gm'],
        ['ed-m2', 'Open fur-hood parka', '풀어 입은 털 후드 파카', 'open grey parka with a fur-trimmed wolf-ear hood, tank top', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['belt', 'Studded belt', '징 벨트', 'studded belt', ''],
      ],
      foundation: [
        ['socks', 'Crew socks', '크루 양말', 'white crew socks', ''],
      ],
      neckwear: [
        ['headphones', 'Headphones', '헤드폰', 'headphones around the neck', ''],
      ],
      outer: [],
      footwear: [
        ['sneakers', 'Chunky sneakers', '두꺼운 운동화', 'chunky sneakers', ''],
      ],
      headwear: [
        ['hood', 'Wolf-ear hood up', '늑대 귀 후드 씀', 'hood with wolf ears, hood up', ''],
      ],
      accessories: [
        ['tail', 'Wolf tail charm', '늑대 꼬리 키링', 'wolf tail charm on the belt loop', ''],
        ['claws', 'Paw gloves', '발바닥 장갑', 'paw gloves', ''],
        ['moon', 'Full moon behind', '등 뒤 보름달', 'full moon behind', 'f3'],
      ],
      weapon: [
        ['boba', 'Bubble tea', '버블티', 'holding a bubble tea', ''],
        ['phone', 'Phone', '휴대폰', 'holding a phone', ''],
      ],
      device: [
        ['fang', 'Fang', '덧니', 'fang', ''],
        ['bandaid', 'Bandaid on the cheek', '볼 반창고', 'bandaid on cheek', ''],
      ],
    },
  }),

  /* ─── V-71 프랑켄슈타인 · 신부 ─── */
  costume('f-bride', 'Frankenstein · Bride', '프랑켄슈타인 · 신부', 'V-71', {
    tag: 'halloween costume, monster\'s bride costume, stitches', tagReal: 'monster\'s bride, halloween night, lightning',
    tagM: 'halloween costume, monster groom costume, stitches', tagRealM: 'monster groom, halloween night, lightning',
    colors: ['white', 'bone white', 'black', 'mint', 'grey'],
    need: { headwear: '' },
    items: {
      garment: [
        ['hm-f', 'White dress with drawn stitches', '바느질 자국 그린 흰 원피스', 'white dress, stitches drawn in marker, bandage strips on the sleeves', 'f0 F0 gf'],
        ['hm-m', 'Old suit with drawn stitches', '바느질 자국 그린 헌 양복', 'old black suit, stitches drawn in marker', 'f0 F0 gm'],
        ['pt-0', 'Stitched bride dress, long', '꿰맨 신부 원피스 · 긴 기장', 'monster\'s bride costume, white dress, visible stitches, bandage-wrapped sleeves, long sleeves, floor length', 'f1 F1 x0 gf v:f-bride-pt'],
        ['pt-1', 'Stitched bride dress, knee', '꿰맨 신부 원피스 · 무릎 기장', 'monster\'s bride costume, white dress, visible stitches, bandage-wrapped sleeves, puff sleeves, knee length', 'f1 F1 x1 gf v:f-bride-pt'],
        ['pt-2', 'Stitched bride dress, short', '꿰맨 신부 원피스 · 짧은 기장', 'monster\'s bride costume, white dress, visible stitches, bandage-wrapped sleeves, off-shoulder, short layered skirt', 'f1 F1 x2 gf v:f-bride-pt n:low'],
        ['pt-m', 'Stitched groom suit', '꿰맨 신랑 정장', 'monster groom costume, black suit, visible stitches, bandaged hand', 'f1 F1 x01 gm'],
        ['pt-m2', 'Open stitched groom shirt', '풀어 입은 꿰맨 신랑 셔츠', 'monster groom costume, open white shirt, stitched seams, black trousers', 'f1 F1 x2 gm n:low'],
        ['ed-0', 'Patchwork wedding gown, long', '패치워크 웨딩드레스 · 긴 기장', 'monster\'s bride, white patchwork wedding gown, contrast stitching, lightning-bolt lace, high collar, long sleeves, train', 'f2 x0 gf v:f-bride-ed n:high'],
        ['ed-1', 'Patchwork wedding gown, knee', '패치워크 웨딩드레스 · 무릎 기장', 'monster\'s bride, white patchwork wedding gown, contrast stitching, lightning-bolt lace, square neckline, knee length', 'f2 x1 gf v:f-bride-ed'],
        ['ed-2', 'Patchwork wedding gown, short', '패치워크 웨딩드레스 · 짧은 기장', 'monster\'s bride, white patchwork wedding gown, contrast stitching, lightning-bolt lace, corset bodice, high slit', 'f2 x2 gf v:f-bride-ed'],
        ['ed-m', 'Patchwork wedding tailcoat', '패치워크 웨딩 연미복', 'monster groom, black patchwork tailcoat, contrast stitching', 'f2 x01 gm'],
        ['ed-m2', 'Open patchwork tailcoat', '풀어 입은 패치워크 연미복', 'monster groom, open patchwork tailcoat, stitched shirt', 'f2 x2 gm n:low'],
      ],
      structure: [
        ['sash', 'Bandage sash', '붕대 허리띠', 'bandage tied as a sash', ''],
      ],
      foundation: [
        ['white', 'White stockings', '흰 스타킹', 'white stockings', 'gf'],
      ],
      neckwear: [
        ['bolt', 'Bolt choker', '나사 초커', 'choker with costume bolts', ''],
      ],
      outer: [],
      footwear: [
        ['heels', 'White heels', '흰 힐', 'white heels', 'gf'],
        ['boots', 'Black boots', '검은 부츠', 'black boots', ''],
      ],
      headwear: [
        ['veil', 'Tattered veil', '해진 베일', 'tattered white veil', 'gf'],
        ['bolts', 'Bolt headband', '나사 머리띠', 'headband with costume bolts', ''],
      ],
      accessories: [
        ['gloves', 'Lace gloves', '레이스 장갑', 'white lace gloves', 'gf'],
        ['sparks', 'Electric sparks', '전기 불꽃', 'electric sparks crackling around', 'f3'],
      ],
      weapon: [
        ['bouquet', 'Dead flower bouquet', '시든 꽃다발', 'holding a bouquet of dried black roses', ''],
        ['bulb', 'Glowing bulb', '빛나는 전구', 'holding a glowing light bulb', 'f2'],
      ],
      device: [
        ['stitch', 'Stitched face paint', '바느질 자국 분장', 'stitches painted on the face', ''],
        ['green', 'Pale green face paint', '연두 얼굴 분장', 'pale green face paint', ''],
      ],
    },
  }),

]);

/* ═══════════════════════════════════════════════════════════════════
 * 큰 갈래 — 화면에서 고르는 컬렉션은 넷. 위의 작은 컬렉션들은 재료이고, 안에서는 소제목(groupKo / groupEn)으로 묶인다.
 *   클래식 분장(가게에서 사는 서양식 파티 분장) · 일러스트풍(그림 속 행사 의상과 원형별 갈래) · 할로윈 일상복 · 코스프레
 * ═══════════════════════════════════════════════════════════════════ */
function bundle(id, label, volume, range, parts) {
  const periods = [], colors = new Set();
  for (const [col, ko, en, keep] of parts) {
    for (const p of col.periods) {
      if (keep && !keep(p)) continue;
      p.groupKo = ko; p.groupEn = en;
      periods.push(p);
      (p.colors || []).forEach(c => colors.add(c));
    }
    col.pools.colors.forEach(c => colors.add(c));
  }
  return collection(id, label, volume, range, [...colors], periods);
}
const startsWith = pre => p => p.id.startsWith(pre);
const classic = bundle('classic', 'CLASSIC COSTUMES', 'PA·TFY·I', 'store-bought party costumes', [
  [monster, '몬스터 · 괴담', 'Monsters & Legends'], [storybook, '동화 · 생물', 'Fairy Tales & Creatures'], [retro, '시대 · 복고', 'Historical & Retro', p => !['aerobics','disco'].includes(p.id)], [uniform, '직업 · 제복', 'Jobs & Uniforms'],
]);
const illustrated = bundle('illust', 'ILLUSTRATED', 'PA·TFY·II', 'illustrated outfits', [
  [eventNight, '창작 디자인', 'Original Designs'],
  [variant, '마녀 디자인', 'Witch Designs', startsWith('w-')], [variant, '빨간 모자 디자인', 'Red Hood Designs', startsWith('rh-')],
  [variant, '메이드 디자인', 'Maid Designs', startsWith('m-')], [variant, '뱀파이어 디자인', 'Vampire Designs', startsWith('v-')],
  [variant, '서큐버스 디자인', 'Succubus Designs', startsWith('s-')], [variant, '프랑켄슈타인 디자인', 'Frankenstein Designs', startsWith('f-')],
  [variant, '고양이 디자인', 'Cat Designs', startsWith('c-')], [variant, '인어 디자인', 'Mermaid Designs', startsWith('mm-')],
  [variant, '히어로 디자인', 'Hero Designs', startsWith('h-')], [variant, '신화 디자인', 'Mythic Designs', startsWith('my-')],
  [variant, '천사 디자인', 'Angel Designs', startsWith('an-')], [variant, '백조 디자인', 'Swan Designs', startsWith('sw-')],
  [variant, '바니 디자인', 'Bunny Designs', startsWith('bn-')], [variant, '세이렌 디자인', 'Siren Designs', startsWith('sr-')],
  [variant, '강시 디자인', 'Jiangshi Designs', startsWith('js-')], [variant, '요정 디자인', 'Fairy Designs', startsWith('fy-')],
  [variant, '잭오랜턴 디자인', "Jack-o'-lantern Designs", startsWith('jl-')], [variant, '유령 디자인', 'Ghost Designs', startsWith('gh-')],
  [variant, '늑대인간 디자인', 'Werewolf Designs', startsWith('ww-')],
]);
everyday.volume = 'PA·TFY·III';
/* 코스프레 목록의 소제목 */
for (const p of cosplay.periods) { const hq = p.id.startsWith('hq-'); p.groupKo = hq ? '할리퀸' : '조커'; p.groupEn = hq ? 'Harley Quinn' : 'Joker'; }

/* 성별을 따라가는 분장 이름 — 남성(m) · 여성(f)으로 고르면 그 이름, 중성이면 기본 이름(짝 이름이면 둘 다).
 * 이름이 원래 성별 없는 분장(사신 · 빨간 모자 갈래 · 신화 갈래 …)은 적지 않는다. */
const GENDER_NAMES = {
  witch: { m: ['Warlock', '마법사'] }, ribbonwitch: { m: ['Ribbon Warlock', '리본 마법사'] },
  bride: { m: ["Monster's Groom", '괴물의 신랑'] }, ghostbride: { m: ['Ghost Groom', '유령 신랑'] },
  foggent: { f: ['Fog Lady', '안개 속 숙녀'] }, windup: { m: ['Wind-up Soldier', '태엽 병정'] },
  phantom: { f: ['Masked Prima Donna', '가면의 프리마돈나'] },
  mermaid: { m: ['Merman', '인어'] }, redhood: { m: ['Woodsman', '나무꾼'] }, princess: { m: ['Prince', '왕자'] },
  flapper: { m: ['1920s Gentleman', '1920년대 신사'] }, gogo: { m: ['60s Mod', '60년대 모즈'] },
  pinup: { f: ['Pin-up', '핀업'], m: ['Greaser', '그리저'] }, cowgirl: { f: ['Cowgirl', '카우걸'], m: ['Cowboy', '카우보이'] },
  egypt: { f: ['Egyptian Queen', '이집트 여왕'], m: ['Pharaoh', '파라오'] }, greek: { f: ['Greek Goddess', '그리스 여신'], m: ['Greek God', '그리스 신'] },
  nurse: { m: ['Doctor', '의사'] }, zombienurse: { m: ['Zombie Doctor', '좀비 의사'] }, hauntednun: { m: ['Haunted Monk', '그림자 수도사'] }, redqueen: { m: ['Red King', '붉은 왕'] },
  maid: { f: ['French Maid', '프렌치 메이드'], m: ['Butler', '집사'] }, halloweenmaid: { m: ['Halloween Butler', '할로윈 집사'] },
  bunny: { f: ['Bunny Girl', '바니걸'], m: ['Bunny Boy', '바니보이'] },
  'jl-witch': { m: ["Jack-o'-lantern · Warlock", '잭오랜턴 · 호박 마법사'] }, 'f-bride': { m: ['Frankenstein · Groom', '프랑켄슈타인 · 신랑'] },
};
for (const c of [classic, illustrated, everyday, cosplay]) for (const p of c.periods) {
  const pre = p.label.split(' · ')[0], rest = p.label.slice(pre.length), restKo = (p.labelKo || '').includes('·') ? ' ' + (p.labelKo || '').slice((p.labelKo || '').indexOf('·')) : '';
  if (pre === 'Witch' && rest) GENDER_NAMES[p.id] = { m: ['Warlock' + rest, '마법사' + restKo.replace('흑마녀', '흑마법사')] };
  if (pre === 'Maid' && rest) GENDER_NAMES[p.id] = { m: ['Butler' + rest, '집사' + restKo] };
  if (pre === 'Succubus' && rest) GENDER_NAMES[p.id] = { m: ['Incubus' + rest, '인큐버스' + restKo] };
  if (pre === 'Bunny Girl' && rest) GENDER_NAMES[p.id] = { m: ['Bunny Boy' + rest, '바니보이' + restKo] };
  if (pre === 'Mermaid' && rest) GENDER_NAMES[p.id] = { m: ['Merman' + rest, p.labelKo] };
  const n = GENDER_NAMES[p.id]; if (!n) continue;
  if (n.m) { p.labelM = n.m[0]; p.labelKoM = n.m[1]; }
  if (n.f) { p.labelF = n.f[0]; p.labelKoF = n.f[1]; }
}

/* 원형 갈래 — 상위 분장(마녀)을 ◇로 잠그면 Ring이 같은 갈래(마녀 · 견습 · 별 …, 리본 마녀)에서 돌아가며 뽑는다.
 * 기본은 영어 이름의 ' · ' 앞부분. 이름이 다른 같은 원형은 여기 적는다 — [갈래, 상위 분장이면 1]. */
const TF_FAMILY_OF = {
  ghost: ['Ghost', 1], frank: ['Frankenstein', 1], cat: ['Cat', 1], redhood: ['Red Hood', 1], maid: ['Maid', 1], bunny: ['Bunny Girl', 1],
  ribbonwitch: ['Witch'], frillvamp: ['Vampire'], imp: ['Devil'], halloweenmaid: ['Maid'], cathood: ['Cat'], wolfhood: ['Werewolf'], bride: ['Frankenstein'],
};

/* 화면 이름. label은 저장한 프리셋의 선택값이므로 그대로 두고 표시 이름만 다듬는다.
 * 테마 디자인은 '원형 · 테마', 성별 짝은 '이름 / 이름'으로 적는다. */
const TF_COSTUME_NAMES = {
  princess: ['공주 · 할로윈 무도회', 'Princess · Halloween Ball', '왕자 · 할로윈 무도회', 'Prince · Halloween Ball'],
  ghost: ['천 유령', 'Sheet Ghost'],
  bug: ['꿀벌 / 무당벌레', 'Bee / Ladybug'],
  gangster: ['갱스터 / 연인', 'Gangster / Moll'],
  pinup: ['핀업 / 그리저', 'Pin-up / Greaser'],
  cowgirl: ['카우걸 / 카우보이', 'Cowgirl / Cowboy'],
  egypt: ['이집트 여왕 / 파라오', 'Egyptian Queen / Pharaoh'],
  greek: ['그리스 여신 / 신', 'Greek Goddess / God'],
  maid: ['프렌치 메이드 / 집사', 'French Maid / Butler'],
  ribbonwitch: ['마녀 · 리본', 'Witch · Ribbon', '마법사 · 리본', 'Warlock · Ribbon'],
  frillvamp: ['뱀파이어 · 프릴', 'Vampire · Frills'],
  imp: ['악마 · 소악마', 'Devil · Imp'],
  wolfhood: ['늑대 · 후드', 'Wolf · Hood'],
  cathood: ['고양이 · 후드', 'Cat · Hood'],
  bandagebunny: ['토끼 · 붕대', 'Bunny · Bandages'],
  patchdoll: ['인형 · 패치워크', 'Doll · Patchwork'],
  lanternghost: ['유령 · 등불', 'Ghost · Lantern'],
  pumpkindress: ['호박 · 드레스', 'Pumpkin · Dress'],
  hauntednun: ['수녀 · 그림자', 'Nun · Shadow', '수도사 · 그림자', 'Monk · Shadow'],
  zombienurse: ['간호사 · 좀비', 'Nurse · Zombie', '의사 · 좀비', 'Doctor · Zombie'],
  halloweenmaid: ['메이드 · 할로윈', 'Maid · Halloween', '집사 · 할로윈', 'Butler · Halloween'],
  onesie: ['동물 · 잠옷', 'Animal · Onesie'],
  'w-forest': ['마녀 · 약초술사', 'Witch · Herbalist', '마법사 · 약초술사', 'Warlock · Herbalist'],
  'w-dark': ['마녀 · 흑마법', 'Witch · Dark Magic', '마법사 · 흑마법', 'Warlock · Dark Magic'],
  'm-jersey': ['메이드 · 저지 소재', 'Maid · Jersey Fabric', '집사 · 저지 소재', 'Butler · Jersey Fabric'],
  'v-white': ['뱀파이어 · 순백', 'Vampire · Pure White'],
  'c-familiar': ['고양이 · 사역마', 'Cat · Familiar'],
  'c-cafe': ['고양이 · 카페', 'Cat · Cafe'],
  'c-thief': ['고양이 · 도둑', 'Cat · Burglar'],
  'sw-white': ['백조 · 순백', 'Swan · Pure White'],
  'sw-black': ['백조 · 흑조', 'Swan · Black Swan'],
  'jl-witch': ['잭오랜턴 · 마녀', "Jack-o'-lantern · Witch", '잭오랜턴 · 마법사', "Jack-o'-lantern · Warlock"],
  'jl-devil': ['잭오랜턴 · 악마', "Jack-o'-lantern · Devil"],
  daily: ['일상복 · 캐주얼', 'Everyday · Casual'],
  school: ['일상복 · 교복', 'Everyday · School Uniform'],
  nightout: ['일상복 · 파티', 'Everyday · Party'],
  office: ['일상복 · 오피스', 'Everyday · Office'],
  athleisure: ['일상복 · 트레이닝', 'Everyday · Athleisure'],
  cafe: ['일상복 · 카페 유니폼', 'Everyday · Cafe Uniform'],
  pajama: ['일상복 · 파자마 파티', 'Everyday · Pajama Party'],
  date: ['일상복 · 데이트', 'Everyday · Date'],
  'hq-classic': ['할리퀸 · 애니메이션', 'Harley Quinn · Animation'],
};
for (const c of [classic, illustrated, everyday, cosplay]) for (const p of c.periods) {
  const names = TF_COSTUME_NAMES[p.id];
  if (!names) continue;
  [p.labelKo, p.labelEn] = names;
  if (names[2]) [p.labelKoM, p.labelM] = names.slice(2);
}
