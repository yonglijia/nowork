const defaults = require("../../utils/effortDefaults")
const { setTabBarIndex } = require("../../utils/tabBar")
const { upsertEffort, getEffort, listEffortMonth } = require("../../utils/effortService")
const { renderEffortCard } = require("../../utils/effortCard")

function dateKeyOf(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function monthKeyOf(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function dateTextOf(dateKey) {
  return String(dateKey || "").replaceAll("-", ".")
}

function clampInt(v, min, max, fallback) {
  const n = parseInt(v, 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function calcDoneCount(form) {
  let done = 0
  if (form.workHours) done++
  if (form.overtimeHours !== "" && form.overtimeHours !== null && form.overtimeHours !== undefined) done++
  if (form.tasksDone) done++
  if (Array.isArray(form.extras)) done++
  return done
}

Page({
  data: {
    weekLabels: ["一", "二", "三", "四", "五", "六", "日"],

    workHoursOptions: defaults.workHoursOptions,
    taskCountOptions: defaults.taskCountOptions,
    extraOptions: defaults.extraOptions,

    workHoursIndex: 7,
    taskIndex: 2,

    doneCount: 0,
    totalCount: 4,

    form: {
      workHours: 8,
      overtimeHours: 0,
      tasksDone: 3,
      extras: []
    },

    card: null,
    unlockedMedals: [],

    calendarDays: [],
    monthKey: "",
    selectedDateKey: ""
  },

  async onLoad() {
    const todayKey = dateKeyOf()
    this.setData({ selectedDateKey: todayKey })
    await this.loadForDate(todayKey)
    await this.loadCalendar(monthKeyOf())
  },

  onShow() {
    setTabBarIndex(1)
  },

  async onPullDownRefresh() {
    await this.loadForDate(this.data.selectedDateKey || dateKeyOf())
    await this.loadCalendar(this.data.monthKey || monthKeyOf())
    wx.stopPullDownRefresh()
  },

  async loadForDate(dateKey) {
    try {
      const item = await getEffort({ dateKey })
      if (item) {
        const form = {
          workHours: item.workHours || 8,
          overtimeHours: item.overtimeHours ?? 0,
          tasksDone: item.tasksDone || 3,
          extras: item.extras || []
        }
        this.setData({
          form,
          workHoursIndex: Math.max(0, defaults.workHoursOptions.indexOf(form.workHours)),
          taskIndex: Math.max(0, defaults.taskCountOptions.indexOf(form.tasksDone)),
          doneCount: calcDoneCount(form),
          card: null,
          unlockedMedals: []
        })
      } else {
        const form = this.data.form
        this.setData({ doneCount: calcDoneCount(form), card: null, unlockedMedals: [] })
      }
    } catch (e) {
      wx.showToast({ title: "未启用云开发，暂无法同步", icon: "none" })
    }
  },

  async loadCalendar(monthKey) {
    const now = new Date()
    const monthKeyNow = monthKeyOf(now)
    const targetMonth = monthKey || monthKeyNow
    try {
      const res = await listEffortMonth({ monthKey: targetMonth })
      const dateSet = new Set((res.dates || []).filter(Boolean))
      const days = buildMonthCalendar(targetMonth, dateSet)
      this.setData({ monthKey: targetMonth, calendarDays: days })
    } catch (e) {
      const days = buildMonthCalendar(targetMonth, new Set())
      this.setData({ monthKey: targetMonth, calendarDays: days })
    }
  },

  onWorkHoursChange(e) {
    const idx = clampInt(e.detail.value, 0, defaults.workHoursOptions.length - 1, 0)
    const v = defaults.workHoursOptions[idx]
    const form = { ...this.data.form, workHours: v }
    this.setData({ workHoursIndex: idx, form, doneCount: calcDoneCount(form) })
  },

  onOvertimeInput(e) {
    const v = clampInt(e.detail.value, 0, 8, 0)
    const form = { ...this.data.form, overtimeHours: v }
    this.setData({ form, doneCount: calcDoneCount(form) })
  },

  onTaskChange(e) {
    const idx = clampInt(e.detail.value, 0, defaults.taskCountOptions.length - 1, 0)
    const v = defaults.taskCountOptions[idx]
    const form = { ...this.data.form, tasksDone: v }
    this.setData({ taskIndex: idx, form, doneCount: calcDoneCount(form) })
  },

  toggleExtra(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return
    const extras = Array.isArray(this.data.form.extras) ? [...this.data.form.extras] : []
    const idx = extras.indexOf(item)
    if (idx >= 0) extras.splice(idx, 1)
    else extras.push(item)
    const form = { ...this.data.form, extras }
    this.setData({ form, doneCount: calcDoneCount(form) })
  },

  async onSubmit() {
    const dateKey = this.data.selectedDateKey || dateKeyOf()
    const f = this.data.form

    wx.showLoading({ title: "生成中..." })
    try {
      const res = await upsertEffort({
        dateKey,
        workHours: clampInt(f.workHours, 1, 12, 8),
        overtimeHours: clampInt(f.overtimeHours, 0, 8, 0),
        tasksDone: clampInt(f.tasksDone, 1, 10, 3),
        extras: Array.isArray(f.extras) ? f.extras : []
      })

      const card = {
        dateKey,
        dateText: dateTextOf(dateKey),
        workHours: res.effort.workHours,
        overtimeHours: res.effort.overtimeHours,
        tasksDone: res.effort.tasksDone,
        extras: res.effort.extras || [],
        extrasText: (res.effort.extras || []).length ? res.effort.extras.join(" · ") : "无"
      }

      this.setData({
        card,
        unlockedMedals: res.unlockedMedals || []
      })
      wx.hideLoading()
      wx.showToast({ title: "已生成卡片" })
      await this.loadCalendar(this.data.monthKey || monthKeyOf())
    } catch (e) {
      wx.hideLoading()
      if (e && e.code === "cloud_not_enabled") {
        wx.showToast({ title: "未启用云开发，暂无法同步", icon: "none" })
        return
      }
      wx.showToast({ title: "生成失败", icon: "none" })
    }
  },

  buildSharePayload(mode) {
    const c = this.data.card
    const payload = {
      mode,
      dateKey: c ? c.dateKey : "",
      stats: {
        workHours: c ? c.workHours : 0,
        overtimeHours: c ? c.overtimeHours : 0,
        tasksDone: c ? c.tasksDone : 0
      },
      extras: c ? c.extras : [],
      medals: this.data.unlockedMedals || []
    }
    const title = mode === "private" ? "私密实干卡片" : "今日实干｜付出记录器"
    const q = encodeURIComponent(JSON.stringify(payload))
    return { title, path: `/pages/effortCard/effortCard?q=${q}` }
  },

  onShareAppMessage() {
    return this.buildSharePayload("public")
  },

  onShareTimeline() {
    const p = this.buildSharePayload("public")
    return { title: p.title, query: `q=${p.path.split("q=")[1]}` }
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
    if (!this.data.card) {
      wx.showToast({ title: "先生成卡片", icon: "none" })
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
      const c = this.data.card
      const res = await renderEffortCard({
        canvas,
        dateText: c.dateText,
        stats: {
          workHours: c.workHours,
          overtimeHours: c.overtimeHours,
          tasksDone: c.tasksDone
        },
        extras: c.extras,
        medals: this.data.unlockedMedals || []
      })
      await saveToAlbum(res.tempFilePath)
      wx.hideLoading()
      wx.showToast({ title: "已保存到相册" })
    } catch (e) {
      wx.hideLoading()
      wx.showToast({ title: "保存失败", icon: "none" })
    }
  },

  onDayTap(e) {
    const dateKey = e.currentTarget.dataset.datekey
    if (!dateKey) return
    this.setData({ selectedDateKey: dateKey })
    this.loadForDate(dateKey)
  },

  goReport() {
    wx.navigateTo({ url: "/pages/report/report" })
  },

  goMedals() {
    wx.navigateTo({ url: "/pages/medals/medals" })
  }
})

function buildMonthCalendar(monthKey, dateSet) {
  const [y, m] = monthKey.split("-").map((x) => parseInt(x, 10))
  const first = new Date(y, m - 1, 1)
  const firstWeek = (first.getDay() + 6) % 7 // monday=0
  const daysInMonth = new Date(y, m, 0).getDate()
  const todayKey = dateKeyOf()

  const cells = []
  for (let i = 0; i < firstWeek; i++) {
    cells.push({ key: `e${i}`, label: "", dateKey: "", hasData: false, isToday: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dd = String(d).padStart(2, "0")
    const dateKey = `${monthKey}-${dd}`
    cells.push({
      key: dateKey,
      label: String(d),
      dateKey,
      hasData: dateSet.has(dateKey),
      isToday: dateKey === todayKey
    })
  }
  const fill = (7 - (cells.length % 7)) % 7
  for (let i = 0; i < fill; i++) {
    cells.push({ key: `t${i}`, label: "", dateKey: "", hasData: false, isToday: false })
  }
  return cells
}

function getCanvasNode(page) {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery()
      .in(page)
      .select("#effortCanvas")
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
        content: "用于保存实干卡片到本地相册",
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

