const { getAudios, checkAudioFavorite, addAudioFavorite, removeAudioFavorite } = require("../../utils/healingService")

Page({
  data: {
    categories: [
      { key: "", name: "全部" },
      { key: "before_work", name: "上班前" },
      { key: "after_work", name: "下班后" },
      { key: "before_sleep", name: "睡前" }
    ],
    activeCategory: "",
    audios: [],
    filteredAudios: [],
    searchValue: "",
    loading: true,
    currentAudio: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playSpeed: 1,
    speedOptions: [0.8, 1, 1.2],
    favoritedIds: {}
  },

  audioContext: null,

  async onLoad() {
    await this.loadAudios()
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.stop()
      this.audioContext.destroy()
    }
  },

  async loadAudios() {
    this.setData({ loading: true })
    try {
      const audios = await getAudios()
      
      // 检查收藏状态
      const favoritedIds = {}
      for (const audio of audios) {
        try {
          const res = await checkAudioFavorite(audio.id)
          if (res.isFavorited) {
            favoritedIds[audio.id] = true
          }
        } catch (e) {}
      }
      
      this.setData({ 
        audios, 
        filteredAudios: audios,
        favoritedIds,
        loading: false
      })
    } catch (e) {
      this.setData({ loading: false })
      wx.showToast({ title: "加载失败", icon: "none" })
    }
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category || ""
    this.setData({ activeCategory: category })
    this.filterAudios()
  },

  onSearchInput(e) {
    const value = e.detail.value || ""
    this.setData({ searchValue: value })
    this.filterAudios()
  },

  filterAudios() {
    const { audios, activeCategory, searchValue } = this.data
    let result = audios
    
    if (activeCategory) {
      result = result.filter(a => a.category === activeCategory)
    }
    
    if (searchValue.trim()) {
      const kw = searchValue.trim().toLowerCase()
      result = result.filter(a => 
        a.title.toLowerCase().includes(kw) ||
        (a.description && a.description.toLowerCase().includes(kw))
      )
    }
    
    this.setData({ filteredAudios: result })
  },

  playAudio(e) {
    const audio = e.currentTarget.dataset.audio
    if (!audio) return
    
    if (this.data.currentAudio && this.data.currentAudio.id === audio.id) {
      // 切换播放/暂停
      if (this.data.isPlaying) {
        this.audioContext.pause()
        this.setData({ isPlaying: false })
      } else {
        this.audioContext.play()
        this.setData({ isPlaying: true })
      }
      return
    }
    
    // 播放新音频
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
    
    this.audioContext.onError((err) => {
      console.error("音频播放错误", err)
      wx.showToast({ title: "播放失败", icon: "none" })
      this.setData({ isPlaying: false })
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
  },

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  },

  async onFavorite(e) {
    const audio = e.currentTarget.dataset.audio
    if (!audio) return
    
    const isFavorited = this.data.favoritedIds[audio.id]
    
    try {
      if (isFavorited) {
        await removeAudioFavorite(audio.id)
        this.setData({ [`favoritedIds.${audio.id}`]: false })
        wx.showToast({ title: "已取消收藏", icon: "success" })
      } else {
        await addAudioFavorite(audio)
        this.setData({ [`favoritedIds.${audio.id}`]: true })
        wx.showToast({ title: "已收藏", icon: "success" })
      }
    } catch (e) {
      wx.showToast({ title: "操作失败", icon: "none" })
    }
  },

  goFavorites() {
    wx.navigateTo({ url: "/pages/favoriteAudio/favoriteAudio" })
  }
})
