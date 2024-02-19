//import required modules
const express = require("express"); 
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

//DB values
const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@${process.env.DB_HOST}/`;
const client = new MongoClient(dbUrl);

//set up Express object and port
const app = express();
const port = process.env.PORT || "8888";

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true })); 
app.use(express.json());

//route to home page
app.get("/", (req, res) => { 
    res.render("index", { title: "Home" });
});

//route to costumes page
app.get("/costumes", async (req, res) => { 
    let costumes = await getApprovedCostumes();
    // console.log("All Costumes:", costumes);
    res.render("costumes", { title: "Costumes", costumes: costumes });
});

//route to single costume page
app.get("/costumes/costume", async (req, res) => { 
    if (req.query.costumeId) {
        let costumeToGet = await getSingleCostume(req.query.costumeId); 
        res.render("costume", { title: "Costume", costume: costumeToGet });
      } else { 
        res.redirect("/costumes");
      } 
});

//route to sell page
app.get("/sell", (req, res) => { 
    res.render("sell", { title: "Sell" });
});

app.post("/sell/submit", async (req, res) => {
    //retrieve values from submitted POST form
    let status = req.body.status;
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;
    let city = req.body.city;
    let imageUrl = req.body.imageUrl;
    let title = req.body.title;
    let price = req.body.price;
    let size = req.body.size;
    let style = req.body.style;
    let description = req.body.description;
    let newCostume = {
      "status": status,
      "firstName": firstName,
      "lastName": lastName,
      "email": email,
      "city": city,
      "imageUrl": imageUrl,
      "title": title,
      "price": price,
      "size": size,
      "style": style,
      "description": description
    };
    // console.log("New costume: ", newCostume);
    await addCostume(newCostume);
    res.redirect("/costumes");
  });

//route to admin costumes page
app.get("/admin/costumes", async (req, res) => { 
  let costumes = await getAllCostumes();
  res.render("admin-costumes", { title: "Costumes", costumes: costumes });
});

//route to admin single costume page
app.get("/admin/costumes/costume", async (req, res) => { 
  if (req.query.costumeId) {
      let costumeToGet = await getSingleCostume(req.query.costumeId); 
      res.render("admin-costume", { title: "Costume", costume: costumeToGet });
    } else { 
      res.redirect("/admin/costumes");
    } 
});

//route to admin edit costume page
app.get("/admin/costume/edit", async (req, res) => { 
  if (req.query.costumeId) {
    let costumeToEdit = await getSingleCostume(req.query.costumeId);
    res.render("admin-edit", { title: "Edit costume", editCostume: costumeToEdit });
    } else { 
      res.redirect("/admin/costumes");
    } 
  });

app.post("/admin/costume/edit/submit", async (req, res) => {
  let id = req.body.costumeId;
  let idFilter = {_id: new ObjectId(String(id))};
  let status = req.body.status;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let email = req.body.email;
  let city = req.body.city;
  let imageUrl = req.body.imageUrl;
  let title = req.body.title;
  let price = req.body.price;
  let size = req.body.size;
  let style = req.body.style;
  let description = req.body.description;
  let costume = {
    "status": status,
    "firstName": firstName,
    "lastName": lastName,
    "email": email,
    "city": city,
    "imageUrl": imageUrl,
    "title": title,
    "price": price,
    "size": size,
    "style": style,
    "description": description
  };
  await editCostume(idFilter, costume);
  res.redirect("/admin/costumes");
});

app.get("/admin/costume/delete", async (req, res) => {
  let id = req.query.costumeId;
  await deleteCostume(id);
  res.redirect("/admin/costumes");
});

//set up server listening
app.listen(port, () => {
console.log(`Listening on http://localhost:${port}`);
});

//MONGODB FUNCTIONS
async function connection() {
  db = client.db("CostumeConnectionsDb");
  return db;
}

//Function to select all documents in the costumes collection that have been approved.
async function getApprovedCostumes() {
  db = await connection();
  let results = db.collection("costumes").find({status: "approved"});
  let res = await results.toArray();
  return res;
}

//Function to select all documents in the costumes collection.
async function getAllCostumes() {
  db = await connection();
  let results = db.collection("costumes").find({});
  let res = await results.toArray();
  return res;
}

//Function to retrieve a single document from costumes by _id
async function getSingleCostume(id){
    db = await connection();
    const costumeId = { _id: new ObjectId(String(id)) };
    const result = await db.collection("costumes").findOne(costumeId); 
    return result;
}

//Function to insert a costume document
async function addCostume(costumeData) {
    db = await connection();
    let status = await db.collection("costumes").insertOne(costumeData);
    // console.log("costume added");
  }

//Function to delete a costume document
async function deleteCostume(id) {
  db = await connection();
  const costumeDeleteId = { _id: new ObjectId(String(id)) };
  const result = await db.collection("costumes").deleteOne(costumeDeleteId);
  if (result.deletedCount == 1){
    console.log("delete successful");
  }
}

//Function to update a costume document
async function editCostume(filter, costume){
  db = await connection();
  const updateCostume = {
    $set: {
      "status": costume.status,
      "firstName": costume.firstName,
      "lastName": costume.lastName,
      "email": costume.email,
      "city": costume.city,
      "imageUrl": costume.imageUrl,
      "title": costume.title,
      "price": costume.price,
      "size": costume.size,
      "style": costume.style,
      "description": costume.description
    },
  };
  const result = await db.collection("costumes").updateOne(filter, updateCostume);
}