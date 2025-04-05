// Widget Loader Script
(function() {
  // Get configuration from script tag
  const defaultConfig = {
    primaryColor: '#2563eb',
    secondaryColor: '#f3f4f6',
    borderRadius: '1rem',
    width: '300px',
    position: 'right',
    tools: ['search', 'points', 'fees', 'docs']
  };

  const config = Object.assign({}, defaultConfig, window.OCCUPATION_SEARCH_CONFIG || {});

  // Create widget container
  const container = document.createElement('div');
  container.id = 'occupation-widget-container';
  Object.assign(container.style, {
    position: 'fixed',
    [config.position]: '20px',
    bottom: '20px',
    width: config.width,
    zIndex: '9999',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  });

  // Create widget button
  const button = document.createElement('button');
  button.id = 'occupation-widget-button';
  Object.assign(button.style, {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: config.primaryColor,
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s',
    marginLeft: 'auto'
  });
  button.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

  // Create widget content
  const content = document.createElement('div');
  content.id = 'occupation-widget-content';
  Object.assign(content.style, {
    background: 'white',
    borderRadius: config.borderRadius,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    marginTop: '1rem',
    overflow: 'hidden',
    display: 'none',
    animation: 'slideUp 0.3s ease-out'
  });

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Create iframe for widget content
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    width: '100%',
    height: '600px',
    border: 'none'
  });

  // Get the script URL to determine the domain
  const scriptElement = document.currentScript;
  const scriptUrl = scriptElement ? scriptElement.src : '';
  const scriptDomain = scriptUrl ? new URL(scriptUrl).origin : '';
  
  // Set iframe src using the same domain as the script
  iframe.src = `${scriptDomain}/widget.html`;
  
  content.appendChild(iframe);

  // Toggle widget visibility
  button.onclick = () => {
    const isVisible = content.style.display === 'block';
    content.style.display = isVisible ? 'none' : 'block';
    button.innerHTML = isVisible 
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  };

  // Add hover effects
  button.onmouseover = () => button.style.transform = 'scale(1.1)';
  button.onmouseout = () => button.style.transform = 'scale(1)';

  // Assemble and add widget to page
  container.appendChild(button);
  container.appendChild(content);
  document.body.appendChild(container);
})();