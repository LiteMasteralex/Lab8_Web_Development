let mongoose = require('mongoose');

mongoose.Promise = global.Promise;

let postSchema = mongoose.Schema({
	id : { type : String, require : true },
	title : { type : String },
	content : { type : String },
	author : { type : String },
	publishDate : { type : Date }
});

let Post = mongoose.model( 'Post', postSchema );

let PostList = {
	getAll : function() {
		return Post.find().then(function(posts) {
			return posts;
		}).catch(function(error) {
			throw Error(error);
		});
	},
	getByAuthor : function(author) {
		return Post.find({author: author}).then(function(post) {
			return post;
		}).catch(function(error) {
			throw Error(error);
		});
	},
	post : function(newPost) { 
		return PostList.getByID(newPost.id).then( post => {
			if (post) {
				return Post.create(newPost).then( resultPost => {
					return resultPost;
				}).catch( error => {
					throw Error(error);
				});
			} else {
				throw Error( "409" );
			}
		}).catch( error => {
			throw Error(error);
		});
	},
	delete : function(postId) {
		return Post.findOneAndRemove({id: postId}).then(function(post) {
			return post;
		}).catch(function(error) {
			throw Error(error);
		});
	},
	put : function( updatedPost ){
		return PostList.getByID( updatedPost.id )
			.then( post => {
				if ( post ){
					return Post.findOneAndUpdate( {id : post.id}, {$set : updatedPost}, {new : true})
						.then( newPost => {
							return newPost;
						})
						.catch(error => {
							throw Error(error);
						});
				}
				else{
					throw Error( "404" );
				}
			})
			.catch( error => {
				throw Error(error);
			});
	}
}

module.exports = { PostList };