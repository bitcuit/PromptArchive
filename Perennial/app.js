// Prompt Archive : Perennial — engine
// 화면에 보이는 선택이 곧 출력이다. 섞으면 선택 자체가 바뀐다.
// 장면 엔진에 둘째 소품(곁 소품), 빛 종류 검사, 자세 ↔ 구도 검사, 신발 바꿈을 더했다.
(() => {
  const D = PERENNIAL;
  const $ = (s) => document.querySelector(s);
  const byId = (list, id) => list.find((x) => x.id === id);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const pickOther = (list, current) => {
    const rest = list.filter((x) => x !== current);
    return rest.length ? pick(rest) : list[0];
  };

  const DENSITY = { low: 1, mid: 3, high: 5 };
  const DECOR_PICK = 2;       // 새로 뽑을 때 켜지는 옷 장식 수
  // 표정 칸에는 눈의 상태와 시선만 둔다. 웃음 · 수줍음 같은 감정은 캐릭터마다 달라 이미지 툴 쪽 캐릭터 프롬프트에 맡긴다
  const FACE_OK = ['eyes closed', 'eye contact', 'one eye closed'];
  const MOTIF_CHANCE = 0.6;   // 옷 장식에 계절 무늬가 하나 섞일 확률
  // 화보는 인물이 주인공 물건과 작용하는 장면이다 — 새로 뽑으면 메인 소품이 늘 나온다(없음은 직접 고를 때만)
  const PROP_CHANCE = 1;
  const PAIR_CHANCE = 0.5;    // 메인 소품이 있을 때 곁 소품이 붙을 확률
  const STORE = 'perennial.';

  const load = (key, fallback) => {
    try {
      const v = localStorage.getItem(STORE + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (_) { return fallback; }
  };
  const save = (key, value) => {
    try { localStorage.setItem(STORE + key, JSON.stringify(value)); } catch (_) {}
  };

  const state = {
    season: 'all',
    scene: null, prop: 'none', prop2: 'none', moment: null, light: null, shot: null, tone: null,
    outfit: load('sceneOnly', false) ? 'none' : null,
    sex: ['f', 'm', 'u'].includes(load('sex', 'f')) ? load('sex', 'f') : 'f',
    neutral: null,
    c: { main: null, bottom: null, outer: null, shoes: null, hat: null },
    acc: [],
    mode: load('mode', 'scene') === 'wardrobe' ? 'wardrobe' : 'scene', // 화보 / 옷장
    wardSeason: null,
    details: [],
    decor: [],
    palette: null,
    density: load('density', 'mid'),
    emphasis: load('emphasis', false),
    count: load('count', 0)
  };
  if (!DENSITY[state.density]) state.density = 'mid';
  const LOCKABLE = ['scene', 'prop', 'prop2', 'moment', 'light', 'shot', 'tone', 'outfit', 'palette', 'cMain', 'cBottom', 'cOuter', 'cShoes', 'cHat'];
  const locks = Object.fromEntries(LOCKABLE.map((f) => [f, false]));

  const scene = () => byId(D.scenes, state.scene);
  // 소품의 계절은 그 소품을 권하는 장면들의 계절이다. 다른 계절의 옷 · 소품은 고를 수도 없다(눈 오는 날 반팔 같은 것)
  const PROP_SEASONS = Object.fromEntries(D.props.map((p) => [p.id, new Set(D.scenes.filter((s) => s.props.includes(p.id)).map((s) => s.season))]));
  // 지금 계절: 옷장에서는 옷장의 계절, 화보에서는 장면의 계절
  const seasonNow = () => (state.mode === 'wardrobe' ? state.wardSeason : scene().season);
  const inSeason = (item) => (item.season ? item.season === seasonNow() : PROP_SEASONS[item.id] && PROP_SEASONS[item.id].has(seasonNow()));
  const light = () => byId(scene().lights, state.light);
  const prop = () => (state.prop === 'none' ? null : byId(D.props, state.prop));
  const prop2 = () => (state.prop2 === 'none' ? null : byId(D.props, state.prop2));
  const shot = () => byId(D.shots, state.shot);

  // 빛 종류: 소품 · 순간 · 옷이 kinds 를 가지면 그 빛에서만 말이 된다
  const fitsLight = (item, l = light()) => !item.kinds || item.kinds.includes(l.kind);
  // 구도가 poses 를 가지면 그 자세하고만 쓴다(바로 위에서 = 누운 자세)
  const fitsPose = (sh, m) => !sh.poses || sh.poses.includes(m.pose);

  // 메인 소품이 있으면 '순간'은 장면의 것이 아니라 소품의 동작이다
  // 소품 동작의 seasons 가 있으면 그 계절 장면에서만 쓴다(눈밭에 누워 책 읽기 같은 것을 막는다)
  const momentList = () => (prop()
    ? prop().acts.filter((a) => !a.seasons || a.seasons.includes(scene().season))
    : scene().moments);
  const moment = () => byId(momentList(), state.moment);
  const scenePool = () => (state.season === 'all' ? D.scenes : D.scenes.filter((s) => s.season === state.season));

  // 짝은 어느 한쪽의 pairs 에만 적어도 된다
  const paired = (a, b) => (a.pairs || []).includes(b.id) || (b.pairs || []).includes(a.id);
  // 곁 소품 후보: 첫째의 짝 중 이 장면에 있고, 곁에 놓일 수 있고(near), 빛이 맞는 것
  function pairList() {
    const p = prop();
    if (!p) return [];
    return scene().props.filter((id) => {
      const q = byId(D.props, id);
      return id !== p.id && q.near && paired(p, q) && fitsLight(q);
    });
  }

  // ── 뽑기 ─────────────────────────────────────────────
  function shuffle(list) {
    const pool = list.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  // 풍경 소품은 문자열이거나 { t, kinds }. 빛과 맞는 것만 뽑는다
  const detailText = (x) => (typeof x === 'string' ? x : x.t);
  const detailFits = (x) => typeof x === 'string' || fitsLight(x);
  function rollDetails() {
    state.details = shuffle(scene().details.filter((x) => detailFits(x))).slice(0, DENSITY[state.density]).map(detailText);
  }
  // 빛이 바뀌어 안 맞게 된 풍경 소품이 있으면 다시 뽑는다
  function detailsStillFit() {
    return state.details.every((t) => {
      const x = scene().details.find((d) => detailText(d) === t);
      return x && detailFits(x);
    });
  }

  // 옷 색: 계절 배색에서 하나. 색 자리({c1} · {c2})가 없는 옷은 색이 정해져 있다
  const palettes = () => byId(D.seasons, seasonNow()).palettes;
  const palette = () => byId(palettes(), state.palette);
  const usesColor = (o) => !!o && /\{c[12]\}/.test([...o.tags, o.shoes].join(' '));
  const paint = (t) => (palette() ? t.replace(/\{c1\}/g, palette().c1).replace(/\{c2\}/g, palette().c2) : t);
  function rollPalette() { state.palette = pickOther(palettes().map((p) => p.id), state.palette); }
  const decorLabel = (t) => {
    if (D.decorKo[t]) return D.decorKo[t];
    const x = D.accessories.find((e) => e.t === t);
    if (x) return x.k;
    return t;
  };
  const seasonMotifs = (o) => (o.noMotif ? [] : byId(D.seasons, seasonNow()).motifs);
  // 칩으로 보이는 후보: 그 옷의 장식 + 계절 무늬
  const decorOptions = () => {
    if (closetActive()) return accPool().map((x) => x.t);
    if (state.outfit === 'none') return [];
    const o = byId(D.outfits, state.outfit);
    return [...new Set([...(o.decor || []), ...seasonMotifs(o)])];
  };
  // 옷 장식: 그 옷의 장식에서 뽑고, 계절 무늬를 하나 섞을 수 있다
  function rollDecor() {
    const n = DECOR_PICK;
    if (closetActive()) { rollAcc(); return; }
    if (state.outfit === 'none') { state.decor = []; return; }
    const o = byId(D.outfits, state.outfit);
    const own = shuffle(o.decor || []);
    const motifs = seasonMotifs(o).filter((t) => !(o.decor || []).includes(t));
    const out = [];
    if (motifs.length && Math.random() < MOTIF_CHANCE) out.push(pick(motifs));
    while (out.length < n && own.length) out.push(own.shift());
    state.decor = out;
  }

  function propCandidates() {
    return scene().props.filter((id) => fitsLight(byId(D.props, id)));
  }

  function rollProp() {
    const list = propCandidates();
    state.prop = list.length && Math.random() < PROP_CHANCE ? pick(list) : 'none';
  }

  function rollProp2() {
    const list = pairList();
    state.prop2 = list.length && Math.random() < PAIR_CHANCE ? pick(list) : 'none';
  }

  // 지금 구도와 빛에 맞는 순간들. 하나도 없으면 빛만 맞는 것으로 물러선다
  function momentCandidates() {
    const byLight = momentList().filter((m) => fitsLight(m));
    const byPose = byLight.filter((m) => fitsPose(shot(), m));
    return byPose.length ? byPose : byLight.length ? byLight : momentList();
  }

  function rollMoment() {
    state.moment = pick(momentCandidates()).id;
  }

  function shotCandidates() {
    const m = moment();
    const own = scene().shots.filter((id) => fitsPose(byId(D.shots, id), m));
    return own.length ? own : D.shots.filter((x) => fitsPose(x, m)).map((x) => x.id);
  }

  // 완성된 옷: 이 장면 것 중 성별 · 빛이 맞는 것. 빛이 안 맞으면 성별만 맞는 것으로 물러선다
  function outfitCandidates() {
    const mine = scene().outfits.filter((id) => sexOk(byId(D.outfits, id)));
    const own = mine.filter((id) => fitsLight(byId(D.outfits, id)));
    return own.length ? own : mine.length ? mine : scene().outfits;
  }

  // 빛을 고를 때, 잠긴 소품이 특정 빛만 받으면 그 빛 안에서 고른다
  function lightCandidates() {
    const s = scene();
    const p = locks.prop ? prop() : null;
    const ok = s.lights.filter((l) => !p || fitsLight(p, l));
    return (ok.length ? ok : s.lights).map((l) => l.id);
  }

  // 한쪽을 바꾼 뒤 서로 어긋난 것을 바로잡는다. 잠긴 것은 건드리지 않는다
  function settle() {
    const p = prop();
    if (p && !fitsLight(p) && !locks.prop) state.prop = 'none';
    if (state.prop2 !== 'none') {
      const ok = pairList().includes(state.prop2);
      if (!prop() || (!ok && !locks.prop2)) state.prop2 = 'none';
    }
    if (!moment() || !fitsLight(moment())) {
      if (locks.moment) locks.moment = false;
      rollMoment();
    }
    if (!fitsPose(shot(), moment())) {
      if (!locks.shot) state.shot = pick(shotCandidates());
      else rollMoment();
    }
    if (state.scene && !detailsStillFit()) rollDetails();
  }

  // 장면이 바뀌면 빛 · 순간은 새 장면의 것으로 다시 뽑는다. 소품 · 구도 · 톤 · 옷은 잠겨 있으면 남긴다.
  function enterScene(id) {
    state.scene = id;
    const s = scene();
    locks.light = false;
    state.light = pick(lightCandidates());
    // 잠갔어도 계절이 다르면 풀고 다시 뽑는다
    if (prop() && !inSeason(prop())) locks.prop = false;
    if (prop2() && !inSeason(prop2())) locks.prop2 = false;
    if (state.outfit && state.outfit !== 'none' && state.outfit !== 'mix' && (!inSeason(byId(D.outfits, state.outfit)) || !sexOk(byId(D.outfits, state.outfit)))) locks.outfit = false;
    if (!locks.prop) rollProp();
    if (!locks.prop2) rollProp2();
    if (!locks.shot || !byId(D.shots, state.shot)) state.shot = pick(s.shots);
    // 소품과 그 동작을 함께 잠갔으면 동작도 남긴다
    if (!(prop() && locks.prop && locks.moment && moment())) {
      locks.moment = false;
      rollMoment();
    }
    if (!locks.shot) state.shot = pick(shotCandidates());
    if (!locks.tone || !state.tone) state.tone = pick(s.tones);
    if (!locks.palette || !palette()) rollPalette();
    if (state.outfit === 'mix' && scene().mix === false) locks.outfit = false;
    if (state.outfit !== 'none' && (!locks.outfit || !state.outfit)) chooseOutfit();
    else if (mixing()) fitCloset(true);
    settle();
    rollDetails();
    rollDecor();
  }

  function roll(field) {
    const s = scene();
    if (field === 'scene') {
      enterScene(pickOther(scenePool().map((x) => x.id), state.scene));
      return;
    }
    if (field === 'prop') {
      // 🎲 은 '없음'을 건너뛰고 이 장면에 맞는 다른 소품을 고른다
      const list = propCandidates();
      state.prop = list.length ? pickOther(list, state.prop) : 'none';
      if (!locks.prop2) rollProp2();
      rollMoment();
    } else if (field === 'prop2') {
      const list = pairList();
      state.prop2 = list.length ? pickOther(list, state.prop2) : 'none';
    } else if (field === 'moment') {
      state.moment = pickOther(momentCandidates().map((m) => m.id), state.moment);
    } else if (field === 'light') {
      state.light = pickOther(lightCandidates(), state.light);
    } else if (field === 'shot') {
      state.shot = pickOther(shotCandidates(), state.shot);
    } else if (field === 'tone') {
      state.tone = pickOther(s.tones, state.tone);
    } else if (field === 'cMain') {
      rollClosetMain();
      fitCloset(false);
    } else if (CLOSET_SLOTS.includes(field)) {
      const m = cMain();
      const lists = { cBottom: bottomsFor(m), cOuter: outersFor(m), cShoes: shoesFor(m), cHat: hatsFor() };
      const key = { cBottom: 'bottom', cOuter: 'outer', cShoes: 'shoes', cHat: 'hat' }[field];
      const ids = lists[field].map((x) => x.id);
      if (ids.length) state.c[key] = pickOther(ids, state.c[key]);
    } else if (field === 'outfit') {
      if (state.outfit === 'mix') fitCloset(true);
      else state.outfit = pickOther(outfitCandidates(), state.outfit);
      rollDecor();
    } else if (field === 'details') {
      rollDetails();
    } else if (field === 'palette') {
      rollPalette();
    } else if (field === 'decor') {
      rollDecor();
    }
    settle();
  }

  // ── 옷장: 배경 없이 옷만. 조각(상의 · 하의 · 원피스 · 수영복 · 겉옷 · 신발 · 모자)을 조합한다 ──
  const CLOSET_SLOTS = ['cMain', 'cBottom', 'cOuter', 'cShoes', 'cHat'];
  const OUTER_CHANCE = { spring: 0.5, summer: 0.25, autumn: 0.7, winter: 0.95 };
  const SWIM_CHANCE = 0.3;      // 여름 옷장에서 수영복이 나올 확률
  const DRESS_CHANCE = 0.35;
  const HAT_CHANCE = { spring: 0.3, summer: 0.5, autumn: 0.3, winter: 0.45 };
  const MIX_CHANCE = 0.5;       // 화보에서 랜덤일 때 옷장 조합이 나올 확률
  // 옷장의 계절: 옷장 탭에서는 옷장 계절, 화보에서는 장면의 계절
  const closetSeason = () => (state.mode === 'wardrobe' ? state.wardSeason : scene().season);
  const closetOf = () => D.closet[closetSeason()];
  // 화보에서 옷장 조합을 쓰는 중인가
  const mixing = () => state.mode === 'scene' && state.outfit === 'mix';
  const closetActive = () => state.mode === 'wardrobe' || mixing();
  // 성별: 여성(f) · 남성(m) · 공용(u — 성별 표시가 없는 조각만)
  const sexOk = (x) => (state.sex === 'u' ? !x.sex : !x.sex || x.sex === state.sex);
  // 수영복: 옷장은 여름이면 나올 수 있음, 화보는 장면이 정한다(mix: 'swim' 수영복만 · 'beach' 수영복도 · 그 밖 없음)
  const swimRule = () => (state.mode === 'wardrobe' ? 'allow' : scene().mix || 'none');
  const mainPool = () => {
    const c = closetOf();
    const rule = swimRule();
    const tops = rule === 'swim' ? [] : c.tops.filter(sexOk).map((x) => ({ ...x, kind: 'top' }));
    const dresses = rule === 'swim' ? [] : c.dresses.filter(sexOk).map((x) => ({ ...x, kind: 'dress' }));
    const swim = rule === 'none' ? [] : (c.swim || []).filter(sexOk).map((x) => ({ ...x, kind: 'swim' }));
    return [...tops, ...dresses, ...swim];
  };
  const cMain = () => mainPool().find((x) => x.id === state.c.main) || null;
  const cBottom = () => closetOf().bottoms.find((x) => x.id === state.c.bottom) || null;
  const cOuter = () => closetOf().outers.find((x) => x.id === state.c.outer) || null;
  const cShoes = () => closetOf().shoes.find((x) => x.id === state.c.shoes) || null;
  const cHat = () => closetOf().hats.find((x) => x.id === state.c.hat) || null;
  // 어울림 규칙: 원피스 · 수영복엔 하의 없음, 크롭엔 하이웨이스트, 수영복엔 커버업과 해변 신발, 긴 겉옷엔 짧은 하의 없음
  const bottomsFor = (m, o = cOuter()) => (m && m.kind === 'top' ? closetOf().bottoms.filter((b) => sexOk(b) && (!m.crop || b.hw) && !(o && o.long && b.short)) : []);
  const outersFor = (m, b = cBottom()) => closetOf().outers.filter((o) => sexOk(o) && (m && m.kind === 'swim' ? o.cover : !o.cover) && !(o.long && b && b.short));
  const shoesFor = (m) => closetOf().shoes.filter((x) => sexOk(x) && (m && m.kind === 'swim' ? x.beach : !x.beachOnly));
  const hatsFor = () => closetOf().hats.filter(sexOk);
  // ── 옷장 소품: 지금 옷에 어울리는 것만 칩으로, 뽑을 때 1~4개 ──
  const ACC_N = 4;
  const accById = (id) => (id ? D.accessories.find((x) => x.id === id) || null : null);
  // 어울림: 성별 · 계절 · 수영복이면 해변 것만 · 운동복 결엔 격식 주얼리 없음 · 모자 쓰면 머리띠 · 머리 위 선글라스 없음
  const accFits = (x) => {
    const m = cMain();
    if (!x || !sexOk(x)) return false;
    if (x.seasons && !x.seasons.includes(closetSeason())) return false;
    if (m && m.kind === 'swim' ? !(x.swim || x.swimOnly) : x.swimOnly) return false;
    if (m && m.sporty && x.dressy) return false;
    if (x.hatClash && cHat()) return false;
    if (x.needsCollar && !(m && m.collar)) return false;
    if (x.needsJacket && !(cOuter() && cOuter().jacket)) return false;
    return true;
  };
  const accPool = () => D.accessories.filter(accFits);
  const accTexts = () => state.acc.map(accById).filter(Boolean).map((x) => x.t);
  // 안 맞게 된 것은 빼고, 같은 부위가 겹치면 앞의 것만 남긴다
  function fitAcc() {
    const used = new Set();
    state.acc = state.acc.map(accById).filter((x) => {
      if (!accFits(x) || used.has(x.g)) return false;
      used.add(x.g);
      return true;
    }).map((x) => x.id).slice(0, ACC_N);
  }
  function rollAcc() {
    const want = 1 + Math.floor(Math.random() * ACC_N);
    const used = new Set();
    state.acc = shuffle(accPool()).filter((x) => {
      if (used.has(x.g)) return false;
      used.add(x.g);
      return true;
    }).slice(0, want).map((x) => x.id);
  }
  function rollClosetMain() {
    const pool = mainPool();
    const of = (k) => pool.filter((x) => x.kind === k).map((x) => x.id);
    const rule = swimRule();
    const swimChance = rule === 'swim' ? 1 : rule === 'beach' ? 0.5 : SWIM_CHANCE;
    let list = of('top');
    if (of('swim').length && Math.random() < swimChance) list = of('swim');
    else if (of('dress').length && Math.random() < DRESS_CHANCE) list = of('dress');
    if (!list.length) list = pool.map((x) => x.id);
    state.c.main = pickOther(list, state.c.main);
  }
  // 한 칸을 바꾼 뒤 나머지가 규칙에 맞게. 잠긴 칸도 규칙에 어긋나면 풀린다.
  // changed 는 사용자가 방금 고른 칸 — 그 칸이 이긴다
  function fitCloset(rollFree, changed) {
    if (!cMain()) { locks.cMain = false; rollClosetMain(); }
    const m = cMain();
    if (changed === 'bottom' && cOuter() && cOuter().long && cBottom() && cBottom().short) { locks.cOuter = false; state.c.outer = null; }
    if (rollFree && !locks.cOuter) state.c.outer = null; // 하의를 먼저 고르고 겉옷을 맞춘다
    const bs = bottomsFor(m).map((x) => x.id);
    if (!bs.includes(state.c.bottom)) { locks.cBottom = false; state.c.bottom = bs.length ? pick(bs) : null; }
    else if (rollFree && !locks.cBottom) state.c.bottom = pick(bs);
    const os = outersFor(m).map((x) => x.id);
    if (state.c.outer && !os.includes(state.c.outer)) { locks.cOuter = false; state.c.outer = null; }
    if (rollFree && !locks.cOuter) {
      const chance = m && m.kind === 'swim' ? 0.5 : OUTER_CHANCE[closetSeason()];
      state.c.outer = os.length && Math.random() < chance ? pick(os) : null;
    }
    const ss = shoesFor(m).map((x) => x.id);
    if (!ss.includes(state.c.shoes)) { locks.cShoes = false; state.c.shoes = pick(ss); }
    else if (rollFree && !locks.cShoes) state.c.shoes = pick(ss);
    const hs = hatsFor().map((x) => x.id);
    if (state.c.hat && !hs.includes(state.c.hat)) { locks.cHat = false; state.c.hat = null; }
    if (rollFree && !locks.cHat) state.c.hat = Math.random() < HAT_CHANCE[closetSeason()] ? pick(hs) : null;
    if (!state.neutral || !byId(D.seasons, closetSeason()).neutrals.includes(state.neutral)) state.neutral = pick(byId(D.seasons, closetSeason()).neutrals);
    fitAcc();
  }
  // 옷 칸 고르기(화보): 옷장 조합 또는 완성된 옷
  function chooseOutfit() {
    if (scene().mix !== false && Math.random() < MIX_CHANCE) {
      state.outfit = 'mix';
      fitCloset(true);
      state.neutral = pick(byId(D.seasons, scene().season).neutrals);
    } else {
      state.outfit = pick(outfitCandidates());
    }
  }
  function enterWardSeason(id) {
    const changed = state.wardSeason !== id;
    state.wardSeason = id;
    if (changed || !cMain()) CLOSET_SLOTS.forEach((k) => { locks[k] = false; });
    if (!locks.cMain || !cMain()) rollClosetMain();
    fitCloset(true);
    if (!locks.palette || !palette() || changed) rollPalette();
    state.neutral = pick(byId(D.seasons, id).neutrals);
    rollDecor();
  }
  function shuffleWardrobe() {
    let season = state.season;
    if (season === 'all') season = CLOSET_SLOTS.some((k) => locks[k]) ? state.wardSeason : pick(D.seasons).id;
    enterWardSeason(season);
  }

  function shuffleAll() {
    if (state.mode === 'wardrobe') {
      shuffleWardrobe();
    } else if (!locks.scene) {
      roll('scene');
    } else {
      if (!locks.light) state.light = pick(lightCandidates());
      if (!locks.prop) rollProp();
      if (!locks.prop2) rollProp2();
      if (!locks.moment) rollMoment();
      settle();
      if (!locks.shot) state.shot = pick(shotCandidates());
      if (!locks.tone) state.tone = pickOther(scene().tones, state.tone);
      if (state.outfit !== 'none' && !locks.outfit) chooseOutfit();
      else if (mixing()) fitCloset(true);
      rollDetails();
      if (!locks.outfit) rollDecor();
      if (!locks.palette) rollPalette();
    }
    state.count += 1;
    save('count', state.count);
  }

  // ── 프롬프트 ─────────────────────────────────────────
  function buildPrompt() {
    const s = scene();
    const sh = shot();
    const m = moment();
    const p = prop();
    const q = prop2();
    const tone = byId(D.tones, state.tone);
    const seen = new Set();
    const fresh = (tags) => tags.filter((t) => {
      const k = t.trim().toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const parts = [];
    // 옷장 조각 한 줄 — 원피스(상의) · 하의 · 겉옷 · 소품 · 신발 · 모자. shoes 를 주면 신발이 그것으로 바뀐다('' 이면 뺌)
    const closetWear = (shoes) => {
      // 하의가 보조색이면 겉옷은 계절 무채색으로 — 같은 색 세트처럼 보이지 않게
      let outerT = cOuter() ? cOuter().t : null;
      if (outerT && cBottom() && /\{c2\}/.test(cBottom().t)) {
        const pal = palette();
        const ns = byId(D.seasons, closetSeason()).neutrals.filter((n) => !pal || (n !== pal.c1 && n !== pal.c2));
        const n = ns.includes(state.neutral) ? state.neutral : ns[0];
        outerT = outerT.replace(/\{c2\}/g, n);
      }
      const pieces = [cMain() && cMain().t, cBottom() && cBottom().t, outerT].filter(Boolean);
      const foot = shoes === undefined ? (cShoes() ? cShoes().t : '') : shoes;
      const tail = [foot, cHat() && cHat().t].filter(Boolean);
      return fresh([...pieces, ...accTexts(), ...tail].map(paint));
    };
    // 옷장: 옷 한 줄만 (캐릭터 프롬프트 뒤에 붙여 쓴다)
    if (state.mode === 'wardrobe') {
      return closetWear().join(', ');
    }
    parts.push(fresh(sh.tags).join(', '));
    const act = fresh(m.tags).join(', ');
    parts.push(state.emphasis ? `1.3::${act} ::` : act);
    if (!sh.noFace && m.face) parts.push(fresh(m.face).join(', '));
    if (p) parts.push(fresh(p.tags).join(', '));
    if (q) parts.push(fresh(q.near).join(', '));
    parts.push(fresh([s.place, ...s.core, ...state.details]).join(', '));
    parts.push(fresh([...light().tags, ...tone.tags]).join(', '));
    let text = parts.filter(Boolean).join(', ');

    if (mixing()) {
      let shoes = m.shoes !== undefined ? m.shoes : undefined; // 맨발 · 스케이트로 바뀌는 순간
      if (sh.crop === 'upper') shoes = '';
      const wear = closetWear(shoes);
      if (wear.length) text += ',\n\n' + wear.join(', ');
    } else if (state.outfit !== 'none') {
      const o = byId(D.outfits, state.outfit);
      let shoes = o.shoes;
      if (m.shoes !== undefined) shoes = m.shoes; // 맨발('') 이나 스케이트로 바뀌는 순간
      const wear = fresh([...o.tags, ...state.decor, ...(sh.crop === 'upper' || !shoes ? [] : [shoes])].map(paint));
      if (wear.length) text += ',\n\n' + wear.join(', ');
    }
    return text;
  }

  // ── 그리기 ───────────────────────────────────────────
  const el = {
    scene: $('#scene'), prop: $('#prop'), prop2: $('#prop2'), moment: $('#moment'), light: $('#light'),
    shot: $('#shot'), tone: $('#tone'), outfit: $('#outfit'), density: $('#density'), decorChips: $('#decorChips'), palette: $('#palette'),
    cMain: $('#cMain'), cBottom: $('#cBottom'), cOuter: $('#cOuter'), cShoes: $('#cShoes'), cHat: $('#cHat'), sex: $('#sex'),
    emphasis: $('#emphasis'),
    card: $('#card'), prompt: $('#prompt'), copy: $('#copyBtn'),
    frontSeason: $('#frontSeason'), frontTitle: $('#frontTitle'), frontSub: $('#frontSub'),
    stampSeason: $('#stampSeason'), stampNo: $('#stampNo'),
    markDate: $('#markDate'), markSeason: $('#markSeason'),
    cardTitle: $('#cardTitle'), cardSub: $('#cardSub'), cardRows: $('#cardRows'), counter: $('#counter')
  };

  const option = (value, label) => {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    return o;
  };

  // 장면이 권하는 것을 위에, 나머지를 아래에 둔다
  function fillSplit(select, all, recommended, first, nearLabel = '이 장면에 맞는 것') {
    select.textContent = '';
    if (first) select.append(first);
    const near = document.createElement('optgroup');
    near.label = nearLabel;
    const rest = document.createElement('optgroup');
    rest.label = '그 밖';
    all.forEach((item) => (recommended.includes(item.id) ? near : rest).append(option(item.id, item.label)));
    if (near.children.length) select.append(near);
    if (rest.children.length) select.append(rest);
  }

  // 옷장 칸들
  function renderClosetSelects() {
    const m = cMain();
    const pool = mainPool();
    const grp = (sel, label, items) => {
      if (!items.length) return;
      const g = document.createElement('optgroup');
      g.label = label;
      items.forEach((x) => g.append(option(x.id, x.k)));
      sel.append(g);
    };
    el.cMain.textContent = '';
    grp(el.cMain, '상의', pool.filter((x) => x.kind === 'top')); grp(el.cMain, '원피스', pool.filter((x) => x.kind === 'dress')); grp(el.cMain, '수영복', pool.filter((x) => x.kind === 'swim'));
    el.cMain.value = state.c.main;
    el.cBottom.textContent = '';
    // 목록은 길이와 상관없이 다 보여 준다 — 고르면 그쪽이 이기고 나머지가 맞춰진다
    const bs = bottomsFor(m, null);
    if (bs.length) bs.forEach((x) => el.cBottom.append(option(x.id, x.k)));
    else el.cBottom.append(option('', m && m.kind === 'swim' ? '수영복이라 없음' : '원피스라 없음'));
    el.cBottom.value = state.c.bottom || '';
    el.cBottom.disabled = !bs.length;
    el.cOuter.textContent = '';
    el.cOuter.append(option('', '없음'));
    outersFor(m, null).forEach((x) => el.cOuter.append(option(x.id, x.k)));
    el.cOuter.value = state.c.outer || '';
    el.cShoes.textContent = '';
    shoesFor(m).forEach((x) => el.cShoes.append(option(x.id, x.k)));
    el.cShoes.value = state.c.shoes;
    el.cHat.textContent = '';
    el.cHat.append(option('', '없음'));
    hatsFor().forEach((x) => el.cHat.append(option(x.id, x.k)));
    el.sex.value = state.sex;
    el.cHat.value = state.c.hat || '';
    document.querySelectorAll('[data-roll="cBottom"], [data-lock="cBottom"]').forEach((b) => { b.disabled = !bs.length; });
  }

  function renderSelects() {
    const s = scene();
    el.scene.textContent = '';
    D.seasons.forEach((season) => {
      if (state.season !== 'all' && state.season !== season.id) return;
      const group = document.createElement('optgroup');
      group.label = season.label;
      D.scenes.filter((x) => x.season === season.id).forEach((x) => group.append(option(x.id, x.title)));
      el.scene.append(group);
    });
    fillSplit(el.prop, D.props.filter(inSeason), s.props, option('none', '없음'));
    const placeable = D.props.filter((x) => x.near && x.id !== state.prop && inSeason(x));
    fillSplit(el.prop2, placeable, pairList(), option('none', '없음'), '이 소품과 어울리는 것');
    el.moment.textContent = '';
    momentList().forEach((x) => el.moment.append(option(x.id, x.label)));
    el.light.textContent = '';
    s.lights.forEach((x) => el.light.append(option(x.id, x.label)));
    fillSplit(el.shot, D.shots, s.shots);
    fillSplit(el.tone, D.tones, s.tones);
    fillSplit(el.outfit, D.outfits.filter((x) => inSeason(x) && sexOk(x)), s.outfits, option('none', '장면만 (옷 없음)'));
    if (s.mix !== false) el.outfit.insertBefore(option('mix', '옷장에서 조합 (옷장 탭에서 고치기)'), el.outfit.children[1]);
    if (state.mode === 'wardrobe') renderClosetSelects();

    ['scene', 'prop', 'prop2', 'moment', 'light', 'shot', 'tone', 'outfit', 'density'].forEach((f) => { el[f].value = state[f]; });
    // 옷 색: 이 계절의 배색. 색이 정해진 옷이면 고를 것이 없다
    el.palette.textContent = '';
    const o = closetActive() ? { tags: ['{c1}'], shoes: '' } : (state.outfit === 'none' ? null : byId(D.outfits, state.outfit));
    if (usesColor(o)) {
      palettes().forEach((p) => el.palette.append(option(p.id, p.label)));
      el.palette.value = state.palette;
      el.palette.disabled = false;
    } else {
      el.palette.append(option('', o ? '이 옷은 색이 정해져 있음' : '장면만'));
      el.palette.disabled = true;
    }
    document.querySelectorAll('[data-roll="palette"], [data-lock="palette"]').forEach((b) => { b.disabled = !usesColor(o); });
    // 옷 장식 칩: 켜진 것이 곧 프롬프트에 들어가는 장식
    el.decorChips.textContent = '';
    const opts = decorOptions();
    opts.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.decor = t;
      b.textContent = decorLabel(t);
      b.title = t;
      b.setAttribute('aria-pressed', String(closetActive() ? accTexts().includes(t) : state.decor.includes(t)));
      el.decorChips.append(b);
    });
    if (!opts.length) {
      const p = document.createElement('span');
      p.className = 'chips-empty';
      p.textContent = '장면만 — 옷 없음';
      el.decorChips.append(p);
    }
    document.querySelectorAll('[data-roll="decor"]').forEach((b) => { b.disabled = !opts.length; });
    el.emphasis.checked = state.emphasis;

    el.prop2.disabled = !prop();
    if (!prop()) locks.prop2 = false;
    const outfitOff = state.outfit === 'none';
    if (outfitOff) locks.outfit = false;

    document.querySelectorAll('[data-lock]').forEach((b) => {
      const f = b.dataset.lock;
      const on = locks[f];
      b.textContent = on ? '◆' : '◇';
      b.setAttribute('aria-pressed', String(on));
      b.disabled = (f === 'prop2' && !prop()) || (f === 'outfit' && outfitOff);
    });
    document.querySelectorAll('[data-roll="prop2"]').forEach((b) => { b.disabled = !prop(); });
    document.querySelectorAll('.seasons [data-season]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.season === state.season));
    });
  }

  const pad = (n) => String(n).padStart(4, '0');
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  function renderCard() {
    const s = scene();
    const season = byId(D.seasons, seasonNow());
    document.body.dataset.season = season.id;
    document.body.dataset.mode = state.mode;
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    if (state.mode === 'wardrobe') {
      const m = cMain();
      const title = m.k + (cBottom() ? ' · ' + cBottom().k : '');
      const o = { label: title };
      el.frontSeason.textContent = season.en;
      el.frontTitle.textContent = o.label;
      el.frontSub.textContent = season.label + ' 옷장';
      el.stampSeason.textContent = season.label;
      el.stampNo.textContent = 'No. ' + pad(state.count);
      el.markDate.textContent = today();
      el.markSeason.textContent = season.en;
      el.cardTitle.textContent = o.label;
      el.cardTitle.dataset.long = String(o.label.length > 12);
      el.cardSub.textContent = season.en + ' WARDROBE';
      el.counter.textContent = pad(state.count);
      const rows = [['겉옷', cOuter() ? cOuter().k : '없음'], ['신발', cShoes().k + (cHat() ? ' · ' + cHat().k : '')], ['색', palette() ? palette().label : '']];
      rows.push(['소품', accTexts().length ? accTexts().map(decorLabel).join(' · ') : '없음']);
      el.cardRows.textContent = '';
      rows.forEach(([k, v]) => {
        const dt = document.createElement('dt');
        dt.textContent = k;
        const dd = document.createElement('dd');
        dd.textContent = v;
        el.cardRows.append(dt, dd);
      });
      el.prompt.textContent = buildPrompt();
      el.copy.textContent = '복사';
      return;
    }
    el.frontSeason.textContent = season.en;
    el.frontTitle.textContent = s.title;
    el.frontSub.textContent = s.sub;
    el.stampSeason.textContent = season.label;
    el.stampNo.textContent = 'No. ' + pad(state.count);
    el.markDate.textContent = today();
    el.markSeason.textContent = season.en;
    el.cardTitle.textContent = s.title;
    el.cardTitle.dataset.long = String(s.title.length > 12);
    el.cardSub.textContent = s.sub;
    el.counter.textContent = pad(state.count);

    const rows = [];
    if (prop()) rows.push(['소품', prop().label + (prop2() ? ' · ' + prop2().label : '')]);
    rows.push(['순간', moment().label], ['빛', light().label]);
    const wearing = state.outfit === 'none' || state.outfit === 'mix' ? null : byId(D.outfits, state.outfit);
    if (mixing()) rows.push(['옷', '옷장 조합 — ' + cMain().k + (cBottom() ? ' · ' + cBottom().k : '') + (palette() ? ' (' + palette().label + ')' : '')]);
    else rows.push(['옷', !wearing ? '장면만' : wearing.label + (usesColor(wearing) && palette() ? ' (' + palette().label + ')' : '')]);
    el.cardRows.textContent = '';
    rows.forEach(([k, v]) => {
      const dt = document.createElement('dt');
      dt.textContent = k;
      const dd = document.createElement('dd');
      dd.textContent = v;
      el.cardRows.append(dt, dd);
    });

    el.prompt.textContent = buildPrompt();
    el.copy.textContent = '복사';
  }

  function render() {
    renderSelects();
    renderCard();
  }

  // ── 조작 ─────────────────────────────────────────────
  document.querySelectorAll('.seasons [data-season]').forEach((b) => {
    b.addEventListener('click', () => {
      state.season = b.dataset.season;
      if (state.mode === 'wardrobe') {
        if (state.season !== 'all' && state.season !== state.wardSeason) {
          enterWardSeason(state.season);
          state.count += 1;
          save('count', state.count);
          render();
          pull();
          return;
        }
        render();
        return;
      }
      if (state.season !== 'all' && scene().season !== state.season) {
        locks.scene = false;
        roll('scene');
        state.count += 1;
        save('count', state.count);
        render();
        pull();
        return;
      }
      render();
    });
  });

  // 화보 / 옷장 전환
  document.querySelectorAll('[data-mode]').forEach((b) => {
    b.addEventListener('click', () => {
      const next = b.dataset.mode;
      if (next === state.mode) return;
      state.mode = next;
      save('mode', next);
      if (next === 'wardrobe') {
        // 화보에서 옷장 조합을 쓰던 중이면 그 조합을 그대로 가져가 고친다
        if (state.outfit === 'mix') {
          state.wardSeason = scene().season;
          fitCloset(false);
        } else {
          enterWardSeason(state.season !== 'all' ? state.season : scene().season);
        }
      } else if (state.outfit === 'mix') {
        // 옷장에서 고친 조합을 화보로. 계절이 다르면 이 장면 계절로 다시 맞춘다
        if (scene().mix === false) chooseOutfit();
        else fitCloset(state.wardSeason !== scene().season);
      } else {
        if (state.outfit !== 'none' && !scene().outfits.includes(state.outfit) && byId(D.outfits, state.outfit).season !== scene().season) state.outfit = pick(outfitCandidates());
        rollDecor();
      }
      render();
      pull();
    });
  });

  el.scene.addEventListener('change', () => { enterScene(el.scene.value); render(); });

  // 소품을 직접 고르면 소품이 이긴다 — 빛이 안 맞으면 이 장면에서 맞는 빛으로 옮긴다
  el.prop.addEventListener('change', () => {
    state.prop = el.prop.value;
    const p = prop();
    if (p && !fitsLight(p)) {
      const ok = scene().lights.filter((l) => fitsLight(p, l));
      if (ok.length) state.light = pick(ok).id;
    }
    if (!locks.prop2) rollProp2();
    rollMoment();
    settle();
    render();
  });
  el.prop2.addEventListener('change', () => { state.prop2 = el.prop2.value; render(); });
  el.moment.addEventListener('change', () => {
    state.moment = el.moment.value;
    // 고른 순간과 안 맞는 구도는 비킨다
    if (!fitsPose(shot(), moment())) state.shot = pick(shotCandidates());
    render();
  });
  el.light.addEventListener('change', () => { state.light = el.light.value; settle(); render(); });
  el.shot.addEventListener('change', () => {
    state.shot = el.shot.value;
    if (!fitsPose(shot(), moment())) {
      const ok = momentList().filter((m) => fitsPose(shot(), m) && fitsLight(m));
      if (ok.length) state.moment = pick(ok).id;
    }
    render();
  });
  el.tone.addEventListener('change', () => { state.tone = el.tone.value; render(); });
  el.outfit.addEventListener('change', () => {
    state.outfit = el.outfit.value;
    if (state.outfit === 'mix') fitCloset(false);
    save('sceneOnly', state.outfit === 'none');
    rollDecor();
    render();
  });
  el.density.addEventListener('change', () => {
    state.density = el.density.value;
    save('density', state.density);
    rollDetails();
    render();
  });
  // 칩을 누르면 그 장식을 켜고 끈다. 순서는 칩 순서를 따른다
  el.palette.addEventListener('change', () => { state.palette = el.palette.value; render(); });
  [['cMain', 'main'], ['cBottom', 'bottom'], ['cOuter', 'outer'], ['cShoes', 'shoes'], ['cHat', 'hat']].forEach(([f, key]) => {
    el[f].addEventListener('change', () => {
      state.c[key] = el[f].value || null;
      fitCloset(false, key);
      render();
    });
  });
  el.sex.addEventListener('change', () => {
    state.sex = el.sex.value;
    save('sex', state.sex);
    // 화보의 완성된 옷이 이 성별에 안 맞으면 맞는 것으로 바꾼다
    const o = state.outfit && state.outfit !== 'none' && state.outfit !== 'mix' ? byId(D.outfits, state.outfit) : null;
    if (o && !sexOk(o)) {
      locks.outfit = false;
      state.outfit = pick(outfitCandidates());
      rollDecor();
    }
    if (closetActive()) fitCloset(false);
    fitAcc();
    render();
  });
  el.decorChips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-decor]');
    if (!b) return;
    const t = b.dataset.decor;
    if (closetActive()) {
      // 켜져 있으면 끄고, 아니면 켠다 — 같은 부위는 앞의 것을 바꾸고, 넷이 차면 가장 먼저 켠 것을 뺀다
      const x = D.accessories.find((e) => e.t === t);
      if (state.acc.includes(x.id)) state.acc = state.acc.filter((id) => id !== x.id);
      else {
        state.acc = state.acc.filter((id) => accById(id).g !== x.g);
        if (state.acc.length >= ACC_N) state.acc.shift();
        state.acc.push(x.id);
      }
      render();
      return;
    }
    const on = state.decor.includes(t) ? state.decor.filter((x) => x !== t) : [...state.decor, t];
    state.decor = decorOptions().filter((x) => on.includes(x));
    render();
  });
  el.emphasis.addEventListener('change', () => {
    state.emphasis = el.emphasis.checked;
    save('emphasis', state.emphasis);
    renderCard();
  });

  document.querySelectorAll('[data-roll]').forEach((b) => {
    b.addEventListener('click', () => {
      const f = b.dataset.roll;
      if (f === 'scene') locks.scene = false;
      roll(f);
      render();
    });
  });

  // 순간이나 빛을 잠그면 장면도 같이 잠긴다(소품이 있으면 순간은 소품을 잠근다). 장면을 풀면 둘도 풀린다.
  document.querySelectorAll('[data-lock]').forEach((b) => {
    b.addEventListener('click', () => {
      const f = b.dataset.lock;
      locks[f] = !locks[f];
      if (f === 'moment' && locks.moment) {
        if (prop()) locks.prop = true; else locks.scene = true;
      }
      if (f === 'light' && locks.light) locks.scene = true;
      if (f === 'prop2' && locks.prop2) locks.prop = true;
      if (f === 'prop' && !locks.prop) { locks.prop2 = false; if (prop()) locks.moment = false; }
      if (f === 'scene' && !locks.scene) { locks.moment = false; locks.light = false; }
      renderSelects();
    });
  });

  // 엽서가 스탠드에서 빠져나와 뒤집힌다
  function pull() {
    el.card.classList.remove('pull');
    void el.card.offsetWidth;
    el.card.classList.add('pull');
  }

  function print() {
    shuffleAll();
    render();
    pull();
  }
  $('#shuffleBtn').addEventListener('click', print);
  $('#againBtn').addEventListener('click', print);

  el.copy.addEventListener('click', async () => {
    const text = el.prompt.textContent;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    el.copy.textContent = '복사됨';
  });

  $('#saveBtn').addEventListener('click', () => {
    const blob = new Blob([el.prompt.textContent], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `perennial-${pad(state.count)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // 왼쪽 절취선: 왼쪽으로 끌어 떼거나 누르면 다음 엽서가 나온다
  const tear = $('#tearHandle');
  let startX = 0, delta = 0, tearing = false;
  tear.addEventListener('pointerdown', (e) => {
    tearing = true;
    startX = e.clientX;
    delta = 0;
    tear.setPointerCapture(e.pointerId);
    el.card.classList.add('tearing');
  });
  tear.addEventListener('pointermove', (e) => {
    if (!tearing) return;
    delta = Math.max(0, startX - e.clientX);
    el.card.style.setProperty('--tear', Math.min(delta, 90) + 'px');
  });
  function finishTear(e) {
    if (!tearing) return;
    tearing = false;
    try { tear.releasePointerCapture(e.pointerId); } catch (_) {}
    el.card.classList.remove('tearing');
    el.card.style.removeProperty('--tear');
    if (delta >= 56 || delta < 4) print();
  }
  tear.addEventListener('pointerup', finishTear);
  tear.addEventListener('pointercancel', finishTear);
  tear.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); print(); }
  });

  // 사용법
  const help = $('#helpModal');
  $('#helpBtn').addEventListener('click', () => help.showModal());
  $('#closeHelp').addEventListener('click', () => help.close());
  help.addEventListener('click', (e) => { if (e.target === help) help.close(); });

  // 검증용: 콘솔에서 데이터 오류를 바로 볼 수 있게
  function validate() {
    const bad = [];
    const seen = (list, what) => {
      const ids = new Set();
      list.forEach((x) => { if (ids.has(x.id)) bad.push(`${what} id 중복: ${x.id}`); ids.add(x.id); });
    };
    seen(D.scenes, '장면'); seen(D.props, '소품'); seen(D.outfits, '옷'); seen(D.shots, '구도'); seen(D.tones, '톤');
    D.props.forEach((p) => {
      seen(p.acts, `${p.id} 동작`);
      p.acts.forEach((a) => (a.face || []).forEach((f) => { if (!FACE_OK.includes(f)) bad.push(`${p.id}.${a.id}: 감정 표현 ${f}`); }));
      (p.pairs || []).forEach((id) => {
        const q = byId(D.props, id);
        if (!q) bad.push(`${p.id}: 없는 짝 ${id}`);
        else if (!q.near && !p.near) bad.push(`${p.id} ↔ ${id}: 둘 다 near 가 없어 곁에 놓일 수 없음`);
      });
      if (!D.scenes.some((s) => s.props.includes(p.id))) bad.push(`어느 장면에도 없는 소품: ${p.id}`);
    });
    D.scenes.forEach((s) => {
      if (!byId(D.seasons, s.season)) bad.push(`${s.id}: 없는 계절 ${s.season}`);
      seen(s.moments, `${s.id} 순간`); seen(s.lights, `${s.id} 빛`);
      s.moments.forEach((m) => (m.face || []).forEach((f) => { if (!FACE_OK.includes(f)) bad.push(`${s.id}.${m.id}: 감정 표현 ${f}`); }));
      s.shots.forEach((x) => { if (!byId(D.shots, x)) bad.push(`${s.id}: 없는 구도 ${x}`); });
      s.tones.forEach((x) => { if (!byId(D.tones, x)) bad.push(`${s.id}: 없는 톤 ${x}`); });
      s.outfits.forEach((x) => { if (!byId(D.outfits, x)) bad.push(`${s.id}: 없는 옷 ${x}`); });
      s.props.forEach((x) => { if (!byId(D.props, x)) bad.push(`${s.id}: 없는 소품 ${x}`); });
      ['f', 'm', 'u'].forEach((sx) => {
        const ok = (x) => x && (sx === 'u' ? !x.sex : !x.sex || x.sex === sx);
        if (!s.outfits.some((id) => ok(byId(D.outfits, id)))) bad.push(`${s.id} ${sx}: 맞는 완성된 옷이 없음`);
      });
      s.lights.forEach((l) => {
        const n = s.details.filter((x) => typeof x === 'string' || fitsLight(x, l)).length;
        if (n < DENSITY.high) bad.push(`${s.id}: 빛 ${l.id} 에서 details가 ${DENSITY.high}개보다 적음`);
      });
      s.lights.forEach((l) => {
        if (!s.moments.some((m) => fitsLight(m, l))) bad.push(`${s.id}: 빛 ${l.id} 에 맞는 순간이 없음`);
        if (!s.props.some((id) => fitsLight(byId(D.props, id), l))) bad.push(`${s.id}: 빛 ${l.id} 에 맞는 메인 소품이 없음`);
      });
    });
    D.outfits.forEach((o) => {
      if (!o.ward && !D.scenes.some((s) => s.outfits.includes(o.id))) bad.push(`어느 장면에도 없는 옷: ${o.id}`);
      if (!o.decor || o.decor.length < 3) bad.push(`${o.id}: decor가 3개보다 적음`);
      if (o.sex && !['f', 'm'].includes(o.sex)) bad.push(`${o.id}: 성별 표시가 f · m 이 아님`);
      (o.decor || []).forEach((t) => { if (!D.decorKo[t]) bad.push(`${o.id}: 한국어 이름 없는 장식 ${t}`); });
    });
    Object.entries(D.closet).forEach(([sid, c]) => {
      const ids = new Set();
      ['tops', 'bottoms', 'dresses', 'swim', 'outers', 'shoes', 'hats'].forEach((k) => (c[k] || []).forEach((x) => {
        if (ids.has(x.id)) bad.push(`옷장 ${sid}: id 중복 ${x.id}`);
        ids.add(x.id);
        if (!x.k || !x.t) bad.push(`옷장 ${sid}: 이름 · 문구 빠짐 ${x.id}`);
      }));
      if (c.tops.some((t) => t.crop) && !c.bottoms.some((b) => b.hw)) bad.push(`옷장 ${sid}: 크롭 상의에 맞는 하이웨이스트 하의가 없음`);
      if (c.swim && !c.shoes.some((x) => x.beach)) bad.push(`옷장 ${sid}: 수영복에 맞는 신발이 없음`);
      ['f', 'm', 'u'].forEach((sx) => {
        const ok = (x) => (sx === 'u' ? !x.sex : !x.sex || x.sex === sx);
        ['tops', 'bottoms', 'shoes', 'outers'].forEach((k) => { if (!c[k].some(ok)) bad.push(`옷장 ${sid} ${sx}: ${k} 없음`); });
        if (c.swim && !c.swim.some(ok)) bad.push(`옷장 ${sid} ${sx}: 수영복 없음`);
      });
    });
    {
      const ids = new Set();
      const texts = new Set();
      D.accessories.forEach((x) => {
        if (ids.has(x.id)) bad.push(`소품 id 중복: ${x.id}`);
        if (texts.has(x.t)) bad.push(`소품 문구 중복: ${x.t}`);
        ids.add(x.id);
        texts.add(x.t);
        if (!x.g) bad.push(`소품 부위 없음: ${x.id}`);
      });
      D.seasons.forEach((se) => ['f', 'm', 'u'].forEach((sx) => {
        const ok = (x) => (sx === 'u' ? !x.sex : !x.sex || x.sex === sx);
        const gs = new Set(D.accessories.filter((x) => ok(x) && !x.swimOnly && (!x.seasons || x.seasons.includes(se.id))).map((x) => x.g));
        if (gs.size < ACC_N) bad.push(`소품 ${se.id} ${sx}: 부위가 ${ACC_N}가지보다 적음`);
      }));
    }
    D.seasons.forEach((x) => {
      if (!x.palettes || x.palettes.length < 2) bad.push(`${x.id}: palettes가 2개보다 적음`);
      if (!x.motifs || !x.motifs.length) bad.push(`${x.id}: motifs 없음`);
      (x.motifs || []).forEach((t) => { if (!D.decorKo[t]) bad.push(`${x.id}: 한국어 이름 없는 무늬 ${t}`); });
    });
    bad.forEach((msg) => console.warn('[Perennial]', msg));
    return bad;
  }
  validate();

  // 자가 점검에서 쓰는 창구
  window.__perennial = { state, locks, print, buildPrompt, validate, enterScene, enterWardSeason, render, roll, settle, cMain, cBottom, cOuter, cShoes, cHat, bottomsFor, fitCloset, mainPool, mixing, accPool, accById };

  // 시작: 옷장 탭으로 저장돼 있어도 장면 · 옷장 계절을 먼저 정한 뒤 옷장을 연다
  //(옷장 계절이 없을 때 옷장 조각 · 배색을 읽으면 오류가 나 화면이 빈 채로 멈췄다)
  const startMode = state.mode;
  state.mode = 'scene';
  enterScene(pick(D.scenes).id);
  state.wardSeason = scene().season;
  state.mode = startMode;
  if (state.mode === 'wardrobe') enterWardSeason(state.wardSeason);
  state.count += 1;
  save('count', state.count);
  render();
})();
