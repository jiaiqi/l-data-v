// deploy/index.js
const scpClient = require("scp2");
const chalk = require("chalk");
var Client = require("ssh2").Client;
const ora = require("ora");
const path = require("path");
const serverList = require("./deploy.config.js");

const source_path = path.resolve() + "/dist";

const deployFun = (server) => {
  const spinner = ora(
    `正在发布到${server.title || "测试"}服务器(${server.host})...\r\n`
  );
  spinner.start();
  const conn = new Client();
  return new Promise((resolve) => {
    conn
      .on("ready", function () {
        conn.exec(`rm -rf ${server.path}`, function (err, stream) {
          if (err) throw err;
          stream
            .on("close", function () {
              // 在执行shell命令后，把开始上传部署项目代码放到这里面
              scpClient.scp(
                source_path,
                {
                  host: server.host,
                  port: server.port,
                  username: server.username,
                  password: server.password,
                  path: server.path, // 项目放置静态地址（服务器中地址）
                },
                function (err) {
                  spinner.stop();

                  if (err) {
                    console.log(
                      chalk.red(
                        `${server.title || "测试"}(${server.host}).\r\n`
                      )
                    );
                    resolve(err)
                  } else {
                    console.log(
                      chalk.green(
                        `Success! 成功发布到${server.title || "测试"}服务器!(${
                          server.host
                        }) \r\n`
                      )
                    );
                    resolve(true)
                  }
                }
              );
              conn.end();
            })
            .on("data", function (data) {
              console.log("STDOUT: " + data);
            })
            .stderr.on("data", function (data) {
              console.log("STDERR: " + data);
            });
        });
      })
      .connect({
        host: server.host,
        port: server.port,
        username: server.username,
        password: server.password,
      });
  });
};

if (serverList?.length) {
  serverList.forEach((server) => {
    deployFun(server);
  });
}
