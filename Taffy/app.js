// Prompt Archive : Taffy — trick-or-treat porch
// Generator engine, Korean/English UI labels, locks, the door and the candy, and interactions.
// Data lives in data.js. Korean item names live on the items themselves (`k`), costume names on `labelKo`.

const $=s=>document.querySelector(s);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const locks={};
let selectLang="ko";

const selectI18n={
  labels:{
    ko:{
      collection:"분장 유형",
      period:"분장",
      style:"의상 스타일",
      motif:"장식 문양",
      gender:"성별",
      fidelity:"완성도",
      exposure:"노출 정도",
      ...TF_SLOT_LABELS.ko,
      detail:"묘사 수준",
      color:"기본 색",
      accent:"포인트 색",
      other:"추가 태그",
      preset:"프리셋"
    },
    en:{
      collection:"COSTUME TYPE",
      period:"COSTUME",
      style:"OUTFIT STYLE",
      motif:"DECORATIVE MOTIF",
      gender:"GENDER",
      fidelity:"FINISH",
      exposure:"COVERAGE",
      ...TF_SLOT_LABELS.en,
      detail:"DETAIL",
      color:"BASE COLOR",
      accent:"ACCENT COLOR",
      other:"EXTRA TAGS",
      preset:"PRESET"
    }
  },
  staticOptions:{
    collection:{
      ko:Object.fromEntries(Object.entries(TF_COLLECTION_NAMES).map(([id,n])=>[id,n.ko])),
      en:Object.fromEntries(Object.entries(TF_COLLECTION_NAMES).map(([id,n])=>[id,n.en]))
    },
    gender:{
      ko:{Feminine:"여성",Masculine:"남성",Neutral:"중성"},
      en:{Feminine:"Feminine",Masculine:"Masculine",Neutral:"Neutral"}
    },
    fidelity:{
      ko:{Party:"파티 코스튬",Editorial:"화보",RealNight:"진짜가 된 밤"},
      en:{Party:"Party",Editorial:"Editorial",RealNight:"Real Night"}
    },
    exposure:{
      ko:{Covered:"단정",Classic:"기본",Daring:"과감"},
      en:{Covered:"Modest",Classic:"Standard",Daring:"Bold"}
    },
    detail:{
      ko:{Simple:"간결",Medium:"기본",Max:"상세",Random:"랜덤"},
      en:{Simple:"Concise",Medium:"Standard",Max:"Detailed",Random:"Random"}
    }
  }
};

/* 색 이름 — 드롭다운 표기용. 프롬프트에는 영어가 들어간다. */
const colorKo=(typeof COLOR_KO!=='undefined')?COLOR_KO:{};
/* 항목·분장의 한국어 이름은 data.js 의 `k` / `labelKo` 에서 시작 시 모은다 (buildKoMaps). */
const ID_KO={}, PERIOD_KO={}, PERIOD_EN={};
const KO={"Cross Mix":"고른 분장","None":"없음"};
const optionKo={};
function buildKoMaps(editions){
  for(const ed of editions){
    for(const per of ed.periods||[]){
      if(per.labelKo) PERIOD_KO[per.id]=per.labelKo;
      if(per.labelEn) PERIOD_EN[per.id]=per.labelEn;
      for(const items of Object.values(per.slots||{})) for(const it of items) if(it.k) ID_KO[it.id]=it.k;
    }
  }
}

/* Prompt Archive — engine
 * 에디션에 의존하지 않는 생성/필터 로직.
 * UI 는 셀렉트를 채우고(slotOptions) 고른 값으로 조합한다(composeFrom).
 */

/* 프롬프트 순서 — 의상이 먼저, 그 위에 걸친 것, 다리와 신발, 머리. 분장의 정체가 맨 앞에 와야 모델이 알아본다. */
const SLOT_ORDER = ['garment','structure','neckwear','outer','foundation','footwear','headwear','weapon','device'];
/* 프롬프트에서 액세서리 뒤에 오는 슬롯 — 손에 든 것 · 얼굴 분장은 옷 다음에 읽힌다. 장소(effect)는 쓰지 않는다 — 의상 프롬프트만 낸다 */
const TAIL_SLOTS = ['weapon','device'];
const GENDERS = ['feminine','masculine','neutral'];
const GENDER_CODE = { feminine:'f', masculine:'m', neutral:'u' };
const FIDELITY = { Party:1, Editorial:2, RealNight:3 };
/* 노출 — 척도와 따로 도는 축. 항목 · 레시피의 x 는 허용 단계 목록(없으면 전부). */
const EXPOSURE = { Covered:0, Classic:1, Daring:2 };
const exposureOk=(it,xv)=>xv===undefined||!it.x||it.x.includes(xv);

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
/* f 는 등급의 아래쪽 끝, fx 는 위쪽 끝. 진흙 묻은 밑단(fx:0)은 나들이 차림에 따라오지 않는다. */
const fantasyOk=(it,lv)=>(it.f||0)<=lv && (it.fx===undefined || lv<=it.fx);

/* 분장에 그 노출 단계가 없으면(천 유령의 Daring) 가까운 단계로 내려간다. 없으면 올라간다.
 * 레시피가 있고, 그 레시피가 허용하는 의상이 그 단계 · 성별 · 척도에 하나라도 있어야 '있다'고 본다. */
function exposureAvailable(period,xv,gender,lv){
  const gc=GENDER_CODE[gender]||'u';
  const garments=period.slots?.garment||[];
  return (period.recipes||[]).some(r=>
    (!r.g||r.g==='u'||gc==='u'||r.g===gc) && (r.f??0)<=lv && (r.fx===undefined||lv<=r.fx) && (!r.x||r.x.includes(xv)) &&
    (r.garment?garments.filter(i=>r.garment.includes(i.id)):garments).some(it=>genderOk(it,gender)&&fantasyOk(it,lv)&&exposureOk(it,xv)));
}
function clampExposure(period,xv,gender,lv){
  if(!period||period.mix) return xv;
  for(let x=xv;x>=0;x--) if(exposureAvailable(period,x,gender,lv)) return x;
  for(let x=xv+1;x<=2;x++) if(exposureAvailable(period,x,gender,lv)) return x;
  return xv;
}

function compatible(it,chosen){
  /* 주 의복–넥웨어 궁합. 가먼트의 neckline ('low' 오프숄더·데콜테 / 'high' 자체 하이칼라 / 'own' 자체 네크라인)
   * 과 넥웨어의 avoidNeck 이 겹치면 셔플에서 매칭하지 않는다. 드롭다운 수동 선택은 막지 않는다. */
  if(it.avoidNeck && chosen.garment?.neckline && it.avoidNeck.includes(chosen.garment.neckline)) return false;
  /* 가면(secondary) 은 베일·만틸라 머리장식과 겹치지 않는다 — 얼굴에 둘. */
  if(it.secondary && chosen.headwear && /\b(veil|mantilla|helmet|full-face)\b/i.test(chosen.headwear.p||'')) return false;
  if(it.cat==='mask' && /\b(eyes?|eyelids?|eyelashes|eye-corner|tear makeup)\b/i.test(chosen.device?.p||'')) return false;
  if(it.cat==='mask' && (chosen.accessories||[]).some(a=>a.cat==='mask')) return false;
  /* 입에 문 사탕 — 입을 가리거나 입 모양을 정하는 것(가면 · 송곳니 · 웃음 분장)과 같이 두지 않는다. */
  const mouthBusy=x=>/\b(mouth|lips?|fangs?|smile|grin|beak|gas mask|muzzle|full-face)\b|:3/i.test(x?.p||'');
  if(it.cat==='mouth' && [chosen.headwear,chosen.device,...(chosen.accessories||[])].some(mouthBusy)) return false;
  if(chosen.weapon?.cat==='mouth' && it!==chosen.weapon && mouthBusy(it)) return false;
  if(/\bdetached\b.*\bsleeves?\b/i.test(it.p||'') && /\b(long|full-length|puff|sheer) sleeves?\b/i.test(chosen.garment?.p||'')) return false;
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

/* 조합형은 직접 고른 항목도 의상부터 검사한다. 충돌한 뒤쪽 항목만 비운다. */
function guardedMixPicks(edition,state,picked){
  const period=edition.periods.find(p=>p.id===state.periodId);
  const main=slotOptions(edition,'garment',state).find(it=>it.id===picked.garment);
  const source=edition.periods.find(p=>p.id===main?.periodId);
  if(!period?.mixStyles && !source?.mixStyles) return picked;
  const safe={...picked},chosen={};
  const find=(slot,id)=>slotOptions(edition,slot,state).find(it=>it.id===id);
  for(const slot of SLOT_ORDER){
    if(!picked[slot]) continue;
    const it=find(slot,picked[slot]);
    if(it && compatible(it,chosen)) chosen[slot]=it;
    else safe[slot]='';
  }
  chosen.accessories=[];
  safe.accessories=[];
  for(const id of [].concat(picked.accessories||[])){
    const it=find('accessories',id);
    if(it && compatible(it,chosen)){
      safe.accessories.push(id);
      chosen.accessories.push(it);
    }
  }
  return safe;
}

/* 후보를 모을 분장의 범위. 보통은 지금 분장 하나뿐이고,
 * period.mix 가 있으면 그 목록을 그대로 쓴다 (Cross Index 용).
 */
function allowedPeriods(edition, periodId, level){
  const ps = edition.periods;
  const i = Math.max(0, ps.findIndex(p=>p.id===periodId));
  const cur = ps[i];
  if(cur && cur.mix){
    return cur.mix==='*' ? ps.filter(p=>(!p.east||eastRandom)&&!blockedPeriod(p)) : ps.filter(p=>cur.mix.includes(p.id)&&!blockedPeriod(p));
  }
  /* 척도가 올라가도 다른 분장과 섞지 않는다 — 미라에 마녀 모자가 붙으면 안 된다. */
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
      if(!exposureOk(it,state.exposure)) continue;
      if(it.style && state.style && it.style!==state.style) continue;
      if(it.styles && state.style && !it.styles.includes(state.style)) continue;
      /* 시대착오 차단 — 20세기 기술 물품(선글라스·손목시계·방독면 케이스 등)은
       * 교차 시대 뷰로 새어 나가지 않는다. Fantasy Index 는 pseudo-period 라
       * 레시피가 없고, 따라서 슬롯 화이트리스트도 없다. */
      if(it.strict && edition.id === 'cross') continue;
      if(it.cat && typeof catsOff!=='undefined' && catsOff.has(it.cat)) continue;
      if(catsOff.has('spider') && spiderVisual(it.p)) continue;
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
function spiderVisual(prompt){return /\bspiders?\b/i.test(String(prompt||'').replace(/spider[ -]?webs?/gi,''));}
function blockedPeriod(p){return (p.id==='plague'&&catsOff.has('mask'))||(p.id==='spider'&&catsOff.has('spider'));}

/* 원형의 의상에만 붙는 작은 불길함. 피·상처·신체 변형은 쓰지 않는다. */
const EERIE_BY_KIND={
  witch:[['candle','촛농 자국','small wax drips on the robe hem'],['shadow','그을린 소매 끝','faint soot along the sleeve cuffs']],
  devil:[['rose','시든 장미 장식','wilted rose pinned to the costume'],['ash','재 묻은 소매','a trace of ash on the sleeve cuffs']],
  ghost:[['fade','바랜 옷자락','faded edges on the costume hem'],['dust','오래된 먼지','fine dust along the gauze hem'],['fray','해진 밑단','frayed tattered hem on the costume']],
  angel:[['feather','낡은 깃털 장식','a few weathered feathers on the costume wings'],['wax','촛농 묻은 밑단','small wax drips on the costume hem']],
  deity:[['laurel','마른 월계관 장식','dried laurel leaves on the costume circlet'],['rune','희미한 자수','faded sigil embroidery at the costume hem']],
  knight:[['rust','바랜 갑주 가장자리','tarnished edges on the costume armor'],['rose','갑주에 감긴 장미 덩굴','artificial rose vines curling around the costume armor']],
  doll:[['crack','금 간 단추','cracked porcelain-like buttons'],['ribbon','낡은 리본 끝','frayed ribbon ends on the costume']],
  snow:[['frost','서리 낀 밑단','frost-like embroidery along the costume hem'],['ice','얼어붙은 리본 장식','crystal beads on the costume ribbons']],
  oni:[['ash','재 묻은 옷자락','ash-colored smudges along the costume hem'],['rope','낡은 매듭 장식','weathered rope knots at the costume waist']],
  fox:[['leaf','마른 잎 장식','dried leaves caught in the costume sash'],['charm','바랜 부적 장식','faded paper charms tied to the costume sash']],
  maid:[['rose','앞치마에 감긴 장미 덩굴','artificial rose vines curling around the apron'],['dust','낡은 앞치마 끝','faint dust along the apron hem']],
  butler:[['rose','옷깃에 감긴 장미 덩굴','artificial rose vines curling along the tailcoat lapels'],['dust','낡은 연미복 끝','faint dust along the tailcoat hem']],
  vampire:[['rose','시든 장미 브로치','wilted rose brooch on the costume'],['velvet','바랜 벨벳 가장자리','faded velvet trim at the costume hem']],
  pumpkin:[['vine','호박 덩굴 장식','artificial pumpkin vines curling around the costume waist'],['leaf','마른 잎 장식','dried leaves at the costume hem']],
  skeleton:[['dust','뼈 무늬에 먼지','faint dust on the costume bone print'],['crack','금 간 뼈 장식','cracked bone-shaped costume buttons']],
  nurse:[['stain','소매의 작은 피 얼룩','small bloodstain on the costume sleeve cuff'],['age','바랜 앞치마','faded apron edges on the costume'],['fray','해진 소매 끝','frayed sleeve cuffs on the costume']],
  nun:[['stain','수도복 소매의 피 얼룩','small bloodstain on the habit sleeve cuff'],['rose','베일에 감긴 장미 덩굴','artificial rose vines curling along the habit veil']],
  zombie:[['stain','옷자락의 피 얼룩','small bloodstain on the costume hem'],['dust','먼지 쌓인 옷','dust and frayed edges on the costume']],
  redhood:[['stain','후드 소매의 작은 피 얼룩','small faux bloodstain on the red hoodie cuff'],['leaf','후드에 붙은 낙엽','dry autumn leaves caught on the hoodie']],
  alice:[['rose','앞치마의 검은 장미 자수','black rose embroidery on the apron'],['stain','앞치마 끝의 작은 피 얼룩','small faux bloodstain on the apron hem']],
  royal:[['rose','시든 장미 코르사주','wilted rose corsage pinned to the costume'],['ribbon','해진 왕실 리본','frayed royal ribbon trim along the costume hem'],['stain','옷자락의 작은 피 얼룩','small faux bloodstain on the costume hem']],
  general:[['ribbon','바랜 리본 장식','faded ribbon at the costume hem'],['dust','옷자락의 옅은 먼지','faint dust along the costume hem'],['fray','해진 밑단','frayed tattered hem on the costume']],
};
function eerieKind(scene,male=false){
  const id=scene.id||'', tag=scene.tag||'';
  if(/maid|butler/i.test(id+' '+tag)) return male?'butler':'maid';
  if(/nun|abbess|monk/i.test(id+' '+tag)) return 'nun';
  if(id==='rh-street') return 'redhood';
  if(id==='alice') return 'alice';
  if(id==='princess') return 'royal';
  if(/zombie/i.test(id+' '+tag) && !/nurse/i.test(id+' '+tag)) return 'zombie';
  if(/nurse|doctor/i.test(id+' '+tag)) return 'nurse';
  if(/^mx-/.test(id)) return ({'mx-witch':'witch','mx-devil':'devil','mx-ghost':'ghost','mx-angel':'angel','mx-deity':'deity','mx-knight':'knight','mx-doll':'doll','mx-yuki':'snow','mx-oni':'oni','mx-gumiho':'fox'})[id]||'general';
  if(/witch|warlock/i.test(id+' '+tag)) return 'witch';
  if(/devil|succubus|incubus/i.test(id+' '+tag)) return 'devil';
  if(/ghost|banshee/i.test(id+' '+tag)) return 'ghost';
  if(/angel/i.test(id+' '+tag)) return 'angel';
  if(/goddess|deity|myth/i.test(id+' '+tag)) return 'deity';
  if(/knight|warrior|valkyrie/i.test(id+' '+tag)) return 'knight';
  if(/doll/i.test(id+' '+tag)) return 'doll';
  if(/snow|frost/i.test(id+' '+tag)) return 'snow';
  if(/oni|ogre/i.test(id+' '+tag)) return 'oni';
  if(/fox|gumiho/i.test(id+' '+tag)) return 'fox';
  if(/vampire/i.test(id+' '+tag)) return 'vampire';
  if(/pumpkin|jack-o/i.test(id+' '+tag)) return 'pumpkin';
  if(/skeleton|bone/i.test(id+' '+tag)) return 'skeleton';
  return 'general';
}
function eerieOptions(scene,male=false){return scene.plain||scene._from==='cosplay'||/^(hq|jk)-/.test(scene.id)?[]:EERIE_BY_KIND[eerieKind(scene,male)];}

/* 고른 아이템 id 로 프롬프트를 만든다.
 * picked : { slot: itemId }  |  accessories 는 배열 허용
 */
function composeFrom(edition, state, picked){
  const lv = FIDELITY[state.fidelity] ?? 0;
  const period = edition.periods.find(p=>p.id===state.periodId) || edition.periods[0];
  picked=guardedMixPicks(edition,state,picked);
  const schema = schemaFor(edition, state.gender);

  const lookup=(slot,id)=>slotOptions(edition,slot,state).find(o=>o.id===id);

  /* 의상이 칸을 비우게 하는 경우 — 인어 꼬리면 신발 · 스타킹, 머리까지 덮는 천이면 머리 · 목 · 얼굴 */
  const gItem = lookup('garment', picked.garment);
  const skipped = new Set(gItem?.skip||[]);
  const body=[], tail=[];
  for(const slot of SLOT_ORDER){
    if(!schema.includes(slot) || skipped.has(slot)) continue;
    const it = lookup(slot, picked[slot]);
    if(it && it.p) (TAIL_SLOTS.includes(slot)?tail:body).push(it.p);
  }

  const accIds = skipped.has('accessories') ? [] : [].concat(picked.accessories||[]);
  const accs = accIds.map(id=>lookup('accessories',id)).filter(Boolean).map(a=>a.p);
  accs.push(...tail);

  /* 갈니시(로맨틱·판타지·이세계 풀)는 더 이상 몰래 붙이지 않는다 — OTHER 칸에 보이게 채워진다 (state.extraTags). */
  const overlay=[];

  /* 분장 태그 — Costume Mix 에서는 의상이 속한 분장의 태그를 쓴다. 의상이 비면 마지막으로 뽑은 앵커 분장. */
  let scene=period;
  if(period.mix){
    const src=gItem&&gItem.p?gItem:TAIL_SLOTS.map(s=>lookup(s,picked[s])).find(it=>it&&it.p);
    scene=(src&&edition.periods.find(p=>p.id===src.periodId))||edition.periods.find(p=>p.id===period.anchor)||period;
  }

  /* 색 — 분장이 색을 정한다. colors 가 빈 배열이면(코스프레 · 꿀벌) 색을 쓰지 않는다.
   * 랜덤이면 그 분장의 색에서 뽑는다. 직접 고른 색은 그대로 쓴다. */
  let color='';
  const stick=(k,fn)=>{ k=k+'|'+scene.id; if(!(k in rollMemo)) rollMemo[k]=fn(); return rollMemo[k]; };
   const style=gItem?.style||state.style||period.anchorStyle;
   const pal=(scene.styleColors&&scene.styleColors[style])||scene.colors||edition.pools.colors||[];
  if(!(scene.colors && !scene.colors.length)){
    const base=state.colorChoice||(pal.length?stick('color',()=>rand(pal)):'');
    let acc=state.accentChoice||'none';
    if(acc==='random') acc=stick('accent|'+base,()=>Math.random()<0.5?'':(rand(pal.filter(c=>c!==base))||''));
    if(acc==='none') acc='';
    color=base?(acc?`${base} with ${acc} accents`:base):'';
  }
  /* 남성 차림이면 짝이 되는 분장 태그(카우걸 → 카우보이). 진짜가 된 밤에는 'costume' 이 빠진 태그. */
  const male=gItem?.g==='m' || (gItem?.g!=='f' && state.gender==='masculine');
  const tag=lv>=3 ? ((male&&scene.tagRealM)||scene.tagReal||scene.tag) : ((male&&scene.tagM)||scene.tag);
  const eeriePool=eerieOptions(scene,male);
  const eerie=state.eerie==='none'?'':state.eerie==='random'
    ?stick('eerie|'+male,()=>Math.random()<0.35?rand(eeriePool)?.[2]:'')
    :eeriePool.find(row=>row[0]===state.eerie)?.[2];
  const backgrounds=(scene.slots?.effect||[]).filter(it=>it.p&&fantasyOk(it,lv));
  const background=state.backgroundEnabled
    ?(backgrounds.find(it=>it.id===state.backgroundChoice)||stick('bg',()=>rand(backgrounds)))?.p:'';
  /* 의상 첫 절이 태그의 마지막 절과 같은 말이면 뺀다 — 'gangster costume' 은 '1930s gangster costume' 에 이미 있다.
   * 'bee costume' 처럼 태그('insect costume')보다 구체적인 말은 남긴다. */
  if(gItem && gItem.p && body.length){
    const words=s=>new Set(s.toLowerCase().split(/\s+/).filter(Boolean));
    const tagLast=words(String(tag).split(',').pop().trim());
    const i=body.indexOf(gItem.p), cl=gItem.p.split(',');
    if(i>=0 && cl.length>1 && / costume$/i.test(cl[0].trim()) && [...words(cl[0])].every(w=>tagLast.has(w)))
      body[i]=cl.slice(1).join(',').trim();
  }

  const tokens=[
    color ? `outfit color: ${color}` : '',
    scene.mix ? '' : tag,
    ...body,
     scene.mixMotifs?.includes(state.motif) ? TF_MOTIFS[state.motif]?.p : '',
    ...accs,
    ...overlay,
    eerie,
    background,
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
      if(catsOff.has('spider') && spiderVisual(c)) continue;
      const k=c.toLowerCase();
      if(seenTok.has(k)) continue;
      seenTok.add(k); dedup.push(c);
    }
  }
  tokens.length=0;tokens.push(...dedup);

  return {
    callNo:`${edition.volume} · ${scene.callNo}`,
    period,
    scene,
    exposure: state.exposure,
    prompt: tokens.concat(catsOff.has('spider')?['-1:: spider::']:[]).join(', '),
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
    (r.f??0)<=lv && (r.fx===undefined || lv<=r.fx) &&
    (state.exposure===undefined || !r.x || r.x.includes(state.exposure)) &&
    /* 레시피가 의상을 적었으면 그중 하나라도 지금 성별 · 척도 · 노출에 맞아야 한다 — 비면 의상만 엉뚱한 데서 온다 */
    (!r.garment || (period.slots?.garment||[]).some(it=>r.garment.includes(it.id)&&genderOk(it,state.gender)&&fantasyOk(it,lv)&&exposureOk(it,state.exposure))) &&
    !(off.size && r.garment && r.garment.length && r.garment.every(id=>off.has(gcat(id)||'')))
  );
}

function constrainedPool(edition,slot,state,recipe,chosen,activeFeatures){
  let pool=slotOptionsRoll(edition,slot,state).filter(it=>compatible(it,chosen));
  if(recipe && Object.prototype.hasOwnProperty.call(recipe,slot)){
    const allow=recipe[slot]||[];
    if(!allow.length) return [];
    const ids=new Set(allow);
    /* Costume Mix 는 같은 문구의 항목을 하나로 합쳐 보여 준다(장소 · 사탕 바구니를 분장끼리 공유하므로).
     * 합쳐진 항목은 다른 분장의 id 를 달고 있으니, 앵커 분장의 화이트리스트는 문구로도 맞춰 본다. */
    const ps=recipe._scene?new Set((recipe._scene.slots?.[slot]||[]).filter(i=>ids.has(i.id)).map(i=>i.p)):null;
    pool=pool.filter(it=>ids.has(it.id)||(ps&&it.p&&ps.has(it.p)));
  }
  /* Costume Mix 에서 앵커 분장의 레시피가 이 칸을 적지 않았으면, 그 분장의 항목(같은 문구 포함)으로만 좁힌다 */
  if(recipe && recipe._scene && !Object.prototype.hasOwnProperty.call(recipe,slot)){
    const ps=new Set((recipe._scene.slots?.[slot]||[]).map(i=>i.p).filter(Boolean));
    pool=pool.filter(it=>it.periodId===recipe._scene.id||(it.p&&ps.has(it.p)));
  }
  if(edition.selectionRules?.suppressDuplicateFeatures){
    const clean=pool.filter(it=>!overlapsFeature(it,activeFeatures));
    if(clean.length) pool=clean;
  }
  return pool;
}

function rollPicks(edition, state, locks={}, previous={}){
  const period=edition.periods.find(p=>p.id===state.periodId)||edition.periods[0];
  /* 중성은 한 벌 안에서 성별을 하나로 정한다 — 레시피를 고르기 전에, 지금 노출 단계의 의상이 있는 성별 중에서 */
  const pickGender=sc=>{
    if(state.gender!=='neutral') return;
    const lv=FIDELITY[state.fidelity]??0;
    const ok=['feminine','masculine'].filter(g=>exposureAvailable(sc,state.exposure,g,lv));
    state={...state, gender: rand(ok.length?ok:['feminine','masculine'])};
  };
  if(!period.mix) pickGender(period);
  let recipe=weightedPick(recipeCandidates(period,state));
  /* Costume Mix도 매번 원형 하나를 정한다. 메인을 지정하면 그 분장의 의상과 필수 소품을 유지한다. */
  if(!recipe && period.mix){
    const lv=FIDELITY[state.fidelity]??0;
    const reals=allowedPeriods(edition,period.id,lv).filter(p=>!p.mix&&(p.recipes||[]).length);
    /* 잠긴 칸이 있으면(한 줄만 다시 뽑을 때 · 잠그고 Ring) 그 항목의 분장을 앵커로 이어 쓴다.
     * 의상을 먼저 본다 — 고양이 옷을 잠갔는데 나머지 칸이 좀비 · 디스코에서 오면 안 된다. */
    let anchor=reals.find(p=>p.id===state.mainPeriodId)||null;
    if(!anchor) for(const s of ['garment',...SLOT_ORDER.filter(s=>s!=='garment'),'accessories']){
      if(!locks[s]) continue;
      const ids=[].concat(previous[s]||[]).filter(id=>id&&typeof id==='string'&&!/-none-/.test(id));
      for(const id of ids){ anchor=reals.find(p=>(p.slots?.[s]||[]).some(i=>i.id===id)); if(anchor) break; }
      if(anchor) break;
    }
    if(!anchor){
      const fit=reals.filter(p=>exposureAvailable(p,state.exposure,state.gender,lv));
      anchor=rand(fit.length?fit:reals);
    }
    if(anchor){ state={...state, exposure:clampExposure(anchor,state.exposure,state.gender,lv)}; pickGender(anchor); }
    if(anchor?.mixStyles){
      const held=anchor.slots?.garment?.find(it=>it.id===previous.garment);
      period.anchorStyle=held?.style||rand(anchor.mixStyles);
      state={...state,style:period.anchorStyle};
    }else period.anchorStyle='';
    const base=anchor&&weightedPick(recipeCandidates(anchor,state));
    if(base){ recipe={...base,_scene:anchor}; period.anchor=anchor.id; }
    else if(anchor){ recipe={id:'x-free',_scene:anchor}; period.anchor=anchor.id; }   // 맞는 레시피가 없어도 그 분장 안에서만
  }
  /* 중성은 남녀 항목을 전부 허용하므로 그대로 두면 남자 정장과 드레스가 한 벌에 섞인다.
   * 레시피가 성별을 가지면 그 성별로 한 벌을 맞춘다 — '무작위 성별, 일관된 한 벌'. */
  if(state.gender==='neutral' && recipe && (recipe.g==='f'||recipe.g==='m')){
    state={...state, gender: recipe.g==='f'?'feminine':'masculine'};
  }else if(state.gender==='neutral'){
    /* 남녀 공용 레시피라도 한 벌 안에서는 성별을 하나로. 고른 노출 단계가 있는 성별 중에서 고른다. */
    const lv=FIDELITY[state.fidelity]??0, sc=recipe?._scene||period;
    const ok=['feminine','masculine'].filter(g=>exposureAvailable(sc,state.exposure,g,lv));
    state={...state, gender: rand(ok.length?ok:['feminine','masculine'])};
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
    if(!pool.length && !recipe?._scene) pool=slotOptionsRoll(edition,'garment',state).filter(it=>compatible(it,chosen));
    if(!pool.length && !recipe?._scene) pool=slotOptions(edition,'garment',state).filter(it=>compatible(it,chosen));
    commit('garment',rand(pool));
  }

  /* 의상이 비우는 칸은 뽑지 않는다 (인어 꼬리 → 신발 · 스타킹) */
  const gSkip=new Set(chosen.garment?.skip||[]);
  gSkip.forEach(s=>heldEmpty.add(s));
  const rules=edition.selectionRules||{};
  /* 분장을 알아보게 하는 칸(need) — 랜덤으로 뽑을 때 비우지 않는다. 지정 항목이 있으면 그중에서 고른다. */
  const scene=recipe?._scene||period;
  const needOf=slot=>scene.need&&Object.prototype.hasOwnProperty.call(scene.need,slot)?scene.need[slot]:null;
  const narrow=(slot,pool)=>{const n=needOf(slot);if(!n)return pool;const real=pool.filter(it=>it.p);const f=n.length?real.filter(it=>n.includes(it.id)):real;return f.length?f:(real.length?real:pool);};
  const core=['foundation','structure','neckwear','footwear'];
  for(const slot of core){
    if(!schema.includes(slot) || picks[slot] || heldEmpty.has(slot)) continue;
    const chance=needOf(slot)?1:(rules.slotChance?.[slot]??1);
    if(Math.random()>chance) continue;
    let pool=constrainedPool(edition,slot,state,recipe,chosen,activeFeatures);
    if(!pool.length && !(recipe && (recipe._scene || Object.prototype.hasOwnProperty.call(recipe,slot)))){
      pool=slotOptionsRoll(edition,slot,state).filter(it=>compatible(it,chosen));
    }
    commit(slot,rand(narrow(slot,pool)));
  }

  const decorative=['outer','headwear'];
  let decorativeCount=0;
  const maxDecorative=recipe?.maxDecorativeSlots??rules.maxDecorativeSlots??3;
  for(const slot of decorative){
    if(!schema.includes(slot) || picks[slot] || heldEmpty.has(slot)) continue;
    if(decorativeCount>=maxDecorative && !needOf(slot)) continue;
    const chance=needOf(slot)?1:(rules.slotChance?.[slot]??1);
    if(Math.random()>chance) continue;
    let pool=constrainedPool(edition,slot,state,recipe,chosen,activeFeatures);
    if(!pool.length && !(recipe && (recipe._scene || Object.prototype.hasOwnProperty.call(recipe,slot)))){
      pool=slotOptionsRoll(edition,slot,state).filter(it=>compatible(it,chosen));
    }
    const it=rand(narrow(slot,pool));
    if(it){ commit(slot,it); decorativeCount++; }
  }

  /* 분장의 나머지 절반 — 손에 든 것 / 얼굴 분장 / 장소. 레시피가 슬롯을 선언하면 그 목록만, 아니면 분장 풀에서.
   * 확률은 selectionRules.slotChance. 셋 다 비어도 된다 (None). */
  for(const slot of TAIL_SLOTS){
    if(!schema.includes(slot) || picks[slot] || heldEmpty.has(slot)) continue;
    const chance=needOf(slot)?1:(rules.slotChance?.[slot]??0.5);
    if(Math.random()>chance) continue;
    let pool=constrainedPool(edition,slot,state,recipe,chosen,activeFeatures);
    if(!pool.length && !(recipe && (recipe._scene || Object.prototype.hasOwnProperty.call(recipe,slot)))){
      pool=slotOptionsRoll(edition,slot,state).filter(it=>compatible(it,chosen));
    }
    /* 얼굴 분장이 꼭 나와야 하는 분장(송곳니 · 해골 …)에는 입에 문 사탕을 뽑지 않는다. */
    if(slot==='weapon' && needOf('device') && !skips.device) pool=pool.filter(it=>it.cat!=='mouth');
    commit(slot,rand(narrow(slot,pool)));
  }

  /* 액세서리 — 배열. 첫 개는 가면류(secondary) 제외, 디테일 보통/최대면 둘째를 더 뽑는다.
   * 둘째는 고증 판타지 이상에서만 가면이 후보가 되고 그때도 20% 로 누른다. */
  if(schema.includes('accessories') && !gSkip.has('accessories')){
    if(locks.accessories && Array.isArray(previous.accessories)){
      picks.accessories=[...previous.accessories];
    }else{
      picks.accessories=[];
      const chance=needOf('accessories')?1:(rules.slotChance?.accessories??0.9);
      const maxAccessories=recipe?.maxAccessories??1;
      const basePool=()=>{
        let pool=constrainedPool(edition,'accessories',state,recipe,chosen,activeFeatures);
        if(!pool.length && !(recipe && (recipe._scene || Object.prototype.hasOwnProperty.call(recipe,'accessories')))){
          pool=slotOptionsRoll(edition,'accessories',state).filter(it=>compatible(it,chosen));
        }
        return pool;
      };
      if(maxAccessories>0 && Math.random()<=chance && (decorativeCount<maxDecorative || needOf('accessories'))){
        const it=rand(narrow('accessories',basePool().filter(it=>!it.secondary)));
        if(it) picks.accessories.push(it.id);
        if(it) chosen.accessories=[it];
      }
      const wantExtra=state.detail==='Medium'||state.detail==='Max';
      if(wantExtra){
        const taken=new Set(picks.accessories);
        /* 같은 부위·같은 손을 쓰는 액세서리는 둘째로 뽑지 않는다 — 장갑+미트, 부채+부채, 지팡이+파라솔, 시계+시계, 파이프+시가 */
        const region=it=>{const t=(it.t+" "+it.p).toLowerCase();
          if(/glove|mitt|gauntlet/.test(t))return "hands";if(/sock|stocking|leg warmer|gaiter/.test(t))return "legs";if(/fan\b/.test(t))return "fan";if(/cane|stick|umbrella|parasol|staff|crop|scepter|sceptre|orb\b/.test(t))return "held";
          if(/watch/.test(t))return "watch";if(/pipe|cigar|cigarette/.test(t))return "smoke";if(/mask/.test(t))return "mask";if(/muff/.test(t))return "hands";
          if(/necklace|pendant|choker|chain at the throat|brooch at the throat|collar/.test(t))return "neck";if(/bag|purse|reticule|pouch|case\b|holster/.test(t))return "bag";
          if(/tail\b/.test(t))return "tail";if(/wings?\b/.test(t))return "wings";if(/earring|earpiece|ear cuff/.test(t))return "ear";if(/belt\b|harness/.test(t))return "belt";return null;};
        const firstRegions=new Set(picks.accessories.map(id=>{const it=slotOptions(edition,'accessories',state).find(x=>x.id===id);return it?region(it):null;}).filter(Boolean));
        let pool=basePool().filter(it=>!taken.has(it.id)&&!(region(it)&&firstRegions.has(region(it))));
        if(!pool.length && !recipe?._scene) pool=slotOptionsRoll(edition,'accessories',state).filter(it=>!taken.has(it.id));
        const sec=pool.filter(it=>it.secondary), reg=pool.filter(it=>!it.secondary);
        const it=(sec.length && (!reg.length || Math.random()<0.2)) ? rand(sec) : rand(reg.length?reg:pool);
        if(it) picks.accessories.push(it.id);
      }
    }
    if(picks.accessories?.length)
      picks.accessories=guardedMixPicks(edition,state,picks).accessories;
  }

  /* 서브 분장은 몸통·머리·필수 손 소품을 바꾸지 않고, 선별한 장신구만 하나씩 보탠다. */
  if(period.mix && (state.mainPeriodId || !coherentMix) && crossMax>1 && recipe?._scene){
    const source=recipe._scene;
    const subs=allowedPeriods(edition,period.id).filter(p=>p.id!==source.id && p.mixStyles);
    const region=it=>it.cat==='animal'?'animal':/\bwings?\b/i.test(it.p)?'wings':/\btails?\b/i.test(it.p)?'tails':/\bgloves?\b/i.test(it.p)?'hands':'';
    const all=slotOptionsRoll(edition,'accessories',state);
    const current=all.filter(it=>(picks.accessories||[]).includes(it.id));
    const required=new Set(source.need?.accessories||[]);
    picks.accessories=current.filter((it,i)=>required.has(it.id)||i===0).map(it=>it.id);
    const used=new Set(all.filter(it=>picks.accessories.includes(it.id)).map(region).filter(Boolean));
    for(const sub of sample(subs,crossMax-1)){
      const chosen={};
      for(const slot of SLOT_ORDER){const it=slotOptions(edition,slot,state).find(x=>x.id===picks[slot]);if(it)chosen[slot]=it;}
      chosen.accessories=all.filter(it=>picks.accessories.includes(it.id));
      const pool=all.filter(it=>it.periodId===sub.id&&it.blend&&!picks.accessories.includes(it.id)&&(!region(it)||!used.has(region(it)))&&compatible(it,chosen));
      const accent=rand(pool);
      if(accent){picks.accessories.push(accent.id);if(region(accent))used.add(region(accent));}
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

/* Costume Mix — 네 유형을 하나로 합치고 분장을 고르는 가짜 분장(x-custom)을 얹는다 */
function buildCrossEdition(editions, combos){
  const periods = editions.flatMap(e=>e.periods.map(p=>({...p, _from:e.id})));
  const pools = {
    colors:[...new Set(editions.flatMap(e=>e.pools.colors))],
    plain:[...new Set(editions.flatMap(e=>e.pools.plain||[]))],
    romantic:[...new Set(editions.flatMap(e=>e.pools.romantic))],
    fantasy:[...new Set(editions.flatMap(e=>e.pools.fantasy))],
    otherworldly:[...new Set(editions.flatMap(e=>e.pools.otherworldly))],
  };
  return {
    id:'cross', label:'COSTUME MIX', volume:'PA·TFY·X', range:'every costume',
    selectionRules:editions[0].selectionRules,
    slotLabels:editions[0].slotLabels,
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
const ALL_SLOTS=['foundation','structure','garment','neckwear','outer','footwear','headwear','accessories','weapon','device'];
const NONE_OPT={value:"",label:"None",id:""};
/* 랜덤에서 뺀 항목(⊘). 드롭다운에서는 여전히 고를 수 있다. localStorage 에 유지. */
const bans=new Set();
try{ (JSON.parse(localStorage.getItem("taffy.bans")||"[]")).forEach(id=>bans.add(id)); }catch(e){}
function saveBans(){ try{localStorage.setItem("taffy.bans",JSON.stringify([...bans]));}catch(e){} }
/* 카테고리 — 항목의 cat. 끄면 드롭다운·랜덤에서 모두 사라지고, 그 카테고리 가먼트뿐인 레시피도 빠진다. */
/* 무기·부유 장치·이펙트는 자기 슬롯이 있고 − 버튼으로 통째로 뺄 수 있으므로 필터 칩에 두지 않는다.
 * 그 슬롯 항목의 cat 값(weapon/device/effect)은 데이터 표기용으로만 남는다. */
const CATS=[
  {id:'mask',ko:'얼굴 가림',en:'Face Coverings'},{id:'animal',ko:'동물 동반',en:'Animal Companions'},
  {id:'bodypaint',ko:'바디페인팅',en:'Body Paint'},{id:'bodysuit',ko:'밀착 전신 수트',en:'Fitted Bodysuits'},
  {id:'spider',ko:'거미',en:'Spiders'},
];
const CAT_ORDER=['','animal','mask','bodypaint','bodysuit','spider'];
const FILTER_CAT=id=>CATS.some(c=>c.id===id)?id:'';
const catsOff=new Set();
try{ (JSON.parse(localStorage.getItem("taffy.catsOff")||"[]")).forEach(c=>catsOff.add(c)); }catch(e){}
function saveCats(){ try{localStorage.setItem("taffy.catsOff",JSON.stringify([...catsOff]));}catch(e){} }
let eastRandom=false;
try{eastRandom=localStorage.getItem("taffy.eastRandom")==='true';}catch(e){}
function saveEastRandom(){ try{localStorage.setItem("taffy.eastRandom",String(eastRandom));}catch(e){} }
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
        if(!ALL_SLOTS.includes(slot) || !Array.isArray(r[slot])) continue;
        const ids=new Set((p.slots?.[slot]||[]).map(i=>i.id));
        for(const id of r[slot])
          if(!ids.has(id)){ console.warn(`[recipe] ${edition.id}/${p.id}/${r.id}/${slot}: '${id}' 없음`); bad++; }
      }
  return bad;
}

const COLLECTIONS=[classic,illustrated,everyday,cosplay];
const EDITIONS={classic,illust:illustrated,everyday,cosplay};
/* 예전 컬렉션 이름으로 저장된 프리셋 — 지금의 큰 갈래로 연다 */
const OLD_COLLECTION={monster:"classic",storybook:"classic",retro:"classic",uniform:"classic",event:"illust",variant:"illust"};
buildKoMaps(COLLECTIONS);
/* Costume Mix — 분장을 직접 체크한다. pseudo-period 하나(x-custom)의 mix 를 체크 상태로 갱신. */
EDITIONS.cross=buildCrossEdition(COLLECTIONS,[
  {id:'x-custom',label:'Cross Mix',years:'—',callNo:'X-00',tag:'',mix:'*'},
]);
/* 칩 — '모든 분장'(체크 전부 해제)과 컬렉션 하나씩. */
const FANTASY_PRESETS=[
  {ko:'모든 분장',en:'All costumes',ids:[]},
  ...COLLECTIONS.map(c=>({ko:selectI18n.staticOptions.collection.ko[c.id].split(' · ')[0],en:selectI18n.staticOptions.collection.en[c.id],ids:c.periods.map(p=>p.id)})),
];
function fantasyChecked(){ return [...$("#periodMulti").selectedOptions].map(o=>o.value); }
function applyFantasyMix(){
  const x=EDITIONS.cross.periods.find(p=>p.id==='x-custom');
  if(mainCostume){for(const o of $('#periodMulti').options){const p=EDITIONS.cross.periods.find(p=>p.id===o.value);if(o.value!==mainCostume&&!p?.mixStyles)o.selected=false;}}
  const ids=fantasyChecked();
  if(mainCostume&&!ids.includes(mainCostume)) mainCostume='';
  x.mix=ids.length?ids:'*';
  x.tag='';
  renderMulti('period');
}
/* 성별을 따라가는 분장 이름 — data.js 의 labelM · labelF. 중성이거나 코스프레면 기본 이름 */
function genderName(p){
  const base={en:p?.labelEn||p?.label,ko:p?.labelKo};
  if(!p||$("#collection").value==='cosplay') return base;
  const g=$("#gender").value;
  if(g==='Masculine'&&p.labelM) return {en:p.labelM,ko:p.labelKoM||p.labelKo};
  if(g==='Feminine'&&p.labelF) return {en:p.labelF,ko:p.labelKoF||p.labelKo};
  return base;
}
function renamePeriodOptions(){
  const ed=currentPack(); if(!ed||ed.id==='cross') return;
  [...$("#period").options].forEach(o=>{const p=ed.periods.find(x=>x.label===o.value);if(!p)return;const n=genderName(p);o.textContent=selectLang==='ko'?(n.ko||n.en):n.en;});
}
function periodDisplay(){
  if($("#collection").value!=='cross') return $("#period").value||"ARCHIVE";
  const ids=fantasyChecked();
  if(!ids.length) return selectLang==='ko'?'모든 분장':'ALL COSTUMES';
  const ed=EDITIONS.cross;
  if(mainCostume){const p=ed.periods.find(p=>p.id===mainCostume);const n=p?label(p.label,{editionId:p._from,periodId:p.id}):mainCostume;const subs=ids.length-1;return (selectLang==='ko'?'메인 ':'Main ')+n+(subs?' + '+(selectLang==='ko'?'서브 ':'Subs ')+subs:'');}
  if(ids.length>3) return (selectLang==='ko'?'선택한 분장 ':'Selected costumes ')+ids.length;
  return ids.map(id=>{const p=ed.periods.find(p=>p.id===id);return label(p.label,{editionId:p._from,periodId:p.id});}).join(' + ');
}
function periodDisplayEnglish(){
  const enName=p=>p?.labelEn||p?.label;
  if($("#collection").value!=='cross') return enName(currentPeriod())||"ARCHIVE";
  const ids=fantasyChecked();
  if(!ids.length) return "ALL COSTUMES";
  if(mainCostume) return 'Main '+(enName(EDITIONS.cross.periods.find(p=>p.id===mainCostume))||mainCostume)+(ids.length>1?' + '+(ids.length-1)+' subs':'');
  if(ids.length>3) return ids.length+' costumes';
  return ids.map(id=>enName(EDITIONS.cross.periods.find(p=>p.id===id))||id).join(' + ');
}

function currentPack(){return EDITIONS[$("#collection").value]}
function periodList(ed){return (ed.id==='cross'?ed.periods.filter(p=>p.mix):ed.periods).filter(p=>!blockedPeriod(p))}
function currentPeriod(){
  const ed=currentPack(),v=$("#period").value;
  return periodList(ed).find(p=>p.label===v)||periodList(ed)[0];
}
function fillMixFields(){
  const p=currentPeriod(),on=!!(p?.mixStyles?.length)&&currentPack().id!=='cross';
  document.body.classList.toggle('has-mix',on);
  $("#styleField").hidden=!on;
  $("#motifField").hidden=!on;
  if(!on){$("#style").innerHTML='';$("#motif").innerHTML='';return;}
  const text=x=>x[selectLang]||x.en;
  fill("#style",p.mixStyles.map(id=>({value:id,text:text(TF_MIX_STYLES[id])})));
  fill("#motif",p.mixMotifs.map(id=>({value:id,text:text(TF_MOTIFS[id])})));
}
function fillAtmosphereFields(){
  const p=currentPeriod(), cross=currentPack().id==='cross', male=$('#gender').value==='Masculine';
  const pool=cross?[]:eerieOptions(p,male);
  fill('#eerie',[{value:'random',text:selectLang==='ko'?'가끔 랜덤으로':'Occasional random'},
    {value:'none',text:selectLang==='ko'?'넣지 않기':'None'},
    ...pool.map(row=>({value:row[0],text:selectLang==='ko'?row[1]:row[2]}))]);
  $('#eerie').disabled=currentPack().id==='cosplay';
  const lv=FIDELITY[$('#fidelity').value]??0;
  const effects=cross?[]:(p.slots?.effect||[]).filter(it=>it.p&&fantasyOk(it,lv));
  fill('#background',[{value:'random',text:selectLang==='ko'?'어울리는 배경 랜덤':'Random fitting background'},
    ...effects.map(it=>({value:it.id,text:selectLang==='ko'?it.k:it.t}))]);
  $('#background').disabled=cross;
  $('#backgroundField').hidden=!$('#backgroundEnabled').checked;
  $('#labelEerie').textContent=selectLang==='ko'?'호러 장식':'Horror Detail';
  $('#labelBackgroundEnabled').textContent=selectLang==='ko'?'배경 넣기':'Include background';
  $('#labelBackground').textContent=selectLang==='ko'?'배경':'Background';
}
function mixSelectionText(p,ko=selectLang==='ko'){
  if(!p?.mixStyles?.length||currentPack().id==='cross') return '';
  const s=TF_MIX_STYLES[$("#style").value],m=TF_MOTIFS[$("#motif").value],key=ko?'ko':'en';
  return [s?.[key],m?.p?m[key]:null].filter(Boolean).join(' · ');
}
function readState(){
  const ed=currentPack(),p=currentPeriod();
  const gender=$("#gender").value.toLowerCase(),fidelity=$("#fidelity").value;
  const want=EXPOSURE[$("#exposure").value]??1;
  /* 그 분장에 이 노출 단계가 없으면 가까운 단계로. 중성이면 어느 한 성별에라도 있으면 그대로 */
  const exposure=clampExposure(p,want,gender,FIDELITY[fidelity]??1);
  return{edition:ed,periodId:p.id,gender,fidelity,exposure,exposureWanted:want,detail:effectiveDetail(),
    mainPeriodId:ed.id==='cross'?mainCostume:'',
    style:p.mixStyles?$("#style").value:'',motif:p.mixMotifs?$("#motif").value:'none',
    eerie:$('#eerie').value||'none',backgroundEnabled:$('#backgroundEnabled').checked,backgroundChoice:$('#background').value};
}
function label(en,{editionId=null,itemId=null,periodId=null}={}){
  if(selectLang!=="ko")return (periodId&&PERIOD_EN[periodId])||en;

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
  $("#collectionPill").textContent=selectI18n.staticOptions.collection[selectLang][currentPack().id];
  $("#labelCollection").textContent=l.collection;
  $("#labelPeriod").textContent=l.period;
  $("#labelStyle").textContent=l.style;
  $("#labelMotif").textContent=l.motif;
  $("#labelGender").textContent=l.gender;
  $("#labelFidelity").textContent=l.fidelity;
  $("#labelExposure").textContent=l.exposure;
  $("#labelDetail").textContent=l.detail;
  $("#labelColor").textContent=l.color;
  $("#labelAccent").textContent=l.accent;
  $("#labelOther").textContent=l.other;
  $("#other").placeholder=selectLang==='ko'?"추가 태그, 쉼표로 구분":"extra tags, comma separated";
  document.querySelector('.multi-mode[data-mode="combine"]').textContent=selectLang==='ko'?"＋ 함께 사용":"＋ Use together";
  { const b=document.querySelector('.multi-mode[data-mode="random"]'); const svg=b.querySelector("svg"); b.textContent=" "+(selectLang==='ko'?"랜덤 1개":"Random one"); if(svg) b.prepend(svg); }
  document.querySelector('.multi-none').textContent=selectLang==='ko'?"없음":"None";
  ["collection","gender","fidelity","exposure","detail"].forEach(id=>
    relabelStaticSelect(id,selectI18n.staticOptions[id][selectLang]));
  if($("#collection").value==='cross') renderMulti('period');
  renderBanList();
  renderCatBar();
  renderPresetList();
  const ed=currentPack();
  fill("#period",periodList(ed).map(p=>({value:p.label,label:p.label,periodId:p.id,group:(selectLang==='ko'?p.groupKo:p.groupEn)||''})),{editionId:ed.id});
  fillMixFields();fillColors();fillAtmosphereFields();
  populateSlots();
  renderMulti('accessories');
  /* 언어를 바꾸면 열려 있는 검색 결과·체크리스트도 다시 그린다 — 안 그리면 이전 언어로 남는다 (라벨 갱신 뒤에 호출) */
  if(slotQuery && !$("#searchPanel").hidden) renderSearchPanel(slotQuery);
  if(banSlot && !$("#banMenu").hidden) openBanMenu(banSlot);
}
function updatePack(){
  const ed=currentPack();
  $("#collectionPill").textContent=selectI18n.staticOptions.collection[selectLang][ed.id];
  /* 코스프레는 성별을 보지 않는다 — 어떤 캐릭터든 누구나 입는다. 성별 칸을 쉬게 둔다. */
  const idle=ed.id==='cosplay';
  $("#gender").disabled=idle;
  $("#gender").closest(".field").classList.toggle("field-idle",idle);
  $("#gender").title=idle?(selectLang==='ko'?"코스프레는 성별과 상관없이 나옵니다":"Cosplay ignores gender"):"";
  fill("#period",periodList(ed).map(p=>({value:p.label,label:p.label,periodId:p.id,group:(selectLang==='ko'?p.groupKo:p.groupEn)||''})),{editionId:ed.id});
  const isF=ed.id==='cross';
  $("#period").hidden=isF;
  document.querySelector('[data-multi="period"]').hidden=!isF;
  if(isF){
    if(!$("#periodMulti").options.length){
      const reals=ed.periods.filter(p=>!p.mix);
      $("#periodMulti").innerHTML=reals.map(p=>`<option value="${p.id}">${p.label}</option>`).join("");
    }
    for(const option of $('#periodMulti').options){
      option.disabled=blockedPeriod({id:option.value});
      if(option.disabled) option.selected=false;
    }
    applyFantasyMix();
  }
  fillMixFields();fillColors();fillAtmosphereFields();
  populateSlots();updatePreview();
}
/* 색 — 분장이 가진 색. Costume Mix 는 컬렉션 전체의 색. 'Random' 은 생성 때 그 분장의 색에서 뽑는다.
 * 코스프레처럼 색이 정해진 분장(colors: [])은 색 칸을 '캐릭터 색' 하나로 둔다. */
function colorPool(){
  const ed=currentPack();
  if(ed.id==='cross') return (mainCostume&&ed.periods.find(p=>p.id===mainCostume)?.colors)||ed.pools.colors;
  const p=currentPeriod();
  return p?.styleColors?.[$("#style").value]||p?.colors||ed.pools.colors;
}
function fixedColors(){
  const ed=currentPack();
  if(ed.id==='cross') return false;
  const p=currentPeriod();
  return !!(p&&p.colors&&!p.colors.length);
}
function fillColors(){
  const ko=selectLang==='ko';
  if(fixedColors()){
    fill("#color",[{value:"",label:"Character colors",text:ko?"캐릭터 색 그대로":"Character colors"}]);
    fill("#accent",[{value:"none",label:"None",text:ko?"없음":"None"}]);
    return;
  }
  const cols=colorPool().map(c=>({value:c,label:c,text:ko?(colorKo[c]||c):c}));
  fill("#color",[{value:"",label:"Random",text:ko?"랜덤":"Random"},...cols]);
  fill("#accent",[{value:"none",label:"None",text:ko?"없음":"None"},{value:"random",label:"Random",text:ko?"랜덤":"Random"},...cols]);
}
/* OTHER — 등급별 화면 연출 풀(렌즈 · 필름 · 구도)에서 채운다. 보이는 칸이라 지우거나 고쳐 쓸 수 있다. */
function garnishFor(){
  const ed=currentPack(),lv=FIDELITY[$("#fidelity").value]??0;
  const max=ed.selectionRules?.maxFantasyGarnish?.[lv] ?? (lv>0?1:0);
  const pool=lv>=3?(ed.pools.otherworldly||[]):lv>=2?(ed.pools.fantasy||[]):lv>=1?(ed.pools.romantic||[]):(ed.pools.plain||[]);
  return max>0?sample(pool,max):[];
}
function otherTags(){ return $("#other").value.split(",").map(t=>t.trim()).filter(Boolean); }
/* 디테일 'Random' 은 셔플·생성 때 한 번 정한다 */
let detailRoll="Medium";
function effectiveDetail(){ const v=$("#detail").value; return v==="Random"?detailRoll:v; }
function exposureName(x){ const k=Object.keys(EXPOSURE).find(k=>EXPOSURE[k]===x)||'Classic'; return selectI18n.staticOptions.exposure[selectLang][k]; }
function updatePreview(){
  const ko=selectLang==='ko';
  const p=currentPeriod(),st=readState();
  renamePeriodOptions();
  const gn=genderName(p);
  $("#previewEra").textContent=$("#collection").value!=='cross'?(ko?(gn.ko||gn.en):(gn.en||periodDisplay())):periodDisplay();
  const fid=selectI18n.staticOptions.fidelity[selectLang][$("#fidelity").value]||$("#fidelity").value;
  const gen=$("#collection").value==='cosplay'?(ko?'성별 무관':'Any gender'):(selectI18n.staticOptions.gender[selectLang][$("#gender").value]||$("#gender").value);
  /* 노출이 가까운 단계로 내려갔으면 그렇게 적는다 */
  const xs=st.exposure!==st.exposureWanted&&$("#collection").value!=='cross'?`${exposureName(st.exposure)} (${ko?'이 분장의 최대':'max for this costume'})`:exposureName(st.exposureWanted);
  const mixText=mixSelectionText(p,ko);
  $("#previewMode").textContent=`${fid} · ${xs} · ${gen}${mixText?' · '+mixText:''}`;
  /* 채광창 캡션 — 손에 든 것 · 얼굴 분장 · 장소를 고른 그대로 한 줄로 적는다. */
  const lines=$("#plateLines");
  if(lines) lines.textContent=TAIL_SLOTS.map(s=>{
    const el=$("#"+s),o=el&&el.selectedOptions[0];
    return (o&&el.value&&!el.disabled)?o.textContent.replace(/^⊘ /,''):'';
  }).filter(Boolean).join(' · ');
}
const INDEX_FIELDS=["collection","period","style","motif","gender","fidelity","exposure","detail","color","accent","other"];
function randomIndexField(id){
  if(id==="collection"){const el=$("#collection");el.selectedIndex=Math.floor(Math.random()*el.options.length);updatePack();return;}
  if(id==="period"){
    if($("#collection").value==='cross'){
      if(mainCostume) return;
      const opts=[...$("#periodMulti").options].filter(o=>!o.disabled&&(eastRandom||!EDITIONS.cross.periods.find(p=>p.id===o.value)?.east));const r=Math.random();
      const n=r<0.15?0:r<0.7?2:3;
      const chosen=new Set(sample(opts.map(o=>o.value),n));
      [...$("#periodMulti").options].forEach(o=>o.selected=chosen.has(o.value));
      applyFantasyMix();
    }else{const el=$("#period"),ed=currentPack();const opts=[...el.options].filter(o=>eastRandom||!ed.periods.find(p=>p.id===o.dataset.periodId)?.east);
      if(opts.length)el.value=rand(opts).value;}
    return;
  }
  if(id==="style"||id==="motif"){
    const el=$("#"+id);if(el.options.length)el.selectedIndex=Math.floor(Math.random()*el.options.length);return;
  }
  if(id==="color"){$("#color").value=(fixedColors()||$("#collection").value==='cross')?"":(Math.random()<0.5?"":rand(colorPool()));return;}
  if(id==="accent"){$("#accent").value=(fixedColors()||Math.random()<0.6)?"none":"random";return;}
  if(id==="exposure"){$("#exposure").value=rand(["Covered","Classic","Classic","Daring"]);return;}
  if(id==="fidelity"){$("#fidelity").value=rand(["Party","Party","Editorial","Editorial","RealNight"]);return;}
  if(id==="other") return;                 // 추가 태그는 사람이 적는 칸 — 사진 · 분위기 태그를 저절로 채우지 않는다
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
/* 드롭다운의 '랜덤'(색 · 포인트 색 · 기척 · 배경)을 한 번 뽑은 값. 다시 뽑기 전까지 그대로 써서
 * Ring을 그대로 누르면 같은 태피가 나온다. randomize()가 비운다. */
let rollMemo={};
function randomize(){
  rollMemo={};
  detailRoll=rand(["Simple","Medium","Medium","Max"]);
  /* 슬롯·의상 결·모티프·색이 잠겼으면 그 후보를 바꾸는 상위 선택은 유지한다. */
  const holdIndex=ALL_SLOTS.some(s=>locks[s])||locks.style||locks.motif||locks.color||locks.accent;
  const mainPinned=!!mainCostume&&$("#collection").value==='cross';
  const collectionChanged=!locks.collection&&!locks.period&&!mainPinned&&!holdIndex;
  if(collectionChanged) randomIndexField("collection");
  ["period","gender","fidelity","exposure"].forEach(id=>{ if(locks[id]||holdIndex||(id==='period'&&mainPinned))return; randomIndexField(id); });
  fillMixFields();fillAtmosphereFields();
  if(!locks.style&&!holdIndex) randomIndexField("style");
  if(!locks.motif) randomIndexField("motif");
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
  $("#status").textContent="DRAWN AGAIN";
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
    if(id==="exposure"){randomIndexField(id);recut();return;}
    randomIndexField(id);
    if(["collection","period"].includes(id))fillMixFields();
    if(["collection","period","gender","fidelity"].includes(id))fillAtmosphereFields();
    if(["collection","period","style","gender","fidelity","exposure"].includes(id)){fillColors();populateSlots();if(slotQuery)renderSearchPanel(slotQuery);}
    if(["collection","period","style","gender","fidelity","exposure"].includes(id)) rollSlotsOnly();
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
  if(!skips.accessories && multiMode.accessories==='random' && picked.accessories.length>1){
    const main=st.edition.id==='cross'&&mainCostume?st.edition.periods.find(p=>p.id===mainCostume):null;
    const required=new Set(main?.need?.accessories||[]);
    const core=picked.accessories.filter(id=>required.has(id));
    picked.accessories=core.length?core:[rand(picked.accessories)];
  }
  st.colorChoice=$("#color").value;
  st.accentChoice=$("#accent").value;
  st.extraTags=otherTags();
  const made=composeFrom(st.edition,st,picked);
  lastScene=made.scene; lastExposure=made.exposure??1;
  return made.prompt;
}
["period","gender","fidelity","style"].forEach(id=>
  $("#"+id).addEventListener("change",()=>{if(id==='period')fillMixFields();fillAtmosphereFields();fillColors();populateSlots();rollSlotsOnly();}));
$("#motif").addEventListener("change",updatePreview);
$("#exposure").addEventListener("change",recut);
/* 노출만 바꿀 때 — 지금 의상에 같은 옷의 다른 재단(v:)이 있으면 그 재단으로 갈아입히고,
 * 나머지 칸은 새 노출에서도 고를 수 있고 새 목선과 부딪히지 않는 한 그대로 둔다. 없으면 예전처럼 새로 뽑는다. */
function recut(){
  const before=currentPrev(),ed=currentPack();
  const findItem=id=>{for(const p of ed.periods){const it=(p.slots?.garment||[]).find(i=>i.id===id);if(it)return it;}return null;};
  const old=findItem(before.garment);
  fillColors();populateSlots();
  const st=readState();
  const sib=old&&old.fam?slotOptions(st.edition,'garment',st).find(it=>it.fam===old.fam):null;
  if(!sib){rollSlotsOnly();return;}
  const prev={...before,garment:sib.id},lk={garment:true,accessories:false};
  ALL_SLOTS.forEach(s=>{
    if(s==='garment'||s==='accessories')return;
    if(before[s]===''){lk[s]=true;return;}
    const it=slotOptions(st.edition,s,st).find(o=>o.id===before[s]);
    lk[s]=!!it&&!(it.avoidNeck&&sib.neckline&&it.avoidNeck.includes(sib.neckline));
  });
  const picks=rollPicks(st.edition,st,lk,prev);
  $("#garment").value=sib.id;
  ALL_SLOTS.forEach(s=>{
    if(s==='garment'||skips[s])return;
    if(s==='accessories'){
      const offered=new Set(slotOptions(st.edition,'accessories',st).map(o=>o.id));
      const keep=(before.accessories||[]).filter(id=>offered.has(id));
      setMulti('accessories',keep.length===(before.accessories||[]).length?keep:(picks.accessories||keep));
      return;
    }
    const el=$("#"+s),v=picks[s],has=val=>[...el.options].some(o=>o.value===val);
    if(v&&has(v))el.value=v;else if(has(''))el.value='';
  });
  updatePreview();
  $("#status").textContent="RECUT · SAME COSTUME";
}
$("#periodMulti").addEventListener("change",()=>{applyFantasyMix();populateSlots();updatePreview();});

let serial=1;
/* 마지막으로 뽑힌 분장 — Costume Mix 에서는 드롭다운이 아니라 실제로 뽑힌 분장을 포장지에 적는다. */
let lastScene=null, lastExposure=1;

/* ---------------- 초인종과 태피 ----------------
 * Ring → 문이 안쪽으로 열려 빛이 새고 → 문간에서 태피 한 알이 매트로 던져지고 → 문이 닫힌다.
 * 글자는 포장지에 처음부터 적혀 있다. 서서히 나타나게 하지 않는다. */
let doorTimers=[];
let hudFull="";
function hudComplete(){ const el=$("#prompt"); if(hudFull&&el.textContent!==hudFull) el.textContent=hudFull; }
function ringDoor(text){
  doorTimers.forEach(clearTimeout);doorTimers=[];
  hudFull=text;
  const front=document.querySelector(".frontage"),zone=$("#resultZone"),sheet=$("#sheet");
  const calm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  zone.classList.remove("open","landing","closing");
  sheet.style.removeProperty("--tear-y");sheet.style.removeProperty("--tear-r");
  sheet.style.setProperty("--tilt",(Math.random()*5-2.5).toFixed(2)+"deg");
  sheet.style.setProperty("--drift",(Math.random()*60-30).toFixed(0)+"px");
  $("#prompt").textContent=text;
  $("#prompt").scrollTop=0;
  front.classList.add("door-open");
  /* 문이 거의 다 열리면(0.28초) 태피가 나오고, 태피가 앞으로 날아오는 도중(0.15초 뒤)에 문이 닫히기 시작한다 */
  doorTimers.push(setTimeout(()=>{ void zone.offsetWidth; zone.classList.add("open","landing"); },calm?0:280));
  doorTimers.push(setTimeout(()=>{ front.classList.remove("door-open"); },calm?0:380));
  doorTimers.push(setTimeout(()=>{ zone.classList.remove("landing"); },calm?0:1300));
}
function dismissHud(){
  const zone=$("#resultZone");
  if(!zone.classList.contains("open")) return;
  zone.classList.add("closing");
  $("#status").textContent="WRAPPER TORN";
  window.setTimeout(()=>{
    zone.classList.remove("open","closing");
    const sh=$("#sheet");
    sh.style.removeProperty("--tear-y");sh.style.removeProperty("--tear-r");
  },380);
}

function transcribe(){
  if($("#detail").value==="Random") detailRoll=rand(["Simple","Medium","Medium","Max"]);
  const p=compose();

  const ed=currentPack(),sc=lastScene||currentPeriod(),no=serial++;
  const gn=genderName(sc);
  $("#sheetTitle").textContent=sc.mix?periodDisplayEnglish():gn.en;
  const mixText=mixSelectionText(sc,true);
  $("#sheetSub").textContent=sc.mix?'':[(gn.ko||''),mixText].filter(Boolean).join(' · ');
  const fid=selectI18n.staticOptions.fidelity.en[$("#fidelity").value]||$("#fidelity").value;
  const xk=Object.keys(EXPOSURE).find(k=>EXPOSURE[k]===lastExposure)||'Classic';
  $("#sheetOccasion").textContent=`${fid} · ${xk}`.toUpperCase();
  $("#sheetMeta").textContent=`${ed.id==='cosplay'?'ANY GENDER':$("#gender").value.toUpperCase()} · DETAIL ${effectiveDetail().toUpperCase()}`;
  $("#sheetCode").textContent=`${ed.id==='cross'?(EDITIONS[sc._from]||ed).volume:ed.volume} · ${sc.mix?'X-00':sc.callNo} · No. ${String(no).padStart(4,"0")}`;
  $("#status").textContent="TREAT GIVEN";
  keepTreat(p);
  ringDoor(p);
}
/* 받은 태피 — 창을 연 동안만 최근 20개, 같은 프롬프트는 한 번만. 누르면 다시 뽑지 않고 그 태피를 그대로 다시 연다. */
const treats=[];
const SHEET_FIELDS=["sheetTitle","sheetSub","sheetOccasion","sheetMeta","sheetCode"];
function keepTreat(prompt){
  /* 목록에 이미 있는 프롬프트(그대로 다시 받기 · 다시 열기)는 또 쌓지 않는다 */
  if(treats.some(t=>t.prompt===prompt)) return;
  const t={prompt,at:new Date()};SHEET_FIELDS.forEach(id=>t[id]=$("#"+id).textContent);
  const d=t.at,p2=n=>String(n).padStart(2,"0");t.atStr=`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  treats.unshift(t);if(treats.length>20)treats.length=20;renderTreats();
}
function renderTreats(){
  const ol=$("#treatsList");ol.innerHTML="";
  $("#treatsEmpty").hidden=treats.length>0;
  ["treatsTxt","treatsMd","treatsNote"].forEach(id=>$("#"+id).disabled=!treats.length);
  treats.forEach((t,i)=>{
    const li=document.createElement("li");
    const open=document.createElement("button");open.type="button";open.className="treat-open";open.title="다시 열기";
    const hm=t.at.toTimeString().slice(0,5);
    const name=document.createElement("span");name.className="treat-name";name.textContent=t.sheetTitle;
    if(t.sheetSub){const ko=document.createElement("span");ko.className="treat-ko";ko.textContent=t.sheetSub;name.append(ko);}
    const time=document.createElement("span");time.className="treat-time";time.textContent=hm;
    const sub=document.createElement("span");sub.className="treat-sub";sub.textContent=t.sheetOccasion;
    open.append(name,time,sub);open.addEventListener("click",()=>reopenTreat(i));
    const cp=document.createElement("button");cp.type="button";cp.className="treat-copy";cp.textContent="COPY";cp.title="프롬프트 복사";
    cp.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(t.prompt);$("#status").textContent="COPIED";}catch(e){$("#status").textContent="COPY FAILED";}});
    li.append(open,cp);ol.append(li);
  });
}
/* TXT · MD · 노트 — 형식은 note.js(에디션 공통). 항목에 에디션 이름을 달아 노트에서 탭으로 나뉘게 한다. */
const treatEntries=()=>treats.map(t=>({edition:"Taffy",title:t.sheetTitle,sub:t.sheetSub,meta:[t.sheetOccasion,t.sheetMeta].filter(Boolean).join(" · "),code:t.sheetCode,at:t.atStr,prompt:t.prompt}));
const treatStamp=()=>{const d=new Date(),p2=n=>String(n).padStart(2,"0");return `${d.getFullYear()}${p2(d.getMonth()+1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}`;};
$("#treatsTxt").addEventListener("click",()=>PANote.download(`taffy-${treatStamp()}.txt`,PANote.toTxt(treatEntries()),"text/plain;charset=utf-8"));
$("#treatsMd").addEventListener("click",()=>PANote.download(`taffy-${treatStamp()}.md`,PANote.toMd(treatEntries()),"text/markdown;charset=utf-8"));
$("#treatsNote").addEventListener("click",()=>PANote.download(`prompt-archive-note-${treatStamp()}.html`,PANote.toHtml(treatEntries()),"text/html;charset=utf-8"));
renderTreats();
function reopenTreat(i){
  const t=treats[i];if(!t)return;
  SHEET_FIELDS.forEach(id=>$("#"+id).textContent=t[id]);
  $("#status").textContent="TREAT AGAIN";
  ringDoor(t.prompt);
}
async function copyText(){
  hudComplete();
  const text=$("#prompt").textContent;
  try{await navigator.clipboard.writeText(text)}catch(e){
    const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();
  }
  const b=$("#copyBtn"),old=b.textContent;b.textContent="Copied";setTimeout(()=>b.textContent=old,850);
}
function saveText(){
  hudComplete();
  const blob=new Blob([$("#prompt").textContent],{type:"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="prompt_archive_taffy.txt";a.click();URL.revokeObjectURL(a.href);
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
let savedSkips=[];
try{savedSkips=JSON.parse(localStorage.getItem("taffy.skips")||"[]");}catch(e){}
document.querySelectorAll(".skip").forEach(b=>{
  const id=b.dataset.skip;
  /* 뺀 칸(얼굴 분장 등)은 다음에 열어도 빠진 채로 둔다. */
  skips[id]=savedSkips.includes(id);
  paintSkip(id);
  b.addEventListener("click",()=>{
    skips[id]=!skips[id];
    try{localStorage.setItem("taffy.skips",JSON.stringify(Object.keys(skips).filter(k=>skips[k])));}catch(e){}
    if(skips[id]&&locks[id]){                // 제외하면 잠금은 푼다
      locks[id]=false;
      const l=lockBtn(id);
      if(l){l.classList.remove("locked");l.textContent="◇"}
    }
    paintSkip(id);
    updatePreview();
  });
});

/* ---------------- 다중 선택 위젯 ----------------
 * 상태는 숨은 <select multiple> 이 가진다. 위젯은 그 옵션을 체크박스로 그린다.
 * accessories: '＋ 함께 사용' 이면 체크한 전부, '🎲 랜덤 1개' 면 생성마다 하나.
 * period(Fantasy Index): 체크한 시대끼리 섞는다. 프리셋 칩 + '어울리는 것끼리' 토글. */
const multiMode={accessories:'combine'};
let coherentMix=true;
try{ const v=localStorage.getItem("taffy.coherent"); if(v!==null) coherentMix=v==="1"; }catch(e){}
let mainCostume='';
let crossMax=2;
try{const n=Number(localStorage.getItem('taffy.crossMax'));if([1,2,3].includes(n))crossMax=n;}catch(e){}
const multiSelectId={accessories:'accessories',period:'periodMulti'};
function getMulti(key){ return [...$("#"+multiSelectId[key]).selectedOptions].map(o=>o.value); }
function setMulti(key,ids){
  const set=new Set(ids);
  [...$("#"+multiSelectId[key]).options].forEach(o=>o.selected=set.has(o.value));
  if(key==='period'&&!set.has(mainCostume))mainCostume='';
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
    if(key==='period'&&mainCostume&&o.value!==mainCostume&&!ed.periods.find(p=>p.id===o.value)?.mixStyles)continue;
    const period=key==='period'?ed.periods.find(p=>p.id===o.value):null;
    const g=period?[selectI18n.staticOptions.collection[selectLang][period._from],ko?period.groupKo:period.groupEn].filter(Boolean).join(' · '):(o.parentElement.tagName==='OPTGROUP'?o.parentElement.label:'');
    if(g!==lastGroup){lastGroup=g;if(g){const hd=document.createElement("div");hd.className="multi-group";hd.textContent=g;list.appendChild(hd);}}
    const lab=document.createElement("label");lab.className="check-option"+(o.selected?" on":"")+(bans.has(o.value)?" banned":"");
    const cb=document.createElement("input");cb.type="checkbox";cb.value=o.value;cb.checked=o.selected;
    const span=document.createElement("span");
    let text=o.textContent;
    if(key==='period'){const p=ed.periods.find(p=>p.id===o.value);text=p?label(p.label,{editionId:p._from,periodId:p.id}):o.textContent;}
    span.textContent=text;
    cb.addEventListener("change",()=>{o.selected=cb.checked;if(key==='period')applyFantasyMix();else renderMulti(key);sel.dispatchEvent(new Event("change",{bubbles:true}));if(key==='period'){populateSlots();updatePreview();}});
    lab.append(cb,span);
    if(key==='period'){
      const row=document.createElement('div');row.className='check-row';
      const main=document.createElement('button');main.type='button';main.className='main-pick'+(mainCostume===o.value?' on':'');
      main.textContent=mainCostume===o.value?'★':'☆';main.title=ko?'메인 분장으로 고정':'Pin as main costume';
      main.setAttribute('aria-label',main.title+' · '+text);
      main.addEventListener('click',()=>{mainCostume=mainCostume===o.value?'':o.value;if(mainCostume)o.selected=true;applyFantasyMix();fillColors();populateSlots();rollSlotsOnly();});
      row.append(lab,main);list.appendChild(row);
    }else list.appendChild(lab);
  }
  const chosen=opts.filter(o=>o.selected);
  if(key==='period'){
    summary.textContent=chosen.length?periodDisplay():(ko?'모든 분장':'All costumes');
    const pr=root.querySelector("#periodPresets");pr.innerHTML="";
    if(mainCostume){const note=document.createElement('div');note.className='multi-coherent';note.textContent=ko?'★ 메인 의상·필수 소품 유지. 서브는 원형 장신구만':'★ Main outfit and required props stay. Subs add base accessories';pr.appendChild(note);}
    else{const coh=document.createElement("label");coh.className="multi-coherent";
      const cb=document.createElement("input");cb.type="checkbox";cb.checked=coherentMix;
      cb.addEventListener("change",()=>{coherentMix=cb.checked;try{localStorage.setItem("taffy.coherent",coherentMix?"1":"0");}catch(e){}});
      const sp=document.createElement("span");sp.textContent=ko?"🧩 한 분장으로 맞추기":"🧩 Keep each candy to one costume";
      coh.append(cb,sp);pr.appendChild(coh);}
    const limit=document.createElement('label');limit.className='multi-limit';
    const name=document.createElement('span');name.textContent=ko?'한 결과의 최대 분장 수':'Max costumes per result';
    const count=document.createElement('select');for(const n of [1,2,3]){const option=document.createElement('option');option.value=String(n);option.textContent=String(n);count.appendChild(option);}count.value=String(crossMax);
    count.addEventListener('change',()=>{crossMax=Number(count.value);try{localStorage.setItem('taffy.crossMax',String(crossMax));}catch(e){}rollSlotsOnly();});
    limit.append(name,count);pr.appendChild(limit);
    if(!mainCostume)for(const p of FANTASY_PRESETS){const b=document.createElement("button");b.type="button";b.className="multi-preset";b.textContent=ko?p.ko:p.en;
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
    b.addEventListener("click",()=>{if(catsOff.has(c.id))catsOff.delete(c.id);else catsOff.add(c.id);saveCats();renderCatBar();if(c.id==='mask'||c.id==='spider')updatePack();else populateSlots();rollSlotsOnly();if(slotQuery)renderSearchPanel(slotQuery);updatePreview();});
    el.appendChild(b);
  }
  const east=document.createElement("button");east.type="button";east.className="cat-chip"+(eastRandom?"":" off");
  east.textContent=(eastRandom?"✓ ":"✕ ")+(selectLang==='ko'?"동아시아 설화 랜덤":"East Asian folklore shuffle");
  east.title=selectLang==='ko'?"끄면 랜덤에서만 빠집니다. 분장 목록에서는 직접 고를 수 있습니다":"Off excludes from shuffle only; direct selection stays available";
  east.addEventListener("click",()=>{eastRandom=!eastRandom;saveEastRandom();renderCatBar();populateSlots();updatePreview();});
  el.appendChild(east);
}
renderCatBar();

/* ---------------- 프리셋 ---------------- */
function snapshot(){
  const o={collection:$("#collection").value,period:$("#period").value,periods:fantasyChecked(),gender:$("#gender").value,fidelity:$("#fidelity").value,exposure:$("#exposure").value,
    style:$("#style").value,motif:$("#motif").value,eastRandom,eerie:$('#eerie').value,backgroundEnabled:$('#backgroundEnabled').checked,background:$('#background').value,
    detail:$("#detail").value,color:$("#color").value,accent:$("#accent").value,other:$("#other").value,
    slots:{},locks:{...locks},skips:{...skips},bans:[...bans],catsOff:[...catsOff],accMode:multiMode.accessories,coherent:coherentMix,mainCostume,crossMax};
  ALL_SLOTS.forEach(s=>o.slots[s]=s==='accessories'?getMulti('accessories'):$("#"+s).value);
  return o;
}
function restore(o){
  if(OLD_COLLECTION[o.collection]) o.collection=OLD_COLLECTION[o.collection];
  $("#collection").value=o.collection;updatePack();
  if(o.collection==='cross'){setMulti('period',o.periods||[]);}else{$("#period").value=o.period;}
  fillMixFields();if(o.style)$("#style").value=o.style;if(o.motif)$("#motif").value=o.motif;
  $("#gender").value=o.gender;$("#fidelity").value=o.fidelity==='Homemade'?'Party':o.fidelity;$("#exposure").value=o.exposure||"Classic";$("#detail").value=o.detail;
  $('#backgroundEnabled').checked=!!o.backgroundEnabled;fillAtmosphereFields();if(o.eerie)$('#eerie').value=o.eerie;if(o.background)$('#background').value=o.background;
  fillColors();$("#color").value=o.color||"";$("#accent").value=o.accent||"none";$("#other").value=o.other||"";
  bans.clear();(o.bans||[]).forEach(id=>bans.add(id));saveBans();
  catsOff.clear();(o.catsOff||[]).forEach(c=>catsOff.add(c));saveCats();
  if(o.eastRandom!==undefined){eastRandom=!!o.eastRandom;saveEastRandom();}renderCatBar();updatePack();
  multiMode.accessories=o.accMode||'combine';if(o.coherent!==undefined)coherentMix=o.coherent;
  mainCostume=o.collection==='cross'&&(o.periods||[]).includes(o.mainCostume)?o.mainCostume:'';
  crossMax=[1,2,3].includes(Number(o.crossMax))?Number(o.crossMax):2;
  if(o.collection==='cross')applyFantasyMix();
  Object.keys(skips).forEach(k=>{skips[k]=!!(o.skips||{})[k];paintSkip(k);});
  populateSlots();
  ALL_SLOTS.forEach(s=>{const v=(o.slots||{})[s];if(s==='accessories')setMulti('accessories',v||[]);else if(v!==undefined)$("#"+s).value=v;});
  Object.keys(locks).forEach(k=>{locks[k]=!!(o.locks||{})[k];const b=lockBtn(k);if(b){b.classList.toggle("locked",locks[k]);b.textContent=locks[k]?"◆":"◇";}});
  renderBanList();updatePreview();
}
function loadPresets(){try{return JSON.parse(localStorage.getItem("taffy.presets")||"{}");}catch(e){return {};}}
function savePresets(p){try{localStorage.setItem("taffy.presets",JSON.stringify(p));}catch(e){}}
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
    if(per.mix||blockedPeriod(per)) continue;
    for(const [slot,items] of Object.entries(per.slots||{})){
      if(!ALL_SLOTS.includes(slot)) continue;
      for(const it of items){
        if(it.t==='None'||!searchHit(it,lq)) continue;
        if((it.cat&&catsOff.has(it.cat))||(catsOff.has('spider')&&spiderVisual(it.p))||(it.fx!==undefined&&it.fx<lv)) continue;
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
  fillMixFields();fillAtmosphereFields();fillColors();
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
  head.textContent=ko?`"${q}" — 현재 조건에는 없음. 누르면 그 분장으로 이동:`:`"${q}" — not under current settings. Click to jump:`;wrap.appendChild(head);
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
["collection","period","style","gender","fidelity","exposure"].forEach(id=>$("#"+id).addEventListener("change",()=>{if(slotQuery)renderSearchPanel(slotQuery)}));
$("#collection").addEventListener("change",()=>{updatePack();rollSlotsOnly();});
$('#backgroundEnabled').addEventListener('change',()=>{fillAtmosphereFields();updatePreview();});
['eerie','background'].forEach(id=>$('#'+id).addEventListener('change',updatePreview));
["color","accent","other"].forEach(id=>$("#"+id).addEventListener("change",updatePreview));
["period","style","motif","gender","fidelity","exposure","detail"].forEach(id=>$("#"+id).addEventListener("change",updatePreview));
Object.values(inputs).forEach(sel=>$(sel).addEventListener("change",updatePreview));
Object.values(inputs).forEach(sel=>$(sel).addEventListener("change",()=>{
  const st=readState(),before=currentPrev(),after=guardedMixPicks(st.edition,st,before);
  if(JSON.stringify(before)!==JSON.stringify(after)){
    applyPicks(after);
    $("#status").textContent="INCOMPATIBLE PART REMOVED";
    updatePreview();
  }
}));
/* Ring — 기본은 지금 칸 그대로 태피를 준다. "누를 때마다 새로 뽑기"를 켜면 안 잠긴 칸을 전부 다시 뽑은 뒤 준다.
 * 켜고 끈 상태는 이 브라우저에만 기억한다. */
const rerollToggle=$("#rerollToggle");
try{ rerollToggle.checked=localStorage.getItem("taffy.reroll")==="1"; }catch(e){}
rerollToggle.addEventListener("change",()=>{ try{localStorage.setItem("taffy.reroll",rerollToggle.checked?"1":"0");}catch(e){} });
$("#transcribeBtn").addEventListener("click",()=>{
  if(rerollToggle.checked) randomize();
  transcribe();
});
/* ONE MORE — 링과 같다. 잠그지 않은 것은 컬렉션 · 분장까지 전부 새로 뽑아 한 알 더. 같은 분장을 계속 보려면 분장 줄을 잠근다. */
$("#reprintBtn").addEventListener("click",()=>{randomize();transcribe();});
$("#copyBtn").addEventListener("click",copyText);
$("#saveBtn").addEventListener("click",saveText);
updatePack();applySelectLanguage();updatePreview();
$("#langToggle").addEventListener("change",e=>{
  selectLang=e.target.checked?"en":"ko";
  applySelectLanguage();
  updatePreview();
});


/* TEAR — 태피 포장지를 아래로 끌어 뜯는다. 끌지 않고 눌러도, Esc 로도 뜯긴다. */
const tearHandle=$("#tearHandle");
const tearSheet=$("#sheet");
let tearPointer=null,tearStartY=0,tearY=0,tearMoved=false;
function finishTear(){ tearPointer=null;tearSheet.classList.remove("dragging");dismissHud(); }
tearHandle.addEventListener("pointerdown",e=>{
  if(!$("#resultZone").classList.contains("open")) return;
  tearPointer=e.pointerId;tearStartY=e.clientY;tearY=0;tearMoved=false;
  tearSheet.classList.add("dragging");
  tearHandle.setPointerCapture?.(e.pointerId);
});
tearHandle.addEventListener("pointermove",e=>{
  if(e.pointerId!==tearPointer) return;
  tearY=Math.max(0,Math.min(140,e.clientY-tearStartY));
  if(tearY>3) tearMoved=true;
  tearSheet.style.setProperty("--tear-y",tearY+"px");
  tearSheet.style.setProperty("--tear-r",(tearY/70)+"deg");
});
function endTearDrag(e){
  if(e.pointerId!==tearPointer) return;
  tearHandle.releasePointerCapture?.(e.pointerId);
  tearPointer=null;
  tearSheet.classList.remove("dragging");
  if(tearY>=64){ dismissHud(); return; }
  tearSheet.style.setProperty("--tear-y","0px");
  tearSheet.style.setProperty("--tear-r","0deg");
}
tearHandle.addEventListener("pointerup",endTearDrag);
tearHandle.addEventListener("pointercancel",endTearDrag);
/* 끌다가 놓은 직후의 click 은 무시한다 — 덜 끌었는데 뜯기면 안 된다. */
tearHandle.addEventListener("click",e=>{e.stopPropagation();if(tearMoved){tearMoved=false;return;}finishTear();});
$("#taffyClose").addEventListener("click",e=>{e.stopPropagation();finishTear();});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&$("#resultZone").classList.contains("open")) finishTear();
});
$("#sheet").addEventListener("click",e=>{e.stopPropagation();});

const modal=$("#helpModal");
const openHelp=()=>modal.classList.add("open");
const closeHelp=()=>modal.classList.remove("open");
$("#helpBtn").addEventListener("click",openHelp);
$("#helpClose").addEventListener("click",closeHelp);
$("#helpOk").addEventListener("click",closeHelp);
modal.addEventListener("click",e=>{if(e.target===modal)closeHelp()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeHelp()});
COLLECTIONS.forEach(validateRecipes);

updatePack();
applySelectLanguage();
/* 열 때마다 첫 화면도 Ring처럼 유형 · 분장 · 성별 · 색까지 새로 뽑는다. */
randomize();
$("#status").textContent="READY";
