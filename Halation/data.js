// Prompt Archive : Halation - scene data and compatibility rules
// Plain everyday colors. `colorSwatch` gives the preview chip its CSS color,
// because a prompt word like "light blue" is not a CSS color name.
const outfitColors=["white","navy","black","gray","beige","cream","light blue","khaki","brown","pale pink"];
const colorSwatch={white:"#ffffff",navy:"#27375c",black:"#22211f",gray:"#9a9c9f",beige:"#d9c7a6",cream:"#f4ebd2","light blue":"#a9cdea",khaki:"#a79a6b",brown:"#7a553a","pale pink":"#f1cdd3"};

const seasons=["spring","summer","autumn","winter"];

// A scene is a place in one season. `moments` pair a framing with what the body is
// doing, so the two never disagree. `light` lists what a RANDOM roll may pick;
// `dress` weights casual against uniform when OUTFIT is left on Random.
// `shoes` replaces the wardrobe's shoes where the floor decides (indoors, in water).
const styles = {
  sakura:{season:"spring",icon:"🌸",label:"CHERRY BLOSSOM ROAD",name:"cherry blossoms",
    place:["tree-lined street","petals on the ground","low stone wall","residential street","canal railing","utility pole","road sign","narrow sidewalk"],
    moments:["cowboy shot, walking, looking back","upper body, from side, looking up","full body, from behind, walking away","upper body, reaching out a hand, looking up","full body, standing still, head tilt","cowboy shot, from below, arms behind back"],
    air:["falling petals","petals in the wind","soft breeze","pink blur in the foreground","scattered petals","petals on the water"],
    light:["morning","noon","dappled","overcast","golden","shower","sunshower"],dress:["uniform","uniform","casual"]},
  classroom:{season:"spring",indoor:true,icon:"🪟",label:"CLASSROOM WINDOW",name:"classroom",
    place:["school desk","school chair","window","curtains","blackboard","open window","wall clock","bulletin board"],
    moments:["upper body, sitting, chin rest, looking outside","upper body, from side, leaning on the desk","cowboy shot, standing by the window, looking back","upper body, head resting on folded arms, looking sideways","full body, sitting on the desk, legs dangling","upper body, from above, looking up"],
    air:["billowing curtains","dust motes in the light","chalk writing on the board","empty seats","breeze through the window","shadow of the window frame"],
    light:["morning","noon","golden","overcast","shower","thunder"],dress:["uniform"],shoes:["uwabaki"]},
  field:{season:"spring",icon:"🌼",label:"RIVERBANK",name:"riverbank",
    place:["grassy slope","rapeseed blossoms","river","distant bridge","dirt path","clover","dandelion","distant town"],
    moments:["full body, sitting on the slope, knees drawn up","upper body, lying in the grass, from above","cowboy shot, walking along the path, looking afar","full body, from behind, arms spread wide","upper body, crouching, looking down","full body, lying on one side, propped on an elbow"],
    air:["dandelion fluff","butterfly","swaying grass","soft breeze","yellow blur in the foreground","cloud shadows on the slope"],
    light:["morning","noon","golden","overcast","sunshower","shower"],dress:["casual","casual","uniform"]},
  station:{season:"spring",icon:"🚃",label:"COUNTRY STATION",name:"train station",
    place:["train platform","station bench","station sign","railroad tracks","wooden station building","platform roof","timetable board","distant hills"],
    moments:["full body, sitting on the bench, legs stretched out","upper body, from side, waiting, looking afar","cowboy shot, standing behind the platform line, looking back","full body, from behind, facing the tracks","upper body, leaning against a pillar","cowboy shot, waving, facing the camera"],
    air:["soft breeze","drifting petals","empty platform","overhead wires","weeds between the tracks","train far down the line"],
    light:["morning","noon","golden","overcast","afterrain","shower","thunder"],dress:["uniform","casual"]},

  seaside:{season:"summer",icon:"🌊",label:"BREAKWATER",name:"ocean",
    place:["breakwater","seaside road","guardrail","horizon","cumulonimbus","concrete steps to the water","tetrapods","distant lighthouse"],
    moments:["full body, sitting on the breakwater, legs dangling","upper body, from side, looking at the horizon","full body, from behind, walking along the wall","cowboy shot, turning around","upper body, from below, hand shading the eyes","full body, standing on the wall, arms out for balance"],
    air:["sea breeze","seagull","sparkling water","contrail","clear water","white wave crests"],
    light:["noon","noon","morning","golden","bluehour","sunshower"],dress:["casual","casual","uniform"]},
  busstop:{season:"summer",icon:"🚏",label:"COUNTRY BUS STOP",name:"bus stop",
    place:["rural road","tin roof shelter","old bench","rice paddies","bus stop sign","utility poles","distant mountains","faded signboard"],
    moments:["full body, sitting on the bench, leaning back","upper body, leaning out of the shade, looking up","cowboy shot, standing in the shade, looking down the road","upper body, from side, head tilted back","wide shot, small figure, sitting alone","upper body, sitting, elbows on knees, looking up"],
    air:["towering clouds","wind through the rice","shade of the shelter","dragonfly","contrail","swaying green rice"],
    light:["noon","noon","dappled","golden","afterrain","shower","thunder","sunshower"],dress:["uniform","casual"]},
  stream:{season:"summer",icon:"🏞️",label:"MOUNTAIN STREAM",name:"mountain stream",
    place:["shallow water","mossy rocks","forest","river stones","small waterfall","overhanging branches","clear water","fallen log"],
    moments:["full body, wading, ankle deep in water","upper body, crouching on a rock, looking into the water","cowboy shot, splashing water","full body, sitting on a rock, feet in the water","upper body, from above, looking up","full body, from behind, stepping across the stones"],
    air:["water splash","ripples","water droplets","light reflecting off the water","small fish","green blur in the foreground"],
    light:["noon","dappled","morning"],dress:["casual"],shoes:["barefoot","barefoot","sandals"]},
  festival:{season:"summer",icon:"🏮",label:"SUMMER FESTIVAL",name:"summer festival",
    place:["food stalls","paper lanterns","shrine path","crowd in the background","string lights","stone steps","distant torii","goldfish scooping stall"],
    moments:["upper body, looking back","cowboy shot, walking between the stalls","upper body, from side, looking up at the sky","full body, sitting on the stone steps","upper body, leaning in, pointing off frame","cowboy shot, from behind, turning the head"],
    air:["lantern glow","fireworks in the sky","smoke from the stalls","warm light on the face","blurred lights","fireflies"],
    light:["night","bluehour","shower"],dress:["casual"],onepiece:["yukata"]},

  rooftop:{season:"autumn",icon:"🏫",label:"SCHOOL ROOFTOP",name:"school rooftop",
    place:["chain-link fence","rooftop door","water tank","concrete floor","city skyline","handrail","antenna","distant school field"],
    moments:["upper body, leaning back on the fence","full body, sitting on the floor, legs out","cowboy shot, from behind, gripping the fence, looking at the town","upper body, from below, looking down","full body, lying on the floor, from above","cowboy shot, from side, looking afar"],
    air:["wind","drifting clouds","fluttering clothes","long fence shadow","dry leaves on the floor","crow in the distance"],
    light:["golden","noon","bluehour","overcast","shower"],dress:["uniform"]},
  ginkgo:{season:"autumn",icon:"🍂",label:"GINKGO AVENUE",name:"ginkgo trees",
    place:["tree-lined avenue","carpet of fallen leaves","park bench","street lamp","iron fence","paved path","distant pedestrians","bicycle rack"],
    moments:["cowboy shot, walking, kicking up leaves","upper body, looking up, from below","full body, crouching, gathering leaves","upper body, from side, looking up at the branches","full body, from behind, strolling","full body, sitting on the bench, ankles crossed"],
    air:["falling leaves","leaves in the wind","yellow blur in the foreground","leaf on the head","cool breeze","leaves on the bench"],
    light:["golden","noon","overcast","dappled","morning","shower"],dress:["casual","casual","uniform"]},
  library:{season:"autumn",indoor:true,icon:"📚",label:"LIBRARY",name:"library",
    place:["bookshelves","reading table","stacked books","window","step stool","desk lamp","book cart","wooden floor"],
    moments:["upper body, reading, looking down","cowboy shot, reaching for a high shelf","upper body, from side, head propped on a hand","full body, sitting on the floor between shelves","upper body, peeking over a book","upper body, dozing at the table, head on arms"],
    air:["dust motes in the light","quiet empty room","open book","bookmark ribbon","shadow of the shelves","window light on the pages"],
    light:["golden","noon","overcast","morning","shower","thunder"],dress:["uniform","uniform","casual"],shoes:["uwabaki","loafers"]},
  crossing:{season:"autumn",icon:"🚦",label:"RAILROAD CROSSING",name:"railroad crossing",
    place:["crossing gate","power lines","residential street","warning lights","utility poles","vending machine","traffic mirror","narrow road"],
    moments:["full body, from behind, waiting at the gate","cowboy shot, looking back, waving","upper body, from side, looking up at the sky","full body, walking home","upper body, turning around","wide shot, small figure, silhouette"],
    air:["passing train","silhouetted wires","flock of birds","cool breeze","first streetlight","long shadow on the road"],
    light:["golden","bluehour","overcast","afterrain","shower","thunder"],dress:["uniform","casual"]},

  snow:{season:"winter",icon:"❄️",label:"SNOWY LANE",name:"snow",
    place:["snowy street","snow covered roofs","streetlight","footprints in the snow","low wall","bare trees","mailbox","narrow lane"],
    moments:["cowboy shot, looking up, catching snowflakes","upper body, breathing on the hands","full body, walking, looking back","upper body, from side, chin tucked into the collar","full body, crouching, touching the snow","cowboy shot, from behind, turning the head"],
    air:["snowing","visible breath","snowflakes in the foreground","snow on the shoulders","quiet street","red cheeks"],
    light:["overcast","bluehour","night","morning","snowy"],dress:["uniform","casual"]},
  konbini:{season:"winter",icon:"🏪",label:"CONVENIENCE STORE NIGHT",name:"convenience store",
    place:["storefront","glass doors","vending machine","parking lot","bicycle stand","glowing shop sign","trash bins","wet asphalt"],
    moments:["full body, crouching by the door","upper body, leaning on the window","cowboy shot, standing under the light, looking away","upper body, from side, blowing on the food","full body, sitting on the curb","upper body, looking up"],
    air:["visible breath","fluorescent light","light spilling through the glass","cold air","quiet night street","reflection in the glass"],
    light:["night","bluehour","snowy","shower"],dress:["casual","uniform"]},
  kotatsu:{season:"winter",indoor:true,icon:"🍊",label:"KOTATSU ROOM",name:"kotatsu",
    place:["tatami","low table","floor cushion","sliding door","window","wall calendar","bookshelf","space heater"],
    moments:["upper body, slumped over the table, cheek on the tabletop","upper body, from above, looking up","cowboy shot, sitting, stretching the arms","upper body, from side, chin in hand","upper body, chin on the table, sleepy","upper body, leaning back on the hands"],
    air:["bowl of mandarin oranges","steam","fogged window","snow outside the window","peel on the table","warm indoor light"],
    light:["overcast","night","morning","golden","snowy","outage"],dress:["casual"],shoes:["socks"],
    // Nobody keeps a coat on under the blanket.
    wear:{casual:{tops:["hanten, sweater","sweatshirt","turtleneck sweater","oversized hoodie","knit cardigan, long sleeve shirt","sweater"],extras:["blanket over the lap","sleeves past the wrists","loose collar","hair tie on the wrist"]},
          uniform:{tops:["school uniform, cardigan, collared shirt","school uniform, sweater, collared shirt","school uniform, sweater vest, long sleeves","school uniform, collared shirt, long sleeves"],neck:["necktie loosened","collar unbuttoned"],extras:["blanket over the lap","sleeves past the wrists","wristwatch","hair tie on the wrist"]}}},
  dawn:{season:"winter",icon:"🌄",label:"HILLTOP AT DAWN",name:"hilltop",
    place:["town below","guardrail","stairs up the hill","observation deck","bench","bare trees","distant sea","rooftops"],
    moments:["full body, from behind, looking over the town","upper body, from side, looking afar","cowboy shot, turning around","upper body, shoulders hunched against the cold","full body, sitting on the bench, huddled","wide shot, small figure, silhouette"],
    air:["visible breath","morning star","frost on the railing","thin mist","lights of the town","cold air"],
    light:["dawn","bluehour","morning","snowy"],dress:["casual","uniform"]},
  // Seasonal outings.
  hanami:{season:"spring",icon:"🌸",label:"BLOSSOM PICNIC",name:"cherry blossom viewing",
    place:["picnic blanket","cherry blossom trees","bento box","paper cups","petals on the blanket","park lawn","other picnics in the distance","paper lanterns in the branches"],
    moments:["full body, sitting on the picnic blanket, legs to the side","upper body, looking up at the blossoms","upper body, eating from a bento","full body, lying on the blanket, from above","cowboy shot, standing under the trees, reaching up to a branch","upper body, catching a falling petal"],
    air:["falling petals","petals in the wind","pink canopy overhead","soft breeze","petals floating in a cup","dappled pink shade"],
    light:["noon","dappled","golden","bluehour","night"],dress:["casual","casual","uniform"]},
  hanabi:{season:"summer",icon:"🎆",label:"FIREWORKS NIGHT",name:"fireworks",
    place:["riverbank","night sky","fireworks over the river","crowd on the bank","footbridge","reflection on the river","stalls in the distance","grass slope"],
    moments:["full body, from behind, looking up at the fireworks","upper body, from side, face lit by fireworks","cowboy shot, sitting on the riverbank, looking up","upper body, looking back, fireworks behind","full body, standing on the footbridge, looking up","wide shot, small figure, sky full of fireworks"],
    air:["colorful light on the face","smoke drifting after the burst","sparks falling","crowd murmur","warm night air","distant drums"],
    light:["night","night","bluehour"],dress:["casual"],onepiece:["yukata"]},
  // EVERYDAY — errands and home. Most belong to more than one season, so they
  // carry `seasons` instead of `season`; each print picks one of them.
  tatamiroom:{season:"summer",indoor:true,home:true,icon:"🎐",label:"SUMMER TATAMI ROOM",name:"japanese room",
    place:["tatami","electric fan","low table","sliding door open to the garden","mosquito coil","paper screen","garden outside","floor cushion"],
    moments:["upper body, sitting in front of the electric fan, eyes closed","upper body, face close to the fan, mouth open","full body, lying on the tatami, arms spread wide","cowboy shot, sitting at the low table, doing homework","upper body, from above, lying on the floor","full body, sitting by the open door, feet outside"],
    air:["breeze from the fan","fluttering paper","cicada outside","smoke curling from the mosquito coil","green garden light","afternoon stillness"],
    light:["noon","dappled","golden","shower","thunder","sunshower"],dress:["casual","casual","uniform"],shoes:["socks"]},
  cornershop:{season:"summer",icon:"🍦",label:"CORNER SHOP",name:"small shop",
    place:["old corner shop","ice cream freezer","wooden bench out front","shop awning","glass sliding door","snack shelves","faded signboard","potted plants by the door"],
    moments:["full body, sitting out front, legs swinging","upper body, from above, looking up","cowboy shot, leaning into the freezer, looking down","upper body, from side, eating","full body, crouching in the shade of the awning","cowboy shot, standing by the door, looking back"],
    air:["shade of the awning","cicada on the wall","condensation on the glass","sunbeam through the door","wind chime","sun-bleached posters"],
    light:["noon","noon","dappled","golden","sunshower","shower"],dress:["casual","casual","uniform"]},
  market:{seasons:["spring","summer","autumn","winter"],indoor:true,icon:"🛒",label:"NEIGHBORHOOD MARKET",name:"supermarket",
    place:["supermarket aisle","shelves","price tags","produce section","refrigerated case","checkout counter","shopping cart","stacked fruit"],
    moments:["cowboy shot, standing in the aisle, looking at the shelves","upper body, from side, holding up two items, comparing","full body, crouching, looking at the bottom shelf","cowboy shot, pushing a shopping cart","upper body, looking back","cowboy shot, reaching for a high shelf"],
    air:["bright indoor light","quiet afternoon","neat rows of goods","cold air from the freezer","reflection on the floor","colorful packaging"],
    light:["noon","golden","night","overcast","shower"],dress:["casual","casual","uniform"]},
  shoppingst:{seasons:["spring","summer","autumn","winter"],icon:"🛍️",label:"SHOPPING STREET",name:"shopping street",
    place:["shopping street","storefronts","shop awnings","parked bicycles","power lines","crosswalk","street lamps","hanging shop signs"],
    moments:["cowboy shot, walking home, looking ahead","full body, from behind, walking down the street","upper body, looking back","full body, waiting at the crosswalk","cowboy shot, peeking into a shop window","wide shot, small figure, walking under the shop lights"],
    air:["warm shop lights","bicycle bell","evening crowd in the distance","long shadows on the road","steam from a shop","fluttering shop banner"],
    light:["golden","noon","bluehour","overcast","shower","sunshower","snowy"],dress:["casual","casual","uniform"]},
  kitchen:{seasons:["spring","summer","autumn","winter"],indoor:true,home:true,icon:"🍳",label:"HOME KITCHEN",name:"kitchen",
    place:["kitchen counter","sink","stove","cutting board","window over the sink","refrigerator","dish rack","small table"],
    moments:["cowboy shot, standing at the stove, from side","upper body, tasting from a small plate","upper body, opening the refrigerator, looking inside","cowboy shot, washing dishes at the sink","upper body, from above, cutting vegetables","upper body, leaning on the counter, looking out the window"],
    air:["steam from the pot","morning light on the counter","herbs on the windowsill","clean dishes drying","quiet house","sunlight on the floor"],
    light:["morning","noon","golden","night","overcast","shower","thunder","outage"],dress:["casual"],shoes:["slippers","socks"],extras:["apron"],standing:true},
  veranda:{seasons:["spring","summer","autumn"],home:true,icon:"🧺",label:"LAUNDRY BALCONY",name:"balcony",
    place:["laundry pole","hanging laundry","white sheets","clothespins","balcony railing","apartment buildings","potted plants","rooftops below"],
    moments:["full body, hanging laundry, reaching up","upper body, from side, sheets blowing in the wind","cowboy shot, leaning on the railing, looking at the town","upper body, folding a towel","full body, from behind, standing among the hanging sheets","upper body, sitting on the step, looking up"],
    air:["sheets blowing in the wind","sunlight through the fabric","clothespins on the line","breeze","distant train","clear morning air"],
    light:["morning","noon","golden","overcast","sunshower"],dress:["casual"],shoes:["sandals"]},
  room:{seasons:["spring","summer","autumn","winter"],indoor:true,home:true,icon:"🛏️",label:"MY ROOM",name:"bedroom",
    place:["bed","desk","window","cushion","bookshelf","plush toy","curtains","small rug"],
    moments:["upper body, lying on the bed, from above","full body, sitting on the floor, back against the bed","upper body, hugging a cushion","cowboy shot, sitting at the desk, looking back","upper body, lying on stomach, propped on elbows","upper body, sitting by the window, knees up"],
    air:["curtains moving in the breeze","clutter on the desk","sunlight on the sheets","quiet afternoon","flip phone on the bed","dust motes in the light"],
    light:["morning","noon","golden","night","overcast","shower","thunder","outage","snowy"],dress:["casual"],shoes:["socks"]},
  bus:{seasons:["spring","summer","autumn","winter"],indoor:true,icon:"🚌",label:"BUS RIDE",name:"bus interior",
    place:["bus seat","bus window","hanging straps","stop button","handrail","scenery passing outside","empty seats","rear seats"],
    moments:["upper body, sitting by the window, looking outside","upper body, dozing against the window","cowboy shot, standing, holding a strap","upper body, from side, wiping the fogged window","upper body, sitting, legs together, looking ahead","upper body, from above, looking up"],
    air:["light moving across the seats","passing scenery","quiet ride","reflection in the window","condensation on the glass","late afternoon sun"],
    light:["morning","noon","golden","bluehour","night","shower","snowy"],dress:["uniform","casual"]}
};

// Light and time of day. Indoors the same hour arrives through a window.
const lights={
  morning:{out:["morning","pale blue sky","soft morning light"],in:["morning","soft light from the window","pale room"]},
  noon:{out:["day","blue sky","bright sunlight"],in:["day","sunlight through the window","bright room"]},
  dappled:{out:["dappled sunlight","tree shade","sunbeam"],in:["dappled sunlight","leaf shadows on the wall","sunbeam"]},
  golden:{out:["sunset","orange sky","backlighting","long shadows"],in:["sunset","orange light through the window","long shadows"]},
  bluehour:{out:["twilight","gradient sky","evening"],in:["twilight","dim room","evening"]},
  overcast:{out:["overcast","cloudy sky","soft diffused light"],in:["overcast","grey light from the window","soft diffused light"]},
  afterrain:{out:["after rain","puddle","wet ground","reflection"],in:["after rain","raindrops on the window","wet glass"]},
  night:{out:["night","night sky","lamplight"],in:["night","lamplight","dark window"]},
  dawn:{out:["sunrise","gradient sky","first light"],in:["sunrise","first light through the window","dim room"]},
  // WEATHER — not every day is clear. `wet` weather outdoors takes over the
  // moment (nobody lies in the grass in a downpour) and the props on offer.
  // `seasons` is when it can happen; `moments` replace the scene's own.
  shower:{wet:true,seasons:["spring","summer","autumn"],out:["sudden rain","heavy rain","wet ground","wet clothes"],in:["rain","rain on the window","dim light"],
    moments:{out:["full body, running, jacket held over the head","cowboy shot, sheltering under the eaves, looking up at the rain","upper body, wiping rain off the face","full body, walking fast, bag held over the head","full body, walking under an umbrella"],
             in:["upper body, from side, looking out at the rain","cowboy shot, standing by the window, watching the rain"]}},
  thunder:{wet:true,seasons:["spring","summer","autumn"],out:["storm","lightning","dark clouds","heavy rain"],in:["lightning","flash of lightning outside the window","rain on the window","dark room"],
    moments:{out:["full body, running for shelter, jacket held over the head","cowboy shot, sheltering under the eaves, flinching"],
             in:["upper body, flinching, covering ears","upper body, sitting by the window, watching the lightning"]}},
  outage:{indoorOnly:true,in:["dark room","candlelight","flash of lightning outside the window","rain on the window"],
    moments:{in:["upper body, lighting a candle","upper body, sitting in the dark, face lit by candlelight","cowboy shot, looking around the dark room"]}},
  snowy:{seasons:["winter"],out:["heavy snow","snowing","white sky"],in:["snowing outside the window","soft white light"]},
  sunshower:{seasons:["spring","summer","autumn"],out:["sun shower","sunlight","sparkling raindrops"],in:["sunlight","raindrops on the window"]}
};

// The clear, cool look of a fine summer day: hard blue against hard white, air
// that moves, shadows with an edge. It comes with summer light that really is
// clear, so rain, cloud, dusk and night go without it. `dropLens` names the
// lens effects that would fog it over.
const tones={
  summer:{lights:["noon","morning","dappled"],
    tags:["vivid blue sky","white clouds","clear air","crisp shadows","wind","fluttering clothes","sparkle","light rays","high contrast"],
    dropLens:["soft focus","overexposure","light leaks"]}
};

// TWO PEOPLE — each pair has a count tag for the base prompt and a word for
// each character prompt (NovelAI puts numbers only in the base prompt).
const pairs={
  gg:{count:"2girls",a:"girl",b:"girl"},
  bg:{count:"1boy, 1girl",a:"boy",b:"girl"},
  bb:{count:"2boys",a:"boy",b:"boy"}
};
// What two people are doing together. `base` goes in the base prompt, `a` and
// `b` in each character's prompt. Friends, siblings, and the first awkward
// stirrings of something more — nothing further. `scenes`, `weather`, `where`
// (in / out) and `seasons` say where a moment can happen; `dry` keeps it out of
// the rain; `prop` is a thing the moment already puts in someone's hand.
const duoMoments=[
  {base:"cowboy shot, walking, side-by-side",a:"looking at another",b:"looking ahead",where:"out",dry:true},
  {base:"full body, sitting, side-by-side",a:"looking at another",b:"looking up",dry:true},
  {base:"upper body, side-by-side",a:"mutual#shared earphones, holding {player}",b:"mutual#shared earphones, looking at another",ears:true},
  {base:"full body, from above, lying, on back, side-by-side",a:"mutual#shared earphones, holding {player}",b:"mutual#shared earphones, closed eyes",ears:true,scenes:["room","tatamiroom","field","hanami","rooftop"]},
  {base:"full body, sitting, back-to-back",a:"headphones, closed eyes",b:"headphones, looking up",ears:true,scenes:["room","tatamiroom","library","rooftop","field","hanami","stream"]},
  {base:"full body, shared umbrella, walking, side-by-side",a:"holding umbrella",b:"looking at another",where:"out",weather:["shower","thunder","afterrain","overcast","sunshower"],prop:"umbrella"},
  {base:"full body, running, sharing a jacket over their heads",a:"mutual#running",b:"mutual#running, laughing",where:"out",weather:["shower","thunder"]},
  {base:"cowboy shot, sheltering under the eaves, standing, side-by-side, looking up at the rain",a:"wet clothes",b:"wet clothes, looking at another",where:"out",weather:["shower","thunder"]},
  {base:"upper body, sitting close together, candlelight",a:"holding candle",b:"looking at another",weather:["outage"]},
  {base:"upper body, side-by-side, by the window",a:"flinching, covering ears",b:"looking at another, smile",where:"in",weather:["thunder"]},
  {base:"cowboy shot, walking, side-by-side, shopping bags",a:"holding grocery bag",b:"holding plastic bag",scenes:["market","shoppingst","konbini"],dry:true},
  {base:"cowboy shot, in the aisle",a:"pushing a shopping cart",b:"holding shopping basket, looking at the shelves",scenes:["market"]},
  {base:"upper body, sitting, side-by-side, on the bus seat",a:"sleeping, head on another's shoulder",b:"looking out the window",scenes:["bus"]},
  {base:"upper body, sitting across the table",a:"writing in a notebook",b:"chin rest, looking at another",scenes:["classroom","library","kotatsu","room","tatamiroom"]},
  {base:"full body, from behind, side-by-side, watching fireworks",a:"",b:"",scenes:["festival","hanabi"],dry:true},
  {base:"upper body, side-by-side, faces lit by fireworks",a:"looking up",b:"looking at another",scenes:["hanabi"],dry:true},
  {base:"cowboy shot, snowball fight",a:"throwing snowball",b:"laughing, shielding face",scenes:["snow"]},
  {base:"upper body, cooking together at the counter",a:"stirring a pot",b:"tasting from a small plate",scenes:["kitchen"]},
  {base:"full body, hanging laundry together",a:"holding one end of a white sheet",b:"holding the other end of the sheet",scenes:["veranda"],dry:true},
  {base:"upper body, side-by-side, eating",a:"holding food",b:"holding food",scenes:["konbini","festival","busstop","rooftop","cornershop","room","veranda"],dry:true},
  {base:"full body, sitting out front of the shop, side-by-side",a:"popsicle, eating",b:"ice cream cone, holding food",scenes:["cornershop"],dry:true},
  {base:"upper body, side-by-side, eating watermelon",a:"watermelon slice, holding food",b:"watermelon slice, holding food, laughing",scenes:["tatamiroom","room","veranda"],dry:true,seasons:["summer"]},
  {base:"upper body, both in front of the electric fan",a:"face close to the fan",b:"laughing, looking at another",scenes:["tatamiroom"]},
  {base:"full body, sitting on the picnic blanket together, sharing a bento",a:"holding chopsticks",b:"looking at another",scenes:["hanami"],dry:true},
  {base:"full body, sitting on the breakwater, side-by-side, legs dangling",a:"looking at another",b:"looking at the horizon",scenes:["seaside"],dry:true},
  {base:"cowboy shot, waiting, side-by-side",a:"looking at another",b:"looking ahead",scenes:["crossing","station","busstop","shoppingst"]}
];
// What the earphones are plugged into: a little behind the times on purpose.
// `{player}` in a tag becomes one of these, once per print.
const musicPlayers=["flip phone","flip phone","cassette player","walkman","cd player","digital media player","ipod"];

// `ears` moments put earphones or headphones on both, so nothing else goes over the ears.
// Hands taken by a duo moment cannot also hold the IN HAND prop.
const duoBusy=/holding|pushing|writing|stirring|tasting|throwing|covering|sharing|running|sleeping|shielding|eating|popsicle|ice cream|watermelon|chopsticks/;

// Something in the air that belongs to the season, for scenes that span several.
const seasonAir={spring:["soft breeze","falling petals"],summer:["cicada","towering clouds"],autumn:["cool breeze","falling leaves"],winter:["visible breath","cold air"]};

// Identity only - Korean labels live in app.js settingTranslations, keyed by these ids.
const customEnvironmentNames=["drizzle","sun shower","strong wind","morning mist","thin fog","light snow","rainbow","crescent moon","full moon","thunderhead"];

// What the film and the lens add. The name of the edition lives here.
const lens=["blurry background","bokeh","lens flare","film grain","light particles","blurry foreground","light leaks","soft focus","chromatic aberration","overexposure"];
const expressions=["smile","light smile","grin","laughing, open mouth","closed eyes, smile","calm expression","faint blush","parted lips"];

// Headwear has places on the head: a hat on the crown, a clip at the side,
// headphones over the ears. `styles` is where a RANDOM roll may hand one out,
// so the shuffle never puts a straw hat in the snow.
const allScenes=Object.keys(styles);
const heroMap = {
  none:{icon:"☆",name:"NO HEADWEAR",tag:null,sub:"nothing on the head",zone:"none",styles:allScenes},
  strawhat:{icon:"👒",name:"STRAW HAT",tag:"straw hat",sub:"woven brim against the sun",zone:"crown",styles:["field","seaside","busstop","stream","veranda","cornershop","hanami","tatamiroom"],seasons:["spring","summer"]},
  cap:{icon:"🧢",name:"BASEBALL CAP",tag:"baseball cap",sub:"cotton cap with a curved brim",zone:"crown",styles:["field","station","seaside","busstop","stream","ginkgo","crossing","shoppingst","veranda","cornershop","hanami"]},
  flowercrown:{icon:"💐",name:"FLOWER WREATH",tag:"head wreath, flower wreath",sub:"woven from what grows nearby",zone:"crown",styles:["field","sakura","hanami"],seasons:["spring","summer"]},
  hairclip:{icon:"✨",name:"HAIRCLIP",tag:"hairclip",sub:"small clip at the side",zone:"side",styles:allScenes},
  ribbon:{icon:"🎀",name:"HAIR RIBBON",tag:"hair ribbon",sub:"plain ribbon, tied once",zone:"back",styles:allScenes},
  headphones:{icon:"🎧",name:"HEADPHONES",tag:"headphones",sub:"over the ears, cord trailing",zone:"ears",styles:["classroom","station","busstop","rooftop","ginkgo","library","crossing","konbini","shoppingst","bus","room"]},
  beanie:{icon:"🧶",name:"BEANIE",tag:"beanie",sub:"knit cap pulled low",zone:"crown",styles:["ginkgo","crossing","snow","konbini","dawn","shoppingst","bus"],seasons:["autumn","winter"]},
  earmuffs:{icon:"⛄",name:"EARMUFFS",tag:"earmuffs",sub:"soft pads against the cold",zone:"ears",styles:["snow","konbini","dawn","shoppingst","bus"],seasons:["winter"]}
};
// One small detail that belongs to the headwear itself. Skipped at Simple.
const heroAccents={
  strawhat:["ribbon on the hat","frayed straw brim"],
  cap:["curved cap brim","faded cap logo"],
  flowercrown:["small white blossoms","trailing stems"],
  beanie:["pom pom on top","folded knit cuff"],
  earmuffs:["fluffy ear pads"]
};

// Things in the hand. Without a `styles` list a prop goes anywhere; with one,
// a RANDOM roll only offers it where it would be found. `lights` is the light a
// RANDOM roll may give it (no umbrella under a clear noon sky), `avoid` the
// moments it cannot be part of (no bicycle while lying in the grass), `drops`
// the extras it replaces (a school bag means no second bag), `clash` the
// headwear it does not go with.
//
// a RANDOM roll only offers it where it would be found. Picking one by hand is
// never restricted, and a Random scene then narrows itself to where the prop fits.
const backPieces={
  none:{tag:null},
  camera:{tag:"holding camera, film camera"},
  earphones:{tag:"earphones, holding {player}",clash:["headphones"]},
  book:{tag:"holding book, paperback",styles:["classroom","field","station","busstop","rooftop","library","kotatsu","room","bus"]},
  notebook:{tag:"holding pencil, open notebook",styles:["classroom","library","kotatsu","room","tatamiroom"]},
  bag:{tag:"school bag, shoulder bag",wet:true,drops:/tote bag|backpack/,styles:["sakura","classroom","station","busstop","ginkgo","crossing","snow","bus","shoppingst"]},
  umbrella:{tag:"holding umbrella, transparent umbrella",wet:true,lights:["afterrain","overcast","bluehour","night","shower","thunder","sunshower"],styles:["sakura","station","busstop","ginkgo","crossing","snow","shoppingst","cornershop"]},
  bicycle:{tag:"bicycle, hands on the handlebars",avoid:/sitting|lying|crouching|leaning|wading|dozing|slumped|reading/,styles:["sakura","field","seaside","busstop","ginkgo","crossing"]},
  can:{tag:"holding can, canned juice",styles:["classroom","station","seaside","busstop","rooftop","crossing","bus","shoppingst","cornershop","hanami"]},
  bread:{tag:"holding food, melon bread",styles:["classroom","field","station","rooftop","market","shoppingst"]},
  dango:{tag:"holding food, dango skewer",styles:["sakura","field","hanami"]},
  bouquet:{tag:"holding bouquet, wildflowers",styles:["sakura","field"]},
  ramune:{tag:"holding bottle, ramune",styles:["seaside","busstop","stream","festival","cornershop","hanabi","tatamiroom"]},
  shavedice:{tag:"shaved ice, holding spoon",styles:["seaside","busstop","festival","cornershop","tatamiroom","hanabi"]},
  fan:{tag:"holding fan, uchiwa",styles:["busstop","stream","festival","cornershop","tatamiroom","hanabi"]},
  sparkler:{tag:"holding fireworks, sparkler",styles:["festival","hanabi"]},
  candyapple:{tag:"holding food, candy apple",styles:["festival","hanabi"]},
  net:{tag:"holding butterfly net",styles:["field","busstop","stream"]},
  sandals:{tag:"holding shoes, sandals",barefoot:true,styles:["seaside","stream"]},
  leaf:{tag:"holding leaf, autumn leaf",styles:["ginkgo","crossing"]},
  sweetpotato:{tag:"holding food, roasted sweet potato, steam",seasons:["autumn","winter"],styles:["ginkgo","crossing","snow","konbini","shoppingst"]},
  bun:{tag:"holding food, steamed bun, steam",seasons:["autumn","winter"],styles:["crossing","snow","konbini","dawn","shoppingst"]},
  hotcan:{tag:"holding can, canned coffee, steam",styles:["snow","konbini","dawn"]},
  mikan:{tag:"holding fruit, mandarin orange",styles:["kotatsu"]},
  mug:{tag:"holding cup, mug, steam",styles:["kotatsu","dawn","kitchen","room"]},
  snowball:{tag:"holding snowball",styles:["snow","dawn"]},
  popsicle:{tag:"popsicle, holding food, eating",seasons:["summer"],styles:["cornershop","busstop","seaside","stream","veranda","shoppingst","tatamiroom","room"]},
  icecream:{tag:"ice cream cone, holding food",seasons:["summer"],styles:["cornershop","seaside","festival","shoppingst","hanabi"]},
  watermelon:{tag:"watermelon slice, holding food, eating",seasons:["summer"],styles:["tatamiroom","room","veranda","stream","busstop","cornershop"]},
  bento:{tag:"bento, holding chopsticks",styles:["hanami","rooftop","classroom"]},
  basket:{tag:"holding shopping basket",styles:["market"]},
  groceries:{tag:"holding grocery bag, green onion sticking out of the bag",wet:true,styles:["market","shoppingst"]},
  plasticbag:{tag:"holding plastic bag",wet:true,styles:["konbini","market","shoppingst","cornershop"]},
  flashlight:{tag:"holding flashlight",lights:["outage"],styles:["room","kitchen","kotatsu"]},
  ladle:{tag:"holding ladle",styles:["kitchen"]},
  laundrybasket:{tag:"holding laundry basket",styles:["veranda"]}
};

// Wardrobes by season. Nothing here is dressed up: a shirt, a pair of jeans,
// a school uniform. Garments carry no color except where the color is the
// garment (blue jeans), so `outfit color:` lands once.
const uniformBottoms=["pleated skirt","plaid skirt","long pleated skirt","uniform trousers","slacks","plaid trousers"];
const uniformShoes=["loafers","sneakers","mary janes","canvas shoes"];
const wardrobes={
  spring:{
    casual:{tops:["t-shirt","striped long sleeve shirt","cardigan, t-shirt","hoodie","denim jacket, t-shirt","collared shirt, sleeves rolled up"],
      bottoms:["blue jeans","pleated skirt","chino pants","denim skirt","long skirt","denim shorts"],
      dresses:["shirt dress","long sleeve dress","pinafore dress, long sleeve shirt"],
      shoes:["sneakers","canvas shoes","loafers","slip-on shoes"],
      extras:["tote bag","wristwatch","shirt tucked in","rolled cuffs","simple belt","sleeves pushed up"]},
    uniform:{tops:["school uniform, blazer, collared shirt","serafuku, long sleeves","school uniform, cardigan, collared shirt","school uniform, sweater vest, collared shirt","gakuran","school uniform, collared shirt, long sleeves"],
      bottoms:uniformBottoms,shoes:uniformShoes,
      neck:["necktie","neck ribbon"],
      extras:["school emblem on the chest","name tag","collar pin","sleeves pushed up","shirt tucked in","wristwatch"]}
  },
  summer:{
    casual:{tops:["t-shirt","striped t-shirt","oversized t-shirt","tank top","short sleeve collared shirt","polo shirt"],
      bottoms:["denim shorts","blue jeans","linen shorts","denim skirt","flared skirt","long skirt"],
      dresses:["sundress","shirt dress","t-shirt dress"],
      shoes:["sandals","sneakers","canvas shoes","flip-flops"],
      extras:["wristwatch","tote bag","towel around the neck","hair tie on the wrist","loose collar","shirt tucked in"]},
    uniform:{tops:["school uniform, collared shirt, short sleeves","serafuku, short sleeves","school uniform, polo shirt","school uniform, sweater vest, short sleeves","school uniform, collared shirt, sleeves rolled up","school uniform, short sleeve shirt, untucked"],
      bottoms:uniformBottoms,shoes:uniformShoes,
      neck:["necktie loosened","neck ribbon","collar unbuttoned"],
      extras:["school emblem on the chest","name tag","sleeves pushed up","shirt untucked","wristwatch","hair tie on the wrist"]}
  },
  autumn:{
    casual:{tops:["sweater","knit cardigan, t-shirt","hoodie","flannel shirt, t-shirt","sweatshirt","corduroy jacket, t-shirt"],
      bottoms:["blue jeans","corduroy pants","long skirt","pleated skirt","chino pants","denim skirt"],
      dresses:["long sleeve dress","knit dress","pinafore dress, long sleeve shirt"],
      shoes:["sneakers","loafers","ankle boots","canvas shoes"],
      extras:["thin scarf","tote bag","rolled cuffs","wristwatch","sleeves past the wrists","shirt collar over the sweater"]},
    uniform:{tops:["school uniform, blazer, collared shirt","serafuku, long sleeves, cardigan","school uniform, cardigan, collared shirt","school uniform, sweater vest, long sleeves","gakuran","school uniform, sweater, collared shirt"],
      bottoms:uniformBottoms,shoes:uniformShoes,
      neck:["necktie","neck ribbon"],
      extras:["school emblem on the chest","name tag","sleeves past the wrists","wristwatch","collar pin","shirt tucked in"]}
  },
  winter:{
    casual:{tops:["duffle coat, sweater","down jacket, hoodie","turtleneck sweater","long coat, sweater","fleece jacket, sweatshirt","padded jacket, sweater"],
      bottoms:["blue jeans","corduroy pants","long skirt","pleated skirt","wool skirt","sweatpants"],
      dresses:["knit dress","long sleeve dress"],
      shoes:["boots","sneakers","ankle boots","loafers"],
      extras:["scarf","mittens","tote bag","coat buttoned up","scarf ends hanging","knit cuffs showing"]},
    uniform:{tops:["school uniform, duffle coat","school uniform, blazer, scarf","school uniform, cardigan, blazer","gakuran, scarf","school uniform, pea coat","serafuku, long sleeves, cardigan, scarf"],
      bottoms:uniformBottoms,shoes:uniformShoes,
      neck:["scarf","necktie"],
      extras:["mittens","school emblem on the chest","coat buttoned up","name tag","scarf ends hanging","knit cuffs showing"]}
  }
};

// `neck` in a uniform set is the one thing worn at the collar. A top that already
// closes the collar its own way (sailor collar, standing collar, scarf) takes none.
const ownCollar=/serafuku|gakuran|scarf|polo shirt/;

// Some tops only go with one kind of bottom. The bottom is chosen first
// (BOTTOM may be locked), then tops that disagree with it are set aside.
const topFits={
  "serafuku, long sleeves":"skirt","serafuku, short sleeves":"skirt","serafuku, long sleeves, cardigan":"skirt","serafuku, long sleeves, cardigan, scarf":"skirt",
  "gakuran":"pants","gakuran, scarf":"pants"
};
// A one-piece that brings its own footwear.
const pairedShoes={"yukata":["geta","zori"]};
// ...and the things it is worn with, in place of the everyday extras.
const pairedExtras={"yukata":["drawstring pouch","obi bow at the back","paper fan tucked in the obi"]};

// HANDS — a prop needs a free hand. These moments already use both hands for
// something, so nothing is put in them.
const busyHands=/arms spread wide|arms out for balance|folded arms|head on arms|slumped over the table|stretching the arms|breathing on the hands|gripping the fence|splashing water|gathering leaves|touching the snow|reaching for a high shelf|catching snowflakes|arms behind back|leaning back on the hands|holding up two items|pushing a shopping cart|cutting vegetables|washing dishes|hanging laundry|folding a towel|hugging a cushion|holding a strap|wiping the fogged window|jacket held over the head|bag held over the head|wiping rain off the face|lighting a candle|covering ears|reaching up to a branch|catching a falling petal/;
// Some moments only make sense with a particular thing in the hand.
const momentNeeds=[
  {when:/\breading,|peeking over a book/,props:["book","notebook"]},
  {when:/blowing on the food/,props:["sweetpotato","bun","hotcan","mug"]},
  {when:/under an umbrella/,props:["umbrella"]},
  {when:/eating from a bento/,props:["bento"]},
  {when:/doing homework/,props:["notebook"]},
  {when:/from side, eating$/,props:["popsicle","icecream","watermelon","bread","sweetpotato","bun","shavedice","candyapple"]}
];

// Per-item detail tags, appended only at COMPLEXITY Max so details never contradict the garment.
const itemDetails={
  // tops
  "t-shirt":["crew neck","soft cotton"],
  "striped t-shirt":["thin horizontal stripes","crew neck"],
  "oversized t-shirt":["dropped shoulders","loose hem"],
  "tank top":["ribbed cotton","wide shoulder straps"],
  "short sleeve collared shirt":["open collar","loose fit"],
  "polo shirt":["ribbed collar","two button placket"],
  "striped long sleeve shirt":["thin horizontal stripes","boat neck"],
  "cardigan, t-shirt":["open front","sagging knit pockets"],
  "hoodie":["drawstrings","kangaroo pocket"],
  "denim jacket, t-shirt":["faded denim","metal buttons"],
  "collared shirt, sleeves rolled up":["creased cotton","chest pocket"],
  "sweater":["ribbed cuffs","soft knit"],
  "knit cardigan, t-shirt":["chunky knit","wooden buttons"],
  "flannel shirt, t-shirt":["plaid pattern","unbuttoned front"],
  "sweatshirt":["ribbed hem","brushed cotton"],
  "corduroy jacket, t-shirt":["wide wale corduroy","turned up collar"],
  "duffle coat, sweater":["toggle fastenings","wide hood"],
  "down jacket, hoodie":["quilted panels","hood pulled out over the collar"],
  "turtleneck sweater":["folded neck","ribbed knit"],
  "long coat, sweater":["straight cut","deep pockets"],
  "fleece jacket, sweatshirt":["high zip collar","soft pile"],
  "padded jacket, sweater":["quilted panels","snap buttons"],
  "hanten, sweater":["padded cotton","tied front cord"],
  "oversized hoodie":["dropped shoulders","sleeves over the hands"],
  "knit cardigan, long sleeve shirt":["chunky knit","wooden buttons"],
  "school uniform, blazer, collared shirt":["two button blazer","breast pocket"],
  "serafuku, long sleeves":["sailor collar","neckerchief"],
  "school uniform, cardigan, collared shirt":["v-neck knit","loose cuffs"],
  "school uniform, sweater vest, collared shirt":["v-neck knit","ribbed hem"],
  "gakuran":["standing collar","row of buttons"],
  "school uniform, collared shirt, long sleeves":["crisp cotton","buttoned cuffs"],
  "school uniform, collared shirt, short sleeves":["crisp cotton","chest pocket"],
  "serafuku, short sleeves":["sailor collar","neckerchief"],
  "school uniform, polo shirt":["ribbed collar","embroidered chest mark"],
  "school uniform, sweater vest, short sleeves":["v-neck knit","ribbed hem"],
  "school uniform, collared shirt, sleeves rolled up":["creased cotton","chest pocket"],
  "school uniform, short sleeve shirt, untucked":["loose hem","open collar"],
  "serafuku, long sleeves, cardigan":["sailor collar","open knit front"],
  "school uniform, sweater vest, long sleeves":["v-neck knit","buttoned cuffs"],
  "school uniform, sweater, collared shirt":["collar over the knit","ribbed cuffs"],
  "school uniform, duffle coat":["toggle fastenings","wide hood"],
  "school uniform, blazer, scarf":["two button blazer","scarf knotted at the front"],
  "school uniform, cardigan, blazer":["knit showing at the cuffs","breast pocket"],
  "gakuran, scarf":["standing collar","scarf tucked inside"],
  "school uniform, pea coat":["double breasted","wide lapels"],
  "serafuku, long sleeves, cardigan, scarf":["sailor collar","scarf wrapped twice"],
  // bottoms
  "blue jeans":["straight leg","faded knees"],
  "pleated skirt":["knife pleats","knee length"],
  "chino pants":["pressed crease","ankle length"],
  "denim skirt":["front buttons","a-line cut"],
  "long skirt":["ankle length","soft folds"],
  "denim shorts":["frayed hem","high waist"],
  "linen shorts":["drawstring waist","wrinkled linen"],
  "flared skirt":["knee length","light cotton"],
  "corduroy pants":["wide wale corduroy","straight leg"],
  "wool skirt":["knee length","thick weave"],
  "sweatpants":["elastic cuffs","drawstring waist"],
  "plaid skirt":["knife pleats","muted check"],
  "long pleated skirt":["below the knee","sharp pleats"],
  "uniform trousers":["pressed crease","straight leg"],
  "slacks":["pressed crease","belt loops"],
  "plaid trousers":["muted check","straight leg"],
  // one-pieces
  "shirt dress":["buttoned front","waist tie"],
  "long sleeve dress":["knee length","plain cotton"],
  "pinafore dress, long sleeve shirt":["wide shoulder straps","square bib"],
  "sundress":["thin shoulder straps","light cotton"],
  "t-shirt dress":["loose fit","above the knee"],
  "knit dress":["ribbed knit","below the knee"],
  "yukata":["simple pattern","plain obi"],
  // shoes
  "sneakers":["white laces","worn soles"],
  "canvas shoes":["low top","rubber toe cap"],
  "loafers":["penny strap","polished leather"],
  "slip-on shoes":["elastic side panels","flat sole"],
  "sandals":["ankle strap","flat sole"],
  "flip-flops":["thin thong strap","rubber sole"],
  "ankle boots":["side zip","low heel"],
  "boots":["laced front","thick sole"],
  "mary janes":["single strap","round toe"],
  "uwabaki":["white canvas","colored toe cap"],
  "socks":["thick knit","no shoes"],
  "slippers":["soft house slippers","worn heels"],
  "barefoot":["wet feet","toes in the water"],
  "geta":["wooden soles","cloth thong"],
  "zori":["flat woven soles","cloth thong"]
};

// itemDetails is keyed by garment strings; warn in console if a label edit breaks a link.
(function(){
  const check=item=>{ if(!itemDetails[item]) console.warn("[data] itemDetails missing:",item); };
  const checkSet=set=>["tops","bottoms","dresses","shoes"].forEach(cat=>(set[cat]||[]).forEach(check));
  Object.values(wardrobes).forEach(season=>Object.values(season).forEach(checkSet));
  Object.values(styles).forEach(scene=>{
    (scene.shoes||[]).forEach(check);
    (scene.onepiece||[]).forEach(check);
    Object.values(scene.wear||{}).forEach(checkSet);
  });
  Object.values(pairedShoes).forEach(list=>list.forEach(check));
  Object.keys(topFits).forEach(check);
})();

// Shown only with a skirt, shorts or a one-piece, and only when the legs are in frame.
const legwear={
  spring:["white socks","ankle socks","kneehighs","black socks"],
  summer:["ankle socks","bare legs","white socks"],
  autumn:["kneehighs","black pantyhose","white socks","loose socks"],
  winter:["black pantyhose","thick tights","kneehighs","leg warmers"]
};

// OTHER-only schema. `dry` keeps a detail out of rain and storms; `seasons` and `outdoor` keep a detail out of a scene
// that has no place for it: no visible breath in July, no contrail indoors.
// `styles` names the only scenes a detail belongs to (a paper airplane at school or on open ground);
// `home` and `indoor` keep a detail inside, `away` keeps it out of home; `lights` is when it can be seen
// (no contrail or sparrows at night).
const shuffleAddOns=[
  {id:"cat",tag:"stray cat nearby",outdoor:true,dry:true,away:true},
  {id:"contrail",tag:"contrail",outdoor:true,dry:true,lights:["morning","noon","dappled","golden","afterrain","sunshower"]},
  {id:"paperPlane",tag:"paper airplane in the air",dry:true,lights:["morning","noon","dappled","golden","overcast","afterrain","sunshower","dawn"],styles:["classroom","rooftop","field","seaside","busstop","stream"]},
  {id:"homecat",tag:"cat sleeping nearby",home:true},
  {id:"sunbeam",tag:"dust in the sunbeam",indoor:true,dry:true,lights:["morning","noon","dappled","golden"]},
  {id:"droplets",tag:"water droplets on the skin",seasons:["summer"],styles:["seaside","stream"]},
  {id:"breath",tag:"visible breath",seasons:["winter"],outdoor:true},
  {id:"petal",tag:"petal on the shoulder",seasons:["spring"],outdoor:true},
  {id:"dragonfly",tag:"red dragonfly",seasons:["autumn"],outdoor:true,dry:true,lights:["morning","noon","dappled","golden","overcast","afterrain","sunshower","dawn"]},
  {id:"wind",tag:"wind, fluttering clothes",outdoor:true},
  {id:"sparrows",tag:"sparrows on the wire",outdoor:true,dry:true,lights:["morning","noon","dappled","golden","overcast","afterrain","sunshower","dawn"]},
  {id:"bandaid",tag:"bandaid on the knee"}
];

// Small personal details, Max only.
const specials=["wristwatch","bandaid on a finger","hair tie on the wrist","thin cord bracelet","earphone cord from the pocket","folded handkerchief in the pocket"];
