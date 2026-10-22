"use strict";
// Foundation practice is formative and client-side; never a validated or official STEP score.
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
    "checks": [
      {
        "q": "في جملة: “The children play.” — إيه الفاعل؟",
        "en": "The children play.",
        "choices": [
          "The children",
          "play",
          "children play"
        ],
        "correct": 0,
        "why": "The children هي مجموعة الأشخاص اللي بيعملوا الفعل؛ يبقى ده الفاعل.",
        "wrong": [
          "",
          "play هو الفعل اللي الأطفال بيعملوه، مش الفاعل.",
          "children play جزء فيه الاسم والفعل مع بعض؛ الفاعل هو The children فقط."
        ]
      },
      {
        "q": "في “Sara drinks water.” — إيه المفعول به؟",
        "en": "Sara drinks water.",
        "choices": [
          "Sara",
          "drinks",
          "water"
        ],
        "correct": 2,
        "why": "water هو الشيء اللي سارة بتشربه؛ الفعل واقع عليه.",
        "wrong": [
          "Sara هي الفاعل لأنها اللي بتشرب.",
          "drinks هو الفعل نفسه، مش الشيء اللي بنتكلم عنه.",
          ""
        ]
      },
      {
        "q": "في “He is happy.” — كلمة happy دورها إيه؟",
        "en": "He is happy.",
        "choices": [
          "مفعول به",
          "تكملة بتوصف الفاعل",
          "فاعل جديد"
        ],
        "correct": 1,
        "why": "happy بتوصف He بعد is، فهي تكملة للمعنى (Subject Complement).",
        "wrong": [
          "happy مش شيء وقع عليه فعل؛ دي صفة بتوصف الفاعل.",
          "",
          "He هو الفاعل، وhappy وصف له مش فاعل تاني."
        ]
      }
    ]
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
        "q": "اختار الفعل المناسب: “The students ____ tired.”",
        "en": "The students ____ tired.",
        "choices": [
          "is",
          "are",
          "am"
        ],
        "correct": 1,
        "why": "students جمع؛ مع فعل be في الحاضر نستخدم are.",
        "wrong": [
          "is مع الاسم المفرد أو he/she/it، مش students الجمع.",
          "",
          "am مع I فقط."
        ]
      },
      {
        "q": "الفاعل الحقيقي في “The bag of books is new.” هو …",
        "en": "The bag of books is new.",
        "choices": [
          "books",
          "The bag",
          "new"
        ],
        "correct": 1,
        "why": "رأس العبارة The bag مفرد؛ of books بتوضح محتوى الشنطة، مش بتغيّر عدد الفاعل.",
        "wrong": [
          "books بعد of مش الاسم الأساسي للفاعل.",
          "",
          "new صفة بتوصف الشنطة."
        ]
      },
      {
        "q": "اختار الجملة السليمة:",
        "choices": [
          "The informations are useful.",
          "The information is useful.",
          "An information is useful."
        ],
        "correct": 1,
        "why": "information اسم غير معدود؛ بنعامله كمفرد في الفعل، ومنستخدمش informations أو an information في المعنى ده.",
        "wrong": [
          "information لا يُجمع عادةً بإضافة s؛ الجملة دي غلط.",
          "",
          "an بتستخدم قبل اسم مفرد معدود، وinformation غير معدود."
        ]
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
    "checks": [
      {
        "q": "جمع كلمة city هو …",
        "choices": [
          "citys",
          "cities",
          "cityes"
        ],
        "correct": 1,
        "why": "city: قبل y حرف ساكن t، فنحذف y ونضيف ies → cities.",
        "wrong": [
          "citys مش الصيغة الصحيحة في الجمع.",
          "",
          "cityes مش قاعدة جمع الاسم المنتهي بحرف ساكن + y."
        ]
      },
      {
        "q": "جمع كلمة boy هو …",
        "choices": [
          "boys",
          "boies",
          "boyes"
        ],
        "correct": 0,
        "why": "boy: قبل y حرف متحرك o؛ بنضيف s فقط → boys.",
        "wrong": [
          "",
          "boies بتطبق ies على كلمة قبل y فيها حرف متحرك؛ غلط.",
          "boyes مش الصيغة الصحيحة؛ نضيف s فقط."
        ]
      },
      {
        "q": "“Two children ____ playing.” — الاختيار الصحيح؟",
        "en": "Two children ____ playing.",
        "choices": [
          "is",
          "are",
          "am"
        ],
        "correct": 1,
        "why": "children هي جمع child حتى من غير s، وبالتالي نستخدم are.",
        "wrong": [
          "is للمفرد؛ children جمع.",
          "",
          "am مع I فقط."
        ]
      }
    ]
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
        "q": "“Sara and Laila are friends.” نستبدل الاسمين بإيه؟",
        "en": "Sara and Laila are friends.",
        "choices": [
          "She",
          "They",
          "It"
        ],
        "correct": 1,
        "why": "Sara and Laila شخصين، فضمير الفاعل المناسب They.",
        "wrong": [
          "She لشخص واحد مؤنث، لكن هنا شخصين.",
          "",
          "It لشيء/حيوان/موقف غالبًا، ومش لشخصين."
        ]
      },
      {
        "q": "“I know ____.” اختار ضمير المفعول المناسب لشخص مذكر.",
        "en": "I know ____.",
        "choices": [
          "he",
          "him",
          "his"
        ],
        "correct": 1,
        "why": "بعد know نحتاج ضمير مفعول؛ he يتحول لـ him.",
        "wrong": [
          "he ضمير فاعل، وهنا مكان المفعول.",
          "",
          "his يدل على الملكية، ومش ضمير المفعول المطلوب."
        ]
      },
      {
        "q": "اختار الجملة الصحيحة:",
        "choices": [
          "I am ready.",
          "I is ready.",
          "I are ready."
        ],
        "correct": 0,
        "why": "I مع فعل be في الحاضر بياخد am.",
        "wrong": [
          "",
          "is مع he/she/it والاسم المفرد، مش I.",
          "are مع you/we/they والجمع، مش I."
        ]
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
        "q": "في “He has finished.” كلمة has هنا …",
        "en": "He has finished.",
        "choices": [
          "فعل أساسي بمعنى يمتلك",
          "فعل مساعد",
          "اسم"
        ],
        "correct": 1,
        "why": "has بتساعد finished عشان نكوّن المضارع التام؛ معنى الحدث في finished.",
        "wrong": [
          "في He has a car تكون has أساسية، لكن هنا بعدها finished (V3) فمساعدة.",
          "",
          "has فعل، مش اسم."
        ]
      },
      {
        "q": "في “Mona does homework.” كلمة does هنا …",
        "en": "Mona does homework.",
        "choices": [
          "فعل أساسي",
          "فعل مساعد للسؤال",
          "حرف جر"
        ],
        "correct": 0,
        "why": "does هنا معناها تعمل الواجب، ومفيش فعل أساسي تاني؛ لذلك هي الفعل الأساسي.",
        "wrong": [
          "",
          "مفيش سؤال أو فعل آخر يحتاج مساعدة هنا؛ does هي الفعل الأساسي.",
          "does مش حرف جر؛ هي فعل."
        ]
      },
      {
        "q": "في “They are playing.” الفعل الأساسي هو …",
        "en": "They are playing.",
        "choices": [
          "They",
          "are",
          "playing"
        ],
        "correct": 2,
        "why": "playing يحمل معنى اللعب، وare هو المساعد المستخدم مع -ing.",
        "wrong": [
          "They ضمير الفاعل مش فعل.",
          "are فعل مساعد هنا، وplaying هو الفعل الأساسي.",
          ""
        ]
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
        "q": "التصريف الثالث (V3) من go هو …",
        "choices": [
          "went",
          "going",
          "gone"
        ],
        "correct": 2,
        "why": "go فعل غير منتظم: go (V1) / went (V2) / gone (V3).",
        "wrong": [
          "went هو الماضي البسيط V2، مش التصريف الثالث.",
          "going هو شكل ing، مش V3.",
          ""
        ]
      },
      {
        "q": "“Does Ali ____ English?”",
        "en": "Does Ali ____ English?",
        "choices": [
          "studies",
          "study",
          "studied"
        ],
        "correct": 1,
        "why": "بعد Does نرجّع الفعل الأساسي للمصدر V1: study.",
        "wrong": [
          "studies فيها ies زيادة؛ Does شايلة علامة المفرد.",
          "",
          "studied صيغة الماضي؛ بعد Does نحتاج المصدر."
        ]
      },
      {
        "q": "“She has ____.” (الفعل: finish)",
        "en": "She has ____.",
        "choices": [
          "finish",
          "finished",
          "finishes"
        ],
        "correct": 1,
        "why": "has هنا مساعد للمضارع التام وبعده V3: finished.",
        "wrong": [
          "finish هو V1، لكن has المساعدة تحتاج V3 هنا.",
          "",
          "finishes مضارع مفرد غائب؛ بعد has المساعدة نستخدم V3."
        ]
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
        "q": "اختار الجملة الصحيحة عن بنت واحدة:",
        "choices": [
          "The girl play tennis.",
          "The girl plays tennis.",
          "The girl playing tennis."
        ],
        "correct": 1,
        "why": "The girl مفرد غائب، وفي المضارع البسيط المثبت نستخدم plays.",
        "wrong": [
          "play بدون s يناسب الجمع أو I/you، لكن The girl مفرد غائب.",
          "",
          "playing وحدها محتاجة فعل مساعد عشان تكون فعلًا كاملًا."
        ]
      },
      {
        "q": "حوّل “The boys play.” لسؤال:",
        "en": "The boys play.",
        "choices": [
          "Does the boys play?",
          "Do the boys plays?",
          "Do the boys play?"
        ],
        "correct": 2,
        "why": "The boys جمع؛ نستخدم Do، وبعدها play في المصدر.",
        "wrong": [
          "Does مع مفرد غائب، بينما boys جمع.",
          "بعد Do الفعل الأساسي يكون في المصدر play، مش plays.",
          ""
        ]
      },
      {
        "q": "“Mona ____ at home every day.”",
        "en": "Mona ____ at home every day.",
        "choices": [
          "study",
          "studies",
          "studying"
        ],
        "correct": 1,
        "why": "Mona اسم مفرد غائب، وevery day عادة؛ نستخدم studies.",
        "wrong": [
          "study من غير ies مش مناسب للمفرد الغائب في الجملة المثبتة.",
          "",
          "studying وحدها محتاجة مساعد، وevery day هنا بتوصف عادة."
        ]
      },
      {
        "q": "أي سؤال مناسب لوصف “She is happy.”؟",
        "en": "She is happy.",
        "choices": [
          "Does she is happy?",
          "Is she happy?",
          "Do she happy?"
        ],
        "correct": 1,
        "why": "في جملة She is happy، is فعل رابط نقدر نقدمه قبل الفاعل: Is she happy?",
        "wrong": [
          "مينفعش نستخدم Does مع is بالشكل ده في السؤال العادي.",
          "",
          "Do مش بتيجي هنا قبل happy؛ عندنا is بالفعل."
        ]
      }
    ]
  }
];
