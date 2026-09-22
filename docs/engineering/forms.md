# H5 表单基线

本文定义正式 H5 的非简单表单约定。目标是让字段值、校验、错误展示、回填/reset 与提交有一致模式，同时保持现有 Com Design 视觉组件不变。

## 1. 适用范围

优先使用 React Hook Form + Zod 的场景：

- 多字段表单；
- 有编辑回填 / reset；
- 有字段级错误；
- 有提交态或未来需要异步提交；
- 同一份数据会进入 domain/service 层。

单个搜索框、一次性筛选、简单验证码输入等轻量交互不要求为了统一而强行迁移。

## 2. 单一校验事实源

正式表单使用 Zod schema 作为主要运行时校验事实源，并从 schema 推导 TypeScript 类型。

```ts
export const exampleFormSchema = z.object({
  name: z.string().refine((value) => value.trim().length > 0, '请输入名称'),
})

export type ExampleFormData = z.infer<typeof exampleFormSchema>
```

不要同时保留另一套手写 `validateXxxForm` 规则。展示文案可以来自既有 copy 常量，但“什么值算通过”只在 schema 中定义。

如果旧逻辑只是用 `trim()` 判断有效性，但保存时保留原值，不要为了写短代码改成会转换数据的 `.trim()` schema；迁移默认保持原业务语义。

## 3. RHF + Zod resolver

标准入口：

```ts
const form = useForm<FormData>({
  resolver: zodResolver(formSchema),
  defaultValues,
  mode: 'onSubmit',
})
```

- `handleSubmit` 负责提交前 resolver 校验；页面不再自行维护一份 errors map。
- 编辑态 / fixture 深链切换通过 `reset(nextValues)` 回填，不重新发明多套 setState 同步逻辑。
- 只有确有交互语义时才调用 `trigger`、`clearErrors` 或 `setError`。
- 后端字段错误未来应通过 RHF 的 `setError` 进入同一错误展示通道，不另起页面级字段错误对象。

## 4. 与 Com Design 组件配合

H012 不要求为了 RHF 改写视觉组件。

当前 `Input` / `Select` 是 controlled API 且未为 RHF 专门暴露 ref，因此样板页使用 `Controller`：

```tsx
<Controller
  name="name"
  control={control}
  render={({ field, fieldState }) => (
    <Input
      value={field.value}
      error={fieldState.error?.message}
      onBlur={field.onBlur}
      onChange={(event) => field.onChange(event.target.value)}
    />
  )}
/>
```

后续只有在多个真实表单都能受益时，才考虑给公共组件补 `forwardRef` 或专用 RHF wrapper；不要为单张卡扩大设计系统改动面。

## 5. AddressNew 样板

H012 首个迁移样板为正式 H5 `src/pages/AddressNew.tsx`：

- 四个地址字段 + 默认地址开关全部进入 RHF；
- `src/app/forms/address.ts` 是地址表单校验与 schema-derived type 的主要事实源；
- 新增 / 编辑共用同一 schema；
- 编辑目标变化通过 `reset` 回填；
- `?state=invalid` 继续通过 `trigger` 展示确定性错误态；
- 手机号输入仍在 UI 输入阶段过滤非数字；
- 原“字段一发生变化就清掉该字段错误”的交互通过 RHF `clearErrors` 保留；
- 保存仍调用既有 `addAddress` / `updateAddress`，不在 H012 改业务数据流；
- 粘贴识别、行政区划数据源和其它未确认规则继续保持原 blocker，不在表单基建里补齐。

## 6. 不做的事情

- 不把所有简单输入都迁成 RHF；
- 不修改 legacy / Native reference 表单；
- 不用表单库顺手新增未确认必填项、密码强度、异步重复校验等产品规则；
- 不让 form schema 承担 API response contract；服务端数据契约仍由对应 contract/service 层负责。
