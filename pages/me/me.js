const { setTabBarIndex } = require("../../utils/tabBar")
const { listMedals } = require("../../utils/effortService")
const { listFavorites } = require("../../utils/refusalService")

Page({
  data: {
    medalCount: 0,
    favoriteScriptCount: 0
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
  },

  goMedals() {
    wx.navigateTo({ url: "/pages/medals/medals" })
  },

  goFavoriteScripts() {
    wx.navigateTo({ url: "/pages/favoriteScripts/favoriteScripts" })
  },

  goVent() {
    wx.switchTab({ url: "/pages/index/index" })
  }
})

