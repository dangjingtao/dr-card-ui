# H016｜路由过渡、返回与滚动体验

**Status:** Ready  
**Phase:** UX  
**Depends on:** H002

## 目标

为正式 H5 建立轻量、可降级的导航体验，不引入重动画框架。

## 范围

- 使用浏览器 View Transition 能力与 CSS；实施前按当前 React Router 版本确认实际 API。
- 一级 Tab 不做横向推页，最多轻微淡入。
- 一级→二级/详情提供克制前进感；返回方向在可可靠判断时对应处理。
- 尊重 `prefers-reduced-motion`，不支持时无动画正常工作。
- 处理返回、scroll restoration 与 WebView 中明显冲突。

## 不做

- 不给 legacy/Native reference 加动画。
- 不引入 Framer Motion / React Transition Group 只为路由动画。
- 不处理商城。

## 验收

- 正式 H5 典型前进/返回/Tab 链路无导航错乱、滚动异常或明显闪烁。
- reduced-motion 与不支持 View Transition 的浏览器正常降级。
- 动画保持短促克制，目标约 120–180ms。

## 证据

记录支持矩阵、代表性链路验证和 commit SHA。
