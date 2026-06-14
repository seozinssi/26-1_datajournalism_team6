window.addEventListener("message", (event) => {
  const iframes = document.querySelectorAll("iframe");

  iframes.forEach((iframe) => {
    if (event.source === iframe.contentWindow && event.data?.type === "cremation-interactive-resize") {
      const height = Number(event.data.height);
      if (Number.isFinite(height) && height > 0) {
        const isFirstMeasurement = !iframe.dataset.heightMeasured;

        iframe.dataset.heightMeasured = "true";
        iframe.classList.toggle("is-expanded", event.data.expanded === true);
        iframe.style.height = `${Math.ceil(height)}px`;

        if (isFirstMeasurement) {
          window.requestAnimationFrame(() => {
            iframe.classList.add("is-height-ready");
          });
        }
      }
    }
  });
});
