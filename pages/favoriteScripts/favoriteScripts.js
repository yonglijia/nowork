const { listFavorites, removeFavorite, removeFavoriteBatch } = require("../../utils/refusalService")

Page({
  data: {
    favorites: [],
    loading: true,
    editMode: false,
    selectedIds: []
  },

  async onShow() {
    await this.loadFavorites()
  },

  async loadFavorites() {
    this.setData({ loading: true })
    try {
      const data = await listFavorites()
      this.setData({ 
        favorites: data || [],
        loading: false,
        editMode: false,
        selectedIds: []
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: "加载失败", icon: "none" })
    }
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

  toggleEditMode() {
    const newMode = !this.data.editMode
    this.setData({ 
      editMode: newMode,
      selectedIds: []
    })
  },

  onSelect(e) {
    const scriptId = e.currentTarget.dataset.scriptid
    if (!scriptId) return
    
    const { selectedIds } = this.data
    const index = selectedIds.indexOf(scriptId)
    
    if (index > -1) {
      selectedIds.splice(index, 1)
    } else {
      selectedIds.push(scriptId)
    }
    
    this.setData({ selectedIds: [...selectedIds] })
  },

  onSelectAll() {
    const { favorites, selectedIds } = this.data
    if (selectedIds.length === favorites.length) {
      this.setData({ selectedIds: [] })
    } else {
      this.setData({ 
        selectedIds: favorites.map(f => f.scriptId) 
      })
    }
  },

  async onRemove(e) {
    const scriptId = e.currentTarget.dataset.scriptid
    if (!scriptId) return
    
    try {
      await removeFavorite(scriptId)
      wx.showToast({ title: "已取消收藏", icon: "success" })
      await this.loadFavorites()
    } catch (e) {
      wx.showToast({ title: "操作失败", icon: "none" })
    }
  },

  async onRemoveBatch() {
    const { selectedIds } = this.data
    if (selectedIds.length === 0) {
      wx.showToast({ title: "请选择要删除的话术", icon: "none" })
      return
    }
    
    try {
      await removeFavoriteBatch(selectedIds)
      wx.showToast({ title: "已删除", icon: "success" })
      await this.loadFavorites()
    } catch (e) {
      wx.showToast({ title: "操作失败", icon: "none" })
    }
  }
})
