function logout() {
  fetch("/api/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        window.location.href = "/login";
      } else {
        showToast(data.message || "Logout failed", true);
      }
    })
    .catch((err) => {
      showToast("Logout failed: " + err.message, true);
    });
}

// DOM Elements
const form = document.getElementById("addLinkForm");
const linkIdInput = document.getElementById("linkId");
const titleInput = document.getElementById("title");
const downloadLinkInput = document.getElementById("downloadLink");
const saveButton = document.getElementById("saveButton");
const cancelEditBtn = document.getElementById("cancelEdit");
const linksTableBody = document.getElementById("linksTableBody");
const productSelect = document.getElementById("productSelect");
const useSelectedProductBtn = document.getElementById("useSelectedProduct");
const toast = document.getElementById("toast");
const bulkImportForm = document.getElementById("bulkImportForm");
const bulkImportData = document.getElementById("bulkImportData");
const clearBulkDataBtn = document.getElementById("clearBulkData");

// Store links data globally
let globalLinksData = [];

// Show toast
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.className = isError ? "toast error show" : "toast show";
  setTimeout(() => {
    toast.className = toast.className.replace("show", "");
  }, 3000);
}

// Load product titles
function loadProductTitles() {
  fetch("http://localhost:3001/admin/product-titles")
    .then((res) => res.json())
    .then((products) => {
      productSelect.innerHTML =
        '<option value="">-- Select Existing Product --</option>';
      products.forEach((product) => {
        const option = document.createElement("option");
        option.value = product.title;
        option.textContent = product.title;
        productSelect.appendChild(option);
      });
    })
    .catch((err) => {
      showToast("Failed to load product titles: " + err.message, true);
    });
} // Load product links
function loadProductLinks() {
  fetch("http://localhost:3001/admin/product-links")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch links");
      }
      return res.json();
    })
    .then((links) => {
      linksTableBody.innerHTML = ""; // Convert to array if it's an object
      const linksArray = Array.isArray(links)
        ? links
        : Object.entries(links).map(([title, download_link]) => ({
            id: null, // New links won't have IDs initially
            title,
            download_link,
          }));

      globalLinksData = linksArray;
      if (linksArray.length === 0) {
        linksTableBody.innerHTML =
          '<tr><td colspan="4">No product links found</td></tr>';
        return;
      }

      linksArray.forEach((link, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
                            <td>${link.id}</td>
                            <td>${link.title}</td>
                            <td>
                                <a href="${link.download_link}" target="_blank">
                                    ${link.download_link.substring(0, 50)}${
          link.download_link.length > 50 ? "..." : ""
        }
                                </a>
                            </td>
                            <td class="actions">
                                <button onclick="editLink(${index})" class="edit">Edit</button>
                                <button onclick="deleteLink(${
                                  link.id
                                })" class="danger">Delete</button>
                            </td>
                        `;
        linksTableBody.appendChild(row);
      });
    })
    .catch((err) => {
      showToast("Failed to load product links: " + err.message, true);
    });
}

// Edit link
function editLink(index) {
  const link = globalLinksData[index];
  linkIdInput.value = link.id;
  titleInput.value = link.title;
  downloadLinkInput.value = link.download_link;

  // Find and select the matching option in productSelect
  const option = Array.from(productSelect.options).find(
    (opt) => opt.value === link.title
  );
  if (option) {
    option.selected = true;
  }

  cancelEditBtn.style.display = "inline-block";
  saveButton.textContent = "Update Product Link";
  window.scrollTo(0, 0);
}

// Delete link
function deleteLink(id) {
  if (!confirm("Are you sure you want to delete this link?")) return;
  fetch(`http://localhost:3001/admin/product-links/${id}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((result) => {
      showToast(result.message || "Link deleted successfully");
      loadProductLinks();
    })
    .catch((err) => {
      showToast("Failed to delete link: " + err.message, true);
    });
}

// Use selected product
useSelectedProductBtn.addEventListener("click", () => {
  const selectedTitle = productSelect.value;
  if (selectedTitle) {
    titleInput.value = selectedTitle;
  }
});

// Submit form (Add/Edit)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = linkIdInput.value;
  const title = titleInput.value.trim();
  const downloadLink = downloadLinkInput.value.trim();

  if (!title || !downloadLink) {
    showToast("Please fill in all fields", true);
    return;
  }
  const payload = { title, download_link: downloadLink };
  const url = id
    ? `http://localhost:3001/admin/product-links/${id}`
    : "http://localhost:3001/admin/product-links";
  const method = id ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to save link");
    }

    showToast(result.message || (id ? "Link updated" : "Link added"));
    form.reset();
    cancelEditBtn.style.display = "none";
    saveButton.textContent = "Save Product Link";
    await Promise.all([loadProductLinks(), loadProductTitles()]);
  } catch (err) {
    showToast(err.message, true);
  }
});

// Cancel edit
cancelEditBtn.addEventListener("click", () => {
  form.reset();
  linkIdInput.value = "";
  cancelEditBtn.style.display = "none";
  saveButton.textContent = "Save Product Link";
}); // Bulk import
bulkImportForm.addEventListener("submit", (e) => {
  e.preventDefault();

  let jsonText = bulkImportData.value.trim();

  try {
    // Try to parse as either array or object
    const parsedData = JSON.parse(jsonText);
    if (!parsedData || typeof parsedData !== "object") {
      throw new Error("Input must be a JSON object with title-link pairs");
    }

    fetch("http://localhost:3001/admin/product-links/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsedData),
    })
      .then((res) => res.json())
      .then((result) => {
        showToast(result.message || "Bulk import successful");
        bulkImportData.value = "";
        loadProductLinks();
      })
      .catch((err) => {
        showToast("Bulk import failed: " + err.message, true);
      });
  } catch (err) {
    showToast("Invalid JSON format: " + err.message, true);
  }
});

// Clear bulk input
clearBulkDataBtn.addEventListener("click", () => {
  bulkImportData.value = "";
});

// Load initial data
document.addEventListener("DOMContentLoaded", () => {
  loadProductLinks();
  loadProductTitles();
});
