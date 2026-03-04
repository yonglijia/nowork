const { listAudioFavorites, removeAudioFavorite, removeAudioFavoriteBatch } = require("../../utils/healingService")

Page({
  data: {
    favorites: [],
    loading: true,
    editMode: false,
    selectedIds: [],
    currentAudio: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playSpeed: 1,
    speedOptions: [0.8, 1, 1.2]
  },

  audioContext: null,

  async onShow() {
    await this.loadFavorites()
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
    }
  },

  async loadFavorites() {
    this.setData({ loading: true })
    try {
      const favorites = await listAudioFavorites()
      this.setData({ 
        favorites: favorites || [],
        loading: false,
        editMode: false,
        selectedIds: []
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: "加载失败", icon: "none" })
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
    const audioId = e.currentTarget.dataset.audioid
    if (!audioId) return
    
    const { selectedIds } = this.data
    const index = selectedIds.indexOf(audioId)
    
    if (index > -1) {
      selectedIds.splice(index, 1)
    } else {
      selectedIds.push(audioId)
    }
    
    this.setData({ selectedIds: [...selectedIds] })
  },

  onSelectAll() {
    const { favorites, selectedIds } = this.data
    if (selectedIds.length === favorites.length) {
      this.setData({ selectedIds: [] })
    } else {
      this.setData({ 
        selectedIds: favorites.map(f => f.audioId) 
      })
    }
  },

  async onRemove(e) {
    const audioId = e.currentTarget.dataset.audioid
    if (!audioId) return
    
    try {
      await removeAudioFavorite(audioId)
      wx.showToast({ title: "已取消收藏", icon: "success" })
      await this.loadFavorites()
    } catch (e) {
      wx.showToast({ title: "操作失败", icon: "none" })
    }
  },

  async onRemoveBatch() {
    const { selectedIds } = this.data
    if (selectedIds.length === 0) {
      wx.showToast({ title: "请选择要删除的音频", icon: "none" })
      return
    }
    
    try {
      await removeAudioFavoriteBatch(selectedIds)
      wx.showToast({ title: "已删除", icon: "success" })
      await this.loadFavorites()
    } catch (e) {
      wx.showToast({ title: "操作失败", icon: "none" })
    }
  },

  playAudio(e) {
    const audio = e.currentTarget.dataset.audio
    if (!audio || this.data.editMode) return
    
    if (this.data.currentAudio && this.data.currentAudio.audioId === audio.audioId) {
      if (this.data.isPlaying) {
        this.audioContext.pause()
        this.setData({ isPlaying: false })
      } else {
        this.audioContext.play()
        this.setData({ isPlaying: true })
      }
      return
    }
    
    if (this.audioContext) {
      this.audioContext.stop()
    }
    
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.src = audio.url || ""
    this.audioContext.playbackRate = this.data.playSpeed
    
    this.audioContext.onPlay(() => {
      this.setData({ isPlaying: true })
    })
    
    this.audioContext.onPause(() => {
      this.setData({ isPlaying: false })
    })
    
    this.audioContext.onEnded(() => {
      this.setData({ isPlaying: false, currentTime: 0 })
    })
    
    this.audioContext.onTimeUpdate(() => {
      this.setData({
        currentTime: this.audioContext.currentTime,
        duration: this.audioContext.duration
      })
    })
    
    this.audioContext.play()
    this.setData({ currentAudio: audio, currentTime: 0 })
  },

  togglePlay() {
    if (!this.audioContext) return
    
    if (this.data.isPlaying) {
      this.audioContext.pause()
    } else {
      this.audioContext.play()
    }
  },

  changeSpeed() {
    const { speedOptions, playSpeed } = this.data
    const currentIndex = speedOptions.indexOf(playSpeed)
    const nextIndex = (currentIndex + 1) % speedOptions.length
    const newSpeed = speedOptions[nextIndex]
    
    if (this.audioContext) {
      this.audioContext.playbackRate = newSpeed
    }
    
    this.setData({ playSpeed: newSpeed })
    wx.showToast({ title: `${newSpeed}x`, icon: "none" })
  },

  onSliderChange(e) {
    const time = Number(e.detail.value)
    if (this.audioContext) {
      this.audioContext.seek(time)
      this.setData({ currentTime: time })
    }
  }
})
