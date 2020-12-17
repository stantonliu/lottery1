<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 80 40"
    width="80"
    height="40"
    ref="pill"
    class="pill"
  >
    <rect fill="#263859" width="80" height="40" ry="8" rx="8"/>
  </svg>
  <!-- <button class="zoom" @click="resetAnimation">reset animation</button> -->
  <canvas id="canvas" ref="canvas"></canvas>
</template>

<script>
import { ref, watch, onMounted } from 'vue'
// eslint-disable-next-line no-unused-vars
import gsap from 'gsap'
import Particle from './Particle'
export default {
  name: 'Canvas',
  emits: ['animationend'],
  props: {
    members: {
      type: Array,
      required: true
    },
    picked: {
      type: Array,
      required: true
    },
    state: {
      type: String,
      default: 'normal'
    }
  },
  setup (props, context) {
    const canvas = ref(null)
    const pill = ref(null)
    // eslint-disable-next-line no-unused-vars
    const config = {
      column: 30,
      space: 8,
      pillWidth: 56,
      pillHeight: 32
    }
    let ctx = null
    let img = null
    let particles = []
    const picked = []
    const normal = []

    const tween = {
      focus: null,
      normal: null
    }
    watch(() => props.members, (val) => {
      if (val.length && !particles.length) {
        initParticles()
      }
    })

    watch(() => props.picked, (result, old) => {
      zoom(result)
    })

    onMounted(() => {
      initCanvas()
      gsap.ticker.add(updateCanvas)
    })

    const initCanvas = () => {
      // prepare canvas
      canvas.value.width = window.innerWidth
      canvas.value.height = window.innerHeight
      canvas.value.style.letterSpacing = '1px'
      ctx = canvas.value.getContext('2d')
      ctx.fillStyle = '#f3f5f7'
      ctx.font = '700 16px JetBrains'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      // prepare img for canvas
      const svg = pill.value.cloneNode(true)
      const outerHTML = svg.outerHTML
      const blob = new Blob([outerHTML], { type: 'image/svg+xml' })
      const domURL = window.URL || window.webkitURL || window
      const blobURL = domURL.createObjectURL(blob)

      img = new Image()
      img.src = blobURL
    }

    const initParticles = () => {
      particles = props.members.map((member, i) => {
        return new Particle(member.staffCode,
          gsap.utils.random(0 - canvas.value.width, canvas.value.width),
          gsap.utils.random(0 - canvas.value.height, canvas.value.height),
          gsap.utils.random(0.2, 0, 0.1),
          ctx, img, i)
      })
    }

    const updateCanvas = (t, dt, frame) => {
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
      particles.forEach((p, i) => p.animate(i))
    }

    const zoom = (result) => {
      particles.forEach(p => {
        p.aniWave.pause()
        // 分類 particle
        if (props.picked.some(item => item.staffCode === p.text)) {
          picked.push(p)
        } else {
          normal.push(p)
        }
      })

      tween.focus = gsap.to(picked, {
        keyframes: [
          {
            x: () => ctx.canvas.width / 2 + gsap.utils.random(-ctx.canvas.width / 4, ctx.canvas.width / 4, 10),
            y: () => ctx.canvas.height / 3 * 2 + gsap.utils.random(-ctx.canvas.height / 4, ctx.canvas.height / 4, 20),
            scale: 1,
            alpha: 1,
            duration: 1.5,
            ease: 'expo.inOut',
            onComplete: () => {
              context.emit('animationend')
            }
          },
          {
            x: () => `+=${20 * gsap.utils.random(-1, 1)}`,
            duration: 5,
            yoyo: true,
            repeat: -1
          }
        ]
      })

      tween.normal = gsap.to(normal, {
        keyframes: [
          {
            alpha: 0.15,
            scale: 0.7,
            x: () => ctx.canvas.width / 2 + gsap.utils.random(-ctx.canvas.width / 2, ctx.canvas.width / 2),
            y: () => `+=${gsap.utils.random(-ctx.canvas.height / 2, ctx.canvas.height / 2)}`,
            duration: 1.5,
            ease: 'expo.inOut'
          },
          {
            x: () => `+=${20 * gsap.utils.random(-1, 1)}`,
            duration: 5,
            yoyo: true,
            repeat: -1
          }
        ]
      })
    }

    const resetAnimation = () => {
      console.log('reset animation')
      tween.normal && tween.normal.kill()
      tween.focus && tween.focus.kill()

      picked.splice(0)
      normal.splice(0)

      particles.forEach((p, i) => {
        p.reset()
      })
    }

    return {
      canvas,
      pill,
      resetAnimation
    }
  }
}
</script>

<style lang="scss">
  #canvas {
    display: block;
  }
  .pill {
    display: none;
  }
  .zoom {
    position: absolute;
  }
</style>
