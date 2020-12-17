import gsap from 'gsap'

export default class Particle {
  constructor (text, x, y, alpha, ctx, img, idx) {
    this.id = idx
    this.type = 'normal'
    this.ctx = ctx
    this.img = img

    this.ox = x
    this.oy = y
    this.oa = alpha
    this.cameraX = 0
    this.cameraY = 0
    this.w = 56
    this.h = 32

    this.text = text
    this.x = x
    this.y = y
    this.scale = 0.94
    this.alpha = alpha

    this.aniWave = null

    this.init()
  }

  init () {
    // this.ctx = ctx
    // this.img = img

    // this.reset()

    // set default animation
    this.aniWave = gsap.to(this, {
      // scale: 1,
      alpha: 0.3,
      duration: 2.5,
      x: () => `+=${gsap.utils.random(-10, 10)}`,
      delay: () => gsap.utils.random(10, -10, 1) * 0.2,
      yoyo: true,
      repeat: -1,
      ease: 'none',
      paused: true
    })
    this.aniWave.restart(true)
  }

  reset () {
    gsap.to(this, {
      x: this.ox,
      y: this.oy,
      alpha: this.oa,
      duration: 1,
      onComplete: () => {
        this.aniWave.restart(true)
      }
    })
  }

  render () {
    this.ctx.save()
    this.ctx.globalAlpha = this.alpha
    this.drawWave()
    this.ctx.restore()
  }

  drawWave () {
    const offsetX = this.cameraX + this.x + this.w / 2
    const offsetY = this.cameraY + this.y + this.h / 2
    this.ctx.translate(offsetX, offsetY)
    this.ctx.scale(this.scale, this.scale)
    this.ctx.translate(-this.w / 2, -this.h / 2)
    this.ctx.drawImage(this.img, 0, 0, this.w, this.h)
    this.ctx.fillText(this.text, this.w / 2, this.h / 2 + 2, this.w)
  }

  animate () {
    this.render()
  }
}
