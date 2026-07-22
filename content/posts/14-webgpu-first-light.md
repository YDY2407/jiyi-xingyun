---
id: "webgpu-first-light"
title: "WebGPU 初体验：浏览器里的十万颗星"
category: "技术前沿"
date: "2025-07-05"
summary: "从计算着色器到实例化渲染，本文用一个星群实验比较 WebGL 与 WebGPU 的思维差异，并记录性能调优过程。"
position: [1.1, 0.2, -3.1]
color: "#79e1d0"
tags: ["WebGPU", "性能优化", "可视化"]
readTime: "12 分钟"
---

这个实验的目标很简单：让十万颗星在浏览器中根据引力场实时移动，同时保持稳定交互。WebGL 版本需要在 CPU 与 GPU 之间反复组织数据，WebGPU 则把位置更新留在计算管线中。

## 关键变化

```wgsl
@compute @workgroup_size(64)
fn update(@builtin(global_invocation_id) id: vec3<u32>) {
  let index = id.x;
  positions[index] = positions[index] + velocities[index] * delta;
}
```

- 使用存储缓冲区保存位置与速度
- 计算与绘制共享同一份 GPU 数据
- 工作组大小需要根据设备测试
- 降低粒子精度比减少粒子数量更自然

结果不是所有设备都更快。WebGPU 的优势依赖浏览器、驱动和任务类型，因此生产项目仍然需要能力检测与 WebGL 回退。
