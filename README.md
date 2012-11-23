node-app
========

nodejs web项目的目录结构

## 代码目录结构

* /
 * dispatch.js 主进程文件
 * worker.js 工作进程
 * app.js 应用
 * routes.js url路由表
 * package.json 依赖模块
 * config.js or config/ 配置文件
 * controllers/ 业务逻辑相关
 * views/ 试图模板
 * common/ 跟业务相关的公共模块
 * proxy/ 数据访问代理层
 * lib/ 跟业务无关的公共模块
 * assets/ images|scripts|styles
 * test/ 测试
 * bin/ 相关运行脚本
 * node_moudules