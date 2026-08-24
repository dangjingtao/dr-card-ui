import { createBrowserRouter, Navigate } from 'react-router-dom'
import MobileLayout from '../../layouts/MobileLayout'
import Home from '../../pages/Home'
import DearseedColumn from '../../pages/DearseedColumn'
import Checkin from '../../pages/Checkin'
import Membership from '../../pages/Membership'
import Profile from '../../pages/Profile'
import Luck from '../../pages/Luck'
import DrawSuccess from '../../pages/DrawSuccess'
import Card from '../../pages/Card'
import CardShare from '../../pages/CardShare'
import ScanVerify from '../../pages/ScanVerify'
import ConfirmVerify from '../../pages/ConfirmVerify'
import PasswordVerify from '../../pages/PasswordVerify'
import MembershipLevels from '../../pages/MembershipLevels'
import Redeem from '../../pages/Redeem'
import Exchange from '../../pages/Exchange'
import ExchangeResult from '../../pages/ExchangeResult'
import Points from '../../pages/Points'
import Settings from '../../pages/Settings'
import Onboarding from '../../pages/Onboarding'
import ClaimSuccess from '../../pages/ClaimSuccess'
import BrandCulture from '../../pages/BrandCulture'
import WelfareOfficer from '../../pages/WelfareOfficer'
import ServiceChat from '../../pages/ServiceChat'
import ServiceHuman from '../../pages/ServiceHuman'
import Notifications from '../../pages/Notifications'
import NotificationDetail from '../../pages/NotificationDetail'
import Address from '../../pages/Address'
import AddressNew from '../../pages/AddressNew'
import Orders from '../../pages/Orders'
import OrderDetail from '../../pages/OrderDetail'
import Buddy from '../../pages/Buddy'
import BuddyInvite from '../../pages/BuddyInvite'
import BuddyShareResult from '../../pages/BuddyShareResult'
import BuddyPhoneInvite from '../../pages/BuddyPhoneInvite'
import BuddyScanLanding from '../../pages/BuddyScanLanding'
import BuddyAccept from '../../pages/BuddyAccept'
import Tokens from '../../pages/Tokens'
import NodeStub from '../../pages/NodeStub'
import WebViewBoundary from '../../pages/WebViewBoundary'
import NotFound from '../../pages/NotFound'
import { ROUTES } from './routes'
import type { ReactElement } from 'react'

/** 已完成/进行中的定制页面（其余节点走确定性 NodeStub 或 WebView 边界页） */
const customPages: Record<string, ReactElement> = {
  '/': <Home />,
  '/dearseed': <DearseedColumn />,
  '/checkin': <Checkin />,
  '/membership': <Membership />,
  '/profile': <Profile />,
  '/luck': <Luck />,
  '/luck/result': <DrawSuccess />,
  '/card': <Card />,
  /* T009：#65 选择接收人与 #66 转赠成功为同一条链路，用 ?state=success 切换 */
  '/card/share': <CardShare />,
  '/card/verify': <ScanVerify />,
  '/card/verify/confirm': <ConfirmVerify />,
  '/card/verify/password': <PasswordVerify />,
  '/membership/levels': <MembershipLevels />,
  '/redeem': <Redeem />,
  /* T008：#18/#37/#38 是同一列表的排序状态，#40 沿用兑换专区作为背景层 */
  '/exchange': <Exchange />,
  '/exchange/result': <ExchangeResult />,
  '/points': <Points />,
  '/settings': <Settings />,
  '/onboarding': <Onboarding />,
  /* T005：#25 与 #15 在摹客中是同构弹窗，仅文案不同，共用 ClaimSuccess */
  '/onboarding/success': <ClaimSuccess source="onboarding" />,
  '/claim/success': <ClaimSuccess source="campaign" />,
  /* T005：#16 品牌文化按原型只铺长图，不加浮动 CTA（用户定案，B-001 关闭） */
  '/brand-culture': <BrandCulture />,
  '/service/welfare-officer': <WelfareOfficer />,
  /* T013：#58 智能客服承载 #71 弹层，#70 为转人工后的排队/接入两态 */
  '/service/chat': <ServiceChat />,
  '/service/chat/human': <ServiceHuman />,
  '/notifications': <Notifications />,
  '/notifications/:id': <NotificationDetail />,
  /* T010：#60 同时承载新增与 `?id=` 回填编辑（原型未单独画编辑页，见 B-027） */
  '/address': <Address />,
  '/address/new': <AddressNew />,
  '/orders': <Orders />,
  '/orders/:id': <OrderDetail />,
  /* T007：搭子与邀请闭环；#31 默契值明确先不做，不登记页面实现。 */
  '/buddy': <Buddy />,
  '/buddy/invite': <BuddyInvite />,
  '/buddy/invite/qrcode': <BuddyShareResult />,
  '/buddy/invite/phone': <BuddyPhoneInvite />,
  '/buddy/invite/scan': <BuddyScanLanding />,
  '/buddy/accept': <BuddyAccept />,
}

export const router = createBrowserRouter([
  {
    element: <MobileLayout />,
    children: [
      ...ROUTES.map((route) => {
        let element: ReactElement = <NodeStub />
        if (customPages[route.path]) element = customPages[route.path]
        else if (route.boundary === 'webview') element = <WebViewBoundary />
        return { path: route.path, element }
      }),
      /* T002 品牌 Token 展示页（工程参照页，不属于业务节点，不进入业务导航） */
      { path: '/tokens', element: <Tokens /> },
      { path: '/draw-success', element: <Navigate to="/luck/result" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
