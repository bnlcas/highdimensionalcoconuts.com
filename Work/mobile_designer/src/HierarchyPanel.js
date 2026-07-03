// Unity/Blender-style hierarchy panel: an indented tree of the mobile's
// nodes. Click a row to select it (kept in sync with the 3D raycast
// selection); carets collapse subtrees; the title bar minimizes the panel.
// Structural edits live here too: (+) expands a leaf into a sub-mobile,
// (−) collapses a bar back to a leaf. dat.gui stays for slider-shaped data,
// this handles the tree-shaped data.

const SHAPE_GLYPHS = { disc: '●', sphere: '◉', square: '■', triangle: '▲', star: '★' };

export class HierarchyPanel {
  constructor(app) {
    this.app = app;
    this.collapsed = new Set();
    this.minimized = false;

    this.root = document.createElement('div');
    this.root.id = 'hierarchy';

    const header = document.createElement('div');
    header.className = 'hier-title';
    const titleText = document.createElement('span');
    titleText.textContent = 'Hierarchy';
    this.minToggle = document.createElement('span');
    this.minToggle.className = 'hier-min';
    this.minToggle.textContent = '▾';
    header.appendChild(titleText);
    header.appendChild(this.minToggle);
    header.addEventListener('click', () => this._setMinimized(!this.minimized));
    this.root.appendChild(header);

    this.body = document.createElement('div');
    this.root.appendChild(this.body);

    document.body.appendChild(this.root);
    this.render();
  }

  _setMinimized(min) {
    this.minimized = min;
    this.body.style.display = min ? 'none' : '';
    this.minToggle.textContent = min ? '▸' : '▾';
  }

  render() {
    this.body.innerHTML = '';
    this._renderNode(this.app.mobileRoot, 0, '');
  }

  _renderNode(node, depth, slot) {
    const isBar = node.type === 'mobile';
    const row = document.createElement('div');
    row.className = 'hier-row' + (node.id === this.app.selectedNodeId ? ' selected' : '');
    row.style.paddingLeft = (8 + depth * 14) + 'px';

    const caret = document.createElement('span');
    caret.className = 'hier-caret';
    caret.textContent = isBar ? (this.collapsed.has(node.id) ? '▸' : '▾') : ' ';
    if (isBar) {
      caret.addEventListener('click', e => {
        e.stopPropagation();
        if (this.collapsed.has(node.id)) this.collapsed.delete(node.id);
        else this.collapsed.add(node.id);
        this.render();
      });
    }
    row.appendChild(caret);

    const icon = document.createElement('span');
    icon.className = 'hier-icon';
    icon.textContent = isBar ? '━' : (SHAPE_GLYPHS[node.shape] || '●');
    icon.style.color = isBar ? '#999' : node.color;
    row.appendChild(icon);

    const label = document.createElement('span');
    label.className = 'hier-label';
    label.textContent = isBar ? 'Bar' : node.shape;
    row.appendChild(label);

    // Slot tag is always present (empty for the root) so the action button
    // right-aligns consistently.
    const slotTag = document.createElement('span');
    slotTag.className = 'hier-slot';
    slotTag.textContent = slot;
    row.appendChild(slotTag);

    const btn = document.createElement('span');
    btn.className = 'hier-btn';
    if (isBar) {
      btn.textContent = '−';
      btn.title = 'Collapse to leaf';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.app.collapseNode(node.id);
      });
    } else {
      btn.textContent = '+';
      btn.title = 'Expand to sub-mobile';
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.app.expandNode(node.id);
      });
    }
    row.appendChild(btn);

    row.addEventListener('click', () => this.app.selectNode(node.id));
    this.body.appendChild(row);

    if (isBar && !this.collapsed.has(node.id)) {
      this._renderNode(node.left, depth + 1, 'L');
      this._renderNode(node.right, depth + 1, 'R');
    }
  }
}
