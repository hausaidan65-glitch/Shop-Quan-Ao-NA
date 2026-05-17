import React, { useEffect, useMemo, useState, useDeferredValue } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CreditCard,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UserPlus,
  X,
  Star,
  Trash2,
  Truck,
} from "lucide-react";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "";
const CART_KEY = "noir_atelier_cart_v5";
const USERS_KEY = "noir_atelier_users_v5";
const SESSION_KEY = "noir_atelier_session_v5";
const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n || 0,
  );
const styleFilters = [
  "Tất cả",
  "Outerwear",
  "Shirt",
  "Denim",
  "Dress",
  "T-shirt",
  "Skirt",
];

function setSeo({ title, description }) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "description";
    document.head.appendChild(meta);
  }
  meta.content = description;
}
function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function readSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}
function saveSession(user) {
  user
    ? localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    : localStorage.removeItem(SESSION_KEY);
}
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function App() {
  const [products, setProducts] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [cart, setCart] = useState(readCart);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState({ name: "home", slug: "" });
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(readSession);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authReason, setAuthReason] = useState("");
  const [pendingAdd, setPendingAdd] = useState(null);
  const deferredKeyword = useDeferredValue(keyword);

  useEffect(() => {
    setSeo({
      title: "Noir Atelier - Shop quần áo basic cao cấp, dễ phối",
      description: "Website bán quần áo basic",
    });
    setLoading(true);
    fetch(`${API}/api/products`)
      .then((r) => r.json())
      .then((data) =>
        setProducts(
          data.map((p) => ({ ...p, slug: p.slug || slugify(p.name) })),
        ),
      )
      .catch(() => setProducts([]))
      .finally(() => setTimeout(() => setLoading(false), 350));
  }, []);
  useEffect(() => saveCart(cart), [cart]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const text =
          `${p.name} ${p.category} ${p.description} ${p.material || ""} ${(p.colors || []).join(" ")} ${(p.sizes || []).join(" ")}`.toLowerCase();
        return (
          text.includes(deferredKeyword.trim().toLowerCase()) &&
          (category === "Tất cả" || p.category === category)
        );
      }),
    [products, deferredKeyword, category],
  );

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("show");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [view.name, filtered.length, loading]);

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 500000 || subtotal === 0 ? 0 : 25000;
  const discount = subtotal >= 800000 ? 50000 : 0;
  const total = subtotal + shipping - discount;

  function goHome() {
    setView({ name: "home", slug: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goProduct(slug) {
    setView({ name: "product", slug });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goCart() {
    setView({ name: "cart", slug: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function goCheckout() {
    if (!user) {
      setAuthReason("Đăng nhập để tiếp tục thanh toán đơn hàng của em.");
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    setView({ name: "checkout", slug: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function addToCartDirect(product, options = {}) {
    const size = options.size || product.sizes?.[0] || "Free size";
    const color = options.color || product.colors?.[0] || "Mặc định";
    const key = `${product.id}-${size}-${color}`;
    setCart((prev) => {
      const existed = prev.find((i) => i.key === key);
      if (existed)
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      return [
        ...prev,
        {
          key,
          id: product.id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: product.price,
          size,
          color,
          qty: 1,
        },
      ];
    });
    setToast(`Đã thêm ${product.name} vào giỏ`);
    setTimeout(() => setToast(""), 1800);
  }
  function addToCart(product, options = {}) {
    if (!user) {
      setPendingAdd({ product, options });
      setAuthReason("Đăng nhập hoặc đăng ký để thêm sản phẩm vào giỏ hàng.");
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    addToCartDirect(product, options);
  }
  function updateQty(key, qty) {
    setCart((prev) =>
      prev.map((i) => (i.key === key ? { ...i, qty: Math.max(1, qty) } : i)),
    );
  }
  function removeItem(key) {
    setCart((prev) => prev.filter((i) => i.key !== key));
  }
  function clearCart() {
    setCart([]);
  }
  function handleAuthSuccess(nextUser) {
    setUser(nextUser);
    saveSession(nextUser);
    setAuthOpen(false);
    setToast(`Xin chào ${nextUser.name}!`);
    setTimeout(() => setToast(""), 1800);
    if (pendingAdd) {
      const { product, options } = pendingAdd;
      setPendingAdd(null);
      addToCartDirect(product, options);
    }
  }
  function logout() {
    setUser(null);
    saveSession(null);
    setCart([]);
    setToast("Đã đăng xuất và làm mới giỏ hàng");
    setTimeout(() => setToast(""), 1800);
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Website có giỏ hàng local không?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Có. Giỏ hàng dùng localStorage nên dữ liệu vẫn còn khi người dùng tải lại trang trên cùng trình duyệt.",
        },
      },
      {
        "@type": "Question",
        name: "Noir Atelier có thanh toán thật không?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Đây là website demo cho bài tập nên phần thanh toán là giả lập, không thu tiền thật.",
        },
      },
      {
        "@type": "Question",
        name: "Website áp dụng AEO và AIEO ra sao?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Website dùng FAQ, câu trả lời ngắn, Product Schema, Organization Schema, sitemap.xml, robots.txt và llms.txt để công cụ tìm kiếm và AI dễ hiểu nội dung.",
        },
      },
    ],
  };
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Noir Atelier",
    url: window.location.origin,
    slogan: "Minimal clothes, maximum outfit.",
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={orgSchema} />
      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {authOpen && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          reason={authReason}
          onClose={() => {
            setAuthOpen(false);
            setPendingAdd(null);
          }}
          onSuccess={handleAuthSuccess}
        />
      )}
      <header className="header">
        <nav className="nav container">
          <button className="brand ghostButton" onClick={goHome}>
            <ShoppingBag size={22} />
            <span>Noir Atelier</span>
          </button>
          <button
            className="menuBtn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </button>
          <div className={`navLinks ${menuOpen ? "open" : ""}`}>
            <button onClick={goHome}>Trang chủ</button>
            <a
              href="#products"
              onClick={() => setView({ name: "home", slug: "" })}
            >
              Sản phẩm
            </a>
            <a href="#guide">Chọn size</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="authArea">
            {user ? (
              <button className="userPill" onClick={logout} title="Đăng xuất">
                <span>Hi, {user.name.split(" ")[0]}</span>
                <LogOut size={17} />
              </button>
            ) : (
              <button
                className="loginPill"
                onClick={() => {
                  setAuthReason(
                    "Đăng nhập để lưu giỏ hàng và thanh toán mượt hơn.",
                  );
                  setAuthMode("login");
                  setAuthOpen(true);
                }}
              >
                <LogIn size={17} />
                <span>Đăng nhập</span>
              </button>
            )}
            <button className="cartPill" onClick={goCart}>
              <ShoppingBag size={18} />
              <span>Giỏ</span>
              <b>{totalQty}</b>
              <small>{money(total)}</small>
            </button>
          </div>
        </nav>
      </header>

      <main>
        {view.name === "home" && (
          <Home
            products={filtered}
            allProducts={products}
            loading={loading}
            keyword={keyword}
            setKeyword={setKeyword}
            category={category}
            setCategory={setCategory}
            addToCart={addToCart}
            goProduct={goProduct}
          />
        )}
        {view.name === "product" && (
          <ProductDetail
            product={products.find((p) => p.slug === view.slug)}
            related={products.filter((p) => p.slug !== view.slug).slice(0, 3)}
            addToCart={addToCart}
            goProduct={goProduct}
            goCart={goCart}
            goBack={goHome}
            reviews={reviews}
            setReviews={setReviews}
          />
        )}
        {view.name === "cart" && (
          <CartPage
            cart={cart}
            updateQty={updateQty}
            removeItem={removeItem}
            clearCart={clearCart}
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
            total={total}
            goCheckout={goCheckout}
            goProduct={goProduct}
            goHome={goHome}
          />
        )}
        {view.name === "checkout" && (
          <CheckoutPage
            cart={cart}
            subtotal={subtotal}
            shipping={shipping}
            discount={discount}
            total={total}
            clearCart={clearCart}
            goHome={goHome}
          />
        )}
      </main>

      <footer className="footer">
        <div className="container footerGrid">
          <div>
            <b>Noir Atelier</b>
            <p>
              React + Node.js + Render. Có index.html, index.jsx, API sản phẩm,
              đăng nhập/đăng ký localStorage, giỏ hàng bảo vệ bằng login và nội
              dung tối ưu AEO/AIEO.
            </p>
          </div>
          <div>
            <span>robots.txt</span>
            <span>sitemap.xml</span>
            <span>llms.txt</span>
          </div>
        </div>
      </footer>
    </>
  );
}

function AuthModal({ mode, setMode, reason, onClose, onSuccess }) {
  const isLogin = mode === "login";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const name = form.name.trim();
    const users = readUsers();

    if (!email.includes("@"))
      return setError("Email chưa đúng định dạng. Ví dụ: hau@gmail.com");
    if (password.length < 6)
      return setError(
        "Mật khẩu nên có ít nhất 6 ký tự để demo validate rõ ràng.",
      );

    if (isLogin) {
      const found = users.find(
        (u) => u.email === email && u.password === password,
      );
      if (!found)
        return setError(
          "Tài khoản chưa tồn tại hoặc sai mật khẩu. Em có thể chuyển qua Đăng ký.",
        );
      onSuccess({ name: found.name, email: found.email });
      return;
    }

    if (name.length < 2)
      return setError("Nhập tên hiển thị ít nhất 2 ký tự nha.");
    if (users.some((u) => u.email === email))
      return setError("Email này đã đăng ký rồi, chuyển qua Đăng nhập nha.");
    const nextUser = { name, email, password };
    saveUsers([...users, nextUser]);
    onSuccess({ name, email });
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <section className="authModal">
        <button className="modalClose" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>
        <div className="authIntro">
          <p className="eyebrow">Account UX</p>
          <h2>{isLogin ? "Đăng nhập để tiếp tục" : "Tạo tài khoản mới"}</h2>
          <p>
            {reason ||
              "Tài khoản giúp trải nghiệm mua hàng rõ ràng và chuyên nghiệp hơn."}
          </p>
        </div>
        <div className="authTabs">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Đăng nhập
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Đăng ký
          </button>
        </div>
        <form className="authForm" onSubmit={submit}>
          {!isLogin && (
            <label>
              Họ tên
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Hậu Nguyễn"
                autoFocus
              />
            </label>
          )}
          <label>
            Email
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="hau@gmail.com"
              autoFocus={isLogin}
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Ít nhất 6 ký tự"
            />
          </label>
          {error && <div className="formError">{error}</div>}
          <button className="btn primary full" type="submit">
            {isLogin ? "Đăng nhập" : "Đăng ký"} <ArrowRight size={18} />
          </button>
        </form>
        <div className="authHint">
          <UserPlus size={18} />
          <span>
            Demo dùng localStorage, không gửi dữ liệu lên server. Khi deploy
            Render vẫn chạy được ngay.
          </span>
        </div>
      </section>
    </div>
  );
}

function Home({
  products,
  allProducts,
  categories,
  loading,
  keyword,
  setKeyword,
  category,
  setCategory,
  addToCart,
  goProduct,
}) {
  const suggestions = useMemo(
    () => allProducts.slice(0, 4).map((p) => p.name),
    [allProducts],
  );
  return (
    <>
      <section className="hero container">
        <div className="heroCopy reveal show">
          <p className="badge">
            <Sparkles size={16} /> Noir drop 2026 · Basic nhưng có gu
          </p>
          <h1>Minimal clothes, maximum outfit.</h1>
          <p className="heroText">
            Shop quần áo demo theo style tối giản, sạch, hiện đại. Bản này có
            chi tiết sản phẩm, giỏ hàng localStorage và thanh toán giả lập để
            bài của em nhìn hoàn chỉnh hơn.
          </p>
          <div className="heroActions">
            <a href="#products" className="btn primary">
              Xem collection <ArrowRight size={18} />
            </a>
            <a href="#guide" className="btn ghost">
              Cách chọn size
            </a>
          </div>
          <div className="heroStats">
            <span>
              <b>06+</b>
              <small>mẫu nổi bật</small>
            </span>
            <span>
              <b>Login</b>
              <small>bắt đăng nhập khi mua</small>
            </span>
            <span>
              <b>Local</b>
              <small>user + giỏ hàng</small>
            </span>
          </div>
        </div>
        <div className="heroVisual reveal show">
          <img
            src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85"
            alt="Outfit thời trang tối giản"
            loading="eager"
            decoding="async"
          />
          <div className="floatingCard">
            <span>Best seller</span>
            <b>Varsity Noir</b>
            <small>Form rộng · phối cực dễ</small>
          </div>
        </div>
      </section>
      <section className="features container reveal">
        <article>
          <Truck />
          <b>Giao nhanh</b>
          <span>2-4 ngày tuỳ khu vực</span>
        </article>
        <article>
          <ShieldCheck />
          <b>Form dễ mặc</b>
          <span>Basic, minimal, smart casual</span>
        </article>
        <article>
          <PackageCheck />
          <b>Đổi trả 7 ngày</b>
          <span>Demo chính sách rõ ràng</span>
        </article>
      </section>
      <section id="products" className="container section reveal">
        <div className="sectionHead">
          <div>
            <p className="eyebrow">Collection</p>
            <h2>Sản phẩm nổi bật</h2>
            <p className="muted">
              Thanh tìm kiếm lọc theo tên, mô tả, màu, size. Card có khóa chiều
              cao mô tả nên không tràn chữ.
            </p>
          </div>
          <div className="searchPanel">
            <label className="search">
              <Search size={18} />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm áo khoác, jean, sơ mi..."
              />
              {keyword && (
                <button
                  type="button"
                  className="clearSearch"
                  onClick={() => setKeyword("")}
                >
                  ×
                </button>
              )}
            </label>
            <div className="suggestions">
              <span>Gợi ý:</span>
              {suggestions.map((name) => (
                <button key={name} onClick={() => setKeyword(name)}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="chips">
          {categories.map((item) => (
            <button
              key={item}
              className={category === item ? "chip active" : "chip"}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>
        {loading ? (
          <ProductSkeleton />
        ) : products.length ? (
          <div className="grid">
            {products.map((p, index) => (
              <ProductCard
                key={p.id}
                product={p}
                index={index}
                addToCart={addToCart}
                goProduct={goProduct}
              />
            ))}
          </div>
        ) : (
          <div className="emptyResult">
            <Search size={34} />
            <b>Không tìm thấy sản phẩm phù hợp</b>
            <span>Thử từ khóa khác hoặc bấm “Tất cả” nha.</span>
          </div>
        )}
      </section>
      <section id="guide" className="guide container section reveal">
        <div>
          <p className="eyebrow">
            <Ruler size={16} /> AEO content
          </p>
          <h2>Chọn size nhanh</h2>
          <p>
            <b>Câu trả lời ngắn:</b> Đo vai, ngực, eo, sau đó so với bảng size.
            Nếu số đo nằm giữa 2 size hoặc thích mặc thoải mái, hãy chọn size
            lớn hơn.
          </p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Size</th>
              <th>Cân nặng</th>
              <th>Phong cách</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>S</td>
              <td>40-48kg</td>
              <td>Vừa người</td>
            </tr>
            <tr>
              <td>M</td>
              <td>49-56kg</td>
              <td>Dễ mặc</td>
            </tr>
            <tr>
              <td>L</td>
              <td>57-65kg</td>
              <td>Thoải mái</td>
            </tr>
            <tr>
              <td>XL</td>
              <td>66-75kg</td>
              <td>Rộng nhẹ</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section className="aiBox container reveal">
        <Bot size={28} />
        <div>
          <b>Đã chuẩn bị cho AIEO/GEO</b>
          <p>
            Website có FAQ rõ ràng, Product Schema, Organization Schema,
            sitemap.xml, robots.txt và llms.txt. Nội dung viết theo dạng hỏi-đáp
            để AI dễ hiểu.
          </p>
        </div>
      </section>
      <section id="faq" className="faq container section reveal">
        <p className="eyebrow">FAQ tối ưu AEO/AIEO</p>
        <h2>Câu hỏi thường gặp</h2>
        <details open>
          <summary>Giỏ hàng có lưu khi reload không?</summary>
          <p>
            Có. Giỏ hàng được lưu bằng localStorage trên trình duyệt nên reload
            trang vẫn còn sản phẩm.
          </p>
        </details>
        <details>
          <summary>Thanh toán có trừ tiền thật không?</summary>
          <p>
            Không. Đây là checkout giả lập để demo quy trình đặt hàng trong bài
            tập.
          </p>
        </details>
        <details>
          <summary>Vì sao thêm vào giỏ lại bắt đăng nhập?</summary>
          <p>
            Vì đây là UX phổ biến của website bán hàng: người dùng có tài khoản
            thì giỏ hàng, thông tin giao hàng và lịch sử mua sẽ rõ ràng hơn. Bản
            demo lưu tài khoản bằng localStorage.
          </p>
        </details>
        <details>
          <summary>File upload chính là file nào?</summary>
          <p>
            Frontend dùng <b>client/index.html</b> làm file index chính, React
            mount vào <b>client/src/main.jsx</b>. Khi build, Render tự xuất ra{" "}
            <b>client/dist/index.html</b>.
          </p>
        </details>
      </section>
    </>
  );
}
function ProductSkeleton() {
  return (
    <div className="grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <article className="card skeletonCard" key={i}>
          <div className="skeletonImage" />
          <div className="cardBody">
            <span className="skeletonLine wide" />
            <span className="skeletonLine" />
            <span className="skeletonLine short" />
            <div className="cardActions">
              <span className="skeletonButton" />
              <span className="skeletonButton" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
function ProductCard({ product, index = 0, addToCart, goProduct }) {
  return (
    <article
      className="card reveal show"
      style={{ transitionDelay: `${Math.min(index, 5) * 55}ms` }}
    >
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: product.image,
          description: product.description,
          brand: { "@type": "Brand", name: "Noir Atelier" },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: 24,
          },
          offers: {
            "@type": "Offer",
            priceCurrency: "VND",
            price: product.price,
            availability: "https://schema.org/InStock",
          },
        }}
      />
      <button className="imageWrap" onClick={() => goProduct(product.slug)}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
        />
        <span className="tag">{product.category}</span>
      </button>
      <div className="cardBody">
        <h3 title={product.name}>{product.name}</h3>
        <p className="desc">{product.description}</p>
        <div className="meta">
          <b>{money(product.price)}</b>
          <del>{money(product.oldPrice)}</del>
          <span>
            <Star size={14} fill="currentColor" /> {product.rating}
          </span>
        </div>
        <p className="small">
          <b>Size:</b> {product.sizes.join(", ")} · <b>Màu:</b>{" "}
          {product.colors.join(", ")}
        </p>
        <div className="cardActions">
          <button className="btn mini" onClick={() => goProduct(product.slug)}>
            Xem chi tiết
          </button>
          <button className="addBtn" onClick={() => addToCart(product)}>
            Thêm giỏ
          </button>
        </div>
      </div>
    </article>
  );
}
function ProductDetail({
  product,
  related,
  addToCart,
  goProduct,
  goCart,
  goBack,
  reviews,
  setReviews,
}) {
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  useEffect(() => {
    if (product) {
      setSize(product.sizes[0]);
      setColor(product.colors[0]);
      setSeo({
        title: `${product.name} - Noir Atelier`,
        description: product.description,
      });
    }
  }, [product]);
  if (!product)
    return (
      <section className="container empty">
        <h2>Không tìm thấy sản phẩm</h2>
        <button className="btn primary" onClick={goBack}>
          Về trang chủ
        </button>
      </section>
    );
  return (
    <section className="container detail section">
      <button className="back" onClick={goBack}>
        <ArrowLeft size={18} /> Quay lại collection
      </button>
      <div className="detailGrid">
        <div className="detailImage reveal show">
          <img
            src={product.image}
            alt={product.name}
            loading="eager"
            decoding="async"
          />
          <span>{product.category}</span>
        </div>
        <div className="detailInfo reveal show">
          <p className="eyebrow">Product detail</p>
          <h1>{product.name}</h1>
          <div className="rating">
            <Star size={18} fill="currentColor" /> {product.rating} · 24 đánh
            giá demo
          </div>
          <p className="detailDesc">{product.description}</p>
          <div className="priceLine">
            <b>{money(product.price)}</b>
            <del>{money(product.oldPrice)}</del>
          </div>
          <div className="option">
            <b>Chọn size</b>
            <div>
              {product.sizes.map((s) => (
                <button
                  key={s}
                  className={size === s ? "optionBtn active" : "optionBtn"}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="option">
            <b>Chọn màu</b>
            <div>
              {product.colors.map((c) => (
                <button
                  key={c}
                  className={color === c ? "optionBtn active" : "optionBtn"}
                  onClick={() => setColor(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="detailBullets">
            <p>
              <CheckCircle2 /> Chất liệu:{" "}
              {product.material || "Cotton blend cao cấp"}
            </p>
            <p>
              <CheckCircle2 /> Phù hợp:{" "}
              {product.fit || "đi học, đi chơi, đi làm nhẹ"}
            </p>
            <p>
              <CheckCircle2 /> Đổi trả 7 ngày nếu còn tem mác
            </p>
          </div>
          <div className="detailActions">
            <button
              className="btn primary"
              onClick={() => addToCart(product, { size, color })}
            >
              Thêm vào giỏ
            </button>
            <button className="btn ghost" onClick={goCart}>
              Xem giỏ hàng
            </button>
          </div>
        </div>
      </div>
      <ReviewSection
        reviews={reviews}
        setReviews={setReviews}
        productName={product.name}
      />

      <div className="sectionHead relatedHead">
        <div>
          <p className="eyebrow">Gợi ý phối thêm</p>
          <h2>Sản phẩm liên quan</h2>
        </div>
      </div>
      <div className="grid related">
        {related.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            addToCart={addToCart}
            goProduct={goProduct}
          />
        ))}
      </div>
    </section>
  );
}

function ReviewSection({ reviews, setReviews, productName }) {
  const [form, setForm] = useState({
    name: "",
    rating: "5",
    comment: "",
  });

  function submitReview(e) {
    e.preventDefault();

    const name = form.name.trim();
    const comment = form.comment.trim();

    if (name.length < 2 || comment.length < 5) return;

    const newReview = {
      id: Date.now(),
      name,
      rating: Number(form.rating),
      comment,
      productName,
      date: new Date().toLocaleDateString("vi-VN"),
    };

    setReviews((prev) => [newReview, ...prev]);
    setForm({ name: "", rating: "5", comment: "" });
  }

  return (
    <section className="reviewBox reveal show">
      <div className="reviewHeader">
        <div>
          <p className="eyebrow">Customer reviews</p>
          <h2>Đánh giá khách hàng</h2>
          <p className="muted">
            Phần đánh giá giúp website có thêm nội dung thật, tăng độ tin cậy và
            hỗ trợ AEO/AIEO vì AI dễ hiểu trải nghiệm người mua.
          </p>
        </div>
        <div className="reviewScore">
          <Star size={20} fill="currentColor" />
          <b>4.8/5</b>
          <span>{reviews.length} đánh giá</span>
        </div>
      </div>

      <div className="reviewLayout">
        <form className="reviewForm" onSubmit={submitReview}>
          <label>
            Tên của bạn
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ví dụ: Thanh Hậu"
              required
            />
          </label>

          <label>
            Số sao
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
            >
              <option value="5">5 sao - Rất hài lòng</option>
              <option value="4">4 sao - Hài lòng</option>
              <option value="3">3 sao - Tạm ổn</option>
              <option value="2">2 sao - Cần cải thiện</option>
              <option value="1">1 sao - Chưa hài lòng</option>
            </select>
          </label>

          <label>
            Nội dung đánh giá
            <textarea
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Nhập cảm nhận về form áo, chất vải, màu sắc, giao hàng..."
              required
            />
          </label>

          <button className="btn primary full" type="submit">
            Gửi đánh giá
          </button>
        </form>

        <div className="reviewList">
          {reviews.map((review) => (
            <article className="reviewItem" key={review.id}>
              <div className="reviewTop">
                <b>{review.name}</b>
                <span>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>
              <p>{review.comment}</p>
              <small>
                {review.productName || productName} · {review.date || "Demo"}
              </small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CartPage({
  cart,
  updateQty,
  removeItem,
  clearCart,
  subtotal,
  shipping,
  discount,
  total,
  goCheckout,
  goProduct,
  goHome,
}) {
  if (!cart.length)
    return (
      <section className="container empty">
        <ShoppingBag size={54} />
        <h1>Giỏ hàng đang trống</h1>
        <p>Em bấm về collection rồi thêm vài món để test localStorage nha.</p>
        <button className="btn primary" onClick={goHome}>
          Mua sắm ngay
        </button>
      </section>
    );
  return (
    <section className="container cartPage section">
      <div className="sectionHead">
        <div>
          <p className="eyebrow">Local cart</p>
          <h1>Giỏ hàng của em</h1>
          <p className="muted">
            Dữ liệu đang lưu trong localStorage, reload trang vẫn giữ sản phẩm.
          </p>
        </div>
        <button className="btn danger" onClick={clearCart}>
          <Trash2 size={17} /> Xóa giỏ
        </button>
      </div>
      <div className="cartLayout">
        <div className="cartList">
          {cart.map((item) => (
            <article className="cartItem reveal show" key={item.key}>
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                decoding="async"
              />
              <div>
                <button
                  className="itemName"
                  onClick={() => goProduct(item.slug)}
                >
                  {item.name}
                </button>
                <p>
                  Size {item.size} · Màu {item.color}
                </p>
                <b>{money(item.price)}</b>
              </div>
              <div className="qty">
                <button onClick={() => updateQty(item.key, item.qty - 1)}>
                  <Minus size={15} />
                </button>
                <span>{item.qty}</span>
                <button onClick={() => updateQty(item.key, item.qty + 1)}>
                  <Plus size={15} />
                </button>
              </div>
              <button className="remove" onClick={() => removeItem(item.key)}>
                <Trash2 size={18} />
              </button>
            </article>
          ))}
        </div>
        <OrderSummary
          subtotal={subtotal}
          shipping={shipping}
          discount={discount}
          total={total}
        >
          <button className="btn primary full" onClick={goCheckout}>
            Qua thanh toán <ArrowRight size={18} />
          </button>
        </OrderSummary>
      </div>
    </section>
  );
}
function OrderSummary({ subtotal, shipping, discount, total, children }) {
  return (
    <aside className="summary">
      <h2>Tóm tắt đơn</h2>
      <p>
        <span>Tạm tính</span>
        <b>{money(subtotal)}</b>
      </p>
      <p>
        <span>Phí ship</span>
        <b>{shipping ? money(shipping) : "Miễn phí"}</b>
      </p>
      <p>
        <span>Giảm giá</span>
        <b>-{money(discount)}</b>
      </p>
      <hr />
      <p className="grand">
        <span>Tổng cộng</span>
        <b>{money(total)}</b>
      </p>
      {children}
      <small>Miễn phí ship từ 500.000đ, giảm 50.000đ từ 800.000đ.</small>
    </aside>
  );
}
function CheckoutPage({
  cart,
  subtotal,
  shipping,
  discount,
  total,
  clearCart,
  goHome,
}) {
  const [done, setDone] = useState(false);
  if (done)
    return (
      <section className="container empty success">
        <CheckCircle2 size={64} />
        <h1>Đặt hàng thành công</h1>
        <p>
          Đơn hàng đã được giả lập. Không có thanh toán thật và không gửi dữ
          liệu ra ngoài.
        </p>
        <button className="btn primary" onClick={goHome}>
          Về trang chủ
        </button>
      </section>
    );
  return (
    <section className="container checkout section">
      <div>
        <p className="eyebrow">Checkout</p>
        <h1>Thanh toán</h1>
        <p className="muted">Form này chỉ demo</p>
        <form
          className="checkoutForm"
          onSubmit={(e) => {
            e.preventDefault();
            clearCart();
            setDone(true);
          }}
        >
          <label>
            Họ tên
            <input required placeholder="Nguyễn Văn A" />
          </label>
          <label>
            Số điện thoại
            <input required placeholder="0900000000" />
          </label>
          <label>
            Địa chỉ nhận hàng
            <textarea
              required
              placeholder="Số nhà, phường/xã, quận/huyện, tỉnh/thành phố"
            />
          </label>
          <label>
            Phương thức thanh toán
            <select>
              <option>Thanh toán khi nhận hàng COD</option>
              <option>Chuyển khoản demo</option>
              <option>Ví điện tử demo</option>
            </select>
          </label>
          <div className="payNotice">
            <CreditCard />
            <span>.</span>
          </div>
          <button className="btn primary full" disabled={!cart.length}>
            Xác nhận đặt hàng
          </button>
        </form>
      </div>
      <OrderSummary
        subtotal={subtotal}
        shipping={shipping}
        discount={discount}
        total={total}
      >
        <div className="checkoutItems">
          {cart.map((i) => (
            <p key={i.key}>
              <span>
                {i.name} × {i.qty}
              </span>
              <b>{money(i.price * i.qty)}</b>
            </p>
          ))}
        </div>
      </OrderSummary>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
