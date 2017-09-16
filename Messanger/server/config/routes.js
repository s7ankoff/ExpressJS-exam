const controllers = require('../controllers')
const auth = require('./auth')

module.exports = (app) => {
	app.get('/', controllers.home.index)
	// app.get('/about', auth.isAuthenticated, controllers.home.about)

	app.get('/users/register', controllers.users.registerGet)
	app.post('/users/register', controllers.users.registerPost)
	app.get('/users/login', controllers.users.loginGet)
	app.post('/users/login', controllers.users.loginPost)
	app.post('/users/logout', controllers.users.logout)

	app.get('/threads/show', auth.isAuthenticated, controllers.thread.showThreads)

	app.get('/users/find', auth.isAuthenticated, controllers.thread.search)

	app.post('/message/thread/sendTo/:name', auth.isAuthenticated, controllers.thread.sendMessage)
	app.get('/thread/with/:name', auth.isAuthenticated, controllers.thread.search)

	app.get('/options/:name', auth.isAuthenticated, controllers.thread.options)
	app.get('/bann/:name', auth.isAuthenticated, controllers.thread.bannUser)
	app.get('/un-bann/:name', auth.isAuthenticated, controllers.thread.removeBann)

	app.get('/like/:id', auth.isAuthenticated, controllers.thread.like)
	app.get('/unlike/:id', auth.isAuthenticated, controllers.thread.unlike)

	app.all('*', (req, res) => {
		res.status(404)
		res.send('404 Not Found!')
		res.end()
	})
}
