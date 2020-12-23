const express = require("express")
const { check, validationResult } = require("express-validator")
const uniqid = require("uniqid")
const multer = require("multer");
const { getProducts, writeProducts } = require("../lib/utilities")
const fs = require("fs")
const {writeFile,createReadStream} = require("fs-extra")
const path = require("path")
const productsRouter = express.Router()
const upload = multer({});

const productsValidation = [
  check("name").exists().withMessage("Name is required!"),
  check("brand").exists().withMessage("Brand is required!"),
]

const reviewsValidation = [
  check("rate").exists().withMessage("Rate is required!"),
  check("comment").exists().withMessage("Comment is required!"),
]

const fileReader = (file) => {
  const myPath = path.join(__dirname, file);
  const myFileAsBuffer = fs.readFileSync(myPath);
  const fileAsString = myFileAsBuffer.toString();
  return JSON.parse(fileAsString);
};

//fetch all products -GET
productsRouter.get("/", async (req, res, next) => {
  try {
    const products = await getProducts()

    if (req.query && req.query.category) {
      const filteredProducts = products.filter(
        product =>
        product.hasOwnProperty("category") &&
        product.category === req.query.category
      )
      res.send(filteredProducts)
    } else {
      res.send(products)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

//fetch a specific product -GET
productsRouter.get("/:productId", async (req, res, next) => {
  try {
    const products = await getProducts()

    const productFound = products.find(
      product => product._id === req.params.productId
    )

    if (productFound) {
      res.send(productFound)
    } else {
      const err = new Error()
      err.httpStatusCode = 404
      next(err)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }
})

//add a new product -POST
productsRouter.post("/", productsValidation, async (req, res, next) => {
  try {
    const validationErrors = validationResult(req)

    if (!validationErrors.isEmpty()) {
      const error = new Error()
      error.httpStatusCode = 400
      error.message = validationErrors
      console.log(error.message)
      next(error)
    } else {
      const products = await getProducts()
      const newproduct = {
        ...req.body,
        _id: uniqid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        reviews: [],
      }
      products.push(newproduct)
      await writeProducts(products)
      res.status(201).send(newproduct)
    }
  } catch (error) {
    console.log(error)
    next(error)
  }

})

//upload an image for a specific product -POST
const productFolderPath = path.join(__dirname, "../../public/img/products")
productsRouter.post("/:id/upload", upload.single("productPhoto"), async (req, res, next) => {
  try {
    const productfile = fileReader("products.json");

    await writeFile(
      path.join(productFolderPath, req.file.originalname),
      req.file.buffer
    );
    const filteredFile = productfile.filter((product) => product._id !== req.params.id);
    const product = await productfile.filter((product) => product._id === req.params.id);
    product[0].image = `http://localhost:3001/img/products/${req.file.originalname.toString()}`;
    console.log(product[0].image)
    filteredFile.push(product[0]);
    fs.writeFileSync(path.join(__dirname, "products.json"), JSON.stringify(filteredFile));
    res.send("added");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

//edit a specific product -PUT
productsRouter.put(
  "/:productId",
  productsValidation,
  async (req, res, next) => {
    try {
      const validationErrors = validationResult(req)

      if (!validationErrors.isEmpty()) {
        const error = new Error()
        error.httpStatusCode = 400
        error.message = validationErrors
        next(error)
      } else {
        const products = await getProducts()
        const productIndex = products.findIndex(
          product => product._id === req.params.productId
        )
        if (productIndex !== -1) {
          const updatedProducts = [
            ...products.slice(0, productIndex),
            {
              ...products[productIndex],
              ...req.body
            },
            ...products.slice(productIndex + 1),
          ]
          await writeProducts(updatedProducts)
          res.send(updatedProducts)
        } else {
          const err = new Error()
          err.httpStatusCode = 404
          next(err)
        }
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)

//remove a specific product -DELETE
productsRouter.delete("/:productId", async (req, res, next) => {
  try {
    const products = await getProducts()

    const productFound = products.find(
      product => product._id === req.params.productId
    )

    if (productFound) {
      const filteredProducts = products.filter(
        product => product._id !== req.params.productId
      )

      await writeProducts(filteredProducts)
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

//fetch all reviews for a specific product -GET
productsRouter.get("/:productId/reviews", async (req, res, next) => {
  try {
    const products = await getProducts()

    const productFound = products.find(
      product => product._id === req.params.productId
    )

    if (productFound) {
      res.send(productFound.reviews)
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

//fetch a specific review -GET
productsRouter.get("/:productId/reviews/:reviewId", async (req, res, next) => {
  try {
    const products = await getProducts()

    const productFound = products.find(
      product => product._id === req.params.productId
    )

    if (productFound) {
      const reviewFound = productFound.reviews.find(
        review => review._id === req.params.reviewId
      )
      if (reviewFound) {
        res.send(reviewFound)
      } else {
        const error = new Error()
        error.httpStatusCode = 404
        next(error)
      }
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

//add a new review for a specific product -POST
productsRouter.post(
  "/:productId/reviews",
  reviewsValidation,
  async (req, res, next) => {
    try {
      const products = await getProducts()

      const productIndex = products.findIndex(
        product => product._id === req.params.productId
      )
      if (productIndex !== -1) {
        products[productIndex].reviews.push({
          ...req.body,
          _id: uniqid(),
          createdAt: new Date(),
        })
        await writeProducts(products)
        res.status(201).send(products)
      } else {
        const error = new Error()
        error.httpStatusCode = 404
        next(error)
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)

//update a specific review for a product -PUT
productsRouter.put(
  "/:productId/reviews/:reviewId",
  reviewsValidation,
  async (req, res, next) => {
    try {
      const products = await getProducts()

      const productIndex = products.findIndex(
        product => product._id === req.params.productId
      )

      if (productIndex !== -1) {
        const reviewIndex = products[productIndex].reviews.findIndex(
          review => review._id === req.params.reviewId
        )

        if (reviewIndex !== -1) {
          const previousReview = products[productIndex].reviews[reviewIndex]

          const updateReviews = [
            ...products[productIndex].reviews.slice(0, reviewIndex),
            {
              ...previousReview,
              ...req.body,
              updatedAt: new Date()
            },
            ...products[productIndex].reviews.slice(reviewIndex + 1),
          ]
          products[productIndex].reviews = updateReviews
          await writeProducts(products)
          res.send(products)
        } else {
          console.log("Review not found")
        }
      } else {
        console.log("Product not found")
      }
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)

//remove a specific review for a product -DELETE
productsRouter.delete(
  "/:productId/reviews/:reviewId",
  async (req, res, next) => {
    try {
      const products = await getProducts()

      const productIndex = products.findIndex(
        product => product._id === req.params.productId
      )

      if (productIndex !== -1) {
        products[productIndex].reviews = products[productIndex].reviews.filter(
          review => review._id !== req.params.reviewId
        )

        await writeProducts(products)
        res.send(products)
      } else {}
    } catch (error) {
      console.log(error)
      next(error)
    }
  }
)


module.exports = productsRouter