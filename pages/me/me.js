const { setTabBarIndex } = require("../../utils/tabBar")
const { listMedals } = require("../../utils/effortService")
const { listFavorites } = require("../../utils/refusalService")
const { listAudioFavorites } = require("../../utils/healingService")

Page({
  data: {
    medalCount: 0,
    favoriteScriptCount: 0,
    favoriteAudioCount: 0
  },

  onShow() {
    setTabBarIndex(2)
    this.refresh()
  },

  async refresh() {
    try {
      const items = await listMedals()
      this.setData({ medalCount: (items || []).length })
    } catch (e) {}
    
    try {
      const favorites = await listFavorites()
      this.setData({ favoriteScriptCount: (favorites || []).length })
    } catch (e) {}
    
    try {
      const audioFavorites = await listAudioFavorites()
      this.setData({ favoriteAudioCount: (audioFavorites || []).length })
    } catch (e) {}
  },

  goWageBill() {
    wx.navigateTo({ url: "/pages/wageBill/wageBill" })
  },

  goMedals() {
    wx.navigateTo({ url: "/pages/medals/medals" })
  },

  goFavoriteScripts() {
    wx.navigateTo({ url: "/pages/favoriteScripts/favoriteScripts" })
  },

  goFavoriteAudio() {
    wx.navigateTo({ url: "/pages/favoriteAudio/favoriteAudio" })
  },

  goVent() {
    wx.switchTab({ url: "/pages/index/index" })
  }
})
