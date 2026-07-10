import { ko as dfKo, enUS as dfEn, zhCN as dfZh } from "date-fns/locale";
import type { Locale } from "date-fns";

export type Language = "ko" | "en" | "zh";

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
];

export const STT_LOCALES: Record<Language, string> = {
  ko: "ko-KR",
  en: "en-US",
  zh: "zh-CN",
};

export const DATE_LOCALES: Record<Language, Locale> = {
  ko: dfKo,
  en: dfEn,
  zh: dfZh,
};

export interface Translation {
  home: {
    titleLine1: string;
    titleLine2: string;
    subtitle1: string;
    subtitle2: string;
    start: string;
    preparing: string;
    pastSheep: string;
    privacy: string;
  };
  session: {
    opening: string;
    step2Q: string;
    step3Q: string;
    step4Q: string;
    step5Q: string;
    step5_5Q: string;
    step6Default: string;
    fallbackGoodnight: string;
    listening: string;
    sheepSpeaking: string;
    thinking: string;
    micOff: string;
    textPlaceholder: string;
  };
  sleep: {
    making: string;
    timeoutError: string;
    goHome: string;
  };
  rest: {
    emotionTitle: string;
    defaultSummary: string;
    closeEyes1: string;
    closeEyes2: string;
    musicNote: string;
    goodNight: string;
    screenOn: string;
  };
  history: {
    eyebrow: string;
    title: string;
    countText: (n: number) => string;
    loading: string;
    emptyTitle: string;
    emptySub: string;
    makeToday: string;
    calendarView: string;
    gridView: string;
    prevPage: string;
    nextPage: string;
    weekdays: string[];
    monthFormat: string;
    dayFormat: string;
    othersSuffix: (n: number) => string;
    tapHint: string;
  };
  sheepResult: {
    eyebrow: string;
    dateFormat: string;
    notFound: string;
    goHome: string;
    noImage: string;
    emotionLabel: string;
    personalityLabel: string;
    talkTitle: string;
    talkCount: (n: number) => string;
    sleepNow: string;
    keepCollection: string;
    home: string;
  };
  conversation: {
    eyebrow: string;
    back: string;
    dateFormat: string;
    sheepLabel: string;
    empty: string;
    notFound: string;
    goHome: string;
  };
  settings: {
    title: string;
    language: string;
    theme: string;
    night: string;
    day: string;
    themeHintNight: string;
    themeHintDay: string;
  };
}

export const translations: Record<Language, Translation> = {
  ko: {
    home: {
      titleLine1: "오늘 하루,",
      titleLine2: "양에게 들려주세요",
      subtitle1: "눈을 감기 전, 작은 양이",
      subtitle2: "당신의 이야기를 기다리고 있어요.",
      start: "수면 시작",
      preparing: "준비하는 중...",
      pastSheep: "지난 양들",
      privacy: "음성 파일은 저장되지 않아요. 대화 텍스트만 양 생성을 위해 보관됩니다.",
    },
    session: {
      opening: "오늘 하루는 어떠셨나요.",
      step2Q:
        " 머릿속을 가볍게 비우고 잠에 들기 위해, 가장 신경 쓰였지만 해결하지 못한 문제 딱 하나만 편하게 말씀해 주시겠어요. 없으시다면 없다라고 편하게 이야기해 주세요.",
      step3Q:
        " 적어주신 그 문제는 지금 당장 해결할 수 있는 일인가요. 만약 당장 해결하기 어렵다면 왜 그런지, 반대로 내일 해결할 수 있다면 내일 아침 가장 먼저 해볼 아주 작은 행동 하나만 알려주세요.",
      step4Q:
        " 다음으로는 오늘 스스로에게 잘했다고 칭찬해 주고 싶은 아주 작은 성취가 있다면 하나만 공유해 주세요. 정말 작아도 좋고, 만약 떠오르지 않는다면 없다고 쿨하게 넘어가셔도 좋습니다.",
      step5Q:
        " 오늘 하루를 돌아보며 픽 웃음이 났던 순간이 있었나요. 없으셨다면, 어떤 일이 일어났을 때 가장 기분 좋게 웃으실 수 있을지 자유롭게 상상해서 말씀해 주세요.",
      step5_5Q:
        " 떠올려주신 기억에 기분 좋은 에너지를 담아, 오늘 밤 사용자님을 지켜줄 예쁜 양을 한 마리 만들려고 해요. 이 양에게 가장 입혀주고 싶은 포근한 색깔이나 촉감이 있다면 하나만 골라주시겠어요.",
      step6Default: "포근한 양을 만들어드릴게요. 이제 눈을 감고 편안한 밤 되세요.",
      fallbackGoodnight: "편안한 밤 되세요.",
      listening: "듣고 있어요",
      sheepSpeaking: "양이 말하는 중",
      thinking: "생각하고 있어요",
      micOff: "마이크가 꺼져 있습니다",
      textPlaceholder: "텍스트로 대답하기...",
    },
    sleep: {
      making: "오늘의 양을 만들고 있어요",
      timeoutError: "양을 만드는 데 너무 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.",
      goHome: "홈으로 돌아가기",
    },
    rest: {
      emotionTitle: "오늘의 감정 정리",
      defaultSummary: "오늘 하루도 잘 견뎌냈어요.",
      closeEyes1: "이제 눈을 감고",
      closeEyes2: "편안히 잠들어도 좋아요.",
      musicNote: "잔잔한 음악과 함께 화면이 천천히 어두워져요",
      goodNight: "잘 자요",
      screenOn: "화면 켜기",
    },
    history: {
      eyebrow: "나의 양떼",
      title: "모아 둔 양들",
      countText: (n) => `지금까지 ${n}마리를 재웠어요`,
      loading: "양들을 불러오는 중...",
      emptyTitle: "아직 만들어진 양이 없습니다.",
      emptySub: "오늘 밤 첫 번째 양을 만들어보세요.",
      makeToday: "오늘의 양 만들기",
      calendarView: "달력으로 보기",
      gridView: "모아 보기",
      prevPage: "이전 페이지",
      nextPage: "다음 페이지",
      weekdays: ["일", "월", "화", "수", "목", "금", "토"],
      monthFormat: "yyyy년 M월",
      dayFormat: "M월 d일",
      othersSuffix: (n) => ` 외 ${n}마리`,
      tapHint: "날짜를 눌러 그날의 양을 다시 만나보세요",
    },
    sheepResult: {
      dateFormat: "yyyy년 M월 d일",
      notFound: "양을 찾을 수 없습니다.",
      goHome: "홈으로 돌아가기",
      noImage: "이미지가 없습니다",
      emotionLabel: "감정",
      personalityLabel: "성격",
      talkTitle: "오늘 밤 나눈 이야기",
      eyebrow: "오늘의 양",
      talkCount: (n) => `대화 ${n}개 보기`,
      sleepNow: "이제 잠들기",
      keepCollection: "컬렉션에 보관",
      home: "홈으로",
    },
    conversation: {
      eyebrow: "오늘 밤의 대화",
      back: "뒤로",
      dateFormat: "yyyy년 M월 d일",
      sheepLabel: "양",
      empty: "나눈 이야기가 없어요.",
      notFound: "양을 찾을 수 없습니다.",
      goHome: "홈으로 돌아가기",
    },
    settings: {
      title: "설정",
      language: "언어",
      theme: "화면 모드",
      night: "밤",
      day: "낮",
      themeHintNight: "깊은 밤하늘 아래에서",
      themeHintDay: "포근한 베이지빛 아래에서",
    },
  },
  en: {
    home: {
      titleLine1: "Tell the sheep",
      titleLine2: "about your day",
      subtitle1: "Before you close your eyes,",
      subtitle2: "a little sheep is waiting for your story.",
      start: "Start winding down",
      preparing: "Getting ready...",
      pastSheep: "Past sheep",
      privacy: "Voice audio is never stored. Only the conversation text is kept to create your sheep.",
    },
    session: {
      opening: "How was your day today.",
      step2Q:
        " To clear your mind before sleep, would you share just one thing that weighed on you today and remains unresolved. If there is nothing, feel free to simply say so.",
      step3Q:
        " Is that something you can solve right now. If it is hard to solve for now, tell me why. If it can wait until tomorrow, tell me one tiny first step you could take in the morning.",
      step4Q:
        " Next, if there is one small thing you did today that deserves a little praise, please share it. It can be truly tiny, and if nothing comes to mind, it is perfectly fine to pass.",
      step5Q:
        " Looking back on today, was there a moment that made you quietly smile. If not, feel free to imagine what would make you smile the most.",
      step5_5Q:
        " With the warm energy of that memory, I will make a lovely sheep to watch over you tonight. Is there one cozy color or texture you would like this sheep to wear.",
      step6Default: "I will make you a cozy sheep now. Close your eyes and have a peaceful night.",
      fallbackGoodnight: "Have a peaceful night.",
      listening: "Listening",
      sheepSpeaking: "The sheep is speaking",
      thinking: "Thinking",
      micOff: "Microphone is off",
      textPlaceholder: "Reply with text...",
    },
    sleep: {
      making: "Making tonight's sheep",
      timeoutError: "Making your sheep is taking too long. Please try again in a moment.",
      goHome: "Back to home",
    },
    rest: {
      emotionTitle: "Tonight's emotions",
      defaultSummary: "You made it through another day.",
      closeEyes1: "Now close your eyes",
      closeEyes2: "and drift off gently.",
      musicNote: "The screen will slowly dim with calm music",
      goodNight: "Good night",
      screenOn: "Wake screen",
    },
    history: {
      eyebrow: "My Flock",
      title: "My flock",
      countText: (n) => `${n} sheep put to sleep so far`,
      loading: "Gathering the sheep...",
      emptyTitle: "No sheep have been made yet.",
      emptySub: "Make your first sheep tonight.",
      makeToday: "Make tonight's sheep",
      calendarView: "Calendar view",
      gridView: "Grid view",
      prevPage: "Previous page",
      nextPage: "Next page",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      monthFormat: "MMMM yyyy",
      dayFormat: "MMM d",
      othersSuffix: (n) => ` and ${n} more`,
      tapHint: "Tap a date to meet that night's sheep again",
    },
    sheepResult: {
      dateFormat: "MMMM d, yyyy",
      notFound: "Sheep not found.",
      goHome: "Back to home",
      noImage: "No image",
      emotionLabel: "Emotion",
      personalityLabel: "Personality",
      talkTitle: "Tonight's conversation",
      eyebrow: "Today's Sheep",
      talkCount: (n) => `View ${n} messages`,
      sleepNow: "Time to sleep",
      keepCollection: "Keep in collection",
      home: "Home",
    },
    conversation: {
      eyebrow: "Tonight's Talk",
      back: "Back",
      dateFormat: "MMMM d, yyyy",
      sheepLabel: "Sheep",
      empty: "No conversation was shared.",
      notFound: "Sheep not found.",
      goHome: "Back to home",
    },
    settings: {
      title: "Settings",
      language: "Language",
      theme: "Display mode",
      night: "Night",
      day: "Day",
      themeHintNight: "Under the deep night sky",
      themeHintDay: "Under a warm beige light",
    },
  },
  zh: {
    home: {
      titleLine1: "今天的一天,",
      titleLine2: "讲给小羊听吧",
      subtitle1: "闭上眼睛之前,",
      subtitle2: "一只小羊正在等待你的故事。",
      start: "开始入睡",
      preparing: "准备中...",
      pastSheep: "往日的羊",
      privacy: "语音文件不会被保存。仅保留对话文字用于生成小羊。",
    },
    session: {
      opening: "今天过得怎么样。",
      step2Q:
        " 为了让头脑放松、安然入睡,请轻松地说出一件今天最挂心却还没解决的事。如果没有,直接说没有也完全可以。",
      step3Q:
        " 你说的这件事,是现在马上能解决的吗。如果暂时难以解决,告诉我为什么。如果明天可以解决,请告诉我明天早上你会做的第一个小小行动。",
      step4Q:
        " 接下来,如果今天有一件想表扬自己的小小成就,请分享一个。再小也没关系,如果想不起来,坦然说没有也很好。",
      step5Q:
        " 回顾今天,有没有让你会心一笑的瞬间。如果没有,也可以自由想象一下,什么样的事会让你笑得最开心。",
      step5_5Q:
        " 我会把这份美好的能量,注入一只今晚守护你的可爱小羊。你最想给这只羊穿上什么温暖的颜色或质感呢,请选一个。",
      step6Default: "我来为你做一只温暖的小羊。现在闭上眼睛,祝你有个安稳的夜晚。",
      fallbackGoodnight: "祝你有个安稳的夜晚。",
      listening: "正在聆听",
      sheepSpeaking: "小羊正在说话",
      thinking: "正在思考",
      micOff: "麦克风已关闭",
      textPlaceholder: "用文字回答...",
    },
    sleep: {
      making: "正在制作今晚的小羊",
      timeoutError: "制作小羊花的时间有点长。请稍后再试。",
      goHome: "返回首页",
    },
    rest: {
      emotionTitle: "今晚的情绪整理",
      defaultSummary: "今天也辛苦你了。",
      closeEyes1: "现在闭上眼睛,",
      closeEyes2: "安心入睡吧。",
      musicNote: "屏幕会伴着轻柔的音乐慢慢变暗",
      goodNight: "晚安",
      screenOn: "唤醒屏幕",
    },
    history: {
      eyebrow: "我的羊群",
      title: "收集的羊群",
      countText: (n) => `至今已哄睡 ${n} 只小羊`,
      loading: "正在召集小羊...",
      emptyTitle: "还没有制作过小羊。",
      emptySub: "今晚来制作第一只小羊吧。",
      makeToday: "制作今晚的小羊",
      calendarView: "日历视图",
      gridView: "网格视图",
      prevPage: "上一页",
      nextPage: "下一页",
      weekdays: ["日", "一", "二", "三", "四", "五", "六"],
      monthFormat: "yyyy年M月",
      dayFormat: "M月d日",
      othersSuffix: (n) => ` 等${n}只`,
      tapHint: "点击日期,再次遇见那晚的小羊",
    },
    sheepResult: {
      dateFormat: "yyyy年M月d日",
      notFound: "找不到这只小羊。",
      goHome: "返回首页",
      noImage: "暂无图片",
      emotionLabel: "情绪",
      personalityLabel: "性格",
      talkTitle: "今晚聊过的话",
      eyebrow: "今天的羊",
      talkCount: (n) => `查看 ${n} 条对话`,
      sleepNow: "现在入睡",
      keepCollection: "存入收藏",
      home: "回到首页",
    },
    conversation: {
      eyebrow: "今晚的对话",
      back: "返回",
      dateFormat: "yyyy年M月d日",
      sheepLabel: "小羊",
      empty: "没有聊天记录。",
      notFound: "找不到这只小羊。",
      goHome: "返回首页",
    },
    settings: {
      title: "设置",
      language: "语言",
      theme: "显示模式",
      night: "夜晚",
      day: "白天",
      themeHintNight: "在深夜的星空下",
      themeHintDay: "在温暖的米色光线下",
    },
  },
};
