# DELIVR

Food ordering and delivery platform with dynamic content, authentication services, order tracking and account management. Developed with Javascript, Node, Express, Pug templating engine and MongoDB.

## Build project
Install external modules: npm install
Running the server form the assignment directory: npm start (or node server.js)
The site is hosted at: http://localhost:3000

Project Overview:
server.js : express server for the site 
config.json : some configurations for the project
/resources/ : css stylesheet, all images and all all client js scripts
/views/: contains index.pug, order.pug, stats.pug, addRestaurant.pug, restaurantList.pug
	 , browseRestaurant.pug, user.pug, orderPage.pug and profile.pug for the all the pages
         and template.pug for header and background image

The server script handles all get requests to the pages, the data for the
order form, add and update and all static resources. All requests are handled using express and 
changes to server data through browse is reflected across all pages. The project uses mongodb for persistence

External node modules: express, pug, mongodb

Install external modules: npm install
Running the server form the assignment directory: npm start (or node server.js)
The site is hosted at: http://localhost:3000
