document.addEventListener("DOMContentLoaded", function () {
  const iframes = document.querySelectorAll(".lazy-iframe");
  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const iframe = entry.target;
          iframe.src = iframe.getAttribute("data-src");
          observer.unobserve(iframe);
        }
      });
    },
    { threshold: 0.1 }
  );

  iframes.forEach((iframe) => observer.observe(iframe));
});

function filterCertificates() {
  const searchInput = document.getElementById("search-bar").value.toLowerCase();
  const certificates = document.querySelectorAll(".certificate-card");

  certificates.forEach((card) => {
    const name = card.getAttribute("data-name").toLowerCase();
    if (name.includes(searchInput)) {
      card.style.display = "flex";
    } else {
      card.style.display = "none";
    }
  });
}

function downloadZip() {
  const link = document.createElement("a");
  link.href = "/preview-certificates/download-zip";
  link.download = "certificates.zip";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Redirect to home page after initiating the download
  setTimeout(() => {
    window.location.href = "/";
  }, 3000); // Adjust the timeout as needed
}
