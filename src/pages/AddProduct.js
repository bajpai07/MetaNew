import { useState } from "react";
import api from "../api/api";

export default function AddProduct() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const addProduct = async () => {
    try {
      await api.post("/seller/products", {
        name,
        basePrice: price,
        image: "https://picsum.photos/300",
        model3dUrl: "/models/chair.glb",
      });
      alert("Product added");
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div>
      <h2>Add Product</h2>
      <input placeholder="Name" onChange={e => setName(e.target.value)} />
      <input placeholder="Price" onChange={e => setPrice(e.target.value)} />
      <button onClick={addProduct}>Add</button>
    </div>
  );
}
