var mongoose = require("mongoose");

var rideSchema = new mongoose.Schema({
	customer: Object,
	cab: Object,
	price: Number,
	status: String
});

var Ride = mongoose.model("ride", rideSchema);

module.exports = Ride;
