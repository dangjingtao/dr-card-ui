# H011｜Storage Adapter

**Status:** Ready  
**Phase:** Foundation  
**Depends on:** H006

## 目标

建立统一的 H5 持久化边界，避免页面和 store 随意直接操作 Web Storage。

## 范围

- 建立 storage adapter 与集中 key 定义。
- 明确 localStorage / sessionStorage 的使用边界。
- 提供 SSR/不可用/解析失败等基础保护。
- 明确敏感凭据、消费密码、长期 secret 不允许进入普通 H5 storage。

## 不做

- 不引入 IndexedDB/localForage，除非出现真实大数据/Blob/offline 需求。
- 不决定尚未确认的认证 token 存储方案。

## 验收

- 正式 H5 新代码通过 adapter 访问 Web Storage。
- adapter 对缺失、损坏值有确定行为。
- 敏感数据规则写入代码规范或模块注释并可被后续 review 检查。

## 证据

记录 adapter API、基础测试/验证和 commit SHA。
