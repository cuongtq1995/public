const mongoose = require('./connectDB');

const Schema = mongoose.Schema;
const AccSchema = new Schema({
    username: String,
    password: String,
    email: String,
}, { collection: "Account" })

const LogEmailSchema = new Schema({
    senderName: String,
    senderEmail: String,
    recipient: String,
    subject: String,
    content: String,
    file: String,
    status: String
}, { collection: "Log" })


const AccModel = mongoose.model("Account", AccSchema)
const LogModel = mongoose.model("Log", LogEmailSchema)



module.exports = { AccModel, LogModel }