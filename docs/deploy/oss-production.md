# 卡博士生产 H5：OSS 发布准备

## 事实与边界

- 前端仓库：`dangjingtao/dr-card-ui`。
- OSS Bucket：`kbs-sdl`，地域：`cn-guangzhou`，API Endpoint：`https://oss-cn-guangzhou.aliyuncs.com`。
- 构建：`npm run build:prod`，构建产物：`dist/`。
- 发布来源：仅 `prod` 分支。晋级沿用 `preview → dev → test → prod`，不得跳级。
- OSS 默认域名 `https://kbs-sdl.oss-cn-guangzhou.aliyuncs.com` **只能当存储 API / 文件入口，不能当正式 H5 页面入口**；阿里云默认域名访问 HTML 会触发强制下载。
- 当前工作流只将构建产物上传到 `oss://kbs-sdl/h5/releases/<SHA>/`，不覆盖 Bucket 根目录、不删除文件、**不会切换 App 的线上入口**。
- `VITE_BUDDY_PUBLIC_ORIGIN` 用于二维码公开入口，不能填 OSS 默认域名；需要另有可正常打开 HTML 的 HTTPS 网站域名。

## GitHub CI 工作流

`.github/workflows/oss-production.yml`：

1. PR 到 `dev/test/prod` 时用 `example.invalid` **仅校验生产包生成**，不访问云端，也不读云端密钥。
2. `prod` 更新后，先验证生产包，再触发 `upload-oss`。
3. `upload-oss` 需要 `oss-production` Environment 配置和授权，使用正式环境变量重新构建。
4. 上传到带 SHA 的隔离目录后，用 `ossutil stat` 检查首页文件和构建元数据。
5. 不自动执行 `ossutil rm`，也不变更 Bucket ACL、CDN、DNS 或 App 配置。

此阶段的 CI 绿灯只代表构建和上传链路通过；**不是** App WebView、真实 API、JSBridge 或产品上线验收。

## 云账号/仓库管理员配置

在 GitHub 仓库 `Settings → Environments` 新建 `oss-production`，建议配置 Required reviewers，将 Environment 限制为 `prod` 分支。

在该 Environment 设置：

| 类型 | 名称 | 值 |
| --- | --- | --- |
| Secret | `OSS_ACCESS_KEY_ID` | 公司 RAM 用户的 AccessKey ID |
| Secret | `OSS_ACCESS_KEY_SECRET` | 对应 AccessKey Secret，不得贴入 Issue/PR/聊天 |
| Variable | `OSS_PROD_API_BASE_URL` | 正式后端 HTTPS API 地址 |
| Variable | `OSS_PROD_PUBLIC_ORIGIN` | 未来可在浏览器/WebView 正常加载的正式 HTTPS 站点 Origin |

凭证只需访问 `kbs-sdl` 指定的 `h5/releases/*` 前缀；推荐独立 RAM 最小权限或 OIDC 临时凭证。**不要使用阿里云主账号密钥，也不要将凭证放进任何 `VITE_*` 变量。**

完成配置后，按原有 `test → prod` 验收晋级触发 OSS 上传；此工作流不会作为线上生效/域名切换按钮。正式网站仍需独立规划可浏览 HTML 的访问域名和 SPA 路由策略。

## 后续上线门槛

- 确定正式可用域名、HTTPS、内地备案、可用的 SPA fallback。
- 生产 API 的 CORS、鉴权与 App 白名单已适配该域名。
- CDN/OSS 资源缓存与哈希资源发布方式已验证，原子发布/回滚方案已确定。
- Android/iOS 真机 WebView + Native Bridge + 真实接口验收记录齐全。
- 不能以 GitHub CI 测试绿灯替代真机/业务验收。

阿里云参考：
- https://help.aliyun.com/zh/oss/developer-reference/ossutil-overview/
- https://help.aliyun.com/zh/oss/developer-reference/upload-objects-6
- https://help.aliyun.com/zh/oss/user-guide/regions-and-endpoints
