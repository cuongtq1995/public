require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path')
var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname));
app.use(express.static("public"));

const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer');
const Model = require('./model')
const ObjectId = require('mongoose').Types.ObjectId;
const multer = require('multer');


app.get('/', function (req, res) {
    res.send('Hello World');
})
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        const origi = file.originalname.split('.');
        const extent = origi[origi.length - 1]
        cb(null, file.fieldname + '-' + Date.now() + `.${extent}`)
    }
})

var upload = multer({ storage: storage });
app.post('/uploadfile', upload.single('myFile'), (req, res, next) => {
    try {
        const file = req.file
        console.log(file);
        if (!file) {
            const error = new Error('Please upload a file')
            error.httpStatusCode = 400
            return next(error)
        }
        res.send(file)
    } catch (error) {
        console.log(error);
    }
})

app.post('/create', function (req, res) {
    const { username, password, email } = req.body
    const createAcc = Model.AccModel.create({ username, password, email });
    if (!createAcc) return res.json("failed");
    return res.json("success");
})

app.post("/login", function (req, res, next) {
    try {
        const { username, password } = req.body;
        Model.AccModel.findOne({ username, password }).then((data) => {
            if (!data) return res.json('Sai tài khoản hoặc mật khẩu')
            const token = jwt.sign({ _id: data._id }, 'jwtsecret', { algorithm: 'HS256', expiresIn: "1h" });
            res.cookie("token", token, { maxAge: 5 * 60 * 1000 });
            return res.json('Đăng nhập thành công');
        })
    } catch (error) {
        next(error)
    }
})

const verifyToken = function (req, res, next) {
    const token = req.cookies.token;
    if (token) {
        const jwtDecode = jwt.verify(token, 'jwtsecret');
        Model.AccModel.findById(jwtDecode).then(data => {
            if (data) {
                req.user = data._id;
                return next()
            };
            return res.json("token sai");
        });
    } else { res.json('unauthorized') }
}

const createLog = function (senderName, senderEmail, recipient, subject, content, file, status) {
    Model.LogModel.create({ senderName, senderEmail, recipient, subject, content, file, status })
}

const sendMail = function (senderName, senderEmail, recipient, subject, content, file) {
    console.log(recipient);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });


    const mailOptions = {
        from: senderEmail,
        to: recipient,
        subject: subject,
        text: content,
        attachments: [{ path: file }]
    };
    console.log(mailOptions);

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            createLog(senderName, senderEmail, recipient, subject, content, file, error)
        } else {
            createLog(senderName, senderEmail, recipient, subject, content, file, info.response)
        }
    });
}

app.post('/send-mail', verifyToken, upload.single('myFile'), function (req, res, next) {
    //body test
    //form-data
    // {
    //     recipient: abc@gmail.com
    //     subject: TEST
    //     content: hello12
    //     myFile: uploads file
    // }
    let myFile;
    if (req.file) {
        const folderName = './' + req.file.destination + '/' + req.file.filename;
        myFile = folderName;
    }

    const user = new ObjectId(req.user);
    Model.AccModel.findOne({ _id: user }).then(data => {
        sendMail(data.username, data.email, req.body.recipient, req.body.subject, req.body.content, myFile);
        res.json('Đã gửi');
    });


})

const server = app.listen(8081, function () {

    const host = server.address().address
    const port = server.address().port

    console.log("Ung dung Node.js dang lang nghe tai dia chi: http://%s:%s", host, port)

})