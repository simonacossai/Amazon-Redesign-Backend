  const {writeFile} = require("fs-extra")
  const {join} = require("path")
  const PdfPrinter = require("pdfmake")
  const fs = require("fs-extra")

  const readFile = async path => {
      const buffer = await fs.readFile(path)
      const text = buffer.toString()
      return JSON.parse(text)
  }

  const buildPDFAsync = async pdfStream =>
      new Promise((resolve, reject) => {
          const chunks = []
          pdfStream.on("data", chunk => {
              chunks.push(chunk)
          })
          pdfStream.on("error", err => reject(err))
          pdfStream.on("end", () => resolve(Buffer.concat(chunks)))
          pdfStream.end()
      })

  const generatePdf = async () => {
      try {
          const fonts = {
              Roboto: {
                  normal: "Helvetica",
              },
          }
          const items = join(__dirname, "..", "..", "cart", "cart.json")
          const cart = await readFile(items)
          const docDefinition = {
              content: [
                  "Your order:",
                  {
                      ul: [
                          ` ${cart.map((e)=>
                    `${e.name} `
                  )}`
                      ]
                  },
                  "Please don't hesitate to contact us in case of problems or doubts. Thanks for choosing us",
              ],
          }
          const printer = new PdfPrinter(fonts)
          const pdfDoc = printer.createPdfKitDocument(docDefinition)
          const pdfBuffer = await buildPDFAsync(pdfDoc)
          const path = join(__dirname, "ORDER.pdf")
          await writeFile(path, pdfBuffer)
          return path
      } catch (error) {
          console.log(error)
      }
  }

  module.exports = generatePdf