// Toggle this if you spin up a mock API (see bottom).
// Leave as null to use the built-in extension remix page.
const REMIX_ENDPOINT = "http://localhost:3000/api/gentube-remixer";

// Show a toast notification on the current page
async function showToast(tabId, message, duration = 2000) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (msg, duration) => {
        // Remove any existing toast
        const existingToast = document.getElementById('gentube-remix-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'gentube-remix-toast';
        toast.textContent = msg;
        Object.assign(toast.style, {
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          background: 'rgba(0,0,0,0.85)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: '999999',
          transform: 'translateY(20px)',
          opacity: '0',
          transition: 'all 0.3s ease-out',
          maxWidth: '300px',
          textAlign: 'center',
        });
        
        document.body.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
          toast.style.transform = 'translateY(0)';
          toast.style.opacity = '1';
        });

        // Auto-remove after duration
        setTimeout(() => {
          toast.style.transform = 'translateY(20px)';
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, duration);
      },
      args: [message, duration],
    });
  } catch (error) {
    console.error('Failed to show toast:', error);
  }
}

// Install/Update handler
chrome.runtime.onInstalled.addListener(({ reason }) => {
  // Create context menu item
  chrome.contextMenus.create({
    id: 'remix-image',
    title: 'Remix in GenTube',
    contexts: ['image'],
  });
  
  // Show welcome message
  if (reason === 'install') {
    chrome.tabs.create({
      url: chrome.runtime.getURL('welcome.html')
    });
  }
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'remix-image' || !info.srcUrl) return;
  
  // Show loading state
  await showToast(tab.id, ' Launching GenTube Remixer...', 1500);
  
  const pageUrl = chrome.runtime.getURL('remix.html') +
    `?imageUrl=${encodeURIComponent(info.srcUrl)}`;
  
  try {
    // Open the remix page in a new tab
    const remixTab = await chrome.tabs.create({ 
      url: pageUrl,
      active: true 
    });
    
    // Optional: Focus the window if needed
    if (remixTab.windowId) {
      await chrome.windows.update(remixTab.windowId, { focused: true });
    }
  } catch (error) {
    console.error('Failed to open remix page:', error);
    await showToast(tab.id, ' Failed to open GenTube Remixer', 3000);
  }
});

// Handle messages from the popup/remix page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'downloadImage') {
    // Handle image downloads
    chrome.downloads.download({
      url: message.url,
      filename: `gentube-remix-${Date.now()}.jpg`,
      saveAs: true
    });
  } else if (message.action === 'shareImage') {
    // Handle sharing (could be extended with Web Share API)
    navigator.clipboard.writeText(message.url).then(() => {
      if (sender.tab && sender.tab.id) {
        showToast(sender.tab.id, ' Image URL copied to clipboard!');
      }
    });
  }
  return true; // Keep the message channel open for async response
});
