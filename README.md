# Electronic-Health-Record-with-Fabric

> 基于Fabric的电子健康记录系统简单实现（单机调试）

## 调试环境

Fabric == 1.4.4
Node.JS == 8.9.4
Docker == 
Docker-Compose == 
Angular == 1.0
MariaDB

## 使用方法

```
// 部署
cd /path/to/EHR 
npm install
npm install -g bower

cd public/ng
bower install

// 运行
cd /path/to/EHR 
./sh_netInt.sh
./sh_ccInt.sh

# 如果需要测试请运行以下脚本
./sh_test.sh
# 如果需要停止请运行以下脚本
./sh_netStop.sh

```

## 说明
### MariaDB配置

项目使用MariaDB做用户、病床数据持久化；
数据库配置路径在`EHR/config.json`中；
数据库表可以根据Sequelize内定义的数据项自行生成；
Sequelize配置文件在`EHR/app/database.js`，数据库表定义为`EHR/app/table-*.js`所匹配的所有文件；
另外隔壁日后会提供一个环境包，以确保`Node.JS`与`Angular.JS`部分环境没有问题。

## 写在最后

项目前端基于[智链项目](https://github.com/ChainNova/trainingProjects)二次开发（重新开发啃Vue.JS的话时间不够交作业了……）
因为没有挂载，所以每次重新运行区块链部分数据都会清空；生产环境需要挂载方可正常使用。