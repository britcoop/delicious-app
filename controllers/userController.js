const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
	res.render('login', {title: 'Login'});
};

exports.registerForm = (req, res) => {
	res.render('register', {title: 'Register'});
};

exports.validateRegister = (req, res, next) => {
	//sanitizeBody is accessed through express-validator (see app.js)
	//https://github.com/ctavan/express-validator
	req.sanitizeBody('name');
	req.checkBody('name', 'You must supply a name!').notEmpty();
	req.checkBody('email', 'That email is not valid!').isEmail();
	req.sanitizeBody('email').normalizeEmail({
		remove_dots: false,
		remove_extension: false,
		gmail_remove_subaddress:false
	});
	req.checkBody('password', 'Password cannot be blank!').notEmpty();
	req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
	req.checkBody('password-confirm', 'Oops! Your passwords do not match!').equals(req.body.password);

	const errors = req.validationErrors();
	if (errors) {
		req.flash('error', errors.map(err => err.msg));
		res.render('register', {title: 'Register', body: req.body, flashes: req.flash() });
		return; //stop the function from running
	}
	next(); //there were no errors so it will just call the next middleware in line (save to the db)
};

//we use next when we are exporting a middleware
exports.register = async (req, res, next) => {
	const user = new User({ email: req.body.email, name: req.body.name});
	//register library doesn't use promises yet, we have to use callbacks OR promisify
	const register = promisify(User.register, User); //if the method you're promisifying lives on an object, you
	//must also pass the object (in this case that is User) so it knows where to bind itself to
	await register(user, req.body.password); //it's going to store a hash of the password not the actual password
	next(); // pass the authController.login
};

