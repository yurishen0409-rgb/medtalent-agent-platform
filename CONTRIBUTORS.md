# 贡献者与代码来源

## 原始底座

- 仓库：KexianC/medtalent-agent-platform
- 基线提交：`708a09e`（2026-10-27），作者 KexianC
- 签名标签：`base/upstream-708a09e`

## 2026-10 起的修改、部署与迭代

- 沈钰（GitHub：yurishen0409-rgb）
- 范围：熊大经、陈志凌、唐劲松三位医生的智能体页面和服务端接口，平台安全底线（急症、自伤求助提示），智能体模板，测试和部署脚本。
- 方式：在原始底座上，借助 AI 编程工具完成修改、本机部署和线上迭代。
- 每次上线都打了签名标签 `deploy/xiong-<镜像号>`，对应线上镜像 `medtalent-developer01:<镜像号>`。

## 修改量（截至 `d047604`，2026-11-12，不含 package-lock.json）

| 分支 | 基线后提交数 | 改动 |
|---|---|---|
| release/xiong-chen | 52 | 86 个文件，+8280 / −239 行 |
| feat/chen-zhiling | 16 | 57 个文件，+4431 / −183 行 |
| feat/tang-jinsong | 11 | 45 个文件，+3836 / −151 行 |
| feat/agent-template | 3 | 17 个文件，+2259 / −65 行 |

原始底座共 1483 个文件、65824 行（不含 package-lock.json）。

## 第三方资源

字体、图片等的来源和许可证见各目录下的 `SOURCES.md`、`OFL-LICENSE.txt`，不在此重复。
