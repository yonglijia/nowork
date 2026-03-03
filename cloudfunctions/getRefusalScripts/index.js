const cloud = require("wx-server-sdk")

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 默认话术配置（当数据库没有配置时使用）
const DEFAULT_SCRIPTS = [
  // 同事甩锅
  {
    category: "colleague",
    categoryName: "同事甩锅",
    scripts: [
      { id: "c1", text: "这个项目我了解的情况有限，建议找相关负责人确认一下。" },
      { id: "c2", text: "我手头已经有几个紧急任务了，这个可能需要排期到下周。" },
      { id: "c3", text: "这块不是我的专业领域，我可能帮不上太多忙。" },
      { id: "c4", text: "咱们可以一起找领导协调一下资源，看怎么分配更合理。" }
    ]
  },
  // 领导加活
  {
    category: "boss",
    categoryName: "领导加活",
    scripts: [
      { id: "b1", text: "好的领导，我现在手头有A和B两个任务，您看新的任务优先级怎么排？" },
      { id: "b2", text: "这个任务我可以接，但可能需要延后之前那个任务的交付时间，您看可以吗？" },
      { id: "b3", text: "我需要先评估一下工作量，晚点给您一个可行的时间表。" },
      { id: "b4", text: "这个领域我不太熟悉，可能需要一些学习时间，您看工期怎么安排？" }
    ]
  },
  // 无效社交
  {
    category: "social",
    categoryName: "无效社交",
    scripts: [
      { id: "s1", text: "不好意思，今晚已经有安排了，下次吧！" },
      { id: "s2", text: "最近在调整作息，晚上不太方便出来了。" },
      { id: "s3", text: "谢谢邀请，不过我最近在控制社交频率，专注一下工作。" },
      { id: "s4", text: "这周末想休息一下，你们玩得开心！" }
    ]
  },
  // 家人不合理要求
  {
    category: "family",
    categoryName: "家人要求",
    scripts: [
      { id: "f1", text: "妈/爸，我最近工作压力比较大，这件事可能暂时帮不上忙。" },
      { id: "f2", text: "我理解你们的想法，但我也有自己的规划，我们再商量商量？" },
      { id: "f3", text: "这件事我需要考虑一下，不是不想帮忙，是确实有困难。" },
      { id: "f4", text: "我知道你们是为我好，但这个决定还是让我自己来做吧。" }
    ]
  },
  // 准时下班
  {
    category: "leave",
    categoryName: "准时下班",
    scripts: [
      { id: "l1", text: "今天家里有点事，我先走了，有急事微信找我。" },
      { id: "l2", text: "我的工作已经完成了，大家明天见！" },
      { id: "l3", text: "今晚约了人，得准时走，不好意思啊。" },
      { id: "l4", text: "今天状态不太好，想早点回去休息，明天继续努力。" }
    ]
  },
  // 示弱
  {
    category: "weakness",
    categoryName: "适度示弱",
    scripts: [
      { id: "w1", text: "说实话，这个任务对我来说有点吃力，能有人指导一下吗？" },
      { id: "w2", text: "我最近确实有点透支了，可能需要调整一下工作节奏。" },
      { id: "w3", text: "这个方面我确实不太擅长，有推荐的同事可以请教吗？" },
      { id: "w4", text: "我承认这个任务我低估了难度，可能需要更多时间。" }
    ]
  }
]

exports.main = async (event) => {
  const { category, keyword } = event || {}
  
  try {
    // 尝试从数据库获取配置
    const configRes = await db.collection("refusal_scripts_config").limit(1).get()
    let scripts = DEFAULT_SCRIPTS
    
    if (configRes.data && configRes.data.length > 0) {
      const config = configRes.data[0]
      if (config.scripts && config.scripts.length > 0) {
        scripts = config.scripts
      }
    }
    
    // 按分类筛选
    if (category) {
      scripts = scripts.filter(s => s.category === category)
    }
    
    // 按关键词搜索
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase()
      scripts = scripts.map(cat => ({
        ...cat,
        scripts: cat.scripts.filter(s => 
          s.text.toLowerCase().includes(kw) || 
          cat.categoryName.includes(kw)
        )
      })).filter(cat => cat.scripts.length > 0)
    }
    
    return {
      ok: true,
      data: scripts
    }
  } catch (e) {
    // 出错时返回默认配置
    return {
      ok: true,
      data: DEFAULT_SCRIPTS
    }
  }
}
