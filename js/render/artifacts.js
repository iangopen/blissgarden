// ══════════════════════════════
// ARTIFACT PANEL
// ══════════════════════════════
window.RenderArtifacts = (() => {
  let _modalEl = null, _bodyEl = null, _backdropEl = null;
  let _isOpen = false;
  let _activeTab = 'artifacts'; // 'artifacts' | 'blueprints'

  function _build() {
    _backdropEl = document.getElementById('artifacts-backdrop');
    _modalEl    = document.getElementById('artifacts-modal');
    _bodyEl     = document.getElementById('artifacts-modal-body');
    if (!_modalEl) return;
    document.getElementById('artifacts-close-btn').addEventListener('click', close);
    _backdropEl.addEventListener('click', close);
    _modalEl.addEventListener('click', e => e.stopPropagation());
  }

  function open() {
    if (!_modalEl) _build();
    if (!_modalEl) return;
    _isOpen = true;
    _backdropEl.style.display = 'block';
    _modalEl.style.display    = 'flex';
    render();
  }

  function close() {
    if (!_modalEl) return;
    _isOpen = false;
    _backdropEl.style.display = 'none';
    _modalEl.style.display    = 'none';
  }

  function _renderTabs(container) {
    const tabs = mk('div');
    tabs.style.cssText = 'display:flex;gap:0;border-bottom:1px solid rgba(0,0,0,.3);flex-shrink:0;background:rgba(0,0,0,.12)';

    [['artifacts', '🏺 Artifacts'], ['blueprints', '📜 Blueprint Shop']].forEach(([id, label]) => {
      const btn = mk('button');
      const active = _activeTab === id;
      btn.style.cssText =
        `flex:1;padding:9px 10px;border:none;cursor:pointer;font-size:12px;font-weight:700;letter-spacing:.3px;` +
        `background:${active ? 'rgba(255,255,255,.1)' : 'transparent'};` +
        `color:${active ? '#f0d080' : 'rgba(255,255,255,.55)'};` +
        `border-bottom:${active ? '2px solid #f0d080' : '2px solid transparent'};` +
        `transition:color .15s,background .15s`;
      btn.textContent = label;
      btn.addEventListener('click', () => { _activeTab = id; render(); });
      tabs.appendChild(btn);
    });

    container.appendChild(tabs);
  }

  function _renderArtifactsTab(container) {
    const craftHeader = mk('div');
    craftHeader.style.cssText = 'padding:10px 16px 6px;font-size:13px;font-weight:700;color:#f0d080';
    craftHeader.textContent = 'Craft Artifacts';
    container.appendChild(craftHeader);

    const grid = mk('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:10px;padding:4px 16px 14px';
    container.appendChild(grid);

    (window.ARTIFACTS || []).forEach(art => {
      const crafted  = !!STATE.artifacts[art.id];
      const inv      = state.craftedInventory || {};
      const bp       = (window.BLUEPRINTS || []).find(b => b.artifactId === art.id);
      const bpUnlocked = !bp || !!STATE.blueprints[bp.id];
      const canCraft = !crafted && bpUnlocked && Object.entries(art.ingredients).every(([k, n]) => (inv[k] || 0) >= n);

      const card = mk('div');
      card.style.cssText =
        `background:${crafted ? 'rgba(180,140,30,.2)' : bpUnlocked ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.15)'};` +
        `border:2px solid ${crafted ? '#c8a820' : bpUnlocked ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.06)'};` +
        `border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:6px`;
      if (typeof Tooltip !== 'undefined') card.dataset.tooltip = Tooltip.artifactTip(art);

      const top = mk('div'); top.style.cssText = 'display:flex;align-items:center;gap:8px';
      const emojiEl = mk('span');
      emojiEl.style.cssText = `font-size:1.7rem;line-height:1;${!bpUnlocked && !crafted ? 'filter:grayscale(1);opacity:.4' : ''}`;
      emojiEl.textContent = art.emoji;
      const nameEl  = mk('div');
      nameEl.style.cssText  = `font-weight:700;font-size:13px;color:${bpUnlocked || crafted ? '#fff' : 'rgba(255,255,255,.4)'};line-height:1.3`;
      nameEl.textContent = art.name;
      top.appendChild(emojiEl); top.appendChild(nameEl);
      card.appendChild(top);

      const descEl = mk('div');
      descEl.style.cssText = `font-size:11px;color:${bpUnlocked || crafted ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)'};line-height:1.4`;
      descEl.textContent = art.desc;
      card.appendChild(descEl);

      if (!bpUnlocked && !crafted) {
        const lockEl = mk('div');
        lockEl.style.cssText = 'font-size:11px;color:rgba(255,200,80,.75);margin-top:2px';
        const hint = bp && bp.source === 'achievement'
          ? `Unlock via achievement: ${(window.ACHIEVEMENTS || []).find(a => a.id === bp.achievementId)?.name ?? bp.achievementId}`
          : `Buy in Blueprint Shop`;
        lockEl.textContent = `🔒 Blueprint required — ${hint}`;
        card.appendChild(lockEl);
      } else if (!crafted) {
        const ingList = mk('div'); ingList.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px';
        Object.entries(art.ingredients).forEach(([k, needed]) => {
          const have   = inv[k] || 0;
          const met    = have >= needed;
          const recipe = (window.RECIPES || []).find(r => r.id === k);
          const tag = mk('span');
          tag.style.cssText =
            `font-size:10px;padding:2px 5px;border-radius:3px;white-space:nowrap;` +
            `background:${met ? 'rgba(80,150,60,.4)' : 'rgba(200,70,40,.35)'};` +
            `color:${met ? '#9ef09e' : '#ffaa90'}`;
          tag.textContent = `${recipe ? recipe.emoji + ' ' : ''}${recipe ? recipe.name : k}: ${have}/${needed}`;
          ingList.appendChild(tag);
        });
        card.appendChild(ingList);
      }

      if (crafted) {
        const badge = mk('div');
        badge.style.cssText = 'font-size:11px;font-weight:700;color:#c8a820;padding:2px 0;text-align:center';
        badge.textContent = '✅ Active';
        card.appendChild(badge);
      } else if (bpUnlocked) {
        const btn = mk('button', 'ug-btn');
        btn.textContent = canCraft ? 'Craft' : 'Need more';
        btn.disabled    = !canCraft;
        btn.style.cssText = `width:100%;margin-top:2px${canCraft ? ';background:#5A8A3C' : ''}`;
        btn.addEventListener('click', () => {
          craftArtifact(art.id);
          render();
          if (typeof RenderPanel !== 'undefined') RenderPanel.renderInventory();
        });
        card.appendChild(btn);
      }

      grid.appendChild(card);
    });

    const activeArts = (window.ARTIFACTS || []).filter(a => STATE.artifacts[a.id]);
    if (activeArts.length > 0) {
      const activeHeader = mk('div');
      activeHeader.style.cssText = 'padding:8px 16px 6px;font-size:13px;font-weight:700;color:#8de88d;border-top:1px solid rgba(255,255,255,.1)';
      activeHeader.textContent = 'Active Artifacts';
      container.appendChild(activeHeader);

      const list = mk('div'); list.style.cssText = 'padding:2px 16px 14px;display:flex;flex-direction:column;gap:5px';
      activeArts.forEach(art => {
        const row = mk('div'); row.style.cssText = 'display:flex;align-items:center;gap:8px;font-size:12px';
        const em = mk('span'); em.style.cssText = 'font-size:1.2rem;line-height:1'; em.textContent = art.emoji;
        const info = mk('div');
        info.innerHTML = `<span style="font-weight:700;color:#fff">${art.name}</span> <span style="color:rgba(255,255,255,.6)">— ${art.desc}</span>`;
        row.appendChild(em); row.appendChild(info);
        list.appendChild(row);
      });
      container.appendChild(list);
    }
  }

  function _renderBlueprintsTab(container) {
    if (!STATE.blueprints) STATE.blueprints = {};

    const shopBps  = (window.BLUEPRINTS || []).filter(b => b.source === 'shop');
    const achBps   = (window.BLUEPRINTS || []).filter(b => b.source === 'achievement');

    // ── Shop blueprints ──────────────────────────────────────────────────────
    const shopHeader = mk('div');
    shopHeader.style.cssText = 'padding:12px 16px 6px;font-size:13px;font-weight:700;color:#f0d080';
    shopHeader.textContent = 'Purchase Blueprints';
    container.appendChild(shopHeader);

    const shopList = mk('div'); shopList.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:2px 16px 14px';
    shopBps.forEach(bp => {
      const owned = !!STATE.blueprints[bp.id];
      const canAfford = state.coins >= bp.cost;
      const art = (window.ARTIFACTS || []).find(a => a.id === bp.artifactId);

      const row = mk('div');
      row.style.cssText =
        `display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;` +
        `background:${owned ? 'rgba(180,140,30,.18)' : 'rgba(255,255,255,.06)'};` +
        `border:1px solid ${owned ? '#c8a820' : 'rgba(255,255,255,.1)'}`;

      const emojiEl = mk('span'); emojiEl.style.cssText = 'font-size:1.4rem;line-height:1;flex-shrink:0';
      emojiEl.textContent = art ? art.emoji : '📜';

      const info = mk('div'); info.style.cssText = 'flex:1;min-width:0';
      const nameEl = mk('div'); nameEl.style.cssText = 'font-size:12px;font-weight:700;color:#fff'; nameEl.textContent = bp.name;
      if (art) {
        const descEl = mk('div'); descEl.style.cssText = 'font-size:10px;color:rgba(255,255,255,.55);margin-top:1px'; descEl.textContent = art.desc;
        info.appendChild(nameEl); info.appendChild(descEl);
      } else {
        info.appendChild(nameEl);
      }

      if (owned) {
        const badge = mk('span');
        badge.style.cssText = 'font-size:10px;font-weight:700;color:#c8a820;white-space:nowrap;flex-shrink:0;padding:2px 7px;background:rgba(200,168,32,.15);border-radius:4px';
        badge.textContent = '✅ Owned';
        row.appendChild(emojiEl); row.appendChild(info); row.appendChild(badge);
      } else {
        const btn = mk('button', 'ug-btn');
        btn.style.cssText = `flex-shrink:0;font-size:11px;padding:4px 10px;${canAfford ? 'background:#5A8A3C' : ''}`;
        btn.disabled = !canAfford;
        btn.innerHTML = `${coinHTML()} ${formatNumber(bp.cost)}`;
        btn.addEventListener('click', () => {
          purchaseBlueprint(bp.id);
          render();
        });
        row.appendChild(emojiEl); row.appendChild(info); row.appendChild(btn);
      }

      shopList.appendChild(row);
    });
    container.appendChild(shopList);

    // ── Achievement blueprints ───────────────────────────────────────────────
    if (achBps.length > 0) {
      const achHeader = mk('div');
      achHeader.style.cssText = 'padding:6px 16px 6px;font-size:13px;font-weight:700;color:#8de88d;border-top:1px solid rgba(255,255,255,.08)';
      achHeader.textContent = 'Achievement Blueprints';
      container.appendChild(achHeader);

      const achList = mk('div'); achList.style.cssText = 'display:flex;flex-direction:column;gap:6px;padding:2px 16px 14px';
      achBps.forEach(bp => {
        const owned = !!STATE.blueprints[bp.id];
        const art   = (window.ARTIFACTS || []).find(a => a.id === bp.artifactId);
        const ach   = (window.ACHIEVEMENTS || []).find(a => a.id === bp.achievementId);

        const row = mk('div');
        row.style.cssText =
          `display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:7px;` +
          `background:${owned ? 'rgba(100,180,60,.15)' : 'rgba(255,255,255,.04)'};` +
          `border:1px solid ${owned ? '#6ec46e' : 'rgba(255,255,255,.08)'}`;

        const emojiEl = mk('span'); emojiEl.style.cssText = 'font-size:1.4rem;line-height:1;flex-shrink:0';
        emojiEl.textContent = art ? art.emoji : '📜';

        const info = mk('div'); info.style.cssText = 'flex:1;min-width:0';
        const nameEl = mk('div'); nameEl.style.cssText = 'font-size:12px;font-weight:700;color:#fff'; nameEl.textContent = bp.name;
        const unlockEl = mk('div');
        unlockEl.style.cssText = 'font-size:10px;color:rgba(180,255,180,.6);margin-top:1px';
        unlockEl.textContent = owned ? 'Unlocked via achievement' : `Unlock via: ${ach ? ach.name : bp.achievementId}`;
        info.appendChild(nameEl); info.appendChild(unlockEl);

        const status = mk('span');
        status.style.cssText = `font-size:10px;font-weight:700;flex-shrink:0;padding:2px 7px;border-radius:4px;white-space:nowrap;` +
          (owned ? 'color:#6ec46e;background:rgba(100,180,60,.15)' : 'color:rgba(255,255,255,.35);background:rgba(255,255,255,.06)');
        status.textContent = owned ? '✅ Owned' : '🔒 Locked';

        row.appendChild(emojiEl); row.appendChild(info); row.appendChild(status);
        achList.appendChild(row);
      });
      container.appendChild(achList);
    }
  }

  function render() {
    if (!_bodyEl || !_isOpen) return;
    _bodyEl.innerHTML = '';

    if (!STATE.upgrades.workshop) {
      const msg = mk('div');
      msg.style.cssText = 'padding:28px 20px;text-align:center;color:rgba(255,255,255,.7)';
      msg.innerHTML =
        '<div style="font-size:2.2rem;margin-bottom:10px">🔨</div>' +
        '<div style="font-size:13px;font-weight:600;color:#fff">Purchase the Workshop Area upgrade to unlock artifacts.</div>' +
        `<div style="margin-top:8px;font-size:12px;color:#f0d080">${coinHTML()}5,000 — available in Upgrades</div>`;
      _bodyEl.appendChild(msg);
      return;
    }

    _renderTabs(_bodyEl);

    if (_activeTab === 'artifacts') {
      _renderArtifactsTab(_bodyEl);
    } else {
      _renderBlueprintsTab(_bodyEl);
    }
  }

  function isOpen() { return _isOpen; }

  return { open, close, render, isOpen };
})();
