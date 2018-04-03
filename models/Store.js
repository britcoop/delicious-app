const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter a store name!'
	},
	slug: String,
	description: {
		type: String,
		trim: true
	},
	tags: [String],
	created: {
		type: Date,
		/*Date.now tells you the current time in milleseconds*/
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: 'Point'
		},
		coordinates: [{
			type: Number, 
			required: 'Your must supply coordinates!'
		}],
		address: {
			type: String,
			required: 'You must supply an address!'
		}
	},
	photo: String
});

storeSchema.pre('save', async function(next){
	if(!this.isModified('name')){
		next(); //skip it
		return; //stop this function from running
	}
	this.slug = slug(this.name);
	//find other stores that have a slug of wes, wes-1, wes-2
	//regex is a way to pattern match in javascript
	//this line just says we're looking for a slug and it might end in -1-2-3 etc.
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
	const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
	if(storesWithSlug.length) {
		this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
	}
	next();
	//TODO make more resilient so slugs are unique
});

//must not use arrow function here because we are using 'this' - can't use 'this' in arrow functions
storeSchema.statics.getTagsList = function() {
	//aggregate() takes an array of possible operators of what we're looking for
	return this.aggregate([
		//pipeline
			{ $unwind: '$tags' },
			//group everything based on the tag field, 
			//then create a new field in each of those groups called count
			//each time we create a field, the count is going to add (sum) itself by 1
			{ $group: { _id: '$tags', count: { $sum: 1 } }},
			{ $sort: { count: -1 }}
		]);
}

module.exports = mongoose.model('Store', storeSchema);