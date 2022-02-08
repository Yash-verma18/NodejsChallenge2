const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const findOrCreate = require('mongoose-findorcreate');

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
const { resourceLimits } = require("worker_threads");
const { resolveSoa } = require("dns");

const userTodo = new mongoose.Schema({
    id: Number,
    userId: Number,
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
userSchema.plugin(findOrCreate);





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

                    // delete elm.userId;

                    const todo_user = new Todos({
                        id: elm.id,
                        userId: elm.userId,
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

function specificTodo(req_UserId) {
    todoList.length = 0;

    Todos.find(function(err, result) {
        for (let i = 0; i < result.length; i++) {
            if (result[i].userId == req_UserId) {
                todoList.push(result[i]);
            }
        }
        // console.log(todoList);
    });
}





app.get("/user/:userId", function(req, res) {

    var req_userId = req.params.userId;
    specificTodo(req.params.userId);

    https.get('https://jsonplaceholder.typicode.com/users/' + req_userId, (resp) => {
        let data = '';

        // A chunk of data has been received.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            const folksData = JSON.parse(data);

            User.findOne({ id: req_userId }, function(err, result) {
                // console.log(result);
                if (result == null) {
                    const user = new User({
                        id: folksData.id,
                        name: folksData.name,
                        email: folksData.email,
                        phone: folksData.phone,
                        todos: todoList,
                    });

                    user.save(function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Saving User " + req_userId);
                            res.send(result);
                        }

                    });
                } else {
                    console.log("User is already saved in database, Hence sending the data to client");
                    console.log("Result is not NULL");
                    res.send(result);
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