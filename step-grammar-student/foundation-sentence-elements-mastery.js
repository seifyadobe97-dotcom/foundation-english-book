"use strict";
// Rich instructor-authored explanation examples (never STEP exam items).
// Source question text/options are kept separate from this teaching-only model.
window.STEP_FOUNDATION_MASTERY={
  "sentence": {
    "goal": "من غير ما تحفظ اسم القاعدة، هتعرف تبص لأي جملة وتحدد مين الفاعل وإيه الفعل، وهل فيه مفعول ولا تكملة وصف.",
    "cards": [
      {
        "title": "أبدأ منين؟",
        "body": "<mark>الفعل</mark> بيقول لي بيحصل إيه، و<mark>الفاعل</mark> بيقول مين اللي بيعمل الفعل أو الجملة بتتكلم عنه. وجود المفعول مش شرط.",
        "tokens": [
          [
            "subject",
            "The children"
          ],
          [
            "main",
            "play"
          ],
          [
            "time",
            "every day"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "الأطفال هم الفاعل، play فعل أساسي، every day بتحدد التكرار."
      },
      {
        "title": "المفعول غير الخبر",
        "body": "لو الفعل بيؤثر في شيء، بنسمي الشيء <mark>مفعول به</mark>. أما بعد is/are مع وصف أو هوية فدي <mark>تكملة معنى</mark>.",
        "tokens": [
          [
            "subject",
            "Sara"
          ],
          [
            "main",
            "reads"
          ],
          [
            "object",
            "a book"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "book شيء وقع عليه فعل القراءة؛ لكن happy بعد is صفة للفاعل، مش مفعول."
      }
    ],
    "patterns": [
      {
        "title": "جملة بفعل حدث",
        "parts": [
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "main",
            "Verb",
            "فعل"
          ],
          [
            "object",
            "Object",
            "مفعول (عند الحاجة)"
          ]
        ],
        "tokens": [
          [
            "subject",
            "Mona"
          ],
          [
            "main",
            "reads"
          ],
          [
            "object",
            "books"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "في الجملة الإنجليزي نبدأ من الشمال: فاعل ثم فعل ثم المفعول إن وُجد."
      },
      {
        "title": "جملة بوصف الفاعل",
        "parts": [
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "aux",
            "Be",
            "فعل رابط"
          ],
          [
            "complement",
            "Complement",
            "وصف/هوية"
          ]
        ],
        "tokens": [
          [
            "subject",
            "Mona"
          ],
          [
            "aux",
            "is"
          ],
          [
            "complement",
            "happy"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "happy تكملة بتوصف Mona، مش مفعول به."
      }
    ],
    "table": {
      "title": "اسأل نفسك هذه الأسئلة",
      "headers": [
        "سؤال بسيط",
        "الإجابة من المثال",
        "النتيجة"
      ],
      "rows": [
        [
          "مين؟",
          "Mona",
          "Subject — فاعل"
        ],
        [
          "بتعمل إيه؟",
          "reads",
          "Main verb — فعل أساسي"
        ],
        [
          "بتقرأ إيه؟",
          "books",
          "Object — مفعول"
        ],
        [
          "فين/إمتى؟",
          "at home / every day",
          "معلومة إضافية"
        ]
      ]
    },
    "pitfalls": [
      {
        "bad": [
          [
            "subject",
            "Birds"
          ],
          [
            "main",
            "fly"
          ],
          [
            "object",
            "an object"
          ],
          [
            "punct",
            "."
          ]
        ],
        "good": [
          [
            "subject",
            "Birds"
          ],
          [
            "main",
            "fly"
          ],
          [
            "punct",
            "."
          ]
        ],
        "why": "مش لازم نحط مفعول في كل جملة؛ Birds fly جملة صحيحة مكتملة."
      }
    ]
  },
  "noun-number": {
    "goal": "قبل اختيار is/are أو do/does، افهم إذا كان الفاعل مفردًا أو جمعًا أو اسمًا غير معدود.",
    "cards": [
      {
        "title": "مفرد ولا جمع؟",
        "body": "<mark>اسم معدود واحد</mark> زي student مفرد، و<mark>أكثر من واحد</mark> زي students جمع. ما تعتمدش على حرف s وحده.",
        "tokens": [
          [
            "subject",
            "The students"
          ],
          [
            "aux",
            "are"
          ],
          [
            "complement",
            "ready"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "students جمع؛ عشان كده are."
      },
      {
        "title": "الاسم الأساسي مهم",
        "body": "في عبارة the box of pencils الاسم الرئيسي هو <mark>box</mark> حتى لو pencils جمع؛ الفعل بيتبع box المفرد.",
        "tokens": [
          [
            "subject",
            "The box of pencils"
          ],
          [
            "aux",
            "is"
          ],
          [
            "complement",
            "heavy"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "box هي رأس الفاعل المفرد؛ لذلك is."
      }
    ],
    "patterns": [
      {
        "title": "مفرد",
        "parts": [
          [
            "subject",
            "Singular subject",
            "فاعل مفرد"
          ],
          [
            "aux",
            "is",
            "مع be"
          ]
        ],
        "tokens": [
          [
            "subject",
            "The student"
          ],
          [
            "aux",
            "is"
          ],
          [
            "complement",
            "ready"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "student شخص واحد."
      },
      {
        "title": "جمع",
        "parts": [
          [
            "subject",
            "Plural subject",
            "فاعل جمع"
          ],
          [
            "aux",
            "are",
            "مع be"
          ]
        ],
        "tokens": [
          [
            "subject",
            "The students"
          ],
          [
            "aux",
            "are"
          ],
          [
            "complement",
            "ready"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "students أكثر من واحد."
      }
    ],
    "table": {
      "title": "مش كل اسم ينتهي بـ s يبقى جمع",
      "headers": [
        "الاسم",
        "النوع",
        "اختيار الفعل الصحيح"
      ],
      "rows": [
        [
          "student",
          "مفرد معدود",
          "is / does"
        ],
        [
          "students",
          "جمع معدود",
          "are / do"
        ],
        [
          "child → children",
          "جمع غير منتظم",
          "are / do"
        ],
        [
          "information / advice",
          "غير معدود",
          "is / does (في الاستخدام المعتاد)"
        ],
        [
          "news",
          "اسم شكله s لكنه مفرد نحويًا",
          "is"
        ]
      ]
    },
    "pitfalls": [
      {
        "bad": [
          [
            "subject",
            "The children"
          ],
          [
            "aux",
            "is"
          ],
          [
            "complement",
            "here"
          ],
          [
            "punct",
            "."
          ]
        ],
        "good": [
          [
            "subject",
            "The children"
          ],
          [
            "aux",
            "are"
          ],
          [
            "complement",
            "here"
          ],
          [
            "punct",
            "."
          ]
        ],
        "why": "children جمع child حتى لو مش منتهي بـ s."
      }
    ]
  },
  "plural-rules": {
    "goal": "فرّق بين s اللي بتزودها على الاسم عشان يبقى جمع، وs اللي بتزودها للفعل مع he/she/it.",
    "cards": [
      {
        "title": "جمع الاسم",
        "body": "book → books يعني <mark>أكثر من كتاب</mark>. وتكوين الجمع فيه حالات شاذة، ومش كل اسم بيتجمع بـ s.",
        "tokens": [
          [
            "subject",
            "Two students"
          ],
          [
            "main",
            "study"
          ],
          [
            "object",
            "English"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "Two students جمع؛ عشان كده فعل المضارع البسيط من غير s."
      },
      {
        "title": "s الفعل مش جمع",
        "body": "مع فاعل مفرد غائب في المضارع البسيط المثبت <mark>الفعل</mark> غالبًا بياخد s: student plays.",
        "tokens": [
          [
            "subject",
            "One student"
          ],
          [
            "main",
            "studies"
          ],
          [
            "object",
            "English"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "studies هنا فعل مفرد غائب، مش اسم جمع."
      }
    ],
    "patterns": [
      {
        "title": "s على الاسم",
        "parts": [
          [
            "subject",
            "students",
            "اسم جمع"
          ],
          [
            "main",
            "play",
            "فعل بدون s"
          ]
        ],
        "tokens": [
          [
            "subject",
            "The students"
          ],
          [
            "main",
            "play"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "طلاب كثيرون = students. الفعل هنا play."
      },
      {
        "title": "s على الفعل",
        "parts": [
          [
            "subject",
            "student",
            "اسم مفرد"
          ],
          [
            "main",
            "plays",
            "فعل بإضافة s"
          ]
        ],
        "tokens": [
          [
            "subject",
            "The student"
          ],
          [
            "main",
            "plays"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "طالب واحد = student. الفعل هنا plays."
      }
    ],
    "table": {
      "title": "ملخص قواعد جمع الاسم",
      "headers": [
        "النمط",
        "مفرد → جمع",
        "خد بالك"
      ],
      "rows": [
        [
          "غالبية الأسماء",
          "book → books",
          "s"
        ],
        [
          "نهايات x / sh / ch / ss",
          "box → boxes / watch → watches",
          "es"
        ],
        [
          "ساكن + y",
          "city → cities",
          "نشيل y ونضيف ies"
        ],
        [
          "متحرك + y",
          "boy → boys",
          "نضيف s فقط"
        ],
        [
          "جمع غير منتظم",
          "child → children / man → men",
          "نحفظه"
        ],
        [
          "نفس شكل المفرد",
          "sheep → sheep",
          "العدد يتعرف من السياق"
        ]
      ]
    },
    "pitfalls": [
      {
        "bad": [
          [
            "subject",
            "The boys"
          ],
          [
            "main",
            "plays"
          ],
          [
            "punct",
            "."
          ]
        ],
        "good": [
          [
            "subject",
            "The boys"
          ],
          [
            "main",
            "play"
          ],
          [
            "punct",
            "."
          ]
        ],
        "why": "boys اسم جمع، ومش بنضيف s للفعل مع الجمع في المضارع البسيط المثبت."
      }
    ]
  },
  "pronouns": {
    "goal": "اتعلم الضمير المناسب، وهل مكانه فاعل ولا مفعول، وليه I وYou حالات خاصة في التصريف.",
    "cards": [
      {
        "title": "ضمير الفاعل",
        "body": "بنحط <mark>he/she/it</mark> بدل اسم مفرد غائب. مع he/she/it الفعل الأساسي بياخد s غالبًا في المضارع البسيط المثبت.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "main",
            "studies"
          ],
          [
            "object",
            "English"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "She = Mona؛ وstudies فعل مفرد غائب."
      },
      {
        "title": "ضمير المفعول",
        "body": "بعد أفعال زي know وhelp بنحتاج <mark>him/her/them</mark> لما الضمير يكون مفعولًا، مش he/she/they.",
        "tokens": [
          [
            "subject",
            "I"
          ],
          [
            "main",
            "know"
          ],
          [
            "object",
            "him"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "I ضمير فاعل، him ضمير مفعول."
      }
    ],
    "patterns": [
      {
        "title": "فاعل → فعل → مفعول",
        "parts": [
          [
            "subject",
            "Subject pronoun",
            "ضمير فاعل"
          ],
          [
            "main",
            "Main verb",
            "فعل أساسي"
          ],
          [
            "object",
            "Object pronoun",
            "ضمير مفعول"
          ]
        ],
        "tokens": [
          [
            "subject",
            "We"
          ],
          [
            "main",
            "help"
          ],
          [
            "object",
            "them"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "اتبع اتجاه الإنجليزية من اليسار لليمين عند تركيب الجملة."
      }
    ],
    "table": {
      "title": "الضمائر: فاعل ومفعول وملكية",
      "headers": [
        "فاعل Subject",
        "مفعول Object",
        "صفة ملكية Possessive"
      ],
      "rows": [
        [
          "I",
          "me",
          "my"
        ],
        [
          "you",
          "you",
          "your"
        ],
        [
          "he",
          "him",
          "his"
        ],
        [
          "she",
          "her",
          "her"
        ],
        [
          "it",
          "it",
          "its"
        ],
        [
          "we",
          "us",
          "our"
        ],
        [
          "they",
          "them",
          "their"
        ]
      ]
    },
    "pitfalls": [
      {
        "bad": [
          [
            "subject",
            "He"
          ],
          [
            "main",
            "know"
          ],
          [
            "object",
            "she"
          ],
          [
            "punct",
            "."
          ]
        ],
        "good": [
          [
            "subject",
            "He"
          ],
          [
            "main",
            "knows"
          ],
          [
            "object",
            "her"
          ],
          [
            "punct",
            "."
          ]
        ],
        "why": "He مفرد غائب فالفعل knows، وher هنا مفعول؛ she ضمير فاعل."
      }
    ]
  },
  "verb-roles": {
    "goal": "أهم محطة: نفس الكلمة be أو do أو have ممكن تكون فعلًا أساسيًا أو فعلًا مساعدًا. هنشوف وظيفة كل واحدة في الجملة.",
    "cards": [
      {
        "title": "الفعل الأساسي Main verb",
        "body": "هو اللي بيحمل معنى الحدث أو الحالة: <mark>work = يعمل</mark>، <mark>need = يحتاج</mark>. ولو be ربطت الفاعل بوصف، تبقى فعلًا رئيسيًا رابطًا.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "main",
            "works"
          ],
          [
            "time",
            "every day"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "works هي الحدث الرئيسي؛ مفيش مساعد هنا."
      },
      {
        "title": "الفعل المساعد Auxiliary verb",
        "body": "بيساعد فعلًا تاني لتكوين <mark>الزمن</mark> أو <mark>النفي</mark> أو <mark>السؤال</mark>. دور الكلمة يتحدد من مكانها ووظيفتها.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "is"
          ],
          [
            "main",
            "studying"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "is مساعد، وstudying شايل معنى المذاكرة."
      },
      {
        "title": "BE — فعل أساسي رابط",
        "body": "لما نقول <mark>She is happy</mark>، is معناها أنها في حالة السعادة وبتربط الفاعل بوصف. نسأل Is she happy? وننفي She isn't happy.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "is"
          ],
          [
            "complement",
            "happy"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "is هنا فعل رابط أساسي؛ مفيش فعل آخر بعده."
      },
      {
        "title": "BE — مساعد",
        "body": "مع <mark>be + ing</mark> بنكوّن الاستمرار، ومع <mark>be + V3</mark> بنكوّن المبني للمجهول.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "is"
          ],
          [
            "main",
            "studying"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "is مساعد للمضارع المستمر؛ studying هو الفعل الأساسي."
      },
      {
        "title": "DO — فعل أساسي",
        "body": "<mark>do = يعمل/يؤدي</mark>. في She does homework الكلمة does نفسها هي الفعل الأساسي.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "main",
            "does"
          ],
          [
            "object",
            "her homework"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "does معناها تؤدي الواجب؛ مفيش فعل رئيسي تاني."
      },
      {
        "title": "DO — مساعد",
        "body": "مع المضارع البسيط والماضي البسيط نستخدم <mark>do/does/did</mark> في السؤال أو النفي لما الفعل الأساسي مش be أو مساعد آخر.",
        "tokens": [
          [
            "aux",
            "Does"
          ],
          [
            "subject",
            "she"
          ],
          [
            "main",
            "study"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "detail": "Does مساعد سؤال؛ study مصدر. ما نقولش Does she studies."
      },
      {
        "title": "HAVE — فعل أساسي",
        "body": "<mark>have = يمتلك/عنده</mark> أو معاني أخرى حسب السياق. في She has a car كلمة has أساسية.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "main",
            "has"
          ],
          [
            "object",
            "a car"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "has هنا معناها عندها سيارة."
      },
      {
        "title": "HAVE — مساعد",
        "body": "في <mark>have/has/had + V3</mark> تبقى have مساعدة لتكوين الأزمنة التامة.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "has"
          ],
          [
            "main",
            "finished"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "has مساعد للمضارع التام؛ finished هو الحدث."
      }
    ],
    "patterns": [
      {
        "title": "BE كمساعد",
        "parts": [
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "aux",
            "is / are / was",
            "BE مساعد"
          ],
          [
            "main",
            "verb + ing",
            "فعل أساسي"
          ]
        ],
        "tokens": [
          [
            "subject",
            "They"
          ],
          [
            "aux",
            "are"
          ],
          [
            "main",
            "studying"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "They are studying = هم بيذاكروا الآن."
      },
      {
        "title": "HAVE كمساعد",
        "parts": [
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "aux",
            "has / have / had",
            "HAVE مساعد"
          ],
          [
            "main",
            "V3",
            "التصريف الثالث"
          ]
        ],
        "tokens": [
          [
            "subject",
            "He"
          ],
          [
            "aux",
            "has"
          ],
          [
            "main",
            "finished"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "He has finished = هو خلص (فعل تام)."
      },
      {
        "title": "DO في السؤال",
        "parts": [
          [
            "aux",
            "Do / Does / Did",
            "مساعد السؤال"
          ],
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "main",
            "V1",
            "الفعل المصدر"
          ]
        ],
        "tokens": [
          [
            "aux",
            "Does"
          ],
          [
            "subject",
            "he"
          ],
          [
            "main",
            "play"
          ],
          [
            "object",
            "football"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "note": "بعد Does وDid الفعل يرجع للمصدر."
      }
    ],
    "table": {
      "title": "جدول مصيري: نفس الكلمة وأدوار مختلفة",
      "headers": [
        "الكلمة",
        "كفعل أساسي Main",
        "كفعل مساعد Auxiliary"
      ],
      "rows": [
        [
          "be",
          "She is happy. — ربط بوصف",
          "She is reading. — be + ing"
        ],
        [
          "do",
          "She does homework. — تؤدي",
          "Does she study? — أداة سؤال"
        ],
        [
          "have",
          "She has a book. — تمتلك",
          "She has finished. — have + V3"
        ],
        [
          "في السؤال",
          "Is she happy? / Does she have a book?",
          "Is she reading? / Has she finished?"
        ],
        [
          "في النفي",
          "She isn't happy. / She doesn't have a book.",
          "She isn't reading. / She hasn't finished."
        ]
      ]
    },
    "pitfalls": [
      {
        "bad": [
          [
            "aux",
            "Does"
          ],
          [
            "subject",
            "she"
          ],
          [
            "main",
            "studies"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "good": [
          [
            "aux",
            "Does"
          ],
          [
            "subject",
            "she"
          ],
          [
            "main",
            "study"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "why": "Does أخدت علامة المفرد؛ بعد المساعد لازم مصدر study."
      },
      {
        "bad": [
          [
            "subject",
            "She"
          ],
          [
            "neg",
            "doesn't"
          ],
          [
            "aux",
            "has"
          ],
          [
            "object",
            "a car"
          ],
          [
            "punct",
            "."
          ]
        ],
        "good": [
          [
            "subject",
            "She"
          ],
          [
            "neg",
            "doesn't"
          ],
          [
            "main",
            "have"
          ],
          [
            "object",
            "a car"
          ],
          [
            "punct",
            "."
          ]
        ],
        "why": "لما have معناها تمتلك في المضارع البسيط، نستخدم doesn't + have، مش doesn't + has."
      },
      {
        "bad": [
          [
            "aux",
            "Does"
          ],
          [
            "subject",
            "she"
          ],
          [
            "aux",
            "is"
          ],
          [
            "complement",
            "ready"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "good": [
          [
            "aux",
            "Is"
          ],
          [
            "subject",
            "she"
          ],
          [
            "complement",
            "ready"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "why": "مع be كرابط بوصف نعمل السؤال بتقديم is مباشرة، من غير do."
      }
    ]
  },
  "verb-forms": {
    "goal": "اعرف شكل V1 وV2 وV3 و-ing، وتصريف be/do/have حسب الضمير والزمن عشان تختار المساعد والفعل صح.",
    "cards": [
      {
        "title": "التصريفات الخمسة",
        "body": "مصدر <mark>V1</mark>، ماضي <mark>V2</mark>، تصريف ثالث <mark>V3</mark>، شكل <mark>ing</mark>، وصيغة المفرد الغائب s/es/ies. دي أشكال للفعل مش خمسة أزمنة منفصلة.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "has"
          ],
          [
            "main",
            "gone"
          ],
          [
            "time",
            "home"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "has + gone (V3) → مضارع تام. go/went/gone فعل غير منتظم."
      },
      {
        "title": "BE يتغيّر حسب الفاعل",
        "body": "في الحاضر <mark>I am</mark> و<mark>he/she/it is</mark> و<mark>you/we/they are</mark>. في الماضي <mark>was/were</mark>.",
        "tokens": [
          [
            "subject",
            "They"
          ],
          [
            "aux",
            "were"
          ],
          [
            "complement",
            "ready"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "were مع الجمع أو you في الماضي."
      },
      {
        "title": "DO وHAVE",
        "body": "مع المفرد الغائب نقول <mark>does</mark> و<mark>has</mark>، ومع الماضي نقول <mark>did</mark> و<mark>had</mark>.",
        "tokens": [
          [
            "subject",
            "He"
          ],
          [
            "aux",
            "has"
          ],
          [
            "main",
            "studied"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "has مساعد وstudied تصريف ثالث (V3)."
      },
      {
        "title": "بعد المساعد بنختار التصريف",
        "body": "<mark>do/does/did + V1</mark>، و<mark>have/has/had + V3</mark>، و<mark>be + ing</mark> في المستمر.",
        "tokens": [
          [
            "aux",
            "Did"
          ],
          [
            "subject",
            "he"
          ],
          [
            "main",
            "go"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "detail": "بعد Did ما ينفعش went؛ لازم go (المصدر)."
      }
    ],
    "patterns": [
      {
        "title": "النفي والسؤال مع DO",
        "parts": [
          [
            "aux",
            "Does",
            "مساعد"
          ],
          [
            "subject",
            "she",
            "فاعل"
          ],
          [
            "main",
            "play",
            "مصدر V1"
          ]
        ],
        "tokens": [
          [
            "aux",
            "Does"
          ],
          [
            "subject",
            "she"
          ],
          [
            "main",
            "play"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "note": "She doesn't play. | Does she play?"
      },
      {
        "title": "الزمن المستمر",
        "parts": [
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "aux",
            "am/is/are",
            "BE مساعد"
          ],
          [
            "main",
            "V-ing",
            "فعل + ing"
          ]
        ],
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "is"
          ],
          [
            "main",
            "reading"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "She isn't reading. | Is she reading?"
      },
      {
        "title": "الزمن التام",
        "parts": [
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "aux",
            "has/have",
            "HAVE مساعد"
          ],
          [
            "main",
            "V3",
            "تصريف ثالث"
          ]
        ],
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "has"
          ],
          [
            "main",
            "finished"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "She hasn't finished. | Has she finished?"
      }
    ],
    "table": {
      "title": "جدول التصريفات — قابل للمراجعة السريعة",
      "headers": [
        "الفعل V1",
        "Past V2",
        "V3",
        "-ing",
        "He/She/It في الحاضر"
      ],
      "rows": [
        [
          "play",
          "played",
          "played",
          "playing",
          "plays"
        ],
        [
          "study",
          "studied",
          "studied",
          "studying",
          "studies"
        ],
        [
          "go",
          "went",
          "gone",
          "going",
          "goes"
        ],
        [
          "do",
          "did",
          "done",
          "doing",
          "does"
        ],
        [
          "have",
          "had",
          "had",
          "having",
          "has"
        ],
        [
          "be",
          "was/were",
          "been",
          "being",
          "am/is/are"
        ]
      ]
    },
    "pitfalls": [
      {
        "bad": [
          [
            "aux",
            "Did"
          ],
          [
            "subject",
            "he"
          ],
          [
            "main",
            "went"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "good": [
          [
            "aux",
            "Did"
          ],
          [
            "subject",
            "he"
          ],
          [
            "main",
            "go"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "why": "Did نفسها ماضي؛ بعدها V1 وهو go مش went."
      },
      {
        "bad": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "has"
          ],
          [
            "main",
            "went"
          ],
          [
            "punct",
            "."
          ]
        ],
        "good": [
          [
            "subject",
            "She"
          ],
          [
            "aux",
            "has"
          ],
          [
            "main",
            "gone"
          ],
          [
            "punct",
            "."
          ]
        ],
        "why": "بعد has المساعدة نستخدم التصريف الثالث gone، مش الماضي went."
      }
    ]
  },
  "build": {
    "goal": "دلوقتي هنربط كل اللي فات: حدّد الفاعل، وشوف لو فيه مساعد، وقرّر إثبات ولا نفي ولا سؤال، وبعدها اختار تصريف الفعل.",
    "cards": [
      {
        "title": "ابدأ بالمساعد الموجود",
        "body": "لو لقيت <mark>is/are</mark> كفعل رابط أو مساعد، متدخلش do/does من غير سبب. ولو لقيت <mark>has + V3</mark> يبقى عندك زمن تام.",
        "tokens": [
          [
            "aux",
            "Is"
          ],
          [
            "subject",
            "she"
          ],
          [
            "complement",
            "ready"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "detail": "مع is كرابط وصف، بنقدم is للسؤال."
      },
      {
        "title": "المفرد والجمع",
        "body": "الفعل الأساسي في المضارع البسيط المثبت بياخد s مع <mark>he/she/it</mark>. لكن في النفي والسؤال المساعد بيشيل العلامة والفعل يرجع مصدر.",
        "tokens": [
          [
            "aux",
            "Does"
          ],
          [
            "subject",
            "your brother"
          ],
          [
            "main",
            "play"
          ],
          [
            "object",
            "football"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "detail": "your brother مفرد؛ Does + مصدر play."
      },
      {
        "title": "Modal = مساعد ناقص",
        "body": "<mark>can/should/must/will/may/might</mark> مش بنضيف لها s مع she، وبعدها مصدر من غير to في القاعدة العامة.",
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "modal",
            "can"
          ],
          [
            "main",
            "swim"
          ],
          [
            "punct",
            "."
          ]
        ],
        "detail": "can مساعد ناقص؛ swim فعل أساسي مصدر."
      }
    ],
    "patterns": [
      {
        "title": "إثبات بسيط",
        "parts": [
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "main",
            "Verb",
            "فعل"
          ],
          [
            "object",
            "Object",
            "مفعول/تكملة"
          ]
        ],
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "main",
            "studies"
          ],
          [
            "object",
            "English"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "She studies English every day."
      },
      {
        "title": "نفي بسيط",
        "parts": [
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "neg",
            "doesn't",
            "أداة نفي"
          ],
          [
            "main",
            "V1",
            "مصدر"
          ]
        ],
        "tokens": [
          [
            "subject",
            "She"
          ],
          [
            "neg",
            "doesn't"
          ],
          [
            "main",
            "study"
          ],
          [
            "object",
            "English"
          ],
          [
            "punct",
            "."
          ]
        ],
        "note": "بعد doesn't نرجع للفعل study."
      },
      {
        "title": "سؤال بسيط",
        "parts": [
          [
            "aux",
            "Does",
            "مساعد"
          ],
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "main",
            "V1",
            "مصدر"
          ]
        ],
        "tokens": [
          [
            "aux",
            "Does"
          ],
          [
            "subject",
            "she"
          ],
          [
            "main",
            "study"
          ],
          [
            "object",
            "English"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "note": "المساعد قبل الفاعل، والفعل مصدر."
      },
      {
        "title": "سؤال modal",
        "parts": [
          [
            "modal",
            "Can",
            "مساعد ناقص"
          ],
          [
            "subject",
            "Subject",
            "فاعل"
          ],
          [
            "main",
            "V1",
            "مصدر"
          ]
        ],
        "tokens": [
          [
            "modal",
            "Can"
          ],
          [
            "subject",
            "she"
          ],
          [
            "main",
            "swim"
          ],
          [
            "punct",
            "?"
          ]
        ],
        "note": "لا نستخدم does مع can."
      }
    ],
    "table": {
      "title": "اختار طريقة النفي والسؤال الصح",
      "headers": [
        "النوع",
        "إثبات +",
        "نفي −",
        "سؤال ؟"
      ],
      "rows": [
        [
          "مضارع بسيط (فعل عادي)",
          "She plays.",
          "She doesn't play.",
          "Does she play?"
        ],
        [
          "BE كرابط",
          "She is ready.",
          "She isn't ready.",
          "Is she ready?"
        ],
        [
          "مستمر BE + ing",
          "She is studying.",
          "She isn't studying.",
          "Is she studying?"
        ],
        [
          "HAVE مساعد + V3",
          "She has finished.",
          "She hasn't finished.",
          "Has she finished?"
        ],
        [
          "HAVE أساسي = يمتلك",
          "She has a book.",
          "She doesn't have a book.",
          "Does she have a book?"
        ],
        [
          "Modal can",
          "She can swim.",
          "She cannot swim.",
          "Can she swim?"
        ]
      ]
    },
    "pitfalls": [
      {
        "bad": [
          [
            "subject",
            "She"
          ],
          [
            "modal",
            "cans"
          ],
          [
            "main",
            "swim"
          ],
          [
            "punct",
            "."
          ]
        ],
        "good": [
          [
            "subject",
            "She"
          ],
          [
            "modal",
            "can"
          ],
          [
            "main",
            "swim"
          ],
          [
            "punct",
            "."
          ]
        ],
        "why": "الأفعال الناقصة زي can مش بتاخد s مع he/she/it."
      },
      {
        "bad": [
          [
            "subject",
            "She"
          ],
          [
            "neg",
            "doesn't"
          ],
          [
            "modal",
            "can"
          ],
          [
            "main",
            "swim"
          ],
          [
            "punct",
            "."
          ]
        ],
        "good": [
          [
            "subject",
            "She"
          ],
          [
            "modal",
            "cannot"
          ],
          [
            "main",
            "swim"
          ],
          [
            "punct",
            "."
          ]
        ],
        "why": "modal can بتنفي بنفسها: cannot / can't، مش doesn't can."
      }
    ],
    "modal": {
      "title": "الأفعال الناقصة — افهم معناها واستخدامها",
      "intro": "اسمها ناقصة (Modal Auxiliaries) لأنها مش بتكفي لوحدها في الاستخدام المعتاد، وبتساعد فعلًا أساسيًا على التعبير عن قدرة أو احتمال أو نصيحة أو إلزام أو مستقبل. وبتيجي قبل الفعل الأساسي.",
      "headers": [
        "المساعد الناقص",
        "المعنى الأقرب",
        "مثال",
        "النفي / الملاحظة"
      ],
      "rows": [
        [
          "can",
          "يستطيع / يُسمح له",
          "She can swim.",
          "cannot / can't"
        ],
        [
          "could",
          "كان يستطيع / احتمال أو طلب مهذب",
          "Could you help me?",
          "couldn't"
        ],
        [
          "may",
          "احتمال أو سماح رسمي",
          "It may rain.",
          "may not"
        ],
        [
          "might",
          "احتمال (غالبًا أقل تأكيدًا حسب السياق)",
          "He might come.",
          "might not"
        ],
        [
          "should",
          "نصيحة / توقع",
          "You should study.",
          "shouldn't"
        ],
        [
          "must",
          "ضرورة قوية / استنتاج قوي",
          "You must wear a seat belt.",
          "mustn't = ممنوع"
        ],
        [
          "will",
          "مستقبل / إرادة",
          "She will study.",
          "won't"
        ],
        [
          "would",
          "طلب مهذب / حالة افتراضية",
          "Would you help me?",
          "wouldn't"
        ]
      ],
      "rules": [
        "بعد modal نستخدم الفعل في المصدر بدون to في الاستخدام العادي: She can go. مش She can goes ولا She can to go.",
        "السؤال: Modal + Subject + V1 ? مثل Can she swim? والنفي: Subject + Modal + not + V1 مثل She cannot swim.",
        "mustn't معناها ممنوع؛ لكن don't have to معناها مش ضروري. الاتنين مش نفس المعنى.",
        "تعبيرات have to و need to مهمة لكنها مش من مجموعة modals الأساسية بنفس القاعدة. مثل She has to go. / She doesn't have to go.",
        "في مستويات أعلى: modal + have + V3 للماضي مثل She should have studied؛ دي قاعدة متقدمة، ومش معناها إن should لوحدها زمن ماضي."
      ]
    }
  }
};
