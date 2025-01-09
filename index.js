const express = require("express");
const app = express();
var jwt = require("jsonwebtoken");
require("dotenv").config();
const cors = require("cors");
const port = process.env.port || 5000;

//middlewire
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tkglq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Get the database and collection on which to run the operation
    const menuCollection = client.db("bistroDb").collection("menu");
    const reviewCollection = client.db("bistroDb").collection("reviews");
    const cartCollection = client.db("bistroDb").collection("carts");
    const userCollection = client.db("bistroDb").collection("users");
    // Jwt releted apis
    app.post("/jwt", async (req, res) => {
      const user = req.body; //payload
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      }); //first payload,secret,option expire time
      res.send({ token });
    });
    // app.post("/jwt", async (req, res) => {
    //   const user = req.body; //payload
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "1h",
    //   }); //first payload,secret,option expire time
    //   res.send({token});
    // });

    //middlewares
    const verifyToken = (req, res, next) => {
      console.log("inside verify token", req.headers);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
    };

    // user releted api
    app.post(`/users`, async (req, res) => {
      const user = req.body;
      // insert email if user dosent exists:
      // you can do this many ways(1.email unique,2.upsert,3.simple checking)
      const query = { email: user.email }; //we are tring to find the user in the data base by his mail
      const existingUser = await userCollection.findOne(query); //here we are searching for him
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      // if you find the user by doing the query then retrun him with message and the set the insertedId null
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.get("/users", verifyToken, async (req, res) => {
      // console.log(req.headers);
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // admin creation
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      try {
        const filter = { _id: new ObjectId(id) };
        const updatedDoc = {
          $set: {
            // which field you want to set and what you want to set
            role: "admin",
          },
        };
        const result = await userCollection.updateOne(filter, updatedDoc);
        res.send(result);
      } catch (error) {
        res.status(400).send({ error: "Invalid User ID" });
      }
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // menu's releted apis
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });
    // review
    app.get("/review", async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });
    // cart
    app.post("/carts", async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
    app.delete("/carts/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await cartCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("boss is sitting");
});

app.listen(port, () => {
  console.log(`Bistro boss is sitting on port${port}`);
});
