// 새 원형의 조합·랜덤 경계를 실제 브라우저에서 확인한다.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const dir = __dirname;
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const page = path.join(dir, '.verify-mix.html');
const visualPage = path.join(dir, '.visual-mix.html');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'taffy-verify-'));
const checks = String.raw`
<script>
(() => {
  const failures = [], count = { combinations: 0, prompts: 0, eastTrials: 0, fullDraws: 0 };
  const assert = (ok, message) => { if (!ok) failures.push(message); };
  try {
    const ed = EDITIONS.illust;
    const palettes=COLLECTIONS.flatMap(c=>c.periods.flatMap(p=>[p.colors,...Object.values(p.styleColors||{})]));
    assert(palettes.every(colors=>new Set(colors).size===colors.length&&colors.every(c=>COLOR_KO[c])), 'all expanded palettes have unique translated colors');
    assert(EDITIONS.cosplay.periods.every(p=>!p.colors.length)&&!EDITIONS.classic.periods.find(p=>p.id==='bug').colors.length, 'fixed costume colors stay fixed');
    assert(Object.keys(FIDELITY).join(',')==='Party,Editorial,RealNight' && ![...$('#fidelity').options].some(o=>o.value==='Homemade'), 'homemade removed from active levels');
    assert(!COLLECTIONS.flatMap(e=>e.periods).flatMap(p=>Object.values(p.slots||{}).flat()).some(it=>it.p==='lace cat ears headband'), 'unneeded lace cat ears removed');
    const plague=EDITIONS.classic.periods.find(p=>p.id==='plague');
    for(const fidelity of Object.keys(FIDELITY)) for(const gender of ['feminine','masculine']){
      const st={periodId:'plague',fidelity,gender,exposure:1,detail:'Medium'};
      for(let i=0;i<20;i++){
        const made=composeFrom(EDITIONS.classic,st,rollPicks(EDITIONS.classic,st));
        assert(/beak mask/.test(made.prompt), 'plague mask '+fidelity+'/'+gender);
      }
    }
    catsOff.add('mask');
    assert(!periodList(EDITIONS.classic).some(p=>p.id==='plague'), 'plague hidden with mask filter');
    catsOff.delete('mask');
    const royal=EDITIONS.classic.periods.find(p=>p.id==='princess');
    for(const fidelity of Object.keys(FIDELITY)) for(const gender of ['feminine','masculine']) for(const exposure of [0,1,2]){
      const st={periodId:royal.id,fidelity,gender,exposure,detail:'Medium',eerie:'none'};
      const garments=slotOptions(EDITIONS.classic,'garment',st);
      for(const garment of garments){
        const made=composeFrom(EDITIONS.classic,st,{garment:garment.id,accessories:[]}).prompt;
        assert(/jack-o'-lantern|bat.embroid|thorn-vine embroidery/.test(made),'royal outfit carries Halloween without optional props '+garment.id);
        assert(!/bloodstain/.test(made),'royal bloodstain stays optional '+garment.id);
      }
      const picks=rollPicks(EDITIONS.classic,st),made=composeFrom(EDITIONS.classic,st,picks).prompt;
      assert(!!picks.headwear&&!!picks.garment&&(gender==='masculine'?/\bprince\b/:/\bprincess\b/).test(made),'royal silhouette '+fidelity+'/'+gender+'/'+exposure);
      assert(slotOptions(EDITIONS.classic,'weapon',st).some(it=>it.id==='princess-hn-candy'),'royal candy pouch at every level');
      assert(composeFrom(EDITIONS.classic,{...st,eerie:'stain'},picks).prompt.includes('small faux bloodstain'),'royal selected horror detail');
    }
    const street=ed.periods.find(p=>p.id==='rh-street');
    for(const fidelity of Object.keys(FIDELITY)){
      const st={periodId:street.id,fidelity,gender:'feminine',exposure:2,detail:'Medium'};
      for(let i=0;i<20;i++){
        const made=composeFrom(ed,st,rollPicks(ed,st));
        assert(/candy|chocolate|caramel apple/.test(made.prompt), 'street hood Halloween prop '+fidelity);
        assert(!/cardboard|hood up,.*(?:baseball cap|beanie)/.test(made.prompt), 'street hood quality and headwear');
      }
    }
    const gasItems=COLLECTIONS.flatMap(e=>e.periods).filter(p=>p.slots?.device?.some(it=>/gas mask/.test(it.p)));
    assert(gasItems.length===1 && gasItems[0].id==='zombienurse', 'gas mask only on zombie nurse');
    for(const id of ['alice','redqueen','clockrabbit']){
      const p=EDITIONS.classic.periods.find(p=>p.id===id);
      assert(!!p, id+' storybook period');
      for(const fidelity of Object.keys(FIDELITY)) for(const gender of ['feminine','masculine']) for(const exposure of [0,1,2]){
        const st={periodId:id,fidelity,gender,exposure,detail:'Medium'};
        const picks=rollPicks(EDITIONS.classic,st), made=composeFrom(EDITIONS.classic,st,picks);
        assert(!!picks.garment && !!made.prompt, id+' complete '+fidelity+'/'+gender+'/'+exposure);
        if(id==='clockrabbit')assert(/rabbit ear headband/.test(made.prompt)&&/pocket watch/.test(made.prompt), 'clock rabbit ears and watch');
        if(id==='alice')assert(/patchwork doll|rose|candy pouch|chocolates/.test(made.prompt), 'Alice Halloween prop');
      }
    }
    catsOff.add('spider');
    assert(!periodList(EDITIONS.classic).some(p=>p.id==='spider'), 'spider period hidden');
    const witch=EDITIONS.classic.periods.find(p=>p.id==='witch');
    const ws={periodId:witch.id,fidelity:'Party',gender:'feminine',exposure:1,detail:'Medium'};
    assert(!slotOptions(EDITIONS.classic,'accessories',ws).some(it=>it.p==='spider ring'), 'spider ring hidden');
    const alice=EDITIONS.classic.periods.find(p=>p.id==='alice');
    const as={periodId:alice.id,fidelity:'Party',gender:'feminine',exposure:1,detail:'Medium'};
    assert(slotOptions(EDITIONS.classic,'accessories',as).some(it=>it.p.includes('spiderweb lace')), 'web remains selectable');
    const noSpider=composeFrom(EDITIONS.classic,as,rollPicks(EDITIONS.classic,as)).prompt;
    assert(noSpider.includes('-1:: spider::') && !/(^|, )spider(?: |,)/.test(noSpider.replace('-1:: spider::','')), 'negative spider tag only');
    catsOff.delete('spider');
    assert(!EDITIONS.classic.periods.some(p=>['aerobics','disco'].includes(p.id)), 'removed retro entries stay out of selectors');
    assert(!JSON.stringify(COLLECTIONS).toLowerCase().includes('waist pack'), 'generic waist pack removed');
    assert(!/red cross|medical cross|red crescent/i.test(JSON.stringify(COLLECTIONS)), 'protected medical emblems absent');
    const handmadeWitch=EDITIONS.classic.periods.find(p=>p.id==='witch');
    assert(handmadeWitch.slots.garment.filter(it=>it.f===0).every(it=>/witch|warlock/.test(it.p)), 'homemade witch silhouette');
    assert(!handmadeWitch.slots.headwear.some(it=>/paper witch hat|cardboard brim/.test(it.p)), 'cardboard witch hat removed');
    const nun=ed.periods.find(p=>p.id==='hauntednun');
    assert(!!nun && !!nun.slots.garment.find(it=>it.g==='f') && !!nun.slots.garment.find(it=>it.g==='m'), 'nun and monk garments');
    assert(eerieOptions(nun).some(row=>row[2].includes('bloodstain')), 'nun bloodstain option');
    assert(eerieOptions(EDITIONS.classic.periods.find(p=>p.id==='nurse')).some(row=>row[2].includes('bloodstain')), 'nurse bloodstain option');
    assert(eerieOptions(EDITIONS.classic.periods.find(p=>p.id==='zombie')).some(row=>row[2].includes('bloodstain')), 'zombie bloodstain option');
    const harley=EDITIONS.cosplay.periods.find(p=>p.id==='hq-2020');
    const hs={periodId:harley.id,fidelity:'Party',gender:'feminine',exposure:1,detail:'Medium'};
    assert(slotOptions(EDITIONS.cosplay,'foundation',hs).some(it=>it.p==='black fishnet stockings'), '2020 fishnets selectable');
    let fishnetRolls=0;for(let i=0;i<80;i++)if(rollPicks(EDITIONS.cosplay,hs).foundation?.includes('fishnet'))fishnetRolls++;
    assert(fishnetRolls>0, '2020 fishnets in shuffle');
    assert(CATS.some(c=>c.id==='bodypaint') && CATS.some(c=>c.id==='bodysuit'), 'paint and bodysuit filters');
    catsOff.add('bodypaint');catsOff.add('bodysuit');
    const doll=ed.periods.find(p=>p.id==='mx-doll');
    const ds={periodId:doll.id,style:'gothic',fidelity:'Party',gender:'feminine',exposure:1,detail:'Medium'};
    assert(!slotOptions(ed,'device',ds).some(it=>it.cat==='bodypaint'), 'body paint hidden');
    const skeleton=EDITIONS.classic.periods.find(p=>p.id==='skeleton');
    const ss={periodId:skeleton.id,fidelity:'Party',gender:'feminine',exposure:2,detail:'Medium'};
    assert(!slotOptions(EDITIONS.classic,'garment',ss).some(it=>it.cat==='bodysuit'), 'bodysuit hidden');
    catsOff.delete('bodypaint');catsOff.delete('bodysuit');
    assert(catsOff.has('skintone') && !catsOff.has('facepaint'), 'skin tone off, face paint on by default');
    const paintRun=(test)=>{let hits=0;
      for(const e of [EDITIONS.classic,EDITIONS.illust,EDITIONS.everyday,EDITIONS.cosplay]) for(const p of e.periods){
        if(p.mix) continue;
        for(const gender of ['feminine','masculine']) for(let i=0;i<4;i++){
          const st={periodId:p.id,style:p.mixStyles?.[0]||'',fidelity:'Editorial',gender,exposure:1,detail:'Medium'};
          const made=composeFrom(e,st,rollPicks(e,st)).prompt.split(',').map(c=>c.trim());
          hits+=made.filter(test).length;
        }
      }
      return hits;};
    assert(paintRun(skinClause)===0, 'no skin tone with chip off');
    catsOff.delete('skintone');
    assert(paintRun(skinClause)>0, 'skin tone returns with chip on');
    catsOff.add('facepaint');
    assert(paintRun(faceClause)===0, 'no face paint with chip off');
    const fr=EDITIONS.classic.periods.flatMap(p=>p.slots?.device||[]).find(it=>/^green face paint, painted stitches/.test(it.p));
    catsOff.delete('facepaint');catsOff.add('skintone');
    assert(!!fr && !paintGone(fr.p) && !paintOff('painted stitches on the forehead') && paintOff('green face paint'), 'mixed item keeps stitches');
    const ns={periodId:nun.id,fidelity:'Party',gender:'feminine',exposure:1,detail:'Medium',eerie:'stain',backgroundEnabled:false};
    const np=rollPicks(ed,ns);
    assert(composeFrom(ed,ns,np).prompt.includes('small bloodstain on the habit sleeve cuff'), 'selected horror detail');
    assert(!composeFrom(ed,ns,np).prompt.includes('abandoned chapel'), 'background off');
    const withBackground=composeFrom(ed,{...ns,fidelity:'Editorial',backgroundEnabled:true,backgroundChoice:'hauntednun-pl-chapel'},np).prompt;
    assert(withBackground.includes('abandoned chapel'), 'selected background');
    assert(TF_MIX_PERIODS.length === 10, '10 archetypes');
    assert(new Set(ed.periods.map(p => p.label)).size === ed.periods.length, 'unique Illustrated selector labels');
    assert(ed.periods.filter(p => p.east).length >= 4, 'East Asian periods');
    for (const p of TF_MIX_PERIODS) {
      assert(p.mixStyles.length > 0 && p.mixMotifs.length > 1, p.id + ' axes');
      for (const garment of p.slots.garment) {
        const phrase = garment.p.toLowerCase();
        assert(!(/floor-length/.test(phrase) && /(?:knee-length|short) [\w -]*skirt/.test(phrase)), p.id + '/' + garment.id + ' conflicting hem');
        assert(!(/high neckline/.test(phrase) && /off-shoulder neckline/.test(phrase)), p.id + '/' + garment.id + ' conflicting neckline');
      }
      const allowedEyes={
        'mx-witch':['lace-blindfold','blindfold','eyepatch'], 'mx-devil':['lace-blindfold','blindfold'],
        'mx-ghost':['lace-blindfold','blindfold'], 'mx-angel':['lace-blindfold','blindfold','eyepatch'],
        'mx-deity':['lace-blindfold','blindfold'], 'mx-knight':['eyepatch'],
        'mx-doll':['lace-blindfold','blindfold'], 'mx-yuki':['lace-blindfold'],
        'mx-oni':['eyepatch'], 'mx-gumiho':['lace-blindfold','blindfold'],
      }[p.id];
      for (const eye of ['lace-blindfold', 'blindfold', 'eyepatch'])
        assert(!!p.slots.accessories.find(it => it.id === p.id + '-ac-' + eye && it.secondary && it.cat === 'mask') === allowedEyes.includes(eye), p.id + '/' + eye + ' compatibility');
      for (const style of p.mixStyles) for (const fidelity of Object.keys(FIDELITY))
        for (const exposure of [0, 1, 2]) for (const gender of ['feminine', 'masculine']) {
          const state = { periodId: p.id, style, motif: 'star', fidelity, exposure, gender, detail: 'Medium' };
          const picks = rollPicks(ed, state);
          const garment = slotOptions(ed, 'garment', state).find(it => it.id === picks.garment);
          const made = composeFrom(ed, state, picks);
          assert(!!garment && garment.style === style, p.id + '/' + style + '/' + fidelity + '/' + exposure + '/' + gender + ' garment');
          assert(!!made.prompt && made.prompt.includes('costume') && (!p.mixMotifs.includes('star') || made.prompt.includes('star embroidery')),
            p.id + '/' + style + '/' + fidelity + '/' + exposure + '/' + gender + ' prompt');
          if (p.need?.headwear) assert(!!picks.headwear, p.id + ' headwear');
          if (p.id === 'mx-gumiho') assert((picks.accessories || []).includes('mx-gumiho-ac-tails'), 'gumiho tails');
           if (p.id === 'mx-angel') assert((picks.accessories || []).includes('mx-angel-ac-wings'), 'angel wings');
          count.combinations++;
        }
    }
    $('#collection').value = 'illust'; updatePack();
    $('#period').value = 'Witch'; fillMixFields();
    assert(!$('#styleField').hidden && !$('#motifField').hidden, 'mix controls visible');
    $('#style').value = 'idol'; $('#motif').value = 'star'; eastRandom = true;
    const saved = snapshot();
    $('#style').value = 'gothic'; $('#motif').value = 'none'; eastRandom = false;
    restore(saved);
    assert($('#style').value === 'idol' && $('#motif').value === 'star' && eastRandom, 'preset roundtrip');
    $('#collection').value = 'classic'; updatePack();
    assert($('#styleField').hidden && $('#motifField').hidden, 'mix controls hidden for classic');
    $('#collection').value = 'illust'; updatePack();
    eastRandom = false;
    for (let i = 0; i < 200; i++) {
      randomIndexField('period');
      assert(!currentPeriod().east, 'East in default Illustrated shuffle');
      count.eastTrials++;
    }
    $('#period').value = 'Snow Woman'; fillMixFields();
    assert(currentPeriod().east && allowedPeriods(ed, currentPeriod().id).length === 1, 'East manual selection');
    const cross = EDITIONS.cross;
    const wildcard = cross.periods.find(p => p.id === 'x-custom');
    wildcard.mix = '*';
    assert(!allowedPeriods(cross, wildcard.id).some(p => p.east), 'East in wildcard cross mix');
    wildcard.mix = ['mx-yuki'];
    assert(allowedPeriods(cross, wildcard.id).some(p => p.id === 'mx-yuki'), 'East in explicit cross mix');
    for (const p of TF_MIX_PERIODS) {
      wildcard.mix = [p.id];
      const state = { periodId: wildcard.id, fidelity: 'Party', exposure: 1, gender: 'feminine', detail: 'Medium' };
      const picks = rollPicks(cross, state);
      const garment = slotOptions(cross, 'garment', state).find(it => it.id === picks.garment);
      assert(garment?.periodId === p.id && garment.style === wildcard.anchorStyle, p.id + ' coherent cross');
    }
    wildcard.mix = '*';
    const goddess = ed.periods.find(p => p.id === 'mx-deity');
    const goddessState = { periodId: goddess.id, style: 'gothic', motif: 'star', fidelity: 'Party', exposure: 1, gender: 'feminine', detail: 'Medium' };
    const goddessPicks = rollPicks(ed, goddessState);
    const goddessText = composeFrom(ed, goddessState, { ...goddessPicks, accessories: ['mx-deity-ac-lace-blindfold'] }).prompt;
    assert(goddessText.includes('goddess costume') && goddessText.includes('star embroidery') && goddessText.includes('lace blindfold'), 'goddess + star + eye accessory');
    const angel = ed.periods.find(p => p.id === 'mx-angel');
    const angelState = { ...goddessState, periodId: angel.id, style: 'battle', exposure: 0 };
    const angelLong = angel.slots.garment.find(it => it.style === 'battle' && it.g === 'f' && it.noBoots && it.f === 1);
    const angelBoots = angel.slots.footwear.find(it => /boots/.test(it.p));
    const angelEye = angel.slots.accessories.find(it => it.id === 'mx-angel-ac-eyepatch');
    const angelWings = angel.slots.accessories.find(it => it.id === 'mx-angel-ac-wings');
    const angelTear = ed.periods.find(p => p.id === 'mx-ghost').slots.device.find(it => it.id === 'mx-ghost-fc-tear');
    assert(!!angelLong && !!angelBoots && !!angelEye && !!angelWings && !!angelTear, 'compatibility fixtures');
    assert(slotOptions(ed, 'accessories', angelState).some(it => it.id === angelEye.id), 'battle angel allows eye patch');
    assert(!slotOptions(ed, 'accessories', { ...angelState, style: 'moe' }).some(it => it.cat === 'mask'), 'moe angel has no blindfold');
    assert(slotOptions(ed, 'accessories', { ...goddessState, periodId: 'mx-witch', style: 'gothic_lolita' }).some(it => it.id === 'mx-witch-ac-lace-blindfold'), 'gothic lolita witch allows lace blindfold');
    assert(!slotOptions(ed, 'accessories', { ...angelState, periodId: 'mx-knight', style: 'gothic' }).some(it => it.cat === 'mask'), 'gothic knight has no medical eye patch');
    assert(!compatible(angelBoots, { garment: angelLong }), 'floor-length gown blocks boots');
    assert(!compatible(angelEye, { accessories: [angelEye] }), 'two eye coverings blocked');
    assert(!compatible(angelEye, { device: angelTear }), 'eye makeup blocked by eye covering');
    const cleaned = guardedMixPicks(ed, angelState, { garment: angelLong.id, footwear: angelBoots.id, accessories: [angelWings.id, angelEye.id, 'mx-angel-ac-blindfold'] });
    assert(!cleaned.footwear && cleaned.accessories.length === 2 && cleaned.accessories.includes(angelWings.id), 'manual selection conflict guard: ' + JSON.stringify(cleaned));
    $('#period').value = 'Angel Mix'; fillMixFields();
    assert(currentPeriod().id === 'mx-angel' && !$('#styleField').hidden, 'new angel available in selector');
    $('#style').value = 'battle'; $('#gender').value = 'Feminine'; $('#fidelity').value = 'Party'; $('#exposure').value = 'Covered';
    populateSlots(); $('#garment').value = angelLong.id; $('#footwear').value = angelBoots.id;
    $('#footwear').dispatchEvent(new Event('change', { bubbles: true }));
    assert(!$('#footwear').value, 'manual UI clears incompatible boots: ' + JSON.stringify({ garment: $('#garment').value, footwear: $('#footwear').value, safe: guardedMixPicks(ed, readState(), currentPrev()) }));
    catsOff.add('mask');
    assert(!slotOptions(ed, 'accessories', goddessState).some(it => it.id === 'mx-deity-ac-lace-blindfold'), 'eye covering filter');
    catsOff.delete('mask');
    assert($('.help-title').textContent === 'Taffy 사용법', 'help title');
    const classicWitch = EDITIONS.classic.periods.find(p => p.id === 'witch');
    assert(classicWitch.slots.device.find(it=>it.id==='witch-fc-moon')?.p==='small crescent moon painted on the cheek', 'witch moon motif stays on cheek');
    const classicDevil = EDITIONS.classic.periods.find(p => p.id === 'devil');
    const classicAngel = ed.periods.find(p => p.id === 'an-white');
    const pajama = EDITIONS.everyday.periods.find(p => p.id === 'pajama');
    assert(!classicWitch.slots.device.some(it => /green face paint|face gems/.test(it.p)), 'witch face paint stays thematic');
    assert(!classicDevil.slots.device.some(it => /red face paint|glitter/.test(it.p)), 'devil face paint stays thematic');
    assert(!pajama.slots.accessories.some(it => /string lights/.test(it.p)) && pajama.slots.effect.some(it => /string lights along the wall/.test(it.p)), 'pajama lights belong to room');
    const pajamaState = {periodId:'pajama', fidelity:'Party', gender:'feminine', exposure:1, detail:'Medium', backgroundEnabled:false};
    const pajamaPicks = rollPicks(EDITIONS.everyday, pajamaState);
    assert(!composeFrom(EDITIONS.everyday, pajamaState, pajamaPicks).prompt.includes('string lights'), 'pajama lights off with background');
    assert(composeFrom(EDITIONS.everyday, {...pajamaState, backgroundEnabled:true, backgroundChoice:'pajama-pl-lights'}, pajamaPicks).prompt.includes('string lights along the wall'), 'pajama lights on with background');
    for (const [edition, period, slot, animal] of [
      [EDITIONS.classic, classicWitch, 'accessories', 'black cat'],
      [EDITIONS.classic, classicDevil, 'accessories', 'small bat'],
      [ed, classicAngel, 'weapon', 'white dove'],
      [ed, ed.periods.find(p => p.id === 'mx-witch'), 'accessories', 'black cat'],
      [ed, ed.periods.find(p => p.id === 'mx-devil'), 'accessories', 'small bat'],
      [ed, angel, 'accessories', 'white dove'],
    ]) {
      const item = period.slots[slot].find(it => it.cat === 'animal' && it.p.includes(animal));
      assert(!!item, period.id + ' real animal available');
      const state = {periodId: period.id, fidelity: 'Party', gender: 'feminine', exposure: 1, detail: 'Medium', style: period.id.startsWith('mx-') ? period.mixStyles[0] : ''};
      assert(slotOptions(edition, slot, state).some(it => it.id === item.id), period.id + ' animal selectable');
      catsOff.add('animal');
      assert(!slotOptions(edition, slot, state).some(it => it.id === item.id), period.id + ' animal filter');
      catsOff.delete('animal');
    }
    $('#collection').value='illust'; updatePack();
    $('#period').value='Witch'; fillMixFields(); fillColors(); populateSlots();
    $('.lock[data-lock="period"]').click();
    assert(locks.period,'costume lock button on');
    for(let i=0;i<20;i++){
      randomize();
      assert($('#collection').value!=='cross' && famOf(currentPeriod())==='Witch', 'locked costume family survives Ring '+i);
    }
    const famSeen=new Set();for(let i=0;i<80;i++){randomize();famSeen.add(currentPeriod().id);}
    assert(famSeen.size>=8, 'locked root rolls across the witch family: '+[...famSeen].join(','));
    $('.lock[data-lock="period"]').click();
    $('#collection').value='illust'; updatePack(); $('#period').value='Witch · Star'; $('#period').dispatchEvent(new Event('change'));
    $('.lock[data-lock="period"]').click();
    for(let i=0;i<10;i++){randomize();assert(currentPeriod().id==='w-star','locked variant stays exact '+i);}
    $('.lock[data-lock="period"]').click();
    $('#collection').value='illust'; updatePack(); $('#period').value='Witch'; fillMixFields(); fillColors(); populateSlots();
    $('.lock[data-lock="period"]').click();
    $('.lock[data-lock="period"]').click();
    $('#collection').value='illust'; updatePack();$('#period').value='Witch';fillMixFields();fillColors();
    $('#color').value='black';locks.color=true;
    for(let i=0;i<20;i++){randomize();assert($('#collection').value==='illust'&&$('#period').value==='Witch'&&$('#color').value==='black','locked color survives Ring '+i);}
    locks.color=false;
    $('#collection').value='illust';updatePack();$('#period').value='Witch';fillMixFields();populateSlots();rollSlotsOnly();
    const heldGarment=$('#garment').value;
    $('.lock[data-lock="garment"]').click();
    for(let i=0;i<12;i++){randomize();assert($('#collection').value==='illust'&&$('#period').value==='Witch'&&$('#garment').value===heldGarment,'locked garment survives Ring '+i);}
    $('.lock[data-lock="garment"]').click();
    $('#collection').value='cross';updatePack();setMulti('period',['mx-witch','mx-angel']);
    const mainRow=[...$('#periodList').querySelectorAll('.check-row')].find(row=>row.querySelector('input')?.value==='mx-witch');
    mainRow.querySelector('.main-pick').click();
    assert(mainCostume==='mx-witch'&&mainRow.isConnected===false,'one main chosen from checkbox row');
    crossMax=2;
    let subDraws=0;
    for(let i=0;i<60;i++){
      randomize();const st=readState(),picked=currentPrev(),made=compose();
      const garment=slotOptions(EDITIONS.cross,'garment',st).find(it=>it.id===picked.garment);
      assert($('#collection').value==='cross'&&mainCostume==='mx-witch'&&garment?.periodId==='mx-witch'&&/\b(witch|warlock)\b/.test(made),'main witch survives Ring '+i+' '+JSON.stringify({collection:$('#collection').value,mainCostume,garment:garment?.periodId,prompt:made.slice(0,100)}));
      if(picked.accessories.some(id=>id.startsWith('mx-angel-ac-')))subDraws++;
    }
    assert(subDraws>0,'fitting angel accessory can join main witch');
    crossMax=1;
    for(let i=0;i<12;i++){randomize();assert(!currentPrev().accessories.some(id=>id.startsWith('mx-angel-ac-')),'one costume limit '+i);}
    const mainSaved=snapshot();mainCostume='';crossMax=3;restore(mainSaved);
    assert(mainCostume==='mx-witch'&&crossMax===1,'main and maximum preset roundtrip');
    mainCostume='';crossMax=2;setMulti('period',[]);$('#collection').value='illust';updatePack();
    const oldPreset={...snapshot(),collection:'illust',period:'Witch · Dark',gender:'Masculine'};
    restore(oldPreset);
    assert(currentPeriod().id==='w-dark'&&$('#period').selectedOptions[0].textContent==='마법사 · 흑마법', 'old preset keeps renamed costume');
    $('#period').value='Witch';fillMixFields();$('#style').value='gothic';fillColors();
    $('#color').value='aubergine';
    assert($('#color').value==='aubergine', 'new color selectable in fitting style');
    selectLang='en';applySelectLanguage();updatePreview();
    assert(currentPeriod().id==='mx-witch'&&$('#color').value==='aubergine'&&$('#collection').selectedOptions[0].textContent==='Fantasy Costumes', 'language switch keeps costume and new color');
    selectLang='ko';applySelectLanguage();updatePreview();
    eastRandom = false;
    for(let i=0;i<200;i++){
      randomize();const prompt=compose();
      assert(!!prompt && !prompt.includes('undefined') && !lastScene?.east, 'full draw ' + i);
      count.fullDraws++;
    }
    count.prompts = count.combinations;
    const periods = COLLECTIONS.flatMap(e => e.periods);
    const items = periods.flatMap(p => Object.entries(p.slots || {}).filter(([s]) => s !== 'effect').flatMap(([, list]) => list)).filter(it => it.p);
    count.periods = Object.fromEntries(COLLECTIONS.map(e => [e.id, e.periods.length]));
    count.items = items.length;
    count.uniquePrompts = new Set(items.map(it => it.p)).size;
    count.families = new Set(items.map(it => it.fam).filter(Boolean)).size;
    count.eastPeriods = periods.filter(p => p.east).length;
  } catch (error) { failures.push(error.stack || String(error)); }
  const pre = document.createElement('pre');
  pre.id = 'qa-results';
  pre.textContent = JSON.stringify({ failures, count });
  document.body.append(pre);
})();
</script>`;
try {
  fs.writeFileSync(page, fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace('</body>', checks + '\n</body>'));
  const result = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-extensions', `--user-data-dir=${profile}`, '--dump-dom', new URL('file:///' + page.replaceAll('\\', '/')).href],
    { encoding: 'utf8', timeout: 60000, maxBuffer: 30 * 1024 * 1024 });
  if (result.error) throw result.error;
  const raw = result.stdout.match(/<pre id="qa-results">([^<]*)<\/pre>/)?.[1];
  if (!raw) throw new Error('Browser result missing: ' + result.stderr.slice(-1000));
  const answer = JSON.parse(raw.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  console.log(JSON.stringify(answer, null, 2));
  if (answer.failures.length) process.exitCode = 1;
  if (process.argv.includes('--visual')) {
    const setup = `<script>
      $('#collection').value='illust';updatePack();
      $('#period').value='Witch';fillMixFields();
      $('#style').value='gothic_lolita';$('#motif').value='star';
      $('#backgroundEnabled').checked=true;fillAtmosphereFields();
      fillColors();populateSlots();rollSlotsOnly();updatePreview();
      document.body.dataset.viewport=innerWidth+'x'+innerHeight;
      const view=new URL(location.href).searchParams.get('view');
      const measure=()=>{const r=x=>{const b=$(x).getBoundingClientRect();return [Math.round(b.top),Math.round(b.bottom)]};
        const pre=document.createElement('pre');pre.id='visualMetrics';pre.hidden=true;pre.textContent=JSON.stringify({view,y:scrollY,height:document.documentElement.scrollHeight,
          viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          porch:r('.porch'),entry:r('.entry'),left:r('.sidelight-left'),other:r('#other'),style:r('#style'),catBar:r('#catBar')});document.body.append(pre);};
      if(view==='middle')$('#style').scrollIntoView({block:'center'});
      if(view==='bottom')$('#catBar').scrollIntoView({block:'center'});
      measure();
    </script>`;
    fs.writeFileSync(visualPage, fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace('</body>', setup + '\n</body>'));
    for(const view of ['top','middle','bottom']){
      const url=new URL('file:///' + visualPage.replaceAll('\\', '/') + '?view=' + view).href;
      const probe=spawnSync(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-extensions',`--user-data-dir=${profile}`,'--window-size=420,900','--dump-dom',url],{encoding:'utf8',timeout:60000,maxBuffer:30*1024*1024});
      console.log('visual '+view+': '+(probe.stdout.match(/<pre[^>]*id="visualMetrics"[^>]*>([^<]*)<\/pre>/)?.[1]||probe.stderr.slice(-300)));
    }
    for (const [size, bounds] of [['desktop', '1920,1080'], ['phone', '500,2500']]) {
      const output = path.join(dir, `.qa-${size}-top.png`);
      const url = new URL('file:///' + visualPage.replaceAll('\\', '/') + '?view=top').href;
      const shot = spawnSync(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-extensions', `--user-data-dir=${profile}`, `--window-size=${bounds}`, '--virtual-time-budget=600', `--screenshot=${output}`, url],
        { encoding: 'utf8', timeout: 60000 });
      if (shot.error || shot.status) throw shot.error || new Error(shot.stderr.slice(-1000));
      console.log(output);
    }
  }
} finally {
  if (fs.existsSync(page)) fs.unlinkSync(page);
  if (fs.existsSync(visualPage)) fs.unlinkSync(visualPage);
  fs.rmSync(profile, { recursive: true, force: true });
}
