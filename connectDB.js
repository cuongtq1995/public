const mongoose = require('mongoose');
const url = `${process.env.MONGO_URL}`
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection
db.on('error', console.log.bind(console, 'connecttion error'))
db.once('open', function () {
    console.log('connecting...');
})
module.exports = mongoose