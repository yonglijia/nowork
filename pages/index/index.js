const { getVentConfig, saveMoodTag } = require("../../utils/ventService")
const { renderShareCard } = require("../../utils/shareCard")
const { setTabBarIndex } = require("../../utils/tabBar")
const { getTopTask, setTopTask, deleteTopTask } = require("../../utils/refusalService")

function randomPick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx]
}

function getDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function encodeShareParam(v) {
  return encodeURIComponent(typeof v === "string" ? v : JSON.stringify(v))
}

Page({
  data: {
    moodTags: [],
    selectedMood: "",
    presets: [],
    card: null,
    // 快速减负模块
    topTask: null,
    showTopTaskInput: false,
    topTaskInputValue: ""
  },

  async onLoad() {
    try {
      wx.showShareMenu({ menus: ["shareAppMessage", "shareTimeline"] })
    } catch (e) {}

    const cfg = await getVentConfig()
    this.setData({
      moodTags: cfg.moodTags || [],
      presets: cfg.presets || []
    })

    const savedMood = wx.getStorageSync(`mood_${getDateKey()}`)
    if (savedMood) this.setData({ selectedMood: savedMood })
  },

  onShow() {
    setTabBarIndex(0)
    this.loadTopTask()
  },

  async onMoodTap(e) {
    const tag = e.currentTarget.dataset.tag
    if (!tag) return
    this.setData({ selectedMood: tag })
    const dateKey = getDateKey()
    wx.setStorageSync(`mood_${dateKey}`, tag)
    try {
      await saveMoodTag({ dateKey, tag })
    } catch (e) {}
  },

  // ========== 快速减负模块 ==========
  async loadTopTask() {
    try {
      const item = await getTopTask()
      this.setData({ topTask: item })
    } catch (e) {}
  },

  goRefusalScripts() {
    wx.navigateTo({ url: "/pages/refusalScripts/refusalScripts" })
  },

  showTopTaskEdit() {
    const current = this.data.topTask ? this.data.topTask.text : ""
    this.setData({ 
      showTopTaskInput: true,
      topTaskInputValue: current
    })
  },

  hideTopTaskEdit() {
    this.setData({ showTopTaskInput: false })
  },

  onTopTaskInput(e) {
    this.setData({ topTaskInputValue: e.detail.value || "" })
  },

  async saveTopTask() {
    const text = this.data.topTaskInputValue.trim()
    if (!text) {
      wx.showToast({ title: "请输入内容", icon: "none" })
      return
    }
    if (text.length > 20) {
      wx.showToast({ title: "最多20个字", icon: "none" })
      return
    }
    try {
      const item = await setTopTask(text)
      this.setData({ 
        topTask: item,
        showTopTaskInput: false
      })
      wx.showToast({ title: "已保存", icon: "success" })
    } catch (e) {
      wx.showToast({ title: "保存失败", icon: "none" })
    }
  },

  async removeTopTask() {
    try {
      await deleteTopTask()
      this.setData({ topTask: null, showTopTaskInput: false })
      wx.showToast({ title: "已删除", icon: "success" })
    } catch (e) {
      wx.showToast({ title: "删除失败", icon: "none" })
    }
  },

  onPresetTap(e) {
    const key = e.currentTarget.dataset.key
    const preset = (this.data.presets || []).find((p) => p.key === key)
    if (!preset) return
    const text = randomPick(preset.texts) || preset.label
    const meme = randomPick(preset.memes) || { type: "emoji", value: "😤" }
    this.setData({
      card: {
        presetKey: preset.key,
        presetLabel: preset.label,
        text,
        meme
      }
    })
  },

  goWall() {
    wx.navigateTo({ url: "/pages/wall/wall" })
  },

  buildSharePayload(mode) {
    const card = this.data.card
    const title = card ? `${card.presetLabel}｜今日嘴硬` : "今日嘴硬｜安全发泄区"
    const t = card ? card.text : ""
    const m = card ? card.meme : { type: "emoji", value: "😤" }
    const path =
      `/pages/card/card?mode=${mode}` +
      `&t=${encodeShareParam(t)}` +
      `&m=${encodeShareParam(m)}`
    return { title, path }
  },

  onShareAppMessage() {
    return this.buildSharePayload("public")
  },

  onShareTimeline() {
    const payload = this.buildSharePayload("public")
    return {
      title: payload.title,
      query: payload.path.replace("/pages/card/card?", "")
    }
  },

  onPrivateShare() {
    const payload = this.buildSharePayload("private")
    if (wx.shareAppMessage) {
      wx.shareAppMessage(payload)
      return
    }
    wx.showToast({ title: "基础库过低，建议用右上角分享", icon: "none" })
  },

  async onSaveImage() {
    const card = this.data.card
    if (!card) {
      wx.showToast({ title: "先生成一张卡片", icon: "none" })
      return
    }

    try {
      await ensureAlbumPermission()
    } catch (e) {
      return
    }

    wx.showLoading({ title: "生成图片中..." })
    try {
      const canvas = await getCanvasNode(this)
      canvas.width = 900
      canvas.height = 1200

      const res = await renderShareCard({
        canvas,
        text: card.text,
        meme: card.meme,
        footer: "今日嘴硬 · 安全发泄区"
      })

      await saveToAlbum(res.tempFilePath)
      wx.hideLoading()
      wx.showToast({ title: "已保存到相册" })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: "保存失败，请重试", icon: "none" })
    }
  }
})

function getCanvasNode(page) {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery()
      .in(page)
      .select("#shareCanvas")
      .fields({ node: true, size: true })
      .exec((res) => {
        const node = res && res[0] && res[0].node
        if (!node) reject(new Error("canvas_not_found"))
        else resolve(node)
      })
  })
}

function saveToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: resolve,
      fail: reject
    })
  })
}

function getSetting() {
  return new Promise((resolve) => {
    wx.getSetting({
      success: resolve,
      fail: () => resolve({ authSetting: {} })
    })
  })
}

function authorize(scope) {
  return new Promise((resolve, reject) => {
    wx.authorize({
      scope,
      success: resolve,
      fail: reject
    })
  })
}

async function ensureAlbumPermission() {
  const scope = "scope.writePhotosAlbum"
  const setting = await getSetting()
  const current = setting && setting.authSetting && setting.authSetting[scope]
  if (current === true) return true
  try {
    await authorize(scope)
    return true
  } catch (e) {
    const open = await new Promise((resolve) => {
      wx.showModal({
        title: "需要相册权限",
        content: "用于保存吐槽卡片到本地相册",
        confirmText: "去设置",
        success: (r) => resolve(!!r.confirm),
        fail: () => resolve(false)
      })
    })
    if (!open) throw e

    const result = await new Promise((resolve) => {
      wx.openSetting({
        success: resolve,
        fail: () => resolve({ authSetting: {} })
      })
    })
    const ok = result && result.authSetting && result.authSetting[scope]
    if (!ok) throw e
    return true
  }
}

