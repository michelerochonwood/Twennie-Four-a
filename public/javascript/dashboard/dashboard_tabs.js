document.addEventListener("DOMContentLoaded", function () {
  const allTabs = document.querySelectorAll(".dashboard-tab, .profile-tab");
  const allContents = document.querySelectorAll(".dashboard-tab-content, .profile-tab-content");

  allTabs.forEach(tab => {
    tab.addEventListener("click", function () {
      const target = this.getAttribute("data-tab");

      // Remove active from all
      allTabs.forEach(t => t.classList.remove("active"));
      allContents.forEach(c => c.classList.remove("active"));

      // Activate clicked tab and matching content
      this.classList.add("active");
      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });

  // Only reinforce what’s already marked active in the HTML — don’t override
  const defaultTab = document.querySelector(".dashboard-tab.active, .profile-tab.active");
  const defaultContentId = defaultTab?.getAttribute("data-tab");
  const defaultContent = defaultContentId ? document.getElementById(defaultContentId) : null;

  // Only one should have active
  allContents.forEach(c => c.classList.remove("active"));
  if (defaultTab && defaultContent) {
    defaultContent.classList.add("active");
  }
});


