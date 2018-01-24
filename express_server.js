var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(cookieParser());

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    username: req.cookies["name"],
    urls : urlDatabase
  };
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  // console.log(req.body);
  let short = generateRandomString();
  urlDatabase[short] = req.body.longURL;
  res.redirect(`/urls/${short}`);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  if(req.body.email.length > 4 && req.body.password.length >= 6) {
    let loginInfo = {
      username : req.body.email,
      password : req.body.password
    };
    console.log(loginInfo);
    res.redirect("/urls");
  } else {
    res.redirect("/register");
  }
});

app.post("/login", (req, res) => {
  res.cookie("name", req.body.username)
    .redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie("name", req.body.username)
    .redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    username: req.cookies["name"]
  };
  res.render('urls_new', templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies["name"],
    shortURL: req.params.id
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  //update req.id longURL
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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