// Prompt Archive : Bestiary - generator logic and UI interactions
const $ = s => document.querySelector(s);
const pick = a => a[Math.floor(Math.random()*a.length)];
const sample = (a,n) => [...a].sort(()=>Math.random()-.5).slice(0,Math.min(n,a.length));
const uniq = a => [...new Set(a)];

// An ornament that names a body part is dropped unless that part is actually there.
function addOnFits(item,backKey,heroKeys){
  if(item.needsBack && !item.needsBack.includes(backKey)) return false;
  if(item.needsHero && !item.needsHero.some(key=>heroKeys.includes(key))) return false;
  return true;
}
function availableAddOns(){
  const backKey=$("#backPiece").value;
  const heroKeys=selectedHeroes();
  return shuffleAddOns.filter(item=>addOnFits(item,backKey,heroKeys));
}
function parseAddOns(backKey,heroKeys){
  if(generatedOtherItems.length){
    const kept=backKey===undefined?generatedOtherItems:generatedOtherItems.filter(item=>addOnFits(item,backKey,heroKeys));
    const tags=kept.map(item=>item.tag);
    if(tags.length) return {tags,label:tags.join(" + ").toUpperCase()};
    return {tags:[],label:"NO OTHER"};
  }
  const raw=$("#customAdd").value.trim();
  if(!raw) return {tags:[],label:"NO OTHER"};
  const pieces=raw.split(",").map(x=>x.trim()).filter(Boolean);
  return {tags:uniq(pieces),label:pieces.join(" + ").toUpperCase()};
}

let printId=1;
const locks={color:false,accentColor:false,mainStyle:false,formMode:false,heroMode:false,backPiece:false,bottomType:false,complexity:false,environment:false,customAdd:false};
let heroMode="all";
// id is set when the value came from customEnvironmentNames; null means user-typed text.
let customEnvironmentValue={id:null,text:""};
let generatedOtherItems=[];
let settingsLanguage="en";

function heroInputs(){
  return [...document.querySelectorAll('[data-multi="heroMode"] input[type="checkbox"]')];
}
function selectedHeroes(){
  return heroInputs().filter(input=>input.checked).map(input=>input.value);
}
function updateHeroSummary(){
  const labels=heroInputs().filter(input=>input.checked).map(input=>settingLabel("heroMode",input.value));
  $("#heroModeToggle .multi-summary").textContent=labels.join(" · ");
}
function setHeroValues(values){
  const normalized=values.length>1?values.filter(value=>value!=="none"):values;
  const wanted=new Set(normalized.length?normalized:["none"]);
  heroInputs().forEach(input=>input.checked=wanted.has(input.value));
  if(!selectedHeroes().length){
    const first=heroInputs()[0];
    if(first) first.checked=true;
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
// Face-covering gear stays selectable by hand but is thinned out of automatic rolls,
// so a plain shuffle keeps the character's face readable.
function shuffleHeroPool(keys){
  const thinned=keys.filter(key=>!heroMap[key]?.rare || Math.random()<.2);
  return thinned.length?thinned:keys;
}
// One item per zone, because a head only has one crown, one face and one neck.
// A sealed dome also leaves no room for a visor or a mask underneath it.
function resolveHeroConflicts(keys){
  const chosen=[];
  const takenZones=new Set();
  let sealed=false;
  keys.filter(key=>heroMap[key]).forEach(key=>{
    const hero=heroMap[key];
    if(key==="none") return;
    if(sealed && hero.zone==="face") return;
    if(hero.zone && hero.zone!=="none" && takenZones.has(hero.zone)) return;
    if(hero.sealed) sealed=true;
    if(hero.zone) takenZones.add(hero.zone);
    chosen.push(key);
  });
  if(sealed) return chosen.filter(key=>heroMap[key].zone!=="face");
  return chosen.length?chosen:["none"];
}
function compatibleHero(styleKey,candidates=Object.keys(heroMap)){
  const list=compatibleHeroes([styleKey],candidates);
  return pick(list.length?list:["none"]);
}
let lastPreviewKeys=["ears"];
function heroDisplayText(key){
  const safeKey=heroMap[key]?key:"none";
  if(settingsLanguage!=="ko") return {name:heroMap[safeKey].name,sub:heroMap[safeKey].sub};
  return settingTranslations.heroPreview[safeKey];
}
function updateHeroPreview(keys){
  const active=(Array.isArray(keys)?keys:[keys]).filter(Boolean);
  lastPreviewKeys=active.length?active:["none"];
  const visible=active.filter(key=>key!=="none");
  const single=$("#heroSingle");
  const stack=$("#heroStack");
  if(visible.length>1){
    single.hidden=true;
    stack.hidden=false;
    stack.innerHTML=visible.map(key=>{
      return `<div class="hero-cell"><span class="hero-cell-icon">${heroMap[key].icon}</span><span class="hero-cell-name">${heroDisplayText(key).name}</span></div>`;
    }).join("");
    return;
  }
  single.hidden=false;
  stack.hidden=true;
  stack.innerHTML="";
  const key=visible[0]||active[0]||"none";
  const text=heroDisplayText(key);
  $("#heroIcon").textContent=(heroMap[key]||heroMap.none).icon;
  $("#heroName").textContent=text.name;
  $("#heroSub").textContent=text.sub;
}
function renderColorChips(){
  const korean=settingsLanguage==="ko";
  const chip=(label,value)=>{
    const name=korean?(settingTranslations.values.color[value]||value):value.toUpperCase();
    return `<span class="color-chip"><span class="chip-dot" style="background:${value}"></span>${label} ${name}</span>`;
  };
  const base=$("#color").value;
  const accent=$("#accentColor").value;
  let html=chip(korean?"기본":"BASE",base);
  if(accent!=="none" && accent!==base) html+=chip(korean?"포인트":"ACCENT",accent);
  $("#previewColors").innerHTML=html;
}
function resolvedMainStyle(){
  return $("#mainStyle").value==="random"?pick(Object.keys(styles)):$("#mainStyle").value;
}
// Back pieces without a `styles` list suit anyone. Those with one are body parts,
// and a random roll only offers them to a species that could have them.
function backPieceCandidates(styleKey){
  const pool=Object.keys(backPieces).filter(key=>{
    if(key==="none") return false;
    const list=backPieces[key].styles;
    return !list || list.includes(styleKey);
  });
  return pool.length?pool:["none"];
}
function randomizeField(key){
  if(key==="color") $("#color").value=pick(outfitColors);
  if(key==="accentColor"){
    const accentPool=outfitColors.filter(color=>color!==$("#color").value);
    $("#accentColor").value=Math.random()<.5?"none":pick(accentPool);
  }
  if(key==="mainStyle") $("#mainStyle").value=pick(Object.keys(styles));
  if(key==="formMode") $("#formMode").value=pick(["full","full","traits"]);
  if(key==="heroMode"){
    const compatible=shuffleHeroPool(compatibleHeroes([resolvedMainStyle()]));
    setHeroValues(resolveHeroConflicts(randomSubset(compatible.length?compatible:["none"],2)));
    updatePreviewFromSelections();
  }
  if(key==="complexity") $("#complexity").value=pick(["simple","medium","medium","max"]);
  if(key==="backPiece") $("#backPiece").value=Math.random()<.42?pick(backPieceCandidates(resolvedMainStyle())):"none";
  if(key==="bottomType") $("#bottomType").value=pick(["any","skirt","pants"]);
  if(key==="environment"){
    if($("#environment").value==="custom"){
      const id=pick(customEnvironmentNames);
      customEnvironmentValue={id,text:id};
      renderEnvironmentInput();
    }else{
      const value=Math.random()<.18?"custom":Math.random()<.45?pick(Object.keys(environments)):"none";
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
    generatedOtherItems=Math.random()<.25?[]:sample(availableAddOns(),1+Math.floor(Math.random()*2));
    renderOtherInput();
  }
}
function randomizeUnlocked(){
  ["color","accentColor","mainStyle","formMode","heroMode","backPiece","bottomType","complexity","environment","customAdd"].forEach(key=>{
    if(!locks[key]) randomizeField(key);
  });
  refreshCustomSelects();
  updatePreviewFromSelections();
  $("#status").textContent="TRAITS RESHUFFLED · READY";
}
function resolveComplexity(){
  const value=$("#complexity").value;
  return value==="random"?pick(["simple","medium","medium","max"]):value;
}
function generate(){
  const baseColor=$("#color").value;
  const accentColor=$("#accentColor").value;
  const hasAccent=accentColor!=="none" && accentColor!==baseColor;
  const colorTag=hasAccent?`outfit color: ${baseColor} with ${accentColor} accents`:`outfit color: ${baseColor}`;
  const mainKey=resolvedMainStyle();
  const main=styles[mainKey];
  const secondaryKey=Math.random()<.68?pick(secondaryCompat[mainKey]):null;
  const secondary=secondaryKey?styles[secondaryKey]:null;

  const heroCandidates=selectedHeroes();
  let heroKeys=heroMode==="all"?heroCandidates:[pick(heroCandidates)];
  if(heroKeys.length>1) heroKeys=heroKeys.filter(key=>key!=="none");
  if(!heroKeys.length) heroKeys=["none"];
  heroKeys=resolveHeroConflicts(heroKeys);

  const complexity=resolveComplexity();
  let environmentKey=$("#environment").value;
  if(environmentKey==="random") environmentKey=Math.random()<.36?pick(Object.keys(environments)):"none";
  if(environmentKey==="custom" && !customEnvironmentValue.text.trim()) environmentKey="none";
  const customEnvironment=environmentKey==="custom"?customEnvironmentValue.text.trim():"";
  let backKey=$("#backPiece").value;
  if(backKey==="random") backKey=Math.random()<.33?pick(backPieceCandidates(mainKey)):"none";
  const bottomPref=$("#bottomType").value;
  const addOn=parseAddOns(backKey,heroKeys);

  // FORM — Full Creature 는 종족의 몸까지 쓰고, Traits Only 는 옷과 부위 특징만 쓴다.
  // 몸은 옷보다 먼저 읽혀야 하므로 색 바로 뒤에 세운다.
  const formMode=$("#formMode").value;
  const form=formMode==="random"?pick(["full","traits"]):formMode;
  let bodyTags=[];
  if(form==="full"){
    bodyTags=sample(main.body,complexity==="simple"?2:3);
    if(secondary && Math.random()<.45) bodyTags=uniq(bodyTags.concat(sample(secondary.body,1)));
  }

  let arr=[colorTag];
  if(form==="full") arr.push(main.sp,...bodyTags);
  arr.push(main.name,pick(main.sil));
  if(secondary) arr.push(secondary.name);

  if(environmentKey==="custom" && customEnvironment){
    arr.push(`${customEnvironment} dwelling attire`,"materials from its home");
  }else if(environmentKey!=="none"){
    arr.push(...environments[environmentKey]);
  }
  // Some editions have one piece of head gear the habitat itself calls for.
  // `environmentHero` names it in data.js; editions without one leave it null.
  if(environmentKey!=="none" && heroKeys.every(key=>key==="none") && Math.random()<.55
     && environmentHero && heroMap[environmentHero]?.styles.includes(mainKey)){
    heroKeys=[environmentHero];
  }

  if(addOn.tags.length){
    arr.push(...addOn.tags);
  }

  let topPool=main.tops;
  let bottomPool=main.bottoms;
  let shoePool=main.shoes;
  let extraPool=main.extras;
  if(secondary){
    topPool=topPool.concat(sample(secondary.tops,2));
    bottomPool=bottomPool.concat(sample(secondary.bottoms,2));
    shoePool=shoePool.concat(sample(secondary.shoes,1));
    extraPool=uniq(extraPool.concat(sample(secondary.extras,3)));
  }

  let bottomChoices=bottomPool;
  if(bottomPref==="skirt") bottomChoices=bottomPool.filter(item=>item.includes("skirt"));
  if(bottomPref==="pants") bottomChoices=bottomPool.filter(item=>!item.includes("skirt"));
  if(!bottomChoices.length) bottomChoices=bottomPool;
  const chosenTop=pick(topPool);
  const chosenBottom=pick(bottomChoices);
  arr.push(chosenTop,chosenBottom);

  heroKeys.forEach(heroKey=>{
    const hero=heroMap[heroKey];
    if(hero.tag) arr.push(hero.tag);
  });
  if(backPieces[backKey].tag) arr.push(backPieces[backKey].tag);

  if(complexity!=="simple" && Math.random()<.78) arr.push(pick(legwear));

  let extraCount=complexity==="simple"?2:complexity==="medium"?4:6;
  arr.push(...sample(extraPool,extraCount));

  // head-piece connection rules
  heroKeys.forEach(heroKey=>{
    if(heroKey==="ears") arr.push(pick(["notched ear cuff","small ear ring"]));
    if(heroKey==="longears") arr.push(pick(["fine ear cuff chain","carved ear ornament"]));
    if(heroKey==="finears") arr.push(pick(["pearl ear drop","translucent fin membrane"]));
    if(heroKey==="horns") arr.push(pick(["cord wound horn base","banded horn caps"]));
    if(heroKey==="antlers") arr.push(pick(["hanging antler charms","moss on the antler tines"]));
    if(heroKey==="crest") arr.push(pick(["raised plume ridge","banded crest cord"]));
    if(heroKey==="antennae") arr.push(pick(["fine dust on the feelers","soft plumed tips"]));
    if(heroKey==="mask") arr.push(pick(["carved bone edging","cord tied mask straps"]));
  });

  if(complexity==="max"){
    arr.push(...sample(specials,Math.random()<.5?1:2));
  }

  // 발 자체가 사람 것이 아니면 신발을 덧신기지 않는다 (맹금류의 발톱 같은 것)
  const bareFeet=bodyTags.some(tag=>/\bfeet\b/.test(tag));
  const chosenShoes=bareFeet?null:pick(shoePool);
  if(chosenShoes) arr.push(chosenShoes);

  if(complexity==="max"){
    [chosenTop,chosenBottom,chosenShoes].filter(Boolean).forEach(item=>{
      if(itemDetails[item]) arr.push(...itemDetails[item]);
    });
  }

  if(complexity==="medium"){
    arr.push("detailed clothing");
  }else if(complexity==="max"){
    arr.push("layered accessories","highly detailed clothing");
  }
  // 항목 하나가 '후드, 털 트림' 처럼 여러 절을 담기도 하므로 쉼표로 쪼갠 뒤 절 단위로 거른다.
  arr=uniq(arr.flatMap(t=>String(t).split(",").map(c=>c.trim()).filter(Boolean)));

  updateHeroPreview(heroKeys);
  $("#prompt").textContent=arr.join(", ");
  $("#chips").innerHTML=[
    `BASE ${baseColor.toUpperCase()}`,
    hasAccent?`ACCENT ${accentColor.toUpperCase()}`:"NO ACCENT",
    form==="full"?"FULL CREATURE":"TRAITS ONLY",
    main.name.toUpperCase(),
    secondary?secondary.name.toUpperCase():"SOLO STYLE",
    heroKeys.map(key=>key.toUpperCase()).join(" + "),
    backKey==="none"?null:`BACK ${backKey.toUpperCase()}`,
    bottomPref==="any"?null:`BOTTOM ${bottomPref.toUpperCase()}`,
    complexity.toUpperCase(),
    environmentKey==="none"?"NO HABITAT":environmentKey==="custom"?(customEnvironment?customEnvironment.toUpperCase():"CUSTOM ENVIRONMENT"):environmentKey.toUpperCase(),
    addOn.label
  ].filter(Boolean).map(x=>`<span class="tag-chip">${x}</span>`).join("");

  const now=new Date();
  $("#meta").innerHTML=`CABINET NO. B-07<br>ACCESSION: ${String(printId++).padStart(4,"0")}<br>STATUS: PINNED<br>${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const feed=$("#paperFeed");
  const machine=$("#machine");
  feed.classList.remove("feeding","printed");
  machine.classList.add("is-printing");
  void feed.offsetWidth;
  feed.classList.add("feeding");
  $("#status").textContent="INKING · TYPE SET";
  setTimeout(()=>$("#status").textContent="PRINTING · FEEDING CARD",280);
  setTimeout(()=>{
    feed.classList.remove("feeding");
    feed.classList.add("printed");
    machine.classList.remove("is-printing");
    $("#status").textContent=`LABEL PRINTED · ${mainKey.toUpperCase()}`;
  },1600);
  sparks();
}
function sparks(){
  const machine=$("#machine");
  for(let i=0;i<9;i++){
    const s=document.createElement("span");s.className="spark";s.textContent=pick(["❋","✿","·","❈"]);
    s.style.left=(44+Math.random()*12)+"%";s.style.top="83%";
    s.style.setProperty("--x",(Math.random()*190-95)+"px");s.style.setProperty("--y",(-35-Math.random()*105)+"px");
    machine.appendChild(s);setTimeout(()=>s.remove(),900)
  }
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
  const old=btn.textContent;
  btn.textContent="COPIED";
  setTimeout(()=>btn.textContent=old,850);
}
function saveTxt(){
  const blob=new Blob([$("#prompt").textContent],{type:"text/plain"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="specimen_label.txt";a.click();URL.revokeObjectURL(a.href)
}

document.querySelectorAll(".swatch").forEach(b=>b.addEventListener("click",()=>document.body.dataset.theme=b.dataset.t));
function updateLockButton(b){
  const key=b.dataset.lock;
  const label=b.closest(".field")?.querySelector("label")?.textContent.trim()||"SETTING";
  const description=settingsLanguage==="ko"
    ?`${label} ${locks[key]?"잠금 해제":"잠그기"}`
    :`${locks[key]?"Unlock":"Lock"} ${label}`;
  b.classList.toggle("locked",locks[key]);
  b.textContent=locks[key]?"◆":"◇";
  b.setAttribute("aria-pressed",String(locks[key]));
  b.setAttribute("aria-label",description);
  b.dataset.tooltip=description;
  b.removeAttribute("title");
}
document.querySelectorAll(".lock-btn").forEach(b=>{
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
  updateHeroPreview(previewKeys);
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
  root.querySelector(".multi-toggle").setAttribute("aria-expanded","false");
  root.querySelector(".multi-menu").hidden=true;
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

// Custom dropdowns: one styled menu design for every select, matching the head-piece menu.
const customSelects=[];
function closeCustomMenus(){customSelects.forEach(cs=>cs.close());}
function closeAllMenus(){closeHeroMenu();closeCustomMenus();}
function refreshCustomSelects(){customSelects.forEach(cs=>cs.refresh());}
function buildCustomSelect(select){
  const wrap=document.createElement("div");
  wrap.className="multi-select custom-select";
  select.parentNode.insertBefore(wrap,select);
  wrap.appendChild(select);
  const toggle=document.createElement("button");
  toggle.type="button";
  toggle.className="multi-toggle";
  toggle.setAttribute("aria-expanded","false");
  toggle.setAttribute("aria-haspopup","listbox");
  toggle.innerHTML='<span class="multi-summary"></span>';
  const menu=document.createElement("div");
  menu.className="multi-menu custom-menu";
  menu.hidden=true;
  wrap.append(toggle,menu);
  const summary=toggle.querySelector(".multi-summary");
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
      `<button type="button" class="menu-option${option.value===select.value?" selected":""}" data-value="${option.value}">${option.textContent}</button>`
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
    const target=event.target.closest(".menu-option");
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

document.querySelectorAll(".reroll-field-btn").forEach(button=>button.addEventListener("click",()=>{
  randomizeField(button.dataset.reroll);
  refreshCustomSelects();
  renderColorChips();
  $("#status").textContent=`${button.dataset.reroll.replace(/([A-Z])/g," $1").toUpperCase()} UPDATED`;
}));
$("#color").addEventListener("change",renderColorChips);
$("#accentColor").addEventListener("change",renderColorChips);

const settingTranslations={
  labels:{
    color:["BASE COLOR","기본 색상"],accentColor:["ACCENT COLOR","포인트 색상"],mainStyle:["MAIN SPECIES","주 종족"],
    heroMode:["HEAD FEATURE","머리 특징"],backPiece:["APPENDAGE","부속지"],bottomType:["BOTTOM","하의"],
    complexity:["COMPLEXITY","복잡도"],environment:["HABITAT","서식지"],customAdd:["OTHER","기타"],
    formMode:["FORM","형태"]
  },
  values:{
    color:{white:"흰색",black:"검정",brown:"갈색",green:"초록",blue:"파랑",red:"빨강",purple:"보라",gold:"금색",gray:"회색",teal:"청록"},
    accentColor:{none:"없음",white:"흰색",black:"검정",brown:"갈색",green:"초록",blue:"파랑",red:"빨강",purple:"보라",gold:"금색",gray:"회색",teal:"청록"},
    mainStyle:{random:"랜덤",beast:"수인",kitsune:"여우 요괴",draco:"용인",demon:"악마",oni:"오니",celestial:"천상족",undead:"언데드",spirit:"정령",mermaid:"인어",avian:"조인",dryad:"수목 정령",golem:"암석족",moth:"나방인",slime:"점체족",elf:"엘프"},
    heroMode:{ears:"짐승 귀",longears:"긴 귀",finears:"지느러미 귀",horns:"굽은 뿔",antlers:"가지 뿔",crest:"깃털 볏",antennae:"더듬이",mask:"뼈 가면",none:"없음"},
    backPiece:{none:"없음",random:"랜덤",feather:"깃털 날개",bat:"박쥐 날개",insect:"곤충 날개",mothwing:"나방 날개",tail:"복슬 꼬리",tails:"여러 갈래 꼬리",scaled:"비늘 꼬리",fin:"등지느러미"},
    formMode:{full:"완전 인외",traits:"특징만 덧붙이기",random:"랜덤"},
    bottomType:{any:"랜덤",skirt:"치마",pants:"바지"},
    complexity:{medium:"보통",simple:"간단",max:"최대",random:"랜덤"},
    environment:{random:"랜덤 / 선택 사항",none:"없음",forest:"숲",snow:"설원",deep:"심해",ember:"화산 지대",ruin:"폐허",custom:"기타"}
  },
  customEnvironments:{cavern:"동굴",canopy:"수관",marsh:"습지",dune:"사구",reef:"산호초",tundra:"툰드라",orchard:"과수원",hollow:"나무 구멍",cliff:"절벽",mire:"진창"},
  addOns:{
    boneCharms:"뼈 부적 목걸이",clawTips:"손끝 금속 캡",tailRing:"꼬리에 낀 고리",
    hornWraps:"뿔에 감은 끈",wingCuffs:"날개 관절 밴드",scaleTrim:"깃의 비늘 장식",
    mossPatches:"천에 붙은 이끼",glowVeins:"희미하게 빛나는 결",ankleBells:"발목 방울",featherTuft:"팔꿈치 깃털 술"
  },
  heroPreview:{
    none:{name:"머리 특징 없음",sub:"평범한 머리 실루엣"},
    ears:{name:"짐승 귀",sub:"머리 옆의 털 귀"},
    longears:{name:"긴 귀",sub:"길게 뻗은 뾰족한 귀"},
    finears:{name:"지느러미 귀",sub:"물갈퀴가 진 귀"},
    horns:{name:"굽은 뿔",sub:"정수리의 굵은 뿔"},
    antlers:{name:"가지 뿔",sub:"갈라져 뻗은 뿔"},
    crest:{name:"깃털 볏",sub:"정수리에 선 깃"},
    antennae:{name:"더듬이",sub:"부드러운 깃 더듬이"},
    mask:{name:"뼈 가면",sub:"얼굴을 덮는 뼈 조각"}
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
  const control=$("#environment").closest(".custom-select")||$("#environment");
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
  const fieldIds=["color","accentColor","mainStyle","formMode","heroMode","backPiece","bottomType","complexity","environment","customAdd"];
  fieldIds.forEach(id=>{
    const control=$("#"+id);
    const label=control?.closest(".field")?.querySelector(":scope > label");
    const pair=settingTranslations.labels[id];
    if(label&&pair) label.textContent=pair[korean?1:0];
  });
  const heroLabel=$("#heroModeToggle").closest(".field").querySelector(":scope > label");
  heroLabel.textContent=settingTranslations.labels.heroMode[korean?1:0];
  ["color","accentColor","mainStyle","formMode","backPiece","bottomType","complexity","environment"].forEach(id=>{
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
  document.querySelectorAll(".lock-btn").forEach(updateLockButton);
  document.querySelectorAll(".reroll-field-btn").forEach(reroll=>{
    const label=reroll.closest(".field")?.querySelector("label")?.textContent.trim()||"SETTING";
    const description=korean?`${label}만 랜덤 선택`:`Randomize ${label} only`;
    reroll.setAttribute("aria-label",description);
    reroll.dataset.tooltip=description;
  });
  $("#environmentCustom").placeholder=korean?"동굴, 수관, 습지...":"cavern, canopy, marsh...";
  refreshCustomSelects();
  updateHeroPreview(lastPreviewKeys);
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
// Clicking the arrow area of the custom-habitat input returns to the choice list.
$("#environmentCustom").addEventListener("click",event=>{
  const rect=event.currentTarget.getBoundingClientRect();
  if(rect.right-event.clientX>30) return;
  event.stopPropagation();
  $("#environment").value="none";
  syncEnvironmentControl();
  refreshCustomSelects();
  const environmentSelect=customSelects.find(cs=>cs.select.id==="environment");
  if(environmentSelect) environmentSelect.open();
});
["color","accentColor","mainStyle","formMode","backPiece","bottomType","complexity","environment"].forEach(id=>buildCustomSelect($("#"+id)));
updateSettingsLanguage();
syncEnvironmentControl();
updatePreviewFromSelections();

$("#printBtn").addEventListener("click",()=>generate());
$("#rerollBtn").addEventListener("click",()=>generate());
$("#shuffleBtn").addEventListener("click",randomizeUnlocked);
$("#copyBtn").addEventListener("click",copyPrompt);
$("#saveBtn").addEventListener("click",saveTxt);

// Cabinet quick controls
const themeOrder=["oak","brass","verdigris","ivory","slate"];
$("#quickTheme").addEventListener("click",()=>{
  const current=document.body.dataset.theme || "blue";
  const next=themeOrder[(themeOrder.indexOf(current)+1)%themeOrder.length];
  document.body.dataset.theme=next;
  $("#status").textContent=`THEME · ${next.toUpperCase()}`;
});
$("#quickHero").addEventListener("click",()=>{
  const hero=compatibleHero(resolvedMainStyle(),selectedHeroes());
  setHeroValues([hero]);
  setHeroMode("random");
  updateHeroPreview([hero]);
  $("#status").textContent="HEAD FEATURE UPDATED";
});
$("#quickAdd").addEventListener("click",()=>{
  $("#customAdd").focus();
  $("#customAdd").scrollIntoView({behavior:"smooth",block:"center"});
});
$("#quickShuffle").addEventListener("click",randomizeUnlocked);
$("#quickHelp").addEventListener("click",()=>$("#helpModal").classList.add("open"));

// Label tear-off: drag the perforation downward to close the current label.
const tearHandle=$("#tearHandle");
const receiptEl=$("#receipt");
let tearStartY=0, tearDelta=0, tearing=false;

tearHandle.addEventListener("pointerdown",e=>{
  tearing=true;
  tearStartY=e.clientY;
  tearDelta=0;
  tearHandle.setPointerCapture(e.pointerId);
  receiptEl.classList.add("dragging");
});
tearHandle.addEventListener("pointermove",e=>{
  if(!tearing) return;
  tearDelta=Math.max(0,e.clientY-tearStartY);
  const capped=Math.min(tearDelta,120);
  receiptEl.style.transform=`translateY(${capped}px) rotate(${capped*.004}deg)`;
  receiptEl.style.opacity=String(Math.max(.35,1-capped/180));
});
function finishTear(e){
  if(!tearing) return;
  tearing=false;
  try{tearHandle.releasePointerCapture(e.pointerId)}catch(_){}
  receiptEl.classList.remove("dragging");
  if(tearDelta>=72){
    receiptEl.classList.add("torn");
    $("#status").textContent="LABEL TORN OFF";
    setTimeout(()=>{
      $("#paperFeed").style.display="none";
    },190);
  }else{
    receiptEl.style.transform="";
    receiptEl.style.opacity="";
  }
}
tearHandle.addEventListener("pointerup",finishTear);
tearHandle.addEventListener("pointercancel",finishTear);

// Any new label restores the slip.
const originalGenerate=generate;
generate=function(){
  $("#paperFeed").style.display="";
  receiptEl.classList.remove("torn");
  receiptEl.style.transform="";
  receiptEl.style.opacity="";
  originalGenerate();
};


const themeToggle=$("#themeToggle");
const themeControl=document.querySelector(".theme-control");
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
document.querySelectorAll(".swatch").forEach(b=>b.addEventListener("click",()=>{
  themeControl.classList.remove("open");
  themeToggle.setAttribute("aria-expanded","false");
}));

const modal=$("#helpModal");
$("#helpBtn").addEventListener("click",()=>modal.classList.add("open"));
$("#closeHelp").addEventListener("click",()=>modal.classList.remove("open"));
$("#okHelp").addEventListener("click",()=>modal.classList.remove("open"));
modal.addEventListener("click",e=>{if(e.target===modal) modal.classList.remove("open")});
document.addEventListener("keydown",e=>{if(e.key==="Escape") modal.classList.remove("open")});

updateHeroPreview("ears");
