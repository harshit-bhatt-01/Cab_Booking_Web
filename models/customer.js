var mongoose = require("mongoose");

var customerSchema = new mongoose.Schema({
	googleid: String,
	name: String,
	email: String,
	coordinates: [Number]
});

var Customer = mongoose.model("customer", customerSchema);

module.exports = Customer;
