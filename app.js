const express = require("express");
const app = express();
const port = 3000;
const stream = require("stream");
const sharp = require("sharp");
const nodeHtmlToImage = require("node-html-to-image");
const font2base64 = require("node-font2base64");
const path = require("path");
const bodyParser = require("body-parser");

const font = font2base64.encodeToDataUrlSync("./NanumPenScript-Regular.ttf");

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.post("/", async (req, res) => {
  let { text = "" } = req.body;
  const base = new stream.PassThrough();
  const width = 698;
  const height = 948;
  text = text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, "$1" + "<br/>" + "$2"); // "Medium Text" "Short"

  const html = `
    <html style="width:${width};height:${height};">
        <head>
          <style>
              body {
                line-height: 25px;
              }
              @font-face {
                  font-family: 'Nanum';
                  src: url(${font}) format('woff2');
              }
              ol,ul {
                margin: 0 0 0 -20px;
              }
              li {
                margin: 0;
                padding: 0;
              }
          </style>
        </head>
        <body>
          <div style="font-style: normal;font-weight: normal;font-size: 18px;letter-spacing: 0.05em;font-family:Nanum;opacity:0.8;height:${height};overflow:hidden">
          ${text}
          </div>
        </body>
    </html>
  `;

  const label = await nodeHtmlToImage({ html, quality: 100 });

  const overlay = await sharp("overlay.jpeg")
    .resize(727, 1084, {
      fit: "fill",
    })
    .toBuffer();

  let image = await sharp("template.png")
    .composite([
      {
        input: label,
        top: 81,
        left: 20,
        blend: "multiply",
      },
      {
        input: overlay,
        top: 0,
        left: 0,
        blend: "multiply",
      },
    ])
    .png({ quality: 100 });

  image.pipe(base);
  res.setHeader("Content-Type", "image/png");
  base.pipe(res);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
