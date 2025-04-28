const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Storage setup for product image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique name
  }
});
const upload = multer({ storage: storage });

// Temporary in-memory product storage
let products = [];

// Home Route
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API to Create Product
app.post('/api/product', upload.single('image'), async (req, res) => {
  const { name, description } = req.body;
  const image = `/uploads/${req.file.filename}`;

  const id = products.length + 1;

  const productUrl = `http://localhost:${PORT}/product/${id}`;

  // Generate QR code
  const qrCodePath = `/qrcode-${id}.png`;
  await QRCode.toFile(`public${qrCodePath}`, productUrl);

  const product = {
    id,
    name,
    description,
    image,
    qrCode: qrCodePath
  };

  products.push(product);

  res.json(product);
});

// Route to Display Product
app.get('/product/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).send('Product not found');
  }

  res.send(`
    <h1>${product.name}</h1>
    <img src="${product.image}" style="max-width:300px;"><br>
    <p>${product.description}</p>
  `);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
