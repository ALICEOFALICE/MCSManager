const {
    WebSocketObserver
} = require('../../model/WebSocketModel');
const serverModel = require('../../model/ServerModel');
const response = require('../../helper/Response');
const permssion = require('../../helper/Permission');
const tools = require('../../core/tools');
const fs = require('fs');
const childProcess = require('child_process');
const iconv = require('iconv-lite');


WebSocketObserver().listener('docker/new', (data) => {
    if (!permssion.isMaster(data.WsSession)) return;
    let dockerConfig = JSON.parse(data.body);
    //{dockerImageName: "", 
    //dockerfile: "FROM java:latest↵RUN mkdir -p /mcsd↵RUN echo "Asia…teractive tzdata↵WORKDIR / mcsd↵RUN apt - get update"}
    let dockerImageName = dockerConfig.dockerImageName;
    let dockerfileData = dockerConfig.dockerfile;

    if (dockerImageName.trim() == '') return;

    MCSERVER.warning('正在创建 Docker 镜像.');
    MCSERVER.warning('镜像名字:', dockerImageName);
    dockerfileData = dockerfileData.replace(/\&gt;/igm, ">")
    dockerfileData = dockerfileData.replace(/\&lt;/igm, "<")
    dockerfileData = dockerfileData.replace(/\&nbsp;/igm, " ")
    MCSERVER.warning('DockerFile:\n', dockerfileData);

    response.wsMsgWindow(data.ws, '镜像正在创建中，请稍等....');
    try {
        if (!fs.existsSync("./docker_temp")) fs.mkdirSync("./docker_temp");
        fs.writeFileSync("./docker_temp/dockerfile", dockerfileData);

        let process =
            childProcess.spawn("docker", ['build', '-t', dockerImageName.trim(), './docker_temp/'], {
                cwd: '.',
                stdio: 'pipe'
            });
        process.on('exit', (code) => {
            console.log("EXIT", code)
            if (code == 0) {
                response.wsMsgWindow(data.ws, ['镜像', dockerImageName, '创建完毕.'].join(" "));
            }
        });
        process.on('error', (err) =>
            MCSERVER.error('Docker 创建出错', err)
        );
        process.stdout.on('data', (data) => console.log(iconv.decode(data, 'utf-8')));
        process.stderr.on('data', (data) => console.log(iconv.decode(data, 'utf-8')));

    } catch (err) {
        MCSERVER.warning('创建出错：', err);
    }
});