import Product from "../models/Product.js";

/**
 * =========================
 * PUBLIC: Get all products
 * =========================
 */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().lean();

    res.json(
      products.map(p => ({
        _id: p._id,
        name: p.name,
        image: p.image,
        price: Number(p.currentPrice ?? p.basePrice),

        // ✅ ADD THIS LINE
        modelUrl: p.modelUrl || null
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * =========================
 * PUBLIC: Get product by ID
 * =========================
 */
export const getProductById = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Product not found" });

    res.json({
      _id: p._id,
      name: p.name,
      description: p.description,
      category: p.category,
      image: p.image,
      price:
        typeof p.currentPrice === "number"
          ? p.currentPrice
          : typeof p.basePrice === "number"
          ? p.basePrice
          : 0,
      stock: p.stock,
      model3dUrl: p.model3dUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * =========================
 * SELLER: Create product
 * =========================
 */
export const createProduct = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can add products" });
    }

    const { name, description, image, basePrice, stock } = req.body;

    if (!name || !image || basePrice == null) {
      return res.status(400).json({
        message: "name, image and basePrice are required"
      });
    }

    const price = Number(basePrice);

    const product = await Product.create({
      name,
      description,
      image,

      // ✅ REQUIRED FIELD
      price,

      basePrice: price,
      currentPrice: price,
      stock: Number(stock) || 0,
      sellerId: req.user.id
    });

    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: err.message });
  }
};




/**
 * =========================
 * SELLER: Get own products
 * =========================
 */
export const getSellerProducts = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "seller") {
      return res.status(403).json({ message: "Access denied" });
    }

    const products = await Product.find({
      sellerId: req.user.id,
    }).lean();

    const formatted = products.map((p) => ({
      ...p,
      price: p.currentPrice ?? p.basePrice ?? 0,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch seller products" });
  }
};
