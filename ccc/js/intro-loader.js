document.addEventListener("DOMContentLoaded", function() {
    const loaderWrap = document.querySelector('.intro-loader-wrap');
    
    // Only run if the loader wrapper exists
    if (!loaderWrap) return;

    const foodImages = [
        'images/food/1.jpg', 'images/food/2.jpg', 'images/food/3.jpg', 
        'images/food/4.jpg', 'images/food/5.jpg', 'images/food/6.jpg',
        'images/food/7.jpg', 'images/food/8.jpg', 'images/food/9.jpg',
        'images/food/10.jpg'
    ];
    
    const drinkImages = [
        'images/drinks/1.jpg', 'images/drinks/2.jpg', 'images/drinks/3.jpg',
        'images/drinks/4.jpg', 'images/drinks/5.jpg', 'images/drinks/6.jpg',
        'images/drinks/7.jpg', 'images/drinks/8.jpg', 'images/drinks/9.jpg',
        'images/drinks/10.jpg'
    ];

    // Combine and shuffle
    const allImages = [...foodImages, ...drinkImages].sort(() => 0.5 - Math.random());
    
    // Select 6 images as requested
    const selectedImages = allImages.slice(0, 6);
    
    // Preload images to prevent layout jumps
    const preloadImages = (urls) => {
        const promises = urls.map(url => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = resolve;
                img.onerror = resolve; // Continue even if error
            });
        });
        return Promise.all(promises);
    };

    preloadImages(selectedImages).then(() => {
        let delay = 400; // Start delay
        const interval = 800; // Slower interval for a more relaxed pace
        
        selectedImages.forEach((src, index) => {
            setTimeout(() => {
                const img = document.createElement('img');
                img.src = src;
                img.classList.add('intro-item');
                
                // No rotation
                img.style.setProperty('--rotation', `0deg`);
                
                // Reduced random offset to keep images on screen
                // Range: -50px to +50px
                const offsetX = Math.floor(Math.random() * 100) - 50;
                const offsetY = Math.floor(Math.random() * 100) - 50;
                
                // Use margins for offset
                img.style.marginLeft = `${offsetX}px`;
                img.style.marginTop = `${offsetY}px`;
                
                loaderWrap.appendChild(img);
                
                // Trigger reflow
                void img.offsetWidth;
                
                img.classList.add('visible');
                
            }, delay);
            
            delay += interval;
        });
        
        // Finish animation
        const totalTime = delay + 800; // Wait a bit after last image
        
        setTimeout(() => {
            loaderWrap.classList.add('fade-out');
            
            // Reveal main content
            const mainContent = document.getElementById('main');
            if (mainContent) {
                mainContent.style.opacity = 1;
            }
            
            // Remove loader from DOM after fade out
            setTimeout(() => {
                loaderWrap.style.display = 'none';
            }, 800);
            
        }, totalTime);
    });
});
