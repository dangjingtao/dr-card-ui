# H015｜JSBridge Adapter 与 Native 导航边界

**Status:** Blocked  
**Phase:** Host Integration  
**Depends on:** H002, H006, H009  
**Blocker:** Native JSBridge 真实能力、方法名、参数/回调与版本协议尚未确认

## 目标

建立 H5 与 App 宿主之间唯一、可检测、可失败的 Bridge 边界，并把生产 H5 对 Native reference 路由的临时导航依赖收口。

## 范围

- capability detection、调用封装、Promise 归一化、timeout、unsupported/error。
- host/version 信息与支持判断。
- Browser Mock 仅模拟已确认的真实能力。
- H5→Native 返回/导航等实际需要的宿主边界在协议确认后接入。

## 不做

- 不散落 `window.xxx`。
- 不自行发明扫码、相机、相册、分享、登录、导航协议。
- 不让 Native 默认代理 H5 的业务 HTTP。

## 验收

- 至少一个真实 Native 能力通过 adapter 在 App WebView 验证成功。
- Browser 环境对 unsupported 有确定行为。
- 页面不直接依赖宿主全局对象或 legacy reference 路由来模拟宿主能力。

## 解阻条件

Native 同事提供可验证的 Bridge 协议/宿主 build 后转 `Ready`。
