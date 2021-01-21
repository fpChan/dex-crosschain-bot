## 项目背景

压测脚本

## 项目流程

1. 构造批量账户
2. 转账CKB给给这些账户（多备一些 capacity）
3. RichETH 账户批量 lock (recipient 是刚刚生成的CKB账户)
4. 等待 relay proof mint完成
5. 执行批量 burn 操作
 
## quick start

- 修改并发数量 : `index.js`
  
  `const concurrency_number = 2`
- yarn : 下载依赖
- yarn send 执行操作

