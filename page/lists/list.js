
class ListPage {
  constructor() {
    // state
    this.flashcards = [];
    this.knownFlashcards = [];
    this.setName = null;
    this.showKnown = true;
  }

  async init() {
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
    this.knownFlashcards = StorageUtil.load(`flanny-sm-${this.setName}-flashcards`) || [];
    const allFlashcards = await loadCsv(`data/flashcards/${this.setName}`);
    this.flashcards = allFlashcards.filter(card => card.phrase);
    this.display();
  }

  toggleShowKnown() {
    this.showKnown = !this.showKnown;
    $('#known-toggle').text(this.showKnown ? 'Hide Known' : 'Show Known');
    this.display();
  }

  display() {
    const cards = this.showKnown
      ? this.flashcards
      : this.flashcards.filter(card => !this.knownFlashcards.includes(card.phrase));

    $('#count').text(`${cards.length} cards`);
    const list = $('#list');
    list.empty();
    for (const card of cards) {
      const known = this.knownFlashcards.includes(card.phrase) ? 'known' : '';
      const row = $(`<div class="row ${card.color || ''} ${known}">
        <div class="hanzi"></div>
        <div class="details">
          <div class="pinyin"></div>
          <div class="english"></div>
        </div>
      </div>`);
      row.find('.hanzi').text(card.phrase);
      row.find('.pinyin').text(card.pinyin);
      row.find('.english').text(card.english);
      list.append(row);
    }
  }
}
