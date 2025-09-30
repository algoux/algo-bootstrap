# 使用 abc 命令行工具

Algo Bootstrap 提供了 `abc` 命令行工具，方便用户在终端中快速初始化代码存放文件夹。

这对于经常进行比赛/题目集训练并需要按目录分类整理代码，或依赖诸如「Competitive Programming Helper」扩展抓取题目的用户来说，可以显著提升效率。

## 添加命令

打开 Algo Bootstrap，在功能盘中点击「添加快捷命令」按钮，这将添加 `abc` 命令到你的用户 PATH 中。

![添加命令行工具](./assets/cli-添加.png)

重启终端会话（对于 VS Code 内置终端，需要重启 VS Code 才可生效），即可在终端中使用 `abc` 命令。

## 使用方式

在终端中执行：`abc <要初始化或打开的路径...>`。可以使用空格分隔多个路径。

示例：

```bash
# 打开当前目录下的 new-dir 文件夹，如果不存在则自动创建
abc new-dir

# 使用绝对路径
abc /Users/Mutsumi/memory/CRYCHIC
abc C:\\Users\\Mortis\\None


# 场景：当前在 `cf/1000` 目录，为下一场比赛快速初始化新目录：
abc ../1001

# 打开文件，可以是不存在的文件名
abc duipai.cpp
```
