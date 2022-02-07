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


const userSchema = new mongoose.Schema({
    id: Number,
    name: String,
    email: String,
    phone: String,
    todos: Array,
});

const userTodo = new mongoose.Schema({
    id: Number,
    title: String,
    completed: Boolean,
});

const Todos = mongoose.model("todos", userTodo);

const User = mongoose.model("user", userSchema);


https.get('https://jsonplaceholder.typicode.com/todos', (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        const userData = JSON.parse(data);
        userData.forEach(elm => delete elm.userId);

        for (let i = 0; i < userData.length; i++) {

            const todo_user = new Todos({
                id: userData[i].id,
                title: userData[i].title,
                completed: userData[i].completed,
            });

            todo_user.save();
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});

app.get("/todos", function(req, res) {
    Todos.find(function(err, userData) {
        if (!err) {
            res.send(userData);
        } else {
            console.log(err);
        }
    });
});

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

            https.get('https://jsonplaceholder.typicode.com/todos', (resp) => {
                let data = '';

                // A chunk of data has been received.
                resp.on('data', (chunk) => {
                    data += chunk;
                });

                // The whole response has been received. Print out the result.
                resp.on('end', () => {
                    const usersInfo = JSON.parse(data);
                    // console.log(usersInfo[0]);

                    for (let i = 0; i < usersInfo.length; i++) {
                        if (usersInfo[i].userId == req.params.userId) {
                            // console.log(usersInfo[i]);
                            todoList.push(usersInfo[i]);
                        }
                    }

                });

            }).on("error", (err) => {
                console.log("Error: " + err.message);
            });


            const user = new User({
                id: userData.id,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                todos: todoList
            });

            user.save(function() {
                User.findOne({ id: req_userId }, function(err, user) {
                    if (!err) {
                        res.send(user);
                    } else {
                        console.log(err);
                    }
                });
            });


        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

});

app.listen(4000, function() {
    console.log("Server started successfully");
});