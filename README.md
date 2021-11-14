# chat-room
My chat room.

# 版本说明：
基于 WebSocket 客户端和服务端的极简 Demo，按金渡课程指导，用 Node、WebSocket(ws) 写了一个简易聊天室的后台，功能有：
  · 在线、离线、改名通知
  · 修改昵称
  · 消息群发
  · 心跳检测

# 版本号：1.0.0



#### 🤝 提交规范
* perf: 优化相关，比如提升性能、体验
* feat: 新功能(feature)
* fix: 修补bug
* docs: 文档(documentation)
* style: 格式(不影响代码运行的变动)
* refactor: 重构(即不是新增功能，也不是修改bug的代码变动)
* test: 增加测试
* chore: 构建过程或辅助工具的变动
* upgrade: 第三方库升级
* revert: 回滚
* scope: commit 影响的范围, 比如: route, component, utils, build...
* merge: Merge branch ? of ?.

##### 🛎🛎🛎 提交注意事项: 提交信息填写的内容需要包括模块名+改动的描述。(各个团队自己建立一个分支,开发自己的功能模块,等到模块开发完成后统一合到dev分支, dev分支经过测试后再合到master分支)
- ```  git add + 对应文件名  ```
- ``` git cz  ``` 选择本次改动的类型
- 按照提示填写完相关信息
- ``` npm run changelog ``` 生成更新日志
- ``` npm run beforeStage ``` 日志写入CHANGELOG.md中(可能需要手动删除别人重复的更新日志)
  
  提交更新日志的时候,无需使用``` git cz ```, commit的时候直接说明提交更新日志即可,例如``` git commit -m "docs: 提交更新日志"  ```


#### ❤️ 分支管理
- 模块功能开发(feature/xxx)
- Bug修改(bug/xxx)