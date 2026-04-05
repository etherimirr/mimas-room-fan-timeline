# 互动叙事网页产品方案

## 第一部分：项目定义

我要做一个互动叙事网页产品，不是普通博客或普通游戏官网。

这是一个以“粉丝视角”进入偶像个人主页 / 日记站的沉浸式体验。重点是随着时间推进，用户逐渐感觉网站在记住他、回应他、甚至观察他。它需要支持长期更新日记、新事件、分支和周目。

## 第二部分：剧情目标

- 开始时页面看起来正常、温柔、可爱、日常。
- 后面逐渐出现不对劲的感觉。
- 重点不是强恐怖，而是轻微失真、窥视感、身份混淆。
- 用户应当感觉自己不是旁观者，而是被卷入其中的粉丝。

## 第三部分：风格要求

- 90 年代早期个人主页 / old web / diary site 风格。
- 简单 HTML 感，不要太现代产品 UI。
- 浅粉、白、柔和蓝。
- 表面清新可爱，底层不安。
- 异常效果要克制，不要一开始就很恐怖。

## 第四部分：系统规则

- 每个用户有独立时间线。
- 所有事件基于 `first_seen_at` 推进。
- 必须记录 `first_seen_at`、`last_seen_at`、`flags`、`read_entries`、`loop`。
- 内容必须数据驱动，不能写死在组件里。
- 必须支持新增日记、事件、分支、周目。
- 结构要可维护，适合后续持续更新。

## 第五部分：技术要求

- 推荐用 `Next.js / React`。
- 前期先用 `localStorage`。
- 结构上要可迁移到数据库。
- 请优先设计内容 schema、状态结构、时间驱动逻辑。

## 第六部分：这次只做的 MVP 范围

- 首页
- 日记系统
- 用户首次进入时间记录
- 24 小时解锁第二篇日记
- 一个基于 flags 的分支
- 一个轻微 glitch 效果
- 为未来扩展预留空间

## 第七部分：先输出方案，不要直接写代码

请先输出：
1. 技术方案
2. 目录结构
3. 数据 schema
4. 用户状态设计
5. 时间驱动逻辑
6. MVP 开发步骤

等我确认后再开始写代码。

---

## 1. 技术方案

建议采用 `Next.js + React` 做前端主体，原因是它适合后续从纯前端 MVP 平滑扩展到带后端和 API 的版本，也方便后面接数据库、服务端时间和内容管理。

MVP 阶段建议：
- 前端框架：`Next.js`
- 组件层：`React`
- 样式：原生 CSS 或 CSS Modules
- 内容存储：本地 `JSON`
- 用户状态：`localStorage`
- 时间参考：先用前端时间，外加一个简单 `/api/time` 作为后续服务端时间接口预留

架构原则：
- UI 只负责展示
- 剧情推进由时间规则 + 条件判断 + 事件系统决定
- 内容必须数据驱动
- 用户状态必须独立持久化
- 结构要为后续迁移到 `Supabase / Firebase / 自建后端` 预留空间

后续可扩展方向：
- 把 `first_seen_at`、`flags`、`loop` 存到数据库
- 用服务端时间替代本地时间
- 增加内容编辑后台
- 增加通知、订阅、更多分支和周目内容

## 2. 目录结构

推荐结构如下：

```txt
/app
  layout.js
  page.js
  globals.css
  /api
    /time
      route.js

/components
  HomePage.jsx
  DiaryList.jsx
  DiaryCard.jsx
  DiaryDetail.jsx
  GlitchText.jsx
  StatusPanel.jsx

/data
  entries.json
  events.json

/lib
  engine.js
  time.js
  conditions.js
  content.js

/state
  userStore.js
  userSchema.js

/docs
  project-brief.md
  design-notes.md
```

职责划分：
- `app/`：页面入口、路由、基础 API
- `components/`：纯展示组件，不处理剧情逻辑
- `data/`：日记、事件、条件配置
- `lib/`：解锁规则、时间计算、内容过滤、事件处理
- `state/`：用户状态定义与存取
- `docs/`：后续需求说明与设计记录

## 3. 数据 schema

建议先定义两类核心数据：`entries` 和 `events`。

`entries.json` 示例：

```json
[
  {
    "id": "entry_001",
    "type": "diary",
    "title": "今天的更新",
    "summary": "一篇普通的近况日记",
    "content": "今天的拍摄比想象中顺利。",
    "branch": "main",
    "loop_required": 1,
    "unlock_after_hours": 0,
    "requires_flags": [],
    "excludes_flags": [],
    "only_at_night": false,
    "variants": {
      "default": "今天的拍摄比想象中顺利。",
      "night": "这么晚了，你还在看吗？"
    },
    "presentation": {
      "glitch": false,
      "hidden_text": ""
    },
    "assets": {
      "image": "",
      "audio": ""
    }
  }
]
```

字段建议：
- `id`
- `type`：`diary | fragment | message`
- `title`
- `summary`
- `content`
- `branch`
- `loop_required`
- `unlock_after_hours`
- `requires_flags`
- `excludes_flags`
- `only_at_night`
- `variants`
- `presentation`
- `assets`

`events.json` 示例：

```json
[
  {
    "id": "event_comment_unlock",
    "trigger": "comment_submitted",
    "conditions": {
      "requires_flags": [],
      "min_visit_count": 1,
      "only_at_night": false
    },
    "effects": [
      {
        "type": "set_flag",
        "flag": "left_comment",
        "value": true
      },
      {
        "type": "log",
        "message": "用户留下了评论"
      }
    ]
  }
]
```

事件结构建议：
- `id`
- `trigger`：如 `first_visit`、`page_view`、`comment_submitted`、`entry_read`
- `conditions`
- `effects`

`effects` 建议支持：
- `set_flag`
- `unset_flag`
- `unlock_entry`
- `switch_branch`
- `advance_loop`
- `log`

## 4. 用户状态设计

建议 MVP 用户状态如下：

```json
{
  "id": "fan_ab12cd34",
  "first_seen_at": "2026-04-04T18:00:00.000Z",
  "last_seen_at": "2026-04-04T18:10:00.000Z",
  "visit_count": 1,
  "loop": 1,
  "flags": {
    "left_comment": false,
    "repeat_visitor": false
  },
  "read_entries": [],
  "unlocked_entries": [],
  "current_branch": "main",
  "display_name": "",
  "event_log": []
}
```

字段说明：
- `id`：匿名用户唯一 ID
- `first_seen_at`：首次进入时间，所有推进的起点
- `last_seen_at`：最近访问时间
- `visit_count`：累计访问次数
- `loop`：当前周目
- `flags`：条件判断核心字段
- `read_entries`：已阅读内容
- `unlocked_entries`：已解锁内容
- `current_branch`：当前分支
- `display_name`：粉丝称呼
- `event_log`：最近触发过的事件

设计原则：
- 状态尽量轻量且稳定
- 条件判断尽量依赖 `flags + time + loop`
- 不把复杂剧情写进状态本身

## 5. 时间驱动逻辑

核心公式：

```js
elapsedTime = now - user.first_seen_at
```

时间逻辑分两层：

主推进时间：
- 用于控制内容何时解锁
- 例如 `unlock_after_hours: 24`
- 意义是“该用户进入 24 小时后解锁”

氛围时间：
- 用于控制文案变体或特殊显示
- 例如 `only_at_night: true`
- 意义是“只在夜间显示某个文本版本”

推荐判断流程：
1. 页面加载
2. 读取或创建用户状态
3. 记录 `last_seen_at`
4. 计算 `elapsedTime`
5. 遍历全部 `entries`
6. 对每个 entry 判断：
   - 是否满足 `unlock_after_hours`
   - 是否满足 `requires_flags`
   - 是否命中 `excludes_flags`
   - 是否满足 `loop_required`
   - 是否满足 `only_at_night`
7. 输出当前可见内容
8. 用户产生行为后触发事件系统
9. 事件系统更新 `flags / branch / loop / unlocked_entries`
10. 页面重新渲染

正式版注意：
- 不能完全信任客户端时间
- 生产环境应改成服务端保存 `first_seen_at`
- 当前时间应尽量来自服务端

## 6. MVP 开发步骤

建议按下面顺序开发：

1. 搭建项目骨架  
建立 `Next.js` 项目、基础页面、全局样式、目录结构。

2. 定义用户状态层  
实现 `userStore`，支持首次创建、读取、保存、更新本地状态。

3. 定义内容数据  
编写 `entries.json` 和 `events.json`，准备最少 2 到 4 条内容。

4. 实现时间与条件判断  
完成 `time.js`、`conditions.js`、`engine.js`，让系统能根据状态和时间筛选可见内容。

5. 实现首页和日记系统  
首页展示站点氛围和日记列表；支持点击进入日记详情；阅读后写入 `read_entries`。

6. 实现 24 小时解锁  
至少一篇日记基于 `first_seen_at + 24h` 解锁。

7. 实现一个 flag 分支  
例如用户留言后设置 `left_comment = true`，解锁一篇特殊内容。

8. 实现一个轻微 glitch 效果  
例如一行文字轻微闪烁、错位，或在二次访问后出现细微异常文案。

9. 做扩展预留  
确保新增 entry、event、loop 内容时不需要修改核心组件。

## MVP 完成标准

- 每个用户首次访问会生成独立状态
- 日记内容由数据决定，不写死在组件里
- 第二篇日记会在 24 小时后解锁
- 至少一个行为会触发分支
- 至少一个轻微异常效果出现
- 代码结构支持未来继续加内容
