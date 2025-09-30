# 常见问题

> 持续更新中...

Q：为什么有时自己用 VS Code 打开文件夹后，很多功能没有了？

A：可能新打开的 VS Code 窗口使用了默认配置文件，而非 Algo Bootstrap 配置文件。请点击左下角的设置齿轮图标，进入「Profile」菜单，手动切换到含有 `AC` 和 `Algo Bootstrap` 字样的配置文件。

---

Q：配置环境时报错怎么办？

A：请使用菜单「调试」->「打开日志目录」找到日志，通过帮助渠道提供此日志文件寻求帮助。

---

Q：Algo Bootstrap 的系统要求是什么？

A：对于 Windows，支持 Windows 10（64 位）及更高版本；如果需要在 Windows 7 上配置，请考虑使用 Algo Bootstrap 的旧版本（`0.x`）。对于 macOS，最低支持 macOS 11 (Big Sur)。

---

Q：是否提供 Linux 版本？

A：由于 Linux 更多是有经验的专业用户使用，其用户群体更擅长手动配置编程环境，我们暂时不会考虑提供 Linux 版本。若要在 Linux 发行版上还原 Algo Bootstrap 的编程体验，可以导入其他平台上的 VS Code 配置文件（`AC`），对用户配置中的编译器路径字段稍作修改，即可使用。

---

Q：Algo Bootstrap 是否适合算竞熟手使用？

A：适合的。即使你已经是 VS Code 专业用户，依然可以使用 Algo Bootstrap 配置。对于已经安装过的编程环境（如 C/C++、Python），会跳过安装；对于 VS Code，它不会污染你已有的配置文件，而是通过注入独立的配置文件提供增强。仅 VS Code 扩展是全局安装的，因此诸如 `Error Lens` 等扩展可能会对你的默认配置造成影响，但你可以手动禁用它们。
