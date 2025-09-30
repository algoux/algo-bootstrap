<script setup>
import { VPTeamMembers } from 'vitepress/theme'

const members = [
  {
    avatar: '/gh-avatar-bLue.jpeg',
    name: 'bLue',
    title: 'Core Author',
    links: [
      { icon: 'github', link: 'https://github.com/dreamerblue' },
    ]
  },
  {
    avatar: '/gh-avatar-atrior.jpeg',
    name: 'atrior',
    title: 'Website Developer',
    links: [
      { icon: 'github', link: 'https://github.com/ATRIOR-LCL' },
    ]
  }
]
</script>

# 关于 Algo Bootstrap

Algo Bootstrap 诞生于 2019 年，是 algoUX 组织开源的跨平台桌面端应用。其初衷是帮助新手解决编程环境的配置问题，推广最现代的编程环境，替代老旧的 Dev C++、Code::Blocks 等 IDE。

## 开发团队

<VPTeamMembers size="small" :members />

## algoUX 产品

algoUX 是一个专注于编程学习与算竞工具链的开源组织。

Algo Bootstrap 是 algoUX 产品家族中的一员，其他产品包括：

- [RankLand](https://rl.algoux.cn/?utm_source=ab-docs)：算法竞赛榜单合集站
- [Paste then AC](https://paste.then.ac/?utm_source=ab-docs)：简洁易用的云端代码剪贴板
