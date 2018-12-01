package main

import (
	"flag"
	"os"
	"github.com/sirupsen/logrus"
	"net/http"
	"golang.org/x/net/websocket"
	"encoding/json"
	"time"
	"strings"
)

var params Params
var log = logrus.New()
var user = make(map[*websocket.Conn]string)

func init() {
	params = Params{
		WebSocketPort: ":9501",
		logUrl: "/tmp/or_log",
		htmlUrl: "",
	}

	log.Out = os.Stdout
	log.SetLevel(logrus.DebugLevel)
}

func main() {
	logUrl := flag.String("log","/tmp/or_log","Log Url")
	flag.Parse()

	params.logUrl = *logUrl

	if params.logUrl != "debug" {
		f,err := os.OpenFile(params.logUrl, os.O_CREATE|os.O_WRONLY, 0644)
		if err == nil {
			log.Out = f
			defer f.Close()
		}
	}

	go func(){
		mux := http.NewServeMux()
		mux.Handle("/ws", websocket.Handler(webSocket))
		http.ListenAndServe(params.WebSocketPort,mux)
	}()

	go func(){
		mux := http.NewServeMux()
		mux.HandleFunc("/", display)
		http.ListenAndServe(params.htmlPort, mux)
	}()

	log.Infof("Server start at %s", time.Now().String())

	select{}
}

func webSocket(ws *websocket.Conn) {
	var data string
	var userMsg PostData

	for {
		if err := websocket.Message.Receive(ws, &data);err != nil {
			log.Infof("%s 接收出错 : %s",time.Now().String(),user[ws])
			delete(user, ws)
			break
		}

		data = strings.Replace(data, "\n", "", 0)
		data = data[1:len(data)-1]
		//log.Infof("%s",data)
		if err := json.Unmarshal([]byte(data), &userMsg);err != nil {
			log.Warningf("json unmarshal failed on Server.go 73 : %v",err) // rows 73
			go sendMsg(userMsg.Nick, "err", "", ws)
			continue
		}

		switch userMsg.Type {
		case "send":
			// send Message
			go sendMsg(userMsg.Nick, "send", userMsg.Message, ws)
		case "login":
			user[ws] = userMsg.Nick
			// send online
			go sendMsg(userMsg.Nick, "login", "", ws)
		case "logout":
			// send offline
			go sendMsg(userMsg.Nick, "logout", "", ws)
			delete(user, ws)
		}
	}
}

func display(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, params.htmlUrl)
}

func sendMsg(Nick, Type, Msg string, ws *websocket.Conn) {
	tmpData := PostData{
		Nick: Nick,
		Type: Type,
		Message: Msg,
		Time: time.Now().String(),
	}

	msg,_ := json.Marshal(tmpData)

	if Type == "err" {
		err := websocket.Message.Send(ws, string(msg))
		if err != nil {
			go sendMsg(Nick,"logout", "", ws)
			delete(user,ws)
		}
	}else{
		for k,_ := range user {
			err := websocket.Message.Send(k, string(msg))
			if err != nil {
				if Type == "send" {
					go sendMsg(Nick,"err", "", ws)
				}
				delete(user,k)
			}
		}
	}
}

/*
command-Line params struct
 */
type Params struct {
	WebSocketPort	string
	logUrl			string
	htmlUrl			string
	htmlPort		string
}

/*
json data struct
 */
type PostData struct {
	Nick	string	`json:"nick"`
	Type	string	`json:"type"`
	Message	string	`json:"message"`
	Time	string	`json:"time"`
}