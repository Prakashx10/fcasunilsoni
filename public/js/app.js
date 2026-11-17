/* --------------------------------------------------------------------------
   SUNIL KUMAR SONI & CO. - Core Application JS
   Handles dynamic data loading, transitions, tab systems, and form processing.
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  initMobileNav();

  // Scroll events (Sticky Header & Active Link tracking)
  initScrollEffects();

  // Fetch and Load Dynamic Data
  fetchAndRenderData();

  // Initialize Contact Form Validation & Mock Submission
  initContactForm();
});

/* ==========================================================================
   1. Mobile Navigation Menu Toggle
   ========================================================================== */
function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!navToggle || !navMenu) return;

  // Toggle open class on button click
  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navMenu.classList.toggle('open');
    navToggle.classList.toggle('active');
    
    // Toggle bar animations
    const bars = navToggle.querySelectorAll('.bar');
    if (navMenu.classList.contains('open')) {
      bars[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
      bars[1].style.opacity = '0';
      bars[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
    } else {
      bars[0].style.transform = 'none';
      bars[1].style.opacity = '1';
      bars[2].style.transform = 'none';
    }
  });

  // Close menu when clicking links
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('open')) {
        navToggle.click();
      }
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && e.target !== navToggle) {
      navToggle.click();
    }
  });
}

/* ==========================================================================
   2. Sticky Header & Active Link Tracking
   ========================================================================== */
function initScrollEffects() {
  const header = document.getElementById('header');
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-menu .nav-link');

  window.addEventListener('scroll', () => {
    // 2.1 Sticky header styling
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // 2.2 Active link tracking
    let current = '';
    const scrollPos = window.scrollY + 120; // Offset for sticky header

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   3. Fetch & Render Dynamic Data from data.json
   ========================================================================== */
async function fetchAndRenderData() {
  try {
    const response = await fetch('/data/data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Render firm identity properties
    renderIdentity(data);
    
    // Render Statistics
    renderStats(data.stats);

    // Render About section
    renderAbout(data.about);

    // Render Services Tabs
    renderServices(data.services);

    // Render Testimonials
    renderTestimonials(data.testimonials);

    // Render FAQs Accordion
    renderFAQs(data.faqs);

    // Render Contact desk & Maps
    renderContact(data.contact);

    // Initialize Scroll Reveal Animations AFTER data rendering is complete
    initScrollReveal();

  } catch (err) {
    console.error('Error fetching CA data.json database:', err);
    // Display error message placeholder to users
    document.getElementById('dyn-values-list').innerHTML = `
      <div style="color: var(--accent-red); padding: 20px; border: 1px solid var(--accent-red); border-radius: 8px;">
        <i class="fas fa-exclamation-triangle"></i> Failed to retrieve dynamic site configuration. Please refresh the page.
      </div>
    `;
  }
}

// 3.1 Render identities
function renderIdentity(data) {
  // Logo & Headers
  document.getElementById('dyn-firm-name-logo').textContent = data.firmName;
  document.getElementById('dyn-firm-subtitle-logo').textContent = data.title;
  document.getElementById('dyn-hero-title').textContent = data.firmName;
  document.getElementById('dyn-hero-subtitle').textContent = data.title;
  document.getElementById('dyn-hero-tagline').textContent = data.tagline;
  
  // Footer Brand name
  document.getElementById('dyn-footer-name').textContent = data.firmName;
}

// 3.2 Render Statistics
function renderStats(stats) {
  const container = document.getElementById('dyn-stats-grid');
  if (!container || !stats) return;

  container.innerHTML = stats.map(stat => `
    <div class="stat-card scroll-reveal">
      <h4 class="stat-value">${stat.value}</h4>
      <p class="stat-label">${stat.label}</p>
    </div>
  `).join('');
}

// 3.3 Render About Content & Values
function renderAbout(about) {
  if (!about) return;
  
  document.getElementById('dyn-about-welcome').textContent = about.welcome;
  document.getElementById('dyn-about-intro').textContent = about.intro;
  document.getElementById('dyn-about-mission').textContent = about.mission;

  const valuesContainer = document.getElementById('dyn-values-list');
  if (valuesContainer && about.values) {
    valuesContainer.innerHTML = about.values.map(val => `
      <div class="value-item">
        <h4><i class="fas fa-gem"></i> ${val.title}</h4>
        <p>${val.desc}</p>
      </div>
    `).join('');
  }
}

// 3.4 Render Services (Interactive Tab Switcher)
let servicesCache = []; // Store services list in global closure to support tab switching
function renderServices(services) {
  const tabsContainer = document.getElementById('dyn-services-tabs');
  const displayPanel = document.getElementById('dyn-services-display');
  
  if (!tabsContainer || !displayPanel || !services || services.length === 0) return;
  servicesCache = services;

  // Render Left tabs list
  tabsContainer.innerHTML = services.map((service, index) => `
    <button class="service-tab-btn ${index === 0 ? 'active' : ''}" data-service-id="${service.id}" onclick="switchServiceTab('${service.id}', this)">
      <div class="service-tab-btn-left">
        <i class="${service.icon}"></i>
        <span>${service.title}</span>
      </div>
      <span class="service-tab-btn-arrow"><i class="fas fa-chevron-right"></i></span>
    </button>
  `).join('');

  // Render default active service details (index 0)
  displayActiveService(services[0].id);
}

// Global scope binder to switch tabs
window.switchServiceTab = function(serviceId, buttonElement) {
  // Clear active tab styles
  const buttons = document.querySelectorAll('.service-tab-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Mark clicked button active
  buttonElement.classList.add('active');

  // Display details panel with smooth fade in
  const panel = document.getElementById('dyn-services-display');
  panel.style.opacity = '0';
  panel.style.transform = 'translateY(10px)';

  setTimeout(() => {
    displayActiveService(serviceId);
    panel.style.opacity = '1';
    panel.style.transform = 'translateY(0)';
  }, 200);
};

function displayActiveService(serviceId) {
  const displayPanel = document.getElementById('dyn-services-display');
  const service = servicesCache.find(s => s.id === serviceId);
  if (!displayPanel || !service) return;

  displayPanel.innerHTML = `
    <div class="service-display-content">
      <div class="service-display-header">
        <span class="service-display-icon"><i class="${service.icon}"></i></span>
        <h3 class="service-display-title">${service.title}</h3>
      </div>
      <p class="service-display-desc">${service.description}</p>
      <div class="service-display-divider"></div>
      <h4 class="sub-list-title">Core Offerings:</h4>
      <ul class="service-display-items">
        ${service.items.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `;
}

// 3.5 Render Testimonials
function renderTestimonials(testimonials) {
  const container = document.getElementById('dyn-testimonials-grid');
  if (!container || !testimonials) return;

  container.innerHTML = testimonials.map(item => `
    <div class="testimonial-card scroll-reveal">
      <span class="quote-icon"><i class="fas fa-quote-right"></i></span>
      <p>"${item.quote}"</p>
      <div class="testimonial-author">
        <h5>${item.author}</h5>
        <span>${item.role}</span>
      </div>
    </div>
  `).join('');
}

// 3.6 Render FAQs Accordion
function renderFAQs(faqs) {
  const container = document.getElementById('dyn-faq-accordion');
  if (!container || !faqs) return;

  container.innerHTML = faqs.map(faq => `
    <div class="faq-item">
      <div class="faq-header" onclick="toggleFaqAccordion(this)">
        <h4>${faq.question}</h4>
        <span class="faq-icon"><i class="fas fa-chevron-down"></i></span>
      </div>
      <div class="faq-body">
        <div class="faq-content">
          <p>${faq.answer}</p>
        </div>
      </div>
    </div>
  `).join('');
}

// Accordion click handler
window.toggleFaqAccordion = function(headerElement) {
  const faqItem = headerElement.parentElement;
  const faqBody = faqItem.querySelector('.faq-body');
  const isActive = faqItem.classList.contains('active');

  // Collapse other active accordion items
  const activeItems = document.querySelectorAll('.faq-item.active');
  activeItems.forEach(item => {
    if (item !== faqItem) {
      item.classList.remove('active');
      item.querySelector('.faq-body').style.maxHeight = '0px';
      item.querySelector('.faq-body').style.opacity = '0';
    }
  });

  // Toggle current item
  if (!isActive) {
    faqItem.classList.add('active');
    faqBody.style.maxHeight = faqBody.scrollHeight + 'px';
    faqBody.style.opacity = '1';
  } else {
    faqItem.classList.remove('active');
    faqBody.style.maxHeight = '0px';
    faqBody.style.opacity = '0';
  }
};

// 3.7 Render Contact & Footer addresses
function renderContact(contact) {
  if (!contact) return;

  // Address
  const fullAddr = contact.address.fullAddress;
  document.getElementById('dyn-contact-address').textContent = fullAddr;
  document.getElementById('dyn-footer-address').textContent = `${contact.address.city}, ${contact.address.district}, C.G.`;

  // Phones
  const phoneListHtml = contact.phones.map(ph => `
    <p><a href="tel:${ph.value}"><i class="fas fa-phone-alt"></i> ${ph.display}</a></p>
  `).join('');
  document.getElementById('dyn-contact-phones').innerHTML = phoneListHtml;
  document.getElementById('dyn-footer-phone').textContent = contact.phones[0].display;

  // Emails
  const emailListHtml = contact.emails.map(em => `
    <p><a href="mailto:${em}"><i class="fas fa-envelope"></i> ${em}</a></p>
  `).join('');
  document.getElementById('dyn-contact-emails').innerHTML = emailListHtml;
  document.getElementById('dyn-footer-email').textContent = contact.emails[0];

  // Working hours
  document.getElementById('dyn-contact-hours').innerHTML = `
    <i class="fas fa-calendar-alt"></i> ${contact.workingHours}
  `;

  // Embed map container
  const mapContainer = document.getElementById('dyn-map-container');
  if (mapContainer && contact.mapEmbedUrl) {
    mapContainer.innerHTML = `
      <iframe 
        src="${contact.mapEmbedUrl}" 
        width="100%" 
        height="100%" 
        style="border:0;" 
        allowfullscreen="" 
        loading="lazy" 
        referrerpolicy="no-referrer-when-downgrade">
      </iframe>
    `;
  }
}

/* ==========================================================================
   4. Scroll Reveal IntersectionObserver
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.scroll-reveal');
  
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Once revealed, no need to keep observing
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));
}

/* ==========================================================================
   5. Contact Form Validation & Mock Submit
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('enquiryForm');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalServiceName = document.getElementById('modal-service-name');
  
  const modalWhatsappBtn = document.getElementById('modalWhatsappBtn');
  
  if (!form || !successModal || !closeModalBtn) return;

  const submitBtn = form.querySelector('.btn-submit');
  const submitBtnText = submitBtn.querySelector('span');
  const submitBtnIcon = submitBtn.querySelector('i');

  // Form Fields
  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('emailAddr');
  const phoneInput = document.getElementById('phoneNum');
  const serviceSelect = document.getElementById('serviceType');
  const messageInput = document.getElementById('enquiryMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let isValid = true;

    // Reset error classes
    document.querySelectorAll('.form-group').forEach(grp => grp.classList.remove('invalid'));

    // 5.1 Name validation
    if (nameInput.value.trim().length < 3) {
      nameInput.parentElement.classList.add('invalid');
      isValid = false;
    }

    // 5.2 Email validation (simple regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      emailInput.parentElement.classList.add('invalid');
      isValid = false;
    }

    // 5.3 Phone number validation (10 digit format)
    const phoneVal = phoneInput.value.replace(/\D/g, ''); // strip non-numeric
    if (phoneVal.length < 10) {
      phoneInput.parentElement.classList.add('invalid');
      isValid = false;
    }

    // 5.4 Service select validation
    if (!serviceSelect.value) {
      serviceSelect.parentElement.classList.add('invalid');
      isValid = false;
    }

    // 5.5 Message validation
    if (messageInput.value.trim().length < 10) {
      messageInput.parentElement.classList.add('invalid');
      isValid = false;
    }

    // Process submission if valid
    if (isValid) {
      try {
        // Toggle loading state on button and disable form inputs
        submitBtn.disabled = true;
        submitBtnText.textContent = 'Sending...';
        submitBtnIcon.className = 'fas fa-spinner fa-spin';
        
        const payload = {
          fullName: nameInput.value.trim(),
          emailAddr: emailInput.value.trim(),
          phoneNum: phoneInput.value.trim(),
          serviceType: serviceSelect.value,
          enquiryMessage: messageInput.value.trim()
        };

        const selectedOptionText = serviceSelect.options[serviceSelect.selectedIndex].text;

        // Post enquiry data to server
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Server error occurred.');
        }

        // 1. Construct client-side WhatsApp "Click to Chat" URL (Option A)
        // Sunil Kumar Soni & Co Target: +91 81097 06200 (digits-only: 918109706200)
        const targetPhone = '918109706200';
        const waMessage = `Hello SUNIL KUMAR SONI & CO., I have submitted a website enquiry.\n\n` +
                          `*Name*: ${payload.fullName}\n` +
                          `*Phone*: ${payload.phoneNum}\n` +
                          `*Email*: ${payload.emailAddr}\n` +
                          `*Service*: ${selectedOptionText}\n` +
                          `*Message*: ${payload.enquiryMessage}`;
        const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(waMessage)}`;

        // Set the WhatsApp button target and show it in the modal
        if (modalWhatsappBtn) {
          modalWhatsappBtn.href = waUrl;
          modalWhatsappBtn.style.display = 'inline-flex';
        }



        // 3. Update success modal service heading
        if (modalServiceName) {
          modalServiceName.textContent = selectedOptionText;
        }

        // 4. Trigger success modal display
        successModal.classList.add('open');

        // 5. Reset form
        form.reset();

      } catch (err) {
        console.error('Error submitting contact form:', err);
        alert(`Failed to send message: ${err.message || 'Please check your connection and try again.'}`);
      } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtnText.textContent = 'Send Message';
        submitBtnIcon.className = 'fas fa-paper-plane';
      }
    }
  });

  // Modal close trigger
  closeModalBtn.addEventListener('click', () => {
    successModal.classList.remove('open');
  });

  // Click overlay background to close
  successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
      successModal.classList.remove('open');
    }
  });
}
