const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

let threadSchema = new mongoose.Schema({
	users: [{ type: ObjectId, required: true, ref: 'User' }],
	messages: [
		{
			author: { type: ObjectId, ref: 'User' },
			msg: { type: String, required: true, max: 11 },
			likes: [],
			mine: { type: Boolean }
		}]

})

let Thread = mongoose.model('Thread', threadSchema)

module.exports = Thread
