var router = require("express").Router();
var passport = require("passport");
var customer = require("../models/customer");

// router.get("/login", function(req, res){
// 	res.render("customerlogin");
// });

router.get("/google", passport.authenticate("google", {
	scope: ["profile","email"]
}));

router.get('/google/redirect', passport.authenticate("google"), function(req, res){
	// if(req.app.locals.new){
	// 	res.redirect("/" + object._id);
	// } else {
		customer.findById(req.user._id, function(err, object){
			if(err){
				console.log(err);
			} else {
				res.redirect("/" + object._id);
			
		}
		});
	// }
});

module.exports = router;
