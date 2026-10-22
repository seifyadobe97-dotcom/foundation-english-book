"use strict";
// Foundation MCQs are sourced verbatim from the already-audited STEP course bank. Explanatory examples may be authored.
// Source pages/models are tied to each question. No unverified item is shown as practice.
window.STEP_FOUNDATION_STAGES=[
  {
    "id": "sentence",
    "title": "افهم خريطة الجملة",
    "english": "Sentence Elements",
    "subtitle": "مين؟ بيعمل إيه؟ وإيه تكملة المعنى؟",
    "intro": "الجملة الإنجليزية غالبًا فيها <strong>فاعل (Subject)</strong> و<strong>فعل (Verb)</strong>. أحيانًا نحتاج مفعولًا (Object) أو تكملة معنى (Complement) أو مكانًا وزمانًا (Adverbial). مش كل جملة لازم يكون فيها مفعول.",
    "map": [
      [
        "S",
        "Subject",
        "الفاعل",
        "هو الشخص أو الشيء اللي الجملة بتتكلم عنه. اسأل نفسك: مين؟",
        "Mona / the children"
      ],
      [
        "V",
        "Verb",
        "الفعل",
        "بيقول لنا الفاعل بيعمل إيه، أو حالته إيه.",
        "plays / studies / is"
      ],
      [
        "O",
        "Object",
        "المفعول به",
        "الشخص أو الشيء اللي الفعل وقع عليه. مش كل جملة لازم يكون فيها مفعول.",
        "Mona reads a book. → a book"
      ],
      [
        "C",
        "Complement",
        "تكملة المعنى",
        "اسم أو صفة بتكمل معنى الفاعل بعد فعل رابط، مش مفعول به.",
        "She is happy. → happy"
      ],
      [
        "A",
        "Adverbial",
        "ظرف أو معلومة إضافية",
        "بتوضح المكان أو الزمان أو الطريقة، وأحيانًا بتكون ضرورية حسب الجملة.",
        "at home / every day / quickly"
      ]
    ],
    "examples": [
      [
        "فاعل + فعل",
        "Birds fly.",
        "Birds فاعل جمع، وfly فعل. الجملة كاملة من غير مفعول."
      ],
      [
        "فاعل + فعل + مفعول",
        "Mona reads books.",
        "Mona فاعل، reads فعل، books مفعول به."
      ],
      [
        "فاعل + فعل + تكملة",
        "Ali is a teacher.",
        "a teacher خبر أو تكملة للفـاعل بعد is، مش مفعول."
      ],
      [
        "زيادة المكان",
        "Ali studies at home.",
        "at home بتقول فين، ومش الفاعل ولا المفعول."
      ]
    ],
    "tip": "اسأل نفسك بالترتيب: مين؟ بيعمل إيه أو حالته إيه؟ وبعدين: هل فيه شيء وقع عليه الفعل أو وصف بيكمل المعنى؟",
    "checks": []
  },
  {
    "id": "noun-number",
    "title": "الاسم المفرد والجمع",
    "english": "Singular & Plural Nouns",
    "subtitle": "نحدد العدد قبل ما نختار شكل الفعل",
    "intro": "<strong>الاسم (Noun)</strong> ممكن يدل على شخص أو شيء أو فكرة. الاسم المعدود: مفرد = واحد، وجمع = أكثر من واحد. لكن فيه أسماء <strong>غير معدودة</strong> زي water وinformation، ومش بنضيف لها s عشان نعمل جمع عادي.",
    "map": [
      [
        "1",
        "Singular",
        "اسم مفرد",
        "يعني شخص واحد أو شيء واحد من الأسماء اللي بنقدر نعدّها.",
        "a student / one book / this child"
      ],
      [
        "2+",
        "Plural",
        "اسم جمع",
        "يعني اتنين أو أكتر. والجمع مش لازم ينتهي بحرف s.",
        "two students / many books / these children"
      ],
      [
        "U",
        "Uncountable",
        "اسم غير معدود",
        "حاجة مش بنعدّها عادة كأفراد، ومش بنزوّد لها s للجمع في المعنى ده.",
        "water / information / advice"
      ],
      [
        "?",
        "Head noun",
        "حدّد الاسم الأساسي",
        "لو العبارة فيها أكتر من اسم، دور على الاسم الرئيسي اللي العبارة بتتكلم عنه.",
        "the boxes on the table → boxes"
      ]
    ],
    "examples": [
      [
        "اسم مفرد",
        "The student is ready.",
        "The student شخص واحد، لذا is."
      ],
      [
        "اسم جمع",
        "The students are ready.",
        "students جمع، لذا are."
      ],
      [
        "اسم يبدو بلا s لكنه جمع",
        "The children are here.",
        "children جمع غير منتظم؛ مفيهوش s."
      ],
      [
        "اسم غير معدود",
        "The information is useful.",
        "information غير معدود؛ هنا نستخدم is."
      ],
      [
        "بص على الاسم الأساسي",
        "The box of pencils is heavy.",
        "box هي رأس العبارة ومفرد؛ pencils داخل of مش الفاعل الأساسي."
      ]
    ],
    "tip": "مش كل كلمة آخرها s تبقى جمع، ومش كل جمع لازم ينتهي بـ s. بص على <strong>المعنى والاسم الأساسي</strong>: news اسم غير معدود، وpeople غالبًا جمع.",
    "checks": [
      {
        "bankId": "ASGQPRSIM-AGG-02",
        "en": "When the students ...... hard, they pass their exams.",
        "choices": [
          "study",
          "studied",
          "will study",
          "would study"
        ],
        "correct": 0,
        "why": "الجملة بتوصف علاقة عامة متكررة: لما الطلاب يذاكروا بجد بينجحوا. الفاعل `the students` جمع، فنقول `study` من غير `s`. وجود `when` هنا مش معناه إننا نستخدم الماضي.",
        "wrong": [
          "",
          "studied ماضي، لكن pass في الجزء التاني مضارع بسيط والجملة بتشرح علاقة عامة.",
          "will study للمستقبل، لكن الكلام هنا عن قاعدة عامة متكررة، مش توقع لحدث جاي.",
          "would study غالبًا محتاج سياق شرطي أو افتراضي، وهو مش موجود هنا."
        ],
        "source": {
          "type": "original_compilation",
          "model": "4",
          "number": "071",
          "page": "22",
          "editorial_status": "individually_checked_for_pilot"
        }
      },
      {
        "bankId": "ASGQPRSIM-BOOK-09",
        "en": "They always _____ late for school.",
        "choices": [
          "coming",
          "comes",
          "come",
          "to come"
        ],
        "correct": 2,
        "why": "`They` جمع، فنستخدم `come` مباشرة. وظرف التكرار `always` بيجي قبل الفعل الرئيسي في الجملة المثبتة.",
        "wrong": [
          "coming صيغة ing، ومينفعش تجي كفعل رئيسي لوحدها بعد They.",
          "comes للمفرد الغائب، لكن They فاعل جمع.",
          "",
          "to come مصدر بـ to، لكن بعد They في الجملة المثبتة نحتاج الفعل المباشر."
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      }
    ]
  },
  {
    "id": "plural-rules",
    "title": "ازاي نجمع الاسم؟",
    "english": "Plural Spelling",
    "subtitle": "مش كل الكلمات بنزود لها s وخلاص",
    "intro": "بنتعلم شكل الاسم المفرد والجمع عشان نعرف نختار الضمير والفعل. القواعد دي خاصة بـ<strong>الأسماء</strong>، ومختلفة عن إضافة s للأفعال مع he/she/it.",
    "map": [
      [
        "-s",
        "Most nouns",
        "الجمع العادي",
        "مع أغلب الأسماء المعدودة بنضيف حرف s.",
        "book → books / car → cars"
      ],
      [
        "-es",
        "Some endings",
        "الجمع بإضافة es",
        "بعض الأسماء اللي بتنتهي بـ s أو x أو ch أو sh بنضيف لها es.",
        "box → boxes / watch → watches"
      ],
      [
        "-ies",
        "Consonant + y",
        "ساكن قبل y",
        "لو قبل حرف y حرف ساكن، غالبًا بنشيل y ونضيف ies.",
        "city → cities / baby → babies"
      ],
      [
        "-s",
        "Vowel + y",
        "متحرك قبل y",
        "لو قبل حرف y حرف متحرك، بنسيب y ونضيف s فقط.",
        "boy → boys / key → keys"
      ],
      [
        "!",
        "Irregular plural",
        "جمع شاذ",
        "فيه أسماء بتتغير بشكل مختلف تمامًا؛ بنحفظ جمعها زي ما هو.",
        "child → children / man → men / person → people"
      ]
    ],
    "examples": [
      [
        "جمع بـ s",
        "one book → two books",
        "book معدود عادي؛ أضف s."
      ],
      [
        "جمع بـ es",
        "one box → two boxes",
        "box تنتهي x؛ أضف es."
      ],
      [
        "ساكن + y",
        "one city → two cities",
        "الحرف قبل y ساكن؛ نحذف y ونضيف ies."
      ],
      [
        "متحرك + y",
        "one boy → two boys",
        "قبل y حرف متحرك؛ نضيف s بس."
      ],
      [
        "غير منتظم",
        "one child → two children",
        "الجمع مش children's ولا childs."
      ],
      [
        "نفس الشكل",
        "one sheep → two sheep",
        "المعنى والعدد في الجملة هما اللي يوضحوا الجمع."
      ]
    ],
    "tip": "في نهايات زي f/fe وo فيه استثناءات: knife → knives لكن roof → roofs، وpotato → potatoes لكن photo → photos. نحفظ الكلمات الشائعة وما نعمّمش قاعدة غلط.",
    "checks": []
  },
  {
    "id": "pronouns",
    "title": "الضمائر والفاعل",
    "english": "Pronouns",
    "subtitle": "بدّل الاسم بضميره المناسب",
    "intro": "<strong>ضمير الفاعل</strong> بياخد مكان الاسم اللي بيعمل الفعل. و<strong>ضمير المفعول</strong> بييجي غالبًا بعد الفعل أو حرف الجر. وأهم حاجة في الزمن الحاضر تفرّق بين I/you/we/they وبين he/she/it.",
    "map": [
      [
        "S",
        "Subject pronouns",
        "ضمائر الفاعل",
        "بنستخدمها بدل الاسم اللي بيعمل الفعل أو اللي الجملة بتتكلم عنه.",
        "I / you / he / she / it / we / they"
      ],
      [
        "O",
        "Object pronouns",
        "ضمائر المفعول",
        "بنستخدمها لما الشخص أو الشيء يقع عليه الفعل، أو بعد حرف جر.",
        "me / you / him / her / it / us / them"
      ],
      [
        "1",
        "Singular third person",
        "مفرد غائب",
        "شخص واحد غير المتكلم والمخاطب، أو شيء واحد. وده مهم لاختيار شكل الفعل.",
        "he / she / it / Mona"
      ],
      [
        "2+",
        "Plural subject",
        "فاعل جمع",
        "بنتكلم عن أكتر من واحد. خد بالك إن you ينفع لمفرد أو جمع.",
        "we / they / the boys"
      ]
    ],
    "examples": [
      [
        "اسم → ضمير",
        "Mona is a student. She studies.",
        "Mona اسم مفرد مؤنث؛ استبدلناه بـ She."
      ],
      [
        "اسم جمع → ضمير",
        "The boys are here. They play.",
        "boys جمع؛ استبدلناه بـ They."
      ],
      [
        "ضمير مفعول",
        "I know him.",
        "I فاعل وhim مفعول؛ مينفعش he بعد know هنا."
      ],
      [
        "I حالة خاصة",
        "I work. / I am ready.",
        "I مفرد لكن الفعل الأساسي work بلا s، وفعل be معاه am."
      ],
      [
        "You حالة خاصة",
        "You are welcome.",
        "you ينفع مفرد أو جمع، ومعاه are في الحاضر."
      ]
    ],
    "tip": "he/she/it ضمائر فاعل مفرد غائب. وفي إنجليزي العصر الحديث ممكن they تُستخدم لشخص واحد غير محدد النوع؛ هنا الفعل بعدها يفضل بصيغة they are / they work.",
    "checks": [
      {
        "bankId": "ASGQPRSIM-AGG-01",
        "en": "When I go to King Saud University Library, I usually ………………",
        "choices": [
          "am studying",
          "will study",
          "studied",
          "study"
        ],
        "correct": 3,
        "why": "وجود `usually` يدل على عادة متكررة. الفاعل `I` يأخذ الفعل في المصدر من غير `s`؛ لذلك الإجابة `study`. ولا نستخدم المضارع المستمر لمجرد إن الشخص يذاكر في الوقت الحالي؛ السياق هنا عادة.",
        "wrong": [
          "am studying بتصف مذاكرة جارية دلوقتي، لكن usually هنا معناها عادة متكررة.",
          "will study للمستقبل، بينما الجملة بتتكلم عن حاجة بتحصل عادة.",
          "studied للماضي، ومفيش سياق بيحكي عن مرة انتهت.",
          ""
        ],
        "source": {
          "type": "original_compilation",
          "model": "2",
          "number": "063",
          "page": "9",
          "editorial_status": "individually_checked_for_pilot"
        }
      },
      {
        "bankId": "ASGQPRSIM-BOOK-01",
        "en": "We usually _____ to school by bus.",
        "choices": [
          "goes",
          "went",
          "going",
          "go"
        ],
        "correct": 3,
        "why": "`We` فاعل جمع، والمضارع البسيط معه يكون بالفعل الأساسي `go` بدون `s`. كلمة `usually` دليل على عادة.",
        "wrong": [
          "goes فيها s للمفرد الغائب، لكن الفاعل We جمع.",
          "went ماضي، وكلمة usually هنا بتوضح عادة في الحاضر.",
          "going صيغة ing، ومفيش فعل مساعد زي are يكملها.",
          ""
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      },
      {
        "bankId": "ASGQPRSIM-BOOK-08",
        "en": "I never _________ up late.",
        "choices": [
          "woke",
          "waking",
          "wakes",
          "wake"
        ],
        "correct": 3,
        "why": "`never` ظرف تكرار بمعنى «أبدًا»، ويوضع قبل الفعل الرئيسي. ومع `I` نستخدم `wake` بدون `s`.",
        "wrong": [
          "woke ماضي، لكن I never هنا بتوصف عادة حالية.",
          "waking صيغة ing، ومفيش فعل مساعد يكملها.",
          "wakes فيها s للمفرد الغائب، لكن الفاعل I بياخد wake.",
          ""
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      }
    ]
  },
  {
    "id": "verb-roles",
    "title": "الفعل الأساسي والمساعد",
    "english": "Main vs Auxiliary Verbs",
    "subtitle": "مين شايل المعنى؟ ومين بيساعده؟",
    "intro": "<strong>الفعل الأساسي (Main Verb)</strong> بيحمل معنى الحدث أو الحالة، زي play وstudy وknow. <strong>الفعل المساعد (Auxiliary Verb)</strong> بيساعد في تكوين السؤال أو النفي أو الأزمنة. مهم: نفس الكلمة be أو have أو do ممكن تبقى أساسية في جملة، ومساعدة في جملة تانية.",
    "map": [
      [
        "Main",
        "Main verb",
        "الفعل الأساسي",
        "هو اللي شايل معنى الحدث أو الحالة؛ زي يلعب أو يعرف أو يمتلك.",
        "play / know / have / be"
      ],
      [
        "BE",
        "Be family",
        "مجموعة be",
        "ممكن تكون فعلًا رابطًا أساسيًا، أو تساعد فعلًا تاني في زمن مستمر أو مبني للمجهول.",
        "am / is / are / was / were / been / being"
      ],
      [
        "DO",
        "Do family",
        "مجموعة do",
        "ممكن تعني يعمل كفعل أساسي، أو تساعدنا نكوّن السؤال والنفي.",
        "do / does / did"
      ],
      [
        "HAVE",
        "Have family",
        "مجموعة have",
        "ممكن تعني يمتلك كفعل أساسي، أو تكون مساعدة في الأزمنة التامة.",
        "have / has / had"
      ],
      [
        "Modal",
        "Modal verbs",
        "الأفعال المساعدة الناقصة",
        "بتوضح القدرة أو النصيحة أو الاحتمال وغيرها. بعدها غالبًا مصدر من غير to.",
        "can / could / will / should / must / may / might"
      ]
    ],
    "examples": [
      [
        "الفعل الأساسي فقط",
        "She reads every day.",
        "reads هو الفعل الأساسي ومعناه تقرأ."
      ],
      [
        "be فعل أساسي رابط",
        "She is happy.",
        "is رابط بين She والصفة happy؛ مفيش فعل رئيسي تاني."
      ],
      [
        "be فعل مساعد",
        "She is reading.",
        "is مساعد وreading الفعل الأساسي."
      ],
      [
        "have فعل أساسي",
        "He has a car.",
        "has معناها يمتلك هنا، وهي الفعل الأساسي."
      ],
      [
        "have فعل مساعد",
        "He has finished.",
        "has مساعد لتكوين المضارع التام؛ finished الفعل الأساسي."
      ],
      [
        "do فعل أساسي",
        "She does her homework.",
        "does هنا فعل أساسي معناه تؤدي/تعمل."
      ],
      [
        "do فعل مساعد",
        "Does she study?",
        "Does مساعد للسؤال، وstudy الفعل الأساسي."
      ],
      [
        "مساعد ناقص",
        "She can swim.",
        "can مساعد ناقص، وswim في المصدر بعده."
      ]
    ],
    "tip": "بص على وظيفة الكلمة جوّه الجملة مش شكلها بس. مثال: is happy = is فعل رابط أساسي؛ is studying = is مساعد قبل studying.",
    "checks": [
      {
        "bankId": "ASGQPRSIM-BOOK-10",
        "en": "He _______ his homework every day at 7 p.m.",
        "choices": [
          "do",
          "does",
          "doing",
          "did"
        ],
        "correct": 1,
        "why": "الفاعل He مفرد غائب، ولأن الجملة بتوصف عادة يومية، نستخدم does. كلمة every day بتوضح التكرار.",
        "wrong": [
          "do من غير es، لكن He مفرد غائب في المضارع البسيط.",
          "",
          "doing صيغة ing من غير فعل مساعد ومش مناسبة لعادة every day.",
          "did ماضي، لكن every day هنا بيوصف عادة مستمرة."
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      },
      {
        "bankId": "ASGQPRSIM-BOOK-07",
        "en": "Does he always ___ his homework?",
        "choices": [
          "do",
          "does",
          "did",
          "doing"
        ],
        "correct": 0,
        "why": "بعد `Does` في السؤال يكون الفعل الرئيسي في المصدر `do`؛ لأن `Does` وحدها تحمل علامة المضارع مع الفاعل المفرد.",
        "wrong": [
          "",
          "does تكرار لعلامة المفرد؛ بعد Does في أول السؤال نستخدم do.",
          "did ماضي، ومينفعش بعد Does؛ الفعل الرئيسي يكون في المصدر.",
          "doing صيغة ing، ومش المصدر المطلوب بعد Does."
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      }
    ]
  },
  {
    "id": "verb-forms",
    "title": "تصريفات الفعل",
    "english": "Verb Forms V1 / V2 / V3",
    "subtitle": "شكل الفعل يتغير حسب الزمن والمساعد",
    "intro": "أهم تصريفات الفعل اللي هنحتاجها: <strong>المصدر V1</strong>، <strong>الماضي V2</strong>، <strong>التصريف الثالث V3</strong>، <strong>ing</strong>، وشكل المفرد الغائب <strong>s/es/ies</strong>. مش كل صيغة لوحدها معناها زمن معيّن.",
    "map": [
      [
        "V1",
        "Base form",
        "المصدر (الشكل الأساسي)",
        "ده شكل الفعل اللي بنستخدمه بعد do وdoes وdid، وبعد أغلب المساعدات الناقصة.",
        "play / go / study"
      ],
      [
        "+s",
        "Present: he/she/it",
        "شكل المفرد في المضارع",
        "مع he أو she أو it في المضارع البسيط المثبت، الفعل بياخد s أو es أو ies.",
        "plays / goes / studies"
      ],
      [
        "V2",
        "Past simple",
        "تصريف الماضي",
        "بنستخدمه مع الماضي البسيط في الإثبات، سواء الفعل منتظم أو شاذ.",
        "played / went / studied"
      ],
      [
        "V3",
        "Past participle",
        "التصريف الثالث",
        "بيظهر بعد have المساعدة في الأزمنة التامة، أو بعد be في المبني للمجهول.",
        "played / gone / studied"
      ],
      [
        "-ing",
        "-ing form",
        "صيغة ing",
        "بنستخدمها مثلًا بعد be المساعدة عشان نكوّن الزمن المستمر.",
        "playing / going / studying"
      ]
    ],
    "examples": [
      [
        "فعل منتظم",
        "play · played · played",
        "V1 / V2 / V3؛ في الماضي نضيف ed هنا."
      ],
      [
        "فعل غير منتظم",
        "go · went · gone",
        "V2 مختلف عن V3؛ نحفظ الاتنين."
      ],
      [
        "فاعل مفرد في الحاضر",
        "She studies English.",
        "study → studies مع She في المضارع البسيط."
      ],
      [
        "بعد does / doesn't",
        "Does he study?",
        "بعد does أو doesn't نستخدم study (V1)، مش studies."
      ],
      [
        "بعد did / didn't",
        "Did he go?",
        "did أخذت الماضي، وبعدها go (V1)، مش went."
      ],
      [
        "بعد be + ing",
        "She is studying.",
        "is مساعد وstudying شكل ing للفعل الأساسي."
      ],
      [
        "بعد have + V3",
        "She has gone home.",
        "has مساعد وgone تصريف ثالث."
      ],
      [
        "بعد modal + V1",
        "She can go.",
        "بعد can بنستخدم مصدر الفعل بلا to وبلا s."
      ]
    ],
    "tip": "الإضافة s على الفعل مع he/she/it تخص المضارع البسيط المثبت، ومش هي نفسها s جمع الاسم. مثال: The boys play / The boy plays.",
    "checks": [
      {
        "bankId": "ASGQPRSIM-BOOK-02",
        "en": "She ________ to school every day.",
        "choices": [
          "go",
          "goes",
          "going",
          "gone"
        ],
        "correct": 1,
        "why": "الفاعل `She` مفرد غائب. الفعل `go` بينتهي بـ`o`، ولذلك نضيف `es` فيصبح `goes`، و`every day` بتوضح إنها عادة.",
        "wrong": [
          "go من غير es، لكن She مفرد غائب والفعل go بيأخد es.",
          "",
          "going صيغة ing، ومش فعل مضارع بسيط مكتمل لوحدها.",
          "gone التصريف الثالث، وبيحتاج فعل مساعد زي has."
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      },
      {
        "bankId": "ASGQPRSIM-BOOK-03",
        "en": "Physics is the science which ______ light and heat.",
        "choices": [
          "studies",
          "studying",
          "study",
          "is studying"
        ],
        "correct": 0,
        "why": "`which` هنا فاعل في جملة الوصل وبيعود على `the science` المفرد. لذلك الفعل `study` يتغير إلى `studies`: نحذف `y` بعد الحرف الساكن ونضيف `ies`.",
        "wrong": [
          "",
          "studying صيغة ing من غير فعل مساعد؛ ومش مناسبة لتعريف علمي ثابت.",
          "study من غير ies، لكن which راجعة على science المفرد.",
          "is studying بتصور دراسة جارية حاليًا، بينما الجملة بتعرّف مجال علمي وصفته العامة."
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 8,
          "status": "rechecked"
        }
      },
      {
        "bankId": "ASGQPRSIM-BOOK-04",
        "en": "He does not usually ______ coffee.",
        "choices": [
          "drank",
          "drink",
          "drinks",
          "having"
        ],
        "correct": 1,
        "why": "النفي بـ`does not` بيحمل علامة الزمن والشخص. لذلك الفعل الرئيسي يرجع للمصدر `drink`، وما نضيفش `s` مرة تانية.",
        "wrong": [
          "drank ماضي، لكن بعد does not لازم الفعل يرجع للمصدر.",
          "",
          "drinks فيها s زيادة؛ does أخدت علامة المفرد بالفعل.",
          "having صيغة ing ومش مصدر الفعل drink المطلوب بعد does not."
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      }
    ]
  },
  {
    "id": "build",
    "title": "ابنِ الجملة وحوّلها",
    "english": "From Sentence to STEP Question",
    "subtitle": "نجمع القواعد اللي اتعلمناها في سؤال امتحاني",
    "intro": "الآن نربط الاسم والضمير وشكل الفعل والمساعد. حدد <strong>الفاعل</strong>، واعرف <strong>مفرد ولا جمع</strong>، ثم اسأل: الجملة مثبتة، منفية، ولا سؤال؟ وبعدها اختار التصريف المناسب.",
    "map": [
      [
        "1",
        "Find the subject",
        "حدّد الفاعل",
        "اسأل: مين اللي بيعمل الفعل أو بنتكلم عنه؟ ومتخترش أي اسم قريب وخلاص.",
        "The student / The students"
      ],
      [
        "2",
        "Check number",
        "اعرف مفرد ولا جمع",
        "عدد الفاعل بيساعدك تختار شكل الفعل أو الفعل المساعد.",
        "one student / two students"
      ],
      [
        "3",
        "Sentence type",
        "حدّد نوع الجملة",
        "هل هي مثبتة ولا منفية ولا سؤال؟ النوع بيغيّر المساعد وترتيب الكلمات.",
        "She plays. / She doesn't play. / Does she play?"
      ],
      [
        "4",
        "Choose verb form",
        "اختار شكل الفعل",
        "مع المفرد في الإثبات نضيف s، لكن بعد does أو doesn't بنرجّع الفعل للمصدر.",
        "She plays. / Does she play?"
      ]
    ],
    "examples": [
      [
        "مفرد + مثبت",
        "The student plays football.",
        "student مفرد غائب؛ الفعل plays."
      ],
      [
        "جمع + مثبت",
        "The students play football.",
        "students جمع؛ الفعل play."
      ],
      [
        "مفرد + نفي",
        "The student doesn't play.",
        "doesn't + مصدر، من غير s."
      ],
      [
        "جمع + نفي",
        "The students don't play.",
        "don't + مصدر play."
      ],
      [
        "مفرد + سؤال",
        "Does the student play?",
        "Does أول السؤال، وplay في المصدر."
      ],
      [
        "جمع + سؤال",
        "Do the students play?",
        "Do مع الجمع، وplay في المصدر."
      ],
      [
        "be بلا do",
        "Is the student ready?",
        "مع is/are في جملة وصف، نقدم be في السؤال؛ مش Do is."
      ]
    ],
    "tip": "في الامتحان اسأل 4 أسئلة: مين الفاعل؟ مفرد ولا جمع؟ هل عندنا مساعد؟ وإيه شكل الفعل بعده؟ السرعة تيجي بعد ما تتقن الدقة.",
    "checks": [
      {
        "bankId": "ASGQPRSIM-BOOK-06",
        "en": "______ your brother play football every week?",
        "choices": [
          "Does",
          "Did",
          "Do",
          "Doing"
        ],
        "correct": 0,
        "why": "السؤال عن عادة أسبوعية، والفاعل `your brother` مفرد غائب، فنبدأ بـ`Does` ثم يأتي `play` في المصدر.",
        "wrong": [
          "",
          "Did بتسأل عن الماضي؛ كل أسبوع هنا يقصد عادة حالية من غير إطار زمني ماضي.",
          "Do مع I وYou والجمع، لكن your brother مفرد غائب.",
          "Doing مش فعل مساعد نبدأ به السؤال ده؛ المطلوب Does."
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      },
      {
        "bankId": "ASGQPRSIM-BOOK-05",
        "en": "My father _____ work on Sundays.",
        "choices": [
          "don’t",
          "doesn’t",
          "isn’t",
          "aren’t"
        ],
        "correct": 1,
        "why": "`My father` مفرد غائب، والنفي هنا لفعل حركي هو `work`. نستخدم `doesn’t + work` وليس `isn’t`.",
        "wrong": [
          "don't مع I وYou والجمع، لكن My father مفرد غائب.",
          "",
          "isn't مينفعش قبل الفعل work في المضارع البسيط؛ النفي هنا بـ doesn't.",
          "aren't مع الجمع في فعل be، ومش مساعد النفي المناسب قبل work."
        ],
        "source": {
          "type": "course_book",
          "pdf_page": 3,
          "status": "rechecked"
        }
      },
      {
        "bankId": "ASGQPRSIM-AGG-10",
        "en": "Dave always……... the watch that was given to him by his father.",
        "choices": [
          "wears",
          "will wear",
          "was to wear",
          "has been wearing"
        ],
        "correct": 0,
        "why": "`Dave` مفرد غائب، وفي المضارع البسيط المثبت بنضيف `s` للفعل: `wears`. كلمة `always` بتوضح إنها عادة متكررة. لا توجد حاجة لاستخدام المستقبل أو صيغة الاستمرار.",
        "wrong": [
          "",
          "will wear مستقبل، لكن always هنا بيوصف عادة معتادة لِـ Dave.",
          "was to wear بتشير لخطة أو ترتيب في الماضي، مش عادة حالية.",
          "has been wearing بتركز على الاستمرار من الماضي للحاضر؛ السؤال هنا يقصد عادة عامة، فالأبسط والأدق wears."
        ],
        "source": {
          "type": "original_compilation",
          "model": "6",
          "number": "078",
          "page": "34",
          "editorial_status": "individually_checked_for_pilot"
        }
      },
      {
        "bankId": "ASGQPRSIM-AGG-03",
        "en": "Take a break when you …………. feeling tired from all the reading.",
        "choices": [
          "started",
          "start",
          "starts",
          "starting"
        ],
        "correct": 1,
        "why": "الجملة أمر: خد استراحة لما تبدأ تحس بالتعب. بعد `when` في هذا السياق المستقبلي نستخدم المضارع البسيط `start`، مش `will start`. و`you` يأخذ الفعل في المصدر.",
        "wrong": [
          "started ماضي، لكن Take a break توجيه عام وفي when نستخدم المضارع البسيط.",
          "",
          "starts مع المفرد الغائب، لكن الفاعل you.",
          "starting صيغة ing، ومش الفعل الكامل المطلوب بعد you."
        ],
        "source": {
          "type": "original_compilation",
          "model": "14",
          "number": "076",
          "page": "75",
          "editorial_status": "individually_checked_for_pilot"
        }
      },
      {
        "bankId": "ASGQPRSIM-AGG-05",
        "en": "Ali is fixing his brother's bicycle, and he…….... some help. Can you help him?",
        "choices": [
          "is needing",
          "needed",
          "needs",
          "need"
        ],
        "correct": 2,
        "why": "الفعل `need` هنا يعبّر عن احتياج أو حالة، وفي الاستعمال المعتاد لا نقول `is needing`. وبما إن الفاعل `he` مفرد غائب، نختار `needs`، حتى لو الجملة الأولى في المضارع المستمر.",
        "wrong": [
          "is needing صيغة مستمرة؛ need هنا فعل حالة، وعادة مش بنستخدمه في المستمر بالمعنى ده.",
          "needed ماضي، بينما Ali محتاج المساعدة دلوقتي حسب السياق.",
          "",
          "need من غير s، لكن he مفرد غائب، فنختار needs."
        ],
        "source": {
          "type": "original_compilation",
          "model": "25",
          "number": "068",
          "page": "142",
          "editorial_status": "individually_checked_for_pilot"
        }
      }
    ]
  }
];
