import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { generateNebulaLayout } from '../src/lib/nebula-layout.js'

const subjects = [
  ['digital-photo', '数字照片档案', '影像档案', '#d8e7e7', ['摄影', '数字档案'], '照片迁移、去重、描述与长期保存之间的取舍'],
  ['city-sound', '城市声音地图', '城市漫游', '#75aef2', ['城市', '声音地图'], '采集地点、环境伦理和声音坐标之间的关系'],
  ['family-recipe', '家庭菜谱计划', '家庭档案', '#a9d6a5', ['食物', '家人'], '口述经验如何转化为仍然保留温度的家庭档案'],
  ['letter-ocr', '手写信 OCR', '数字人文', '#ffbd6e', ['OCR', '手写信'], '识别准确率、人工校对和原件证据之间的边界'],
  ['knowledge-base', '个人知识库', '产品思考', '#79e1d0', ['知识管理', '本地优先'], '采集、连接、检索与遗忘如何形成长期系统'],
  ['dream-journal', '梦境记录', '交互设计', '#d4c3ff', ['睡眠', '交互设计'], '低干扰输入、次日整理和私人内容保护'],
  ['running-data', '跑步数据日记', '生活实验', '#79e1d0', ['跑步', '数据可视化'], '身体感受如何与配速、心率和天气共同被阅读'],
  ['local-first', '本地优先应用', '技术前沿', '#75aef2', ['Local-first', '同步'], '离线编辑、冲突解决和数据所有权的工程实践'],
  ['webgpu-visual', 'WebGPU 可视化', '技术前沿', '#79e1d0', ['WebGPU', '可视化'], '计算着色器、设备差异和渐进增强策略'],
  ['ai-collaboration', '生成式 AI 协作', 'AI 架构', '#d4c3ff', ['AI Agent', '工作流'], '任务边界、验证证据和人机责任如何划分'],
  ['film-color', '电影色彩研究', '视觉文化', '#d4c3ff', ['电影', '色彩'], '影像色调如何参与个人经验与集体记忆'],
  ['season-watch', '四季自然观察', '自然观察', '#a9d6a5', ['自然观察', '时间'], '固定视角、连续记录和微小变化的意义'],
  ['playlist-history', '播放列表考古', '声音记忆', '#d4c3ff', ['音乐', '时间线'], '收听数据如何与生活事件相互印证'],
  ['time-capsule', '数字时间胶囊', '未来来信', '#ffbd6e', ['时间胶囊', '未来'], '开放格式、长期存储和未来阅读语境'],
  ['accessible-memory', '无障碍记忆界面', '交互设计', '#75aef2', ['无障碍', '界面设计'], '键盘、屏幕阅读器和减少动态效果的完整体验'],
  ['digital-minimal', '数字极简实验', '生活实验', '#a9d6a5', ['注意力', '数字极简'], '通知、使用边界和注意力恢复的真实变化'],
  ['indie-product', '独立产品开发', '开发日志', '#79e1d0', ['独立开发', '用户研究'], '有限资源下如何验证需求并持续交付'],
  ['privacy-vault', '私人记忆保险库', '产品思考', '#75aef2', ['隐私', '加密'], '加密、分享权限、导出和彻底删除的产品边界'],
  ['web-audio', 'Web Audio 声景', '声音记忆', '#ffbd6e', ['Web Audio', '声景'], '录音、合成与空间声音如何表达场所'],
  ['spatial-interface', '三维空间交互', '设计美学', '#79e1d0', ['Three.js', '空间交互'], '镜头、节点密度和深度线索如何共同建立方向感'],
]

const angles = [
  ['practice', '一次从零到一的实践记录', '实践复盘', '把抽象目标拆成一组可验证的小步骤'],
  ['workflow', '如何建立可持续的工作流', '工作流', '让记录、整理和回顾能够长期继续'],
  ['details', '三个容易忽略的细节', '细节', '从最容易被跳过的环节重新检查体验'],
  ['failure', '从失败原型中学到什么', '复盘', '通过一次未达到预期的尝试识别真正约束'],
  ['narrative', '数据背后的日常叙事', '数据叙事', '让数字重新连接具体的人、时间和场景'],
  ['checklist', '一份面向长期保存的设计清单', '设计清单', '用清晰检查项降低未来迁移与维护成本'],
  ['life', '当技术遇到真实生活', '技术与生活', '观察工具进入日常后产生的意外变化'],
  ['relationship', '重新理解时间与关系', '时间关系', '从连续记录中发现原本不可见的联系'],
  ['next', '下一阶段的实验计划', '实验计划', '定义下一轮假设、指标和停止条件'],
]

const outputDirectory = join(process.cwd(), 'content', 'posts')
const layout = generateNebulaLayout(200)
const baseDate = new Date(Date.UTC(2024, 11, 31))
mkdirSync(outputDirectory, { recursive: true })

let generated = 0

for (const subject of subjects) {
  for (const angle of angles) {
    const number = 21 + generated
    const [subjectSlug, subjectName, category, color, subjectTags, focus] = subject
    const [angleSlug, angleName, angleTag, method] = angle
    const date = new Date(baseDate)
    date.setUTCDate(baseDate.getUTCDate() - generated)
    const dateString = date.toISOString().slice(0, 10)
    const title = `${subjectName}：${angleName}`
    const summary = `围绕${subjectName}，从“${angleName}”切入，讨论${focus}，并整理一套可以继续迭代的方法。`
    const tags = [...subjectTags, angleTag]
    const position = layout[number - 1].map((value) => Number(value.toFixed(4)))
    const readTime = `${5 + ((number * 7) % 8)} 分钟`
    const id = `sample-${String(number).padStart(3, '0')}`
    const fileName = `${String(number).padStart(3, '0')}-${subjectSlug}-${angleSlug}.md`
    const body = `---
id: ${JSON.stringify(id)}
title: ${JSON.stringify(title)}
category: ${JSON.stringify(category)}
date: ${JSON.stringify(dateString)}
summary: ${JSON.stringify(summary)}
position: ${JSON.stringify(position)}
color: ${JSON.stringify(color)}
tags: ${JSON.stringify(tags)}
readTime: ${JSON.stringify(readTime)}
---

${subjectName}并不只是一个孤立的主题。它连接着具体工具、长期习惯和人的真实感受。这篇记录选择“${angleName}”作为观察入口，重点讨论${focus}。

## 本次关注

${method}。为了避免结论停留在概念层面，文章把过程拆成可以被观察和验证的行动。

- 先记录当前状态与真实限制
- 选择一个可以在一周内验证的最小步骤
- 同时保留结果、失败原因和环境信息
- 在下一次迭代前重新检查数据所有权

## 实践方法

1. 明确这次记录希望回答的问题。
2. 收集足够的信息，但不追求保存一切。
3. 用开放格式留下原始材料和必要元数据。
4. 邀请真实使用者复核理解是否一致。

> 好的记忆系统不替人决定意义，而是让未来仍然拥有重新理解的可能。

## 下一步

下一轮会继续围绕${focus}展开，并把本次结果与不同设备、不同时间尺度下的表现进行比较。真正重要的不是一次完成，而是建立能够持续修正的过程。
`

    writeFileSync(join(outputDirectory, fileName), body, 'utf8')
    generated += 1
  }
}

console.log(`Generated ${generated} Markdown posts. Total target: 200.`)
