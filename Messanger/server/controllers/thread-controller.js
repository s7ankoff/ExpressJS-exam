const mongoose = require('mongoose')

const User = mongoose.model('User')
const Thread = mongoose.model('Thread')

const errorHandler = require('../utilities/error-handler')


module.exports = {

	search: (req, res) => {
		let userOne = req.user._id
		let searchedUser = req.query.search

		User.find({ username: searchedUser })
			.then(user => {

				if (user[0]._id.toString() == req.user._id.toString()) {

					res.locals.globalError = "Can't chat to yourself right? ;-)"
					return res.render('message/users')

				}

				let userTwo = user[0]._id.toString()

				let banned = false
				if (user[0].banns.indexOf(userOne) > -1) {
					banned = true
				}

				Thread
					.find({})
					.populate('messages.author', 'username')
					.then(threads => {

						let foundThread = ''
						for (thread of threads) {

							if (thread.users.indexOf(userOne) > -1 &&
								thread.users.indexOf(userTwo) > -1) {
								foundThread = thread
							}
						}

						if (foundThread != '') {

							let messages = foundThread.messages

							for (let messageLikes of messages) {
								if (messageLikes.likes.indexOf(userOne) > -1) {

									messageLikes.mine = true
									foundThread.save()
								} else {
									messageLikes.mine = false
									foundThread.save()
								}
							}

							return res.render('message/thread', {
								thread: foundThread.messages,
								userTwo: searchedUser,
								banned: banned,

							})
						}
						else {
							return res.render('message/thread', { userTwo: searchedUser })
						}
					})
					.catch(err => {
						console.log(err)
					})

			})
			.catch(err => {

				res.render('message/users', { err: "no such user" })
				return
			})

	},
	sendMessage: (req, res) => {

		let message = req.body.content
		let userOne = req.user._id
		let userTwoName = req.params.name
		let userTwo = req.params.name

		User
			.findOne({ username: userTwo })
			.then(user => {
				userTwo = user._id

				Thread
					.find({})
					.populate('messages.author', 'username')//<<= not working...
					.then(threads => {
						if (message.length > 1000) {
							res.locals.globalError = "To big message, message must be less than 1000chars!"
							return res.render('message/users')
						}


						if ((message.startsWith('http') || message.startsWith('https')) &&
							!(message.endsWith('.jpg') || message.endsWith('.jpeg') || message.endsWith('.png'))) {

							message = `<a href="${message}">${message}</a>`

						}
						if ((message.startsWith('http') || message.startsWith('https')) &&
							(message.endsWith('.jpg') || message.endsWith('.jpeg') || message.endsWith('.png'))) {

							message = `<img src="${message}"  style="width:200px" alt=""/>`
						}

						let threadExists = false

						for (let thread of threads) {

							if (thread.users.indexOf(userOne) > -1 && thread.users.indexOf(userTwo) > -1) {

								thread.messages.push({
									author: userOne,
									msg: message
								})
								thread.save()
								threadExists = true
								return res.render('message/thread', { thread: thread.messages, userTwo: userTwoName })
							}
						}
						if (!threadExists) {
							Thread
								.create({
									users: [userOne, userTwo],
									messages: [
										{
											author: userOne,
											msg: message,

										}]
								})

								.then(thread => {
									return res.render('message/thread', { thread: thread.messages, userTwo: userTwoName })
								})
						}

					})
					.catch(err => {
						console.log(err)
					})
			})
			.catch(err => {
				console.log(err)
			})

	},
	showThreads: (req, res) => {
		let userOne = req.user._id

		Thread
			.find({})

			.then(threads => {
				let userTwoArr = []
				for (let thread of threads) {

					if (thread.users.indexOf(userOne) > -1) {
						if (thread.users[0].toString() == userOne.toString()) {
							userTwo = thread.users[1]

							User
								.findOne({ _id: userTwo })
								.then(user => {
									userTwoArr.push(user.username)
								})
						} else {
							userTwo = thread.users[0]

							User
								.findOne({ _id: userTwo })
								.then(user => {
									userTwoArr.push(user.username)
								})
						}

					}
				}

				return res.render('message/threads', { thread: userTwoArr })

			})
			.catch(err => {
				console.log(err)
			})
	},
	bannUser: (req, res) => {
		let userOne = req.user.id
		let userTwo = req.params.name
		User
			.findOne({ username: userTwo })
			.then(user => {
				userTwo = user._id
				User
					.findOne({ _id: userOne })
					.then(user => {
						if (user.banns.indexOf(userTwo) > -1) {
							res.render('message/threads')
						} else {
							user.banns.push(userTwo)
							user.save()
							res.render('home/index',{message:'Bann added'})
						}

					})
					.catch(err => {
						console.log(err)
					})
			})
			.catch(err => {
				console.log(err)
			})


	},
	removeBann: (req, res) => {
		let userOne = req.user.id
		let userTwo = req.params.name
		User
			.findOne({ username: userTwo })
			.then(user => {
				userTwo = user._id

				User
					.findOne({ _id: userOne })
					.then(user => {

						if (user.banns.indexOf(userTwo) > -1) {
							user.banns.splice(user.banns.indexOf(userTwo), 1)
							user.save()
							res.render('home/index',{message:'Bann removed'})
						}

					})
					.catch(err => {
						console.log(err)
					})
			})
			.catch(err => {
				console.log(err)
			})
	},
	like: (req, res) => {
		let messageId = req.params.id
		let userOne = req.user.id
		let userTwo
		Thread
			.find({ messages: { $elemMatch: { _id: messageId } } })
			.populate('users')
			.then(threads => {
				let messagesArr
				for (let thread of threads) {
					messagesArr = thread.messages

					if (thread.users[0]._id.toString() == userOne.toString()) {
						userTwo = thread.users[1]

					} else {
						userTwo = thread.users[0]
					}
					for (let message of messagesArr) {


						if (message._id == messageId) {
							if (!(message.likes.indexOf(userOne) > -1)) {

								message.likes.push(userOne)
								thread.save()
								return res.render('message/info', { message: 'like added', user: userTwo })
							}
						}
					}

				}

			})
	},
	unlike: (req, res) => {
		let messageId = req.params.id
		let userOne = req.user.id
		let userTwo
		Thread
			.find({ messages: { $elemMatch: { _id: messageId } } })
			.populate('users')
			.then(threads => {
				let messagesArr
				for (let thread of threads) {
					messagesArr = thread.messages
					if (thread.users[0]._id.toString() == userOne.toString()) {
						userTwo = thread.users[1]

					} else {
						userTwo = thread.users[0]

					}

					for (let message of messagesArr) {


						if (message._id == messageId) {
							if (message.likes.indexOf(userOne) > -1) {
								message.likes.splice(message.likes.indexOf(userOne), 1)
								thread.save()

								return res.render('message/info', { message: 'like removed', user: userTwo })
							}

						}
					}

				}

			})
	},
	options: (req, res) => {
		let userOne = req.user.id
		let userTwo = req.params.name

		User
			.findById(userOne)
			.populate('banns')
			.then(user => {
			
				if (user.banns.length == 0) {
					return res.render('users/options', { banned: false, userTwo: userTwo })
				}

				for (let banns of user.banns) {
					if (banns.username == userTwo) {
						res.render('users/options', { banned: true, userTwo: userTwo })
					} else {
						res.render('users/options', { banned: false, userTwo: userTwo })
					}

				}

			})
			.catch(err => {
				console.log(err)
			})
	}

}