const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
	storage: multer.memoryStorage(),
	fireFilter(req, file, next){
		const isPhoto = file.mimetype.startsWith('image/');
		if(isPhoto){
			next(null, true);
		} else {
			next({ message: 'That filetype isn\'t allowed!'}, false);
		}
	}
};

exports.homePage = (req, res) => {
	res.render('index');
};

exports.addStore = (req, res) => {
	res.render('editStore', {title: 'Add Store'});
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
	//check if there is no new file to resize
	if(!req.file) {
		next(); //skip to the next middleware
		return;
	}
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	//now we resize
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	//once we have written the photo to our filesystem, keep going!
	next();
};

exports.createStore = async (req, res) => {
	const store = await (new Store(req.body)).save();
	await store.save();
	req.flash('success', `Successfully creates ${store.name}. Care to leave a review?`);
	res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	//1. Query the database for a list of all stores
	const stores = await Store.find();
	console.log(stores);
	res.render('stores', {title: 'Stores', stores: stores});
};

exports.editStore = async (req, res) => {
	//1. Find the store given the ID
	//everything in store returns a promise so we need "await"
	const store = await Store.findOne({ _id: req.params.id });
	//2. Confirm they are the owner of the store
	//TODO
	//3. Render out the edit form so the user can update their store
	res.render('editStore', { title: `Edit ${store.name}`, store: store });
};

exports.updateStore = async (req, res) => {
	//set the location data to be a point
	req.body.location.type = 'Point';
	//find and update the store
	//findOneAndUpdate is a method in mongodb
	const store = await Store.findOneAndUpdate({_id:req.params.id}, req.body, {
		new: true, //return the new store instead of the old one
		runValidators: true //force our model to run the required validators
	}).exec();
	req.flash('success', `Successfully updated <strong>${store.name}</strong> 
		<a href="/stores/${store.slug}">View Store > </a>`);
	res.redirect(`/stores/${store._id}/edit`);
	//redirect them the store and tell them it worked
};

//async queries the database
//next assumes a middleware and passes it along to the next piece of middleware
exports.getStoreBySlug = async (req, res, next) => {
	//test that this works
	//res.send('it works!');
	const store = await Store.findOne({ slug: req.params.slug });
	if(!store) return next();
	res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
	//first get a list of all the stores
	const tag = req.params.tag;
	//if there is no tag, it's going to fall back on the second query which is
	//just show every store that has at least one tag property on it
	const tagQuery = tag || { $exists: true };
	const tagsPromise = Store.getTagsList();
	const storesPromise = Store.find({tags: tagQuery });
	//wait for multiple promises to come back (tagsPromise AND storesPromise)
	//allows us to extract data from arrays, objects, maps and sets into their own variable
	//const { first, last } = person; this is the same person.first, person.last
	const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
	res.render('tag', {tags: tags, title: 'Tags', tag, stores});
};