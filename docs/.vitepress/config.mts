import { defineConfig } from 'vitepress';
import lightbox from 'vitepress-plugin-lightbox';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Algo Bootstrap 使用文档',
  description: '一个现代的编程环境配置器',
  lang: 'zh-CN',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '返回主页', link: 'https://ab.algoux.cn/' },
      { text: 'algoUX Products', link: 'https://algoux.org/' },
    ],

    sidebar: [
      {
        text: '使用指南',
        items: [
          { text: '概述', link: '/usages/summary' },
          { text: '使用代码存放文件夹', link: '/usages/project' },
          {
            text: '使用 VS Code 编程',
            items: [
              { text: '基本使用', link: '/usages/vscode/basic' },
              { text: '代码片段', link: '/usages/vscode/snippets' },
              { text: '辅助功能', link: '/usages/vscode/accessibility' },
              { text: '调试', link: '/usages/vscode/debug' },
            ],
          },
          {
            text: '进阶使用',
            items: [
              { text: '设置代码初始化模板', link: '/usages/advanced/template' },
              { text: 'CLI 命令', link: '/usages/advanced/cli' },
            ],
          },
        ],
      },
      {
        text: '常见问题',
        link: '/faq',
      },
      {
        text: '关于 Algo Bootstrap',
        link: '/about',
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/algoux/algo-bootstrap' }],

    footer: {
      message: 'Born for Programming Beginners.',
      copyright: 'Copyright © 2019-present algoUX',
    },

    externalLinkIcon: true,

    darkModeSwitchLabel: '切换主题',
    lightModeSwitchTitle: '切换到明亮主题',
    darkModeSwitchTitle: '切换到暗黑主题',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    outlineTitle: '目录',
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
  },
  markdown: {
    config: (md) => {
      // Use lightbox plugin
      md.use(lightbox, {});
    },
  },
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
});
