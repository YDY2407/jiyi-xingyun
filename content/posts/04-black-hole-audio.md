---
id: "black-hole-audio"
title: "黑洞理论与沉浸式声效合成"
category: "灵感碎片"
date: "2026-07-10"
summary: "将引力波公开数据映射为 Web Audio 参数，用声音表现距离、质量与时间弯曲，完成一次从科学数据到感官体验的转译。"
position: [-1.7, -2.2, -0.8]
color: "#ffbd6e"
tags: ["Web Audio", "WebGL", "Physics"]
readTime: "5 分钟"
---

引力波本身不在人的听觉范围内，但它的变化曲线可以被转译为声音。这个实验没有试图“还原宇宙真实的声音”，而是寻找一种忠于数据关系的听觉表达。

## 数据映射

- 波形振幅控制音量包络
- 频率变化映射振荡器音高
- 天体距离影响混响与声像宽度
- 合并瞬间触发低频脉冲

```javascript
oscillator.frequency.setValueAtTime(mappedFrequency, audioContext.currentTime)
gain.gain.linearRampToValueAtTime(amplitude, audioContext.currentTime + 0.03)
```

为了避免声音变成单纯噪声，最终版本只保留三个关键参数，并用可视化粒子的收缩帮助听者理解变化发生在哪里。

> 数据艺术的边界，在于不能为了戏剧效果扭曲原始关系。
