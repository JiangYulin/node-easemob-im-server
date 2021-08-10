const _ = require('lodash');
const fs = require('fs');
const request = require('request');
const sizeOf = require('image-size');
const getMP3Duration = require('get-mp3-duration')

let client_id;
let client_secret;
let org_name;
let app_name;
let host;
let url_options;
let tokenObj;

/**
 * 初始化请求url
 */
const initUrl = () => {
    url_options = {
        getToken:`http://${host}/${org_name}/${app_name}/token`,
        createUser:`http://${host}/${org_name}/${app_name}/users`,
        setNickName:`http://${host}/${org_name}/${app_name}/users`,
        sendMsg:`http://${host}/${org_name}/${app_name}/messages`,
        upload:`http://${host}/${org_name}/${app_name}/chatfiles`
    }
}

/**
 * 获取、更新token
 */
const getToken = () => {
  //判断token是否过期，如果过期则获取新的token
  if(!tokenObj || tokenObj.expires_in < new Date()){
    var options = {
      url:url_options.getToken,
      method:"POST",
      headers:{
        "accept": "application/json",
        "content-type":"application/json"
      },
      body:JSON.stringify({
        grant_type:"client_credentials",
        client_id:client_id,
        client_secret:client_secret
      })
    };
    return new Promise(function(resolve,reject){
      request(options,function(error, response, body){
        if(error){
          console.log("getToken error",error);
          return reject(error);
        }
        body = JSON.parse(body)
        tokenObj = {
          access_token:body.access_token,
          expires_in:new Date(new Date().getTime() + (body.expires_in - 60)*1000)//过期时间提早1分钟
        }
        resolve();
      });
    });
  }else{
    return new Promise(function(resolve,reject){
      resolve();
    });
  }
} 

/**
 * 注册单个用户(授权)
 * @param {object} params 
 * params
 * @param {String} username 用户ID 
 * @param {String} password 登录密码，默认为000000
 * @param {String} nickname 昵称
 */
const createUser = (params) => {
  //检查token
  return getToken()
  .then(() => {
    var options = {
      url:url_options.createUser,
      method:"POST",
      headers:{
        "accept": "application/json",
        "content-type":"application/json",
        "Authorization":`Bearer ${tokenObj.access_token}`
      },
      body:JSON.stringify({
        username:params.username,
        password:params.password || "000000",
        nickname:params.nickname
      })
    };
    return new Promise(function(resolve,reject){
      request(options,function(error, response, body){
        if(error){
          console.log("createUser error",error);
          return reject(error);
        }
        resolve(JSON.parse(body));
      });
    });
  })
  
}

/**
 * 设置推送昵称，与创建时无关
 * @param {object} params 
 * params
 * @param {String} username 用户ID 
 * @param {String} nickname 昵称
 */
const setNickName = (params) => {
  //检查token
  return getToken()
  .then(() => {
    var options = {
      url:url_options.setNickName + "/" + params.username,
      method:"POST",
      headers:{
        "accept": "application/json",
        "content-type":"application/json",
        "Authorization":`Bearer ${tokenObj.access_token}`
      },
      body:JSON.stringify({
        nickname:params.nickname
      })
    };
    return new Promise(function(resolve,reject){
      request(options,function(error, response, body){
        if(error){
          console.log("setNickName error",error);
          return reject(error);
        }
        resolve(JSON.parse(body));
      });
    });
  })
}

/**
 * 发送消息
 * @param {object} params 
 * params
 * @param {String} target_type 发送的目标类型；users：给用户发消息，chatgroups：给群发消息，chatrooms：给聊天室发消息 
 * @param {Array} target 发送的目标,使用id数组
 * @param {String} from 发送者
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
const sendMsg = (params) => {
  //检查token
  return getToken()
  .then(() => {
    var body = _.pick(params,"target_type","target","from","msg");
    return initSend(body.msg)
    .then((data) => {
      //如果存在上传图片，则组装请求参数
      if(data){
        switch(body.msg.type){
          case "img":
            /** 
             * @param {String} url 域名/orgname/appname/chatfiles/成功上传文件返回的UUID
             * @param {String} filename 图片名称
             * @param {String} secret 成功上传文件后返回的secret
             * @param {Object} size 图片尺寸；height：高度，width：宽度
             */
            body.msg = _.assign(body.msg,{
              url:`http://${host}/${org_name}/${app_name}/chatfiles/${data.uuid}`,
              filename:data.uuid,
              secret:data.secret,
              size:data.size
            })
            break;
          case "audio":
            /** 
             * @param {String} url 成功上传文件返回的UUID
             * @param {String} filename 语音名称
             * @param {String} secret 成功上传文件后返回的secret
             * @param {Object} length 语音时间（单位：秒）
             */
            body.msg = _.assign(body.msg,{
              url:`http://${host}/${org_name}/${app_name}/chatfiles/${data.uuid}`,
              filename:data.uuid,
              secret:data.secret,
              length:data.length
            })
            break;
        }
      }

      return body;
    })
  })
  .then((body) => {
    var options = {
      url:url_options.sendMsg,
      method:"POST",
      headers:{
        "accept": "application/json",
        "content-type":"application/json",
        "Authorization":`Bearer ${tokenObj.access_token}`
      },
      body:JSON.stringify(body)
    };
    return new Promise(function(resolve,reject){
      request(options,function(error, response, body){
        if(error){
          console.log("sendMsg error",error);
          return reject(error);
        }
        resolve(JSON.parse(body));
      });
    });
  })
}

/**
 * 初始化发送准备，图片、语音需要先进行上传
 * @param {object} params 
 * params
 * @param {String} type 消息类型；txt:文本消息，img：图片消息，loc：位置消息，audio：语音消息，video：视频消息，file：文件消息
 * @param {String} url 文件地址，能被应用访问到的地址
 */
const initSend = (params) => {
  //图片、语音文件执行上传
  if(params.type == "img" || params.type == "audio"){
    // console.log("fs.existsSync(params.url)",fs.existsSync(params.url))
    var options = {
      url:url_options.upload,
      method:"POST",
      headers:{
        "restrict-access": "true",
        "Authorization":`Bearer ${tokenObj.access_token}`
      },
      formData:{
        file:fs.createReadStream(params.url),
      }
    };
    return new Promise(function(resolve,reject){
      request(options,function(error, response, body){
        if(error){
          console.log("sendMsg error",error);
          return reject(error);
        }
        body = JSON.parse(body);
        //如果是图片，读取图片宽高
        var imageSize;
        if(params.type == "img"){
          imageSize = sizeOf(params.url);
          resolve({
            uuid:body.entities[0].uuid,
            secret:body.entities[0]["share-secret"],
            size:{
              width:imageSize.width,
              height:imageSize.height
            }
          });
        }else if(params.type == "audio"){
          const buffer = fs.readFileSync(params.url)
          const duration = getMP3Duration(buffer)
          //如果是音频，获取音频时长,先按最长60s
          resolve({
            uuid:body.entities[0].uuid,
            secret:body.entities[0]["share-secret"],
            length:Math.ceil(duration/1000)
          });
        }else{
          resolve({
            uuid:body.entities[0].uuid,
            secret:body.entities[0]["share-secret"]
          });
        }
      });
    });
  }else{
    return new Promise((resolve,reject) => {
      resolve();
    })
  }
}

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
exports.initClient = (params) => {
  if(!params){
		console.log("can't found params. 缺少初始化参数");
		return ;
  }
  if(!params.client_id){
		console.log("can't found client_id. 应用id client_id");
		return ;
  }
  if(!params.client_secret){
		console.log("can't found client_secret. 应用密钥 client_secret");
		return ;
  }
  if(!params.org_name){
		console.log("can't found org_name. 租户名 org_name");
		return ;
  }
  if(!params.app_name){
		console.log("can't found app_name. 应用名 app_name");
		return ;
  }
  if(!params.host){
		console.log("can't found host. 域名 host");
		return ;
  }
  client_id = params.client_id;
  client_secret = params.client_secret;
  org_name = params.org_name;
  app_name = params.app_name;
  host = params.host;

  initUrl();
  getToken();

  //返回方法
  return {
    createUser:createUser,
    setNickName:setNickName,
    sendMsg:sendMsg,
    initSend:initSend
  };
}