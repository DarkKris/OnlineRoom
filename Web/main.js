window.onload = function(){
    if(localStorage.getItem("nickname")==null)
    {
        window.location="./index.html";
    }

    wsfunc();
    listenFunc();
};

function wsfunc(){
    let app2 = new Vue({
        el: '#app2',
        data: {
            msgList: [
                {
                    text: '欢迎来到OnlineRoom',
                    cls: 'notice',
                },
            ]
        }
    });

    ws = new WebSocket("ws://127.0.0.1:9501/ws");

    ws.onopen = function() {
        let json = [];
        let rows = {};

        rows.nick = localStorage.getItem("nickname"); //NickName
        rows.type = "login";
        rows.message = "";
        rows.time = new Date().getTime().toString();

        json.push(rows);

        let jsonStr = JSON.stringify(json);

        ws.send(jsonStr)
    };

    ws.onmessage = function(evt) {
        let jsonObj = JSON.parse(evt.data);

        let nick = jsonObj.nick;
        let type = jsonObj.type;
        let msg  = jsonObj.message;
        let Time = jsonObj.time;

        // console.log(nick,type,msg,Time);

        switch(type){
            case "login":
                app2.msgList.push({
                    text: "\""+nick+"\"已进入房间",
                    cls: "notice",
                });
                break;
            case "send":
                // TODO 完善逻辑
                app2.msgList.push({
                    text:msg,
                    cls:"user-msg",
                    alias: localStorage.getItem(""),
                    color: localStorage.getItem(""),
                    nick: nick,
                });
                break;
            case "logout":
                app2.msgList.push({
                    text: "\""+nick+"\"已退出房间",
                    cls: "notice",
                });
                break;
            case "err":
                app2.msgList.push({
                    text: "发生错误",
                    cls: "notice",
                });
                break;
        }
        let oWords = document.getElementById('app2');
        oWords.scrollTop = oWords.scrollHeight;
    };

    ws.onclose = function() {
        app2.msgList.push({
            text: "服务器已关闭",
            cls: "notice"
        });
        let oWords = document.getElementById('app2');
        oWords.scrollTop = oWords.scrollHeight;
        // 显示服务器已关闭
    };

    // ws.onerror = function(err) { // 暂时取消onError
    //     // 显示错误
    //     if(err.data == null)
    //     {
    //         app2.msgList.push({text:"服务器未启动",cls:"notice"});
    //     }else{
    //         app2.msgList.push({text:"error:"+err.data,cls:"notice"});
    //     }
    // };
}

function listenFunc() {
    let app3 = new Vue({
        el: '#app3',
        data: {
            umsg: ""
        },
        methods: {
            sendMsg: function(){
                // 检测消息为空
                if(this.umsg === "")
                    return;

                let json = [];
                let rows = {};

                rows.nick = localStorage.getItem("nickname"); //NickName
                rows.type = "send";
                rows.message = this.umsg;
                rows.time = new Date().getTime().toString();

                json.push(rows);

                let jsonStr = JSON.stringify(json);

                ws.send(jsonStr);
                this.umsg = '';
            },
            refresh: function(){

            }
        }
    });

    // TODO 监听send按钮发送消息

    // TODO 监听logout按钮发送离线消息
}