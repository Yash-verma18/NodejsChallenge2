const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

mongoose.connect("mongodb://localhost:27017/nodeUserDB", () => {
    console.log("Db is connected");
}, e => console.error(e));


app.use(bodyParser.urlencoded({
    extended: true
}));

const https = require('https');
const { use } = require("express/lib/application");
const res = require("express/lib/response");
const { userInfo } = require("os");

const userTodo = new mongoose.Schema({
    id: Number,
    title: String,
    completed: Boolean,
});

const Todos = mongoose.model("todos", userTodo);




const userSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    phone: String,
    todos: Array,
});

const User = mongoose.model("user", userSchema);




Todos.find(function(err, userData) {
    if (!err && userData.length == 0) {
        https.get('https://jsonplaceholder.typicode.com/todos', (resp) => {
            let data = '';

            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                const userData = JSON.parse(data);
                userData.forEach(function(elm) {

                    delete elm.userId;

                    const todo_user = new Todos({
                        id: elm.id,
                        title: elm.title,
                        completed: elm.completed,
                    });
                    todo_user.save();
                });

                Todos.find(function(err, usersData) {
                    if (!err) {
                        console.log("User Todo list is saved, It Was 0 in length  : " + userData.length);
                    } else {
                        console.log(err);
                    }
                });

            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
        // res.send(userData);
    } else if (!err && userData.length > 0) {
        console.log(userData.length);
    } else {
        console.log(err);
    }
});


app.get("/todos", function(req, res) {
    Todos.find(function(err, usersData) {
        if (!err) {
            console.log("req for /todos and userDatalength is : " + usersData.length);
            res.send(usersData);
        } else {
            console.log("ERROR Coming");
            console.log(err);
        }
    });
});

// ------------ TASK : Save the userInfo and Todos of The user +  Save the data on Mongoose + send the data from mongoose to user making get request  ---------------

// First save the userInfo + Todos of the user in database



var todoList = new Array();

app.get("/user/:userId", function(req, res) {

    const req_userId = req.params.userId;


    https.get('https://jsonplaceholder.typicode.com/users/' + req_userId, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            const userData = JSON.parse(data);
            // console.log(userData);

            https.get('https://jsonplaceholder.typicode.com/todos', (resp) => {
                let data = '';

                // A chunk of data has been received.
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    const usersInfo = JSON.parse(data);

                    if (todoList.length === 0) {
                        for (let i = 0; i < usersInfo.length; i++) {
                            if (usersInfo[i].userId === req_userId) {
                                // console.log(usersInfo[i]);
                                todoList.push(usersInfo[i]);
                            }
                        }
                    }
                });

            }).on("error", (err) => {
                console.log("Error: " + err.message);
            });


            // console.log(userData);

            User.find({ id: req_userId }, function(err, result) {
                if (!err && result.length != 0) {
                    res.send(result[0]);
                    console.log("User found No need to save ");
                } else if (!err && result.length > 0) {
                    const user = new User({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        phone: userData.phone,
                        todos: todoList
                    });

                    user.save(function() {
                        console.log("user is saved succefully");
                        res.send(result[0]);
                    });

                    // todoList.length = 0;
                }
            });
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

});


app.listen(4000, function() {
    console.log("Server started successfully");
});