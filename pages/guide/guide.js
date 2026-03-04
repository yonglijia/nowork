const { setTabBarIndex } = require("../../utils/tabBar")

// 指南内容数据
const GUIDE_CATEGORIES = [
  { key: "all", name: "全部" },
  { key: "workplace", name: "职场生存" },
  { key: "emotion", name: "情绪管理" },
  { key: "social", name: "社交技巧" },
  { key: "health", name: "身心健康" },
  { key: "finance", name: "理财省钱" }
]

const GUIDE_CONTENTS = [
  {
    id: 1,
    category: "workplace",
    title: "如何优雅地拒绝加班",
    summary: "学会说「不」，让老板理解你的底线",
    content: "拒绝加班的艺术在于：态度坚决但语气柔和。可以先表达对工作的重视，再说明自己的困难，最后提出替代方案。比如：「我很想帮忙完成这个项目，但今晚确实有重要安排，明天一早我优先处理可以吗？」",
    icon: "💼"
  },
  {
    id: 2,
    category: "workplace",
    title: "同事甩锅怎么办",
    summary: "三招教你化解职场「锅」局",
    content: "遇到同事甩锅，保持冷静最重要。第一，保留沟通记录；第二，学会用邮件确认；第三，适时在领导面前展示自己的工作进度。记住：防人之心不可无。",
    icon: "🛡️"
  },
  {
    id: 3,
    category: "emotion",
    title: "情绪崩溃急救指南",
    summary: "当你快要爆炸时，试试这几招",
    content: "情绪上头时，先给自己3秒钟。深呼吸，告诉自己「这不值得我生气」。如果还是不行，就去洗手间洗把脸，或者下楼走一圈。记住：发火之前，先数到十。",
    icon: "🧘"
  },
  {
    id: 4,
    category: "emotion",
    title: "如何和焦虑做朋友",
    summary: "别让焦虑成为你的敌人",
    content: "焦虑其实是大脑在提醒你：这件事很重要。与其对抗焦虑，不如接纳它。把大任务拆成小目标，一步一步来。记住：你焦虑是因为你在乎，这恰恰说明你很用心。",
    icon: "🌈"
  },
  {
    id: 5,
    category: "social",
    title: "社恐人的聚会生存手册",
    summary: "不说话也能过得去的技巧",
    content: "社恐聚会三件套：微笑、点头、找吃的。实在不知道说什么，就夸别人：「你今天气色真好」「这个菜味道不错」。实在不行，就去帮主人招待客人，有事情做就不尴尬了。",
    icon: "🤝"
  },
  {
    id: 6,
    category: "social",
    title: "如何优雅地结束对话",
    summary: "社恐必备的脱身技巧",
    content: "想结束对话？试试这些：「那我先去忙了」「下次再聊」「对了，我得打个电话」。如果对方还在说，就慢慢往后退，身体语言比语言更有效。",
    icon: "👋"
  },
  {
    id: 7,
    category: "health",
    title: "打工人护眼指南",
    summary: "你的眼睛值得被温柔对待",
    content: "每工作45分钟，让眼睛休息5分钟。可以看看远处的绿植，或者闭眼转动眼球。屏幕亮度调到舒适的程度，记得多眨眼。晚上用热毛巾敷一敷，眼睛会感谢你的。",
    icon: "👀"
  },
  {
    id: 8,
    category: "health",
    title: "久坐族的脊椎自救",
    summary: "你的腰正在抗议",
    content: "每坐1小时，起来走动5分钟。可以做做简单的拉伸：双手向上伸展，左右转动腰部，踢踢腿。如果可以，换个升降桌，站着工作也很酷。记住：腰好，生活才好。",
    icon: "🧘‍♀️"
  },
  {
    id: 9,
    category: "finance",
    title: "工资月光怎么办",
    summary: "学会记账，告别月光族",
    content: "发工资第一天，先把「付给自己的钱」存起来。记账不用太复杂，记清楚每一笔大额支出就行。能做饭就别点外卖，能坐地铁就别打车。小钱积累起来也是大钱。",
    icon: "💰"
  },
  {
    id: 10,
    category: "finance",
    title: "如何快乐地省钱",
    summary: "省钱不是苦自己",
    content: "省钱的秘诀是：延迟满足。看到想买的东西，先放购物车晾3天。很多时候，3天后你就不想买了。把钱花在真正让你开心的事情上，而不是冲动消费。",
    icon: "🎯"
  }
]

Page({
  data: {
    categories: GUIDE_CATEGORIES,
    currentCategory: "all",
    searchKeyword: "",
    contents: GUIDE_CONTENTS,
    filteredContents: GUIDE_CONTENTS,
    loading: false
  },

  onShow() {
    setTabBarIndex(2)
  },

  // 切换分类
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ currentCategory: category })
    this.filterContents()
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.filterContents()
  },

  // 清空搜索
  onClearSearch() {
    this.setData({ searchKeyword: "" })
    this.filterContents()
  },

  // 过滤内容
  filterContents() {
    const { currentCategory, searchKeyword } = this.data
    let filtered = GUIDE_CONTENTS

    if (currentCategory !== "all") {
      filtered = filtered.filter(item => item.category === currentCategory)
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(keyword) ||
        item.summary.toLowerCase().includes(keyword)
      )
    }

    this.setData({ filteredContents: filtered })
  },

  // 查看详情
  onViewDetail(e) {
    const id = e.currentTarget.dataset.id
    const item = GUIDE_CONTENTS.find(c => c.id === id)
    if (item) {
      wx.showModal({
        title: item.title,
        content: item.content,
        confirmText: "复制话术",
        cancelText: "关闭",
        success(res) {
          if (res.confirm) {
            wx.setClipboardData({
              data: item.content,
              success() {
                wx.showToast({ title: "已复制", icon: "success" })
              }
            })
          }
        }
      })
    }
  },

  // 收藏（暂时用 toast 提示）
  onFavorite(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: "已收藏", icon: "success" })
  },

  // 分享
  onShare(e) {
    const id = e.currentTarget.dataset.id
    const item = GUIDE_CONTENTS.find(c => c.id === id)
    if (item) {
      wx.showActionSheet({
        itemList: ["分享给好友", "复制链接"],
        success(res) {
          if (res.tapIndex === 1) {
            wx.setClipboardData({
              data: `【${item.title}】${item.summary}`,
              success() {
                wx.showToast({ title: "已复制", icon: "success" })
              }
            })
          }
        }
      })
    }
  }
})
