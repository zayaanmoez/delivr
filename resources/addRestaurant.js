// Intialize events
function init() {
    let button = document.getElementById("create");
    button.onclick = createRestaurant;
}

// Handler to create restaurant and post data
function createRestaurant() {
    let name = document.getElementsByName("name")[0].value;
    let deliveryFee = document.getElementsByName("deliveryFee")[0].value;
    let minOrder = document.getElementsByName("minOrder")[0].value;
    if(!name || !deliveryFee || !minOrder) {
        alert("Please enter data in all fields!")
        return;
    }  
    if(!name && (!Number(deliveryFee) || !Number(minOrder))) {
        alert("Please enter valid numbers for Delivery fee and Minimum Order!")
        return;
    }

    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            restaurantData = JSON.parse(req.responseText);
            window.location.replace("/restaurants/" + restaurantData.id);
        } else if (this.status == 406) {
            alert("Invalid Input!");
        }
    }

    req.open("POST", "/restaurants");
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify({"name": name, "deliveryFee": deliveryFee, "minOrder": minOrder}));
}
