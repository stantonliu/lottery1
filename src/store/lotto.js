import { reactive, readonly } from 'vue'
import {
  apiGetMemberList,
  apiDrawLotto,
  apiFetchAwardStatus,
  apiGetAwardResult,
  apiGiveUpAward
} from '@/api'

export default function useLotto () {
  const lotto = reactive({
    loading: false,
    memberList: [],
    awardList: []
  })

  const award = reactive({
    name: '一獎',
    num: 1,
    details: {},
    result: []
  })

  async function getMemberList () {
    const { data, error } = await apiGetMemberList()
    if (error) return
    lotto.memberList = data
  }

  async function drawLotto () {
    lotto.loading = true
    const { data, error } = await apiDrawLotto(award.name, award.num)
    lotto.loading = false
    if (error) {
      console.log(error.data.message)
      return false
    }
    const { limit, money, memberList } = data

    // 如果還沒有抽過
    if (!award.details.memberList) {
      award.result = memberList
    } else {
      // 找出當前抽獎抽出的人
      award.result = memberList.filter(member => {
        if (award.details.memberList.some(item => item.staffCode === member.staffCode)) return false
        else return true
      })
    }

    // 同步獎項資訊
    award.details = {
      remain: limit,
      price: money,
      memberList: memberList
    }
    // 更新抽獎名單
    getMemberList()
  }

  async function getAwardResult (clearResult = true) {
    lotto.loading = true
    const { data, error } = await apiGetAwardResult(award.name)
    lotto.loading = false
    if (error) {
      console.log(error.data.message, 'get result')
      const { limit, money, memberList } = lotto.awardList.find(item => item.name === award.name)
      award.details = {
        remain: limit,
        price: money,
        memberList: memberList
      }
      return false
    }

    const { limit, money, memberList } = data

    if (clearResult) award.result.splice(0)
    console.log('get award result', memberList)
    award.details = {
      remain: limit,
      price: money,
      memberList: memberList
    }
  }

  async function fetchAwardList () {
    lotto.loading = true
    const { data, error } = await apiFetchAwardStatus()
    lotto.loading = false
    if (error) {
      console.log(error.data.message)
      return false
    }
    lotto.awardList = data
  }

  async function giveUpAward (staffCode) {
    // eslint-disable-next-line no-unused-vars
    const { data, error } = await apiGiveUpAward(staffCode)
    if (error) {
      console.log(error.data.message)
      return false
    }

    const idx = award.result.findIndex(item => item.staffCode === staffCode)
    award.result.splice(idx, 1)

    // fetchAwardList()
    getAwardResult(false)
  }

  return {
    lotto: readonly(lotto),
    award,
    getMemberList,
    getAwardResult,
    drawLotto,
    fetchAwardList,
    giveUpAward
  }
}
