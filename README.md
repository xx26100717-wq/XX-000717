# 高性价比人生指南｜个性化推荐修正版

## 本版修复
- 五个问题都给出明确的填写示例。
- 年龄、月收入、家庭状态、担忧、可投入时间共同参与章节与条目评分。
- 第一层 5 章、第二层跨章 10 条、第三层 6 条行动都有推荐理由。
- 内含 `data/advice.json`，共 665 条源数据，按原数据的 chapter/title/description/cost/benefit/evidence 字段展示。
- PC 和手机自适应，第三层可打印。

## 部署到 GitHub Pages
解压 ZIP，将 `index.html`、`app.js`、`style.css`、`README.md` 和 `data` 文件夹直接上传至仓库 `main` 分支根目录，覆盖旧文件。GitHub Pages 选择 `Deploy from a branch`、`main`、`/(root)`。提交后在 Actions 等待绿色勾号，刷新网站。

## 排序说明
本工具使用可解释的规则加权，并非 AI 或医学诊断。证据等级与收益文字直接沿用源数据。婚姻状态、年龄只是相关性线索，不应被理解为确定性人生判断。原书部分“收益依据”字段较长，未自行删改。
