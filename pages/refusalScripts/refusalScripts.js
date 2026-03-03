const { getRefusalScripts } = require("../../utils/refusalService")
const { checkFavorite, addFavorite, removeFavorite } = require("../../utils/refusalService")

Page({
  data: {
    categories: [],
    activeCategory: "",
    scripts: [],
    filteredScripts: [],
    searchValue: "",
    loading: true,
    favoritedIds: {}
  },

  async onLoad(options) {
    const category = options.category || ""
    this.setData({ activeCategory: category })
    await this.loadScripts()
  },

  async loadScripts() {
    this.setData({ loading: true })
    try {
      const data = await getRefusalScripts()
      const categories = data || []
      
      // 获取所有已收藏的 scriptId
      const allScriptIds = []
      categories.forEach(cat => {
        cat.scripts.forEach(s => allScriptIds.push(s.id))
      })
      
      const favoritedIds = {}
      for (const scriptId of allScriptIds) {
        try {
          const res = await checkFavorite(scriptId)
          if (res.isFavorited) {
            favoritedIds[scriptId] = true
          }
        } catch (e) {}
      }
      
      this.setData({ 
        categories, 
        loading: false,
        favoritedIds
      })
      
      this.filterScripts()
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: "加载失败", icon: "none" })
    }
  },

  filterScripts() {
    const { categories, activeCategory, searchValue } = this.data
    let result = []
    
    if (activeCategory) {
      const cat = categories.find(c => c.category === activeCategory)
      if (cat) {
        result = cat.scripts.map(s => ({
          ...s,
          category: cat.category,
          categoryName: cat.categoryName
        }))
      }
    } else {
      categories.forEach(cat => {
        cat.scripts.forEach(s => {
          result.push({
            ...s,
            category: cat.category,
            categoryName: cat.categoryName
          })
        })
      })
    }
    
    // 搜索过滤
    if (searchValue.trim()) {
      const kw = searchValue.trim().toLowerCase()
      result = result.filter(s => 
        s.text.toLowerCase().includes(kw) || 
        s.categoryName.toLowerCase().includes(kw)
      )
    }
    
    this.setData({ filteredScripts: result })
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category || ""
    this.setData({ activeCategory: category })
    this.filterScripts()
  },

  onSearchInput(e) {
    const value = e.detail.value || ""
    this.setData({ searchValue: value })
    this.filterScripts()
  },

  onClearSearch() {
    this.setData({ searchValue: "" })
    this.filterScripts()
  },

  async onCopy(e) {
    const text = e.currentTarget.dataset.text
    if (!text) return
    
    try {
      await wx.setClipboardData({ data: text })
      wx.showToast({ title: "已复制", icon: "success" })
    } catch (e) {
      wx.showToast({ title: "复制失败", icon: "none" })
    }
  },

  async onFavorite(e) {
    const { id, text, category, categoryname } = e.currentTarget.dataset
    if (!id) return
    
    const isFavorited = this.data.favoritedIds[id]
    
    try {
      if (isFavorited) {
        await removeFavorite(id)
        this.setData({
          [`favoritedIds.${id}`]: false
        })
        wx.showToast({ title: "已取消收藏", icon: "success" })
      } else {
        await addFavorite(id, text, category, categoryname)
        this.setData({
          [`favoritedIds.${id}`]: true
        })
        wx.showToast({ title: "已收藏", icon: "success" })
      }
    } catch (e) {
      wx.showToast({ title: "操作失败", icon: "none" })
    }
  },

  goFavorites() {
    wx.navigateTo({ url: "/pages/favoriteScripts/favoriteScripts" })
  }
})
