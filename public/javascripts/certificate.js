let funFactInterval;

function showLoader() {
  document.getElementById("message").style.display = "flex";
  displayRandomFunFact();
  startFunFactInterval();
}

function hideLoader() {
  document.getElementById("message").style.display = "none";
  clearInterval(funFactInterval);
}

function displayRandomFunFact() {
  const funFacts = [
    "Did you know? The oldest surviving degree certificate was awarded by the University of Paris in 1234!",
    "Fun fact: The world's first printed certificates emerged in the 15th century after the invention of the printing press.",
    "Did you know? Digital certificates (like SSL/TLS) use cryptographic encryption to secure websites and online communications.",
    "Fun fact: The first SSL certificate was issued in 1995 by Netscape to improve web security.",
    "Did you know? Blockchain technology is being used by universities like MIT to issue tamper-proof digital certificates.",
    "Fun fact: Open Badges, a digital credential standard by Mozilla, allows individuals to showcase their verified skills online.",
    "Did you know? In 2020, over 60% of professional certifications were issued digitally due to the pandemic-driven shift to e-learning.",
    "Fun fact: The global digital certificates and public key infrastructure (PKI) market is projected to reach $12 billion by 2028.",
    "Did you know? Some prestigious certifications, like the PMP (Project Management Professional), require extensive experience and exams.",
    "Fun fact: Companies like IBM and Google now issue blockchain-based digital certificates to verify employee skills.",
  ];

  const randomIndex = Math.floor(Math.random() * funFacts.length);
  const funFact = funFacts[randomIndex];

  const funFactDiv = document.getElementById("funFact");
  funFactDiv.textContent = funFact;
}

function startFunFactInterval() {
  funFactInterval = setInterval(displayRandomFunFact, 8000); // Change fun fact every 8 seconds
}

hideLoader();

document
  .getElementById("uploadForm") // Get the form element by its ID
  .addEventListener("submit", async (event) => {
    // Add an event listener for form submission
    event.preventDefault(); // Prevent the default form submission behavior

    const form = new FormData(event.target); // Create a FormData object from the form
    const messageDiv = document.getElementById("message");

    showLoader(); // Get the message div by its ID

    // Show loading message
    // Set the message color to black

    try {
      const response = await fetch("/multiple-certificate/generate", {
        // Send a POST request to generate certificates
        method: "POST",
        body: form, // Include the form data in the request body
      });

      const result = await response.text(); // Get the response text

      if (response.ok) {
        hideLoader();
        // Display success message
        messageDiv.textContent =
          "Certificates generated successfully! Please wait fetching Certificates";
        messageDiv.style.color = "green"; // Set the message color to green

        // Redirect to the preview certificates page immediately
        window.location.href = "/preview-certificates";
      } else {
        throw new Error(result); // Throw an error if the response is not OK
      }
    } catch (error) {
      // Display error message
      messageDiv.textContent = `Error: ${error.message}`;
      messageDiv.style.color = "red"; // Set the message color to red
      hideLoader();
    }
  });
