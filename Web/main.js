windows.onload = function(){
    ws();
};

function ws(){
    ws = new WebSocket("ws://127.0.0.1:9501/ws");

    ws.onopen = function() {
        let json = [];
        let rows = {};

        rows.nick = NickName; //NickName
        rows.time = new Date().getTime();
        rows.type = "login";
        rows.Message = "";

        json.push(rows);

        let jsonStr = JSON.stringify(json);

        ws.send(jsonStr)
    };

    ws.onmessage = function(evt) {
        let nick = evt.data.Nick;
        let type = evt.data.Type;
        let msg  = evt.data.Message;
        let Time = evt.data.Time;

        
    };

    ws.onclose = function() {
        // TODO 显示服务器已关闭
    }

    // TODO 监听send按钮发送消息

    // TODO 监听logout按钮发送离线消息
}