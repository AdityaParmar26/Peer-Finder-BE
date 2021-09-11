// Requiring the neccesary modules

const dotenv = require("dotenv");
const mongoose = require("mongoose");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');


const app = express();
app.use(cors({ origin: true }));
app.use(cookieParser());

dotenv.config({ path: './config.env' });

require('./database/connection');

app.use(express.json());

app.use(require('./router/route'));

const port = process.env.PORT || 8000;

const User = require("./models/userSchema");

// Starting the server

app.listen(port, (req, res)=>{
    console.log("Server is currently running");
});