// Illustrated 안의 조합형 분장. 원형은 몸통과 필수 소품, 의상 결은 재단,
// 모티프는 옷에 보이는 장식을 정한다. 선택축을 완성된 분장 이름에 합치지 않는다.
const TF_MIX_STYLES = {
  gothic: { en: 'Gothic', ko: '고딕', home: 'scalloped cuffs, narrow lace trim' },
  gothic_lolita: { en: 'Gothic Lolita', ko: '고딕 로리타', home: 'pintucked bodice, tiered lace trim' },
  occult: { en: 'Occult', ko: '오컬트', home: 'hand-painted sigil patches, ribbon ties' },
  moe: { en: 'Moe', ko: '모에', home: 'felt bows, gathered cuffs' },
  battle: { en: 'Battle', ko: '전투', home: 'padded shoulder tabs, belted fabric panels' },
  idol: { en: 'Idol', ko: '아이돌', home: 'stage-style ribbon trim, glossy buttons' },
  decadent: { en: 'Decadent', ko: '퇴폐미', home: 'soft velvet trim, loosely draped sash' },
};

// 얼굴 가림은 머리 장식과 별개다. 두 번째 장신구 또는 수동 선택으로 쓴다.
const TF_MIX_EYES = [
  ['lace-blindfold', 'Lace blindfold', '레이스 눈가리개', 'soft lace blindfold covering both eyes', 'sec c:mask'],
  ['blindfold', 'Fabric blindfold', '천 눈가리개', 'plain fabric blindfold covering both eyes', 'sec c:mask'],
  ['eyepatch', 'Medical eye patch', '의료용 안대', 'medical eye patch over one eye', 'sec c:mask'],
];
const TF_MIX_EYE_STYLES = {
  'lace-blindfold': ['gothic', 'gothic_lolita', 'occult', 'decadent'],
  blindfold: ['gothic', 'occult', 'battle', 'decadent'],
  eyepatch: ['battle'],
};

const TF_MOTIFS = {
  none: { en: 'None', ko: '없음', p: '' },
  star: { en: 'Star', ko: '별', p: 'small star embroidery on the costume' },
  moon: { en: 'Crescent moon', ko: '초승달', p: 'crescent moon embroidery on the costume' },
  rose: { en: 'Rose', ko: '장미', p: 'rose embroidery along the costume hem' },
  raven: { en: 'Raven', ko: '까마귀', p: 'raven emblem sewn on the costume' },
  candle: { en: 'Candle', ko: '촛불', p: 'small candle motifs embroidered on the cuffs' },
  sigil: { en: 'Magic sigil', ko: '마법 기호', p: 'embroidered magic sigils on the costume' },
  flame: { en: 'Flame', ko: '불꽃', p: 'flame embroidery along the costume hem' },
  frost: { en: 'Snow crystal', ko: '눈꽃', p: 'snow crystal embroidery on the costume' },
};

/* 재단은 같은 디자인의 기장과 목선만 바꾼다. 색과 모티프는 이 표에 쓰지 않는다. */
const TF_MIX_CUTS = {
  witch: {
    f: ['high neckline, fitted long sleeves, ankle-length layered skirt', 'square neckline, puff sleeves, knee-length layered skirt', 'off-shoulder neckline, detached sleeves, short layered skirt'],
    m: ['high collar, long sleeves, fitted trousers', 'open collar, sleeveless waistcoat, fitted trousers'],
  },
  devil: {
    f: ['high neckline, long sleeves, ankle-length skirt', 'open collar, puff sleeves, knee-length pleated skirt', 'off-shoulder neckline, detached sleeves, short pleated skirt'],
    m: ['high collar, long sleeves, tailored trousers', 'open collar, sleeveless shirt, tailored trousers'],
  },
  ghost: {
    f: ['high neckline, long sleeves, floor-length layered skirt', 'soft neckline, sheer sleeves, knee-length layered skirt', 'off-shoulder neckline, detached tulle sleeves, short layered skirt'],
    m: ['high collar, long sleeves, layered trousers', 'open collar, sheer overshirt, fitted trousers'],
  },
  angel: {
    f: ['high neckline, long sleeves, floor-length layered skirt', 'square neckline, puff sleeves, knee-length layered skirt', 'off-shoulder neckline, detached sleeves, short layered skirt'],
    m: ['high collar, long sleeves, tailored trousers', 'open collar, sleeveless waistcoat, tailored trousers'],
  },
  deity: {
    f: ['high draped neckline, long sleeves, floor-length skirt', 'one-shoulder drape, knee-length skirt', 'off-shoulder drape, short overskirt, side slit'],
    m: ['high draped collar, long sleeves, layered trousers', 'one-shoulder drape, sleeveless tunic, layered trousers'],
  },
  knight: {
    f: ['high collar, long sleeves, ankle-length armored overskirt', 'short capelet, knee-length armored overskirt', 'sleeveless cuirass, short overskirt, fitted shorts'],
    m: ['high collar, long sleeves, armored trousers', 'open collar, sleeveless cuirass, armored trousers'],
  },
  doll: {
    f: ['high neckline, puff sleeves, ankle-length bell skirt', 'puff sleeves, knee-length bell skirt', 'off-shoulder sleeves, short bell skirt'],
    m: ['high collar, puff sleeves, fitted trousers', 'open collar, sleeveless waistcoat, fitted shorts'],
  },
  snow: {
    f: ['high collar, full-length sleeves, trailing layered skirt', 'wrapped neckline, loose sleeves, knee-length layered skirt', 'off-shoulder wrap, detached sleeves, short layered skirt'],
    m: ['high collar, full-length sleeves, layered trousers', 'wrapped open collar, sleeveless tunic, layered trousers'],
  },
  oni: {
    f: ['high collar, long wrap skirt, full-length sleeves', 'wrapped neckline, wide sleeves, knee-length overskirt', 'off-shoulder wrap, detached sleeves, short overskirt'],
    m: ['high collar, wide sleeves, wrap-front trousers', 'open wrap collar, sleeveless vest, wrap-front trousers'],
  },
  fox: {
    f: ['high collar, long sleeves, floor-length layered skirt', 'wrapped neckline, flowing sleeves, knee-length layered skirt', 'off-shoulder neckline, detached sleeves, short layered skirt'],
    m: ['high collar, long sleeves, layered trousers', 'open wrap collar, sleeveless tunic, layered trousers'],
  },
};

function mixGarments(cfg) {
  const out = [], cuts = TF_MIX_CUTS[cfg.cut];
  for (const [style, designs] of Object.entries(cfg.designs)) {
    const firstLevel = Math.min(...designs.map(d => d.level));
    const rows = [{ en: 'Handmade', ko: '손수 만든', f: cfg.homeF, m: cfg.homeM, level: 0 },
      ...designs.map(d => ({ ...d, level: d.level === firstLevel ? 1 : d.level }))];
    rows.forEach((d, index) => {
      const lvl = d.level || 0, end = lvl === 0 ? ' F0' : '';
       cuts.f.forEach((cut, x) => {
         if (d.cutsF && !d.cutsF.includes(x)) return;
         const gown=/(?:^|\W)gown(?:\W|$)/i.test(d.en + ' ' + d.f);
         const shape=gown ? cut.replace(/(?:knee-length|short|ankle-length) ([\w -]*skirt)/i, 'floor-length $1') : cut;
         out.push([
        `${style}-${index}-f${x}`, `${d.en} · ${['modest', 'standard', 'bold'][x]}`,
        `${d.ko} · ${['단정형', '기본형', '과감형'][x]}`,
         `${d.f}, ${lvl === 0 ? TF_MIX_STYLES[style].home + ', ' : ''}${shape}`,
         `f${lvl}${end} gf x${x} s:${style} v:${cfg.id}-${style}-${index}${x === 0 ? ' n:high' : x === 2 ? ' n:low' : ''}${d.noBoots || /floor-length/i.test(shape) ? ' nb' : ''}`,
       ]);
       });
      const maleType = /tailcoat/.test(d.m) ? ['연미복', 'tailcoat'] : /robe/.test(d.m) ? ['로브', 'robe'] : /long coat/.test(d.m) ? ['롱 코트', 'long coat'] : /coat/.test(d.m) ? ['코트', 'coat'] : /jacket/.test(d.m) ? ['재킷', 'jacket'] : /tunic/.test(d.m) ? ['튜닉', 'tunic'] : ['의상', 'outfit'];
      const maleKo = d.ko.replace(/마녀/g, '마법사').replace(/설녀/g, '눈 정령').replace(/(?:드레스|가운|의상|분장)$/, maleType[0]);
      const maleEn = d.en.replace(/\bwitch\b/g, 'warlock').replace(/\bWitch\b/g, 'Warlock').replace(/\b[Ss]now woman\b/g, 'Snow spirit').replace(/(?:dress|gown|costume|outfit)$/, maleType[1]);
      cuts.m.forEach((cut, x) => out.push([
        `${style}-${index}-m${x}`, `${maleEn} · ${x ? 'bold' : 'modest / standard'}`,
        `${maleKo} · ${x ? '과감형' : '단정·기본형'}`,
        `${d.m}, ${lvl === 0 ? TF_MIX_STYLES[style].home + ', ' : ''}${cut}`,
        `f${lvl}${end} gm x${x ? '2' : '01'} s:${style}${x === 0 ? ' n:high' : ' n:low'}${d.noBoots ? ' nb' : ''}`,
      ]));
    });
  }
  return out;
}

function mixCostume(cfg) {
  const period = costume(cfg.id, cfg.en, cfg.ko, cfg.callNo, {
    tag: cfg.tag, tagM: cfg.tagM, tagReal: cfg.tagReal, tagRealM: cfg.tagRealM,
    colors: cfg.colors, need: cfg.need,
    items: { ...cfg.items, accessories: [...(cfg.items.accessories || []), ...TF_MIX_EYES.filter(row=>cfg.eyes.includes(row[0]))], garment: mixGarments(cfg) },
  });
  period.labelEn = cfg.displayEn || cfg.en;
  period.mixStyles = Object.keys(cfg.designs);
  period.mixMotifs = ['none', ...cfg.motifs];
  for (const it of period.slots.accessories) if (cfg.blend?.includes(it.id.slice((cfg.id + '-ac-').length))) it.blend = true;
  for (const it of period.slots.accessories) {
    const key=it.id.slice((cfg.id + '-ac-').length);
    if(TF_MIX_EYE_STYLES[key]) it.styles=TF_MIX_EYE_STYLES[key];
  }
  period.styleColors = Object.fromEntries(Object.entries(cfg.styleColors || {}).map(([style, colors]) => [style, tfExpandColors(colors)]));
  period.east = !!cfg.east;
  period.origin = cfg.origin || '';
  period.groupKo = cfg.east ? '동아시아 원형' : '조합 원형';
  period.groupEn = cfg.east ? 'East Asian Bases' : 'Mix Bases';
  if (cfg.names) Object.assign(period, cfg.names);
  return period;
}

const TF_MIX_PERIODS = [
  mixCostume({
    id: 'mx-witch', en: 'Witch', ko: '마녀', callNo: 'M-01', cut: 'witch',
    names: { labelM: 'Warlock', labelKoM: '마법사' },
    tag: 'halloween costume, witch costume', tagM: 'halloween costume, warlock costume',
    tagReal: 'witch, halloween night', tagRealM: 'warlock, halloween night',
    homeF: 'hand-sewn witch dress, fitted waist', homeM: 'hand-sewn warlock coat, fitted waist',
    colors: ['black', 'deep purple', 'midnight blue', 'burgundy', 'forest green', 'wine'],
    styleColors: { gothic: ['black', 'wine', 'deep purple'], gothic_lolita: ['black', 'ivory', 'wine'], idol: ['deep purple', 'burgundy', 'midnight blue'], moe: ['lavender', 'pink', 'black'], battle: ['black', 'forest green', 'burgundy'], decadent: ['wine', 'black', 'plum'] },
    motifs: ['star', 'moon', 'rose', 'raven', 'candle', 'sigil', 'frost'],
    blend: ['cat', 'brooch'],
    eyes: ['lace-blindfold', 'blindfold', 'eyepatch'],
    need: { headwear: '' },
    designs: {
      gothic: [
        { en: 'Velvet witch dress', ko: '벨벳 마녀 드레스', level: 1, f: 'witch dress, velvet bodice, pleated overskirt, narrow lace panels', m: 'warlock coat, velvet lapels, pleated side panels' },
        { en: 'Draped witch gown', ko: '드레이프 마녀 가운', level: 2, f: 'witch gown, sculpted waist, draped panels, scalloped hem', m: 'warlock tailcoat, sculpted waistcoat, scalloped side panels' },
      ],
      gothic_lolita: [
        { en: 'Pintucked witch dress', ko: '핀턱 마녀 의상', level: 1, f: 'gothic lolita witch dress, pintucked bodice, gathered bell overskirt, narrow lace trim', m: 'gothic-inspired warlock tailcoat, pintucked waistcoat, layered coat panels, narrow lace trim' },
        { en: 'Tiered witch dress', ko: '겹치마 마녀 의상', level: 2, f: 'gothic lolita witch dress, fitted bodice, tiered bell overskirt, decorative ribbon seams', m: 'gothic-inspired warlock coat, fitted waistcoat, tiered coat panels, ribbon seams' },
      ],
      occult: [
        { en: 'Ritual witch outfit', ko: '의식풍 마녀 의상', level: 1, f: 'witch dress, layered apron panels, stitched geometric symbols', m: 'warlock coat, layered apron panels, stitched geometric symbols' },
        { en: 'Oracle witch outfit', ko: '예언풍 마녀 의상', level: 2, f: 'witch gown, folded bodice, wide ribbon seams, embroidered symbols', m: 'warlock robe, folded waistcoat, wide ribbon seams, embroidered symbols' },
      ],
      moe: [
        { en: 'Ribbon witch outfit', ko: '리본 마녀 의상', level: 1, f: 'witch dress, bow-front bodice, tiered ruffles', m: 'warlock jacket, bow-front vest, tiered side panels' },
        { en: 'Puff-sleeve witch outfit', ko: '퍼프 소매 마녀 의상', level: 2, f: 'witch dress, rounded bodice, rosette buttons, layered flounces', m: 'warlock coat, rounded waistcoat, rosette buttons, layered side panels' },
      ],
      battle: [
        { en: 'Field witch outfit', ko: '전투 마녀 의상', level: 1, f: 'witch outfit, cropped fitted jacket, laced bodice, split overskirt', m: 'warlock outfit, cropped fitted jacket, laced waistcoat, split coat tails' },
        { en: 'Armored witch outfit', ko: '갑주 마녀 의상', level: 2, f: 'witch outfit, reinforced bodice, asymmetrical layered panels, leather shoulder guards', m: 'warlock outfit, reinforced waistcoat, asymmetrical coat panels, leather shoulder guards' },
      ],
      idol: [
        { en: 'Stage witch outfit', ko: '무대 마녀 의상', level: 1, f: 'witch stage dress, fitted vest bodice, pleated overskirt, ribbon buttons', m: 'warlock stage jacket, fitted vest, pleated coat tails, ribbon buttons' },
        { en: 'Show witch outfit', ko: '쇼 마녀 의상', level: 2, f: 'witch stage dress, sparkling bead trim, angular waist panels, layered flounces', m: 'warlock stage coat, sparkling bead trim, angular waist panels, layered tails' },
      ],
      decadent: [
        { en: 'Faded witch gown', ko: '바랜 마녀 가운', level: 1, f: 'witch gown, soft velvet bodice, loose draped panels, frayed ribbon trim', m: 'warlock coat, soft velvet lapels, loose draped panels, frayed ribbon trim' },
        { en: 'Midnight witch gown', ko: '한밤 마녀 가운', level: 2, f: 'witch gown, satin panels, gathered waist, trailing uneven hem', m: 'warlock long coat, satin panels, gathered waist, trailing uneven tails' },
      ],
    },
    items: {
      structure: [['lace', 'Laced waist belt', '끈 허리띠', 'wide lace-up waist belt', ''], ['vials', 'Potion belt', '약병 벨트', 'belt with small potion vials', 's:occult'], ['field', 'Tool belt', '도구 벨트', 'belt with small spell pouches', 's:battle']],
      foundation: [['stripe', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'gf'], ['sheer', 'Sheer tights', '비치는 타이츠', 'sheer tights', 'gf'], ['knee', 'Kneehigh socks', '니삭스', 'kneehigh socks', 'gf']],
      neckwear: [['choker', 'Velvet choker', '벨벳 초커', 'velvet choker', 'an:high'], ['ribbon', 'Neck ribbon', '목 리본', 'wide neck ribbon', 'an:high'], ['gem', 'Gem pendant', '보석 펜던트', 'gem pendant', '']],
      outer: [['cape', 'Short shoulder cape', '짧은 어깨 망토', 'short shoulder cape', ''], ['sleeves', 'Detached sleeves', '분리 소매', 'detached sleeves with pointed cuffs', 's:battle'], ['shawl', 'Draped shawl', '두른 숄', 'shawl draped over the shoulders', 's:decadent']],
      footwear: [['boot', 'Lace-up boots', '끈 부츠', 'lace-up boots', ''], ['heel', 'Buckled heels', '버클 구두', 'buckled heels', 'gf'], ['ankle', 'Ankle boots', '앵클 부츠', 'ankle boots', '']],
      headwear: [['point', 'Pointed witch hat', '뾰족 마녀 모자', 'pointed witch hat', ''], ['tilt', 'Tilted witch hat', '기울인 마녀 모자', 'small tilted witch hat', ''], ['ribbon', 'Ribbon witch hat', '리본 마녀 모자', 'witch hat with a wide ribbon', 's:moe']],
      accessories: [['gloves', 'Long gloves', '긴 장갑', 'long gloves', ''], ['brooch', 'Gem brooch', '보석 브로치', 'gem brooch', ''], ['book', 'Spell book case', '주문서 가방', 'small spell book case at the hip', 's:occult'], ['cat', 'Black cat companion', '곁에 있는 검은 고양이', 'a real black cat sitting beside the witch', 'c:animal']],
      weapon: [['wand', 'Wand', '지팡이', 'holding a short magic wand', ''], ['broom', 'Broom', '빗자루', 'holding a broom', ''], ['staff', 'Ceremonial staff', '장식 지팡이', 'holding a ceremonial staff', 's:occult'], ['sword', 'Practice sword', '연습 검', 'holding a blunt practice sword', 's:battle']],
      device: [['star', 'Star cheek paint', '별 볼 분장', 'small star painted on the cheek', ''], ['moon', 'Crescent cheek paint', '초승달 볼 분장', 'small crescent moon painted on the cheek', ''], ['hands', 'Painted hand sigils', '손등에 그린 마법 문양', 'small magic sigils painted on the backs of the hands', 's:occult c:bodypaint']],
    },
  }),
  mixCostume({
    id: 'mx-devil', en: 'Devil', ko: '악마', callNo: 'M-02', cut: 'devil',
    tag: 'halloween costume, devil costume', tagReal: 'devil, halloween night',
    homeF: 'hand-sewn devil dress, fitted waist', homeM: 'hand-sewn devil jacket, fitted waist',
    colors: ['red', 'crimson', 'black', 'deep purple', 'burgundy', 'pink'],
    styleColors: { idol: ['red', 'pink', 'deep purple'], gothic: ['black', 'wine', 'crimson'], gothic_lolita: ['black', 'crimson', 'ivory'], battle: ['crimson', 'black', 'deep purple'], moe: ['pink', 'red', 'lavender'], decadent: ['wine', 'black', 'burgundy'] },
    motifs: ['star', 'moon', 'rose', 'flame', 'sigil', 'candle'],
    blend: ['wings', 'tail', 'bat'],
    eyes: ['lace-blindfold', 'blindfold'],
    need: { headwear: '' },
    designs: {
      idol: [
        { en: 'Devil stage costume', ko: '악마 무대 의상', level: 1, f: 'devil stage dress, short tailcoat bodice, bow at the chest, pleated overskirt', m: 'devil stage jacket, short tailcoat, bow at the chest, pleated tails' },
        { en: 'Devil show costume', ko: '악마 쇼 의상', level: 2, f: 'devil stage dress, pointed lapels, glossy buttons, layered fan-shaped skirt', m: 'devil stage suit, pointed lapels, glossy buttons, layered coat tails' },
      ],
      gothic: [
        { en: 'Devil velvet dress', ko: '악마 벨벳 의상', level: 1, f: 'devil dress, velvet bodice, sharp shoulder line, scalloped overskirt', m: 'devil coat, velvet lapels, sharp shoulder line, scalloped tails' },
        { en: 'Devil evening gown', ko: '악마 야회 의상', level: 2, f: 'devil evening gown, satin bodice, asymmetrical draped panels', m: 'devil evening coat, satin waistcoat, asymmetrical draped panels' },
      ],
      gothic_lolita: [
        { en: 'Frilled devil dress', ko: '프릴 악마 의상', level: 1, f: 'gothic lolita devil dress, fitted waist, bell overskirt, pointed lace panels', m: 'gothic-inspired devil tailcoat, fitted waistcoat, pointed lace panels' },
        { en: 'Ribbon devil dress', ko: '리본 악마 의상', level: 2, f: 'gothic lolita devil dress, layered ruffle overskirt, narrow ribbon trim, sculpted waist', m: 'gothic-inspired devil coat, layered tails, narrow ribbon trim, sculpted waistcoat' },
      ],
      battle: [
        { en: 'Devil fighter costume', ko: '악마 전투 의상', level: 1, f: 'devil costume, fitted vest, angular waist guards, split overskirt', m: 'devil costume, fitted vest, angular waist guards, split coat tails' },
        { en: 'Devil commander costume', ko: '악마 지휘 의상', level: 2, f: 'devil costume, reinforced bodice, pointed shoulder guards, layered waist panels', m: 'devil costume, reinforced waistcoat, pointed shoulder guards, layered coat panels' },
      ],
      moe: [{ en: 'Ribbon devil costume', ko: '리본 악마 의상', level: 1, f: 'devil dress, rounded collar, gathered bodice, layered ruffles', m: 'devil jacket, rounded collar, gathered waistcoat, layered side ruffles' }],
      decadent: [{ en: 'Fallen devil costume', ko: '퇴폐 악마 의상', level: 2, f: 'devil gown, slouching velvet bodice, uneven satin panels, faded rose trim', m: 'devil coat, slouching velvet lapels, uneven satin panels, faded rose trim' }],
      occult: [{ en: 'Sigil devil costume', ko: '문양 악마 의상', level: 1, f: 'devil dress, folded bodice, stitched geometric symbols, pointed overskirt', m: 'devil coat, folded waistcoat, stitched geometric symbols, pointed tails' }],
    },
    items: {
      structure: [['bow', 'Wide waist bow', '큰 허리 리본', 'wide waist bow', 's:idol'], ['belt', 'Pointed belt', '뾰족 장식 허리띠', 'belt with pointed tabs', ''], ['pouch', 'Small pouch belt', '작은 주머니 벨트', 'belt with small pouches', 's:battle']],
      foundation: [['stripe', 'Striped thighhighs', '줄무늬 사이하이', 'striped thighhighs', 'gf'], ['sheer', 'Sheer tights', '비치는 타이츠', 'sheer tights', 'gf']],
      neckwear: [['choker', 'Ribbon choker', '리본 초커', 'ribbon choker', 'an:high'], ['bow', 'Big neck bow', '큰 목 리본', 'big neck bow', 's:idol an:high'], ['gem', 'Gem pendant', '보석 펜던트', 'gem pendant', '']],
      outer: [['cape', 'Pointed short cape', '끝이 뾰족한 짧은 망토', 'short cape with pointed hem', ''], ['tails', 'Tailcoat', '연미 겉옷', 'short tailcoat', 's:idol'], ['shawl', 'Draped velvet shawl', '벨벳 숄', 'velvet shawl draped over the shoulders', 's:decadent']],
      footwear: [['boots', 'Tall boots', '긴 부츠', 'tall boots', ''], ['heels', 'Buckled heels', '버클 굽 구두', 'buckled heels', 'gf'], ['ankle', 'Ankle boots', '앵클 부츠', 'ankle boots', '']],
      headwear: [['horns', 'Horn headband', '뿔 머리띠', 'fake horns on a headband', ''], ['mini', 'Small horn headband', '작은 뿔 머리띠', 'small fake horns on a headband', 's:idol'], ['curl', 'Curved horn headband', '굽은 뿔 머리띠', 'curved fake horns on a headband', 's:gothic']],
      accessories: [['wings', 'Attached bat wings', '달아 놓은 박쥐 날개', 'fabric bat wings attached to the costume', ''], ['tail', 'Attached pointed tail', '달아 놓은 뾰족 꼬리', 'pointed fabric tail attached at the waist', ''], ['gloves', 'Long gloves', '긴 장갑', 'long gloves', ''], ['badge', 'Stage badge', '무대 장식 배지', 'shiny badge on the lapel', 's:idol'], ['bat', 'Bat companion', '곁에 있는 박쥐', 'a real small bat perched beside the devil', 'c:animal']],
      weapon: [['fork', 'Toy trident', '장난감 삼지창', 'holding a toy trident', ''], ['mic', 'Stage microphone', '무대 마이크', 'holding a stage microphone', 's:idol'], ['fan', 'Folding fan', '접이 부채', 'holding a folding fan', 's:decadent']],
      device: [['fangs', 'Painted fangs', '그린 송곳니', 'small fangs painted at the lips', ''], ['flame', 'Flame cheek paint', '불꽃 볼 분장', 'small flame painted on the cheek', '']],
    },
  }),
  mixCostume({
    id: 'mx-ghost', en: 'Ghost', ko: '유령', callNo: 'M-09', cut: 'ghost',
    tag: 'halloween costume, ghost costume', tagReal: 'ghost, halloween night',
    homeF: 'hand-sewn ghost dress, layered pale gauze', homeM: 'hand-sewn ghost coat, layered pale gauze',
    colors: ['ivory', 'white', 'silver', 'dusty grey', 'black', 'lavender'],
    styleColors: { gothic: ['black', 'ivory', 'silver'], gothic_lolita: ['ivory', 'black', 'dusty grey'], occult: ['silver', 'midnight blue', 'ivory'], moe: ['white', 'lavender', 'pastel pink'], decadent: ['dusty grey', 'ivory', 'wine'] },
    motifs: ['star', 'moon', 'rose', 'raven', 'candle', 'sigil', 'frost'],
    blend: ['brooch', 'locket'],
    eyes: ['lace-blindfold', 'blindfold'],
    designs: {
      gothic: [{ en: 'Mourning ghost costume', ko: '애도하는 유령 의상', level: 1, f: 'ghost dress, fitted velvet bodice, floating gauze panels, scalloped hem', m: 'ghost coat, fitted velvet vest, floating gauze panels, scalloped tails' }],
      gothic_lolita: [{ en: 'Lace ghost costume', ko: '레이스 유령 의상', level: 1, f: 'ghost dress, pintucked bodice, bell overskirt, translucent lace edging', m: 'ghost tailcoat, pintucked waistcoat, layered translucent lace tails' }],
      occult: [{ en: 'Seance ghost costume', ko: '강령회 유령 의상', level: 1, f: 'ghost dress, folded bodice, floating sheer panels, stitched ritual borders', m: 'ghost coat, folded waistcoat, floating sheer panels, stitched ritual borders' }],
      moe: [{ en: 'Ribbon ghost costume', ko: '리본 유령 의상', level: 1, f: 'ghost dress, rounded bodice, cloudlike layered skirt, soft ribbon fastenings', m: 'ghost jacket, rounded waistcoat, cloudlike layered tails, soft ribbon fastenings' }],
      decadent: [{ en: 'Faded ghost gown', ko: '바랜 유령 가운', level: 2, f: 'ghost gown, loose satin bodice, uneven translucent drapes, frayed hem', m: 'ghost long coat, loose satin lapels, uneven translucent drapes, frayed tails' }],
    },
    items: {
      structure: [['sash', 'Floating waist sash', '흐르는 허리띠', 'loose gauze sash at the waist', ''], ['ribbon', 'Faded ribbon belt', '바랜 리본 벨트', 'faded ribbon belt', 's:decadent']],
      foundation: [['tights', 'Pale opaque tights', '창백한 불투명 타이츠', 'pale opaque tights', 'gf'], ['stockings', 'Lace stockings', '레이스 스타킹', 'lace stockings', 'gf']],
      neckwear: [['ribbon', 'Mourning neck ribbon', '애도 리본', 'narrow ribbon at the throat', 'an:high'], ['pendant', 'Antique pendant', '낡은 펜던트', 'small antique pendant', '']],
      outer: [['shawl', 'Sheer shoulder shawl', '비치는 어깨 숄', 'sheer shawl draped over the shoulders', ''], ['cape', 'Torn-edge capelet', '찢어진 끝단의 짧은 망토', 'short capelet with ragged edges', 's:gothic']],
      footwear: [['slippers', 'Pale slippers', '창백한 슬리퍼', 'pale slippers', ''], ['shoes', 'Button shoes', '단추 구두', 'button shoes', ''], ['boots', 'Lace-up boots', '끈 부츠', 'lace-up boots', 's:gothic']],
      headwear: [['pin', 'Faded flower hairpin', '바랜 꽃 머리핀', 'faded flower hairpin', ''], ['mini', 'Small mourning hat', '작은 애도 모자', 'small mourning hat', 's:gothic'], ['bow', 'Sheer head bow', '비치는 머리 리본', 'sheer head bow', 's:moe']],
      accessories: [['brooch', 'Antique brooch', '낡은 브로치', 'antique brooch on the costume', ''], ['gloves', 'Sheer gloves', '비치는 장갑', 'sheer gloves', ''], ['locket', 'Old locket', '낡은 로켓 목걸이', 'small locket at the waist', '']],
      weapon: [['lantern', 'Ghost lantern', '유령 등불', 'holding a small dim lantern', ''], ['letter', 'Faded letter', '바랜 편지', 'holding a faded letter', '']],
      device: [['pale', 'Pale face paint', '창백한 얼굴 분장', 'pale face paint', ''], ['tear', 'Faint tear makeup', '희미한 눈물 분장', 'faint tear makeup below the eyes', '']],
    },
  }),
  mixCostume({
    id: 'mx-angel', en: 'Angel Mix', displayEn: 'Angel', ko: '천사', callNo: 'M-10', cut: 'angel',
    tag: 'halloween costume, angel costume', tagReal: 'angel, halloween night',
    homeF: 'hand-sewn angel dress, attached fabric wings', homeM: 'hand-sewn angel coat, attached fabric wings',
    colors: ['white', 'ivory', 'gold', 'silver', 'black', 'lavender'],
    styleColors: { gothic: ['black', 'silver', 'ivory'], gothic_lolita: ['white', 'ivory', 'black'], moe: ['white', 'lavender', 'pastel pink'], battle: ['white', 'silver', 'gold'], idol: ['white', 'gold', 'pastel pink'], decadent: ['ivory', 'dusty grey', 'black'] },
    motifs: ['star', 'moon', 'rose', 'raven', 'candle', 'sigil', 'flame', 'frost'],
    blend: ['wings', 'dove'],
    eyes: ['lace-blindfold', 'blindfold', 'eyepatch'],
    need: { headwear: '', accessories: 'wings' },
    designs: {
      gothic: [{ en: 'Gothic angel costume', ko: '고딕 천사 의상', level: 1, f: 'angel dress, dark lace bodice, pointed overskirt, feather-edged panels', m: 'angel coat, dark lace waistcoat, pointed tails, feather-edged panels' }],
      gothic_lolita: [{ en: 'Lace angel costume', ko: '레이스 천사 의상', level: 1, f: 'angel dress, pintucked bodice, bell overskirt, feather-shaped lace trim', m: 'angel tailcoat, pintucked waistcoat, feather-shaped lace trim' }],
      moe: [{ en: 'Ribbon angel costume', ko: '리본 천사 의상', level: 1, f: 'angel dress, rounded bodice, soft layered skirt, bow fastenings', m: 'angel jacket, rounded waistcoat, soft layered tails, bow fastenings' }],
      battle: [{ en: 'Guardian angel costume', ko: '수호 천사 의상', level: 1, f: 'angel costume, fitted fabric cuirass, split overskirt, padded shoulder guards', m: 'angel costume, fitted fabric cuirass, split coat panels, padded shoulder guards' }],
      idol: [{ en: 'Stage angel costume', ko: '무대 천사 의상', level: 1, f: 'angel stage dress, fitted vest bodice, pleated overskirt, glossy ribbon trim', m: 'angel stage jacket, fitted vest, pleated tails, glossy ribbon trim' }],
      decadent: [{ en: 'Fallen angel gown', ko: '타락 천사 가운', level: 2, f: 'angel gown, loose velvet bodice, faded feather trim, uneven satin drapes', m: 'angel long coat, loose velvet lapels, faded feather trim, uneven satin drapes' }],
    },
    items: {
      structure: [['sash', 'Feathered waist sash', '깃털 허리띠', 'feather-trimmed waist sash', ''], ['belt', 'Guard belt', '수호자 벨트', 'shaped guard belt', 's:battle']],
      foundation: [['tights', 'Pale tights', '밝은 타이츠', 'pale opaque tights', 'gf'], ['greaves', 'Fabric greaves', '천 정강이 갑주', 'fabric greaves', 's:battle']],
      neckwear: [['pendant', 'Small pendant', '작은 펜던트', 'small pendant at the throat', ''], ['ribbon', 'Neck ribbon', '목 리본', 'neck ribbon', 'an:high']],
      outer: [['cape', 'Short feather cape', '짧은 깃털 망토', 'short feather-edged cape over the wings', ''], ['sleeves', 'Detached feather sleeves', '분리 깃털 소매', 'sleeveless feather-trimmed shoulder pieces', 's:battle']],
      footwear: [['shoes', 'Strapped shoes', '끈 구두', 'strapped shoes', ''], ['boots', 'Guardian boots', '수호자 부츠', 'guardian costume boots', 's:battle'], ['heels', 'Ribbon heels', '리본 굽 구두', 'ribbon heels', 'gf']],
      headwear: [['halo', 'Halo headband', '후광 머리띠', 'lightweight halo headband', ''], ['crown', 'Small feather crown', '작은 깃털 관', 'small feather crown', 's:gothic'], ['bow', 'Winged head bow', '날개 머리 리본', 'winged head bow', 's:moe']],
      accessories: [['wings', 'Attached angel wings', '달아 놓은 천사 날개', 'fabric angel wings attached at the back', ''], ['gloves', 'Short gloves', '짧은 장갑', 'short gloves', ''], ['brooch', 'Feather brooch', '깃털 브로치', 'feather-shaped brooch', ''], ['dove', 'White dove companion', '곁에 있는 흰 새', 'a real white dove perched beside the angel', 'c:animal']],
      weapon: [['harp', 'Small harp prop', '작은 하프 소품', 'holding a small harp prop', ''], ['sword', 'Blunt guardian sword', '날 없는 수호 검', 'holding a blunt costume sword', 's:battle'], ['mic', 'Stage microphone', '무대 마이크', 'holding a stage microphone', 's:idol']],
      device: [['feather', 'Feather cheek paint', '깃털 볼 분장', 'small feather painted on the cheek', '']],
    },
  }),
  mixCostume({
    id: 'mx-deity', en: 'Deity', ko: '신 / 여신', callNo: 'M-03', cut: 'deity',
    names: { labelF: 'Goddess', labelKoF: '여신', labelM: 'God', labelKoM: '신' },
    tag: 'halloween costume, mythological goddess costume', tagM: 'halloween costume, mythological god costume',
    tagReal: 'mythological goddess, halloween night', tagRealM: 'mythological god, halloween night',
    homeF: 'hand-draped mythological costume, tied waist', homeM: 'hand-draped mythological costume, tied waist',
    colors: ['ivory', 'white', 'gold', 'silver', 'midnight blue', 'wine'],
    styleColors: { gothic: ['black', 'wine', 'silver'], gothic_lolita: ['ivory', 'black', 'wine'], battle: ['ivory', 'gold', 'midnight blue'], idol: ['white', 'gold', 'pastel pink'], decadent: ['wine', 'black', 'champagne'], moe: ['white', 'lavender', 'pastel pink'], occult: ['midnight blue', 'silver', 'deep purple'] },
    motifs: ['star', 'moon', 'rose', 'raven', 'candle', 'sigil', 'flame'],
    blend: ['bracelets'],
    eyes: ['lace-blindfold', 'blindfold'],
    need: { headwear: '' },
    designs: {
      gothic: [{ en: 'Gothic deity costume', ko: '고딕 신화 의상', level: 1, f: 'mythological costume, fitted draped bodice, pointed layered panels, dark lace trim', m: 'mythological costume, fitted draped tunic, pointed layered panels, dark lace trim' }],
      gothic_lolita: [{ en: 'Lace deity costume', ko: '레이스 신화 의상', level: 1, f: 'mythological costume, pintucked bodice, bell overskirt, narrow lace edging', m: 'mythological costume, pintucked waistcoat, layered coat panels, narrow lace edging' }],
      battle: [{ en: 'Armored deity costume', ko: '갑주 신화 의상', level: 2, f: 'mythological costume, molded chest guard, layered waist drapes, decorative shoulder plates', m: 'mythological costume, molded chest guard, layered waist drapes, decorative shoulder plates' }],
      idol: [{ en: 'Stage deity costume', ko: '무대 신화 의상', level: 1, f: 'mythological stage costume, fitted draped bodice, pleated overskirt, glossy ribbon trim', m: 'mythological stage costume, fitted draped tunic, pleated coat panels, glossy ribbon trim' }],
      decadent: [{ en: 'Faded deity costume', ko: '바랜 신화 의상', level: 2, f: 'mythological costume, loose satin drapes, folded waist panels, wilted flower trim', m: 'mythological costume, loose satin drapes, folded waist panels, wilted flower trim' }],
      moe: [{ en: 'Ribbon deity costume', ko: '리본 신화 의상', level: 1, f: 'mythological costume, rounded bodice, soft gathered drapes, ribbon clasps', m: 'mythological costume, rounded tunic, soft gathered drapes, ribbon clasps' }],
      occult: [{ en: 'Oracle deity costume', ko: '예언 신화 의상', level: 1, f: 'mythological costume, layered draped bodice, geometric embroidered panels', m: 'mythological costume, layered draped tunic, geometric embroidered panels' }],
    },
    items: {
      structure: [['sash', 'Draped sash', '드레이프 허리띠', 'draped waist sash', ''], ['belt', 'Decorative belt', '장식 허리띠', 'belt with metal clasps', '']],
      foundation: [['tights', 'Sheer tights', '비치는 타이츠', 'sheer tights', 'gf'], ['wrap', 'Leg wraps', '다리 천 감기', 'fabric leg wraps', '']],
      neckwear: [['pendant', 'Stone pendant', '돌 펜던트', 'stone pendant', ''], ['collar', 'Decorative collar', '장식 깃', 'wide decorative collar', 'an:high']],
      outer: [['cape', 'Shoulder cape', '어깨 망토', 'shoulder cape with folded edges', ''], ['drape', 'Long back drape', '긴 등 천자락', 'long fabric drape from the shoulders', '']],
      footwear: [['sandals', 'Strapped sandals', '끈 샌들', 'strapped sandals', ''], ['boots', 'Ceremonial boots', '장식 부츠', 'decorative boots', 's:battle']],
      headwear: [['circlet', 'Simple circlet', '얇은 머리 장식', 'thin metal circlet', ''], ['laurel', 'Laurel headpiece', '월계 머리 장식', 'laurel headpiece', ''], ['halo', 'Costume halo', '소품 후광', 'lightweight halo headpiece', 'f1']],
      accessories: [['bracelets', 'Arm bracelets', '팔 장식', 'metal arm bracelets', ''], ['gloves', 'Long gloves', '긴 장갑', 'long gloves', ''], ['brooch', 'Cloak brooch', '망토 브로치', 'brooch at the shoulder', '']],
      weapon: [['scepter', 'Scepter', '홀', 'holding a decorative scepter', ''], ['lantern', 'Lantern', '등불', 'holding a small lantern', ''], ['shield', 'Decorative shield', '장식 방패', 'holding a decorative shield', 's:battle'], ['mic', 'Stage microphone', '무대 마이크', 'holding a stage microphone', 's:idol']],
      device: [['temple', 'Temple markings', '관자놀이 분장', 'fine markings at the temples', ''], ['glitter', 'Cheek glitter', '볼 반짝이', 'glitter on the cheeks', '']],
    },
  }),
  mixCostume({
    id: 'mx-knight', en: 'Fantasy Knight', ko: '판타지 기사', callNo: 'M-04', cut: 'knight',
    tag: 'halloween costume, fantasy knight costume', tagReal: 'fantasy knight, halloween night',
    homeF: 'handmade knight costume, padded fabric cuirass', homeM: 'handmade knight costume, padded fabric cuirass',
    colors: ['black', 'silver', 'navy', 'crimson', 'white', 'forest green'],
    styleColors: { battle: ['silver', 'navy', 'crimson'], gothic: ['black', 'wine', 'silver'], decadent: ['black', 'burgundy', 'dusty grey'] },
    motifs: ['star', 'moon', 'rose', 'raven', 'flame', 'sigil'],
    blend: ['brooch', 'medal'],
    eyes: ['eyepatch'],
    designs: {
      battle: [
        { en: 'Knight costume', ko: '기사 분장', level: 1, f: 'fantasy knight costume, fitted fabric cuirass, layered shoulder guards, split tabard', m: 'fantasy knight costume, fitted fabric cuirass, layered shoulder guards, split tabard' },
        { en: 'Ceremonial knight costume', ko: '의장 기사 분장', level: 2, f: 'fantasy knight costume, sculpted chest plate, shaped waist guards, layered tabard', m: 'fantasy knight costume, sculpted chest plate, shaped waist guards, layered tabard' },
      ],
      gothic: [{ en: 'Gothic knight costume', ko: '고딕 기사 분장', level: 1, f: 'fantasy knight costume, dark velvet tabard, pointed shoulder guards, fitted cuirass', m: 'fantasy knight costume, dark velvet tabard, pointed shoulder guards, fitted cuirass' }],
      decadent: [{ en: 'Faded knight costume', ko: '바랜 기사 분장', level: 2, f: 'fantasy knight costume, worn velvet tabard, tarnished decorative plates, loose draped panels', m: 'fantasy knight costume, worn velvet tabard, tarnished decorative plates, loose draped panels' }],
    },
    items: {
      structure: [['belt', 'Tabard belt', '태버드 허리띠', 'wide belt around the tabard', ''], ['guard', 'Waist guards', '허리 갑주', 'decorative waist guards', 'f1']],
      foundation: [['tights', 'Opaque tights', '불투명 타이츠', 'opaque tights', 'gf'], ['greaves', 'Costume greaves', '소품 정강이 갑주', 'costume greaves', 'f1']],
      neckwear: [['scarf', 'Neck scarf', '목 스카프', 'short neck scarf', 'an:high'], ['collar', 'Standing collar', '세운 깃', 'standing fabric collar', 'an:high']],
      outer: [['cape', 'Knight cape', '기사 망토', 'short knight cape', ''], ['mantle', 'Draped mantle', '드레이프 망토', 'mantle draped over the shoulders', 's:decadent']],
      footwear: [['boots', 'Riding boots', '승마 부츠', 'riding boots', ''], ['ankle', 'Buckled ankle boots', '버클 앵클 부츠', 'buckled ankle boots', '']],
      headwear: [['circlet', 'Metal circlet', '금속 머리띠', 'thin metal circlet', ''], ['plume', 'Plumed costume helmet', '깃 달린 소품 투구', 'costume helmet with a small plume', 'f1 c:mask']],
      accessories: [['gloves', 'Gauntlet gloves', '건틀릿 장갑', 'costume gauntlet gloves', ''], ['brooch', 'Cape brooch', '망토 브로치', 'brooch at the shoulder', ''], ['medal', 'Decorative medal', '장식 메달', 'decorative medal on the tabard', '']],
      weapon: [['sword', 'Blunt costume sword', '날 없는 소품 검', 'holding a blunt costume sword', ''], ['shield', 'Lightweight shield', '가벼운 소품 방패', 'holding a lightweight costume shield', ''], ['banner', 'Small banner', '작은 깃발', 'holding a small banner', '']],
      device: [['stripe', 'Cheek stripe', '볼 줄 분장', 'painted stripe across one cheek', ''], ['dust', 'Dusty face paint', '먼지 얼굴 분장', 'dusty face paint', '']],
    },
  }),
  mixCostume({
    id: 'mx-doll', en: 'Haunted Doll', ko: '인형', callNo: 'M-05', cut: 'doll',
    tag: 'halloween costume, haunted doll costume', tagReal: 'haunted doll, halloween night',
    homeF: 'hand-sewn doll dress, gathered waist', homeM: 'hand-sewn doll jacket, gathered waist',
    colors: ['ivory', 'black', 'pastel pink', 'lavender', 'burgundy', 'cream'],
    styleColors: { gothic: ['black', 'burgundy', 'ivory'], gothic_lolita: ['black', 'ivory', 'burgundy'], moe: ['pastel pink', 'cream', 'lavender'], decadent: ['ivory', 'dusty grey', 'wine'], occult: ['black', 'deep purple', 'ivory'] },
    motifs: ['star', 'moon', 'rose', 'raven', 'candle', 'sigil', 'frost'],
    blend: ['key', 'brooch'],
    eyes: ['lace-blindfold', 'blindfold'],
    need: { device: '' },
    designs: {
      gothic: [{ en: 'Porcelain doll outfit', ko: '도자기 인형 의상', level: 1, f: 'doll dress, paneled bodice, scalloped lace, stiff bell shape', m: 'doll jacket, paneled waistcoat, scalloped lace, stiff coat tails' }],
      gothic_lolita: [
        { en: 'Pintucked doll dress', ko: '핀턱 인형 의상', level: 1, f: 'gothic lolita doll dress, pintucked bodice, full bell overskirt, narrow lace edging', m: 'gothic-inspired doll tailcoat, pintucked waistcoat, full coat tails, narrow lace edging' },
        { en: 'Lace doll dress', ko: '레이스 인형 의상', level: 2, f: 'gothic lolita doll dress, layered scalloped overskirt, ribbon fastenings, fitted waist', m: 'gothic-inspired doll coat, layered scalloped tails, ribbon fastenings, fitted waistcoat' },
      ],
      moe: [
        { en: 'Ribbon doll outfit', ko: '리본 인형 의상', level: 1, f: 'doll dress, rounded bib, large waist bow, layered frills', m: 'doll jacket, rounded bib, large waist bow, layered side frills' },
        { en: 'Candy doll outfit', ko: '사탕 인형 의상', level: 2, f: 'doll dress, puffed bodice, rosette buttons, tiered flounces', m: 'doll coat, puffed waistcoat, rosette buttons, tiered tails' },
      ],
      decadent: [{ en: 'Faded doll outfit', ko: '바랜 인형 의상', level: 2, f: 'doll dress, faded velvet panels, uneven ribbons, softened bell shape', m: 'doll jacket, faded velvet panels, uneven ribbons, softened coat tails' }],
      occult: [{ en: 'Fortune doll outfit', ko: '점술 인형 의상', level: 1, f: 'doll dress, fitted bodice, card-shaped appliques, layered apron panels', m: 'doll coat, fitted waistcoat, card-shaped appliques, layered apron panels' }],
    },
    items: {
      structure: [['bow', 'Large waist bow', '큰 허리 리본', 'large waist bow', ''], ['buttons', 'Decorative button belt', '단추 허리띠', 'belt with decorative buttons', '']],
      foundation: [['tights', 'Opaque tights', '불투명 타이츠', 'opaque tights', 'gf'], ['stripe', 'Striped stockings', '줄무늬 스타킹', 'striped stockings', 'gf']],
      neckwear: [['collar', 'Lace collar', '레이스 깃', 'lace collar', 'an:high'], ['bow', 'Neck bow', '목 리본', 'neck bow', 'an:high']],
      outer: [['cape', 'Short doll cape', '짧은 인형 망토', 'short doll cape', ''], ['shawl', 'Frayed shoulder shawl', '해진 어깨 숄', 'frayed shawl draped over the shoulders', 's:decadent']],
      footwear: [['mary', 'Mary janes', '메리제인', 'mary janes', ''], ['boots', 'Button boots', '단추 부츠', 'button boots', '']],
      headwear: [['bow', 'Single head bow', '머리 리본 하나', 'single large head bow', ''], ['bonnet', 'Small bonnet', '작은 보닛', 'small bonnet', ''], ['headband', 'Lace headband', '레이스 머리띠', 'lace headband', '']],
      accessories: [['key', 'Wind-up key prop', '태엽 열쇠 소품', 'decorative wind-up key on the back of the costume', ''], ['gloves', 'Short gloves', '짧은 장갑', 'short gloves', ''], ['brooch', 'Heart brooch', '하트 브로치', 'heart-shaped brooch', '']],
      weapon: [['bear', 'Stuffed bear', '곰 인형', 'holding a worn stuffed bear', ''], ['book', 'Picture book', '그림책', 'holding an old picture book', '']],
      device: [['joints', 'Painted doll joints', '그린 인형 관절', 'doll joints painted on the skin', 'c:bodypaint'], ['cheeks', 'Round cheek paint', '동그란 볼 분장', 'round cheek paint, doll makeup', ''], ['cracks', 'Painted porcelain cracks', '그린 도자기 금', 'porcelain cracks painted on the face', 'f1']],
    },
  }),
  mixCostume({
    id: 'mx-yuki', en: 'Snow Woman', ko: '설녀', callNo: 'M-06', cut: 'snow', east: true, origin: 'JP',
    names: { labelM: 'Snow Spirit', labelKoM: '눈 정령' },
    tag: 'halloween costume, yuki-onna costume', tagM: 'halloween costume, snow spirit costume',
    tagReal: 'yuki-onna, halloween night', tagRealM: 'snow spirit, halloween night',
    homeF: 'hand-sewn snow spirit dress, layered wrap front', homeM: 'hand-sewn snow spirit robe, layered wrap front',
    colors: ['white', 'ivory', 'silver', 'sky blue', 'midnight blue', 'lavender'],
    styleColors: { gothic: ['white', 'silver', 'midnight blue'], moe: ['white', 'sky blue', 'lavender'], decadent: ['ivory', 'silver', 'dusty grey'] },
    motifs: ['frost', 'moon', 'star', 'candle'],
    blend: ['crystals'],
    eyes: ['lace-blindfold'],
    designs: {
      gothic: [{ en: 'Snow woman costume', ko: '설녀 분장', level: 1, f: 'snow woman costume, layered wrap dress, pointed shoulder drapes, frost-patterned trim', m: 'snow spirit costume, layered wrap robe, pointed shoulder drapes, frost-patterned trim' }],
      moe: [{ en: 'Ribbon snow costume', ko: '리본 눈 정령 의상', level: 1, f: 'snow woman costume, soft layered dress, ribbon fastenings, rounded overskirt', m: 'snow spirit costume, soft layered robe, ribbon fastenings, rounded coat panels' }],
      decadent: [{ en: 'Faded snow costume', ko: '바랜 눈 정령 의상', level: 2, f: 'snow woman costume, trailing satin panels, uneven translucent outer drape, loose sash', m: 'snow spirit costume, trailing satin panels, uneven translucent outer drape, loose sash' }],
    },
    items: {
      structure: [['sash', 'Wide fabric sash', '넓은 천 허리띠', 'wide fabric sash', ''], ['bow', 'Back bow', '등 리본', 'large bow at the waist', 's:moe']],
      foundation: [['tights', 'Pale tights', '옅은 타이츠', 'pale opaque tights', 'gf'], ['wrap', 'Leg wraps', '다리 천 감기', 'fabric leg wraps', '']],
      neckwear: [['crystal', 'Frost crystal pendant', '서리 결정 펜던트', 'frost crystal pendant', ''], ['scarf', 'Light scarf', '얇은 목도리', 'light scarf around the neck', 'an:high']],
      outer: [['cape', 'Snow shoulder cape', '눈 어깨 망토', 'short shoulder cape with frost trim', ''], ['drape', 'Trailing fabric drape', '긴 천자락', 'long fabric drape from the shoulders', 'f2']],
      footwear: [['boots', 'Soft boots', '부드러운 부츠', 'soft fabric boots', ''], ['slippers', 'Pale slippers', '옅은 슬리퍼', 'pale slippers', '']],
      headwear: [['pin', 'Snow crystal hairpin', '눈 결정 머리핀', 'single snow crystal hairpin', ''], ['circlet', 'Crystal circlet', '결정 머리띠', 'thin crystal circlet', '']],
      accessories: [['gloves', 'Long pale gloves', '옅은 긴 장갑', 'long pale gloves', ''], ['crystals', 'Frost crystal brooch', '서리 결정 브로치', 'frost crystal brooch', '']],
      weapon: [['fan', 'Frost fan', '서리 부채', 'holding a folding fan with frost patterns', ''], ['lantern', 'Snow lantern', '눈 등불', 'holding a small snow lantern', '']],
      device: [['pale', 'Pale face paint', '창백한 얼굴 분장', 'pale face paint', ''], ['frost', 'Frost cheek paint', '서리 볼 분장', 'frost pattern painted on the cheeks', '']],
    },
  }),
  mixCostume({
    id: 'mx-oni', en: 'Oni', ko: '오니', callNo: 'M-07', cut: 'oni', east: true, origin: 'JP',
    tag: 'halloween costume, oni costume', tagReal: 'oni, halloween night',
    homeF: 'hand-sewn oni costume, wrap-front tunic', homeM: 'hand-sewn oni costume, wrap-front tunic',
    colors: ['red', 'crimson', 'navy', 'black', 'deep purple', 'orange'],
    styleColors: { battle: ['crimson', 'navy', 'black'], moe: ['pastel pink', 'lavender', 'red'], gothic: ['black', 'wine', 'deep purple'], decadent: ['crimson', 'burgundy', 'charcoal'] },
    motifs: ['flame', 'moon', 'star', 'rose', 'sigil'],
    blend: ['tassel', 'arm'],
    eyes: ['eyepatch'],
    need: { headwear: '' },
    designs: {
      battle: [
        { en: 'Oni fighter costume', ko: '오니 전투 의상', level: 1, f: 'oni costume, fitted wrap-front tunic, patterned cloth panels, padded shoulder guards', m: 'oni costume, fitted wrap-front tunic, patterned cloth panels, padded shoulder guards' },
        { en: 'Oni champion costume', ko: '오니 투사 의상', level: 2, f: 'oni costume, reinforced wrap bodice, layered patterned panels, broad shoulder guards', m: 'oni costume, reinforced wrap vest, layered patterned panels, broad shoulder guards' },
      ],
      moe: [{ en: 'Ribbon oni costume', ko: '리본 오니 의상', level: 1, f: 'oni costume, rounded wrap bodice, tied ribbon panels, gathered overskirt', m: 'oni costume, rounded wrap vest, tied ribbon panels, gathered coat panels' }],
      gothic: [{ en: 'Velvet oni costume', ko: '벨벳 오니 의상', level: 2, f: 'oni costume, velvet wrap bodice, pointed waist panels, narrow patterned trim', m: 'oni costume, velvet wrap vest, pointed waist panels, narrow patterned trim' }],
      decadent: [{ en: 'Faded oni costume', ko: '바랜 오니 의상', level: 2, f: 'oni costume, worn satin wrap bodice, loose layered cloth, uneven patterned hem', m: 'oni costume, worn satin wrap vest, loose layered cloth, uneven patterned hem' }],
    },
    items: {
      structure: [['sash', 'Wide tied sash', '넓은 묶은 띠', 'wide tied sash', ''], ['belt', 'Patterned belt', '무늬 허리띠', 'patterned fabric belt', '']],
      foundation: [['wrap', 'Leg wraps', '다리 천 감기', 'fabric leg wraps', ''], ['tights', 'Opaque tights', '불투명 타이츠', 'opaque tights', 'gf']],
      neckwear: [['beads', 'Large bead necklace', '큰 구슬 목걸이', 'large bead necklace', ''], ['scarf', 'Short neck scarf', '짧은 목 스카프', 'short neck scarf', 'an:high']],
      outer: [['cape', 'Short patterned cape', '짧은 무늬 망토', 'short patterned cape', ''], ['sleeves', 'Detached wrap sleeves', '분리 소매', 'detached wrap sleeves', 's:battle']],
      footwear: [['boots', 'Lace-up boots', '끈 부츠', 'lace-up boots', ''], ['shoes', 'Cloth shoes', '천 신발', 'cloth shoes', '']],
      headwear: [['horns', 'Oni horn headband', '오니 뿔 머리띠', 'fake oni horns on a headband', ''], ['single', 'Single horn headband', '외뿔 머리띠', 'single fake horn on a headband', ''], ['mask', 'Oni mask lifted above face', '얼굴 위로 올린 오니 가면', 'oni mask lifted above the face', 'f1']],
      accessories: [['arm', 'Patterned arm guards', '무늬 팔 보호대', 'patterned cloth arm guards', ''], ['tassel', 'Tassel at the waist', '허리 술', 'large fabric tassel at the waist', ''], ['gloves', 'Fingerless gloves', '손가락 없는 장갑', 'fingerless gloves', 's:battle']],
      weapon: [['club', 'Foam club', '스펀지 방망이', 'holding a foam oni club', ''], ['lantern', 'Festival lantern', '축제 등불', 'holding a small paper lantern', ''], ['fan', 'Patterned fan', '무늬 부채', 'holding a patterned folding fan', 's:moe']],
      device: [['brow', 'Bold brow paint', '굵은 눈썹 분장', 'bold painted eyebrows', ''], ['fangs', 'Painted fangs', '그린 송곳니', 'small fangs painted at the lips', '']],
    },
  }),
  mixCostume({
    id: 'mx-gumiho', en: 'Nine-tailed Fox', ko: '구미호', callNo: 'M-08', cut: 'fox', east: true, origin: 'KR',
    tag: 'halloween costume, nine-tailed fox costume', tagReal: 'nine-tailed fox costume, halloween night',
    homeF: 'hand-sewn fox spirit dress, layered wrap front', homeM: 'hand-sewn fox spirit coat, layered wrap front',
    colors: ['ivory', 'white', 'red', 'crimson', 'black', 'gold'],
    styleColors: { occult: ['black', 'red', 'gold'], moe: ['ivory', 'pastel pink', 'white'], decadent: ['wine', 'ivory', 'black'], battle: ['crimson', 'black', 'gold'] },
    motifs: ['moon', 'star', 'rose', 'flame', 'sigil', 'frost'],
    blend: ['tails', 'brooch'],
    eyes: ['lace-blindfold', 'blindfold'],
    need: { headwear: '', accessories: 'tails' },
    designs: {
      occult: [{ en: 'Fox spirit costume', ko: '여우 정령 의상', level: 1, f: 'nine-tailed fox costume, folded wrap bodice, narrow embroidered panels, layered sash', m: 'nine-tailed fox costume, folded wrap vest, narrow embroidered panels, layered sash' }],
      moe: [{ en: 'Ribbon fox costume', ko: '리본 여우 의상', level: 1, f: 'nine-tailed fox costume, rounded wrap bodice, ribbon fastenings, soft layered panels', m: 'nine-tailed fox costume, rounded wrap vest, ribbon fastenings, soft layered panels' }],
      decadent: [{ en: 'Faded fox costume', ko: '바랜 여우 의상', level: 2, f: 'nine-tailed fox costume, draped velvet panels, loose sash, uneven folded layers', m: 'nine-tailed fox costume, draped velvet coat panels, loose sash, uneven folded layers' }],
      battle: [{ en: 'Fox fighter costume', ko: '여우 전투 의상', level: 2, f: 'nine-tailed fox costume, reinforced wrap bodice, fitted waist guards, split overskirt', m: 'nine-tailed fox costume, reinforced wrap vest, fitted waist guards, split coat panels' }],
    },
    items: {
      structure: [['sash', 'Layered sash', '겹친 허리띠', 'layered fabric sash', ''], ['belt', 'Tied waist belt', '묶은 허리띠', 'tied fabric waist belt', '']],
      foundation: [['tights', 'Opaque tights', '불투명 타이츠', 'opaque tights', 'gf'], ['wrap', 'Leg wraps', '다리 천 감기', 'fabric leg wraps', '']],
      neckwear: [['beads', 'Bead pendant', '구슬 펜던트', 'single bead pendant', ''], ['ribbon', 'Neck ribbon', '목 리본', 'neck ribbon', 'an:high']],
      outer: [['cape', 'Short fox cape', '짧은 여우 망토', 'short shoulder cape', ''], ['drape', 'Long back drape', '긴 등 천자락', 'long fabric drape from the shoulders', 'f2']],
      footwear: [['boots', 'Soft boots', '부드러운 부츠', 'soft boots', ''], ['shoes', 'Cloth shoes', '천 신발', 'cloth shoes', '']],
      headwear: [['ears', 'Fox ear headband', '여우 귀 머리띠', 'fake fox ears on a headband', ''], ['mask', 'Fox mask above face', '얼굴 위 여우 가면', 'fox mask lifted above the face', 'f1']],
      accessories: [['tails', 'Nine fabric tails', '달아 놓은 아홉 천 꼬리', 'nine fabric fox tails attached at the waist', ''], ['gloves', 'Long gloves', '긴 장갑', 'long gloves', ''], ['brooch', 'Fox bead brooch', '여우구슬 브로치', 'small round bead brooch', '']],
      weapon: [['orb', 'Fox bead prop', '여우구슬 소품', 'holding a luminous fox bead prop', ''], ['fan', 'Folding fan', '접이 부채', 'holding a folding fan', '']],
      device: [['whiskers', 'Fox whisker face paint', '여우 수염 분장', 'fine fox whiskers painted on the cheeks', ''], ['eyes', 'Eye-corner makeup', '눈꼬리 분장', 'painted lines at the outer corners of the eyes', '']],
    },
  }),
];

illustrated.periods.unshift(...TF_MIX_PERIODS);
for (const p of TF_MIX_PERIODS) {
  p.colors.forEach(color => { if (!illustrated.pools.colors.includes(color)) illustrated.pools.colors.push(color); });
}
for (const p of illustrated.periods) if (p.id.startsWith('js-')) { p.east = true; p.origin = 'CN'; }
