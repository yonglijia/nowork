const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 默认治愈文案
const DEFAULT_HEALING_QUOTES = [
  "你已经很努力了，允许自己休息一下吧。",
  "今天的你，已经比昨天更棒了。",
  "不必事事完美，你已经足够好。",
  "你的价值不由工作定义，你本身就是珍贵的。",
  "累了就停下来，休息也是一种前进。",
  "对自己温柔一点，你值得被善待。",
  "每一次深呼吸，都是对自己的关爱。",
  "你已经做得很好了，不需要向任何人证明。",
  "放下比较，专注于自己的节奏。",
  "今天的烦恼，明天都会变成小事。",
  "你的感受是真实的，也是重要的。",
  "允许自己说「不」，这是边界，不是自私。",
  "休息不是偷懒，是给身体充电。",
  "你不必时刻坚强，脆弱也是人之常情。",
  "今天的你，值得被温柔以待。"
]

// 根据分数匹配的疏导文案
const DEFAULT_GUIDANCE = {
  "1-3": [
    "今天真的很累吧，抱抱你。先深呼吸，一切都会过去的。",
    "我知道你现在很难受，这很正常。试着放下手机，闭眼休息一会儿。",
    "你承受了很多，辛苦了。今晚早点休息，明天是新的开始。"
  ],
  "4-6": [
    "有些疲惫也没关系，学会给自己减压。",
    "你已经在努力了，别对自己太苛刻。",
    "中等状态也不错，试着做点让自己开心的事。"
  ],
  "7-9": [
    "状态不错！继续保持，记得给自己点赞。",
    "你做得很好，今天的努力值得被看见。",
    "保持这个节奏，也别忘了适当休息。"
  ],
  "10": [
    "太棒了！今天你是自己的小太阳！",
    "满分状态！记得记录下这份好心情。",
    "你今天真的很棒，为自己鼓个掌吧！"
  ]
}

// 默认音频列表
const DEFAULT_AUDIOS = [
  {
    id: "a1",
    title: "上班前的心理建设",
    category: "before_work",
    categoryName: "上班前心理建设",
    duration: 180,
    url: "",
    description: "新的一天，给自己一点力量"
  },
  {
    id: "a2",
    title: "我可以搞定今天",
    category: "before_work",
    categoryName: "上班前心理建设",
    duration: 120,
    url: "",
    description: "相信自己的能力"
  },
  {
    id: "a3",
    title: "下班的治愈时光",
    category: "after_work",
    categoryName: "下班后治愈",
    duration: 240,
    url: "",
    description: "放下工作，回归自己"
  },
  {
    id: "a4",
    title: "今天已经结束了",
    category: "after_work",
    categoryName: "下班后治愈",
    duration: 180,
    url: "",
    description: "不必再想明天的事"
  },
  {
    id: "a5",
    title: "睡前的深呼吸",
    category: "before_sleep",
    categoryName: "睡前解压",
    duration: 300,
    url: "",
    description: "让身心慢慢放松"
  },
  {
    id: "a6",
    title: "放下今天的焦虑",
    category: "before_sleep",
    categoryName: "睡前解压",
    duration: 240,
    url: "",
    description: "明天的事明天再说"
  }
]

function getTodayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

// 根据日期生成一个稳定的随机索引
function getDailyIndex(dateKey, max) {
  let hash = 0
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash) + dateKey.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % max
}

exports.main = async (event) => {
  const { action, score, category, keyword } = event || {}
  
  // 获取今日治愈文案
  if (action === "getQuote") {
    try {
      const configRes = await db.collection("healing_config").limit(1).get()
      let quotes = DEFAULT_HEALING_QUOTES
      
      if (configRes.data && configRes.data.length > 0 && configRes.data[0].quotes) {
        quotes = configRes.data[0].quotes
      }
      
      const dateKey = getTodayKey()
      const index = getDailyIndex(dateKey, quotes.length)
      
      return {
        ok: true,
        data: {
          quote: quotes[index],
          dateKey
        }
      }
    } catch (e) {
      const dateKey = getTodayKey()
      const index = getDailyIndex(dateKey, DEFAULT_HEALING_QUOTES.length)
      return {
        ok: true,
        data: {
          quote: DEFAULT_HEALING_QUOTES[index],
          dateKey
        }
      }
    }
  }
  
  // 获取疏导文案（根据分数）
  if (action === "getGuidance") {
    if (score === undefined || score === null) {
      return { ok: false, error: "missing_score" }
    }
    
    let range = "4-6"
    if (score <= 3) range = "1-3"
    else if (score >= 7 && score <= 9) range = "7-9"
    else if (score === 10) range = "10"
    
    try {
      const configRes = await db.collection("healing_config").limit(1).get()
      let guidance = DEFAULT_GUIDANCE
      
      if (configRes.data && configRes.data.length > 0 && configRes.data[0].guidance) {
        guidance = configRes.data[0].guidance
      }
      
      const texts = guidance[range] || DEFAULT_GUIDANCE[range]
      const randomIndex = Math.floor(Math.random() * texts.length)
      
      return {
        ok: true,
        data: {
          text: texts[randomIndex],
          range
        }
      }
    } catch (e) {
      const texts = DEFAULT_GUIDANCE[range]
      const randomIndex = Math.floor(Math.random() * texts.length)
      return {
        ok: true,
        data: {
          text: texts[randomIndex],
          range
        }
      }
    }
  }
  
  // 获取音频列表
  if (action === "getAudios") {
    try {
      const configRes = await db.collection("healing_config").limit(1).get()
      let audios = DEFAULT_AUDIOS
      
      if (configRes.data && configRes.data.length > 0 && configRes.data[0].audios) {
        audios = configRes.data[0].audios
      }
      
      // 按分类筛选
      if (category) {
        audios = audios.filter(a => a.category === category)
      }
      
      // 按关键词搜索
      if (keyword && keyword.trim()) {
        const kw = keyword.trim().toLowerCase()
        audios = audios.filter(a => 
          a.title.toLowerCase().includes(kw) ||
          (a.description && a.description.toLowerCase().includes(kw)) ||
          (a.categoryName && a.categoryName.includes(kw))
        )
      }
      
      return {
        ok: true,
        data: audios
      }
    } catch (e) {
      return {
        ok: true,
        data: DEFAULT_AUDIOS
      }
    }
  }
  
  return { ok: false, error: "unknown_action" }
}
