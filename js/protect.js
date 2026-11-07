(function () {
    "use strict";

    function isEditable(element) {
        return element && (
            element.tagName === "INPUT" ||
            element.tagName === "TEXTAREA" ||
            element.isContentEditable
        );
    }

    document.addEventListener("contextmenu", function (event) {
        if (!isEditable(event.target)) event.preventDefault();
    });

    document.addEventListener("copy", function (event) {
        event.preventDefault();
        if (event.clipboardData) event.clipboardData.setData("text/plain", "");
    });

    document.addEventListener("cut", function (event) {
        event.preventDefault();
    });

    document.addEventListener("dragstart", function (event) {
        event.preventDefault();
    });

    document.addEventListener("selectstart", function (event) {
        if (!isEditable(event.target)) event.preventDefault();
    });

    document.addEventListener("keydown", function (event) {
        var key = (event.key || "").toLowerCase();
        var modifierPressed = event.ctrlKey || event.metaKey;

        if (key === "f12") {
            event.preventDefault();
            return;
        }

        if (modifierPressed && event.shiftKey &&
            (key === "i" || key === "j" || key === "c" || key === "k")) {
            event.preventDefault();
            return;
        }

        if (modifierPressed &&
            (key === "s" || key === "u" || key === "c" ||
             key === "x" || key === "a" || key === "p")) {
            event.preventDefault();
        }
    }, true);

    setInterval(function () {
        try {
            console.clear();
        } catch (error) {
            // Some browsers may block console access.
        }
    }, 2000);

})();
