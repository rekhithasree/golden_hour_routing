// Intersection Observer for scroll animations
document.addEventListener("DOMContentLoaded", () => {
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: stop observing once it's revealed
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => {
        observer.observe(el);
    });

    // Animate metrics on load if in view
    const animateValue = (obj, start, end, duration, suffix = "") => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Easing
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * (end - start) + start);
            obj.innerHTML = current + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end + suffix;
            }
        };
        window.requestAnimationFrame(step);
    };

    // Trigger metrics animation when section is reached
    const metricsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const values = entry.target.querySelectorAll('.metric-value');
                // Hardcoded the animation matching the static text in HTML
                animateValue(values[0], 100, 0, 2000, "%");
                animateValue(values[1], 0, -30, 2000, "m");
                animateValue(values[2], 0, 100, 2000, "%");
                metricsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const metricsSection = document.querySelector('.metrics');
    if (metricsSection) {
        metricsObserver.observe(metricsSection);
    }
});
