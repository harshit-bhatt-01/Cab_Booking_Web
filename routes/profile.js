var router = require("express").Router();
var customer = require("../models/customer");
var cab = require("../models/cab");
var Ride = require("../models/ride");
var request = require("request");

require('dotenv').config()

var price;
router.get("/register", function(req, res){
	res.render("register");
});

router.get("/logout", function(req, res){
	req.logout();
	res.redirect("/");
})

router.post("/SearchCabs/:id", function(req, res){
	cab.aggregate([{
    $geoNear: {
      near: {
        'type': "Point",
        'coordinates': [parseFloat(req.body.lat), parseFloat(req.body.long)]
      },
      distanceField: "dist.calculated",
      maxDistance: 10000,
      spherical: true
    }
  }]).then((function(cabs) {
		console.log(cabs);
		
		request("https://maps.googleapis.com/maps/api/geocode/json?address="+req.body.destination+",+CA&key="+process.env.GOOGLE_API_KEY, function(error, response, body){
			if(error){console.log(error);}
			if(!error && response.statusCode == 200){
				var dest = JSON.parse(body);
				var obj = [];
				obj.push(req.body.lat);
				obj.push(req.body.long);
				console.log(dest)
				var url="https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins="+obj[0]+","+obj[1]+"&destinations="+JSON.stringify(dest.results[0].geometry.location.lat)+","+JSON.stringify(dest.results[0].geometry.location.lng)+"&key="+process.env.GOOGLE_API_KEY
				
				customer.updateOne({_id: req.params.id},{$set: {coordinates: obj}}, function(err,done){
					if(err){console.log(err)} else {request(url, function(error, response, body){
					
					if(error){
						console.log(error);
					}
						if(!error && response.statusCode == 200){
							var data = JSON.parse(body);
							var distance = 1.60934*parseInt(data.rows[0].elements[0].distance.text);
							var time = data.rows[0].elements[0].duration.text.split(" ")[0];
							console.log(req.user);
							res.render("AvailableCabs", {price: parseInt(49+(distance*8)+(time*2)), customer: req.params.id,cabs: cabs, distance: distance, time: time})
							price=parseInt(49+(distance*8)+(time*2));
						}
						else{
							console.log(response.statusCode);
						}
					})
				}
			})
		}
		else{
			console.log("bhkkk");
		}
  })
})
).catch(function(err){
		if(err)
			{
				console.log(err);
			}
	})
})

router.post("/confirm/:cabs/customer/:customerid", function(req, res){
	customer.findById(req.params.customerid, function(err, cust){
		if(err){console.log(err);} else {
			var customer = cust;
			cab.findById(req.params.cabs, function(err, cab){
				if(err){console.log(err);} else {
					var cab = cab;
					cab.available = false;
					// to do integration staging environment devops 
					cab.save();
					var ride = new Ride({
						customer: customer,
						cab: cab,
						status: "active"
					})
					ride.save(function(err, data){
						
						if(err){console.log(err);} else {
							var ride_dat = data;
							var url="https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins="+JSON.stringify(customer.coordinates[0])+","+JSON.stringify(customer.coordinates[1])+"&destinations="+JSON.stringify(cab.geometry.coordinates[0])+","+JSON.stringify(cab.geometry.coordinates[1])+"&key="+process.env.GOOGLE_API_KEY;
							request(url,function(error, response, data){
								if(!error && response.statusCode == 200){
									var data = JSON.parse(data);
									res.render("activeride", {duration: data.rows[0].elements[0].duration.text, cab: cab, ride: ride_dat._id});
									console.log(price);
								}
							})
						}
					})
				}
			});
		}
	})
})

router.get("/cancel/:id", function(req, res){
	Ride.findById(req.params.id, function(err, ride){
		if(err){console.log(err);} else {
			var cabs = ride.cab;
			var cust = ride.customer;
			ride.status = "cancel";
			ride.save();
			cab.findById(cabs._id, function(err,cab){
				cab.available = true;
				cab.save(function(err, data){
					if(err){console.log(err);} else {
						res.redirect("/"+cust._id);
					}
				})
			})
		}
	})
})

module.exports = router;
