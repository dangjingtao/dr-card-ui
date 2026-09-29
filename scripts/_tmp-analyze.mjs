import fs from 'node:fs'
const s = fs.readFileSync('/tmp/app.js', 'utf8')
const needle = 'legacy-profile/login'
let i = -1, n = 0
while ((i = s.indexOf(needle, i + 1)) >= 0) { n++; console.log('#' + n + ' >> ' + s.slice(Math.max(0, i - 220), i + 30)) }
console.log('======= presence =======')
for (const k of ['home-banner-checkin','home-banner-wash-care','搜索你想要的商品','首页活动轮播','正在验证登录状态','诗得丽品牌专栏','redirectTo','/error?reason=auth']) { console.log(k + ' => ' + (s.indexOf(k) >= 0)) }
NaN
let j = -1, m = 0
while ((j = s.indexOf('path:"/"', j + 1)) >= 0 && m < 6) { m++; console.log('P' + m + ' >> ' + s.slice(Math.max(0, j - 40), j + 160)) }
NaN
let k2 = -1, m2 = 0
while ((k2 = s.indexOf("path:'/'", k2 + 1)) >= 0 && m2 < 6) { m2++; console.log('Q' + m2 + ' >> ' + s.slice(Math.max(0, k2 - 40), k2 + 160)) }
