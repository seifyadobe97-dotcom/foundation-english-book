"use strict";
/* Student lesson copy. Internal question codes and editorial sources remain private. */
window.PRESENT_SIMPLE_UNITS=[
 {title:"استخدمه إمتى؟",detail:"المضارع البسيط مش معناه إن الحدث بيحصل دلوقتي. بنستخدمه مع [[عادة]]، [[حقيقة]]، [[وظيفة]] أو [[موعد ثابت]].",
 cards:[],tip:"بص على [[معنى الجملة]] الأول. usually و every day بيساعدوك، لكن مش هم اللي بيحددوا الإجابة لوحدهم.",
 examples:[
 ["دي عادة","I [[study]] every evening.","حاجة بتتكرر."],
 ["دي حقيقة","The Earth [[moves]] around the Sun.","حقيقة علمية."],
 ["دي وظيفة","A teacher [[teaches]] students.","عمل معتاد."],
 ["ده موعد ثابت","The train [[leaves]] at eight.","جدول منتظم."]],
 quick:{q:"She studies English every day.",choices:["دي عادة","حدث بيحصل دلوقتي"],correct:0,why:"every day معناها كل يوم؛ يعني عادة متكررة.",wrongWhy:{"1":"الاختيار ده بيقول إن الحدث بيحصل دلوقتي، لكن every day بتدل على حاجة بتتكرر مش لحظة حالية."}}},
 {title:"ابنِ الجملة",detail:"أول سؤال تسأله لنفسك: [[مين الفاعل؟]] مع [[المفرد الغائب]] غالبًا بنضيف s. مع الجمع و I و You بنستخدم الفعل من غير إضافة.",
 cards:[
 ["مفرد غائب","He / She / It / اسم مفرد","فعل + s / es / ies","👤"],
 ["جمع + I / You","We / They / أسماء جمع / I / You","فعل في المصدر","👥"]],
 tip:"[[I]] مفرد، لكن هنا بنستخدم معاه الفعل من غير s: I play، مش I plays.",
 examples:[
 ["مع I","I [[work]] every day.","الفعل من غير s."],
 ["مع الجمع","They [[work]] every day.","الفعل من غير s."],
 ["مفرد غائب","She [[works]] every day.","ضفنا s."],
 ["اسم مفرد","My friend [[works]] here.","اسم مفرد = He أو She."]],
 quick:{q:"He ____ football every week.",choices:["play","plays"],correct:1,why:"He مفرد غائب؛ نستخدم plays.",wrongWhy:{"0":"play من غير s ينفع مع I وYou والجمع، لكن He مفرد غائب فنقول plays."}}},
 {title:"s / es / ies",detail:"لما الفاعل يكون [[مفرد غائب]]، بص على نهاية الفعل علشان تعرف هتضيف إيه.",
 video:{provider:"tiktok",url:"https://vt.tiktok.com/ZSgyJoEnb/",title:"فيديو مع Seify",note:"فيديو إضافي للتجربة: افتحه وارجع كمّل الأمثلة والأسئلة من مكانك."},
 cards:[
 ["أغلب الأفعال","play → plays","نضيف s","①"],
 ["نهايات خاصة","watch → watches","sh / ch / ss / x / z / o → es","②"],
 ["حرف ساكن + y","study → studies","نحذف y ونضيف ies","③"]],
 tip:"لو قبل y حرف متحرك، بنضيف [[s]] بس: play → plays. وافتكر: [[do → does]] و [[have → has]].",
 examples:[
 ["إضافة s","He [[plays]] tennis.","play → plays"],
 ["إضافة es","She [[watches]] TV.","watch → watches"],
 ["إضافة ies","Mona [[studies]] English.","study → studies"],
 ["فعل خاص","He [[does]] his homework.","do → does"]],
 quick:{q:"Mona ____ English every day.",choices:["studys","studies","study"],correct:1,why:"study: حرف ساكن + y، نحذف y ونضيف ies.",wrongWhy:{"0":"studys كتابة غلط؛ قبل y حرف ساكن، فبنحذف y ونضيف ies.","2":"study من غير تغيير يناسب I أو الجمع، لكن Mona مفرد غائب؛ المطلوب studies."}}},
 {title:"النفي",detail:"مع I و You والجمع بنستخدم [[don't]]. مع المفرد الغائب بنستخدم [[doesn't]]. وبعد الاتنين الفعل [[في المصدر]].",
 cards:[
 ["I / You / We / They","فاعل + don't + فعل","We don't play.","①"],
 ["He / She / It","فاعل + doesn't + فعل","He doesn't play.","②"]],
 tip:"متقولش He doesn't plays. الصح [[He doesn't play]]؛ لأن doesn't أخدت علامة المفرد.",
 examples:[
 ["مع الجمع","They [[don't play]] here.","الفعل من غير s."],
 ["مع I","I [[don't drink]] coffee.","don't + فعل في المصدر."],
 ["مع المفرد","Sara [[doesn't work]] on Sunday.","doesn't + فعل في المصدر."],
 ["فخ مهم","He doesn't [[need]] help.","مش needs بعد doesn't."]],
 quick:{q:"He doesn't ____ coffee.",choices:["drinks","drink"],correct:1,why:"بعد doesn't الفعل يرجع للمصدر drink.",wrongWhy:{"0":"drinks فيها s زيادة؛ doesn't حملت بالفعل علامة المفرد، فلازم الفعل بعدها يكون drink."}}},
 {title:"السؤال",detail:"في سؤال نعم أو لا، نبدأ بـ [[Do]] مع I و You والجمع، و[[Does]] مع المفرد الغائب. وبعدها الفعل [[مصدر]].",
 cards:[
 ["Do","Do + فاعل + فعل؟","Do they study?","①"],
 ["Does","Does + فاعل + فعل؟","Does she study?","②"]],
 tip:"بعد [[Does]] الفعل الرئيسي يرجع للمصدر، حتى لو الفاعل مفرد غائب.",warning:{wrong:"Does she plays?",correct:"Does she play?",why:"Does فيها علامة المفرد، عشان كده بنستخدم play من غير s. ونفس القاعدة مع Where وWhen."},
 examples:[
 ["مع You","[[Do]] you play football?","Do + فاعل + فعل."],
 ["مع He","[[Does]] he play football?","Does + فاعل + فعل."],
 ["سؤال Where","Where [[does]] she live?","Where + does + فاعل + فعل."],
 ["لما Who فاعل","Who [[knows]] the answer?","Who هنا فاعل السؤال؛ مفيش Does."]],
 quick:{q:"____ your brother play football?",choices:["Do","Does"],correct:1,why:"Your brother مفرد غائب؛ نبدأ بـ Does، وبعدها play في المصدر.",wrongWhy:{"0":"Do مع I وYou والجمع. Your brother مفرد غائب، لذلك محتاج Does."}}},
 {title:"الكلمات الدالة",detail:"الكلمات الدالة بتساعدك تلتقط [[العادة]] و[[التكرار]]. لكن لازم برضه تفكر في [[الفاعل]] ومعنى الجملة.",
 cards:[],tip:"[[never]] معناها أبدًا، فمش بنحط معاها don't من غير سبب. وأفعال الحالة زي need و weigh غالبًا بتكون في المضارع البسيط.",
 keywords:[["always","دائمًا"],["usually","عادةً"],["often","غالبًا"],["sometimes","أحيانًا"],["never","أبدًا"],["every day","كل يوم"]],
 examples:[
 ["عادة","I [[never]] wake up late.","never = أبدًا."],
 ["تكرار","Ali [[usually]] goes by bus.","usually = عادةً."],
 ["حالة","My friend [[needs]] help.","needs بتعبّر عن حالة."],
 ["بعد when","Take a break when you [[feel]] tired.","الفعل بعد when هنا مضارع بسيط."]],
 extra:{heading:"لو قابلت سؤالًا أصعب",paragraphs:[
  "مع when أو in case بنستخدم عادة المضارع البسيط في الجملة التابعة، حتى لو بنتكلم عن المستقبل: Take a sweater in case it gets cold.",
  "أفعال الحالة زي need و weigh مش بنستخدمها عادة في المضارع المستمر لما بنوصف حالة ثابتة."]},
 quick:{q:"Which word means «أبدًا»?",choices:["always","never","usually"],correct:1,why:"never معناها أبدًا.",wrongWhy:{"0":"always معناها دائمًا، وده عكس معنى أبدًا.","2":"usually معناها عادةً، لكن أبدًا معناها never."}}}
];