var express = require("express");
var app = express();
var bodyparser = require("body-parser");
var passport = require("passport");
var googleStrategy = require("passport-google-oauth20");
var mongoose = require("mongoose");

var authRoutes = require("./routes/auth");
var profileRoutes = require("./routes/profile");

var customer = require("./models/customer");
var cab = require("./models/cab");
var ride = require("./models/ride");

app.use(bodyparser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));

require('dotenv').config()

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
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET
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

mongoose.connect("mongodb://localhost:27017/cabbooking", {useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect("mongodb+srv://parth_pandey1:"+process.env.DB_PASSWORD+"@cluster0.eqqen.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")

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
// 	name: "Rajesh",
// 	cabName: "Maruti Suzuki WagonR",
// 	cabNumber: "UP32 AS 2241",
// 	contact: 9800847111,
// 	available: true,
// 	geometry: {"type": "point", "coordinates": [26.9210,80.9512]}
// })
// cab1.save(function(err, res){
// 	if(err){console.log(err)} else {
// 		console.log(res);
// 	}
// })

app.get("/",function(req, res){
	res.render("home");
})

app.get("/:id",function(req,res){
	customer.findById(req.params.id, function(err, data){
		if(err){console.log(err);} else {
			res.render("dashboard",{customer: data, id:req.params.id});
		}
	})
});



app.use('/auth', authRoutes);
app.use("/profile", profileRoutes);

app.listen(3000,function(){
	console.log("server started");
});
