// Define slides content array - correcting the paths if needed
const slides = [
    'slides/slide1.html',  // Εισαγωγή
    'slides/slide2.html',  // Τι είναι παιχνιδοποίηση - Ορισμός
    'slides/slide3.html',  // Βασικά Στοιχεία Παιχνιδοποίησης
    'slides/slide4.html',  // Μορφές Παιχνιδοποίησης
    'slides/slide5.html',  // Οφέλη της Παιχνιδοποίησης
    'slides/slide6.html',  // Παράδειγμα 1: Οι Μαθηματικοί Εξερευνητές
    'slides/slide7.html',  // Παράδειγμα 2: Η Λεξιμαχία των Ηρώων
    'slides/slide8.html',  // Παράδειγμα 3: Ταξίδι στον Χρόνο
    'slides/slide9.html',  // Συμπεράσματα
];

// Track the current slide
let currentSlide = 0;
let slideLoaded = new Array(slides.length).fill(false);
let navigationLocked = false;

// DOM elements
const slidesContainer = document.getElementById('slides-container');
const progressBar = document.getElementById('progress-bar');
const progressDots = document.getElementById('progress-dots');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// Initialize the presentation
function initPresentation() {
    console.log("Initializing presentation");
    
    // Create progress dots
    createProgressDots();
    
    // Load initial slides (first slide and preload next)
    loadSlide(0, true);
    loadSlide(1, false);
    
    // Set up event listeners
    setupEventListeners();
    
    // Enable emergency navigation with keyboard shortcut (Ctrl+E)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'e') {
            toggleEmergencyNav();
        }
    });
    
    // Initial page load adjustments
    setTimeout(() => {
        adjustContentForViewport();
    }, 500);
}

// Create dots for navigation
function createProgressDots() {
    progressDots.innerHTML = '';
    
    for (let i = 0; i < slides.length; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot';
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('data-index', i);
        dot.addEventListener('click', () => goToSlide(i));
        progressDots.appendChild(dot);
    }
}

// Load a specific slide
function loadSlide(index, makeActive = false) {
    if (index < 0 || index >= slides.length || slideLoaded[index]) return;
    
    console.log(`Loading slide ${index + 1}`);
    
    // Create slide container
    const slide = document.createElement('div');
    slide.className = 'slide';
    if (makeActive) slide.classList.add('active');
    slide.id = `slide-${index + 1}`;
    
    // Load slide content
    fetch(slides[index])
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load slide ${index + 1}`);
            }
            return response.text();
        })
        .then(html => {
            slide.innerHTML = html;
            slidesContainer.appendChild(slide);
            slideLoaded[index] = true;
            console.log(`Slide ${index + 1} loaded successfully`);
            
            // If this is the active slide, initialize its content
            if (makeActive) {
                initializeSlideContent(slide);
            }
            
            // Preload next slide if it exists
            const nextIndex = index + 1;
            if (nextIndex < slides.length && !slideLoaded[nextIndex]) {
                setTimeout(() => {
                    loadSlide(nextIndex, false);
                }, 300);
            }
        })
        .catch(error => {
            console.error(`Error loading slide ${index + 1}:`, error);
            slide.innerHTML = `<div class="container"><h2>Error Loading Slide ${index + 1}</h2><p>${error.message}</p></div>`;
            slidesContainer.appendChild(slide);
            slideLoaded[index] = true; // Mark as loaded even if error
        });
}

// Initialize the content of a slide (animations, etc.)
function initializeSlideContent(slide) {
    // Find elements with data-animate attribute
    const animatedElements = slide.querySelectorAll('[data-animate]');
    
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Show all elements immediately without animation
        animatedElements.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
    } else {
        // Apply animations with staggered timing
        animatedElements.forEach((el, index) => {
            const animationType = el.getAttribute('data-animate') || 'fadeIn';
            setTimeout(() => {
                el.classList.add(animationType);
            }, index * 150);
        });
    }
    
    // Handle reveal elements (start hidden)
    slide.querySelectorAll('.reveal-element').forEach(el => {
        el.classList.remove('visible');
    });
    
    // Dispatch custom event for slide-specific initialization
    const event = new CustomEvent('slideInitialized', {
        bubbles: true,
        detail: { slideIndex: currentSlide }
    });
    slide.dispatchEvent(event);
    
    // Adjust content sizing
    adjustContentForViewport();
}

// Set up event listeners
function setupEventListeners() {
    // Navigation buttons
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (navigationLocked) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                prevSlide();
                e.preventDefault();
                break;
            case 'ArrowRight':
            case ' ': // Space key
                nextSlide();
                e.preventDefault();
                break;
            case 'Home':
                goToSlide(0);
                e.preventDefault();
                break;
            case 'End':
                goToSlide(slides.length - 1);
                e.preventDefault();
                break;
        }
    });
    
    // Touch navigation
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        
        // Calculate swipe distance
        const swipeDistance = touchEndX - touchStartX;
        
        // Only register deliberate swipes (over 50px)
        if (Math.abs(swipeDistance) > 50) {
            if (swipeDistance < 0) {
                nextSlide(); // Swipe left
            } else {
                prevSlide(); // Swipe right
            }
        }
    }, { passive: true });
    
    // Handle window resize
    window.addEventListener('resize', debounce(adjustContentForViewport, 300));
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(adjustContentForViewport, 300);
    });
}

// Debounce function to prevent rapid firing of events
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Go to previous slide
function prevSlide() {
    if (currentSlide > 0 && !navigationLocked) {
        goToSlide(currentSlide - 1);
    }
}

// Go to next slide
function nextSlide() {
    if (currentSlide < slides.length - 1 && !navigationLocked) {
        // Check if the current slide has reveal elements that aren't visible yet
        const currentSlideElement = document.getElementById(`slide-${currentSlide + 1}`);
        if (currentSlideElement) {
            const hiddenElements = currentSlideElement.querySelectorAll('.reveal-element:not(.visible)');
            
            if (hiddenElements.length > 0) {
                // Show the next hidden element instead of changing slides
                hiddenElements[0].classList.add('visible');
                
                // Announce for screen readers
                announceForScreenReader("Revealing next element");
                return;
            }
        }
        
        // If no more hidden elements, go to next slide
        goToSlide(currentSlide + 1);
    }
}

// Go to a specific slide
function goToSlide(index) {
    if (index < 0 || index >= slides.length || navigationLocked) return;
    
    // Lock navigation during transition
    navigationLocked = true;
    
    // Load the slide if not already loaded
    if (!slideLoaded[index]) {
        loadSlide(index, false);
        setTimeout(() => attemptSlideTransition(index), 500);
    } else {
        attemptSlideTransition(index);
    }
}

// Try to transition to the specified slide
function attemptSlideTransition(index) {
    // Check if slide is loaded
    const targetSlide = document.getElementById(`slide-${index + 1}`);
    
    if (!targetSlide) {
        console.error(`Slide ${index + 1} not found, retrying...`);
        if (!slideLoaded[index]) {
            loadSlide(index, false);
            setTimeout(() => attemptSlideTransition(index), 500);
        }
        return;
    }
    
    // Hide current slide
    document.querySelectorAll('.slide').forEach(slide => {
        slide.classList.remove('active');
    });
    
    // Show target slide
    targetSlide.classList.add('active');
    
    // Update current slide
    currentSlide = index;
    
    // Update progress indicators
    updateProgress();
    
    // Initialize slide content
    initializeSlideContent(targetSlide);
    
    // Load adjacent slides for faster navigation
    if (index > 0 && !slideLoaded[index - 1]) {
        loadSlide(index - 1, false);
    }
    if (index < slides.length - 1 && !slideLoaded[index + 1]) {
        loadSlide(index + 1, false);
    }
    
    // Announce slide change for screen readers
    announceForScreenReader(`Slide ${index + 1} of ${slides.length}`);
    
    // Unlock navigation after transition
    setTimeout(() => {
        navigationLocked = false;
    }, 500);
}

// Update progress indicators
function updateProgress() {
    // Update progress bar
    const progress = (currentSlide / (slides.length - 1)) * 100;
    progressBar.style.width = `${progress}%`;
    
    // Update dots
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
    
    // Update button states
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === slides.length - 1;
}

// Adjust content based on viewport size
function adjustContentForViewport() {
    const currentSlideElement = document.getElementById(`slide-${currentSlide + 1}`);
    if (!currentSlideElement) return;
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check if we're in portrait or landscape mode
    const isPortrait = viewportHeight > viewportWidth;
    
    // Apply appropriate classes to body
    document.body.classList.toggle('portrait', isPortrait);
    document.body.classList.toggle('landscape', !isPortrait);
    
    // Find scrollable containers
    const scrollContainers = currentSlideElement.querySelectorAll('.scrollable-content, .implementation-container, .roadmap-column, .phases-column, .tips-column');
    
    scrollContainers.forEach(container => {
        // Reset height first
        container.style.maxHeight = '';
        
        // Calculate maximum allowed height (80% of viewport)
        const maxHeight = viewportHeight * 0.8;
        
        // If content is taller than allowed, make it scrollable
        if (container.scrollHeight > maxHeight) {
            container.style.maxHeight = `${maxHeight}px`;
            container.style.overflowY = 'auto';
            
            // Add smooth scrolling for iOS
            container.style.webkitOverflowScrolling = 'touch';
        }
    });
    
    // Notify the slide of viewport adjustment
    try {
        const event = new CustomEvent('viewportAdjusted', {
            detail: {
                width: viewportWidth,
                height: viewportHeight,
                isPortrait: isPortrait
            }
        });
        currentSlideElement.dispatchEvent(event);
    } catch (e) {
        console.error('Error dispatching viewport event:', e);
    }
}

// Progressive reveal of elements
function revealNextElement() {
    const currentSlideElement = document.getElementById(`slide-${currentSlide + 1}`);
    if (!currentSlideElement) return false;
    
    const hiddenElements = currentSlideElement.querySelectorAll('.reveal-element:not(.visible)');
    
    if (hiddenElements.length > 0) {
        hiddenElements[0].classList.add('visible');
        return true;
    }
    
    return false;
}

// Screen reader announcement
function announceForScreenReader(message) {
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
        announcer.textContent = message;
    }
}

// Toggle emergency navigation panel
function toggleEmergencyNav() {
    const nav = document.getElementById('emergency-nav');
    nav.style.display = nav.style.display === 'none' || nav.style.display === '' ? 'block' : 'none';
}

// Force jump to slide (emergency navigation)
function forceJumpToSlide(slideNumber) {
    const index = slideNumber - 1;
    
    if (index < 0 || index >= slides.length) return;
    
    // Force load the slide if needed
    if (!slideLoaded[index]) {
        loadSlide(index, false);
    }
    
    setTimeout(() => {
        // Find the slide element
        const targetSlide = document.getElementById(`slide-${slideNumber}`);
        
        if (targetSlide) {
            // Hide all slides
            document.querySelectorAll('.slide').forEach(slide => {
                slide.classList.remove('active');
            });
            
            // Show the target slide
            targetSlide.classList.add('active');
            
            // Update current slide and progress
            currentSlide = index;
            updateProgress();
            
            // Initialize the slide content
            initializeSlideContent(targetSlide);
            
            // Announce the change
            announceForScreenReader(`Emergency navigation: Jumped to slide ${slideNumber}`);
        } else {
            console.error(`Emergency navigation failed: Slide ${slideNumber} not found`);
            // Try again
            loadSlide(index, true);
        }
    }, 300);
}

// Functions for individual slides interaction
window.changeTab = function(tabName, event) {
    // Get all tab content elements
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Hide all tabs
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-content`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Highlight clicked tab
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    // Adjust content after tab change
    setTimeout(adjustContentForViewport, 100);
};

// Make functions available globally
window.goToSlide = goToSlide;
window.prevSlide = prevSlide;
window.nextSlide = nextSlide;
window.revealNextElement = revealNextElement;
window.adjustContentForViewport = adjustContentForViewport;
window.forceJumpToSlide = forceJumpToSlide;
window.toggleEmergencyNav = toggleEmergencyNav;

// Initialize presentation when DOM is loaded
document.addEventListener('DOMContentLoaded', initPresentation);