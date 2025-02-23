document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const menuIcon = document.querySelector(".menu");
  const sidebar = document.querySelector(".sidebar");
  const closeBtn = document.querySelector(".close-btn");

  // Check if elements exist before adding event listeners
  if (menuIcon && sidebar && closeBtn) {
    // Open Sidebar
    menuIcon.addEventListener("click", function () {
      sidebar.classList.add("active");
    });

    // Close Sidebar
    closeBtn.addEventListener("click", function () {
      sidebar.classList.remove("active");
    });

    // Close sidebar if clicking outside
    document.addEventListener("click", function (event) {
      if (!sidebar.contains(event.target) && !menuIcon.contains(event.target)) {
        sidebar.classList.remove("active");
      }
    });
  }

  let category = document.location.pathname.slice(1).split(".")[0];
  console.log("Category:", category);

  // Fetch events from MongoDB API
  fetch("/api/events")
    .then((response) => response.json())
    .then((events) => {
      console.log("All events:", events);
      const filteredEvents = events.filter(
        (event) => event.category === category
      );
      console.log("Filtered events:", filteredEvents);

      const displaySection = document.getElementById("product-display");
      displaySection.innerHTML = "";

      filteredEvents.forEach((event) => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card", event.category);

        // Create image container
        const imgContainer = document.createElement("div");
        imgContainer.classList.add("image-container");

        // Add product image
        const img = document.createElement("img");
        img.src = `/api/events/${event._id}/image`; // Use MongoDB image endpoint
        img.alt = event.name;
        img.addEventListener("click", () => createImagePopup(`/api/events/${event._id}/image`));
        imgContainer.appendChild(img);
        productCard.appendChild(imgContainer);

        // Add product name
        const title = document.createElement("h3");
        title.textContent = event.name;
        productCard.appendChild(title);

        // Add product price
        const price = document.createElement("p");
        price.textContent = event.price;
        productCard.appendChild(price);

        // Add product description
        const description = document.createElement("p");
        description.textContent = event.description;
        productCard.appendChild(description);

        // Append card to display section
        displaySection.appendChild(productCard);
      });
    })
    .catch((error) => {
      console.error("Error loading events:", error);
      const displaySection = document.getElementById("product-display");
      displaySection.innerHTML = "<p>Error loading events. Please try again later.</p>";
    });
});

// Update image popup function
function createImagePopup(imageSrc) {
  const popup = document.createElement("div");
  popup.classList.add("image-popup");

  const popupContent = document.createElement("div");
  popupContent.classList.add("popup-content");

  const closeBtn = document.createElement("button");
  closeBtn.classList.add("popup-close");
  closeBtn.innerHTML = "×";
  closeBtn.onclick = () => popup.remove();

  const popupImage = document.createElement("img");
  popupImage.src = imageSrc;

  popupContent.appendChild(closeBtn);
  popupContent.appendChild(popupImage);
  popup.appendChild(popupContent);
  document.body.appendChild(popup);
}
