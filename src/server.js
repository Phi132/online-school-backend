const express = require('express');
const bodyParser = require('body-parser');
const route = require('./routes');
const viewEngine = require('./config/viewEngine');
const connectDB = require('./config/connectDB');
const cors = require('cors');
const app = express();


const http = require('http');
const server = http.createServer(app);

require('dotenv').config();

let port = process.env.PORT || 1234;




app.use(cors({
    origin: "*"

}));
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));


app.get('/', (req, res) => {
    res.send('Hello!')
})

route(app);

connectDB();


const io = require("socket.io")(server, {
    cors: {
        origin: '*'
    }
});
let listOnlineUser = [];
let listOnlineConsultant = [];

const removeUser = (id) => {
    listOnlineUser = listOnlineUser.filter((e) => e.socketId !== id);
}
const removeConsultant = (id) => {
    listOnlineConsultant = listOnlineConsultant.filter((e) => e.socketId !== id);
}
io.on('connection', (socket) => {

    console.log("co nguoi vao voi id la -----------------------", socket.id);
    socket.on('NGUOI_DUNG_VAO_CALL', dataUser => {
        socket.emit('MY_SOCKET_ID', socket.id);
        const isExist = listOnlineUser.some(e => e.info.id === dataUser.id);
        if (isExist) {
            return socket.emit("DA_CO_NGUOI_DUNG_NAY")
        }

        let obj = {};
        obj.info = dataUser;
        obj.socketId = socket.id;
        listOnlineUser.push(obj);
        io.emit("DANH_SACH_ONLINE", listOnlineUser);
        console.log(listOnlineUser);
        if (dataUser.roleid === 'R4') {
            const isExistConsultant = listOnlineConsultant.some(e => e.idConsultant === dataUser.id);
            if (isExistConsultant) {
                return socket.emit("DA_CO_TU_VAN_NAY")
            }
            let objConsultant = {};
            objConsultant.idConsultant = dataUser.id;
            objConsultant.socketId = socket.id;
            listOnlineConsultant.push(objConsultant);

        }
        io.emit('TU_VAN_VIEN_ONLINE', listOnlineConsultant);
    });

    socket.on('disconnect', () => {
        console.log("ai do da disconnect################################", socket.id);
        removeUser(socket.id);
        removeConsultant(socket.id);
        io.emit("DANH_SACH_ONLINE", listOnlineUser);
        io.emit('TU_VAN_VIEN_ONLINE', listOnlineConsultant);
    });

    // người gọi
    socket.on("calluser", ({ userToCall, signalData, from, name }) => {
        io.to(userToCall).emit("callUser", { signal: signalData, from, name });

        // calling signal
        io.to(userToCall).emit("CALLING", { isCalling: true });

        //camera call
        socket.on("clickCamera", Camera => {
            io.emit("IS_OPEN_CAMERA_CALL", { isOpenCameraCall: Camera.isOpenCameraCall, id: from });
        });
        // micro call
        socket.on("clickMicro", Micro => {
            io.emit("IS_OPEN_MICRO_CALL", { isOpenMicroCall: Micro.isOpenMicroCall, id: from });
        });

        // chat
        socket.on("messContent", (data) => {
            console.log(data);
            socket.to(data.idYourFriend).emit("RECEIVE_MESS", data);
        })

    });

    // người bắt máy
    socket.on("answercall", (data) => {
        io.to(data.to).emit("callaccepted", data.signal);
        io.to(data.to).emit("CALL_NAME_FROM", { name: data.callFrom, id: data.myId });

        // calling signal
        io.emit("CALLING", { isCalling: false });
        //camera answer
        socket.on("clickCamera", Camera => {
            io.emit("IS_OPEN_CAMERA_ANSWER", { isOpenCameraAnswer: Camera.isOpenCameraAnswer, id: data.myId });
        });
        //micro answer
        socket.on("clickMicro", Micro => {
            io.emit("IS_OPEN_MICRO_ANSWER", { isOpenMicroAnswer: Micro.isOpenMicroAnswer, id: data.myId });
        });

        // chat
        socket.on("messContent", (data) => {
            console.log(data);
            socket.to(data.idYourFriend).emit("RECEIVE_MESS", data);
        })

    });


})



server.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})