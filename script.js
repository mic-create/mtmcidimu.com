/**
 * MOTHER TERESA MEDICAL CENTRE - LUXURY HEALTHCARE SCRIPT
 * High-performance, vanilla JavaScript interactions and logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* ==========================================================================
       1. Navigation & Scroll Effects
       ========================================================================== */
    const header = document.getElementById('mainHeader');
    const scrollProgress = document.getElementById('scrollProgress');
    const backToTopBtn = document.getElementById('backToTop');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    const heroBg = document.querySelector('.hero-bg');

    // Debounce Utility for smooth scrolling & performance optimization
    function debounce(func, wait = 10, immediate = true) {
        let timeout;
        return function () {
            const context = this, args = arguments;
            const later = function () {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // Scroll Handler
    const handleScroll = () => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

        // Update Scroll Progress Bar
        if (docHeight > 0) {
            const progress = (scrollY / docHeight) * 100;
            scrollProgress.style.width = `${progress}%`;
        }

        // Header Background Solidify on Scroll
        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Back To Top Visibility
        if (scrollY > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

        // Parallax Effect on Hero Background
        if (heroBg && scrollY <= window.innerHeight) {
            heroBg.style.transform = `translateY(${scrollY * 0.3}px) scale(1.05)`;
        }

        // Active Navigation Highlighting
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 120;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', debounce(handleScroll, 10, false));

    // Smooth Scroll to Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();
                // Close mobile menu if open
                if (navMenu.classList.contains('active')) {
                    toggleMobileMenu();
                }

                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Back to Top Click
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    /* ==========================================================================
       2. Mobile Navigation Toggle
       ========================================================================== */
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    function toggleMobileMenu() {
        navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('open');

        // Animate hamburger to X
        const bars = mobileToggle.querySelectorAll('.bar');
        if (mobileToggle.classList.contains('open')) {
            bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            bars[1].style.opacity = '0';
            bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            bars[0].style.transform = 'none';
            bars[1].style.opacity = '1';
            bars[2].style.transform = 'none';
        }
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }

    /* ==========================================================================
       3. Intersection Observer for Scroll Reveal Animations
       ========================================================================== */
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserverOptions = {
        root: null,
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealObserverOptions);

    revealElements.forEach(el => revealObserver.observe(el));

    /* ==========================================================================
       4. Animated Counter Statistics
       ========================================================================== */
    const statNumbers = document.querySelectorAll('.stat-number');
    let animatedStats = false;

    const animateCounters = () => {
        statNumbers.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000; // Animation duration in milliseconds
            const stepTime = 20;
            const steps = duration / stepTime;
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    counter.textContent = target.toLocaleString();
                    clearInterval(timer);
                } else {
                    counter.textContent = Math.ceil(current).toLocaleString();
                }
            }, stepTime);
        });
    };

    const statsSection = document.querySelector('.stats');
    if (statsSection) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animatedStats) {
                    animateCounters();
                    animatedStats = true;
                }
            });
        }, { threshold: 0.4 });

        statsObserver.observe(statsSection);
    }

    /* ==========================================================================
       5. Patient Testimonial Carousel
       ========================================================================== */
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    let currentSlide = 0;
    let carouselInterval;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        
        if (index >= slides.length) {
            currentSlide = 0;
        } else if (index < 0) {
            currentSlide = slides.length - 1;
        } else {
            currentSlide = index;
        }

        slides[currentSlide].classList.add('active');
    }

    function startCarousel() {
        carouselInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 6000);
    }

    function resetCarousel() {
        clearInterval(carouselInterval);
        startCarousel();
    }

    if (prevBtn && nextBtn && slides.length > 0) {
        nextBtn.addEventListener('click', () => {
            showSlide(currentSlide + 1);
            resetCarousel();
        });

        prevBtn.addEventListener('click', () => {
            showSlide(currentSlide - 1);
            resetCarousel();
        });

        startCarousel();
    }

    /* ==========================================================================
       6. Luxury UI Micro-Interactions & Effects
       ========================================================================== */

    // Button Ripple Effect
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            const circle = document.createElement('span');
            const diameter = Math.max(this.clientWidth, this.clientHeight);
            const radius = diameter / 2;

            const rect = this.getBoundingClientRect();
            circle.style.width = circle.style.height = `${diameter}px`;
            circle.style.left = `${e.clientX - rect.left - radius}px`;
            circle.style.top = `${e.clientY - rect.top - radius}px`;
            circle.classList.add('ripple');

            const ripple = this.getElementsByClassName('ripple')[0];
            if (ripple) {
                ripple.remove();
            }

            this.appendChild(circle);
        });
    });

    // Card Subtle 3D Tilt Effect for Luxury Feel
    const tiltCards = document.querySelectorAll('.feature-card, .quick-card, .doctor-card');
    
    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });

    /* ==========================================================================
       7. Appointment Form Handling & Validation
       ========================================================================== */
    const appointmentForm = document.getElementById('appointmentForm');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const submitBtn = appointmentForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            submitBtn.textContent = 'Processing Booking...';
            submitBtn.disabled = true;

            setTimeout(() => {
                alert('Thank you for choosing Mother Teresa Medical Centre. Your consultation request has been received. Our executive desk will contact you shortly.');
                appointmentForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 1500);
        });
    }

    /* Dynamic CSS for JS Micro-Interactions */
    const style = document.createElement('style');
    style.innerHTML = `
        .btn { position: relative; overflow: hidden; }
        .ripple {
            position: absolute;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});

/* ==========================================================================
   Hero Background Slideshow Logic
   ========================================================================== */
const heroSlides = document.querySelectorAll('.hero-slide');
let currentHeroSlide = 0;
const heroSlideInterval = 5000; // Change image every 5 seconds

function nextHeroSlide() {
    if (heroSlides.length === 0) return;

    // Remove active class from current slide
    heroSlides[currentHeroSlide].classList.remove('active');

    // Move to next slide (loop back to 0 at the end)
    currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;

    // Add active class to new slide
    heroSlides[currentHeroSlide].classList.add('active');
}

// Start auto-rotation if there are multiple slides
if (heroSlides.length > 1) {
    setInterval(nextHeroSlide, heroSlideInterval);
}
