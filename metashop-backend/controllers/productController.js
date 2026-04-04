import Product from "../models/Product.js";

/**
 * =========================
 * PUBLIC: Get all products
 * =========================
 */
export const getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;
    let filter = {};

    if (category && category !== "All") {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      
      filter.price = priceFilter;
    }

    const products = await Product.find(filter).lean();

    res.json(
      products.map(p => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        image: p.image,
        price: Number(p.price ?? p.currentPrice ?? p.basePrice ?? 0),
        modelUrl: p.modelUrl || null
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * =========================
 * PUBLIC: Search products
 * =========================
 */
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Query parameter 'q' is required" });
    }

    const regex = new RegExp(q, 'i'); // Case-insensitive regex
    
    // Search in name or category
    const products = await Product.find({
      $or: [
        { name: { $regex: regex } },
        { category: { $regex: regex } }
      ]
    }).lean();

    res.json(
      products.map(p => ({
        _id: p._id,
        name: p.name,
        category: p.category,
        image: p.image,
        price: Number(p.price ?? p.currentPrice ?? p.basePrice ?? 0),
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
      price: Number(p.price ?? p.currentPrice ?? p.basePrice ?? 0),
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
    // Admin middleware already verifies role, but keep a safety net
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can add products" });
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
 * ADMIN: Update product
 * =========================
 */
export const updateProduct = async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * =========================
 * ADMIN: Delete product
 * =========================
 */
export const deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
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

/**
 * =========================
 * PUBLIC: Get recommendations
 * =========================
 */
export const getRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = 3;

    // Get current product
    const currentProduct = await Product.findById(productId);

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        error: "Product not found"
      });
    }

    console.log("Getting recommendations for:", {
      id: productId,
      category: currentProduct.category,
      name: currentProduct.name
    });

    // Strategy 1: Same category, different product
    let recommendations = await Product.find({
      _id: { $ne: productId },
      category: currentProduct.category
    })
    .limit(limit)
    .select('name price mrp discount image category');

    // Strategy 2: If not enough same category, fill with other products
    if (recommendations.length < limit) {
      const existing = recommendations.map(r => r._id.toString());
      existing.push(productId);

      const fillProducts = await Product.find({
        _id: { $nin: existing }
      })
      .limit(limit - recommendations.length)
      .select('name price mrp discount image category');

      recommendations = [
        ...recommendations, 
        ...fillProducts
      ];
    }

    console.log("Recommendations found:", recommendations.length);

    return res.json({
      success: true,
      recommendations,
      basedOn: {
        category: currentProduct.category,
        name: currentProduct.name
      }
    });

  } catch (err) {
    console.error("Recommendations error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Could not fetch recommendations"
    });
  }
};
