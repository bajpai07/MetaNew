import { useEffect, useState } from "react";
import axios from "axios";
import { getProducts } from "../../api/productService";
import toast from "react-hot-toast";

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Men",
    price: "",
    stock: "",
    image: "",
    modelUrl: ""
  });

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error("Failed to load inventory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  if (loading) return <div>Loading Global Catalog...</div>;

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        name: formData.name,
        category: formData.category,
        image: formData.image,
        model3dUrl: formData.modelUrl,
        basePrice: Number(formData.price),
        stock: Number(formData.stock),
        description: "Premium product added via Admin Terminal."
      };

      await axios.post("http://localhost:4000/api/products", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Product successfully pushed to Catalog!");
      setIsModalOpen(false);
      
      // refresh catalog
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add product");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #eaeaec", paddingBottom: "15px" }}>
        <h1 style={{ fontSize: "24px", color: "#282c3f", margin: 0 }}>Product Inventory</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{ background: "#FF3F6C", color: "white", border: "none", padding: "10px 20px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}
        >
          + Add New Product
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "#f9f9f9", borderBottom: "1px solid #eaeaec" }}>
            <tr>
              <th style={{ padding: "15px", textAlign: "left", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Visual</th>
              <th style={{ padding: "15px", textAlign: "left", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Title</th>
              <th style={{ padding: "15px", textAlign: "left", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Category</th>
              <th style={{ padding: "15px", textAlign: "left", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Price</th>
              <th style={{ padding: "15px", textAlign: "right", fontSize: "12px", color: "#7e818c", textTransform: "uppercase" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} style={{ borderBottom: "1px solid #f2f2f2" }}>
                <td style={{ padding: "15px" }}>
                  <img src={p.image} alt={p.name} style={{ width: "40px", height: "50px", objectFit: "cover", borderRadius: "4px" }} />
                </td>
                <td style={{ padding: "15px", fontWeight: "600", color: "#282c3f" }}>{p.name}</td>
                <td style={{ padding: "15px", color: "#535766" }}>{p.category}</td>
                <td style={{ padding: "15px", fontWeight: "bold", color: "#FF3F6C" }}>₹{p.price}</td>
                <td style={{ padding: "15px", textAlign: "right" }}>
                  <button style={{ background: "transparent", border: "1px solid #eaeaec", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", marginRight: "10px", fontSize: "12px" }}>Edit</button>
                  <button style={{ background: "#fff0f4", color: "#FF3F6C", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: "30px", borderRadius: "8px", width: "400px", maxWidth: "90%" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "20px", borderBottom: "1px solid #eaeaec", paddingBottom: "10px" }}>Add Product to Catalog</h2>
            
            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input required type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} />
              
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
                <option value="Beauty">Beauty</option>
              </select>

              <div style={{ display: "flex", gap: "10px" }}>
                <input required type="number" placeholder="Price (₹)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px", flex: 1 }} />
                <input required type="number" placeholder="Stock" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px", flex: 1 }} />
              </div>

              <input required type="text" placeholder="Image URL" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} />
              
              <input type="text" placeholder="AR Model URL (.glb) - Optional" value={formData.modelUrl} onChange={e => setFormData({...formData, modelUrl: e.target.value})} style={{ padding: "10px", border: "1px solid #20B2AA", borderRadius: "4px", outline: "none" }} />
              <small style={{ color: "#20B2AA", marginTop: "-10px", fontSize: "11px" }}>✨ Links directly into the Virtual Try-On Engine.</small>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" style={{ flex: 1, background: "#FF3F6C", color: "white", padding: "10px", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>Add Product</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, background: "#eaeaec", color: "#282c3f", padding: "10px", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
