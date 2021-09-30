const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const PORT = 8080;

const generateRandomString = () => {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() *
    charactersLength));
  }
  return result;
};

const checkUser = (userEmail) => {
  for (const userId in users) {
    const user = users[userId];
    if (user.email === userEmail) {
      return user;
    }
  }
  return null;
};

const urlsForUser = (id) => {
  let urls = {};
  for (const url in urlDatabase) {
    const userid = urlDatabase[url].userID;
    if (userid === id)
      urls[url] = urlDatabase[url];
  }
  return urls;
};

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/urls", (req, res) => {
  // check if the user is logged in, and redirect to login page if not
  const user = users[req.cookies["user_id"]];
  if (!user) {
    const templateVars = {user: null};
    res.render("urls_index", templateVars);
  } else {
    // user logged in, filter through the urlDatabase and render only the shortURLs that belongs to the user
    const urls = urlsForUser(user.id);
    //update templateVars and render the urls page
    const templateVars = { urls: urls, user: user };
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  const user = templateVars.user;
  if (!user) {
    res.status(401).redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
  
});

app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  res.render("userRegistration", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]]};
  res.render("login", templateVars);
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send("Username and Password fields are mandatory and cannot be empty");
  }

  const user = checkUser(email);
  if (user) {
    res.status(400).send("A user with that email already exists");
  }
  users[id] = {id, email, password};
  res.cookie("user_id", id);
  res.redirect("urls");
});

app.post("/urls", (req, res) => {
  const newURL = req.body.longURL;
  const shortURL = generateRandomString();
  const templateVars = { user: users[req.cookies["user_id"]]};
  urlDatabase[shortURL] = {
    "longURL": newURL,
    "userID": templateVars.user.id
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:shortURL", (req, res) => {
  // check if the user is logged in, and redirect to login page if not
  const user = users[req.cookies["user_id"]];
  if (!user) {
    const templateVars = { user: null};
    res.render("urls_index", templateVars);
  } else {
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL]["userID"] === user.id) {
      const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]["longURL"], user: user};
      res.render("urls_show", templateVars);
    } else {
      const templateVars = { shortURL: req.params.shortURL, longURL: null, user: user};
      res.render("urls_show", templateVars);
    }
    
  }
  
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  for (const url in urlDatabase) {
    if (shortURL === url) {
      const longURL = urlDatabase[shortURL]["longURL"];
      res.redirect(longURL);
    }
  }
  res.status(404).send("The short url entered does not exist");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    res.status(401).send("<html><body><h5>You must be logged in to delete these urls</h5></body></html>\n");
  } else {
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL].userID === user.id) {
      delete urlDatabase[shortURL];
      res.redirect("/urls");
    }
  }
});

app.get("/urls/:shortURL/edit", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    res.status(401).send("<html><body><h5>You must be logged in to edit this url</h5></body></html>\n");
  } else {
    const shortURL = req.params.shortURL;
    if (urlDatabase[shortURL].userID === user.id) {
      res.redirect(`/urls/${shortURL}`);
    }
  }

});

app.post("/urls/:shortURL/edit", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (!user) {
    res.status(401).send("<html><body><h5>You must be logged in to edit this url</h5></body></html>\n");
  }
  const newURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL]["longURL"] = newURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = checkUser(email);
  if (!user) {
    res.status(403).send("The user with the email provided does not exist");
  }

  if (user.password !== password) {
    res.status(403).send("The password entered does not match any user");
  } else {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  }

  
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/u/", (req, res) => {
  res.statusCode = 404;
  res.send("Error 404 Page Not Found");
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});