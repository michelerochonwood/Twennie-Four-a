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
      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });

  // Respect the active tab/content already set in HTML
  const defaultTab = document.querySelector(".dashboard-tab.active, .profile-tab.active");
  const defaultContentId = defaultTab?.getAttribute("data-tab");
  const defaultContent = defaultContentId ? document.getElementById(defaultContentId) : null;

  if (defaultTab && defaultContent) {
    defaultTab.classList.add("active");
    defaultContent.classList.add("active");
  }
});

