//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//------------------------------------------------------------------------------

main().catch(err => console.log(err));

async function main() {
  const lineReader = require('line-reader');

  lineReader.eachLine('secret.txt', function(line, last) {
    mongoose.connect(line);
  });
}

//------------------------------------------------------------------------------

const {
  Schema
} = mongoose;

const itemsSchema = {
  name: String
};

const Item = mongoose.model("item", itemsSchema);

const hammer = new Item({
  name: "hammer"
});
const tap = new Item({
  name: "tap"
});
const ball = new Item({
  name: "ball"
});

const defaultItems = [hammer, tap, ball];

//------------------------------------------------------------------------------

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//------------------------------------------------------------------------------

app.get("/", function(req, res) {

  Item.find({}, function(err, results) {
    if (err) {
      console.log(err);
    } else {
      if (results.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("no errors after insertion");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "today",
          newListItems: results
        });
        console.log("find successful");
      }
    }
  });
});

//------------------------------------------------------------------------------

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList) {
      if(err){
        console.log(err);
      } else {
        foundList.items.push(item);
        foundList.save(function(err){

          if (!err){

            res.redirect("/" + listName);

          }

        });
      }
    });
  }
});

//------------------------------------------------------------------------------

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: {_id: checkedItemId}}}, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName)
      }
    });
  }
});

//------------------------------------------------------------------------------

app.get("/about", function(req, res) {
  res.render("about");
});

//------------------------------------------------------------------------------

app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);
  const day = date.getDate();

  List.findOne({
    name: customListName,
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

//------------------------------------------------------------------------------

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully");
});
