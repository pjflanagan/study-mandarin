
// same modes as the flashcards page, plus showing everything
const ModeText = [
  "Show All",
  "汉字 → English",
  "汉字 + pinyin → English",
  "English → 汉字"
]

class ListPage {
  constructor() {
    this.storageKey = '';

    // state
    this.flashcards = [];
    this.knownFlashcards = [];
    this.setName = null;
    this.showKnown = true;

    this.mode = 0;
  }

  async init() {
    $('#list').on('click', '.known-checkbox', (e) => {
      e.stopPropagation();
    });
    $('#list').on('change', '.known-checkbox', (e) => {
      this.toggleKnown($(e.currentTarget).closest('.row'));
    });
    $('#list').on('click', '.row', (e) => {
      $(e.currentTarget).toggleClass('revealed');
    });

    const response = await fetch(getBaseUrl() + 'data/flashcard-sets.json');
    const classSets = await response.json();
    this._buildClassSets(classSets);

    // the set is kept in the hash so a list can be refreshed or linked to
    const setName = decodeURIComponent(window.location.hash.slice(1));
    if (setName) {
      this.chooseSet(setName);
    }
  }

  _buildClassSets(classSets) {
    const container = $('#class-sets');
    for (const [name, maxIndex] of Object.entries(classSets)) {
      const label = name.charAt(0).toUpperCase() + name.slice(1);
      let html = `<p>${label}</p><ul>`;
      for (let i = 1; i <= maxIndex; i++) {
        const unit = `${name}-${i}`;
        html += `<li><a onclick="listPage.chooseSet('class/${name}/${unit}')">${unit}</a></li>`;
      }
      html += '</ul>';
      container.append(html);
    }
  }

  openModal() {
    $('#modal').removeClass('hidden');
  }

  chooseSet(setName) {
    this.setName = setName;
    window.location.hash = setName;
    $('.header-title').text(setName.split('/').pop());
    $('#modal').addClass('hidden');
    this.loadFlashcards();
  }

  async loadFlashcards() {
    // known cards are shared with the flashcards page
    this.storageKey = `flanny-sm-${this.setName}-flashcards`;
    this.knownFlashcards = StorageUtil.load(this.storageKey) || [];
    const allFlashcards = await loadCsv(`data/flashcards/${this.setName}`);
    this.flashcards = allFlashcards.filter(card => card.phrase);
    this.display();
  }

  cycleMode() {
    this.mode = (this.mode + 1) % ModeText.length;
    $('#mode').text(ModeText[this.mode]);
    $('#list').attr('class', `mode-${this.mode}`);
    $('#list .row').removeClass('revealed');
  }

  toggleShowKnown() {
    this.showKnown = !this.showKnown;
    $('#known-toggle').text(this.showKnown ? 'Hide Known' : 'Show Known');
    this.display();
  }

  toggleKnown(row) {
    const phrase = this.flashcards[row.data('index')].phrase;
    if (this.knownFlashcards.includes(phrase)) {
      this.knownFlashcards = this.knownFlashcards.filter(p => p !== phrase);
    } else {
      this.knownFlashcards.push(phrase);
    }
    StorageUtil.save(this.storageKey, this.knownFlashcards);

    const isKnown = this.knownFlashcards.includes(phrase);
    if (isKnown && !this.showKnown) {
      row.remove();
    } else {
      row.toggleClass('known', isKnown);
    }
    this._displayCount();
  }

  _displayCount() {
    const knownCount = this.flashcards.filter(card => this.knownFlashcards.includes(card.phrase)).length;
    $('#count').text(`${this.flashcards.length} cards, ${knownCount} known`);
  }

  display() {
    this._displayCount();
    const list = $('#list');
    list.empty();
    this.flashcards.forEach((card, index) => {
      const isKnown = this.knownFlashcards.includes(card.phrase);
      if (isKnown && !this.showKnown) {
        return;
      }
      const row = $(`<div class="row ${card.color || ''} ${isKnown ? 'known' : ''}" data-index="${index}">
        <div class="hanzi"></div>
        <div class="details">
          <div class="pinyin"></div>
          <div class="english"></div>
        </div>
        <input class="known-checkbox" type="checkbox" ${isKnown ? 'checked' : ''} />
      </div>`);
      row.find('.hanzi').text(card.phrase);
      row.find('.pinyin').text(card.pinyin);
      row.find('.english').text(card.english);
      list.append(row);
    });
  }
}
