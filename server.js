// Express App for Assignment 4
const fs = require("fs")
const path = require("path")
const express = require("express")
const mc = require("mongodb").MongoClient;
const session = require("express-session")
const mongodbStore = require("connect-mongodb-session")(session);
const ObjectID = require('mongodb').ObjectID;
const config = require("./config.json")
const sessionStore = new mongodbStore({
    uri: 'mongodb://localhost:27017/tokens',
    collection: 'sessions'
});

// Server Data
let restaurantData = {};
let restaurantStats = {};
let restaurantList = {};
let itemCounts = {};

//Helper object to get MIME type based on file extension
const MIME = {
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.txt': 'text/plain',
	'.html': 'text/html',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.css': 'text/css'
};

/***************************************************************************************************************/
// Intialize the Server

let app = express();
app.use(session({ secret: 'AXKY78WI370RHT10', store: sessionStore}))
app.set("view engine", "pug");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, config.resourceDir))) // static server for resources(imgaes, scripts, stylesheet etc)
app.use(["/restaurants", "/users", "/orders"], express.static(path.join(__dirname, config.resourceDir)))
app.use(function(req,res,next) {
    res.locals.session = req.session;
    next();
});

// Get requests for html pages
app.get("/", (req, res, next) => { 
    res.render(path.join(__dirname, config.viewDir, "index")); })
app.get("/logout", auth_loggedin, logout);
app.get("/login", auth_loggedout, (req, res, next) => { 
    res.render(path.join(__dirname, config.viewDir, "authenticate"), {auth: "Login"}); 
});
app.post("/login", login)
app.get("/register", auth_loggedout, (req, res, next) => { 
    res.render(path.join(__dirname, config.viewDir, "authenticate"), {auth: "Register"}); 
})
app.post("/register", register)

app.get("/orderForm", auth_loggedin, (req, res, next) => { res.render(path.join(__dirname, config.viewDir, "order")); })
app.get("/restaurantStats", (req, res, next) => { res.render(path.join(__dirname, config.viewDir, "stats"), {restaurantStats}); })
app.get("/restaurants", restaurants)
app.get("/addrestaurant", (req, res, next) => { res.render(path.join(__dirname, config.viewDir, "addRestaurant")); })
app.get("/restaurants/:restID", (req, res, next) => { 
    if (!restaurantData.hasOwnProperty(req.params.restID)) next("404");
    res.render(path.join(__dirname, config.viewDir, "browseRestaurant"), {"restaurant": restaurantData[req.params.restID]}); 
})
app.get(["/users/?name=:name", "/users"], (req, res, next) => { 
    let regex;
    if(!req.query.name) { regex = ".*"; } 
    else { regex = ".*" + req.query.name.toLowerCase() + ".*"; }
    db.collection("users").
    find({privacy: false, username: {$regex: regex}})
    .project({username: 1}).toArray(function(err, result) {
        if(err) throw err;
        res.render(path.join(__dirname, config.viewDir, "users"), {users: result});
    })
})
app.get("/users/:uid", loadUser)
app.get("/orders/:orderID", loadOrder)

// HTTP requests for other resources and data
app.get("/restaurantList", (req, res, next) => {
    res.status(200).type(MIME['.json']).json(restaurantList)
})
app.get("/restaurantMenu/:restID", (req, res, next) => {
    if (!restaurantData.hasOwnProperty(req.params.restID)) next("404");  
    res.status(200).type(MIME['.json']).json(restaurantData[req.params.restID]);
})
app.post("/orders", submitOrder)
app.post("/restaurants", addRestaurant)
app.put("/restaurants/:restID", saveRestaurant)
app.post("/setPrivacy", setPrivacy)

// Error handling 
app.use(errorHandler)
app.use((req, res, next) => { res.status(404).send("Unknown Resource"); })

console.log("Server intialized...")

/***************************************************************************************************************/
// Load and setup data and start the server

// Read restaurant data into RAM from local directory and 
// setup data for the server
const directoryPath = path.join(__dirname, config.restaurantDir);
fs.readdir(directoryPath, function(err, files) {
    //handle error
    if(err) {
        console.log('Error reading directory: ' + err);
    }

    //parsing json data in the restaurantData object
    files.forEach(file => {
        let restaurant = require("./restaurants/" + file);
        restaurant.id = config.nextID;
        restaurantList[config.nextID] = {"id": config.nextID, "name": restaurant.name};
        restaurantData[config.nextID] = restaurant;
        restaurantStats[config.nextID] = {"id": config.nextID, "name": restaurant.name, "orderCount": 0, "averageTotal": 0, "popularItem": "N/A"};
        itemCounts[config.nextID] = {};
        config.nextID++;
    });

    console.log("Restaurant data loaded successfully.");
    startServer();

});


// Connect to the database and start the server
function startServer() {
    mc.connect("mongodb://localhost:27017", function(err, client) {
        if (err) {
            console.log("Error in connecting to database: " + err);
		    return;
        }

        db = client.db('a4');
        console.log("Connected to the a4 database.");

        app.listen(3000);
        console.log("Server listening at http://localhost:3000");
    }) 
}

/***************************************************************************************************************/
// Request handler function for http requests

// Login, logout and register user handlers
function login(req, res, next) {
	let username = req.body.username;
    let password = req.body.password;
	db.collection("users").findOne({username: username}, function(err, result){
		if(err) throw err;
		
		if(result){
			if(result.password === password){
				req.session.loggedin = true;
                req.session.username = username;
                req.session._id = result._id;
                req.session.privacy = result.privacy;
                res.sendStatus(200);
            } else {
                res.status(401).send("Not authorized. Invalid password.");
            }
		}else{
			res.status(401).send("Not authorized. Invalid username.");
		}
	});
};

function logout(req, res, next){
    req.session.loggedin = false;
	res.redirect("/");
};

function register(req, res, next) {
	let username = req.body.username;
	let password = req.body.password;
	db.collection("users").findOne({username: username}, function(err, result){
		if(err) throw err;
		
		if(result){
            res.status(401).send("Username already exists.");
        } else {
            db.collection("users").insertOne({username: username, password: password, privacy: false}, function(err, result){
                if (err) throw err;

                req.session.loggedin = true;
                req.session.username = username;
                req.session._id = String(result.insertedId);
                req.session.privacy = false;
                res.sendStatus(200);
            });
        }
    });
}

// Authentication functions to check user authentication

function auth_loggedin(req, res, next) {
    if(!req.session.loggedin){
		res.redirect("/");
		return;
    }
    next();
}

function auth_loggedout(req, res, next) {
    if(req.session.loggedin){
		res.redirect("/");
		return;
    }
    next();
}

// Load the requested user page
function loadUser(req, res, next) {
    let id = req.params.uid;
    try{
		oid = new ObjectID(id);
	}catch{
		res.status(404).send("That ID does not exist.");
		return;
	}

    db.collection("users").findOne({_id: oid}, function(err, result){
		if(err) throw err;
		
		if(result) {
            let ownProfile = (req.session.loggedin && String(result._id) == String(req.session._id)); 
            let username = result.username;
			if(result.privacy == true && !ownProfile) {
                res.status(403).send("Not authorized. Do not have permission to access the user profile.");
            } else if (result.privacy == false || ownProfile) {
                db.collection("orders").find({username: result.username}).
                project({restaurantName: 1}).toArray(function(err, result) {
                    if(err) throw err;

                    res.render(path.join(__dirname, config.viewDir, "profile"), 
                    {ownProfile, username: username, orders: result}); 
                }) 
            }
		}else{
			res.status(404).send("That ID does not exist.");
		}
	});
}

// Update the profile privacy for the user
function setPrivacy(req, res, next) {
    if (!(req.session.loggedin && req.body.username == req.session.username)) {
        res.status(403).send("Not authorized.")
        return;
    }
    
    db.collection("users").updateOne({username: req.session.username}, {"$set": {privacy: req.body.privacy}}, function(err, result) {
            if(err) throw err;
            req.session.privacy = req.body.privacy;
            res.status(200).send();
    });
}

// Load the requested order page
function loadOrder(req, res, next) {
    let id = req.params.orderID;
    try{
		oid = new ObjectID(id);
	}catch{
		res.status(404).send("That ID does not exist.");
		return;
	}

    db.collection("orders").findOne({_id: oid}, function(err, result){
		if(err) throw err;
        
		if(result) {
            let priv;
            db.collection("users").findOne({username: result.username}, function(err, user) {
                if(err) throw err;

                let ownProfile = (req.session.loggedin && String(result.username) == String(req.session.username)); 
                if(ownProfile || user.privacy == false) {
                    res.render(path.join(__dirname, config.viewDir, "orderPage"), 
                    {orderData: result});
                } else { 
                    res.status(403).send("Not authorized. Do not have permission to access the order page.");
                }
            })
		} else{
			res.status(404).send("That ID does not exist.");
		}
	});
}

// Submit order from order form
function submitOrder(req, res, next) {
    try {
        updateStats(req.body);
        let body = req.body;
        let data = {username: req.session.username, restaurantID: body.id, restaurantName: body.name, subtotal: body.subtotal, total: body.total,
        fee: body.delivery, tax: body.tax, order: body.items};
        db.collection("orders").insertOne(data, function(err, result) {
            if(err) throw err;

            res.status(200).end();
        })
    } catch(err) {
        next(err);
    } 
}

// Request for list of restaurants as either json or html
function restaurants(req, res, next) {
        res.format({
            "application/json" : () => {
                let list = [];
                restaurantList.map(restaurant => { list.push(restaurant.id)} )
                res.status(200).json({"restaurants": list}); 
            },
            "text/html": () => { res.render(path.join(__dirname, config.viewDir, "restaurantList"), {restaurantList}); }
        })
}

// Add a new restaurant to the data
function addRestaurant(req, res, next) {
    try {
        let body = req.body;
        if(!body.name || !body.deliveryFee || !body.minOrder) {
            res.status(406).send("Invalid input!")
        } else {
            restaurantList[config.nextID] = {"id": config.nextID, "name": body.name};
            restaurantData[config.nextID] = {"id": config.nextID, "name": body.name, "min_order": body.minOrder, "delivery_fee": body.deliveryFee, "menu": {}};
            restaurantStats[config.nextID] = {"id": config.nextID, "name": body.name, "orderCount": 0, "averageTotal": 0, "popularItem": "N/A"};
            itemCounts[config.nextID] = {};
            config.nextID++;
            res.status(200).json(restaurantData[config.nextID - 1]);
        }
    } catch(err) {
        next(err);
    }
}

// Save restaurant data to the server
function saveRestaurant(req, res, next) {
    try {
        if(!restaurantData.hasOwnProperty(req.params.restID)) next("404");
        let body = req.body;
        restaurantData[req.params.restID] = body;
        restaurantList[req.params.restID].name = body.name;
        restaurantStats[req.params.restID].name = body.name;
        res.status(200).end();
    } catch(err) {
        next(err);
    }
}


/***************************************************************************************************************/
// Helper functions and call back functions

//Send 404 response for unknown resource
function errorHandler(err, req, res, next) {
    if (err == "404") {
        res.status(404).send("Unknown Resource");
    } else {
        console.log("Error: " + err);
        res.status(500).send("Internal server error. ");
    }
}

//Update resturant stats with the order details
function updateStats(order) {
    let stats = restaurantStats[order.id];
    restaurantStats[order.id].averageTotal = 
    round((stats.orderCount * stats.averageTotal + order.total) / (stats.orderCount + 1));
    restaurantStats[order.id].orderCount++;

    // Add items from the order to the items counts
    let items = order.items;
    Object.keys(items).forEach(item => {
        if (itemCounts[order.id][item]) {
            itemCounts[order.id][item] += items[item].count;
        } else {
            itemCounts[order.id][item] = items[item].count;
        }
    });

    // Update most popular item
    Object.keys(itemCounts).forEach(res => {
        let max = 0;
        let popular = "N/A";
        let list = itemCounts[res];
        Object.keys(list).forEach(item => {
            if(list[item] > max) {
                popular = item;
                max = list[item];
            }
        });
        restaurantStats[res].popularItem = popular;
    });
}


// Rounding function to two decimal places
function round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}