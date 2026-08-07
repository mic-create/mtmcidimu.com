/**
 * MOTHER TERESA MEDICAL CENTRE - LUXURY HEALTHCARE SCRIPT
 * High-performance, vanilla JavaScript interactions and logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* ==========================================================================
       1. Synchronized Hero Background & Text Slideshow Logic
       ========================================================================== */
    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroTextSlides = document.querySelectorAll('.hero-text-slide');
    let currentHeroIndex = 0;
    const heroSlideInterval = 5000; // Switch image & text every 5 seconds

    function switchHeroSlide() {
        if (heroSlides.length === 0 || heroTextSlides.length === 0) return;

        heroSlides[currentHeroIndex].classList.remove('active');
        heroTextSlides[currentHeroIndex].classList.remove('active');

        currentHeroIndex = (currentHeroIndex + 1) % heroSlides.length;

        heroSlides[currentHeroIndex].classList.add('active');
        if (heroTextSlides[currentHeroIndex]) {
            heroTextSlides[currentHeroIndex].classList.add('active');
        }
    }

    if (heroSlides.length > 1) {
        setInterval(switchHeroSlide, heroSlideInterval);
    }

    /* ==========================================================================
       2. Sticky Header Glass Effect & Scroll Progress Bar
       ========================================================================== */
    const header = document.getElementById('mainHeader');
    const scrollProgress = document.getElementById('scrollProgress');
    const backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        
        if (scrollProgress) {
            scrollProgress.style.width = `${progress}%`;
        }

        if (window.scrollY > 100) {
            header.classList.add('scrolled');
            if (backToTopBtn) backToTopBtn.style.display = 'block';
        } else {
            header.classList.remove('scrolled');
            if (backToTopBtn) backToTopBtn.style.display = 'none';
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ==========================================================================
       3. Mobile Navigation Drawer Toggle
       ========================================================================== */
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileToggle.classList.toggle('open');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggle.classList.remove('open');
            });
        });
    }

    /* ==========================================================================
       4. Scroll-Triggered Reveal Animations
       ========================================================================== */
    const revealElements = document.querySelectorAll('.reveal');

    function checkReveal() {
        const triggerBottom = window.innerHeight * 0.85;

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;

            if (elementTop < triggerBottom) {
                element.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', checkReveal);
    checkReveal();

    /* ==========================================================================
       5. Animated Statistics Counter
       ========================================================================== */
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    function startCounter() {
        const statsSection = document.querySelector('.stats');
        if (!statsSection) return;

        const sectionPos = statsSection.getBoundingClientRect().top;
        const screenPos = window.innerHeight;

        if (sectionPos < screenPos && !animated) {
            animated = true;
            statNumbers.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const speed = 200;
                const increment = target / speed;

                let count = 0;
                const updateCount = () => {
                    count += increment;
                    if (count < target) {
                        counter.innerText = Math.ceil(count);
                        setTimeout(updateCount, 15);
                    } else {
                        counter.innerText = target.toLocaleString();
                    }
                };

                updateCount();
            });
        }
    }

    window.addEventListener('scroll', startCounter);

    /* ==========================================================================
       6. Testimonials Carousel
       ========================================================================== */
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.getElementById('prevTestimonial');
    const nextBtn = document.getElementById('nextTestimonial');
    let currentSlide = 0;
    let carouselInterval;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        currentSlide = (index + slides.length) % slides.length;
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
       7. Micro-Interactions & Form Handling
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
});