const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

//this is object destructuring
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
// req (request) is an object full of information that's coming in
// res (response) is an object full of methods for sending data back to the user
// res.send and res.json are the two most basic methods
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/add', storeController.addStore);

router.post('/add', 
	storeController.upload, 
	catchErrors(storeController.resize), 
	catchErrors(storeController.createStore)
);

router.post('/add/:id', 
	storeController.upload, 
	catchErrors(storeController.resize), 
	catchErrors(storeController.updateStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

//userController will take care of everything relating to the user info etc.
router.get('/login', userController.loginForm);
router.get('/register', userController.registerForm);

//1. Validate the registration data
//2. Register the user
//3. We need to log them in
router.post('/register',
	userController.validateRegister,
	userController.register,
	authController.login
);

module.exports = router;
