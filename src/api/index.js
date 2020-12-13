import axios from 'axios'

const req = axios.create({
  withCredentials: true
})

req.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    let errObj = error

    if (error.response) {
      errObj = JSON.parse(JSON.stringify({
        data: error.response.data,
        status: error.response.status
      }))
    }

    if (process.env.NODE_ENV === 'development') console.log(errObj)
    return Promise.reject(errObj)
  }
)

export async function apiDrawLotto (awardName, num) {
  try {
    const res = await req.post('/api/draw', {
      name: awardName,
      number: num
    })
    return { data: res.data.data }
  } catch (err) {
    if (err.status === 400) {
      // 獎項剩餘數量不足
      console.log(err, '400')
    } else if (err.status === 500) {
      // 找不到對應獎項
      console.log(err, '500')
    }
    return { error: err }
  }
}

export async function apiGiveUpAward (staffCode) {
  try {
    const res = await req.put('/api/withdraw', {
      staffCode
    })
    console.log(res)
    return res.data
  } catch (err) {
    if (err.status === 400) {
      // 沒中獎的人不能放棄得獎
      console.log(err, '400')
    }
  }
}

export async function apiGetAwardResult (awardName) {
  try {
    const res = await req.get('/api/award', {
      params: {
        name: awardName
      }
    })
    console.log(res)
    return { data: res.data.data }
  } catch (err) {
    if (err.status === 400) {
      // 獎項未有得獎者
      console.log(err, '400')
    } else if (err.status === 500) {
      // 找不到對應獎項
      console.log(err, '500')
    }
    return { error: err }
  }
}

export async function apiGetMemberList () {
  try {
    const res = await req.get('/api/candidate/all')
    return { data: res.data.data }
  } catch (err) {
    return { error: err }
  }
}

export async function apiFetchAwardStatus () {
  try {
    const res = await req.get('/api/award/all')
    return { data: res.data.data }
  } catch (err) {
    return { error: err }
  }
}
