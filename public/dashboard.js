const API_BASE_URL = "http://localhost:3001";

function logout() {
  fetch(`${API_BASE_URL}/api/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "/login.html";
      } else {
        alert(data.message || "Logout failed");
      }
    })
    .catch((err) => {
      console.error(err);
      alert("Logout failed: " + err.message);
    });
}

const form = document.getElementById("addProductForm");
const productList = document.getElementById("productList");
const productIdInput = document.getElementById("productId");
const cancelEditBtn = document.getElementById("cancelEdit");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const id = productIdInput.value;
  const formData = new FormData(this);

  const url = id
    ? `${API_BASE_URL}/api/products/${id}`
    : `${API_BASE_URL}/api/products`;
  const method = id ? "PUT" : "POST";

  fetch(url, {
    method: method,
    body: formData,
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login.html?redirect=/dashboard.html";
          throw new Error("Not authenticated");
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      alert(id ? "✅ Product updated" : "✅ Product added");
      form.reset();
      if (id) {
        productIdInput.value = "";
        cancelEditBtn.style.display = "none";
      }
      loadProducts();
    })
    .catch((err) => {
      console.error("Error saving product:", err);
      if (err.message !== "Not authenticated") {
        alert(`❌ Failed to ${id ? "update" : "add"} product: ` + err.message);
      }
    });
});

cancelEditBtn.addEventListener("click", () => {
  form.reset();
  productIdInput.value = "";
  cancelEditBtn.style.display = "none";
});

function loadProducts() {
  fetch(`${API_BASE_URL}/api/products`, {
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login.html?redirect=/dashboard.html";
          throw new Error("Not authenticated");
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((products) => {
      productList.innerHTML = "";
      products.forEach((p) => {
        const html = `
                    <div class="item" data-id="${p.id}">
                        <img src="${p.image_url}" class="img-fluid" alt="${p.title}">
                        <h3>${p.title}</h3>
                        <span id="dis">${p.discount}</span>
                        <p class="prices">₹${p.price}</p>
                        <div class="actions">
                            <form class="pay-form" style="display:inline;">
                                <input type="hidden" name="name" value="${p.title}">
                                <input type="hidden" name="amount" value="${p.price}">
                                <input type="hidden" name="description" value="${p.description}">
                                <input type="submit" class="buy-btn" value="Buy Now">
                            </form>
                            <button onclick="window.open('${p.view_link}')">View</button>
                            <button onclick="editProduct(${p.id})">Edit</button>
                            <button onclick="deleteProduct(${p.id})">Delete</button>
                        </div>
                    </div>`;
        productList.innerHTML += html;
      });
    })
    .catch((err) => {
      console.error("Error loading products:", err);
      if (err.message !== "Not authenticated") {
        alert("Failed to load products: " + err.message);
      }
    });
}

function editProduct(id) {
  fetch(`${API_BASE_URL}/api/products/${id}`, {
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login.html?redirect=/dashboard.html";
          throw new Error("Not authenticated");
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      return res.json();
    })
    .then((p) => {
      if (!p) {
        alert("Product not found");
        return;
      }
      productIdInput.value = p.id;
      form.title.value = p.title;
      form.discount.value = p.discount;
      form.price.value = p.price;
      form.description.value = p.description;
      form.view_link.value = p.view_link;
      cancelEditBtn.style.display = "inline";
      window.scrollTo(0, 0);
    })
    .catch((err) => {
      console.error("Error editing product:", err);
      if (err.message !== "Not authenticated") {
        alert("Failed to edit product: " + err.message);
      }
    });
}

function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: "DELETE",
    credentials: "include",
  })
    .then((res) => {
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login.html?redirect=/dashboard.html";
          throw new Error("Not authenticated");
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      alert(data.message);
      loadProducts();
    })
    .catch((err) => {
      console.error("Error deleting product:", err);
      if (err.message !== "Not authenticated") {
        alert("Failed to delete product: " + err.message);
      }
    });
}

// Initial load
loadProducts();
