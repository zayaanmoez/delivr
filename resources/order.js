let order = {
    id: null,
    name: "",
    items: {},
    subtotal: 0,
    tax: 0,
    min_order: 0,
    delivery: 0,
    total: 0
}

let restaurantData;

// Dynamically create a dropdown menu for the restaurants in client.js
function init() {
    //Request restaurant names and genrate dropdown menu
    let req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            let restaurantList = JSON.parse(req.responseText);

            let div = document.createElement("div");
            div.id = "dropdown";
            let dropdown = document.createElement("select");
        
            let empty = document.createElement("option");
            empty.value = null;
            empty.appendChild(document.createTextNode("Select Restaurant"));
            dropdown.appendChild(empty);
    
            Object.keys(restaurantList).forEach(res => {
                let option = document.createElement("option");
                option.value = res;
                option.appendChild(document.createTextNode(restaurantList[res].name));
                dropdown.appendChild(option);
            });
            dropdown.onchange = selectRestaurant;
            div.appendChild(dropdown);
        
            let main = document.getElementById("mainContent");
            let info = document.createElement("div");
            info.id = "restaurant"
            main.appendChild(div);
            main.appendChild(info);
        }
    }

    req.open("GET", "/restaurantList");
    req.send();
}


// Clear the order, retains name and delivery cost if param is false
function clearOrder(clearAll) {
    if (clearAll) {
        order.id = null;
        order.name = "";
        order.delivery = 0;
        let node = document.getElementById("restaurant");
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }
    order.items = {};
    order.subtotal = 0;
    order.tax = 0;
    order.total = 0;

}


// Handler for the dropdown menu to select a restaurant
function selectRestaurant() {
    let restaurant = document.getElementById("dropdown").firstChild.value;
    let clear;
    if (restaurant === null) {
        return;
    } else if (Object.keys(order.items).length > 0) {
        //Confirm the if the user wants to proceed to clear the order
        clear = confirm("Would you like to clear the current order?");
        if(!clear) {
            document.getElementById("dropdown").firstChild.value = "";
            return;
        }
    }

    clearOrder(true);

    changeRestaurant(restaurant);

}


// Changes the restaurant and produces a new menu for it
function changeRestaurant(resID) {
    let req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            restaurantData = JSON.parse(req.responseText);
            let restaurantDiv = document.getElementById("restaurant");

            // Create a info section for the restaurant
            let info = document.createElement("div");
            info.id = "info";
            let infoHtml = `<p>${restaurantData.name}<br>
                Minimum Order: $${restaurantData.min_order}<br> 
                Delivery charge: $${restaurantData.delivery_fee}</p>`;
            info.innerHTML = infoHtml;
            restaurantDiv.appendChild(info);

            // Set order details
            order.id = restaurantData.id;
            order.name = restaurantData.name;
            order.delivery = restaurantData.delivery_fee;
            order.min_order = restaurantData.min_order;

            // Generate categories div and elements
            restaurantDiv.appendChild(createCategoryDiv(restaurantData.menu));

            // Generate menu div and elements
            restaurantDiv.appendChild(createMenuDiv(restaurantData.menu));

            // Generate order summary div 
            restaurantDiv.appendChild(createOrderDiv(restaurantData.menu));
        }
    }

    req.open("GET", "/restaurantMenu/" + resID);
    req.send();
}


// Creates a left bar for menu categories for navigation
function createCategoryDiv(menu) {
    let div = document.createElement("div");
    div.id = "categories";
    let list = document.createElement("ul");
    
    Object.keys(menu).forEach(category => {
        let elem = document.createElement("li");
        let text = document.createTextNode(category);
        let link = document.createElement("a");
        link.href = "#" + category;
        link.appendChild(text);
        elem.appendChild(link);
        list.appendChild(elem);
    });

    div.appendChild(list);
    return div;

}


// Creates a menu seperated into categories
function createMenuDiv(menu) {
    let div = document.createElement("div");
    div.id = "menu";
    
    //Create divs for each category
    Object.keys(menu).forEach(category => {
        let categoryDiv = document.createElement("div");
        categoryDiv.id = category;
        categoryDiv.className = "category";

        // Create menu items for the category
        let list = document.createElement("ul");
        let categoryName = document.createElement("li");
        categoryName.appendChild(document.createTextNode(category));
        categoryName.style.fontSize = "larger";
        categoryName.style.fontWeight = "bold";
        categoryName.style.textIndent = "3%";
        list.appendChild(categoryName);
        Object.values(menu[category]).forEach(item => {
            let elem = document.createElement("li");
            let itemDetails = document.createElement("ul");
            // Item name, price and add immage
            let namePrice = document.createElement("li");
            let innerHTML = `<p>${item.name}    $${item.price}     ` + 
            `<i class="addIcon" onclick="addItem(\`${item.name}\`, ${item.price})"></i> </p>`;
            namePrice.innerHTML = innerHTML;
            namePrice.style.fontWeight = "bold";
            itemDetails.appendChild(namePrice);
            // Item description and image
            let desc = document.createElement("li");
            text = document.createTextNode(item.description);
            desc.appendChild(text);
            itemDetails.appendChild(desc);

            elem.appendChild(itemDetails);
            list.appendChild(elem);
        });
        categoryDiv.appendChild(list);

        div.appendChild(categoryDiv);

    });

    return div;
}


// Creates a menu seperated into categories
function createOrderDiv(menu) {
    let div = document.createElement("div");
    div.id = "order";
    let list = document.createElement("ul");
    Object.keys(order.items).forEach(item => {
            let elem = document.createElement("li");
            let price = order.items[item].price;
            let count = order.items[item].count;
            let innerHTML = `<p>${item} x ${count} (${round(price * count)})  ` + 
            `<i class="removeIcon" onclick="removeItem(\`${item}\`)"></i> </p>`;
            elem.innerHTML = innerHTML;
            list.appendChild(elem);
        });
    
    function addElem(str) {
        let elem = document.createElement("li");
        let text = document.createTextNode(str);
        elem.appendChild(text);
        list.appendChild(elem);
    }
    
    addElem(`Subtotal: $${order.subtotal}`);
    addElem(`Tax: $${order.tax}`);
    addElem(`Delivery: $${order.delivery}`);
    addElem(`Total: $${order.total}`);

    div.appendChild(list);

    if (order.subtotal >= order.min_order) {
        let button = document.createElement("button");
        button.innerHTML = "Submit";
        button.onclick = submitOrder;
        div.appendChild(button);
    } else {
        let para = document.createElement("p");
        let text = document.createTextNode(`Please add $${round(order.min_order - order.subtotal)}` + ` of items before submitting`);
            para.appendChild(text);
        div.appendChild(para);
    }

    return div;
}


// Add items to the order
function addItem(itemName, itemPrice) {
    if (order.items[itemName]) {
        order.items[itemName].count += 1;
    } else {
        let item = {name: itemName, price: itemPrice,
        count: 1};
        order.items[itemName] = item;
    }
    order.subtotal = round(order.subtotal + itemPrice);
    order.tax = round(order.subtotal * 0.1);
    order.total = round(order.subtotal + order.tax + order.delivery);
    let restaurantDiv = document.getElementById("restaurant");
    // Generate order summary div 
    restaurantDiv.replaceChild(createOrderDiv(restaurantData.menu), document.getElementById("restaurant").lastChild);
}


// Add items to the order
function removeItem(itemName) {
    order.subtotal = round(order.subtotal - order.items[itemName].price);
    order.tax = round(order.subtotal * 0.1);
    order.total = round(order.subtotal + order.tax + order.delivery);
    if (order.items[itemName].count > 1) {
        order.items[itemName].count -= 1;
    } else {
        delete order.items[itemName];
    }
    let restaurantDiv = document.getElementById("restaurant");
    // Generate order summary div 
    restaurantDiv.replaceChild(createOrderDiv(restaurantData.menu), document.getElementById("restaurant").lastChild);
}


// Submit order
function submitOrder() {
    let req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            alert("Your order has been submitted!");
            clearOrder(false);
            let restaurantDiv = document.getElementById("restaurant");
            restaurantDiv.removeChild(restaurantDiv.lastChild);
            restaurantDiv.appendChild(createOrderDiv(restaurantData.menu));
        }
    }

    req.open("POST", "/orders");
    req.setRequestHeader("Content-Type", "application/json")
    req.send(JSON.stringify(order));
}


// Rounding function to two decimal places
function round(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
}
