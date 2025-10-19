# 常见问题

> 持续更新中...

## 安装配置类问题

Q：Algo Bootstrap 的系统要求是什么？

A：各系统要求：

- Windows：Windows 10（64 位）或更高版本。如果需要在 Windows 7 上配置，请考虑使用 [旧版本 Algo Bootstrap](https://ab.algoux.org/old/?utm_source=ab-docs)
- macOS：macOS 11 (Big Sur) 或更高版本

---

Q：macOS 上打开提示「未打开 “Algo Bootstrap”」怎么办？

A：请打开「系统设置」->「隐私与安全性」，找到「安全性」部分中的「已阻止 “Algo Bootstrap” 以保护 Mac。」区块，点击「仍要打开」，确认并输入开机密码即可。如果你找不到这个区块，请尝试下一个问题的解决步骤。

---

Q：macOS 上打开提示「已损坏，无法打开。你应该将它移到废纸篓。」怎么办？

A：你需要打开「任意来源」以安装。步骤如下：

1. 在启动台 或 App 搜索「Terminal」，打开终端；
2. 在终端中输入以下命令并按 `Enter`（你可以复制命令并粘贴）：

```bash
sudo spctl --master-disable
```

3. 输入当前用户的开机密码并按 `Enter`（输入过程不会回显字符）；
4. 打开「系统设置」->「隐私与安全性」，找到「安全性」部分，将「允许以下来源的应用程序」选项调整为「任何来源」；
5. 重新打开 Algo Bootstrap。

---

Q：是否提供 Linux 版本？

A：由于 Linux 更多是有经验的专业用户使用，其用户群体更擅长手动配置编程环境，我们暂时不会考虑提供 Linux 版本。若要在 Linux 发行版上还原 Algo Bootstrap 的编程体验，可以导入其他平台上的 VS Code 配置文件（`AC`），对用户配置中的编译器路径字段稍作修改，即可使用。

---

Q：配置环境时报错怎么办？

A：请使用菜单「调试」->「打开日志目录」找到日志，通过帮助渠道提供此日志文件寻求帮助。

## 功能使用类问题

Q：为什么有时自己用 VS Code 打开文件夹后，很多功能没有了？

A：可能新打开的 VS Code 窗口使用了默认配置文件，而非 Algo Bootstrap 配置文件。请点击左下角的设置齿轮图标，进入「Profile」菜单，手动切换到含有 `AC` 和 `Algo Bootstrap` 字样的配置文件。

---

Q：Algo Bootstrap 是否适合算竞熟手使用？

A：适合的。即使你已经是 VS Code 专业用户，依然可以使用 Algo Bootstrap 配置。对于已经安装过的编程环境（如 C/C++、Python），会跳过安装；对于 VS Code，它不会污染你已有的配置文件，而是通过注入独立的配置文件提供增强。仅 VS Code 扩展是全局安装的，因此诸如 `Error Lens` 等扩展可能会对你的默认配置造成影响，但你可以手动禁用它们。

---

Q：Windows 下，运行程序输出中文乱码怎么办？

A：请跟随以下步骤：

1. 如果没有创建过 PowerShell 配置，则打开一个 PowerShell 窗口，执行此命令新建配置：
   ```powershell
   New-Item $PROFILE -ItemType File -Force
   ```

2. 编辑配置（默认位置为 `文档` 目录下的 `WindowsPowerShell\Microsoft.PowerShell_profile.ps1`），追加以下内容并保存：
   ```powershell
   $OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding
   ```
3. 关闭先前 VS Code 中已打开的 PowerShell 终端（如有），重新运行程序。
