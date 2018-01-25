//import statements
var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cookieSession = require("cookie-session");
const morgan = require("morgan");

//global constants
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "random1",
    date: new Date("1999-12-31").toDateString(),
    visitors: 0,
    unique: []
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "random1",
    date: new Date("1998-01-08").toDateString(),
    visitors: 0,
    unique: []
  }
};

const users = {
  "random1": {
    id: "random1",
    email: "random1@example.com",
    password: bcrypt.hashSync("asdfzxcv", 10)
  },
  "random2": {
    id: "random2",
    email: "random2@example.com",
    password: bcrypt.hashSync("qwerasdf", 10)
  }
};

//body-parser, ejs engine and cookie-parser implementations
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["key1", "key2"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(morgan("dev"));
app.use(deadCookies);

//homepage redirects users to either login or urls depending on login status
app.get("/", (req, res) => {
  if(req.session.user_id) {
    res.redirect("/urls");
  }else {
    res.redirect("/login");
  }
});

//register page get route
app.get("/register", (req, res) => {
  if(req.session.user_id && users.hasOwnProperty(req.session.user_id)) {
    res.redirect("/urls");
    return;
  }
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
    var hPass = bcrypt.hashSync(req.body.password, 10);
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: hPass
    };
    req.session.user_id = userID;
    res.redirect("/urls");
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
  if(req.session.user_id && users.hasOwnProperty(req.session.user_id)) {
    res.redirect("/urls");
    return;
  }
  res.render("login", { invalid: false });
});

//login submission post route
app.post("/login", (req, res) => {
  for(let user in users) {
    if(req.body.email === users[user]["email"] && bcrypt.compareSync(req.body.password, users[user]["password"])) {
      req.session.user_id = users[user]["id"];
      res.redirect("/urls");
      return;
    }
  }
  res.render("login", { invalid: true });
});

//logout form post route
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

//index page get route
app.get("/urls", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id],
    urls : urlsForUser(req.session.user_id)
  };
  res.render("urls_index", templateVars);
});

//create shortURL route
app.post("/urls", (req, res) => {
  let short = generateRandomString();
  urlDatabase[short] = { longURL: checkHTTP(req.body.longURL), userID: req.session.user_id, date: new Date().toDateString(), visitors: 0, unique: [] };
  res.redirect(`/urls/${short}`);
});

//new url to be shortened get route
app.get("/urls/new", (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

//shortened url page get route
app.get("/urls/:id", (req, res) => {
  if(urlDatabase.hasOwnProperty(req.params.id)) {
    if(req.session.user_id === urlDatabase[req.params.id]["userID"]) {
      let templateVars = {
        user: users[req.session.user_id],
        long: urlDatabase[req.params.id]["longURL"],
        short: req.params.id,
        date: urlDatabase[req.params.id]["date"],
        visitors: urlDatabase[req.params.id]["visitors"],
        unique: urlDatabase[req.params.id]["unique"]
      };
      res.render("urls_show", templateVars);
    } else {
      res.send("Cannot view because this link does not belong to you.");
    }
  } else {
    res.send("The page you are trying to reach does not exist.");
  }
});

//establish key value pair between short and long urls
app.post("/urls/:id", (req, res) => {
  if(req.session.user_id === urlDatabase[req.params.id]["userID"]) {
    urlDatabase[req.params.id]["longURL"] = checkHTTP(req.body.longURL);
    res.redirect("/urls");
  } else {
    res.send("You can only update your own links.");
  }
});

//route for when users try to access delete url via address bar
app.get("/urls/:id/delete", (req, res) => {
  if(req.session.user_id === urlDatabase[req.params.id]["userID"]) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.send("You can only delete your own links.");
  }
});

//delete shortened url post route
app.post("/urls/:id/delete", (req, res) => {
  if(req.session.user_id === urlDatabase[req.params.id]["userID"]) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    res.send("You can only delete your own links.");
  }
});

//json get route
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//redirect short to long url get route
app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase.hasOwnProperty(req.params.shortURL)) {
    let longURL = urlDatabase[req.params.shortURL]["longURL"];
    if(!req.session.user_id) {
    req.session.user_id = generateRandomString();
    urlDatabase[req.params.shortURL]["unique"].push(req.session.user_id);
    } else if (req.session.user_id && !urlDatabase[req.params.shortURL]["unique"].includes(req.session.user_id)) {
      urlDatabase[req.params.shortURL]["unique"].push(req.session.user_id);
    }
    urlDatabase[req.params.shortURL]["visitors"] += 1;
    res.redirect(longURL);
  } else {
    res.statusCode = 404;
    res.send("Not found.");
  }
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

//function that iterates through urlDatabase and return properties that possesses the userID provided
function urlsForUser(id) {
  var subset = {};
  for(let obj in urlDatabase) {
    if(urlDatabase[obj]["userID"] === id) {
      subset[obj] = urlDatabase[obj];
    }
  }
  return subset;
}

//check if input is string beginning with http
function checkHTTP(str) {
  if(str.startsWith("http://")) {
    return str;
  } else {
    return "http://" + str;
  }
}

//function to check login status determining which endpoints user has access to
function deadCookies(req, res, next) {
  //if path request is login or register or shortened URL link
  if(req.path.match(/login|register|u\//)) {
    next();
    return;
  }
  //check if user is registered and logged in otherwise redirect
  if(users.hasOwnProperty(req.session.user_id)) {
    next();
    return;
  }else {
    req.session = null;
    res.redirect("/login");
    return;
  }
}