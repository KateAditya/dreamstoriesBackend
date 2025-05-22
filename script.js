const API_URL = "https://rfx-new-production-726b.up.railway.app/"; // Replace with your actual Railway backend URL

// Fetch data from backend
fetch(`${API_URL}/api/data`)
  .then((response) => response.json())
  .then((data) => {
    console.log("Data from backend:", data);
    document.getElementById("output").innerText = JSON.stringify(data, null, 2);
  })
  .catch((error) => console.error("Error fetching data:", error));
