"use strict";

/* <=================================== Elements / Variables ===================================> */
const e_mainContainer = document.getElementById('main-container');
const e_cardsContainer = document.getElementById('cards-container');

const e_addCardText = document.getElementById('add-card-text');
const e_addCardButton = document.getElementById('add-card-button');

var cards = []; // All the cards that are currently in the container as Card objects.

/* <=================================== Extensions ===================================> */
Array.prototype.move = function(from, to) {
    /* Move an item from the array to a specific index of the array. */

    this.splice(to, 0, this.splice(from, 1)[0]);
};

Array.prototype.insert = function (index, item) {
    /* Insert an item to a specific index of the array. */

    this.splice( index, 0, item );
};

/* <=================================== Utility Functions ===================================> */
var currentID = 0;
function uniqueID() {
    currentID += 1;
    return currentID.toString();
}

function getMouseOverCard() {
    // The card the mouse cursor is currently over.
    return document.querySelectorAll('.parent-card:hover')[0];
}

function getMouseOverItem() {
    // The task the mouse cursor is currently over.
    return document.querySelectorAll('.parent-card > ul > li:hover')[0];
}

function getItemFromElement(element) {
    /* Get an Item object from a list item element. */

    for (let _card of cards) {
        for (let _item of _card.items) {
            if (_item.id === element.id) {
                return _item;
            }
        }
    }
}

function getCardFromElement(element) {
    /* Get a Card object from a card div element. */

    return cards.find(e => e.id === element.id);
}

function regenerateElements() {
    /* Refreshes the whole cards container. */

    for (let _card of e_cardsContainer.querySelectorAll('.parent-card')) {

        // Remove all the cards from the cards container.
        _card.remove();
    }
    for (let _card of cards) {

        // Regenerate each card.
        let _generated = _card.generateElement();
        // Put them in the container right before the last child (text box for new card).
        e_cardsContainer.insertBefore(_generated, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
        // Update the card for event listeners and etc...
        _card.update();
    }
}

function setHoverStyle(show) {
    /* Sets whether hovering over cards/items changes their colors or not. */

    if (show) {

        // Create a new style element.
        let hoverStyle = document.createElement('style');
        hoverStyle.id = "dragHover";

        // Card and item should turn slightly darker when move over.
        // This gives a visual feedback that makes it easier for the user to know positions during drag and drop.
        hoverStyle.innerHTML = ".parent-card:hover {background-color: #c7cbd1;}.parent-card > ul > li:hover {background-color: #d1d1d1;}";
        document.body.appendChild(hoverStyle);
    } else {

        // Get rid of the style element.
        // This effectively prevents the elements from turning darker on hover.
        let hoverStyle = document.getElementById('dragHover');
        hoverStyle.parentNode.removeChild(hoverStyle);
    }
}

function addCard() {
    let _cardTitle = e_addCardText.value;
    e_addCardText.value = '';

    // If the user pressed the button without typing any name, we'll default to "Untitled Card {card length +1}"
    if (!_cardTitle) _cardTitle = `Untitled Card ${cards.length + 1}`;

    let _card = new Card(_cardTitle, uniqueID());
    cards.push(_card);
    let _newCard = _card.generateElement();

    e_cardsContainer.insertBefore(_newCard, e_cardsContainer.childNodes[e_cardsContainer.childNodes.length - 2]);
}

/* <=================================== Classes ===================================> */
class Item {

    constructor(title, description=null, id, parentCardId) {
        this.title = title;
        this.description = description;  // A field for a future version, perhaps v2
        this.id = id;
        this.isDone = false;
        this.parentCardId = parentCardId;
    }

    getParentCard() {
        return document.getElementById(this.parentCardId);
    }

    check(chk=true) {
        this.isDone = chk;
        if (chk) {

            // Strikethrough the text if clicked on.
            // NOTE02: Might remove this feature as its not really needed.
            document.getElementById(this.id).style.textDecoration = 'line-through';
        } else {

            // Remove the strikethrough from the text.
            document.getElementById(this.id).style.textDecoration = 'none';
        }
    }

    update() {
        let _element = document.getElementById(this.id);

        _element.getElementsByTagName('p')[0].addEventListener('click', () => {
            if (this.isDone) {
                this.check(false);
            } else {
                this.check(true);
            }
        });

        _element.addEventListener('mousedown', cardDrag_startDragging, false);
        this.check(this.isDone);
    }
}

class Card {

    constructor(name, id) {
        this.name = name;
        this.items = [];
        this.id = id;
    }

    addItem(item) {
        this.items.push(item);
        regenerateElements();
    }

    removeItem(item) {
        this.items = this.items.filter(val => val !== item);
        regenerateElements();
    }

    update() {
        for (let _item of this.items) {
            _item.update();
        }
    }

    generateElement() {

        /* The structure of the card element. */

        //  <div class="parent-card">
        //    <span>
        //        <h2 contentEditable="true">
        //            {this.name}
        //        </h2>
        //        <i class="fa fa-bars" aria-hidden="true"></i>
        //    </span>
        //    <ul>
        //        <li><p>{this.items[0]}</p> <span></span>
        //        {more_items...}
        //    </ul>  
        //  </div>

        // This was somewhat of a bad idea...
        // Editing the style of the cards or items are made quite difficult.
        // I should've wrote all this as HTML and put it in the .innerHTML
        // But this gives me more flexibility, so I had to make a choice.

        let _newCardHeader = document.createElement('span');
        let _newCardHeaderTitle = document.createElement('h2');
        _newCardHeaderTitle.contentEditable = true;
        _newCardHeaderTitle.innerText = this.name;
        _newCardHeaderTitle.addEventListener('input', () => this.name = _newCardHeaderTitle.innerText);

        // Hamburger menu icon next to card title to enter card's context menu.
        // *Feature not complete yet.*
        let _newCardHeaderMenu = document.createElement('i');
        _newCardHeaderMenu.ariaHidden = true;
        _newCardHeaderMenu.classList.add("fa", "fa-bars");
        _newCardHeader.append(_newCardHeaderTitle);
        _newCardHeader.append(_newCardHeaderMenu);

        // Input area for typing in the name of new tasks for the card.
        let _newInput = document.createElement('input');
        _newInput.type = 'text';
        _newInput.name = "add-todo-text";
        _newInput.placeholder = "Add Task...";

        // Button next to input to convert the text from the _newInput into an actual item in the card.
        let _newButton = document.createElement('button');
        _newButton.classList.add("plus-button");
        _newButton.innerText = '+';
        _newButton.addEventListener('click', () => {
            let _item = new Item(_newInput.value, null, uniqueID(), this.id);
            this.addItem(_item);
            _newInput.value = '';
        });

        let _newCard = document.createElement('div');
        _newCard.id = this.id;
        _newCard.classList.add('parent-card');
        _newCard.appendChild(_newCardHeader);

        
        if (this.items) {
            // If the card has items in it.

            let _newItemList = document.createElement('ul');
            for (let _item of this.items) {
                let _newItem = document.createElement('li');
                _newItem.id = _item.id;
                
                // Item Title
                let _newItemTitle = document.createElement('p');
                _newItemTitle.innerText = _item.title;

                // Housing for the edit and delete buttons.
                let _newItemButtons = document.createElement('span');

                // Edit button. Allows the user to rename the item.
                let _newItemEditButton = document.createElement('i');
                _newItemEditButton.ariaHidden = true;
                _newItemEditButton.classList.add('fa', 'fa-pencil');
                _newItemEditButton.addEventListener('click', () => {
                    console.log("TODO Edit")
                });

                // Delete button. ALlows the user to delete the item from the card.
                let _newItemDeleteButton = document.createElement('i');
                _newItemDeleteButton.ariaHidden = true;
                _newItemDeleteButton.classList.add('fa', 'fa-trash');
                _newItemDeleteButton.addEventListener('click', () => {
                    this.removeItem(_item);
                });

                // Add both the buttons to the span tag.
                _newItemButtons.appendChild(_newItemEditButton);
                _newItemButtons.appendChild(_newItemDeleteButton);

                // Add the title, span tag to the item and the item itself to the list.
                _newItem.appendChild(_newItemTitle);
                _newItem.appendChild(_newItemButtons);
                _newItemList.appendChild(_newItem);
            }

            // Add the list to the card.
            _newCard.appendChild(_newItemList);
        }

        // Add the input and button to add new item at the end.
        _newCard.appendChild(_newInput);
        _newCard.appendChild(_newButton);

        return _newCard;
    }
}

/* <=================================== Items Drag n' Drop ===================================> */
var cardDrag_mouseDown = false;  // Whether the user has clicked down on a card item.
var cardDrag_mouseDownOn = null;  // The card item that is being held.

const cardDrag_update = (e) => {

    // Only update if the mouse is held down, and on an item element.
    if (!cardDrag_mouseDown && !cardDrag_mouseDownOn) return;

    // The card must be at the same coordinates as the mouse cursor.
    // This simulates the effect of the card being grabbed by the cursor.
    cardDrag_mouseDownOn.style.left = e.pageX + 'px';
    cardDrag_mouseDownOn.style.top = e.pageY + 'px';
}

const cardDrag_startDragging = (e) => {

    // Only grab elements that are list items.
    // Otherwise we'll be able to individually grab child elements of the list item.
    // Which is quite funny but it breaks the code so, nah.
    if (e.target.tagName !== 'LI') return;

    cardDrag_mouseDown = true;
    cardDrag_mouseDownOn = e.target;

    // Set the position of the item to absolute
    // This allows us to take the element out of the document flow and play with its coordinates.
    cardDrag_mouseDownOn.style.position = 'absolute';

    // Enable hover style css, which makes other cards and items darker when hovered over.
    setHoverStyle(true);
};

const cardDrag_stopDragging = (e) => {

    // Only run the stop dragging code if the mouse was previously held down on an item element.
    if (!cardDrag_mouseDown) return;

    // Disable hover style css, which prevents cards and items from getting darker when hovered over.
    setHoverStyle(false);

    let _hoverCard = getMouseOverCard();
    if (_hoverCard) {
        let _hoverItem = getMouseOverItem();

        // Get the object from the card element the mouse is over.
        let _hoverCardObject = getCardFromElement(_hoverCard);
        // Get the object from the item element the mouse is holding.
        let _heldItemObject = getItemFromElement(cardDrag_mouseDownOn);
        
        if (_hoverCard === _heldItemObject.getParentCard()) {
            // If the card the mouse is over is the same as the parent card of the item being held.
            // We only have to deal with vertical drag and drop.
            // Ie: The user is only changing the order of items around.

            if (_hoverItem) {
                // If an item is being hovered over.

                if (_hoverItem !== cardDrag_mouseDownOn) {
                    // As long as the mouse isn't over the item being dragged.
                    // NOTE01: 
                    // This check is in place because there is a chance that the '_hoverItem' ends up being the item being held.
                    // This hasn't actually happened to me yet but I've sort of emulated it, so I know that it could happen under certain circumstances.
                    // I haven't around to fixing this yet primarily because it is extremely rare, and doesn't affect the functioning of the app.

                    let _hoverItemObject = getItemFromElement(_hoverItem);
                    // Move the position of the held item to the position of whichever item was hovered over.
                    // This will push the item that was hovered over down, with the item that was being held taking its place.
                    _hoverCardObject.items.move(_hoverCardObject.items.indexOf(_heldItemObject), _hoverCardObject.items.indexOf(_hoverItemObject));
                }
            }
        } else {
            // If the card the mouse is over is not the same as the parent card of the item being held.
            // The user also gets the the ability to displace an item from the different card.
            // So we'll be dealing with both logic here, ie: Between cards and displacing item if hovered over one.

            if (_hoverItem) {
                // If an item is being hovered over.

                if (_hoverItem !== cardDrag_mouseDownOn) {
                    // As long as the mouse isn't over the item being dragged.
                    // See "NOTE01" above for clarification.

                    let _hoverItemObject = getItemFromElement(_hoverItem);

                    // Get the object of the parent card of the item being hovered over.
                    let _hoverItemParentObject = getCardFromElement(_hoverItemObject.getParentCard());

                    // Insert the held item into the position of the item that was being hovered over.
                    // This will push the item being hovered over down, with the item being held taking its place.
                    _hoverItemParentObject.items.insert(_hoverItemParentObject.items.indexOf(_hoverItemObject), _heldItemObject);

                    // Remove the held item from its original card.
                    getCardFromElement(_heldItemObject.getParentCard()).removeItem(_heldItemObject);
                    // Give the held item a new parent card id.
                    _heldItemObject.parentCardId = _hoverItemParentObject.id;
                }
            } else {
                // If an item wasn't being hovered and instead just the card.

                // Directly push the item being held to the items list of the card being hovered.
                _hoverCardObject.items.push(_heldItemObject);

                // Remove the held item from its original card.
                getCardFromElement(_heldItemObject.getParentCard()).removeItem(_heldItemObject);
                // Give the held item a new parent card id.
                _heldItemObject.parentCardId = _hoverCardObject.id;
            }
        }
        regenerateElements();
    }
    cardDrag_mouseDown = false;
    cardDrag_mouseDownOn.style.position = 'static';
    cardDrag_mouseDownOn = null;
}

// Adding the event listeners.
// NOTE03: It would be a better idea to make a single mouseMove/mouseLeave/mouseUp function
// to handle both the drag scroll and card item dragging.
// It'll save unnecessary processing + less event listeners. 
e_mainContainer.addEventListener('mousemove', cardDrag_update);
e_mainContainer.addEventListener('mouseleave', cardDrag_stopDragging, false);
window.addEventListener('mouseup', cardDrag_stopDragging, false);

/* <=================================== Drag Scrolling ===================================> */
// This feature allows the user to hold and drag the main cards container to scroll instead of holding the scrollbar.
// Inspired by Trello but its really handy.

let scroll_mouseDown = false;
let scroll_startX, scroll_scrollLeft;

const scroll_startDragging = (e) => {
    scroll_mouseDown = true;
    scroll_startX = e.pageX - e_mainContainer.offsetLeft;
    scroll_scrollLeft = e_mainContainer.scrollLeft;
};

const scroll_stopDragging = (e) => {
    scroll_mouseDown = false;
};

const scroll_update = (e) => {
    e.preventDefault();
    if(!scroll_mouseDown || cardDrag_mouseDown) return;

    let _scroll = (e.pageX - e_mainContainer.offsetLeft) - scroll_startX;
    e_mainContainer.scrollLeft = scroll_scrollLeft - _scroll;
}

// Add the event listeners
e_mainContainer.addEventListener('mousemove', scroll_update);
e_mainContainer.addEventListener('mousedown', scroll_startDragging, false);
e_mainContainer.addEventListener('mouseup', scroll_stopDragging, false);
e_mainContainer.addEventListener('mouseleave', scroll_stopDragging, false);

/* <=================================== Other Events ===================================> */
e_addCardButton.addEventListener('click', addCard);