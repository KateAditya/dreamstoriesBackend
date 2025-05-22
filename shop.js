const data = [
  {
    name: "Floral Png Pack",
    title: "Floral Png Pack",
    images: ["details/05.jpg"],
  },
  {
    name: "Marathi Text Pack",
    title: "Marathi Text Pack",
    images: ["details/06.jpg"],
  },
  {
    name: "English Text Pack #1",
    title: "English Text Pack #1",
    images: ["details/03.jpg"],
  },
  {
    name: "English Text Pack #2",
    title: "English Text Pack #2",
    images: ["details/04.jpg"],
  },
  {
    name: "Cover - Page Pack",
    title: "Cover - Page Pack",
    images: ["details/09.jpg"],
  },
  {
    name: "Engagement Album Pack",
    title: "Engagement Album Pack",
    images: ["details/02.jpg"],
  },
  {
    name: "Pre-Birthday Album Pack",
    title: "Pre-Birthday Album Pack",
    images: ["details/08.jpg"],
  },
  {
    name: "Wedding Album Pack",
    title: "Wedding Album Pack",
    images: ["details/01.jpg"],
  },
  {
    name: "New - Brush Pack",
    title: "New - Brush Pack",
    images: ["details/07.jpg"],
  },

  // Add all 9 products here
];

function showDetail(productName) {
  // Find product by name
  const product = data.find((p) => p.name === productName);

  // Set the modal title and clear existing images
  document.getElementById("productTitle").textContent = product.title;
  const carouselImages = document.getElementById("carouselImages");
  carouselImages.innerHTML = "";

  // Add new images to the carousel
  product.images.forEach((image, index) => {
    const isActive = index === 0 ? "active" : "";
    const carouselItem = `
          <div class="carousel-item ${isActive}">
              <img src="${image}" class="d-block w-100" alt="${product.title}">
          </div>
      `;
    carouselImages.insertAdjacentHTML("beforeend", carouselItem);
  });

  // Show the modal
  const detailsModal = new bootstrap.Modal(
    document.getElementById("detailsModal")
  );
  detailsModal.show();
}
