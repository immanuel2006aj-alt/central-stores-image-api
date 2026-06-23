require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

/* Same product image repeated API call avoid */
const imageCache = new Map();

/* Product-wise better search keywords */
const searchKeywords = {
  "Ponni Boiled Rice": "ponni boiled rice grains",
  "Ponni Raw Rice": "raw rice grains",
  "Basmati Rice": "basmati rice grains",
  "Jeera Samba Rice": "jeera samba rice",
  "Idli Rice": "idli rice",
  "Sona Masoori Rice": "sona masoori rice",
  "Brown Rice": "brown rice grains",
  "Red Rice": "red rice grains",
  "Wheat Flour": "wheat flour",
  "Maida Flour": "all purpose flour",
  "Ragi Flour": "ragi flour",
  "Rice Flour": "rice flour",
  "Gram Flour Besan": "besan flour",
  "Corn Flour": "corn flour",
  "Aval Poha": "poha flattened rice",

  "Toor Dal": "toor dal yellow lentils",
  "Urad Dal Whole": "whole urad dal",
  "Urad Dal Split": "split urad dal",
  "Moong Dal": "yellow moong dal",
  "Chana Dal": "chana dal",
  "Masoor Dal": "masoor dal red lentils",
  "Green Gram": "green gram mung beans",
  "Black Chana": "black chickpeas kala chana",
  "White Chana": "white chickpeas",
  "Rajma": "rajma kidney beans",
  "Cowpeas": "cowpeas beans",
  "Horse Gram": "horse gram lentils",

  "Sunflower Oil": "sunflower cooking oil bottle",
  "Groundnut Oil": "groundnut oil bottle",
  "Gingelly Oil": "sesame oil bottle",
  "Coconut Oil": "coconut oil bottle",
  "Mustard Oil": "mustard oil bottle",
  "Cow Ghee": "ghee jar",

  "Turmeric Powder": "turmeric powder spice",
  "Chilli Powder": "red chilli powder spice",
  "Coriander Powder": "coriander powder spice",
  "Garam Masala": "garam masala spice",
  "Sambar Powder": "sambar powder spice",
  "Rasam Powder": "rasam powder spice",
  "Cumin Seeds": "cumin seeds spice",
  "Mustard Seeds": "mustard seeds spice",
  "Black Pepper": "black pepper spice",
  "Cardamom": "cardamom spice",
  "Cloves": "cloves spice",
  "Cinnamon": "cinnamon sticks spice",

  "Iodised Salt": "salt bowl",
  "White Sugar": "white sugar bowl",
  "Brown Sugar": "brown sugar",
  "Jaggery": "jaggery",
  "Tamarind": "tamarind",
  "Tea Powder": "tea leaves",
  "Coffee Powder": "coffee powder",
  "Papad": "papad indian food",
  "Vermicelli": "vermicelli pasta",

  "Marie Biscuits": "biscuits",
  "Glucose Biscuits": "biscuits",
  "Cream Biscuits": "cream biscuits",
  "Mixture": "indian mixture snack",
  "Murukku": "murukku indian snack",
  "Potato Chips": "potato chips",
  "Banana Chips": "banana chips",
  "Noodles": "instant noodles",
  "Instant Pasta": "instant pasta",

  "Filter Coffee": "south indian filter coffee",
  "Health Drink": "malted health drink",
  "Malted Drink": "malted drink",
  "Lemon Drink Powder": "lemon drink",
  "Orange Drink Powder": "orange drink",
  "Rose Milk Mix": "rose milk",
  "Badam Drink Mix": "badam milk",
  "Soft Drink": "soft drink bottle",
  "Packaged Drinking Water": "drinking water bottle",

  "Bath Soap": "bath soap bar",
  "Washing Soap": "laundry soap bar",
  "Detergent Powder": "detergent powder",
  "Dishwash Bar": "dishwashing soap bar",
  "Dishwash Liquid": "dishwashing liquid bottle",
  "Floor Cleaner": "floor cleaner bottle",
  "Toilet Cleaner": "toilet cleaner bottle",
  "Hand Wash": "hand wash bottle",
  "Toothpaste": "toothpaste tube",
  "Toothbrush": "toothbrush",
  "Match Box": "matchbox",
  "Mosquito Coil": "mosquito coil",
  "Garbage Bags": "garbage bags roll",
  "Aluminium Foil": "aluminium foil roll"
};

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Central & Stores Image API is running"
  });
});

app.get("/api/product-image", async (req, res) => {
  try {
    const product = String(req.query.product || "").trim();
    const category = String(req.query.category || "").trim();

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product name is required"
      });
    }

    if (!PEXELS_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "PEXELS_API_KEY missing in Render environment variables"
      });
    }

    const cacheKey = `${product}|${category}`.toLowerCase();

    if (imageCache.has(cacheKey)) {
      return res.json({
        success: true,
        image: imageCache.get(cacheKey),
        cached: true
      });
    }

    const keyword = searchKeywords[product] || `${product} grocery product`;
    const apiUrl =
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}` +
      `&per_page=5&orientation=square`;

    const pexelsResponse = await fetch(apiUrl, {
      headers: {
        Authorization: PEXELS_API_KEY
      }
    });

    if (!pexelsResponse.ok) {
      throw new Error(`Pexels API error: ${pexelsResponse.status}`);
    }

    const data = await pexelsResponse.json();

    if (!data.photos || data.photos.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No suitable image found"
      });
    }

    /* Product name base panni different result select pannum */
    const productNumber = product
      .split("")
      .reduce((total, char) => total + char.charCodeAt(0), 0);

    const selectedPhoto = data.photos[productNumber % data.photos.length];

    const imageUrl =
      selectedPhoto.src.large ||
      selectedPhoto.src.medium ||
      selectedPhoto.src.landscape;

    imageCache.set(cacheKey, imageUrl);

    return res.json({
      success: true,
      image: imageUrl,
      cached: false
    });

  } catch (error) {
    console.error("Image API error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch product image"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Central & Stores Image API running on port ${PORT}`);
});
