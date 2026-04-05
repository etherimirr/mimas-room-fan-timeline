# Fan Timeline Starter

一个独立于现有仓库内容的 Next.js starter，用来实现：

- 数据驱动内容
- 事件驱动解锁
- 基于 `first_seen_at` 的时间推进
- 本地用户状态记忆
- 分支与周目扩展

## 目录

- `app/`: 页面与样式
- `components/`: 展示组件
- `data/`: 剧情与事件 JSON
- `lib/`: 时间、条件、引擎逻辑
- `state/`: 浏览器端用户状态存储

## 本地运行

```bash
cd fan-timeline-starter
npm install
npm run dev
```

## 当前 MVP

- 首页与粉丝视角文案
- 日记列表渲染
- 基于 `first_seen_at` 的 24 小时解锁
- `localStorage` 用户状态
- 留言触发分支
- 夜间文案变体
- glitch 文本效果
- 第 2 次访问触发异常内容

## 生产化建议

- 把 `first_seen_at`、`flags`、`loop` 移到后端
- 所有时间判断改为服务端时间
- 用数据库替代 `localStorage`
- 增加管理后台维护 `entries.json` / `events.json`
