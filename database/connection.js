const mongoose = require('mongoose');

const database = process.env.DATABASE;

mongoose.connect(database,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(()=>{
    console.log("Database is connected successfully");
}).catch((err)=>{
    console.log("Some error occured during connection");
})

