let express = require("express");
let morgan = require("morgan");
let bodyParser = require('body-parser');
let uuidv4 = require('uuid/v4');
let mongoose = require('mongoose');
let { PostList } = require('./blog-post-model');
const  {DATABASE_URL, PORT} = require('./config');

let app = express();
let jsonParser = bodyParser.json();

app.use(express.static('public'));
app.use(morgan("dev"));


let checkAttributes = function(post) {
	for(let attr in post) {
		if (post[attr] == "") {
			return true;
		}
	}
	return false;
};

app.get("/blog-posts", function(req, res) {
	PostList.getAll().then( posts => {
		return res.status(200).json(posts);
	}).catch( error => {
		return res.status(500).json({
			message: "Internal Server Error.",
			status: 500
		});
	});
});

app.get("/blog-post", function(req, res) {
	let author = req.query.author
	if (author == "") {
		res.statusMessage = "No author was provided for the search";
		return res.status(406).json({
			message: "No author was provided for the search",
			status: 406
		});
	}

	PostList.getByAuthor(author).then( posts => {
		if(posts.length == 0) {
			res.statusMessage = "Author provided does not exist";
			return res.status(404).json({
				message: "Author provided does not exist",
				status: 404
			});
		}
		return res.status(200).json(posts);
	}).catch(error => {
		return res.status(500).json({
			message: "Internal Server Error.",
			status: 500
		});
	});
});

app.post("/blog-posts", jsonParser, function(req, res) {
	let newPost = req.body;
	if(!(newPost.title && newPost.author && newPost.content) && checkAttributes(newPost)) {
		res.statusMessage = "Missing field in body";
		return res.status(406).json({
			message: "Missing field",
			status: 406
		});	
	};
	newPost.id = uuidv4();
	newPost.publishDate = new Date();
	PostList.post(newPost).then(post => {
		return res.status(201).json(post);
	}).catch(error => {
		return res.status(500).json({
			message: "Internal Server Error.",
			status: 500
		});
	});
});

app.delete("/blog-posts/:id", jsonParser, function(req, res) {
	let id = req.params.id;
	PostList.delete(id).then( post => {
		console.log(post);
		if(post == null) {
			res.statsMessage = "Post id not found";
			return res.status(404).json({
				message: "Post id not found",
				status: 404
			});
		}
		return res.status(202).json(post);
	}).catch( error => {
		return res.status(500).json({
			message: "Internal Server Error.",
			status: 500
		});
	});
});

app.put("/blog-posts/:id", jsonParser, function(req, res) {
	let new_post = req.body;
	console.log(new_post.id);
	if(new_post.id == undefined) {
		res.statusMessage = "Missing id in body";
		res.status(406).json({
			message: "Missing Id", 
			status: 406
		});
	};
	if(new_post.id != req.params.id) {
		res.statusMessage = "Param missmatch";
		res.status(409).json({
			message: "Param missmatch",
			status: 409
		});
	};

	PostList.put(new_post).then( post => {
		if (post == null) {
			res.statusMessage = "No post exist with given id.";
			return res.status(404).json({
				message: "No post exist with given id.",
				status: 404
			});
		}
		return res.status(202).json(post);
	}).catch( error => {
		return res.status(500).json({
			message: "Internal Server Error.",
			status: 500
		});
	});

});

let server;

function runServer(port, databaseUrl) {
	return new Promise( function(resolve, reject) {
		mongoose.connect(databaseUrl, function(error) {
			if (error) {
				return reject(error);
			}
			else {
				server = app.listen(port, function() {
					console.log('Welcome to the blog-post server:' + port);
					resolve();
				}).on('error', function(error) {
					mongoose.disconnect();
					return reject(error);
				});
			}
		});
	});
};

runServer(PORT, DATABASE_URL).catch(function(error) {
	console.log(error);
});

function closeServer(){
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing the server');
			server.close( err => {
				if (err){
					return reject(err);
				}
				else{
					resolve();
				}
			});
		});
	});
}

module.exports = { app, runServer, closeServer };