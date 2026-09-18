// Prompt Archive : Empyrean — astrolabe console
// Generator engine, Korean/English UI labels, locks, printing, and interactions.
// Data lives in data.js. Korean item names live on the items themselves (`k`), sector names on `labelKo`.

const $=s=>document.querySelector(s);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const locks={};
let selectLang="ko";

const selectI18n={
  labels:{
    ko:{
      collection:"컬렉션",
      period:"성좌 · 직역",
      gender:"성별",
      fidelity:"물성 척도",
      foundation:"안층",
      structure:"천체 구조",
      garment:"주 의복",
      neckwear:"목 · 깃",
      outer:"겉옷 · 망토",
      footwear:"발",
      headwear:"머리 · 관",
      accessories:"장신구",
      weapon:"손에 든 것",
      device:"주위를 도는 것",
      effect:"현상",
      detail:"디테일",
      color:"기본 색",
      accent:"포인트 색",
      other:"추가 태그",
      preset:"프리셋"
    },
    en:{
      collection:"COLLECTION",
      period:"REGISTER",
      gender:"GENDER",
      fidelity:"MATERIALITY",
      foundation:"INNER LAYER",
      structure:"ASTRAL FRAME",
      garment:"PRIMARY VESTMENT",
      neckwear:"COLLAR",
      outer:"MANTLE",
      footwear:"FOOTING",
      headwear:"CROWN",
      accessories:"REGALIA",
      weapon:"INSTRUMENT",
      device:"SATELLITE",
      effect:"PHENOMENON",
      detail:"DETAIL LEVEL",
      color:"BASE COLOR",
      accent:"ACCENT COLOR",
      other:"OTHER",
      preset:"PRESET"
    }
  },
  staticOptions:{
    collection:{
      ko:{constellate:"콘스텔레이트 · 성좌",orbital:"오비탈 · 궤도",apotheosis:"아포테오시스 · 승화",cross:"크로스 인덱스"},
      en:{constellate:"Constellate",orbital:"Orbital",apotheosis:"Apotheosis",cross:"Cross Index"}
    },
    gender:{
      ko:{Feminine:"여성",Masculine:"남성",Neutral:"중성"},
      en:{Feminine:"Feminine",Masculine:"Masculine",Neutral:"Neutral"}
    },
    fidelity:{
      ko:{Corporeal:"코포리얼 · 천과 금속",Marked:"마크드 · 성흔과 후광",Celestial:"셀레스철 · 궤도체",Ascendant:"어센던트 · 물성 상실"},
      en:{Corporeal:"Corporeal",Marked:"Marked",Celestial:"Celestial",Ascendant:"Ascendant"}
    },
    detail:{
      ko:{Simple:"간단",Medium:"보통",Max:"최대",Random:"랜덤"},
      en:{Simple:"Simple",Medium:"Medium",Max:"Max",Random:"Random"}
    }
  }
};

/* 색 이름 — 드롭다운 표기용. 프롬프트에는 영어가 들어간다. */
const colorKo=(typeof COLOR_KO!=='undefined')?COLOR_KO:{};
/* 항목·섹터의 한국어 이름은 data.js 의 `k` / `labelKo` 에서 시작 시 모은다 (buildKoMaps). */
const ID_KO={}, PERIOD_KO={};
const KO={"Cross Mix":"교차 혼합","None":"없음"};
const optionKo={};
function buildKoMaps(editions){
  for(const ed of editions){
    for(const per of ed.periods||[]){
      if(per.labelKo) PERIOD_KO[per.id]=per.labelKo;
      for(const items of Object.values(per.slots||{})) for(const it of items) if(it.k) ID_KO[it.id]=it.k;
    }
  }
}

/* Prompt Archive — engine
 * 에디션에 의존하지 않는 생성/필터 로직.
 * UI 는 셀렉트를 채우고(slotOptions) 고른 값으로 조합한다(composeFrom).
 */

const SLOT_ORDER = ['foundation','structure','garment','neckwear','outer','footwear','headwear','weapon','device','effect'];
/* 프롬프트에서 액세서리 뒤에 오는 슬롯 — 손에 든 것·떠 있는 것·화면 효과는 옷 다음에 읽힌다 */
const TAIL_SLOTS = ['weapon','device','effect'];
const GENDERS = ['feminine','masculine','neutral'];
const GENDER_CODE = { feminine:'f', masculine:'m', neutral:'u' };
const FIDELITY = { Corporeal:0, Marked:1, Celestial:2, Ascendant:3 };

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
  if(it.secondary && chosen.headwear && /\b(veil|mantilla|helmet|full-face)\b/i.test(chosen.headwear.p||'')) return false;
  /* 무기가 둘(양손 무기 + 다른 무기)이 되지 않게 — 액세서리 중 무기 cat 은 weapon 슬롯이 비어 있을 때만 */
  if(it.cat==='weapon' && chosen.weapon && chosen.weapon.p) return false;
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
      if(it.strict && edition.id === 'cross') continue;
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

  const body=[], tail=[];
  for(const slot of SLOT_ORDER){
    if(!schema.includes(slot)) continue;
    const it = lookup(slot, picked[slot]);
    if(it && it.p) (TAIL_SLOTS.includes(slot)?tail:body).push(it.p);
  }

  const accIds = [].concat(picked.accessories||[]);
  const accs = accIds.map(id=>lookup('accessories',id)).filter(Boolean).map(a=>a.p);
  accs.push(...tail);

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
  /* 같은 토큰이 두 번 들어가지 않게.
   * 항목 하나가 'a, b' 처럼 여러 절을 담기도 하므로 쉼표로 쪼갠 뒤 절 단위로 거른다.
   * 서로 다른 두 항목이 'articulated pistons' 같은 짧은 절을 공유해도 한 번만 남는다. */
  const seenTok=new Set();
  const dedup=[];
  for(const t of tokens){
    for(const clause of String(t).split(',')){
      const c=clause.trim();
      if(!c) continue;
      const k=c.toLowerCase();
      if(seenTok.has(k)) continue;
      seenTok.add(k); dedup.push(c);
    }
  }
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
      recipe={...base}; ['outer','headwear','footwear','accessories','weapon','device','effect','maxAccessories','maxDecorativeSlots'].forEach(k=>delete recipe[k]);
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

  /* 손·공중·화면 — 무기 / 부유 장치 / 이펙트. 레시피가 슬롯을 선언하면 그 목록만, 아니면 섹터 풀에서.
   * 확률은 selectionRules.slotChance. 셋 다 비어도 된다 (None). */
  for(const slot of TAIL_SLOTS){
    if(!schema.includes(slot) || picks[slot] || heldEmpty.has(slot)) continue;
    const chance=rules.slotChance?.[slot]??0.5;
    if(Math.random()>chance) continue;
    let pool=constrainedPool(edition,slot,state,recipe,chosen,activeFeatures);
    if(!pool.length && !(recipe && Object.prototype.hasOwnProperty.call(recipe,slot))){
      pool=slotOptionsRoll(edition,slot,state).filter(it=>compatible(it,chosen));
    }
    commit(slot,rand(pool));
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
          if(/necklace|pendant|choker|chain at the throat|brooch at the throat|collar/.test(t))return "neck";if(/bag|purse|reticule|pouch|case\b|holster/.test(t))return "bag";
          if(/tail\b/.test(t))return "tail";if(/wings?\b/.test(t))return "wings";if(/earring|earpiece|ear cuff/.test(t))return "ear";if(/belt\b|harness/.test(t))return "belt";return null;};
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
    id:'cross', label:'CROSS INDEX', volume:'PA·EMP·X', range:'cross-sector',
    slotLabels:{
      ko:{foundation:'언더레이어',structure:'오그먼트',garment:'주 의복',neckwear:'넥 · 칼라',outer:'겉옷 레이어',footwear:'신발',headwear:'머리 장식',accessories:'액세서리',weapon:'무기',device:'부유 장치',effect:'이펙트 · HUD'},
      en:{foundation:'UNDERLAYER',structure:'AUGMENT',garment:'MAIN GARMENT',neckwear:'NECK / COLLAR',outer:'OUTER LAYER',footwear:'FOOTWEAR',headwear:'HEADWEAR',accessories:'ACCESSORIES',weapon:'WEAPON',device:'FLOATING DEVICE',effect:'EFFECT / HUD'},
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
const ALL_SLOTS=['foundation','structure','garment','neckwear','outer','footwear','headwear','accessories','weapon','device','effect'];
const NONE_OPT={value:"",label:"None",id:""};
/* 랜덤에서 뺀 항목(⊘). 드롭다운에서는 여전히 고를 수 있다. localStorage 에 유지. */
const bans=new Set();
try{ (JSON.parse(localStorage.getItem("empyrean.bans")||"[]")).forEach(id=>bans.add(id)); }catch(e){}
function saveBans(){ try{localStorage.setItem("empyrean.bans",JSON.stringify([...bans]));}catch(e){} }
/* 카테고리 — 항목의 cat. 끄면 드롭다운·랜덤에서 모두 사라지고, 그 카테고리 가먼트뿐인 레시피도 빠진다. */
/* 무기·부유 장치·이펙트는 자기 슬롯이 있고 − 버튼으로 통째로 뺄 수 있으므로 필터 칩에 두지 않는다.
 * 그 슬롯 항목의 cat 값(weapon/device/effect)은 데이터 표기용으로만 남는다. */
const CATS=[
  {id:'astral',ko:'천체 · 궤도체',en:'Astral Bodies'},{id:'luminous',ko:'발광 · 비물질',en:'Luminous'},
  {id:'regalia',ko:'예장 · 관',en:'Regalia'},{id:'relic',ko:'성물 · 기기',en:'Relics'},
  {id:'mask',ko:'가면 · 면갑',en:'Masks'},
];
const CAT_ORDER=['','regalia','relic','astral','luminous','mask'];
const FILTER_CAT=id=>CATS.some(c=>c.id===id)?id:'';
const catsOff=new Set();
try{ (JSON.parse(localStorage.getItem("empyrean.catsOff")||"[]")).forEach(c=>catsOff.add(c)); }catch(e){}
function saveCats(){ try{localStorage.setItem("empyrean.catsOff",JSON.stringify([...catsOff]));}catch(e){} }
/* 예장이 아닌 주 의복에는 관·예장 계열을 붙이지 않는다 (Chrome 의 MILITARY 자리). */
const MILITARY=new Set(['regalia']);
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

const EDITIONS={constellate:constellate,orbital:orbital,apotheosis:apotheosis};
buildKoMaps([constellate,orbital,apotheosis]);
/* Cross Index — 섹터를 직접 체크한다. pseudo-period 하나(x-custom)의 mix·tag 를 체크 상태로 갱신. */
EDITIONS.cross=buildCrossEdition([constellate,orbital,apotheosis],[
  {id:'x-custom',label:'Cross Mix',years:'—',callNo:'X-00',tag:'',mix:'*'},
]);
/* 크로스 인덱스 칩 — '모든 섹터'(체크 전부 해제) 하나만 둔다. 조합 프리셋은 두지 않는다 (사용자가 직접 체크). */
const FANTASY_PRESETS=[
  {ko:'모든 섹터',en:'All sectors',ids:[]},
];
function fantasyChecked(){ return [...$("#periodMulti").selectedOptions].map(o=>o.value); }
function applyFantasyMix(){
  const x=EDITIONS.cross.periods.find(p=>p.id==='x-custom');
  const ids=fantasyChecked();
  x.mix=ids.length?ids:'*';
  const reals=EDITIONS.cross.periods.filter(p=>!p.mix&&ids.includes(p.id));
  x.tag=(ids.length&&ids.length<=3)?reals.map(p=>p.tag).join(', '):'';
  renderMulti('period');
}
function periodDisplay(){
  if($("#collection").value!=='cross') return $("#period").value||"ARCHIVE";
  const ids=fantasyChecked();
  if(!ids.length) return selectLang==='ko'?'모든 섹터':'ALL SECTORS';
  const ed=EDITIONS.cross;
  return ids.map(id=>{const p=ed.periods.find(p=>p.id===id);return label(p.label,{editionId:p._from,periodId:p.id});}).join(' + ');
}
function periodDisplayEnglish(){
  if($("#collection").value!=='cross') return currentPeriod()?.label||"ARCHIVE";
  const ids=fantasyChecked();
  if(!ids.length) return "ALL SECTORS";
  return ids.map(id=>EDITIONS.cross.periods.find(p=>p.id===id)?.label||id).join(' + ');
}

function currentPack(){return EDITIONS[$("#collection").value]}
function periodList(ed){return ed.id==='cross'?ed.periods.filter(p=>p.mix):ed.periods}
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

  if(itemId && ID_KO[itemId]) return ID_KO[itemId];
  if(periodId && PERIOD_KO[periodId]) return PERIOD_KO[periodId];
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
    let opts=list.map((o,i)=>({value:o.id,label:o.t,id:o.id,secondary:!!o.secondary,group:FILTER_CAT(o.cat||''),
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
  if($("#collection").value==='cross') renderMulti('period');
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
  const isF=ed.id==='cross';
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
    if($("#collection").value==='cross'){
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

/* ---------------- HUD 오버레이 ----------------
 * 카드가 인쇄되는 대신, 설정 위로 HUD 가 전개된다.
 * 브래킷 → 스윕 → 타이핑. 타이핑 중 아무 데나 누르면 즉시 완성. */
let hudTimer=null;
let hudFull="";

function hudRunSweep(){
  const sw=document.querySelector(".hud-sweep");
  if(!sw) return;
  sw.classList.remove("run");
  void sw.offsetWidth;
  sw.classList.add("run");
}
function hudComplete(){
  if(hudTimer){clearInterval(hudTimer);hudTimer=null;}
  const el=$("#prompt");
  if(el.textContent!==hudFull) el.textContent=hudFull;
  $("#sheet").classList.remove("typing");
}
function hudType(text){
  hudFull=text;
  const el=$("#prompt"),sheet=$("#sheet");
  if(hudTimer){clearInterval(hudTimer);hudTimer=null;}
  el.textContent="";
  el.scrollTop=0;
  sheet.classList.add("typing");
  const tick=26;
  const total=Math.min(900,Math.max(600,text.length*4));
  const steps=Math.max(1,Math.round(total/tick));
  const chunk=Math.max(1,Math.ceil(text.length/steps));
  let i=0;
  hudTimer=window.setInterval(()=>{
    i+=chunk;
    el.textContent=text.slice(0,i);
    el.scrollTop=el.scrollHeight;
    if(i>=text.length) hudComplete();
  },tick);
}

function openPrintedSheet({scroll=true}={}){
  const zone=$("#resultZone");
  const screen=document.querySelector(".screen");
  const wasOpen=zone.classList.contains("open");

  zone.classList.remove("closing");
  screen.classList.add("hud-on");

  if(!wasOpen){
    zone.classList.remove("open");
    void zone.offsetWidth;                 // 브래킷 애니메이션 재시작
    zone.classList.add("open");
  }
  hudRunSweep();

  if(scroll&&!wasOpen){
    window.setTimeout(()=>{
      const frame=document.querySelector(".screen-frame");
      if(frame) frame.scrollIntoView({behavior:"smooth",block:"start"});
    },60);
  }
}
function dismissHud(){
  const zone=$("#resultZone");
  if(!zone.classList.contains("open")) return;
  hudComplete();
  zone.classList.add("closing");
  $("#status").textContent="CARD WITHDRAWN";
  window.setTimeout(()=>{
    zone.classList.remove("open","closing");
    document.querySelector(".screen").classList.remove("hud-on");
  },200);
}

function transcribe(){
  if($("#detail").value==="Random") detailRoll=rand(["Simple","Medium","Medium","Max"]);
  const p=compose();

  $("#sheetTitle").textContent=`${periodDisplayEnglish().toUpperCase()} — ${$("#fidelity").value.toUpperCase()}`;
  const ed=currentPack(),per=currentPeriod();
  $("#sheetCode").textContent=`${ed.volume} · ${$("#collection").value==='cross'?'X-00':per.callNo} · ID ${String(serial++).padStart(4,"0")}`;
  $("#sheetMeta").innerHTML=`${$("#gender").value.toUpperCase()}<br>DETAIL: ${effectiveDetail().toUpperCase()}`;
  $("#status").textContent="TRANSCRIBED · CARD DRAWN";

  openPrintedSheet({scroll:true});
  hudType(p);
}
async function copyText(){
  hudComplete();
  const text=$("#prompt").textContent;
  try{await navigator.clipboard.writeText(text)}catch(e){
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();
  }
  const b=$("#copyBtn"),old=b.textContent;b.textContent="COPIED";setTimeout(()=>b.textContent=old,850);
}
function saveText(){
  hudComplete();
  const blob=new Blob([$("#prompt").textContent],{type:"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="prompt_archive_empyrean.txt";a.click();URL.revokeObjectURL(a.href);
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
try{ const v=localStorage.getItem("empyrean.coherent"); if(v!==null) coherentMix=v==="1"; }catch(e){}
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
    summary.textContent=chosen.length?periodDisplay():(ko?'모든 섹터':'All sectors');
    const pr=root.querySelector("#periodPresets");pr.innerHTML="";
    const coh=document.createElement("label");coh.className="multi-coherent";
    const cb=document.createElement("input");cb.type="checkbox";cb.checked=coherentMix;
    cb.addEventListener("change",()=>{coherentMix=cb.checked;try{localStorage.setItem("empyrean.coherent",coherentMix?"1":"0");}catch(e){}});
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
  items.sort((x,y)=>CAT_ORDER.indexOf(FILTER_CAT(x.cat||''))-CAT_ORDER.indexOf(FILTER_CAT(y.cat||'')));
  const allOn=items.every(it=>!bans.has(it.id));
  $("#banMenuAll").textContent=allOn?(ko?"전부 빼기":"Exclude all"):(ko?"전부 넣기":"Include all");
  $("#banMenuAll").onclick=()=>{items.forEach(it=>allOn?bans.add(it.id):bans.delete(it.id));saveBans();populateSlots();renderBanList();openBanMenu(slot);};
  let lastCat=null;
  for(const it of items){
    const g=FILTER_CAT(it.cat||'');
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
  if(o.collection==='cross'){setMulti('period',o.periods||[]);}else{$("#period").value=o.period;}
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
function loadPresets(){try{return JSON.parse(localStorage.getItem("empyrean.presets")||"{}");}catch(e){return {};}}
function savePresets(p){try{localStorage.setItem("empyrean.presets",JSON.stringify(p));}catch(e){}}
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
const searchHit=(it,lq)=>((it.t||"")+" "+(it.p||"")+" "+(it.k||ID_KO[it.id]||"")).toLowerCase().includes(lq);
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
  const ko=selectLang==='ko';
  if(!found.length){wrap.textContent=ko?`"${q}" — 이 컬렉션에 없습니다`:`"${q}" — not in this collection`;list.appendChild(wrap);return;}
  const head=document.createElement("div");head.className="search-empty-head";
  head.textContent=ko?`"${q}" — 현재 조건에는 없음. 누르면 그 섹터로 이동:`:`"${q}" — not under current settings. Click to jump:`;wrap.appendChild(head);
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


/* DISMISS — 드래그가 아니라 버튼. Esc 로도 닫힌다. */
const tearHandle=$("#tearHandle");
function finishTear(){ dismissHud(); }
tearHandle.addEventListener("click",e=>{e.stopPropagation();finishTear();});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&$("#resultZone").classList.contains("open")) finishTear();
});
/* 타이핑 중 본문을 누르면 즉시 완성 */
$("#prompt").addEventListener("click",()=>{if(hudTimer)hudComplete();});
$("#sheet").addEventListener("click",e=>{e.stopPropagation();});
/* HUD 바깥(어두워진 영역)을 눌러도 닫힌다 */
$("#resultZone").addEventListener("click",e=>{if(e.target===$("#resultZone"))finishTear();});

const modal=$("#helpModal");
const openHelp=()=>modal.classList.add("open");
const closeHelp=()=>modal.classList.remove("open");
$("#helpBtn").addEventListener("click",openHelp);
$("#helpClose").addEventListener("click",closeHelp);
$("#helpOk").addEventListener("click",closeHelp);
modal.addEventListener("click",e=>{if(e.target===modal)closeHelp()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeHelp()});
[constellate,orbital,apotheosis].forEach(validateRecipes);

updatePack();
applySelectLanguage();
rollSlotsOnly();

/* ─────────────────────────────────────────────────────────────
 * 장식용 — 상단 라이브 상태 라인. 생성 로직과 무관하며,
 * 요소가 없거나 실패해도 절대 던지지 않는다.
 * ───────────────────────────────────────────────────────────── */
(function netLine(){
  try{
    const g=id=>document.getElementById(id);
    const line=g("netLine"); if(!line) return;
    const SECTOR={constellate:"C-01",orbital:"O-01",apotheosis:"A-01",cross:"X-00"};
    const LEVEL={Corporeal:"LV.1",Marked:"LV.2",Celestial:"LV.3",Ascendant:"LV.4"};
    const BARS={Corporeal:"◦◦◦◦",Marked:"●◦◦◦",Celestial:"●●◦◦",Ascendant:"●●●◦"};
    const val=id=>{const el=g(id);return el?el.value:""};
    let cachedTotal=0;
    function countItems(){
      if(cachedTotal) return cachedTotal;
      try{
        let n=0;
        [typeof constellate!=="undefined"?constellate:null,
         typeof orbital!=="undefined"?orbital:null,
         typeof apotheosis!=="undefined"?apotheosis:null].forEach(ed=>{
          if(!ed) return;
          for(const per of ed.periods||[]) for(const arr of Object.values(per.slots||{})) n+=arr.filter(it=>it.t!=='None').length;
        });
        if(n>0){cachedTotal=n;return n}
      }catch(_){}
      let n=0;
      document.querySelectorAll(".field select").forEach(s=>{n+=s.options.length});
      return n;
    }
    function paint(){
      try{
        const col=val("collection"),fid=val("fidelity");
        const set=(id,t)=>{const el=g(id);if(el)el.textContent=t};
        set("netSector",SECTOR[col]||"S-00");
        set("netReality",LEVEL[fid]||"LV.1");
        set("netBars",BARS[fid]||"▮▮▯▯");
        const n=countItems();
        set("netItems",String(n).padStart(4,"0"));
        set("netHex","0x"+((n*7+(col?col.length:0)*29)&255).toString(16).toUpperCase().padStart(2,"0"));
      }catch(_){}
    }
    document.querySelectorAll(".field select,.field input,.multi-toggle").forEach(el=>{
      el.addEventListener("change",()=>window.setTimeout(paint,0));
      el.addEventListener("click",()=>window.setTimeout(paint,0));
    });
    ["shuffleBtn","transcribeBtn","reprintBtn"].forEach(id=>{
      const b=g(id); if(b) b.addEventListener("click",()=>window.setTimeout(paint,30));
    });
    document.querySelectorAll(".reroll").forEach(b=>b.addEventListener("click",()=>window.setTimeout(paint,30)));
    paint();
  }catch(_){}
})();

/* HUD 스캔 바 — 시트 높이에 맞춰 이동 거리를 잡아 준다(장식). */
(function hudScanFit(){
  try{
    const sheet=document.getElementById("sheet"); if(!sheet||!window.ResizeObserver) return;
    const fit=()=>{try{sheet.style.setProperty("--scanEnd",(sheet.clientHeight+8)+"px")}catch(_){}};
    new ResizeObserver(fit).observe(sheet);
    fit();
  }catch(_){}
})();
