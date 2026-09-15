import { useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const addProduct = async () => {
    try {
      await api.post("/seller/products", {
        name,
        basePrice: price,
        image: "https://picsum.photos/300",
        model3dUrl: "/models/chair.glb"
      });
      toast.success("Added to the catalogue");
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't add that piece");
    }
  };

  return (
    <div className="on-paper page gutter" style={{ paddingTop: "calc(var(--nav-h) + 40px)" }}>
      <h1 className="display display-l" style={{ marginBottom: "32px" }}>
        Add a piece
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "26px", maxWidth: "380px" }}>
        <div>
          <label className="meta" htmlFor="ap-name" style={{ display: "block" }}>Name</label>
          <input id="ap-name" className="field" onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className="meta" htmlFor="ap-price" style={{ display: "block" }}>Price in ₹</label>
          <input id="ap-price" className="field" type="number" onChange={(e) => setPrice(e.target.value)} />
        </div>

        <button onClick={addProduct} className="btn btn-bone" style={{ width: "100%", marginTop: "8px" }}>
          Add
        </button>
      </div>
    </div>
  );
}
