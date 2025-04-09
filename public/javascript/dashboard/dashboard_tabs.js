document.addEventListener("DOMContentLoaded", function () {
    const allTabs = document.querySelectorAll(".dashboard-tab, .profile-tab");
    const allContents = document.querySelectorAll(".dashboard-tab-content, .profile-tab-content");

    allTabs.forEach(tab => {
        tab.addEventListener("click", function () {
            const target = this.getAttribute("data-tab");

            // Remove active class from all tabs and contents
            allTabs.forEach(t => t.classList.remove("active"));
            allContents.forEach(c => c.classList.remove("active"));

            // Add active class to clicked tab and corresponding content
            this.classList.add("active");
            document.getElementById(target).classList.add("active");
        });
    });

    // Activate the first tab by default if available
    if (allTabs.length > 0) {
        allTabs[0].classList.add("active");
        allContents[0].classList.add("active");
    }
});
