
  document.addEventListener('DOMContentLoaded', () => {
    const mainImg = document.getElementById('main-img');
    const thumbnails = document.querySelectorAll('.thumbnails img');
    let currentIndex = 0;
    function updateMainImage() {
      mainImg.src = thumbnails[currentIndex].src;
      thumbnails.forEach((thumb, index) => thumb.classList.toggle('active', index === currentIndex));
    }
    thumbnails.forEach((thumb, index) => {
      thumb.addEventListener('click', (e) => {
        currentIndex = index;
        updateMainImage();
      });
    });
    updateMainImage();

    const sizeBadges = document.querySelectorAll('.size-badge');
    sizeBadges.forEach(badge => {
      badge.addEventListener('click', () => {
        sizeBadges.forEach(b => b.classList.remove('active'));
        badge.classList.add('active');
      });
    });
  });

  (function(){
    const selectors = {
      openBtn: document.getElementById('open-cart'),
      closeBtn: document.getElementById('close-cart'),
      overlay: document.getElementById('overlay'),
      cartDrawer: document.getElementById('cart-drawer'),
      cartItemsWrap: document.getElementById('cart-items'),
      cartCount: document.getElementById('cart-count'),
      cartTotal: document.getElementById('cart-total'),
      checkoutBtn: document.getElementById('checkout'),
    };

    const STORAGE_KEY = 'fashionfuture_cart_v1';
    let cart = []; 
    let lastFocusedElement = null;

    function loadCart(){
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        cart = raw ? JSON.parse(raw) : [];
      } catch (e) { cart = []; }
    }
    function saveCart(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

    function findIndex(id){ return cart.findIndex(it => String(it.id) === String(id)); }

    function addToCart(item){
      const qty = Math.max(1, Math.floor(Number(item.qty) || 1));
      const idx = findIndex(item.id);
      if(idx >= 0){
        cart[idx].qty = (Number(cart[idx].qty) || 0) + qty;
      } else {
        cart.push({
          id: item.id,
          name: item.name || 'Товар',
          price: Number(item.price) || 0,
          img: item.img || '',
          qty: qty
        });
      }
      saveCart();
      renderCart();
    }

    function setQty(id, qty){
      const i = findIndex(id);
      if(i >= 0){
        const n = Math.max(0, Math.floor(Number(qty) || 0));
        if(n === 0){ cart.splice(i,1); } else { cart[i].qty = n; }
        saveCart();
        renderCart();
      }
    }

    function removeItem(id){
      const idx = findIndex(id);
      if(idx >= 0){ cart.splice(idx,1); saveCart(); renderCart(); }
    }

    function countItems(){ return cart.reduce((s, it) => s + Number(it.qty || 0), 0); }
    function totalPrice(){ return cart.reduce((s, it) => s + Number(it.qty || 0) * Number(it.price || 0), 0); }

    function escapeHtml(text){
      return String(text).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
    }

    function renderCart(){
      if(!selectors.cartCount || !selectors.cartTotal || !selectors.cartItemsWrap) return;
      selectors.cartCount.textContent = countItems();
      selectors.cartTotal.textContent = totalPrice().toLocaleString('ru-RU') + ' ₽';
      selectors.cartItemsWrap.innerHTML = '';
      if(cart.length === 0){
        selectors.cartItemsWrap.innerHTML = '<div class="cart-empty">Корзина пуста</div>';
        document.dispatchEvent(new CustomEvent('cart:changed',{detail: JSON.parse(JSON.stringify(cart))}));
        return;
      }
      cart.forEach(item => {
        const el = document.createElement('div');
        el.className = 'cart-item';
        el.dataset.id = item.id;
        el.innerHTML = `
          <img src="${item.img || 'https://via.placeholder.com/64'}" alt="${escapeHtml(item.name)}">
          <div class="meta">
            <h4>${escapeHtml(item.name)}</h4>
            <div class="price">${Number(item.price).toLocaleString('ru-RU')} ₽</div>
            <div class="qty-controls">
              <button class="qty-decr" aria-label="Уменьшить">−</button>
              <input type="number" class="qty-input" min="0" value="${item.qty}">
              <button class="qty-incr" aria-label="Увеличить">+</button>
              <button class="remove" style="margin-left:8px;">Удалить</button>
            </div>
          </div>
        `;
        selectors.cartItemsWrap.appendChild(el);
      });
      document.dispatchEvent(new CustomEvent('cart:changed',{detail: JSON.parse(JSON.stringify(cart))}));
    }

    function openCart(){
      lastFocusedElement = document.activeElement;
      document.body.classList.add('cart-open');
      if(selectors.cartDrawer) selectors.cartDrawer.removeAttribute('hidden');
      if(selectors.overlay) selectors.overlay.removeAttribute('hidden');
      if(selectors.openBtn) selectors.openBtn.setAttribute('aria-expanded','true');
      if(selectors.cartDrawer) selectors.cartDrawer.setAttribute('aria-hidden','false');
      if(selectors.closeBtn) selectors.closeBtn.focus();
      document.addEventListener('keydown', onKeydown);
    }
    function closeCart(){
      document.body.classList.remove('cart-open');
      if(selectors.cartDrawer) selectors.cartDrawer.setAttribute('aria-hidden','true');
      if(selectors.openBtn) selectors.openBtn.setAttribute('aria-expanded','false');
      setTimeout(()=>{
        if(selectors.cartDrawer) selectors.cartDrawer.hidden = true;
        if(selectors.overlay) selectors.overlay.hidden = true;
      }, 250);
      if(lastFocusedElement) lastFocusedElement.focus();
      document.removeEventListener('keydown', onKeydown);
    }
    function onKeydown(e){ if(e.key === 'Escape') closeCart(); }

    function onCartClick(e){
      const btn = e.target;
      const itemEl = btn.closest('.cart-item');
      if(!itemEl) return;
      const id = itemEl.dataset.id;
      if(btn.classList.contains('qty-incr')){
        const input = itemEl.querySelector('.qty-input');
        setQty(id, Number(input.value || 0) + 1);
      } else if(btn.classList.contains('qty-decr')){
        const input = itemEl.querySelector('.qty-input');
        setQty(id, Number(input.value || 0) - 1);
      } else if(btn.classList.contains('remove')){
        removeItem(id);
      }
    }
    function onQtyInput(e){
      const input = e.target;
      if(!input.classList.contains('qty-input')) return;
      const itemEl = input.closest('.cart-item');
      const id = itemEl && itemEl.dataset.id;
      setQty(id, Number(input.value));
    }

    function init(){
      loadCart();
      renderCart();

      if(selectors.openBtn) selectors.openBtn.addEventListener('click', openCart);
      if(selectors.closeBtn) selectors.closeBtn.addEventListener('click', closeCart);
      if(selectors.overlay) selectors.overlay.addEventListener('click', closeCart);
      if(selectors.checkoutBtn) selectors.checkoutBtn.addEventListener('click', function(){ location.href = '/checkout'; });

      if(selectors.cartItemsWrap){
        selectors.cartItemsWrap.addEventListener('click', onCartClick);
        selectors.cartItemsWrap.addEventListener('input', onQtyInput);
      }

      document.addEventListener('cart:add', function(e){
        if(e && e.detail) addToCart(e.detail);
      });

      window.addEventListener('storage', function(e){
        if(e.key === STORAGE_KEY){
          loadCart();
          renderCart();
        }
      });

      window.Cart = {
        add: addToCart,
        setQty: setQty,
        remove: removeItem,
        get: () => JSON.parse(JSON.stringify(cart)),
        clear: function(){ cart = []; saveCart(); renderCart(); }
      };
    }

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('.add-to-cart-btn');
    const productContainer = document.querySelector('.description-section');

    if(!btn || !productContainer) return;

    btn.addEventListener('click', function(e){
      e.preventDefault();

      const selectedSizeEl = document.querySelector('.size-badge.active');
      const size = selectedSizeEl ? selectedSizeEl.textContent.trim() : 'M';

      const idBase = productContainer.dataset.id || String(Date.now());
      const id = idBase + '--' + size;
      const name = (productContainer.dataset.name || productContainer.querySelector('.product-title')?.textContent || 'Товар').trim() + ' (' + size + ')';
      const price = Number(productContainer.dataset.price || productContainer.querySelector('.price')?.textContent?.replace(/\s|₽/g,'') || 0);
      const img = productContainer.dataset.img || document.getElementById('main-img')?.src || '';

      const item = { id, name, price, qty: 1, img };

      if(window.Cart && typeof window.Cart.add === 'function'){
        window.Cart.add(item);
      } else {
        document.dispatchEvent(new CustomEvent('cart:add', { detail: item }));
      }
    });
  });
