const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const { createServer } = require("http");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://chat-application-client-psi.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
app.use(
  cors({
    origin: "https://chat-application-client-psi.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
let users = [];
io.on("connection", (socket) => {
  socket.on('user', (s)=>{
    users.push({socketId : socket.id, email : s})
  })
  socket.on('message', (data)=>{

    const ids = users.find((item)=> data.reciverE === item.email);
    const ids2 = users.find((item)=> data.senderId === item.email);

    io.to(ids.socketId).to(ids2.socketId).emit('addMsg', data)
  })
  socket.on('disconnect', ()=>{
    const activeUser = users.filter((item)=> item.socketId !== socket.id);
    users = activeUser
  })
});


const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://chat-app-project:4jqAVQNuufuUd6mR@datafind.xfgov3s.mongodb.net/?retryWrites=true&w=majority&appName=datafind`;

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
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // code start here

    const usersCollections = client.db("chat-app-project").collection("users");
    const conversationsCollections = client
      .db("chat-app-project")
      .collection("conversations");
    const messageCollections = client
      .db("chat-app-project")
      .collection("message");

    app.get("/", (req, res) => {
      res.send("Hello World");
    });

    app.post("/createUser", async (req, res) => {
      try {
        const users = req.body;
        const result = await usersCollections.insertOne(users);
        return res.send(result);
      } catch (err) {
        return res.send("error from usercreate router");
      }
    });

    app.post("/conversations", async (req, res) => {
      const { senderId, receverId } = req.body;
      const result = await conversationsCollections.insertOne({
        member: [senderId, receverId],
      });
      res.send(result);
    });

    app.get("/findReciver/:email", async (req, res) => {
      const email = req.params.email;

      const result = await conversationsCollections
        .find({ member: { $in: [email] } })
        .toArray();
      const conversationData = await Promise.all(
        result.map(async (receiver) => {
          let alluserData = receiver.member.find((user) => user !== email);
          const query = { email: alluserData };
          const users = await usersCollections.findOne(query);
          return { user: users, conversionid: receiver._id };
        })
      );
      res.send(conversationData);
    });

    app.post("/message", async (req, res) => {
      const result = await messageCollections.insertOne(req.body);
      res.send(result);
    });

    app.get("/message/:ids", async (req, res) => {
      const result = await messageCollections
        .find({ conversionid: req.params.ids })
        .toArray();
      res.send(result);
    });

    app.get('/getSingaluser/:email', async(req, res)=>{

      const result = await usersCollections.findOne({email : req.params.email});
      res.send(result)
    })
    app.get("/getAllUser/:email", async (req, res) => {
      const result = await usersCollections.find().toArray();
      const findialdata = result.filter(
        (item) => item.email !== req.params.email
      );
      res.send(findialdata);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

server.listen(7000, (err) => {
  console.log(`this post is run 7000 port`);
});
