// Prompt Archive : Costume Library
// Generator engine, Korean/English UI labels, locks, printing, and interactions.
// Data lives in data.js.

const $=s=>document.querySelector(s);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const locks={};
let selectLang="ko";

const selectI18n={
  labels:{
    ko:{
      collection:"컬렉션",
      period:"시대",
      gender:"성별",
      fidelity:"고증 강도",
      foundation:"기초 의복",
      structure:"실루엣 구조",
      garment:"주 의복",
      neckwear:"넥웨어",
      outer:"겉옷 레이어",
      footwear:"신발",
      headwear:"머리 장식",
      accessories:"액세서리",
      detail:"디테일",
      color:"기본 색",
      accent:"포인트 색",
      other:"추가 태그",
      preset:"프리셋"
    },
    en:{
      collection:"COLLECTION",
      period:"PERIOD",
      gender:"GENDER",
      fidelity:"FIDELITY",
      foundation:"FOUNDATION",
      structure:"STRUCTURE",
      garment:"MAIN GARMENT",
      neckwear:"NECKWEAR",
      outer:"OUTER LAYER",
      footwear:"FOOTWEAR",
      headwear:"HEADWEAR",
      accessories:"ACCESSORIES",
      detail:"DETAIL LEVEL",
      color:"BASE COLOR",
      accent:"ACCENT COLOR",
      other:"OTHER",
      preset:"PRESET"
    }
  },
  staticOptions:{
    collection:{
      ko:{antiquity:"고대 복식",rosette:"로제트 · 유럽 복식",modern:"근대 복식 · 1900–1965",fantasy:"판타지 인덱스"},
      en:{antiquity:"Antiquity",rosette:"Rosette",modern:"Modern",fantasy:"Fantasy Index"}
    },
    gender:{
      ko:{Feminine:"여성",Masculine:"남성",Neutral:"중성"},
      en:{Feminine:"Feminine",Masculine:"Masculine",Neutral:"Neutral"}
    },
    fidelity:{
      ko:{Historical:"고증 중심",Romanticized:"로맨틱화",Fantasy:"판타지",Otherworldly:"이세계"},
      en:{Historical:"Historical",Romanticized:"Romanticized",Fantasy:"Fantasy",Otherworldly:"Otherworldly"}
    },
    detail:{
      ko:{Simple:"간단",Medium:"보통",Max:"최대",Random:"랜덤"},
      en:{Simple:"Simple",Medium:"Medium",Max:"Max",Random:"Random"}
    }
  }
};

/* 색 이름 — 드롭다운 표기용. 프롬프트에는 영어가 들어간다. */
const colorKo={
  "undyed white":"무염색 흰색","natural linen":"생 리넨색","saffron yellow":"사프란 노랑","deep purple":"짙은 보라","terracotta red":"테라코타 레드",
  "olive green":"올리브 그린","sea blue":"바다 파랑","ochre":"황토색","gold-shot white":"금실 섞인 흰색","pale moonlight":"옅은 달빛색","sunset amber":"석양 호박색",
  "ivory":"아이보리","cream":"크림","deep burgundy":"짙은 버건디","forest green":"포레스트 그린","midnight blue":"미드나이트 블루","dusty rose":"더스티 로즈",
  "wine red":"와인 레드","charcoal grey":"차콜 그레이","pale gold":"연한 금색","plum":"플럼","silver white":"실버 화이트","moonlight blue":"달빛 파랑",
  "pale lilac":"연보라 라일락","iridescent pearl":"무지갯빛 진주","powder blue":"파우더 블루","dove grey":"도브 그레이","black":"검정","blush pink":"블러시 핑크",
  "navy":"네이비","bottle green":"보틀 그린","oxblood":"옥스블러드","butter yellow":"버터 옐로","camel":"카멜","champagne gold":"샴페인 골드","silver lamé":"실버 라메",
};
const optionKo={
  "14C Gothic":"14세기 고딕",
  "15C Burgundian":"15세기 부르고뉴",
  "16C Tudor / Elizabethan":"16세기 튜더 / 엘리자베스",
  "17C Baroque":"17세기 바로크",
  "18C Rococo":"18세기 로코코",
  "1780s Transitional":"1780년대 과도기",
  "Regency / Empire":"리젠시 / 엠파이어",
  "1830s Romantic":"1830년대 로맨틱",
  "1850–60s Crinoline":"1850–60년대 크리놀린",
  "1870–80s Bustle":"1870–80년대 버슬",
  "1890s Gibson":"1890년대 깁슨",

  "Archaic Greek":"고졸기 그리스",
  "Classical Greek":"고전기 그리스",
  "Hellenistic":"헬레니즘",
  "Roman Republic":"로마 공화정",
  "Roman Imperial":"로마 제정",
  "Byzantine":"비잔틴",

  "1900s Edwardian":"1900년대 에드워디안",
  "1910s Transitional":"1910년대 과도기",
  "1920s Flapper":"1920년대 플래퍼",
  "1930s Bias Cut":"1930년대 바이어스 컷",
  "1940s Utility":"1940년대 유틸리티",
  "1950s New Look":"1950년대 뉴 룩",
  "Early 1960s":"1960년대 초",

  "Any Era":"모든 시대",
  "Gothic + Rococo":"고딕 + 로코코",
  "Regency + Victorian":"리젠시 + 빅토리안",
  "Byzantine + Baroque":"비잔틴 + 바로크",
  "1950s + Rococo":"1950년대 + 로코코",
  "Free Cross-Era Mix":"자유 시대 혼합",

  "linen chemise":"리넨 슈미즈",
  "fine cotton shift":"고운 코튼 시프트",
  "lace-trimmed chemise":"레이스 장식 슈미즈",
  "simple under-tunic":"기본 언더 튜닉",
  "light linen tunic":"가벼운 리넨 튜닉",
  "fine pleated chiton":"잔주름 키톤",
  "corset foundation":"코르셋 파운데이션",
  "light girdle":"가벼운 거들",
  "structured brassiere":"구조적인 브래지어",
  "petticoat foundation":"페티코트 파운데이션",
  "corseted fantasy foundation":"코르셋형 판타지 기초 의복",
  "soft layered underdress":"부드러운 레이어드 언더드레스",
  "ornate structured underlayer":"화려한 구조형 언더레이어",

  "structured stays":"구조적인 스테이즈",
  "pannier-supported silhouette":"파니에 실루엣",
  "corseted waist":"코르셋 허리",
  "crinoline-supported skirt":"크리놀린 스커트 구조",
  "bustle-supported silhouette":"버슬 실루엣",
  "soft vertical drape":"부드러운 세로 드레이프",
  "heavy wool fall":"무거운 울 드레이프",
  "fine pleated drapery":"잔주름 드레이퍼리",
  "high-girdled drape":"높은 허리끈 드레이프",
  "S-curve silhouette":"S커브 실루엣",
  "dropped waist silhouette":"드롭 웨이스트 실루엣",
  "bias-cut line":"바이어스 컷 라인",
  "nipped waist silhouette":"잘록한 허리 실루엣",
  "full petticoat silhouette":"풍성한 페티코트 실루엣",
  "clean shift silhouette":"깔끔한 시프트 실루엣",
  "exaggerated bell silhouette":"과장된 벨 실루엣",
  "dramatic bustle silhouette":"극적인 버슬 실루엣",
  "high empire waist with wide skirt":"하이 엠파이어 웨이스트 + 와이드 스커트",
  "hybrid pannier-crinoline structure":"파니에-크리놀린 혼합 구조",
  "otherworldly layered silhouette":"이세계풍 레이어드 실루엣",

  "open-front gown":"오픈 프런트 가운",
  "fitted bodice with layered skirt":"핏된 보디스 + 레이어드 스커트",
  "court gown":"궁정 가운",
  "long trained dress":"긴 트레인 드레스",
  "ornate day dress":"화려한 데이 드레스",
  "Doric chiton":"도리아식 키톤",
  "Ionic chiton":"이오니아식 키톤",
  "peplos-inspired dress":"페플로스풍 드레스",
  "stola-inspired garment":"스톨라풍 의복",
  "long tunica":"롱 튜니카",
  "Edwardian day dress":"에드워디안 데이 드레스",
  "beaded evening dress":"비즈 이브닝 드레스",
  "bias-cut evening gown":"바이어스 컷 이브닝 가운",
  "utility dress":"유틸리티 드레스",
  "full-skirt New Look dress":"풀스커트 뉴 룩 드레스",
  "early 1960s shift dress":"1960년대 초 시프트 드레스",
  "ornate fantasy court gown":"화려한 판타지 궁정 가운",
  "romantic royal dress":"로맨틱 로열 드레스",
  "gothic ceremonial gown":"고딕 세리머니얼 가운",
  "hybrid historical ball gown":"혼합 역사풍 볼 가운",
  "layered magical dress":"레이어드 매지컬 드레스",

  "short mantle":"숏 맨틀",
  "decorative capelet":"장식 케이플릿",
  "embroidered overdress":"자수 오버드레스",
  "pelisse-inspired outer layer":"펠리스풍 겉옷",
  "himation":"히마티온",
  "chlamys":"클라미스",
  "palla":"팔라",
  "draped mantle":"드레이프 맨틀",
  "tailored jacket":"테일러드 재킷",
  "fur-trimmed coat":"퍼 트림 코트",
  "short bolero":"숏 볼레로",
  "structured overcoat":"구조적인 오버코트",
  "cropped cardigan":"크롭 카디건",
  "embroidered cape":"자수 케이프",
  "jewel-fastened mantle":"보석 여밈 맨틀",
  "decorative shoulder armor":"장식 숄더 아머",
  "transparent over-robe":"투명 오버로브",
  "long ceremonial train":"긴 세리머니얼 트레인",

  "lace cap":"레이스 캡",
  "ribboned bonnet":"리본 보닛",
  "feathered headpiece":"깃털 헤드피스",
  "small veil":"작은 베일",
  "ornate hair ribbon":"화려한 헤어 리본",
  "fillet":"필렛",
  "diadem":"다이아뎀",
  "veil":"베일",
  "wreath":"화관",
  "sakkos":"사코스",
  "picture hat":"픽처 햇",
  "cloche hat":"클로슈 햇",
  "tilted felt hat":"기울인 펠트 햇",
  "small veil hat":"스몰 베일 햇",
  "pillbox hat":"필박스 햇",
  "jeweled veil":"보석 베일",
  "fantasy crown":"판타지 왕관",
  "ornate horns":"화려한 뿔 장식",
  "halo-like headdress":"헤일로형 헤드드레스",
  "feathered tiara":"깃털 티아라",

  "pearl accessories":"진주 액세서리",
  "lace gloves":"레이스 장갑",
  "ribbon bows":"리본 보우",
  "brooch details":"브로치 디테일",
  "small reticule":"작은 레티큘",
  "fibula brooch":"피불라 브로치",
  "gold armlet":"골드 암릿",
  "simple belt":"심플 벨트",
  "sandals":"샌들",
  "decorative clasp":"장식 클래스프",
  "gloves":"장갑",
  "brooch":"브로치",
  "structured handbag":"구조적인 핸드백",
  "pearl necklace":"진주 목걸이",
  "silk scarf":"실크 스카프",
  "crystal jewelry":"크리스털 주얼리",
  "magical embroidery":"마법 자수",
  "ribbon cascades":"리본 캐스케이드",
  "decorative chains":"장식 체인",
  "wing-like ornaments":"날개형 장식"
};


const KO={
"Lace mantelet":"레이스 망틀레","Lace shawl":"레이스 숄","Lace capelet":"레이스 케이플릿","Lace cape":"레이스 케이프","Lace evening cape":"레이스 이브닝 케이프","Lace cloak":"레이스 클로크",
"Cloth face wrap":"천 마스크","Gas mask":"방독면",
"Outer corset":"아우터 코르셋","Hooded cloak":"후드 클로크","Early trench coat":"초기 트렌치코트","Carnival mask":"카니발 가면","Bone mask":"뼈 가면","Skull mask":"두개골 가면","Beaked mask":"새부리 가면","Half mask":"하프 마스크","Domino mask":"도미노 마스크","Plague doctor coat":"역병의사 코트",
"Clay pipe":"클레이 파이프","Meerschaum pipe":"미어샴 파이프","Churchwarden pipe":"처치워든 파이프","Briar pipe":"브라이어 파이프","Cigar":"시가",
"Uniform tunic":"제복 상의",
"Hoplite panoply":"호플리테스 무장","Corinthian helmet":"코린토스식 투구","Round shield":"둥근 방패","Linen cuirass":"리노토락스",
"Pilos helmet":"필로스 투구","Muscled cuirass":"근육 흉갑","Thracian helmet":"트라키아식 투구","Mail and tunic":"사슬갑옷 + 튜닉",
"Bronze helmet":"청동 투구","Short sword":"글라디우스","Segmented armour":"로리카 세그멘타타","Legionary helmet":"군단병 투구",
"Lamellar corselet":"라멜라 갑옷","Gilded helmet":"금박 투구","Mail and surcoat":"사슬갑옷 + 서코트","Bascinet":"바시넷",
"Arming sword":"아밍 소드","Plate harness":"판금 갑주","Sallet":"살렛","Breastplate and tassets":"흉갑 + 태싯",
"Morion":"모리온","Buff coat":"버프 코트","Regimental coat":"연대 코트","Livery coat":"리버리 코트",
"Grenadier mitre cap":"척탄병 미터 캡","Officer coat":"장교 코트","Hussar jacket":"후사르 재킷","Shako":"샤코",
"Sabre":"세이버","Military frock coat":"군용 프록코트","Belled shako":"벨형 샤코","Kepi":"케피",
"Dress uniform":"예복 군복","Forage cap":"포리지 캡","Patrol jacket":"패트롤 재킷","Pith helmet":"피스 헬멧",
"Naval reefer":"해군 리퍼 재킷","Naval peaked cap":"해군 정모","Service tunic":"군복 상의","Steel helmet":"철모",
"Mess dress":"메스 드레스","Dress cap":"예모","Officer tunic":"장교 상의","Battledress":"전투복",
"Lace coif":"레이스 코이프","Lappet cap":"래핏 캡","Pinner cap":"피너 캡","Gauze and lace cap":"거즈·레이스 캡",
"Ruffled lace cap":"러플 레이스 캡","Lace-lined bonnet":"레이스 안감 보닛","Lace bonnet":"레이스 보닛","Mantilla":"만틸라",
"Widow cap":"위도우 캡","Lace toque":"레이스 토크","Veiled straw hat":"베일 스트로 해트","Lace picture hat":"레이스 픽처 해트",
"Draped gauze veil":"거즈 베일","Juliet cap":"줄리엣 캡","Veiled hat":"베일 해트","Crocheted snood":"크로셰 스누드",
"Birdcage veil":"버드케이지 베일","Lace half-hat":"레이스 하프해트","Chapel veil":"채플 베일",
"Short under-tunic":"짧은 언더튜닉","Strophion":"스트로피온","Under-chiton":"언더키톤","Tunica interior":"투니카 인테리오르",
"Strophium":"스트로피움","Silk under-tunic":"실크 언더튜닉","Linen under-tunic":"리넨 언더튜닉","Slashed shoes":"슬래시드 슈즈",
"Robe à l'anglaise":"로브 아 랑글레즈","Low-heel shoes":"로우힐 슈즈","Riding boots":"라이딩 부츠","Sailor hat":"세일러 해트",
"Toque":"토크","Pet-en-l'air":"페탕레르","Princess petticoat":"프린세스 페티코트","Camisole + petticoat":"캐미솔 + 페티코트",
"Step-in chemise":"스텝인 슈미즈","Bias slip":"바이어스 슬립","Rayon slip":"레이온 슬립","Nylon slip":"나일론 슬립",
"Slip":"슬립","Frock coat + striped trousers":"프록코트 + 스트라이프 트라우저","Lounge suit":"라운지 슈트","Double-breasted suit":"더블브레스트 슈트",
"Knit polo + chinos":"니트 폴로 + 치노","Ivy blazer":"아이비 블레이저","Boned lace collar":"본드 레이스 칼라","Wing collar + ascot":"윙칼라 + 애스콧",
"V-neck + chemisette":"V넥 + 슈미제트","Turn-down collar":"턴다운 칼라","Bateau neckline":"바토 네크라인","Collarless V":"칼라리스 V넥",
"Club collar + tie":"클럽 칼라 + 타이","Cowl neckline":"카울 네크라인","Pussy-bow":"퍼시보 타이","Wide lapel + tie":"와이드 라펠 + 타이",
"Sweetheart neckline":"스위트하트 네크라인","Notched collar":"노치드 칼라","Plain collar + tie":"플레인 칼라 + 타이","Portrait neckline":"포트레이트 네크라인",
"Peter Pan collar":"피터팬 칼라","Narrow tie":"내로 타이","Jewel neckline":"주얼 네크라인","Boat neck":"보트넥",
"Skinny tie":"스키니 타이","Bolero jacket":"볼레로 재킷","Motoring duster":"모터링 더스터","Kimono-cut coat":"기모노 컷 코트",
"Cocoon coat":"코쿤 코트","Trench coat":"트렌치코트","Evening wrap":"이브닝 랩","Kimono-sleeve coat":"기모노 슬리브 코트",
"Raccoon coat":"라쿤 퍼 코트","Fur-collar jacket":"퍼칼라 재킷","Broad-shouldered coat":"와이드숄더 코트","Boxy jacket":"박시 재킷",
"Belted trench":"벨티드 트렌치","Cropped bolero":"크롭 볼레로","Swing coat":"스윙 코트","Car coat":"카 코트",
"Cropped boxy jacket":"크롭 박시 재킷","Trapeze coat":"트라페즈 코트","Three-quarter coat":"세븐부 코트","Laced boots":"레이스업 부츠",
"T-strap heels":"T스트랩 힐","Evening sandals":"이브닝 샌들","Brogues":"브로그","Chunky heels":"청키 힐",
"Wedge sandals":"웨지 샌들","Oxfords":"옥스퍼드","Stiletto pumps":"스틸레토 펌프스","Ballet flats":"발레 플랫",
"Saddle shoes":"새들 슈즈","Kitten heels":"키튼 힐","Square-toed pumps":"스퀘어토 펌프스","Loafers":"로퍼",
"Motoring veil":"모터링 베일","Jewelled bandeau":"주얼 밴도","Wide picture hat":"와이드 픽처 해트","Tied headscarf":"타이드 헤드스카프",
"Narrow fedora":"내로 페도라","Snap-brim fedora":"스냅브림 페도라","Turban scarf":"터번 스카프","Tilt hat":"틸트 해트",
"Service cap":"제복 모자","Long gloves":"롱 글러브","Lace parasol":"레이스 파라솔","Lorgnette":"로르네트",
"Tassel sash":"태슬 새시","Aigrette":"에그레트","Long pearls":"롱 펄","Cigarette holder":"시가렛 홀더",
"Feather boa":"페더 보아","Deco beading":"데코 비딩","Dress clips":"드레스 클립","Evening gloves":"이브닝 글러브",
"Deco clutch":"데코 클러치","Seamed stockings":"심 스타킹","Lapel brooch":"라펠 브로치","Boxy handbag":"박시 핸드백",
"White gloves":"화이트 글러브","Pearl set":"펄 세트","Cat-eye sunglasses":"캣아이 선글라스","Box handbag":"박스 핸드백",
"Oversized buttons":"오버사이즈 버튼","Short gloves":"쇼트 글러브","Chunky pearls":"청키 펄","Wide headband":"와이드 헤어밴드",
"Chemise":"슈미즈","Shift":"시프트","Smock":"스목","Shirt":"셔츠","Combinations":"콤비네이션",
"Chemise + drawers":"슈미즈 + 드로어즈","Braies + shirt":"브레 + 셔츠","None":"없음",
"Laced kirtle":"레이스업 커틀","High-belted kirtle":"하이웨이스트 커틀","Mahoitres":"마우아트르",
"Spanish farthingale":"스페인 파딩게일","Wheel farthingale":"휠 파딩게일","Bodied stays":"보디드 스테이즈",
"Soft stays":"소프트 스테이즈","Panniers":"파니에","Court panniers":"궁정 파니에","Conical stays":"원뿔형 스테이즈",
"False rump":"폴스 럼프","Transitional stays":"과도기 스테이즈","Short stays":"쇼트 스테이즈","Unstructured":"무구조",
"Corded corset":"코디드 코르셋","Sleeve plumpers":"슬리브 플럼퍼","Layered petticoats":"레이어드 페티코트",
"Cage crinoline":"케이지 크리놀린","Elliptical crinoline":"엘립티컬 크리놀린","Boned corset":"본드 코르셋",
"Soft bustle":"소프트 버슬","Shelf bustle":"셸프 버슬","Spoon busk corset":"스푼 버스크 코르셋",
"Hourglass corset":"아워글라스 코르셋","Sleeve supports":"슬리브 서포트","Hip pads":"힙 패드",
"Outer bodied stays":"겉보디스 스테이즈","Overlaid stays":"오버레이드 스테이즈","Corset worn over":"아우터 코르셋","Corset belt":"코르셋 벨트",
"Walking staff":"지팡이","Laurel branch":"월계수 가지","Imperial scepter":"황제 홀","Globus cruciger":"보주","Akakia":"아카키아",
"Pilgrim staff":"순례자 지팡이","Girdle book":"거들북","Gnarled staff":"옹이진 지팡이","Scepter":"왕홀","Sceptre and orb":"왕홀과 보주",
"Ceremonial staff":"의례용 장杖","Court scepter":"궁정 홀","Feather fan":"깃털 부채","Jewelled étui":"보석 에튀이",
"Silver-topped cane":"은장식 케인","Malacca cane":"말라카 케인","Lady\u2019s cane":"레이디스 케인",
"Tortoiseshell comb":"대모갑 빗","Jet comb":"제트 빗","Jewelled comb":"보석 빗","Aigrette comb":"에그레트 빗","Deco comb":"데코 빗",
"Pendant watch":"펜던트 워치","Pocket watch":"회중시계","Hunter watch":"헌터케이스 회중시계","Oil flask":"기름병",
"Seal ring":"인장 반지","Strigil":"스트리길","Garnet earrings":"가넷 귀걸이","Gold rings":"금반지",
"Bulla amulet":"불라 부적","Wax tablets":"밀랍 서판","Lunula pendant":"루눌라 펜던트","Cameo ring":"카메오 반지",
"Reliquary cross":"성유물 십자가","Censer":"향로","Alms purse":"오모니에르","Paternoster beads":"파테르노스테르",
"Belt knife":"벨트 나이프","Dagger":"단검","Pilgrim badge":"순례 배지","Velvet purse":"벨벳 파우치",
"Coral rosary":"산호 로사리오","Livery badge":"리버리 배지","Gauntlet gloves":"건틀릿 장갑","Embroidered handkerchief":"자수 손수건",
"Zibellino":"지벨리노","Girdle mirror":"허리 거울","Vizard mask":"비자드 마스크","Court sword":"궁정 검",
"Lace handkerchief":"레이스 손수건","Fur muff":"모피 머프","Loo mask":"루 마스크","Snuff box":"코담배갑",
"Silk mitts":"실크 미츠","Chatelaine":"샤틀렌","Bodice posy":"보디스 꽃다발","Riding crop":"승마채",
"Folding fan":"쥘부채","Swansdown tippet":"백조털 티핏","Round spectacles":"둥근 안경","Posy holder":"포지 홀더",
"Vinaigrette":"비네그레트","Work bag":"워크백","Card case":"명함집","Opera glasses":"오페라글라스",
"Rolled umbrella":"말린 우산","Mourning brooch":"모닝 브로치","Stickpin":"스틱핀","Dorothy bag":"도로시 백",
"Fur stole":"모피 스톨","Motoring goggles":"드라이빙 고글","Beaded bag":"비즈 백","Ostrich fan":"타조깃 부채",
"Beaded clutch":"비즈 클러치","Stacked bangles":"뱅글 스택","Deco lorgnette":"데코 로르네트","Ebony cane":"흑단 케인",
"Bakelite bangles":"베이클라이트 뱅글","Round sunglasses":"라운드 선글라스","Wooden brooch":"우드 브로치","Gas mask box":"방독면 케이스",
"String bag":"망사 장바구니","Identity discs":"인식표","Charm bracelet":"참 브레이슬릿","Circle pin":"서클 핀",
"Neck scarf":"넥스카프","Disc earrings":"디스크 귀걸이","Chain shoulder bag":"체인 숄더백","Chain belt":"체인 벨트",
"Cotehardie":"코트아르디","Houppelande":"우플랑드","Doublet + hose":"더블릿 + 호스",
"Burgundian gown":"부르고뉴 가운","Banded gown":"벨벳 밴드 가운","Pleated doublet":"플리티드 더블릿","Long gown":"롱 가운",
"Court gown":"궁정 가운","Open gown":"오픈 가운","Peascod doublet":"피스코드 더블릿","Jerkin + venetians":"저킨 + 베네치안",
"Mantua":"만투아","Satin gown":"새틴 가운","Petticoat breeches":"페티코트 브리치즈","Justaucorps":"쥐스토코르",
"Robe à la française":"로브 아 라 프랑세즈","Robe à l’anglaise":"로브 아 랑글레즈","Robe à la polonaise":"로브 아 라 폴로네즈",
"Habit à la française":"아비 아 라 프랑세즈","Frock coat":"프록코트","Chemise à la reine":"슈미즈 아 라 렌",
"Late robe à l’anglaise":"후기 로브 아 랑글레즈","Redingote gown":"르댕고트 가운","High-collar coat":"하이칼라 코트",
"Empire gown":"엠파이어 가운","Evening gown":"이브닝 가운","Tailcoat + pantaloons":"테일코트 + 판탈롱","Day coat":"데이 코트",
"Gigot day dress":"지고 데이 드레스","Evening dress":"이브닝 드레스","Nipped tailcoat":"허리 잘록한 테일코트",
"Pagoda-sleeve dress":"파고다 슬리브 드레스","Flounced ball gown":"플라운스 볼가운","Basque bodice + skirt":"바스크 보디스 + 스커트",
"Sack suit":"색 슈트","Cuirass bodice + skirt":"퀴라스 보디스 + 스커트","Polonaise overskirt":"폴로네즈 오버스커트",
"Ball gown":"볼가운","Morning coat":"모닝코트","Shirtwaist + gored skirt":"셔츠웨이스트 + 고어드 스커트",
"Leg-of-mutton dress":"지고 슬리브 드레스","Three-piece suit":"스리피스 슈트","Norfolk jacket":"노퍽 재킷",
"Ruff":"러프","Partlet":"파틀렛","Falling band":"폴링 밴드","Cravat":"크라바트","Stock":"스톡","Jabot":"자보",
"Fichu":"피슈","Buffon":"뷔퐁","High stock":"하이 스톡","Starched cravat":"스타치드 크라바트","Standing ruff":"스탠딩 러프",
"Pelerine collar":"펠러린 칼라","Stiff stock":"스티프 스톡","Lace collar":"레이스 칼라","Narrow necktie":"내로 넥타이",
"Standing collar":"스탠딩 칼라","Ascot":"애스콧","Bow tie":"보타이","High boned collar":"하이 본드 칼라",
"Wing collar":"윙 칼라","Velvet neckband":"벨벳 넥밴드","Gorget":"고젯","Plain neckline":"기본 네크라인",
"Sideless surcoat":"사이드리스 서코트","Mantle":"맨틀","Fur-lined mantle":"모피 안감 맨틀","Ceremonial houppelande":"의례용 우플랑드",
"Ropa":"로파","Short cloak":"쇼트 클로크","Bertha collar":"베르타 칼라","Baldric":"발드릭",
"Pet-en-l’air":"페탕레르","Redingote":"르댕고트","Caraco":"카라코","Pierrot jacket":"피에로 재킷","Greatcoat":"그레이트코트",
"Spencer":"스펜서","Pelisse":"펠리스","Canezou":"카네주","Wide mantle":"와이드 맨틀","Caped coat":"케이프 코트",
"Paletot":"팔레토","Paisley shawl":"페이즐리 숄","Burnous cloak":"뷔르누 클로크","Dolman":"돌먼","Visite":"비지트",
"Inverness cape":"인버네스 케이프","Tailored jacket":"테일러드 재킷","High-collar cape":"하이칼라 케이프","Chesterfield":"체스터필드",
"Poulaines":"풀렌","Pattens":"패튼","Chopines":"쇼핀","Heeled mules":"힐드 뮬","Bucket-top boots":"버킷톱 부츠",
"Louis-heel shoes":"루이 힐 슈즈","Buckled shoes":"버클 슈즈","Flat slippers":"플랫 슬리퍼","Hessian boots":"헤센 부츠",
"Square-toed slippers":"스퀘어토 슬리퍼","Ankle boots":"앵클 부츠","Side-lace boots":"사이드레이스 부츠",
"Button boots":"버튼 부츠","Evening pumps":"이브닝 펌프스","High laced boots":"하이 레이스업 부츠","Oxford shoes":"옥스퍼드 슈즈",
"Hennin":"에냉","Horned headdress":"혼드 헤드드레스","Chaperon":"샤프롱","Circlet":"서클릿",
"Butterfly hennin":"버터플라이 에냉","Truncated hennin":"절두형 에냉","Escoffion":"에스코피옹","Bowl cut":"보울컷",
"French hood":"프렌치 후드","Attifet":"아티페","Flat cap":"플랫 캡","Cavalier hat":"카발리에 해트","Periwig":"페리위그",
"Ringlet dressing":"링렛 헤어","Pouf":"푸프","Mob cap":"몹 캡","Tricorne":"트라이콘","Tied wig":"백 위그",
"Picture hat":"픽처 해트","Hérisson":"에리송","Ribboned cap":"리본 캡","Round hat":"라운드 해트","Unpowdered hair":"내추럴 헤어",
"Turban":"터번","Poke bonnet":"포크 보닛","Beaver hat":"비버 해트","Apollo knot":"아폴로 노트",
"Wide bonnet":"와이드 보닛","Beret hat":"베레형 해트","Tall hat":"톨 해트","Spoon bonnet":"스푼 보닛","Snood":"스누드",
"Looped braids":"루프 브레이드","Stovepipe hat":"스토브파이프 해트","Perched hat":"퍼치드 해트","Lace veil":"레이스 베일",
"Top hat":"톱 해트","Bowler":"볼러","Pompadour":"퐁파두르","Wide straw hat":"와이드 스트로 해트","Boater":"보터","Homburg":"홈부르크",
"Girdle belt":"거들 벨트","Reliquary pendant":"성물함 펜던트","Dagged edges":"대그드 헴","High belt":"하이 벨트",
"Livery collar":"리버리 칼라","Slit hanging sleeve":"행잉 슬리브","Pomander":"포맨더","Slashing":"슬래싱",
"Rope of pearls":"롱 펄 네크리스","Rapier":"레이피어","Ribbon loops":"리본 루프","Pearl drops":"펄 드롭",
"Lace fan":"레이스 부채","Stomacher":"스토마커","Échelle":"에셸","Painted fan":"페인티드 팬","Beauty patch":"뷰티 패치",
"Fob watch":"포브 워치","Wide sash":"와이드 새시","Walking stick":"워킹 스틱","Striped silk":"스트라이프 실크",
"Opera gloves":"오페라 글러브","Reticule":"레티큘","Cashmere shawl":"캐시미어 숄","Quizzing glass":"퀴징 글라스",
"Lace mitts":"레이스 미트","Ribbon sash":"리본 새시","Seal fob":"실 포브","Cameo brooch":"카메오 브로치",
"Hair jewellery":"헤어 주얼리","Fringed parasol":"프린지 파라솔","Engageantes":"앙가장트","Jet jewellery":"제트 주얼리",
"Parasol":"파라솔","Walking cane":"워킹 케인","Watch chain":"워치 체인","Wide belt":"와이드 벨트",
"Lapel watch":"라펠 워치","Kid gloves":"키드 글러브","Monocle":"모노클",
"Doric peplos":"도리아식 페플로스","Ionic chiton":"이오니아식 키톤","Short chiton":"쇼트 키톤",
"Doric chiton":"도리아식 키톤","Exomis":"엑소미스","High-girdled chiton":"하이거들 키톤","Sleeved chiton":"슬리브 키톤",
"Military tunic":"군용 튜닉","Stola":"스톨라","Toga virilis":"토가 비릴리스","Tunica with clavi":"클라비 튜니카",
"Stola with instita":"인스티타 스톨라","Tunic with wide clavi":"광폭 클라비 튜닉","Dalmatica":"달마티카",
"Embroidered tunica":"자수 튜니카","Loros costume":"로로스 예복",
"Heavy wool fall":"무거운 울 드레이프","Dense pleating":"조밀한 주름","Crinkled pleating":"크링클 주름",
"Wet drapery":"웨트 드레이퍼리","High girdle":"하이 거들","Layered sheer drape":"레이어드 시어 드레이프",
"Deep diagonal folds":"대각 주름","Long overfold":"롱 오버폴드","Undraped simplicity":"단순 재단",
"Fluid silk fall":"실크 드레이프","Layered tunics":"레이어드 튜닉","Stiff silk":"경질 실크","Jewelled panels":"보석 패널",
"Bronze fibulae":"청동 피불라","Row of pins":"핀 배열","Shoulder brooches":"숄더 브로치","Sewn seam":"봉제 어깨",
"Jewelled clasps":"보석 클래스프","Herakles knot":"헤라클레스 매듭","Shoulder fibula":"숄더 피불라","Sewn":"봉제",
"Jewelled fibula":"보석 피불라","Round neckline":"라운드 네크라인","Maniakis collar":"마니아키스 칼라","Great fibula":"대형 피불라",
"Himation":"히마티온","Chlamys":"클라미스","Full himation":"풀 히마티온","Veiled himation":"베일 히마티온",
"Wrapped himation":"랩드 히마티온","Sheer mantle":"시어 맨틀","Palla":"팔라","Toga drape":"토가 드레이프",
"Fine palla":"고급 팔라","Toga picta":"토가 픽타","Paludamentum":"팔루다멘툼",
"Chlamys with tablion":"타블리온 클라미스","Maphorion":"마포리온",
"Bare feet":"맨발","Leather sandals":"가죽 샌들","Strapped sandals":"스트랩 샌들","Laced sandals":"레이스업 샌들",
"Soft boots":"소프트 부츠","Calcei":"칼케이","Soleae":"솔레아","Gilded sandals":"금박 샌들","Caligae":"칼리가",
"Purple slippers":"자주색 슬리퍼","Fillet":"필렛","Long braids":"롱 브레이드","Spiral curls":"스파이럴 컬",
"Sakkos":"사코스","Kekryphalos":"케크리팔로스","Laurel wreath":"월계관","Melon coiffure":"멜론 코이푸르",
"Stephane":"스테파네","Draped veil":"드레이프 베일","Centre-parted bun":"가르마 번","Vittae":"비타이","Cropped hair":"단발",
"Flavian curls":"플라비우스식 컬","Braided crown":"브레이드 크라운","Laurel crown":"금 월계관",
"Stemma":"스템마","Pearl headdress":"진주 헤드드레스","Silk veil":"실크 베일",
"Spiral armlet":"스파이럴 암릿","Geometric border":"기하 문양 보더","Zone belt":"조네 벨트","Crossed zone":"크로스 조네",
"Meander border":"메안더 보더","Gold earrings":"금 귀걸이","Snake armlet":"스네이크 암릿","Gold diadem":"금 디아뎀",
"Fringed hem":"프린지 헴","Under-bust cord":"언더버스트 코드","Signet ring":"인장 반지","Purple stripe":"자주색 스트라이프",
"Snake bracelet":"스네이크 브레이슬릿","Pearl earrings":"진주 귀걸이","Gold hairnet":"금 헤어넷",
"Pendilia":"펜딜리아","Gold thread work":"금사 자수","Enamel plaques":"에나멜 플라크",
"S-bend corset":"S벤드 코르셋","Bust ruffles":"버스트 러플","Flounced petticoat":"플라운스 페티코트",
"Longline corset":"롱라인 코르셋","Early brassiere":"초기 브래지어","Hobble band":"호블 밴드",
"Flattening bandeau":"플래트닝 반도","Light girdle":"라이트 거들","Garçonne line":"가르손 라인",
"Bias-cut line":"바이어스 컷 라인","Rounded brassiere":"라운드 브래지어","Girdle":"거들","Conical brassiere":"코니컬 브라",
"Shoulder pads":"숄더 패드","Waspie":"와스피","Bullet bra":"불릿 브라","Net petticoats":"네트 페티코트",
"Hip padding":"힙 패딩","Panty girdle":"팬티 거들","Unstructured line":"무구조 라인","Bouffant underskirt":"부팡 언더스커트",
"Lace blouse + gored skirt":"레이스 블라우스 + 고어드 스커트","Tea gown":"티 가운","Tailor-made suit":"테일러메이드 슈트",
"Hobble skirt dress":"호블 스커트 드레스","Tunic dress":"튜닉 드레스","Orientalist evening dress":"오리엔탈리즘 이브닝 드레스",
"Beaded evening dress":"비즈 이브닝 드레스","Day shift dress":"데이 시프트 드레스","Robe de style":"로브 드 스틸",
"Jersey two-piece":"저지 투피스","Oxford bags":"옥스퍼드 백스","Bias evening gown":"바이어스 이브닝 가운",
"Halter gown":"홀터 가운","Day dress":"데이 드레스","Drape-cut suit":"드레이프 컷 슈트",
"Utility suit":"유틸리티 슈트","Tea dress":"티 드레스","Shirtwaist dress":"셔츠웨이스트 드레스","Siren suit":"사이렌 슈트",
"Demob suit":"디모브 슈트","Service dress":"군복","New Look day dress":"뉴 룩 데이 드레스","Wiggle dress":"위글 드레스",
"Strapless ball gown":"스트랩리스 볼가운","Sack dress":"색 드레스","Grey flannel suit":"그레이 플란넬 슈트",
"A-line shift dress":"A라인 시프트 드레스","Boxy collarless suit":"박시 칼라리스 슈트","Column evening gown":"컬럼 이브닝 가운",
"Continental suit":"콘티넨탈 슈트","Cloche hat":"클로슈","Victory rolls":"빅토리 롤","Pillbox hat":"필박스",
"Bouffant beehive":"부팡 비하이브","Finger waves":"핑거 웨이브","Tilted beret":"틸티드 베레",
"Plumed picture hat":"플룸 픽처 해트","Lampshade hat":"램프셰이드 해트","Fedora":"페도라",
"Fontange":"퐁탕주","Lace cap":"레이스 캡","Dormeuse cap":"도르뫼즈 캡","Bicorne":"바이콘",
"Felt cap":"펠트 캡","Coif":"코이프","Tricorne":"트라이콘","Lace day cap":"레이스 데이 캡",
"Travelling cap":"트래블링 캡","Petasos":"페타소스","Pilos":"필로스","Kausia":"카우시아",
"Veiled toga":"카피테 벨라토","Palla veil":"팔라 베일","Gold net cap":"금망 캡","Jewelled diadem":"보석 디아뎀",
"Veil":"베일","Chiffon head scarf":"시폰 헤드스카프","Mourning bracelet":"모닝 브레이슬릿",
"Standing shirt collar":"스탠딩 셔츠 칼라","Open neckline":"오픈 네크라인","Boutonnière":"부토니에",
"Pocket square":"포켓 스퀘어","Cigarette case":"시가렛 케이스","Wristwatch":"손목시계","Tie clip":"타이 클립",
"Cufflinks":"커프스","Ribbon bar":"약장","Leather gloves":"가죽 장갑","Trilby":"트릴비","Tie bar":"타이 바",
"Sunglasses":"선글라스","Slim tie clip":"슬림 타이 클립","Square sunglasses":"스퀘어 선글라스",
"Slim trilby":"슬림 트릴비","Spats":"스패츠","Spectator shoes":"스펙테이터 슈즈","Service boots":"서비스 부츠",
"Chelsea boots":"첼시 부츠","Flat cap":"플랫 캡",
"Krepides":"크레피데스","Persikai":"페르시카이","Endromides":"엔드로미데스","Soft shoes":"소프트 슈즈","Carbatinae":"카르바티나이","Socci":"소키","Campagi":"캄파기","Sandals":"샌들","Tzangia":"창기아","Turnshoes":"턴슈즈","Velvet slippers":"벨벳 슬리퍼","Pantofles":"판토플","Embroidered shoes":"자수 구두","Latchet shoes":"래칫 슈즈","Square-toed shoes":"스퀘어토 슈즈","Red-heeled shoes":"레드힐 슈즈","Mules":"뮬","Embroidered slippers":"자수 슬리퍼","Court pumps":"코트 펌프스","Ribbon sandals":"리본 샌들","Pumps":"펌프스","Half boots":"하프 부츠","Sandal slippers":"샌들 슬리퍼","Top boots":"탑 부츠","Wellington boots":"웰링턴 부츠","Balmoral boots":"발모럴 부츠","Elastic-sided boots":"엘라스틱 사이드 부츠","Cloth-top boots":"클로스톱 부츠","Louis-heel pumps":"루이 힐 펌프스","Patent pumps":"페이턴트 펌프스","Beaded evening slippers":"비즈 이브닝 슬리퍼","Tango shoes":"탱고 슈즈","Mary Janes":"메리 제인","Slingbacks":"슬링백","Court shoes":"코트 슈즈","Platform shoes":"플랫폼 슈즈","Peep-toe pumps":"피프토 펌프스","Penny loafers":"페니 로퍼","Crepe-soled shoes":"크레이프솔 슈즈","Go-go boots":"고고 부츠","Winklepickers":"윙클피커","Desert boots":"데저트 부츠",
"Fanged jaw mask":"이빨 턱 가면","Horned goat skull mask":"뿔 달린 염소 두개골 가면","Wolf skull mask":"늑대 두개골 가면",
"Pleated linen shirt":"주름 리넨 셔츠","Blackwork shirt":"블랙워크 자수 셔츠","Lace-cuffed shirt":"레이스 커프 셔츠","Ruffled-cuff shirt":"러플 커프 셔츠","Ruffled-front shirt":"러플 프론트 셔츠","High-collar shirt":"하이칼라 셔츠","Pleated-bosom shirt":"주름 가슴판 셔츠","Stiff-front shirt":"빳빳한 앞판 셔츠","Starched-front shirt":"풀 먹인 앞판 셔츠","Starched white shirt":"풀 먹인 흰 셔츠","Soft-collar shirt":"소프트 칼라 셔츠","Club-collar shirt":"클럽 칼라 셔츠","Pointed-collar shirt":"포인티드 칼라 셔츠","Cotton shirt":"면 셔츠","Crisp white shirt":"빳빳한 흰 셔츠","Slim shirt":"슬림 셔츠","White kid gloves":"흰 키드 장갑","Tan gloves":"연갈색 장갑","Black lace gloves":"검은 레이스 장갑","Grey gloves":"회색 장갑","Lace gloves":"레이스 장갑","Fabric gloves":"천 장갑","Crochet gloves":"코바늘 장갑","Black gloves":"검은 장갑",
"Boots with gaiters":"게이터 부츠"
};

const rosetteTranslations={
  periods:{
    "baroque":"17세기 바로크",
    "burgundian":"15세기 부르고뉴",
    "bustle":"1870–80년대 버슬",
    "crinoline":"1850–60년대 크리놀린",
    "gibson":"1890년대 깁슨",
    "gothic":"14세기 고딕",
    "regency":"리젠시 / 엠파이어",
    "renaissance":"16세기 튜더 / 엘리자베스",
    "rococo":"18세기 로코코",
    "romantic":"1830년대 로맨틱",
    "transitional":"1780년대 과도기",
},
  items:{
    "ankle-boots-ro":"앵클 부츠",
    "ascot":"애스콧",
    "attifet":"아티페",
    "baldric":"발드릭",
    "ball-gown-v":"볼가운",
    "basque-bodice":"바스크 보디스 + 스커트",
    "beret-hat":"베레형 해트",
    "bicorne":"바이콘",
    "boater":"보터",
    "boned-collar":"하이 본드 칼라",
    "bow-tie":"보타이",
    "bow-tie-g":"보타이",
    "bowler":"볼러",
    "bowler-cr":"볼러",
    "braies":"브레 + 셔츠",
    "bucket-boots":"버킷톱 부츠",
    "buckled-shoes":"버클 슈즈",
    "buffon":"뷔퐁",
    "burg-gown":"부르고뉴 가운",
    "burnous":"뷔르누 클로크",
    "bustle-shelf":"셸프 버슬",
    "bustle-soft":"소프트 버슬",
    "butterfly":"버터플라이 에냉",
    "button-boots":"버튼 부츠",
    "cage-crinoline":"케이지 크리놀린",
    "cameo":"카메오 브로치",
    "cameo-cr":"카메오 브로치",
    "cane":"워킹 케인",
    "cane-g":"워킹 케인",
    "canezou":"카네주",
    "caped-coat-ro":"케이프 코트",
    "caraco":"카라코",
    "cashmere-shawl":"캐시미어 숄",
    "cavalier-hat":"카발리에 해트",
    "chaperon":"샤프롱",
    "chemise":"슈미즈",
    "chemise-b":"슈미즈",
    "chemise-cr":"슈미즈 + 드로어즈",
    "chemise-reine":"슈미즈 아 라 렌",
    "chesterfield":"체스터필드",
    "chesterfield-cr":"체스터필드",
    "chopines":"쇼핀",
    "circlet":"서클릿",
    "coif-b":"코이프",
    "combinations":"콤비네이션",
    "combinations-g":"콤비네이션",
    "corded-corset":"코디드 코르셋",
    "corset-cr":"본드 코르셋",
    "corset-v":"스푼 버스크 코르셋",
    "cotehardie":"코트아르디",
    "court-gown":"궁정 가운",
    "court-panniers":"궁정 파니에",
    "cravat":"크라바트",
    "cuirass":"퀴라스 보디스 + 스커트",
    "dagged":"대그드 헴",
    "day-cap-ro":"레이스 데이 캡",
    "day-coat":"데이 코트",
    "dolman":"돌먼",
    "dormeuse":"도르뫼즈 캡",
    "doublet-hose":"더블릿 + 호스",
    "echelle":"에셸",
    "elliptical":"엘립티컬 크리놀린",
    "empire-gown":"엠파이어 가운",
    "escoffion":"에스코피옹",
    "evening-90s":"이브닝 가운",
    "evening-bertha":"이브닝 드레스",
    "evening-empire":"이브닝 가운",
    "evening-pumps":"이브닝 펌프스",
    "falling-b":"폴링 밴드",
    "falling-band":"폴링 밴드",
    "false-rump":"폴스 럼프",
    "farthingale":"스페인 파딩게일",
    "felt-cap-b":"펠트 캡",
    "fichu":"피슈",
    "flat-cap":"플랫 캡",
    "flat-slippers":"플랫 슬리퍼",
    "flat-slippers-cr":"플랫 슬리퍼",
    "flounced-ball":"플라운스 볼가운",
    "fontange":"퐁탕주",
    "francaise":"로브 아 라 프랑세즈",
    "french-hood":"프렌치 후드",
    "frock-cr":"프록코트",
    "frock-early":"프록코트",
    "frock-ro":"프록코트",
    "frock-v":"프록코트",
    "fur-mantle":"모피 안감 맨틀",
    "gigot-90s":"지고 슬리브 드레스",
    "gigot-dress":"지고 데이 드레스",
    "girdle":"거들 벨트",
    "gorget":"고젯",
    "greatcoat":"그레이트코트",
    "greatcoat-t":"그레이트코트",
    "habit-a-la":"아비 아 라 프랑세즈",
    "heeled-mules":"힐드 뮬",
    "hennin":"에냉",
    "hessians":"헤센 부츠",
    "high-collar":"스탠딩 칼라",
    "high-collar-cape":"하이칼라 케이프",
    "high-collar-coat":"하이칼라 코트",
    "high-stock":"하이 스톡",
    "hip-pads":"힙 패드",
    "homburg":"홈부르크",
    "horned":"혼드 헤드드레스",
    "houppelande-cer":"의례용 우플랑드",
    "houppelande-f":"우플랑드",
    "houppelande-m":"우플랑드",
    "hourglass-corset":"아워글라스 코르셋",
    "huge-bonnet":"와이드 보닛",
    "inverness":"인버네스 케이프",
    "inverness-cr":"인버네스 케이프",
    "jabot":"자보",
    "jerkin-set":"저킨 + 베네치안",
    "jet-jewels":"제트 주얼리",
    "justaucorps":"쥐스토코르",
    "kid-gloves":"키드 글러브",
    "kirtle-high":"하이웨이스트 커틀",
    "lace-bertha":"베르타 칼라",
    "lace-cap-b":"레이스 캡",
    "lace-collar-cr":"레이스 칼라",
    "lace-fan":"레이스 부채",
    "lace-veil":"레이스 베일",
    "laced-boots-g":"하이 레이스업 부츠",
    "laced-kirtle":"레이스업 커틀",
    "lapel-watch":"라펠 워치",
    "livery-collar":"리버리 칼라",
    "long-gloves":"오페라 글러브",
    "long-gown-m":"롱 가운",
    "louis-heels":"루이 힐 슈즈",
    "lounge-suit":"스리피스 슈트",
    "mahoitres":"마우아트르",
    "mantle":"맨틀",
    "mantua":"만투아",
    "mitts":"레이스 미트",
    "mob-cap":"몹 캡",
    "monocle":"모노클",
    "morning-coat":"모닝코트",
    "mourning-bracelet":"모닝 브레이슬릿",
    "narrow-belt":"하이 벨트",
    "narrow-tie":"내로 넥타이",
    "nipped-tailcoat":"허리 잘록한 테일코트",
    "none-e":"무구조",
    "none-g":"없음",
    "norfolk":"노퍽 재킷",
    "open-gown":"오픈 가운",
    "open-neck-b":"오픈 네크라인",
    "oxfords":"옥스퍼드 슈즈",
    "pagoda-dress":"파고다 슬리브 드레스",
    "paisley-shawl":"페이즐리 숄",
    "paletot":"팔레토",
    "panniers":"파니에",
    "parasol":"파라솔",
    "parasol-cr":"프린지 파라솔",
    "partlet":"파틀렛",
    "partlet-b":"파틀렛",
    "pattens":"패튼",
    "pearl-drop":"펄 드롭",
    "peascod":"피스코드 더블릿",
    "pelerine-collar":"펠러린 칼라",
    "pelisse":"펠리스",
    "petticoat-br":"페티코트 브리치즈",
    "petticoat-stack":"레이어드 페티코트",
    "picture-hat":"픽처 해트",
    "pierrot":"피에로 재킷",
    "plain-n":"기본 네크라인",
    "pleated-doublet":"플리티드 더블릿",
    "pocket-watch":"포브 워치",
    "poke-bonnet":"포크 보닛",
    "polonaise":"로브 아 라 폴로네즈",
    "polonaise-v":"폴로네즈 오버스커트",
    "pomander":"포맨더",
    "poulaines":"풀렌",
    "poulaines-b":"풀렌",
    "quizzing":"퀴징 글라스",
    "rapier":"레이피어",
    "redingote":"르댕고트",
    "redingote-gown":"르댕고트 가운",
    "reliquary":"성물함 펜던트",
    "reticule":"레티큘",
    "reticule-ro":"레티큘",
    "ribbon-cap":"리본 캡",
    "ribbon-loops":"리본 루프",
    "ribbon-sash-ro":"리본 새시",
    "ropa":"로파",
    "rope-pearls":"롱 펄 네크리스",
    "round-hat":"라운드 해트",
    "ruff":"러프",
    "ruff-collar":"스탠딩 러프",
    "sack-suit":"색 슈트",
    "satin-gown":"새틴 가운",
    "seal-fob":"실 포브",
    "shift-b":"시프트",
    "shift-e":"슈미즈",
    "shift-r":"시프트",
    "shift-ro":"슈미즈",
    "shift-t":"시프트",
    "shirt-b":"주름 리넨 셔츠",
    "shirt-ba":"레이스 커프 셔츠",
    "shirt-bu":"풀 먹인 앞판 셔츠",
    "shirt-collar-b":"스탠딩 셔츠 칼라",
    "shirt-cr":"빳빳한 앞판 셔츠",
    "shirt-e":"하이칼라 셔츠",
    "shirt-g":"풀 먹인 흰 셔츠",
    "shirt-r":"블랙워크 자수 셔츠",
    "shirt-ro2":"러플 커프 셔츠",
    "shirt-rom":"주름 가슴판 셔츠",
    "shirt-t":"러플 프론트 셔츠",
    "shirtwaist":"셔츠웨이스트 + 고어드 스커트",
    "short-cloak":"쇼트 클로크",
    "short-stays":"쇼트 스테이즈",
    "side-lace":"사이드레이스 부츠",
    "silk-fan":"페인티드 팬",
    "slashing":"슬래싱",
    "sleeve-plumpers":"슬리브 플럼퍼",
    "sleeve-supports":"슬리브 서포트",
    "slit-sleeve":"행잉 슬리브",
    "smock":"스목",
    "snood":"스누드",
    "soft-boots":"소프트 부츠",
    "soft-stays":"소프트 스테이즈",
    "spencer":"스펜서",
    "spoon-bonnet":"스푼 보닛",
    "square-slippers":"스퀘어토 슬리퍼",
    "stays-cone":"원뿔형 스테이즈",
    "stays-r":"보디드 스테이즈",
    "stays-trans":"과도기 스테이즈",
    "stiff-stock":"스티프 스톡",
    "stock":"스톡",
    "stomacher":"스토마커",
    "stovepipe":"스토브파이프 해트",
    "striped-silk":"스트라이프 실크",
    "surcoat":"사이드리스 서코트",
    "tailcoat":"테일코트 + 판탈롱",
    "tailored-jacket":"테일러드 재킷",
    "tall-hat-ro":"톨 해트",
    "tied-cravat":"스타치드 크라바트",
    "tiny-hat":"퍼치드 해트",
    "top-hat":"톱 해트",
    "top-hat-early":"비버 해트",
    "travel-cap-ro":"트래블링 캡",
    "tricorne":"트라이콘",
    "tricorne-tr":"트라이콘",
    "truncated":"절두형 에냉",
    "turban":"터번",
    "undersleeves":"앙가장트",
    "velvet-band":"벨벳 밴드 가운",
    "velvet-neckband":"벨벳 넥밴드",
    "visite":"비지트",
    "walking-stick":"워킹 스틱",
    "watch-chain":"워치 체인",
    "wheel-farth":"휠 파딩게일",
    "wide-belt":"와이드 벨트",
    "wide-mantle":"와이드 맨틀",
    "wide-sash":"와이드 새시",
    "wide-straw":"와이드 스트로 해트",
    "wing-collar":"윙 칼라",
}
};

/* Prompt Archive — engine
 * 에디션에 의존하지 않는 생성/필터 로직.
 * UI 는 셀렉트를 채우고(slotOptions) 고른 값으로 조합한다(composeFrom).
 */

const SLOT_ORDER = ['foundation','structure','garment','neckwear','outer','footwear','headwear'];
const GENDERS = ['feminine','masculine','neutral'];
const GENDER_CODE = { feminine:'f', masculine:'m', neutral:'u' };
const FIDELITY = { Historical:0, Romanticized:1, Fantasy:2, Otherworldly:3 };

const rand = a => a[Math.floor(Math.random()*a.length)];
function sample(arr,n){
  const p=arr.slice(), out=[];
  while(out.length<n && p.length) out.push(p.splice(Math.floor(Math.random()*p.length),1)[0]);
  return out;
}

function genderOk(it,g){
  const t=it.g||'u';
  if(t==='u'||g==='neutral') return true;
  return g==='feminine' ? t==='f' : t==='m';
}
const fantasyOk=(it,lv)=>(it.f||0)<=lv;

function compatible(it,chosen){
  /* 주 의복–넥웨어 궁합. 가먼트의 neckline ('low' 오프숄더·데콜테 / 'high' 자체 하이칼라 / 'own' 자체 네크라인)
   * 과 넥웨어의 avoidNeck 이 겹치면 셔플에서 매칭하지 않는다. 드롭다운 수동 선택은 막지 않는다. */
  if(it.avoidNeck && chosen.garment?.neckline && it.avoidNeck.includes(chosen.garment.neckline)) return false;
  /* 가면(secondary) 은 베일·만틸라 머리장식과 겹치지 않는다 — 얼굴에 둘. */
  if(it.secondary && chosen.headwear && /\b(veil|mantilla)\b/i.test(chosen.headwear.p||'')) return false;
  /* 주 의복–신발 궁합. 이브닝·볼·궁정 가운(noBoots)에는 부츠를 신기지 않는다. 슬리퍼·펌프스·샌들만. */
  if(chosen.garment?.noBoots && /\bboots?\b/i.test(it.p||'')) return false;
  if(it.needs) for(const [s,ids] of Object.entries(it.needs)){
    if(!chosen[s]||!ids.includes(chosen[s].id)) return false;
  }
  if(it.avoid) for(const [s,ids] of Object.entries(it.avoid)){
    if(chosen[s]&&ids.includes(chosen[s].id)) return false;
  }
  return true;
}

/* 판타지 레벨에 따른 시대 혼합 범위.
 * period.mix 가 있으면 그 목록을 그대로 쓴다 (Fantasy Index 용).
 */
function allowedPeriods(edition, periodId, level){
  const ps = edition.periods;
  const i = Math.max(0, ps.findIndex(p=>p.id===periodId));
  const cur = ps[i];
  if(cur && cur.mix){
    return cur.mix==='*' ? ps : ps.filter(p=>cur.mix.includes(p.id));
  }
  if(level>=3) return ps;
  if(level>=2) return ps.filter((_,j)=>Math.abs(j-i)<=1);
  return [cur];
}

/* 셀렉트에 넣을 후보 목록 */
function slotOptions(edition, slot, state){
  const lv = FIDELITY[state.fidelity] ?? 0;
  const periods = allowedPeriods(edition, state.periodId, lv);
  /* 현재 시대를 먼저 — 시대가 합쳐질 때(판타지 이상·Fantasy Index) 현재 시대 항목이 위에 오고,
   * 다른 시대의 '같은 프롬프트' 항목(시대마다 복제된 가면·샌들·슈미즈 등)은 중복으로 걸러진다.
   * 현재 시대 항목은 레시피가 id 로 참조하므로 절대 거르지 않는다. */
  const cur = periods.find(p=>p.id===state.periodId);
  const ordered = cur ? [cur, ...periods.filter(p=>p!==cur)] : periods;
  const seen = new Set(), seenPrompt = new Set(), out = [];
  for(const p of ordered){
    const foreign = p!==cur;
    for(const it of (p.slots?.[slot]||[])){
      if(!genderOk(it,state.gender)) continue;
      if(!fantasyOk(it,lv)) continue;
      /* 시대착오 차단 — 20세기 기술 물품(선글라스·손목시계·방독면 케이스 등)은
       * 교차 시대 뷰로 새어 나가지 않는다. Fantasy Index 는 pseudo-period 라
       * 레시피가 없고, 따라서 슬롯 화이트리스트도 없다. */
      if(it.strict && edition.id === 'fantasy') continue;
      if(it.cat && typeof catsOff!=='undefined' && catsOff.has(it.cat)) continue;
      if(seen.has(it.id)) continue;
      if(foreign && (!it.p || seenPrompt.has(it.p))) continue;
      seen.add(it.id); if(it.p) seenPrompt.add(it.p);
      out.push({ ...it, periodId:p.id });
    }
  }
  return out;
}

function schemaFor(edition,gender){
  return edition.schemas[gender] || edition.schemas.feminine;
}

function detailTags(d){
  if(d==='Medium') return ['detailed clothing'];
  if(d==='Max') return ['highly detailed clothing'];
  return [];
}

/* 고른 아이템 id 로 프롬프트를 만든다.
 * picked : { slot: itemId }  |  accessories 는 배열 허용
 */
function composeFrom(edition, state, picked){
  const lv = FIDELITY[state.fidelity] ?? 0;
  const period = edition.periods.find(p=>p.id===state.periodId) || edition.periods[0];
  const schema = schemaFor(edition, state.gender);

  const lookup=(slot,id)=>slotOptions(edition,slot,state).find(o=>o.id===id);

  const body=[];
  for(const slot of SLOT_ORDER){
    if(!schema.includes(slot)) continue;
    const it = lookup(slot, picked[slot]);
    if(it && it.p) body.push(it.p);
  }

  const accIds = [].concat(picked.accessories||[]);
  const accs = accIds.map(id=>lookup('accessories',id)).filter(Boolean).map(a=>a.p);

  /* 갈니시(로맨틱·판타지·이세계 풀)는 더 이상 몰래 붙이지 않는다 — OTHER 칸에 보이게 채워진다 (state.extraTags). */
  const overlay=[];

  const tokens=[
    state.color ? `outfit color: ${state.color}` : '',
    period.tag,
    ...body,
    ...accs,
    ...overlay,
    ...(state.extraTags||[]),
    ...detailTags(state.detail),
  ].filter(Boolean);
  /* 같은 토큰이 두 번 들어가지 않게 (2004 의 uniq 와 같은 처리) */
  const seenTok=new Set();
  const dedup=tokens.filter(t=>{const k=t.trim().toLowerCase();if(seenTok.has(k))return false;seenTok.add(k);return true;});
  tokens.length=0;tokens.push(...dedup);

  return {
    callNo:`${edition.volume} · ${period.callNo}`,
    period,
    prompt: tokens.join(', '),
  };
}

/* 잠기지 않은 슬롯만 무작위로 다시 고른다.
 * Recipe가 있는 시대는 MAIN GARMENT를 골격으로 삼고, 호환되는 슬롯만 뽑는다.
 * Recipe가 없는 데이터(현재 Modern 등)는 기존 호환 필터를 fallback으로 사용한다.
 */
function weightedPick(items){
  if(!items?.length) return null;
  const total=items.reduce((sum,item)=>sum+(item.weight??1),0);
  let n=Math.random()*total;
  for(const item of items){
    n-=(item.weight??1);
    if(n<=0) return item;
  }
  return items[items.length-1];
}

function featureSet(item){
  return new Set([...(item?.tags||[]),...(item?.adds||[])]);
}

function overlapsFeature(item,active){
  return (item?.adds||[]).some(tag=>active.has(tag));
}

function recipeCandidates(period,state){
  const genderCode=GENDER_CODE[state.gender]||'u';
  const lv=FIDELITY[state.fidelity]??0;
  const off=typeof catsOff!=='undefined'?catsOff:new Set();
  const gcat=id=>(period.slots?.garment||[]).find(i=>i.id===id)?.cat;
  return (period.recipes||[]).filter(r=>
    (!r.g || r.g==='u' || genderCode==='u' || r.g===genderCode) &&
    (r.f??0)<=lv &&
    !(off.size && r.garment && r.garment.length && r.garment.every(id=>off.has(gcat(id)||'')))
  );
}

function constrainedPool(edition,slot,state,recipe,chosen,activeFeatures){
  let pool=slotOptionsRoll(edition,slot,state).filter(it=>compatible(it,chosen));
  if(recipe && recipe._civil) pool=pool.filter(it=>!MILITARY.has(it.cat));
  if(recipe && Object.prototype.hasOwnProperty.call(recipe,slot)){
    const allow=recipe[slot]||[];
    if(!allow.length) return [];
    const ids=new Set(allow);
    pool=pool.filter(it=>ids.has(it.id));
  }
  if(edition.selectionRules?.suppressDuplicateFeatures){
    const clean=pool.filter(it=>!overlapsFeature(it,activeFeatures));
    if(clean.length) pool=clean;
  }
  return pool;
}

function rollPicks(edition, state, locks={}, previous={}){
  const period=edition.periods.find(p=>p.id===state.periodId)||edition.periods[0];
  let recipe=weightedPick(recipeCandidates(period,state));
  /* Fantasy Index(레시피 없음) + '어울리는 것끼리' ON — 섞는 시대 중 하나를 앵커로 뽑아 그 시대 레시피로
   * 실루엣 핵심(가먼트·구조·넥웨어·기초)을 맞추고, 겉옷·머리장식·신발·액세서리만 시대를 넘나든다. */
  if(!recipe && period.mix && (typeof coherentMix==='undefined'||coherentMix)){
    const lv=FIDELITY[state.fidelity]??0;
    const reals=allowedPeriods(edition,period.id,lv).filter(p=>!p.mix&&(p.recipes||[]).length);
    const anchor=rand(reals);
    const base=anchor&&weightedPick(recipeCandidates(anchor,state));
    if(base){
      recipe={...base}; ['outer','headwear','footwear','accessories','maxAccessories','maxDecorativeSlots'].forEach(k=>delete recipe[k]);
      /* 앵커가 민간복이면 자유 슬롯(겉옷·머리장식·신발·액세서리)에서 갑옷·군복·무기를 뺀다 — 드레스에 투구가 얹히지 않게 */
      const gcat=id=>(anchor.slots?.garment||[]).find(i=>i.id===id)?.cat;
      recipe._civil=!(base.garment||[]).some(id=>MILITARY.has(gcat(id)));
    }
  }
  /* 중성은 남녀 항목을 전부 허용하므로 그대로 두면 셔츠 바슴(남)과 가운(여)이 한 벌에 섞인다.
   * 레시피가 성별을 가지면 그 성별로 한 벌을 맞춘다 — '무작위 성별, 일관된 한 벌'. */
  if(state.gender==='neutral' && recipe && (recipe.g==='f'||recipe.g==='m')){
    state={...state, gender: recipe.g==='f'?'feminine':'masculine'};
  }else if(state.gender==='neutral'){
    /* 남녀 공용 레시피(또는 레시피 없음)라도 한 벌 안에서는 성별을 하나로 — 여성풍 키톤에 남성 부츠가 붙던 원인 */
    state={...state, gender: Math.random()<0.5?'feminine':'masculine'};
  }
  const schema=schemaFor(edition,state.gender);
  const chosen={}, picks={};
  const activeFeatures=new Set();

  const commit=(slot,it)=>{
    if(!it) return;
    picks[slot]=it.id;
    chosen[slot]=it;
    featureSet(it).forEach(tag=>activeFeatures.add(tag));
  };

  // Locks always win when they are still valid. None 으로 잠근 슬롯은 비워 둔다.
  const heldEmpty=new Set();
  for(const slot of SLOT_ORDER){
    if(!schema.includes(slot) || !locks[slot]) continue;
    if(previous[slot]==='' && slot!=='garment'){ heldEmpty.add(slot); continue; }
    if(Array.isArray(previous[slot])) continue;
    if(!previous[slot]) continue;
    const prevId=Array.isArray(previous[slot])?previous[slot][0]:previous[slot];
    const pool=slotOptions(edition,slot,state);
    const it=pool.find(o=>o.id===prevId);
    if(it) commit(slot,it);
  }

  // Main garment anchors the outfit.
  if(schema.includes('garment') && !picks.garment){
    let pool=constrainedPool(edition,'garment',state,recipe,chosen,activeFeatures);
    if(!pool.length) pool=slotOptionsRoll(edition,'garment',state).filter(it=>compatible(it,chosen));
    if(!pool.length) pool=slotOptions(edition,'garment',state).filter(it=>compatible(it,chosen));
    commit('garment',rand(pool));
  }

  const rules=edition.selectionRules||{};
  const core=['foundation','structure','neckwear','footwear'];
  for(const slot of core){
    if(!schema.includes(slot) || picks[slot] || heldEmpty.has(slot)) continue;
    const chance=rules.slotChance?.[slot]??1;
    if(Math.random()>chance) continue;
    let pool=constrainedPool(edition,slot,state,recipe,chosen,activeFeatures);
    if(!pool.length && !(recipe && Object.prototype.hasOwnProperty.call(recipe,slot))){
      pool=slotOptionsRoll(edition,slot,state).filter(it=>compatible(it,chosen));
    }
    commit(slot,rand(pool));
  }

  const decorative=['outer','headwear'];
  let decorativeCount=0;
  const maxDecorative=recipe?.maxDecorativeSlots??rules.maxDecorativeSlots??3;
  for(const slot of decorative){
    if(!schema.includes(slot) || picks[slot] || heldEmpty.has(slot)) continue;
    if(decorativeCount>=maxDecorative) continue;
    const chance=rules.slotChance?.[slot]??1;
    if(Math.random()>chance) continue;
    let pool=constrainedPool(edition,slot,state,recipe,chosen,activeFeatures);
    if(!pool.length && !(recipe && Object.prototype.hasOwnProperty.call(recipe,slot))){
      pool=slotOptionsRoll(edition,slot,state).filter(it=>compatible(it,chosen));
    }
    const it=rand(pool);
    if(it){ commit(slot,it); decorativeCount++; }
  }

  /* 액세서리 — 배열. 첫 개는 가면류(secondary) 제외, 디테일 보통/최대면 둘째를 더 뽑는다.
   * 둘째는 고증 판타지 이상에서만 가면이 후보가 되고 그때도 20% 로 누른다. */
  if(schema.includes('accessories')){
    if(locks.accessories && Array.isArray(previous.accessories)){
      picks.accessories=[...previous.accessories];
    }else{
      picks.accessories=[];
      const chance=rules.slotChance?.accessories??0.9;
      const maxAccessories=recipe?.maxAccessories??1;
      const basePool=()=>{
        let pool=constrainedPool(edition,'accessories',state,recipe,chosen,activeFeatures);
        if(!pool.length && !(recipe && Object.prototype.hasOwnProperty.call(recipe,'accessories'))){
          pool=slotOptionsRoll(edition,'accessories',state).filter(it=>compatible(it,chosen));
        }
        return pool;
      };
      if(maxAccessories>0 && Math.random()<=chance && decorativeCount<maxDecorative){
        const it=rand(basePool().filter(it=>!it.secondary));
        if(it) picks.accessories.push(it.id);
      }
      const wantExtra=state.detail==='Medium'||state.detail==='Max';
      if(wantExtra){
        const taken=new Set(picks.accessories);
        /* 같은 부위·같은 손을 쓰는 액세서리는 둘째로 뽑지 않는다 — 장갑+미트, 부채+부채, 지팡이+파라솔, 시계+시계, 파이프+시가 */
        const region=it=>{const t=(it.t+" "+it.p).toLowerCase();
          if(/glove|mitt|gauntlet/.test(t))return "hands";if(/fan\b/.test(t))return "fan";if(/cane|stick|umbrella|parasol|staff|crop|scepter|sceptre|orb\b/.test(t))return "held";
          if(/watch/.test(t))return "watch";if(/pipe|cigar|cigarette/.test(t))return "smoke";if(/mask/.test(t))return "mask";if(/muff/.test(t))return "hands";
          if(/necklace|pendant|choker|chain at the throat|brooch at the throat|collar/.test(t))return "neck";if(/bag|purse|reticule|pouch|case\b/.test(t))return "bag";return null;};
        const firstRegions=new Set(picks.accessories.map(id=>{const it=slotOptions(edition,'accessories',state).find(x=>x.id===id);return it?region(it):null;}).filter(Boolean));
        let pool=basePool().filter(it=>!taken.has(it.id)&&!(region(it)&&firstRegions.has(region(it))));
        if(!pool.length) pool=slotOptionsRoll(edition,'accessories',state).filter(it=>!taken.has(it.id));
        const sec=pool.filter(it=>it.secondary), reg=pool.filter(it=>!it.secondary);
        const it=(sec.length && (!reg.length || Math.random()<0.2)) ? rand(sec) : rand(reg.length?reg:pool);
        if(it) picks.accessories.push(it.id);
      }
    }
  }

  return picks;
}

/* 여성복/남성복 한 쌍을 같은 시대·색으로 */
function rollPair(edition, state){
  return {
    feminine: rollPicks(edition,{...state,gender:'feminine'}),
    masculine: rollPicks(edition,{...state,gender:'masculine'}),
  };
}

/* Fantasy Index — 세 에디션을 하나로 합치고 교차 조합 시대를 얹는다 */
function buildCrossEdition(editions, combos){
  const periods = editions.flatMap(e=>e.periods.map(p=>({...p, _from:e.id})));
  const pools = {
    colors:[...new Set(editions.flatMap(e=>e.pools.colors))],
    colorsFantasy:[...new Set(editions.flatMap(e=>e.pools.colorsFantasy||[]))],
    romantic:[...new Set(editions.flatMap(e=>e.pools.romantic))],
    fantasy:[...new Set(editions.flatMap(e=>e.pools.fantasy))],
    otherworldly:[...new Set(editions.flatMap(e=>e.pools.otherworldly))],
  };
  return {
    id:'fantasy', label:'FANTASY INDEX', volume:'PA·IV', range:'cross-era',
    slotLabels:{
      ko:{foundation:'기초 의복',structure:'실루엣 구조',garment:'주 의복',neckwear:'넥웨어',outer:'겉옷 레이어',footwear:'신발',headwear:'머리 장식',accessories:'액세서리'},
      en:{foundation:'FOUNDATION',structure:'STRUCTURE',garment:'MAIN GARMENT',neckwear:'NECKWEAR',outer:'OUTER LAYER',footwear:'FOOTWEAR',headwear:'HEADWEAR',accessories:'ACCESSORIES'},
    },
    schemas:{
      feminine:SLOT_ORDER, masculine:SLOT_ORDER, neutral:SLOT_ORDER,
    },
    pools,
    periods: combos.map(c=>({
      id:c.id, label:c.label, years:c.years, callNo:c.callNo, tag:c.tag, mix:c.mix,
      slots:{},
    })).concat(periods),
  };
}

/* ---------------- 아카이브 데이터 바인딩 ---------------- */
const ALL_SLOTS=['foundation','structure','garment','neckwear','outer','footwear','headwear','accessories'];
const NONE_OPT={value:"",label:"None",id:""};
/* 랜덤에서 뺀 항목(⊘). 드롭다운에서는 여전히 고를 수 있다. localStorage 에 유지. */
const bans=new Set();
try{ (JSON.parse(localStorage.getItem("rosette.bans")||"[]")).forEach(id=>bans.add(id)); }catch(e){}
function saveBans(){ try{localStorage.setItem("rosette.bans",JSON.stringify([...bans]));}catch(e){} }
/* 카테고리 — 항목의 cat. 끄면 드롭다운·랜덤에서 모두 사라지고, 그 카테고리 가먼트뿐인 레시피도 빠진다. */
const CATS=[
  {id:'armor',ko:'갑옷',en:'Armor'},{id:'uniform',ko:'군복 · 제복',en:'Uniform'},{id:'mask',ko:'가면',en:'Masks'},
  {id:'weapon',ko:'무기',en:'Weapons'},{id:'smoking',ko:'흡연구',en:'Smoking'},{id:'religious',ko:'종교 · 순례',en:'Religious'},
];
const CAT_ORDER=['','religious','smoking','weapon','uniform','armor','mask'];
const catsOff=new Set();
try{ (JSON.parse(localStorage.getItem("rosette.catsOff")||"[]")).forEach(c=>catsOff.add(c)); }catch(e){}
function saveCats(){ try{localStorage.setItem("rosette.catsOff",JSON.stringify([...catsOff]));}catch(e){} }
const MILITARY=new Set(['armor','uniform','weapon']);
/* 셔플 전용 풀 — ⊘ 항목 제외 */
function slotOptionsRoll(edition,slot,state){ return slotOptions(edition,slot,state).filter(it=>!bans.has(it.id)); }
const inputs={};ALL_SLOTS.forEach(s=>inputs[s]="#"+s);

/* 레시피가 존재하지 않는 아이템 id 를 참조하면 그 슬롯이 조용히 비어 버린다.
 * (Gibson 이 머리 장식·액세서리 없이 나오던 원인) 시작 시점에 전부 검사한다. */
function validateRecipes(edition){
  let bad=0;
  for(const p of edition.periods||[])
    for(const r of (p.recipes||[]))
      for(const slot of Object.keys(r)){
        if(!Array.isArray(r[slot])) continue;
        const ids=new Set((p.slots?.[slot]||[]).map(i=>i.id));
        for(const id of r[slot])
          if(!ids.has(id)){ console.warn(`[recipe] ${edition.id}/${p.id}/${r.id}/${slot}: '${id}' 없음`); bad++; }
      }
  return bad;
}

const EDITIONS={antiquity:antiquity,rosette:rosette,modern:modern};
/* Fantasy Index — 시대를 직접 체크한다. pseudo-period 하나(x-custom)의 mix·tag 를 체크 상태로 갱신. */
EDITIONS.fantasy=buildCrossEdition([antiquity,rosette,modern],[
  {id:'x-custom',label:'Fantasy Mix',years:'—',callNo:'0000',tag:'',mix:'*'},
]);
const FANTASY_PRESETS=[
  {ko:'모든 시대',en:'All eras',ids:[]},
  {ko:'고딕 + 로코코',en:'Gothic + Rococo',ids:['gothic','rococo']},
  {ko:'섭정 + 빅토리아',en:'Regency + Victorian',ids:['regency','romantic','crinoline','bustle']},
  {ko:'비잔틴 + 바로크',en:'Byzantine + Baroque',ids:['byzantine','baroque']},
  {ko:'1950s + 로코코',en:'1950s + Rococo',ids:['newlook','rococo']},
];
function fantasyChecked(){ return [...$("#periodMulti").selectedOptions].map(o=>o.value); }
function applyFantasyMix(){
  const x=EDITIONS.fantasy.periods.find(p=>p.id==='x-custom');
  const ids=fantasyChecked();
  x.mix=ids.length?ids:'*';
  const reals=EDITIONS.fantasy.periods.filter(p=>!p.mix&&ids.includes(p.id));
  x.tag=(ids.length&&ids.length<=3)?reals.map(p=>p.tag).join(', '):'';
  renderMulti('period');
}
function periodDisplay(){
  if($("#collection").value!=='fantasy') return $("#period").value||"ARCHIVE";
  const ids=fantasyChecked();
  if(!ids.length) return selectLang==='ko'?'모든 시대':'ALL ERAS';
  const ed=EDITIONS.fantasy;
  return ids.map(id=>{const p=ed.periods.find(p=>p.id===id);return label(p.label,{editionId:p._from,periodId:p.id});}).join(' + ');
}
function periodDisplayEnglish(){
  if($("#collection").value!=='fantasy') return currentPeriod()?.label||"ARCHIVE";
  const ids=fantasyChecked();
  if(!ids.length) return "ALL ERAS";
  return ids.map(id=>EDITIONS.fantasy.periods.find(p=>p.id===id)?.label||id).join(' + ');
}

function currentPack(){return EDITIONS[$("#collection").value]}
function periodList(ed){return ed.id==='fantasy'?ed.periods.filter(p=>p.mix):ed.periods}
function currentPeriod(){
  const ed=currentPack(),v=$("#period").value;
  return periodList(ed).find(p=>p.label===v)||periodList(ed)[0];
}
function readState(){
  const ed=currentPack(),p=currentPeriod();
  return{edition:ed,periodId:p.id,gender:$("#gender").value.toLowerCase(),
         fidelity:$("#fidelity").value,detail:effectiveDetail()};
}
function label(en,{editionId=null,itemId=null,periodId=null}={}){
  if(selectLang!=="ko")return en;

  if(editionId==="rosette"){
    if(itemId && rosetteTranslations.items[itemId]) return rosetteTranslations.items[itemId];
    if(periodId && rosetteTranslations.periods[periodId]) return rosetteTranslations.periods[periodId];
  }

  return KO[en]||optionKo[en]||en;
}
function fill(sel,items,context={}){
  const el=$(sel),cur=el.value;
  const curSet=el.multiple?new Set([...el.selectedOptions].map(o=>o.value)):null;
  el.innerHTML="";
  let groupEl=null,groupKey=null;
  items.forEach(it=>{
    const g=it.group||'';
    if(g!==groupKey){
      groupKey=g;
      if(g){groupEl=document.createElement("optgroup");groupEl.label="— "+catName(g)+" —";el.appendChild(groupEl);}
      else groupEl=null;
    }
    const o=document.createElement("option");
    o.value=it.value;
    if(it.id) o.dataset.itemId=it.id;
    if(it.periodId) o.dataset.periodId=it.periodId;
    o.textContent=it.text||label(it.label,{
      editionId:context.editionId||null,
      itemId:it.id||null,
      periodId:it.periodId||null
    });
    if(curSet&&curSet.has(it.value)) o.selected=true;
    (groupEl||el).appendChild(o);
  });
  if(!el.multiple && items.some(i=>i.value===cur))el.value=cur;
}
function catName(id){const c=CATS.find(c=>c.id===id);return c?(selectLang==='ko'?c.ko:c.en):id;}
function relabelStaticSelect(id,map){
  [...$("#"+id).options].forEach(o=>{if(map[o.value]!==undefined)o.textContent=map[o.value]});
}
function fieldOf(slot){return $("#"+slot).closest(".field")}

/* 슬롯 제외 — 잠금이 '값을 고정'이라면 제외는 '이 슬롯을 아예 쓰지 않음'이다.
 * 셔플에서 뽑지 않고 프롬프트에도 넣지 않는다. */
const skips={};
/* 항목 검색어 — 852개가 되어 드롭다운에서 찾기 어려워졌다. */
let slotQuery="";

function populateSlots(){
  const st=readState(),ed=st.edition;
  const schema=schemaFor(ed,st.gender);
  const over=ed.slotLabels?ed.slotLabels[selectLang]:null;
  const base=selectI18n.labels[selectLang];
  ALL_SLOTS.forEach(slot=>{
    const f=fieldOf(slot),active=slot==='accessories'||schema.includes(slot);
    f.style.display=active?"":"none";
    if(!active){$("#"+slot).innerHTML="";return}
    let list=slotOptions(ed,slot,st);
    /* 데이터의 'None' 항목은 UI 공통 None 으로 대체한다 (고대 시대에 몇 개 남아 있음). */
    list=list.filter(it=>it.t!=='None');
    /* 같은 라벨이 여럿이면(시대 합침) 시대 이름을 붙여 구분한다 — '슈미즈 · 18C Rococo'. */
    const ctx={editionId:ed.id};
    const shown=list.map(o=>label(o.t,{...ctx,itemId:o.id}));
    const dupes=new Set(shown.filter((l,i)=>shown.indexOf(l)!==i));
    const pname=id=>{const pl=(ed.periods.find(p=>p.id===id)||{}).label||'';return label(pl,{editionId:ed.id,periodId:id});};
    let opts=list.map((o,i)=>({value:o.id,label:o.t,id:o.id,secondary:!!o.secondary,group:o.cat||'',
      text:(bans.has(o.id)?'⊘ ':'')+(dupes.has(shown[i])?shown[i]+' · '+pname(o.periodId):label(o.t,{...ctx,itemId:o.id}))}));
    /* 카테고리별로 묶는다 — 일반 항목 먼저, 그 다음 종교·흡연·무기·군복·갑옷·가면 순. 같은 카테고리 안은 원래 순서. */
    opts.sort((a,b)=>CAT_ORDER.indexOf(a.group)-CAT_ORDER.indexOf(b.group));
    /* 모든 선택 슬롯에 None 을 둔다. 롤이 비면(slotChance) 드롭다운을 None 으로 맞춰야
     * 이전 값이 남지 않는다 — '액세서리가 안 바뀐다'의 원인. garment 만 항상 채운다. 액세서리는 다중 선택(빈 집합 = None). */
    if(slot!=='garment'&&slot!=='accessories') opts=[...opts,NONE_OPT];
    fill("#"+slot,opts.length?opts:[{value:"",label:"—"}],{editionId:ed.id});
    if(slot==='accessories') renderMulti('accessories');
    const lab=f.querySelector("label");
    lab.textContent=(over&&over[slot])||base[slot]||slot.toUpperCase();
    if(skips[slot]){f.classList.add("slot-off");$("#"+slot).disabled=true}
  });
}
function applySelectLanguage(){
  const l=selectI18n.labels[selectLang];
  $("#labelCollection").textContent=l.collection;
  $("#labelPeriod").textContent=l.period;
  $("#labelGender").textContent=l.gender;
  $("#labelFidelity").textContent=l.fidelity;
  $("#labelDetail").textContent=l.detail;
  $("#labelColor").textContent=l.color;
  $("#labelAccent").textContent=l.accent;
  $("#labelOther").textContent=l.other;
  $("#other").placeholder=selectLang==='ko'?"추가 태그, 쉼표로 구분":"extra tags, comma separated";
  document.querySelector('.multi-mode[data-mode="combine"]').textContent=selectLang==='ko'?"＋ 함께 사용":"＋ Use together";
  { const b=document.querySelector('.multi-mode[data-mode="random"]'); const svg=b.querySelector("svg"); b.textContent=" "+(selectLang==='ko'?"랜덤 1개":"Random one"); if(svg) b.prepend(svg); }
  document.querySelector('.multi-none').textContent=selectLang==='ko'?"없음":"None";
  ["collection","gender","fidelity","detail"].forEach(id=>
    relabelStaticSelect(id,selectI18n.staticOptions[id][selectLang]));
  fillColors();
  if($("#collection").value==='fantasy') renderMulti('period');
  renderBanList();
  renderCatBar();
  renderPresetList();
  const ed=currentPack();
  fill("#period",periodList(ed).map(p=>({value:p.label,label:p.label,periodId:p.id})),{editionId:ed.id});
  populateSlots();
  renderMulti('accessories');
  /* 언어를 바꾸면 열려 있는 검색 결과·체크리스트도 다시 그린다 — 안 그리면 이전 언어로 남는다 (라벨 갱신 뒤에 호출) */
  if(slotQuery && !$("#searchPanel").hidden) renderSearchPanel(slotQuery);
  if(banSlot && !$("#banMenu").hidden) openBanMenu(banSlot);
}
function updatePack(){
  const ed=currentPack();
  $("#collectionPill").textContent=ed.label;
  fill("#period",periodList(ed).map(p=>({value:p.label,label:p.label,periodId:p.id})),{editionId:ed.id});
  if(ed.id==='rosette')$("#period").value='18C Rococo';
  const isF=ed.id==='fantasy';
  $("#period").hidden=isF;
  document.querySelector('[data-multi="period"]').hidden=!isF;
  if(isF){
    if(!$("#periodMulti").options.length){
      const reals=ed.periods.filter(p=>!p.mix);
      $("#periodMulti").innerHTML=reals.map(p=>`<option value="${p.id}">${p.label}</option>`).join("");
    }
    applyFantasyMix();
  }
  fillColors();
  populateSlots();updatePreview();
}
/* 색 — 편집의 colors (+ 로맨틱 이상이면 colorsFantasy). 'Random' 은 생성 때 뽑는다. */
function colorPool(){
  const ed=currentPack(),lv=FIDELITY[$("#fidelity").value]??0;
  return lv>=1?ed.pools.colors.concat(ed.pools.colorsFantasy||[]):ed.pools.colors;
}
function fillColors(){
  const ko=selectLang==='ko';
  const cols=colorPool().map(c=>({value:c,label:c,text:ko?(colorKo[c]||c):c}));
  fill("#color",[{value:"",label:"Random",text:ko?"랜덤":"Random"},...cols]);
  fill("#accent",[{value:"none",label:"None",text:ko?"없음":"None"},{value:"random",label:"Random",text:ko?"랜덤":"Random"},...cols]);
}
/* OTHER — 고증 강도별 갈니시 풀에서 채운다. 고증 중심은 빈 칸. */
function garnishFor(){
  const ed=currentPack(),lv=FIDELITY[$("#fidelity").value]??0;
  const max=ed.selectionRules?.maxFantasyGarnish?.[lv] ?? (lv>0?1:0);
  const pool=lv>=3?(ed.pools.otherworldly||[]):lv>=2?(ed.pools.fantasy||[]):lv>=1?(ed.pools.romantic||[]):[];
  return max>0?sample(pool,max):[];
}
function otherTags(){ return $("#other").value.split(",").map(t=>t.trim()).filter(Boolean); }
/* 디테일 'Random' 은 셔플·생성 때 한 번 정한다 */
let detailRoll="Medium";
function effectiveDetail(){ const v=$("#detail").value; return v==="Random"?detailRoll:v; }
function updatePreview(){
  $("#previewEra").textContent=periodDisplayEnglish().toUpperCase();
  $("#previewMode").textContent=`${$("#fidelity").value} · ${$("#gender").value}`;
}
const INDEX_FIELDS=["collection","period","gender","fidelity","detail","color","accent","other"];
function randomIndexField(id){
  if(id==="collection"){const el=$("#collection");el.selectedIndex=Math.floor(Math.random()*el.options.length);updatePack();return;}
  if(id==="period"){
    if($("#collection").value==='fantasy'){
      const opts=[...$("#periodMulti").options];const r=Math.random();
      const n=r<0.15?0:r<0.7?2:3;
      const chosen=new Set(sample(opts.map(o=>o.value),n));
      opts.forEach(o=>o.selected=chosen.has(o.value));
      applyFantasyMix();
    }else{const el=$("#period");el.selectedIndex=Math.floor(Math.random()*el.options.length);}
    return;
  }
  if(id==="color"){$("#color").value=rand(colorPool());return;}
  if(id==="accent"){$("#accent").value=Math.random()<0.5?"none":rand(colorPool().filter(c=>c!==$("#color").value));return;}
  if(id==="other"){$("#other").value=garnishFor().join(", ");return;}
  if(id==="detail"){$("#detail").value=rand(["Simple","Medium","Medium","Max"]);return;}
  const el=$("#"+id);el.selectedIndex=Math.floor(Math.random()*el.options.length);
}
function applyPicks(picks,only=null){
  ALL_SLOTS.forEach(s=>{
    if(only&&s!==only)return;
    if(skips[s]||(locks[s]&&!only))return;
    const el=$("#"+s);
    if(s==='accessories'){setMulti('accessories',picks.accessories||[]);return;}
    const v=picks[s];
    const has=val=>[...el.options].some(o=>o.value===val);
    if(v&&has(v)){el.value=v;return;}
    /* 롤이 비었거나(slotChance) 드롭다운에 없는 값이면 None. 이전 값을 남기지 않는다. */
    if(s!=='garment'&&has(''))el.value='';
  });
}
function currentPrev(){const prev={};ALL_SLOTS.forEach(s=>prev[s]=s==='accessories'?getMulti('accessories'):$("#"+s).value);return prev;}
function randomize(){
  detailRoll=rand(["Simple","Medium","Medium","Max"]);
  /* 의상 슬롯이 하나라도 잠겨 있으면 시대·성별·고증은 섞지 않는다 —
   * 바꾸면 잠근 항목이 목록에서 사라져 잠금이 풀린 것처럼 보인다. */
  const holdIndex=ALL_SLOTS.some(s=>locks[s]);
  const collectionChanged=!locks.collection&&!holdIndex;
  if(collectionChanged) randomIndexField("collection");
  ["period","gender","fidelity"].forEach(id=>{ if(locks[id]||holdIndex)return; randomIndexField(id); });
  if(!locks.detail) randomIndexField("detail");
  fillColors();
  if(!locks.color) randomIndexField("color");
  if(!locks.accent) randomIndexField("accent");
  if(!locks.other) randomIndexField("other");
  populateSlots();
  const st=readState();
  const picks=rollPicks(st.edition,st,locks,currentPrev());
  applyPicks(picks);
  updatePreview();
  $("#status").textContent="SHUFFLED · READY";
}
/* 시대·성별·컬렉션이 바뀌면 이전 항목은 목록에 없으므로 슬롯만 새로 뽑는다 (잠금 존중). 시작 시에도 한 번. */
function rollSlotsOnly(){
  const st=readState();
  const picks=rollPicks(st.edition,st,locks,currentPrev());
  applyPicks(picks);
  updatePreview();
}
/* 🎲 — 그 줄만 다시 뽑는다. 의상 슬롯은 나머지를 전부 잠근 채 롤을 돌려 그 슬롯만 취한다. */
function rerollField(id){
  if(INDEX_FIELDS.includes(id)){
    if(id==="detail") detailRoll=rand(["Simple","Medium","Medium","Max"]);
    randomIndexField(id);
    if(["collection","period","gender","fidelity"].includes(id)){fillColors();populateSlots();if(slotQuery)renderSearchPanel(slotQuery);}
    if(["collection","period","gender"].includes(id)) rollSlotsOnly();
    updatePreview();return;
  }
  if(!ALL_SLOTS.includes(id)||skips[id])return;
  const lk={};ALL_SLOTS.forEach(s=>lk[s]=s!==id);
  const st=readState();
  const picks=rollPicks(st.edition,st,lk,currentPrev());
  applyPicks(picks,id);
  updatePreview();
  $("#status").textContent="REROLLED · "+slotDisplayName(id).toUpperCase();
}
document.querySelectorAll(".reroll").forEach(b=>b.addEventListener("click",()=>rerollField(b.dataset.reroll)));
function compose(){
  const st=readState();
  const picked={};ALL_SLOTS.forEach(s=>{if(!skips[s])picked[s]=s==='accessories'?getMulti('accessories'):$("#"+s).value});
  if(!skips.accessories && multiMode.accessories==='random' && picked.accessories.length>1) picked.accessories=[rand(picked.accessories)];
  const pool=colorPool();
  const base=$("#color").value||rand(pool);
  const acc=$("#accent").value;
  const accent=acc==='none'?'':acc==='random'?(Math.random()<0.5?'':rand(pool.filter(c=>c!==base))):acc;
  st.color=accent?`${base} with ${accent} accents`:base;
  st.extraTags=otherTags();
  return composeFrom(st.edition,st,picked).prompt;
}
["period","gender"].forEach(id=>
  $("#"+id).addEventListener("change",()=>{fillColors();populateSlots();rollSlotsOnly();}));
$("#fidelity").addEventListener("change",()=>{fillColors();populateSlots();});
$("#periodMulti").addEventListener("change",()=>{applyFantasyMix();populateSlots();updatePreview();});

let serial=1;
function openPrintedSheet({scroll=true}={}){
  const sheet=$("#sheet");
  const zone=$("#resultZone");

  sheet.classList.remove("torn","dragging");
  sheet.style.removeProperty("--tear-y");
  sheet.style.removeProperty("--tear-r");
  sheet.classList.remove("out");

  zone.style.height="0px";

  requestAnimationFrame(()=>{
    const target=Math.ceil(sheet.scrollHeight + 34);
    zone.style.height=target+"px";
    requestAnimationFrame(()=>sheet.classList.add("out"));
  });

  if(scroll){
    window.setTimeout(()=>{
      zone.scrollIntoView({behavior:"smooth",block:"start"});
    },260);
  }
}

function transcribe(){
  if($("#detail").value==="Random") detailRoll=rand(["Simple","Medium","Medium","Max"]);
  const p=compose();

  $("#prompt").textContent=p;
  $("#sheetTitle").textContent=`${periodDisplayEnglish().toUpperCase()} — ${$("#fidelity").value.toUpperCase()}`;
  $("#sheetCode").textContent=`PA · ${$("#collection").value.slice(0,3).toUpperCase()} · Nº ${String(serial++).padStart(4,"0")}`;
  $("#sheetMeta").innerHTML=`${$("#gender").value.toUpperCase()}<br>DETAIL: ${effectiveDetail().toUpperCase()}`;
  $("#status").textContent="GENERATED · DOCUMENT READY";

  openPrintedSheet({scroll:true});
}
async function copyText(){
  const text=$("#prompt").textContent;
  try{await navigator.clipboard.writeText(text)}catch(e){
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();
  }
  const b=$("#copyBtn"),old=b.textContent;b.textContent="COPIED";setTimeout(()=>b.textContent=old,850);
}
function saveText(){
  const blob=new Blob([$("#prompt").textContent],{type:"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="costume_archive_prompt.txt";a.click();URL.revokeObjectURL(a.href);
}
const skipBtn=slot=>document.querySelector('.skip[data-skip="'+slot+'"]');
const lockBtn=slot=>document.querySelector('.lock[data-lock="'+slot+'"]');
function paintSkip(slot){
  const on=!!skips[slot],b=skipBtn(slot);
  if(!b)return;
  b.classList.toggle("skipped",on);
  b.textContent=on?"+":"−";
  b.title=on?"이 슬롯 다시 쓰기":"이 슬롯 빼기";
  const f=fieldOf(slot);
  f.classList.toggle("slot-off",on);
  $("#"+slot).disabled=on;
  const mt=f.querySelector(".multi-toggle");if(mt)mt.disabled=on;
}
document.querySelectorAll(".lock").forEach(b=>{
  const id=b.dataset.lock;
  locks[id]=false;
  b.addEventListener("click",()=>{
    if(skips[id])return;                     // 제외된 슬롯은 잠글 수 없다
    locks[id]=!locks[id];
    b.classList.toggle("locked",locks[id]);
    b.textContent=locks[id]?"◆":"◇";
  });
});
document.querySelectorAll(".skip").forEach(b=>{
  const id=b.dataset.skip;
  skips[id]=false;
  b.addEventListener("click",()=>{
    skips[id]=!skips[id];
    if(skips[id]&&locks[id]){                // 제외하면 잠금은 푼다
      locks[id]=false;
      const l=lockBtn(id);
      if(l){l.classList.remove("locked");l.textContent="◇"}
    }
    paintSkip(id);
    updatePreview();
  });
});

/* ---------------- 다중 선택 위젯 (2004 의 HEAD PIECE 방식) ----------------
 * 상태는 숨은 <select multiple> 이 가진다. 위젯은 그 옵션을 체크박스로 그린다.
 * accessories: '＋ 함께 사용' 이면 체크한 전부, '🎲 랜덤 1개' 면 생성마다 하나.
 * period(Fantasy Index): 체크한 시대끼리 섞는다. 프리셋 칩 + '어울리는 것끼리' 토글. */
const multiMode={accessories:'combine'};
let coherentMix=true;
try{ const v=localStorage.getItem("rosette.coherent"); if(v!==null) coherentMix=v==="1"; }catch(e){}
const multiSelectId={accessories:'accessories',period:'periodMulti'};
function getMulti(key){ return [...$("#"+multiSelectId[key]).selectedOptions].map(o=>o.value); }
function setMulti(key,ids){
  const set=new Set(ids);
  [...$("#"+multiSelectId[key]).options].forEach(o=>o.selected=set.has(o.value));
  if(key==='period') applyFantasyMix(); else renderMulti(key);
}
function renderMulti(key){
  const root=document.querySelector(`[data-multi="${key}"]`);if(!root)return;
  const sel=$("#"+multiSelectId[key]);
  const list=root.querySelector(".multi-list");
  const summary=root.querySelector(".multi-summary");
  const ko=selectLang==='ko';
  const ed=currentPack();
  list.innerHTML="";
  const opts=[...sel.options];
  let lastGroup=null;
  for(const o of opts){
    const g=o.parentElement.tagName==='OPTGROUP'?o.parentElement.label:'';
    if(key!=='period'&&g!==lastGroup){lastGroup=g;if(g){const hd=document.createElement("div");hd.className="multi-group";hd.textContent=g;list.appendChild(hd);}}
    const lab=document.createElement("label");lab.className="check-option"+(o.selected?" on":"")+(bans.has(o.value)?" banned":"");
    const cb=document.createElement("input");cb.type="checkbox";cb.value=o.value;cb.checked=o.selected;
    const span=document.createElement("span");
    let text=o.textContent;
    if(key==='period'){const p=ed.periods.find(p=>p.id===o.value);text=p?label(p.label,{editionId:p._from,periodId:p.id}):o.textContent;}
    span.textContent=text;
    cb.addEventListener("change",()=>{o.selected=cb.checked;if(key==='period')applyFantasyMix();else renderMulti(key);sel.dispatchEvent(new Event("change",{bubbles:true}));if(key==='period'){populateSlots();updatePreview();}});
    lab.append(cb,span);list.appendChild(lab);
  }
  const chosen=opts.filter(o=>o.selected);
  if(key==='period'){
    summary.textContent=chosen.length?periodDisplay():(ko?'모든 시대':'All eras');
    const pr=root.querySelector("#periodPresets");pr.innerHTML="";
    const coh=document.createElement("label");coh.className="multi-coherent";
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=coherentMix;
    cb.addEventListener("change",()=>{coherentMix=cb.checked;try{localStorage.setItem("rosette.coherent",coherentMix?"1":"0");}catch(e){}});
    const sp=document.createElement("span");sp.textContent=ko?"🧩 어울리는 것끼리 맞추기":"🧩 Keep silhouettes coherent";
    coh.append(cb,sp);pr.appendChild(coh);
    for(const p of FANTASY_PRESETS){const b=document.createElement("button");b.type="button";b.className="multi-preset";b.textContent=ko?p.ko:p.en;
      b.addEventListener("click",()=>{setMulti('period',p.ids);populateSlots();updatePreview();});pr.appendChild(b);}
  }else{
    summary.textContent=chosen.length?chosen.map(o=>o.textContent.replace(/^⊘ /,'')).join(" · "):(ko?'없음':'None');
    root.querySelectorAll(".multi-mode").forEach(b=>b.classList.toggle("on",b.dataset.mode===multiMode[key]));
  }
}
document.querySelectorAll(".multi-select").forEach(root=>{
  const key=root.dataset.multi;
  const toggle=root.querySelector(".multi-toggle"),menu=root.querySelector(".multi-menu");
  toggle.addEventListener("click",e=>{e.stopPropagation();const open=menu.hidden;closeMenus();menu.hidden=!open;toggle.setAttribute("aria-expanded",String(open));if(open)renderMulti(key);});
  menu.addEventListener("click",e=>e.stopPropagation());
  root.querySelectorAll(".multi-mode").forEach(b=>b.addEventListener("click",()=>{multiMode[key]=b.dataset.mode;renderMulti(key);updatePreview();}));
  const none=root.querySelector(".multi-none");
  if(none) none.addEventListener("click",()=>{setMulti(key,[]);$("#"+multiSelectId[key]).dispatchEvent(new Event("change",{bubbles:true}));});
});
function closeMenus(){document.querySelectorAll(".multi-menu").forEach(m=>{m.hidden=true;});const pm=$("#presetMenu");if(pm)pm.hidden=true;const bm=$("#banMenu");if(bm)bm.hidden=true;document.querySelectorAll(".multi-toggle").forEach(t=>t.setAttribute("aria-expanded","false"));}
document.addEventListener("click",closeMenus);
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenus();});

/* ---------------- ⊘ 항목 제외 ---------------- */
/* ⊘ — 그 슬롯의 목록을 체크리스트로 띄운다. 체크 = 랜덤에 나옴, 해제 = 랜덤에서 뺌. 프리셋에 저장된다. */
let banSlot=null;
function openBanMenu(slot){
  closeMenus();banSlot=slot;
  const menu=$("#banMenu"),list=$("#banMenuList"),ko=selectLang==='ko';
  const f=fieldOf(slot),fr=f.getBoundingClientRect(),cr=menu.parentElement.getBoundingClientRect();
  menu.style.top=(fr.bottom-cr.top+3)+"px";
  menu.hidden=false;
  $("#banMenuTitle").textContent=(ko?"랜덤에 나올 항목 — ":"Included in shuffle — ")+slotDisplayName(slot);
  list.innerHTML="";
  const st=readState(),ed=st.edition;
  const items=slotOptions(ed,slot,st).filter(it=>it.t!=='None');
  items.sort((x,y)=>CAT_ORDER.indexOf(x.cat||'')-CAT_ORDER.indexOf(y.cat||''));
  const allOn=items.every(it=>!bans.has(it.id));
  $("#banMenuAll").textContent=allOn?(ko?"전부 빼기":"Exclude all"):(ko?"전부 넣기":"Include all");
  $("#banMenuAll").onclick=()=>{items.forEach(it=>allOn?bans.add(it.id):bans.delete(it.id));saveBans();populateSlots();renderBanList();openBanMenu(slot);};
  let lastCat=null;
  for(const it of items){
    const g=it.cat||'';
    if(g!==lastCat){lastCat=g;if(g){const hd=document.createElement("div");hd.className="multi-group";hd.textContent="— "+catName(g)+" —";list.appendChild(hd);}}
    const lab=document.createElement("label");lab.className="check-option"+(bans.has(it.id)?" banned":" on");
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=!bans.has(it.id);
    const sp=document.createElement("span");sp.textContent=label(it.t,{editionId:ed.id,itemId:it.id});
    cb.addEventListener("change",()=>{if(cb.checked)bans.delete(it.id);else bans.add(it.id);lab.classList.toggle("banned",!cb.checked);lab.classList.toggle("on",cb.checked);saveBans();populateSlots();renderBanList();});
    lab.append(cb,sp);list.appendChild(lab);
  }
}
function itemName(id){
  for(const ed of Object.values(EDITIONS)){for(const p of ed.periods)for(const sl of Object.values(p.slots||{}))for(const it of sl)if(it.id===id)return label(it.t,{editionId:ed.id,itemId:id});}
  return id;
}
function renderBanList(){
  const el=$("#banList");if(!el)return;
  if(!bans.size){el.hidden=true;el.innerHTML="";return;}
  el.hidden=false;el.innerHTML="";
  const head=document.createElement("span");head.className="ban-head";head.textContent=selectLang==='ko'?"랜덤에서 뺀 항목:":"Excluded from shuffle:";el.appendChild(head);
  for(const id of bans){const c=document.createElement("button");c.type="button";c.className="ban-chip";c.textContent="⊘ "+itemName(id)+" ×";c.title=selectLang==='ko'?"제외 해제":"Restore";
    c.addEventListener("click",()=>{bans.delete(id);saveBans();populateSlots();renderBanList();});el.appendChild(c);}
}
document.querySelectorAll(".ban").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();const m=$("#banMenu");if(!m.hidden&&banSlot===b.dataset.ban){m.hidden=true;return;}openBanMenu(b.dataset.ban);}));
$("#banMenu").addEventListener("click",e=>e.stopPropagation());

/* ---------------- 카테고리 켜기/끄기 ---------------- */
function renderCatBar(){
  const el=$("#catBar");if(!el)return;el.innerHTML="";
  const head=document.createElement("span");head.className="ban-head";head.textContent=selectLang==='ko'?"필터:":"Filter:";el.appendChild(head);
  for(const c of CATS){
    const b=document.createElement("button");b.type="button";b.className="cat-chip"+(catsOff.has(c.id)?" off":"");
    b.textContent=(catsOff.has(c.id)?"✕ ":"✓ ")+(selectLang==='ko'?c.ko:c.en);
    b.title=selectLang==='ko'?"끄면 드롭다운과 랜덤에서 사라집니다":"Off = hidden from lists and shuffle";
    b.addEventListener("click",()=>{if(catsOff.has(c.id))catsOff.delete(c.id);else catsOff.add(c.id);saveCats();renderCatBar();populateSlots();if(slotQuery)renderSearchPanel(slotQuery);updatePreview();});
    el.appendChild(b);
  }
}
renderCatBar();

/* ---------------- 프리셋 ---------------- */
function snapshot(){
  const o={collection:$("#collection").value,period:$("#period").value,periods:fantasyChecked(),gender:$("#gender").value,fidelity:$("#fidelity").value,
    detail:$("#detail").value,color:$("#color").value,accent:$("#accent").value,other:$("#other").value,
    slots:{},locks:{...locks},skips:{...skips},bans:[...bans],catsOff:[...catsOff],accMode:multiMode.accessories,coherent:coherentMix};
  ALL_SLOTS.forEach(s=>o.slots[s]=s==='accessories'?getMulti('accessories'):$("#"+s).value);
  return o;
}
function restore(o){
  $("#collection").value=o.collection;updatePack();
  if(o.collection==='fantasy'){setMulti('period',o.periods||[]);}else{$("#period").value=o.period;}
  $("#gender").value=o.gender;$("#fidelity").value=o.fidelity;$("#detail").value=o.detail;
  fillColors();$("#color").value=o.color||"";$("#accent").value=o.accent||"none";$("#other").value=o.other||"";
  bans.clear();(o.bans||[]).forEach(id=>bans.add(id));saveBans();
  catsOff.clear();(o.catsOff||[]).forEach(c=>catsOff.add(c));saveCats();renderCatBar();
  multiMode.accessories=o.accMode||'combine';if(o.coherent!==undefined)coherentMix=o.coherent;
  Object.keys(skips).forEach(k=>{skips[k]=!!(o.skips||{})[k];paintSkip(k);});
  populateSlots();
  ALL_SLOTS.forEach(s=>{const v=(o.slots||{})[s];if(s==='accessories')setMulti('accessories',v||[]);else if(v!==undefined)$("#"+s).value=v;});
  Object.keys(locks).forEach(k=>{locks[k]=!!(o.locks||{})[k];const b=lockBtn(k);if(b){b.classList.toggle("locked",locks[k]);b.textContent=locks[k]?"◆":"◇";}});
  renderBanList();updatePreview();
}
function loadPresets(){try{return JSON.parse(localStorage.getItem("rosette.presets")||"{}");}catch(e){return {};}}
function savePresets(p){try{localStorage.setItem("rosette.presets",JSON.stringify(p));}catch(e){}}
function renderPresetList(){
  const list=$("#presetList");if(!list)return;list.innerHTML="";
  const p=loadPresets(),names=Object.keys(p),ko=selectLang==='ko';
  $("#presetName").placeholder=ko?"프리셋 이름":"preset name";$("#presetSaveGo").title=ko?"저장":"Save";
  if(!names.length){const e=document.createElement("div");e.className="preset-empty";e.textContent=ko?"저장된 프리셋 없음 — 이름을 쓰고 저장":"No presets yet — type a name and save";list.appendChild(e);return;}
  for(const n of names){
    const row=document.createElement("div");row.className="preset-row";
    const load=document.createElement("button");load.type="button";load.className="preset-load";load.textContent="★ "+n;
    load.addEventListener("click",()=>{restore(p[n]);$("#status").textContent="PRESET LOADED · "+n.toUpperCase();closeMenus();});
    const del=document.createElement("button");del.type="button";del.className="preset-del";del.textContent="×";del.title=ko?"삭제 (두 번 누름)":"delete (press twice)";
    del.addEventListener("click",()=>{
      if(del.dataset.armed){const q=loadPresets();delete q[n];savePresets(q);renderPresetList();$("#status").textContent="PRESET DELETED";return;}
      del.dataset.armed="1";del.textContent=ko?"확인?":"sure?";setTimeout(()=>{delete del.dataset.armed;del.textContent="×";},2500);
    });
    row.append(load,del);list.appendChild(row);
  }
}
function openPresetMenu(){closeMenus();$("#presetMenu").hidden=false;renderPresetList();}
$("#presetOpen").addEventListener("click",e=>{e.stopPropagation();const m=$("#presetMenu");if(m.hidden)openPresetMenu();else m.hidden=true;});
$("#presetMenu").addEventListener("click",e=>e.stopPropagation());
function savePresetFromInput(){
  const inp=$("#presetName"),name=inp.value.trim();
  if(!name){inp.focus();return;}
  const p=loadPresets();p[name]=snapshot();savePresets(p);renderPresetList();inp.value="";
  $("#status").textContent="PRESET SAVED · "+name.toUpperCase();
}
$("#presetSaveGo").addEventListener("click",savePresetFromInput);
$("#presetName").addEventListener("keydown",e=>{
  if(e.key==="Enter") savePresetFromInput();
  if(e.key==="Escape"){$("#presetMenu").hidden=true;}
});

/* 검색 */
/* 항목 검색 — 결과를 검색창 아래 패널에 '카테고리 · 항목' 으로 띄운다.
 * 전체 탭 + 결과가 있는 카테고리 탭만. 클릭하면 해당 슬롯에 바로 선택된다.
 * 드롭다운 자체는 건드리지 않는다. */
let searchCat="all";
const searchHit=(it,lq)=>((it.t||"")+" "+(it.p||"")+" "+(KO[it.t]||"")+" "+(rosetteTranslations.items[it.id]||"")).toLowerCase().includes(lq);
function slotDisplayName(slot){
  const f=fieldOf(slot);const lab=f&&f.querySelector("label");
  return lab?lab.textContent:slot;
}
function searchResults(q){
  const st=readState(),lq=q.toLowerCase(),out=[];
  const schema=schemaFor(st.edition,st.gender);
  for(const slot of ALL_SLOTS){
    if(!(slot==='accessories'||schema.includes(slot))) continue;
    for(const it of slotOptions(st.edition,slot,st)){
      if(it.t==='None'||!searchHit(it,lq)) continue;
      out.push({slot,it,target:slot});
    }
  }
  return out;
}
function pickSearchResult(target,id){
  const el=$("#"+target);
  if(![...el.options].some(o=>o.value===id)) return;
  if(target==='accessories'){ setMulti('accessories',[...new Set([...getMulti('accessories'),id])]); }
  else el.value=id;
  if(skips[target]){skips[target]=false;paintSkip(target);}
  updatePreview();
  const f=fieldOf(target);
  f.classList.remove("flash");void f.offsetWidth;f.classList.add("flash");
}
function renderSearchPanel(q){
  const panel=$("#searchPanel"),tabs=$("#searchTabs"),list=$("#searchList");
  if(!q){panel.hidden=true;tabs.innerHTML="";list.innerHTML="";return}
  const res=searchResults(q);
  panel.hidden=false;
  tabs.innerHTML="";list.innerHTML="";
  if(!res.length){
    tabs.hidden=true;
    renderElsewhere(q,list);
    return;
  }
  tabs.hidden=false;
  const byCat=new Map();
  for(const r of res){if(!byCat.has(r.target))byCat.set(r.target,[]);byCat.get(r.target).push(r);}
  if(searchCat!=="all"&&!byCat.has(searchCat)) searchCat="all";
  const mkTab=(key,name,n)=>{
    const b=document.createElement("button");b.type="button";b.className="search-tab"+(searchCat===key?" on":"");
    b.textContent=`${name} ${n}`;b.addEventListener("click",()=>{searchCat=key;renderSearchPanel(q)});tabs.appendChild(b);
  };
  mkTab("all",selectLang==="ko"?"전체":"ALL",res.length);
  for(const [cat,arr] of byCat) mkTab(cat,slotDisplayName(cat),arr.length);
  const shown=searchCat==="all"?res:byCat.get(searchCat);
  const ed=readState().edition;
  for(const r of shown){
    const row=document.createElement("button");row.type="button";row.className="search-row";
    const name=label(r.it.t,{editionId:ed.id,itemId:r.it.id});
    const per=(ed.periods.find(p=>p.id===r.it.periodId)||{}).label||"";
    row.innerHTML=`<span class="search-cat">${slotDisplayName(r.target)}</span><span class="search-name"></span>`;
    row.querySelector(".search-name").textContent=name+(per&&FIDELITY[readState().fidelity]>=2?" · "+label(per,{editionId:ed.id,periodId:r.it.periodId}):"");
    row.addEventListener("click",()=>pickSearchResult(r.target,r.it.id));
    list.appendChild(row);
  }
}
function searchElsewhere(q){
  /* 현재 조건에 없는 항목을 컬렉션 전체에서 찾는다 — 어느 시대에, 어느 고증 강도부터 있는지. */
  const st=readState(),lq=q.toLowerCase(),lv=FIDELITY[st.fidelity]??0,out=[];
  for(const per of st.edition.periods){
    if(per.mix) continue;
    for(const [slot,items] of Object.entries(per.slots||{})){
      if(!ALL_SLOTS.includes(slot)) continue;
      for(const it of items){
        if(it.t==='None'||!searchHit(it,lq)) continue;
        if(!genderOk(it,st.gender)) continue;
        out.push({per,slot,it,needLv:Math.max(lv,it.f||0)});
      }
    }
  }
  return out;
}
function jumpToResult(e){
  const lvName=Object.keys(FIDELITY).find(k=>FIDELITY[k]===e.needLv);
  if(FIDELITY[$("#fidelity").value]<e.needLv) $("#fidelity").value=lvName;
  $("#period").value=e.per.label;
  populateSlots();
  pickSearchResult(e.slot,e.it.id);
  renderSearchPanel(slotQuery);
}
function renderElsewhere(q,list){
  const ed=readState().edition;
  const wrap=document.createElement("div");wrap.className="search-empty";
  const found=searchElsewhere(q);
  if(!found.length){wrap.textContent=`"${q}" — 이 컬렉션에 없습니다`;list.appendChild(wrap);return;}
  const head=document.createElement("div");head.className="search-empty-head";
  head.textContent=`"${q}" — 현재 조건에는 없음. 누르면 그 시대로 이동:`;wrap.appendChild(head);
  const chips=document.createElement("div");chips.className="search-chips";
  for(const e of found){
    const c=document.createElement("button");c.type="button";c.className="search-chip";
    const per=label(e.per.label,{editionId:ed.id,periodId:e.per.id});
    const name=label(e.it.t,{editionId:ed.id,itemId:e.it.id});
    const lvName=Object.keys(FIDELITY)[e.it.f||0];
    const lvTag=(e.it.f||0)>(FIDELITY[$("#fidelity").value]??0)?` · ${selectI18n.staticOptions.fidelity[selectLang][lvName]||lvName}`:"";
    c.textContent=`${per} → ${name}${lvTag}`;
    c.title=slotDisplayName(e.slot);
    c.addEventListener("click",()=>jumpToResult(e));
    chips.appendChild(c);
  }
  wrap.appendChild(chips);list.appendChild(wrap);
}
function applySlotSearch(){
  const q=$("#slotSearch").value.trim();
  slotQuery=q;
  renderSearchPanel(q);
}
$("#slotSearch").addEventListener("input",applySlotSearch);
$("#slotSearchClear").addEventListener("click",()=>{
  $("#slotSearch").value="";applySlotSearch();$("#slotSearch").focus();
});
$("#slotSearch").addEventListener("focus",()=>{if($("#slotSearch").value.trim())renderSearchPanel($("#slotSearch").value.trim())});
$("#slotSearch").addEventListener("keydown",e=>{if(e.key==="Escape"){$("#searchPanel").hidden=true}});
/* 패널 안 클릭은 바깥으로 전파하지 않는다 — 탭 클릭으로 재렌더된 버튼은 closest() 가 못 찾는다 */
document.querySelector(".slot-search").addEventListener("click",e=>e.stopPropagation());
document.addEventListener("click",()=>{ $("#searchPanel").hidden=true; });
/* 조건이 바뀌면 결과도 다시 */
["collection","period","gender","fidelity"].forEach(id=>$("#"+id).addEventListener("change",()=>{if(slotQuery)renderSearchPanel(slotQuery)}));
$("#collection").addEventListener("change",()=>{updatePack();rollSlotsOnly();});
["color","accent","other"].forEach(id=>$("#"+id).addEventListener("change",updatePreview));
["period","gender","fidelity","detail"].forEach(id=>$("#"+id).addEventListener("change",updatePreview));
Object.values(inputs).forEach(sel=>$(sel).addEventListener("change",updatePreview));
$("#shuffleBtn").addEventListener("click",randomize);
$("#transcribeBtn").addEventListener("click",transcribe);
/* REPRINT — 2004 와 같은 뜻: 설정(인덱스·잠금)은 그대로 두고 안 잠긴 슬롯만 새로 뽑아 다시 인쇄 */
$("#reprintBtn").addEventListener("click",()=>{rollSlotsOnly();transcribe();});
$("#copyBtn").addEventListener("click",copyText);
$("#saveBtn").addEventListener("click",saveText);
updatePack();applySelectLanguage();updatePreview();
$("#langToggle").addEventListener("change",e=>{
  selectLang=e.target.checked?"en":"ko";
  applySelectLanguage();
  updatePreview();
});


const tearHandle=$("#tearHandle");
const tearSheet=$("#sheet");
const tearZone=$("#resultZone");
let tearPointer=null;
let tearStartY=0;
let tearY=0;

function finishTear(){
  tearPointer=null;
  tearSheet.classList.remove("dragging");
  tearSheet.classList.add("torn");
  $("#status").textContent="DOCUMENT REMOVED";
  window.setTimeout(()=>{
    tearSheet.classList.remove("out","torn");
    tearSheet.style.removeProperty("--tear-y");
    tearSheet.style.removeProperty("--tear-r");
    tearZone.style.height="0px";
  },220);
}

tearHandle.addEventListener("pointerdown",e=>{
  if(!tearSheet.classList.contains("out")) return;
  tearPointer=e.pointerId;
  tearStartY=e.clientY;
  tearY=0;
  tearSheet.classList.add("dragging");
  tearHandle.setPointerCapture?.(e.pointerId);
});

tearHandle.addEventListener("pointermove",e=>{
  if(e.pointerId!==tearPointer) return;
  tearY=Math.max(0,Math.min(120,e.clientY-tearStartY));
  tearSheet.style.setProperty("--tear-y",tearY+"px");
  tearSheet.style.setProperty("--tear-r",(tearY/90)+"deg");
});

function endTearDrag(e){
  if(e.pointerId!==tearPointer) return;
  tearHandle.releasePointerCapture?.(e.pointerId);
  if(tearY>=64){
    finishTear();
  }else{
    tearPointer=null;
    tearSheet.classList.remove("dragging");
    tearSheet.style.setProperty("--tear-y","0px");
    tearSheet.style.setProperty("--tear-r","0deg");
  }
}
tearHandle.addEventListener("pointerup",endTearDrag);
tearHandle.addEventListener("pointercancel",endTearDrag);

// Accessible non-drag fallback: click the handle to tear.
tearHandle.addEventListener("click",e=>{
  if(tearY>2) return;
  if(tearSheet.classList.contains("out")) finishTear();
});

const modal=$("#helpModal");
const openHelp=()=>modal.classList.add("open");
const closeHelp=()=>modal.classList.remove("open");
$("#helpBtn").addEventListener("click",openHelp);
$("#helpClose").addEventListener("click",closeHelp);
$("#helpOk").addEventListener("click",closeHelp);
modal.addEventListener("click",e=>{if(e.target===modal)closeHelp()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeHelp()});
[antiquity,rosette,modern].forEach(validateRecipes);

updatePack();
applySelectLanguage();
rollSlotsOnly();
$("#resultZone").style.height="0px";
