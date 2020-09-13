let restaurant = {};
let nextId = 0;

// Intialize events, create menu and setup data
function init() {
    let mainContent = document.getElementById("mainContent");

    let req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            restaurant = JSON.parse(req.responseText);

            categoryDropdown(); // Create category dropdown

            let div = document.createElement("div");
            div.id="restaurant2";

            // Generate categories div and elements
            div.appendChild(createCategoryDiv(restaurant.menu));

            // Generate menu div and elements
            div.appendChild(createMenuDiv(restaurant.menu));

            mainContent.insertBefore(div, document.getElementById("updateInfo"));

            let lastID = 0;
            Object.keys(restaurant.menu).forEach(cat => {
                Object.keys(restaurant.menu[cat]).forEach(id => {
                    lastID = id;
                })
            })
            nextId = lastID + 1;
        }
    }

    req.open("GET", "/restaurantMenu/" + document.getElementById("script").getAttribute("resId"));
    req.send();

    let info = document.getElementById("update");
    info.onclick = updateInfo;

    let category = document.getElementById("category");
    category.onclick = addCategory;

    let item = document.getElementById("item");
    item.onclick = addItem;

    let save = document.getElementById("save");
    save.onclick = saveRestaurant;
}


// Onclick handler to update restaurant info
function updateInfo() {
    let name = document.getElementsByName("name")[0].value;
    let deliveryFee = document.getElementsByName("deliveryFee")[0].value;
    let minOrder = document.getElementsByName("minOrder")[0].value;
    if(!name && !deliveryFee && !minOrder) {
        alert("Please enter some data!")
        return;
    }  
    if(!name && (!Number(deliveryFee) && !Number(minOrder))) {
        alert("Please enter valid numbers for Delivery fee or Minimum Order!")
        return;
    }
    if(name) {
        restaurant.name = name;
        document.getElementById("infoName").innerHTML = `Name : ${restaurant.name}`;
    } 
    if(deliveryFee && Number(deliveryFee)) {
        restaurant.delivery_fee = Number(deliveryFee);
        document.getElementById("infoDelivery").innerHTML = `Delivery Fee : \$${restaurant.delivery_fee}`;
    }
    if(minOrder && Number(minOrder)) {
        restaurant.min_order = minOrder;
        document.getElementById("infoOrder").innerHTML = `Minimum Order : \$${restaurant.min_order}`;
    }
    document.getElementsByName("name")[0].value = "";
    document.getElementsByName("deliveryFee")[0].value = "";
    document.getElementsByName("minOrder")[0].value = "";
}


// Onclick handler to add menu category
function addCategory() {
    let category = String(document.getElementsByName("category")[0].value);
    if(!category) {
        alert("Please enter a category!");
        return;
    }
    Object.keys(restaurant.menu).forEach(key => {
        if (key.toLowerCase() === category.toLowerCase()) {
            alert("Category already exists!");
            document.getElementsByName("category")[0].value = "";
            return;
        }
    });
    restaurant.menu[category] = {};
    document.getElementById("restaurant2").replaceChild(createCategoryDiv(
        restaurant.menu), document.getElementById("categories2"));
    document.getElementsByName("category")[0].value = "";
    categoryDropdown();
}

// Onclick handler to add menu item
function addItem() {
    let item = String(document.getElementsByName("item")[0].value);
    let description = String(document.getElementsByName("description")[0].value);
    let price = document.getElementsByName("price")[0].value;
    let itemCategory = document.getElementById("itemCategory").value;
    if (!item || !description || !price || itemCategory == "") {
        alert("Please enter all fields!");
        return;
    } else if (!Number(price)) {
        alert("Please enter valid number for price!");
        return;
    }
    restaurant.menu[itemCategory][nextId] = {"name":item, "description":description, "price":Number(price)};
    nextId++;
    document.getElementById("restaurant2").replaceChild(createMenuDiv(
        restaurant.menu), document.getElementById("menu2"));
    document.getElementsByName("category")[0].value = "";
    document.getElementsByName("item")[0].value = "";
    document.getElementsByName("description")[0].value = "";
    document.getElementsByName("price")[0].value = "";
    document.getElementById("itemCategory").value = "";
}


// Create dropdown for the add menu item form
function categoryDropdown() {
    let dropdown = document.getElementById("itemCategory");
    while (dropdown.firstChild) {
        dropdown.removeChild(dropdown.firstChild);
    }
    let empty = document.createElement("option");
    empty.value = "";
    empty.appendChild(document.createTextNode("Select Category"));
    dropdown.appendChild(empty);

    Object.keys(restaurant.menu).forEach(cat => {
        let option = document.createElement("option");
        option.value = cat;
        option.appendChild(document.createTextNode(cat));
        dropdown.appendChild(option);
    });
}


// Creates a left bar for menu categories for navigation
function createCategoryDiv(menu) {
    let div = document.createElement("div");
    div.id = "categories2";
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

// Save the restaurant data on the server
function saveRestaurant() {
    console.log("called")
    let req = new XMLHttpRequest();

    req.onreadystatechange = function() {
        if(this.readyState == 4 && this.status == 200) {
            alert("Restaurant data was saved successfully!");
            window.location.replace("/restaurants/" + restaurant.id);
        }
    }

    req.open("PUT", "/restaurants/" + restaurant.id);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(restaurant));
}


// Creates a menu seperated into categories
function createMenuDiv(menu) {
    let div = document.createElement("div");
    div.id = "menu2";
    
    //Create divs for each category
    Object.keys(menu).forEach(category => {
        let categoryDiv = document.createElement("div");
        categoryDiv.id = category;
        categoryDiv.className = "category2";

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
            let innerHTML = `<p>${item.name}    $${item.price} </p>`;
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