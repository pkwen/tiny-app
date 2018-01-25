# TinyApp Project

TinyApp is a full stack web application built with Node and Express that provides the functionality of shortening a provided URL. TinyApp supports user privacy as shortened links are only available for read and edit by their creator. However, once a shortened link has been generated, they can be shared and used by everyone to reach the linked website. Generated short URLs' visit count, unique visit count and date created will be documented and displayed for your viewing.

## Final Product

!["User registration page"](https://github.com/subclinical/tiny-app/blob/master/docs/register-page.png?raw=true)
!["Index page once logged in as a valid user"](https://github.com/subclinical/tiny-app/blob/master/docs/urls-page.png?raw=true)
!["Edit page where short URL's target website can be updated"](https://github.com/subclinical/tiny-app/blob/master/docs/show-page.png?raw=true)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command
