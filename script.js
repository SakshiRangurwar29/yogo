
document.addEventListener("DOMContentLoaded", function () {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  const form = document.getElementById("postForm");
  const journalGrid = document.getElementById("journalGrid");
  const mediaInput = document.getElementById("postMedia");

  // Toggle mobile nav
  navToggle.addEventListener("click", () => {
    navMenu.classList.toggle("active");
  });

  // Scroll animation
  const fadeSections = document.querySelectorAll(".fade-in-on-scroll");
  function checkFadeIn() {
    const triggerBottom = window.innerHeight * 0.85;
    fadeSections.forEach(section => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < triggerBottom) {
        section.classList.add("visible");
      }
    });
  }
  window.addEventListener("scroll", checkFadeIn);
  checkFadeIn();

  // Open IndexedDB
  let db;
  const request = indexedDB.open("ObsidianJournalDB", 1);

  request.onupgradeneeded = function (e) {
    db = e.target.result;
    db.createObjectStore("posts", { keyPath: "id", autoIncrement: true });
  };

  request.onsuccess = function (e) {
    db = e.target.result;
    loadPosts();
  };

  request.onerror = function (e) {
    console.error("DB error:", e.target.errorCode);
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const title = document.getElementById("postTitle").value;
    const content = document.getElementById("postContent").value;
    const author = document.getElementById("postAuthor").value;
    const mediaFile = mediaInput.files[0];
    const dateStr = new Date().toLocaleDateString("en-GB");

    const reader = new FileReader();

    reader.onload = function (event) {
      const newPost = {
        title,
        content,
        author,
        date: dateStr,
        media: mediaFile ? event.target.result : null,
        mediaType: mediaFile ? mediaFile.type : null,
      };

      const tx = db.transaction("posts", "readwrite");
      const store = tx.objectStore("posts");
      store.add(newPost);

      tx.oncomplete = function () {
        renderCard(newPost);
        form.reset();
      };
    };

    if (mediaFile) {
      reader.readAsDataURL(mediaFile);
    } else {
      reader.onload();
    }
  });

  function loadPosts() {
    const tx = db.transaction("posts", "readonly");
    const store = tx.objectStore("posts");
    const request = store.getAll();

    request.onsuccess = function () {
      request.result.reverse().forEach(post => renderCard(post));
    };
  }

  function renderCard(post) {
    const card = document.createElement("div");
    card.className = "card";

    let mediaHTML = "";
    if (post.mediaType?.startsWith("image")) {
      mediaHTML = `<img src="${post.media}" alt="Post Image">`;
    } else if (post.mediaType?.startsWith("video")) {
      mediaHTML = `
        <video controls>
          <source src="${post.media}" type="video/mp4">
          Your browser does not support the video tag.
        </video>`;
    }

    card.innerHTML = `
      ${mediaHTML}
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <div class="meta">
        <span>Date: ${post.date}</span>
        <span>by ${post.author}</span>
      </div>
      <button class="delete-btn">Delete</button>
    `;

    card.querySelector(".delete-btn").addEventListener("click", () => {
      const tx = db.transaction("posts", "readwrite");
      const store = tx.objectStore("posts");
      const keyRequest = store.getAllKeys();

      keyRequest.onsuccess = function () {
        const keys = keyRequest.result;
        for (let i = 0; i < keys.length; i++) {
          store.get(keys[i]).onsuccess = function (e) {
            const item = e.target.result;
            if (
              item.title === post.title &&
              item.content === post.content &&
              item.date === post.date &&
              item.author === post.author
            ) {
              store.delete(keys[i]);
              card.remove();
              return;
            }
          };
        }
      };
    });

    journalGrid.prepend(card);
  }
}); // ✅ This was missing in your original code
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const author = document.getElementById("postAuthor").value.trim();
  if (!localStorage.getItem("currentAuthor")) {
    localStorage.setItem("currentAuthor", author);
  }

  // ... rest of your form submission logic
});
