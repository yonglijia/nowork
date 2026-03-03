App({
  globalData: {
    ventConfig: null
  },
  onLaunch() {
    if (wx.cloud && wx.cloud.init) {
      wx.cloud.init({
        traceUser: false
      })
    }
  }
})


