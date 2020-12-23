const express = require("express")
const path = require("path")
const fs = require("fs-extra")
const generatePdf = require("../lib/pdf")
const sendEmailWithAttachment = require("../lib/email")
const router = express.Router()
const cartFilePath = path.join(__dirname, "cart.json")
const itemsFilePath = path.join(__dirname, "..", "products", "products.json")


const readFile = async path => {
  const buffer = await fs.readFile(path)
  const text = buffer.toString()
  return JSON.parse(text)
}

const writeFile = async content => await fs.writeFile(cartFilePath, JSON.stringify(content))

//get all the element in the cart -GET
router.get("/", async (req, res, next) => {
  res.send(await readFile(cartFilePath))
})

//add a new element to the cart -POST
router.post("/:id", async (req, res, next) => {
  try {
    const itemsList = await readFile(itemsFilePath)
    const item = itemsList.find(item => item._id === req.params.id)
    if (!item) {
      const error = new Error("Item not found")
      error.httpStatusCode = 404
      return next(error)
    }
    const currentCart = await readFile(cartFilePath)
    const itemAlreadyPresent = currentCart.find(item => item._id === req.params.id)
    if (itemAlreadyPresent) {
      const error = new Error("the item is already in the cart!")
      error.httpStatusCode = 400
      return next(error)
    }

    await writeFile([...currentCart, item])
    res.status(201).send()
  } catch (e) {
    console.log(e)
    next(e)
  }
})

//remove an element from the cart -DELETE
router.delete("/:id", async (req, res, next) => {
  try {
    const itemsList = await readFile(cartFilePath)

    const productFound = itemsList.find(
      product => product._id === req.params.id
    )

    if (productFound) {
      const filteredProducts = itemsList.filter(
        product => product._id !== req.params.id
      )

      await writeFile(filteredProducts)
      res.status(204).send()
    } else {
      const error = new Error()
      error.httpStatusCode = 404
      next(error)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

//send an email with the element in the cart -POST
router.post("/items/checkout", async (req, res, next) => {
  try {
    const cartItems = await readFile(cartFilePath)
    const path = await generatePdf(cartItems)
    const attachment = await fs.readFile(path)
    await sendEmailWithAttachment(attachment)
    await fs.remove(path)
    res.send("Email sent successfully!")
  } catch (error) {
    console.log(error)
    next(error)
  }
})

module.exports = router