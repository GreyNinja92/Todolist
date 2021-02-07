// jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true});

const itemSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemSchema);

const buyFood = new Item({
  name: "Buy Food"
});


const cookFood = new Item({
  name: "Cook Food"
});


const eatFood = new Item({
  name: "Eat Food"
});

const defaultItems = [buyFood, cookFood, eatFood];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find(function (err, foundItems){
    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
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
          listTitle: customListName,
          newListItems: foundList.items
        });
      }
    }
  });

});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if (!err){
        foundList.items.push(item);
        foundList.save();

        res.redirect("/" + listName);
      }
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemID = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
      if (err) {
        console.log(err);
      }
    });

    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      {name: listName},
      {$pull: {items: {_id: checkedItemID}}},
      function(err, foundList){
          if (!err){
            res.redirect("/" + listName);
          }
      }
    );
  }

});

app.listen(3000, function() {
  console.log("Server is up and running");
});
