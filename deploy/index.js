// deploy/index.js
const scpClient = require('scp2')
const chalk = require('chalk')
var Client = require('ssh2').Client
const ora = require('ora')
const path = require('path')
const server = require('./deploy.config.js')

const source_path = path.resolve() + '/dist'
const spinner = ora('正在发布到测试服务器...')

spinner.start()

const conn = new Client()

conn.on('ready', function () {
  conn.exec('rm -rf /www/wwwroot/***（项目放置静态地址）', function (err, stream) {
    if (err) throw err

    stream.on('close', function () {
      // 在执行shell命令后，把开始上传部署项目代码放到这里面
      scpClient.scp(source_path, {
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password,
        path: server.path, // 项目放置静态地址（服务器中地址）
      }, function (err) {
        spinner.stop()

        if (err) {
          console.log(chalk.red('发布失败.\n'))
        } else {
          console.log(chalk.green('Success! 成功发布到服务器! \n'))
        }
      })
      conn.end()
    }).on('data', function (data) {
      console.log('STDOUT: ' + data)
    }).stderr.on('data', function (data) {
      console.log('STDERR: ' + data)
    })
  })
}).connect({
  host: server.host,
  port: server.port,
  username: server.username,
  password: server.password,
})

