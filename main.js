var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var passport = require("passport");
var googleStrategy = require("passport-google-oauth20");
var keys = require("./keys");
var mongoose = require("mongoose");

var authRoutes = require("./routes/auth");
var profileRoutes = require("./routes/profile");

var customer = require("./models/customer");
var cab = require("./models/cab");
var ride = require("./models/ride");

app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));


app.use(require("express-session")({
    secret: "VIT",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(
	new googleStrategy({
			callbackURL: '/auth/google/redirect',
			clientID: keys.google.clientID,
			clientSecret: keys.google.clientSecret
		}, function(accessToken, refreshToken, profile, done){
		// check if user already exist
			customer.findOne({googleid: profile.id}, function(err, data){
				if(err){
					console.log(err);
				} else if(data){
					app.locals.new = false;
					done(null, data);
				} else {
					new customer({
						googleid: profile.id,
						name: profile.displayName,
						email: profile.emails[0].value,
						contact: "",
					}).save().then(function(newUser){
							app.locals.new = true;
							done(null, newUser);
						});
					}
			});
	})
);

mongoose.connect("mongodb://localhost:27017/cabbooking",{useNewUrlParser: true});

passport.serializeUser(function(id, done){
	customer.findById(id).then(function(user){
		if(user){
				done(null, user);
		}
	});
});

// deserializing user
passport.deserializeUser(function(id, done){
	customer.findById(id).then(function(user){
		if(user){
				done(null, user);
		} 
	});
});

// var cab1 = new cab({
// 	name: "Aamir S",
// 	cabName: "Maruti Suzuki Swift",
// 	cabNumber: "TN23 S 2241",
// 	contact: 980084711,
// 	available: true,
// 	geometry: {"type": "point", "coordinates": [18.9333,81.1344]}
// })
// cab1.save(function(err, res){
// 	if(err){console.log(err)} else {
// 		console.log(res);
// 	}
// })

app.get("/",function(req, res){
	res.render("home",{customer: "nill"});
})
app.get("/map",function(req,res){
	res.render("map");
})
app.get("/:id",function(req,res){
	customer.findById(req.params.id, function(err, data){
		if(err){console.log(err);} else {
			res.render("home",{customer: data, id:req.params.id});
		}
	})
});



app.use('/auth', authRoutes);
app.use("/profile", profileRoutes);

app.listen(3000,function(){
	console.log("server started");
});