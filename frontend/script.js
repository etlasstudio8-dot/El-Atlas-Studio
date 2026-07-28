
        const API = 'https://el-atlas-studio.onrender.com/api';

        // ── THEME ──
        function toggleTheme() { const h = document.documentElement, c = h.getAttribute('data-theme') || 'light', n = c === 'light' ? 'dark' : 'light'; h.setAttribute('data-theme', n); localStorage.setItem('theme', n); updateThemeIcon(n) }
        function updateThemeIcon(t) { const i = document.getElementById('themeIcon'); i.innerHTML = t === 'dark' ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>' : '<circle cx="12" cy="12" r="5"/><path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"/>' }
        const st = localStorage.getItem('theme') || 'light'; document.documentElement.setAttribute('data-theme', st); updateThemeIcon(st);

        // ── MOBILE NAV ──
        function toggleMobileNav() { const n = document.getElementById('mobileNav'), o = document.getElementById('navOverlay'), h = document.getElementById('hamburger'); n.classList.toggle('open'); o.classList.toggle('open'); h.classList.toggle('open'); document.body.style.overflow = n.classList.contains('open') ? 'hidden' : '' }
        function closeMobileNav() { document.getElementById('mobileNav').classList.remove('open'); document.getElementById('navOverlay').classList.remove('open'); document.getElementById('hamburger').classList.remove('open'); document.body.style.overflow = '' }

        // ── LOADER ──
        (function () {
            const loader = document.getElementById('loader');
            setTimeout(() => loader.classList.add('ldr-drawing'), 100);
            setTimeout(() => loader.classList.add('ldr-filled'), 1700);
            setTimeout(() => loader.classList.add('ldr-revealed'), 2100);
            setTimeout(() => loader.classList.add('ldr-ready'), 2500);
            setTimeout(() => loader.classList.add('ldr-shining'), 3000);
            setTimeout(() => loader.classList.add('ldr-floating'), 3500);
            setTimeout(() => { loader.style.opacity = '0'; loader.style.pointerEvents = 'none'; setTimeout(() => loader.style.display = 'none', 800) }, 4200);
        })();

        // ── CURSOR ──
        const cur = document.getElementById('cursor'), ring = document.getElementById('cursor-ring');
        const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        if (!isTouch) {
            let cx = 0, cy = 0, rx = 0, ry = 0;
            document.addEventListener('mousemove', e => { cx = e.clientX; cy = e.clientY; cur.style.left = cx + 'px'; cur.style.top = cy + 'px' });
            (function raf() { rx += (cx - rx) * 0.12; ry += (cy - ry) * 0.12; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(raf) })();
        }

        // ── SCROLL ──
        window.addEventListener('scroll', () => {
            const h = document.documentElement, pct = window.scrollY / (h.scrollHeight - h.clientHeight) * 100;
            document.getElementById('scroll-progress').style.width = pct + '%';
            document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
            document.getElementById('back-top').classList.toggle('show', window.scrollY > 400);
            document.querySelectorAll('.reveal').forEach(el => { if (el.getBoundingClientRect().top < window.innerHeight - 60) el.classList.add('visible') });
            document.querySelectorAll('.stat-num[data-target]').forEach(el => {
                if (el.getBoundingClientRect().top < window.innerHeight && !el.dataset.done) {
                    el.dataset.done = 1; const t = +el.dataset.target, suf = t >= 10 ? '+' : ''; let c = 0, step = Math.max(t / 50, 0.1);
                    const iv = setInterval(() => { c += step; if (c >= t) { c = t; clearInterval(iv) } el.textContent = Math.floor(c) + suf }, 20);
                }
            });
        }, { passive: true });
        window.dispatchEvent(new Event('scroll'));

        // ── FAQ ──
        function toggleFaq(item) { const open = item.classList.contains('open'); document.querySelectorAll('.faq-item.open').forEach(i => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = '0' }); if (!open) { item.classList.add('open'); item.querySelector('.faq-a').style.maxHeight = (item.querySelector('.faq-a-inner').scrollHeight + 28) + 'px' } }

        // ── PORTFOLIO FILTER ──
        function filterPort(btn, cat) { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); document.querySelectorAll('#pgrid .project-card').forEach(c => { const m = cat === 'all' || c.dataset.cat === cat; c.style.transition = 'opacity 0.3s,transform 0.3s'; c.style.opacity = m ? '1' : '0.15'; c.style.transform = m ? 'scale(1)' : 'scale(0.96)'; c.style.pointerEvents = m ? 'auto' : 'none' }) }

        // ── CONTACT ──
        async function submitContact(btn) {
            const fname = document.getElementById('cf-fname').value.trim();
            const lname = document.getElementById('cf-lname').value.trim();
            const email = document.getElementById('cf-email').value.trim();
            const phone = document.getElementById('cf-phone').value.trim();
            const service = document.getElementById('cf-service').value;
            const message = document.getElementById('cf-message').value.trim();
            if (!fname || !email || !message) { alert('Please fill in required fields.'); return; }
            const orig = btn.textContent; btn.textContent = 'Sending...'; btn.style.opacity = '0.6'; btn.disabled = true;
            try {
                const res = await fetch(`${API}/contacts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${fname} ${lname}`.trim(), email, phone, service, message }) });
                if (res.ok) { btn.textContent = 'Message Sent! ✓'; btn.style.background = '#22c55e';['cf-fname', 'cf-lname', 'cf-email', 'cf-phone', 'cf-message'].forEach(id => document.getElementById(id).value = ''); document.getElementById('cf-service').value = ''; }
                else { btn.textContent = 'Error. Try Again.'; btn.style.background = '#ef4444'; }
            } catch (e) { btn.textContent = 'Error. Try Again.'; btn.style.background = '#ef4444'; }
            btn.style.opacity = '1'; btn.disabled = false;
            setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 4000);
        }

        async function subscribeNL(btn) {
            const email = document.getElementById('nl-email').value.trim();
            if (!email) return;
            const orig = btn.textContent; btn.textContent = 'Subscribing...'; btn.disabled = true;
            try {
                const res = await fetch(`${API}/subscribers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
                if (res.status === 409) { btn.textContent = 'Already Subscribed!'; btn.style.background = '#f59e0b'; }
                else if (res.ok) { btn.textContent = 'Subscribed! ✓'; btn.style.background = '#22c55e'; document.getElementById('nl-email').value = ''; }
                else { btn.textContent = 'Error. Try Again.'; btn.style.background = '#ef4444'; }
            } catch (e) { btn.textContent = 'Error. Try Again.'; btn.style.background = '#ef4444'; }
            btn.disabled = false;
            setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 4000);
        }

        // ── CURSOR INTERACTIONS ──
        function initCursorInteractions() {
            if (isTouch) return;
            document.querySelectorAll('button,a,.service-card,.team-card,.blog-card,.project-card,.faq-q,.filter-btn,.social-btn,.f-social,.hv-card,.mobile-nav-link').forEach(el => {
                el.addEventListener('mouseenter', () => { cur.style.transform = 'translate(-50%,-50%) scale(2.5)'; ring.style.width = '52px'; ring.style.height = '52px' });
                el.addEventListener('mouseleave', () => { cur.style.transform = 'translate(-50%,-50%) scale(1)'; ring.style.width = '34px'; ring.style.height = '34px' });
            });
        }

        // ── HELPER ──
        function cv(arr, key, fallback = '') { const item = arr.find(i => i.key === key); return item ? (item.content || item.value || fallback) : fallback; }

        // ── APPLY CONTENT ──
        function applyContent(arr) {
            if (!Array.isArray(arr) || !arr.length) return;
            const heroHeadline = cv(arr, 'hero_headline'); if (heroHeadline) document.getElementById('hero-title').innerHTML = heroHeadline;
            const heroSub = cv(arr, 'hero_subtitle'); if (heroSub) document.getElementById('hero-sub').textContent = heroSub;
            const aboutTitle = cv(arr, 'about_founded_year'); if (aboutTitle) document.getElementById('about-title').innerHTML = `Crafting Digital Excellence<br>Since ${aboutTitle}`;
            const aboutDesc = cv(arr, 'about_description'); if (aboutDesc) document.getElementById('about-desc').textContent = aboutDesc;
            const sp = cv(arr, 'stat_projects', '10'), sc = cv(arr, 'stat_clients', '9'), sy = cv(arr, 'stat_years', '1'), sa = cv(arr, 'stat_awards', '8');
            document.getElementById('stats-grid').innerHTML = `
  <div class="stat-item reveal"><div class="stat-num" data-target="${sp}">${sp}</div><div class="stat-label">Projects Delivered</div></div>
  <div class="stat-item reveal reveal-delay-1"><div class="stat-num" data-target="${sc}">${sc}</div><div class="stat-label">Happy Clients</div></div>
  <div class="stat-item reveal reveal-delay-2"><div class="stat-num" data-target="${sy}">${sy}</div><div class="stat-label">Years of Excellence</div></div>
  <div class="stat-item reveal reveal-delay-3"><div class="stat-num" data-target="${sa}">${sa}</div><div class="stat-label">Industry Awards</div></div>`;
            if (document.getElementById('as-projects')) document.getElementById('as-projects').textContent = sp + '+';
            if (document.getElementById('as-clients')) document.getElementById('as-clients').textContent = sc + '+';
            if (document.getElementById('as-years')) document.getElementById('as-years').textContent = sy + '+';
            const email = cv(arr, 'contact_email'), phone = cv(arr, 'contact_phone'), location = cv(arr, 'contact_location');
            if (email) { document.getElementById('contact-email').textContent = email; document.getElementById('footer-email').textContent = email; document.getElementById('footer-email').href = 'mailto:' + email; }
            if (phone) {
                document.getElementById('contact-phone').textContent = phone; document.getElementById('footer-phone').textContent = phone;
                const digits = phone.replace(/\D/g, '');
                const waLink = document.getElementById('whatsapp-link');
                if (digits) { waLink.href = `https://wa.me/${digits}`; waLink.style.display = 'inline-flex'; }
            }
            if (location) { document.getElementById('contact-location').textContent = location; document.getElementById('footer-location').textContent = location; }
            const ctaSub = document.getElementById('cta-sub');
            if (ctaSub && sc) ctaSub.textContent = `Join ${sc}+ satisfied clients who trust EL ATLAS Studio to deliver world-class digital solutions.`;
            window.dispatchEvent(new Event('scroll'));
        }

        // ── RENDER SERVICES ──
        function renderServices(items) {
            const active = items.filter(s => s.status !== 'inactive');
            if (!active.length) { document.getElementById('services-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary)">No services found.</div>'; return; }
            const svgMap = { web: '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M8 21h8M12 16v5"/>', software: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>', video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>', social: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>', brand: '<circle cx="12" cy="12" r="10"/><path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"/>', design: '<circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>', marketing: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', default: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>' };
            document.getElementById('services-grid').innerHTML = active.map((s, i) => {
                const cat = (s.category || '').toLowerCase();
                const icon = svgMap[cat] || svgMap.default;
                const num = String(i + 1).padStart(2, '0');
                const feats = Array.isArray(s.features) ? s.features.slice(0, 4).map(f => `<li>${typeof f === 'string' ? f : (f.title || f)}</li>`).join('') : '';
                const price = s.pricing && s.pricing.startingPrice ? `<div class="service-price-row"><span class="service-from">Starting from</span><span class="service-price">$${s.pricing.startingPrice}</span></div>` : '';
                const delay = i % 3 === 1 ? ' reveal-delay-1' : i % 3 === 2 ? ' reveal-delay-2' : '';
                return `<div class="service-card reveal${delay}"><div class="service-icon-wrap"><svg viewBox="0 0 24 24">${icon}</svg></div><div class="service-num">${num}</div><h3 class="service-name">${s.name || s.title || ''}</h3><p class="service-desc">${s.description || ''}</p>${feats ? `<ul class="service-features">${feats}</ul>` : ''}${price}<div class="service-cta">Get Started <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 6.5h9M8 3l3 3.5-3 3"/></svg></div></div>`;
            }).join('');
            document.getElementById('footer-services').innerHTML = active.slice(0, 5).map(s => `<li><a href="#services">${s.name || s.title || ''}</a></li>`).join('');
        }

        // ── RENDER PORTFOLIO ──
        function renderPortfolio(items) {
            const published = items.filter(p => p.status !== 'archived' && p.status !== 'draft');
            if (!published.length) { document.getElementById('pgrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary)">No projects yet.</div>'; return; }
            const catLabel = { web: 'Web Development', software: 'Software', brand: 'Branding', video: 'Video Editing', design: 'UI/UX Design', marketing: 'Digital Marketing', other: 'Other' };
            const VISIBLE_INIT = 5;
            const cards = published.map((p, idx) => {
                const imgUrl = p.mainImage && p.mainImage.url ? p.mainImage.url : (p.image || '');
                const cat = p.category || 'web'; const label = catLabel[cat] || cat;
                const isFeatured = idx === 0; const isHidden = idx >= VISIBLE_INIT;
                const featuredClass = isFeatured ? ' featured' : ''; const hiddenClass = isHidden ? ' extra-hidden' : '';
                const descLen = isFeatured ? 160 : 90;
                return `<div class="project-card${featuredClass}${hiddenClass}" data-cat="${cat}" data-index="${idx}">${imgUrl ? `<div class="project-bg" style="background-image:url('${imgUrl}');background-size:cover;background-position:center top"></div>` : `<div class="project-no-image">${(p.title || '').charAt(0)}</div>`}<div class="project-overlay"></div><div class="project-info"><div class="project-cat">${label}</div><div class="project-name" style="${isFeatured ? 'font-size:22px' : ''}">${p.title || ''}</div><div class="project-desc">${(p.description || '').slice(0, descLen)}${(p.description || '').length > descLen ? '...' : ''}</div>${p.projectUrl ? `<div class="project-link"><a href="${p.projectUrl}" target="_blank" style="color:var(--red);text-decoration:none;display:flex;align-items:center;gap:6px;">View Project <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 5.5h9M6 2l3.5 3.5L6 9"/></svg></a></div>` : ''}</div></div>`;
            });
            const showMoreBtn = published.length > VISIBLE_INIT ? `<div class="portfolio-show-more"><button class="btn-show-more" id="showMoreBtn" onclick="toggleShowMore(this)">Show More Projects <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 5l5 5 5-5"/></svg></button></div>` : '';
            document.getElementById('pgrid').innerHTML = cards.join('') + showMoreBtn;
        }

        function toggleShowMore(btn) {
            const hidden = document.querySelectorAll('#pgrid .project-card.extra-hidden');
            const isExpanded = btn.classList.contains('expanded');
            if (!isExpanded) {
                hidden.forEach(c => { c.classList.remove('extra-hidden'); c.style.animation = 'fadeUp 0.5s ease both'; });
                btn.innerHTML = `Show Less <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 5l5 5 5-5"/></svg>`;
                btn.classList.add('expanded');
            } else {
                document.querySelectorAll('#pgrid .project-card').forEach(c => { const idx = parseInt(c.dataset.index); if (idx >= 5) c.classList.add('extra-hidden'); });
                btn.innerHTML = `Show More Projects <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 5l5 5 5-5"/></svg>`;
                btn.classList.remove('expanded');
                document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth' });
            }
        }

        // ── RENDER TEAM ──
        function renderTeam(items) {
            const active = items.filter(m => m.status !== 'inactive');
            if (!active.length) { document.getElementById('team-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary)">No team members found.</div>'; return; }
            const ini = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
            document.getElementById('team-grid').innerHTML = active.map((m, i) => {
                const delay = i % 3 === 1 ? ' reveal-delay-1' : i % 3 === 2 ? ' reveal-delay-2' : '';
                const photoUrl = m.image && m.image.url ? m.image.url : '';
                const skills = (m.expertise || []).slice(0, 4).map(s => `<span class="tc-skill-tag">${typeof s === 'string' ? s : (s.title || s)}</span>`).join('');
                const num = String(i + 1).padStart(2, '0');
                const socials = [];
                if (m.social) {
                    if (m.social.instagram) socials.push(`<a href="${m.social.instagram}" target="_blank" class="tc-social-btn"><svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>`);
                    if (m.social.linkedin) socials.push(`<a href="${m.social.linkedin}" target="_blank" class="tc-social-btn"><svg viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg></a>`);
                    if (m.social.github) socials.push(`<a href="${m.social.github}" target="_blank" class="tc-social-btn"><svg viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg></a>`);
                }
                return `<div class="team-card reveal${delay}">${photoUrl ? `<img class="tc-photo" src="${photoUrl}" alt="${m.name || ''}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}<div class="tc-fallback" style="${photoUrl ? 'display:none' : ''}">${ini(m.name)}</div><div class="tc-gradient"></div><div class="tc-red-line"></div><div class="tc-corner-num">${num}</div><div class="tc-content"><div class="tc-role">${m.position || ''}</div><div class="tc-name">${m.name || ''}</div>${skills ? `<div class="tc-skills">${skills}</div>` : ''}${socials.length ? `<div class="tc-socials">${socials.join('')}</div>` : ''}</div></div>`;
            }).join('');
        }

        // ── RENDER BLOG ──
        function renderBlog(items) {
            const published = items.filter(b => b.status === 'published' || !b.status).slice(0, 3);
            if (!published.length) { document.getElementById('blog-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary)">No blog posts yet.</div>'; return; }
            document.getElementById('blog-grid').innerHTML = published.map((b, i) => {
                const delay = i === 1 ? ' reveal-delay-1' : i === 2 ? ' reveal-delay-2' : '';
                const imgUrl = b.featuredImage && b.featuredImage.url ? b.featuredImage.url : (b.image || b.thumbnail || b.imageUrl || '');
                const dateStr = b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                const blogId = b._id || b.id || i;
                return `<a href="blog.html?id=${blogId}" class="blog-card reveal${delay}" style="text-decoration:none;color:inherit;display:block"><div class="blog-thumb">${imgUrl ? `<img src="${imgUrl}" alt="${b.title || ''}" loading="lazy" onerror="this.parentElement.style.background='var(--bg-tertiary)';this.style.display='none'">` : ''}<div class="blog-thumb-overlay"></div><div class="blog-cat">${b.category || 'Blog'}</div></div><div class="blog-body"><div class="blog-meta"><span>${dateStr}</span></div><h3 class="blog-title">${b.title || ''}</h3><p class="blog-excerpt">${(b.excerpt || b.summary || '').slice(0, 120)}${(b.excerpt || b.summary || '').length > 120 ? '...' : ''}</p><div class="blog-readmore">Read Article <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1 5.5h9M6 2l3.5 3.5L6 9"/></svg></div></div></a>`;
            }).join('');
        }

        // ── MAIN LOAD ──
        async function loadAll() {
            document.getElementById('footer-year').textContent = new Date().getFullYear();
            try {
                const [cRes, sRes, pRes, tRes, bRes] = await Promise.allSettled([
                    fetch(`${API}/content`), fetch(`${API}/services`), fetch(`${API}/portfolio`), fetch(`${API}/team`), fetch(`${API}/blog`)
                ]);
                if (cRes.status === 'fulfilled' && cRes.value.ok) { const d = await cRes.value.json(); const arr = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []); applyContent(arr); }
                if (sRes.status === 'fulfilled' && sRes.value.ok) { const d = await sRes.value.json(); const arr = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []); if (arr.length) renderServices(arr); else document.getElementById('services-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary)">No services added yet.</div>'; }
                if (pRes.status === 'fulfilled' && pRes.value.ok) { const d = await pRes.value.json(); const arr = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []); if (arr.length) renderPortfolio(arr); else document.getElementById('pgrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary)">No projects added yet.</div>'; }
                if (tRes.status === 'fulfilled' && tRes.value.ok) { const d = await tRes.value.json(); const arr = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []); if (arr.length) renderTeam(arr); else document.getElementById('team-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary)">Team coming soon.</div>'; }
                if (bRes.status === 'fulfilled' && bRes.value.ok) { const d = await bRes.value.json(); const arr = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []); if (arr.length) renderBlog(arr); else document.getElementById('blog-grid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary)">Blog posts coming soon.</div>'; }
            } catch (e) { console.error('Load error:', e); }
            initCursorInteractions();
        }
        loadAll();
