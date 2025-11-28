# CloudNav-abcd（修改版）
**本项目基于在大佬 https://github.com/sese972010/CloudNav- 的项目上，根据我的个性化需求做了一些修改，设置密码后需要输密访问，适合个人使用！**

---

## 修改内容
#### 一、编辑链接增加自动获取图标功能
填写网址后，点击`自动获取图标`按钮
<details>
<summary><strong>👉 点击查看截图</strong></summary>

![100](./doc/100.png)

</details>

#### 二、站点卡片支持拖拽排序
<details>
<summary><strong>👉 点击查看截图</strong></summary>

![101](./doc/101.png)

![102](./doc/102.png)

</details>

#### 三、导入导出增加 JSON 文件
<details>
<summary><strong>👉 点击查看截图</strong></summary>

![103](./doc/103.png)

![104](./doc/104.png)

</details>

#### 四、设置页面增加修改网站名称
<details>
<summary><strong>👉 点击查看截图</strong></summary>

![105](./doc/105.png)

</details>

#### 五、分类站点增加自定义图标功能
<details>
<summary><strong>👉 点击查看截图</strong></summary>

![106](./doc/106.png)

![107](./doc/107.png)

</details>

---

# CloudNav (云航) - 智能私有导航站

<div align="center">

![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8?style=flat-square&logo=tailwindcss)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange?style=flat-square&logo=cloudflare)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

<br/>

<!-- 请将下方的链接替换为您实际部署后的 Cloudflare Pages 域名 -->
[![Live Demo](https://img.shields.io/badge/Live%20Demo-View%20Online-7c3aed?style=for-the-badge&logo=sparkles)](https://cloudnav.yy77.eu.org)

<br/>

**一个现代化、基于 AI 辅助的全栈个人导航站。**
**无需购买服务器，依托 Cloudflare 免费托管，实现多端数据实时同步。**

[在线演示](https://cloudnav.yy77.eu.org) • [功能特性](#-核心功能) • [项目展示](#-项目展示) • [部署教程](#-部署教程-免费) • [使用指南](#-使用指南)

</div>

---

<details>
<summary><strong>👉 点击查看项目功能介绍</strong></summary>

## ✨ 核心功能

### 🧠 AI 深度集成
*   **多模型支持**: 完美支持 **Google Gemini**、**OpenAI**、**DeepSeek**、**Claude** 等任何兼容 OpenAI 接口的模型。
*   **一键智能补全**: 在设置面板一键扫描，自动为成百上千个书签生成精准的中文简介。
*   **智能分类**: 添加链接时，AI 自动分析网页内容并推荐最合适的分类目录。

### ☁️ 数据同步与安全
*   **Cloudflare KV 同步**: 利用边缘存储技术，公司、家里、手机三端数据秒级同步。
*   **WebDAV 双重备份**: 支持坚果云、Nextcloud 等 WebDAV 网盘备份，数据自主掌控。
*   **隐私加密体系**:
    *   **全局锁**: 部署时设置访问密码，防止他人查看。
    *   **目录锁**: 支持对“私有资源”等特定分类单独设置密码，隐藏敏感内容。

### 🎨 极致体验
*   **Chrome 扩展插件**: 提供官方代码生成，支持点击浏览器图标后**手动选择分类**保存，体验媲美原生。
*   **置顶专区**: 常用网站一键置顶，在首页顶部常驻显示。
*   **无缝迁移**: 支持导入 Chrome/Edge 书签 HTML 文件（智能去重）。

---

## 📸 项目展示

> 以下为 CloudNav 的实际运行界面预览。

### 🖥️ 桌面端概览
| 浅色模式 (Light Mode) | 深色模式 (Dark Mode) |
| :---: | :---: |
| ![Light Mode](screenshots/overview-light.svg) | ![Dark Mode](screenshots/overview-dark.svg) |
| *清爽明亮的日间视图* | *护眼沉浸的夜间视图* |

### 🛠️ 核心功能演示
| AI 智能设置 | 分类加密锁 | 移动端适配 |
| :---: | :---: | :---: |
| ![AI Settings](screenshots/overview-light.svg) | ![Security](screenshots/overview-dark.svg) | ![Mobile](screenshots/mobile-view.svg) |
| *一键批量生成描述* | *私密目录密码保护* | *完美适配手机浏览器* |

*(注：上方使用了项目生成的 SVG 矢量预览图，代表实际 UI 布局)*
</details>

---

## 🚀 部署教程 (免费)

本应用完全基于 **Cloudflare Pages** + **KV** 构建，无需服务器，永久免费。

> **📥 [点击下载完整图文教程 (.docx)](图文教程.docx)**

### 📋 简明部署步骤 (适合有经验用户)

1.  **Fork 项目**: 点击右上角 Fork 按钮，将本项目克隆到您的 GitHub 账号。
2.  **创建 Pages 应用**: 登录 Cloudflare Dashboard -> Workers & Pages -> 创建应用程序 -> Pages -> 连接到 Git -> 选择 `CloudNav-abcd`
3.  **配置构建**:
    *   框架预设: **无 (None)**
    *   构建命令: `npm run build`
    *   输出目录: `dist`
4.  **创建数据库**: 在 Workers & Pages -> KV 中创建一个新的命名空间，命名为 `CLOUDNAV_DB`
5.  **绑定变量**:
    *   进入 Pages 项目设置 -> 绑定 (Bindings) -> 添加 KV 命名空间 -> 变量名填 `CLOUDNAV_KV`，值选择刚才创建的 `CLOUDNAV_DB`
    *   进入 环境变量 (Environment variables) -> 添加变量 `PASSWORD`，值为您的访问密码。
6.  **部署**: 重新部署项目即可。

---
<details>
<summary><strong>👉 点击查看部署方法（图文教程）</strong></summary>

### 📖 保姆级图文教程 (适合新手)

> 如果您是第一次使用 Cloudflare，请严格按照以下步骤操作。

#### 第一步：点击创建应用程序
![第一步](./doc/1.png)

#### 第二步：点击右下角 Get started
![第二步](./doc/2.png)

#### 第三步：导入现有你已经 fork 的仓库
![第三步](./doc/3.png)

#### 第四步：这里选你自己 fork 的仓库名称
![第四步](./doc/4.png)

#### 第五步：按图中填写，其他默认
![第五步](./doc/5.png)

#### 第六步：左侧找到 Workers KV 点击右侧新建
![第六步](./doc/6.png)

#### 第七步：空间名称填写 `CLOUDNAV_DB`（建议复制）
![第七步](./doc/7.png)

#### 第八步：绑定 KV 数据库
回到刚才的 pages 设置页面找到绑定-右侧下滑找到 kv 命名空间，变量名称填写 `CLOUDNAV_KV`（建议复制）
![第八步](./doc/8.png)

#### 第九步：设置访问密码
设置中找到变量和机密-填入 `PASSWORD`（建议复制）下面的值填入你自己要设置的密码，这一步是你登录导航页需要的登录密码
![第九步](./doc/9.png)

#### 第十步：添加自定义域名（可选项）
![第十步](./doc/10.png)

</details>

**🎉 所有设置结束后，请务必到部署页面点击“重新部署” (Create New Deployment)，项目即可正常使用！**

---

<details>
<summary><strong>👉 点击查看使用指南</strong></summary>

## ⚙️ 使用指南

### 1. Chrome 扩展程序 (推荐)
点击侧边栏左下角的 **“设置”** -> **“扩展工具”**。
系统会自动根据您的域名生成 3 个文件代码 (`manifest.json`, `popup.html`, `popup.js`)。
1. 在电脑新建文件夹，保存这 3 个文件。
2. 打开 Chrome 扩展管理页 (`chrome://extensions`)。
3. 开启右上角 **“开发者模式”**。
4. 点击 **“加载已解压的扩展程序”**，选择刚才的文件夹。
5. 以后浏览网页时，点击插件图标即可弹出窗口，**选择分类并保存**。

### 2. 配置 AI 服务
点击侧边栏底部的 **“设置”** -> **“AI 设置”**：
*   **提供商**: Google Gemini 或 OpenAI 兼容 (DeepSeek等)。
*   **Key & Model**: 输入 API Key 和模型名称。
*   **一键补全**: 点击底部的 **“一键补全所有描述”**，AI 将自动扫描所有无描述的链接并后台生成。

### 3. WebDAV 备份
点击侧边栏的 **“备份”** 图标，配置 WebDAV 信息 (如坚果云)，即可一键上传备份到云端。

### 4. 本地数据导出 (Local Data Export)
点击侧边栏的 **“备份”** 图标 -> **“导出 HTML”**。
*   生成的 HTML 文件完全兼容 **Chrome**、**Edge**、**Firefox** 等主流浏览器的导入格式。
*   完整保留您在云航中整理的分类目录结构。

**如何导入到浏览器 (以 Chrome 为例):**
1. 打开 Chrome 浏览器，点击右上角菜单 -> **书签与清单** -> **书签管理器**。
2. 点击页面右上角的三个点图标 -> **导入书签**。
3. 选择刚才从云航下载的 HTML 文件即可恢复所有书签。

</details>

---

<div align="center">

**如果您觉得项目不错，希望给本项目点一个免费的 Star ⭐️，感谢您的关注！**

**如果有 Bug 或改进的地方，请在 Issue 中提交您的建议。**

<br/>

Made with ❤️ by CloudNav Team
</div>
