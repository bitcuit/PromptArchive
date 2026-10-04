// Prompt Archive : Perennial — seasonal scene data
// 장면 하나가 자기 풍경 · 빛 · 순간 · 소품 후보 · 옷 후보를 갖는다. 랜덤은 장면이 권하는 것에서만 뽑는다.
//   place    장소 한 줄 (항상 출력)
//   core     그 장소를 이루는 풍경 (항상 출력)
//   details  곁들이는 풍경 — 서브 소품 (밀도에 따라 1 · 3 · 5개). { t, kinds } 로 쓰면 그 빛에서만 나온다(흐린 날의 파란 하늘 같은 것을 막는다)
//   lights   { kind } 는 day · golden · dusk · night · rain · snow · overcast 중 하나. 소품 · 순간의 kinds 와 맞춘다
//   moments  메인 소품이 없을 때 인물이 하고 있는 일. pose 는 stand · walk · sit · lie · squat
//            face 는 눈의 상태와 시선만(eyes closed · eye contact · one eye closed). 감정 표현은 캐릭터마다 달라 쓰지 않는다. 뒤에서 찍는 구도면 빠짐, shoes 는 옷의 신발을 바꿈('' 이면 맨발)
//            소품 동작의 seasons 는 그 계절 장면에서만 쓴다
//   props / outfits / shots / tones   랜덤일 때 이 장면에서 뽑히는 후보 id
// 메인 소품: 첫째는 acts 로 순간을 바꾸고, 둘째(곁 소품)는 첫째의 pairs 에 있는 것만 near 문구로 곁에 놓인다.

// 옷장 조각 하나: id · 한국어 이름 · 프롬프트 문구 · 규칙 표시
//   crop · hw(하이웨이스트) · cover(수영복 위) · beach / beachOnly(해변 신발) · g(소품 부위)
//   sex 'f' · 'm' (없으면 공용) · long(발목까지 오는 겉옷) · short(미니 · 반바지 — 긴 겉옷과 안 씀) · sporty(운동복 결 — 격식 있는 주얼리와 안 씀)
const C = (id, k, t, extra = {}) => ({ id, k, t, ...extra });
// 옷장 소품 하나: id · 한국어 이름 · 프롬프트 문구 · 규칙(g 부위 · seasons · sex · swim · swimOnly · dressy · hatClash)
const A = (id, k, t, extra = {}) => ({ id, k, t, ...extra });

// 꽃가지: 꽃 이름만 바꿔 같은 동작을 쓴다
const branchActs = (name) => [
  { id: 'shoulder', label: '가지를 어깨에 걸치고 걷기', pose: 'walk', tags: ['walking', name + ' resting on the shoulder'], face: [] },
  { id: 'peek', label: '가지를 얼굴 앞에 들고 꽃 너머로 보기', pose: 'stand', tags: ['holding ' + name + ' in front of the face', 'looking through the blossoms'], face: ['eye contact'] },
  { id: 'raise', label: '가지를 머리 위로 들어 올리기', pose: 'stand', tags: ['raising ' + name + ' overhead', 'looking up at it'], face: [] },
  { id: 'blow', label: '가지의 꽃잎 후 불기', pose: 'stand', tags: ['blowing petals off ' + name], face: [] },
  { id: 'nose', label: '가지를 코에 대기', pose: 'stand', tags: ['holding ' + name + ' to the nose'], face: ['eyes closed'] }
];
// 꽃다발
const bouquetActs = (name) => [
  { id: 'hug', label: '꽃다발을 가슴에 안기', pose: 'stand', tags: ['hugging ' + name + ' to the chest'], face: [] },
  { id: 'offer', label: '꽃다발 내밀기', pose: 'stand', tags: ['holding out ' + name + ' with both hands'], face: ['eye contact'] },
  { id: 'bury', label: '꽃에 얼굴 묻기', pose: 'stand', tags: ['face buried in ' + name], face: ['eyes closed'] },
  { id: 'peek', label: '꽃다발 위로 눈만 내놓기', pose: 'stand', tags: [name + ' held up just below the eyes'], face: ['eye contact'] },
  { id: 'arm', label: '한 팔에 안고 걷기', pose: 'walk', tags: ['walking', 'cradling ' + name + ' in one arm'], face: [] },
  { id: 'lap', label: '무릎에 두고 앉기', pose: 'sit', tags: ['sitting', name + ' resting on the lap', 'looking down at it'], face: [] }
];

// 우산은 생김새만 다르고 하는 일은 같다
const umbrellaActs = (name) => [
  { id: 'twirl', label: '우산 빙글 돌리기', pose: 'stand', tags: ['twirling the ' + name, 'raindrops flying off'], face: [] },
  { id: 'tilt', label: '우산을 젖히고 비 맞기', pose: 'stand', tags: ['tilting the ' + name + ' back', 'face to the rain'], face: ['eyes closed'] },
  { id: 'under', label: '우산 아래 쪼그려 앉기', pose: 'squat', tags: ['squatting under the ' + name, 'looking at the puddles'], face: [] },
  { id: 'shoulder', label: '우산을 어깨에 걸고 걷기', pose: 'walk', tags: ['walking', 'the ' + name + ' resting on the shoulder'], face: [] }
];

const PERENNIAL = {
  // 옷 장식(decor · motifs)의 한국어 이름. 설정 칸의 칩에 보인다
  decorKo: {
    'drawstring waist': '허리 끈',
    'braided bracelet': '엮은 팔찌',
    'embroidered patches': '자수 패치',
    'ruffle trim': '러플 단',
    'bow ties at the hips': '골반 리본 끈',
    'tie-front top': '앞 묶음 상의',
    'front buttons': '앞단추',
    'scalloped edges': '물결 가장자리',
    'tiered ruffle skirt': '겹 러플 치마단',
    'ring detail': '링 장식',
    'contrast binding': '배색 테',
    'storm flap': '어깨 덮개',
    'buckled cuffs': '버클 소맷단',
    'brass buttons': '놋쇠 단추',
    'leather belt': '가죽 벨트',
    'argyle pattern': '아가일 무늬',
    'button-down front': '앞여밈 단추',
    'contrast collar': '배색 깃',
    'heart-shaped buttons': '하트 단추',
    'tie-back halter strap': '뒤로 묶는 홀터 끈',
    'ribbon on the visor': '선캡 리본',
    'round paper fan tucked in the obi': '오비에 꽂은 둥근 부채',
    'webbed-foot toggles': '물갈퀴 모양 토글',
    'toggle clasps': '토글 여밈',
    'reflective strip': '반사 띠',
    'big patch pockets': '큰 덧댄 주머니',
    'corduroy collar': '코듀로이 깃',
    'snap buttons': '똑딱단추',
    'colored binding': '색 테두리',
    'drawstring hood': '조임끈 후드',
    'pastel trim': '파스텔 단',
    'white collar': '흰 깃',
    'bow belt': '리본 벨트 (비옷)',
    'scalloped hood edge': '물결 후드 테',
    'cherry print lining': '체리 무늬 안감',
    'paw print pocket': '발바닥 무늬 주머니',
    'whisker embroidery': '수염 자수',
    'tail-shaped zipper pull': '꼬리 모양 지퍼 고리',
    'bell charm': '방울 장신구',
    'lace trim': '레이스 단',
    'scalloped hem': '물결 밑단',
    'pearl buttons': '진주 단추',
    'rosette at the waist': '허리 장미 매듭',
    'white lace collar': '흰 레이스 깃',
    'daisy embroidery': '데이지 자수',
    'ruffled hem': '러플 밑단',
    'bow at the back': '등 리본',
    'petal-shaped hem': '꽃잎 모양 밑단',
    'sheer puff sleeves': '비치는 퍼프 소매',
    'satin sash': '새틴 허리띠',
    'pearl details': '진주 장식',
    'pearl buttons on the cardigan': '가디건 진주 단추',
    'embroidered pocket': '자수 주머니',
    'lace hem': '레이스 밑단',
    'ribbon belt': '리본 벨트',
    'peter pan collar': '둥근 피터팬 깃',
    'pintuck pleats': '핀턱 주름',
    'lace cuffs': '레이스 소맷부리',
    'scalloped skirt hem': '치마 물결 밑단',
    'cable knit pattern': '꽈배기 니트 무늬',
    'embroidered flowers on the vest': '조끼 꽃 자수',
    'ribbon tie collar': '리본 타이 깃',
    'lace-edged collar': '레이스 테 깃',
    'belt tied in a bow': '리본으로 묶은 벨트',
    'epaulettes': '견장',
    'checkered lining': '체크 안감',
    'tortoiseshell buttons': '대모갑 단추',
    'eyelet lace': '아일렛 레이스',
    'ribbon on the hat': '모자 리본',
    'smocked bodice': '스모킹 가슴판',
    'ruffled straps': '러플 어깨끈',
    'white piping': '흰 파이핑',
    'sailor collar': '세일러 깃',
    'layered frills': '겹 프릴',
    'bow at the chest': '가슴 리본',
    'rolled sleeves': '걷어 올린 소매',
    'tie clip': '넥타이 핀',
    'embroidered pocket emblem': '주머니 자수 엠블럼',
    'sharp skirt pleats': '또렷한 치마 주름',
    'rolled cuffs': '접어 올린 소맷단',
    'frayed hem': '올 풀린 밑단',
    'shell necklace': '조개 목걸이',
    'anklet': '발찌',
    'ruffle straps': '러플 끈',
    'woven belt': '엮은 벨트',
    'cherry earrings': '체리 귀걸이',
    'wooden buttons': '나무 단추',
    'patch pockets': '덧댄 주머니',
    'rope belt': '끈 벨트',
    'embroidered hem': '자수 밑단',
    'frilled swimsuit trim': '수영복 프릴 단',
    'bow on the hip': '골반 리본',
    'lace cover-up edge': '레이스 덧옷 테',
    'crochet trim': '코바늘 단',
    'tassels': '술 장식',
    'shell buttons': '조개 단추',
    'embroidered flowers': '꽃 자수',
    'large obi bow': '큰 오비 매듭',
    'obijime cord': '오비지메 끈',
    'morning glory pattern on the obi': '오비의 나팔꽃 무늬',
    'tassel charm': '술 장신구',
    'obi bow': '오비 매듭',
    'goldfish charm': '금붕어 장신구',
    'white wave pattern': '흰 물결 무늬',
    'frog-shaped pocket': '개구리 모양 주머니',
    'lily pad patch': '연잎 패치',
    'reflective piping': '반사 파이핑',
    'water drop print': '물방울 프린트',
    'duck feet print': '오리발 프린트',
    'orange piping': '주황 파이핑',
    'tail flap on the back': '등의 꼬리 덮개',
    'bubble print': '거품 프린트',
    'elbow patches': '팔꿈치 패치',
    'leather buttons': '가죽 단추',
    'fringe hem on the skirt': '치마 술 밑단',
    'acorn brooch': '도토리 브로치',
    'double-breasted buttons': '더블 단추',
    'leaf brooch': '잎 브로치',
    'fur-lined collar': '털 안감 깃',
    'belted waist': '허리 벨트',
    'lace collar trim': '레이스 깃 단',
    'gold buttons': '금 단추',
    'embroidered mushrooms': '버섯 자수',
    'pleated hem': '주름 밑단',
    'knit leaf pattern': '니트 잎 무늬',
    'wooden toggle buttons': '나무 토글 단추',
    'ribbon at the collar': '깃 리본',
    'fringe trim': '술 단',
    'pom-pom ties': '방울 끈',
    'leather clasp': '가죽 여밈',
    'embroidered border': '자수 테두리',
    'acorn buttons': '도토리 단추',
    'leaf-shaped collar': '잎 모양 깃',
    'red polka dots': '빨간 물방울무늬',
    'fern embroidery': '고사리 자수',
    'star appliques': '별 아플리케',
    'lace-trimmed hem': '레이스 두른 밑단',
    'bat-shaped bow': '박쥐 모양 리본',
    'moon charm': '달 장신구',
    'pom-pom trim': '방울 단',
    'nordic pattern': '노르딕 무늬',
    'tassels on the hat': '모자 술',
    'embroidered snowflakes': '눈송이 자수',
    'horn toggles': '뿔 단추',
    'plaid lining': '체크 안감 (울)',
    'fur-trimmed hood': '털 두른 후드',
    'pocket flaps': '주머니 덮개',
    'satin bow': '새틴 리본',
    'fluffy cuffs': '복슬 소맷부리',
    'silver embroidery': '은사 자수',
    'reindeer pattern': '순록 무늬',
    'pom-pom on the beanie': '비니 방울',
    'heart pattern': '하트 무늬',
    'cable knit border': '꽈배기 테두리',
    'holly brooch': '호랑가시 브로치',
    'velvet bow': '벨벳 리본',
    'white cuffs': '흰 소맷부리',
    'sparkly trim': '반짝이 단',
    'snowflake embroidery': '눈꽃 자수',
    'pom-pom laces': '방울 끈 (스케이트)',
    'ribbon on the ear warmers': '귀마개 리본',
    'quilted pattern': '퀼팅 무늬',
    'toggle drawstrings': '토글 조임끈',
    'knit pom-pom': '니트 방울',
    'fleece collar': '플리스 깃',
    'floral embroidery': '꽃무늬 자수',
    'cherry blossom print': '벚꽃 프린트',
    'tiny flower buttons': '작은 꽃 단추',
    'butterfly brooch': '나비 브로치',
    'lemon print': '레몬 프린트',
    'seashell charm': '조개 장신구',
    'sunflower brooch': '해바라기 브로치',
    'wave pattern trim': '물결 무늬 단',
    'leaf embroidery': '잎 자수',
    'acorn charm': '도토리 장신구',
    'maple leaf print': '단풍잎 프린트',
    'plaid trim': '체크 단',
    'snowflake pattern': '눈꽃 무늬',
    'knit pattern trim': '니트 무늬 단'
  },

  // motifs: 그 계절의 무늬 · 장식. 옷 장식에 하나씩 섞인다
  // palettes: 그 계절의 배색. 옷 문구의 {c1}(주색) · {c2}(보조색)를 채운다. 한 벌 안에서 부딪히지 않게 두 색을 묶어서 뽑는다
  seasons: [
    { id: 'spring', label: '봄', en: 'SPRING', motifs: ['floral embroidery', 'cherry blossom print', 'tiny flower buttons', 'butterfly brooch'], neutrals: ['beige', 'ivory', 'light gray', 'cream'],
      palettes: [{ id: 'blossom', label: '벚꽃 분홍 · 크림', c1: 'pale pink', c2: 'cream' }, { id: 'lilac', label: '라일락 · 흰색', c1: 'lilac', c2: 'white' }, { id: 'mint-lemon', label: '민트 · 레몬', c1: 'mint green', c2: 'pale yellow' }, { id: 'powder', label: '하늘 · 흰색', c1: 'powder blue', c2: 'white' }, { id: 'peach', label: '복숭아 · 아이보리', c1: 'peach', c2: 'ivory' }, { id: 'sage', label: '세이지 · 베이지', c1: 'sage green', c2: 'beige' }] },
    { id: 'summer', label: '여름', en: 'SUMMER', motifs: ['lemon print', 'seashell charm', 'sunflower brooch', 'wave pattern trim'], neutrals: ['white', 'beige', 'ecru'],
      palettes: [{ id: 'white-sky', label: '흰색 · 하늘', c1: 'white', c2: 'sky blue' }, { id: 'lemon', label: '레몬 · 흰색', c1: 'lemon yellow', c2: 'white' }, { id: 'cobalt', label: '코발트 · 흰색', c1: 'cobalt blue', c2: 'white' }, { id: 'mint', label: '민트 · 흰색', c1: 'mint green', c2: 'white' }, { id: 'coral', label: '코랄 · 크림', c1: 'coral', c2: 'cream' }, { id: 'navy-red', label: '남색 · 빨강', c1: 'navy', c2: 'red' }] },
    { id: 'autumn', label: '가을', en: 'AUTUMN', motifs: ['leaf embroidery', 'acorn charm', 'maple leaf print', 'plaid trim'], neutrals: ['camel', 'charcoal gray', 'chocolate brown', 'beige'],
      palettes: [{ id: 'camel', label: '카멜 · 크림', c1: 'camel', c2: 'cream' }, { id: 'burgundy', label: '버건디 · 베이지', c1: 'burgundy', c2: 'beige' }, { id: 'mustard', label: '머스터드 · 갈색', c1: 'mustard yellow', c2: 'brown' }, { id: 'olive', label: '올리브 · 크림', c1: 'olive green', c2: 'cream' }, { id: 'terracotta', label: '테라코타 · 아이보리', c1: 'terracotta', c2: 'ivory' }, { id: 'charcoal', label: '차콜 · 버건디', c1: 'charcoal gray', c2: 'burgundy' }] },
    { id: 'winter', label: '겨울', en: 'WINTER', motifs: ['snowflake pattern', 'pom-pom trim', 'holly brooch', 'knit pattern trim'], neutrals: ['charcoal gray', 'camel', 'black', 'cream'],
      palettes: [{ id: 'red-white', label: '빨강 · 흰색', c1: 'red', c2: 'white' }, { id: 'navy-cream', label: '남색 · 크림', c1: 'navy', c2: 'cream' }, { id: 'cream-camel', label: '크림 · 카멜', c1: 'cream', c2: 'camel' }, { id: 'forest', label: '전나무 초록 · 빨강', c1: 'forest green', c2: 'red' }, { id: 'gray-pink', label: '연회색 · 분홍', c1: 'light gray', c2: 'pink' }, { id: 'ivory-silver', label: '아이보리 · 은회색', c1: 'ivory', c2: 'silver gray' }] }
  ],

  // crop: 'upper' 이면 발이 화면 밖이므로 신발을 쓰지 않는다. poses 가 있으면 그 자세하고만 쓴다. noFace 면 표정을 빼고 쓴다.
  shots: [{ id: 'portrait', label: '얼굴 가까이', crop: 'upper', tags: ['portrait', 'close-up', 'blurry background'] },
    { id: 'upper', label: '상반신', crop: 'upper', tags: ['upper body', 'bokeh'] },
    { id: 'cowboy', label: '허벅지 위로', crop: 'upper', tags: ['cowboy shot'] },
    { id: 'side', label: '옆모습', crop: 'upper', tags: ['from side', 'profile', 'upper body'] },
    { id: 'full', label: '전신', crop: 'full', tags: ['full body'] },
    { id: 'fullside', label: '옆에서 전신', crop: 'full', tags: ['full body', 'from side'] },
    // 인물이 작아져 소품과의 작용이 안 보이므로 랜덤 후보에 넣지 않는다(직접 고를 때만)
    { id: 'wide', label: '풍경을 넓게', crop: 'full', tags: ['wide shot', 'scenery', 'full body', 'small figure'] },
    { id: 'low', label: '낮은 시선', crop: 'full', tags: ['from below', 'low angle', 'dynamic angle', 'full body'] },
    { id: 'above', label: '비스듬히 위에서', crop: 'full', tags: ['from above', 'full body'] },
    { id: 'top', label: '바로 위에서', crop: 'full', poses: ['lie'], tags: ['top-down view', 'from directly above', 'full body'] },
    { id: 'foreground', label: '앞의 풍경 너머로', crop: 'upper', tags: ['blurry foreground', 'layered depth', 'cowboy shot'] },
    { id: 'rear', label: '뒤에서', crop: 'full', noFace: true, tags: ['from behind', 'full body'] }
  ],

  // 화보의 톤
  tones: [
    { id: 'airy', label: '맑고 밝게', tags: ['bright', 'airy', 'high key', 'soft pastel colors'] },
    { id: 'film', label: '필름 사진', tags: ['film photography', 'film grain', 'warm tones'] },
    { id: 'vivid', label: '쨍한 색', tags: ['vivid colors', 'high saturation', 'crisp contrast'] },
    { id: 'watercolor', label: '수채화 느낌', tags: ['watercolor style', 'soft edges', 'pastel colors'] },
    { id: 'golden', label: '금빛', tags: ['warm golden tones', 'soft glow'] },
    { id: 'muted', label: '차분한 색', tags: ['muted colors', 'soft contrast', 'matte'] },
    { id: 'cool', label: '차갑고 맑게', tags: ['cool tones', 'pale blue palette', 'clean whites'] },
    { id: 'cozy', label: '포근하게', tags: ['cozy atmosphere', 'warm palette', 'soft lighting'] },
    { id: 'anime', label: '선명한 애니풍', tags: ['anime coloring', 'vibrant colors', 'clean lineart'] },
    { id: 'dreamy', label: '꿈결처럼', tags: ['dreamy', 'soft focus', 'light bloom'] }
  ],

  // 계절 화보 의상. shoes 는 전신 구도일 때만 붙는다. kinds 가 있으면 랜덤일 때 그 빛에서만 나온다
  //   ward    옷장 전용(장면에는 묶지 않음). 옷장 탭에서 뽑히고, 화보에서는 직접 고를 때만 나온다
  //   decor   이 옷의 장식. '옷 장식' 양만큼 뽑혀 옷 태그 뒤에 붙는다. 계절의 motifs 가 하나 섞일 수 있다(noMotif 면 안 섞임)
  outfits: [
    // 봄
    { id: 'rose-strapless', season: 'spring', sex: 'f', label: '티 드레스 · 리넨 모자', tags: ['{c1} tea dress', 'square neckline', 'short puff sleeves', 'wide-brimmed {c2} linen hat'], decor: ['lace trim', 'scalloped hem', 'pearl buttons', 'rosette at the waist'], shoes: 'strappy flats' },
    { id: 'yellow-floral', season: 'spring', sex: 'f', label: '티어드 원피스 · 버킷햇', tags: ['{c1} tiered dress', 'cap sleeves', '{c2} cotton bucket hat'], decor: ['white lace collar', 'daisy embroidery', 'ruffled hem', 'bow at the back'], shoes: 'mary janes' },
    { id: 'sakura-chiffon', season: 'spring', sex: 'f', label: '쉬폰 원피스', tags: ['sheer {c1} chiffon dress', 'layered skirt', 'cherry blossom hair ornament'], decor: ['petal-shaped hem', 'sheer puff sleeves', 'satin sash', 'pearl details'], shoes: 'ballet flats' },
    { id: 'cardigan-floral', season: 'spring', sex: 'f', label: '가디건 · 꽃무늬 원피스', tags: ['{c2} cardigan', '{c1} floral print dress', 'long dress'], decor: ['pearl buttons on the cardigan', 'embroidered pocket', 'lace hem', 'ribbon belt'], shoes: 'brown loafers' },
    { id: 'blouse-flare', season: 'spring', sex: 'f', label: '프릴 블라우스 · 플레어 치마', tags: ['{c2} frilled blouse', '{c1} flared skirt', 'hair ribbon'], decor: ['peter pan collar', 'pintuck pleats', 'lace cuffs', 'scalloped skirt hem'], shoes: 'white socks, mary janes' },
    { id: 'lavender-vest', season: 'spring', sex: 'f', label: '니트 조끼 · 미디 치마', tags: ['{c1} knit vest', '{c2} collared blouse', 'pleated midi skirt'], decor: ['cable knit pattern', 'embroidered flowers on the vest', 'ribbon tie collar', 'lace-edged collar'], shoes: 'loafers' },
    { id: 'trench-spring', season: 'spring', sex: 'f', label: '트렌치코트', tags: ['{c2} trench coat', 'belted coat', '{c1} dress underneath'], decor: ['belt tied in a bow', 'epaulettes', 'checkered lining', 'tortoiseshell buttons'], shoes: 'ankle boots' },
    { id: 'denim-jacket', season: 'spring', sex: 'f', label: '연청 데님 재킷 · 꽃무늬 원피스', tags: ['light denim jacket', '{c1} floral sundress'], decor: ['embroidered patches', 'rolled cuffs', 'daisy embroidery', 'pearl buttons'], shoes: '{c2} sneakers' },
    { id: 'puff-jeans', season: 'spring', sex: 'f', label: '퍼프 소매 블라우스 · 청바지', tags: ['{c1} puff-sleeve blouse', 'light wash jeans'], decor: ['smocked bodice', 'ribbon tie collar', 'lace cuffs', 'tiny flower buttons'], shoes: '{c2} ballet flats' },
    { id: 'sailor-dress', season: 'spring', sex: 'f', label: '세일러 칼라 원피스', ward: true, tags: ['{c1} sailor collar dress', '{c2} neckerchief'], decor: ['white piping', 'pleated hem', 'pearl buttons', 'bow at the back'], shoes: 'mary janes' },
    { id: 'knit-set', season: 'spring', sex: 'f', label: '크롭 가디건 · 니트 치마 세트', ward: true, tags: ['{c1} cropped cardigan', 'matching {c1} knit skirt', '{c2} camisole'], decor: ['pearl buttons on the cardigan', 'scalloped hem', 'cable knit pattern', 'ribbon belt'], shoes: 'loafers' },
    { id: 'shirt-dress-spring', season: 'spring', sex: 'f', label: '셔츠 원피스 · 벨트', ward: true, tags: ['{c1} button-up shirt dress', '{c2} belt'], decor: ['patch pockets', 'rolled sleeves', 'embroidered pocket', 'tortoiseshell buttons'], shoes: 'white sneakers' },
    // 여름
    { id: 'white-sundress', season: 'summer', sex: 'f', label: '리넨 슬립 원피스 · 챙 넓은 모자', tags: ['{c1} linen slip dress', 'square neckline', 'wide-brimmed {c2} sun hat'], decor: ['eyelet lace', 'ribbon on the hat', 'smocked bodice', 'ruffled straps'], shoes: 'woven sandals' },
    { id: 'blue-frill', season: 'summer', sex: 'f', label: '스목 원피스', tags: ['{c1} smock dress', '{c2} frilled collar', 'short puff sleeves'], decor: ['white piping', 'button-down front', 'layered frills', 'bow at the chest'], shoes: 'white canvas shoes' },
    { id: 'shirt-tie', season: 'summer', sex: 'f', label: '반팔 블라우스 · 멜빵 치마', tags: ['{c2} short-sleeved blouse', 'ribbon bow tie', '{c1} suspender skirt'], decor: ['contrast collar', 'heart-shaped buttons', 'embroidered pocket emblem', 'sharp skirt pleats'], shoes: 'ankle socks, white sneakers' },
    { id: 'stripe-open', season: 'summer', sex: 'f', label: '줄무늬 보트넥 · 퀼로트', tags: ['{c1} and {c2} striped boat-neck top', 'white culottes', 'canvas bucket hat'], decor: ['rolled cuffs', 'frayed hem', 'shell necklace', 'anklet'], shoes: 'canvas slip-ons' },
    { id: 'lime-camisole', season: 'summer', sex: 'f', label: '홀터 · 반바지', tags: ['{c1} halter top', 'high-waisted {c2} shorts', 'woven sun visor'], decor: ['tie-back halter strap', 'woven belt', 'ribbon on the visor', 'cherry earrings'], shoes: 'sandals' },
    { id: 'linen-shirtdress', season: 'summer', sex: 'f', label: '리넨 셔츠 원피스', tags: ['{c1} linen shirt dress', 'rolled sleeves', 'thin belt'], decor: ['wooden buttons', 'patch pockets', 'rope belt', 'embroidered hem'], shoes: 'espadrilles' },
    { id: 'swim-cover', season: 'summer', sex: 'f', label: '수영복 · 비치는 셔츠', tags: ['{c1} one-piece swimsuit', 'sheer {c2} cover-up shirt', 'wide-brimmed sun hat'], decor: ['frilled swimsuit trim', 'bow on the hip', 'lace cover-up edge', 'ribbon on the hat'], noMotif: true, shoes: 'flip-flops' },
    { id: 'tiered-beach', season: 'summer', sex: 'f', label: '오프숄더 블라우스 · 티어드 스커트', tags: ['{c2} off-shoulder blouse', 'long {c1} tiered skirt', 'wide-brimmed sun hat'], decor: ['crochet trim', 'tassels', 'shell buttons', 'embroidered flowers'], shoes: 'sandals' },
    { id: 'bikini-frill', season: 'summer', sex: 'f', label: '프릴 비키니 · 사롱', tags: ['{c1} frilled bikini', '{c2} sarong'], decor: ['ruffle trim', 'bow ties at the hips', 'shell necklace', 'anklet'], shoes: 'flip-flops' },
    { id: 'bikini-retro', season: 'summer', sex: 'f', label: '레트로 하이웨이스트 비키니', tags: ['retro {c1} bikini top', 'high-waisted {c2} bikini bottoms'], decor: ['tie-front top', 'front buttons', 'scalloped edges', 'shell buttons'], shoes: 'sandals' },
    { id: 'swim-skirted', season: 'summer', sex: 'f', label: '치마 달린 수영복', tags: ['{c1} skirted swimsuit', '{c2} waistband'], decor: ['tiered ruffle skirt', 'sailor collar', 'bow at the chest', 'white piping'], shoes: 'jelly sandals' },
    { id: 'swim-halter', season: 'summer', sex: 'f', label: '홀터넥 물방울 수영복', tags: ['{c1} halter swimsuit', '{c2} polka dot pattern'], decor: ['ring detail', 'tie-back halter strap', 'contrast binding', 'bow on the hip'], shoes: 'flip-flops' },
    { id: 'romper', season: 'summer', sex: 'f', label: '롬퍼', ward: true, tags: ['{c1} romper', '{c2} waist tie', 'puff sleeves'], decor: ['ruffled hem', 'shell buttons', 'woven belt', 'cherry earrings'], shoes: 'espadrilles' },
    { id: 'maxi-dress', season: 'summer', sex: 'f', label: '홀터 맥시 원피스', ward: true, tags: ['{c1} halter maxi dress', '{c2} sash'], decor: ['tassels', 'crochet trim', 'shell necklace', 'anklet'], shoes: 'flat sandals' },
    { id: 'tee-skirt', season: 'summer', sex: 'f', label: '크롭 티 · 데님 미니스커트', ward: true, tags: ['{c1} cropped t-shirt', 'light denim mini skirt', '{c2} canvas cap'], decor: ['rolled cuffs', 'frayed hem', 'braided bracelet', 'patch pockets'], shoes: 'high-top sneakers' },
    { id: 'yukata-violet', season: 'summer', sex: 'f', label: '나팔꽃 유카타', tags: ['{c2} yukata', '{c1} morning glory print', 'obi', 'kanzashi'], decor: ['large obi bow', 'obijime cord', 'tassel charm', 'round paper fan tucked in the obi'], noMotif: true, shoes: 'geta' },
    { id: 'yukata-navy', season: 'summer', sex: 'f', label: '금붕어 무늬 유카타', tags: ['{c1} yukata', 'goldfish print', '{c2} obi'], decor: ['obi bow', 'goldfish charm', 'white wave pattern', 'tassel charm'], noMotif: true, shoes: 'geta' },
    { id: 'frog-raincoat', season: 'summer', label: '개구리 얼굴 비옷 망토', kinds: ['rain'], tags: ['green rain poncho', 'frog face on the hood', 'short rain poncho', 'white t-shirt', 'denim shorts'], decor: ['frog-shaped pocket', 'lily pad patch', 'webbed-foot toggles', 'water drop print'], noMotif: true, shoes: 'green rubber boots' },
    { id: 'duck-raincoat', season: 'summer', label: '노란 오리 우비', kinds: ['rain'], tags: ['yellow duck raincoat', 'duck bill on the hood', 'glossy vinyl', 'oversized', 'white shorts'], decor: ['duck feet print', 'orange piping', 'tail flap on the back', 'bubble print'], noMotif: true, shoes: 'white rubber boots' },
    { id: 'yellow-slicker', season: 'summer', label: '노란 고무 비옷 · 비 모자', kinds: ['rain'], tags: ['yellow rain slicker', 'wide-brimmed rain hat', 'navy shorts'], decor: ['toggle clasps', 'reflective strip', 'big patch pockets', 'corduroy collar'], noMotif: true, shoes: 'navy rubber boots' },
    { id: 'clear-raincoat', season: 'summer', sex: 'f', label: '투명 비옷 · 꽃무늬 원피스', kinds: ['rain'], tags: ['clear vinyl raincoat', '{c1} floral dress underneath'], decor: ['snap buttons', 'colored binding', 'drawstring hood', 'pastel trim'], noMotif: true, shoes: '{c2} rubber boots' },
    { id: 'dot-raincoat', season: 'summer', sex: 'f', label: '물방울 비옷', kinds: ['rain'], tags: ['{c1} polka dot raincoat', '{c2} buttons', 'belted raincoat'], decor: ['white collar', 'bow belt', 'scalloped hood edge', 'cherry print lining'], noMotif: true, shoes: '{c2} rubber boots' },
    { id: 'cat-raincoat', season: 'summer', sex: 'f', label: '고양이 귀 비옷', kinds: ['rain'], tags: ['pink raincoat', 'cat ears on the hood', 'knee-length raincoat'], decor: ['paw print pocket', 'whisker embroidery', 'tail-shaped zipper pull', 'bell charm'], noMotif: true, shoes: 'pink rubber boots' },
    // 가을
    { id: 'knit-plaid', season: 'autumn', sex: 'f', label: '니트 · 체크 치마 · 베레모', tags: ['oversized {c2} sweater', '{c1} plaid skirt', 'beret'], decor: ['elbow patches', 'leather buttons', 'fringe hem on the skirt', 'acorn brooch'], shoes: 'knee socks, brown boots' },
    { id: 'camel-coat', season: 'autumn', sex: 'f', label: '코트 · 터틀넥', tags: ['{c1} coat', '{c2} turtleneck sweater', 'long pleated skirt'], decor: ['double-breasted buttons', 'leaf brooch', 'fur-lined collar', 'belted waist'], shoes: 'ankle boots' },
    { id: 'corduroy-dress', season: 'autumn', sex: 'f', label: '코듀로이 원피스', tags: ['{c1} corduroy dress', 'long sleeves', '{c2} collar'], decor: ['lace collar trim', 'gold buttons', 'embroidered mushrooms', 'pleated hem'], shoes: 'mary janes' },
    { id: 'mustard-cardigan', season: 'autumn', sex: 'f', label: '가디건 · 코듀로이 바지', tags: ['{c1} cardigan', '{c2} blouse', 'corduroy pants'], decor: ['knit leaf pattern', 'wooden toggle buttons', 'ribbon at the collar', 'patch pockets'], shoes: 'loafers' },
    { id: 'tartan-cape', season: 'autumn', sex: 'f', label: '타탄 망토 · 니트 베레모', tags: ['{c1} tartan cape', '{c2} turtleneck', 'wool skirt', 'knit beret'], decor: ['fringe trim', 'pom-pom ties', 'leather clasp', 'embroidered border'], shoes: 'lace-up boots' },
    { id: 'mushroom-cape', season: 'autumn', sex: 'f', label: '갈색 후드 망토 · 버섯 무늬 원피스', tags: ['brown hooded cape', 'mushroom print dress'], decor: ['acorn buttons', 'leaf-shaped collar', 'red polka dots', 'fern embroidery'], shoes: 'brown boots' },
    { id: 'trench-autumn', season: 'autumn', sex: 'f', label: '트렌치코트 · 니트', tags: ['{c1} trench coat', 'belted trench', '{c2} knit sweater underneath', 'pleated midi skirt'], decor: ['storm flap', 'buckled cuffs', 'plaid lining', 'tortoiseshell buttons'], shoes: 'loafers' },
    { id: 'suede-jacket', season: 'autumn', sex: 'f', label: '스웨이드 재킷 · 니트 원피스', tags: ['{c1} suede jacket', '{c2} knit dress'], decor: ['fringe trim', 'brass buttons', 'patch pockets', 'leather belt'], shoes: 'ankle boots' },
    { id: 'ribbed-dress', season: 'autumn', sex: 'f', label: '골지 니트 원피스 · 어깨에 건 가디건', tags: ['{c1} ribbed knit dress', '{c2} cardigan over the shoulders'], decor: ['pearl buttons', 'cable knit border', 'ribbon at the collar', 'knit leaf pattern'], shoes: 'mary janes' },
    { id: 'sweater-vest', season: 'autumn', label: '칼라 셔츠 · 스웨터 조끼 · 와이드 바지', tags: ['{c2} collared shirt', '{c1} sweater vest', 'wide trousers'], decor: ['argyle pattern', 'contrast collar', 'elbow patches', 'leather buttons'], shoes: 'loafers' },
    { id: 'tweed-blazer', season: 'autumn', sex: 'f', label: '트위드 재킷 · 플리츠 치마', ward: true, tags: ['{c1} tweed blazer', '{c2} pleated skirt'], decor: ['gold buttons', 'fringe trim', 'leaf brooch', 'pocket flaps'], shoes: 'loafers' },
    { id: 'turtleneck-maxi', season: 'autumn', sex: 'f', label: '터틀넥 · 코듀로이 롱스커트', ward: true, tags: ['{c2} turtleneck', '{c1} corduroy maxi skirt'], decor: ['leather belt', 'acorn brooch', 'embroidered border', 'front buttons'], shoes: 'ankle boots' },
    { id: 'leather-jacket', season: 'autumn', sex: 'f', label: '라이더 재킷 · 미디 원피스', ward: true, tags: ['{c1} faux leather jacket', '{c2} midi dress'], decor: ['brass buttons', 'belted waist', 'lace hem', 'leaf brooch'], shoes: 'lace-up boots' },
    // 겨울
    { id: 'poncho-earflap', season: 'winter', sex: 'f', label: '니트 케이프 · 방울 모자', tags: ['{c2} cable-knit cape', '{c1} pom-pom knit hat', '{c1} mittens', 'wool tights'], decor: ['pom-pom trim', 'nordic pattern', 'tassels on the hat', 'embroidered snowflakes'], shoes: 'shearling boots' },
    { id: 'duffle', season: 'winter', label: '더플코트 · 목도리', tags: ['{c1} duffle coat', 'toggle buttons', '{c2} scarf', 'knit gloves'], decor: ['horn toggles', 'plaid lining', 'fur-trimmed hood', 'pocket flaps'], shoes: 'snow boots' },
    { id: 'white-fur', season: 'winter', sex: 'f', label: '털 트림 코트 · 방울 모자', tags: ['{c2} coat', 'fur-trimmed coat', 'pom-pom beanie', 'earmuffs'], decor: ['pearl buttons', 'satin bow', 'fluffy cuffs', 'silver embroidery'], shoes: 'white boots' },
    { id: 'fair-isle', season: 'winter', sex: 'f', label: '페어아일 니트 · 울 치마', tags: ['{c1} fair isle sweater', 'knit beanie', 'long {c2} wool skirt', 'mittens'], decor: ['reindeer pattern', 'pom-pom on the beanie', 'heart pattern', 'cable knit border'], shoes: 'brown boots' },
    { id: 'red-coat', season: 'winter', sex: 'f', label: '울 코트 · 털 깃', tags: ['{c1} wool coat', 'white fur collar', '{c2} tartan scarf', 'beret'], decor: ['gold buttons', 'holly brooch', 'velvet bow', 'white cuffs'], shoes: 'black boots' },
    { id: 'skating', season: 'winter', sex: 'f', label: '스케이트 차림', tags: ['{c2} turtleneck', 'short {c1} pleated skirt', 'thick tights', 'ear warmers', 'mittens'], decor: ['sparkly trim', 'snowflake embroidery', 'pom-pom laces', 'ribbon on the ear warmers'], shoes: 'ice skates' },
    { id: 'cream-puffer', season: 'winter', label: '패딩 · 니트 목도리', tags: ['{c2} puffer jacket', 'chunky {c1} knit scarf', 'wide pants'], decor: ['quilted pattern', 'toggle drawstrings', 'knit pom-pom', 'fleece collar'], shoes: 'snow boots' },
    { id: 'long-coat', season: 'winter', sex: 'f', label: '롱 울 코트 · 터틀넥 원피스', tags: ['{c1} long wool coat', '{c2} turtleneck dress'], decor: ['double-breasted buttons', 'belted waist', 'fur-lined collar', 'velvet bow'], shoes: 'knee-high boots' },
    { id: 'shearling', season: 'winter', sex: 'f', label: '시어링 재킷 · 니트 원피스', tags: ['{c2} shearling jacket', '{c1} knit dress'], decor: ['fleece collar', 'horn toggles', 'patch pockets', 'knit pom-pom'], shoes: 'snow boots' },
    { id: 'cape-coat', season: 'winter', sex: 'f', label: '케이프 코트 · 털 머프', tags: ['{c1} cape coat', '{c2} fur muff', 'beret'], decor: ['gold buttons', 'satin bow', 'embroidered border', 'pom-pom ties'], shoes: 'lace-up boots' },
    { id: 'parka', season: 'winter', sex: 'f', label: '털 후드 파카 · 니트 레깅스', ward: true, tags: ['{c1} parka', 'fur-trimmed hood', '{c2} knit leggings'], decor: ['toggle drawstrings', 'big patch pockets', 'knit pom-pom', 'quilted pattern'], shoes: 'snow boots' },
    { id: 'velvet-dress', season: 'winter', sex: 'f', label: '벨벳 원피스 · 레이스 깃', ward: true, tags: ['{c1} velvet dress', '{c2} lace collar', 'long sleeves'], decor: ['velvet bow', 'pearl buttons', 'white cuffs', 'satin bow'], shoes: 'mary janes' },
    { id: 'chunky-cardigan', season: 'winter', sex: 'f', label: '두꺼운 니트 가디건 · 스웨터 원피스', ward: true, tags: ['{c2} chunky knit cardigan', '{c1} sweater dress'], decor: ['cable knit border', 'wooden toggle buttons', 'heart pattern', 'pom-pom trim'], shoes: 'shearling boots' },
    // 남성 · 공용(성별 표시 없음) — 성별을 남성 · 공용으로 고를 때 화보에 나온다
    { id: 'm-sp-cardigan', season: 'spring', sex: 'm', label: '가디건 · 버튼다운 셔츠 · 면바지', tags: ['{c2} cardigan', '{c1} button-down shirt', 'chino pants'], decor: ['elbow patches', 'leather buttons', 'rolled cuffs'], noMotif: true, shoes: 'loafers' },
    { id: 'm-sp-vest', season: 'spring', sex: 'm', label: '니트 조끼 · 셔츠 · 슬랙스', tags: ['{c1} knit vest', '{c2} collared shirt', 'pleated slacks'], decor: ['cable knit pattern', 'rolled sleeves', 'tie clip'], noMotif: true, shoes: 'loafers' },
    { id: 'sp-trench-u', season: 'spring', label: '트렌치코트 · 크루넥 니트 · 슬랙스', tags: ['{c2} trench coat', '{c1} crew-neck sweater', 'slim trousers'], decor: ['storm flap', 'epaulettes', 'checkered lining'], noMotif: true, shoes: 'leather loafers' },
    { id: 'sp-denim-u', season: 'spring', label: '데님 재킷 · 티셔츠 · 면바지', tags: ['light denim jacket', '{c1} t-shirt', '{c2} chino pants'], decor: ['embroidered patches', 'rolled cuffs', 'brass buttons'], noMotif: true, shoes: 'white sneakers' },
    { id: 'm-su-linen', season: 'summer', sex: 'm', label: '리넨 셔츠 · 반바지', tags: ['{c1} linen shirt', '{c2} shorts'], decor: ['rolled sleeves', 'shell buttons', 'woven belt'], noMotif: true, shoes: 'espadrilles' },
    { id: 'su-camp-u', season: 'summer', label: '오픈칼라 셔츠 · 리넨 바지 · 밀짚모자', tags: ['{c1} open-collar shirt', '{c2} linen trousers', 'straw hat'], decor: ['wave pattern trim', 'wooden buttons', 'rope belt'], noMotif: true, shoes: 'leather sandals' },
    { id: 'su-tee-u', season: 'summer', label: '티셔츠 · 카고 반바지 · 버킷햇', tags: ['{c1} t-shirt', '{c2} cargo shorts', 'canvas bucket hat'], decor: ['patch pockets', 'frayed hem', 'braided bracelet'], noMotif: true, shoes: 'canvas sneakers' },
    { id: 'm-su-trunks', season: 'summer', sex: 'm', label: '수영 반바지 · 반팔 셔츠', tags: ['{c1} swim trunks', 'open {c2} short-sleeved shirt'], decor: ['wave pattern trim', 'shell necklace', 'drawstring waist'], noMotif: true, shoes: 'flip-flops' },
    { id: 'su-rash-u', season: 'summer', label: '래시가드 · 보드 반바지', tags: ['{c1} rash guard', '{c2} board shorts'], decor: ['contrast binding', 'reflective piping', 'drawstring waist'], noMotif: true, shoes: 'flip-flops' },
    { id: 'su-jinbei-u', season: 'summer', label: '진베이', tags: ['{c1} jinbei', '{c2} ties at the front'], decor: ['white wave pattern', 'tassel charm', 'contrast binding'], noMotif: true, shoes: 'geta' },
    { id: 'm-su-yukata', season: 'summer', sex: 'm', label: '남자 유카타 · 가쿠오비', tags: ['{c1} yukata', '{c2} kaku obi'], decor: ['white wave pattern', 'tassel charm', 'round paper fan tucked in the obi'], noMotif: true, shoes: 'geta' },
    { id: 'm-au-coat', season: 'autumn', sex: 'm', label: '울 오버코트 · 터틀넥 · 울 바지', tags: ['{c1} wool overcoat', '{c2} turtleneck sweater', 'wool trousers'], decor: ['double-breasted buttons', 'plaid lining', 'pocket flaps'], noMotif: true, shoes: 'leather oxfords' },
    { id: 'm-au-shawl', season: 'autumn', sex: 'm', label: '숄칼라 가디건 · 플란넬 셔츠', tags: ['{c1} shawl-collar cardigan', '{c2} flannel shirt', 'corduroy pants'], decor: ['leather buttons', 'elbow patches', 'knit leaf pattern'], noMotif: true, shoes: 'suede chukka boots' },
    { id: 'au-suede-u', season: 'autumn', label: '스웨이드 재킷 · 후드티 · 청바지', tags: ['{c1} suede jacket', '{c2} hoodie', 'dark jeans'], decor: ['brass buttons', 'leather belt', 'embroidered pocket'], noMotif: true, shoes: 'lace-up boots' },
    { id: 'au-flannel-u', season: 'autumn', label: '체크 셔츠 · 헨리넥 · 청바지', tags: ['{c1} plaid flannel shirt', '{c2} henley shirt underneath', 'straight jeans'], decor: ['rolled sleeves', 'wooden buttons', 'leather belt'], noMotif: true, shoes: 'work boots' },
    { id: 'm-wi-peacoat', season: 'winter', sex: 'm', label: '피코트 · 니트 목도리', tags: ['{c1} pea coat', '{c2} knit scarf', 'wool trousers'], decor: ['brass buttons', 'plaid lining', 'cable knit border'], noMotif: true, shoes: 'leather boots' },
    { id: 'm-wi-chester', season: 'winter', sex: 'm', label: '롱 체스터 코트 · 케이블 니트', tags: ['{c1} long chesterfield coat', '{c2} cable-knit sweater', 'slacks'], decor: ['double-breasted buttons', 'plaid lining', 'cable knit pattern'], noMotif: true, shoes: 'leather oxfords' },
    { id: 'm-wi-shearling', season: 'winter', sex: 'm', label: '시어링 칼라 재킷 · 터틀넥 · 청바지', tags: ['{c1} shearling-collar jacket', '{c2} turtleneck', 'dark jeans'], decor: ['leather buttons', 'fleece collar', 'quilted pattern'], noMotif: true, shoes: 'leather boots' },
    { id: 'wi-nordic-u', season: 'winter', label: '노르딕 니트 · 비니 · 코듀로이 바지', tags: ['{c1} nordic sweater', '{c2} knit beanie', 'corduroy pants'], decor: ['snowflake pattern', 'pom-pom on the beanie', 'reindeer pattern'], noMotif: true, shoes: 'duck boots' }
  ],

  // ── 옷장: 조각을 조합해서 옷만 뽑는다 ──
  // main: 상의(top) · 원피스(dress) · 수영복(swim, 여름만). 원피스 · 수영복이면 하의가 없다
  // crop 상의에는 hw(하이웨이스트) 하의만. 수영복에는 cover(걸치는 것)만, 신발은 beach 표시가 있는 것만
  // {c1} 주색 · {c2} 보조색 — 옷 색(배색)이 채운다
  closet: {
    spring: {
      tops: [
        C('sp-puff', '퍼프 소매 블라우스', '{c1} puff-sleeve blouse', { sex: 'f' }),
        C('sp-crop-cardi', '크롭 니트 가디건', '{c1} cropped knit cardigan', { crop: true, sex: 'f' }),
        C('sp-stripe', '줄무늬 긴팔 티', '{c1} and white striped long-sleeve tee'),
        C('sp-shirt', '칼라 셔츠', '{c1} collared shirt', { collar: true }),
        C('sp-lace', '레이스 블라우스', '{c1} lace blouse', { sex: 'f' }),
        C('sp-sweat', '맨투맨', '{c1} sweatshirt', { sporty: true }),
        C('sp-vest', '셔츠 위 니트 조끼', '{c1} knit vest over a white shirt', { collar: true }),
        C('sp-bow', '리본 블라우스', '{c1} blouse with a neck bow', { sex: 'f' }),
        C('sp-henley', '헨리넥 티', '{c1} henley shirt', { sex: 'm' }),
        C('sp-vcardi', '티셔츠 위 브이넥 가디건', '{c1} v-neck cardigan over a white tee')
      ],
      bottoms: [
        C('sp-pleats', '플리츠 미디스커트', '{c2} pleated midi skirt', { hw: true, sex: 'f' }),
        C('sp-wide-denim', '연청 와이드 데님', 'light wash wide-leg jeans', { hw: true }),
        C('sp-flare-mini', '플레어 미니스커트', '{c2} flared mini skirt', { hw: true, sex: 'f', short: true }),
        C('sp-cotton', '면바지', '{c2} cotton trousers'),
        C('sp-denim-long', '데님 롱스커트', 'long denim skirt', { hw: true, sex: 'f' }),
        C('sp-tiered', '티어드 롱스커트', '{c2} tiered maxi skirt', { hw: true, sex: 'f' }),
        C('sp-bermuda', '버뮤다 팬츠', '{c2} bermuda shorts', { short: true }),
        C('sp-chinos', '치노 팬츠', '{c2} chinos', { sex: 'm' }),
        C('sp-pslacks', '턱 슬랙스', '{c2} pleated slacks')
      ],
      dresses: [
        C('sp-floral', '꽃무늬 미디 원피스', '{c1} floral midi dress', { sex: 'f' }),
        C('sp-shirtdress', '셔츠 원피스', '{c1} shirt dress', { sex: 'f' }),
        C('sp-tea', '티 드레스', '{c1} tea dress with puff sleeves', { sex: 'f' }),
        C('sp-knitdress', '얇은 니트 원피스', '{c1} fine knit dress', { sex: 'f' }),
        C('sp-sailor', '세일러 칼라 원피스', '{c1} sailor collar dress', { sex: 'f' }),
        C('sp-chiffon', '쉬폰 원피스', 'sheer {c1} chiffon dress', { sex: 'f' })
      ],
      outers: [
        C('sp-trench', '숏 트렌치', '{c2} cropped trench coat', { jacket: true }),
        C('sp-tweed', '트위드 재킷', '{c2} tweed jacket', { sex: 'f', jacket: true }),
        C('sp-denimjk', '데님 재킷', 'light denim jacket', { jacket: true }),
        C('sp-longcardi', '롱 가디건', '{c2} long cardigan', { long: true }),
        C('sp-blazer', '블레이저', '{c2} blazer', { jacket: true }),
        C('sp-wind', '얇은 바람막이', '{c2} light windbreaker'),
        C('sp-coach', '코치 재킷', '{c2} coach jacket', { jacket: true }),
        C('sp-mac', '맥 코트', '{c2} mac coat', { long: true, jacket: true })
      ],
      shoes: [
        C('sp-loafers', '로퍼', 'loafers'), C('sp-mj', '메리제인', 'mary janes', { sex: 'f' }), C('sp-sneakers', '흰 운동화', 'white sneakers'),
        C('sp-flats', '발레 플랫', 'ballet flats', { sex: 'f' }), C('sp-ankle', '앵클부츠', 'ankle boots'), C('sp-canvas', '캔버스화', '{c2} canvas sneakers'),
        C('sp-derby', '더비 슈즈', 'derby shoes', { sex: 'm' })
      ],
      hats: [
        C('sp-beret', '베레모', '{c2} beret'), C('sp-bucket', '버킷햇', '{c1} bucket hat'),
        C('sp-straw', '밀짚 챙모자', 'wide-brimmed straw hat'), C('sp-headband', '리본 머리띠', '{c2} ribbon headband', { sex: 'f' }),
        C('sp-cap', '야구모자', '{c2} baseball cap')
      ]
    },
    summer: {
      tops: [
        C('su-sleeveless', '슬리브리스 블라우스', '{c1} sleeveless blouse', { sex: 'f' }),
        C('su-croptee', '크롭 티셔츠', '{c1} cropped t-shirt', { crop: true, sex: 'f' }),
        C('su-linen', '리넨 셔츠', '{c1} linen shirt'),
        C('su-tank', '탱크톱', '{c1} tank top'),
        C('su-offshoulder', '오프숄더 톱', '{c1} off-shoulder top', { sex: 'f' }),
        C('su-halter', '홀터 톱', '{c1} halter top', { crop: true, sex: 'f' }),
        C('su-polo', '니트 폴로', '{c1} knit polo shirt'),
        C('su-eyelet', '아일렛 반팔 블라우스', '{c1} eyelet short-sleeve blouse', { sex: 'f' }),
        C('su-camp', '오픈칼라 반팔 셔츠', '{c1} short-sleeve camp collar shirt'),
        C('su-bigtee', '오버핏 티셔츠', '{c1} oversized t-shirt', { sporty: true })
      ],
      bottoms: [
        C('su-denimshorts', '데님 반바지', 'denim shorts', { hw: true, short: true }),
        C('su-linenpants', '리넨 와이드 팬츠', '{c2} linen wide pants', { hw: true }),
        C('su-mini', '미니스커트', '{c2} mini skirt', { hw: true, sex: 'f', short: true }),
        C('su-cotton-shorts', '면 반바지', '{c2} cotton shorts', { short: true }),
        C('su-maxi', '하늘하늘한 롱스커트', '{c2} flowy maxi skirt', { hw: true, sex: 'f' }),
        C('su-culottes', '퀼로트', '{c2} culottes', { hw: true, sex: 'f' }),
        C('su-tennis', '플리츠 테니스 스커트', '{c2} pleated tennis skirt', { hw: true, sex: 'f', short: true }),
        C('su-chinoshorts', '치노 반바지', '{c2} chino shorts', { short: true })
      ],
      dresses: [
        C('su-sundress', '선드레스', '{c1} sundress', { sex: 'f' }), C('su-slip', '슬립 원피스', '{c1} slip dress', { sex: 'f' }),
        C('su-milkmaid', '밀크메이드 원피스', '{c1} milkmaid dress', { sex: 'f' }), C('su-maxidress', '홀터 맥시 원피스', '{c1} halter maxi dress', { sex: 'f' }),
        C('su-teedress', '티셔츠 원피스', '{c1} t-shirt dress', { sex: 'f' }), C('su-linendress', '리넨 셔츠 원피스', '{c1} linen shirt dress', { sex: 'f' }),
        C('su-smock', '스목 원피스', '{c1} smock dress', { sex: 'f' })
      ],
      swim: [
        C('sw-triangle', '트라이앵글 비키니', '{c1} triangle bikini', { sex: 'f' }),
        C('sw-bandeau', '반두 비키니', '{c1} bandeau bikini', { sex: 'f' }),
        C('sw-highwaist', '하이웨이스트 비키니', '{c1} bikini top, high-waisted {c2} bikini bottoms', { sex: 'f' }),
        C('sw-frill', '프릴 비키니', '{c1} frilled bikini', { sex: 'f' }),
        C('sw-offshoulder', '오프숄더 비키니', '{c1} off-shoulder bikini', { sex: 'f' }),
        C('sw-onepiece', '원피스 수영복', '{c1} one-piece swimsuit', { sex: 'f' }),
        C('sw-monokini', '모노키니', '{c1} monokini', { sex: 'f' }),
        C('sw-tankini', '탱키니', '{c1} tankini', { sex: 'f' }),
        C('sw-rash', '래시가드 · 수영 반바지', '{c1} rash guard, {c2} swim shorts', { sporty: true }),
        C('sw-skirted', '스커트 수영복', '{c1} skirted swimsuit', { sex: 'f' }),
        C('sw-crochet', '크로셰 수영복', '{c1} crochet swimsuit', { sex: 'f' }),
        C('sw-trunks', '수영 트렁크', '{c1} swim trunks', { sex: 'm', sporty: true }),
        C('sw-board', '보드 쇼츠', '{c1} board shorts', { sex: 'm', sporty: true }),
        C('sw-longrash', '긴팔 래시가드 · 보드 쇼츠', '{c1} long-sleeve rash guard, {c2} board shorts', { sporty: true })
      ],
      outers: [
        C('su-openlinen', '걸쳐 입은 리넨 셔츠', '{c2} linen shirt worn open'),
        C('su-thincardi', '얇은 니트 가디건', '{c2} thin knit cardigan'),
        C('su-bolero', '짧은 니트 볼레로', '{c2} short knit bolero', { sex: 'f' }),
        C('su-sarong', '사롱', '{c2} sarong', { cover: true, sex: 'f' }),
        C('su-coverup', '비치는 셔츠', 'sheer {c2} cover-up shirt', { cover: true }),
        C('su-crochetcover', '크로셰 커버업', '{c2} crochet cover-up dress', { cover: true, sex: 'f' }),
        C('su-swimshorts', '수영복 위 데님 반바지', 'denim shorts over the swimsuit', { cover: true, sex: 'f' })
      ],
      shoes: [
        C('su-sandals', '샌들', 'sandals', { beach: true }), C('su-flipflops', '쪼리', 'flip-flops', { beach: true, beachOnly: true }),
        C('su-espa', '에스파드리유', 'espadrilles'), C('su-sneakers', '흰 운동화', 'white sneakers'),
        C('su-jelly', '젤리 샌들', 'jelly sandals', { beach: true, sex: 'f' }), C('su-platform', '플랫폼 샌들', 'platform sandals', { sex: 'f' }),
        C('su-slides', '슬라이드 샌들', 'slide sandals', { beach: true })
      ],
      hats: [
        C('su-straw', '챙 넓은 밀짚모자', 'wide-brimmed straw hat'), C('su-bucket', '버킷햇', '{c2} bucket hat'),
        C('su-visor', '선캡', 'sun visor'), C('su-cap', '야구모자', '{c2} baseball cap'), C('su-boater', '밀짚 보터', 'straw boater hat')
      ]
    },
    autumn: {
      tops: [
        C('au-turtle', '터틀넥 니트', '{c1} turtleneck sweater'), C('au-cable', '꽈배기 니트', '{c1} cable-knit sweater'),
        C('au-vest', '셔츠 위 스웨터 조끼', '{c1} sweater vest over a collared shirt', { collar: true }), C('au-lace', '레이스 블라우스', '{c1} lace blouse', { sex: 'f' }),
        C('au-cardi', '단추 잠근 가디건', '{c1} buttoned cardigan'), C('au-hoodie', '후드티', '{c1} hoodie', { sporty: true }),
        C('au-stripe', '줄무늬 긴팔 티', '{c1} and cream striped long-sleeve tee'), C('au-cropknit', '크롭 니트', '{c1} cropped sweater', { crop: true, sex: 'f' }),
        C('au-flannel', '플란넬 셔츠', '{c1} flannel shirt', { collar: true })
      ],
      bottoms: [
        C('au-plaid', '체크 미디스커트', '{c2} plaid midi skirt', { hw: true, sex: 'f' }), C('au-cord', '코듀로이 바지', '{c2} corduroy trousers'),
        C('au-slacks', '와이드 슬랙스', '{c2} wide-leg slacks', { hw: true }), C('au-jeans', '진청 일자 청바지', 'dark wash straight jeans', { hw: true }),
        C('au-suede', '스웨이드 미니스커트', '{c2} suede mini skirt', { hw: true, sex: 'f', short: true }), C('au-cordmaxi', '코듀로이 롱스커트', '{c2} corduroy maxi skirt', { hw: true, sex: 'f' }),
        C('au-knitskirt', '니트 미디스커트', '{c2} knit midi skirt', { hw: true, sex: 'f' }),
        C('au-cargo', '카고 팬츠', '{c2} cargo pants')
      ],
      dresses: [
        C('au-ribbed', '골지 니트 원피스', '{c1} ribbed knit dress', { sex: 'f' }), C('au-corddress', '코듀로이 원피스', '{c1} corduroy dress', { sex: 'f' }),
        C('au-plaiddress', '체크 셔츠 원피스', '{c1} plaid shirt dress', { sex: 'f' }), C('au-lacecollar', '레이스 깃 원피스', '{c1} dress with a lace collar', { sex: 'f' }),
        C('au-sweaterdress', '스웨터 원피스', '{c1} sweater dress', { sex: 'f' }), C('au-wrap', '랩 원피스', '{c1} wrap dress', { sex: 'f' })
      ],
      outers: [
        C('au-trench', '트렌치코트', '{c2} trench coat', { long: true, jacket: true }), C('au-blazer', '블레이저', '{c2} blazer', { jacket: true }),
        C('au-leather', '레더 재킷', '{c2} faux leather jacket', { jacket: true }), C('au-suedejk', '스웨이드 재킷', '{c2} suede jacket', { jacket: true }),
        C('au-tweed', '트위드 재킷', '{c2} tweed jacket', { jacket: true }), C('au-longcardi', '두꺼운 롱 가디건', '{c2} chunky long cardigan', { long: true }),
        C('au-field', '필드 재킷', '{c2} field jacket', { jacket: true }), C('au-cape', '타탄 망토', '{c2} tartan cape', { sex: 'f' })
      ],
      shoes: [
        C('au-loafers', '로퍼', 'loafers'), C('au-ankle', '앵클부츠', 'ankle boots'), C('au-laceup', '레이스업 부츠', 'lace-up boots'),
        C('au-mj', '메리제인', 'mary janes', { sex: 'f' }), C('au-knee', '니하이 부츠', 'knee-high boots', { sex: 'f' }), C('au-chunky', '청키 운동화', 'chunky sneakers'),
        C('au-work', '워커', 'work boots')
      ],
      hats: [
        C('au-beret', '베레모', '{c2} beret'), C('au-woolbucket', '울 버킷햇', '{c2} wool bucket hat'),
        C('au-newsboy', '뉴스보이캡', '{c2} newsboy cap'), C('au-beanie', '얇은 비니', '{c1} knit beanie')
      ]
    },
    winter: {
      tops: [
        C('wi-turtle', '두꺼운 터틀넥', '{c1} chunky turtleneck'), C('wi-fairisle', '페어아일 니트', '{c1} fair isle sweater'),
        C('wi-mock', '모크넥 니트', '{c1} mock neck sweater'), C('wi-fleece', '플리스 풀오버', '{c1} fleece pullover', { sporty: true }),
        C('wi-mohair', '모헤어 니트', 'fuzzy {c1} mohair sweater', { sex: 'f' }), C('wi-cablecardi', '꽈배기 가디건', '{c1} cable-knit cardigan'),
        C('wi-hoodie', '기모 후드티', '{c1} fleece-lined hoodie', { sporty: true })
      ],
      bottoms: [
        C('wi-woolpleat', '울 플리츠스커트', '{c2} wool pleated skirt', { hw: true, sex: 'f' }), C('wi-wooltrousers', '울 바지', '{c2} wool trousers'),
        C('wi-jeans', '진청 청바지', 'dark denim jeans', { hw: true }), C('wi-knitmaxi', '니트 롱스커트', '{c2} knit maxi skirt', { hw: true, sex: 'f' }),
        C('wi-cord', '코듀로이 바지', '{c2} corduroy pants'), C('wi-quilted', '퀼팅 스커트', '{c2} quilted skirt', { hw: true, sex: 'f' }),
        C('wi-chinos', '도톰한 치노 팬츠', '{c2} heavy cotton chinos', { sex: 'm' })
      ],
      dresses: [
        C('wi-sweaterdress', '스웨터 원피스', '{c1} sweater dress', { sex: 'f' }), C('wi-velvet', '벨벳 원피스', '{c1} velvet dress', { sex: 'f' }),
        C('wi-turtledress', '터틀넥 니트 원피스', '{c1} turtleneck knit dress', { sex: 'f' }), C('wi-plaidwool', '체크 울 원피스', '{c1} plaid wool dress', { sex: 'f' }),
        C('wi-lacedress', '긴팔 레이스 원피스', '{c1} long-sleeve lace dress', { sex: 'f' })
      ],
      outers: [
        C('wi-longcoat', '롱 울 코트', '{c2} long wool coat', { long: true, jacket: true }), C('wi-duffle', '더플코트', '{c2} duffle coat'),
        C('wi-puffer', '숏 패딩', '{c2} puffer jacket'), C('wi-longpad', '롱패딩', '{c2} long padded coat', { long: true }),
        C('wi-shearling', '무스탕', '{c2} shearling jacket'), C('wi-cape', '케이프 코트', '{c2} cape coat', { sex: 'f' }),
        C('wi-furtrim', '털 트림 코트', '{c2} coat with fur trim'), C('wi-quiltcoat', '퀼팅 코트', '{c2} quilted coat'),
        C('wi-pea', '피코트', '{c2} pea coat', { jacket: true }),
        C('wi-parka', '털 후드 파카', '{c2} parka with a fur-trimmed hood')
      ],
      shoes: [
        C('wi-snow', '스노 부츠', 'snow boots'), C('wi-sheep', '양털 부츠', 'shearling boots'), C('wi-knee', '니하이 부츠', 'knee-high boots', { sex: 'f' }),
        C('wi-laceup', '레이스업 부츠', 'lace-up boots'), C('wi-loafers', '로퍼', 'loafers'), C('wi-padded', '패딩 부츠', 'padded boots')
      ],
      hats: [
        C('wi-pompom', '방울 비니', '{c1} pom-pom beanie'), C('wi-earmuffs', '귀마개', '{c2} earmuffs'),
        C('wi-beret', '울 베레모', '{c2} wool beret'), C('wi-fur', '퍼 모자', 'faux fur hat'),
        C('wi-trapper', '털 귀덮개 모자', '{c2} trapper hat')
      ]
    }
  },

  // ── 옷장 소품: 칸 4개에 1~4개 ──
  //   g        부위 — 같은 부위는 하나만 (ears · neck · wrist · fingers · ankle · chest · hair · eyes · hands · legs · bag · held · camera)
  //   seasons  이 계절에만 (없으면 사계절)
  //   swim     수영복에도 어울림 / swimOnly 수영복일 때만
  //   dressy   격식 있는 주얼리 — 후드티 · 맨투맨 · 래시가드 같은 운동복 결에는 붙지 않음
  //   hatClash 모자를 쓰면 붙지 않음 (머리띠 · 머리 위 선글라스)
  //   needsJacket 재킷 · 블레이저류 겉옷이 있을 때만 / needsCollar 칼라 셔츠 계열 상의일 때만
  accessories: [
    // 귀
    A('acc-pearl-studs', '진주 귀걸이', 'pearl stud earrings', { g: 'ears', dressy: true, sex: 'f' }),
    A('acc-gem-drop', '보석 드롭 귀걸이', '{c1} gemstone drop earrings', { g: 'ears', dressy: true, sex: 'f' }),
    A('acc-diamond', '다이아몬드 귀걸이', 'diamond stud earrings', { g: 'ears', dressy: true }),
    A('acc-gold-hoops', '금 링 귀걸이', 'gold hoop earrings', { g: 'ears', swim: true }),
    A('acc-silver-hoops', '작은 은 링 귀걸이', 'small silver hoop earrings', { g: 'ears', swim: true }),
    A('acc-cherry-ear', '체리 귀걸이', 'cherry earrings', { g: 'ears', seasons: ['spring', 'summer'], sex: 'f', swim: true }),
    A('acc-flower-ear', '꽃 모양 귀걸이', 'small flower earrings', { g: 'ears', seasons: ['spring', 'summer'], sex: 'f' }),
    A('acc-tassel-ear', '술 장식 귀걸이', 'tassel earrings', { g: 'ears', sex: 'f' }),
    // 목
    A('acc-pearl-necklace', '진주 목걸이', 'pearl necklace', { g: 'neck', dressy: true, sex: 'f' }),
    A('acc-pendant', '얇은 금 펜던트', 'thin gold pendant necklace', { g: 'neck', swim: true }),
    A('acc-locket', '로켓 목걸이', 'small locket necklace', { g: 'neck' }),
    A('acc-choker', '리본 초커', '{c2} ribbon choker', { g: 'neck', sex: 'f' }),
    A('acc-shell-neck', '조개 목걸이', 'shell necklace', { g: 'neck', seasons: ['summer'], swim: true }),
    A('acc-silk-scarf', '목 스카프', 'silk scarf tied at the neck', { g: 'neck', seasons: ['spring', 'autumn'] }),
    A('acc-knit-scarf', '두꺼운 니트 목도리', '{c2} chunky knit scarf', { g: 'neck', seasons: ['winter'] }),
    A('acc-tartan-muffler', '체크 머플러', 'tartan muffler', { g: 'neck', seasons: ['autumn', 'winter'] }),
    // 손목 · 손가락 · 발목 · 가슴
    A('acc-watch', '손목시계', 'wristwatch', { g: 'wrist' }),
    A('acc-sport-watch', '스포츠 시계', 'sport watch', { g: 'wrist', swim: true }),
    A('acc-bangle', '금 뱅글', 'gold bangle', { g: 'wrist' }),
    A('acc-braided', '엮은 팔찌', 'braided bracelet', { g: 'wrist', seasons: ['summer'], swim: true }),
    A('acc-charm', '참 팔찌', 'charm bracelet', { g: 'wrist', sex: 'f' }),
    A('acc-scrunchie', '손목 곱창밴드', 'scrunchie on the wrist', { g: 'wrist', sex: 'f', seasons: ['spring', 'summer'] }),
    A('acc-silver-ring', '은반지', 'silver ring', { g: 'fingers', swim: true }),
    A('acc-gem-ring', '보석 반지', '{c1} gemstone ring', { g: 'fingers', dressy: true }),
    A('acc-anklet', '발찌', 'anklet', { g: 'ankle', seasons: ['summer'], sex: 'f', swim: true }),
    A('acc-flower-brooch', '꽃 브로치', 'flower brooch', { g: 'chest', seasons: ['spring'] }),
    A('acc-leaf-brooch', '잎 브로치', 'leaf brooch', { g: 'chest', seasons: ['autumn'] }),
    A('acc-holly-brooch', '호랑가시 브로치', 'holly brooch', { g: 'chest', seasons: ['winter'] }),
    // 머리 · 눈
    A('acc-ribbon-clip', '리본 머리핀', 'ribbon hair clip', { g: 'hair', sex: 'f' }),
    A('acc-pearl-clip', '진주 머리핀', 'pearl hair clip', { g: 'hair', sex: 'f', dressy: true }),
    A('acc-headband', '리본 머리띠', '{c2} ribbon headband', { g: 'hair', sex: 'f', hatClash: true }),
    A('acc-flower-pin', '꽃 머리핀', 'flower hair pin', { g: 'hair', sex: 'f', seasons: ['spring', 'summer'], swim: true }),
    A('acc-round-glasses', '동그란 안경', 'round glasses', { g: 'eyes' }),
    A('acc-sunglasses', '선글라스', 'sunglasses', { g: 'eyes', seasons: ['summer'], swim: true }),
    A('acc-sunglasses-head', '머리 위 선글라스', 'sunglasses on the head', { g: 'eyes', seasons: ['spring', 'summer'], swim: true, hatClash: true }),
    // 손 · 다리
    A('acc-lace-gloves', '짧은 레이스 장갑', 'short lace gloves', { g: 'hands', sex: 'f', seasons: ['spring'], dressy: true }),
    A('acc-leather-gloves', '가죽 장갑', 'leather gloves', { g: 'hands', seasons: ['autumn', 'winter'] }),
    A('acc-mittens', '벙어리장갑', '{c1} mittens', { g: 'hands', seasons: ['winter'] }),
    A('acc-muff', '털 머프', 'fur muff', { g: 'hands', seasons: ['winter'], sex: 'f' }),
    A('acc-frill-socks', '프릴 양말', 'frilled socks', { g: 'legs', seasons: ['spring', 'summer'], sex: 'f' }),
    A('acc-knee-socks', '니삭스', 'knee socks', { g: 'legs', seasons: ['autumn', 'winter'], sex: 'f' }),
    A('acc-pattern-tights', '무늬 스타킹', 'patterned tights', { g: 'legs', seasons: ['autumn'], sex: 'f' }),
    A('acc-thick-tights', '두꺼운 스타킹', 'thick tights', { g: 'legs', seasons: ['winter'], sex: 'f' }),
    A('acc-wool-socks', '울 양말', 'wool socks', { g: 'legs', seasons: ['autumn', 'winter'] }),
    // 가방
    A('acc-shoulder-bag', '작은 숄더백', 'small {c2} shoulder bag', { g: 'bag' }),
    A('acc-crossbody', '작은 크로스백', 'small crossbody bag', { g: 'bag' }),
    A('acc-tote', '캔버스 토트백', 'canvas tote bag', { g: 'bag' }),
    A('acc-beaded-bag', '비즈 미니백', 'beaded mini bag', { g: 'bag', sex: 'f', dressy: true }),
    A('acc-rattan', '라탄 가방', 'round rattan bag', { g: 'bag', seasons: ['summer'], swim: true }),
    A('acc-beach-tote', '비치 토트', 'striped beach tote', { g: 'bag', seasons: ['summer'], swimOnly: true }),
    A('acc-leather-bag', '가죽 숄더백', 'leather shoulder bag', { g: 'bag', seasons: ['autumn', 'winter'] }),
    A('acc-messenger', '캔버스 메신저백', 'canvas messenger bag', { g: 'bag', seasons: ['autumn'] }),
    // 손에 드는 것 (하나만)
    A('acc-tulips', '튤립 꽃다발', 'holding a bouquet of tulips', { g: 'held', seasons: ['spring'] }),
    A('acc-roses', '장미 꽃다발', 'holding a bouquet of roses', { g: 'held', seasons: ['spring'] }),
    A('acc-lilacs', '라일락 꽃다발', 'holding a bouquet of lilacs', { g: 'held', seasons: ['spring'] }),
    A('acc-wildflowers', '들꽃 다발', 'holding a bunch of wildflowers', { g: 'held', seasons: ['spring', 'summer'] }),
    A('acc-sunflowers', '해바라기 다발', 'holding a bunch of sunflowers', { g: 'held', seasons: ['summer'] }),
    A('acc-lavender', '라벤더 다발', 'holding a bundle of lavender', { g: 'held', seasons: ['summer'] }),
    A('acc-cosmos', '코스모스 꽃다발', 'holding a bouquet of cosmos', { g: 'held', seasons: ['autumn'] }),
    A('acc-chrysanthemums', '들국화 다발', 'holding a bunch of wild chrysanthemums', { g: 'held', seasons: ['autumn'] }),
    A('acc-camellias', '동백 꽃다발', 'holding a bouquet of red camellias', { g: 'held', seasons: ['winter'] }),
    A('acc-plum', '매화 가지', 'holding a plum blossom branch', { g: 'held', seasons: ['winter'] }),
    A('acc-parasol', '레이스 양산', 'holding a lace parasol', { g: 'held', seasons: ['spring', 'summer'], sex: 'f' }),
    A('acc-book', '작은 책', 'holding a small book', { g: 'held' }),
    A('acc-coffee', '테이크아웃 커피', 'holding a takeaway coffee cup', { g: 'held', seasons: ['autumn', 'winter'] }),
    A('acc-iced', '아이스 음료', 'holding an iced drink', { g: 'held', seasons: ['summer'], swim: true }),
    A('acc-float', '튜브', 'holding an inflatable swim ring', { g: 'held', seasons: ['summer'], swimOnly: true }),
    A('acc-camera', '목에 건 필름 카메라', 'film camera on a neck strap', { g: 'camera' }),
    // 남성 · 공용
    A('acc-chain', '은 체인 목걸이', 'silver chain necklace', { g: 'neck', swim: true }),
    A('acc-headphones', '목에 건 헤드폰', 'headphones around the neck', { g: 'neck' }),
    A('acc-signet', '시그넷 반지', 'signet ring', { g: 'fingers' }),
    A('acc-leather-bracelet', '가죽 팔찌', 'leather bracelet', { g: 'wrist' }),
    A('acc-bead-bracelet', '나무 구슬 팔찌', 'wooden bead bracelet', { g: 'wrist', swim: true }),
    A('acc-backpack', '백팩', '{c2} backpack', { g: 'bag' }),
    A('acc-pocket-square', '행커치프', '{c2} pocket square', { g: 'chest', sex: 'm', dressy: true, needsJacket: true }),
    A('acc-tie-clip', '넥타이 핀', 'silver tie clip', { g: 'chest', sex: 'm', dressy: true, needsCollar: true })
  ],

  // 메인 소품.
  //   tags   첫째 소품일 때 붙는 물건 자체
  //   near   둘째(곁 소품)일 때 붙는 문구. 없으면 곁 소품이 될 수 없다(손에 쥐어야만 말이 되는 것)
  //   pairs  이것이 첫째일 때 곁에 둘 수 있는 소품 (양쪽에 적는다)
  //   kinds  이 빛에서만 나온다
  //   acts   이것으로 하는 일 — 고르면 순간이 이것으로 바뀐다
  props: [
    // ── 봄 ──
    { id: 'rose', label: '장미 한 송이', tags: ['pink rose', 'rose bush'], pairs: ['flower-basket', 'parasol', 'book'], acts: [
      { id: 'smell', label: '장미 향 맡기', pose: 'stand', tags: ['smelling a rose', 'face close to the bloom', 'hand cupping the flower'], face: ['eyes closed'] },
      { id: 'pick', label: '줄기를 조심히 꺾기', pose: 'stand', tags: ['picking a rose', 'careful fingers', 'thorny stem'], face: [] },
      { id: 'lips', label: '한 송이를 입가에', pose: 'stand', tags: ['holding a single rose', 'rose near the lips'], face: ['eye contact'] }
    ] },
    { id: 'flower-basket', label: '꽃바구니', tags: ['shallow basket of cut flowers'], near: ['basket of cut flowers on the grass'], pairs: ['picnic', 'daisy-chain', 'rabbit', 'rose', 'book'], acts: [
      { id: 'lap', label: '무릎에 바구니를 안고 앉기', pose: 'sit', tags: ['sitting in the grass', 'basket of cut flowers on lap', 'sorting the stems'], face: [] },
      { id: 'arm', label: '팔에 걸고 걷기', pose: 'walk', tags: ['walking', 'basket hooked on the arm', 'looking back'], face: [] },
      { id: 'gather', label: '꽃을 따서 담기', pose: 'squat', tags: ['crouching', 'picking flowers into a basket'], face: [] }
    ] },
    { id: 'picnic', label: '피크닉 바구니 · 돗자리', tags: ['plaid picnic blanket', 'picnic basket', 'sandwiches', 'teapot and teacups'], near: ['picnic blanket and basket nearby'], pairs: ['flower-basket', 'daisy-chain', 'bubbles', 'rabbit', 'book', 'guitar', 'birds', 'camera', 'parasol'], acts: [
      { id: 'tea', label: '돗자리에 앉아 차 따르기', pose: 'sit', tags: ['sitting on a picnic blanket', 'legs to the side', 'pouring tea from a teapot into a teacup'], face: [] },
      { id: 'belly', label: '엎드려 턱 괴기', pose: 'lie', tags: ['lying on stomach on a picnic blanket', 'chin in hands', 'feet kicking up'], face: ['eye contact'] },
      { id: 'bite', label: '샌드위치 한 입', pose: 'sit', tags: ['sitting on a picnic blanket', 'eating a sandwich', 'cheek full'], face: [] }
    ] },
    { id: 'bubbles', label: '비눗방울', tags: ['soap bubbles', 'bubble wand'], near: ['soap bubbles drifting in the air'], pairs: ['picnic', 'rabbit'], acts: [
      { id: 'blow', label: '후 불기', pose: 'stand', tags: ['blowing bubbles', 'cheeks puffed', 'bubbles floating up'], face: [] },
      { id: 'wave', label: '큰 고리를 휘두르기', pose: 'walk', tags: ['waving a large bubble wand', 'giant bubble trailing'], face: [] },
      { id: 'reach', label: '방울에 손 뻗기', pose: 'stand', tags: ['reaching for a bubble', 'on tiptoes'], face: [] }
    ] },
    { id: 'kite', label: '연', tags: ['kite in the sky', 'kite string'], pairs: ['picnic', 'camera'], acts: [
      { id: 'run', label: '줄을 당기며 달리기', pose: 'walk', tags: ['running', 'pulling a kite string', 'looking up'], face: [] },
      { id: 'spool', label: '얼레를 쥐고 올려다보기', pose: 'stand', tags: ['standing', 'holding a kite spool', 'looking up at the sky'], face: [] },
      { id: 'launch', label: '머리 위로 들어 띄우기', pose: 'stand', tags: ['holding a kite overhead', 'about to let go', 'wind'], face: [] }
    ] },
    { id: 'daisy-chain', label: '꽃 화관', tags: ['flower crown', 'small daisies'], near: ['daisies scattered on the grass'], pairs: ['picnic', 'flower-basket', 'rabbit', 'birds'], acts: [
      { id: 'weave', label: '화관 엮기', pose: 'sit', tags: ['sitting in the grass', 'weaving a flower crown', 'looking down'], face: [] },
      { id: 'wear', label: '머리에 화관 얹기', pose: 'sit', tags: ['placing a flower crown on own head', 'both hands raised'], face: [] },
      { id: 'offer', label: '화관을 내밀기', pose: 'stand', tags: ['holding out a flower crown', 'arms extended'], face: ['eye contact'] }
    ] },
    { id: 'parasol', label: '레이스 양산', kinds: ['day', 'golden'], tags: ['white lace parasol'], near: ['lace parasol propped open nearby'], pairs: ['picnic', 'rose', 'book'], acts: [
      { id: 'walk', label: '양산을 어깨에 걸고 걷기', pose: 'walk', tags: ['walking', 'parasol over the shoulder', 'looking back'], face: [] },
      { id: 'twirl', label: '양산 돌리기', pose: 'stand', tags: ['standing', 'twirling a parasol'], face: [] },
      { id: 'shade', label: '양산 그늘에 앉기', pose: 'sit', tags: ['sitting', 'parasol resting on the shoulder', 'lace shadow on the face'], face: [] }
    ] },
    { id: 'watering-can', label: '물뿌리개', kinds: ['day', 'golden', 'overcast'], tags: ['tin watering can'], pairs: ['flower-basket'], acts: [
      { id: 'water', label: '꽃에 물 주기', pose: 'stand', tags: ['watering flowers', 'tilted watering can', 'water stream sparkling'], face: [] },
      { id: 'carry', label: '두 손으로 들고 오기', pose: 'walk', tags: ['carrying a watering can with both hands', 'careful steps'], face: [] }
    ] },
    { id: 'rabbit', label: '아기 토끼', tags: ['small white rabbit'], near: ['white rabbit in the grass'], pairs: ['picnic', 'flower-basket', 'daisy-chain', 'bubbles', 'book'], acts: [
      { id: 'hug', label: '토끼를 가슴에 안기', pose: 'sit', tags: ['hugging a bunny to the chest', 'cheek on its fur'], face: ['eyes closed'] },
      { id: 'lap', label: '무릎 위 토끼 쓰다듬기', pose: 'sit', tags: ['sitting', 'bunny on lap', 'petting it'], face: [] },
      { id: 'eye', label: '엎드려 토끼와 눈 맞추기', pose: 'lie', tags: ['lying on stomach', 'face to face with a bunny'], face: [] }
    ] },
    { id: 'cherry-branch', label: '벚꽃 가지', tags: ['cherry blossom branch'], pairs: ['picnic', 'book'], acts: [
      ...branchActs('a cherry blossom branch'),
      { id: 'reach', label: '낮은 가지에 손 뻗기', pose: 'stand', tags: ['reaching up to a low branch', 'on tiptoes'], face: [] }
    ] },
    // ── 꽃가지 ──
    { id: 'forsythia-branch', label: '개나리 가지', tags: ['a forsythia branch'], pairs: ['picnic', 'book', 'camera'], acts: branchActs('a forsythia branch') },
    { id: 'azalea-branch', label: '진달래 가지', tags: ['an azalea branch'], pairs: ['book', 'camera'], acts: branchActs('an azalea branch') },
    { id: 'magnolia-branch', label: '목련 가지', tags: ['a magnolia branch'], pairs: ['book', 'camera'], acts: branchActs('a magnolia branch') },
    { id: 'wisteria-cluster', label: '등나무 꽃송이', tags: ['a hanging cluster of wisteria'], pairs: ['book', 'parasol'], acts: branchActs('a hanging cluster of wisteria') },
    { id: 'plum-branch', label: '매화 가지', tags: ['a plum blossom branch'], pairs: ['winter-birds', 'cocoa', 'book'], acts: branchActs('a plum blossom branch') },
    // ── 꽃다발 ──
    { id: 'rose-bouquet', label: '장미 꽃다발', tags: ['a bouquet of roses'], near: ['a bouquet of roses set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bouquet of roses') },
    { id: 'tulip-bouquet', label: '튤립 꽃다발', tags: ['a bouquet of tulips'], near: ['a bouquet of tulips set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bouquet of tulips') },
    { id: 'wild-bouquet', label: '들꽃 다발', tags: ['a bunch of wildflowers'], near: ['a bunch of wildflowers set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bunch of wildflowers') },
    { id: 'lilac-bouquet', label: '라일락 꽃다발', tags: ['a bouquet of lilacs'], near: ['a bouquet of lilacs set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bouquet of lilacs') },
    { id: 'canola-bunch', label: '유채꽃 다발', tags: ['a bunch of canola flowers'], near: ['a bunch of canola flowers set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bunch of canola flowers') },
    { id: 'lavender-bunch', label: '라벤더 다발', tags: ['a bundle of lavender'], near: ['a bundle of lavender set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bundle of lavender') },
    { id: 'poppy-bouquet', label: '개양귀비 꽃다발', tags: ['a bouquet of red poppies'], near: ['a bouquet of red poppies set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bouquet of red poppies') },
    { id: 'hydrangea-bloom', label: '수국 큰 송이', tags: ['a large hydrangea bloom'], near: ['a large hydrangea bloom set down nearby'], pairs: ['umbrella', 'snail'], acts: bouquetActs('a large hydrangea bloom') },
    { id: 'cosmos-bouquet', label: '코스모스 꽃다발', tags: ['a bouquet of cosmos'], near: ['a bouquet of cosmos set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bouquet of cosmos') },
    { id: 'aster-bouquet', label: '들국화 다발', tags: ['a bunch of wild chrysanthemums'], near: ['a bunch of wild chrysanthemums set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bunch of wild chrysanthemums') },
    { id: 'buckwheat-bunch', label: '메밀꽃 다발', tags: ['a bunch of buckwheat flowers'], near: ['a bunch of buckwheat flowers set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a bunch of buckwheat flowers') },
    { id: 'muhly-bunch', label: '핑크뮬리 한 줌', tags: ['a handful of pink muhly grass'], near: ['a handful of pink muhly grass set down nearby'], pairs: ['picnic', 'book', 'camera', 'flower-basket'], acts: bouquetActs('a handful of pink muhly grass') },
    // ── 여름 ──
    { id: 'watermelon', label: '수박', tags: ['watermelon slice', 'red flesh', 'black seeds'], near: ['cut watermelon on a plate'], pairs: ['ramune', 'pinwheel', 'book'], acts: [
      { id: 'bite', label: '크게 한 입', pose: 'sit', tags: ['biting a watermelon slice', 'both hands on the rind'], face: ['eyes closed'] },
      { id: 'hold', label: '두 손으로 들어 보이기', pose: 'sit', tags: ['holding up a watermelon slice', 'legs swinging'], face: ['eye contact'] },
      { id: 'side', label: '수박 들고 옆 보기', pose: 'sit', tags: ['wedge of watermelon in hand', 'looking sideways'], face: [] }
    ] },
    { id: 'guitar', label: '통기타', tags: ['acoustic guitar'], near: ['acoustic guitar lying in the grass'], pairs: ['picnic', 'book'], acts: [
      { id: 'play', label: '기타 치며 노래하기', pose: 'sit', tags: ['playing the guitar', 'fingers on the strings', 'singing'], face: [] },
      { id: 'sky', label: '줄을 튕기며 하늘 보기', pose: 'sit', tags: ['strumming', 'looking up at the sky'], face: [] },
      { id: 'rest', label: '무릎에 기타를 얹고 쉬기', pose: 'sit', tags: ['guitar resting on the knee', 'pausing', 'hand on the neck of the guitar'], face: [] }
    ] },
    { id: 'birds', label: '작은 새들', tags: ['small birds', 'birds gathered around'], near: ['small birds nearby'], pairs: ['book', 'picnic', 'daisy-chain', 'fruit-basket'], acts: [
      { id: 'finger', label: '손가락 위의 새 보기', pose: 'sit', tags: ['bird perched on a finger', 'watching it'], face: [] },
      { id: 'seed', label: '모이 뿌리기', pose: 'stand', tags: ['scattering seeds', 'birds pecking around the feet'], face: [] },
      { id: 'flight', label: '날아오르는 새들 사이', pose: 'stand', tags: ['birds taking off around', 'arms opening'], face: [] }
    ] },
    { id: 'sunflowers', label: '해바라기 다발', tags: ['bouquet of sunflowers'], near: ['sunflower bouquet set down nearby'], pairs: ['camera', 'ramune'], acts: [
      { id: 'hug', label: '가슴에 꼭 안기', pose: 'stand', tags: ['hugging sunflowers to the chest'], face: [] },
      { id: 'shoulder', label: '어깨에 걸치고 걷기', pose: 'walk', tags: ['sunflowers slung over the shoulder', 'striding'], face: [] },
      { id: 'peek', label: '꽃 뒤에서 빼꼼', pose: 'stand', tags: ['peeking out from behind a sunflower bouquet'], face: ['eye contact'] }
    ] },
    { id: 'sparkler', label: '손 불꽃', kinds: ['dusk', 'night'], tags: ['sparkler', 'sparks', 'glow'], pairs: ['goldfish-bag'], acts: [
      { id: 'light', label: '촛불에 불꽃 붙이기', pose: 'squat', tags: ['crouching', 'lighting a sparkler from a small candle'], face: [] },
      { id: 'draw', label: '불꽃으로 허공에 그리기', pose: 'stand', tags: ['waving a sparkler', 'light trails'], face: [] },
      { id: 'two', label: '양손에 하나씩', pose: 'stand', tags: ['a sparkler in each hand', 'arms out'], face: [] }
    ] },
    { id: 'pinwheel', label: '바람개비', tags: ['colorful pinwheel'], near: ['pinwheel stuck in the ground, spinning'], pairs: ['watermelon', 'ramune', 'float'], acts: [
      { id: 'raise', label: '바람에 들어 올리기', pose: 'stand', tags: ['holding up a pinwheel', 'pinwheel spinning', 'wind'], face: [] },
      { id: 'blow', label: '후 불어 돌리기', pose: 'sit', tags: ['blowing on a pinwheel'], face: [] },
      { id: 'run', label: '바람개비 들고 달리기', pose: 'walk', tags: ['running', 'pinwheel held out in front', 'pinwheel spinning'], face: [] }
    ] },
    { id: 'shaved-ice', label: '빙수', tags: ['shaved ice', 'strawberry syrup', 'glass bowl'], near: ['shaved ice on a tray'], pairs: ['ramune', 'watermelon'], acts: [
      { id: 'spoon', label: '숟가락 물고 있기', pose: 'sit', tags: ['eating shaved ice', 'spoon in mouth'], face: [] },
      { id: 'cold', label: '이마 짚고 빙수 먹기', pose: 'sit', tags: ['eating shaved ice', 'hand on forehead'], face: ['one eye closed'] },
      { id: 'show', label: '그릇을 들어 보이기', pose: 'stand', tags: ['holding up a bowl of shaved ice'], face: ['eye contact'] }
    ] },
    { id: 'fruit-basket', label: '복숭아 · 체리 바구니', tags: ['wicker basket of peaches and cherries'], near: ['basket of peaches nearby'], pairs: ['book', 'birds', 'camera'], acts: [
      { id: 'cherry', label: '누워서 체리를 입 위로 늘어뜨리기', pose: 'lie', tags: ['lying in the grass', 'on back', 'dangling a pair of cherries above the mouth'], face: [] },
      { id: 'bite', label: '복숭아 한 입', pose: 'sit', tags: ['sitting cross-legged', 'biting into a peach'], face: [] },
      { id: 'nose', label: '복숭아 향 맡기', pose: 'sit', tags: ['holding a peach to the nose'], face: ['eyes closed'] }
    ] },
    { id: 'goldfish-bag', label: '금붕어 봉지', kinds: ['dusk', 'night'], tags: ['goldfish in a plastic bag', 'water bag'], near: ['goldfish bag set on the step'], pairs: ['sparkler'], acts: [
      { id: 'look', label: '눈높이로 들어 보기', pose: 'stand', tags: ['lifting a goldfish bag to eye level', 'looking at the goldfish'], face: [] },
      { id: 'walk', label: '봉지를 들고 걷기', pose: 'walk', tags: ['walking', 'goldfish bag dangling from the hand'], face: [] }
    ] },
    { id: 'ramune', label: '라무네', tags: ['ramune bottle', 'glass marble'], near: ['ramune bottle beside'], pairs: ['watermelon', 'shaved-ice', 'pinwheel', 'float'], acts: [
      { id: 'drink', label: '고개를 젖히고 마시기', pose: 'stand', tags: ['drinking from a ramune bottle', 'head tilted back'], face: [] },
      { id: 'light', label: '병을 하늘에 비춰 보기', pose: 'sit', tags: ['holding a ramune bottle up to the light', 'looking through it'], face: [] },
      { id: 'cheek', label: '차가운 병을 볼에', pose: 'sit', tags: ['cold bottle pressed to the cheek'], face: ['eyes closed'] }
    ] },
    { id: 'frog', label: '청개구리', tags: ['small green frog'], near: ['frog sitting on a lily pad'], pairs: ['umbrella', 'yellow-umbrella', 'dot-umbrella', 'wagasa', 'frill-umbrella', 'check-umbrella', 'snail'], acts: [
      { id: 'peer', label: '개구리 들여다보기', pose: 'squat', tags: ['squatting', 'face close to a frog on a lily pad'], face: [] },
      { id: 'palm', label: '손바닥 위의 개구리', pose: 'squat', tags: ['frog sitting on the palm'], face: [] },
      { id: 'hop', label: '개구리처럼 뛰기', pose: 'squat', tags: ['hopping like a frog', 'crouched', 'splashing'], face: [] }
    ] },
    { id: 'umbrella', label: '투명 우산', kinds: ['rain'], tags: ['clear umbrella', 'raindrops on the canopy'], near: ['clear umbrella open on the ground'], pairs: ['frog', 'snail'], acts: umbrellaActs('clear umbrella') },
    { id: 'yellow-umbrella', label: '노란 우산', kinds: ['rain'], tags: ['yellow umbrella'], near: ['yellow umbrella open on the ground'], pairs: ['frog', 'snail'], acts: umbrellaActs('yellow umbrella') },
    { id: 'dot-umbrella', label: '물방울무늬 우산', kinds: ['rain'], tags: ['navy polka dot umbrella'], near: ['polka dot umbrella open on the ground'], pairs: ['frog', 'snail'], acts: umbrellaActs('polka dot umbrella') },
    { id: 'wagasa', label: '종이 우산', kinds: ['rain'], tags: ['red oil-paper umbrella', 'bamboo ribs'], near: ['oil-paper umbrella open on the ground'], pairs: ['frog', 'snail'], acts: umbrellaActs('oil-paper umbrella') },
    { id: 'frill-umbrella', label: '레이스 단 우산', kinds: ['rain'], tags: ['pastel umbrella with a frilled edge'], near: ['frilled umbrella open on the ground'], pairs: ['frog', 'snail'], acts: umbrellaActs('frilled umbrella') },
    { id: 'check-umbrella', label: '체크무늬 우산', kinds: ['rain'], tags: ['checkered umbrella'], near: ['checkered umbrella open on the ground'], pairs: ['frog', 'snail'], acts: umbrellaActs('checkered umbrella') },
    { id: 'snail', label: '달팽이', tags: ['snail on a hydrangea leaf'], near: ['snail on a nearby leaf'], pairs: ['umbrella', 'yellow-umbrella', 'dot-umbrella', 'wagasa', 'frill-umbrella', 'check-umbrella', 'frog'], acts: [
      { id: 'peer', label: '잎 위의 달팽이 들여다보기', pose: 'squat', tags: ['crouching', 'peering at a snail on a leaf'], face: [] },
      { id: 'finger', label: '달팽이를 손가락에 올리기', pose: 'stand', tags: ['letting a snail crawl onto a fingertip'], face: [] }
    ] },
    { id: 'float', label: '홍학 튜브', tags: ['inflatable flamingo float'], near: ['flamingo float on the water'], pairs: ['ramune', 'pinwheel', 'water-gun'], acts: [
      { id: 'lie', label: '튜브 위에 눕기', pose: 'lie', tags: ['lying on an inflatable float', 'sunglasses on head'], face: [] },
      { id: 'hug', label: '튜브를 안고 걸터앉기', pose: 'sit', tags: ['sitting at the edge', 'hugging an inflatable float'], face: [] }
    ] },
    { id: 'water-gun', label: '물총', tags: ['water gun', 'water spray'], near: ['water gun left on the poolside'], pairs: ['float'], acts: [
      { id: 'aim', label: '물총 겨누기', pose: 'stand', tags: ['aiming a water gun', 'water spraying'], face: ['one eye closed'] },
      { id: 'wet', label: '흠뻑 젖은 채 물총 들기', pose: 'stand', tags: ['holding a water gun', 'soaked', 'water droplets'], face: [] }
    ] },
    { id: 'seashells', label: '조개껍데기', tags: ['seashells', 'starfish'], near: ['seashells in the sand'], pairs: ['camera', 'ramune'], acts: [
      { id: 'collect', label: '쪼그려 조개 줍기', pose: 'squat', tags: ['crouching', 'collecting seashells'], face: [] },
      { id: 'ear', label: '소라를 귀에 대기', pose: 'stand', tags: ['holding a seashell to the ear', 'listening'], face: ['eyes closed'] },
      { id: 'show', label: '손바닥에 펼쳐 보이기', pose: 'stand', tags: ['seashells in cupped hands', 'showing them'], face: ['eye contact'] }
    ] },
    // ── 가을 ──
    { id: 'maple-leaves', label: '단풍잎 다발', tags: ['bunch of red maple leaves'], near: ['handful of red maple leaves set aside'], pairs: ['book', 'cocoa', 'camera', 'squirrel'], acts: [
      { id: 'fan', label: '부채처럼 펼쳐 들기', pose: 'stand', tags: ['holding maple leaves like a fan'], face: [] },
      { id: 'toss', label: '하늘로 흩뿌리기', pose: 'stand', tags: ['tossing leaves into the air', 'leaves falling around'], face: [] },
      { id: 'eye', label: '한쪽 눈을 잎으로 가리기', pose: 'stand', tags: ['maple leaf held over one eye'], face: [] }
    ] },
    { id: 'pumpkin', label: '큰 호박', tags: ['big orange pumpkin'], near: ['pumpkins around'], pairs: ['jack-lantern', 'camera', 'cocoa'], acts: [
      { id: 'sit', label: '호박 위에 앉기', pose: 'sit', tags: ['sitting on a big pumpkin', 'legs swinging'], face: [] },
      { id: 'hug', label: '호박을 끌어안기', pose: 'sit', tags: ['hugging a pumpkin', 'cheek on it'], face: [] },
      { id: 'carry', label: '낑낑대며 들어 올리기', pose: 'stand', tags: ['carrying a heavy pumpkin with both arms'], face: [] }
    ] },
    { id: 'jack-lantern', label: '호박 등', kinds: ['dusk', 'night'], tags: ["jack-o'-lantern", 'glowing carved face'], near: ["glowing jack-o'-lanterns"], pairs: ['pumpkin'], acts: [
      { id: 'hold', label: '손잡이로 들어 올리기', pose: 'stand', tags: ["holding a jack-o'-lantern by the handle", 'warm light from below'], face: [] },
      { id: 'squat', label: '앞에 쪼그려 앉기', pose: 'squat', tags: ["squatting beside a jack-o'-lantern", 'glow on the face'], face: [] }
    ] },
    { id: 'cocoa', label: '따뜻한 머그', tags: ['steaming mug', 'hot cocoa'], near: ['steaming mug nearby'], pairs: ['book', 'maple-leaves', 'leaf-pile', 'snowman', 'mini-snowmen', 'sled', 'winter-birds', 'pumpkin', 'camera', 'gift'], acts: [
      { id: 'sip', label: '두 손으로 감싸 마시기', pose: 'sit', tags: ['sipping from a mug', 'both hands around the mug'], face: ['eyes closed'] },
      { id: 'blow', label: '김을 후 불기', pose: 'sit', tags: ['blowing on a hot drink', 'steam rising'], face: [] },
      { id: 'warm', label: '머그로 손 녹이기', pose: 'stand', tags: ['warming hands on a mug', 'visible breath'], face: [] }
    ] },
    { id: 'acorns', label: '도토리 · 밤', tags: ['acorns and chestnuts'], near: ['small basket of acorns'], pairs: ['squirrel', 'book'], acts: [
      { id: 'collect', label: '쪼그려 도토리 줍기', pose: 'squat', tags: ['crouching', 'picking up acorns'], face: [] },
      { id: 'cup', label: '두 손 가득 보여 주기', pose: 'stand', tags: ['acorns in cupped hands', 'showing them'], face: ['eye contact'] }
    ] },
    { id: 'squirrel', label: '다람쥐', tags: ['squirrel'], near: ['squirrel nearby'], pairs: ['acorns', 'book', 'maple-leaves'], acts: [
      { id: 'feed', label: '도토리를 내밀기', pose: 'squat', tags: ['offering an acorn to a squirrel', 'crouching'], face: [] },
      { id: 'shoulder', label: '어깨 위의 다람쥐', pose: 'stand', tags: ['squirrel on the shoulder', 'looking at it'], face: [] }
    ] },
    { id: 'leaf-pile', label: '낙엽 더미', tags: ['big pile of fallen leaves'], near: ['pile of fallen leaves'], pairs: ['cocoa', 'camera', 'squirrel'], acts: [
      { id: 'jump', label: '낙엽 더미로 뛰어들기', pose: 'stand', tags: ['jumping into a pile of leaves', 'leaves flying'], face: [] },
      { id: 'lie', label: '낙엽에 파묻혀 눕기', pose: 'lie', tags: ['lying in a pile of leaves', 'arms spread'], face: ['eyes closed'] },
      { id: 'throw', label: '두 팔로 퍼 올리기', pose: 'stand', tags: ['throwing armfuls of leaves overhead'], face: [] }
    ] },
    // ── 겨울 ──
    { id: 'snowman', label: '눈사람', tags: ['snowman', 'knitted scarf on the snowman', 'carrot nose'], near: ['snowman nearby'], pairs: ['mini-snowmen', 'cocoa', 'sled', 'winter-birds'], acts: [
      { id: 'hug', label: '눈사람에 팔 두르기', pose: 'stand', tags: ['arms wrapped around a snowman', 'cheek against its head'], face: [] },
      { id: 'hat', label: '눈사람에게 모자 씌우기', pose: 'stand', tags: ['putting a hat on a snowman', 'on tiptoes'], face: [] },
      { id: 'arm', label: '나뭇가지 팔 꽂기', pose: 'squat', tags: ['crouching', 'sticking a twig arm into a snowman'], face: [] }
    ] },
    { id: 'mini-snowmen', label: '꼬마 눈사람들', tags: ['row of tiny snowmen'], near: ['tiny snowmen lined up'], pairs: ['snowman', 'cocoa'], acts: [
      { id: 'make', label: '장갑 낀 손으로 빚기', pose: 'squat', tags: ['squatting', 'shaping a tiny snowman'], face: [] },
      { id: 'palm', label: '손바닥에 올려 보이기', pose: 'squat', tags: ['tiny snowman on the palms', 'holding it up'], face: ['eye contact'] }
    ] },
    { id: 'sled', label: '나무 썰매', tags: ['wooden sled'], near: ['wooden sled in the snow'], pairs: ['snowman', 'cocoa'], acts: [
      { id: 'ride', label: '썰매 타고 내려가기', pose: 'sit', tags: ['sitting on a sled', 'sliding downhill', 'snow spray'], face: [] },
      { id: 'pull', label: '줄을 끌며 돌아보기', pose: 'walk', tags: ['pulling a sled by the rope', 'looking back'], face: [] },
      { id: 'lie', label: '썰매에 누워 하늘 보기', pose: 'lie', tags: ['lying on a sled', 'looking at the sky'], face: [] }
    ] },
    { id: 'snowball', label: '눈뭉치', tags: ['snowball'], pairs: ['snowman'], acts: [
      { id: 'throw', label: '눈뭉치 던지기', pose: 'stand', tags: ['throwing a snowball', 'snow flying'], face: [] },
      { id: 'hold', label: '등 뒤에 숨기기', pose: 'stand', tags: ['snowball in hand', 'hand half behind the back'], face: ['eye contact'] }
    ] },
    { id: 'skates', label: '스케이트 한 켤레', tags: ['ice skates hung by the laces'], pairs: ['cocoa'], acts: [
      { id: 'carry', label: '어깨에 걸고 걷기', pose: 'walk', tags: ['walking', 'skates slung over the shoulder'], face: [] },
      { id: 'lace', label: '벤치에서 끈 묶기', pose: 'sit', tags: ['sitting on a bench', 'lacing up ice skates'], face: [] }
    ] },
    { id: 'gift', label: '선물 상자', tags: ['wrapped gift box', 'ribbon bow'], near: ['wrapped presents'], pairs: ['cocoa', 'wreath'], acts: [
      { id: 'hug', label: '선물 상자 끌어안기', pose: 'stand', tags: ['hugging a gift box'], face: [] },
      { id: 'offer', label: '두 손으로 내밀기', pose: 'stand', tags: ['holding out a present with both hands'], face: ['eye contact'] },
      { id: 'shake', label: '귀에 대고 흔들어 보기', pose: 'stand', tags: ['shaking a gift box beside the ear'], face: [] }
    ] },
    { id: 'candle-lantern', label: '촛불 랜턴', kinds: ['dusk', 'night'], tags: ['candle lantern', 'warm glow'], near: ['candle lantern glowing nearby'], pairs: ['cocoa', 'gift', 'book'], acts: [
      { id: 'raise', label: '랜턴을 들어 비추기', pose: 'stand', tags: ['holding up a candle lantern'], face: [] },
      { id: 'close', label: '얼굴 가까이 들기', pose: 'stand', tags: ['lantern held close', 'light on the face'], face: [] }
    ] },
    { id: 'camellia', label: '동백 한 가지', tags: ['red camellia sprig'], pairs: ['winter-birds', 'book'], acts: [
      { id: 'nose', label: '꽃에 코를 대기', pose: 'stand', tags: ['camellia sprig held to the nose'], face: ['eyes closed'] },
      { id: 'ear', label: '귀 뒤에 꽂기', pose: 'stand', tags: ['tucking a camellia behind the ear'], face: ['eye contact'] },
      { id: 'brush', label: '꽃에 쌓인 눈 털기', pose: 'stand', tags: ['brushing snow off a camellia', 'fingertips'], face: [] }
    ] },
    { id: 'winter-birds', label: '동글동글한 겨울새', tags: ['small round birds'], near: ['small round birds in the snow'], pairs: ['snowman', 'cocoa', 'camellia'], acts: [
      { id: 'feed', label: '손바닥 모이 주기', pose: 'stand', tags: ['feeding small birds from the palm'], face: [] },
      { id: 'watch', label: '쪼그려 새 보기', pose: 'squat', tags: ['crouching', 'watching birds hop in the snow'], face: [] }
    ] },
    { id: 'wreath', label: '크리스마스 리스', tags: ['christmas wreath'], near: ['christmas wreath beside'], pairs: ['gift'], acts: [
      { id: 'raise', label: '리스를 들어 보이기', pose: 'stand', tags: ['holding up a christmas wreath'], face: ['eye contact'] },
      { id: 'hug', label: '리스를 품에 안기', pose: 'stand', tags: ['christmas wreath held against the chest'], face: [] }
    ] },
    // ── 계절 악기 ──
    { id: 'piano', label: '정원에 내놓은 피아노', tags: ['white upright piano set outdoors'], pairs: ['flower-basket', 'book'], acts: [
      { id: 'play', label: '피아노 치기', pose: 'sit', tags: ['sitting at the piano', 'playing', 'hands on the keys'], face: [] },
      { id: 'key', label: '서서 건반 하나 눌러 보기', pose: 'stand', tags: ['standing by the piano', 'pressing a single key'], face: [] },
      { id: 'sheet', label: '보면대에 악보 펴기', pose: 'stand', tags: ['leaning on the piano', 'arranging sheet music on the stand'], face: [] }
    ] },
    { id: 'ukulele', label: '우쿨렐레', tags: ['ukulele'], near: ['ukulele resting nearby'], pairs: ['ramune', 'fruit-basket', 'watermelon', 'seashells'], acts: [
      { id: 'strum', label: '우쿨렐레 치며 노래하기', pose: 'sit', tags: ['strumming a ukulele', 'singing'], face: [] },
      { id: 'tune', label: '줄에 귀 대고 조율하기', pose: 'sit', tags: ['tuning a ukulele', 'ear close to the strings'], face: [] },
      { id: 'carry', label: '어깨에 메고 걷기', pose: 'walk', tags: ['walking', 'ukulele held by the neck over the shoulder'], face: [] }
    ] },
    { id: 'violin', label: '바이올린', tags: ['violin', 'violin bow'], near: ['open violin case on the leaves'], pairs: ['book', 'cocoa', 'maple-leaves'], acts: [
      { id: 'play', label: '바이올린 켜기', pose: 'stand', tags: ['playing the violin', 'chin resting on the violin', 'bow drawn across the strings'], face: ['eyes closed'] },
      { id: 'pluck', label: '앉아서 줄 튕기기', pose: 'sit', tags: ['sitting', 'plucking the violin strings'], face: [] },
      { id: 'tuck', label: '바이올린을 팔에 끼고 걷기', pose: 'walk', tags: ['walking', 'violin tucked under the arm', 'bow in the other hand'], face: [] }
    ] },
    { id: 'accordion', label: '아코디언', tags: ['small accordion'], pairs: ['cocoa', 'gift'], acts: [
      { id: 'play', label: '주름상자 펼치며 연주하기', pose: 'stand', tags: ['playing an accordion', 'pulling the bellows open'], face: [] },
      { id: 'sit', label: '나무 상자에 앉아 연주하기', pose: 'sit', tags: ['sitting on a wooden crate', 'squeezing an accordion'], face: [] }
    ] },
    // ── 사계절 ──
    { id: 'book', label: '작은 책', tags: ['small hardcover book'], near: ['open book on the grass'], pairs: ['picnic', 'flower-basket', 'rabbit', 'birds', 'fruit-basket', 'cocoa', 'acorns', 'squirrel', 'rose', 'parasol', 'guitar', 'cherry-branch', 'watermelon', 'maple-leaves', 'camellia', 'candle-lantern'], acts: [
      { id: 'read', label: '책 읽기', pose: 'sit', tags: ['reading', 'book in both hands'], face: [] },
      { id: 'chest', label: '책을 가슴에 안고 올려다보기', pose: 'stand', tags: ['book held to the chest', 'looking up'], face: [] },
      { id: 'nap', label: '펼친 책을 배에 얹고 졸기', pose: 'lie', seasons: ['spring', 'summer', 'autumn'], tags: ['lying down', 'open book on the stomach', 'napping'], face: ['eyes closed'] }
    ] },
    { id: 'camera', label: '필름 카메라', tags: ['vintage film camera'], near: ['film camera on the ground'], pairs: ['picnic', 'kite', 'sunflowers', 'fruit-basket', 'seashells', 'maple-leaves', 'pumpkin', 'leaf-pile', 'cocoa'], acts: [
      { id: 'chest', label: '가슴께에 들기', pose: 'stand', tags: ['film camera held at the chest', 'strap around the neck'], face: ['eye contact'] },
      { id: 'check', label: '찍은 걸 확인하듯 내려다보기', pose: 'sit', tags: ['looking down at a film camera', 'winding the film'], face: [] }
    ] }
  ],

  scenes: [
    // ───────────── 봄 ─────────────
    {
      id: 'rose-garden', season: 'spring', title: '장미 정원', sub: 'Rose Garden',
      place: 'rose garden',
      core: ['outdoors', 'blooming rose bushes', 'pink roses', 'green leaves', 'spring'],
      details: ['rose arch', 'white garden bench', 'scattered petals', 'climbing roses on a trellis', 'stone path', 'butterflies'],
      lights: [
        { id: 'soft', label: '부드러운 햇살', kind: 'day', tags: ['soft sunlight', 'bright'] },
        { id: 'golden', label: '늦은 오후 역광', kind: 'golden', tags: ['late afternoon sun', 'warm backlight', 'rim light'] },
        { id: 'overcast', label: '흐린 날의 고른 빛', kind: 'overcast', tags: ['overcast', 'diffused light'] }
      ],
      moments: [
        { id: 'walk', label: '장미 덤불을 손끝으로 쓸며 걷기', pose: 'walk', tags: ['walking along the rose bushes', 'fingertips brushing the petals'], face: [] },
        { id: 'bench', label: '벤치에서 꽃잎 모아 보기', pose: 'sit', tags: ['sitting on a garden bench', 'fallen rose petals in the palm', 'looking at them'], face: [] },
        { id: 'arch', label: '아치의 장미에 손 뻗기', pose: 'stand', tags: ['standing under the rose arch', 'reaching up to a hanging rose'], face: [] },
        { id: 'petal', label: '떨어지는 꽃잎 받기', pose: 'stand', tags: ['catching falling petals', 'palms up'], face: [] }
      ],
      props: ['rose', 'flower-basket', 'parasol', 'book', 'watering-can', 'piano', 'rose-bouquet', 'lilac-bouquet'],
      outfits: ['rose-strapless', 'sakura-chiffon', 'blouse-flare', 'cardigan-floral', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['portrait', 'side', 'upper', 'cowboy', 'full', 'foreground'],
      tones: ['airy', 'film', 'dreamy', 'watercolor']
    },
    {
      id: 'wildflower', season: 'spring', title: '들꽃 초원', sub: 'Wildflower Meadow',
      place: 'wildflower meadow',
      core: ['outdoors', 'wildflower field', 'lavender and white wildflowers', 'tall grass', 'blue sky'],
      details: ['distant hills', 'dandelion puffs', 'petals in the breeze', 'butterflies', 'a lone tree', 'cornflowers'],
      lights: [
        { id: 'sun', label: '맑은 한낮', kind: 'day', tags: ['bright sunlight', 'clear sky'] },
        { id: 'cloud', label: '뭉게구름', kind: 'day', tags: ['fluffy white clouds', 'sunlit'] },
        { id: 'golden', label: '해 질 녘 금빛', kind: 'golden', tags: ['golden hour', 'warm light', 'long shadows'] }
      ],
      moments: [
        { id: 'sit', label: '들꽃을 귀에 꽂기', pose: 'sit', tags: ['sitting in the grass', 'tucking a wildflower behind the ear'], face: [] },
        { id: 'lie', label: '누워서 꽃 한 송이 들어 보기', pose: 'lie', tags: ['lying among the flowers', 'holding a flower above the face', 'looking at it'], face: ['eyes closed'] },
        { id: 'run', label: '꽃 위로 손을 스치며 달리기', pose: 'walk', tags: ['running through the flowers', 'hands trailing over the blossoms'], face: [] },
        { id: 'spin', label: '들꽃 한 줌 꺾기', pose: 'stand', tags: ['picking wildflowers', 'small bunch in one hand'], face: [] }
      ],
      props: ['flower-basket', 'picnic', 'daisy-chain', 'kite', 'rabbit', 'bubbles', 'book', 'piano', 'wild-bouquet'],
      outfits: ['yellow-floral', 'rose-strapless', 'blouse-flare', 'lavender-vest', 'puff-jeans', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['full', 'low', 'top', 'cowboy', 'portrait'],
      tones: ['airy', 'vivid', 'watercolor', 'anime']
    },
    {
      id: 'cherry-tree', season: 'spring', title: '벚나무 아래', sub: 'Under the Blossoms',
      place: 'under a cherry blossom tree',
      core: ['outdoors', 'cherry blossoms', 'falling petals', 'grass', 'spring'],
      details: ['petals on the ground', { t: 'blue sky between the branches', kinds: ['day', 'golden'] }, 'riverbank', 'row of cherry trees', 'pale pink canopy overhead', 'petals on the water'],
      lights: [
        { id: 'sun', label: '맑은 봄날', kind: 'day', tags: ['soft sunlight', 'clear sky'] },
        { id: 'golden', label: '오후의 역광', kind: 'golden', tags: ['warm backlight', 'glowing petals'] },
        { id: 'overcast', label: '하얗게 흐린 하늘', kind: 'overcast', tags: ['pale overcast sky', 'soft light'] }
      ],
      moments: [
        { id: 'up', label: '꽃 가득한 가지에 손 뻗기', pose: 'stand', tags: ['reaching toward a blossom-laden branch', 'looking up'], face: [] },
        { id: 'trunk', label: '줄기에 기대 무릎에 쌓인 꽃잎 보기', pose: 'sit', tags: ['sitting against the tree trunk', 'knees up', 'petals gathering on the lap'], face: [] },
        { id: 'catch', label: '두 손에 꽃잎 받기', pose: 'stand', tags: ['catching a petal', 'both hands cupped'], face: [] },
        { id: 'wind', label: '손바닥 꽃잎을 후 불기', pose: 'stand', tags: ['blowing petals off the palm'], face: [] }
      ],
      props: ['cherry-branch', 'picnic', 'book', 'camera', 'bubbles'],
      outfits: ['sakura-chiffon', 'cardigan-floral', 'trench-spring', 'lavender-vest', 'denim-jacket', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['portrait', 'upper', 'cowboy', 'full', 'low', 'foreground'],
      tones: ['airy', 'dreamy', 'film', 'watercolor']
    },
    {
      id: 'tulip', season: 'spring', title: '튤립 밭', sub: 'Tulip Rows',
      place: 'tulip field',
      core: ['outdoors', 'rows of colorful tulips', 'blue sky', 'spring'],
      details: ['windmill in the distance', 'dirt path between the rows', 'wooden fence', 'bicycle leaning on the fence', 'fluffy clouds', 'canal'],
      lights: [
        { id: 'sun', label: '맑은 한낮', kind: 'day', tags: ['bright sunlight', 'clear sky'] },
        { id: 'golden', label: '늦은 오후', kind: 'golden', tags: ['warm afternoon light', 'long shadows'] }
      ],
      moments: [
        { id: 'crouch', label: '쪼그려 앉아 튤립 꽃잎 만지기', pose: 'squat', tags: ['crouching between the rows', 'touching a tulip petal'], face: [] },
        { id: 'walk', label: '튤립 끝을 쓸며 걷다 돌아보기', pose: 'walk', tags: ['walking between the rows', 'hand skimming the tulip tops', 'looking back'], face: [] },
        { id: 'smell', label: '허리 숙여 향 맡기', pose: 'stand', tags: ['bending to smell a tulip'], face: ['eyes closed'] },
        { id: 'stand', label: '튤립 한 송이를 두 손으로 감싸기', pose: 'stand', tags: ['standing among the tulips', 'cupping a tulip bloom in both hands'], face: ['eye contact'] }
      ],
      props: ['flower-basket', 'watering-can', 'bubbles', 'camera', 'parasol', 'tulip-bouquet'],
      outfits: ['blouse-flare', 'yellow-floral', 'trench-spring', 'lavender-vest', 'denim-jacket', 'puff-jeans', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['full', 'cowboy', 'above', 'foreground', 'rear'],
      tones: ['vivid', 'airy', 'film', 'anime']
    },
    {
      id: 'canola', season: 'spring', title: '유채꽃 언덕', sub: 'Canola Hill',
      place: 'hill of canola flowers',
      core: ['outdoors', 'yellow canola flowers', 'rolling hill', 'blue sky', 'sea in the distance'],
      details: ['stone wall', 'white clouds', 'a single narrow path', 'butterflies', 'swaying flowers', 'lighthouse far away'],
      lights: [
        { id: 'sun', label: '맑은 한낮', kind: 'day', tags: ['bright sunlight', 'clear sky', 'wind'] },
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden hour', 'warm backlight'] }
      ],
      moments: [
        { id: 'path', label: '꽃을 스치며 꽃길 걷기', pose: 'walk', tags: ['walking down the narrow path', 'hands brushing the canola flowers'], face: [] },
        { id: 'hat', label: '흩날리는 꽃잎 속에 팔 벌리기', pose: 'stand', tags: ['standing in the wind', 'canola petals swirling around', 'arms open'], face: [] },
        { id: 'sit', label: '꽃 속에 앉아 꽃에 얼굴 대기', pose: 'sit', tags: ['sitting among the flowers', 'face close to a canola blossom'], face: ['eye contact'] },
        { id: 'sea', label: '유채 한 가지 꺾어 들고 바다 보기', pose: 'stand', tags: ['plucking a canola sprig', 'looking toward the sea'], face: [] }
      ],
      props: ['kite', 'picnic', 'bubbles', 'daisy-chain', 'camera', 'canola-bunch', 'cherry-branch'],
      outfits: ['yellow-floral', 'rose-strapless', 'trench-spring', 'blouse-flare', 'denim-jacket', 'puff-jeans', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['full', 'low', 'cowboy', 'rear', 'foreground'],
      tones: ['vivid', 'airy', 'anime', 'film']
    },
    {
      id: 'clover-stream', season: 'spring', title: '냇가 토끼풀밭', sub: 'Clover by the Stream',
      place: 'clover field by a stream',
      core: ['outdoors', 'white clover', 'clear stream', 'stepping stones', 'spring'],
      details: ['dandelions', 'willow branches', 'small wooden bridge', 'smooth pebbles', 'sparkling water', 'ducks on the water'],
      lights: [
        { id: 'sun', label: '맑은 오전', kind: 'day', tags: ['morning sunlight', 'sparkling water'] },
        { id: 'golden', label: '늦은 오후', kind: 'golden', tags: ['warm afternoon light', 'glinting stream'] }
      ],
      moments: [
        { id: 'stones', label: '징검돌 건너기', pose: 'walk', tags: ['stepping across stones', 'arms out for balance'], face: [] },
        { id: 'feet', label: '물에 발 담그고 앉기', pose: 'sit', shoes: '', tags: ['sitting on the bank', 'bare feet in the stream'], face: [] },
        { id: 'clover', label: '네잎클로버 찾기', pose: 'squat', tags: ['crouching', 'searching for a four-leaf clover'], face: [] },
        { id: 'lie', label: '누워서 클로버 잎을 하늘에 비추기', pose: 'lie', tags: ['lying in the clover', 'holding a clover leaf up to the sky'], face: [] }
      ],
      props: ['daisy-chain', 'rabbit', 'picnic', 'book', 'bubbles', 'wild-bouquet'],
      outfits: ['blouse-flare', 'cardigan-floral', 'lavender-vest', 'yellow-floral', 'denim-jacket', 'puff-jeans', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['full', 'above', 'top', 'cowboy', 'fullside'],
      tones: ['airy', 'watercolor', 'film', 'dreamy']
    },

    {
      id: 'forsythia', season: 'spring', title: '개나리 둑길', sub: 'Forsythia Bank',
      place: 'riverside bank lined with forsythia',
      core: ['outdoors', 'yellow forsythia', 'arching yellow branches', 'spring'],
      details: ['walking path along the river', 'blue sky', 'fallen yellow petals', 'wooden railing', 'distant bridge', 'sparkling river'],
      lights: [
        { id: 'sun', label: '맑은 봄날', kind: 'day', tags: ['soft sunlight', 'clear sky'] },
        { id: 'golden', label: '늦은 오후', kind: 'golden', tags: ['warm afternoon light', 'glowing yellow blossoms'] }
      ],
      moments: [
        { id: 'brush', label: '개나리를 손끝으로 스치며 걷기', pose: 'walk', tags: ['walking along the bank', 'fingertips brushing the forsythia'], face: [] },
        { id: 'lean', label: '노란 가지 사이로 몸 기울이기', pose: 'stand', tags: ['leaning into the yellow branches', 'blossoms around the face'], face: [] },
        { id: 'catch', label: '떨어지는 꽃잎 받기', pose: 'stand', tags: ['catching falling forsythia petals', 'palms up'], face: [] },
        { id: 'arch', label: '늘어진 가지 아래 지나가기', pose: 'walk', tags: ['ducking under an arching forsythia branch', 'hand lifting it aside'], face: [] }
      ],
      props: ['forsythia-branch', 'picnic', 'bubbles', 'camera', 'book'],
      outfits: ['cardigan-floral', 'blouse-flare', 'lavender-vest', 'trench-spring', 'denim-jacket', 'puff-jeans', 'sakura-chiffon', 'yellow-floral', 'rose-strapless', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['full', 'cowboy', 'portrait', 'low', 'foreground', 'fullside'],
      tones: ['vivid', 'airy', 'film', 'anime']
    },
    {
      id: 'azalea-trail', season: 'spring', title: '진달래 산길', sub: 'Azalea Trail',
      place: 'mountain trail covered in azaleas',
      core: ['outdoors', 'pink azaleas', 'mountain slope', 'spring'],
      details: ['rocky steps', 'pine trees', 'misty ridges', 'petals on the path', 'wooden signpost', 'valley far below'],
      lights: [
        { id: 'sun', label: '맑은 봄날', kind: 'day', tags: ['soft sunlight', 'clear sky'] },
        { id: 'mist', label: '옅은 안개', kind: 'overcast', tags: ['light mist', 'soft diffused light', 'vivid pink against the gray'] }
      ],
      moments: [
        { id: 'part', label: '가지를 헤치며 지나가기', pose: 'walk', tags: ['parting flowering azalea branches to pass'], face: [] },
        { id: 'light', label: '꽃 한 송이를 빛에 비춰 보기', pose: 'stand', tags: ['holding an azalea blossom up to the light'], face: [] },
        { id: 'rock', label: '바위에 앉아 꽃 만지기', pose: 'sit', tags: ['sitting on a rock among the azaleas', 'touching a blossom'], face: [] },
        { id: 'steps', label: '꽃가지 짚으며 계단 오르기', pose: 'walk', tags: ['climbing the rocky steps', 'hand on a flowering branch'], face: [] }
      ],
      props: ['azalea-branch', 'camera', 'book'],
      outfits: ['cardigan-floral', 'blouse-flare', 'lavender-vest', 'trench-spring', 'denim-jacket', 'puff-jeans', 'sakura-chiffon', 'yellow-floral', 'rose-strapless', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['full', 'wide', 'low', 'cowboy', 'rear', 'foreground'],
      tones: ['vivid', 'film', 'watercolor', 'muted']
    },
    {
      id: 'magnolia', season: 'spring', title: '목련 나무 아래', sub: 'Under the Magnolia',
      place: 'under a white magnolia tree',
      core: ['outdoors', 'white magnolia blossoms', 'large petals', 'spring'],
      details: ['blue sky', 'fallen magnolia petals', 'stone wall', 'tiled roof of an old house', 'wooden bench', 'small bird on a branch'],
      lights: [
        { id: 'sun', label: '맑은 봄날', kind: 'day', tags: ['soft sunlight', 'clear sky'] },
        { id: 'golden', label: '오후의 역광', kind: 'golden', tags: ['warm backlight', 'glowing white petals'] }
      ],
      moments: [
        { id: 'cup', label: '떨어진 큰 꽃잎을 두 손에', pose: 'stand', tags: ['cupping a large fallen magnolia petal in both hands'], face: [] },
        { id: 'touch', label: '낮은 꽃송이 만지기', pose: 'stand', tags: ['looking up', 'touching a low magnolia flower'], face: [] },
        { id: 'trunk', label: '줄기에 기대 무릎 위 꽃잎 보기', pose: 'sit', tags: ['sitting against the trunk', 'magnolia petal on the lap'], face: [] },
        { id: 'sky', label: '꽃잎을 하늘에 비춰 보기', pose: 'stand', tags: ['holding a magnolia petal up against the sky'], face: [] }
      ],
      props: ['magnolia-branch', 'book', 'camera'],
      outfits: ['cardigan-floral', 'blouse-flare', 'lavender-vest', 'trench-spring', 'denim-jacket', 'puff-jeans', 'sakura-chiffon', 'yellow-floral', 'rose-strapless', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['portrait', 'upper', 'low', 'cowboy', 'side', 'foreground'],
      tones: ['airy', 'dreamy', 'film', 'watercolor']
    },
    {
      id: 'wisteria', season: 'spring', title: '등나무 꽃 터널', sub: 'Wisteria Tunnel',
      place: 'wisteria tunnel',
      core: ['outdoors', 'hanging purple wisteria', 'wooden trellis overhead', 'spring'],
      details: ['stone path', 'bench under the trellis', 'bees', 'petals on the ground', 'garden pond', 'light filtering through the flowers'],
      lights: [
        { id: 'dapple', label: '꽃 사이로 드는 빛', kind: 'day', tags: ['dappled light through the wisteria', 'purple glow'] },
        { id: 'golden', label: '늦은 오후', kind: 'golden', tags: ['warm afternoon light', 'glowing hanging flowers'] }
      ],
      moments: [
        { id: 'reach', label: '늘어진 꽃송이에 손 뻗기', pose: 'stand', tags: ['reaching up to a hanging wisteria cluster'], face: [] },
        { id: 'trail', label: '꽃을 손끝으로 쓸며 걷기', pose: 'walk', tags: ['walking through the tunnel', 'fingertips trailing the hanging flowers'], face: [] },
        { id: 'bench', label: '벤치에 앉아 뺨에 닿는 꽃', pose: 'sit', tags: ['sitting on the bench under the trellis', 'a wisteria cluster brushing the cheek'], face: [] },
        { id: 'face', label: '꽃송이에 얼굴 기울이기', pose: 'stand', tags: ['tilting the face into the hanging flowers'], face: ['eyes closed'] }
      ],
      props: ['wisteria-cluster', 'lilac-bouquet', 'book', 'parasol', 'camera'],
      outfits: ['cardigan-floral', 'blouse-flare', 'lavender-vest', 'trench-spring', 'denim-jacket', 'puff-jeans', 'sakura-chiffon', 'yellow-floral', 'rose-strapless', 'm-sp-cardigan', 'm-sp-vest', 'sp-trench-u', 'sp-denim-u'],
      shots: ['portrait', 'cowboy', 'full', 'rear', 'foreground', 'side'],
      tones: ['dreamy', 'airy', 'watercolor', 'film']
    },

    // ───────────── 여름 ─────────────
    {
      id: 'sunflower', season: 'summer', title: '해바라기 밭', sub: 'Sunflower Field',
      place: 'sunflower field',
      core: ['outdoors', 'tall sunflowers', 'blue sky', 'summer'],
      details: ['towering clouds', 'dirt path', 'bees', 'sunflowers taller than the figure', 'wooden signpost', 'distant farmhouse'],
      lights: [
        { id: 'noon', label: '쨍한 한낮', kind: 'day', tags: ['strong sunlight', 'clear sky', 'crisp shadows'] },
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden hour', 'warm backlight', 'glowing petals'] }
      ],
      moments: [
        { id: 'peek', label: '해바라기 사이로 빼꼼', pose: 'stand', tags: ['peeking from between sunflowers'], face: ['eye contact'] },
        { id: 'walk', label: '해바라기 잎을 만지며 걷다 돌아보기', pose: 'walk', tags: ['walking down the path', 'touching a sunflower leaf', 'looking back'], face: [] },
        { id: 'reach', label: '큰 꽃에 손 뻗기', pose: 'stand', tags: ['reaching up to a sunflower'], face: [] },
        { id: 'away', label: '해바라기 줄기에 뺨 기대기', pose: 'stand', tags: ['cheek resting against a sunflower stalk'], face: [] }
      ],
      props: ['sunflowers', 'pinwheel', 'camera', 'ramune', 'bubbles'],
      outfits: ['white-sundress', 'blue-frill', 'lime-camisole', 'linen-shirtdress', 'm-su-linen', 'su-camp-u', 'su-tee-u'],
      shots: ['side', 'portrait', 'cowboy', 'low', 'foreground'],
      tones: ['vivid', 'anime', 'film', 'golden']
    },
    {
      id: 'engawa', season: 'summer', title: '툇마루', sub: 'Summer Veranda',
      place: 'wooden engawa of an old japanese house',
      core: ['sliding doors open', 'summer garden', 'polished floorboards', 'summer'],
      details: ['morning glories on a trellis', 'furin', 'wooden sandals on the stepping stone', 'electric fan', 'garden stones', 'green tree outside'],
      lights: [
        { id: 'morning', label: '맑은 아침', kind: 'day', tags: ['morning light', 'clear sky', 'bright'] },
        { id: 'noon', label: '한낮의 그늘', kind: 'day', tags: ['bright garden', 'cool shade under the eaves'] },
        { id: 'evening', label: '저녁 햇살', kind: 'golden', tags: ['evening sun', 'orange light on the floorboards'] }
      ],
      moments: [
        { id: 'dangle', label: '걸터앉아 풍경에 손 뻗기', pose: 'sit', shoes: '', tags: ['sitting on the edge of the veranda', 'legs dangling', 'reaching up to the wind chime', 'barefoot'], face: [] },
        { id: 'lie', label: '누워서 흔들리는 풍경 보기', pose: 'lie', shoes: '', tags: ['lying on the wooden floor', 'watching the wind chime sway', 'barefoot'], face: ['eyes closed'] },
        { id: 'lean', label: '나팔꽃을 손끝으로 만지기', pose: 'sit', shoes: '', tags: ['sitting at the edge', 'touching a morning glory on the trellis', 'barefoot'], face: [] },
        { id: 'kneel', label: '무릎 꿇고 장지문 밀어 열기', pose: 'sit', shoes: '', tags: ['kneeling on the floor', 'sliding a paper door open', 'barefoot'], face: ['eye contact'] }
      ],
      props: ['watermelon', 'shaved-ice', 'ramune', 'book', 'pinwheel', 'ukulele'],
      outfits: ['blue-frill', 'yukata-violet', 'white-sundress', 'linen-shirtdress', 'su-jinbei-u', 'm-su-yukata', 'm-su-linen', 'su-tee-u'],
      shots: ['fullside', 'side', 'cowboy', 'above', 'top', 'full'],
      tones: ['anime', 'film', 'vivid', 'airy']
    },
    {
      id: 'poolside', season: 'summer', title: '수영장', sub: 'Poolside', mix: 'swim',
      place: 'outdoor swimming pool',
      core: ['outdoors', 'poolside', 'clear blue water', 'tiled pool edge', 'blue sky'],
      details: ['pool ladder', 'deck chairs', 'palm tree', 'striped towel', 'light ripples on the pool floor', 'white clouds'],
      lights: [
        { id: 'noon', label: '쨍한 한낮', kind: 'day', tags: ['bright sunlight', 'sparkling water', 'clear sky'] },
        { id: 'golden', label: '늦은 오후', kind: 'golden', tags: ['warm afternoon light', 'glinting water'] }
      ],
      moments: [
        { id: 'edge', label: '물에 발 담그고 앉기', pose: 'sit', shoes: '', tags: ['sitting at the pool edge', 'feet in the water', 'barefoot'], face: [] },
        { id: 'knees', label: '물에 손을 담가 휘젓기', pose: 'sit', tags: ['sitting at the pool edge', 'trailing a hand in the water'], face: ['eye contact'] },
        { id: 'ladder', label: '사다리 잡고 발끝 담그기', pose: 'stand', shoes: '', tags: ['holding the pool ladder rail', 'dipping a toe into the water', 'barefoot'], face: [] },
        { id: 'splash', label: '발로 물 차기', pose: 'sit', shoes: '', tags: ['kicking water', 'splashing', 'water droplets', 'barefoot'], face: [] }
      ],
      props: ['float', 'water-gun', 'ramune', 'shaved-ice'],
      outfits: ['stripe-open', 'swim-cover', 'white-sundress', 'lime-camisole', 'bikini-frill', 'bikini-retro', 'swim-skirted', 'swim-halter', 'm-su-trunks', 'su-rash-u', 'su-camp-u'],
      shots: ['fullside', 'full', 'low', 'above', 'cowboy'],
      tones: ['vivid', 'anime', 'airy', 'cool']
    },
    {
      id: 'tree-shade', season: 'summer', title: '큰 나무 그늘', sub: 'Shade on the Hill',
      place: 'grassy hill under a big tree',
      core: ['outdoors', 'big shady tree', 'green grass', 'mountains in the distance', 'blue sky'],
      details: ['wildflowers', 'clover', 'tree roots', 'white clouds', 'distant village', 'buttercups'],
      lights: [
        { id: 'dapple', label: '나뭇잎 그늘', kind: 'day', tags: ['dappled sunlight', 'leaf shadows', 'summer'] },
        { id: 'golden', label: '늦은 오후', kind: 'golden', tags: ['warm afternoon light', 'long tree shadow'] }
      ],
      moments: [
        { id: 'trunk', label: '나무껍질에 손바닥 대고 올려다보기', pose: 'sit', tags: ['sitting against the tree trunk', 'palm on the bark', 'looking up'], face: [] },
        { id: 'lie', label: '누워서 잎에 손 뻗기', pose: 'lie', tags: ['lying in the grass', 'on back', 'reaching up toward the leaves'], face: [] },
        { id: 'nap', label: '나무뿌리 베고 낮잠', pose: 'lie', tags: ['napping on a tree root', 'arm under the head'], face: ['eyes closed'] },
        { id: 'hill', label: '낮은 가지를 잡고 골짜기 보기', pose: 'stand', tags: ['holding a low branch', 'looking down at the valley'], face: [] }
      ],
      props: ['guitar', 'birds', 'book', 'fruit-basket', 'picnic', 'camera', 'ukulele'],
      outfits: ['shirt-tie', 'lime-camisole', 'white-sundress', 'linen-shirtdress', 'm-su-linen', 'su-camp-u', 'su-tee-u'],
      shots: ['full', 'top', 'fullside', 'cowboy', 'above'],
      tones: ['anime', 'vivid', 'film', 'watercolor']
    },
    {
      id: 'festival-river', season: 'summer', title: '불꽃놀이 강가', sub: 'Festival Night', mix: false,
      place: 'riverbank on a summer festival night',
      core: ['outdoors', 'fireworks in the sky', 'river', 'summer festival'],
      details: ['paper lanterns', 'food stalls in the distance', 'reflections on the water', 'stone steps', 'arched bridge', 'distant crowd'],
      lights: [
        { id: 'dusk', label: '보랏빛 해 질 녘', kind: 'dusk', tags: ['dusk', 'purple sky', 'first stars'] },
        { id: 'night', label: '불꽃 터지는 밤', kind: 'night', tags: ['night', 'firework light', 'glowing lanterns', 'bokeh'] }
      ],
      moments: [
        { id: 'look', label: '불꽃을 올려다보기', pose: 'stand', tags: ['looking up at the fireworks'], face: [] },
        { id: 'steps', label: '돌계단에서 눈에 비친 불꽃', pose: 'sit', tags: ['sitting on the stone steps', 'hugging knees', 'fireworks reflected in the eyes'], face: [] },
        { id: 'turn', label: '종이 등을 들고 돌아보기', pose: 'stand', tags: ['holding a paper lantern', 'looking back'], face: ['eye contact'] },
        { id: 'bridge', label: '난간에 기대 불꽃을 가리키기', pose: 'stand', tags: ['leaning on the bridge railing', 'pointing at the fireworks'], face: [] }
      ],
      props: ['sparkler', 'goldfish-bag', 'shaved-ice', 'ramune'],
      outfits: ['yukata-violet', 'yukata-navy', 'su-jinbei-u', 'm-su-yukata'],
      shots: ['portrait', 'upper', 'full', 'low', 'side', 'rear'],
      tones: ['anime', 'vivid', 'dreamy', 'film']
    },
    {
      id: 'rain-pond', season: 'summer', title: '비 오는 연꽃 연못', sub: 'Lotus Pond in the Rain', mix: false,
      place: 'lotus pond boardwalk in the rain',
      core: ['outdoors', 'rain', 'lotus pond', 'wooden boardwalk', 'broad lotus leaves'],
      details: ['pink lotus flowers', 'raindrops pooling on lotus leaves', 'reeds', 'wooden railing', 'dragonfly resting on a bud', 'rings spreading on the water'],
      lights: [
        { id: 'rain', label: '쏟아지는 비', kind: 'rain', tags: ['rain', 'overcast sky', 'wet glossy surfaces'] },
        { id: 'sunrain', label: '해 뜬 채 내리는 비', kind: 'rain', tags: ['sun shower', 'sunlight through the rain', 'glittering raindrops'] }
      ],
      moments: [
        { id: 'rail', label: '난간 너머 연꽃 들여다보기', pose: 'stand', tags: ['leaning over the railing', 'looking closely at a lotus flower'], face: [] },
        { id: 'tip', label: '연잎을 기울여 빗물 쏟기', pose: 'squat', tags: ['crouching at the edge', 'tipping a lotus leaf to spill its pooled rain'], face: [] },
        { id: 'bud', label: '연꽃 봉오리에 손 뻗기', pose: 'stand', tags: ['reaching out to touch a lotus bud'], face: [] },
        { id: 'puddle', label: '데크 위 물웅덩이 밟기', pose: 'stand', tags: ['stepping into a puddle on the boardwalk', 'water spraying'], face: [] }
      ],
      props: ['frog', 'umbrella', 'yellow-umbrella', 'dot-umbrella', 'wagasa', 'frill-umbrella', 'check-umbrella'],
      outfits: ['frog-raincoat', 'duck-raincoat', 'yellow-slicker', 'clear-raincoat', 'dot-raincoat', 'cat-raincoat', 'blue-frill', 'linen-shirtdress'],
      shots: ['full', 'cowboy', 'side', 'above', 'fullside', 'foreground'],
      tones: ['vivid', 'anime', 'cool', 'dreamy']
    },
    {
      id: 'hydrangea-rain', season: 'summer', title: '비 오는 수국 길', sub: 'Hydrangeas in the Rain', mix: false,
      place: 'hydrangea path in the rain',
      core: ['outdoors', 'rain', 'blue and purple hydrangeas', 'wet stone steps'],
      details: ['puddles on the steps', 'raindrops on leaves', 'mossy stones', 'wooden fence', 'misty hillside', 'pink hydrangeas'],
      lights: [
        { id: 'rain', label: '부슬비', kind: 'rain', tags: ['light rain', 'soft gray sky', 'wet glossy leaves'] },
        { id: 'sunrain', label: '비 사이로 든 해', kind: 'rain', tags: ['sun shower', 'backlit raindrops'] }
      ],
      moments: [
        { id: 'touch', label: '빗방울 맺힌 수국 감싸기', pose: 'stand', tags: ['cupping a rain-heavy hydrangea bloom'], face: [] },
        { id: 'drip', label: '잎 끝 빗방울 받기', pose: 'stand', tags: ['catching drips from a leaf tip on a fingertip'], face: [] },
        { id: 'steps', label: '젖은 돌계단 오르기', pose: 'walk', tags: ['climbing the wet stone steps', 'hand brushing the hydrangeas'], face: [] },
        { id: 'face', label: '수국에 얼굴 가까이', pose: 'squat', tags: ['crouching', 'face close to the hydrangea petals'], face: ['eyes closed'] }
      ],
      props: ['snail', 'umbrella', 'yellow-umbrella', 'dot-umbrella', 'wagasa', 'frill-umbrella', 'check-umbrella', 'hydrangea-bloom'],
      outfits: ['frog-raincoat', 'duck-raincoat', 'yellow-slicker', 'clear-raincoat', 'dot-raincoat', 'cat-raincoat', 'blue-frill', 'linen-shirtdress'],
      shots: ['portrait', 'cowboy', 'full', 'side', 'foreground', 'rear'],
      tones: ['cool', 'dreamy', 'film', 'watercolor']
    },
    {
      id: 'beach', season: 'summer', title: '여름 바닷가', sub: 'Summer Shore', mix: 'beach',
      place: 'sandy beach',
      core: ['outdoors', 'sea', 'gentle waves', 'white sand', 'blue sky'],
      details: ['footprints in the sand', 'driftwood', 'beach umbrella far away', 'seagulls', 'sea foam', 'towering clouds'],
      lights: [
        { id: 'noon', label: '쨍한 한낮', kind: 'day', tags: ['bright sunlight', 'clear sky', 'sparkling sea'] },
        { id: 'golden', label: '노을 지는 바다', kind: 'golden', tags: ['sunset', 'orange sky', 'shimmering sea'] }
      ],
      moments: [
        { id: 'wade', label: '얕은 물에 들어가 물 차기', pose: 'stand', shoes: '', tags: ['wading in the shallow water', 'kicking up water', 'barefoot'], face: [] },
        { id: 'shore', label: '신발 들고 물가 걷기', pose: 'walk', shoes: '', tags: ['walking along the shore', 'shoes in hand', 'barefoot'], face: [] },
        { id: 'sit', label: '모래에 손가락으로 그림 그리기', pose: 'sit', tags: ['sitting on the sand', 'drawing in the sand with a finger'], face: [] },
        { id: 'wind', label: '발등을 덮는 물결 맞기', pose: 'stand', shoes: '', tags: ['standing at the waterline', 'waves washing over the feet', 'barefoot'], face: [] }
      ],
      props: ['seashells', 'camera', 'ramune', 'pinwheel', 'kite', 'ukulele'],
      outfits: ['tiered-beach', 'white-sundress', 'stripe-open', 'swim-cover', 'bikini-frill', 'bikini-retro', 'swim-skirted', 'swim-halter', 'm-su-trunks', 'su-rash-u', 'm-su-linen', 'su-camp-u'],
      shots: ['full', 'rear', 'low', 'cowboy', 'fullside'],
      tones: ['vivid', 'cool', 'film', 'golden']
    },

    {
      id: 'lavender', season: 'summer', title: '라벤더 밭', sub: 'Lavender Rows',
      place: 'lavender field',
      core: ['outdoors', 'rows of purple lavender', 'summer', 'blue sky'],
      details: ['bees', 'stone farmhouse in the distance', 'dirt path between the rows', 'cypress trees', 'wooden bench', 'rolling hills'],
      lights: [
        { id: 'sun', label: '맑은 한낮', kind: 'day', tags: ['bright sunlight', 'clear sky'] },
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden hour', 'warm light on the lavender'] }
      ],
      moments: [
        { id: 'brush', label: '라벤더 끝을 손으로 쓸기', pose: 'walk', tags: ['walking between the rows', 'hand running over the lavender tops'], face: [] },
        { id: 'kneel', label: '무릎 꿇고 향 맡기', pose: 'squat', tags: ['kneeling', 'face close to the lavender'], face: ['eyes closed'] },
        { id: 'pick', label: '라벤더 몇 줄기 꺾기', pose: 'stand', tags: ['picking a few stems of lavender'], face: [] },
        { id: 'lie', label: '고랑 사이에 눕기', pose: 'lie', tags: ['lying between the rows', 'lavender on both sides'], face: [] }
      ],
      props: ['lavender-bunch', 'picnic', 'camera', 'book', 'bubbles'],
      outfits: ['white-sundress', 'blue-frill', 'linen-shirtdress', 'lime-camisole', 'tiered-beach', 'shirt-tie', 'm-su-linen', 'su-camp-u', 'su-tee-u'],
      shots: ['wide', 'full', 'cowboy', 'top', 'rear', 'foreground'],
      tones: ['airy', 'vivid', 'film', 'dreamy']
    },
    {
      id: 'poppy', season: 'summer', title: '개양귀비 들판', sub: 'Poppy Field',
      place: 'red poppy field',
      core: ['outdoors', 'red poppies', 'tall green grass', 'early summer'],
      details: ['white daisies', 'blue sky', 'distant hills', 'butterflies', 'cornflowers', 'swaying stems'],
      lights: [
        { id: 'sun', label: '맑은 한낮', kind: 'day', tags: ['bright sunlight', 'clear sky'] },
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden hour', 'backlit red petals'] }
      ],
      moments: [
        { id: 'brush', label: '양귀비 사이를 헤치며 걷기', pose: 'walk', tags: ['walking through the poppies', 'hands brushing the petals'], face: [] },
        { id: 'crouch', label: '쪼그려 한 송이 들여다보기', pose: 'squat', tags: ['crouching', 'looking closely at a poppy'], face: [] },
        { id: 'wind', label: '바람에 날리는 꽃잎 속', pose: 'stand', tags: ['standing in the poppies', 'red petals carried by the wind'], face: [] },
        { id: 'lie', label: '양귀비 속에 눕기', pose: 'lie', tags: ['lying among the poppies', 'one hand touching a flower'], face: [] }
      ],
      props: ['poppy-bouquet', 'picnic', 'camera', 'book'],
      outfits: ['white-sundress', 'blue-frill', 'linen-shirtdress', 'lime-camisole', 'tiered-beach', 'shirt-tie', 'm-su-linen', 'su-camp-u', 'su-tee-u'],
      shots: ['wide', 'full', 'low', 'top', 'cowboy', 'foreground'],
      tones: ['vivid', 'film', 'anime', 'golden']
    },

    // ───────────── 가을 ─────────────
    {
      id: 'maple-path', season: 'autumn', title: '단풍 숲길', sub: 'Maple Path',
      place: 'forest path in autumn',
      core: ['outdoors', 'red maple trees', 'autumn leaves', 'fallen leaves on the path'],
      details: ['falling leaves', 'wooden bench', 'stone steps', 'moss', 'small stream', { t: 'sunbeams through the trees', kinds: ['day', 'golden'] }],
      lights: [
        { id: 'clear', label: '맑은 가을 하늘', kind: 'day', tags: ['clear autumn sky', 'crisp light'] },
        { id: 'golden', label: '역광의 단풍', kind: 'golden', tags: ['golden afternoon light', 'backlit leaves'] },
        { id: 'overcast', label: '흐린 날', kind: 'overcast', tags: ['overcast', 'soft even light', 'rich colors'] }
      ],
      moments: [
        { id: 'walk', label: '낙엽을 차며 걷기', pose: 'walk', tags: ['walking', 'kicking through the fallen leaves'], face: [] },
        { id: 'catch', label: '떨어지는 잎 잡기', pose: 'stand', tags: ['catching a falling leaf'], face: [] },
        { id: 'bench', label: '벤치에서 단풍잎 빙글 돌리기', pose: 'sit', tags: ['sitting on a wooden bench', 'twirling a maple leaf by the stem'], face: [] },
        { id: 'steps', label: '단풍잎을 빛에 비춰 보기', pose: 'stand', tags: ['standing on stone steps', 'holding a maple leaf up to the light'], face: ['eye contact'] }
      ],
      props: ['maple-leaves', 'book', 'camera', 'cocoa', 'squirrel', 'violin'],
      outfits: ['knit-plaid', 'camel-coat', 'mustard-cardigan', 'tartan-cape', 'trench-autumn', 'ribbed-dress', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['full', 'portrait', 'low', 'rear', 'foreground', 'cowboy'],
      tones: ['golden', 'film', 'vivid', 'muted']
    },
    {
      id: 'cosmos', season: 'autumn', title: '코스모스 들판', sub: 'Cosmos Field',
      place: 'cosmos field',
      core: ['outdoors', 'pink and white cosmos flowers', 'autumn sky', 'high clouds'],
      details: ['red dragonflies', 'dirt road', 'swaying flowers', 'distant mountains', 'wooden fence', 'wisps of cloud'],
      lights: [
        { id: 'clear', label: '높고 맑은 하늘', kind: 'day', tags: ['clear autumn sky', 'soft sunlight'] },
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden hour', 'warm backlight', 'glowing petals'] }
      ],
      moments: [
        { id: 'walk', label: '꽃잎을 손끝으로 스치며 걷기', pose: 'walk', tags: ['walking slowly through the flowers', 'fingertips brushing the petals'], face: [] },
        { id: 'sit', label: '코스모스를 턱 밑에 대기', pose: 'sit', tags: ['sitting among the flowers', 'cosmos flower held under the chin'], face: ['eye contact'] },
        { id: 'dragonfly', label: '잠자리에 손가락 내밀기', pose: 'stand', tags: ['holding out a finger to a dragonfly'], face: [] },
        { id: 'wind', label: '줄기를 당겨 꽃 향 맡기', pose: 'stand', tags: ['bending a cosmos stem toward the face', 'smelling it'], face: [] }
      ],
      props: ['flower-basket', 'camera', 'kite', 'daisy-chain', 'book', 'violin', 'cosmos-bouquet'],
      outfits: ['corduroy-dress', 'mustard-cardigan', 'knit-plaid', 'camel-coat', 'ribbed-dress', 'sweater-vest', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['portrait', 'cowboy', 'low', 'foreground', 'side'],
      tones: ['airy', 'watercolor', 'film', 'dreamy']
    },
    {
      id: 'silver-grass', season: 'autumn', title: '억새 언덕', sub: 'Silver Grass Hill',
      place: 'hill covered in silver grass',
      core: ['outdoors', 'swaying silver grass', 'rolling hill', 'wide sky'],
      details: ['sunset clouds', 'a lone path', 'distant mountains', 'birds flying in a line', 'seed fluff in the air', 'wooden observation deck'],
      lights: [
        { id: 'golden', label: '금빛 역광', kind: 'golden', tags: ['golden hour', 'backlit grass', 'glowing tips'] },
        { id: 'dusk', label: '해 진 뒤', kind: 'dusk', tags: ['dusk', 'pink and lilac sky'] }
      ],
      moments: [
        { id: 'walk', label: '억새에 팔을 스치며 걷기', pose: 'walk', tags: ['walking along the path', 'silver grass brushing the arms'], face: [] },
        { id: 'brush', label: '이삭 끝을 손으로 쓸기', pose: 'stand', tags: ['hand brushing over the grass tips'], face: [] },
        { id: 'sit', label: '억새 한 줄기 빙글 돌리기', pose: 'sit', tags: ['sitting on the hillside', 'twirling a stalk of silver grass'], face: [] },
        { id: 'back', label: '억새 한 줄기 들고 돌아보기', pose: 'stand', tags: ['holding a stalk of silver grass', 'looking back over shoulder'], face: ['eye contact'] }
      ],
      props: ['kite', 'camera', 'cocoa', 'book', 'violin'],
      outfits: ['camel-coat', 'tartan-cape', 'knit-plaid', 'mustard-cardigan', 'trench-autumn', 'suede-jacket', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['rear', 'side', 'full', 'low', 'foreground'],
      tones: ['golden', 'film', 'dreamy', 'muted']
    },
    {
      id: 'leaf-park', season: 'autumn', title: '낙엽 공원', sub: 'Park in Fallen Leaves',
      place: 'park covered in fallen leaves',
      core: ['outdoors', 'fallen leaves', 'yellow and red trees', 'park bench'],
      details: ['old street lamp', 'gravel path', 'pigeons', 'stone fountain', 'benches in a row', 'ginkgo leaves'],
      lights: [
        { id: 'clear', label: '맑은 오후', kind: 'day', tags: ['clear sky', 'crisp autumn light'] },
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden afternoon light', 'long shadows'] },
        { id: 'overcast', label: '흐린 날', kind: 'overcast', tags: ['overcast', 'soft light'] }
      ],
      moments: [
        { id: 'bench', label: '벤치에서 떨어지는 잎 받기', pose: 'sit', tags: ['sitting on a park bench', 'leaves falling onto the lap', 'palms open'], face: ['eye contact'] },
        { id: 'kick', label: '낙엽을 차며 걷기', pose: 'walk', tags: ['kicking up leaves while walking'], face: [] },
        { id: 'leaf', label: '잎 하나 주워 보기', pose: 'squat', tags: ['crouching', 'picking up a leaf', 'looking at it'], face: [] },
        { id: 'lamp', label: '가로등 아래 은행잎 던지기', pose: 'stand', tags: ['leaning against a street lamp', 'tossing a ginkgo leaf'], face: [] }
      ],
      props: ['leaf-pile', 'cocoa', 'book', 'camera', 'maple-leaves', 'squirrel', 'violin'],
      outfits: ['knit-plaid', 'camel-coat', 'mustard-cardigan', 'corduroy-dress', 'trench-autumn', 'ribbed-dress', 'sweater-vest', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['full', 'cowboy', 'above', 'top', 'low', 'portrait'],
      tones: ['golden', 'film', 'cozy', 'muted']
    },
    {
      id: 'pumpkin-patch', season: 'autumn', title: '호박 밭', sub: 'Pumpkin Patch',
      place: 'pumpkin patch',
      core: ['outdoors', 'orange pumpkins', 'dry vines', 'autumn'],
      details: ['hay bales', 'wooden wagon', 'scarecrow', 'dried corn stalks', 'wooden crates', 'small gourds'],
      lights: [
        { id: 'clear', label: '맑은 오후', kind: 'day', tags: ['clear autumn sky', 'warm sunlight'] },
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden hour', 'long shadows'] },
        { id: 'dusk', label: '어스름', kind: 'dusk', tags: ['dusk', 'orange and violet sky'] }
      ],
      moments: [
        { id: 'hay', label: '건초 더미에서 지푸라기 뽑기', pose: 'sit', tags: ['sitting on a hay bale', 'pulling a straw from the bale'], face: ['eye contact'] },
        { id: 'walk', label: '호박을 톡톡 두드리며 걷기', pose: 'walk', tags: ['stepping between the pumpkins', 'tapping one with a finger'], face: [] },
        { id: 'wagon', label: '호박 실은 수레에 기대기', pose: 'stand', tags: ['leaning on a wooden wagon full of pumpkins'], face: [] },
        { id: 'crouch', label: '호박 하나 골라 보기', pose: 'squat', tags: ['crouching', 'patting a pumpkin'], face: [] }
      ],
      props: ['pumpkin', 'jack-lantern', 'camera', 'cocoa'],
      outfits: ['knit-plaid', 'mustard-cardigan', 'corduroy-dress', 'suede-jacket', 'sweater-vest', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['full', 'cowboy', 'low', 'above', 'portrait'],
      tones: ['golden', 'vivid', 'cozy', 'film']
    },
    {
      id: 'oak-woods', season: 'autumn', title: '도토리 숲', sub: 'Oak Woods',
      place: 'oak woodland in autumn',
      core: ['outdoors', 'oak trees', 'acorns on the ground', 'mossy logs', 'fallen leaves'],
      details: ['ferns', { t: 'sunbeams', kinds: ['day', 'golden'] }, 'tree stump', 'red mushrooms', 'winding trail', 'woven leaf litter'],
      lights: [
        { id: 'beams', label: '나무 사이 햇살', kind: 'day', tags: ['sunbeams through the trees', 'dappled light'] },
        { id: 'golden', label: '늦은 오후', kind: 'golden', tags: ['warm afternoon light', 'glowing leaves'] },
        { id: 'mist', label: '옅은 안개', kind: 'overcast', tags: ['light mist', 'soft diffused light'] }
      ],
      moments: [
        { id: 'mushroom', label: '버섯 들여다보기', pose: 'squat', tags: ['crouching', 'looking at red mushrooms'], face: [] },
        { id: 'log', label: '통나무의 이끼 만지기', pose: 'sit', tags: ['sitting on a mossy log', 'touching the moss'], face: [] },
        { id: 'peek', label: '떡갈나무 줄기를 안고 내다보기', pose: 'stand', tags: ['hugging an oak trunk', 'peeking around it'], face: ['eye contact'] },
        { id: 'trail', label: '떨어진 떡갈잎 줍기', pose: 'walk', tags: ['walking down the trail', 'picking up a fallen oak leaf'], face: [] }
      ],
      props: ['acorns', 'squirrel', 'book', 'camera', 'maple-leaves'],
      outfits: ['mushroom-cape', 'corduroy-dress', 'tartan-cape', 'knit-plaid', 'suede-jacket', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['full', 'low', 'cowboy', 'above', 'foreground', 'portrait'],
      tones: ['film', 'cozy', 'watercolor', 'muted']
    },

    {
      id: 'pink-muhly', season: 'autumn', title: '핑크뮬리 들판', sub: 'Pink Muhly',
      place: 'field of pink muhly grass',
      core: ['outdoors', 'pink muhly grass', 'soft pink haze', 'autumn'],
      details: ['wooden boardwalk', 'soft clouds', 'distant trees', 'wind', 'benches along the path', 'pale blue sky'],
      lights: [
        { id: 'day', label: '맑은 오후', kind: 'day', tags: ['soft sunlight', 'clear autumn sky'] },
        { id: 'golden', label: '해 질 녘 역광', kind: 'golden', tags: ['golden backlight', 'glowing pink grass'] }
      ],
      moments: [
        { id: 'brush', label: '분홍 풀을 손으로 쓸기', pose: 'walk', tags: ['walking', 'hand running over the pink grass'], face: [] },
        { id: 'waist', label: '허리까지 잠겨 서기', pose: 'stand', tags: ['standing waist-deep in the pink grass', 'arms resting on top of it'], face: [] },
        { id: 'board', label: '데크를 걸으며 손끝 스치기', pose: 'walk', tags: ['walking the boardwalk', 'fingertips trailing the grass'], face: [] },
        { id: 'blow', label: '앉아서 보송한 이삭 불기', pose: 'sit', tags: ['sitting in the grass', 'blowing on the fluffy tips'], face: [] }
      ],
      props: ['muhly-bunch', 'camera', 'book', 'cocoa'],
      outfits: ['knit-plaid', 'camel-coat', 'corduroy-dress', 'mustard-cardigan', 'trench-autumn', 'ribbed-dress', 'sweater-vest', 'tartan-cape', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['wide', 'full', 'cowboy', 'portrait', 'rear', 'foreground'],
      tones: ['dreamy', 'airy', 'golden', 'film']
    },
    {
      id: 'buckwheat', season: 'autumn', title: '메밀꽃 밭', sub: 'Buckwheat in Bloom',
      place: 'buckwheat flower field',
      core: ['outdoors', 'white buckwheat flowers', 'field', 'autumn'],
      details: ['stone wall', 'thatched farmhouse', 'rolling hills', 'dirt road', 'dragonflies', 'pine trees on the ridge'],
      lights: [
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden hour', 'warm light on the white flowers'] },
        { id: 'dusk', label: '어스름', kind: 'dusk', tags: ['dusk', 'lilac sky'] },
        { id: 'moon', label: '달밤', kind: 'night', tags: ['night', 'full moon', 'moonlight on the white flowers'] }
      ],
      moments: [
        { id: 'road', label: '흙길을 걸으며 꽃 위로 손', pose: 'walk', tags: ['walking the dirt road', 'hand over the white flowers'], face: [] },
        { id: 'crouch', label: '흰 꽃 속에 쪼그려 앉기', pose: 'squat', tags: ['crouching among the white flowers', 'touching a cluster'], face: [] },
        { id: 'moon', label: '꽃밭에 서서 달 보기', pose: 'stand', kinds: ['night'], tags: ['standing in the field', 'looking up at the full moon'], face: [] },
        { id: 'pick', label: '메밀꽃 한 줄기 꺾기', pose: 'stand', tags: ['picking a sprig of buckwheat flowers'], face: [] }
      ],
      props: ['buckwheat-bunch', 'camera', 'candle-lantern', 'book'],
      outfits: ['knit-plaid', 'camel-coat', 'corduroy-dress', 'mustard-cardigan', 'trench-autumn', 'ribbed-dress', 'sweater-vest', 'tartan-cape', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['wide', 'full', 'rear', 'cowboy', 'low', 'foreground'],
      tones: ['dreamy', 'muted', 'film', 'cool']
    },
    {
      id: 'aster-hill', season: 'autumn', title: '들국화 언덕', sub: 'Wild Chrysanthemum Hill',
      place: 'hillside of wild chrysanthemums',
      core: ['outdoors', 'white and pale purple wild chrysanthemums', 'autumn sky'],
      details: ['stone steps', 'pine trees', 'high clouds', 'dragonflies', 'mossy rocks', 'view over the valley'],
      lights: [
        { id: 'day', label: '높고 맑은 하늘', kind: 'day', tags: ['clear autumn sky', 'crisp light'] },
        { id: 'golden', label: '해 질 녘', kind: 'golden', tags: ['golden hour', 'long shadows'] }
      ],
      moments: [
        { id: 'smell', label: '꽃송이에 코 대기', pose: 'stand', tags: ['smelling a cluster of wild chrysanthemums'], face: ['eyes closed'] },
        { id: 'pick', label: '꽃 사이에 앉아 몇 송이 따기', pose: 'sit', tags: ['sitting among the flowers', 'picking a few'], face: [] },
        { id: 'ridge', label: '능선을 걸으며 꽃 스치기', pose: 'walk', tags: ['walking along the ridge', 'brushing the flowers'], face: [] },
        { id: 'ear', label: '작은 꽃을 귀 뒤에 꽂기', pose: 'stand', tags: ['tucking a small flower behind the ear'], face: [] }
      ],
      props: ['aster-bouquet', 'violin', 'camera', 'book'],
      outfits: ['knit-plaid', 'camel-coat', 'corduroy-dress', 'mustard-cardigan', 'trench-autumn', 'ribbed-dress', 'sweater-vest', 'tartan-cape', 'm-au-coat', 'm-au-shawl', 'au-suede-u', 'au-flannel-u'],
      shots: ['full', 'wide', 'portrait', 'cowboy', 'low', 'side'],
      tones: ['film', 'golden', 'watercolor', 'muted']
    },

    // ───────────── 겨울 ─────────────
    {
      id: 'snowfield', season: 'winter', title: '눈 덮인 들판', sub: 'Snowfield',
      place: 'snowy field',
      core: ['outdoors', 'snow', 'winter', 'snow-covered ground'],
      details: ['snow-covered trees', 'footprints in the snow', 'distant cabin', { t: 'snow sparkle', kinds: ['day', 'golden'] }, 'wooden fence under snow', { t: 'blue shadows on the snow', kinds: ['day', 'golden'] }, 'small animal tracks in the snow'],
      lights: [
        { id: 'sun', label: '눈부신 맑은 날', kind: 'day', tags: ['sunlight', 'clear winter sky', 'sparkling snow'] },
        { id: 'snowfall', label: '함박눈', kind: 'snow', tags: ['falling snow', 'soft gray sky'] },
        { id: 'golden', label: '낮은 겨울 해', kind: 'golden', tags: ['low winter sun', 'pink sky', 'long blue shadows'] }
      ],
      moments: [
        { id: 'angel', label: '눈 천사 만들기', pose: 'lie', tags: ['making a snow angel', 'lying in the snow'], face: [] },
        { id: 'tongue', label: '혀로 눈송이 받기', pose: 'stand', kinds: ['snow'], tags: ['catching snowflakes on the tongue', 'face up'], face: ['eyes closed'] },
        { id: 'walk', label: '눈을 퍼 하늘로 날리기', pose: 'stand', tags: ['tossing snow into the air', 'snow glittering'], face: [] },
        { id: 'touch', label: '쪼그려 눈 만져 보기', pose: 'squat', tags: ['crouching', 'touching the fresh snow'], face: [] }
      ],
      props: ['snowman', 'mini-snowmen', 'sled', 'snowball', 'cocoa', 'winter-birds'],
      outfits: ['poncho-earflap', 'duffle', 'white-fur', 'cream-puffer', 'shearling', 'm-wi-peacoat', 'm-wi-chester', 'm-wi-shearling', 'wi-nordic-u'],
      shots: ['full', 'fullside', 'top', 'low', 'cowboy'],
      tones: ['cool', 'airy', 'anime', 'film']
    },
    {
      id: 'snow-cabin', season: 'winter', title: '눈 숲 오두막', sub: 'Cabin in the Snow',
      place: 'log cabin in a snowy forest',
      core: ['outdoors', 'snowy pine forest', 'log cabin', 'warm window light'],
      details: ['smoke from the chimney', 'stacked firewood', 'lantern by the door', 'icicles', 'snow on the roof', 'sled tracks'],
      lights: [
        { id: 'snowfall', label: '눈 내리는 낮', kind: 'snow', tags: ['falling snow', 'soft gray light'] },
        { id: 'blue', label: '푸른 저녁', kind: 'dusk', tags: ['blue hour', 'glowing windows', 'snow glow'] },
        { id: 'sun', label: '맑은 아침', kind: 'day', tags: ['clear morning', 'sunlight on the snow'] }
      ],
      moments: [
        { id: 'porch', label: '계단에 앉아 손바닥에 눈 받기', pose: 'sit', tags: ['sitting on the porch steps', 'catching snowflakes on the palm'], face: [] },
        { id: 'window', label: '서리 낀 창에 손가락으로 그림 그리기', pose: 'stand', tags: ['drawing on a frosted window with a fingertip'], face: [] },
        { id: 'door', label: '문 앞에서 눈 털기', pose: 'stand', tags: ['brushing snow off the shoulders', 'at the door'], face: ['eye contact'] },
        { id: 'path', label: '처마의 고드름 따기', pose: 'stand', tags: ['breaking off an icicle', 'looking at it'], face: [] }
      ],
      props: ['cocoa', 'candle-lantern', 'sled', 'gift', 'winter-birds', 'accordion'],
      outfits: ['fair-isle', 'duffle', 'red-coat', 'poncho-earflap', 'shearling', 'cape-coat', 'm-wi-peacoat', 'm-wi-chester', 'm-wi-shearling', 'wi-nordic-u'],
      shots: ['full', 'rear', 'cowboy', 'portrait', 'low'],
      tones: ['cozy', 'film', 'cool', 'golden']
    },
    {
      id: 'frozen-lake', season: 'winter', title: '얼어붙은 호수', sub: 'Frozen Lake',
      place: 'frozen lake',
      core: ['outdoors', 'frozen lake', 'ice', 'snowy shore', 'pine trees'],
      details: ['skate marks on the ice', 'mountains', 'wooden bench on the shore', 'thin mist', { t: 'reflections on the ice', kinds: ['day', 'golden'] }, 'bare birch trees'],
      lights: [
        { id: 'sun', label: '맑은 겨울 한낮', kind: 'day', tags: ['clear winter sky', 'bright sunlight', 'glinting ice'] },
        { id: 'golden', label: '분홍빛 오후', kind: 'golden', tags: ['low winter sun', 'pink and gold sky'] },
        { id: 'snowfall', label: '눈발', kind: 'snow', tags: ['light snowfall', 'soft gray sky'] }
      ],
      moments: [
        { id: 'glide', label: '두 팔 벌려 미끄러지기', pose: 'stand', shoes: 'ice skates', tags: ['ice skating', 'gliding', 'arms out'], face: [] },
        { id: 'spin', label: '제자리 돌기', pose: 'stand', shoes: 'ice skates', tags: ['ice skating', 'spinning'], face: [] },
        { id: 'slip', label: '휘청이기', pose: 'stand', shoes: 'ice skates', tags: ['ice skating', 'about to slip', 'arms flailing'], face: [] },
        { id: 'shore', label: '물가에 쪼그려 얼음 만지기', pose: 'squat', tags: ['crouching at the shore', 'touching the ice surface'], face: [] }
      ],
      props: ['skates', 'cocoa', 'camera'],
      outfits: ['skating', 'white-fur', 'fair-isle', 'cream-puffer', 'long-coat', 'm-wi-peacoat', 'm-wi-chester', 'm-wi-shearling', 'wi-nordic-u'],
      shots: ['full', 'low', 'fullside', 'cowboy', 'portrait'],
      tones: ['cool', 'airy', 'film', 'dreamy']
    },
    {
      id: 'xmas-market', season: 'winter', title: '크리스마스 마켓', sub: 'Christmas Market',
      place: 'christmas market',
      core: ['outdoors', 'wooden market stalls', 'string lights', 'christmas tree', 'snow'],
      details: ['glass ornaments', 'hot drink stand', 'garlands', 'gingerbread cookies', 'carousel in the background', 'lanterns'],
      lights: [
        { id: 'dusk', label: '불이 켜지는 저녁', kind: 'dusk', tags: ['dusk', 'blue sky', 'warm string lights'] },
        { id: 'night', label: '반짝이는 밤', kind: 'night', tags: ['night', 'bokeh', 'glowing lights'] }
      ],
      moments: [
        { id: 'ornament', label: '유리 장식을 불빛에 비춰 보기', pose: 'stand', tags: ['holding a glass ornament up to the lights'], face: [] },
        { id: 'walk', label: '진저브레드 쿠키 들고 걷기', pose: 'walk', tags: ['holding up a gingerbread cookie', 'walking between the stalls'], face: [] },
        { id: 'tree', label: '트리에 장식 걸기', pose: 'stand', tags: ['hanging an ornament on the christmas tree'], face: ['eye contact'] },
        { id: 'breath', label: '따뜻한 음료 가게에서 손 녹이기', pose: 'stand', tags: ['warming hands at the hot drink stand', 'visible breath'], face: [] }
      ],
      props: ['gift', 'cocoa', 'wreath', 'candle-lantern', 'camera', 'accordion'],
      outfits: ['red-coat', 'duffle', 'white-fur', 'fair-isle', 'long-coat', 'cape-coat', 'm-wi-peacoat', 'm-wi-chester', 'm-wi-shearling', 'wi-nordic-u'],
      shots: ['portrait', 'upper', 'cowboy', 'full', 'side', 'foreground'],
      tones: ['cozy', 'golden', 'dreamy', 'film']
    },
    {
      id: 'camellia-garden', season: 'winter', title: '눈 속 동백', sub: 'Camellias in Snow',
      place: 'camellia garden in winter',
      core: ['outdoors', 'red camellia flowers', 'glossy green leaves', 'snow on the flowers'],
      details: ['stone lantern', 'fallen camellias on the snow', 'bamboo fence', 'stone path', 'pale winter sky', 'snow-covered roof tiles'],
      lights: [
        { id: 'sun', label: '맑은 겨울 아침', kind: 'day', tags: ['clear winter morning', 'soft sunlight'] },
        { id: 'snowfall', label: '조용히 내리는 눈', kind: 'snow', tags: ['gentle snowfall', 'quiet gray sky'] }
      ],
      moments: [
        { id: 'path', label: '가지의 눈 털며 걷기', pose: 'walk', tags: ['walking along the stone path', 'brushing snow off a branch'], face: [] },
        { id: 'fallen', label: '눈 위의 동백 주워 들기', pose: 'squat', tags: ['crouching', 'picking up a fallen camellia from the snow'], face: [] },
        { id: 'up', label: '동백꽃에 손 뻗기', pose: 'stand', tags: ['reaching up to a camellia flower'], face: [] },
        { id: 'lantern', label: '석등에 쌓인 눈 털기', pose: 'stand', tags: ['brushing snow from the stone lantern'], face: ['eye contact'] }
      ],
      props: ['camellia', 'winter-birds', 'book', 'cocoa'],
      outfits: ['duffle', 'red-coat', 'poncho-earflap', 'white-fur', 'long-coat', 'cape-coat', 'm-wi-peacoat', 'm-wi-chester', 'm-wi-shearling', 'wi-nordic-u'],
      shots: ['portrait', 'side', 'cowboy', 'full', 'foreground', 'above'],
      tones: ['muted', 'cool', 'watercolor', 'film']
    },
    {
      id: 'frost-meadow', season: 'winter', title: '서리 내린 들판', sub: 'Frost Morning',
      place: 'frost-covered meadow at sunrise',
      core: ['outdoors', 'hoarfrost', 'frosted grass', 'white trees', 'winter morning'],
      details: [{ t: 'sunrise glow', kinds: ['golden'] }, 'ice crystals', 'frozen puddles', 'frosted fence', 'distant hills', 'thin mist over the ground'],
      lights: [
        { id: 'sunrise', label: '해 뜨는 아침', kind: 'golden', tags: ['sunrise', 'pink and gold light', 'glittering frost'] },
        { id: 'clear', label: '맑은 아침', kind: 'day', tags: ['clear blue sky', 'crisp cold light'] }
      ],
      moments: [
        { id: 'breath', label: '서리 낀 잎에 입김 불기', pose: 'stand', tags: ['breathing on a frosted leaf', 'visible breath'], face: [] },
        { id: 'frost', label: '서리 맺힌 풀 만지기', pose: 'squat', tags: ['crouching', 'touching the frosted grass'], face: [] },
        { id: 'puddle', label: '언 웅덩이 밟아 보기', pose: 'stand', tags: ['stepping on a frozen puddle', 'looking down'], face: [] },
        { id: 'walk', label: '서리 낀 울타리를 손끝으로 만지기', pose: 'stand', tags: ['touching the frosted fence', 'fingertips on the ice crystals'], face: [] }
      ],
      props: ['winter-birds', 'cocoa', 'camera'],
      outfits: ['cream-puffer', 'fair-isle', 'duffle', 'white-fur', 'long-coat', 'shearling', 'm-wi-peacoat', 'm-wi-chester', 'm-wi-shearling', 'wi-nordic-u'],
      shots: ['full', 'low', 'portrait', 'fullside', 'foreground'],
      tones: ['cool', 'airy', 'dreamy', 'golden']
    },
    {
      id: 'plum-snow', season: 'winter', title: '눈 속 매화', sub: 'Plum Blossoms in Snow',
      place: 'plum blossoms in the snow',
      core: ['outdoors', 'red and white plum blossoms', 'snow on the branches', 'late winter'],
      details: ['stone wall', 'tiled roof', 'snowy path', 'pale sky', 'fallen petals on the snow', 'small birds'],
      lights: [
        { id: 'sun', label: '맑은 겨울 아침', kind: 'day', tags: ['clear winter morning', 'soft sunlight'] },
        { id: 'snowfall', label: '조용히 내리는 눈', kind: 'snow', tags: ['gentle snowfall', 'quiet gray sky'] }
      ],
      moments: [
        { id: 'smell', label: '매화 향 맡기', pose: 'stand', tags: ['smelling a plum blossom'], face: ['eyes closed'] },
        { id: 'brush', label: '꽃가지의 눈 털기', pose: 'stand', tags: ['brushing snow off a blossoming branch'], face: [] },
        { id: 'reach', label: '꽃가지에 손 뻗기', pose: 'stand', tags: ['reaching up to a flowering branch'], face: [] },
        { id: 'catch', label: '눈과 함께 지는 꽃잎 받기', pose: 'stand', kinds: ['snow'], tags: ['catching a falling petal among the snowflakes'], face: [] }
      ],
      props: ['plum-branch', 'winter-birds', 'cocoa', 'book'],
      outfits: ['duffle', 'red-coat', 'poncho-earflap', 'white-fur', 'long-coat', 'cape-coat', 'm-wi-peacoat', 'm-wi-chester', 'm-wi-shearling', 'wi-nordic-u'],
      shots: ['portrait', 'cowboy', 'full', 'side', 'foreground', 'low'],
      tones: ['muted', 'cool', 'watercolor', 'film']
    }
  ]
};
