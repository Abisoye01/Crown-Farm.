(() => {
    "use strict";

    const products = {
        "farm-chicken": "Farm Chicken",
        broilers: "Broiler Chickens",
        chicks: "Day-old Chicks",
        duck: "Farm Duck",
        "guinea-fowl": "Guinea Fowl"
    };
    const whatsappNumber = "2348033398683";
    const storageKey = "crownFarmEnquiry";
    const buildEnquiryMessage = (items) => [
        "Hello Crown Farm, I would like to enquire about:",
        ...items.map(([id, quantity]) => `- ${products[id]} (quantity: ${quantity})`)
    ].join("\n");
    const readCart = () => {
        try {
            const stored = JSON.parse(localStorage.getItem(storageKey) || "{}");
            if (!stored || Array.isArray(stored) || typeof stored !== "object") return {};
            return Object.fromEntries(Object.entries(stored).filter(([id, quantity]) =>
                Object.hasOwn(products, id) && Number.isInteger(quantity) && quantity > 0
            ));
        } catch (error) {
            console.error("Could not read the enquiry basket.", error);
            return {};
        }
    };
    const saveCart = (cart) => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(cart));
        } catch (error) {
            console.error("Could not save the enquiry basket.", error);
            showMessage("Your browser could not save this basket. Please check your storage settings.");
            return false;
        }
        updateCartCount(cart);
        return true;
    };
    const updateCartCount = (cart) => {
        const count = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
        document.querySelectorAll(".cart-count").forEach((element) => {
            element.textContent = String(count);
        });
    };
    const showMessage = (message) => {
        const toast = document.querySelector(".toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        window.clearTimeout(showMessage.timeout);
        showMessage.timeout = window.setTimeout(() => toast.classList.remove("show"), 2800);
    };
    const cart = readCart();
    updateCartCount(cart);
    const year = document.getElementById("currentYear");
    if (year) year.textContent = String(new Date().getFullYear());

    document.querySelectorAll("[data-add-cart]").forEach((button) => {
        button.addEventListener("click", () => {
            const id = button.dataset.addCart;
            if (!Object.hasOwn(products, id)) {
                showMessage("That product could not be added. Please refresh and try again.");
                return;
            }
            cart[id] = (cart[id] || 0) + 1;
            if (saveCart(cart)) showMessage(`${products[id]} added to your enquiry basket.`);
        });
    });

    const filterButtons = document.querySelectorAll("[data-filter]");
    const productCards = document.querySelectorAll(".product-card[data-category]");
    const productCount = document.querySelector(".product-count");
    const emptyFilter = document.querySelector(".empty-filter");
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter;
            let visible = 0;
            productCards.forEach((card) => {
                const show = filter === "all" || card.dataset.category === filter;
                card.hidden = !show;
                if (show) visible += 1;
            });
            filterButtons.forEach((item) => {
                const active = item === button;
                item.classList.toggle("active", active);
                item.setAttribute("aria-pressed", String(active));
            });
            if (productCount) productCount.textContent = `${visible} ${visible === 1 ? "product" : "products"}`;
            if (emptyFilter) emptyFilter.hidden = visible !== 0;
        });
    });

    const newsletter = document.getElementById("emailCaptureForm");
    if (newsletter) {
        newsletter.addEventListener("submit", (event) => {
            event.preventDefault();
            if (!newsletter.reportValidity()) return;
            const status = document.getElementById("newsletterStatus");
            if (status) status.textContent = "Thanks for your interest! Newsletter sign-up is not connected yet.";
            newsletter.reset();
        });
    }

    const cartContents = document.getElementById("cartContents");
    const cartActions = document.getElementById("cartActions");
    const cartStatus = document.getElementById("cartStatus");
    const whatsappEnquiry = document.getElementById("whatsappEnquiry");
    if (cartContents) {
        const renderCart = () => {
            const items = Object.entries(cart);
            cartActions.hidden = items.length === 0;
            if (whatsappEnquiry) {
                const message = buildEnquiryMessage(items);
                whatsappEnquiry.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            }
            if (items.length === 0) {
                cartContents.innerHTML = '<div class="empty-cart"><span aria-hidden="true">✳</span><h2>Your basket is waiting.</h2><p>Browse our products and add anything you would like to ask us about.</p><a class="button button-dark" href="index.html#products">Browse products <span aria-hidden="true">→</span></a></div>';
                return;
            }
            cartContents.innerHTML = items.map(([id, quantity]) =>
                `<article class="cart-item"><div><p class="product-type">PRODUCT ENQUIRY</p><h2>${products[id]}</h2></div><span class="cart-quantity">Quantity: ${quantity}</span><button class="remove-item" type="button" data-remove-item="${id}" aria-label="Remove ${products[id]}">Remove</button></article>`
            ).join("");
            cartContents.querySelectorAll("[data-remove-item]").forEach((button) => {
                button.addEventListener("click", () => {
                    delete cart[button.dataset.removeItem];
                    if (saveCart(cart)) {
                        if (cartStatus) cartStatus.textContent = `${products[button.dataset.removeItem]} removed from your enquiry.`;
                        renderCart();
                    }
                });
            });
        };
        renderCart();

        document.getElementById("clearCart")?.addEventListener("click", () => {
            Object.keys(cart).forEach((id) => delete cart[id]);
            if (saveCart(cart)) {
                if (cartStatus) cartStatus.textContent = "Your enquiry basket has been cleared.";
                renderCart();
            }
        });
        document.getElementById("copyEnquiry")?.addEventListener("click", async () => {
            const message = buildEnquiryMessage(Object.entries(cart));
            try {
                await navigator.clipboard.writeText(message);
                if (cartStatus) cartStatus.textContent = "Enquiry copied. Paste it into a message to Crown Farm.";
            } catch (error) {
                console.error("Could not copy the enquiry.", error);
                if (cartStatus) cartStatus.textContent = "Could not copy automatically. Please select and copy your enquiry.";
                const textArea = document.createElement("textarea");
                textArea.value = message;
                textArea.readOnly = true;
                textArea.className = "copy-fallback";
                textArea.setAttribute("aria-label", "Your enquiry text");
                cartContents.append(textArea);
                textArea.focus();
                textArea.select();
            }
        });
    }
})();
