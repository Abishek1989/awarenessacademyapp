/**
 * DRM Protection Utilities
 * Client-side protection measures to prevent unauthorized downloading and copying
 * Note: These are deterrents, not foolproof solutions
 */

const DRMProtection = {
  /**
   * Disable right-click context menu
   */
  disableRightClick: function (element) {
    element.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      return false;
    });
  },

  /**
   * Disable text selection
   */
  preventTextSelection: function (element) {
    element.style.userSelect = "none";
    element.style.webkitUserSelect = "none";
    element.style.mozUserSelect = "none";
    element.style.msUserSelect = "none";
  },

  /**
   * Disable common keyboard shortcuts
   */
  disableKeyboardShortcuts: function () {
    document.addEventListener("keydown", (e) => {
      // Prevent Ctrl+S (Save)
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+P (Print)
      if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        return false;
      }

      // Prevent F12 (Developer Tools)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === "I") {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.key === "J") {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+U (View Source)
      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        return false;
      }
    });
  },

  /**
   * Add watermark overlay
   */
  addWatermark: function (container, username) {
    const watermark = document.createElement("div");
    watermark.id = "drm-watermark";
    watermark.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 3rem;
            color: rgba(0, 0, 0, 0.1);
            pointer-events: none;
            user-select: none;
            z-index: 9999;
            white-space: nowrap;
            font-weight: bold;
        `;
    watermark.textContent = username;
    container.style.position = "relative";
    container.appendChild(watermark);

    return watermark;
  },

  /**
   * Add small corner watermark with username and timestamp
   */
  addCornerWatermark: function (container, username) {
    const watermark = document.createElement("div");
    watermark.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 0.85rem;
            pointer-events: none;
            user-select: none;
            z-index: 9999;
        `;

    const now = new Date();
    const timestamp = now.toLocaleString();
    watermark.innerHTML = `
            <div style="font-weight: 600;">${username}</div>
            <div style="font-size: 0.75rem; opacity: 0.8;">${timestamp}</div>
        `;

    container.style.position = "relative";
    container.appendChild(watermark);

    return watermark;
  },

  /**
   * Fetch secure file with authentication
   * Returns a usable URL for video/iframe/etc without downloading it as a Blob
   */
  fetchSecureFile: async function (moduleId, fileUrl = null) {
    // If we already have the URL and it's a direct link (e.g. Cloudflare R2)
    if (fileUrl && fileUrl.startsWith("http")) {
      return {
        blobUrl: fileUrl,
        cleanup: () => { },
      };
    }

    // For local files or if fileUrl isn't provided, use the backend endpoint
    // but instead of fetching a blob, we return the endpoint URL with an auth token
    const token = localStorage.getItem('token');
    const secureUrl = `${Auth.apiBase}/secure-files/${moduleId}?token=${token}`;

    return {
      blobUrl: secureUrl,
      cleanup: () => { }, // No cleanup needed for direct URLs
    };
  },

  /**
   * Detect if developer tools are open (optional, can be annoying for users)
   */
  detectDevTools: function (callback) {
    const threshold = 160;

    const check = () => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        callback(true);
      } else {
        callback(false);
      }
    };

    setInterval(check, 1000);
  },

  /**
   * Disable video download button (some browsers show this)
   */
  disableVideoDownload: function (videoElement) {
    videoElement.setAttribute("controlsList", "nodownload");
    videoElement.setAttribute("disablePictureInPicture", "true");

    // Prevent download via right-click on video
    this.disableRightClick(videoElement);
  },

  /**
   * Apply full DRM protection to an element
   */
  applyFullProtection: function (element, username) {
    this.disableRightClick(element);
    this.preventTextSelection(element);
    this.disableKeyboardShortcuts();
    this.addWatermark(element, username);

    // Add transparent overlay to prevent some screen capture markers
    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: transparent;
            pointer-events: none;
            z-index: 999;
        `;
    element.style.position = "relative";
    element.appendChild(overlay);
  },
};

// Make available globally
window.DRMProtection = DRMProtection;
