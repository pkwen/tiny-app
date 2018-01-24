//import statements
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


//global constants
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "random1": {
    id: "random1",
    email: "random1@example.com",
    password: "asdfzxcv"
  },
  "random2": {
    id: "random2",
    email: "random2@example.com",
    password: "qwerasdf"
  }
};

//body-parser, ejs engine and cookie-parser implementations
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());

app.get("/", (req, res) => {
  if(req.cookies["user_id"]) {
    res.redirect("/urls");
  }else {
    res.redirect("/login");
  }
});

//index page get route
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    urls : urlDatabase
  };
  res.render("urls_index", templateVars);
});

//add new link to be shortened route
app.post("/urls", (req, res) => {
  // console.log(req.body);
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
});

//register page get route
app.get("/register", (req, res) => {
  res.render("register", { repeat: false, invalid: false });
});

//register submission post route
app.post("/register", (req, res) => {
  var repeat = false;
  for(let user in users) {
    if(users[user]["email"] === req.body.email) {
      repeat = true;
    }else {
      repeat = false;
    }
  }
  if(!repeat && req.body.email.length > 4 && req.body.password.length >= 6) {
    var userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    console.log(users);
    res.cookie("user_id", userID)
      .redirect("/urls");
  } else if(req.body.password.length < 6) {
    res.statusCode = 400;
    res.render("register", { repeat: repeat, invalid: true });
  } else {
    res.statusCode = 400;
    res.render("register", { repeat: repeat, invalid: false });
  }
});

//login page get route
app.get("/login", (req, res) => {
  res.render("login", { invalid: false });
});

//login submission post route
app.post("/login", (req, res) => {
  for(let user in users) {
    console.log(`${req.body.email}\n${req.body.password}\n${users[user]["email"]} : ${users[user]["password"]}`);
    if(req.body.email === users[user]["email"] && req.body.password === users[user]["password"]) {
      console.log("login success");
      res.cookie("user_id", users[user]["id"])
      .redirect("/urls");
      return;
    }
  }
  res.render("login", { invalid: true });
});

//logout form post route
app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
    .redirect("/urls");
});

//new url to be shortened get route
app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id]
  };
  res.render("urls_new", templateVars);
});

//shortened url page get route
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user: users[req.cookies.user_id],
    shortURL: req.params.id
  };
  res.render("urls_show", templateVars);
});

//establish key value pair between short and long urls
app.post("/urls/:id", (req, res) => {
  //update req.id longURL
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

//delete shortened url post route
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//json get route
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//redirect short to long url get route
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//error page for uris that were not implemented
app.get("/*", (req, res) => {
  res.statusCode = 404;
  res.end(`
    <html>
      <body>
        <h1>Page Does Not Exist</h1>
        <a href="/urls">TinyApp Index</a>
      </body>
    </html>\n`);
});

//server listening for events
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//generates 6 alphanumeric character strings using Math.random method
function generateRandomString() {
  var str = "";
  while(str.length < 6) {

    var candidate = Math.floor(Math.random() * 74 + 48);
    if(candidate >= 48 && candidate <= 57 || candidate >= 65 && candidate <= 90 || candidate >= 97 && candidate <= 122) {
      str += String.fromCharCode(candidate);
    }
  }
  return str;
}