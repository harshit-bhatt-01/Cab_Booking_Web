var mongoose = require("mongoose");
	
//create geolocation schema
var geoSchema = new mongoose.Schema({
	type: {
		default: "Point",
		type: String
	},
	coordinates: {
		type: [Number],
		index: "2dsphere"
	}
})

var cabSchema = new mongoose.Schema({
	name: String,
	cabName: String,
	cabNumber: String,
	contact: Number,
	available:{
		type: Boolean,
		default: false
	},
	geometry: geoSchema
});

var Cab = mongoose.model("cab", cabSchema);

module.exports = Cab;