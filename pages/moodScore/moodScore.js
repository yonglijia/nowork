const { saveMoodScore, getMoodScore, getGuidance } = require("../../utils/healingService")

Page({
  data: {
    score: 5,
    todayScore: null,
    guidance: null,
    showGuidance: false,
    isLoading: false
  },

  async onLoad() {
    // 获取今日已打的分数
    try {
      const todayScore = await getMoodScore()
      if (todayScore !== null) {
        this.setData({ 
          score: todayScore, 
          todayScore,
          showGuidance: true 
        })
        await this.loadGuidance(todayScore)
      }
    } catch (e) {}
  },

  onScoreChange(e) {
    const score = Number(e.detail.value)
    this.setData({ score })
  },

  selectScore(e) {
    const score = Number(e.currentTarget.dataset.score)
    this.setData({ score })
  },

  async loadGuidance(score) {
    try {
      const guidance = await getGuidance(score)
      this.setData({ guidance })
    } catch (e) {
      this.setData({ 
        guidance: { text: "感谢你的打分，愿你今天心情愉快。" }
      })
    }
  },

  async submitScore() {
    const { score, isLoading } = this.data
    if (isLoading) return
    
    this.setData({ isLoading: true })
    
    try {
      await saveMoodScore(score)
      await this.loadGuidance(score)
      
      this.setData({ 
        showGuidance: true, 
        todayScore: score,
        isLoading: false
      })
      
      wx.showToast({ title: "已保存", icon: "success" })
    } catch (e) {
      this.setData({ isLoading: false })
      wx.showToast({ title: "保存失败", icon: "none" })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  goToBreathing() {
    wx.navigateTo({ url: "/pages/breathing/breathing" })
  }
})
