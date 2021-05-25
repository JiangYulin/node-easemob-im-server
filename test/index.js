/**
 * 初始化客户端
 * @param {object} params 
 * params
 * @param {String} client_id 应用id
 * @param {String} client_secret 应用密钥
 * @param {String} org_name 租户名
 * @param {String} app_name 应用名
 * @param {String} host 域名
 * @returns 
 */
const params = {
    client_id:"",
    client_secret:"",
    org_name:"",
    app_name:"",
    host:""
};
const client = require('../index').initClient(params);

console.log(client)


/**
 * 注册单个用户(授权)
 * @param {object} params 
 * params
 * @param {String} username 用户ID 
 * @param {String} password 登录密码，默认为000000
 * @param {String} nickname 昵称
 */
let createUser = () => {
    client.createUser({
        username:"penguin",
        nickname:"企鹅"
    })
    .then((data) => {
        console.log(data);
    })
}
// createUser()

/**
 * 设置推送昵称，与创建时无关
 * @param {object} params 
 * params
 * @param {String} username 用户ID 
 * @param {String} nickname 昵称
 */
let setNickName = () => {
    client.setNickName({
        username:"penguin",
        nickname:"22xxs"
    })
    .then((data) => {
        console.log(data);
    })
}

// setNickName()

/**
 * 发送消息
 * @param {object} params 
 * params
 * @param {String} target_type 发送的目标类型；users：给用户发消息，chatgroups：给群发消息，chatrooms：给聊天室发消息 
 * @param {Array} target 发送的目标,使用id数组
 * @param {Object} msg 消息对象
 * 
 * msg 
 * @param {String} type 消息类型；txt:文本消息，img：图片消息，loc：位置消息，audio：语音消息，video：视频消息，file：文件消息
 * 
 * type为txt时msg增加参数
 * @param {String} msg 消息内容
 * 
 * type为img、audio时msg增加参数
 * @param {String} url 成功上传文件返回的UUID
 * 
 */

//发送文字
let sendMsg = () => {
    client.sendMsg({
        target_type:"users",
        target:["penguin"],
        msg:{
            type:"txt",
            msg:"123"
        }
        
    })
    .then((data) => {
        console.log(data);
    })
}
// sendMsg()

//发送图片
let sendMsg2 = () => {
    client.sendMsg({
        target_type:"users",
        target:["penguin"],
        msg:{
            type:"img",
            url:`${__dirname}/2.png`
        }
    })
    .then((data) => {
        console.log(data);
    })
    .catch((err) => {
        console.log(err);
    })
}
// setTimeout(() => {
//     sendMsg2()
// },2000)

//发送语音
let sendMsg3 = () => {
    client.sendMsg({
        target_type:"users",
        target:["penguin"],
        msg:{
            type:"audio",
            url:`${__dirname}/2.mp3`
        }
        
    })
    .then((data) => {
        console.log(data);
    })
}
// setTimeout(() => {
//     sendMsg3()
// },2000)

/**
 * 初始化发送准备，图片、语音需要先进行上传
 * @param {object} params 
 * params
 * @param {String} type 消息类型；txt:文本消息，img：图片消息，loc：位置消息，audio：语音消息，video：视频消息，file：文件消息
 * @param {String} url 文件地址，能被应用访问到的地址
 */
let upload = () => {
    client.initSend({
        type:"img",
        url:`${__dirname}/2.png`
    })
    .then((data) => {
        console.log("data");
        console.log(data);
    })
}

// setTimeout(() => {
//     upload()
// },2000)


