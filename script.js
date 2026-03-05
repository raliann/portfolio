document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("loaded");
});

document.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");

        if (href && !href.startsWith("#")) {
            e.preventDefault();

            document.body.classList.remove("loaded");

            setTimeout(() => {
                window.location.href = href;
            }, 250); // faster
        }
    });
});
function scalePhone() {
    const phone = document.getElementById("iphoneFrame");
    if (!phone) return;

    const baseHeight = 880;
    const baseWidth = 430;

    const availableHeight = window.innerHeight - 160;
    const availableWidth = window.innerWidth / 2;

    const scaleByHeight = availableHeight / baseHeight;
    const scaleByWidth = availableWidth / baseWidth;

    const scale = Math.min(scaleByHeight, scaleByWidth, 1);

    phone.style.transform = `scale(${scale})`;
}

window.addEventListener("load", scalePhone);
window.addEventListener("resize", scalePhone);