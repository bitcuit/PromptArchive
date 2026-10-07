// Prompt Archive : Halation - generator logic and UI interactions
const $ = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random()*a.length)];
const sample = (a,n) => [...a].sort(()=>Math.random()-.5).slice(0,Math.min(n,a.length));
const uniq = a => [...new Set(a)];

// A scene names one season, or several it can happen in.
const seasonsOf=scene=>scene.seasons||[scene.season];
// A small detail is dropped when the scene has no place for it.
function addOnFits(item,sceneKey,season){
  const scene=styles[sceneKey];
  if(!scene) return true;
  const possible=season?[season]:seasonsOf(scene);
  if(item.seasons && !item.seasons.some(s=>possible.includes(s))) return false;
  if(item.outdoor && scene.indoor) return false;
  if(item.styles && !item.styles.includes(sceneKey)) return false;
  if(item.home && !scene.home) return false;
  if(item.away && scene.home) return false;
  if(item.indoor && !scene.indoor) return false;
  return true;
}
function availableAddOns(){
  const sceneKey=fixedScene();
  return shuffleAddOns.filter(item=>addOnFits(item,sceneKey));
}
function parseAddOns(sceneKey,season,wet,lightKey){
  if(generatedOtherItems.length){
    const kept=generatedOtherItems.filter(item=>addOnFits(item,sceneKey,season) && !(wet && item.dry) && !(item.lights && !item.lights.includes(lightKey)));
    const tags=kept.map(item=>item.tag);
    if(tags.length) return {tags,label:tags.join(" + ").toUpperCase()};
    return {tags:[],label:"NO OTHER"};
  }
  const raw=$("#customAdd").value.trim();
  if(!raw) return {tags:[],label:"NO OTHER"};
  const pieces=raw.split(",").map(x=>x.trim()).filter(Boolean);
  return {tags:uniq(pieces),label:pieces.join(" + ").toUpperCase()};
}

const ROLL_LENGTH=27;
let printId=1;
let pile=0;
let rollNo=1;
const locks={people:false,pair:false,color:false,accentColor:false,mainStyle:false,formMode:false,heroMode:false,backPiece:false,bottomType:false,complexity:false,environment:false,customAdd:false};
let heroMode="all";
// id is set when the value came from customEnvironmentNames; null means user-typed text.
let customEnvironmentValue={id:null,text:""};
let generatedOtherItems=[];
let settingsLanguage="en";

// SCENE holds a scene key, "random", or "season:<name>".
function fixedScene(){
  const value=$("#mainStyle").value;
  return styles[value]?value:null;
}
function scenePool(){
  const value=$("#mainStyle").value;
  if(styles[value]) return [value];
  if(value.startsWith("season:")){
    const season=value.slice(7);
    const list=allScenes.filter(key=>seasonsOf(styles[key]).includes(season));
    if(list.length) return list;
  }
  return allScenes;
}
function propFits(propKey,sceneKey,season){
  const p=backPieces[propKey];
  if(p?.styles && !p.styles.includes(sceneKey)) return false;
  if(season && p?.seasons && !p.seasons.includes(season)) return false;
  return true;
}
function heroFits(key,sceneKey,season){
  const hero=heroMap[key];
  if(!hero || !hero.styles.includes(sceneKey)) return false;
  if(season && hero.seasons && !hero.seasons.includes(season)) return false;
  return true;
}
// A scene left on Random narrows itself to where the hand-picked prop, light and
// headwear would be found. Each filter is dropped again if it would leave nothing.
function resolveScene(){
  // Each print settles on one season: the one asked for, or one the scene
  // and a hand-picked weather can both have.
  const value=$("#mainStyle").value;
  const wanted=value.startsWith("season:")?value.slice(7):null;
  const seasonFor=key=>{
    let possible=seasonsOf(styles[key]);
    if(wanted && possible.includes(wanted)) return wanted;
    // Narrow by whatever was picked by hand and only happens in some seasons:
    // the weather, the prop, the headwear.
    const limits=[lights[$("#environment").value]?.seasons,backPieces[$("#backPiece").value]?.seasons,
      ...selectedHeroes().map(hero=>heroMap[hero]?.seasons)].filter(Boolean);
    for(const limit of limits){
      const both=possible.filter(s=>limit.includes(s));
      if(both.length) possible=both;
    }
    return pick(possible);
  };
  const fixed=fixedScene();
  if(fixed) return {key:fixed,rolled:false,season:seasonFor(fixed)};
  const narrow=(list,test)=>{
    const kept=list.filter(test);
    return kept.length?kept:list;
  };
  let pool=scenePool();
  const prop=$("#backPiece").value;
  if(prop!=="none" && prop!=="random" && backPieces[prop]) pool=narrow(pool,key=>propFits(prop,key));
  const light=$("#environment").value;
  if(lights[light]) pool=narrow(pool,key=>styles[key].light.includes(light));
  const heroes=selectedHeroes().filter(key=>key!=="none");
  if(heroes.length) pool=narrow(pool,key=>heroes.some(hero=>heroMap[hero].styles.includes(key)));
  const key=pick(pool);
  return {key,rolled:true,season:seasonFor(key)};
}

function heroInputs(){
  return [...document.querySelectorAll('[data-multi="heroMode"] input[type="checkbox"]')];
}
function selectedHeroes(){
  return heroInputs().filter(input=>input.checked).map(input=>input.value);
}
function updateHeroSummary(){
  const labels=heroInputs().filter(input=>input.checked).map(input=>settingLabel("heroMode",input.value));
  $("#heroModeToggle .picker-value").textContent=labels.join(" · ");
}
function setHeroValues(values){
  const normalized=values.length>1?values.filter(value=>value!=="none"):values;
  const wanted=new Set(normalized.length?normalized:["none"]);
  heroInputs().forEach(input=>input.checked=wanted.has(input.value));
  if(!selectedHeroes().length){
    const none=heroInputs().find(input=>input.value==="none");
    if(none) none.checked=true;
  }
  updateHeroSummary();
}
function randomSubset(values,maxCount){
  const count=1+Math.floor(Math.random()*Math.min(maxCount,values.length));
  return sample(values,count);
}
function compatibleHeroes(styleKeys,candidates=Object.keys(heroMap)){
  return candidates.filter(key=>{
    const hero=heroMap[key];
    return hero && styleKeys.some(styleKey=>hero.styles.includes(styleKey));
  });
}
// One item per zone, because a head only has one crown and one pair of ears.
function resolveHeroConflicts(keys){
  const chosen=[];
  const takenZones=new Set();
  keys.filter(key=>heroMap[key]).forEach(key=>{
    const hero=heroMap[key];
    if(key==="none") return;
    if(hero.zone && hero.zone!=="none" && takenZones.has(hero.zone)) return;
    if(hero.zone) takenZones.add(hero.zone);
    chosen.push(key);
  });
  return chosen.length?chosen:["none"];
}

// The lens shows the scene it is pointed at; headwear is listed on the sleeve beside it.
let lastPreview={scene:"random",heroes:["none"]};
function heroDisplayText(key){
  const safeKey=heroMap[key]?key:"none";
  if(settingsLanguage!=="ko") return {name:heroMap[safeKey].name,sub:heroMap[safeKey].sub};
  return settingTranslations.heroPreview[safeKey];
}
function sceneDisplayText(value){
  const korean=settingsLanguage==="ko";
  const scene=styles[value];
  if(scene){
    const where=scene.indoor?(korean?"실내":"INDOOR"):(korean?"야외":"OUTDOOR");
    const list=seasonsOf(scene);
    const season=list.length===4?(korean?"사계절":"ALL SEASONS"):list.map(s=>korean?settingTranslations.seasons[s]:s.toUpperCase()).join(" · ");
    return {icon:scene.icon,name:korean?settingTranslations.values.mainStyle[value]:scene.label,sub:`${season} · ${where}`};
  }
  if(String(value).startsWith("season:")){
    const season=value.slice(7);
    return korean
      ?{icon:"🎞️",name:`랜덤 · ${settingTranslations.seasons[season]||season}`,sub:"이 계절의 장면 중 하나"}
      :{icon:"🎞️",name:`RANDOM · ${season.toUpperCase()}`,sub:"one of this season's scenes"};
  }
  return korean
    ?{icon:"🎞️",name:"랜덤 장면",sub:"어느 계절이든"}
    :{icon:"🎞️",name:"RANDOM SCENE",sub:"any season"};
}
function updateHeroPreview(keys,sceneValue){
  const active=(Array.isArray(keys)?keys:[keys]).filter(Boolean);
  lastPreview.heroes=active.length?active:["none"];
  if(sceneValue!==undefined) lastPreview.scene=sceneValue;
  const visible=lastPreview.heroes.filter(key=>key!=="none" && heroMap[key]);
  const stack=$("#heroStack");
  stack.hidden=!visible.length;
  stack.innerHTML=visible.map(key=>{
    return `<div class="worn"><span class="worn-icon">${heroMap[key].icon}</span><span class="worn-name">${heroDisplayText(key).name}</span></div>`;
  }).join("");
  const text=sceneDisplayText(lastPreview.scene);
  $("#heroIcon").textContent=text.icon;
  $("#heroName").textContent=text.name;
  $("#heroSub").textContent=text.sub;
}
function renderColorChips(){
  const korean=settingsLanguage==="ko";
  const chip=(label,value)=>{
    const name=korean?(settingTranslations.values.color[value]||value):value.toUpperCase();
    return `<span class="dye"><span class="dye-dot" style="background:${colorSwatch[value]||value}"></span>${label} ${name}</span>`;
  };
  const base=$("#color").value;
  const accent=$("#accentColor").value;
  let html=chip(korean?"기본":"BASE",base);
  if(accent!=="none" && accent!==base) html+=chip(korean?"포인트":"ACCENT",accent);
  $("#previewColors").innerHTML=html;
}
function propSuits(key,lightKey,heroKeys){
  const p=backPieces[key];
  if(!p) return false;
  if(p.lights && lights[lightKey] && !p.lights.includes(lightKey)) return false;
  if(p.clash && p.clash.some(hero=>heroKeys.includes(hero))) return false;
  return true;
}
function momentFits(moment,key){
  for(const need of momentNeeds) if(need.when.test(moment) && !need.props.includes(key)) return false;
  const p=backPieces[key];
  if(p && p.tag){
    if(busyHands.test(moment)) return false;
    if(p.avoid && p.avoid.test(moment)) return false;
  }
  return true;
}
function backPieceCandidates(styleKey,season){
  const pool=Object.keys(backPieces).filter(key=>key!=="none" && propFits(key,styleKey,season));
  return pool.length?pool:["none"];
}
function randomizeField(key){
  const scene=fixedScene();
  if(key==="people") $("#people").value=Math.random()<.7?"solo":"duo";
  if(key==="pair") $("#pair").value=pick(Object.keys(pairs));
  if(key==="color") $("#color").value=pick(outfitColors);
  if(key==="accentColor"){
    const accentPool=outfitColors.filter(color=>color!==$("#color").value);
    $("#accentColor").value=Math.random()<.65?"none":pick(accentPool);
  }
  if(key==="mainStyle") $("#mainStyle").value=pick(allScenes);
  if(key==="formMode") $("#formMode").value=pick(scene?styles[scene].dress:["casual","uniform"]);
  if(key==="heroMode"){
    const compatible=(scene?compatibleHeroes([scene]):Object.keys(heroMap)).filter(hero=>hero!=="none");
    const rolled=Math.random()<.45 || !compatible.length?["none"]:randomSubset(compatible,2);
    setHeroValues(resolveHeroConflicts(rolled));
    updatePreviewFromSelections();
  }
  if(key==="complexity") $("#complexity").value=pick(["simple","medium","medium","max"]);
  // With the scene on Random the prop and the light stay on Random too,
  // so they are chosen after the scene is, not before.
  if(key==="backPiece"){
    if(scene) $("#backPiece").value=Math.random()<.75?pick(backPieceCandidates(scene)):"none";
    else $("#backPiece").value=Math.random()<.75?"random":"none";
  }
  if(key==="bottomType") $("#bottomType").value=pick(["any","any","skirt","pants","dress"]);
  if(key==="environment"){
    if($("#environment").value==="custom"){
      const id=pick(customEnvironmentNames);
      customEnvironmentValue={id,text:id};
      renderEnvironmentInput();
    }else{
      const value=Math.random()<.1?"custom":scene?pick(sceneLights(styles[scene],pick(seasonsOf(styles[scene])))):"random";
      $("#environment").value=value;
      if(value==="custom"){
        const id=pick(customEnvironmentNames);
        customEnvironmentValue={id,text:id};
      }
      updateEnvironmentChoiceLabel();
      syncEnvironmentControl();
    }
  }
  if(key==="customAdd"){
    generatedOtherItems=Math.random()<.4?[]:sample(availableAddOns(),1+Math.floor(Math.random()*2));
    renderOtherInput();
  }
}
function randomizeUnlocked(){
  ["people","pair","color","accentColor","mainStyle","formMode","heroMode","backPiece","bottomType","complexity","environment","customAdd"].forEach(key=>{
    if(!locks[key]) randomizeField(key);
  });
  syncPair();
  // The shuffle picks the prop and the headwear before the weather, so settle
  // them afterwards in that order — weather, then prop, then headwear — each
  // narrowing the seasons the next must share: no ice cream in heavy snow, no
  // beanie with an ice pop.
  const scene=fixedScene();
  if(scene){
    const envKey=$("#environment").value;
    let possible=seasonsOf(styles[scene]).filter(s=>!lights[envKey]?.seasons || lights[envKey].seasons.includes(s));
    const overlaps=list=>!list || list.some(s=>possible.includes(s));
    const propNow=backPieces[$("#backPiece").value];
    if(!locks.backPiece && propNow?.tag && (!overlaps(propNow.seasons) || !propSuits($("#backPiece").value,envKey,selectedHeroes()))){
      const fitting=backPieceCandidates(scene).filter(key=>overlaps(backPieces[key].seasons) && propSuits(key,envKey,selectedHeroes()));
      $("#backPiece").value=fitting.length?pick(fitting):"none";
    }
    const settled=backPieces[$("#backPiece").value]?.seasons;
    if(settled){
      const both=possible.filter(s=>settled.includes(s));
      if(both.length) possible=both;
    }
    if(!locks.heroMode){
      const kept=selectedHeroes().filter(hero=>hero==="none" || overlaps(heroMap[hero]?.seasons));
      setHeroValues(kept.length?kept:["none"]);
    }
  }
  refreshCustomSelects();
  updatePreviewFromSelections();
  $("#status").textContent="FILM ADVANCED · READY";
}
function resolveComplexity(){
  const value=$("#complexity").value;
  return value==="random"?pick(["simple","medium","medium","max"]):value;
}
// What one person wears. `sex` is set only when two people are drawn: a boy
// gets trousers and no one-piece. Returns the tags and the garments chosen.
const girlShoes=/mary janes|ballet flats/;
function dressFigure({main,season,dress,bottomPref,sex,colorTag,level,legsHidden,prop}){
  const tags=[];
  let top=null,bottom=null,onePiece=null,shoes=null;
  if(dress==="none") return {tags,items:[]};
  let set={...wardrobes[season][dress],...(main.wear?.[dress]||{})};
  // Nobody wears a coat indoors at home in winter.
  if(main.home && main.indoor && season==="winter") set={...set,...(styles.kotatsu.wear[dress]||{})};
  const pref=sex==="boy"?"pants":bottomPref;
  const onePieces=dress==="casual" && sex!=="boy"?(set.dresses||[]).concat(main.onepiece||[]):[];
  const wantsDress=pref==="dress" || (pref==="any" && Math.random()<(main.onepiece?.45:.2));
  if(wantsDress && onePieces.length){
    onePiece=main.onepiece && Math.random()<.6?pick(main.onepiece):pick(onePieces);
    tags.push(colorTag,onePiece);
  }else{
    let bottoms=set.bottoms;
    if(pref==="skirt" || pref==="dress") bottoms=set.bottoms.filter(item=>item.includes("skirt"));
    if(pref==="pants") bottoms=set.bottoms.filter(item=>!item.includes("skirt"));
    if(!bottoms.length) bottoms=set.bottoms;
    bottom=pick(bottoms);
    const kind=bottom.includes("skirt")?"skirt":"pants";
    const tops=set.tops.filter(item=>!topFits[item] || topFits[item]===kind);
    top=pick(tops.length?tops:set.tops);
    tags.push(colorTag,top,bottom);
    let neck=set.neck||[];
    if(sex==="boy") neck=neck.filter(item=>/necktie|collar|scarf/.test(item));
    if(neck.length && !ownCollar.test(top) && Math.random()<.75) tags.push(pick(neck));
  }
  if(!legsHidden){
    if(prop?.barefoot) shoes="barefoot";
    else{
      let pool=pairedShoes[onePiece]||main.shoes||set.shoes;
      if(sex==="boy") pool=pool.filter(item=>!girlShoes.test(item));
      shoes=pick(pool.length?pool:["sneakers"]);
    }
  }
  const bareLegs=onePiece?!pairedShoes[onePiece]:/skirt|shorts/.test(bottom);
  // No socks or tights under sandals, flip-flops, geta or zori.
  if(level>0 && !legsHidden && bareLegs && !/barefoot|socks|sandals|flip-flops|geta|zori/.test(shoes||"") && Math.random()<.7) tags.push(pick(legwear[season]));
  let extras=pairedExtras[onePiece]||set.extras;
  if(prop?.drops) extras=extras.filter(item=>!prop.drops.test(item));
  // An extra that only repeats what the top already says ("shirt untucked") is left out.
  if(top) extras=extras.filter(item=>!item.split(" ").every(word=>top.includes(word)));
  // Sleeves are described once: no "sleeves pushed up" on short sleeves or rolled-up ones.
  const said=tags.join(", ");
  if(/sleeve/.test(said)) extras=extras.filter(item=>!/^sleeves |sleeves (pushed|rolled)/.test(item));
  // A dress has no shirt to tuck, and nobody carries a tote bag around the house.
  if(onePiece) extras=extras.filter(item=>!/tucked|untucked/.test(item));
  // At home nobody carries a bag or wears a scarf, mittens or a buttoned coat,
  // and a blanket over the lap needs somewhere to sit (not at the stove).
  if(main.home) extras=extras.filter(item=>!/tote bag|scarf|mittens|coat buttoned/.test(item));
  if(main.standing) extras=extras.filter(item=>!/blanket/.test(item));
  if(main.extras) tags.push(...main.extras);
  tags.push(...sample(extras,[1,2,3][level]));
  if(shoes) tags.push(shoes);
  if(level===2){
    [top,bottom,onePiece,shoes].filter(Boolean).forEach(item=>{
      if(itemDetails[item]) tags.push(...itemDetails[item]);
    });
    // A yukata is not worn with a wristwatch or an earphone cord.
    const small=onePiece==="yukata"?specials.filter(item=>!/wristwatch|earphone/.test(item)):specials;
    tags.push(pick(small));
  }
  return {tags,items:[top,bottom,onePiece,shoes].filter(Boolean)};
}
function headwearTags(keys,level){
  const tags=[];
  keys.forEach(key=>{
    const hero=heroMap[key];
    if(hero?.tag) tags.push(hero.tag);
    if(level>0 && heroAccents[key]) tags.push(pick(heroAccents[key]));
  });
  return tags;
}
// 항목 하나가 '가디건, 티셔츠' 처럼 여러 절을 담기도 하므로 쉼표로 쪼갠 뒤 절 단위로 거른다.
let player=musicPlayers[0];
const clauses=list=>uniq(list.flatMap(t=>String(t).replace("{player}",player).split(",").map(c=>c.trim()).filter(Boolean)));
function sceneLights(main,season){
  const list=main.light.filter(key=>{
    const w=lights[key];
    if(!w) return false;
    if(w.seasons && !w.seasons.includes(season)) return false;
    if(w.indoorOnly && !main.indoor) return false;
    return true;
  });
  return list.length?list:main.light.filter(key=>lights[key] && !lights[key].seasons);
}
function generate(){
  player=pick(musicPlayers);
  const baseColor=$("#color").value;
  const accentColor=$("#accentColor").value;
  const hasAccent=accentColor!=="none" && accentColor!==baseColor;
  const colorTag=hasAccent?`outfit color: ${baseColor} with ${accentColor} accents`:`outfit color: ${baseColor}`;
  const {key:mainKey,rolled,season}=resolveScene();
  const main=styles[mainKey];
  const complexity=resolveComplexity();
  const level=complexity==="simple"?0:complexity==="medium"?1:2;
  const people=$("#people").value==="duo"?$("#pair").value:"solo";
  const pair=pairs[people]||null;

  const heroCandidates=selectedHeroes();
  let heroKeys=heroMode==="all"?heroCandidates:[pick(heroCandidates)];
  // Headwear ticked by hand stays with a hand-picked scene. With a rolled scene,
  // whatever that scene or season has no use for is left off.
  if(rolled) heroKeys=heroKeys.filter(key=>key==="none" || heroFits(key,mainKey,season));
  // Out of season is left off even when ticked by hand: no beanie in July.
  heroKeys=heroKeys.filter(key=>!heroMap[key]?.seasons || heroMap[key].seasons.includes(season));
  if(!heroKeys.length) heroKeys=["none"];
  heroKeys=resolveHeroConflicts(heroKeys);

  let lightKey=$("#environment").value;
  const customLight=lightKey==="custom"?customEnvironmentValue.text.trim():"";
  if(lightKey==="random" || (lightKey==="custom" && !customLight)){
    // A prop picked by hand pulls a rolled light toward weather it belongs in.
    const pool=sceneLights(main,season);
    const handProp=backPieces[$("#backPiece").value];
    const fitting=handProp?.lights?pool.filter(light=>handProp.lights.includes(light)):[];
    lightKey=pick(fitting.length?fitting:pool);
  }
  const weather=lights[lightKey]||null;
  const wetOut=Boolean(weather?.wet) && !main.indoor;
  const dark=lightKey==="outage";

  let backKey=$("#backPiece").value;
  const propRolled=backKey==="random";
  if(propRolled){
    // A rolled prop also has to suit the season, the light and the headwear;
    // out in the rain only what you would carry in the rain.
    const fitting=backPieceCandidates(mainKey,season).filter(key=>propSuits(key,lightKey,heroKeys) && (!wetOut || backPieces[key].wet));
    backKey=Math.random()<.75 && fitting.length?pick(fitting):"none";
  }
  // The same for a prop picked by hand: no ice pop in the snow.
  if(backPieces[backKey]?.seasons && !backPieces[backKey].seasons.includes(season)) backKey="none";

  let dress=$("#formMode").value;
  if(dress==="random") dress=pick(main.dress);
  const bottomPref=$("#bottomType").value;
  const addOn=parseAddOns(mainKey,season,Boolean(weather?.wet) || dark,lightKey);

  // What the place, the weather and the lens give — the base of the picture.
  const place=[main.name,...sample(main.place,[2,3,5][level])];
  const sky=lightKey==="custom"?[customLight]:(weather?weather[main.indoor?"in":"out"]:[]);
  // Rain outdoors replaces the scene's own air: no heat haze in a downpour.
  const air=wetOut||dark?[]:sample(main.air,[1,2,3][level]);
  if(main.seasons && !main.indoor && !wetOut && Math.random()<.5) air.push(pick(seasonAir[season]));
  const tone=tones[season];
  const toned=Boolean(tone) && !main.indoor && tone.lights.includes(lightKey);
  const toneTags=toned?sample(tone.tags,[1,2,2][level]):[];
  const lensTags=sample(toned?lens.filter(effect=>!tone.dropLens.includes(effect)):lens,[1,2,3][level]);
  const sceneTags=[...place,...sky,...air,...toneTags,...lensTags,...addOn.tags];
  if(level===2) sceneTags.push("detailed background");

  let parts,oneLine,momentLabel,propLabel;
  if(!pair){
    // ONE PERSON. The moment decides what is in frame and what the hands are
    // doing. Weather may bring its own moments. A prop needs a free hand, and
    // some moments need a particular prop; a prop picked by hand is kept and
    // the moment gives way, a rolled one gives way instead.
    let pool=main.moments;
    const own=weather?.moments?.[main.indoor?"in":"out"];
    if(own?.length) pool=wetOut||dark?own:main.moments.concat(own);
    let moments=pool.filter(moment=>momentFits(moment,backKey));
    if(!moments.length && propRolled){
      backKey="none";
      moments=pool.filter(moment=>momentFits(moment,"none"));
    }
    if(!moments.length) moments=pool;
    const prop=backPieces[backKey]||backPieces.none;
    const moment=pick(moments);
    // Feet out of frame means no shoes are written, and a turned back means no
    // expression is.
    const legsHidden=/upper body|cowboy shot/.test(moment);
    const faceHidden=/from behind|silhouette/.test(moment) && !/looking back|turning/.test(moment);
    const figure=dressFigure({main,season,dress,bottomPref,sex:null,colorTag,level,legsHidden,prop});
    const action=[moment];
    if(prop.tag) action.push(prop.tag);
    if(!faceHidden) action.push(pick(expressions));
    const person=[...action,...figure.tags,...headwearTags(heroKeys,level)];
    const base=clauses(sceneTags);
    const charPart=clauses(person).filter(tag=>!base.includes(tag));
    parts=[{label:"BASE",text:base.join(", ")},{label:"CHARACTER",text:charPart.join(", ")}];
    oneLine=clauses([...action,...sceneTags,...figure.tags,...headwearTags(heroKeys,level)]).join(", ");
    momentLabel=null;
    propLabel=backKey;
  }else{
    // TWO PEOPLE. One shared moment; each person gets a part of it, their own
    // clothes, their own face. A moment made for this scene is preferred.
    const fits=duoMoments.filter(m=>{
      if(m.scenes && !m.scenes.includes(mainKey)) return false;
      if(m.seasons && !m.seasons.includes(season)) return false;
      if(m.where==="out" && main.indoor) return false;
      if(m.where==="in" && !main.indoor) return false;
      if(m.weather && !m.weather.includes(lightKey)) return false;
      if(m.dry && (weather?.wet || dark)) return false;
      if(!m.weather && (wetOut || dark)) return false;
      return true;
    });
    const local=fits.filter(m=>m.scenes || m.weather);
    const duo=local.length && Math.random()<.75?pick(local):(fits.length?pick(fits):{base:"full body, side-by-side",a:"looking at another",b:""});
    let prop=backPieces[backKey]||backPieces.none;
    if(duo.prop) prop=backPieces.none;
    if(duo.ears && prop.clash?.includes("headphones")){prop=backPieces.none; backKey="none";}
    const offEars=keys=>duo.ears?keys.filter(key=>heroMap[key]?.zone!=="ears"):keys;
    const freeA=!duoBusy.test(duo.a), freeB=!duoBusy.test(duo.b);
    let propSide=null;
    if(prop.tag) propSide=freeA?"a":freeB?"b":null;
    if(prop.tag && !propSide){prop=backPieces.none; backKey="none";}
    if(duo.prop) backKey=duo.prop;
    const legsHidden=/upper body|cowboy shot/.test(duo.base);
    const faceHidden=/from behind|silhouette/.test(duo.base);
    const otherColors=outfitColors.filter(color=>color!==baseColor);
    const colorB=`outfit color: ${pick(otherColors)}`;
    const heroB=Math.random()<.3?resolveHeroConflicts(sample(Object.keys(heroMap).filter(key=>key!=="none" && heroFits(key,mainKey,season)),1)):["none"];
    const make=(side,sex,color,heroes)=>{
      const own=[sex];
      if(duo[side]) own.push(duo[side]);
      if(propSide===side) own.push(prop.tag);
      // A moment that already says how the face looks keeps its own expression.
      if(!faceHidden && !/smile|laugh|grin|sleeping|flinching|closed eyes/.test(duo[side])) own.push(pick(expressions));
      const figure=dressFigure({main,season,dress,bottomPref,sex,colorTag:color,level,legsHidden,prop:propSide===side?prop:null});
      // A ribbon or a flower crown is left off a boy.
      const worn=sex==="boy"?heroes.filter(key=>!/ribbon|flowercrown/.test(key)):heroes;
      return clauses([...own,...figure.tags,...headwearTags(worn,level)]);
    };
    const charA=make("a",pair.a,colorTag,offEars(heroKeys));
    const charB=make("b",pair.b,colorB,offEars(heroB));
    const base=clauses([pair.count,duo.base,...sceneTags]);
    parts=[{label:"BASE",text:base.join(", ")},{label:"CHARACTER 1",text:charA.join(", ")},{label:"CHARACTER 2",text:charB.join(", ")}];
    oneLine=parts.map(part=>part.text).join(" | ");
    momentLabel=duo.base;
    propLabel=backKey;
  }

  updateHeroPreview(heroKeys,mainKey);
  renderOutput(parts,oneLine,Boolean(pair));
  const seasonName=season.toUpperCase();
  $("#chips").innerHTML=[
    main.label,
    seasonName,
    pair?`TWO · ${pair.count.toUpperCase()}`:null,
    dress==="none"?"SCENE ONLY":dress.toUpperCase(),
    dress==="none"?null:`BASE ${baseColor.toUpperCase()}`,
    dress!=="none" && hasAccent?`ACCENT ${accentColor.toUpperCase()}`:null,
    lightKey==="custom"?customLight.toUpperCase():`WEATHER ${lightKey.toUpperCase()}`,
    propLabel==="none"?"EMPTY HANDS":`HOLDING ${propLabel.toUpperCase()}`,
    heroKeys.every(key=>key==="none")?null:heroKeys.map(key=>key.toUpperCase()).join(" + "),
    dress==="none" || bottomPref==="any"?null:`BOTTOM ${bottomPref.toUpperCase()}`,
    complexity.toUpperCase(),
    addOn.label
  ].filter(Boolean).map(x=>`<span class="note">${x}</span>`).join("");

  // A roll has 27 frames; the print carries its number.
  const now=new Date();
  const frame=printId;
  $("#meta").innerHTML=`ROLL NO. H-${String(rollNo).padStart(2,"0")}<br>FRAME: ${String(frame).padStart(2,"0")} / ${ROLL_LENGTH}<br>STATUS: DEVELOPED<br>${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  $("#dateStamp").textContent=`'${String(now.getFullYear()).slice(2)} ${String(now.getMonth()+1).padStart(2," ")} ${String(now.getDate()).padStart(2," ")}`;
  // The strip along the top of the print, the way a negative is marked on its edge.
  $("#printCaption").textContent=`▸ ${String(frame).padStart(2,"0")}  ${sceneDisplayText(mainKey).name}`;
  printId++;
  if(printId>ROLL_LENGTH){printId=1;rollNo++;}

  const feed=$("#paperFeed");
  const machine=$("#machine");
  // Each print lands at its own small angle, on top of the ones already there.
  pile=Math.min(pile+1,3);
  feed.dataset.pile=String(pile);
  $("#receipt").style.setProperty("--tilt",`${(Math.random()*4.4-2.2).toFixed(2)}deg`);
  feed.classList.remove("developing","hung");
  machine.classList.add("firing");
  void feed.offsetWidth;
  feed.classList.add("developing");
  $("#status").textContent="SHUTTER · CLICK";
  setTimeout(()=>{
    feed.classList.remove("developing");
    feed.classList.add("hung");
    machine.classList.remove("firing");
    $("#status").textContent=`FRAME ${String(frame).padStart(2,"0")} · ${mainKey.toUpperCase()}`;
  },1600);
  sparks();
}
// The prompt as one line (what COPY and SAVE take), and the same prompt cut
// into NovelAI's base prompt and character prompts. Two people are always
// shown cut; one person only when asked.
let lastParts=[];
function splitWanted(){
  try{return localStorage.getItem("halation.split")==="1";}catch(_){return false;}
}
function renderOutput(parts,oneLine,forced){
  lastParts=parts;
  $("#prompt").textContent=oneLine;
  const split=forced || splitWanted();
  $("#prompt").hidden=split;
  const box=$("#promptParts");
  box.hidden=!split;
  box.innerHTML=split?parts.map((part,i)=>
    `<div class="part"><div class="part-head"><span>${part.label}</span><button class="part-copy swap" type="button" data-part="${i}"><span class="say">COPY</span><span class="say done" aria-hidden="true">COPIED</span></button></div><div class="part-text">${part.text}</div></div>`
  ).join(""):"";
  const toggle=$("#splitBtn");
  toggle.hidden=forced;
  toggle.setAttribute("aria-pressed",String(split));
}
// The flash fires once per frame.
function sparks(){
  const flash=$("#flashUnit");
  flash.classList.remove("firing");
  void flash.offsetWidth;
  flash.classList.add("firing");
}
// Both labels sit in the button all the time, so saying COPIED never changes its width
// and the row of buttons does not wrap.
function flashCopied(button){
  button.classList.add("copied");
  clearTimeout(button._copied);
  button._copied=setTimeout(()=>button.classList.remove("copied"),850);
}
async function copyPrompt(){
  const text=$("#prompt").textContent;
  const btn=$("#copyBtn");
  try{
    await navigator.clipboard.writeText(text);
  }catch(e){
    const t=document.createElement("textarea");
    t.value=text;document.body.appendChild(t);t.select();
    document.execCommand("copy");t.remove();
  }
  flashCopied(btn);
}
function saveTxt(){
  const blob=new Blob([$("#prompt").textContent],{type:"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="halation_print.txt";a.click();URL.revokeObjectURL(a.href)
}

document.querySelectorAll(".body-chip").forEach(b=>b.addEventListener("click",()=>document.body.dataset.theme=b.dataset.t));
function updateLockButton(b){
  const key=b.dataset.lock;
  const label=b.closest(".cell")?.querySelector("label")?.textContent.trim()||"SETTING";
  // Tooltips stay in Korean whichever language the labels are shown in.
  const description=`${label} ${locks[key]?"잠금 풀기 · 지금은 섞어도 그대로":"잠그기 · 섞어도 안 바뀜"}`;
  b.classList.toggle("held",locks[key]);
  b.textContent=locks[key]?"◆":"◇";
  b.setAttribute("aria-pressed",String(locks[key]));
  b.setAttribute("aria-label",description);
  b.dataset.tooltip=description;
  b.removeAttribute("title");
}
document.querySelectorAll(".hold").forEach(b=>{
  updateLockButton(b);
  b.addEventListener("click",()=>{
    const key=b.dataset.lock;
    locks[key]=!locks[key];
    updateLockButton(b);
  });
});

function updatePreviewFromSelections(){
  const candidates=selectedHeroes();
  const previewKeys=heroMode==="all"?candidates:[candidates[0]||"none"];
  updateHeroPreview(previewKeys,$("#mainStyle").value);
  renderColorChips();
}
function setHeroMode(mode){
  heroMode=mode;
  const button=document.querySelector('[data-mode-group="heroMode"]');
  const together=mode==="all";
  button.setAttribute("aria-pressed",String(together));
  button.textContent=together
    ?(settingsLanguage==="ko"?"＋ 함께 사용":"＋ Use together")
    :(settingsLanguage==="ko"?"🎲 랜덤 1개":"🎲 Random one");
  updateHeroSummary();
}
function closeHeroMenu(){
  const root=document.querySelector('[data-multi="heroMode"]');
  root.classList.remove("open");
  root.querySelector(".picker-face").setAttribute("aria-expanded","false");
  root.querySelector(".picker-list").hidden=true;
}
const heroRoot=document.querySelector('[data-multi="heroMode"]');
const heroToggle=$("#heroModeToggle");
const heroMenu=$("#heroModeMenu");
heroToggle.addEventListener("click",event=>{
  event.stopPropagation();
  closeCustomMenus();
  const opening=!heroRoot.classList.contains("open");
  heroRoot.classList.toggle("open",opening);
  heroToggle.setAttribute("aria-expanded",String(opening));
  heroMenu.hidden=!opening;
});
heroMenu.addEventListener("click",event=>event.stopPropagation());
heroInputs().forEach(input=>input.addEventListener("change",()=>{
  if(input.checked){
    if(input.value==="none"){
      heroInputs().forEach(other=>other.checked=other===input);
    }else{
      const noneInput=heroInputs().find(other=>other.value==="none");
      if(noneInput) noneInput.checked=false;
    }
  }
  if(!selectedHeroes().length){
    input.checked=true;
    $("#status").textContent="KEEP AT LEAST ONE OPTION";
  }
  updateHeroSummary();
  updatePreviewFromSelections();
}));
document.querySelector('[data-mode-group="heroMode"]').addEventListener("click",()=>{
  setHeroMode(heroMode==="all"?"random":"all");
  updatePreviewFromSelections();
});
document.addEventListener("click",closeAllMenus);
document.addEventListener("keydown",event=>{
  if(event.key==="Escape") closeAllMenus();
});

// Pickers: every select gets the same drop-down list the headwear menu uses.
const customSelects=[];
function closeCustomMenus(){customSelects.forEach(cs=>cs.close());}
function closeAllMenus(){closeHeroMenu();closeCustomMenus();}
function refreshCustomSelects(){customSelects.forEach(cs=>cs.refresh());}
function buildCustomSelect(select){
  const wrap=document.createElement("div");
  wrap.className="picker";
  select.parentNode.insertBefore(wrap,select);
  wrap.appendChild(select);
  const toggle=document.createElement("button");
  toggle.type="button";
  toggle.className="picker-face";
  toggle.setAttribute("aria-expanded","false");
  toggle.setAttribute("aria-haspopup","listbox");
  toggle.innerHTML='<span class="picker-value"></span>';
  const menu=document.createElement("div");
  menu.className="picker-list";
  menu.hidden=true;
  wrap.append(toggle,menu);
  const summary=toggle.querySelector(".picker-value");
  const refresh=()=>{
    const option=select.options[select.selectedIndex];
    summary.textContent=option?option.textContent:"";
  };
  const close=()=>{
    wrap.classList.remove("open");
    toggle.setAttribute("aria-expanded","false");
    menu.hidden=true;
  };
  const open=()=>{
    closeAllMenus();
    menu.innerHTML=[...select.options].map(option=>
      `<button type="button" class="picker-item${option.value===select.value?" on":""}" data-value="${option.value}">${option.textContent}</button>`
    ).join("");
    wrap.classList.add("open");
    toggle.setAttribute("aria-expanded","true");
    menu.hidden=false;
  };
  toggle.addEventListener("click",event=>{
    event.stopPropagation();
    const opening=menu.hidden;
    closeAllMenus();
    if(opening) open();
  });
  menu.addEventListener("click",event=>{
    event.stopPropagation();
    const target=event.target.closest(".picker-item");
    if(!target) return;
    select.value=target.dataset.value;
    select.dispatchEvent(new Event("change"));
    refresh();
    close();
  });
  refresh();
  customSelects.push({select,wrap,refresh,close,open});
}

$("#environment").addEventListener("change",()=>{
  if($("#environment").value==="custom"){
    customEnvironmentValue={id:null,text:""};
    $("#environmentCustom").value="";
  }
  updateEnvironmentChoiceLabel();
  syncEnvironmentControl();
  if($("#environment").value==="custom") $("#environmentCustom").focus();
});

document.querySelectorAll(".dice").forEach(button=>button.addEventListener("click",()=>{
  randomizeField(button.dataset.reroll);
  syncPair();
  refreshCustomSelects();
  updatePreviewFromSelections();
  $("#status").textContent=`${settingTranslations.labels[button.dataset.reroll][0]} UPDATED`;
}));
$("#color").addEventListener("change",renderColorChips);
$("#accentColor").addEventListener("change",renderColorChips);
// Moving to another scene by hand lets go of whatever was set for the old one and
// has no place in the new one. Locked fields are left exactly as they are.
function releaseMisfits(){
  const pool=scenePool();
  const prop=$("#backPiece").value;
  if(!locks.backPiece && backPieces[prop] && prop!=="none" && !pool.some(key=>propFits(prop,key))) $("#backPiece").value="random";
  const light=$("#environment").value;
  if(!locks.environment && lights[light] && !pool.some(key=>styles[key].light.includes(light))) $("#environment").value="random";
  if(!locks.heroMode){
    const kept=selectedHeroes().filter(hero=>hero==="none" || pool.some(key=>heroMap[hero].styles.includes(key)));
    setHeroValues(kept.length?kept:["none"]);
  }
  if(!locks.customAdd && generatedOtherItems.length && fixedScene()){
    generatedOtherItems=generatedOtherItems.filter(item=>addOnFits(item,fixedScene()));
    renderOtherInput();
  }
  refreshCustomSelects();
}
// PAIR only matters with two people; with one it stays visible but out of the way.
function syncPair(){
  const idle=$("#people").value!=="duo";
  $("#pairCell").classList.toggle("idle",idle);
  $("#pairCell").setAttribute("aria-disabled",String(idle));
}
$("#mainStyle").addEventListener("change",()=>{
  releaseMisfits();
  updatePreviewFromSelections();
});

const settingTranslations={
  labels:{
    color:["BASE COLOR","기본 색상"],accentColor:["ACCENT","포인트 색상"],mainStyle:["SCENE","장면"],
    heroMode:["HEADWEAR","머리에 쓴 것"],backPiece:["IN HAND","손에 든 것"],bottomType:["BOTTOM","하의"],
    complexity:["COMPLEXITY","복잡도"],environment:["WEATHER","날씨·빛"],customAdd:["OTHER","기타"],people:["PEOPLE","인원"],pair:["PAIR","조합"],
    formMode:["OUTFIT","옷차림"]
  },
  seasons:{spring:"봄",summer:"여름",autumn:"가을",winter:"겨울"},
  values:{
    color:{white:"흰색",navy:"남색",black:"검정",gray:"회색",beige:"베이지",cream:"크림",["light blue"]:"하늘색",khaki:"카키",brown:"갈색",["pale pink"]:"연분홍"},
    accentColor:{none:"없음",white:"흰색",navy:"남색",black:"검정",gray:"회색",beige:"베이지",cream:"크림",["light blue"]:"하늘색",khaki:"카키",brown:"갈색",["pale pink"]:"연분홍"},
    mainStyle:{random:"랜덤",["season:spring"]:"랜덤 · 봄",["season:summer"]:"랜덤 · 여름",["season:autumn"]:"랜덤 · 가을",["season:winter"]:"랜덤 · 겨울",
      sakura:"벚꽃길",classroom:"교실 창가",field:"강둑",station:"시골 역",
      seaside:"방파제",busstop:"시골 버스 정류장",stream:"계곡",festival:"여름 축제",
      rooftop:"학교 옥상",ginkgo:"은행나무길",library:"도서실",crossing:"건널목",
      snow:"눈 오는 골목",konbini:"밤 편의점",kotatsu:"코타츠 방",dawn:"새벽 언덕",
      hanami:"벚꽃 아래 소풍",hanabi:"불꽃놀이 밤",tatamiroom:"여름 다다미방",cornershop:"동네 구멍가게",
      market:"동네 마트",shoppingst:"상점가 귀갓길",kitchen:"집 부엌",veranda:"빨래 너는 베란다",room:"내 방",bus:"버스 안"},
    people:{solo:"혼자",duo:"둘"},
    pair:{gg:"여자 둘",bg:"남자와 여자",bb:"남자 둘"},
    heroMode:{strawhat:"밀짚모자",cap:"야구 모자",flowercrown:"화관",hairclip:"머리핀",ribbon:"머리 리본",headphones:"헤드폰",beanie:"비니",earmuffs:"귀마개",none:"없음"},
    backPiece:{none:"없음",random:"랜덤",camera:"필름 카메라",earphones:"이어폰과 플레이어",book:"문고본",notebook:"공책과 연필",bag:"책가방",umbrella:"투명 우산",bicycle:"자전거",can:"캔 음료",bread:"멜론빵",dango:"경단 꼬치",bouquet:"들꽃 다발",ramune:"라무네",shavedice:"빙수",fan:"부채",sparkler:"불꽃놀이",candyapple:"사과 사탕",net:"잠자리채",sandals:"벗어 든 샌들",leaf:"낙엽",sweetpotato:"군고구마",bun:"찐빵",hotcan:"따뜻한 캔커피",mikan:"귤",mug:"머그컵",snowball:"눈뭉치",popsicle:"아이스바",icecream:"아이스크림콘",watermelon:"수박 한 조각",bento:"도시락",basket:"장바구니",groceries:"파 꽂힌 장바구니 봉투",plasticbag:"비닐봉지",flashlight:"손전등",ladle:"국자",laundrybasket:"빨래 바구니"},
    formMode:{casual:"사복",uniform:"교복",none:"장면만 (옷 없음)",random:"랜덤"},
    bottomType:{any:"랜덤",skirt:"치마",pants:"바지",dress:"원피스"},
    complexity:{medium:"보통",simple:"간단",max:"최대",random:"랜덤"},
    environment:{random:"랜덤",morning:"아침",noon:"한낮",dappled:"나뭇잎 그늘",golden:"해 질 녘",bluehour:"땅거미",overcast:"흐림",afterrain:"비 갠 뒤",night:"밤",dawn:"해돋이",shower:"소나기",thunder:"천둥번개",outage:"정전된 밤",snowy:"함박눈",sunshower:"여우비",custom:"기타"}
  },
  customEnvironments:{drizzle:"이슬비",["sun shower"]:"여우비",["strong wind"]:"센 바람",["morning mist"]:"아침 안개",["thin fog"]:"옅은 안개",["light snow"]:"가랑눈",rainbow:"무지개",["crescent moon"]:"초승달",["full moon"]:"보름달",thunderhead:"소나기구름"},
  addOns:{
    cat:"근처의 길고양이",contrail:"비행운",paperPlane:"날아가는 종이비행기",homecat:"옆에서 자는 고양이",sunbeam:"햇빛 속 먼지",
    droplets:"살갗의 물방울",breath:"하얀 입김",petal:"어깨에 앉은 꽃잎",
    dragonfly:"고추잠자리",wind:"바람에 날리는 옷",sparrows:"전깃줄의 참새",bandaid:"무릎의 반창고"
  },
  heroPreview:{
    none:{name:"쓴 것 없음",sub:"머리에 아무것도 없음"},
    strawhat:{name:"밀짚모자",sub:"햇볕을 가리는 엮은 챙"},
    cap:{name:"야구 모자",sub:"챙이 굽은 면 모자"},
    flowercrown:{name:"화관",sub:"근처에 핀 것으로 엮음"},
    hairclip:{name:"머리핀",sub:"옆머리의 작은 핀"},
    ribbon:{name:"머리 리본",sub:"한 번 묶은 민무늬 리본"},
    headphones:{name:"헤드폰",sub:"귀를 덮고 줄이 늘어짐"},
    beanie:{name:"비니",sub:"눌러쓴 니트 모자"},
    earmuffs:{name:"귀마개",sub:"추위를 막는 폭신한 패드"}
  }
};
function updateEnvironmentChoiceLabel(){
  const option=$("#environment").querySelector('option[value="custom"]');
  option.textContent=settingsLanguage==="ko"?"기타":"Other";
}
function renderEnvironmentInput(){
  if(!customEnvironmentValue.id) return;
  const id=customEnvironmentValue.id;
  $("#environmentCustom").value=settingsLanguage==="ko"?(settingTranslations.customEnvironments[id]||id):id;
}
function syncEnvironmentControl(){
  const custom=$("#environment").value==="custom";
  const control=$("#environment").closest(".picker")||$("#environment");
  control.hidden=custom;
  $("#environmentInlineEditor").hidden=!custom;
  if(custom) renderEnvironmentInput();
}
function renderOtherInput(){
  if(!generatedOtherItems.length){
    if($("#customAdd").dataset.generated==="true") $("#customAdd").value="";
    $("#customAdd").dataset.generated="false";
    return;
  }
  $("#customAdd").dataset.generated="true";
  $("#customAdd").value=generatedOtherItems.map(item=>settingsLanguage==="ko"?(settingTranslations.addOns[item.id]||item.tag):item.tag).join(", ");
}
function settingLabel(group,value){
  if(settingsLanguage==="ko") return settingTranslations.values[group]?.[value]||value;
  const input=document.querySelector(`[data-multi="${group}"] input[value="${value}"]`);
  return input?.dataset.label||value;
}
function updateSettingsLanguage(){
  const korean=settingsLanguage==="ko";
  const fieldIds=["people","pair","color","accentColor","mainStyle","formMode","heroMode","backPiece","bottomType","complexity","environment","customAdd"];
  fieldIds.forEach(id=>{
    const control=$("#"+id);
    const label=control?.closest(".cell")?.querySelector(":scope > label");
    const pair=settingTranslations.labels[id];
    if(label&&pair) label.textContent=pair[korean?1:0];
  });
  const heroLabel=$("#heroModeToggle").closest(".cell").querySelector(":scope > label");
  heroLabel.textContent=settingTranslations.labels.heroMode[korean?1:0];
  ["people","pair","color","accentColor","mainStyle","formMode","backPiece","bottomType","complexity","environment"].forEach(id=>{
    [...$("#"+id).options].forEach(option=>{
      if(!option.dataset.en) option.dataset.en=option.textContent;
      option.textContent=korean?(settingTranslations.values[id]?.[option.value]||option.dataset.en):option.dataset.en;
    });
  });
  heroInputs().forEach(input=>{
    input.nextElementSibling.textContent=korean?settingTranslations.values.heroMode[input.value]:input.dataset.label;
  });
  updateEnvironmentChoiceLabel();
  renderEnvironmentInput();
  renderOtherInput();
  const button=$("#settingsLanguage");
  button.textContent=korean?"EN 보기":"한글 보기";
  button.setAttribute("aria-pressed",String(korean));
  document.querySelectorAll(".hold").forEach(updateLockButton);
  document.querySelectorAll(".dice").forEach(reroll=>{
    const label=reroll.closest(".cell")?.querySelector("label")?.textContent.trim()||"SETTING";
    const description=`${label}만 랜덤으로`;
    reroll.setAttribute("aria-label",description);
    reroll.dataset.tooltip=description;
  });
  $("#environmentCustom").placeholder=korean?"이슬비, 여우비, 아침 안개...":"drizzle, sun shower, morning mist...";
  refreshCustomSelects();
  updateHeroPreview(lastPreview.heroes);
  renderColorChips();
  setHeroMode(heroMode);
}
$("#settingsLanguage").addEventListener("click",()=>{
  settingsLanguage=settingsLanguage==="en"?"ko":"en";
  updateSettingsLanguage();
});
$("#customAdd").addEventListener("input",()=>{
  if($("#customAdd").dataset.generated==="true"){
    generatedOtherItems=[];
    $("#customAdd").dataset.generated="false";
  }
});
$("#environmentCustom").addEventListener("input",()=>{
  customEnvironmentValue={id:null,text:$("#environmentCustom").value.trim()};
});
// Clicking the arrow area of the custom-light input returns to the choice list.
$("#environmentCustom").addEventListener("click",event=>{
  const rect=event.currentTarget.getBoundingClientRect();
  if(rect.right-event.clientX>30) return;
  event.stopPropagation();
  $("#environment").value="random";
  syncEnvironmentControl();
  refreshCustomSelects();
  const environmentSelect=customSelects.find(cs=>cs.select.id==="environment");
  if(environmentSelect) environmentSelect.open();
});
["people","pair","color","accentColor","mainStyle","formMode","backPiece","bottomType","complexity","environment"].forEach(id=>buildCustomSelect($("#"+id)));
$("#people").addEventListener("change",syncPair);
syncPair();
updateSettingsLanguage();
syncEnvironmentControl();
updatePreviewFromSelections();

// Every shutter release shuffles the unlocked fields first; locked ones stay.
$("#printBtn").addEventListener("click",()=>{
  randomizeUnlocked();
  generate();
});
$("#rerollBtn").addEventListener("click",()=>generate());
$("#copyBtn").addEventListener("click",copyPrompt);
$("#splitBtn").addEventListener("click",()=>{
  const on=!splitWanted();
  try{localStorage.setItem("halation.split",on?"1":"0");}catch(_){}
  if(lastParts.length) renderOutput(lastParts,$("#prompt").textContent,false);
  else $("#splitBtn").setAttribute("aria-pressed",String(on));
});
$("#promptParts").addEventListener("click",async event=>{
  const button=event.target.closest(".part-copy");
  if(!button) return;
  const text=lastParts[Number(button.dataset.part)]?.text||"";
  try{await navigator.clipboard.writeText(text);}catch(_){
    const t=document.createElement("textarea");t.value=text;document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();
  }
  flashCopied(button);
});
$("#saveBtn").addEventListener("click",saveTxt);

// Print tear-off: drag the perforation downward to take the current print away.
const tearHandle=$("#tearHandle");
const receiptEl=$("#receipt");
let tearStartY=0, tearDelta=0, tearing=false;

tearHandle.addEventListener("pointerdown",e=>{
  tearing=true;
  tearStartY=e.clientY;
  tearDelta=0;
  tearHandle.setPointerCapture(e.pointerId);
  receiptEl.classList.add("pulling");
});
tearHandle.addEventListener("pointermove",e=>{
  if(!tearing) return;
  tearDelta=Math.max(0,e.clientY-tearStartY);
  const capped=Math.min(tearDelta,120);
  receiptEl.style.transform=`translateY(${capped}px) rotate(${capped*.004}deg)`;
  receiptEl.style.opacity=String(Math.max(.35,1-capped/180));
});
function tearOff(){
  pile=0;
  receiptEl.classList.add("taken");
  $("#status").textContent="PRINT TAKEN";
  setTimeout(()=>{
    $("#paperFeed").style.display="none";
    $("#paperFeed").classList.remove("hung");
  },190);
}
// Dragging far enough tears it; so does a plain click on the perforation,
// which is a press let go without having moved.
function finishTear(e){
  if(!tearing) return;
  tearing=false;
  try{tearHandle.releasePointerCapture(e.pointerId)}catch(_){}
  receiptEl.classList.remove("pulling");
  const clicked=e.type==="pointerup" && tearDelta<5;
  if(tearDelta>=72 || clicked){
    tearOff();
  }else{
    receiptEl.style.transform="";
    receiptEl.style.opacity="";
  }
}
tearHandle.addEventListener("pointerup",finishTear);
tearHandle.addEventListener("pointercancel",finishTear);
tearHandle.addEventListener("keydown",e=>{
  if(e.key!=="Enter" && e.key!==" ") return;
  e.preventDefault();
  tearOff();
});

// Any new print restores the slip.
const originalGenerate=generate;
generate=function(){
  $("#paperFeed").style.display="";
  receiptEl.classList.remove("taken");
  receiptEl.style.transform="";
  receiptEl.style.opacity="";
  originalGenerate();
};


const themeToggle=$("#themeToggle");
const themeControl=document.querySelector(".body-colors");
themeToggle.addEventListener("click",()=>{
  const isOpen=themeControl.classList.toggle("open");
  themeToggle.setAttribute("aria-expanded",String(isOpen));
});
document.addEventListener("click",e=>{
  if(!themeControl.contains(e.target)){
    themeControl.classList.remove("open");
    themeToggle.setAttribute("aria-expanded","false");
  }
});
document.querySelectorAll(".body-chip").forEach(b=>b.addEventListener("click",()=>{
  themeControl.classList.remove("open");
  themeToggle.setAttribute("aria-expanded","false");
}));

const modal=$("#helpModal");
$("#helpBtn").addEventListener("click",()=>modal.classList.add("open"));
$("#closeHelp").addEventListener("click",()=>modal.classList.remove("open"));
$("#okHelp").addEventListener("click",()=>modal.classList.remove("open"));
modal.addEventListener("click",e=>{if(e.target===modal) modal.classList.remove("open")});
document.addEventListener("keydown",e=>{if(e.key==="Escape") modal.classList.remove("open")});

// First thing on opening: one person or two. The choice is locked in place,
// and the lock can be lifted from the frame like any other.
const castModal=$("#castModal");
document.querySelectorAll(".cast").forEach(button=>button.addEventListener("click",()=>{
  $("#people").value=button.dataset.people;
  locks.people=true;
  if(button.dataset.pair){$("#pair").value=button.dataset.pair; locks.pair=true;}
  document.querySelectorAll(".hold").forEach(updateLockButton);
  syncPair();
  refreshCustomSelects();
  castModal.classList.remove("open");
  $("#printBtn").focus();
}));
{
  const now=new Date();
  $("#castStamp").textContent=`'${String(now.getFullYear()).slice(2)} ${String(now.getMonth()+1).padStart(2," ")} ${String(now.getDate()).padStart(2," ")}`;
}
// Closing it without an answer leaves PEOPLE as it is, unlocked.
const closeCast=()=>castModal.classList.remove("open");
$("#closeCast").addEventListener("click",closeCast);
castModal.addEventListener("click",e=>{if(e.target===castModal) closeCast();});
document.addEventListener("keydown",e=>{if(e.key==="Escape") closeCast();});
document.querySelector(".cast").focus();

// How far the desk may reach before the right edge of the window, for the
// photos lying on it.
function placeSnaps(){
  const desk=document.querySelector(".desk");
  if(!desk) return;
  desk.style.setProperty("--room",Math.max(0,innerWidth-24-desk.getBoundingClientRect().left)+"px");
}
placeSnaps();
addEventListener("resize",placeSnaps);
