/**
 * MOTHER TERESA MEDICAL CENTRE - LUXURY HEALTHCARE SCRIPT
 * High-performance, vanilla JavaScript interactions and logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const heroSlides = document.querySelectorAll('.hero-slide');
    const heroTextSlides = document.querySelectorAll('.hero-text-slide');
    const heroDots = document.querySelectorAll('.hero-dot');
    const prevBtn = document.getElementById('heroPrev');
    const nextBtn = document.getElementById('heroNext');
    
    let currentHeroIndex = 0;
    let heroSlideInterval;
    const intervalTime = 6000; // 6 seconds per slide

    function updateHeroSlide(index) {
        // Boundary checks
        if (index >= heroSlides.length) {
            currentHeroIndex = 0;
        } else if (index < 0) {
            currentHeroIndex = heroSlides.length - 1;
        } else {
            currentHeroIndex = index;
        }

        // Remove active classes
        heroSlides.forEach(slide => slide.classList.remove('active'));
        heroTextSlides.forEach(text => text.classList.remove('active'));
        heroDots.forEach(dot => dot.classList.remove('active'));

        // Add active class to current index elements
        heroSlides[currentHeroIndex].classList.add('active');
        if (heroTextSlides[currentHeroIndex]) {
            heroTextSlides[currentHeroIndex].classList.add('active');
        }
        if (heroDots[currentHeroIndex]) {
            heroDots[currentHeroIndex].classList.add('active');
        }
    }

    function nextHeroSlide() {
        updateHeroSlide(currentHeroIndex + 1);
    }

    function prevHeroSlide() {
        updateHeroSlide(currentHeroIndex - 1);
    }

    function startHeroTimer() {
        heroSlideInterval = setInterval(nextHeroSlide, intervalTime);
    }

    function resetHeroTimer() {
        clearInterval(heroSlideInterval);
        startHeroTimer();
    }

    // Event Listeners for Arrows
    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => {
            nextHeroSlide();
            resetHeroTimer();
        });

        prevBtn.addEventListener('click', () => {
            prevHeroSlide();
            resetHeroTimer();
        });
    }

    // Event Listeners for Dots
    heroDots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            updateHeroSlide(idx);
            resetHeroTimer();
        });
    });

    // Initialize auto-rotation if slides exist
    if (heroSlides.length > 0) {
        startHeroTimer();
    }
});

    /* ==========================================================================
       2. Navigation & Scroll Effects
       ========================================================================== */
    const header = document.getElementById('mainHeader');
    const scrollProgress = document.getElementById('scrollProgress');
    const backToTopBtn = document.getElementById('backToTop');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

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

    const handleScroll = () => {
        const scrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

        if (docHeight > 0) {
            const progress = (scrollY / docHeight) * 100;
            scrollProgress.style.width = `${progress}%`;
        }

        if (scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        if (scrollY > 400) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }

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

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                e.preventDefault();
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

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    /* ==========================================================================
       3. Mobile Navigation Toggle
       ========================================================================== */
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    function toggleMobileMenu() {
        navMenu.classList.toggle('active');
        mobileToggle.classList.toggle('open');

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
       4. Intersection Observer for Scroll Reveal Animations
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
       5. Animated Counter Statistics
       ========================================================================== */
    const statNumbers = document.querySelectorAll('.stat-number');
    let animatedStats = false;

    const animateCounters = () => {
        statNumbers.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000;
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
       6. Patient Testimonial Carousel
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