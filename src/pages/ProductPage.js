import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProductById } from "../api/productService";
import { useCart } from "../context/CartContext";
import TryOnExperience from "../components/vton/TryOnExperience";
import SizeRecommendation from "../components/SizeRecommendation";
import { Back } from "../components/Marks";
import { clothLine, rupees } from "../utils/productCopy";
import toast from "react-hot-toast";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=800&q=80";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

/**
 * Full-bleed image, then a left-aligned information column held to a 34em
 * measure with a deep right margin. Sizes are plain text with a rule under the
 * chosen one — filled rounded squares read as a settings panel, not a shop.
 *
 * Two actions in the dock, never three. The wishlist button that used to sit
 * beside them is gone; saving lives on the image where it belongs.
 *
 * The image is 4:5 on a phone rather than 3:4. At 3:4 it was tall enough that
 * the name, the price and the cloth line all fell below the fold: opening a
 * product showed a photograph, a dock and nothing else, so the page read as
 * broken however complete the markup was. A shop states what a thing is called
 * and what it costs without being scrolled.
 */
export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFittingRoomOpen, setIsFittingRoomOpen] = useState(false);

  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeRec, setSizeRec] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [openSection, setOpenSection] = useState("details");
  const [triedWithoutSize, setTriedWithoutSize] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      window.scrollTo(0, 0);
      try {
        const found = await getProductById(id);
        if (found) {
          const originalPrice =
            found.originalPrice || Math.round(Number(found.price) * 1.5);
          const image = found.image || found.imageUrl || FALLBACK_IMAGE;
          setProduct({
            ...found,
            brand: found.brand || "Aiyaashi",
            category: found.category || "top",
            originalPrice,
            image,
            mrp: originalPrice,
            discount: Math.round((1 - found.price / originalPrice) * 100),
            images: found.images || [image]
          });
        }
      } catch (err) {
        console.error("PRODUCT FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddToBag = () => {
    toast.promise(addToCart(product._id), {
      loading: "Adding to bag",
      success: "Added to bag",
      error: "That didn't go through. Try again."
    });
  };

  if (loading) {
    return (
      <div className="page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <p className="label" style={{ color: "var(--ash)" }}>Loading</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page gutter" style={{ paddingTop: "calc(var(--nav-h) + 96px)" }}>
        <h1 className="display display-l" style={{ marginBottom: "10px" }}>
          This piece is no longer listed
        </h1>
        <p className="meta measure" style={{ marginBottom: "32px" }}>
          It may have sold out or been withdrawn from the collection.
        </p>
        <button className="textlink" onClick={() => navigate("/")}>
          Browse the collection
        </button>
      </div>
    );
  }

  const price = Number(product.price || 0);
  const reduced = product.mrp > price;
  const cloth = clothLine(product);

  const sections = [
    {
      key: "details",
      title: "Details",
      body: (
        <>
          <p className="measure" style={{ color: "var(--bone-dim)", marginBottom: "26px" }}>
            {product.description ||
              "Cut clean and worn easily — a piece built to sit at the front of the wardrobe rather than the back of it."}
          </p>
          {[
            ["Material", product.material || "Premium cotton"],
            ["Fit", product.fit || "Regular"],
            ["Care", "Machine wash cold"],
            ["Made in", "India"]
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "24px",
                padding: "13px 0",
                borderBottom: "1px solid var(--veil)",
                fontSize: "var(--t-s)"
              }}
            >
              <span style={{ color: "var(--ash)" }}>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </>
      )
    },
    {
      key: "delivery",
      title: "Delivery",
      body: (
        <dl className="measure" style={{ fontSize: "var(--t-s)" }}>
          {[
            ["Standard", "Three to five working days. Complimentary above ₹499."],
            ["Express", "One to two working days. ₹99."],
            ["On delivery", "Payment on delivery is available on every order."]
          ].map(([term, detail]) => (
            <div key={term} style={{ padding: "13px 0", borderBottom: "1px solid var(--veil)" }}>
              <dt style={{ marginBottom: "3px" }}>{term}</dt>
              <dd style={{ color: "var(--ash)" }}>{detail}</dd>
            </div>
          ))}
        </dl>
      )
    },
    {
      key: "returns",
      title: "Returns",
      body: (
        <p className="measure" style={{ color: "var(--bone-dim)", fontSize: "var(--t-s)" }}>
          Fourteen days to change your mind, no reason required. Every piece is
          checked before it ships, and refunds are issued within a day of the
          return reaching us.
        </p>
      )
    }
  ];

  return (
    <>
      <div className="has-dock pdp-layout" style={{ minHeight: "100vh" }}>
        {/* ── Image ── */}
        <div className="goods goods-hero">
          <img src={product.images?.[currentImage] || product.image} alt={product.name} />

          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            style={{
              position: "absolute",
              top: "16px",
              left: "var(--gutter)",
              width: "44px",
              height: "44px",
              marginLeft: "-13px",
              display: "flex",
              alignItems: "center",
              color: "var(--bone)",
              mixBlendMode: "difference",
              zIndex: 2
            }}
          >
            <Back />
          </button>

          <button
            onClick={() => setIsSaved((v) => !v)}
            className="label"
            style={{
              position: "absolute",
              top: "16px",
              right: "var(--gutter)",
              minHeight: "44px",
              display: "flex",
              alignItems: "center",
              color: "var(--bone)",
              mixBlendMode: "difference",
              zIndex: 2
            }}
          >
            {isSaved ? "Saved" : "Save"}
          </button>

          {product.images?.length > 1 && (
            <div
              style={{
                position: "absolute",
                bottom: "18px",
                left: "var(--gutter)",
                display: "flex",
                gap: "14px",
                zIndex: 2
              }}
            >
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  aria-label={`View image ${i + 1}`}
                  style={{
                    width: "26px",
                    height: "1px",
                    background: i === currentImage ? "var(--bone)" : "var(--veil-strong)",
                    transition: "background var(--d-micro) var(--ease-drape)"
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Information ── */}
        <div className="pdp-info gutter" style={{ paddingTop: "22px", maxWidth: "760px" }}>
          <p className="label" style={{ color: "var(--ash)", marginBottom: "10px" }}>
            {product.brand}
          </p>

          <h1 className="display display-l" style={{ marginBottom: "10px" }}>
            {product.name}
          </h1>

          <p style={{ fontSize: "var(--t-m)", letterSpacing: "0.04em", marginBottom: cloth ? "7px" : "28px" }}>
            {rupees(price)}
            {reduced && (
              <span style={{ marginLeft: "12px", fontSize: "var(--t-s)", color: "var(--ash)", textDecoration: "line-through" }}>
                {rupees(product.mrp)}
              </span>
            )}
          </p>

          {cloth && (
            <p className="meta measure" style={{ marginBottom: "28px" }}>
              {cloth}
            </p>
          )}

          <div className="rule" style={{ marginBottom: "28px" }} />

          {/* Sizes */}
          <div style={{ marginBottom: "34px" }}>
            <p className="label" style={{ color: "var(--ash)", marginBottom: "18px" }}>
              Size
              {sizeRec && (
                <span style={{ color: "var(--bone-dim)", marginLeft: "12px", textTransform: "none", letterSpacing: 0 }}>
                  We suggest {sizeRec.size}
                </span>
              )}
            </p>

            <div style={{ display: "flex", gap: "26px", flexWrap: "wrap" }}>
              {SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => { setSelectedSize(size); setTriedWithoutSize(false); }}
                  className="label"
                  style={{
                    minHeight: "44px",
                    color: selectedSize === size ? "var(--bone)" : "var(--ash)",
                    borderBottom:
                      selectedSize === size ? "1px solid var(--bone)" : "1px solid transparent",
                    transition: "color var(--d-micro) var(--ease-drape)"
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            {triedWithoutSize && !selectedSize && (
              <p className="meta" style={{ marginTop: "16px", color: "var(--bone)" }}>
                Choose a size first.
              </p>
            )}
          </div>

          <SizeRecommendation onRecommendation={setSizeRec} />

          {/* Disclosure */}
          <div style={{ marginTop: "34px" }}>
            {sections.map((section) => {
              const open = openSection === section.key;
              return (
                <div key={section.key} style={{ borderTop: "1px solid var(--veil)" }}>
                  <button
                    onClick={() => setOpenSection(open ? null : section.key)}
                    className="label"
                    aria-expanded={open}
                    style={{
                      width: "100%",
                      minHeight: "58px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: open ? "var(--bone)" : "var(--ash)"
                    }}
                  >
                    {section.title}
                    <span aria-hidden="true" style={{ fontSize: "15px", lineHeight: 1 }}>
                      {open ? "–" : "+"}
                    </span>
                  </button>
                  {open && <div style={{ paddingBottom: "30px" }}>{section.body}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Dock ── */}
      <div className="dock">
        <div className="dock-actions">
          <button className="dock-act" onClick={() => setIsFittingRoomOpen(true)}>
            See it on you
          </button>
          <button
            className="dock-act dock-act-lead"
            onClick={() => {
              if (!selectedSize) {
                setTriedWithoutSize(true);
                return;
              }
              handleAddToBag();
            }}
          >
            <span>Add to bag</span>
          </button>
        </div>
      </div>

      {product && (
        <TryOnExperience
          isOpen={isFittingRoomOpen}
          onClose={() => setIsFittingRoomOpen(false)}
          product={product}
          garmentImage={product.image}
          garmentDescription={`${product.brand} ${product.name} ${product.category}`}
          garmentCategory={product.category}
          garmentName={product.name}
        />
      )}
    </>
  );
}
