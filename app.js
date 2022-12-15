import fetch from "node-fetch";
const http = require('http');
process.stdin.setEncoding("utf8");
let fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') }) 
let PORT = process.env.PORT || 5090;

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: "CMSC335_DB", collection:"books"};
const { MongoClient, ServerApiVersion, MongoUnexpectedServerResponseError } = require('mongodb');
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
	response.render("index");
});

app.get("/bestsellers", (request, response) => {
    let answer = "<style>body {background-color: rgb(156, 145, 115); text-align: center;}</style>";
    answer += "<h1>New York Times Best Sellers for Fiction</h1><p>";

    fetch('https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json?api-key=99OIGjGWoDCHYKdvqKgJHEtEuZ61bGZR')
        .then((response) => response.json())
        .then((data) => {
            data.results.books.forEach((entry) => {
                answer += "<b>Title: <b>" + entry.title + "<br>" + "<img src=\"" + entry.book_image+"\"><br>" + "<b>Author: <b>" + entry.author + "<br><b>Description:<b><br>" + entry.description + "<br><br>";
            });
            response.send(answer);
        });

});

app.get("/review", (request, response) => {
    let lnk = "https://coolreads.onrender.com/review";
    const variables = {
        lnk: lnk
    };
    response.render("review.ejs", variables);
});


app.post("/review", async function (request, response) {
    const uri = `mongodb+srv://${userName}:${password}@cluster0.984ddbu.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    let {bookname, author, page, rating, review} = request.body;

    let answer = "<h1>Book Review is Submitted!<h1>";
    answer += "Book: " + bookname + "<br>";
    answer += "Author: " + author + "<br>";
    answer += "Number of Pages: " + page + "<br>";
    answer += "Rating " + rating + "/5<br>";
    answer += "Book Review: " + review + "<br>";

    try {
        await client.connect();
        let entry = {book: bookname, author: author, pages: page, rating: rating, review: review};
        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(entry);
    } catch(e) {
        console.error(e);
    } finally {
        await client.close();
    }

    response.end(answer);
});

app.get("/list", (request, response) => {
    let lnk = "https://coolreads.onrender.com/list";
    const variables = {
        lnk: lnk
    };
    response.render("list.ejs", variables);
});

app.post("/list", async function (request, response) {
    const uri = `mongodb+srv://${userName}:${password}@cluster0.984ddbu.mongodb.net/?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    let answer = "<style>body {background-color: rgb(156, 145, 115);}</style>"
    answer += "<h1>My Books<h1><p>";
    try {
        await client.connect();
        let filter = {};
        const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
        
        const result = await cursor.toArray();
        result.forEach((entry) => {
            answer += entry.book + ": " + entry.rating + "/5<br>";
        });
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    answer += "</p>";
    response.end(answer);
});

app.listen(PORT);
console.log("Web server started");
/*process.stdout.write("Stop to shutdown the server\n");
process.stdin.on("readable", function() {
    let dataInput = process.stdin.read();
    if(dataInput.trim() === "stop") {
        process.stdout.write("Shutting down the server\n");
        process.exit(0);
    } 
});*/
