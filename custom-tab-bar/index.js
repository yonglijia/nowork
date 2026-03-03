Component({
  data: {
    selected: 0,
    list: [
      { pagePath: "/pages/index/index", text: "嘴硬", icon: "😤" },
      { pagePath: "/pages/effort/effort", text: "实干", icon: "✅" },
      { pagePath: "/pages/me/me", text: "我的", icon: "👤" }
    ]
  },
  lifetimes: {
    attached() {
      getApp().globalData.tabBar = this
    }
  },
  methods: {
    switchTab(e) {
      const path = e.currentTarget.dataset.path
      if (!path) return
      wx.switchTab({ url: path })
    }
  }
})

