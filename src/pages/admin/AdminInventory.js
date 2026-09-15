import { useEffect, useState } from "react";
import axios from "axios";
import { getProducts } from "../../api/productService";
import toast from "react-hot-toast";
import { Close } from "../../components/Marks";
import { API_BASE } from '../../config/api';

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
        description: "Added from the administration panel."
      };

      await axios.post(
        `${API_BASE}/api/products`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Added to the catalogue");
      setIsModalOpen(false);

      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't add that piece");
    }
  };

  if (loading) {
    return <p className="label" style={{ color: "var(--paper-ash)" }}>Loading catalogue</p>;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "20px",
          marginBottom: "32px",
          flexWrap: "wrap"
        }}
      >
        <h1 className="display display-l">Inventory</h1>
        <button onClick={() => setIsModalOpen(true)} className="textlink">
          Add a piece
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--paper-veil)" }}>
              {["", "Piece", "Category", "Price", ""].map((h, i) => (
                <th
                  key={i}
                  className="label"
                  style={{
                    textAlign: i === 4 ? "right" : "left",
                    color: "var(--paper-ash)",
                    padding: "0 12px 14px 0",
                    fontWeight: 500
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} style={{ borderBottom: "1px solid var(--paper-veil)" }}>
                <td style={{ padding: "14px 12px 14px 0", width: "52px" }}>
                  <img
                    src={p.image}
                    alt=""
                    style={{ width: "38px", height: "50px", objectFit: "cover" }}
                  />
                </td>
                <td style={{ padding: "14px 12px 14px 0", fontSize: "var(--t-s)" }}>{p.name}</td>
                <td style={{ padding: "14px 12px 14px 0", fontSize: "var(--t-s)", color: "var(--paper-ash)" }}>
                  {p.category}
                </td>
                <td style={{ padding: "14px 12px 14px 0", fontSize: "var(--t-s)" }}>
                  ₹{Number(p.price || 0).toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "14px 0", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="label" style={{ color: "var(--paper-ash)", marginRight: "18px", minHeight: "44px" }}>
                    Edit
                  </button>
                  <button className="label" style={{ color: "var(--paper-ash)", minHeight: "44px" }}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(14,12,11,0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000
          }}
        >
          <div
            className="on-paper"
            style={{ width: "100%", maxWidth: "440px", padding: "34px 32px", position: "relative", maxHeight: "90vh", overflowY: "auto" }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
              style={{ position: "absolute", top: "20px", right: "20px", padding: "10px", margin: "-10px" }}
            >
              <Close size={15} />
            </button>

            <h2 className="display display-m" style={{ marginBottom: "28px" }}>
              Add a piece
            </h2>

            <form onSubmit={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
              <div>
                <label className="meta" htmlFor="inv-name" style={{ display: "block" }}>Name</label>
                <input
                  id="inv-name"
                  className="field"
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="meta" htmlFor="inv-cat" style={{ display: "block" }}>Category</label>
                <select
                  id="inv-cat"
                  className="field"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                  <option value="Beauty">Beauty</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label className="meta" htmlFor="inv-price" style={{ display: "block" }}>Price in ₹</label>
                  <input
                    id="inv-price"
                    className="field"
                    required
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="meta" htmlFor="inv-stock" style={{ display: "block" }}>Stock</label>
                  <input
                    id="inv-stock"
                    className="field"
                    required
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="meta" htmlFor="inv-image" style={{ display: "block" }}>Image URL</label>
                <input
                  id="inv-image"
                  className="field"
                  required
                  type="text"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>

              <div>
                <label className="meta" htmlFor="inv-model" style={{ display: "block" }}>
                  3D model URL — optional, feeds the try-on engine
                </label>
                <input
                  id="inv-model"
                  className="field"
                  type="text"
                  placeholder=".glb"
                  value={formData.modelUrl}
                  onChange={(e) => setFormData({ ...formData, modelUrl: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: "1px", marginTop: "10px" }}>
                <button type="submit" className="btn btn-bone" style={{ flex: 1 }}>
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-quiet"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
