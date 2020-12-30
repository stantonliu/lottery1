<template>
  <div class="container">
    <h1 :class="{ hide: ui.showResult }">2020尾牙抽獎直播</h1>
    <div class="draw-tool">
      <div class="award-area" :class="{ 'animate-slide': ui.showResult }">
        <div class="selector-wrap">
          <div
          :class="['award-selector', { expand: ui.selectorExpand }]"
          :style="{ '--totalHeight': `${(lotto.awardList.length + 1) * 60}px` }"
        >
          <div class="selected-item" @click="ui.selectorExpand = !ui.selectorExpand">
            {{ award.name }}
          </div>
          <div class="select-options">
            <div class="option" v-for="item in lotto.awardList" :key="item.name" @click="awardHandler(item.name); ui.selectorExpand = false">
              {{ item.name }}
            </div>
          </div>
        </div>
        </div>
        <p class="price">{{ ui.currentPrice }}</p>
      </div>
      <div class="draw-area" v-show="ui.showDrawPanel" :class="{ disabled: award.details.remain < 1 }">
        <label name="num" class="num-selector">
          <input type="number" id="num" v-model="award.num" :max="award.details.remain" min="1">
          <p @click="award.num = award.details.remain">/ {{ award.details.remain }}</p>
        </label>
        <button @click="drawLotto" :disabled="award.details.remain < 1">開抽</button>
      </div>
    </div>
    <transition>
      <div class="result-panel" :class="{ show: ui.showResult, lg: ui.isBigPrice }" v-if="ui.showResult">
        <transition-group
          tag="div"
          name="stagger"
          :css="false"
          @before-enter="beforeSlideIn"
          @enter="onSlideIn"
          @after-enter="afterSlideIn"
          @before-leave="beforeSlideOut"
          @leave="onSlideOut"
          @after-leave="afterSlideOut"
        >
          <div
            v-for="(person, idx) in resultList"
            :key="person.staffCode"
            class="row"
            :data-list-order="idx"
            :data-list-delay="0.6"
            :style="`--delay: ${(idx > 10 ? 10 : idx) * 0.1}s`"
          >
            <div class="col code">{{ person.staffCode }}</div>
            <div class="col name">{{ person.staffName }}</div>
            <div class="col dep">{{ person.department }}</div>
            <div class="giveup">
              <button @click="ensureGiveupProcess(person)"><i class="gg-close"></i></button>
            </div>
          </div>
        </transition-group>
      </div>
    </transition>
  </div>
  <div class="floating-btn">
    <button @click="panelHandler()" v-show="ui.showResult"><i class="gg-corner-up-left"></i></button>
    <button @click="panelHandler('all')" v-show="award.details?.memberList?.length"><i class="gg-eye"></i></button>
  </div>
  <div class="lightbox" v-if="ui.showLightbox && ui.giveupData" @click.self="ui.showLightbox = false">
    <div class="modal">
      <p>{{ ui.giveupData.staffCode }} {{ ui.giveupData.staffName }}</p>
      <p>確定放棄此獎項？</p>
      <div class="control">
        <button class="btn fill" @click="giveup">確定</button>
        <button class="btn outline" @click="ui.showLightbox = false">取消</button>
      </div>
    </div>
  </div>
  <div class="canvas-wrap">
    <Canvas :members="lotto.memberList" state="normal" :picked="award.result" @animationend="panelHandler('new')" ref="anim" />
  </div>
</template>

<script>
import { onMounted, computed, ref, watchEffect, watch, reactive } from 'vue'
import Canvas from '@/components/Canvas'
import useLotto from '@/store/lotto'

export default {
  name: 'App',
  components: {
    Canvas
  },
  setup (props, context) {
    const {
      lotto,
      award,
      getMemberList,
      getAwardResult,
      drawLotto,
      giveUpAward,
      fetchAwardList
    } = useLotto()

    const anim = ref(null)

    const ui = reactive({
      selectorExpand: false,
      resultType: 'new',
      showDrawPanel: true,
      showResult: false,
      isBigPrice: computed(() => {
        return ['一獎', '二獎', '三獎'].includes(award.name)
      }),
      currentPrice: computed(() => {
        if (!award.details.price) return null
        // else return Number(award.details.price).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD' }).split('.')[0]
        const splitter = award.details.price.split('+')
        const price = formatCurrency(splitter[0])
        const addition = splitter[1]

        return addition ? `${price}+${addition}` : price
      }),
      giveupData: null,
      showLightbox: false
    })
    function formatCurrency (price) {
      return Number(price).toLocaleString('zh-TW', { style: 'currency', currency: 'TWD' }).split('.')[0]
    }
    const resultList = ref([])
    const listCache = ref([])
    watch(listCache, (val, oldVal) => {
      if (!val.length) return
      const delay = val.length < oldVal.length ? 0 : 500
      // 控制 transition list 渲染時機
      setTimeout(() => {
        console.log('render list')
        resultList.value = val
      }, delay)
    })
    watchEffect(() => {
      if (!ui.showResult) {
        resultList.value = []
        listCache.value = []
        return
      }
      if (ui.resultType === 'new') {
        listCache.value = award.result
      } else {
        listCache.value = award.details.memberList
      }
    })

    onMounted(() => {
      fetchAwardList()
      getMemberList()
      awardHandler()
    })

    const awardHandler = (name) => {
      if (name === award.name) return
      if (name) award.name = name

      panelHandler()
      getAwardResult()
    }

    const resetStatus = () => {
      ui.showResult = false
      award.num = 1
      award.result.splice(0)
      ui.showDrawPanel = true
      console.log('reset status')
      // anim.value.resetAnimation()
    }

    const ensureGiveupProcess = ({ staffCode, staffName }) => {
      ui.giveupData = { staffCode, staffName }
      ui.showLightbox = true
    }

    const giveup = async (code) => {
      ui.showLightbox = false
      if (resultList.value.length <= 1) {
        anim.value.resetAnimation()
        setTimeout(() => {
          panelHandler()
        }, 600)
      }
      giveUpAward(ui.giveupData.staffCode)
      ui.giveupData = null
    }

    const panelHandler = (type) => {
      if (type) {
        // open
        if ((type === 'all' && award.details.memberList.length < 1) || (type === 'new' && award.result.length < 1)) return
        ui.resultType = type
        ui.showResult = true
        ui.showDrawPanel = false
      } else {
        if (award.result.length) anim.value.resetAnimation()
        resetStatus()
      }
    }

    const beforeSlideIn = (el) => {
      if (+el.dataset.listOrder <= 10) el.classList.add('slide-in')
    }

    const onSlideIn = (el, done) => {
      if (+el.dataset.listOrder > 10) return
      const delay = el.dataset.listDelay * 100
      setTimeout(() => {
        el.classList.add('active')
        el.addEventListener('transitionend', function onEnd () {
          done()
          el.removeEventListener('transitionend', onEnd)
        })
      }, delay)
    }

    const afterSlideIn = (el) => {
      if (+el.dataset.listOrder > 10) return
      el.classList.remove('active', 'slide-in')
    }

    const beforeSlideOut = (el) => {
      el.classList.add('slide-out')
    }

    const onSlideOut = (el, done) => {
      el.classList.remove('active')
      el.addEventListener('transitionend', function onEnd () {
        done()
        el.removeEventListener('transitionend', onEnd)
      })
    }

    const afterSlideOut = (el) => {
      el.classList.remove('slide-out')
    }

    return {
      award,
      lotto,
      drawLotto,
      giveup,
      awardHandler,
      anim,
      panelHandler,
      resultList,
      beforeSlideIn,
      onSlideIn,
      afterSlideIn,
      beforeSlideOut,
      onSlideOut,
      afterSlideOut,
      ui,
      ensureGiveupProcess
    }
  }
}
</script>

<style lang="scss">
@import '@/assets/main.scss';
.fade-enter, .fade-leave-to {
  opacity: 0 !important;
}
.fade-leave, .fade-enter-to {
  opacity: 1 !important;
}
.fade-enter-active, .fade-leave-active {
  // position: absolute !important;
  transition: opacity 0.2s ease-out !important;
}
#app {
  font-family: 'JetBrains', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  font-weight: bold;
  color: #f3f5f7;
  // color: #2c3e50;
  margin-top: 60px;
}
h1 {
  letter-spacing: 4px;
  font-size: 48px;
  transform: none;
  transition: opacity 0.2s ease 0.4s, transform 0.4s ease 0.4s;

  &.hide {
    opacity: 0;
    transform: translateY(-20px);
    transition: opacity 0.2s ease, transform 0s 0.2s;
  }
}
.canvas-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  z-index: -1;
  pointer-events: none;
  #canvas {
    margin-top: auto;
  }
}
.container {
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.draw-tool {
  position: relative;
  margin-top: 0px;
  padding: 40px 0 20px 0;
  width: 100%;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.award-area {
  position: relative;
  // width: 60vw;
  margin-left: -40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  will-change: transform;
  transition: transform 0.4s ease 0.2s;
  z-index: 50;

  .price {
    font-size: 50px;
    margin: 0;
    text-align: left;
  }

  .selector-wrap {
    position: relative;
    width: 150px;
    height: 60px;
    margin-bottom: 30px;
  }

  .award-selector {
    width: 150px;
    outline: none;
    border: none;
    appearance: none;
    white-space: nowrap;
    letter-spacing: 1px;
    color: #222;
    border-radius: 4px;
    height: 60px;
    overflow: hidden;
    background-color: #ff6768;
    text-align: center;
    cursor: pointer;
    transition: height 0.3s cubic-bezier(0.17,0.84,0.44,1);
    &.expand {
      height: 360px;
    }
    .selected-item, .option {
      width: 100%;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .selected-item {
      font-size: 30px;
    }
    .select-options {
      font-size: 24px;
      height: 300px;
      overflow-y: auto;
      background-color: #fb8080;
      scroll-snap-type: y mandatory;
      .option {
        scroll-snap-align: start;
      }
    }
  }

  &.animate-slide {
    transform: translateY(-100px);
  }
}
.draw-area {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-top: 40px;

  &.disabled {
    opacity: 0.7;
    .num-selector {
      pointer-events: none;
    }
  }
  .num-selector {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding: 0 10px;
    border-bottom: 2px solid rgba(#f3f5f7, 0.8);
    cursor: pointer;
  }
  input {
    outline: none;
    border: none;
    appearance: none;
    background-color: transparent;
    font-size: 40px;
    min-width: 60px;
    text-align: center;
    color: #f3f5f7;
    caret-color: #ff6768;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
  p {
    margin: 0;
    color: #ff6768;
    min-width: 50px;
    font-size: 20px;
    white-space: nowrap;
    transform: translateY(-5px);
  }
  button {
    display: block;
    appearance: none;
    background-color: transparent;
    border: none;
    outline: none;
    font-size: 20px;
    margin-left: 40px;
    padding: 5px 20px;
    border-radius: 4px;
    border: 2px solid rgba(#f3f5f7, 0.8);
    color: #f3f5f7;

    &[disabled] {
      cursor: not-allowed;
    }
  }
}
.result-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 30vh;
  min-width: 60vw;
  font-size: 20px;
  letter-spacing: 1px;
  transform: translateY(-80px);
  pointer-events: none;
  white-space: nowrap;
  will-change: transform;

  &.show {
    pointer-events: auto;
  }
  .row {
    position: relative;
    display: flex;
    align-items: center;
    height: 60px;
    padding: 0 70px 0 30px;
    background-color: #182635;
    border-radius: 6px;
    &:nth-child(even) {
      background-color: #151f28;
    }

    &:hover {
      .giveup {
        opacity: 1;
      }
    }
    //
    &.slide-in {
      transform: translateY(15px) translateZ(0);
      opacity: 0;
      transition: all 0.3s ease var(--delay);
      pointer-events: none;
    }
    &.slide-out {
      transform: translateX(-20px) translateZ(0);
      // transform: translateY(20px) translateZ(0);
      opacity: 0;
      transition: all 0.3s ease 0s;
      pointer-events: none;
    }
    &.active {
      transform: none;
      opacity: 1;
    }
  }
  .col {
    padding: 10px 20px;
  }

  .giveup {
    position: absolute;
    right: 30px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.2s ease;
    button {
      display: block;
      width: 20px;
      height: 20px;
      appearance: none;
      outline: none;
      border: none;
      color: #f3f5f7;
    }
  }

  &.lg {
    font-size: 24px;
  }
}

.floating-btn {
  position: fixed;
  bottom: 40px;
  right: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    appearance: none;
    outline: none;
    background-color: transparent;
    border: none;
    width: 40px;
    height: 40px;
    color: #182635;
    border-radius: 50%;
    background-color: #6b778d;
    box-shadow: 3px 5px 5px rgba(#000, 0.6);

    + button {
      margin-top: 10px;
    }
  }
}

.lightbox {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(#000, 0.8);
  z-index: 10;

  .modal {
    width: 300px;
    padding: 10px 20px 20px 20px;
    color: #444;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 3px 5px rgba(#000, 0.2);
    text-align: center;
  }

  .control {
    margin-top: 30px;
    display: flex;
    justify-content: center;

    .btn {
      color: #182635;
      border-radius: 4px;
      padding: 5px 24px;
      border: 2px solid #6b778d;

      &:active {
        transform: scale(0.97);
      }

      &.fill {
        color: #f3f3f3;
        background-color: #6b778d;;
      }

      + .btn {
        margin-left: 10px;
      }
    }
  }
}
</style>
