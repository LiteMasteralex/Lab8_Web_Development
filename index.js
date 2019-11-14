let express = require("express");
let morgan = require("morgan");
let bodyParser = require('body-parser');
let uuidv4 = require('uuid/v4');
let mongoose = require('mongoose');
let { PostList } = require('./model');
const  {DATABASE_URL, PORT} = require('./config');

let app = express();
let jsonParser = bodyParser.json();

app.use(express.static('public'));
app.use(morgan("dev"));

let posts = [{
	id: uuidv4(),
	title: "New songs on my Profile.",
	content: "Hey guys just wanted to let you know that I added a few of my new songs to my spotify profile. Be sure to check them out!",
	author: "Jakey",
	publishDate : new Date('October 17, 2019')
}, {
	id: uuidv4(),
	title: "Profanity Warning!",
	content: "Please keep profanity to the minimum, we would like to avoid bannig people but we will if this continues.",
	author: "Moderator",
	publishDate : new Date('October 10, 2019')
}, {
	id: uuidv4(),
	title: "Happy Start of Spooktober!!!1!",
	content: "Looking forward to all your spooks, and the sugar overdose I'll get from the candy my kids gather.",
	author: "Felix",
	publishDate : new Date('October 1, 2019')
}];


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
	let post_list = posts.find(object => object.author == author);
	if(post_list == undefined) {
		res.statusMessage = "Author provided does not exist";
		return res.status(404).json({
			message: "Author provided does not exist",
			status: 404
		});
	}

	post_list = posts.filter(object => object.author == author);
	return res.status(200).json(post_list);
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
	posts.push(newPost);
	return res.status(201).json(newPost);
});

app.delete("/blog-posts/:id", jsonParser, function(req, res) {
	let id = req.params.id;
	let post = posts.find(object => object.id == id);
	if (post == undefined) {
		res.statusMessage = "No post exist with given id.";
		return res.status(404).json({
			message: "No post exist with given id.",
			status: 404
		});
	}

	posts = posts.filter(object => object.id != id);
	return res.status(200).end();
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
	let post = posts.find(object => object.id == new_post.id);
	if (post == undefined) {
		res.statusMessage = "No post exist with given id.";
		return res.status(404).json({
			message: "No post exist with given id.",
			status: 404
		});
	};
	posts.forEach(function(entry) {
		if(entry.id == new_post.id) {
			if(new_post.author != undefined) {
				entry.author = new_post.author
			};
			if(new_post.title != undefined) {
				entry.title = new_post.title;
			}
			if(new_post.content != undefined) {
				entry.content = new_post.content
			}
			if(new_post.publishDate != undefined) {
				entry.publishDate = new_post.publishDate
			}
		}
	});
	post = posts.find(object => object.id == new_post.id);
	return res.status(202).json(post);

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