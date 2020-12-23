const express = require("express")
const listEndpoints = require("express-list-endpoints")
const productsRouter = require("./products")
const cartRouter = require("./cart")
var cors = require('cors')
const {
  badRequestHandler,
  notFoundHandler,
  genericErrorHandler,
} = require("./errorHandlers")
const {join} = require("path")

const publicFolderPath = join(__dirname, "../public");
const server = express()
server.use(express.static(publicFolderPath));
server.use(cors())

const port = process.env.PORT || 3001

server.use(express.json())
server.use("/products", productsRouter)
server.use("/cart", cartRouter)

server.use(badRequestHandler)
server.use(notFoundHandler)
server.use(genericErrorHandler)

console.log(listEndpoints(server))

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})