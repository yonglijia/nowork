const { getGuidance } = require("../../utils/healingService")

// 呼吸模式：吸气4秒、屏息2秒、呼气6秒
const BREATH_PATTERN = {
  inhale: 4000,
  hold: 2000,
  exhale: 6000
}

const TOTAL_DURATION = 60 * 1000 // 1分钟

// 粒子数量
const PARTICLE_COUNT = 24

// 生成初始粒子
function generateParticles(count) {
  const particles = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count
    particles.push({
      id: i,
      baseAngle: angle,
      angle: angle,
      radius: 180, // 初始半径
      size: Math.random() * 10 + 6,
      opacity: 0.7,
      speed: Math.random() * 0.3 + 0.8,
      // 每个粒子的偏移，让运动更自然
      radiusOffset: Math.random() * 30 - 15,
      angleOffset: Math.random() * 0.2 - 0.1,
      pulsePhase: Math.random() * Math.PI * 2 // 脉冲相位
    })
  }
  return particles
}

Page({
  data: {
    phase: "idle", // idle, inhale, hold, exhale, paused
    timeLeft: 60,
    progress: 0,
    isRunning: false,
    isPaused: false,
    showMoodEntry: false,
    breathText: "点击开始",
    circleScale: 1,
    particles: generateParticles(PARTICLE_COUNT),
    glowIntensity: 0.4
  },

  timer: null,
  breathTimer: null,
  particleTimer: null,
  startTime: 0,
  elapsed: 0,
  audioContext: null,
  
  // 当前目标半径（用于平滑过渡）
  currentTargetRadius: 180,
  lastPhase: "idle",
  animationStartTime: 0,

  onLoad() {
    this.audioContext = wx.createInnerAudioContext()
    this.audioContext.loop = true
    // 初始化粒子位置
    this.initParticlePositions()
  },
  
  initParticlePositions() {
    const particles = this.data.particles.map(p => ({
      ...p,
      x: Math.cos(p.angle) * p.radius,
      y: Math.sin(p.angle) * p.radius
    }))
    this.setData({ particles })
  },

  onUnload() {
    this.stopAll()
    if (this.audioContext) {
      try {
        this.audioContext.stop()
        this.audioContext.destroy()
      } catch (e) {}
      this.audioContext = null
    }
  },

  startBreathing() {
    if (this.data.isRunning && !this.data.isPaused) return
    
    this.lastPhase = "idle"
    this.currentTargetRadius = 180
    this.animationStartTime = Date.now()
    
    this.setData({ 
      isRunning: true, 
      isPaused: false,
      phase: "inhale",
      breathText: "吸气"
    })
    
    // 播放背景音乐
    this.playBgMusic()
    
    this.startTime = Date.now() - this.elapsed
    this.startTimer()
    this.startParticleAnimation()
    this.runBreathCycle()
  },

  pauseBreathing() {
    this.setData({ isPaused: true, phase: "paused", breathText: "已暂停" })
    this.elapsed = Date.now() - this.startTime
    this.stopAll()
  },

  stopBreathing() {
    this.stopAll()
    this.currentTargetRadius = 180
    this.setData({
      phase: "idle",
      timeLeft: 60,
      progress: 0,
      isRunning: false,
      isPaused: false,
      breathText: "点击开始",
      circleScale: 1,
      particles: generateParticles(PARTICLE_COUNT),
      glowIntensity: 0.4
    })
    this.elapsed = 0
    this.lastPhase = "idle"
  },

  stopAll() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    if (this.breathTimer) {
      clearTimeout(this.breathTimer)
      this.breathTimer = null
    }
    if (this.particleTimer) {
      clearInterval(this.particleTimer)
      this.particleTimer = null
    }
    if (this.audioContext) {
      this.audioContext.pause()
    }
  },

  startTimer() {
    this.timer = setInterval(() => {
      const elapsed = Date.now() - this.startTime
      const timeLeft = Math.max(0, Math.ceil((TOTAL_DURATION - elapsed) / 1000))
      const progress = Math.min(100, (elapsed / TOTAL_DURATION) * 100)
      
      this.setData({ timeLeft, progress })
      
      if (elapsed >= TOTAL_DURATION) {
        this.completeBreathing()
      }
    }, 100)
  },

  runBreathCycle() {
    if (this.data.isPaused) return
    
    const { phase } = this.data
    
    // 检测阶段变化，重置动画时间
    if (phase !== this.lastPhase) {
      this.lastPhase = phase
      this.animationStartTime = Date.now()
    }
    
    if (phase === "inhale") {
      this.currentTargetRadius = 240
      this.animateCircle(1.3, BREATH_PATTERN.inhale)
      this.breathTimer = setTimeout(() => {
        if (this.data.isPaused) return
        this.setData({ phase: "hold", breathText: "屏息" })
        this.runBreathCycle()
      }, BREATH_PATTERN.inhale)
    } else if (phase === "hold") {
      // 保持当前半径不变
      this.breathTimer = setTimeout(() => {
        if (this.data.isPaused) return
        this.setData({ phase: "exhale", breathText: "呼气" })
        this.runBreathCycle()
      }, BREATH_PATTERN.hold)
    } else if (phase === "exhale") {
      this.currentTargetRadius = 180
      this.animateCircle(1, BREATH_PATTERN.exhale)
      this.breathTimer = setTimeout(() => {
        if (this.data.isPaused) return
        this.setData({ phase: "inhale", breathText: "吸气" })
        this.runBreathCycle()
      }, BREATH_PATTERN.exhale)
    }
  },

  animateCircle(targetScale, duration) {
    const startScale = this.data.circleScale
    const startTime = Date.now()
    
    const animate = () => {
      if (this.data.isPaused) return
      
      const elapsed = Date.now() - startTime
      const progress = Math.min(1, elapsed / duration)
      
      // 使用 ease-in-out 缓动
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2
      
      const currentScale = startScale + (targetScale - startScale) * easeProgress
      this.setData({ circleScale: currentScale })
      
      if (progress < 1) {
        setTimeout(animate, 16)
      }
    }
    
    setTimeout(animate, 16)
  },

  startParticleAnimation() {
    const baseRadius = 180 // 基础半径
    const expandedRadius = 240 // 扩展半径
    
    // 记录上一次的粒子状态
    let lastParticles = [...this.data.particles]
    
    this.particleTimer = setInterval(() => {
      if (this.data.isPaused) return
      
      const { phase, particles } = this.data
      const now = Date.now()
      
      // 平滑过渡目标半径
      let targetRadius = baseRadius
      if (phase === "inhale") {
        targetRadius = expandedRadius
      } else if (phase === "hold") {
        // 保持当前状态
        targetRadius = this.currentTargetRadius
      } else if (phase === "exhale") {
        targetRadius = baseRadius
      }
      
      // 更新每个粒子
      const newParticles = particles.map((p, index) => {
        // 使用 lerp 平滑过渡半径
        const currentRadius = p.radius
        const smoothFactor = 0.08 // 平滑系数，越小越平滑
        const newRadius = currentRadius + (targetRadius + p.radiusOffset - currentRadius) * smoothFactor
        
        // 角度缓慢旋转
        const rotationSpeed = 0.0003 * p.speed
        const newAngle = p.baseAngle + now * rotationSpeed + p.angleOffset
        
        // 添加轻微的脉动效果
        const pulse = Math.sin(now * 0.003 + p.pulsePhase) * 8
        
        // 计算粒子位置
        const finalRadius = newRadius + pulse
        const x = Math.cos(newAngle) * finalRadius
        const y = Math.sin(newAngle) * finalRadius
        
        // 平滑过渡透明度
        let targetOpacity = 0.7
        if (phase === "inhale") {
          targetOpacity = 0.9
        } else if (phase === "exhale") {
          targetOpacity = 0.5
        }
        const newOpacity = p.opacity + (targetOpacity - p.opacity) * 0.05
        
        return {
          ...p,
          angle: newAngle,
          radius: newRadius,
          x,
          y,
          opacity: newOpacity
        }
      })
      
      // 平滑过渡发光强度
      let targetGlow = 0.4
      if (phase === "inhale") {
        targetGlow = 0.8
      } else if (phase === "exhale") {
        targetGlow = 0.3
      }
      const newGlow = this.data.glowIntensity + (targetGlow - this.data.glowIntensity) * 0.05
      
      this.setData({ 
        particles: newParticles,
        glowIntensity: newGlow
      })
      
      lastParticles = newParticles
    }, 16)
  },

  completeBreathing() {
    this.stopAll()
    this.setData({
      phase: "complete",
      isRunning: false,
      breathText: "完成！"
    })
    
    // 显示情绪打分入口
    setTimeout(() => {
      this.setData({ showMoodEntry: true })
    }, 500)
  },

  playBgMusic() {
    // 背景音乐URL需要配置，这里先不播放
    // this.audioContext.src = ""
    // this.audioContext.play()
  },

  toggleSound() {
    if (!this.audioContext) return
    
    if (this.audioContext.paused) {
      this.audioContext.play()
    } else {
      this.audioContext.pause()
    }
  },

  goToMoodScore() {
    wx.navigateTo({ url: "/pages/moodScore/moodScore" })
  },

  goBack() {
    wx.navigateBack()
  }
})
