/* --------------------------------------------------------------------------
   Interactive Star Constellation Background Animation (Canvas 2D Context)
   Gold-accented nodes that connect when in proximity with interactive mouse hover
   -------------------------------------------------------------------------- */

export function initHeroParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationFrameId;

  // Particle Settings
  let particles = [];
  const particleCount = getParticleCountByWidth();
  const connectionDistance = 120;
  const mouse = {
    x: null,
    y: null,
    radius: 150
  };

  // Set sizing
  function resizeCanvas() {
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    
    // Re-initialize particles to fit new dimensions
    initParticles();
  }

  function getParticleCountByWidth() {
    const width = window.innerWidth;
    if (width < 480) return 30;
    if (width < 768) return 50;
    if (width < 1024) return 80;
    return 110;
  }

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.size = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.5 + 0.15;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce at boundaries
      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

      // Mouse interactive push/pull
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          
          // Gently push away
          this.x -= Math.cos(angle) * force * 0.6;
          this.y -= Math.sin(angle) * force * 0.6;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212, 175, 55, ${this.alpha})`;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    const count = getParticleCountByWidth();
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = (1 - dist / connectionDistance) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Draw connections to mouse
      if (mouse.x !== null && mouse.y !== null) {
        const dx = particles[i].x - mouse.x;
        const dy = particles[i].y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius) {
          const alpha = (1 - dist / mouse.radius) * 0.2;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.lineWidth = 1.0;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw subtle radial glow in center
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 10,
      canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
    );
    gradient.addColorStop(0, 'rgba(11, 15, 25, 0.1)');
    gradient.addColorStop(1, 'rgba(6, 9, 19, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
    }
    
    drawConnections();
    
    animationFrameId = requestAnimationFrame(animate);
  }

  // Listeners
  window.addEventListener('resize', resizeCanvas);
  
  const parent = canvas.parentElement;
  parent.addEventListener('mousemove', (e) => {
    const rect = parent.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  parent.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Init
  resizeCanvas();
  animate();

  // Return clean-up handler
  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resizeCanvas);
  };
}

// Auto-execute if module loaded directly without import bind
document.addEventListener('DOMContentLoaded', () => {
  initHeroParticles();
});
